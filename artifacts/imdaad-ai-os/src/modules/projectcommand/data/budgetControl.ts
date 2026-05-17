import type { ProjectCommandProject } from './portfolio';

export type ProjectBudget = {
  projectId: string;
  contractValue: number;
  approvedBudget: number;
  currency: string;
  contingency: number;
  baselineDate: string;
  budgetStatus: 'baseline' | 'revised' | 'at-risk';
};

export type BudgetPackage = {
  id: string;
  projectId: string;
  name: string;
  code: string;
  baselineBudget: number;
  approvedChanges: number;
  revisedBudget: number;
  committedCost: number;
  actualCost: number;
  forecastCost: number;
  variance: number;
  linkedProgrammePhase: string;
  linkedVendorIds: string[];
  linkedVendorNames: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  programmeDelayDays: number;
  programmeCostExposure: number;
  recoveryCost: number;
  vendorScore: number;
  openClaims: number;
  disputedAmount: number;
};

export type Commitment = {
  id: string;
  packageId: string;
  vendorId: string;
  vendorName: string;
  contractRef: string;
  committedAmount: number;
  approvedAmount: number;
  pendingAmount: number;
  status: 'awarded' | 'pending' | 'under-review';
};

export type ActualCost = {
  id: string;
  packageId: string;
  source: 'ERP Sync' | 'Invoice Upload' | 'Manual' | 'Vendor Claim' | 'Approved VO';
  amount: number;
  date: string;
  invoiceRef: string;
  status: 'approved' | 'pending' | 'rejected';
};

export type VariationOrder = {
  id: string;
  projectId: string;
  packageId: string;
  title: string;
  vendorName: string;
  amount: number;
  status: 'Draft' | 'Submitted' | 'Under Review' | 'Approved' | 'Rejected' | 'Pending Client Approval';
  reason: string;
  submittedBy: string;
  submittedDate: string;
  approvalImpact: string;
  programmeImpact: string;
  approvalOwner: string;
  decisionDue: string;
  linkedRiskId: string;
};

export type CostRisk = {
  id: string;
  packageId: string;
  title: string;
  exposure: number;
  probability: number;
  expectedImpact: number;
  mitigation: string;
  status: 'open' | 'mitigating' | 'closed';
};

export type CashflowMonth = {
  month: string;
  plannedOutflow: number;
  actualOutflow: number | null;
  forecastOutflow: number;
  plannedIncome: number;
  actualIncome: number | null;
  netPosition: number;
};

export type EarnedValueSnapshot = {
  pv: number;
  ev: number;
  ac: number;
  cpi: number;
  spi: number;
  eac: number;
  tcpi: number;
  costVariance: number;
};

export type BudgetControlData = {
  budget: ProjectBudget;
  packages: BudgetPackage[];
  commitments: Commitment[];
  actualCosts: ActualCost[];
  variations: VariationOrder[];
  risks: CostRisk[];
  cashflow: CashflowMonth[];
  evm: EarnedValueSnapshot;
  lastSync: string;
  sourceHealth: { label: string; status: 'healthy' | 'warning' | 'missing' }[];
  missingDataWarnings: string[];
  aiNarrative: string;
  managerActions: { title: string; detail: string; urgency: 'critical' | 'high' | 'medium' }[];
};

const packageNames = [
  ['preliminaries', 'Preliminaries', 'PC-010'],
  ['substructure', 'Substructure', 'PC-020'],
  ['superstructure', 'Superstructure', 'PC-030'],
  ['facade', 'Facade', 'PC-040'],
  ['mep', 'MEP', 'PC-050'],
  ['fitout', 'Fit-out', 'PC-060'],
  ['testing', 'Testing & Commissioning', 'PC-070'],
  ['handover', 'Handover & Snagging', 'PC-080'],
] as const;

const phaseByPackage: Record<string, string> = {
  preliminaries: 'Design & Approvals',
  substructure: 'Substructure',
  superstructure: 'Superstructure',
  facade: 'Fit-out & Finishing',
  mep: 'MEP Rough-in',
  fitout: 'Fit-out & Finishing',
  testing: 'Handover & Snagging',
  handover: 'Handover & Snagging',
};

