import { aiContent } from '../data/ai-responses';

const riskClass: Record<string, string> = {
  high: 'border-[#D92B1C]/35 bg-[#D92B1C]/14 text-red-200',
  medium: 'border-[#D97706]/35 bg-[#D97706]/14 text-amber-200',
  low: 'border-[#00B894]/35 bg-[#00B894]/12 text-emerald-200',
};

export function WeatherOverlay() {
  return (
    <div className="mt-3 grid grid-cols-4 gap-2">
      {aiContent.programmeInsights.weatherRisk.map(item => (
        <div key={item.month} className={`rounded-lg border px-3 py-2 ${riskClass[item.risk]}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black">{item.month}</span>
            <span className="text-[9px] font-bold uppercase">{item.risk}</span>
          </div>
          <p className="mt-1 line-clamp-2 text-[10px] leading-4 opacity-80">{item.note}</p>
        </div>
      ))}
    </div>
  );
}
