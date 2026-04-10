import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TopBar } from '@/components/layout/TopBar';
import { Sidebar } from '@/components/layout/Sidebar';
import { StrategicView } from '@/components/strategic/StrategicView';
import { OperationalView } from '@/components/operational/OperationalView';
import { ClientView } from '@/components/client/ClientView';
import { ToastContainer } from '@/components/shared/ToastContainer';
import { useToast } from '@/hooks/useToast';

export type Perspective = 'strategic' | 'operational' | 'client';
export type StrategicPage = 'dashboard' | 'datasources' | 'benchmark' | 'replay' | 'incidents' | 'tasks' | 'ppmschedule' | 'aicapture' | 'settings';

function App() {
  const [perspective,    setPerspective]    = useState<Perspective>('strategic');
  const [strategicPage,  setStrategicPage]  = useState<StrategicPage>('dashboard');
  const { toasts, addToast, removeToast }   = useToast();

  const handleSetPerspective = (p: Perspective) => {
    setPerspective(p);
    if (p === 'strategic') setStrategicPage('dashboard');
  };

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
              {perspective === 'strategic'  && <StrategicView onToast={addToast} page={strategicPage} />}
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
