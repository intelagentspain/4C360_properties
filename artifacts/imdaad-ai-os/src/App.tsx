import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TopBar } from '@/components/layout/TopBar';
import { Sidebar } from '@/components/layout/Sidebar';
import { StrategicView } from '@/components/strategic/StrategicView';
import { OperationalView } from '@/components/operational/OperationalView';
import { ClientView } from '@/components/client/ClientView';
import { MemberDashboardView } from '@/components/MemberDashboardView';
import { ToastContainer } from '@/components/shared/ToastContainer';
import { useToast } from '@/hooks/useToast';
import { useMemberProfiles } from '@/context/MemberProfilesContext';
import type { MockMemberProfile } from '@/data/mockData';

export type Perspective = 'strategic' | 'operational' | 'client';
export type StrategicPage = 'dashboard' | 'datasources' | 'benchmark' | 'replay' | 'incidents' | 'tasks' | 'ppmschedule' | 'aicapture' | 'settings' | 'allclients' | 'team';

function getMemberIdFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('member');
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
  const [activeMember,   setActiveMember]    = useState<MockMemberProfile | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  useEffect(() => {
    const memberId = getMemberIdFromUrl();
    if (!memberId) return;
    const member = getById(memberId);
    if (member) {
      setActiveMember(member);
      setPerspective(PERSP_MAP[member.perspective] ?? 'strategic');
      setTimeout(() => addToast(`Welcome, ${member.name} — personalized dashboard loaded`, 'success'), 400);
    } else {
      const url = new URL(window.location.href);
      url.searchParams.delete('member');
      window.history.replaceState({}, '', url.toString());
      setTimeout(() => addToast('Member profile not found — showing default dashboard', 'warning'), 400);
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

  const handleDismissMemberView = () => {
    setActiveMember(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('member');
    window.history.replaceState({}, '', url.toString());
  };

  if (activeMember) {
    return (
      <div className="flex flex-col h-screen bg-[#0A1628] overflow-hidden">
        <TopBar perspective={perspective} setPerspective={handleSetPerspective} />
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-hidden relative">
            <MemberDashboardView
              member={activeMember}
              onToast={addToast}
              onDismiss={handleDismissMemberView}
            />
          </main>
        </div>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#0A1628] overflow-hidden">
      <TopBar perspective={perspective} setPerspective={handleSetPerspective} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          perspective={perspective}
          strategicPage={strategicPage}
          onStrategicPageChange={setStrategicPage}
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
              {perspective === 'strategic'  && <StrategicView onToast={addToast} page={strategicPage} onClientSelect={handleClientSelect} selectedClientId={selectedClientId} />}
              {perspective === 'operational' && <OperationalView onToast={addToast} />}
              {perspective === 'client'      && <ClientView onToast={addToast} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

export default App;
