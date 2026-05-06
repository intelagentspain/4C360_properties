import { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Database,
  FileText,
  GitBranch,
  HandCoins,
  Lightbulb,
  Link2,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  WalletCards,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AIInsightBadge } from '../components/AIInsightBadge';
import { AIInsightPanel } from '../components/AIInsightPanel';
import { CostIntelligenceFrame } from '../components/CostIntelligenceFrame';
import { getBudgetControlData, type ActualCost, type BudgetPackage, type Commitment, type CostRisk, type VariationOrder } from '../data/budgetControl';
import { useSelectedProjectCommandData } from '../useProjectCommandData';
import type { MetricName } from '../useMetricInsight';

type SectionId = 'summary' | 'packages' | 'commitments' | 'variations' | 'cashflow' | 'risks' | 'ai';

const sections: { id: SectionId; label: string }[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'packages', label: 'Packages' },
  { id: 'commitments', label: 'Commitments & Actuals' },
  { id: 'variations', label: 'Variations' },
  { id: 'cashflow', label: 'Cashflow' },
  { id: 'risks', label: 'Risks & AI' },
];

const metricMap: Record<string, MetricName> = {
  'Cost Variance': 'Cost Variance',
  CPI: 'CPI',
  SPI: 'SPI',
  EAC: 'Forecast at Completion',
  TCPI: 'TCPI',
  'Forecast at Completion': 'Forecast at Completion',
  'Contingency Remaining': 'Contingency Remaining',
  'Pending Variations': 'Pending Exposure',
};

function money(value: number) {
  const abs = Math.abs(value);
  const amount = abs >= 1_000_000 ? `${Math.round(abs / 1_000_000)}M` : `${Math.round(abs / 1_000)}K`;
  return `${value < 0 ? '-' : ''}AED ${amount}`;
}

function SourceChip({ label }: { label: string }) {
  return <span className="rounded-full border border-[rgba(46,127,255,0.22)] bg-[#07111F] px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-[#7A94B4]">{label}</span>;
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  badge,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  badge?: string;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#7C3AED]/24 bg-[#7C3AED]/12 text-[#C4B5FD]">
          <Icon size={18} />
        </span>
        <div>
          <h2 className="text-lg font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{title}</h2>
          <p className="mt-1 max-w-3xl text-[12px] leading-5 text-[#7A94B4]">{subtitle}</p>
        </div>
      </div>
      {badge && <SourceChip label={badge} />}
    </div>
  );
}

function StatusPill({ children, tone = 'blue' }: { children: React.ReactNode; tone?: 'blue' | 'green' | 'amber' | 'red' | 'violet' }) {
  const styles = {
    blue: 'border-blue-400/25 bg-blue-400/10 text-blue-200',
    green: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200',
    amber: 'border-amber-400/25 bg-amber-400/10 text-amber-200',
    red: 'border-red-400/25 bg-red-400/10 text-red-200',
    violet: 'border-violet-400/25 bg-violet-400/10 text-violet-100',
  };
  return <span className={`inline-flex rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-wide ${styles[tone]}`}>{children}</span>;
}

function MoneyFlow({ items }: { items: string[] }) {
  return (
    <div className="mt-4 grid gap-2 lg:grid-cols-9">
      {items.map((item, index) => (
        <div key={item} className="flex items-center gap-2 lg:contents">
          <div className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#07111F] px-3 py-2 text-center text-[10px] font-black uppercase tracking-[0.12em] text-[#B8C7DB]">
            {item}
          </div>
          {index < items.length - 1 && <ArrowRight className="hidden text-[#5A6E88] lg:block lg:self-center" size={14} />}
        </div>
      ))}
    </div>
  );
}

