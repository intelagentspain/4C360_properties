import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare, X, Search, ChevronRight, FileImage,
  Wrench, Clock, CheckCircle, AlertTriangle,
} from 'lucide-react';
import { mockKanbanTasks } from '@/data/mockData';
import { SEVERITY_BADGE, PRIORITY_DOT, TASK_STATUS_COLOR, slaStatus, type ToastFn } from '@/lib/ui';
import { AnimatedBar } from '@/components/shared/AnimatedBar';
import { TechAvatar } from '@/components/shared/TechAvatar';
import type { PPMRiskPayload } from './PPMRiskPanel';

type KTask = typeof mockKanbanTasks[0];

const STATUS_LABEL: Record<string, string> = {
  new:               'New',
  assigned:          'Assigned',
  'in-progress':     'In Progress',
  'awaiting-evidence': 'Awaiting Evidence',
  closed:            'Closed',
  overdue:           'Overdue',
};

const STATUS_BG: Record<string, string> = {
  new:               'bg-white/5 border-white/10',
  assigned:          'bg-blue-500/10 border-blue-500/30',
  'in-progress':     'bg-cyan-500/10 border-cyan-500/30',
  'awaiting-evidence': 'bg-amber-500/10 border-amber-500/30',
  closed:            'bg-emerald-500/10 border-emerald-500/30',
  overdue:           'bg-red-500/10 border-red-500/30',
};

const SKILL_COLOR: Record<string, string> = {
  HVAC:      'text-blue-400 bg-blue-500/15 border-blue-500/30',
  Plumbing:  'text-cyan-400 bg-cyan-500/15 border-cyan-500/30',
  Electrical:'text-amber-400 bg-amber-500/15 border-amber-500/30',
  General:   'text-[#7A94B4] bg-white/5 border-white/10',
  Safety:    'text-red-400 bg-red-500/15 border-red-500/30',
};

const TECH_INITIALS: Record<string, string> = {
  'Karim R.':  'KR',
  'Ahmed K.':  'AK',
  'Sara M.':   'SM',
  'Faisal N.': 'FN',
  'Omar T.':   'OT',
};

const ALL_STATUSES   = ['All', 'new', 'assigned', 'in-progress', 'awaiting-evidence', 'overdue', 'closed'];
const ALL_PRIORITIES = ['All', 'critical', 'high', 'medium', 'low'];
const ALL_SKILLS     = ['All', 'HVAC', 'Plumbing', 'Electrical', 'General', 'Safety'];
const ALL_TECHS      = ['All', 'Karim R.', 'Ahmed K.', 'Sara M.', 'Faisal N.', 'Omar T.', 'Unassigned'];

