import {
  projectCommandDatasets,
  projectCommandOrganizations,
  projectCommandPortfolios,
  projectCommandProperties,
  type ProjectCommandDataset,
  type ProjectCommandProject,
  type ProjectCommandAIContent,
  type ProjectCostSeries,
  type ProjectEvmSummary,
  type ProjectMilestones,
} from './portfolio';
import type { Phase } from './phases';
import type { Risk } from './risks';
import { sampleSobhaPilotExtraction, type ExtractedProjectContext } from './projectExtractionDemoData';

export interface ProjectContextInput {
  fileName?: string;
  documentText?: string;
  parserMethod?: string;
  parserWarning?: string;
  pastedText?: string;
  useSample?: boolean;
  manual?: boolean;
}

export interface GeneratedProjectControlBaseline {
  sourceName: string;
  workPackagesCreated: number;
  programmePhasesCreated: number;
  stageGatesCreated: number;
  vendorsMapped: number;
  risksSeeded: number;
  evidenceRequirementsAdded: number;
  budgetBaselineLabel: string;
  readinessScore: number;
  topThreat: string;
  programmePhases: string[];
  stageGates: string[];
  forecastModel: string;
  initialManagerActions: string[];
}

function cloneSampleExtraction() {
  return JSON.parse(JSON.stringify(sampleSobhaPilotExtraction)) as ExtractedProjectContext;
}

function cleanSourceText(value: string) {
  return value.replace(/\r/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

function confidenceStatus(confidence: number) {
  if (confidence >= 90) return 'high' as const;
  if (confidence >= 78) return 'medium' as const;
  return 'needs-confirmation' as const;
}

function makeField<T>(value: T, detected: boolean, confidence = detected ? 88 : 68) {
  return { value, confidence, status: confidenceStatus(confidence) };
}

function firstMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const value = match?.[1]?.trim();
    if (value) return value.replace(/\s+/g, ' ').replace(/[.;,]$/, '');
  }
  return '';
}

function findNumber(text: string, patterns: RegExp[]) {
  const match = firstMatch(text, patterns);
  if (!match) return null;
  const value = Number.parseInt(match.replace(/[^\d]/g, ''), 10);
  return Number.isFinite(value) ? value : null;
}

function findMoney(text: string) {
  const patterns = [
    /(?:contract value|approved budget|budget|contract sum|award value)\D{0,32}(?:AED|Dhs|د\.إ)?\s*([\d,.]+)\s*(bn|billion|m|million)?/i,
    /(?:AED|Dhs|د\.إ)\s*([\d,.]+)\s*(bn|billion|m|million)?/i,
  ];
  const amountMatch = patterns.map(pattern => text.match(pattern)).find(Boolean);
  if (!amountMatch?.[1]) return null;
  const base = Number.parseFloat(amountMatch[1].replace(/,/g, ''));
  if (!Number.isFinite(base)) return null;
  const suffix = amountMatch[2]?.toLowerCase();
  if (suffix === 'bn' || suffix === 'billion') return Math.round(base * 1_000_000_000);
  if (suffix === 'm' || suffix === 'million') return Math.round(base * 1_000_000);
  return Math.round(base);
}

const MONTHS: Record<string, string> = {
  jan: '01',
  january: '01',
  feb: '02',
  february: '02',
  mar: '03',
  march: '03',
  apr: '04',
  april: '04',
  may: '05',
  jun: '06',
  june: '06',
  jul: '07',
  july: '07',
  aug: '08',
  august: '08',
  sep: '09',
  september: '09',
  oct: '10',
  october: '10',
  nov: '11',
  november: '11',
  dec: '12',
  december: '12',
};

