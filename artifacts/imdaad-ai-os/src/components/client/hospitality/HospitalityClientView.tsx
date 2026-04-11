import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Mic, MessageCircle, ArrowLeft, Home, ExternalLink, Link2, Check } from 'lucide-react';
import type { ToastFn } from '@/lib/ui';
import { CameraMode } from './CameraMode';
import { UploadMode } from './UploadMode';
import { VoiceMode } from './VoiceMode';
import { AIChatMode } from './AIChatMode';
import { SuccessScreen } from './SuccessScreen';

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';

export type ReportingMode = 'camera' | 'upload' | 'voice' | 'ai-chat';

interface Props {
  onToast: ToastFn;
  guestName?: string;
  propertyName?: string;
  memberToken?: string;
}

const MODES = [
  {
    id: 'camera' as ReportingMode,
    icon: Camera,
    title: 'Take a Photo',
    desc: 'Capture the issue with your camera',
    color: '#4A7FA5',
    bg: 'rgba(74,127,165,0.08)',
    border: 'rgba(74,127,165,0.2)',
  },
  {
    id: 'upload' as ReportingMode,
    icon: Upload,
    title: 'Upload a Photo',
    desc: 'Choose an image from your device',
    color: '#7A6A55',
    bg: 'rgba(122,106,85,0.08)',
    border: 'rgba(122,106,85,0.2)',
  },
  {
    id: 'voice' as ReportingMode,
    icon: Mic,
    title: 'Leave a Voice Note',
    desc: 'Record a quick voice message',
    color: '#2D4A6E',
    bg: 'rgba(45,74,110,0.08)',
    border: 'rgba(45,74,110,0.2)',
  },
  {
    id: 'ai-chat' as ReportingMode,
    icon: MessageCircle,
    title: 'Talk to Layla',
    desc: 'Chat with your AI service assistant',
    color: '#B8913A',
    bg: 'rgba(184,145,58,0.08)',
    border: 'rgba(184,145,58,0.2)',
  },
];

