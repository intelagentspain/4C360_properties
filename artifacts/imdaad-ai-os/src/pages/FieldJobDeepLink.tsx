import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wrench, MapPin, Clock, AlertTriangle, CheckCircle, Brain, Mic,
  ListChecks, Package, ChevronLeft, Zap, User, Phone, TriangleAlert,
  FileText, Navigation,
} from 'lucide-react';
import { AssetExpertCopilot } from '@/components/shared/AssetExpertCopilot';
import { mockParts, mockChecklist, mockIncidents } from '@/data/mockData';

const API_BASE = (import.meta.env.VITE_API_URL ?? '/api') as string;

interface DemoJob {
  id: string;
  title: string;
  asset: string;
  location: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  skill: string;
  status: string;
  assignedTo: string;
  siteId: string;
  description: string;
  slaMinutesRemaining: number;
  aiDiagnostic: string;
  partsAlert?: string;
  checklist: { text: string; mandatory: boolean; done: boolean; evidenceRequired?: boolean }[];
  priorIncidents: { title: string; description: string; severity: string; status: string; date: string }[];
  parts: { name: string; inStock: number; status: string }[];
}

const DEMO_JOBS: Record<string, DemoJob> = {
  'SI-2241': {
    id: 'SI-2241',
    title: 'HVAC — Corrective Maintenance',
    asset: 'Chiller Unit C-04',
    location: 'Villa 23, Cluster A, Silicon Oasis',
    priority: 'high',
    skill: 'HVAC',
    status: 'assigned',
    assignedTo: 'Karim R.',
    siteId: 'silicon-oasis',
    slaMinutesRemaining: 38,
    description: 'AI detected frost pattern on evaporator coil consistent with R-410A refrigerant depletion. Resident confirmed unit not cooling since 09:45. Asset condition score: 72%. Failure probability: 87% within 4–6 days.',
    aiDiagnostic: 'Frost on evaporator → R-410A depletion likely. Low-side pressure expected below 80 PSI (normal: 105–120 PSI). Check for leak before recharging. R-410A stock is critically low — order before site visit.',
    partsAlert: 'R-410A Refrigerant 10kg — OUT OF STOCK. Raise PO before proceeding.',
    checklist: mockChecklist.map(c => ({ text: c.text, mandatory: c.mandatory, done: c.done, evidenceRequired: c.evidenceRequired })),
    priorIncidents: mockIncidents
      .filter(i => i.title.toLowerCase().includes('ac') || i.description.toLowerCase().includes('hvac') || i.description.toLowerCase().includes('refrigerant'))
      .slice(0, 2)
      .map(i => ({ title: i.title, description: i.description, severity: i.severity, status: i.status, date: i.capturedAt })),
    parts: mockParts.map(p => ({ name: p.name, inStock: p.inStock, status: p.status })),
  },
  'default': {
    id: 'WO-DEMO',
    title: 'Field Inspection',
    asset: 'Asset — Silicon Oasis',
    location: 'Silicon Oasis, Dubai',
    priority: 'medium',
    skill: 'General',
    status: 'assigned',
    assignedTo: 'Karim R.',
    siteId: 'silicon-oasis',
    slaMinutesRemaining: 120,
    description: 'General inspection task assigned via deep link.',
    aiDiagnostic: 'No prior AI diagnostic available for this asset.',
    checklist: [
      { text: 'Visual inspection of asset', mandatory: false, done: false },
      { text: 'Record current readings', mandatory: true, done: false },
      { text: 'Upload before photo', mandatory: true, done: false, evidenceRequired: true },
    ],
    priorIncidents: [],
    parts: mockParts,
  },
};

const DEMO_USER = {
  name: 'Karim R.',
  role: 'HVAC Specialist',
  status: 'On Duty',
  site: 'Silicon Oasis',
  shift: '08:00',
  avatar: 'KR',
};

