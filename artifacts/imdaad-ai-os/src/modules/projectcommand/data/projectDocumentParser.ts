export interface ParsedProjectDocument {
  fileName: string;
  fileType: string;
  text: string;
  method: 'docx' | 'xlsx' | 'pdf' | 'text' | 'legacy-doc' | 'unsupported';
  warning?: string;
}

interface ZipEntry {
  name: string;
  compression: number;
  compressedSize: number;
  localHeaderOffset: number;
}

const textDecoder = new TextDecoder('utf-8');
const latinDecoder = new TextDecoder('latin1');

function extensionOf(fileName: string) {
  const match = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? '';
}

function cleanText(value: string) {
  return value
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[^\S\n]+$/gm, '')
    .trim();
}

function xmlToText(xml: string) {
  return cleanText(
    xml
      .replace(/<[^>]*(?:br|tab)[^>]*>/gi, ' ')
      .replace(/<\/(?:w:p|a:p|p|row|c|v|si|sst)>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'"),
  );
}

function readUint16(view: DataView, offset: number) {
  return view.getUint16(offset, true);
}

function readUint32(view: DataView, offset: number) {
  return view.getUint32(offset, true);
}

function findEndOfCentralDirectory(bytes: Uint8Array) {
  for (let offset = bytes.length - 22; offset >= Math.max(0, bytes.length - 66_000); offset -= 1) {
    if (
      bytes[offset] === 0x50 &&
      bytes[offset + 1] === 0x4b &&
      bytes[offset + 2] === 0x05 &&
      bytes[offset + 3] === 0x06
    ) {
      return offset;
    }
  }
  return -1;
}

function listZipEntries(bytes: Uint8Array): ZipEntry[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const eocdOffset = findEndOfCentralDirectory(bytes);
  if (eocdOffset < 0) return [];

  const totalEntries = readUint16(view, eocdOffset + 10);
  const centralOffset = readUint32(view, eocdOffset + 16);
  const entries: ZipEntry[] = [];
  let offset = centralOffset;

  for (let index = 0; index < totalEntries; index += 1) {
    if (readUint32(view, offset) !== 0x02014b50) break;
    const compression = readUint16(view, offset + 10);
    const compressedSize = readUint32(view, offset + 20);
    const nameLength = readUint16(view, offset + 28);
    const extraLength = readUint16(view, offset + 30);
    const commentLength = readUint16(view, offset + 32);
    const localHeaderOffset = readUint32(view, offset + 42);
    const nameBytes = bytes.slice(offset + 46, offset + 46 + nameLength);
    const name = textDecoder.decode(nameBytes).replace(/\\/g, '/');
    entries.push({ name, compression, compressedSize, localHeaderOffset });
    offset += 46 + nameLength + extraLength + commentLength;
  }

  return entries;
}

async function inflateRaw(bytes: Uint8Array) {
  const StreamCtor = (globalThis as typeof globalThis & {
    DecompressionStream?: new (format: 'deflate' | 'deflate-raw' | 'gzip') => DecompressionStream;
  }).DecompressionStream;

  if (!StreamCtor) {
    throw new Error('Browser decompression support is not available.');
  }

  const tryInflate = async (format: 'deflate' | 'deflate-raw') => {
    const body = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const stream = new Blob([body]).stream().pipeThrough(new StreamCtor(format));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  };

  try {
    return await tryInflate('deflate-raw');
  } catch {
    return tryInflate('deflate');
  }
}

async function readZipEntry(bytes: Uint8Array, entry: ZipEntry) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const localOffset = entry.localHeaderOffset;
  if (readUint32(view, localOffset) !== 0x04034b50) {
    throw new Error(`Invalid ZIP local header for ${entry.name}.`);
  }
  const nameLength = readUint16(view, localOffset + 26);
  const extraLength = readUint16(view, localOffset + 28);
  const dataOffset = localOffset + 30 + nameLength + extraLength;
  const payload = bytes.slice(dataOffset, dataOffset + entry.compressedSize);

  if (entry.compression === 0) return payload;
  if (entry.compression === 8) return inflateRaw(payload);
  throw new Error(`Unsupported ZIP compression method ${entry.compression} for ${entry.name}.`);
}

async function extractZipTexts(bytes: Uint8Array, predicate: (name: string) => boolean) {
  const entries = listZipEntries(bytes).filter(entry => predicate(entry.name));
  const texts: string[] = [];

  for (const entry of entries) {
    try {
      const content = await readZipEntry(bytes, entry);
      const text = xmlToText(textDecoder.decode(content));
      if (text) texts.push(text);
    } catch {
      // Keep parsing the remaining files. A single unsupported relationship or sheet should not fail the whole intake.
    }
  }

  return cleanText(texts.join('\n\n'));
}