function PackageHealth({ pkg }: { pkg: BudgetPackage }) {
  const forecastPct = Math.round((pkg.forecastCost / Math.max(pkg.revisedBudget, 1)) * 100);
  const actualPct = Math.round((pkg.actualCost / Math.max(pkg.revisedBudget, 1)) * 100);
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wide text-[#7A94B4]">
        <span>Actual vs revised</span>
        <span>{actualPct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-[#122240]"><div className="h-full rounded-full bg-[#7EB8F7]" style={{ width: `${Math.min(actualPct, 100)}%` }} /></div>
      <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wide text-[#7A94B4]">
        <span>Forecast pressure</span>
        <span>{forecastPct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-[#122240]"><div className={`h-full rounded-full ${forecastPct > 105 ? 'bg-red-400' : forecastPct > 100 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${Math.min(forecastPct, 120) / 1.2}%` }} /></div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  source,
  updated,
  tone = '#EEF3FA',
  onAi,
}: {
  label: string;
  value: string;
  source: string;
  updated: string;
  tone?: string;
  onAi: () => void;
}) {
  return (
    <button className="group relative rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-3 text-left transition-colors hover:border-[rgba(46,127,255,0.35)]">
      <AIInsightBadge onClick={onAi} />
      <div className="pr-14 text-[10px] font-black uppercase tracking-[0.16em] text-[#7A94B4]">{label}</div>
      <div className="mt-2 font-mono text-[19px] font-black" style={{ color: tone }}>{value}</div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <SourceChip label={source} />
        <span className="text-[10px] text-[#5A6E88]">{updated}</span>
      </div>
    </button>
  );
}

function PackageDrawer({
  pkg,
  commitments,
  actuals,
  variations,
  risks,
  onClose,
}: {
  pkg: BudgetPackage;
  commitments: Commitment[];
  actuals: ActualCost[];
  variations: VariationOrder[];
  risks: CostRisk[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-y-0 right-0 z-[2600] flex w-full max-w-[520px] flex-col border-l border-[rgba(46,127,255,0.22)] bg-[#07111F] shadow-2xl shadow-black/50">
      <div className="border-b border-[rgba(46,127,255,0.16)] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-bold text-[#00D8FF]">{pkg.code}</span>
              <StatusPill tone={pkg.riskLevel === 'critical' ? 'red' : pkg.riskLevel === 'high' ? 'amber' : 'green'}>{pkg.riskLevel} risk</StatusPill>
            </div>
            <h2 className="mt-2 text-2xl font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{pkg.name}</h2>
            <p className="mt-1 text-[12px] text-[#7A94B4]">Connected cost package with programme, vendor, claims, risks, and evidence links.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-[#7A94B4] hover:bg-white/5 hover:text-white" aria-label="Close package drawer"><X size={18} /></button>
        </div>
      </div>
      <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-5">
        <div className="grid grid-cols-2 gap-3">
          {[
            ['Revised budget', money(pkg.revisedBudget)],
            ['Forecast', money(pkg.forecastCost)],
            ['Committed', money(pkg.committedCost)],
            ['Actual', money(pkg.actualCost)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#0A1628] p-3">
              <p className="text-[9px] font-bold uppercase tracking-wide text-[#7A94B4]">{label}</p>
              <p className="mt-1 font-mono text-sm font-black text-[#EEF3FA]">{value}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-[#7C3AED]/22 bg-[#7C3AED]/10 p-4">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#E9D5FF]"><Sparkles size={14} /> Package control position</div>
          <PackageHealth pkg={pkg} />
          <p className="mt-3 text-[12px] leading-5 text-[#B8C7DB]">
            This package is controlled by its revised budget, committed cost, actual cost, open variations, linked vendor claims, and programme delay exposure.
          </p>
        </div>

        <section className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#0A1628] p-4">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#C4B5FD]"><GitBranch size={14} /> Connected links</div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between rounded-lg bg-[#07111F] px-3 py-2 text-[12px]"><span className="text-[#7A94B4]">Programme phase</span><span className="font-bold text-[#DDE6F8]">{pkg.linkedProgrammePhase}</span></div>
            <div className="flex items-center justify-between rounded-lg bg-[#07111F] px-3 py-2 text-[12px]"><span className="text-[#7A94B4]">Vendor</span><span className="font-bold text-[#DDE6F8]">{pkg.linkedVendorNames.join(', ')}</span></div>
            <div className="flex items-center justify-between rounded-lg bg-[#07111F] px-3 py-2 text-[12px]"><span className="text-[#7A94B4]">Vendor score</span><span className="font-bold text-emerald-300">{pkg.vendorScore}</span></div>
            <div className="flex items-center justify-between rounded-lg bg-[#07111F] px-3 py-2 text-[12px]"><span className="text-[#7A94B4]">Open claims</span><span className="font-mono font-bold text-amber-200">{money(pkg.openClaims)}</span></div>
            <div className="flex items-center justify-between rounded-lg bg-[#07111F] px-3 py-2 text-[12px]"><span className="text-[#7A94B4]">Disputed amount</span><span className="font-mono font-bold text-red-200">{money(pkg.disputedAmount)}</span></div>
          </div>
        </section>

        <section className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#0A1628] p-4">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#C4B5FD]"><HandCoins size={14} /> Contracts & commitments</div>
          <div className="space-y-2">
            {commitments.map(item => (
              <div key={item.id} className="rounded-lg bg-[#07111F] px-3 py-2 text-[12px]">
                <div className="flex items-center justify-between gap-3"><span className="font-bold text-[#DDE6F8]">{item.contractRef}</span><span className="font-mono text-[#00B894]">{money(item.committedAmount)}</span></div>
                <p className="mt-1 text-[10px] text-[#7A94B4]">{item.vendorName} - {item.status} - pending {money(item.pendingAmount)}</p>
              </div>
            ))}
            {commitments.length === 0 && <p className="text-[12px] text-[#7A94B4]">No commitment records connected yet.</p>}
          </div>
        </section>

        <section className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#0A1628] p-4">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#C4B5FD]"><FileText size={14} /> Actuals, variations & evidence</div>
          <div className="grid gap-2">
            {actuals.map(item => (
              <div key={item.id} className="flex items-center justify-between rounded-lg bg-[#07111F] px-3 py-2 text-[12px]">
                <div><span className="font-bold text-[#DDE6F8]">{item.invoiceRef}</span><p className="mt-1 text-[10px] text-[#7A94B4]">{item.source} - {item.status}</p></div>
                <span className="font-mono text-[#7EB8F7]">{money(item.amount)}</span>
              </div>
            ))}
            {variations.map(vo => (
              <div key={vo.id} className="rounded-lg border border-amber-400/16 bg-amber-400/8 px-3 py-2 text-[12px]">
                <div className="flex items-center justify-between gap-3"><span className="font-bold text-amber-100">{vo.id} - {vo.title}</span><span className="font-mono text-amber-100">{money(vo.amount)}</span></div>
                <p className="mt-1 text-[10px] text-[#B8C7DB]">{vo.status} - {vo.programmeImpact}</p>
              </div>
            ))}
            <div className="rounded-lg border border-[rgba(46,127,255,0.14)] bg-[#07111F] px-3 py-2 text-[12px]">
              <span className="font-bold text-[#DDE6F8]">Linked evidence</span>
              <p className="mt-1 text-[10px] text-[#7A94B4]">Invoices, claim backup, site photos, approval records, and programme impact notes are attached to this package for audit traceability.</p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-red-400/20 bg-red-400/8 p-4">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-red-200"><ShieldAlert size={14} /> Programme-driven cost exposure</div>
          <p className="text-[13px] leading-6 text-[#DDE6F8]">{pkg.name} has {pkg.programmeDelayDays} delay days creating {money(pkg.programmeCostExposure)} exposure. Recovery cost is estimated at {money(pkg.recoveryCost)}.</p>
        </section>

        <section className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#0A1628] p-4">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#C4B5FD]"><BrainCircuit size={14} /> AI explanation</div>
          <p className="text-[13px] leading-6 text-[#DDE6F8]">Variance is driven by the gap between revised budget and forecast cost. AI is using linked programme delay, vendor claims, approved changes, actual invoices, and risk exposure to explain this package.</p>
          <div className="mt-3 space-y-2">
            {risks.map(risk => (
              <div key={risk.id} className="rounded-lg bg-[#07111F] px-3 py-2 text-[11px] text-[#B8C7DB]">
                <span className="font-bold text-red-200">{risk.title}</span> - expected impact {money(risk.expectedImpact)}. {risk.mitigation}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export function CostIntelligence() {
  const { project, evmSummary } = useSelectedProjectCommandData();
  const data = useMemo(() => getBudgetControlData(project), [project]);
  const [activeSection, setActiveSection] = useState<SectionId>('summary');
  const [selectedPackage, setSelectedPackage] = useState<BudgetPackage | null>(null);
  const [aiMetric, setAiMetric] = useState<{ name: MetricName; value: string | number } | null>(null);

  const totals = useMemo(() => {
    const revisedBudget = data.packages.reduce((sum, item) => sum + item.revisedBudget, 0);
    const committed = data.packages.reduce((sum, item) => sum + item.committedCost, 0);
    const actual = data.packages.reduce((sum, item) => sum + item.actualCost, 0);
    const pendingVariations = data.variations.filter(item => !['Approved', 'Rejected'].includes(item.status)).reduce((sum, item) => sum + item.amount, 0);
    const approvedChanges = data.packages.reduce((sum, item) => sum + item.approvedChanges, 0);
    const contingencyRemaining = data.budget.contingency - Math.max(0, data.evm.eac - data.budget.approvedBudget) - pendingVariations * 0.35;
    return { revisedBudget, committed, actual, pendingVariations, approvedChanges, contingencyRemaining };
  }, [data]);

  const summaryCards = [
    { label: 'Approved Budget', value: money(data.budget.approvedBudget), source: 'Project baseline', updated: data.lastSync, tone: '#EEF3FA' },
    { label: 'Revised Budget', value: money(totals.revisedBudget), source: 'Baseline + approved VOs', updated: data.lastSync, tone: '#C8A020' },
    { label: 'Committed Cost', value: money(totals.committed), source: 'Vendor contracts', updated: data.lastSync, tone: '#00B894' },
    { label: 'Actual Cost', value: money(totals.actual), source: 'Actuals register', updated: data.lastSync, tone: '#7EB8F7' },
    { label: 'Forecast at Completion', value: money(data.evm.eac), source: 'AI forecast', updated: data.lastSync, tone: '#7C3AED' },
    { label: 'Cost Variance', value: money(data.evm.costVariance), source: 'Earned value', updated: data.lastSync, tone: data.evm.costVariance < 0 ? '#FF4B4B' : '#00B894' },
    { label: 'Pending Variations', value: money(totals.pendingVariations), source: 'VO pipeline', updated: data.lastSync, tone: '#D97706' },
    { label: 'Contingency Remaining', value: money(totals.contingencyRemaining), source: 'Budget reserve', updated: data.lastSync, tone: totals.contingencyRemaining < 0 ? '#FF4B4B' : '#00B894' },
  ];

  const breakdownChart = data.packages.map(pkg => ({
    name: pkg.name,
    revised: Math.round(pkg.revisedBudget / 1_000_000),
    forecast: Math.round(pkg.forecastCost / 1_000_000),
    variance: Math.round(pkg.variance / 1_000_000),
  }));

  return (
    <div className="custom-scrollbar h-full overflow-x-hidden overflow-y-auto px-5 py-4 text-[#EEF3FA]">
      <div className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#C4B5FD]"><WalletCards size={15} /> Budget Control</div>
            <h1 className="mt-2 text-2xl font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{project.name} cost operating layer</h1>
            <p className="mt-1 max-w-4xl text-[13px] leading-6 text-[#B8C7DB]">Budget Control connects baseline, work packages, vendor commitments, actual costs, variations, cashflow, cost risks, and AI forecast into one live cost position.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.sourceHealth.map(source => (
              <StatusPill key={source.label} tone={source.status === 'healthy' ? 'green' : source.status === 'warning' ? 'amber' : 'red'}>{source.label}</StatusPill>
            ))}
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#07111F] px-3 py-2 text-[12px] text-[#B8C7DB]">
          Budget data synced from: Project baseline, Vendor contracts, Manual actuals, Variation orders, AI forecast. Last sync: <span className="font-bold text-[#DDE6F8]">{data.lastSync}</span>
        </div>
        <MoneyFlow items={['Project creation', 'Budget baseline', 'Cost codes', 'Vendor contracts', 'Actual costs', 'Variations', 'Cashflow', 'AI forecast', 'Manager action']} />
      </div>

      <div className="sticky top-0 z-20 mt-4 flex flex-wrap gap-2 border-b border-[rgba(46,127,255,0.12)] bg-[#0A1628]/95 py-2 backdrop-blur">
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => {
              setActiveSection(section.id);
              document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className={`rounded-xl border px-3 py-2 text-[11px] font-black transition-colors ${activeSection === section.id ? 'border-[#7C3AED]/55 bg-[#7C3AED]/18 text-[#E9D5FF]' : 'border-[rgba(46,127,255,0.14)] bg-[#07111F] text-[#7A94B4] hover:text-[#EEF3FA]'}`}
          >
            {section.label}
          </button>
        ))}
      </div>

      <section id="summary" className="mt-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map(card => (
            <KpiCard
              key={card.label}
              {...card}
              onAi={() => setAiMetric({ name: metricMap[card.label] ?? 'Cost Variance', value: card.value })}
            />
          ))}
        </div>
        <div className="mt-3 grid gap-3 xl:grid-cols-[1fr_1fr_1.2fr]">
          <div className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#07111F] p-4">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#7EB8F7]"><Database size={14} /> Source clarity</div>
            <p className="text-[12px] leading-5 text-[#B8C7DB]">Every number on this page is driven by a source register: project baseline, package budgets, vendor commitments, approved actuals, variation orders, and AI forecast signals.</p>
          </div>
          <div className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#07111F] p-4">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#C4B5FD]"><BrainCircuit size={14} /> Earned value logic</div>
            <p className="text-[12px] leading-5 text-[#B8C7DB]">CPI compares earned value to actual cost. SPI compares earned value to planned value. EAC projects final cost using actuals, variations, and risk exposure.</p>
          </div>
          <div className="rounded-xl border border-amber-400/18 bg-amber-400/8 p-4">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-amber-100"><AlertTriangle size={14} /> Controls needing attention</div>
            <div className="flex flex-wrap gap-2">
              {data.missingDataWarnings.map(warning => <span key={warning} className="rounded-full border border-amber-300/20 bg-[#07111F] px-3 py-1 text-[10px] font-bold text-amber-100">{warning}</span>)}
            </div>
          </div>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          {[
            { label: 'CPI', value: evmSummary.cpi.toFixed(2), tone: evmSummary.cpi < 1 ? '#D97706' : '#00B894' },
            { label: 'SPI', value: evmSummary.spi.toFixed(2), tone: evmSummary.spi < 1 ? '#D97706' : '#00B894' },
            { label: 'EAC', value: money(data.evm.eac), tone: '#7C3AED' },
            { label: 'TCPI', value: data.evm.tcpi.toFixed(2), tone: data.evm.tcpi > 1 ? '#D97706' : '#00B894' },
          ].map(metric => (
            <KpiCard key={metric.label} label={metric.label} value={metric.value} source="Earned value snapshot" updated={data.lastSync} tone={metric.tone} onAi={() => setAiMetric({ name: metricMap[metric.label], value: metric.value })} />
          ))}
        </div>
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-4">
          <section id="packages" className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
            <SectionHeader icon={ClipboardList} title="Cost Breakdown by Package" subtitle="Every row links baseline budget, approved changes, commitments, actual cost, forecast, programme phase, vendor, and risk. Click a package to drill into its source trail." badge={`${data.packages.length} cost codes`} />
            <div className="mb-4 h-[230px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdownChart} margin={{ left: -20, right: 12 }}>
                  <CartesianGrid stroke="rgba(46,127,255,0.16)" strokeDasharray="3 5" />
                  <XAxis dataKey="name" tick={{ fill: '#7A94B4', fontSize: 9 }} interval={0} />
                  <YAxis tick={{ fill: '#7A94B4', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#0A1628', border: '1px solid rgba(46,127,255,0.35)', borderRadius: 10, color: '#EEF3FA' }} />
                  <Bar dataKey="revised" fill="#C8A020" radius={[5, 5, 0, 0]} />
                  <Bar dataKey="forecast" fill="#7C3AED" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[1180px] w-full text-left text-[11px]">
                <thead className="text-[9px] uppercase tracking-[0.15em] text-[#7A94B4]">
                  <tr className="border-b border-[rgba(46,127,255,0.14)]">
                    {['Package', 'Baseline', 'Changes', 'Revised', 'Committed', 'Actual', 'Forecast', 'Variance', 'Vendor', 'Linked Phase', 'Risk'].map(head => <th key={head} className="px-3 py-3">{head}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {data.packages.map(pkg => (
                    <tr key={pkg.id} onClick={() => setSelectedPackage(pkg)} className="cursor-pointer border-b border-[rgba(46,127,255,0.08)] transition-colors hover:bg-[#07111F]">
                      <td className="px-3 py-3 font-bold text-[#EEF3FA]"><div>{pkg.name}</div><div className="font-mono text-[10px] text-[#00D8FF]">{pkg.code}</div></td>
                      <td className="px-3 py-3 font-mono">{money(pkg.baselineBudget)}</td>
                      <td className="px-3 py-3 font-mono text-[#C8A020]">{money(pkg.approvedChanges)}</td>
                      <td className="px-3 py-3 font-mono">{money(pkg.revisedBudget)}</td>
                      <td className="px-3 py-3 font-mono text-[#00B894]">{money(pkg.committedCost)}</td>
                      <td className="px-3 py-3 font-mono text-[#7EB8F7]">{money(pkg.actualCost)}</td>
                      <td className="px-3 py-3 font-mono text-[#C4B5FD]">{money(pkg.forecastCost)}</td>
                      <td className={`px-3 py-3 font-mono font-bold ${pkg.variance > 0 ? 'text-red-300' : 'text-emerald-300'}`}>{money(pkg.variance)}</td>
                      <td className="px-3 py-3 text-[#B8C7DB]">{pkg.linkedVendorNames[0]}</td>
                      <td className="px-3 py-3 text-[#B8C7DB]">{pkg.linkedProgrammePhase}</td>
                      <td className="px-3 py-3"><StatusPill tone={pkg.riskLevel === 'critical' ? 'red' : pkg.riskLevel === 'high' ? 'amber' : 'green'}>{pkg.riskLevel}</StatusPill></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="commitments" className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
              <SectionHeader icon={HandCoins} title="Commitments" subtitle="Awarded contracts, approved commitments, and pending vendor exposure before cost becomes actual spend." />
              <div className="space-y-2">
                {data.commitments.slice(0, 5).map(item => (
                  <div key={item.id} className="rounded-lg bg-[#07111F] p-3">
                    <div className="flex items-center justify-between"><span className="font-mono text-[10px] text-[#00D8FF]">{item.contractRef}</span><StatusPill tone={item.status === 'awarded' ? 'green' : 'amber'}>{item.status}</StatusPill></div>
                    <div className="mt-1 text-[12px] font-bold">{item.vendorName}</div>
                    <div className="mt-1 text-[11px] text-[#7A94B4]">Committed {money(item.committedAmount)} - pending {money(item.pendingAmount)}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
              <SectionHeader icon={FileText} title="Actual Costs" subtitle="Approved and pending cost entries with explicit source tags from ERP sync, invoice upload, manual input, vendor claim, or approved VO." />
              <div className="space-y-2">
                {data.actualCosts.slice(0, 6).map(item => (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg bg-[#07111F] p-3">
                    <div>
                      <div className="font-mono text-[10px] text-[#7A94B4]">{item.invoiceRef}</div>
                      <div className="mt-1 text-[12px] font-bold">{money(item.amount)}</div>
                    </div>
                    <div className="text-right">
                      <SourceChip label={item.source} />
                      <div className="mt-1 text-[10px] text-[#7A94B4]">{item.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <CostIntelligenceFrame />

          <section id="cashflow" className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Cashflow Forecast</h2>
                <p className="text-[12px] text-[#7A94B4]">Calculated from baseline schedule, package progress, committed costs, approved variations, and forecast risks.</p>
              </div>
              <button onClick={() => setAiMetric({ name: 'Pending Exposure', value: money(totals.pendingVariations) })} className="relative rounded-full border border-violet-300/25 bg-violet-400/10 px-3 py-1 text-[10px] font-black text-violet-100">
                <Sparkles size={12} className="mr-1 inline" /> Explain cashflow drift
              </button>
            </div>
            <div className="h-[270px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data.cashflow} margin={{ left: -10, right: 14 }}>
                  <CartesianGrid stroke="rgba(46,127,255,0.16)" strokeDasharray="3 5" />
                  <XAxis dataKey="month" tick={{ fill: '#7A94B4', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#7A94B4', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#0A1628', border: '1px solid rgba(46,127,255,0.35)', borderRadius: 10, color: '#EEF3FA' }} />
                  <Bar dataKey="plannedOutflow" fill="#C8A020" radius={[5, 5, 0, 0]} />
                  <Bar dataKey="forecastOutflow" fill="#D92B1C" radius={[5, 5, 0, 0]} />
                  <Line dataKey="netPosition" stroke="#00B894" strokeWidth={2.4} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              <div className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#07111F] p-3">
                <p className="text-[9px] font-black uppercase tracking-wide text-[#7A94B4]">Outflow basis</p>
                <p className="mt-1 text-[12px] leading-5 text-[#B8C7DB]">Baseline schedule plus package progress and committed cost drawdown.</p>
              </div>
              <div className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#07111F] p-3">
                <p className="text-[9px] font-black uppercase tracking-wide text-[#7A94B4]">Forecast drift</p>
                <p className="mt-1 text-[12px] leading-5 text-[#B8C7DB]">Open VOs and cost risks shift future outflow above the planned curve.</p>
              </div>
              <div className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#07111F] p-3">
                <p className="text-[9px] font-black uppercase tracking-wide text-[#7A94B4]">Income view</p>
                <p className="mt-1 text-[12px] leading-5 text-[#B8C7DB]">Payment certificates are compared against forecast outflow to show net position.</p>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section id="variations" className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
            <SectionHeader icon={RefreshCw} title="Variations / Change Orders" subtitle="Decision queue for commercial movement. Each VO links to package, vendor, risk, evidence, and programme impact." />
            <div className="grid grid-cols-3 gap-2 pb-3">
              <div className="rounded-lg bg-[#07111F] p-2"><div className="text-[9px] text-[#7A94B4]">Pending Exposure</div><div className="font-mono text-[12px] font-black text-amber-200">{money(totals.pendingVariations)}</div></div>
              <div className="rounded-lg bg-[#07111F] p-2"><div className="text-[9px] text-[#7A94B4]">Approved</div><div className="font-mono text-[12px] font-black text-emerald-200">{money(totals.approvedChanges)}</div></div>
              <div className="rounded-lg bg-[#07111F] p-2"><div className="text-[9px] text-[#7A94B4]">Awaiting</div><div className="font-mono text-[12px] font-black text-[#EEF3FA]">{data.variations.filter(v => v.status !== 'Approved').length}</div></div>
            </div>
            <div className="space-y-2">
              {data.variations.map(vo => (
                <div key={vo.id} className="rounded-lg border border-[rgba(46,127,255,0.14)] bg-[#07111F] p-3">
                  <div className="flex items-center justify-between gap-2"><span className="font-mono text-[10px] font-bold text-[#00D8FF]">{vo.id}</span><StatusPill tone={vo.status === 'Approved' ? 'green' : vo.status.includes('Pending') ? 'amber' : 'violet'}>{vo.status}</StatusPill></div>
                  <div className="mt-2 text-[12px] font-bold">{vo.title}</div>
                  <div className="mt-2 grid gap-1 text-[10px] text-[#7A94B4]">
                    <span>{vo.vendorName} - {money(vo.amount)}</span>
                    <span>Package: {data.packages.find(pkg => pkg.id === vo.packageId)?.name}</span>
                    <span>Programme: {vo.programmeImpact}</span>
                    <span>Decision due: {vo.decisionDue} by {vo.approvalOwner}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <SourceChip label="Package linked" />
                    <SourceChip label="Vendor linked" />
                    <SourceChip label={vo.linkedRiskId ? 'Risk linked' : 'Risk missing'} />
                    <SourceChip label="Evidence required" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section id="risks" className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
            <SectionHeader icon={ShieldAlert} title="Cost Risks & Exposure" subtitle="Risk exposure is included in forecast at completion only where probability and expected impact justify it." />
            <div className="space-y-2">
              {data.risks.map(risk => (
                <div key={risk.id} className="rounded-lg bg-[#07111F] p-3">
                  <div className="flex justify-between gap-3"><span className="text-[12px] font-bold">{risk.title}</span><span className="font-mono text-[11px] text-red-200">{money(risk.exposure)}</span></div>
                  <p className="mt-1 text-[10px] leading-4 text-[#7A94B4]">{risk.mitigation}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-[#7C3AED]/25 bg-[#7C3AED]/10 p-4">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#E9D5FF]"><BrainCircuit size={14} /> AI Cost Narrative</div>
            <p className="text-[13px] leading-6 text-[#DDE6F8]">{data.aiNarrative}</p>
            <div className="mt-3 rounded-xl border border-[#7C3AED]/18 bg-[#07111F] p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#C4B5FD]">AI used</p>
              <p className="mt-1 text-[12px] leading-5 text-[#B8C7DB]">Package variance, CPI/SPI, pending variations, vendor claims, programme delay exposure, risk probability, and remaining contingency.</p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {['Create Cost Risk', 'Request Vendor Clarification', 'Escalate Variation', 'Simulate Recovery'].map(action => (
                <button key={action} className="rounded-lg border border-[#7C3AED]/25 bg-[#07111F] px-2 py-2 text-[10px] font-bold text-[#C4B5FD] hover:bg-[#7C3AED]/16">{action}</button>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
            <SectionHeader icon={Lightbulb} title="Manager Decision Panel" subtitle="The page resolves into actions: approvals, claims, contingency protection, and forecast review." />
            <div className="space-y-2">
              {data.managerActions.map(action => (
                <button key={action.title} className="flex w-full items-start justify-between gap-3 rounded-lg border border-[rgba(46,127,255,0.12)] bg-[#07111F] p-3 text-left transition-colors hover:border-[#7C3AED]/35 hover:bg-[#0E1E35]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-[12px] font-bold text-[#EEF3FA]">{action.title}</div>
                      <StatusPill tone={action.urgency === 'critical' ? 'red' : action.urgency === 'high' ? 'amber' : 'violet'}>{action.urgency}</StatusPill>
                    </div>
                    <div className="mt-1 text-[10px] leading-4 text-[#7A94B4]">{action.detail}</div>
                    <div className="mt-2 text-[10px] font-bold text-[#C4B5FD]">Open action</div>
                  </div>
                  <ChevronRight size={15} className="mt-1 text-[#7A94B4]" />
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-amber-400/20 bg-amber-400/8 p-4">
            <h3 className="mb-2 text-sm font-black text-amber-100">Missing data warnings</h3>
            <div className="space-y-2">
              {data.missingDataWarnings.map(warning => (
                <div key={warning} className="flex gap-2 text-[12px] leading-5 text-amber-100"><AlertTriangle size={14} className="mt-0.5 shrink-0" /> {warning}</div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <AnimatePresence>
        {selectedPackage && (
          <PackageDrawer
            pkg={selectedPackage}
            commitments={data.commitments.filter(item => item.packageId === selectedPackage.id)}
            actuals={data.actualCosts.filter(item => item.packageId === selectedPackage.id)}
            variations={data.variations.filter(item => item.packageId === selectedPackage.id)}
            risks={data.risks.filter(item => item.packageId === selectedPackage.id)}
            onClose={() => setSelectedPackage(null)}
          />
        )}
        {aiMetric && <AIInsightPanel metricName={aiMetric.name} value={aiMetric.value} onClose={() => setAiMetric(null)} />}
      </AnimatePresence>
    </div>
  );
}
