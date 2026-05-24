import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, ChevronRight, X, BarChart2 } from 'lucide-react';
import { mockBenchmarkData } from '@/data/mockData';
import { type ToastFn } from '@/lib/ui';

const CLIENTS    = ['All Properties', 'DevelopmentX — DSOA', 'Gate Avenue REIT', 'Business Bay Corp'];
const TIME_RANGE = ['Last 7 days', 'Last 30 days', 'Last 90 days', 'YTD'];
const REGIONS    = ['All Regions', 'Dubai East', 'Downtown', 'Dubai Marina', 'Jumeirah'];

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-[#EEF3FA] font-bold text-sm" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{title}</h3>
      <p className="text-[11px] text-[#7A94B4]">{subtitle}</p>
    </div>
  );
}

function HBar({ label, value, max, color, onClick, active }: {
  label: string; value: number; max: number; color: string; onClick: () => void; active: boolean;
}) {
  return (
    <button onClick={onClick} className={`w-full text-left group transition-all rounded-lg px-2 py-1.5 hover:bg-white/[0.03] ${active ? 'bg-white/[0.05]' : ''}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-[#EEF3FA] font-medium">{label}</span>
        <span className="text-[11px] font-bold" style={{ color }}>{value}{typeof value === 'number' && max === 100 ? '%' : ''}</span>
      </div>
      <div className="h-2 bg-[#0A1628] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(value / max) * 100}%` }}
          transition={{ duration: 0.6 }}
          className="h-full rounded-full cursor-pointer"
          style={{ background: color }}
        />
      </div>
    </button>
  );
}

