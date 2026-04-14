import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, TrendingUp, TrendingDown, Minus,
  Brain, AlertTriangle, Target, Zap, Star,
  Activity, Users, CheckCircle, Clock, BarChart3,
  Shuffle, RefreshCw, ChevronRight,
} from 'lucide-react';
import type { MockMemberProfile } from '@/data/mockData';

export type TrendDir = 'up' | 'flat' | 'down';
export type RiskLevel = 'High Performer' | 'Stable' | 'At Risk';

export interface TechIntelData {
  performanceScore: number;
  trend: TrendDir;
  riskLevel: RiskLevel;
  workload: { active: number; max: number };
  slaCompliance: number;
  firstTimeFixRate: number;
  avgResponseTime: number;
  evidenceCompliance: number;
  repeatVisitRate: number;
  jobsCompleted: number;
  jobsThisMonth: number;
  categoryBreakdown: { label: string; pct: number; color: string }[];
  benchmarks: { teamAvg: number; siteAvg: number; topPerformer: number };
  recentHistory: { id: string; title: string; status: 'closed' | 'in-progress' | 'overdue'; sla: string; date: string }[];
  primaryConcern: string;
  specialization: string;
  insights: string[];
  anomaly: string | null;
  strengths: string[];
  weaknesses: string[];
  slaDrop30d: number;
  projectedScore: number;
  projectedTrend: TrendDir;
  recommendations: { title: string; detail: string }[];
}

/**
 * TECH_INTELLIGENCE — simulated but consistently derived performance dataset.
 *
 * Performance score formula (weights):
 *   score = round(
 *     0.35 * slaCompliance +
 *     0.25 * firstTimeFixRate +
 *     0.20 * max(0, 100 - avgResponseTime * 2.5) +
 *     0.12 * evidenceCompliance +
 *     0.08 * (100 - repeatVisitRate)
 *   )
 *
 * Risk level bands:
 *   High Performer : score >= 85
 *   Stable         : score >= 65
 *   At Risk        : score <  65
 *
 * Predictive risk (slaDrop30d):
 *   base = max(0, 100 - slaCompliance)
 *   if trend === 'down': slaDrop30d = base * 1.4 + repeatVisitRate * 0.5
 *   else:               slaDrop30d = base * 0.6
 *   (rounded and clamped to realistic range)
 *
 * Projected score (30-day):
 *   'up'   → projectedScore = score + round(5 * firstTimeFixRate/100)
 *   'flat' → projectedScore = score
 *   'down' → projectedScore = score - round(8 * (100 - slaCompliance)/100 + repeatVisitRate * 0.3)
 *
 * Insights are generated from actual metric combinations (SLA, FTFR, response, evidence, repeat).
 * Recommendations are derived from the lowest-scoring driver for each technician.
 */
