import { useEffect, useMemo, useState } from 'react';
import { Bell, Check, ChevronDown, FileText, Mail, MessageCircle, Mic, Send, Sparkles, X } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { GanttChart } from '../components/GanttChart';
import { AIPanel } from '../components/AIPanel';
import { useSelectedProjectCommandData } from '../useProjectCommandData';

function formatMonthRange(startDate: string, endDate: string) {
  const formatter = new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric' });
  return `${formatter.format(new Date(startDate))} - ${formatter.format(new Date(endDate))}`;
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function ProgrammeAgentModal({ onClose }: { onClose: () => void }) {
  const agentChannels = [
    { label: 'Voice brief', detail: 'Talk through progress, constraints, and site updates.', icon: Mic },
    { label: 'Chat', detail: 'Ask what changed, what is late, and what to recover first.', icon: MessageCircle },
    { label: 'Email', detail: 'Draft weekly programme updates for stakeholders.', icon: Mail },
    { label: 'WhatsApp', detail: 'Prepare short reminders for contractors and field teams.', icon: Send },
  ];

  const programmeSkills = [
    { title: 'Take a programme brief', detail: 'Capture spoken updates and turn them into phase notes, blockers, and recovery actions.' },
    { title: 'Advise on critical path', detail: 'Explain which activities are driving handover risk and where float is being consumed.' },
    { title: 'Create reminders', detail: 'Prepare follow-ups for overdue approvals, contractor submissions, and upcoming milestones.' },
    { title: 'Generate reports', detail: 'Draft a weekly look-ahead, delay summary, executive note, or contractor action list.' },
  ];

  const quickPrompts = [
    'Summarise this week’s critical path risk',
    'What should I ask the main contractor?',
    'Draft a 2-week look-ahead report',
    'Create reminders for overdue approvals',
    'Explain the impact of a 14-day MEP delay',
    'Prepare a recovery meeting agenda',
  ];

  return (
    <div className="fixed inset-0 z-[2600] flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-label="Close Programme Agent" />
      <div className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[rgba(46,127,255,0.24)] bg-[#0A1628] shadow-2xl">
        <div className="flex shrink-0 items-start justify-between border-b border-[rgba(46,127,255,0.14)] bg-[linear-gradient(135deg,rgba(124,58,237,0.18),rgba(9,21,42,0.96),rgba(217,43,28,0.08))] px-5 py-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-[#C4B5FD]">Dedicated AI agent</div>
            <h3 className="mt-1 text-xl font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Programme Agent</h3>
            <p className="mt-1 max-w-2xl text-[12px] leading-5 text-[#8EA7C7]">Listen to progress briefs, speak back with schedule advice, create reminders, draft reports, and help managers protect the critical path.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-[#8EA7C7] hover:bg-white/5 hover:text-white" aria-label="Close Programme Agent"><X size={18} /></button>
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-5">
          <div className="mb-4 grid gap-3 md:grid-cols-4">
            {agentChannels.map(({ label, detail, icon: Icon }) => (
              <button key={label} className="rounded-2xl border border-[#7C3AED]/24 bg-[#7C3AED]/10 p-4 text-left transition-colors hover:border-[#7C3AED]/55 hover:bg-[#7C3AED]/16">
                <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#7C3AED]/22 text-[#C4B5FD]"><Icon size={16} /></span>
                <p className="text-[12px] font-black text-[#EEF3FA]">{label}</p>
                <p className="mt-1 text-[10px] leading-4 text-[#8EA7C7]">{detail}</p>
              </button>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
            <div className="rounded-2xl border border-[rgba(46,127,255,0.16)] bg-[#07111F] p-4">
              <div className="mb-4 flex items-center gap-2 text-[14px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                <Sparkles size={16} className="text-[#C4B5FD]" />
                What this agent can do
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {programmeSkills.map(item => (
                  <div key={item.title} className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#0A1628] p-3">
                    <p className="text-[12px] font-black text-[#DDE6F8]">{item.title}</p>
                    <p className="mt-1 text-[11px] leading-5 text-[#8EA7C7]">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-[#C8A020]/20 bg-[#C8A020]/8 p-4">
                <div className="mb-3 flex items-center gap-2 text-[14px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  <Bell size={16} className="text-[#FDE68A]" />
                  Reminder setup
                </div>
                <div className="space-y-2">
                  {['Waterproofing sign-off due in 3 days', 'MEP drawing approval pending', 'Contractor look-ahead required every Thursday'].map(item => (
                    <label key={item} className="flex items-center gap-2 rounded-xl bg-[#07111F]/80 px-3 py-2 text-[11px] font-bold text-[#B8C7DB]">
                      <input type="checkbox" defaultChecked className="h-4 w-4 accent-[#C8A020]" />
                      {item}
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[rgba(46,127,255,0.16)] bg-[#07111F] p-4">
                <div className="mb-3 flex items-center gap-2 text-[14px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  <FileText size={16} className="text-cyan-300" />
                  Quick prompts
                </div>
                <div className="flex flex-wrap gap-2">
                  {quickPrompts.map(prompt => (
                    <button key={prompt} className="rounded-full border border-[rgba(46,127,255,0.18)] bg-[#0A1628] px-3 py-1.5 text-[10px] font-bold text-[#B8C7DB] hover:border-[#7C3AED]/45 hover:text-white">
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-[rgba(46,127,255,0.14)] bg-[#09152A] px-5 py-4">
          <button onClick={onClose} className="rounded-xl border border-[rgba(46,127,255,0.22)] px-4 py-2 text-[12px] font-bold text-[#B8C7DB] hover:bg-white/5">Close</button>
          <button onClick={onClose} className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-5 py-2 text-[12px] font-black text-white hover:bg-[#6D28D9]"><Mic size={14} /> Start voice brief</button>
        </div>
      </div>
    </div>
  );
}

export function Programme() {
  const { aiContent, phases, project } = useSelectedProjectCommandData();
  const [zoom, setZoom] = useState<'Week' | 'Month' | 'Quarter'>('Month');
  const [baseline, setBaseline] = useState(true);
  const [critical, setCritical] = useState(true);
  const [contractorOpen, setContractorOpen] = useState(false);
  const [selectedContractors, setSelectedContractors] = useState<string[]>(['All contractors']);
  const [whatIfOpen, setWhatIfOpen] = useState(false);
  const [showProgrammeAgent, setShowProgrammeAgent] = useState(false);
  const [delayDays, setDelayDays] = useState(14);
  const contractorOptions = useMemo(() => ['All contractors', project.mainContractor, 'MEP Contractor', 'Facade Vendor', 'Specialist Subcontractor'], [project.mainContractor]);
  const allContractorsSelected = selectedContractors.includes('All contractors') || selectedContractors.length === 0;
  const activeContractors = allContractorsSelected ? [] : selectedContractors.filter(contractor => contractor !== 'All contractors');
  const contractorLabel = allContractorsSelected ? 'All contractors' : activeContractors.length === 1 ? activeContractors[0] : `${activeContractors.length} contractors selected`;
  const delayData = Object.entries(aiContent.programmeInsights.delayProbabilities).map(([phase, probability]) => ({ phase, probability }));
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
    <div className="custom-scrollbar h-full overflow-x-hidden overflow-y-auto px-5 py-4 text-[#EEF3FA]">
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-3">
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
          <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Construction Programme</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowProgrammeAgent(true)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[linear-gradient(135deg,#3B82F6,#7C3AED)] px-3 text-[11px] font-black text-white shadow-[0_0_22px_rgba(124,58,237,0.32)] transition-transform hover:scale-[1.03]"
                  aria-label="Open Programme AI Agent"
                >
                  <Sparkles size={14} />
                  AI
                </button>
                <span className="rounded-full border border-[rgba(46,127,255,0.35)] bg-[#0A1628] px-3 py-1 text-[11px] font-bold text-[#B8C7DB]">Zoom: {zoom}</span>
              </div>
            </div>
            <GanttChart phases={phases} mode="full" showBaseline={baseline} showCriticalPath={critical} showWeather />
          </section>
          <div className="grid gap-4 2xl:grid-cols-2">
            <AIPanel title="Recovery Suggestion">
              <p className="text-[12px] leading-5 text-[#DDE6F8]">{aiContent.programmeInsights.rescheduleSuggestion}</p>
            </AIPanel>
            <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
              <h3 className="mb-3 text-sm font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Critical Path Focus</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {Object.entries(aiContent.programmeInsights.baselineVariance).map(([phase, days]) => (
                  <div key={phase} className="rounded-lg border border-[rgba(46,127,255,0.12)] bg-[#0A1628] px-3 py-2">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">{phase}</div>
                    <div className={`mt-1 font-mono text-[15px] font-black ${days < 0 ? 'text-red-300' : 'text-emerald-300'}`}>{days}d</div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
        <aside className="sticky top-0 space-y-4 self-start">
          <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
            <h3 className="mb-3 text-sm font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>AI Delay Probability</h3>
            <div className="h-[210px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={delayData} layout="vertical" margin={{ left: 10, right: 12 }}>
                  <CartesianGrid stroke="rgba(46,127,255,0.18)" strokeDasharray="3 5" />
                  <XAxis type="number" tick={{ fill: '#7A94B4', fontSize: 10 }} />
                  <YAxis type="category" dataKey="phase" tick={{ fill: '#B8C7DB', fontSize: 10 }} width={96} />
                  <Tooltip contentStyle={{ background: '#0A1628', border: '1px solid rgba(46,127,255,0.35)', borderRadius: 10, color: '#EEF3FA' }} />
                  <Bar dataKey="probability" fill="#7C3AED" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
          <AIPanel title="Critical Path Narrative"><p className="text-[12px] leading-5 text-[#DDE6F8]">{aiContent.programmeInsights.criticalPathNarrative}</p></AIPanel>
          <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
            <h3 className="mb-3 text-sm font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Resource Histogram</h3>
            <div className="h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resourceData}><XAxis dataKey="month" tick={{ fill: '#7A94B4', fontSize: 10 }} /><YAxis tick={{ fill: '#7A94B4', fontSize: 10 }} /><Bar dataKey="workers" fill="#00B894" radius={[6, 6, 0, 0]} /></BarChart>
              </ResponsiveContainer>
            </div>
            <button onClick={() => setWhatIfOpen(true)} className="mt-3 w-full rounded-lg border border-[#7C3AED]/35 bg-[#7C3AED]/15 px-3 py-2 text-[12px] font-bold text-[#C4B5FD]">Open What-if panel</button>
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
            <AIPanel title="AI Recovery Suggestion"><p className="text-[12px] leading-5 text-[#DDE6F8]">{aiContent.programmeInsights.rescheduleSuggestion}</p></AIPanel>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showProgrammeAgent && (
          <motion.div key="programme-agent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ProgrammeAgentModal onClose={() => setShowProgrammeAgent(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
