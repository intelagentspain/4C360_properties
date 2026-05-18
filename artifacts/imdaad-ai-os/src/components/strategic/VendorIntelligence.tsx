import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Minus, ArrowLeft, ShieldCheck,
  AlertTriangle, Brain, Target, DollarSign, BarChart3,
  CheckCircle, XCircle, FileWarning, Zap, ChevronRight,
  Users, Building2, Star, Sparkles, Lightbulb, ListChecks, Activity, X,
  Plus, Mic, Send, MessageSquare, UploadCloud, FileText, Wand2, Trash2,
} from 'lucide-react';
import {
  computeVendorScore,
  classifyVendorRisk,
  type VendorIntelData,
  type VendorRiskLevel,
  type VendorTrend,
} from '@/data/mockData';
import { buildDefaultVendor, useVendors } from '@/context/VendorsContext';
import type { ToastFn } from '@/lib/ui';
import { parseProjectDocumentFile } from '@/modules/projectcommand/data/projectDocumentParser';
import {
  useProjectCommandProjectOptions,
  useProjectCommandPropertyOptions,
  useSelectedProjectCommandData,
} from '@/modules/projectcommand/useProjectCommandData';

type FilterTab = 'all' | 'top' | 'atrisk' | 'cost';

type VendorWizardStep = 1 | 2 | 3 | 4;
type VendorSetupMode = 'manual' | 'ai';

type VendorWizardForm = {
  name: string;
  category: string;
  sites: string;
  address: string;
  city: string;
  country: string;
  pocName: string;
  pocTitle: string;
  pocPhone: string;
  pocEmail: string;
  activeContracts: string;
  contractExpiry: string;
  slaCompliance: string;
  firstTimeFixRate: string;
  avgResolutionMin: string;
  evidenceCompliance: string;
  repeatFailureRate: string;
  jobsLast30d: string;
  avgCostPerJob: string;
  trend: VendorTrend;
  dependencyRisk: 'Low' | 'Medium' | 'High' | 'Critical';
  dependencyNote: string;
  predictedRisk30d: string;
  contractFlags: string;
};

type VendorSetupDocument = {
  id: string;
  name: string;
  type: string;
  sizeLabel: string;
  content: string;
  warning?: string;
};

type VendorAiExtraction = {
  label: string;
  value: string;
  source: string;
};

type QuoteExtractionStatus = 'Read' | 'Missing price' | 'Missing SLA' | 'Missing delivery' | 'Needs clarification' | 'Unsupported / no text';

type ProcurementAssignmentContext = {
  propertyId: string;
  propertyName: string;
  projectId: string;
  projectName: string;
  packageName: string;
  budgetAllowance: number;
  requiredDeliveryDate: string;
  evaluationCriteria: string[];
  evidenceRequirements: string[];
};

type QuoteAnalysisItem = {
  id: string;
  vendorName: string;
  amount: number | null;
  sla: number | null;
  deliveryDate: string | null;
  warranty: string;
  exclusions: string;
  extractionStatus: QuoteExtractionStatus;
  missingFields: string[];
  clarificationQuestions: string[];
  commercialDelta: number | null;
  recommendationReason: string;
  nextActions: string[];
  score: number;
  risk: 'Low' | 'Medium' | 'High';
  finding: string;
};

type QuoteAnalysis = {
  assignment: ProcurementAssignmentContext;
  winner: QuoteAnalysisItem;
  items: QuoteAnalysisItem[];
  summary: string;
  savings: number;
  findings: string[];
  commercialSpread: number | null;
  riskConditions: string[];
  clarificationQuestions: string[];
  nextActions: string[];
};

type QuoteActionArtifact = {
  title: string;
  status: string;
  body: string;
  lines: string[];
};

type RfqCreationMode = 'tell' | 'template' | 'docs';
type RfqWizardStep = 'project' | 'mode' | 'scope' | 'requirements' | 'scoring' | 'review';
type RfqScoringKey = 'price' | 'sla' | 'quality' | 'compliance' | 'capacity' | 'risk';

type RfqTemplate = {
  id: string;
  label: string;
  category: string;
  serviceDefaults: string[];
  requirementDefaults: string[];
  mandatoryDocuments: string[];
  scoringDefaults: Record<RfqScoringKey, number>;
};

type RfqAnchor = {
  propertyId: string;
  propertyName: string;
  propertyMeta: string;
  projectId: string;
  projectName: string;
  projectType: string;
  serviceCategory: string;
  sitesAreas: string;
  targetStartDate: string;
  contractPeriod: string;
  currentVendor: string;
  shortlistContext: string;
};

type RfqWizardState = {
  step: RfqWizardStep;
  mode: RfqCreationMode | null;
  anchor: RfqAnchor;
  templateId: string;
  aiBrief: string;
  documents: VendorSetupDocument[];
  pastedScope: string;
  services: string;
  inclusions: string;
  exclusions: string;
  volume: string;
  timeline: string;
  sla: string;
  evidence: string;
  compliance: string;
  licenses: string;
  insurance: string;
  hse: string;
  mobilisation: string;
  scoring: Record<RfqScoringKey, string>;
};

type RfqGeneratedPackage = {
  title: string;
  status: string;
  summary: string;
  contextLines: string[];
  scopeLines: string[];
  responseFields: string[];
  mandatoryDocuments: string[];
  slaEvidence: string[];
  commercialTable: string[];
  scoringMatrix: { label: string; weight: number }[];
  submissionRules: string[];
  actions: string[];
};

const vendorCategories = [
  'FM & HVAC',
  'FM & Electrical',
  'MEP & Systems',
  'Cleaning & Soft FM',
  'Security',
  'Landscaping',
  'Fire & Safety',
  'Elevators & Lifts',
  'Engineering & Civil',
  'General FM',
];

const procurementPackageTemplates = [
  {
    name: 'Facade Systems',
    budgetAllowance: 58_000_000,
    requiredDeliveryDate: '2026-08-15',
    evaluationCriteria: ['Cost', 'Delivery', 'Warranty', 'Exclusions', 'Evidence', 'Compliance'],
    evidenceRequirements: ['Shop drawings', 'Material certificates', 'Inspection test plan', 'Warranty pack', 'Authority-ready submittals'],
  },
  {
    name: 'MEP',
    budgetAllowance: 86_000_000,
    requiredDeliveryDate: '2026-09-20',
    evaluationCriteria: ['Cost', 'Delivery', 'Coordination risk', 'Warranty', 'Evidence', 'Compliance'],
    evidenceRequirements: ['Method statement', 'Testing certificates', 'Commissioning plan', 'As-built pack', 'Warranty pack'],
  },
  {
    name: 'Elevators',
    budgetAllowance: 34_000_000,
    requiredDeliveryDate: '2026-10-05',
    evaluationCriteria: ['Cost', 'Lead time', 'Warranty', 'Authority sign-off readiness', 'Evidence', 'Maintenance support'],
    evidenceRequirements: ['Lift inspection plan', 'Factory certificates', 'Warranty pack', 'Maintenance proposal', 'Authority sign-off evidence'],
  },
  {
    name: 'Fire Systems',
    budgetAllowance: 22_000_000,
    requiredDeliveryDate: '2026-09-10',
    evaluationCriteria: ['Cost', 'Civil defence readiness', 'Warranty', 'Exclusions', 'Evidence', 'Compliance'],
    evidenceRequirements: ['Civil defence submittals', 'Testing certificates', 'Commissioning report', 'Warranty pack', 'Inspection evidence'],
  },
  {
    name: 'Fit-out',
    budgetAllowance: 72_000_000,
    requiredDeliveryDate: '2026-11-01',
    evaluationCriteria: ['Cost', 'Delivery', 'Mockup readiness', 'Warranty', 'Exclusions', 'Evidence'],
    evidenceRequirements: ['Material approvals', 'Mockup sign-off', 'Inspection reports', 'Snag closure evidence', 'Warranty pack'],
  },
  {
    name: 'Custom package',
    budgetAllowance: 10_000_000,
    requiredDeliveryDate: '2026-09-30',
    evaluationCriteria: ['Cost', 'Delivery', 'Warranty', 'Exclusions', 'Evidence', 'Compliance'],
    evidenceRequirements: ['Commercial offer', 'Programme commitment', 'Warranty statement', 'Evidence pack', 'Compliance declaration'],
  },
];

const rfqStepOrder: RfqWizardStep[] = ['project', 'mode', 'scope', 'requirements', 'scoring', 'review'];

function buildRfqTemplates(): RfqTemplate[] {
  return [
    {
      id: 'fm-hvac',
      label: 'FM / HVAC Services',
      category: 'FM & HVAC',
      serviceDefaults: ['Chiller, AHU, FCU, and split-unit PPM', 'Reactive cooling fault attendance', 'Filter, coil, drain, and condensate checks', 'Cooling performance and temperature reporting'],
      requirementDefaults: ['P1 cooling fault response and rectification SLA', 'Technician HVAC certification evidence', 'Asset-level PPM and close-out evidence'],
      mandatoryDocuments: ['Trade licence', 'Public liability insurance', 'Technician certifications', 'HSE plan', 'Comparable client references'],
      scoringDefaults: { price: 25, sla: 20, quality: 20, compliance: 15, capacity: 10, risk: 10 },
    },
    {
      id: 'fm-electrical',
      label: 'FM / Electrical Services',
      category: 'FM & Electrical',
      serviceDefaults: ['LV panel and DB inspection', 'Lighting, small power, and emergency lighting repairs', 'Thermography and load balance checks', 'Electrical incident response and isolation support'],
      requirementDefaults: ['Emergency electrical response SLA', 'Licensed electrician allocation', 'Panel inspection and test evidence'],
      mandatoryDocuments: ['Trade licence', 'Public liability insurance', 'Electrical technician licences', 'HSE plan', 'Testing equipment calibration certificates'],
      scoringDefaults: { price: 23, sla: 20, quality: 20, compliance: 17, capacity: 10, risk: 10 },
    },
    {
      id: 'cleaning-soft-fm',
      label: 'Cleaning & Soft FM',
      category: 'Cleaning & Soft FM',
      serviceDefaults: ['Daily cleaning routines', 'Deep cleaning schedule', 'Waste handling coordination', 'Supervisor inspection rounds'],
      requirementDefaults: ['Shift coverage plan', 'Consumables responsibility', 'Inspection checklist evidence'],
      mandatoryDocuments: ['Trade licence', 'Insurance certificates', 'Staff deployment plan', 'Chemical MSDS sheets', 'HSE plan'],
      scoringDefaults: { price: 28, sla: 16, quality: 22, compliance: 14, capacity: 12, risk: 8 },
    },
    {
      id: 'mep-systems',
      label: 'MEP & Systems',
      category: 'MEP & Systems',
      serviceDefaults: ['Mechanical, electrical, and plumbing planned maintenance', 'Corrective works for MEP defects', 'Testing, commissioning, and recommissioning support', 'Specialist escalation for critical systems'],
      requirementDefaults: ['Method statements by discipline', 'Testing and commissioning certificates', 'Close-out packs for completed works'],
      mandatoryDocuments: ['Trade licence', 'Insurance certificates', 'Engineer credentials', 'Method statement', 'Testing certificate examples'],
      scoringDefaults: { price: 22, sla: 18, quality: 22, compliance: 16, capacity: 12, risk: 10 },
    },
    {
      id: 'fire-safety',
      label: 'Fire & Safety',
      category: 'Fire & Safety',
      serviceDefaults: ['Fire alarm and life-safety system inspection', 'Fire pump, sprinkler, and extinguisher maintenance', 'Civil defence readiness support', 'Testing, corrective actions, and impairment reporting'],
      requirementDefaults: ['Authority compliance evidence', 'Testing records by system', 'Certified technician allocation'],
      mandatoryDocuments: ['Trade licence', 'Civil defence approvals', 'Insurance certificates', 'Technician certifications', 'Testing records'],
      scoringDefaults: { price: 18, sla: 18, quality: 20, compliance: 24, capacity: 10, risk: 10 },
    },
    {
      id: 'security',
      label: 'Security Services',
      category: 'Security',
      serviceDefaults: ['Guarding coverage by post and shift', 'Access control and visitor management support', 'Incident reporting and escalation', 'Supervisor patrols and handover logs'],
      requirementDefaults: ['Post orders by location', 'Guard licence compliance', 'Incident escalation matrix'],
      mandatoryDocuments: ['Security licence', 'Insurance certificates', 'Guard licence evidence', 'Supervisor CVs', 'Incident report format'],
      scoringDefaults: { price: 24, sla: 16, quality: 18, compliance: 20, capacity: 12, risk: 10 },
    },
    {
      id: 'landscape-soft-fm',
      label: 'Landscape / Soft FM',
      category: 'Landscaping',
      serviceDefaults: ['Lawn, shrub, palm, and planter maintenance', 'Irrigation controller, valve, and leak checks', 'Seasonal planting and soil treatment support', 'Pest, plant health, and landscape defect escalation'],
      requirementDefaults: ['Monthly landscape service calendar', 'Irrigation leak and outage response SLA', 'Plant replacement and material approval rules'],
      mandatoryDocuments: ['Trade licence', 'Insurance certificates', 'HSE plan', 'Resource plan', 'Comparable community references'],
      scoringDefaults: { price: 26, sla: 16, quality: 22, compliance: 12, capacity: 14, risk: 10 },
    },
    {
      id: 'elevators-lifts',
      label: 'Elevators & Lifts',
      category: 'Elevators & Lifts',
      serviceDefaults: ['Passenger and service lift PPM', 'Breakdown attendance and passenger release support', 'Safety gear, door, and controller inspections', 'Authority inspection and certification support'],
      requirementDefaults: ['Passenger entrapment response SLA', 'OEM or approved specialist technician evidence', 'Monthly lift inspection and safety report'],
      mandatoryDocuments: ['Trade licence', 'Lift maintenance approval', 'Insurance certificates', 'Technician certifications', 'Authority inspection evidence'],
      scoringDefaults: { price: 20, sla: 22, quality: 20, compliance: 20, capacity: 8, risk: 10 },
    },
    {
      id: 'engineering-civil',
      label: 'Engineering & Civil',
      category: 'Engineering & Civil',
      serviceDefaults: ['Civil repair and minor works', 'Waterproofing, facade, and structural defect support', 'Masonry, tiling, and finishing repairs', 'Inspection reports and method statements'],
      requirementDefaults: ['Method statement and risk assessment for each work package', 'Engineer supervision and QA sign-off', 'Defect photo evidence before and after completion'],
      mandatoryDocuments: ['Trade licence', 'Insurance certificates', 'Engineer credentials', 'HSE plan', 'Comparable civil works references'],
      scoringDefaults: { price: 24, sla: 14, quality: 24, compliance: 14, capacity: 14, risk: 10 },
    },
    {
      id: 'general-sourcing',
      label: 'General Vendor Sourcing',
      category: 'General FM',
      serviceDefaults: ['Defined service scope', 'Mobilisation plan', 'Reporting and governance cadence', 'Operational escalation route'],
      requirementDefaults: ['Clear SLA commitments', 'Evidence pack for completed work', 'Commercial validity period'],
      mandatoryDocuments: ['Trade licence', 'Insurance certificates', 'Company profile', 'Reference projects', 'HSE declaration'],
      scoringDefaults: { price: 25, sla: 15, quality: 20, compliance: 15, capacity: 15, risk: 10 },
    },
  ];
}

function defaultRfqScoring(): Record<RfqScoringKey, string> {
  return { price: '25', sla: '20', quality: '20', compliance: '15', capacity: '10', risk: '10' };
}

function relevantRfqTemplates(templates: RfqTemplate[], serviceCategory: string): RfqTemplate[] {
  const category = serviceCategory.trim().toLowerCase();
  const exactMatches = templates.filter(template => template.category.trim().toLowerCase() === category);
  if (exactMatches.length > 0) return exactMatches;
  return templates.filter(template => template.category === 'General FM');
}

