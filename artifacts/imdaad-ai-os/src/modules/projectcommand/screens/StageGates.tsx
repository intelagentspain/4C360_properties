import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Clock3,
  ClipboardCheck,
  Download,
  FileCheck2,
  FileText,
  Flag,
  Search,
  Send,
  ShieldCheck,
  Target,
  UserRound,
  X,
  XCircle,
  CircleDot,
  Brain,
  ListChecks,
  MousePointer2,
  Sparkles,
} from 'lucide-react';
import {
  stageGateProjectBuckets,
  stageGates,
  stageGateTrend,
  type StageGate,
  type StageGateDeliverable,
  type StageGateStatusValue,
} from '../data/stageGates';
import { AIInsightBadge } from '../components/AIInsightBadge';

const statusStyles: Record<StageGateStatusValue, string> = {
  Approved: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300',
  Blocked: 'border-red-400/25 bg-red-400/10 text-red-300',
  'Pending Review': 'border-amber-400/25 bg-amber-400/10 text-amber-300',
  Open: 'border-cyan-400/25 bg-cyan-400/10 text-cyan-300',
};

const statusIcons: Record<StageGateStatusValue, typeof CheckCircle2> = {
  Approved: CheckCircle2,
  Blocked: XCircle,
  'Pending Review': Clock3,
  Open: CircleDot,
};

const statusColors: Record<StageGateStatusValue, string> = {
  Approved: '#22C55E',
  Blocked: '#EF4444',
  'Pending Review': '#F59E0B',
  Open: '#06B6D4',
};

type StageGateMetricName = 'Total Gates' | 'Approved' | 'Blocked' | 'Pending Review' | 'Active Blockers' | 'Avg Completion';
type StageGateDemoMetricName = 'Active Blockers' | 'Pending Review' | 'Evidence Gaps' | 'Avg Completion';

const STAGE_GATE_CARD_FLASH_START_MS = 10_000;
const STAGE_GATE_CARD_FLASH_INTERVAL_MS = 2_400;
const STAGE_GATE_CARD_FLASH_END_MS = 19_600;
const STAGE_GATE_CHAPTER_END_MS = 87_780;
const STAGE_GATE_BLOCKED_NARRATION_END_MS = 18_600;
const STAGE_GATE_REVIEW_BLOCKERS_FLASH_START_MS = STAGE_GATE_BLOCKED_NARRATION_END_MS;
const STAGE_GATE_REVIEW_BLOCKERS_FLASH_DURATION_MS = 3_000;
const STAGE_GATE_REVIEW_BLOCKERS_CLICK_START_MS = STAGE_GATE_REVIEW_BLOCKERS_FLASH_START_MS + STAGE_GATE_REVIEW_BLOCKERS_FLASH_DURATION_MS;
const STAGE_GATE_REVIEW_BLOCKERS_CLICK_DURATION_MS = 650;
const STAGE_GATE_AI_INSIGHT_OPEN_MS = STAGE_GATE_REVIEW_BLOCKERS_CLICK_START_MS + STAGE_GATE_REVIEW_BLOCKERS_CLICK_DURATION_MS;
const STAGE_GATE_AI_INSIGHT_SCROLL_START_MS = STAGE_GATE_AI_INSIGHT_OPEN_MS;
const STAGE_GATE_AI_INSIGHT_SCROLL_DURATION_MS = Math.max(1, (STAGE_GATE_CHAPTER_END_MS - STAGE_GATE_AI_INSIGHT_SCROLL_START_MS) / 2.8);
const STAGE_GATE_AI_INSIGHT_ACTION_MS = 51_800;
const STAGE_GATE_AI_INSIGHT_CLOSE_MS = 56_800;
const STAGE_GATE_PROOF_PACK_PREPARE_MS = 62_800;
const STAGE_GATE_DEMO_METRICS: StageGateDemoMetricName[] = ['Active Blockers', 'Pending Review', 'Evidence Gaps', 'Avg Completion'];
type StageGateDemoFlashState = 'active' | 'settled';

type StageGateMetricInsight = {
  metricName: StageGateMetricName;
  value: string;
  tone: 'positive' | 'monitor' | 'critical';
  summary: string;
  rationale: string[];
  interpretation: string;
  recommendation: string;
};

type StageGateMetricStats = {
  total: number;
  approved: number;
  blocked: number;
  pending: number;
  activeBlockers: number;
  avgCompletion: number;
  gatesWithBlockers: StageGate[];
  blockedGates: StageGate[];
  pendingGates: StageGate[];
};

function buildStageGateMetricInsight(metricName: StageGateMetricName, stats: StageGateMetricStats): StageGateMetricInsight {
  const approvedRate = Math.round((stats.approved / Math.max(stats.total, 1)) * 100);
  const blockedGateNames = stats.blockedGates.map(gate => gate.name).join(', ') || 'No blocked gates';
  const pendingGateNames = stats.pendingGates.map(gate => gate.name).join(', ') || 'No pending gates';
  const blockerOwners = stats.gatesWithBlockers.map(gate => `${gate.name} (${gate.blockers})`).join(', ') || 'No active blockers';

  switch (metricName) {
    case 'Total Gates':
      return {
        metricName,
        value: `${stats.total}`,
        tone: 'monitor',
        summary: `${stats.total} stage gates are currently governing project progression across the portfolio.`,
        rationale: [
          'The register combines planning, permitting, construction, and approval checkpoints.',
          `${stats.approved} gates are approved, ${stats.blocked} are blocked, and ${stats.pending} are awaiting review.`,
          'Every listed gate has linked deliverables, obligations, controls, and evidence requirements.',
        ],
        interpretation: 'This is a compact control layer. A small number of gates can unlock or delay major project stages, so data quality matters more than volume.',
        recommendation: 'Keep the gate set current as projects move into new stages, and add gates when a project introduces new authority, safety, or handover dependencies.',
      };
    case 'Approved':
      return {
        metricName,
        value: `${stats.approved}`,
        tone: 'positive',
        summary: `${stats.approved} gate is approved, representing ${approvedRate}% of the active gate register.`,
        rationale: [
          'Approved gates have completed their required criteria and evidence checks.',
          'The approved gate has no active blockers and a complete deliverable pack.',
          'Approval reduces downstream uncertainty because obligations and controls are already linked.',
        ],
        interpretation: 'The approved count is healthy, but the portfolio still needs attention because open and blocked gates can slow upcoming stage transitions.',
        recommendation: 'Use the approved gate as the quality benchmark, then compare its evidence pack against blocked and pending gates to close gaps faster.',
      };
    case 'Blocked':
      return {
        metricName,
        value: `${stats.blocked}`,
        tone: stats.blocked > 0 ? 'critical' : 'positive',
        summary: `${stats.blocked} gate is blocked: ${blockedGateNames}.`,
        rationale: [
          'Blocked gates are usually caused by missing evidence, unresolved design comments, or authority dependencies.',
          `${stats.activeBlockers} active blockers are visible across the gate register.`,
          'A blocked gate can prevent the next phase from starting or stop approval from being issued.',
        ],
        interpretation: 'This is the highest-priority gate metric because a blocked gate creates direct schedule and compliance risk.',
        recommendation: 'Escalate the blocked gate owner, confirm the missing criteria, and set a dated recovery action for each blocker before the next governance review.',
      };
    case 'Pending Review':
      return {
        metricName,
        value: `${stats.pending}`,
        tone: 'monitor',
        summary: `${stats.pending} gate is pending review: ${pendingGateNames}.`,
        rationale: [
          'Pending gates are close to decision but still need approver validation.',
          'The pending gate has most criteria completed, but at least one dependency remains open.',
          'Review delay can turn into schedule risk when the gate sits near a construction or authority milestone.',
        ],
        interpretation: 'This is a timing risk rather than a failure signal. The gate is likely recoverable if reviewer actions are handled quickly.',
        recommendation: 'Send the approver a concise evidence summary, highlight open items, and request a decision date so the gate does not drift.',
      };
    case 'Active Blockers':
      return {
        metricName,
        value: `${stats.activeBlockers}`,
        tone: stats.activeBlockers > 3 ? 'critical' : 'monitor',
        summary: `${stats.activeBlockers} blockers are active across ${stats.gatesWithBlockers.length} gate${stats.gatesWithBlockers.length === 1 ? '' : 's'}.`,
        rationale: [
          `Current blocker distribution: ${blockerOwners}.`,
          'Blockers are concentrated in gates that have incomplete criteria or pending deliverables.',
          'The larger the blocker count, the more likely the governance meeting becomes a recovery meeting.',
        ],
        interpretation: 'Active blockers are the operational work queue behind the gate status. Reducing them is the fastest way to improve approval flow.',
        recommendation: 'Start with the Design Approval Gate. Create one blocker-clearance pack for the three active blockers: Authority Submission Pack, MEP Coordination Sign-off, and Design Risk Review. Give each item an owner and a same-day decision path.',
      };
    case 'Avg Completion':
      return {
        metricName,
        value: `${stats.avgCompletion}%`,
        tone: stats.avgCompletion >= 80 ? 'positive' : 'monitor',
        summary: `Average gate completion is ${stats.avgCompletion}% across all active stage gates.`,
        rationale: [
          'Completion is calculated from criteria closed versus total criteria for each gate.',
          'Approved and pending gates pull the average up, while open construction commencement criteria pull it down.',
          'The current trend is improving, but blocked items can still cap the completion score.',
        ],
        interpretation: 'The portfolio is broadly progressing, but completion percentage only becomes meaningful when blockers and evidence gaps are also under control.',
        recommendation: 'Target the lowest-completion gate first, then use AI review to identify missing evidence and criteria that can be closed this week.',
      };
  }
}

