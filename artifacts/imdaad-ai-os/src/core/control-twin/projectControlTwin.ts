import type { ProjectCommandDataset } from '@/modules/projectcommand/data/portfolio';

export type ProjectEventType =
  | 'baseline-created'
  | 'facade-delay'
  | 'crane-loss'
  | 'missing-approval'
  | 'variation-submitted'
  | 'evidence-rejected'
  | 'inspection-failure'
  | 'contractor-underperformance'
  | 'weather-disruption'
  | 'recovery-approved';

export type ProjectControlStatus = 'on-track' | 'watch' | 'at-risk' | 'critical';
export type ProjectSeverity = 'low' | 'medium' | 'high' | 'critical' | 'positive';

export interface ProjectControlBaseline {
  projectId: string;
  property: {
    name: string;
    type: string;
    location: string;
    floors: number;
    units: number;
  };
  project: {
    name: string;
    type: string;
    approvedBudget: number;
    currency: string;
    targetHandover: string;
    currentCompletion: number;
  };
  workPackages: string[];
  programmePhases: string[];
  stageGates: string[];
  budgetPackages: { name: string; budget: number; vendor: string }[];
  vendors: { name: string; scope: string; score: number; status: ProjectControlStatus }[];
  risks: string[];
  obligations: { id: string; title: string; owner: string; status: ProjectControlStatus }[];
  evidenceRequirements: { id: string; title: string; gate: string; status: 'Complete' | 'Required' | 'Missing' | 'Rejected' }[];
  milestones: { title: string; target: string; status: ProjectControlStatus }[];
}

export interface ProjectImpact {
  healthDelta: number;
  cpiDelta: number;
  spiDelta: number;
  floatDelta: number;
  eacDelta: number;
  riskDelta: number;
  gateStatusChange?: string;
  evidenceChange: number;
  vendorScoreDelta?: number;
  delayDays?: number;
  completionDelta?: number;
  pendingVariationDelta?: number;
}

export interface ProjectEvent {
  id: string;
  projectId: string;
  type: ProjectEventType;
  title: string;
  description: string;
  affectedAreas: string[];
  affectedModule: string;
  impactLabel: string;
  cta: string;
  severity: ProjectSeverity;
  impacts: ProjectImpact;
  sourceModule?: CrossModuleImpact['module'] | 'ProjectCommand';
  sourceObjectId?: string | null;
  timestamp: string;
}

export type ProjectControlEvent = ProjectEvent;

export interface ManagerAction {
  id: string;
  projectId: string;
  title: string;
  linkedEvent: string;
  triggerLabel: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  whyItMatters: string;
  expectedImpact: string;
  costImplication: string;
  status: 'Recommended' | 'Queued' | 'Approved' | 'Draft';
  cta: string;
}

export interface ForecastScenario {
  type: 'optimistic' | 'base' | 'pessimistic';
  handoverDate: string;
  forecastCost: number;
  confidence: number;
  assumptions: string[];
}

export interface ProjectControlMetric {
  label: string;
  value: string;
  rawValue: number;
  source: string;
  lastUpdated: string;
  aiExplanation: string;
  cause: string;
  deltaLabel: string;
  deltaTone: 'good' | 'bad' | 'neutral';
  relatedEvents: string[];
  tone: string;
}

export interface ControlException {
  id: string;
  title: string;
  severity: Exclude<ProjectSeverity, 'positive'>;
  linkedObject: string;
  impact: string;
  sourceEvent?: string;
  impactMetric?: string;
  cta: string;
}

export interface ProjectTwinState {
  key: 'schedule' | 'cost' | 'risk' | 'evidence' | 'vendor' | 'workforce' | 'gates' | 'handover';
  label: string;
  value: string;
  status: ProjectControlStatus;
  deltaLabel: string;
  source: string;
  explanation: string;
  confidence: number;
}

export interface CascadeEffect {
  id: string;
  title: string;
  severity: ProjectSeverity;
  sourceEvent: string;
  chain: string[];
  basedOn: string[];
}

export interface ConsequenceItem {
  label: string;
  value: string;
  detail: string;
  tone: 'good' | 'bad' | 'neutral';
}

export interface ConsequenceSimulation {
  title: string;
  confidence: number;
  ifUnresolved: ConsequenceItem[];
  ifResolvedToday: ConsequenceItem[];
}

export interface CrossModuleImpact {
  module: 'VendorIQ' | 'Workforce Intelligence' | 'InspectPro' | 'FieldOps' | 'Evidence' | 'Cost' | 'Approvals' | 'ResidentPortal';
  status: ProjectControlStatus;
  impact: string;
  linkedObject: string;
  source: string;
}

export interface SourceTrace {
  insight: string;
  basedOn: string[];
  confidence: number;
}

export interface ProjectControlContext {
  baseline: ProjectControlBaseline;
  events: ProjectEvent[];
  latestEvent: ProjectEvent | null;
  healthMovement: { from: number; to: number };
  metrics: {
    healthScore: number;
    completion: number;
    budgetUsed: number;
    cpi: number;
    spi: number;
    floatRemaining: number;
    forecastHandover: string;
    eac: number;
    riskExposure: number;
    evidenceCompleteness: number;
    vendorScore: number;
    handoverConfidence: number;
    pendingVariationExposure: number;
  };
  projectControlStatus: ProjectControlStatus;
  topThreat: string;
  latestImpact: string;
  changedToday: ProjectEvent[];
  controlMetrics: ProjectControlMetric[];
  controlExceptions: ControlException[];
  managerActions: ManagerAction[];
  forecastScenarios: ForecastScenario[];
  stageGateSummary: { name: string; status: ProjectControlStatus; reason: string }[];
  evidenceSummary: { title: string; status: 'Complete' | 'Required' | 'Missing' | 'Rejected'; gate: string }[];
  vendorSummary: { name: string; scope: string; score: number; status: ProjectControlStatus }[];
  twinStates: ProjectTwinState[];
  cascadeEffects: CascadeEffect[];
  consequenceSimulation: ConsequenceSimulation;
  crossModuleImpacts: CrossModuleImpact[];
  sourceTraces: SourceTrace[];
}

const dayMs = 86_400_000;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function addDays(dateValue: string, days: number) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatProjectCurrency(value: number) {
  if (value >= 1_000_000) return `AED ${Math.round(value / 1_000_000)}M`;
  return `AED ${Math.round(value / 1_000)}K`;
}

function statusFromHealth(score: number): ProjectControlStatus {
  if (score >= 76) return 'on-track';
  if (score >= 66) return 'watch';
  if (score >= 55) return 'at-risk';
  return 'critical';
}

function statusFromScore(score: number): ProjectControlStatus {
  if (score >= 84) return 'on-track';
  if (score >= 74) return 'watch';
  if (score >= 62) return 'at-risk';
  return 'critical';
}

function eventSeverity(score: number): Exclude<ProjectSeverity, 'positive'> {
  if (score <= -6) return 'critical';
  if (score <= -4) return 'high';
  if (score <= -2) return 'medium';
  return 'low';
}

