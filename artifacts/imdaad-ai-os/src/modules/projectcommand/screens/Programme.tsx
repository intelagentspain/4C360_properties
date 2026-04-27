import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { phases } from '../data/phases';
import { aiContent } from '../data/ai-responses';
import { GanttChart } from '../components/GanttChart';
import { AIPanel } from '../components/AIPanel';

const delayData = Object.entries(aiContent.programmeInsights.delayProbabilities).map(([phase, probability]) => ({ phase, probability }));
const resourceData = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'].map((month, index) => ({ month, workers: [72, 96, 128, 164, 210, 246, 292, 318][index] }));

export function Programme() {
  const [zoom, setZoom] = useState<'Week' | 'Month' | 'Quarter'>('Month');
  const [baseline, setBaseline] = useState(true);
  const [critical, setCritical] = useState(true);
  const [whatIfOpen, setWhatIfOpen] = useState(false);
  const [delayDays, setDelayDays] = useState(14);

  return (
    <div className="custom-scrollbar h-full overflow-y-auto bg-[#07101C] p-5 text-[#F0F4FF]">
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-[#1C3050] bg-[#0E1E35] p-3">
        <div className="rounded-lg border border-[#1C3050] bg-[#07101C] px-3 py-2 text-[12px] font-bold text-[#BCC8DC]">Jan 2024 - Apr 2025</div>
        <div className="flex rounded-lg border border-[#1C3050] bg-[#07101C] p-1">
          {(['Week', 'Month', 'Quarter'] as const).map(item => <button key={item} onClick={() => setZoom(item)} className={`rounded-md px-3 py-1.5 text-[11px] font-bold ${zoom === item ? 'bg-[#7C3AED]/25 text-[#C4B5FD]' : 'text-[#5A6E88]'}`}>{item}</button>)}
        </div>
        <button onClick={() => setBaseline(current => !current)} className={`rounded-lg border px-3 py-2 text-[11px] font-bold ${baseline ? 'border-[#7C3AED]/40 bg-[#7C3AED]/15 text-[#C4B5FD]' : 'border-[#1C3050] text-[#5A6E88]'}`}>Baseline {baseline ? 'ON' : 'OFF'}</button>
        <button onClick={() => setCritical(current => !current)} className={`rounded-lg border px-3 py-2 text-[11px] font-bold ${critical ? 'border-[#D92B1C]/40 bg-[#D92B1C]/15 text-red-200' : 'border-[#1C3050] text-[#5A6E88]'}`}>Critical Path {critical ? 'ON' : 'OFF'}</button>
        <select className="rounded-lg border border-[#1C3050] bg-[#07101C] px-3 py-2 text-[12px] font-bold text-[#BCC8DC] outline-none">
          {['All contractors', 'Al Habtoor', 'Voltas', 'Arabian WP', 'Emirates Glass'].map(item => <option key={item}>{item}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-[minmax(0,1.65fr)_minmax(360px,0.9fr)] gap-4">
        <section className="rounded-2xl border border-[#1C3050] bg-[#0E1E35] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black" style={{ fontFamily: 'Syne, sans-serif' }}>Construction Programme</h2>
            <span className="rounded-full border border-[#264468] bg-[#09152A] px-3 py-1 text-[11px] font-bold text-[#BCC8DC]">Zoom: {zoom}</span>
          </div>
          <GanttChart phases={phases} mode="full" showBaseline={baseline} showCriticalPath={critical} showWeather />
        </section>
        <aside className="sticky top-0 space-y-4 self-start">
          <section className="rounded-2xl border border-[#1C3050] bg-[#0E1E35] p-4">
            <h3 className="mb-3 text-sm font-black" style={{ fontFamily: 'Syne, sans-serif' }}>AI Delay Probability</h3>
            <div className="h-[210px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={delayData} layout="vertical" margin={{ left: 10, right: 12 }}>
                  <CartesianGrid stroke="#1C3050" strokeDasharray="3 5" />
                  <XAxis type="number" tick={{ fill: '#5A6E88', fontSize: 10 }} />
                  <YAxis type="category" dataKey="phase" tick={{ fill: '#BCC8DC', fontSize: 10 }} width={96} />
                  <Tooltip contentStyle={{ background: '#09152A', border: '1px solid #264468', borderRadius: 10, color: '#F0F4FF' }} />
                  <Bar dataKey="probability" fill="#7C3AED" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
          <AIPanel title="Critical Path Narrative"><p className="text-[12px] leading-5 text-[#DDE6F8]">{aiContent.programmeInsights.criticalPathNarrative}</p></AIPanel>
          <section className="rounded-2xl border border-[#1C3050] bg-[#0E1E35] p-4">
            <h3 className="mb-3 text-sm font-black" style={{ fontFamily: 'Syne, sans-serif' }}>Baseline Variance</h3>
            <div className="space-y-2">
              {Object.entries(aiContent.programmeInsights.baselineVariance).map(([phase, days]) => (
                <div key={phase} className="flex items-center justify-between rounded-lg bg-[#09152A] px-3 py-2 text-[12px]">
                  <span className="capitalize text-[#BCC8DC]">{phase}</span>
                  <span className={days < 0 ? 'font-mono font-bold text-red-300' : 'font-mono font-bold text-emerald-300'}>{days}d</span>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-2xl border border-[#1C3050] bg-[#0E1E35] p-4">
            <h3 className="mb-3 text-sm font-black" style={{ fontFamily: 'Syne, sans-serif' }}>Resource Histogram</h3>
            <div className="h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resourceData}><XAxis dataKey="month" tick={{ fill: '#5A6E88', fontSize: 10 }} /><YAxis tick={{ fill: '#5A6E88', fontSize: 10 }} /><Bar dataKey="workers" fill="#00B894" radius={[6, 6, 0, 0]} /></BarChart>
              </ResponsiveContainer>
            </div>
            <button onClick={() => setWhatIfOpen(true)} className="mt-3 w-full rounded-lg border border-[#7C3AED]/35 bg-[#7C3AED]/15 px-3 py-2 text-[12px] font-bold text-[#C4B5FD]">Open What-if panel</button>
          </section>
        </aside>
      </div>
      <AnimatePresence>
        {whatIfOpen && (
          <motion.div initial={{ x: 420 }} animate={{ x: 0 }} exit={{ x: 420 }} className="fixed bottom-0 right-0 top-[52px] z-[1200] w-[400px] border-l border-[#7C3AED]/35 bg-[#09152A] p-5 shadow-2xl">
            <button onClick={() => setWhatIfOpen(false)} className="float-right text-[#5A6E88]">Close</button>
            <h3 className="text-lg font-black text-[#F0F4FF]" style={{ fontFamily: 'Syne, sans-serif' }}>What-if Delay</h3>
            <p className="mt-2 text-[12px] leading-5 text-[#BCC8DC]">If Substructure delays by {delayDays} days, downstream MEP and Fit-out activities shift automatically.</p>
            <input type="range" min={0} max={60} value={delayDays} onChange={event => setDelayDays(Number(event.target.value))} className="mt-6 w-full accent-[#7C3AED]" />
            <div className="mt-5 rounded-xl border border-[#1C3050] bg-[#0E1E35] p-4">
              <div className="text-[11px] font-bold uppercase text-[#5A6E88]">New handover date</div>
              <div className="mt-2 text-2xl font-black text-[#D92B1C]" style={{ fontFamily: 'Syne, sans-serif' }}>18 Jun + {delayDays}d</div>
              <div className="mt-3 text-[12px] text-[#BCC8DC]">Estimated cost impact: AED {(delayDays * 0.11).toFixed(1)}M</div>
            </div>
            <AIPanel title="AI Recovery Suggestion"><p className="text-[12px] leading-5 text-[#DDE6F8]">{aiContent.programmeInsights.rescheduleSuggestion}</p></AIPanel>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
