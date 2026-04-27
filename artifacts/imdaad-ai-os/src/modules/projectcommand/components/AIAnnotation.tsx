import { motion } from 'framer-motion';

type Variant = 'warning' | 'info' | 'success';

const variantClass: Record<Variant, string> = {
  warning: 'border-[#D92B1C]/45 bg-[#D92B1C]/15 text-red-200',
  info: 'border-[#7C3AED]/45 bg-[#7C3AED]/15 text-violet-200',
  success: 'border-[#00B894]/45 bg-[#00B894]/12 text-emerald-200',
};

export function AIAnnotation({ text, x, y, variant = 'info' }: { text: string; x: number; y: number; variant?: Variant }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`absolute z-20 rounded-full border px-2 py-1 text-[10px] font-bold shadow-lg backdrop-blur ${variantClass[variant]}`}
      style={{ left: `${x}%`, top: y }}
    >
      {text}
    </motion.div>
  );
}
