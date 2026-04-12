import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Send, Mic, MicOff, Wind, Thermometer, ArrowUpDown, Flame,
  Droplets, Zap, Battery, AlertTriangle, Loader2, Brain, ChevronRight,
  CheckCircle2, Circle, TriangleAlert, PhoneCall,
} from 'lucide-react';
import { resolveExpert, type AssetExpert } from '@/lib/assetExperts';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
  Wind, Thermometer, ArrowUpDown, Flame, Droplets, Zap, Battery, Brain,
};

const API_BASE = (import.meta.env.VITE_API_URL ?? '/api') as string;

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isVoice?: boolean;
}

interface IncidentPrefill {
  title: string;
  description: string;
  severity: string;
  location?: string;
}

interface PriorIncident {
  title: string;
  description: string;
  date?: string;
  status?: string;
  severity?: string;
}

interface PartAvailability {
  name: string;
  inStock: number;
  status: string;
}

export interface AssetExpertCopilotProps {
  assetType: string;
  assetSubtype?: string;
  assetName?: string;
  assetId?: string;
  siteName?: string;
  ppmTemplateName?: string;
  currentStep?: string;
  checklistItems?: string[];
  mandatorySteps?: string[];
  evidenceRequired?: string[];
  completedSteps?: string[];
  techReadings?: Record<string, string>;
  priorIncidents?: PriorIncident[];
  partsAvailability?: PartAvailability[];
  techNotes?: string;
  open: boolean;
  onClose: () => void;
  onCreateIncident?: (prefill: IncidentPrefill) => void;
  variant?: 'drawer' | 'sheet';
}

const REGULAR_CHIPS = [
  'Guide me through this step',
  'Is this normal?',
  'What evidence do I need?',
  'Summarize remaining steps',
];

const ESCALATION_CHIPS = [
  'Should I escalate this?',
  'Create corrective incident',
];

function parseCreateIncident(content: string): IncidentPrefill | null {
  const match = content.match(/\[CREATE_INCIDENT\]\s*(\{[\s\S]*?\})/);
  if (!match) return null;
  try {
    const obj = JSON.parse(match[1]);
    return {
      title: String(obj.title ?? 'Corrective Maintenance Required'),
      description: String(obj.description ?? ''),
      severity: String(obj.severity ?? 'medium'),
    };
  } catch {
    return null;
  }
}

function stripCreateIncidentTag(content: string): string {
  return content.replace(/\[CREATE_INCIDENT\]\s*\{[\s\S]*?\}/, '').trim();
}

function hasEscalationKeyword(content: string): boolean {
  const lower = content.toLowerCase();
  return (
    lower.includes('escalat') ||
    lower.includes('stop the ppm') ||
    lower.includes('do not proceed') ||
    lower.includes('out of service') ||
    lower.includes('immediate') && lower.includes('danger') ||
    lower.includes('safety risk') ||
    lower.includes('corrective incident')
  );
}

