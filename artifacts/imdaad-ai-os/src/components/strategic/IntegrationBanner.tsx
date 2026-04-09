import { Link2 } from 'lucide-react';

export function IntegrationBanner() {
  return (
    <div className="h-7 bg-[#0A1628] border-b border-[rgba(46,127,255,0.15)] flex items-center px-4 gap-2 flex-shrink-0">
      <Link2 size={12} className="text-[#2E7FFF]" />
      <span className="text-[11px] text-[#7A94B4]">
        Connected to:{' '}
        <span className="text-[#EEF3FA]">Maximo</span> (Gate Avenue) ·{' '}
        <span className="text-[#EEF3FA]">Oracle</span> (12 other sites) ·{' '}
        <span className="text-[#EEF3FA]">Power BI</span>
        <span className="ml-1 text-emerald-400">— data syncing every 5 min</span>
      </span>
    </div>
  );
}
