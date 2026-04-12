import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Brain, CheckCircle2, XCircle, AlertCircle, Clock, User,
  TrendingUp, TrendingDown, Minus, Calendar, Wrench, AlertTriangle,
} from 'lucide-react';
import { mockPPMHistory, type PPMAssetHistory, type PPMHistoryRecord } from '@/data/mockData';

interface Asset {
  id: string;
  name: string;
  type: string;
  location: string;
  condition: number;
}

interface PPMHistoryDrawerProps {
  asset: Asset | null;
  open: boolean;
  onClose: () => void;
}

const RESULT_CONFIG = {
  pass:    { label: 'Pass',    Icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  fail:    { label: 'Fail',    Icon: XCircle,      color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/30' },
  partial: { label: 'Partial', Icon: AlertCircle,  color: 'text-amber-400',   bg: 'bg-amber-500/10',  border: 'border-amber-500/30' },
};

function ConditionTrendChart({ records }: { records: PPMHistoryRecord[] }) {
  const sorted = [...records].reverse();
  const scores = sorted.map(r => r.conditionScore);
  const min = Math.max(0, Math.min(...scores) - 10);
  const max = Math.min(100, Math.max(...scores) + 5);
  const range = max - min || 1;
  const W = 100;
  const H = 48;
  const pts = scores.map((s, i) => {
    const x = scores.length === 1 ? W / 2 : (i / (scores.length - 1)) * W;
    const y = H - ((s - min) / range) * H;
    return `${x},${y}`;
  });
  const polyline = pts.join(' ');
  const areaPath = `M${pts[0]} L${pts.join(' L')} L${scores.length === 1 ? W / 2 : W},${H} L0,${H} Z`;
  const last = scores[scores.length - 1];
  const first = scores[0];
  const trend = last - first;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-[#7A94B4] uppercase tracking-wide">Condition Trend</span>
        <div className="flex items-center gap-1">
          {trend > 0 ? (
            <><TrendingUp size={12} className="text-emerald-400" /><span className="text-[10px] text-emerald-400 font-semibold">+{trend}% improving</span></>
          ) : trend < 0 ? (
            <><TrendingDown size={12} className="text-red-400" /><span className="text-[10px] text-red-400 font-semibold">{trend}% declining</span></>
          ) : (
            <><Minus size={12} className="text-[#7A94B4]" /><span className="text-[10px] text-[#7A94B4] font-semibold">stable</span></>
          )}
        </div>
      </div>
      <div className="relative bg-[#0A1628] rounded-xl p-3 border border-[rgba(46,127,255,0.12)]">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 56 }} preserveAspectRatio="none">
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2E7FFF" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#2E7FFF" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#areaGrad)" />
          <polyline points={polyline} fill="none" stroke="#2E7FFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          {scores.map((s, i) => {
            const x = scores.length === 1 ? W / 2 : (i / (scores.length - 1)) * W;
            const y = H - ((s - min) / range) * H;
            const cfg = sorted[i].result === 'pass' ? '#38D98A' : sorted[i].result === 'fail' ? '#F87171' : '#FBBF24';
            return <circle key={i} cx={x} cy={y} r="2.5" fill={cfg} stroke="#07111F" strokeWidth="1" />;
          })}
        </svg>
        <div className="flex justify-between mt-1">
          {sorted.map((r, i) => (
            <span key={i} className="text-[8px] text-[#4A6080] truncate" style={{ maxWidth: `${100 / sorted.length - 1}%` }}>
              {r.date.split(' ').slice(0, 2).join(' ')}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ResultBadge({ result }: { result: PPMHistoryRecord['result'] }) {
  const cfg = RESULT_CONFIG[result];
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-lg border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      <cfg.Icon size={9} />
      {cfg.label}
    </span>
  );
}

function ServiceRecord({ record }: { record: PPMHistoryRecord }) {
  return (
    <div className="p-3 bg-[#0A1628] rounded-xl border border-[rgba(46,127,255,0.12)] space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <ResultBadge result={record.result} />
          <div className="flex items-center gap-1 text-[10px] text-[#7A94B4]">
            <Calendar size={9} />
            {record.date}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-[#7A94B4]">
            <User size={9} />
            {record.technician}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1 text-[10px] text-[#7A94B4]">
            <Clock size={9} />
            {record.durationMinutes}m
          </div>
          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md ${
            record.onTime
              ? 'text-emerald-400 bg-emerald-500/10'
              : 'text-red-400 bg-red-500/10'
          }`}>
            {record.onTime ? 'On Time' : 'Late'}
          </span>
          <span className="text-[11px] font-bold" style={{ color: record.conditionScore >= 80 ? '#38D98A' : record.conditionScore >= 60 ? '#FBBF24' : '#F87171' }}>
            {record.conditionScore}%
          </span>
        </div>
      </div>
      <p className="text-[11px] text-[#9DB4CC] leading-relaxed">{record.findings}</p>
      {record.partsUsed && record.partsUsed.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Wrench size={9} className="text-[#7A94B4]" />
          {record.partsUsed.map((p, i) => (
            <span key={i} className="text-[9px] bg-white/4 border border-white/8 rounded-full px-2 py-0.5 text-[#7A94B4]">{p}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-[#0A1628] rounded-xl p-3 border border-[rgba(46,127,255,0.12)]">
      <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-0.5">{label}</div>
      <div className="text-[18px] font-bold leading-tight" style={{ color: color ?? '#EEF3FA' }}>{value}</div>
      {sub && <div className="text-[9px] text-[#4A6080] mt-0.5">{sub}</div>}
    </div>
  );
}

export function PPMHistoryDrawer({ asset, open, onClose }: PPMHistoryDrawerProps) {
  const history: PPMAssetHistory | undefined = asset
    ? mockPPMHistory.find(h => h.assetId === asset.id)
    : undefined;

  return (
    <AnimatePresence>
      {open && asset && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px]"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 38 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-[480px] flex flex-col bg-[#07111F] border-l border-[rgba(46,127,255,0.18)] shadow-[0_-4px_40px_rgba(0,0,0,0.6)] overflow-hidden"
          >
            <div
              className="flex items-center gap-3 px-5 py-4 flex-shrink-0 border-b border-[rgba(46,127,255,0.12)]"
              style={{ background: 'linear-gradient(160deg, #0D1E38 0%, #091628 100%)' }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Clock size={14} className="text-[#2E7FFF] flex-shrink-0" />
                  <span className="text-[#EEF3FA] font-bold text-[15px] truncate">{asset.name}</span>
                </div>
                <p className="text-[11px] text-[#7A94B4]">{asset.type} · {asset.location} · Maintenance History</p>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[#7A94B4] hover:text-[#EEF3FA] hover:bg-white/8 transition-all flex-shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {!history ? (
              <div className="flex-1 flex items-center justify-center text-[#7A94B4] text-sm">
                No history available for this asset.
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5">
                <div className="p-4 rounded-2xl border border-[rgba(46,127,255,0.25)] bg-[rgba(46,127,255,0.07)]">
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-7 h-7 rounded-xl bg-[rgba(46,127,255,0.15)] border border-[rgba(46,127,255,0.3)] flex items-center justify-center">
                      <Brain size={14} className="text-[#2E7FFF]" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-[#2E7FFF] uppercase tracking-wide">AI Insight</div>
                      <div className="text-[9px] text-[#4A6080]">Generated from maintenance history</div>
                    </div>
                  </div>
                  <p className="text-[12px] text-[#C8D8EC] leading-relaxed">{history.aiInsight}</p>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <StatCard
                    label="Compliance"
                    value={`${history.complianceRate}%`}
                    sub="PPMs done on time"
                    color={history.complianceRate >= 85 ? '#38D98A' : history.complianceRate >= 65 ? '#FBBF24' : '#F87171'}
                  />
                  <StatCard
                    label="Avg Interval"
                    value={`${history.avgDaysBetweenService}d`}
                    sub="between services"
                  />
                  <StatCard
                    label="Failures"
                    value={history.failureFrequency}
                    sub="in service history"
                    color={history.failureFrequency === 0 ? '#38D98A' : history.failureFrequency <= 1 ? '#FBBF24' : '#F87171'}
                  />
                </div>

                <ConditionTrendChart records={history.records} />

                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <AlertTriangle size={12} className="text-amber-400" />
                    <span className="text-[10px] text-[#7A94B4] uppercase tracking-wide font-semibold">Patterns & Recurring Findings</span>
                  </div>
                  <div className="space-y-2">
                    {history.recurringFindings.map((rf, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5 bg-[#0A1628] rounded-xl border border-[rgba(46,127,255,0.10)]">
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] text-[#EEF3FA] font-medium truncate">{rf.finding}</div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[10px] text-[#7A94B4]">{rf.occurrences}/{rf.total} services</span>
                          <div className="w-16 h-1.5 bg-white/8 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${(rf.occurrences / rf.total) * 100}%`,
                                background: rf.occurrences === rf.total ? '#F87171' : rf.occurrences >= rf.total * 0.6 ? '#FBBF24' : '#2E7FFF',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] text-[#7A94B4] uppercase tracking-wide font-semibold">
                      Service Log · {history.records.length} records
                    </span>
                    <div className="flex items-center gap-3">
                      {(['pass', 'fail', 'partial'] as const).map(r => {
                        const count = history.records.filter(rec => rec.result === r).length;
                        if (count === 0) return null;
                        const cfg = RESULT_CONFIG[r];
                        return (
                          <span key={r} className={`text-[9px] font-bold ${cfg.color}`}>
                            {count} {cfg.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {history.records.map(record => (
                      <ServiceRecord key={record.id} record={record} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
