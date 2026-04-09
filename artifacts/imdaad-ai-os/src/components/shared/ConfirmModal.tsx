import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface Props {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
}

export function ConfirmModal({ open, title, children, onConfirm, onCancel, confirmLabel = 'Confirm' }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="bg-[#112040] border border-[rgba(46,127,255,0.3)] rounded-xl p-6 w-[360px] shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[#EEF3FA] font-semibold text-base">{title}</h3>
              <button onClick={onCancel} className="text-[#7A94B4] hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div className="text-[#7A94B4] text-sm mb-6">{children}</div>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-2 rounded-lg border border-[rgba(46,127,255,0.22)] text-[#7A94B4] text-sm hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-2 rounded-lg bg-[#2E7FFF] text-white text-sm font-semibold hover:bg-blue-500 transition-colors"
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
