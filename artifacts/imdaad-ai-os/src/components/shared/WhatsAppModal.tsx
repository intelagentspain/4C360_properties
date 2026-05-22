import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, MessageSquare } from 'lucide-react';
import { getStoredAuthToken } from '@/lib/api';

interface Props {
  recipientName: string;
  recipientPhone: string;
  defaultMessage?: string;
  onClose: () => void;
  onSent: (name: string) => void;
  onError: (name: string) => void;
}

export function WhatsAppModal({
  recipientName,
  recipientPhone,
  defaultMessage = '',
  onClose,
  onSent,
  onError,
}: Props) {
  const [message, setMessage] = useState(defaultMessage);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim() || sending) return;

    setSending(true);
    try {
      const base = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';
      const token = getStoredAuthToken();
      const res = await fetch(`${base}/api/whatsapp/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ to: recipientPhone, message: message.trim() }),
      });
      if (res.ok) {
        onSent(recipientName);
      } else {
        onError(recipientName);
      }
    } catch {
      onError(recipientName);
    } finally {
      setSending(false);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[3000] bg-black/60 backdrop-blur-sm flex items-center justify-center px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18 }}
          className="bg-[#0D1E38] border border-[rgba(46,127,255,0.3)] rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(46,127,255,0.15)]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <MessageSquare size={14} className="text-emerald-400" />
              </div>
              <div>
                <div className="text-[#EEF3FA] text-sm font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Send WhatsApp
                </div>
                <div className="text-[10px] text-[#7A94B4]">to {recipientName}</div>
              </div>
            </div>
            <button onClick={onClose} className="text-[#7A94B4] hover:text-white transition-colors rounded-md p-1 hover:bg-white/5">
              <X size={14} />
            </button>
          </div>

          <div className="px-5 py-4 space-y-3">
            <div>
              <label className="block text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1">Recipient</label>
              <div className="px-3 py-2 bg-[#0A1628] border border-[rgba(46,127,255,0.18)] rounded-lg text-[11px] text-[#7A94B4]">
                {recipientPhone}
              </div>
            </div>

            <div>
              <label className="block text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1">Message</label>
              <textarea
                autoFocus
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={5}
                placeholder="Type your message…"
                className="w-full px-3 py-2 bg-[#0A1628] border border-[rgba(46,127,255,0.22)] rounded-lg text-[11px] text-[#EEF3FA] placeholder-[#4A6080] focus:outline-none focus:border-[#2E7FFF] transition-colors resize-none"
              />
              <div className="text-right text-[9px] text-[#4A6080] mt-0.5">{message.length}/1600</div>
            </div>
          </div>

          <div className="flex gap-2 px-5 pb-5">
            <button
              onClick={onClose}
              className="flex-1 py-2 border border-[rgba(46,127,255,0.25)] text-[#7A94B4] text-xs rounded-lg hover:bg-white/5 hover:text-[#EEF3FA] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={!message.trim() || sending}
              className="flex-1 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-500 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <><Loader2 size={11} className="animate-spin" /> Sending…</>
              ) : (
                <><Send size={11} /> Send</>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
