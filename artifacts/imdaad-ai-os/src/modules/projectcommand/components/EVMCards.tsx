import { motion } from 'framer-motion';
import { evmSummary } from '../data/costs';

const cards = [
  { label: 'PV / BCWS', value: evmSummary.pv, color: '#C8A020' },
  { label: 'AC / ACWP', value: evmSummary.ac, color: '#00B894' },
  { label: 'EV / BCWP', value: evmSummary.ev, color: '#7C3AED' },
  { label: 'Cost Variance', value: evmSummary.cv, color: '#D92B1C' },
];

export function EVMCards({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`grid gap-2 ${compact ? 'grid-cols-2 xl:grid-cols-4' : 'grid-cols-2 xl:grid-cols-4'}`}>
      {cards.map(card => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-3"
        >
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7A94B4]">{card.label}</div>
          <div className="mt-2 text-[20px] font-black text-[#EEF3FA]" style={{ color: card.color, fontFamily: 'Space Grotesk, sans-serif' }}>
            {card.value < 0 ? '-' : ''}AED {Math.abs(card.value)}M
          </div>
        </motion.div>
      ))}
    </div>
  );
}