function normalizeDate(value: string) {
  const iso = value.match(/(20\d{2})[-/](\d{1,2})[-/](\d{1,2})/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;

  const named = value.match(/(\d{1,2})\s+([A-Za-z]+)\s+(20\d{2})/);
  if (named) {
    const month = MONTHS[named[2].toLowerCase()];
    if (month) return `${named[3]}-${month}-${named[1].padStart(2, '0')}`;
  }

  const namedUs = value.match(/([A-Za-z]+)\s+(\d{1,2}),?\s+(20\d{2})/);
  if (namedUs) {
    const month = MONTHS[namedUs[1].toLowerCase()];
    if (month) return `${namedUs[3]}-${month}-${namedUs[2].padStart(2, '0')}`;
  }

  return '';
}

function findDate(text: string) {
  const raw = firstMatch(text, [
    /(?:target handover|handover date|completion date|practical completion|handover)\D{0,28}((?:\d{1,2}\s+[A-Za-z]+\s+20\d{2})|(?:[A-Za-z]+\s+\d{1,2},?\s+20\d{2})|(?:20\d{2}[-/]\d{1,2}[-/]\d{1,2}))/i,
  ]);
  return raw ? normalizeDate(raw) : '';
}

function excerpt(text: string, term: string) {
  const index = text.toLowerCase().indexOf(term.toLowerCase());
  if (index < 0) return text.slice(0, 150).replace(/\s+/g, ' ');
  return text.slice(Math.max(0, index - 55), Math.min(text.length, index + 155)).replace(/\s+/g, ' ').trim();
}

function detectItems(text: string, terms: string[]) {
  const lower = text.toLowerCase();
  return terms.filter(term => lower.includes(term.toLowerCase()));
}

function extractCommaList(text: string, patterns: RegExp[]) {
  const raw = firstMatch(text, patterns);
  if (!raw) return [];
  return raw
    .split(/,|;|\band\b/i)
    .map(item => item.trim().replace(/[.;]$/, ''))
    .filter(item => item.length > 2);
}

function scopeFromVendorName(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('construction') || lower.includes('contractor')) return 'Main Contractor';
  if (lower.includes('waterproof')) return 'Waterproofing';
  if (lower.includes('mep')) return 'MEP';
  if (lower.includes('facade') || lower.includes('façade')) return 'Facade';
  if (lower.includes('lift') || lower.includes('elevator')) return 'Elevators';
  if (lower.includes('fire')) return 'Fire Systems';
  return 'Specialist Vendor';
}

