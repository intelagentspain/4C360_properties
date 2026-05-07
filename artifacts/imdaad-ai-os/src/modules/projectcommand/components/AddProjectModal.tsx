import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BrainCircuit,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  DollarSign,
  HardHat,
  Loader2,
  RefreshCw,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Users,
  WandSparkles,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  projectCommandDatasets,
  projectCommandOrganizations,
  projectCommandPortfolios,
  projectCommandProperties,
  type ProjectCommandDataset,
  type ProjectCommandProject,
  type ProjectDeliveryType,
  type PropertyDevelopment,
} from '../data/portfolio';
import type { Phase } from '../data/phases';
import type { Risk } from '../data/risks';

type ProjectSetupMode = 'ai' | 'manual';
type WizardStep = 'setup' | 'budget' | 'generating' | 'baseline' | 'review';
type ProjectType = ProjectDeliveryType;
type PropertyType = 'Residential Tower' | 'Villa Community' | 'Mixed-use' | 'Commercial Building' | 'Master Community';
type ProjectStage =
  | 'Concept'
  | 'Design'
  | 'Enabling Works'
  | 'Substructure'
  | 'Superstructure'
  | 'MEP'
  | 'Fit-out'
  | 'Handover';
type Currency = 'AED' | 'SAR' | 'USD' | 'EUR';
type BudgetStructureMethod = 'AI suggested work packages' | 'Upload budget breakdown' | 'Manual entry';
type CostTrackingLevel = 'Project level' | 'Phase/package level' | 'Vendor/contract level' | 'Cost code level';
type ReportingFrequency = 'Weekly' | 'Monthly' | 'Custom';
type CommitmentTracking = 'Vendor contracts' | 'PO / commitment register' | 'Manual commitments';
type ActualCostSource = 'Manual actuals' | 'ERP sync' | 'Invoice upload' | 'Vendor claims';
type VariationControl = 'Manager approval' | 'Client approval workflow' | 'Commercial review board';
type CashflowBasis = 'Baseline schedule + package progress' | 'Approved payment certificates' | 'Contract milestones + forecast risks';
type AiForecastMode = 'Actuals + variations + risks' | 'Actuals only' | 'Scenario forecast';

type ProjectFormState = {
  organizationId: string;
  portfolioId: string;
  propertyMode: 'existing' | 'new';
  propertyId: string;
  propertyName: string;
  propertyLocation: string;
  propertyType: PropertyType;
  propertyBuildings: string;
  propertyUnits: string;
  propertySize: string;
  name: string;
  client: string;
  location: string;
  type: ProjectType;
  size: string;
  targetHandover: string;
  budget: string;
  currency: Currency;
  contingency: string;
  baselineDate: string;
  budgetStructureMethod: BudgetStructureMethod;
  costTrackingLevel: CostTrackingLevel;
  reportingFrequency: ReportingFrequency;
  commitmentTracking: CommitmentTracking;
  actualCostSource: ActualCostSource;
  variationControl: VariationControl;
  cashflowBasis: CashflowBasis;
  aiForecastMode: AiForecastMode;
  stage: ProjectStage;
  prompt: string;
};

type WorkPackage = {
  name: string;
  detail: string;
  progress: number;
  critical: boolean;
};

type BudgetPackage = {
  label: string;
  percent: number;
  amount: number;
  plannedStart: string;
  plannedEnd: string;
  vendor: string;
  riskAllowance: number;
  linkedProgrammePhase: string;
};

type StarterRisk = {
  title: string;
  severity: Risk['severity'];
  mitigation: string;
};

type ProjectBaseline = {
  summary: {
    projectType: ProjectType;
    expectedDuration: string;
    handoverTarget: string;
    complexity: string;
    stage: ProjectStage;
  };
  components: WorkPackage[];
  teamRoles: string[];
  vendorCategories: string[];
  budgetBreakdown: BudgetPackage[];
  risks: StarterRisk[];
  kpis: string[];
  warnings: string[];
  readinessScore: number;
  recommendedActions: string[];
};

const projectTypes: ProjectType[] = [
  'Main Construction',
  'Fit-out',
  'Infrastructure',
  'Handover & Snagging',
  'Warranty / DLP Remediation',
  'Capital Improvement',
  'ESG Retrofit',
  'Smart Building Rollout',
  'Maintenance Upgrade',
  'Custom',
];

const propertyTypes: PropertyType[] = ['Residential Tower', 'Villa Community', 'Mixed-use', 'Commercial Building', 'Master Community'];
const projectStages: ProjectStage[] = ['Concept', 'Design', 'Enabling Works', 'Substructure', 'Superstructure', 'MEP', 'Fit-out', 'Handover'];
const currencies: Currency[] = ['AED', 'SAR', 'USD', 'EUR'];
const budgetStructureMethods: BudgetStructureMethod[] = ['AI suggested work packages', 'Upload budget breakdown', 'Manual entry'];
const costTrackingLevels: CostTrackingLevel[] = ['Project level', 'Phase/package level', 'Vendor/contract level', 'Cost code level'];
const reportingFrequencies: ReportingFrequency[] = ['Weekly', 'Monthly', 'Custom'];
const commitmentTrackingOptions: CommitmentTracking[] = ['Vendor contracts', 'PO / commitment register', 'Manual commitments'];
const actualCostSourceOptions: ActualCostSource[] = ['Manual actuals', 'ERP sync', 'Invoice upload', 'Vendor claims'];
const variationControlOptions: VariationControl[] = ['Manager approval', 'Client approval workflow', 'Commercial review board'];
const cashflowBasisOptions: CashflowBasis[] = ['Baseline schedule + package progress', 'Approved payment certificates', 'Contract milestones + forecast risks'];
const aiForecastModeOptions: AiForecastMode[] = ['Actuals + variations + risks', 'Actuals only', 'Scenario forecast'];
const loadingSteps = [
  'Understanding project scope',
  'Creating work breakdown structure',
  'Estimating milestone phases',
  'Suggesting teams and vendors',
  'Identifying early risks',
  'Preparing budget structure',
];

function toPropertyType(value: string): PropertyType {
  return propertyTypes.includes(value as PropertyType) ? (value as PropertyType) : 'Mixed-use';
}

const initialForm: ProjectFormState = {
  organizationId: 'developmentx',
  portfolioId: 'danube-properties-portfolio',
  propertyMode: 'existing',
  propertyId: 'bayz-102-property',
  propertyName: 'Bayz 102',
  propertyLocation: 'Business Bay',
  propertyType: 'Residential Tower',
  propertyBuildings: '1',
  propertyUnits: '680',
  propertySize: '102 floors',
  name: 'Main Construction',
  client: 'Danube Properties Portfolio',
  location: 'Business Bay',
  type: 'Main Construction',
  size: '102 floors, 680 units',
  targetHandover: '2027-12-15',
  budget: '420',
  currency: 'AED',
  contingency: '8',
  baselineDate: '2026-05-07',
  budgetStructureMethod: 'AI suggested work packages',
  costTrackingLevel: 'Phase/package level',
  reportingFrequency: 'Monthly',
  commitmentTracking: 'Vendor contracts',
  actualCostSource: 'Invoice upload',
  variationControl: 'Commercial review board',
  cashflowBasis: 'Baseline schedule + package progress',
  aiForecastMode: 'Actuals + variations + risks',
  stage: 'Concept',
  prompt: '48-floor residential tower in Dubai Sports City with basement parking, podium amenities, MEP, fit-out, and handover target in Q4.',
};

const fieldInput = 'h-10 rounded-xl border border-[rgba(46,127,255,0.22)] bg-[#07111F] px-3 text-[12px] text-[#EEF3FA] outline-none transition-colors placeholder:text-[#4A6080] focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20';

function money(amount: number, currency: Currency) {
  return `${currency} ${Math.round(amount)}M`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function slugify(value: string) {
  const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return slug || 'new-project';
}

function dateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Target date pending';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function addDaysToDate(value: string, days: number) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function daysUntil(value: string) {
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return 365;
  const diff = Math.ceil((target.getTime() - Date.now()) / 86_400_000);
  return clamp(diff, 30, 1200);
}

function stageProgress(stage: ProjectStage) {
  const index = projectStages.indexOf(stage);
  return clamp(8 + index * 12, 4, 92);
}

function projectPackageNames(type: ProjectType) {
  if (type === 'Infrastructure') {
    return ['Design & Permits', 'Enabling Works', 'Earthworks', 'Utilities', 'Roads & Access', 'Testing & Commissioning', 'Authority Handover'];
  }
  if (type === 'Warranty / DLP Remediation') {
    return ['Defect Intake', 'Inspection', 'Vendor Assignment', 'Remediation Works', 'Verification', 'Resident Confirmation', 'Contingency'];
  }
  if (type === 'ESG Retrofit') {
    return ['Audit & Baseline', 'Design', 'Procurement', 'Installation', 'Commissioning', 'Measurement & Verification', 'Contingency'];
  }
  if (type === 'Handover & Snagging') {
    return ['Handover Planning', 'Unit Inspections', 'Snagging Works', 'Authority Closeout', 'Resident Readiness', 'Final Handover', 'Contingency'];
  }
  if (type === 'Smart Building Rollout') {
    return ['Asset Survey', 'Solution Design', 'Hardware Procurement', 'Installation', 'Platform Integration', 'User Onboarding', 'Commissioning', 'Contingency'];
  }
  if (type === 'Fit-out') {
    return ['Design Freeze', 'Procurement', 'MEP Coordination', 'Partitions & Ceilings', 'Finishes', 'Testing & Commissioning', 'Handover', 'Contingency'];
  }
  if (type === 'Capital Improvement' || type === 'Maintenance Upgrade') {
    return ['Scope Validation', 'Design', 'Procurement', 'Works Execution', 'Testing', 'Closeout', 'Contingency'];
  }
  return ['Preliminaries', 'Design & Approvals', 'Enabling Works', 'Substructure', 'Superstructure', 'Facade', 'MEP', 'Fit-out', 'Testing & Commissioning', 'Handover & Snagging', 'Contingency'];
}

