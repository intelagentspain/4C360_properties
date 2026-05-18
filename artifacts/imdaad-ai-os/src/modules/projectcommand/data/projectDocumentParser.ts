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

  if (compact.startsWith('FEFF')) {
    let output = '';
    for (let index = 2; index < bytes.length - 1; index += 2) {
      output += String.fromCharCode((bytes[index] << 8) | bytes[index + 1]);
    }
    return output;
  }

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

function stripPdfStreams(value: string) {
  return value.replace(/stream\r?\n?[\s\S]*?\r?\n?endstream/g, ' ');
}

function textQuality(value: string) {
  if (!value) return 0;
  const letters = (value.match(/[A-Za-z0-9]/g) ?? []).length;
  const controls = (value.match(/[\u0000-\u0008\u000B\u000E-\u001F\u007F-\u009F]/g) ?? []).length;
  return letters / Math.max(1, value.length) - controls / Math.max(1, value.length);
}

function cleanPdfText(value: string) {
  return cleanText(
    value
      .replace(/\u0000/g, ' ')
      .replace(/\u200B/g, '')
      .replace(/●/g, '\n- ')
      .replace(/\s+([,.;:])/g, '$1')
      .replace(/\s{2,}/g, ' '),
  );
}

function decodeCMapUnicode(hex: string) {
  const compact = hex.replace(/\s+/g, '').replace(/^FEFF/i, '');
  let output = '';
  for (let index = 0; index + 3 < compact.length; index += 4) {
    const code = Number.parseInt(compact.slice(index, index + 4), 16);
    if (!Number.isNaN(code)) output += String.fromCharCode(code);
  }
  return output;
}

function parseToUnicodeCMap(value: string) {
  const map = new Map<number, string>();

  for (const block of value.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
    for (const match of block[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)) {
      map.set(Number.parseInt(match[1], 16), decodeCMapUnicode(match[2]));
    }
  }

  for (const block of value.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
    for (const match of block[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)) {
      const start = Number.parseInt(match[1], 16);
      const end = Number.parseInt(match[2], 16);
      const base = Number.parseInt(match[3], 16);
      for (let code = start; code <= end; code += 1) {
        map.set(code, String.fromCharCode(base + code - start));
      }
    }
  }

  return map;
}

function decodePdfCodedHex(hex: string, cmap: Map<number, string>) {
  const compact = hex.replace(/\s+/g, '');
  const parts: string[] = [];
  for (let index = 0; index + 3 < compact.length; index += 4) {
    const code = Number.parseInt(compact.slice(index, index + 4), 16);
    if (Number.isNaN(code)) continue;
    parts.push(cmap.get(code) ?? '');
  }
  return parts.join('');
}

function extractPdfTextWithCMap(streams: string[]) {
  const cmap = new Map<number, string>();
  for (const stream of streams) {
    if (!stream.includes('begincmap')) continue;
    for (const [code, value] of parseToUnicodeCMap(stream)) {
      cmap.set(code, value);
    }
  }
  if (!cmap.size) return '';

  const pages: string[] = [];
  for (const stream of streams) {
    if (stream.includes('begincmap') || (!stream.includes(' Tj') && !stream.includes(' TJ'))) continue;
    const parts: string[] = [];

    for (const match of stream.matchAll(/<([0-9A-Fa-f\s]+)>\s*Tj/g)) {
      parts.push(decodePdfCodedHex(match[1], cmap));
    }

    for (const match of stream.matchAll(/\[((?:.|\n|\r)*?)\]\s*TJ/g)) {
      for (const hex of match[1].matchAll(/<([0-9A-Fa-f\s]+)>/g)) {
        parts.push(decodePdfCodedHex(hex[1], cmap));
      }
    }

    const page = cleanPdfText(parts.join(''));
    if (page && textQuality(page) > 0.25) pages.push(page);
  }

  return cleanPdfText(pages.join('\n'));
}

