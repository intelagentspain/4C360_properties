import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, TrendingUp, AlertTriangle, Clock, CheckCircle, X, Eye, UserCheck } from 'lucide-react';
import { type ToastFn } from '@/lib/ui';
import { AnimatedBar } from '@/components/shared/AnimatedBar';

interface Insight {
  id: string;
  category: 'risk' | 'efficiency' | 'prediction' | 'anomaly';
  title: string;
  body: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
}

const insights: Insight[] = [
  {
    id: 'i1',
    category: 'risk',
    title: 'SLA breach likely in 14 min',
    body: 'Job #SI-298 (Omar T.) has not moved status in 38 min. Historical data suggests 84% breach probability at current pace.',
    confidence: 84,
    impact: 'high',
  },
  {
    id: 'i2',
    category: 'efficiency',
    title: 'Cluster A over-staffed by 2',
    body: 'Sara M. and Faisal N. are both idle within 0.5km of Cluster A. Recommend redeploying one to Cluster C which has 1 open incident.',
    confidence: 91,
    impact: 'medium',
  },
  {
    id: 'i3',
    category: 'prediction',
    title: 'Chiller failure likely this week',
    body: 'Chiller Unit C-04 shows 34% blockage and refrigerant at 72% capacity. Based on seasonal load patterns, failure within 4–6 days without PPM.',
    confidence: 77,
    impact: 'high',
  },
  {
    id: 'i4',
    category: 'anomaly',
    title: 'Unusually high AC calls — Villa cluster A',
    body: '7 AC-related calls from Cluster A in 48 hours vs. 1.2 average. Possible shared infrastructure fault — recommend building inspection.',
    confidence: 68,
    impact: 'medium',
  },
];

const CATEGORY_CONFIG: Record<Insight['category'], { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  risk:       { icon: <AlertTriangle size={11} />, color: 'text-red-400',    bg: 'bg-red-500/20',    label: 'Risk' },
  efficiency: { icon: <TrendingUp size={11} />,   color: 'text-cyan-400',   bg: 'bg-cyan-500/20',   label: 'Efficiency' },
  prediction: { icon: <Clock size={11} />,        color: 'text-amber-400',  bg: 'bg-amber-500/20',  label: 'Prediction' },
  anomaly:    { icon: <Brain size={11} />,        color: 'text-purple-400', bg: 'bg-purple-500/20', label: 'Anomaly' },
};

const IMPACT_COLOR: Record<Insight['impact'], string> = {
  high:   'text-red-400',
  medium: 'text-amber-400',
  low:    'text-emerald-400',
};

const CONFIDENCE_COLOR = (c: number) => c >= 80 ? '#38D98A' : c >= 60 ? '#FF9B38' : '#FF4B4B';

interface Props {
  onToast: ToastFn;
}

export function AIInsightsPanel({ onToast }: Props) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string | null>('i1');

  const visible = insights.filter(i => !dismissed.includes(i.id));

  const dismiss = (id: string) => setDismissed(d => [...d, id]);
  const toggle  = (id: string) => setExpanded(prev => prev === id ? null : id);

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-[#EEF3FA] text-xs font-semibold uppercase tracking-wide" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            AI Insights
          </h3>
          <span className="px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-bold border border-purple-500/30">
            {visible.length}
          </span>
        </div>
        <span className="flex items-center gap-1 text-[10px] text-[#7A94B4]">
          <Brain size={10} className="text-purple-400" /> 4C360 Engine
        </span>
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {visible.map(insight => {
            const cat = CATEGORY_CONFIG[insight.category];
            const isOpen = expanded === insight.id;

            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.2 }}
                className="rounded-lg border border-[rgba(46,127,255,0.22)] bg-[rgba(17,32,64,0.85)] overflow-hidden backdrop-blur-xl"
              >
                <div className="flex items-start gap-2.5 p-3 hover:bg-white/[0.02] transition-colors">
                  <button
                    onClick={() => toggle(insight.id)}
                    className="flex items-start gap-2.5 flex-1 min-w-0 text-left"
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${cat.bg} ${cat.color}`}>
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] text-[#EEF3FA] font-medium leading-snug mb-0.5">{insight.title}</div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold ${cat.color}`}>{cat.label}</span>
                        <span className="text-[10px] text-[#7A94B4]">·</span>
                        <span className={`text-[10px] font-semibold ${IMPACT_COLOR[insight.impact]}`}>{insight.impact} impact</span>
                        <span className="text-[10px] text-[#7A94B4]">·</span>
                        <span className="text-[10px] text-[#7A94B4]">{insight.confidence}% confidence</span>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => dismiss(insight.id)}
                    className="flex-shrink-0 text-[#7A94B4] hover:text-white transition-colors p-0.5"
                  >
                    <X size={12} />
                  </button>
                </div>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 pt-0 border-t border-[rgba(46,127,255,0.1)]">
                        <p className="text-[11px] text-[#7A94B4] leading-relaxed mt-2 mb-3">{insight.body}</p>

                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-[#7A94B4]">Confidence</span>
                            <span className="text-[10px] font-bold text-[#EEF3FA]">{insight.confidence}%</span>
                          </div>
                          <AnimatedBar value={insight.confidence} color={CONFIDENCE_COLOR(insight.confidence)} delay={0.1} />
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => onToast(`Viewing insight: ${insight.title}`, 'info')}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[#0A1628] text-[11px] text-[#7A94B4] hover:text-[#EEF3FA] border border-[rgba(46,127,255,0.2)] hover:border-[rgba(46,127,255,0.4)] transition-all"
                          >
                            <Eye size={11} /> View
                          </button>
                          <button
                            onClick={() => onToast(`Assigned action for: ${insight.title}`, 'success')}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[#2E7FFF] text-white text-[11px] font-semibold hover:bg-blue-500 transition-colors"
                          >
                            <UserCheck size={11} /> Assign
                          </button>
                          <button
                            onClick={() => dismiss(insight.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[#0A1628] text-[11px] text-[#7A94B4] hover:text-[#EEF3FA] border border-[rgba(46,127,255,0.2)] transition-all ml-auto"
                          >
                            <X size={11} /> Ignore
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {visible.length === 0 && (
          <div className="flex items-center gap-2 p-3 bg-[rgba(17,32,64,0.85)] border border-[rgba(46,127,255,0.22)] rounded-lg">
            <CheckCircle size={14} className="text-emerald-400" />
            <span className="text-[12px] text-[#7A94B4]">All insights acknowledged</span>
          </div>
        )}
      </div>
    </div>
  );
}
