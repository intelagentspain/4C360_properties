import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSelectedProjectCommandData } from '../useProjectCommandData';
import { AIInsightBadge } from './AIInsightBadge';
import { AIInsightPanel } from './AIInsightPanel';
import type { MetricName } from '../useMetricInsight';

export function EVMCards({ compact = false }: { compact?: boolean }) {
  const { evmSummary } = useSelectedProjectCommandData();
  const [selectedInsight, setSelectedInsight] = useState<{ metricName: MetricName; value: string } | null>(null);
  const cards: Array<{ label: MetricName; value: number; color: string }> = [
    { label: 'PV / BCWS', value: evmSummary.pv, color: '#C8A020' },
    { label: 'AC / ACWP', value: evmSummary.ac, color: '#00B894' },
    { label: 'EV / BCWP', value: evmSummary.ev, color: '#7C3AED' },
    { label: 'Cost Variance', value: evmSummary.cv, color: evmSummary.cv < 0 ? '#D92B1C' : '#00B894' },
  ];

  return (
    <>
      <div className={`grid gap-2 ${compact ? 'grid-cols-2 xl:grid-cols-4' : 'grid-cols-2 xl:grid-cols-4'}`}>
        {cards.map(card => {
          const valueLabel = `${card.value < 0 ? '-' : ''}AED ${Math.abs(card.value)}M`;

          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-3 pr-14"
            >
              <AIInsightBadge onClick={() => setSelectedInsight({ metricName: card.label, value: valueLabel })} />
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7A94B4]">{card.label}</div>
              <div className="mt-2 text-[20px] font-black text-[#EEF3FA]" style={{ color: card.color, fontFamily: 'Space Grotesk, sans-serif' }}>
                {valueLabel}
              </div>
            </motion.div>
          );
        })}
      </div>
      <AnimatePresence>
        {selectedInsight && (
          <AIInsightPanel
            metricName={selectedInsight.metricName}
            value={selectedInsight.value}
            onClose={() => setSelectedInsight(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
