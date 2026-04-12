import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoginScreen } from './LoginScreen';
import { ActiveTask } from './ActiveTask';
import { ChecklistView } from './ChecklistView';
import { PartsAndPO } from './PartsAndPO';
import { KanbanBoard } from './KanbanBoard';
import { TechPerformance } from './TechPerformance';
import { ClipboardList, ListChecks, Package, LayoutGrid, ScanLine, Bell, BellOff, BellRing } from 'lucide-react';
import { mockLoggedInTech } from '@/data/mockData';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface Props {
  onToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

type Tab = 'task' | 'checklist' | 'parts' | 'board' | 'stats';
type UserRole = 'field_engineer' | 'supervisor' | 'admin';

export function OperationalView({ onToast }: Props) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [tab, setTab] = useState<Tab>('task');

  const { state: pushState, subscribe, unsubscribe } = usePushNotifications(mockLoggedInTech.email);

  const handleLogin = (role: UserRole) => {
    if (role === 'field_engineer') {
      setLoggedIn(true);
      setTimeout(() => onToast('Welcome back, Karim R. · 1 active task assigned', 'success'), 300);
    }
    // stub: supervisor → Operational Dashboard (not yet built)
    // stub: admin → Strategic Dashboard (not yet built)
  };

  const handleScanNav = () => {
    window.location.href = import.meta.env.BASE_URL + 'scan/silicon-oasis/general';
  };

  const handlePushToggle = async () => {
    if (pushState === 'subscribed') {
      const ok = await unsubscribe();
      if (ok) onToast('Push notifications disabled', 'info');
      else onToast('Could not disable notifications', 'error');
    } else if (pushState === 'default' || pushState === 'unsupported') {
      if (pushState === 'unsupported') {
        onToast('Push notifications not supported in this browser', 'warning');
        return;
      }
      const ok = await subscribe();
      if (ok) onToast('Push notifications enabled — you will be alerted on new job assignments', 'success');
      else onToast('Notification permission denied', 'warning');
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ size?: number }>; scanNav?: boolean }[] = [
    { id: 'task',      label: 'My Task',   icon: ClipboardList },
    { id: 'checklist', label: 'Checklist', icon: ListChecks },
    { id: 'task',      label: 'Scan',      icon: ScanLine, scanNav: true },
    { id: 'parts',     label: 'Parts',     icon: Package },
    { id: 'board',     label: 'Board',     icon: LayoutGrid },
  ];

  const PushIcon = pushState === 'subscribed' ? BellRing : pushState === 'denied' ? BellOff : Bell;
  const pushColor = pushState === 'subscribed' ? 'text-emerald-400' : pushState === 'denied' ? 'text-red-400' : 'text-[#7A94B4]';

  return (
    <div className="flex items-center justify-center h-full bg-[#0A1628] py-4">
      <div className="relative w-[390px] h-[720px] bg-[#0A1628] rounded-[2.5rem] border-2 border-[rgba(46,127,255,0.3)] shadow-2xl shadow-blue-500/20 overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          {!loggedIn ? (
            <motion.div
              key="login"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 overflow-hidden"
            >
              <LoginScreen onLogin={handleLogin} onScanWithoutLogin={handleScanNav} />
            </motion.div>
          ) : (
            <motion.div
              key="app"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col flex-1 overflow-hidden"
            >
              <div className="h-12 bg-[#112040] border-b border-[rgba(46,127,255,0.22)] flex items-center justify-between px-4 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#2E7FFF] to-[#00C6FF] flex items-center justify-center text-white text-[10px] font-bold">
                    {mockLoggedInTech.avatar}
                  </div>
                  <div>
                    <div className="text-[#EEF3FA] text-xs font-semibold">{mockLoggedInTech.name}</div>
                    <div className="text-[10px] text-[#7A94B4]">{mockLoggedInTech.role}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {pushState !== 'loading' && pushState !== 'denied' && (
                    <button
                      onClick={handlePushToggle}
                      title={pushState === 'subscribed' ? 'Disable push notifications' : 'Enable push notifications'}
                      className={`w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors ${pushColor}`}
                    >
                      <PushIcon size={14} />
                    </button>
                  )}
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                    On Duty
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-hidden relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tab}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.18 }}
                    className="h-full"
                  >
                    {tab === 'task' && <ActiveTask onScan={() => {}} />}
                    {tab === 'checklist' && <ChecklistView onToast={onToast} />}
                    {tab === 'parts' && <PartsAndPO onToast={onToast} />}
                    {tab === 'board' && <KanbanBoard onToast={onToast} />}
                    {tab === 'stats' && <TechPerformance />}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="bg-[#112040] border-t border-[rgba(46,127,255,0.22)] flex items-center justify-around px-1 flex-shrink-0" style={{ height: 60 }}>
                {tabs.map(({ id, label, icon: Icon, scanNav }, idx) => (
                  <button
                    key={`${id}-${idx}`}
                    onClick={() => scanNav ? handleScanNav() : setTab(id)}
                    className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-150 flex-1 ${
                      scanNav
                        ? 'text-[#00C6FF] hover:bg-cyan-500/10'
                        : tab === id ? 'bg-[#2E7FFF]/20 text-[#2E7FFF]' : 'text-[#7A94B4] hover:text-[#EEF3FA]'
                    }`}
                  >
                    <Icon size={16} />
                    <span className="text-[9px] font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
