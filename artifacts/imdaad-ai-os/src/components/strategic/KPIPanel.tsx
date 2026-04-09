interface KPI {
  label: string;
  value: string;
  color: string;
}

const kpis: KPI[] = [
  { label: 'Critical Incidents', value: '3', color: 'text-red-400' },
  { label: 'SLA Alerts', value: '5', color: 'text-amber-400' },
  { label: 'Compliance', value: '94%', color: 'text-emerald-400' },
  { label: 'Active Engineers', value: '5', color: 'text-[#EEF3FA]' },
];

export function KPIPanel() {
  return (
    <div className="grid grid-cols-2 gap-2 mb-4">
      {kpis.map(kpi => (
        <div key={kpi.label} className="bg-[rgba(17,32,64,0.85)] border border-[rgba(46,127,255,0.22)] rounded-lg p-3 backdrop-blur-xl hover:-translate-y-0.5 transition-transform duration-150">
          <div className={`text-2xl font-bold ${kpi.color}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {kpi.value}
          </div>
          <div className="text-[11px] text-[#7A94B4] mt-0.5">{kpi.label}</div>
        </div>
      ))}
    </div>
  );
}
