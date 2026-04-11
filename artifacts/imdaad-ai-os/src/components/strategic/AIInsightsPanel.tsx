import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, TrendingUp, AlertTriangle, Clock, CheckCircle, X, Eye, UserCheck } from 'lucide-react';
import { type ToastFn } from '@/lib/ui';
import { AnimatedBar } from '@/components/shared/AnimatedBar';
import { AssignInsightModal } from '@/components/shared/AssignInsightModal';
import { InsightDetailModal, type InsightDetail } from '@/components/shared/InsightDetailModal';

interface Insight {
  id: string;
  category: 'risk' | 'efficiency' | 'prediction' | 'anomaly';
  title: string;
  body: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
}

const insights: InsightDetail[] = [
  {
    id: 'i1',
    category: 'risk',
    title: 'SLA breach likely in 14 min',
    body: 'Job #SI-298 (Omar T.) has not moved status in 38 min. Historical data suggests 84% breach probability at current pace.',
    confidence: 84,
    impact: 'high',
    rationale:
      'Job #SI-298 has been stalled in "In-Progress" status for 38 minutes without a technician location update or status change. The contracted SLA window for this client is 60 minutes and the remaining buffer is only 14 minutes. Based on field movement data and historical completion rates, the AI engine flags this as a high-probability breach requiring immediate intervention.',
    currentContext: [
      'Job #SI-298 status: In-Progress — no update for 38 min',
      'Assigned technician Omar T. last GPS ping: 1.2 km from site, 34 min ago',
      'Client SLA window: 60 min — 14 min remaining',
      'Dispatch queue: 2 other open jobs in the same cluster',
      'Inbound call volume: 1 client call received 12 min ago (unanswered)',
    ],
    historicalContext: [
      'In the past 90 days, 78% of jobs stalled >35 min resulted in an SLA breach',
      'This client cluster has a 91% SLA compliance rate — today\'s job is an outlier',
      'Technician Omar T. average job completion: 42 min; current job age: 38 min with no closure',
      'Similar stall patterns in Q1 2025 led to 3 escalation complaints from this client',
    ],
    confidenceFactors: [
      { label: 'Job stall duration', value: 92, color: '#FF4B4B' },
      { label: 'Technician GPS gap', value: 85, color: '#FF9B38' },
      { label: 'SLA time remaining', value: 80, color: '#FF9B38' },
      { label: 'Historical breach pattern', value: 78, color: '#A78BFA' },
    ],
    recommendedActions: [
      'Contact Omar T. immediately via WhatsApp to confirm on-site status',
      'If unreachable within 2 min, dispatch nearest available technician to Job #SI-298',
      'Proactively notify client of delay and provide updated ETA to maintain trust',
    ],
  },
  {
    id: 'i2',
    category: 'efficiency',
    title: 'Cluster A over-staffed by 2',
    body: 'Sara M. and Faisal N. are both idle within 0.5km of Cluster A. Recommend redeploying one to Cluster C which has 1 open incident.',
    confidence: 91,
    impact: 'medium',
    rationale:
      'Real-time GPS and job-assignment data show two fully available technicians idle within 0.5 km of Cluster A, while no open jobs exist in that zone. Simultaneously, Cluster C has one unassigned open incident with no technician nearby. Redeploying one idle resource from Cluster A to Cluster C eliminates idle cost and reduces Cluster C response time from an estimated 18 min to under 4 min.',
    currentContext: [
      'Sara M. — idle 0.2 km from Cluster A, no active job for 22 min',
      'Faisal N. — idle 0.4 km from Cluster A, no active job for 31 min',
      'Cluster A open incidents: 0',
      'Cluster C open incident: #MC-114 — AC fault, unassigned, raised 17 min ago',
      'Nearest technician to Cluster C (excluding Sara/Faisal): 3.1 km away',
    ],
    historicalContext: [
      'Cluster C averages 2.1 AC incidents per week; current pace is 3.4 — above trend',
      'Idle time >20 min per technician costs an estimated AED 38 in productivity loss',
      'Last redeployment from Cluster A to Cluster C (Feb 2025) resolved incident 6 min faster than SLA',
      'Over-staffing in one cluster while another is short has occurred 11 times in the past 60 days',
    ],
    confidenceFactors: [
      { label: 'Staff idle duration', value: 95, color: '#38D98A' },
      { label: 'Cluster C demand signal', value: 91, color: '#2E7FFF' },
      { label: 'Redeployment proximity', value: 88, color: '#38D98A' },
      { label: 'Historical pattern match', value: 84, color: '#A78BFA' },
    ],
    recommendedActions: [
      'Select one idle technician (Sara M. recommended — closest to Cluster C route) for redeployment',
      'Dispatch selected technician to Cluster C incident #MC-114 immediately',
      'Update the live resource allocation map and confirm ETA with Cluster C building contact',
    ],
  },
  {
    id: 'i3',
    category: 'prediction',
    title: 'Chiller failure likely this week',
    body: 'Chiller Unit C-04 shows 34% blockage and refrigerant at 72% capacity. Based on seasonal load patterns, failure within 4–6 days without PPM.',
    confidence: 77,
    impact: 'high',
    rationale:
      'Sensor data from Chiller Unit C-04 shows a 34% condenser coil blockage and refrigerant pressure sitting at 72% of optimal. Combined with current ambient temperatures and the seasonal peak load pattern for April, the AI model predicts full unit failure within 4 to 6 days if no preventive maintenance is performed. A reactive repair at this stage would cost approximately 3× more than a scheduled PPM intervention.',
    currentContext: [
      'Chiller C-04 condenser blockage: 34% (threshold for PPM: 25%)',
      'Refrigerant pressure: 72% of nominal — slow decline trend over 8 days',
      'Ambient temperature today: 38°C — peak seasonal load period',
      'Unit runtime hours since last service: 1,840 hrs (service interval: 2,000 hrs)',
      'No PPM ticket currently scheduled for C-04',
    ],
    historicalContext: [
      'In past 90 days, 3 chiller units with >30% blockage failed within 7 days without intervention',
      'C-04 failed once in June 2024 under similar conditions — reactive repair took 3 days and cost AED 18,400',
      'Seasonal load analysis shows April–May consistently the highest-risk period for chiller failures in this cluster',
      'Predictive maintenance scheduled 5+ days early has a 96% success rate in preventing full failure',
    ],
    confidenceFactors: [
      { label: 'Blockage severity', value: 88, color: '#FF9B38' },
      { label: 'Refrigerant decline trend', value: 81, color: '#FF9B38' },
      { label: 'Seasonal load model', value: 76, color: '#A78BFA' },
      { label: 'Historical failure match', value: 72, color: '#A78BFA' },
    ],
    recommendedActions: [
      'Raise a PPM work order for Chiller Unit C-04 within 24 hours',
      'Dispatch an HVAC specialist to clear condenser blockage and top up refrigerant',
      'Schedule a follow-up sensor check in 48 hours post-maintenance to confirm recovery',
    ],
  },
  {
    id: 'i4',
    category: 'anomaly',
    title: 'Unusually high AC calls — Villa cluster A',
    body: '7 AC-related calls from Cluster A in 48 hours vs. 1.2 average. Possible shared infrastructure fault — recommend building inspection.',
    confidence: 68,
    impact: 'medium',
    rationale:
      'Villa Cluster A generated 7 AC-related service calls within the past 48 hours, compared to the 30-day rolling average of 1.2 calls per 48-hour window. The spike is statistically anomalous and the geographic concentration across multiple units in the same cluster strongly suggests a shared infrastructure fault rather than isolated individual unit failures. A targeted building inspection is more efficient than treating these as separate incidents.',
    currentContext: [
      '7 AC-related calls from Cluster A in the past 48 hours (units 4A, 4B, 4C, 5A, 5B, 6A, 7C)',
      '30-day rolling average: 1.2 calls per 48-hour window for this cluster',
      'All calls describe similar symptoms: insufficient cooling and compressor noise',
      'Shared central air distribution duct runs through Building 4–7 basement level',
      'Last building-wide inspection: 6 months ago',
    ],
    historicalContext: [
      'A similar 6-call spike in August 2024 was traced to a faulty AHU damper on the shared duct — resolved in 1 visit',
      'Treating calls individually vs. as a cluster fault takes 4× longer on average and costs 2× more',
      '68% of multi-unit AC anomaly clusters in this estate type are caused by shared AHU or duct faults',
      'No single-unit hardware failure has produced more than 3 calls in 48 hrs historically in this cluster',
    ],
    confidenceFactors: [
      { label: 'Call volume deviation', value: 82, color: '#A78BFA' },
      { label: 'Geographic concentration', value: 76, color: '#2E7FFF' },
      { label: 'Symptom consistency', value: 71, color: '#A78BFA' },
      { label: 'Historical pattern match', value: 55, color: '#7A94B4' },
    ],
    recommendedActions: [
      'Dispatch a building inspector to Cluster A to assess shared AHU and central duct infrastructure',
      'Log all 7 AC incidents under a unified fault investigation ticket for consolidated tracking',
      'Brief building management on the investigation and provide a status update within 4 hours',
    ],
  },
];

