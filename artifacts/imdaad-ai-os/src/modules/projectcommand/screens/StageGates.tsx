import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  Download,
  Search,
  Target,
  XCircle,
  CircleDot,
} from 'lucide-react';
import {
  stageGateProjectBuckets,
  stageGates,
  stageGateTrend,
  type StageGate,
  type StageGateStatusValue,
} from '../data/stageGates';

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
}: {
  icon: typeof Target;
  label: string;
  value: string | number;
  accent: string;
  delta?: string;
}) {
  return (
    <div className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#15171B] p-4">
      <div className="flex items-start justify-between gap-3">
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
    <div className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#15171B] p-4">
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
    <div className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#15171B] p-4">
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
    <div className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#15171B] p-4">
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

export function StageGates({ onToast }: { onToast?: (message: string, type?: 'success' | 'warning' | 'error' | 'info') => void }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'All Status' | StageGateStatusValue>('All Status');
  const [project, setProject] = useState('All Projects');
  const [blockedOnly, setBlockedOnly] = useState(false);

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

  return (
    <div className="custom-scrollbar h-full min-h-0 overflow-y-auto bg-[#080A0E] text-[#EEF3FA]">
      <div className="border-b border-[rgba(46,127,255,0.14)] px-5 py-5">
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

      <div className="border-b border-[rgba(46,127,255,0.12)] p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <KpiCard icon={Target} label="Total Gates" value={stageGates.length} accent="#06B6D4" />
          <KpiCard icon={CheckCircle2} label="Approved" value={approved} accent="#22C55E" delta="+12%" />
          <KpiCard icon={XCircle} label="Blocked" value={blocked} accent="#EF4444" />
          <KpiCard icon={Clock3} label="Pending Review" value={pending} accent="#F59E0B" />
          <KpiCard icon={AlertTriangle} label="Active Blockers" value={activeBlockers} accent="#8B5CF6" />
          <KpiCard icon={BarChart3} label="Avg Completion" value={`${avgCompletion}%`} accent="#60A5FA" delta="+5%" />
        </div>
      </div>

      <div className="grid gap-3 border-b border-[rgba(46,127,255,0.12)] p-5 xl:grid-cols-[1fr_1fr_1fr]">
        <GateStatusDonut gates={stageGates} />
        <ProjectBars gates={stageGates} />
        <CompletionTrend />
      </div>

      <div className="border-b border-[rgba(46,127,255,0.12)] p-4">
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
                className="h-10 w-full rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#15171B] pl-11 pr-4 text-[13px] text-[#EEF3FA] outline-none placeholder:text-[#5A6E88] focus:border-cyan-300/70"
              />
            </label>
            <select value={status} onChange={event => setStatus(event.target.value as 'All Status' | StageGateStatusValue)} className="h-10 rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#15171B] px-3 text-[13px] text-[#DDE6F8] outline-none focus:border-cyan-300/70">
              {['All Status', 'Approved', 'Blocked', 'Pending Review', 'Open'].map(item => <option key={item}>{item}</option>)}
            </select>
            <select value={project} onChange={event => setProject(event.target.value)} className="h-10 rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#15171B] px-3 text-[13px] text-[#DDE6F8] outline-none focus:border-cyan-300/70">
              {projects.map(item => <option key={item}>{item}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="overflow-x-auto rounded-xl border border-[rgba(46,127,255,0.16)]">
          <table className="w-full min-w-[1200px] text-left">
            <thead className="bg-[#101216]">
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
                  <tr key={gate.code} className="border-t border-[rgba(46,127,255,0.08)] bg-[#15171B] transition-colors hover:bg-[#1B1D23]">
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
    </div>
  );
}
