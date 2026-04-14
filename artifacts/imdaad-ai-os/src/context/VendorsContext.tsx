import { createContext, useContext, useState, type ReactNode } from 'react';
import { mockVendorIntelligence, type VendorIntelData, type VendorTrend } from '@/data/mockData';

interface VendorsContextValue {
  vendors: VendorIntelData[];
  addVendor: (v: VendorIntelData) => void;
  updateVendor: (v: VendorIntelData) => void;
  removeVendor: (id: string) => void;
}

const VendorsContext = createContext<VendorsContextValue | null>(null);

export function VendorsProvider({ children }: { children: ReactNode }) {
  const [vendors, setVendors] = useState<VendorIntelData[]>(mockVendorIntelligence);

  function addVendor(v: VendorIntelData) {
    setVendors(prev => [...prev, v]);
  }

  function updateVendor(v: VendorIntelData) {
    setVendors(prev => prev.map(x => x.id === v.id ? v : x));
  }

  function removeVendor(id: string) {
    setVendors(prev => prev.filter(x => x.id !== id));
  }

  return (
    <VendorsContext.Provider value={{ vendors, addVendor, updateVendor, removeVendor }}>
      {children}
    </VendorsContext.Provider>
  );
}

export function useVendors(): VendorsContextValue {
  const ctx = useContext(VendorsContext);
  if (!ctx) throw new Error('useVendors must be used within VendorsProvider');
  return ctx;
}

export function buildDefaultVendor(overrides: Partial<VendorIntelData> & { id: string; name: string }): VendorIntelData {
  const months = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];
  const baseCost = overrides.avgCostPerJob ?? 450;
  const baseSla = overrides.slaCompliance ?? 85;
  const trend: VendorTrend = overrides.trend ?? 'flat';

  return {
    id: overrides.id,
    name: overrides.name,
    category: overrides.category ?? 'General FM',
    trend,
    slaCompliance: overrides.slaCompliance ?? 85,
    firstTimeFixRate: overrides.firstTimeFixRate ?? 80,
    avgResolutionMin: overrides.avgResolutionMin ?? 50,
    evidenceCompliance: overrides.evidenceCompliance ?? 85,
    repeatFailureRate: overrides.repeatFailureRate ?? 8,
    avgCostPerJob: baseCost,
    activeContracts: overrides.activeContracts ?? 1,
    contractExpiry: overrides.contractExpiry ?? 'Dec 2026',
    sites: overrides.sites ?? [],
    jobsLast30d: overrides.jobsLast30d ?? 20,
    insights: overrides.insights ?? [
      `${overrides.name} has been registered and is pending first full performance review.`,
      'Baseline KPIs have been configured. Monitor SLA compliance and evidence submission over the next 30 days.',
    ],
    anomaly: overrides.anomaly ?? null,
    contractFlags: overrides.contractFlags ?? [],
    predictedRisk30d: overrides.predictedRisk30d ?? 20,
    projectedTrend: overrides.projectedTrend ?? trend,
    recommendations: overrides.recommendations ?? [
      { title: 'Complete initial onboarding review', detail: 'Schedule a 30-day performance review to validate baseline KPI data and confirm SLA targets are being met.', action: 'review' },
    ],
    dependencyRisk: overrides.dependencyRisk ?? 'Low',
    dependencyNote: overrides.dependencyNote ?? '',
    address: overrides.address ?? { street: '', city: '', country: '' },
    poc: overrides.poc ?? { name: '', title: '', phone: '', email: '' },
    costTrend: overrides.costTrend ?? months.map((month, i) => ({
      month,
      cost: Math.round(baseCost * (0.95 + i * 0.01)),
      peerAvg: 468,
    })),
    scoreTrend: overrides.scoreTrend ?? months.map((month, i) => ({
      month,
      score: Math.round(baseSla * 0.9 + i * 0.5),
    })),
  };
}
