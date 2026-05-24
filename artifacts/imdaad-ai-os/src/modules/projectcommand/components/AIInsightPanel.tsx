import { motion } from 'framer-motion';
import { Activity, ArrowRight, BrainCircuit, ListChecks, Sparkles, X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { useMetricInsight, type MetricName } from '../useMetricInsight';

const severityClass: Record<string, string> = {
  positive: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  monitor: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
  critical: 'border-red-400/70 bg-red-500/20 text-red-50 shadow-[0_0_18px_rgba(239,68,68,0.24)]',
};

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof BrainCircuit;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#07111F]/80 p-4">
      <div className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#C4B5FD]">
        <Icon size={14} />
        {title}
      </div>
      {children}
    </div>
  );
}

export function AIInsightPanel({
  metricName,
  value,
  onClose,
  demoScrollProgress,
}: {
  metricName: MetricName;
  value: string | number;
  onClose: () => void;
  demoScrollProgress?: number;
}) {
  const insight = useMetricInsight(metricName, value);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const severityLabel = insight.severity === 'positive'
    ? 'Healthy signal'
    : insight.severity === 'monitor'
    ? 'Monitor closely'
    : 'Needs attention';
  const shouldPulseAttention = insight.severity === 'critical';

  useEffect(() => {
    if (typeof demoScrollProgress !== 'number') return undefined;

    const frame = window.requestAnimationFrame(() => {
      const body = bodyRef.current;
      if (!body) return;
      const progress = Math.max(0, Math.min(1, demoScrollProgress));
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      body.scrollTop = Math.max(0, body.scrollHeight - body.clientHeight) * eased;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [demoScrollProgress]);

  return (
    <motion.aside
      initial={{ x: 460, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 460, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 32 }}
      data-demo-anchor="ai-insight-panel"
      className="fixed bottom-0 right-0 top-[52px] z-[2400] flex w-full max-w-[430px] flex-col border-l border-violet-400/25 bg-[linear-gradient(180deg,rgba(10,22,40,0.96),rgba(7,17,31,0.98))] shadow-2xl shadow-black/40 backdrop-blur-xl"
    >
      <div className="border-b border-[rgba(46,127,255,0.16)] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-violet-300/25 bg-violet-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-violet-100">
              <Sparkles size={12} />
              AI Insight
            </div>
            <h2 className="text-xl font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              AI Insight - {insight.metricName}
            </h2>
            <p className="mt-1 text-[12px] text-[#7A94B4]">Current value: <span className="font-mono font-bold text-[#DDE6F8]">{insight.valueLabel}</span></p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-[#7A94B4] transition-colors hover:bg-white/5 hover:text-white" aria-label="Close AI insight">
            <X size={18} />
          </button>
        </div>
        <motion.div
          animate={shouldPulseAttention
            ? {
                opacity: [0.72, 1, 0.72],
                scale: [1, 1.045, 1],
                backgroundColor: ['rgba(127,29,29,0.28)', 'rgba(239,68,68,0.62)', 'rgba(127,29,29,0.28)'],
                borderColor: ['rgba(248,113,113,0.42)', 'rgba(248,113,113,1)', 'rgba(248,113,113,0.42)'],
                boxShadow: ['0 0 0 rgba(239,68,68,0)', '0 0 28px rgba(239,68,68,0.48)', '0 0 0 rgba(239,68,68,0)'],
                color: ['#fecaca', '#ffffff', '#fecaca'],
              }
            : undefined}
          transition={shouldPulseAttention ? { duration: 0.78, repeat: Infinity, ease: 'easeInOut' } : undefined}
          className={`mt-4 inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wide ${severityClass[insight.severity]}`}
        >
          {severityLabel}
        </motion.div>
      </div>

      <div ref={bodyRef} className="custom-scrollbar flex-1 space-y-3 overflow-y-auto p-5">
        <Section icon={BrainCircuit} title="Summary">
          <p className="text-[13px] leading-6 text-[#DDE6F8]">{insight.summary}</p>
        </Section>

        <Section icon={ListChecks} title="Rationale">
          <ul className="space-y-2">
            {insight.rationale.map(item => (
              <li key={item} className="flex gap-2 text-[12px] leading-5 text-[#B8C7DB]">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7C3AED]" />
                {item}
              </li>
            ))}
          </ul>
        </Section>

        <Section icon={Activity} title="Interpretation">
          <p className="text-[13px] leading-6 text-[#DDE6F8]">{insight.interpretation}</p>
        </Section>

        <Section icon={Sparkles} title="Recommendation">
          <p className="text-[13px] leading-6 text-[#DDE6F8]">{insight.recommendation}</p>
        </Section>
      </div>

      <div className="border-t border-[rgba(46,127,255,0.16)] p-4">
        <div className="grid grid-cols-2 gap-2">
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-violet-400/30 bg-violet-400/10 px-3 text-[11px] font-bold text-violet-100 transition-colors hover:bg-violet-400/16">
            View deeper analysis
            <ArrowRight size={13} />
          </button>
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[rgba(46,127,255,0.2)] bg-[#0A1628] px-3 text-[11px] font-bold text-[#B8C7DB] transition-colors hover:bg-white/5">
            Simulate impact
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
