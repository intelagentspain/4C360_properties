export type PropertyIntakeMode = 'wizard' | 'ai-brief' | 'file-upload' | 'api';

export interface PropertyIntakeSource {
  mode: Exclude<PropertyIntakeMode, 'wizard'>;
  text?: string;
  fileNames?: string[];
  apiPayload?: Record<string, unknown>;
}

export interface PropertyExtractionSignal {
  id: string;
  label: string;
  value: string;
  confidence: number;
  source: string;
  needsConfirmation?: boolean;
}

export interface PropertyReviewSection {
  id: string;
  title: string;
  confidence: number;
  needsConfirmation?: boolean;
  summary: string;
}

export interface PropertyApiMappingPreview {
  endpoint: string;
  sourceSystem: string;
  requiredFields: string[];
  mappedFields: string[];
  samplePayload: Record<string, unknown>;
}

interface ExtractedAsset {
  id: string;
  assetName: string;
  category: string;
  type: string;
  assignedSite: string;
  quantity: string;
  installYear: string;
  condition: string;
  notes: string;
}

interface ExtractedTeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  perspective: 'Strategic' | 'Operational' | 'Client';
  assignedClients: string[];
  zones: string[];
  skills: string[];
  responsibilities: string[];
  privileges: string[];
  mobile: string;
  whatsapp: string;
  location: string;
  availability: string;
  shift: string;
  commChannels: string[];
}

interface ExtractedKnowledgeDoc {
  id: string;
  title: string;
  url: string;
}

interface ExtractedBudgetLine {
  id: string;
  service: string;
  allocated: string;
  actual: string;
}

interface ExtractedInventoryItem {
  id: string;
  itemName: string;
  category: string;
  quantity: string;
  unit: string;
  site: string;
}

export interface ExtractedPropertyContext {
  property: {
    name: string;
    sector: string;
    industrySubtype: string;
    initialsColor: string;
  };
  contract: {
    contractType: string;
    contractStartDate: string;
    contractEndDate: string;
    slaTier: string;
    contractValue: string;
  };
  contact: {
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    accountManager: string;
  };
  siteNames: string[];
  assets: ExtractedAsset[];
  teamMembers: ExtractedTeamMember[];
  knowledgeBaseNotes: string;
  knowledgeBaseDocs: ExtractedKnowledgeDoc[];
  budget: {
    annual: string;
    currency: string;
    costCentre: string;
    approvalThreshold: string;
    serviceLines: ExtractedBudgetLine[];
  };
  inventoryItems: ExtractedInventoryItem[];
  signals: PropertyExtractionSignal[];
  sections: PropertyReviewSection[];
  starterActions: string[];
}

const sourceLabel: Record<PropertyIntakeSource['mode'], string> = {
  'ai-brief': 'AI brief',
  'file-upload': 'Uploaded property material',
  api: 'API mapping',
};

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function firstMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return '';
}

function detectCurrencyValue(text: string) {
  const value = firstMatch(text, [
    /(?:AED|د\.إ)\s*([\d,.]+)\s*(?:m|million|mn)?/i,
    /(?:contract|budget|value|annual)[^\d]{0,30}([\d,.]+)\s*(?:AED|m|million|mn)?/i,
  ]);
  if (!value) return '';
  const nearby = text.slice(Math.max(0, text.indexOf(value) - 40), text.indexOf(value) + value.length + 40);
  const isMillion = /\b(million|mn)\b|[\d,.]+\s*m\b/i.test(nearby);
  const numeric = Number(value.replace(/,/g, ''));
  if (!Number.isFinite(numeric)) return value;
  return String(isMillion && numeric < 10000 ? numeric * 1000000 : numeric);
}

function detectSites(text: string) {
  const hasSobha = /sobha|bayz|business bay/i.test(text);
  const sites = new Set<string>();
  if (hasSobha) {
    sites.add('Sobha Pilot Tower');
    sites.add('Bayz 102 Tower B');
    sites.add('Podium and amenities');
  }
  const lines = text.split(/\n|;|\./).map(line => line.trim()).filter(Boolean);
  lines.forEach(line => {
    if (/site|tower|building|cluster|community/i.test(line) && line.length < 80) {
      sites.add(line.replace(/^(site|location|property)\s*:\s*/i, ''));
    }
  });
  return [...sites].slice(0, 5);
}

function buildAsset(assetName: string, category: string, type: string, assignedSite: string, quantity: string, notes: string): ExtractedAsset {
  return {
    id: uid('asset'),
    assetName,
    category,
    type,
    assignedSite,
    quantity,
    installYear: '2024',
    condition: 'Good',
    notes,
  };
}

function buildTeamMember(name: string, role: string, email: string, clientName: string, zones: string[], skills: string[]): ExtractedTeamMember {
  return {
    id: uid('member'),
    name,
    email,
    role,
    perspective: role === 'Executive' ? 'Strategic' : 'Operational',
    assignedClients: [clientName],
    zones,
    skills,
    responsibilities: ['Manage assets', 'Respond to critical incidents', 'Conduct PPM inspections'],
    privileges: role === 'Executive'
      ? ['view_dashboard', 'view_reports', 'view_ai_insights']
      : ['view_dashboard', 'view_work_orders', 'create_work_orders', 'manage_assets'],
    mobile: '',
    whatsapp: '',
    location: zones[0] ?? '',
    availability: 'Full-time',
    shift: 'Business Hours (08:00-17:00)',
    commChannels: ['whatsapp', 'email'],
  };
}

