import { aiContent as lawnzAiContent } from './ai-responses';
import { costSeries as lawnzCostSeries, evmSummary as lawnzEvmSummary } from './costs';
import { milestones as lawnzMilestones } from './milestones';
import { phases as lawnzPhases, type Phase } from './phases';
import { project as lawnzProject } from './project';
import { risks as lawnzRisks, type Risk } from './risks';

export type ProjectHealthStatus = 'good' | 'monitor' | 'critical';
export type ProjectCommandProjectId = string;
export type ProjectCommandPropertyId = string;

export type ProjectDeliveryType =
  | 'Main Construction'
  | 'Fit-out'
  | 'Infrastructure'
  | 'Handover & Snagging'
  | 'Warranty / DLP Remediation'
  | 'Capital Improvement'
  | 'ESG Retrofit'
  | 'Smart Building Rollout'
  | 'Maintenance Upgrade'
  | 'Custom';

export interface Organization {
  id: string;
  name: string;
}

export interface Portfolio {
  id: string;
  organizationId: string;
  name: string;
}

export interface PropertyDevelopment {
  id: ProjectCommandPropertyId;
  portfolioId: string;
  name: string;
  type: 'Residential Tower' | 'Villa Community' | 'Mixed-use' | 'Commercial Building' | 'Master Community' | string;
  location: string;
  buildings: number;
  units: number;
  size?: string;
  status: 'active' | 'planned' | 'handover' | 'warranty';
}

export interface ProjectCommandProject {
  id: string;
  name: string;
  organizationId: string;
  portfolioId: string;
  propertyId: ProjectCommandPropertyId;
  projectType: ProjectDeliveryType;
  developer: string;
  location: string;
  type: string;
  floors: number;
  contractValue: number;
  startDate: string;
  targetHandover: string;
  status: 'on-track' | 'monitor' | 'critical';
  completion: number;
  budgetUsed: number;
  daysToHandover: number;
  mainContractor: string;
  plannedValue: number;
  actualCost: number;
  earnedValue: number;
  cpi: number;
  spi: number;
  costVariance: number;
  scheduleVariance: number;
  floatRemaining: number;
  healthScore: number;
  healthStatus: ProjectHealthStatus;
  forecastCompletion: string;
  forecastCost: number;
}

export type ProjectCommandAIContent = Omit<typeof lawnzAiContent, 'healthScore'> & {
  healthScore: Omit<typeof lawnzAiContent.healthScore, 'status'> & { status: ProjectHealthStatus };
};

export type ProjectCostSeries = typeof lawnzCostSeries;
export type ProjectEvmSummary = typeof lawnzEvmSummary;
export type ProjectMilestones = typeof lawnzMilestones;

export interface ProjectCommandDataset {
  id: string;
  selectorLabel: string;
  organization: Organization;
  portfolio: Portfolio;
  property: PropertyDevelopment;
  project: ProjectCommandProject;
  phases: Phase[];
  costSeries: ProjectCostSeries;
  evmSummary: ProjectEvmSummary;
  risks: Risk[];
  milestones: ProjectMilestones;
  aiContent: ProjectCommandAIContent;
}

export const projectCommandOrganizations: Organization[] = [
  { id: 'developmentx', name: 'DevelopmentX' },
];

export const projectCommandPortfolios: Portfolio[] = [
  { id: 'sobha-realty-portfolio', organizationId: 'developmentx', name: 'Sobha Realty Portfolio' },
];

export const projectCommandProperties: PropertyDevelopment[] = [
  {
    id: 'sobha-pilot-tower-property',
    portfolioId: 'sobha-realty-portfolio',
    name: 'Sobha Pilot Tower',
    type: 'Residential Tower',
    location: 'Dubai',
    buildings: 1,
    units: 680,
    size: '102 floors',
    status: 'active',
  },
  {
    id: 'sobha-hartland-property',
    portfolioId: 'sobha-realty-portfolio',
    name: 'Sobha Hartland Community',
    type: 'Master Community',
    location: 'Dubai',
    buildings: 6,
    units: 1064,
    size: 'multi-tower community',
    status: 'active',
  },
  {
    id: 'sobha-handover-tower-property',
    portfolioId: 'sobha-realty-portfolio',
    name: 'Sobha Handover Tower',
    type: 'Residential Tower',
    location: 'Dubai',
    buildings: 1,
    units: 412,
    size: '34 floors',
    status: 'handover',
  },
];

export const defaultProjectCommandPropertyId: ProjectCommandPropertyId = 'sobha-pilot-tower-property';

