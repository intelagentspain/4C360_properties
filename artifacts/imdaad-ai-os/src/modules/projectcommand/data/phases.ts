export type SubTask = {
  id: string;
  name: string;
  startPct: number;
  widthPct: number;
  completePct: number;
  isCritical: boolean;
  plannedStart: string;
  plannedEnd: string;
  baselineStart: string;
  baselineEnd: string;
  contractor: string;
  discipline: string;
  riskProbability: number;
  varianceDays: number;
};

export type Phase = {
  id: string;
  name: string;
  startPct: number;
  widthPct: number;
  completePct: number;
  color: string;
  isCritical: boolean;
  aiAnnotation?: string;
  plannedStart: string;
  plannedEnd: string;
  baselineStart: string;
  baselineEnd: string;
  contractor: string;
  discipline: string;
  riskProbability: number;
  varianceDays: number;
  subTasks?: SubTask[];
};

type TemplateTask = {
  id: string;
  name: string;
  start: number;
  end: number;
  contractor?: string;
  discipline?: string;
  critical?: boolean;
  risk?: number;
  variance?: number;
};

type TemplatePhase = TemplateTask & {
  color: string;
  annotation?: string;
  subTasks?: TemplateTask[];
};

type ScheduleTemplateInput = {
  projectType: string;
  startDate: string;
  targetHandover: string;
  completion: number;
  mainContractor: string;
};

function dateFromIso(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date('2026-01-01T00:00:00Z') : parsed;
}

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

function daysBetween(start: Date, end: Date) {
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000));
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function classifyProjectType(projectType: string) {
  const lower = projectType.toLowerCase();
  if (lower.includes('handover') || lower.includes('snag')) return 'handover';
  if (lower.includes('landscape') || lower.includes('capital improvement')) return 'landscape';
  if (lower.includes('smart') || lower.includes('access')) return 'smart';
  if (lower.includes('warranty') || lower.includes('dlp')) return 'warranty';
  return 'construction';
}

function dated(start: Date, totalDays: number, fraction: number) {
  return toIsoDate(addDays(start, Math.round(totalDays * fraction)));
}

function baselineShiftDays(varianceDays: number) {
  return varianceDays < 0 ? Math.abs(varianceDays) : -Math.abs(varianceDays);
}

function itemCompletion(start: number, end: number, projectCompletion: number) {
  const startPct = start * 100;
  const endPct = end * 100;
  if (projectCompletion >= endPct) return 100;
  if (projectCompletion <= startPct) return 0;
  return Math.round(((projectCompletion - startPct) / Math.max(endPct - startPct, 1)) * 100);
}

