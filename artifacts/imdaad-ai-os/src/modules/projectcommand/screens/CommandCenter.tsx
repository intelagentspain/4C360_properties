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
import { AIInsightBadge } from '../components/AIInsightBadge';
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
  setProjectCommandState,
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
      className="group relative min-h-[176px] overflow-hidden rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-3 text-left transition-colors hover:border-[#7C3AED]/35 hover:bg-[rgba(17,32,64,0.92)]"
    >
      <AIInsightBadge onClick={onExplain} />
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
      <p className="mt-3 line-clamp-2 text-[10px] leading-4 text-[#8EA7C7]">{metric.aiExplanation}</p>
      <div className="mt-3 grid gap-2">
        <div className="rounded-lg border border-[rgba(46,127,255,0.12)] bg-[#07111F]/70 px-2.5 py-2">
          <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#5A6E88]">Cause</p>
          <p className="mt-0.5 line-clamp-2 text-[10px] font-bold leading-4 text-[#DCE8F8]">{metric.cause}</p>
        </div>
        <div className="rounded-lg border border-[rgba(46,127,255,0.12)] bg-[#07111F]/70 px-2.5 py-2">
          <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#5A6E88]">Source</p>
          <p className="mt-0.5 truncate text-[10px] font-bold text-[#B8C7DB]">{metric.source}</p>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 h-1 bg-[#7C3AED] transition-all group-hover:bg-[#00C6FF]" style={{ width: `${Math.min(100, Math.max(8, metric.rawValue))}%` }} />
    </motion.button>
  );
}

