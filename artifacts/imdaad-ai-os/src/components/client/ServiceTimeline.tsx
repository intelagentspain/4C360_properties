import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, Clock, Navigation, Wrench, Star,
  Brain, Shield, MapPin, Zap, ChevronDown, ChevronUp,
  FileImage, ThumbsUp,
} from 'lucide-react';
import { TrackingMap } from './TrackingMap';

type StepStatus = 'done' | 'active' | 'pending';

interface Step {
  id: string;
  label: string;
  time?: string;
  status: StepStatus;
  icon: React.ReactNode;
  accentColor: string;
}

const steps: Step[] = [
  { id: 'received', label: 'Request Received', time: '10:14 AM', status: 'done', icon: <CheckCircle size={11} />, accentColor: '#38D98A' },
  { id: 'assigned', label: 'Technician Assigned', time: '10:14 AM', status: 'done', icon: <Shield size={11} />, accentColor: '#38D98A' },
  { id: 'enroute', label: 'En Route', time: '10:16 AM', status: 'active', icon: <Navigation size={11} />, accentColor: '#2E7FFF' },
  { id: 'inprogress', label: 'Repair in Progress', status: 'pending', icon: <Wrench size={11} />, accentColor: '#7A94B4' },
  { id: 'completed', label: 'Completed & Confirmed', status: 'pending', icon: <CheckCircle size={11} />, accentColor: '#7A94B4' },
];

