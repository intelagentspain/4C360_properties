import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, ChevronDown, ChevronRight, AlertTriangle,
  CheckCircle, Clock, User, Wrench, X, Brain,
} from 'lucide-react';
import { mockPPMSchedule, mockAssets, mockChecklist, mockParts, mockIncidents } from '@/data/mockData';
import { scoreColor, type ToastFn } from '@/lib/ui';
import { AnimatedBar } from '@/components/shared/AnimatedBar';
import { TechAvatar } from '@/components/shared/TechAvatar';
import { AssignTechModal } from '@/components/shared/AssignTechModal';
import { AssetExpertCopilot } from '@/components/shared/AssetExpertCopilot';

type PPMItem = typeof mockPPMSchedule[0];

const RISK_CONFIG: Record<string, { label: string; sublabel: string; dot: string; text: string; border: string; bg: string; headerBg: string }> = {
  overdue:  { label: 'Overdue',          sublabel: 'Past due date',         dot: 'bg-red-400',    text: 'text-red-400',    border: 'border-red-500/30',    bg: 'bg-red-500/5',     headerBg: 'bg-red-500/10' },
  critical: { label: 'Critical',         sublabel: 'Due within 3 days',     dot: 'bg-orange-400', text: 'text-orange-400', border: 'border-orange-500/30', bg: 'bg-orange-500/5',  headerBg: 'bg-orange-500/10' },
  high:     { label: 'This Week',        sublabel: 'Due within 14 days',    dot: 'bg-amber-400',  text: 'text-amber-400',  border: 'border-amber-500/30',  bg: 'bg-amber-500/5',   headerBg: 'bg-amber-500/10' },
  medium:   { label: 'This Month',       sublabel: 'Due within 30 days',    dot: 'bg-blue-400',   text: 'text-blue-400',   border: 'border-blue-500/30',   bg: 'bg-blue-500/5',    headerBg: 'bg-blue-500/10' },
  low:      { label: 'Upcoming',         sublabel: 'Scheduled — 30+ days',  dot: 'bg-emerald-400', text: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', headerBg: 'bg-emerald-500/10' },
};

const RISK_ORDER = ['overdue', 'critical', 'high', 'medium', 'low'];

const TYPE_COLOR: Record<string, string> = {
  HVAC:      'text-blue-400 bg-blue-500/15 border-blue-500/30',
  Lift:      'text-purple-400 bg-purple-500/15 border-purple-500/30',
  Electrical:'text-amber-400 bg-amber-500/15 border-amber-500/30',
  Safety:    'text-red-400 bg-red-500/15 border-red-500/30',
  Plumbing:  'text-cyan-400 bg-cyan-500/15 border-cyan-500/30',
  General:   'text-[#7A94B4] bg-white/5 border-white/10',
};

const TECH_INITIALS: Record<string, string> = {
  'Karim R.':  'KR',
  'Ahmed K.':  'AK',
  'Sara M.':   'SM',
  'Faisal N.': 'FN',
  'Omar T.':   'OT',
};

function DaysChip({ days }: { days: number }) {
  if (days < 0) return <span className="text-red-400 font-bold text-[10px]">{Math.abs(days)}d overdue</span>;
  if (days <= 3) return <span className="text-orange-400 font-bold text-[10px]">Due in {days}d</span>;
  if (days <= 14) return <span className="text-amber-400 font-bold text-[10px]">Due in {days}d</span>;
  return <span className="text-[#7A94B4] text-[10px]">Due in {days}d</span>;
}

function PPMRow({ item, onToast, onAssignTech, onCopilot }: { item: PPMItem; onToast: ToastFn; onAssignTech: (item: PPMItem) => void; onCopilot: (item: PPMItem) => void }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = RISK_CONFIG[item.riskLevel];
  const condColor = scoreColor(item.condition);

  return (
    <div className={`border-b border-[rgba(46,127,255,0.08)] last:border-0`}>
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full text-left px-5 py-3 hover:bg-white/[0.02] transition-all"
      >
        <div className="grid grid-cols-[2fr_1fr_1fr_1.2fr_1fr_1.5fr_1fr] items-center gap-2">
          <div>
            <div className="text-[12px] text-[#EEF3FA] font-semibold">{item.asset}</div>
            <div className="text-[9px] text-[#7A94B4]">{item.task}</div>
          </div>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border w-fit ${TYPE_COLOR[item.type] || TYPE_COLOR['General']}`}>{item.type}</span>
          <span className="text-[10px] text-[#7A94B4]">{item.location}</span>
          <DaysChip days={item.daysUntilDue} />
          <span className="text-[10px] text-[#7A94B4]">{item.lastDone}d ago</span>
          <div>
            <AnimatedBar value={item.condition} color={condColor} height="h-1.5" />
            <span className="text-[9px] font-bold" style={{ color: condColor }}>{item.condition}%</span>
          </div>
          <div className="flex items-center justify-end gap-2">
            {item.tech ? (
              <TechAvatar initials={TECH_INITIALS[item.tech] || item.tech.slice(0,2)} size={6} />
            ) : (
              <span className="text-[9px] text-[#7A94B4] opacity-50">–</span>
            )}
            <ChevronDown size={12} className={`text-[#7A94B4] transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 pt-1 bg-[rgba(17,32,64,0.4)]">
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-[#0A1628] rounded-lg p-2.5">
                  <div className="text-[9px] text-[#7A94B4] uppercase mb-0.5">PPM ID</div>
                  <div className="text-[11px] text-[#EEF3FA] font-semibold">{item.id}</div>
                </div>
                <div className="bg-[#0A1628] rounded-lg p-2.5">
                  <div className="text-[9px] text-[#7A94B4] uppercase mb-0.5">Next Due</div>
                  <div className="text-[11px] text-[#EEF3FA] font-semibold">{item.nextDueDate}</div>
                </div>
                <div className="bg-[#0A1628] rounded-lg p-2.5">
                  <div className="text-[9px] text-[#7A94B4] uppercase mb-0.5">Cycle</div>
                  <div className="text-[11px] text-[#EEF3FA] font-semibold">Every {item.daysScheduled}d</div>
                </div>
              </div>
              {item.notes && (
                <div className="p-2.5 bg-[rgba(46,127,255,0.06)] border border-[rgba(46,127,255,0.15)] rounded-lg mb-3">
                  <div className="text-[10px] text-[#7A94B4] mb-0.5">Notes</div>
                  <div className="text-[11px] text-[#EEF3FA]">{item.notes}</div>
                </div>
              )}
              {item.tech ? (
                <div className="mb-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <CheckCircle size={10} className="text-emerald-400" />
                    <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wide">Tech Assigned</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 bg-emerald-500/5 rounded-xl border border-emerald-500/25">
                    <TechAvatar initials={TECH_INITIALS[item.tech] || item.tech.slice(0,2)} size={7} />
                    <div className="flex-1">
                      <div className="text-[11px] text-[#EEF3FA] font-semibold">{item.tech}</div>
                      <div className="text-[9px] text-emerald-400">Assigned · {item.skill}</div>
                    </div>
                  </div>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onToast(`PPM scheduled for ${item.asset}`, 'success')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2E7FFF] text-white text-[10px] font-semibold hover:bg-blue-500 transition-colors"
                >
                  <Calendar size={11} /> Schedule Now
                </button>
                {item.tech ? (
                  <button
                    onClick={() => onAssignTech(item)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[#7A94B4] text-[10px] hover:text-[#EEF3FA] hover:bg-white/10 transition-colors"
                  >
                    <User size={11} /> Reassign
                  </button>
                ) : (
                  <button
                    onClick={() => onAssignTech(item)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[#EEF3FA] text-[10px] font-semibold hover:bg-white/10 transition-colors"
                  >
                    <User size={11} /> Assign Tech
                  </button>
                )}
                <button
                  onClick={() => onToast(`Deferral requested for ${item.asset}`, 'warning')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[#7A94B4] text-[10px] hover:text-[#EEF3FA] hover:bg-white/10 transition-colors"
                >
                  <Clock size={11} /> Defer
                </button>
                <button
                  onClick={() => onCopilot(item)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(46,127,255,0.12)] border border-[rgba(46,127,255,0.3)] text-[#2E7FFF] text-[10px] font-semibold hover:bg-[rgba(46,127,255,0.2)] transition-colors"
                >
                  <Brain size={11} /> Expert Copilot
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface Props { onToast: ToastFn }

export function PPMSchedule({ onToast }: Props) {
  const [selectedAsset, setSelectedAsset] = useState<typeof mockAssets[0] | null>(null);
  const [assignTarget, setAssignTarget] = useState<PPMItem | null>(null);
  const [ppmTechOverrides, setPpmTechOverrides] = useState<Record<string, string>>({});
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [copilotItem, setCopilotItem] = useState<PPMItem | null>(null);

  const grouped = RISK_ORDER.reduce((acc, level) => {
    acc[level] = mockPPMSchedule.filter(p => p.riskLevel === level);
    return acc;
  }, {} as Record<string, PPMItem[]>);

  const kpi = {
    overdue:  mockPPMSchedule.filter(p => p.riskLevel === 'overdue').length,
    critical: mockPPMSchedule.filter(p => p.riskLevel === 'critical').length,
    high:     mockPPMSchedule.filter(p => p.riskLevel === 'high').length,
    total:    mockPPMSchedule.length,
    avgCond:  Math.round(mockAssets.reduce((s, a) => s + a.condition, 0) / mockAssets.length),
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(46,127,255,0.15)] flex-shrink-0">
        <div>
          <h2 className="text-[#EEF3FA] font-bold text-base" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>PPM Schedule</h2>
          <p className="text-[11px] text-[#7A94B4]">Planned preventive maintenance · Silicon Oasis · {kpi.total} tasks</p>
        </div>
        <div className="flex items-center gap-2">
          {[
            { label: 'Overdue',  value: kpi.overdue,  color: 'text-red-400 bg-red-500/10 border-red-500/30' },
            { label: 'Critical', value: kpi.critical, color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' },
            { label: 'High',     value: kpi.high,     color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
            { label: 'Avg Cond', value: `${kpi.avgCond}%`, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
          ].map(k => (
            <div key={k.label} className={`text-center px-2.5 py-1 rounded-lg border ${k.color}`}>
              <div className="text-[13px] font-bold">{k.value}</div>
              <div className="text-[8px] uppercase tracking-wide opacity-80">{k.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className={`flex flex-col overflow-hidden transition-all duration-300 ${selectedAsset ? 'flex-[60]' : 'flex-1'}`}>
          <div className="px-5 py-3 border-b border-[rgba(46,127,255,0.1)] flex-shrink-0">
            <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-2">Asset Health Summary</div>
            <div className="grid grid-cols-5 gap-2">
              {mockAssets.map(asset => {
                const condColor = scoreColor(asset.condition);
                const isSelected = selectedAsset?.id === asset.id;
                return (
                  <button
                    key={asset.id}
                    onClick={() => setSelectedAsset(isSelected ? null : asset)}
                    className={`p-2 rounded-xl border transition-all hover:border-[rgba(46,127,255,0.4)] ${isSelected ? 'bg-[rgba(46,127,255,0.12)] border-[rgba(46,127,255,0.4)]' : 'bg-[#112040] border-[rgba(46,127,255,0.15)]'}`}
                  >
                    <div className="text-[9px] text-[#EEF3FA] font-semibold mb-1.5 truncate text-left">{asset.name.split(' ')[0]}</div>
                    <AnimatedBar value={asset.condition} color={condColor} height="h-1.5" />
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[9px] font-bold" style={{ color: condColor }}>{asset.condition}%</span>
                      <span className="text-[8px] text-[#7A94B4]">{asset.nextPPM}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1.2fr_1fr_1.5fr_1fr] px-5 py-2 text-[9px] text-[#7A94B4] uppercase tracking-wide border-b border-[rgba(46,127,255,0.08)] flex-shrink-0">
            {['Asset / Task', 'Type', 'Location', 'Due In', 'Last Done', 'Condition', 'Tech'].map(h => <div key={h}>{h}</div>)}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {RISK_ORDER.map(level => {
              const items = grouped[level];
              if (items.length === 0) return null;
              const cfg = RISK_CONFIG[level];
              return (
                <div key={level}>
                  <div className={`flex items-center gap-2 px-5 py-2 ${cfg.headerBg} border-b border-[rgba(46,127,255,0.08)]`}>
                    <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-wide ${cfg.text}`}>{cfg.label}</span>
                    <span className={`text-[9px] ${cfg.text} opacity-60`}>· {cfg.sublabel}</span>
                    <span className={`text-[9px] ${cfg.text} opacity-40 ml-auto`}>{items.length} task{items.length > 1 ? 's' : ''}</span>
                  </div>
                  {items.map(item => {
                  const overrideTech = ppmTechOverrides[item.id];
                  const resolvedItem = overrideTech
                    ? { ...item, tech: overrideTech, techId: TECH_INITIALS[overrideTech] ?? overrideTech.slice(0, 2) }
                    : item;
                  return (
                    <PPMRow
                      key={item.id}
                      item={resolvedItem}
                      onToast={onToast}
                      onAssignTech={setAssignTarget}
                      onCopilot={item => { setCopilotItem(item); setCopilotOpen(true); }}
                    />
                  );
                })}
                </div>
              );
            })}
          </div>
        </div>

        <AnimatePresence>
          {selectedAsset && (
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.22 }}
              className="flex-[40] border-l border-[rgba(46,127,255,0.2)] flex flex-col overflow-hidden bg-[#0A1628]"
            >
              <div className="flex items-start justify-between px-5 py-4 border-b border-[rgba(46,127,255,0.15)] flex-shrink-0">
                <div>
                  <div className="text-[#EEF3FA] font-bold text-sm">{selectedAsset.name}</div>
                  <div className="text-[10px] text-[#7A94B4]">{selectedAsset.location}</div>
                </div>
                <button onClick={() => setSelectedAsset(null)} className="text-[#7A94B4] hover:text-white transition-colors">
                  <X size={15} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
                <div>
                  <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-1.5">Condition Score</div>
                  <div className="flex items-end gap-2 mb-1.5">
                    <span className="text-[28px] font-bold" style={{ color: scoreColor(selectedAsset.condition) }}>
                      {selectedAsset.condition}%
                    </span>
                    <span className="text-[11px] text-[#7A94B4] mb-1">overall health</span>
                  </div>
                  <AnimatedBar value={selectedAsset.condition} color={scoreColor(selectedAsset.condition)} height="h-2.5" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Asset ID',      value: selectedAsset.id },
                    { label: 'Type',          value: selectedAsset.type },
                    { label: 'Last Service',  value: selectedAsset.lastService },
                    { label: 'Next PPM',      value: selectedAsset.nextPPM },
                  ].map(r => (
                    <div key={r.label} className="bg-[#112040] rounded-lg p-2.5">
                      <div className="text-[9px] text-[#7A94B4] uppercase mb-0.5">{r.label}</div>
                      <div className="text-[11px] text-[#EEF3FA] font-semibold">{r.value}</div>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-1.5">Status</div>
                  {selectedAsset.status === 'critical' && (
                    <div className="flex items-center gap-2 p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl">
                      <AlertTriangle size={13} className="text-red-400" />
                      <span className="text-[11px] text-red-400 font-semibold">Critical — PPM overdue · Immediate attention required</span>
                    </div>
                  )}
                  {selectedAsset.status === 'warning' && (
                    <div className="flex items-center gap-2 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                      <AlertTriangle size={13} className="text-amber-400" />
                      <span className="text-[11px] text-amber-400 font-semibold">Warning — Schedule PPM within 14 days</span>
                    </div>
                  )}
                  {selectedAsset.status === 'ok' && (
                    <div className="flex items-center gap-2 p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                      <CheckCircle size={13} className="text-emerald-400" />
                      <span className="text-[11px] text-emerald-400 font-semibold">Healthy — PPM on schedule</span>
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-2">Linked PPM Tasks</div>
                  {mockPPMSchedule.filter(p => p.assetId === selectedAsset.id).map(p => (
                    <div key={p.id} className="p-2.5 bg-[#112040] rounded-xl border border-[rgba(46,127,255,0.15)] mb-2">
                      <div className="text-[11px] text-[#EEF3FA] font-semibold">{p.task}</div>
                      <div className="text-[9px] text-[#7A94B4]">Due: {p.nextDueDate} · <DaysChip days={p.daysUntilDue} /></div>
                    </div>
                  ))}
                  {mockPPMSchedule.filter(p => p.assetId === selectedAsset.id).length === 0 && (
                    <div className="text-[11px] text-[#7A94B4] opacity-50">No linked PPM tasks</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onToast(`PPM scheduled for ${selectedAsset.name}`, 'success')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#2E7FFF] text-white text-[11px] font-semibold hover:bg-blue-500 transition-colors"
                  >
                    <Wrench size={12} /> Schedule PPM
                  </button>
                  <button
                    onClick={() => onToast(`Viewing asset history for ${selectedAsset.name}`, 'info')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 border border-white/10 text-[#EEF3FA] text-[11px] font-semibold hover:bg-white/10 transition-colors"
                  >
                    <Clock size={12} /> View History
                  </button>
                </div>
                <button
                  onClick={() => {
                    const linkedTask = mockPPMSchedule.find(p => p.assetId === selectedAsset.id);
                    setCopilotItem(linkedTask ?? null);
                    setCopilotOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[rgba(46,127,255,0.12)] border border-[rgba(46,127,255,0.3)] text-[#2E7FFF] text-[11px] font-bold hover:bg-[rgba(46,127,255,0.2)] transition-colors"
                >
                  <Brain size={12} /> Expert Copilot
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AssignTechModal
        open={assignTarget !== null}
        workOrder={assignTarget ? {
          id: assignTarget.id,
          title: assignTarget.task,
          skill: assignTarget.type,
          location: assignTarget.location,
        } : null}
        onConfirm={techName => {
          if (!assignTarget) return;
          setPpmTechOverrides(prev => ({ ...prev, [assignTarget.id]: techName }));
          setAssignTarget(null);
          onToast(`${techName} assigned to ${assignTarget.id}`, 'success');
        }}
        onCancel={() => setAssignTarget(null)}
      />

      <AssetExpertCopilot
        open={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        variant="drawer"
        assetType={copilotItem?.type ?? selectedAsset?.type ?? 'HVAC'}
        assetName={copilotItem?.asset ?? selectedAsset?.name}
        assetId={copilotItem?.assetId ?? selectedAsset?.id}
        siteName="Silicon Oasis"
        ppmTemplateName={copilotItem?.task}
        currentStep={
          mockChecklist.find(c => !c.done && c.mandatory)?.text ??
          mockChecklist.find(c => !c.done)?.text
        }
        checklistItems={mockChecklist.map(c => c.text)}
        mandatorySteps={mockChecklist.filter(c => c.mandatory).map(c => c.text)}
        evidenceRequired={mockChecklist.filter(c => c.evidenceRequired).map(c => c.text)}
        completedSteps={mockChecklist.filter(c => c.done).map(c => c.text)}
        techReadings={copilotItem ? {
          'Asset Condition Score': `${copilotItem.condition}% health`,
          'Days Since Last Service': `${copilotItem.lastDone} days`,
          'Risk Level': copilotItem.riskLevel,
          ...(copilotItem.notes ? { 'IoT / Sensor Notes': copilotItem.notes } : {}),
        } : undefined}
        priorIncidents={
          mockIncidents
            .filter(inc =>
              copilotItem
                ? inc.title.toLowerCase().includes(copilotItem.type.toLowerCase()) ||
                  (inc.description ?? '').toLowerCase().includes((copilotItem.asset ?? '').toLowerCase().split(' ')[0])
                : selectedAsset
                  ? inc.title.toLowerCase().includes(selectedAsset.type.toLowerCase())
                  : false
            )
            .slice(0, 3)
            .map(inc => ({
              title: inc.title,
              description: inc.description,
              date: inc.capturedAt,
              status: inc.status,
              severity: inc.severity,
            }))
        }
        partsAvailability={mockParts.map(p => ({
          name: p.name,
          inStock: p.inStock,
          status: p.status,
        }))}
        onCreateIncident={prefill => {
          onToast(`Corrective incident prefilled: ${prefill.title}`, 'warning');
          setCopilotOpen(false);
        }}
      />
    </div>
  );
}