function vendorCategories(type: ProjectType) {
  const common = ['Main Contractor', 'MEP Contractor', 'Fire Systems Contractor', 'Fit-out Contractor'];
  if (type === 'Infrastructure') return ['Civil Contractor', 'Utilities Contractor', 'Roadworks Contractor', 'Testing Laboratory', 'Authority Liaison Consultant'];
  if (type === 'Warranty / DLP Remediation') return ['DLP Coordinator', 'Defect Contractor', 'MEP Contractor', 'Resident Liaison Team', 'QA/QC Inspector'];
  if (type === 'ESG Retrofit') return ['Energy Auditor', 'Design Consultant', 'Equipment Supplier', 'Installation Contractor', 'M&V Consultant'];
  if (type === 'Handover & Snagging') return ['Handover Manager', 'Snagging Contractor', 'Authority Liaison Consultant', 'FM Readiness Team'];
  if (type === 'Smart Building Rollout') return ['Smart Access Integrator', 'IoT Contractor', 'Network Contractor', 'Cybersecurity Reviewer', 'Resident App Team'];
  return [...common, 'Waterproofing Contractor', 'Facade Contractor', 'Elevator Supplier', 'Landscaping Contractor'];
}

function normalizedWeights(type: ProjectType, count: number) {
  const weightsByType: Partial<Record<ProjectType, number[]>> = {
    'Main Construction': [6, 6, 5, 14, 22, 12, 16, 10, 3, 2],
    'Fit-out': [10, 16, 18, 18, 24, 8, 6],
    Infrastructure: [10, 12, 18, 24, 22, 8, 6],
    'Handover & Snagging': [12, 22, 28, 12, 16, 10],
    'Warranty / DLP Remediation': [10, 14, 18, 32, 14, 12],
    'Capital Improvement': [12, 14, 20, 32, 12, 10],
    'ESG Retrofit': [12, 14, 24, 28, 10, 12],
    'Smart Building Rollout': [10, 14, 24, 18, 18, 8, 8],
    'Maintenance Upgrade': [12, 14, 20, 34, 10, 10],
    Custom: [15, 15, 20, 25, 15, 10],
  };
  const source = weightsByType[type] ?? weightsByType['Main Construction'] ?? [];
  const weights = Array.from({ length: count }, (_, index) => source[index] ?? 10);
  const total = weights.reduce((sum, item) => sum + item, 0) || 1;
  return weights.map(item => item / total);
}

function linkedPhaseForPackage(name: string, type: ProjectType) {
  const lower = name.toLowerCase();
  if (lower.includes('design') || lower.includes('audit') || lower.includes('scope')) return 'Design & Approvals';
  if (lower.includes('enabling') || lower.includes('earth')) return 'Enabling Works';
  if (lower.includes('substructure') || lower.includes('defect intake') || lower.includes('inspection')) return 'Substructure';
  if (lower.includes('superstructure') || lower.includes('installation') || lower.includes('works execution') || lower.includes('remediation')) return 'Superstructure';
  if (lower.includes('mep') || lower.includes('integration') || lower.includes('procurement')) return 'MEP Rough-in';
  if (lower.includes('fit') || lower.includes('resident') || lower.includes('onboarding')) return 'Fit-out & Finishing';
  if (lower.includes('testing') || lower.includes('commissioning') || lower.includes('verification') || lower.includes('handover') || lower.includes('closeout')) return 'Handover & Snagging';
  return type === 'Warranty / DLP Remediation' ? 'Handover & Snagging' : 'Programme phase';
}

function vendorForPackage(name: string, type: ProjectType) {
  const lower = name.toLowerCase();
  if (lower.includes('design') || lower.includes('audit')) return type === 'ESG Retrofit' ? 'Energy Auditor' : 'Design Consultant';
  if (lower.includes('procurement')) return 'Procurement Lead';
  if (lower.includes('mep')) return 'MEP Contractor';
  if (lower.includes('facade')) return 'Facade Contractor';
  if (lower.includes('defect') || lower.includes('remediation') || lower.includes('snag')) return 'DLP / Snagging Contractor';
  if (lower.includes('handover') || lower.includes('resident')) return 'Handover Team';
  if (lower.includes('smart') || lower.includes('platform') || lower.includes('hardware') || lower.includes('integration')) return 'Smart Systems Integrator';
  if (lower.includes('measurement')) return 'M&V Consultant';
  if (lower.includes('contingency')) return 'Commercial Manager';
  return vendorCategories(type)[0] ?? 'Main Contractor';
}

function generateBaseline(form: ProjectFormState): ProjectBaseline {
  const budget = Number(form.budget) || 280;
  const contingency = clamp(Number(form.contingency) || 8, 3, 18);
  const stageIndex = projectStages.indexOf(form.stage);
  const completion = stageProgress(form.stage);
  const hasBasement = /basement|parking/i.test(form.prompt + form.size);
  const hasHighRise = /tower|floor|floors|high/i.test(form.type + form.size);
  const complexityScore = (budget > 350 ? 2 : 1) + (hasHighRise ? 2 : 0) + (hasBasement ? 1 : 0) + (stageIndex <= 2 ? 1 : 0);
  const complexity = complexityScore >= 5 ? 'High complexity' : complexityScore >= 3 ? 'Moderate-high complexity' : 'Moderate complexity';
  const packages = projectPackageNames(form.type);
  const components = packages.map((name, index) => {
    const progress = index < Math.max(1, stageIndex) ? 100 : index === Math.max(1, stageIndex) ? completion : 0;
    return {
      name,
      detail: index <= 1 ? 'Setup and approval gate' : index >= packages.length - 2 ? 'Closeout and handover gate' : 'Core delivery package',
      progress,
      critical: index >= Math.max(2, stageIndex) && index <= Math.min(packages.length - 1, stageIndex + 3),
    };
  });

  const deliveryPackages = packages.filter(name => name.toLowerCase() !== 'contingency');
  const deliveryPercentTotal = Math.max(70, 100 - contingency);
  const weights = normalizedWeights(form.type, deliveryPackages.length);
  const budgetBreakdown: BudgetPackage[] = [
    ...deliveryPackages.map((name, index) => {
      const percent = Number((weights[index] * deliveryPercentTotal).toFixed(1));
      return {
        label: name,
        percent,
        amount: budget * (percent / 100),
        plannedStart: `Month ${Math.max(1, index * 2 + 1)}`,
        plannedEnd: `Month ${Math.max(3, index * 2 + 4)}`,
        vendor: vendorForPackage(name, form.type),
        riskAllowance: budget * (percent / 100) * 0.08,
        linkedProgrammePhase: linkedPhaseForPackage(name, form.type),
      };
    }),
    {
      label: 'Contingency',
      percent: contingency,
      amount: budget * (contingency / 100),
      plannedStart: 'Controlled reserve',
      plannedEnd: 'Project close',
      vendor: 'Commercial Manager',
      riskAllowance: budget * (contingency / 100),
      linkedProgrammePhase: 'All phases',
    },
  ];

  const locationRisk = /dubai|uae|abu dhabi/i.test(form.location) ? 'authority approval and inspection sequencing' : 'local authority approval sequencing';
  const risks: StarterRisk[] = [
    { title: `${locationRisk} delay`, severity: 'high', mitigation: 'Create authority submission tracker and appoint approval owner.' },
    { title: hasBasement ? 'Basement waterproofing rework' : 'Early works interface gaps', severity: hasBasement ? 'critical' : 'medium', mitigation: 'Add hold points, mockups, and inspection gates before release.' },
    { title: 'MEP coordination conflicts', severity: 'high', mitigation: 'Run BIM coordination workshops and freeze riser strategy before procurement.' },
    { title: 'Long-lead procurement lead time', severity: 'high', mitigation: 'Seed procurement register for facade, lifts, fire systems, and MEP equipment.' },
    { title: 'Handover snagging overload', severity: 'medium', mitigation: 'Create floor-by-floor readiness tracker and defect aging SLA.' },
  ];

  const warnings = [
    'No MEP vendor assigned yet',
    contingency < 8 ? 'Budget contingency below recommended 8% for this complexity' : 'Handover date should be validated against authority gates',
    complexityScore >= 5 ? 'High-rise logistics should be simulated before baseline approval' : 'Confirm vendor capacity before publishing baseline',
  ];

  const readinessScore = clamp(78 + (form.name ? 4 : 0) + (form.client ? 3 : 0) + (form.targetHandover ? 4 : 0) + (contingency >= 8 ? 4 : 0) - (complexityScore >= 5 ? 5 : 0), 68, 94);

  return {
    summary: {
      projectType: form.type,
      expectedDuration: `${stageIndex <= 1 ? '18-24' : '12-18'} months from current stage`,
      handoverTarget: dateLabel(form.targetHandover),
      complexity,
      stage: form.stage,
    },
    components,
    teamRoles: ['Project Director', 'Project Manager', 'Commercial Manager', 'Planning Manager', 'QA/QC Lead', 'HSE Lead', 'Site Engineers', 'MEP Coordinator', 'Document Controller'],
    vendorCategories: vendorCategories(form.type),
    budgetBreakdown,
    risks,
    kpis: ['Completion %', 'Budget used', 'CPI', 'SPI', 'Float remaining', 'Unresolved risks', 'Defects open'],
    warnings,
    readinessScore,
    recommendedActions: [
      'Confirm authority submission calendar',
      'Assign project controls owner before baseline freeze',
      'Seed long-lead procurement register',
      'Create weekly risk review cadence',
      'Link quality gates to package milestones',
    ],
  };
}

