import { useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import { AnimatePresence } from 'framer-motion';
import { BarChart3, BrainCircuit, Building2, CalendarRange, FileText, FolderOpen, Plus, ShieldAlert, Target } from 'lucide-react';
import type { ProjectCommandProjectId, ProjectCommandPropertyId } from './data/portfolio';
import { AddProjectModal } from './components/AddProjectModal';
import { CommandCenter } from './screens/CommandCenter';
import { Programme } from './screens/Programme';
import { StageGates } from './screens/StageGates';
import { CostIntelligence } from './screens/CostIntelligence';
import { RiskCommand } from './screens/RiskCommand';
import { ObligationsRegister } from './screens/ObligationsRegister';
import { EvidenceRepository } from './screens/EvidenceRepository';
import { AIForecast } from './screens/AIForecast';
import { addProjectCommandDataset, setProjectCommandState } from './state/projectCommandStore';
import type { ProjectCommandScreen } from './types';
import { useProjectCommandProjectOptions, useProjectCommandPropertyOptions, useSelectedProjectCommandData } from './useProjectCommandData';

const tabs: { id: ProjectCommandScreen; label: string; icon: ComponentType<{ size?: number }> }[] = [
  { id: 'overview', label: 'Overview', icon: Building2 },
  { id: 'programme', label: 'Programme', icon: CalendarRange },
  { id: 'stagegates', label: 'Stage Gates', icon: Target },
  { id: 'cost', label: 'Cost', icon: BarChart3 },
  { id: 'risk', label: 'Risk', icon: ShieldAlert },
  { id: 'obligations', label: 'Obligations', icon: FileText },
  { id: 'evidence', label: 'Evidence', icon: FolderOpen },
  { id: 'forecast', label: 'AI Forecast', icon: BrainCircuit },
];

function screenFromPath(): ProjectCommandScreen {
  const match = window.location.pathname.match(/\/projectcommand\/([^/]+)/);
  const value = match?.[1] as ProjectCommandScreen | undefined;
  const resolved = tabs.find(tab => tab.id === value)?.id;
  if (!resolved && window.location.pathname !== '/projectcommand/overview') {
    window.history.replaceState({}, '', '/projectcommand/overview');
  }
  return resolved ?? 'overview';
}

export function ProjectCommand({ onToast }: { onToast?: (message: string, type?: 'success' | 'warning' | 'error' | 'info') => void }) {
  const [screen, setScreen] = useState<ProjectCommandScreen>(screenFromPath);
  const [addProjectOpen, setAddProjectOpen] = useState(false);
  const selectedDataset = useSelectedProjectCommandData();
  const { organization, portfolio, property, project } = selectedDataset;
  const propertyOptions = useProjectCommandPropertyOptions();
  const allProjectOptions = useProjectCommandProjectOptions();
  const projectOptions = useProjectCommandProjectOptions(property.id);

  const goTo = (next: ProjectCommandScreen) => {
    setScreen(next);
    const nextPath = `/projectcommand/${next}`;
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }
  };

  const activeTitle = useMemo(() => tabs.find(tab => tab.id === screen)?.label ?? 'Overview', [screen]);

  const switchProject = (projectId: ProjectCommandProjectId) => {
    const nextProject = allProjectOptions.find(option => option.id === projectId);
    setProjectCommandState({
      selectedProjectId: projectId,
      selectedPropertyId: nextProject?.propertyId ?? property.id,
      activeScenario: 'base',
      selectedRisk: null,
      selectedPhaseId: null,
    });
  };

  const switchProperty = (propertyId: ProjectCommandPropertyId) => {
    const nextProject = allProjectOptions.find(option => option.propertyId === propertyId);
    setProjectCommandState({
      selectedPropertyId: propertyId,
      selectedProjectId: nextProject?.id ?? project.id,
      activeScenario: 'base',
      selectedRisk: null,
      selectedPhaseId: null,
    });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden text-[#EEF3FA]">
      <div className="flex-shrink-0 border-b border-[rgba(46,127,255,0.12)] bg-[#07111F]/35 px-5 py-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#A78BFA]">
              <BrainCircuit size={13} />
              ProjectCommand / {activeTitle}
            </div>
            <h3 className="text-sm font-bold text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {property.name} - {project.name}
            </h3>
            <p className="mt-1 text-[11px] text-[#7A94B4]">
              {organization.name} {'>'} {portfolio.name} {'>'} {property.name} {'>'} {project.name}
            </p>
            <p className="mt-1 text-[11px] text-[#7A94B4]">
              {project.projectType} - {property.type} - {property.location} - AED {Math.round(project.contractValue / 1_000_000)}M project budget - {project.completion}% complete
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={property.id}
              onChange={event => switchProperty(event.target.value as ProjectCommandPropertyId)}
              className="h-8 min-w-[230px] rounded-lg border border-[rgba(46,127,255,0.22)] bg-[#0A1628] px-3 text-[11px] font-semibold text-[#B8C7DB] outline-none transition-colors focus:border-[#7C3AED]"
            >
              {propertyOptions.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
            </select>
            <select
              value={selectedDataset.id}
              onChange={event => switchProject(event.target.value as ProjectCommandProjectId)}
              className="h-8 min-w-[230px] rounded-lg border border-[rgba(46,127,255,0.22)] bg-[#0A1628] px-3 text-[11px] font-semibold text-[#B8C7DB] outline-none transition-colors focus:border-[#7C3AED]"
            >
              {projectOptions.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
            </select>
            <button onClick={() => setAddProjectOpen(true)} className="flex h-8 items-center gap-1.5 rounded-lg border border-[#7C3AED]/45 bg-[#7C3AED] px-3 text-[11px] font-bold text-white shadow-lg shadow-violet-900/20 transition-colors hover:bg-[#6D28D9]">
              <Plus size={13} />
              Add Project
            </button>
          </div>
        </div>

        <div className="no-scrollbar mt-4 flex gap-1.5 overflow-x-auto pb-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = tab.id === screen;
            return (
              <button
                key={tab.id}
                onClick={() => goTo(tab.id)}
                className={`flex h-9 flex-shrink-0 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-bold transition-all ${
                  active
                    ? 'border-[#7C3AED]/45 bg-[#7C3AED]/18 text-[#DDD6FE] shadow-[0_0_18px_rgba(124,58,237,0.14)]'
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
        {screen === 'stagegates' && <StageGates onToast={onToast} />}
        {screen === 'cost' && <CostIntelligence />}
        {screen === 'risk' && <RiskCommand />}
        {screen === 'obligations' && <ObligationsRegister onToast={onToast} />}
        {screen === 'evidence' && <EvidenceRepository onToast={onToast} />}
        {screen === 'forecast' && <AIForecast />}
      </div>

      <AnimatePresence>
        {addProjectOpen && (
          <AddProjectModal
            onClose={() => setAddProjectOpen(false)}
            onToast={onToast}
            onCreate={dataset => {
              addProjectCommandDataset(dataset);
              goTo('overview');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default ProjectCommand;
