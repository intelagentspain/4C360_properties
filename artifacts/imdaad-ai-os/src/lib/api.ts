const apiBase = (import.meta.env.VITE_API_URL ?? '/api') as string;

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBase}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${options?.method ?? 'GET'} ${path} failed [${res.status}]: ${text}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  clients: {
    list: () => apiFetch<Record<string, unknown>[]>('/clients'),
    create: (body: Record<string, unknown>) => apiFetch<Record<string, unknown>>('/clients', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Record<string, unknown>) => apiFetch<Record<string, unknown>>(`/clients/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  },
  incidents: {
    list: () => apiFetch<Record<string, unknown>[]>('/incidents'),
    create: (body: Record<string, unknown>) => apiFetch<Record<string, unknown>>('/incidents', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Record<string, unknown>) => apiFetch<Record<string, unknown>>(`/incidents/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
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
};
