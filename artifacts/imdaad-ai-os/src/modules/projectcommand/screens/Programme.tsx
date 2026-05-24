import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Check, CheckCircle2, ChevronDown, ClipboardList, FileText, GitBranch, Mail, Send, Sparkles, Target, X } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { GanttChart, type ProgrammeChartSelection, type ProgrammeZoom } from '../components/GanttChart';
import { AIPanel } from '../components/AIPanel';
import { useSelectedProjectCommandData } from '../useProjectCommandData';
import { addProjectCommandEvent } from '../state/projectCommandStore';
import { createProjectControlEvent, formatProjectCurrency, type ProjectEventType } from '@/core/control-twin/projectControlTwin';
import type { Phase, SubTask } from '../data/phases';

function formatMonthRange(startDate: string, endDate: string) {
  const formatter = new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric' });
  return `${formatter.format(new Date(startDate))} - ${formatter.format(new Date(endDate))}`;
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function contractorsForPhase(phase: Phase) {
  return [phase.contractor, ...(phase.subTasks?.map(task => task.contractor) ?? [])].filter(Boolean);
}

function uniqueContractors(phases: Phase[], fallback: string) {
  const names = phases.flatMap(contractorsForPhase);
  return Array.from(new Set([fallback, ...names])).filter(Boolean);
}

function filterPhasesByContractor(phases: Phase[], activeContractors: string[]) {
  if (!activeContractors.length) return phases;

  return phases.flatMap(phase => {
    const phaseMatches = activeContractors.includes(phase.contractor);
    const matchingSubTasks = phase.subTasks?.filter(task => activeContractors.includes(task.contractor)) ?? [];

    if (phaseMatches) return [phase];
    if (matchingSubTasks.length) return [{ ...phase, subTasks: matchingSubTasks }];
    return [];
  });
}

const PROGRAMME_DEMO_CONTRACTOR_DROPDOWN_OPEN_MS = 7_000;
const PROGRAMME_DEMO_CONTRACTOR_REVEAL_START_MS = 7_300;
const PROGRAMME_DEMO_CONTRACTOR_REVEAL_INTERVAL_MS = 1400;
const PROGRAMME_DEMO_CONTRACTOR_DROPDOWN_HOLD_MS = 1800;
const PROGRAMME_DEMO_AUTHORITY_PATH_OPEN_MS = 42_000;
const PROGRAMME_DEMO_AUTHORITY_PATH_SCROLL_START_MS = 43_000;
const PROGRAMME_DEMO_AUTHORITY_PATH_SCROLL_END_MS = 60_500;
const PROGRAMME_DEMO_ESCALATE_HIGHLIGHT_MS = 60_800;
const PROGRAMME_DEMO_ESCALATE_CLICK_MS = 62_000;
const PROGRAMME_DEMO_ESCALATION_SUGGESTION_HIGHLIGHT_MS = 62_600;
const PROGRAMME_DEMO_ESCALATION_LOG_HIGHLIGHT_MS = 64_600;
const PROGRAMME_DEMO_ESCALATION_LOG_CLICK_MS = 65_500;

function buildNarrative(projectName: string, phases: Phase[], fallback: string) {
  const criticalNames = phases.filter(phase => phase.isCritical).map(phase => phase.name).slice(0, 4);
  if (!criticalNames.length) return fallback;
  return `${projectName} critical path is currently driven by ${criticalNames.join(', ')}. The visible programme, delay risk, and variance cards are using the selected project and contractor filter.`;
}

function buildRecoverySuggestion(phases: Phase[], fallback: string) {
  const riskiest = [...phases].sort((a, b) => b.riskProbability - a.riskProbability)[0];
  if (!riskiest) return fallback;
  return `Focus the next recovery meeting on ${riskiest.name}. ${riskiest.contractor} owns the highest visible delay exposure at ${riskiest.riskProbability}%, with ${riskiest.varianceDays < 0 ? `${Math.abs(riskiest.varianceDays)} days of slip risk` : `${riskiest.varianceDays} days of float`} against baseline.`;
}

type DelayRiskDatum = {
  phase: string;
  delayRiskPct: number;
  contractor: string;
  varianceDays: number;
  isCritical: boolean;
};

type ProgrammeInsightKind = 'phase' | 'subtask' | 'annotation' | 'risk-bar' | 'variance-card';
type ProgrammeInsightTarget = {
  kind: ProgrammeInsightKind;
  phase: Phase;
  item: Phase | SubTask;
  label?: string;
};
type ProgrammeActionStatus = 'Ready' | 'Prepared' | 'Assigned' | 'Escalated' | 'Approved';
type ProgrammeInsightAction = {
  id: 'request-update' | 'assign-owner' | 'create-recovery-task' | 'escalate-blocker' | 'approve-recovery';
  title: string;
  label: string;
  owner: string;
  due: string;
  nextStatus: ProgrammeActionStatus;
  linkedEventType?: ProjectEventType;
};
type ProgrammeActionReceipt = {
  id: string;
  title: string;
  owner: string;
  due: string;
  status: ProgrammeActionStatus;
  target: string;
};
type ProgrammeDeepDiveModel = {
  key: string;
  target: ProgrammeInsightTarget;
  title: string;
  subtitle: string;
  statusLabel: string;
  why: string;
  sourceTrail: string[];
  dependencyChain: string[];
  unresolved: { label: string; value: string; detail: string }[];
  resolved: { label: string; value: string; detail: string }[];
  actions: ProgrammeInsightAction[];
};

function delayRiskBand(value: number) {
  if (value >= 60) return { label: 'Critical', color: '#EF4444', bg: 'bg-red-400/10', text: 'text-red-100', border: 'border-red-300/24' };
  if (value >= 40) return { label: 'High', color: '#F97316', bg: 'bg-orange-400/10', text: 'text-orange-100', border: 'border-orange-300/24' };
  if (value >= 20) return { label: 'Watch', color: '#F59E0B', bg: 'bg-amber-300/10', text: 'text-amber-100', border: 'border-amber-300/24' };
  return { label: 'Low', color: '#38D98A', bg: 'bg-emerald-300/10', text: 'text-emerald-100', border: 'border-emerald-300/24' };
}

function formatVarianceLabel(days: number) {
  if (days < 0) return `${Math.abs(days)}d slip risk`;
  if (days > 0) return `${days}d float`;
  return 'On baseline';
}

function programmeItemKey(target: ProgrammeInsightTarget) {
  return `${target.kind}:${target.phase.id}:${target.item.id}:${target.label ?? 'row'}`;
}

function programmeItemContext(item: Phase | SubTask) {
  return `${item.name} ${item.contractor} ${item.discipline} ${'aiAnnotation' in item ? item.aiAnnotation ?? '' : ''}`.toLowerCase();
}

function eventTypeForProgrammeItem(target: ProgrammeInsightTarget): ProjectEventType {
  const value = programmeItemContext(target.item);
  if (value.includes('facade') || value.includes('long-lead') || value.includes('envelope')) return 'facade-delay';
  if (value.includes('crane') || value.includes('superstructure') || value.includes('concrete') || value.includes('weather')) return 'crane-loss';
  if (value.includes('authority') || value.includes('approval') || value.includes('design')) return 'missing-approval';
  if (value.includes('mep') || value.includes('inspection') || value.includes('quality') || value.includes('riser')) return 'inspection-failure';
  if (value.includes('contractor') || value.includes('fit-out') || value.includes('substructure')) return 'contractor-underperformance';
  return target.item.riskProbability >= 45 ? 'contractor-underperformance' : 'weather-disruption';
}

function ownerForProgrammeItem(target: ProgrammeInsightTarget) {
  const eventType = eventTypeForProgrammeItem(target);
  if (eventType === 'facade-delay') return 'Procurement Lead';
  if (eventType === 'crane-loss') return 'Planning Manager';
  if (eventType === 'missing-approval') return 'Authority Coordinator';
  if (eventType === 'inspection-failure') return 'QA / MEP Lead';
  if (eventType === 'contractor-underperformance') return 'Project Controls Lead';
  return 'Field Operations Lead';
}

function dependencyChainForProgrammeItem(target: ProgrammeInsightTarget) {
  const value = programmeItemContext(target.item);
  if (value.includes('facade')) return ['Facade release', 'Envelope closure', 'Fit-out start', 'MEP congestion', 'Handover confidence'];
  if (value.includes('crane') || value.includes('superstructure')) return ['Tower crane capacity', 'Superstructure cycle', 'Facade and MEP hoists', 'SPI and float', 'Handover confidence'];
  if (value.includes('authority') || value.includes('approval') || value.includes('design')) return ['Approval path', 'Stage gate readiness', 'Commissioning clearance', 'Occupancy window', 'Handover confidence'];
  if (value.includes('mep') || value.includes('riser')) return ['MEP rough-in', 'Clash clearance', 'Inspection pass', 'Commissioning gate', 'Handover readiness'];
  if (value.includes('substructure') || value.includes('piling')) return ['Substructure recovery', 'Superstructure start', 'Crane logistics', 'Facade window', 'Critical path float'];
  if (value.includes('fit-out')) return ['Fit-out start', 'MEP congestion', 'Snagging load', 'Handover pack', 'Resident readiness'];
  if (value.includes('handover') || value.includes('snag')) return ['Snagging closure', 'Evidence pack', 'Go/No-Go gate', 'Resident move-in readiness'];
  return ['Programme update', 'Owner confirmation', 'Linked evidence', 'Forecast refresh', 'Manager decision'];
}

function insightTitlePrefix(kind: ProgrammeInsightKind) {
  if (kind === 'annotation') return 'AI programme insight';
  if (kind === 'risk-bar') return 'Delay risk insight';
  if (kind === 'variance-card') return 'Critical path variance';
  if (kind === 'subtask') return 'Activity insight';
  return 'Phase insight';
}

function buildProgrammeDeepDive(target: ProgrammeInsightTarget, projectName: string): ProgrammeDeepDiveModel {
  const item = target.item;
  const band = delayRiskBand(item.riskProbability);
  const owner = ownerForProgrammeItem(target);
  const slipDays = Math.max(2, Math.abs(item.varianceDays) + Math.ceil(item.riskProbability / 12));
  const costExposure = Math.max(600_000, Math.round((item.riskProbability * 95_000) + (Math.abs(item.varianceDays) * 180_000)));
  const recoveredFloat = Math.max(2, Math.round(slipDays * 0.55));
  const reducedExposure = Math.max(350_000, Math.round(costExposure * 0.45));
  const isSlip = item.varianceDays < 0;
  const dependencyChain = dependencyChainForProgrammeItem(target);
  const statusLabel = `${band.label} - ${item.isCritical ? 'Critical path' : 'Supporting path'}`;
  const why = `${item.name} is ${item.isCritical ? 'on' : 'near'} the control path with ${item.riskProbability}% delay risk and ${formatVarianceLabel(item.varianceDays)}. The useful move is to confirm owner, proof, and recovery action before this rolls into forecast and handover confidence.`;

  return {
    key: programmeItemKey(target),
    target,
    title: `${insightTitlePrefix(target.kind)}: ${item.name}`,
    subtitle: `${projectName} / ${item.contractor} / ${item.discipline}`,
    statusLabel,
    why,
    sourceTrail: [
      `Programme baseline: ${formatShortDate(item.baselineStart)} to ${formatShortDate(item.baselineEnd)}`,
      `Current plan: ${formatShortDate(item.plannedStart)} to ${formatShortDate(item.plannedEnd)}`,
      `Progress: ${item.completePct}% complete`,
      `Variance: ${isSlip ? `${Math.abs(item.varianceDays)} days behind baseline` : item.varianceDays > 0 ? `${item.varianceDays} days float` : 'on baseline'}`,
      `Source: ${target.label ?? target.kind} / ${item.contractor}`,
    ],
    dependencyChain,
    unresolved: [
      { label: 'Delay impact', value: `${slipDays}d slip`, detail: `${dependencyChain[1] ?? 'Next activity'} inherits the open blocker.` },
      { label: 'Cost exposure', value: formatProjectCurrency(costExposure), detail: 'Exposure can land through acceleration, claim pressure, or rework.' },
      { label: 'Gate / evidence', value: item.isCritical ? 'Gate at risk' : 'Watch item', detail: 'Manager review should link evidence, date, and owner before the next update.' },
    ],
    resolved: [
      { label: 'Float recovered', value: `${recoveredFloat}d`, detail: 'Recovery task protects the next downstream activity.' },
      { label: 'Exposure reduced', value: formatProjectCurrency(reducedExposure), detail: 'Earlier owner action limits acceleration and rework pressure.' },
      { label: 'Confidence', value: `+${Math.max(4, recoveredFloat)} pts`, detail: 'Handover confidence improves when the blocker has a named owner and due date.' },
    ],
    actions: [
      { id: 'request-update', title: 'Request update', label: 'Request update', owner, due: 'Today', nextStatus: 'Prepared' },
      { id: 'assign-owner', title: 'Assign owner', label: 'Assign owner', owner, due: 'Today', nextStatus: 'Assigned' },
      { id: 'create-recovery-task', title: 'Create recovery task', label: 'Create recovery task', owner, due: 'Next 24h', nextStatus: 'Prepared' },
      { id: 'escalate-blocker', title: 'Escalate blocker', label: 'Escalate blocker', owner, due: 'Now', nextStatus: 'Escalated', linkedEventType: eventTypeForProgrammeItem(target) },
      { id: 'approve-recovery', title: 'Mark recovery approved', label: 'Mark recovery approved', owner: 'Project Director', due: 'Now', nextStatus: 'Approved', linkedEventType: 'recovery-approved' },
    ],
  };
}

function actionButtonClass(status?: ProgrammeActionStatus) {
  if (status === 'Approved') return 'border-emerald-300/35 bg-emerald-300/16 text-emerald-100';
  if (status === 'Escalated') return 'border-red-300/35 bg-red-300/14 text-red-100';
  if (status === 'Assigned' || status === 'Prepared') return 'border-cyan-300/30 bg-cyan-300/12 text-cyan-100';
  return 'border-[#2E7FFF]/22 bg-[#112040] text-[#DCE8F8] hover:border-[#2E7FFF]/45 hover:bg-[#16305A]';
}

function DelayRiskTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: DelayRiskDatum }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  const band = delayRiskBand(item.delayRiskPct);

  return (
    <div className="max-w-[260px] rounded-xl border border-[rgba(46,127,255,0.35)] bg-[#07111F] px-3 py-2 text-[#EEF3FA] shadow-2xl shadow-black/40">
      <p className="text-[12px] font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{item.phase}</p>
      <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-white/8 bg-white/[0.035] px-2.5 py-1.5">
        <span className="text-[9px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">Delay risk</span>
        <span className="text-[13px] font-black" style={{ color: band.color }}>{item.delayRiskPct}%</span>
      </div>
      <div className="mt-2 space-y-1 text-[10px] leading-4 text-[#B8C7DB]">
        <p><span className="font-black text-[#DCE8F8]">Band:</span> {band.label}</p>
        <p><span className="font-black text-[#DCE8F8]">Contractor:</span> {item.contractor}</p>
        <p><span className="font-black text-[#DCE8F8]">Critical path:</span> {item.isCritical ? 'Yes' : 'No'}</p>
        <p><span className="font-black text-[#DCE8F8]">Variance:</span> {formatVarianceLabel(item.varianceDays)}</p>
      </div>
      <p className="mt-2 rounded-lg border border-[#7C3AED]/18 bg-[#7C3AED]/10 px-2 py-1.5 text-[9px] font-bold text-[#C4B5FD]">
        AI estimate, not a committed forecast.
      </p>
    </div>
  );
}

