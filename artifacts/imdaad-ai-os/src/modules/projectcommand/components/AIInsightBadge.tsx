import { Sparkles } from 'lucide-react';

export function AIInsightBadge({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={event => {
        event.stopPropagation();
        onClick();
      }}
      title="Explain this metric"
      aria-label="Explain this metric"
      className="group absolute right-3 top-3 z-10 inline-flex h-6 items-center gap-1 rounded-full border border-violet-300/30 bg-[linear-gradient(135deg,#1D7CFF,#7C3AED)] px-2 text-[9px] font-black uppercase tracking-wide text-white shadow-[0_0_18px_rgba(124,58,237,0.35)] transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-violet-300/70"
    >
      <Sparkles size={10} />
      AI
      <span className="pointer-events-none absolute right-0 top-8 hidden whitespace-nowrap rounded-lg border border-[rgba(46,127,255,0.28)] bg-[#07111F] px-2.5 py-1.5 text-[10px] font-bold normal-case tracking-normal text-[#DDE6F8] shadow-xl group-hover:block">
        Explain this metric
      </span>
    </button>
  );
}