function buildSignals(context: ExtractedPropertyContext, source: PropertyIntakeSource) {
  const sourceName = sourceLabel[source.mode];
  const fileSource = source.fileNames?.length ? source.fileNames.join(', ') : sourceName;
  return [
    {
      id: 'property-profile',
      label: 'Property profile',
      value: `${context.property.name} / ${context.property.industrySubtype || context.property.sector}`,
      confidence: context.property.name === 'Imported Property' ? 72 : 94,
      source: fileSource,
      needsConfirmation: context.property.name === 'Imported Property',
    },
    {
      id: 'sites-zones',
      label: 'Sites and zones',
      value: `${context.siteNames.length} site${context.siteNames.length === 1 ? '' : 's'} detected`,
      confidence: context.siteNames.length > 1 ? 91 : 78,
      source: fileSource,
      needsConfirmation: context.siteNames.length <= 1,
    },
    {
      id: 'assets-systems',
      label: 'Assets and systems',
      value: `${context.assets.length} starter assets prepared`,
      confidence: context.assets.length >= 5 ? 88 : 74,
      source: sourceName,
      needsConfirmation: context.assets.length < 5,
    },
    {
      id: 'contract-sla',
      label: 'Contract and SLA',
      value: `${context.contract.contractType || 'Contract'} / ${context.contract.slaTier || 'SLA pending'}`,
      confidence: context.contract.contractValue ? 86 : 75,
      source: fileSource,
      needsConfirmation: !context.contract.contractValue,
    },
    {
      id: 'documents-evidence',
      label: 'Documents and evidence',
      value: `${context.knowledgeBaseDocs.length} source item${context.knowledgeBaseDocs.length === 1 ? '' : 's'} attached`,
      confidence: context.knowledgeBaseDocs.length ? 90 : 70,
      source: fileSource,
      needsConfirmation: !context.knowledgeBaseDocs.length,
    },
  ];
}

function buildSections(context: ExtractedPropertyContext) {
  return [
    {
      id: 'profile',
      title: 'Property profile',
      confidence: context.property.name === 'Imported Property' ? 72 : 94,
      summary: `${context.property.name} in ${context.siteNames[0] ?? 'primary site'} as ${context.property.industrySubtype || context.property.sector}.`,
      needsConfirmation: context.property.name === 'Imported Property',
    },
    {
      id: 'operations',
      title: 'Operating context',
      confidence: 88,
      summary: `${context.siteNames.length} sites, ${context.assets.length} assets, ${context.teamMembers.length} team members, and ${context.inventoryItems.length} inventory lines.`,
    },
    {
      id: 'commercial',
      title: 'Contract and budget',
      confidence: context.contract.contractValue ? 86 : 76,
      summary: `${context.contract.slaTier || 'SLA pending'} tier with ${context.budget.currency} ${context.budget.annual || context.contract.contractValue || 'budget pending'} operating budget signal.`,
      needsConfirmation: !context.contract.contractValue,
    },
    {
      id: 'evidence',
      title: 'Documents and evidence',
      confidence: context.knowledgeBaseDocs.length ? 90 : 72,
      summary: `${context.knowledgeBaseDocs.length} documents mapped into the property knowledge base.`,
      needsConfirmation: !context.knowledgeBaseDocs.length,
    },
  ];
}

export function buildPropertyApiMappingPreview(): PropertyApiMappingPreview {
  return {
    endpoint: '/api/properties/intake',
    sourceSystem: 'Owner ERP / CAFM / handover system',
    requiredFields: ['propertyName', 'sector', 'sites', 'primaryContact'],
    mappedFields: ['propertyName', 'location', 'sites', 'assets', 'slaTier', 'contractValue', 'documents'],
    samplePayload: {
      propertyName: 'Sobha Pilot Tower',
      sector: 'Real Estate',
      location: 'Business Bay, Dubai',
      sites: ['Sobha Pilot Tower', 'Bayz 102 Tower B', 'Podium and amenities'],
      slaTier: 'Platinum',
      contractValue: '420000000',
      source: 'api-demo-sync',
    },
  };
}

