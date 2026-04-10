import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BellOff, AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import type { AppNotification } from '@/context/NotificationContext';

interface Props {
  open: boolean;
  onClose: () => void;
}

function NotifIcon({ type }: { type: AppNotification['type'] }) {
  switch (type) {
    case 'critical': return <AlertCircle size={14} className="text-red-400 flex-shrink-0" />;
    case 'warning':  return <AlertTriangle size={14} className="text-amber-400 flex-shrink-0" />;
    case 'success':  return <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" />;
    default:         return <Info size={14} className="text-blue-400 flex-shrink-0" />;
  }
}

function dotColor(type: AppNotification['type']): string {
  switch (type) {
    case 'critical': return 'bg-red-400';
    case 'warning':  return 'bg-amber-400';
    case 'success':  return 'bg-emerald-400';
    default:         return 'bg-blue-400';
  }
}

export function NotificationPanel({ open, onClose }: Props) {
  const { notifications, markAllRead, muteIncident, isIncidentMuted, syncMuteStatus } = useNotifications();
  const syncedRef = useRef(false);

  useEffect(() => {
    if (open && !syncedRef.current) {
      syncedRef.current = true;
      syncMuteStatus();
    }
    if (!open) syncedRef.current = false;
  }, [open, syncMuteStatus]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <div className="fixed inset-0 z-[200]" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-12 right-4 z-[300] w-[340px] bg-[#112040] border border-[rgba(46,127,255,0.3)] rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(46,127,255,0.15)]">
              <div className="flex items-center gap-2">
                <span className="text-[#EEF3FA] font-semibold text-sm">Notifications</span>
                {notifications.filter(n => !n.read && !n.muted).length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                    {notifications.filter(n => !n.read && !n.muted).length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={markAllRead} className="text-[10px] text-[#2E7FFF] hover:text-blue-400 transition-colors">
                  Mark all read
                </button>
                <button onClick={onClose} className="text-[#7A94B4] hover:text-white">
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="divide-y divide-[rgba(46,127,255,0.1)] max-h-[420px] overflow-y-auto">
              {notifications.length === 0 && (
                <div className="px-4 py-8 text-center text-[#4A6080] text-[12px]">
                  No notifications
                </div>
              )}
              {notifications.map(n => (
                <div
                  key={n.id}
                  className={`px-4 py-3 flex gap-3 items-start transition-colors hover:bg-white/5 ${n.read || n.muted ? 'opacity-50' : ''}`}
                >
                  <div className="mt-0.5">
                    <NotifIcon type={n.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[12px] leading-snug ${n.muted ? 'line-through text-[#4A6080]' : 'text-[#EEF3FA]'}`}>
                      {n.text}
                    </p>
                    <p className="text-[11px] text-[#7A94B4] mt-0.5">{n.sub}</p>
                    {n.incidentId && !n.muted && !isIncidentMuted(n.incidentId) && (
                      <button
                        onClick={() => muteIncident(n.incidentId!)}
                        className="mt-1.5 flex items-center gap-1 text-[10px] text-[#4A6080] hover:text-amber-400 transition-colors"
                      >
                        <BellOff size={10} />
                        Mute this incident
                      </button>
                    )}
                    {n.incidentId && (n.muted || isIncidentMuted(n.incidentId)) && (
                      <span className="mt-1.5 flex items-center gap-1 text-[10px] text-[#4A6080]">
                        <BellOff size={10} />
                        Muted
                      </span>
                    )}
                  </div>
                  {!n.read && !n.muted && (
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dotColor(n.type)}`} />
                  )}
                </div>
              ))}
            </div>

            <div className="px-4 py-3 border-t border-[rgba(46,127,255,0.15)]">
              <button className="text-[12px] text-[#2E7FFF] hover:text-blue-400 transition-colors">
                View all activity →
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
