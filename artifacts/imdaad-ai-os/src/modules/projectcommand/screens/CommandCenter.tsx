import { motion } from 'framer-motion';
import { ArrowRight, Brain, CalendarClock, TrendingUp } from 'lucide-react';
import { aiContent } from '../data/ai-responses';
import { project } from '../data/project';
import { phases } from '../data/phases';
import { HealthScoreGauge } from '../components/HealthScoreGauge';
import { GanttChart } from '../components/GanttChart';
import { EVMCards } from '../components/EVMCards';
import { SCurveChart } from '../components/SCurveChart';
import { SiteMapSVG } from '../components/SiteMapSVG';
import { ScenarioCard } from '../components/ScenarioCard';
import { CriticalMilestones } from '../components/CriticalMilestones';
import { AIPanel } from '../components/AIPanel';
import { useProjectCommandStore, setProjectCommandState } from '../state/projectCommandStore';
import type { ProjectCommandScreen } from '../types';

const kpis = [
  { label: 'Completion', value: `${project.completion}%`, tone: '#00B894', bar: project.completion },
  { label: 'Budget Used', value: `${project.budgetUsed}%`, tone: '#C8A020' },
  { label: 'Days to Handover', value: project.daysToHandover, tone: '#F0F4FF' },
  { label: 'CPI', value: project.cpi.toFixed(2), tone: '#D97706', mono: true },
  { label: 'SPI', value: project.spi.toFixed(2), tone: '#7C3AED', mono: true },
  { label: 'Float Remaining', value: `${project.floatRemaining}d`, tone: '#D92B1C' },
];

function Sparkline() {
  const points = aiContent.healthScore.forecast30d.sparkline;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const path = points.map((point, index) => {
    const x = (index / (points.length - 1)) * 100;
    const y = 36 - ((point - min) / (max - min || 1)) * 30;
    return `${x},${y}`;
  }).join(' ');
  return <svg viewBox="0 0 100 40" className="h-10 w-28"><polyline points={path} fill="none" stroke="#00B894" strokeWidth="3" strokeLinecap="round" /></svg>;
}

