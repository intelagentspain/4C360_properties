const apiBase = (import.meta.env.VITE_API_URL ?? '/api') as string;

const AUTH_SESSION_KEY = '4c360-auth-session';
const LEGACY_AUTH_STATUS_KEY = '4c360-auth-status';

export type AuthUser = {
  id: string;
  email: string;
  role: string;
  organizationId: string;
  permissions: string[];
};

export type AuthSession = {
  token: string;
  refreshToken: string;
  user: AuthUser;
};

type ProjectCommandEvent = {
  id: string;
  projectId: string;
  type: string;
  title: string;
  description: string;
  affectedAreas: string[];
  affectedModule: string;
  impactLabel: string;
  severity: string;
  impacts: unknown;
  sourceModule?: string;
  sourceObjectId?: string | null;
  cta: string;
  timestamp: string;
};

export function getStoredAuthSession(): AuthSession | null {
  try {
    const raw = window.sessionStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthSession>;
    if (!parsed.token || !parsed.refreshToken || !parsed.user) return null;
    return parsed as AuthSession;
  } catch {
    return null;
  }
}

export function getStoredAuthToken(): string | null {
  return getStoredAuthSession()?.token ?? null;
}

export function setStoredAuthSession(session: AuthSession): void {
  window.sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  window.sessionStorage.setItem(LEGACY_AUTH_STATUS_KEY, 'api-login');
}

export function clearStoredAuthSession(): void {
  window.sessionStorage.removeItem(AUTH_SESSION_KEY);
  window.sessionStorage.removeItem(LEGACY_AUTH_STATUS_KEY);
  window.localStorage.removeItem(LEGACY_AUTH_STATUS_KEY);
}

function isPublicAppPath(pathname: string): boolean {
  return (
    pathname === '/login' ||
    pathname.startsWith('/demo') ||
    pathname.startsWith('/scan') ||
    pathname.startsWith('/report') ||
    pathname === '/field' ||
    pathname.startsWith('/field/') ||
    pathname.startsWith('/fieldops/survey') ||
    pathname.startsWith('/brochure')
  );
}

function redirectToLoginIfNeeded(): void {
  if (typeof window === 'undefined') return;
  if (isPublicAppPath(window.location.pathname)) return;
  window.location.assign('/login');
}

function buildHeaders(options?: RequestInit): Headers {
  const headers = new Headers(options?.headers);
  const body = options?.body;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getStoredAuthToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return headers;
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: buildHeaders(options),
  });
  if (res.status === 401) {
    clearStoredAuthSession();
    redirectToLoginIfNeeded();
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${options?.method ?? 'GET'} ${path} failed [${res.status}]: ${text}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  auth: {
    login: (body: { email: string; password: string }) =>
      apiFetch<AuthSession>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    refresh: (refreshToken: string) =>
      apiFetch<AuthSession>('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
    me: () => apiFetch<{ user: AuthUser }>('/auth/me'),
  },
  clients: {
    list: () => apiFetch<Record<string, unknown>[]>('/clients'),
    create: (body: Record<string, unknown>) => apiFetch<Record<string, unknown>>('/clients', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Record<string, unknown>) => apiFetch<Record<string, unknown>>(`/clients/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id: string) => apiFetch<{ ok: boolean; id: string }>(`/clients/${id}`, { method: 'DELETE' }),
  },
  incidents: {
    list: () => apiFetch<Record<string, unknown>[]>('/incidents'),
    create: (body: Record<string, unknown>) => apiFetch<Record<string, unknown>>('/incidents', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Record<string, unknown>) => apiFetch<Record<string, unknown>>(`/incidents/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    resolve: (id: string, body: Record<string, unknown>) => apiFetch<Record<string, unknown>>(`/incidents/${id}/resolve`, { method: 'POST', body: JSON.stringify(body) }),
    confirmResolution: (id: string, body: Record<string, unknown>) => apiFetch<Record<string, unknown>>(`/incidents/${id}/confirm-resolution`, { method: 'POST', body: JSON.stringify(body) }),
  },
  workOrders: {
    list: () => apiFetch<Record<string, unknown>[]>('/workorders'),
    get: (id: string) => apiFetch<Record<string, unknown>>(`/workorders/${id}`),
    create: (body: Record<string, unknown>) => apiFetch<Record<string, unknown>>('/workorders', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Record<string, unknown>) => apiFetch<Record<string, unknown>>(`/workorders/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    getEvidence: (id: string) => apiFetch<Record<string, unknown>[]>(`/workorders/${id}/evidence`),
    uploadEvidence: async (id: string, file: File, uploadedBy?: string): Promise<Record<string, unknown>> => {
      const formData = new FormData();
      formData.append('photo', file);
      if (uploadedBy) formData.append('uploadedBy', uploadedBy);
      const res = await fetch(`${apiBase}/workorders/${id}/evidence`, {
        method: 'POST',
        headers: buildHeaders({ body: formData }),
        body: formData,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Evidence upload failed [${res.status}]: ${text}`);
      }
      return res.json() as Promise<Record<string, unknown>>;
    },
  },
  teamMembers: {
    list: () => apiFetch<Record<string, unknown>[]>('/team-members'),
    create: (body: Record<string, unknown>) => apiFetch<Record<string, unknown>>('/team-members', { method: 'POST', body: JSON.stringify(body) }),
  },
  push: {
    getPublicKey: () => apiFetch<{ publicKey: string }>('/push/vapid-public-key'),
    subscribe: (email: string, subscription: PushSubscriptionJSON) =>
      apiFetch<{ ok: boolean }>('/push/subscribe', {
        method: 'POST',
        body: JSON.stringify({ email, subscription }),
      }),
    unsubscribe: (endpoint: string) =>
      apiFetch<{ ok: boolean }>('/push/unsubscribe', {
        method: 'POST',
        body: JSON.stringify({ endpoint }),
      }),
  },
  projectCommand: {
    listEvents: (projectId: string) =>
      apiFetch<{ events: ProjectCommandEvent[]; source: 'database' | 'memory' }>(`/projectcommand/projects/${encodeURIComponent(projectId)}/events`),
    createEvent: (projectId: string, event: ProjectCommandEvent) =>
      apiFetch<{ event: ProjectCommandEvent; source: 'database' | 'memory' }>(`/projectcommand/projects/${encodeURIComponent(projectId)}/events`, {
        method: 'POST',
        body: JSON.stringify(event),
      }),
    clearEvents: (projectId: string) =>
      apiFetch<{ ok: boolean; source: 'database' | 'memory' }>(`/projectcommand/projects/${encodeURIComponent(projectId)}/events`, {
        method: 'DELETE',
      }),
  },
};
