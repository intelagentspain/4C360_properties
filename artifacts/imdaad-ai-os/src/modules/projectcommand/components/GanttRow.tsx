import { motion } from 'framer-motion';
import type { Phase, SubTask } from '../data/phases';

type RowItem = Phase | SubTask;
type RenderRowItem = RowItem & {
  baselineStartPct?: number;
  baselineWidthPct?: number;
};

export function GanttRow({
  item,
  nameWidth = 160,
  showBaseline = false,
  showCriticalPath = true,
  dense = false,
  onNameClick,
  onBarClick,
  nameActionLabel,
  barActionLabel,
  isExpanded = false,
  canExpand = false,
  expandPulse = false,
}: {
  item: RenderRowItem;
  nameWidth?: number;
  showBaseline?: boolean;
  showCriticalPath?: boolean;
  dense?: boolean;
  onNameClick?: () => void;
  onBarClick?: () => void;
  nameActionLabel?: string;
  barActionLabel?: string;
  isExpanded?: boolean;
  canExpand?: boolean;
  expandPulse?: boolean;
}) {
  const rowHeight = dense ? 26 : 32;
  const isPhase = 'color' in item;
  const color = isPhase ? item.color : item.isCritical ? '#D92B1C' : '#7C3AED';

  return (
    <div
      className="grid w-full items-center gap-3 rounded-lg transition-colors hover:bg-white/[0.03]"
      style={{ gridTemplateColumns: `${nameWidth}px 1fr`, height: rowHeight }}
    >
      <button
        type="button"
        onClick={event => {
          event.stopPropagation();
          onNameClick?.();
        }}
        disabled={!onNameClick}
        className={`flex h-full min-w-0 items-center rounded-md pl-2 pr-2 text-left text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7FFF]/55 ${
          onNameClick ? 'cursor-pointer hover:bg-white/[0.05]' : 'cursor-default'
        } ${isPhase ? 'text-[#EEF3FA]' : 'text-[#B8C7DB]'}`}
        aria-label={nameActionLabel ?? (canExpand ? `${isExpanded ? 'Collapse' : 'Expand'} ${item.name}` : item.name)}
      >
        {item.isCritical && showCriticalPath && <span className="mr-1 inline-block h-3 w-0.5 rounded bg-[#D92B1C] align-middle" />}
        {canExpand && (
          <motion.span
            animate={expandPulse ? { scale: [1, 1.35, 1], boxShadow: ['0 0 0 rgba(34,211,238,0)', '0 0 18px rgba(34,211,238,0.8)', '0 0 0 rgba(34,211,238,0)'] } : { scale: 1, boxShadow: '0 0 0 rgba(34,211,238,0)' }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className={`mr-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${
              expandPulse
                ? 'border-cyan-200 bg-cyan-300/18 text-cyan-50'
                : 'border-white/10 bg-white/[0.04] text-[#8FB4E4]'
            }`}
          >
            {isExpanded ? '-' : '+'}
          </motion.span>
        )}
        <span className="truncate">{item.name}</span>
      </button>
      <button
        type="button"
        onClick={event => {
          event.stopPropagation();
          onBarClick?.();
        }}
        disabled={!onBarClick}
        className={`relative h-4 rounded-full bg-[#243448]/70 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7FFF]/55 ${
          onBarClick ? 'cursor-pointer transition-transform hover:scale-y-125' : 'cursor-default'
        }`}
        aria-label={barActionLabel ?? `Open programme insight for ${item.name}`}
      >
        {showBaseline && (
          <div
            className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-white/12"
            style={{
              left: `${Math.max(item.baselineStartPct ?? item.startPct - 2, 0)}%`,
              width: `${Math.min(item.baselineWidthPct ?? item.widthPct + 5, 100)}%`,
            }}
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
      </button>
    </div>
  );
}
