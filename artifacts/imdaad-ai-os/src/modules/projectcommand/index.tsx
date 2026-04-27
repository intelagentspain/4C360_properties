import { useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import { BarChart3, BrainCircuit, Building2, CalendarRange, ShieldAlert, Sparkles } from 'lucide-react';
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
    <div className="flex h-full flex-col overflow-hidden text-[#EEF3FA]">
      <div className="flex-shrink-0 border-b border-[rgba(46,127,255,0.12)] px-5 py-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#A78BFA]">
              <BrainCircuit size={13} />
              ProjectCommand / {activeTitle}
            </div>
            <h3 className="text-sm font-bold text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {project.name}
            </h3>
            <p className="mt-1 text-[11px] text-[#7A94B4]">
              {project.developer} - {project.type} - {project.location} - AED {Math.round(project.contractValue / 1_000_000)}M - {project.completion}% complete
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-violet-400/25 bg-violet-400/10 px-3 py-1.5 text-[10px] font-bold text-violet-200">
              <Sparkles size={13} /> AI Forecast Ready
            </span>
            <select className="h-8 rounded-lg border border-[rgba(46,127,255,0.22)] bg-[#0A1628] px-3 text-[11px] font-semibold text-[#B8C7DB] outline-none transition-colors focus:border-[#7C3AED]">
              <option>Danube Properties - Lawnz Residences</option>
              <option>Danube Properties - Bayz 102</option>
              <option>Reportage - Verdana Tower</option>
            </select>
            <button className="h-8 rounded-lg border border-[#7C3AED]/45 bg-[#7C3AED] px-3 text-[11px] font-bold text-white shadow-lg shadow-violet-900/20 transition-colors hover:bg-[#6D28D9]">
              Run AI Forecast
            </button>
          </div>
        </div>

        <div className="no-scrollbar mt-4 flex gap-1 overflow-x-auto pb-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = tab.id === screen;
            return (
              <button
                key={tab.id}
                onClick={() => goTo(tab.id)}
                className={`flex flex-shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-bold transition-colors ${
                  active
                    ? 'border-[#7C3AED]/40 bg-[#7C3AED]/15 text-[#C4B5FD]'
                    : 'border-transparent text-[#7A94B4] hover:border-[rgba(46,127,255,0.18)] hover:bg-white/5 hover:text-[#EEF3FA]'
                }`}
              >
                <Icon size={13} />
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
