import { Area, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { evmSummary } from '../data/costs';
import { aiContent } from '../data/ai-responses';
import { EVMCards } from '../components/EVMCards';
import { SCurveChart } from '../components/SCurveChart';
import { AIPanel } from '../components/AIPanel';

const derived = [
  { label: 'CPI', value: evmSummary.cpi.toFixed(2), color: '#D97706' },
  { label: 'SPI', value: evmSummary.spi.toFixed(2), color: '#D97706' },
  { label: 'EAC AI', value: `AED ${evmSummary.eac}M`, color: '#7C3AED' },
  { label: 'TCPI', value: evmSummary.tcpi.toFixed(2), color: '#00B894' },
];

const cashflow = aiContent.costInsights.cashflowForecast.labels.map((month, index) => {
  const income = aiContent.costInsights.cashflowForecast.income[index];
  const outflow = aiContent.costInsights.cashflowForecast.outflow[index];
  return { month, income, outflow, net: income - outflow };
});

const breakdown = [
  { name: 'Substructure', value: 45, color: '#C8A020' },
  { name: 'Superstructure', value: 28, color: '#D97706' },
  { name: 'MEP', value: 15, color: '#7C3AED' },
  { name: 'Preliminaries', value: 8, color: '#00B894' },
  { name: 'Other', value: 4, color: '#5A6E88' },
];

export function CostIntelligence() {
  const pending = aiContent.costInsights.changeOrders
    .filter(order => order.status === 'pending')
    .reduce((total, order) => total + order.value, 0);

  return (
    <div className="custom-scrollbar h-full overflow-y-auto bg-[#07101C] p-5 text-[#F0F4FF]">
      <EVMCards />
      <div className="mt-3 grid grid-cols-4 gap-3">
        {derived.map(item => (
          <div key={item.label} className="rounded-xl border border-[#1C3050] bg-[#0E1E35] p-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5A6E88]">{item.label}</div>
            <div className="mt-1 font-mono text-[19px] font-black" style={{ color: item.color }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-[minmax(0,1.35fr)_360px] gap-4">
        <div className="space-y-4">
          <section className="rounded-2xl border border-[#1C3050] bg-[#0E1E35] p-4">
            <h2 className="mb-3 text-lg font-black" style={{ fontFamily: 'Syne, sans-serif' }}>S-curve and Earned Value</h2>
            <SCurveChart height={280} detailed />
            <div className="mt-3 rounded-xl border border-[#D92B1C]/30 bg-[#D92B1C]/10 p-3 text-[12px] font-bold text-red-200">Overrun band: +6.4% · EAC AED 298M · VAC -AED 18M</div>
          </section>
          <section className="rounded-2xl border border-[#1C3050] bg-[#0E1E35] p-4">
            <h2 className="mb-3 text-lg font-black" style={{ fontFamily: 'Syne, sans-serif' }}>Cashflow Forecast</h2>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={cashflow} margin={{ left: -14, right: 14 }}>
                  <CartesianGrid stroke="#1C3050" strokeDasharray="3 5" />
                  <XAxis dataKey="month" tick={{ fill: '#5A6E88', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#5A6E88', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#09152A', border: '1px solid #264468', borderRadius: 10, color: '#F0F4FF' }} />
                  <Bar dataKey="income" fill="#00B894" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="outflow" fill="#D97706" radius={[6, 6, 0, 0]} />
                  <Line dataKey="net" stroke="#7C3AED" strokeWidth={2.4} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </section>
          <AIPanel title="AI Cost Narrative">
            <p className="text-[13px] leading-6 text-[#DDE6F8]">{aiContent.costInsights.narrative}</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {Object.entries(aiContent.costInsights.eacConfidence).map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[#1C3050] bg-[#09152A] p-3">
                  <div className="text-[10px] font-bold uppercase text-[#5A6E88]">{label}</div>
                  <div className="mt-1 text-lg font-black text-[#F0F4FF]" style={{ fontFamily: 'Syne, sans-serif' }}>AED {value}M</div>
                </div>
              ))}
            </div>
          </AIPanel>
        </div>
        <aside className="space-y-4">
          <section className="rounded-2xl border border-[#1C3050] bg-[#0E1E35] p-4">
            <h3 className="mb-3 text-sm font-black" style={{ fontFamily: 'Syne, sans-serif' }}>Spend by Package</h3>
            <div className="h-[230px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={breakdown} dataKey="value" nameKey="name" innerRadius={54} outerRadius={86} paddingAngle={3}>
                    {breakdown.map(item => <Cell key={item.name} fill={item.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#09152A', border: '1px solid #264468', borderRadius: 10, color: '#F0F4FF' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {breakdown.map(item => <div key={item.name} className="flex justify-between text-[12px]"><span style={{ color: item.color }}>{item.name}</span><span className="font-bold">{item.value}%</span></div>)}
            </div>
          </section>
          <section className="rounded-2xl border border-[#1C3050] bg-[#0E1E35] p-4">
            <h3 className="mb-3 text-sm font-black" style={{ fontFamily: 'Syne, sans-serif' }}>Change Order Pipeline</h3>
            <div className="space-y-2">
              {aiContent.costInsights.changeOrders.map(order => (
                <div key={order.id} className="rounded-lg border border-[#1C3050] bg-[#09152A] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold text-[#C4B5FD]">{order.id}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${order.status === 'approved' ? 'bg-[#00B894]/12 text-emerald-200' : 'bg-[#D97706]/12 text-amber-200'}`}>{order.status}</span>
                  </div>
                  <div className="mt-1 text-[12px] font-semibold text-[#F0F4FF]">{order.title}</div>
                  <div className="mt-1 text-[11px] text-[#BCC8DC]">AED {(order.value / 1_000_000).toFixed(2)}M</div>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-lg border border-[#D97706]/30 bg-[#D97706]/12 p-3 text-[12px] font-bold text-amber-200">Pending exposure: AED {(pending / 1_000_000).toFixed(2)}M</div>
          </section>
          <section className="rounded-2xl border border-[#1C3050] bg-[#0E1E35] p-4">
            <h3 className="mb-3 text-sm font-black" style={{ fontFamily: 'Syne, sans-serif' }}>Top Cost Drivers</h3>
            <div className="space-y-2">
              {aiContent.costInsights.topCostDrivers.map(driver => (
                <div key={driver.item} className="flex items-center justify-between gap-3 rounded-lg bg-[#09152A] px-3 py-2">
                  <span className="text-[12px] text-[#BCC8DC]">{driver.item}</span>
                  <span className="font-mono text-[11px] font-bold text-[#F0F4FF]">AED {driver.value}M</span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
