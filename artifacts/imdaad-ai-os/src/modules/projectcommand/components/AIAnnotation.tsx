import { motion } from 'framer-motion';

type Variant = 'warning' | 'info' | 'success';

const variantClass: Record<Variant, string> = {
  warning: 'border-[#D92B1C]/45 bg-[#D92B1C]/15 text-red-200',
  info: 'border-[#7C3AED]/45 bg-[#7C3AED]/15 text-violet-200',
  success: 'border-[#00B894]/45 bg-[#00B894]/12 text-emerald-200',
};

export function AIAnnotation({
  text,
  x,
  y,
  variant = 'info',
  onClick,
  attention = false,
}: {
  text: string;
  x: number;
  y: number;
  variant?: Variant;
  onClick?: () => void;
  attention?: boolean;
}) {
  const Element = onClick ? motion.button : motion.div;

  return (
    <Element
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      initial={{ opacity: 0, y: 8 }}
      animate={attention
        ? {
            opacity: 1,
            y: 0,
            scale: [1, 1.08, 1],
            boxShadow: ['0 0 0 rgba(34,211,238,0)', '0 0 28px rgba(34,211,238,0.65)', '0 0 0 rgba(34,211,238,0)'],
          }
        : { opacity: 1, y: 0, scale: 1, boxShadow: '0 0 0 rgba(34,211,238,0)' }}
      transition={{ duration: attention ? 0.75 : 0.3, ease: 'easeOut' }}
      className={`absolute z-20 rounded-full border px-2 py-1 text-[10px] font-bold shadow-lg backdrop-blur ${
        onClick ? 'pointer-events-auto cursor-pointer hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40' : ''
      } ${variantClass[variant]}`}
      style={{ left: `${x}%`, top: y }}
      aria-label={onClick ? `Open AI programme insight for ${text}` : undefined}
    >
      {text}
    </Element>
  );
}