export function AssetExpertCopilot({
  assetType,
  assetSubtype,
  assetName,
  assetId,
  siteName,
  ppmTemplateName,
  currentStep,
  checklistItems,
  mandatorySteps,
  evidenceRequired,
  completedSteps,
  techReadings,
  priorIncidents,
  partsAvailability,
  techNotes,
  open,
  onClose,
  onCreateIncident,
  variant = 'drawer',
}: AssetExpertCopilotProps) {
  const expert: AssetExpert = resolveExpert(assetType, assetSubtype, assetName);
  const IconComponent = ICON_MAP[expert.iconName] ?? Brain;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [pendingIncident, setPendingIncident] = useState<IncidentPrefill | null>(null);
  const [incidentToast, setIncidentToast] = useState(false);
  const [escalationFlag, setEscalationFlag] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recordingTimerRef = useRef<number | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: expert.greeting + (assetName ? `\n\nI can see you're working on **${assetName}**${currentStep ? ` — current step: *${currentStep}*` : ''}.` : ''),
      }]);
    }
  }, [open, expert, assetName, currentStep, messages.length]);

  useEffect(() => {
    if (!open) {
      setMessages([]);
      setSuggestions([]);
      setPendingIncident(null);
      setEscalationFlag(false);
    }
  }, [open]);

  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setRecordingSeconds(0);
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecording]);

  async function sendMessage(text: string, isVoice = false) {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: text.trim(), isVoice };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const apiMessages = updatedMessages.filter(m => m.id !== 'welcome').map(m => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch(`${API_BASE}/ppm/expert-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetType,
          assetSubtype,
          assetName,
          assetId,
          siteName,
          ppmTemplateName,
          currentStep,
          checklistItems,
          mandatorySteps,
          evidenceRequired,
          completedSteps,
          techReadings,
          priorIncidents,
          partsAvailability,
          techNotes,
          messages: apiMessages,
        }),
      });

      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json() as { reply: string; suggestions: string[] };

      const incident = parseCreateIncident(data.reply);
      const displayContent = stripCreateIncidentTag(data.reply);

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: displayContent,
      };

      setMessages(prev => [...prev, assistantMsg]);

      if (hasEscalationKeyword(displayContent)) {
        setEscalationFlag(true);
      }

      if (incident) {
        onCreateIncident?.(incident);
        setIncidentToast(true);
        setTimeout(() => setIncidentToast(false), 4000);
      }

      if (data.suggestions?.length > 0) {
        setSuggestions(data.suggestions.filter(s => !ESCALATION_CHIPS.includes(s)));
      }
    } catch {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'Connection lost — please check your signal and try again.',
      }]);
    } finally {
      setLoading(false);
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = e => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsTranscribing(true);
        try {
          const formData = new FormData();
          formData.append('audio', blob, 'voice.webm');
          const res = await fetch(`${API_BASE}/ai/transcribe-and-analyze-voice`, {
            method: 'POST',
            body: formData,
          });
          if (!res.ok) throw new Error(`${res.status}`);
          const data = await res.json() as { transcript: string };
          if (data.transcript?.trim()) {
            await sendMessage(data.transcript.trim(), true);
          }
        } catch {
          setInput('(transcription failed — please type your question)');
        } finally {
          setIsTranscribing(false);
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      alert('Microphone access is required for voice input.');
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setIsRecording(false);
  }

  function handleMic() {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  function handleChip(chip: string) {
    if (chip === 'Create corrective incident') {
      const prefill = pendingIncident ?? {
        title: assetName ? `Corrective Maintenance — ${assetName}` : 'Corrective Maintenance Required',
        description: ppmTemplateName
          ? `Corrective action required following PPM inspection: ${ppmTemplateName}.`
          : 'Corrective action required — please review findings from the PPM inspection.',
        severity: 'medium',
      };
      handleCreateIncident(prefill);
    } else {
      sendMessage(chip);
    }
  }

  function handleCreateIncident(prefill: IncidentPrefill) {
    onCreateIncident?.({ ...prefill, location: siteName });
    setIncidentToast(true);
    setTimeout(() => setIncidentToast(false), 4000);
    setPendingIncident(null);
  }

  const isDrawer = variant === 'drawer';
  const hasContext = !!(assetName || ppmTemplateName || currentStep);
  const chips = [...(suggestions.length > 0 ? suggestions : REGULAR_CHIPS)];

  if (!open) return null;

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={isDrawer ? { x: '100%' } : { y: '100%' }}
            animate={isDrawer ? { x: 0 } : { y: 0 }}
            exit={isDrawer ? { x: '100%' } : { y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 38 }}
            className={`fixed z-50 flex flex-col bg-[#07111F] overflow-hidden shadow-[0_-4px_40px_rgba(0,0,0,0.6)] ${
              isDrawer
                ? 'inset-y-0 right-0 w-full max-w-[440px] h-full border-l border-[rgba(46,127,255,0.18)]'
                : 'inset-x-0 bottom-0 h-[88vh] rounded-t-[24px] border-t border-[rgba(46,127,255,0.18)]'
            }`}
          >
            {/* Sheet drag handle */}
            {!isDrawer && (
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 rounded-full bg-[rgba(255,255,255,0.15)]" />
              </div>
            )}

            {/* ── HEADER ── */}
            <div
              className="flex items-center gap-3 px-4 py-3 flex-shrink-0 border-b border-[rgba(46,127,255,0.12)]"
              style={{ background: 'linear-gradient(160deg, #0D1E38 0%, #091628 100%)' }}
            >
              {/* Expert avatar */}
              <div
                className="relative w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: expert.accentBg, border: `1.5px solid ${expert.accentBorder}` }}
              >
                <IconComponent size={22} style={{ color: expert.accentColor }} />
                {/* Live pulse dot */}
                <span
                  className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#07111F]"
                  style={{ background: expert.accentColor }}
                >
                  <span
                    className="absolute inset-0 rounded-full animate-ping opacity-60"
                    style={{ background: expert.accentColor }}
                  />
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[#EEF3FA] font-bold text-[15px] leading-tight">{expert.name}</span>
                  <span
                    className="text-[9px] font-black tracking-widest px-1.5 py-0.5 rounded-md"
                    style={{ color: expert.accentColor, background: expert.accentBg }}
                  >
                    LIVE
                  </span>
                </div>
                <p className="text-[11px] text-[#7A94B4] truncate mt-0.5">{expert.specialty}</p>
              </div>

              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[#7A94B4] hover:text-[#EEF3FA] hover:bg-white/8 transition-all flex-shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* ── ESCALATION BANNER ── */}
            <AnimatePresence>
              {escalationFlag && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden flex-shrink-0"
                >
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-red-950/80 border-b border-red-500/30">
                    <TriangleAlert size={14} className="text-red-400 flex-shrink-0" />
                    <p className="text-red-300 text-[11px] font-bold flex-1">Escalation recommended — contact your supervisor before continuing</p>
                    <button
                      onClick={() => handleChip('Create corrective incident')}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 text-[10px] font-bold hover:bg-red-500/30 transition-colors flex-shrink-0"
                    >
                      <PhoneCall size={10} /> Escalate
                    </button>
                    <button onClick={() => setEscalationFlag(false)} className="text-red-600 hover:text-red-400 ml-1">
                      <X size={12} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── CONTEXT CARD ── */}
            {hasContext && (
              <div className="flex-shrink-0 mx-4 mt-3 mb-1 rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.06)]"
                style={{ background: 'rgba(17,32,64,0.7)' }}
              >
                <div className="px-3.5 pt-2.5 pb-2 flex flex-col gap-1.5">
                  {assetName && (
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: expert.accentColor }} />
                      <span className="text-[11px] text-[#EEF3FA] font-semibold truncate">{assetName}</span>
                      {assetId && <span className="text-[9px] text-[#4A6080] font-mono flex-shrink-0">{assetId}</span>}
                      {siteName && <span className="text-[9px] text-[#4A6080] ml-auto flex-shrink-0 truncate">{siteName}</span>}
                    </div>
                  )}
                  {ppmTemplateName && (
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-transparent flex-shrink-0" />
                      <span className="text-[10px] text-[#7A94B4] truncate">PPM: {ppmTemplateName}</span>
                    </div>
                  )}
                  {currentStep && (
                    <div
                      className="flex items-center gap-2 mt-0.5 px-2.5 py-1.5 rounded-xl"
                      style={{ background: `${expert.accentColor}18`, border: `1px solid ${expert.accentColor}30` }}
                    >
                      <CheckCircle2 size={11} style={{ color: expert.accentColor }} className="flex-shrink-0" />
                      <span className="text-[11px] font-semibold truncate" style={{ color: expert.accentColor }}>
                        Current step: {currentStep}
                      </span>
                    </div>
                  )}
                  {checklistItems && checklistItems.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {checklistItems.slice(0, 3).map((item, i) => (
                        <span
                          key={i}
                          className="flex items-center gap-1 text-[9px] text-[#7A94B4] bg-white/4 border border-white/8 px-2 py-0.5 rounded-full"
                        >
                          <Circle size={6} className="flex-shrink-0 opacity-40" />
                          {item}
                        </span>
                      ))}
                      {checklistItems.length > 3 && (
                        <span className="text-[9px] text-[#4A6080] px-2 py-0.5">+{checklistItems.length - 3} more</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── CHAT THREAD ── */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 custom-scrollbar">
              {messages.map(msg => (
                <MessageBubble key={msg.id} message={msg} expert={expert} />
              ))}

              {/* Loading dots */}
              {loading && (
                <div className="flex items-end gap-2">
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: expert.accentBg, border: `1px solid ${expert.accentBorder}` }}
                  >
                    <IconComponent size={13} style={{ color: expert.accentColor }} />
                  </div>
                  <div
                    className="rounded-2xl rounded-bl-sm px-4 py-3"
                    style={{ background: 'rgba(17,32,64,0.8)', border: '1px solid rgba(46,127,255,0.12)' }}
                  >
                    <div className="flex gap-1.5 items-center h-4">
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 rounded-full"
                          style={{ background: expert.accentColor }}
                          animate={{ y: [0, -5, 0] }}
                          transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.15 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── QUICK CHIPS ── */}
            <div className="flex-shrink-0 bg-[#07111F] border-t border-[rgba(255,255,255,0.05)]">
              <div className="px-3 pt-3 pb-1">
                <div
                  className="flex gap-2 overflow-x-auto pb-1"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {/* Regular chips */}
                  {chips.map(chip => (
                    <button
                      key={chip}
                      onClick={() => handleChip(chip)}
                      disabled={loading || isTranscribing || isRecording}
                      className="flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all disabled:opacity-35 active:scale-95 whitespace-nowrap"
                      style={{
                        background: expert.accentBg,
                        borderColor: expert.accentBorder,
                        color: expert.accentColor,
                      }}
                    >
                      {chip}
                    </button>
                  ))}

                  {/* Divider */}
                  <div className="w-px flex-shrink-0 bg-[rgba(255,255,255,0.08)] mx-1 self-stretch" />

                  {/* Escalation chips */}
                  <button
                    onClick={() => handleChip('Should I escalate this?')}
                    disabled={loading || isTranscribing || isRecording}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all disabled:opacity-35 active:scale-95 whitespace-nowrap bg-[rgba(249,115,22,0.1)] border-[rgba(249,115,22,0.3)] text-orange-400 hover:bg-[rgba(249,115,22,0.18)]"
                  >
                    <TriangleAlert size={10} />
                    Escalate?
                  </button>

                  <button
                    onClick={() => handleChip('Create corrective incident')}
                    disabled={loading || isTranscribing || isRecording}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all disabled:opacity-35 active:scale-95 whitespace-nowrap bg-[rgba(239,68,68,0.12)] border-[rgba(239,68,68,0.35)] text-red-400 hover:bg-[rgba(239,68,68,0.2)]"
                  >
                    <AlertTriangle size={10} />
                    Log Incident
                  </button>
                </div>
              </div>

              {/* ── INPUT ROW ── */}
              <div className="px-3 pb-4 pt-2">
                <AnimatePresence mode="wait">
                  {isRecording ? (
                    /* Recording state overlay */
                    <motion.div
                      key="recording"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="flex items-center gap-3 bg-red-950/60 border border-red-500/40 rounded-2xl px-4 py-3"
                    >
                      {/* Animated waveform bars */}
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        {[3, 6, 4, 8, 5, 7, 3, 6].map((h, i) => (
                          <motion.div
                            key={i}
                            className="w-0.5 rounded-full bg-red-400"
                            animate={{ height: [`${h}px`, `${h * 2.5}px`, `${h}px`] }}
                            transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.06, ease: 'easeInOut' }}
                          />
                        ))}
                      </div>
                      <div className="flex-1">
                        <p className="text-red-300 text-[13px] font-semibold">Listening…</p>
                        <p className="text-red-600 text-[10px] font-mono">{formatTime(recordingSeconds)}</p>
                      </div>
                      <button
                        onClick={stopRecording}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500 hover:bg-red-400 text-white text-[12px] font-bold transition-colors flex-shrink-0 active:scale-95"
                      >
                        <MicOff size={13} />
                        Stop
                      </button>
                    </motion.div>
                  ) : isTranscribing ? (
                    /* Transcribing state */
                    <motion.div
                      key="transcribing"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="flex items-center gap-3 bg-[rgba(46,127,255,0.08)] border border-[rgba(46,127,255,0.2)] rounded-2xl px-4 py-3"
                    >
                      <Loader2 size={16} className="text-[#2E7FFF] animate-spin flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-[#EEF3FA] text-[13px] font-semibold">Transcribing voice note…</p>
                        <p className="text-[#7A94B4] text-[10px]">Converting to text, please wait</p>
                      </div>
                    </motion.div>
                  ) : (
                    /* Normal input */
                    <motion.div
                      key="input"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex items-center gap-2"
                    >
                      <div className="flex-1 flex items-center gap-2 bg-[#0D1E38] border border-[rgba(46,127,255,0.18)] rounded-xl px-3.5 py-2.5 focus-within:border-[rgba(46,127,255,0.45)] transition-colors">
                        <input
                          ref={inputRef}
                          value={input}
                          onChange={e => setInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              sendMessage(input);
                            }
                          }}
                          placeholder="Ask the expert…"
                          disabled={loading}
                          className="flex-1 bg-transparent text-[14px] text-[#EEF3FA] placeholder-[#3A5070] outline-none min-w-0"
                        />
                      </div>

                      {/* Mic button */}
                      <button
                        onClick={handleMic}
                        disabled={loading}
                        className="w-11 h-11 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 flex-shrink-0 bg-[#0D1E38] border border-[rgba(46,127,255,0.2)] text-[#7A94B4] hover:text-[#EEF3FA] hover:border-[rgba(46,127,255,0.4)] active:scale-95"
                      >
                        <Mic size={17} />
                      </button>

                      {/* Send button */}
                      <button
                        onClick={() => sendMessage(input)}
                        disabled={!input.trim() || loading}
                        className="w-11 h-11 rounded-xl flex items-center justify-center transition-all disabled:opacity-35 flex-shrink-0 text-white active:scale-95"
                        style={{
                          background: input.trim() && !loading
                            ? expert.accentColor
                            : 'rgba(46,127,255,0.25)',
                        }}
                      >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* ── INCIDENT TOAST ── */}
            <AnimatePresence>
              {incidentToast && (
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="absolute bottom-28 left-4 right-4 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl"
                  style={{ background: 'linear-gradient(135deg, #065f46, #047857)', border: '1px solid rgba(16,185,129,0.4)' }}
                >
                  <CheckCircle2 size={18} className="text-emerald-300 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-emerald-100 text-[13px] font-bold">Incident logged</p>
                    <p className="text-emerald-400 text-[10px]">Prefill ready — supervisor notified</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function MessageBubble({ message, expert }: { message: ChatMessage; expert: AssetExpert }) {
  const isUser = message.role === 'user';
  const IconComponent = ICON_MAP[expert.iconName] ?? Brain;

  const renderContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, lineIdx) => {
      const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/g);
      const rendered = parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-bold text-[#EEF3FA]">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
          return <em key={i} className="italic text-[#A0B8D4]">{part.slice(1, -1)}</em>;
        }
        return <span key={i}>{part}</span>;
      });
      return (
        <span key={lineIdx}>
          {rendered}
          {lineIdx < lines.length - 1 && <br />}
        </span>
      );
    });
  };

  if (isUser) {
    return (
      <div className="flex justify-end gap-2">
        <div className="max-w-[78%] flex flex-col items-end gap-1">
          {message.isVoice && (
            <div className="flex items-center gap-1 text-[9px] text-[#4A6080]">
              <Mic size={9} />
              Voice note
            </div>
          )}
          <div
            className="rounded-2xl rounded-br-sm px-4 py-2.5 text-[14px] text-white"
            style={{ background: `linear-gradient(135deg, ${expert.accentColor}dd, ${expert.accentColor}aa)` }}
          >
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  const isAlert = message.content.toLowerCase().includes('abnormal') ||
    message.content.toLowerCase().includes('unsafe') ||
    message.content.toLowerCase().includes('do not') ||
    hasEscalationKeyword(message.content);

  return (
    <div className="flex items-end gap-2">
      <div
        className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mb-0.5"
        style={{ background: expert.accentBg, border: `1px solid ${expert.accentBorder}` }}
      >
        <IconComponent size={13} style={{ color: expert.accentColor }} />
      </div>
      <div
        className={`max-w-[84%] rounded-2xl rounded-bl-sm px-4 py-3 ${
          isAlert
            ? 'border border-amber-500/25 bg-[rgba(217,119,6,0.07)]'
            : 'border border-[rgba(46,127,255,0.1)] bg-[rgba(13,30,56,0.85)]'
        }`}
      >
        {isAlert && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <AlertTriangle size={11} className="text-amber-400 flex-shrink-0" />
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wide">Attention Required</span>
          </div>
        )}
        <p className="text-[#D8E6F5] text-[13.5px] leading-[1.6]">
          {renderContent(message.content)}
        </p>
      </div>
    </div>
  );
}
