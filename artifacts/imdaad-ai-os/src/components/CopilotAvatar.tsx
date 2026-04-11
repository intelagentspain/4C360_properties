import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Mic, MicOff, Bot, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';

// VITE_ELEVENLABS_AGENT_ID — set this in Replit Secrets to enable voice mode.
// If not set, the copilot operates in text-only mode.
const ELEVENLABS_AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID as string | undefined;

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
        connectionType: 'webrtc',
        onConnect: (_props: { conversationId: string }) => {
          setVoiceStatus('listening');
        },
        onDisconnect: () => {
          setVoiceStatus('idle');
          setVoiceActive(false);
          conversationRef.current = null;
        },
        onError: (_message: string) => {
          setVoiceStatus('error');
          setVoiceActive(false);
          conversationRef.current = null;
        },
        onModeChange: (prop: { mode: 'speaking' | 'listening' }) => {
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
  const isVoiceBusy = voiceActive;

  const avatarPulse = open || isVoiceBusy;

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
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  {isVoiceBusy && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-cyan-400 border-2 border-[#0d1e3a] animate-pulse" />
                  )}
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
          className="relative w-14 h-14 rounded-full shadow-xl focus:outline-none"
          style={{
            background: 'linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)',
            boxShadow: '0 0 0 0 rgba(6,182,212,0.4)',
          }}
        >
          {avatarPulse && (
            <>
              <motion.span
                className="absolute inset-0 rounded-full bg-cyan-400/30"
                animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
              />
              <motion.span
                className="absolute inset-0 rounded-full bg-cyan-400/20"
                animate={{ scale: [1, 1.9], opacity: [0.4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut', delay: 0.4 }}
              />
            </>
          )}
          <span className="relative z-10 flex items-center justify-center w-full h-full">
            {open ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <Bot className="w-6 h-6 text-white" />
            )}
          </span>
        </motion.button>
      </div>
    </>
  );
}
