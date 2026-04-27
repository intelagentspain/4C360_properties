import { CalendarDays } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { aiContent, type ScenarioKey } from '../data/ai-responses';
import { ScenarioCard } from '../components/ScenarioCard';
import { AIForecastChat } from '../components/AIForecastChat';
import { setProjectCommandState, useProjectCommandStore } from '../state/projectCommandStore';

const timeline = [
  { label: 'Today', days: 0 },
  { label: 'Optimistic', days: 275 },
  { label: 'Base', days: 324 },
  { label: 'Pessimistic', days: 412 },
];

export function AIForecast() {
  const { activeScenario } = useProjectCommandStore();
  const scenario = aiContent.scenarios[activeScenario];

  return (
    <div className="custom-scrollbar h-full overflow-y-auto bg-[#07101C] p-5 text-[#F0F4FF]">
      <div className="mb-4 grid grid-cols-3 gap-4">
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
      <div className="grid grid-cols-[minmax(0,1fr)_460px] gap-4">
        <div className="space-y-4">
          <section className="rounded-2xl border border-[#1C3050] bg-[#0E1E35] p-4">
            <div className="mb-3 flex items-center gap-2">
              <CalendarDays size={16} className="text-[#7C3AED]" />
              <h2 className="text-lg font-black" style={{ fontFamily: 'Syne, sans-serif' }}>{scenario.label} Timeline</h2>
            </div>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeline} layout="vertical" margin={{ left: 18, right: 24 }}>
                  <CartesianGrid stroke="#1C3050" strokeDasharray="3 5" />
                  <XAxis type="number" tick={{ fill: '#5A6E88', fontSize: 10 }} />
                  <YAxis type="category" dataKey="label" tick={{ fill: '#BCC8DC', fontSize: 11 }} width={92} />
                  <ReferenceLine x={284} stroke="#C8A020" strokeDasharray="4 4" label={{ value: 'Original handover', fill: '#C8A020', fontSize: 10 }} />
                  <Bar dataKey="days" fill="#7C3AED" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
          <section className="rounded-2xl border border-[#1C3050] bg-[#0E1E35] p-4">
            <h2 className="mb-3 text-lg font-black" style={{ fontFamily: 'Syne, sans-serif' }}>Top Decisions for {scenario.label}</h2>
            <div className="space-y-3">
              {aiContent.topDecisions.map(decision => (
                <div key={decision.rank} className="grid grid-cols-[38px_1fr_110px] items-center gap-3 rounded-xl border border-[#1C3050] bg-[#09152A] p-3">
                  <span className="text-3xl font-black text-[#7C3AED]" style={{ fontFamily: 'Syne, sans-serif' }}>{decision.rank}</span>
                  <div>
                    <div className="text-[13px] font-bold text-[#F0F4FF]">{decision.title}</div>
                    <p className="mt-1 text-[12px] text-[#BCC8DC]">{decision.impact}</p>
                  </div>
                  <div className="text-right">
                    <span className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase ${decision.urgency === 'critical' ? 'bg-[#D92B1C]/15 text-red-200' : decision.urgency === 'high' ? 'bg-[#D97706]/15 text-amber-200' : 'bg-[#00B894]/12 text-emerald-200'}`}>{decision.urgency}</span>
                    <div className="mt-2 font-mono text-[10px] text-[#5A6E88]">{decision.deadline}</div>
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
