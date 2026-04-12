import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Send, Mic, MicOff, Wind, Thermometer, ArrowUpDown, Flame,
  Droplets, Zap, Battery, AlertTriangle, Loader2, Brain, ChevronRight,
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
}

interface IncidentPrefill {
  title: string;
  description: string;
  severity: string;
  location?: string;
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
  techNotes?: string;
  open: boolean;
  onClose: () => void;
  onCreateIncident?: (prefill: IncidentPrefill) => void;
  variant?: 'drawer' | 'sheet';
}

const STATIC_CHIPS = [
  'Guide me through this step',
  'Is this normal?',
  'What evidence do I need?',
  'Should I escalate this?',
  'Summarize remaining steps',
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

export function AssetExpertCopilot({
  assetType,
  assetSubtype,
  assetName,
  assetId,
  siteName,
  ppmTemplateName,
  currentStep,
  checklistItems,
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
  const [suggestions, setSuggestions] = useState<string[]>(STATIC_CHIPS.slice(0, 4));
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [pendingIncident, setPendingIncident] = useState<IncidentPrefill | null>(null);
  const [incidentToast, setIncidentToast] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
        content: expert.greeting + (assetName ? `\n\nI can see you're working on **${assetName}**${currentStep ? ` — current step: ${currentStep}` : ''}.` : ''),
      }]);
    }
  }, [open, expert, assetName, currentStep, messages.length]);

  useEffect(() => {
    if (!open) {
      setMessages([]);
      setSuggestions(STATIC_CHIPS.slice(0, 4));
      setPendingIncident(null);
    }
  }, [open]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: text.trim() };
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

      if (incident) {
        setPendingIncident(incident);
        onCreateIncident?.(incident);
        setIncidentToast(true);
        setTimeout(() => setIncidentToast(false), 3000);
      }

      if (data.suggestions?.length > 0) {
        setSuggestions(data.suggestions);
      }
    } catch {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I could not connect to the expert system. Please check your connection and try again.',
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
            await sendMessage(data.transcript.trim());
          }
        } catch {
          setInput(prev => prev || '(transcription failed — please type your question)');
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
    setTimeout(() => setIncidentToast(false), 3000);
    setPendingIncident(null);
  }

  const isDrawer = variant === 'drawer';

  if (!open) return null;

  const containerClass = isDrawer
    ? 'fixed inset-y-0 right-0 z-50 w-full max-w-[420px] flex flex-col shadow-2xl'
    : 'fixed inset-x-0 bottom-0 z-50 flex flex-col shadow-2xl rounded-t-2xl overflow-hidden';

  const heightClass = isDrawer ? 'h-full' : 'h-[85vh]';

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={isDrawer ? { x: '100%' } : { y: '100%' }}
            animate={isDrawer ? { x: 0 } : { y: 0 }}
            exit={isDrawer ? { x: '100%' } : { y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 35 }}
            className={`${containerClass} ${heightClass} bg-[#0A1628] border-l border-[rgba(46,127,255,0.2)]`}
          >
            <div
              className="flex items-center gap-3 px-4 py-3 border-b border-[rgba(46,127,255,0.15)] flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #0D1E38 0%, #112040 100%)' }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: expert.accentBg, border: `1px solid ${expert.accentBorder}` }}
              >
                <IconComponent size={20} style={{ color: expert.accentColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[#EEF3FA] font-bold text-sm">{expert.name}</span>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full border"
                    style={{ color: expert.accentColor, background: expert.accentBg, borderColor: expert.accentBorder }}
                  >
                    LIVE
                  </span>
                </div>
                <p className="text-[10px] text-[#7A94B4] truncate">{expert.specialty}</p>
                {(assetName || currentStep) && (
                  <p className="text-[9px] text-[#4A6080] truncate mt-0.5">
                    {assetName && <span>{assetName}</span>}
                    {assetName && currentStep && <ChevronRight size={8} className="inline mx-0.5" />}
                    {currentStep && <span>{currentStep}</span>}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#7A94B4] hover:text-[#EEF3FA] hover:bg-white/10 transition-colors flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 custom-scrollbar">
              {messages.map(msg => (
                <MessageBubble key={msg.id} message={msg} expert={expert} />
              ))}

              {loading && (
                <div className="flex items-start gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: expert.accentBg, border: `1px solid ${expert.accentBorder}` }}
                  >
                    <IconComponent size={13} style={{ color: expert.accentColor }} />
                  </div>
                  <div className="bg-[#112040] border border-[rgba(46,127,255,0.15)] rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1 items-center h-4">
                      {[0, 1, 2].map(i => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full animate-bounce"
                          style={{ background: expert.accentColor, animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {pendingIncident && !loading && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-3">
                  <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-amber-400 text-xs font-bold mb-1">Corrective Incident Recommended</p>
                    <p className="text-[#EEF3FA] text-xs font-semibold">{pendingIncident.title}</p>
                    <p className="text-[#7A94B4] text-xs mt-0.5 line-clamp-2">{pendingIncident.description}</p>
                    <button
                      onClick={() => handleCreateIncident(pendingIncident)}
                      className="mt-2 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-900 bg-amber-400 hover:bg-amber-300 transition-colors"
                    >
                      Create Incident
                    </button>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="flex-shrink-0 border-t border-[rgba(46,127,255,0.15)] bg-[#0A1628]">
              <div className="flex gap-2 px-4 pt-3 pb-1 overflow-x-auto">
                {suggestions.map(chip => (
                  <button
                    key={chip}
                    onClick={() => handleChip(chip)}
                    disabled={loading || isTranscribing}
                    className="flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-colors disabled:opacity-40"
                    style={{
                      background: chip === 'Create corrective incident' ? 'rgba(245,158,11,0.12)' : expert.accentBg,
                      borderColor: chip === 'Create corrective incident' ? 'rgba(245,158,11,0.35)' : expert.accentBorder,
                      color: chip === 'Create corrective incident' ? '#F59E0B' : expert.accentColor,
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 px-4 py-3">
                <div className="flex-1 flex items-center gap-2 bg-[#112040] border border-[rgba(46,127,255,0.2)] rounded-xl px-3 py-2.5 focus-within:border-[rgba(46,127,255,0.45)] transition-colors">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                    placeholder={
                      isTranscribing ? 'Transcribing...' :
                      isRecording ? 'Listening...' :
                      'Ask the expert...'
                    }
                    disabled={loading || isRecording || isTranscribing}
                    className="flex-1 bg-transparent text-sm text-[#EEF3FA] placeholder-[#4A6080] outline-none min-w-0"
                  />
                  {isTranscribing && (
                    <Loader2 size={14} className="text-[#7A94B4] animate-spin flex-shrink-0" />
                  )}
                </div>

                <button
                  onClick={handleMic}
                  disabled={loading || isTranscribing}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 flex-shrink-0 ${
                    isRecording
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-[#112040] border border-[rgba(46,127,255,0.2)] text-[#7A94B4] hover:text-[#EEF3FA] hover:border-[rgba(46,127,255,0.4)]'
                  }`}
                >
                  {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                </button>

                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading || isRecording || isTranscribing}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 flex-shrink-0 text-white"
                  style={{ background: expert.accentColor }}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {incidentToast && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute bottom-24 left-4 right-4 bg-emerald-600 text-white text-sm font-semibold rounded-xl px-4 py-3 text-center shadow-lg"
                >
                  Corrective incident prefill ready
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
    const parts = content.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[80%] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm text-white"
          style={{ background: expert.accentColor }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: expert.accentBg, border: `1px solid ${expert.accentBorder}` }}
      >
        <IconComponent size={13} style={{ color: expert.accentColor }} />
      </div>
      <div className="max-w-[85%] bg-[#112040] border border-[rgba(46,127,255,0.15)] rounded-2xl rounded-tl-sm px-4 py-3">
        <p className="text-[#EEF3FA] text-sm leading-relaxed whitespace-pre-line">
          {renderContent(message.content)}
        </p>
      </div>
    </div>
  );
}