async function parseDocx(bytes: Uint8Array) {
  return extractZipTexts(bytes, name =>
    name === 'word/document.xml' ||
    /^word\/(header|footer)\d+\.xml$/.test(name) ||
    name === 'word/footnotes.xml' ||
    name === 'word/endnotes.xml',
  );
}

async function parseXlsx(bytes: Uint8Array) {
  return extractZipTexts(bytes, name =>
    name === 'xl/sharedStrings.xml' ||
    /^xl\/worksheets\/sheet\d+\.xml$/.test(name),
  );
}

function decodePdfLiteral(input: string) {
  return input
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\n')
    .replace(/\\t/g, ' ')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\');
}

function decodePdfHex(hex: string) {
  const compact = hex.replace(/\s+/g, '');
  if (compact.length < 4 || compact.length % 2 !== 0) return '';
  const bytes: number[] = [];
  for (let index = 0; index < compact.length; index += 2) {
    bytes.push(Number.parseInt(compact.slice(index, index + 2), 16));
  }
  if (bytes.some(Number.isNaN)) return '';

  const hasUtf16Pattern = bytes.length > 4 && bytes.filter((byte, index) => index % 2 === 0 && byte === 0).length > bytes.length / 4;
  if (hasUtf16Pattern) {
    let output = '';
    for (let index = 0; index < bytes.length - 1; index += 2) {
      output += String.fromCharCode((bytes[index] << 8) | bytes[index + 1]);
    }
    return output;
  }

  return latinDecoder.decode(new Uint8Array(bytes));
}

function extractPdfTextFromString(value: string) {
  const parts: string[] = [];
  const literalPattern = /\((?:\\.|[^\\()]){2,}\)/g;
  const hexPattern = /<([0-9a-fA-F\s]{8,})>/g;

  for (const match of value.matchAll(literalPattern)) {
    const content = match[0].slice(1, -1);
    const decoded = decodePdfLiteral(content);
    if (/[A-Za-z0-9]/.test(decoded)) parts.push(decoded);
  }

  for (const match of value.matchAll(hexPattern)) {
    const decoded = decodePdfHex(match[1]);
    if (/[A-Za-z0-9]/.test(decoded)) parts.push(decoded);
  }

  return cleanText(parts.join(' '));
}

async function parsePdf(bytes: Uint8Array) {
  const raw = latinDecoder.decode(bytes);
  const texts = [extractPdfTextFromString(raw)];
  const streamPattern = /<<(?:.|\n|\r)*?\/FlateDecode(?:.|\n|\r)*?>>\s*stream\r?\n?([\s\S]*?)\r?\n?endstream/g;

  for (const match of raw.matchAll(streamPattern)) {
    const binary = match[1];
    const payload = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      payload[index] = binary.charCodeAt(index) & 0xff;
    }
    try {
      const inflated = await inflateRaw(payload);
      texts.push(extractPdfTextFromString(latinDecoder.decode(inflated)));
    } catch {
      // Some PDFs use filters or encodings this lightweight parser cannot decompress.
    }
  }

  return cleanText(texts.join('\n\n'));
}

function parseLegacyBinaryText(bytes: Uint8Array) {
  const text = latinDecoder.decode(bytes);
  return cleanText(text.replace(/[^\x20-\x7e\n\r\t]+/g, ' '));
}

export async function parseProjectDocumentFile(file: File): Promise<ParsedProjectDocument> {
  const extension = extensionOf(file.name);
  const bytes = new Uint8Array(await file.arrayBuffer());
  let method: ParsedProjectDocument['method'] = 'unsupported';
  let text = '';
  let warning: string | undefined;

  if (extension === 'docx') {
    method = 'docx';
    text = await parseDocx(bytes);
  } else if (extension === 'xlsx' || extension === 'xls') {
    method = extension === 'xlsx' ? 'xlsx' : 'legacy-doc';
    text = extension === 'xlsx' ? await parseXlsx(bytes) : parseLegacyBinaryText(bytes);
    if (extension === 'xls') warning = 'Legacy XLS parsing is limited. Use XLSX for stronger extraction.';
  } else if (extension === 'pdf') {
    method = 'pdf';
    text = await parsePdf(bytes);
    if (text.length < 80) warning = 'PDF text layer was limited or scanned. Add pasted text or use the Sobha sample if OCR is needed.';
  } else if (extension === 'doc') {
    method = 'legacy-doc';
    text = parseLegacyBinaryText(bytes);
    warning = 'Legacy DOC parsing is limited. Use DOCX for stronger extraction.';
  } else {
    method = 'text';
    text = cleanText(textDecoder.decode(bytes));
  }

  return {
    fileName: file.name,
    fileType: file.type || extension || 'unknown',
    text,
    method,
    warning: warning ?? (text.length < 80 ? 'Only limited readable text was found in this file.' : undefined),
  };
}
