import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Phase } from '../data/phases';
import { GanttRow } from './GanttRow';
import { AIAnnotation } from './AIAnnotation';
import { WeatherOverlay } from './WeatherOverlay';

export function GanttChart({
  phases,
  mode = 'compact',
  showBaseline = false,
  showCriticalPath = true,
  showWeather = false,
}: {
  phases: Phase[];
  mode?: 'compact' | 'full';
  showBaseline?: boolean;
  showCriticalPath?: boolean;
  showWeather?: boolean;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const nameWidth = mode === 'full' ? 176 : 140;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];

  return (
    <div className="relative rounded-xl border border-[#1C3050] bg-[#09152A]/80 p-3">
      <div className="relative mb-2 grid gap-3" style={{ gridTemplateColumns: `${nameWidth}px 1fr` }}>
        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5A6E88]">Phase</div>
        <div className="grid text-center text-[9px] text-[#5A6E88]" style={{ gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}>
          {months.map((month, index) => <span key={`${month}-${index}`}>{month}</span>)}
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-3 top-10 border-l border-dashed border-[#C8A020]" style={{ left: `calc(${nameWidth}px + 3rem + 43%)` }}>
        <span className="absolute -top-4 -translate-x-1/2 rounded bg-[#C8A020]/15 px-1.5 py-0.5 text-[9px] font-bold text-[#F4D66B]">Today</span>
      </div>
      {mode === 'full' && showCriticalPath && (
        <svg className="pointer-events-none absolute inset-x-3 top-14 h-52" viewBox="0 0 100 220" preserveAspectRatio="none">
          <path d="M54 52 C58 66 58 74 64 86 S74 112 76 132 S82 170 93 190" fill="none" stroke="#D92B1C" strokeDasharray="3 3" strokeWidth="0.7" opacity="0.8" />
        </svg>
      )}
      <div className="relative space-y-1">
        {phases.map((phase, index) => (
          <div key={phase.id} className="relative">
            {phase.aiAnnotation && (
              <AIAnnotation text={phase.aiAnnotation} x={phase.startPct + phase.widthPct * 0.45} y={index * (mode === 'full' ? 36 : 33) - 6} variant={phase.isCritical ? 'warning' : 'success'} />
            )}
            <GanttRow
              item={phase}
              nameWidth={nameWidth}
              showBaseline={showBaseline}
              showCriticalPath={showCriticalPath}
              dense={mode === 'compact'}
              onClick={() => setExpanded(current => ({ ...current, [phase.id]: !current[phase.id] }))}
            />
            <AnimatePresence initial={false}>
              {mode === 'full' && expanded[phase.id] && phase.subTasks && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  {phase.subTasks.map(task => (
                    <GanttRow key={task.id} item={task} nameWidth={nameWidth} showBaseline={showBaseline} showCriticalPath={showCriticalPath} dense />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
      {showWeather && <WeatherOverlay />}
    </div>
  );
}