function buildUploadedExtraction(input: ProjectContextInput, base: ExtractedProjectContext): ExtractedProjectContext {
  const text = cleanSourceText(`${input.documentText ?? ''}\n${input.pastedText ?? ''}`);
  const weakText = text.length < 80;
  const sourceName = input.fileName || (input.pastedText?.trim() ? 'Pasted project brief' : 'Uploaded project document');
  const projectNameRaw = firstMatch(text, [
    /project\s*[:\-]\s*([^\n.]+)/i,
    /scope\s*[:\-]\s*([^\n.]+)/i,
  ]);
  const propertyName = firstMatch(text, [
    /(?:property|tower|development)\s*(?:name)?\s*[:\-]\s*([^\n.]+)/i,
    /project summary for\s+([^,\n.]+)/i,
    /\b((?:Bayz|BAYZ)\s*102)\b/i,
    /\b(Sobha\s+Pilot\s+Tower)\b/i,
  ]);
  const propertyType = firstMatch(text, [
    /\b((?:residential|commercial|mixed-use|hospitality|retail)\s+(?:tower|building|development|community|office))\b/i,
    /type\s*[:\-]\s*([^\n.]+)/i,
  ]);
  const location = firstMatch(text, [
    /location\s*[:\-]\s*([^\n.]+)/i,
    /\b(Business Bay,\s*Dubai)\b/i,
    /\b(Business Bay)\b/i,
    /\b(Dubai)\b/i,
  ]);
  const floors = findNumber(text, [
    /(\d{1,3})\s*(?:floor|floors|storey|storeys|stories)/i,
  ]);
  const units = findNumber(text, [
    /(\d{2,5})\s*(?:units|apartments|residential units|keys)/i,
  ]);
  const contractValue = findMoney(text);
  const targetHandover = findDate(text);
  const currentStage = firstMatch(text, [
    /current stage\s*[:\-]\s*([^\n.]+)/i,
    /stage\s*[:\-]\s*([^\n.]+)/i,
  ]);
  const mainContractor = firstMatch(text, [
    /main contractor\s*[:\-]\s*([^\n.]+)/i,
    /contractor\s*[:\-]\s*([^\n.]+)/i,
    /\b(China State Construction)\b/i,
    /\b(Sobha Construction)\b/i,
  ]);
  const contingency = findNumber(text, [/contingency\D{0,16}(\d{1,2})\s*%/i]);

  const packageTerms = [
    'Preliminaries',
    'Design & Approvals',
    'Design Approvals',
    'Substructure',
    'Superstructure',
    'Facade',
    'Façade',
    'MEP',
    'Fit-out',
    'Testing & Commissioning',
    'Handover & Snagging',
    'Contingency',
  ];
  const packageList = Array.from(new Set([
    ...detectItems(text, packageTerms).map(item => item === 'Design Approvals' ? 'Design & Approvals' : item === 'Façade' ? 'Facade' : item),
    ...extractCommaList(text, [/packages include\s*([^\n.]+)/i, /work packages\s*[:\-]\s*([^\n.]+)/i]),
  ])).slice(0, 12);

  const vendorNames = Array.from(new Set([
    ...extractCommaList(text, [/specialist teams include\s*([^\n.]+)/i, /vendors include\s*([^\n.]+)/i, /subcontractors include\s*([^\n.]+)/i]),
    ...(mainContractor ? [mainContractor] : []),
  ])).filter(item => item.length > 2);

  const riskTerms = [
    'Facade procurement lead time',
    'Tower crane utilization bottleneck',
    'Authority approval dependency',
    'MEP coordination clashes',
    'Summer concrete productivity loss',
    'Procurement delay',
    'Inspection failure',
    'Vendor underperformance',
  ];
  const evidenceTerms = [
    'Authority approvals',
    'Inspection reports',
    'Commissioning certificates',
    'Fire system sign-off',
    'Lift inspection sign-off',
    'Vendor warranty packs',
    'Handover evidence pack',
    'BOQ summary',
    'Fire commissioning report',
  ];
  const obligationTerms = [
    'Authority approval certificates',
    'Fire system commissioning report',
    'Lift inspection sign-off',
    'Vendor warranty packs',
    'Handover evidence pack',
    'Approvals',
    'Warranties',
  ];
  const milestoneTerms = [
    'Substructure Complete',
    'Superstructure Level 50',
    'Facade Release',
    'MEP Rough-In Ready',
    'Commissioning Ready',
    'Handover Go/No-Go',
  ];

  const risks = detectItems(text, riskTerms);
  const evidence = detectItems(text, evidenceTerms);
  const obligations = detectItems(text, obligationTerms);
  const milestones = detectItems(text, milestoneTerms);

  const found = [
    propertyName,
    propertyType,
    location,
    floors,
    units,
    projectNameRaw,
    contractValue,
    targetHandover,
    currentStage,
    mainContractor,
    packageList.length,
    vendorNames.length,
    risks.length,
    evidence.length,
  ].filter(Boolean).length;
  const confidence = weakText ? 62 : Math.min(94, 68 + found * 2);
  const confirmationCount = weakText ? 8 : Math.max(1, 8 - Math.floor(found / 2));
  const projectName = projectNameRaw.toLowerCase().includes('main construction') ? 'Main Construction' : projectNameRaw;

  return {
    ...base,
    sourceName,
    sourceType: input.fileName ? 'uploaded-file' : input.pastedText?.trim() ? 'pasted-brief' : 'manual',
    signalCount: weakText ? 18 : Math.max(36, found * 7),
    confidence,
    confirmationCount: input.parserWarning ? confirmationCount + 1 : confirmationCount,
    property: {
      name: makeField(propertyName || base.property.name.value, Boolean(propertyName), propertyName ? 91 : 69),
      type: makeField(propertyType || base.property.type.value, Boolean(propertyType), propertyType ? 88 : 68),
      location: makeField(location || base.property.location.value, Boolean(location), location ? 88 : 68),
      floors: makeField(floors ?? base.property.floors.value, floors !== null, floors !== null ? 90 : 66),
      units: makeField(units ?? base.property.units.value, units !== null, units !== null ? 88 : 66),
    },
    project: {
      name: makeField(projectName || base.project.name.value, Boolean(projectName), projectName ? 88 : 68),
      type: makeField(projectName?.includes('Construction') ? 'Main Construction' : base.project.type.value, Boolean(projectName), projectName ? 86 : 68),
      contractValue: makeField(contractValue ?? base.project.contractValue.value, contractValue !== null, contractValue !== null ? 91 : 65),
      targetHandover: makeField(targetHandover || base.project.targetHandover.value, Boolean(targetHandover), targetHandover ? 88 : 64),
      currentStage: makeField(currentStage || base.project.currentStage.value, Boolean(currentStage), currentStage ? 83 : 68),
      mainContractor: makeField(mainContractor || base.project.mainContractor.value, Boolean(mainContractor), mainContractor ? 87 : 68),
    },
    budget: {
      approvedBudget: makeField(contractValue ?? base.budget.approvedBudget.value, contractValue !== null, contractValue !== null ? 91 : 65),
      currency: makeField('AED', /\bAED\b|Dhs|د\.إ/i.test(text), /\bAED\b|Dhs|د\.إ/i.test(text) ? 96 : 72),
      contingency: makeField(contingency ?? base.budget.contingency.value, contingency !== null, contingency !== null ? 84 : 66),
      trackingLevel: makeField(base.budget.trackingLevel.value, /package|phase/i.test(text), /package|phase/i.test(text) ? 84 : 68),
      reporting: makeField(/monthly/i.test(text) ? 'Monthly' : base.budget.reporting.value, /monthly/i.test(text), /monthly/i.test(text) ? 84 : 68),
    },
    workPackages: makeField(packageList.length ? packageList : base.workPackages.value, packageList.length > 0, packageList.length ? 86 : 67),
    vendors: (vendorNames.length ? vendorNames : base.vendors.map(item => item.name)).slice(0, 8).map((name, index) => ({
      name,
      scope: scopeFromVendorName(name),
      confidence: vendorNames.length ? Math.max(74, 88 - index * 3) : 68,
      needsConfirmation: index > 2 || vendorNames.length === 0,
    })),
    milestones: makeField(milestones.length ? milestones : base.milestones.value, milestones.length > 0 || Boolean(targetHandover), milestones.length ? 84 : 68),
    risks: makeField(risks.length ? risks : base.risks.value, risks.length > 0, risks.length ? 82 : 66),
    obligations: makeField(obligations.length ? obligations : base.obligations.value, obligations.length > 0, obligations.length ? 82 : 66),
    evidence: makeField(evidence.length ? evidence : base.evidence.value, evidence.length > 0, evidence.length ? 84 : 66),
    extractionSignals: [
      {
        id: 'parser',
        title: input.parserWarning ? 'Document parser warning' : 'Document text extracted',
        value: input.parserWarning ?? `${text.length.toLocaleString()} readable characters extracted via ${input.parserMethod ?? 'text parser'}`,
        count: Math.max(1, Math.round(text.length / 350)),
        confidence: input.parserWarning ? 64 : 88,
        sourceExcerpt: input.parserWarning ?? excerpt(text, propertyName || projectName || 'project'),
        needsConfirmation: Boolean(input.parserWarning),
      },
      { id: 'property', title: 'Property detected', value: `${propertyName || base.property.name.value} - ${propertyType || base.property.type.value}`, count: 5, confidence: propertyName ? 90 : 68, sourceExcerpt: excerpt(text, propertyName || 'tower'), needsConfirmation: !propertyName },
      { id: 'project', title: 'Project detected', value: projectName || base.project.name.value, count: 6, confidence: projectName ? 88 : 68, sourceExcerpt: excerpt(text, projectName || 'project'), needsConfirmation: !projectName },
      { id: 'budget', title: 'Budget detected', value: contractValue ? `AED ${Math.round(contractValue / 1_000_000)}M contract value` : 'Budget requires confirmation', count: contractValue ? 5 : 1, confidence: contractValue ? 91 : 65, sourceExcerpt: excerpt(text, 'contract value'), needsConfirmation: !contractValue },
      { id: 'vendors', title: 'Vendors detected', value: `${vendorNames.length || base.vendors.length} delivery parties mapped`, count: vendorNames.length || base.vendors.length, confidence: vendorNames.length ? 82 : 66, sourceExcerpt: excerpt(text, 'contractor'), needsConfirmation: vendorNames.length < 3 },
      { id: 'work-packages', title: 'Work packages detected', value: `${packageList.length || base.workPackages.value.length} packages`, count: packageList.length || base.workPackages.value.length, confidence: packageList.length ? 86 : 67, sourceExcerpt: excerpt(text, 'packages'), needsConfirmation: packageList.length === 0 },
      { id: 'risks', title: 'Risks detected', value: `${risks.length || base.risks.value.length} early project risks`, count: risks.length || base.risks.value.length, confidence: risks.length ? 82 : 66, sourceExcerpt: excerpt(text, 'risk'), needsConfirmation: risks.length === 0 },
      { id: 'evidence', title: 'Evidence requirements detected', value: `${evidence.length || base.evidence.value.length} proof requirements`, count: evidence.length || base.evidence.value.length, confidence: evidence.length ? 84 : 66, sourceExcerpt: excerpt(text, 'evidence'), needsConfirmation: evidence.length === 0 },
    ],
  };
}

