import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { mockIncidents, mockPortfolioClients } from '@/data/mockData';
import { useNotifications } from './NotificationContext';
import { api } from '@/lib/api';

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
  workOrderId?: string;
  notifiedRoles?: string[];
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

export type WorkOrderTask = {
  id: string;
  title: string;
  asset: string;
  location: string;
  skill: string;
  priority: string;
  status: string;
  tech: string | null;
  slaMinutes: number;
  elapsed: number;
  reportedBy: string;
  evidence: string[];
  fromIncidentId?: string;
  siteId?: string;
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

function dbIncidentToLocal(d: Record<string, unknown>): Incident {
  return {
    id: String(d['id'] ?? ''),
    title: String(d['title'] ?? ''),
    location: String(d['location'] ?? ''),
    severity: String(d['severity'] ?? 'low'),
    slaMinutes: Number(d['slaMinutes'] ?? 120),
    elapsed: Number(d['elapsed'] ?? 0),
    lat: d['lat'] != null ? Number(d['lat']) : undefined,
    lng: d['lng'] != null ? Number(d['lng']) : undefined,
    source: String(d['source'] ?? 'Manual'),
    status: String(d['status'] ?? 'open'),
    assignedTech: d['assignedTech'] != null ? String(d['assignedTech']) : null,
    techId: d['techId'] != null ? String(d['techId']) : null,
    closureNotes: d['closureNotes'] != null ? String(d['closureNotes']) : null,
    description: String(d['description'] ?? ''),
    activityLog: Array.isArray(d['activityLog']) ? (d['activityLog'] as { time: string; event: string; type: string }[]) : [],
    imageUrl: d['imageUrl'] != null ? String(d['imageUrl']) : undefined,
    siteId: d['siteId'] != null ? String(d['siteId']) : undefined,
    clientId: d['clientId'] != null ? String(d['clientId']) : undefined,
    aiMetadata: d['aiMetadata'] as Incident['aiMetadata'],
  };
}

export interface CreateWorkOrderInput {
  title: string;
  location: string;
  priority: string;
  asset: string;
  skill: string;
  description?: string;
  siteId?: string;
}

interface IncidentContextValue {
  incidents: Incident[];
  addIncident: (inc: Incident) => void;
  workOrders: WorkOrderTask[];
  createWorkOrder: (incidentId: string, data: CreateWorkOrderInput) => WorkOrderTask;
}

const IncidentContext = createContext<IncidentContextValue | null>(null);

const BASE_INCIDENTS: Incident[] = mockIncidents.map(i => ({
  ...i,
  lat: (i as unknown as Record<string, number>).lat,
  lng: (i as unknown as Record<string, number>).lng,
}));

let workOrderCounter = 100;

function generateWorkOrderId(): string {
  workOrderCounter += 1;
  return `WO-${String(workOrderCounter).padStart(3, '0')}`;
}

function IncidentProviderInner({ children }: { children: ReactNode }) {
  const [incidents, setIncidents] = useState<Incident[]>(BASE_INCIDENTS);
  const [workOrders, setWorkOrders] = useState<WorkOrderTask[]>([]);
  const incidentsRef = useRef<Incident[]>(BASE_INCIDENTS);
  const { addIncidentNotification, addWorkOrderNotification } = useNotifications();

  useEffect(() => {
    api.incidents.list()
      .then(data => {
        if (data.length > 0) {
          const loaded = data.map(dbIncidentToLocal);
          incidentsRef.current = loaded;
          setIncidents(loaded);
        }
      })
      .catch(err => {
        console.warn('[IncidentContext] Failed to load incidents from API, using mock data:', err);
      });

    api.workOrders.list()
      .then(data => {
        if (data.length > 0) {
          const loaded = data.map(d => ({
            id: String(d['id'] ?? ''),
            title: String(d['title'] ?? ''),
            asset: String(d['asset'] ?? ''),
            location: String(d['location'] ?? ''),
            skill: String(d['skill'] ?? ''),
            priority: String(d['priority'] ?? 'medium'),
            status: String(d['status'] ?? 'new'),
            tech: null as null,
            slaMinutes: 120,
            elapsed: 0,
            reportedBy: String(d['incidentId'] ?? ''),
            evidence: [] as string[],
            fromIncidentId: d['incidentId'] != null ? String(d['incidentId']) : undefined,
            siteId: d['siteId'] != null ? String(d['siteId']) : undefined,
          }));
          setWorkOrders(loaded);
        }
      })
      .catch(err => {
        console.warn('[IncidentContext] Failed to load work orders from API:', err);
      });
  }, []);

  const addIncident = useCallback((inc: Incident) => {
    const inviteList = deriveInviteList(inc.clientId);
    const roles = inviteList.map(m => m.role);
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const enriched: Incident = {
      ...inc,
      notifiedRoles: roles,
      activityLog: [
        ...inc.activityLog,
        { time: timeStr, event: `Stakeholders notified: ${roles.join(', ')}`, type: 'dispatch' },
      ],
    };

    api.incidents.create({
      id: enriched.id,
      title: enriched.title,
      location: enriched.location,
      severity: enriched.severity,
      slaMinutes: enriched.slaMinutes,
      elapsed: enriched.elapsed,
      source: enriched.source,
      status: enriched.status,
      assignedTech: enriched.assignedTech,
      techId: enriched.techId,
      description: enriched.description,
      lat: enriched.lat,
      lng: enriched.lng,
      imageUrl: enriched.imageUrl,
      siteId: enriched.siteId,
      clientId: enriched.clientId,
      activityLog: enriched.activityLog,
      aiMetadata: enriched.aiMetadata,
    }).catch(err => console.warn('[IncidentContext] Failed to persist incident to API:', err));

    incidentsRef.current = [enriched, ...incidentsRef.current];
    setIncidents(incidentsRef.current);
    addIncidentNotification(enriched, inviteList);
  }, [addIncidentNotification]);

  const createWorkOrder = useCallback((incidentId: string, data: CreateWorkOrderInput): WorkOrderTask => {
    const id = generateWorkOrderId();
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const incident = incidentsRef.current.find(inc => inc.id === incidentId);
    const clientId = incident?.clientId;
    const siteId   = data.siteId ?? incident?.siteId ?? incident?.aiMetadata?.siteId;

    const slaMinutes = data.priority === 'critical' ? 45 : data.priority === 'high' ? 60 : data.priority === 'medium' ? 120 : 240;

    const wo: WorkOrderTask = {
      id,
      title: data.title,
      asset: data.asset,
      location: data.location,
      skill: data.skill,
      priority: data.priority,
      status: 'new',
      tech: null,
      slaMinutes,
      elapsed: 0,
      reportedBy: incidentId,
      evidence: [],
      fromIncidentId: incidentId,
      siteId,
    };

    api.workOrders.create({
      id,
      title: data.title,
      location: data.location,
      priority: data.priority,
      asset: data.asset,
      skill: data.skill,
      siteId,
      incidentId,
      description: data.description,
    }).catch(err => console.warn('[IncidentContext] Failed to persist work order to API:', err));

    incidentsRef.current = incidentsRef.current.map(inc =>
      inc.id === incidentId
        ? {
            ...inc,
            status: 'dispatched',
            workOrderId: id,
            activityLog: [
              ...inc.activityLog,
              { time: timeStr, event: `Work Order ${id} raised — promoted to formal work order`, type: 'dispatch' },
            ],
          }
        : inc,
    );
    setIncidents(incidentsRef.current);

    setWorkOrders(wos => [wo, ...wos]);
    addWorkOrderNotification(wo, incidentId, siteId, deriveInviteList(clientId));

    return wo;
  }, [addWorkOrderNotification]);

  return (
    <IncidentContext.Provider value={{ incidents, addIncident, workOrders, createWorkOrder }}>
      {children}
    </IncidentContext.Provider>
  );
}

export function IncidentProvider({ children }: { children: ReactNode }) {
  return <IncidentProviderInner>{children}</IncidentProviderInner>;
}

export function useIncidents() {
  const ctx = useContext(IncidentContext);
  if (!ctx) throw new Error('useIncidents must be inside IncidentProvider');
  return ctx;
}
