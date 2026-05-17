import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  UserCheck,
  AlertTriangle,
  TrendingUp,
  Clock,
  Brain,
  Star,
  MapPin,
  Wrench,
  CheckCircle,
} from 'lucide-react';
import { ConfidenceBar } from '@/components/shared/AnimatedBar';

interface Insight {
  id: string;
  category: 'risk' | 'efficiency' | 'prediction' | 'anomaly';
  title: string;
  body: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
}

interface Candidate {
  name: string;
  initials: string;
  role: string;
  availability: string;
  availabilityScore: number;
  skillMatch: number;
  proximity: string;
  proximityScore: number;
  rationale: string;
  avatarColor: string;
}

interface Props {
  open: boolean;
  insight: Insight | null;
  onConfirm: (candidateName: string) => void;
  onCancel: () => void;
}

const CATEGORY_CONFIG: Record<Insight['category'], { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  risk:       { icon: <AlertTriangle size={11} />, color: 'text-red-400',    bg: 'bg-red-500/20',    label: 'Risk' },
  efficiency: { icon: <TrendingUp size={11} />,   color: 'text-cyan-400',   bg: 'bg-cyan-500/20',   label: 'Efficiency' },
  prediction: { icon: <Clock size={11} />,        color: 'text-amber-400',  bg: 'bg-amber-500/20',  label: 'Prediction' },
  anomaly:    { icon: <Brain size={11} />,        color: 'text-purple-400', bg: 'bg-purple-500/20', label: 'Anomaly' },
};

const MOCK_CANDIDATES: Record<Insight['category'], Candidate[]> = {
  risk: [
    {
      name: 'Omar Al-Rashid',
      initials: 'OA',
      role: 'Senior Field Technician',
      availability: 'Available',
      availabilityScore: 100,
      skillMatch: 95,
      proximity: '0.3 km',
      proximityScore: 97,
      rationale: 'Closest available technician with SLA response certification, currently 0.3 km from site with no active jobs.',
      avatarColor: '#2E7FFF',
    },
    {
      name: 'Nadia Hassan',
      initials: 'NH',
      role: 'Field Supervisor',
      availability: 'Wrapping up',
      availabilityScore: 60,
      skillMatch: 88,
      proximity: '1.1 km',
      proximityScore: 80,
      rationale: 'Finishing current job in ~10 min. Strong SLA track record and familiar with this client cluster.',
      avatarColor: '#38D98A',
    },
    {
      name: 'Khalid Mansoor',
      initials: 'KM',
      role: 'Technician',
      availability: 'Available',
      availabilityScore: 100,
      skillMatch: 74,
      proximity: '2.4 km',
      proximityScore: 52,
      rationale: 'Available now but further away. Suitable backup if primary candidates are unreachable.',
      avatarColor: '#FF9B38',
    },
  ],
  efficiency: [
    {
      name: 'Sara Al-Mansouri',
      initials: 'SM',
      role: 'Field Technician',
      availability: 'Idle',
      availabilityScore: 100,
      skillMatch: 92,
      proximity: '0.2 km',
      proximityScore: 99,
      rationale: 'Currently idle in Cluster A — ideal candidate for redeployment to Cluster C to balance load.',
      avatarColor: '#2E7FFF',
    },
    {
      name: 'Faisal Nasser',
      initials: 'FN',
      role: 'Field Technician',
      availability: 'Idle',
      availabilityScore: 100,
      skillMatch: 87,
      proximity: '0.4 km',
      proximityScore: 95,
      rationale: 'Also idle nearby. Redeploying either Sara or Faisal resolves the over-staffing without travel delay.',
      avatarColor: '#A78BFA',
    },
    {
      name: 'Tariq Al-Balushi',
      initials: 'TB',
      role: 'Senior Technician',
      availability: 'Available',
      availabilityScore: 85,
      skillMatch: 79,
      proximity: '1.8 km',
      proximityScore: 65,
      rationale: 'Available and experienced, though redeployment from further away will take extra transit time.',
      avatarColor: '#FF9B38',
    },
  ],
  prediction: [
    {
      name: 'Yusuf Al-Farsi',
      initials: 'YF',
      role: 'HVAC Specialist',
      availability: 'Available',
      availabilityScore: 100,
      skillMatch: 97,
      proximity: '0.9 km',
      proximityScore: 88,
      rationale: 'Certified chiller technician with PPM specialisation. Best match for preventive maintenance before failure.',
      avatarColor: '#38D98A',
    },
    {
      name: 'Layla Khoury',
      initials: 'LK',
      role: 'Maintenance Engineer',
      availability: 'Available',
      availabilityScore: 100,
      skillMatch: 85,
      proximity: '1.5 km',
      proximityScore: 72,
      rationale: 'Strong PPM track record and refrigerant handling credentials. Available within the hour.',
      avatarColor: '#2E7FFF',
    },
    {
      name: 'Ahmed Saeed',
      initials: 'AS',
      role: 'Technician',
      availability: 'Wrapping up',
      availabilityScore: 55,
      skillMatch: 71,
      proximity: '2.1 km',
      proximityScore: 58,
      rationale: 'Qualified but finishing another job. Can be scheduled for follow-up if primary specialist handles initial assessment.',
      avatarColor: '#FF9B38',
    },
  ],
  anomaly: [
    {
      name: 'Mariam Qasim',
      initials: 'MQ',
      role: 'Building Inspector',
      availability: 'Available',
      availabilityScore: 100,
      skillMatch: 93,
      proximity: '0.6 km',
      proximityScore: 92,
      rationale: 'Closest inspector with shared-infrastructure fault experience. Ideal for the Cluster A building assessment.',
      avatarColor: '#A78BFA',
    },
    {
      name: 'Ibrahim Al-Zaabi',
      initials: 'IZ',
      role: 'HVAC Technician',
      availability: 'Available',
      availabilityScore: 100,
      skillMatch: 86,
      proximity: '1.2 km',
      proximityScore: 78,
      rationale: 'Strong AC diagnostics background. Can assist inspection and handle immediate repair if fault is confirmed.',
      avatarColor: '#2E7FFF',
    },
    {
      name: 'Reem Al-Nuaimi',
      initials: 'RA',
      role: 'Senior Technician',
      availability: 'Idle',
      availabilityScore: 100,
      skillMatch: 78,
      proximity: '1.7 km',
      proximityScore: 66,
      rationale: 'Available and experienced across AC systems. Good backup candidate for the secondary follow-up visit.',
      avatarColor: '#38D98A',
    },
  ],
};