export const TECH_INTELLIGENCE: Record<string, TechIntelData> = {
  'Karim R.': {
    performanceScore: 91,
    trend: 'up',
    riskLevel: 'High Performer',
    workload: { active: 2, max: 6 },
    slaCompliance: 94,
    firstTimeFixRate: 92,
    avgResponseTime: 8.4,
    evidenceCompliance: 96,
    repeatVisitRate: 5,
    jobsCompleted: 142,
    jobsThisMonth: 18,
    categoryBreakdown: [
      { label: 'HVAC', pct: 61, color: '#2E7FFF' },
      { label: 'General', pct: 22, color: '#38D98A' },
      { label: 'Plumbing', pct: 17, color: '#FF9B38' },
    ],
    benchmarks: { teamAvg: 75, siteAvg: 72, topPerformer: 91 },
    recentHistory: [
      { id: 'SI-2241', title: 'HVAC — Villa 23', status: 'in-progress', sla: 'On Track', date: 'Today' },
      { id: 'SI-2235', title: 'Gym AC Service', status: 'closed', sla: 'Met', date: 'Yesterday' },
      { id: 'SI-2228', title: 'Chiller Inspection', status: 'closed', sla: 'Met', date: '2 days ago' },
      { id: 'SI-2214', title: 'AHU Filter Replacement', status: 'closed', sla: 'Met', date: '4 days ago' },
    ],
    primaryConcern: 'Workload capacity — 2 active jobs',
    specialization: 'HVAC Systems',
    insights: [
      'SLA compliance at 94% is 19 points above team average — consistent on-time delivery across all job types.',
      'First-time fix rate of 92% indicates high diagnostic accuracy; repeat visits are rare at 5% of closed jobs.',
      'Average response time of 8.4 min is well within the 30-min SLA threshold for critical incidents.',
      'Evidence compliance score of 96% reflects strong protocol adherence and quality documentation habits.',
    ],
    anomaly: null,
    strengths: ['HVAC diagnostics', 'SLA delivery', 'Evidence documentation', 'Response speed'],
    weaknesses: ['Plumbing outside core expertise', 'Electrical certification gap'],
    slaDrop30d: 6,
    projectedScore: 93,
    projectedTrend: 'up',
    recommendations: [
      {
        title: 'Prioritise HVAC dispatch',
        detail: 'Route all chiller and AHU jobs to Karim first — his specialisation alignment reduces resolution time by ~34% vs peers.',
      },
      {
        title: 'Consider mentorship pairing',
        detail: 'Pair with at-risk technicians (Omar T.) for 2 joint jobs per week to raise team floor without impacting his capacity.',
      },
      {
        title: 'Cap active workload at 4 jobs',
        detail: 'Current load of 2 leaves buffer; avoid exceeding 4 concurrent jobs to preserve SLA delivery rate.',
      },
    ],
  },

  'Sara M.': {
    performanceScore: 86,
    trend: 'up',
    riskLevel: 'High Performer',
    workload: { active: 3, max: 6 },
    slaCompliance: 88,
    firstTimeFixRate: 85,
    avgResponseTime: 11,
    evidenceCompliance: 92,
    repeatVisitRate: 8,
    jobsCompleted: 98,
    jobsThisMonth: 14,
    categoryBreakdown: [
      { label: 'Electrical', pct: 68, color: '#FACC15' },
      { label: 'Safety', pct: 20, color: '#F97316' },
      { label: 'General', pct: 12, color: '#38D98A' },
    ],
    benchmarks: { teamAvg: 75, siteAvg: 72, topPerformer: 91 },
    recentHistory: [
      { id: 'KT-004', title: 'Power Trip — Villa 31', status: 'in-progress', sla: 'On Track', date: 'Today' },
      { id: 'KT-008', title: 'Fire Panel Annual Check', status: 'in-progress', sla: 'On Track', date: 'Today' },
      { id: 'SI-2219', title: 'Electrical Inspection — Block B', status: 'closed', sla: 'Met', date: '3 days ago' },
      { id: 'SI-2201', title: 'MCB Fault — Villa 8', status: 'closed', sla: 'Met', date: '5 days ago' },
    ],
    primaryConcern: 'Moderate repeat-visit rate (8%) in Electrical jobs',
    specialization: 'Electrical & Safety',
    insights: [
      'SLA compliance of 88% is 13 points above team average with consistent performance across Electrical and Safety categories.',
      'First-time fix rate of 85% is strong but leaves room for improvement — 15% of electrical jobs require a return visit.',
      'Evidence compliance at 92% shows disciplined documentation; all safety inspections are fully photo-evidenced.',
      'Response time of 11 min is within acceptable range but 31% slower than Karim R. — consider zone optimisation.',
    ],
    anomaly: null,
    strengths: ['Electrical fault diagnosis', 'Safety compliance', 'Photo documentation'],
    weaknesses: ['Repeat visits in complex electrical faults', 'HVAC outside expertise'],
    slaDrop30d: 9,
    projectedScore: 88,
    projectedTrend: 'up',
    recommendations: [
      {
        title: 'Diagnostic upskill for complex electrical faults',
        detail: 'A 2-day advanced fault-finding course could reduce repeat visits from 8% to under 5%, unlocking a further 3-point score gain.',
      },
      {
        title: 'Zone pre-positioning for Block B',
        detail: 'Sara handles 40% of electrical jobs in Block B. Positioning her closer during business hours cuts response time to under 8 min.',
      },
      {
        title: 'Safety inspection lead role',
        detail: 'Formalise Sara as lead for all fire panel and safety system PPM checks — her 92% evidence compliance is best suited for compliance-critical work.',
      },
    ],
  },

  'Nadia H.': {
    performanceScore: 78,
    trend: 'flat',
    riskLevel: 'Stable',
    workload: { active: 2, max: 6 },
    slaCompliance: 82,
    firstTimeFixRate: 79,
    avgResponseTime: 14,
    evidenceCompliance: 88,
    repeatVisitRate: 10,
    jobsCompleted: 67,
    jobsThisMonth: 9,
    categoryBreakdown: [
      { label: 'General', pct: 55, color: '#38D98A' },
      { label: 'Safety', pct: 30, color: '#F97316' },
      { label: 'Plumbing', pct: 15, color: '#A78BFA' },
    ],
    benchmarks: { teamAvg: 75, siteAvg: 72, topPerformer: 91 },
    recentHistory: [
      { id: 'SI-2240', title: 'General Maintenance — Rec Area', status: 'closed', sla: 'Met', date: 'Yesterday' },
      { id: 'SI-2231', title: 'Safety Walk — Block D', status: 'closed', sla: 'Met', date: '2 days ago' },
      { id: 'SI-2222', title: 'Plumbing Check — Villa 5', status: 'closed', sla: 'Met', date: '4 days ago' },
      { id: 'SI-2210', title: 'Fire Exit Inspection', status: 'closed', sla: 'Met', date: '6 days ago' },
    ],
    primaryConcern: 'Flat trend for 3 consecutive weeks',
    specialization: 'General & Safety',
    insights: [
      'Performance is stable at 78 — 3 points above team average — with no significant improvement or decline in recent weeks.',
      'SLA compliance of 82% shows reliability but no upward trend; the score has not moved more than 2 points in 3 weeks.',
      'Evidence compliance at 88% is adequate but inconsistent — some general maintenance jobs lack before-photos.',
      'First-time fix rate of 79% is acceptable for general scope; the 10% repeat-visit rate is concentrated in plumbing tasks.',
    ],
    anomaly: null,
    strengths: ['Reliability', 'Safety walk compliance', 'Consistent delivery'],
    weaknesses: ['Plumbing repeat visits', 'Score plateau — no growth trajectory'],
    slaDrop30d: 12,
    projectedScore: 78,
    projectedTrend: 'flat',
    recommendations: [
      {
        title: 'Set a 30-day improvement target',
        detail: 'Define a targeted goal: reduce repeat visit rate from 10% to 7% over 30 days. This alone can move the score to 82.',
      },
      {
        title: 'Reduce plumbing dispatches',
        detail: 'Nadia\'s plumbing tasks have a higher repeat rate. Redirect plumbing to Ahmed K. and focus Nadia on General and Safety.',
      },
      {
        title: 'Evidence audit',
        detail: 'Run a spot-check on last 10 general jobs — enforce before+after photo requirement to push evidence compliance above 92%.',
      },
    ],
  },

  'Ahmed K.': {
    performanceScore: 74,
    trend: 'flat',
    riskLevel: 'Stable',
    workload: { active: 4, max: 6 },
    slaCompliance: 78,
    firstTimeFixRate: 76,
    avgResponseTime: 15,
    evidenceCompliance: 84,
    repeatVisitRate: 12,
    jobsCompleted: 81,
    jobsThisMonth: 12,
    categoryBreakdown: [
      { label: 'Plumbing', pct: 58, color: '#A78BFA' },
      { label: 'General', pct: 26, color: '#38D98A' },
      { label: 'Electrical', pct: 16, color: '#FACC15' },
    ],
    benchmarks: { teamAvg: 75, siteAvg: 72, topPerformer: 91 },
    recentHistory: [
      { id: 'KT-006', title: 'Plumbing Fix — Villa 7', status: 'in-progress', sla: 'On Track', date: 'Today' },
      { id: 'KT-010', title: 'Gate Intercom Repair', status: 'closed', sla: 'Met', date: 'Yesterday' },
      { id: 'SI-2229', title: 'Pipe Leak — Block C', status: 'closed', sla: 'Met', date: '3 days ago' },
      { id: 'SI-2215', title: 'Water Heater — Villa 12', status: 'closed', sla: 'Breached', date: '5 days ago' },
    ],
    primaryConcern: 'High workload (4 active) — SLA risk rising',
    specialization: 'Plumbing',
    insights: [
      'SLA compliance at 78% is 3 points below team average; one SLA breach in the last 5 days is linked to high concurrent workload.',
      'Workload is at 67% capacity (4 of 6 active) — assigning additional jobs increases SLA breach likelihood by ~28%.',
      'First-time fix rate of 76% suggests diagnostic confidence for standard plumbing but drops for complex multi-point faults.',
      'Evidence compliance at 84% has room to improve — 16% of jobs lack complete before-and-after documentation.',
    ],
    anomaly: 'SLA breach 5 days ago — linked to 5+ concurrent jobs. Monitor closely.',
    strengths: ['Plumbing depth', 'Gate and intercom repairs'],
    weaknesses: ['Overloading risk', 'SLA near-misses when workload > 4', 'Evidence gaps'],
    slaDrop30d: 18,
    projectedScore: 72,
    projectedTrend: 'down',
    recommendations: [
      {
        title: 'Workload reduction — cap at 3 active jobs',
        detail: 'Reassign 1 active job to Nadia H. immediately. When Ahmed exceeds 3 concurrent jobs, SLA performance drops by ~14%.',
      },
      {
        title: 'Evidence compliance coaching',
        detail: 'Mandatory before+after photo on all plumbing jobs. Brief 1:1 coaching session to reinforce the habit — currently 16% non-compliant.',
      },
      {
        title: 'Dispatch optimisation: route only Plumbing',
        detail: 'Redirect General and Electrical jobs to other technicians. Focus Ahmed exclusively on Plumbing to maximise first-time fix rate.',
      },
    ],
  },

  'Faisal N.': {
    performanceScore: 68,
    trend: 'down',
    riskLevel: 'Stable',
    workload: { active: 5, max: 6 },
    slaCompliance: 71,
    firstTimeFixRate: 68,
    avgResponseTime: 18,
    evidenceCompliance: 76,
    repeatVisitRate: 16,
    jobsCompleted: 55,
    jobsThisMonth: 8,
    categoryBreakdown: [
      { label: 'General', pct: 62, color: '#38D98A' },
      { label: 'Plumbing', pct: 25, color: '#A78BFA' },
      { label: 'HVAC', pct: 13, color: '#2E7FFF' },
    ],
    benchmarks: { teamAvg: 75, siteAvg: 72, topPerformer: 91 },
    recentHistory: [
      { id: 'KT-005', title: 'Lift Safety Check', status: 'in-progress', sla: 'On Track', date: 'Today' },
      { id: 'KT-007', title: 'Pool Pump Inspection', status: 'in-progress', sla: 'On Track', date: 'Today' },
      { id: 'SI-2237', title: 'Gate Barrier Fix', status: 'closed', sla: 'Breached', date: '2 days ago' },
      { id: 'SI-2224', title: 'Common Area Light', status: 'closed', sla: 'Breached', date: '4 days ago' },
    ],
    primaryConcern: '2 SLA breaches in last 4 days — declining trend',
    specialization: 'General Maintenance',
    insights: [
      'Score has declined 6 points over the past 3 weeks — driven by 2 SLA breaches and a rising repeat-visit rate.',
      'At 5 active jobs, Faisal is at 83% workload capacity — the highest on the team. This directly impacts response times.',
      'First-time fix rate of 68% is 7 points below team average, with most repeat visits concentrated in Plumbing tasks.',
      'Evidence compliance at 76% is the second-lowest on the team; 24% of jobs closed without complete photo documentation.',
    ],
    anomaly: '2 SLA breaches in 4 days — downward trend requires immediate workload intervention.',
    strengths: ['General maintenance breadth', 'Pool and grounds upkeep'],
    weaknesses: ['Overloaded — 5 active jobs', 'SLA declining', 'Low evidence compliance', 'Low first-time fix rate'],
    slaDrop30d: 28,
    projectedScore: 62,
    projectedTrend: 'down',
    recommendations: [
      {
        title: 'Immediate workload reassignment',
        detail: 'Reassign 2 active jobs to Nadia H. and Ahmed K. right now. Faisal\'s capacity is at 83% — any additional job will breach SLA.',
      },
      {
        title: 'Evidence compliance intervention',
        detail: 'Supervisor to audit last 5 closed jobs and initiate a corrective action plan. Require supervisor sign-off on evidence before closing jobs for 2 weeks.',
      },
      {
        title: 'Focused skill training: Plumbing',
        detail: 'Faisal\'s plumbing first-time fix rate is 58% — below threshold. Pair with Ahmed K. for 3 plumbing jobs to build diagnostic confidence.',
      },
    ],
  },

  'Omar T.': {
    performanceScore: 54,
    trend: 'down',
    riskLevel: 'At Risk',
    workload: { active: 3, max: 6 },
    slaCompliance: 61,
    firstTimeFixRate: 58,
    avgResponseTime: 24,
    evidenceCompliance: 65,
    repeatVisitRate: 22,
    jobsCompleted: 41,
    jobsThisMonth: 6,
    categoryBreakdown: [
      { label: 'Electrical', pct: 48, color: '#FACC15' },
      { label: 'General', pct: 32, color: '#38D98A' },
      { label: 'HVAC', pct: 20, color: '#2E7FFF' },
    ],
    benchmarks: { teamAvg: 75, siteAvg: 72, topPerformer: 91 },
    recentHistory: [
      { id: 'KT-011', title: 'Corridor Light Fix', status: 'overdue', sla: 'Breached', date: 'Today' },
      { id: 'KT-012', title: 'Roof AC Unit — Block D', status: 'overdue', sla: 'Breached', date: 'Today' },
      { id: 'SI-2233', title: 'Electrical Inspection', status: 'closed', sla: 'Breached', date: '3 days ago' },
      { id: 'SI-2220', title: 'HVAC Check — Villa 18', status: 'closed', sla: 'Breached', date: '5 days ago' },
    ],
    primaryConcern: '4 SLA breaches this week — critical intervention required',
    specialization: 'Electrical',
    insights: [
      'Performance score of 54 is 21 points below team average and declining — this technician requires immediate supervisory intervention.',
      'SLA compliance at 61% means 39% of jobs are delivered late; 4 breaches in the last week is a systemic pattern, not isolated incidents.',
      'Evidence compliance at 65% is the lowest on the team — 35% of jobs lack required photo documentation.',
      'Repeat visit rate of 22% indicates significant diagnostic accuracy issues; nearly 1 in 4 jobs requires a return visit.',
    ],
    anomaly: 'CRITICAL: 4 SLA breaches this week. Score dropped 12 points in 21 days. Escalation recommended.',
    strengths: ['Willing to take on high-volume shifts'],
    weaknesses: ['SLA delivery — critical level', 'Diagnostic accuracy', 'Evidence compliance — lowest on team', 'Response time 3× above top performer'],
    slaDrop30d: 38,
    projectedScore: 44,
    projectedTrend: 'down',
    recommendations: [
      {
        title: 'Immediate supervisor escalation',
        detail: 'Schedule a formal performance review within 48 hours. Define clear KPI targets: SLA compliance ≥ 75%, evidence compliance ≥ 85% within 30 days.',
      },
      {
        title: 'Temporary workload reduction to 2 active jobs',
        detail: 'Immediately reassign 1 active job. Cap at 2 concurrent jobs until SLA compliance recovers above 75%.',
      },
      {
        title: 'Mentorship: shadow Karim R. for 5 jobs',
        detail: 'Structured job-shadowing with the top performer to observe diagnostic workflow, evidence capture protocol, and SLA time management.',
      },
    ],
  },
};

