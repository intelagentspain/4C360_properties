import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  AlertTriangle,
  TrendingUp,
  Clock,
  Brain,
  Eye,
  Activity,
  History,
  BarChart2,
  ListChecks,
} from 'lucide-react';

interface ConfidenceFactor {
  label: string;
  value: number;
  color: string;
}

interface InsightDetail {
  id: string;
  category: 'risk' | 'efficiency' | 'prediction' | 'anomaly';
  title: string;
  body: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  rationale: string;
  currentContext: string[];
  historicalContext: string[];
  confidenceFactors: ConfidenceFactor[];
  recommendedActions: string[];
}

interface Props {
  open: boolean;
  insight: InsightDetail | null;
  onClose: () => void;
}

const CATEGORY_CONFIG: Record<InsightDetail['category'], { icon: React.ReactNode; color: string; bg: string; label: string; border: string }> = {
  risk:       { icon: <AlertTriangle size={13} />, color: 'text-red-400',    bg: 'bg-red-500/20',    label: 'Risk',       border: 'border-red-500/30' },
  efficiency: { icon: <TrendingUp size={13} />,   color: 'text-cyan-400',   bg: 'bg-cyan-500/20',   label: 'Efficiency', border: 'border-cyan-500/30' },
  prediction: { icon: <Clock size={13} />,        color: 'text-amber-400',  bg: 'bg-amber-500/20',  label: 'Prediction', border: 'border-amber-500/30' },
  anomaly:    { icon: <Brain size={13} />,        color: 'text-purple-400', bg: 'bg-purple-500/20', label: 'Anomaly',    border: 'border-purple-500/30' },
};

const IMPACT_CONFIG: Record<InsightDetail['impact'], { color: string; bg: string; label: string }> = {
  high:   { color: 'text-red-400',     bg: 'bg-red-500/15',     label: 'High Impact' },
  medium: { color: 'text-amber-400',   bg: 'bg-amber-500/15',   label: 'Med Impact' },
  low:    { color: 'text-emerald-400', bg: 'bg-emerald-500/15', label: 'Low Impact' },
};

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-2.5">
      <span className="text-[#7A94B4]">{icon}</span>
      <span className="text-[10px] text-[#7A94B4] uppercase tracking-wider font-semibold">{label}</span>
    </div>
  );
}

export function InsightDetailModal({ open, insight, onClose }: Props) {
  if (!insight) return null;

  const cat = CATEGORY_CONFIG[insight.category];
  const imp = IMPACT_CONFIG[insight.impact];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.93, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.93, opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            className="bg-[#0D1E38] border border-[rgba(46,127,255,0.3)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(46,127,255,0.15)]">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cat.bg} ${cat.color} border ${cat.border}`}>
                  {cat.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-[#EEF3FA] text-sm font-semibold leading-snug truncate" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {insight.title}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${cat.bg} ${cat.color} border ${cat.border}`}>
                      {cat.label}
                    </span>
                    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${imp.bg} ${imp.color}`}>
                      {imp.label}
                    </span>
                    <span className="text-[10px] text-[#7A94B4]">{insight.confidence}% confidence</span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-[#7A94B4] hover:text-white transition-colors rounded-md p-1 hover:bg-white/5 flex-shrink-0 ml-2"
              >
                <X size={14} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-5 max-h-[72vh] overflow-y-auto custom-scrollbar">
              <div className="rounded-xl border border-[rgba(46,127,255,0.15)] bg-[rgba(17,32,64,0.7)] p-4">
                <SectionHeader icon={<Eye size={11} />} label="Rationale" />
                <p className="text-[11.5px] text-[#B8CCE0] leading-relaxed">{insight.rationale}</p>
              </div>

              <div className="rounded-xl border border-[rgba(46,127,255,0.15)] bg-[rgba(17,32,64,0.7)] p-4">
                <SectionHeader icon={<Activity size={11} />} label="Current Context" />
                <ul className="space-y-1.5">
                  {insight.currentContext.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-[#2E7FFF] flex-shrink-0 mt-1.5" />
                      <span className="text-[11px] text-[#B8CCE0] leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-[rgba(46,127,255,0.15)] bg-[rgba(17,32,64,0.7)] p-4">
                <SectionHeader icon={<History size={11} />} label="What History Says" />
                <ul className="space-y-1.5">
                  {insight.historicalContext.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-[#A78BFA] flex-shrink-0 mt-1.5" />
                      <span className="text-[11px] text-[#B8CCE0] leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-[rgba(46,127,255,0.15)] bg-[rgba(17,32,64,0.7)] p-4">
                <SectionHeader icon={<BarChart2 size={11} />} label="Confidence Breakdown" />
                <div className="space-y-2">
                  {insight.confidenceFactors.map((factor, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-[#7A94B4]">{factor.label}</span>
                        <span className="text-[10px] font-bold text-[#EEF3FA]">{factor.value}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${factor.value}%` }}
                          transition={{ duration: 0.6, delay: 0.1 + i * 0.08, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{ background: factor.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-[rgba(46,127,255,0.15)] bg-[rgba(17,32,64,0.7)] p-4">
                <SectionHeader icon={<ListChecks size={11} />} label="Recommended Actions" />
                <div className="space-y-2">
                  {insight.recommendedActions.map((action, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-[#2E7FFF]/20 border border-[#2E7FFF]/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[8px] font-bold text-[#2E7FFF]">{i + 1}</span>
                      </div>
                      <p className="text-[11px] text-[#B8CCE0] leading-relaxed">{action}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-[rgba(46,127,255,0.1)]">
              <button
                onClick={onClose}
                className="w-full py-2.5 border border-[rgba(46,127,255,0.25)] text-[#7A94B4] text-xs rounded-xl hover:bg-white/5 hover:text-[#EEF3FA] transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export type { InsightDetail };
