import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { GanttChart, type ProgrammeZoom } from '../components/GanttChart';
import { AIPanel } from '../components/AIPanel';
import { useSelectedProjectCommandData } from '../useProjectCommandData';
import type { Phase } from '../data/phases';

function formatMonthRange(startDate: string, endDate: string) {
  const formatter = new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric' });
  return `${formatter.format(new Date(startDate))} - ${formatter.format(new Date(endDate))}`;
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function contractorsForPhase(phase: Phase) {
  return [phase.contractor, ...(phase.subTasks?.map(task => task.contractor) ?? [])].filter(Boolean);
}

function uniqueContractors(phases: Phase[], fallback: string) {
  const names = phases.flatMap(contractorsForPhase);
  return Array.from(new Set([fallback, ...names])).filter(Boolean);
}

function filterPhasesByContractor(phases: Phase[], activeContractors: string[]) {
  if (!activeContractors.length) return phases;

  return phases.flatMap(phase => {
    const phaseMatches = activeContractors.includes(phase.contractor);
    const matchingSubTasks = phase.subTasks?.filter(task => activeContractors.includes(task.contractor)) ?? [];

    if (phaseMatches) return [phase];
    if (matchingSubTasks.length) return [{ ...phase, subTasks: matchingSubTasks }];
    return [];
  });
}

function buildNarrative(projectName: string, phases: Phase[], fallback: string) {
  const criticalNames = phases.filter(phase => phase.isCritical).map(phase => phase.name).slice(0, 4);
  if (!criticalNames.length) return fallback;
  return `${projectName} critical path is currently driven by ${criticalNames.join(', ')}. The visible programme, delay risk, and variance cards are using the selected project and contractor filter.`;
}

function buildRecoverySuggestion(phases: Phase[], fallback: string) {
  const riskiest = [...phases].sort((a, b) => b.riskProbability - a.riskProbability)[0];
  if (!riskiest) return fallback;
  return `Focus the next recovery meeting on ${riskiest.name}. ${riskiest.contractor} owns the highest visible delay exposure at ${riskiest.riskProbability}%, with ${riskiest.varianceDays < 0 ? `${Math.abs(riskiest.varianceDays)} days of slip risk` : `${riskiest.varianceDays} days of float`} against baseline.`;
}

type DelayRiskDatum = {
  phase: string;
  delayRiskPct: number;
  contractor: string;
  varianceDays: number;
  isCritical: boolean;
};

function delayRiskBand(value: number) {
  if (value >= 60) return { label: 'Critical', color: '#EF4444', bg: 'bg-red-400/10', text: 'text-red-100', border: 'border-red-300/24' };
  if (value >= 40) return { label: 'High', color: '#F97316', bg: 'bg-orange-400/10', text: 'text-orange-100', border: 'border-orange-300/24' };
  if (value >= 20) return { label: 'Watch', color: '#F59E0B', bg: 'bg-amber-300/10', text: 'text-amber-100', border: 'border-amber-300/24' };
  return { label: 'Low', color: '#38D98A', bg: 'bg-emerald-300/10', text: 'text-emerald-100', border: 'border-emerald-300/24' };
}

function formatVarianceLabel(days: number) {
  if (days < 0) return `${Math.abs(days)}d slip risk`;
  if (days > 0) return `${days}d float`;
  return 'On baseline';
}

function DelayRiskTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: DelayRiskDatum }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  const band = delayRiskBand(item.delayRiskPct);

  return (
    <div className="max-w-[260px] rounded-xl border border-[rgba(46,127,255,0.35)] bg-[#07111F] px-3 py-2 text-[#EEF3FA] shadow-2xl shadow-black/40">
      <p className="text-[12px] font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{item.phase}</p>
      <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-white/8 bg-white/[0.035] px-2.5 py-1.5">
        <span className="text-[9px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">Delay risk</span>
        <span className="text-[13px] font-black" style={{ color: band.color }}>{item.delayRiskPct}%</span>
      </div>
      <div className="mt-2 space-y-1 text-[10px] leading-4 text-[#B8C7DB]">
        <p><span className="font-black text-[#DCE8F8]">Band:</span> {band.label}</p>
        <p><span className="font-black text-[#DCE8F8]">Contractor:</span> {item.contractor}</p>
        <p><span className="font-black text-[#DCE8F8]">Critical path:</span> {item.isCritical ? 'Yes' : 'No'}</p>
        <p><span className="font-black text-[#DCE8F8]">Variance:</span> {formatVarianceLabel(item.varianceDays)}</p>
      </div>
      <p className="mt-2 rounded-lg border border-[#7C3AED]/18 bg-[#7C3AED]/10 px-2 py-1.5 text-[9px] font-bold text-[#C4B5FD]">
        AI estimate, not a committed forecast.
      </p>
    </div>
  );
}

