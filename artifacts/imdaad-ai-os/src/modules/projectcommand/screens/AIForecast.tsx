import { CalendarDays } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import type { ScenarioKey } from '../data/ai-responses';
import { ScenarioCard } from '../components/ScenarioCard';
import { AIForecastChat } from '../components/AIForecastChat';
import { setProjectCommandState, useProjectCommandStore } from '../state/projectCommandStore';
import { useSelectedProjectCommandData } from '../useProjectCommandData';

export function AIForecast() {
  const { aiContent, project } = useSelectedProjectCommandData();
  const { activeScenario } = useProjectCommandStore();
  const scenario = aiContent.scenarios[activeScenario];
  const timeline = [
    { label: 'Today', days: 0 },
    { label: 'Optimistic', days: project.daysToHandover + aiContent.scenarios.optimistic.programmeSlip },
    { label: 'Base', days: project.daysToHandover + aiContent.scenarios.base.programmeSlip },
    { label: 'Pessimistic', days: project.daysToHandover + aiContent.scenarios.pessimistic.programmeSlip },
  ];

  return (
    <div className="custom-scrollbar h-full overflow-x-hidden overflow-y-auto px-5 py-4 text-[#EEF3FA]" data-demo-anchor="project-forecast">
      <div className="mb-4 grid gap-4 xl:grid-cols-3">
        {Object.entries(aiContent.scenarios).map(([key, item]) => (
          <ScenarioCard
            key={key}
            scenarioKey={key as ScenarioKey}
            scenario={item}
            size="large"
            isActive={activeScenario === key}
            onClick={() => setProjectCommandState({ activeScenario: key as ScenarioKey })}
          />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_460px]">
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
                  <ReferenceLine x={project.daysToHandover} stroke="#C8A020" strokeDasharray="4 4" label={{ value: 'Original handover', fill: '#C8A020', fontSize: 10 }} />
                  <Bar dataKey="days" fill="#7C3AED" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
          <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
            <h2 className="mb-3 text-lg font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Top Decisions for {scenario.label}</h2>
            <div className="space-y-3">
              {aiContent.topDecisions.map(decision => (
                <div key={decision.rank} className="grid grid-cols-[38px_1fr_110px] items-center gap-3 rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#0A1628] p-3">
                  <span className="text-3xl font-black text-[#7C3AED]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{decision.rank}</span>
                  <div>
                    <div className="text-[13px] font-bold text-[#EEF3FA]">{decision.title}</div>
                    <p className="mt-1 text-[12px] text-[#B8C7DB]">{decision.impact}</p>
                  </div>
                  <div className="text-right">
                    <span className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase ${decision.urgency === 'critical' ? 'bg-[#D92B1C]/15 text-red-200' : decision.urgency === 'high' ? 'bg-[#D97706]/15 text-amber-200' : 'bg-[#00B894]/12 text-emerald-200'}`}>{decision.urgency}</span>
                    <div className="mt-2 font-mono text-[10px] text-[#7A94B4]">{decision.deadline}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
        <AIForecastChat />
      </div>
    </div>
  );
}