function splitRfqLines(value: string): string[] {
  return value
    .split(/\n|;|\u2022|-/)
    .map(line => line.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function extractRfqScopeFromDocuments(documents: VendorSetupDocument[], notes: string) {
  const combined = [notes, ...documents.map(doc => `${doc.name}\n${doc.content}`)].filter(Boolean).join('\n');
  if (!combined.trim()) return {};
  const sentenceFallback = combined
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .filter(sentence => sentence.length > 24)
    .slice(0, 4)
    .join(' ');
  return {
    services: extractLabeledValue(combined, ['scope of services', 'service scope', 'scope', 'services required', 'work scope']) || sentenceFallback,
    inclusions: extractLabeledValue(combined, ['inclusions', 'included services', 'included scope']),
    exclusions: extractLabeledValue(combined, ['exclusions', 'excluded services', 'out of scope']),
    volume: extractLabeledValue(combined, ['volume', 'quantities', 'boq summary', 'asset count', 'units']),
    timeline: extractLabeledValue(combined, ['timeline', 'programme', 'duration', 'start date', 'delivery date']),
    sla: extractLabeledValue(combined, ['sla', 'service level', 'response time', 'rectification time']),
    evidence: extractLabeledValue(combined, ['evidence', 'reporting', 'close out', 'completion evidence']),
    compliance: extractLabeledValue(combined, ['compliance', 'regulatory', 'authority requirements']),
  };
}

function buildInitialRfqState(focusVendor: VendorIntelData, selectedProject: ReturnType<typeof useSelectedProjectCommandData>): RfqWizardState {
  return {
    step: 'project',
    mode: null,
    anchor: {
      propertyId: selectedProject.property.id,
      propertyName: selectedProject.property.name,
      propertyMeta: `${selectedProject.property.type} / ${selectedProject.property.location}`,
      projectId: selectedProject.project.id,
      projectName: selectedProject.project.name,
      projectType: selectedProject.project.projectType,
      serviceCategory: focusVendor.category,
      sitesAreas: focusVendor.sites.join(', '),
      targetStartDate: '',
      contractPeriod: '12 months',
      currentVendor: focusVendor.name,
      shortlistContext: `${focusVendor.name} plus qualified alternates`,
    },
    templateId: '',
    aiBrief: '',
    documents: [],
    pastedScope: '',
    services: '',
    inclusions: '',
    exclusions: '',
    volume: '',
    timeline: '',
    sla: '',
    evidence: '',
    compliance: '',
    licenses: '',
    insurance: '',
    hse: '',
    mobilisation: '',
    scoring: defaultRfqScoring(),
  };
}

function applyRfqTemplate(state: RfqWizardState, template: RfqTemplate): RfqWizardState {
  return {
    ...state,
    templateId: template.id,
    anchor: { ...state.anchor, serviceCategory: template.category },
    services: template.serviceDefaults.join('\n'),
    sla: template.requirementDefaults.join('\n'),
    compliance: template.mandatoryDocuments.join('\n'),
    scoring: Object.fromEntries(
      Object.entries(template.scoringDefaults).map(([key, value]) => [key, String(value)]),
    ) as Record<RfqScoringKey, string>,
  };
}

function buildRfqDraft(template: RfqTemplate | undefined, focusVendor: VendorIntelData, peers: VendorIntelData[], state: RfqWizardState): RfqGeneratedPackage {
  const extracted = extractRfqScopeFromDocuments(state.documents, state.pastedScope);
  const serviceLines = splitRfqLines(state.services || extracted.services || state.aiBrief || template?.serviceDefaults.join('\n') || state.anchor.serviceCategory);
  const inclusionLines = splitRfqLines(state.inclusions || extracted.inclusions || 'Vendor to confirm all inclusions against uploaded/provided scope.');
  const exclusionLines = splitRfqLines(state.exclusions || extracted.exclusions || 'Vendor must state all exclusions, assumptions, and client dependencies.');
  const requiredDocs = splitRfqLines(state.compliance)
    .concat(template?.mandatoryDocuments ?? [])
    .filter((item, index, items) => items.indexOf(item) === index)
    .slice(0, 8);
  const scoringMatrix = (Object.entries(state.scoring) as [RfqScoringKey, string][])
    .map(([key, value]) => ({
      label: ({ price: 'Price', sla: 'SLA', quality: 'Quality', compliance: 'Compliance', capacity: 'Capacity', risk: 'Risk' } as Record<RfqScoringKey, string>)[key],
      weight: Number(value) || 0,
    }));
  const peerNames = peers.filter(peer => peer.id !== focusVendor.id).slice(0, 3).map(peer => peer.name);

  return {
    title: `${state.anchor.serviceCategory} RFQ - ${state.anchor.projectName}`,
    status: 'Review package ready',
    summary: `RFQ anchored to ${state.anchor.propertyName} / ${state.anchor.projectName} for ${state.anchor.serviceCategory}.`,
    contextLines: [
      `Property: ${state.anchor.propertyName} (${state.anchor.propertyMeta}).`,
      `Project: ${state.anchor.projectName} / ${state.anchor.projectType}.`,
      `Sites or areas: ${state.anchor.sitesAreas || 'To be confirmed before issue'}.`,
      `Target start: ${state.anchor.targetStartDate || 'To be confirmed'} / Contract period: ${state.anchor.contractPeriod || 'To be confirmed'}.`,
      `Current vendor or shortlist context: ${state.anchor.currentVendor || focusVendor.name}; ${state.anchor.shortlistContext || peerNames.join(', ') || 'shortlist to be confirmed'}.`,
    ],
    scopeLines: [
      ...serviceLines.map(line => `Service: ${line}`),
      ...inclusionLines.map(line => `Inclusion: ${line}`),
      ...exclusionLines.map(line => `Exclusion/assumption: ${line}`),
      `Volume or asset basis: ${state.volume || extracted.volume || 'Vendor to price against provided BOQ/scope schedule.'}`,
      `Timeline: ${state.timeline || extracted.timeline || 'Vendor to provide mobilisation and delivery programme.'}`,
    ].slice(0, 12),
    responseFields: [
      'Company profile and nominated account lead.',
      'Commercial offer with fixed rates, variable rates, assumptions, and validity period.',
      'Mobilisation plan with resource counts and start-date constraints.',
      'SLA commitment by priority level and escalation route.',
      'Exclusions, client dependencies, and optional alternates.',
      'Comparable references for similar property/project scope.',
    ],
    mandatoryDocuments: requiredDocs.length ? requiredDocs : ['Trade licence', 'Insurance certificates', 'HSE plan', 'Resource plan', 'Comparable references'],
    slaEvidence: splitRfqLines(state.sla || extracted.sla || template?.requirementDefaults.join('\n') || 'Vendor to propose measurable SLA and response commitments.')
      .concat(splitRfqLines(state.evidence || extracted.evidence || 'Completion evidence must include photos, timestamp, asset/location reference, work summary, and supervisor sign-off.'))
      .slice(0, 8),
    commercialTable: [
      'Line item / service package',
      'Unit of measure and quantity basis',
      'Unit rate and total price',
      'Mobilisation or one-off cost',
      'Emergency or out-of-hours rate',
      'Exclusions, provisional sums, and validity period',
    ],
    scoringMatrix,
    submissionRules: [
      'Bidders must answer every response field and identify any non-compliance clearly.',
      'Commercials must remain valid for at least 60 days unless procurement sets a different validity period.',
      'Clarification questions must be submitted before the clarification deadline stated by procurement.',
      'Late or incomplete submissions can be excluded from evaluation.',
    ],
    actions: ['Copy RFQ', 'Save to workbench', 'Prepare vendor invite'],
  };
}

function buildRfqCopilotResult(rfqPackage: RfqGeneratedPackage): VendorCopilotResult {
  return {
    action: 'rfq',
    title: rfqPackage.title,
    status: rfqPackage.status,
    summary: rfqPackage.summary,
    primaryCta: 'Prepare vendor invite',
    sections: [
      { title: 'Project anchor', lines: rfqPackage.contextLines.slice(0, 5) },
      { title: 'Scope and requirements', lines: [...rfqPackage.scopeLines.slice(0, 4), ...rfqPackage.slaEvidence.slice(0, 2)] },
      { title: 'Evaluation', lines: rfqPackage.scoringMatrix.map(item => `${item.label}: ${item.weight}%`).concat(rfqPackage.submissionRules.slice(0, 2)) },
    ],
  };
}

function formatRfqPackageText(rfqPackage: RfqGeneratedPackage): string {
  return [
    rfqPackage.title,
    rfqPackage.summary,
    '',
    'Project / Property Context',
    ...rfqPackage.contextLines,
    '',
    'Scope of Services',
    ...rfqPackage.scopeLines,
    '',
    'Vendor Response Fields',
    ...rfqPackage.responseFields,
    '',
    'Mandatory Documents',
    ...rfqPackage.mandatoryDocuments,
    '',
    'SLA and Evidence Requirements',
    ...rfqPackage.slaEvidence,
    '',
    'Commercial Pricing Table',
    ...rfqPackage.commercialTable,
    '',
    'Evaluation Scoring Matrix',
    ...rfqPackage.scoringMatrix.map(item => `${item.label}: ${item.weight}%`),
    '',
    'Submission and Clarification Rules',
    ...rfqPackage.submissionRules,
  ].join('\n');
}

const initialVendorWizardForm: VendorWizardForm = {
  name: 'Nexus Facilities Services',
  category: 'FM & HVAC',
  sites: 'Bayz 102, Lawnz Residences',
  address: 'Business Bay Service Hub',
  city: 'Dubai',
  country: 'UAE',
  pocName: 'Aisha Rahman',
  pocTitle: 'Account Director',
  pocPhone: '+971 55 420 1188',
  pocEmail: 'aisha.rahman@nexusfm.ae',
  activeContracts: '1',
  contractExpiry: 'Mar 2027',
  slaCompliance: '88',
  firstTimeFixRate: '84',
  avgResolutionMin: '44',
  evidenceCompliance: '90',
  repeatFailureRate: '6',
  jobsLast30d: '42',
  avgCostPerJob: '455',
  trend: 'flat',
  dependencyRisk: 'Medium',
  dependencyNote: 'Primary HVAC backup coverage across two mixed-use residential properties.',
  predictedRisk30d: '16',
  contractFlags: 'Onboarding evidence pack due within 14 days',
};

function formatDocumentSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function cleanDocumentName(name: string): string {
  return name
    .replace(/\.[^.]+$/, '')
    .replace(/\b(contract|vendor|profile|proposal|quote|rfq|sla|insurance|license|trade|certificate|signed|final|copy)\b/gi, ' ')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractLabeledValue(text: string, labels: string[]): string | null {
  for (const label of labels) {
    const pattern = new RegExp(`${label}\\s*[:\\-]\\s*([^\\n\\r;|]+)`, 'i');
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim().replace(/\s+/g, ' ');
  }
  return null;
}

function extractNumberValue(text: string, labels: string[]): string | null {
  const raw = extractLabeledValue(text, labels);
  const match = raw?.match(/(\d{1,4}(?:,\d{3})?)/);
  return match?.[1]?.replace(/,/g, '') ?? null;
}

function extractMoneyValue(text: string, labels: string[]): number | null {
  const raw = extractLabeledValue(text, labels) ?? text.match(/(?:AED|د\.إ)\s*([0-9][0-9,]*)/i)?.[1] ?? null;
  const match = raw?.match(/(\d{2,9}(?:,\d{3})?)/);
  const value = Number(match?.[1]?.replace(/,/g, ''));
  return Number.isFinite(value) && value > 0 ? value : null;
}

function extractDateValue(text: string, labels: string[]): string | null {
  const raw = extractLabeledValue(text, labels)
    ?? text.match(/\b(?:delivery|mobilization|handover|award deadline|lead time)\b[^:\n\r]*[:\-]?\s*([0-3]?\d[\/\-. ][0-1]?\d[\/\-. ]20\d{2}|20\d{2}[\/\-. ][0-1]?\d[\/\-. ][0-3]?\d|[0-3]?\d\s+[A-Za-z]{3,9}\s+20\d{2})/i)?.[1]
    ?? null;
  return raw?.trim().replace(/\s+/g, ' ') ?? null;
}

function parseComparableDate(value: string | null) {
  if (!value) return null;
  const normalized = value.replace(/\./g, '/').replace(/-/g, '/');
  const dmy = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(20\d{2})$/);
  const parsed = dmy
    ? new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]))
    : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatProcurementMoney(value: number) {
  if (Math.abs(value) >= 1_000_000) return `AED ${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
  return `AED ${value.toLocaleString()}`;
}

function inferVendorCategory(text: string): string | null {
  const lower = text.toLowerCase();
  if (/(hvac|chiller|cooling|air conditioning)/.test(lower)) return 'FM & HVAC';
  if (/(electrical|power|lv|switchgear)/.test(lower)) return 'FM & Electrical';
  if (/(mep|mechanical|plumbing|systems)/.test(lower)) return 'MEP & Systems';
  if (/(cleaning|soft fm|housekeeping|janitorial)/.test(lower)) return 'Cleaning & Soft FM';
  if (/(security|guard|cctv|access control)/.test(lower)) return 'Security';
  if (/(landscaping|irrigation|horticulture)/.test(lower)) return 'Landscaping';
  if (/(fire|alarm|safety|civil defense)/.test(lower)) return 'Fire & Safety';
  if (/(lift|elevator|escalator)/.test(lower)) return 'Elevators & Lifts';
  if (/(civil|fit out|engineering|structure)/.test(lower)) return 'Engineering & Civil';
  return null;
}

function buildVendorAiDraft(
  current: VendorWizardForm,
  documents: VendorSetupDocument[],
  notes: string,
): { form: VendorWizardForm; extractions: VendorAiExtraction[] } {
  const combined = [notes, ...documents.map(doc => `${doc.name}\n${doc.content}`)].filter(Boolean).join('\n');
  const firstDocumentName = documents[0]?.name ? cleanDocumentName(documents[0].name) : '';
  const next: VendorWizardForm = { ...current };
  const extractions: VendorAiExtraction[] = [];
  const setField = (field: keyof VendorWizardForm, value: string | null, label: string, source: string) => {
    if (!value) return;
    next[field] = value as never;
    extractions.push({ label, value, source });
  };

  setField('name', extractLabeledValue(combined, ['vendor name', 'supplier name', 'company name', 'contractor']) || firstDocumentName || null, 'Vendor name', 'Profile');
  setField('category', inferVendorCategory(combined), 'Category', 'Scope');
  setField('sites', extractLabeledValue(combined, ['sites covered', 'properties', 'locations', 'site scope', 'service locations']), 'Sites covered', 'Scope');
  setField('contractExpiry', extractLabeledValue(combined, ['contract expiry', 'expiry date', 'renewal date', 'valid until']), 'Contract expiry', 'Contract');
  setField('pocName', extractLabeledValue(combined, ['primary contact', 'contact person', 'account manager', 'contact name']), 'Primary contact', 'Contacts');
  setField('pocTitle', extractLabeledValue(combined, ['contact title', 'designation', 'job title']), 'Contact title', 'Contacts');

  const email = combined.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? null;
  const phone = combined.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0]?.replace(/\s+/g, ' ') ?? null;
  setField('pocEmail', email, 'Email', 'Contacts');
  setField('pocPhone', phone, 'Phone', 'Contacts');

  setField('slaCompliance', extractNumberValue(combined, ['sla compliance', 'sla', 'service level']), 'SLA compliance', 'Performance');
  setField('firstTimeFixRate', extractNumberValue(combined, ['first time fix', 'first-time fix', 'ftf']), 'First-time fix', 'Performance');
  setField('avgResolutionMin', extractNumberValue(combined, ['average resolution minutes', 'avg resolution minutes', 'resolution time']), 'Resolution minutes', 'Performance');
  setField('evidenceCompliance', extractNumberValue(combined, ['evidence compliance', 'photo evidence', 'closure evidence']), 'Evidence compliance', 'Compliance');
  setField('repeatFailureRate', extractNumberValue(combined, ['repeat failure', 'repeat failures', 'repeat rate']), 'Repeat failure', 'Performance');
  setField('jobsLast30d', extractNumberValue(combined, ['jobs last 30 days', 'monthly jobs', 'work orders']), 'Jobs last 30 days', 'Volume');
  setField('avgCostPerJob', extractNumberValue(combined, ['avg cost per job', 'average cost per job', 'rate per job', 'cost per job']), 'Avg cost / job', 'Commercial');
  setField('activeContracts', extractNumberValue(combined, ['active contracts', 'contracts']), 'Active contracts', 'Contract');

  const lower = combined.toLowerCase();
  if (/critical dependency|single vendor|sole provider/.test(lower)) {
    next.dependencyRisk = 'Critical';
    extractions.push({ label: 'Dependency risk', value: 'Critical', source: 'Risk' });
  } else if (/high dependency|limited backup|specialist/.test(lower)) {
    next.dependencyRisk = 'High';
    extractions.push({ label: 'Dependency risk', value: 'High', source: 'Risk' });
  } else if (/low dependency|backup available|multi vendor/.test(lower)) {
    next.dependencyRisk = 'Low';
    extractions.push({ label: 'Dependency risk', value: 'Low', source: 'Risk' });
  }

  if (/declining|late|breach|non.?compliant/.test(lower)) next.trend = 'down';
  if (/improving|preferred|excellent|strong/.test(lower)) next.trend = 'up';

  const flags = [
    /insurance/i.test(combined) ? null : 'Insurance certificate not detected',
    /trade license|licence/i.test(combined) ? null : 'Trade license not detected',
    /sla|service level/i.test(combined) ? null : 'SLA evidence should be confirmed',
  ].filter(Boolean);
  if (flags.length) {
    next.contractFlags = flags.join('; ');
    extractions.push({ label: 'Contract flags', value: `${flags.length} checks`, source: 'Compliance' });
  }

  if (!next.dependencyNote || next.dependencyNote === initialVendorWizardForm.dependencyNote) {
    next.dependencyNote = `${next.dependencyRisk} dependency risk across ${parseVendorSites(next.sites).length || 1} site scope based on uploaded onboarding documents.`;
  }

  return { form: next, extractions };
}

function buildQuoteAnalysis(documents: VendorSetupDocument[], notes: string, assignment: ProcurementAssignmentContext): QuoteAnalysis {
  const noteBlocks = notes
    .split(/\n\s*(?:---+|quote\s+\d+|vendor\s+quote)\s*\n/i)
    .map(block => block.trim())
    .filter(Boolean);
  const sources = [
    ...documents.map(doc => ({ id: doc.id, name: doc.name, content: doc.content, fromFile: true })),
    ...noteBlocks.map((block, index) => ({ id: `note-${index}`, name: `Pasted quote ${index + 1}`, content: block, fromFile: false })),
  ];
  const requiredDate = parseComparableDate(assignment.requiredDeliveryDate);
  const items = sources.map((source, index) => {
    const hasExtractableText = source.content.trim().length > 20;
    const text = `${source.name}\n${source.content}`;
    const vendorName = extractLabeledValue(text, ['vendor name', 'supplier name', 'company name', 'contractor', 'vendor'])
      || cleanDocumentName(source.name)
      || `${assignment.packageName} bidder ${index + 1}`;
    const amount = hasExtractableText
      ? (extractMoneyValue(text, ['total', 'quote total', 'quoted price', 'price', 'amount', 'commercial offer', 'annual value', 'contract value', 'package value']) ?? null)
      : null;
    const slaValue = Number(extractNumberValue(text, ['sla', 'sla commitment', 'response sla', 'service level']));
    const sla = hasExtractableText && Number.isFinite(slaValue) && slaValue > 0 ? slaValue : null;
    const deliveryDate = hasExtractableText ? extractDateValue(text, ['delivery date', 'required delivery', 'mobilization date', 'mobilisation date', 'lead time', 'award deadline', 'handover date']) : null;
    const deliveryParsed = parseComparableDate(deliveryDate);
    const deliveryLate = Boolean(requiredDate && deliveryParsed && deliveryParsed.getTime() > requiredDate.getTime());
    const warranty = hasExtractableText
      ? extractLabeledValue(text, ['warranty', 'defect liability', 'guarantee']) || (text.toLowerCase().includes('warranty') ? 'Included' : 'Not clearly stated')
      : 'Not clearly stated';
    const exclusions = hasExtractableText
      ? extractLabeledValue(text, ['exclusions', 'excluded', 'not included']) || (text.toLowerCase().includes('parts') ? 'Parts to be confirmed' : 'No major exclusions detected')
      : 'Needs readable quote text';
    const evidence = /photo|evidence|report|completion|close.?out/i.test(text) ? 8 : 0;
    const warrantyBonus = warranty === 'Not clearly stated' ? 0 : 4;
    const exclusionPenalty = /not included|excluded|tbd|to be confirmed/i.test(exclusions) ? 7 : 0;
    const missingPenalty = (hasExtractableText ? 0 : 22) + (amount === null ? 14 : 0) + (sla === null ? 8 : 0) + (deliveryDate === null ? 8 : 0);
    const overBudgetRatio = amount === null ? 0 : Math.max(0, (amount - assignment.budgetAllowance) / Math.max(assignment.budgetAllowance, 1));
    const pricePenalty = Math.min(22, overBudgetRatio * 70);
    const deliveryPenalty = deliveryLate ? 10 : 0;
    const score = Math.max(20, Math.min(98, Math.round(54 + Math.min(22, (sla ?? 75) / 5) + evidence + warrantyBonus - exclusionPenalty - pricePenalty - deliveryPenalty - missingPenalty)));
    const risk: QuoteAnalysisItem['risk'] = score >= 78 ? 'Low' : score >= 62 ? 'Medium' : 'High';
    const missingFields = [
      amount === null ? 'Price' : null,
      sla === null ? 'SLA commitment' : null,
      deliveryDate === null ? 'Delivery / award date' : null,
      warranty === 'Not clearly stated' ? 'Warranty' : null,
      /not included|tbd|to be confirmed/i.test(exclusions) ? 'Exclusions detail' : null,
      evidence === 0 ? 'Evidence commitment' : null,
    ].filter((field): field is string => Boolean(field));
    const extractionStatus: QuoteExtractionStatus = !hasExtractableText
      ? 'Unsupported / no text'
      : amount === null
        ? 'Missing price'
        : sla === null
          ? 'Missing SLA'
          : deliveryDate === null
            ? 'Missing delivery'
            : missingFields.length > 0
              ? 'Needs clarification'
              : 'Read';
    const clarificationQuestions = !hasExtractableText
      ? ['Upload a text-readable quote PDF/DOC/XLSX or paste the quote terms manually so AI can extract commercial, delivery, and evidence commitments.']
      : [
        amount === null ? `Confirm total commercial offer for ${assignment.packageName} and whether the rate is fixed or provisional.` : null,
        sla === null ? 'Confirm committed SLA percentage and response-time basis.' : null,
        deliveryDate === null ? `Confirm delivery or mobilization date against the ${assignment.requiredDeliveryDate} requirement.` : null,
        deliveryLate ? `Delivery date appears later than required ${assignment.requiredDeliveryDate}; confirm mitigation or accelerated delivery.` : null,
        warranty === 'Not clearly stated' ? 'Confirm warranty or defect liability period.' : null,
        /not included|tbd|to be confirmed/i.test(exclusions) ? 'Itemize exclusions, provisional sums, and parts/material assumptions.' : null,
        evidence === 0 ? `Confirm evidence commitments: ${assignment.evidenceRequirements.join(', ')}.` : null,
      ].filter((question): question is string => Boolean(question));
    const commercialDelta = amount === null ? null : amount - assignment.budgetAllowance;
    const recommendationReason = !hasExtractableText
      ? 'Cannot score reliably until quote text is extracted or pasted.'
      : risk === 'Low'
        ? `Strong fit against ${assignment.packageName} cost, delivery, evidence, and compliance requirements.`
        : risk === 'Medium'
          ? 'Commercially usable but needs clarification before award.'
          : 'Do not award until missing commitments, exclusions, and delivery risk are resolved.';
    const nextActions = [
      risk === 'Low' ? 'Prepare award brief' : null,
      missingFields.length > 0 ? 'Draft clarification email' : null,
      commercialDelta !== null && commercialDelta > 0 ? 'Create negotiation points' : null,
      risk !== 'Low' ? 'Hold award decision' : null,
    ].filter((action): action is string => Boolean(action));
    const finding = !hasExtractableText
      ? 'No extractable quote text was found. Paste the quote terms or upload a readable document.'
      : amount === null
        ? 'Price was not detected. Review this quote before award.'
        : sla === null
          ? 'SLA was not detected. Clarify service commitment before award.'
          : deliveryDate === null
            ? 'Delivery date was not detected. Clarify programme commitment before award.'
            : deliveryLate
              ? 'Delivery appears later than the required package date.'
              : risk === 'Low'
                ? 'Strong commercial and programme fit for shortlisting.'
                : risk === 'Medium'
                  ? 'Usable quote, but clarify scope or commercial assumptions.'
                  : 'High-risk quote unless exclusions and commitments improve.';
    return {
      id: source.id,
      vendorName,
      amount,
      sla,
      deliveryDate,
      warranty,
      exclusions,
      extractionStatus,
      missingFields,
      clarificationQuestions,
      commercialDelta,
      recommendationReason,
      nextActions,
      score,
      risk,
      finding,
    };
  }).sort((a, b) => b.score - a.score);
  const winner = items[0];
  const amounts = items.map(item => item.amount).filter((amount): amount is number => amount !== null);
  const highestAmount = amounts.length ? Math.max(...amounts) : 0;
  const lowestAmount = amounts.length ? Math.min(...amounts) : 0;
  const savings = winner.amount === null ? 0 : Math.max(0, highestAmount - winner.amount);
  const commercialSpread = amounts.length >= 2 ? highestAmount - lowestAmount : null;
  const winnerLowestPremium = winner.amount === null || amounts.length < 2 ? null : winner.amount - lowestAmount;
  const clarificationQuestions = items.flatMap(item => item.clarificationQuestions.map(question => `${item.vendorName}: ${question}`)).slice(0, 8);
  const riskConditions = [
    items.some(item => item.extractionStatus === 'Unsupported / no text') ? 'At least one quote has no extractable text.' : null,
    items.some(item => item.amount === null) ? 'At least one quote is missing a commercial offer.' : null,
    items.some(item => item.sla === null) ? 'At least one quote is missing an SLA commitment.' : null,
    items.some(item => item.deliveryDate === null) ? 'At least one quote is missing delivery or mobilization date.' : null,
    items.some(item => item.risk === 'High') ? 'High-risk quote present; do not award without clarification.' : null,
    winner.missingFields.length > 0 ? `Recommended bidder still needs confirmation: ${winner.missingFields.join(', ')}.` : null,
  ].filter((condition): condition is string => Boolean(condition));
  const nextActions = [
    'Prepare Award Brief',
    clarificationQuestions.length > 0 ? 'Draft Clarification Email' : null,
    items.some(item => item.commercialDelta !== null && item.commercialDelta > 0) ? 'Create Negotiation Points' : null,
    'Link Result To ProjectCommand',
  ].filter((action): action is string => Boolean(action));
  return {
    assignment,
    winner,
    items,
    savings,
    summary: winner.amount === null
      ? `${winner.vendorName} is the strongest readable quote for ${assignment.packageName} with a ${winner.score}/100 comparison score, but price still needs confirmation.`
      : `${winner.vendorName} is the recommended quote for ${assignment.packageName} with a ${winner.score}/100 comparison score and ${formatProcurementMoney(winner.amount)} commercial offer.`,
    findings: [
      amounts.length >= 2
        ? winnerLowestPremium && winnerLowestPremium > 0
          ? `${winner.vendorName} is ${formatProcurementMoney(winnerLowestPremium)} above the lowest quote; award rationale depends on delivery, warranty, evidence, and lower execution risk.`
          : `Selecting the recommended quote is ${formatProcurementMoney(savings)} below the highest readable offer.`
        : 'Commercial spread needs at least two readable prices before final award.',
      `${winner.vendorName} ${winner.deliveryDate === null ? 'needs delivery confirmation' : `commits delivery/mobilization around ${winner.deliveryDate}`} against required ${assignment.requiredDeliveryDate}.`,
      `${winner.vendorName} ${winner.sla === null ? 'needs SLA confirmation' : `offers ${winner.sla}% SLA commitment`} with ${winner.warranty.toLowerCase()} warranty position.`,
      items.some(item => item.risk === 'High') ? 'At least one quote carries high clarification risk before award.' : 'No high-risk quote blockers were detected in the submitted set.',
    ],
    commercialSpread,
    riskConditions,
    clarificationQuestions,
    nextActions,
  };
}

function buildQuoteActionArtifact(action: string, analysis: QuoteAnalysis): QuoteActionArtifact {
  const { assignment, winner } = analysis;
  const competitorLines = analysis.items.map(item => `${item.vendorName}: ${item.score}/100, ${item.amount === null ? 'price missing' : formatProcurementMoney(item.amount)}, ${item.sla === null ? 'SLA missing' : `${item.sla}% SLA`}, ${item.deliveryDate ?? 'delivery missing'}, ${item.risk} risk.`);
  if (action === 'Prepare Award Brief') {
    return {
      title: 'Award Brief Prepared',
      status: 'Draft prepared',
      body: `${winner.vendorName} is recommended for ${assignment.packageName} subject to resolving listed conditions. The recommendation is based on package budget, delivery, SLA, warranty, exclusions, evidence readiness, and award risk.`,
      lines: [
        `Assigned to: ${assignment.propertyName} / ${assignment.projectName} / ${assignment.packageName}`,
        `Recommended bidder: ${winner.vendorName}`,
        `Score: ${winner.score}/100 (${winner.risk} risk)`,
        winner.amount === null ? 'Commercial offer: requires confirmation' : `Commercial offer: ${formatProcurementMoney(winner.amount)} vs budget ${formatProcurementMoney(assignment.budgetAllowance)}`,
        winner.deliveryDate === null ? 'Delivery: requires confirmation' : `Delivery / mobilization: ${winner.deliveryDate} vs required ${assignment.requiredDeliveryDate}`,
        winner.sla === null ? 'SLA: requires confirmation' : `SLA: ${winner.sla}%`,
        analysis.commercialSpread === null ? 'Commercial spread: incomplete until all prices are readable' : `Commercial spread: ${formatProcurementMoney(analysis.commercialSpread)}`,
        `Award conditions: ${analysis.riskConditions.length ? analysis.riskConditions.join(' ') : 'No blocking clarification conditions detected.'}`,
      ],
    };
  }
  if (action === 'Draft Clarification Email') {
    return {
      title: 'Clarification Email Draft',
      status: 'Draft prepared',
      body: `Draft clarification request for ${assignment.packageName} bidders. No email is sent from this screen.`,
      lines: analysis.clarificationQuestions.length
        ? analysis.clarificationQuestions
        : ['Confirm commercial validity, delivery date, SLA basis, warranty, exclusions, and evidence commitments before award.'],
    };
  }
  if (action === 'Create Negotiation Points') {
    return {
      title: 'Negotiation Points Created',
      status: 'Ready for manager review',
      body: `Use the strongest compliant offer as the commercial anchor while protecting ${assignment.packageName} delivery and evidence quality.`,
      lines: [
        `Package budget guardrail: ${formatProcurementMoney(assignment.budgetAllowance)}.`,
        `Required delivery / award deadline: ${assignment.requiredDeliveryDate}.`,
        ...competitorLines,
        'Ask higher-priced bidders to match the strongest commercial offer without reducing delivery, evidence, warranty, or compliance commitments.',
      ],
    };
  }
  return {
    title: 'ProjectCommand Link Ready',
    status: 'Ready to link',
    body: `This quote comparison is ready to attach to ${assignment.propertyName} / ${assignment.projectName} / ${assignment.packageName}.`,
    lines: [
      'Source: user-selected procurement context.',
      'Quote data: uploaded files and pasted quote text only.',
      ...competitorLines,
    ],
  };
}

function numeric(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseVendorSites(raw: string): string[] {
  return raw.split(',').map(site => site.trim()).filter(Boolean);
}

function parseVendorFlags(raw: string): VendorIntelData['contractFlags'] {
  return raw
    .split(';')
    .map(flag => flag.trim())
    .filter(Boolean)
    .map(description => ({ type: 'warning' as const, description }));
}

function vendorWizardScore(form: VendorWizardForm): number {
  return computeVendorScore({
    slaCompliance: numeric(form.slaCompliance, 85),
    firstTimeFixRate: numeric(form.firstTimeFixRate, 80),
    avgResolutionMin: numeric(form.avgResolutionMin, 50),
    evidenceCompliance: numeric(form.evidenceCompliance, 85),
    avgCostPerJob: numeric(form.avgCostPerJob, 450),
  });
}

function buildVendorInsights(form: VendorWizardForm, score: number): VendorIntelData['insights'] {
  const risk = classifyVendorRisk(score);
  return [
    `${form.name} is being onboarded with a starting vendor score of ${score}/100 and ${risk} classification.`,
    `SLA baseline is ${numeric(form.slaCompliance, 85)}% with ${numeric(form.firstTimeFixRate, 80)}% first-time fix across ${numeric(form.jobsLast30d, 20)} expected monthly jobs.`,
    `Evidence compliance is set at ${numeric(form.evidenceCompliance, 85)}%, so the vendor will be monitored for photo, report, and closure proof quality.`,
    `${form.dependencyRisk} dependency risk has been assigned for ${parseVendorSites(form.sites).join(', ') || 'selected properties'}.`,
  ];
}

function buildVendorRecommendations(form: VendorWizardForm, score: number): VendorIntelData['recommendations'] {
  if (score >= 78) {
    return [
      { title: 'Approve preferred onboarding', detail: 'Initial KPI baseline supports preferred rotation once contract evidence is complete.', action: 'review' },
      { title: 'Lock service rate during onboarding', detail: `AED ${numeric(form.avgCostPerJob, 450)}/job is within target range. Confirm rate card before first work package allocation.`, action: 'renegotiate' },
    ];
  }
  if (score >= 58) {
    return [
      { title: 'Start with controlled scope', detail: 'Use a 30-day probation window and monitor SLA, evidence, and repeat failures before expanding coverage.', action: 'review' },
      { title: 'Assign backup vendor coverage', detail: 'Dependency should be managed until the vendor proves performance across the first job cycle.', action: 'reassign' },
    ];
  }
  return [
    { title: 'Require onboarding review before allocation', detail: 'Baseline indicators are below threshold. Do not assign critical work until corrective commitments are agreed.', action: 'review' },
    { title: 'Limit scope to low-risk work', detail: 'Use only non-critical jobs until SLA and evidence metrics improve.', action: 'limit' },
  ];
}

function buildVendorFromWizard(form: VendorWizardForm): VendorIntelData {
  const score = vendorWizardScore(form);
  const flags = parseVendorFlags(form.contractFlags);
  const id = `VND-${Date.now().toString().slice(-6)}`;
  return buildDefaultVendor({
    id,
    name: form.name.trim() || 'New Vendor',
    category: form.category,
    trend: form.trend,
    slaCompliance: numeric(form.slaCompliance, 85),
    firstTimeFixRate: numeric(form.firstTimeFixRate, 80),
    avgResolutionMin: numeric(form.avgResolutionMin, 50),
    evidenceCompliance: numeric(form.evidenceCompliance, 85),
    repeatFailureRate: numeric(form.repeatFailureRate, 8),
    avgCostPerJob: numeric(form.avgCostPerJob, 450),
    activeContracts: numeric(form.activeContracts, 1),
    contractExpiry: form.contractExpiry || 'Dec 2026',
    sites: parseVendorSites(form.sites),
    jobsLast30d: numeric(form.jobsLast30d, 20),
    insights: buildVendorInsights(form, score),
    anomaly: score < 58 ? 'Onboarding risk: baseline score is below Watchlist threshold. Review before assigning critical work.' : null,
    contractFlags: flags,
    predictedRisk30d: numeric(form.predictedRisk30d, 20),
    projectedTrend: form.trend,
    recommendations: buildVendorRecommendations(form, score),
    dependencyRisk: form.dependencyRisk,
    dependencyNote: form.dependencyNote || `${form.dependencyRisk} dependency risk across ${parseVendorSites(form.sites).length || 1} site scope.`,
    address: { street: form.address, city: form.city, country: form.country },
    poc: { name: form.pocName, title: form.pocTitle, phone: form.pocPhone, email: form.pocEmail },
  });
}

function riskColor(level: VendorRiskLevel): string {
  if (level === 'Preferred') return '#38D98A';
  if (level === 'Watchlist') return '#FF9B38';
  return '#FF4B4B';
}

function riskBg(level: VendorRiskLevel): string {
  if (level === 'Preferred') return 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400';
  if (level === 'Watchlist') return 'bg-amber-500/10 border-amber-500/25 text-amber-400';
  return 'bg-red-500/10 border-red-500/25 text-red-400';
}

function scoreColor(score: number): string {
  if (score >= 80) return '#38D98A';
  if (score >= 65) return '#FF9B38';
  return '#FF4B4B';
}

function TrendIcon({ trend, size = 13 }: { trend: VendorTrend; size?: number }) {
  if (trend === 'up') return <TrendingUp size={size} className="text-emerald-400" />;
  if (trend === 'down') return <TrendingDown size={size} className="text-red-400" />;
  return <Minus size={size} className="text-amber-400" />;
}

function dependencyColor(level: string): string {
  if (level === 'Low') return '#38D98A';
  if (level === 'Medium') return '#FF9B38';
  if (level === 'High') return '#FF4B4B';
  return '#C026D3';
}

function flagIcon(type: string) {
  if (type === 'breach') return <XCircle size={11} className="text-red-400 flex-shrink-0 mt-0.5" />;
  if (type === 'missing') return <FileWarning size={11} className="text-amber-400 flex-shrink-0 mt-0.5" />;
  return <AlertTriangle size={11} className="text-amber-300 flex-shrink-0 mt-0.5" />;
}

function actionColor(action: string): string {
  if (action === 'reassign') return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
  if (action === 'renegotiate') return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
  if (action === 'review') return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
  return 'text-red-400 border-red-500/30 bg-red-500/10';
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="h-1 bg-[#0A1628] rounded-full overflow-hidden w-16">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, (value / max) * 100)}%` }}
        transition={{ duration: 0.5 }}
        className="h-full rounded-full"
        style={{ background: color }}
      />
    </div>
  );
}

