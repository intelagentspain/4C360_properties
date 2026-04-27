import { useState } from 'react';
import { useSelectedProjectCommandData } from '../useProjectCommandData';

export function CriticalMilestones() {
  const { milestones } = useSelectedProjectCommandData();
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? milestones : milestones.slice(0, 5);

  return (
    <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Critical Milestones</h3>
        <button onClick={() => setExpanded(current => !current)} className="text-[11px] font-bold text-[#C4B5FD]">{expanded ? 'Collapse' : 'View all'}</button>
      </div>
      <div className="space-y-2">
        {visible.map(item => (
          <div key={item.id} className="flex items-center gap-2 rounded-lg border border-[rgba(46,127,255,0.18)] bg-[#0A1628] px-3 py-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="flex-1 truncate text-[12px] font-semibold text-[#B8C7DB]">{item.name}</span>
            <span className={`font-mono text-[11px] font-bold ${item.daysRemaining < 7 ? 'text-red-300' : item.daysRemaining < 30 ? 'text-amber-300' : 'text-emerald-300'}`}>{item.daysRemaining}d</span>
          </div>
        ))}
      </div>
    </section>
  );
}
