import { useMemo, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  Search,
  Target,
  X,
  XCircle,
  CircleDot,
  Brain,
  Lightbulb,
  ListChecks,
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
        recommendation: 'Assign each blocker to a named owner, separate authority blockers from internal evidence blockers, and review the list daily until it is cleared.',
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

function StageGateMetricInsightPanel({ insight, onClose }: { insight: StageGateMetricInsight; onClose: () => void }) {
  const toneClasses = {
    positive: 'border-emerald-300/30 bg-emerald-300/10 text-emerald-200',
    monitor: 'border-cyan-300/30 bg-cyan-300/10 text-cyan-200',
    critical: 'border-red-300/30 bg-red-300/10 text-red-200',
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
      <button type="button" aria-label="Close AI insight" className="absolute inset-0 cursor-default" onClick={onClose} />
      <aside className="custom-scrollbar relative z-10 h-full w-full max-w-[470px] overflow-y-auto border-l border-[rgba(46,127,255,0.22)] bg-[#07111F] p-5 shadow-2xl shadow-black/60">
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

        <section className="mt-4 rounded-2xl border border-[rgba(46,127,255,0.18)] bg-[#0A1628] p-4">
          <div className="flex items-center gap-2 text-[13px] font-black text-[#EEF3FA]">
            <Brain size={16} className="text-violet-300" />
            Summary
          </div>
          <p className="mt-3 text-[14px] leading-6 text-[#BCC8DC]">{insight.summary}</p>
        </section>

        <section className="mt-4 rounded-2xl border border-[rgba(46,127,255,0.18)] bg-[#0A1628] p-4">
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

        <section className="mt-4 rounded-2xl border border-[rgba(46,127,255,0.18)] bg-[#0A1628] p-4">
          <div className="flex items-center gap-2 text-[13px] font-black text-[#EEF3FA]">
            <BarChart3 size={16} className="text-blue-300" />
            Interpretation
          </div>
          <p className="mt-3 text-[14px] leading-6 text-[#BCC8DC]">{insight.interpretation}</p>
        </section>

        <section className="mt-4 rounded-2xl border border-violet-300/20 bg-violet-300/10 p-4">
          <div className="flex items-center gap-2 text-[13px] font-black text-violet-100">
            <Lightbulb size={16} />
            Recommendation
          </div>
          <p className="mt-3 text-[14px] leading-6 text-[#E5D9FF]">{insight.recommendation}</p>
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
}: {
  icon: typeof Target;
  label: string;
  value: string | number;
  accent: string;
  delta?: string;
  metricName?: StageGateMetricName;
  onExplain?: (metricName: StageGateMetricName) => void;
}) {
  return (
    <div className="relative rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
      {metricName && onExplain && <AIInsightBadge onClick={() => onExplain(metricName)} />}
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
}: {
  gate: StageGate;
  onClose: () => void;
  onToast?: (message: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}) {
  const progressColor = gate.status === 'Approved' ? '#22C55E' : gate.status === 'Blocked' ? '#EF4444' : gate.status === 'Pending Review' ? '#F59E0B' : '#06B6D4';
  const [selectedDeliverable, setSelectedDeliverable] = useState<StageGateDeliverable>(gate.deliverables[0]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <button type="button" aria-label="Dismiss stage gate detail" className="absolute inset-0 cursor-default" onClick={onClose} />
      <aside className="custom-scrollbar relative z-10 max-h-[92vh] w-full max-w-[760px] overflow-y-auto rounded-2xl border border-[rgba(46,127,255,0.2)] bg-[#07111F] p-5 shadow-2xl shadow-black/60">
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
          onClick={() => onToast?.(`Detailed workflow ready for ${gate.code}`, 'info')}
          className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-4 text-[13px] font-black text-cyan-300 transition-colors hover:bg-cyan-300/15"
        >
          <FileText size={16} />
          View Details
        </button>
      </aside>
    </div>
  );
}

export function StageGates({ onToast }: { onToast?: (message: string, type?: 'success' | 'warning' | 'error' | 'info') => void }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'All Status' | StageGateStatusValue>('All Status');
  const [project, setProject] = useState('All Projects');
  const [blockedOnly, setBlockedOnly] = useState(false);
  const [selectedGate, setSelectedGate] = useState<StageGate | null>(null);
  const [selectedMetricInsight, setSelectedMetricInsight] = useState<StageGateMetricInsight | null>(null);

  const projects = useMemo(() => ['All Projects', ...Array.from(new Set(stageGates.map(item => item.project)))], []);
  const visibleGates = stageGates.filter(gate => {
    const search = `${gate.code} ${gate.name} ${gate.project} ${gate.stage} ${gate.approver}`.toLowerCase();
    return (
      search.includes(query.toLowerCase()) &&
      (status === 'All Status' || gate.status === status) &&
      (project === 'All Projects' || gate.project === project) &&
      (!blockedOnly || gate.blockers > 0)
    );
  });

  const blocked = stageGates.filter(gate => gate.status === 'Blocked').length;
  const pending = stageGates.filter(gate => gate.status === 'Pending Review').length;
  const approved = stageGates.filter(gate => gate.status === 'Approved').length;
  const activeBlockers = stageGates.reduce((sum, gate) => sum + gate.blockers, 0);
  const avgCompletion = Math.round(stageGates.reduce((sum, gate) => sum + gate.completion, 0) / stageGates.length);
  const metricStats = useMemo<StageGateMetricStats>(() => ({
    total: stageGates.length,
    approved,
    blocked,
    pending,
    activeBlockers,
    avgCompletion,
    gatesWithBlockers: stageGates.filter(gate => gate.blockers > 0),
    blockedGates: stageGates.filter(gate => gate.status === 'Blocked'),
    pendingGates: stageGates.filter(gate => gate.status === 'Pending Review'),
  }), [activeBlockers, approved, avgCompletion, blocked, pending]);

  const openMetricInsight = (metricName: StageGateMetricName) => {
    setSelectedMetricInsight(buildStageGateMetricInsight(metricName, metricStats));
  };

  return (
    <div className="custom-scrollbar h-full min-h-0 overflow-x-hidden overflow-y-auto px-5 py-4 text-[#EEF3FA]">
      <div className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Target size={28} className="text-cyan-300" />
            <h1 className="text-2xl font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Stage Gates</h1>
          </div>
          <button
            type="button"
            onClick={() => onToast?.('Gate report export is ready to connect', 'info')}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-cyan-300/25 bg-cyan-300/10 px-4 text-[12px] font-black text-cyan-300 transition-colors hover:bg-cyan-300/15"
          >
            <Download size={14} />
            Gate Report
          </button>
        </div>
      </div>

      <div className="mt-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <KpiCard icon={Target} label="Total Gates" value={stageGates.length} accent="#06B6D4" metricName="Total Gates" onExplain={openMetricInsight} />
          <KpiCard icon={CheckCircle2} label="Approved" value={approved} accent="#22C55E" delta="+12%" metricName="Approved" onExplain={openMetricInsight} />
          <KpiCard icon={XCircle} label="Blocked" value={blocked} accent="#EF4444" metricName="Blocked" onExplain={openMetricInsight} />
          <KpiCard icon={Clock3} label="Pending Review" value={pending} accent="#F59E0B" metricName="Pending Review" onExplain={openMetricInsight} />
          <KpiCard icon={AlertTriangle} label="Active Blockers" value={activeBlockers} accent="#8B5CF6" metricName="Active Blockers" onExplain={openMetricInsight} />
          <KpiCard icon={BarChart3} label="Avg Completion" value={`${avgCompletion}%`} accent="#60A5FA" delta="+5%" metricName="Avg Completion" onExplain={openMetricInsight} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[1fr_1fr_1fr]">
        <GateStatusDonut gates={stageGates} />
        <ProjectBars gates={stageGates} />
        <CompletionTrend />
      </div>

      <div className="mt-4 rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setBlockedOnly(false)}
              className={`rounded-lg border px-4 py-2 text-[12px] font-black transition-colors ${!blockedOnly ? 'border-cyan-300/30 bg-cyan-300/10 text-cyan-300' : 'border-transparent text-[#7A94B4] hover:bg-white/5'}`}
            >
              All Gates ({stageGates.length})
            </button>
            <button
              type="button"
              onClick={() => setBlockedOnly(true)}
              className={`rounded-lg border px-4 py-2 text-[12px] font-black transition-colors ${blockedOnly ? 'border-red-300/30 bg-red-300/10 text-red-300' : 'border-transparent text-[#7A94B4] hover:bg-white/5'}`}
            >
              Blocked Gates ({blocked})
            </button>
          </div>
          <div className="grid gap-3 xl:grid-cols-[240px_150px_190px]">
            <label className="relative">
              <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A94B4]" />
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Search gates..."
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
        </div>
      </div>

      <div className="mt-4">
        <div className="overflow-x-auto rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)]">
          <table className="w-full min-w-[1200px] text-left">
            <thead className="bg-[#0A1628]/85">
              <tr className="text-[11px] font-black text-[#5A6E88]">
                <th className="px-4 py-4">Code</th>
                <th className="px-4 py-4">Gate Name</th>
                <th className="px-4 py-4">Project</th>
                <th className="px-4 py-4">Stage</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Completion</th>
                <th className="px-4 py-4">Criteria</th>
                <th className="px-4 py-4">Blockers</th>
                <th className="px-4 py-4">Target Date</th>
                <th className="px-4 py-4">Approver</th>
              </tr>
            </thead>
            <tbody>
              {visibleGates.map(gate => {
                const GateIcon = statusIcons[gate.status];
                return (
                  <tr
                    key={gate.code}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedGate(gate)}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedGate(gate);
                      }
                    }}
                    className="cursor-pointer border-t border-[rgba(46,127,255,0.08)] bg-[#0A1628]/70 transition-colors hover:bg-white/[0.045] focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300/70"
                  >
                    <td className="px-4 py-4 align-top font-mono text-[13px] font-black text-cyan-300">{gate.code}</td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex items-center gap-3">
                        <GateIcon size={16} className="text-[#7A94B4]" />
                        <p className="max-w-[290px] text-[14px] font-black leading-5 text-[#DDE6F8]">{gate.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top text-[14px] text-[#A8B3C7]">{gate.project}</td>
                    <td className="px-4 py-4 align-top text-[12px] leading-5 text-[#7A94B4]">{gate.stage}</td>
                    <td className="px-4 py-4 align-top"><StatusBadge status={gate.status} /></td>
                    <td className="px-4 py-4 align-top"><ProgressBar gate={gate} /></td>
                    <td className="px-4 py-4 align-top font-mono text-[13px] text-[#A8B3C7]">{gate.criteriaComplete}/{gate.criteriaTotal}</td>
                    <td className="px-4 py-4 align-top">
                      {gate.blockers > 0 ? (
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-red-400/25 bg-red-400/10 px-2.5 py-1 text-[11px] font-black text-red-300">
                          <AlertTriangle size={12} />
                          {gate.blockers}
                        </span>
                      ) : (
                        <span className="text-[#7A94B4]">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top font-mono text-[13px] text-[#A8B3C7]">{gate.targetDate}</td>
                    <td className="px-4 py-4 align-top text-[14px] text-[#A8B3C7]">{gate.approver}</td>
                  </tr>
                );
              })}
              {visibleGates.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-[13px] text-[#7A94B4]">
                    No stage gates match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
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
          onClose={() => setSelectedMetricInsight(null)}
        />
      )}
    </div>
  );
}
