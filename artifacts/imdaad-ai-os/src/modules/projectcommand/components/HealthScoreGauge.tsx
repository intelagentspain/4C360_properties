import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { useEffect } from 'react';

export function HealthScoreGauge({ score, size = 96, status }: { score: number; size?: number; status: 'good' | 'monitor' | 'critical' }) {
  const radius = size / 2 - 9;
  const circumference = 2 * Math.PI * radius;
  const value = useMotionValue(0);
  const display = useTransform(value, latest => Math.round(latest));
  const dash = useTransform(value, latest => `${(latest / 100) * circumference} ${circumference}`);
  const color = score >= 70 ? '#00B894' : score >= 50 ? '#D97706' : '#D92B1C';

  useEffect(() => {
    const controls = animate(value, score, { duration: 1.2, ease: 'easeOut' });
    return controls.stop;
  }, [score, value]);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#243448" strokeWidth="8" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={dash}
          filter="drop-shadow(0 0 10px rgba(124,58,237,.35))"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div className="text-[30px] font-black leading-none text-[#F0F4FF]" style={{ fontFamily: 'Syne, sans-serif' }}>
          {display}
        </motion.div>
        <div className="text-[10px] font-semibold text-[#5A6E88]">/100</div>
        <div className="mt-1 rounded-full border border-[#00B894]/25 bg-[#00B894]/10 px-2 py-0.5 text-[9px] font-bold uppercase text-[#9AF7DC]">
          {status}
        </div>
      </div>
      <span className="absolute left-0 top-1 text-[9px] text-[#5A6E88]">0</span>
      <span className="absolute right-0 top-1 text-[9px] text-[#5A6E88]">100</span>
    </div>
  );
}
