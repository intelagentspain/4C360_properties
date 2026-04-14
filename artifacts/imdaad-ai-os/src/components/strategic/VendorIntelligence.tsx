import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Minus, ArrowLeft, ShieldCheck,
  AlertTriangle, Brain, Target, DollarSign, BarChart3,
  CheckCircle, XCircle, FileWarning, Zap, ChevronRight,
  Users, Building2, Star,
} from 'lucide-react';
import {
  computeVendorScore,
  classifyVendorRisk,
  type VendorIntelData,
  type VendorRiskLevel,
  type VendorTrend,
} from '@/data/mockData';
import { useVendors } from '@/context/VendorsContext';
import type { ToastFn } from '@/lib/ui';

type FilterTab = 'all' | 'top' | 'atrisk' | 'cost';

function riskColor(level: VendorRiskLevel): string {
  if (level === 'Preferred') return '#38D98A';
  if (level === 'Watchlist') return '#FF9B38';
  return '#FF4B4B';
}

function riskBg(level: VendorRiskLevel): string {
  if (level === 'Preferred') return 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400';
  if (level === 'Watchlist') return 'bg-amber-500/10 border-amber-500/25 text-amber-400';
  return 'bg-red-500/10 border-red-500/25 text-red-400';
}

function scoreColor(score: number): string {
  if (score >= 80) return '#38D98A';
  if (score >= 65) return '#FF9B38';
  return '#FF4B4B';
}

function TrendIcon({ trend, size = 13 }: { trend: VendorTrend; size?: number }) {
  if (trend === 'up') return <TrendingUp size={size} className="text-emerald-400" />;
  if (trend === 'down') return <TrendingDown size={size} className="text-red-400" />;
  return <Minus size={size} className="text-amber-400" />;
}

function dependencyColor(level: string): string {
  if (level === 'Low') return '#38D98A';
  if (level === 'Medium') return '#FF9B38';
  if (level === 'High') return '#FF4B4B';
  return '#C026D3';
}

function flagIcon(type: string) {
  if (type === 'breach') return <XCircle size={11} className="text-red-400 flex-shrink-0 mt-0.5" />;
  if (type === 'missing') return <FileWarning size={11} className="text-amber-400 flex-shrink-0 mt-0.5" />;
  return <AlertTriangle size={11} className="text-amber-300 flex-shrink-0 mt-0.5" />;
}