export const sobhaPilotControlBaseline: ProjectControlBaseline = {
  projectId: 'sobha-pilot-tower',
  property: {
    name: 'Sobha Pilot Tower',
    type: 'Residential Tower',
    location: 'Dubai',
    floors: 102,
    units: 680,
  },
  project: {
    name: 'Main Construction',
    type: 'Main Construction',
    approvedBudget: 420_000_000,
    currency: 'AED',
    targetHandover: '2026-08-12',
    currentCompletion: 28,
  },
  workPackages: [
    'Preliminaries',
    'Design & Approvals',
    'Substructure',
    'Superstructure',
    'Facade',
    'MEP',
    'Fit-out',
    'Testing & Commissioning',
    'Handover & Snagging',
  ],
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
  budgetPackages: [
    { name: 'Preliminaries', budget: 25_200_000, vendor: 'Sobha Construction' },
    { name: 'Design & Approvals', budget: 21_000_000, vendor: 'Sobha Design Studio' },
    { name: 'Substructure', budget: 58_800_000, vendor: 'Sobha Construction' },
    { name: 'Superstructure', budget: 92_400_000, vendor: 'Sobha Construction' },
    { name: 'Facade', budget: 50_400_000, vendor: 'Sobha Facade Systems' },
    { name: 'MEP', budget: 67_200_000, vendor: 'Sobha MEP Services' },
    { name: 'Fit-out', budget: 42_000_000, vendor: 'Sobha Interiors' },
    { name: 'Testing & Commissioning', budget: 12_600_000, vendor: 'Sobha Fire & Life Safety' },
    { name: 'Handover & Snagging', budget: 8_400_000, vendor: 'Sobha Handover Team' },
  ],
  vendors: [
    { name: 'Sobha Construction', scope: 'Main Contractor', score: 82, status: 'watch' },
    { name: 'Sobha Waterproofing', scope: 'Waterproofing', score: 86, status: 'on-track' },
    { name: 'Sobha MEP Services', scope: 'MEP', score: 80, status: 'watch' },
    { name: 'Sobha Facade Systems', scope: 'Facade', score: 78, status: 'watch' },
    { name: 'Sobha Lift Coordination', scope: 'Elevators', score: 84, status: 'on-track' },
    { name: 'Sobha Fire & Life Safety', scope: 'Fire Systems', score: 83, status: 'on-track' },
  ],
  risks: [
    'facade procurement lead time',
    'tower crane utilization bottleneck',
    'authority approval dependency',
    'MEP coordination clashes',
    'summer concrete productivity loss',
  ],
  obligations: [
    { id: 'OBL-SOBHA-01', title: 'Authority approval tracker current', owner: 'Planning Manager', status: 'watch' },
    { id: 'OBL-SOBHA-02', title: 'Monthly EOT and variation notice register', owner: 'Commercial Manager', status: 'on-track' },
    { id: 'OBL-SOBHA-03', title: 'Fire system compliance evidence before commissioning', owner: 'QA/QC Lead', status: 'watch' },
  ],
  evidenceRequirements: [
    { id: 'EVD-SOBHA-01', title: 'authority approvals', gate: 'Commissioning Ready', status: 'Required' },
    { id: 'EVD-SOBHA-02', title: 'inspection reports', gate: 'Superstructure Level 50', status: 'Required' },
    { id: 'EVD-SOBHA-03', title: 'commissioning certificates', gate: 'Commissioning Ready', status: 'Required' },
    { id: 'EVD-SOBHA-04', title: 'fire system sign-off', gate: 'Commissioning Ready', status: 'Required' },
    { id: 'EVD-SOBHA-05', title: 'lift inspection sign-off', gate: 'Handover Go/No-Go', status: 'Required' },
    { id: 'EVD-SOBHA-06', title: 'vendor warranty packs', gate: 'Handover Go/No-Go', status: 'Required' },
    { id: 'EVD-SOBHA-07', title: 'handover evidence pack', gate: 'Handover Go/No-Go', status: 'Required' },
    { id: 'EVD-SOBHA-08', title: 'BOQ/package budget summary', gate: 'Design Freeze', status: 'Required' },
  ],
  milestones: [
    { title: 'Substructure Complete', target: '2026-05-30', status: 'watch' },
    { title: 'Superstructure Level 50', target: '2026-07-18', status: 'watch' },
    { title: 'Facade Release', target: '2026-08-15', status: 'watch' },
    { title: 'MEP Rough-In Ready', target: '2026-09-28', status: 'watch' },
    { title: 'Commissioning Ready', target: '2026-11-22', status: 'watch' },
  ],
};

const eventTemplates: Record<ProjectEventType, Omit<ProjectEvent, 'id' | 'projectId' | 'timestamp'>> = {
  'baseline-created': {
    type: 'baseline-created',
    title: 'Project baseline created from uploaded LOA/project summary.',
    description: 'AI converted imported project material into a live control baseline with programme, cost, vendor, risk, obligation, evidence, forecast, and manager decision context.',
    affectedAreas: ['Property', 'Project', 'Programme', 'Cost', 'Risk', 'Vendors', 'Stage Gates', 'Evidence', 'Forecasts', 'Manager decisions'],
    affectedModule: 'Project Control Baseline',
    impactLabel: 'Health, CPI, SPI, float, EAC, top threat, forecast scenarios, and manager actions are now linked to the created baseline.',
    cta: 'Review baseline',
    severity: 'positive',
    impacts: { healthDelta: 0, cpiDelta: 0, spiDelta: 0, floatDelta: 0, eacDelta: 0, riskDelta: 0, evidenceChange: 0 },
  },
  'facade-delay': {
    type: 'facade-delay',
    title: 'Facade procurement delay',
    description: 'Facade bracket and curtain wall release slipped because long-lead procurement was not locked before the next envelope gate.',
    affectedAreas: ['Programme', 'Vendors', 'Risks', 'Fit-out start'],
    affectedModule: 'Programme + Vendors',
    impactLabel: 'Added 14 days exposure and pushed Fit-out start risk higher.',
    cta: 'Release facade long-lead procurement',
    severity: 'high',
    impacts: { healthDelta: -7, cpiDelta: -0.01, spiDelta: -0.06, floatDelta: -14, eacDelta: 6_900_000, riskDelta: 18, gateStatusChange: 'Facade Release moved to Blocked', evidenceChange: -3, vendorScoreDelta: -8, delayDays: 14, completionDelta: -0.3 },
  },
  'crane-loss': {
    type: 'crane-loss',
    title: 'Tower crane productivity loss',
    description: 'Hook time utilization exceeded the safe plan and slowed core-wall, steel, facade hoisting, and MEP riser logistics.',
    affectedAreas: ['Superstructure', 'Cost', 'Programme', 'Variations'],
    affectedModule: 'Programme + Cost',
    impactLabel: 'Reduced SPI and created crane overtime exposure.',
    cta: 'Resequence crane utilization',
    severity: 'high',
    impacts: { healthDelta: -6, cpiDelta: -0.04, spiDelta: -0.05, floatDelta: -9, eacDelta: 7_400_000, riskDelta: 12, gateStatusChange: 'Superstructure Level 50 at risk', evidenceChange: -2, vendorScoreDelta: -4, delayDays: 9, pendingVariationDelta: 2_900_000, completionDelta: -0.2 },
  },
  'missing-approval': {
    type: 'missing-approval',
    title: 'Missing authority approval',
    description: 'Authority approval evidence is not attached to the Commissioning Ready control gate.',
    affectedAreas: ['Stage Gates', 'Evidence', 'Obligations', 'Forecast'],
    affectedModule: 'Stage Gates + Evidence',
    impactLabel: 'Commissioning Ready gate blocked until approval is uploaded.',
    cta: 'Request authority approval',
    severity: 'critical',
    impacts: { healthDelta: -5, cpiDelta: 0, spiDelta: -0.03, floatDelta: -6, eacDelta: 1_200_000, riskDelta: 10, gateStatusChange: 'Commissioning Ready blocked', evidenceChange: -14, delayDays: 6, completionDelta: -0.1 },
  },
  'variation-submitted': {
    type: 'variation-submitted',
    title: 'VO-32 submitted: Additional crane overtime allowance',
    description: 'Commercial team submitted a variation order for crane overtime and night-shift logistics support.',
    affectedAreas: ['Cost', 'Variations', 'Forecast', 'Manager approvals'],
    affectedModule: 'Cost + Variations',
    impactLabel: 'AED 2.9M pending exposure added to EAC.',
    cta: 'Review variation order',
    severity: 'medium',
    impacts: { healthDelta: -3, cpiDelta: -0.02, spiDelta: 0, floatDelta: 0, eacDelta: 2_900_000, riskDelta: 6, evidenceChange: 0, pendingVariationDelta: 2_900_000 },
  },
  'evidence-rejected': {
    type: 'evidence-rejected',
    title: 'Evidence rejected for fire-stopping inspection',
    description: 'Uploaded inspection evidence was rejected because location and timestamp proof did not match the required fire-stopping checklist.',
    affectedAreas: ['Evidence', 'Stage Gates', 'Quality', 'Audit readiness'],
    affectedModule: 'Evidence + Stage Gates',
    impactLabel: 'Evidence readiness dropped and gate clearance remains blocked.',
    cta: 'Request corrected evidence',
    severity: 'high',
    impacts: { healthDelta: -4, cpiDelta: 0, spiDelta: -0.02, floatDelta: -4, eacDelta: 600_000, riskDelta: 8, gateStatusChange: 'Commissioning evidence rejected', evidenceChange: -12, delayDays: 4 },
  },
  'inspection-failure': {
    type: 'inspection-failure',
    title: 'Inspection failure: MEP riser coordination',
    description: 'QA inspection failed because MEP riser clearance did not match the coordinated model.',
    affectedAreas: ['Quality', 'Programme', 'Risks', 'Evidence'],
    affectedModule: 'Quality + Programme',
    impactLabel: 'MEP rough-in gate needs reinspection before it can clear.',
    cta: 'Create reinspection plan',
    severity: 'high',
    impacts: { healthDelta: -5, cpiDelta: -0.01, spiDelta: -0.03, floatDelta: -5, eacDelta: 1_800_000, riskDelta: 11, gateStatusChange: 'MEP Rough-In Ready blocked', evidenceChange: -8, delayDays: 5, vendorScoreDelta: -5 },
  },
  'contractor-underperformance': {
    type: 'contractor-underperformance',
    title: 'Contractor underperformance detected',
    description: 'Main contractor productivity fell below the planned output curve for core wall, facade logistics, and daily closeout evidence.',
    affectedAreas: ['Vendors', 'Programme', 'Cost', 'Risks'],
    affectedModule: 'Vendors + Programme',
    impactLabel: 'Vendor score dropped and handover risk moved higher.',
    cta: 'Issue contractor recovery notice',
    severity: 'high',
    impacts: { healthDelta: -6, cpiDelta: -0.03, spiDelta: -0.04, floatDelta: -8, eacDelta: 4_200_000, riskDelta: 13, evidenceChange: -4, vendorScoreDelta: -10, delayDays: 8, completionDelta: -0.2 },
  },
  'weather-disruption': {
    type: 'weather-disruption',
    title: 'Weather disruption: concrete pour window lost',
    description: 'High-wind and heat restrictions reduced productive pour hours and compressed the crane and crew sequence.',
    affectedAreas: ['Programme', 'Workforce', 'FieldOps', 'Risks'],
    affectedModule: 'Workforce + FieldOps',
    impactLabel: 'Consumed 5 days of float and raised workforce resequencing pressure.',
    cta: 'Approve weather recovery window',
    severity: 'medium',
    impacts: { healthDelta: -4, cpiDelta: -0.01, spiDelta: -0.03, floatDelta: -5, eacDelta: 1_400_000, riskDelta: 7, gateStatusChange: 'Superstructure weather recovery required', evidenceChange: -1, vendorScoreDelta: -2, delayDays: 5, completionDelta: -0.1 },
  },
  'recovery-approved': {
    type: 'recovery-approved',
    title: 'Recovery action approved',
    description: 'Manager approved night-shift pour window, crane resequencing, and facade procurement release for the next recovery cycle.',
    affectedAreas: ['Programme', 'Cost', 'Risks', 'Manager decisions'],
    affectedModule: 'Decision Layer',
    impactLabel: 'Recovered float, improved SPI, and reduced risk exposure.',
    cta: 'Monitor recovery effect',
    severity: 'positive',
    impacts: { healthDelta: 8, cpiDelta: 0.02, spiDelta: 0.05, floatDelta: 10, eacDelta: -3_500_000, riskDelta: -14, gateStatusChange: 'Recovery path approved', evidenceChange: 5, vendorScoreDelta: 4, delayDays: -10, completionDelta: 0.8 },
  },
};

