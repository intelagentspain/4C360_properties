import { useEffect, useRef, useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { streamText } from '@/lib/aiSimulator';
import { aiContent } from '../data/ai-responses';

type ChatMessage = {
  id: string;
  role: 'user' | 'ai';
  content: string;
  sources?: string[];
  streaming?: boolean;
};

const intentMap = [
  { keywords: ['handover', 'date', 'delay', 'slip', 'late'], responseIndex: 0 },
  { keywords: ['cost', 'budget', 'completion', 'eac', 'overrun', 'much'], responseIndex: 1 },
  { keywords: ['mep', 'clash', 'coordination', 'weeks', 'impact'], responseIndex: 2 },
];

function id() {
  return Math.random().toString(36).slice(2, 9);
}

function matchResponse(query: string) {
  const lower = query.toLowerCase();
  const match = intentMap.find(intent => intent.keywords.some(keyword => lower.includes(keyword)));
  if (match) return aiContent.askAI.queries[match.responseIndex];
  return {
    question: query,
    answer: "Based on the current programme, cost, and risk data for Lawnz Residences, I don't have a pre-computed answer for that specific question. In the full platform, this query would draw on live data from all connected modules. Key context: completion is 43%, CPI is 0.91, and the critical path has 21 days of float.",
    sources: ['ProjectCommand demo model'],
  };
}

export function AIForecastChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  const appendStreamedAnswer = (answer: string, sources: string[]) => {
    const messageId = id();
    setBusy(true);
    setMessages(current => [...current, { id: messageId, role: 'ai', content: '', sources, streaming: true }]);
    const start = window.setTimeout(() => {
      cleanupRef.current = streamText(answer, partial => {
        setMessages(current => current.map(msg => msg.id === messageId ? { ...msg, content: partial } : msg));
      }, () => {
        setMessages(current => current.map(msg => msg.id === messageId ? { ...msg, streaming: false } : msg));
        setBusy(false);
      }, 15);
    }, 500);
    cleanupRef.current = () => window.clearTimeout(start);
  };

  useEffect(() => {
    let cancelled = false;
    let delay = 250;
    aiContent.askAI.queries.forEach(query => {
      window.setTimeout(() => {
        if (cancelled) return;
        setMessages(current => [...current, { id: id(), role: 'user', content: query.question }]);
        appendStreamedAnswer(query.answer, query.sources);
      }, delay);
      delay += 1400;
    });
    return () => {
      cancelled = true;
      cleanupRef.current?.();
    };
  }, []);

  const send = () => {
    const trimmed = input.trim();
    if (!trimmed || busy) return;
    const response = matchResponse(trimmed);
    setMessages(current => [...current, { id: id(), role: 'user', content: trimmed }]);
    setInput('');
    appendStreamedAnswer(response.answer, response.sources);
  };

  return (
    <section className="flex h-full min-h-[520px] flex-col rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)]">
      <div className="border-b border-[rgba(46,127,255,0.18)] p-4">
        <div className="flex items-center gap-2 text-sm font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          <Sparkles size={16} className="text-[#7C3AED]" />
          Ask ProjectCommand AI
        </div>
        <p className="mt-1 text-[12px] text-[#7A94B4]">Answers drawn from programme, cost, risk and site data</p>
      </div>
      <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map(message => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[86%] rounded-xl border px-4 py-3 text-[12px] leading-5 ${message.role === 'user' ? 'border-[rgba(46,127,255,0.18)] bg-[#0A1628] text-[#EEF3FA]' : 'border-[#7C3AED]/30 bg-[#7C3AED]/10 text-[#DDE6F8]'}`}>
              {message.streaming && !message.content ? (
                <span className="inline-flex gap-1">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#7C3AED]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#7C3AED]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#7C3AED]" />
                </span>
              ) : (
                message.content
              )}
              {message.sources && message.content && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {message.sources.map(source => <span key={source} className="rounded-full border border-[#00B894]/25 bg-[#00B894]/10 px-2 py-0.5 text-[10px] text-emerald-200">{source}</span>)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-[rgba(46,127,255,0.18)] p-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={event => setInput(event.target.value)}
            onKeyDown={event => { if (event.key === 'Enter') send(); }}
            placeholder="Ask about handover, cost, risk or MEP impact..."
            className="flex-1 rounded-lg border border-[rgba(46,127,255,0.18)] bg-[#0A1628] px-3 py-2 text-sm text-[#EEF3FA] outline-none placeholder:text-[#7A94B4] focus:border-[#7C3AED]"
          />
          <button onClick={send} disabled={!input.trim() || busy} className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#7C3AED]/40 bg-[#7C3AED]/20 text-[#C4B5FD] transition-colors hover:bg-[#7C3AED]/30 disabled:opacity-40">
            <Send size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
