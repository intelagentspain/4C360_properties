import { useState } from 'react';
import {
  Plus, Search, X, ChevronRight, ChevronLeft, Brain, AlertTriangle,
  Wrench, Clock, Package, Zap, BarChart3, FileText, ShieldAlert,
  CheckCircle, ArrowUpRight, TrendingDown, Activity, Cpu,
} from 'lucide-react';
import type { ToastFn } from '@/lib/ui';

interface Props {
  onToast: ToastFn;
}

type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';
type AssetStatus = 'active' | 'inactive' | 'maintenance' | 'warning' | 'critical';

interface AssetPart {
  name: string;
  stockLevel: number;
  threshold: number;
  leadTimeDays: number;
  critical: boolean;
}

interface TimelineEntry {
  type: 'work_order' | 'incident' | 'inspection' | 'maintenance';
  title: string;
  date: string;
  status: string;
  by?: string;
}

interface RichAsset {
  id: string;
  name: string;
  type: string;
  client: string;
  location: string;
  status: AssetStatus;
  condition: number;
  lastServiceDays: number;
  nextPPMDays: number;
  incidentCount30d: number;
  ppmsOverdue: number;
  slaBreaches: number;
  hasPartsShortage: boolean;
  healthScore: number;
  riskLevel: RiskLevel;
  failureProbability: number;
  lastActivity: string;
  aiObservations: string[];
  aiAnomalies: string[];
  aiPredicted: string[];
  aiInterpretation: string;
  timeline: TimelineEntry[];
  parts: AssetPart[];
  degradationSignals: string[];
  interventionWindow: string;
}