function ConfidenceBar({ value, color = '#38D98A', label }: { value: number; color?: string; label: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[9px] text-[#7A94B4]">{label}</span>
        <span className="text-[9px] font-bold" style={{ color }}>{value}%</span>
      </div>
      <div className="h-1 bg-[#0A1628] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

export function ServiceTimeline() {
  const [rating, setRating] = useState(4);
  const [ratingDone, setRatingDone] = useState(false);
  const [expandedStep, setExpandedStep] = useState<string | null>('enroute');

  const handleRate = (r: number) => {
    setRating(r);
    setRatingDone(true);
    setTimeout(() => setRatingDone(false), 2500);
  };

  const toggleStep = (id: string) => setExpandedStep(prev => prev === id ? null : id);

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-4 space-y-4">
      <TrackingMap />

      <div className="space-y-0">
        {steps.map((step, i) => {
          const isExpanded = expandedStep === step.id;
          const canExpand = step.status === 'done' || step.status === 'active';

          return (
            <div key={step.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                    step.status === 'done'
                      ? 'bg-emerald-500'
                      : step.status === 'active'
                      ? 'bg-[#2E7FFF] shadow-lg shadow-blue-500/40 animate-pulse'
                      : 'bg-[#1A3260]'
                  }`}
                  style={step.status === 'done' || step.status === 'active' ? { color: 'white' } : { color: '#7A94B4' }}
                >
                  {step.icon}
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-0.5 mt-1 mb-0 min-h-[28px] ${step.status === 'done' ? 'bg-emerald-500/40' : 'bg-[#1A3260]'}`}
                    style={{ height: isExpanded ? undefined : 28 }}
                  />
                )}
              </div>

              <div className="flex-1 pb-4 min-w-0">
                <button
                  onClick={() => canExpand && toggleStep(step.id)}
                  className={`w-full text-left flex items-center justify-between gap-2 mb-0.5 ${canExpand ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-[12px] font-semibold ${
                      step.status === 'done' ? 'text-emerald-400' :
                      step.status === 'active' ? 'text-[#EEF3FA]' : 'text-[#7A94B4]'
                    }`}>{step.label}</span>
                    {step.status === 'pending' && (
                      <span className="text-[9px] text-[#7A94B4] border border-[rgba(46,127,255,0.15)] rounded px-1.5 py-0.5">Pending</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {step.time && <span className="text-[9px] text-[#7A94B4]">{step.time}</span>}
                    {canExpand && (
                      isExpanded
                        ? <ChevronUp size={11} className="text-[#7A94B4]" />
                        : <ChevronDown size={11} className="text-[#7A94B4]" />
                    )}
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      {step.id === 'received' && (
                        <div className="mt-2 p-3 bg-[rgba(17,32,64,0.85)] border border-[rgba(46,127,255,0.2)] rounded-xl space-y-2.5">
                          <div className="flex items-center gap-2">
                            <Brain size={12} className="text-purple-400" />
                            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wide">AI Classification</span>
                            <span className="ml-auto text-[10px] font-bold text-purple-400">94% confident</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-[12px] text-[#EEF3FA] font-bold">AC / HVAC</div>
                              <div className="text-[10px] text-[#7A94B4]">Refrigerant / Cooling Failure</div>
                            </div>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded border text-red-400 bg-red-500/20 border-red-500/40">HIGH</span>
                          </div>
                          <div className="space-y-1.5">
                            <ConfidenceBar value={97} color="#a78bfa" label="Visual signal match" />
                            <ConfidenceBar value={91} color="#a78bfa" label="R-410A shortage profile" />
                            <ConfidenceBar value={88} color="#a78bfa" label="Asset service history" />
                          </div>
                          <div className="bg-[#0A1628] rounded-lg p-2 text-[10px] text-[#7A94B4] leading-relaxed">
                            Frost on evaporator coil + compressor vibration signature detected. Consistent with low refrigerant pressure.
                          </div>
                        </div>
                      )}

                      {step.id === 'assigned' && (
                        <div className="mt-2 p-3 bg-[rgba(17,32,64,0.85)] border border-[rgba(46,127,255,0.2)] rounded-xl space-y-2.5">
                          <div className="flex items-center gap-3 pb-2 border-b border-[rgba(46,127,255,0.1)]">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2E7FFF] to-[#00C6FF] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">KR</div>
                            <div className="flex-1">
                              <div className="text-[12px] text-[#EEF3FA] font-bold">Karim R.</div>
                              <div className="text-[10px] text-[#7A94B4]">HVAC Specialist · Imdaad</div>
                              <div className="flex items-center gap-1">
                                {[1,2,3,4,5].map(s => (
                                  <Star key={s} size={9} className={s <= 5 ? 'text-amber-400 fill-amber-400' : 'text-[#7A94B4]'} />
                                ))}
                                <span className="text-[9px] text-amber-400 ml-0.5">4.8 · 142 jobs</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide font-semibold">Why Karim was selected</div>
                          <div className="space-y-1.5">
                            <ConfidenceBar value={98} color="#38D98A" label="HVAC skill match" />
                            <ConfidenceBar value={94} color="#38D98A" label="Proximity score (0.4 km)" />
                            <ConfidenceBar value={96} color="#38D98A" label="Tools & parts availability" />
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            {[
                              { icon: <Shield size={10} />, text: 'HVAC Certified', color: 'text-emerald-400' },
                              { icon: <CheckCircle size={10} />, text: '142 jobs done', color: 'text-emerald-400' },
                              { icon: <Zap size={10} />, text: 'No active jobs', color: 'text-cyan-400' },
                              { icon: <MapPin size={10} />, text: '0.4 km away', color: 'text-blue-400' },
                            ].map((b, i) => (
                              <div key={i} className={`flex items-center gap-1.5 text-[10px] bg-[#0A1628] rounded-lg px-2 py-1.5 ${b.color}`}>
                                {b.icon} {b.text}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {step.id === 'enroute' && (
                        <div className="mt-2 p-3 bg-[rgba(17,32,64,0.85)] border border-[rgba(46,127,255,0.3)] rounded-xl space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                              <span className="text-[11px] text-blue-400 font-bold">Live Tracking Active</span>
                            </div>
                            <span className="text-[11px] font-bold text-[#EEF3FA]">ETA 18 min</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#2E7FFF] to-[#00C6FF] flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">KR</div>
                            <div>
                              <span className="text-[12px] text-[#EEF3FA] font-semibold">Karim R.</span>
                              <span className="text-[10px] text-[#7A94B4] ml-2">0.6 km away</span>
                            </div>
                          </div>

                          <div className="bg-[#0A1628] rounded-xl p-2.5 space-y-1.5">
                            <div className="text-[9px] text-[#7A94B4] font-semibold uppercase tracking-wide flex items-center gap-1">
                              <Clock size={9} /> ETA Logic
                            </div>
                            {[
                              { label: 'GPS distance', value: '0.6 km' },
                              { label: 'Traffic condition', value: 'Light — 9 min drive' },
                              { label: 'Check-in & prep', value: '~5 min' },
                              { label: 'Total estimated', value: '18 min', highlight: true },
                            ].map(r => (
                              <div key={r.label} className="flex items-center justify-between">
                                <span className="text-[10px] text-[#7A94B4]">{r.label}</span>
                                <span className={`text-[10px] font-medium ${r.highlight ? 'text-[#EEF3FA] font-bold' : 'text-[#EEF3FA]'}`}>{r.value}</span>
                              </div>
                            ))}
                          </div>

                          <div className="grid grid-cols-2 gap-1.5">
                            {[
                              { icon: <Shield size={10} />, text: 'HVAC Certified', color: 'text-emerald-400' },
                              { icon: <Wrench size={10} />, text: 'Tools on-board', color: 'text-blue-400' },
                            ].map((b, i) => (
                              <div key={i} className={`flex items-center gap-1.5 text-[10px] bg-[#0A1628] rounded-lg px-2 py-1.5 ${b.color}`}>
                                {b.icon} {b.text}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-[rgba(46,127,255,0.22)] bg-[rgba(17,32,64,0.85)] overflow-hidden">
        <div className="px-3 py-2 border-b border-[rgba(46,127,255,0.1)]">
          <span className="text-[10px] font-semibold text-[#7A94B4] uppercase tracking-wide">Evidence Preview</span>
        </div>
        <div className="p-3 space-y-2">
          <div className="text-[11px] text-[#7A94B4]">
            Your technician will upload before & after photos. They'll appear here once the job starts.
          </div>
          <div className="grid grid-cols-2 gap-2">
            {['Before', 'After'].map(label => (
              <div key={label} className="rounded-lg border border-dashed border-[rgba(46,127,255,0.2)] aspect-video flex flex-col items-center justify-center gap-1 bg-[#0A1628]">
                <FileImage size={16} className="text-[#7A94B4] opacity-40" />
                <span className="text-[9px] text-[#7A94B4] opacity-40">{label} photo</span>
                <span className="text-[8px] text-[#7A94B4] opacity-30">Awaiting job start</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-[#7A94B4]">
            <Shield size={10} className="text-emerald-400 flex-shrink-0" />
            Photos are stored securely and shared only with you and the operations team.
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[rgba(46,127,255,0.22)] bg-[rgba(17,32,64,0.85)] p-3">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2E7FFF] to-[#00C6FF] flex items-center justify-center text-white text-xs font-bold">KR</div>
          <div>
            <div className="text-[#EEF3FA] text-sm font-semibold">Karim R.</div>
            <div className="text-[11px] text-[#7A94B4]">HVAC Specialist</div>
            <div className="flex items-center gap-1 text-[11px] text-amber-400">
              {[1,2,3,4,5].map(s => <Star key={s} size={10} className="fill-amber-400" />)}
              <span className="ml-0.5">4.8 · 142 jobs</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-2">
          {[
            { icon: <Shield size={10} />, label: 'HVAC Certified', color: 'text-emerald-400' },
            { icon: <ThumbsUp size={10} />, label: '94% SLA rate', color: 'text-blue-400' },
            { icon: <Zap size={10} />, label: '8.4 min avg resp.', color: 'text-cyan-400' },
          ].map((b, i) => (
            <div key={i} className={`flex flex-col items-center gap-1 bg-[#0A1628] rounded-lg p-1.5 ${b.color}`}>
              {b.icon}
              <span className="text-[9px] text-center leading-tight text-[#7A94B4]">{b.label}</span>
            </div>
          ))}
        </div>
        <div className="text-[10px] text-[#7A94B4]">Currently: En route to Villa 23 · Checked in at 10:16 AM</div>
      </div>

      <div className="rounded-xl border border-[rgba(46,127,255,0.22)] bg-[rgba(17,32,64,0.85)] p-3">
        <div className="text-[11px] text-[#EEF3FA] font-semibold mb-2">Rate your last service · REQ-SI-2237</div>
        <div className="flex items-center gap-1 mb-1">
          {[1,2,3,4,5].map(s => (
            <button key={s} onClick={() => handleRate(s)} className="transition-transform hover:scale-125 active:scale-95">
              <Star size={22} className={s <= rating ? 'text-amber-400 fill-amber-400' : 'text-[#7A94B4]'} />
            </button>
          ))}
        </div>
        <AnimatePresence>
          {ratingDone && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle size={11} /> Rating saved — thank you!
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
