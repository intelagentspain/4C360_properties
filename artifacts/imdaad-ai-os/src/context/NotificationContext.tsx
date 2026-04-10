import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';
import { mockNotifications } from '@/data/mockData';
import { CURRENT_USER } from '@/lib/currentUser';
import type { Incident, WorkOrderTask } from './IncidentContext';

export interface AppNotification {
  id: number;
  type: 'critical' | 'warning' | 'info' | 'success';
  text: string;
  sub: string;
  read: boolean;
  incidentId?: string;
  workOrderId?: string;
  muted?: boolean;
}

interface InviteListMember {
  name: string;
  email: string;
  role: string;
  siteNames?: string[];
}

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  addIncidentNotification: (incident: Incident, inviteList?: InviteListMember[]) => void;
  addWorkOrderNotification: (workOrder: WorkOrderTask, incidentId: string, siteId?: string, inviteList?: InviteListMember[]) => void;
  markAllRead: () => void;
  muteIncident: (incidentId: string) => void;
  isIncidentMuted: (incidentId: string) => boolean;
  syncMuteStatus: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

let nextId = mockNotifications.length + 1;

function severityToType(severity: string): AppNotification['type'] {
  switch (severity?.toLowerCase()) {
    case 'critical': return 'critical';
    case 'high':     return 'warning';
    case 'medium':   return 'warning';
    default:         return 'info';
  }
}

function priorityToType(priority: string): AppNotification['type'] {
  switch (priority?.toLowerCase()) {
    case 'critical': return 'critical';
    case 'high':     return 'warning';
    default:         return 'info';
  }
}

const BASE_NOTIFICATIONS: AppNotification[] = mockNotifications.map(n => ({
  ...n,
  type: n.type as AppNotification['type'],
}));

const apiBase = import.meta.env.VITE_API_URL ?? '/api';

interface NotifyResultEntry {
  email: string;
  status: string;
  muteToken?: string;
}

interface NotifyResponse {
  results?: NotifyResultEntry[];
}

interface MuteStatusResponse {
  muted: boolean;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(BASE_NOTIFICATIONS);
  const [mutedIncidents, setMutedIncidents] = useState<Set<string>>(new Set());
  const muteTokensRef = useRef<Map<string, string>>(new Map());

  const isIncidentMuted = useCallback(
    (incidentId: string) => mutedIncidents.has(incidentId),
    [mutedIncidents],
  );

  const muteIncident = useCallback((incidentId: string) => {
    setMutedIncidents(prev => new Set([...prev, incidentId]));
    setNotifications(prev =>
      prev.map(n => n.incidentId === incidentId ? { ...n, muted: true, read: true } : n),
    );
    const token = muteTokensRef.current.get(incidentId);
    if (token) {
      fetch(`${apiBase}/incidents/${encodeURIComponent(incidentId)}/mute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      }).catch(() => {});
    }
  }, []);

  const addIncidentNotification = useCallback(
    (incident: Incident, inviteList?: InviteListMember[]) => {
      if (mutedIncidents.has(incident.id)) return;

      const id = nextId++;
      const note: AppNotification = {
        id,
        type: severityToType(incident.severity),
        text: `${incident.title} — ${incident.location}`,
        sub: `${incident.source} · ${incident.severity?.toUpperCase()} · Just now`,
        read: false,
        incidentId: incident.id,
        muted: false,
      };

      setNotifications(prev => [note, ...prev]);

      fetch(`${apiBase}/incidents/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incident, inviteList }),
      })
        .then(r => r.json() as Promise<NotifyResponse>)
        .then(data => {
          const match = data.results?.find(
            r => r.email === CURRENT_USER.email && r.muteToken,
          );
          if (match?.muteToken) {
            muteTokensRef.current.set(incident.id, match.muteToken);
          }
        })
        .catch(() => {});
    },
    [mutedIncidents],
  );

  const addWorkOrderNotification = useCallback(
    (workOrder: WorkOrderTask, incidentId: string, siteId?: string, inviteList?: InviteListMember[]) => {
      const id = nextId++;
      const note: AppNotification = {
        id,
        type: priorityToType(workOrder.priority),
        text: `Work Order Created — ${workOrder.title}`,
        sub: `From incident ${incidentId} · ${workOrder.priority?.toUpperCase()} · Just now`,
        read: false,
        workOrderId: workOrder.id,
        incidentId,
        muted: false,
      };

      setNotifications(prev => [note, ...prev]);

      fetch(`${apiBase}/workorders/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workOrder: {
            id: workOrder.id,
            title: workOrder.title,
            location: workOrder.location,
            priority: workOrder.priority,
            asset: workOrder.asset,
            skill: workOrder.skill,
            siteId: siteId ?? (workOrder as WorkOrderTask).siteId,
            incidentId,
            description: `Promoted from incident ${incidentId}`,
          },
          incidentId,
          inviteList,
        }),
      }).catch(() => {});
    },
    [],
  );

  const syncMuteStatus = useCallback(() => {
    const incidentIds = Array.from(
      new Set(
        notifications
          .filter(n => n.incidentId && !n.muted)
          .map(n => n.incidentId!),
      ),
    );
    for (const incidentId of incidentIds) {
      fetch(
        `${apiBase}/incidents/${encodeURIComponent(incidentId)}/mute-status?email=${encodeURIComponent(CURRENT_USER.email)}`,
      )
        .then(r => r.json() as Promise<MuteStatusResponse>)
        .then(data => {
          if (data.muted) {
            setMutedIncidents(prev => new Set([...prev, incidentId]));
            setNotifications(prev =>
              prev.map(n =>
                n.incidentId === incidentId ? { ...n, muted: true, read: true } : n,
              ),
            );
          }
        })
        .catch(() => {});
    }
  }, [notifications]);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter(n => !n.read && !n.muted).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addIncidentNotification,
      addWorkOrderNotification,
      markAllRead,
      muteIncident,
      isIncidentMuted,
      syncMuteStatus,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
  return ctx;
}
