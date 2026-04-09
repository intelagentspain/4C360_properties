import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { mockNotifications } from '@/data/mockData';
import { useState } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function NotificationPanel({ open, onClose }: Props) {
  const [notes, setNotes] = useState(mockNotifications);

  const markAllRead = () => setNotes(prev => prev.map(n => ({ ...n, read: true })));

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
            className="absolute top-12 right-4 z-[300] w-80 bg-[#112040] border border-[rgba(46,127,255,0.3)] rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(46,127,255,0.15)]">
              <div className="flex items-center gap-2">
                <span className="text-[#EEF3FA] font-semibold text-sm">Notifications</span>
                <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {notes.filter(n => !n.read).length}
                </span>
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
            <div className="divide-y divide-[rgba(46,127,255,0.1)]">
              {notes.map(n => (
                <div key={n.id} className={`px-4 py-3 flex gap-3 items-start transition-colors hover:bg-white/5 ${n.read ? 'opacity-60' : ''}`}>
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.type === 'critical' ? 'bg-red-400' : n.type === 'warning' ? 'bg-amber-400' : 'bg-blue-400'}`} />
                  <div>
                    <p className="text-[12px] text-[#EEF3FA] leading-snug">{n.text}</p>
                    <p className="text-[11px] text-[#7A94B4] mt-0.5">{n.sub}</p>
                  </div>
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
