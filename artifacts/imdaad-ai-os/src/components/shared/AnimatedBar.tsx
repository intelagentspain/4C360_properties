import { motion } from 'framer-motion';

interface AnimatedBarProps {
  value: number;
  color?: string;
  height?: string;
  delay?: number;
}

export function AnimatedBar({ value, color = '#38D98A', height = 'h-1.5', delay = 0 }: AnimatedBarProps) {
  return (
    <div className={`${height} bg-[#0A1628] rounded-full overflow-hidden`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, value)}%` }}
        transition={{ duration: 0.6, delay }}
        className="h-full rounded-full"
        style={{ background: color }}
      />
    </div>
  );
}

interface ConfidenceBarProps {
  label: string;
  value: number;
  color?: string;
  delay?: number;
}

export function ConfidenceBar({ label, value, color = '#38D98A', delay = 0 }: ConfidenceBarProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[9px] text-[#7A94B4]">{label}</span>
        <span className="text-[9px] font-bold" style={{ color }}>{value}%</span>
      </div>
      <AnimatedBar value={value} color={color} height="h-1" delay={delay} />
    </div>
  );
}
