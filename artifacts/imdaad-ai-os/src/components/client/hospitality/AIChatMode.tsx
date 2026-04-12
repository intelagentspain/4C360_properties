import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle, Loader2, Bot } from 'lucide-react';
import type { ToastFn } from '@/lib/ui';
import { submitIncident, type SubmitAiMetadata } from './incidentUtils';

interface Message {
  role: 'ai' | 'user';
  text: string;
}

interface IncidentSummary {
  issue: string;
  location: string;
  urgency: string;
  notes: string;
}

interface Props {
  onSuccess: (ref: string) => void;
  onToast: ToastFn;
  guestName?: string;
  clientId?: string;
  siteId?: string;
}

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';

const QUESTIONS = [
  (name: string) => `Hi ${name || 'there'} 👋 I'm Layla, your service assistant. I'm here to help you report an issue quickly. What seems to be the problem today?`,
  () => `Thank you for letting me know. Which room or area of the hotel is this affecting?`,
  () => `Got it. How urgent would you say this is? For example: "I can't sleep because of it" or "It's a minor inconvenience".`,
  () => `Understood. Is there anything else you'd like to add — any extra details that might help our team?`,
];

async function sendChatMessage(
  messages: { role: 'user' | 'assistant'; content: string }[],
): Promise<string | null> {
  try {
    const resp = await fetch(`${BASE_URL}/api/ai/incident-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });
    if (!resp.ok) return null;
    const data = await resp.json() as { reply?: string };
    return data.reply ?? null;
  } catch {
    return null;
  }
}

function buildDescription(summary: IncidentSummary): string {
  return `Issue: ${summary.issue}\nLocation: ${summary.location}\nUrgency: ${summary.urgency}\nNotes: ${summary.notes}`;
}

function inferCategory(text: string): string {
  const lower = text.toLowerCase();
  if (/\bac\b|air.?con|hvac|cool|heat|ventilat/.test(lower)) return 'HVAC';
  if (/leak|water|pipe|drip|flood|tap|plumb/.test(lower)) return 'Plumbing';
  if (/light|electric|power|socket|switch|circuit|fuse/.test(lower)) return 'Electrical';
  if (/lift|elevator/.test(lower)) return 'Lifts & Escalators';
  return 'General Maintenance';
}

function inferSeverity(urgency: string): 'low' | 'medium' | 'high' {
  const lower = urgency.toLowerCase();
  if (/urgent|emergency|can't sleep|cannot sleep|dangerous|major|flood/.test(lower)) return 'high';
  if (/inconvenient|significant|annoying|not working/.test(lower)) return 'medium';
  return 'low';
}

function buildChatMetadata(summary: IncidentSummary): SubmitAiMetadata {
  const category = inferCategory(summary.issue);
  return {
    confidence: 65,
    issueType: 'Resident Chat Report',
    category,
    identifiedAsset: 'Property Area',
    observations: [
      `Issue: ${summary.issue}`,
      `Location: ${summary.location}`,
      `Urgency: ${summary.urgency}`,
      summary.notes !== 'No additional details.' ? `Notes: ${summary.notes}` : 'No additional notes provided',
    ],
    recommendedAction: 'FM team to investigate and respond based on resident description.',
  };
}

export function AIChatMode({ onSuccess, onToast, guestName = 'Guest', clientId, siteId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [apiMessages, setApiMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [thinking, setThinking] = useState(false);
  const [summary, setSummary] = useState<IncidentSummary | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const TOTAL_QUESTIONS = 4;

  useEffect(() => {
    const greeting = QUESTIONS[0](guestName);
    setMessages([{ role: 'ai', text: greeting }]);
    setApiMessages([{ role: 'assistant', content: greeting }]);
  }, []);

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 100);
  }, [messages, thinking]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || thinking || summary) return;

    const newAnswers = [...answers, text];
    const userApiMsg = { role: 'user' as const, content: text };
    const newApiMsgs = [...apiMessages, userApiMsg];
    const nextQIndex = questionIndex + 1;

    setAnswers(newAnswers);
    setMessages(prev => [...prev, { role: 'user', text }]);
    setApiMessages(newApiMsgs);
    setInput('');
    setThinking(true);
    setQuestionIndex(nextQIndex);

    if (nextQIndex >= TOTAL_QUESTIONS) {
      const builtSummary: IncidentSummary = {
        issue: newAnswers[0] ?? '',
        location: newAnswers[1] ?? '',
        urgency: newAnswers[2] ?? '',
        notes: newAnswers[3] ?? 'No additional details.',
      };

      const confirmText = `Thank you, ${guestName.split(' ')[0]}. I have all the information needed. Here's a summary of your report — please review it before I submit it to our team.`;

      let aiReply = confirmText;
      const chatReply = await sendChatMessage(newApiMsgs.slice(-12));
      if (chatReply && !chatReply.includes('SUMMARY')) {
        aiReply = chatReply + '\n\nHere is your incident summary:';
      }

      setMessages(prev => [...prev, { role: 'ai', text: aiReply }]);
      setApiMessages(prev => [...prev, { role: 'assistant', content: aiReply }]);
      setSummary(builtSummary);
      setThinking(false);
    } else {
      const nextQuestion = QUESTIONS[nextQIndex]('');
      let aiReply = nextQuestion;

      const chatReply = await sendChatMessage(newApiMsgs.slice(-10));
      if (chatReply && chatReply.length < 300 && !chatReply.toLowerCase().includes('summary')) {
        aiReply = chatReply;
      }

      setMessages(prev => [...prev, { role: 'ai', text: aiReply }]);
      setApiMessages(prev => [...prev, { role: 'assistant', content: aiReply }]);
      setThinking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSubmit = async () => {
    if (!summary) return;
    setSubmitting(true);
    try {
      const severity = inferSeverity(summary.urgency);
      const ref = await submitIncident({
        source: 'ai-chat',
        title: summary.issue.length > 6 ? summary.issue.slice(0, 60) : 'Resident Chat Report',
        description: buildDescription(summary),
        severity,
        aiMetadata: buildChatMetadata(summary),
        clientId,
        siteId,
      });
      onToast(`Incident ${ref} submitted — our team is on it`, 'success');
      onSuccess(ref);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit';
      onToast(msg, 'error');
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FDFAF5]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'ai' && (
                <div className="w-7 h-7 rounded-full bg-[#1C3A35] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot size={14} className="text-[#A8C4B8]" />
                </div>
              )}
              <div
                className={`max-w-[80%] px-3 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#1C3A35] text-white rounded-tr-sm'
                    : 'bg-white border border-[#E8DEC8] text-[#2C1810] rounded-tl-sm shadow-sm'
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}

          {thinking && (
            <motion.div
              key="thinking"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex gap-2 justify-start"
            >
              <div className="w-7 h-7 rounded-full bg-[#1C3A35] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot size={14} className="text-[#A8C4B8]" />
              </div>
              <div className="bg-white border border-[#E8DEC8] rounded-2xl rounded-tl-sm px-3 py-2.5 flex items-center gap-1 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8B7355] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#8B7355] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#8B7355] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {summary && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-[#E8DEC8] bg-white overflow-hidden shadow-sm"
          >
            <div className="px-4 py-3 bg-[#F5EFE0] border-b border-[#E8DEC8] flex items-center gap-2">
              <CheckCircle size={14} className="text-[#0D9488]" />
              <span className="text-[12px] font-semibold text-[#2C1810]">Incident Summary</span>
            </div>
            <div className="px-4 py-3 space-y-2">
              {[
                { label: 'Issue reported', value: summary.issue },
                { label: 'Location', value: summary.location },
                { label: 'Urgency', value: summary.urgency },
                { label: 'Additional notes', value: summary.notes },
              ].map(row => (
                <div key={row.label} className="flex flex-col">
                  <span className="text-[10px] text-[#8B7355] uppercase tracking-wide font-medium">{row.label}</span>
                  <span className="text-[12px] text-[#2C1810] mt-0.5">{row.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <div className="flex-shrink-0 border-t border-[#E8DEC8] bg-white p-3">
        {summary ? (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3.5 rounded-2xl font-semibold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #1C3A35 0%, #2D5A50 100%)' }}
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
            {submitting ? 'Submitting report…' : 'Confirm & Submit Report'}
          </button>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your response…"
              disabled={thinking}
              className="flex-1 px-4 py-2.5 rounded-2xl border border-[#E8DEC8] bg-[#FDFAF5] text-[#2C1810] text-[13px] focus:outline-none focus:border-[#1C3A35] transition-colors placeholder-[#A89070] disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || thinking}
              className="w-11 h-11 rounded-full flex items-center justify-center text-white disabled:opacity-40 flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #1C3A35 0%, #2D5A50 100%)' }}
            >
              <Send size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
