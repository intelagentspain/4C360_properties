import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Mic, MicOff, Loader2, Trash2 } from 'lucide-react';
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
type CopilotPerspective = 'strategic' | 'operational' | 'client';
type CopilotStrategicPage =
  | 'dashboard'
  | 'datasources'
  | 'benchmark'
  | 'replay'
  | 'incidents'
  | 'tasks'
  | 'ppmschedule'
  | 'aicapture'
  | 'settings'
  | 'allclients'
  | 'team'
  | 'vendorintelligence'
  | 'projectcommand';

interface VoiceSession {
  endSession(): Promise<void>;
}

interface CopilotAvatarProps {
  perspective: CopilotPerspective;
  strategicPage: CopilotStrategicPage;
  memberMode?: boolean;
}

interface CopilotContextConfig {
  greetings: string[];
  chips: string[];
}

const STARTER_CHIP_LIMIT = 8;

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function rotatingSlice(items: string[], offset: number, limit: number) {
  if (items.length <= limit) return items;
  const doubled = [...items, ...items];
  return doubled.slice(offset, offset + limit);
}

function AvatarOrb({ size = 32, voiceStatus }: { size?: number; voiceStatus: VoiceStatus }) {
  const isListening = voiceStatus === 'listening';
  const isSpeaking = voiceStatus === 'speaking';
  const isActive = isListening || isSpeaking;

  const dotColor = isListening ? '#2E7FFF' : isSpeaking ? '#E11D2E' : '#ffffff';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle at 35% 28%, rgba(255,255,255,0.16) 0%, rgba(46,127,255,0.16) 28%, #0B1220 58%, #050A14 100%)',
          border: '1px solid rgba(225,29,46,0.5)',
          boxShadow: isActive
            ? '0 0 16px 4px rgba(225,29,46,0.38), 0 0 24px rgba(46,127,255,0.24), inset 0 1px 2px rgba(255,255,255,0.28)'
            : '0 0 10px 1px rgba(225,29,46,0.22), inset 0 1px 2px rgba(255,255,255,0.18)',
        }}
      />
      <div className="absolute left-1/2 top-1/2 z-10 h-[62%] w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/12 bg-[#07111F] shadow-[inset_0_0_12px_rgba(46,127,255,0.28)]">
        <div className="absolute left-[16%] top-[18%] h-[54%] w-[54%] rounded-full border-[3px] border-[#E11D2E] border-r-transparent border-b-transparent" />
        <div className="absolute right-[18%] bottom-[18%] h-[36%] w-[36%] rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.45)]" />
        <div className="absolute right-[10%] top-[18%] h-1.5 w-1.5 rounded-full bg-[#2E7FFF] shadow-[0_0_8px_rgba(46,127,255,0.75)]" />
      </div>
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
          border: '2px solid #07111F',
          transition: 'background 0.3s',
          boxShadow: `0 0 6px 2px ${dotColor}88`,
        }}
      />
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ border: '1.5px solid rgba(225,29,46,0.52)' }}
          animate={{ scale: [1, 1.35], opacity: [0.7, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
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
          style={{ background: 'radial-gradient(circle, rgba(225,29,46,0.3) 0%, rgba(46,127,255,0.14) 42%, transparent 72%)' }}
          animate={{ scale: [1, 1.55], opacity: [open ? 0.55 : 0.3, 0] }}
          transition={{ duration: 5.2, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
      {isActive && (
        <>
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{ border: '2px solid rgba(225,29,46,0.68)' }}
            animate={{ scale: [1, 1.55], opacity: [0.8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
          />
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{ border: '1.5px solid rgba(46,127,255,0.42)' }}
            animate={{ scale: [1, 1.85], opacity: [0.5, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut', delay: 0.6 }}
          />
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{ border: '1px solid rgba(255,255,255,0.24)' }}
            animate={{ scale: [1, 2.2], opacity: [0.4, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut', delay: 1.2 }}
          />
        </>
      )}

      <div
        className="relative w-14 h-14 rounded-full flex items-center justify-center overflow-hidden"
        style={{
          background: open
            ? 'radial-gradient(circle at 36% 26%, rgba(255,255,255,0.2) 0%, rgba(46,127,255,0.18) 30%, #0B1220 62%, #050A14 100%)'
            : 'radial-gradient(circle at 32% 24%, rgba(255,255,255,0.18) 0%, rgba(46,127,255,0.2) 28%, #0B1220 60%, #050A14 100%)',
          border: '1px solid rgba(225,29,46,0.62)',
          boxShadow: isActive
            ? '0 0 28px 7px rgba(225,29,46,0.42), 0 0 32px rgba(46,127,255,0.28), 0 4px 20px rgba(0,0,0,0.42)'
            : '0 0 18px 3px rgba(225,29,46,0.22), 0 0 20px rgba(46,127,255,0.16), 0 4px 16px rgba(0,0,0,0.35)',
          transition: 'box-shadow 0.4s',
        }}
      >
        <div
          className="absolute inset-1 rounded-full"
          style={{
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: 'inset 0 0 18px rgba(46,127,255,0.16)',
          }}
        />
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
              className="relative z-10 flex h-9 w-9 items-center justify-center rounded-xl"
            >
              <span className="relative h-8 w-8 rounded-xl border border-white/10 bg-[#07111F] shadow-[inset_0_0_14px_rgba(46,127,255,0.28),0_0_10px_rgba(225,29,46,0.28)]">
                <span className="absolute left-[17%] top-[17%] h-[56%] w-[56%] rounded-full border-[4px] border-[#E11D2E] border-r-transparent border-b-transparent" />
                <span className="absolute right-[16%] bottom-[16%] h-[34%] w-[34%] rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                <span className="absolute right-[8%] top-[18%] h-1.5 w-1.5 rounded-full bg-[#2E7FFF] shadow-[0_0_8px_rgba(46,127,255,0.75)]" />
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const DEFAULT_CONTEXT: CopilotContextConfig = {
  greetings: [
    'I can help with OSH incidents, permits, inspections, and compliance. What do you need?',
    'Ask me to triage hazards, check permits, prioritise inspections, or draft a corrective action.',
    'I can turn what you see here into a quick safety decision brief.',
  ],
  chips: [
    'Show open OSH incidents',
    'Summarise compliance KPIs',
    'Review site safety status',
    'List overdue inspections',
    'Explain current hazards',
    'Compare SLA across sites',
    'Draft an HSE escalation',
    'Find expired permits',
    'Show active controls',
    'What needs attention?',
  ],
};

const STRATEGIC_CONTEXTS: Record<CopilotStrategicPage, CopilotContextConfig> = {
  allclients: {
    greetings: DEFAULT_CONTEXT.greetings,
    chips: ['Show highest-risk sites', 'Compare SLA by site', 'Summarise compliance KPIs', 'List critical OSH incidents', 'Find sites with overdue inspections', 'Rank by risk', 'Show live hazards', 'Review data coverage', 'Draft portfolio safety brief', 'Spot compliance gaps'],
  },
  dashboard: {
    greetings: ['I can read the OSH signals and turn them into priorities.', 'Want a quick safety summary, risk view, or action list?', 'Ask me what changed and what needs attention.'],
    chips: ['Explain KPI changes', 'Show live incidents', 'Summarise dispatch queue', 'Highlight SLA risks', 'What needs attention now?', 'Review hazard map', 'Find dispatch pressure', 'Summarise inspection risks', 'Draft daily HSE brief', 'Compare current vs target'],
  },
  team: {
    greetings: ['I can help with inspector coverage, competencies, access, and workload balance.', 'Need to know who owns what or who is overloaded?', 'Ask me to review assignments or competency gaps in seconds.'],
    chips: ['Summarise inspector coverage', 'Find overloaded inspectors', 'Review role assignments', 'Check inactive users', 'Explain site access', 'List contractors', 'Find missing competencies', 'Review HSE managers', 'Draft team update', 'Suggest reassignments'],
  },
  incidents: {
    greetings: ['I can triage OSH incidents, spot patterns, and draft next steps.', 'Need severity, SLA, near-miss, or escalation help?', 'Ask me for a clean incident brief.'],
    chips: ['Summarise critical incidents', 'Find SLA breaches', 'Draft HSE escalation', 'Group by site', 'Recommend corrective actions', 'Find repeat hazards', 'Create manager brief', 'Prioritise by severity', 'Show unresolved incidents', 'Explain root cause'],
  },
  tasks: {
    greetings: ['I can help prioritise inspections and clear blockers.', 'Ask me what should move first.', 'I can turn the inspection list into an action plan.'],
    chips: ['List overdue inspections', 'Find unassigned tasks', 'Prioritise today', 'Show blocked work', 'Summarise workload', 'Find SLA pressure', 'Group by site', 'Suggest assignments', 'Draft inspector notes', 'Review closed inspections'],
  },
  ppmschedule: {
    greetings: ['I can help plan inspections before hazards become incidents.', 'Need overdue inspections, asset risks, or competency gaps?', 'Ask me to turn the schedule into a plan.'],
    chips: ['Show overdue inspections', 'Plan next week', 'Find high-risk assets', 'Summarise inspection load', 'Recommend assignments', 'Flag critical equipment', 'Group by inspector', 'Draft inspection brief', 'Compare due dates', 'Find missed checks'],
  },
  aicapture: {
    greetings: ['I can turn captures into clean OSH findings and corrective actions.', 'Share a note or photo and I will structure it as a hazard report.', 'Need severity, category, or a corrective work order draft?'],
    chips: ['Create finding from capture', 'Suggest severity', 'Classify hazard type', 'Draft corrective action', 'Explain capture confidence', 'Group duplicate hazards', 'Write site team update', 'Recommend owner', 'List missing evidence', 'Create follow-up inspection'],
  },
  datasources: {
    greetings: ['I can help check data health and integration gaps.', 'Ask me what is stale, missing, or ready to connect.', 'I can translate sync status into action.'],
    chips: ['Check sync health', 'Find stale sources', 'Explain integration status', 'List connected systems', 'Recommend next connection', 'Review failed syncs', 'Map source coverage', 'Draft IT note', 'Find duplicate feeds', 'Summarise data quality'],
  },
  vendorintelligence: {
    greetings: ['I can compare vendors and surface service risk.', 'Need a scorecard summary or corrective action?', 'Ask me which vendors need attention.'],
    chips: ['Rank vendor performance', 'Find vendor risks', 'Summarise scorecards', 'Draft corrective action', 'Compare SLA misses', 'Review evidence gaps', 'Find underperformers', 'Draft vendor email', 'Show top vendors', 'Explain risk drivers'],
  },
  projectcommand: {
    greetings: ['I can help forecast handover, cost exposure, critical path risk, and next decisions.', 'Ask me what will happen next and what action protects the project.', 'I can turn programme, cost, and risk signals into a project brief.'],
    chips: ['Biggest handover risk', 'Forecast final cost', 'Explain CPI and SPI', 'Show critical path risk', 'Compare scenarios', 'Draft PM decision brief', 'What if MEP slips?', 'List top actions', 'Summarise risk exposure', 'Review waterproofing impact'],
  },
  benchmark: {
    greetings: ['I can compare performance and explain the gaps.', 'Ask me what is ahead, behind, or worth copying.', 'I can turn benchmarks into improvement steps.'],
    chips: ['Compare sites', 'Explain KPI gaps', 'Find best performers', 'Show weak areas', 'Recommend improvements', 'Rank SLA performance', 'Compare incidents', 'Benchmark vendors', 'Draft improvement plan', 'Spot anomalies'],
  },
  replay: {
    greetings: ['I can reconstruct what happened and where time was lost.', 'Need a replay summary or lesson learned?', 'Ask me to explain the decision path.'],
    chips: ['Summarise timeline', 'Find decision delays', 'Explain dispatch path', 'Identify lessons', 'Compare replay outcomes', 'Find handoff gaps', 'Draft post-incident note', 'Show missed steps', 'Review SLA impact', 'Recommend process fix'],
  },
  settings: {
    greetings: ['I can help configure access, modules, rules, and policies.', 'Ask me to review setup or explain a setting.', 'I can turn configuration into a simple checklist.'],
    chips: ['Review active modules', 'Explain AI dispatch rules', 'Check role permissions', 'Summarise access settings', 'Show site access', 'Review policies', 'Check vendor settings', 'Explain user types', 'Draft setup checklist', 'Find inactive modules'],
  },
};

const PERSPECTIVE_CONTEXTS: Record<Exclude<CopilotPerspective, 'strategic'>, CopilotContextConfig> = {
  operational: {
    greetings: ['I can help with inspections, permits, evidence, and field priorities.', 'Need the next best safety action in the field?', 'Ask me to simplify the inspection queue.'],
    chips: ['Prioritise my inspections', 'Explain next job', 'Review checklist', 'Summarise overdue inspections', 'Help capture evidence', 'Draft inspection note', 'Check PPE & permits', 'Find LOTO steps', 'Update supervisor', 'Close-out checklist'],
  },
  client: {
    greetings: ['I can help track safety requests and explain inspection status.', 'Need to report a hazard or check progress?', 'Ask me for a simple update.'],
    chips: ['Track my request', 'Report a hazard', 'Explain inspection status', 'Show request history', 'Contact HSE team', 'Check inspection date', 'Add more details', 'Find latest update', 'Escalate request', 'Share feedback'],
  },
};

function getCopilotContext(
  perspective: CopilotPerspective,
  strategicPage: CopilotStrategicPage,
  memberMode?: boolean
): CopilotContextConfig {
  if (memberMode) {
    return {
      greetings: ['I can help with your inspections, access, and next safety actions.', 'Need a quick brief on what matters most?', 'Ask me what to focus on first.'],
      chips: ['Summarise my dashboard', 'Show assigned sites', 'Explain my access', 'List urgent inspections', 'What should I do next?', 'Review my role', 'Show open hazards', 'Draft status update', 'Find overdue items', 'Check notifications'],
    };
  }
  if (perspective === 'strategic') return STRATEGIC_CONTEXTS[strategicPage] ?? DEFAULT_CONTEXT;
  return PERSPECTIVE_CONTEXTS[perspective] ?? DEFAULT_CONTEXT;
}

function makeGreeting(config: CopilotContextConfig): Message {
  return {
    id: 'greeting',
    role: 'assistant',
    content: config.greetings[0] ?? DEFAULT_CONTEXT.greetings[0],
  };
}

function getLocalCopilotReply(message: string, config: CopilotContextConfig) {
  const lower = message.toLowerCase();
  const suggestions = rotatingSlice(
    config.chips.filter(chip => chip.toLowerCase() !== lower),
    1,
    4
  );

  if (lower.includes('highest-risk') || lower.includes('high risk') || lower.includes('risk')) {
    return {
      reply: 'Start with JLT North Cluster, then Business Bay Tower Complex. JLT has the sharpest pressure: critical status, 12 OSH incidents, 9 overdue inspections, 67% SLA, and scaffold safety checks overdue.',
      suggestions: ['Compare SLA by site', 'List critical incidents', 'Draft HSE escalation', 'Suggest reassignments'],
    };
  }

  if (lower.includes('compare') && lower.includes('sla')) {
    return {
      reply: 'SLA attention should go first to JLT North Cluster at 67%, then Business Bay Tower Complex at 81%. Gate Avenue and Downtown Burj Area are the strongest performers at 97% and 96%.',
      suggestions: ['Show highest-risk sites', 'Find SLA breaches', 'Summarise compliance KPIs', 'Draft manager brief'],
    };
  }

  if (lower.includes('data') || lower.includes('coverage') || lower.includes('source') || lower.includes('sync')) {
    return {
      reply: 'Review connected systems by site and look for stale or missing feeds first. Power BI sync on Business Bay is the clearest reporting gap to resolve.',
      suggestions: ['Check sync health', 'Find stale sources', 'Review data coverage', 'Draft IT note'],
    };
  }

  if (lower.includes('incident') || lower.includes('sla') || lower.includes('critical') || lower.includes('hazard') || lower.includes('near-miss')) {
    return {
      reply: 'Start with critical OSH incidents, SLA pressure, and anything unassigned. I can group them by site, severity, hazard type (LOTO, scaffold, hot work, chemical), or next corrective action.',
      suggestions: ['Summarise critical incidents', 'Find SLA breaches', 'Group by hazard type', 'Recommend corrective actions'],
    };
  }

  if (lower.includes('permit') || lower.includes('loto') || lower.includes('hot work') || lower.includes('confined') || lower.includes('height')) {
    return {
      reply: 'Active permits to watch: 4 hot work permits open, 1 confined-space entry past validity, 2 LOTO isolations awaiting verification. Expired permits trigger an automatic stop-work.',
      suggestions: ['Find expired permits', 'Show active LOTO', 'Review hot work fire watch', 'Draft permit close-out'],
    };
  }

  if (lower.includes('team') || lower.includes('role') || lower.includes('access') || lower.includes('inspector') || lower.includes('member') || lower.includes('competen')) {
    return {
      reply: 'Review inspector coverage, competency cards, inactive users, and site access. Fastest check: who owns each site, who has expired competencies, who is overloaded.',
      suggestions: ['Summarise inspector coverage', 'Find overloaded inspectors', 'Review competencies', 'Explain site access'],
    };
  }

  if (lower.includes('kpi') || lower.includes('performance') || lower.includes('portfolio') || lower.includes('site') || lower.includes('sites') || lower.includes('compliance')) {
    return {
      reply: 'Look at SLA, open inspections, critical incidents, expired permits, and connected data coverage. Those signals give the clearest portfolio safety picture.',
      suggestions: ['Summarise compliance KPIs', 'Compare SLA by site', 'Show highest-risk sites', 'Spot compliance gaps'],
    };
  }

  if (lower.includes('work') || lower.includes('task') || lower.includes('inspection') || lower.includes('schedule')) {
    return {
      reply: 'Prioritise overdue inspections, blocked tasks, high-risk assets, and jobs without an owner. I can turn that into a dispatch or weekly inspection plan.',
      suggestions: ['List overdue inspections', 'Find unassigned tasks', 'Show blocked work', 'Plan next week'],
    };
  }

  return {
    reply: 'I can help turn that into a summary, comparison, priority list, HSE escalation draft, or compliance check. Pick the angle you want and I will keep it practical.',
    suggestions,
  };
}

export function CopilotAvatar({ perspective, strategicPage, memberMode = false }: CopilotAvatarProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('idle');
  const [voiceActive, setVoiceActive] = useState(false);
  const [welcomeIndex, setWelcomeIndex] = useState(0);
  const [chipOffset, setChipOffset] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const conversationRef = useRef<VoiceSession | null>(null);
  const requestIdRef = useRef<string>('');

  const voiceEnabled = Boolean(ELEVENLABS_AGENT_ID);
  const contextConfig = useMemo(
    () => getCopilotContext(perspective, strategicPage, memberMode),
    [memberMode, perspective, strategicPage]
  );
  const showingStarter = open && messages.length === 1 && messages[0]?.id === 'greeting' && !loading;
  const starterChips = useMemo(
    () => rotatingSlice(contextConfig.chips, chipOffset % Math.max(contextConfig.chips.length, 1), STARTER_CHIP_LIMIT),
    [chipOffset, contextConfig.chips]
  );

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([makeGreeting(contextConfig)]);
      setSuggestions([]);
    }
  }, [contextConfig, messages.length, open]);

  useEffect(() => {
    setWelcomeIndex(0);
    setChipOffset(0);
    setSuggestions([]);
    setMessages(prev => {
      if (prev.length === 0) return prev;
      if (prev.length === 1 && prev[0]?.id === 'greeting') {
        return [makeGreeting(contextConfig)];
      }
      return prev;
    });
  }, [contextConfig]);

  useEffect(() => {
    if (!showingStarter) return;
    const timer = window.setInterval(() => {
      setWelcomeIndex(current => (current + 1) % Math.max(contextConfig.greetings.length, 1));
      setChipOffset(current => (current + 1) % Math.max(contextConfig.chips.length, 1));
    }, 7800);

    return () => window.clearInterval(timer);
  }, [contextConfig.chips.length, contextConfig.greetings.length, showingStarter]);

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

    const reqId = generateId();
    requestIdRef.current = reqId;

    const userMsg: Message = { id: generateId(), role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setSuggestions([]);
    setInput('');
    setLoading(true);

    try {
      const history = messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));

      const data = await apiFetch<{ reply: string; suggestions?: string[] }>('/copilot/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: text.trim(),
          history,
          context: {
            perspective,
            strategicPage,
            memberMode,
          },
        }),
      });

      if (requestIdRef.current !== reqId) return;

      setMessages(prev => [
        ...prev,
        { id: generateId(), role: 'assistant', content: data.reply },
      ]);
      setSuggestions(data.suggestions ?? []);
    } catch {
      if (requestIdRef.current !== reqId) return;
      const fallback = getLocalCopilotReply(text.trim(), contextConfig);
      setMessages(prev => [
        ...prev,
        {
          id: generateId(),
          role: 'assistant',
          content: fallback.reply,
        },
      ]);
      setSuggestions(fallback.suggestions);
    } finally {
      if (requestIdRef.current === reqId) {
        setLoading(false);
      }
    }
  }, [contextConfig, loading, memberMode, messages, perspective, strategicPage]);

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

  const clearThread = useCallback(() => {
    requestIdRef.current = '';
    setMessages([makeGreeting(contextConfig)]);
    setSuggestions([]);
    setInput('');
    setLoading(false);
  }, [contextConfig]);

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
              className="w-[360px] max-h-[520px] flex flex-col rounded-2xl shadow-2xl border overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, #090B10 0%, #10131B 48%, #161018 100%)',
                borderColor: 'rgba(225,29,46,0.34)',
                boxShadow: '0 24px 70px rgba(0,0,0,0.62), 0 0 0 1px rgba(255,255,255,0.06), 0 0 36px rgba(225,29,46,0.16)',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E11D2E]/25 bg-[#E11D2E]/8">
                <div className="relative flex-shrink-0">
                  <AvatarOrb size={32} voiceStatus={voiceStatus} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white leading-none">OSH Authority Copilot</p>
                  <p className="text-[11px] text-red-200/85 mt-0.5">
                    {isConnecting ? 'Connecting…' : isSpeaking ? 'Speaking…' : isListening ? 'Listening…' : 'AI Assistant'}
                  </p>
                </div>
                <button
                  onClick={clearThread}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
                  aria-label="Clear conversation"
                  title="Clear conversation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close copilot"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0" style={{ maxHeight: '340px' }}>
                {messages.map((msg, idx) => {
                  const isLastMsg = idx === messages.length - 1;
                  const isFirstOnly = idx === 0 && messages.length === 1;
                  return (
                    <div key={msg.id}>
                      <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed shadow-sm ${
                            msg.role === 'user'
                              ? 'bg-[#E11D2E]/18 text-red-50 border border-[#E11D2E]/35 rounded-br-sm'
                              : 'bg-[#F7F3EA]/9 text-[#F6F2EA] border border-[#F7F3EA]/16 rounded-bl-sm'
                          }`}
                        >
                          {isFirstOnly ? (
                            <AnimatePresence mode="wait" initial={false}>
                              <motion.span
                                key={`${strategicPage}-${perspective}-${welcomeIndex}`}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.45, ease: 'easeOut' }}
                                className="block"
                              >
                                {contextConfig.greetings[welcomeIndex % Math.max(contextConfig.greetings.length, 1)]}
                              </motion.span>
                            </AnimatePresence>
                          ) : (
                            msg.content
                          )}
                        </div>
                      </div>
                      {isFirstOnly && !loading && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <AnimatePresence mode="popLayout" initial={false}>
                            {starterChips.map((chip, i) => (
                            <motion.button
                              key={chip}
                              layout
                              initial={{ opacity: 0, y: 8, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -6, scale: 0.98 }}
                              transition={{ duration: 0.38, delay: i * 0.055 }}
                              onClick={() => sendMessage(chip)}
                              className="min-h-8 rounded-xl border border-[#F7F3EA]/16 bg-[#F7F3EA]/7 px-3 py-1.5 text-left text-[11px] leading-snug text-[#E8E1D7]/78 transition-colors hover:border-[#E11D2E]/60 hover:bg-[#E11D2E]/14 hover:text-white"
                            >
                              {chip}
                            </motion.button>
                          ))}
                          </AnimatePresence>
                        </div>
                      )}
                      {isLastMsg && msg.role === 'assistant' && !isFirstOnly && !loading && suggestions.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {suggestions.map((chip, i) => (
                            <button
                              key={`${i}-${chip}`}
                              onClick={() => sendMessage(chip)}
                              className="max-w-full px-3 py-1.5 rounded-full text-left text-xs leading-snug bg-[#F7F3EA]/7 border border-[#F7F3EA]/16 text-[#E8E1D7]/75 hover:border-[#E11D2E]/60 hover:text-white hover:bg-[#E11D2E]/14 transition-colors cursor-pointer"
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-[#F7F3EA]/9 border border-[#F7F3EA]/16 rounded-2xl rounded-bl-sm px-3 py-2">
                      <Loader2 className="w-4 h-4 text-red-300 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {voiceActive && (
                <div className="px-4 py-2 bg-[#E11D2E]/10 border-t border-[#E11D2E]/25 flex items-center gap-2">
                  <div className="flex gap-1 items-end h-4">
                    {[1, 2, 3, 4, 5].map(i => (
                      <motion.div
                        key={i}
                        className="w-1 rounded-full bg-red-300"
                        animate={isListening || isSpeaking ? {
                          height: ['4px', `${8 + Math.random() * 8}px`, '4px'],
                        } : { height: '4px' }}
                        transition={{ duration: 0.85 + i * 0.16, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-red-200">
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

              <div className="px-3 py-3 border-t border-[#E11D2E]/18 bg-black/22">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything…"
                    disabled={loading}
                    className="flex-1 rounded-xl border border-[#F7F3EA]/16 bg-[#F7F3EA]/8 px-3 py-2 text-sm text-white placeholder:text-[#E8E1D7]/35 focus:outline-none focus:border-[#E11D2E]/65 focus:ring-1 focus:ring-[#E11D2E]/30 disabled:opacity-50 transition-colors"
                  />
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || loading}
                    className="p-2 rounded-xl bg-[#E11D2E]/18 hover:bg-[#E11D2E]/30 border border-[#E11D2E]/38 text-red-200 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                        : 'bg-[#F7F3EA]/8 border-[#F7F3EA]/16 text-[#E8E1D7]/70 hover:bg-[#F7F3EA]/13 hover:text-white'
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
          aria-label="Open OSH Authority Copilot"
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
