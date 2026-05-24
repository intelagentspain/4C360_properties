import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileWarning,
  Gauge,
  GitBranch,
  ListChecks,
  Play,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { HealthScoreGauge } from '../components/HealthScoreGauge';
import { AIInsightPanel } from '../components/AIInsightPanel';
import {
  buildProjectControlContext,
  formatProjectCurrency,
  formatProjectDate,
  formatProjectEventTime,
  getProjectEventPreview,
  projectStatusColor,
  projectStatusLabel,
  type ForecastScenario,
  type ManagerAction,
  type ProjectControlContext,
  type ProjectEventType,
} from '@/core/control-twin/projectControlTwin';
import {
  resetProjectCommandEvents,
  simulateProjectCommandEvent,
  useProjectCommandStore,
} from '../state/projectCommandStore';
import type { ProjectCommandScreen } from '../types';
import type { MetricName } from '../useMetricInsight';
import { useSelectedProjectCommandData } from '../useProjectCommandData';

type ToastFn = (message: string, type?: 'success' | 'warning' | 'error' | 'info') => void;

const dayMs = 86_400_000;

const severityClass = {
  critical: 'border-red-400/30 bg-red-400/12 text-red-100',
  high: 'border-orange-400/30 bg-orange-400/12 text-orange-100',
  medium: 'border-amber-400/30 bg-amber-400/12 text-amber-100',
  low: 'border-cyan-300/24 bg-cyan-300/10 text-cyan-100',
  positive: 'border-emerald-300/24 bg-emerald-300/10 text-emerald-100',
};

function statusClass(status: ProjectControlContext['projectControlStatus']) {
  if (status === 'on-track') return 'border-emerald-300/25 bg-emerald-300/10 text-emerald-100';
  if (status === 'watch') return 'border-amber-300/25 bg-amber-300/10 text-amber-100';
  if (status === 'at-risk') return 'border-orange-300/25 bg-orange-300/10 text-orange-100';
  return 'border-red-300/30 bg-red-400/12 text-red-100';
}

function deltaClass(tone: 'good' | 'bad' | 'neutral') {
  if (tone === 'good') return 'border-emerald-300/24 bg-emerald-300/10 text-emerald-100';
  if (tone === 'bad') return 'border-red-300/24 bg-red-400/10 text-red-100';
  return 'border-[rgba(46,127,255,0.18)] bg-[#07111F] text-[#8EA7C7]';
}

function impactTone(value: number, positiveIsGood = true) {
  if (value === 0) return 'neutral';
  const isGood = positiveIsGood ? value > 0 : value < 0;
  return isGood ? 'good' : 'bad';
}

function signed(value: number, suffix = '') {
  const rounded = Number(value.toFixed(Math.abs(value) < 1 ? 2 : 1)).toString().replace('.0', '');
  return `${value > 0 ? '+' : ''}${rounded}${suffix}`;
}

function latestLiveEvent(context: ProjectControlContext) {
  return context.latestEvent?.type === 'baseline-created' ? null : context.latestEvent;
}

function metricControlCause(metric: ProjectControlContext['controlMetrics'][number], context: ProjectControlContext) {
  const latest = latestLiveEvent(context);
  if (metric.label === 'CPI') {
    return latest
      ? `Cost pressure is driven by ${latest.title.toLowerCase()}. Review package exposure, variations, and recovery spend before approval.`
      : 'Cost is holding close to plan. Current forecast cost remains aligned with the approved baseline.';
  }
  if (metric.label === 'SPI') {
    return latest
      ? `Schedule movement is linked to ${latest.affectedModule.toLowerCase()}. Check the programme path and owner commitments.`
      : 'Schedule is holding the baseline. Forecast handover remains aligned with the target plan.';
  }
  if (metric.label === 'Float Remaining') {
    return latest
      ? `${Math.max(0, context.metrics.floatRemaining)} days of float remain after the latest update. Protect the critical path before handover risk widens.`
      : 'Float is available. The current milestone sequence has room to absorb normal site movement.';
  }
  if (metric.label === 'EAC') {
    return latest
      ? `Expected cost now reflects the latest event ledger. Compare recovery cost against delay, rework, and procurement exposure.`
      : 'Expected cost matches the approved baseline until a live update changes risk, variation, or procurement assumptions.';
  }
  return metric.cause;
}

function baselineWatchItems(context: ProjectControlContext) {
  const values = [
    context.baseline.project.type,
    `Progress ${context.baseline.project.currentCompletion}%`,
    `Float ${context.metrics.floatRemaining}d`,
    `EAC ${formatProjectCurrency(context.metrics.eac)}`,
  ];
  return Array.from(new Set(values)).slice(0, 4);
}

function baselinePositionTitle(context: ProjectControlContext) {
  if (context.projectControlStatus === 'on-track') {
    return `${context.baseline.project.name} is holding the approved baseline.`;
  }
  return `${context.baseline.project.name} is in ${projectStatusLabel(context.projectControlStatus).toLowerCase()} mode against the approved baseline.`;
}

function managerActionButtonLabel(action: ManagerAction) {
  const value = `${action.title} ${action.whyItMatters} ${action.cta}`.toLowerCase();
  if (value.includes('vendor') || value.includes('procurement') || value.includes('facade') || value.includes('long-lead')) return 'Prepare release brief';
  if (value.includes('evidence') || value.includes('approval') || value.includes('authority') || value.includes('gate')) return 'Prepare evidence request';
  if (value.includes('crane') || value.includes('resequence') || value.includes('workforce') || value.includes('utilization')) return 'Prepare owner task';
  if (value.includes('cost') || value.includes('variation') || value.includes('commercial')) return 'Prepare cost brief';
  return action.cta || 'Prepare action';
}

function managerActionOwner(action: ManagerAction) {
  const value = `${action.title} ${action.whyItMatters} ${action.cta}`.toLowerCase();
  if (value.includes('vendor') || value.includes('procurement') || value.includes('facade')) return 'Procurement Lead';
  if (value.includes('evidence')) return 'QA / Evidence Lead';
  if (value.includes('approval') || value.includes('authority') || value.includes('gate')) return 'Authority Coordinator';
  if (value.includes('crane') || value.includes('resequence') || value.includes('workforce')) return 'Planning Manager';
  if (value.includes('variation') || value.includes('cost') || value.includes('commercial')) return 'Commercial Manager';
  return 'Project Controls Lead';
}

function managerActionDue(action: ManagerAction) {
  if (action.priority === 'critical') return 'Today';
  if (action.priority === 'high') return 'Next 24h';
  return 'This week';
}

function formatSignedNumber(value: number, suffix = '') {
  if (value === 0) return `0${suffix}`;
  return `${value > 0 ? '+' : ''}${Number(value.toFixed(1)).toString().replace('.0', '')}${suffix}`;
}

function formatPreviewCurrency(value: number) {
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000) {
    const millions = absolute / 1_000_000;
    const rounded = Number(millions.toFixed(millions >= 10 ? 0 : 1)).toString().replace('.0', '');
    return `AED ${rounded}M`;
  }
  return formatProjectCurrency(absolute);
}

function formatSignedCurrency(value: number) {
  if (value === 0) return formatPreviewCurrency(0);
  return `${value > 0 ? '+' : '-'}${formatPreviewCurrency(value)}`;
}

function formatRiskDelta(value: number) {
  if (value === 0) return 'AED 0M';
  return `${value > 0 ? '+' : '-'}AED ${Number(Math.abs(value).toFixed(1)).toString().replace('.0', '')}M`;
}

