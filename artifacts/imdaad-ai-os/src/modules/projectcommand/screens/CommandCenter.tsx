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
  Zap,
} from 'lucide-react';
import { HealthScoreGauge } from '../components/HealthScoreGauge';
import { AIInsightPanel } from '../components/AIInsightPanel';
import {
  buildProjectControlContext,
  formatProjectCurrency,
  formatProjectDate,
  formatProjectEventTime,
  projectEventOptions,
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

const demoMode = import.meta.env.VITE_PROJECTCOMMAND_DEMO_MODE !== 'false';

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

function metricDemoCause(metric: ProjectControlContext['controlMetrics'][number], context: ProjectControlContext) {
  const latest = latestLiveEvent(context);
  if (metric.label === 'CPI') {
    return latest
      ? `Cost pressure is driven by ${latest.title.toLowerCase()}. Review package exposure, variations, and recovery spend before approval.`
      : 'Cost is holding close to plan. Record a variation, procurement issue, or recovery action to show live CPI movement.';
  }
  if (metric.label === 'SPI') {
    return latest
      ? `Schedule movement is linked to ${latest.affectedModule.toLowerCase()}. Check the programme path and owner commitments.`
      : 'Schedule is still baseline-led. Record a delay or gate blocker to show the forecast recalculation.';
  }
  if (metric.label === 'Float Remaining') {
    return latest
      ? `${Math.max(0, context.metrics.floatRemaining)} days of float remain after the latest signal. Protect the critical path before handover risk widens.`
      : 'Float is available, but the demo should show what happens when a live project issue consumes it.';
  }
  if (metric.label === 'EAC') {
    return latest
      ? `Expected cost now reflects the latest event ledger. Compare recovery cost against delay, rework, and procurement exposure.`
      : 'Expected cost matches the approved baseline until a live update changes risk, variation, or procurement assumptions.';
  }
  return metric.cause;
}

function managerActionButtonLabel(action: ManagerAction) {
  const value = `${action.title} ${action.whyItMatters} ${action.cta}`.toLowerCase();
  if (value.includes('vendor') || value.includes('procurement') || value.includes('facade') || value.includes('long-lead')) return 'Open VendorIQ';
  if (value.includes('evidence') || value.includes('approval') || value.includes('authority') || value.includes('gate')) return 'Request evidence';
  if (value.includes('crane') || value.includes('resequence') || value.includes('workforce') || value.includes('utilization')) return 'Assign owner';
  if (value.includes('cost') || value.includes('variation') || value.includes('commercial')) return 'Review cost impact';
  return action.cta || 'Create action';
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
            Latest cause: {latest ? latest.title : 'AI baseline from uploaded project context'}.
            {' '}The twin recalculates exposure and decision priority every time a project event is injected.
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
  const movement = context.healthMovement.from !== context.healthMovement.to
    ? `Health changed from ${context.healthMovement.from} -> ${context.healthMovement.to} after latest events.`
    : 'No live update has been recorded yet. Use the live update panel to show forecast, risk, and action recalculation.';
  const latest = latestLiveEvent(context);

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
              Project Pulse
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
          <h3 className="text-[18px] font-black leading-6 text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{latest ? context.topThreat : 'Ready to record the first live project update'}</h3>
          <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-[#B8C7DB]">
            {latest ? context.latestImpact : 'Start with a delay, variation, approval blocker, contractor issue, or recovery action. ProjectCommand will recalculate handover, EAC, float, evidence, and manager actions.'}
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

function WhatChangedToday({ context, goTo }: { context: ProjectControlContext; goTo: (screen: ProjectCommandScreen) => void }) {
  const liveUpdates = context.changedToday.filter(event => event.type !== 'baseline-created');
  const feed = liveUpdates.length > 0
    ? liveUpdates
    : [{
        id: 'baseline-created',
        type: 'recovery-approved' as const,
        title: 'Ready for the first live project update',
        affectedModule: 'Project Control Cockpit',
        impactLabel: 'Record a real delay, variation, approval blocker, contractor issue, or recovery action to show the forecast and decision queue moving live.',
        timestamp: new Date().toISOString(),
        cta: 'Open programme',
        affectedAreas: [],
        description: 'ProjectCommand is waiting for the next live update.',
        severity: 'positive' as const,
        impacts: { healthDelta: 0, cpiDelta: 0, spiDelta: 0, floatDelta: 0, eacDelta: 0, riskDelta: 0, evidenceChange: 0 },
        projectId: context.baseline.projectId,
      }];

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
          <h3 className="text-base font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>What Changed Today</h3>
          <p className="mt-0.5 text-[11px] text-[#7A94B4]">Live project updates and their connected control impacts.</p>
        </div>
        <span className="rounded-full border border-[rgba(46,127,255,0.18)] bg-[#07111F] px-2.5 py-1 text-[10px] font-black text-[#8EA7C7]">{feed.length} updates</span>
      </div>
      <div className="space-y-2">
        {feed.slice(0, 6).map((event, index) => (
          <motion.div
            key={event.id}
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            className="grid gap-3 rounded-xl border border-[rgba(46,127,255,0.13)] bg-[#07111F]/72 p-3 lg:grid-cols-[1fr_150px] lg:items-center"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${severityClass[event.severity]} ${index === 0 && context.changedToday.length > 0 ? 'animate-pulse' : ''}`}>{event.type.replaceAll('-', ' ')}</span>
                <span className="text-[10px] font-bold text-[#7A94B4]">{event.affectedModule}</span>
                <span className="text-[10px] text-[#5A6E88]">{formatProjectEventTime(event.timestamp)}</span>
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
            </div>
            <button
              type="button"
              onClick={() => goTo(targetFor(event.affectedModule))}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#7C3AED]/30 bg-[#7C3AED]/12 px-3 text-[10px] font-black text-[#DDD6FE] hover:bg-[#7C3AED]/20"
            >
              {event.cta}
              <ArrowRight size={12} />
            </button>
          </motion.div>
        ))}
      </div>
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
  const latestLabel = latest?.title ?? 'Waiting for first live project update.';

  return (
    <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Decision Queue</h3>
          <p className="mt-0.5 text-[11px] text-[#7A94B4]">Actions tied to the latest control signal.</p>
        </div>
        <span className="rounded-full border border-[#7C3AED]/25 bg-[#7C3AED]/12 px-2.5 py-1 text-[10px] font-black text-[#DDD6FE]">{context.managerActions.length} ready</span>
      </div>

      <div className="mb-3 rounded-xl border border-[#7C3AED]/18 bg-[#7C3AED]/10 px-3 py-2">
        <div className="flex items-center justify-between gap-3">
          <p className="shrink-0 text-[8px] font-black uppercase tracking-[0.14em] text-[#C4B5FD]">Current trigger</p>
          <p className="min-w-0 truncate text-right text-[10px] font-bold text-[#EDE9FE]">{latestLabel}</p>
        </div>
        {latest && (
          <div className="mt-1.5">
            <EventImpactChips event={latest} compact />
          </div>
        )}
      </div>

      <div className="space-y-2">
        {actions.map((action, index) => (
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
                    <span className="rounded-full border border-cyan-300/14 bg-cyan-300/8 px-2 py-0.5 text-[8px] font-black text-cyan-100">AI decision</span>
                  </div>
                  <h4 className="mt-1 line-clamp-1 text-[12px] font-black leading-4 text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{action.title}</h4>
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
            <p className="mt-2 line-clamp-1 text-[10px] font-bold leading-4 text-[#8EA7C7]">{action.whyItMatters}</p>
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
        ))}
      </div>
    </section>
  );
}

function ForecastCard({ scenario, context }: { scenario: ForecastScenario; context: ProjectControlContext }) {
  const tone = scenario.type === 'optimistic' ? '#38D98A' : scenario.type === 'base' ? '#00C6FF' : '#FF9B38';
  const eventLabel = context.latestEvent?.title ?? 'AI baseline';
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

function CompactForecastSummary({ context, onOpenForecast }: { context: ProjectControlContext; onOpenForecast: () => void }) {
  const baseScenario = context.forecastScenarios.find(scenario => scenario.type === 'base') ?? context.forecastScenarios[0];
  const optimistic = context.forecastScenarios.find(scenario => scenario.type === 'optimistic');
  const pessimistic = context.forecastScenarios.find(scenario => scenario.type === 'pessimistic');
  const scenarioRows = [
    { label: 'Best case', value: optimistic ? formatProjectDate(optimistic.handoverDate) : '-', cost: optimistic ? formatProjectCurrency(optimistic.forecastCost) : '-', tone: 'text-emerald-100' },
    { label: 'Base case', value: formatProjectDate(baseScenario.handoverDate), cost: formatProjectCurrency(baseScenario.forecastCost), tone: 'text-cyan-100' },
    { label: 'Risk case', value: pessimistic ? formatProjectDate(pessimistic.handoverDate) : '-', cost: pessimistic ? formatProjectCurrency(pessimistic.forecastCost) : '-', tone: 'text-orange-100' },
  ];

  return (
    <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Forecast Snapshot</h3>
          <p className="mt-0.5 text-[11px] text-[#7A94B4]">Handover and EAC recalculated from the event ledger.</p>
        </div>
        <button onClick={onOpenForecast} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#2E7FFF]/24 bg-[#07111F] px-3 text-[10px] font-black text-[#BFD8FF] hover:bg-[#2E7FFF]/12">
          Open forecast
          <ArrowRight size={12} />
        </button>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <div className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#07111F]/78 p-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">Base handover</p>
              <p className="mt-1 text-[18px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{formatProjectDate(baseScenario.handoverDate)}</p>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">Expected cost</p>
              <p className="mt-1 text-[18px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{formatProjectCurrency(baseScenario.forecastCost)}</p>
            </div>
          </div>
          <div className="mt-3 rounded-lg border border-cyan-300/14 bg-cyan-300/8 px-2.5 py-2">
            <p className="text-[8px] font-black uppercase tracking-[0.14em] text-cyan-100">Driver</p>
            <p className="mt-0.5 line-clamp-2 text-[10px] font-bold leading-4 text-[#DDF7FF]">
              {baseScenario.assumptions[0] ?? 'Forecast is based on the current programme, cost, risk, evidence, and latest project updates.'}
            </p>
          </div>
        </div>

        <div className="grid gap-2">
          {scenarioRows.map(row => (
            <div key={row.label} className="grid grid-cols-[1fr_auto] gap-3 rounded-xl border border-[rgba(46,127,255,0.12)] bg-[#07111F]/78 px-3 py-2.5">
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#5A6E88]">{row.label}</p>
                <p className={`mt-0.5 text-[12px] font-black ${row.tone}`}>{row.value}</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#5A6E88]">Cost</p>
                <p className="mt-0.5 text-[12px] font-black text-[#DCE8F8]">{row.cost}</p>
              </div>
            </div>
          ))}
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
          <p className="mt-0.5 text-[11px] text-[#7A94B4]">Dependency chain created by the latest project signal.</p>
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
          <p className="mt-0.5 text-[11px] text-[#7A94B4]">How ProjectCommand is pushing signals into connected 4C360 modules.</p>
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

function LiveUpdatePanel({
  context,
  ledgerSource,
  ledgerStatus,
  onSimulate,
  onReset,
}: {
  context: ProjectControlContext;
  ledgerSource: string;
  ledgerStatus: string;
  onSimulate: (type?: ProjectEventType) => void;
  onReset: () => void;
}) {
  const latest = latestLiveEvent(context);
  const liveOptions = projectEventOptions.filter(option => option.type !== 'baseline-created');
  return (
    <section className="rounded-xl border border-[#7C3AED]/24 bg-[linear-gradient(135deg,rgba(124,58,237,0.16),rgba(46,127,255,0.08),rgba(7,17,31,0.88))] p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#C4B5FD]">
            <Zap size={13} />
            Record Live Update
          </div>
          <h3 className="mt-1 text-[18px] font-black leading-6 text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Show how one project signal changes handover, EAC, float, risk, and actions.
          </h3>
          <p className="mt-1 text-[11px] leading-5 text-[#9CB1CC]">
            Choose the live case you want to demonstrate. The event ledger recalculates the cockpit and updates the decision queue immediately.
          </p>
        </div>
        <div className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#07111F]/78 px-3 py-2 xl:min-w-[240px]">
          <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">Latest signal</p>
          <p className="mt-1 line-clamp-2 text-[11px] font-bold leading-4 text-[#DCE8F8]">{latest?.title ?? 'No live update recorded yet'}</p>
          <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.12em] text-[#A78BFA]">Ledger: {ledgerStatus} / {ledgerSource}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {liveOptions.map(option => (
          <button
            key={option.type}
            type="button"
            onClick={() => onSimulate(option.type)}
            className={`min-h-[48px] rounded-xl border px-3 py-2 text-left transition-all hover:-translate-y-0.5 ${
              latest?.type === option.type
                ? 'border-[#7C3AED]/60 bg-[#7C3AED]/24 text-white shadow-[0_0_22px_rgba(124,58,237,0.22)]'
                : 'border-[#7C3AED]/20 bg-[#07111F]/78 text-[#DCE8F8] hover:border-[#7C3AED]/42 hover:bg-[#7C3AED]/12'
            }`}
          >
            <span className="block text-[11px] font-black">{option.label.replace('Trigger ', '')}</span>
            <span className="mt-0.5 block text-[9px] font-semibold text-[#8EA7C7]">
              {option.type === 'recovery-approved' ? 'Recover float and confidence' : 'Recalculate forecast impact'}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap justify-between gap-2 border-t border-[#7C3AED]/18 pt-3">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[rgba(46,127,255,0.18)] bg-[#07111F] px-3 text-[10px] font-black text-[#DCE8F8] transition-colors hover:bg-white/5"
        >
          <RefreshCw size={12} />
          Reset to baseline
        </button>
        <button
          type="button"
          onClick={() => onSimulate()}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#7C3AED] px-3 text-[10px] font-black text-white shadow-[0_0_22px_rgba(124,58,237,0.26)] transition-colors hover:bg-[#6D28D9]"
        >
          <Play size={12} />
          Run next update
        </button>
      </div>
    </section>
  );
}

function SourceConfidenceCard({ context }: { context: ProjectControlContext }) {
  const requiredEvidence = context.baseline.evidenceRequirements.length;
  const completeEvidence = context.baseline.evidenceRequirements.filter(item => item.status === 'Complete').length;
  const sourceRows = [
    ['Source pack', `${context.sourceTraces.length} traceable signals`],
    ['Evidence readiness', `${completeEvidence}/${requiredEvidence} items complete`],
    ['AI confidence', `${Math.round(context.sourceTraces.reduce((sum, trace) => sum + trace.confidence, 0) / Math.max(1, context.sourceTraces.length))}% avg`],
  ];
  return (
    <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100">
            <FileWarning size={13} />
            Source-Backed Baseline
          </div>
          <h3 className="mt-1 text-[15px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>What the cockpit is using</h3>
        </div>
        <span className="rounded-full border border-emerald-300/22 bg-emerald-300/10 px-2.5 py-1 text-[9px] font-black text-emerald-100">
          Traceable
        </span>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
        {sourceRows.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-[rgba(46,127,255,0.12)] bg-[#07111F]/70 px-3 py-2">
            <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">{label}</p>
            <p className="mt-1 text-[11px] font-bold text-[#DCE8F8]">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 space-y-1.5">
        {context.sourceTraces.slice(0, 2).map(trace => (
          <div key={trace.insight} className="rounded-lg bg-[#07111F]/70 px-3 py-2">
            <p className="line-clamp-1 text-[10px] font-black text-[#EEF3FA]">{trace.insight}</p>
            <p className="mt-0.5 line-clamp-1 text-[9px] font-semibold text-[#8EA7C7]">{trace.basedOn.slice(0, 2).join(' / ')}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function DemoControls({
  events,
  ledgerSource,
  ledgerStatus,
  expanded,
  onToggleExpanded,
  onReset,
  onSimulate,
}: {
  events: ProjectControlContext['events'];
  ledgerSource: string;
  ledgerStatus: string;
  expanded: boolean;
  onToggleExpanded: () => void;
  onReset: () => void;
  onSimulate: (type?: ProjectEventType) => void;
}) {
  if (!demoMode) return null;
  const latest = events[events.length - 1];
  const simulatedCount = events.filter(event => event.type !== 'baseline-created').length;
  const next = projectEventOptions[simulatedCount % projectEventOptions.length];
  return (
    <section className={`rounded-xl border transition-all ${
      expanded
        ? 'border-[#7C3AED]/28 bg-[linear-gradient(135deg,rgba(124,58,237,0.16),rgba(7,17,31,0.88))] p-4'
        : 'border-[rgba(46,127,255,0.12)] bg-[#07111F]/36 p-3'
    }`}>
      {!expanded ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#8DBDFF]">
              <Zap size={13} />
              Live Twin Ready
            </div>
            <p className="mt-1 text-[11px] text-[#7A94B4]">
              Client-facing view is clean. Presenter controls are hidden.
            </p>
          </div>
          <button
            type="button"
            onClick={onToggleExpanded}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#7C3AED]/24 bg-[#7C3AED]/10 px-3 text-[10px] font-black text-[#DDD6FE] transition-colors hover:border-[#7C3AED]/42 hover:bg-[#7C3AED]/16"
          >
            <Play size={12} />
            Presenter Controls
          </button>
        </div>
      ) : (
        <>
      <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#C4B5FD]"><Zap size={13} /> Presenter Controls</div>
          <p className="mt-1 text-[11px] text-[#8EA7C7]">
            Use this panel to drive the live story. Collapse it before client discussion. {events.length} event(s) active{latest ? ` - latest: ${latest.title}` : ''}.
          </p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#A78BFA]">
            Event ledger: {ledgerStatus} / {ledgerSource}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={onToggleExpanded} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[rgba(46,127,255,0.18)] bg-[#07111F] px-3 text-[10px] font-black text-[#DCE8F8] hover:bg-white/5">Hide Controls</button>
          <button onClick={onReset} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[rgba(46,127,255,0.18)] bg-[#07111F] px-3 text-[10px] font-black text-[#DCE8F8] hover:bg-white/5"><RefreshCw size={12} /> Reset Baseline</button>
          <button onClick={() => onSimulate()} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#7C3AED] px-3 text-[10px] font-black text-white shadow-[0_0_22px_rgba(124,58,237,0.26)] hover:bg-[#6D28D9]"><Play size={12} /> Inject Live Event <span className="text-white/70">({next.label.replace('Trigger ', '')})</span></button>
        </div>
      </div>
      <div className="mb-3 grid gap-2 md:grid-cols-3">
        {[
          ['1', 'Create baseline', events.length === 0 ? 'Ready for first event' : 'Baseline active'],
          ['2', 'Inject disruption', latest?.title ?? 'Choose a live event'],
          ['3', 'Queue decision', latest ? 'Watch Pulse, KPIs, Copilot update' : 'Recommendations are waiting'],
        ].map(([step, title, detail]) => (
          <div key={step} className="rounded-lg border border-[#7C3AED]/18 bg-[#07111F]/62 px-3 py-2">
            <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#A78BFA]">Demo step {step}</p>
            <p className="mt-0.5 text-[11px] font-black text-[#EEF3FA]">{title}</p>
            <p className="mt-0.5 truncate text-[10px] font-bold text-[#8EA7C7]">{detail}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {projectEventOptions.map(option => (
          <button
            key={option.type}
            type="button"
            onClick={() => onSimulate(option.type)}
            className={`rounded-lg border px-3 py-2 text-[10px] font-black transition-colors ${
              latest?.type === option.type
                ? 'border-[#7C3AED]/55 bg-[#7C3AED]/22 text-white shadow-[0_0_18px_rgba(124,58,237,0.22)]'
                : 'border-[#7C3AED]/24 bg-[#07111F]/82 text-[#DDD6FE] hover:border-[#7C3AED]/45 hover:bg-[#7C3AED]/14'
            }`}
          >
            {option.label.replace('Trigger ', '')}
          </button>
        ))}
      </div>
        </>
      )}
    </section>
  );
}

function PilotSummaryCard({
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
    `Top threat: ${context.topThreat}`,
    latest ? `Latest event: ${latest.title}.` : 'Latest event: baseline created from project context.',
    topAction ? `Recommended decision: ${topAction.title} - ${topAction.expectedImpact}.` : 'Recommended decision: confirm baseline and keep the watch list active.',
    'Pilot ask: select one tower, run 6-8 weeks, measure float protected, evidence gaps closed, rework avoided, and handover confidence movement.',
  ];

  function copySummary() {
    navigator.clipboard.writeText(summaryLines.join('\n')).then(() => {
      onToast?.('Pilot summary copied for the meeting close-out', 'success');
    }).catch(() => {
      onToast?.('Pilot summary is ready, but clipboard access was blocked', 'warning');
    });
  }

  return (
    <section className="rounded-xl border border-violet-300/18 bg-[linear-gradient(135deg,rgba(124,58,237,0.12),rgba(46,127,255,0.08),rgba(7,17,31,0.88))] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-violet-100">
            <FileWarning size={13} />
            Demo Close-Out
          </div>
          <h3 className="mt-1 text-base font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Meeting-ready outcome story</h3>
        </div>
        <span className="rounded-full border border-emerald-300/22 bg-emerald-300/10 px-2.5 py-1 text-[9px] font-black text-emerald-100">
          Ready
        </span>
      </div>

      <div className="mt-3 grid gap-2">
        {[
          ['Position', `Health ${context.metrics.healthScore}/100; float ${context.metrics.floatRemaining}d; EAC ${formatProjectCurrency(context.metrics.eac)}.`],
          ['Live signal', latest ? latest.title : 'Project baseline created from imported LOA / project summary.'],
          ['Pilot proof', 'Measure float protected, evidence gaps closed, rework avoided, and handover confidence movement.'],
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
            Open VendorIQ
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
}: {
  goTo: (screen: ProjectCommandScreen) => void;
  onToast?: ToastFn;
  onOpenVendorIQ?: () => void;
}) {
  const dataset = useSelectedProjectCommandData();
  const { projectEventsByProjectId, eventLedgerSourceByProjectId, eventLedgerStatusByProjectId } = useProjectCommandStore();
  const events = projectEventsByProjectId[dataset.id] ?? [];
  const context = useMemo(() => buildProjectControlContext(dataset, events), [dataset, events]);
  const [selectedInsight, setSelectedInsight] = useState<{ metricName: MetricName; value: string | number } | null>(null);
  const visibleControlMetrics = context.controlMetrics
    .filter(metric => ['CPI', 'SPI', 'Float Remaining', 'EAC'].includes(metric.label))
    .map(metric => ({ ...metric, cause: metricDemoCause(metric, context) }));
  const ledgerStatus = eventLedgerStatusByProjectId[dataset.id] ?? 'local';
  const ledgerSource = eventLedgerSourceByProjectId[dataset.id] ?? 'memory';

  const handleQueueAction = (action: ManagerAction) => {
    const actionLabel = managerActionButtonLabel(action);
    if (actionLabel === 'Open VendorIQ' && onOpenVendorIQ) {
      onToast?.(`${action.title}: VendorIQ procurement action opened`, 'success');
      onOpenVendorIQ();
      return;
    }
    onToast?.(`${action.title}: ${actionLabel.toLowerCase()} created for manager review`, 'success');
  };

  const handleLiveUpdate = (type?: ProjectEventType) => {
    const event = simulateProjectCommandEvent(dataset.id, type);
    onToast?.(`${event.title}: forecast, risk, and actions recalculated`, event.severity === 'positive' ? 'success' : 'warning');
  };

  const handleResetBaseline = () => {
    resetProjectCommandEvents(dataset.id);
    onToast?.('ProjectCommand reset to the source-backed baseline', 'info');
  };

  return (
    <div className="custom-scrollbar h-full overflow-x-hidden overflow-y-auto px-5 py-4 text-[#EEF3FA]">
      <div className="space-y-4">
        <ProjectPulse context={context} onExplain={() => setSelectedInsight({ metricName: 'Float Remaining', value: `${context.metrics.floatRemaining}d` })} />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
          <LiveUpdatePanel
            context={context}
            ledgerSource={ledgerSource}
            ledgerStatus={ledgerStatus}
            onSimulate={handleLiveUpdate}
            onReset={handleResetBaseline}
          />
          <SourceConfidenceCard context={context} />
        </div>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {visibleControlMetrics.map(metric => (
            <MetricCard
              key={metric.label}
              metric={metric}
              onExplain={() => setSelectedInsight({ metricName: metric.label as MetricName, value: metric.value })}
            />
          ))}
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_430px] xl:items-start">
          <div className="space-y-4">
            <WhatChangedToday context={context} goTo={goTo} />
            <CompactForecastSummary context={context} onOpenForecast={() => goTo('forecast')} />
            <ControlExceptions context={context} goTo={goTo} />
            <ImpactAnalysisPanel context={context} />
          </div>
          <div className="space-y-4 xl:sticky xl:top-4">
            <DecisionQueue context={context} onPrepare={handleQueueAction} />
            <PilotSummaryCard context={context} onOpenVendorIQ={onOpenVendorIQ} onToast={onToast} />
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
    </div>
  );
}
