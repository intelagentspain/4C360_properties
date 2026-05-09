import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Minus, ArrowLeft, ShieldCheck,
  AlertTriangle, Brain, Target, DollarSign, BarChart3,
  CheckCircle, XCircle, FileWarning, Zap, ChevronRight,
  Users, Building2, Star, Sparkles, Lightbulb, ListChecks, Activity, X,
  Plus,
} from 'lucide-react';
import {
  computeVendorScore,
  classifyVendorRisk,
  type VendorIntelData,
  type VendorRiskLevel,
  type VendorTrend,
} from '@/data/mockData';
import { buildDefaultVendor, useVendors } from '@/context/VendorsContext';
import type { ToastFn } from '@/lib/ui';

type FilterTab = 'all' | 'top' | 'atrisk' | 'cost';

type VendorWizardStep = 1 | 2 | 3 | 4;

type VendorWizardForm = {
  name: string;
  category: string;
  sites: string;
  address: string;
  city: string;
  country: string;
  pocName: string;
  pocTitle: string;
  pocPhone: string;
  pocEmail: string;
  activeContracts: string;
  contractExpiry: string;
  slaCompliance: string;
  firstTimeFixRate: string;
  avgResolutionMin: string;
  evidenceCompliance: string;
  repeatFailureRate: string;
  jobsLast30d: string;
  avgCostPerJob: string;
  trend: VendorTrend;
  dependencyRisk: 'Low' | 'Medium' | 'High' | 'Critical';
  dependencyNote: string;
  predictedRisk30d: string;
  contractFlags: string;
};

const vendorCategories = [
  'FM & HVAC',
  'FM & Electrical',
  'MEP & Systems',
  'Cleaning & Soft FM',
  'Security',
  'Landscaping',
  'Fire & Safety',
  'Elevators & Lifts',
  'Engineering & Civil',
  'General FM',
];

const initialVendorWizardForm: VendorWizardForm = {
  name: 'Nexus Facilities Services',
  category: 'FM & HVAC',
  sites: 'Bayz 102, Lawnz Residences',
  address: 'Business Bay Service Hub',
  city: 'Dubai',
  country: 'UAE',
  pocName: 'Aisha Rahman',
  pocTitle: 'Account Director',
  pocPhone: '+971 55 420 1188',
  pocEmail: 'aisha.rahman@nexusfm.ae',
  activeContracts: '1',
  contractExpiry: 'Mar 2027',
  slaCompliance: '88',
  firstTimeFixRate: '84',
  avgResolutionMin: '44',
  evidenceCompliance: '90',
  repeatFailureRate: '6',
  jobsLast30d: '42',
  avgCostPerJob: '455',
  trend: 'flat',
  dependencyRisk: 'Medium',
  dependencyNote: 'Primary HVAC backup coverage across two mixed-use residential properties.',
  predictedRisk30d: '16',
  contractFlags: 'Onboarding evidence pack due within 14 days',
};

