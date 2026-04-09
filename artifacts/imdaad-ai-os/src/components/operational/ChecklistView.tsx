import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Circle, Camera, Upload, Image } from 'lucide-react';
import { mockChecklist } from '@/data/mockData';
import { ConfirmModal } from '@/components/shared/ConfirmModal';

interface Props {
  onToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export function ChecklistView({ onToast }: Props) {
  const [items, setItems] = useState(mockChecklist);
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [showPhotoUI, setShowPhotoUI] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const toggle = (id: number) => {
    if (id === 5) {
      setShowPhotoUI(true);
      return;
    }
    setItems(prev => prev.map(item => item.id === id ? { ...item, done: !item.done } : item));
  };

  const handlePhoto = () => {
    setPhotoUploaded(true);
    setShowPhotoUI(false);
    setItems(prev => prev.map(item => item.id === 5 ? { ...item, done: true } : item));
    onToast('Photo attached to work order #SI-2241', 'success');
  };

  const done = items.filter(i => i.done).length;
  const total = items.length;
  const pct = Math.round((done / total) * 100);
  const mandatoryDone = items.filter(i => i.mandatory).every(i => i.done);

  const handleSubmit = () => {
    setSubmitted(true);
    setShowSubmitModal(false);
    onToast('Work Order #SI-2241 Closed · Evidence attached · Sent to supervisor', 'success');
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-3">
      <div className="text-[12px] text-[#7A94B4] font-mono mb-3">Inspection Checklist · #SI-2241</div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-[#7A94B4]">{done}/{total} items · {pct}% complete</span>
        </div>
        <div className="h-2 bg-[#1A3260] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#2E7FFF] to-[#00C6FF] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {items.map(item => (
          <div key={item.id}>
            <button
              onClick={() => !submitted && toggle(item.id)}
              className={`w-full flex items-start gap-3 p-3 rounded-xl border transition-all duration-150 hover:-translate-y-0.5 text-left ${
                item.done
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-[rgba(17,32,64,0.85)] border-[rgba(46,127,255,0.22)]'
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {item.done ? (
                  <motion.div
                    initial={{ scale: 0.7 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  >
                    <CheckCircle size={16} className="text-emerald-400" />
                  </motion.div>
                ) : (
                  <Circle size={16} className="text-[#7A94B4]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-[12px] font-medium leading-snug ${item.done ? 'text-[#EEF3FA] line-through opacity-70' : 'text-[#EEF3FA]'}`}>
                  {item.id}. {item.text}
                </div>
                {item.mandatory && (
                  <span className="inline-block mt-0.5 text-[9px] font-bold text-amber-400 border border-amber-400/30 rounded px-1">
                    MANDATORY
                  </span>
                )}
                {item.evidenceRequired && (
                  <span className="inline-block mt-0.5 ml-1 text-[9px] font-bold text-blue-300 border border-blue-400/30 rounded px-1">
                    EVIDENCE REQ.
                  </span>
                )}
              </div>
            </button>

            {item.id === 5 && showPhotoUI && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2 p-3 bg-[#0A1628] rounded-xl border border-[rgba(46,127,255,0.3)]"
              >
                <div className="text-[12px] text-[#EEF3FA] font-semibold mb-3">Upload Before & After Photos</div>
                <div className="flex gap-2">
                  <button
                    onClick={handlePhoto}
                    className="flex-1 py-2.5 bg-[#2E7FFF] text-white text-xs font-semibold rounded-lg hover:bg-blue-500 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Camera size={13} /> Take Photo
                  </button>
                  <button
                    onClick={handlePhoto}
                    className="flex-1 py-2.5 border border-[rgba(46,127,255,0.4)] text-[#7A94B4] text-xs rounded-lg hover:bg-white/5 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Upload size={13} /> Upload
                  </button>
                </div>
              </motion.div>
            )}

            {item.id === 5 && photoUploaded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-1.5 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Image size={13} className="text-emerald-400" />
                  <span className="text-[11px] text-emerald-400 font-semibold">Photo attached · Geo-tagged: Villa 23, Silicon Oasis</span>
                </div>
                <div className="text-[10px] text-[#7A94B4]">Timestamp: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · Saved to work order #SI-2241</div>
                <div className="text-[10px] text-emerald-400 mt-0.5 font-medium">Photo stored in 4C360 — not on your personal device</div>
              </motion.div>
            )}
          </div>
        ))}
      </div>

      {submitted ? (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-center">
          <CheckCircle size={24} className="text-emerald-400 mx-auto mb-2" />
          <div className="text-[#EEF3FA] font-semibold text-sm">Work Order #SI-2241 Closed</div>
          <div className="text-[11px] text-[#7A94B4] mt-1">Evidence attached · Sent to supervisor</div>
        </div>
      ) : (
        <button
          disabled={!mandatoryDone}
          onClick={() => setShowSubmitModal(true)}
          className={`w-full py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
            mandatoryDone
              ? 'bg-[#2E7FFF] text-white hover:bg-blue-500 active:scale-95'
              : 'bg-[#1A3260] text-[#7A94B4] cursor-not-allowed'
          }`}
        >
          {mandatoryDone ? 'Submit Work Order' : 'Complete all mandatory items to submit'}
        </button>
      )}

      <ConfirmModal
        open={showSubmitModal}
        title="Close Work Order?"
        onConfirm={handleSubmit}
        onCancel={() => setShowSubmitModal(false)}
        confirmLabel="Close Work Order"
      >
        <div className="space-y-1.5">
          <div>Work Order: <span className="text-[#EEF3FA]">#SI-2241</span></div>
          <div>Items completed: <span className="text-[#EEF3FA]">{done}/{total}</span></div>
          <div>Evidence: <span className="text-emerald-400">{photoUploaded ? 'Attached' : 'Not attached'}</span></div>
        </div>
      </ConfirmModal>
    </div>
  );
}
