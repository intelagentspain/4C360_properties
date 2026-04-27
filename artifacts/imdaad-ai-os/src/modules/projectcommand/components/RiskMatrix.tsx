import { CartesianGrid, ReferenceArea, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from 'recharts';
import type { Risk } from '../data/risks';
import { setProjectCommandState } from '../state/projectCommandStore';

const severityColor: Record<Risk['severity'], string> = {
  low: '#00B894',
  medium: '#D97706',
  high: '#C8A020',
  critical: '#D92B1C',
};

export function RiskMatrix({ risks }: { risks: Risk[] }) {
  const data = risks.map(risk => ({
    ...risk,
    x: risk.impact,
    y: risk.probability,
    z: risk.score * 25,
    fill: severityColor[risk.severity],
  }));

  return (
    <div className="h-[330px] rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#0A1628] p-3">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 12, right: 18, bottom: 18, left: 0 }}>
          <ReferenceArea x1={1} x2={2.5} y1={1} y2={2.5} fill="#00B894" fillOpacity={0.08} />
          <ReferenceArea x1={2.5} x2={4} y1={1} y2={3.5} fill="#D97706" fillOpacity={0.08} />
          <ReferenceArea x1={3.5} x2={5.5} y1={2.5} y2={4.5} fill="#C8A020" fillOpacity={0.09} />
          <ReferenceArea x1={4} x2={5.5} y1={4} y2={5.5} fill="#D92B1C" fillOpacity={0.12} />
          <CartesianGrid stroke="rgba(46,127,255,0.18)" strokeDasharray="3 5" />
          <XAxis type="number" dataKey="x" domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fill: '#7A94B4', fontSize: 10 }} label={{ value: 'Impact', position: 'insideBottom', fill: '#7A94B4', fontSize: 10 }} />
          <YAxis type="number" dataKey="y" domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fill: '#7A94B4', fontSize: 10 }} label={{ value: 'Probability', angle: -90, position: 'insideLeft', fill: '#7A94B4', fontSize: 10 }} />
          <ZAxis type="number" dataKey="z" range={[80, 520]} />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const risk = payload[0].payload as Risk;
              return (
                <div className="max-w-[260px] rounded-lg border border-[rgba(46,127,255,0.35)] bg-[#0A1628] p-3 text-xs text-[#EEF3FA] shadow-xl">
                  <div className="font-bold">{risk.title}</div>
                  <div className="mt-1 text-[#B8C7DB]">{risk.mitigation}</div>
                </div>
              );
            }}
          />
          <Scatter
            data={data}
            fill="#7C3AED"
            onClick={(point: unknown) => {
              const payload = (point as { payload?: Risk }).payload;
              if (payload) setProjectCommandState({ selectedRisk: payload });
            }}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
