import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TopBar } from '@/components/layout/TopBar';
import { Sidebar } from '@/components/layout/Sidebar';
import { StrategicView } from '@/components/strategic/StrategicView';
import { OperationalView } from '@/components/operational/OperationalView';
import { ClientView } from '@/components/client/ClientView';
import { MemberDashboardView } from '@/components/MemberDashboardView';
import { HospitalityClientView } from '@/components/client/hospitality/HospitalityClientView';
import { ToastContainer } from '@/components/shared/ToastContainer';
import { CopilotAvatar } from '@/components/CopilotAvatar';
import { useToast } from '@/hooks/useToast';
import { useMemberProfiles } from '@/context/MemberProfilesContext';
import type { MockMemberProfile } from '@/data/mockData';
import type { PPMRiskPayload } from '@/components/strategic/PPMRiskPanel';

export type Perspective = 'strategic' | 'operational' | 'client';
export type StrategicPage = 'dashboard' | 'datasources' | 'benchmark' | 'replay' | 'incidents' | 'tasks' | 'ppmschedule' | 'aicapture' | 'settings' | 'allclients' | 'team';

function getMemberIdFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('member');
}

function isResidentDomain(): boolean {
  return window.location.hostname.includes('resident');
}

function makeResidentProfile(id = 'resident-portal'): MockMemberProfile {
  return {
    id,
    name: 'Resident',
    perspective: 'Client',
    role: 'End Client',
    email: '',
    assignedClients: [],
    zones: [],
    skills: '',
    responsibilities: '',
  } as MockMemberProfile;
}

const PERSP_MAP: Record<string, Perspective> = {
  Strategic: 'strategic',
  Operational: 'operational',
  Client: 'client',
};

function App() {
  const { getById }                          = useMemberProfiles();
  const [perspective,    setPerspective]     = useState<Perspective>('strategic');
  const [strategicPage,  setStrategicPage]   = useState<StrategicPage>('allclients');
  const { toasts, addToast, removeToast }    = useToast();
  // On resident.4cgrc.com (or any hostname containing "resident"), open the
  // resident portal directly — no ?member= param required.
  const [activeMember, setActiveMember]      = useState<MockMemberProfile | null>(
    isResidentDomain() && !getMemberIdFromUrl() ? makeResidentProfile() : null
  );
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [incidentsClientId, setIncidentsClientId] = useState<string | undefined>(undefined);
  const [initialIncidentId, setInitialIncidentId] = useState<string | undefined>(undefined);
  const [prefilledTask, setPrefilledTask] = useState<PPMRiskPayload | null>(null);
  const [ppmCreatedTasks, setPpmCreatedTasks] = useState<Record<string, PPMRiskPayload>>({});
  const [commandClientId, setCommandClientId] = useState<string | null>(null);
  const [commandClientName, setCommandClientName] = useState<string | null>(null);

  useEffect(() => {
    const memberId = getMemberIdFromUrl();
    if (!memberId) return;
    const member = getById(memberId);
    if (member) {
      setActiveMember(member);
      setPerspective(PERSP_MAP[member.perspective] ?? 'strategic');
      setTimeout(() => addToast(`Welcome, ${member.name} — personalized dashboard loaded`, 'success'), 400);
    } else {
      // Member not found in profiles store (e.g. ec-xxxx invite token or short ID).
      // Any external ?member= link is an end-client portal link — open the resident portal.
      setActiveMember(makeResidentProfile(memberId));
      setPerspective('client');
    }
  }, []);

  const handleSetPerspective = (p: Perspective) => {
    setPerspective(p);
    if (p === 'strategic') setStrategicPage('allclients');
  };

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    setStrategicPage('dashboard');
  };

  const handleNavigateToIncidents = (clientId: string) => {
    setInitialIncidentId(undefined);
    setIncidentsClientId(clientId);
    setStrategicPage('incidents');
  };

  const handleNavigateToIncident = (incidentId: string) => {
    setInitialIncidentId(incidentId);
    setIncidentsClientId(undefined);
    setStrategicPage('incidents');
  };

  const handleNavigateToCommand = (clientId: string, clientName?: string) => {
    setCommandClientId(clientId);
    setCommandClientName(clientName ?? null);
  };

  const handleNavigateToTasks = (risk: PPMRiskPayload) => {
    setPrefilledTask(risk);
    setStrategicPage('tasks');
  };

  const handleMarkPPMCreated = (risk: PPMRiskPayload) => {
    setPpmCreatedTasks(prev => ({ ...prev, [risk.id]: risk }));
  };

  const handleDismissMemberView = () => {
    setActiveMember(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('member');
    window.history.replaceState({}, '', url.toString());
  };

  const handleDismissCommandView = () => {
    setCommandClientId(null);
    setCommandClientName(null);
  };

  if (commandClientId) {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ background: '#0A1628', borderBottom: '1px solid rgba(46,127,255,0.15)' }}>
          <button
            onClick={handleDismissCommandView}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{ background: 'rgba(46,127,255,0.1)', color: '#7EB8F7' }}
          >
            ← Back to All Clients
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <HospitalityClientView
            onToast={addToast}
            propertyName={commandClientName ?? undefined}
          />
        </div>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    );
  }

  if (activeMember && activeMember.perspective === 'Client') {
    const memberToken = getMemberIdFromUrl() ?? activeMember.id;
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <HospitalityClientView
            onToast={addToast}
            guestName={activeMember.name}
            propertyName={activeMember.propertyName ?? activeMember.assignedClients[0]}
            memberToken={memberToken}
            clientId="CLT-001"
            siteId="silicon-oasis"
          />
        </div>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#0A1628] overflow-hidden">
      <TopBar perspective={perspective} setPerspective={handleSetPerspective} />
      <div className="flex flex-1 overflow-hidden">
        {activeMember ? (
          <main className="flex-1 overflow-hidden relative">
            <MemberDashboardView
              member={activeMember}
              onToast={addToast}
              onDismiss={handleDismissMemberView}
            />
          </main>
        ) : (
          <>
            <Sidebar
              perspective={perspective}
              strategicPage={strategicPage}
              onStrategicPageChange={page => { if (page === 'incidents') { setIncidentsClientId(undefined); setInitialIncidentId(undefined); } setStrategicPage(page); }}
              onToast={msg => addToast(msg, 'info')}
            />
            <main className="flex-1 overflow-hidden relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={perspective}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="absolute inset-0 flex flex-col"
                >
                  {perspective === 'strategic'  && <StrategicView onToast={addToast} page={strategicPage} onClientSelect={handleClientSelect} selectedClientId={selectedClientId} onNavigateToIncidents={handleNavigateToIncidents} onNavigateToCommand={handleNavigateToCommand} incidentsClientId={incidentsClientId} onNavigateToIncident={handleNavigateToIncident} initialIncidentId={initialIncidentId} onInitialIncidentHandled={() => setInitialIncidentId(undefined)} onNavigateToTasks={handleNavigateToTasks} onMarkPPMCreated={handleMarkPPMCreated} ppmCreatedTasks={ppmCreatedTasks} prefilledTask={prefilledTask} onPrefilledTaskConsumed={() => setPrefilledTask(null)} />}
                  {perspective === 'operational' && <OperationalView onToast={addToast} />}
                  {perspective === 'client'      && <ClientView onToast={addToast} />}
                </motion.div>
              </AnimatePresence>
            </main>
          </>
        )}
      </div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <CopilotAvatar />
    </div>
  );
}

export default App;