function numeric(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseVendorSites(raw: string): string[] {
  return raw.split(',').map(site => site.trim()).filter(Boolean);
}

function parseVendorFlags(raw: string): VendorIntelData['contractFlags'] {
  return raw
    .split(';')
    .map(flag => flag.trim())
    .filter(Boolean)
    .map(description => ({ type: 'warning' as const, description }));
}

function vendorWizardScore(form: VendorWizardForm): number {
  return computeVendorScore({
    slaCompliance: numeric(form.slaCompliance, 85),
    firstTimeFixRate: numeric(form.firstTimeFixRate, 80),
    avgResolutionMin: numeric(form.avgResolutionMin, 50),
    evidenceCompliance: numeric(form.evidenceCompliance, 85),
    avgCostPerJob: numeric(form.avgCostPerJob, 450),
  });
}

function buildVendorInsights(form: VendorWizardForm, score: number): VendorIntelData['insights'] {
  const risk = classifyVendorRisk(score);
  return [
    `${form.name} is being onboarded with a starting vendor score of ${score}/100 and ${risk} classification.`,
    `SLA baseline is ${numeric(form.slaCompliance, 85)}% with ${numeric(form.firstTimeFixRate, 80)}% first-time fix across ${numeric(form.jobsLast30d, 20)} expected monthly jobs.`,
    `Evidence compliance is set at ${numeric(form.evidenceCompliance, 85)}%, so the vendor will be monitored for photo, report, and closure proof quality.`,
    `${form.dependencyRisk} dependency risk has been assigned for ${parseVendorSites(form.sites).join(', ') || 'selected properties'}.`,
  ];
}

function buildVendorRecommendations(form: VendorWizardForm, score: number): VendorIntelData['recommendations'] {
  if (score >= 78) {
    return [
      { title: 'Approve preferred onboarding', detail: 'Initial KPI baseline supports preferred rotation once contract evidence is complete.', action: 'review' },
      { title: 'Lock service rate during onboarding', detail: `AED ${numeric(form.avgCostPerJob, 450)}/job is within target range. Confirm rate card before first work package allocation.`, action: 'renegotiate' },
    ];
  }
  if (score >= 58) {
    return [
      { title: 'Start with controlled scope', detail: 'Use a 30-day probation window and monitor SLA, evidence, and repeat failures before expanding coverage.', action: 'review' },
      { title: 'Assign backup vendor coverage', detail: 'Dependency should be managed until the vendor proves performance across the first job cycle.', action: 'reassign' },
    ];
  }
  return [
    { title: 'Require onboarding review before allocation', detail: 'Baseline indicators are below threshold. Do not assign critical work until corrective commitments are agreed.', action: 'review' },
    { title: 'Limit scope to low-risk work', detail: 'Use only non-critical jobs until SLA and evidence metrics improve.', action: 'limit' },
  ];
}

function buildVendorFromWizard(form: VendorWizardForm): VendorIntelData {
  const score = vendorWizardScore(form);
  const flags = parseVendorFlags(form.contractFlags);
  const id = `VND-${Date.now().toString().slice(-6)}`;
  return buildDefaultVendor({
    id,
    name: form.name.trim() || 'New Vendor',
    category: form.category,
    trend: form.trend,
    slaCompliance: numeric(form.slaCompliance, 85),
    firstTimeFixRate: numeric(form.firstTimeFixRate, 80),
    avgResolutionMin: numeric(form.avgResolutionMin, 50),
    evidenceCompliance: numeric(form.evidenceCompliance, 85),
    repeatFailureRate: numeric(form.repeatFailureRate, 8),
    avgCostPerJob: numeric(form.avgCostPerJob, 450),
    activeContracts: numeric(form.activeContracts, 1),
    contractExpiry: form.contractExpiry || 'Dec 2026',
    sites: parseVendorSites(form.sites),
    jobsLast30d: numeric(form.jobsLast30d, 20),
    insights: buildVendorInsights(form, score),
    anomaly: score < 58 ? 'Onboarding risk: baseline score is below Watchlist threshold. Review before assigning critical work.' : null,
    contractFlags: flags,
    predictedRisk30d: numeric(form.predictedRisk30d, 20),
    projectedTrend: form.trend,
    recommendations: buildVendorRecommendations(form, score),
    dependencyRisk: form.dependencyRisk,
    dependencyNote: form.dependencyNote || `${form.dependencyRisk} dependency risk across ${parseVendorSites(form.sites).length || 1} site scope.`,
    address: { street: form.address, city: form.city, country: form.country },
    poc: { name: form.pocName, title: form.pocTitle, phone: form.pocPhone, email: form.pocEmail },
  });
}

function riskColor(level: VendorRiskLevel): string {
  if (level === 'Preferred') return '#38D98A';
  if (level === 'Watchlist') return '#FF9B38';
  return '#FF4B4B';
}

function riskBg(level: VendorRiskLevel): string {
  if (level === 'Preferred') return 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400';
  if (level === 'Watchlist') return 'bg-amber-500/10 border-amber-500/25 text-amber-400';
  return 'bg-red-500/10 border-red-500/25 text-red-400';
}

function scoreColor(score: number): string {
  if (score >= 80) return '#38D98A';
  if (score >= 65) return '#FF9B38';
  return '#FF4B4B';
}

function TrendIcon({ trend, size = 13 }: { trend: VendorTrend; size?: number }) {
  if (trend === 'up') return <TrendingUp size={size} className="text-emerald-400" />;
  if (trend === 'down') return <TrendingDown size={size} className="text-red-400" />;
  return <Minus size={size} className="text-amber-400" />;
}

function dependencyColor(level: string): string {
  if (level === 'Low') return '#38D98A';
  if (level === 'Medium') return '#FF9B38';
  if (level === 'High') return '#FF4B4B';
  return '#C026D3';
}

function flagIcon(type: string) {
  if (type === 'breach') return <XCircle size={11} className="text-red-400 flex-shrink-0 mt-0.5" />;
  if (type === 'missing') return <FileWarning size={11} className="text-amber-400 flex-shrink-0 mt-0.5" />;
  return <AlertTriangle size={11} className="text-amber-300 flex-shrink-0 mt-0.5" />;
}

function actionColor(action: string): string {
  if (action === 'reassign') return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
  if (action === 'renegotiate') return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
  if (action === 'review') return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
  return 'text-red-400 border-red-500/30 bg-red-500/10';
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="h-1 bg-[#0A1628] rounded-full overflow-hidden w-16">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, (value / max) * 100)}%` }}
        transition={{ duration: 0.5 }}
        className="h-full rounded-full"
        style={{ background: color }}
      />
    </div>
  );
}

function ScoreRing({ score, size = 52 }: { score: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = scoreColor(score);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(46,127,255,0.12)" strokeWidth={5} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={5} strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        initial={{ strokeDasharray: `0 ${circ}` }}
        animate={{ strokeDasharray: `${dash} ${circ}` }}
        transition={{ duration: 0.7 }}
      />
      <text
        x={size / 2} y={size / 2 + 1}
        textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize={13} fontWeight={700}
        style={{ transform: `rotate(90deg)`, transformOrigin: `${size / 2}px ${size / 2}px`, fontFamily: 'Space Grotesk, sans-serif' }}
      >
        {score}
      </text>
    </svg>
  );
}

interface DetailSectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function DetailSection({ icon, title, children }: DetailSectionProps) {
  return (
    <div className="bg-[#07111F] border border-[rgba(46,127,255,0.14)] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3.5">
        <div className="w-6 h-6 rounded-lg bg-[#2E7FFF]/15 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <span className="text-[10px] font-bold text-[#2E7FFF] uppercase tracking-widest">{title}</span>
        <div className="flex-1 h-px bg-[rgba(46,127,255,0.12)]" />
      </div>
      {children}
    </div>
  );
}

type VendorMetricName =
  | 'Vendor Score'
  | 'SLA Compliance'
  | 'First-Time Fix'
  | 'Avg Resolution'
  | 'Evidence Compliance'
  | 'Active Contracts'
  | 'Jobs Last 30d'
  | 'Avg Cost/Job';

type VendorMetricInsight = {
  metricName: VendorMetricName;
  valueLabel: string;
  status: 'positive' | 'monitor' | 'critical';
  summary: string;
  rationale: string[];
  interpretation: string;
  recommendation: string;
};

function vendorMetricStatus(metricName: VendorMetricName, value: number, score: number): VendorMetricInsight['status'] {
  if (metricName === 'Avg Resolution') {
    if (value > 60) return 'critical';
    if (value > 45) return 'monitor';
    return 'positive';
  }
  if (metricName === 'Avg Cost/Job') {
    if (value > 620) return 'critical';
    if (value > 500) return 'monitor';
    return 'positive';
  }
  if (metricName === 'Active Contracts' || metricName === 'Jobs Last 30d') return value > 0 ? 'positive' : 'monitor';
  if (metricName === 'Vendor Score') {
    if (score < 65) return 'critical';
    if (score < 80) return 'monitor';
    return 'positive';
  }
  if (value < 75) return 'critical';
  if (value < 88) return 'monitor';
  return 'positive';
}

function buildVendorMetricInsight(vendor: VendorIntelData, metricName: VendorMetricName): VendorMetricInsight {
  const score = computeVendorScore(vendor);
  const riskLevel = classifyVendorRisk(score);
  const peerCost = Number(vendor.costTrend[vendor.costTrend.length - 1]?.peerAvg ?? 500);
  const statusFrom = (value: number) => vendorMetricStatus(metricName, value, score);

  switch (metricName) {
    case 'Vendor Score':
      return {
        metricName,
        valueLabel: `${score}/100`,
        status: statusFrom(score),
        summary: `${vendor.name} is scoring ${score}/100 and is currently classified as ${riskLevel}.`,
        rationale: [
          `The score blends SLA compliance (${vendor.slaCompliance}%), first-time fix (${vendor.firstTimeFixRate}%), response speed, evidence compliance (${vendor.evidenceCompliance}%), cost, and risk flags.`,
          vendor.trend === 'up' ? 'The trend is improving, so recent delivery is strengthening the score.' : vendor.trend === 'down' ? 'The trend is declining, so recent delivery is pulling the score down.' : 'The trend is stable, with no major movement in the recent score curve.',
          `${vendor.contractFlags.length} contract flag${vendor.contractFlags.length === 1 ? '' : 's'} and ${vendor.repeatFailureRate}% repeat failure rate are included in the risk reading.`,
        ],
        interpretation: score >= 80 ? 'This vendor is a reliable candidate for priority work and broader scope.' : score >= 65 ? 'The vendor remains usable, but targeted controls are needed before expanding scope.' : 'This vendor needs active management before more critical work is assigned.',
        recommendation: score >= 80 ? 'Keep the vendor in preferred rotation and monitor whether the improving trend holds next month.' : score >= 65 ? 'Set a short corrective action plan focused on the weakest score driver.' : 'Limit new assignments, trigger review, and prepare backup capacity for critical jobs.',
      };
    case 'SLA Compliance':
      return {
        metricName,
        valueLabel: `${vendor.slaCompliance}%`,
        status: statusFrom(vendor.slaCompliance),
        summary: `${vendor.name} is closing ${vendor.slaCompliance}% of jobs within SLA.`,
        rationale: [
          vendor.slaCompliance >= 90 ? 'SLA performance is above the preferred vendor threshold.' : 'SLA performance is below preferred threshold and needs closer scheduling control.',
          `${vendor.jobsLast30d} jobs in the last 30 days gives the metric enough activity to be meaningful.`,
          `The 30-day risk forecast is ${vendor.predictedRisk30d}%, so SLA should be read alongside predictive risk.`,
        ],
        interpretation: vendor.slaCompliance >= 90 ? 'Operationally, the vendor is dependable for time-sensitive work.' : 'Late delivery risk may create resident escalation and contract pressure.',
        recommendation: vendor.slaCompliance >= 90 ? 'Keep allocating high-priority jobs while watching workload concentration.' : 'Review open jobs daily and reserve critical jobs for vendors with stronger SLA performance.',
      };
    case 'First-Time Fix':
      return {
        metricName,
        valueLabel: `${vendor.firstTimeFixRate}%`,
        status: statusFrom(vendor.firstTimeFixRate),
        summary: `${vendor.firstTimeFixRate}% of jobs are resolved without a repeat visit.`,
        rationale: [
          `Repeat failure rate is ${vendor.repeatFailureRate}%, which is the inverse pressure on this metric.`,
          vendor.firstTimeFixRate >= 88 ? 'Diagnostic quality is strong and return visits are rare.' : 'Repeat visits are creating avoidable operational load.',
          `Current category focus: ${vendor.category}.`,
        ],
        interpretation: vendor.firstTimeFixRate >= 88 ? 'The vendor is diagnosing correctly and reducing friction for residents and site teams.' : 'More rework means longer lifecycle cost and less predictable capacity.',
        recommendation: vendor.firstTimeFixRate >= 88 ? 'Use this vendor for complex jobs where diagnostic accuracy matters.' : 'Pair the vendor with clearer issue triage, stronger evidence requirements, or a senior reviewer.',
      };
    case 'Avg Resolution':
      return {
        metricName,
        valueLabel: `${vendor.avgResolutionMin} min`,
        status: statusFrom(vendor.avgResolutionMin),
        summary: `Average resolution time is ${vendor.avgResolutionMin} minutes.`,
        rationale: [
          vendor.avgResolutionMin <= 45 ? 'Resolution speed is within the preferred operating band.' : 'Resolution speed is above the preferred operating band.',
          `The metric is assessed together with ${vendor.slaCompliance}% SLA compliance and ${vendor.firstTimeFixRate}% first-time fix.`,
          vendor.dependencyRisk === 'High' || vendor.dependencyRisk === 'Critical' ? `Dependency risk is ${vendor.dependencyRisk}, which can slow closure when specialist capacity is needed.` : 'Dependency risk is manageable, so speed is mostly within vendor control.',
        ],
        interpretation: vendor.avgResolutionMin <= 45 ? 'Fast closure supports SLA confidence and keeps active backlog low.' : 'Longer resolution times can hide capacity constraints or weak diagnosis.',
        recommendation: vendor.avgResolutionMin <= 45 ? 'Maintain current dispatch rules and use the vendor for short-SLA work.' : 'Review job mix, parts availability, and escalation handoffs for the slowest closures.',
      };
    case 'Evidence Compliance':
      return {
        metricName,
        valueLabel: `${vendor.evidenceCompliance}%`,
        status: statusFrom(vendor.evidenceCompliance),
        summary: `${vendor.evidenceCompliance}% of closed jobs include required documentation and evidence.`,
        rationale: [
          vendor.evidenceCompliance >= 90 ? 'Evidence quality is strong enough for audit and client reporting.' : 'Evidence gaps may weaken audit readiness and billing support.',
          `${vendor.contractFlags.filter(flag => flag.type === 'missing').length} active missing-evidence flag${vendor.contractFlags.filter(flag => flag.type === 'missing').length === 1 ? '' : 's'} found in contract checks.`,
          'Before/after photos and completion notes are key signals for this score.',
        ],
        interpretation: vendor.evidenceCompliance >= 90 ? 'The vendor is giving management a defensible record of completed work.' : 'Incomplete documentation creates avoidable review friction and compliance exposure.',
        recommendation: vendor.evidenceCompliance >= 90 ? 'Keep current evidence standards and sample-check high-risk jobs.' : 'Make evidence mandatory before closure and spot-check the next 10 jobs.',
      };
    case 'Active Contracts':
      return {
        metricName,
        valueLabel: String(vendor.activeContracts),
        status: statusFrom(vendor.activeContracts),
        summary: `${vendor.name} has ${vendor.activeContracts} active contract${vendor.activeContracts === 1 ? '' : 's'} in scope.`,
        rationale: [
          `Contract expiry is ${vendor.contractExpiry}.`,
          `The vendor covers ${vendor.sites.length} site${vendor.sites.length === 1 ? '' : 's'}: ${vendor.sites.join(', ')}.`,
          `${vendor.contractFlags.length} contract flag${vendor.contractFlags.length === 1 ? '' : 's'} currently influence governance risk.`,
        ],
        interpretation: vendor.activeContracts > 1 ? 'This vendor has meaningful operational footprint and should stay visible in portfolio controls.' : 'The vendor has a smaller active footprint, so risk is more contained.',
        recommendation: vendor.contractFlags.length > 0 ? 'Review flagged clauses before assigning additional contract scope.' : 'Keep renewal, expiry, and scope coverage visible in the monthly vendor review.',
      };
    case 'Jobs Last 30d':
      return {
        metricName,
        valueLabel: String(vendor.jobsLast30d),
        status: statusFrom(vendor.jobsLast30d),
        summary: `${vendor.name} completed or handled ${vendor.jobsLast30d} jobs in the last 30 days.`,
        rationale: [
          'Recent job volume gives confidence that the performance metrics reflect current behavior.',
          `Workload is being delivered with ${vendor.slaCompliance}% SLA and ${vendor.firstTimeFixRate}% first-time fix.`,
          vendor.jobsLast30d > 150 ? 'Volume is high, so capacity monitoring matters.' : 'Volume is moderate, so performance changes may be easier to correct quickly.',
        ],
        interpretation: vendor.jobsLast30d > 150 ? 'The vendor is a major operational dependency for current service delivery.' : 'The vendor is active but not over-concentrated.',
        recommendation: vendor.jobsLast30d > 150 ? 'Watch fatigue, repeat visits, and SLA drift before adding more work.' : 'Use this activity level to test targeted performance improvements.',
      };
    case 'Avg Cost/Job':
      return {
        metricName,
        valueLabel: `AED ${vendor.avgCostPerJob}`,
        status: statusFrom(vendor.avgCostPerJob),
        summary: `Average cost per job is AED ${vendor.avgCostPerJob}, compared with a peer reference of AED ${peerCost}.`,
        rationale: [
          vendor.avgCostPerJob <= peerCost ? `Cost is AED ${peerCost - vendor.avgCostPerJob} below the current peer reference.` : `Cost is AED ${vendor.avgCostPerJob - peerCost} above the current peer reference.`,
          `Cost should be read with ${vendor.firstTimeFixRate}% first-time fix, because cheap repeat work is not truly efficient.`,
          `Vendor score is ${score}/100, so cost efficiency is being achieved ${score >= 80 ? 'without weakening quality.' : 'with some quality or delivery risk still present.'}`,
        ],
        interpretation: vendor.avgCostPerJob <= peerCost && vendor.firstTimeFixRate >= 85 ? 'The vendor is cost-efficient without obvious quality compromise.' : 'Cost requires a quality check before decisions are made on price alone.',
        recommendation: vendor.avgCostPerJob <= peerCost ? 'Keep this vendor in cost-sensitive routing while monitoring evidence and repeat visits.' : 'Compare job mix and parts usage before renegotiating rates.',
      };
  }
}

function VendorAIInsightBadge({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={event => {
        event.stopPropagation();
        onClick();
      }}
      title="Explain this metric"
      aria-label="Explain this metric"
      className="group absolute right-2 top-2 z-10 inline-flex h-5 items-center gap-1 rounded-full border border-violet-300/25 bg-[linear-gradient(135deg,#1D7CFF,#7C3AED)] px-1.5 text-[8px] font-black uppercase tracking-wide text-white shadow-[0_0_14px_rgba(124,58,237,0.34)] transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-violet-300/70"
    >
      <Sparkles size={9} />
      AI
      <span className="pointer-events-none absolute right-0 top-7 hidden whitespace-nowrap rounded-lg border border-[rgba(46,127,255,0.28)] bg-[#07111F] px-2.5 py-1.5 text-[10px] font-bold normal-case tracking-normal text-[#DDE6F8] shadow-xl group-hover:block">
        Explain this metric
      </span>
    </button>
  );
}

function VendorInsightBlock({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Brain;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#07111F]/85 p-4">
      <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#C4B5FD]">
        <Icon size={13} />
        {title}
      </div>
      {children}
    </div>
  );
}

function VendorMetricInsightPanel({ insight, onClose }: { insight: VendorMetricInsight; onClose: () => void }) {
  const statusClass = {
    positive: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
    monitor: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
    critical: 'border-red-400/30 bg-red-400/10 text-red-200',
  }[insight.status];

  return (
    <motion.aside
      initial={{ x: 420, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 420, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 34 }}
      className="absolute bottom-0 right-0 top-0 z-40 flex w-full max-w-[400px] flex-col border-l border-violet-400/25 bg-[linear-gradient(180deg,rgba(10,22,40,0.98),rgba(7,17,31,0.99))] shadow-2xl shadow-black/45 backdrop-blur-xl"
    >
      <div className="border-b border-[rgba(46,127,255,0.16)] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-violet-300/25 bg-violet-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-violet-100">
              <Sparkles size={12} />
              AI Insight
            </div>
            <h3 className="text-lg font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              AI Insight - {insight.metricName}
            </h3>
            <p className="mt-1 text-[12px] text-[#7A94B4]">
              Current value: <span className="font-bold text-[#DDE6F8]">{insight.valueLabel}</span>
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-[#7A94B4] transition-colors hover:bg-white/5 hover:text-white" aria-label="Close AI insight">
            <X size={18} />
          </button>
        </div>
        <div className={`mt-4 inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wide ${statusClass}`}>
          {insight.status === 'positive' ? 'Healthy signal' : insight.status === 'monitor' ? 'Monitor closely' : 'Needs attention'}
        </div>
      </div>

      <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto p-5">
        <VendorInsightBlock icon={Brain} title="Summary">
          <p className="text-[13px] leading-6 text-[#DDE6F8]">{insight.summary}</p>
        </VendorInsightBlock>
        <VendorInsightBlock icon={ListChecks} title="Rationale">
          <ul className="space-y-2">
            {insight.rationale.map(item => (
              <li key={item} className="flex gap-2 text-[12px] leading-5 text-[#B8C7DB]">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7C3AED]" />
                {item}
              </li>
            ))}
          </ul>
        </VendorInsightBlock>
        <VendorInsightBlock icon={Activity} title="Interpretation">
          <p className="text-[13px] leading-6 text-[#DDE6F8]">{insight.interpretation}</p>
        </VendorInsightBlock>
        <VendorInsightBlock icon={Lightbulb} title="Recommendation">
          <p className="text-[13px] leading-6 text-[#DDE6F8]">{insight.recommendation}</p>
        </VendorInsightBlock>
      </div>
    </motion.aside>
  );
}

function MiniChart({ data, field, color }: { data: { month: string; [key: string]: number | string }[]; field: string; color: string }) {
  const values = data.map(d => d[field] as number);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 220;
  const h = 50;
  const pad = 4;
  const points = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - (((d[field] as number) - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  }).join(' ');
  return (
    <div className="flex flex-col gap-1">
      <svg width={w} height={h} className="overflow-visible">
        <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => {
          const x = pad + (i / (data.length - 1)) * (w - pad * 2);
          const y = h - pad - (((d[field] as number) - min) / range) * (h - pad * 2);
          return <circle key={i} cx={x} cy={y} r={2.5} fill={color} />;
        })}
      </svg>
      <div className="flex justify-between px-1">
        {data.map(d => (
          <span key={d.month} className="text-[9px] text-[#7A94B4]">{d.month}</span>
        ))}
      </div>
    </div>
  );
}

function computePeerAvgs(vendors: VendorIntelData[]) {
  if (vendors.length === 0) return { sla: 85, ftf: 80, evc: 85 };
  return {
    sla: Math.round(vendors.reduce((s, v) => s + v.slaCompliance, 0) / vendors.length),
    ftf: Math.round(vendors.reduce((s, v) => s + v.firstTimeFixRate, 0) / vendors.length),
    evc: Math.round(vendors.reduce((s, v) => s + v.evidenceCompliance, 0) / vendors.length),
  };
}

function VendorDetailPage({ vendor, onBack, onToast }: { vendor: VendorIntelData; onBack: () => void; onToast: ToastFn }) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedMetricInsight, setSelectedMetricInsight] = useState<VendorMetricInsight | null>(null);
  const { vendors: allVendors } = useVendors();

  const score = computeVendorScore(vendor);
  const riskLevel = classifyVendorRisk(score);
  const projectedScore = computeVendorScore({ ...vendor, slaCompliance: vendor.projectedTrend === 'up' ? Math.min(100, vendor.slaCompliance + 3) : vendor.projectedTrend === 'down' ? Math.max(0, vendor.slaCompliance - 5) : vendor.slaCompliance });

  const peerAvgs = computePeerAvgs(allVendors);
  const rankedVendors = [...allVendors].sort((a, b) => computeVendorScore(b) - computeVendorScore(a));
  const benchmarkRank = rankedVendors.findIndex(v => v.id === vendor.id) + 1;

  const sections = ['Overview', 'AI Insights', 'Contract Compliance', 'Cost vs Performance', 'Benchmarking', 'Predictive Risk', 'Recommendations', 'Dependency Risk'];
  const openMetricInsight = (metricName: VendorMetricName) => setSelectedMetricInsight(buildVendorMetricInsight(vendor, metricName));

  return (
    <div className="relative h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-[rgba(46,127,255,0.15)] flex-shrink-0">
        <button onClick={onBack} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#7A94B4] hover:text-white transition-all">
          <ArrowLeft size={14} />
        </button>
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#2E7FFF]/15 flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={15} className="text-[#2E7FFF]" />
          </div>
          <div className="min-w-0">
            <h2 className="text-[#EEF3FA] font-bold text-sm truncate" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{vendor.name}</h2>
            <p className="text-[10px] text-[#7A94B4]">{vendor.category} · {vendor.sites.join(', ')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${riskBg(riskLevel)}`}>{riskLevel}</span>
          <button
            onClick={() => setShowReassignModal(true)}
            className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600/30 transition-all"
          >
            Reassign Work
          </button>
          <button
            onClick={() => setShowReviewModal(true)}
            className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-amber-600/20 border border-amber-500/30 text-amber-400 hover:bg-amber-600/30 transition-all"
          >
            Trigger Vendor Review
          </button>
        </div>
      </div>

      <div className="flex gap-1 px-5 py-2 border-b border-[rgba(46,127,255,0.08)] overflow-x-auto no-scrollbar flex-shrink-0">
        {sections.map(s => (
          <button
            key={s}
            onClick={() => {
              const el = document.getElementById(`vendor-section-${s.replace(/\s/g, '-')}`);
              el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              setActiveSection(s);
            }}
            className={`text-[10px] px-3 py-1.5 rounded-lg whitespace-nowrap font-semibold transition-all flex-shrink-0 ${
              activeSection === s ? 'bg-[#2E7FFF]/20 text-[#2E7FFF]' : 'text-[#7A94B4] hover:text-[#EEF3FA] hover:bg-white/5'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-4">
        <div id="vendor-section-Overview">
          <DetailSection icon={<Star size={12} className="text-[#2E7FFF]" />} title="Overview">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="relative col-span-2 sm:col-span-1 flex items-center gap-4 bg-[#0D1E3A] rounded-xl p-3 pr-10">
                <VendorAIInsightBadge onClick={() => openMetricInsight('Vendor Score')} />
                <ScoreRing score={score} size={64} />
                <div>
                  <div className="text-[10px] text-[#7A94B4] mb-0.5">Vendor Score</div>
                  <div className="flex items-center gap-1.5">
                    <TrendIcon trend={vendor.trend} size={14} />
                    <span className="text-[11px] text-[#7A94B4]">{vendor.trend === 'up' ? 'Improving' : vendor.trend === 'down' ? 'Declining' : 'Stable'}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1 inline-block ${riskBg(riskLevel)}`}>{riskLevel}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 col-span-2 sm:col-span-1">
                {[
                  { label: 'SLA Compliance', value: `${vendor.slaCompliance}%`, color: scoreColor(vendor.slaCompliance), metric: 'SLA Compliance' as const },
                  { label: 'First-Time Fix', value: `${vendor.firstTimeFixRate}%`, color: scoreColor(vendor.firstTimeFixRate), metric: 'First-Time Fix' as const },
                  { label: 'Avg Resolution', value: `${vendor.avgResolutionMin} min`, color: vendor.avgResolutionMin <= 45 ? '#38D98A' : vendor.avgResolutionMin <= 60 ? '#FF9B38' : '#FF4B4B', metric: 'Avg Resolution' as const },
                  { label: 'Evidence Compliance', value: `${vendor.evidenceCompliance}%`, color: scoreColor(vendor.evidenceCompliance), metric: 'Evidence Compliance' as const },
                ].map(k => (
                  <div key={k.label} className="relative bg-[#0A1628] rounded-lg p-2 pr-9 text-center">
                    <VendorAIInsightBadge onClick={() => openMetricInsight(k.metric)} />
                    <div className="text-[12px] font-bold" style={{ color: k.color }}>{k.value}</div>
                    <div className="text-[9px] text-[#7A94B4] mt-0.5">{k.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Active Contracts', value: vendor.activeContracts, icon: <Building2 size={10} className="text-[#2E7FFF]" />, metric: 'Active Contracts' as const },
                { label: 'Jobs Last 30d', value: vendor.jobsLast30d, icon: <CheckCircle size={10} className="text-emerald-400" />, metric: 'Jobs Last 30d' as const },
                { label: 'Avg Cost/Job', value: `AED ${vendor.avgCostPerJob}`, icon: <DollarSign size={10} className="text-amber-400" />, metric: 'Avg Cost/Job' as const },
              ].map(k => (
                <div key={k.label} className="relative bg-[#0A1628] rounded-lg p-2.5 pr-10">
                  <VendorAIInsightBadge onClick={() => openMetricInsight(k.metric)} />
                  <div className="flex items-center gap-1 mb-1">{k.icon}<span className="text-[9px] text-[#7A94B4]">{k.label}</span></div>
                  <div className="text-[13px] font-bold text-[#EEF3FA]">{k.value}</div>
                </div>
              ))}
            </div>
            {vendor.anomaly && (
              <div className="mt-3 flex items-start gap-2 bg-red-500/8 border border-red-500/25 rounded-lg p-2.5">
                <AlertTriangle size={13} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-red-300">{vendor.anomaly}</p>
              </div>
            )}
          </DetailSection>
        </div>

        <div id="vendor-section-AI-Insights">
          <DetailSection icon={<Brain size={12} className="text-[#2E7FFF]" />} title="AI Insights">
            <div className="space-y-2">
              {vendor.insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-2 bg-[#0D1E3A] rounded-lg p-2.5">
                  <Zap size={11} className="text-[#2E7FFF] flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-[#C8D8EE] leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="bg-[#0A1628] rounded-lg p-2.5">
                <div className="text-[9px] text-[#7A94B4] mb-1.5 uppercase tracking-wide">Repeat Failure Rate</div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] font-bold" style={{ color: vendor.repeatFailureRate <= 6 ? '#38D98A' : vendor.repeatFailureRate <= 10 ? '#FF9B38' : '#FF4B4B' }}>{vendor.repeatFailureRate}%</span>
                </div>
                <MiniBar value={vendor.repeatFailureRate} max={20} color={vendor.repeatFailureRate <= 6 ? '#38D98A' : vendor.repeatFailureRate <= 10 ? '#FF9B38' : '#FF4B4B'} />
              </div>
              <div className="bg-[#0A1628] rounded-lg p-2.5">
                <div className="text-[9px] text-[#7A94B4] mb-1.5 uppercase tracking-wide">Contract Expiry</div>
                <div className="text-[13px] font-bold text-[#EEF3FA]">{vendor.contractExpiry}</div>
                <div className="text-[9px] text-[#7A94B4] mt-0.5">{vendor.activeContracts} active contract{vendor.activeContracts !== 1 ? 's' : ''}</div>
              </div>
            </div>
          </DetailSection>
        </div>

        <div id="vendor-section-Contract-Compliance">
          <DetailSection icon={<CheckCircle size={12} className="text-[#2E7FFF]" />} title="Contract Compliance">
            {vendor.contractFlags.length === 0 ? (
              <div className="flex items-center gap-2 bg-emerald-500/8 border border-emerald-500/20 rounded-lg p-3">
                <CheckCircle size={14} className="text-emerald-400" />
                <p className="text-[11px] text-emerald-300">No contract breaches or compliance flags. All obligations current.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {vendor.contractFlags.map((flag, i) => (
                  <div key={i} className={`flex items-start gap-2 rounded-lg p-2.5 border ${
                    flag.type === 'breach' ? 'bg-red-500/8 border-red-500/25' : 'bg-amber-500/8 border-amber-500/20'
                  }`}>
                    {flagIcon(flag.type)}
                    <div>
                      <span className={`text-[9px] font-bold uppercase tracking-wide mr-2 ${flag.type === 'breach' ? 'text-red-400' : 'text-amber-400'}`}>
                        {flag.type === 'breach' ? 'SLA Breach' : flag.type === 'missing' ? 'Missing Evidence' : 'Warning'}
                      </span>
                      <p className="text-[11px] text-[#C8D8EE] mt-0.5">{flag.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { label: 'SLA Compliance', value: `${vendor.slaCompliance}%`, ok: vendor.slaCompliance >= 85 },
                { label: 'Evidence Rate', value: `${vendor.evidenceCompliance}%`, ok: vendor.evidenceCompliance >= 85 },
                { label: 'Contract Flags', value: vendor.contractFlags.length, ok: vendor.contractFlags.length === 0 },
              ].map(k => (
                <div key={k.label} className="bg-[#0A1628] rounded-lg p-2 text-center">
                  <div className={`text-[13px] font-bold ${k.ok ? 'text-emerald-400' : 'text-red-400'}`}>{k.value}</div>
                  <div className="text-[9px] text-[#7A94B4] mt-0.5">{k.label}</div>
                </div>
              ))}
            </div>
          </DetailSection>
        </div>

        <div id="vendor-section-Cost-vs-Performance">
          <DetailSection icon={<DollarSign size={12} className="text-[#2E7FFF]" />} title="Cost vs Performance">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-[#0D1E3A] rounded-xl p-3">
                <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-2">Cost Trend (AED/Job)</div>
                <MiniChart data={vendor.costTrend} field="cost" color="#FF9B38" />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] font-bold text-amber-400">AED {vendor.avgCostPerJob}</span>
                  <span className="text-[10px] text-[#7A94B4]">vs peer AED {vendor.costTrend[vendor.costTrend.length - 1].peerAvg}</span>
                </div>
              </div>
              <div className="bg-[#0D1E3A] rounded-xl p-3">
                <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-2">Score Trend</div>
                <MiniChart data={vendor.scoreTrend} field="score" color={scoreColor(score)} />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] font-bold" style={{ color: scoreColor(score) }}>{score} pts</span>
                  <div className="flex items-center gap-1">
                    <TrendIcon trend={vendor.trend} size={12} />
                    <span className="text-[10px] text-[#7A94B4]">{vendor.trend}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[#0A1628] rounded-lg p-2.5">
              <div className="text-[10px] text-[#7A94B4] mb-2">Cost vs Peer Average</div>
              <div className="space-y-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-[#EEF3FA]">{vendor.name}</span>
                    <span className="text-[10px] font-bold text-amber-400">AED {vendor.avgCostPerJob}</span>
                  </div>
                  <div className="h-1.5 bg-[#0D1E3A] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(vendor.avgCostPerJob / 600) * 100}%` }}
                      transition={{ duration: 0.6 }}
                      className="h-full rounded-full bg-amber-400"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-[#7A94B4]">Peer Average</span>
                    <span className="text-[10px] text-[#7A94B4]">AED {vendor.costTrend[vendor.costTrend.length - 1].peerAvg}</span>
                  </div>
                  <div className="h-1.5 bg-[#0D1E3A] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#7A94B4]"
                      style={{ width: `${(vendor.costTrend[vendor.costTrend.length - 1].peerAvg / 600) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </DetailSection>
        </div>

        <div id="vendor-section-Benchmarking">
          <DetailSection icon={<BarChart3 size={12} className="text-[#2E7FFF]" />} title="Benchmarking">
            <div className="mb-3 flex items-center gap-3 bg-[#0D1E3A] rounded-xl p-3">
              <div className="text-center">
                <div className="text-[22px] font-bold" style={{ color: scoreColor(score), fontFamily: 'Space Grotesk, sans-serif' }}>#{benchmarkRank}</div>
                <div className="text-[9px] text-[#7A94B4]">of {rankedVendors.length}</div>
              </div>
              <div className="flex-1 space-y-1.5">
                {rankedVendors.map((v, i) => {
                  const vs = computeVendorScore(v);
                  return (
                    <div key={v.id} className={`flex items-center gap-2 rounded px-1.5 py-0.5 ${v.id === vendor.id ? 'bg-[#2E7FFF]/15' : ''}`}>
                      <span className="text-[9px] text-[#7A94B4] w-4">#{i + 1}</span>
                      <span className={`text-[10px] flex-1 truncate ${v.id === vendor.id ? 'text-[#EEF3FA] font-semibold' : 'text-[#7A94B4]'}`}>{v.name}</span>
                      <div className="h-1 rounded-full overflow-hidden" style={{ width: '60px', background: '#0A1628' }}>
                        <div className="h-full rounded-full" style={{ width: `${vs}%`, background: scoreColor(vs) }} />
                      </div>
                      <span className="text-[9px] font-bold w-6 text-right" style={{ color: scoreColor(vs) }}>{vs}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'SLA Compliance', value: vendor.slaCompliance, peerAvg: peerAvgs.sla },
                { label: 'First-Time Fix', value: vendor.firstTimeFixRate, peerAvg: peerAvgs.ftf },
                { label: 'Evidence Rate', value: vendor.evidenceCompliance, peerAvg: peerAvgs.evc },
              ].map(k => (
                <div key={k.label} className="bg-[#0A1628] rounded-lg p-2.5">
                  <div className="text-[9px] text-[#7A94B4] mb-1">{k.label}</div>
                  <div className="text-[12px] font-bold mb-1" style={{ color: scoreColor(k.value) }}>{k.value}%</div>
                  <div className="text-[8px] text-[#7A94B4]">Peer avg: {k.peerAvg}%</div>
                </div>
              ))}
            </div>
          </DetailSection>
        </div>

        <div id="vendor-section-Predictive-Risk">
          <DetailSection icon={<AlertTriangle size={12} className="text-[#2E7FFF]" />} title="Predictive Risk">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0D1E3A] rounded-xl p-3">
                <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-2">30-Day Risk Score</div>
                <div className="flex items-end gap-2">
                  <span className="text-[28px] font-bold" style={{ color: vendor.predictedRisk30d >= 35 ? '#FF4B4B' : vendor.predictedRisk30d >= 20 ? '#FF9B38' : '#38D98A', fontFamily: 'Space Grotesk, sans-serif' }}>
                    {vendor.predictedRisk30d}%
                  </span>
                </div>
                <div className="h-1.5 bg-[#0A1628] rounded-full overflow-hidden mt-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${vendor.predictedRisk30d}%` }}
                    transition={{ duration: 0.6 }}
                    className="h-full rounded-full"
                    style={{ background: vendor.predictedRisk30d >= 35 ? '#FF4B4B' : vendor.predictedRisk30d >= 20 ? '#FF9B38' : '#38D98A' }}
                  />
                </div>
                <p className="text-[10px] text-[#7A94B4] mt-2">
                  {vendor.predictedRisk30d >= 35 ? 'High risk of SLA breach or contract escalation in next 30 days.' : vendor.predictedRisk30d >= 20 ? 'Moderate risk — monitor closely and prepare contingency.' : 'Low risk — current trajectory is sustainable.'}
                </p>
              </div>
              <div className="bg-[#0D1E3A] rounded-xl p-3">
                <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-2">Projected 30-Day Score</div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[28px] font-bold" style={{ color: scoreColor(projectedScore), fontFamily: 'Space Grotesk, sans-serif' }}>{projectedScore}</span>
                  <TrendIcon trend={vendor.projectedTrend} size={18} />
                </div>
                <div className="text-[10px] text-[#7A94B4]">
                  {projectedScore > score ? `+${projectedScore - score} pts projected` : projectedScore < score ? `${projectedScore - score} pts projected` : 'Score expected to remain stable'}
                </div>
              </div>
            </div>
          </DetailSection>
        </div>

        <div id="vendor-section-Recommendations">
          <DetailSection icon={<Target size={12} className="text-[#2E7FFF]" />} title="Recommendations">
            <div className="space-y-2.5">
              {vendor.recommendations.map((rec, i) => (
                <div key={i} className="bg-[#0D1E3A] rounded-xl p-3 border border-[rgba(46,127,255,0.1)]">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-[12px] font-semibold text-[#EEF3FA]">{rec.title}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border flex-shrink-0 ${actionColor(rec.action)}`}>
                      {rec.action === 'reassign' ? 'Reassign' : rec.action === 'renegotiate' ? 'Renegotiate' : rec.action === 'review' ? 'Trigger Review' : 'Limit Scope'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#7A94B4] leading-relaxed">{rec.detail}</p>
                  {(rec.action === 'reassign' || rec.action === 'review') && (
                    <button
                      onClick={() => rec.action === 'reassign' ? setShowReassignModal(true) : setShowReviewModal(true)}
                      className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-[#2E7FFF] hover:text-white transition-colors"
                    >
                      <ChevronRight size={11} />
                      {rec.action === 'reassign' ? 'Reassign Work Now' : 'Trigger Vendor Review'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </DetailSection>
        </div>

        <div id="vendor-section-Dependency-Risk">
          <DetailSection icon={<Users size={12} className="text-[#2E7FFF]" />} title="Dependency Risk">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${dependencyColor(vendor.dependencyRisk)}18`, border: `1px solid ${dependencyColor(vendor.dependencyRisk)}30` }}>
                <span className="text-[11px] font-bold" style={{ color: dependencyColor(vendor.dependencyRisk) }}>{vendor.dependencyRisk}</span>
              </div>
              <p className="text-[11px] text-[#C8D8EE] flex-1 leading-relaxed">{vendor.dependencyNote}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#0A1628] rounded-lg p-2.5">
                <div className="text-[9px] text-[#7A94B4] mb-1">Sites Covered</div>
                {vendor.sites.map(s => (
                  <div key={s} className="flex items-center gap-1 mt-0.5">
                    <div className="w-1 h-1 rounded-full bg-[#2E7FFF]" />
                    <span className="text-[10px] text-[#EEF3FA]">{s}</span>
                  </div>
                ))}
              </div>
              <div className="bg-[#0A1628] rounded-lg p-2.5">
                <div className="text-[9px] text-[#7A94B4] mb-1">Active Contracts</div>
                <div className="text-[20px] font-bold text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{vendor.activeContracts}</div>
                <div className="text-[9px] text-[#7A94B4]">Expiry: {vendor.contractExpiry}</div>
              </div>
            </div>
          </DetailSection>
        </div>
      </div>

      <AnimatePresence>
        {selectedMetricInsight && (
          <>
            <div className="absolute inset-0 z-30 bg-black/20" onClick={() => setSelectedMetricInsight(null)} />
            <VendorMetricInsightPanel insight={selectedMetricInsight} onClose={() => setSelectedMetricInsight(null)} />
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReassignModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 px-6"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0D1E3A] border border-[rgba(46,127,255,0.3)] rounded-2xl p-5 max-w-sm w-full"
            >
              <h3 className="text-[#EEF3FA] font-bold text-sm mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Reassign Work — {vendor.name}</h3>
              <p className="text-[11px] text-[#7A94B4] mb-4 leading-relaxed">
                This will flag active jobs assigned to <strong className="text-[#EEF3FA]">{vendor.name}</strong> for reassignment to alternate vendors. Operations team will be notified to action.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowReassignModal(false); onToast(`Reassignment initiated for ${vendor.name} — Operations notified`, 'success'); }}
                  className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-[12px] font-semibold hover:bg-blue-500 transition-all"
                >
                  Confirm Reassignment
                </button>
                <button
                  onClick={() => setShowReassignModal(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 text-[#7A94B4] text-[12px] hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReviewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 px-6"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0D1E3A] border border-[rgba(46,127,255,0.3)] rounded-2xl p-5 max-w-sm w-full"
            >
              <h3 className="text-[#EEF3FA] font-bold text-sm mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Trigger Vendor Review — {vendor.name}</h3>
              <p className="text-[11px] text-[#7A94B4] mb-4 leading-relaxed">
                A formal performance review will be initiated for <strong className="text-[#EEF3FA]">{vendor.name}</strong>. The vendor will receive a 14-day notice to respond with a corrective action plan.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowReviewModal(false); onToast(`Vendor review triggered for ${vendor.name} — 14-day notice issued`, 'warning'); }}
                  className="flex-1 py-2 rounded-lg bg-amber-600/80 text-white text-[12px] font-semibold hover:bg-amber-500 transition-all"
                >
                  Confirm Trigger
                </button>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 text-[#7A94B4] text-[12px] hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function VendorWizardField({
  label,
  children,
  helper,
}: {
  label: string;
  children: React.ReactNode;
  helper?: string;
}) {
  return (
    <label className="space-y-1.5">
      <span className="block text-[9px] font-bold uppercase tracking-[0.18em] text-[#7A94B4]">{label}</span>
      {children}
      {helper && <span className="block text-[9px] text-[#5A7393]">{helper}</span>}
    </label>
  );
}

function VendorWizardInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-[rgba(46,127,255,0.22)] bg-[#07111F] px-3 py-2.5 text-[12px] text-[#EEF3FA] outline-none transition-all placeholder:text-[#4A6480] focus:border-[#2E7FFF] ${props.className ?? ''}`}
    />
  );
}

function VendorWizardSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-xl border border-[rgba(46,127,255,0.22)] bg-[#07111F] px-3 py-2.5 text-[12px] text-[#EEF3FA] outline-none transition-all focus:border-[#2E7FFF] ${props.className ?? ''}`}
    />
  );
}

function VendorWizardSummaryPill({ label, value, tone = 'blue' }: { label: string; value: string; tone?: 'blue' | 'green' | 'amber' | 'red' | 'purple' }) {
  const toneCls = {
    blue: 'border-[#2E7FFF]/25 bg-[#2E7FFF]/10 text-[#8DBDFF]',
    green: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
    amber: 'border-amber-500/25 bg-amber-500/10 text-amber-300',
    red: 'border-red-500/25 bg-red-500/10 text-red-300',
    purple: 'border-purple-500/25 bg-purple-500/10 text-purple-300',
  }[tone];
  return (
    <div className={`rounded-xl border px-3 py-2 ${toneCls}`}>
      <div className="text-[9px] uppercase tracking-[0.16em] opacity-70">{label}</div>
      <div className="mt-1 text-[13px] font-bold">{value}</div>
    </div>
  );
}

function AddVendorWizard({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (vendor: VendorIntelData) => void;
}) {
  const [step, setStep] = useState<VendorWizardStep>(1);
  const [form, setForm] = useState<VendorWizardForm>(initialVendorWizardForm);
  const score = vendorWizardScore(form);
  const risk = classifyVendorRisk(score);
  const flags = parseVendorFlags(form.contractFlags);
  const sites = parseVendorSites(form.sites);
  const riskTone = risk === 'Preferred' ? 'green' : risk === 'Watchlist' ? 'amber' : 'red';
  const input = (field: keyof VendorWizardForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const stepCards = [
    { id: 1 as const, label: 'Vendor profile', detail: 'Scope, category, contacts' },
    { id: 2 as const, label: 'Performance baseline', detail: 'Score, SLA, evidence, cost' },
    { id: 3 as const, label: 'Compliance and risk', detail: 'Flags, dependency, prediction' },
    { id: 4 as const, label: 'AI review', detail: 'Insights and actions' },
  ];

  const dashboardSections = [
    { label: 'Overview', value: `${score}/100 score`, tone: riskTone },
    { label: 'Contract Compliance', value: `${flags.length} flags`, tone: flags.length ? 'amber' : 'green' },
    { label: 'Cost vs Performance', value: `AED ${numeric(form.avgCostPerJob, 450)}/job`, tone: 'amber' },
    { label: 'Predictive Risk', value: `${numeric(form.predictedRisk30d, 20)}% in 30d`, tone: numeric(form.predictedRisk30d, 20) > 30 ? 'red' : 'blue' },
    { label: 'Dependency Risk', value: form.dependencyRisk, tone: form.dependencyRisk === 'Low' ? 'green' : form.dependencyRisk === 'Medium' ? 'amber' : 'red' },
  ] as const;

  function submit() {
    onCreate(buildVendorFromWizard(form));
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 bg-[#020814]/80 backdrop-blur-sm"
    >
      <div className="flex h-full items-center justify-center p-5">
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[rgba(46,127,255,0.28)] bg-[#081528] shadow-2xl"
        >
          <div className="flex items-start justify-between border-b border-[rgba(46,127,255,0.16)] bg-gradient-to-r from-[#121D3E] to-[#0A1628] px-6 py-5">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#2E7FFF]/25 bg-[#2E7FFF]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8DBDFF]">
                <Sparkles size={12} />
                VendorIQ setup
              </div>
              <h3 className="text-xl font-bold text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Add Vendor</h3>
              <p className="mt-1 text-[12px] text-[#8AA6C8]">Create the vendor exactly as Vendor Intelligence monitors it: score, contracts, cost, risk, dependency, and AI recommendations.</p>
            </div>
            <button onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 p-2 text-[#8AA6C8] transition-colors hover:bg-white/10 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2 border-b border-[rgba(46,127,255,0.12)] px-6 py-4">
            {stepCards.map(card => (
              <button
                key={card.id}
                type="button"
                onClick={() => setStep(card.id)}
                className={`rounded-xl border p-3 text-left transition-all ${
                  step === card.id
                    ? 'border-[#2E7FFF]/45 bg-[#2E7FFF]/14'
                    : card.id < step
                      ? 'border-emerald-500/25 bg-emerald-500/8'
                      : 'border-[rgba(46,127,255,0.12)] bg-[#06111F]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold ${step === card.id ? 'bg-[#2E7FFF] text-white' : 'bg-[#102544] text-[#8AA6C8]'}`}>{card.id}</span>
                  <span className="text-[11px] font-bold text-[#EEF3FA]">{card.label}</span>
                </div>
                <p className="mt-1 text-[10px] text-[#7A94B4]">{card.detail}</p>
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5">
            {step === 1 && (
              <div className="grid gap-5 lg:grid-cols-[1.35fr_0.9fr]">
                <div className="rounded-2xl border border-[rgba(46,127,255,0.16)] bg-[#07111F] p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Building2 size={15} className="text-[#2E7FFF]" />
                    <h4 className="text-sm font-bold text-[#EEF3FA]">Vendor profile and service scope</h4>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <VendorWizardField label="Vendor name">
                      <VendorWizardInput value={form.name} onChange={input('name')} />
                    </VendorWizardField>
                    <VendorWizardField label="Category">
                      <VendorWizardSelect value={form.category} onChange={input('category')}>
                        {vendorCategories.map(category => <option key={category}>{category}</option>)}
                      </VendorWizardSelect>
                    </VendorWizardField>
                    <VendorWizardField label="Sites covered" helper="Comma separated">
                      <VendorWizardInput value={form.sites} onChange={input('sites')} />
                    </VendorWizardField>
                    <VendorWizardField label="Contract expiry">
                      <VendorWizardInput value={form.contractExpiry} onChange={input('contractExpiry')} />
                    </VendorWizardField>
                    <VendorWizardField label="Primary contact">
                      <VendorWizardInput value={form.pocName} onChange={input('pocName')} />
                    </VendorWizardField>
                    <VendorWizardField label="Contact title">
                      <VendorWizardInput value={form.pocTitle} onChange={input('pocTitle')} />
                    </VendorWizardField>
                    <VendorWizardField label="Phone">
                      <VendorWizardInput value={form.pocPhone} onChange={input('pocPhone')} />
                    </VendorWizardField>
                    <VendorWizardField label="Email">
                      <VendorWizardInput type="email" value={form.pocEmail} onChange={input('pocEmail')} />
                    </VendorWizardField>
                  </div>
                </div>
                <div className="rounded-2xl border border-purple-500/20 bg-purple-500/8 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Brain size={15} className="text-purple-300" />
                    <h4 className="text-sm font-bold text-[#EEF3FA]">How this maps to VendorIQ</h4>
                  </div>
                  <div className="space-y-2 text-[12px] text-[#C8D8EE]">
                    <p>Vendor profile powers the dashboard header, contract scope, dependency risk, and routing decisions.</p>
                    <p>Sites become the coverage map for reassignment, risk concentration, and contract lapse impact.</p>
                    <p>Contact details are used by review, renewal, and performance notice workflows.</p>
                  </div>
                  <div className="mt-4 grid gap-2">
                    <VendorWizardSummaryPill label="Coverage" value={`${sites.length || 1} site scope`} tone="blue" />
                    <VendorWizardSummaryPill label="Contract" value={form.contractExpiry || 'Not set'} tone="amber" />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
                <div className="rounded-2xl border border-[rgba(46,127,255,0.16)] bg-[#07111F] p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Activity size={15} className="text-[#2E7FFF]" />
                    <h4 className="text-sm font-bold text-[#EEF3FA]">Performance baseline</h4>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <VendorWizardField label="SLA compliance %"><VendorWizardInput type="number" min="0" max="100" value={form.slaCompliance} onChange={input('slaCompliance')} /></VendorWizardField>
                    <VendorWizardField label="First-time fix %"><VendorWizardInput type="number" min="0" max="100" value={form.firstTimeFixRate} onChange={input('firstTimeFixRate')} /></VendorWizardField>
                    <VendorWizardField label="Avg resolution minutes"><VendorWizardInput type="number" min="0" value={form.avgResolutionMin} onChange={input('avgResolutionMin')} /></VendorWizardField>
                    <VendorWizardField label="Evidence compliance %"><VendorWizardInput type="number" min="0" max="100" value={form.evidenceCompliance} onChange={input('evidenceCompliance')} /></VendorWizardField>
                    <VendorWizardField label="Repeat failure %"><VendorWizardInput type="number" min="0" max="100" value={form.repeatFailureRate} onChange={input('repeatFailureRate')} /></VendorWizardField>
                    <VendorWizardField label="Jobs last 30 days"><VendorWizardInput type="number" min="0" value={form.jobsLast30d} onChange={input('jobsLast30d')} /></VendorWizardField>
                    <VendorWizardField label="Avg cost / job"><VendorWizardInput type="number" min="0" value={form.avgCostPerJob} onChange={input('avgCostPerJob')} /></VendorWizardField>
                    <VendorWizardField label="Active contracts"><VendorWizardInput type="number" min="0" value={form.activeContracts} onChange={input('activeContracts')} /></VendorWizardField>
                  </div>
                </div>
                <div className="rounded-2xl border border-[rgba(46,127,255,0.16)] bg-[#0D1E3A] p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-[#EEF3FA]">Live score preview</h4>
                      <p className="text-[11px] text-[#7A94B4]">Uses the same scoring logic as the dashboard.</p>
                    </div>
                    <ScoreRing score={score} size={72} />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {dashboardSections.slice(0, 3).map(item => (
                      <VendorWizardSummaryPill key={item.label} label={item.label} value={item.value} tone={item.tone} />
                    ))}
                  </div>
                  <div className="mt-4 rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#07111F] p-3">
                    <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A94B4]">Interpretation</div>
                    <p className="mt-2 text-[12px] leading-relaxed text-[#C8D8EE]">
                      {risk === 'Preferred'
                        ? 'This vendor can enter preferred rotation once compliance documents are confirmed.'
                        : risk === 'Watchlist'
                          ? 'This vendor should start with controlled scope and a short KPI review cycle.'
                          : 'This vendor should not receive critical work until performance controls are agreed.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-2xl border border-[rgba(46,127,255,0.16)] bg-[#07111F] p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <ShieldCheck size={15} className="text-[#2E7FFF]" />
                    <h4 className="text-sm font-bold text-[#EEF3FA]">Compliance, risk, and dependency</h4>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <VendorWizardField label="Trend">
                      <VendorWizardSelect value={form.trend} onChange={input('trend')}>
                        <option value="up">Improving</option>
                        <option value="flat">Stable</option>
                        <option value="down">Declining</option>
                      </VendorWizardSelect>
                    </VendorWizardField>
                    <VendorWizardField label="Dependency risk">
                      <VendorWizardSelect value={form.dependencyRisk} onChange={input('dependencyRisk')}>
                        {['Low', 'Medium', 'High', 'Critical'].map(level => <option key={level}>{level}</option>)}
                      </VendorWizardSelect>
                    </VendorWizardField>
                    <VendorWizardField label="30-day predicted risk %">
                      <VendorWizardInput type="number" min="0" max="100" value={form.predictedRisk30d} onChange={input('predictedRisk30d')} />
                    </VendorWizardField>
                    <VendorWizardField label="Contract flags" helper="Separate multiple flags with semicolons">
                      <VendorWizardInput value={form.contractFlags} onChange={input('contractFlags')} />
                    </VendorWizardField>
                    <div className="sm:col-span-2">
                      <VendorWizardField label="Dependency note">
                        <textarea value={form.dependencyNote} onChange={input('dependencyNote')} className="min-h-[92px] w-full rounded-xl border border-[rgba(46,127,255,0.22)] bg-[#07111F] px-3 py-2.5 text-[12px] text-[#EEF3FA] outline-none transition-all placeholder:text-[#4A6480] focus:border-[#2E7FFF]" />
                      </VendorWizardField>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/8 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <AlertTriangle size={15} className="text-amber-300" />
                    <h4 className="text-sm font-bold text-[#EEF3FA]">Dashboard impact</h4>
                  </div>
                  <div className="grid gap-2">
                    {dashboardSections.slice(2).map(item => (
                      <VendorWizardSummaryPill key={item.label} label={item.label} value={item.value} tone={item.tone} />
                    ))}
                  </div>
                  <div className="mt-4 space-y-2">
                    {flags.length === 0 ? (
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-[12px] text-emerald-300">No contract flags will be shown at onboarding.</div>
                    ) : (
                      flags.map((flag, index) => (
                        <div key={index} className="rounded-xl border border-amber-500/20 bg-[#07111F] p-3 text-[12px] text-[#C8D8EE]">{flag.description}</div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
                <div className="rounded-2xl border border-purple-500/20 bg-purple-500/8 p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Brain size={15} className="text-purple-300" />
                    <h4 className="text-sm font-bold text-[#EEF3FA]">AI insight preview</h4>
                  </div>
                  <div className="space-y-2">
                    {buildVendorInsights(form, score).map((insight, index) => (
                      <div key={index} className="rounded-xl bg-[#07111F] p-3 text-[12px] leading-relaxed text-[#C8D8EE]">
                        {insight}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-[rgba(46,127,255,0.16)] bg-[#07111F] p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Target size={15} className="text-[#2E7FFF]" />
                    <h4 className="text-sm font-bold text-[#EEF3FA]">Recommendations generated</h4>
                  </div>
                  <div className="space-y-3">
                    {buildVendorRecommendations(form, score).map((rec, index) => (
                      <div key={index} className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#0D1E3A] p-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[12px] font-bold text-[#EEF3FA]">{rec.title}</span>
                          <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${actionColor(rec.action)}`}>{rec.action}</span>
                        </div>
                        <p className="mt-2 text-[11px] leading-relaxed text-[#8AA6C8]">{rec.detail}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <VendorWizardSummaryPill label="Score" value={`${score}/100`} tone={riskTone} />
                    <VendorWizardSummaryPill label="Classification" value={risk} tone={riskTone} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-[rgba(46,127,255,0.14)] px-6 py-4">
            <div className="text-[11px] text-[#7A94B4]">
              {step < 4 ? 'VendorIQ will generate score, risk tier, AI insights, recommendations, and dependency context.' : 'Ready to add this vendor to Vendor Intelligence.'}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={step === 1 ? onClose : () => setStep(prev => (Math.max(1, prev - 1) as VendorWizardStep))} className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#07111F] px-4 py-2 text-[12px] font-semibold text-[#8AA6C8] transition-all hover:bg-white/5 hover:text-white">
                {step === 1 ? 'Cancel' : 'Back'}
              </button>
              {step < 4 ? (
                <button type="button" onClick={() => setStep(prev => (Math.min(4, prev + 1) as VendorWizardStep))} className="rounded-xl bg-[#2E7FFF] px-5 py-2 text-[12px] font-bold text-white shadow-lg shadow-[#2E7FFF]/20 transition-all hover:bg-[#4B91FF]">
                  Continue
                </button>
              ) : (
                <button type="button" onClick={submit} className="rounded-xl bg-[#ED1D2E] px-5 py-2 text-[12px] font-bold text-white shadow-lg shadow-[#ED1D2E]/20 transition-all hover:bg-[#ff3040]">
                  Add Vendor
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

interface Props { onToast: ToastFn }

export function VendorIntelligence({ onToast }: Props) {
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [selectedVendor, setSelectedVendor] = useState<VendorIntelData | null>(null);
  const [showAddVendorWizard, setShowAddVendorWizard] = useState(false);
  const { vendors: allVendors, addVendor } = useVendors();

  const vendorsWithScores = allVendors.map(v => ({
    vendor: v,
    score: computeVendorScore(v),
    riskLevel: classifyVendorRisk(computeVendorScore(v)),
  }));

  const filteredVendors = (() => {
    const all = [...vendorsWithScores];
    switch (filterTab) {
      case 'top': return all.sort((a, b) => b.score - a.score).filter(v => v.riskLevel === 'Preferred');
      case 'atrisk': return all.filter(v => v.riskLevel === 'At Risk' || (v.riskLevel === 'Watchlist' && v.vendor.trend === 'down'));
      case 'cost': return all.sort((a, b) => a.vendor.avgCostPerJob - b.vendor.avgCostPerJob);
      default: return all.sort((a, b) => b.score - a.score);
    }
  })();

  const tabs: { id: FilterTab; label: string }[] = [
    { id: 'all', label: 'All Vendors' },
    { id: 'top', label: 'Top Vendors' },
    { id: 'atrisk', label: 'At Risk' },
    { id: 'cost', label: 'Cost Efficiency Ranking' },
  ];

  const summary = {
    preferred: vendorsWithScores.filter(v => v.riskLevel === 'Preferred').length,
    watchlist: vendorsWithScores.filter(v => v.riskLevel === 'Watchlist').length,
    atRisk: vendorsWithScores.filter(v => v.riskLevel === 'At Risk').length,
  };

  function createVendor(vendor: VendorIntelData) {
    addVendor(vendor);
    setShowAddVendorWizard(false);
    setFilterTab('all');
    setSelectedVendor(vendor);
    onToast(`${vendor.name} added to Vendor Intelligence`, 'success');
  }

  if (selectedVendor) {
    return (
      <div className="absolute inset-0 flex flex-col">
        <VendorDetailPage vendor={selectedVendor} onBack={() => setSelectedVendor(null)} onToast={onToast} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(46,127,255,0.15)] flex-shrink-0">
        <div>
          <h2 className="text-[#EEF3FA] font-bold text-base" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Vendor Intelligence & Contract Optimization</h2>
          <p className="text-[11px] text-[#7A94B4]">AI-powered vendor scoring, risk detection, and contract compliance monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddVendorWizard(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#ED1D2E] px-4 py-2 text-[12px] font-bold text-white shadow-lg shadow-[#ED1D2E]/20 transition-all hover:bg-[#ff3040]"
          >
            <Plus size={14} />
            Add Vendor
          </button>
          <div className="hidden items-center gap-1.5 sm:flex">
            <ShieldCheck size={14} className="text-[#2E7FFF]" />
            <span className="text-[10px] text-[#7A94B4]">4C360 Vendor AI</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 px-5 py-3 border-b border-[rgba(46,127,255,0.08)] flex-shrink-0">
        {[
          { label: 'Preferred', count: summary.preferred, color: '#38D98A' },
          { label: 'Watchlist', count: summary.watchlist, color: '#FF9B38' },
          { label: 'At Risk', count: summary.atRisk, color: '#FF4B4B' },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
            <span className="text-[11px] font-bold" style={{ color: s.color }}>{s.count}</span>
            <span className="text-[11px] text-[#7A94B4]">{s.label}</span>
          </div>
        ))}
        <div className="h-4 w-px bg-[rgba(46,127,255,0.2)] mx-1" />
        <span className="text-[11px] text-[#7A94B4]">{allVendors.length} vendors · {allVendors.reduce((s, v) => s + v.activeContracts, 0)} active contracts</span>
      </div>

      <div className="flex items-center gap-1 px-5 py-2 border-b border-[rgba(46,127,255,0.08)] flex-shrink-0 overflow-x-auto no-scrollbar">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setFilterTab(t.id)}
            className={`text-[11px] px-3 py-1.5 rounded-lg whitespace-nowrap font-semibold transition-all flex-shrink-0 ${
              filterTab === t.id
                ? 'bg-[#2E7FFF]/20 text-[#2E7FFF] border border-[#2E7FFF]/30'
                : 'text-[#7A94B4] hover:text-[#EEF3FA] hover:bg-white/5'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4">
        <div className="bg-[rgba(17,32,64,0.85)] border border-[rgba(46,127,255,0.2)] rounded-xl overflow-hidden">
          <div className="grid grid-cols-[2fr_70px_100px_80px_90px_90px_80px_36px] px-4 py-2 text-[9px] text-[#7A94B4] uppercase tracking-wide border-b border-[rgba(46,127,255,0.1)]">
            {['Vendor', 'Score', 'Risk Level', 'Trend', 'SLA %', 'Avg Cost', 'Contracts', ''].map(h => (
              <div key={h}>{h}</div>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={filterTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {filteredVendors.map(({ vendor, score: vs, riskLevel: vr }, i) => (
                <motion.button
                  key={vendor.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setSelectedVendor(vendor)}
                  className="w-full text-left grid grid-cols-[2fr_70px_100px_80px_90px_90px_80px_36px] px-4 py-3 border-b border-[rgba(46,127,255,0.07)] hover:bg-white/[0.025] transition-all items-center group"
                >
                  <div className="min-w-0">
                    <div className="text-[12px] text-[#EEF3FA] font-semibold truncate">{vendor.name}</div>
                    <div className="text-[10px] text-[#7A94B4] truncate">{vendor.category}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-bold" style={{ color: scoreColor(vs), fontFamily: 'Space Grotesk, sans-serif' }}>{vs}</span>
                  </div>
                  <div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${riskBg(vr)}`}>{vr}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendIcon trend={vendor.trend} size={12} />
                    <span className="text-[10px] text-[#7A94B4]">{vendor.trend}</span>
                  </div>
                  <div>
                    <span className={`text-[12px] font-semibold ${vendor.slaCompliance >= 85 ? 'text-emerald-400' : vendor.slaCompliance >= 72 ? 'text-amber-400' : 'text-red-400'}`}>{vendor.slaCompliance}%</span>
                    <div className="mt-0.5">
                      <MiniBar value={vendor.slaCompliance} max={100} color={vendor.slaCompliance >= 85 ? '#38D98A' : vendor.slaCompliance >= 72 ? '#FF9B38' : '#FF4B4B'} />
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#EEF3FA]">AED {vendor.avgCostPerJob}</span>
                    <div className="text-[9px] text-[#7A94B4]">/job</div>
                  </div>
                  <div>
                    <span className="text-[12px] text-[#EEF3FA] font-semibold">{vendor.activeContracts}</span>
                    <div className="text-[9px] text-[#7A94B4]">exp {vendor.contractExpiry}</div>
                  </div>
                  <div className="flex items-center justify-center">
                    <ChevronRight size={13} className="text-[#7A94B4] group-hover:text-[#EEF3FA] transition-colors" />
                  </div>
                </motion.button>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {filteredVendors.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ShieldCheck size={32} className="text-[#7A94B4] mb-3 opacity-40" />
            <p className="text-[12px] text-[#7A94B4]">No vendors match this filter.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAddVendorWizard && (
          <AddVendorWizard
            onClose={() => setShowAddVendorWizard(false)}
            onCreate={createVendor}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