export const projectEventOptions: { type: ProjectEventType; label: string }[] = [
  { type: 'facade-delay', label: 'Trigger Facade Delay' },
  { type: 'variation-submitted', label: 'Trigger Variation' },
  { type: 'evidence-rejected', label: 'Reject Evidence' },
  { type: 'missing-approval', label: 'Delay Approval' },
  { type: 'contractor-underperformance', label: 'Contractor Issue' },
  { type: 'crane-loss', label: 'Trigger Crane Loss' },
  { type: 'inspection-failure', label: 'Inspection Rejection' },
  { type: 'weather-disruption', label: 'Weather Disruption' },
  { type: 'recovery-approved', label: 'Approve Recovery Action' },
];

export function createProjectControlEvent(projectId: string, type: ProjectEventType, sequence = 0): ProjectEvent {
  const template = eventTemplates[type];
  const timestamp = new Date(Date.now() - sequence * 60_000).toISOString();
  return {
    ...template,
    id: `${projectId}-${type}-${Date.now().toString(36)}-${sequence}`,
    projectId,
    sourceModule: 'ProjectCommand',
    timestamp,
  };
}

export function getProjectEventPreview(type: ProjectEventType) {
  const template = eventTemplates[type];
  return {
    type: template.type,
    title: template.title,
    description: template.description,
    affectedAreas: [...template.affectedAreas],
    affectedModule: template.affectedModule,
    impactLabel: template.impactLabel,
    cta: template.cta,
    severity: template.severity,
    impacts: { ...template.impacts },
  };
}

export function getNextProjectEventType(events: ProjectEvent[]): ProjectEventType {
  const sequence: ProjectEventType[] = ['facade-delay', 'crane-loss', 'missing-approval', 'variation-submitted', 'evidence-rejected', 'inspection-failure', 'contractor-underperformance', 'weather-disruption', 'recovery-approved'];
  const simulatedCount = events.filter(event => event.type !== 'baseline-created').length;
  return sequence[simulatedCount % sequence.length];
}

function baselineForDataset(dataset: ProjectCommandDataset): ProjectControlBaseline {
  if (dataset.id === 'sobha-pilot-tower') {
    return sobhaPilotControlBaseline;
  }

  return {
    ...sobhaPilotControlBaseline,
    projectId: dataset.id,
    property: {
      name: dataset.property.name,
      type: dataset.property.type,
      location: dataset.property.location,
      floors: dataset.project.floors,
      units: dataset.property.units,
    },
    project: {
      name: dataset.project.name,
      type: dataset.project.projectType,
      approvedBudget: dataset.project.contractValue,
      currency: 'AED',
      targetHandover: dataset.project.targetHandover,
      currentCompletion: dataset.project.completion,
    },
  };
}

function baseMetrics(dataset: ProjectCommandDataset) {
  const isStaticSobhaPilot = dataset.id === 'sobha-pilot-tower';
  return {
    healthScore: isStaticSobhaPilot ? 78 : dataset.project.healthScore,
    completion: dataset.project.completion,
    budgetUsed: isStaticSobhaPilot ? 39 : dataset.project.budgetUsed,
    cpi: isStaticSobhaPilot ? 0.97 : dataset.project.cpi,
    spi: isStaticSobhaPilot ? 0.96 : dataset.project.spi,
    floatRemaining: isStaticSobhaPilot ? 34 : dataset.project.floatRemaining,
    forecastHandover: isStaticSobhaPilot ? '2026-08-12' : dataset.project.forecastCompletion,
    eac: isStaticSobhaPilot ? dataset.project.contractValue : dataset.project.forecastCost,
    riskExposure: isStaticSobhaPilot ? 18_000_000 : Math.max(dataset.project.forecastCost - dataset.project.contractValue, 0),
    evidenceCompleteness: isStaticSobhaPilot ? 88 : 76,
    vendorScore: isStaticSobhaPilot ? 82 : 78,
    handoverConfidence: isStaticSobhaPilot ? 78 : Math.max(42, Math.min(82, dataset.project.healthScore + 4)),
    pendingVariationExposure: 0,
    delayDays: 0,
  };
}

function statusTone(value: ProjectControlStatus) {
  if (value === 'on-track') return '#38D98A';
  if (value === 'watch') return '#FFCD57';
  if (value === 'at-risk') return '#FF9B38';
  return '#FF4B4B';
}

function dateFromNow(timestamp: string) {
  const diff = Date.now() - new Date(timestamp).getTime();
  if (Number.isNaN(diff) || diff < 60_000) return 'Just now';
  const minutes = Math.round(diff / 60_000);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(diff / 3_600_000);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.round(diff / dayMs)}d ago`;
}

function signedNumber(value: number | string, suffix = '') {
  const numeric = typeof value === 'number' ? value : Number(value);
  const sign = Number.isFinite(numeric) && numeric > 0 ? '+' : '';
  return `${sign}${value}${suffix}`;
}

function signedDecimal(value: number) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}`;
}

