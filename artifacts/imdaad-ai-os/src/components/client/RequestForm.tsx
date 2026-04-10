import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Camera, CheckCircle, Loader2, Zap, Brain, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  onSubmit: () => void;
  onToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

const issueTypes = [
  { id: 'hvac', label: 'AC / HVAC', emoji: '❄️' },
  { id: 'electrical', label: 'Electrical', emoji: '💡' },
  { id: 'plumbing', label: 'Plumbing', emoji: '🚰' },
  { id: 'general', label: 'General Maintenance', emoji: '🔧' },
];

const aiClassification = {
  category: 'AC / HVAC',
  subCategory: 'Refrigerant / Cooling Failure',
  confidence: 94,
  priority: 'HIGH',
  priorityColor: 'text-red-400 bg-red-500/20 border-red-500/40',
  reasoning: 'Frost pattern on evaporator coil detected. Compressor vibration signature visible in photo metadata. Consistent with low refrigerant pressure.',
  signals: [
    { label: 'Visual signal', value: 'Frost on coil unit', match: 97 },
    { label: 'Pattern match', value: 'R-410A shortage profile', match: 91 },
    { label: 'Asset history', value: 'Last serviced 83 days ago', match: 88 },
  ],
  slaWindow: '2 hours',
};

export function RequestForm({ onSubmit, onToast }: Props) {
  const [selected, setSelected] = useState('hvac');
  const [description, setDescription] = useState('');
  const [photoAdded, setPhotoAdded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [classified, setClassified] = useState(false);
  const [aiExpanded, setAiExpanded] = useState(true);

  const handlePhotoAdd = () => {
    setClassifying(true);
    setTimeout(() => {
      setClassifying(false);
      setPhotoAdded(true);
      setClassified(true);
      onToast('AI classified: HVAC · High Priority · 94% confidence', 'info');
    }, 1800);
  };

  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      onToast('REQ-SI-2242 submitted · Karim R. dispatched · ETA 18 min', 'success');
      setTimeout(onSubmit, 2000);
    }, 1500);
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center h-full p-6 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mb-4">
          <CheckCircle size={32} className="text-emerald-400" />
        </div>
        <div className="text-[#EEF3FA] font-bold text-lg mb-1">Request Submitted</div>
        <div className="text-emerald-400 font-semibold text-sm mb-4">REQ-SI-2242</div>
        <div className="w-full bg-[rgba(17,32,64,0.85)] border border-[rgba(46,127,255,0.22)] rounded-xl p-4 text-left space-y-2">
          <div className="flex justify-between text-xs"><span className="text-[#7A94B4]">Issue type</span><span className="text-[#EEF3FA]">AC / HVAC</span></div>
          <div className="flex justify-between text-xs"><span className="text-[#7A94B4]">AI confidence</span><span className="text-emerald-400 font-bold">94%</span></div>
          <div className="flex justify-between text-xs"><span className="text-[#7A94B4]">Location</span><span className="text-[#EEF3FA]">Villa 23</span></div>
          <div className="flex justify-between text-xs"><span className="text-[#7A94B4]">Technician</span><span className="text-[#EEF3FA]">Karim R. · HVAC</span></div>
          <div className="flex justify-between text-xs"><span className="text-[#7A94B4]">ETA</span><span className="text-emerald-400">~18 minutes</span></div>
          <div className="flex justify-between text-xs"><span className="text-[#7A94B4]">SLA commitment</span><span className="text-[#EEF3FA]">2 hours</span></div>
        </div>
        <button onClick={onSubmit} className="mt-4 text-[#2E7FFF] text-sm font-semibold hover:text-blue-400 transition-colors">
          Track Your Request →
        </button>
      </motion.div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-4 space-y-4">
      <div>
        <h2 className="text-[#EEF3FA] font-bold text-base" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Report an Issue
        </h2>
        <p className="text-[11px] text-[#7A94B4]">Your request goes directly to our operations team</p>
      </div>

      <div>
        <div className="text-[11px] text-[#7A94B4] mb-2 uppercase tracking-wide font-medium">Issue Type</div>
        <div className="grid grid-cols-2 gap-2">
          {issueTypes.map(type => (
            <button
              key={type.id}
              onClick={() => setSelected(type.id)}
              className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all duration-150 ${
                selected === type.id
                  ? 'border-[#2E7FFF] bg-[rgba(46,127,255,0.15)] shadow-lg shadow-blue-500/20'
                  : 'border-[rgba(46,127,255,0.22)] bg-[rgba(17,32,64,0.85)] hover:border-[rgba(46,127,255,0.5)]'
              }`}
            >
              <span className="text-lg">{type.emoji}</span>
              <span className="text-[12px] font-medium text-[#EEF3FA]">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-[11px] text-[#7A94B4] mb-2 uppercase tracking-wide font-medium">Location</div>
        <div className="flex items-center gap-2 p-3 rounded-xl border border-[rgba(46,127,255,0.22)] bg-[rgba(17,32,64,0.85)]">
          <MapPin size={14} className="text-[#2E7FFF]" />
          <span className="text-[12px] text-[#EEF3FA] flex-1">Villa 23, Cluster A, Silicon Oasis</span>
          <button className="text-[11px] text-[#2E7FFF] font-medium">Edit</button>
        </div>
      </div>

      <div>
        <div className="text-[11px] text-[#7A94B4] mb-2 uppercase tracking-wide font-medium">Description</div>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Describe what you're experiencing… e.g. AC not cooling since this morning"
          className="w-full p-3 rounded-xl border border-[rgba(46,127,255,0.22)] bg-[rgba(17,32,64,0.85)] text-[#EEF3FA] text-[12px] resize-none h-20 placeholder-[#7A94B4] focus:outline-none focus:border-[#2E7FFF] transition-colors"
        />
      </div>

      <div>
        <div className="text-[11px] text-[#7A94B4] mb-2 uppercase tracking-wide font-medium">Photo</div>

        {classifying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full border border-[rgba(46,127,255,0.3)] rounded-xl p-5 flex flex-col items-center gap-3 bg-[rgba(17,32,64,0.85)]"
          >
            <div className="flex items-center gap-2">
              <Brain size={16} className="text-[#2E7FFF] animate-pulse" />
              <span className="text-[12px] text-[#7A94B4]">AI analysing your photo…</span>
            </div>
            <div className="w-full h-1.5 bg-[#0A1628] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.7, ease: 'linear' }}
                className="h-full rounded-full bg-gradient-to-r from-[#2E7FFF] to-[#00C6FF]"
              />
            </div>
            <div className="text-[10px] text-[#7A94B4]">Checking asset history · Matching issue patterns</div>
          </motion.div>
        )}

        {!classifying && !photoAdded && (
          <button
            onClick={handlePhotoAdd}
            className="w-full border-2 border-dashed border-[rgba(46,127,255,0.3)] rounded-xl p-5 flex flex-col items-center gap-2 hover:border-[rgba(46,127,255,0.6)] hover:bg-[rgba(46,127,255,0.05)] transition-all duration-150 group"
          >
            <Camera size={24} className="text-[#7A94B4] group-hover:text-[#2E7FFF] transition-colors" />
            <div className="text-[12px] text-[#7A94B4]">Tap to attach a photo</div>
            <div className="text-[10px] text-[#7A94B4]">AI will auto-classify your issue</div>
          </button>
        )}

        <AnimatePresence>
          {classified && photoAdded && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-2"
            >
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle size={13} className="text-emerald-400" />
                  <span className="text-[11px] text-emerald-400 font-semibold">Photo received</span>
                </div>
                <div className="w-full h-14 rounded-lg bg-gradient-to-br from-[#2E7FFF]/30 to-[#00C6FF]/20 border border-[rgba(46,127,255,0.2)] mb-1" />
                <div className="text-[10px] text-emerald-400">
                  📌 Attached directly to your request — not sent to any group.
                </div>
              </div>

              <div className="rounded-xl border border-purple-500/30 bg-[rgba(17,32,64,0.92)] overflow-hidden">
                <button
                  onClick={() => setAiExpanded(v => !v)}
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Brain size={12} className="text-purple-400" />
                    <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wide">AI Classification</span>
                    <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full border border-purple-500/30 font-bold">
                      {aiClassification.confidence}% confident
                    </span>
                  </div>
                  {aiExpanded ? <ChevronUp size={12} className="text-[#7A94B4]" /> : <ChevronDown size={12} className="text-[#7A94B4]" />}
                </button>

                <AnimatePresence>
                  {aiExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-purple-500/20"
                    >
                      <div className="px-3 pb-3 pt-2.5 space-y-2.5">
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <div className="text-[12px] text-[#EEF3FA] font-bold">{aiClassification.category}</div>
                            <div className="text-[10px] text-[#7A94B4]">{aiClassification.subCategory}</div>
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${aiClassification.priorityColor}`}>
                            {aiClassification.priority} PRIORITY
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] text-[#7A94B4] uppercase tracking-wide">Confidence</span>
                            <span className="text-[10px] font-bold text-purple-400">{aiClassification.confidence}%</span>
                          </div>
                          <div className="h-1.5 bg-[#0A1628] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${aiClassification.confidence}%` }}
                              transition={{ duration: 0.6 }}
                              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-400"
                            />
                          </div>
                        </div>

                        <div className="bg-[#0A1628] rounded-lg p-2.5">
                          <div className="text-[9px] text-[#7A94B4] mb-1 uppercase tracking-wide">How we classified this</div>
                          <p className="text-[10px] text-[#EEF3FA] leading-relaxed">{aiClassification.reasoning}</p>
                        </div>

                        <div className="space-y-1.5">
                          {aiClassification.signals.map(sig => (
                            <div key={sig.label} className="flex items-center gap-2">
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-0.5">
                                  <span className="text-[9px] text-[#7A94B4]">{sig.label}: <span className="text-[#EEF3FA]">{sig.value}</span></span>
                                  <span className="text-[9px] font-bold text-purple-400">{sig.match}%</span>
                                </div>
                                <div className="h-1 bg-[#0A1628] rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${sig.match}%` }}
                                    transition={{ duration: 0.5 }}
                                    className="h-full rounded-full bg-purple-500/70"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center gap-2 pt-1 border-t border-purple-500/15">
                          <CheckCircle size={10} className="text-emerald-400" />
                          <span className="text-[10px] text-[#7A94B4]">SLA window: <span className="text-[#EEF3FA] font-semibold">{aiClassification.slaWindow}</span></span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {loading ? (
        <div className="w-full py-3 rounded-xl bg-[#2E7FFF] text-white text-sm font-semibold flex items-center justify-center gap-2">
          <Loader2 size={16} className="animate-spin" />
          Submitting request…
        </div>
      ) : (
        <button
          onClick={handleSubmit}
          className="w-full py-3 rounded-xl bg-[#2E7FFF] text-white text-sm font-semibold hover:bg-blue-500 transition-all duration-150 active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
        >
          <Zap size={16} /> Submit Request
        </button>
      )}
    </div>
  );
}