function buildCostSeries(budget: number, completion: number): ProjectCommandDataset['costSeries'] {
  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan-27', 'Feb', 'Mar', 'Apr'];
  const plannedPercents = [4, 8, 14, 21, 30, 40, 52, 64, 74, 82, 89, 94, 98, 100, 100, 100];
  const todayIndex = 6;
  const planned = plannedPercents.map(percent => Math.round(budget * percent / 100));
  const actual = plannedPercents.map((percent, index) => index <= todayIndex ? Math.round(budget * Math.min(percent + 5, completion + 18) / 100) : null);
  const earnedValue = plannedPercents.map((percent, index) => index <= todayIndex ? Math.round(budget * Math.min(percent, completion) / 100) : null);
  const forecast = plannedPercents.map((percent, index) => index >= todayIndex ? Math.round(budget * Math.min(108, percent + 8) / 100) : null);
  return { labels, planned, actual, earnedValue, forecast, todayIndex };
}

function buildDataset(form: ProjectFormState, baseline: ProjectBaseline): ProjectCommandDataset {
  const budgetM = Number(form.budget) || 280;
  const budget = budgetM * 1_000_000;
  const completion = stageProgress(form.stage);
  const budgetUsed = clamp(completion + (completion < 30 ? 8 : 12), 10, 96);
  const earnedValue = Math.round(budget * completion / 100);
  const actualCost = Math.round(budget * budgetUsed / 100);
  const plannedValue = Math.round(budget * clamp(completion + 8, 12, 100) / 100);
  const cpi = Number((earnedValue / Math.max(actualCost, 1)).toFixed(2));
  const spi = Number((earnedValue / Math.max(plannedValue, 1)).toFixed(2));
  const costVariance = earnedValue - actualCost;
  const scheduleVariance = earnedValue - plannedValue;
  const forecastCost = Math.round(budget * (1 + (baseline.readinessScore < 82 ? 0.09 : 0.05)));
  const healthScore = baseline.readinessScore;
  const status = healthScore >= 82 ? 'on-track' : healthScore >= 70 ? 'monitor' : 'critical';
  const healthStatus = healthScore >= 82 ? 'good' : healthScore >= 70 ? 'monitor' : 'critical';
  const id = `project-${slugify(form.name)}-${Date.now().toString(36)}`;
  const selectedPortfolio = projectCommandPortfolios.find(item => item.id === form.portfolioId) ?? projectCommandPortfolios[0];
  const selectedOrganization =
    projectCommandOrganizations.find(item => item.id === (selectedPortfolio?.organizationId ?? form.organizationId)) ??
    projectCommandOrganizations[0];
  const existingProperty = projectCommandProperties.find(item => item.id === form.propertyId);
  const property: PropertyDevelopment =
    form.propertyMode === 'new'
      ? {
          id: `property-${slugify(form.propertyName || form.name)}-${Date.now().toString(36)}`,
          portfolioId: selectedPortfolio.id,
          name: form.propertyName || form.name,
          type: form.propertyType,
          location: form.propertyLocation || form.location,
          buildings: Number(form.propertyBuildings) || 1,
          units: Number(form.propertyUnits) || 0,
          size: form.propertySize || form.size,
          status: 'planned',
        }
      : existingProperty ?? {
          id: form.propertyId || `property-${slugify(form.propertyName || form.name)}`,
          portfolioId: selectedPortfolio.id,
          name: form.propertyName || form.name,
          type: form.propertyType,
          location: form.propertyLocation || form.location,
          buildings: Number(form.propertyBuildings) || 1,
          units: Number(form.propertyUnits) || 0,
          size: form.propertySize || form.size,
          status: 'active',
        };
  const phases: Phase[] = baseline.components.map((component, index) => ({
    id: `${id}-phase-${index}`,
    name: component.name,
    startPct: Math.round(index * (100 / baseline.components.length)),
    widthPct: Math.max(8, Math.round(100 / baseline.components.length) + (component.critical ? 4 : 0)),
    completePct: component.progress,
    color: component.progress >= 80 ? '#00B894' : component.progress >= 30 ? '#C8A020' : component.critical ? '#7C3AED' : '#243448',
    isCritical: component.critical,
    aiAnnotation: component.critical ? 'AI watch item' : undefined,
    subTasks: [
      { id: `${id}-phase-${index}-a`, name: `${component.name} scope freeze`, startPct: Math.round(index * (100 / baseline.components.length)), widthPct: 5, completePct: component.progress > 0 ? 100 : 0, isCritical: component.critical },
      { id: `${id}-phase-${index}-b`, name: `${component.name} delivery`, startPct: Math.round(index * (100 / baseline.components.length)) + 4, widthPct: 8, completePct: component.progress, isCritical: component.critical },
    ],
  }));

  const risks: Risk[] = baseline.risks.map((risk, index) => ({
    id: `${id}-risk-${index + 1}`,
    title: risk.title,
    category: index === 0 ? 'legal' : index === 1 ? 'quality' : index === 2 ? 'programme' : index === 3 ? 'cost' : 'quality',
    probability: risk.severity === 'critical' ? 5 : risk.severity === 'high' ? 4 : 3,
    impact: risk.severity === 'critical' ? 5 : risk.severity === 'high' ? 4 : 3,
    score: risk.severity === 'critical' ? 25 : risk.severity === 'high' ? 16 : 9,
    severity: risk.severity,
    status: 'open',
    owner: index === 0 ? 'Project Manager' : index === 3 ? 'Procurement' : 'PM Team',
    mitigation: risk.mitigation,
    aiEarlyWarning: `AI seeded risk from ${form.type.toLowerCase()} baseline and ${form.location} context.`,
  }));

  const milestones = baseline.components.map((component, index) => ({
    id: `${id}-milestone-${index + 1}`,
    name: component.name,
    daysRemaining: Math.max(14, Math.round(daysUntil(form.targetHandover) * ((index + 1) / baseline.components.length))),
    color: component.critical ? '#7C3AED' : '#5A6E88',
    critical: component.critical,
  }));

  const baseAi = projectCommandDatasets['lawnz-residences'].aiContent;
  const forecastCompletion = healthScore >= 84 ? form.targetHandover : addDaysToDate(form.targetHandover, healthScore >= 74 ? 35 : 72);
  const costSeries = buildCostSeries(budgetM, completion);
  const evmSummary = {
    pv: Math.round(plannedValue / 1_000_000),
    ac: Math.round(actualCost / 1_000_000),
    ev: Math.round(earnedValue / 1_000_000),
    cpi,
    spi,
    cv: Math.round(costVariance / 1_000_000),
    sv: Math.round(scheduleVariance / 1_000_000),
    eac: Math.round(forecastCost / 1_000_000),
    etc: Math.max(0, Math.round((forecastCost - actualCost) / 1_000_000)),
    vac: Math.round((budget - forecastCost) / 1_000_000),
    tcpi: Number(((budget - earnedValue) / Math.max(budget - actualCost, 1)).toFixed(2)),
  };

  const project: ProjectCommandProject = {
    id,
    name: form.name,
    organizationId: selectedOrganization.id,
    portfolioId: selectedPortfolio.id,
    propertyId: property.id,
    projectType: form.type,
    developer: selectedPortfolio.name,
    location: property.location,
    type: `${property.type} - ${form.type}`.trim(),
    floors: Number((property.size ?? form.size).match(/\d+/)?.[0] ?? 0),
    contractValue: budget,
    startDate: new Date().toISOString().slice(0, 10),
    targetHandover: form.targetHandover,
    status,
    completion,
    budgetUsed,
    daysToHandover: daysUntil(form.targetHandover),
    mainContractor: 'Main contractor to be assigned',
    plannedValue,
    actualCost,
    earnedValue,
    cpi,
    spi,
    costVariance,
    scheduleVariance,
    floatRemaining: clamp(Math.round((baseline.readinessScore - 60) * 1.4), 8, 48),
    healthScore,
    healthStatus,
    forecastCompletion,
    forecastCost,
  };

  return {
    id,
    selectorLabel: `${property.name} - ${form.name}`,
    organization: selectedOrganization,
    portfolio: selectedPortfolio,
    property,
    project,
    phases,
    costSeries,
    evmSummary,
    risks,
    milestones,
    aiContent: {
      ...baseAi,
      healthScore: {
        ...baseAi.healthScore,
        score: healthScore,
        status: healthStatus,
        topThreat: baseline.risks[0]?.title ?? 'Baseline setup requires project controls validation.',
        recommendedAction: baseline.recommendedActions[0] ?? 'Confirm the baseline setup before publishing.',
        scoreBreakdown: { programme: healthScore - 2, cost: healthScore - 5, quality: healthScore, risk: healthScore - 4, contractor: healthScore - 6 },
        forecast30d: { completion: clamp(completion + 7, 0, 100), spend: Math.round(actualCost / 1_000_000) + 18, newRisks: baseline.risks.length, sparkline: [completion, completion + 1, completion + 2, completion + 3, completion + 4, completion + 5, completion + 5.5, completion + 6, completion + 6.5, completion + 7] },
      },
      topDecisions: baseline.recommendedActions.map((action, index) => ({
        rank: index + 1,
        title: action,
        impact: index === 0 ? 'Locks the operating rhythm before packages begin to diverge' : 'Improves baseline reliability and reduces setup risk',
        urgency: index < 2 ? 'high' : 'medium',
        deadline: dateLabel(addDaysToDate(new Date().toISOString(), 7 + index * 5)),
      })),
      programmeInsights: {
        ...baseAi.programmeInsights,
        criticalPathNarrative: `AI baseline for ${form.name} runs through ${baseline.components.filter(item => item.critical).map(item => item.name).join(' -> ')}. The current setup risk is highest around ${baseline.risks[0]?.title.toLowerCase()}.`,
        rescheduleSuggestion: `Validate ${form.stage.toLowerCase()} assumptions against vendor capacity before freezing the first baseline.`,
      },
      costInsights: {
        ...baseAi.costInsights,
        narrative: `${form.name} has an initial ${form.currency} ${budgetM}M baseline. AI expects ${money(Math.round(forecastCost / 1_000_000), form.currency)} at completion until vendors, contingencies, and package scopes are confirmed.`,
        eacConfidence: { p10: Math.round(budgetM * 0.98), p50: Math.round(forecastCost / 1_000_000), p90: Math.round(budgetM * 1.14) },
        topCostDrivers: baseline.budgetBreakdown.slice(0, 5).map(item => ({ item: item.label, value: Number(item.amount.toFixed(1)), status: item.label === 'Contingency' ? 'forecast' : 'pending' })),
      },
      riskInsights: {
        ...baseAi.riskInsights,
        earlyWarnings: baseline.risks.slice(0, 3).map(risk => `${risk.title}: ${risk.mitigation}`),
      },
      scenarios: {
        optimistic: { label: 'Optimistic', probability: 20, completionDate: form.targetHandover, finalCost: Math.round(budget * 1.01), assumptions: ['Authority calendar confirmed early', 'Long-lead packages released on time', 'No major rework in critical path', 'Contingency remains protected'], programmeSlip: 0 },
        base: { label: 'Base Case', probability: 55, completionDate: forecastCompletion, finalCost: forecastCost, assumptions: ['Baseline approved after setup review', 'Vendor assignments completed within 30 days', 'MEP coordination starts before procurement freeze', 'Contingency used for normal package movement'], programmeSlip: healthScore >= 84 ? 0 : 35 },
        pessimistic: { label: 'Pessimistic', probability: 25, completionDate: addDaysToDate(form.targetHandover, 120), finalCost: Math.round(budget * 1.16), assumptions: ['Authority approvals slip', 'Long-lead procurement starts late', 'MEP coordination conflicts multiply', 'Handover snagging compresses closeout'], programmeSlip: 120 },
      },
      askAI: {
        queries: [
          { question: 'What is the biggest risk to our handover date?', answer: `For ${form.name}, the biggest seeded handover risk is ${baseline.risks[0]?.title.toLowerCase()}. AI recommends confirming ownership, milestone gates, and vendor dependencies before the baseline is published.`, sources: ['AI Project Baseline', 'Starter Risk Register', 'Milestone Plan'] },
          { question: 'How much will this project cost at completion?', answer: `The initial AI estimate at completion is ${money(Math.round(forecastCost / 1_000_000), form.currency)} against a starting budget of ${money(budgetM, form.currency)}. This should tighten once package scopes and vendors are assigned.`, sources: ['Budget Breakdown', 'AI Cost Baseline', 'Package Register'] },
          { question: 'What should we set up first?', answer: `Start with authority milestones, project controls ownership, procurement long-leads, and the first risk review cadence. These setup items have the highest influence on the ${form.stage.toLowerCase()} baseline.`, sources: ['Readiness Review', 'AI Recommendations', 'Risk Register Starter'] },
        ],
      },
    },
  };
}

