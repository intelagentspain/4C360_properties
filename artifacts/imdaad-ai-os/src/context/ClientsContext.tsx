import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { mockPortfolioClients, type PortfolioClient, type PortfolioClientContract } from '@/data/mockData';
import { api } from '@/lib/api';

interface ClientsContextValue {
  clients: PortfolioClient[];
  addClient: (clientData: Record<string, unknown>) => Promise<void>;
  removeClient: (id: string) => Promise<void>;
  refreshClients: () => Promise<void>;
}

const ClientsContext = createContext<ClientsContextValue | null>(null);

function mergeApiDataWithMock(apiClients: Record<string, unknown>[]): PortfolioClient[] {
  if (apiClients.length === 0) return mockPortfolioClients;

  return apiClients.map(apiClient => {
    const id = String(apiClient['id'] ?? '');
    const mockMatch = mockPortfolioClients.find(m => m.id === id);

    const contract = (apiClient['contract'] as Record<string, unknown> | null) ?? {};
    const mergedContract: PortfolioClientContract = {
      number: String(contract['number'] ?? mockMatch?.contract?.number ?? ''),
      tier: (contract['tier'] as PortfolioClientContract['tier']) ?? mockMatch?.contract?.tier ?? 'Standard',
      startDate: String(contract['startDate'] ?? mockMatch?.contract?.startDate ?? ''),
      endDate: String(contract['endDate'] ?? mockMatch?.contract?.endDate ?? ''),
      renewalDate: String(contract['renewalDate'] ?? mockMatch?.contract?.renewalDate ?? ''),
      annualValue: String(contract['annualValue'] ?? mockMatch?.contract?.annualValue ?? ''),
      penalties: String(contract['penalties'] ?? mockMatch?.contract?.penalties ?? ''),
      responseTimes: mockMatch?.contract?.responseTimes ?? [],
      vendorManager: String(contract['vendorManager'] ?? mockMatch?.contract?.vendorManager ?? ''),
      notes: mockMatch?.contract?.notes ?? '',
    };

    return {
      id,
      name: String(apiClient['name'] ?? ''),
      status: (apiClient['status'] as PortfolioClient['status']) ?? 'live',
      region: String(apiClient['region'] ?? ''),
      sector: String(apiClient['sector'] ?? ''),
      sites: Number(apiClient['sites'] ?? 0),
      workOrders: Number(apiClient['workOrders'] ?? 0),
      incidents: Number(apiClient['incidentsCount'] ?? 0),
      sla: Number(apiClient['sla'] ?? 100),
      compliance: Number(apiClient['compliance'] ?? 100),
      riskLevel: (apiClient['riskLevel'] as PortfolioClient['riskLevel']) ?? 'low',
      overdueTasks: Number(apiClient['overdueTasks'] ?? 0),
      dataSources: mockMatch?.dataSources ?? [],
      aiInsight: String(apiClient['aiInsight'] ?? ''),
      lastUpdated: String(apiClient['lastUpdated'] ?? ''),
      topSites: mockMatch?.topSites ?? [],
      recentActivity: mockMatch?.recentActivity ?? [],
      people: mockMatch?.people ?? {
        accountManager: { name: '', role: 'Account Manager', initials: '', status: 'available' },
        fmManager: { name: '', role: 'FM Manager', initials: '', status: 'available' },
        supervisors: [],
        technicians: [],
      },
      resources: mockMatch?.resources ?? {
        budgetUsed: 0,
        budgetTotal: 0,
        fleet: [],
        partsStock: [],
        equipment: [],
      },
      contract: mergedContract,
      lat: (() => { const v = Number(apiClient['lat']); return isFinite(v) && v !== 0 ? v : undefined; })() ?? mockMatch?.lat,
      lng: (() => { const v = Number(apiClient['lng']); return isFinite(v) && v !== 0 ? v : undefined; })() ?? mockMatch?.lng,
      marketLabel: (apiClient['marketLabel'] as string | undefined) ?? mockMatch?.marketLabel,
    };
  });
}

export function ClientsProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<PortfolioClient[]>(mockPortfolioClients);

  const refreshClients = useCallback(async () => {
    try {
      const data = await api.clients.list();
      setClients(mergeApiDataWithMock(data));
    } catch (err) {
      console.warn('[ClientsContext] Failed to load clients from API, using mock data:', err);
    }
  }, []);

  useEffect(() => {
    refreshClients();
  }, [refreshClients]);

  const addClient = useCallback(async (clientData: Record<string, unknown>) => {
    try {
      await api.clients.create(clientData);
      await refreshClients();
    } catch (err) {
      console.warn('[ClientsContext] Failed to persist client to API:', err);
    }
  }, [refreshClients]);

  const removeClient = useCallback(async (id: string) => {
    await api.clients.delete(id);
    setClients(prev => prev.filter(c => c.id !== id));
  }, []);

  return (
    <ClientsContext.Provider value={{ clients, addClient, removeClient, refreshClients }}>
      {children}
    </ClientsContext.Provider>
  );
}

export function useClients(): ClientsContextValue {
  const ctx = useContext(ClientsContext);
  if (!ctx) throw new Error('useClients must be used within ClientsProvider');
  return ctx;
}