function EventImpactChips({ event, compact = false }: { event: ProjectControlContext['events'][number]; compact?: boolean }) {
  const chips = [
    event.impacts.healthDelta !== 0 ? { label: 'Health', value: signed(event.impacts.healthDelta), tone: impactTone(event.impacts.healthDelta) } : null,
    event.impacts.spiDelta !== 0 ? { label: 'SPI', value: signed(event.impacts.spiDelta), tone: impactTone(event.impacts.spiDelta) } : null,
    event.impacts.floatDelta !== 0 ? { label: 'Float', value: signed(event.impacts.floatDelta, 'd'), tone: impactTone(event.impacts.floatDelta) } : null,
    event.impacts.eacDelta !== 0 ? { label: 'EAC', value: `${event.impacts.eacDelta > 0 ? '+' : '-'}${formatProjectCurrency(Math.abs(event.impacts.eacDelta))}`, tone: impactTone(event.impacts.eacDelta, false) } : null,
    event.impacts.riskDelta !== 0 ? { label: 'Risk', value: signed(event.impacts.riskDelta, 'M'), tone: impactTone(event.impacts.riskDelta, false) } : null,
    event.impacts.evidenceChange !== 0 ? { label: 'Evidence', value: signed(event.impacts.evidenceChange, ' pts'), tone: impactTone(event.impacts.evidenceChange) } : null,
  ].filter((chip): chip is { label: string; value: string; tone: 'good' | 'bad' | 'neutral' } => Boolean(chip));

  if (chips.length === 0) return null;

  return (
    <div className={`flex flex-wrap ${compact ? 'gap-1.5' : 'gap-2'}`}>
      {chips.map(chip => (
        <motion.span
          key={`${event.id}-${chip.label}`}
          initial={{ opacity: 0, y: 4, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.22 }}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${deltaClass(chip.tone)}`}
        >
          {chip.label}
          <span>{chip.value}</span>
        </motion.span>
      ))}
    </div>
  );
}

type DecisionChainTarget =
  | {
      kind: 'metric';
      title: string;
      value: string | number;
      metric: ProjectControlContext['controlMetrics'][number];
    }
  | {
      kind: 'event';
      title: string;
      value: string;
      event: ProjectControlContext['events'][number];
    };

function DecisionChainDrawer({
  context,
  target,
  onClose,
  onOpenAction,
}: {
  context: ProjectControlContext;
  target: DecisionChainTarget;
  onClose: () => void;
  onOpenAction: (action: ManagerAction) => void;
}) {
  const latest = target.kind === 'event' ? target.event : latestLiveEvent(context);
  const topAction = context.managerActions[0];
  const sourceTitle = latest?.title ?? 'Approved baseline';
  const metricLabel = target.kind === 'metric' ? target.metric.label : target.event.affectedModule;
  const metricValue = target.kind === 'metric' ? target.metric.value : target.event.impactLabel;
  const chain = latest
    ? [
        latest.title,
        latest.impacts.gateStatusChange ?? latest.affectedAreas[0] ?? latest.affectedModule,
        `${metricLabel} moved to ${metricValue}`,
        context.controlExceptions[0]?.title ?? context.topThreat,
        topAction?.title ?? 'Manager action required',
      ]
    : [
        'Baseline created from project context',
        'Programme, cost, risk, evidence, and vendors connected',
        `${metricLabel} is ${metricValue}`,
        'Watch facade release, approvals, and evidence packs',
        topAction?.title ?? 'Keep baseline under review',
      ];

  const ifIgnored = latest
    ? [
        ['Schedule', latest.impacts.delayDays ? `${Math.max(0, latest.impacts.delayDays)}d exposure` : `${Math.max(0, Math.abs(latest.impacts.floatDelta))}d float pressure`],
        ['Cost', latest.impacts.eacDelta ? formatSignedCurrency(latest.impacts.eacDelta) : formatProjectCurrency(context.metrics.riskExposure)],
        ['Confidence', `${context.metrics.handoverConfidence}% handover confidence`],
      ]
    : [
        ['Schedule', 'No live delay active'],
        ['Cost', `${formatProjectCurrency(context.metrics.riskExposure)} watch exposure`],
        ['Confidence', `${context.metrics.handoverConfidence}% handover confidence`],
      ];
  const ifResolved = [
    ['Recover', context.consequenceSimulation.ifResolvedToday[0]?.value ?? 'Protect float'],
    ['Reduce', context.consequenceSimulation.ifResolvedToday[1]?.value ?? 'Lower exposure'],
    ['Next', topAction?.expectedImpact ?? 'Keep handover confidence stable'],
  ];

  return (
    <motion.div
      className="fixed inset-0 z-[85] flex items-center justify-center bg-black/62 p-4 backdrop-blur-sm md:pl-[76px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Decision chain"
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        className="custom-scrollbar max-h-[calc(100vh-48px)] w-full max-w-4xl overflow-y-auto rounded-2xl border border-[#2E7FFF]/24 bg-[#081525] shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#2E7FFF]/18 bg-[#112040]/95 p-4 backdrop-blur">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100">
              <GitBranch size={13} />
              Decision chain
            </div>
            <h3 className="mt-1 text-[21px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{target.title}</h3>
            <p className="mt-1 text-[12px] leading-5 text-[#9CB1CC]">Shows where the number came from, what it affects, and which manager action should follow.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#07111F] text-[#AFC2DC] hover:bg-white/5"
            aria-label="Close decision chain"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4 p-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-xl border border-cyan-300/16 bg-cyan-300/8 p-3">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-cyan-100">Cause to action</p>
            <div className="mt-3 space-y-2">
              {chain.map((step, index) => (
                <div key={`${step}-${index}`} className="grid grid-cols-[28px_1fr] gap-2">
                  <div className="flex flex-col items-center">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-black ${index === 0 ? 'bg-[#7C3AED]/24 text-[#DDD6FE]' : index === chain.length - 1 ? 'bg-emerald-300/18 text-emerald-100' : 'bg-[#132545] text-[#8EA7C7]'}`}>{index + 1}</span>
                    {index < chain.length - 1 && <span className="my-1 h-5 w-px bg-[rgba(142,167,199,0.26)]" />}
                  </div>
                  <p className="rounded-lg border border-white/8 bg-[#07111F]/74 px-3 py-2 text-[11px] font-bold leading-4 text-[#DCE8F8]">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#07111F]/78 p-3">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">Based on</p>
              <p className="mt-1 text-[13px] font-black text-[#EEF3FA]">{sourceTitle}</p>
              <p className="mt-1 text-[10px] leading-4 text-[#8EA7C7]">{target.kind === 'metric' ? target.metric.aiExplanation : target.event.description}</p>
              {latest && <div className="mt-2"><EventImpactChips event={latest} compact /></div>}
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-red-300/18 bg-red-400/8 p-3">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-red-100">If ignored</p>
                <div className="mt-2 space-y-1.5">
                  {ifIgnored.map(([label, value]) => (
                    <div key={label} className="rounded-lg bg-[#07111F]/72 px-2.5 py-2">
                      <p className="text-[8px] font-black uppercase text-[#FCA5A5]">{label}</p>
                      <p className="mt-0.5 text-[10px] font-bold text-[#FFE4E6]">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-emerald-300/18 bg-emerald-300/8 p-3">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-emerald-100">If resolved today</p>
                <div className="mt-2 space-y-1.5">
                  {ifResolved.map(([label, value]) => (
                    <div key={label} className="rounded-lg bg-[#07111F]/72 px-2.5 py-2">
                      <p className="text-[8px] font-black uppercase text-emerald-100">{label}</p>
                      <p className="mt-0.5 text-[10px] font-bold text-[#DDFBEA]">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {topAction && (
              <button
                type="button"
                onClick={() => onOpenAction(topAction)}
                className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-[#7C3AED] px-4 text-[11px] font-black text-white shadow-[0_0_22px_rgba(124,58,237,0.26)] hover:bg-[#6D28D9]"
              >
                Open action workbench
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function MetricCard({
  metric,
  onExplain,
}: {
  metric: ProjectControlContext['controlMetrics'][number];
  onExplain: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onExplain}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative min-h-[124px] overflow-hidden rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-3 text-left transition-colors hover:border-[#7C3AED]/35 hover:bg-[rgba(17,32,64,0.92)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7A94B4]">{metric.label}</div>
          <motion.div
            key={`${metric.label}-${metric.value}`}
            initial={{ scale: 0.94, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mt-2 text-[26px] font-black"
            style={{ color: metric.tone, fontFamily: 'Space Grotesk, sans-serif' }}
          >
            {metric.value}
          </motion.div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className={`rounded-full border px-2 py-1 text-[9px] font-black uppercase ${deltaClass(metric.deltaTone)}`}>{metric.deltaLabel}</span>
          <span className="rounded-full border border-[rgba(46,127,255,0.18)] bg-[#07111F] px-2 py-1 text-[9px] font-black uppercase text-[#8EA7C7]">
            {metric.lastUpdated}
          </span>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-[10px] leading-4 text-[#8EA7C7]">{metric.cause}</p>
      <div className="absolute bottom-0 left-0 h-1 bg-[#7C3AED] transition-all group-hover:bg-[#00C6FF]" style={{ width: `${Math.min(100, Math.max(8, metric.rawValue))}%` }} />
    </motion.button>
  );
}

function ProjectHeader({ context }: { context: ProjectControlContext }) {
  const { baseline } = context;
  return (
    <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[linear-gradient(135deg,rgba(17,32,64,0.92),rgba(7,17,31,0.86))] p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#A78BFA]">
            <Building2 size={13} />
            DevelopmentX / Sobha Realty / {baseline.property.name} / {baseline.project.name}
          </div>
          <h2 className="mt-2 text-[22px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {baseline.property.name} - {baseline.project.name}
          </h2>
          <p className="mt-1 text-[12px] leading-5 text-[#B8C7DB]">
            {baseline.property.type} in {baseline.property.location} - {baseline.property.floors} floors - {baseline.property.units} units - {baseline.project.type}
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 xl:w-[650px]">
          {[
            ['Approved Budget', formatProjectCurrency(baseline.project.approvedBudget)],
            ['Target Handover', formatProjectDate(baseline.project.targetHandover)],
            ['Control Confidence', `${context.metrics.handoverConfidence}%`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#07111F]/80 p-3">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">{label}</p>
              <p className="mt-1 text-[13px] font-black text-[#EEF3FA]">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectTwinLayer({ context, executiveMode }: { context: ProjectControlContext; executiveMode: boolean }) {
  const visibleStates = executiveMode
    ? context.twinStates.filter(state => ['schedule', 'cost', 'risk', 'gates', 'handover'].includes(state.key))
    : context.twinStates;
  const latest = context.latestEvent;

  return (
    <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[linear-gradient(135deg,rgba(7,17,31,0.96),rgba(17,32,64,0.78))] p-4">
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-35" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-300" />
            </span>
            Live Project Control Twin
          </div>
          <h3 className="mt-2 text-[18px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Predictive construction intelligence connected to programme, cost, risk, evidence, vendors, workforce, gates, and forecast.
          </h3>
          <p className="mt-1 max-w-4xl text-[12px] leading-5 text-[#8EA7C7]">
            Latest cause: {latest ? latest.title : 'Baseline created from uploaded project context'}.
            {' '}The twin recalculates exposure and decision priority whenever a project event is logged.
          </p>
        </div>
        <div className="grid min-w-[260px] gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-300/18 bg-emerald-300/8 p-3">
            <p className="text-[8px] font-black uppercase tracking-[0.14em] text-emerald-100">Handover confidence</p>
            <motion.p
              key={context.metrics.handoverConfidence}
              initial={{ opacity: 0.5, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 text-[22px] font-black text-white"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              {context.metrics.handoverConfidence}%
            </motion.p>
          </div>
          <div className="rounded-xl border border-[#7C3AED]/22 bg-[#7C3AED]/10 p-3">
            <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#DDD6FE]">Simulation confidence</p>
            <p className="mt-1 text-[22px] font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {context.consequenceSimulation.confidence}%
            </p>
          </div>
        </div>
      </div>
      <div className={`grid gap-2 ${executiveMode ? 'md:grid-cols-5' : 'md:grid-cols-2 xl:grid-cols-4'}`}>
        {visibleStates.map(state => (
          <motion.div
            key={state.key}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="min-h-[152px] rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#07111F]/75 p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">{state.label}</p>
                <p className="mt-1 text-[16px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{state.value}</p>
              </div>
              <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[8px] font-black uppercase ${statusClass(state.status)}`}>
                {projectStatusLabel(state.status)}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[rgba(46,127,255,0.16)] bg-[#0A1628] px-2 py-0.5 text-[9px] font-black text-[#B8C7DB]">{state.deltaLabel}</span>
              <span className="rounded-full border border-cyan-300/14 bg-cyan-300/8 px-2 py-0.5 text-[9px] font-black text-cyan-100">AI {state.confidence}%</span>
            </div>
            <p className="mt-2 line-clamp-2 text-[10px] leading-4 text-[#8EA7C7]">{state.explanation}</p>
            <div className="mt-3 rounded-lg border border-[rgba(46,127,255,0.10)] bg-[#0A1628] px-2.5 py-2">
              <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#5A6E88]">Based on</p>
              <p className="mt-0.5 truncate text-[10px] font-bold text-[#DCE8F8]">{state.source}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function ProjectPulse({
  context,
  onExplain,
}: {
  context: ProjectControlContext;
  onExplain: () => void;
}) {
  const latest = latestLiveEvent(context);
  const baselineTitle = context.projectControlStatus === 'on-track'
    ? `${context.baseline.project.name} is healthy and on track.`
    : `${context.baseline.project.name} has a live project health baseline.`;
  const baselineImpact = context.projectControlStatus === 'on-track'
    ? `Good baseline: ${context.metrics.completion}% complete, ${context.metrics.floatRemaining} days of float, ${context.metrics.handoverConfidence}% handover confidence, and forecast cost aligned at ${formatProjectCurrency(context.metrics.eac)}.`
    : `Current baseline: ${context.metrics.completion}% complete, ${context.metrics.floatRemaining} days of float, ${context.metrics.handoverConfidence}% handover confidence, and forecast cost at ${formatProjectCurrency(context.metrics.eac)}.`;
  const baselineMovement = context.projectControlStatus === 'on-track'
    ? `Nothing needs attention right now. Forecast handover remains ${formatProjectDate(context.metrics.forecastHandover)}.`
    : `Forecast handover is ${formatProjectDate(context.metrics.forecastHandover)} with ${formatProjectCurrency(context.metrics.riskExposure)} exposure to review.`;
  const movement = latest && context.healthMovement.from !== context.healthMovement.to
    ? `Because "${latest.title}" was activated, health is now ${context.metrics.healthScore}/100. Latest impact ${formatSignedNumber(latest.impacts.healthDelta)} health; forecast, EAC, risk, and actions now reflect the event ledger.`
    : baselineMovement;

  return (
    <motion.section
      key={latest?.id ?? 'baseline-pulse'}
      initial={{ boxShadow: '0 0 0 rgba(124,58,237,0)' }}
      animate={{ boxShadow: latest ? '0 0 34px rgba(124,58,237,0.16)' : '0 0 0 rgba(124,58,237,0)' }}
      transition={{ duration: 0.35 }}
      className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4"
    >
      <div className="grid gap-4 xl:grid-cols-[92px_1fr_300px] xl:items-center">
        <HealthScoreGauge score={context.metrics.healthScore} status={context.projectControlStatus === 'critical' ? 'critical' : context.projectControlStatus === 'on-track' ? 'good' : 'monitor'} />
        <div className="min-w-0 border-l-2 pl-4" style={{ borderColor: projectStatusColor(context.projectControlStatus) }}>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#C4B5FD]">
              <Brain size={14} />
              Project Health
              <span className={`rounded-full border px-2 py-0.5 text-[9px] tracking-normal ${statusClass(context.projectControlStatus)}`}>{projectStatusLabel(context.projectControlStatus)}</span>
            </div>
            <button
              type="button"
              onClick={onExplain}
              className="flex h-8 items-center gap-1.5 rounded-full border border-violet-300/30 bg-[linear-gradient(135deg,#1D7CFF,#7C3AED)] px-3 text-[10px] font-black uppercase tracking-wide text-white shadow-[0_0_18px_rgba(124,58,237,0.35)] transition-transform hover:scale-105"
            >
              <Sparkles size={13} /> Explain
            </button>
          </div>
          <h3 className="text-[18px] font-black leading-6 text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{latest ? `Result of latest update: ${latest.title}` : baselineTitle}</h3>
          <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-[#B8C7DB]">
            {latest ? `${context.latestImpact} ProjectCommand recalculated this from ${latest.affectedModule}.` : baselineImpact}
          </p>
          <div className="mt-3 rounded-lg border border-[rgba(46,127,255,0.14)] bg-[#07111F]/70 px-3 py-2 text-[11px] font-bold text-[#DCE8F8]">{movement}</div>
          {latest && (
            <div className="mt-3">
              <EventImpactChips event={latest} />
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            ['Forecast Handover', formatProjectDate(context.metrics.forecastHandover)],
            ['Forecast Cost', formatProjectCurrency(context.metrics.eac)],
            ['Risk Exposure', formatProjectCurrency(context.metrics.riskExposure)],
            ['Handover Confidence', `${context.metrics.handoverConfidence}%`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#07111F]/80 px-3 py-2.5">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">{label}</p>
              <p className="mt-1 text-[13px] font-black text-[#EEF3FA]">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

function ProjectPositionBrief({
  context,
  onPrepare,
  onAddUpdate,
}: {
  context: ProjectControlContext;
  onPrepare: (action: ManagerAction) => void;
  onAddUpdate: () => void;
}) {
  const latest = latestLiveEvent(context);
  const topAction = context.managerActions[0];
  const watchItems = latest ? latest.affectedAreas.slice(0, 4) : baselineWatchItems(context);
  const positionTitle = latest
    ? `${latest.title} changed the project position.`
    : baselinePositionTitle(context);
  const positionDetail = latest
    ? `${latest.impactLabel} ProjectCommand recalculated health, cost, programme, evidence, and manager actions from this update.`
    : `No live update has been logged for this ${context.baseline.project.type.toLowerCase()} project yet. Watch ${watchItems.slice(0, 3).join(', ')} before the next manager update.`;
  const impactSummary = latest
    ? [
        `Health ${formatSignedNumber(latest.impacts.healthDelta)}`,
        latest.impacts.eacDelta !== 0 ? `EAC ${formatSignedCurrency(latest.impacts.eacDelta)}` : null,
        latest.impacts.riskDelta !== 0 ? `Risk ${formatRiskDelta(latest.impacts.riskDelta)}` : null,
        latest.impacts.floatDelta !== 0 ? `Float ${formatSignedNumber(latest.impacts.floatDelta, 'd')}` : null,
        `Confidence ${context.metrics.handoverConfidence}%`,
      ].filter(Boolean).join(' / ')
    : `Baseline health ${context.metrics.healthScore}/100 / Float ${context.metrics.floatRemaining}d / EAC ${formatProjectCurrency(context.metrics.eac)}`;
  const nextDecision = topAction
    ? `${topAction.title} - ${topAction.expectedImpact}`
    : 'Log a useful project update to generate a manager action.';
  const currentPositionLabel = latest
    ? 'Live update applied'
    : context.projectControlStatus === 'on-track'
      ? 'Approved baseline active'
      : context.projectControlStatus === 'watch'
        ? 'Baseline under watch'
        : `${projectStatusLabel(context.projectControlStatus)} baseline`;

  return (
    <section className="rounded-xl border border-cyan-300/18 bg-[linear-gradient(135deg,rgba(0,198,255,0.10),rgba(124,58,237,0.10),rgba(7,17,31,0.84))] p-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100">
            <GitBranch size={13} />
            Today's Project Position
          </div>
          <h3 className="mt-1 text-[17px] font-black leading-6 text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {positionTitle}
          </h3>
          <p className="mt-1 max-w-4xl text-[11px] leading-5 text-[#AFC2DC]">{positionDetail}</p>
        </div>
        <button
          type="button"
          onClick={onAddUpdate}
          className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#7C3AED] px-3 text-[10px] font-black text-white shadow-[0_0_22px_rgba(124,58,237,0.24)] transition-colors hover:bg-[#6D28D9]"
        >
          <Zap size={12} />
          Add Project Update
        </button>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[1fr_1fr_1fr]">
        <div className="rounded-xl border border-white/8 bg-[#07111F]/72 p-3">
          <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">Current position</p>
          <p className="mt-1 text-[12px] font-black leading-4 text-[#EEF3FA]">
            {currentPositionLabel}
          </p>
          <p className="mt-1 text-[10px] leading-4 text-[#8EA7C7]">
            {latest ? `${latest.affectedModule} is now driving the forecast.` : `Ready to log the next real ${context.baseline.project.type.toLowerCase()} condition.`}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {watchItems.map(item => (
              <span key={item} className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[9px] font-bold text-[#AFC2DC]">{item}</span>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/8 bg-[#07111F]/72 p-3">
          <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">Impact now</p>
          <p className="mt-1 text-[12px] font-black leading-4 text-[#EEF3FA]">{impactSummary}</p>
          <p className="mt-1 text-[10px] leading-4 text-[#8EA7C7]">
            Selected project context drives programme, cost, evidence, vendor score, and handover confidence.
          </p>
          {latest && (
            <div className="mt-2">
              <EventImpactChips event={latest} compact />
            </div>
          )}
        </div>

        <div className="rounded-xl border border-white/8 bg-[#07111F]/72 p-3">
          <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">Next manager decision</p>
          <p className="mt-1 line-clamp-2 text-[12px] font-black leading-4 text-[#EEF3FA]">{nextDecision}</p>
          <p className="mt-1 text-[10px] leading-4 text-[#8EA7C7]">
            {topAction ? `Priority ${topAction.priority}. ${topAction.costImplication}` : 'No action is ready until a project condition is logged.'}
          </p>
          {topAction && (
            <button
              type="button"
              onClick={() => onPrepare(topAction)}
              className="mt-2 inline-flex h-7 items-center gap-1.5 rounded-lg border border-[#2E7FFF]/24 bg-[#2E7FFF]/12 px-2.5 text-[9px] font-black text-[#BFD8FF] hover:bg-[#2E7FFF]/20"
            >
              {managerActionButtonLabel(topAction)}
              <ArrowRight size={11} />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function OwnerCommandSurface({
  context,
  onPrepare,
  onAddUpdate,
  goTo,
  demoTimelineMs,
}: {
  context: ProjectControlContext;
  onPrepare: (action: ManagerAction) => void;
  onAddUpdate: () => void;
  goTo: (screen: ProjectCommandScreen) => void;
  demoTimelineMs?: number;
}) {
  const latest = latestLiveEvent(context);
  const topAction = context.managerActions[0];
  const topException = context.controlExceptions[0];
  const unresolved = context.consequenceSimulation.ifUnresolved.slice(0, 3);
  const resolved = context.consequenceSimulation.ifResolvedToday.slice(0, 3);
  const currentSignal = latest
    ? latest.title
    : context.projectControlStatus === 'on-track'
      ? 'Baseline is active and ready for the next control signal'
      : context.topThreat;
  const signalDetail = latest
    ? `${latest.impactLabel} ProjectCommand has recalculated programme, cost, risk, evidence, forecast, and manager actions from the same event.`
    : `The owner sees ${context.metrics.completion}% progress, ${context.metrics.floatRemaining} days of float, ${formatProjectCurrency(context.metrics.eac)} forecast cost, and ${context.metrics.handoverConfidence}% handover confidence before opening detailed reports.`;
  const headlineText = latest ? 'One project signal has become an owner decision.' : 'One surface tells the owner where the project needs attention.';
  const demoRevealMs = typeof demoTimelineMs === 'number' ? demoTimelineMs : null;
  const typeStartMs = 3_000;
  const typeEndMs = 13_500;
  const typingProgress = demoRevealMs === null
    ? 1
    : Math.min(1, Math.max(0, (demoRevealMs - typeStartMs) / (typeEndMs - typeStartMs)));
  const typedHeadline = typingProgress >= 1
    ? headlineText
    : headlineText.slice(0, Math.ceil(headlineText.length * typingProgress));
  const isTypingHeadline = demoRevealMs !== null && typingProgress > 0 && typingProgress < 1;
  const revealClass = (startMs: number) => (
    demoRevealMs === null || demoRevealMs >= startMs
      ? 'opacity-100 translate-y-0 scale-100'
      : 'pointer-events-none opacity-0 translate-y-4 scale-[0.98]'
  );
  const ownerQuestion = topException
    ? `Do we accept, recover, or escalate ${topException.linkedObject}?`
    : 'What should leadership review before the next project meeting?';
  const commandPath: Array<{
    label: string;
    value: string;
    screen: ProjectCommandScreen;
    tone: string;
  }> = [
    { label: 'Programme', value: `${context.metrics.floatRemaining}d float`, screen: 'programme', tone: 'text-cyan-100' },
    { label: 'Cost', value: formatProjectCurrency(context.metrics.eac), screen: 'cost', tone: 'text-[#FFCD57]' },
    { label: 'Risk', value: formatProjectCurrency(context.metrics.riskExposure), screen: 'risk', tone: 'text-red-100' },
    { label: 'Evidence', value: `${context.metrics.evidenceCompleteness}% ready`, screen: 'evidence', tone: 'text-emerald-100' },
  ];

  return (
    <motion.section
      data-demo-anchor="project-overview-command-strip"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-cyan-300/22 bg-[linear-gradient(135deg,rgba(7,17,31,0.98),rgba(17,32,64,0.92)_54%,rgba(38,16,80,0.74))] shadow-[0_24px_70px_rgba(0,0,0,0.28)]"
    >
      <div className="grid gap-0 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
        <div className="p-4 md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100">
                <Brain size={14} />
                Owner command decision
                <span className={`rounded-full border px-2 py-0.5 tracking-normal ${statusClass(context.projectControlStatus)}`}>
                  {projectStatusLabel(context.projectControlStatus)}
                </span>
              </div>
              <h3 className="mt-2 max-w-4xl text-[24px] font-black leading-[1.08] text-white md:text-[30px]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {typedHeadline}
                {isTypingHeadline && <span className="ml-1 inline-block animate-pulse text-cyan-200">|</span>}
              </h3>
              <p className={`mt-2 max-w-5xl text-[13px] leading-6 text-[#B8C7DB] transition-all duration-700 ease-out ${revealClass(14_500)}`}>{signalDetail}</p>
            </div>
            <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4 lg:w-[520px]">
              {[
                ['Health', `${context.metrics.healthScore}/100`, 'text-emerald-100'],
                ['Float', `${context.metrics.floatRemaining}d`, context.metrics.floatRemaining <= 14 ? 'text-red-100' : 'text-cyan-100'],
                ['EAC', formatProjectCurrency(context.metrics.eac), 'text-[#FFCD57]'],
                ['Confidence', `${context.metrics.handoverConfidence}%`, 'text-[#DDD6FE]'],
              ].map(([label, value, tone], index) => (
                <div
                  key={label}
                  className={`rounded-xl border border-white/10 bg-[#07111F]/76 px-3 py-2.5 transition-all duration-700 ease-out ${revealClass(18_500 + index * 1_250)}`}
                >
                  <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">{label}</p>
                  <p className={`mt-1 text-[16px] font-black ${tone}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.7fr)]">
            <div data-demo-anchor="project-overview-what-changed" className={`rounded-xl border border-[#2E7FFF]/18 bg-[#07111F]/72 p-3 transition-all duration-700 ease-out ${revealClass(22_000)}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#7A94B4]">What changed</p>
                  <h4 className="mt-1 text-[17px] font-black leading-5 text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{currentSignal}</h4>
                </div>
                <span className="shrink-0 rounded-full border border-cyan-300/22 bg-cyan-300/10 px-2 py-1 text-[9px] font-black uppercase text-cyan-100">
                  Live twin
                </span>
              </div>
              <p className="mt-2 text-[11px] leading-5 text-[#AFC2DC]">
                {latest
                  ? `Source: ${latest.affectedModule}. The same signal now updates cost, forecast, gate readiness, risk pressure, and action ownership.`
                  : `Source: approved baseline. The next site, procurement, commercial, or evidence update will change this decision surface immediately.`}
              </p>
              {latest && <div className="mt-3"><EventImpactChips event={latest} compact /></div>}
            </div>

            <div data-demo-anchor="project-overview-next-decision" className={`rounded-xl border border-[#7C3AED]/24 bg-[#7C3AED]/10 p-3 transition-all duration-700 ease-out ${revealClass(27_000)}`}>
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#DDD6FE]">Next owner decision</p>
              <h4 className="mt-1 text-[16px] font-black leading-5 text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {topAction?.title ?? ownerQuestion}
              </h4>
              <p className="mt-2 text-[11px] leading-5 text-[#D8CDFE]">
                {topAction
                  ? `${topAction.expectedImpact} Owner: ${managerActionOwner(topAction)}. Due: ${managerActionDue(topAction)}.`
                  : ownerQuestion}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {topAction && (
                  <button
                    type="button"
                    onClick={() => onPrepare(topAction)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#7C3AED] px-3 text-[10px] font-black text-white shadow-[0_0_22px_rgba(124,58,237,0.24)] hover:bg-[#6D28D9]"
                  >
                    Prepare owner action
                    <ArrowRight size={12} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onAddUpdate}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#2E7FFF]/24 bg-[#2E7FFF]/12 px-3 text-[10px] font-black text-[#BFD8FF] hover:bg-[#2E7FFF]/20"
                >
                  <Zap size={12} />
                  Add update
                </button>
              </div>
            </div>
          </div>
        </div>

        <aside data-demo-anchor="project-overview-impact-chain" className={`border-t border-cyan-300/16 bg-[#07111F]/68 p-4 transition-all duration-700 ease-out xl:border-l xl:border-t-0 md:p-5 ${revealClass(32_000)}`}>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#FFB4BC]">
            <ShieldAlert size={14} />
            If leadership waits
          </div>
          <div className="mt-3 grid gap-2">
            {unresolved.map(item => (
              <div key={`${item.label}-${item.value}`} className="rounded-xl border border-red-300/18 bg-red-400/8 px-3 py-2.5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[8px] font-black uppercase tracking-[0.14em] text-red-100">{item.label}</p>
                  <p className="shrink-0 text-[12px] font-black text-[#FFE4E6]">{item.value}</p>
                </div>
                <p className="mt-1 text-[10px] leading-4 text-[#FBC5C9]">{item.detail}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-xl border border-emerald-300/18 bg-emerald-300/8 p-3">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-100">If action is taken now</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
              {resolved.map(item => (
                <div key={`${item.label}-${item.value}`} className="rounded-lg bg-[#07111F]/72 px-2.5 py-2">
                  <p className="text-[8px] font-black uppercase text-emerald-100">{item.label}</p>
                  <p className="mt-0.5 text-[10px] font-bold leading-4 text-[#DDFBEA]">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <div className={`border-t border-[#2E7FFF]/18 bg-[#07111F]/76 px-4 py-3 transition-all duration-700 ease-out md:px-5 ${revealClass(36_000)}`}>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#7A94B4]">Command path</p>
            <p className="mt-1 text-[11px] leading-5 text-[#AFC2DC]">Open the control lane that explains the decision instead of sending the team back to separate reports.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-4 xl:w-[760px]">
            {commandPath.map(item => (
              <button
                key={item.label}
                type="button"
                onClick={() => goTo(item.screen)}
                className="group flex min-h-[58px] items-center justify-between gap-3 rounded-xl border border-[#2E7FFF]/18 bg-[#112040]/76 px-3 py-2 text-left transition-colors hover:border-cyan-300/32 hover:bg-[#16315A]"
              >
                <span>
                  <span className="block text-[9px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">{item.label}</span>
                  <span className={`mt-0.5 block text-[12px] font-black ${item.tone}`}>{item.value}</span>
                </span>
                <ArrowRight size={13} className="shrink-0 text-[#8EA7C7] transition-transform group-hover:translate-x-0.5 group-hover:text-cyan-100" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function controlLogOutcome(event: ProjectControlContext['events'][number]) {
  const outcomes: Partial<Record<ProjectEventType, { label: string; toast: string }>> = {
    'facade-delay': {
      label: 'Release brief ready',
      toast: 'Facade procurement release brief prepared for review.',
    },
    'variation-submitted': {
      label: 'Variation brief ready',
      toast: 'Variation order review brief prepared for commercial approval.',
    },
    'crane-loss': {
      label: 'Resequence task ready',
      toast: 'Crane resequencing task prepared for programme owner.',
    },
    'missing-approval': {
      label: 'Approval request ready',
      toast: 'Authority approval request prepared with evidence follow-up.',
    },
    'evidence-rejected': {
      label: 'Correction requested',
      toast: 'Corrected evidence request prepared for the responsible owner.',
    },
    'inspection-failure': {
      label: 'Reinspection plan ready',
      toast: 'Reinspection plan prepared for quality and gate recovery.',
    },
    'contractor-underperformance': {
      label: 'Recovery notice ready',
      toast: 'Contractor recovery notice prepared for manager review.',
    },
    'weather-disruption': {
      label: 'Recovery window ready',
      toast: 'Weather recovery window prepared for programme resequencing.',
    },
    'recovery-approved': {
      label: 'Monitoring started',
      toast: 'Recovery monitoring started against float and confidence.',
    },
    'portfolio-action-plan': {
      label: 'Handoff opened',
      toast: 'Portfolio action handoff opened in ProjectCommand.',
    },
  };
  return outcomes[event.type] ?? {
    label: `${event.cta} ready`,
    toast: `${event.cta} prepared for manager review.`,
  };
}

function WhatChangedToday({
  context,
  goTo,
  activatedActions,
  onActivateEvent,
  onExplainEvent,
}: {
  context: ProjectControlContext;
  goTo: (screen: ProjectCommandScreen) => void;
  activatedActions: Record<string, string>;
  onActivateEvent: (event: ProjectControlContext['events'][number], target: ProjectCommandScreen) => void;
  onExplainEvent: (event: ProjectControlContext['events'][number]) => void;
}) {
  const liveUpdates = context.changedToday.filter(event => event.type !== 'baseline-created');

  const targetFor = (module: string): ProjectCommandScreen => {
    if (module.includes('Cost') || module.includes('Variation')) return 'cost';
    if (module.includes('Evidence')) return 'evidence';
    if (module.includes('Stage')) return 'stagegates';
    if (module.includes('Vendor') || module.includes('Risk')) return 'risk';
    return 'programme';
  };

  return (
    <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Today's Progress</h3>
          <p className="mt-0.5 text-[11px] text-[#7A94B4]">Useful project updates and the impact on forecast, cost, evidence, and owners.</p>
        </div>
        <span className="rounded-full border border-[rgba(46,127,255,0.18)] bg-[#07111F] px-2.5 py-1 text-[10px] font-black text-[#8EA7C7]">
          {liveUpdates.length === 0 ? 'Steady' : `${liveUpdates.length} update${liveUpdates.length === 1 ? '' : 's'}`}
        </span>
      </div>
      {liveUpdates.length === 0 ? (
        <div className="rounded-xl border border-[rgba(46,127,255,0.13)] bg-[#07111F]/72 p-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-emerald-300/18 bg-emerald-300/10 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-100">Baseline healthy</span>
                <span className="text-[10px] font-bold text-[#7A94B4]">No blockers reported today</span>
              </div>
              <p className="mt-2 text-[12px] font-black text-[#EEF3FA]">The project is holding its approved baseline.</p>
              <p className="mt-1 max-w-4xl text-[11px] leading-4 text-[#B8C7DB]">
                Keep the team focused on the next milestone, evidence completion, and handover readiness. When a useful update appears, this area will show the outcome and owner impact.
              </p>
            </div>
            <button
              type="button"
              onClick={() => goTo('programme')}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[#7C3AED]/30 bg-[#7C3AED]/12 px-3 text-[10px] font-black text-[#DDD6FE] hover:bg-[#7C3AED]/20"
            >
              View programme
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
        {liveUpdates.slice(0, 6).map((event, index) => {
          const target = targetFor(event.affectedModule);
          const activatedLabel = activatedActions[event.id];
          return (
            <motion.div
              key={event.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className={`grid gap-3 rounded-xl border p-3 lg:grid-cols-[1fr_178px] lg:items-center ${
                activatedLabel
                  ? 'border-emerald-300/22 bg-emerald-300/8'
                  : 'border-[rgba(46,127,255,0.13)] bg-[#07111F]/72'
              }`}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${severityClass[event.severity]} ${index === 0 && context.changedToday.length > 0 ? 'animate-pulse' : ''}`}>{event.type.replaceAll('-', ' ')}</span>
                  <span className="text-[10px] font-bold text-[#7A94B4]">{event.affectedModule}</span>
                  <span className="text-[10px] text-[#5A6E88]">{formatProjectEventTime(event.timestamp)}</span>
                  {activatedLabel && (
                    <span className="rounded-full border border-emerald-300/24 bg-emerald-300/10 px-2 py-0.5 text-[9px] font-black text-emerald-100">
                      Action ready
                    </span>
                  )}
                </div>
                <p className="mt-2 text-[12px] font-black text-[#EEF3FA]">{event.title}</p>
                <p className="mt-1 text-[11px] leading-4 text-[#B8C7DB]">{event.impactLabel}</p>
                <div className="mt-2">
                  <EventImpactChips event={event} compact />
                </div>
                {event.affectedAreas.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {event.affectedAreas.slice(0, 5).map(area => (
                      <span key={`${event.id}-${area}`} className="rounded-full bg-white/[0.035] px-2 py-0.5 text-[9px] font-bold text-[#8EA7C7]">
                        {area}
                      </span>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => onExplainEvent(event)}
                  className="mt-2 inline-flex h-7 items-center gap-1.5 rounded-lg border border-cyan-300/18 bg-cyan-300/8 px-2.5 text-[9px] font-black text-cyan-100 hover:bg-cyan-300/12"
                >
                  Explain decision chain
                  <ArrowRight size={11} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => onActivateEvent(event, target)}
                className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border px-3 text-center text-[10px] font-black transition-colors ${
                  activatedLabel
                    ? 'border-emerald-300/24 bg-emerald-300/12 text-emerald-100 hover:bg-emerald-300/16'
                    : 'border-[#7C3AED]/30 bg-[#7C3AED]/12 text-[#DDD6FE] hover:bg-[#7C3AED]/20'
                }`}
              >
                {activatedLabel ? (
                  <>
                    <CheckCircle2 size={12} />
                    {activatedLabel}
                  </>
                ) : (
                  <>
                    {event.cta}
                    <ArrowRight size={12} />
                  </>
                )}
              </button>
            </motion.div>
          );
        })}
        </div>
      )}
    </section>
  );
}

function ControlExceptions({ context, goTo }: { context: ProjectControlContext; goTo: (screen: ProjectCommandScreen) => void }) {
  const exceptions = context.controlExceptions;
  return (
    <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-base font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Control Exceptions</h3>
        <span className="rounded-full border border-red-300/24 bg-red-400/10 px-2.5 py-1 text-[10px] font-black text-red-100">{exceptions.length} open</span>
      </div>
      {exceptions.length === 0 ? (
        <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-[12px] font-bold text-emerald-100">
          No blocked gates, missing evidence, pending variation, or vendor escalation is active.
        </div>
      ) : (
        <div className="grid gap-2 lg:grid-cols-2">
          {exceptions.map(exception => (
            <motion.div
              key={exception.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-[rgba(46,127,255,0.13)] bg-[#07111F]/72 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${severityClass[exception.severity]}`}>{exception.severity}</span>
                  <p className="mt-2 text-[12px] font-black text-[#EEF3FA]">{exception.title}</p>
                  <p className="mt-1 text-[10px] font-bold text-[#7A94B4]">{exception.linkedObject}</p>
                </div>
                <FileWarning size={17} className="shrink-0 text-[#FFCD57]" />
              </div>
              <p className="mt-2 min-h-[34px] text-[11px] leading-4 text-[#B8C7DB]">{exception.impact}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg bg-[#0A1628] px-2.5 py-2">
                  <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#5A6E88]">Caused by</p>
                  <p className="mt-0.5 truncate text-[10px] font-bold text-[#DCE8F8]">{exception.sourceEvent ?? 'Baseline control rule'}</p>
                </div>
                <div className="rounded-lg bg-[#0A1628] px-2.5 py-2">
                  <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#5A6E88]">Metric hit</p>
                  <p className="mt-0.5 truncate text-[10px] font-bold text-[#DCE8F8]">{exception.impactMetric ?? 'Gate readiness'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => goTo(exception.title.includes('evidence') ? 'evidence' : exception.title.includes('variation') ? 'cost' : exception.title.includes('vendor') || exception.title.includes('Risk') ? 'risk' : 'stagegates')}
                className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg border border-[rgba(46,127,255,0.18)] bg-[#0A1628] px-3 text-[10px] font-black text-[#DCE8F8] hover:bg-white/5"
              >
                {exception.cta}
                <ArrowRight size={12} />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}

function DecisionQueue({ context, onPrepare }: { context: ProjectControlContext; onPrepare: (action: ManagerAction) => void }) {
  const actions = context.managerActions.slice(0, 3);
  const latest = latestLiveEvent(context);
  const latestLabel = latest?.title ?? 'Waiting for live project data.';

  return (
    <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>AI Action Workbench</h3>
          <p className="mt-0.5 text-[11px] text-[#7A94B4]">Manager-ready responses tied to the latest project condition.</p>
        </div>
        <span className="rounded-full border border-[#7C3AED]/25 bg-[#7C3AED]/12 px-2.5 py-1 text-[10px] font-black text-[#DDD6FE]">{context.managerActions.length} ready</span>
      </div>

      <div className="mb-3 rounded-xl border border-[#7C3AED]/18 bg-[#7C3AED]/10 px-3 py-2">
        <div className="flex items-center justify-between gap-3">
          <p className="shrink-0 text-[8px] font-black uppercase tracking-[0.14em] text-[#C4B5FD]">Latest update</p>
          <p className="min-w-0 truncate text-right text-[10px] font-bold text-[#EDE9FE]">{latestLabel}</p>
        </div>
        {latest && (
          <div className="mt-1.5">
            <EventImpactChips event={latest} compact />
          </div>
        )}
      </div>

      <div className="space-y-2">
        {actions.map((action, index) => {
          const source = action.triggerLabel || latestLabel;
          return (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.035 }}
            className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#07111F]/78 p-2.5"
          >
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#2E7FFF]/20 bg-[#0A1628] text-[#80B7FF]">
                  <Target size={13} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`rounded-full border px-2 py-0.5 text-[8px] font-black uppercase ${severityClass[action.priority === 'critical' ? 'critical' : action.priority === 'high' ? 'high' : action.priority === 'medium' ? 'medium' : 'low']}`}>{action.priority}</span>
                    <span className="rounded-full border border-cyan-300/14 bg-cyan-300/8 px-2 py-0.5 text-[8px] font-black text-cyan-100">AI suggestion</span>
                  </div>
                  <h4 className="mt-1 line-clamp-1 text-[12px] font-black leading-4 text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{action.title}</h4>
                  <p className="mt-1 line-clamp-1 text-[9px] font-bold text-[#7A94B4]">From: {source}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onPrepare(action)}
                title={action.cta}
                className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-lg border border-[#2E7FFF]/24 bg-[#0A1628] px-2.5 text-[9px] font-black text-[#BFD8FF] transition-colors hover:border-[#2E7FFF]/42 hover:bg-[#2E7FFF]/12"
              >
                <CheckCircle2 size={11} />
                {managerActionButtonLabel(action)}
              </button>
            </div>
            <p className="mt-2 line-clamp-2 text-[10px] font-bold leading-4 text-[#8EA7C7]">
              Why now: {action.whyItMatters}
            </p>
            <p className="mt-1 line-clamp-1 text-[9px] font-semibold leading-4 text-[#7A94B4]">
              Source impact: {action.expectedImpact} / {action.costImplication}
            </p>
            <div className="mt-2 grid gap-1.5 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <div className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-emerald-300/12 bg-emerald-300/8 px-2.5 py-1.5">
                <p className="shrink-0 text-[8px] font-black uppercase tracking-[0.14em] text-emerald-100">Impact</p>
                <p className="min-w-0 truncate text-right text-[10px] font-bold text-[#DDFBEA]">{action.expectedImpact}</p>
              </div>
              <div className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-[rgba(46,127,255,0.10)] bg-[#0A1628] px-2.5 py-1.5">
                <p className="shrink-0 text-[8px] font-black uppercase tracking-[0.14em] text-[#5A6E88]">Cost</p>
                <p className="min-w-0 truncate text-right text-[10px] font-bold text-[#DCE8F8]">{action.costImplication}</p>
              </div>
            </div>
          </motion.div>
        );
        })}
      </div>
    </section>
  );
}

function ForecastCard({ scenario, context }: { scenario: ForecastScenario; context: ProjectControlContext }) {
  const tone = scenario.type === 'optimistic' ? '#38D98A' : scenario.type === 'base' ? '#00C6FF' : '#FF9B38';
  const eventLabel = context.latestEvent?.title ?? 'Baseline';
  return (
    <div className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#07111F]/78 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: tone }}>{scenario.type}</p>
          <h4 className="mt-2 text-[17px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{formatProjectDate(scenario.handoverDate)}</h4>
        </div>
        <span className="rounded-full border border-[rgba(46,127,255,0.18)] bg-[#0A1628] px-2 py-1 text-[10px] font-black text-[#DCE8F8]">{scenario.confidence}%</span>
      </div>
      <p className="mt-2 text-[13px] font-black" style={{ color: tone }}>{formatProjectCurrency(scenario.forecastCost)}</p>
      <div className="mt-3 rounded-lg border border-[rgba(46,127,255,0.12)] bg-[#0A1628] px-2.5 py-2">
        <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#5A6E88]">Scenario driver</p>
        <p className="mt-0.5 line-clamp-2 text-[10px] font-bold leading-4 text-[#DCE8F8]">{eventLabel} / {context.events.length} event(s) applied</p>
      </div>
      <div className="mt-3 space-y-1">
        {scenario.assumptions.slice(0, 3).map(item => (
          <div key={item} className="flex gap-2 text-[10px] leading-4 text-[#8EA7C7]">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: tone }} />
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function daysBetweenDates(start: string, end: string) {
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  if (Number.isNaN(startTime) || Number.isNaN(endTime)) return 0;
  return Math.round((endTime - startTime) / dayMs);
}

function formatDayMovement(days: number) {
  if (days === 0) return 'No date movement';
  return `${days > 0 ? '+' : ''}${days}d`;
}

function formatCostMovement(value: number) {
  if (value === 0) return 'No cost movement';
  return `${value > 0 ? '+' : '-'}${formatProjectCurrency(Math.abs(value))}`;
}

function CompactForecastSummary({ context, onOpenForecast }: { context: ProjectControlContext; onOpenForecast: () => void }) {
  const latest = latestLiveEvent(context);
  const baseScenario = context.forecastScenarios.find(scenario => scenario.type === 'base') ?? context.forecastScenarios[0];
  const optimistic = context.forecastScenarios.find(scenario => scenario.type === 'optimistic');
  const pessimistic = context.forecastScenarios.find(scenario => scenario.type === 'pessimistic');
  const handoverDeltaDays = daysBetweenDates(context.baseline.project.targetHandover, context.metrics.forecastHandover);
  const costDelta = context.metrics.eac - context.baseline.project.approvedBudget;
  const confidenceLabel = latest?.severity === 'positive'
    ? 'Improving'
    : context.metrics.handoverConfidence < 64
      ? 'At risk'
      : context.metrics.handoverConfidence < 76
        ? 'Watch'
        : 'Stable';
  const confidenceTone = confidenceLabel === 'Improving'
    ? 'text-emerald-100'
    : confidenceLabel === 'At risk'
      ? 'text-red-100'
      : confidenceLabel === 'Watch'
        ? 'text-amber-100'
        : 'text-cyan-100';
  const scenarioRows = [
    { label: 'Best case', value: optimistic ? formatProjectDate(optimistic.handoverDate) : '-', cost: optimistic ? formatProjectCurrency(optimistic.forecastCost) : '-', tone: 'text-emerald-100' },
    { label: 'Base case', value: formatProjectDate(baseScenario.handoverDate), cost: formatProjectCurrency(baseScenario.forecastCost), tone: 'text-cyan-100' },
    { label: 'Risk case', value: pessimistic ? formatProjectDate(pessimistic.handoverDate) : '-', cost: pessimistic ? formatProjectCurrency(pessimistic.forecastCost) : '-', tone: 'text-orange-100' },
  ];
  const distinctForecasts = new Set(scenarioRows.map(row => `${row.value}-${row.cost}`)).size;
  const showForecastRange = Boolean(latest && distinctForecasts > 1);
  const handleNextAction = () => {
    onOpenForecast();
  };
  const nextActionLabel = latest
    ? latest.type === 'recovery-approved'
      ? 'Open forecast'
      : 'Review recovery options'
    : 'View forecast';

  return (
    <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Forecast Decision</h3>
          <p className="mt-0.5 text-[11px] text-[#7A94B4]">
            {latest
              ? 'Forecast movement, driver, and next manager action.'
              : 'Forecast remains aligned to the approved baseline. Handover and EAC are holding steady.'}
          </p>
        </div>
        <button onClick={handleNextAction} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-[#2E7FFF]/24 bg-[#07111F] px-3 text-[10px] font-black text-[#BFD8FF] hover:bg-[#2E7FFF]/12">
          {nextActionLabel}
          <ArrowRight size={12} />
        </button>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.72fr)]">
        <div className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#07111F]/78 p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">Current forecast</p>
              <p className="mt-1 text-[18px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{formatProjectDate(context.metrics.forecastHandover)}</p>
              <p className="mt-0.5 text-[10px] font-bold text-[#8EA7C7]">{formatProjectCurrency(context.metrics.eac)} EAC</p>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">Movement</p>
              <p className={`mt-1 text-[18px] font-black ${handoverDeltaDays > 0 ? 'text-orange-100' : latest?.severity === 'positive' ? 'text-emerald-100' : 'text-[#EEF3FA]'}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{formatDayMovement(handoverDeltaDays)}</p>
              <p className={`mt-0.5 text-[10px] font-bold ${costDelta > 0 ? 'text-orange-100' : costDelta < 0 ? 'text-emerald-100' : 'text-[#8EA7C7]'}`}>{formatCostMovement(costDelta)}</p>
            </div>
          </div>
          <div className={`mt-3 rounded-lg border px-2.5 py-2 ${latest ? 'border-cyan-300/14 bg-cyan-300/8' : 'border-[rgba(46,127,255,0.14)] bg-[#0A1628]'}`}>
            <p className={`text-[8px] font-black uppercase tracking-[0.14em] ${latest ? 'text-cyan-100' : 'text-[#7A94B4]'}`}>Primary driver</p>
            <p className="mt-0.5 line-clamp-2 text-[10px] font-bold leading-4 text-[#DDF7FF]">
              {latest ? latest.title : 'Approved baseline holding steady.'}
            </p>
          </div>
        </div>

        <div className="grid gap-2">
          <div className="rounded-xl border border-[rgba(46,127,255,0.12)] bg-[#07111F]/78 px-3 py-2.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#5A6E88]">Confidence</p>
                <p className={`mt-0.5 text-[15px] font-black ${confidenceTone}`}>{context.metrics.handoverConfidence}% / {confidenceLabel}</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#5A6E88]">Float</p>
                <p className="mt-0.5 text-[12px] font-black text-[#DCE8F8]">{context.metrics.floatRemaining}d</p>
              </div>
            </div>
            <p className="mt-2 text-[10px] leading-4 text-[#8EA7C7]">
              {latest
                ? `Risk exposure is ${formatProjectCurrency(context.metrics.riskExposure)} after the latest update.`
                : `Baseline risk exposure is ${formatProjectCurrency(context.metrics.riskExposure)}. Forecast impact will appear after the first logged update.`}
            </p>
          </div>

          {showForecastRange && (
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1 2xl:grid-cols-3">
              {scenarioRows.map(row => (
                <div key={row.label} className="rounded-xl border border-[rgba(46,127,255,0.12)] bg-[#07111F]/78 px-3 py-2">
                  <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#5A6E88]">{row.label}</p>
                  <p className={`mt-0.5 text-[11px] font-black ${row.tone}`}>{row.value}</p>
                  <p className="mt-0.5 text-[10px] font-bold text-[#8EA7C7]">{row.cost}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ImpactAnalysisPanel({ context }: { context: ProjectControlContext }) {
  const cascade = context.cascadeEffects[0];
  const simulation = context.consequenceSimulation;
  const impacts = context.crossModuleImpacts.slice(0, 4);

  return (
    <details className="group rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Impact Analysis</h3>
          <p className="mt-0.5 text-[11px] text-[#7A94B4]">Cause, forecast effect, and connected areas in one place.</p>
        </div>
        <span className="rounded-full border border-[rgba(46,127,255,0.18)] bg-[#07111F] px-2.5 py-1 text-[10px] font-black text-[#8EA7C7] group-open:hidden">Expand</span>
        <span className="hidden rounded-full border border-[rgba(46,127,255,0.18)] bg-[#07111F] px-2.5 py-1 text-[10px] font-black text-[#8EA7C7] group-open:inline-flex">Collapse</span>
      </summary>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <div className="rounded-xl border border-[rgba(46,127,255,0.13)] bg-[#07111F]/72 p-3">
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">Cause</p>
          <p className="mt-2 text-[12px] font-black leading-5 text-[#EEF3FA]">{cascade?.sourceEvent ?? context.latestEvent?.title ?? 'Project baseline'}</p>
          <p className="mt-2 line-clamp-3 text-[10px] leading-4 text-[#8EA7C7]">{cascade?.chain[0] ?? context.latestImpact}</p>
        </div>
        <div className="rounded-xl border border-[rgba(46,127,255,0.13)] bg-[#07111F]/72 p-3">
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">If unresolved</p>
          <div className="mt-2 space-y-2">
            {simulation.ifUnresolved.slice(0, 2).map(item => (
              <div key={item.label} className="flex items-start justify-between gap-3 rounded-lg bg-[#0A1628] px-2.5 py-2">
                <span className="text-[10px] font-bold text-[#B8C7DB]">{item.label}</span>
                <span className="text-[11px] font-black text-red-100">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-[rgba(46,127,255,0.13)] bg-[#07111F]/72 p-3">
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">Connected areas</p>
          <div className="mt-2 space-y-1.5">
            {impacts.map(item => (
              <div key={item.module} className="flex items-center justify-between gap-2 rounded-lg bg-[#0A1628] px-2.5 py-2">
                <span className="truncate text-[10px] font-bold text-[#DCE8F8]">{item.module}</span>
                <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[8px] font-black uppercase ${statusClass(item.status)}`}>{projectStatusLabel(item.status)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </details>
  );
}

function CascadeEffects({ context }: { context: ProjectControlContext }) {
  const cascade = context.cascadeEffects[0];
  if (!cascade) return null;

  return (
    <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Cascade Effects</h3>
          <p className="mt-0.5 text-[11px] text-[#7A94B4]">Dependency chain created by the latest project update.</p>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase ${severityClass[cascade.severity]}`}>{cascade.severity}</span>
      </div>
      <div className="rounded-xl border border-[rgba(46,127,255,0.13)] bg-[#07111F]/72 p-3">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[#7C3AED]/25 bg-[#7C3AED]/12 px-2 py-0.5 text-[9px] font-black text-[#DDD6FE]">{cascade.sourceEvent}</span>
          {cascade.basedOn.slice(0, 3).map(source => (
            <span key={source} className="rounded-full bg-white/[0.035] px-2 py-0.5 text-[9px] font-bold text-[#8EA7C7]">{source}</span>
          ))}
        </div>
        <div className="grid gap-2">
          {cascade.chain.map((step, index) => (
            <motion.div
              key={`${cascade.id}-${step}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.035 }}
              className="grid grid-cols-[26px_1fr] gap-2"
            >
              <div className="flex flex-col items-center">
                <span className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-black ${index === 0 ? 'bg-red-300/18 text-red-100' : index === cascade.chain.length - 1 ? 'bg-emerald-300/18 text-emerald-100' : 'bg-[#132545] text-[#8EA7C7]'}`}>{index + 1}</span>
                {index < cascade.chain.length - 1 && <span className="my-1 h-5 w-px bg-[rgba(142,167,199,0.24)]" />}
              </div>
              <p className="rounded-lg border border-[rgba(46,127,255,0.10)] bg-[#0A1628] px-3 py-2 text-[11px] font-bold leading-4 text-[#DCE8F8]">{step}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ConsequenceModel({ context }: { context: ProjectControlContext }) {
  const simulation = context.consequenceSimulation;
  return (
    <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Consequence Simulation</h3>
          <p className="mt-0.5 text-[11px] text-[#7A94B4]">{simulation.title}</p>
        </div>
        <span className="rounded-full border border-cyan-300/14 bg-cyan-300/8 px-2.5 py-1 text-[10px] font-black text-cyan-100">AI {simulation.confidence}%</span>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-red-300/18 bg-red-400/8 p-3">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-red-100">If unresolved</p>
          <div className="space-y-2">
            {simulation.ifUnresolved.map(item => (
              <div key={item.label} className="rounded-lg bg-[#07111F]/72 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black text-[#EEF3FA]">{item.label}</span>
                  <span className={`text-[12px] font-black ${item.tone === 'bad' ? 'text-red-100' : 'text-[#DCE8F8]'}`}>{item.value}</span>
                </div>
                <p className="mt-1 text-[10px] leading-4 text-[#FECACA]">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-emerald-300/18 bg-emerald-300/8 p-3">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-100">If resolved today</p>
          <div className="space-y-2">
            {simulation.ifResolvedToday.map(item => (
              <div key={item.label} className="rounded-lg bg-[#07111F]/72 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black text-[#EEF3FA]">{item.label}</span>
                  <span className={`text-[12px] font-black ${item.tone === 'good' ? 'text-emerald-100' : 'text-[#DCE8F8]'}`}>{item.value}</span>
                </div>
                <p className="mt-1 text-[10px] leading-4 text-emerald-100">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function OperationalLayer({ context }: { context: ProjectControlContext }) {
  return (
    <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Operational Layer</h3>
        <span className="rounded-full border border-[rgba(46,127,255,0.18)] bg-[#07111F] px-2.5 py-1 text-[10px] font-black text-[#8EA7C7]">programme / gates / vendors</span>
      </div>
      <div className="grid gap-3 xl:grid-cols-3">
        <div className="rounded-xl border border-[rgba(46,127,255,0.13)] bg-[#07111F]/72 p-3">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-black text-[#EEF3FA]"><GitBranch size={14} /> Programme Phases</div>
          <div className="space-y-1.5">
            {context.baseline.programmePhases.slice(2, 7).map((phase, index) => (
              <div key={phase} className="flex items-center justify-between gap-2 rounded-lg bg-[#0A1628] px-2.5 py-2 text-[10px]">
                <span className="font-bold text-[#DCE8F8]">{phase}</span>
                <span className="text-[#7A94B4]">{index + 3}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-[rgba(46,127,255,0.13)] bg-[#07111F]/72 p-3">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-black text-[#EEF3FA]"><ListChecks size={14} /> Stage Gates</div>
          <div className="space-y-1.5">
            {context.stageGateSummary.slice(2, 7).map(gate => (
              <div key={gate.name} className="grid grid-cols-[1fr_auto] gap-2 rounded-lg bg-[#0A1628] px-2.5 py-2 text-[10px]">
                <span className="font-bold text-[#DCE8F8]">{gate.name}</span>
                <span style={{ color: projectStatusColor(gate.status) }}>{projectStatusLabel(gate.status)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-[rgba(46,127,255,0.13)] bg-[#07111F]/72 p-3">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-black text-[#EEF3FA]"><Users size={14} /> Vendor Scores</div>
          <div className="space-y-1.5">
            {context.vendorSummary.slice(0, 5).map(vendor => (
              <div key={vendor.name} className="rounded-lg bg-[#0A1628] px-2.5 py-2">
                <div className="flex items-center justify-between gap-2 text-[10px]">
                  <span className="truncate font-bold text-[#DCE8F8]">{vendor.name}</span>
                  <span style={{ color: projectStatusColor(vendor.status) }}>{vendor.score}</span>
                </div>
                <div className="mt-1 h-1 rounded-full bg-[#122240]">
                  <div className="h-full rounded-full" style={{ width: `${vendor.score}%`, backgroundColor: projectStatusColor(vendor.status) }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CrossModuleImpactMap({ context, compact = false }: { context: ProjectControlContext; compact?: boolean }) {
  const impacts = compact ? context.crossModuleImpacts.slice(0, 5) : context.crossModuleImpacts;
  return (
    <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Cross-Module Impact</h3>
          <p className="mt-0.5 text-[11px] text-[#7A94B4]">How ProjectCommand shares useful updates with connected 4C360 modules.</p>
        </div>
        <span className="rounded-full border border-[rgba(46,127,255,0.18)] bg-[#07111F] px-2.5 py-1 text-[10px] font-black text-[#8EA7C7]">{impacts.length} links</span>
      </div>
      <div className={`grid gap-2 ${compact ? 'md:grid-cols-5' : 'md:grid-cols-2'}`}>
        {impacts.map(item => (
          <motion.div
            key={item.module}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-[rgba(46,127,255,0.13)] bg-[#07111F]/72 p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[11px] font-black text-[#EEF3FA]">{item.module}</p>
                <p className="mt-1 truncate text-[10px] font-bold text-[#7A94B4]">{item.linkedObject}</p>
              </div>
              <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[8px] font-black uppercase ${statusClass(item.status)}`}>{projectStatusLabel(item.status)}</span>
            </div>
            <p className="mt-2 line-clamp-3 min-h-[42px] text-[10px] leading-4 text-[#B8C7DB]">{item.impact}</p>
            <p className="mt-2 truncate rounded-lg border border-[rgba(46,127,255,0.10)] bg-[#0A1628] px-2.5 py-1.5 text-[9px] font-bold text-[#8EA7C7]">Based on: {item.source}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function SourceTracePanel({ context }: { context: ProjectControlContext }) {
  return (
    <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-base font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>AI Source Trace</h3>
        <span className="rounded-full border border-cyan-300/14 bg-cyan-300/8 px-2.5 py-1 text-[10px] font-black text-cyan-100">Traceable</span>
      </div>
      <div className="space-y-2">
        {context.sourceTraces.map(trace => (
          <div key={trace.insight} className="rounded-xl border border-[rgba(46,127,255,0.13)] bg-[#07111F]/72 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-black text-[#EEF3FA]">{trace.insight}</p>
              <span className="rounded-full bg-cyan-300/8 px-2 py-0.5 text-[9px] font-black text-cyan-100">AI {trace.confidence}%</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {trace.basedOn.slice(0, 4).map(source => (
                <span key={`${trace.insight}-${source}`} className="rounded-full bg-white/[0.035] px-2 py-0.5 text-[9px] font-bold text-[#8EA7C7]">{source}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function controlSignalCopy(type: ProjectEventType) {
  const copy: Record<ProjectEventType, { label: string; detail: string }> = {
    'baseline-created': { label: 'Baseline captured', detail: 'Source controls active' },
    'portfolio-action-plan': { label: 'Portfolio action plan', detail: 'Convert owner actions into project controls' },
    'facade-delay': { label: 'Log package delay', detail: 'Update programme and procurement risk' },
    'variation-submitted': { label: 'Add variation', detail: 'Assess cost and approval impact' },
    'evidence-rejected': { label: 'Reject evidence', detail: 'Open correction and resubmission path' },
    'missing-approval': { label: 'Escalate approval delay', detail: 'Assign authority owner and deadline' },
    'contractor-underperformance': { label: 'Flag contractor issue', detail: 'Create recovery action and owner' },
    'crane-loss': { label: 'Record access constraint', detail: 'Re-sequence affected activities' },
    'inspection-failure': { label: 'Record inspection rejection', detail: 'Open gate correction and evidence tasks' },
    'weather-disruption': { label: 'Log weather disruption', detail: 'Assess entitlement and float impact' },
    'recovery-approved': { label: 'Approve recovery action', detail: 'Restore float and confidence' },
  };
  return copy[type];
}

const guidedUpdateTypes: ProjectEventType[] = [
  'facade-delay',
  'variation-submitted',
  'evidence-rejected',
  'missing-approval',
  'contractor-underperformance',
  'recovery-approved',
];

function projectUpdateOwner(type: ProjectEventType) {
  const owners: Partial<Record<ProjectEventType, string>> = {
    'facade-delay': 'Procurement Lead',
    'variation-submitted': 'Commercial Manager',
    'evidence-rejected': 'QA / Evidence Lead',
    'missing-approval': 'Authority Coordinator',
    'contractor-underperformance': 'Project Director',
    'crane-loss': 'Planning Manager',
    'inspection-failure': 'Inspection Lead',
    'weather-disruption': 'Construction Manager',
    'recovery-approved': 'Project Controls Lead',
  };
  return owners[type] ?? 'Project Controls Lead';
}

function projectUpdateDeadline(type: ProjectEventType) {
  if (type === 'recovery-approved') return 'Monitor next 24h';
  if (type === 'variation-submitted') return 'Decision by tomorrow';
  if (type === 'missing-approval' || type === 'evidence-rejected' || type === 'inspection-failure') return 'Resolve today';
  return 'Owner response today';
}

function projectUpdateRoute(type: ProjectEventType): ProjectCommandScreen {
  if (type === 'variation-submitted') return 'cost';
  if (type === 'missing-approval' || type === 'evidence-rejected' || type === 'inspection-failure') return 'evidence';
  if (type === 'contractor-underperformance') return 'risk';
  if (type === 'recovery-approved') return 'forecast';
  return 'programme';
}

function projectUpdateImpactRows(type: ProjectEventType) {
  const preview = getProjectEventPreview(type);
  const impact = preview.impacts;
  return [
    { label: 'Health', value: formatSignedNumber(impact.healthDelta), detail: 'Project health movement' },
    { label: 'Schedule', value: impact.delayDays ? formatSignedNumber(impact.delayDays, 'd') : formatSignedNumber(impact.floatDelta, 'd'), detail: impact.floatDelta ? `Float ${formatSignedNumber(impact.floatDelta, 'd')}` : 'No float change' },
    { label: 'Cost', value: formatSignedCurrency(impact.eacDelta), detail: 'EAC movement' },
    { label: 'Risk', value: formatRiskDelta(impact.riskDelta), detail: 'Exposure movement' },
    { label: 'Evidence', value: formatSignedNumber(impact.evidenceChange, ' pts'), detail: impact.gateStatusChange ?? 'Evidence readiness' },
    { label: 'Vendor', value: impact.vendorScoreDelta ? formatSignedNumber(impact.vendorScoreDelta, ' pts') : 'No change', detail: preview.affectedModule },
  ];
}

function LiveUpdatePanel({
  context,
  ledgerSource,
  ledgerStatus,
  onSimulate,
  onReset,
  isUpdateDrawerOpen,
  onOpenUpdateDrawer,
  onCloseUpdateDrawer,
}: {
  context: ProjectControlContext;
  ledgerSource: string;
  ledgerStatus: string;
  onSimulate: (type?: ProjectEventType) => void;
  onReset: () => void;
  isUpdateDrawerOpen: boolean;
  onOpenUpdateDrawer: () => void;
  onCloseUpdateDrawer: () => void;
}) {
  const latest = latestLiveEvent(context);
  const [selectedType, setSelectedType] = useState<ProjectEventType>('facade-delay');
  const selectedPreview = getProjectEventPreview(selectedType);
  const selectedRows = projectUpdateImpactRows(selectedType);
  const latestLabel = latest?.title ?? 'No live update logged yet';
  const primaryMetric = latest
    ? `${context.metrics.healthScore}/100 health after ${latest.affectedModule}`
    : `${context.metrics.healthScore}/100 health at baseline`;
  const recoveryAction = selectedPreview.cta;

  const commitSelectedUpdate = () => {
    onSimulate(selectedType);
    onCloseUpdateDrawer();
  };

  return (
    <>
      <section id="project-control-action-centre" className="scroll-mt-4 rounded-xl border border-[#2E7FFF]/18 bg-[rgba(17,32,64,0.78)] p-3">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-stretch">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#7EB8F7]">
                  <Zap size={13} />
                  Control update
                </div>
                <h3 className="mt-1 text-[16px] font-black leading-6 text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Log a change, check impact, assign recovery.
                </h3>
              </div>
              <span className="rounded-full border border-[#7C3AED]/24 bg-[#7C3AED]/12 px-2.5 py-1 text-[9px] font-black uppercase text-[#DDD6FE]">
                Demo safe
              </span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {guidedUpdateTypes.slice(0, 3).map(type => {
                const copy = controlSignalCopy(type);
                const preview = getProjectEventPreview(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setSelectedType(type);
                      onOpenUpdateDrawer();
                    }}
                    className="rounded-lg border border-[#2E7FFF]/14 bg-[#07111F]/72 px-3 py-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-[#7C3AED]/42 hover:bg-[#7C3AED]/12"
                  >
                    <span className="block text-[11px] font-black text-[#EEF3FA]">{copy.label}</span>
                    <span className="mt-1 line-clamp-1 block text-[9px] leading-4 text-[#8EA7C7]">{preview.impactLabel}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {[
                ['Health', `${context.metrics.healthScore}/100`],
                ['Float', `${context.metrics.floatRemaining}d`],
                ['Risk exposure', formatProjectCurrency(context.metrics.riskExposure)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[rgba(46,127,255,0.12)] bg-[#07111F]/58 px-3 py-2">
                  <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">{label}</p>
                  <p className="mt-0.5 text-[13px] font-black text-[#EEF3FA]">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 grid gap-2 lg:grid-cols-[minmax(0,1fr)_260px]">
              <div className="rounded-lg border border-cyan-300/14 bg-cyan-300/8 px-3 py-2.5">
                <p className="text-[8px] font-black uppercase tracking-[0.14em] text-cyan-100">Selected update</p>
                <h4 className="mt-1 line-clamp-1 text-[13px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{selectedPreview.title}</h4>
                <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-[#B8C7DB]">{selectedPreview.description}</p>
              </div>
              <div className="rounded-lg border border-[#7C3AED]/18 bg-[#7C3AED]/10 px-3 py-2.5">
                <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#C4B5FD]">Recovery path</p>
                <p className="mt-1 line-clamp-2 text-[11px] font-black leading-4 text-[#EEF3FA]">{recoveryAction}</p>
                <p className="mt-1 text-[9px] font-bold text-[#9CB1CC]">{projectUpdateOwner(selectedType)} / {projectUpdateDeadline(selectedType)}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#07111F]/78 p-3">
            <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">Latest project position</p>
            <p className="mt-1 line-clamp-2 text-[12px] font-black leading-5 text-[#DCE8F8]">{latestLabel}</p>
            <p className="mt-2 text-[10px] font-bold text-[#8EA7C7]">{primaryMetric}</p>
            <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.12em] text-[#A78BFA]">Ledger: {ledgerStatus} / {ledgerSource}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onOpenUpdateDrawer}
                className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#7C3AED] px-3 text-[10px] font-black text-white shadow-[0_0_18px_rgba(124,58,237,0.22)] transition-colors hover:bg-[#6D28D9]"
              >
                <Play size={12} />
                Add Update
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedType('facade-delay');
                  onReset();
                }}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[rgba(46,127,255,0.18)] bg-[#07111F] px-3 text-[10px] font-black text-[#DCE8F8] transition-colors hover:bg-white/5"
              >
                <RefreshCw size={12} />
                Reset
              </button>
            </div>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {isUpdateDrawerOpen && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm md:pl-[76px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Add project update"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="custom-scrollbar max-h-[calc(100vh-48px)] w-full max-w-5xl overflow-y-auto rounded-2xl border border-[#2E7FFF]/24 bg-[#081525] shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
            >
              <div className="sticky top-0 z-10 border-b border-[#2E7FFF]/18 bg-[#112040]/95 p-4 backdrop-blur">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#C4B5FD]">
                      <Zap size={13} />
                      Project update intake
                    </div>
                    <h3 className="mt-1 text-[22px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>What changed on site?</h3>
                    <p className="mt-1 text-[12px] leading-5 text-[#9CB1CC]">Pick one condition. ProjectCommand previews the consequence before it updates the live twin.</p>
                  </div>
                  <button
                    type="button"
                    onClick={onCloseUpdateDrawer}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#07111F] text-[#AFC2DC] hover:bg-white/5"
                    aria-label="Close project update intake"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <div className="space-y-2">
                  {guidedUpdateTypes.map(type => {
                    const copy = controlSignalCopy(type);
                    const preview = getProjectEventPreview(type);
                    const selected = selectedType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setSelectedType(type)}
                        aria-pressed={selected}
                        className={`w-full rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 ${
                          selected
                            ? 'border-[#7C3AED]/60 bg-[#7C3AED]/22 shadow-[0_0_22px_rgba(124,58,237,0.20)]'
                            : 'border-[#2E7FFF]/14 bg-[#07111F]/78 hover:border-[#7C3AED]/32 hover:bg-[#7C3AED]/10'
                        }`}
                      >
                        <span className="flex items-start justify-between gap-3">
                          <span>
                            <span className="block text-[12px] font-black text-[#EEF3FA]">{copy.label}</span>
                            <span className="mt-1 block text-[10px] leading-4 text-[#8EA7C7]">{copy.detail}</span>
                          </span>
                          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[8px] font-black uppercase ${severityClass[preview.severity]}`}>
                            {preview.severity}
                          </span>
                        </span>
                        <span className="mt-2 block rounded-lg border border-[rgba(46,127,255,0.12)] bg-[#0A1628] px-2.5 py-2 text-[10px] font-bold leading-4 text-[#C8D8EE]">
                          {preview.impactLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl border border-cyan-300/18 bg-cyan-300/8 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-cyan-100">Impact preview</p>
                        <h4 className="mt-1 text-[16px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{selectedPreview.title}</h4>
                        <p className="mt-1 text-[11px] leading-5 text-[#B8C7DB]">{selectedPreview.description}</p>
                      </div>
                      <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase ${severityClass[selectedPreview.severity]}`}>
                        {selectedPreview.affectedModule}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {selectedRows.map(row => (
                        <div key={row.label} className="rounded-lg border border-[rgba(46,127,255,0.12)] bg-[#07111F]/72 px-3 py-2">
                          <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">{row.label}</p>
                          <p className="mt-1 text-[13px] font-black text-[#EEF3FA]">{row.value}</p>
                          <p className="mt-0.5 line-clamp-1 text-[9px] text-[#8EA7C7]">{row.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#7C3AED]/20 bg-[#7C3AED]/10 p-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#C4B5FD]">Manager action plan</p>
                    <h4 className="mt-1 text-[15px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{recoveryAction}</h4>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      {[
                        ['Owner', projectUpdateOwner(selectedType)],
                        ['Deadline', projectUpdateDeadline(selectedType)],
                        ['Where it opens', projectUpdateRoute(selectedType)],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-lg border border-white/8 bg-[#07111F]/72 px-3 py-2">
                          <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">{label}</p>
                          <p className="mt-1 text-[11px] font-black text-[#DCE8F8]">{value}</p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-[11px] leading-5 text-[#C8D8EE]">
                      Once logged, the event appears in Today's Progress, updates the KPI cards, refreshes blockers, and refreshes the action workbench.
                    </p>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-[#2E7FFF]/18 bg-[#081525]/95 p-4 backdrop-blur">
                <p className="text-[10px] font-bold text-[#8EA7C7]">
                  This is demo-safe: it logs a local project-control event and does not send external notices.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onCloseUpdateDrawer}
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-[rgba(46,127,255,0.18)] bg-[#07111F] px-4 text-[11px] font-black text-[#DCE8F8] hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={commitSelectedUpdate}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#7C3AED] px-4 text-[11px] font-black text-white shadow-[0_0_22px_rgba(124,58,237,0.26)] transition-colors hover:bg-[#6D28D9]"
                  >
                    <Play size={13} />
                    Log Update and Refresh Actions
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

type ProjectBlocker = {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  owner: string;
  due: string;
  linkedObject: string;
  impact: string;
  ifIgnored: string;
  ifResolved: string;
  actionLabel: string;
  screen: ProjectCommandScreen;
};

function blockerOwner(title: string, linkedObject: string) {
  const value = `${title} ${linkedObject}`.toLowerCase();
  if (value.includes('facade') || value.includes('vendor') || value.includes('procurement')) return 'Procurement Lead';
  if (value.includes('variation') || value.includes('cost')) return 'Commercial Manager';
  if (value.includes('approval') || value.includes('authority') || value.includes('commissioning')) return 'Authority Coordinator';
  if (value.includes('evidence') || value.includes('inspection') || value.includes('fire') || value.includes('lift')) return 'QA / Evidence Lead';
  return 'Project Controls Lead';
}

function blockerScreen(title: string): ProjectCommandScreen {
  const value = title.toLowerCase();
  if (value.includes('variation') || value.includes('cost')) return 'cost';
  if (value.includes('evidence') || value.includes('approval') || value.includes('inspection')) return 'evidence';
  if (value.includes('vendor') || value.includes('risk')) return 'risk';
  return 'stagegates';
}

function buildBlockerWorklist(context: ProjectControlContext): ProjectBlocker[] {
  const fromExceptions = context.controlExceptions.slice(0, 5).map(exception => ({
    id: exception.id,
    title: exception.title,
    severity: exception.severity,
    owner: blockerOwner(exception.title, exception.linkedObject),
    due: exception.severity === 'critical' ? 'Today' : 'Next 24h',
    linkedObject: exception.linkedObject,
    impact: exception.impact,
    ifIgnored: exception.impactMetric
      ? `${exception.impactMetric} keeps deteriorating and handover confidence can drop.`
      : 'Handover readiness remains exposed until the owner closes the blocker.',
    ifResolved: exception.cta.toLowerCase().includes('evidence')
      ? 'Gate evidence can move back into review and audit readiness improves.'
      : 'Forecast exposure reduces and the next stage-gate review can proceed.',
    actionLabel: exception.cta,
    screen: blockerScreen(exception.title),
  }));

  if (fromExceptions.length > 0) return fromExceptions;

  return [
    {
      id: 'baseline-facade',
      title: 'Facade Release watch item',
      severity: 'medium',
      owner: 'Procurement Lead',
      due: 'This week',
      linkedObject: 'Facade Release gate',
      impact: 'Envelope release protects fit-out start and MEP coordination flow.',
      ifIgnored: 'Facade long-lead decisions can compress the critical path and reduce handover confidence.',
      ifResolved: 'Locks procurement path early and protects the Q3 envelope window.',
      actionLabel: 'Review procurement path',
      screen: 'programme',
    },
    {
      id: 'baseline-approval',
      title: 'Authority approval pathway',
      severity: 'medium',
      owner: 'Authority Coordinator',
      due: 'This week',
      linkedObject: 'Commissioning Ready gate',
      impact: 'Approvals must be mapped before commissioning readiness is claimed.',
      ifIgnored: 'Commissioning and handover gate proof can become a late blocker.',
      ifResolved: 'Approval owners and evidence due dates become clear before the gate review.',
      actionLabel: 'Confirm approval path',
      screen: 'obligations',
    },
    {
      id: 'baseline-evidence',
      title: 'Handover evidence pack',
      severity: 'low',
      owner: 'QA / Evidence Lead',
      due: 'Next 7d',
      linkedObject: 'Handover & Snagging',
      impact: `${context.metrics.evidenceCompleteness}% evidence readiness needs continuous closeout.`,
      ifIgnored: 'Evidence gaps can slow audit review and resident handover readiness.',
      ifResolved: 'Evidence readiness improves and the handover confidence model has better source coverage.',
      actionLabel: 'Open evidence worklist',
      screen: 'evidence',
    },
  ];
}

function ActionableBlockerWorklist({
  context,
  goTo,
  onPrepareAction,
}: {
  context: ProjectControlContext;
  goTo: (screen: ProjectCommandScreen) => void;
  onPrepareAction: (action: ManagerAction) => void;
}) {
  const blockers = buildBlockerWorklist(context);
  const [activeBlockerId, setActiveBlockerId] = useState(blockers[0]?.id ?? 'baseline-facade');
  const activeBlocker = blockers.find(blocker => blocker.id === activeBlockerId) ?? blockers[0];
  const topDecision = context.managerActions[0];

  return (
    <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-2.5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100">
            <FileWarning size={13} />
            Blocker Worklist
          </div>
          <h3 className="mt-0.5 text-[14px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Own the next blocker</h3>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase ${context.controlExceptions.length > 0 ? 'border-amber-300/25 bg-amber-300/10 text-amber-100' : 'border-emerald-300/22 bg-emerald-300/10 text-emerald-100'}`}>
          {context.controlExceptions.length > 0 ? `${context.controlExceptions.length} open` : 'watchlist'}
        </span>
      </div>

      <div className="mt-2.5 space-y-1.5">
        {blockers.map(blocker => (
          <button
            key={blocker.id}
            type="button"
            onClick={() => setActiveBlockerId(blocker.id)}
            aria-pressed={activeBlocker?.id === blocker.id}
            className={`w-full rounded-lg border px-3 py-1.5 text-left transition-colors ${
              activeBlocker?.id === blocker.id
                ? 'border-cyan-300/35 bg-cyan-300/12 shadow-[0_0_18px_rgba(0,198,255,0.12)]'
                : 'border-[rgba(46,127,255,0.12)] bg-[#07111F]/70 hover:border-cyan-300/24 hover:bg-cyan-300/8'
            }`}
          >
            <span className="flex items-start justify-between gap-2">
              <span className="min-w-0">
                <span className="line-clamp-1 block text-[11px] font-black text-[#EEF3FA]">{blocker.title}</span>
                <span className="mt-1 line-clamp-1 block text-[9px] font-bold text-[#8EA7C7]">{blocker.owner} / {blocker.due}</span>
              </span>
              <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[8px] font-black uppercase ${severityClass[blocker.severity]}`}>
                {blocker.severity}
              </span>
            </span>
          </button>
        ))}
      </div>

      {activeBlocker && (
        <div className="mt-2.5 rounded-xl border border-cyan-300/16 bg-[#07111F]/82 p-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[8px] font-black uppercase tracking-[0.14em] text-cyan-100">Selected</p>
              <h4 className="mt-0.5 line-clamp-1 text-[13px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{activeBlocker.title}</h4>
            </div>
            <span className="shrink-0 rounded-full border border-[#2E7FFF]/18 bg-[#2E7FFF]/10 px-2 py-0.5 text-[8px] font-black uppercase text-[#BFDBFE]">
              {activeBlocker.linkedObject}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-full border border-white/8 bg-white/[0.03] px-2 py-1 text-[9px] font-bold text-[#DCE8F8]">Owner: {activeBlocker.owner}</span>
            <span className="rounded-full border border-white/8 bg-white/[0.03] px-2 py-1 text-[9px] font-bold text-[#DCE8F8]">Due: {activeBlocker.due}</span>
          </div>
          <div className="mt-2 grid gap-1.5">
            <p className="line-clamp-2 rounded-lg border border-red-300/14 bg-red-400/8 px-2.5 py-1.5 text-[10px] leading-4 text-[#FECACA]">
              <span className="font-black uppercase text-red-100">Risk:</span> {activeBlocker.ifIgnored}
            </p>
            <p className="line-clamp-2 rounded-lg border border-emerald-300/14 bg-emerald-300/8 px-2.5 py-1.5 text-[10px] leading-4 text-emerald-100">
              <span className="font-black uppercase">Close:</span> {activeBlocker.ifResolved}
            </p>
          </div>
        </div>
      )}

      <div className="mt-2.5 grid grid-cols-2 gap-2">
        {topDecision && (
          <button
            type="button"
            onClick={() => onPrepareAction(topDecision)}
            className="inline-flex h-8 min-w-0 items-center justify-center gap-1.5 rounded-lg bg-[#7C3AED] px-2 text-[9px] font-black text-white shadow-[0_0_18px_rgba(124,58,237,0.24)] hover:bg-[#6D28D9]"
          >
            Workbench
            <ArrowRight size={12} />
          </button>
        )}
        <button
          type="button"
          onClick={() => activeBlocker && goTo(activeBlocker.screen)}
          className="inline-flex h-8 min-w-0 items-center justify-center gap-1.5 rounded-lg border border-[#2E7FFF]/24 bg-[#2E7FFF]/12 px-2 text-[9px] font-black text-blue-100 hover:bg-[#2E7FFF]/20"
        >
          {activeBlocker ? activeBlocker.actionLabel.replace('Review ', '') : 'Open worklist'}
          <ArrowRight size={12} />
        </button>
      </div>
    </section>
  );
}

type ReadinessFocus =
  | 'evidence'
  | 'gates'
  | 'approvals'
  | 'risks'
  | 'decision';

function SourceConfidenceCard({
  context,
  goTo,
  onPrepareAction,
}: {
  context: ProjectControlContext;
  goTo: (screen: ProjectCommandScreen) => void;
  onPrepareAction: (action: ManagerAction) => void;
}) {
  const [activeAction, setActiveAction] = useState<ReadinessFocus>('evidence');
  const requiredEvidence = context.baseline.evidenceRequirements.length;
  const evidenceGaps = context.evidenceSummary.filter(item => item.status !== 'Complete');
  const completeEvidence = requiredEvidence - evidenceGaps.length;
  const gateWatch = context.stageGateSummary.filter(gate => gate.status !== 'on-track');
  const approvalItems = context.evidenceSummary.filter(item => /approval|sign-off|certificate/i.test(`${item.title} ${item.gate}`) && item.status !== 'Complete');
  const riskItems = context.controlExceptions.slice(0, 4);
  const topDecision = context.managerActions[0];
  const focusRows = [
    {
      id: 'evidence' as ReadinessFocus,
      label: 'Evidence pack',
      value: evidenceGaps.length > 0 ? `${evidenceGaps.length} items need proof` : 'Evidence pack clear',
      detail: `${completeEvidence}/${requiredEvidence} complete. Show exactly what is missing and who should close it.`,
      screen: 'evidence' as ProjectCommandScreen,
    },
    {
      id: 'gates' as ReadinessFocus,
      label: 'Stage gates',
      value: gateWatch.length > 0 ? `${gateWatch.length} gates need attention` : 'No blocked gates',
      detail: 'Focus on gates that can block commissioning, handover, or authority readiness.',
      screen: 'stagegates' as ProjectCommandScreen,
    },
    {
      id: 'approvals' as ReadinessFocus,
      label: 'Approvals',
      value: approvalItems.length > 0 ? `${approvalItems.length} approvals to confirm` : 'Approval path clear',
      detail: 'Authority, fire, lift, and commissioning proof that needs owner follow-up.',
      screen: 'obligations' as ProjectCommandScreen,
    },
    {
      id: 'risks' as ReadinessFocus,
      label: 'Risks and cost',
      value: `${context.controlExceptions.length} exceptions open`,
      detail: `Risk exposure is ${formatProjectCurrency(context.metrics.riskExposure)} and EAC is ${formatProjectCurrency(context.metrics.eac)}.`,
      screen: 'risk' as ProjectCommandScreen,
    },
    {
      id: 'decision' as ReadinessFocus,
      label: 'Next decision',
      value: topDecision ? topDecision.title : 'No action ready yet',
      detail: topDecision ? topDecision.expectedImpact : 'Log a project update to generate a manager action.',
      screen: 'forecast' as ProjectCommandScreen,
    },
  ];
  const activeRow = focusRows.find(row => row.id === activeAction) ?? focusRows[0];
  const goToActive = () => {
    if (activeAction === 'decision' && topDecision) {
      onPrepareAction(topDecision);
      return;
    }
    goTo(activeRow.screen);
  };

  return (
    <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100">
            <FileWarning size={13} />
            Readiness and Blockers
          </div>
          <h3 className="mt-1 text-[15px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>What can block handover?</h3>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase ${context.controlExceptions.length > 0 ? 'border-amber-300/25 bg-amber-300/10 text-amber-100' : 'border-emerald-300/22 bg-emerald-300/10 text-emerald-100'}`}>
          {context.controlExceptions.length > 0 ? `${context.controlExceptions.length} open` : 'clear'}
        </span>
      </div>
      <div className="mt-3 grid gap-2">
        {focusRows.map(row => (
          <button
            key={row.id}
            type="button"
            onClick={() => setActiveAction(row.id)}
            aria-pressed={activeAction === row.id}
            className={`rounded-lg border px-3 py-2 text-left transition-all hover:-translate-y-0.5 ${
              activeAction === row.id
                ? 'border-cyan-300/35 bg-cyan-300/12 shadow-[0_0_18px_rgba(0,198,255,0.12)]'
                : 'border-[rgba(46,127,255,0.12)] bg-[#07111F]/70 hover:border-cyan-300/24 hover:bg-cyan-300/8'
            }`}
          >
            <span className="flex items-start justify-between gap-2">
              <span>
                <span className="block text-[8px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">{row.label}</span>
                <span className="mt-1 line-clamp-1 block text-[11px] font-bold text-[#DCE8F8]">{row.value}</span>
              </span>
              <ArrowRight size={12} className={activeAction === row.id ? 'text-cyan-100' : 'text-[#5A6E88]'} />
            </span>
            <span className="mt-1 line-clamp-2 block text-[9px] leading-4 text-[#8EA7C7]">{row.detail}</span>
          </button>
        ))}
      </div>

      <div className="mt-3 rounded-xl border border-cyan-300/16 bg-[#07111F]/82 p-3">
        {activeAction === 'evidence' && (
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-cyan-100">Evidence worklist</p>
                <p className="mt-1 text-[11px] font-bold text-[#DCE8F8]">{evidenceGaps.length} items still need accepted proof.</p>
              </div>
              <button
                type="button"
                onClick={() => goTo('evidence')}
                className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-[#2E7FFF]/24 bg-[#2E7FFF]/12 px-2.5 text-[9px] font-black text-blue-100 hover:bg-[#2E7FFF]/20"
              >
                Open Evidence
                <ArrowRight size={11} />
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {evidenceGaps.slice(0, 4).map(item => (
                <div key={`${item.title}-${item.gate}`} className="flex items-start justify-between gap-2 rounded-lg border border-white/8 bg-white/[0.03] px-2.5 py-2">
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-[10px] font-black text-[#EEF3FA]">{item.title}</p>
                    <p className="mt-0.5 line-clamp-1 text-[9px] text-[#8EA7C7]">{item.gate}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[8px] font-black ${
                    item.status === 'Rejected'
                      ? 'border-red-300/25 bg-red-400/10 text-red-100'
                      : 'border-amber-300/25 bg-amber-300/10 text-amber-100'
                  }`}>{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeAction === 'gates' && (
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-cyan-100">Gate readiness</p>
                <p className="mt-1 text-[11px] font-bold text-[#DCE8F8]">{gateWatch.length} gates are watch, at-risk, or critical.</p>
              </div>
              <button
                type="button"
                onClick={() => goTo('stagegates')}
                className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-[#2E7FFF]/24 bg-[#2E7FFF]/12 px-2.5 text-[9px] font-black text-blue-100 hover:bg-[#2E7FFF]/20"
              >
                Open Gates
                <ArrowRight size={11} />
              </button>
            </div>
            <div className="mt-2 space-y-1.5">
              {gateWatch.slice(0, 4).map(gate => (
                <div key={gate.name} className="flex items-start justify-between gap-2 rounded-lg border border-white/8 bg-white/[0.03] px-2.5 py-2">
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-[10px] font-black text-[#EEF3FA]">{gate.name}</p>
                    <p className="mt-0.5 line-clamp-1 text-[9px] text-[#8EA7C7]">{gate.reason}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[8px] font-black uppercase ${statusClass(gate.status)}`}>{projectStatusLabel(gate.status)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeAction === 'approvals' && (
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-cyan-100">Approval path</p>
            <p className="mt-1 text-[11px] leading-4 text-[#C8D8EE]">Authority and statutory evidence should have named owners before commissioning readiness is claimed.</p>
            <div className="mt-2 space-y-1.5">
              {(approvalItems.length > 0 ? approvalItems : context.evidenceSummary.slice(0, 3)).slice(0, 4).map(item => (
                <div key={`${item.title}-${item.gate}`} className="rounded-lg border border-white/8 bg-white/[0.03] px-2.5 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[10px] font-black text-[#EEF3FA]">{item.title}</p>
                    <span className="shrink-0 rounded-full border border-[#2E7FFF]/20 bg-[#2E7FFF]/10 px-2 py-0.5 text-[8px] font-black text-blue-100">Owner needed</span>
                  </div>
                  <p className="mt-0.5 text-[9px] text-[#8EA7C7]">{item.gate}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeAction === 'risks' && (
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-cyan-100">Risk and cost blockers</p>
            <div className="mt-2 space-y-1.5">
              {(riskItems.length > 0 ? riskItems : [{
                id: 'baseline-risk',
                title: context.topThreat,
                severity: 'medium' as const,
                linkedObject: 'Baseline risk model',
                impact: `Current risk exposure is ${formatProjectCurrency(context.metrics.riskExposure)}.`,
                cta: 'Review risk',
              }]).map(item => (
                <div key={item.id} className="rounded-lg border border-white/8 bg-white/[0.03] px-2.5 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[10px] font-black text-[#EEF3FA]">{item.title}</p>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[8px] font-black uppercase ${severityClass[item.severity]}`}>{item.severity}</span>
                  </div>
                  <p className="mt-1 text-[9px] leading-4 text-[#8EA7C7]">{item.impact}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeAction === 'decision' && (
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-cyan-100">Manager decision</p>
            {topDecision ? (
              <>
                <p className="mt-1 text-[12px] font-black text-[#EEF3FA]">{topDecision.title}</p>
                <p className="mt-1 text-[11px] leading-4 text-[#C8D8EE]">{topDecision.whyItMatters}</p>
                <div className="mt-2 rounded-lg border border-white/8 bg-white/[0.03] px-2.5 py-2 text-[10px] leading-4 text-[#8EA7C7]">
                  <strong className="text-[#DCE8F8]">Impact:</strong> {topDecision.expectedImpact}<br />
                  <strong className="text-[#DCE8F8]">Cost:</strong> {topDecision.costImplication}
                </div>
                <button
                  type="button"
                  onClick={() => onPrepareAction(topDecision)}
                  className="mt-2 inline-flex h-8 items-center gap-1 rounded-lg bg-[#7C3AED] px-2.5 text-[9px] font-black text-white hover:bg-[#6D28D9]"
                >
                  Create Decision Action
                  <ArrowRight size={11} />
                </button>
              </>
            ) : (
              <p className="mt-1 text-[11px] leading-4 text-[#C8D8EE]">No decision action is currently available.</p>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={goToActive}
        className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-[#2E7FFF]/24 bg-[#2E7FFF]/12 px-3 text-[10px] font-black text-blue-100 hover:bg-[#2E7FFF]/20"
      >
        {activeAction === 'decision' ? (topDecision ? managerActionButtonLabel(topDecision) : 'Review decisions') : `Open ${activeRow.label}`}
        <ArrowRight size={12} />
      </button>
    </section>
  );
}

function actionArtifact(action: ManagerAction, context: ProjectControlContext) {
  const lower = `${action.title} ${action.cta}`.toLowerCase();
  if (lower.includes('facade') || lower.includes('procurement')) {
    return {
      type: 'Procurement release brief',
      audience: 'Procurement Lead, Commercial Manager, Project Director',
      subject: 'Facade long-lead procurement release for manager approval',
      content: `Approve release of facade long-lead procurement for ${context.baseline.property.name}. Current forecast shows ${context.metrics.floatRemaining}d float and ${formatProjectCurrency(context.metrics.riskExposure)} risk exposure. Decision protects envelope closure and fit-out start.`,
      packages: ['Facade', 'Fit-out', 'MEP coordination', 'Handover readiness'],
    };
  }
  if (lower.includes('evidence') || lower.includes('approval') || lower.includes('gate')) {
    return {
      type: 'Evidence correction request',
      audience: 'Authority Coordinator, QA Lead, Consultant',
      subject: 'Correct evidence and approval path for blocked stage gate',
      content: `Request corrected evidence pack for ${context.baseline.project.name}. Evidence readiness is ${context.metrics.evidenceCompleteness}% and handover confidence is ${context.metrics.handoverConfidence}%. Confirm owner, submission date, and acceptance proof.`,
      packages: ['Approvals', 'Evidence', 'Commissioning', 'Handover'],
    };
  }
  if (lower.includes('variation') || lower.includes('cost')) {
    return {
      type: 'Commercial approval brief',
      audience: 'Commercial Manager, Project Director, Finance',
      subject: 'Variation impact review and EAC decision',
      content: `Review pending variation exposure against the current EAC of ${formatProjectCurrency(context.metrics.eac)}. Confirm approval, rejection, or negotiation path before the cost forecast drifts.`,
      packages: ['Cost', 'Variations', 'Programme', 'Risk'],
    };
  }
  return {
    type: 'Recovery action brief',
    audience: `${managerActionOwner(action)}, Project Controls Lead`,
    subject: action.title,
    content: `${action.whyItMatters} Expected impact: ${action.expectedImpact}. Cost implication: ${action.costImplication}.`,
    packages: ['Programme', 'Risk', 'Workforce', 'Forecast'],
  };
}

function ActionWorkbench({
  context,
  action,
  status,
  activity,
  onClose,
  onPrepareBrief,
  onAssignOwner,
  onApproveRecovery,
  onOpenVendorIQ,
}: {
  context: ProjectControlContext;
  action: ManagerAction;
  status: string;
  activity: string[];
  onClose: () => void;
  onPrepareBrief: () => void;
  onAssignOwner: () => void;
  onApproveRecovery: () => void;
  onOpenVendorIQ?: () => void;
}) {
  const artifact = actionArtifact(action, context);
  const owner = managerActionOwner(action);
  const due = managerActionDue(action);
  const lower = `${action.title} ${action.cta}`.toLowerCase();
  const canOpenVendor = (lower.includes('vendor') || lower.includes('procurement') || lower.includes('facade') || lower.includes('long-lead')) && Boolean(onOpenVendorIQ);
  const briefText = [
    artifact.subject,
    `Owner: ${owner}`,
    `Due: ${due}`,
    `Audience: ${artifact.audience}`,
    `Expected recovery: ${action.expectedImpact}`,
    `Cost note: ${action.costImplication}`,
    '',
    artifact.content,
  ].join('\n');

  const prepareBrief = () => {
    navigator.clipboard?.writeText(briefText).catch(() => undefined);
    onPrepareBrief();
  };

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/62 p-4 backdrop-blur-sm md:pl-[76px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Action workbench"
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        className="custom-scrollbar max-h-[calc(100vh-48px)] w-full max-w-5xl overflow-y-auto rounded-2xl border border-[#2E7FFF]/24 bg-[#081525] shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#2E7FFF]/18 bg-[#112040]/95 p-4 backdrop-blur">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#C4B5FD]">
              <Target size={13} />
              Action workbench
            </div>
            <h3 className="mt-1 text-[22px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{action.title}</h3>
            <p className="mt-1 text-[12px] leading-5 text-[#9CB1CC]">Turn the AI recommendation into a manager-ready response without pretending anything was sent externally.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#07111F] text-[#AFC2DC] hover:bg-white/5"
            aria-label="Close action workbench"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4 p-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-3">
            <div className="rounded-xl border border-[#7C3AED]/22 bg-[#7C3AED]/10 p-3">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#C4B5FD]">Why this action</p>
              <p className="mt-1 text-[12px] font-bold leading-5 text-[#EDE9FE]">{action.whyItMatters}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                ['Owner', owner],
                ['Due', due],
                ['Status', status],
                ['Linked event', action.triggerLabel],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#07111F]/78 p-3">
                  <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">{label}</p>
                  <p className="mt-1 line-clamp-2 text-[11px] font-black text-[#DCE8F8]">{value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-emerald-300/18 bg-emerald-300/8 p-3">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-emerald-100">Expected recovery</p>
              <p className="mt-1 text-[12px] font-black text-[#DDFBEA]">{action.expectedImpact}</p>
              <p className="mt-1 text-[10px] leading-4 text-emerald-100">{action.costImplication}</p>
            </div>
            <div className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#07111F]/78 p-3">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">Affected work packages</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {artifact.packages.map(item => (
                  <span key={item} className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[9px] font-bold text-[#AFC2DC]">{item}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-cyan-300/16 bg-cyan-300/8 p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-cyan-100">{artifact.type}</p>
                  <h4 className="mt-1 text-[15px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{artifact.subject}</h4>
                </div>
                <span className="rounded-full border border-cyan-300/22 bg-cyan-300/10 px-2.5 py-1 text-[9px] font-black text-cyan-100">Draft prepared</span>
              </div>
              <div className="mt-3 rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#07111F]/78 p-3">
                <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">Audience</p>
                <p className="mt-1 text-[11px] font-bold text-[#DCE8F8]">{artifact.audience}</p>
                <p className="mt-3 text-[8px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">Prepared note</p>
                <p className="mt-1 text-[11px] leading-5 text-[#C8D8EE]">{artifact.content}</p>
              </div>
            </div>

            <div className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#07111F]/78 p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-cyan-100">Manager response controls</p>
                  <p className="mt-1 text-[10px] leading-4 text-[#8EA7C7]">Use these to prepare the brief, confirm ownership, and update the control twin.</p>
                </div>
                <span className="rounded-full border border-emerald-300/22 bg-emerald-300/10 px-2.5 py-1 text-[9px] font-black text-emerald-100">
                  {status}
                </span>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={prepareBrief}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-[#2E7FFF]/24 bg-[#2E7FFF]/12 px-3 text-[10px] font-black text-blue-100 hover:bg-[#2E7FFF]/20"
                >
                  Copy manager brief
                </button>
                <button
                  type="button"
                  onClick={onAssignOwner}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-emerald-300/22 bg-emerald-300/10 px-3 text-[10px] font-black text-emerald-100 hover:bg-emerald-300/16"
                >
                  Confirm owner
                </button>
                {canOpenVendor && (
                  <button
                    type="button"
                    onClick={onOpenVendorIQ}
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-[#7C3AED]/24 bg-[#7C3AED]/12 px-3 text-[10px] font-black text-[#DDD6FE] hover:bg-[#7C3AED]/20"
                  >
                    Open VendorIQ
                  </button>
                )}
                <button
                  type="button"
                  onClick={onApproveRecovery}
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-[#7C3AED] px-3 text-[10px] font-black text-white shadow-[0_0_22px_rgba(124,58,237,0.26)] hover:bg-[#6D28D9]"
                >
                  Approve recovery in twin
                </button>
              </div>
              <div className="mt-3 rounded-xl border border-[rgba(46,127,255,0.12)] bg-[#0A1628] p-3">
                <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">Action trail</p>
                <div className="mt-2 space-y-1.5">
                  {activity.length > 0 ? activity.map(item => (
                    <div key={item} className="flex gap-2 text-[10px] leading-4 text-[#C8D8EE]">
                      <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-emerald-300" />
                      <span>{item}</span>
                    </div>
                  )) : (
                    <p className="text-[10px] leading-4 text-[#8EA7C7]">No response step has been activated yet.</p>
                  )}
                </div>
              </div>
              <p className="mt-3 text-[10px] leading-4 text-[#8EA7C7]">Demo-safe: this prepares artifacts and updates ProjectCommand state only. It does not email, call, approve spend, or dispatch teams externally.</p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ManagementSummaryCard({
  context,
  onOpenVendorIQ,
  onToast,
}: {
  context: ProjectControlContext;
  onOpenVendorIQ?: () => void;
  onToast?: ToastFn;
}) {
  const topAction = context.managerActions[0];
  const latest = context.latestEvent;
  const summaryLines = [
    `${context.baseline.property.name} - ${context.baseline.project.name}`,
    `Health ${context.healthMovement.from} -> ${context.healthMovement.to}; handover confidence ${context.metrics.handoverConfidence}%.`,
    `Forecast handover ${formatProjectDate(context.metrics.forecastHandover)}; EAC ${formatProjectCurrency(context.metrics.eac)}.`,
    `Project health: ${context.topThreat}`,
    latest ? `Latest update: ${latest.title}.` : 'Baseline note: project baseline created from imported context.',
    topAction ? `Next decision: ${topAction.title} - ${topAction.expectedImpact}.` : 'Next decision: keep the approved baseline active.',
    'Progress focus: keep float healthy, complete evidence, reduce rework, and protect handover confidence.',
  ];

  function copySummary() {
    navigator.clipboard.writeText(summaryLines.join('\n')).then(() => {
      onToast?.('Management summary copied', 'success');
    }).catch(() => {
      onToast?.('Management summary is ready, but clipboard access was blocked', 'warning');
    });
  }

  return (
    <section className="rounded-xl border border-violet-300/18 bg-[linear-gradient(135deg,rgba(124,58,237,0.12),rgba(46,127,255,0.08),rgba(7,17,31,0.88))] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-violet-100">
            <FileWarning size={13} />
            Management Summary
          </div>
          <h3 className="mt-1 text-base font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Current project position</h3>
        </div>
        <span className="rounded-full border border-emerald-300/22 bg-emerald-300/10 px-2.5 py-1 text-[9px] font-black text-emerald-100">
          Ready
        </span>
      </div>

      <div className="mt-3 grid gap-2">
        {[
          ['Position', `Health ${context.metrics.healthScore}/100; float ${context.metrics.floatRemaining}d; EAC ${formatProjectCurrency(context.metrics.eac)}.`],
          ['Baseline note', latest ? latest.title : 'Project baseline created from imported LOA / project summary.'],
          ['Progress focus', 'Keep float healthy, complete evidence, reduce rework, and protect handover confidence.'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-white/8 bg-[#07111F]/70 px-3 py-2">
            <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#A78BFA]">{label}</p>
            <p className="mt-1 text-[10px] leading-4 text-[#C8D8EE]">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copySummary}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#2E7FFF]/24 bg-[#07111F] px-3 text-[10px] font-black text-[#BFD8FF] transition-colors hover:bg-[#2E7FFF]/12"
        >
          Copy Summary
        </button>
        {onOpenVendorIQ && (
          <button
            type="button"
            onClick={onOpenVendorIQ}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#7C3AED] px-3 text-[10px] font-black text-white shadow-[0_0_18px_rgba(124,58,237,0.26)] transition-colors hover:bg-[#6D28D9]"
          >
            Review in VendorIQ
            <ArrowRight size={12} />
          </button>
        )}
      </div>
    </section>
  );
}

export function CommandCenter({
  goTo,
  onToast,
  onOpenVendorIQ,
  demoTimelineMs,
}: {
  goTo: (screen: ProjectCommandScreen) => void;
  onToast?: ToastFn;
  onOpenVendorIQ?: () => void;
  demoTimelineMs?: number;
}) {
  const dataset = useSelectedProjectCommandData();
  const { projectEventsByProjectId, eventLedgerSourceByProjectId, eventLedgerStatusByProjectId } = useProjectCommandStore();
  const events = projectEventsByProjectId[dataset.id] ?? [];
  const context = useMemo(() => buildProjectControlContext(dataset, events), [dataset, events]);
  const [selectedInsight, setSelectedInsight] = useState<{ metricName: MetricName; value: string | number } | null>(null);
  const [selectedDecisionChain, setSelectedDecisionChain] = useState<DecisionChainTarget | null>(null);
  const [selectedAction, setSelectedAction] = useState<ManagerAction | null>(null);
  const [actionWorkbenchStatus, setActionWorkbenchStatus] = useState('Draft prepared');
  const [actionWorkbenchActivity, setActionWorkbenchActivity] = useState<string[]>([]);
  const [activatedLogActions, setActivatedLogActions] = useState<Record<string, string>>({});
  const [isUpdateDrawerOpen, setIsUpdateDrawerOpen] = useState(false);
  const visibleControlMetrics = context.controlMetrics
    .filter(metric => ['CPI', 'SPI', 'Float Remaining', 'EAC'].includes(metric.label))
    .map(metric => ({ ...metric, cause: metricControlCause(metric, context) }));
  const ledgerStatus = eventLedgerStatusByProjectId[dataset.id] ?? 'local';
  const ledgerSource = eventLedgerSourceByProjectId[dataset.id] ?? 'memory';

  const recordWorkbenchActivity = (message: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setActionWorkbenchActivity(previous => [`${time} - ${message}`, ...previous].slice(0, 5));
  };

  const handleQueueAction = (action: ManagerAction) => {
    setSelectedAction(action);
    setActionWorkbenchStatus('Draft prepared');
    setActionWorkbenchActivity([
      `Draft opened from ${action.triggerLabel || 'AI recommendation'}.`,
      `${managerActionOwner(action)} is the suggested owner; due ${managerActionDue(action).toLowerCase()}.`,
    ]);
    onToast?.(`${action.title}: action workbench opened`, 'info');
  };

  const handleControlLogAction = (event: ProjectControlContext['events'][number], target: ProjectCommandScreen) => {
    const outcome = controlLogOutcome(event);
    setActivatedLogActions(previous => ({
      ...previous,
      [event.id]: outcome.label,
    }));
    onToast?.(outcome.toast, event.severity === 'positive' ? 'success' : 'info');
    setTimeout(() => goTo(target), 450);
  };

  const handleExplainEvent = (event: ProjectControlContext['events'][number]) => {
    setSelectedDecisionChain({
      kind: 'event',
      title: event.title,
      value: event.impactLabel,
      event,
    });
  };

  const handleLiveUpdate = (type?: ProjectEventType) => {
    const event = simulateProjectCommandEvent(dataset.id, type);
    setActivatedLogActions({});
    onToast?.(`${event.title}: forecast, risk, and actions recalculated`, event.severity === 'positive' ? 'success' : 'warning');
  };

  const handleResetBaseline = () => {
    resetProjectCommandEvents(dataset.id);
    setActivatedLogActions({});
    onToast?.('ProjectCommand reset to the source-backed baseline', 'info');
  };

  return (
    <div className="custom-scrollbar h-full overflow-x-hidden overflow-y-auto px-5 py-4 text-[#EEF3FA]">
      <div className="space-y-4">
        <section
          className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"
          data-demo-anchor="project-overview-control-metrics"
        >
          {visibleControlMetrics.map(metric => (
            <MetricCard
              key={`${dataset.id}-${metric.label}`}
              metric={metric}
              onExplain={() => setSelectedDecisionChain({ kind: 'metric', title: `${metric.label} decision chain`, value: metric.value, metric })}
            />
          ))}
        </section>

        <OwnerCommandSurface
          context={context}
          onPrepare={handleQueueAction}
          onAddUpdate={() => setIsUpdateDrawerOpen(true)}
          goTo={goTo}
          demoTimelineMs={demoTimelineMs}
        />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_430px] xl:items-start">
          <div className="space-y-4">
            <LiveUpdatePanel
              context={context}
              ledgerSource={ledgerSource}
              ledgerStatus={ledgerStatus}
              onSimulate={handleLiveUpdate}
              onReset={handleResetBaseline}
              isUpdateDrawerOpen={isUpdateDrawerOpen}
              onOpenUpdateDrawer={() => setIsUpdateDrawerOpen(true)}
              onCloseUpdateDrawer={() => setIsUpdateDrawerOpen(false)}
            />
            <WhatChangedToday
              context={context}
              goTo={goTo}
              activatedActions={activatedLogActions}
              onActivateEvent={handleControlLogAction}
              onExplainEvent={handleExplainEvent}
            />
            <CompactForecastSummary context={context} onOpenForecast={() => goTo('forecast')} />
            <ControlExceptions context={context} goTo={goTo} />
            <ImpactAnalysisPanel context={context} />
          </div>
          <div className="space-y-4 xl:sticky xl:top-4">
            <ActionableBlockerWorklist context={context} goTo={goTo} onPrepareAction={handleQueueAction} />
            <DecisionQueue context={context} onPrepare={handleQueueAction} />
            <ManagementSummaryCard context={context} onOpenVendorIQ={onOpenVendorIQ} onToast={onToast} />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedInsight && (
          <AIInsightPanel
            metricName={selectedInsight.metricName}
            value={selectedInsight.value}
            onClose={() => setSelectedInsight(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {selectedDecisionChain && (
          <DecisionChainDrawer
            context={context}
            target={selectedDecisionChain}
            onClose={() => setSelectedDecisionChain(null)}
            onOpenAction={(action) => {
              setSelectedDecisionChain(null);
              handleQueueAction(action);
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {selectedAction && (
          <ActionWorkbench
            context={context}
            action={selectedAction}
            status={actionWorkbenchStatus}
            activity={actionWorkbenchActivity}
            onClose={() => setSelectedAction(null)}
            onPrepareBrief={() => {
              setActionWorkbenchStatus('Brief copied');
              recordWorkbenchActivity('Manager brief copied to clipboard and ready to share.');
              onToast?.(`${selectedAction.title}: manager brief copied`, 'success');
            }}
            onAssignOwner={() => {
              const owner = managerActionOwner(selectedAction);
              setActionWorkbenchStatus(`Owner confirmed: ${owner}`);
              recordWorkbenchActivity(`${owner} confirmed as accountable owner.`);
              onToast?.(`${selectedAction.title}: owner confirmed`, 'success');
            }}
            onApproveRecovery={() => {
              setActionWorkbenchStatus('Recovery approved in twin');
              recordWorkbenchActivity('Recovery approval logged and ProjectCommand recalculated the twin.');
              handleLiveUpdate('recovery-approved');
              onToast?.(`${selectedAction.title}: recovery approved and forecast refreshed`, 'success');
            }}
            onOpenVendorIQ={onOpenVendorIQ}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
