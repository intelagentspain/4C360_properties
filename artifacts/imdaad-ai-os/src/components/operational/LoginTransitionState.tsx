import { useEffect } from 'react';
import { motion } from 'framer-motion';

interface Props {
  onComplete: () => void;
}

export function LoginTransitionState({ onComplete }: Props) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 z-50 bg-[#0A1628] flex flex-col items-center justify-center gap-4"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2E7FFF] to-[#00C6FF] flex items-center justify-center shadow-xl shadow-blue-500/40"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
        />
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="text-[#EEF3FA] text-sm font-semibold"
        style={{ fontFamily: 'Space Grotesk, sans-serif' }}
      >
        Loading your workspace…
      </motion.p>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: '120px' }}
        transition={{ duration: 0.75, ease: 'easeOut' }}
        className="h-0.5 bg-gradient-to-r from-[#2E7FFF] to-[#00C6FF] rounded-full"
      />
    </motion.div>
  );
}