export function HospitalityClientView({ onToast, guestName = 'Resident', propertyName = 'Dubai Silicon Oasis', memberToken }: Props) {
  const [activeMode, setActiveMode] = useState<ReportingMode | null>(null);
  const [incidentRef, setIncidentRef] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const reportUrl = `${window.location.origin}${BASE}/report${memberToken ? `?member=${encodeURIComponent(memberToken)}` : ''}`;

  function handleCopyLink() {
    navigator.clipboard.writeText(reportUrl).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    }).catch(() => {
      onToast('Could not copy link', 'error');
    });
  }

  const handleSuccess = (ref: string) => {
    setIncidentRef(ref);
    setActiveMode(null);
  };

  const handleBack = () => {
    setActiveMode(null);
  };

  if (incidentRef) {
    return (
      <SuccessScreen
        incidentRef={incidentRef}
        onDone={() => setIncidentRef(null)}
      />
    );
  }

  if (activeMode) {
    return (
      <div className="flex flex-col h-full" style={{ background: '#FDFAF6' }}>
        <div
          className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
          style={{ background: '#fff', borderBottom: '1px solid #EDE5D4' }}
        >
          <button
            onClick={handleBack}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: 'rgba(45,74,110,0.07)' }}
          >
            <ArrowLeft size={17} style={{ color: '#2D4A6E' }} />
          </button>
          <span className="font-semibold text-sm" style={{ color: '#1A2942' }}>
            {MODES.find(m => m.id === activeMode)?.title}
          </span>
        </div>

        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {activeMode === 'camera' && (
              <motion.div key="camera" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full">
                <CameraMode onSuccess={handleSuccess} onToast={onToast} />
              </motion.div>
            )}
            {activeMode === 'upload' && (
              <motion.div key="upload" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full">
                <UploadMode onSuccess={handleSuccess} onToast={onToast} />
              </motion.div>
            )}
            {activeMode === 'voice' && (
              <motion.div key="voice" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full">
                <VoiceMode onSuccess={handleSuccess} onToast={onToast} />
              </motion.div>
            )}
            {activeMode === 'ai-chat' && (
              <motion.div key="ai-chat" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full">
                <AIChatMode onSuccess={handleSuccess} onToast={onToast} guestName={guestName} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: '#FDFAF6' }}>
      <div
        className="flex-shrink-0 px-6 pt-10 pb-8"
        style={{
          background: 'linear-gradient(150deg, #1A2942 0%, #243555 60%, #2D4A6E 100%)',
        }}
      >
        <div className="flex items-center gap-2.5 mb-5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(201,169,110,0.2)', border: '1px solid rgba(201,169,110,0.35)' }}
          >
            <Home size={15} style={{ color: '#C9A96E' }} />
          </div>
          <div>
            <div
              className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: '#C9A96E', letterSpacing: '0.12em' }}
            >
              {propertyName}
            </div>
            <div className="text-[10px] opacity-45" style={{ color: '#fff' }}>Resident Services · Powered by Imdaad</div>
          </div>
        </div>

        <h1
          className="text-white text-2xl font-bold mb-2 leading-tight"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif', letterSpacing: '-0.01em' }}
        >
          Hello, {guestName}.
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
          How can we help with your home today? Our team responds within 30 minutes.
        </p>
      </div>

      <div className="flex-1 px-4 py-6">
        <p
          className="text-[10px] font-semibold uppercase tracking-widest mb-4"
          style={{ color: '#A0957A', letterSpacing: '0.12em' }}
        >
          How would you like to report?
        </p>

        <div className="grid grid-cols-2 gap-3">
          {MODES.map((mode, i) => {
            const Icon = mode.icon;
            return (
              <motion.button
                key={mode.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.28, ease: 'easeOut' }}
                onClick={() => setActiveMode(mode.id)}
                className="flex flex-col items-start p-4 rounded-2xl text-left transition-all duration-200 active:scale-95"
                style={{
                  background: '#FFFFFF',
                  border: `1px solid ${mode.border}`,
                  boxShadow: '0 1px 4px rgba(26,41,66,0.06)',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(26,41,66,0.12)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 4px rgba(26,41,66,0.06)'; }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: mode.bg }}
                >
                  <Icon size={19} style={{ color: mode.color }} />
                </div>
                <div className="font-semibold text-[13px] mb-0.5" style={{ color: '#1A2942' }}>{mode.title}</div>
                <div className="text-[11px] leading-relaxed" style={{ color: '#8B7D68' }}>{mode.desc}</div>
              </motion.button>
            );
          })}
        </div>

        <div
          className="mt-5 p-4 rounded-2xl"
          style={{ background: '#F5EFE0', border: '1px solid #EDE5D4' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#C9A96E' }} />
            <span className="text-[11px] font-semibold" style={{ color: '#5C4A2A' }}>24/7 Facility Management</span>
          </div>
          <p className="text-[11px] leading-relaxed" style={{ color: '#8B7355' }}>
            All requests are responded to within 30 minutes. For urgent emergencies, contact the concierge desk directly.
          </p>
        </div>

        <div className="mt-4 space-y-2">
          <a
            href={reportUrl}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 active:scale-[0.97]"
            style={{
              background: 'linear-gradient(135deg, #1A2942 0%, #2D4A6E 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(26,41,66,0.25)',
            }}
          >
            Report an Incident
            <ExternalLink size={14} />
          </a>

          <button
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-medium transition-all duration-200 active:scale-[0.97]"
            style={{
              background: '#FFFFFF',
              border: '1px solid #EDE5D4',
              color: linkCopied ? '#3A8A6E' : '#7A6A55',
            }}
          >
            {linkCopied ? (
              <>
                <Check size={14} style={{ color: '#3A8A6E' }} />
                Link copied!
              </>
            ) : (
              <>
                <Link2 size={14} />
                Copy direct link
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