function formatMetricDelta(label: ProjectControlMetric['label'], delta: number) {
  if (Math.abs(delta) < 0.01) return 'No movement';
  if (label === 'EAC') return `${delta > 0 ? '+' : '-'}${formatProjectCurrency(Math.abs(delta))}`;
  if (label === 'Float Remaining') return signedNumber(Math.round(delta), 'd');
  if (label === 'CPI' || label === 'SPI') return signedDecimal(delta);
  return signedNumber(Number(delta.toFixed(1)).toString().replace('.0', ''), label === 'Completion' || label === 'Budget Used' ? ' pts' : '');
}

function metricDeltaTone(label: ProjectControlMetric['label'], delta: number): ProjectControlMetric['deltaTone'] {
  if (Math.abs(delta) < 0.01) return 'neutral';
  if (label === 'EAC' || label === 'Budget Used') return delta > 0 ? 'bad' : 'good';
  if (label === 'Completion' || label === 'CPI' || label === 'SPI' || label === 'Float Remaining') return delta > 0 ? 'good' : 'bad';
  return delta > 0 ? 'good' : 'bad';
}

function buildMetricCards(dataset: ProjectCommandDataset, events: ProjectEvent[], metrics: ProjectControlContext['metrics']): ProjectControlMetric[] {
  const base = baseMetrics(dataset);
  const latest = events[events.length - 1];
  const lastUpdated = latest ? dateFromNow(latest.timestamp) : 'Baseline';
  const related = events.slice(-3).map(event => event.title);
  const cause = latest
    ? `${latest.title} -> ${latest.impactLabel}`
    : 'AI baseline generated from property, budget, programme, vendors, risks, obligations, and evidence requirements.';
  const withDelta = (
    label: ProjectControlMetric['label'],
    delta: number,
    metric: Omit<ProjectControlMetric, 'deltaLabel' | 'deltaTone' | 'cause'>,
  ): ProjectControlMetric => ({
    ...metric,
    cause,
    deltaLabel: formatMetricDelta(label, delta),
    deltaTone: metricDeltaTone(label, delta),
  });

  return [
    withDelta('Completion', metrics.completion - base.completion, {
      label: 'Completion',
      value: `${metrics.completion.toFixed(1).replace('.0', '')}%`,
      rawValue: metrics.completion,
      source: 'Programme phases + earned progress',
      lastUpdated,
      aiExplanation: 'Completion moves only when events affect progress certainty or recovery output.',
      relatedEvents: related,
      tone: '#38D98A',
    }),
    withDelta('Budget Used', metrics.budgetUsed - base.budgetUsed, {
      label: 'Budget Used',
      value: `${metrics.budgetUsed.toFixed(1).replace('.0', '')}%`,
      rawValue: metrics.budgetUsed,
      source: 'Cost baseline + actuals + variations',
      lastUpdated,
      aiExplanation: 'Budget used is linked to actual cost, pending variation exposure, and EAC movement.',
      relatedEvents: related,
      tone: '#FFCD57',
    }),
    withDelta('CPI', metrics.cpi - base.cpi, {
      label: 'CPI',
      value: metrics.cpi.toFixed(2),
      rawValue: metrics.cpi,
      source: 'Earned value model',
      lastUpdated,
      aiExplanation: 'CPI responds to cost events such as crane loss, variation exposure, and recovery savings.',
      relatedEvents: related,
      tone: metrics.cpi >= 1 ? '#38D98A' : '#FF9B38',
    }),
    withDelta('SPI', metrics.spi - base.spi, {
      label: 'SPI',
      value: metrics.spi.toFixed(2),
      rawValue: metrics.spi,
      source: 'Programme baseline + event delays',
      lastUpdated,
      aiExplanation: 'SPI responds to delay events, blocked gates, failed inspections, and approved recovery.',
      relatedEvents: related,
      tone: metrics.spi >= 1 ? '#38D98A' : '#FF9B38',
    }),
    withDelta('Float Remaining', metrics.floatRemaining - base.floatRemaining, {
      label: 'Float Remaining',
      value: `${metrics.floatRemaining}d`,
      rawValue: metrics.floatRemaining,
      source: 'Critical path simulation',
      lastUpdated,
      aiExplanation: 'Float is consumed by delay, missing approval, rejected evidence, and contractor productivity events.',
      relatedEvents: related,
      tone: metrics.floatRemaining <= 10 ? '#FF4B4B' : metrics.floatRemaining <= 22 ? '#FF9B38' : '#38D98A',
    }),
    withDelta('EAC', metrics.eac - base.eac, {
      label: 'EAC',
      value: formatProjectCurrency(metrics.eac),
      rawValue: metrics.eac,
      source: `${dataset.project.name} cost forecast`,
      lastUpdated,
      aiExplanation: 'EAC is recalculated from cost events, pending variations, and approved recovery effects.',
      relatedEvents: related,
      tone: metrics.eac > dataset.project.contractValue ? '#FF9B38' : '#38D98A',
    }),
  ];
}

function buildStageGates(events: ProjectEvent[]) {
  const statuses: ProjectControlContext['stageGateSummary'] = sobhaPilotControlBaseline.stageGates.map((name, index) => ({
    name,
    status: index <= 1 ? 'on-track' : index === 2 ? 'watch' : 'watch',
    reason: index <= 1 ? 'Baseline criteria are complete.' : 'Gate is linked to open programme and evidence dependencies.',
  }));

  events.forEach(event => {
    if (event.type === 'facade-delay') {
      const gate = statuses.find(item => item.name === 'Facade Release');
      if (gate) {
        gate.status = 'critical';
        gate.reason = 'Blocked by facade long-lead procurement delay.';
      }
    }
    if (event.type === 'missing-approval' || event.type === 'evidence-rejected') {
      const gate = statuses.find(item => item.name === 'Commissioning Ready');
      if (gate) {
        gate.status = 'critical';
        gate.reason = event.type === 'missing-approval' ? 'Authority approval evidence is missing.' : 'Required inspection evidence was rejected.';
      }
    }
    if (event.type === 'inspection-failure') {
      const gate = statuses.find(item => item.name === 'MEP Rough-In Ready');
      if (gate) {
        gate.status = 'critical';
        gate.reason = 'MEP riser inspection failed and needs reinspection.';
      }
    }
    if (event.type === 'weather-disruption') {
      const gate = statuses.find(item => item.name === 'Superstructure Level 50');
      if (gate) {
        gate.status = 'at-risk';
        gate.reason = 'Weather disruption compressed concrete pour and crane recovery windows.';
      }
    }
    if (event.type === 'recovery-approved') {
      statuses.filter(item => item.status === 'critical').slice(0, 1).forEach(item => {
        item.status = 'at-risk';
        item.reason = 'Recovery action approved; monitor next evidence upload.';
      });
    }
  });

  return statuses;
}

function buildEvidence(events: ProjectEvent[]) {
  const evidence = sobhaPilotControlBaseline.evidenceRequirements.map(item => ({
    title: item.title,
    status: item.status,
    gate: item.gate,
  }));

  events.forEach(event => {
    if (event.type === 'missing-approval') {
      const item = evidence.find(entry => entry.title === 'authority approvals');
      if (item) item.status = 'Missing';
    }
    if (event.type === 'evidence-rejected') {
      const item = evidence.find(entry => entry.title === 'fire system sign-off');
      if (item) item.status = 'Rejected';
    }
    if (event.type === 'inspection-failure') {
      const item = evidence.find(entry => entry.title === 'inspection reports');
      if (item) item.status = 'Rejected';
    }
    if (event.type === 'recovery-approved') {
      evidence.filter(item => item.status === 'Rejected').slice(0, 1).forEach(item => {
        item.status = 'Required';
      });
    }
  });
  return evidence;
}