function actionColor(action: string): string {
  if (action === 'reassign') return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
  if (action === 'renegotiate') return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
  if (action === 'review') return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
  return 'text-red-400 border-red-500/30 bg-red-500/10';
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="h-1 bg-[#0A1628] rounded-full overflow-hidden w-16">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, (value / max) * 100)}%` }}
        transition={{ duration: 0.5 }}
        className="h-full rounded-full"
        style={{ background: color }}
      />
    </div>
  );
}

function ScoreRing({ score, size = 52 }: { score: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = scoreColor(score);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(46,127,255,0.12)" strokeWidth={5} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={5} strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        initial={{ strokeDasharray: `0 ${circ}` }}
        animate={{ strokeDasharray: `${dash} ${circ}` }}
        transition={{ duration: 0.7 }}
      />
      <text
        x={size / 2} y={size / 2 + 1}
        textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize={13} fontWeight={700}
        style={{ transform: `rotate(90deg)`, transformOrigin: `${size / 2}px ${size / 2}px`, fontFamily: 'Space Grotesk, sans-serif' }}
      >
        {score}
      </text>
    </svg>
  );
}

interface DetailSectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function DetailSection({ icon, title, children }: DetailSectionProps) {
  return (
    <div className="bg-[#07111F] border border-[rgba(46,127,255,0.14)] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3.5">
        <div className="w-6 h-6 rounded-lg bg-[#2E7FFF]/15 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <span className="text-[10px] font-bold text-[#2E7FFF] uppercase tracking-widest">{title}</span>
        <div className="flex-1 h-px bg-[rgba(46,127,255,0.12)]" />
      </div>
      {children}
    </div>
  );
}

function MiniChart({ data, field, color }: { data: { month: string; [key: string]: number | string }[]; field: string; color: string }) {
  const values = data.map(d => d[field] as number);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 220;
  const h = 50;
  const pad = 4;
  const points = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - (((d[field] as number) - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  }).join(' ');
  return (
    <div className="flex flex-col gap-1">
      <svg width={w} height={h} className="overflow-visible">
        <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => {
          const x = pad + (i / (data.length - 1)) * (w - pad * 2);
          const y = h - pad - (((d[field] as number) - min) / range) * (h - pad * 2);
          return <circle key={i} cx={x} cy={y} r={2.5} fill={color} />;
        })}
      </svg>
      <div className="flex justify-between px-1">
        {data.map(d => (
          <span key={d.month} className="text-[9px] text-[#7A94B4]">{d.month}</span>
        ))}
      </div>
    </div>
  );
}

function computePeerAvgs(vendors: VendorIntelData[]) {
  if (vendors.length === 0) return { sla: 85, ftf: 80, evc: 85 };
  return {
    sla: Math.round(vendors.reduce((s, v) => s + v.slaCompliance, 0) / vendors.length),
    ftf: Math.round(vendors.reduce((s, v) => s + v.firstTimeFixRate, 0) / vendors.length),
    evc: Math.round(vendors.reduce((s, v) => s + v.evidenceCompliance, 0) / vendors.length),
  };
}

function VendorDetailPage({ vendor, onBack, onToast }: { vendor: VendorIntelData; onBack: () => void; onToast: ToastFn }) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const { vendors: allVendors } = useVendors();

  const score = computeVendorScore(vendor);
  const riskLevel = classifyVendorRisk(score);
  const projectedScore = computeVendorScore({ ...vendor, slaCompliance: vendor.projectedTrend === 'up' ? Math.min(100, vendor.slaCompliance + 3) : vendor.projectedTrend === 'down' ? Math.max(0, vendor.slaCompliance - 5) : vendor.slaCompliance });

  const peerAvgs = computePeerAvgs(allVendors);
  const rankedVendors = [...allVendors].sort((a, b) => computeVendorScore(b) - computeVendorScore(a));
  const benchmarkRank = rankedVendors.findIndex(v => v.id === vendor.id) + 1;

  const sections = ['Overview', 'AI Insights', 'Contract Compliance', 'Cost vs Performance', 'Benchmarking', 'Predictive Risk', 'Recommendations', 'Dependency Risk'];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-[rgba(46,127,255,0.15)] flex-shrink-0">
        <button onClick={onBack} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#7A94B4] hover:text-white transition-all">
          <ArrowLeft size={14} />
        </button>
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#2E7FFF]/15 flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={15} className="text-[#2E7FFF]" />
          </div>
          <div className="min-w-0">
            <h2 className="text-[#EEF3FA] font-bold text-sm truncate" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{vendor.name}</h2>
            <p className="text-[10px] text-[#7A94B4]">{vendor.category} · {vendor.sites.join(', ')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${riskBg(riskLevel)}`}>{riskLevel}</span>
          <button
            onClick={() => setShowReassignModal(true)}
            className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600/30 transition-all"
          >
            Reassign Work
          </button>
          <button
            onClick={() => setShowReviewModal(true)}
            className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-amber-600/20 border border-amber-500/30 text-amber-400 hover:bg-amber-600/30 transition-all"
          >
            Trigger Vendor Review
          </button>
        </div>
      </div>

      <div className="flex gap-1 px-5 py-2 border-b border-[rgba(46,127,255,0.08)] overflow-x-auto no-scrollbar flex-shrink-0">
        {sections.map(s => (
          <button
            key={s}
            onClick={() => {
              const el = document.getElementById(`vendor-section-${s.replace(/\s/g, '-')}`);
              el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              setActiveSection(s);
            }}
            className={`text-[10px] px-3 py-1.5 rounded-lg whitespace-nowrap font-semibold transition-all flex-shrink-0 ${
              activeSection === s ? 'bg-[#2E7FFF]/20 text-[#2E7FFF]' : 'text-[#7A94B4] hover:text-[#EEF3FA] hover:bg-white/5'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-4">
        <div id="vendor-section-Overview">
          <DetailSection icon={<Star size={12} className="text-[#2E7FFF]" />} title="Overview">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="col-span-2 sm:col-span-1 flex items-center gap-4 bg-[#0D1E3A] rounded-xl p-3">
                <ScoreRing score={score} size={64} />
                <div>
                  <div className="text-[10px] text-[#7A94B4] mb-0.5">Vendor Score</div>
                  <div className="flex items-center gap-1.5">
                    <TrendIcon trend={vendor.trend} size={14} />
                    <span className="text-[11px] text-[#7A94B4]">{vendor.trend === 'up' ? 'Improving' : vendor.trend === 'down' ? 'Declining' : 'Stable'}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1 inline-block ${riskBg(riskLevel)}`}>{riskLevel}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 col-span-2 sm:col-span-1">
                {[
                  { label: 'SLA Compliance', value: `${vendor.slaCompliance}%`, color: scoreColor(vendor.slaCompliance) },
                  { label: 'First-Time Fix', value: `${vendor.firstTimeFixRate}%`, color: scoreColor(vendor.firstTimeFixRate) },
                  { label: 'Avg Resolution', value: `${vendor.avgResolutionMin} min`, color: vendor.avgResolutionMin <= 45 ? '#38D98A' : vendor.avgResolutionMin <= 60 ? '#FF9B38' : '#FF4B4B' },
                  { label: 'Evidence Compliance', value: `${vendor.evidenceCompliance}%`, color: scoreColor(vendor.evidenceCompliance) },
                ].map(k => (
                  <div key={k.label} className="bg-[#0A1628] rounded-lg p-2 text-center">
                    <div className="text-[12px] font-bold" style={{ color: k.color }}>{k.value}</div>
                    <div className="text-[9px] text-[#7A94B4] mt-0.5">{k.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Active Contracts', value: vendor.activeContracts, icon: <Building2 size={10} className="text-[#2E7FFF]" /> },
                { label: 'Jobs Last 30d', value: vendor.jobsLast30d, icon: <CheckCircle size={10} className="text-emerald-400" /> },
                { label: 'Avg Cost/Job', value: `AED ${vendor.avgCostPerJob}`, icon: <DollarSign size={10} className="text-amber-400" /> },
              ].map(k => (
                <div key={k.label} className="bg-[#0A1628] rounded-lg p-2.5">
                  <div className="flex items-center gap-1 mb-1">{k.icon}<span className="text-[9px] text-[#7A94B4]">{k.label}</span></div>
                  <div className="text-[13px] font-bold text-[#EEF3FA]">{k.value}</div>
                </div>
              ))}
            </div>
            {vendor.anomaly && (
              <div className="mt-3 flex items-start gap-2 bg-red-500/8 border border-red-500/25 rounded-lg p-2.5">
                <AlertTriangle size={13} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-red-300">{vendor.anomaly}</p>
              </div>
            )}
          </DetailSection>
        </div>

        <div id="vendor-section-AI-Insights">
          <DetailSection icon={<Brain size={12} className="text-[#2E7FFF]" />} title="AI Insights">
            <div className="space-y-2">
              {vendor.insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-2 bg-[#0D1E3A] rounded-lg p-2.5">
                  <Zap size={11} className="text-[#2E7FFF] flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-[#C8D8EE] leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="bg-[#0A1628] rounded-lg p-2.5">
                <div className="text-[9px] text-[#7A94B4] mb-1.5 uppercase tracking-wide">Repeat Failure Rate</div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] font-bold" style={{ color: vendor.repeatFailureRate <= 6 ? '#38D98A' : vendor.repeatFailureRate <= 10 ? '#FF9B38' : '#FF4B4B' }}>{vendor.repeatFailureRate}%</span>
                </div>
                <MiniBar value={vendor.repeatFailureRate} max={20} color={vendor.repeatFailureRate <= 6 ? '#38D98A' : vendor.repeatFailureRate <= 10 ? '#FF9B38' : '#FF4B4B'} />
              </div>
              <div className="bg-[#0A1628] rounded-lg p-2.5">
                <div className="text-[9px] text-[#7A94B4] mb-1.5 uppercase tracking-wide">Contract Expiry</div>
                <div className="text-[13px] font-bold text-[#EEF3FA]">{vendor.contractExpiry}</div>
                <div className="text-[9px] text-[#7A94B4] mt-0.5">{vendor.activeContracts} active contract{vendor.activeContracts !== 1 ? 's' : ''}</div>
              </div>
            </div>
          </DetailSection>
        </div>

        <div id="vendor-section-Contract-Compliance">
          <DetailSection icon={<CheckCircle size={12} className="text-[#2E7FFF]" />} title="Contract Compliance">
            {vendor.contractFlags.length === 0 ? (
              <div className="flex items-center gap-2 bg-emerald-500/8 border border-emerald-500/20 rounded-lg p-3">
                <CheckCircle size={14} className="text-emerald-400" />
                <p className="text-[11px] text-emerald-300">No contract breaches or compliance flags. All obligations current.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {vendor.contractFlags.map((flag, i) => (
                  <div key={i} className={`flex items-start gap-2 rounded-lg p-2.5 border ${
                    flag.type === 'breach' ? 'bg-red-500/8 border-red-500/25' : 'bg-amber-500/8 border-amber-500/20'
                  }`}>
                    {flagIcon(flag.type)}
                    <div>
                      <span className={`text-[9px] font-bold uppercase tracking-wide mr-2 ${flag.type === 'breach' ? 'text-red-400' : 'text-amber-400'}`}>
                        {flag.type === 'breach' ? 'SLA Breach' : flag.type === 'missing' ? 'Missing Evidence' : 'Warning'}
                      </span>
                      <p className="text-[11px] text-[#C8D8EE] mt-0.5">{flag.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { label: 'SLA Compliance', value: `${vendor.slaCompliance}%`, ok: vendor.slaCompliance >= 85 },
                { label: 'Evidence Rate', value: `${vendor.evidenceCompliance}%`, ok: vendor.evidenceCompliance >= 85 },
                { label: 'Contract Flags', value: vendor.contractFlags.length, ok: vendor.contractFlags.length === 0 },
              ].map(k => (
                <div key={k.label} className="bg-[#0A1628] rounded-lg p-2 text-center">
                  <div className={`text-[13px] font-bold ${k.ok ? 'text-emerald-400' : 'text-red-400'}`}>{k.value}</div>
                  <div className="text-[9px] text-[#7A94B4] mt-0.5">{k.label}</div>
                </div>
              ))}
            </div>
          </DetailSection>
        </div>

        <div id="vendor-section-Cost-vs-Performance">
          <DetailSection icon={<DollarSign size={12} className="text-[#2E7FFF]" />} title="Cost vs Performance">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-[#0D1E3A] rounded-xl p-3">
                <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-2">Cost Trend (AED/Job)</div>
                <MiniChart data={vendor.costTrend} field="cost" color="#FF9B38" />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] font-bold text-amber-400">AED {vendor.avgCostPerJob}</span>
                  <span className="text-[10px] text-[#7A94B4]">vs peer AED {vendor.costTrend[vendor.costTrend.length - 1].peerAvg}</span>
                </div>
              </div>
              <div className="bg-[#0D1E3A] rounded-xl p-3">
                <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-2">Score Trend</div>
                <MiniChart data={vendor.scoreTrend} field="score" color={scoreColor(score)} />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] font-bold" style={{ color: scoreColor(score) }}>{score} pts</span>
                  <div className="flex items-center gap-1">
                    <TrendIcon trend={vendor.trend} size={12} />
                    <span className="text-[10px] text-[#7A94B4]">{vendor.trend}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[#0A1628] rounded-lg p-2.5">
              <div className="text-[10px] text-[#7A94B4] mb-2">Cost vs Peer Average</div>
              <div className="space-y-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-[#EEF3FA]">{vendor.name}</span>
                    <span className="text-[10px] font-bold text-amber-400">AED {vendor.avgCostPerJob}</span>
                  </div>
                  <div className="h-1.5 bg-[#0D1E3A] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(vendor.avgCostPerJob / 600) * 100}%` }}
                      transition={{ duration: 0.6 }}
                      className="h-full rounded-full bg-amber-400"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-[#7A94B4]">Peer Average</span>
                    <span className="text-[10px] text-[#7A94B4]">AED {vendor.costTrend[vendor.costTrend.length - 1].peerAvg}</span>
                  </div>
                  <div className="h-1.5 bg-[#0D1E3A] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#7A94B4]"
                      style={{ width: `${(vendor.costTrend[vendor.costTrend.length - 1].peerAvg / 600) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </DetailSection>
        </div>

        <div id="vendor-section-Benchmarking">
          <DetailSection icon={<BarChart3 size={12} className="text-[#2E7FFF]" />} title="Benchmarking">
            <div className="mb-3 flex items-center gap-3 bg-[#0D1E3A] rounded-xl p-3">
              <div className="text-center">
                <div className="text-[22px] font-bold" style={{ color: scoreColor(score), fontFamily: 'Space Grotesk, sans-serif' }}>#{benchmarkRank}</div>
                <div className="text-[9px] text-[#7A94B4]">of {rankedVendors.length}</div>
              </div>
              <div className="flex-1 space-y-1.5">
                {rankedVendors.map((v, i) => {
                  const vs = computeVendorScore(v);
                  return (
                    <div key={v.id} className={`flex items-center gap-2 rounded px-1.5 py-0.5 ${v.id === vendor.id ? 'bg-[#2E7FFF]/15' : ''}`}>
                      <span className="text-[9px] text-[#7A94B4] w-4">#{i + 1}</span>
                      <span className={`text-[10px] flex-1 truncate ${v.id === vendor.id ? 'text-[#EEF3FA] font-semibold' : 'text-[#7A94B4]'}`}>{v.name}</span>
                      <div className="h-1 rounded-full overflow-hidden" style={{ width: '60px', background: '#0A1628' }}>
                        <div className="h-full rounded-full" style={{ width: `${vs}%`, background: scoreColor(vs) }} />
                      </div>
                      <span className="text-[9px] font-bold w-6 text-right" style={{ color: scoreColor(vs) }}>{vs}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'SLA Compliance', value: vendor.slaCompliance, peerAvg: peerAvgs.sla },
                { label: 'First-Time Fix', value: vendor.firstTimeFixRate, peerAvg: peerAvgs.ftf },
                { label: 'Evidence Rate', value: vendor.evidenceCompliance, peerAvg: peerAvgs.evc },
              ].map(k => (
                <div key={k.label} className="bg-[#0A1628] rounded-lg p-2.5">
                  <div className="text-[9px] text-[#7A94B4] mb-1">{k.label}</div>
                  <div className="text-[12px] font-bold mb-1" style={{ color: scoreColor(k.value) }}>{k.value}%</div>
                  <div className="text-[8px] text-[#7A94B4]">Peer avg: {k.peerAvg}%</div>
                </div>
              ))}
            </div>
          </DetailSection>
        </div>

        <div id="vendor-section-Predictive-Risk">
          <DetailSection icon={<AlertTriangle size={12} className="text-[#2E7FFF]" />} title="Predictive Risk">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0D1E3A] rounded-xl p-3">
                <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-2">30-Day Risk Score</div>
                <div className="flex items-end gap-2">
                  <span className="text-[28px] font-bold" style={{ color: vendor.predictedRisk30d >= 35 ? '#FF4B4B' : vendor.predictedRisk30d >= 20 ? '#FF9B38' : '#38D98A', fontFamily: 'Space Grotesk, sans-serif' }}>
                    {vendor.predictedRisk30d}%
                  </span>
                </div>
                <div className="h-1.5 bg-[#0A1628] rounded-full overflow-hidden mt-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${vendor.predictedRisk30d}%` }}
                    transition={{ duration: 0.6 }}
                    className="h-full rounded-full"
                    style={{ background: vendor.predictedRisk30d >= 35 ? '#FF4B4B' : vendor.predictedRisk30d >= 20 ? '#FF9B38' : '#38D98A' }}
                  />
                </div>
                <p className="text-[10px] text-[#7A94B4] mt-2">
                  {vendor.predictedRisk30d >= 35 ? 'High risk of SLA breach or contract escalation in next 30 days.' : vendor.predictedRisk30d >= 20 ? 'Moderate risk — monitor closely and prepare contingency.' : 'Low risk — current trajectory is sustainable.'}
                </p>
              </div>
              <div className="bg-[#0D1E3A] rounded-xl p-3">
                <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-2">Projected 30-Day Score</div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[28px] font-bold" style={{ color: scoreColor(projectedScore), fontFamily: 'Space Grotesk, sans-serif' }}>{projectedScore}</span>
                  <TrendIcon trend={vendor.projectedTrend} size={18} />
                </div>
                <div className="text-[10px] text-[#7A94B4]">
                  {projectedScore > score ? `+${projectedScore - score} pts projected` : projectedScore < score ? `${projectedScore - score} pts projected` : 'Score expected to remain stable'}
                </div>
              </div>
            </div>
          </DetailSection>
        </div>

        <div id="vendor-section-Recommendations">
          <DetailSection icon={<Target size={12} className="text-[#2E7FFF]" />} title="Recommendations">
            <div className="space-y-2.5">
              {vendor.recommendations.map((rec, i) => (
                <div key={i} className="bg-[#0D1E3A] rounded-xl p-3 border border-[rgba(46,127,255,0.1)]">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-[12px] font-semibold text-[#EEF3FA]">{rec.title}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border flex-shrink-0 ${actionColor(rec.action)}`}>
                      {rec.action === 'reassign' ? 'Reassign' : rec.action === 'renegotiate' ? 'Renegotiate' : rec.action === 'review' ? 'Trigger Review' : 'Limit Scope'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#7A94B4] leading-relaxed">{rec.detail}</p>
                  {(rec.action === 'reassign' || rec.action === 'review') && (
                    <button
                      onClick={() => rec.action === 'reassign' ? setShowReassignModal(true) : setShowReviewModal(true)}
                      className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-[#2E7FFF] hover:text-white transition-colors"
                    >
                      <ChevronRight size={11} />
                      {rec.action === 'reassign' ? 'Reassign Work Now' : 'Trigger Vendor Review'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </DetailSection>
        </div>

        <div id="vendor-section-Dependency-Risk">
          <DetailSection icon={<Users size={12} className="text-[#2E7FFF]" />} title="Dependency Risk">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${dependencyColor(vendor.dependencyRisk)}18`, border: `1px solid ${dependencyColor(vendor.dependencyRisk)}30` }}>
                <span className="text-[11px] font-bold" style={{ color: dependencyColor(vendor.dependencyRisk) }}>{vendor.dependencyRisk}</span>
              </div>
              <p className="text-[11px] text-[#C8D8EE] flex-1 leading-relaxed">{vendor.dependencyNote}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#0A1628] rounded-lg p-2.5">
                <div className="text-[9px] text-[#7A94B4] mb-1">Sites Covered</div>
                {vendor.sites.map(s => (
                  <div key={s} className="flex items-center gap-1 mt-0.5">
                    <div className="w-1 h-1 rounded-full bg-[#2E7FFF]" />
                    <span className="text-[10px] text-[#EEF3FA]">{s}</span>
                  </div>
                ))}
              </div>
              <div className="bg-[#0A1628] rounded-lg p-2.5">
                <div className="text-[9px] text-[#7A94B4] mb-1">Active Contracts</div>
                <div className="text-[20px] font-bold text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{vendor.activeContracts}</div>
                <div className="text-[9px] text-[#7A94B4]">Expiry: {vendor.contractExpiry}</div>
              </div>
            </div>
          </DetailSection>
        </div>
      </div>

      <AnimatePresence>
        {showReassignModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 px-6"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0D1E3A] border border-[rgba(46,127,255,0.3)] rounded-2xl p-5 max-w-sm w-full"
            >
              <h3 className="text-[#EEF3FA] font-bold text-sm mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Reassign Work — {vendor.name}</h3>
              <p className="text-[11px] text-[#7A94B4] mb-4 leading-relaxed">
                This will flag active jobs assigned to <strong className="text-[#EEF3FA]">{vendor.name}</strong> for reassignment to alternate vendors. Operations team will be notified to action.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowReassignModal(false); onToast(`Reassignment initiated for ${vendor.name} — Operations notified`, 'success'); }}
                  className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-[12px] font-semibold hover:bg-blue-500 transition-all"
                >
                  Confirm Reassignment
                </button>
                <button
                  onClick={() => setShowReassignModal(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 text-[#7A94B4] text-[12px] hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReviewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 px-6"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0D1E3A] border border-[rgba(46,127,255,0.3)] rounded-2xl p-5 max-w-sm w-full"
            >
              <h3 className="text-[#EEF3FA] font-bold text-sm mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Trigger Vendor Review — {vendor.name}</h3>
              <p className="text-[11px] text-[#7A94B4] mb-4 leading-relaxed">
                A formal performance review will be initiated for <strong className="text-[#EEF3FA]">{vendor.name}</strong>. The vendor will receive a 14-day notice to respond with a corrective action plan.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowReviewModal(false); onToast(`Vendor review triggered for ${vendor.name} — 14-day notice issued`, 'warning'); }}
                  className="flex-1 py-2 rounded-lg bg-amber-600/80 text-white text-[12px] font-semibold hover:bg-amber-500 transition-all"
                >
                  Confirm Trigger
                </button>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 text-[#7A94B4] text-[12px] hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface Props { onToast: ToastFn }

export function VendorIntelligence({ onToast }: Props) {
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [selectedVendor, setSelectedVendor] = useState<VendorIntelData | null>(null);
  const { vendors: allVendors } = useVendors();

  const vendorsWithScores = allVendors.map(v => ({
    vendor: v,
    score: computeVendorScore(v),
    riskLevel: classifyVendorRisk(computeVendorScore(v)),
  }));

  const filteredVendors = (() => {
    const all = [...vendorsWithScores];
    switch (filterTab) {
      case 'top': return all.sort((a, b) => b.score - a.score).filter(v => v.riskLevel === 'Preferred');
      case 'atrisk': return all.filter(v => v.riskLevel === 'At Risk' || (v.riskLevel === 'Watchlist' && v.vendor.trend === 'down'));
      case 'cost': return all.sort((a, b) => a.vendor.avgCostPerJob - b.vendor.avgCostPerJob);
      default: return all.sort((a, b) => b.score - a.score);
    }
  })();

  const tabs: { id: FilterTab; label: string }[] = [
    { id: 'all', label: 'All Vendors' },
    { id: 'top', label: 'Top Vendors' },
    { id: 'atrisk', label: 'At Risk' },
    { id: 'cost', label: 'Cost Efficiency Ranking' },
  ];

  const summary = {
    preferred: vendorsWithScores.filter(v => v.riskLevel === 'Preferred').length,
    watchlist: vendorsWithScores.filter(v => v.riskLevel === 'Watchlist').length,
    atRisk: vendorsWithScores.filter(v => v.riskLevel === 'At Risk').length,
  };

  if (selectedVendor) {
    return (
      <div className="absolute inset-0 flex flex-col">
        <VendorDetailPage vendor={selectedVendor} onBack={() => setSelectedVendor(null)} onToast={onToast} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(46,127,255,0.15)] flex-shrink-0">
        <div>
          <h2 className="text-[#EEF3FA] font-bold text-base" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Vendor Intelligence & Contract Optimization</h2>
          <p className="text-[11px] text-[#7A94B4]">AI-powered vendor scoring, risk detection, and contract compliance monitoring</p>
        </div>
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-[#2E7FFF]" />
          <span className="text-[10px] text-[#7A94B4]">4C360 Vendor AI</span>
        </div>
      </div>

      <div className="flex items-center gap-4 px-5 py-3 border-b border-[rgba(46,127,255,0.08)] flex-shrink-0">
        {[
          { label: 'Preferred', count: summary.preferred, color: '#38D98A' },
          { label: 'Watchlist', count: summary.watchlist, color: '#FF9B38' },
          { label: 'At Risk', count: summary.atRisk, color: '#FF4B4B' },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
            <span className="text-[11px] font-bold" style={{ color: s.color }}>{s.count}</span>
            <span className="text-[11px] text-[#7A94B4]">{s.label}</span>
          </div>
        ))}
        <div className="h-4 w-px bg-[rgba(46,127,255,0.2)] mx-1" />
        <span className="text-[11px] text-[#7A94B4]">{allVendors.length} vendors · {allVendors.reduce((s, v) => s + v.activeContracts, 0)} active contracts</span>
      </div>

      <div className="flex items-center gap-1 px-5 py-2 border-b border-[rgba(46,127,255,0.08)] flex-shrink-0 overflow-x-auto no-scrollbar">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setFilterTab(t.id)}
            className={`text-[11px] px-3 py-1.5 rounded-lg whitespace-nowrap font-semibold transition-all flex-shrink-0 ${
              filterTab === t.id
                ? 'bg-[#2E7FFF]/20 text-[#2E7FFF] border border-[#2E7FFF]/30'
                : 'text-[#7A94B4] hover:text-[#EEF3FA] hover:bg-white/5'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4">
        <div className="bg-[rgba(17,32,64,0.85)] border border-[rgba(46,127,255,0.2)] rounded-xl overflow-hidden">
          <div className="grid grid-cols-[2fr_70px_100px_80px_90px_90px_80px_36px] px-4 py-2 text-[9px] text-[#7A94B4] uppercase tracking-wide border-b border-[rgba(46,127,255,0.1)]">
            {['Vendor', 'Score', 'Risk Level', 'Trend', 'SLA %', 'Avg Cost', 'Contracts', ''].map(h => (
              <div key={h}>{h}</div>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={filterTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {filteredVendors.map(({ vendor, score: vs, riskLevel: vr }, i) => (
                <motion.button
                  key={vendor.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setSelectedVendor(vendor)}
                  className="w-full text-left grid grid-cols-[2fr_70px_100px_80px_90px_90px_80px_36px] px-4 py-3 border-b border-[rgba(46,127,255,0.07)] hover:bg-white/[0.025] transition-all items-center group"
                >
                  <div className="min-w-0">
                    <div className="text-[12px] text-[#EEF3FA] font-semibold truncate">{vendor.name}</div>
                    <div className="text-[10px] text-[#7A94B4] truncate">{vendor.category}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-bold" style={{ color: scoreColor(vs), fontFamily: 'Space Grotesk, sans-serif' }}>{vs}</span>
                  </div>
                  <div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${riskBg(vr)}`}>{vr}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendIcon trend={vendor.trend} size={12} />
                    <span className="text-[10px] text-[#7A94B4]">{vendor.trend}</span>
                  </div>
                  <div>
                    <span className={`text-[12px] font-semibold ${vendor.slaCompliance >= 85 ? 'text-emerald-400' : vendor.slaCompliance >= 72 ? 'text-amber-400' : 'text-red-400'}`}>{vendor.slaCompliance}%</span>
                    <div className="mt-0.5">
                      <MiniBar value={vendor.slaCompliance} max={100} color={vendor.slaCompliance >= 85 ? '#38D98A' : vendor.slaCompliance >= 72 ? '#FF9B38' : '#FF4B4B'} />
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#EEF3FA]">AED {vendor.avgCostPerJob}</span>
                    <div className="text-[9px] text-[#7A94B4]">/job</div>
                  </div>
                  <div>
                    <span className="text-[12px] text-[#EEF3FA] font-semibold">{vendor.activeContracts}</span>
                    <div className="text-[9px] text-[#7A94B4]">exp {vendor.contractExpiry}</div>
                  </div>
                  <div className="flex items-center justify-center">
                    <ChevronRight size={13} className="text-[#7A94B4] group-hover:text-[#EEF3FA] transition-colors" />
                  </div>
                </motion.button>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {filteredVendors.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ShieldCheck size={32} className="text-[#7A94B4] mb-3 opacity-40" />
            <p className="text-[12px] text-[#7A94B4]">No vendors match this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
