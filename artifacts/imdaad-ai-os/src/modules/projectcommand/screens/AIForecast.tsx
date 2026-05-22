import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ScenarioKey } from '../data/ai-responses';
import { AIForecastChat } from '../components/AIForecastChat';
import { setProjectCommandState, useProjectCommandStore } from '../state/projectCommandStore';
import { useSelectedProjectCommandData } from '../useProjectCommandData';

const scenarioOrder: ScenarioKey[] = ['optimistic', 'base', 'pessimistic'];

function money(value: number) {
  const abs = Math.abs(value);
  const amount = abs >= 1_000_000 ? `${Math.round(abs / 1_000_000)}M` : `${Math.round(abs / 1_000)}K`;
  return `${value < 0 ? '-' : ''}AED ${amount}`;
}

function scenarioTone(key: ScenarioKey) {
  if (key === 'optimistic') return 'border-emerald-300/24 bg-emerald-300/10 text-emerald-100';
  if (key === 'pessimistic') return 'border-red-300/24 bg-red-400/10 text-red-100';
  return 'border-cyan-300/24 bg-cyan-300/10 text-cyan-100';
}

function urgencyTone(urgency: string) {
  if (urgency === 'critical') return 'border-red-300/24 bg-red-400/12 text-red-100';
  if (urgency === 'high') return 'border-amber-300/24 bg-amber-300/10 text-amber-100';
  return 'border-emerald-300/24 bg-emerald-300/10 text-emerald-100';
}