function buildVendors(events: ProjectEvent[]) {
  const vendors = sobhaPilotControlBaseline.vendors.map(item => ({ ...item }));
  events.forEach(event => {
    if (event.type === 'facade-delay') {
      const vendor = vendors.find(item => item.name === 'Sobha Facade Systems');
      if (vendor) vendor.score = clamp(vendor.score - 8, 35, 100);
    }
    if (event.type === 'crane-loss' || event.type === 'contractor-underperformance' || event.type === 'weather-disruption') {
      const vendor = vendors.find(item => item.name === 'Sobha Construction');
      if (vendor) vendor.score = clamp(vendor.score + (event.impacts.vendorScoreDelta ?? 0), 35, 100);
    }
    if (event.type === 'inspection-failure') {
      const vendor = vendors.find(item => item.name === 'Sobha MEP Services');
      if (vendor) vendor.score = clamp(vendor.score - 5, 35, 100);
    }
    if (event.type === 'recovery-approved') {
      vendors.forEach(vendor => {
        vendor.score = clamp(vendor.score + 4, 35, 100);
      });
    }
  });
  return vendors.map(vendor => ({ ...vendor, status: statusFromScore(vendor.score) }));
}

function buildManagerActions(dataset: ProjectCommandDataset, events: ProjectEvent[], metrics: ProjectControlContext['metrics']): ManagerAction[] {
  const latest = events[events.length - 1];
  const linkedEvent = latest?.id ?? 'baseline';
  const actions: ManagerAction[] = [];
  const triggerFor = (types: ProjectEventType[], fallback: string) => [...events].reverse().find(event => types.includes(event.type))?.title ?? fallback;
  const baselineMode = !latest || latest.type === 'baseline-created';

  if (baselineMode || events.some(event => event.type === 'crane-loss' || event.type === 'weather-disruption')) {
    actions.push({
      id: `${dataset.id}-action-crane`,
      projectId: dataset.id,
      title: 'Resequence tower crane utilization',
      linkedEvent,
      triggerLabel: triggerFor(['crane-loss', 'contractor-underperformance', 'weather-disruption'], latest?.title ?? 'AI baseline risk model'),
      priority: metrics.floatRemaining < 18 ? 'critical' : 'high',
      whyItMatters: 'Crane hook time is constraining superstructure, facade logistics, and MEP riser flow.',
      expectedImpact: 'Protects 16 days of superstructure float.',
      costImplication: 'AED 2.9M overtime exposure, lower than delay cost.',
      status: 'Recommended',
      cta: 'Queue resequencing plan',
    });
  }

  if (baselineMode || events.some(event => event.type === 'facade-delay')) {
    actions.push({
      id: `${dataset.id}-action-facade`,
      projectId: dataset.id,
      title: 'Release facade long-lead procurement',
      linkedEvent,
      triggerLabel: triggerFor(['facade-delay'], latest?.title ?? 'AI baseline risk model'),
      priority: 'high',
      whyItMatters: 'Facade release drives envelope closure and the fit-out start window.',
      expectedImpact: 'Avoids Q3 envelope delay.',
      costImplication: 'Locks procurement exposure before redesign pressure increases.',
      status: 'Recommended',
      cta: 'Release procurement',
    });
  }

  if (baselineMode || events.some(event => event.type === 'missing-approval' || event.type === 'evidence-rejected' || event.type === 'inspection-failure')) {
    actions.push({
      id: `${dataset.id}-action-approval`,
      projectId: dataset.id,
      title: baselineMode ? 'Confirm authority approval pathway' : 'Clear blocked approval and evidence gates',
      linkedEvent,
      triggerLabel: triggerFor(['missing-approval', 'evidence-rejected', 'inspection-failure'], latest?.title ?? 'AI baseline evidence requirements'),
      priority: metrics.evidenceCompleteness < 75 ? 'critical' : 'high',
      whyItMatters: 'Stage gates cannot clear without accepted proof and authority evidence.',
      expectedImpact: baselineMode ? 'Reduces handover gate risk.' : 'Restores gate readiness and reduces audit risk.',
      costImplication: 'Avoids reinspection and late authority submission costs.',
      status: 'Draft',
      cta: baselineMode ? 'Confirm approval path' : 'Request corrected evidence',
    });
  }

  actions.push({
    id: `${dataset.id}-action-night-pour`,
    projectId: dataset.id,
    title: 'Approve night-shift concrete pour window',
    linkedEvent,
    triggerLabel: latest?.title ?? 'Baseline acceleration option',
    priority: metrics.spi < 0.9 ? 'high' : 'medium',
    whyItMatters: 'Night pours recover days without adding a second crane.',
    expectedImpact: 'Recovers 9 days without adding second crane.',
    costImplication: 'Adds controlled acceleration cost but lowers delay exposure.',
    status: 'Recommended',
    cta: 'Approve recovery window',
  });

  return actions.slice(0, 4);
}

function buildExceptions(events: ProjectEvent[], metrics: ProjectControlContext['metrics'], stageGates: ProjectControlContext['stageGateSummary'], evidence: ProjectControlContext['evidenceSummary'], vendors: ProjectControlContext['vendorSummary']): ControlException[] {
  const exceptions: ControlException[] = [];
  const latestGateEvent = [...events].reverse().find(event => event.impacts.gateStatusChange);
  stageGates.filter(gate => gate.status === 'critical').forEach(gate => {
    exceptions.push({
      id: `gate-${gate.name}`,
      title: `${gate.name} gate blocked`,
      severity: 'critical',
      linkedObject: gate.name,
      impact: gate.reason,
      sourceEvent: latestGateEvent?.title,
      impactMetric: `Float ${metrics.floatRemaining}d / Evidence ${metrics.evidenceCompleteness}%`,
      cta: gate.name === 'Commissioning Ready' ? 'Request authority approval' : 'Open gate recovery',
    });
  });
  evidence.filter(item => item.status === 'Missing' || item.status === 'Rejected').forEach(item => {
    const sourceEvent = [...events].reverse().find(event => event.type === 'missing-approval' || event.type === 'evidence-rejected' || event.type === 'inspection-failure');
    exceptions.push({
      id: `evidence-${item.title}`,
      title: `${item.title} ${item.status.toLowerCase()}`,
      severity: item.status === 'Rejected' ? 'high' : 'critical',
      linkedObject: item.gate,
      impact: 'Gate readiness and audit trail cannot be trusted until evidence is corrected.',
      sourceEvent: sourceEvent?.title,
      impactMetric: `Evidence readiness ${metrics.evidenceCompleteness}%`,
      cta: 'Request corrected evidence',
    });
  });
  if (metrics.pendingVariationExposure > 0) {
    const sourceEvent = [...events].reverse().find(event => event.type === 'variation-submitted' || event.type === 'crane-loss');
    exceptions.push({
      id: 'pending-variation',
      title: 'Pending variation exposure',
      severity: 'high',
      linkedObject: 'VO-32 / Commercial review',
      impact: `${formatProjectCurrency(metrics.pendingVariationExposure)} is waiting for manager decision and affects EAC.`,
      sourceEvent: sourceEvent?.title,
      impactMetric: `EAC ${formatProjectCurrency(metrics.eac)}`,
      cta: 'Review variation',
    });
  }
  vendors.filter(vendor => vendor.score < 75).forEach(vendor => {
    const sourceEvent = [...events].reverse().find(event => event.type === 'facade-delay' || event.type === 'contractor-underperformance' || event.type === 'crane-loss' || event.type === 'inspection-failure' || event.type === 'weather-disruption');
    exceptions.push({
      id: `vendor-${vendor.name}`,
      title: `${vendor.scope} vendor score falling`,
      severity: vendor.score < 65 ? 'critical' : 'high',
      linkedObject: vendor.name,
      impact: `${vendor.name} is now ${vendor.score}/100 and is linked to latest project control events.`,
      sourceEvent: sourceEvent?.title,
      impactMetric: `Vendor score ${vendor.score}/100`,
      cta: 'Issue recovery notice',
    });
  });
  if (metrics.riskExposure > 38_000_000 || events.some(event => event.type === 'contractor-underperformance')) {
    const sourceEvent = [...events].reverse().find(event => event.impacts.riskDelta > 0);
    exceptions.push({
      id: 'risk-exposure',
      title: 'Risk exposure escalated',
      severity: eventSeverity(-5),
      linkedObject: 'Risk register',
      impact: `${formatProjectCurrency(metrics.riskExposure)} exposure is now active across cost, programme, and vendor controls.`,
      sourceEvent: sourceEvent?.title,
      impactMetric: `Risk exposure ${formatProjectCurrency(metrics.riskExposure)}`,
      cta: 'Open risk review',
    });
  }
  return exceptions.slice(0, 6);
}