export async function extractProjectContext(input: ProjectContextInput): Promise<ExtractedProjectContext> {
  const extracted = cloneSampleExtraction();

  if (input.useSample) {
    extracted.sourceName = 'Sample Sobha Pilot Tower LOA / Project Summary.pdf';
    extracted.sourceType = 'sample-document';
    return extracted;
  }

  if (input.documentText?.trim() || input.pastedText?.trim()) {
    return buildUploadedExtraction(input, extracted);
  }

  if (input.fileName) {
    extracted.sourceName = input.fileName;
    extracted.sourceType = 'uploaded-file';
    extracted.confidence = 62;
    extracted.confirmationCount = 8;
    extracted.extractionSignals = [
      {
        id: 'parser',
        title: 'Document requires readable text',
        value: input.parserWarning ?? 'No readable document text was extracted from the upload.',
        count: 1,
        confidence: 58,
        sourceExcerpt: 'Upload received, but the local parser could not read enough text to build a reliable baseline.',
        needsConfirmation: true,
      },
      ...extracted.extractionSignals.map(signal => ({ ...signal, confidence: Math.min(signal.confidence, 68), needsConfirmation: true })),
    ];
    return extracted;
  }

  if (input.pastedText?.trim()) {
    extracted.sourceName = 'Pasted project brief';
    extracted.sourceType = 'pasted-brief';
    return extracted;
  }

  if (input.manual) {
    extracted.sourceName = 'Manual project context';
    extracted.sourceType = 'manual';
    extracted.confidence = 84;
    extracted.confirmationCount = 5;
    return extracted;
  }

  extracted.sourceName = 'Sample Sobha Pilot Tower LOA / Project Summary.pdf';
  extracted.sourceType = 'manual';
  return extracted;
}

