import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Risk } from '../data/risks';
import { RiskMatrix } from '../components/RiskMatrix';
import { MonteCarlo } from '../components/MonteCarlo';
import { AIPanel } from '../components/AIPanel';
import { setProjectCommandState, useProjectCommandStore } from '../state/projectCommandStore';
import { useSelectedProjectCommandData } from '../useProjectCommandData';

const severities: Risk['severity'][] = ['critical', 'high', 'medium', 'low'];

const severityClass: Record<Risk['severity'], string> = {
  critical: 'bg-[#D92B1C]/15 text-red-200 border-[#D92B1C]/35',
  high: 'bg-[#C8A020]/14 text-yellow-200 border-[#C8A020]/35',
  medium: 'bg-[#D97706]/14 text-amber-200 border-[#D97706]/35',
  low: 'bg-[#00B894]/12 text-emerald-200 border-[#00B894]/35',
};

export function RiskCommand() {
  const { aiContent, risks } = useSelectedProjectCommandData();
  const { selectedRisk } = useProjectCommandStore();
  const trend = aiContent.riskInsights.riskTrend.labels.map((month, index) => ({
    month,
    critical: aiContent.riskInsights.riskTrend.critical[index],
    high: aiContent.riskInsights.riskTrend.high[index],
    medium: aiContent.riskInsights.riskTrend.medium[index],
    low: aiContent.riskInsights.riskTrend.low[index],
  }));

  return (
    <div className="custom-scrollbar h-full overflow-x-hidden overflow-y-auto px-5 py-4 text-[#EEF3FA]" data-demo-anchor="project-risk">
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
          <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
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
    </div>
  );
}