const RECOMMENDED_STEPS: Record<Insight['category'], string[]> = {
  risk: [
    'Contact Omar Al-Rashid via WhatsApp to confirm immediate dispatch',
    'Update Job #SI-298 status to "Re-assigned" in the system',
    'Set SLA timer override and notify the client of incoming technician',
    'Log assignment rationale and override reason for audit trail',
  ],
  efficiency: [
    'Select one idle technician (Sara M. or Faisal N.) for redeployment',
    'Dispatch selected technician to Cluster C open incident',
    'Update resource allocation map in the dispatch dashboard',
    'Monitor Cluster C resolution time and confirm load balance',
  ],
  prediction: [
    'Dispatch Yusuf Al-Farsi for PPM assessment on Chiller Unit C-04',
    'Schedule refrigerant top-up and blockage clearance within 24 hours',
    'Log predictive maintenance ticket and set follow-up reminder',
    'Notify building facilities manager of preventive action taken',
  ],
  anomaly: [
    'Dispatch Mariam Qasim for immediate Cluster A building inspection',
    'Log all 7 AC incidents under a unified fault investigation ticket',
    'Isolate shared infrastructure components for testing',
    'Brief residents on investigation timeline via building management',
  ],
};

const AVAILABILITY_COLOR: Record<string, string> = {
  'Available':    'text-emerald-400',
  'Idle':         'text-cyan-400',
  'Wrapping up':  'text-amber-400',
};