export function Programme() {
  const { aiContent, phases, project } = useSelectedProjectCommandData();
  const [zoom, setZoom] = useState<ProgrammeZoom>('Month');
  const [baseline, setBaseline] = useState(true);
  const [critical, setCritical] = useState(true);
  const [contractorOpen, setContractorOpen] = useState(false);
  const [selectedContractors, setSelectedContractors] = useState<string[]>(['All contractors']);
  const [whatIfOpen, setWhatIfOpen] = useState(false);
  const [delayDays, setDelayDays] = useState(14);
  const contractorOptions = useMemo(() => ['All contractors', ...uniqueContractors(phases, project.mainContractor)], [phases, project.mainContractor]);
  const allContractorsSelected = selectedContractors.includes('All contractors') || selectedContractors.length === 0;
  const activeContractors = allContractorsSelected ? [] : selectedContractors.filter(contractor => contractor !== 'All contractors');
  const contractorLabel = allContractorsSelected ? 'All contractors' : activeContractors.length === 1 ? activeContractors[0] : `${activeContractors.length} contractors selected`;
  const filteredPhases = useMemo(() => filterPhasesByContractor(phases, activeContractors), [activeContractors, phases]);
  const delayData: DelayRiskDatum[] = [...filteredPhases]
    .sort((a, b) => b.riskProbability - a.riskProbability)
    .map(phase => ({
      phase: phase.name,
      delayRiskPct: phase.riskProbability,
      contractor: phase.contractor,
      varianceDays: phase.varianceDays,
      isCritical: phase.isCritical,
    }));
  const highestDelayRisk = delayData[0];
  const averageDelayRisk = delayData.length
    ? Math.round(delayData.reduce((sum, item) => sum + item.delayRiskPct, 0) / delayData.length)
    : 0;
  const criticalPhaseCount = delayData.filter(item => item.isCritical).length;
  const varianceEntries = filteredPhases
    .filter(phase => phase.varianceDays !== undefined)
    .map(phase => [phase.name, phase.varianceDays] as const);
  const criticalPathNarrative = buildNarrative(project.name, filteredPhases, aiContent.programmeInsights.criticalPathNarrative);
  const recoverySuggestion = buildRecoverySuggestion(filteredPhases, aiContent.programmeInsights.rescheduleSuggestion);
  const resourceData = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'].map((month, index) => ({ month, workers: Math.round((project.floors * 2.2) + [72, 96, 128, 164, 210, 246, 292, 318][index] * (project.completion / 62)) }));

  useEffect(() => {
    setSelectedContractors(['All contractors']);
    setContractorOpen(false);
  }, [project.id]);

  const toggleContractor = (contractor: string) => {
    if (contractor === 'All contractors') {
      setSelectedContractors(['All contractors']);
      return;
    }

    setSelectedContractors(current => {
      const currentSpecific = current.filter(item => item !== 'All contractors');
      const next = currentSpecific.includes(contractor)
        ? currentSpecific.filter(item => item !== contractor)
        : [...currentSpecific, contractor];

      return next.length ? next : ['All contractors'];
    });
  };

  return (
    <div className="custom-scrollbar h-full overflow-x-hidden overflow-y-auto px-5 py-4 text-[#EEF3FA]" data-demo-anchor="project-programme">
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-3" data-demo-anchor="programme-contractor-accountability">
        <div className="rounded-lg border border-[rgba(46,127,255,0.18)] bg-[#0A1628] px-3 py-2 text-[12px] font-bold text-[#B8C7DB]">{formatMonthRange(project.startDate, project.targetHandover)}</div>
        <div className="flex rounded-lg border border-[rgba(46,127,255,0.18)] bg-[#0A1628] p-1">
          {(['Week', 'Month', 'Quarter'] as const).map(item => <button key={item} onClick={() => setZoom(item)} className={`rounded-md px-3 py-1.5 text-[11px] font-bold ${zoom === item ? 'bg-[#7C3AED]/25 text-[#C4B5FD]' : 'text-[#7A94B4]'}`}>{item}</button>)}
        </div>
        <button onClick={() => setBaseline(current => !current)} className={`rounded-lg border px-3 py-2 text-[11px] font-bold ${baseline ? 'border-[#7C3AED]/40 bg-[#7C3AED]/15 text-[#C4B5FD]' : 'border-[rgba(46,127,255,0.18)] text-[#7A94B4]'}`}>Baseline {baseline ? 'ON' : 'OFF'}</button>
        <button onClick={() => setCritical(current => !current)} className={`rounded-lg border px-3 py-2 text-[11px] font-bold ${critical ? 'border-[#D92B1C]/40 bg-[#D92B1C]/15 text-red-200' : 'border-[rgba(46,127,255,0.18)] text-[#7A94B4]'}`}>Critical Path {critical ? 'ON' : 'OFF'}</button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setContractorOpen(current => !current)}
            className="flex h-10 min-w-[240px] items-center justify-between gap-3 rounded-lg border border-[rgba(46,127,255,0.18)] bg-[#0A1628] px-3 text-left text-[12px] font-bold text-[#B8C7DB] outline-none transition-colors hover:border-[rgba(46,127,255,0.32)]"
            aria-haspopup="listbox"
            aria-expanded={contractorOpen}
          >
            <span className="truncate">{contractorLabel}</span>
            <ChevronDown size={15} className={`shrink-0 transition-transform ${contractorOpen ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {contractorOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16 }}
                className="absolute left-0 top-[calc(100%+6px)] z-50 w-[280px] overflow-hidden rounded-xl border border-[rgba(46,127,255,0.24)] bg-[#07111F] p-1 shadow-2xl shadow-black/40"
                role="listbox"
                aria-label="Filter by contractors"
              >
                {contractorOptions.map(contractor => {
                  const checked = contractor === 'All contractors'
                    ? allContractorsSelected
                    : activeContractors.includes(contractor);

                  return (
                    <button
                      key={contractor}
                      type="button"
                      onClick={() => toggleContractor(contractor)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[12px] font-bold transition-colors ${
                        checked ? 'bg-[#1D7CFF]/18 text-[#DDE6F8]' : 'text-[#9EB2CE] hover:bg-white/5 hover:text-[#EEF3FA]'
                      }`}
                      role="option"
                      aria-selected={checked}
                    >
                      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${checked ? 'border-[#7C3AED] bg-[#7C3AED] text-white' : 'border-[#264468] bg-[#0A1628]'}`}>
                        {checked && <Check size={11} />}
                      </span>
                      <span className="truncate">{contractor}</span>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.9fr)]">
        <div className="space-y-4">
          <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4" data-demo-anchor="programme-critical-path">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Construction Programme</h2>
              <span className="rounded-full border border-[rgba(46,127,255,0.35)] bg-[#0A1628] px-3 py-1 text-[11px] font-bold text-[#B8C7DB]">Zoom: {zoom}</span>
            </div>
            <GanttChart
              phases={filteredPhases}
              mode="full"
              showBaseline={baseline}
              showCriticalPath={critical}
              showWeather
              zoom={zoom}
              projectStart={project.startDate}
              projectEnd={project.targetHandover}
              emptyMessage="No programme activities match the selected contractor filter."
            />
          </section>
          <div className="grid gap-4 2xl:grid-cols-2">
            <div data-demo-anchor="programme-recovery-window">
              <AIPanel title="Recovery Suggestion">
                <p className="text-[12px] leading-5 text-[#DDE6F8]">{recoverySuggestion}</p>
              </AIPanel>
            </div>
            <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4" data-demo-anchor="programme-delayed-activities">
              <h3 className="mb-3 text-sm font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Critical Path Focus</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {varianceEntries.map(([phase, days]) => (
                  <div key={phase} className="rounded-lg border border-[rgba(46,127,255,0.12)] bg-[#0A1628] px-3 py-2">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">{phase}</div>
                    <div className={`mt-1 font-mono text-[15px] font-black ${days < 0 ? 'text-red-300' : 'text-emerald-300'}`}>{days}d</div>
                  </div>
                ))}
                {varianceEntries.length === 0 && (
                  <div className="rounded-lg border border-dashed border-[rgba(46,127,255,0.18)] bg-[#0A1628] px-3 py-4 text-[11px] font-bold text-[#7A94B4]">
                    No variance items match the selected filter.
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
        <aside className="sticky top-0 space-y-4 self-start">
          <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4" data-demo-anchor="programme-handover-risk">
            <div className="mb-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>AI Delay Risk by Phase</h3>
                  <p className="mt-1 text-[10px] leading-4 text-[#8EA7C7]">
                    AI-estimated chance this phase may delay the programme, based on current schedule risk, variance, contractor, and critical-path status.
                  </p>
                </div>
                <span className="rounded-full border border-[#7C3AED]/24 bg-[#7C3AED]/12 px-2.5 py-1 text-[9px] font-black uppercase text-[#C4B5FD]">
                  Delay risk %
                </span>
              </div>
              <div className="mt-3 grid gap-1.5 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
                {[
                  ['Highest', highestDelayRisk ? `${highestDelayRisk.phase} ${highestDelayRisk.delayRiskPct}%` : 'No phase'],
                  ['Average', `${averageDelayRisk}% visible risk`],
                  ['Critical path', `${criticalPhaseCount} phase${criticalPhaseCount === 1 ? '' : 's'}`],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-[rgba(46,127,255,0.12)] bg-[#07111F]/72 px-2.5 py-2">
                    <p className="text-[8px] font-black uppercase tracking-[0.12em] text-[#5A6E88]">{label}</p>
                    <p className="mt-0.5 truncate text-[10px] font-black text-[#DCE8F8]">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-3 flex flex-wrap gap-1.5">
              {[
                ['0-19%', 'Low', 'border-emerald-300/24 bg-emerald-300/10 text-emerald-100'],
                ['20-39%', 'Watch', 'border-amber-300/24 bg-amber-300/10 text-amber-100'],
                ['40-59%', 'High', 'border-orange-300/24 bg-orange-400/10 text-orange-100'],
                ['60%+', 'Critical', 'border-red-300/24 bg-red-400/10 text-red-100'],
              ].map(([range, label, className]) => (
                <span key={label} className={`rounded-full border px-2 py-0.5 text-[8px] font-black uppercase ${className}`}>
                  {range} {label}
                </span>
              ))}
            </div>

            {delayData.length > 0 ? (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={delayData} layout="vertical" margin={{ left: 8, right: 34, top: 4, bottom: 4 }}>
                    <ReferenceArea x1={0} x2={20} fill="#38D98A" fillOpacity={0.04} />
                    <ReferenceArea x1={20} x2={40} fill="#F59E0B" fillOpacity={0.05} />
                    <ReferenceArea x1={40} x2={60} fill="#F97316" fillOpacity={0.06} />
                    <ReferenceArea x1={60} x2={100} fill="#EF4444" fillOpacity={0.05} />
                    <CartesianGrid stroke="rgba(46,127,255,0.18)" strokeDasharray="3 5" />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      ticks={[0, 25, 50, 75, 100]}
                      tickFormatter={value => `${value}%`}
                      tick={{ fill: '#7A94B4', fontSize: 10 }}
                    />
                    <YAxis type="category" dataKey="phase" tick={{ fill: '#B8C7DB', fontSize: 10 }} width={112} />
                    <Tooltip cursor={{ fill: 'rgba(124,58,237,0.10)' }} content={<DelayRiskTooltip />} />
                    <Bar dataKey="delayRiskPct" radius={[0, 8, 8, 0]}>
                      {delayData.map(item => (
                        <Cell key={item.phase} fill={delayRiskBand(item.delayRiskPct).color} />
                      ))}
                      <LabelList
                        dataKey="delayRiskPct"
                        position="right"
                        formatter={(value: number) => `${value}%`}
                        style={{ fill: '#DCE8F8', fontSize: 10, fontWeight: 800 }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[rgba(46,127,255,0.18)] bg-[#07111F]/72 p-4 text-[11px] font-bold text-[#7A94B4]">
                No delay risk data matches the selected contractor filter.
              </div>
            )}
          </section>
          <AIPanel title="Critical Path Narrative"><p className="text-[12px] leading-5 text-[#DDE6F8]">{criticalPathNarrative}</p></AIPanel>
          <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
            <h3 className="mb-3 text-sm font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Resource Histogram</h3>
            <div className="h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resourceData}><XAxis dataKey="month" tick={{ fill: '#7A94B4', fontSize: 10 }} /><YAxis tick={{ fill: '#7A94B4', fontSize: 10 }} /><Bar dataKey="workers" fill="#00B894" radius={[6, 6, 0, 0]} /></BarChart>
              </ResponsiveContainer>
            </div>
            <button onClick={() => setWhatIfOpen(true)} className="mt-3 w-full rounded-lg border border-[#7C3AED]/35 bg-[#7C3AED]/15 px-3 py-2 text-[12px] font-bold text-[#C4B5FD]" data-demo-anchor="programme-recovery-action">Open What-if panel</button>
          </section>
        </aside>
      </div>
      <AnimatePresence>
        {whatIfOpen && (
          <motion.div initial={{ x: 420 }} animate={{ x: 0 }} exit={{ x: 420 }} className="fixed bottom-0 right-0 top-[52px] z-[1200] w-[400px] border-l border-[#7C3AED]/35 bg-[#0A1628] p-5 shadow-2xl">
            <button onClick={() => setWhatIfOpen(false)} className="float-right text-[#7A94B4]">Close</button>
            <h3 className="text-lg font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>What-if Delay</h3>
            <p className="mt-2 text-[12px] leading-5 text-[#B8C7DB]">If Substructure delays by {delayDays} days, downstream MEP and Fit-out activities shift automatically.</p>
            <input type="range" min={0} max={60} value={delayDays} onChange={event => setDelayDays(Number(event.target.value))} className="mt-6 w-full accent-[#7C3AED]" />
            <div className="mt-5 rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
              <div className="text-[11px] font-bold uppercase text-[#7A94B4]">New handover date</div>
              <div className="mt-2 text-2xl font-black text-[#D92B1C]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{formatShortDate(project.forecastCompletion)} + {delayDays}d</div>
              <div className="mt-3 text-[12px] text-[#B8C7DB]">Estimated cost impact: AED {(delayDays * 0.11).toFixed(1)}M</div>
            </div>
            <AIPanel title="AI Recovery Suggestion"><p className="text-[12px] leading-5 text-[#DDE6F8]">{recoverySuggestion}</p></AIPanel>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