export function generateProjectControlBaseline(extracted: ExtractedProjectContext): GeneratedProjectControlBaseline {
  return {
    sourceName: extracted.sourceName,
    workPackagesCreated: 9,
    programmePhasesCreated: 9,
    stageGatesCreated: 7,
    vendorsMapped: extracted.vendors.length,
    risksSeeded: extracted.risks.value.length,
    evidenceRequirementsAdded: extracted.evidence.value.length,
    budgetBaselineLabel: 'AED 420M',
    readinessScore: extracted.confidence,
    topThreat: 'Tower crane logistics and facade procurement may compress the critical path if not controlled early.',
    programmePhases: [
      'Mobilisation',
      'Authority approvals',
      'Substructure',
      'Core and superstructure',
      'Facade release',
      'MEP rough-in',
      'Fit-out start',
      'Testing and commissioning',
      'Handover readiness',
    ],
    stageGates: [
      'Design Freeze',
      'Substructure Complete',
      'Superstructure Level 50',
      'Facade Release',
      'MEP Rough-In Ready',
      'Commissioning Ready',
      'Handover Go/No-Go',
    ],
    forecastModel: 'Base forecast starts from contract date, EVM, package risk, gate readiness, vendor score, and evidence completeness.',
    initialManagerActions: [
      'Resequence tower crane utilization',
      'Release facade long-lead procurement',
      'Confirm authority approval pathway',
    ],
  };
}

function getDaysToHandover(targetDate: string) {
  const target = new Date(targetDate);
  if (Number.isNaN(target.getTime())) return 0;
  const today = new Date('2026-05-17T00:00:00.000Z');
  return Math.max(0, Math.ceil((target.getTime() - today.getTime()) / 86_400_000));
}

function formatSelectorLabel(extracted: ExtractedProjectContext) {
  return `${extracted.property.name.value} - ${extracted.project.name.value}`;
}

