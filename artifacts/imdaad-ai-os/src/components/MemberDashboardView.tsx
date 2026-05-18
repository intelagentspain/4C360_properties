import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Briefcase, Star, ExternalLink, X, ChevronRight, Building2, Zap } from 'lucide-react';
import type { MockMemberProfile } from '@/data/mockData';
import { StrategicView } from '@/components/strategic/StrategicView';
import { OperationalView } from '@/components/operational/OperationalView';
import { ClientView } from '@/components/client/ClientView';
import { HospitalityClientView } from '@/components/client/hospitality/HospitalityClientView';
import { MemberFilterProvider } from '@/context/MemberFilterContext';
import type { StrategicPage } from '@/App';
import type { ToastFn } from '@/lib/ui';

interface Props {
  member: MockMemberProfile;
  onToast: ToastFn;
  onDismiss: () => void;
}

const PERSPECTIVE_CONFIG = {
  Strategic: {
    label: 'Strategic',
    color: '#2E7FFF',
    bg: 'rgba(46,127,255,0.12)',
    border: 'rgba(46,127,255,0.3)',
    desc: 'Command-level panels · KPIs · AI dispatch · All assigned properties',
    icon: <Zap size={11} />,
  },
  Operational: {
    label: 'Operational',
    color: '#10B981',
    bg: 'rgba(16,185,129,0.12)',
    border: 'rgba(16,185,129,0.3)',
    desc: 'Field-oriented panels · Assigned tasks · Kanban · Smart scan',
    icon: <Briefcase size={11} />,
  },
  Client: {
    label: 'Client',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.3)',
    desc: 'Service request form · Live tracking · Service timeline',
    icon: <Building2 size={11} />,
  },
};

export function MemberDashboardView({ member, onToast, onDismiss }: Props) {
  const [strategicPage, setStrategicPage] = useState<StrategicPage>('dashboard');
  const [dismissed, setDismissed] = useState(false);

  const memberFilter = {
    memberId: member.id,
    assignedClients: member.assignedClients,
    zones: member.zones,
    perspective: member.perspective,
  };

  const pcfg = PERSPECTIVE_CONFIG[member.perspective];
  const responsibilities = member.responsibilities
    ? member.responsibilities.split('\n').filter(r => r.trim())
    : [];

  const handleDismiss = () => {
    setDismissed(true);
    setTimeout(onDismiss, 300);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <AnimatePresence>
        {!dismissed && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 bg-[#0D1E38] border-b border-[rgba(46,127,255,0.2)] px-4 py-3"
          >
            <div className="flex items-start gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${pcfg.color} 0%, ${pcfg.color}99 100%)` }}
              >
                {member.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[#EEF3FA] text-sm font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {member.name}
                  </span>
                  <span
                    className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                    style={{ color: pcfg.color, background: pcfg.bg, borderColor: pcfg.border }}
                  >
                    {pcfg.icon}
                    {member.perspective} View
                  </span>
                  <span className="text-[11px] text-[#7A94B4]">{member.role}</span>
                </div>

                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {member.zones.length > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-[#7A94B4]">
                      <MapPin size={10} className="text-[#2E7FFF]" />
                      {member.zones.slice(0, 3).join(', ')}
                      {member.zones.length > 3 && ` +${member.zones.length - 3}`}
                    </div>
                  )}
                  {member.assignedClients.length > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-[#7A94B4]">
                      <Building2 size={10} className="text-[#2E7FFF]" />
                      {member.assignedClients.slice(0, 2).join(', ')}
                      {member.assignedClients.length > 2 && ` +${member.assignedClients.length - 2}`}
                    </div>
                  )}
                  {member.skills && (
                    <div className="flex items-center gap-1 text-[10px] text-[#7A94B4]">
                      <Star size={10} className="text-[#F59E0B]" />
                      {member.skills.split(',').slice(0, 2).join(', ').trim()}
                    </div>
                  )}
                </div>

                {responsibilities.length > 0 && (
                  <div className="flex items-start gap-1 mt-1.5 flex-wrap">
                    {responsibilities.slice(0, 2).map((r, i) => (
                      <span
                        key={i}
                        className="text-[9px] text-[#4A6080] bg-[rgba(46,127,255,0.06)] border border-[rgba(46,127,255,0.12)] rounded px-1.5 py-0.5 max-w-[220px] truncate"
                        title={r}
                      >
                        <ChevronRight size={8} className="inline mr-0.5" />
                        {r}
                      </span>
                    ))}
                    {responsibilities.length > 2 && (
                      <span className="text-[9px] text-[#4A6080]">+{responsibilities.length - 2} more</span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <div
                  className="text-[9px] px-2 py-1 rounded-lg border"
                  style={{ color: pcfg.color, background: pcfg.bg, borderColor: pcfg.border }}
                >
                  <ExternalLink size={9} className="inline mr-1" />
                  Personalized Dashboard
                </div>
                <button
                  onClick={handleDismiss}
                  title="Switch to default view"
                  className="flex items-center gap-1 text-[9px] text-[#7A94B4] hover:text-[#EEF3FA] transition-colors px-2 py-1 rounded-lg border border-[rgba(46,127,255,0.15)] hover:border-[rgba(46,127,255,0.35)]"
                >
                  <X size={9} />
                  Dismiss
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-hidden relative">
        <MemberFilterProvider value={memberFilter}>
          <AnimatePresence mode="wait">
            {member.perspective === 'Strategic' && (
              <motion.div
                key="strategic"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex flex-col"
              >
                <StrategicView onToast={onToast} page={strategicPage} onNavigateToPage={setStrategicPage} onClientSelect={() => {}} selectedClientId={null} onNavigateToIncidents={() => setStrategicPage('incidents')} onNavigateToCommand={() => setStrategicPage('projectcommand')} onNavigateToTasks={() => setStrategicPage('tasks')} onMarkPPMCreated={() => {}} ppmCreatedTasks={{}} />
              </motion.div>
            )}
            {member.perspective === 'Operational' && (
              <motion.div
                key="operational"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex flex-col"
              >
                <OperationalView onToast={onToast} />
              </motion.div>
            )}
            {member.perspective === 'Client' && member.clientSector === 'Hospitality' && (
              <motion.div
                key="hospitality"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex flex-col"
              >
                <HospitalityClientView
                  onToast={onToast}
                  guestName={member.name}
                  propertyName={member.propertyName ?? member.assignedClients[0]}
                  memberToken={member.id}
                />
              </motion.div>
            )}
            {member.perspective === 'Client' && member.clientSector !== 'Hospitality' && (
              <motion.div
                key="client"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex flex-col"
              >
                <ClientView onToast={onToast} />
              </motion.div>
            )}
          </AnimatePresence>
        </MemberFilterProvider>
      </div>
    </div>
  );
}