const DRAWER_ACTIONS: Record<string, { label: string; color: string; bg: string }[]> = {
  new:               [{ label: 'Assign Tech', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' }],
  assigned:          [{ label: 'Mark In Progress', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30' }, { label: 'Reassign', color: 'text-[#7A94B4]', bg: 'bg-white/5 border-white/10' }],
  'in-progress':     [{ label: 'Submit Evidence', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' }, { label: 'Escalate', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' }],
  'awaiting-evidence': [{ label: 'Request Evidence', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' }, { label: 'Close Without Evidence', color: 'text-[#7A94B4]', bg: 'bg-white/5 border-white/10' }],
  overdue:           [{ label: 'Escalate', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' }, { label: 'Reassign', color: 'text-[#7A94B4]', bg: 'bg-white/5 border-white/10' }],
  closed:            [],
};

const RISK_TO_PRIORITY: Record<string, string> = {
  overdue: 'critical',
  critical: 'critical',
  high: 'high',
  medium: 'medium',
  low: 'low',
};

const RISK_TO_SKILL: Record<string, string> = {
  HVAC: 'HVAC',
  Plumbing: 'Plumbing',
  Electrical: 'Electrical',
  Safety: 'Safety',
  Lift: 'General',
};

function buildSyntheticTask(risk: PPMRiskPayload): KTask {
  const priority = RISK_TO_PRIORITY[risk.riskLevel] ?? 'medium';
  const typeWords = risk.type.split(' ');
  const skill = RISK_TO_SKILL[typeWords[typeWords.length - 1]] ?? RISK_TO_SKILL[typeWords[0]] ?? 'General';
  const dueLabel = risk.daysUntilDue <= 0
    ? `Overdue by ${Math.abs(risk.daysUntilDue)}d`
    : `Due in ${risk.daysUntilDue}d`;
  return {
    id: `PPM-${risk.id}`,
    title: risk.type,
    asset: risk.asset,
    location: risk.asset,
    skill: skill as KTask['skill'],
    priority: priority as KTask['priority'],
    status: 'new' as KTask['status'],
    tech: null,
    slaMinutes: risk.daysUntilDue > 0 ? risk.daysUntilDue * 24 * 60 : 60,
    elapsed: 0,
    reportedBy: 'PPM Risk Engine',
    evidence: [],
    _dueLabel: dueLabel,
  } as KTask & { _dueLabel: string };
}

function SLAChip({ task }: { task: KTask }) {
  const sla = slaStatus(task.elapsed, task.slaMinutes);
  if (task.status === 'closed') return <span className="text-[9px] text-emerald-400 font-semibold">SLA Met</span>;
  return (
    <span className="text-[9px] font-bold" style={{ color: sla.chipColor }}>
      {sla.overdue ? `+${Math.abs(sla.left)}m over` : `${sla.left}m left`}
    </span>
  );
}

interface Props {
  onToast: ToastFn;
  prefilledTask?: PPMRiskPayload | null;
  onPrefilledTaskConsumed?: () => void;
}

export function Tasks({ onToast, prefilledTask, onPrefilledTaskConsumed }: Props) {
  const [search,    setSearch]    = useState('');
  const [status,    setStatus]    = useState('All');
  const [priority,  setPriority]  = useState('All');
  const [skill,     setSkill]     = useState('All');
  const [tech,      setTech]      = useState('All');
  const [selected,  setSelected]  = useState<KTask | null>(null);
  const [syntheticTasks, setSyntheticTasks] = useState<(KTask & { _dueLabel?: string })[]>([]);
  const lastPrefilledId = useRef<string | null>(null);

  useEffect(() => {
    if (!prefilledTask) return;
    const taskId = `PPM-${prefilledTask.id}`;
    if (lastPrefilledId.current === taskId) {
      const existing = syntheticTasks.find(t => t.id === taskId);
      if (existing) {
        setSelected(existing);
      }
      onPrefilledTaskConsumed?.();
      return;
    }
    lastPrefilledId.current = taskId;
    const synthetic = buildSyntheticTask(prefilledTask);
    setSyntheticTasks(prev => {
      const without = prev.filter(t => t.id !== synthetic.id);
      return [synthetic, ...without];
    });
    setSearch('');
    setStatus('All');
    setPriority('All');
    setSkill('All');
    setTech('All');
    setSelected(synthetic);
    onPrefilledTaskConsumed?.();
  }, [prefilledTask]);

  const allTasks = [...syntheticTasks, ...mockKanbanTasks];

  const filtered = allTasks.filter(t => {
    if (status   !== 'All' && t.status   !== status)   return false;
    if (priority !== 'All' && t.priority !== priority) return false;
    if (skill    !== 'All' && t.skill    !== skill)    return false;
    if (tech === 'Unassigned' && t.tech !== null) return false;
    if (tech !== 'All' && tech !== 'Unassigned' && t.tech !== tech) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) &&
                  !t.asset.toLowerCase().includes(search.toLowerCase()) &&
                  !t.location.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const kpiData = [
    { label: 'Total',    value: allTasks.length,                                                color: 'text-[#EEF3FA]' },
    { label: 'New',      value: allTasks.filter(t => t.status === 'new').length,                color: 'text-[#7A94B4]' },
    { label: 'Active',   value: allTasks.filter(t => ['assigned','in-progress'].includes(t.status)).length, color: 'text-blue-400' },
    { label: 'Overdue',  value: allTasks.filter(t => t.status === 'overdue').length,            color: 'text-red-400' },
    { label: 'Closed',   value: allTasks.filter(t => t.status === 'closed').length,             color: 'text-emerald-400' },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(46,127,255,0.15)] flex-shrink-0">
        <div>
          <h2 className="text-[#EEF3FA] font-bold text-base" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Work Orders</h2>
          <p className="text-[11px] text-[#7A94B4]">All field tasks · Silicon Oasis · {allTasks.length} work orders</p>
        </div>
        <div className="flex items-center gap-2">
          {kpiData.map(k => (
            <div key={k.label} className="text-center px-2.5 py-1 bg-[#112040] rounded-lg border border-[rgba(46,127,255,0.15)]">
              <div className={`text-[14px] font-bold ${k.color}`}>{k.value}</div>
              <div className="text-[8px] text-[#7A94B4] uppercase tracking-wide">{k.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 px-5 py-2.5 border-b border-[rgba(46,127,255,0.1)] flex-shrink-0 flex-wrap gap-y-2">
        <div className="flex items-center gap-1.5 bg-[#112040] rounded-lg px-2.5 py-1.5 border border-[rgba(46,127,255,0.2)] flex-shrink-0">
          <Search size={11} className="text-[#7A94B4]" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks…"
            className="bg-transparent text-[11px] text-[#EEF3FA] placeholder-[#7A94B4] outline-none w-28"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {ALL_STATUSES.map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`text-[10px] px-2 py-1 rounded-lg border transition-all ${status === s ? 'bg-[rgba(46,127,255,0.2)] border-[#2E7FFF] text-[#EEF3FA]' : 'border-[rgba(46,127,255,0.15)] text-[#7A94B4] hover:text-[#EEF3FA]'}`}>
              {STATUS_LABEL[s] || s}
            </button>
          ))}
        </div>
        <div className="flex gap-1 flex-wrap">
          {ALL_PRIORITIES.map(p => (
            <button key={p} onClick={() => setPriority(p)}
              className={`text-[10px] px-2 py-1 rounded-lg border capitalize transition-all ${priority === p ? 'bg-[rgba(46,127,255,0.2)] border-[#2E7FFF] text-[#EEF3FA]' : 'border-[rgba(46,127,255,0.15)] text-[#7A94B4] hover:text-[#EEF3FA]'}`}>
              {p}
            </button>
          ))}
        </div>
        <div className="flex gap-1 flex-wrap">
          {ALL_SKILLS.map(sk => (
            <button key={sk} onClick={() => setSkill(sk)}
              className={`text-[10px] px-2 py-1 rounded-lg border transition-all ${skill === sk ? 'bg-[rgba(46,127,255,0.2)] border-[#2E7FFF] text-[#EEF3FA]' : 'border-[rgba(46,127,255,0.15)] text-[#7A94B4] hover:text-[#EEF3FA]'}`}>
              {sk}
            </button>
          ))}
        </div>
        <div className="flex gap-1 flex-wrap">
          {ALL_TECHS.map(t => (
            <button key={t} onClick={() => setTech(t)}
              className={`text-[10px] px-2 py-1 rounded-lg border transition-all ${tech === t ? 'bg-[rgba(46,127,255,0.2)] border-[#2E7FFF] text-[#EEF3FA]' : 'border-[rgba(46,127,255,0.15)] text-[#7A94B4] hover:text-[#EEF3FA]'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className={`flex flex-col overflow-hidden transition-all duration-300 ${selected ? 'flex-[55]' : 'flex-1'}`}>
          <div className="hidden sm:grid grid-cols-[2.5fr_1.5fr_1fr_1.5fr_1.2fr_1fr] px-5 py-2 text-[9px] text-[#7A94B4] uppercase tracking-wide border-b border-[rgba(46,127,255,0.08)] flex-shrink-0">
            {['Task', 'Location', 'Priority', 'SLA', 'Status', 'Technician'].map(h => <div key={h}>{h}</div>)}
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filtered.map(task => {
              const isSelected = selected?.id === task.id;
              const sla = slaStatus(task.elapsed, task.slaMinutes);
              const isPPM = task.id.startsWith('PPM-');
              return (
                <motion.button
                  key={task.id}
                  onClick={() => setSelected(isSelected ? null : task)}
                  whileTap={{ scale: 0.995 }}
                  className={`w-full text-left px-5 py-3 border-b border-[rgba(46,127,255,0.08)] hover:bg-white/[0.02] transition-all ${isSelected ? 'bg-[rgba(46,127,255,0.08)]' : ''} ${isPPM ? 'border-l-2 border-l-amber-500/50' : ''}`}
                >
                  <div className="grid grid-cols-[2.5fr_1.5fr_1fr_1.5fr_1.2fr_1fr] items-center gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[task.priority]}`} />
                        <span className="text-[12px] text-[#EEF3FA] font-semibold">{task.title}</span>
                        {isPPM && <span className="text-[9px] text-amber-400 font-bold border border-amber-500/40 bg-amber-500/10 px-1 rounded">PPM</span>}
                      </div>
                      <div className="text-[9px] text-[#7A94B4] flex items-center gap-1.5 pl-3.5">
                        <span className={`text-[9px] font-bold px-1 py-0.5 rounded border ${SKILL_COLOR[task.skill]}`}>{task.skill}</span>
                        <span>{task.asset}</span>
                        {task.evidence.length > 0 && (
                          <span className="flex items-center gap-0.5 text-amber-400">
                            <FileImage size={9} />{task.evidence.length}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[11px] text-[#7A94B4]">{task.location}</span>
                    <span className={`text-[9px] font-bold capitalize px-1.5 py-0.5 rounded border w-fit ${SEVERITY_BADGE[task.priority]}`}>
                      {task.priority}
                    </span>
                    <div>
                      {task.status !== 'closed' ? (
                        <>
                          <AnimatedBar value={sla.percent} color={sla.barColor} height="h-1" />
                          <SLAChip task={task} />
                        </>
                      ) : (
                        <div className="flex items-center gap-1 text-emerald-400">
                          <CheckCircle size={10} />
                          <span className="text-[10px]">SLA Met</span>
                        </div>
                      )}
                    </div>
                    <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-semibold w-fit ${STATUS_BG[task.status]} ${TASK_STATUS_COLOR[task.status]}`}>
                      {STATUS_LABEL[task.status]}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {task.tech ? (
                        <>
                          <TechAvatar initials={TECH_INITIALS[task.tech] || task.tech.slice(0,2)} size={6} />
                          <span className="text-[10px] text-[#EEF3FA]">{task.tech}</span>
                        </>
                      ) : (
                        <span className="text-[10px] text-[#7A94B4] opacity-50">Unassigned</span>
                      )}
                      <ChevronRight size={11} className={`text-[#7A94B4] ml-auto flex-shrink-0 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                </motion.button>
              );
            })}
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-2">
                <CheckSquare size={28} className="text-[#7A94B4] opacity-30" />
                <span className="text-[12px] text-[#7A94B4] opacity-60">No tasks match filters</span>
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.22 }}
              className="flex-[45] border-l border-[rgba(46,127,255,0.2)] flex flex-col overflow-hidden bg-[#0A1628]"
            >
              <div className="flex items-start justify-between px-5 py-4 border-b border-[rgba(46,127,255,0.15)] flex-shrink-0">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${PRIORITY_DOT[selected.priority]}`} />
                    <span className={`text-[9px] font-bold capitalize px-1.5 py-0.5 rounded border ${SEVERITY_BADGE[selected.priority]}`}>{selected.priority}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${SKILL_COLOR[selected.skill]}`}>{selected.skill}</span>
                    {selected.id.startsWith('PPM-') && (
                      <span className="text-[9px] text-amber-400 font-bold border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 rounded">PPM DRAFT</span>
                    )}
                  </div>
                  <div className="text-[#EEF3FA] font-bold text-sm">{selected.title}</div>
                  <div className="text-[10px] text-[#7A94B4]">{selected.location}</div>
                </div>
                <button onClick={() => setSelected(null)} className="text-[#7A94B4] hover:text-white transition-colors">
                  <X size={15} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
                {selected.id.startsWith('PPM-') && (
                  <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                    <Clock size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[11px] text-amber-400 font-semibold mb-0.5">PPM Draft — Review before finalising</div>
                      <div className="text-[10px] text-[#7A94B4]">Pre-filled from Predictive AI Risk Engine. Assign a technician and confirm to create this work order.</div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Task ID',     value: selected.id },
                    { label: 'Asset',       value: selected.asset },
                    { label: 'Reported By', value: selected.reportedBy },
                    ...(selected.id.startsWith('PPM-') && (selected as KTask & { _dueLabel?: string })._dueLabel
                      ? [
                          { label: 'Due Date',    value: (selected as KTask & { _dueLabel?: string })._dueLabel! },
                          { label: 'Risk Level',  value: selected.priority.toUpperCase() },
                        ]
                      : [
                          { label: 'SLA Window',  value: `${selected.slaMinutes} min` },
                          { label: 'Elapsed',     value: `${selected.elapsed} min` },
                        ]
                    ),
                    { label: 'Evidence',    value: selected.evidence.length > 0 ? `${selected.evidence.length} file(s)` : 'None submitted' },
                  ].map(r => (
                    <div key={r.label} className="bg-[#112040] rounded-lg p-2.5">
                      <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-0.5">{r.label}</div>
                      <div className="text-[11px] text-[#EEF3FA] font-semibold">{r.value}</div>
                    </div>
                  ))}
                </div>

                {selected.status !== 'closed' && (
                  <div>
                    <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-1.5">SLA Progress</div>
                    <AnimatedBar value={slaStatus(selected.elapsed, selected.slaMinutes).percent} color={slaStatus(selected.elapsed, selected.slaMinutes).barColor} height="h-2" />
                    <div className="flex justify-between mt-1 text-[9px] text-[#7A94B4]">
                      <span>0 min</span>
                      <span>{selected.slaMinutes} min limit</span>
                    </div>
                  </div>
                )}

                {selected.tech && (
                  <div>
                    <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-1.5">Assigned Technician</div>
                    <div className="flex items-center gap-2.5 p-2.5 bg-[#112040] rounded-xl border border-[rgba(46,127,255,0.2)]">
                      <TechAvatar initials={TECH_INITIALS[selected.tech] || selected.tech.slice(0,2)} size={8} />
                      <div>
                        <div className="text-[12px] text-[#EEF3FA] font-semibold">{selected.tech}</div>
                        <div className={`text-[10px] ${selected.status === 'in-progress' ? 'text-cyan-400' : 'text-blue-400'}`}>
                          {selected.status === 'in-progress' ? 'On-site · Active' : 'Assigned'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selected.evidence.length > 0 && (
                  <div>
                    <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-1.5">Evidence Files</div>
                    <div className="space-y-1.5">
                      {selected.evidence.map((file, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-[#112040] rounded-lg border border-[rgba(46,127,255,0.15)]">
                          <FileImage size={12} className="text-amber-400" />
                          <span className="text-[11px] text-[#EEF3FA]">{file}</span>
                          <CheckCircle size={11} className="text-emerald-400 ml-auto" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(DRAWER_ACTIONS[selected.status] || []).length > 0 && (
                  <div>
                    <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-2">Quick Actions</div>
                    <div className="space-y-2">
                      {(DRAWER_ACTIONS[selected.status] || []).map((action, i) => (
                        <button
                          key={i}
                          onClick={() => onToast(`${action.label} — ${selected.id}`, 'info')}
                          className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-colors hover:opacity-90 ${action.bg} ${action.color}`}
                        >
                          <Wrench size={12} />
                          <span className="text-[11px] font-semibold">{action.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selected.status === 'closed' && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                    <CheckCircle size={14} className="text-emerald-400" />
                    <span className="text-[12px] text-emerald-400 font-semibold">Work order closed · SLA met</span>
                  </div>
                )}

                {selected.status === 'overdue' && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <AlertTriangle size={14} className="text-red-400" />
                    <div>
                      <div className="text-[11px] text-red-400 font-semibold">SLA Breached</div>
                      <div className="text-[10px] text-[#7A94B4]">{slaStatus(selected.elapsed, selected.slaMinutes).label}</div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
