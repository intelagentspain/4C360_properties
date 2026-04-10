import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, AlertTriangle, CheckCircle, User, Clock, Zap, X, MapPin } from 'lucide-react';
import { mockReplayEvents } from '@/data/mockData';
import { type ToastFn } from '@/lib/ui';

type ReplayEvent = typeof mockReplayEvents[0];

const EVENT_CONFIG: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  'incident':       { color: 'text-red-400',     bg: 'bg-red-500/20 border-red-500/40',     icon: <AlertTriangle size={11} />, label: 'Incident' },
  'assignment':     { color: 'text-blue-400',    bg: 'bg-blue-500/20 border-blue-500/40',   icon: <User size={11} />,           label: 'Assignment' },
  'sla-escalation': { color: 'text-amber-400',   bg: 'bg-amber-500/20 border-amber-500/40', icon: <Clock size={11} />,          label: 'SLA Alert' },
  'task-update':    { color: 'text-cyan-400',    bg: 'bg-cyan-500/20 border-cyan-500/40',   icon: <Zap size={11} />,            label: 'Update' },
  'closure':        { color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/40', icon: <CheckCircle size={11} />, label: 'Closed' },
};

const TOTAL_MINUTES = mockReplayEvents[mockReplayEvents.length - 1].minute + 4;
const SPEED_OPTIONS = [1, 2, 4, 8];

