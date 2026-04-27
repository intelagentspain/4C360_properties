import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useSelectedProjectCommandData } from '../useProjectCommandData';

export function MonteCarlo() {
  const { aiContent } = useSelectedProjectCommandData();
  const data = aiContent.riskInsights.monteCarlo.bins;
  return (
    <div className="h-[240px] rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#0A1628] p-3">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 16, right: 18, left: -16, bottom: 0 }}>
          <CartesianGrid stroke="rgba(46,127,255,0.18)" strokeDasharray="3 5" />
          <XAxis dataKey="label" tick={{ fill: '#7A94B4', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#7A94B4', fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
          <Tooltip
            cursor={{ fill: 'rgba(124,58,237,0.08)' }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.[0]) return null;
              return (
                <div className="rounded-lg border border-[rgba(46,127,255,0.35)] bg-[#0A1628] px-3 py-2 text-xs text-[#EEF3FA] shadow-xl">
                  <div className="font-bold">{label}</div>
                  <div className="mt-1 text-[#B8C7DB]">Probability: {payload[0].value}% of simulations</div>
                </div>
              );
            }}
          />
          <ReferenceLine x={aiContent.riskInsights.monteCarlo.p50} stroke="#C8A020" label={{ value: 'P50', fill: '#C8A020', fontSize: 10 }} />
          <ReferenceLine x={aiContent.riskInsights.monteCarlo.p80} stroke="#D97706" strokeDasharray="4 4" label={{ value: 'P80', fill: '#D97706', fontSize: 10 }} />
          <Bar dataKey="probability" radius={[8, 8, 0, 0]}>
            {data.map(item => (
              <Cell key={item.label} fill={item.label === aiContent.riskInsights.monteCarlo.p50 ? '#00B894' : item.label === aiContent.riskInsights.monteCarlo.p80 ? '#D97706' : '#243448'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