function hierarchyFor(propertyId: ProjectCommandPropertyId) {
  const property = projectCommandProperties.find(item => item.id === propertyId) ?? projectCommandProperties[0];
  const portfolio = projectCommandPortfolios.find(item => item.id === property.portfolioId) ?? projectCommandPortfolios[0];
  const organization = projectCommandOrganizations.find(item => item.id === portfolio.organizationId) ?? projectCommandOrganizations[0];
  return { organization, portfolio, property };
}

function scaleNumber(value: number | null, factor: number) {
  return value === null ? null : Math.round(value * factor);
}

function scaleCostSeries(factor: number): ProjectCostSeries {
  return {
    ...lawnzCostSeries,
    planned: lawnzCostSeries.planned.map(value => scaleNumber(value, factor) as number),
    actual: lawnzCostSeries.actual.map(value => scaleNumber(value, factor)),
    earnedValue: lawnzCostSeries.earnedValue.map(value => scaleNumber(value, factor)),
    forecast: lawnzCostSeries.forecast.map(value => scaleNumber(value, factor)),
  };
}

function updatePhases(completions: Record<string, number>, annotations: Record<string, string>): Phase[] {
  return lawnzPhases.map(phase => ({
    ...phase,
    completePct: completions[phase.id] ?? phase.completePct,
    aiAnnotation: annotations[phase.id] ?? phase.aiAnnotation,
    subTasks: phase.subTasks?.map(task => ({
      ...task,
      completePct: Math.min(100, Math.max(0, Math.round((completions[phase.id] ?? phase.completePct) * (task.completePct === 100 ? 1 : 0.65)))),
    })),
  }));
}

function updateMilestones(prefix: string, dayShift: number): ProjectMilestones {
  return lawnzMilestones.map((milestone, index) => ({
    ...milestone,
    id: `${prefix}-${milestone.id}`,
    daysRemaining: Math.max(2, milestone.daysRemaining + dayShift + index * 3),
  }));
}

function updateRisks(prefix: string, titles: string[], owner = 'PM Team'): Risk[] {
  return lawnzRisks.map((risk, index) => ({
    ...risk,
    id: `${prefix}-${risk.id}`,
    title: titles[index] ?? risk.title,
    owner: index % 3 === 0 ? owner : risk.owner,
  }));
}

const lawnzDataset: ProjectCommandDataset = {
  id: 'sobha-hartland-main-construction',
  selectorLabel: 'Sobha Hartland Community - Main Construction',
  ...hierarchyFor('sobha-hartland-property'),
  project: {
    ...lawnzProject,
    name: 'Main Construction',
    organizationId: 'developmentx',
    portfolioId: 'sobha-realty-portfolio',
    propertyId: 'sobha-hartland-property',
    projectType: 'Main Construction',
    developer: 'Sobha Realty',
    location: 'Dubai',
    type: 'multi-tower residential community',
    floors: 48,
    mainContractor: 'Sobha Construction',
    healthStatus: lawnzProject.healthStatus,
    status: 'on-track',
  },
  phases: lawnzPhases,
  costSeries: lawnzCostSeries,
  evmSummary: lawnzEvmSummary,
  risks: lawnzRisks,
  milestones: lawnzMilestones,
  aiContent: lawnzAiContent,
};

const bayzProject: ProjectCommandProject = {
  id: 'sobha-pilot-tower',
  name: 'Main Construction',
  organizationId: 'developmentx',
  portfolioId: 'sobha-realty-portfolio',
  propertyId: 'sobha-pilot-tower-property',
  projectType: 'Main Construction',
  developer: 'Sobha Realty',
  location: 'Dubai',
  type: '102-floor residential tower',
  floors: 102,
  contractValue: 420_000_000,
  startDate: '2024-06-03',
  targetHandover: '2026-08-12',
  status: 'on-track',
  completion: 28,
  budgetUsed: 39,
  daysToHandover: 420,
  mainContractor: 'Sobha Construction',
  plannedValue: 166_000_000,
  actualCost: 164_000_000,
  earnedValue: 159_000_000,
  cpi: 0.97,
  spi: 0.96,
  costVariance: -5_000_000,
  scheduleVariance: -7_000_000,
  floatRemaining: 34,
  healthScore: 78,
  healthStatus: 'good',
  forecastCompletion: '2026-08-12',
  forecastCost: 420_000_000,
};