export async function extractPropertyContext(source: PropertyIntakeSource): Promise<ExtractedPropertyContext> {
  const rawText = [
    source.text,
    source.apiPayload ? JSON.stringify(source.apiPayload, null, 2) : '',
    source.fileNames?.join('\n'),
  ].filter(Boolean).join('\n');
  const text = rawText.trim();
  const hasSobha = /sobha|bayz\s*102|business bay/i.test(text) || source.mode === 'api';
  const detectedName = hasSobha
    ? 'Sobha Pilot Tower'
    : firstMatch(text, [
      /(?:property|building|community|tower|client)\s*(?:name)?\s*:\s*([^\n]+)/i,
      /^([A-Z][A-Za-z0-9 &-]{4,60})/m,
    ]) || 'Imported Property';
  const siteNames = detectSites(text);
  const finalSites = siteNames.length ? siteNames : [detectedName];
  const contractValue = detectCurrencyValue(text) || (hasSobha ? '420000000' : '');
  const propertyType = /residential/i.test(text) || hasSobha ? 'High-Rise Residential' : '';
  const sector = /hotel|hospitality/i.test(text) ? 'Hospitality' : 'Real Estate';

  const docs = (source.fileNames ?? []).map((fileName, index) => ({
    id: `doc-${index}-${fileName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`,
    title: fileName.replace(/\.[^.]+$/, ''),
    url: fileName,
  }));
  if (source.mode === 'api') {
    docs.push({ id: 'api-source-map', title: 'API intake mapping preview', url: buildPropertyApiMappingPreview().endpoint });
  }

  const assets = [
    buildAsset('Central chiller plant', 'HVAC', 'Chiller', finalSites[0], '2', 'Quarterly energy and reliability checks; connect to PPM schedule.'),
    buildAsset('LV main distribution panels', 'Electrical', 'LV Panel', finalSites[0], '4', 'Annual thermographic scan and authority compliance review.'),
    buildAsset('Passenger lift bank', 'Elevators', 'Passenger Elevator', finalSites[1] ?? finalSites[0], hasSobha ? '12' : '4', 'Monthly inspection and lift safety evidence capture.'),
    buildAsset('Fire fighting system', 'Plumbing', 'Fire Fighting System', finalSites[0], '1', 'Dubai Civil Defense evidence and pump test tracking.'),
    buildAsset('CCTV and access control', 'Security', 'CCTV System', finalSites[0], '1', 'Security asset monitoring and maintenance evidence required.'),
  ];

  const context: ExtractedPropertyContext = {
    property: {
      name: detectedName,
      sector,
      industrySubtype: propertyType,
      initialsColor: '#2E7FFF',
    },
    contract: {
      contractType: 'Integrated FM',
      contractStartDate: '2026-06-01',
      contractEndDate: '2027-05-31',
      slaTier: hasSobha ? 'Platinum' : 'Gold',
      contractValue,
    },
    contact: {
      contactName: hasSobha ? 'Sobha Owner Representative' : 'Property Operations Lead',
      contactEmail: hasSobha ? 'owner.ops@sobha.example' : 'operations@example.com',
      contactPhone: '+971 50 000 0000',
      accountManager: 'DevelopmentX Command Team',
    },
    siteNames: finalSites,
    assets,
    teamMembers: [
      buildTeamMember('Aisha Rahman', 'Account Manager', 'aisha.rahman@developmentx.example', detectedName, finalSites, ['PPM Management', 'MEP']),
      buildTeamMember('Omar Al-Rashid', 'Site Supervisor', 'omar.alrashid@developmentx.example', detectedName, finalSites, ['HVAC', 'Electrical', 'Fire & Safety']),
    ],
    knowledgeBaseNotes: [
      `AI intake source: ${sourceLabel[source.mode]}.`,
      hasSobha ? 'Detected Sobha high-rise operating context with handover, evidence, MEP, lift, fire, and resident-impact dependencies.' : 'Detected property operating context; review weak fields before launch.',
      'Starter actions: validate asset register, assign site team, confirm SLA, and generate first PPM baseline.',
    ].join('\n'),
    knowledgeBaseDocs: docs.length ? docs : [
      { id: 'brief-source', title: 'AI brief intake notes', url: 'typed-property-brief' },
    ],
    budget: {
      annual: hasSobha ? '18000000' : '',
      currency: 'AED',
      costCentre: hasSobha ? 'DX-SOBHA-PILOT' : '',
      approvalThreshold: '25000',
      serviceLines: [
        { id: uid('budget'), service: 'MEP', allocated: hasSobha ? '7800000' : '', actual: '0' },
        { id: uid('budget'), service: 'Cleaning', allocated: hasSobha ? '3200000' : '', actual: '0' },
        { id: uid('budget'), service: 'Security', allocated: hasSobha ? '2600000' : '', actual: '0' },
        { id: uid('budget'), service: 'Civil', allocated: hasSobha ? '1800000' : '', actual: '0' },
      ],
    },
    inventoryItems: [
      { id: uid('inv'), itemName: 'Critical lift spares pack', category: 'Spare Parts', quantity: '1', unit: 'Sets', site: finalSites[0] },
      { id: uid('inv'), itemName: 'Fire system test kit', category: 'Safety', quantity: '2', unit: 'Sets', site: finalSites[0] },
    ],
    signals: [],
    sections: [],
    starterActions: [
      'Confirm property owner and escalation contacts',
      'Validate AI-suggested asset baseline',
      'Generate first PPM plan',
      'Request missing authority and warranty evidence',
    ],
  };

  context.signals = buildSignals(context, source);
  context.sections = buildSections(context);
  return context;
}
