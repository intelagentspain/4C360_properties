import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CommunityMap } from './CommunityMap';
import { IntegrationBanner } from './IntegrationBanner';
import { KPIPanel } from './KPIPanel';
import { PPMRiskPanel } from './PPMRiskPanel';
import type { PPMRiskPayload } from './PPMRiskPanel';
import { DispatchQueue } from './DispatchQueue';
import { CommandBar, AutomationMode } from './CommandBar';
import { LivePulseFeed } from './LivePulseFeed';
import { AIInsightsPanel } from './AIInsightsPanel';
import { SmartDispatchPanel } from './SmartDispatchPanel';
import { DataSources } from './DataSources';
import { Benchmark } from './Benchmark';
import { VendorIntelligence } from './VendorIntelligence';
import { Replay } from './Replay';
import { Incidents } from './Incidents';
import { Tasks } from './Tasks';
import { PPMSchedule } from './PPMSchedule';
import { AICapture } from './AICapture';
import { DispatchAIRules } from './DispatchAIRules';
import { initialDispatchSettings, type DispatchSettings } from '@/data/dispatchSettings';
import { ManageClients } from './ManageClients';
import { AssetsSettings } from './AssetsSettings';
import { RolesSettings } from './RolesSettings';
import { RulesSettings } from './RulesSettings';
import { AllClients } from './AllClients';
import { Team } from './Team';
import type { StrategicPage } from '@/App';
import type { ToastFn } from '@/lib/ui';

interface Props {
  onToast: ToastFn;
  page: StrategicPage;
  onClientSelect: (clientId: string) => void;
  selectedClientId: string | null;
  onNavigateToIncidents: (clientId: string) => void;
  onNavigateToCommand: (clientId: string, clientName?: string) => void;
  incidentsClientId?: string;
  onNavigateToIncident?: (incidentId: string) => void;
  initialIncidentId?: string;
  onInitialIncidentHandled?: () => void;
  onNavigateToTasks: (risk: PPMRiskPayload) => void;
  onMarkPPMCreated: (risk: PPMRiskPayload) => void;
  ppmCreatedTasks: Record<string, PPMRiskPayload>;
  prefilledTask?: PPMRiskPayload | null;
  onPrefilledTaskConsumed?: () => void;
}

function Dashboard({ onToast, selectedClientId, onNavigateToIncident, onNavigateToTasks, onMarkPPMCreated, ppmCreatedTasks }: {
  onToast: ToastFn;
  selectedClientId: string | null;
  onNavigateToIncident?: (incidentId: string) => void;
  onNavigateToTasks: (risk: PPMRiskPayload) => void;
  onMarkPPMCreated: (risk: PPMRiskPayload) => void;
  ppmCreatedTasks: Record<string, PPMRiskPayload>;
}) {
  const [mode, setMode] = useState<AutomationMode>('hybrid');
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <CommandBar mode={mode} onModeChange={setMode} onToast={onToast} />
      <IntegrationBanner />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-[62] flex flex-col p-3 pr-1.5 overflow-hidden gap-2">
          <div className="flex-[65] overflow-hidden">
            <CommunityMap onToast={onToast} selectedClientId={selectedClientId} />
          </div>
          <div className="flex-[35] bg-[rgba(17,32,64,0.85)] border border-[rgba(46,127,255,0.22)] rounded-xl overflow-hidden">
            <LivePulseFeed onToast={onToast} />
          </div>
        </div>
        <div className="flex-[38] p-3 pl-1.5 overflow-y-auto custom-scrollbar">
          <KPIPanel onToast={onToast} onNavigateToIncident={onNavigateToIncident} />
          <SmartDispatchPanel onToast={onToast} />
          <AIInsightsPanel onToast={onToast} />
          <PPMRiskPanel
            onNavigateToWorkOrders={onNavigateToTasks}
            createdTasks={ppmCreatedTasks}
            onMarkCreated={onMarkPPMCreated}
          />
          <DispatchQueue onToast={onToast} />
        </div>
      </div>
    </div>
  );
}

