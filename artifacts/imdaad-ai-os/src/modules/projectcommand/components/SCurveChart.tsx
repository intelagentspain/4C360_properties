import { CartesianGrid, ComposedChart, Legend, Line, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { costSeries } from '../data/costs';

type ChartDatum = {
  month: string;
  planned: number;
  actual: number | null;
  earnedValue: number | null;
  forecast: number | null;
};

const data: ChartDatum[] = costSeries.labels.map((month, index) => ({
  month,
  planned: costSeries.planned[index],
  actual: costSeries.actual[index],
  earnedValue: costSeries.earnedValue[index],
  forecast: costSeries.forecast[index],
}));

export function SCurveChart({ height = 210, detailed = false }: { height?: number; detailed?: boolean }) {
  return (
    <div className="h-full min-h-[180px] w-full">
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 18, right: 18, left: -14, bottom: 0 }}>
          <CartesianGrid stroke="rgba(46,127,255,0.18)" strokeDasharray="4 6" />
          <XAxis dataKey="month" tick={{ fill: '#7A94B4', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#7A94B4', fontSize: 10 }} axisLine={false} tickLine={false} unit="M" />
          <Tooltip
            contentStyle={{ background: '#0A1628', border: '1px solid rgba(46,127,255,0.35)', borderRadius: 10, color: '#EEF3FA' }}
            formatter={(value: ValueType, name: NameType) => {
              const displayValue = Array.isArray(value) ? value.join(', ') : value;
              return [displayValue === null ? '-' : `AED ${displayValue}M`, String(name)];
            }}
          />
          {detailed && <Legend wrapperStyle={{ color: '#B8C7DB', fontSize: 11 }} />}
          <ReferenceLine x={costSeries.labels[costSeries.todayIndex]} stroke="#C8A020" strokeDasharray="4 4" label={{ value: 'Today', fill: '#C8A020', fontSize: 10 }} />
          <ReferenceDot x="Feb" y={298} r={4} fill="#D92B1C" stroke="#EEF3FA" label={{ value: 'AED 298M', fill: '#EEF3FA', fontSize: 10 }} />
          <Line type="monotone" dataKey="planned" name="Planned" stroke="#C8A020" strokeDasharray="6 4" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="actual" name="Actual Spend" stroke="#00B894" strokeWidth={2.4} dot={false} connectNulls={false} />
          <Line type="monotone" dataKey="earnedValue" name="Earned Value" stroke="#7C3AED" strokeWidth={2.4} dot={false} connectNulls={false} />
          <Line type="monotone" dataKey="forecast" name="AI Forecast" stroke="#D92B1C" strokeDasharray="5 4" strokeWidth={2.4} dot={false} connectNulls={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
