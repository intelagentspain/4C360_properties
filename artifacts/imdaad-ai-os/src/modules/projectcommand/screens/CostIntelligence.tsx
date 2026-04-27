import { Bar, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AIPanel } from '../components/AIPanel';
import { CostIntelligenceFrame } from '../components/CostIntelligenceFrame';
import { useSelectedProjectCommandData } from '../useProjectCommandData';

const breakdown = [
  { name: 'Substructure', value: 45, color: '#C8A020' },
  { name: 'Superstructure', value: 28, color: '#D97706' },
  { name: 'MEP', value: 15, color: '#7C3AED' },
  { name: 'Preliminaries', value: 8, color: '#00B894' },
  { name: 'Other', value: 4, color: '#7A94B4' },
];

export function CostIntelligence() {
  const { aiContent, evmSummary } = useSelectedProjectCommandData();
  const derived = [
    { label: 'CPI', value: evmSummary.cpi.toFixed(2), color: evmSummary.cpi < 1 ? '#D97706' : '#00B894' },
    { label: 'SPI', value: evmSummary.spi.toFixed(2), color: evmSummary.spi < 1 ? '#D97706' : '#00B894' },
    { label: 'EAC AI', value: `AED ${evmSummary.eac}M`, color: '#7C3AED' },
    { label: 'TCPI', value: evmSummary.tcpi.toFixed(2), color: evmSummary.tcpi > 1 ? '#D97706' : '#00B894' },
  ];
  const cashflow = aiContent.costInsights.cashflowForecast.labels.map((month, index) => {
    const income = aiContent.costInsights.cashflowForecast.income[index];
    const outflow = aiContent.costInsights.cashflowForecast.outflow[index];
    return { month, income, outflow, net: income - outflow };
  });
  const pending = aiContent.costInsights.changeOrders
    .filter(order => order.status === 'pending')
    .reduce((total, order) => total + order.value, 0);

  return (
    <div className="custom-scrollbar h-full overflow-x-hidden overflow-y-auto px-5 py-4 text-[#EEF3FA]">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {derived.map(item => (
          <div key={item.label} className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7A94B4]">{item.label}</div>
            <div className="mt-1 font-mono text-[19px] font-black" style={{ color: item.color }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <CostIntelligenceFrame />
          <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
            <h2 className="mb-3 text-lg font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Cashflow Forecast</h2>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={cashflow} margin={{ left: -14, right: 14 }}>
                  <CartesianGrid stroke="rgba(46,127,255,0.18)" strokeDasharray="3 5" />
                  <XAxis dataKey="month" tick={{ fill: '#7A94B4', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#7A94B4', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#0A1628', border: '1px solid rgba(46,127,255,0.35)', borderRadius: 10, color: '#EEF3FA' }} />
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
                <div key={label} className="rounded-lg border border-[rgba(46,127,255,0.18)] bg-[#0A1628] p-3">
                  <div className="text-[10px] font-bold uppercase text-[#7A94B4]">{label}</div>
                  <div className="mt-1 text-lg font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>AED {value}M</div>
                </div>
              ))}
            </div>
          </AIPanel>
          <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
            <h3 className="mb-3 text-sm font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Top Cost Drivers</h3>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {aiContent.costInsights.topCostDrivers.map(driver => (
                <div key={driver.item} className="rounded-lg border border-[rgba(46,127,255,0.12)] bg-[#0A1628] px-3 py-3">
                  <span className="block text-[12px] leading-4 text-[#B8C7DB]">{driver.item}</span>
                  <span className="mt-2 block font-mono text-[12px] font-bold text-[#EEF3FA]">AED {driver.value}M</span>
                </div>
              ))}
            </div>
          </section>
        </div>
        <aside className="space-y-4">
          <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
            <h3 className="mb-3 text-sm font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Spend by Package</h3>
            <div className="h-[230px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={breakdown} dataKey="value" nameKey="name" innerRadius={54} outerRadius={86} paddingAngle={3}>
                    {breakdown.map(item => <Cell key={item.name} fill={item.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0A1628', border: '1px solid rgba(46,127,255,0.35)', borderRadius: 10, color: '#EEF3FA' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {breakdown.map(item => <div key={item.name} className="flex justify-between text-[12px]"><span style={{ color: item.color }}>{item.name}</span><span className="font-bold">{item.value}%</span></div>)}
            </div>
          </section>
          <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
            <h3 className="mb-3 text-sm font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Change Order Pipeline</h3>
            <div className="space-y-2">
              {aiContent.costInsights.changeOrders.map(order => (
                <div key={order.id} className="rounded-lg border border-[rgba(46,127,255,0.18)] bg-[#0A1628] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold text-[#C4B5FD]">{order.id}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${order.status === 'approved' ? 'bg-[#00B894]/12 text-emerald-200' : 'bg-[#D97706]/12 text-amber-200'}`}>{order.status}</span>
                  </div>
                  <div className="mt-1 text-[12px] font-semibold text-[#EEF3FA]">{order.title}</div>
                  <div className="mt-1 text-[11px] text-[#B8C7DB]">AED {(order.value / 1_000_000).toFixed(2)}M</div>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-lg border border-[#D97706]/30 bg-[#D97706]/12 p-3 text-[12px] font-bold text-amber-200">Pending exposure: AED {(pending / 1_000_000).toFixed(2)}M</div>
          </section>
        </aside>
      </div>
    </div>
  );
}
