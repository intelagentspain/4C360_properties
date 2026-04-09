import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Delete, Check } from 'lucide-react';

interface Props {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: Props) {
  const [pin, setPin] = useState<string[]>([]);
  const [shake, setShake] = useState(false);

  const addDigit = (d: string) => {
    if (pin.length >= 4) return;
    const next = [...pin, d];
    setPin(next);
    if (next.length === 4) {
      setTimeout(() => {
        if (next.join('') === '1234') {
          onLogin();
        } else {
          setShake(true);
          setTimeout(() => { setShake(false); setPin([]); }, 700);
        }
      }, 200);
    }
  };

  const deleteDigit = () => setPin(p => p.slice(0, -1));

  const keys = ['1','2','3','4','5','6','7','8','9','←','0','✓'];

  return (
    <div className="flex flex-col items-center justify-center h-full bg-[#0A1628] px-8">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2E7FFF] to-[#00C6FF] flex items-center justify-center text-white font-bold text-lg shadow-xl shadow-blue-500/30 mb-4">
        AI
      </div>
      <h1 className="text-[#EEF3FA] text-lg font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
        Imdaad AI-OS
      </h1>
      <p className="text-[#7A94B4] text-xs mb-8 text-center">Sign in to your work session</p>

      <motion.div
        animate={shake ? { x: [0, -10, 10, -10, 10, 0] } : { x: 0 }}
        transition={{ duration: 0.5 }}
        className="flex gap-3 mb-8"
      >
        {[0,1,2,3].map(i => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
              i < pin.length
                ? shake ? 'bg-red-500 border-red-500' : 'bg-[#2E7FFF] border-[#2E7FFF] shadow-lg shadow-blue-500/50'
                : 'border-[rgba(46,127,255,0.4)] bg-transparent'
            }`}
          />
        ))}
      </motion.div>

      <div className="grid grid-cols-3 gap-3 w-full max-w-[220px]">
        {keys.map(k => (
          <button
            key={k}
            onClick={() => {
              if (k === '←') deleteDigit();
              else if (k === '✓') {}
              else addDigit(k);
            }}
            className={`h-12 rounded-xl flex items-center justify-center text-lg font-semibold transition-all duration-150 active:scale-95 ${
              k === '✓'
                ? 'bg-[#2E7FFF] text-white shadow-lg shadow-blue-500/30 hover:bg-blue-500'
                : k === '←'
                ? 'bg-[#1A3260] text-[#7A94B4] hover:text-[#EEF3FA] hover:bg-[#243c72]'
                : 'bg-[#112040] text-[#EEF3FA] border border-[rgba(46,127,255,0.22)] hover:bg-[#1A3260] hover:border-[rgba(46,127,255,0.5)]'
            }`}
          >
            {k === '←' ? <Delete size={18} /> : k === '✓' ? <Check size={18} /> : k}
          </button>
        ))}
      </div>

      <p className="text-[10px] text-[#7A94B4] text-center mt-8 leading-relaxed max-w-[220px]">
        This device is shared. Your PIN ensures all actions are logged under your name.
      </p>
      <p className="text-[10px] text-[#2E7FFF] mt-2">Demo PIN: 1234</p>
    </div>
  );
}
