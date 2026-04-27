import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { risks, type Risk } from '../data/risks';
import { aiContent } from '../data/ai-responses';
import { RiskMatrix } from '../components/RiskMatrix';
import { MonteCarlo } from '../components/MonteCarlo';
import { AIPanel } from '../components/AIPanel';
import { setProjectCommandState, useProjectCommandStore } from '../state/projectCommandStore';

const severities: Risk['severity'][] = ['critical', 'high', 'medium', 'low'];
const trend = aiContent.riskInsights.riskTrend.labels.map((month, index) => ({
  month,
  critical: aiContent.riskInsights.riskTrend.critical[index],
  high: aiContent.riskInsights.riskTrend.high[index],
  medium: aiContent.riskInsights.riskTrend.medium[index],
  low: aiContent.riskInsights.riskTrend.low[index],
}));

const severityClass: Record<Risk['severity'], string> = {
  critical: 'bg-[#D92B1C]/15 text-red-200 border-[#D92B1C]/35',
  high: 'bg-[#C8A020]/14 text-yellow-200 border-[#C8A020]/35',
  medium: 'bg-[#D97706]/14 text-amber-200 border-[#D97706]/35',
  low: 'bg-[#00B894]/12 text-emerald-200 border-[#00B894]/35',
};

export function RiskCommand() {
  const { selectedRisk } = useProjectCommandStore();

  return (
    <div className="custom-scrollbar h-full overflow-y-auto bg-[#07101C] p-5 text-[#F0F4FF]">
      <div className="mb-4 grid grid-cols-4 gap-3">
        {severities.map(severity => {
          const count = risks.filter(risk => risk.severity === severity).length;
          return (
            <button key={severity} className={`rounded-xl border p-4 text-left ${severityClass[severity]}`}>
              <div className="text-[10px] font-black uppercase tracking-[0.16em]">{severity}</div>
              <div className="mt-2 text-3xl font-black" style={{ fontFamily: 'Syne, sans-serif' }}>{count}</div>
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-[minmax(0,1.35fr)_380px] gap-4">
        <div className="space-y-4">
          <section className="rounded-2xl border border-[#1C3050] bg-[#0E1E35] p-4">
            <h2 className="mb-3 text-lg font-black" style={{ fontFamily: 'Syne, sans-serif' }}>Probability x Impact Matrix</h2>
            <RiskMatrix risks={risks} />
          </section>
          <div className="grid grid-cols-2 gap-4">
            <section className="rounded-2xl border border-[#1C3050] bg-[#0E1E35] p-4">
              <h3 className="mb-3 text-sm font-black" style={{ fontFamily: 'Syne, sans-serif' }}>Risk Trend</h3>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ left: -14, right: 12 }}>
                    <CartesianGrid stroke="#1C3050" strokeDasharray="3 5" />
                    <XAxis dataKey="month" tick={{ fill: '#5A6E88', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#5A6E88', fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: '#09152A', border: '1px solid #264468', borderRadius: 10, color: '#F0F4FF' }} />
                    <Area dataKey="low" stackId="1" stroke="#00B894" fill="#00B894" fillOpacity={0.32} />
                    <Area dataKey="medium" stackId="1" stroke="#D97706" fill="#D97706" fillOpacity={0.32} />
                    <Area dataKey="high" stackId="1" stroke="#C8A020" fill="#C8A020" fillOpacity={0.32} />
                    <Area dataKey="critical" stackId="1" stroke="#D92B1C" fill="#D92B1C" fillOpacity={0.35} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>
            <section className="rounded-2xl border border-[#1C3050] bg-[#0E1E35] p-4">
              <h3 className="mb-3 text-sm font-black" style={{ fontFamily: 'Syne, sans-serif' }}>Monte Carlo Completion</h3>
              <MonteCarlo />
            </section>
          </div>
          <AIPanel title="AI Early Warnings">
            <div className="space-y-3">
              {aiContent.riskInsights.earlyWarnings.map(warning => <p key={warning} className="rounded-lg border border-[#7C3AED]/20 bg-[#09152A]/80 p-3 text-[12px] leading-5 text-[#DDE6F8]">{warning}</p>)}
            </div>
          </AIPanel>
        </div>
        <aside className="space-y-4">
          <section className="rounded-2xl border border-[#1C3050] bg-[#0E1E35] p-4">
            <h3 className="mb-3 text-sm font-black" style={{ fontFamily: 'Syne, sans-serif' }}>Risk Register</h3>
            <div className="custom-scrollbar max-h-[520px] space-y-2 overflow-y-auto pr-1">
              {risks.map(risk => (
                <button key={risk.id} onClick={() => setProjectCommandState({ selectedRisk: risk })} className="w-full rounded-lg border border-[#1C3050] bg-[#09152A] p-3 text-left transition-colors hover:border-[#264468]">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${severityClass[risk.severity]}`}>{risk.severity}</span>
                    <span className="font-mono text-[11px] text-[#BCC8DC]">{risk.probability} x {risk.impact} = {risk.score}</span>
                  </div>
                  <div className="text-[12px] font-bold text-[#F0F4FF]">{risk.title}</div>
                  <div className="mt-1 text-[11px] text-[#5A6E88]">{risk.owner} · {risk.status}</div>
                  {selectedRisk?.id === risk.id && (
                    <div className="mt-3 border-t border-[#1C3050] pt-3 text-[11px] leading-5 text-[#BCC8DC]">
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
    </div>
  );
}