function DrillPanel({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
      className="bg-[rgba(17,32,64,0.95)] border border-[rgba(46,127,255,0.3)] rounded-xl p-4 mt-2"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[12px] text-[#EEF3FA] font-bold">{title}</span>
        <button onClick={onClose} className="text-[#7A94B4] hover:text-white"><X size={13} /></button>
      </div>
      {children}
    </motion.div>
  );
}

function TrendBadge({ value }: { value: number }) {
  if (value > 0) return <span className="flex items-center gap-0.5 text-red-400 text-[10px] font-bold"><TrendingUp size={9} />+{value}%</span>;
  if (value < 0) return <span className="flex items-center gap-0.5 text-emerald-400 text-[10px] font-bold"><TrendingDown size={9} />{value}%</span>;
  return <span className="flex items-center gap-0.5 text-[#7A94B4] text-[10px]"><Minus size={9} />—</span>;
}

interface Props { onToast: ToastFn }

export function Benchmark({ onToast }: Props) {
  const [client,    setClient]    = useState(CLIENTS[0]);
  const [timeRange, setTimeRange] = useState(TIME_RANGE[1]);
  const [region,    setRegion]    = useState(REGIONS[0]);
  const [siteDrill,   setSiteDrill]   = useState<string | null>(null);
  const [vendorDrill, setVendorDrill] = useState<string | null>(null);
  const [regionDrill, setRegionDrill] = useState<string | null>(null);

  const { sites, vendors, regions } = mockBenchmarkData;

  const slaColor  = (v: number) => v >= 90 ? '#38D98A' : v >= 80 ? '#FF9B38' : '#FF4B4B';
  const riskColor = (v: number) => v >= 70 ? '#FF4B4B' : v >= 50 ? '#FF9B38' : '#38D98A';

  return (
    <div className="h-full flex flex-col overflow-hidden" data-demo-anchor="benchmark-page">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(46,127,255,0.15)] flex-shrink-0">
        <div>
          <h2 className="text-[#EEF3FA] font-bold text-base" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Benchmarking</h2>
          <p className="text-[11px] text-[#7A94B4]">Compare performance across sites, vendors, and regions</p>
        </div>
        <div className="flex items-center gap-1.5">
          <BarChart2 size={14} className="text-[#2E7FFF]" />
          <span className="text-[10px] text-[#7A94B4]">4C360 Analytics</span>
        </div>
      </div>

      <div className="flex items-center gap-2 px-5 py-2.5 border-b border-[rgba(46,127,255,0.08)] flex-shrink-0 overflow-x-auto no-scrollbar">
        {[
          { label: 'Client', value: client, options: CLIENTS, set: setClient },
          { label: 'Region', value: region, options: REGIONS, set: setRegion },
          { label: 'Period', value: timeRange, options: TIME_RANGE, set: setTimeRange },
        ].map(f => (
          <div key={f.label} className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[10px] text-[#7A94B4]">{f.label}:</span>
            <select
              value={f.value}
              onChange={e => { f.set(e.target.value); onToast(`Filter: ${f.label} → ${e.target.value}`, 'info'); }}
              className="text-[11px] text-[#EEF3FA] bg-[#112040] border border-[rgba(46,127,255,0.25)] rounded-lg px-2 py-1 outline-none cursor-pointer"
            >
              {f.options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-6" data-demo-anchor="benchmark-scroll-container">
        <section data-demo-anchor="benchmark-site-section">
          <SectionHeader title="A · Site Comparison" subtitle="SLA performance, incident volume, and compliance across all managed sites" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-[rgba(17,32,64,0.85)] border border-[rgba(46,127,255,0.2)] rounded-xl p-4">
              <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-3">SLA Performance</div>
              <div className="space-y-1">
                {sites.map(s => (
                  <HBar key={s.name} label={s.name} value={s.sla} max={100} color={slaColor(s.sla)}
                    active={siteDrill === s.name}
                    onClick={() => setSiteDrill(siteDrill === s.name ? null : s.name)} />
                ))}
              </div>
            </div>
            <div className="bg-[rgba(17,32,64,0.85)] border border-[rgba(46,127,255,0.2)] rounded-xl p-4">
              <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-3">Incident Volume</div>
              <div className="space-y-1">
                {sites.map(s => (
                  <HBar key={s.name} label={s.name} value={s.incidents} max={70} color="#2E7FFF"
                    active={siteDrill === s.name}
                    onClick={() => setSiteDrill(siteDrill === s.name ? null : s.name)} />
                ))}
              </div>
            </div>
            <div className="bg-[rgba(17,32,64,0.85)] border border-[rgba(46,127,255,0.2)] rounded-xl p-4">
              <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-3">Compliance Score</div>
              <div className="space-y-1">
                {sites.map(s => (
                  <HBar key={s.name} label={s.name} value={s.compliance} max={100} color={slaColor(s.compliance)}
                    active={siteDrill === s.name}
                    onClick={() => setSiteDrill(siteDrill === s.name ? null : s.name)} />
                ))}
              </div>
            </div>
          </div>

          <AnimatePresence>
            {siteDrill && (() => {
              const site = sites.find(s => s.name === siteDrill)!;
              return (
                <DrillPanel title={`${site.name} — Detail`} onClose={() => setSiteDrill(null)}>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {[
                      { label: 'SLA Rate',    value: `${site.sla}%`,          color: slaColor(site.sla) },
                      { label: 'Incidents',   value: site.incidents,           color: '#2E7FFF' },
                      { label: 'Compliance',  value: `${site.compliance}%`,   color: slaColor(site.compliance) },
                    ].map(k => (
                      <div key={k.label} className="bg-[#0A1628] rounded-lg p-2.5 text-center">
                        <div className="text-base font-bold" style={{ color: k.color }}>{k.value}</div>
                        <div className="text-[9px] text-[#7A94B4]">{k.label}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-[#7A94B4]">
                    {site.sla >= 90 ? `${site.name} is a top performer with ${site.sla}% SLA compliance. Low incident density and high resolution rates.`
                      : `${site.name} is underperforming on SLA at ${site.sla}%. Review staffing levels and response protocols for this site.`}
                  </p>
                </DrillPanel>
              );
            })()}
          </AnimatePresence>
        </section>

        <section data-demo-anchor="benchmark-vendor-section">
          <SectionHeader title="B · Vendor Comparison" subtitle="SLA breaches, average resolution time, and repeat failure rates by vendor" />
          <div className="bg-[rgba(17,32,64,0.85)] border border-[rgba(46,127,255,0.2)] rounded-xl overflow-hidden">
            <div className="grid grid-cols-[2fr_1fr_1.2fr_1fr_1fr] px-4 py-2 text-[9px] text-[#7A94B4] uppercase tracking-wide border-b border-[rgba(46,127,255,0.1)]">
              {['Vendor', 'SLA Breaches', 'Avg Resolution', 'Repeat Fail', 'Rating'].map(h => <div key={h}>{h}</div>)}
            </div>
            {vendors.map(v => {
              const isSelected = vendorDrill === v.name;
              return (
                <div key={v.name}>
                  <button
                    onClick={() => setVendorDrill(isSelected ? null : v.name)}
                    className={`w-full text-left grid grid-cols-[2fr_1fr_1.2fr_1fr_1fr] px-4 py-3 border-b border-[rgba(46,127,255,0.08)] hover:bg-white/[0.02] transition-all items-center ${isSelected ? 'bg-white/[0.04]' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <ChevronRight size={11} className={`text-[#7A94B4] transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                      <span className="text-[12px] text-[#EEF3FA] font-semibold">{v.name}</span>
                    </div>
                    <span className={`text-[12px] font-bold ${v.slaBreaches <= 3 ? 'text-emerald-400' : v.slaBreaches <= 7 ? 'text-amber-400' : 'text-red-400'}`}>
                      {v.slaBreaches}
                    </span>
                    <span className={`text-[12px] font-medium ${v.avgResolution <= 45 ? 'text-emerald-400' : v.avgResolution <= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                      {v.avgResolution} min
                    </span>
                    <span className={`text-[12px] font-medium ${v.repeatFailure <= 5 ? 'text-emerald-400' : v.repeatFailure <= 10 ? 'text-amber-400' : 'text-red-400'}`}>
                      {v.repeatFailure}%
                    </span>
                    <span className="text-[12px] text-amber-400 font-bold">⭐ {v.rating}</span>
                  </button>
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-4 pt-2 grid grid-cols-3 gap-2 bg-[#0A1628]/50">
                          {[
                            { label: 'SLA Breach Rate', value: `${v.slaBreaches} this period`, note: v.slaBreaches <= 3 ? 'Within acceptable threshold' : 'Exceeds target — review required' },
                            { label: 'Avg Resolution',  value: `${v.avgResolution} min`,       note: v.avgResolution <= 45 ? 'On target' : 'Above 45 min SLA target' },
                            { label: 'Repeat Failures', value: `${v.repeatFailure}%`,           note: v.repeatFailure <= 5 ? 'Low recurrence — good' : 'High recurrence — root cause needed' },
                          ].map(k => (
                            <div key={k.label} className="bg-[#112040] rounded-lg p-2.5">
                              <div className="text-[9px] text-[#7A94B4] uppercase">{k.label}</div>
                              <div className="text-[12px] text-[#EEF3FA] font-bold mt-0.5">{k.value}</div>
                              <div className="text-[9px] text-[#7A94B4] mt-0.5">{k.note}</div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>

        <section data-demo-anchor="benchmark-region-section">
          <SectionHeader title="C · Region Comparison" subtitle="Incident density, risk concentration, and performance trends by geographic area" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-[rgba(17,32,64,0.85)] border border-[rgba(46,127,255,0.2)] rounded-xl p-4">
              <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-3">Incident Density (per km²)</div>
              <div className="space-y-1">
                {regions.map(r => (
                  <HBar key={r.name} label={r.name} value={r.incidentDensity} max={8} color={riskColor(r.riskScore)}
                    active={regionDrill === r.name}
                    onClick={() => setRegionDrill(regionDrill === r.name ? null : r.name)} />
                ))}
              </div>
            </div>
            <div className="bg-[rgba(17,32,64,0.85)] border border-[rgba(46,127,255,0.2)] rounded-xl p-4">
              <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-3">Risk Score &amp; Trend</div>
              <div className="space-y-2">
                {regions.map(r => (
                  <button
                    key={r.name}
                    onClick={() => setRegionDrill(regionDrill === r.name ? null : r.name)}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/[0.02] transition-all ${regionDrill === r.name ? 'bg-white/[0.04]' : ''}`}
                  >
                    <span className="text-[11px] text-[#EEF3FA]">{r.name}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1.5 bg-[#0A1628] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${r.riskScore}%`, background: riskColor(r.riskScore) }} />
                      </div>
                      <span className="text-[10px] font-bold w-6 text-right" style={{ color: riskColor(r.riskScore) }}>{r.riskScore}</span>
                      <TrendBadge value={r.trend} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <AnimatePresence>
            {regionDrill && (() => {
              const reg = regions.find(r => r.name === regionDrill)!;
              return (
                <DrillPanel title={`${reg.name} — Region Detail`} onClose={() => setRegionDrill(null)}>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {[
                      { label: 'Density',   value: `${reg.incidentDensity}/km²`, color: riskColor(reg.riskScore) },
                      { label: 'Risk Score', value: reg.riskScore,               color: riskColor(reg.riskScore) },
                      { label: 'Trend',     value: reg.trend > 0 ? `+${reg.trend}%` : `${reg.trend}%`, color: reg.trend > 0 ? '#FF4B4B' : '#38D98A' },
                    ].map(k => (
                      <div key={k.label} className="bg-[#0A1628] rounded-lg p-2.5 text-center">
                        <div className="text-base font-bold" style={{ color: k.color }}>{k.value}</div>
                        <div className="text-[9px] text-[#7A94B4]">{k.label}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-[#7A94B4]">
                    {reg.trend > 15
                      ? `${reg.name} is showing a significant upward trend (+${reg.trend}%). Recommend increasing coverage and reviewing incident patterns for systemic causes.`
                      : reg.trend < 0
                      ? `${reg.name} is improving — risk concentration is declining. Current interventions appear effective.`
                      : `${reg.name} is stable. Monitor for seasonal demand shifts.`}
                  </p>
                </DrillPanel>
              );
            })()}
          </AnimatePresence>
        </section>
        <div data-demo-anchor="benchmark-bottom" className="h-1" />
      </div>
    </div>
  );
}
