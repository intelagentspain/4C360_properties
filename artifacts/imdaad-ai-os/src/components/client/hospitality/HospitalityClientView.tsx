import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Mic, MessageCircle, ArrowLeft, Hotel } from 'lucide-react';
import type { ToastFn } from '@/lib/ui';
import { CameraMode } from './CameraMode';
import { UploadMode } from './UploadMode';
import { VoiceMode } from './VoiceMode';
import { AIChatMode } from './AIChatMode';
import { SuccessScreen } from './SuccessScreen';

export type ReportingMode = 'camera' | 'upload' | 'voice' | 'ai-chat';

interface Props {
  onToast: ToastFn;
  guestName?: string;
  propertyName?: string;
}

const MODES = [
  {
    id: 'camera' as ReportingMode,
    icon: Camera,
    title: 'Take a Photo',
    desc: 'Capture the issue with your camera',
    color: '#0D9488',
    bg: 'rgba(13,148,136,0.1)',
    border: 'rgba(13,148,136,0.3)',
    emoji: '📷',
  },
  {
    id: 'upload' as ReportingMode,
    icon: Upload,
    title: 'Upload a Photo',
    desc: 'Choose an image from your device',
    color: '#7C3AED',
    bg: 'rgba(124,58,237,0.1)',
    border: 'rgba(124,58,237,0.3)',
    emoji: '🖼️',
  },
  {
    id: 'voice' as ReportingMode,
    icon: Mic,
    title: 'Leave a Voice Note',
    desc: 'Record a quick voice message',
    color: '#B45309',
    bg: 'rgba(180,83,9,0.1)',
    border: 'rgba(180,83,9,0.3)',
    emoji: '🎙️',
  },
  {
    id: 'ai-chat' as ReportingMode,
    icon: MessageCircle,
    title: 'Talk to AI',
    desc: 'Chat with Layla, your service assistant',
    color: '#1D4ED8',
    bg: 'rgba(29,78,216,0.1)',
    border: 'rgba(29,78,216,0.3)',
    emoji: '💬',
  },
];

export function HospitalityClientView({ onToast, guestName = 'Guest', propertyName = 'Palace Residences' }: Props) {
  const [activeMode, setActiveMode] = useState<ReportingMode | null>(null);
  const [incidentRef, setIncidentRef] = useState<string | null>(null);

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
      <div className="flex flex-col h-full bg-[#FDFAF5]">
        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-[#E8DEC8] flex-shrink-0">
          <button
            onClick={handleBack}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F5EFE0] transition-colors"
          >
            <ArrowLeft size={18} className="text-[#5C4A2A]" />
          </button>
          <span className="text-[#5C4A2A] font-semibold text-sm">
            {MODES.find(m => m.id === activeMode)?.title}
          </span>
        </div>

        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {activeMode === 'camera' && (
              <motion.div
                key="camera"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full"
              >
                <CameraMode onSuccess={handleSuccess} onToast={onToast} />
              </motion.div>
            )}
            {activeMode === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full"
              >
                <UploadMode onSuccess={handleSuccess} onToast={onToast} />
              </motion.div>
            )}
            {activeMode === 'voice' && (
              <motion.div
                key="voice"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full"
              >
                <VoiceMode onSuccess={handleSuccess} onToast={onToast} />
              </motion.div>
            )}
            {activeMode === 'ai-chat' && (
              <motion.div
                key="ai-chat"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full"
              >
                <AIChatMode onSuccess={handleSuccess} onToast={onToast} guestName={guestName} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#FDFAF5] overflow-y-auto">
      <div
        className="flex-shrink-0 px-6 pt-8 pb-6"
        style={{
          background: 'linear-gradient(135deg, #1C3A35 0%, #2D5A50 100%)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.15)] flex items-center justify-center">
            <Hotel size={16} className="text-[#D4C5A0]" />
          </div>
          <div>
            <div className="text-[#D4C5A0] text-[10px] font-medium uppercase tracking-widest">{propertyName}</div>
            <div className="text-white text-[10px] opacity-60">Powered by Imdaad AI-OS</div>
          </div>
        </div>

        <h1 className="text-white text-2xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif' }}>
          How can we help you?
        </h1>
        <p className="text-[#A8C4B8] text-sm">
          Hello, {guestName}. Report any issue and our team will be with you shortly.
        </p>
      </div>

      <div className="flex-1 px-4 py-6">
        <p className="text-[#8B7355] text-xs font-medium uppercase tracking-widest mb-4">Choose how to report</p>

        <div className="grid grid-cols-2 gap-3">
          {MODES.map((mode, i) => {
            const Icon = mode.icon;
            return (
              <motion.button
                key={mode.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.3 }}
                onClick={() => setActiveMode(mode.id)}
                className="flex flex-col items-start p-4 rounded-2xl border text-left transition-all duration-200 active:scale-95 hover:shadow-md"
                style={{
                  backgroundColor: 'white',
                  borderColor: mode.border,
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: mode.bg }}
                >
                  <Icon size={20} style={{ color: mode.color }} />
                </div>
                <div className="font-semibold text-[13px] text-[#2C1810] mb-0.5">{mode.title}</div>
                <div className="text-[11px] text-[#8B7355] leading-relaxed">{mode.desc}</div>
              </motion.button>
            );
          })}
        </div>

        <div className="mt-6 p-4 rounded-2xl bg-[#F5EFE0] border border-[#E8DEC8]">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-[#0D9488]" />
            <span className="text-[11px] font-semibold text-[#5C4A2A]">24/7 Service Response</span>
          </div>
          <p className="text-[11px] text-[#8B7355]">
            Our team responds to all reported incidents within 30 minutes. For emergencies, please call the front desk.
          </p>
        </div>
      </div>
    </div>
  );
}
