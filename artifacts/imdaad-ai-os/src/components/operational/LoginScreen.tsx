import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Delete, ScanLine } from 'lucide-react';
import { UserContextCard } from './UserContextCard';
import { TodayWorkloadPreview } from './TodayWorkloadPreview';
import { LoginTransitionState } from './LoginTransitionState';

interface Props {
  onLogin: (role: 'field_engineer' | 'supervisor' | 'admin') => void;
  onScanWithoutLogin?: () => void;
}

const DEMO_USER = {
  name: 'Karim R.',
  role: 'Field Engineer – HVAC',
  status: 'On Duty',
  site: 'JLT North Cluster',
  shiftStart: 'Shift started: 08:00',
};

export function LoginScreen({ onLogin, onScanWithoutLogin }: Props) {
  const [pin, setPin] = useState<string[]>([]);
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const addDigit = (d: string) => {
    if (pin.length >= 4 || transitioning) return;
    const next = [...pin, d];
    setPin(next);
    if (next.length === 4) {
      setTimeout(() => {
        if (next.join('') === '1234') {
          setSuccess(true);
          setTimeout(() => {
            setTransitioning(true);
          }, 400);
        } else {
          setShake(true);
          setTimeout(() => {
            setShake(false);
            setPin([]);
          }, 700);
        }
      }, 200);
    }
  };

  const deleteDigit = () => {
    if (transitioning) return;
    setPin(p => p.slice(0, -1));
  };

  const keys = ['1','2','3','4','5','6','7','8','9','←','0','⌫'];

  return (
    <div className="relative flex flex-col items-center justify-center h-full bg-[#0A1628] px-6 overflow-hidden">
      <AnimatePresence>
        {transitioning && (
          <LoginTransitionState onComplete={() => onLogin('field_engineer')} />
        )}
      </AnimatePresence>

      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2E7FFF] to-[#00C6FF] flex items-center justify-center text-white font-bold text-lg shadow-xl shadow-blue-500/30 mb-3">
        AI
      </div>
      <h1 className="text-[#EEF3FA] text-lg font-bold mb-0.5" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
        Imdaad AI-OS
      </h1>
      <p className="text-[#7A94B4] text-xs mb-4 text-center">Access your jobs, inspections, and AI copilot</p>

      <UserContextCard
        name={DEMO_USER.name}
        role={DEMO_USER.role}
        status={DEMO_USER.status}
        site={DEMO_USER.site}
        shiftStart={DEMO_USER.shiftStart}
      />

      <motion.div
        animate={shake ? { x: [0, -10, 10, -10, 10, 0] } : { x: 0 }}
        transition={{ duration: 0.5 }}
        className="flex gap-3 mb-5"
      >
        {[0,1,2,3].map(i => {
          const filled = i < pin.length;
          const isError = shake && filled;
          const isSuccess = success && filled;
          return (
            <motion.div
              key={i}
              animate={
                filled
                  ? isError
                    ? { scale: 1 }
                    : isSuccess
                    ? { scale: [1, 1.3, 1] }
                    : { scale: [0.8, 1.15, 1] }
                  : { scale: 1 }
              }
              transition={{ duration: 0.25 }}
              className={`w-4 h-4 rounded-full border-2 transition-colors duration-200 ${
                filled
                  ? isError
                    ? 'bg-red-500 border-red-500 shadow-lg shadow-red-500/50'
                    : isSuccess
                    ? 'bg-emerald-400 border-emerald-400 shadow-lg shadow-emerald-400/60'
                    : 'bg-[#2E7FFF] border-[#2E7FFF] shadow-lg shadow-blue-500/60'
                  : 'border-[rgba(46,127,255,0.4)] bg-transparent'
              }`}
            />
          );
        })}
      </motion.div>

      <div className="grid grid-cols-3 gap-2.5 w-full max-w-[220px]">
        {keys.map(k => (
          <button
            key={k}
            onClick={() => {
              if (k === '←' || k === '⌫') deleteDigit();
              else addDigit(k);
            }}
            disabled={transitioning}
            className={`h-12 rounded-xl flex items-center justify-center text-lg font-semibold transition-all duration-150 active:scale-95 disabled:opacity-50 ${
              k === '←' || k === '⌫'
                ? 'bg-[#1A3260] text-[#7A94B4] hover:text-[#EEF3FA] hover:bg-[#243c72]'
                : 'bg-[#112040] text-[#EEF3FA] border border-[rgba(46,127,255,0.22)] hover:bg-[#1A3260] hover:border-[rgba(46,127,255,0.5)]'
            }`}
          >
            {k === '←' || k === '⌫' ? <Delete size={18} /> : k}
          </button>
        ))}
      </div>

      <TodayWorkloadPreview />

      {onScanWithoutLogin && (
        <button
          onClick={onScanWithoutLogin}
          disabled={transitioning}
          className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl border border-[rgba(0,198,255,0.35)] bg-[#00C6FF]/10 text-[#00C6FF] text-xs font-semibold hover:bg-[#00C6FF]/20 transition-all duration-150 active:scale-95 disabled:opacity-50"
        >
          <ScanLine size={14} />
          Scan &amp; Report Issue
        </button>
      )}

      <p className="text-[10px] text-[#7A94B4] text-center mt-4 leading-relaxed max-w-[220px]">
        This device is shared. Your PIN ensures all actions are logged under your name.
      </p>
      <p className="text-[10px] text-[#2E7FFF] mt-1">Demo PIN: 1234</p>
    </div>
  );
}
