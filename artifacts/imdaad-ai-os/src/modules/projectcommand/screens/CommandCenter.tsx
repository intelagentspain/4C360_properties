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
} from '../data/projectControlDemoEngine';
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
      className="group relative min-h-[142px] overflow-hidden rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-3 text-left transition-colors hover:border-[#7C3AED]/35 hover:bg-[rgba(17,32,64,0.92)]"
    >
      <AIInsightBadge onClick={onExplain} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7A94B4]">{metric.label}</div>
          <div className="mt-2 text-[26px] font-black" style={{ color: metric.tone, fontFamily: 'Space Grotesk, sans-serif' }}>{metric.value}</div>
        </div>
        <span className="rounded-full border border-[rgba(46,127,255,0.18)] bg-[#07111F] px-2 py-1 text-[9px] font-black uppercase text-[#8EA7C7]">
          {metric.lastUpdated}
        </span>
      </div>
      <p className="mt-3 line-clamp-2 text-[10px] leading-4 text-[#8EA7C7]">{metric.aiExplanation}</p>
      <div className="mt-3 rounded-lg border border-[rgba(46,127,255,0.12)] bg-[#07111F]/70 px-2.5 py-2">
        <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#5A6E88]">Source</p>
        <p className="mt-0.5 truncate text-[10px] font-bold text-[#B8C7DB]">{metric.source}</p>
      </div>
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
            DevelopmentX / Danube Properties / {baseline.property.name} / {baseline.project.name}
          </div>
          <h2 className="mt-2 text-[22px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {baseline.property.name} - {baseline.project.name}
          </h2>
          <p className="mt-1 text-[12px] leading-5 text-[#B8C7DB]">
            {baseline.property.type} in {baseline.property.location} - {baseline.property.floors} floors - {baseline.property.units} units - {baseline.project.type}
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 xl:w-[560px]">
          {[
            ['Approved Budget', formatProjectCurrency(baseline.project.approvedBudget)],
            ['Target Handover', formatProjectDate(baseline.project.targetHandover)],
            ['Baseline Scope', `${baseline.workPackages.length} packages`],
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

function ProjectPulse({
  context,
  onExplain,
}: {
  context: ProjectControlContext;
  onExplain: () => void;
}) {
  const movement = context.healthMovement.from !== context.healthMovement.to
    ? `Health changed from ${context.healthMovement.from} -> ${context.healthMovement.to} after latest events.`
    : 'Health is holding at baseline. Simulate a project event to show live recalculation.';

  return (
    <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
      <div className="grid gap-5 xl:grid-cols-[116px_1fr_330px] xl:items-center">
        <HealthScoreGauge score={context.metrics.healthScore} status={context.projectControlStatus === 'critical' ? 'critical' : context.projectControlStatus === 'on-track' ? 'good' : 'monitor'} />
        <div className="min-w-0 border-l-2 pl-5" style={{ borderColor: projectStatusColor(context.projectControlStatus) }}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#C4B5FD]">
              <Brain size={14} />
              AI Project Pulse
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
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            ['Forecast Handover', formatProjectDate(context.metrics.forecastHandover)],
            ['Forecast Cost', formatProjectCurrency(context.metrics.eac)],
            ['Risk Exposure', formatProjectCurrency(context.metrics.riskExposure)],
            ['Evidence Ready', `${context.metrics.evidenceCompleteness}%`],
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

function WhatChangedToday({ context, goTo }: { context: ProjectControlContext; goTo: (screen: ProjectCommandScreen) => void }) {
  const feed = context.changedToday.length > 0
    ? context.changedToday
    : [{
        id: 'baseline-created',
        type: 'recovery-approved' as const,
        title: 'AI baseline generated for Bayz 102',
        affectedModule: 'Project Control Layer',
        impactLabel: 'Work packages, phases, cost baseline, stage gates, vendors, risks, obligations, evidence, and milestones are ready.',
        timestamp: new Date().toISOString(),
        cta: 'Simulate Project Event',
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
        {feed.slice(0, 6).map(event => (
          <div key={event.id} className="grid gap-3 rounded-xl border border-[rgba(46,127,255,0.13)] bg-[#07111F]/72 p-3 lg:grid-cols-[1fr_130px] lg:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${severityClass[event.severity]}`}>{event.type.replaceAll('-', ' ')}</span>
                <span className="text-[10px] font-bold text-[#7A94B4]">{event.affectedModule}</span>
                <span className="text-[10px] text-[#5A6E88]">{formatProjectEventTime(event.timestamp)}</span>
              </div>
              <p className="mt-2 text-[12px] font-black text-[#EEF3FA]">{event.title}</p>
              <p className="mt-1 text-[11px] leading-4 text-[#B8C7DB]">{event.impactLabel}</p>
            </div>
            <button
              type="button"
              onClick={() => goTo(targetFor(event.affectedModule))}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#7C3AED]/30 bg-[#7C3AED]/12 px-3 text-[10px] font-black text-[#DDD6FE] hover:bg-[#7C3AED]/20"
            >
              {event.cta}
              <ArrowRight size={12} />
            </button>
          </div>
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
          No blocked gates, missing evidence, pending variation, or vendor escalation is active. Simulate an event to show exception routing.
        </div>
      ) : (
        <div className="grid gap-2 lg:grid-cols-2">
          {exceptions.map(exception => (
            <div key={exception.id} className="rounded-xl border border-[rgba(46,127,255,0.13)] bg-[#07111F]/72 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${severityClass[exception.severity]}`}>{exception.severity}</span>
                  <p className="mt-2 text-[12px] font-black text-[#EEF3FA]">{exception.title}</p>
                  <p className="mt-1 text-[10px] font-bold text-[#7A94B4]">{exception.linkedObject}</p>
                </div>
                <FileWarning size={17} className="shrink-0 text-[#FFCD57]" />
              </div>
              <p className="mt-2 min-h-[34px] text-[11px] leading-4 text-[#B8C7DB]">{exception.impact}</p>
              <button
                type="button"
                onClick={() => goTo(exception.title.includes('evidence') ? 'evidence' : exception.title.includes('variation') ? 'cost' : exception.title.includes('vendor') || exception.title.includes('Risk') ? 'risk' : 'stagegates')}
                className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg border border-[rgba(46,127,255,0.18)] bg-[#0A1628] px-3 text-[10px] font-black text-[#DCE8F8] hover:bg-white/5"
              >
                {exception.cta}
                <ArrowRight size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function DecisionCard({ action, onQueue }: { action: ManagerAction; onQueue: (action: ManagerAction) => void }) {
  return (
    <div className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#07111F]/78 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${severityClass[action.priority === 'critical' ? 'critical' : action.priority === 'high' ? 'high' : action.priority === 'medium' ? 'medium' : 'low']}`}>{action.priority}</span>
          <h4 className="mt-2 text-[13px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{action.title}</h4>
        </div>
        <Target size={17} className="shrink-0 text-[#C4B5FD]" />
      </div>
      <div className="mt-3 space-y-2 text-[11px] leading-4 text-[#B8C7DB]">
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
    </div>
  );
}

function ForecastCard({ scenario }: { scenario: ForecastScenario }) {
  const tone = scenario.type === 'optimistic' ? '#38D98A' : scenario.type === 'base' ? '#00C6FF' : '#FF9B38';
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

function DemoControls({
  events,
  onReset,
  onSimulate,
}: {
  events: ProjectControlContext['events'];
  onReset: () => void;
  onSimulate: (type?: ProjectEventType) => void;
}) {
  if (!demoMode) return null;
  return (
    <section className="rounded-xl border border-[#7C3AED]/28 bg-[linear-gradient(135deg,rgba(124,58,237,0.16),rgba(7,17,31,0.88))] p-4">
      <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#C4B5FD]"><Zap size={13} /> Demo Controls</div>
          <p className="mt-1 text-[11px] text-[#8EA7C7]">Presentation controls for the live project controls demo engine. {events.length} event(s) active.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={onReset} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[rgba(46,127,255,0.18)] bg-[#07111F] px-3 text-[10px] font-black text-[#DCE8F8] hover:bg-white/5"><RefreshCw size={12} /> Reset Baseline</button>
          <button onClick={() => onSimulate()} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#7C3AED] px-3 text-[10px] font-black text-white hover:bg-[#6D28D9]"><Play size={12} /> Simulate Project Event</button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {projectEventOptions.filter(option => ['facade-delay', 'crane-loss', 'variation-submitted', 'evidence-rejected', 'recovery-approved'].includes(option.type)).map(option => (
          <button
            key={option.type}
            type="button"
            onClick={() => onSimulate(option.type)}
            className="rounded-lg border border-[#7C3AED]/24 bg-[#07111F]/82 px-3 py-2 text-[10px] font-black text-[#DDD6FE] hover:border-[#7C3AED]/45 hover:bg-[#7C3AED]/14"
          >
            {option.label}
          </button>
        ))}
      </div>
    </section>
  );
}

export function CommandCenter({ goTo, onToast }: { goTo: (screen: ProjectCommandScreen) => void; onToast?: ToastFn }) {
  const dataset = useSelectedProjectCommandData();
  const { activeScenario, projectEventsByProjectId } = useProjectCommandStore();
  const events = projectEventsByProjectId[dataset.id] ?? [];
  const context = useMemo(() => buildProjectControlContext(dataset, events), [dataset, events]);
  const [selectedInsight, setSelectedInsight] = useState<{ metricName: MetricName; value: string | number } | null>(null);

  const handleSimulate = (type?: ProjectEventType) => {
    const event = simulateProjectCommandEvent(dataset.id, type);
    onToast?.(`${event.title}: ${event.impactLabel}`, event.severity === 'positive' ? 'success' : event.severity === 'critical' ? 'error' : 'warning');
  };

  const handleReset = () => {
    resetProjectCommandEvents(dataset.id);
    onToast?.('ProjectCommand baseline reset', 'info');
  };

  const handleQueueAction = (action: ManagerAction) => {
    onToast?.(`${action.title} queued in manager action queue`, 'success');
  };

  const baseScenario = context.forecastScenarios.find(scenario => scenario.type === activeScenario) ?? context.forecastScenarios[1];

  return (
    <div className="custom-scrollbar h-full overflow-x-hidden overflow-y-auto px-5 py-4 text-[#EEF3FA]">
      <div className="space-y-4">
        <ProjectHeader context={context} />
        <DemoControls events={events} onReset={handleReset} onSimulate={handleSimulate} />
        <ProjectPulse context={context} onExplain={() => setSelectedInsight({ metricName: 'Float Remaining', value: `${context.metrics.floatRemaining}d` })} />

        <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {context.controlMetrics.map(metric => (
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
            <OperationalLayer context={context} />
            <ControlExceptions context={context} goTo={goTo} />
          </div>
          <div className="space-y-4">
            <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>AI Top Decisions</h3>
                <span className="rounded-full border border-[#7C3AED]/25 bg-[#7C3AED]/12 px-2.5 py-1 text-[10px] font-black text-[#DDD6FE]">Decision Layer</span>
              </div>
              <div className="space-y-3">
                {context.managerActions.slice(0, 3).map(action => <DecisionCard key={action.id} action={action} onQueue={handleQueueAction} />)}
              </div>
            </section>

            <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Forecast Scenarios</h3>
                <button onClick={() => goTo('forecast')} className="text-[11px] font-bold text-[#C4B5FD]">Explore</button>
              </div>
              <div className="space-y-3">
                {context.forecastScenarios.map(scenario => (
                  <button
                    key={scenario.type}
                    type="button"
                    onClick={() => setProjectCommandState({ activeScenario: scenario.type })}
                    className={`block w-full text-left transition-transform hover:scale-[1.01] ${baseScenario.type === scenario.type ? 'rounded-xl ring-1 ring-[#7C3AED]/40' : ''}`}
                  >
                    <ForecastCard scenario={scenario} />
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#7A94B4]">
          <span className="inline-flex items-center gap-1"><CalendarClock size={13} /> Target {formatProjectDate(context.baseline.project.targetHandover)}</span>
          <span className="inline-flex items-center gap-1"><Gauge size={13} /> CPI/SPI {context.metrics.cpi.toFixed(2)} / {context.metrics.spi.toFixed(2)}</span>
          <span className="inline-flex items-center gap-1"><TrendingUp size={13} /> EAC {formatProjectCurrency(context.metrics.eac)}</span>
          <span className="inline-flex items-center gap-1"><Clock3 size={13} /> Float {context.metrics.floatRemaining} days</span>
          <span className="inline-flex items-center gap-1"><ShieldAlert size={13} /> Risk {formatProjectCurrency(context.metrics.riskExposure)}</span>
          <span className="inline-flex items-center gap-1"><AlertTriangle size={13} /> {context.controlExceptions.length} exceptions</span>
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
