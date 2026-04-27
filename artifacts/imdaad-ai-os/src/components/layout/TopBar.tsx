import { Bell } from 'lucide-react';
import { useState } from 'react';
import { NotificationPanel } from './NotificationPanel';
import { ProfileMenu } from './ProfileMenu';
import { useNotifications } from '@/context/NotificationContext';

type Perspective = 'strategic' | 'operational' | 'client';
const perspectiveLabels: Record<Perspective, string> = {
  strategic: 'Strategic',
  operational: 'FieldOps',
  client: 'Client',
};

interface Props {
  perspective: Perspective;
  setPerspective: (p: Perspective) => void;
}

export function TopBar({ perspective, setPerspective }: Props) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { unreadCount } = useNotifications();

  return (
    <header className="relative h-[52px] bg-[#0A1628] border-b border-[rgba(46,127,255,0.22)] flex items-center justify-between px-4 z-[100]">
      <div className="flex items-center gap-3">
        <img src="/4c-logo.png" className="w-8 h-8 rounded-lg object-contain" alt="4C logo" />
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
                ? p === 'operational'
                  ? 'bg-[#E11D2E] text-white shadow-lg shadow-red-500/25'
                  : 'bg-[#2E7FFF] text-white shadow-lg shadow-blue-500/30'
                : 'text-[#7A94B4] hover:text-[#EEF3FA]'
            }`}
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            {perspectiveLabels[p]}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            setNotifOpen(!notifOpen);
            setProfileOpen(false);
          }}
          className="relative w-8 h-8 flex items-center justify-center text-[#7A94B4] hover:text-white transition-colors rounded-lg hover:bg-white/5"
          aria-label="Open notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => {
            setProfileOpen(!profileOpen);
            setNotifOpen(false);
          }}
          className={`w-8 h-8 rounded-full bg-gradient-to-br from-[#2E7FFF] via-[#0B1220] to-[#E11D2E] flex items-center justify-center text-white text-[11px] font-bold shadow-md transition-all hover:scale-105 ${
            profileOpen ? 'ring-2 ring-[#2E7FFF]/70 ring-offset-2 ring-offset-[#0A1628]' : ''
          }`}
          aria-label="Open profile settings"
          title="Profile settings"
        >
          SK
        </button>
      </div>

      <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
      {profileOpen && !notifOpen && (
        <ProfileMenu open onClose={() => setProfileOpen(false)} />
      )}
    </header>
  );
}