const bayzAiContent: ProjectCommandAIContent = {
  ...lawnzAiContent,
  healthScore: {
    ...lawnzAiContent.healthScore,
    score: 78,
    status: 'good',
    topThreat: 'Sobha Pilot Tower baseline is stable but sensitive to facade procurement, crane productivity, authority approvals, and evidence quality.',
    recommendedAction: 'Keep the baseline live: simulate project events, watch control metrics recalculate, and queue manager recovery actions before risk becomes critical.',
    scoreBreakdown: { programme: 78, cost: 76, quality: 82, risk: 74, contractor: 80 },
    forecast30d: { completion: 35, spend: 168, newRisks: 3, sparkline: [28, 29.1, 30.4, 31.6, 32.4, 33.1, 33.8, 34.2, 34.7, 35] },
  },
  topDecisions: [
    { rank: 1, title: 'Resequence tower crane utilization', impact: 'Protects 16 days of superstructure float and reduces concurrent lift clashes', urgency: 'critical', deadline: '6 May 2026' },
    { rank: 2, title: 'Release facade long-lead procurement', impact: 'Avoids a Q3 envelope delay and stabilises fit-out start dates', urgency: 'high', deadline: '10 May 2026' },
    { rank: 3, title: 'Approve night-shift concrete pour window', impact: 'Recovers 9 days without adding a second tower crane', urgency: 'high', deadline: '14 May 2026' },
    { rank: 4, title: 'Freeze podium MEP coordination model', impact: 'Prevents rework across retail, parking and plantroom zones', urgency: 'medium', deadline: '20 May 2026' },
    { rank: 5, title: 'Lock escalation reserve for steel package', impact: 'Caps cost exposure before the next procurement gate', urgency: 'medium', deadline: '24 May 2026' },
  ],
  programmeInsights: {
    ...lawnzAiContent.programmeInsights,
    delayProbabilities: { design: 8, enabling: 5, substructure: 34, superstructure: 63, mep: 49, fitout: 57, handover: 44 },
    criticalPathNarrative: 'The critical path is now driven by core-wall progress, crane availability, facade procurement and MEP riser coordination. The schedule is recoverable, but only if the vertical logistics bottleneck is removed before Level 24.',
    baselineVariance: { substructure: -4, superstructure: -14, mep: -5, fitout: 0 },
    rescheduleSuggestion: 'A combined crane resequencing and night-pour plan can recover 11-14 days by the end of June. Estimated acceleration cost: AED 620,000.',
  },
  costInsights: {
    ...lawnzAiContent.costInsights,
    narrative: 'Sobha Pilot Tower is trending 10.0% above contract value, driven by steel escalation, crane productivity loss and early facade package variance. At CPI 0.81, AI projects AED 462M at completion against a contract value of AED 420M.',
    eacConfidence: { p10: 446, p50: 462, p90: 488 },
    topCostDrivers: [
      { item: 'Steel reinforcement escalation', value: 11.8, status: 'unabsorbed' },
      { item: 'Tower crane productivity loss', value: 7.4, status: 'at-risk' },
      { item: 'Facade system procurement variance', value: 6.9, status: 'forecast' },
      { item: 'Night pour acceleration', value: 3.2, status: 'pending' },
      { item: 'Podium MEP coordination rework', value: 2.6, status: 'at-risk' },
    ],
    changeOrders: [
      { id: 'VO-31', title: 'Facade bracket redesign - high zone', value: 4_800_000, status: 'pending' },
      { id: 'VO-32', title: 'Additional crane overtime allowance', value: 2_900_000, status: 'pending' },
      { id: 'VO-33', title: 'Podium MEP coordination package', value: 1_700_000, status: 'approved' },
      { id: 'VO-34', title: 'Concrete mix adjustment for summer pours', value: 1_100_000, status: 'pending' },
      { id: 'VO-35', title: 'Temporary works strengthening', value: 820_000, status: 'approved' },
    ],
    cashflowForecast: { labels: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan-27'], income: [28, 30, 32, 34, 36, 32, 28, 24, 18], outflow: [36, 38, 40, 39, 38, 34, 30, 25, 20] },
  },
  riskInsights: {
    ...lawnzAiContent.riskInsights,
    earlyWarnings: [
      'Crane hook time utilization exceeded 92% for 12 consecutive workdays, which leaves no buffer for weather or inspection interruptions.',
      'Facade vendor responses are averaging 9.5 days against a 5-day target. This is the leading indicator for an envelope delay.',
      'Concrete night-pour approvals are not yet synchronized with site logistics, creating a recurring stop-start pattern.',
    ],
    monteCarlo: { bins: [{ label: 'Jun-26', probability: 6 }, { label: 'Jul-26', probability: 16 }, { label: 'Aug-26', probability: 34 }, { label: 'Sep-26', probability: 24 }, { label: 'Oct-26', probability: 13 }, { label: 'Nov-26', probability: 5 }, { label: 'Dec-26+', probability: 2 }], p50: 'Aug-26', p80: 'Oct-26' },
    riskTrend: { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'], critical: [1, 1, 2, 2, 2], high: [3, 4, 4, 5, 6], medium: [4, 5, 5, 6, 6], low: [4, 4, 3, 3, 3] },
  },
  scenarios: {
    optimistic: { label: 'Optimistic', probability: 16, completionDate: '2026-06-24', finalCost: 438_000_000, assumptions: ['Crane resequencing approved by 6 May', 'Facade package released with no redesign impact', 'Night pours recover 10 days', 'Steel prices stabilise through Q3'], programmeSlip: 0 },
    base: { label: 'Base Case', probability: 56, completionDate: '2026-08-12', finalCost: 462_000_000, assumptions: ['Crane constraint continues through Level 28', 'Facade procurement slips 3 weeks', 'Acceleration is partially approved', 'Steel escalation absorbed at 8%'], programmeSlip: 43 },
    pessimistic: { label: 'Pessimistic', probability: 28, completionDate: '2026-11-03', finalCost: 488_000_000, assumptions: ['Facade redesign requires resubmission', 'Crane availability constrains core-wall cycle', 'MEP riser coordination rework grows', 'Escalation reserve is consumed'], programmeSlip: 126 },
  },
  askAI: {
    queries: [
      { question: 'What is the biggest risk to our handover date?', answer: 'For Sobha Pilot Tower, the biggest handover risk is tower crane logistics. Hook time is nearly saturated, so any interruption cascades into superstructure, facade and MEP riser work. In the base case, this moves completion from 30 Jun to 12 Aug 2026.', sources: ['Crane Utilization Log', 'Programme Rev 2', 'Procurement Register'] },
      { question: 'How much will this project cost at completion?', answer: 'AI currently forecasts AED 462M at completion against a contract value of AED 420M. The cost pressure is mostly from steel escalation, crane productivity loss and facade package variance. The pessimistic case reaches AED 488M if facade redesign is triggered.', sources: ['EVM Report Apr 2026', 'Package Procurement Log', 'Variation Register'] },
      { question: 'What would happen if the MEP clashes take another 3 weeks to resolve?', answer: 'A further 3-week MEP coordination delay would push riser rough-in and podium plantroom works into the facade start window. The programme impact is roughly 24-30 days unless weekend coordination shifts are approved.', sources: ['MEP Coordination Model', 'Programme Rev 2', 'AI Delay Simulation'] },
    ],
  },
};

const verdanaProject: ProjectCommandProject = {
  id: 'sobha-handover-tower',
  name: 'Main Construction',
  organizationId: 'developmentx',
  portfolioId: 'sobha-realty-portfolio',
  propertyId: 'sobha-handover-tower-property',
  projectType: 'Main Construction',
  developer: 'Sobha Realty',
  location: 'Dubai',
  type: '34-floor residential tower',
  floors: 34,
  contractValue: 190_000_000,
  startDate: '2023-11-20',
  targetHandover: '2025-03-31',
  status: 'on-track',
  completion: 61,
  budgetUsed: 55,
  daysToHandover: 190,
  mainContractor: 'Sobha Construction',
  plannedValue: 118_000_000,
  actualCost: 116_000_000,
  earnedValue: 121_000_000,
  cpi: 1.04,
  spi: 1.03,
  costVariance: 5_000_000,
  scheduleVariance: 3_000_000,
  floatRemaining: 38,
  healthScore: 84,
  healthStatus: 'good',
  forecastCompletion: '2025-03-18',
  forecastCost: 188_000_000,
};

const verdanaAiContent: ProjectCommandAIContent = {
  ...lawnzAiContent,
  healthScore: {
    ...lawnzAiContent.healthScore,
    score: 84,
    status: 'good',
    topThreat: 'Authority inspection sequencing is the only meaningful handover risk. Sobha Handover Tower progress is ahead of baseline, but late civil defence booking could consume float.',
    recommendedAction: 'Book civil defence and municipality inspections now, freeze snagging ownership, and protect the facade cleaning sequence.',
    scoreBreakdown: { programme: 86, cost: 88, quality: 82, risk: 80, contractor: 84 },
    forecast30d: { completion: 68, spend: 132, newRisks: 1, sparkline: [61, 62.2, 63.1, 64.4, 65.2, 66.1, 66.7, 67.2, 67.7, 68] },
  },
  topDecisions: [
    { rank: 1, title: 'Pre-book authority inspection windows', impact: 'Protects 12 days of handover float and avoids late-stage idle time', urgency: 'high', deadline: '3 May 2026' },
    { rank: 2, title: 'Freeze snagging owner matrix', impact: 'Keeps unit closure velocity above 42 units per week', urgency: 'high', deadline: '8 May 2026' },
    { rank: 3, title: 'Release facade cleaning sequence', impact: 'Prevents access conflict with balcony finishing teams', urgency: 'medium', deadline: '12 May 2026' },
    { rank: 4, title: 'Close lift commissioning checklist', impact: 'Unlocks final inspection readiness for all residential floors', urgency: 'medium', deadline: '18 May 2026' },
    { rank: 5, title: 'Reconfirm fire alarm integration test', impact: 'Reduces risk of re-test during practical completion', urgency: 'medium', deadline: '24 May 2026' },
  ],
  programmeInsights: {
    ...lawnzAiContent.programmeInsights,
    delayProbabilities: { design: 0, enabling: 0, substructure: 4, superstructure: 8, mep: 24, fitout: 29, handover: 34 },
    criticalPathNarrative: 'Sobha Handover Tower is ahead of the current baseline. The critical path now sits in inspections, lift commissioning, final MEP testing and snag closure rather than core construction.',
    baselineVariance: { substructure: 6, superstructure: 8, mep: 4, fitout: 3 },
    rescheduleSuggestion: 'Keeping inspection bookings two weeks ahead of site readiness can preserve 30+ days of float and bring practical completion forward by up to 13 days.',
  },
  costInsights: {
    ...lawnzAiContent.costInsights,
    narrative: 'Sobha Handover Tower is tracking below budget. CPI is 1.04 and SPI is 1.03, with AI forecasting AED 188M at completion against a contract value of AED 190M. Current exposure is concentrated in commissioning and authority re-test allowances.',
    eacConfidence: { p10: 184, p50: 188, p90: 196 },
    topCostDrivers: [
      { item: 'Lift commissioning allowance', value: 1.1, status: 'forecast' },
      { item: 'Facade cleaning access sequence', value: 0.8, status: 'at-risk' },
      { item: 'Civil defence re-test provision', value: 0.7, status: 'pending' },
      { item: 'Snagging labour acceleration', value: 0.5, status: 'forecast' },
      { item: 'Authority documentation support', value: 0.3, status: 'pending' },
    ],
    changeOrders: [
      { id: 'VO-12', title: 'Lift commissioning support', value: 720_000, status: 'pending' },
      { id: 'VO-13', title: 'Facade access re-sequencing', value: 410_000, status: 'approved' },
      { id: 'VO-14', title: 'Civil defence documentation package', value: 280_000, status: 'pending' },
      { id: 'VO-15', title: 'Additional snagging labour', value: 530_000, status: 'approved' },
      { id: 'VO-16', title: 'Fire alarm integration re-test reserve', value: 260_000, status: 'pending' },
    ],
    cashflowForecast: { labels: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan-25'], income: [18, 16, 14, 12, 10, 8, 7, 5, 3], outflow: [15, 14, 13, 11, 9, 7, 6, 4, 2] },
  },
  riskInsights: {
    ...lawnzAiContent.riskInsights,
    earlyWarnings: [
      'Civil defence inspection slots are tightening across JVC. Booking later than 14 days ahead introduces a measurable handover risk.',
      'Lift commissioning documentation has two unresolved comments, both low cost but high schedule sensitivity.',
      'Snag closure velocity is above target, but balcony access conflicts could slow facade cleaning in the final month.',
    ],
    monteCarlo: { bins: [{ label: 'Feb-25', probability: 14 }, { label: 'Mar-25', probability: 42 }, { label: 'Apr-25', probability: 28 }, { label: 'May-25', probability: 10 }, { label: 'Jun-25', probability: 4 }, { label: 'Jul-25', probability: 1 }, { label: 'Aug-25+', probability: 1 }], p50: 'Mar-25', p80: 'Apr-25' },
    riskTrend: { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'], critical: [0, 0, 0, 0, 0], high: [2, 2, 1, 1, 1], medium: [4, 4, 3, 3, 3], low: [5, 5, 6, 6, 7] },
  },
  scenarios: {
    optimistic: { label: 'Optimistic', probability: 24, completionDate: '2025-03-06', finalCost: 184_000_000, assumptions: ['Inspection slots confirmed early', 'Snag closure stays above target', 'Lift commissioning passes first time', 'No facade access conflicts'], programmeSlip: 0 },
    base: { label: 'Base Case', probability: 58, completionDate: '2025-03-18', finalCost: 188_000_000, assumptions: ['Authority inspections booked within target', 'Minor commissioning comments cleared', 'Snagging team remains stable', 'Cost reserve remains unused'], programmeSlip: 0 },
    pessimistic: { label: 'Pessimistic', probability: 18, completionDate: '2025-04-22', finalCost: 196_000_000, assumptions: ['Inspection booking slips by 3 weeks', 'Fire alarm integration requires re-test', 'Balcony access conflict slows facade cleaning', 'Snagging overtime extends'], programmeSlip: 22 },
  },
  askAI: {
    queries: [
      { question: 'What is the biggest risk to our handover date?', answer: 'For Sobha Handover Tower, the biggest handover risk is authority inspection sequencing. Construction is ahead of baseline, but if civil defence and municipality inspections are booked late, that administrative delay can consume most of the remaining float.', sources: ['Inspection Readiness Log', 'Programme Rev 5', 'Handover Tracker'] },
      { question: 'How much will this project cost at completion?', answer: 'Sobha Handover Tower is forecast at AED 188M against a contract value of AED 190M. CPI is 1.04, so the project is currently performing better than budget. The main watch items are lift commissioning support and possible civil defence re-test costs.', sources: ['EVM Report Apr 2026', 'Cost Report #11', 'VO Pipeline'] },
      { question: 'What would happen if the MEP clashes take another 3 weeks to resolve?', answer: 'MEP clash risk is largely closed on Sobha Handover Tower. A new 3-week delay would mostly affect testing and commissioning rather than rough-in. The likely impact is 10-14 days unless inspection bookings are moved at the same time.', sources: ['Commissioning Tracker', 'MEP Closure Log', 'Programme Rev 5'] },
    ],
  },
};

function projectVariant(
  source: ProjectCommandDataset,
  overrides: {
    id: string;
    selectorLabel: string;
    name: string;
    projectType: ProjectDeliveryType;
    contractValue: number;
    completion: number;
    status: ProjectCommandProject['status'];
    healthScore: number;
    forecastCost: number;
    targetHandover: string;
    budgetUsed?: number;
    cpi?: number;
    spi?: number;
    costVariance?: number;
    scheduleVariance?: number;
    floatRemaining?: number;
    mainContractor?: string;
  },
): ProjectCommandDataset {
  const scale = overrides.contractValue / lawnzProject.contractValue;
  const plannedValue = Math.round(overrides.contractValue * Math.max(0.12, overrides.completion / 100) * 0.9);
  const actualCost = Math.round(overrides.contractValue * ((overrides.budgetUsed ?? Math.max(8, overrides.completion + 12)) / 100));
  const earnedValue = Math.round(overrides.contractValue * (overrides.completion / 100) * (overrides.cpi ?? 0.96));
  return {
    ...source,
    id: overrides.id,
    selectorLabel: overrides.selectorLabel,
    project: {
      ...source.project,
      id: overrides.id,
      name: overrides.name,
      projectType: overrides.projectType,
      contractValue: overrides.contractValue,
      targetHandover: overrides.targetHandover,
      status: overrides.status,
      completion: overrides.completion,
      budgetUsed: overrides.budgetUsed ?? Math.max(8, overrides.completion + 12),
      plannedValue,
      actualCost,
      earnedValue,
      cpi: overrides.cpi ?? 0.96,
      spi: overrides.spi ?? 0.97,
      costVariance: overrides.costVariance ?? Math.round(overrides.forecastCost - overrides.contractValue) * -0.3,
      scheduleVariance: overrides.scheduleVariance ?? -Math.round(overrides.contractValue * 0.025),
      floatRemaining: overrides.floatRemaining ?? 28,
      mainContractor: overrides.mainContractor ?? source.project.mainContractor,
      healthScore: overrides.healthScore,
      healthStatus: overrides.healthScore >= 75 ? 'good' : overrides.healthScore >= 55 ? 'monitor' : 'critical',
      forecastCost: overrides.forecastCost,
    },
    phases: updatePhases(
      overrides.projectType === 'Main Construction'
        ? { design: 100, enabling: 100, substructure: overrides.completion, superstructure: Math.max(0, overrides.completion - 12), mep: Math.max(0, overrides.completion - 24), fitout: 0, handover: 0 }
        : { design: Math.min(100, overrides.completion + 10), enabling: overrides.completion, substructure: overrides.completion, superstructure: Math.max(0, overrides.completion - 10), mep: Math.max(0, overrides.completion - 15), fitout: Math.max(0, overrides.completion - 20), handover: Math.max(0, overrides.completion - 25) },
      { substructure: `${overrides.completion}% - ${overrides.projectType}`, mep: 'Project-specific controls' },
    ),
    costSeries: scaleCostSeries(scale),
    evmSummary: {
      pv: Math.round(plannedValue / 1_000_000),
      ac: Math.round(actualCost / 1_000_000),
      ev: Math.round(earnedValue / 1_000_000),
      cpi: overrides.cpi ?? 0.96,
      spi: overrides.spi ?? 0.97,
      cv: Math.round((earnedValue - actualCost) / 1_000_000),
      sv: Math.round((earnedValue - plannedValue) / 1_000_000),
      eac: Math.round(overrides.forecastCost / 1_000_000),
      etc: Math.round(Math.max(overrides.forecastCost - actualCost, 0) / 1_000_000),
      vac: Math.round((overrides.contractValue - overrides.forecastCost) / 1_000_000),
      tcpi: overrides.forecastCost > overrides.contractValue ? 1.05 : 0.95,
    },
    aiContent: {
      ...source.aiContent,
      healthScore: {
        ...source.aiContent.healthScore,
        score: overrides.healthScore,
        status: overrides.healthScore >= 75 ? 'good' : overrides.healthScore >= 55 ? 'monitor' : 'critical',
        topThreat: `${overrides.name} is controlled separately from the permanent property budget. The main risk is whether package commitments and actuals stay aligned with the approved project baseline.`,
        recommendedAction: `Review ${overrides.projectType.toLowerCase()} packages, pending variations, vendor claims, and forecast exposure before approving the next project control update.`,
      },
    },
  };
}

const bayzHandoverDataset = projectVariant(
  {
    id: 'sobha-pilot-tower',
    selectorLabel: 'Sobha Pilot Tower - Main Construction',
    ...hierarchyFor('sobha-pilot-tower-property'),
    project: bayzProject,
    phases: updatePhases({ design: 100, enabling: 100, substructure: 52, superstructure: 18, mep: 6, fitout: 0, handover: 0 }, { substructure: '52% - piling recovery', superstructure: 'Crane bottleneck', mep: 'Riser model pending' }),
    costSeries: scaleCostSeries(1.56),
    evmSummary: { pv: 166, ac: 164, ev: 159, cpi: 0.97, spi: 0.96, cv: -5, sv: -7, eac: 420, etc: 256, vac: 0, tcpi: 1 },
    risks: updateRisks('sobha', ['Tower crane availability constraint'], 'Construction Director'),
    milestones: updateMilestones('sobha', 80),
    aiContent: bayzAiContent,
  },
  {
    id: 'sobha-pilot-tower-handover-snagging',
    selectorLabel: 'Sobha Pilot Tower - Handover & Snagging Programme',
    name: 'Handover & Snagging Programme',
    projectType: 'Handover & Snagging',
    contractValue: 18_000_000,
    completion: 12,
    status: 'monitor',
    healthScore: 64,
    forecastCost: 20_400_000,
    targetHandover: '2026-10-15',
    budgetUsed: 18,
    cpi: 0.88,
    spi: 0.91,
    costVariance: -1_800_000,
    scheduleVariance: -1_200_000,
    floatRemaining: 18,
    mainContractor: 'Handover Controls Team',
  },
);

const bayzSmartAccessDataset = projectVariant(bayzHandoverDataset, {
  id: 'sobha-pilot-tower-smart-access',
  selectorLabel: 'Sobha Pilot Tower - Smart Access Upgrade',
  name: 'Smart Access Upgrade',
  projectType: 'Smart Building Rollout',
  contractValue: 6_500_000,
  completion: 0,
  status: 'monitor',
  healthScore: 70,
  forecastCost: 6_800_000,
  targetHandover: '2026-12-20',
  budgetUsed: 4,
  cpi: 0.98,
  spi: 0.96,
  costVariance: -260_000,
  scheduleVariance: -180_000,
  floatRemaining: 42,
  mainContractor: 'Smart Access Integrator',
});

const bayzWarrantyDataset = projectVariant(bayzHandoverDataset, {
  id: 'sobha-pilot-tower-dlp-remediation',
  selectorLabel: 'Sobha Pilot Tower - Warranty / DLP Remediation',
  name: 'Warranty / DLP Remediation',
  projectType: 'Warranty / DLP Remediation',
  contractValue: 9_000_000,
  completion: 0,
  status: 'monitor',
  healthScore: 72,
  forecastCost: 9_600_000,
  targetHandover: '2027-06-30',
  budgetUsed: 2,
  cpi: 1,
  spi: 1,
  costVariance: 0,
  scheduleVariance: 0,
  floatRemaining: 55,
  mainContractor: 'DLP Response Team',
});

const lawnzLandscapeDataset = projectVariant(lawnzDataset, {
  id: 'sobha-hartland-landscape-enhancement',
  selectorLabel: 'Sobha Hartland Community - Landscape Enhancement',
  name: 'Landscape Enhancement',
  projectType: 'Capital Improvement',
  contractValue: 12_000_000,
  completion: 0,
  status: 'monitor',
  healthScore: 76,
  forecastCost: 12_400_000,
  targetHandover: '2026-11-30',
  budgetUsed: 3,
  cpi: 0.98,
  spi: 0.99,
  costVariance: -200_000,
  scheduleVariance: -120_000,
  floatRemaining: 45,
  mainContractor: 'Landscape Contractor',
});

const lawnzWarrantyDataset = projectVariant(lawnzDataset, {
  id: 'sobha-hartland-warranty-control',
  selectorLabel: 'Sobha Hartland Community - Warranty Control Programme',
  name: 'Warranty Control Programme',
  projectType: 'Warranty / DLP Remediation',
  contractValue: 7_000_000,
  completion: 0,
  status: 'monitor',
  healthScore: 74,
  forecastCost: 7_200_000,
  targetHandover: '2027-04-30',
  budgetUsed: 2,
  cpi: 1,
  spi: 1,
  costVariance: 0,
  scheduleVariance: 0,
  floatRemaining: 62,
  mainContractor: 'Warranty Control Team',
});

export const projectCommandDatasets = {
  'sobha-hartland-main-construction': lawnzDataset,
  'sobha-pilot-tower': {
    id: 'sobha-pilot-tower',
    selectorLabel: 'Sobha Pilot Tower - Main Construction',
    ...hierarchyFor('sobha-pilot-tower-property'),
    project: bayzProject,
    phases: updatePhases({ design: 100, enabling: 100, substructure: 52, superstructure: 18, mep: 6, fitout: 0, handover: 0 }, { substructure: '52% - piling recovery', superstructure: 'Crane bottleneck', mep: 'Riser model pending' }),
    costSeries: scaleCostSeries(1.56),
    evmSummary: { pv: 166, ac: 164, ev: 159, cpi: 0.97, spi: 0.96, cv: -5, sv: -7, eac: 420, etc: 256, vac: 0, tcpi: 1 },
    risks: updateRisks('sobha', ['Tower crane availability constraint', 'Facade procurement lead time - high zone', 'Steel reinforcement escalation', 'MEP riser coordination freeze delayed', 'Night-pour permit sequence not approved', 'Podium plantroom coordination issue', 'Core wall cycle time above target', 'Neighbouring tower logistics conflict', 'Concrete cooling plan during peak heat', 'Temporary works approval backlog', 'High-zone safety lift plan review', 'Subcontractor productivity variance'], 'Construction Director'),
    milestones: updateMilestones('sobha', 80),
    aiContent: bayzAiContent,
  },
  'sobha-handover-tower': {
    id: 'sobha-handover-tower',
    selectorLabel: 'Sobha Handover Tower - Main Construction',
    ...hierarchyFor('sobha-handover-tower-property'),
    project: verdanaProject,
    phases: updatePhases({ design: 100, enabling: 100, substructure: 100, superstructure: 100, mep: 72, fitout: 58, handover: 12 }, { mep: 'T&C on track', fitout: 'Snag velocity ahead', handover: 'Inspection slots needed' }),
    costSeries: scaleCostSeries(0.67),
    evmSummary: { pv: 118, ac: 116, ev: 121, cpi: 1.04, spi: 1.03, cv: 5, sv: 3, eac: 188, etc: 72, vac: 2, tcpi: 0.96 },
    risks: updateRisks('sobha-handover', ['Civil defence inspection slot availability', 'Lift commissioning document comments', 'Facade cleaning access conflict', 'Fire alarm integration re-test', 'Snagging closeout velocity slowdown', 'Authority document compilation delay', 'Balcony finishing access overlap', 'Common area handover checklist gap', 'Final DEWA inspection readiness', 'Unit owner walkthrough backlog', 'Testing certificate delay', 'Practical completion documentation risk'], 'Handover Manager'),
    milestones: updateMilestones('sobha-handover', -22),
    aiContent: verdanaAiContent,
  },
  'sobha-pilot-tower-handover-snagging': bayzHandoverDataset,
  'sobha-pilot-tower-smart-access': bayzSmartAccessDataset,
  'sobha-pilot-tower-dlp-remediation': bayzWarrantyDataset,
  'sobha-hartland-landscape-enhancement': lawnzLandscapeDataset,
  'sobha-hartland-warranty-control': lawnzWarrantyDataset,
} satisfies Record<string, ProjectCommandDataset>;

export const defaultProjectCommandProjectId: ProjectCommandProjectId = 'sobha-pilot-tower';

export const projectCommandProjectOptions = Object.values(projectCommandDatasets).map(dataset => ({
  id: dataset.id as ProjectCommandProjectId,
  label: dataset.selectorLabel,
  propertyId: dataset.property.id,
  propertyName: dataset.property.name,
  portfolioName: dataset.portfolio.name,
  projectType: dataset.project.projectType,
}));

export const projectCommandPropertyOptions = projectCommandProperties.map(property => {
  const portfolio = projectCommandPortfolios.find(item => item.id === property.portfolioId);
  const organization = projectCommandOrganizations.find(item => item.id === portfolio?.organizationId);
  return {
    id: property.id,
    label: property.name,
    portfolioId: property.portfolioId,
    portfolioName: portfolio?.name ?? 'Portfolio',
    organizationName: organization?.name ?? 'Organization',
  };
});