const CATEGORY_CONFIG: Record<Insight['category'], { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  risk:       { icon: <AlertTriangle size={11} />, color: 'text-red-400',    bg: 'bg-red-500/20',    label: 'Risk' },
  efficiency: { icon: <TrendingUp size={11} />,   color: 'text-cyan-400',   bg: 'bg-cyan-500/20',   label: 'Efficiency' },
  prediction: { icon: <Clock size={11} />,        color: 'text-amber-400',  bg: 'bg-amber-500/20',  label: 'Prediction' },
  anomaly:    { icon: <Brain size={11} />,        color: 'text-purple-400', bg: 'bg-purple-500/20', label: 'Anomaly' },
};

const IMPACT_COLOR: Record<Insight['impact'], string> = {
  high:   'text-red-400',
  medium: 'text-amber-400',
  low:    'text-emerald-400',
};

const CONFIDENCE_COLOR = (c: number) => c >= 80 ? '#38D98A' : c >= 60 ? '#FF9B38' : '#FF4B4B';

interface Props {
  onToast: ToastFn;
}

export function AIInsightsPanel({ onToast }: Props) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string | null>('i1');
  const [assignInsight, setAssignInsight] = useState<InsightDetail | null>(null);
  const [viewInsight, setViewInsight] = useState<InsightDetail | null>(null);

  const visible = insights.filter(i => !dismissed.includes(i.id));

  const dismiss = (id: string) => setDismissed(d => [...d, id]);
  const toggle  = (id: string) => setExpanded(prev => prev === id ? null : id);

  const handleAssignConfirm = (candidateName: string) => {
    if (assignInsight) {
      onToast(`${candidateName} assigned to: ${assignInsight.title}`, 'success');
    }
    setAssignInsight(null);
  };

  return (
    <>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-[#EEF3FA] text-xs font-semibold uppercase tracking-wide" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              AI Insights
            </h3>
            <span className="px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-bold border border-purple-500/30">
              {visible.length}
            </span>
          </div>
          <span className="flex items-center gap-1 text-[10px] text-[#7A94B4]">
            <Brain size={10} className="text-purple-400" /> 4C360 Engine
          </span>
        </div>

        <div className="space-y-2">
          <AnimatePresence>
            {visible.map(insight => {
              const cat = CATEGORY_CONFIG[insight.category];
              const isOpen = expanded === insight.id;

              return (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-lg border border-[rgba(46,127,255,0.22)] bg-[rgba(17,32,64,0.85)] overflow-hidden backdrop-blur-xl"
                >
                  <div className="flex items-start gap-2.5 p-3 hover:bg-white/[0.02] transition-colors">
                    <button
                      onClick={() => toggle(insight.id)}
                      className="flex items-start gap-2.5 flex-1 min-w-0 text-left"
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${cat.bg} ${cat.color}`}>
                        {cat.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] text-[#EEF3FA] font-medium leading-snug mb-0.5">{insight.title}</div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold ${cat.color}`}>{cat.label}</span>
                          <span className="text-[10px] text-[#7A94B4]">·</span>
                          <span className={`text-[10px] font-semibold ${IMPACT_COLOR[insight.impact]}`}>{insight.impact} impact</span>
                          <span className="text-[10px] text-[#7A94B4]">·</span>
                          <span className="text-[10px] text-[#7A94B4]">{insight.confidence}% confidence</span>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => dismiss(insight.id)}
                      className="flex-shrink-0 text-[#7A94B4] hover:text-white transition-colors p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </div>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 pt-0 border-t border-[rgba(46,127,255,0.1)]">
                          <p className="text-[11px] text-[#7A94B4] leading-relaxed mt-2 mb-3">{insight.body}</p>

                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] text-[#7A94B4]">Confidence</span>
                              <span className="text-[10px] font-bold text-[#EEF3FA]">{insight.confidence}%</span>
                            </div>
                            <AnimatedBar value={insight.confidence} color={CONFIDENCE_COLOR(insight.confidence)} delay={0.1} />
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => setViewInsight(insight)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[#0A1628] text-[11px] text-[#7A94B4] hover:text-[#EEF3FA] border border-[rgba(46,127,255,0.2)] hover:border-[rgba(46,127,255,0.4)] transition-all"
                            >
                              <Eye size={11} /> View
                            </button>
                            <button
                              onClick={() => setAssignInsight(insight)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[#2E7FFF] text-white text-[11px] font-semibold hover:bg-blue-500 transition-colors"
                            >
                              <UserCheck size={11} /> Assign
                            </button>
                            <button
                              onClick={() => dismiss(insight.id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[#0A1628] text-[11px] text-[#7A94B4] hover:text-[#EEF3FA] border border-[rgba(46,127,255,0.2)] transition-all ml-auto"
                            >
                              <X size={11} /> Ignore
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {visible.length === 0 && (
            <div className="flex items-center gap-2 p-3 bg-[rgba(17,32,64,0.85)] border border-[rgba(46,127,255,0.22)] rounded-lg">
              <CheckCircle size={14} className="text-emerald-400" />
              <span className="text-[12px] text-[#7A94B4]">All insights acknowledged</span>
            </div>
          )}
        </div>
      </div>

      <AssignInsightModal
        open={assignInsight !== null}
        insight={assignInsight}
        onConfirm={handleAssignConfirm}
        onCancel={() => setAssignInsight(null)}
      />

      <InsightDetailModal
        open={viewInsight !== null}
        insight={viewInsight}
        onClose={() => setViewInsight(null)}
      />
    </>
  );
}
