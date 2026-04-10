import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, CheckCircle, X, AlertTriangle, Zap,
  Eye, ChevronRight,
} from 'lucide-react';
import { mockAICaptures } from '@/data/mockData';
import { SEVERITY_BADGE, scoreColor, type ToastFn } from '@/lib/ui';
import { AnimatedBar } from '@/components/shared/AnimatedBar';

type CaptureStatus = 'pending' | 'confirmed' | 'rejected';

interface CaptureSignal { label: string; match: number; }

interface Capture {
  id: string;
  category: string;
  subCategory: string;
  title: string;
  location: string;
  severity: string;
  confidence: number;
  source: string;
  capturedAt: string;
  status: CaptureStatus;
  linkedIncident: string | null;
  linkedJob: string | null;
  signals: CaptureSignal[];
  gradient: string;
  boxColor: string;
}

const CATEGORY_COLOR: Record<string, string> = {
  HVAC:       'text-blue-400 bg-blue-500/15 border-blue-500/30',
  Plumbing:   'text-cyan-400 bg-cyan-500/15 border-cyan-500/30',
  Electrical: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
  Mechanical: 'text-purple-400 bg-purple-500/15 border-purple-500/30',
  Safety:     'text-red-400 bg-red-500/15 border-red-500/30',
};

const STATUS_CONFIG = {
  pending:   { label: 'Pending Review', dot: 'bg-amber-400',   text: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/30' },
  confirmed: { label: 'Confirmed',      dot: 'bg-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  rejected:  { label: 'Rejected',       dot: 'bg-[#7A94B4]',   text: 'text-[#7A94B4]',   bg: 'bg-white/5 border-white/10' },
};

const ALL_STATUSES   = ['All', 'pending', 'confirmed', 'rejected'];
const ALL_CATEGORIES = ['All', 'HVAC', 'Plumbing', 'Electrical', 'Mechanical', 'Safety'];

function PhotoPlaceholder({ capture }: { capture: Capture }) {
  const boxPct = { top: '18%', left: '28%', width: '44%', height: '48%' };
  return (
    <div className={`relative h-36 bg-gradient-to-br ${capture.gradient} rounded-xl overflow-hidden border border-[rgba(255,255,255,0.06)]`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <Camera size={28} className="text-[#7A94B4] opacity-10" />
      </div>
      <div
        className="absolute border-2 rounded"
        style={{ ...boxPct, borderColor: capture.boxColor, opacity: 0.85 }}
      >
        <div
          className="absolute -top-4 left-0 text-[8px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap"
          style={{ background: capture.boxColor + '33', color: capture.boxColor, border: `1px solid ${capture.boxColor}66` }}
        >
          {capture.category} · {capture.confidence}%
        </div>
        <div className="absolute -bottom-0 -left-0 w-2 h-2 border-b-2 border-l-2 rounded-bl" style={{ borderColor: capture.boxColor }} />
        <div className="absolute -bottom-0 -right-0 w-2 h-2 border-b-2 border-r-2 rounded-br" style={{ borderColor: capture.boxColor }} />
        <div className="absolute -top-0 -left-0 w-2 h-2 border-t-2 border-l-2 rounded-tl" style={{ borderColor: capture.boxColor }} />
        <div className="absolute -top-0 -right-0 w-2 h-2 border-t-2 border-r-2 rounded-tr" style={{ borderColor: capture.boxColor }} />
      </div>
      <div className="absolute top-2 right-2 flex items-center gap-1 text-[8px] font-mono" style={{ color: capture.boxColor }}>
        <div className="w-1 h-1 rounded-full animate-pulse" style={{ background: capture.boxColor }} />
        AI SCAN
      </div>
      <div className="absolute bottom-2 left-2 text-[8px] text-[#7A94B4] font-mono opacity-60">{capture.capturedAt}</div>
      <div className="absolute bottom-2 right-2 text-[8px] text-[#7A94B4] opacity-50">SO-CCTV-{capture.id.slice(-3)}</div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
    </div>
  );
}

function CaptureCard({ capture, onAction, onSelect, isSelected }: {
  capture: Capture;
  onAction: (id: string, action: CaptureStatus) => void;
  onSelect: () => void;
  isSelected: boolean;
}) {
  const st = STATUS_CONFIG[capture.status];
  const conf = capture.confidence;
  const confColor = scoreColor(conf);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-[rgba(17,32,64,0.85)] border rounded-2xl overflow-hidden transition-all ${
        isSelected ? 'border-[rgba(46,127,255,0.5)]' : 'border-[rgba(46,127,255,0.18)] hover:border-[rgba(46,127,255,0.35)]'
      } ${capture.status === 'rejected' ? 'opacity-60' : ''}`}
    >
      <div className="relative">
        <PhotoPlaceholder capture={capture} />
        <div className="absolute top-2 left-2 flex items-center gap-1">
          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${SEVERITY_BADGE[capture.severity]}`}>
            {capture.severity}
          </span>
          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${CATEGORY_COLOR[capture.category]}`}>
            {capture.category}
          </span>
        </div>
      </div>

      <div className="p-3 space-y-2.5">
        <div>
          <div className="text-[12px] text-[#EEF3FA] font-semibold leading-snug">{capture.title}</div>
          <div className="text-[10px] text-[#7A94B4]">{capture.location}</div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] text-[#7A94B4]">AI Confidence</span>
            <span className="text-[10px] font-bold" style={{ color: confColor }}>{conf}%</span>
          </div>
          <AnimatedBar value={conf} color={confColor} height="h-1.5" />
        </div>

        <div className="flex items-center justify-between">
          <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-semibold ${st.bg} ${st.text}`}>
            <div className={`w-1 h-1 rounded-full flex-shrink-0 ${st.dot}`} />
            {st.label}
          </div>
          <span className="text-[9px] text-[#7A94B4]">{capture.source}</span>
        </div>

        <div className="text-[9px] text-[#7A94B4] flex items-center gap-1">
          <Zap size={9} className="text-cyan-400" />
          {capture.signals[0]?.label} · {capture.signals[0]?.match}% match
        </div>

        <div className="flex gap-1.5 pt-1">
          {capture.status === 'pending' && (
            <>
              <button
                onClick={() => onAction(capture.id, 'confirmed')}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold hover:bg-emerald-500/20 transition-colors"
              >
                <CheckCircle size={10} /> Confirm
              </button>
              <button
                onClick={() => onAction(capture.id, 'rejected')}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[#7A94B4] text-[10px] hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-colors"
              >
                <X size={10} /> Reject
              </button>
            </>
          )}
          <button
            onClick={onSelect}
            className={`${capture.status === 'pending' ? 'w-8' : 'flex-1'} flex items-center justify-center gap-1 py-1.5 rounded-lg border transition-colors ${
              isSelected ? 'bg-[rgba(46,127,255,0.2)] border-[#2E7FFF] text-blue-400' : 'bg-white/5 border-white/10 text-[#7A94B4] hover:text-[#EEF3FA]'
            } text-[10px]`}
          >
            <Eye size={10} />
            {capture.status !== 'pending' && <span>Detail</span>}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function DetailPanel({ capture, onClose, onAction }: {
  capture: Capture;
  onClose: () => void;
  onAction: (id: string, action: CaptureStatus) => void;
}) {
  const st = STATUS_CONFIG[capture.status];
  const confColor = scoreColor(capture.confidence);
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.22 }}
      className="w-80 flex-shrink-0 border-l border-[rgba(46,127,255,0.2)] flex flex-col overflow-hidden bg-[#0A1628]"
    >
      <div className="flex items-start justify-between px-5 py-4 border-b border-[rgba(46,127,255,0.15)] flex-shrink-0">
        <div>
          <div className="text-[#EEF3FA] font-bold text-sm">{capture.title}</div>
          <div className="text-[10px] text-[#7A94B4]">{capture.location}</div>
        </div>
        <button onClick={onClose} className="text-[#7A94B4] hover:text-white transition-colors">
          <X size={15} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
        <PhotoPlaceholder capture={capture} />

        <div>
          <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-1.5">AI Confidence</div>
          <div className="flex items-end gap-2 mb-1.5">
            <span className="text-[28px] font-bold" style={{ color: confColor }}>{capture.confidence}%</span>
            <span className="text-[11px] text-[#7A94B4] mb-1">confidence</span>
          </div>
          <AnimatedBar value={capture.confidence} color={confColor} height="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Capture ID',  value: capture.id },
            { label: 'Category',    value: capture.category },
            { label: 'Sub-Type',    value: capture.subCategory },
            { label: 'Source',      value: capture.source },
            { label: 'Severity',    value: capture.severity.charAt(0).toUpperCase() + capture.severity.slice(1) },
            { label: 'Captured',    value: capture.capturedAt },
          ].map(r => (
            <div key={r.label} className="bg-[#112040] rounded-lg p-2.5">
              <div className="text-[9px] text-[#7A94B4] uppercase mb-0.5">{r.label}</div>
              <div className="text-[11px] text-[#EEF3FA] font-semibold capitalize">{r.value}</div>
            </div>
          ))}
        </div>

        <div>
          <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-2">Detection Signals</div>
          <div className="space-y-2">
            {capture.signals.map((sig, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 bg-[rgba(46,127,255,0.06)] border border-[rgba(46,127,255,0.15)] rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] text-[#7A94B4]">Detection signal</div>
                  <div className="text-[11px] text-[#EEF3FA]">{sig.label}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[10px] font-bold text-emerald-400">{sig.match}%</div>
                  <div className="w-12 h-1 bg-[#0A1628] rounded-full overflow-hidden mt-0.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${sig.match}%` }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                      className="h-full rounded-full bg-emerald-400"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-1.5">Status</div>
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold ${st.bg} ${st.text}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
            {st.label}
          </div>
        </div>

        {capture.linkedIncident && (
          <button className="w-full flex items-center gap-2 p-2.5 bg-[#112040] rounded-xl border border-[rgba(46,127,255,0.2)] hover:border-[rgba(46,127,255,0.4)] transition-colors">
            <AlertTriangle size={12} className="text-[#2E7FFF]" />
            <div className="flex-1 text-left">
              <div className="text-[9px] text-[#7A94B4]">Linked Incident</div>
              <div className="text-[11px] text-blue-400 font-semibold">{capture.linkedIncident}</div>
            </div>
            <ChevronRight size={11} className="text-[#7A94B4]" />
          </button>
        )}

        {capture.status === 'pending' && (
          <div className="flex gap-2">
            <button
              onClick={() => onAction(capture.id, 'confirmed')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold hover:bg-emerald-500/20 transition-colors"
            >
              <CheckCircle size={13} /> Confirm
            </button>
            <button
              onClick={() => onAction(capture.id, 'rejected')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] font-semibold hover:bg-red-500/20 transition-colors"
            >
              <X size={13} /> Reject
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface Props { onToast: ToastFn }

export function AICapture({ onToast }: Props) {
  const [statusFilter,   setStatusFilter]   = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selected,       setSelected]       = useState<Capture | null>(null);
  const [statuses, setStatuses] = useState<Record<string, CaptureStatus>>(
    () => Object.fromEntries(mockAICaptures.map(c => [c.id, c.status as CaptureStatus]))
  );

  const enriched: Capture[] = mockAICaptures.map(c => ({ ...c, status: statuses[c.id] }));

  const filtered = enriched.filter(c => {
    if (statusFilter   !== 'All' && c.status   !== statusFilter)   return false;
    if (categoryFilter !== 'All' && c.category !== categoryFilter) return false;
    return true;
  });

  const kpi = {
    total:     enriched.length,
    pending:   enriched.filter(c => c.status === 'pending').length,
    confirmed: enriched.filter(c => c.status === 'confirmed').length,
    rejected:  enriched.filter(c => c.status === 'rejected').length,
    avgConf:   Math.round(enriched.reduce((s, c) => s + c.confidence, 0) / enriched.length),
  };

  const handleAction = (id: string, action: CaptureStatus) => {
    setStatuses(prev => ({ ...prev, [id]: action }));
    const cap = enriched.find(c => c.id === id);
    if (action === 'confirmed') onToast(`Detection confirmed — linked to incident`, 'success');
    if (action === 'rejected')  onToast(`Detection rejected — marked false positive`, 'info');
    if (selected?.id === id && action === 'rejected') setSelected(null);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(46,127,255,0.15)] flex-shrink-0">
        <div>
          <h2 className="text-[#EEF3FA] font-bold text-base" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>AI Capture</h2>
          <p className="text-[11px] text-[#7A94B4]">AI-detected incidents requiring review · 4C360 Vision Engine</p>
        </div>
        <div className="flex items-center gap-2">
          {[
            { label: 'Pending',   value: kpi.pending,   color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
            { label: 'Confirmed', value: kpi.confirmed, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
            { label: 'Rejected',  value: kpi.rejected,  color: 'text-[#7A94B4] bg-white/5 border-white/10' },
            { label: 'Avg Conf',  value: `${kpi.avgConf}%`, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
          ].map(k => (
            <div key={k.label} className={`text-center px-2.5 py-1 rounded-lg border ${k.color}`}>
              <div className="text-[13px] font-bold">{k.value}</div>
              <div className="text-[8px] uppercase tracking-wide opacity-80">{k.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 px-5 py-2.5 border-b border-[rgba(46,127,255,0.1)] flex-shrink-0 flex-wrap gap-y-2">
        <div className="flex gap-1 flex-wrap">
          {ALL_STATUSES.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`text-[10px] px-2.5 py-1 rounded-lg border capitalize transition-all ${statusFilter === s ? 'bg-[rgba(46,127,255,0.2)] border-[#2E7FFF] text-[#EEF3FA]' : 'border-[rgba(46,127,255,0.15)] text-[#7A94B4] hover:text-[#EEF3FA]'}`}>
              {s === 'All' ? `All (${kpi.total})` : s === 'pending' ? `Pending (${kpi.pending})` : s === 'confirmed' ? `Confirmed (${kpi.confirmed})` : `Rejected (${kpi.rejected})`}
            </button>
          ))}
        </div>
        <div className="h-4 w-px bg-[rgba(46,127,255,0.2)]" />
        <div className="flex gap-1 flex-wrap">
          {ALL_CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategoryFilter(c)}
              className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all ${categoryFilter === c ? 'bg-[rgba(46,127,255,0.2)] border-[#2E7FFF] text-[#EEF3FA]' : 'border-[rgba(46,127,255,0.15)] text-[#7A94B4] hover:text-[#EEF3FA]'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <Camera size={28} className="text-[#7A94B4] opacity-30" />
              <span className="text-[12px] text-[#7A94B4] opacity-60">No captures match filters</span>
            </div>
          ) : (
            <div className={`grid gap-3 ${selected ? 'grid-cols-2' : 'grid-cols-3'}`}>
              <AnimatePresence>
                {filtered.map(capture => (
                  <CaptureCard
                    key={capture.id}
                    capture={capture}
                    onAction={handleAction}
                    onSelect={() => setSelected(selected?.id === capture.id ? null : capture)}
                    isSelected={selected?.id === capture.id}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        <AnimatePresence>
          {selected && (() => {
            const enrichedSelected = enriched.find(c => c.id === selected.id);
            if (!enrichedSelected) return null;
            return (
              <DetailPanel
                key={selected.id}
                capture={enrichedSelected}
                onClose={() => setSelected(null)}
                onAction={handleAction}
              />
            );
          })()}
        </AnimatePresence>
      </div>
    </div>
  );
}