export function AIForecast() {
  const { aiContent, project } = useSelectedProjectCommandData();
  const { activeScenario } = useProjectCommandStore();
  const [briefPrepared, setBriefPrepared] = useState(false);
  const scenario = aiContent.scenarios[activeScenario];
  const costDelta = scenario.finalCost - project.contractValue;
  const leadDecision = aiContent.topDecisions[0];

  const timeline = scenarioOrder.map(key => ({
    label: aiContent.scenarios[key].label,
    days: project.daysToHandover + aiContent.scenarios[key].programmeSlip,
    slip: aiContent.scenarios[key].programmeSlip,
  }));

  const confidenceRows = useMemo(() => [
    {
      label: 'Cost range',
      value: `${aiContent.costInsights.eacConfidence.p10}M / ${aiContent.costInsights.eacConfidence.p50}M / ${aiContent.costInsights.eacConfidence.p90}M`,
      detail: 'P10, P50, and P90 estimate at completion from cost drivers and earned value.',
      tone: 'cyan',
      icon: BrainCircuit,
    },
    {
      label: 'Risk signal',
      value: `${aiContent.riskInsights.earlyWarnings.length} early warnings`,
      detail: aiContent.riskInsights.earlyWarnings[0],
      tone: 'red',
      icon: AlertTriangle,
    },
    {
      label: 'Decision coverage',
      value: `${aiContent.topDecisions.length} actions ranked`,
      detail: 'The model ranks the decisions that can still change timing, cost, and readiness.',
      tone: 'emerald',
      icon: Target,
    },
    {
      label: 'Evidence basis',
      value: 'Programme + cost + risk',
      detail: 'Forecast confidence is tied back to source registers instead of a black-box prediction.',
      tone: 'violet',
      icon: ShieldCheck,
    },
  ], [aiContent]);

  return (
    <div className="custom-scrollbar h-full overflow-x-hidden overflow-y-auto px-5 py-4 text-[#EEF3FA]" data-demo-anchor="project-forecast">
      <section
        data-demo-anchor="project-forecast-scenarios"
        className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[linear-gradient(135deg,rgba(17,32,64,0.94),rgba(7,17,31,0.9))] p-4"
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/24 bg-cyan-300/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100">
                <Sparkles size={13} />
                AI forecast command
              </span>
              <span className="rounded-full border border-[rgba(46,127,255,0.2)] bg-[#07111F] px-2.5 py-1 text-[10px] font-bold text-[#8EA7C7]">
                {project.name}
              </span>
            </div>
            <h1 className="mt-3 text-[25px] font-black leading-8" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Compare the cost of action with the cost of waiting.
            </h1>
            <p className="mt-2 max-w-4xl text-[13px] leading-6 text-[#B8C7DB]">
              The forecast page brings optimistic, base, and pessimistic outcomes into one board view, then traces each outcome back to programme slip, final cost, assumptions, and the decision that can still change the result.
            </p>
          </div>
          <div className="grid min-w-0 grid-cols-3 gap-2 xl:min-w-[370px]">
            {[
              ['Active case', scenario.label],
              ['Handover slip', `${scenario.programmeSlip}d`],
              ['Final cost', money(scenario.finalCost)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#07111F]/82 p-3 text-center">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">{label}</p>
                <p className="mt-1 font-mono text-[16px] font-black text-[#EEF3FA]">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-3">
          {scenarioOrder.map(key => {
            const item = aiContent.scenarios[key];
            const isActive = activeScenario === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setProjectCommandState({ activeScenario: key })}
                className={`rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 ${
                  isActive ? 'border-cyan-200/60 bg-cyan-300/14 shadow-lg shadow-cyan-950/30' : scenarioTone(key)
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-75">{item.probability}% probability</p>
                    <h2 className="mt-1 text-[17px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{item.label}</h2>
                  </div>
                  <span className="rounded-full border border-white/10 bg-[#07111F]/78 px-2 py-1 text-[9px] font-black uppercase text-[#B8C7DB]">
                    {isActive ? 'Selected' : 'Compare'}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-[#07111F]/70 p-2">
                    <p className="text-[9px] font-black uppercase tracking-wide text-[#7A94B4]">Completion</p>
                    <p className="mt-1 font-mono text-[12px] font-black text-[#EEF3FA]">{item.completionDate}</p>
                  </div>
                  <div className="rounded-lg bg-[#07111F]/70 p-2">
                    <p className="text-[9px] font-black uppercase tracking-wide text-[#7A94B4]">Cost delta</p>
                    <p className={`mt-1 font-mono text-[12px] font-black ${item.finalCost > project.contractValue ? 'text-amber-100' : 'text-emerald-100'}`}>
                      {money(item.finalCost - project.contractValue)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 space-y-1.5">
                  {item.assumptions.slice(0, 3).map(assumption => (
                    <div key={assumption} className="flex gap-2 text-[11px] leading-4 text-[#DDE6F8]">
                      <CheckCircle2 size={13} className="mt-0.5 shrink-0 opacity-70" />
                      {assumption}
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_430px]">
        <div className="space-y-4">
          <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
            <div className="mb-3 flex items-center gap-2">
              <CalendarDays size={16} className="text-[#7C3AED]" />
              <h2 className="text-lg font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{scenario.label} Timeline</h2>
            </div>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeline} layout="vertical" margin={{ left: 18, right: 24 }}>
                  <CartesianGrid stroke="rgba(46,127,255,0.18)" strokeDasharray="3 5" />
                  <XAxis type="number" tick={{ fill: '#7A94B4', fontSize: 10 }} />
                  <YAxis type="category" dataKey="label" tick={{ fill: '#B8C7DB', fontSize: 11 }} width={92} />
                  <Tooltip contentStyle={{ background: '#0A1628', border: '1px solid rgba(46,127,255,0.35)', borderRadius: 10, color: '#EEF3FA' }} />
                  <ReferenceLine x={project.daysToHandover} stroke="#C8A020" strokeDasharray="4 4" label={{ value: 'Original handover', fill: '#C8A020', fontSize: 10 }} />
                  <Bar dataKey="days" fill="#7C3AED" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section
            data-demo-anchor="project-forecast-confidence"
            className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4"
          >
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-cyan-200">
                  <BrainCircuit size={14} />
                  Forecast confidence ledger
                </div>
                <h2 className="mt-2 text-lg font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Why the forecast can be trusted</h2>
                <p className="mt-1 max-w-3xl text-[12px] leading-5 text-[#7A94B4]">
                  Confidence is not hidden. The page exposes the source signals, risk warnings, and action coverage behind the selected outcome.
                </p>
              </div>
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${scenarioTone(activeScenario)}`}>
                {scenario.probability}% scenario weight
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {confidenceRows.map(row => {
                const Icon = row.icon;
                return (
                  <div key={row.label} className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#07111F] p-3">
                    <div className="flex items-start gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
                        <Icon size={16} />
                      </span>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">{row.label}</p>
                        <p className="mt-1 text-[14px] font-black text-[#EEF3FA]">{row.value}</p>
                        <p className="mt-1 text-[11px] leading-5 text-[#B8C7DB]">{row.detail}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section
            data-demo-anchor="project-forecast-decisions"
            className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4"
          >
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#C4B5FD]">
                  <Target size={14} />
                  Board decision cards
                </div>
                <h2 className="mt-2 text-lg font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>What changes the base case?</h2>
                <p className="mt-1 max-w-3xl text-[12px] leading-5 text-[#7A94B4]">
                  Each decision is ranked by operational impact, urgency, and deadline, so the forecast ends with a choice rather than a chart.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBriefPrepared(true)}
                className="rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-[11px] font-black text-cyan-100 transition-colors hover:bg-cyan-300/16"
              >
                {briefPrepared ? 'Decision brief ready' : 'Prepare decision brief'}
              </button>
            </div>
            <div className="space-y-3">
              {aiContent.topDecisions.slice(0, 4).map(decision => (
                <div key={decision.rank} className="grid gap-3 rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#0A1628] p-3 md:grid-cols-[48px_1fr_120px] md:items-center">
                  <span className="text-3xl font-black text-[#7C3AED]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{decision.rank}</span>
                  <div>
                    <div className="text-[13px] font-bold text-[#EEF3FA]">{decision.title}</div>
                    <p className="mt-1 text-[12px] leading-5 text-[#B8C7DB]">{decision.impact}</p>
                  </div>
                  <div className="flex items-center justify-between gap-2 md:block md:text-right">
                    <span className={`rounded-full border px-2 py-1 text-[9px] font-bold uppercase ${urgencyTone(decision.urgency)}`}>{decision.urgency}</span>
                    <div className="font-mono text-[10px] text-[#7A94B4] md:mt-2">{decision.deadline}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-xl border border-cyan-300/22 bg-cyan-300/10 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100">Selected outcome</p>
                <h2 className="mt-1 text-lg font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{scenario.label}</h2>
              </div>
              <span className="rounded-full border border-cyan-300/24 bg-[#07111F] px-2 py-1 text-[10px] font-black uppercase text-cyan-100">{scenario.probability}%</span>
            </div>
            <div className="grid gap-2">
              {[
                ['Completion', scenario.completionDate],
                ['Programme slip', `${scenario.programmeSlip} days`],
                ['Cost movement', money(costDelta)],
                ['Decision owner', 'Project Director'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3 rounded-lg bg-[#07111F]/80 px-3 py-2 text-[12px]">
                  <span className="text-[#7A94B4]">{label}</span>
                  <span className="font-bold text-[#DDE6F8]">{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-xl border border-cyan-300/18 bg-[#07111F] p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100">Recommendation</p>
              <p className="mt-2 text-[13px] leading-6 text-[#DDE6F8]">
                Start with {leadDecision.title.toLowerCase()}. It has the clearest effect on the selected forecast and gives the board an accountable owner and deadline.
              </p>
            </div>
            {briefPrepared && (
              <div className="mt-3 rounded-xl border border-emerald-300/22 bg-emerald-300/10 p-3">
                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-100">
                  <FileText size={14} />
                  Decision brief prepared
                </div>
                <p className="mt-2 text-[12px] leading-5 text-[#DDE6F8]">Includes selected scenario, assumptions, cost exposure, decision owner, and the action needed to improve the base case.</p>
              </div>
            )}
          </section>

          <div className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#C4B5FD]">
              <ArrowRight size={14} />
              Ask the forecast
            </div>
            <AIForecastChat />
          </div>
        </aside>
      </div>
    </div>
  );
}
