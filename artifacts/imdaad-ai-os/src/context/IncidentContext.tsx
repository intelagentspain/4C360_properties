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
  asset?: string;
  activityLog: { time: string; event: string; type: string }[];
  imageUrl?: string;
  siteId?: string;
  clientId?: string;
  workOrderId?: string;
  notifiedRoles?: string[];
  ticketState?: TicketState;
  rejectionReason?: string;
  approvedBy?: string;
  rejectedBy?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
  confirmedAt?: string;
  confirmedBy?: string;
  reportedAt?: string;
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

export type TicketState = 'pending_approval' | 'approved' | 'rejected' | 'work_order_created';

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
    const derived = email ?? `${p.name.toLowerCase().replace(/[^a-z]/g, '.')}@developmentx.ae`;
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
    resolvedAt: d['resolvedAt'] != null ? String(d['resolvedAt']) : undefined,
    resolvedBy: d['resolvedBy'] != null ? String(d['resolvedBy']) : undefined,
    resolutionNotes: d['resolutionNotes'] != null ? String(d['resolutionNotes']) : undefined,
    beforePhotoUrl: d['beforePhotoUrl'] != null ? String(d['beforePhotoUrl']) : undefined,
    afterPhotoUrl: d['afterPhotoUrl'] != null ? String(d['afterPhotoUrl']) : undefined,
    confirmedAt: d['confirmedAt'] != null ? String(d['confirmedAt']) : undefined,
    confirmedBy: d['confirmedBy'] != null ? String(d['confirmedBy']) : undefined,
    reportedAt: d['reportedAt'] != null ? String(d['reportedAt']) : (d['createdAt'] != null ? String(d['createdAt']) : undefined),
    ticketState: d['ticketState'] != null ? (d['ticketState'] as TicketState) : undefined,
    approvedBy: d['approvedBy'] != null ? String(d['approvedBy']) : undefined,
    rejectedBy: d['rejectedBy'] != null ? String(d['rejectedBy']) : undefined,
    rejectionReason: d['rejectionReason'] != null ? String(d['rejectionReason']) : undefined,
    workOrderId: d['workOrderId'] != null ? String(d['workOrderId']) : undefined,
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
  assignedTech?: string | null;
  techId?: string | null;
}

interface IncidentContextValue {
  incidents: Incident[];
  addIncident: (inc: Incident) => void;
  workOrders: WorkOrderTask[];
  addWorkOrder: (wo: WorkOrderTask) => void;
  createWorkOrder: (incidentId: string, data: CreateWorkOrderInput) => WorkOrderTask;
  approveTicket: (incidentId: string, approvedBy?: string) => Promise<void>;
  rejectTicket: (incidentId: string, reason: string, rejectedBy?: string) => Promise<void>;
  resolveIncident: (incidentId: string, data: ResolveIncidentInput) => Promise<void>;
  confirmResolution: (incidentId: string, confirmedBy?: string, clientEmail?: string, clientName?: string) => Promise<void>;
}

