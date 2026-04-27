import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Brain, CalendarClock, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { HealthScoreGauge } from '../components/HealthScoreGauge';
import { ScenarioCard } from '../components/ScenarioCard';
import { CriticalMilestones } from '../components/CriticalMilestones';
import { AIPanel } from '../components/AIPanel';
import { AIInsightBadge } from '../components/AIInsightBadge';
import { AIInsightPanel } from '../components/AIInsightPanel';
import { StageGateStatus } from '../components/StageGateStatus';
import { useProjectCommandStore, setProjectCommandState } from '../state/projectCommandStore';
import type { ProjectCommandScreen } from '../types';
import type { ProjectCommandAIContent } from '../data/portfolio';
import type { MetricName } from '../useMetricInsight';
import { useSelectedProjectCommandData } from '../useProjectCommandData';

type ThreatCard = {
  label: string;
  title: string;
  action: string;
  tone: string;
};

function buildThreatCards(aiContent: ProjectCommandAIContent): ThreatCard[] {
  const primaryDecision = aiContent.topDecisions[0];
  const secondaryDecision = aiContent.topDecisions[1];
  const costDriver = aiContent.costInsights.topCostDrivers[0];
  const earlyWarning = aiContent.riskInsights.earlyWarnings[0];

  return [
    {
      label: 'Top Threat',
      title: aiContent.healthScore.topThreat,
      action: aiContent.healthScore.recommendedAction,
      tone: '#00B894',
    },
    {
      label: 'Decision Risk',
      title: primaryDecision.title,
      action: primaryDecision.impact,
      tone: primaryDecision.urgency === 'critical' ? '#D92B1C' : '#D97706',
    },
    {
      label: 'Cost Exposure',
      title: costDriver.item,
      action: `Current exposure is AED ${costDriver.value}M and is marked ${costDriver.status}. ${aiContent.costInsights.narrative}`,
      tone: '#C8A020',
    },
    {
      label: 'Early Warning',
      title: earlyWarning,
      action: secondaryDecision ? `Recommended next move: ${secondaryDecision.title}. ${secondaryDecision.impact}` : aiContent.programmeInsights.rescheduleSuggestion,
      tone: '#7C3AED',
    },
  ];
}

function Sparkline({ points }: { points: number[] }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const path = points.map((point, index) => {
    const x = (index / (points.length - 1)) * 100;
    const y = 36 - ((point - min) / (max - min || 1)) * 30;
    return `${x},${y}`;
  }).join(' ');
  return <svg viewBox="0 0 100 40" className="h-10 w-28"><polyline points={path} fill="none" stroke="#00B894" strokeWidth="3" strokeLinecap="round" /></svg>;
}

function TopDecisions({ aiContent }: { aiContent: ProjectCommandAIContent }) {
  return (
    <AIPanel title="AI Top Decisions" compact>
      <div className="space-y-3">
        {aiContent.topDecisions.slice(0, 3).map(decision => (
          <div key={decision.rank} className="grid grid-cols-[28px_1fr] gap-3">
            <span className="text-2xl font-black text-[#7C3AED]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{decision.rank}</span>
            <div>
              <div className="text-[12px] font-bold text-[#EEF3FA]">{decision.title}</div>
              <p className="mt-0.5 text-[11px] leading-4 text-[#B8C7DB]">{decision.impact}</p>
            </div>
          </div>
        ))}
      </div>
    </AIPanel>
  );
}

