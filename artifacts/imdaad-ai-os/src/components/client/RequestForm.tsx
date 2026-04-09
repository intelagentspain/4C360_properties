import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Camera, CheckCircle, Loader2, Zap } from 'lucide-react';

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

export function RequestForm({ onSubmit, onToast }: Props) {
  const [selected, setSelected] = useState('hvac');
  const [description, setDescription] = useState('');
  const [photoAdded, setPhotoAdded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
          placeholder="Describe what you're experiencing... e.g. AC not cooling since this morning"
          className="w-full p-3 rounded-xl border border-[rgba(46,127,255,0.22)] bg-[rgba(17,32,64,0.85)] text-[#EEF3FA] text-[12px] resize-none h-20 placeholder-[#7A94B4] focus:outline-none focus:border-[#2E7FFF] transition-colors"
        />
      </div>

      <div>
        <div className="text-[11px] text-[#7A94B4] mb-2 uppercase tracking-wide font-medium">Photo</div>
        {!photoAdded ? (
          <button
            onClick={() => setPhotoAdded(true)}
            className="w-full border-2 border-dashed border-[rgba(46,127,255,0.3)] rounded-xl p-5 flex flex-col items-center gap-2 hover:border-[rgba(46,127,255,0.6)] hover:bg-[rgba(46,127,255,0.05)] transition-all duration-150 group"
          >
            <Camera size={24} className="text-[#7A94B4] group-hover:text-[#2E7FFF] transition-colors" />
            <div className="text-[12px] text-[#7A94B4]">Tap to attach a photo</div>
            <div className="text-[10px] text-[#7A94B4]">AI will auto-classify your issue</div>
            <div className="text-[10px] text-[#7A94B4]">(Supported: JPG, PNG, video)</div>
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3"
          >
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle size={14} className="text-emerald-400" />
              <span className="text-[12px] text-emerald-400 font-semibold">Photo received</span>
            </div>
            <div className="w-full h-16 rounded-lg bg-gradient-to-br from-[#2E7FFF]/30 to-[#00C6FF]/20 border border-[rgba(46,127,255,0.2)] mb-2" />
            <div className="text-[10px] text-emerald-400 font-medium">
              📌 Your photo is attached directly to your service request — not sent to any WhatsApp group.
            </div>
          </motion.div>
        )}
      </div>

      {loading ? (
        <div className="w-full py-3 rounded-xl bg-[#2E7FFF] text-white text-sm font-semibold flex items-center justify-center gap-2">
          <Loader2 size={16} className="animate-spin" />
          AI classifying your request...
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