function recommendationActionLabel(metricName: StageGateMetricName) {
  switch (metricName) {
    case 'Total Gates':
      return 'Prepare gate review pack';
    case 'Approved':
      return 'Use as evidence benchmark';
    case 'Blocked':
      return 'Create recovery action plan';
    case 'Pending Review':
      return 'Send approver decision pack';
    case 'Active Blockers':
      return 'Create blocker clearance pack';
    case 'Avg Completion':
      return 'Target lowest-completion gate';
  }
}

function StageGateMetricInsightPanel({
  insight,
  actioned,
  actionAvailable,
  onActionRecommendation,
  onClose,
  demoScrollProgress,
}: {
  insight: StageGateMetricInsight;
  actioned?: boolean;
  actionAvailable: boolean;
  onActionRecommendation: (metricName: StageGateMetricName) => void;
  onClose: () => void;
  demoScrollProgress?: number;
}) {
  const toneClasses = {
    positive: 'border-emerald-300/30 bg-emerald-300/10 text-emerald-200',
    monitor: 'border-cyan-300/30 bg-cyan-300/10 text-cyan-200',
    critical: 'border-red-300/30 bg-red-300/10 text-red-200',
  };
  const actionLabel = recommendationActionLabel(insight.metricName);
  const insightScrollRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof demoScrollProgress !== 'number') return undefined;

    const frame = window.requestAnimationFrame(() => {
      const scroller = insightScrollRef.current;
      if (!scroller) return;
      const maxScroll = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
      const progress = Math.max(0, Math.min(1, demoScrollProgress));
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      scroller.scrollTop = maxScroll * eased;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [demoScrollProgress]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
      <button type="button" aria-label="Close AI insight" className="absolute inset-0 cursor-default" onClick={onClose} />
      <aside
        ref={insightScrollRef}
        className="custom-scrollbar relative z-10 h-full w-full max-w-[470px] overflow-y-auto border-l border-[rgba(46,127,255,0.22)] bg-[#07111F] p-5 shadow-2xl shadow-black/60"
        data-demo-anchor="project-stage-ai-blockers-modal"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-300/30 bg-violet-300/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-violet-200">
              <Sparkles size={13} />
              AI Insight
            </span>
            <h2 className="mt-4 text-2xl font-black leading-7 text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              AI Insight - {insight.metricName}
            </h2>
            <p className="mt-2 text-sm text-[#8FA6C3]">Stage gate metric explanation</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close AI insight"
            className="rounded-lg p-2 text-[#7A94B4] transition-colors hover:bg-white/5 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className={`mt-5 rounded-2xl border p-4 ${toneClasses[insight.tone]}`}>
          <p className="text-[11px] font-black uppercase tracking-widest opacity-80">Current value</p>
          <p className="mt-2 text-4xl font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{insight.value}</p>
        </div>

        <section className="mt-4 rounded-2xl border border-[rgba(46,127,255,0.18)] bg-[#0A1628] p-4" data-demo-anchor="project-stage-ai-blocker-summary">
          <div className="flex items-center gap-2 text-[13px] font-black text-[#EEF3FA]">
            <Brain size={16} className="text-violet-300" />
            Summary
          </div>
          <p className="mt-3 text-[14px] leading-6 text-[#BCC8DC]">{insight.summary}</p>
        </section>

        <section className="mt-4 rounded-2xl border border-[rgba(46,127,255,0.18)] bg-[#0A1628] p-4" data-demo-anchor="project-stage-ai-blocker-rationale">
          <div className="flex items-center gap-2 text-[13px] font-black text-[#EEF3FA]">
            <ListChecks size={16} className="text-cyan-300" />
            Rationale
          </div>
          <ul className="mt-3 space-y-2">
            {insight.rationale.map(item => (
              <li key={item} className="flex gap-2 text-[13px] leading-6 text-[#BCC8DC]">
                <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-cyan-300" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-4 rounded-2xl border border-[rgba(46,127,255,0.18)] bg-[#0A1628] p-4" data-demo-anchor="project-stage-ai-blocker-interpretation">
          <div className="flex items-center gap-2 text-[13px] font-black text-[#EEF3FA]">
            <BarChart3 size={16} className="text-blue-300" />
            Interpretation
          </div>
          <p className="mt-3 text-[14px] leading-6 text-[#BCC8DC]">{insight.interpretation}</p>
        </section>

        <section className="mt-4 rounded-2xl border border-violet-300/20 bg-violet-300/10 p-4" data-demo-anchor="project-stage-ai-blocker-recommendation">
          <div className="flex items-center gap-2 text-[13px] font-black text-violet-100">
            <Sparkles size={16} />
            Recommendation
          </div>
          <p className="mt-3 text-[14px] leading-6 text-[#E5D9FF]">{insight.recommendation}</p>
          <div className="mt-4 rounded-xl border border-violet-200/14 bg-[#07111F]/62 p-3" data-demo-anchor="project-stage-ai-blocker-action">
            <div className="flex items-start gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-violet-200">
              <Send size={14} />
              Prepared action
            </div>
            <p className="mt-2 text-[12px] leading-5 text-[#B8C7DB]">
              Prepare the owner brief, due time, and evidence checklist for the gate that is blocking progress.
            </p>
            <button
              type="button"
              disabled={!actionAvailable}
              onClick={() => onActionRecommendation(insight.metricName)}
              className={`mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border px-4 text-[12px] font-black transition-colors ${!actionAvailable ? 'cursor-not-allowed border-slate-400/16 bg-slate-400/8 text-slate-400' : actioned ? 'border-emerald-300/28 bg-emerald-300/12 text-emerald-100' : 'border-violet-200/24 bg-violet-300/12 text-violet-100 hover:bg-violet-300/18'}`}
            >
              {actioned ? <CheckCircle2 size={15} /> : <Send size={15} />}
              {!actionAvailable ? 'No matching gate in current filters' : actioned ? 'Blocker pack ready' : actionLabel}
            </button>
            <p className="mt-2 text-[10px] leading-4 text-[#7A94B4]">
              {actionAvailable ? 'Creates a demo-safe manager action inside Stage Gates. No email, approval, or backend workflow is sent.' : 'Clear or change the Gate Filters to action this recommendation.'}
            </p>
          </div>
        </section>
      </aside>
    </div>
  );
}

function StatusBadge({ status }: { status: StageGateStatusValue }) {
  const Icon = statusIcons[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-black ${statusStyles[status]}`}>
      <Icon size={12} />
      {status}
    </span>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  accent,
  delta,
  metricName,
  onExplain,
  demoFlashState,
  demoAnchor,
  aiAnchor,
}: {
  icon: typeof Target;
  label: string;
  value: string | number;
  accent: string;
  delta?: string;
  metricName?: StageGateMetricName;
  onExplain?: (metricName: StageGateMetricName) => void;
  demoFlashState?: StageGateDemoFlashState;
  demoAnchor?: string;
  aiAnchor?: string;
}) {
  return (
    <div
      className={`relative rounded-xl border bg-[rgba(17,32,64,0.78)] p-4 transition-all duration-300 ${
        demoFlashState === 'active'
          ? 'animate-pulse border-cyan-200/80 shadow-[0_0_34px_rgba(34,211,238,0.34)] ring-1 ring-cyan-100/35 [animation-duration:2.8s]'
          : demoFlashState === 'settled'
            ? 'border-cyan-300/36 shadow-[0_0_18px_rgba(34,211,238,0.16)] ring-1 ring-cyan-300/18'
            : 'border-[rgba(46,127,255,0.18)]'
      }`}
      data-demo-anchor={demoAnchor}
      data-demo-stage-flash-state={demoFlashState ?? 'idle'}
      data-demo-stage-metric={label}
    >
      {metricName && onExplain && <AIInsightBadge onClick={() => onExplain(metricName)} demoAnchor={aiAnchor} />}
      <div className={`flex items-start justify-between gap-3 ${metricName ? 'pr-10' : ''}`}>
        <span className="grid h-8 w-8 place-items-center rounded-lg border" style={{ borderColor: `${accent}55`, background: `${accent}18`, color: accent }}>
          <Icon size={17} />
        </span>
        {delta && <span className="font-mono text-[11px] font-black text-emerald-300">{delta}</span>}
      </div>
      <p className="mt-4 text-2xl font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{value}</p>
      <p className="mt-1 text-[13px] text-[#7A94B4]">{label}</p>
    </div>
  );
}

function GateStatusDonut({ gates }: { gates: StageGate[] }) {
  const statuses: StageGateStatusValue[] = ['Approved', 'Pending Review', 'Blocked', 'Open'];
  const segments = statuses.map(status => ({ status, value: gates.filter(gate => gate.status === status).length, color: statusColors[status] }));
  const total = Math.max(gates.length, 1);
  let offset = 25;

  return (
    <div className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
      <h3 className="text-[13px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Gate Status</h3>
      <div className="mt-3 flex items-center gap-6">
        <svg viewBox="0 0 42 42" className="h-20 w-20 -rotate-90">
          <circle cx="21" cy="21" r="15.5" fill="none" stroke="#2A3442" strokeWidth="5" />
          {segments.map(segment => {
            const dash = (segment.value / total) * 100;
            const circle = (
              <circle
                key={segment.status}
                cx="21"
                cy="21"
                r="15.5"
                fill="none"
                stroke={segment.color}
                strokeDasharray={`${dash} ${100 - dash}`}
                strokeDashoffset={offset}
                strokeLinecap="butt"
                strokeWidth="5"
              />
            );
            offset -= dash;
            return circle;
          })}
        </svg>
        <div className="min-w-0 flex-1 space-y-2">
          {segments.map(segment => (
            <div key={segment.status} className="flex items-center justify-between gap-8 text-[13px] text-[#A8B3C7]">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: segment.color }} />
                {segment.status}
              </span>
              <span className="font-mono text-[#A8B3C7]">{segment.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProjectBars({ gates }: { gates: StageGate[] }) {
  const max = Math.max(...stageGateProjectBuckets.map(project => gates.filter(item => item.project.includes(project.toLowerCase())).length), 1);

  return (
    <div className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
      <h3 className="text-[13px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>By Project</h3>
      <div className="mt-4 flex h-[86px] items-end gap-4 border-b border-l border-[#3B4658] px-4">
        {stageGateProjectBuckets.map(project => {
          const count = gates.filter(item => item.project.includes(project.toLowerCase())).length;
          return (
            <div key={project} className="flex flex-1 flex-col items-center gap-2">
              <div className="w-full rounded-t-sm bg-cyan-400" style={{ height: `${Math.max((count / max) * 58, count ? 12 : 0)}px` }} />
              <span className="text-[10px] text-[#5A6E88]">{project}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CompletionTrend() {
  const max = 100;
  const points = stageGateTrend.map((item, index) => {
    const x = 8 + (index / (stageGateTrend.length - 1)) * 84;
    const y = 78 - (item.completion / max) * 54;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
      <h3 className="text-[13px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Completion Trend</h3>
      <svg viewBox="0 0 100 86" className="mt-2 h-[86px] w-full">
        <line x1="8" y1="78" x2="98" y2="78" stroke="#3B4658" strokeWidth="0.8" />
        <line x1="8" y1="24" x2="98" y2="24" stroke="#2A3442" strokeDasharray="2 3" strokeWidth="0.6" />
        <polyline points={points} fill="none" stroke="#06B6D4" strokeLinecap="round" strokeWidth="1.8" />
        {stageGateTrend.map((item, index) => {
          const x = 8 + (index / (stageGateTrend.length - 1)) * 84;
          const y = 78 - (item.completion / max) * 54;
          return (
            <g key={item.month}>
              <circle cx={x} cy={y} r="1.8" fill="#06B6D4" />
              <text x={x} y="84" textAnchor="middle" fill="#5A6E88" fontSize="4">{item.month}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function ProgressBar({ gate }: { gate: StageGate }) {
  const color = gate.status === 'Approved' ? '#22C55E' : gate.status === 'Blocked' ? '#EF4444' : '#06B6D4';

  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 w-12 rounded-full bg-[#243448]">
        <div className="h-full rounded-full" style={{ width: `${gate.completion}%`, background: color }} />
      </div>
      <span className="font-mono text-[12px] text-[#A8B3C7]">{gate.completion}%</span>
    </div>
  );
}

type GateActionTone = 'critical' | 'review' | 'open' | 'clear';

type GateActionPlan = {
  headline: string;
  detail: string;
  cta: string;
  toast: string;
  tone: GateActionTone;
};

const actionToneStyles: Record<GateActionTone, string> = {
  critical: 'border-red-300/28 bg-red-400/12 text-red-100',
  review: 'border-amber-300/28 bg-amber-300/12 text-amber-100',
  open: 'border-cyan-300/28 bg-cyan-300/12 text-cyan-100',
  clear: 'border-emerald-300/28 bg-emerald-300/12 text-emerald-100',
};

function formatProjectName(project: string) {
  return project
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getIncompleteDeliverables(gate: StageGate) {
  return gate.deliverables.filter(deliverable => deliverable.status !== 'Complete');
}

function getGatePriorityScore(gate: StageGate) {
  const statusWeight = gate.status === 'Blocked' ? 80 : gate.status === 'Pending Review' ? 56 : gate.status === 'Open' ? 36 : 8;
  return statusWeight + gate.blockers * 8 + (100 - gate.completion) / 5;
}

function getGateActionPlan(gate: StageGate): GateActionPlan {
  const incomplete = getIncompleteDeliverables(gate);
  const firstMissing = incomplete[0]?.name ?? 'gate evidence pack';

  if (gate.status === 'Blocked') {
    return {
      headline: 'Recovery action required',
      detail: `${gate.blockers} blocker${gate.blockers === 1 ? '' : 's'} are stopping this gate. Start with ${firstMissing}.`,
      cta: 'Queue recovery action',
      toast: `Recovery action queued for ${gate.code}`,
      tone: 'critical',
    };
  }

  if (gate.status === 'Pending Review') {
    return {
      headline: 'Ready for approver decision',
      detail: `${gate.criteriaComplete}/${gate.criteriaTotal} criteria are closed. Send a short decision pack to ${gate.approver}.`,
      cta: 'Send review nudge',
      toast: `Review nudge queued for ${gate.approver}`,
      tone: 'review',
    };
  }

  if (gate.status === 'Open') {
    return {
      headline: 'Build the evidence pack',
      detail: `${incomplete.length} deliverable${incomplete.length === 1 ? '' : 's'} still need closure before this can move to review.`,
      cta: 'Request missing evidence',
      toast: `Evidence request queued for ${gate.code}`,
      tone: 'open',
    };
  }

  return {
    headline: 'Approved, keep monitored',
    detail: 'Gate is approved. Keep linked obligations and control evidence current until the next stage review.',
    cta: 'Log monitoring note',
    toast: `Monitoring note logged for ${gate.code}`,
    tone: 'clear',
  };
}

function getRecommendationTarget(metricName: StageGateMetricName, gates: StageGate[]) {
  switch (metricName) {
    case 'Active Blockers':
    case 'Blocked':
      return gates.find(gate => gate.status === 'Blocked' || gate.blockers > 0);
    case 'Pending Review':
      return gates.find(gate => gate.status === 'Pending Review');
    case 'Avg Completion':
      return [...gates].sort((a, b) => a.completion - b.completion)[0];
    case 'Approved':
      return gates.find(gate => gate.status === 'Approved');
    case 'Total Gates':
      return [...gates].sort((a, b) => getGatePriorityScore(b) - getGatePriorityScore(a))[0];
  }
}

function GateActionButton({
  gate,
  queuedAction,
  onAction,
}: {
  gate: StageGate;
  queuedAction?: string;
  onAction: (gate: StageGate, action: GateActionPlan) => void;
}) {
  const action = getGateActionPlan(gate);
  const isQueued = queuedAction === action.cta;

  return (
    <button
      type="button"
      onClick={() => onAction(gate, action)}
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-[11px] font-black transition-colors ${isQueued ? 'border-emerald-300/30 bg-emerald-300/12 text-emerald-100' : actionToneStyles[action.tone]}`}
    >
      {isQueued ? <CheckCircle2 size={14} /> : <Send size={14} />}
      {isQueued ? 'Queued' : action.cta}
    </button>
  );
}

function GateFocusPanel({
  gate,
  queuedAction,
  onAction,
  onOpen,
  readinessProgress = 1,
  highlightBlockers = false,
}: {
  gate: StageGate;
  queuedAction?: string;
  onAction: (gate: StageGate, action: GateActionPlan) => void;
  onOpen: (gate: StageGate) => void;
  readinessProgress?: number;
  highlightBlockers?: boolean;
}) {
  const action = getGateActionPlan(gate);
  const incomplete = getIncompleteDeliverables(gate);
  const progressColor = gate.status === 'Approved' ? '#22C55E' : gate.status === 'Blocked' ? '#EF4444' : gate.status === 'Pending Review' ? '#F59E0B' : '#06B6D4';
  const readinessDisplay = Math.round(gate.completion * Math.max(0, Math.min(1, readinessProgress)));

  return (
    <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.82)] p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-red-300/22 bg-red-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-red-100">
              <Flag size={13} />
              Priority Gate In View
            </span>
            <StatusBadge status={gate.status} />
          </div>
          <h2 className="mt-4 text-xl font-black leading-6 text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {gate.name}
          </h2>
          <p className="mt-2 text-[13px] leading-5 text-[#9DB2CE]">{action.detail}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <GateActionButton gate={gate} queuedAction={queuedAction} onAction={onAction} />
          <button
            type="button"
            onClick={() => onOpen(gate)}
            data-demo-action="open-stage-gate-pack"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-cyan-300/24 bg-cyan-300/10 px-3 text-[11px] font-black text-cyan-100 transition-colors hover:bg-cyan-300/15"
          >
            <FileText size={14} />
            Open gate pack
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Approver', value: gate.approver, icon: <UserRound key="approver" size={14} /> },
          { label: 'Target', value: gate.targetDate, icon: <CalendarClock key="target" size={14} /> },
          { label: 'Criteria', value: `${gate.criteriaComplete}/${gate.criteriaTotal} closed`, icon: <ClipboardCheck key="criteria" size={14} /> },
          { label: 'Blockers', value: gate.blockers ? `${gate.blockers} active` : 'None', icon: <AlertTriangle key="blockers" size={14} /> },
        ].map(({ label, value, icon }) => {
          const isBlockerFocus = label === 'Blockers' && highlightBlockers;
          return (
            <div
              key={label}
              data-demo-stage-focus={label === 'Blockers' ? 'blockers-card' : undefined}
              className={`rounded-lg border px-3 py-2 transition-all duration-500 ${
                isBlockerFocus
                  ? 'border-red-300/60 bg-red-400/14 shadow-[0_0_0_1px_rgba(248,113,113,0.34),0_0_34px_rgba(239,68,68,0.30)] animate-pulse'
                  : 'border-[rgba(46,127,255,0.12)] bg-[#07111F]/76'
              }`}
            >
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.14em] text-[#6D85A5]">
                {icon}
                {label}
              </div>
              <p className="mt-1 truncate text-[12px] font-black text-[#DCE8F8]">{value}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-lg border border-[rgba(46,127,255,0.12)] bg-[#07111F]/72 p-3">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#7A94B4]">Gate readiness</span>
          <span className="font-mono text-[11px] font-black text-[#DCE8F8]">{readinessDisplay}%</span>
        </div>
        <div className="h-2 rounded-full bg-[#243448]">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            data-demo-stage-focus="readiness-bar"
            style={{ width: `${readinessDisplay}%`, background: progressColor }}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {incomplete.length ? incomplete.slice(0, 4).map(deliverable => (
            <span key={deliverable.documentCode} className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${deliverable.status === 'Blocked' ? 'border-red-300/24 bg-red-400/10 text-red-100' : 'border-amber-300/24 bg-amber-300/10 text-amber-100'}`}>
              {deliverable.status}: {deliverable.name}
            </span>
          )) : (
            <span className="rounded-full border border-emerald-300/24 bg-emerald-300/10 px-2.5 py-1 text-[10px] font-black text-emerald-100">
              Evidence pack complete
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

function GateFocusEmptyPanel() {
  return (
    <section className="rounded-xl border border-dashed border-[rgba(46,127,255,0.22)] bg-[rgba(17,32,64,0.66)] p-5">
      <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/22 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100">
        <Flag size={13} />
        Priority Gate In View
      </span>
      <h2 className="mt-4 text-xl font-black leading-6 text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
        No gate matches the current filters
      </h2>
      <p className="mt-2 max-w-2xl text-[13px] leading-5 text-[#9DB2CE]">
        Adjust the Gate Filters to bring a gate back into the control board.
      </p>
      <div className="mt-4 rounded-lg border border-[rgba(46,127,255,0.12)] bg-[#07111F]/72 p-3 text-[12px] leading-5 text-[#7A94B4]">
        Filtered views never fall back to unrelated gates, so the focus panel stays aligned with the selected view.
      </div>
    </section>
  );
}

function DecisionLane({ status, gates }: { status: StageGateStatusValue; gates: StageGate[] }) {
  const Icon = statusIcons[status];
  const count = gates.filter(gate => gate.status === status).length;
  const percent = Math.round((count / Math.max(gates.length, 1)) * 100);
  const meaning: Record<StageGateStatusValue, string> = {
    Approved: 'Released',
    Blocked: 'Needs owner action',
    'Pending Review': 'Needs approver decision',
    Open: 'Needs evidence closure',
  };

  return (
    <div className="rounded-lg border border-[rgba(46,127,255,0.14)] bg-[#07111F]/74 p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-[12px] font-black text-[#EEF3FA]">
          <Icon size={15} style={{ color: statusColors[status] }} />
          {status}
        </span>
        <span className="font-mono text-[13px] font-black text-[#DCE8F8]">{count}</span>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-[#243448]">
        <div className="h-full rounded-full" style={{ width: `${percent}%`, background: statusColors[status] }} />
      </div>
      <p className="mt-2 text-[10px] leading-4 text-[#8EA7C7]">{meaning[status]}</p>
    </div>
  );
}

function GateActionCard({
  gate,
  queuedAction,
  onAction,
  onOpen,
}: {
  gate: StageGate;
  queuedAction?: string;
  onAction: (gate: StageGate, action: GateActionPlan) => void;
  onOpen: (gate: StageGate) => void;
}) {
  const action = getGateActionPlan(gate);
  const incomplete = getIncompleteDeliverables(gate);
  const GateIcon = statusIcons[gate.status];

  return (
    <article className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#0A1628]/82 p-4 transition-colors hover:border-cyan-300/28 hover:bg-[#0D1C31]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] font-black text-cyan-300">{gate.code}</span>
            <StatusBadge status={gate.status} />
            {gate.blockers > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-red-400/25 bg-red-400/10 px-2.5 py-1 text-[11px] font-black text-red-200">
                <AlertTriangle size={12} />
                {gate.blockers} blocker{gate.blockers === 1 ? '' : 's'}
              </span>
            )}
          </div>
          <h3 className="mt-3 flex items-start gap-2 text-[15px] font-black leading-5 text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            <GateIcon size={17} className="mt-0.5 flex-shrink-0 text-[#7A94B4]" />
            {gate.name}
          </h3>
          <p className="mt-1 text-[12px] text-[#8EA7C7]">{formatProjectName(gate.project)} - {gate.stage}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <GateActionButton gate={gate} queuedAction={queuedAction} onAction={onAction} />
          <button
            type="button"
            onClick={() => onOpen(gate)}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[rgba(46,127,255,0.22)] bg-white/[0.035] px-3 text-[11px] font-black text-[#B8C7DB] transition-colors hover:border-cyan-300/35 hover:text-white"
          >
            Review
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_0.78fr]">
        <div className="rounded-lg border border-[rgba(46,127,255,0.12)] bg-[#07111F]/76 p-3">
          <div className="flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.13em] text-[#6D85A5]">
            <span>{action.headline}</span>
            <span>{gate.completion}%</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-[#243448]">
            <div className="h-full rounded-full" style={{ width: `${gate.completion}%`, background: statusColors[gate.status] }} />
          </div>
          <p className="mt-2 text-[12px] leading-5 text-[#B8C7DB]">{action.detail}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-[rgba(46,127,255,0.12)] bg-[#07111F]/76 p-3">
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#6D85A5]">Approver</p>
            <p className="mt-1 truncate text-[12px] font-black text-[#DCE8F8]">{gate.approver}</p>
          </div>
          <div className="rounded-lg border border-[rgba(46,127,255,0.12)] bg-[#07111F]/76 p-3">
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#6D85A5]">Target</p>
            <p className="mt-1 font-mono text-[12px] font-black text-[#DCE8F8]">{gate.targetDate}</p>
          </div>
          <div className="rounded-lg border border-[rgba(46,127,255,0.12)] bg-[#07111F]/76 p-3">
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#6D85A5]">Criteria</p>
            <p className="mt-1 font-mono text-[12px] font-black text-[#DCE8F8]">{gate.criteriaComplete}/{gate.criteriaTotal}</p>
          </div>
          <div className="rounded-lg border border-[rgba(46,127,255,0.12)] bg-[#07111F]/76 p-3">
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#6D85A5]">Evidence gaps</p>
            <p className="mt-1 font-mono text-[12px] font-black text-[#DCE8F8]">{incomplete.length}</p>
          </div>
        </div>
      </div>
    </article>
  );
}

function GateDetailCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#0A1628] p-4">
      <p className="text-[12px] text-[#7A94B4]">{label}</p>
      <div className="mt-3 text-[15px] font-black leading-5 text-[#EEF3FA]">{children}</div>
    </div>
  );
}

function TokenGroup({ label, tokens, tone }: { label: string; tokens: string[]; tone: 'violet' | 'blue' | 'cyan' }) {
  const classes = {
    violet: 'border-violet-400/30 bg-violet-400/10 text-violet-200',
    blue: 'border-blue-400/30 bg-blue-400/10 text-blue-200',
    cyan: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200',
  };

  return (
    <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#0A1628] p-4">
      <p className="text-[12px] text-[#7A94B4]">{label}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {tokens.map(token => (
          <span key={token} className={`rounded-md border px-3 py-1.5 font-mono text-[12px] font-black ${classes[tone]}`}>
            {token}
          </span>
        ))}
      </div>
    </section>
  );
}

function GateDeliverablePreview({ deliverable }: { deliverable: StageGateDeliverable }) {
  return (
    <section className="overflow-hidden rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#0A1628]">
      <div className="border-b border-[rgba(46,127,255,0.14)] bg-[#0F2038] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] font-black uppercase tracking-widest text-cyan-300">{deliverable.documentCode}</p>
            <h4 className="mt-2 text-base font-black leading-6 text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{deliverable.name}</h4>
            <p className="mt-1 text-[12px] text-[#8FA6C3]">{deliverable.documentType}</p>
          </div>
          <span className={`rounded-md px-2.5 py-1 text-[11px] font-black ${deliverable.status === 'Complete' ? 'bg-emerald-400/10 text-emerald-300' : deliverable.status === 'Blocked' ? 'bg-red-400/10 text-red-300' : 'bg-amber-400/10 text-amber-300'}`}>
            {deliverable.status}
          </span>
        </div>
        <p className="mt-3 text-[13px] leading-6 text-[#BCC8DC]">{deliverable.previewSummary}</p>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-2">
          {deliverable.previewFields.map(field => (
            <div key={field.label} className="rounded-lg border border-[rgba(46,127,255,0.12)] bg-[#07111F] p-3">
              <p className="text-[11px] text-[#7A94B4]">{field.label}</p>
              <p className="mt-1 text-[13px] font-black text-[#EEF3FA]">{field.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 bg-[#F7FAFF] p-4 text-[#101827]">
          <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-3">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">Document preview</p>
            <p className="font-mono text-[10px] font-black text-cyan-700">{deliverable.documentCode}</p>
          </div>
          <ul className="space-y-2">
            {deliverable.previewLines.map(line => (
              <li key={line} className="flex gap-2 text-[12px] leading-5 text-slate-700">
                <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-cyan-500" />
                {line}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-end">
            <span className="rounded-full border-2 border-cyan-500/70 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-cyan-700">
              Preview only
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function StageGateDetailModal({
  gate,
  onClose,
  onToast,
  demoScrollProgress,
}: {
  gate: StageGate;
  onClose: () => void;
  onToast?: (message: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
  demoScrollProgress?: number;
}) {
  const progressColor = gate.status === 'Approved' ? '#22C55E' : gate.status === 'Blocked' ? '#EF4444' : gate.status === 'Pending Review' ? '#F59E0B' : '#06B6D4';
  const [selectedDeliverable, setSelectedDeliverable] = useState<StageGateDeliverable>(gate.deliverables[0]);
  const detailScrollRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof demoScrollProgress !== 'number') return undefined;

    const frame = window.requestAnimationFrame(() => {
      const scroller = detailScrollRef.current;
      if (!scroller) return;
      const maxScroll = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
      scroller.scrollTop = maxScroll * Math.max(0, Math.min(1, demoScrollProgress));
    });

    return () => window.cancelAnimationFrame(frame);
  }, [demoScrollProgress]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <button type="button" aria-label="Dismiss stage gate detail" className="absolute inset-0 cursor-default" onClick={onClose} />
      <aside
        ref={detailScrollRef}
        className="custom-scrollbar relative z-10 max-h-[92vh] w-full max-w-[760px] overflow-y-auto rounded-2xl border border-[rgba(46,127,255,0.2)] bg-[#07111F] p-5 shadow-2xl shadow-black/60"
        data-demo-anchor="project-stage-gate-pack-modal"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[12px] font-black text-cyan-300">{gate.code}</span>
              <StatusBadge status={gate.status} />
            </div>
            <h2 className="mt-4 text-2xl font-black leading-7 text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{gate.name}</h2>
            <p className="mt-3 text-[15px] text-[#B8C7DB]">{gate.stage}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close gate details"
            className="rounded-lg p-2 text-[#7A94B4] transition-colors hover:bg-white/5 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <GateDetailCard label="Project">{gate.project}</GateDetailCard>
          <GateDetailCard label="Approver">{gate.approver}</GateDetailCard>
          <GateDetailCard label="Target Date">{gate.targetDate}</GateDetailCard>
          <GateDetailCard label="Completion Rate">
            <div className="flex items-center gap-3">
              <div className="h-2 flex-1 rounded-full bg-[#243448]">
                <div className="h-full rounded-full" style={{ width: `${gate.completion}%`, background: progressColor }} />
              </div>
              <span>{gate.completion}%</span>
            </div>
          </GateDetailCard>
        </div>

        <section className="mt-6">
          <h3 className="mb-3 text-[15px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Gate Deliverables</h3>
          <div className="space-y-2">
            {gate.deliverables.map(deliverable => (
              <button
                key={deliverable.name}
                type="button"
                onClick={() => setSelectedDeliverable(deliverable)}
                className={`flex w-full items-center justify-between gap-4 rounded-xl border p-4 text-left transition-colors ${selectedDeliverable.documentCode === deliverable.documentCode ? 'border-cyan-300/45 bg-cyan-300/10' : 'border-[rgba(46,127,255,0.18)] bg-[#0A1628] hover:bg-white/[0.035]'}`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <FileText size={17} className="flex-shrink-0 text-[#7A94B4]" />
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-medium text-[#EEF3FA]">{deliverable.name}</p>
                    <p className="mt-1 font-mono text-[10px] font-black text-cyan-300">{deliverable.documentCode}</p>
                  </div>
                </div>
                <span className={`flex-shrink-0 text-[12px] font-black ${deliverable.status === 'Complete' ? 'text-emerald-300' : deliverable.status === 'Blocked' ? 'text-red-300' : 'text-amber-300'}`}>
                  {deliverable.status}
                </span>
              </button>
            ))}
          </div>
        </section>

        <div className="mt-4">
          <GateDeliverablePreview deliverable={selectedDeliverable} />
        </div>

        <div className="mt-5 grid gap-4">
          <TokenGroup label="Linked Obligations" tokens={gate.linkedObligations} tone="violet" />
          <TokenGroup label="Linked Controls" tokens={gate.linkedControls} tone="blue" />
          <TokenGroup label="Required Evidence" tokens={gate.requiredEvidence} tone="cyan" />
          <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#0A1628] p-4">
            <p className="text-[12px] text-[#7A94B4]">AI Gate Note</p>
            <p className="mt-3 text-[14px] leading-6 text-[#BCC8DC]">{gate.notes}</p>
          </section>
        </div>

        <button
          type="button"
          onClick={() => onToast?.(`Gate review summary queued for ${gate.code}`, 'success')}
          className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-4 text-[13px] font-black text-cyan-300 transition-colors hover:bg-cyan-300/15"
        >
          <FileText size={16} />
          Queue Gate Review Summary
        </button>
      </aside>
    </div>
  );
}

export function StageGates({
  onToast,
  demoTimelineMs,
}: {
  onToast?: (message: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
  demoTimelineMs?: number;
}) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'All Status' | StageGateStatusValue>('All Status');
  const [project, setProject] = useState('All Projects');
  const [blockedOnly, setBlockedOnly] = useState(false);
  const [selectedGate, setSelectedGate] = useState<StageGate | null>(null);
  const [selectedMetricInsight, setSelectedMetricInsight] = useState<StageGateMetricInsight | null>(null);
  const [queuedActions, setQueuedActions] = useState<Record<string, string>>({});
  const [preparedGatePacks, setPreparedGatePacks] = useState<Record<string, boolean>>({});
  const [actionedRecommendations, setActionedRecommendations] = useState<Record<StageGateMetricName, boolean>>({
    'Total Gates': false,
    Approved: false,
    Blocked: false,
    'Pending Review': false,
    'Active Blockers': false,
    'Avg Completion': false,
  });
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const demoAiInsightOpenedRef = useRef(false);
  const demoAiInsightActionedRef = useRef(false);
  const demoAiInsightClosedRef = useRef(false);
  const demoProofPackPreparedRef = useRef(false);
  const previousDemoTimelineMsRef = useRef<number | null>(null);

  const projects = useMemo(() => ['All Projects', ...Array.from(new Set(stageGates.map(item => item.project)))], []);
  const baseFilteredGates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return stageGates.filter(gate => {
      const search = `${gate.code} ${gate.name} ${gate.project} ${gate.stage} ${gate.approver}`.toLowerCase();
      return (
        (!normalizedQuery || search.includes(normalizedQuery)) &&
        (status === 'All Status' || gate.status === status) &&
        (project === 'All Projects' || gate.project === project)
      );
    });
  }, [project, query, status]);
  const filteredGates = useMemo(
    () => (blockedOnly ? baseFilteredGates.filter(gate => gate.blockers > 0) : baseFilteredGates),
    [baseFilteredGates, blockedOnly],
  );
  const sortedFilteredGates = useMemo(
    () => [...filteredGates].sort((a, b) => getGatePriorityScore(b) - getGatePriorityScore(a)),
    [filteredGates],
  );
  const priorityGate = sortedFilteredGates[0] ?? null;

  const blocked = filteredGates.filter(gate => gate.status === 'Blocked').length;
  const pending = filteredGates.filter(gate => gate.status === 'Pending Review').length;
  const approved = filteredGates.filter(gate => gate.status === 'Approved').length;
  const open = filteredGates.filter(gate => gate.status === 'Open').length;
  const activeBlockers = filteredGates.reduce((sum, gate) => sum + gate.blockers, 0);
  const avgCompletion = filteredGates.length ? Math.round(filteredGates.reduce((sum, gate) => sum + gate.completion, 0) / filteredGates.length) : 0;
  const evidenceGaps = filteredGates.reduce((sum, gate) => sum + getIncompleteDeliverables(gate).length, 0);
  const gatesNeedingAction = filteredGates.filter(gate => gate.status === 'Blocked' || gate.status === 'Pending Review' || gate.blockers > 0).length;
  const blockedToggleCount = baseFilteredGates.filter(gate => gate.blockers > 0).length;
  const filteredQueuedActionCount = filteredGates.filter(gate => queuedActions[gate.code]).length;
  const filtersActive = Boolean(query.trim()) || status !== 'All Status' || project !== 'All Projects' || blockedOnly;
  const metricStats = useMemo<StageGateMetricStats>(() => ({
    total: filteredGates.length,
    approved,
    blocked,
    pending,
    activeBlockers,
    avgCompletion,
    gatesWithBlockers: filteredGates.filter(gate => gate.blockers > 0),
    blockedGates: filteredGates.filter(gate => gate.status === 'Blocked'),
    pendingGates: filteredGates.filter(gate => gate.status === 'Pending Review'),
  }), [activeBlockers, approved, avgCompletion, blocked, filteredGates, pending]);

  const openMetricInsight = (metricName: StageGateMetricName) => {
    setSelectedMetricInsight(buildStageGateMetricInsight(metricName, metricStats));
  };

  const queueGateAction = (gate: StageGate, action: GateActionPlan) => {
    setQueuedActions(previous => ({ ...previous, [gate.code]: action.cta }));
    onToast?.(action.toast, action.tone === 'critical' ? 'warning' : 'success');
  };

  const actionRecommendation = (metricName: StageGateMetricName) => {
    const gateToQueue = getRecommendationTarget(metricName, filteredGates);

    if (!gateToQueue) {
      onToast?.('No matching gate in current filters', 'warning');
      return;
    }

    let toastMessage = 'Stage gate action prepared';

    setActionedRecommendations(previous => ({ ...previous, [metricName]: true }));
    setQuery('');

    switch (metricName) {
      case 'Active Blockers':
      case 'Blocked':
        setBlockedOnly(true);
        toastMessage = `Blocker clearance pack ready for ${gateToQueue.code}`;
        break;
      case 'Pending Review':
        setBlockedOnly(false);
        toastMessage = `Approver decision pack queued for ${gateToQueue.approver}`;
        break;
      case 'Avg Completion':
        setBlockedOnly(false);
        toastMessage = `Evidence closure action queued for ${gateToQueue.code}`;
        break;
      case 'Approved':
        setBlockedOnly(false);
        toastMessage = `Benchmark evidence review queued from ${gateToQueue.code}`;
        break;
      case 'Total Gates':
        setBlockedOnly(false);
        toastMessage = 'Gate review pack queued for the active register';
        break;
    }

    setQueuedActions(previous => ({ ...previous, [gateToQueue.code]: getGateActionPlan(gateToQueue).cta }));
    onToast?.(toastMessage, metricName === 'Blocked' || metricName === 'Active Blockers' ? 'warning' : 'success');
  };

  const selectedRecommendationTarget = selectedMetricInsight
    ? getRecommendationTarget(selectedMetricInsight.metricName, filteredGates)
    : undefined;
  const selectedRecommendationActioned = Boolean(
    selectedMetricInsight &&
    selectedRecommendationTarget &&
    actionedRecommendations[selectedMetricInsight.metricName] &&
    queuedActions[selectedRecommendationTarget.code] === getGateActionPlan(selectedRecommendationTarget).cta
  );
  const recoveryGate = priorityGate;
  const recoveryMissing = recoveryGate ? getIncompleteDeliverables(recoveryGate) : [];
  const primaryGap = recoveryMissing[0];
  const recoveryPackReady = recoveryGate ? Boolean(preparedGatePacks[recoveryGate.code]) : false;
  const recoveryReadiness = recoveryGate
    ? Math.min(100, recoveryGate.completion + (recoveryPackReady ? Math.max(12, recoveryMissing.length * 6) : 0))
    : 0;
  const demoMetricFlashElapsed = typeof demoTimelineMs === 'number'
    ? demoTimelineMs - STAGE_GATE_CARD_FLASH_START_MS
    : null;
  const demoMetricFlashIndex = demoMetricFlashElapsed !== null
    && demoMetricFlashElapsed >= 0
    && demoTimelineMs! < STAGE_GATE_CARD_FLASH_END_MS
      ? Math.min(
          STAGE_GATE_DEMO_METRICS.length - 1,
          Math.floor(demoMetricFlashElapsed / STAGE_GATE_CARD_FLASH_INTERVAL_MS),
        )
      : null;
  const demoSettledMetricCount = demoMetricFlashElapsed !== null && demoMetricFlashElapsed >= 0
    ? Math.min(
        STAGE_GATE_DEMO_METRICS.length,
        Math.floor(demoMetricFlashElapsed / STAGE_GATE_CARD_FLASH_INTERVAL_MS),
      )
    : 0;
  const getDemoMetricFlashState = (metric: StageGateDemoMetricName): StageGateDemoFlashState | undefined => {
    const metricIndex = STAGE_GATE_DEMO_METRICS.indexOf(metric);
    if (metricIndex === demoMetricFlashIndex) return 'active';
    if (metricIndex >= 0 && metricIndex < demoSettledMetricCount) return 'settled';
    return undefined;
  };
  const demoReviewBlockersFlash = typeof demoTimelineMs === 'number'
    && demoTimelineMs >= STAGE_GATE_REVIEW_BLOCKERS_FLASH_START_MS
    && demoTimelineMs < STAGE_GATE_REVIEW_BLOCKERS_FLASH_START_MS + STAGE_GATE_REVIEW_BLOCKERS_FLASH_DURATION_MS;
  const demoReviewBlockersClick = typeof demoTimelineMs === 'number'
    && demoTimelineMs >= STAGE_GATE_REVIEW_BLOCKERS_CLICK_START_MS
    && demoTimelineMs < STAGE_GATE_REVIEW_BLOCKERS_CLICK_START_MS + STAGE_GATE_REVIEW_BLOCKERS_CLICK_DURATION_MS;
  const demoAiInsightScrollProgress = typeof demoTimelineMs === 'number' && demoTimelineMs >= STAGE_GATE_AI_INSIGHT_SCROLL_START_MS
    ? Math.min(1, (demoTimelineMs - STAGE_GATE_AI_INSIGHT_SCROLL_START_MS) / STAGE_GATE_AI_INSIGHT_SCROLL_DURATION_MS)
    : undefined;

  useEffect(() => {
    const scroller = scrollContainerRef.current;
    if (!scroller || typeof demoTimelineMs !== 'number') return;
    const previous = previousDemoTimelineMsRef.current;
    previousDemoTimelineMsRef.current = demoTimelineMs;
    if (previous === null || demoTimelineMs < previous || demoTimelineMs < 500) {
      scroller.scrollTop = 0;
    }
  }, [demoTimelineMs]);

  useEffect(() => {
    if (typeof demoTimelineMs !== 'number' || demoTimelineMs < STAGE_GATE_AI_INSIGHT_OPEN_MS) {
      demoAiInsightOpenedRef.current = false;
      demoAiInsightActionedRef.current = false;
      demoAiInsightClosedRef.current = false;
      demoProofPackPreparedRef.current = false;
      return;
    }

    if (!demoAiInsightOpenedRef.current) {
      demoAiInsightOpenedRef.current = true;
      openMetricInsight('Active Blockers');
    }

    if (demoTimelineMs >= STAGE_GATE_AI_INSIGHT_ACTION_MS && !demoAiInsightActionedRef.current) {
      demoAiInsightActionedRef.current = true;
      actionRecommendation('Active Blockers');
    }

    if (demoTimelineMs >= STAGE_GATE_AI_INSIGHT_CLOSE_MS && !demoAiInsightClosedRef.current) {
      demoAiInsightClosedRef.current = true;
      setSelectedMetricInsight(null);
    }

    if (demoTimelineMs >= STAGE_GATE_PROOF_PACK_PREPARE_MS && !demoProofPackPreparedRef.current && recoveryGate) {
      const action = getGateActionPlan(recoveryGate);
      demoProofPackPreparedRef.current = true;
      setPreparedGatePacks(previous => ({ ...previous, [recoveryGate.code]: true }));
      setQueuedActions(previous => ({ ...previous, [recoveryGate.code]: action.cta }));
      onToast?.(`Gate proof pack prepared for ${recoveryGate.code}`, recoveryGate.status === 'Blocked' ? 'warning' : 'success');
    }
  }, [demoTimelineMs, onToast, recoveryGate]);

  const prepareGateProofPack = () => {
    if (!recoveryGate) return;
    const action = getGateActionPlan(recoveryGate);
    setPreparedGatePacks(previous => ({ ...previous, [recoveryGate.code]: true }));
    setQueuedActions(previous => ({ ...previous, [recoveryGate.code]: action.cta }));
    onToast?.(`Gate proof pack prepared for ${recoveryGate.code}`, recoveryGate.status === 'Blocked' ? 'warning' : 'success');
  };

  return (
    <div ref={scrollContainerRef} className="custom-scrollbar h-full min-h-0 overflow-x-hidden overflow-y-auto px-5 py-4 text-[#EEF3FA]" data-demo-anchor="project-stage-gates">
      <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[linear-gradient(135deg,rgba(17,32,64,0.92),rgba(7,17,31,0.94))] p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/24 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100">
                <Target size={13} />
                Gate Control Board
              </span>
              <span className="rounded-full border border-violet-300/22 bg-violet-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-violet-100">
                {gatesNeedingAction} need action
              </span>
            </div>
            <h1 className="mt-4 text-2xl font-black leading-7 text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Stage Gates
            </h1>
            <p className="mt-2 text-[13px] leading-6 text-[#A8BCD8]">
              See which gate can move, which gate is stuck, and the next owner action needed to release the project stage.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setBlockedOnly(true);
                setQuery('');
              }}
              className={`relative inline-flex h-10 items-center justify-center gap-2 overflow-visible rounded-lg border px-4 text-[12px] font-black text-red-100 transition-colors hover:bg-red-400/15 ${
                demoReviewBlockersFlash
                  ? 'animate-pulse border-red-200/90 bg-red-500/30 shadow-[0_0_34px_rgba(239,68,68,0.42)] ring-1 ring-red-100/45 [animation-duration:1000ms] [animation-iteration-count:3]'
                  : 'border-red-300/24 bg-red-400/10'
              }`}
              data-demo-anchor="project-stage-review-blockers"
            >
              <AlertTriangle size={15} />
              Review blockers
              {demoReviewBlockersClick && (
                <span
                  className="pointer-events-none absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center"
                  data-demo-anchor="project-stage-review-blockers-click"
                >
                  <span className="absolute h-8 w-8 rounded-full border border-white/70 bg-red-400/25 animate-ping [animation-duration:700ms]" />
                  <span className="relative flex h-7 w-7 items-center justify-center rounded-full border border-white/70 bg-red-500 text-white shadow-[0_0_24px_rgba(239,68,68,0.56)]">
                    <MousePointer2 size={14} />
                  </span>
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => onToast?.('Gate report export is ready to connect', 'info')}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-cyan-300/25 bg-cyan-300/10 px-4 text-[12px] font-black text-cyan-100 transition-colors hover:bg-cyan-300/15"
            >
              <Download size={14} />
              Gate Report
            </button>
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-[15px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              <ListChecks size={17} className="text-cyan-300" />
              Gate Filters
            </h2>
            <p className="mt-1 text-[11px] leading-4 text-[#8EA7C7]">
              Showing {filteredGates.length} of {stageGates.length} gates across every panel on this page.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setBlockedOnly(false)}
              className={`rounded-lg border px-4 py-2 text-[12px] font-black transition-colors ${!blockedOnly ? 'border-cyan-300/30 bg-cyan-300/10 text-cyan-300' : 'border-transparent text-[#7A94B4] hover:bg-white/5'}`}
            >
              All Gates ({baseFilteredGates.length})
            </button>
            <button
              type="button"
              onClick={() => setBlockedOnly(true)}
              className={`rounded-lg border px-4 py-2 text-[12px] font-black transition-colors ${blockedOnly ? 'border-red-300/30 bg-red-300/10 text-red-300' : 'border-transparent text-[#7A94B4] hover:bg-white/5'}`}
            >
              Blocked Gates ({blockedToggleCount})
            </button>
            <button
              type="button"
              disabled={!filtersActive}
              onClick={() => {
                setQuery('');
                setStatus('All Status');
                setProject('All Projects');
                setBlockedOnly(false);
              }}
              className={`rounded-lg border px-4 py-2 text-[12px] font-black transition-colors ${filtersActive ? 'border-cyan-300/24 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/15' : 'cursor-not-allowed border-slate-400/12 bg-slate-400/6 text-slate-500'}`}
            >
              Clear filters
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(220px,1fr)_160px_190px]">
          <label className="relative">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A94B4]" />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search by gate, owner, project..."
              className="h-10 w-full rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#0A1628] pl-11 pr-4 text-[13px] text-[#EEF3FA] outline-none placeholder:text-[#5A6E88] focus:border-cyan-300/70"
            />
          </label>
          <select value={status} onChange={event => setStatus(event.target.value as 'All Status' | StageGateStatusValue)} className="h-10 rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#0A1628] px-3 text-[13px] text-[#DDE6F8] outline-none focus:border-cyan-300/70">
            {['All Status', 'Approved', 'Blocked', 'Pending Review', 'Open'].map(item => <option key={item}>{item}</option>)}
          </select>
          <select value={project} onChange={event => setProject(event.target.value)} className="h-10 rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#0A1628] px-3 text-[13px] text-[#DDE6F8] outline-none focus:border-cyan-300/70">
            {projects.map(item => <option key={item}>{item}</option>)}
          </select>
        </div>
      </section>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={AlertTriangle} label="Active Blockers" value={activeBlockers} accent="#EF4444" metricName="Active Blockers" onExplain={openMetricInsight} demoFlashState={getDemoMetricFlashState('Active Blockers')} demoAnchor="project-stage-active-blockers" aiAnchor="project-stage-active-blockers-ai-button" />
        <KpiCard icon={Clock3} label="Pending Review" value={pending} accent="#F59E0B" metricName="Pending Review" onExplain={openMetricInsight} demoFlashState={getDemoMetricFlashState('Pending Review')} demoAnchor="project-stage-pending-review" />
        <KpiCard icon={FileCheck2} label="Evidence Gaps" value={evidenceGaps} accent="#06B6D4" demoFlashState={getDemoMetricFlashState('Evidence Gaps')} demoAnchor="project-stage-evidence-gaps-metric" />
        <KpiCard icon={BarChart3} label="Avg Completion" value={`${avgCompletion}%`} accent="#60A5FA" delta="+5%" metricName="Avg Completion" onExplain={openMetricInsight} demoFlashState={getDemoMetricFlashState('Avg Completion')} demoAnchor="project-stage-avg-completion" />
      </div>

      {recoveryGate && (
        <section
          className="mt-4 overflow-hidden rounded-2xl border border-cyan-300/20 bg-[linear-gradient(135deg,rgba(6,182,212,0.13),rgba(124,58,237,0.10)_44%,rgba(7,17,31,0.92))] shadow-[0_18px_70px_rgba(0,0,0,0.22)]"
          data-demo-anchor="project-stage-proof-loop"
        >
          <div className="grid gap-0 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)_minmax(0,0.92fr)]">
            <div className="border-b border-cyan-300/14 p-5 xl:border-b-0 xl:border-r" data-demo-anchor="project-stage-blocked-gate">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.17em] text-cyan-200">
                <Target size={14} />
                Gate to proof loop
              </div>
              <h2 className="mt-3 text-xl font-black leading-6 text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {recoveryGate.name}
              </h2>
              <p className="mt-2 text-[12px] leading-5 text-[#A8BCD8]">
                This is the next governance decision: either the missing proof is closed or the stage remains exposed.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-white/10 bg-[#07111F]/76 p-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">Status</p>
                  <div className="mt-2"><StatusBadge status={recoveryGate.status} /></div>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#07111F]/76 p-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">Readiness</p>
                  <p className="mt-2 font-mono text-2xl font-black text-white">{recoveryReadiness}%</p>
                </div>
              </div>
            </div>

            <div className="border-b border-cyan-300/14 p-5 xl:border-b-0 xl:border-r" data-demo-anchor="project-stage-evidence-gaps">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.17em] text-amber-100">
                <FileText size={14} />
                Required proof
              </div>
              <h3 className="mt-3 text-lg font-black leading-6 text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {primaryGap ? primaryGap.name : 'Evidence pack complete'}
              </h3>
              <p className="mt-2 text-[12px] leading-5 text-[#B8C7DB]">
                {primaryGap
                  ? `${primaryGap.documentType} ${primaryGap.documentCode} is the proof item currently holding the gate discussion.`
                  : 'Every listed deliverable is complete, so the approver conversation can focus on release.'}
              </p>
              <div className="mt-4 space-y-2">
                {(recoveryMissing.length ? recoveryMissing : recoveryGate.deliverables.slice(0, 2)).map(deliverable => (
                  <div key={deliverable.documentCode} className={`rounded-xl border p-3 ${deliverable.status === 'Complete' ? 'border-emerald-300/20 bg-emerald-300/10' : deliverable.status === 'Blocked' ? 'border-red-300/24 bg-red-400/10' : 'border-amber-300/24 bg-amber-300/10'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[12px] font-black text-[#EEF3FA]">{deliverable.name}</span>
                      <span className="font-mono text-[10px] text-[#8EA7C7]">{deliverable.documentCode}</span>
                    </div>
                    <p className="mt-1 text-[10px] leading-4 text-[#8EA7C7]">{deliverable.previewSummary}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5" data-demo-anchor="project-stage-recovery-actions">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.17em] text-emerald-100">
                <ShieldCheck size={14} />
                Recovery action
              </div>
              <h3 className="mt-3 text-lg font-black leading-6 text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {recoveryPackReady ? 'Proof pack ready for review' : 'Prepare the approver pack'}
              </h3>
              <p className="mt-2 text-[12px] leading-5 text-[#B8C7DB]">
                {recoveryPackReady
                  ? `The action is now queued to ${recoveryGate.approver} with the evidence gap and next owner visible.`
                  : `Package the missing proof, owner, due date, and gate consequence for ${recoveryGate.approver}.`}
              </p>
              <div className="mt-4 rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#07111F]/78 p-3">
                <div className="flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">
                  <span>Unblock path</span>
                  <span>{recoveryPackReady ? '+ readiness' : 'waiting'}</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  {['Identify', 'Package', 'Assign'].map((step, index) => (
                    <div key={step} className="flex min-w-0 flex-1 items-center gap-2">
                      <span className={`grid h-7 w-7 flex-shrink-0 place-items-center rounded-full border text-[10px] font-black ${recoveryPackReady || index === 0 ? 'border-emerald-300/30 bg-emerald-300/12 text-emerald-100' : 'border-[#2E7FFF]/22 bg-[#0A1628] text-[#7A94B4]'}`}>
                        {recoveryPackReady || index === 0 ? <CheckCircle2 size={13} /> : index + 1}
                      </span>
                      <span className="truncate text-[11px] font-black text-[#DDE6F8]">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={prepareGateProofPack}
                data-demo-anchor="project-stage-proof-pack-button"
                className={`mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-[12px] font-black transition-colors ${recoveryPackReady ? 'border border-emerald-300/25 bg-emerald-300/12 text-emerald-100' : 'bg-[#2E7FFF] text-white shadow-lg shadow-blue-950/30 hover:bg-[#256BE0]'}`}
              >
                {recoveryPackReady ? <CheckCircle2 size={16} /> : <Send size={16} />}
                {recoveryPackReady ? 'Proof pack prepared' : 'Prepare proof pack'}
              </button>
            </div>
          </div>
        </section>
      )}

      {filteredGates.length === 0 ? (
        <section className="mt-4 rounded-xl border border-dashed border-[rgba(46,127,255,0.24)] bg-[rgba(17,32,64,0.58)] p-8 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-cyan-300/24 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100">
            <Flag size={13} />
            No Gate Matches
          </div>
          <h2 className="mt-4 text-xl font-black leading-6 text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            No gate matches the current filters.
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-[13px] leading-5 text-[#9DB2CE]">
            Adjust the search, status, project, or blocker filter to bring gates back into the control board, decision lane, and action queue.
          </p>
        </section>
      ) : (
        <>
          <div
            className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_0.9fr]"
            data-demo-anchor="project-stage-gate-loop"
          >
            {priorityGate ? (
              <GateFocusPanel
                gate={priorityGate}
                queuedAction={queuedActions[priorityGate.code]}
                onAction={queueGateAction}
                onOpen={setSelectedGate}
              />
            ) : (
              <GateFocusEmptyPanel />
            )}
            <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-[15px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Decision Lane</h2>
                  <p className="mt-1 text-[11px] leading-4 text-[#8EA7C7]">A fast read of what is released, blocked, waiting for approval, or still being prepared.</p>
                </div>
                <ShieldCheck size={22} className="text-cyan-300" />
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <DecisionLane status="Blocked" gates={filteredGates} />
                <DecisionLane status="Pending Review" gates={filteredGates} />
                <DecisionLane status="Open" gates={filteredGates} />
                <DecisionLane status="Approved" gates={filteredGates} />
              </div>
              <div className="mt-4 rounded-lg border border-violet-300/18 bg-violet-300/10 p-3 text-[12px] leading-5 text-violet-100">
                <span className="font-black">Suggested meeting focus: </span>
                clear {activeBlockers} blocker{activeBlockers === 1 ? '' : 's'}, then move {pending} pending review gate{pending === 1 ? '' : 's'} to decision.
              </div>
            </section>
          </div>

          <div
            className="mt-4 rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4"
            data-demo-anchor="project-stage-action-queue"
          >
            <div>
              <h2 className="flex items-center gap-2 text-[15px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                <ListChecks size={17} className="text-cyan-300" />
                Gate Action Queue
              </h2>
              <p className="mt-1 text-[11px] leading-4 text-[#8EA7C7]">
                Sorted by urgency from the active Gate Filters. Showing {sortedFilteredGates.length} gate{sortedFilteredGates.length === 1 ? '' : 's'}.
              </p>
            </div>

            <div className="mt-4 grid gap-3 2xl:grid-cols-2">
              {sortedFilteredGates.map(gate => (
                <GateActionCard
                  key={gate.code}
                  gate={gate}
                  queuedAction={queuedActions[gate.code]}
                  onAction={queueGateAction}
                  onOpen={setSelectedGate}
                />
              ))}
            </div>
          </div>

          <section className="mt-4 grid gap-3 xl:grid-cols-3" data-demo-anchor="project-stage-outcomes">
            <div className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#0A1628]/78 p-4">
              <div className="flex items-center gap-2 text-[13px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                <CheckCircle2 size={16} className="text-emerald-300" />
                Released
              </div>
              <p className="mt-2 text-[24px] font-black text-[#EEF3FA]">{approved}</p>
              <p className="mt-1 text-[11px] leading-4 text-[#8EA7C7]">Approved gates can be used as the evidence standard for blocked gates.</p>
            </div>
            <div className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#0A1628]/78 p-4">
              <div className="flex items-center gap-2 text-[13px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                <CircleDot size={16} className="text-cyan-300" />
                Being Prepared
              </div>
              <p className="mt-2 text-[24px] font-black text-[#EEF3FA]">{open}</p>
              <p className="mt-1 text-[11px] leading-4 text-[#8EA7C7]">Open gates need evidence closure before they become approver decisions.</p>
            </div>
            <div className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#0A1628]/78 p-4">
              <div className="flex items-center gap-2 text-[13px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                <Sparkles size={16} className="text-violet-300" />
                Local Actions
              </div>
              <p className="mt-2 text-[24px] font-black text-[#EEF3FA]">{filteredQueuedActionCount}</p>
              <p className="mt-1 text-[11px] leading-4 text-[#8EA7C7]">Queued actions matching the active gate filters.</p>
            </div>
          </section>
        </>
      )}

      {selectedGate && (
        <StageGateDetailModal
          gate={selectedGate}
          onClose={() => setSelectedGate(null)}
          onToast={onToast}
        />
      )}
      {selectedMetricInsight && (
        <StageGateMetricInsightPanel
          insight={selectedMetricInsight}
          actioned={selectedRecommendationActioned}
          actionAvailable={Boolean(selectedRecommendationTarget)}
          onActionRecommendation={actionRecommendation}
          onClose={() => setSelectedMetricInsight(null)}
          demoScrollProgress={selectedMetricInsight.metricName === 'Active Blockers' ? demoAiInsightScrollProgress : undefined}
        />
      )}
    </div>
  );
}