type SettingsTab = 'dispatch' | 'clients' | 'assets' | 'roles' | 'rules';

function SettingsPage({ onToast, dispatchSettings, setDispatchSettings }: { onToast: ToastFn; dispatchSettings: DispatchSettings; setDispatchSettings: (s: DispatchSettings) => void }) {
  const [tab, setTab] = useState<SettingsTab>('dispatch');
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 px-6 pt-5 pb-0 border-b border-[rgba(46,127,255,0.12)]">
        <div className="flex gap-1">
          {([
            { id: 'dispatch', label: 'AI Dispatch Rules' },
            { id: 'clients',  label: 'Manage Clients'   },
            { id: 'assets',   label: 'Assets'           },
            { id: 'roles',    label: 'Roles'            },
            { id: 'rules',    label: 'Rules'            },
          ] as { id: SettingsTab; label: string }[]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-[12px] font-semibold rounded-t-lg border-b-2 transition-colors ${
                tab === t.id
                  ? 'text-[#2E7FFF] border-[#2E7FFF] bg-[rgba(46,127,255,0.06)]'
                  : 'text-[#7A94B4] border-transparent hover:text-[#EEF3FA]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {tab === 'dispatch' && (
          <DispatchAIRules onToast={onToast} settings={dispatchSettings} setSettings={setDispatchSettings} />
        )}
        {tab === 'clients' && (
          <ManageClients onToast={onToast} />
        )}
        {tab === 'assets' && (
          <AssetsSettings onToast={onToast} />
        )}
        {tab === 'roles' && (
          <RolesSettings onToast={onToast} />
        )}
        {tab === 'rules' && (
          <RulesSettings onToast={onToast} />
        )}
      </div>
    </div>
  );
}

export function StrategicView({ onToast, page, onClientSelect, selectedClientId, onNavigateToIncidents, onNavigateToCommand, incidentsClientId, onNavigateToIncident, initialIncidentId, onInitialIncidentHandled, onNavigateToTasks, onMarkPPMCreated, ppmCreatedTasks, prefilledTask, onPrefilledTaskConsumed }: Props) {
  const [dispatchSettings, setDispatchSettings] = useState<DispatchSettings>(initialDispatchSettings);

  const motionKey = page === 'incidents' && incidentsClientId ? `incidents-${incidentsClientId}` : page;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={motionKey}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18 }}
        className="absolute inset-0 flex flex-col"
      >
        {page === 'dashboard'   && <Dashboard     onToast={onToast} selectedClientId={selectedClientId} onNavigateToIncident={onNavigateToIncident} onNavigateToTasks={onNavigateToTasks} onMarkPPMCreated={onMarkPPMCreated} ppmCreatedTasks={ppmCreatedTasks} />}
        {page === 'datasources' && <DataSources   onToast={onToast} />}
        {page === 'vendorintelligence' && <VendorIntelligence onToast={onToast} />}
        {page === 'benchmark'   && <Benchmark     onToast={onToast} />}
        {page === 'replay'      && <Replay        onToast={onToast} />}
        {page === 'incidents'   && <Incidents     onToast={onToast} initialClientId={incidentsClientId} initialIncidentId={initialIncidentId} onInitialIncidentHandled={onInitialIncidentHandled} />}
        {page === 'tasks'       && <Tasks         onToast={onToast} prefilledTask={prefilledTask} onPrefilledTaskConsumed={onPrefilledTaskConsumed} />}
        {page === 'ppmschedule' && <PPMSchedule   onToast={onToast} />}
        {page === 'aicapture'   && <AICapture     onToast={onToast} />}
        {page === 'settings'    && (
          <SettingsPage
            onToast={onToast}
            dispatchSettings={dispatchSettings}
            setDispatchSettings={setDispatchSettings}
          />
        )}
        {page === 'allclients'  && <AllClients    onToast={onToast} onClientSelect={onClientSelect} onNavigateToIncidents={onNavigateToIncidents} onNavigateToCommand={onNavigateToCommand} />}
        {page === 'team'        && <Team          onToast={onToast} />}
      </motion.div>
    </AnimatePresence>
  );
}
