import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { aiContent } from '../data/ai-responses';

export function MonteCarlo() {
  const data = aiContent.riskInsights.monteCarlo.bins;
  return (
    <div className="h-[240px] rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#0A1628] p-3">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 16, right: 18, left: -16, bottom: 0 }}>
          <CartesianGrid stroke="rgba(46,127,255,0.18)" strokeDasharray="3 5" />
          <XAxis dataKey="label" tick={{ fill: '#7A94B4', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#7A94B4', fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
          <Tooltip contentStyle={{ background: '#0A1628', border: '1px solid rgba(46,127,255,0.35)', borderRadius: 10, color: '#EEF3FA' }} formatter={(value: number) => [`${value}% of simulations`, 'Probability']} />
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
