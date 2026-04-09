import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoginScreen } from './LoginScreen';
import { ActiveTask } from './ActiveTask';
import { ChecklistView } from './ChecklistView';
import { PartsAndPO } from './PartsAndPO';
import { ClipboardList, Scan, ListChecks, Package } from 'lucide-react';
import { mockLoggedInTech } from '@/data/mockData';

interface Props {
  onToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

type Tab = 'task' | 'checklist' | 'parts';

export function OperationalView({ onToast }: Props) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [tab, setTab] = useState<Tab>('task');

  const handleLogin = () => {
    setLoggedIn(true);
    setTimeout(() => onToast('Welcome back, Karim R. · 1 active task assigned', 'success'), 300);
  };

  const tabs = [
    { id: 'task' as Tab, label: 'My Task', icon: ClipboardList },
    { id: 'checklist' as Tab, label: 'Checklist', icon: ListChecks },
    { id: 'parts' as Tab, label: 'Parts', icon: Package },
  ];

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
              <LoginScreen onLogin={handleLogin} />
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
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                  On Duty
                </span>
              </div>

              <div className="flex-1 overflow-hidden">
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
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="h-16 bg-[#112040] border-t border-[rgba(46,127,255,0.22)] flex items-center justify-around px-2 flex-shrink-0">
                {tabs.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-150 ${
                      tab === id ? 'bg-[#2E7FFF]/20 text-[#2E7FFF]' : 'text-[#7A94B4] hover:text-[#EEF3FA]'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="text-[10px] font-medium">{label}</span>
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