function ProjectHeader({
  context,
  executiveMode,
  onToggleExecutive,
}: {
  context: ProjectControlContext;
  executiveMode: boolean;
  onToggleExecutive: () => void;
}) {
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
        <div className="space-y-2 xl:w-[650px]">
          <div className="grid gap-2 sm:grid-cols-3">
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
          <button
            type="button"
            onClick={onToggleExecutive}
            className={`flex h-10 w-full items-center justify-center gap-2 rounded-xl border text-[10px] font-black uppercase tracking-[0.14em] transition-colors ${
              executiveMode
                ? 'border-emerald-300/28 bg-emerald-300/12 text-emerald-100'
                : 'border-[rgba(46,127,255,0.16)] bg-[#07111F]/80 text-[#B8C7DB] hover:border-[#2E7FFF]/35 hover:text-white'
            }`}
          >
            <Gauge size={13} />
            Executive View
            <span className={`h-2 w-2 rounded-full ${executiveMode ? 'bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.7)]' : 'bg-[#7A94B4]'}`} />
          </button>
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
    : 'Health is holding at baseline until a live project update is recorded.';
  const latest = context.latestEvent;
  const chain = latest
    ? [
        { label: 'Event', value: latest.title },
        { label: 'Control impact', value: latest.affectedModule },
        { label: 'Manager action', value: context.managerActions[0]?.title ?? latest.cta },
      ]
    : [
        { label: 'Input', value: 'Property + project created' },
        { label: 'Baseline', value: 'Controls generated' },
        { label: 'Ready', value: 'Awaiting project update' },
      ];

  return (
    <motion.section
      key={latest?.id ?? 'baseline-pulse'}
      initial={{ boxShadow: '0 0 0 rgba(124,58,237,0)' }}
      animate={{ boxShadow: latest ? '0 0 34px rgba(124,58,237,0.16)' : '0 0 0 rgba(124,58,237,0)' }}
      transition={{ duration: 0.35 }}
      className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4"
    >
      <div className="grid gap-5 xl:grid-cols-[116px_1fr_330px] xl:items-center">
        <HealthScoreGauge score={context.metrics.healthScore} status={context.projectControlStatus === 'critical' ? 'critical' : context.projectControlStatus === 'on-track' ? 'good' : 'monitor'} />
        <div className="min-w-0 border-l-2 pl-5" style={{ borderColor: projectStatusColor(context.projectControlStatus) }}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
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
          <h3 className="text-[18px] font-black leading-6 text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{context.topThreat}</h3>
          <p className="mt-2 text-[12px] leading-5 text-[#B8C7DB]">{context.latestImpact}</p>
          <div className="mt-3 rounded-lg border border-[rgba(46,127,255,0.14)] bg-[#07111F]/70 px-3 py-2 text-[11px] font-bold text-[#DCE8F8]">{movement}</div>
          <div className="mt-2 rounded-lg border border-cyan-300/12 bg-cyan-300/7 px-3 py-2 text-[10px] font-bold leading-4 text-cyan-50">
            Based on: {context.sourceTraces[0]?.basedOn.slice(0, 3).join(' / ') ?? 'programme / cost / risk'}.
          </div>
          {latest && (
            <div className="mt-3">
              <EventImpactChips event={latest} />
            </div>
          )}
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {chain.map((item, index) => (
              <div key={item.label} className="relative rounded-lg border border-[rgba(46,127,255,0.12)] bg-[#07111F]/60 px-3 py-2">
                <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#5A6E88]">{item.label}</p>
                <p className="mt-1 line-clamp-2 text-[10px] font-black leading-4 text-[#DCE8F8]">{item.value}</p>
                {index < chain.length - 1 && <ArrowRight className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-[#5A6E88] sm:block" size={14} />}
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            ['Forecast Handover', formatProjectDate(context.metrics.forecastHandover)],
            ['Forecast Cost', formatProjectCurrency(context.metrics.eac)],
            ['Risk Exposure', formatProjectCurrency(context.metrics.riskExposure)],
            ['Handover Confidence', `${context.metrics.handoverConfidence}%`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#07111F]/80 p-3">
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
  const feed = context.changedToday.length > 0
    ? context.changedToday
    : [{
        id: 'baseline-created',
        type: 'recovery-approved' as const,
                title: 'Project baseline generated for Sobha Pilot Tower',
        affectedModule: 'Project Control Layer',
        impactLabel: 'Work packages, phases, cost baseline, stage gates, vendors, risks, obligations, evidence, and milestones are ready.',
        timestamp: new Date().toISOString(),
        cta: 'Review live event readiness',
        affectedAreas: [],
        description: '',
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
          <p className="mt-0.5 text-[11px] text-[#7A94B4]">Live project events and their connected control impacts.</p>
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

function DecisionCard({ action, onQueue }: { action: ManagerAction; onQueue: (action: ManagerAction) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#07111F]/78 p-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${severityClass[action.priority === 'critical' ? 'critical' : action.priority === 'high' ? 'high' : action.priority === 'medium' ? 'medium' : 'low']}`}>{action.priority}</span>
          <h4 className="mt-2 text-[13px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{action.title}</h4>
        </div>
        <Target size={17} className="shrink-0 text-[#C4B5FD]" />
      </div>
      <div className="mt-3 space-y-2 text-[11px] leading-4 text-[#B8C7DB]">
        <p className="rounded-lg border border-[#7C3AED]/18 bg-[#7C3AED]/10 px-2.5 py-2"><span className="font-black text-[#DDD6FE]">Triggered by: </span>{action.triggerLabel}</p>
        <p><span className="font-black text-white">Why: </span>{action.whyItMatters}</p>
        <p><span className="font-black text-white">Impact: </span>{action.expectedImpact}</p>
        <p><span className="font-black text-white">Cost: </span>{action.costImplication}</p>
      </div>
      <button
        type="button"
        onClick={() => onQueue(action)}
        className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-[#7C3AED] px-3 text-[11px] font-black text-white hover:bg-[#6D28D9]"
      >
        <CheckCircle2 size={13} />
        {action.cta}
      </button>
    </motion.div>
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

  return (
    <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Forecast</h3>
          <p className="mt-0.5 text-[11px] text-[#7A94B4]">Current handover and cost outlook.</p>
        </div>
        <button onClick={onOpenForecast} className="text-[11px] font-bold text-[#C4B5FD]">Open forecast</button>
      </div>
      <div className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#07111F]/78 p-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">Expected handover</p>
            <p className="mt-1 text-[18px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatProjectDate(baseScenario.handoverDate)}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">Expected cost</p>
            <p className="mt-1 text-[18px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatProjectCurrency(baseScenario.forecastCost)}
            </p>
          </div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {[
            ['Best case', optimistic ? formatProjectDate(optimistic.handoverDate) : '-'],
            ['Base', formatProjectDate(baseScenario.handoverDate)],
            ['Risk case', pessimistic ? formatProjectDate(pessimistic.handoverDate) : '-'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-[rgba(46,127,255,0.10)] bg-[#0A1628] px-2.5 py-2">
              <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#5A6E88]">{label}</p>
              <p className="mt-0.5 text-[10px] font-black text-[#DCE8F8]">{value}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 line-clamp-2 text-[11px] leading-4 text-[#8EA7C7]">
          {baseScenario.assumptions[0] ?? 'Forecast is based on the current programme, cost, risk, evidence, and latest project updates.'}
        </p>
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
        <span className="rounded-full border border-[rgba(46,127,255,0.18)] bg-[#07111F] px-2.5 py-1 text-[10px] font-black text-[#8EA7C7] group-open:hidden">
          Expand
        </span>
        <span className="hidden rounded-full border border-[rgba(46,127,255,0.18)] bg-[#07111F] px-2.5 py-1 text-[10px] font-black text-[#8EA7C7] group-open:inline-flex">
          Collapse
        </span>
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
                <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[8px] font-black uppercase ${statusClass(item.status)}`}>
                  {projectStatusLabel(item.status)}
                </span>
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

export function CommandCenter({ goTo, onToast }: { goTo: (screen: ProjectCommandScreen) => void; onToast?: ToastFn }) {
  const dataset = useSelectedProjectCommandData();
  const { projectEventsByProjectId } = useProjectCommandStore();
  const events = projectEventsByProjectId[dataset.id] ?? [];
  const context = useMemo(() => buildProjectControlContext(dataset, events), [dataset, events]);
  const [selectedInsight, setSelectedInsight] = useState<{ metricName: MetricName; value: string | number } | null>(null);
  const visibleControlMetrics = context.controlMetrics.filter(metric => ['CPI', 'SPI', 'Float Remaining', 'EAC'].includes(metric.label));

  const handleQueueAction = (action: ManagerAction) => {
    onToast?.(`${action.title} queued in manager action queue`, 'success');
  };

  return (
    <div className="custom-scrollbar h-full overflow-x-hidden overflow-y-auto px-5 py-4 text-[#EEF3FA]">
      <div className="space-y-4">
        <ProjectHeader context={context} />
        <ProjectPulse context={context} onExplain={() => setSelectedInsight({ metricName: 'Float Remaining', value: `${context.metrics.floatRemaining}d` })} />

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {visibleControlMetrics.map(metric => (
            <MetricCard
              key={metric.label}
              metric={metric}
              onExplain={() => setSelectedInsight({ metricName: metric.label as MetricName, value: metric.value })}
            />
          ))}
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="space-y-4">
            <WhatChangedToday context={context} goTo={goTo} />
            <ControlExceptions context={context} goTo={goTo} />
            <ImpactAnalysisPanel context={context} />
          </div>
          <div className="space-y-4">
            <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Recommended Actions</h3>
                <span className="rounded-full border border-[#7C3AED]/25 bg-[#7C3AED]/12 px-2.5 py-1 text-[10px] font-black text-[#DDD6FE]">{context.managerActions.length} ready</span>
              </div>
              <div className="space-y-3">
                {context.managerActions.slice(0, 3).map(action => <DecisionCard key={action.id} action={action} onQueue={handleQueueAction} />)}
              </div>
            </section>
            <CompactForecastSummary context={context} onOpenForecast={() => goTo('forecast')} />
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