function formatTime(minute: number) {
  const base = 9 * 60; // 09:00
  const total = base + minute;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function EventPip({ event, isActive, onClick }: { event: ReplayEvent; isActive: boolean; onClick: () => void }) {
  const cfg = EVENT_CONFIG[event.type] || EVENT_CONFIG['task-update'];
  const pct = (event.minute / TOTAL_MINUTES) * 100;
  return (
    <button
      onClick={onClick}
      className={`absolute -translate-x-1/2 -translate-y-1/2 top-1/2 w-3 h-3 rounded-full border-2 transition-all z-10 ${isActive ? 'scale-150 border-white' : 'border-[#0A1628] hover:scale-125'}`}
      style={{ left: `${pct}%`, background: cfg.color.replace('text-', '').replace('-400', '') === 'red' ? '#FF4B4B' : cfg.color === 'text-blue-400' ? '#2E7FFF' : cfg.color === 'text-emerald-400' ? '#38D98A' : cfg.color === 'text-amber-400' ? '#FF9B38' : '#00C6FF' }}
      title={event.title}
    />
  );
}

function ActivityGrid({ events }: { events: ReplayEvent[] }) {
  const zones = ['Villa 23', 'Villa 7', 'Block C', 'Villa 31', 'Main Gate', 'Gym Area'];
  const zoneIncidents: Record<string, number> = {};
  events.forEach(e => {
    zones.forEach(z => {
      if (e.title.toLowerCase().includes(z.toLowerCase().split(' ')[0].toLowerCase())) {
        zoneIncidents[z] = (zoneIncidents[z] || 0) + 1;
      }
    });
  });
  const techs = ['Karim R.', 'Sara M.', 'Faisal N.', 'Ahmed K.', 'Omar T.'];
  const techActivity: Record<string, boolean> = {};
  events.forEach(e => {
    techs.forEach(t => { if (e.title.includes(t)) techActivity[t] = true; });
  });
  return (
    <div className="space-y-4">
      <div>
        <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-2">Active Zones</div>
        <div className="grid grid-cols-3 gap-2">
          {zones.map(z => {
            const count = zoneIncidents[z] || 0;
            const hasActivity = count > 0;
            return (
              <div key={z} className={`rounded-lg border p-2 text-center transition-all ${hasActivity ? 'bg-[rgba(46,127,255,0.12)] border-[rgba(46,127,255,0.4)]' : 'bg-[#0A1628] border-[rgba(46,127,255,0.1)]'}`}>
                <MapPin size={12} className={hasActivity ? 'text-[#2E7FFF] mx-auto mb-0.5' : 'text-[#7A94B4] mx-auto mb-0.5'} />
                <div className="text-[9px] text-[#EEF3FA] font-medium leading-tight">{z}</div>
                {hasActivity && <div className="text-[8px] text-blue-400">{count} event{count > 1 ? 's' : ''}</div>}
              </div>
            );
          })}
        </div>
      </div>
      <div>
        <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-2">Tech Activity</div>
        <div className="space-y-1.5">
          {techs.map(t => {
            const active = techActivity[t] || false;
            const initials = t.split(' ').map(n => n[0]).join('');
            return (
              <div key={t} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0 ${active ? 'bg-gradient-to-br from-[#2E7FFF] to-[#00C6FF] text-white' : 'bg-[#112040] text-[#7A94B4]'}`}>
                  {initials}
                </div>
                <div className="flex-1">
                  <div className="text-[10px] text-[#EEF3FA]">{t}</div>
                </div>
                <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-400 animate-pulse' : 'bg-[#7A94B4]/30'}`} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface Props { onToast: ToastFn }

export function Replay({ onToast }: Props) {
  const [playhead,     setPlayhead]     = useState(0);
  const [playing,      setPlaying]      = useState(false);
  const [speed,        setSpeed]        = useState(1);
  const [selectedEvt,  setSelectedEvt]  = useState<ReplayEvent | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const visibleEvents = mockReplayEvents.filter(e => e.minute <= playhead);
  const currentEvent  = [...mockReplayEvents].reverse().find(e => e.minute <= playhead) || null;

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setPlayhead(prev => {
          if (prev >= TOTAL_MINUTES) { setPlaying(false); return TOTAL_MINUTES; }
          return prev + 0.5;
        });
      }, 500 / speed);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, speed]);

  useEffect(() => {
    const justTriggered = mockReplayEvents.find(e => Math.abs(e.minute - playhead) < 0.6);
    if (justTriggered) setSelectedEvt(justTriggered);
  }, [Math.floor(playhead)]);

  const handleScrub = (v: number) => {
    setPlayhead(v);
    setPlaying(false);
  };

  const skip = (delta: number) => {
    setPlayhead(prev => Math.max(0, Math.min(TOTAL_MINUTES, prev + delta)));
    setPlaying(false);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(46,127,255,0.15)] flex-shrink-0">
        <div>
          <h2 className="text-[#EEF3FA] font-bold text-base" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Operational Replay</h2>
          <p className="text-[11px] text-[#7A94B4]">Replay today's operational events in real time · Silicon Oasis</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-[11px] text-[#EEF3FA] font-mono bg-[#112040] border border-[rgba(46,127,255,0.25)] px-3 py-1.5 rounded-lg">
            {formatTime(playhead)}
          </div>
          <div className="text-[10px] text-[#7A94B4]">{visibleEvents.length} events</div>
        </div>
      </div>

      <div className="px-5 py-4 border-b border-[rgba(46,127,255,0.12)] flex-shrink-0 bg-[rgba(17,32,64,0.5)]">
        <div className="relative mb-4">
          <div className="h-2 bg-[#112040] rounded-full overflow-hidden border border-[rgba(46,127,255,0.2)]">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#2E7FFF] to-[#00C6FF]"
              style={{ width: `${(playhead / TOTAL_MINUTES) * 100}%` }}
            />
          </div>
          {mockReplayEvents.map(e => (
            <EventPip
              key={e.id}
              event={e}
              isActive={Math.abs(e.minute - playhead) < 1}
              onClick={() => { handleScrub(e.minute); setSelectedEvt(e); }}
            />
          ))}
          <input
            type="range" min={0} max={TOTAL_MINUTES} step={0.5} value={playhead}
            onChange={e => handleScrub(parseFloat(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <div className="flex items-center justify-between text-[9px] text-[#7A94B4] mb-3">
          <span>09:00</span>
          <span>09:30</span>
          <span>10:00</span>
          <span>10:30</span>
          <span>{formatTime(TOTAL_MINUTES)}</span>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => skip(-5)} className="w-8 h-8 rounded-lg bg-[#112040] border border-[rgba(46,127,255,0.2)] flex items-center justify-center text-[#7A94B4] hover:text-white transition-colors">
            <SkipBack size={14} />
          </button>
          <button
            onClick={() => {
              if (playhead >= TOTAL_MINUTES) setPlayhead(0);
              setPlaying(p => !p);
            }}
            className="w-10 h-10 rounded-xl bg-[#2E7FFF] flex items-center justify-center text-white shadow-lg shadow-blue-500/30 hover:bg-blue-500 transition-colors"
          >
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button onClick={() => skip(5)} className="w-8 h-8 rounded-lg bg-[#112040] border border-[rgba(46,127,255,0.2)] flex items-center justify-center text-[#7A94B4] hover:text-white transition-colors">
            <SkipForward size={14} />
          </button>

          <div className="flex gap-1 ml-2">
            {SPEED_OPTIONS.map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${speed === s ? 'bg-[rgba(46,127,255,0.2)] border-[#2E7FFF] text-[#EEF3FA]' : 'border-[rgba(46,127,255,0.15)] text-[#7A94B4] hover:text-[#EEF3FA]'}`}
              >
                {s}×
              </button>
            ))}
          </div>

          <div className="ml-auto flex gap-2">
            {['incident','assignment','sla-escalation','task-update','closure'].map(type => {
              const cfg = EVENT_CONFIG[type];
              return (
                <div key={type} className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${cfg.bg.split(' ')[0]}`} />
                  <span className="text-[9px] text-[#7A94B4]">{cfg.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-[60] overflow-y-auto custom-scrollbar p-4 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-[#7A94B4] uppercase tracking-wide">Event Feed · {formatTime(0)} → {formatTime(Math.ceil(playhead))}</span>
            <span className="text-[10px] text-[#7A94B4]">{visibleEvents.length} of {mockReplayEvents.length} events</span>
          </div>

          {visibleEvents.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <Play size={24} className="text-[#7A94B4] opacity-30" />
              <span className="text-[12px] text-[#7A94B4] opacity-60">Press play or drag the timeline to begin</span>
            </div>
          )}

          <AnimatePresence>
            {[...visibleEvents].reverse().map(evt => {
              const cfg = EVENT_CONFIG[evt.type] || EVENT_CONFIG['task-update'];
              const isSelected = selectedEvt?.id === evt.id;
              return (
                <motion.button
                  key={evt.id}
                  layout
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setSelectedEvt(isSelected ? null : evt)}
                  className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-all ${
                    isSelected ? 'bg-[rgba(46,127,255,0.1)] border-[rgba(46,127,255,0.4)]' : 'bg-[rgba(17,32,64,0.6)] border-[rgba(46,127,255,0.12)] hover:border-[rgba(46,127,255,0.3)]'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 border ${cfg.bg} ${cfg.color}`}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className={`text-[9px] font-bold uppercase tracking-wide ${cfg.color}`}>{cfg.label}</span>
                        <span className="text-[9px] text-[#7A94B4] ml-2">{evt.entity}</span>
                      </div>
                      <span className="text-[9px] text-[#7A94B4] font-mono flex-shrink-0">{evt.time}</span>
                    </div>
                    <div className="text-[11px] text-[#EEF3FA] font-medium leading-snug mt-0.5">{evt.title}</div>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        <div className="flex-[40] border-l border-[rgba(46,127,255,0.15)] overflow-y-auto custom-scrollbar p-4 space-y-4">
          <AnimatePresence mode="wait">
            {selectedEvt ? (
              <motion.div
                key={selectedEvt.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide">Event Detail</div>
                  <button onClick={() => setSelectedEvt(null)} className="text-[#7A94B4] hover:text-white"><X size={12} /></button>
                </div>
                <div className={`p-3 rounded-xl border ${EVENT_CONFIG[selectedEvt.type]?.bg || 'bg-blue-500/20 border-blue-500/40'}`}>
                  <div className={`text-[10px] font-bold uppercase tracking-wide mb-1 ${EVENT_CONFIG[selectedEvt.type]?.color}`}>
                    {EVENT_CONFIG[selectedEvt.type]?.label}
                  </div>
                  <div className="text-[13px] text-[#EEF3FA] font-semibold leading-snug">{selectedEvt.title}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[9px] text-[#7A94B4] font-mono">{selectedEvt.time}</span>
                    <span className="text-[9px] text-[#7A94B4]">·</span>
                    <span className="text-[9px] text-[#7A94B4]">{selectedEvt.entity}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Event ID',  value: selectedEvt.id },
                    { label: 'Time',      value: selectedEvt.time },
                    { label: 'Entity',    value: selectedEvt.entity },
                    { label: 'Type',      value: EVENT_CONFIG[selectedEvt.type]?.label || selectedEvt.type },
                  ].map(r => (
                    <div key={r.label} className="bg-[#0A1628] rounded-lg p-2">
                      <div className="text-[8px] text-[#7A94B4] uppercase">{r.label}</div>
                      <div className="text-[10px] text-[#EEF3FA] font-medium">{r.value}</div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => onToast(`Viewing full detail for ${selectedEvt.entity}`, 'info')}
                  className="w-full py-2 rounded-lg bg-[#2E7FFF] text-white text-[11px] font-semibold hover:bg-blue-500 transition-colors"
                >
                  Open in System →
                </button>
              </motion.div>
            ) : (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide">Operational State</div>
                <ActivityGrid events={visibleEvents} />
                {visibleEvents.length === 0 && (
                  <p className="text-[11px] text-[#7A94B4] text-center pt-8 opacity-60">Play the timeline to see operational state</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