export function CommandCenter({ goTo }: { goTo: (screen: ProjectCommandScreen) => void }) {
  const { activeScenario } = useProjectCommandStore();

  return (
    <div className="custom-scrollbar h-full overflow-y-auto bg-[#07101C] p-5 text-[#F0F4FF]">
      <section className="mb-4 rounded-2xl border border-[#1C3050] bg-[linear-gradient(135deg,#09152A,#0E1E35)] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
        <div className="grid grid-cols-[110px_1fr_330px] items-center gap-5">
          <HealthScoreGauge score={project.healthScore} status={project.healthStatus} />
          <div className="border-l-2 border-[#00B894] pl-5">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#C4B5FD]"><Brain size={14} /> AI · Top Threat</div>
            <h2 className="max-w-5xl text-[18px] font-black leading-6" style={{ fontFamily: 'Syne, sans-serif' }}>{aiContent.healthScore.topThreat}</h2>
            <p className="mt-2 text-[12px] leading-5 text-[#BCC8DC]">{aiContent.healthScore.recommendedAction}</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              ['Completion', `${aiContent.healthScore.forecast30d.completion}%`],
              ['Spend', `AED ${aiContent.healthScore.forecast30d.spend}M`],
              ['New Risks', aiContent.healthScore.forecast30d.newRisks],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-[#1C3050] bg-[#07101C]/70 p-3">
                <div className="text-[10px] font-bold uppercase text-[#5A6E88]">{label}</div>
                <div className="mt-1 text-lg font-black text-[#F0F4FF]" style={{ fontFamily: 'Syne, sans-serif' }}>{value}</div>
              </div>
            ))}
            <div className="col-span-3 rounded-xl border border-[#1C3050] bg-[#07101C]/70 px-3 py-2"><Sparkline /></div>
          </div>
        </div>
      </section>

      <div className="mb-4 grid grid-cols-6 gap-3">
        {kpis.map((kpi, index) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="relative overflow-hidden rounded-xl border border-[#1C3050] bg-[#0E1E35] p-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5A6E88]">{kpi.label}</div>
            <div className={`mt-2 text-[24px] font-black ${kpi.mono ? 'font-mono' : ''}`} style={{ color: kpi.tone, fontFamily: kpi.mono ? 'JetBrains Mono, monospace' : 'Syne, sans-serif' }}>{kpi.value}</div>
            {'bar' in kpi && <motion.div initial={{ width: 0 }} animate={{ width: `${kpi.bar}%` }} className="absolute bottom-0 left-0 h-1 bg-[#00B894]" />}
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-[1.5fr_330px] gap-4">
        <div className="space-y-4">
          <section className="rounded-2xl border border-[#1C3050] bg-[#0E1E35] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-black" style={{ fontFamily: 'Syne, sans-serif' }}>Programme Intelligence</h3>
              <button onClick={() => goTo('programme')} className="flex items-center gap-1 text-[12px] font-bold text-[#C4B5FD]">Full Gantt <ArrowRight size={14} /></button>
            </div>
            <GanttChart phases={phases} mode="compact" showCriticalPath />
          </section>
          <section className="rounded-2xl border border-[#1C3050] bg-[#0E1E35] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-black" style={{ fontFamily: 'Syne, sans-serif' }}>Cost Intelligence</h3>
              <button onClick={() => goTo('cost')} className="flex items-center gap-1 text-[12px] font-bold text-[#C4B5FD]">EVM Detail <ArrowRight size={14} /></button>
            </div>
            <EVMCards compact />
            <div className="mt-3"><SCurveChart height={210} /></div>
            <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-[#D92B1C]/30 bg-[#D92B1C]/10 px-3 py-1 text-[11px] font-bold text-red-200">
              <TrendingUp size={13} /> +6.4% overrun · AED 298M forecast
            </div>
          </section>
        </div>
        <div className="space-y-4">
          <section className="rounded-2xl border border-[#1C3050] bg-[#0E1E35] p-4">
            <h3 className="mb-3 text-base font-black" style={{ fontFamily: 'Syne, sans-serif' }}>Live Site Map</h3>
            <SiteMapSVG />
          </section>
          <section className="rounded-2xl border border-[#1C3050] bg-[#0E1E35] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-black" style={{ fontFamily: 'Syne, sans-serif' }}>AI Scenarios</h3>
              <button onClick={() => goTo('forecast')} className="text-[11px] font-bold text-[#C4B5FD]">Explore</button>
            </div>
            <div className="grid gap-2">
              {Object.entries(aiContent.scenarios).map(([key, scenario]) => (
                <ScenarioCard key={key} scenarioKey={key as keyof typeof aiContent.scenarios} scenario={scenario} isActive={activeScenario === key} onClick={() => setProjectCommandState({ activeScenario: key as keyof typeof aiContent.scenarios })} />
              ))}
            </div>
          </section>
          <CriticalMilestones />
          <AIPanel title="AI Top Decisions" compact>
            <div className="space-y-3">
              {aiContent.topDecisions.slice(0, 3).map(decision => (
                <div key={decision.rank} className="grid grid-cols-[28px_1fr] gap-3">
                  <span className="text-2xl font-black text-[#7C3AED]" style={{ fontFamily: 'Syne, sans-serif' }}>{decision.rank}</span>
                  <div>
                    <div className="text-[12px] font-bold text-[#F0F4FF]">{decision.title}</div>
                    <p className="mt-0.5 text-[11px] leading-4 text-[#BCC8DC]">{decision.impact}</p>
                  </div>
                </div>
              ))}
            </div>
          </AIPanel>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-[11px] text-[#5A6E88]"><CalendarClock size={13} /> Danube Properties · Lawnz Residences · AED 280M · Target handover 30 Apr 2025</div>
    </div>
  );
}
