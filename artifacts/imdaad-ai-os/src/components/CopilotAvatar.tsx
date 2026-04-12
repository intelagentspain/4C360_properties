import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Mic, MicOff, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';

const ELEVENLABS_AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID as string | undefined;
if (ELEVENLABS_AGENT_ID) {
  console.log('[CopilotAvatar] ElevenLabs voice enabled — agent ID configured');
} else {
  console.warn('[CopilotAvatar] VITE_ELEVENLABS_AGENT_ID not set — voice mode disabled');
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

type VoiceStatus = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error';

interface VoiceSession {
  endSession(): Promise<void>;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function AvatarOrb({ size = 32, voiceStatus }: { size?: number; voiceStatus: VoiceStatus }) {
  const isListening = voiceStatus === 'listening';
  const isSpeaking = voiceStatus === 'speaking';
  const isActive = isListening || isSpeaking;

  const dotColor = isListening
    ? '#22d3ee'
    : isSpeaking
    ? '#3b82f6'
    : '#ffffff';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle at 35% 35%, #67e8f9 0%, #06b6d4 35%, #2563eb 70%, #1e3a8a 100%)',
          boxShadow: isActive
            ? '0 0 12px 3px rgba(6,182,212,0.55), inset 0 1px 2px rgba(255,255,255,0.35)'
            : '0 0 6px 1px rgba(6,182,212,0.25), inset 0 1px 2px rgba(255,255,255,0.25)',
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          top: '10%',
          left: '15%',
          width: '40%',
          height: '30%',
          background: 'radial-gradient(ellipse, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 100%)',
          borderRadius: '50%',
          transform: 'rotate(-20deg)',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          bottom: 0,
          right: 0,
          width: size * 0.28,
          height: size * 0.28,
          background: dotColor,
          border: `2px solid #0d1e3a`,
          transition: 'background 0.3s',
          boxShadow: `0 0 6px 2px ${dotColor}88`,
        }}
      />
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ border: `1.5px solid rgba(34,211,238,0.5)` }}
          animate={{ scale: [1, 1.35], opacity: [0.7, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
    </div>
  );
}

function FloatingOrb({ open, voiceStatus }: { open: boolean; voiceStatus: VoiceStatus }) {
  const isListening = voiceStatus === 'listening';
  const isSpeaking = voiceStatus === 'speaking';
  const isActive = isListening || isSpeaking;

  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      {!isActive && (
        <motion.span
          className="absolute inset-0 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.25) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.55], opacity: [open ? 0.55 : 0.3, 0] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
      {isActive && (
        <>
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{ border: '2px solid rgba(34,211,238,0.6)' }}
            animate={{ scale: [1, 1.55], opacity: [0.8, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, ease: 'easeOut' }}
          />
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{ border: '1.5px solid rgba(34,211,238,0.35)' }}
            animate={{ scale: [1, 1.85], opacity: [0.5, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, ease: 'easeOut', delay: 0.3 }}
          />
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{ border: '1px solid rgba(59,130,246,0.3)' }}
            animate={{ scale: [1, 2.2], opacity: [0.4, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, ease: 'easeOut', delay: 0.6 }}
          />
        </>
      )}

      <div
        className="relative w-14 h-14 rounded-full flex items-center justify-center overflow-hidden"
        style={{
          background: open
            ? 'radial-gradient(circle at 40% 35%, #67e8f9 0%, #06b6d4 40%, #1d4ed8 80%, #1e3a8a 100%)'
            : 'radial-gradient(circle at 35% 30%, #a5f3fc 0%, #06b6d4 35%, #2563eb 65%, #1e3a8a 100%)',
          boxShadow: isActive
            ? '0 0 28px 8px rgba(6,182,212,0.5), 0 4px 20px rgba(0,0,0,0.4)'
            : '0 0 16px 4px rgba(6,182,212,0.25), 0 4px 16px rgba(0,0,0,0.35)',
          transition: 'box-shadow 0.4s',
        }}
      >
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            top: '10%',
            left: '18%',
            width: '42%',
            height: '28%',
            background: 'radial-gradient(ellipse, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 100%)',
            transform: 'rotate(-15deg)',
          }}
        />
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div
              key="close"
              initial={{ opacity: 0, rotate: -45 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 45 }}
              transition={{ duration: 0.18 }}
              className="relative z-10"
            >
              <X className="w-6 h-6 text-white drop-shadow" />
            </motion.div>
          ) : (
            <motion.div
              key="orb-inner"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.18 }}
              className="relative z-10 w-7 h-7 rounded-full"
              style={{
                background: 'radial-gradient(circle at 40% 35%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.05) 100%)',
                border: '1.5px solid rgba(255,255,255,0.35)',
                boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.3)',
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function CopilotAvatar() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('idle');
  const [voiceActive, setVoiceActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const conversationRef = useRef<VoiceSession | null>(null);

  const voiceEnabled = Boolean(ELEVENLABS_AGENT_ID);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          id: generateId(),
          role: 'assistant',
          content: "Hello! I'm Imdaad Copilot, your AI assistant. I can help you navigate incidents, understand KPIs, manage client portfolios, and more. How can I help you today?",
        },
      ]);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { id: generateId(), role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));

      const data = await apiFetch<{ reply: string }>('/copilot/chat', {
        method: 'POST',
        body: JSON.stringify({ message: text.trim(), history }),
      });

      setMessages(prev => [
        ...prev,
        { id: generateId(), role: 'assistant', content: data.reply },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: generateId(),
          role: 'assistant',
          content: "I'm having trouble connecting right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [loading, messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const startVoice = useCallback(async () => {
    if (!voiceEnabled || voiceActive) return;

    try {
      setVoiceStatus('connecting');
      setVoiceActive(true);

      const { Conversation } = await import('@11labs/client');

      const conv = await Conversation.startSession({
        agentId: ELEVENLABS_AGENT_ID!,
        connectionType: 'websocket',
        onConnect: (props: { conversationId: string }) => {
          console.log('[CopilotAvatar] ElevenLabs connected — conversationId:', props.conversationId);
          setVoiceStatus('listening');
        },
        onDisconnect: () => {
          console.log('[CopilotAvatar] ElevenLabs disconnected');
          setVoiceStatus('idle');
          setVoiceActive(false);
          conversationRef.current = null;
        },
        onError: (message: string) => {
          console.error('[CopilotAvatar] ElevenLabs error:', message);
          setVoiceStatus('error');
          setVoiceActive(false);
          conversationRef.current = null;
        },
        onModeChange: (prop: { mode: 'speaking' | 'listening' }) => {
          console.log('[CopilotAvatar] ElevenLabs mode change:', prop.mode);
          if (prop.mode === 'speaking') {
            setVoiceStatus('speaking');
          } else if (prop.mode === 'listening') {
            setVoiceStatus('listening');
          }
        },
      });

      conversationRef.current = conv;
    } catch {
      setVoiceStatus('error');
      setVoiceActive(false);
    }
  }, [voiceEnabled, voiceActive]);

  const stopVoice = useCallback(async () => {
    if (conversationRef.current) {
      try {
        await conversationRef.current.endSession();
      } catch {
        // ignore
      }
      conversationRef.current = null;
    }
    setVoiceStatus('idle');
    setVoiceActive(false);
  }, []);

  const toggleVoice = useCallback(() => {
    if (voiceActive) {
      stopVoice();
    } else {
      startVoice();
    }
  }, [voiceActive, startVoice, stopVoice]);

  const handleClose = useCallback(() => {
    setOpen(false);
    if (voiceActive) stopVoice();
  }, [voiceActive, stopVoice]);

  const isListening = voiceStatus === 'listening';
  const isSpeaking = voiceStatus === 'speaking';
  const isConnecting = voiceStatus === 'connecting';

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        <AnimatePresence>
          {open && (
            <motion.div
              key="copilot-panel"
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="w-[360px] max-h-[520px] flex flex-col rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #0d1e3a 0%, #091627 100%)' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-white/5">
                <div className="relative flex-shrink-0">
                  <AvatarOrb size={32} voiceStatus={voiceStatus} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white leading-none">Imdaad Copilot</p>
                  <p className="text-[11px] text-cyan-400/80 mt-0.5">
                    {isConnecting ? 'Connecting…' : isSpeaking ? 'Speaking…' : isListening ? 'Listening…' : 'AI Assistant'}
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close copilot"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0" style={{ maxHeight: '340px' }}>
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-cyan-500/20 text-cyan-100 border border-cyan-500/30 rounded-br-sm'
                          : 'bg-white/8 text-white/90 border border-white/10 rounded-bl-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white/8 border border-white/10 rounded-2xl rounded-bl-sm px-3 py-2">
                      <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {voiceActive && (
                <div className="px-4 py-2 bg-cyan-500/10 border-t border-cyan-500/20 flex items-center gap-2">
                  <div className="flex gap-1 items-end h-4">
                    {[1, 2, 3, 4, 5].map(i => (
                      <motion.div
                        key={i}
                        className="w-1 rounded-full bg-cyan-400"
                        animate={isListening || isSpeaking ? {
                          height: ['4px', `${8 + Math.random() * 8}px`, '4px'],
                        } : { height: '4px' }}
                        transition={{ duration: 0.4 + i * 0.1, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-cyan-400">
                    {isConnecting ? 'Connecting to voice agent…' : isListening ? 'Listening — speak now' : isSpeaking ? 'Agent is speaking…' : 'Voice connected'}
                  </span>
                </div>
              )}

              {voiceStatus === 'error' && (
                <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20">
                  <p className="text-xs text-red-400">Voice connection failed. Try again or use text.</p>
                </div>
              )}

              {!voiceEnabled && (
                <div className="px-4 py-1.5 border-t border-white/5">
                  <p className="text-[11px] text-white/30 text-center">
                    Set VITE_ELEVENLABS_AGENT_ID to enable voice
                  </p>
                </div>
              )}

              <div className="px-3 py-3 border-t border-white/10 bg-white/5">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything…"
                    disabled={loading}
                    className="flex-1 bg-white/8 border border-white/15 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 disabled:opacity-50 transition-colors"
                  />
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || loading}
                    className="p-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-500/30 text-cyan-400 hover:text-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                  <button
                    onClick={toggleVoice}
                    disabled={!voiceEnabled || isConnecting}
                    title={
                      !voiceEnabled
                        ? 'Voice unavailable — set VITE_ELEVENLABS_AGENT_ID'
                        : voiceActive
                        ? 'Stop voice'
                        : 'Start voice conversation'
                    }
                    className={`p-2 rounded-xl border transition-colors ${
                      !voiceEnabled
                        ? 'opacity-30 cursor-not-allowed border-white/10 text-white/40 bg-white/5'
                        : voiceActive
                        ? 'bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30 hover:text-red-300'
                        : 'bg-white/8 border-white/15 text-white/60 hover:bg-white/15 hover:text-white'
                    }`}
                    aria-label={voiceActive ? 'Stop voice' : 'Start voice'}
                  >
                    {voiceActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setOpen(prev => !prev)}
          aria-label="Open Imdaad Copilot"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          className="focus:outline-none"
        >
          <FloatingOrb open={open} voiceStatus={voiceStatus} />
        </motion.button>
      </div>
    </>
  );
}
