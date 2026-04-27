import { motion } from 'framer-motion';
import type { Phase, SubTask } from '../data/phases';

type RowItem = Phase | SubTask;

export function GanttRow({
  item,
  nameWidth = 160,
  showBaseline = false,
  showCriticalPath = true,
  dense = false,
  onClick,
}: {
  item: RowItem;
  nameWidth?: number;
  showBaseline?: boolean;
  showCriticalPath?: boolean;
  dense?: boolean;
  onClick?: () => void;
}) {
  const rowHeight = dense ? 26 : 32;
  const isPhase = 'color' in item;
  const color = isPhase ? item.color : item.isCritical ? '#D92B1C' : '#7C3AED';

  return (
    <button
      type="button"
      onClick={onClick}
      className="grid w-full items-center gap-3 text-left transition-colors hover:bg-white/[0.025]"
      style={{ gridTemplateColumns: `${nameWidth}px 1fr`, height: rowHeight }}
    >
      <div className={`truncate pl-2 text-[11px] font-semibold ${isPhase ? 'text-[#EEF3FA]' : 'text-[#B8C7DB]'}`}>
        {item.isCritical && showCriticalPath && <span className="mr-1 inline-block h-3 w-0.5 rounded bg-[#D92B1C] align-middle" />}
        {item.name}
      </div>
      <div className="relative h-4 rounded-full bg-[#243448]/70">
        {showBaseline && (
          <div
            className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-white/12"
            style={{ left: `${Math.max(item.startPct - 2, 0)}%`, width: `${Math.min(item.widthPct + 5, 100)}%` }}
          />
        )}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${item.widthPct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="absolute h-4 overflow-hidden rounded-full"
          style={{
            left: `${item.startPct}%`,
            background: item.isCritical && showCriticalPath ? `linear-gradient(90deg, #D92B1C, ${color})` : color,
            boxShadow: item.isCritical && showCriticalPath ? '0 0 16px rgba(217,43,28,0.22)' : undefined,
          }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${item.completePct}%` }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="h-full bg-white/30"
          />
        </motion.div>
      </div>
    </button>
  );
}
