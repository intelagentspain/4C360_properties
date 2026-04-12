import { CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import type { AiAnalysis } from './incidentUtils';

interface Props {
  analysis: AiAnalysis;
}

const PRIORITY_TEXT: Record<AiAnalysis['priority'], string> = {
  high: 'text-red-700',
  medium: 'text-amber-700',
  low: 'text-emerald-700',
};

const PRIORITY_BADGE: Record<AiAnalysis['priority'], string> = {
  high: 'bg-red-50 text-red-700 border-red-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export function AnalysisResultCard({ analysis }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-[#F5EFE0] border border-[#E8DEC8] overflow-hidden"
    >
      <div className="px-4 py-2.5 border-b border-[#E8DEC8] flex items-center gap-2 flex-wrap">
        <CheckCircle size={13} className="text-[#0D9488] flex-shrink-0" />
        <span className="text-[11px] font-semibold text-[#2C1810]">AI Analysis Complete</span>
        <span className="text-[10px] bg-[#1A2942]/6 text-[#1A2942] border border-[#1A2942]/15 px-2 py-0.5 rounded-full font-medium">
          {analysis.category}
        </span>
        <span className={`text-[10px] font-semibold border px-2 py-0.5 rounded-full ${PRIORITY_BADGE[analysis.priority]}`}>
          {analysis.priority.charAt(0).toUpperCase() + analysis.priority.slice(1)} Priority
        </span>
        <span className="ml-auto text-[10px] bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/30 px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
          {analysis.confidence}% confident
        </span>
      </div>

      <div className="px-4 py-3 space-y-3">
        <div>
          <div className="text-[13px] font-bold text-[#2C1810] leading-snug">{analysis.title}</div>
          <div className="text-[11px] text-[#5C4A2A] mt-1 leading-relaxed">{analysis.description}</div>
        </div>

        <div className="text-[11px]">
          <span className="text-[#8B7355] block text-[10px] uppercase tracking-wide font-medium mb-0.5">Affected Area / Asset</span>
          <span className="text-[#2C1810] font-semibold">{analysis.identifiedAsset}</span>
        </div>

        {analysis.observations.length > 0 && (
          <div>
            <span className="text-[#8B7355] block text-[10px] uppercase tracking-wide font-medium mb-1.5">Observations</span>
            <ul className="space-y-1">
              {analysis.observations.map((obs, i) => (
                <li key={i} className="flex items-start gap-2 text-[11px] text-[#5C4A2A]">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#C9A96E] flex-shrink-0" />
                  <span className="leading-relaxed">{obs}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-xl bg-white/70 border border-[#E8DEC8] px-3 py-2.5">
          <span className="text-[10px] uppercase tracking-wide font-medium text-[#8B7355] block mb-1">Recommended Action</span>
          <p className={`text-[11px] leading-relaxed font-medium ${PRIORITY_TEXT[analysis.priority]}`}>
            {analysis.recommendedAction}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