export interface ResolveIncidentInput {
  resolvedBy?: string;
  resolutionNotes: string;
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
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

const apiBase = typeof window !== 'undefined' ? window.location.origin + '/api' : '/api';

function IncidentProviderInner({ children }: { children: ReactNode }) {
  const [incidents, setIncidents] = useState<Incident[]>(BASE_INCIDENTS);
  const [workOrders, setWorkOrders] = useState<WorkOrderTask[]>([]);
  const incidentsRef = useRef<Incident[]>(BASE_INCIDENTS);
  const { addIncidentNotification, addWorkOrderNotification } = useNotifications();

  const loadIncidents = useCallback(() => {
    return api.incidents.list()
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
  }, []);

  const loadWorkOrders = useCallback(() => {
    return api.workOrders.list()
      .then(data => {
        if (data.length > 0) {
          const loaded = data.map(d => {
            const assignedTo = d['assignedTo'] != null && String(d['assignedTo']).trim() !== '' ? String(d['assignedTo']) : null;
            const rawStatus = String(d['status'] ?? 'new');
            const status = rawStatus === 'assigned' && !assignedTo ? 'new' : rawStatus;
            return {
              id: String(d['id'] ?? ''),
              title: String(d['title'] ?? ''),
              asset: String(d['asset'] ?? ''),
              location: String(d['location'] ?? ''),
              skill: String(d['skill'] ?? ''),
              priority: String(d['priority'] ?? 'medium'),
              status,
              tech: assignedTo,
              slaMinutes: 120,
              elapsed: 0,
              reportedBy: String(d['incidentId'] ?? ''),
              evidence: [] as string[],
              fromIncidentId: d['incidentId'] != null ? String(d['incidentId']) : undefined,
              siteId: d['siteId'] != null ? String(d['siteId']) : undefined,
            };
          });
          setWorkOrders(loaded);
        }
      })
      .catch(err => {
        console.warn('[IncidentContext] Failed to load work orders from API:', err);
      });
  }, []);

  useEffect(() => {
    loadIncidents();
    loadWorkOrders();

    const pollInterval = setInterval(() => {
      loadIncidents();
      loadWorkOrders();
    }, 10000);

    return () => clearInterval(pollInterval);
  }, [loadIncidents, loadWorkOrders]);

  const addIncident = useCallback((inc: Incident) => {
    const inviteList = deriveInviteList(inc.clientId);
    const roles = inviteList.map(m => m.role);
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const enriched: Incident = {
      ...inc,
      ticketState: 'pending_approval',
      notifiedRoles: roles,
      activityLog: [
        ...inc.activityLog,
        { time: timeStr, event: `Ticket created — awaiting approval from supervisor/account manager`, type: 'dispatch' },
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

  const approveTicket = useCallback(async (incidentId: string, approvedBy?: string) => {
    let backendWorkOrderId: string | undefined;

    const res = await fetch(`${apiBase}/tickets/${encodeURIComponent(incidentId)}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approvedBy: approvedBy ?? 'app-user' }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: string };
      throw new Error(err.error ?? 'Approval failed');
    }
    const body = await res.json().catch(() => ({})) as { workOrderId?: string };
    backendWorkOrderId = body.workOrderId;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const incident = incidentsRef.current.find(inc => inc.id === incidentId);
    if (!incident) return;

    const priority = incident.severity === 'critical' ? 'critical' : incident.severity === 'high' ? 'high' : incident.severity === 'medium' ? 'medium' : 'low';
    const slaMinutes = priority === 'critical' ? 45 : priority === 'high' ? 60 : priority === 'medium' ? 120 : 240;
    const asset = incident.aiMetadata?.identifiedAsset ?? incident.title;
    const skill = incident.aiMetadata?.category?.split(' ')[0] ?? 'General';
    const siteId = incident.siteId ?? incident.aiMetadata?.siteId;
    const clientId = incident.clientId;

    const woId = backendWorkOrderId ?? generateWorkOrderId();

    const wo: WorkOrderTask = {
      id: woId,
      title: incident.title,
      asset,
      location: incident.location,
      skill,
      priority,
      status: incident.assignedTech ? 'assigned' : 'new',
      tech: incident.assignedTech ?? null,
      slaMinutes,
      elapsed: 0,
      reportedBy: incidentId,
      evidence: [],
      fromIncidentId: incidentId,
      siteId,
    };

    if (!backendWorkOrderId) {
      api.workOrders.create({
        id: woId,
        title: incident.title,
        location: incident.location,
        priority,
        asset,
        skill,
        siteId,
        incidentId,
        description: incident.description,
      }).catch(err => console.warn('[IncidentContext] Failed to persist auto work order to API:', err));
    }

    incidentsRef.current = incidentsRef.current.map(inc =>
      inc.id === incidentId
        ? {
            ...inc,
            status: 'dispatched',
            ticketState: 'work_order_created' as TicketState,
            workOrderId: woId,
            approvedBy: approvedBy ?? 'Supervisor',
            activityLog: [
              ...inc.activityLog,
              ...(incident.assignedTech ? [{ time: timeStr, event: `Technician assigned: ${incident.assignedTech}`, type: 'dispatch' }] : []),
              { time: timeStr, event: `Ticket approved by ${approvedBy ?? 'supervisor'}`, type: 'dispatch' },
              { time: timeStr, event: `Work Order ${woId} raised automatically on approval`, type: 'dispatch' },
            ],
          }
        : inc,
    );
    setIncidents([...incidentsRef.current]);

    setWorkOrders(wos => [wo, ...wos]);
    addWorkOrderNotification(wo, incidentId, siteId, deriveInviteList(clientId));
  }, [addWorkOrderNotification]);

  const rejectTicket = useCallback(async (incidentId: string, reason: string, rejectedBy?: string) => {
    try {
      await fetch(`${apiBase}/tickets/${encodeURIComponent(incidentId)}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, rejectedBy: rejectedBy ?? 'app-user' }),
      });
    } catch {
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    incidentsRef.current = incidentsRef.current.map(inc =>
      inc.id === incidentId
        ? {
            ...inc,
            ticketState: 'rejected' as TicketState,
            rejectionReason: reason,
            rejectedBy: rejectedBy ?? 'Supervisor',
            activityLog: [
              ...inc.activityLog,
              { time: timeStr, event: `Ticket rejected: "${reason}"`, type: 'escalation' },
            ],
          }
        : inc,
    );
    setIncidents([...incidentsRef.current]);
  }, []);

  const resolveIncident = useCallback(async (incidentId: string, data: ResolveIncidentInput) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    try {
      await api.incidents.resolve(incidentId, {
        resolvedBy: data.resolvedBy,
        resolutionNotes: data.resolutionNotes,
        beforePhotoUrl: data.beforePhotoUrl,
        afterPhotoUrl: data.afterPhotoUrl,
      });
    } catch (err) {
      console.warn('[IncidentContext] Failed to call resolve API:', err);
    }

    incidentsRef.current = incidentsRef.current.map(inc =>
      inc.id === incidentId
        ? {
            ...inc,
            status: 'resolved',
            resolvedAt: now.toISOString(),
            resolvedBy: data.resolvedBy ?? inc.assignedTech ?? undefined,
            resolutionNotes: data.resolutionNotes,
            beforePhotoUrl: data.beforePhotoUrl,
            afterPhotoUrl: data.afterPhotoUrl,
            activityLog: [
              ...inc.activityLog,
              { time: timeStr, event: `Incident marked resolved by ${data.resolvedBy ?? inc.assignedTech ?? 'FM Engineer'} with photo evidence`, type: 'update' },
              { time: timeStr, event: `Resolution pending supervisor/AM confirmation`, type: 'dispatch' },
            ],
          }
        : inc,
    );
    setIncidents([...incidentsRef.current]);
  }, []);

  const confirmResolution = useCallback(async (incidentId: string, confirmedBy?: string, clientEmail?: string, clientName?: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    try {
      await api.incidents.confirmResolution(incidentId, {
        confirmedBy: confirmedBy ?? 'supervisor',
        clientEmail,
        clientName,
      });
    } catch (err) {
      console.warn('[IncidentContext] Failed to call confirmResolution API:', err);
    }

    incidentsRef.current = incidentsRef.current.map(inc =>
      inc.id === incidentId
        ? {
            ...inc,
            status: 'closed',
            confirmedAt: now.toISOString(),
            confirmedBy: confirmedBy ?? 'Supervisor',
            closureNotes: inc.resolutionNotes ?? null,
            activityLog: [
              ...inc.activityLog,
              { time: timeStr, event: `Resolution confirmed by ${confirmedBy ?? 'supervisor'} — incident closed`, type: 'update' },
              { time: timeStr, event: `Client notified with full resolution report`, type: 'dispatch' },
            ],
          }
        : inc,
    );
    setIncidents([...incidentsRef.current]);
  }, []);

  const addWorkOrder = useCallback((wo: WorkOrderTask) => {
    setWorkOrders(wos => {
      if (wos.some(w => w.id === wo.id)) return wos;
      return [wo, ...wos];
    });
  }, []);

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
      status: data.assignedTech ? 'assigned' : 'new',
      tech: data.assignedTech ?? null,
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
      assignedTo: data.assignedTech,
      techId: data.techId,
      description: data.description,
    }).catch(err => console.warn('[IncidentContext] Failed to persist work order to API:', err));

    incidentsRef.current = incidentsRef.current.map(inc =>
      inc.id === incidentId
        ? {
            ...inc,
            status: 'dispatched',
            ticketState: 'work_order_created' as TicketState,
            workOrderId: id,
            assignedTech: data.assignedTech ?? inc.assignedTech,
            techId: data.techId ?? inc.techId,
            activityLog: [
              ...inc.activityLog,
              ...(data.assignedTech ? [{ time: timeStr, event: `Best-match technician assigned: ${data.assignedTech}`, type: 'dispatch' }] : []),
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
    <IncidentContext.Provider value={{ incidents, addIncident, workOrders, addWorkOrder, createWorkOrder, approveTicket, rejectTicket, resolveIncident, confirmResolution }}>
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
