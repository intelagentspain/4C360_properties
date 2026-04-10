import { createContext, useContext, useState, type ReactNode } from 'react';
import { mockIncidents } from '@/data/mockData';

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

interface IncidentContextValue {
  incidents: Incident[];
  addIncident: (inc: Incident) => void;
}

const IncidentContext = createContext<IncidentContextValue | null>(null);

const BASE_INCIDENTS: Incident[] = mockIncidents.map(i => ({
  ...i,
  lat: (i as any).lat,
  lng: (i as any).lng,
}));

export function IncidentProvider({ children }: { children: ReactNode }) {
  const [incidents, setIncidents] = useState<Incident[]>(BASE_INCIDENTS);

  const addIncident = (inc: Incident) => {
    setIncidents(prev => [inc, ...prev]);
  };

  return (
    <IncidentContext.Provider value={{ incidents, addIncident }}>
      {children}
    </IncidentContext.Provider>
  );
}

export function useIncidents() {
  const ctx = useContext(IncidentContext);
  if (!ctx) throw new Error('useIncidents must be used inside IncidentProvider');
  return ctx;
}