function buildPhases(): Phase[] {
  return [
    {
      id: 'design',
      name: 'Design & Approvals',
      startPct: 0,
      widthPct: 18,
      completePct: 100,
      color: '#00B894',
      isCritical: false,
      aiAnnotation: 'Authority path detected',
      subTasks: [
        { id: 'design-brief', name: 'Design freeze', startPct: 0, widthPct: 8, completePct: 100, isCritical: false },
        { id: 'design-authority', name: 'Authority pathway', startPct: 8, widthPct: 10, completePct: 72, isCritical: true },
      ],
    },
    {
      id: 'substructure',
      name: 'Substructure',
      startPct: 16,
      widthPct: 18,
      completePct: 88,
      color: '#00B894',
      isCritical: false,
      aiAnnotation: 'Near completion',
      subTasks: [
        { id: 'sub-basement', name: 'Basement works', startPct: 16, widthPct: 9, completePct: 100, isCritical: false },
        { id: 'sub-waterproofing', name: 'Waterproofing closeout', startPct: 24, widthPct: 10, completePct: 76, isCritical: false },
      ],
    },
    {
      id: 'superstructure',
      name: 'Superstructure',
      startPct: 30,
      widthPct: 28,
      completePct: 28,
      color: '#FFCD57',
      isCritical: true,
      aiAnnotation: 'Crane logistics watch',
      subTasks: [
        { id: 'sup-l1-l24', name: 'Levels 1-24', startPct: 30, widthPct: 10, completePct: 62, isCritical: true },
        { id: 'sup-l25-l50', name: 'Levels 25-50', startPct: 40, widthPct: 11, completePct: 18, isCritical: true },
        { id: 'sup-high-zone', name: 'High-zone cycle', startPct: 50, widthPct: 8, completePct: 0, isCritical: true },
      ],
    },
    {
      id: 'facade',
      name: 'Facade',
      startPct: 46,
      widthPct: 22,
      completePct: 4,
      color: '#FF9B38',
      isCritical: true,
      aiAnnotation: 'Long-lead release needed',
      subTasks: [
        { id: 'facade-shopdrawings', name: 'Shop drawings', startPct: 46, widthPct: 8, completePct: 18, isCritical: true },
        { id: 'facade-procurement', name: 'Long-lead procurement', startPct: 54, widthPct: 14, completePct: 0, isCritical: true },
      ],
    },
    {
      id: 'mep',
      name: 'MEP Rough-in',
      startPct: 52,
      widthPct: 26,
      completePct: 12,
      color: '#7C3AED',
      isCritical: true,
      aiAnnotation: 'Coordination model open',
      subTasks: [
        { id: 'mep-risers', name: 'Riser coordination', startPct: 52, widthPct: 11, completePct: 18, isCritical: true },
        { id: 'mep-roughin', name: 'Rough-in readiness', startPct: 62, widthPct: 16, completePct: 6, isCritical: true },
      ],
    },
    {
      id: 'fitout',
      name: 'Fit-out',
      startPct: 70,
      widthPct: 18,
      completePct: 0,
      color: '#243448',
      isCritical: true,
      aiAnnotation: 'Dependent on facade release',
      subTasks: [
        { id: 'fitout-mockups', name: 'Mockups and materials', startPct: 70, widthPct: 8, completePct: 0, isCritical: true },
        { id: 'fitout-typical', name: 'Typical floors', startPct: 78, widthPct: 10, completePct: 0, isCritical: true },
      ],
    },
    {
      id: 'handover',
      name: 'Testing, Commissioning & Handover',
      startPct: 86,
      widthPct: 14,
      completePct: 0,
      color: '#243448',
      isCritical: true,
      aiAnnotation: 'Evidence-driven gates',
      subTasks: [
        { id: 'tc-commissioning', name: 'Commissioning certificates', startPct: 86, widthPct: 6, completePct: 0, isCritical: true },
        { id: 'handover-pack', name: 'Handover evidence pack', startPct: 92, widthPct: 8, completePct: 0, isCritical: true },
      ],
    },
  ];
}

function buildCostSeries(): ProjectCostSeries {
  return {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    planned: [14, 31, 58, 92, 132, 172, 214, 256, 304, 348, 390, 420],
    actual: [15, 35, 66, 108, 172, null, null, null, null, null, null, null],
    earnedValue: [13, 30, 54, 88, 140, null, null, null, null, null, null, null],
    forecast: [null, null, null, null, 172, 214, 254, 304, 354, 404, 442, 462],
    todayIndex: 4,
  };
}

function buildEvmSummary(): ProjectEvmSummary {
  return {
    pv: 155,
    ac: 172,
    ev: 140,
    cpi: 0.81,
    spi: 0.9,
    cv: -32,
    sv: -15,
    eac: 462,
    etc: 290,
    vac: -42,
    tcpi: 1.11,
  };
}