function asciiBytes(value: string) {
  return new Uint8Array([...value].map(char => char.charCodeAt(0)));
}

function findByteSequence(bytes: Uint8Array, needle: Uint8Array, from = 0) {
  for (let index = from; index <= bytes.length - needle.length; index += 1) {
    let matches = true;
    for (let offset = 0; offset < needle.length; offset += 1) {
      if (bytes[index + offset] !== needle[offset]) {
        matches = false;
        break;
      }
    }
    if (matches) return index;
  }
  return -1;
}

function decodeAscii85(bytes: Uint8Array) {
  const output: number[] = [];
  let tuple: number[] = [];

  const flushTuple = (padded = false) => {
    const originalLength = tuple.length;
    if (originalLength === 1) throw new Error('Invalid ASCII85 tuple.');
    while (tuple.length < 5) tuple.push(84);

    let value = 0;
    for (const digit of tuple) value = value * 85 + digit;

    const decoded = [
      (value >>> 24) & 0xff,
      (value >>> 16) & 0xff,
      (value >>> 8) & 0xff,
      value & 0xff,
    ];
    output.push(...decoded.slice(0, padded ? originalLength - 1 : 4));
    tuple = [];
  };

  for (const byte of bytes) {
    if (byte === 0x7e) break;
    if (byte === 0x00 || byte === 0x09 || byte === 0x0a || byte === 0x0c || byte === 0x0d || byte === 0x20) continue;
    if (byte === 0x7a && tuple.length === 0) {
      output.push(0, 0, 0, 0);
      continue;
    }
    if (byte < 0x21 || byte > 0x75) throw new Error('Invalid ASCII85 byte.');
    tuple.push(byte - 0x21);
    if (tuple.length === 5) flushTuple();
  }

  if (tuple.length > 0) flushTuple(true);
  return new Uint8Array(output);
}

async function inflatePdfStreams(bytes: Uint8Array) {
  const streamMarker = asciiBytes('stream');
  const endMarker = asciiBytes('endstream');
  const streams: string[] = [];
  let position = 0;

  while (position < bytes.length) {
    const streamIndex = findByteSequence(bytes, streamMarker, position);
    if (streamIndex < 0) break;

    let start = streamIndex + streamMarker.length;
    if (bytes[start] === 0x0d && bytes[start + 1] === 0x0a) start += 2;
    else if (bytes[start] === 0x0a || bytes[start] === 0x0d) start += 1;

    const end = findByteSequence(bytes, endMarker, start);
    if (end < 0) break;

    let payloadEnd = end;
    while (payloadEnd > start && (bytes[payloadEnd - 1] === 0x0a || bytes[payloadEnd - 1] === 0x0d)) {
      payloadEnd -= 1;
    }

    try {
      const inflated = await inflateRaw(bytes.slice(start, payloadEnd));
      streams.push(latinDecoder.decode(inflated));
    } catch {
      try {
        const decoded = decodeAscii85(bytes.slice(start, payloadEnd));
        const inflated = await inflateRaw(decoded);
        streams.push(latinDecoder.decode(inflated));
      } catch {
        // Non-text or binary-only streams are ignored by the text intake.
      }
    }

    position = end + endMarker.length;
  }

  return streams;
}

async function parsePdf(bytes: Uint8Array) {
  const raw = latinDecoder.decode(bytes);
  const metadataText = extractPdfTextFromString(stripPdfStreams(raw));
  const streams = await inflatePdfStreams(bytes);

  const cmapText = extractPdfTextWithCMap(streams);
  const literalStreamText = streams.map(stream => extractPdfTextFromString(stream)).filter(text => textQuality(text) > 0.25).join('\n');
  const bestText = cmapText.length >= literalStreamText.length ? cmapText : literalStreamText;
  return cleanPdfText([metadataText, bestText].filter(Boolean).join('\n'));
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
    if (text.length < 80) warning = 'PDF text layer was limited or scanned. Add pasted text or upload a text-readable PDF/DOCX if OCR is needed.';
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