function buildTemplate(projectType: string, mainContractor: string): TemplatePhase[] {
  const type = classifyProjectType(projectType);
  const contractor = mainContractor || 'Main Contractor';

  if (type === 'handover') {
    return [
      { id: 'inspection-readiness', name: 'Inspection Readiness', start: 0, end: 0.22, color: '#00B894', contractor: 'Handover Controls Team', discipline: 'handover', critical: true, risk: 24, variance: -2, annotation: 'Inspection path' },
      { id: 'unit-snagging', name: 'Unit Snagging', start: 0.12, end: 0.52, color: '#7C3AED', contractor: 'Snagging Team', discipline: 'quality', critical: true, risk: 38, variance: -5, annotation: 'Closure velocity' },
      { id: 'authority-signoffs', name: 'Authority Sign-offs', start: 0.36, end: 0.7, color: '#D97706', contractor: 'Authorities Lead', discipline: 'authority', critical: true, risk: 44, variance: -7, annotation: 'Slot risk' },
      { id: 'commissioning', name: 'Commissioning', start: 0.48, end: 0.82, color: '#2E7FFF', contractor: 'MEP Contractor', discipline: 'commissioning', critical: true, risk: 36, variance: -3 },
      { id: 'client-handover', name: 'Client Handover', start: 0.76, end: 1, color: '#243448', contractor: 'Client Handover Team', discipline: 'handover', critical: true, risk: 28, variance: 1 },
    ];
  }

  if (type === 'landscape') {
    return [
      { id: 'design-approval', name: 'Design Approval', start: 0, end: 0.18, color: '#00B894', contractor: 'Landscape Consultant', discipline: 'design', critical: false, risk: 12, variance: 1, annotation: 'Scope freeze' },
      { id: 'procurement', name: 'Procurement', start: 0.1, end: 0.32, color: '#2E7FFF', contractor, discipline: 'procurement', critical: true, risk: 34, variance: -4, annotation: 'Materials release' },
      { id: 'enabling', name: 'Site Enabling', start: 0.26, end: 0.44, color: '#00B894', contractor, discipline: 'site works', critical: false, risk: 22, variance: -1 },
      { id: 'irrigation', name: 'Irrigation Network', start: 0.36, end: 0.62, color: '#06B6D4', contractor: 'Irrigation Specialist', discipline: 'irrigation', critical: true, risk: 46, variance: -6, annotation: 'Pressure test path' },
      { id: 'hardscape', name: 'Hardscape Works', start: 0.48, end: 0.74, color: '#D97706', contractor: 'Hardscape Contractor', discipline: 'civil', critical: true, risk: 38, variance: -3 },
      { id: 'softscape', name: 'Softscape Planting', start: 0.62, end: 0.88, color: '#00B894', contractor: 'Softscape Contractor', discipline: 'landscape', critical: true, risk: 31, variance: -2 },
      { id: 'testing', name: 'Testing & Establishment', start: 0.8, end: 0.95, color: '#7C3AED', contractor: 'Landscape Contractor', discipline: 'testing', critical: true, risk: 27, variance: 0 },
      { id: 'handover', name: 'Landscape Handover', start: 0.92, end: 1, color: '#243448', contractor: 'Client Handover Team', discipline: 'handover', critical: true, risk: 18, variance: 1 },
    ];
  }

  if (type === 'smart') {
    return [
      { id: 'survey', name: 'Site Survey', start: 0, end: 0.18, color: '#00B894', contractor: 'Smart Access Integrator', discipline: 'survey', critical: false, risk: 14, variance: 1, annotation: 'Asset map' },
      { id: 'design', name: 'System Design', start: 0.12, end: 0.34, color: '#2E7FFF', contractor: 'Smart Access Integrator', discipline: 'design', critical: true, risk: 28, variance: -2 },
      { id: 'procurement', name: 'Device Procurement', start: 0.26, end: 0.5, color: '#D97706', contractor: 'Access Hardware Vendor', discipline: 'procurement', critical: true, risk: 42, variance: -5, annotation: 'Long-lead devices' },
      { id: 'install', name: 'Installation', start: 0.44, end: 0.74, color: '#7C3AED', contractor: 'Installation Team', discipline: 'field install', critical: true, risk: 36, variance: -4 },
      { id: 'integration', name: 'Integration', start: 0.64, end: 0.86, color: '#06B6D4', contractor: 'BMS Integrator', discipline: 'integration', critical: true, risk: 34, variance: -3 },
      { id: 'testing', name: 'Testing & Training', start: 0.82, end: 1, color: '#243448', contractor: 'Operations Training Team', discipline: 'testing', critical: true, risk: 24, variance: 0 },
    ];
  }

  if (type === 'warranty') {
    return [
      { id: 'defect-triage', name: 'Defect Triage', start: 0, end: 0.22, color: '#2E7FFF', contractor: 'DLP Response Team', discipline: 'triage', critical: true, risk: 26, variance: -2, annotation: 'Claims intake' },
      { id: 'vendor-assignment', name: 'Vendor Assignment', start: 0.16, end: 0.34, color: '#7C3AED', contractor: 'Warranty Control Team', discipline: 'vendor management', critical: true, risk: 32, variance: -3 },
      { id: 'remediation', name: 'Remediation Works', start: 0.28, end: 0.72, color: '#D97706', contractor: 'Specialist Remediation Vendor', discipline: 'remediation', critical: true, risk: 48, variance: -7, annotation: 'Repeat defects' },
      { id: 'qa-closeout', name: 'QA Closeout', start: 0.66, end: 0.88, color: '#00B894', contractor: 'QA/QC Team', discipline: 'quality', critical: true, risk: 30, variance: -2 },
      { id: 'resident-signoff', name: 'Resident / Client Sign-off', start: 0.82, end: 1, color: '#243448', contractor: 'Resident Care Team', discipline: 'handover', critical: true, risk: 22, variance: 1 },
    ];
  }

  return [
    { id: 'design', name: 'Design & Approvals', start: 0, end: 0.18, color: '#00B894', contractor: 'Design Consultant', discipline: 'design', critical: false, risk: 8, variance: 1, annotation: 'Authority path' },
    { id: 'enabling', name: 'Enabling Works', start: 0.14, end: 0.28, color: '#00B894', contractor, discipline: 'enabling', critical: false, risk: 12, variance: 0 },
    { id: 'substructure', name: 'Substructure', start: 0.24, end: 0.46, color: '#C8A020', contractor, discipline: 'structure', critical: true, risk: 34, variance: -4, annotation: 'Piling recovery' },
    { id: 'superstructure', name: 'Superstructure', start: 0.38, end: 0.68, color: '#D97706', contractor, discipline: 'structure', critical: true, risk: 52, variance: -8, annotation: 'Crane watch' },
    { id: 'facade', name: 'Facade', start: 0.5, end: 0.78, color: '#FF9B38', contractor: 'Facade Vendor', discipline: 'facade', critical: true, risk: 46, variance: -6, annotation: 'Long-lead release' },
    { id: 'mep', name: 'MEP Rough-in', start: 0.52, end: 0.82, color: '#7C3AED', contractor: 'MEP Contractor', discipline: 'mep', critical: true, risk: 49, variance: -5, annotation: 'Riser model' },
    { id: 'fitout', name: 'Fit-out & Finishing', start: 0.72, end: 0.94, color: '#243448', contractor: 'Fit-out Contractor', discipline: 'fit-out', critical: true, risk: 42, variance: -2 },
    { id: 'handover', name: 'Handover & Snagging', start: 0.9, end: 1, color: '#243448', contractor: 'Handover Team', discipline: 'handover', critical: true, risk: 34, variance: 0 },
  ];
}

