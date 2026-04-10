import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { mockIncidents, mockPortfolioClients } from '@/data/mockData';
import { useNotifications } from './NotificationContext';

export type Incident = {
  id: string;
  title: string;
  location: string;
  severity: string;
  slaMinutes: number;
  elapsed: number;
  lat?: number;
  lng?: number;
  source: string;
  status: string;
  assignedTech: string | null;
  techId: string | null;
  closureNotes: string | null;
  description: string;
  activityLog: { time: string; event: string; type: string }[];
  imageUrl?: string;
  siteId?: string;
  clientId?: string;
  aiMetadata?: {
    confidence: number;
    issueType: string;
    category: string;
    identifiedAsset: string;
    observations: string[];
    recommendedAction: string;
    reporterName?: string;
    reporterRole?: string;
    siteId?: string;
    assetId?: string;
  };
};

interface InviteListMember {
  name: string;
  email: string;
  role: string;
  siteNames?: string[];
}

function deriveInviteList(clientId?: string): InviteListMember[] {
  const client = clientId
    ? mockPortfolioClients.find(c => c.id === clientId)
    : mockPortfolioClients[0];
  if (!client) return [];

  const siteName = client.name;
  const people = client.people;
  const list: InviteListMember[] = [];

  const addPerson = (p: { name: string; role: string }, email?: string) => {
    const derived = email ?? `${p.name.toLowerCase().replace(/[^a-z]/g, '.')}@imdaad.ae`;
    list.push({ name: p.name, email: derived, role: p.role, siteNames: [siteName] });
  };

  addPerson(people.accountManager);
  addPerson(people.fmManager);
  people.supervisors.forEach(s => addPerson(s));

  return list;
}

interface IncidentContextValue {
  incidents: Incident[];
  addIncident: (inc: Incident) => void;
}

const IncidentContext = createContext<IncidentContextValue | null>(null);

const BASE_INCIDENTS: Incident[] = mockIncidents.map(i => ({
  ...i,
  lat: (i as unknown as Record<string, number>).lat,
  lng: (i as unknown as Record<string, number>).lng,
}));

function IncidentProviderInner({ children }: { children: ReactNode }) {
  const [incidents, setIncidents] = useState<Incident[]>(BASE_INCIDENTS);
  const { addIncidentNotification } = useNotifications();

  const addIncident = useCallback((inc: Incident) => {
    setIncidents(prev => [inc, ...prev]);
    const inviteList = deriveInviteList(inc.clientId);
    addIncidentNotification(inc, inviteList);
  }, [addIncidentNotification]);

  return (
    <IncidentContext.Provider value={{ incidents, addIncident }}>
      {children}
    </IncidentContext.Provider>
  );
}

export function IncidentProvider({ children }: { children: ReactNode }) {
  return <IncidentProviderInner>{children}</IncidentProviderInner>;
}

export function useIncidents() {
  const ctx = useContext(IncidentContext);
  if (!ctx) throw new Error('useIncidents must be used inside IncidentProvider');
  return ctx;
}