function ProgrammeInsightSheet({
  model,
  receipts,
  actionStatuses,
  onRunAction,
  onClose,
  demoTimelineMs,
  demoAutoScroll = false,
}: {
  model: ProgrammeDeepDiveModel;
  receipts: ProgrammeActionReceipt[];
  actionStatuses: Record<string, ProgrammeActionStatus>;
  onRunAction: (action: ProgrammeInsightAction) => void;
  onClose: () => void;
  demoTimelineMs?: number;
  demoAutoScroll?: boolean;
}) {
  const item = model.target.item;
  const band = delayRiskBand(item.riskProbability);
  const scrollerRef = useRef<HTMLElement | null>(null);
  const demoEscalateClickedRef = useRef(false);
  const demoLogEscalationClickedRef = useRef(false);
  const emailAnimationTimerRef = useRef<number | null>(null);
  const [escalationAction, setEscalationAction] = useState<ProgrammeInsightAction | null>(null);
  const [escalationRegenerated, setEscalationRegenerated] = useState(false);
  const [escalationExecuting, setEscalationExecuting] = useState(false);
  const [emailAnimationActive, setEmailAnimationActive] = useState(false);

  const actionKeyFor = (action: ProgrammeInsightAction) => `${model.key}:${action.id}`;
  const demoEscalateAction = model.actions.find(action => action.id === 'escalate-blocker');
  const escalationStatus = escalationAction ? actionStatuses[actionKeyFor(escalationAction)] : undefined;
  const demoHighlightSuggestedAction = demoAutoScroll
    && typeof demoTimelineMs === 'number'
    && Boolean(escalationAction)
    && demoTimelineMs >= PROGRAMME_DEMO_ESCALATION_SUGGESTION_HIGHLIGHT_MS
    && demoTimelineMs < PROGRAMME_DEMO_ESCALATION_LOG_CLICK_MS;
  const demoHighlightLogEscalation = demoAutoScroll
    && typeof demoTimelineMs === 'number'
    && Boolean(escalationAction)
    && demoTimelineMs >= PROGRAMME_DEMO_ESCALATION_LOG_HIGHLIGHT_MS
    && demoTimelineMs < PROGRAMME_DEMO_ESCALATION_LOG_CLICK_MS;
  const escalationBrief = escalationAction ? (
    escalationRegenerated
      ? [
          `AI suggested action: Escalate ${item.name} to ${escalationAction.owner} now.`,
          `Manager move: confirm blocker owner, missing proof, and recovery date before the next programme update.`,
          `Due: ${escalationAction.due}. Status: ${escalationStatus ?? 'Ready to log'}.`,
          `Impact if ignored: ${model.unresolved.map(entry => `${entry.label} ${entry.value}`).join(' / ')}.`,
          `Target: ProjectCommand / ${model.subtitle}`,
        ]
      : [
          `Escalate programme blocker: ${item.name}`,
          `Owner: ${escalationAction.owner}`,
          `Due: ${escalationAction.due}`,
          `Status: ${escalationStatus ?? 'Ready to log'}`,
          `Why: ${model.why}`,
          `If unresolved: ${model.unresolved.map(entry => `${entry.label} ${entry.value}`).join(' / ')}`,
          `Target: ProjectCommand / ${model.subtitle}`,
        ]
  ).join('\n') : '';

  const handleActionClick = (action: ProgrammeInsightAction) => {
    if (action.id === 'escalate-blocker') {
      setEscalationAction(action);
      setEscalationRegenerated(false);
      setEscalationExecuting(false);
      return;
    }
    onRunAction(action);
  };

  const regenerateEscalationBrief = () => {
    setEscalationRegenerated(true);
  };

  const logEscalation = () => {
    if (!escalationAction || escalationExecuting) return;
    onRunAction(escalationAction);
    setEscalationExecuting(true);
    if (emailAnimationTimerRef.current) window.clearTimeout(emailAnimationTimerRef.current);
    emailAnimationTimerRef.current = window.setTimeout(() => {
      setEscalationAction(null);
      setEscalationExecuting(false);
      setEmailAnimationActive(true);
      emailAnimationTimerRef.current = window.setTimeout(() => {
        setEmailAnimationActive(false);
        onClose();
      }, 3200);
    }, 620);
  };

  useEffect(() => () => {
    if (emailAnimationTimerRef.current) window.clearTimeout(emailAnimationTimerRef.current);
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !demoAutoScroll || typeof demoTimelineMs !== 'number') return;

    const duration = Math.max(1, PROGRAMME_DEMO_AUTHORITY_PATH_SCROLL_END_MS - PROGRAMME_DEMO_AUTHORITY_PATH_SCROLL_START_MS);
    const rawProgress = (demoTimelineMs - PROGRAMME_DEMO_AUTHORITY_PATH_SCROLL_START_MS) / duration;
    const progress = Math.max(0, Math.min(1, rawProgress));
    const eased = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    scroller.scrollTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight) * eased;
  }, [demoAutoScroll, demoTimelineMs]);

  useEffect(() => {
    if (!demoAutoScroll || typeof demoTimelineMs !== 'number' || !demoEscalateAction) return;
    if (demoTimelineMs < PROGRAMME_DEMO_ESCALATE_CLICK_MS) {
      demoEscalateClickedRef.current = false;
      return;
    }
    if (demoEscalateClickedRef.current) return;
    demoEscalateClickedRef.current = true;
    handleActionClick(demoEscalateAction);
  }, [demoAutoScroll, demoEscalateAction, demoTimelineMs]);

  useEffect(() => {
    if (!demoAutoScroll || typeof demoTimelineMs !== 'number') return;
    if (demoTimelineMs < PROGRAMME_DEMO_ESCALATION_LOG_CLICK_MS) {
      demoLogEscalationClickedRef.current = false;
      return;
    }
    if (!escalationAction || demoLogEscalationClickedRef.current) return;
    demoLogEscalationClickedRef.current = true;
    logEscalation();
  }, [demoAutoScroll, demoTimelineMs, escalationAction]);

  const insightPanelFolded = escalationExecuting || emailAnimationActive;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1400] bg-black/45 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.aside
        initial={{ x: 540 }}
        animate={{
          x: insightPanelFolded ? 560 : 0,
          opacity: insightPanelFolded ? 0.38 : 1,
          scale: insightPanelFolded ? 0.98 : 1,
        }}
        exit={{ x: 540 }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        ref={scrollerRef}
        className="custom-scrollbar absolute bottom-0 right-0 top-[52px] w-[min(540px,calc(100vw-18px))] overflow-y-auto border-l border-[#2E7FFF]/24 bg-[#07111F] shadow-2xl shadow-black/45"
        onClick={event => event.stopPropagation()}
        aria-label="Programme insight detail"
      >
        <div className="sticky top-0 z-10 border-b border-[#2E7FFF]/18 bg-[#102347]/96 px-5 py-4 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8FC7FF]">Programme Insight</p>
              <h3 className="mt-1 text-xl font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{model.title}</h3>
              <p className="mt-1 text-[12px] leading-5 text-[#9EB2CE]">{model.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#2E7FFF]/24 bg-[#0A1628] p-2 text-[#9EB2CE] transition hover:border-[#2E7FFF]/45 hover:text-white"
              aria-label="Close programme insight"
            >
              <X size={18} />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${band.bg} ${band.text} ${band.border}`}>
              {model.statusLabel}
            </span>
            <span className="rounded-full border border-[#2E7FFF]/24 bg-[#0A1628] px-2.5 py-1 text-[10px] font-black uppercase text-[#B8C7DB]">
              {item.completePct}% complete
            </span>
            <span className="rounded-full border border-[#2E7FFF]/24 bg-[#0A1628] px-2.5 py-1 text-[10px] font-black uppercase text-[#B8C7DB]">
              {formatVarianceLabel(item.varianceDays)}
            </span>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <section className="rounded-2xl border border-[#2E7FFF]/20 bg-[#0A1628] p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['Contractor', item.contractor],
                ['Discipline', item.discipline],
                ['Planned dates', `${formatShortDate(item.plannedStart)} - ${formatShortDate(item.plannedEnd)}`],
                ['Baseline dates', `${formatShortDate(item.baselineStart)} - ${formatShortDate(item.baselineEnd)}`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-[#2E7FFF]/14 bg-[#07111F] p-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">{label}</p>
                  <p className="mt-1 text-[13px] font-black text-[#EAF2FF]">{value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-cyan-300/18 bg-cyan-300/8 p-4">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-cyan-100">
              <Target size={15} />
              Why this matters
            </div>
            <p className="text-[13px] leading-6 text-[#DCE8F8]">{model.why}</p>
          </section>

          <section className="rounded-2xl border border-[#2E7FFF]/18 bg-[#0A1628] p-4">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-[#8FC7FF]">
              <GitBranch size={15} />
              Dependency chain
            </div>
            <div className="grid gap-2">
              {model.dependencyChain.map((step, index) => (
                <div key={`${step}-${index}`} className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#2E7FFF]/24 bg-[#112040] text-[10px] font-black text-[#8FC7FF]">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 rounded-xl border border-[#2E7FFF]/12 bg-[#07111F] px-3 py-2 text-[12px] font-bold text-[#DCE8F8]">
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <div className="grid gap-3 sm:grid-cols-2">
            <section className="rounded-2xl border border-red-300/20 bg-red-300/8 p-4">
              <div className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-red-100">
                <AlertTriangle size={15} />
                If unresolved
              </div>
              <div className="space-y-2">
                {model.unresolved.map(item => (
                  <div key={item.label} className="rounded-xl border border-red-200/12 bg-[#07111F]/80 p-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.12em] text-red-100/80">{item.label}</p>
                    <p className="mt-1 text-[15px] font-black text-red-100">{item.value}</p>
                    <p className="mt-1 text-[11px] leading-4 text-[#B8C7DB]">{item.detail}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-emerald-300/20 bg-emerald-300/8 p-4">
              <div className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-100">
                <CheckCircle2 size={15} />
                If resolved today
              </div>
              <div className="space-y-2">
                {model.resolved.map(item => (
                  <div key={item.label} className="rounded-xl border border-emerald-200/12 bg-[#07111F]/80 p-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.12em] text-emerald-100/80">{item.label}</p>
                    <p className="mt-1 text-[15px] font-black text-emerald-100">{item.value}</p>
                    <p className="mt-1 text-[11px] leading-4 text-[#B8C7DB]">{item.detail}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="rounded-2xl border border-[#2E7FFF]/18 bg-[#0A1628] p-4">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-[#8FC7FF]">
              <FileText size={15} />
              Source trail
            </div>
            <div className="space-y-2">
              {model.sourceTrail.map(source => (
                <div key={source} className="rounded-xl border border-[#2E7FFF]/12 bg-[#07111F] px-3 py-2 text-[12px] font-bold text-[#B8C7DB]">
                  {source}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[#7C3AED]/22 bg-[#7C3AED]/9 p-4">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-[#C4B5FD]">
              <ClipboardList size={15} />
              Progress or resolve
            </div>
            <div className="grid gap-2">
              {model.actions.map(action => {
                const status = actionStatuses[actionKeyFor(action)];
                const label = status ?? action.label;
                const demoHighlightEscalate = demoAutoScroll
                  && typeof demoTimelineMs === 'number'
                  && action.id === 'escalate-blocker'
                  && demoTimelineMs >= PROGRAMME_DEMO_ESCALATE_HIGHLIGHT_MS
                  && demoTimelineMs < PROGRAMME_DEMO_ESCALATE_CLICK_MS + 1_500;
                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => handleActionClick(action)}
                    className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-3 text-left transition ${
                      demoHighlightEscalate
                        ? 'border-cyan-200/75 bg-cyan-300/18 text-cyan-50 shadow-[0_0_28px_rgba(34,211,238,0.38)]'
                        : actionButtonClass(status)
                    }`}
                  >
                    <span>
                      <span className="block text-[13px] font-black">{label}</span>
                      <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.12em] opacity-75">
                        {action.owner} / {action.due}
                      </span>
                    </span>
                    {status ? <CheckCircle2 size={16} /> : <Send size={16} />}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-[10px] leading-4 text-[#8EA7C7]">
              Demo-safe: these controls prepare or log ProjectCommand actions only. They do not email, approve spend, or dispatch externally.
            </p>
          </section>

          <AnimatePresence>
            {escalationAction && createPortal((
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[1500] flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm"
                onClick={() => setEscalationAction(null)}
              >
                <motion.div
                  initial={{ y: 20, scale: 0.98 }}
                  animate={{ y: 0, scale: 1 }}
                  exit={{ y: 20, scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 26 }}
                  className="flex max-h-[calc(100vh-72px)] w-[min(560px,calc(100vw-28px))] flex-col overflow-hidden rounded-2xl border border-red-300/24 bg-[#07111F] shadow-2xl shadow-black/50"
                  onClick={event => event.stopPropagation()}
                  role="dialog"
                  aria-modal="true"
                  aria-label={`Escalate blocker for ${item.name}`}
                >
                  <div className="border-b border-red-300/16 bg-red-400/10 px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-100">Escalation action</p>
                        <h4 className="mt-1 text-lg font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                          Escalate blocker: {item.name}
                        </h4>
                        <p className="mt-1 text-[12px] leading-5 text-[#B8C7DB]">
                          Log this as a ProjectCommand blocker with a named owner and immediate due time.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEscalationAction(null)}
                        className="rounded-xl border border-red-200/18 bg-[#0A1628] p-2 text-[#B8C7DB] hover:bg-white/5 hover:text-white"
                        aria-label="Close escalation action"
                      >
                        <X size={17} />
                      </button>
                    </div>
                  </div>

                  <div className="custom-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
                    <div className="grid gap-3 sm:grid-cols-3">
                      {[
                        ['Owner', escalationAction.owner],
                        ['Due', escalationAction.due],
                        ['Status', escalationStatus ?? 'Ready to log'],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-xl border border-[#2E7FFF]/16 bg-[#0A1628] p-3">
                          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">{label}</p>
                          <p className="mt-1 text-[13px] font-black text-[#EAF2FF]">{value}</p>
                        </div>
                      ))}
                    </div>

                    <div
                      className={`rounded-2xl border p-4 transition-all duration-300 ${
                        demoHighlightSuggestedAction
                          ? 'border-cyan-200/80 bg-cyan-300/14 shadow-[0_0_34px_rgba(34,211,238,0.34)] ring-1 ring-cyan-100/35'
                          : 'border-cyan-300/18 bg-cyan-300/8'
                      }`}
                    >
                      <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-100">
                        <Sparkles size={13} />
                        Suggested Action
                      </p>
                      <p className="mt-2 whitespace-pre-line text-[12px] leading-5 text-[#DCE8F8]">{escalationBrief}</p>
                    </div>

                    <div className="rounded-2xl border border-red-200/18 bg-red-300/8 p-4">
                      <div className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-red-100">
                        <AlertTriangle size={15} />
                        Why escalate
                      </div>
                      <p className="text-[13px] leading-6 text-[#DCE8F8]">{model.why}</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-red-200/16 bg-[#0A1628] p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-red-100">If ignored</p>
                        <p className="mt-2 text-[13px] font-black text-[#EEF3FA]">{model.unresolved[0]?.value ?? 'Delay exposure'}</p>
                        <p className="mt-1 text-[11px] leading-4 text-[#9EB2CE]">{model.unresolved[0]?.detail ?? 'Downstream activities inherit the blocker.'}</p>
                      </div>
                      <div className="rounded-2xl border border-emerald-200/16 bg-[#0A1628] p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-100">If logged now</p>
                        <p className="mt-2 text-[13px] font-black text-[#EEF3FA]">{model.resolved[0]?.value ?? 'Owner assigned'}</p>
                        <p className="mt-1 text-[11px] leading-4 text-[#9EB2CE]">{model.resolved[0]?.detail ?? 'ProjectCommand can track the recovery path.'}</p>
                      </div>
                    </div>

                    <div className="sticky bottom-0 z-10 -mx-5 -mb-5 flex flex-wrap justify-end gap-2 border-t border-[#2E7FFF]/16 bg-[#07111F]/95 px-5 py-4 backdrop-blur">
                      <button
                        type="button"
                        onClick={regenerateEscalationBrief}
                        className="inline-flex items-center gap-2 rounded-xl border border-[#2E7FFF]/24 bg-[#0A1628] px-4 py-2.5 text-[12px] font-black text-[#DCE8F8] hover:bg-white/5"
                      >
                        <Sparkles size={14} />
                        {escalationRegenerated ? 'Regenerated' : 'Regenerate'}
                      </button>
                      <button
                        type="button"
                        onClick={logEscalation}
                        className={`rounded-xl px-4 py-2.5 text-[12px] font-black text-white shadow-lg ${
                          escalationExecuting || escalationStatus === 'Escalated'
                            ? 'bg-emerald-500 shadow-emerald-950/25'
                            : demoHighlightLogEscalation
                            ? 'bg-cyan-400 shadow-[0_0_28px_rgba(34,211,238,0.45)] ring-1 ring-cyan-100/60'
                            : 'bg-red-500 shadow-red-950/25 hover:bg-red-400'
                        }`}
                      >
                        {escalationExecuting || escalationStatus === 'Escalated' ? 'Escalation logged' : 'Log escalation'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ), document.body)}
          </AnimatePresence>

          <AnimatePresence>
            {emailAnimationActive && createPortal((
              <motion.div
                className="pointer-events-none fixed inset-0 z-[1510] flex items-center justify-center bg-black/18 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  initial={{ y: 26, scale: 0.96, opacity: 0 }}
                  animate={{ y: [26, 0, 0, -8], scale: [0.96, 1, 1, 0.98], opacity: [0, 1, 1, 0] }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 2.45, times: [0, 0.2, 0.82, 1], ease: 'easeOut' }}
                  className="relative w-[min(430px,calc(100vw-36px))] overflow-hidden rounded-2xl border border-cyan-200/40 bg-[#07111F]/96 p-4 shadow-[0_0_52px_rgba(34,211,238,0.28)] backdrop-blur"
                >
                  <motion.div
                    className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-300 via-emerald-300 to-cyan-300"
                    initial={{ x: '-100%' }}
                    animate={{ x: ['-100%', '0%', '0%', '100%'] }}
                    transition={{ duration: 2.2, times: [0, 0.28, 0.74, 1], ease: 'easeInOut' }}
                  />
                  <div className="flex items-center gap-4">
                    <div className="relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-cyan-200/40 bg-cyan-300/16 text-cyan-50">
                      <Mail size={27} />
                      <motion.span
                        className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-emerald-400 text-[#04111F]"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: [0, 1.18, 1], opacity: 1 }}
                        transition={{ delay: 0.45, duration: 0.42, ease: 'easeOut' }}
                      >
                        <Check size={13} />
                      </motion.span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100">Action transmitted</p>
                      <p className="mt-1 text-[16px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Programme blocker escalated</p>
                      <p className="mt-1 text-[12px] leading-5 text-[#B8C7DB]">Authority Coordinator notified. Manager action queue and ProjectCommand trail updated.</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {[
                      ['Owner', 'Authority'],
                      ['Due', 'Now'],
                      ['Status', 'Logged'],
                    ].map(([label, value], index) => (
                      <motion.div
                        key={label}
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.35 + index * 0.12, duration: 0.32 }}
                        className="rounded-xl border border-cyan-200/16 bg-[#0A1628] px-3 py-2"
                      >
                        <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">{label}</p>
                        <p className="mt-1 text-[12px] font-black text-[#EAF2FF]">{value}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            ), document.body)}
          </AnimatePresence>

          {receipts.length > 0 && (
            <section className="rounded-2xl border border-emerald-300/20 bg-emerald-300/8 p-4">
              <div className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-100">
                <CheckCircle2 size={15} />
                Action receipt
              </div>
              <div className="space-y-2">
                {receipts.map(receipt => (
                  <div key={receipt.id} className="rounded-xl border border-emerald-200/12 bg-[#07111F] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[13px] font-black text-[#EAF2FF]">{receipt.title}</p>
                        <p className="mt-1 text-[11px] text-[#9EB2CE]">{receipt.owner} / due {receipt.due}</p>
                        <p className="mt-1 text-[11px] text-[#8FC7FF]">Target: {receipt.target}</p>
                      </div>
                      <span className="rounded-full border border-emerald-300/22 bg-emerald-300/12 px-2 py-1 text-[9px] font-black uppercase text-emerald-100">
                        {receipt.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </motion.aside>
    </motion.div>
  );
}

export function Programme({ demoTimelineMs }: { demoTimelineMs?: number }) {
  const dataset = useSelectedProjectCommandData();
  const { aiContent, phases, project, property } = dataset;
  const [zoom, setZoom] = useState<ProgrammeZoom>('Month');
  const [baseline, setBaseline] = useState(true);
  const [critical, setCritical] = useState(true);
  const [contractorOpen, setContractorOpen] = useState(false);
  const [selectedContractors, setSelectedContractors] = useState<string[]>(['All contractors']);
  const [whatIfOpen, setWhatIfOpen] = useState(false);
  const [delayDays, setDelayDays] = useState(14);
  const [selectedInsight, setSelectedInsight] = useState<ProgrammeInsightTarget | null>(null);
  const [programmeActionStatuses, setProgrammeActionStatuses] = useState<Record<string, ProgrammeActionStatus>>({});
  const [programmeActionReceipts, setProgrammeActionReceipts] = useState<Record<string, ProgrammeActionReceipt[]>>({});
  const demoAuthorityPathOpenedRef = useRef(false);
  const contractorOptions = useMemo(() => ['All contractors', ...uniqueContractors(phases, project.mainContractor)], [phases, project.mainContractor]);
  const demoContractorSequence = useMemo(() => {
    const contractors = contractorOptions.filter(contractor => contractor !== 'All contractors');
    const primary = contractors.find(contractor => contractor === 'Sobha Construction') ?? project.mainContractor ?? contractors[0];
    return [primary, ...contractors.filter(contractor => contractor !== primary)].filter(Boolean);
  }, [contractorOptions, project.mainContractor]);
  const demoContractorRevealCount = typeof demoTimelineMs === 'number'
    ? Math.max(
        1,
        Math.min(
          demoContractorSequence.length,
          1 + Math.floor(Math.max(0, demoTimelineMs - PROGRAMME_DEMO_CONTRACTOR_REVEAL_START_MS) / PROGRAMME_DEMO_CONTRACTOR_REVEAL_INTERVAL_MS),
        ),
      )
    : 0;
  const demoSelectedContractors = typeof demoTimelineMs === 'number' && demoContractorSequence.length > 0
    ? demoContractorSequence.slice(0, demoContractorRevealCount)
    : null;
  const effectiveSelectedContractors = demoSelectedContractors ?? selectedContractors;
  const allContractorsSelected = effectiveSelectedContractors.includes('All contractors') || effectiveSelectedContractors.length === 0;
  const activeContractors = allContractorsSelected ? [] : effectiveSelectedContractors.filter(contractor => contractor !== 'All contractors');
  const contractorLabel = allContractorsSelected ? 'All contractors' : activeContractors.length === 1 ? activeContractors[0] : `${activeContractors.length} contractors selected`;
  const demoContractorDropdownOpen = typeof demoTimelineMs === 'number'
    && demoTimelineMs >= PROGRAMME_DEMO_CONTRACTOR_DROPDOWN_OPEN_MS
    && demoTimelineMs < PROGRAMME_DEMO_CONTRACTOR_REVEAL_START_MS
      + (Math.max(1, demoContractorSequence.length) * PROGRAMME_DEMO_CONTRACTOR_REVEAL_INTERVAL_MS)
      + PROGRAMME_DEMO_CONTRACTOR_DROPDOWN_HOLD_MS;
  const effectiveContractorOpen = demoContractorDropdownOpen || contractorOpen;
  const demoCurrentContractor = demoSelectedContractors?.[demoSelectedContractors.length - 1] ?? null;
  const filteredPhases = useMemo(() => filterPhasesByContractor(phases, activeContractors), [activeContractors, phases]);
  const delayData: DelayRiskDatum[] = [...filteredPhases]
    .sort((a, b) => b.riskProbability - a.riskProbability)
    .map(phase => ({
      phase: phase.name,
      delayRiskPct: phase.riskProbability,
      contractor: phase.contractor,
      varianceDays: phase.varianceDays,
      isCritical: phase.isCritical,
    }));
  const highestDelayRisk = delayData[0];
  const averageDelayRisk = delayData.length
    ? Math.round(delayData.reduce((sum, item) => sum + item.delayRiskPct, 0) / delayData.length)
    : 0;
  const criticalPhaseCount = delayData.filter(item => item.isCritical).length;
  const varianceEntries = filteredPhases
    .filter(phase => phase.varianceDays !== undefined)
    .map(phase => [phase.name, phase.varianceDays] as const);
  const criticalPathNarrative = buildNarrative(project.name, filteredPhases, aiContent.programmeInsights.criticalPathNarrative);
  const recoverySuggestion = buildRecoverySuggestion(filteredPhases, aiContent.programmeInsights.rescheduleSuggestion);
  const resourceData = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'].map((month, index) => ({ month, workers: Math.round((project.floors * 2.2) + [72, 96, 128, 164, 210, 246, 292, 318][index] * (project.completion / 62)) }));
  const selectedInsightKey = selectedInsight ? programmeItemKey(selectedInsight) : '';
  const selectedInsightModel = useMemo(
    () => selectedInsight ? buildProgrammeDeepDive(selectedInsight, project.name) : null,
    [selectedInsight, project.name],
  );
  const authorityPathTarget = useMemo(() => {
    const phase = phases.find(item => item.aiAnnotation === 'Authority path') ?? phases.find(item => item.id === 'design');
    if (!phase || phase.aiAnnotation !== 'Authority path') return null;
    return {
      kind: 'annotation' as const,
      phase,
      item: phase,
      label: phase.aiAnnotation,
    };
  }, [phases]);

  useEffect(() => {
    setSelectedContractors(['All contractors']);
    setContractorOpen(false);
  }, [project.id]);

  useEffect(() => {
    if (typeof demoTimelineMs !== 'number' || !authorityPathTarget) return;

    if (demoTimelineMs < PROGRAMME_DEMO_AUTHORITY_PATH_OPEN_MS) {
      demoAuthorityPathOpenedRef.current = false;
      if (selectedInsight?.label === 'Authority path') setSelectedInsight(null);
      return;
    }

    if (demoAuthorityPathOpenedRef.current) return;
    demoAuthorityPathOpenedRef.current = true;
    setSelectedInsight(authorityPathTarget);
  }, [authorityPathTarget, demoTimelineMs, selectedInsight?.label]);

  const toggleContractor = (contractor: string) => {
    if (contractor === 'All contractors') {
      setSelectedContractors(['All contractors']);
      return;
    }

    setSelectedContractors(current => {
      const currentSpecific = current.filter(item => item !== 'All contractors');
      const next = currentSpecific.includes(contractor)
        ? currentSpecific.filter(item => item !== contractor)
        : [...currentSpecific, contractor];

      return next.length ? next : ['All contractors'];
    });
  };

  const openProgrammeInsight = (kind: ProgrammeInsightKind, phase: Phase, item: Phase | SubTask, label?: string) => {
    setSelectedInsight({ kind, phase, item, label });
  };

  const openDelayRisk = (datum?: DelayRiskDatum) => {
    if (!datum) return;
    const phase = filteredPhases.find(item => item.name === datum.phase) ?? phases.find(item => item.name === datum.phase);
    if (!phase) return;
    openProgrammeInsight('risk-bar', phase, phase, 'AI Delay Risk by Phase');
  };

  const handleDelayRiskBarClick = (entry: unknown) => {
    const datum = (entry as { payload?: DelayRiskDatum } | undefined)?.payload;
    openDelayRisk(datum);
  };

  const runProgrammeAction = (action: ProgrammeInsightAction) => {
    if (!selectedInsightModel) return;
    const actionKey = `${selectedInsightModel.key}:${action.id}`;
    const targetLabel = `${property.name} / ${project.name}`;
    const receipt: ProgrammeActionReceipt = {
      id: `${actionKey}:${Date.now().toString(36)}`,
      title: action.title,
      owner: action.owner,
      due: action.due,
      status: action.nextStatus,
      target: targetLabel,
    };

    setProgrammeActionStatuses(current => ({
      ...current,
      [actionKey]: action.nextStatus,
    }));
    setProgrammeActionReceipts(current => ({
      ...current,
      [selectedInsightModel.key]: [
        receipt,
        ...(current[selectedInsightModel.key] ?? []).filter(item => item.title !== receipt.title),
      ].slice(0, 4),
    }));

    if (action.linkedEventType) {
      const event = createProjectControlEvent(dataset.id, action.linkedEventType);
      const isRecovery = action.linkedEventType === 'recovery-approved';
      addProjectCommandEvent(dataset.id, {
        ...event,
        id: `${dataset.id}-programme-${selectedInsightModel.target.item.id}-${action.id}-${Date.now().toString(36)}`,
        title: isRecovery
          ? `Programme recovery approved: ${selectedInsightModel.target.item.name}`
          : `Programme blocker escalated: ${selectedInsightModel.target.item.name}`,
        description: `${action.title} from the programme chart. ${selectedInsightModel.why}`,
        affectedAreas: ['Programme', 'Cost', 'Risk', 'Stage Gates', 'Manager decisions'],
        affectedModule: 'ProjectCommand Programme',
        impactLabel: isRecovery
          ? `Recovery action approved for ${selectedInsightModel.target.item.name}; ProjectCommand recalculated float, risk, and forecast.`
          : `Programme action logged for ${selectedInsightModel.target.item.name}; ProjectCommand recalculated delay, cost, and risk exposure.`,
        cta: action.title,
        sourceModule: 'ProjectCommand',
        sourceObjectId: `programme-${selectedInsightModel.target.item.id}`,
        timestamp: new Date().toISOString(),
      });
    }
  };

  return (
    <div className="custom-scrollbar h-full overflow-x-hidden overflow-y-auto px-5 py-4 text-[#EEF3FA]" data-demo-anchor="project-programme">
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-3" data-demo-anchor="programme-contractor-accountability">
        <div className="rounded-lg border border-[rgba(46,127,255,0.18)] bg-[#0A1628] px-3 py-2 text-[12px] font-bold text-[#B8C7DB]">{formatMonthRange(project.startDate, project.targetHandover)}</div>
        <div className="flex rounded-lg border border-[rgba(46,127,255,0.18)] bg-[#0A1628] p-1">
          {(['Week', 'Month', 'Quarter'] as const).map(item => <button key={item} onClick={() => setZoom(item)} className={`rounded-md px-3 py-1.5 text-[11px] font-bold ${zoom === item ? 'bg-[#7C3AED]/25 text-[#C4B5FD]' : 'text-[#7A94B4]'}`}>{item}</button>)}
        </div>
        <button onClick={() => setBaseline(current => !current)} className={`rounded-lg border px-3 py-2 text-[11px] font-bold ${baseline ? 'border-[#7C3AED]/40 bg-[#7C3AED]/15 text-[#C4B5FD]' : 'border-[rgba(46,127,255,0.18)] text-[#7A94B4]'}`}>Baseline {baseline ? 'ON' : 'OFF'}</button>
        <button onClick={() => setCritical(current => !current)} className={`rounded-lg border px-3 py-2 text-[11px] font-bold ${critical ? 'border-[#D92B1C]/40 bg-[#D92B1C]/15 text-red-200' : 'border-[rgba(46,127,255,0.18)] text-[#7A94B4]'}`}>Critical Path {critical ? 'ON' : 'OFF'}</button>
        <div className="relative" data-demo-anchor="programme-contractor-filter">
          <button
            type="button"
            onClick={() => {
              if (demoContractorDropdownOpen) return;
              setContractorOpen(current => !current);
            }}
            className="flex h-10 min-w-[240px] items-center justify-between gap-3 rounded-lg border border-[rgba(46,127,255,0.18)] bg-[#0A1628] px-3 text-left text-[12px] font-bold text-[#B8C7DB] outline-none transition-colors hover:border-[rgba(46,127,255,0.32)]"
            aria-haspopup="listbox"
            aria-expanded={effectiveContractorOpen}
          >
            <span className="truncate">{contractorLabel}</span>
            <ChevronDown size={15} className={`shrink-0 transition-transform ${effectiveContractorOpen ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {effectiveContractorOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16 }}
                className="absolute left-0 top-[calc(100%+6px)] z-50 w-[280px] overflow-hidden rounded-xl border border-[rgba(46,127,255,0.24)] bg-[#07111F] p-1 shadow-2xl shadow-black/40"
                role="listbox"
                aria-label="Filter by contractors"
              >
                {contractorOptions.map(contractor => {
                  const checked = contractor === 'All contractors'
                    ? allContractorsSelected
                    : activeContractors.includes(contractor);
                  const demoActiveItem = demoCurrentContractor === contractor;

                  return (
                    <button
                      key={contractor}
                      type="button"
                      onClick={() => toggleContractor(contractor)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[12px] font-bold transition-colors ${
                        demoActiveItem
                          ? 'bg-cyan-300/18 text-cyan-50 ring-1 ring-cyan-200/60'
                          : checked
                          ? 'bg-[#1D7CFF]/18 text-[#DDE6F8]'
                          : 'text-[#9EB2CE] hover:bg-white/5 hover:text-[#EEF3FA]'
                      }`}
                      role="option"
                      aria-selected={checked}
                    >
                      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${checked ? 'border-[#7C3AED] bg-[#7C3AED] text-white' : 'border-[#264468] bg-[#0A1628]'}`}>
                        {checked && <Check size={11} />}
                      </span>
                      <span className="truncate">{contractor}</span>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.9fr)]">
        <div className="space-y-4">
          <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4" data-demo-anchor="programme-critical-path">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Construction Programme</h2>
              <span className="rounded-full border border-[rgba(46,127,255,0.35)] bg-[#0A1628] px-3 py-1 text-[11px] font-bold text-[#B8C7DB]">Zoom: {zoom}</span>
            </div>
            <GanttChart
              phases={filteredPhases}
              mode="full"
              showBaseline={baseline}
              showCriticalPath={critical}
              showWeather
              zoom={zoom}
              projectStart={project.startDate}
              projectEnd={project.targetHandover}
              emptyMessage="No programme activities match the selected contractor filter."
              onSelectItem={(selection: ProgrammeChartSelection) => openProgrammeInsight(selection.kind, selection.phase, selection.item, selection.label)}
              demoTimelineMs={demoTimelineMs}
            />
          </section>
          <div className="grid gap-4 2xl:grid-cols-2">
            <div data-demo-anchor="programme-recovery-window">
              <AIPanel title="Recovery Suggestion">
                <p className="text-[12px] leading-5 text-[#DDE6F8]">{recoverySuggestion}</p>
              </AIPanel>
            </div>
            <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4" data-demo-anchor="programme-delayed-activities">
              <h3 className="mb-3 text-sm font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Critical Path Focus</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {varianceEntries.map(([phase, days]) => {
                  const phaseItem = filteredPhases.find(item => item.name === phase) ?? phases.find(item => item.name === phase);
                  return (
                  <button
                    key={phase}
                    type="button"
                    onClick={() => phaseItem && openProgrammeInsight('variance-card', phaseItem, phaseItem, 'Critical Path Focus')}
                    className="rounded-lg border border-[rgba(46,127,255,0.12)] bg-[#0A1628] px-3 py-2 text-left transition hover:border-[rgba(46,127,255,0.36)] hover:bg-[#112040] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7FFF]/55"
                  >
                    <div className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">{phase}</div>
                    <div className={`mt-1 font-mono text-[15px] font-black ${days < 0 ? 'text-red-300' : 'text-emerald-300'}`}>{days}d</div>
                  </button>
                  );
                })}
                {varianceEntries.length === 0 && (
                  <div className="rounded-lg border border-dashed border-[rgba(46,127,255,0.18)] bg-[#0A1628] px-3 py-4 text-[11px] font-bold text-[#7A94B4]">
                    No variance items match the selected filter.
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
        <aside className="sticky top-0 space-y-4 self-start">
          <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4" data-demo-anchor="programme-handover-risk">
            <div className="mb-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>AI Delay Risk by Phase</h3>
                  <p className="mt-1 text-[10px] leading-4 text-[#8EA7C7]">
                    AI-estimated chance this phase may delay the programme, based on current schedule risk, variance, contractor, and critical-path status.
                  </p>
                </div>
                <span className="rounded-full border border-[#7C3AED]/24 bg-[#7C3AED]/12 px-2.5 py-1 text-[9px] font-black uppercase text-[#C4B5FD]">
                  Delay risk %
                </span>
              </div>
              <div className="mt-3 grid gap-1.5 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
                {[
                  ['Highest', highestDelayRisk ? `${highestDelayRisk.phase} ${highestDelayRisk.delayRiskPct}%` : 'No phase'],
                  ['Average', `${averageDelayRisk}% visible risk`],
                  ['Critical path', `${criticalPhaseCount} phase${criticalPhaseCount === 1 ? '' : 's'}`],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-[rgba(46,127,255,0.12)] bg-[#07111F]/72 px-2.5 py-2">
                    <p className="text-[8px] font-black uppercase tracking-[0.12em] text-[#5A6E88]">{label}</p>
                    <p className="mt-0.5 truncate text-[10px] font-black text-[#DCE8F8]">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-3 flex flex-wrap gap-1.5">
              {[
                ['0-19%', 'Low', 'border-emerald-300/24 bg-emerald-300/10 text-emerald-100'],
                ['20-39%', 'Watch', 'border-amber-300/24 bg-amber-300/10 text-amber-100'],
                ['40-59%', 'High', 'border-orange-300/24 bg-orange-400/10 text-orange-100'],
                ['60%+', 'Critical', 'border-red-300/24 bg-red-400/10 text-red-100'],
              ].map(([range, label, className]) => (
                <span key={label} className={`rounded-full border px-2 py-0.5 text-[8px] font-black uppercase ${className}`}>
                  {range} {label}
                </span>
              ))}
            </div>

            {delayData.length > 0 ? (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={delayData} layout="vertical" margin={{ left: 8, right: 34, top: 4, bottom: 4 }}>
                    <ReferenceArea x1={0} x2={20} fill="#38D98A" fillOpacity={0.04} />
                    <ReferenceArea x1={20} x2={40} fill="#F59E0B" fillOpacity={0.05} />
                    <ReferenceArea x1={40} x2={60} fill="#F97316" fillOpacity={0.06} />
                    <ReferenceArea x1={60} x2={100} fill="#EF4444" fillOpacity={0.05} />
                    <CartesianGrid stroke="rgba(46,127,255,0.18)" strokeDasharray="3 5" />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      ticks={[0, 25, 50, 75, 100]}
                      tickFormatter={value => `${value}%`}
                      tick={{ fill: '#7A94B4', fontSize: 10 }}
                    />
                    <YAxis type="category" dataKey="phase" tick={{ fill: '#B8C7DB', fontSize: 10 }} width={112} />
                    <Tooltip cursor={{ fill: 'rgba(124,58,237,0.10)' }} content={<DelayRiskTooltip />} />
                    <Bar dataKey="delayRiskPct" radius={[0, 8, 8, 0]} onClick={handleDelayRiskBarClick}>
                      {delayData.map(item => (
                        <Cell key={item.phase} fill={delayRiskBand(item.delayRiskPct).color} />
                      ))}
                      <LabelList
                        dataKey="delayRiskPct"
                        position="right"
                        formatter={(value: number) => `${value}%`}
                        style={{ fill: '#DCE8F8', fontSize: 10, fontWeight: 800 }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[rgba(46,127,255,0.18)] bg-[#07111F]/72 p-4 text-[11px] font-bold text-[#7A94B4]">
                No delay risk data matches the selected contractor filter.
              </div>
            )}
          </section>
          <AIPanel title="Critical Path Narrative"><p className="text-[12px] leading-5 text-[#DDE6F8]">{criticalPathNarrative}</p></AIPanel>
          <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
            <h3 className="mb-3 text-sm font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Resource Histogram</h3>
            <div className="h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resourceData}><XAxis dataKey="month" tick={{ fill: '#7A94B4', fontSize: 10 }} /><YAxis tick={{ fill: '#7A94B4', fontSize: 10 }} /><Bar dataKey="workers" fill="#00B894" radius={[6, 6, 0, 0]} /></BarChart>
              </ResponsiveContainer>
            </div>
            <button onClick={() => setWhatIfOpen(true)} className="mt-3 w-full rounded-lg border border-[#7C3AED]/35 bg-[#7C3AED]/15 px-3 py-2 text-[12px] font-bold text-[#C4B5FD]" data-demo-anchor="programme-recovery-action">Open What-if panel</button>
          </section>
        </aside>
      </div>
      <AnimatePresence>
        {whatIfOpen && (
          <motion.div initial={{ x: 420 }} animate={{ x: 0 }} exit={{ x: 420 }} className="fixed bottom-0 right-0 top-[52px] z-[1200] w-[400px] border-l border-[#7C3AED]/35 bg-[#0A1628] p-5 shadow-2xl">
            <button onClick={() => setWhatIfOpen(false)} className="float-right text-[#7A94B4]">Close</button>
            <h3 className="text-lg font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>What-if Delay</h3>
            <p className="mt-2 text-[12px] leading-5 text-[#B8C7DB]">If Substructure delays by {delayDays} days, downstream MEP and Fit-out activities shift automatically.</p>
            <input type="range" min={0} max={60} value={delayDays} onChange={event => setDelayDays(Number(event.target.value))} className="mt-6 w-full accent-[#7C3AED]" />
            <div className="mt-5 rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
              <div className="text-[11px] font-bold uppercase text-[#7A94B4]">New handover date</div>
              <div className="mt-2 text-2xl font-black text-[#D92B1C]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{formatShortDate(project.forecastCompletion)} + {delayDays}d</div>
              <div className="mt-3 text-[12px] text-[#B8C7DB]">Estimated cost impact: AED {(delayDays * 0.11).toFixed(1)}M</div>
            </div>
            <AIPanel title="AI Recovery Suggestion"><p className="text-[12px] leading-5 text-[#DDE6F8]">{recoverySuggestion}</p></AIPanel>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {selectedInsightModel && (
          <ProgrammeInsightSheet
            model={selectedInsightModel}
            receipts={programmeActionReceipts[selectedInsightKey] ?? []}
            actionStatuses={programmeActionStatuses}
            onRunAction={runProgrammeAction}
            onClose={() => setSelectedInsight(null)}
            demoTimelineMs={demoTimelineMs}
            demoAutoScroll={selectedInsight?.label === 'Authority path'}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
