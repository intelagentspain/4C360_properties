import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowRight, BrainCircuit, FileText, Play, RefreshCw, Sparkles, Target } from 'lucide-react';
import type { Risk } from '../data/risks';
import { RiskMatrix } from '../components/RiskMatrix';
import { MonteCarlo } from '../components/MonteCarlo';
import { AIPanel } from '../components/AIPanel';
import { resetProjectCommandEvents, setProjectCommandState, simulateProjectCommandEvent, useProjectCommandStore } from '../state/projectCommandStore';
import { useSelectedProjectCommandData } from '../useProjectCommandData';
import {
  buildProjectControlContext,
  formatProjectCurrency,
  projectStatusColor,
  projectStatusLabel,
  type ManagerAction,
  type ProjectEventType,
} from '@/core/control-twin/projectControlTwin';

const severities: Risk['severity'][] = ['critical', 'high', 'medium', 'low'];

const severityClass: Record<Risk['severity'], string> = {
  critical: 'bg-[#D92B1C]/15 text-red-200 border-[#D92B1C]/35',
  high: 'bg-[#C8A020]/14 text-yellow-200 border-[#C8A020]/35',
  medium: 'bg-[#D97706]/14 text-amber-200 border-[#D97706]/35',
  low: 'bg-[#00B894]/12 text-emerald-200 border-[#00B894]/35',
};

const scenarioButtons: Array<{ type: ProjectEventType; label: string; detail: string }> = [
  { type: 'facade-delay', label: 'Simulate facade delay', detail: 'Shows envelope delay, vendor risk, float loss, and EAC movement.' },
  { type: 'missing-approval', label: 'Simulate approval gap', detail: 'Blocks a gate and shows the evidence/action consequence.' },
  { type: 'contractor-underperformance', label: 'Simulate contractor drift', detail: 'Connects vendor performance to programme and cost exposure.' },
  { type: 'recovery-approved', label: 'Approve recovery', detail: 'Shows how a decision recovers float and reduces risk exposure.' },
];

function metricTone(value: number, warning: number, critical: number, lowerIsBad = true) {
  const isCritical = lowerIsBad ? value <= critical : value >= critical;
  const isWarning = lowerIsBad ? value <= warning : value >= warning;
  if (isCritical) return 'border-red-400/35 bg-red-400/12 text-red-100';
  if (isWarning) return 'border-amber-300/30 bg-amber-300/12 text-amber-100';
  return 'border-cyan-300/24 bg-cyan-300/10 text-cyan-100';
}

function actionOwner(action: ManagerAction) {
  const text = `${action.title} ${action.whyItMatters} ${action.cta}`.toLowerCase();
  if (text.includes('facade') || text.includes('procurement') || text.includes('vendor')) return 'Procurement Lead';
  if (text.includes('evidence') || text.includes('approval') || text.includes('gate')) return 'QA / Authority Lead';
  if (text.includes('cost') || text.includes('variation') || text.includes('commercial')) return 'Commercial Manager';
  if (text.includes('crane') || text.includes('programme') || text.includes('schedule')) return 'Planning Manager';
  return 'Project Controls Lead';
}

function actionDue(action: ManagerAction) {
  if (action.priority === 'critical') return 'Today';
  if (action.priority === 'high') return '24h';
  return 'This week';
}

function priorityClass(priority: ManagerAction['priority']) {
  if (priority === 'critical') return 'border-red-400/35 bg-red-400/12 text-red-100';
  if (priority === 'high') return 'border-orange-300/30 bg-orange-300/12 text-orange-100';
  if (priority === 'medium') return 'border-amber-300/25 bg-amber-300/10 text-amber-100';
  return 'border-cyan-300/20 bg-cyan-300/10 text-cyan-100';
}