function buildForecastScenarios(dataset: ProjectCommandDataset, metrics: ProjectControlContext['metrics'], delayDays: number): ForecastScenario[] {
  const target = dataset.property.name === 'Sobha Pilot Tower' && dataset.project.name === 'Main Construction' ? '2026-08-12' : dataset.project.targetHandover;
  const delay = Math.max(0, delayDays);
  return [
    {
      type: 'optimistic',
      handoverDate: addDays(target, Math.max(0, delay - 12)),
      forecastCost: Math.max(dataset.project.contractValue, metrics.eac - 8_000_000),
      confidence: clamp(34 - Math.round(delay / 3), 12, 42),
      assumptions: ['Recovery action approved within 7 days', 'Facade release lands before the next gate', 'Crane resequencing protects superstructure float'],
    },
    {
      type: 'base',
      handoverDate: addDays(target, delay),
      forecastCost: metrics.eac,
      confidence: clamp(58 - Math.round(delay / 6), 38, 64),
      assumptions: ['Facade release by 15 Aug', 'Crane overtime approved', 'Evidence gaps closed before Commissioning Ready'],
    },
    {
      type: 'pessimistic',
      handoverDate: addDays(target, delay + 34),
      forecastCost: metrics.eac + 18_000_000,
      confidence: clamp(18 + Math.round(delay / 7), 14, 38),
      assumptions: ['Facade procurement remains blocked', 'Crane productivity loss continues', 'Authority approval slips into commissioning window'],
    },
  ];
}

function sourceLabel(latestEvent: ProjectEvent | null) {
  return latestEvent?.type === 'baseline-created' || !latestEvent ? 'AI baseline from LOA/project summary' : latestEvent.title;
}

function buildTwinStates(
  metrics: ProjectControlContext['metrics'],
  latestEvent: ProjectEvent | null,
  stageGates: ProjectControlContext['stageGateSummary'],
  vendors: ProjectControlContext['vendorSummary'],
): ProjectTwinState[] {
  const blockedGates = stageGates.filter(gate => gate.status === 'critical').length;
  const vendorAtRisk = vendors.filter(vendor => vendor.status === 'at-risk' || vendor.status === 'critical').length;
  const source = sourceLabel(latestEvent);
  const latest = latestEvent?.impacts;
  const workforceStatus = latestEvent?.type === 'crane-loss' || latestEvent?.type === 'weather-disruption' || latestEvent?.type === 'contractor-underperformance'
    ? 'at-risk'
    : metrics.spi < 0.88 ? 'watch' : 'on-track';

  return [
    {
      key: 'schedule',
      label: 'Schedule State',
      value: `SPI ${metrics.spi.toFixed(2)} / ${metrics.floatRemaining}d float`,
      status: metrics.floatRemaining <= 8 || metrics.spi < 0.82 ? 'critical' : metrics.floatRemaining <= 18 || metrics.spi < 0.92 ? 'at-risk' : 'watch',
      deltaLabel: latest ? `Float ${signedNumber(latest.floatDelta, 'd')}` : 'Baseline linked',
      source,
      explanation: 'Critical path, programme phases, crane sequence, and gate dependencies are recalculated together.',
      confidence: latestEvent ? 94 : 90,
    },
    {
      key: 'cost',
      label: 'Cost State',
      value: `${formatProjectCurrency(metrics.eac)} EAC`,
      status: metrics.cpi < 0.82 ? 'critical' : metrics.cpi < 0.92 ? 'at-risk' : 'watch',
      deltaLabel: latest ? `EAC ${latest.eacDelta >= 0 ? '+' : '-'}${formatProjectCurrency(Math.abs(latest.eacDelta))}` : 'AED 420M baseline',
      source,
      explanation: 'EAC, CPI, pending variations, and acceleration costs move from the same event impact record.',
      confidence: latestEvent ? 92 : 89,
    },
    {
      key: 'risk',
      label: 'Risk State',
      value: formatProjectCurrency(metrics.riskExposure),
      status: metrics.riskExposure > 45_000_000 ? 'critical' : metrics.riskExposure > 30_000_000 ? 'at-risk' : 'watch',
      deltaLabel: latest ? `Risk ${signedNumber(latest.riskDelta, 'M')}` : '5 risks seeded',
      source,
      explanation: 'Open risk exposure is connected to delay, vendor, gate, evidence, and cost signals.',
      confidence: 91,
    },
    {
      key: 'evidence',
      label: 'Evidence State',
      value: `${metrics.evidenceCompleteness}% ready`,
      status: metrics.evidenceCompleteness < 62 ? 'critical' : metrics.evidenceCompleteness < 78 ? 'at-risk' : 'watch',
      deltaLabel: latest ? `Evidence ${signedNumber(latest.evidenceChange, ' pts')}` : '8 requirements',
      source,
      explanation: 'Evidence readiness gates commissioning, inspection acceptance, audit trail, and handover proof.',
      confidence: latestEvent?.type === 'evidence-rejected' || latestEvent?.type === 'missing-approval' ? 95 : 90,
    },
    {
      key: 'vendor',
      label: 'Vendor State',
      value: `${metrics.vendorScore}/100 avg`,
      status: metrics.vendorScore < 66 ? 'critical' : metrics.vendorScore < 76 || vendorAtRisk > 0 ? 'at-risk' : 'watch',
      deltaLabel: latest?.vendorScoreDelta ? `Vendor ${signedNumber(latest.vendorScoreDelta, ' pts')}` : `${vendorAtRisk} at risk`,
      source,
      explanation: 'Vendor scores respond to facade delay, contractor output, crane productivity, and inspection quality.',
      confidence: 90,
    },
    {
      key: 'workforce',
      label: 'Workforce State',
      value: latestEvent?.type === 'crane-loss' ? 'Crane constrained' : latestEvent?.type === 'weather-disruption' ? 'Weather resequence' : metrics.spi < 0.9 ? 'Recovery load' : 'Balanced',
      status: workforceStatus,
      deltaLabel: latest ? `SPI ${signedDecimal(latest.spiDelta)}` : 'Crew plan stable',
      source,
      explanation: 'Workforce pressure is inferred from crane capacity, weather windows, field output, and contractor performance.',
      confidence: latestEvent?.type === 'crane-loss' || latestEvent?.type === 'weather-disruption' ? 93 : 87,
    },
    {
      key: 'gates',
      label: 'Gate Readiness',
      value: blockedGates > 0 ? `${blockedGates} blocked` : 'No blocked gates',
      status: blockedGates > 1 ? 'critical' : blockedGates === 1 ? 'at-risk' : 'watch',
      deltaLabel: latestEvent?.impacts.gateStatusChange ?? 'Gate chain active',
      source,
      explanation: 'Stage gates inherit schedule, evidence, approval, and inspection status from the live twin.',
      confidence: blockedGates > 0 ? 94 : 89,
    },
    {
      key: 'handover',
      label: 'Handover Confidence',
      value: `${metrics.handoverConfidence}%`,
      status: metrics.handoverConfidence < 48 ? 'critical' : metrics.handoverConfidence < 64 ? 'at-risk' : metrics.handoverConfidence < 76 ? 'watch' : 'on-track',
      deltaLabel: latest ? `Confidence ${signedNumber(Math.round(latest.healthDelta * 0.9 + latest.evidenceChange * 0.15 + latest.floatDelta * 0.35 - latest.riskDelta * 0.35), ' pts')}` : 'Target 12 Aug 2026',
      source,
      explanation: 'Handover confidence blends health, float, evidence readiness, vendor score, and blocked gates.',
      confidence: latestEvent ? 93 : 88,
    },
  ];
}