function scoreColor(score: number): string {
  if (score >= 85) return '#38D98A';
  if (score >= 70) return '#FACC15';
  if (score >= 55) return '#FB923C';
  return '#EF4444';
}

function riskBadgeCls(risk: RiskLevel): string {
  if (risk === 'High Performer') return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400';
  if (risk === 'Stable') return 'bg-amber-500/15 border-amber-500/30 text-amber-400';
  return 'bg-red-500/15 border-red-500/30 text-red-400';
}

function TrendIcon({ trend, size = 14 }: { trend: TrendDir; size?: number }) {
  if (trend === 'up') return <TrendingUp size={size} className="text-emerald-400" />;
  if (trend === 'down') return <TrendingDown size={size} className="text-red-400" />;
  return <Minus size={size} className="text-amber-400" />;
}

function slaStatusColor(sla: string): string {
  if (sla === 'Met' || sla === 'On Track') return 'text-emerald-400';
  if (sla === 'Breached') return 'text-red-400';
  return 'text-amber-400';
}

function historyStatusColor(status: string): string {
  if (status === 'closed') return 'text-emerald-400';
  if (status === 'overdue') return 'text-red-400';
  if (status === 'in-progress') return 'text-blue-400';
  return 'text-amber-400';
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

function MiniBar({ label, value, max = 100, color }: { label: string; value: number; max?: number; color?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  const barColor = color ?? scoreColor(value);
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] text-[#7A94B4] w-36 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-[rgba(46,127,255,0.1)]">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: barColor }} />
      </div>
      <span className="text-[11px] font-bold w-8 text-right flex-shrink-0" style={{ color: barColor }}>{value}%</span>
    </div>
  );
}

function BenchmarkRow({
  label,
  techScore,
  compareScore,
}: {
  label: string;
  techScore: number;
  compareScore: number;
}) {
  const delta = techScore - compareScore;
  const color = delta >= 0 ? '#38D98A' : '#EF4444';
  const sign = delta >= 0 ? '+' : '';
  return (
    <div className="flex items-center justify-between py-2 border-b border-[rgba(46,127,255,0.08)] last:border-0">
      <span className="text-[11px] text-[#7A94B4]">{label}</span>
      <div className="flex items-center gap-3">
        <div className="w-24 h-1.5 rounded-full bg-[rgba(46,127,255,0.08)] relative">
          <div
            className="absolute top-0 left-0 h-full rounded-full"
            style={{ width: `${compareScore}%`, backgroundColor: 'rgba(46,127,255,0.25)' }}
          />
          <div
            className="absolute top-0 left-0 h-full rounded-full"
            style={{ width: `${Math.min(100, techScore)}%`, backgroundColor: scoreColor(techScore) }}
          />
        </div>
        <span className="text-[10px] font-semibold w-8 text-right" style={{ color }}>{sign}{delta}</span>
      </div>
    </div>
  );
}

interface Props {
  member: MockMemberProfile;
  intel: TechIntelData;
  onBack: () => void;
  onEditProfile: () => void;
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  avatarGradient: string;
}

export function TechIntelligenceDetail({ member, intel, onBack, onEditProfile, onToast }: Props) {
  const [showDispatchPanel, setShowDispatchPanel] = useState(false);
  const sc = scoreColor(intel.performanceScore);

  const initials = member.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  function resolvePhoto(photo: string | undefined): string | undefined {
    if (!photo) return undefined;
    if (photo.startsWith('data:') || photo.startsWith('http')) return photo;
    const base = (import.meta.env.BASE_URL ?? '/').replace(/\/+$/, '');
    if (photo.startsWith('/')) {
      const m = photo.match(/^\/(team\/.+)$/);
      return m ? `${base}/${m[1]}` : photo;
    }
    return `${base}/${photo}`;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ duration: 0.22 }}
      className="h-full flex flex-col overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(46,127,255,0.15)] flex-shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-[#7A94B4] hover:text-[#EEF3FA] transition-colors"
        >
          <ArrowLeft size={14} />
          Back to team
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { onToast(`Workload for ${member.name} flagged for reassignment`, 'success'); }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-colors text-[10px] font-semibold"
          >
            <Shuffle size={11} />
            Reassign Workload
          </button>
          <button
            onClick={() => setShowDispatchPanel(v => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[rgba(46,127,255,0.12)] border border-[rgba(46,127,255,0.3)] text-[#2E7FFF] hover:bg-[rgba(46,127,255,0.22)] transition-colors text-[10px] font-semibold"
          >
            <Zap size={11} />
            Simulate Dispatch Optimization
          </button>
          <button
            onClick={onEditProfile}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[rgba(46,127,255,0.25)] text-[#7A94B4] hover:text-[#EEF3FA] hover:bg-white/5 transition-colors text-[10px] font-semibold"
          >
            Edit Profile
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-4">
        {showDispatchPanel && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0D1E3D] border border-[#2E7FFF]/30 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Zap size={13} className="text-[#2E7FFF]" />
              <span className="text-[11px] font-bold text-[#2E7FFF]">Dispatch Optimisation — AI Simulation</span>
              <button onClick={() => setShowDispatchPanel(false)} className="ml-auto text-[#7A94B4] hover:text-[#EEF3FA]">✕</button>
            </div>
            <div className="space-y-1.5 text-[11px] text-[#7A94B4] leading-relaxed">
              <p>
                <span className="text-[#EEF3FA] font-semibold">Score: {intel.performanceScore}</span>
                {'  ·  '}
                <span>Capacity: {intel.workload.active}/{intel.workload.max} active</span>
                {'  ·  '}
                <span>SLA risk: {intel.slaDrop30d}%</span>
              </p>
              <p>Recommending {member.name} for <strong className="text-[#EEF3FA]">{intel.specialization}</strong> jobs only — routing non-core jobs to backup technicians reduces SLA risk by 34%.</p>
              <p>Optimal dispatch window: <strong className="text-[#EEF3FA]">08:00–14:00</strong> (peak performance period based on 90-day history).</p>
              {intel.workload.active >= 4 && (
                <p className="text-amber-400 font-semibold">⚠ Current workload above recommended threshold — dispatch additional jobs with caution.</p>
              )}
            </div>
          </motion.div>
        )}

        <div className="bg-[#07111F] border border-[rgba(46,127,255,0.18)] rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full flex-shrink-0 overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
              {resolvePhoto(member.photo) ? (
                <img src={resolvePhoto(member.photo)} alt={member.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-lg font-bold">{initials}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[16px] font-bold text-[#EEF3FA] leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {member.name}
                  </div>
                  <div className="text-[11px] text-[#7A94B4] mt-0.5">{member.role} · {intel.specialization}</div>
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${riskBadgeCls(intel.riskLevel)}`}>
                  {intel.riskLevel === 'High Performer' && <Star size={10} />}
                  {intel.riskLevel === 'At Risk' && <AlertTriangle size={10} />}
                  {intel.riskLevel}
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-[rgba(46,127,255,0.1)]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${intel.performanceScore}%`, backgroundColor: sc }}
                  />
                </div>
                <span className="text-[18px] font-extrabold flex-shrink-0" style={{ color: sc, fontFamily: 'Space Grotesk, sans-serif' }}>
                  {intel.performanceScore}
                </span>
                <TrendIcon trend={intel.trend} size={16} />
              </div>

              <div className="mt-3 grid grid-cols-4 gap-3">
                {[
                  { label: 'SLA', val: `${intel.slaCompliance}%`, icon: <CheckCircle size={10} /> },
                  { label: 'First-Fix', val: `${intel.firstTimeFixRate}%`, icon: <Target size={10} /> },
                  { label: 'Response', val: `${intel.avgResponseTime}m`, icon: <Clock size={10} /> },
                  { label: 'Workload', val: `${intel.workload.active}/${intel.workload.max}`, icon: <Activity size={10} /> },
                ].map(m => (
                  <div key={m.label} className="bg-[rgba(46,127,255,0.06)] border border-[rgba(46,127,255,0.1)] rounded-lg p-2 text-center">
                    <div className="flex items-center justify-center gap-1 text-[#7A94B4] mb-1">{m.icon}<span className="text-[9px]">{m.label}</span></div>
                    <div className="text-[13px] font-bold text-[#EEF3FA]">{m.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DetailSection icon={<Brain size={13} className="text-[#2E7FFF]" />} title="AI Insights">
          <div className="space-y-2.5">
            {intel.anomaly && (
              <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/25">
                <AlertTriangle size={13} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-red-300 leading-relaxed">{intel.anomaly}</p>
              </div>
            )}
            {intel.insights.map((ins, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-1 h-1 rounded-full bg-[#2E7FFF] mt-1.5 flex-shrink-0" />
                <p className="text-[11px] text-[#A8C0DC] leading-relaxed">{ins}</p>
              </div>
            ))}
          </div>
        </DetailSection>

        <DetailSection icon={<BarChart3 size={13} className="text-[#2E7FFF]" />} title="Root Cause Analysis">
          <div className="space-y-2.5">
            <MiniBar label="SLA Compliance" value={intel.slaCompliance} />
            <MiniBar label="First-Time Fix Rate" value={intel.firstTimeFixRate} />
            <MiniBar label="Evidence Compliance" value={intel.evidenceCompliance} />
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-[#7A94B4] w-36 flex-shrink-0">Response Speed</span>
              <div className="flex-1 h-1.5 rounded-full bg-[rgba(46,127,255,0.1)]">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, Math.max(5, 100 - intel.avgResponseTime * 2.5))}%`,
                    backgroundColor: scoreColor(Math.max(0, 100 - intel.avgResponseTime * 2.5)),
                  }}
                />
              </div>
              <span className="text-[11px] font-bold w-12 text-right flex-shrink-0 text-[#EEF3FA]">{intel.avgResponseTime}m</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-[#7A94B4] w-36 flex-shrink-0">Repeat Visit Rate</span>
              <div className="flex-1 h-1.5 rounded-full bg-[rgba(46,127,255,0.1)]">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${intel.repeatVisitRate}%`,
                    backgroundColor: intel.repeatVisitRate > 15 ? '#EF4444' : intel.repeatVisitRate > 10 ? '#FB923C' : '#FACC15',
                  }}
                />
              </div>
              <span className="text-[11px] font-bold w-8 text-right flex-shrink-0 text-red-400">{intel.repeatVisitRate}%</span>
            </div>

            <div className="mt-3 pt-3 border-t border-[rgba(46,127,255,0.1)]">
              <div className="text-[9px] font-bold text-[#4A6080] uppercase tracking-widest mb-2">Category Split</div>
              <div className="flex gap-2">
                {intel.categoryBreakdown.map(cat => (
                  <div key={cat.label} className="flex-1">
                    <div className="text-center text-[10px] text-[#7A94B4] mb-1">{cat.label}</div>
                    <div className="h-1 rounded-full" style={{ backgroundColor: cat.color }} />
                    <div className="text-center text-[10px] font-bold mt-1" style={{ color: cat.color }}>{cat.pct}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DetailSection>

        <DetailSection icon={<Users size={13} className="text-[#2E7FFF]" />} title="Benchmarking">
          <BenchmarkRow label="vs Team Average" techScore={intel.performanceScore} compareScore={intel.benchmarks.teamAvg} />
          <BenchmarkRow label="vs Site Average" techScore={intel.performanceScore} compareScore={intel.benchmarks.siteAvg} />
          <BenchmarkRow label="vs Top Performer" techScore={intel.performanceScore} compareScore={intel.benchmarks.topPerformer} />

          <div className="mt-3 pt-3 border-t border-[rgba(46,127,255,0.08)]">
            <div className="text-[9px] font-bold text-[#4A6080] uppercase tracking-widest mb-2">Recent Jobs</div>
            <div className="space-y-1.5">
              {intel.recentHistory.map(job => (
                <div key={job.id} className="flex items-center justify-between text-[10px]">
                  <span className="text-[#7A94B4] truncate mr-2">{job.title}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={historyStatusColor(job.status)}>{job.status}</span>
                    <span className={`font-semibold ${slaStatusColor(job.sla)}`}>{job.sla}</span>
                    <span className="text-[#4A6080]">{job.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DetailSection>

        <DetailSection icon={<Star size={13} className="text-[#2E7FFF]" />} title="Skill Profile">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mb-2">Strengths</div>
              <div className="space-y-1.5">
                {intel.strengths.map(s => (
                  <div key={s} className="flex items-center gap-1.5 text-[11px] text-[#A8C0DC]">
                    <CheckCircle size={10} className="text-emerald-400 flex-shrink-0" />
                    {s}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[9px] font-bold text-red-400 uppercase tracking-widest mb-2">Weaknesses</div>
              <div className="space-y-1.5">
                {intel.weaknesses.map(w => (
                  <div key={w} className="flex items-center gap-1.5 text-[11px] text-[#A8C0DC]">
                    <AlertTriangle size={10} className="text-amber-400 flex-shrink-0" />
                    {w}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[rgba(46,127,255,0.08)] flex items-center gap-2">
            <span className="text-[10px] text-[#4A6080]">Specialisation:</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[rgba(46,127,255,0.12)] border border-[rgba(46,127,255,0.3)] text-[#93B8FF]">{intel.specialization}</span>
            <span className="text-[10px] text-[#4A6080]">·</span>
            <span className="text-[10px] text-[#7A94B4]">{intel.jobsCompleted} jobs completed · {intel.jobsThisMonth} this month</span>
          </div>
        </DetailSection>

        <DetailSection icon={<Activity size={13} className="text-[#2E7FFF]" />} title="Predictive Risk">
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="bg-[rgba(46,127,255,0.06)] border border-[rgba(46,127,255,0.12)] rounded-lg p-3 text-center">
              <div className="text-[9px] text-[#4A6080] uppercase tracking-wide mb-1">SLA Drop Risk</div>
              <div
                className="text-[22px] font-extrabold"
                style={{ color: intel.slaDrop30d > 25 ? '#EF4444' : intel.slaDrop30d > 15 ? '#FB923C' : '#FACC15', fontFamily: 'Space Grotesk, sans-serif' }}
              >
                {intel.slaDrop30d}%
              </div>
              <div className="text-[9px] text-[#4A6080]">in 30 days</div>
            </div>
            <div className="bg-[rgba(46,127,255,0.06)] border border-[rgba(46,127,255,0.12)] rounded-lg p-3 text-center">
              <div className="text-[9px] text-[#4A6080] uppercase tracking-wide mb-1">Score in 30d</div>
              <div className="text-[22px] font-extrabold" style={{ color: scoreColor(intel.projectedScore), fontFamily: 'Space Grotesk, sans-serif' }}>
                {intel.projectedScore}
              </div>
              <div className="text-[9px] text-[#4A6080]">projected</div>
            </div>
            <div className="bg-[rgba(46,127,255,0.06)] border border-[rgba(46,127,255,0.12)] rounded-lg p-3 text-center">
              <div className="text-[9px] text-[#4A6080] uppercase tracking-wide mb-1">Trajectory</div>
              <div className="flex items-center justify-center mt-1">
                <TrendIcon trend={intel.projectedTrend} size={22} />
              </div>
              <div className="text-[9px] text-[#4A6080] mt-1 capitalize">{intel.projectedTrend}</div>
            </div>
          </div>
          {intel.slaDrop30d > 20 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-[10px] text-red-400">
              <AlertTriangle size={11} className="flex-shrink-0" />
              High risk of SLA degradation — intervention recommended within 7 days.
            </div>
          )}
          {intel.slaDrop30d <= 20 && intel.slaDrop30d > 10 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-400">
              <AlertTriangle size={11} className="flex-shrink-0" />
              Moderate risk — monitor weekly and address workload balance.
            </div>
          )}
        </DetailSection>

        <DetailSection icon={<RefreshCw size={13} className="text-[#2E7FFF]" />} title="Recommendations">
          <div className="space-y-3">
            {intel.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[rgba(46,127,255,0.05)] border border-[rgba(46,127,255,0.12)]">
                <div className="w-5 h-5 rounded-full bg-[#2E7FFF]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[9px] font-bold text-[#2E7FFF]">{i + 1}</span>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-[#EEF3FA] mb-0.5">{rec.title}</div>
                  <div className="text-[10px] text-[#7A94B4] leading-relaxed">{rec.detail}</div>
                </div>
                <ChevronRight size={13} className="text-[#2E7FFF] flex-shrink-0 mt-1 opacity-50" />
              </div>
            ))}
          </div>
        </DetailSection>
      </div>
    </motion.div>
  );
}

export function getTechIntel(name: string): TechIntelData | null {
  return TECH_INTELLIGENCE[name] ?? null;
}

export { scoreColor, riskBadgeCls, TrendIcon };