const vendorByPackage: Record<string, string[]> = {
  preliminaries: ['Project Controls Office'],
  substructure: ['Sobha Waterproofing', 'Sobha Construction'],
  superstructure: ['Sobha Construction'],
  facade: ['Sobha Facade Systems'],
  mep: ['Sobha MEP Services'],
  fitout: ['Sobha Interiors'],
  testing: ['Sobha Commissioning Authority'],
  handover: ['Sobha Handover Team'],
};

function m(value: number) {
  return value * 1_000_000;
}

function distribute(project: ProjectCommandProject, overrides: Partial<Record<string, number>> = {}) {
  const base = project.contractValue / 1_000_000;
  const distribution: Record<string, number> = {
    preliminaries: 0.08,
    substructure: 0.16,
    superstructure: 0.28,
    facade: 0.14,
    mep: 0.18,
    fitout: 0.1,
    testing: 0.03,
    handover: 0.03,
    ...overrides,
  };
  return Object.fromEntries(Object.entries(distribution).map(([key, ratio]) => [key, Math.round(base * ratio)]));
}

function buildPackages(project: ProjectCommandProject, adjustments: Partial<Record<string, { change: number; committed: number; actual: number; forecast: number; risk: BudgetPackage['riskLevel']; delay: number; exposure: number; vendorScore: number; claims: number; disputed: number }>> = {}): BudgetPackage[] {
  const baseline = distribute(project);
  return packageNames.map(([id, name, code]) => {
    const adj = adjustments[id] ?? {
      change: 0,
      committed: baseline[id] * 0.72,
      actual: baseline[id] * (project.completion / 100) * 0.9,
      forecast: baseline[id],
      risk: 'medium',
      delay: 0,
      exposure: 0,
      vendorScore: 82,
      claims: 0,
      disputed: 0,
    };
    const revised = baseline[id] + adj.change;
    return {
      id,
      projectId: project.id,
      name,
      code,
      baselineBudget: m(baseline[id]),
      approvedChanges: m(adj.change),
      revisedBudget: m(revised),
      committedCost: m(adj.committed),
      actualCost: m(adj.actual),
      forecastCost: m(adj.forecast),
      variance: m(adj.forecast - revised),
      linkedProgrammePhase: phaseByPackage[id],
      linkedVendorIds: vendorByPackage[id].map(v => v.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
      linkedVendorNames: vendorByPackage[id],
      riskLevel: adj.risk,
      programmeDelayDays: adj.delay,
      programmeCostExposure: m(adj.exposure),
      recoveryCost: m(Math.max(0.2, adj.exposure * 0.18)),
      vendorScore: adj.vendorScore,
      openClaims: m(adj.claims),
      disputedAmount: m(adj.disputed),
    };
  });
}

function buildFromProject(project: ProjectCommandProject): BudgetControlData {
  const forecastM = project.forecastCost / 1_000_000;
  const contractM = project.contractValue / 1_000_000;
  const overrunM = Math.max(0, forecastM - contractM);
  const highPressure = project.cpi < 0.9 || overrunM > contractM * 0.06;
  const isSobhaPilot = project.id.includes('sobha-pilot');
  const isSobhaHandover = project.id.includes('sobha-handover');
  const packages = buildPackages(project, {
    substructure: { change: 4.2, committed: contractM * 0.16, actual: contractM * 0.14, forecast: contractM * 0.18, risk: highPressure ? 'critical' : 'high', delay: isSobhaHandover ? 0 : 8, exposure: isSobhaHandover ? 0.8 : 11.8, vendorScore: 72, claims: 4.8, disputed: 1.6 },
    superstructure: { change: isSobhaPilot ? 1.1 : 0.8, committed: contractM * 0.26, actual: contractM * 0.2, forecast: contractM * (isSobhaPilot ? 0.33 : 0.28), risk: highPressure ? 'high' : 'medium', delay: isSobhaPilot ? 14 : 3, exposure: isSobhaPilot ? 18.6 : 3.2, vendorScore: 78, claims: 7.4, disputed: 2.2 },
    facade: { change: isSobhaPilot ? 4.8 : 0.4, committed: contractM * 0.11, actual: contractM * 0.04, forecast: contractM * (isSobhaPilot ? 0.18 : 0.14), risk: isSobhaPilot ? 'high' : 'medium', delay: isSobhaPilot ? 21 : 2, exposure: isSobhaPilot ? 13.7 : 1.4, vendorScore: 69, claims: 4.8, disputed: 3.1 },
    mep: { change: 1.7, committed: contractM * 0.17, actual: contractM * 0.08, forecast: contractM * 0.19, risk: 'high', delay: isSobhaHandover ? 0 : 5, exposure: isSobhaHandover ? 0.7 : 6.4, vendorScore: 76, claims: 2.6, disputed: 0.9 },
  });
  const approvedChanges = packages.reduce((sum, item) => sum + Math.max(0, item.approvedChanges), 0);
  const revisedBudget = project.contractValue + approvedChanges;
  const committed = packages.reduce((sum, item) => sum + item.committedCost, 0);
  const actual = packages.reduce((sum, item) => sum + item.actualCost, 0);
  const pendingVariations = Math.max(m(1.2), overrunM * 1_000_000 * 0.28);
  const contingency = Math.round(project.contractValue * (isSobhaPilot ? 0.08 : 0.07));

  return {
    budget: {
      projectId: project.id,
      contractValue: project.contractValue,
      approvedBudget: project.contractValue,
      currency: 'AED',
      contingency,
      baselineDate: project.startDate,
      budgetStatus: highPressure ? 'at-risk' : 'revised',
    },
    packages,
    commitments: packages.slice(0, 6).map((pkg, index) => ({
      id: `COM-${index + 1}`.padStart(6, '0'),
      packageId: pkg.id,
      vendorId: pkg.linkedVendorIds[0],
      vendorName: pkg.linkedVendorNames[0],
      contractRef: `CN-${project.id.slice(0, 3).toUpperCase()}-${100 + index}`,
      committedAmount: pkg.committedCost,
      approvedAmount: pkg.committedCost * 0.82,
      pendingAmount: pkg.committedCost * 0.18,
      status: index % 4 === 0 ? 'under-review' : 'awarded',
    })),
    actualCosts: packages.slice(0, 6).flatMap((pkg, index) => [
      { id: `AC-${index + 1}A`, packageId: pkg.id, source: index % 2 === 0 ? 'ERP Sync' : 'Invoice Upload', amount: pkg.actualCost * 0.62, date: '2026-05-06', invoiceRef: `INV-${400 + index}`, status: 'approved' },
      { id: `AC-${index + 1}B`, packageId: pkg.id, source: index % 3 === 0 ? 'Vendor Claim' : 'Manual', amount: pkg.actualCost * 0.18, date: '2026-04-29', invoiceRef: `CLM-${210 + index}`, status: index % 3 === 0 ? 'pending' : 'approved' },
    ] as ActualCost[]),
    variations: [
      { id: 'VO-31', projectId: project.id, packageId: 'facade', title: 'Facade bracket redesign - high zone', vendorName: 'Sobha Facade Systems', amount: m(isSobhaPilot ? 4.8 : 1.2), status: 'Under Review', reason: 'Design coordination change', submittedBy: 'Facade Contractor', submittedDate: '2026-04-28', approvalImpact: '+ revised budget', programmeImpact: 'Avoids 9 days of envelope delay', approvalOwner: 'Commercial Manager', decisionDue: '2026-05-10', linkedRiskId: 'r-facade' },
      { id: 'VO-32', projectId: project.id, packageId: 'superstructure', title: 'Additional crane overtime allowance', vendorName: project.mainContractor, amount: m(isSobhaPilot ? 2.9 : 0.8), status: 'Pending Client Approval', reason: 'Acceleration and logistics recovery', submittedBy: project.mainContractor, submittedDate: '2026-05-01', approvalImpact: '+ pending exposure', programmeImpact: 'Recovers 4-7 days', approvalOwner: 'Project Director', decisionDue: '2026-05-12', linkedRiskId: 'r-crane' },
      { id: 'VO-33', projectId: project.id, packageId: 'mep', title: 'Podium MEP coordination package', vendorName: 'Sobha MEP Services', amount: m(1.7), status: 'Approved', reason: 'Clash resolution', submittedBy: 'MEP Contractor', submittedDate: '2026-04-18', approvalImpact: '+ approved changes', programmeImpact: 'Protects rough-in sequence', approvalOwner: 'Commercial Manager', decisionDue: '2026-04-26', linkedRiskId: 'r-mep' },
      { id: 'VO-34', projectId: project.id, packageId: 'superstructure', title: 'Concrete mix adjustment for summer pours', vendorName: project.mainContractor, amount: m(1.1), status: 'Submitted', reason: 'Heat mitigation', submittedBy: 'Site Manager', submittedDate: '2026-05-03', approvalImpact: '+ AED 1.10M if accepted', programmeImpact: 'Reduces delay risk by 4 days', approvalOwner: 'Client Representative', decisionDue: '2026-05-15', linkedRiskId: 'r-heat' },
    ],
    risks: [
      { id: 'CR-01', packageId: 'substructure', title: 'Waterproofing rework growth', exposure: m(isSobhaHandover ? 0.7 : 6.2), probability: 0.62, expectedImpact: m(isSobhaHandover ? 0.4 : 3.8), mitigation: 'Second crew, inspection hold points, revised method statement.', status: 'mitigating' },
      { id: 'CR-02', packageId: 'facade', title: 'Facade procurement variance', exposure: m(isSobhaPilot ? 6.9 : 1.1), probability: 0.48, expectedImpact: m(isSobhaPilot ? 3.3 : 0.5), mitigation: 'Lock release dates and vendor clarification before next package gate.', status: 'open' },
      { id: 'CR-03', packageId: 'mep', title: 'MEP coordination rework', exposure: m(2.6), probability: 0.44, expectedImpact: m(1.1), mitigation: 'Freeze BIM model and close open clashes before procurement.', status: 'open' },
    ],
    cashflow: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'].map((month, index) => {
      const plannedOutflow = Math.round(contractM * (0.06 + index * 0.006));
      const actualOutflow = index <= 1 ? Math.round(plannedOutflow * (highPressure ? 1.16 : 0.96)) : null;
      const forecastOutflow = Math.round(plannedOutflow * (highPressure ? 1.22 : 1.02));
      const plannedIncome = Math.round(contractM * (0.055 + index * 0.004));
      const actualIncome = index <= 1 ? Math.round(plannedIncome * 0.94) : null;
      return { month, plannedOutflow, actualOutflow, forecastOutflow, plannedIncome, actualIncome, netPosition: (actualIncome ?? plannedIncome) - forecastOutflow };
    }),
    evm: { pv: project.plannedValue, ev: project.earnedValue, ac: project.actualCost, cpi: project.cpi, spi: project.spi, eac: project.forecastCost, tcpi: isSobhaPilot ? 1.08 : isSobhaHandover ? 0.96 : 0.94, costVariance: project.costVariance },
    lastSync: 'Today 09:20',
    sourceHealth: [
      { label: 'Project baseline', status: 'healthy' },
      { label: 'Vendor contracts', status: 'healthy' },
      { label: 'Manual actuals', status: highPressure ? 'warning' : 'healthy' },
      { label: 'Variation orders', status: 'warning' },
      { label: 'AI forecast', status: 'healthy' },
    ],
    missingDataWarnings: isSobhaPilot
      ? ['MEP actuals not updated for 12 days', 'Facade vendor claim pending approval', '3 variations missing programme impact']
      : ['2 variations require final approval owner confirmation', 'One vendor claim awaiting evidence upload'],
    aiNarrative: `${project.name} is forecast at AED ${Math.round(project.forecastCost / 1_000_000)}M against an approved budget of AED ${Math.round(project.contractValue / 1_000_000)}M. The main drivers are ${isSobhaPilot ? 'steel escalation, crane productivity loss, and facade procurement variance' : isSobhaHandover ? 'commissioning allowances, authority re-test provisions, and final snagging labour' : 'waterproofing rework, concrete escalation, and MEP coordination exposure'}. CPI is ${project.cpi.toFixed(2)}, so AI recommends protecting contingency, closing pending variations, and challenging vendor claims before the next payment cycle.`,
    managerActions: [
      { title: 'Approve / reject variations', detail: 'Four open VOs need commercial decision before they roll into the forecast.', urgency: 'critical' },
      { title: 'Review over-budget packages', detail: 'Substructure, facade, and MEP explain most of the current drift.', urgency: 'high' },
      { title: 'Escalate vendor claims', detail: 'Claims with missing evidence should not move into committed cost.', urgency: 'high' },
      { title: 'Protect contingency', detail: 'Reserve should be held for critical path exposure, not soft scope growth.', urgency: 'medium' },
      { title: 'Review forecast at completion', detail: 'EAC has moved based on actuals, VOs, and active cost risks.', urgency: 'medium' },
    ],
  };
}

export function getBudgetControlData(project: ProjectCommandProject): BudgetControlData {
  return buildFromProject(project);
}
