interface WorkloadStat {
  label: string;
  count: number;
  color: string;
  bg: string;
  border: string;
}

const stats: WorkloadStat[] = [
  { label: 'Work Orders', count: 5, color: 'text-[#2E7FFF]', bg: 'bg-[#2E7FFF]/10', border: 'border-[#2E7FFF]/30' },
  { label: 'Inspections', count: 2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  { label: 'SLA Risk', count: 1, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
];

export function TodayWorkloadPreview() {
  return (
    <div className="w-full max-w-[280px] mt-5">
      <p className="text-[#7A94B4] text-[10px] font-medium mb-2 text-center tracking-wide uppercase">Today's Workload</p>
      <div className="flex gap-2">
        {stats.map(({ label, count, color, bg, border }) => (
          <div
            key={label}
            className={`flex-1 flex flex-col items-center py-2 px-1 rounded-xl border ${bg} ${border}`}
          >
            <span className={`text-lg font-bold leading-none ${color}`}>{count}</span>
            <span className="text-[#7A94B4] text-[9px] mt-1 text-center leading-tight">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