function buildRisks(extracted: ExtractedProjectContext): Risk[] {
  const templates: Array<Pick<Risk, 'category' | 'probability' | 'impact' | 'severity' | 'owner' | 'mitigation'>> = [
    { category: 'programme', probability: 4, impact: 5, severity: 'critical', owner: 'Procurement Manager', mitigation: 'Release long-lead facade package and lock shop drawing review dates.' },
    { category: 'programme', probability: 4, impact: 4, severity: 'high', owner: 'Construction Director', mitigation: 'Resequence crane hook time and approve protected pour windows.' },
    { category: 'legal', probability: 3, impact: 4, severity: 'high', owner: 'Authorities Lead', mitigation: 'Confirm submission pathway and evidence ownership for commissioning gates.' },
    { category: 'quality', probability: 3, impact: 4, severity: 'high', owner: 'MEP Coordinator', mitigation: 'Freeze riser clash model and publish coordinated package before rough-in gate.' },
    { category: 'external', probability: 3, impact: 3, severity: 'medium', owner: 'Site Manager', mitigation: 'Approve summer productivity plan, cooling controls, and night-pour logistics.' },
  ];

  return extracted.risks.value.map((title, index) => {
    const template = templates[index] ?? templates[templates.length - 1];
    return {
      id: `sobha-created-risk-${index + 1}`,
      title,
      category: template.category,
      probability: template.probability,
      impact: template.impact,
      score: template.probability * template.impact,
      severity: template.severity,
      status: index < 3 ? 'open' : 'mitigating',
      owner: template.owner,
      mitigation: template.mitigation,
      aiEarlyWarning: `AI linked this risk to ${extracted.project.currentStage.value} and the live control baseline.`,
    };
  });
}

function buildMilestones(extracted: ExtractedProjectContext): ProjectMilestones {
  const days = [13, 62, 90, 134, 189, 228];
  const colors = ['#FFCD57', '#FF9B38', '#FF9B38', '#7C3AED', '#7A94B4', '#38D98A'];
  return extracted.milestones.value.map((name, index) => ({
    id: `sobha-created-milestone-${index + 1}`,
    name,
    daysRemaining: days[index] ?? 90 + index * 18,
    color: colors[index] ?? '#7A94B4',
    critical: index >= 1,
  }));
}

function buildAiContent(extracted: ExtractedProjectContext, baseline: GeneratedProjectControlBaseline): ProjectCommandAIContent {
  const source = projectCommandDatasets['sobha-pilot-tower'].aiContent;
  return {
    ...source,
    healthScore: {
      ...source.healthScore,
      score: 74,
      status: 'monitor',
      topThreat: baseline.topThreat,
      recommendedAction: 'Start with crane resequencing, facade long-lead release, and authority approval confirmation before simulating new project events.',
      scoreBreakdown: { programme: 70, cost: 68, quality: 78, risk: 66, contractor: 74 },
      forecast30d: { completion: 33, spend: 192, newRisks: 5, sparkline: [28, 28.4, 28.9, 29.3, 29.8, 30.6, 31.4, 32.1, 32.6, 33] },
    },
    topDecisions: [
      {
        rank: 1,
        title: 'Resequence tower crane utilization',
        impact: 'Protects 16 days of superstructure float',
        urgency: 'critical',
        deadline: '24 May 2026',
      },
      {
        rank: 2,
        title: 'Release facade long-lead procurement',
        impact: 'Avoids Q3 envelope delay',
        urgency: 'high',
        deadline: '28 May 2026',
      },
      {
        rank: 3,
        title: 'Confirm authority approval pathway',
        impact: 'Reduces handover gate risk',
        urgency: 'high',
        deadline: '30 May 2026',
      },
    ],
    programmeInsights: {
      ...source.programmeInsights,
      criticalPathNarrative: 'AI built the first critical path from the uploaded LOA and summary: superstructure productivity, facade release, MEP rough-in, commissioning evidence, and handover gates are now linked.',
      rescheduleSuggestion: 'Resequence crane utilization before Level 50 and release facade long-lead procurement to protect 16 days of float.',
    },
    costInsights: {
      ...source.costInsights,
      narrative: 'The uploaded project material created an AED 420M baseline. Current EAC is AED 462M because early control risk is concentrated in crane logistics, facade procurement, and possible acceleration.',
    },
    scenarios: {
      optimistic: {
        label: 'Optimistic',
        probability: 22,
        completionDate: extracted.project.targetHandover.value,
        finalCost: 438_000_000,
        assumptions: ['Crane resequencing approved this week', 'Facade release lands before procurement gate', 'Authority path confirmed without resubmission'],
        programmeSlip: 0,
      },
      base: {
        label: 'Base Case',
        probability: 56,
        completionDate: extracted.project.targetHandover.value,
        finalCost: 462_000_000,
        assumptions: ['Facade release by 15 Aug', 'Crane overtime approved', 'Evidence gaps closed before Commissioning Ready'],
        programmeSlip: 0,
      },
      pessimistic: {
        label: 'Pessimistic',
        probability: 22,
        completionDate: '2026-11-03',
        finalCost: 488_000_000,
        assumptions: ['Facade procurement remains late', 'Crane productivity loss continues', 'Authority approval slips into commissioning window'],
        programmeSlip: 83,
      },
    },
    askAI: {
      queries: [
        {
          question: 'What changed today?',
          answer: `AI converted ${baseline.sourceName} into a ProjectCommand control baseline with work packages, stage gates, vendor map, risks, obligations, evidence requirements, forecast scenarios, and manager actions.`,
          sources: ['Uploaded LOA / project summary', 'AI baseline generator', 'ProjectCommand control model'],
        },
        {
          question: 'Why is the health score 74?',
          answer: 'The baseline starts at 74 because the project is only 28% complete while budget used is already 41%, CPI is 0.81, SPI is 0.90, and float is only 12 days.',
          sources: ['Cost baseline', 'Programme phases', 'Risk register'],
        },
        {
          question: 'Which decision recovers most time?',
          answer: 'Resequencing tower crane utilization recovers the most time. AI estimates it protects 16 days of superstructure float and prevents knock-on delays to facade and MEP work.',
          sources: ['Crane utilization model', 'Critical path simulation', 'Manager action queue'],
        },
      ],
    },
  };
}

