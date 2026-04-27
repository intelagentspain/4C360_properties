import { TrendingUp } from 'lucide-react';
import { EVMCards } from './EVMCards';
import { SCurveChart } from './SCurveChart';
import { useSelectedProjectCommandData } from '../useProjectCommandData';

export function CostIntelligenceFrame({ compact = false }: { compact?: boolean }) {
  const { project } = useSelectedProjectCommandData();
  const overrunPercent = ((project.forecastCost - project.contractValue) / project.contractValue) * 100;
  const forecastBadge = `${overrunPercent >= 0 ? '+' : ''}${overrunPercent.toFixed(1)}% ${overrunPercent >= 0 ? 'overrun' : 'under budget'} - AED ${Math.round(project.forecastCost / 1_000_000)}M forecast`;

  return (
    <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className={`${compact ? 'text-base' : 'text-lg'} font-black`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Cost Intelligence</h2>
      </div>
      <EVMCards compact={compact} />
      <div className="mt-3">
        <SCurveChart height={compact ? 210 : 280} detailed={!compact} />
      </div>
      <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#D92B1C]/30 bg-[#D92B1C]/10 px-3 py-1 text-[11px] font-bold text-red-200">
        <TrendingUp size={13} />
        {forecastBadge}
      </div>
    </section>
  );
}