function deriveHealthScore(asset: Omit<RichAsset, 'healthScore' | 'riskLevel' | 'failureProbability'>) {
  let score = asset.condition;
  if (asset.lastServiceDays > 60) score -= 10;
  if (asset.lastServiceDays > 90) score -= 8;
  if (asset.ppmsOverdue > 0) score -= 12 * asset.ppmsOverdue;
  if (asset.incidentCount30d > 0) score -= 5 * asset.incidentCount30d;
  if (asset.slaBreaches > 0) score -= 4 * asset.slaBreaches;
  if (asset.hasPartsShortage) score -= 8;
  if (asset.status === 'critical') score -= 10;
  if (asset.status === 'warning') score -= 5;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function deriveRisk(health: number): RiskLevel {
  if (health >= 80) return 'Low';
  if (health >= 60) return 'Medium';
  if (health >= 40) return 'High';
  return 'Critical';
}

function deriveFailureProbability(health: number, incidents: number, ppmsOverdue: number): number {
  const base = 100 - health;
  const incidentBoost = incidents * 4;
  const ppmBoost = ppmsOverdue * 8;
  return Math.min(98, Math.round(base * 0.6 + incidentBoost + ppmBoost));
}

const RAW_ASSETS = [
  {
    id: 'AST-001', name: 'Chiller Unit C-04', type: 'HVAC', client: 'Emaar — Silicon Oasis',
    location: 'Block C Gym, Silicon Oasis', status: 'warning' as AssetStatus, condition: 72,
    lastServiceDays: 83, nextPPMDays: 8, incidentCount30d: 2, ppmsOverdue: 0, slaBreaches: 1,
    hasPartsShortage: true, lastActivity: '2d ago — AC fault report',
    aiObservations: ['Refrigerant level at 72%', 'Evaporator coil frost pattern detected', 'Compressor inlet pressure below nominal'],
    aiAnomalies: ['Unusual thermal signature at 3AM cycles', 'Delta-T deviation: +4°C from baseline'],
    aiPredicted: ['Refrigerant full depletion within 4–6 days', 'Compressor seizure risk if left unaddressed'],
    aiInterpretation: 'Asset is operating under stress. The combination of low refrigerant, thermal anomalies, and recent SLA breach signals a deteriorating condition requiring immediate corrective action before failure.',
    degradationSignals: ['Low refrigerant pressure', 'Frost on evaporator coil', 'Rising discharge temperature'],
    interventionWindow: '3–5 days',
    timeline: [
      { type: 'incident' as const, title: 'AC Not Cooling — Villa 23', date: '2 days ago', status: 'Open', by: 'Resident App' },
      { type: 'work_order' as const, title: 'Refrigerant Top-Up Attempt', date: '5 days ago', status: 'Closed', by: 'Karim R.' },
      { type: 'inspection' as const, title: 'PPM Quarterly Check', date: '83 days ago', status: 'Completed', by: 'Karim R.' },
      { type: 'maintenance' as const, title: 'Filter Replacement', date: '120 days ago', status: 'Completed', by: 'Omar T.' },
    ],
    parts: [
      { name: 'R-410A Refrigerant 10kg', stockLevel: 0, threshold: 2, leadTimeDays: 3, critical: true },
      { name: 'Evaporator Coil Filter', stockLevel: 3, threshold: 5, leadTimeDays: 1, critical: false },
      { name: 'Thermostat Module', stockLevel: 7, threshold: 2, leadTimeDays: 2, critical: false },
      { name: 'Condenser Drive Belt', stockLevel: 12, threshold: 3, leadTimeDays: 5, critical: false },
    ],
  },
  {
    id: 'AST-002', name: 'Lift — Cluster A Block 2', type: 'Lift', client: 'Emaar — Silicon Oasis',
    location: 'Cluster A, Block 2', status: 'critical' as AssetStatus, condition: 58,
    lastServiceDays: 29, nextPPMDays: 2, incidentCount30d: 3, ppmsOverdue: 1, slaBreaches: 2,
    hasPartsShortage: false, lastActivity: '1d ago — vibration alert',
    aiObservations: ['Motor vibration 2.1× above baseline', 'Brake pad wear at 78%', 'Door sensor intermittent fault'],
    aiAnomalies: ['Unexpected speed variation at floors 4 and 7', 'Hydraulic pressure drop during peak hours'],
    aiPredicted: ['Brake pad replacement overdue within 2 days', 'Door mechanism failure within 7–10 days'],
    aiInterpretation: 'Critical lift asset showing multiple concurrent degradation signals. Motor vibration anomaly combined with brake wear and an overdue PPM creates a compounding risk. Immediate shutdown risk if brake system is not addressed.',
    degradationSignals: ['Motor vibration anomaly', 'Brake pad wear 78%', 'Door sensor fault'],
    interventionWindow: 'Immediate — within 48 hours',
    timeline: [
      { type: 'incident' as const, title: 'Vibration Alarm Triggered', date: '1 day ago', status: 'Open', by: 'BMS Sensor' },
      { type: 'inspection' as const, title: 'Quarterly Safety Inspection', date: '29 days ago', status: 'Completed', by: 'Faisal N.' },
      { type: 'incident' as const, title: 'Lift Stuck — Floor 6', date: '18 days ago', status: 'Closed', by: 'Resident Report' },
      { type: 'maintenance' as const, title: 'Motor Lubrication', date: '60 days ago', status: 'Completed', by: 'Faisal N.' },
    ],
    parts: [
      { name: 'Brake Pad Set', stockLevel: 1, threshold: 2, leadTimeDays: 4, critical: true },
      { name: 'Motor Drive Belt', stockLevel: 0, threshold: 2, leadTimeDays: 6, critical: true },
      { name: 'Door Sensor', stockLevel: 4, threshold: 2, leadTimeDays: 2, critical: false },
    ],
  },
  {
    id: 'AST-003', name: 'Generator G-01', type: 'Electrical', client: 'DEWA',
    location: 'Community Centre', status: 'active' as AssetStatus, condition: 94,
    lastServiceDays: 12, nextPPMDays: 48, incidentCount30d: 0, ppmsOverdue: 0, slaBreaches: 0,
    hasPartsShortage: false, lastActivity: '12d ago — routine service',
    aiObservations: ['Operating within all nominal parameters', 'Load bank tested — passed', 'Fuel level at 92%'],
    aiAnomalies: [],
    aiPredicted: ['No immediate failures predicted', 'Next PPM recommended in 48 days'],
    aiInterpretation: 'Asset is in excellent operational condition. All sensors within normal ranges. Fuel and oil levels adequate. Recommend maintaining current PPM schedule.',
    degradationSignals: [],
    interventionWindow: '30–45 days (scheduled PPM)',
    timeline: [
      { type: 'maintenance' as const, title: 'Full Service + Oil Change', date: '12 days ago', status: 'Completed', by: 'Ahmed K.' },
      { type: 'inspection' as const, title: 'Load Bank Test', date: '40 days ago', status: 'Passed', by: 'Ahmed K.' },
      { type: 'maintenance' as const, title: 'Filter Replacement', date: '90 days ago', status: 'Completed', by: 'Sara M.' },
    ],
    parts: [
      { name: 'Engine Oil 15W-40', stockLevel: 8, threshold: 3, leadTimeDays: 1, critical: false },
      { name: 'Air Filter', stockLevel: 6, threshold: 2, leadTimeDays: 2, critical: false },
      { name: 'Fuel Filter', stockLevel: 4, threshold: 2, leadTimeDays: 1, critical: false },
    ],
  },
  {
    id: 'AST-004', name: 'Pool Pump PP-02', type: 'Plumbing', client: 'Emaar — Silicon Oasis',
    location: 'Recreation Area', status: 'active' as AssetStatus, condition: 89,
    lastServiceDays: 5, nextPPMDays: 25, incidentCount30d: 1, ppmsOverdue: 0, slaBreaches: 0,
    hasPartsShortage: false, lastActivity: '5d ago — chemical top-up',
    aiObservations: ['Flow rate at 98% of nominal', 'Pressure variance ±0.3 bar — within tolerance', 'Chlorination system stable'],
    aiAnomalies: ['Minor cavitation noise detected on startup — monitor'],
    aiPredicted: ['No failures within 10-day horizon', 'Bearing inspection recommended at next PPM'],
    aiInterpretation: 'Pool pump performing well. Minor cavitation detected on startup may indicate early bearing wear. No immediate action required, but should be logged for monitoring during next PPM visit.',
    degradationSignals: ['Minor cavitation on startup'],
    interventionWindow: '14–30 days',
    timeline: [
      { type: 'maintenance' as const, title: 'Chemical Dosing & Balance', date: '5 days ago', status: 'Completed', by: 'Ahmed K.' },
      { type: 'incident' as const, title: 'Low Pressure Alert', date: '14 days ago', status: 'Closed', by: 'BMS Sensor' },
      { type: 'inspection' as const, title: 'Monthly Inspection', date: '35 days ago', status: 'Completed', by: 'Ahmed K.' },
    ],
    parts: [
      { name: 'Pump Seal Kit', stockLevel: 2, threshold: 2, leadTimeDays: 3, critical: false },
      { name: 'Impeller Bearing', stockLevel: 1, threshold: 2, leadTimeDays: 5, critical: true },
      { name: 'Chemical Dosing Pump', stockLevel: 3, threshold: 1, leadTimeDays: 7, critical: false },
    ],
  },
  {
    id: 'AST-005', name: 'Fire Panel FP-01', type: 'Safety', client: 'Emaar — Silicon Oasis',
    location: 'Community Centre', status: 'active' as AssetStatus, condition: 97,
    lastServiceDays: 44, nextPPMDays: 136, incidentCount30d: 0, ppmsOverdue: 0, slaBreaches: 0,
    hasPartsShortage: false, lastActivity: '44d ago — compliance check',
    aiObservations: ['All 24 zones reporting normal', 'Battery backup at 98%', 'Sensitivity calibration within spec'],
    aiAnomalies: [],
    aiPredicted: ['No anomalies detected', 'Annual certification due in 136 days'],
    aiInterpretation: 'Fire safety system in excellent condition. All zones operational, backup power verified. Compliance certification is on track. No intervention required before scheduled annual check.',
    degradationSignals: [],
    interventionWindow: '120+ days (annual cert)',
    timeline: [
      { type: 'inspection' as const, title: 'Regulatory Compliance Check', date: '44 days ago', status: 'Passed', by: 'Sara M.' },
      { type: 'maintenance' as const, title: 'Battery & Sensor Test', date: '180 days ago', status: 'Completed', by: 'Sara M.' },
    ],
    parts: [
      { name: 'Smoke Detector Head', stockLevel: 12, threshold: 5, leadTimeDays: 3, critical: false },
      { name: 'Panel Battery 12V', stockLevel: 4, threshold: 2, leadTimeDays: 2, critical: false },
    ],
  },
  {
    id: 'AST-006', name: 'Carrier AHU — Block A', type: 'HVAC', client: 'Al Futtaim Group',
    location: 'Block A, Floor 2', status: 'warning' as AssetStatus, condition: 68,
    lastServiceDays: 95, nextPPMDays: 0, incidentCount30d: 1, ppmsOverdue: 1, slaBreaches: 1,
    hasPartsShortage: true, lastActivity: '3d ago — filter clogged',
    aiObservations: ['Filter pressure drop 2.4× nominal', 'Airflow reduced to 71%', 'PPM overdue by 15 days'],
    aiAnomalies: ['Intermittent freeze cycle on coil at low ambient', 'Fan motor drawing 8% excess current'],
    aiPredicted: ['Fan motor burnout risk within 2 weeks', 'Duct contamination if filter not replaced'],
    aiInterpretation: 'AHU showing compounding degradation. Overdue PPM, clogged filter, and motor current draw all indicate a deteriorating trajectory. The combination of multiple concurrent issues raises risk to High. Urgent service needed.',
    degradationSignals: ['Overdue PPM', 'Clogged filter', 'Motor overcurrent', 'Reduced airflow'],
    interventionWindow: '1–7 days',
    timeline: [
      { type: 'incident' as const, title: 'Reduced Airflow Complaint', date: '3 days ago', status: 'Open', by: 'Resident App' },
      { type: 'work_order' as const, title: 'Filter Inspection', date: '7 days ago', status: 'Completed', by: 'Omar T.' },
      { type: 'inspection' as const, title: 'Quarterly PPM — Overdue', date: '95 days ago', status: 'Overdue', by: 'Pending' },
    ],
    parts: [
      { name: 'G4 Panel Filter', stockLevel: 1, threshold: 3, leadTimeDays: 1, critical: true },
      { name: 'Fan Motor Capacitor', stockLevel: 0, threshold: 2, leadTimeDays: 4, critical: true },
      { name: 'Coil Cleaning Chemical', stockLevel: 5, threshold: 2, leadTimeDays: 1, critical: false },
    ],
  },
];

const ENRICHED_ASSETS: RichAsset[] = RAW_ASSETS.map(a => {
  const health = deriveHealthScore(a);
  return {
    ...a,
    healthScore: health,
    riskLevel: deriveRisk(health),
    failureProbability: deriveFailureProbability(health, a.incidentCount30d, a.ppmsOverdue),
  };
});

const CATEGORIES = ['HVAC', 'Elevator', 'Lift', 'Generator', 'Plumbing', 'Electrical', 'Fire Safety', 'Safety', 'Cleaning', 'Security'];
const CLIENTS = ['Emaar — Silicon Oasis', 'Al Futtaim Group', 'ENOC', 'DEWA', 'Dubai Mall', 'ADNOC', 'Emirates NBD'];

const RISK_COLORS: Record<RiskLevel, { text: string; bg: string; border: string; dot: string }> = {
  Low:      { text: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30', dot: 'bg-emerald-400' },
  Medium:   { text: 'text-amber-400',   bg: 'bg-amber-400/10',   border: 'border-amber-400/30',   dot: 'bg-amber-400' },
  High:     { text: 'text-orange-400',  bg: 'bg-orange-400/10',  border: 'border-orange-400/30',  dot: 'bg-orange-400' },
  Critical: { text: 'text-red-400',     bg: 'bg-red-400/10',     border: 'border-red-400/30',     dot: 'bg-red-400' },
};

const STATUS_COLORS: Record<AssetStatus, string> = {
  active:      'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  inactive:    'text-[#7A94B4] bg-white/5 border-white/10',
  maintenance: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  warning:     'text-orange-400 bg-orange-400/10 border-orange-400/30',
  critical:    'text-red-400 bg-red-400/10 border-red-400/30',
};

const TIMELINE_ICONS: Record<TimelineEntry['type'], { icon: React.ReactNode; color: string }> = {
  work_order:  { icon: <Wrench size={11} />, color: 'text-blue-400 bg-blue-400/15 border-blue-400/25' },
  incident:    { icon: <AlertTriangle size={11} />, color: 'text-red-400 bg-red-400/15 border-red-400/25' },
  inspection:  { icon: <CheckCircle size={11} />, color: 'text-emerald-400 bg-emerald-400/15 border-emerald-400/25' },
  maintenance: { icon: <Wrench size={11} />, color: 'text-purple-400 bg-purple-400/15 border-purple-400/25' },
};

function HealthBar({ score }: { score: number }) {
  const color = score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : score >= 40 ? '#F97316' : '#EF4444';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-white/8 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-[11px] font-bold tabular-nums" style={{ color }}>{score}</span>
    </div>
  );
}

function RiskBadge({ level }: { level: RiskLevel }) {
  const c = RISK_COLORS[level];
  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide ${c.text} ${c.bg} ${c.border}`}>
      {level}
    </span>
  );
}

function TopRiskStrip({ assets }: { assets: RichAsset[] }) {
  const top = [...assets].sort((a, b) => b.failureProbability - a.failureProbability).slice(0, 3);
  return (
    <div className="grid grid-cols-3 gap-3">
      {top.map((a, i) => {
        const c = RISK_COLORS[a.riskLevel];
        return (
          <div key={a.id} className={`rounded-xl border p-3 ${c.bg} ${c.border}`}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className={`text-[9px] font-black ${c.text}`}>#{i + 1} At Risk</span>
            </div>
            <p className="text-[#EEF3FA] text-[11px] font-bold leading-tight truncate">{a.name}</p>
            <p className={`text-[12px] font-black mt-1 ${c.text}`}>{a.failureProbability}%</p>
            <p className={`text-[9px] ${c.text} opacity-70`}>failure probability</p>
          </div>
        );
      })}
    </div>
  );
}

function AssetDetail({ asset, onBack, onToast }: { asset: RichAsset; onBack: () => void; onToast: ToastFn }) {
  const rc = RISK_COLORS[asset.riskLevel];
  const healthColor = asset.healthScore >= 80 ? '#10B981' : asset.healthScore >= 60 ? '#F59E0B' : asset.healthScore >= 40 ? '#F97316' : '#EF4444';
  const lowStockParts = asset.parts.filter(p => p.stockLevel <= p.threshold);
  const criticalParts = asset.parts.filter(p => p.critical && p.stockLevel === 0);

  const actions = [
    { icon: <Brain size={13} />, label: 'Open Expert Copilot', color: 'text-[#2E7FFF] border-[rgba(46,127,255,0.3)] bg-[rgba(46,127,255,0.07)]', action: () => onToast('Opening Asset Expert Copilot…', 'info') },
    { icon: <Wrench size={13} />, label: 'Create Work Order', color: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5', action: () => onToast('Work order creation flow opened', 'success') },
    { icon: <AlertTriangle size={13} />, label: 'Raise Incident', color: 'text-amber-400 border-amber-400/30 bg-amber-400/5', action: () => onToast('Incident form opened', 'warning') },
    { icon: <FileText size={13} />, label: 'Generate Maintenance Plan', color: 'text-purple-400 border-purple-400/30 bg-purple-400/5', action: () => onToast('AI generating maintenance plan…', 'info') },
    { icon: <Package size={13} />, label: 'Recommend Parts', color: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/5', action: () => onToast('Parts recommendation requested', 'info') },
  ];

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      {/* Back + header */}
      <div className="sticky top-0 z-10 bg-[#07111F] border-b border-[rgba(46,127,255,0.12)] px-6 py-4 flex items-center gap-3">
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-[#7A94B4] hover:text-[#2E7FFF] transition-colors text-[11px] font-semibold px-2 py-1.5 rounded-lg hover:bg-[rgba(46,127,255,0.08)]">
          <ChevronLeft size={14} /> Asset Register
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[#EEF3FA] font-bold text-sm truncate" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{asset.name}</p>
            <RiskBadge level={asset.riskLevel} />
          </div>
          <p className="text-[10px] text-[#7A94B4] font-mono">{asset.id} · {asset.type}</p>
        </div>
      </div>

      <div className="px-6 py-5 space-y-5 max-w-4xl mx-auto">

        {/* A. Asset Overview */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Health Score', value: <HealthBar score={asset.healthScore} />, },
            { label: 'Risk Level', value: <RiskBadge level={asset.riskLevel} /> },
            { label: 'Failure Probability', value: <span className={`text-[13px] font-black ${rc.text}`}>{asset.failureProbability}%</span> },
            { label: 'Status', value: <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${STATUS_COLORS[asset.status]}`}>{asset.status}</span> },
          ].map((item, i) => (
            <div key={i} className="bg-[rgba(17,32,64,0.7)] border border-[rgba(46,127,255,0.15)] rounded-xl p-3">
              <p className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1.5">{item.label}</p>
              <div>{item.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: <Activity size={12} />, label: 'Location', value: asset.location },
            { icon: <Clock size={12} />, label: 'Last Activity', value: asset.lastActivity },
            { icon: <Wrench size={12} />, label: 'Last Service', value: `${asset.lastServiceDays}d ago` },
            { icon: <Clock size={12} />, label: 'Next PPM', value: asset.nextPPMDays === 0 ? 'OVERDUE' : `In ${asset.nextPPMDays}d` },
          ].map((row, i) => (
            <div key={i} className="bg-[rgba(17,32,64,0.7)] border border-[rgba(46,127,255,0.12)] rounded-xl p-3 flex items-start gap-2">
              <span className="text-[#7A94B4] mt-0.5">{row.icon}</span>
              <div>
                <p className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-0.5">{row.label}</p>
                <p className={`text-[12px] font-semibold ${row.value === 'OVERDUE' ? 'text-red-400' : 'text-[#EEF3FA]'}`}>{row.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* B. AI Insight Panel */}
        <div className="bg-[rgba(46,127,255,0.04)] border border-[rgba(46,127,255,0.2)] rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[rgba(46,127,255,0.12)]">
            <Brain size={14} className="text-[#2E7FFF]" />
            <span className="text-[#EEF3FA] text-[11px] font-bold uppercase tracking-wide">AI Intelligence Panel</span>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <p className="text-[9px] text-[#7A94B4] uppercase tracking-widest font-bold mb-2">Operational Interpretation</p>
              <p className="text-[#D8E6F5] text-[12px] leading-relaxed">{asset.aiInterpretation}</p>
            </div>
            {asset.aiObservations.length > 0 && (
              <div>
                <p className="text-[9px] text-[#7A94B4] uppercase tracking-widest font-bold mb-2 flex items-center gap-1"><Zap size={9} className="text-emerald-400" /> Key Observations</p>
                <ul className="space-y-1">
                  {asset.aiObservations.map((o, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px] text-[#EEF3FA]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 mt-1" />
                      {o}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {asset.aiAnomalies.length > 0 && (
              <div>
                <p className="text-[9px] text-amber-400 uppercase tracking-widest font-bold mb-2 flex items-center gap-1"><AlertTriangle size={9} /> Anomalies Detected</p>
                <ul className="space-y-1">
                  {asset.aiAnomalies.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px] text-amber-200 bg-amber-400/5 border border-amber-400/15 rounded-lg px-2 py-1.5">
                      <AlertTriangle size={9} className="text-amber-400 flex-shrink-0 mt-0.5" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {asset.aiPredicted.length > 0 && (
              <div>
                <p className="text-[9px] text-[#2E7FFF] uppercase tracking-widest font-bold mb-2 flex items-center gap-1"><TrendingDown size={9} /> Predicted Issues</p>
                <ul className="space-y-1">
                  {asset.aiPredicted.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px] text-[#EEF3FA]">
                      <ArrowUpRight size={9} className="text-[#2E7FFF] flex-shrink-0 mt-0.5" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* E. Predictive Risk */}
        <div className={`rounded-xl border p-4 ${rc.bg} ${rc.border}`}>
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert size={14} className={rc.text} />
            <span className={`text-[11px] font-bold uppercase tracking-wide ${rc.text}`}>Predictive Risk Assessment</span>
          </div>
          <div className="flex items-center gap-4 mb-3">
            <div>
              <p className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-0.5">Failure Likelihood</p>
              <p className={`text-[28px] font-black leading-none ${rc.text}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {asset.failureProbability}%
              </p>
            </div>
            <div className="flex-1">
              <div className="h-2 bg-black/20 rounded-full overflow-hidden mb-1">
                <div className="h-full rounded-full" style={{
                  width: `${asset.failureProbability}%`,
                  background: asset.failureProbability >= 70 ? '#EF4444' : asset.failureProbability >= 50 ? '#F97316' : asset.failureProbability >= 30 ? '#F59E0B' : '#10B981',
                }} />
              </div>
              <p className="text-[10px] text-[#7A94B4]">Health Score: <span className="font-bold" style={{ color: healthColor }}>{asset.healthScore}/100</span></p>
            </div>
          </div>
          {asset.degradationSignals.length > 0 && (
            <div className="mb-3">
              <p className="text-[9px] text-[#7A94B4] uppercase tracking-widest font-bold mb-1.5">Degradation Signals</p>
              <div className="flex flex-wrap gap-1.5">
                {asset.degradationSignals.map((s, i) => (
                  <span key={i} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${rc.bg} ${rc.border} ${rc.text}`}>{s}</span>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 text-[11px]">
            <Clock size={11} className={rc.text} />
            <span className="text-[#7A94B4]">Recommended Intervention: </span>
            <span className={`font-bold ${rc.text}`}>{asset.interventionWindow}</span>
          </div>
        </div>

        {/* C. Timeline */}
        <div className="bg-[rgba(17,32,64,0.7)] border border-[rgba(46,127,255,0.15)] rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[rgba(46,127,255,0.12)]">
            <Activity size={13} className="text-[#7A94B4]" />
            <span className="text-[#EEF3FA] text-[11px] font-bold uppercase tracking-wide">Activity Timeline</span>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {asset.timeline.map((entry, i) => {
                const tc = TIMELINE_ICONS[entry.type];
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 ${tc.color}`}>
                      {tc.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[#EEF3FA] text-[12px] font-semibold truncate">{entry.title}</p>
                        <span className="text-[9px] text-[#7A94B4] whitespace-nowrap">{entry.date}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-[#7A94B4]">{entry.type.replace('_', ' ')}</span>
                        {entry.by && <span className="text-[9px] text-[#4A6080]">· {entry.by}</span>}
                        <span className={`text-[9px] font-bold ml-auto px-1.5 py-0.5 rounded ${
                          entry.status === 'Open' ? 'text-amber-400 bg-amber-400/10' :
                          entry.status === 'Overdue' ? 'text-red-400 bg-red-400/10' :
                          'text-emerald-400 bg-emerald-400/10'
                        }`}>{entry.status}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* D. Parts & Inventory */}
        <div className="bg-[rgba(17,32,64,0.7)] border border-[rgba(46,127,255,0.15)] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(46,127,255,0.12)]">
            <div className="flex items-center gap-2">
              <Package size={13} className="text-[#7A94B4]" />
              <span className="text-[#EEF3FA] text-[11px] font-bold uppercase tracking-wide">Parts & Inventory</span>
            </div>
            {lowStockParts.length > 0 && (
              <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/25 px-2 py-0.5 rounded-full">
                {lowStockParts.length} low stock
              </span>
            )}
          </div>
          <div className="p-4 space-y-2">
            {criticalParts.length > 0 && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-950/40 border border-red-500/25 mb-3">
                <AlertTriangle size={12} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-[11px]">Critical dependency out of stock: <strong>{criticalParts.map(p => p.name).join(', ')}</strong>. Raise PO immediately.</p>
              </div>
            )}
            {asset.parts.map((part, i) => {
              const isOut = part.stockLevel === 0;
              const isLow = part.stockLevel > 0 && part.stockLevel <= part.threshold;
              const statusCls = isOut ? 'text-red-400 bg-red-400/10 border-red-400/25' : isLow ? 'text-amber-400 bg-amber-400/10 border-amber-400/25' : 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25';
              const statusLabel = isOut ? 'Out of Stock' : isLow ? `Low (${part.stockLevel})` : `OK (${part.stockLevel})`;
              return (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${
                  isOut ? 'border-red-500/20 bg-red-950/20' : isLow ? 'border-amber-500/15 bg-amber-950/10' : 'border-[rgba(46,127,255,0.1)] bg-transparent'
                }`}>
                  {part.critical && <span className="text-[8px] font-black text-red-400 uppercase bg-red-400/10 border border-red-400/25 px-1 py-0.5 rounded flex-shrink-0">Critical</span>}
                  <div className="flex-1 min-w-0">
                    <p className="text-[#EEF3FA] text-[12px] font-semibold truncate">{part.name}</p>
                    <p className="text-[10px] text-[#7A94B4]">Lead time: {part.leadTimeDays}d · Min stock: {part.threshold}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${statusCls}`}>{statusLabel}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* F. Actions */}
        <div>
          <p className="text-[9px] text-[#7A94B4] uppercase tracking-widest font-bold mb-3">Actions</p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {actions.map((action, i) => (
              <button key={i} onClick={action.action}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[11px] font-semibold transition-all hover:brightness-110 active:scale-[0.98] text-left ${action.color}`}>
                {action.icon}
                <span className="leading-tight">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Health Score methodology */}
        <div className="bg-[rgba(17,32,64,0.4)] border border-[rgba(46,127,255,0.08)] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={12} className="text-[#7A94B4]" />
            <span className="text-[9px] text-[#7A94B4] uppercase tracking-widest font-bold">Health Score Calculation</span>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[10px]">
            {[
              { label: 'Base condition', value: `${asset.condition}`, sign: '' },
              { label: 'Last service >60d', value: asset.lastServiceDays > 60 ? '-10' : '0', sign: asset.lastServiceDays > 60 ? 'neg' : 'ok' },
              { label: 'Last service >90d', value: asset.lastServiceDays > 90 ? '-8' : '0', sign: asset.lastServiceDays > 90 ? 'neg' : 'ok' },
              { label: 'PPM overdue', value: asset.ppmsOverdue > 0 ? `−${12 * asset.ppmsOverdue}` : '0', sign: asset.ppmsOverdue > 0 ? 'neg' : 'ok' },
              { label: 'Incidents (30d)', value: asset.incidentCount30d > 0 ? `−${5 * asset.incidentCount30d}` : '0', sign: asset.incidentCount30d > 0 ? 'neg' : 'ok' },
              { label: 'SLA breaches', value: asset.slaBreaches > 0 ? `−${4 * asset.slaBreaches}` : '0', sign: asset.slaBreaches > 0 ? 'neg' : 'ok' },
              { label: 'Parts shortage', value: asset.hasPartsShortage ? '-8' : '0', sign: asset.hasPartsShortage ? 'neg' : 'ok' },
              { label: 'Status penalty', value: asset.status === 'critical' ? '-10' : asset.status === 'warning' ? '-5' : '0', sign: ['critical','warning'].includes(asset.status) ? 'neg' : 'ok' },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <span className="text-[#7A94B4]">{row.label}</span>
                <span className={`font-bold font-mono ${row.sign === 'neg' ? 'text-red-400' : row.sign === 'ok' ? 'text-[#4A6080]' : 'text-[#EEF3FA]'}`}>{row.value}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[rgba(46,127,255,0.1)]">
            <span className="text-[10px] text-[#EEF3FA] font-bold">Final Health Score</span>
            <span className="text-[14px] font-black" style={{ color: healthColor }}>{asset.healthScore}/100</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddAssetModal({ onClose, onAdd }: { onClose: () => void; onAdd: (a: RichAsset) => void }) {
  const [form, setForm] = useState({ name: '', type: CATEGORIES[0], client: CLIENTS[0], status: 'active' as AssetStatus, location: '', condition: '85' });
  const handleSubmit = () => {
    if (!form.name.trim()) return;
    const condition = Math.max(0, Math.min(100, parseInt(form.condition) || 85));
    const partial: Omit<RichAsset, 'healthScore' | 'riskLevel' | 'failureProbability'> = {
      id: `AST-${String(Math.floor(Math.random() * 900 + 100))}`,
      name: form.name.trim(),
      type: form.type,
      client: form.client,
      location: form.location || 'Silicon Oasis',
      status: form.status,
      condition,
      lastServiceDays: 0,
      nextPPMDays: 90,
      incidentCount30d: 0,
      ppmsOverdue: 0,
      slaBreaches: 0,
      hasPartsShortage: false,
      lastActivity: 'Just registered',
      aiObservations: ['Asset recently registered — insufficient telemetry for insights'],
      aiAnomalies: [],
      aiPredicted: ['Schedule first PPM within 30 days'],
      aiInterpretation: 'Newly registered asset. AI insights will build over time as sensor data and service history accumulate.',
      degradationSignals: [],
      interventionWindow: 'Establish baseline PPM schedule',
      timeline: [{ type: 'maintenance', title: 'Asset Registered', date: 'Just now', status: 'Done' }],
      parts: [],
    };
    const health = deriveHealthScore(partial);
    onAdd({ ...partial, healthScore: health, riskLevel: deriveRisk(health), failureProbability: deriveFailureProbability(health, 0, 0) });
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0D1E38] border border-[rgba(46,127,255,0.25)] rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#7A94B4] hover:text-[#EEF3FA] transition-colors"><X size={16} /></button>
        <h4 className="text-[#EEF3FA] font-bold text-sm mb-5" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Register New Asset</h4>
        <div className="space-y-4">
          {[
            { label: 'Asset Name', key: 'name', type: 'input', placeholder: 'e.g. Chiller Unit D-02' },
            { label: 'Location', key: 'location', type: 'input', placeholder: 'e.g. Block D, Level 3' },
            { label: 'Condition Score (0–100)', key: 'condition', type: 'input', placeholder: '85' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-[9px] text-[#7A94B4] uppercase tracking-wide block mb-1">{f.label}</label>
              <input value={form[f.key as keyof typeof form] as string} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full px-3 py-2 text-[12px] bg-[#0A1628] border border-[rgba(46,127,255,0.2)] rounded-lg text-[#EEF3FA] placeholder-[#7A94B4]/50 outline-none focus:border-[rgba(46,127,255,0.5)] transition-colors" />
            </div>
          ))}
          {[
            { label: 'Type', key: 'type', options: CATEGORIES },
            { label: 'Client', key: 'client', options: CLIENTS },
            { label: 'Status', key: 'status', options: ['active', 'inactive', 'maintenance', 'warning', 'critical'] },
          ].map(f => (
            <div key={f.key}>
              <label className="text-[9px] text-[#7A94B4] uppercase tracking-wide block mb-1">{f.label}</label>
              <select value={form[f.key as keyof typeof form] as string} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                className="w-full px-3 py-2 text-[12px] bg-[#0A1628] border border-[rgba(46,127,255,0.2)] rounded-lg text-[#EEF3FA] outline-none cursor-pointer focus:border-[rgba(46,127,255,0.5)] transition-colors">
                {f.options.map(o => <option key={o} value={o} className="bg-[#0A1628]">{o}</option>)}
              </select>
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 text-[12px] font-medium text-[#7A94B4] border border-[rgba(46,127,255,0.2)] hover:border-[rgba(46,127,255,0.4)] bg-white/[0.03] px-4 py-2.5 rounded-xl transition-all">Cancel</button>
          <button onClick={handleSubmit} className="flex-1 text-[12px] font-bold text-white bg-[#2E7FFF] hover:bg-blue-500 px-4 py-2.5 rounded-xl transition-all">Register Asset</button>
        </div>
      </div>
    </div>
  );
}

export function AssetsSettings({ onToast }: Props) {
  const [assets, setAssets] = useState<RichAsset[]>(ENRICHED_ASSETS);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'All'>('All');
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<RichAsset | null>(null);

  const filtered = assets.filter(a => {
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.type.toLowerCase().includes(search.toLowerCase()) ||
      a.client.toLowerCase().includes(search.toLowerCase()) ||
      a.location.toLowerCase().includes(search.toLowerCase());
    const matchRisk = riskFilter === 'All' || a.riskLevel === riskFilter;
    return matchSearch && matchRisk;
  });

  if (selected) {
    return (
      <AssetDetail asset={selected} onBack={() => setSelected(null)} onToast={onToast} />
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar px-6 py-6">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-[#EEF3FA] font-bold text-sm mb-0.5 flex items-center gap-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              <Cpu size={15} className="text-[#2E7FFF]" />
              Asset Intelligence System
            </h3>
            <p className="text-[11px] text-[#7A94B4]">AI-powered health monitoring, risk scoring, and predictive maintenance across all client assets.</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 text-[11px] bg-[#2E7FFF] text-white px-3 py-1.5 rounded-lg hover:bg-blue-500 transition-colors flex-shrink-0">
            <Plus size={12} /> Register Asset
          </button>
        </div>

        {/* Top 3 at-risk strip */}
        <TopRiskStrip assets={assets} />

        {/* Filters */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A94B4]" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search assets, type, client…"
              className="w-full pl-8 pr-4 py-2 text-[12px] bg-[rgba(17,32,64,0.85)] border border-[rgba(46,127,255,0.2)] rounded-xl text-[#EEF3FA] placeholder-[#7A94B4] outline-none focus:border-[rgba(46,127,255,0.5)] transition-colors" />
          </div>
          <div className="flex gap-1.5">
            {(['All', 'Critical', 'High', 'Medium', 'Low'] as const).map(r => (
              <button key={r} onClick={() => setRiskFilter(r)}
                className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-all ${
                  riskFilter === r
                    ? r === 'All' ? 'bg-[#2E7FFF] text-white border-[#2E7FFF]' :
                      r === 'Critical' ? 'bg-red-500/20 text-red-400 border-red-500/40' :
                      r === 'High' ? 'bg-orange-500/20 text-orange-400 border-orange-500/40' :
                      r === 'Medium' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                      'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'text-[#7A94B4] border-[rgba(46,127,255,0.15)] hover:border-[rgba(46,127,255,0.3)]'
                }`}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Asset table */}
        <div className="bg-[rgba(17,32,64,0.85)] border border-[rgba(46,127,255,0.2)] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] min-w-[780px]">
              <thead>
                <tr className="border-b border-[rgba(46,127,255,0.12)]">
                  {['Asset', 'Type / Client', 'Health Score', 'Risk Level', 'Failure Prob.', 'Last Activity', ''].map(h => (
                    <th key={h} className="text-[9px] text-[#7A94B4] uppercase tracking-wide px-4 py-3 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-[#7A94B4] text-[11px]">No assets found.</td></tr>
                )}
                {filtered.map(asset => (
                  <tr key={asset.id}
                    onClick={() => setSelected(asset)}
                    className="border-b border-[rgba(46,127,255,0.06)] hover:bg-[rgba(46,127,255,0.04)] transition-colors cursor-pointer group">
                    <td className="px-4 py-3">
                      <div className="text-[#EEF3FA] font-semibold group-hover:text-[#2E7FFF] transition-colors">{asset.name}</div>
                      <div className="text-[9px] text-[#7A94B4] font-mono mt-0.5">{asset.id}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[#7A94B4]">{asset.type}</div>
                      <div className="text-[9px] text-[#4A6080] mt-0.5 truncate max-w-[120px]">{asset.client}</div>
                    </td>
                    <td className="px-4 py-3">
                      <HealthBar score={asset.healthScore} />
                    </td>
                    <td className="px-4 py-3">
                      <RiskBadge level={asset.riskLevel} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[12px] font-bold ${
                        asset.failureProbability >= 70 ? 'text-red-400' :
                        asset.failureProbability >= 50 ? 'text-orange-400' :
                        asset.failureProbability >= 30 ? 'text-amber-400' : 'text-emerald-400'
                      }`}>{asset.failureProbability}%</span>
                    </td>
                    <td className="px-4 py-3 text-[#7A94B4] text-[10px]">{asset.lastActivity}</td>
                    <td className="px-4 py-3">
                      <ChevronRight size={14} className="text-[#4A6080] group-hover:text-[#2E7FFF] transition-colors" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total Assets', value: assets.length, icon: <Cpu size={12} />, color: 'text-[#2E7FFF]' },
            { label: 'Critical / High Risk', value: assets.filter(a => a.riskLevel === 'Critical' || a.riskLevel === 'High').length, icon: <AlertTriangle size={12} />, color: 'text-red-400' },
            { label: 'Parts Shortages', value: assets.filter(a => a.hasPartsShortage).length, icon: <Package size={12} />, color: 'text-amber-400' },
            { label: 'Avg Health Score', value: Math.round(assets.reduce((s, a) => s + a.healthScore, 0) / assets.length), icon: <Activity size={12} />, color: 'text-emerald-400' },
          ].map((stat, i) => (
            <div key={i} className="bg-[rgba(17,32,64,0.7)] border border-[rgba(46,127,255,0.15)] rounded-xl p-3">
              <div className={`flex items-center gap-1.5 mb-1 ${stat.color}`}>{stat.icon}<span className="text-[9px] font-bold uppercase tracking-wide">{stat.label}</span></div>
              <p className={`text-[20px] font-black ${stat.color}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{stat.value}</p>
            </div>
          ))}
        </div>

      </div>

      {showModal && (
        <AddAssetModal
          onClose={() => setShowModal(false)}
          onAdd={a => { setAssets(prev => [a, ...prev]); onToast('Asset registered with AI profile', 'success'); }}
        />
      )}
    </div>
  );
}