function buildProject(extracted: ExtractedProjectContext): ProjectCommandProject {
  const approvedBudget = extracted.budget.approvedBudget.value;
  const actualCost = Math.round(approvedBudget * 0.41);
  const earnedValue = Math.round(actualCost * 0.81);
  const plannedValue = Math.round(earnedValue / 0.9);

  return {
    id: 'sobha-pilot-tower-main-construction-demo',
    name: extracted.project.name.value,
    organizationId: 'developmentx',
    portfolioId: 'sobha-realty-portfolio',
    propertyId: 'sobha-pilot-tower-property',
    projectType: 'Main Construction',
    developer: 'Sobha Realty Portfolio',
    location: extracted.property.location.value,
    type: `${extracted.property.floors.value}-floor ${extracted.property.type.value.toLowerCase()}`,
    floors: extracted.property.floors.value,
    contractValue: approvedBudget,
    startDate: '2024-06-03',
    targetHandover: extracted.project.targetHandover.value,
    status: 'monitor',
    completion: 28,
    budgetUsed: 41,
    daysToHandover: getDaysToHandover(extracted.project.targetHandover.value),
    mainContractor: extracted.project.mainContractor.value,
    plannedValue,
    actualCost,
    earnedValue,
    cpi: 0.81,
    spi: 0.9,
    costVariance: earnedValue - actualCost,
    scheduleVariance: earnedValue - plannedValue,
    floatRemaining: 12,
    healthScore: 74,
    healthStatus: 'monitor',
    forecastCompletion: extracted.project.targetHandover.value,
    forecastCost: 462_000_000,
  };
}

export function buildProjectCommandDatasetFromExtraction(
  extracted: ExtractedProjectContext,
  baseline: GeneratedProjectControlBaseline,
): ProjectCommandDataset {
  const organization = projectCommandOrganizations[0];
  const portfolio = projectCommandPortfolios.find(item => item.id === 'sobha-realty-portfolio') ?? projectCommandPortfolios[0];
  const sourceProperty = projectCommandProperties.find(item => item.id === 'sobha-pilot-tower-property') ?? projectCommandProperties[0];
  const property = {
    ...sourceProperty,
    name: extracted.property.name.value,
    type: extracted.property.type.value,
    location: extracted.property.location.value.replace(', Dubai', ''),
    buildings: 1,
    units: extracted.property.units.value,
    size: `${extracted.property.floors.value} floors`,
    status: 'active' as const,
  };
  const project = buildProject(extracted);

  return {
    id: project.id,
    selectorLabel: formatSelectorLabel(extracted),
    organization,
    portfolio,
    property,
    project,
    phases: buildPhases(),
    costSeries: buildCostSeries(),
    evmSummary: buildEvmSummary(),
    risks: buildRisks(extracted),
    milestones: buildMilestones(extracted),
    aiContent: buildAiContent(extracted, baseline),
  };
}
