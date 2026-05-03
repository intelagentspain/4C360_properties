import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, Bot, CheckCircle, X, MapPin, User, ArrowRight, QrCode } from 'lucide-react';
import { useIncidents } from '@/context/IncidentContext';
import { useMemberFilter, isFilterActive } from '@/context/MemberFilterContext';
import { IncidentFullDetailPanel } from './IncidentFullDetailPanel';

type EventType = 'incident' | 'sla' | 'ai' | 'task';

interface PulseEvent {
  id: string;
  type: EventType;
  title: string;
  sub: string;
  time: string;
  location?: string;
  severity?: string;
  new?: boolean;
}

const initialEvents: PulseEvent[] = [
  { id: 'e1', type: 'incident', title: 'AC Failure reported', sub: 'Villa 23, Cluster A · AI Capture', time: '6 min ago', location: 'Silicon Oasis', severity: 'critical', new: true },
  { id: 'e2', type: 'sla', title: 'SLA breach imminent — Job #SI-298', sub: 'Omar T. · 12 min remaining', time: '8 min ago', location: 'Silicon Oasis', severity: 'high' },
  { id: 'e3', type: 'ai', title: 'AI auto-dispatched Karim R.', sub: 'INC-SI-001 · HVAC · 0.4km match', time: '10 min ago', severity: 'info' },
  { id: 'e4', type: 'task', title: 'Work order #SI-2239 closed', sub: 'Faisal N. · Plumbing · Villa 8', time: '14 min ago', severity: 'ok' },
  { id: 'e5', type: 'incident', title: 'Water leak detected', sub: 'Villa 7, Cluster B · Resident App', time: '18 min ago', location: 'Silicon Oasis', severity: 'medium' },
  { id: 'e6', type: 'ai', title: 'PPM risk escalated to HIGH', sub: 'Lift — Cluster A, Block 2 · 2 days', time: '22 min ago', severity: 'high' },
  { id: 'e7', type: 'task', title: 'Parts PO approved', sub: 'PO-2024-1890 · AED 380 · Emirates HVAC', time: '31 min ago', severity: 'ok' },
];

const incoming: PulseEvent[] = [
  { id: 'e8', type: 'incident', title: 'Power fluctuation detected', sub: 'Block C, Community Centre · Sensor', time: 'Just now', severity: 'medium', new: true },
  { id: 'e9', type: 'ai', title: 'AI recommends PPM for Chiller B', sub: 'Runtime threshold exceeded · 96h', time: 'Just now', severity: 'info', new: true },
];

