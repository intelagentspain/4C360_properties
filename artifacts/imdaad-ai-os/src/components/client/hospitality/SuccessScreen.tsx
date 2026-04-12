import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Phone, RefreshCw, Mail, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';

interface Props {
  incidentRef: string;
  incidentSla?: number;
  onDone: () => void;
}

export function SuccessScreen({ incidentRef, incidentSla = 30, onDone }: Props) {
  const [email, setEmail] = useState('');
  const [emailState, setEmailState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const slaText = incidentSla <= 30 ? '30 minutes' : incidentSla <= 60 ? '1 hour' : `${incidentSla} minutes`;

  async function handleSendEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email || emailState === 'sending' || emailState === 'sent') return;
    setEmailState('sending');
    try {
      const res = await fetch(`${BASE_URL}/api/incidents/${encodeURIComponent(incidentRef)}/confirm-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setEmailState(res.ok ? 'sent' : 'error');
    } catch {
      setEmailState('error');
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#FDFAF5] overflow-y-auto">
      <div
        className="flex-shrink-0 px-6 pt-10 pb-8 flex flex-col items-center text-center"
        style={{ background: 'linear-gradient(135deg, #1C3A35 0%, #2D5A50 100%)' }}
      >
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 14 }}
          className="w-20 h-20 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center mb-4"
        >
          <CheckCircle size={40} className="text-white" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-white text-2xl font-bold mb-2"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          We're on it!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-[#A8C4B8] text-sm"
        >
          Your report has been received and our maintenance team has been alerted.
        </motion.p>
      </div>

      <div className="flex-1 px-4 py-6 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-4 rounded-2xl bg-white border border-[#E8DEC8] shadow-sm"
        >
          <div className="text-[10px] text-[#8B7355] uppercase tracking-widest font-medium mb-3">Incident Reference</div>
          <div className="flex items-center justify-between">
            <span className="text-[#2C1810] text-lg font-bold" style={{ fontFamily: 'monospace' }}>{incidentRef}</span>
            <div className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-full font-semibold">
              Submitted
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-4 rounded-2xl bg-white border border-[#E8DEC8] shadow-sm space-y-3"
        >
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-[#B45309]" />
            <span className="text-[13px] font-semibold text-[#2C1810]">Expected Response</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-[#F5EFE0] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '35%' }}
                transition={{ delay: 0.7, duration: 0.8 }}
                className="h-full rounded-full bg-[#B45309]"
              />
            </div>
            <span className="text-[11px] text-[#8B7355] flex-shrink-0">En route</span>
          </div>
          <p className="text-[12px] text-[#5C4A2A]">
            Our team will be with you within <span className="font-bold text-[#1C3A35]">{slaText}</span>. You'll be contacted if we need any additional information.
          </p>
        </motion.div>

        {/* Email confirmation card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="p-4 rounded-2xl bg-white border border-[#E8DEC8] shadow-sm"
        >
          {emailState === 'sent' ? (
            <div className="flex items-center gap-2.5 py-0.5">
              <CheckCircle2 size={17} className="text-emerald-600 flex-shrink-0" />
              <span className="text-[13px] text-emerald-700 font-semibold">Confirmation email sent!</span>
            </div>
          ) : (
            <form onSubmit={handleSendEmail}>
              <div className="flex items-center gap-2 mb-1.5">
                <Mail size={15} className="text-[#B45309]" />
                <span className="text-[13px] font-semibold text-[#2C1810]">Get email confirmation</span>
              </div>
              <p className="text-[11px] text-[#8B7355] mb-3 leading-relaxed">
                Receive your reference number and a link to track your request.
              </p>
              {emailState === 'error' && (
                <div className="flex items-center gap-1.5 mb-2 text-red-600">
                  <AlertCircle size={13} />
                  <span className="text-[11px]">Couldn't send — please try again</span>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 min-w-0 px-3 py-2.5 text-[12px] rounded-xl border border-[#E8DEC8] bg-[#FDFAF5] text-[#2C1810] placeholder-[#BDB09A] outline-none focus:border-[#1C3A35] transition-colors"
                  required
                />
                <button
                  type="submit"
                  disabled={emailState === 'sending' || !email}
                  className="px-4 py-2.5 rounded-xl font-semibold text-white text-[12px] flex items-center gap-1.5 disabled:opacity-60 transition-opacity flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #1C3A35 0%, #2D5A50 100%)' }}
                >
                  {emailState === 'sending' ? <Loader2 size={13} className="animate-spin" /> : 'Send'}
                </button>
              </div>
            </form>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="p-4 rounded-2xl bg-[#F5EFE0] border border-[#E8DEC8] flex items-start gap-3"
        >
          <div className="w-8 h-8 rounded-full bg-[#D4C5A0] flex items-center justify-center flex-shrink-0">
            <Phone size={15} className="text-[#5C4A2A]" />
          </div>
          <div>
            <div className="text-[12px] font-semibold text-[#2C1810] mb-0.5">Need immediate help?</div>
            <p className="text-[11px] text-[#8B7355]">For urgent emergencies, call the front desk or press the room assist button.</p>
          </div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          onClick={onDone}
          className="w-full py-3.5 rounded-2xl font-semibold text-[#5C4A2A] text-sm border border-[#E8DEC8] bg-white flex items-center justify-center gap-2 hover:bg-[#F5EFE0] transition-colors"
        >
          <RefreshCw size={15} />
          Report Another Issue
        </motion.button>
      </div>
    </div>
  );
}
