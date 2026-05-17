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
import { sampleBayz102Extraction, type ExtractedProjectContext } from './projectExtractionDemoData';

export interface ProjectContextInput {
  fileName?: string;
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
  return JSON.parse(JSON.stringify(sampleBayz102Extraction)) as ExtractedProjectContext;
}

export async function extractProjectContext(input: ProjectContextInput): Promise<ExtractedProjectContext> {
  const extracted = cloneSampleExtraction();

  if (input.useSample) {
    extracted.sourceName = 'Sample Bayz 102 LOA / Project Summary.pdf';
    extracted.sourceType = 'sample-document';
    return extracted;
  }

  if (input.fileName) {
    extracted.sourceName = input.fileName;
    extracted.sourceType = 'uploaded-file';
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

  extracted.sourceName = 'Sample Bayz 102 LOA / Project Summary.pdf';
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
      id: `bayz-created-risk-${index + 1}`,
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
    id: `bayz-created-milestone-${index + 1}`,
    name,
    daysRemaining: days[index] ?? 90 + index * 18,
    color: colors[index] ?? '#7A94B4',
    critical: index >= 1,
  }));
}

function buildAiContent(extracted: ExtractedProjectContext, baseline: GeneratedProjectControlBaseline): ProjectCommandAIContent {
  const source = projectCommandDatasets['bayz-102'].aiContent;
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
    id: 'bayz-102-main-construction-demo',
    name: extracted.project.name.value,
    organizationId: 'developmentx',
    portfolioId: 'danube-properties-portfolio',
    propertyId: 'bayz-102-property',
    projectType: 'Main Construction',
    developer: 'Danube Properties Portfolio',
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
  const portfolio = projectCommandPortfolios.find(item => item.id === 'danube-properties-portfolio') ?? projectCommandPortfolios[0];
  const sourceProperty = projectCommandProperties.find(item => item.id === 'bayz-102-property') ?? projectCommandProperties[0];
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