function cascadeChainForEvent(event: ProjectEvent | null): string[] {
  if (!event || event.type === 'baseline-created') {
    return ['LOA/project summary imported', 'AI created baseline controls', 'Project twin connected programme, cost, vendors, evidence, gates, and forecast', 'Ready for event simulation'];
  }

  const chains: Record<ProjectEventType, string[]> = {
    'baseline-created': ['LOA/project summary imported', 'AI created baseline controls', 'Project twin connected controls', 'Ready for event simulation'],
    'facade-delay': ['Facade procurement delay', 'Envelope release slips', 'Fit-out start is exposed', 'MEP congestion increases', 'Handover confidence drops'],
    'crane-loss': ['Tower crane productivity loss', 'Superstructure cycle slows', 'Facade and MEP hoists queue', 'CPI and SPI deteriorate', 'Recovery action required'],
    'missing-approval': ['Authority approval delay', 'Commissioning Ready gate blocked', 'Handover gate cannot clear', 'Occupancy permit window is exposed'],
    'variation-submitted': ['VO-32 submitted', 'Pending exposure rises', 'EAC forecast changes', 'Manager approval queue required'],
    'evidence-rejected': ['Evidence rejected', 'Audit readiness drops', 'Stage gate remains blocked', 'Handover confidence drops'],
    'inspection-failure': ['Inspection failed', 'Reinspection required', 'MEP/quality gate blocked', 'Float consumed'],
    'contractor-underperformance': ['Contractor productivity declines', 'Daily output curve slips', 'Vendor score falls', 'Risk exposure rises', 'Recovery notice required'],
    'weather-disruption': ['Weather disruption', 'Concrete pour productivity drops', 'Crew and crane plan resequenced', 'Float consumed'],
    'recovery-approved': ['Recovery action approved', 'Night-shift and crane sequence activated', 'Float recovered', 'SPI improves', 'Handover confidence improves'],
  };
  return chains[event.type];
}

function buildCascadeEffects(latestEvent: ProjectEvent | null): CascadeEffect[] {
  const chain = cascadeChainForEvent(latestEvent);
  const source = sourceLabel(latestEvent);
  return [
    {
      id: `${latestEvent?.id ?? 'baseline'}-primary-cascade`,
      title: latestEvent && latestEvent.type !== 'baseline-created' ? `${latestEvent.title} dependency chain` : 'Baseline to live twin chain',
      severity: latestEvent?.severity ?? 'positive',
      sourceEvent: source,
      chain,
      basedOn: latestEvent
        ? [latestEvent.affectedModule, ...latestEvent.affectedAreas.slice(0, 4)]
        : ['Imported project context', 'AI extracted work packages', 'Generated control baseline'],
    },
  ];
}

function buildConsequenceSimulation(metrics: ProjectControlContext['metrics'], latestEvent: ProjectEvent | null): ConsequenceSimulation {
  const latest = latestEvent?.impacts;
  const unresolvedDelay = latestEvent?.severity === 'positive'
    ? Math.max(0, 34 - metrics.floatRemaining)
    : Math.max(3, Math.abs(latest?.floatDelta ?? 6) + Math.max(0, latest?.delayDays ?? 0));
  const unresolvedCost = latestEvent?.severity === 'positive'
    ? Math.max(0, metrics.riskExposure * 0.08)
    : Math.max(Math.abs(latest?.eacDelta ?? 2_400_000), metrics.riskExposure * 0.12);
  const recoveredFloat = latestEvent?.severity === 'positive'
    ? Math.max(4, latest?.floatDelta ?? 8)
    : Math.max(4, Math.round(unresolvedDelay * 0.55));
  const reducedExposure = latestEvent?.severity === 'positive'
    ? Math.max(1_000_000, Math.abs(latest?.eacDelta ?? 2_000_000))
    : Math.max(1_200_000, Math.round(unresolvedCost * 0.48));
  const confidenceGain = latestEvent?.severity === 'positive'
    ? Math.max(5, Math.round((latest?.healthDelta ?? 6) + 2))
    : Math.max(6, Math.round(recoveredFloat * 0.9));

  return {
    title: latestEvent && latestEvent.type !== 'baseline-created'
      ? `Consequence model for ${latestEvent.title}`
      : 'Baseline consequence model',
    confidence: latestEvent ? 93 : 88,
    ifUnresolved: [
      {
        label: 'Delay impact',
        value: `${unresolvedDelay}d slip`,
        detail: latestEvent?.type === 'missing-approval' ? 'Commissioning and occupancy approvals remain exposed.' : 'Downstream programme activities inherit the open blocker.',
        tone: 'bad',
      },
      {
        label: 'Cost impact',
        value: formatProjectCurrency(unresolvedCost),
        detail: 'Exposure can land in EAC through acceleration, claims, rework, or pending variation pressure.',
        tone: 'bad',
      },
      {
        label: 'Confidence impact',
        value: `-${Math.min(18, Math.max(4, confidenceGain + 2))} pts`,
        detail: 'Handover confidence falls when float, proof, vendors, and gates remain unresolved.',
        tone: 'bad',
      },
    ],
    ifResolvedToday: [
      {
        label: 'Float recovered',
        value: `${recoveredFloat}d`,
        detail: 'Recovery action protects near-term programme flow and critical path buffers.',
        tone: 'good',
      },
      {
        label: 'Exposure reduced',
        value: formatProjectCurrency(reducedExposure),
        detail: 'Earlier approval or resequencing limits acceleration and rework cost drift.',
        tone: 'good',
      },
      {
        label: 'Confidence gain',
        value: `+${confidenceGain} pts`,
        detail: 'The twin expects handover confidence to improve once the linked blocker is closed.',
        tone: 'good',
      },
    ],
  };
}

function buildCrossModuleImpacts(
  metrics: ProjectControlContext['metrics'],
  latestEvent: ProjectEvent | null,
  stageGates: ProjectControlContext['stageGateSummary'],
  evidence: ProjectControlContext['evidenceSummary'],
  vendors: ProjectControlContext['vendorSummary'],
): CrossModuleImpact[] {
  const source = sourceLabel(latestEvent);
  const blockedGate = stageGates.find(gate => gate.status === 'critical' || gate.status === 'at-risk');
  const evidenceIssue = evidence.find(item => item.status === 'Missing' || item.status === 'Rejected');
  const vendorIssue = vendors.find(vendor => vendor.status === 'critical' || vendor.status === 'at-risk');
  const workforceWatch = latestEvent?.type === 'crane-loss' || latestEvent?.type === 'weather-disruption' || latestEvent?.type === 'contractor-underperformance';

  return [
    {
      module: 'VendorIQ',
      status: vendorIssue ? vendorIssue.status : statusFromScore(metrics.vendorScore),
      impact: vendorIssue ? `${vendorIssue.scope} vendor performance is now linked to the live event.` : 'Vendor map is tracking package-level performance against the baseline.',
      linkedObject: vendorIssue?.name ?? '6 mapped vendors',
      source,
    },
    {
      module: 'Workforce Intelligence',
      status: workforceWatch ? 'at-risk' : metrics.spi < 0.9 ? 'watch' : 'on-track',
      impact: workforceWatch ? 'Crew, crane, and weather sequencing need an active recovery decision.' : 'Resource plan is watching crane utilization and field productivity.',
      linkedObject: latestEvent?.type === 'weather-disruption' ? 'Weather recovery window' : 'Crane and crew plan',
      source,
    },
    {
      module: 'InspectPro',
      status: latestEvent?.type === 'inspection-failure' ? 'critical' : latestEvent?.type === 'evidence-rejected' ? 'at-risk' : 'watch',
      impact: latestEvent?.type === 'inspection-failure' ? 'Failed inspection blocks MEP rough-in readiness until reinspection.' : 'Inspection outcomes feed evidence readiness and gate confidence.',
      linkedObject: latestEvent?.type === 'inspection-failure' ? 'MEP riser reinspection' : 'Inspection evidence pack',
      source,
    },
    {
      module: 'FieldOps',
      status: metrics.floatRemaining < 10 ? 'critical' : metrics.spi < 0.9 ? 'at-risk' : 'watch',
      impact: 'Field task sequencing mirrors current SPI, float, and recovery pressure.',
      linkedObject: 'Look-ahead programme',
      source,
    },
    {
      module: 'Evidence',
      status: evidenceIssue ? (evidenceIssue.status === 'Missing' ? 'critical' : 'at-risk') : metrics.evidenceCompleteness < 78 ? 'at-risk' : 'watch',
      impact: evidenceIssue ? `${evidenceIssue.title} is ${evidenceIssue.status.toLowerCase()} and blocks trust in the gate.` : 'Evidence requirements remain connected to gate readiness.',
      linkedObject: evidenceIssue?.gate ?? '8 evidence requirements',
      source,
    },
    {
      module: 'Cost',
      status: metrics.cpi < 0.82 ? 'critical' : metrics.cpi < 0.92 || metrics.pendingVariationExposure > 0 ? 'at-risk' : 'watch',
      impact: `${formatProjectCurrency(metrics.eac)} EAC and ${formatProjectCurrency(metrics.pendingVariationExposure)} pending variation exposure are active in the forecast.`,
      linkedObject: 'EAC / variations',
      source,
    },
    {
      module: 'Approvals',
      status: latestEvent?.type === 'missing-approval' ? 'critical' : blockedGate ? 'at-risk' : 'watch',
      impact: latestEvent?.type === 'missing-approval' ? 'Authority approval delay blocks commissioning readiness.' : 'Approval dependencies are watched against upcoming gates.',
      linkedObject: blockedGate?.name ?? 'Authority tracker',
      source,
    },
    {
      module: 'ResidentPortal',
      status: metrics.handoverConfidence < 48 ? 'critical' : metrics.handoverConfidence < 64 ? 'at-risk' : 'watch',
      impact: `Handover confidence is ${metrics.handoverConfidence}% and will drive resident move-in readiness messaging later.`,
      linkedObject: 'Handover readiness',
      source,
    },
  ];
}