function ActionPackPreview({ action, onClose }: { action: ManagerAction; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[2600] flex items-center justify-center bg-[#020817]/70 px-4 py-6 backdrop-blur-sm">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close action pack" />
      <section className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-cyan-300/28 bg-[#07111F] shadow-[0_28px_100px_rgba(0,0,0,0.45)]">
        <div className="border-b border-cyan-300/14 bg-[linear-gradient(135deg,rgba(6,182,212,0.18),rgba(124,58,237,0.10))] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">Manager action pack</div>
              <h2 className="mt-2 text-2xl font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{action.title}</h2>
              <p className="mt-2 max-w-2xl text-[13px] leading-6 text-[#B8C7DB]">{action.whyItMatters}</p>
            </div>
            <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${priorityClass(action.priority)}`}>{action.priority}</span>
          </div>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-[1fr_1fr]">
          {[
            ['Owner', actionOwner(action)],
            ['Due', actionDue(action)],
            ['Trigger', action.triggerLabel],
            ['Status', 'Prepared for review'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#0A1628] p-4">
              <div className="text-[9px] font-black uppercase tracking-[0.16em] text-[#7A94B4]">{label}</div>
              <div className="mt-2 text-[13px] font-black text-[#EEF3FA]">{value}</div>
            </div>
          ))}
        </div>
        <div className="grid gap-4 border-t border-[rgba(46,127,255,0.14)] p-5 md:grid-cols-2">
          <div className="rounded-xl border border-emerald-300/24 bg-emerald-300/10 p-4">
            <div className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-100">Expected outcome</div>
            <p className="mt-2 text-[13px] leading-6 text-[#DDF8EC]">{action.expectedImpact}</p>
          </div>
          <div className="rounded-xl border border-amber-300/24 bg-amber-300/10 p-4">
            <div className="text-[9px] font-black uppercase tracking-[0.16em] text-amber-100">Cost logic</div>
            <p className="mt-2 text-[13px] leading-6 text-[#FFECC2]">{action.costImplication}</p>
          </div>
        </div>
        <div className="flex justify-end border-t border-[rgba(46,127,255,0.14)] p-5">
          <button type="button" onClick={onClose} className="rounded-xl border border-[rgba(46,127,255,0.26)] bg-[#112040] px-5 py-3 text-[12px] font-black text-[#DDE6F8] hover:bg-[#17305E]">
            Close pack
          </button>
        </div>
      </section>
    </div>
  );
}

export function RiskCommand() {
  const dataset = useSelectedProjectCommandData();
  const { aiContent, risks } = dataset;
  const { selectedRisk, projectEventsByProjectId } = useProjectCommandStore();
  const events = projectEventsByProjectId[dataset.id] ?? [];
  const context = useMemo(() => buildProjectControlContext(dataset, events), [dataset, events]);
  const [preparedAction, setPreparedAction] = useState<ManagerAction | null>(null);
  const latestEvent = context.latestEvent?.type === 'baseline-created' ? null : context.latestEvent;
  const topAction = context.managerActions[0];
  const boardOptions = [
    {
      label: 'Do nothing',
      outcome: `Risk stays at ${formatProjectCurrency(context.metrics.riskExposure)} and float remains exposed.`,
      tone: 'border-red-400/30 bg-red-400/10 text-red-100',
    },
    {
      label: 'Approve recovery',
      outcome: 'Recover float, lower risk exposure, and update forecast confidence.',
      tone: 'border-emerald-300/25 bg-emerald-300/10 text-emerald-100',
    },
    {
      label: 'Demand proof first',
      outcome: 'Protects audit trail, but may leave the programme risk open this week.',
      tone: 'border-cyan-300/24 bg-cyan-300/10 text-cyan-100',
    },
  ];
  const trend = aiContent.riskInsights.riskTrend.labels.map((month, index) => ({
    month,
    critical: aiContent.riskInsights.riskTrend.critical[index],
    high: aiContent.riskInsights.riskTrend.high[index],
    medium: aiContent.riskInsights.riskTrend.medium[index],
    low: aiContent.riskInsights.riskTrend.low[index],
  }));

  return (
    <div className="custom-scrollbar h-full overflow-x-hidden overflow-y-auto px-5 py-4 text-[#EEF3FA]" data-demo-anchor="project-risk">
      <section className="mb-4 overflow-hidden rounded-2xl border border-cyan-300/20 bg-[linear-gradient(135deg,rgba(6,182,212,0.14),rgba(124,58,237,0.10)_42%,rgba(7,17,31,0.92))] shadow-[0_18px_70px_rgba(0,0,0,0.22)]" data-demo-anchor="project-risk-scenario">
        <div className="grid gap-0 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
          <div className="p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/24 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100">
                <BrainCircuit size={13} />
                Risk-to-action control twin
              </span>
              <span className="rounded-full border px-3 py-1 text-[10px] font-black uppercase" style={{ borderColor: `${projectStatusColor(context.projectControlStatus)}55`, color: projectStatusColor(context.projectControlStatus), background: `${projectStatusColor(context.projectControlStatus)}18` }}>
                {projectStatusLabel(context.projectControlStatus)}
              </span>
            </div>
            <h2 className="mt-4 max-w-3xl text-2xl font-black leading-tight text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Turn the risk register into a live board decision.
            </h2>
            <p className="mt-2 max-w-4xl text-[13px] leading-6 text-[#B8C7DB]">
              Run a project event and watch ProjectCommand connect the same risk to cost, float, evidence readiness, vendor pressure, and a manager-ready action pack.
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {scenarioButtons.map(button => (
                <button
                  key={button.type}
                  type="button"
                  onClick={() => {
                    simulateProjectCommandEvent(dataset.id, button.type);
                    setPreparedAction(null);
                  }}
                  className="group min-h-[118px] rounded-xl border border-[rgba(46,127,255,0.22)] bg-[#07111F]/82 p-3 text-left transition-all hover:-translate-y-0.5 hover:border-cyan-300/45 hover:bg-[#0A1D34]"
                  data-demo-action={`risk-simulate-${button.type}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <Play size={15} className="text-cyan-200" />
                    <ArrowRight size={14} className="text-[#4A6080] transition-colors group-hover:text-cyan-100" />
                  </div>
                  <div className="mt-3 text-[12px] font-black text-[#EEF3FA]">{button.label}</div>
                  <p className="mt-2 text-[10px] leading-4 text-[#8EA7C7]">{button.detail}</p>
                </button>
              ))}
            </div>
          </div>

          <aside className="border-t border-cyan-300/14 bg-[#07111F]/66 p-5 xl:border-l xl:border-t-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200">Current board signal</div>
                <h3 className="mt-2 text-lg font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {latestEvent ? latestEvent.title : 'Baseline risk model active'}
                </h3>
                <p className="mt-2 text-[12px] leading-5 text-[#B8C7DB]">
                  {latestEvent ? latestEvent.impactLabel : aiContent.healthScore.topThreat}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetProjectCommandEvents(dataset.id);
                  setPreparedAction(null);
                }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[rgba(46,127,255,0.22)] bg-[#0A1628] text-[#8EA7C7] hover:text-white"
                aria-label="Reset risk simulation"
              >
                <RefreshCw size={15} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2" data-demo-anchor="project-risk-metrics">
              {[
                { label: 'Float', value: `${context.metrics.floatRemaining}d`, raw: context.metrics.floatRemaining, warning: 24, critical: 12, lowerIsBad: true },
                { label: 'EAC', value: formatProjectCurrency(context.metrics.eac), raw: context.metrics.eac - dataset.project.contractValue, warning: 1, critical: 12_000_000, lowerIsBad: false },
                { label: 'Risk', value: formatProjectCurrency(context.metrics.riskExposure), raw: context.metrics.riskExposure, warning: 30_000_000, critical: 45_000_000, lowerIsBad: false },
                { label: 'Ready', value: `${context.metrics.handoverConfidence}%`, raw: context.metrics.handoverConfidence, warning: 70, critical: 55, lowerIsBad: true },
              ].map(metric => (
                <div key={metric.label} className={`rounded-xl border p-3 ${metricTone(metric.raw, metric.warning, metric.critical, metric.lowerIsBad)}`}>
                  <div className="text-[8px] font-black uppercase tracking-[0.16em] opacity-75">{metric.label}</div>
                  <div className="mt-1 text-xl font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{metric.value}</div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <div className="mb-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
        <section className="rounded-2xl border border-[rgba(46,127,255,0.18)] bg-[#0A1628]/82 p-4" data-demo-anchor="project-risk-actions">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#C4B5FD]">
                <Sparkles size={13} />
                AI manager action queue
              </div>
              <h3 className="mt-1 text-lg font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Actions generated from the risk condition</h3>
            </div>
            <span className="rounded-full border border-[#7C3AED]/28 bg-[#7C3AED]/12 px-3 py-1 text-[10px] font-black text-[#DDD6FE]">{context.managerActions.length} ready</span>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {context.managerActions.slice(0, 4).map(action => (
              <button
                key={action.id}
                type="button"
                onClick={() => setPreparedAction(action)}
                className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#07111F] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-cyan-300/40 hover:bg-[#0B1D36]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${priorityClass(action.priority)}`}>{action.priority}</span>
                  <span className="text-[10px] font-black text-[#8EA7C7]">{actionDue(action)}</span>
                </div>
                <div className="mt-3 text-[13px] font-black text-[#EEF3FA]">{action.title}</div>
                <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-[#9DB4D0]">{action.expectedImpact}</p>
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-[rgba(46,127,255,0.12)] pt-3">
                  <span className="text-[10px] text-[#7A94B4]">{actionOwner(action)}</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-cyan-200">Open pack <ArrowRight size={12} /></span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[rgba(46,127,255,0.18)] bg-[#0A1628]/82 p-4" data-demo-anchor="project-risk-board-decision">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200">
            <Target size={13} />
            Board decision
          </div>
          <h3 className="mt-2 text-lg font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {topAction ? topAction.title : 'Keep baseline under review'}
          </h3>
          <p className="mt-2 text-[12px] leading-5 text-[#B8C7DB]">
            {topAction ? topAction.whyItMatters : 'Run a scenario to generate a sharper action recommendation.'}
          </p>
          <div className="mt-4 space-y-2">
            {boardOptions.map(option => (
              <div key={option.label} className={`rounded-xl border p-3 ${option.tone}`}>
                <div className="text-[11px] font-black">{option.label}</div>
                <p className="mt-1 text-[10px] leading-4 opacity-85">{option.outcome}</p>
              </div>
            ))}
          </div>
          {topAction && (
            <button
              type="button"
              onClick={() => setPreparedAction(topAction)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2E7FFF] px-4 py-3 text-[12px] font-black text-white shadow-lg shadow-blue-950/30 hover:bg-[#256BE0]"
            >
              <FileText size={15} />
              Prepare board pack
            </button>
          )}
        </section>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {severities.map(severity => {
          const count = risks.filter(risk => risk.severity === severity).length;
          return (
            <button key={severity} className={`rounded-xl border p-4 text-left ${severityClass[severity]}`}>
              <div className="text-[10px] font-black uppercase tracking-[0.16em]">{severity}</div>
              <div className="mt-2 text-3xl font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{count}</div>
            </button>
          );
        })}
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
            <h2 className="mb-3 text-lg font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Probability x Impact Matrix</h2>
            <RiskMatrix risks={risks} />
          </section>
          <div className="grid gap-4 2xl:grid-cols-2">
            <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
              <h3 className="mb-3 text-sm font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Risk Trend</h3>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ left: -14, right: 12 }}>
                    <CartesianGrid stroke="rgba(46,127,255,0.18)" strokeDasharray="3 5" />
                    <XAxis dataKey="month" tick={{ fill: '#7A94B4', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#7A94B4', fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: '#0A1628', border: '1px solid rgba(46,127,255,0.35)', borderRadius: 10, color: '#EEF3FA' }} />
                    <Area dataKey="low" stackId="1" stroke="#00B894" fill="#00B894" fillOpacity={0.32} />
                    <Area dataKey="medium" stackId="1" stroke="#D97706" fill="#D97706" fillOpacity={0.32} />
                    <Area dataKey="high" stackId="1" stroke="#C8A020" fill="#C8A020" fillOpacity={0.32} />
                    <Area dataKey="critical" stackId="1" stroke="#D92B1C" fill="#D92B1C" fillOpacity={0.35} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>
            <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
              <h3 className="mb-3 text-sm font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Monte Carlo Completion</h3>
              <MonteCarlo />
            </section>
          </div>
          <AIPanel title="AI Early Warnings">
            <div className="space-y-3">
              {aiContent.riskInsights.earlyWarnings.map(warning => <p key={warning} className="rounded-lg border border-[#7C3AED]/20 bg-[#0A1628]/80 p-3 text-[12px] leading-5 text-[#DDE6F8]">{warning}</p>)}
            </div>
          </AIPanel>
        </div>
        <aside className="space-y-4">
          <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4" data-demo-anchor="project-risk-register">
            <h3 className="mb-3 text-sm font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Risk Register</h3>
            <div className="custom-scrollbar max-h-[470px] space-y-2 overflow-y-auto pr-1">
              {risks.map(risk => (
                <button key={risk.id} onClick={() => setProjectCommandState({ selectedRisk: risk })} className="w-full rounded-lg border border-[rgba(46,127,255,0.18)] bg-[#0A1628] p-3 text-left transition-colors hover:border-[rgba(46,127,255,0.35)]">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${severityClass[risk.severity]}`}>{risk.severity}</span>
                    <span className="font-mono text-[11px] text-[#B8C7DB]">{risk.probability} x {risk.impact} = {risk.score}</span>
                  </div>
                  <div className="text-[12px] font-bold text-[#EEF3FA]">{risk.title}</div>
                  <div className="mt-1 text-[11px] text-[#7A94B4]">{risk.owner} - {risk.status}</div>
                  {selectedRisk?.id === risk.id && (
                    <div className="mt-3 border-t border-[rgba(46,127,255,0.18)] pt-3 text-[11px] leading-5 text-[#B8C7DB]">
                      {risk.mitigation}
                      {risk.aiEarlyWarning && <div className="mt-2 rounded-lg border border-[#7C3AED]/25 bg-[#7C3AED]/10 p-2 text-[#C4B5FD]">{risk.aiEarlyWarning}</div>}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>
        </aside>
      </div>
      {preparedAction && <ActionPackPreview action={preparedAction} onClose={() => setPreparedAction(null)} />}
    </div>
  );
}
