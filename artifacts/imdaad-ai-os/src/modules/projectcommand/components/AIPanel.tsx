import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';

export function AIPanel({ title, children, compact = false }: { title: string; children: ReactNode; compact?: boolean }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`rounded-xl border border-[#7C3AED]/35 bg-[#7C3AED]/10 shadow-[0_0_28px_rgba(124,58,237,0.12)] ${compact ? 'p-3' : 'p-4'}`}
    >
      <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#C4B5FD]">
        <Sparkles size={14} />
        {title}
      </div>
      {children}
    </motion.section>
  );
}