function AiBadge({ children = 'AI generated' }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#7C3AED]/35 bg-[#7C3AED]/12 px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#C4B5FD]">
      <Sparkles size={10} />
      {children}
    </span>
  );
}

function SectionCard({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-[rgba(46,127,255,0.16)] bg-[#07111F]/70 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#7C3AED]/14 text-[#C4B5FD]"><Icon size={16} /></span>
          {title}
        </div>
        <AiBadge />
      </div>
      {children}
    </div>
  );
}

function ProgressSteps({ step }: { step: WizardStep }) {
  const activeIndex = step === 'setup' ? 0 : step === 'budget' ? 1 : step === 'generating' || step === 'baseline' ? 2 : 3;
  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      {['Project Basics', 'Budget Control', 'AI Baseline', 'Review'].map((label, index) => (
        <div key={label} className={`rounded-xl border px-3 py-2 text-[11px] font-bold transition-colors ${index <= activeIndex ? 'border-[#7C3AED]/40 bg-[#7C3AED]/15 text-[#E9D5FF]' : 'border-[rgba(46,127,255,0.12)] bg-[#07111F] text-[#5A6E88]'}`}>
          <div className="flex items-center gap-2">
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${index <= activeIndex ? 'bg-[#7C3AED] text-white' : 'bg-[#122240] text-[#7A94B4]'}`}>{index + 1}</span>
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProjectSetupWizard({
  mode,
  onModeChange,
  step,
  children,
}: {
  mode: ProjectSetupMode;
  onModeChange: (mode: ProjectSetupMode) => void;
  step: WizardStep;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-4 border-b border-[rgba(46,127,255,0.12)] p-5">
        <ProgressSteps step={step} />
        {step === 'setup' && (
          <div className="grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => onModeChange('ai')}
              className={`rounded-2xl border p-4 text-left transition-all ${mode === 'ai' ? 'border-[#7C3AED]/55 bg-[linear-gradient(135deg,rgba(124,58,237,0.28),rgba(225,29,46,0.12))] shadow-[0_0_28px_rgba(124,58,237,0.18)]' : 'border-[rgba(46,127,255,0.14)] bg-[#07111F]/80 hover:border-[#7C3AED]/35'}`}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#7C3AED]/20 text-[#C4B5FD]"><WandSparkles size={19} /></span>
                {mode === 'ai' && <AiBadge>Recommended</AiBadge>}
              </div>
              <h4 className="text-base font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Start with AI</h4>
              <p className="mt-1 text-[12px] leading-5 text-[#B8C7DB]">Generate phases, vendors, risks, milestones, budget structure, and KPIs in minutes.</p>
            </button>
            <button
              type="button"
              onClick={() => onModeChange('manual')}
              className={`rounded-2xl border p-4 text-left transition-colors ${mode === 'manual' ? 'border-[#E11D2E]/50 bg-[#E11D2E]/10' : 'border-[rgba(46,127,255,0.14)] bg-[#07111F]/70 hover:border-[rgba(46,127,255,0.28)]'}`}
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E11D2E]/12 text-red-200"><SlidersHorizontal size={19} /></div>
              <h4 className="text-base font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Manual Setup</h4>
              <p className="mt-1 text-[12px] leading-5 text-[#7A94B4]">Enter details yourself, then let AI validate readiness before creation.</p>
            </button>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function LabeledField({ label, children, span = false }: { label: string; children: ReactNode; span?: boolean }) {
  return (
    <label className={`space-y-1.5 ${span ? 'md:col-span-2' : ''}`}>
      <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">{label}</span>
      {children}
    </label>
  );
}

function AiProjectSetupStep({
  form,
  setForm,
  mode,
  onContinue,
}: {
  form: ProjectFormState;
  setForm: (form: ProjectFormState) => void;
  mode: ProjectSetupMode;
  onContinue: () => void;
}) {
  const portfoliosForOrganization = projectCommandPortfolios.filter(item => item.organizationId === form.organizationId);
  const selectedPortfolio = projectCommandPortfolios.find(item => item.id === form.portfolioId) ?? portfoliosForOrganization[0] ?? projectCommandPortfolios[0];
  const propertiesForPortfolio = projectCommandProperties.filter(item => item.portfolioId === selectedPortfolio.id);
  const selectedProperty = projectCommandProperties.find(item => item.id === form.propertyId) ?? propertiesForPortfolio[0];

  const update = <K extends keyof ProjectFormState>(key: K, value: ProjectFormState[K]) => setForm({ ...form, [key]: value });

  const applyProperty = (property: PropertyDevelopment, portfolio = selectedPortfolio) => {
    setForm({
      ...form,
      portfolioId: portfolio.id,
      propertyMode: 'existing',
      propertyId: property.id,
      propertyName: property.name,
      propertyLocation: property.location,
      propertyType: toPropertyType(property.type),
      propertyBuildings: String(property.buildings),
      propertyUnits: String(property.units),
      propertySize: property.size ?? '',
      client: portfolio.name,
      location: property.location,
      size: [property.size, property.units ? `${property.units} units` : ''].filter(Boolean).join(', '),
    });
  };

  const handleOrganizationChange = (organizationId: string) => {
    const nextPortfolio = projectCommandPortfolios.find(item => item.organizationId === organizationId) ?? projectCommandPortfolios[0];
    const nextProperty = projectCommandProperties.find(item => item.portfolioId === nextPortfolio.id);
    setForm({
      ...form,
      organizationId,
      portfolioId: nextPortfolio.id,
      client: nextPortfolio.name,
      ...(nextProperty
        ? {
            propertyMode: 'existing' as const,
            propertyId: nextProperty.id,
            propertyName: nextProperty.name,
            propertyLocation: nextProperty.location,
            propertyType: toPropertyType(nextProperty.type),
            propertyBuildings: String(nextProperty.buildings),
            propertyUnits: String(nextProperty.units),
            propertySize: nextProperty.size ?? '',
            location: nextProperty.location,
            size: [nextProperty.size, nextProperty.units ? `${nextProperty.units} units` : ''].filter(Boolean).join(', '),
          }
        : {}),
    });
  };

  const handlePortfolioChange = (portfolioId: string) => {
    const nextPortfolio = projectCommandPortfolios.find(item => item.id === portfolioId) ?? selectedPortfolio;
    const nextProperty = projectCommandProperties.find(item => item.portfolioId === nextPortfolio.id);
    setForm({
      ...form,
      portfolioId: nextPortfolio.id,
      client: nextPortfolio.name,
      ...(nextProperty
        ? {
            propertyMode: 'existing' as const,
            propertyId: nextProperty.id,
            propertyName: nextProperty.name,
            propertyLocation: nextProperty.location,
            propertyType: toPropertyType(nextProperty.type),
            propertyBuildings: String(nextProperty.buildings),
            propertyUnits: String(nextProperty.units),
            propertySize: nextProperty.size ?? '',
            location: nextProperty.location,
            size: [nextProperty.size, nextProperty.units ? `${nextProperty.units} units` : ''].filter(Boolean).join(', '),
          }
        : { propertyMode: 'new' as const, propertyId: '' }),
    });
  };

  const updatePropertyDraft = (patch: Partial<ProjectFormState>) => {
    const next = { ...form, ...patch };
    next.location = next.propertyLocation;
    next.size = [next.propertySize, next.propertyUnits ? `${next.propertyUnits} units` : ''].filter(Boolean).join(', ');
    setForm(next);
  };

  return (
    <div className="min-h-0 flex flex-1 flex-col">
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-5 pb-4">
        <div className="mb-4 rounded-2xl border border-[#7C3AED]/25 bg-[#7C3AED]/10 p-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#C4B5FD]">Where does this project belong?</p>
              <p className="mt-1 text-[12px] leading-5 text-[#B8C7DB]">
                ProjectCommand controls temporary project delivery under a permanent property/development. Select an existing property or create one first.
              </p>
            </div>
            <div className="rounded-full border border-[rgba(46,127,255,0.18)] bg-[#07111F] px-3 py-1 text-[10px] font-bold text-[#7EB8F7]">
              Organization - Portfolio - Property - Project
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <LabeledField label="Organization">
            <select className={`${fieldInput} w-full`} value={form.organizationId} onChange={event => handleOrganizationChange(event.target.value)}>
              {projectCommandOrganizations.map(organization => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
            </select>
          </LabeledField>
          <LabeledField label="Portfolio">
            <select className={`${fieldInput} w-full`} value={form.portfolioId} onChange={event => handlePortfolioChange(event.target.value)}>
              {portfoliosForOrganization.map(portfolio => <option key={portfolio.id} value={portfolio.id}>{portfolio.name}</option>)}
            </select>
          </LabeledField>
          <div className="md:col-span-2 rounded-2xl border border-[rgba(46,127,255,0.16)] bg-[#07111F]/70 p-4">
            <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2 text-sm font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#7C3AED]/14 text-[#C4B5FD]"><Building2 size={16} /></span>
                Property / Development
              </div>
              <div className="flex rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#0A1628] p-1">
                {(['existing', 'new'] as const).map(modeOption => (
                  <button
                    key={modeOption}
                    type="button"
                    onClick={() => {
                      if (modeOption === 'existing' && selectedProperty) {
                        applyProperty(selectedProperty);
                      } else {
                        setForm({ ...form, propertyMode: 'new', propertyId: '', propertyName: '', propertyLocation: form.location, propertyBuildings: '1', propertyUnits: '', propertySize: '' });
                      }
                    }}
                    className={`rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] ${form.propertyMode === modeOption ? 'bg-[#7C3AED] text-white' : 'text-[#7A94B4] hover:text-[#EEF3FA]'}`}
                  >
                    {modeOption === 'existing' ? 'Existing property' : 'Create new property'}
                  </button>
                ))}
              </div>
            </div>
            {form.propertyMode === 'existing' ? (
              <div className="grid gap-3 lg:grid-cols-[1fr_1.2fr]">
                <LabeledField label="Property / Development">
                  <select
                    className={`${fieldInput} w-full`}
                    value={selectedProperty?.id ?? ''}
                    onChange={event => {
                      const property = projectCommandProperties.find(item => item.id === event.target.value);
                      if (property) applyProperty(property);
                    }}
                  >
                    {propertiesForPortfolio.map(property => <option key={property.id} value={property.id}>{property.name}</option>)}
                  </select>
                </LabeledField>
                <div className="rounded-xl border border-[rgba(46,127,255,0.12)] bg-[#0A1628] px-3 py-2">
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">Selected property context</p>
                  <p className="mt-1 text-[12px] font-bold text-[#DDE6F8]">
                    {form.propertyName} - {form.propertyType} - {form.propertyLocation}
                  </p>
                  <p className="mt-1 text-[10px] text-[#7A94B4]">{form.propertyBuildings || '1'} building(s), {form.propertyUnits || '0'} units, {form.propertySize || 'size pending'}</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                <LabeledField label="Property name">
                  <input className={`${fieldInput} w-full`} value={form.propertyName} onChange={event => updatePropertyDraft({ propertyName: event.target.value })} />
                </LabeledField>
                <LabeledField label="Property location">
                  <input className={`${fieldInput} w-full`} value={form.propertyLocation} onChange={event => updatePropertyDraft({ propertyLocation: event.target.value })} />
                </LabeledField>
                <LabeledField label="Property type">
                  <select className={`${fieldInput} w-full`} value={form.propertyType} onChange={event => updatePropertyDraft({ propertyType: event.target.value as PropertyType })}>
                    {propertyTypes.map(type => <option key={type}>{type}</option>)}
                  </select>
                </LabeledField>
                <div className="grid grid-cols-3 gap-3">
                  <LabeledField label="Buildings">
                    <input className={`${fieldInput} w-full`} value={form.propertyBuildings} onChange={event => updatePropertyDraft({ propertyBuildings: event.target.value })} />
                  </LabeledField>
                  <LabeledField label="Units">
                    <input className={`${fieldInput} w-full`} value={form.propertyUnits} onChange={event => updatePropertyDraft({ propertyUnits: event.target.value })} />
                  </LabeledField>
                  <LabeledField label="Size / GFA">
                    <input className={`${fieldInput} w-full`} value={form.propertySize} onChange={event => updatePropertyDraft({ propertySize: event.target.value })} />
                  </LabeledField>
                </div>
              </div>
            )}
          </div>
          <LabeledField label="Project name">
            <input className={`${fieldInput} w-full`} value={form.name} onChange={event => update('name', event.target.value)} />
          </LabeledField>
          <LabeledField label="Project type">
            <select className={`${fieldInput} w-full`} value={form.type} onChange={event => update('type', event.target.value as ProjectType)}>
              {projectTypes.map(type => <option key={type}>{type}</option>)}
            </select>
          </LabeledField>
          <LabeledField label="Target handover date">
            <input type="date" className={`${fieldInput} w-full`} value={form.targetHandover} onChange={event => update('targetHandover', event.target.value)} />
          </LabeledField>
          <LabeledField label="Current stage">
            <select className={`${fieldInput} w-full`} value={form.stage} onChange={event => update('stage', event.target.value as ProjectStage)}>
              {projectStages.map(stage => <option key={stage}>{stage}</option>)}
            </select>
          </LabeledField>
          <LabeledField label="Describe the project briefly" span>
            <textarea
              className={`${fieldInput} min-h-[96px] w-full resize-none py-3 leading-5`}
              value={form.prompt}
              placeholder="48-floor residential tower in Dubai Sports City with basement parking, podium amenities, MEP, fit-out, and handover target in Q4."
              onChange={event => update('prompt', event.target.value)}
            />
          </LabeledField>
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-3 border-t border-[#7C3AED]/25 bg-[linear-gradient(135deg,rgba(124,58,237,0.22),rgba(9,21,42,0.98))] p-4 shadow-[0_-18px_36px_rgba(3,8,18,0.72)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          <Sparkles size={16} className="text-[#C4B5FD]" />
            {mode === 'ai' ? 'Project context ready' : 'Manual project context ready'}
          </div>
          <p className="mt-1 text-[12px] text-[#B8C7DB]">Next, set how the budget will be controlled so the Cost tab can trace every number back to a source.</p>
        </div>
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-5 text-[12px] font-black text-white shadow-lg shadow-violet-950/25 transition-colors hover:bg-[#6D28D9]"
        >
          <ArrowRight size={15} />
          Continue to Budget Control
        </button>
      </div>
    </div>
  );
}

function BudgetControlSetupStep({
  form,
  setForm,
  mode,
  onBack,
  onGenerate,
}: {
  form: ProjectFormState;
  setForm: (form: ProjectFormState) => void;
  mode: ProjectSetupMode;
  onBack: () => void;
  onGenerate: () => void;
}) {
  const update = <K extends keyof ProjectFormState>(key: K, value: ProjectFormState[K]) => setForm({ ...form, [key]: value });

  return (
    <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-5">
      <div className="mb-4 rounded-3xl border border-[#7C3AED]/25 bg-[linear-gradient(135deg,rgba(124,58,237,0.18),rgba(7,17,31,0.84))] p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <AiBadge>{mode === 'ai' ? 'Budget intelligence' : 'Budget control'}</AiBadge>
            <h3 className="mt-3 text-xl font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Create the Budget Control model</h3>
            <p className="mt-1 max-w-3xl text-[12px] leading-5 text-[#B8C7DB]">
              This is the source of truth for the Cost tab. It tells ProjectCommand what was approved for this project, how costs will be captured, and how AI should forecast drift. This budget belongs to the selected project, not the permanent property operating budget.
            </p>
          </div>
          <div className="rounded-2xl border border-[#C8A020]/25 bg-[#C8A020]/10 px-4 py-3 text-[11px] font-bold text-[#FDE68A]">
            Budget map will feed Cost Control immediately after creation.
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard title="1. Set The Budget" icon={DollarSign}>
          <div className="grid gap-3">
            <LabeledField label="Contract value / approved budget">
              <input className={`${fieldInput} w-full`} value={form.budget} onChange={event => update('budget', event.target.value)} />
            </LabeledField>
            <div className="grid grid-cols-2 gap-3">
              <LabeledField label="Currency">
                <select className={`${fieldInput} w-full`} value={form.currency} onChange={event => update('currency', event.target.value as Currency)}>
                  {currencies.map(currency => <option key={currency}>{currency}</option>)}
                </select>
              </LabeledField>
              <LabeledField label="Contingency %">
                <input className={`${fieldInput} w-full`} value={form.contingency} onChange={event => update('contingency', event.target.value)} />
              </LabeledField>
            </div>
            <LabeledField label="Budget baseline date">
              <input type="date" className={`${fieldInput} w-full`} value={form.baselineDate} onChange={event => update('baselineDate', event.target.value)} />
            </LabeledField>
            <LabeledField label="Budget structure method">
              <select className={`${fieldInput} w-full`} value={form.budgetStructureMethod} onChange={event => update('budgetStructureMethod', event.target.value as BudgetStructureMethod)}>
                {budgetStructureMethods.map(method => <option key={method}>{method}</option>)}
              </select>
            </LabeledField>
            <LabeledField label="Cost tracking level">
              <select className={`${fieldInput} w-full`} value={form.costTrackingLevel} onChange={event => update('costTrackingLevel', event.target.value as CostTrackingLevel)}>
                {costTrackingLevels.map(level => <option key={level}>{level}</option>)}
              </select>
            </LabeledField>
            <LabeledField label="Reporting frequency">
              <select className={`${fieldInput} w-full`} value={form.reportingFrequency} onChange={event => update('reportingFrequency', event.target.value as ReportingFrequency)}>
                {reportingFrequencies.map(frequency => <option key={frequency}>{frequency}</option>)}
              </select>
            </LabeledField>
          </div>
        </SectionCard>

        <SectionCard title="2. Capture What Changes" icon={ClipboardCheck}>
          <div className="grid gap-3">
            <LabeledField label="Commitments source">
              <select className={`${fieldInput} w-full`} value={form.commitmentTracking} onChange={event => update('commitmentTracking', event.target.value as CommitmentTracking)}>
                {commitmentTrackingOptions.map(option => <option key={option}>{option}</option>)}
              </select>
            </LabeledField>
            <LabeledField label="Actual cost source">
              <select className={`${fieldInput} w-full`} value={form.actualCostSource} onChange={event => update('actualCostSource', event.target.value as ActualCostSource)}>
                {actualCostSourceOptions.map(option => <option key={option}>{option}</option>)}
              </select>
            </LabeledField>
            <LabeledField label="Variation control">
              <select className={`${fieldInput} w-full`} value={form.variationControl} onChange={event => update('variationControl', event.target.value as VariationControl)}>
                {variationControlOptions.map(option => <option key={option}>{option}</option>)}
              </select>
            </LabeledField>
            <div className="rounded-2xl border border-[rgba(46,127,255,0.12)] bg-[#0A1628] p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#7A94B4]">Data traceability</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {['Contracts', 'Actuals', 'Invoices', 'Claims', 'Variations', 'Evidence'].map(item => (
                  <span key={item} className="rounded-full border border-emerald-400/18 bg-emerald-400/8 px-2 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-emerald-100">{item}</span>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="3. Decide What To Do" icon={BrainCircuit}>
          <div className="grid gap-3">
            <LabeledField label="Cashflow basis">
              <select className={`${fieldInput} w-full`} value={form.cashflowBasis} onChange={event => update('cashflowBasis', event.target.value as CashflowBasis)}>
                {cashflowBasisOptions.map(option => <option key={option}>{option}</option>)}
              </select>
            </LabeledField>
            <LabeledField label="AI forecast mode">
              <select className={`${fieldInput} w-full`} value={form.aiForecastMode} onChange={event => update('aiForecastMode', event.target.value as AiForecastMode)}>
                {aiForecastModeOptions.map(option => <option key={option}>{option}</option>)}
              </select>
            </LabeledField>
            <div className="rounded-2xl border border-[#7C3AED]/20 bg-[#7C3AED]/10 p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#C4B5FD]">Manager action queue</p>
              <div className="mt-2 grid gap-2">
                {['Approve variations', 'Review over-budget packages', 'Escalate vendor claims', 'Protect contingency'].map(item => (
                  <div key={item} className="rounded-xl bg-[#07111F]/80 px-3 py-2 text-[11px] font-bold text-[#DDE6F8]">{item}</div>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="sticky bottom-0 mt-5 flex flex-col gap-2 border-t border-[rgba(46,127,255,0.12)] bg-[#09152A]/95 py-4 backdrop-blur sm:flex-row sm:justify-end">
        <button onClick={onBack} className="rounded-xl border border-[rgba(46,127,255,0.22)] px-4 py-2 text-[12px] font-bold text-[#B8C7DB] hover:bg-white/5">Back</button>
        <button
          type="button"
          onClick={onGenerate}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-5 text-[12px] font-black text-white shadow-lg shadow-violet-950/25 transition-colors hover:bg-[#6D28D9]"
        >
          <WandSparkles size={15} />
          {mode === 'ai' ? 'Generate Budget Baseline' : 'Build Budget Baseline'}
        </button>
      </div>
    </div>
  );
}

function GenerationLoading({ index }: { index: number }) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center p-6">
      <div className="w-full max-w-3xl rounded-3xl border border-[#7C3AED]/30 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.24),rgba(7,17,31,0.96)_48%)] p-6 shadow-2xl shadow-black/30">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-[#7C3AED]/35 bg-[#07111F] shadow-[0_0_42px_rgba(124,58,237,0.28)]">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}>
            <Loader2 size={42} className="text-[#C4B5FD]" />
          </motion.div>
        </div>
        <h3 className="text-center text-xl font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Generating project baseline</h3>
        <p className="mx-auto mt-2 max-w-xl text-center text-[12px] leading-5 text-[#B8C7DB]">AI is turning the project brief into a practical operating model for ProjectCommand.</p>
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          {loadingSteps.map((step, stepIndex) => {
            const active = stepIndex === index;
            const done = stepIndex < index;
            return (
              <motion.div
                key={step}
                animate={active ? { scale: [1, 1.02, 1] } : { scale: 1 }}
                transition={{ repeat: active ? Infinity : 0, duration: 1.1 }}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-[12px] font-bold ${done ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : active ? 'border-[#7C3AED]/45 bg-[#7C3AED]/16 text-[#E9D5FF]' : 'border-[rgba(46,127,255,0.12)] bg-[#07111F]/80 text-[#7A94B4]'}`}
              >
                {done ? <CheckCircle2 size={16} /> : active ? <Sparkles size={16} /> : <span className="h-4 w-4 rounded-full border border-[#264468]" />}
                {step}...
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function WorkPackageList({ items }: { items: WorkPackage[] }) {
  return (
    <div className="space-y-2">
      {items.map(item => (
        <div key={item.name} className="rounded-xl border border-[rgba(46,127,255,0.12)] bg-[#0A1628] p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[12px] font-bold text-[#EEF3FA]">{item.name}</p>
              <p className="mt-0.5 text-[10px] text-[#7A94B4]">{item.detail}</p>
            </div>
            {item.critical && <span className="rounded-full border border-[#E11D2E]/30 bg-[#E11D2E]/10 px-2 py-1 text-[9px] font-black uppercase text-red-200">Critical</span>}
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-[#122240]"><div className="h-full rounded-full bg-[#7C3AED]" style={{ width: `${item.progress}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

function TeamRoleList({ roles }: { roles: string[] }) {
  return <div className="flex flex-wrap gap-2">{roles.map(role => <span key={role} className="rounded-full border border-[rgba(46,127,255,0.2)] bg-[#0A1628] px-3 py-1.5 text-[10px] font-bold text-[#B8C7DB]">{role}</span>)}</div>;
}

function VendorCategoryList({ vendors }: { vendors: string[] }) {
  return <div className="grid gap-2 sm:grid-cols-2">{vendors.map(vendor => <div key={vendor} className="rounded-xl border border-[rgba(46,127,255,0.12)] bg-[#0A1628] px-3 py-2 text-[11px] font-bold text-[#B8C7DB]">{vendor}</div>)}</div>;
}

function BudgetBreakdownCard({ items, currency }: { items: BudgetPackage[]; currency: Currency }) {
  return (
    <div className="space-y-3">
      {items.map(item => (
        <div key={item.label} className="rounded-xl border border-[rgba(46,127,255,0.12)] bg-[#0A1628] p-3">
          <div className="mb-2 flex items-start justify-between gap-3 text-[11px]">
            <div>
              <span className="font-bold text-[#DDE6F8]">{item.label}</span>
              <p className="mt-0.5 text-[10px] text-[#7A94B4]">{item.plannedStart} to {item.plannedEnd}</p>
            </div>
            <span className="font-mono text-right text-[#C4B5FD]">{item.percent}% - {money(item.amount, currency)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-[#122240]"><div className="h-full rounded-full bg-[#C8A020]" style={{ width: `${item.percent}%` }} /></div>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg bg-[#07111F] px-2 py-1.5">
              <p className="text-[8px] font-black uppercase tracking-wide text-[#5A6E88]">Linked phase</p>
              <p className="mt-0.5 text-[10px] font-bold text-[#B8C7DB]">{item.linkedProgrammePhase}</p>
            </div>
            <div className="rounded-lg bg-[#07111F] px-2 py-1.5">
              <p className="text-[8px] font-black uppercase tracking-wide text-[#5A6E88]">Vendor category</p>
              <p className="mt-0.5 text-[10px] font-bold text-[#B8C7DB]">{item.vendor}</p>
            </div>
            <div className="rounded-lg bg-[#07111F] px-2 py-1.5">
              <p className="text-[8px] font-black uppercase tracking-wide text-[#5A6E88]">Risk allowance</p>
              <p className="mt-0.5 text-[10px] font-bold text-[#B8C7DB]">{money(item.riskAllowance, currency)}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StarterRiskRegister({ risks }: { risks: StarterRisk[] }) {
  return (
    <div className="space-y-2">
      {risks.map(risk => (
        <div key={risk.title} className="rounded-xl border border-[rgba(46,127,255,0.12)] bg-[#0A1628] p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[12px] font-bold text-[#EEF3FA]">{risk.title}</p>
            <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${risk.severity === 'critical' ? 'bg-red-400/12 text-red-200' : risk.severity === 'high' ? 'bg-amber-400/12 text-amber-200' : 'bg-[#7C3AED]/12 text-[#C4B5FD]'}`}>{risk.severity}</span>
          </div>
          <p className="mt-1 text-[10px] leading-4 text-[#7A94B4]">{risk.mitigation}</p>
        </div>
      ))}
    </div>
  );
}

function ProjectBaselinePreview({
  baseline,
  form,
  onApply,
  onRegenerate,
  onEdit,
}: {
  baseline: ProjectBaseline;
  form: ProjectFormState;
  onApply: () => void;
  onRegenerate: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-5">
      <div className="mb-4 rounded-3xl border border-[#7C3AED]/25 bg-[linear-gradient(135deg,rgba(124,58,237,0.18),rgba(225,29,46,0.08))] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <AiBadge>Baseline ready</AiBadge>
            <h3 className="mt-3 text-2xl font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{form.name}</h3>
            <p className="mt-1 text-[12px] text-[#B8C7DB]">{baseline.summary.projectType} - {baseline.summary.stage} - {baseline.summary.handoverTarget}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ['Duration', baseline.summary.expectedDuration],
              ['Complexity', baseline.summary.complexity],
              ['Packages', baseline.components.length],
              ['Risks', baseline.risks.length],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-[rgba(46,127,255,0.16)] bg-[#07111F]/80 p-3">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">{label}</p>
                <p className="mt-1 text-[12px] font-black text-[#EEF3FA]">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mb-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/8 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-200">
              <CheckCircle2 size={14} />
              Budget Baseline Created
            </div>
            <p className="mt-1 text-[12px] leading-5 text-[#B8C7DB]">
              {form.budgetStructureMethod} created {baseline.budgetBreakdown.length} packages linked to programme phases, vendor categories, commitments, actual cost sources, and variation controls.
            </p>
            <p className="mt-2 max-w-3xl text-[12px] leading-5 text-[#DDE6F8]">
              This baseline will populate Budget Control with approved budget, revised budget, commitments, actuals, variations, cashflow, cost risks, CPI/SPI/EAC, and manager actions.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Approved budget', money(Number(form.budget) || 0, form.currency)],
              ['Contingency', `${form.contingency}%`],
              ['Tracking level', form.costTrackingLevel],
              ['Reporting', form.reportingFrequency],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-emerald-400/14 bg-[#07111F]/80 px-3 py-2">
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#7A94B4]">{label}</p>
                <p className="mt-1 text-[11px] font-black text-[#EEF3FA]">{value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {[
            ['Set budget', ['Approved budget', 'Cost packages', 'Programme phases', form.costTrackingLevel]],
            ['Capture changes', [form.commitmentTracking, form.actualCostSource, form.variationControl, 'Evidence links']],
            ['Decide actions', [form.cashflowBasis, form.aiForecastMode, 'Cost risks', 'Manager action queue']],
          ].map(([title, items]) => (
            <div key={title as string} className="rounded-2xl border border-emerald-400/14 bg-[#07111F]/80 p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-200">{title}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(items as string[]).map(item => (
                  <span key={item} className="rounded-full border border-[rgba(46,127,255,0.14)] bg-[#0A1628] px-2 py-1 text-[9px] font-bold text-[#B8C7DB]">{item}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Components / Work Packages" icon={ClipboardCheck}><WorkPackageList items={baseline.components} /></SectionCard>
        <SectionCard title="Budget Breakdown" icon={DollarSign}><BudgetBreakdownCard items={baseline.budgetBreakdown} currency={form.currency} /></SectionCard>
        <SectionCard title="Suggested Team Structure" icon={Users}><TeamRoleList roles={baseline.teamRoles} /></SectionCard>
        <SectionCard title="Vendor Categories" icon={HardHat}><VendorCategoryList vendors={baseline.vendorCategories} /></SectionCard>
        <SectionCard title="Risk Register Starter" icon={ShieldAlert}><StarterRiskRegister risks={baseline.risks} /></SectionCard>
        <SectionCard title="Suggested KPIs" icon={BrainCircuit}>
          <div className="flex flex-wrap gap-2">{baseline.kpis.map(kpi => <span key={kpi} className="rounded-full border border-[#7C3AED]/25 bg-[#7C3AED]/10 px-3 py-1.5 text-[10px] font-bold text-[#C4B5FD]">{kpi}</span>)}</div>
        </SectionCard>
      </div>
      <div className="sticky bottom-0 mt-5 flex flex-col gap-2 border-t border-[rgba(46,127,255,0.12)] bg-[#09152A]/95 py-4 backdrop-blur sm:flex-row sm:justify-end">
        <button onClick={onEdit} className="rounded-xl border border-[rgba(46,127,255,0.22)] px-4 py-2 text-[12px] font-bold text-[#B8C7DB] hover:bg-white/5">Edit Manually</button>
        <button onClick={onRegenerate} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#7C3AED]/35 bg-[#7C3AED]/10 px-4 py-2 text-[12px] font-bold text-[#C4B5FD] hover:bg-[#7C3AED]/16"><RefreshCw size={14} /> Regenerate</button>
        <button onClick={onApply} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-5 py-2 text-[12px] font-black text-white hover:bg-[#6D28D9]">Apply Baseline <ArrowRight size={14} /></button>
      </div>
    </div>
  );
}

function AiReadinessScore({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 42;
  const dash = (score / 100) * circumference;
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[#7C3AED]/25 bg-[#07111F]/80 p-4">
      <svg width="104" height="104" viewBox="0 0 104 104" aria-label={`AI setup readiness ${score}%`}>
        <circle cx="52" cy="52" r="42" fill="none" stroke="#1C3050" strokeWidth="10" />
        <motion.circle
          cx="52"
          cy="52"
          r="42"
          fill="none"
          stroke="#7C3AED"
          strokeLinecap="round"
          strokeWidth="10"
          strokeDasharray={`${dash} ${circumference - dash}`}
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${dash} ${circumference - dash}` }}
          transform="rotate(-90 52 52)"
        />
        <text x="52" y="50" textAnchor="middle" className="fill-[#EEF3FA] text-2xl font-black">{score}</text>
        <text x="52" y="67" textAnchor="middle" className="fill-[#7A94B4] text-[11px] font-bold">/100</text>
      </svg>
      <div>
        <AiBadge>AI readiness</AiBadge>
        <h4 className="mt-2 text-lg font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>AI Setup Readiness: {score}%</h4>
        <p className="mt-1 text-[12px] leading-5 text-[#B8C7DB]">Strong enough to create a draft project baseline. Vendor assignment and contingency review remain the next controls.</p>
      </div>
    </div>
  );
}

function ProjectReviewStep({
  form,
  baseline,
  onBack,
  onCreate,
  onSaveDraft,
}: {
  form: ProjectFormState;
  baseline: ProjectBaseline;
  onBack: () => void;
  onCreate: () => void;
  onSaveDraft: () => void;
}) {
  const selectedPortfolio = projectCommandPortfolios.find(item => item.id === form.portfolioId) ?? projectCommandPortfolios[0];
  const selectedOrganization = projectCommandOrganizations.find(item => item.id === selectedPortfolio.organizationId) ?? projectCommandOrganizations[0];
  const selectedProperty = projectCommandProperties.find(item => item.id === form.propertyId);
  const propertyLabel = form.propertyMode === 'new'
    ? `${form.propertyName || 'New property'} (new property)`
    : selectedProperty?.name ?? form.propertyName;

  const reviewItems = [
    ['Organization', selectedOrganization.name],
    ['Portfolio', selectedPortfolio.name],
    ['Property / Development', propertyLabel],
    ['Budget owner', 'ProjectCommand project budget'],
    ['Project name', form.name],
    ['Project type', form.type],
    ['Approved project budget', money(Number(form.budget) || 0, form.currency)],
    ['Budget baseline date', form.baselineDate],
    ['Target handover', baseline.summary.handoverTarget],
    ['Budget structure', form.budgetStructureMethod],
    ['Cost tracking', form.costTrackingLevel],
    ['Commitments source', form.commitmentTracking],
    ['Actuals source', form.actualCostSource],
    ['Variation control', form.variationControl],
    ['Cashflow basis', form.cashflowBasis],
    ['AI forecast mode', form.aiForecastMode],
    ['Phases created', baseline.components.length],
    ['Team roles created', baseline.teamRoles.length],
    ['Vendor categories created', baseline.vendorCategories.length],
    ['Risks seeded', baseline.risks.length],
    ['KPIs enabled', baseline.kpis.length],
  ];

  return (
    <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-5">
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <AiReadinessScore score={baseline.readinessScore} />
        <div className="rounded-2xl border border-[rgba(46,127,255,0.16)] bg-[#07111F]/80 p-4">
          <h4 className="text-sm font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Readiness warnings</h4>
          <div className="mt-3 space-y-2">
            {baseline.warnings.map(warning => (
              <div key={warning} className="flex gap-2 rounded-xl border border-amber-400/18 bg-amber-400/8 px-3 py-2 text-[11px] text-amber-100">
                <ShieldAlert size={14} className="mt-0.5 shrink-0" />
                {warning}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 rounded-2xl border border-[rgba(46,127,255,0.16)] bg-[#07111F]/80 p-4">
        <h4 className="mb-3 text-sm font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Final review</h4>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {reviewItems.map(([label, value]) => (
            <div key={label} className="rounded-xl border border-[rgba(46,127,255,0.12)] bg-[#0A1628] p-3">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">{label}</p>
              <p className="mt-1 text-[12px] font-bold text-[#DDE6F8]">{value}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="sticky bottom-0 mt-5 flex flex-col gap-2 border-t border-[rgba(46,127,255,0.12)] bg-[#09152A]/95 py-4 backdrop-blur sm:flex-row sm:justify-end">
        <button onClick={onBack} className="rounded-xl border border-[rgba(46,127,255,0.22)] px-4 py-2 text-[12px] font-bold text-[#B8C7DB] hover:bg-white/5">Back</button>
        <button onClick={onSaveDraft} className="rounded-xl border border-[#C8A020]/35 bg-[#C8A020]/10 px-4 py-2 text-[12px] font-bold text-[#FDE68A] hover:bg-[#C8A020]/16">Save Draft</button>
        <button onClick={onCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E11D2E] px-5 py-2 text-[12px] font-black text-white shadow-lg shadow-red-950/25 hover:bg-[#C51625]">
          <Building2 size={14} />
          Create Project
        </button>
      </div>
    </div>
  );
}

export function AddProjectModal({
  onClose,
  onCreate,
  onToast,
}: {
  onClose: () => void;
  onCreate: (dataset: ProjectCommandDataset) => void;
  onToast?: (message: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}) {
  const [mode, setMode] = useState<ProjectSetupMode>('ai');
  const [step, setStep] = useState<WizardStep>('setup');
  const [form, setForm] = useState<ProjectFormState>(initialForm);
  const [baseline, setBaseline] = useState<ProjectBaseline | null>(null);
  const [loadingIndex, setLoadingIndex] = useState(0);

  useEffect(() => {
    if (step !== 'generating') return undefined;
    setLoadingIndex(0);
    const interval = window.setInterval(() => {
      setLoadingIndex(current => {
        if (current >= loadingSteps.length - 1) {
          window.clearInterval(interval);
          setBaseline(generateBaseline(form));
          setStep('baseline');
          return current;
        }
        return current + 1;
      });
    }, 680);
    return () => window.clearInterval(interval);
  }, [step]);

  const canCreate = useMemo(() => baseline && form.name.trim().length > 0, [baseline, form.name]);

  const handleCreate = () => {
    if (!baseline || !canCreate) return;
    onCreate(buildDataset(form, baseline));
    onToast?.('Project created with AI baseline', 'success');
    onClose();
  };

  const handleSaveDraft = () => {
    onToast?.('Project draft saved locally', 'info');
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 z-[2500] flex items-center justify-center bg-black/62 p-2 backdrop-blur-sm sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        className="flex max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-[rgba(46,127,255,0.24)] bg-[#09152A] shadow-2xl shadow-black/50"
      >
        <div className="flex flex-col gap-4 border-b border-[rgba(46,127,255,0.12)] bg-[linear-gradient(135deg,rgba(124,58,237,0.18),rgba(9,21,42,0.98)_48%,rgba(225,29,46,0.08))] p-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#7C3AED]/35 bg-[#7C3AED]/12 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#C4B5FD]">
              <BrainCircuit size={12} />
              ProjectCommand AI Setup
            </div>
            <h2 className="text-2xl font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Create New Project</h2>
            <p className="mt-1 max-w-2xl text-[12px] leading-5 text-[#B8C7DB]">Set up your project structure manually or let AI generate a complete project baseline.</p>
          </div>
          <button onClick={onClose} className="self-start rounded-xl p-2 text-[#7A94B4] transition-colors hover:bg-white/5 hover:text-white" aria-label="Close Add Project">
            <X size={19} />
          </button>
        </div>

        <ProjectSetupWizard mode={mode} onModeChange={setMode} step={step}>
          <AnimatePresence mode="wait">
            {step === 'setup' && (
              <motion.div key="setup" className="flex min-h-0 flex-1 flex-col overflow-hidden" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <AiProjectSetupStep form={form} setForm={setForm} mode={mode} onContinue={() => setStep('budget')} />
              </motion.div>
            )}
            {step === 'budget' && (
              <motion.div key="budget" className="flex min-h-0 flex-1 flex-col overflow-hidden" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <BudgetControlSetupStep form={form} setForm={setForm} mode={mode} onBack={() => setStep('setup')} onGenerate={() => setStep('generating')} />
              </motion.div>
            )}
            {step === 'generating' && <motion.div key="generating" className="flex min-h-0 flex-1 flex-col overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><GenerationLoading index={loadingIndex} /></motion.div>}
            {step === 'baseline' && baseline && (
              <motion.div key="baseline" className="flex min-h-0 flex-1 flex-col overflow-hidden" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <ProjectBaselinePreview baseline={baseline} form={form} onApply={() => setStep('review')} onRegenerate={() => setStep('generating')} onEdit={() => { setMode('manual'); setStep('budget'); }} />
              </motion.div>
            )}
            {step === 'review' && baseline && (
              <motion.div key="review" className="flex min-h-0 flex-1 flex-col overflow-hidden" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <ProjectReviewStep form={form} baseline={baseline} onBack={() => setStep('baseline')} onCreate={handleCreate} onSaveDraft={handleSaveDraft} />
              </motion.div>
            )}
          </AnimatePresence>
        </ProjectSetupWizard>
      </motion.div>
    </motion.div>
  );
}
