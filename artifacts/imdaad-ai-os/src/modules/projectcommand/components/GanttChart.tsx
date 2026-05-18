import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Phase, SubTask } from '../data/phases';
import { GanttRow } from './GanttRow';
import { AIAnnotation } from './AIAnnotation';
import { WeatherOverlay } from './WeatherOverlay';

export type ProgrammeZoom = 'Week' | 'Month' | 'Quarter';
type ScheduleItem = Phase | SubTask;
type RenderItem<T extends ScheduleItem> = T & { baselineStartPct: number; baselineWidthPct: number };

function parseDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date('2026-01-01T00:00:00Z') : parsed;
}

function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(value: Date, months: number) {
  const next = new Date(value);
  next.setMonth(next.getMonth() + months);
  return next;
}

function clamp(value: number) {
  return Math.min(100, Math.max(0, value));
}

function rangePct(date: string, rangeStart: Date, rangeMs: number) {
  return clamp(((parseDate(date).getTime() - rangeStart.getTime()) / rangeMs) * 100);
}

function formatTick(value: Date, zoom: ProgrammeZoom) {
  if (zoom === 'Week') {
    const week = Math.ceil(value.getDate() / 7);
    return `${value.toLocaleDateString('en-GB', { month: 'short' })} W${week}`;
  }
  if (zoom === 'Quarter') {
    return `Q${Math.floor(value.getMonth() / 3) + 1} ${String(value.getFullYear()).slice(2)}`;
  }
  return value.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
}

function buildTicks(start: Date, end: Date, zoom: ProgrammeZoom) {
  const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000));
  const targetCount = zoom === 'Week' ? 12 : zoom === 'Quarter' ? 8 : 12;
  const ticks: Date[] = [];

  if (zoom === 'Quarter') {
    const stepMonths = Math.max(3, Math.ceil((totalDays / 30) / targetCount / 3) * 3);
    for (let cursor = new Date(start); cursor <= end; cursor = addMonths(cursor, stepMonths)) ticks.push(new Date(cursor));
  } else if (zoom === 'Month') {
    const stepMonths = Math.max(1, Math.ceil((totalDays / 30) / targetCount));
    for (let cursor = new Date(start); cursor <= end; cursor = addMonths(cursor, stepMonths)) ticks.push(new Date(cursor));
  } else {
    const stepDays = Math.max(7, Math.ceil(totalDays / targetCount / 7) * 7);
    for (let cursor = new Date(start); cursor <= end; cursor = addDays(cursor, stepDays)) ticks.push(new Date(cursor));
  }

  if (!ticks.length || ticks[ticks.length - 1].getTime() < end.getTime()) ticks.push(new Date(end));
  return ticks.slice(0, 14);
}

export function GanttChart({
  phases,
  mode = 'compact',
  showBaseline = false,
  showCriticalPath = true,
  showWeather = false,
  zoom = 'Month',
  projectStart,
  projectEnd,
  emptyMessage = 'No programme activities match this filter.',
}: {
  phases: Phase[];
  mode?: 'compact' | 'full';
  showBaseline?: boolean;
  showCriticalPath?: boolean;
  showWeather?: boolean;
  zoom?: ProgrammeZoom;
  projectStart?: string;
  projectEnd?: string;
  emptyMessage?: string;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const nameWidth = mode === 'full' ? 176 : 140;
  const scheduleRange = useMemo(() => {
    const allItems = phases.flatMap(phase => [phase, ...(phase.subTasks ?? [])]);
    const starts = allItems.flatMap(item => [item.plannedStart, item.baselineStart]).filter(Boolean).map(parseDate);
    const ends = allItems.flatMap(item => [item.plannedEnd, item.baselineEnd]).filter(Boolean).map(parseDate);
    const start = projectStart ? parseDate(projectStart) : starts.reduce((min, date) => date < min ? date : min, starts[0] ?? new Date());
    const end = projectEnd ? parseDate(projectEnd) : ends.reduce((max, date) => date > max ? date : max, ends[0] ?? addDays(start, 30));
    const rangeMs = Math.max(1, end.getTime() - start.getTime());
    return { start, end, rangeMs, ticks: buildTicks(start, end, zoom) };
  }, [phases, projectEnd, projectStart, zoom]);
  const todayPct = clamp(((Date.now() - scheduleRange.start.getTime()) / scheduleRange.rangeMs) * 100);

  const normalizeItem = <T extends ScheduleItem>(item: T): RenderItem<T> => {
    const startPct = rangePct(item.plannedStart, scheduleRange.start, scheduleRange.rangeMs);
    const endPct = rangePct(item.plannedEnd, scheduleRange.start, scheduleRange.rangeMs);
    const baselineStartPct = rangePct(item.baselineStart, scheduleRange.start, scheduleRange.rangeMs);
    const baselineEndPct = rangePct(item.baselineEnd, scheduleRange.start, scheduleRange.rangeMs);
    return {
      ...item,
      startPct,
      widthPct: Math.max(0.8, endPct - startPct),
      baselineStartPct,
      baselineWidthPct: Math.max(0.8, baselineEndPct - baselineStartPct),
    } as unknown as RenderItem<T>;
  };

  const renderPhases = phases.map(phase => ({
    ...normalizeItem(phase),
    subTasks: phase.subTasks?.map(task => normalizeItem(task)),
  }));

  return (
    <div className="relative rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#0A1628]/80 p-3">
      <div className="relative mb-2 grid gap-3" style={{ gridTemplateColumns: `${nameWidth}px 1fr` }}>
        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7A94B4]">Phase</div>
        <div className="grid text-center text-[9px] text-[#7A94B4]" style={{ gridTemplateColumns: `repeat(${scheduleRange.ticks.length}, minmax(0, 1fr))` }}>
          {scheduleRange.ticks.map((tick, index) => <span key={`${tick.toISOString()}-${index}`}>{formatTick(tick, zoom)}</span>)}
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-3 top-10 border-l border-dashed border-[#C8A020]" style={{ left: `calc(${nameWidth}px + 1.5rem + ${todayPct}%)` }}>
        <span className="absolute -top-4 -translate-x-1/2 rounded bg-[#C8A020]/15 px-1.5 py-0.5 text-[9px] font-bold text-[#F4D66B]">Today</span>
      </div>
      {mode === 'full' && showCriticalPath && (
        <svg className="pointer-events-none absolute inset-x-3 top-14 h-52" viewBox="0 0 100 220" preserveAspectRatio="none">
          <path d="M54 52 C58 66 58 74 64 86 S74 112 76 132 S82 170 93 190" fill="none" stroke="#D92B1C" strokeDasharray="3 3" strokeWidth="0.7" opacity="0.8" />
        </svg>
      )}
      <div className="relative space-y-1">
        {renderPhases.length === 0 && (
          <div className="rounded-lg border border-dashed border-[rgba(46,127,255,0.22)] bg-[#07111F]/78 px-4 py-8 text-center text-[12px] font-bold text-[#8EA7C7]">
            {emptyMessage}
          </div>
        )}
        {renderPhases.map((phase, index) => (
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