export function CommandCenter({ goTo }: { goTo: (screen: ProjectCommandScreen) => void }) {
  const { aiContent, project, id: datasetId } = useSelectedProjectCommandData();
  const { activeScenario } = useProjectCommandStore();
  const [threatIndex, setThreatIndex] = useState(0);
  const [selectedInsight, setSelectedInsight] = useState<{ metricName: MetricName; value: string | number } | null>(null);
  const threats = useMemo(() => buildThreatCards(aiContent), [aiContent]);
  const activeThreat = threats[threatIndex] ?? threats[0];

  useEffect(() => {
    setThreatIndex(0);
  }, [datasetId]);

  const goThreat = (direction: -1 | 1) => {
    setThreatIndex(current => (current + direction + threats.length) % threats.length);
  };

  const kpis: Array<{ label: MetricName; value: string | number; insightValue: string | number; tone: string; bar?: number; mono?: boolean }> = [
    { label: 'Completion', value: `${project.completion}%`, insightValue: `${project.completion}%`, tone: '#00B894', bar: project.completion },
    { label: 'Budget Used', value: `${project.budgetUsed}%`, insightValue: `${project.budgetUsed}%`, tone: '#C8A020' },
    { label: 'Days to Handover', value: project.daysToHandover, insightValue: project.daysToHandover, tone: '#EEF3FA' },
    { label: 'CPI', value: project.cpi.toFixed(2), insightValue: project.cpi.toFixed(2), tone: project.cpi < 1 ? '#D97706' : '#00B894', mono: true },
    { label: 'SPI', value: project.spi.toFixed(2), insightValue: project.spi.toFixed(2), tone: project.spi < 1 ? '#D97706' : '#00B894', mono: true },
    { label: 'Float Remaining', value: `${project.floatRemaining}d`, insightValue: `${project.floatRemaining}d`, tone: project.floatRemaining < 30 ? '#D92B1C' : '#00B894' },
  ];

  return (
    <div className="custom-scrollbar h-full overflow-x-hidden overflow-y-auto px-5 py-4 text-[#EEF3FA]">
      <section className="mb-4 rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
        <div className="grid gap-5 xl:grid-cols-[110px_1fr_330px] xl:items-center">
          <HealthScoreGauge score={project.healthScore} status={project.healthStatus} />
          <div className="min-w-0 border-l-2 pl-5" style={{ borderColor: activeThreat.tone }}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#C4B5FD]">
                <Brain size={14} />
                AI - {activeThreat.label}
                <span className="rounded-full border border-[rgba(46,127,255,0.22)] bg-[#0A1628] px-2 py-0.5 text-[9px] tracking-normal text-[#7A94B4]">{threatIndex + 1}/{threats.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-8 items-center gap-1.5 rounded-full border border-violet-400/25 bg-violet-400/10 px-3 text-[10px] font-bold text-violet-200">
                  <Sparkles size={13} /> AI Forecast Ready
                </span>
                <div className="flex rounded-lg border border-[rgba(46,127,255,0.2)] bg-[#0A1628] p-1">
                  <button
                    type="button"
                    onClick={() => goThreat(-1)}
                    aria-label="Previous threat"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-[#B8C7DB] transition-colors hover:bg-white/5 hover:text-white"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => goThreat(1)}
                    aria-label="Next threat"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-[#B8C7DB] transition-colors hover:bg-white/5 hover:text-white"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </div>
            <motion.div
              key={`${datasetId}-${threatIndex}`}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.22 }}
            >
              <h2 className="max-w-5xl text-[18px] font-black leading-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{activeThreat.title}</h2>
              <p className="mt-2 max-w-5xl text-[12px] leading-5 text-[#B8C7DB]">{activeThreat.action}</p>
            </motion.div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {threats.map((threat, index) => (
                <button
                  key={threat.label}
                  type="button"
                  onClick={() => setThreatIndex(index)}
                  aria-label={`Show ${threat.label}`}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: index === threatIndex ? 24 : 8,
                    backgroundColor: index === threatIndex ? threat.tone : 'rgba(122,148,180,0.35)',
                  }}
                />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              ['Completion', `${aiContent.healthScore.forecast30d.completion}%`],
              ['Spend', `AED ${aiContent.healthScore.forecast30d.spend}M`],
              ['New Risks', aiContent.healthScore.forecast30d.newRisks],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#0A1628]/70 p-3">
                <div className="text-[10px] font-bold uppercase text-[#7A94B4]">{label}</div>
                <div className="mt-1 text-lg font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{value}</div>
              </div>
            ))}
            <div className="col-span-3 rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#0A1628]/70 px-3 py-2"><Sparkline points={aiContent.healthScore.forecast30d.sparkline} /></div>
          </div>
        </div>
      </section>

      <div className="mb-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi, index) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="relative overflow-hidden rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-3">
            <AIInsightBadge onClick={() => setSelectedInsight({ metricName: kpi.label, value: kpi.insightValue })} />
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7A94B4]">{kpi.label}</div>
            <div className={`mt-2 text-[24px] font-black ${kpi.mono ? 'font-mono' : ''}`} style={{ color: kpi.tone, fontFamily: kpi.mono ? 'JetBrains Mono, monospace' : 'Space Grotesk, sans-serif' }}>{kpi.value}</div>
            {'bar' in kpi && <motion.div initial={{ width: 0 }} animate={{ width: `${kpi.bar}%` }} className="absolute bottom-0 left-0 h-1 bg-[#00B894]" />}
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-4">
          <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Programme Intelligence</h3>
              <button onClick={() => goTo('programme')} className="flex items-center gap-1 text-[12px] font-bold text-[#C4B5FD]">Full Gantt <ArrowRight size={14} /></button>
            </div>
            <StageGateStatus />
          </section>
          <div className="grid gap-4 2xl:grid-cols-[0.95fr_1.05fr]">
            <CriticalMilestones />
            <TopDecisions aiContent={aiContent} />
          </div>
        </div>

        <div className="space-y-4">
          <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
            <h3 className="text-sm font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Delivery snapshot</h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                ['Forecast', project.forecastCompletion],
                ['Float', `${project.floatRemaining} days`],
                ['Contractor', project.mainContractor],
                ['Health', `${project.healthScore}/100`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[rgba(46,127,255,0.14)] bg-[#0A1628] px-3 py-2">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-[#7A94B4]">{label}</p>
                  <p className="mt-1 truncate text-[11px] font-bold text-[#B8C7DB]">{value}</p>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>AI Scenarios</h3>
              <button onClick={() => goTo('forecast')} className="text-[11px] font-bold text-[#C4B5FD]">Explore</button>
            </div>
            <div className="grid gap-2">
              {Object.entries(aiContent.scenarios).map(([key, scenario]) => (
                <ScenarioCard key={key} scenarioKey={key as keyof typeof aiContent.scenarios} scenario={scenario} isActive={activeScenario === key} onClick={() => setProjectCommandState({ activeScenario: key as keyof typeof aiContent.scenarios })} />
              ))}
            </div>
          </section>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-[11px] text-[#7A94B4]"><CalendarClock size={13} /> {project.developer} - {project.name} - AED {Math.round(project.contractValue / 1_000_000)}M - Target handover {new Date(project.targetHandover).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
      <AnimatePresence>
        {selectedInsight && (
          <AIInsightPanel
            metricName={selectedInsight.metricName}
            value={selectedInsight.value}
            onClose={() => setSelectedInsight(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