function buildSubTasks(phase: TemplatePhase): TemplateTask[] {
  if (phase.subTasks?.length) return phase.subTasks;
  const span = phase.end - phase.start;
  const midpoint = phase.start + span * 0.52;
  return [
    {
      id: `${phase.id}-prep`,
      name: `${phase.name} preparation`,
      start: phase.start,
      end: Math.min(midpoint, phase.end),
      contractor: phase.contractor,
      discipline: phase.discipline,
      critical: phase.critical,
      risk: Math.max(0, (phase.risk ?? 20) - 8),
      variance: Math.min(2, phase.variance ?? 0),
    },
    {
      id: `${phase.id}-closeout`,
      name: `${phase.name} closeout`,
      start: Math.max(midpoint - span * 0.08, phase.start),
      end: phase.end,
      contractor: phase.contractor,
      discipline: phase.discipline,
      critical: phase.critical,
      risk: phase.risk,
      variance: phase.variance,
    },
  ];
}

export function buildProjectSchedule(input: ScheduleTemplateInput): Phase[] {
  const start = dateFromIso(input.startDate);
  const end = dateFromIso(input.targetHandover);
  const totalDays = daysBetween(start, end);
  const template = buildTemplate(input.projectType, input.mainContractor);

  return template.map(phase => {
    const varianceDays = phase.variance ?? 0;
    const plannedStart = dated(start, totalDays, phase.start);
    const plannedEnd = dated(start, totalDays, phase.end);
    const baselineStart = toIsoDate(addDays(dateFromIso(plannedStart), baselineShiftDays(varianceDays)));
    const baselineEnd = toIsoDate(addDays(dateFromIso(plannedEnd), baselineShiftDays(varianceDays)));
    const completePct = itemCompletion(phase.start, phase.end, input.completion);
    const subTasks = buildSubTasks(phase).map(task => {
      const taskVariance = task.variance ?? varianceDays;
      const taskStart = dated(start, totalDays, task.start);
      const taskEnd = dated(start, totalDays, task.end);
      return {
        id: task.id,
        name: task.name,
        startPct: clamp(task.start * 100),
        widthPct: clamp((task.end - task.start) * 100, 1, 100),
        completePct: itemCompletion(task.start, task.end, input.completion),
        isCritical: task.critical ?? phase.critical ?? false,
        plannedStart: taskStart,
        plannedEnd: taskEnd,
        baselineStart: toIsoDate(addDays(dateFromIso(taskStart), baselineShiftDays(taskVariance))),
        baselineEnd: toIsoDate(addDays(dateFromIso(taskEnd), baselineShiftDays(taskVariance))),
        contractor: task.contractor ?? phase.contractor ?? input.mainContractor,
        discipline: task.discipline ?? phase.discipline ?? input.projectType,
        riskProbability: task.risk ?? phase.risk ?? 20,
        varianceDays: taskVariance,
      };
    });

    return {
      id: phase.id,
      name: phase.name,
      startPct: clamp(phase.start * 100),
      widthPct: clamp((phase.end - phase.start) * 100, 1, 100),
      completePct,
      color: phase.color,
      isCritical: phase.critical ?? false,
      aiAnnotation: phase.annotation ?? (varianceDays < 0 ? `${Math.abs(varianceDays)}d slip risk` : undefined),
      plannedStart,
      plannedEnd,
      baselineStart,
      baselineEnd,
      contractor: phase.contractor ?? input.mainContractor,
      discipline: phase.discipline ?? input.projectType,
      riskProbability: phase.risk ?? 20,
      varianceDays,
      subTasks,
    };
  });
}

export const phases: Phase[] = buildProjectSchedule({
  projectType: 'Main Construction',
  startDate: '2024-01-12',
  targetHandover: '2025-04-30',
  completion: 43,
  mainContractor: 'Sobha Construction',
});