export function AssignInsightModal({ open, insight, onConfirm, onCancel }: Props) {
  const [selectedCandidateName, setSelectedCandidateName] = useState<string | null>(null);

  useEffect(() => {
    if (open && insight) {
      setSelectedCandidateName(MOCK_CANDIDATES[insight.category][0].name);
    }
  }, [open, insight?.category]);

  if (!insight) return null;

  const cat = CATEGORY_CONFIG[insight.category];
  const steps = RECOMMENDED_STEPS[insight.category];
  const activeCandidates = MOCK_CANDIDATES[insight.category];
  const selected = activeCandidates.find(c => c.name === selectedCandidateName) ?? activeCandidates[0];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[5000] isolate flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.93, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.93, opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            className="relative z-[1] bg-[#0D1E38] border border-[rgba(46,127,255,0.3)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(46,127,255,0.15)]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${cat.bg} ${cat.color}`}>
                  {cat.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-[#EEF3FA] text-sm font-semibold leading-snug truncate" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {insight.title}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[10px] font-bold ${cat.color}`}>{cat.label}</span>
                    <span className="text-[10px] text-[#7A94B4]">·</span>
                    <span className="text-[10px] text-[#7A94B4]">{insight.confidence}% confidence</span>
                  </div>
                </div>
              </div>
              <button onClick={onCancel} className="text-[#7A94B4] hover:text-white transition-colors rounded-md p-1 hover:bg-white/5 flex-shrink-0 ml-2">
                <X size={14} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <UserCheck size={11} className="text-[#7A94B4]" />
                  <span className="text-[10px] text-[#7A94B4] uppercase tracking-wide font-semibold">AI Staff Recommendations</span>
                </div>

                <div className="space-y-2.5">
                  {activeCandidates.map((candidate, index) => {
                    const isSelected = selected.name === candidate.name;
                    return (
                    <div
                      key={candidate.name}
                      onClick={() => setSelectedCandidateName(candidate.name)}
                      className={`rounded-xl border p-3 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[rgba(46,127,255,0.6)] bg-[rgba(46,127,255,0.12)] ring-1 ring-[rgba(46,127,255,0.35)]'
                          : 'border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.6)] hover:border-[rgba(46,127,255,0.35)] hover:bg-[rgba(46,127,255,0.04)]'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 mb-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                          style={{ background: candidate.avatarColor }}
                        >
                          {candidate.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[12px] text-[#EEF3FA] font-semibold">{candidate.name}</span>
                            {index === 0 && (
                              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[9px] font-bold border border-amber-500/30">
                                <Star size={8} fill="currentColor" /> Optimal Match
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#7A94B4] mt-0.5">{candidate.role}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-2.5">
                        <div className="flex items-center gap-1">
                          <CheckCircle size={9} className={AVAILABILITY_COLOR[candidate.availability] ?? 'text-emerald-400'} />
                          <span className={`text-[9px] font-medium ${AVAILABILITY_COLOR[candidate.availability] ?? 'text-emerald-400'}`}>
                            {candidate.availability}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Wrench size={9} className="text-[#7A94B4]" />
                          <span className="text-[9px] text-[#7A94B4]">{candidate.skillMatch}% skill</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin size={9} className="text-[#7A94B4]" />
                          <span className="text-[9px] text-[#7A94B4]">{candidate.proximity}</span>
                        </div>
                      </div>

                      <div className="space-y-1 mb-2">
                        <ConfidenceBar label="Skill Match" value={candidate.skillMatch} color="#2E7FFF" delay={0.1 + index * 0.05} />
                        <ConfidenceBar label="Availability" value={candidate.availabilityScore} color="#38D98A" delay={0.15 + index * 0.05} />
                        <ConfidenceBar label="Proximity" value={candidate.proximityScore} color="#A78BFA" delay={0.2 + index * 0.05} />
                      </div>

                      <p className="text-[10px] text-[#7A94B4] leading-relaxed italic">
                        "{candidate.rationale}"
                      </p>
                    </div>
                  );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <CheckCircle size={11} className="text-[#7A94B4]" />
                  <span className="text-[10px] text-[#7A94B4] uppercase tracking-wide font-semibold">Recommended Steps</span>
                </div>
                <div className="space-y-1.5">
                  {steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-[#2E7FFF]/20 border border-[#2E7FFF]/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[8px] font-bold text-[#2E7FFF]">{i + 1}</span>
                      </div>
                      <p className="text-[11px] text-[#7A94B4] leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 px-5 pb-5 pt-1 border-t border-[rgba(46,127,255,0.1)]">
              <button
                onClick={onCancel}
                className="flex-1 py-2.5 border border-[rgba(46,127,255,0.25)] text-[#7A94B4] text-xs rounded-xl hover:bg-white/5 hover:text-[#EEF3FA] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => onConfirm(selected.name)}
                className="flex-1 py-2.5 bg-[#2E7FFF] text-white text-xs font-semibold rounded-xl hover:bg-blue-500 transition-colors flex items-center justify-center gap-1.5"
              >
                <UserCheck size={12} /> Confirm — {selected.name}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