function ScoreRing({ score, size = 52 }: { score: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = scoreColor(score);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(46,127,255,0.12)" strokeWidth={5} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={5} strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        initial={{ strokeDasharray: `0 ${circ}` }}
        animate={{ strokeDasharray: `${dash} ${circ}` }}
        transition={{ duration: 0.7 }}
      />
      <text
        x={size / 2} y={size / 2 + 1}
        textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize={13} fontWeight={700}
        style={{ transform: `rotate(90deg)`, transformOrigin: `${size / 2}px ${size / 2}px`, fontFamily: 'Space Grotesk, sans-serif' }}
      >
        {score}
      </text>
    </svg>
  );
}

interface DetailSectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function DetailSection({ icon, title, children }: DetailSectionProps) {
  return (
    <div className="bg-[#07111F] border border-[rgba(46,127,255,0.14)] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3.5">
        <div className="w-6 h-6 rounded-lg bg-[#2E7FFF]/15 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <span className="text-[10px] font-bold text-[#2E7FFF] uppercase tracking-widest">{title}</span>
        <div className="flex-1 h-px bg-[rgba(46,127,255,0.12)]" />
      </div>
      {children}
    </div>
  );
}

type VendorMetricName =
  | 'Vendor Score'
  | 'SLA Compliance'
  | 'First-Time Fix'
  | 'Avg Resolution'
  | 'Evidence Compliance'
  | 'Active Contracts'
  | 'Jobs Last 30d'
  | 'Avg Cost/Job';

type VendorMetricInsight = {
  metricName: VendorMetricName;
  valueLabel: string;
  status: 'positive' | 'monitor' | 'critical';
  summary: string;
  rationale: string[];
  interpretation: string;
  recommendation: string;
};

type VendorCopilotAction = 'rfq' | 'compare' | 'background' | 'price' | 'negotiation';

type VendorCopilotResult = {
  action: VendorCopilotAction;
  title: string;
  status: string;
  summary: string;
  primaryCta: string;
  sections: { title: string; lines: string[] }[];
};

function formatVendorAction(action: VendorCopilotAction): string {
  return {
    rfq: 'RFQ builder opened',
    compare: 'Quote comparison intake opened',
    background: 'Background check completed',
    price: 'Price analysis completed',
    negotiation: 'Action pack prepared',
  }[action];
}

function buildVendorCopilotResult(vendor: VendorIntelData, peers: VendorIntelData[], action: VendorCopilotAction): VendorCopilotResult {
  const score = computeVendorScore(vendor);
  const risk = classifyVendorRisk(score);
  const peerAvgCost = Math.round(peers.reduce((sum, peer) => sum + peer.avgCostPerJob, 0) / Math.max(1, peers.length));
  const costDelta = vendor.avgCostPerJob - peerAvgCost;
  const dueDate = '7 working days';

  if (action === 'rfq') {
    return {
      action,
      title: 'RFQ builder',
      status: 'Project anchor required',
      summary: 'Start with the property, project, service category, and sourcing mode before generating the RFQ review package.',
      primaryCta: 'Open RFQ wizard',
      sections: [
        {
          title: 'Start with',
          lines: [
            'Select the property and project this procurement supports.',
            `Confirm the service category, starting from ${vendor.category}.`,
            'Choose whether to tell AI, use a template, or upload/paste scope documents.',
          ],
        },
        {
          title: 'Then define',
          lines: [
            'Scope, inclusions, exclusions, volumes, and delivery timeline.',
            'SLA, evidence, compliance, insurance, HSE, and mobilisation requirements.',
            'Editable scoring weights for price, SLA, quality, compliance, capacity, and risk.',
          ],
        },
        {
          title: 'Output',
          lines: [
            'A complete project-anchored RFQ package for review.',
            'Copy RFQ, save to workbench, and prepare vendor invite actions.',
            'No preloaded RFQ content is inserted; the package is built from user choices, typed scope, templates, or uploaded documents.',
          ],
        },
      ],
    };
  }

  if (action === 'compare') {
    return {
      action,
      title: 'Assigned RFQ quote intake',
      status: 'Procurement context required',
      summary: 'Start by assigning the property, project, and procurement package. AI only compares uploaded supplier quotes or manually pasted quote text against that selected package context.',
      primaryCta: 'Open assigned intake',
      sections: [
        {
          title: 'Step 1 - assign context',
          lines: [
            'Select the property and project this procurement decision belongs to.',
            'Choose the package or scope, such as Facade Systems, MEP, Elevators, Fire Systems, or Fit-out.',
            'Confirm package budget, required delivery or award deadline, and evaluation basis.',
          ],
        },
        {
          title: 'Step 2 - upload quote data',
          lines: [
            'Upload actual PDF, DOC, XLSX, CSV, or TXT quote files.',
            'Paste quote text manually only when a scanned or locked file has no readable text.',
            'Missing price, SLA, delivery, warranty, exclusions, or evidence commitments stay visible as clarification needs.',
          ],
        },
        {
          title: 'Step 3 - compare and act',
          lines: [
            'Rank submitted supplier quotes against the selected package budget, delivery date, evidence rules, and compliance criteria.',
            'Prepare an award brief, clarification request, negotiation points, or ProjectCommand link.',
            'Only submitted quote data is used in the comparison.',
          ],
        },
      ],
    };
  }

  if (action === 'background') {
    return {
      action,
      title: 'Vendor background check',
      status: vendor.contractFlags.length === 0 && vendor.evidenceCompliance >= 88 ? 'No blocking issues found' : 'Review required before expansion',
      summary: `Checked contract flags, documentation quality, dependency risk, and operational behavior for ${vendor.name}.`,
      primaryCta: vendor.contractFlags.length === 0 ? 'Approve controlled sourcing' : 'Request missing documents',
      sections: [
        {
          title: 'Checks completed',
          lines: [
            `Contract flags found: ${vendor.contractFlags.length}.`,
            `Evidence compliance: ${vendor.evidenceCompliance}%.`,
            `Dependency risk: ${vendor.dependencyRisk}.`,
          ],
        },
        {
          title: 'Findings',
          lines: [
            vendor.contractFlags.length > 0 ? vendor.contractFlags.map(flag => flag.description).join(' ') : 'No active breach, missing evidence, or warning flags are recorded.',
            vendor.repeatFailureRate > 10 ? `Repeat failure is elevated at ${vendor.repeatFailureRate}%.` : `Repeat failure is within control at ${vendor.repeatFailureRate}%.`,
            `30-day predicted risk is ${vendor.predictedRisk30d}%.`,
          ],
        },
        {
          title: 'Action required',
          lines: [
            vendor.evidenceCompliance < 88 ? 'Request a complete close-out evidence pack for the next 10 jobs.' : 'Keep standard evidence sampling in place.',
            vendor.dependencyRisk === 'High' || vendor.dependencyRisk === 'Critical' ? 'Prepare a backup vendor before adding scope.' : 'Dependency is manageable for the current site footprint.',
            'Store checked documents against the vendor record before contract renewal.',
          ],
        },
      ],
    };
  }

  if (action === 'price') {
    const annualizedOpportunity = Math.max(0, costDelta) * Math.max(1, vendor.jobsLast30d) * 12;
    return {
      action,
      title: 'Price and value analysis',
      status: costDelta > 0 ? `Potential annual saving: AED ${annualizedOpportunity.toLocaleString()}` : 'Current pricing beats peer average',
      summary: `Analysed average job cost against peer pricing and quality signals so price is not judged in isolation.`,
      primaryCta: costDelta > 0 ? 'Open renegotiation brief' : 'Protect current rate card',
      sections: [
        {
          title: 'Price position',
          lines: [
            `${vendor.name}: AED ${vendor.avgCostPerJob}/job.`,
            `Peer average: AED ${peerAvgCost}/job.`,
            costDelta > 0 ? `Premium: AED ${costDelta}/job.` : `Advantage: AED ${Math.abs(costDelta)}/job below peer average.`,
          ],
        },
        {
          title: 'Value guardrails',
          lines: [
            `First-time fix: ${vendor.firstTimeFixRate}%.`,
            `SLA compliance: ${vendor.slaCompliance}%.`,
            `Evidence compliance: ${vendor.evidenceCompliance}%.`,
          ],
        },
        {
          title: 'Recommendation',
          lines: [
            costDelta > 0 ? `Ask for a rate-card reduction toward AED ${peerAvgCost} while preserving SLA penalties.` : 'Do not push for lower price unless quality remains protected.',
            'Separate labor, materials, emergency call-out, and repeat-visit pricing in the next commercial review.',
            'Use avoidable repeat visits as a credit note trigger.',
          ],
        },
      ],
    };
  }

  return {
    action,
    title: 'Vendor action pack',
    status: 'Ready to issue',
    summary: `Prepared a practical action pack for ${vendor.name} based on risk, pricing, compliance, and service history.`,
    primaryCta: risk === 'Preferred' ? 'Schedule quarterly business review' : 'Issue corrective action plan',
    sections: [
      {
        title: 'Message to vendor',
        lines: [
          `We reviewed your current performance score of ${score}/100, ${vendor.slaCompliance}% SLA compliance, and AED ${vendor.avgCostPerJob}/job average cost.`,
          risk === 'Preferred' ? 'Your current standing supports continued allocation, subject to rate-card confirmation and evidence quality.' : 'Your current standing requires corrective actions before additional critical work is assigned.',
          `Please respond within ${dueDate} with commitments, owners, and dates.`,
        ],
      },
      {
        title: 'Internal approvals',
        lines: [
          'Procurement: validate commercial terms and RFQ requirement.',
          'Operations: confirm site impact and backup vendor coverage.',
          'Compliance: verify licenses, insurance, HSE, certifications, and evidence records.',
        ],
      },
      {
        title: 'Tracked outcomes',
        lines: [
          `Raise SLA to at least ${Math.max(88, vendor.slaCompliance + 3)}%.`,
          `Reduce repeat failure below ${Math.min(8, Math.max(4, vendor.repeatFailureRate - 2))}%.`,
          `Hold average job cost at or below AED ${Math.min(vendor.avgCostPerJob, peerAvgCost)}.`,
        ],
      },
    ],
  };
}

function vendorMetricStatus(metricName: VendorMetricName, value: number, score: number): VendorMetricInsight['status'] {
  if (metricName === 'Avg Resolution') {
    if (value > 60) return 'critical';
    if (value > 45) return 'monitor';
    return 'positive';
  }
  if (metricName === 'Avg Cost/Job') {
    if (value > 620) return 'critical';
    if (value > 500) return 'monitor';
    return 'positive';
  }
  if (metricName === 'Active Contracts' || metricName === 'Jobs Last 30d') return value > 0 ? 'positive' : 'monitor';
  if (metricName === 'Vendor Score') {
    if (score < 65) return 'critical';
    if (score < 80) return 'monitor';
    return 'positive';
  }
  if (value < 75) return 'critical';
  if (value < 88) return 'monitor';
  return 'positive';
}

function buildVendorMetricInsight(vendor: VendorIntelData, metricName: VendorMetricName): VendorMetricInsight {
  const score = computeVendorScore(vendor);
  const riskLevel = classifyVendorRisk(score);
  const peerCost = Number(vendor.costTrend[vendor.costTrend.length - 1]?.peerAvg ?? 500);
  const statusFrom = (value: number) => vendorMetricStatus(metricName, value, score);

  switch (metricName) {
    case 'Vendor Score':
      return {
        metricName,
        valueLabel: `${score}/100`,
        status: statusFrom(score),
        summary: `${vendor.name} is scoring ${score}/100 and is currently classified as ${riskLevel}.`,
        rationale: [
          `The score blends SLA compliance (${vendor.slaCompliance}%), first-time fix (${vendor.firstTimeFixRate}%), response speed, evidence compliance (${vendor.evidenceCompliance}%), cost, and risk flags.`,
          vendor.trend === 'up' ? 'The trend is improving, so recent delivery is strengthening the score.' : vendor.trend === 'down' ? 'The trend is declining, so recent delivery is pulling the score down.' : 'The trend is stable, with no major movement in the recent score curve.',
          `${vendor.contractFlags.length} contract flag${vendor.contractFlags.length === 1 ? '' : 's'} and ${vendor.repeatFailureRate}% repeat failure rate are included in the risk reading.`,
        ],
        interpretation: score >= 80 ? 'This vendor is a reliable candidate for priority work and broader scope.' : score >= 65 ? 'The vendor remains usable, but targeted controls are needed before expanding scope.' : 'This vendor needs active management before more critical work is assigned.',
        recommendation: score >= 80 ? 'Keep the vendor in preferred rotation and monitor whether the improving trend holds next month.' : score >= 65 ? 'Set a short corrective action plan focused on the weakest score driver.' : 'Limit new assignments, trigger review, and prepare backup capacity for critical jobs.',
      };
    case 'SLA Compliance':
      return {
        metricName,
        valueLabel: `${vendor.slaCompliance}%`,
        status: statusFrom(vendor.slaCompliance),
        summary: `${vendor.name} is closing ${vendor.slaCompliance}% of jobs within SLA.`,
        rationale: [
          vendor.slaCompliance >= 90 ? 'SLA performance is above the preferred vendor threshold.' : 'SLA performance is below preferred threshold and needs closer scheduling control.',
          `${vendor.jobsLast30d} jobs in the last 30 days gives the metric enough activity to be meaningful.`,
          `The 30-day risk forecast is ${vendor.predictedRisk30d}%, so SLA should be read alongside predictive risk.`,
        ],
        interpretation: vendor.slaCompliance >= 90 ? 'Operationally, the vendor is dependable for time-sensitive work.' : 'Late delivery risk may create resident escalation and contract pressure.',
        recommendation: vendor.slaCompliance >= 90 ? 'Keep allocating high-priority jobs while watching workload concentration.' : 'Review open jobs daily and reserve critical jobs for vendors with stronger SLA performance.',
      };
    case 'First-Time Fix':
      return {
        metricName,
        valueLabel: `${vendor.firstTimeFixRate}%`,
        status: statusFrom(vendor.firstTimeFixRate),
        summary: `${vendor.firstTimeFixRate}% of jobs are resolved without a repeat visit.`,
        rationale: [
          `Repeat failure rate is ${vendor.repeatFailureRate}%, which is the inverse pressure on this metric.`,
          vendor.firstTimeFixRate >= 88 ? 'Diagnostic quality is strong and return visits are rare.' : 'Repeat visits are creating avoidable operational load.',
          `Current category focus: ${vendor.category}.`,
        ],
        interpretation: vendor.firstTimeFixRate >= 88 ? 'The vendor is diagnosing correctly and reducing friction for residents and site teams.' : 'More rework means longer lifecycle cost and less predictable capacity.',
        recommendation: vendor.firstTimeFixRate >= 88 ? 'Use this vendor for complex jobs where diagnostic accuracy matters.' : 'Pair the vendor with clearer issue triage, stronger evidence requirements, or a senior reviewer.',
      };
    case 'Avg Resolution':
      return {
        metricName,
        valueLabel: `${vendor.avgResolutionMin} min`,
        status: statusFrom(vendor.avgResolutionMin),
        summary: `Average resolution time is ${vendor.avgResolutionMin} minutes.`,
        rationale: [
          vendor.avgResolutionMin <= 45 ? 'Resolution speed is within the preferred operating band.' : 'Resolution speed is above the preferred operating band.',
          `The metric is assessed together with ${vendor.slaCompliance}% SLA compliance and ${vendor.firstTimeFixRate}% first-time fix.`,
          vendor.dependencyRisk === 'High' || vendor.dependencyRisk === 'Critical' ? `Dependency risk is ${vendor.dependencyRisk}, which can slow closure when specialist capacity is needed.` : 'Dependency risk is manageable, so speed is mostly within vendor control.',
        ],
        interpretation: vendor.avgResolutionMin <= 45 ? 'Fast closure supports SLA confidence and keeps active backlog low.' : 'Longer resolution times can hide capacity constraints or weak diagnosis.',
        recommendation: vendor.avgResolutionMin <= 45 ? 'Maintain current dispatch rules and use the vendor for short-SLA work.' : 'Review job mix, parts availability, and escalation handoffs for the slowest closures.',
      };
    case 'Evidence Compliance':
      return {
        metricName,
        valueLabel: `${vendor.evidenceCompliance}%`,
        status: statusFrom(vendor.evidenceCompliance),
        summary: `${vendor.evidenceCompliance}% of closed jobs include required documentation and evidence.`,
        rationale: [
          vendor.evidenceCompliance >= 90 ? 'Evidence quality is strong enough for audit and client reporting.' : 'Evidence gaps may weaken audit readiness and billing support.',
          `${vendor.contractFlags.filter(flag => flag.type === 'missing').length} active missing-evidence flag${vendor.contractFlags.filter(flag => flag.type === 'missing').length === 1 ? '' : 's'} found in contract checks.`,
          'Before/after photos and completion notes are key signals for this score.',
        ],
        interpretation: vendor.evidenceCompliance >= 90 ? 'The vendor is giving management a defensible record of completed work.' : 'Incomplete documentation creates avoidable review friction and compliance exposure.',
        recommendation: vendor.evidenceCompliance >= 90 ? 'Keep current evidence standards and sample-check high-risk jobs.' : 'Make evidence mandatory before closure and spot-check the next 10 jobs.',
      };
    case 'Active Contracts':
      return {
        metricName,
        valueLabel: String(vendor.activeContracts),
        status: statusFrom(vendor.activeContracts),
        summary: `${vendor.name} has ${vendor.activeContracts} active contract${vendor.activeContracts === 1 ? '' : 's'} in scope.`,
        rationale: [
          `Contract expiry is ${vendor.contractExpiry}.`,
          `The vendor covers ${vendor.sites.length} site${vendor.sites.length === 1 ? '' : 's'}: ${vendor.sites.join(', ')}.`,
          `${vendor.contractFlags.length} contract flag${vendor.contractFlags.length === 1 ? '' : 's'} currently influence governance risk.`,
        ],
        interpretation: vendor.activeContracts > 1 ? 'This vendor has meaningful operational footprint and should stay visible in portfolio controls.' : 'The vendor has a smaller active footprint, so risk is more contained.',
        recommendation: vendor.contractFlags.length > 0 ? 'Review flagged clauses before assigning additional contract scope.' : 'Keep renewal, expiry, and scope coverage visible in the monthly vendor review.',
      };
    case 'Jobs Last 30d':
      return {
        metricName,
        valueLabel: String(vendor.jobsLast30d),
        status: statusFrom(vendor.jobsLast30d),
        summary: `${vendor.name} completed or handled ${vendor.jobsLast30d} jobs in the last 30 days.`,
        rationale: [
          'Recent job volume gives confidence that the performance metrics reflect current behavior.',
          `Workload is being delivered with ${vendor.slaCompliance}% SLA and ${vendor.firstTimeFixRate}% first-time fix.`,
          vendor.jobsLast30d > 150 ? 'Volume is high, so capacity monitoring matters.' : 'Volume is moderate, so performance changes may be easier to correct quickly.',
        ],
        interpretation: vendor.jobsLast30d > 150 ? 'The vendor is a major operational dependency for current service delivery.' : 'The vendor is active but not over-concentrated.',
        recommendation: vendor.jobsLast30d > 150 ? 'Watch fatigue, repeat visits, and SLA drift before adding more work.' : 'Use this activity level to test targeted performance improvements.',
      };
    case 'Avg Cost/Job':
      return {
        metricName,
        valueLabel: `AED ${vendor.avgCostPerJob}`,
        status: statusFrom(vendor.avgCostPerJob),
        summary: `Average cost per job is AED ${vendor.avgCostPerJob}, compared with a peer reference of AED ${peerCost}.`,
        rationale: [
          vendor.avgCostPerJob <= peerCost ? `Cost is AED ${peerCost - vendor.avgCostPerJob} below the current peer reference.` : `Cost is AED ${vendor.avgCostPerJob - peerCost} above the current peer reference.`,
          `Cost should be read with ${vendor.firstTimeFixRate}% first-time fix, because cheap repeat work is not truly efficient.`,
          `Vendor score is ${score}/100, so cost efficiency is being achieved ${score >= 80 ? 'without weakening quality.' : 'with some quality or delivery risk still present.'}`,
        ],
        interpretation: vendor.avgCostPerJob <= peerCost && vendor.firstTimeFixRate >= 85 ? 'The vendor is cost-efficient without obvious quality compromise.' : 'Cost requires a quality check before decisions are made on price alone.',
        recommendation: vendor.avgCostPerJob <= peerCost ? 'Keep this vendor in cost-sensitive routing while monitoring evidence and repeat visits.' : 'Compare job mix and parts usage before renegotiating rates.',
      };
  }
}

function VendorAIInsightBadge({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={event => {
        event.stopPropagation();
        onClick();
      }}
      title="Explain this metric"
      aria-label="Explain this metric"
      className="group absolute right-2 top-2 z-10 inline-flex h-5 items-center gap-1 rounded-full border border-violet-300/25 bg-[linear-gradient(135deg,#1D7CFF,#7C3AED)] px-1.5 text-[8px] font-black uppercase tracking-wide text-white shadow-[0_0_14px_rgba(124,58,237,0.34)] transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-violet-300/70"
    >
      <Sparkles size={9} />
      AI
      <span className="pointer-events-none absolute right-0 top-7 hidden whitespace-nowrap rounded-lg border border-[rgba(46,127,255,0.28)] bg-[#07111F] px-2.5 py-1.5 text-[10px] font-bold normal-case tracking-normal text-[#DDE6F8] shadow-xl group-hover:block">
        Explain this metric
      </span>
    </button>
  );
}

function VendorInsightBlock({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Brain;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#07111F]/85 p-4">
      <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#C4B5FD]">
        <Icon size={13} />
        {title}
      </div>
      {children}
    </div>
  );
}

function VendorMetricInsightPanel({ insight, onClose }: { insight: VendorMetricInsight; onClose: () => void }) {
  const statusClass = {
    positive: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
    monitor: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
    critical: 'border-red-400/30 bg-red-400/10 text-red-200',
  }[insight.status];

  return (
    <motion.aside
      initial={{ x: 420, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 420, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 34 }}
      className="absolute bottom-0 right-0 top-0 z-40 flex w-full max-w-[400px] flex-col border-l border-violet-400/25 bg-[linear-gradient(180deg,rgba(10,22,40,0.98),rgba(7,17,31,0.99))] shadow-2xl shadow-black/45 backdrop-blur-xl"
    >
      <div className="border-b border-[rgba(46,127,255,0.16)] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-violet-300/25 bg-violet-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-violet-100">
              <Sparkles size={12} />
              AI Insight
            </div>
            <h3 className="text-lg font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              AI Insight - {insight.metricName}
            </h3>
            <p className="mt-1 text-[12px] text-[#7A94B4]">
              Current value: <span className="font-bold text-[#DDE6F8]">{insight.valueLabel}</span>
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-[#7A94B4] transition-colors hover:bg-white/5 hover:text-white" aria-label="Close AI insight">
            <X size={18} />
          </button>
        </div>
        <div className={`mt-4 inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wide ${statusClass}`}>
          {insight.status === 'positive' ? 'Healthy signal' : insight.status === 'monitor' ? 'Monitor closely' : 'Needs attention'}
        </div>
      </div>

      <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto p-5">
        <VendorInsightBlock icon={Brain} title="Summary">
          <p className="text-[13px] leading-6 text-[#DDE6F8]">{insight.summary}</p>
        </VendorInsightBlock>
        <VendorInsightBlock icon={ListChecks} title="Rationale">
          <ul className="space-y-2">
            {insight.rationale.map(item => (
              <li key={item} className="flex gap-2 text-[12px] leading-5 text-[#B8C7DB]">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7C3AED]" />
                {item}
              </li>
            ))}
          </ul>
        </VendorInsightBlock>
        <VendorInsightBlock icon={Activity} title="Interpretation">
          <p className="text-[13px] leading-6 text-[#DDE6F8]">{insight.interpretation}</p>
        </VendorInsightBlock>
        <VendorInsightBlock icon={Lightbulb} title="Recommendation">
          <p className="text-[13px] leading-6 text-[#DDE6F8]">{insight.recommendation}</p>
        </VendorInsightBlock>
      </div>
    </motion.aside>
  );
}

function VendorCopilotWorkbench({
  result,
  log,
  onRun,
  onOpenQuoteIntake,
  onOpenRfqWizard,
}: {
  result: VendorCopilotResult;
  log: string[];
  onRun: (action: VendorCopilotAction) => void;
  onOpenQuoteIntake?: () => void;
  onOpenRfqWizard?: () => void;
}) {
  const actions: { id: VendorCopilotAction; label: string; detail: string; tone: string; icon: React.ReactNode }[] = [
    { id: 'rfq', label: 'Write RFQ', detail: 'Scope, questions, scoring, and evidence rules', tone: 'border-blue-400/30 bg-blue-400/10 text-blue-200', icon: <FileWarning size={13} /> },
    { id: 'compare', label: 'Compare Quotes', detail: 'Assign context, upload quotes, rank bids', tone: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200', icon: <BarChart3 size={13} /> },
    { id: 'background', label: 'Background Checks', detail: 'Contracts, evidence, risk, and dependency', tone: 'border-violet-400/30 bg-violet-400/10 text-violet-200', icon: <ShieldCheck size={13} /> },
    { id: 'price', label: 'Price Analysis', detail: 'Peer average, savings, and rate-card ask', tone: 'border-amber-400/30 bg-amber-400/10 text-amber-200', icon: <DollarSign size={13} /> },
    { id: 'negotiation', label: 'Action Pack', detail: 'Vendor message, approvals, and KPI targets', tone: 'border-red-400/30 bg-red-400/10 text-red-200', icon: <Target size={13} /> },
  ];

  return (
    <div className="grid gap-3 lg:grid-cols-[0.95fr_1.25fr]">
      <div className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          {actions.map(action => (
            <button
              key={action.id}
              type="button"
              onClick={() => {
                if (action.id === 'rfq' && onOpenRfqWizard) {
                  onOpenRfqWizard();
                  return;
                }
                onRun(action.id);
                if (action.id === 'compare') onOpenQuoteIntake?.();
              }}
              className={`group rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 hover:border-white/30 ${action.tone}`}
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-black/18">{action.icon}</span>
                <span className="text-[12px] font-black text-[#EEF3FA]">{action.label}</span>
                <ChevronRight size={13} className="ml-auto opacity-60 transition-transform group-hover:translate-x-0.5" />
              </div>
              <div className="mt-2 text-[10px] leading-4 text-[#9CB1CC]">{action.detail}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#0D1E3A] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[rgba(46,127,255,0.12)] pb-3">
          <div>
            <h4 className="text-sm font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{result.title}</h4>
            <p className="mt-1 text-[11px] leading-5 text-[#8AA6C8]">{result.summary}</p>
          </div>
          <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-[10px] font-black text-emerald-200">
            {result.status}
          </span>
        </div>

        <div className="mt-3 space-y-3">
          {result.sections.map(section => (
            <div key={section.title} className="rounded-xl border border-[rgba(46,127,255,0.12)] bg-[#07111F] p-3">
              <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#8DBDFF]">
                <ListChecks size={12} />
                {section.title}
              </div>
              <ul className="space-y-2">
                {section.lines.map(line => (
                  <li key={line} className="flex gap-2 text-[11px] leading-5 text-[#C8D8EE]">
                    <CheckCircle size={11} className="mt-1 shrink-0 text-emerald-400" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#2E7FFF]/20 bg-[#2E7FFF]/10 p-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8DBDFF]">Next action</div>
            <div className="mt-1 text-[12px] font-bold text-[#EEF3FA]">{result.primaryCta}</div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (result.action === 'rfq' && onOpenRfqWizard) {
                onOpenRfqWizard();
                return;
              }
              onRun(result.action);
            }}
            className="rounded-lg bg-[#2E7FFF] px-3 py-2 text-[11px] font-black text-white transition-all hover:bg-[#4B91FF]"
          >
            {result.action === 'rfq' ? 'Open RFQ Wizard' : 'Refresh artifact'}
          </button>
        </div>

        {result.action === 'compare' && onOpenQuoteIntake && (
          <button
            type="button"
            onClick={onOpenQuoteIntake}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/12 px-4 py-3 text-[12px] font-black text-emerald-100 transition-all hover:border-emerald-300/50 hover:bg-emerald-400/18"
          >
            <UploadCloud size={14} />
            Open assigned quote intake
          </button>
        )}

        <div className="mt-3 rounded-xl border border-[rgba(46,127,255,0.12)] bg-[#07111F] p-3">
          <div className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#7A94B4]">Copilot activity</div>
          <div className="space-y-1.5">
            {log.slice(0, 4).map(item => (
              <div key={item} className="flex items-center gap-2 text-[10px] text-[#9CB1CC]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2E7FFF]" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function inferVendorCopilotAction(prompt: string): VendorCopilotAction {
  const lower = prompt.toLowerCase();
  if (lower.includes('rfq') || lower.includes('scope') || lower.includes('tender')) return 'rfq';
  if (lower.includes('background') || lower.includes('check') || lower.includes('compliance') || lower.includes('documents')) return 'background';
  if (lower.includes('price') || lower.includes('cost') || lower.includes('saving') || lower.includes('rate')) return 'price';
  if (lower.includes('action') || lower.includes('negotiate') || lower.includes('corrective') || lower.includes('email')) return 'negotiation';
  return 'compare';
}

function PageProcurementCopilotModal({
  focusVendor,
  vendors,
  result,
  onClose,
  onRun,
  onOpenProfile,
  onRfqGenerated,
}: {
  focusVendor: VendorIntelData;
  vendors: VendorIntelData[];
  result: VendorCopilotResult;
  onClose: () => void;
  onRun: (action: VendorCopilotAction) => void;
  onOpenProfile: () => void;
  onRfqGenerated?: (result: VendorCopilotResult) => void;
}) {
  const selectedProjectData = useSelectedProjectCommandData();
  const propertyOptions = useProjectCommandPropertyOptions();
  const rfqTemplates = buildRfqTemplates();
  const [prompt, setPrompt] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [assistantNote, setAssistantNote] = useState(`Ready for ${focusVendor.name}. Choose an outcome or describe the procurement task.`);
  const [quoteDocuments, setQuoteDocuments] = useState<VendorSetupDocument[]>([]);
  const [quoteNotes, setQuoteNotes] = useState('');
  const [quoteAnalysis, setQuoteAnalysis] = useState<QuoteAnalysis | null>(null);
  const [quoteActionArtifact, setQuoteActionArtifact] = useState<QuoteActionArtifact | null>(null);
  const [rfqState, setRfqState] = useState<RfqWizardState>(() => buildInitialRfqState(focusVendor, selectedProjectData));
  const [rfqPackage, setRfqPackage] = useState<RfqGeneratedPackage | null>(null);
  const [rfqFeedback, setRfqFeedback] = useState('');
  const allProjectOptions = useProjectCommandProjectOptions();
  const projectOptions = useProjectCommandProjectOptions(rfqState.anchor.propertyId);
  const defaultQuotePackage = procurementPackageTemplates[0];
  const [quoteAssignment, setQuoteAssignment] = useState<ProcurementAssignmentContext>(() => ({
    propertyId: selectedProjectData.property.id,
    propertyName: selectedProjectData.property.name,
    projectId: selectedProjectData.project.id,
    projectName: selectedProjectData.project.name,
    packageName: defaultQuotePackage.name,
    budgetAllowance: defaultQuotePackage.budgetAllowance,
    requiredDeliveryDate: defaultQuotePackage.requiredDeliveryDate,
    evaluationCriteria: defaultQuotePackage.evaluationCriteria,
    evidenceRequirements: defaultQuotePackage.evidenceRequirements,
  }));
  const quoteProjectOptions = allProjectOptions.filter(option => option.propertyId === quoteAssignment.propertyId);
  const quoteAssignmentComplete = Boolean(
    quoteAssignment.propertyId
    && quoteAssignment.projectId
    && quoteAssignment.packageName
    && quoteAssignment.budgetAllowance > 0
    && quoteAssignment.requiredDeliveryDate,
  );
  const chips: { label: string; detail: string; action: VendorCopilotAction; icon: React.ReactNode }[] = [
    { label: 'Draft RFQ', detail: 'Scope, criteria, evidence, deadlines', action: 'rfq', icon: <FileWarning size={15} /> },
    { label: 'Compare Quotes', detail: 'Assign context, upload quotes, rank bids', action: 'compare', icon: <BarChart3 size={15} /> },
    { label: 'Run Checks', detail: 'Compliance, documents, dependency', action: 'background', icon: <ShieldCheck size={15} /> },
    { label: 'Analyse Price', detail: 'Savings, rate card, value guardrails', action: 'price', icon: <DollarSign size={15} /> },
    { label: 'Prepare Action Pack', detail: 'Negotiation brief and KPI targets', action: 'negotiation', icon: <Target size={15} /> },
  ];

  function run(action: VendorCopilotAction) {
    onRun(action);
    setAssistantNote(action === 'compare'
      ? 'Upload or paste vendor quotes, then run the comparison to get ranked findings and a recommended winner.'
      : `${formatVendorAction(action)}. The live work product is updated on the right and on the page workbench behind this modal.`);
    setPrompt('');
  }

  function submitPrompt() {
    const action = inferVendorCopilotAction(prompt);
    run(action);
  }

  function patchQuoteAssignment(patch: Partial<ProcurementAssignmentContext>) {
    setQuoteAssignment(prev => ({ ...prev, ...patch }));
    setQuoteAnalysis(null);
    setQuoteActionArtifact(null);
  }

  function changeQuoteProperty(propertyId: string) {
    const property = propertyOptions.find(option => option.id === propertyId);
    const nextProject = allProjectOptions.find(option => option.propertyId === propertyId);
    patchQuoteAssignment({
      propertyId,
      propertyName: property?.label ?? quoteAssignment.propertyName,
      projectId: nextProject?.id ?? '',
      projectName: nextProject?.label ?? '',
    });
  }

  function changeQuoteProject(projectId: string) {
    const project = allProjectOptions.find(option => option.id === projectId);
    patchQuoteAssignment({
      projectId,
      projectName: project?.label ?? quoteAssignment.projectName,
      propertyId: project?.propertyId ?? quoteAssignment.propertyId,
      propertyName: project?.propertyName ?? quoteAssignment.propertyName,
    });
  }

  function changeQuotePackage(packageName: string) {
    const template = procurementPackageTemplates.find(item => item.name === packageName) ?? procurementPackageTemplates[0];
    patchQuoteAssignment({
      packageName,
      budgetAllowance: template.budgetAllowance,
      requiredDeliveryDate: template.requiredDeliveryDate,
      evaluationCriteria: template.evaluationCriteria,
      evidenceRequirements: template.evidenceRequirements,
    });
  }

  async function addQuoteDocuments(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!quoteAssignmentComplete) {
      setAssistantNote('Assign the quote comparison to a property, project, and procurement package before uploading quote files.');
      event.target.value = '';
      return;
    }
    if (!files.length) return;
    const docs = await Promise.all(files.map(async file => {
      const parsed = await parseProjectDocumentFile(file).catch(() => null);
      return {
        id: `${file.name}-${file.size}-${Date.now()}`,
        name: file.name,
        type: file.type || 'Quote document',
        sizeLabel: formatDocumentSize(file.size),
        content: parsed?.text ?? '',
        warning: parsed?.warning,
      };
    }));
    const nextDocuments = [...docs, ...quoteDocuments].slice(0, 8);
    setQuoteDocuments(nextDocuments);
    setQuoteAnalysis(buildQuoteAnalysis(nextDocuments, quoteNotes, quoteAssignment));
    setQuoteActionArtifact(null);
    onRun('compare');
    event.target.value = '';
  }

  function analyseQuotes() {
    if (!quoteAssignmentComplete || (quoteDocuments.length === 0 && !quoteNotes.trim())) return;
    const analysis = buildQuoteAnalysis(quoteDocuments, quoteNotes, quoteAssignment);
    setQuoteAnalysis(analysis);
    setQuoteActionArtifact(null);
    onRun('compare');
    setAssistantNote(`${analysis.winner.vendorName} is currently recommended. Review the findings, exclusions, and next action before award.`);
  }

  function clearQuoteIntake() {
    setQuoteDocuments([]);
    setQuoteNotes('');
    setQuoteAnalysis(null);
    setQuoteActionArtifact(null);
    setAssistantNote('Quote comparison reset. Upload or paste new quotes to analyse again.');
  }

  function prepareQuoteAction(action: string) {
    if (action === 'Open Vendor Profile') {
      onOpenProfile();
      return;
    }
    if (!quoteAnalysis) return;
    setQuoteActionArtifact(buildQuoteActionArtifact(action, quoteAnalysis));
  }

  function patchRfq(patch: Partial<RfqWizardState>) {
    const isStepOnly = Object.keys(patch).length === 1 && patch.step;
    setRfqState(prev => ({ ...prev, ...patch }));
    if (!isStepOnly) {
      setRfqPackage(null);
      setRfqFeedback('');
    }
  }

  function patchRfqAnchor(patch: Partial<RfqAnchor>) {
    setRfqState(prev => ({ ...prev, anchor: { ...prev.anchor, ...patch } }));
    setRfqPackage(null);
    setRfqFeedback('');
  }

  function patchRfqScoring(key: RfqScoringKey, value: string) {
    setRfqState(prev => ({ ...prev, scoring: { ...prev.scoring, [key]: value } }));
    setRfqPackage(null);
    setRfqFeedback('');
  }

  function changeRfqProperty(propertyId: string) {
    const property = propertyOptions.find(option => option.id === propertyId);
    const nextProject = allProjectOptions.find(option => option.propertyId === propertyId);
    patchRfqAnchor({
      propertyId,
      propertyName: property?.label ?? rfqState.anchor.propertyName,
      propertyMeta: property ? `${property.type} / ${property.location}` : rfqState.anchor.propertyMeta,
      projectId: nextProject?.id ?? '',
      projectName: nextProject?.label ?? '',
      projectType: nextProject?.projectType ?? '',
    });
  }

  function changeRfqProject(projectId: string) {
    const project = projectOptions.find(option => option.id === projectId);
    patchRfqAnchor({
      projectId,
      projectName: project?.label ?? rfqState.anchor.projectName,
      projectType: project?.projectType ?? rfqState.anchor.projectType,
      propertyId: project?.propertyId ?? rfqState.anchor.propertyId,
      propertyName: project?.propertyName ?? rfqState.anchor.propertyName,
    });
  }

  function changeRfqServiceCategory(serviceCategory: string) {
    const relevantTemplates = relevantRfqTemplates(rfqTemplates, serviceCategory);
    setRfqState(prev => {
      const currentTemplate = rfqTemplates.find(item => item.id === prev.templateId);
      const shouldKeepTemplate = Boolean(currentTemplate && currentTemplate.category === serviceCategory);
      const autoTemplate = prev.mode === 'template' && !shouldKeepTemplate && relevantTemplates.length === 1
        ? relevantTemplates[0]
        : undefined;
      const baseState: RfqWizardState = {
        ...prev,
        anchor: { ...prev.anchor, serviceCategory },
      };

      if (shouldKeepTemplate) return baseState;
      if (autoTemplate) return applyRfqTemplate(baseState, autoTemplate);

      return {
        ...baseState,
        templateId: '',
        services: '',
        sla: '',
        compliance: '',
        scoring: defaultRfqScoring(),
      };
    });
    setRfqPackage(null);
    setRfqFeedback('');
  }

  function changeRfqTemplate(templateId: string) {
    const template = rfqTemplates.find(item => item.id === templateId);
    if (!template) return;
    setRfqState(prev => applyRfqTemplate(prev, template));
    setRfqPackage(null);
    setRfqFeedback('');
  }

  function chooseRfqMode(mode: RfqCreationMode) {
    if (mode === 'template') {
      const relevantTemplates = relevantRfqTemplates(rfqTemplates, rfqState.anchor.serviceCategory);
      if (relevantTemplates.length === 1) {
        setRfqState(prev => ({ ...applyRfqTemplate(prev, relevantTemplates[0]), mode, step: 'scope' }));
        setRfqPackage(null);
        setRfqFeedback('');
        return;
      }
    }
    patchRfq({ mode, step: mode === 'template' && !rfqState.templateId ? 'mode' : 'scope' });
  }

  async function addRfqDocuments(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    const docs = await Promise.all(files.map(async file => {
      const parsed = await parseProjectDocumentFile(file).catch(() => null);
      return {
        id: `${file.name}-${file.size}-${Date.now()}`,
        name: file.name,
        type: file.type || 'Scope document',
        sizeLabel: formatDocumentSize(file.size),
        content: parsed?.text ?? '',
        warning: parsed?.warning,
      };
    }));
    setRfqState(prev => {
      const nextDocuments = [...docs, ...prev.documents].slice(0, 8);
      const extracted = extractRfqScopeFromDocuments(nextDocuments, prev.pastedScope);
      return {
        ...prev,
        documents: nextDocuments,
        services: prev.services || extracted.services || '',
        inclusions: prev.inclusions || extracted.inclusions || '',
        exclusions: prev.exclusions || extracted.exclusions || '',
        volume: prev.volume || extracted.volume || '',
        timeline: prev.timeline || extracted.timeline || '',
        sla: prev.sla || extracted.sla || '',
        evidence: prev.evidence || extracted.evidence || '',
        compliance: prev.compliance || extracted.compliance || '',
      };
    });
    setRfqPackage(null);
    setRfqFeedback('');
    onRun('rfq');
    event.target.value = '';
  }

  function generateRfqPackage() {
    const template = rfqTemplates.find(item => item.id === rfqState.templateId);
    const generated = buildRfqDraft(template, focusVendor, vendors, rfqState);
    setRfqPackage(generated);
    setRfqState(prev => ({ ...prev, step: 'review' }));
    const workbenchResult = buildRfqCopilotResult(generated);
    onRfqGenerated?.(workbenchResult);
    onRun('rfq');
    setAssistantNote('RFQ review package generated. Review the sections, then copy, save, or prepare the vendor invite.');
    setRfqFeedback('RFQ review package generated.');
  }

  function runRfqAction(action: string) {
    if (!rfqPackage) return;
    if (action === 'Copy RFQ') {
      void navigator.clipboard?.writeText(formatRfqPackageText(rfqPackage));
      setRfqFeedback('RFQ copied for review.');
      return;
    }
    if (action === 'Save to workbench') {
      onRfqGenerated?.(buildRfqCopilotResult(rfqPackage));
      setRfqFeedback('RFQ saved to the page workbench.');
      return;
    }
    setRfqFeedback('Vendor invite prepared with selected project, scope, deadline, response fields, and required documents.');
  }

  const isCompareMode = result.action === 'compare';
  const isRfqMode = result.action === 'rfq';
  const rfqCurrentStepIndex = rfqStepOrder.indexOf(rfqState.step);
  const visibleRfqTemplates = relevantRfqTemplates(rfqTemplates, rfqState.anchor.serviceCategory);
  const selectedRfqTemplate = rfqTemplates.find(item => item.id === rfqState.templateId);
  const rfqScoringTotal = (Object.values(rfqState.scoring) as string[]).reduce((sum, value) => sum + (Number(value) || 0), 0);
  const rfqExtracted = extractRfqScopeFromDocuments(rfqState.documents, rfqState.pastedScope);
  const canGenerateRfq = Boolean(
    rfqState.anchor.propertyName
      && rfqState.anchor.projectName
      && rfqState.anchor.serviceCategory
      && rfqState.anchor.sitesAreas
      && rfqState.mode
      && (
        rfqState.mode === 'template'
          ? rfqState.templateId
          : rfqState.mode === 'docs'
            ? (rfqState.documents.length > 0 || rfqState.pastedScope.trim() || rfqState.services.trim())
            : (rfqState.aiBrief.trim() || rfqState.services.trim())
      ),
  );
  const readableQuoteCount = quoteAnalysis?.items.filter(item => item.extractionStatus === 'Read').length ?? 0;
  const quoteChecklist = [
    'Package price',
    'Committed SLA',
    'Delivery / award date',
    'Exclusions',
    'Warranty',
    'Evidence commitment',
  ];
  const quoteContextItems = [
    { label: 'Property', value: quoteAssignment.propertyName || 'Select property' },
    { label: 'Project', value: quoteAssignment.projectName || 'Select project' },
    { label: 'Package / scope', value: quoteAssignment.packageName || 'Select package' },
    { label: 'Budget guardrail', value: formatProcurementMoney(quoteAssignment.budgetAllowance) },
    { label: 'Required delivery', value: quoteAssignment.requiredDeliveryDate || 'Select date' },
    { label: 'Quote data source', value: 'Uploaded files / pasted quote text only' },
  ];
  const quoteSteps = [
    { label: '1 Assign Context', value: quoteAssignmentComplete ? `${quoteAssignment.propertyName} / ${quoteAssignment.packageName}` : 'required before upload', active: quoteAssignmentComplete },
    { label: '2 Upload Quotes', value: `${quoteDocuments.length} file${quoteDocuments.length === 1 ? '' : 's'} / ${quoteNotes.trim() ? 'text pasted' : 'text optional'}`, active: quoteAssignmentComplete && (quoteDocuments.length > 0 || Boolean(quoteNotes.trim())) },
    { label: '3 AI Comparison', value: quoteAnalysis ? `${readableQuoteCount}/${quoteAnalysis.items.length} quotes readable` : 'ready to run', active: Boolean(quoteAnalysis) },
  ];
  const quoteItemForDocument = (doc: VendorSetupDocument) => quoteAnalysis?.items.find(item => item.id === doc.id);
  const quoteStatusTone = (status?: QuoteExtractionStatus) => {
    if (status === 'Read') return 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200';
    if (status === 'Missing price' || status === 'Missing SLA' || status === 'Missing delivery') return 'border-amber-400/25 bg-amber-400/10 text-amber-200';
    if (status === 'Unsupported / no text') return 'border-slate-400/25 bg-slate-400/10 text-slate-200';
    if (status === 'Needs clarification') return 'border-red-400/25 bg-red-400/10 text-red-200';
    return 'border-[#2E7FFF]/22 bg-[#2E7FFF]/10 text-[#8DBDFF]';
  };
  const quoteRiskTone = (risk: QuoteAnalysisItem['risk']) => (
    risk === 'Low'
      ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200'
      : risk === 'Medium'
        ? 'border-amber-400/25 bg-amber-400/10 text-amber-200'
        : 'border-red-400/25 bg-red-400/10 text-red-200'
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-[#020814]/78 px-5 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        className={`flex max-h-[90vh] w-full ${isCompareMode || isRfqMode ? 'max-w-6xl' : 'max-w-5xl'} flex-col overflow-hidden rounded-2xl border border-[#2E7FFF]/30 bg-[#081528] shadow-2xl`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[rgba(46,127,255,0.16)] bg-[linear-gradient(135deg,rgba(46,127,255,0.18),rgba(124,58,237,0.12))] px-5 py-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-300/25 bg-violet-400/10 px-3 py-1 text-[10px] font-black tracking-[0.18em] text-violet-100">
              <MessageSquare size={12} />
              {isCompareMode ? 'Quote Comparison Workbench' : isRfqMode ? 'RFQ Builder' : 'Procurement assistant'}
            </div>
            <h3 className="text-xl font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {isCompareMode ? 'Compare supplier quotes' : isRfqMode ? 'Build a project-anchored RFQ' : 'How can I help?'}
            </h3>
            <p className="mt-1 max-w-2xl text-[12px] leading-5 text-[#9CB1CC]">
              {isCompareMode
                ? 'Assign the property, project, and package first, then compare uploaded supplier quotes against that context.'
                : isRfqMode
                  ? <>Anchor the property and project first, then choose whether to tell AI, use a template, or upload scope documents for <span className="font-bold text-[#EEF3FA]">{focusVendor.name}</span>.</>
                : <>Tell me the procurement outcome. I will generate the artifact and keep the vendor context anchored to <span className="font-bold text-[#EEF3FA]">{focusVendor.name}</span>.</>}
            </p>
          </div>
          <button onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 p-2 text-[#8AA6C8] transition-colors hover:bg-white/10 hover:text-white" aria-label="Close procurement assistant">
            <X size={18} />
          </button>
        </div>

        {isCompareMode ? (
          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-5">
            <div className="grid gap-3 sm:grid-cols-3">
              {quoteSteps.map(step => (
                <div
                  key={step.label}
                  className={`rounded-xl border p-3 transition-all ${
                    step.active
                      ? 'border-[#2E7FFF]/38 bg-[#2E7FFF]/14 shadow-[0_0_22px_rgba(46,127,255,0.10)]'
                      : 'border-[rgba(46,127,255,0.14)] bg-[#07111F]'
                  }`}
                >
                  <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8DBDFF]">{step.label}</div>
                  <div className="mt-1 text-[11px] leading-4 text-[#C8D8EE]">{step.value}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
              <div className="space-y-4">
                <section className="rounded-2xl border border-[rgba(46,127,255,0.18)] bg-[#07111F] p-4">
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#8DBDFF]">
                        <Target size={13} />
                        Assign Procurement Context
                      </div>
                      <p className="mt-1 text-[11px] leading-5 text-[#9CB1CC]">Choose where these uploaded quotes belong before AI compares them.</p>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black ${quoteAssignmentComplete ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200' : 'border-amber-400/25 bg-amber-400/10 text-amber-200'}`}>
                      {quoteAssignmentComplete ? 'Context assigned' : 'Context required'}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <VendorWizardField label="Property">
                      <VendorWizardSelect value={quoteAssignment.propertyId} onChange={event => changeQuoteProperty(event.target.value)}>
                        {propertyOptions.map(option => (
                          <option key={option.id} value={option.id}>{option.label}</option>
                        ))}
                      </VendorWizardSelect>
                    </VendorWizardField>
                    <VendorWizardField label="Project">
                      <VendorWizardSelect value={quoteAssignment.projectId} onChange={event => changeQuoteProject(event.target.value)}>
                        {quoteProjectOptions.map(option => (
                          <option key={option.id} value={option.id}>{option.label}</option>
                        ))}
                      </VendorWizardSelect>
                    </VendorWizardField>
                    <VendorWizardField label="Procurement package / scope">
                      <VendorWizardSelect value={quoteAssignment.packageName} onChange={event => changeQuotePackage(event.target.value)}>
                        {procurementPackageTemplates.map(option => (
                          <option key={option.name} value={option.name}>{option.name}</option>
                        ))}
                      </VendorWizardSelect>
                    </VendorWizardField>
                    <VendorWizardField label="Package budget / estimate">
                      <VendorWizardInput
                        type="number"
                        min={1}
                        value={quoteAssignment.budgetAllowance}
                        onChange={event => patchQuoteAssignment({ budgetAllowance: Number(event.target.value) || 0 })}
                      />
                    </VendorWizardField>
                    <VendorWizardField label="Required delivery / award deadline">
                      <VendorWizardInput
                        type="date"
                        value={quoteAssignment.requiredDeliveryDate}
                        onChange={event => patchQuoteAssignment({ requiredDeliveryDate: event.target.value })}
                      />
                    </VendorWizardField>
                    <div className="rounded-xl border border-[rgba(46,127,255,0.12)] bg-[#0D1E3A] p-3">
                      <div className="text-[9px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">Evaluation basis</div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {quoteAssignment.evaluationCriteria.map(item => (
                          <span key={item} className="rounded-full border border-[#2E7FFF]/18 bg-[#2E7FFF]/10 px-2 py-1 text-[9px] font-bold text-[#BFD8FF]">{item}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl border border-cyan-300/18 bg-cyan-300/8 p-3">
                    <div className="text-[9px] font-black uppercase tracking-[0.14em] text-cyan-100">Source</div>
                    <div className="mt-1 text-[11px] leading-5 text-[#DDF7FF]">
                      Assigned to: <span className="font-black">{quoteAssignment.propertyName} / {quoteAssignment.projectName} / {quoteAssignment.packageName}</span>. Source: user-selected procurement context. Quote data: actual uploaded files, with manual paste only as backup.
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-emerald-400/22 bg-emerald-500/8 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">
                        <BarChart3 size={13} />
                        Quote Intake
                      </div>
                      <h4 className="mt-1 text-sm font-bold text-[#EEF3FA]">Upload actual quote files</h4>
                      <p className="mt-1 text-[11px] leading-5 text-[#9CB1CC]">
                        AI reads uploaded quote files and keeps missing price, SLA, delivery, or evidence fields visible as clarification needs.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <label className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-bold transition-all ${
                        quoteAssignmentComplete
                          ? 'cursor-pointer border-[#2E7FFF]/30 bg-[#2E7FFF]/12 text-[#BFD8FF] hover:bg-[#2E7FFF]/18'
                          : 'cursor-not-allowed border-[#2E7FFF]/12 bg-[#0D1E3A] text-[#607B9A]'
                      }`}>
                        <UploadCloud size={13} />
                        Upload quotes
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.md,.json"
                          onChange={addQuoteDocuments}
                          disabled={!quoteAssignmentComplete}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <textarea
                    value={quoteNotes}
                    onChange={event => {
                      setQuoteNotes(event.target.value);
                      setQuoteAnalysis(null);
                      setQuoteActionArtifact(null);
                    }}
                    disabled={!quoteAssignmentComplete}
                    placeholder={quoteAssignmentComplete ? 'Paste quote text manually. Separate multiple quotes with --- so AI can compare them cleanly.' : 'Assign property, project, and package before pasting quote text.'}
                    className="mt-4 min-h-[104px] w-full resize-none rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#050C17] px-3 py-2.5 text-[12px] leading-relaxed text-[#EEF3FA] outline-none transition-all placeholder:text-[#4A6480] focus:border-[#2E7FFF]"
                  />

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={analyseQuotes}
                      disabled={!quoteAssignmentComplete || (quoteDocuments.length === 0 && !quoteNotes.trim())}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#2E7FFF] px-3 py-2 text-[11px] font-bold text-white shadow-lg shadow-[#2E7FFF]/20 transition-all hover:bg-[#4B91FF] disabled:cursor-not-allowed disabled:bg-[#1A3356] disabled:text-[#7891B0] disabled:shadow-none"
                    >
                      <Sparkles size={13} />
                      Analyse quotes
                    </button>
                    {(quoteDocuments.length > 0 || quoteNotes || quoteAnalysis) && (
                      <button type="button" onClick={clearQuoteIntake} className="rounded-xl border border-[#2E7FFF]/18 px-3 py-2 text-[10px] font-bold text-[#8AA6C8] transition-colors hover:text-white">
                        Clear intake
                      </button>
                    )}
                  </div>

                  <div className="mt-4 grid gap-2">
                    {quoteDocuments.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-[#2E7FFF]/25 bg-[#07111F] px-3 py-3 text-[11px] leading-5 text-[#8AA6C8]">
                        {quoteAssignmentComplete
                          ? 'No quote files uploaded yet. Upload actual supplier quotes or paste quote text manually above.'
                          : 'Assign a property, project, and package first. Quote upload unlocks after context is complete.'}
                      </div>
                    ) : (
                      quoteDocuments.map(doc => {
                        const item = quoteItemForDocument(doc);
                        const status = item?.extractionStatus ?? 'Uploaded';
                        return (
                          <div key={doc.id} className="rounded-xl border border-[#2E7FFF]/18 bg-[#102544] p-3 text-[10px] text-[#C8D8EE]">
                            <div className="flex flex-wrap items-center gap-2">
                              <FileText size={12} className="text-[#8DBDFF]" />
                              <span className="max-w-[260px] truncate font-semibold">{doc.name}</span>
                              <span className="text-[#6F89AA]">{doc.sizeLabel}</span>
                              <span className={`ml-auto rounded-full border px-2 py-1 text-[9px] font-black ${quoteStatusTone(item?.extractionStatus)}`}>
                                {status}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setQuoteDocuments(prev => prev.filter(entry => entry.id !== doc.id));
                                  setQuoteAnalysis(null);
                                  setQuoteActionArtifact(null);
                                }}
                                className="text-[#7A94B4] hover:text-red-300"
                                aria-label={`Remove ${doc.name}`}
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                            {item?.missingFields.length ? (
                              <div className="mt-2 text-[9px] leading-4 text-amber-200">
                                Needs clarification: {item.missingFields.join(', ')}
                              </div>
                            ) : null}
                            {doc.warning && <div className="mt-1 text-[9px] leading-4 text-amber-200">{doc.warning}</div>}
                          </div>
                        );
                      })
                    )}
                  </div>
                </section>
              </div>

              <div className="space-y-4">
                {!quoteAnalysis ? (
                  <section className="rounded-2xl border border-[rgba(46,127,255,0.18)] bg-[#0D1E3A] p-4">
                    <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#8DBDFF]">
                      <Brain size={13} />
                      What AI will check
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {quoteChecklist.map(item => (
                        <div key={item} className="flex items-center gap-2 rounded-xl border border-[rgba(46,127,255,0.12)] bg-[#07111F] p-3 text-[11px] font-bold text-[#C8D8EE]">
                          <CheckCircle size={12} className="shrink-0 text-emerald-400" />
                          {item}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 rounded-xl border border-violet-300/18 bg-violet-400/10 p-4">
                      <div className="text-[12px] font-black text-[#EEF3FA]">Upload-driven comparison</div>
                      <p className="mt-1 text-[11px] leading-5 text-[#9CB1CC]">
                        The ranking starts only after actual supplier quote files are uploaded or quote text is manually pasted for the selected project package.
                      </p>
                      <div className="mt-3 rounded-lg border border-[#2E7FFF]/14 bg-[#07111F] px-3 py-2 text-[10px] leading-4 text-[#BFD8FF]">
                        Current assignment: {quoteAssignment.propertyName} / {quoteAssignment.projectName} / {quoteAssignment.packageName}
                      </div>
                    </div>
                  </section>
                ) : (
                  <>
                    <section className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-200">Recommended bidder</div>
                          <div className="mt-1 text-[18px] font-black text-[#EEF3FA]">{quoteAnalysis.winner.vendorName}</div>
                          <p className="mt-1 text-[12px] leading-5 text-[#C8D8EE]">{quoteAnalysis.summary}</p>
                        </div>
                        <div className="flex gap-2">
                          <span className={`rounded-full border px-2 py-1 text-[9px] font-black ${quoteRiskTone(quoteAnalysis.winner.risk)}`}>
                            {quoteAnalysis.winner.risk} risk
                          </span>
                          <span className="rounded-full border border-[#2E7FFF]/25 bg-[#2E7FFF]/10 px-2 py-1 text-[9px] font-black text-[#8DBDFF]">
                            {quoteAnalysis.winner.score}/100
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-3">
                        <div className="rounded-xl border border-emerald-400/18 bg-[#07111F] p-3">
                          <div className="text-[9px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">Commercial spread</div>
                          <div className="mt-1 text-[13px] font-black text-[#EEF3FA]">
                            {quoteAnalysis.commercialSpread === null ? 'Incomplete' : formatProcurementMoney(quoteAnalysis.commercialSpread)}
                          </div>
                        </div>
                        <div className="rounded-xl border border-emerald-400/18 bg-[#07111F] p-3">
                          <div className="text-[9px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">Vs package budget</div>
                          <div className="mt-1 text-[13px] font-black text-emerald-200">
                            {quoteAnalysis.winner.commercialDelta === null
                              ? 'Needs price'
                              : `${quoteAnalysis.winner.commercialDelta >= 0 ? '+' : '-'}${formatProcurementMoney(Math.abs(quoteAnalysis.winner.commercialDelta))}`}
                          </div>
                        </div>
                        <div className="rounded-xl border border-emerald-400/18 bg-[#07111F] p-3">
                          <div className="text-[9px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">Clarifications</div>
                          <div className="mt-1 text-[13px] font-black text-amber-200">{quoteAnalysis.clarificationQuestions.length}</div>
                        </div>
                      </div>
                    </section>

                    <section className="rounded-2xl border border-[rgba(46,127,255,0.18)] bg-[#07111F] p-4">
                      <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#8DBDFF]">
                        <ListChecks size={13} />
                        AI Comparison
                      </div>
                      <div className="space-y-2">
                        {quoteAnalysis.items.map(item => (
                          <div key={item.id} className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#0D1E3A] p-3">
                            <div className="grid gap-3 lg:grid-cols-[1.1fr_0.7fr_auto] lg:items-start">
                              <div>
                                <div className="text-[12px] font-black text-[#EEF3FA]">{item.vendorName}</div>
                                <div className="mt-1 text-[10px] leading-4 text-[#8AA6C8]">{item.recommendationReason}</div>
                              </div>
                              <div className="text-[10px] leading-5 text-[#C8D8EE]">
                                <div>{item.amount === null ? 'Price not found' : `Price: ${formatProcurementMoney(item.amount)}`}</div>
                                <div>{item.sla === null ? 'SLA not found' : `SLA: ${item.sla}%`}</div>
                                <div>{item.deliveryDate === null ? 'Delivery not found' : `Delivery: ${item.deliveryDate}`}</div>
                                <div>Warranty: {item.warranty}</div>
                                <div>Delta: {item.commercialDelta === null ? 'not available' : `${item.commercialDelta >= 0 ? '+' : '-'}${formatProcurementMoney(Math.abs(item.commercialDelta))} vs package budget`}</div>
                              </div>
                              <div className="flex flex-wrap gap-2 lg:justify-end">
                                <span className={`rounded-full border px-2 py-1 text-[9px] font-black ${quoteStatusTone(item.extractionStatus)}`}>
                                  {item.extractionStatus}
                                </span>
                                <span className={`rounded-full border px-2 py-1 text-[9px] font-black ${quoteRiskTone(item.risk)}`}>
                                  {item.risk} risk
                                </span>
                                <span className="rounded-full border border-[#2E7FFF]/25 bg-[#2E7FFF]/10 px-2 py-1 text-[9px] font-black text-[#8DBDFF]">
                                  {item.score}/100
                                </span>
                              </div>
                            </div>
                            <div className="mt-2 text-[10px] leading-5 text-[#8AA6C8]">Exclusions: {item.exclusions}</div>
                            {item.clarificationQuestions.length > 0 && (
                              <div className="mt-2 rounded-lg border border-amber-400/18 bg-amber-400/8 p-2 text-[10px] leading-5 text-amber-100">
                                {item.clarificationQuestions[0]}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="rounded-2xl border border-[rgba(46,127,255,0.18)] bg-[#07111F] p-4">
                      <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#8DBDFF]">
                        <Sparkles size={13} />
                        Recommendation and actions
                      </div>
                      <div className="grid gap-3 lg:grid-cols-[1fr_0.9fr]">
                        <div className="space-y-2">
                          {quoteAnalysis.findings.map(finding => (
                            <div key={finding} className="flex gap-2 rounded-xl border border-[rgba(46,127,255,0.12)] bg-[#0D1E3A] p-3 text-[11px] leading-5 text-[#C8D8EE]">
                              <CheckCircle size={12} className="mt-1 shrink-0 text-emerald-400" />
                              {finding}
                            </div>
                          ))}
                          {quoteAnalysis.riskConditions.map(condition => (
                            <div key={condition} className="flex gap-2 rounded-xl border border-amber-400/18 bg-amber-400/8 p-3 text-[11px] leading-5 text-amber-100">
                              <AlertTriangle size={12} className="mt-1 shrink-0" />
                              {condition}
                            </div>
                          ))}
                        </div>
                        <div className="space-y-2">
                          {quoteAnalysis.nextActions.map(action => (
                            <button
                              key={action}
                              type="button"
                              onClick={() => prepareQuoteAction(action)}
                              className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#2E7FFF]/20 bg-[#2E7FFF]/10 px-3 py-2.5 text-left text-[11px] font-bold text-[#DDE6F8] transition-all hover:-translate-y-0.5 hover:border-[#2E7FFF]/45 hover:bg-[#2E7FFF]/16"
                            >
                              <span>{action}</span>
                              <ChevronRight size={13} className="text-[#8DBDFF]" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </section>

                    {quoteActionArtifact && (
                      <section className="rounded-2xl border border-violet-300/22 bg-violet-400/10 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-100">{quoteActionArtifact.status}</div>
                            <div className="mt-1 text-[15px] font-black text-[#EEF3FA]">{quoteActionArtifact.title}</div>
                            <p className="mt-1 text-[11px] leading-5 text-[#C8D8EE]">{quoteActionArtifact.body}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const text = [quoteActionArtifact.title, quoteActionArtifact.body, ...quoteActionArtifact.lines].join('\n');
                                void navigator.clipboard?.writeText(text);
                                setAssistantNote(`${quoteActionArtifact.title} copied for manager review.`);
                              }}
                              className="rounded-xl border border-[#2E7FFF]/28 bg-[#2E7FFF]/12 px-3 py-2 text-[10px] font-bold text-[#BFD8FF] transition-all hover:bg-[#2E7FFF]/18"
                            >
                              Copy Draft
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setQuoteActionArtifact(prev => prev ? { ...prev, status: 'Ready for manager review' } : prev);
                                setAssistantNote('The draft is marked ready. Nothing has been sent externally.');
                              }}
                              className="rounded-xl bg-[#2E7FFF] px-3 py-2 text-[10px] font-bold text-white transition-all hover:bg-[#4B91FF]"
                            >
                              Mark Ready
                            </button>
                          </div>
                        </div>
                        <div className="mt-3 space-y-2">
                          {quoteActionArtifact.lines.map(line => (
                            <div key={line} className="flex gap-2 rounded-xl border border-violet-300/14 bg-[#07111F] p-3 text-[11px] leading-5 text-[#DDE6F8]">
                              <CheckCircle size={12} className="mt-1 shrink-0 text-violet-200" />
                              {line}
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ) : isRfqMode ? (
          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-5">
            <div className="grid gap-2 sm:grid-cols-6">
              {rfqStepOrder.map((step, index) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => patchRfq({ step })}
                  className={`rounded-xl border px-3 py-2 text-left transition-all ${
                    rfqState.step === step
                      ? 'border-[#2E7FFF]/45 bg-[#2E7FFF]/18 text-white'
                      : index < rfqCurrentStepIndex
                        ? 'border-emerald-400/24 bg-emerald-400/10 text-emerald-100'
                        : 'border-[rgba(46,127,255,0.14)] bg-[#07111F] text-[#8AA6C8]'
                  }`}
                >
                  <div className="text-[9px] font-black uppercase tracking-[0.14em]">{index + 1}</div>
                  <div className="mt-1 text-[11px] font-black capitalize">{step}</div>
                </button>
              ))}
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
              <section className="rounded-2xl border border-[rgba(46,127,255,0.18)] bg-[#07111F] p-5">
                {rfqState.step === 'project' && (
                  <div className="space-y-4">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8DBDFF]">Project anchor</div>
                      <h4 className="mt-1 text-lg font-black text-[#EEF3FA]">Select where this RFQ belongs</h4>
                      <p className="mt-1 text-[12px] leading-5 text-[#9CB1CC]">The generated RFQ will carry this property, project, site, and vendor context.</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <VendorWizardField label="Property">
                        <VendorWizardSelect value={rfqState.anchor.propertyId} onChange={event => changeRfqProperty(event.target.value)}>
                          {propertyOptions.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
                        </VendorWizardSelect>
                      </VendorWizardField>
                      <VendorWizardField label="Project">
                        <VendorWizardSelect value={rfqState.anchor.projectId} onChange={event => changeRfqProject(event.target.value)}>
                          {projectOptions.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
                        </VendorWizardSelect>
                      </VendorWizardField>
                      <VendorWizardField label="Service category">
                        <VendorWizardSelect value={rfqState.anchor.serviceCategory} onChange={event => changeRfqServiceCategory(event.target.value)}>
                          {vendorCategories.map(category => <option key={category}>{category}</option>)}
                        </VendorWizardSelect>
                      </VendorWizardField>
                      <VendorWizardField label="Sites / areas">
                        <VendorWizardInput value={rfqState.anchor.sitesAreas} onChange={event => patchRfqAnchor({ sitesAreas: event.target.value })} placeholder="Tower, floors, assets, zones, communities" />
                      </VendorWizardField>
                      <VendorWizardField label="Target start date">
                        <VendorWizardInput type="date" value={rfqState.anchor.targetStartDate} onChange={event => patchRfqAnchor({ targetStartDate: event.target.value })} />
                      </VendorWizardField>
                      <VendorWizardField label="Contract period">
                        <VendorWizardInput value={rfqState.anchor.contractPeriod} onChange={event => patchRfqAnchor({ contractPeriod: event.target.value })} placeholder="12 months, project duration, one-off package" />
                      </VendorWizardField>
                      <VendorWizardField label="Current vendor / incumbent">
                        <VendorWizardInput value={rfqState.anchor.currentVendor} onChange={event => patchRfqAnchor({ currentVendor: event.target.value })} />
                      </VendorWizardField>
                      <VendorWizardField label="Shortlist context">
                        <VendorWizardInput value={rfqState.anchor.shortlistContext} onChange={event => patchRfqAnchor({ shortlistContext: event.target.value })} placeholder="Incumbent plus 3 approved alternates" />
                      </VendorWizardField>
                    </div>
                    <div className="rounded-2xl border border-[#2E7FFF]/18 bg-[#0D1E3A] p-4">
                      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8DBDFF]">Choose the RFQ build path</div>
                      <p className="mt-1 text-[11px] leading-5 text-[#9CB1CC]">After the anchor is confirmed, the wizard can build from a prompt, a template, or uploaded scope documents.</p>
                      <div className="mt-3 grid gap-3 md:grid-cols-3">
                        {[
                          { id: 'tell' as const, label: 'Tell AI', icon: <MessageSquare size={16} />, detail: 'Describe the outcome and scope in plain language.' },
                          { id: 'template' as const, label: 'Use Template', icon: <ListChecks size={16} />, detail: 'Start from a service category structure, then edit it.' },
                          { id: 'docs' as const, label: 'Upload Scope Docs', icon: <UploadCloud size={16} />, detail: 'Use scope, BOQ, SLA, service notes, or site requirements.' },
                        ].map(mode => (
                          <button
                            key={mode.id}
                            type="button"
                            onClick={() => chooseRfqMode(mode.id)}
                            className={`rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 ${
                              rfqState.mode === mode.id
                                ? 'border-[#2E7FFF]/50 bg-[#2E7FFF]/18 shadow-[0_0_24px_rgba(46,127,255,0.14)]'
                                : 'border-[rgba(46,127,255,0.16)] bg-[#07111F] hover:border-[#2E7FFF]/34'
                            }`}
                          >
                            <span className="inline-flex items-center gap-2 text-[12px] font-black text-[#EEF3FA]">
                              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#2E7FFF]/14 text-[#8DBDFF]">{mode.icon}</span>
                              {mode.label}
                            </span>
                            <p className="mt-2 text-[10px] leading-4 text-[#9CB1CC]">{mode.detail}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {rfqState.step === 'mode' && (
                  <div className="space-y-4">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8DBDFF]">Creation mode</div>
                      <h4 className="mt-1 text-lg font-black text-[#EEF3FA]">Choose how to build the RFQ</h4>
                      <p className="mt-1 text-[12px] leading-5 text-[#9CB1CC]">All modes produce the same structured review package.</p>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      {[
                        { id: 'tell' as const, label: 'Tell AI', icon: <MessageSquare size={17} />, detail: 'Describe the outcome and scope in plain language.' },
                        { id: 'template' as const, label: 'Use Template', icon: <ListChecks size={17} />, detail: 'Start from a service category structure, then edit it.' },
                        { id: 'docs' as const, label: 'Upload Scope Docs', icon: <UploadCloud size={17} />, detail: 'Use scope, BOQ, SLA, service notes, or site requirements.' },
                      ].map(mode => (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => chooseRfqMode(mode.id)}
                          className={`rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 ${
                            rfqState.mode === mode.id
                              ? 'border-[#2E7FFF]/50 bg-[#2E7FFF]/18 shadow-[0_0_24px_rgba(46,127,255,0.14)]'
                              : 'border-[rgba(46,127,255,0.16)] bg-[#0D1E3A] hover:border-[#2E7FFF]/34'
                          }`}
                        >
                          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#2E7FFF]/14 text-[#8DBDFF]">{mode.icon}</span>
                          <div className="mt-3 text-[13px] font-black text-[#EEF3FA]">{mode.label}</div>
                          <p className="mt-1 text-[11px] leading-5 text-[#9CB1CC]">{mode.detail}</p>
                        </button>
                      ))}
                    </div>
                    {rfqState.mode === 'template' && (
                      <div className="rounded-2xl border border-[rgba(46,127,255,0.16)] bg-[#0D1E3A] p-4">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8DBDFF]">Templates for {rfqState.anchor.serviceCategory}</div>
                          <div className="rounded-full border border-[#2E7FFF]/18 bg-[#07111F] px-2.5 py-1 text-[10px] font-black text-[#8DBDFF]">{visibleRfqTemplates.length} relevant option{visibleRfqTemplates.length === 1 ? '' : 's'}</div>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {visibleRfqTemplates.map(template => (
                            <button
                              key={template.id}
                              type="button"
                              onClick={() => changeRfqTemplate(template.id)}
                              className={`rounded-xl border p-3 text-left transition-all ${
                                rfqState.templateId === template.id
                                  ? 'border-emerald-400/38 bg-emerald-400/12 text-white'
                                  : 'border-[rgba(46,127,255,0.14)] bg-[#07111F] text-[#C8D8EE] hover:border-[#2E7FFF]/34'
                              }`}
                            >
                              <div className="text-[12px] font-black">{template.label}</div>
                              <div className="mt-1 text-[10px] leading-4 text-[#8AA6C8]">{template.category}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {rfqState.step === 'scope' && (
                  <div className="space-y-4">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8DBDFF]">Scope</div>
                      <h4 className="mt-1 text-lg font-black text-[#EEF3FA]">Define what vendors are pricing</h4>
                      <p className="mt-1 text-[12px] leading-5 text-[#9CB1CC]">Enter only what you know. The review package will show anything that still needs confirmation.</p>
                    </div>
                    {rfqState.mode === 'tell' && (
                      <VendorWizardField label="Tell AI what you need">
                        <textarea value={rfqState.aiBrief} onChange={event => patchRfq({ aiBrief: event.target.value })} placeholder="Describe the procurement outcome, service scope, sites, constraints, current vendor issue, and desired timeline." className="min-h-[118px] w-full resize-none rounded-xl border border-[rgba(46,127,255,0.22)] bg-[#07111F] px-3 py-2.5 text-[12px] leading-5 text-[#EEF3FA] outline-none placeholder:text-[#4A6480] focus:border-[#2E7FFF]" />
                      </VendorWizardField>
                    )}
                    {rfqState.mode === 'docs' && (
                      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/8 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-200">Scope documents</div>
                            <p className="mt-1 text-[11px] leading-5 text-[#9CB1CC]">Upload or paste the scope content you want used.</p>
                          </div>
                          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#2E7FFF]/30 bg-[#2E7FFF]/12 px-3 py-2 text-[11px] font-bold text-[#BFD8FF] transition-all hover:bg-[#2E7FFF]/18">
                            <UploadCloud size={13} />
                            Upload docs
                            <input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.md,.json" onChange={addRfqDocuments} className="hidden" />
                          </label>
                        </div>
                        <textarea value={rfqState.pastedScope} onChange={event => {
                          const extracted = extractRfqScopeFromDocuments(rfqState.documents, event.target.value);
                          patchRfq({
                            pastedScope: event.target.value,
                            services: rfqState.services || extracted.services || '',
                            inclusions: rfqState.inclusions || extracted.inclusions || '',
                            exclusions: rfqState.exclusions || extracted.exclusions || '',
                            volume: rfqState.volume || extracted.volume || '',
                            timeline: rfqState.timeline || extracted.timeline || '',
                          });
                        }} placeholder="Paste scope, BOQ, SLA, service notes, or site requirements." className="mt-3 min-h-[106px] w-full resize-none rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#050C17] px-3 py-2.5 text-[12px] leading-relaxed text-[#EEF3FA] outline-none placeholder:text-[#4A6480] focus:border-[#2E7FFF]" />
                        <div className="mt-3 grid gap-2">
                          {rfqState.documents.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-[#2E7FFF]/25 px-3 py-3 text-[11px] text-[#8AA6C8]">No scope files uploaded yet.</div>
                          ) : rfqState.documents.map(doc => (
                            <div key={doc.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-[#2E7FFF]/18 bg-[#102544] p-3 text-[10px] text-[#C8D8EE]">
                              <FileText size={12} className="text-[#8DBDFF]" />
                              <span className="max-w-[280px] truncate font-semibold">{doc.name}</span>
                              <span className="text-[#6F89AA]">{doc.sizeLabel}</span>
                              {doc.warning && <span className="text-amber-200">{doc.warning}</span>}
                              <button type="button" onClick={() => patchRfq({ documents: rfqState.documents.filter(item => item.id !== doc.id) })} className="ml-auto text-[#7A94B4] hover:text-red-300" aria-label={`Remove ${doc.name}`}>
                                <Trash2 size={11} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <VendorWizardField label="Services">
                        <textarea value={rfqState.services} onChange={event => patchRfq({ services: event.target.value })} placeholder="Service lines, packages, or workstreams" className="min-h-[96px] w-full resize-none rounded-xl border border-[rgba(46,127,255,0.22)] bg-[#07111F] px-3 py-2.5 text-[12px] text-[#EEF3FA] outline-none placeholder:text-[#4A6480] focus:border-[#2E7FFF]" />
                      </VendorWizardField>
                      <VendorWizardField label="Inclusions">
                        <textarea value={rfqState.inclusions} onChange={event => patchRfq({ inclusions: event.target.value })} placeholder="What must be included" className="min-h-[96px] w-full resize-none rounded-xl border border-[rgba(46,127,255,0.22)] bg-[#07111F] px-3 py-2.5 text-[12px] text-[#EEF3FA] outline-none placeholder:text-[#4A6480] focus:border-[#2E7FFF]" />
                      </VendorWizardField>
                      <VendorWizardField label="Exclusions / assumptions">
                        <textarea value={rfqState.exclusions} onChange={event => patchRfq({ exclusions: event.target.value })} placeholder="What bidders must call out clearly" className="min-h-[84px] w-full resize-none rounded-xl border border-[rgba(46,127,255,0.22)] bg-[#07111F] px-3 py-2.5 text-[12px] text-[#EEF3FA] outline-none placeholder:text-[#4A6480] focus:border-[#2E7FFF]" />
                      </VendorWizardField>
                      <div className="grid gap-4">
                        <VendorWizardField label="Volume / asset basis">
                          <VendorWizardInput value={rfqState.volume || rfqExtracted.volume || ''} onChange={event => patchRfq({ volume: event.target.value })} placeholder="Assets, units, sqm, monthly jobs, BOQ basis" />
                        </VendorWizardField>
                        <VendorWizardField label="Timeline">
                          <VendorWizardInput value={rfqState.timeline || rfqExtracted.timeline || ''} onChange={event => patchRfq({ timeline: event.target.value })} placeholder="Mobilisation, milestones, service start" />
                        </VendorWizardField>
                      </div>
                    </div>
                  </div>
                )}

                {rfqState.step === 'requirements' && (
                  <div className="space-y-4">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8DBDFF]">Requirements</div>
                      <h4 className="mt-1 text-lg font-black text-[#EEF3FA]">Set the rules vendors must answer</h4>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {[
                        ['SLA / response rules', 'sla', rfqState.sla || rfqExtracted.sla || ''],
                        ['Evidence requirements', 'evidence', rfqState.evidence || rfqExtracted.evidence || ''],
                        ['Compliance documents', 'compliance', rfqState.compliance || rfqExtracted.compliance || ''],
                        ['Licences / authority approvals', 'licenses', rfqState.licenses],
                        ['Insurance', 'insurance', rfqState.insurance],
                        ['HSE and mobilisation', 'hse', rfqState.hse],
                      ].map(([label, key, value]) => (
                        <VendorWizardField key={key} label={label}>
                          <textarea
                            value={value}
                            onChange={event => patchRfq({ [key]: event.target.value } as Partial<RfqWizardState>)}
                            placeholder={`Add ${label.toLowerCase()}`}
                            className="min-h-[92px] w-full resize-none rounded-xl border border-[rgba(46,127,255,0.22)] bg-[#07111F] px-3 py-2.5 text-[12px] text-[#EEF3FA] outline-none placeholder:text-[#4A6480] focus:border-[#2E7FFF]"
                          />
                        </VendorWizardField>
                      ))}
                      <VendorWizardField label="Mobilisation notes">
                        <textarea value={rfqState.mobilisation} onChange={event => patchRfq({ mobilisation: event.target.value })} placeholder="Resource plan, lead times, access constraints, kickoff sequence" className="min-h-[92px] w-full resize-none rounded-xl border border-[rgba(46,127,255,0.22)] bg-[#07111F] px-3 py-2.5 text-[12px] text-[#EEF3FA] outline-none placeholder:text-[#4A6480] focus:border-[#2E7FFF]" />
                      </VendorWizardField>
                    </div>
                  </div>
                )}

                {rfqState.step === 'scoring' && (
                  <div className="space-y-4">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8DBDFF]">Scoring</div>
                      <h4 className="mt-1 text-lg font-black text-[#EEF3FA]">Tune the evaluation weights</h4>
                      <p className="mt-1 text-[12px] leading-5 text-[#9CB1CC]">Current total: <span className={rfqScoringTotal === 100 ? 'text-emerald-200' : 'text-amber-200'}>{rfqScoringTotal}%</span>. The package will show the weights exactly as set.</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {(Object.keys(rfqState.scoring) as RfqScoringKey[]).map(key => (
                        <div key={key} className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#0D1E3A] p-3">
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <label className="text-[11px] font-black uppercase tracking-[0.12em] text-[#8DBDFF]">{key}</label>
                            <span className="text-[12px] font-black text-[#EEF3FA]">{rfqState.scoring[key]}%</span>
                          </div>
                          <input type="range" min="0" max="50" value={rfqState.scoring[key]} onChange={event => patchRfqScoring(key, event.target.value)} className="w-full accent-[#2E7FFF]" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {rfqState.step === 'review' && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8DBDFF]">Review package</div>
                        <h4 className="mt-1 text-lg font-black text-[#EEF3FA]">{rfqPackage?.title ?? 'Generate the RFQ review package'}</h4>
                        <p className="mt-1 text-[12px] leading-5 text-[#9CB1CC]">{rfqPackage?.summary ?? 'Complete the required context, then generate the package for review before sending.'}</p>
                      </div>
                      <button type="button" onClick={generateRfqPackage} disabled={!canGenerateRfq} className="inline-flex items-center gap-2 rounded-xl bg-[#2E7FFF] px-4 py-2 text-[11px] font-black text-white shadow-lg shadow-[#2E7FFF]/20 transition-all hover:bg-[#4B91FF] disabled:cursor-not-allowed disabled:bg-[#1A3356] disabled:text-[#7891B0] disabled:shadow-none">
                        <Sparkles size={13} />
                        Generate RFQ
                      </button>
                    </div>
                    {!rfqPackage ? (
                      <div className="rounded-2xl border border-dashed border-[#2E7FFF]/28 bg-[#0D1E3A] p-5 text-[12px] leading-6 text-[#9CB1CC]">
                        Provide a project anchor and one source of scope: tell AI, select a template, or upload/paste scope documents.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {[
                          ['Project / Property Context', rfqPackage.contextLines],
                          ['Scope of Services', rfqPackage.scopeLines],
                          ['Vendor Response Fields', rfqPackage.responseFields],
                          ['Mandatory Documents', rfqPackage.mandatoryDocuments],
                          ['SLA and Evidence Requirements', rfqPackage.slaEvidence],
                          ['Commercial Pricing Table', rfqPackage.commercialTable],
                          ['Submission Rules', rfqPackage.submissionRules],
                        ].map(([title, lines]) => (
                          <div key={title as string} className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#0D1E3A] p-3">
                            <div className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#8DBDFF]">{title as string}</div>
                            <ul className="space-y-1.5">
                              {(lines as string[]).map(line => <li key={line} className="flex gap-2 text-[11px] leading-5 text-[#C8D8EE]"><CheckCircle size={11} className="mt-1 shrink-0 text-emerald-400" />{line}</li>)}
                            </ul>
                          </div>
                        ))}
                        <div className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#0D1E3A] p-3">
                          <div className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#8DBDFF]">Evaluation Scoring Matrix</div>
                          <div className="grid gap-2 sm:grid-cols-3">
                            {rfqPackage.scoringMatrix.map(item => (
                              <div key={item.label} className="rounded-lg border border-[#2E7FFF]/14 bg-[#07111F] px-3 py-2 text-[11px] font-bold text-[#DDE6F8]">{item.label}: {item.weight}%</div>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {rfqPackage.actions.map(action => (
                            <button key={action} type="button" onClick={() => runRfqAction(action)} className="rounded-xl border border-[#2E7FFF]/28 bg-[#2E7FFF]/12 px-3 py-2 text-[11px] font-bold text-[#BFD8FF] transition-all hover:bg-[#2E7FFF]/18">
                              {action}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>

              <aside className="space-y-3">
                <div className="rounded-2xl border border-[rgba(46,127,255,0.18)] bg-[#0D1E3A] p-4">
                  <div className="mb-3 text-[10px] font-black uppercase tracking-[0.16em] text-[#8DBDFF]">Selected context</div>
                  {[
                    ['Property', rfqState.anchor.propertyName],
                    ['Project', rfqState.anchor.projectName],
                    ['Project type', rfqState.anchor.projectType],
                    ['Category', rfqState.anchor.serviceCategory],
                    ['Sites / areas', rfqState.anchor.sitesAreas],
                    ['Mode', rfqState.mode ? rfqState.mode === 'tell' ? 'Tell AI' : rfqState.mode === 'template' ? 'Use Template' : 'Upload Scope Docs' : 'Choose next'],
                  ].map(([label, value]) => (
                    <div key={label} className="border-b border-[rgba(46,127,255,0.10)] py-2 last:border-b-0">
                      <div className="text-[9px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">{label}</div>
                      <div className="mt-1 text-[12px] font-bold leading-5 text-[#EEF3FA]">{value || 'Not set'}</div>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border border-emerald-400/18 bg-emerald-400/8 p-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-200">Ready checks</div>
                  <div className="mt-3 space-y-2">
                    {[
                      ['Project selected', Boolean(rfqState.anchor.projectName)],
                      ['Sites confirmed', Boolean(rfqState.anchor.sitesAreas)],
                      ['Creation mode selected', Boolean(rfqState.mode)],
                      ['Scope source provided', canGenerateRfq],
                    ].map(([label, done]) => (
                      <div key={label as string} className="flex items-center gap-2 text-[11px] text-[#C8D8EE]">
                        <CheckCircle size={12} className={done ? 'text-emerald-300' : 'text-[#415A76]'} />
                        {label as string}
                      </div>
                    ))}
                  </div>
                </div>
                {selectedRfqTemplate && (
                  <div className="rounded-2xl border border-violet-300/18 bg-violet-400/10 p-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-100">Template selected</div>
                    <div className="mt-1 text-[13px] font-black text-[#EEF3FA]">{selectedRfqTemplate.label}</div>
                    <p className="mt-2 text-[11px] leading-5 text-[#C8D8EE]">Defaults are editable in the next steps.</p>
                  </div>
                )}
                {rfqFeedback && (
                  <div className="rounded-2xl border border-[#2E7FFF]/22 bg-[#2E7FFF]/10 p-4 text-[12px] font-bold text-[#BFD8FF]">{rfqFeedback}</div>
                )}
              </aside>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[rgba(46,127,255,0.14)] pt-4">
              <div className="text-[11px] text-[#7A94B4]">
                {canGenerateRfq ? 'Ready to generate once you reach Review.' : 'Complete the project anchor and provide scope through one creation mode.'}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={rfqCurrentStepIndex === 0 ? onClose : () => patchRfq({ step: rfqStepOrder[Math.max(0, rfqCurrentStepIndex - 1)] })} className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#07111F] px-4 py-2 text-[12px] font-semibold text-[#8AA6C8] transition-all hover:bg-white/5 hover:text-white">
                  {rfqCurrentStepIndex === 0 ? 'Cancel' : 'Back'}
                </button>
                {rfqState.step === 'review' ? (
                  <button type="button" onClick={generateRfqPackage} disabled={!canGenerateRfq} className="rounded-xl bg-[#2E7FFF] px-5 py-2 text-[12px] font-bold text-white shadow-lg shadow-[#2E7FFF]/20 transition-all hover:bg-[#4B91FF] disabled:cursor-not-allowed disabled:bg-[#1A3356] disabled:text-[#7891B0] disabled:shadow-none">
                    Generate RFQ
                  </button>
                ) : (
                  <button type="button" onClick={() => patchRfq({ step: rfqStepOrder[Math.min(rfqStepOrder.length - 1, rfqCurrentStepIndex + 1)] })} className="rounded-xl bg-[#2E7FFF] px-5 py-2 text-[12px] font-bold text-white shadow-lg shadow-[#2E7FFF]/20 transition-all hover:bg-[#4B91FF]">
                    Continue
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
        <div className="grid min-h-0 flex-1 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="custom-scrollbar min-h-0 overflow-y-auto border-b border-[rgba(46,127,255,0.14)] p-5 lg:border-b-0 lg:border-r">
            <div className="rounded-2xl border border-[#2E7FFF]/18 bg-[#07111F] p-4">
              <div className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#8DBDFF]">Assistant</div>
              <p className="text-[13px] leading-6 text-[#DDE6F8]">{assistantNote}</p>
            </div>

            <div className="mt-4 rounded-2xl border border-[rgba(46,127,255,0.18)] bg-[#0D1E3A] p-4">
              <div className="mb-3 text-[10px] font-black uppercase tracking-[0.16em] text-[#7A94B4]">Choose an outcome</div>
              <div className="grid gap-2 sm:grid-cols-2">
                {chips.map(chip => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => run(chip.action)}
                    className={`group rounded-xl border p-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-[#2E7FFF]/45 ${
                      result.action === chip.action
                        ? 'border-[#2E7FFF]/50 bg-[#2E7FFF]/18 shadow-[0_0_22px_rgba(46,127,255,0.16)]'
                        : 'border-[rgba(46,127,255,0.14)] bg-[#07111F]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#2E7FFF]/12 text-[#8DBDFF]">{chip.icon}</span>
                      <div className="min-w-0">
                        <div className="text-[11px] font-black text-[#EEF3FA]">{chip.label}</div>
                        <div className="mt-0.5 text-[9px] leading-3 text-[#8AA6C8]">{chip.detail}</div>
                      </div>
                      <ChevronRight size={13} className="ml-auto text-[#5A7393] transition-transform group-hover:translate-x-0.5 group-hover:text-[#8DBDFF]" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[rgba(46,127,255,0.18)] bg-[#07111F] p-3">
              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsListening(prev => !prev);
                    setAssistantNote(isListening ? 'Voice paused. You can type or choose an outcome.' : 'Listening mode is ready. Speak the procurement task, then send it as text.');
                  }}
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl border transition-all ${isListening ? 'border-red-400/45 bg-red-400/14 text-red-200 shadow-lg shadow-red-500/20' : 'border-[#2E7FFF]/28 bg-[#2E7FFF]/12 text-[#8DBDFF] hover:bg-[#2E7FFF]/20'}`}
                  aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                >
                  <Mic size={19} />
                </button>
                <label className="min-w-0 flex-1">
                  <span className="sr-only">Type procurement request</span>
                  <textarea
                    value={prompt}
                    onChange={event => setPrompt(event.target.value)}
                    placeholder="Ask for an RFQ, quote comparison, background check, price analysis..."
                    spellCheck={false}
                    className="min-h-[78px] w-full resize-none rounded-xl border border-[rgba(46,127,255,0.22)] bg-[#0D1E3A] px-3 py-2.5 text-[12px] leading-5 text-[#EEF3FA] outline-none transition-all placeholder:text-[#5A7393] focus:border-[#2E7FFF]"
                  />
                </label>
                <button
                  type="button"
                  onClick={submitPrompt}
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#ED1D2E] text-white shadow-lg shadow-[#ED1D2E]/20 transition-all hover:bg-[#ff3040]"
                  aria-label="Send procurement request"
                >
                  <Send size={17} />
                </button>
              </div>
            </div>
          </div>

          <div className="custom-scrollbar min-h-0 overflow-y-auto p-5">
            {result.action === 'compare' && (
              <div className="mb-4 rounded-2xl border border-emerald-400/22 bg-emerald-500/8 p-4">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">
                      <BarChart3 size={13} />
                      Quote comparison
                    </div>
                    <h4 className="mt-1 text-sm font-bold text-[#EEF3FA]">Upload quotes for AI analysis</h4>
                    <p className="mt-1 text-[11px] leading-5 text-[#9CB1CC]">
                      Add quote files or paste supplier offers. The assistant scores price, SLA, warranty, exclusions, and award risk.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#2E7FFF]/30 bg-[#2E7FFF]/12 px-3 py-2 text-[11px] font-bold text-[#BFD8FF] transition-all hover:bg-[#2E7FFF]/18">
                      <UploadCloud size={13} />
                      Upload quotes
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.txt,.csv,.md,.json,.png,.jpg,.jpeg"
                        onChange={addQuoteDocuments}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={analyseQuotes}
                      disabled={quoteDocuments.length === 0 && !quoteNotes.trim()}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#2E7FFF] px-3 py-2 text-[11px] font-bold text-white shadow-lg shadow-[#2E7FFF]/20 transition-all hover:bg-[#4B91FF] disabled:cursor-not-allowed disabled:bg-[#1A3356] disabled:text-[#7891B0] disabled:shadow-none"
                    >
                      <Sparkles size={13} />
                      Analyse quotes
                    </button>
                  </div>
                </div>

                <textarea
                  value={quoteNotes}
                  onChange={event => {
                    setQuoteNotes(event.target.value);
                    setQuoteAnalysis(null);
                  }}
                  placeholder="Paste quote text"
                  className="min-h-[88px] w-full resize-none rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#050C17] px-3 py-2.5 text-[12px] leading-relaxed text-[#EEF3FA] outline-none transition-all placeholder:text-[#4A6480] focus:border-[#2E7FFF]"
                />

                <div className="mt-3 flex flex-wrap gap-2">
                  {quoteDocuments.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-[#2E7FFF]/25 px-3 py-2 text-[11px] text-[#7A94B4]">
                      No quote files added yet
                    </div>
                  ) : (
                    quoteDocuments.map(doc => (
                      <div key={doc.id} className="inline-flex items-center gap-2 rounded-lg border border-[#2E7FFF]/18 bg-[#102544] px-2.5 py-1.5 text-[10px] text-[#C8D8EE]">
                        <FileText size={12} className="text-[#8DBDFF]" />
                        <span className="max-w-[180px] truncate font-semibold">{doc.name}</span>
                        <span className="text-[#6F89AA]">{doc.sizeLabel}</span>
                        <button type="button" onClick={() => { setQuoteDocuments(prev => prev.filter(item => item.id !== doc.id)); setQuoteAnalysis(null); }} className="text-[#7A94B4] hover:text-red-300" aria-label={`Remove ${doc.name}`}>
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {quoteAnalysis && (
                  <div className="mt-4 space-y-3">
                    <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-3">
                      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-200">Recommended winner</div>
                      <div className="mt-1 text-[14px] font-black text-[#EEF3FA]">{quoteAnalysis.winner.vendorName}</div>
                      <p className="mt-1 text-[11px] leading-5 text-[#C8D8EE]">{quoteAnalysis.summary}</p>
                    </div>
                    <div className="grid gap-2">
                      {quoteAnalysis.items.map(item => (
                        <div key={item.id} className="grid gap-2 rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#07111F] p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                          <div>
                            <div className="text-[12px] font-bold text-[#EEF3FA]">{item.vendorName}</div>
                            <div className="mt-1 text-[10px] leading-4 text-[#8AA6C8]">
                              {item.amount === null ? 'Price not found' : `AED ${item.amount.toLocaleString()}`} / {item.sla === null ? 'SLA not found' : `${item.sla}% SLA`} / {item.warranty} / {item.exclusions}
                            </div>
                            <div className="mt-1 text-[10px] text-[#C8D8EE]">{item.finding}</div>
                          </div>
                          <div className="flex items-center gap-2 sm:justify-end">
                            <span className={`rounded-full border px-2 py-1 text-[9px] font-black ${item.risk === 'Low' ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200' : item.risk === 'Medium' ? 'border-amber-400/25 bg-amber-400/10 text-amber-200' : 'border-red-400/25 bg-red-400/10 text-red-200'}`}>
                              {item.risk} risk
                            </span>
                            <span className="rounded-full border border-[#2E7FFF]/25 bg-[#2E7FFF]/10 px-2 py-1 text-[9px] font-black text-[#8DBDFF]">
                              {item.score}/100
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#07111F] p-3">
                      <div className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#8DBDFF]">AI findings</div>
                      <ul className="space-y-2">
                        {quoteAnalysis.findings.map(finding => (
                          <li key={finding} className="flex gap-2 text-[11px] leading-5 text-[#C8D8EE]">
                            <CheckCircle size={11} className="mt-1 shrink-0 text-emerald-400" />
                            {finding}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {(quoteDocuments.length > 0 || quoteNotes || quoteAnalysis) && (
                  <button type="button" onClick={clearQuoteIntake} className="mt-3 text-[10px] font-bold text-[#8AA6C8] transition-colors hover:text-white">
                    Clear quote intake
                  </button>
                )}
              </div>
            )}

            <div className="rounded-2xl border border-[rgba(46,127,255,0.20)] bg-[#0D1E3A] p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <div className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#8DBDFF]">Live work product</div>
                  <h4 className="text-base font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{result.title}</h4>
                  <p className="mt-2 text-[12px] leading-5 text-[#9CB1CC]">{result.summary}</p>
                </div>
                <span className="shrink-0 rounded-full border border-emerald-400/22 bg-emerald-400/10 px-3 py-1 text-[10px] font-black text-emerald-200">
                  {result.status}
                </span>
              </div>

              <div className="space-y-3">
                {result.sections.map(section => (
                  <div key={section.title} className="rounded-xl border border-[rgba(46,127,255,0.12)] bg-[#07111F] p-3">
                    <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#8DBDFF]">
                      <ListChecks size={12} />
                      {section.title}
                    </div>
                    <ul className="space-y-2">
                      {section.lines.map(line => (
                        <li key={line} className="flex gap-2 text-[11px] leading-5 text-[#C8D8EE]">
                          <CheckCircle size={11} className="mt-1 shrink-0 text-emerald-400" />
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="mt-3 rounded-xl border border-[#2E7FFF]/20 bg-[#2E7FFF]/10 p-3">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8DBDFF]">Next action</div>
                <div className="mt-1 text-[12px] font-bold text-[#EEF3FA]">{result.primaryCta}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenProfile}
              className="mt-3 w-full rounded-xl border border-[#2E7FFF]/30 bg-[#2E7FFF]/14 px-4 py-3 text-[12px] font-black text-[#8DBDFF] transition-all hover:bg-[#2E7FFF]/22 hover:text-white"
            >
              Open focused vendor profile
            </button>
          </div>
        </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function MiniChart({ data, field, color }: { data: { month: string; [key: string]: number | string }[]; field: string; color: string }) {
  const values = data.map(d => d[field] as number);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 220;
  const h = 50;
  const pad = 4;
  const points = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - (((d[field] as number) - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  }).join(' ');
  return (
    <div className="flex flex-col gap-1">
      <svg width={w} height={h} className="overflow-visible">
        <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => {
          const x = pad + (i / (data.length - 1)) * (w - pad * 2);
          const y = h - pad - (((d[field] as number) - min) / range) * (h - pad * 2);
          return <circle key={i} cx={x} cy={y} r={2.5} fill={color} />;
        })}
      </svg>
      <div className="flex justify-between px-1">
        {data.map(d => (
          <span key={d.month} className="text-[9px] text-[#7A94B4]">{d.month}</span>
        ))}
      </div>
    </div>
  );
}

function computePeerAvgs(vendors: VendorIntelData[]) {
  if (vendors.length === 0) return { sla: 85, ftf: 80, evc: 85 };
  return {
    sla: Math.round(vendors.reduce((s, v) => s + v.slaCompliance, 0) / vendors.length),
    ftf: Math.round(vendors.reduce((s, v) => s + v.firstTimeFixRate, 0) / vendors.length),
    evc: Math.round(vendors.reduce((s, v) => s + v.evidenceCompliance, 0) / vendors.length),
  };
}

function VendorDetailPage({ vendor, onBack, onToast }: { vendor: VendorIntelData; onBack: () => void; onToast: ToastFn }) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedMetricInsight, setSelectedMetricInsight] = useState<VendorMetricInsight | null>(null);
  const [showCopilotModal, setShowCopilotModal] = useState(false);
  const [copilotAction, setCopilotAction] = useState<VendorCopilotAction>('rfq');
  const [copilotModalAction, setCopilotModalAction] = useState<VendorCopilotAction>('rfq');
  const [copilotOverride, setCopilotOverride] = useState<VendorCopilotResult | null>(null);
  const [copilotLog, setCopilotLog] = useState<string[]>([
    'Ready to draft RFQs, compare quotes, run checks, and prepare price actions.',
  ]);
  const { vendors: allVendors } = useVendors();

  const score = computeVendorScore(vendor);
  const riskLevel = classifyVendorRisk(score);
  const projectedScore = computeVendorScore({ ...vendor, slaCompliance: vendor.projectedTrend === 'up' ? Math.min(100, vendor.slaCompliance + 3) : vendor.projectedTrend === 'down' ? Math.max(0, vendor.slaCompliance - 5) : vendor.slaCompliance });

  const peerAvgs = computePeerAvgs(allVendors);
  const rankedVendors = [...allVendors].sort((a, b) => computeVendorScore(b) - computeVendorScore(a));
  const benchmarkRank = rankedVendors.findIndex(v => v.id === vendor.id) + 1;

  const copilotResult = copilotOverride ?? buildVendorCopilotResult(vendor, allVendors, copilotAction);
  const sections = ['Overview', 'Procurement Copilot', 'AI Insights', 'Contract Compliance', 'Cost vs Performance', 'Benchmarking', 'Predictive Risk', 'Recommendations', 'Dependency Risk'];
  const openMetricInsight = (metricName: VendorMetricName) => setSelectedMetricInsight(buildVendorMetricInsight(vendor, metricName));
  const runCopilotAction = (action: VendorCopilotAction) => {
    setCopilotAction(action);
    if (action !== 'rfq') setCopilotOverride(null);
    setCopilotLog(prev => [
      `${formatVendorAction(action)} for ${vendor.name}`,
      ...prev.filter(item => item !== `${formatVendorAction(action)} for ${vendor.name}`),
    ]);
    onToast(`${formatVendorAction(action)} for ${vendor.name}`, action === 'background' ? 'warning' : 'success');
  };
  const openRfqWizard = () => {
    setCopilotModalAction('rfq');
    setShowCopilotModal(true);
  };
  const openQuoteIntake = () => {
    setCopilotAction('compare');
    setCopilotOverride(null);
    setCopilotModalAction('compare');
    setShowCopilotModal(true);
  };
  const runCopilotModalAction = (action: VendorCopilotAction) => {
    setCopilotModalAction(action);
    runCopilotAction(action);
  };
  const updateRfqWorkbench = (rfqResult: VendorCopilotResult) => {
    setCopilotAction('rfq');
    setCopilotOverride(rfqResult);
    setCopilotLog(prev => [
      `${rfqResult.title} saved for ${vendor.name}`,
      ...prev.filter(item => item !== `${rfqResult.title} saved for ${vendor.name}`),
    ]);
    onToast('RFQ package saved to VendorIQ workbench', 'success');
  };

  return (
    <div className="relative h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-[rgba(46,127,255,0.15)] flex-shrink-0">
        <button onClick={onBack} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#7A94B4] hover:text-white transition-all">
          <ArrowLeft size={14} />
        </button>
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#2E7FFF]/15 flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={15} className="text-[#2E7FFF]" />
          </div>
          <div className="min-w-0">
            <h2 className="text-[#EEF3FA] font-bold text-sm truncate" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{vendor.name}</h2>
            <p className="text-[10px] text-[#7A94B4]">{vendor.category} · {vendor.sites.join(', ')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${riskBg(riskLevel)}`}>{riskLevel}</span>
          <button
            onClick={() => setShowReassignModal(true)}
            className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600/30 transition-all"
          >
            Reassign Work
          </button>
          <button
            onClick={() => setShowReviewModal(true)}
            className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-amber-600/20 border border-amber-500/30 text-amber-400 hover:bg-amber-600/30 transition-all"
          >
            Trigger Vendor Review
          </button>
        </div>
      </div>

      <div className="flex gap-1 px-5 py-2 border-b border-[rgba(46,127,255,0.08)] overflow-x-auto no-scrollbar flex-shrink-0">
        {sections.map(s => (
          <button
            key={s}
            onClick={() => {
              const el = document.getElementById(`vendor-section-${s.replace(/\s/g, '-')}`);
              el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              setActiveSection(s);
            }}
            className={`text-[10px] px-3 py-1.5 rounded-lg whitespace-nowrap font-semibold transition-all flex-shrink-0 ${
              activeSection === s ? 'bg-[#2E7FFF]/20 text-[#2E7FFF]' : 'text-[#7A94B4] hover:text-[#EEF3FA] hover:bg-white/5'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-4">
        <div id="vendor-section-Overview">
          <DetailSection icon={<Star size={12} className="text-[#2E7FFF]" />} title="Overview">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="relative col-span-2 sm:col-span-1 flex items-center gap-4 bg-[#0D1E3A] rounded-xl p-3 pr-10">
                <VendorAIInsightBadge onClick={() => openMetricInsight('Vendor Score')} />
                <ScoreRing score={score} size={64} />
                <div>
                  <div className="text-[10px] text-[#7A94B4] mb-0.5">Vendor Score</div>
                  <div className="flex items-center gap-1.5">
                    <TrendIcon trend={vendor.trend} size={14} />
                    <span className="text-[11px] text-[#7A94B4]">{vendor.trend === 'up' ? 'Improving' : vendor.trend === 'down' ? 'Declining' : 'Stable'}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1 inline-block ${riskBg(riskLevel)}`}>{riskLevel}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 col-span-2 sm:col-span-1">
                {[
                  { label: 'SLA Compliance', value: `${vendor.slaCompliance}%`, color: scoreColor(vendor.slaCompliance), metric: 'SLA Compliance' as const },
                  { label: 'First-Time Fix', value: `${vendor.firstTimeFixRate}%`, color: scoreColor(vendor.firstTimeFixRate), metric: 'First-Time Fix' as const },
                  { label: 'Avg Resolution', value: `${vendor.avgResolutionMin} min`, color: vendor.avgResolutionMin <= 45 ? '#38D98A' : vendor.avgResolutionMin <= 60 ? '#FF9B38' : '#FF4B4B', metric: 'Avg Resolution' as const },
                  { label: 'Evidence Compliance', value: `${vendor.evidenceCompliance}%`, color: scoreColor(vendor.evidenceCompliance), metric: 'Evidence Compliance' as const },
                ].map(k => (
                  <div key={k.label} className="relative bg-[#0A1628] rounded-lg p-2 pr-9 text-center">
                    <VendorAIInsightBadge onClick={() => openMetricInsight(k.metric)} />
                    <div className="text-[12px] font-bold" style={{ color: k.color }}>{k.value}</div>
                    <div className="text-[9px] text-[#7A94B4] mt-0.5">{k.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Active Contracts', value: vendor.activeContracts, icon: <Building2 size={10} className="text-[#2E7FFF]" />, metric: 'Active Contracts' as const },
                { label: 'Jobs Last 30d', value: vendor.jobsLast30d, icon: <CheckCircle size={10} className="text-emerald-400" />, metric: 'Jobs Last 30d' as const },
                { label: 'Avg Cost/Job', value: `AED ${vendor.avgCostPerJob}`, icon: <DollarSign size={10} className="text-amber-400" />, metric: 'Avg Cost/Job' as const },
              ].map(k => (
                <div key={k.label} className="relative bg-[#0A1628] rounded-lg p-2.5 pr-10">
                  <VendorAIInsightBadge onClick={() => openMetricInsight(k.metric)} />
                  <div className="flex items-center gap-1 mb-1">{k.icon}<span className="text-[9px] text-[#7A94B4]">{k.label}</span></div>
                  <div className="text-[13px] font-bold text-[#EEF3FA]">{k.value}</div>
                </div>
              ))}
            </div>
            {vendor.anomaly && (
              <div className="mt-3 flex items-start gap-2 bg-red-500/8 border border-red-500/25 rounded-lg p-2.5">
                <AlertTriangle size={13} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-red-300">{vendor.anomaly}</p>
              </div>
            )}
          </DetailSection>
        </div>

        <div id="vendor-section-Procurement-Copilot">
          <DetailSection icon={<Sparkles size={12} className="text-[#2E7FFF]" />} title="Procurement Copilot">
            <VendorCopilotWorkbench
              result={copilotResult}
              log={copilotLog}
              onRun={runCopilotAction}
              onOpenQuoteIntake={openQuoteIntake}
              onOpenRfqWizard={openRfqWizard}
            />
          </DetailSection>
        </div>

        <div id="vendor-section-AI-Insights">
          <DetailSection icon={<Brain size={12} className="text-[#2E7FFF]" />} title="AI Insights">
            <div className="space-y-2">
              {vendor.insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-2 bg-[#0D1E3A] rounded-lg p-2.5">
                  <Zap size={11} className="text-[#2E7FFF] flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-[#C8D8EE] leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="bg-[#0A1628] rounded-lg p-2.5">
                <div className="text-[9px] text-[#7A94B4] mb-1.5 uppercase tracking-wide">Repeat Failure Rate</div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] font-bold" style={{ color: vendor.repeatFailureRate <= 6 ? '#38D98A' : vendor.repeatFailureRate <= 10 ? '#FF9B38' : '#FF4B4B' }}>{vendor.repeatFailureRate}%</span>
                </div>
                <MiniBar value={vendor.repeatFailureRate} max={20} color={vendor.repeatFailureRate <= 6 ? '#38D98A' : vendor.repeatFailureRate <= 10 ? '#FF9B38' : '#FF4B4B'} />
              </div>
              <div className="bg-[#0A1628] rounded-lg p-2.5">
                <div className="text-[9px] text-[#7A94B4] mb-1.5 uppercase tracking-wide">Contract Expiry</div>
                <div className="text-[13px] font-bold text-[#EEF3FA]">{vendor.contractExpiry}</div>
                <div className="text-[9px] text-[#7A94B4] mt-0.5">{vendor.activeContracts} active contract{vendor.activeContracts !== 1 ? 's' : ''}</div>
              </div>
            </div>
          </DetailSection>
        </div>

        <div id="vendor-section-Contract-Compliance">
          <DetailSection icon={<CheckCircle size={12} className="text-[#2E7FFF]" />} title="Contract Compliance">
            {vendor.contractFlags.length === 0 ? (
              <div className="flex items-center gap-2 bg-emerald-500/8 border border-emerald-500/20 rounded-lg p-3">
                <CheckCircle size={14} className="text-emerald-400" />
                <p className="text-[11px] text-emerald-300">No contract breaches or compliance flags. All obligations current.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {vendor.contractFlags.map((flag, i) => (
                  <div key={i} className={`flex items-start gap-2 rounded-lg p-2.5 border ${
                    flag.type === 'breach' ? 'bg-red-500/8 border-red-500/25' : 'bg-amber-500/8 border-amber-500/20'
                  }`}>
                    {flagIcon(flag.type)}
                    <div>
                      <span className={`text-[9px] font-bold uppercase tracking-wide mr-2 ${flag.type === 'breach' ? 'text-red-400' : 'text-amber-400'}`}>
                        {flag.type === 'breach' ? 'SLA Breach' : flag.type === 'missing' ? 'Missing Evidence' : 'Warning'}
                      </span>
                      <p className="text-[11px] text-[#C8D8EE] mt-0.5">{flag.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { label: 'SLA Compliance', value: `${vendor.slaCompliance}%`, ok: vendor.slaCompliance >= 85 },
                { label: 'Evidence Rate', value: `${vendor.evidenceCompliance}%`, ok: vendor.evidenceCompliance >= 85 },
                { label: 'Contract Flags', value: vendor.contractFlags.length, ok: vendor.contractFlags.length === 0 },
              ].map(k => (
                <div key={k.label} className="bg-[#0A1628] rounded-lg p-2 text-center">
                  <div className={`text-[13px] font-bold ${k.ok ? 'text-emerald-400' : 'text-red-400'}`}>{k.value}</div>
                  <div className="text-[9px] text-[#7A94B4] mt-0.5">{k.label}</div>
                </div>
              ))}
            </div>
          </DetailSection>
        </div>

        <div id="vendor-section-Cost-vs-Performance">
          <DetailSection icon={<DollarSign size={12} className="text-[#2E7FFF]" />} title="Cost vs Performance">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-[#0D1E3A] rounded-xl p-3">
                <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-2">Cost Trend (AED/Job)</div>
                <MiniChart data={vendor.costTrend} field="cost" color="#FF9B38" />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] font-bold text-amber-400">AED {vendor.avgCostPerJob}</span>
                  <span className="text-[10px] text-[#7A94B4]">vs peer AED {vendor.costTrend[vendor.costTrend.length - 1].peerAvg}</span>
                </div>
              </div>
              <div className="bg-[#0D1E3A] rounded-xl p-3">
                <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-2">Score Trend</div>
                <MiniChart data={vendor.scoreTrend} field="score" color={scoreColor(score)} />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] font-bold" style={{ color: scoreColor(score) }}>{score} pts</span>
                  <div className="flex items-center gap-1">
                    <TrendIcon trend={vendor.trend} size={12} />
                    <span className="text-[10px] text-[#7A94B4]">{vendor.trend}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[#0A1628] rounded-lg p-2.5">
              <div className="text-[10px] text-[#7A94B4] mb-2">Cost vs Peer Average</div>
              <div className="space-y-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-[#EEF3FA]">{vendor.name}</span>
                    <span className="text-[10px] font-bold text-amber-400">AED {vendor.avgCostPerJob}</span>
                  </div>
                  <div className="h-1.5 bg-[#0D1E3A] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(vendor.avgCostPerJob / 600) * 100}%` }}
                      transition={{ duration: 0.6 }}
                      className="h-full rounded-full bg-amber-400"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-[#7A94B4]">Peer Average</span>
                    <span className="text-[10px] text-[#7A94B4]">AED {vendor.costTrend[vendor.costTrend.length - 1].peerAvg}</span>
                  </div>
                  <div className="h-1.5 bg-[#0D1E3A] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#7A94B4]"
                      style={{ width: `${(vendor.costTrend[vendor.costTrend.length - 1].peerAvg / 600) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </DetailSection>
        </div>

        <div id="vendor-section-Benchmarking">
          <DetailSection icon={<BarChart3 size={12} className="text-[#2E7FFF]" />} title="Benchmarking">
            <div className="mb-3 flex items-center gap-3 bg-[#0D1E3A] rounded-xl p-3">
              <div className="text-center">
                <div className="text-[22px] font-bold" style={{ color: scoreColor(score), fontFamily: 'Space Grotesk, sans-serif' }}>#{benchmarkRank}</div>
                <div className="text-[9px] text-[#7A94B4]">of {rankedVendors.length}</div>
              </div>
              <div className="flex-1 space-y-1.5">
                {rankedVendors.map((v, i) => {
                  const vs = computeVendorScore(v);
                  return (
                    <div key={v.id} className={`flex items-center gap-2 rounded px-1.5 py-0.5 ${v.id === vendor.id ? 'bg-[#2E7FFF]/15' : ''}`}>
                      <span className="text-[9px] text-[#7A94B4] w-4">#{i + 1}</span>
                      <span className={`text-[10px] flex-1 truncate ${v.id === vendor.id ? 'text-[#EEF3FA] font-semibold' : 'text-[#7A94B4]'}`}>{v.name}</span>
                      <div className="h-1 rounded-full overflow-hidden" style={{ width: '60px', background: '#0A1628' }}>
                        <div className="h-full rounded-full" style={{ width: `${vs}%`, background: scoreColor(vs) }} />
                      </div>
                      <span className="text-[9px] font-bold w-6 text-right" style={{ color: scoreColor(vs) }}>{vs}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'SLA Compliance', value: vendor.slaCompliance, peerAvg: peerAvgs.sla },
                { label: 'First-Time Fix', value: vendor.firstTimeFixRate, peerAvg: peerAvgs.ftf },
                { label: 'Evidence Rate', value: vendor.evidenceCompliance, peerAvg: peerAvgs.evc },
              ].map(k => (
                <div key={k.label} className="bg-[#0A1628] rounded-lg p-2.5">
                  <div className="text-[9px] text-[#7A94B4] mb-1">{k.label}</div>
                  <div className="text-[12px] font-bold mb-1" style={{ color: scoreColor(k.value) }}>{k.value}%</div>
                  <div className="text-[8px] text-[#7A94B4]">Peer avg: {k.peerAvg}%</div>
                </div>
              ))}
            </div>
          </DetailSection>
        </div>

        <div id="vendor-section-Predictive-Risk">
          <DetailSection icon={<AlertTriangle size={12} className="text-[#2E7FFF]" />} title="Predictive Risk">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0D1E3A] rounded-xl p-3">
                <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-2">30-Day Risk Score</div>
                <div className="flex items-end gap-2">
                  <span className="text-[28px] font-bold" style={{ color: vendor.predictedRisk30d >= 35 ? '#FF4B4B' : vendor.predictedRisk30d >= 20 ? '#FF9B38' : '#38D98A', fontFamily: 'Space Grotesk, sans-serif' }}>
                    {vendor.predictedRisk30d}%
                  </span>
                </div>
                <div className="h-1.5 bg-[#0A1628] rounded-full overflow-hidden mt-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${vendor.predictedRisk30d}%` }}
                    transition={{ duration: 0.6 }}
                    className="h-full rounded-full"
                    style={{ background: vendor.predictedRisk30d >= 35 ? '#FF4B4B' : vendor.predictedRisk30d >= 20 ? '#FF9B38' : '#38D98A' }}
                  />
                </div>
                <p className="text-[10px] text-[#7A94B4] mt-2">
                  {vendor.predictedRisk30d >= 35 ? 'High risk of SLA breach or contract escalation in next 30 days.' : vendor.predictedRisk30d >= 20 ? 'Moderate risk — monitor closely and prepare contingency.' : 'Low risk — current trajectory is sustainable.'}
                </p>
              </div>
              <div className="bg-[#0D1E3A] rounded-xl p-3">
                <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-2">Projected 30-Day Score</div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[28px] font-bold" style={{ color: scoreColor(projectedScore), fontFamily: 'Space Grotesk, sans-serif' }}>{projectedScore}</span>
                  <TrendIcon trend={vendor.projectedTrend} size={18} />
                </div>
                <div className="text-[10px] text-[#7A94B4]">
                  {projectedScore > score ? `+${projectedScore - score} pts projected` : projectedScore < score ? `${projectedScore - score} pts projected` : 'Score expected to remain stable'}
                </div>
              </div>
            </div>
          </DetailSection>
        </div>

        <div id="vendor-section-Recommendations">
          <DetailSection icon={<Target size={12} className="text-[#2E7FFF]" />} title="Recommendations">
            <div className="space-y-2.5">
              {vendor.recommendations.map((rec, i) => (
                <div key={i} className="bg-[#0D1E3A] rounded-xl p-3 border border-[rgba(46,127,255,0.1)]">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-[12px] font-semibold text-[#EEF3FA]">{rec.title}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border flex-shrink-0 ${actionColor(rec.action)}`}>
                      {rec.action === 'reassign' ? 'Reassign' : rec.action === 'renegotiate' ? 'Renegotiate' : rec.action === 'review' ? 'Trigger Review' : 'Limit Scope'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#7A94B4] leading-relaxed">{rec.detail}</p>
                  {(rec.action === 'reassign' || rec.action === 'review') && (
                    <button
                      onClick={() => rec.action === 'reassign' ? setShowReassignModal(true) : setShowReviewModal(true)}
                      className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-[#2E7FFF] hover:text-white transition-colors"
                    >
                      <ChevronRight size={11} />
                      {rec.action === 'reassign' ? 'Reassign Work Now' : 'Trigger Vendor Review'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </DetailSection>
        </div>

        <div id="vendor-section-Dependency-Risk">
          <DetailSection icon={<Users size={12} className="text-[#2E7FFF]" />} title="Dependency Risk">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${dependencyColor(vendor.dependencyRisk)}18`, border: `1px solid ${dependencyColor(vendor.dependencyRisk)}30` }}>
                <span className="text-[11px] font-bold" style={{ color: dependencyColor(vendor.dependencyRisk) }}>{vendor.dependencyRisk}</span>
              </div>
              <p className="text-[11px] text-[#C8D8EE] flex-1 leading-relaxed">{vendor.dependencyNote}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#0A1628] rounded-lg p-2.5">
                <div className="text-[9px] text-[#7A94B4] mb-1">Sites Covered</div>
                {vendor.sites.map(s => (
                  <div key={s} className="flex items-center gap-1 mt-0.5">
                    <div className="w-1 h-1 rounded-full bg-[#2E7FFF]" />
                    <span className="text-[10px] text-[#EEF3FA]">{s}</span>
                  </div>
                ))}
              </div>
              <div className="bg-[#0A1628] rounded-lg p-2.5">
                <div className="text-[9px] text-[#7A94B4] mb-1">Active Contracts</div>
                <div className="text-[20px] font-bold text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{vendor.activeContracts}</div>
                <div className="text-[9px] text-[#7A94B4]">Expiry: {vendor.contractExpiry}</div>
              </div>
            </div>
          </DetailSection>
        </div>
      </div>

      <AnimatePresence>
        {selectedMetricInsight && (
          <>
            <div className="absolute inset-0 z-30 bg-black/20" onClick={() => setSelectedMetricInsight(null)} />
            <VendorMetricInsightPanel insight={selectedMetricInsight} onClose={() => setSelectedMetricInsight(null)} />
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCopilotModal && (
          <PageProcurementCopilotModal
            focusVendor={vendor}
            vendors={allVendors}
            result={buildVendorCopilotResult(vendor, allVendors, copilotModalAction)}
            onClose={() => setShowCopilotModal(false)}
            onRun={runCopilotModalAction}
            onOpenProfile={() => setShowCopilotModal(false)}
            onRfqGenerated={updateRfqWorkbench}
          />
        )}
        {showReassignModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 px-6"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0D1E3A] border border-[rgba(46,127,255,0.3)] rounded-2xl p-5 max-w-sm w-full"
            >
              <h3 className="text-[#EEF3FA] font-bold text-sm mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Reassign Work — {vendor.name}</h3>
              <p className="text-[11px] text-[#7A94B4] mb-4 leading-relaxed">
                This will flag active jobs assigned to <strong className="text-[#EEF3FA]">{vendor.name}</strong> for reassignment to alternate vendors. Operations team will be notified to action.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowReassignModal(false); onToast(`Reassignment initiated for ${vendor.name} — Operations notified`, 'success'); }}
                  className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-[12px] font-semibold hover:bg-blue-500 transition-all"
                >
                  Confirm Reassignment
                </button>
                <button
                  onClick={() => setShowReassignModal(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 text-[#7A94B4] text-[12px] hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReviewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 px-6"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0D1E3A] border border-[rgba(46,127,255,0.3)] rounded-2xl p-5 max-w-sm w-full"
            >
              <h3 className="text-[#EEF3FA] font-bold text-sm mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Trigger Vendor Review — {vendor.name}</h3>
              <p className="text-[11px] text-[#7A94B4] mb-4 leading-relaxed">
                A formal performance review will be initiated for <strong className="text-[#EEF3FA]">{vendor.name}</strong>. The vendor will receive a 14-day notice to respond with a corrective action plan.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowReviewModal(false); onToast(`Vendor review triggered for ${vendor.name} — 14-day notice issued`, 'warning'); }}
                  className="flex-1 py-2 rounded-lg bg-amber-600/80 text-white text-[12px] font-semibold hover:bg-amber-500 transition-all"
                >
                  Confirm Trigger
                </button>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 text-[#7A94B4] text-[12px] hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function VendorWizardField({
  label,
  children,
  helper,
}: {
  label: string;
  children: React.ReactNode;
  helper?: string;
}) {
  return (
    <label className="space-y-1.5">
      <span className="block text-[9px] font-bold uppercase tracking-[0.18em] text-[#7A94B4]">{label}</span>
      {children}
      {helper && <span className="block text-[9px] text-[#5A7393]">{helper}</span>}
    </label>
  );
}

function VendorWizardInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-[rgba(46,127,255,0.22)] bg-[#07111F] px-3 py-2.5 text-[12px] text-[#EEF3FA] outline-none transition-all placeholder:text-[#4A6480] focus:border-[#2E7FFF] ${props.className ?? ''}`}
    />
  );
}

function VendorWizardSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-xl border border-[rgba(46,127,255,0.22)] bg-[#07111F] px-3 py-2.5 text-[12px] text-[#EEF3FA] outline-none transition-all focus:border-[#2E7FFF] ${props.className ?? ''}`}
    />
  );
}

function VendorWizardSummaryPill({ label, value, tone = 'blue' }: { label: string; value: string; tone?: 'blue' | 'green' | 'amber' | 'red' | 'purple' }) {
  const toneCls = {
    blue: 'border-[#2E7FFF]/25 bg-[#2E7FFF]/10 text-[#8DBDFF]',
    green: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
    amber: 'border-amber-500/25 bg-amber-500/10 text-amber-300',
    red: 'border-red-500/25 bg-red-500/10 text-red-300',
    purple: 'border-purple-500/25 bg-purple-500/10 text-purple-300',
  }[tone];
  return (
    <div className={`rounded-xl border px-3 py-2 ${toneCls}`}>
      <div className="text-[9px] uppercase tracking-[0.16em] opacity-70">{label}</div>
      <div className="mt-1 text-[13px] font-bold">{value}</div>
    </div>
  );
}

function AddVendorWizard({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (vendor: VendorIntelData) => void;
}) {
  const [step, setStep] = useState<VendorWizardStep>(1);
  const [form, setForm] = useState<VendorWizardForm>(initialVendorWizardForm);
  const [setupMode, setSetupMode] = useState<VendorSetupMode>('manual');
  const [aiDocuments, setAiDocuments] = useState<VendorSetupDocument[]>([]);
  const [aiNotes, setAiNotes] = useState('');
  const [aiExtractions, setAiExtractions] = useState<VendorAiExtraction[]>([]);
  const score = vendorWizardScore(form);
  const risk = classifyVendorRisk(score);
  const flags = parseVendorFlags(form.contractFlags);
  const sites = parseVendorSites(form.sites);
  const riskTone = risk === 'Preferred' ? 'green' : risk === 'Watchlist' ? 'amber' : 'red';
  const input = (field: keyof VendorWizardForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const stepCards = [
    { id: 1 as const, label: 'Vendor profile', detail: 'Scope, category, contacts' },
    { id: 2 as const, label: 'Performance baseline', detail: 'Score, SLA, evidence, cost' },
    { id: 3 as const, label: 'Compliance and risk', detail: 'Flags, dependency, prediction' },
    { id: 4 as const, label: 'AI review', detail: 'Insights and actions' },
  ];

  const dashboardSections = [
    { label: 'Overview', value: `${score}/100 score`, tone: riskTone },
    { label: 'Contract Compliance', value: `${flags.length} flags`, tone: flags.length ? 'amber' : 'green' },
    { label: 'Cost vs Performance', value: `AED ${numeric(form.avgCostPerJob, 450)}/job`, tone: 'amber' },
    { label: 'Predictive Risk', value: `${numeric(form.predictedRisk30d, 20)}% in 30d`, tone: numeric(form.predictedRisk30d, 20) > 30 ? 'red' : 'blue' },
    { label: 'Dependency Risk', value: form.dependencyRisk, tone: form.dependencyRisk === 'Low' ? 'green' : form.dependencyRisk === 'Medium' ? 'amber' : 'red' },
  ] as const;

  function submit() {
    onCreate(buildVendorFromWizard(form));
  }

  async function addAiDocuments(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    const docs = await Promise.all(files.map(async file => {
      const isReadable = file.type.startsWith('text/') || /\.(txt|csv|md|json|log)$/i.test(file.name);
      const content = isReadable ? await file.text().catch(() => '') : '';
      return {
        id: `${file.name}-${file.size}-${Date.now()}`,
        name: file.name,
        type: file.type || 'Document',
        sizeLabel: formatDocumentSize(file.size),
        content,
      };
    }));
    setAiDocuments(prev => [...docs, ...prev].slice(0, 8));
    event.target.value = '';
  }

  function populateFromAiDocuments() {
    if (aiDocuments.length === 0 && !aiNotes.trim()) return;
    const draft = buildVendorAiDraft(form, aiDocuments, aiNotes);
    setForm(draft.form);
    setAiExtractions(draft.extractions);
    setStep(1);
  }

  function clearAiDocuments() {
    setAiDocuments([]);
    setAiNotes('');
    setAiExtractions([]);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 bg-[#020814]/80 backdrop-blur-sm"
    >
      <div className="flex h-full items-center justify-center p-5">
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[rgba(46,127,255,0.28)] bg-[#081528] shadow-2xl"
        >
          <div className="flex items-start justify-between border-b border-[rgba(46,127,255,0.16)] bg-gradient-to-r from-[#121D3E] to-[#0A1628] px-6 py-5">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#2E7FFF]/25 bg-[#2E7FFF]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8DBDFF]">
                <Sparkles size={12} />
                VendorIQ setup
              </div>
              <h3 className="text-xl font-bold text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Add Vendor</h3>
              <p className="mt-1 text-[12px] text-[#8AA6C8]">Create the vendor exactly as Vendor Intelligence monitors it: score, contracts, cost, risk, dependency, and AI recommendations.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex shrink-0 rounded-xl border border-[#2E7FFF]/20 bg-[#07111F] p-1">
                {[
                  { id: 'manual' as const, label: 'Manual' },
                  { id: 'ai' as const, label: 'AI from docs' },
                ].map(mode => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setSetupMode(mode.id)}
                    className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all ${
                      setupMode === mode.id
                        ? 'bg-[#2E7FFF] text-white shadow-lg shadow-[#2E7FFF]/20'
                        : 'text-[#8AA6C8] hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
              <button onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 p-2 text-[#8AA6C8] transition-colors hover:bg-white/10 hover:text-white">
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 border-b border-[rgba(46,127,255,0.12)] px-6 py-4">
            {stepCards.map(card => (
              <button
                key={card.id}
                type="button"
                onClick={() => setStep(card.id)}
                className={`rounded-xl border p-3 text-left transition-all ${
                  step === card.id
                    ? 'border-[#2E7FFF]/45 bg-[#2E7FFF]/14'
                    : card.id < step
                      ? 'border-emerald-500/25 bg-emerald-500/8'
                      : 'border-[rgba(46,127,255,0.12)] bg-[#06111F]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold ${step === card.id ? 'bg-[#2E7FFF] text-white' : 'bg-[#102544] text-[#8AA6C8]'}`}>{card.id}</span>
                  <span className="text-[11px] font-bold text-[#EEF3FA]">{card.label}</span>
                </div>
                <p className="mt-1 text-[10px] text-[#7A94B4]">{card.detail}</p>
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5">
            {setupMode === 'ai' && (
              <div className="mb-5 rounded-2xl border border-cyan-400/22 bg-cyan-500/8 p-4">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">
                      <Wand2 size={13} />
                      AI document mode
                    </div>
                    <h4 className="mt-1 text-sm font-bold text-[#EEF3FA]">Populate setup from vendor documents</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#2E7FFF]/30 bg-[#2E7FFF]/12 px-3 py-2 text-[11px] font-bold text-[#BFD8FF] transition-all hover:bg-[#2E7FFF]/18">
                      <UploadCloud size={13} />
                      Add docs
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.txt,.csv,.md,.json,.png,.jpg,.jpeg"
                        onChange={addAiDocuments}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={populateFromAiDocuments}
                      disabled={aiDocuments.length === 0 && !aiNotes.trim()}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#2E7FFF] px-3 py-2 text-[11px] font-bold text-white shadow-lg shadow-[#2E7FFF]/20 transition-all hover:bg-[#4B91FF] disabled:cursor-not-allowed disabled:bg-[#1A3356] disabled:text-[#7891B0] disabled:shadow-none"
                    >
                      <Sparkles size={13} />
                      Populate fields
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 lg:grid-cols-[1fr_0.9fr]">
                  <div className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#07111F] p-3">
                    <textarea
                      value={aiNotes}
                      onChange={event => setAiNotes(event.target.value)}
                      placeholder="Paste contract scope, trade license text, quote details, SLA notes, insurance summary, or onboarding email."
                      className="min-h-[94px] w-full resize-none rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#050C17] px-3 py-2.5 text-[12px] leading-relaxed text-[#EEF3FA] outline-none transition-all placeholder:text-[#4A6480] focus:border-[#2E7FFF]"
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                      {aiDocuments.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-[#2E7FFF]/25 px-3 py-2 text-[11px] text-[#7A94B4]">
                          No documents added yet
                        </div>
                      ) : (
                        aiDocuments.map(doc => (
                          <div key={doc.id} className="inline-flex items-center gap-2 rounded-lg border border-[#2E7FFF]/18 bg-[#102544] px-2.5 py-1.5 text-[10px] text-[#C8D8EE]">
                            <FileText size={12} className="text-[#8DBDFF]" />
                            <span className="max-w-[180px] truncate font-semibold">{doc.name}</span>
                            <span className="text-[#6F89AA]">{doc.sizeLabel}</span>
                            <button type="button" onClick={() => setAiDocuments(prev => prev.filter(item => item.id !== doc.id))} className="text-[#7A94B4] hover:text-red-300" aria-label={`Remove ${doc.name}`}>
                              <Trash2 size={11} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#0D1E3A] p-3">
                    <div className="mb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[#8DBDFF]">Detected fields</div>
                    {aiExtractions.length === 0 ? (
                      <div className="rounded-xl border border-[rgba(46,127,255,0.12)] bg-[#07111F] p-3 text-[11px] leading-relaxed text-[#7A94B4]">
                        Add documents or paste notes, then populate fields.
                      </div>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {aiExtractions.slice(0, 8).map(item => (
                          <div key={`${item.label}-${item.value}`} className="rounded-lg border border-cyan-400/18 bg-cyan-500/8 p-2">
                            <div className="text-[8px] font-bold uppercase tracking-wide text-cyan-200">{item.label}</div>
                            <div className="mt-1 truncate text-[11px] font-bold text-[#EEF3FA]">{item.value}</div>
                            <div className="mt-0.5 text-[8px] uppercase tracking-wide text-[#6F89AA]">{item.source}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {(aiDocuments.length > 0 || aiNotes || aiExtractions.length > 0) && (
                      <button type="button" onClick={clearAiDocuments} className="mt-3 text-[10px] font-bold text-[#8AA6C8] transition-colors hover:text-white">
                        Clear AI intake
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-5 lg:grid-cols-[1.35fr_0.9fr]">
                <div className="rounded-2xl border border-[rgba(46,127,255,0.16)] bg-[#07111F] p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Building2 size={15} className="text-[#2E7FFF]" />
                    <h4 className="text-sm font-bold text-[#EEF3FA]">Vendor profile and service scope</h4>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <VendorWizardField label="Vendor name">
                      <VendorWizardInput value={form.name} onChange={input('name')} />
                    </VendorWizardField>
                    <VendorWizardField label="Category">
                      <VendorWizardSelect value={form.category} onChange={input('category')}>
                        {vendorCategories.map(category => <option key={category}>{category}</option>)}
                      </VendorWizardSelect>
                    </VendorWizardField>
                    <VendorWizardField label="Sites covered" helper="Comma separated">
                      <VendorWizardInput value={form.sites} onChange={input('sites')} />
                    </VendorWizardField>
                    <VendorWizardField label="Contract expiry">
                      <VendorWizardInput value={form.contractExpiry} onChange={input('contractExpiry')} />
                    </VendorWizardField>
                    <VendorWizardField label="Primary contact">
                      <VendorWizardInput value={form.pocName} onChange={input('pocName')} />
                    </VendorWizardField>
                    <VendorWizardField label="Contact title">
                      <VendorWizardInput value={form.pocTitle} onChange={input('pocTitle')} />
                    </VendorWizardField>
                    <VendorWizardField label="Phone">
                      <VendorWizardInput value={form.pocPhone} onChange={input('pocPhone')} />
                    </VendorWizardField>
                    <VendorWizardField label="Email">
                      <VendorWizardInput type="email" value={form.pocEmail} onChange={input('pocEmail')} />
                    </VendorWizardField>
                  </div>
                </div>
                <div className="rounded-2xl border border-purple-500/20 bg-purple-500/8 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Brain size={15} className="text-purple-300" />
                    <h4 className="text-sm font-bold text-[#EEF3FA]">How this maps to VendorIQ</h4>
                  </div>
                  <div className="space-y-2 text-[12px] text-[#C8D8EE]">
                    <p>Vendor profile powers the dashboard header, contract scope, dependency risk, and routing decisions.</p>
                    <p>Sites become the coverage map for reassignment, risk concentration, and contract lapse impact.</p>
                    <p>Contact details are used by review, renewal, and performance notice workflows.</p>
                  </div>
                  <div className="mt-4 grid gap-2">
                    <VendorWizardSummaryPill label="Coverage" value={`${sites.length || 1} site scope`} tone="blue" />
                    <VendorWizardSummaryPill label="Contract" value={form.contractExpiry || 'Not set'} tone="amber" />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
                <div className="rounded-2xl border border-[rgba(46,127,255,0.16)] bg-[#07111F] p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Activity size={15} className="text-[#2E7FFF]" />
                    <h4 className="text-sm font-bold text-[#EEF3FA]">Performance baseline</h4>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <VendorWizardField label="SLA compliance %"><VendorWizardInput type="number" min="0" max="100" value={form.slaCompliance} onChange={input('slaCompliance')} /></VendorWizardField>
                    <VendorWizardField label="First-time fix %"><VendorWizardInput type="number" min="0" max="100" value={form.firstTimeFixRate} onChange={input('firstTimeFixRate')} /></VendorWizardField>
                    <VendorWizardField label="Avg resolution minutes"><VendorWizardInput type="number" min="0" value={form.avgResolutionMin} onChange={input('avgResolutionMin')} /></VendorWizardField>
                    <VendorWizardField label="Evidence compliance %"><VendorWizardInput type="number" min="0" max="100" value={form.evidenceCompliance} onChange={input('evidenceCompliance')} /></VendorWizardField>
                    <VendorWizardField label="Repeat failure %"><VendorWizardInput type="number" min="0" max="100" value={form.repeatFailureRate} onChange={input('repeatFailureRate')} /></VendorWizardField>
                    <VendorWizardField label="Jobs last 30 days"><VendorWizardInput type="number" min="0" value={form.jobsLast30d} onChange={input('jobsLast30d')} /></VendorWizardField>
                    <VendorWizardField label="Avg cost / job"><VendorWizardInput type="number" min="0" value={form.avgCostPerJob} onChange={input('avgCostPerJob')} /></VendorWizardField>
                    <VendorWizardField label="Active contracts"><VendorWizardInput type="number" min="0" value={form.activeContracts} onChange={input('activeContracts')} /></VendorWizardField>
                  </div>
                </div>
                <div className="rounded-2xl border border-[rgba(46,127,255,0.16)] bg-[#0D1E3A] p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-[#EEF3FA]">Live score preview</h4>
                      <p className="text-[11px] text-[#7A94B4]">Uses the same scoring logic as the dashboard.</p>
                    </div>
                    <ScoreRing score={score} size={72} />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {dashboardSections.slice(0, 3).map(item => (
                      <VendorWizardSummaryPill key={item.label} label={item.label} value={item.value} tone={item.tone} />
                    ))}
                  </div>
                  <div className="mt-4 rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#07111F] p-3">
                    <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A94B4]">Interpretation</div>
                    <p className="mt-2 text-[12px] leading-relaxed text-[#C8D8EE]">
                      {risk === 'Preferred'
                        ? 'This vendor can enter preferred rotation once compliance documents are confirmed.'
                        : risk === 'Watchlist'
                          ? 'This vendor should start with controlled scope and a short KPI review cycle.'
                          : 'This vendor should not receive critical work until performance controls are agreed.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-2xl border border-[rgba(46,127,255,0.16)] bg-[#07111F] p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <ShieldCheck size={15} className="text-[#2E7FFF]" />
                    <h4 className="text-sm font-bold text-[#EEF3FA]">Compliance, risk, and dependency</h4>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <VendorWizardField label="Trend">
                      <VendorWizardSelect value={form.trend} onChange={input('trend')}>
                        <option value="up">Improving</option>
                        <option value="flat">Stable</option>
                        <option value="down">Declining</option>
                      </VendorWizardSelect>
                    </VendorWizardField>
                    <VendorWizardField label="Dependency risk">
                      <VendorWizardSelect value={form.dependencyRisk} onChange={input('dependencyRisk')}>
                        {['Low', 'Medium', 'High', 'Critical'].map(level => <option key={level}>{level}</option>)}
                      </VendorWizardSelect>
                    </VendorWizardField>
                    <VendorWizardField label="30-day predicted risk %">
                      <VendorWizardInput type="number" min="0" max="100" value={form.predictedRisk30d} onChange={input('predictedRisk30d')} />
                    </VendorWizardField>
                    <VendorWizardField label="Contract flags" helper="Separate multiple flags with semicolons">
                      <VendorWizardInput value={form.contractFlags} onChange={input('contractFlags')} />
                    </VendorWizardField>
                    <div className="sm:col-span-2">
                      <VendorWizardField label="Dependency note">
                        <textarea value={form.dependencyNote} onChange={input('dependencyNote')} className="min-h-[92px] w-full rounded-xl border border-[rgba(46,127,255,0.22)] bg-[#07111F] px-3 py-2.5 text-[12px] text-[#EEF3FA] outline-none transition-all placeholder:text-[#4A6480] focus:border-[#2E7FFF]" />
                      </VendorWizardField>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/8 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <AlertTriangle size={15} className="text-amber-300" />
                    <h4 className="text-sm font-bold text-[#EEF3FA]">Dashboard impact</h4>
                  </div>
                  <div className="grid gap-2">
                    {dashboardSections.slice(2).map(item => (
                      <VendorWizardSummaryPill key={item.label} label={item.label} value={item.value} tone={item.tone} />
                    ))}
                  </div>
                  <div className="mt-4 space-y-2">
                    {flags.length === 0 ? (
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-[12px] text-emerald-300">No contract flags will be shown at onboarding.</div>
                    ) : (
                      flags.map((flag, index) => (
                        <div key={index} className="rounded-xl border border-amber-500/20 bg-[#07111F] p-3 text-[12px] text-[#C8D8EE]">{flag.description}</div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
                <div className="rounded-2xl border border-purple-500/20 bg-purple-500/8 p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Brain size={15} className="text-purple-300" />
                    <h4 className="text-sm font-bold text-[#EEF3FA]">AI insight preview</h4>
                  </div>
                  <div className="space-y-2">
                    {buildVendorInsights(form, score).map((insight, index) => (
                      <div key={index} className="rounded-xl bg-[#07111F] p-3 text-[12px] leading-relaxed text-[#C8D8EE]">
                        {insight}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-[rgba(46,127,255,0.16)] bg-[#07111F] p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Target size={15} className="text-[#2E7FFF]" />
                    <h4 className="text-sm font-bold text-[#EEF3FA]">Recommendations generated</h4>
                  </div>
                  <div className="space-y-3">
                    {buildVendorRecommendations(form, score).map((rec, index) => (
                      <div key={index} className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#0D1E3A] p-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[12px] font-bold text-[#EEF3FA]">{rec.title}</span>
                          <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${actionColor(rec.action)}`}>{rec.action}</span>
                        </div>
                        <p className="mt-2 text-[11px] leading-relaxed text-[#8AA6C8]">{rec.detail}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <VendorWizardSummaryPill label="Score" value={`${score}/100`} tone={riskTone} />
                    <VendorWizardSummaryPill label="Classification" value={risk} tone={riskTone} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-[rgba(46,127,255,0.14)] px-6 py-4">
            <div className="text-[11px] text-[#7A94B4]">
              {setupMode === 'ai'
                ? `${aiDocuments.length} document${aiDocuments.length === 1 ? '' : 's'} added${aiExtractions.length ? `, ${aiExtractions.length} fields detected` : ''}. Review fields before adding the vendor.`
                : step < 4 ? 'VendorIQ will generate score, risk tier, AI insights, recommendations, and dependency context.' : 'Ready to add this vendor to Vendor Intelligence.'}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={step === 1 ? onClose : () => setStep(prev => (Math.max(1, prev - 1) as VendorWizardStep))} className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#07111F] px-4 py-2 text-[12px] font-semibold text-[#8AA6C8] transition-all hover:bg-white/5 hover:text-white">
                {step === 1 ? 'Cancel' : 'Back'}
              </button>
              {step < 4 ? (
                <button type="button" onClick={() => setStep(prev => (Math.min(4, prev + 1) as VendorWizardStep))} className="rounded-xl bg-[#2E7FFF] px-5 py-2 text-[12px] font-bold text-white shadow-lg shadow-[#2E7FFF]/20 transition-all hover:bg-[#4B91FF]">
                  Continue
                </button>
              ) : (
                <button type="button" onClick={submit} className="rounded-xl bg-[#ED1D2E] px-5 py-2 text-[12px] font-bold text-white shadow-lg shadow-[#ED1D2E]/20 transition-all hover:bg-[#ff3040]">
                  Add Vendor
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

interface Props { onToast: ToastFn }

export function VendorIntelligence({ onToast }: Props) {
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [selectedVendor, setSelectedVendor] = useState<VendorIntelData | null>(null);
  const [showAddVendorWizard, setShowAddVendorWizard] = useState(false);
  const [showPageCopilotModal, setShowPageCopilotModal] = useState(false);
  const [pageCopilotAction, setPageCopilotAction] = useState<VendorCopilotAction>('compare');
  const [pageCopilotModalAction, setPageCopilotModalAction] = useState<VendorCopilotAction>('compare');
  const [pageCopilotOverride, setPageCopilotOverride] = useState<VendorCopilotResult | null>(null);
  const [pageCopilotLog, setPageCopilotLog] = useState<string[]>([
    'Portfolio procurement copilot ready on the Vendor Intelligence page.',
  ]);
  const { vendors: allVendors, addVendor } = useVendors();

  const vendorsWithScores = allVendors.map(v => ({
    vendor: v,
    score: computeVendorScore(v),
    riskLevel: classifyVendorRisk(computeVendorScore(v)),
  }));

  const filteredVendors = (() => {
    const all = [...vendorsWithScores];
    switch (filterTab) {
      case 'top': return all.sort((a, b) => b.score - a.score).filter(v => v.riskLevel === 'Preferred');
      case 'atrisk': return all.filter(v => v.riskLevel === 'At Risk' || (v.riskLevel === 'Watchlist' && v.vendor.trend === 'down'));
      case 'cost': return all.sort((a, b) => a.vendor.avgCostPerJob - b.vendor.avgCostPerJob);
      default: return all.sort((a, b) => b.score - a.score);
    }
  })();

  const tabs: { id: FilterTab; label: string }[] = [
    { id: 'all', label: 'All Vendors' },
    { id: 'top', label: 'Top Vendors' },
    { id: 'atrisk', label: 'At Risk' },
    { id: 'cost', label: 'Cost Efficiency Ranking' },
  ];

  const summary = {
    preferred: vendorsWithScores.filter(v => v.riskLevel === 'Preferred').length,
    watchlist: vendorsWithScores.filter(v => v.riskLevel === 'Watchlist').length,
    atRisk: vendorsWithScores.filter(v => v.riskLevel === 'At Risk').length,
  };
  const procurementFocus = [...vendorsWithScores].sort((a, b) => {
    const aPriority = a.riskLevel === 'At Risk' ? 0 : a.riskLevel === 'Watchlist' ? 1 : 2;
    const bPriority = b.riskLevel === 'At Risk' ? 0 : b.riskLevel === 'Watchlist' ? 1 : 2;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return a.score - b.score;
  })[0]?.vendor ?? allVendors[0];
  const pageCopilotResult = pageCopilotOverride ?? buildVendorCopilotResult(procurementFocus, allVendors, pageCopilotAction);

  function runPageCopilotAction(action: VendorCopilotAction) {
    setPageCopilotAction(action);
    if (action !== 'rfq') setPageCopilotOverride(null);
    setPageCopilotLog(prev => [
      `${formatVendorAction(action)} from page copilot for ${procurementFocus.name}`,
      ...prev.filter(item => item !== `${formatVendorAction(action)} from page copilot for ${procurementFocus.name}`),
    ]);
    onToast(`${formatVendorAction(action)} from Procurement Copilot`, action === 'background' ? 'warning' : 'success');
  }

  function openPageRfqWizard() {
    setPageCopilotModalAction('rfq');
    setShowPageCopilotModal(true);
  }

  function openPageQuoteIntake() {
    setPageCopilotAction('compare');
    setPageCopilotModalAction('compare');
    setPageCopilotOverride(null);
    setShowPageCopilotModal(true);
  }

  function openPageCopilotModal() {
    setPageCopilotModalAction(pageCopilotAction);
    setShowPageCopilotModal(true);
  }

  function runPageCopilotModalAction(action: VendorCopilotAction) {
    setPageCopilotModalAction(action);
    runPageCopilotAction(action);
  }

  function updatePageRfqWorkbench(rfqResult: VendorCopilotResult) {
    setPageCopilotAction('rfq');
    setPageCopilotOverride(rfqResult);
    setPageCopilotLog(prev => [
      `${rfqResult.title} saved to Procurement Copilot`,
      ...prev.filter(item => item !== `${rfqResult.title} saved to Procurement Copilot`),
    ]);
    onToast('RFQ package saved to Procurement Copilot', 'success');
  }

  function createVendor(vendor: VendorIntelData) {
    addVendor(vendor);
    setShowAddVendorWizard(false);
    setFilterTab('all');
    setSelectedVendor(vendor);
    onToast(`${vendor.name} added to Vendor Intelligence`, 'success');
  }

  if (selectedVendor) {
    return (
      <div className="absolute inset-0 flex flex-col">
        <VendorDetailPage vendor={selectedVendor} onBack={() => setSelectedVendor(null)} onToast={onToast} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(46,127,255,0.15)] flex-shrink-0">
        <div>
          <h2 className="text-[#EEF3FA] font-bold text-base" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Vendor Intelligence & Contract Optimization</h2>
          <p className="text-[11px] text-[#7A94B4]">AI-powered vendor scoring, risk detection, and contract compliance monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddVendorWizard(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#ED1D2E] px-4 py-2 text-[12px] font-bold text-white shadow-lg shadow-[#ED1D2E]/20 transition-all hover:bg-[#ff3040]"
          >
            <Plus size={14} />
            Add Vendor
          </button>
          <div className="hidden items-center gap-1.5 sm:flex">
            <ShieldCheck size={14} className="text-[#2E7FFF]" />
            <span className="text-[10px] text-[#7A94B4]">4C360 Vendor AI</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 px-5 py-3 border-b border-[rgba(46,127,255,0.08)] flex-shrink-0">
        {[
          { label: 'Preferred', count: summary.preferred, color: '#38D98A' },
          { label: 'Watchlist', count: summary.watchlist, color: '#FF9B38' },
          { label: 'At Risk', count: summary.atRisk, color: '#FF4B4B' },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
            <span className="text-[11px] font-bold" style={{ color: s.color }}>{s.count}</span>
            <span className="text-[11px] text-[#7A94B4]">{s.label}</span>
          </div>
        ))}
        <div className="h-4 w-px bg-[rgba(46,127,255,0.2)] mx-1" />
        <span className="text-[11px] text-[#7A94B4]">{allVendors.length} vendors · {allVendors.reduce((s, v) => s + v.activeContracts, 0)} active contracts</span>
      </div>

      <div className="flex items-center gap-1 px-5 py-2 border-b border-[rgba(46,127,255,0.08)] flex-shrink-0 overflow-x-auto no-scrollbar">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setFilterTab(t.id)}
            className={`text-[11px] px-3 py-1.5 rounded-lg whitespace-nowrap font-semibold transition-all flex-shrink-0 ${
              filterTab === t.id
                ? 'bg-[#2E7FFF]/20 text-[#2E7FFF] border border-[#2E7FFF]/30'
                : 'text-[#7A94B4] hover:text-[#EEF3FA] hover:bg-white/5'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4">
        <div className="mb-4 overflow-hidden rounded-2xl border border-[#2E7FFF]/28 bg-[linear-gradient(135deg,rgba(17,32,64,0.96),rgba(7,17,31,0.98))] shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[rgba(46,127,255,0.16)] bg-[linear-gradient(90deg,rgba(46,127,255,0.18),rgba(237,29,46,0.10),rgba(7,17,31,0))] px-5 py-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#2E7FFF]/30 bg-[#2E7FFF]/12 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#8DBDFF]">
                <Sparkles size={12} />
                Procurement Copilot
              </div>
              <h3 className="text-lg font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Source, compare, check, and negotiate vendors from this page
              </h3>
              <p className="mt-1 max-w-3xl text-[12px] leading-5 text-[#9CB1CC]">
                Run sourcing work across the portfolio without opening a vendor first. Current AI focus is <span className="font-bold text-[#EEF3FA]">{procurementFocus.name}</span> because it has the highest procurement attention score.
              </p>
            </div>
            <button
              type="button"
              onClick={openPageCopilotModal}
              className="inline-flex items-center gap-2 rounded-xl border border-[#2E7FFF]/30 bg-[#2E7FFF]/14 px-4 py-2 text-[11px] font-black text-[#8DBDFF] transition-all hover:bg-[#2E7FFF]/22 hover:text-white"
            >
              <MessageSquare size={13} />
              How can I help?
            </button>
          </div>
          <div className="p-4">
            <VendorCopilotWorkbench
              result={pageCopilotResult}
              log={pageCopilotLog}
              onRun={runPageCopilotAction}
              onOpenQuoteIntake={openPageQuoteIntake}
              onOpenRfqWizard={openPageRfqWizard}
            />
          </div>
        </div>

        <div className="bg-[rgba(17,32,64,0.85)] border border-[rgba(46,127,255,0.2)] rounded-xl overflow-hidden">
          <div className="grid grid-cols-[2fr_70px_100px_80px_90px_90px_80px_36px] px-4 py-2 text-[9px] text-[#7A94B4] uppercase tracking-wide border-b border-[rgba(46,127,255,0.1)]">
            {['Vendor', 'Score', 'Risk Level', 'Trend', 'SLA %', 'Avg Cost', 'Contracts', ''].map(h => (
              <div key={h}>{h}</div>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={filterTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {filteredVendors.map(({ vendor, score: vs, riskLevel: vr }, i) => (
                <motion.button
                  key={vendor.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setSelectedVendor(vendor)}
                  className="w-full text-left grid grid-cols-[2fr_70px_100px_80px_90px_90px_80px_36px] px-4 py-3 border-b border-[rgba(46,127,255,0.07)] hover:bg-white/[0.025] transition-all items-center group"
                >
                  <div className="min-w-0">
                    <div className="text-[12px] text-[#EEF3FA] font-semibold truncate">{vendor.name}</div>
                    <div className="text-[10px] text-[#7A94B4] truncate">{vendor.category}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-bold" style={{ color: scoreColor(vs), fontFamily: 'Space Grotesk, sans-serif' }}>{vs}</span>
                  </div>
                  <div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${riskBg(vr)}`}>{vr}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendIcon trend={vendor.trend} size={12} />
                    <span className="text-[10px] text-[#7A94B4]">{vendor.trend}</span>
                  </div>
                  <div>
                    <span className={`text-[12px] font-semibold ${vendor.slaCompliance >= 85 ? 'text-emerald-400' : vendor.slaCompliance >= 72 ? 'text-amber-400' : 'text-red-400'}`}>{vendor.slaCompliance}%</span>
                    <div className="mt-0.5">
                      <MiniBar value={vendor.slaCompliance} max={100} color={vendor.slaCompliance >= 85 ? '#38D98A' : vendor.slaCompliance >= 72 ? '#FF9B38' : '#FF4B4B'} />
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#EEF3FA]">AED {vendor.avgCostPerJob}</span>
                    <div className="text-[9px] text-[#7A94B4]">/job</div>
                  </div>
                  <div>
                    <span className="text-[12px] text-[#EEF3FA] font-semibold">{vendor.activeContracts}</span>
                    <div className="text-[9px] text-[#7A94B4]">exp {vendor.contractExpiry}</div>
                  </div>
                  <div className="flex items-center justify-center">
                    <ChevronRight size={13} className="text-[#7A94B4] group-hover:text-[#EEF3FA] transition-colors" />
                  </div>
                </motion.button>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {filteredVendors.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ShieldCheck size={32} className="text-[#7A94B4] mb-3 opacity-40" />
            <p className="text-[12px] text-[#7A94B4]">No vendors match this filter.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showPageCopilotModal && (
          <PageProcurementCopilotModal
            focusVendor={procurementFocus}
            vendors={allVendors}
            result={buildVendorCopilotResult(procurementFocus, allVendors, pageCopilotModalAction)}
            onClose={() => setShowPageCopilotModal(false)}
            onRun={runPageCopilotModalAction}
            onOpenProfile={() => {
              setShowPageCopilotModal(false);
              setSelectedVendor(procurementFocus);
            }}
            onRfqGenerated={updatePageRfqWorkbench}
          />
        )}
        {showAddVendorWizard && (
          <AddVendorWizard
            onClose={() => setShowAddVendorWizard(false)}
            onCreate={createVendor}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
