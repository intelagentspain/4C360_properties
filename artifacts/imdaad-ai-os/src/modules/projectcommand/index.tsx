import { useEffect, useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import { AnimatePresence } from 'framer-motion';
import { BarChart3, BrainCircuit, Building2, CalendarRange, FileText, FolderOpen, Plus, ShieldAlert, Target } from 'lucide-react';
import { AddProjectModal } from './components/AddProjectModal';
import { ProjectCommandCopilotButton } from './components/ProjectCommandCopilot';
import { CommandCenter } from './screens/CommandCenter';
import { Programme } from './screens/Programme';
import { StageGates } from './screens/StageGates';
import { CostIntelligence } from './screens/CostIntelligence';
import { RiskCommand } from './screens/RiskCommand';
import { ObligationsRegister } from './screens/ObligationsRegister';
import { EvidenceRepository } from './screens/EvidenceRepository';
import { AIForecast } from './screens/AIForecast';
import { addProjectCommandDataset, hydrateProjectCommandEvents, setProjectCommandState } from './state/projectCommandStore';
import type { ProjectCommandScreen } from './types';
import {
  useProjectCommandProjectOptions,
  useProjectCommandPropertyOptions,
  useSelectedProjectCommandData,
} from './useProjectCommandData';

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

const tabDemoAnchors: Partial<Record<ProjectCommandScreen, string>> = {
  overview: 'overview-control-tab',
  programme: 'programme-control-tab',
  stagegates: 'stage-gates-control-tab',
  cost: 'cost-control-tab',
  risk: 'risk-control-tab',
  forecast: 'forecast-control-tab',
  obligations: 'obligations-control-tab',
  evidence: 'evidence-control-tab',
};

const PROJECTCOMMAND_HANDOVER_SELECTION_MS = 8_800;
const PROJECTCOMMAND_HEARTLAND_SELECTION_MS = 6_600;

function demoScreenFromTimeline(elapsedMs?: number): ProjectCommandScreen | null {
  if (elapsedMs === undefined) return null;
  if (elapsedMs >= 96_000) return 'forecast';
  if (elapsedMs >= 80_000) return 'evidence';
  if (elapsedMs >= 74_000) return 'obligations';
  if (elapsedMs >= 68_000) return 'risk';
  if (elapsedMs >= 65_000) return 'cost';
  if (elapsedMs >= 59_000) return 'stagegates';
  if (elapsedMs >= 53_000) return 'programme';
  return 'overview';
}

function screenFromPath(): ProjectCommandScreen {
  const match = window.location.pathname.match(/\/projectcommand\/([^/]+)/);
  const value = match?.[1] as ProjectCommandScreen | undefined;
  const resolved = tabs.find(tab => tab.id === value)?.id;
  if (!resolved && window.location.pathname !== '/projectcommand/overview') {
    window.history.replaceState({}, '', '/projectcommand/overview');
  }
  return resolved ?? 'overview';
}

export function ProjectCommand({
  onToast,
  onOpenVendorIQ,
  initialScreen,
  demoMode = false,
  demoTimelineMs,
  demoChapterId,
  demoActionRequest,
}: {
  onToast?: (message: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
  onOpenVendorIQ?: () => void;
  initialScreen?: ProjectCommandScreen;
  demoMode?: boolean;
  demoTimelineMs?: number;
  demoChapterId?: string;
  demoActionRequest?: { actionId: string; nonce: number } | null;
}) {
  const [screen, setScreen] = useState<ProjectCommandScreen>(() => initialScreen ?? screenFromPath());
  const [addProjectOpen, setAddProjectOpen] = useState(false);
  const selectedDataset = useSelectedProjectCommandData();
  const { organization, portfolio, property, project } = selectedDataset;
  const propertyOptions = useProjectCommandPropertyOptions();
  const projectOptions = useProjectCommandProjectOptions(property.id);
  const allProjectOptions = useProjectCommandProjectOptions();
  const demoSobhaMainProject = allProjectOptions.find(option => (
    option.propertyName === 'Sobha Pilot Tower' && option.label === 'Main Construction'
  ));
  const demoSobhaHartlandProject = allProjectOptions.find(option => (
    option.propertyName === 'Sobha Hartland Community' && option.label === 'Main Construction'
  ));
  const demoSobhaHandoverProject = allProjectOptions.find(option => (
    option.propertyName === 'Sobha Pilot Tower' && option.label === 'Handover & Snagging Programme'
  ));
  const resetProjectDetailState = useMemo(() => ({
    activeScenario: 'base' as const,
    selectedRisk: null,
    selectedPhaseId: null,
  }), []);

  const goTo = (next: ProjectCommandScreen) => {
    setScreen(next);
    const nextPath = `/projectcommand/${next}`;
    if (!demoMode && window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }
  };

  useEffect(() => {
    if (demoMode && demoChapterId === 'projectcommand' && demoTimelineMs !== undefined) return;
    if (initialScreen) setScreen(initialScreen);
  }, [demoChapterId, demoMode, demoTimelineMs, initialScreen]);

  useEffect(() => {
    if (!demoMode || demoChapterId !== 'projectcommand' || demoTimelineMs === undefined) return;
    const nextScreen = demoScreenFromTimeline(demoTimelineMs);
    if (nextScreen) setScreen(current => (current === nextScreen ? current : nextScreen));
  }, [demoChapterId, demoMode, demoTimelineMs]);

  useEffect(() => {
    if (!demoMode || demoChapterId !== 'projectcommand' || demoTimelineMs === undefined) return;
    const targetProject = demoTimelineMs >= PROJECTCOMMAND_HANDOVER_SELECTION_MS
      ? demoSobhaHandoverProject
      : demoTimelineMs >= PROJECTCOMMAND_HEARTLAND_SELECTION_MS
      ? demoSobhaHartlandProject
      : demoSobhaMainProject;
    if (!targetProject || project.id === targetProject.id) return;

    setProjectCommandState({
      selectedPropertyId: targetProject.propertyId,
      selectedProjectId: targetProject.id,
      ...resetProjectDetailState,
    });
  }, [demoChapterId, demoMode, demoSobhaHandoverProject, demoSobhaHartlandProject, demoSobhaMainProject, demoTimelineMs, project.id, resetProjectDetailState]);

  useEffect(() => {
    if (!demoMode || demoChapterId !== 'programme' || !demoSobhaMainProject) return;
    if (project.id === demoSobhaMainProject.id) return;

    setProjectCommandState({
      selectedPropertyId: demoSobhaMainProject.propertyId,
      selectedProjectId: demoSobhaMainProject.id,
      ...resetProjectDetailState,
    });
  }, [demoChapterId, demoMode, demoSobhaMainProject, project.id, resetProjectDetailState]);

  const activeTitle = useMemo(() => tabs.find(tab => tab.id === screen)?.label ?? 'Overview', [screen]);
  const projectCommandSelectionStep = demoMode && demoChapterId === 'projectcommand' && typeof demoTimelineMs === 'number'
    ? demoTimelineMs >= 2_800 && demoTimelineMs < 5_400
      ? 'property'
      : demoTimelineMs >= 5_400 && demoTimelineMs < PROJECTCOMMAND_HANDOVER_SELECTION_MS
      ? 'project'
      : null
    : null;

  const handlePropertyChange = (propertyId: string) => {
    const nextProject = allProjectOptions.find(option => option.propertyId === propertyId);
    if (!nextProject) return;

    setProjectCommandState({
      selectedPropertyId: propertyId,
      selectedProjectId: nextProject.id,
      ...resetProjectDetailState,
    });
    onToast?.(`Switched to ${nextProject.propertyName} - ${nextProject.label}`, 'info');
  };

  const handleProjectChange = (projectId: string) => {
    const nextProject = allProjectOptions.find(option => option.id === projectId);
    if (!nextProject) return;

    setProjectCommandState({
      selectedPropertyId: nextProject.propertyId,
      selectedProjectId: nextProject.id,
      ...resetProjectDetailState,
    });
    onToast?.(`Switched to ${nextProject.propertyName} - ${nextProject.label}`, 'info');
  };

  useEffect(() => {
    void hydrateProjectCommandEvents(selectedDataset.id);
  }, [selectedDataset.id]);

  return (
    <div className="flex h-full flex-col overflow-hidden text-[#EEF3FA]" data-demo-anchor="projectcommand-shell">
      <div className="flex-shrink-0 border-b border-[rgba(46,127,255,0.12)] bg-[#07111F]/35 px-5 py-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div data-demo-anchor="projectcommand-context">
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

          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
            {screen !== 'stagegates' && (
              <>
                <label className="sr-only" htmlFor="projectcommand-property-select">Property</label>
                <div className="relative" data-demo-anchor="projectcommand-property-dropdown">
                  <select
                    id="projectcommand-property-select"
                    value={property.id}
                    onChange={event => handlePropertyChange(event.target.value)}
                    className={`h-9 min-w-[220px] rounded-lg border bg-[#07111F] px-3 text-[12px] font-bold text-[#DDE6F8] outline-none transition-all hover:border-[#2E7FFF]/55 focus:border-[#7C3AED]/70 ${
                      projectCommandSelectionStep === 'property'
                        ? 'border-cyan-300/75 shadow-[0_0_24px_rgba(34,211,238,0.25)]'
                        : 'border-[rgba(46,127,255,0.28)]'
                    }`}
                  >
                    {propertyOptions.map(option => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </select>
                  {projectCommandSelectionStep === 'property' && (
                    <div className="pointer-events-none absolute left-0 top-[calc(100%+4px)] z-50 w-full overflow-hidden rounded-lg border border-[#2E7FFF]/45 bg-[#07111F] py-1 shadow-2xl shadow-black/40">
                      {propertyOptions.slice(0, 3).map((option) => (
                        <div
                          key={option.id}
                          className={`px-3 py-2 text-[12px] font-bold ${
                            option.label === 'Sobha Hartland Community' ? 'bg-[#2E7FFF] text-white' : 'text-[#DDE6F8]'
                          }`}
                        >
                          {option.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <label className="sr-only" htmlFor="projectcommand-project-select">Project</label>
                <div className="relative" data-demo-anchor="projectcommand-project-dropdown">
                  <select
                    id="projectcommand-project-select"
                    value={project.id}
                    onChange={event => handleProjectChange(event.target.value)}
                    className={`h-9 min-w-[240px] rounded-lg border bg-[#07111F] px-3 text-[12px] font-bold text-[#DDE6F8] outline-none transition-all hover:border-[#2E7FFF]/55 focus:border-[#7C3AED]/70 ${
                      projectCommandSelectionStep === 'project'
                        ? 'border-cyan-300/75 shadow-[0_0_24px_rgba(34,211,238,0.25)]'
                        : 'border-[rgba(46,127,255,0.28)]'
                    }`}
                  >
                    {projectOptions.map(option => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </select>
                  {projectCommandSelectionStep === 'project' && (
                    <div className="pointer-events-none absolute left-0 top-[calc(100%+4px)] z-50 w-full overflow-hidden rounded-lg border border-[#2E7FFF]/45 bg-[#07111F] py-1 shadow-2xl shadow-black/40">
                      {(projectCommandSelectionStep === 'project' && demoSobhaHandoverProject
                        ? [
                            { id: project.id, label: project.name },
                            { id: demoSobhaHandoverProject.id, label: demoSobhaHandoverProject.label },
                          ]
                        : projectOptions.slice(0, 3)
                      ).map((option) => (
                        <div
                          key={option.id}
                          className={`px-3 py-2 text-[12px] font-bold ${
                            option.label === 'Handover & Snagging Programme' ? 'bg-[#2E7FFF] text-white' : 'text-[#DDE6F8]'
                          }`}
                        >
                          {option.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
            <button onClick={() => setAddProjectOpen(true)} className="flex h-8 items-center gap-1.5 rounded-lg border border-[#7C3AED]/45 bg-[#7C3AED] px-3 text-[11px] font-bold text-white shadow-lg shadow-violet-900/20 transition-colors hover:bg-[#6D28D9]">
              <Plus size={13} />
              Add Project
            </button>
          </div>
        </div>

        <div className="no-scrollbar mt-4 flex gap-1.5 overflow-x-auto pb-1" data-demo-anchor="projectcommand-tabs">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = tab.id === screen;
            return (
              <button
                key={tab.id}
                onClick={() => goTo(tab.id)}
                data-demo-action={`projectcommand-tab-${tab.id}`}
                data-demo-anchor={tabDemoAnchors[tab.id]}
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
        {screen === 'overview' && (
          <CommandCenter
            goTo={goTo}
            onToast={onToast}
            onOpenVendorIQ={onOpenVendorIQ}
            demoTimelineMs={demoMode && demoChapterId === 'projectcommand' ? demoTimelineMs : undefined}
          />
        )}
        {screen === 'programme' && (
          <Programme demoTimelineMs={demoMode && demoChapterId === 'programme' ? demoTimelineMs : undefined} />
        )}
        {screen === 'stagegates' && (
          <StageGates
            onToast={onToast}
            demoTimelineMs={demoMode && demoChapterId === 'stagegates' ? demoTimelineMs : undefined}
          />
        )}
        {screen === 'cost' && (
          <CostIntelligence
            demoTimelineMs={demoMode && demoChapterId === 'cost' ? demoTimelineMs : undefined}
            demoActionRequest={demoMode && demoChapterId === 'cost' ? demoActionRequest : null}
          />
        )}
        {screen === 'risk' && <RiskCommand />}
        {screen === 'obligations' && <ObligationsRegister onToast={onToast} />}
        {screen === 'evidence' && <EvidenceRepository onToast={onToast} />}
        {screen === 'forecast' && <AIForecast />}
      </div>

      {!demoMode && !addProjectOpen && <ProjectCommandCopilotButton screen={screen} onNavigate={goTo} />}

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
