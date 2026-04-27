import { useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import { BarChart3, BrainCircuit, Building2, CalendarRange, ShieldAlert } from 'lucide-react';
import { project } from './data/project';
import { CommandCenter } from './screens/CommandCenter';
import { Programme } from './screens/Programme';
import { CostIntelligence } from './screens/CostIntelligence';
import { RiskCommand } from './screens/RiskCommand';
import { AIForecast } from './screens/AIForecast';
import type { ProjectCommandScreen } from './types';

const tabs: { id: ProjectCommandScreen; label: string; icon: ComponentType<{ size?: number }> }[] = [
  { id: 'overview', label: 'Overview', icon: Building2 },
  { id: 'programme', label: 'Programme', icon: CalendarRange },
  { id: 'cost', label: 'Cost', icon: BarChart3 },
  { id: 'risk', label: 'Risk', icon: ShieldAlert },
  { id: 'forecast', label: 'AI Forecast', icon: BrainCircuit },
];

function screenFromPath(): ProjectCommandScreen {
  const match = window.location.pathname.match(/\/projectcommand\/([^/]+)/);
  const value = match?.[1] as ProjectCommandScreen | undefined;
  return tabs.find(tab => tab.id === value)?.id ?? 'overview';
}

export function ProjectCommand() {
  const [screen, setScreen] = useState<ProjectCommandScreen>(screenFromPath);

  const goTo = (next: ProjectCommandScreen) => {
    setScreen(next);
    const nextPath = `/projectcommand/${next}`;
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }
  };

  const activeTitle = useMemo(() => tabs.find(tab => tab.id === screen)?.label ?? 'Overview', [screen]);

  return (
    <div className="flex h-full min-w-[1280px] flex-col overflow-hidden bg-[#07101C] text-[#F0F4FF]">
      <div className="flex-shrink-0 border-b border-[#1C3050] bg-[#09152A] px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#7C3AED]/40 bg-[#7C3AED]/15 text-[#C4B5FD]">
                <BrainCircuit size={20} />
              </div>
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#C4B5FD]">ProjectCommand · {activeTitle}</div>
                <h1 className="text-[24px] font-black text-[#F0F4FF]" style={{ fontFamily: 'Syne, sans-serif' }}>{project.name}</h1>
              </div>
            </div>
            <p className="mt-2 text-[12px] text-[#BCC8DC]">
              {project.developer} · {project.type} · {project.location} · AED {Math.round(project.contractValue / 1_000_000)}M · {project.completion}% complete
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select className="rounded-lg border border-[#264468] bg-[#07101C] px-3 py-2 text-[12px] font-bold text-[#BCC8DC] outline-none">
              <option>Danube Properties · Lawnz Residences</option>
              <option>Danube Properties · Bayz 102</option>
              <option>Reportage · Verdana Tower</option>
            </select>
            <button className="rounded-lg border border-[#7C3AED]/45 bg-[#7C3AED] px-4 py-2 text-[12px] font-black text-white shadow-lg shadow-violet-900/25">
              Run AI Forecast
            </button>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = tab.id === screen;
            return (
              <button
                key={tab.id}
                onClick={() => goTo(tab.id)}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-[12px] font-bold transition-colors ${
                  active
                    ? 'border-[#7C3AED]/40 bg-[#7C3AED]/15 text-[#C4B5FD]'
                    : 'border-[#1C3050] bg-[#0E1E35] text-[#5A6E88] hover:border-[#264468] hover:text-[#F0F4FF]'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        {screen === 'overview' && <CommandCenter goTo={goTo} />}
        {screen === 'programme' && <Programme />}
        {screen === 'cost' && <CostIntelligence />}
        {screen === 'risk' && <RiskCommand />}
        {screen === 'forecast' && <AIForecast />}
      </div>
    </div>
  );
}

export default ProjectCommand;