const typeConfig: Record<EventType, { icon: React.ReactNode; color: string; bg: string }> = {
  incident: { icon: <AlertTriangle size={12} />, color: 'text-red-400', bg: 'bg-red-500/20' },
  sla: { icon: <Clock size={12} />, color: 'text-amber-400', bg: 'bg-amber-500/20' },
  ai: { icon: <Bot size={12} />, color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  task: { icon: <CheckCircle size={12} />, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
};

const severityBorder: Record<string, string> = {
  critical: 'border-l-red-500',
  high: 'border-l-amber-400',
  medium: 'border-l-amber-500/60',
  info: 'border-l-cyan-500/60',
  ok: 'border-l-emerald-500/60',
};

interface DrawerProps {
  event: PulseEvent | null;
  onClose: () => void;
  onToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
  onViewFullDetail: (event: PulseEvent) => void;
}

function EventDrawer({ event, onClose, onToast, onViewFullDetail }: DrawerProps) {
  if (!event) return null;
  const cfg = typeConfig[event.type];

  return (
    <AnimatePresence>
      {event && (
        <>
          <div className="fixed inset-0 z-[300]" onClick={onClose} />
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="absolute right-0 top-0 bottom-0 w-72 z-[400] bg-[#112040] border-l border-[rgba(46,127,255,0.3)] shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(46,127,255,0.15)]">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center ${cfg.bg} ${cfg.color}`}>
                  {cfg.icon}
                </div>
                <span className="text-[#EEF3FA] text-sm font-semibold capitalize">{event.type} Detail</span>
              </div>
              <button onClick={onClose} className="text-[#7A94B4] hover:text-white transition-colors">
                <X size={15} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <h3 className="text-[#EEF3FA] font-bold text-sm mb-1">{event.title}</h3>
                <p className="text-[11px] text-[#7A94B4]">{event.sub}</p>
              </div>

              <div className="space-y-2">
                {event.location && (
                  <div className="flex items-center gap-2 text-[11px]">
                    <MapPin size={11} className="text-[#2E7FFF]" />
                    <span className="text-[#7A94B4]">Location:</span>
                    <span className="text-[#EEF3FA]">{event.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-[11px]">
                  <Clock size={11} className="text-[#7A94B4]" />
                  <span className="text-[#7A94B4]">Time:</span>
                  <span className="text-[#EEF3FA]">{event.time}</span>
                </div>
                {event.severity && (
                  <div className="flex items-center gap-2 text-[11px]">
                    <AlertTriangle size={11} className="text-[#7A94B4]" />
                    <span className="text-[#7A94B4]">Severity:</span>
                    <span className="text-[#EEF3FA] capitalize">{event.severity}</span>
                  </div>
                )}
              </div>

              <div className="bg-[#0A1628] rounded-xl p-3">
                <div className="text-[11px] font-semibold text-[#7A94B4] mb-2 uppercase tracking-wide">Context</div>
                <div className="text-[12px] text-[#EEF3FA] leading-relaxed">
                  {event.type === 'incident' && 'Incident auto-detected via AI Capture. Work order created and nearest available inspector identified.'}
                  {event.type === 'sla' && 'SLA countdown has crossed the warning threshold. Supervisor intervention may be required to prevent breach.'}
                  {event.type === 'ai' && 'AI Engine took autonomous action based on configured Hybrid mode rules. No supervisor confirmation required.'}
                  {event.type === 'task' && 'Task completed with full evidence trail. Photo attached to work order. Resident notified via app.'}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-[#7A94B4] uppercase tracking-wide">Linked Assets</div>
                <div className="flex items-center gap-2 p-2 bg-[#0A1628] rounded-lg">
                  <User size={11} className="text-[#2E7FFF]" />
                  <span className="text-[11px] text-[#EEF3FA]">Karim R. — HVAC Specialist</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[rgba(46,127,255,0.15)] space-y-2">
              <button
                onClick={() => { onViewFullDetail(event); onClose(); }}
                className="w-full py-2 bg-[#2E7FFF] text-white text-xs font-semibold rounded-lg hover:bg-blue-500 transition-colors flex items-center justify-center gap-1.5"
              >
                View Full Detail <ArrowRight size={12} />
              </button>
              <button
                onClick={() => { onToast('Event acknowledged', 'success'); onClose(); }}
                className="w-full py-2 border border-[rgba(46,127,255,0.3)] text-[#7A94B4] text-xs rounded-lg hover:bg-white/5 transition-colors"
              >
                Acknowledge
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface Props {
  onToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

function matchesZone(location: string | undefined, zones: string[]): boolean {
  if (zones.length === 0 || !location) return true;
  const loc = location.toLowerCase();
  return zones.some(z => loc.includes(z.toLowerCase()) || z.toLowerCase().includes(loc));
}

export function LivePulseFeed({ onToast }: Props) {
  const { incidents } = useIncidents();
  const memberFilter = useMemberFilter();
  const isMemberMode = isFilterActive(memberFilter);

  const [events, setEvents] = useState<PulseEvent[]>(initialEvents);
  const [selected, setSelected] = useState<PulseEvent | null>(null);
  const [fullDetailEvent, setFullDetailEvent] = useState<PulseEvent | null>(null);
  const [tick, setTick] = useState(0);
  const seenIncidentIds = useRef<Set<string>>(new Set(initialEvents.map(e => e.id)));

  const visibleEvents = useMemo(() => {
    if (!isMemberMode || memberFilter.zones.length === 0) return events;
    return events.filter(e => matchesZone(e.location, memberFilter.zones));
  }, [events, isMemberMode, memberFilter.zones]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 18000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (tick > 0 && tick <= incoming.length) {
      const newEvent = incoming[tick - 1];
      setEvents(prev => [newEvent, ...prev]);
      onToast(newEvent.title, newEvent.type === 'incident' ? 'warning' : 'info');
    }
  }, [tick]);

  useEffect(() => {
    const qrIncidents = incidents.filter(inc => inc.source === 'QR Scan');
    for (const inc of qrIncidents) {
      if (!seenIncidentIds.current.has(inc.id)) {
        seenIncidentIds.current.add(inc.id);
        const pulseEvent: PulseEvent = {
          id: inc.id,
          type: 'incident',
          title: `${inc.title} — QR Scan`,
          sub: `${inc.location} · AI Capture via QR code`,
          time: 'Just now',
          location: inc.location,
          severity: inc.severity,
          new: true,
        };
        setEvents(prev => [pulseEvent, ...prev]);
        onToast(`New QR Scan incident: ${inc.title}`, 'warning');
      }
    }
  }, [incidents]);

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[rgba(46,127,255,0.15)] flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          <span className="text-[10px] font-semibold text-[#EEF3FA] uppercase tracking-wide">Live Pulse</span>
        </div>
        <span className="text-[10px] text-[#7A94B4]">{visibleEvents.length} events</span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence initial={false}>
          {visibleEvents.map(ev => {
            const cfg = typeConfig[ev.type];
            const border = severityBorder[ev.severity || 'info'];
            return (
              <motion.button
                key={ev.id}
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                onClick={() => setSelected(ev)}
                className={`w-full flex items-start gap-2.5 px-3 py-2.5 border-b border-[rgba(46,127,255,0.08)] border-l-2 ${border} hover:bg-white/[0.03] transition-colors text-left group`}
              >
                <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.bg} ${cfg.color}`}>
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] text-[#EEF3FA] font-medium truncate leading-tight">{ev.title}</span>
                    {ev.new && (
                      <span className="flex-shrink-0 px-1 py-0.5 rounded bg-[#2E7FFF] text-white text-[8px] font-bold">NEW</span>
                    )}
                  </div>
                  <div className="text-[10px] text-[#7A94B4] mt-0.5 truncate">{ev.sub}</div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-[10px] text-[#7A94B4]">{ev.time}</span>
                  <ArrowRight size={10} className="text-[#7A94B4] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      <EventDrawer
        event={selected}
        onClose={() => setSelected(null)}
        onToast={onToast}
        onViewFullDetail={(ev) => {
          setSelected(null);
          setFullDetailEvent(ev);
        }}
      />

      {fullDetailEvent && (
        <IncidentFullDetailPanel
          event={fullDetailEvent}
          onClose={() => setFullDetailEvent(null)}
          onToast={onToast}
        />
      )}
    </div>
  );
}
