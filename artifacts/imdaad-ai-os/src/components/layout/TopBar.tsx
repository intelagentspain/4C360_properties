import { Bell } from 'lucide-react';
import { useState } from 'react';
import { NotificationPanel } from './NotificationPanel';
import { useNotifications } from '@/context/NotificationContext';

type Perspective = 'strategic' | 'operational' | 'client';

interface Props {
  perspective: Perspective;
  setPerspective: (p: Perspective) => void;
}

export function TopBar({ perspective, setPerspective }: Props) {
  const [notifOpen, setNotifOpen] = useState(false);
  const { unreadCount } = useNotifications();

  return (
    <header className="relative h-[52px] bg-[#0A1628] border-b border-[rgba(46,127,255,0.22)] flex items-center justify-between px-4 z-[100]">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2E7FFF] to-[#00C6FF] flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-blue-500/30">
          AI
        </div>
        <div>
          <div className="text-[#EEF3FA] font-semibold text-sm leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Imdaad AI-OS
          </div>
          <div className="text-[#7A94B4] text-[10px] leading-tight">Powered by 4C360</div>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-[#112040] rounded-full p-1 border border-[rgba(46,127,255,0.22)]">
        {(['strategic', 'operational', 'client'] as Perspective[]).map(p => (
          <button
            key={p}
            onClick={() => setPerspective(p)}
            className={`px-4 py-1 rounded-full text-xs font-semibold transition-all duration-150 ${
              perspective === p
                ? 'bg-[#2E7FFF] text-white shadow-lg shadow-blue-500/30'
                : 'text-[#7A94B4] hover:text-[#EEF3FA]'
            }`}
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          className="relative w-8 h-8 flex items-center justify-center text-[#7A94B4] hover:text-white transition-colors rounded-lg hover:bg-white/5"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2E7FFF] to-[#00C6FF] flex items-center justify-center text-white text-[11px] font-bold shadow-md">
          SK
        </div>
      </div>

      <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
    </header>
  );
}