function buildSourceTraces(
  metrics: ProjectControlContext['metrics'],
  latestEvent: ProjectEvent | null,
  managerActions: ManagerAction[],
  forecastScenarios: ForecastScenario[],
): SourceTrace[] {
  const eventSources = latestEvent
    ? [latestEvent.affectedModule, latestEvent.impactLabel, latestEvent.impacts.gateStatusChange ?? 'Control metric recalculation']
    : ['Uploaded LOA/project summary', 'AI extraction signals', 'Generated baseline'];

  return [
    {
      insight: 'Health and KPI movement',
      basedOn: ['Programme update', 'Cost variance', 'Risk exposure', ...eventSources.slice(0, 2)],
      confidence: latestEvent ? 94 : 89,
    },
    {
      insight: 'AI top decision',
      basedOn: [managerActions[0]?.triggerLabel ?? 'Baseline risk model', managerActions[0]?.expectedImpact ?? 'Manager action queue', managerActions[0]?.costImplication ?? 'Cost implication'],
      confidence: 93,
    },
    {
      insight: 'Forecast scenario',
      basedOn: [forecastScenarios[1]?.handoverDate ?? metrics.forecastHandover, formatProjectCurrency(metrics.eac), `${metrics.handoverConfidence}% handover confidence`],
      confidence: 91,
    },
  ];
}

export function buildProjectControlContext(dataset: ProjectCommandDataset, events: ProjectEvent[]): ProjectControlContext {
  const baseline = baselineForDataset(dataset);
  const base = baseMetrics(dataset);
  let healthScore = base.healthScore;
  let previousHealthScore = base.healthScore;
  let completion = base.completion;
  let budgetUsed = base.budgetUsed;
  let cpi = base.cpi;
  let spi = base.spi;
  let floatRemaining = base.floatRemaining;
  let eac = base.eac;
  let riskExposure = base.riskExposure;
  let evidenceCompleteness = base.evidenceCompleteness;
  let vendorScore = base.vendorScore;
  let handoverConfidence = base.handoverConfidence;
  let pendingVariationExposure = base.pendingVariationExposure;
  let delayDays = base.delayDays;

  events.forEach((event, index) => {
    if (index === events.length - 1) previousHealthScore = healthScore;
    healthScore += event.impacts.healthDelta;
    completion += event.impacts.completionDelta ?? 0;
    budgetUsed += (event.impacts.eacDelta / Math.max(dataset.project.contractValue, 1)) * 18;
    cpi += event.impacts.cpiDelta;
    spi += event.impacts.spiDelta;
    floatRemaining += event.impacts.floatDelta;
    eac += event.impacts.eacDelta;
    riskExposure += event.impacts.riskDelta * 1_000_000;
    evidenceCompleteness += event.impacts.evidenceChange;
    vendorScore += event.impacts.vendorScoreDelta ?? 0;
    handoverConfidence += (event.impacts.healthDelta * 0.85) + (event.impacts.floatDelta * 0.35) + (event.impacts.evidenceChange * 0.16) - (event.impacts.riskDelta * 0.32);
    pendingVariationExposure += event.impacts.pendingVariationDelta ?? 0;
    delayDays += event.impacts.delayDays ?? 0;
  });

  const metrics = {
    healthScore: Math.round(clamp(healthScore, 20, 96)),
    completion: Number(clamp(completion, 0, 100).toFixed(1)),
    budgetUsed: Number(clamp(budgetUsed, 0, 120).toFixed(1)),
    cpi: Number(clamp(cpi, 0.55, 1.15).toFixed(2)),
    spi: Number(clamp(spi, 0.55, 1.12).toFixed(2)),
    floatRemaining: Math.round(clamp(floatRemaining, 0, 80)),
    forecastHandover: addDays(base.forecastHandover, Math.max(0, delayDays)),
    eac: Math.round(Math.max(eac, dataset.project.contractValue * 0.75)),
    riskExposure: Math.round(Math.max(0, riskExposure)),
    evidenceCompleteness: Math.round(clamp(evidenceCompleteness, 20, 100)),
    vendorScore: Math.round(clamp(vendorScore, 35, 100)),
    handoverConfidence: Math.round(clamp(handoverConfidence, 18, 92)),
    pendingVariationExposure: Math.round(Math.max(0, pendingVariationExposure)),
  };

  const stageGateSummary = buildStageGates(events);
  const evidenceSummary = buildEvidence(events);
  const vendorSummary = buildVendors(events);
  const latestEvent = events[events.length - 1] ?? null;
  const latestIsBaseline = latestEvent?.type === 'baseline-created';
  const topThreat = latestEvent
    ? latestIsBaseline
      ? dataset.aiContent.healthScore.topThreat
      : latestEvent.description
    : dataset.aiContent.healthScore.topThreat || 'Sobha Pilot Tower baseline is healthy and ready for progress updates.';
  const latestImpact = latestEvent?.impactLabel ?? 'Baseline is in place with work packages, programme phases, cost plan, obligations, evidence requirements, milestones, and manager decisions.';
  const forecastScenarios = buildForecastScenarios(dataset, metrics, delayDays);
  const managerActions = buildManagerActions(dataset, events, metrics);
  const controlExceptions = buildExceptions(events, metrics, stageGateSummary, evidenceSummary, vendorSummary);
  const twinStates = buildTwinStates(metrics, latestEvent, stageGateSummary, vendorSummary);
  const cascadeEffects = buildCascadeEffects(latestEvent);
  const consequenceSimulation = buildConsequenceSimulation(metrics, latestEvent);
  const crossModuleImpacts = buildCrossModuleImpacts(metrics, latestEvent, stageGateSummary, evidenceSummary, vendorSummary);
  const sourceTraces = buildSourceTraces(metrics, latestEvent, managerActions, forecastScenarios);

  return {
    baseline,
    events,
    latestEvent,
    healthMovement: {
      from: Math.round(clamp(previousHealthScore, 20, 96)),
      to: metrics.healthScore,
    },
    metrics,
    projectControlStatus: statusFromHealth(metrics.healthScore),
    topThreat,
    latestImpact,
    changedToday: [...events].reverse(),
    controlMetrics: buildMetricCards(dataset, events, metrics),
    controlExceptions,
    managerActions,
    forecastScenarios,
    stageGateSummary,
    evidenceSummary,
    vendorSummary,
    twinStates,
    cascadeEffects,
    consequenceSimulation,
    crossModuleImpacts,
    sourceTraces,
  };
}

export function projectStatusLabel(status: ProjectControlStatus) {
  if (status === 'on-track') return 'On Track';
  if (status === 'watch') return 'Watch';
  if (status === 'at-risk') return 'At Risk';
  return 'Critical';
}

export function projectStatusColor(status: ProjectControlStatus) {
  return statusTone(status);
}

export function formatProjectDate(value: string) {
  return formatDate(value);
}

export function formatProjectEventTime(value: string) {
  return dateFromNow(value);
}