function priorityColor(p: string) {
  switch (p) {
    case 'critical': return '#EF4444';
    case 'high':     return '#F97316';
    case 'medium':   return '#F59E0B';
    default:         return '#10B981';
  }
}

function useSlaCountdown(initialMinutes: number) {
  const [seconds, setSeconds] = useState(initialMinutes * 60);
  const ref = useRef<number | null>(null);
  useEffect(() => {
    ref.current = window.setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, []);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const isUrgent = seconds < 10 * 60;
  const isCritical = seconds < 5 * 60;
  return { mins, secs, isUrgent, isCritical, totalSeconds: seconds };
}

interface Props {
  jobId: string;
  openCopilotImmediately?: boolean;
}

type Phase = 'loading' | 'active';

export function FieldJobDeepLink({ jobId, openCopilotImmediately = false }: Props) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [job, setJob] = useState<DemoJob | null>(null);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [partsOpen, setPartsOpen] = useState(false);
  const [loadingText, setLoadingText] = useState('Authenticating field engineer…');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const steps = [
      { text: 'Authenticating field engineer…', pct: 20 },
      { text: 'Loading active assignment…', pct: 55 },
      { text: 'Syncing asset telemetry…', pct: 80 },
      { text: 'Ready — opening job workspace', pct: 100 },
    ];
    let idx = 0;
    const timer = setInterval(() => {
      if (idx < steps.length) {
        setLoadingText(steps[idx].text);
        setProgress(steps[idx].pct);
        idx++;
      } else {
        clearInterval(timer);
      }
    }, 380);

    const fetchJob = async () => {
      let resolved: DemoJob | null = null;
      try {
        const res = await fetch(`${API_BASE}/workorders/${encodeURIComponent(jobId)}`);
        if (res.ok) {
          const data = await res.json() as Record<string, unknown>;
          const apiJob: DemoJob = {
            id: String(data['id'] ?? jobId),
            title: String(data['title'] ?? 'Field Assignment'),
            asset: String(data['asset'] ?? ''),
            location: String(data['location'] ?? ''),
            priority: (data['priority'] as DemoJob['priority']) ?? 'medium',
            skill: String(data['skill'] ?? 'General'),
            status: String(data['status'] ?? 'assigned'),
            assignedTo: String(data['assignedTo'] ?? 'Karim R.'),
            siteId: String(data['siteId'] ?? 'silicon-oasis'),
            slaMinutesRemaining: 120,
            description: String(data['description'] ?? ''),
            aiDiagnostic: String(data['description'] ?? 'No AI diagnostic available.'),
            checklist: mockChecklist.map(c => ({ text: c.text, mandatory: c.mandatory, done: c.done, evidenceRequired: c.evidenceRequired })),
            priorIncidents: [],
            parts: mockParts,
          };
          resolved = apiJob;
        }
      } catch {
        /* fall through to demo */
      }
      if (!resolved) {
        resolved = DEMO_JOBS[jobId] ?? DEMO_JOBS['default'];
      }
      setTimeout(() => {
        clearInterval(timer);
        setJob(resolved);
        setPhase('active');
        if (openCopilotImmediately) setTimeout(() => setCopilotOpen(true), 400);
      }, 1500);
    };

    fetchJob();
    return () => clearInterval(timer);
  }, [jobId, openCopilotImmediately]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#050D1A] py-4">
      <div className="relative w-[390px] h-[780px] bg-[#07111F] rounded-[2.5rem] border-2 border-[rgba(46,127,255,0.3)] shadow-[0_0_60px_rgba(46,127,255,0.15)] overflow-hidden flex flex-col">

        <AnimatePresence mode="wait">
          {phase === 'loading' ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col items-center justify-center px-8"
            >
              {/* Logo ring */}
              <div className="relative mb-8">
                <div className="w-20 h-20 rounded-[1.6rem] flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #0D2845 0%, #112040 100%)', border: '1.5px solid rgba(46,127,255,0.4)' }}>
                  <span className="text-[#2E7FFF] font-black text-2xl" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>4C</span>
                </div>
                {/* Spinner ring */}
                <svg className="absolute -inset-2 w-24 h-24 animate-spin" viewBox="0 0 96 96" style={{ animationDuration: '2s' }}>
                  <circle cx="48" cy="48" r="44" fill="none" stroke="rgba(46,127,255,0.2)" strokeWidth="2" />
                  <circle cx="48" cy="48" r="44" fill="none" stroke="#2E7FFF" strokeWidth="2"
                    strokeDasharray="60 220" strokeLinecap="round" />
                </svg>
              </div>

              <p className="text-[#EEF3FA] font-bold text-base text-center mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {loadingText}
              </p>
              <p className="text-[#2E7FFF] text-[13px] font-semibold text-center mb-6">
                {DEMO_USER.name} · {DEMO_USER.role} · {DEMO_USER.status}
              </p>

              {/* Progress bar */}
              <div className="w-full h-1 rounded-full bg-[rgba(46,127,255,0.12)] overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #2E7FFF, #00C6FF)' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                />
              </div>

              <p className="text-[#4A6080] text-[11px] mt-4 font-mono">
                Job {DEMO_JOBS[jobId]?.id ?? jobId}
              </p>
            </motion.div>
          ) : job ? (
            <motion.div
              key="active"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <JobWorkspace
                job={job}
                onBack={() => window.history.back()}
                onOpenCopilot={() => setCopilotOpen(true)}
                onOpenChecklist={() => setChecklistOpen(true)}
                onOpenParts={() => setPartsOpen(true)}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Expert Copilot */}
        {job && (
          <AssetExpertCopilot
            open={copilotOpen}
            onClose={() => setCopilotOpen(false)}
            variant="sheet"
            assetType={job.skill}
            assetName={job.asset}
            assetId={job.id}
            siteName={job.siteId}
            ppmTemplateName={job.title}
            currentStep={mockChecklist.find(c => !c.done && c.mandatory)?.text ?? mockChecklist.find(c => !c.done)?.text}
            checklistItems={job.checklist.map(c => c.text)}
            mandatorySteps={job.checklist.filter(c => c.mandatory).map(c => c.text)}
            evidenceRequired={job.checklist.filter(c => c.evidenceRequired).map(c => c.text)}
            completedSteps={job.checklist.filter(c => c.done).map(c => c.text)}
            techReadings={{
              'Priority': job.priority,
              'SLA Remaining': `${job.slaMinutesRemaining} min`,
              'Asset Description': job.aiDiagnostic,
              ...(job.partsAlert ? { 'Parts Alert': job.partsAlert } : {}),
            }}
            priorIncidents={job.priorIncidents}
            partsAvailability={job.parts}
            onCreateIncident={() => {}}
          />
        )}

        {/* Checklist drawer */}
        <AnimatePresence>
          {checklistOpen && job && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 z-40" onClick={() => setChecklistOpen(false)} />
              <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 320, damping: 38 }}
                className="absolute inset-x-0 bottom-0 z-50 bg-[#07111F] rounded-t-3xl border-t border-[rgba(46,127,255,0.2)] max-h-[75%] overflow-y-auto"
              >
                <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-[rgba(255,255,255,0.15)]" /></div>
                <div className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-4">
                    <ListChecks size={16} className="text-emerald-400" />
                    <p className="text-[#EEF3FA] font-bold text-base">Job Checklist</p>
                    <span className="ml-auto text-[11px] text-[#7A94B4]">
                      {job.checklist.filter(c => c.done).length}/{job.checklist.length} complete
                    </span>
                  </div>
                  <div className="space-y-2">
                    {job.checklist.map((item, i) => (
                      <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${
                        item.done
                          ? 'border-emerald-500/20 bg-emerald-500/5'
                          : item.mandatory
                          ? 'border-amber-500/30 bg-amber-500/5'
                          : 'border-[rgba(46,127,255,0.12)] bg-[rgba(13,30,56,0.6)]'
                      }`}>
                        <div className="mt-0.5 flex-shrink-0">
                          {item.done
                            ? <CheckCircle size={15} className="text-emerald-400" />
                            : <div className="w-4 h-4 rounded-full border-2 border-[rgba(255,255,255,0.2)]" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[13px] leading-snug ${item.done ? 'text-[#7A94B4] line-through' : 'text-[#EEF3FA]'}`}>
                            {item.text}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {item.mandatory && <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wide">Mandatory</span>}
                            {item.evidenceRequired && <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wide">Evidence Required</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Parts drawer */}
        <AnimatePresence>
          {partsOpen && job && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 z-40" onClick={() => setPartsOpen(false)} />
              <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 320, damping: 38 }}
                className="absolute inset-x-0 bottom-0 z-50 bg-[#07111F] rounded-t-3xl border-t border-[rgba(46,127,255,0.2)] max-h-[65%] overflow-y-auto"
              >
                <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-[rgba(255,255,255,0.15)]" /></div>
                <div className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Package size={16} className="text-blue-400" />
                    <p className="text-[#EEF3FA] font-bold text-base">Parts & Stock</p>
                  </div>
                  {job.partsAlert && (
                    <div className="flex items-start gap-2 p-3 mb-3 rounded-xl bg-red-950/50 border border-red-500/30">
                      <TriangleAlert size={13} className="text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-red-300 text-xs">{job.partsAlert}</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    {job.parts.map((part, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-[rgba(46,127,255,0.12)] bg-[rgba(13,30,56,0.6)]">
                        <div className="flex-1 min-w-0">
                          <p className="text-[#EEF3FA] text-[13px] font-semibold">{part.name}</p>
                        </div>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          part.status === 'out'
                            ? 'text-red-400 bg-red-500/15 border border-red-500/30'
                            : part.status === 'low'
                            ? 'text-amber-400 bg-amber-500/15 border border-amber-500/30'
                            : 'text-emerald-400 bg-emerald-500/15 border border-emerald-500/30'
                        }`}>
                          {part.status === 'out' ? 'Out of stock' : part.status === 'low' ? `Low (${part.inStock})` : `In stock (${part.inStock})`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function JobWorkspace({ job, onBack, onOpenCopilot, onOpenChecklist, onOpenParts }: {
  job: DemoJob;
  onBack: () => void;
  onOpenCopilot: () => void;
  onOpenChecklist: () => void;
  onOpenParts: () => void;
}) {
  const sla = useSlaCountdown(job.slaMinutesRemaining);
  const [started, setStarted] = useState(job.status === 'in_progress');
  const pColor = priorityColor(job.priority);
  const completedCount = job.checklist.filter(c => c.done).length;
  const outOfStock = job.parts.filter(p => p.status === 'out');

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Status bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[rgba(46,127,255,0.12)] flex-shrink-0"
        style={{ background: 'linear-gradient(160deg, #0D1E38 0%, #07111F 100%)' }}>
        <button onClick={onBack} className="text-[#7A94B4] hover:text-[#2E7FFF] transition-colors p-1">
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#2E7FFF] to-[#00C6FF] flex items-center justify-center text-white text-[10px] font-black">
            KR
          </div>
          <div>
            <p className="text-[#EEF3FA] text-xs font-bold leading-tight">{DEMO_USER.name}</p>
            <p className="text-[10px] text-[#7A94B4]">{DEMO_USER.role}</p>
          </div>
        </div>
        <span className="ml-auto px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
          On Duty
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ scrollbarWidth: 'none' }}>

        {/* Job header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[#2E7FFF] font-mono text-xs">{job.id}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
              style={{ background: `${pColor}22`, border: `1px solid ${pColor}66`, color: pColor }}>
              {job.priority}
            </span>
            {started && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 border border-purple-500/30 text-purple-300">In Progress</span>
            )}
          </div>
          <h1 className="text-[#EEF3FA] font-bold text-[17px] leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {job.title}
          </h1>
          <p className="text-[#7A94B4] text-xs mt-1 flex items-center gap-1">
            <MapPin size={10} /> {job.location}
          </p>
        </div>

        {/* SLA countdown */}
        <div className={`rounded-2xl p-4 border ${
          sla.isCritical
            ? 'bg-red-950/60 border-red-500/40'
            : sla.isUrgent
            ? 'bg-amber-950/60 border-amber-500/40'
            : 'bg-[rgba(13,30,56,0.8)] border-[rgba(46,127,255,0.22)]'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${sla.isCritical ? 'text-red-400' : sla.isUrgent ? 'text-amber-400' : 'text-[#7A94B4]'}`}>
                SLA Remaining
              </p>
              <div className="flex items-baseline gap-1">
                <span className={`text-[32px] font-black leading-none tabular-nums ${sla.isCritical ? 'text-red-400' : sla.isUrgent ? 'text-amber-400' : 'text-[#EEF3FA]'}`}
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {String(sla.mins).padStart(2, '0')}:{String(sla.secs).padStart(2, '0')}
                </span>
                <span className={`text-sm ${sla.isCritical ? 'text-red-500' : 'text-[#7A94B4]'}`}>min</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-1.5">
                <Clock size={12} className={sla.isUrgent ? 'text-amber-400' : 'text-[#7A94B4]'} />
                <span className="text-[10px] text-[#7A94B4]">Priority: <span style={{ color: pColor }} className="font-bold uppercase">{job.priority}</span></span>
              </div>
              {sla.isUrgent && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30">
                  <AlertTriangle size={9} className="text-amber-400" />
                  <span className="text-[9px] font-bold text-amber-400">SLA at risk</span>
                </div>
              )}
            </div>
          </div>

          {/* SLA progress bar */}
          <div className="mt-3 h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, (sla.totalSeconds / (job.slaMinutesRemaining * 60)) * 100)}%`,
                background: sla.isCritical ? '#EF4444' : sla.isUrgent ? '#F59E0B' : '#2E7FFF',
              }}
            />
          </div>
        </div>

        {/* Asset info */}
        <div className="rounded-2xl border border-[rgba(46,127,255,0.18)] bg-[rgba(13,30,56,0.7)] p-4 space-y-2.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#7A94B4]">Asset Details</p>
          {[
            { icon: <Wrench size={12} className="text-[#7A94B4]" />, label: 'Asset', value: job.asset },
            { icon: <User size={12} className="text-[#7A94B4]" />, label: 'Skill', value: job.skill },
            { icon: <MapPin size={12} className="text-[#7A94B4]" />, label: 'Location', value: job.location },
            { icon: <User size={12} className="text-[#7A94B4]" />, label: 'Assigned', value: job.assignedTo },
          ].map((row, i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <span className="text-[#7A94B4] text-xs flex items-center gap-1">{row.icon} {row.label}</span>
              <span className="text-[#EEF3FA] text-xs font-semibold text-right max-w-[55%]">{row.value}</span>
            </div>
          ))}
        </div>

        {/* AI Diagnostic */}
        <div className="rounded-2xl border border-[rgba(16,185,129,0.25)] bg-[rgba(16,185,129,0.05)] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={13} className="text-emerald-400" />
            <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">AI Diagnostic</p>
          </div>
          <p className="text-[#D8E6F5] text-[13px] leading-relaxed">{job.aiDiagnostic}</p>
        </div>

        {/* Parts alert */}
        {outOfStock.length > 0 && (
          <div className="rounded-2xl border border-red-500/30 bg-red-950/40 p-3.5 flex items-start gap-3">
            <TriangleAlert size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-300 text-[12px] font-bold">Parts shortage — {outOfStock.length} item{outOfStock.length > 1 ? 's' : ''} out of stock</p>
              <p className="text-red-500 text-[11px] mt-0.5">{outOfStock.map(p => p.name).join(', ')}</p>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#7A94B4] mb-3">Actions</p>

          {!started ? (
            <button
              onClick={() => setStarted(true)}
              className="w-full flex items-center justify-center gap-2 bg-[#2E7FFF] hover:bg-[#1a6ae8] text-white font-bold text-[15px] py-4 rounded-2xl transition-all active:scale-[0.98] mb-3"
            >
              <Wrench size={18} /> Start Job
            </button>
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-purple-500/10 border border-purple-500/25 mb-3">
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <p className="text-purple-300 text-sm font-semibold">Job in progress — timer running</p>
            </div>
          )}

          {/* Expert Copilot CTA */}
          <button
            onClick={onOpenCopilot}
            className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-[14px] text-white mb-3 transition-all active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #1a3a5c 0%, #0D2845 50%, #0A1E38 100%)', border: '1px solid rgba(46,127,255,0.4)' }}
          >
            <Brain size={17} className="text-[#2E7FFF]" />
            Talk to Asset Expert
            <Mic size={14} className="text-[#7A94B4]" />
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={onOpenChecklist}
              className="flex flex-col items-center gap-1.5 py-4 rounded-2xl border text-center transition-all active:scale-[0.98]"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', color: '#10B981' }}
            >
              <ListChecks size={18} />
              <span className="text-[12px] font-bold">Checklist</span>
              <span className="text-[10px] opacity-70">{completedCount}/{job.checklist.length} done</span>
            </button>

            <button
              onClick={onOpenParts}
              className="flex flex-col items-center gap-1.5 py-4 rounded-2xl border text-center transition-all active:scale-[0.98] relative"
              style={{ background: 'rgba(46,127,255,0.08)', border: '1px solid rgba(46,127,255,0.25)', color: '#2E7FFF' }}
            >
              {outOfStock.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                  {outOfStock.length}
                </span>
              )}
              <Package size={18} />
              <span className="text-[12px] font-bold">Parts</span>
              <span className="text-[10px] opacity-70">{outOfStock.length > 0 ? `${outOfStock.length} out of stock` : 'All available'}</span>
            </button>

            <a
              href={`https://www.google.com/maps/search/${encodeURIComponent(job.location)}`}
              target="_blank" rel="noreferrer"
              className="flex flex-col items-center gap-1.5 py-4 rounded-2xl border text-center transition-all active:scale-[0.98]"
              style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)', color: '#A78BFA' }}
            >
              <Navigation size={18} />
              <span className="text-[12px] font-bold">Navigate</span>
              <span className="text-[10px] opacity-70">Open Maps</span>
            </a>

            <button
              onClick={() => window.location.href = `tel:+97142345678`}
              className="flex flex-col items-center gap-1.5 py-4 rounded-2xl border text-center transition-all active:scale-[0.98]"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: '#F59E0B' }}
            >
              <Phone size={18} />
              <span className="text-[12px] font-bold">Call Supervisor</span>
              <span className="text-[10px] opacity-70">+971 4 234 5678</span>
            </button>
          </div>
        </div>

        {/* Prior incidents */}
        {job.priorIncidents.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#7A94B4] mb-2 flex items-center gap-2">
              <FileText size={11} /> Prior Incidents on This Asset
            </p>
            <div className="space-y-2">
              {job.priorIncidents.map((inc, i) => {
                const sc = inc.severity === 'critical' ? '#EF4444' : inc.severity === 'high' ? '#F97316' : '#F59E0B';
                return (
                  <div key={i} className="rounded-xl border border-[rgba(46,127,255,0.12)] bg-[rgba(13,30,56,0.5)] p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                        style={{ color: sc, background: `${sc}18`, border: `1px solid ${sc}40` }}>
                        {inc.severity}
                      </span>
                      <span className="text-[#EEF3FA] text-[12px] font-semibold">{inc.title}</span>
                    </div>
                    <p className="text-[#7A94B4] text-[11px] leading-relaxed">{inc.description}</p>
                    <p className="text-[#4A6080] text-[10px] mt-1">{inc.date}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
