import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Archive,
  Bot,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  FileSignature,
  Filter,
  Link2,
  Mail,
  MapPin,
  MessageCircle,
  PencilRuler,
  Plus,
  QrCode,
  RadioTower,
  ScanLine,
  Search,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { useClients } from '@/context/ClientsContext';
import type { PortfolioClient } from '@/data/mockData';
import {
  aiGeneratedSurvey,
  assignments,
  questionPalette,
  submissions,
  surveys,
  surveyTypes,
  templateOptions,
  templates,
  type Survey,
  type SurveySubmission,
  type SurveyType,
} from './data';

type Tab = 'surveys' | 'assignments' | 'tracking' | 'templates' | 'ai';
type Drawer = 'detail' | 'design' | 'assign' | 'share' | 'submission' | null;
type FieldOpsTemplate = {
  name: string;
  type: SurveyType;
  duration: string;
  questions: number;
  evidence: string;
};

interface Props {
  onToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

const tabs: Array<{ id: Tab; label: string }> = [
  { id: 'surveys', label: 'Surveys' },
  { id: 'assignments', label: 'Assignments' },
  { id: 'tracking', label: 'Tracking' },
  { id: 'templates', label: 'Templates' },
  { id: 'ai', label: 'AI Assist' },
];

const statusClass: Record<string, string> = {
  Draft: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
  Active: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  'In Progress': 'border-blue-400/30 bg-blue-400/10 text-blue-300',
  Completed: 'border-[#E11D2E]/30 bg-[#E11D2E]/10 text-red-200',
  Archived: 'border-slate-500/30 bg-slate-500/10 text-slate-400',
  Overdue: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  'Failed / Rejected': 'border-red-400/30 bg-red-400/10 text-red-300',
};

const fieldInput = 'h-9 rounded-lg border border-[rgba(46,127,255,0.22)] bg-[#0A1628] px-3 text-[12px] text-[#EEF3FA] outline-none placeholder:text-[#4A6080] focus:border-[#E11D2E]';
const priorityOptions = ['Low', 'Medium', 'High', 'Critical'] as const;
type SurveyPriority = (typeof priorityOptions)[number];

function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getPropertyScopes(property?: PortfolioClient) {
  if (!property) return ['Portfolio-wide field scope'];
  const sites = property.topSites.map(site => site.name);
  const assets = property.resources.equipment.slice(0, 3).map(asset => `${asset.name} assets`);
  return [...sites, ...assets, 'All sites and common areas'];
}

function buildAiDescription(type: SurveyType, property?: PortfolioClient, scope = 'selected scope', priority: SurveyPriority = 'High') {
  const propertyName = property?.name ?? 'the selected property';
  const sector = property?.sector ? `${property.sector.toLowerCase()} ` : '';
  const riskNote = property?.riskLevel && property.riskLevel !== 'low'
    ? ` Include extra checks for ${property.riskLevel} risk items.`
    : '';

  return `AI suggested scope: run a ${type.toLowerCase()} for ${propertyName}, focused on ${scope}. Capture ${sector}field readings, photo evidence, GPS proof, safety checks, failed-item notes, and supervisor sign-off. Treat ${priority.toLowerCase()} findings as escalation-ready and prepare incident creation for any failed critical item.${riskNote}`;
}

function normalizeTemplate(template: { name: string; type: string; duration: string; questions: number; evidence: string }): FieldOpsTemplate {
  return {
    ...template,
    type: surveyTypes.includes(template.type as SurveyType) ? (template.type as SurveyType) : 'Custom',
  };
}

function Badge({ children, tone = 'default' }: { children: React.ReactNode; tone?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusClass[tone] ?? 'border-[rgba(46,127,255,0.2)] bg-white/5 text-[#B8C7DB]'}`}>
      {children}
    </span>
  );
}

function ActionIconButton({
  label,
  icon: Icon,
  onClick,
  danger = false,
}: {
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`group relative flex h-8 w-8 items-center justify-center rounded-lg border transition-all ${
        danger
          ? 'border-red-400/18 bg-red-400/8 text-red-200 hover:border-red-300/45 hover:bg-red-400/14'
          : 'border-[rgba(46,127,255,0.16)] bg-[#07111F] text-[#7EB8F7] hover:border-[#7EB8F7]/45 hover:bg-[#12305C]'
      }`}
    >
      <Icon size={14} />
      <span className={`pointer-events-none absolute -top-8 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-md border px-2 py-1 text-[10px] font-bold opacity-0 shadow-xl transition-all group-hover:-top-9 group-hover:opacity-100 ${
        danger
          ? 'border-red-400/25 bg-[#2A0B14] text-red-100'
          : 'border-[rgba(46,127,255,0.32)] bg-[#07111F] text-[#DDE6F8]'
      }`}>
        {label}
      </span>
    </button>
  );
}

function QRPreview() {
  return (
    <div className="grid h-36 w-36 grid-cols-7 gap-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-inner">
      {Array.from({ length: 49 }).map((_, i) => {
        const dark = [0, 1, 2, 7, 14, 35, 42, 43, 44, 6, 13, 20, 27, 34, 41, 28, 29, 30, 32, 36, 39, 45, 48, 9, 11, 16, 22, 24, 31, 38].includes(i);
        return <span key={i} className={dark ? 'rounded-sm bg-[#07111F]' : 'rounded-sm bg-slate-100'} />;
      })}
    </div>
  );
}

function MobilePreview({ survey = surveys[0] }: { survey?: Survey }) {
  return (
    <div className="mx-auto w-[250px] rounded-[2.1rem] border border-[rgba(46,127,255,0.32)] bg-[#07111F] p-3 shadow-2xl shadow-blue-950/30">
      <div className="rounded-[1.6rem] bg-[#0A1628] p-4">
        <div className="mb-4 h-1.5 w-16 rounded-full bg-white/20 mx-auto" />
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#E11D2E]">FieldOps</div>
        <h4 className="mt-1 text-[15px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{survey.name}</h4>
        <p className="mt-1 text-[10px] leading-4 text-[#7A94B4]">{survey.siteIds.join(', ')} - {survey.type}</p>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#112040]">
          <div className="h-full w-[42%] rounded-full bg-[#E11D2E]" />
        </div>
        <div className="mt-4 space-y-2">
          {survey.questions.slice(0, 4).map(question => (
            <div key={question.id} className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#112040] p-3">
              <div className="text-[11px] font-bold text-[#EEF3FA]">{question.label}</div>
              <div className="mt-2 flex gap-1.5">
                {question.required && <Badge>Mandatory</Badge>}
                {question.evidenceRequired && <Badge tone="Completed">Evidence</Badge>}
              </div>
            </div>
          ))}
        </div>
        <button className="mt-4 h-10 w-full rounded-xl bg-[#E11D2E] text-[12px] font-bold text-white">Submit Survey</button>
      </div>
    </div>
  );
}

function CreateSurveyModal({
  onClose,
  onDesign,
  properties,
  initialTemplate,
}: {
  onClose: () => void;
  onDesign: (type: SurveyType) => void;
  properties: PortfolioClient[];
  initialTemplate?: FieldOpsTemplate | null;
}) {
  const [type, setType] = useState<SurveyType>(initialTemplate?.type ?? 'Preventive Maintenance');
  const [surveyName, setSurveyName] = useState(initialTemplate ? `${initialTemplate.name} survey` : 'Water-cooled chiller PPM checklist');
  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? '');
  const selectedProperty = useMemo(() => properties.find(property => property.id === propertyId) ?? properties[0], [properties, propertyId]);
  const scopeOptions = useMemo(() => getPropertyScopes(selectedProperty), [selectedProperty]);
  const [scope, setScope] = useState(scopeOptions[0] ?? 'Portfolio-wide field scope');
  const [priority, setPriority] = useState<SurveyPriority>('High');
  const [validFrom, setValidFrom] = useState(() => formatDateInput(new Date()));
  const [validTo, setValidTo] = useState(() => formatDateInput(addDays(new Date(), 30)));
  const [descriptionEdited, setDescriptionEdited] = useState(false);
  const aiDescription = useMemo(
    () => buildAiDescription(type, selectedProperty, scope, priority),
    [type, selectedProperty, scope, priority],
  );
  const [description, setDescription] = useState(aiDescription);

  useEffect(() => {
    if (!propertyId && properties[0]) setPropertyId(properties[0].id);
  }, [properties, propertyId]);

  useEffect(() => {
    setScope(scopeOptions[0] ?? 'Portfolio-wide field scope');
  }, [propertyId, scopeOptions]);

  useEffect(() => {
    if (!descriptionEdited) setDescription(aiDescription);
  }, [aiDescription, descriptionEdited]);

  return (
    <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} aria-label="Close create survey" />
      <motion.div initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.97 }} className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-[rgba(46,127,255,0.25)] bg-[#0A1628] shadow-2xl">
        <div className="flex items-start justify-between border-b border-[rgba(46,127,255,0.14)] bg-[linear-gradient(135deg,rgba(225,29,46,0.14),rgba(46,127,255,0.06))] px-5 py-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#E11D2E]">Step 1 / Survey Basics</div>
            <h3 className="mt-1 text-lg font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Create Survey</h3>
            <p className="mt-1 text-[12px] text-[#7A94B4]">
              {initialTemplate ? `Starting from ${initialTemplate.name}: ${initialTemplate.questions} questions, ${initialTemplate.duration}, ${initialTemplate.evidence}.` : 'Superadmin can create, publish, and assign surveys across all organizations.'}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-[#7A94B4] hover:bg-white/5 hover:text-white"><X size={18} /></button>
        </div>
        <div className="custom-scrollbar max-h-[70vh] overflow-y-auto p-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">Survey name</span>
              <input className={`${fieldInput} w-full`} value={surveyName} onChange={event => setSurveyName(event.target.value)} />
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">Survey type</span>
              <select className={`${fieldInput} w-full`} value={type} onChange={event => setType(event.target.value as SurveyType)}>
                {surveyTypes.map(item => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">Property</span>
              <select className={`${fieldInput} w-full`} value={propertyId} onChange={event => { setPropertyId(event.target.value); setDescriptionEdited(false); }}>
                {properties.map(property => <option key={property.id} value={property.id}>{property.name}</option>)}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">Site / Area / Asset scope</span>
              <select className={`${fieldInput} w-full`} value={scope} onChange={event => { setScope(event.target.value); setDescriptionEdited(false); }}>
                {scopeOptions.map(option => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">Priority</span>
              <select className={`${fieldInput} w-full`} value={priority} onChange={event => { setPriority(event.target.value as SurveyPriority); setDescriptionEdited(false); }}>
                {priorityOptions.map(option => <option key={option}>{option}</option>)}
              </select>
            </label>
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">Validity window</span>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wide text-[#4A6080]">From</span>
                  <input type="date" className={`${fieldInput} w-full pl-14`} value={validFrom} onChange={event => { setValidFrom(event.target.value); if (validTo < event.target.value) setValidTo(event.target.value); }} />
                </label>
                <label className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wide text-[#4A6080]">To</span>
                  <input type="date" className={`${fieldInput} w-full pl-10`} value={validTo} min={validFrom} onChange={event => setValidTo(event.target.value)} />
                </label>
              </div>
            </div>
            <div className="rounded-xl border border-[#E11D2E]/20 bg-[linear-gradient(135deg,rgba(225,29,46,0.12),rgba(46,127,255,0.05))] p-4 lg:col-span-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#E11D2E]">
                    <Sparkles size={13} />
                    AI setup brief
                  </div>
                  <p className="mt-1 text-[12px] text-[#B8C7DB]">Property context, site scope, validity, and priority are used to shape the first survey draft.</p>
                </div>
                <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                  <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-emerald-200">Property loaded</span>
                  <span className="rounded-full border border-blue-400/25 bg-blue-400/10 px-2.5 py-1 text-blue-200">Scope auto-filled</span>
                  <span className="rounded-full border border-[#E11D2E]/25 bg-[#E11D2E]/10 px-2.5 py-1 text-red-100">Evidence suggested</span>
                </div>
              </div>
            </div>
            <label className="space-y-1.5 lg:col-span-2">
              <span className="flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">
                AI suggested description
                <button
                  type="button"
                  onClick={() => { setDescription(aiDescription); setDescriptionEdited(false); }}
                  className="rounded-full border border-[#E11D2E]/30 bg-[#E11D2E]/10 px-2.5 py-1 text-[10px] font-bold normal-case tracking-normal text-red-100 hover:bg-[#E11D2E]/16"
                >
                  Regenerate with AI
                </button>
              </span>
              <textarea
                className="min-h-24 w-full rounded-lg border border-[rgba(46,127,255,0.22)] bg-[#0A1628] px-3 py-2 text-[12px] leading-5 text-[#EEF3FA] outline-none placeholder:text-[#4A6080] focus:border-[#E11D2E]"
                value={description}
                onChange={event => { setDescription(event.target.value); setDescriptionEdited(true); }}
              />
              <span className="text-[10px] text-[#5A7190]">Valid {validFrom} to {validTo}. The design step will use this context to suggest sections, evidence rules, scoring, and mandatory checks.</span>
            </label>
          </div>
          <div className="mt-5 rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#07111F] p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h4 className="text-sm font-bold text-[#EEF3FA]">Template options for {type}</h4>
                {initialTemplate && <p className="mt-1 text-[11px] text-[#7A94B4]">{initialTemplate.name} is selected as the starting structure.</p>}
              </div>
              {initialTemplate && <Badge tone="Completed">Template loaded</Badge>}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {templateOptions[type].map(template => <Badge key={template} tone={template === initialTemplate?.name ? 'Completed' : 'default'}>{template}</Badge>)}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-[rgba(46,127,255,0.14)] px-5 py-4">
          <button onClick={onClose} className="rounded-lg border border-[rgba(46,127,255,0.22)] px-4 py-2 text-[12px] font-bold text-[#B8C7DB] hover:bg-white/5">Save Draft</button>
          <button onClick={() => onDesign(type)} className="rounded-lg bg-[#E11D2E] px-4 py-2 text-[12px] font-bold text-white shadow-lg shadow-red-950/25">Continue to Design</button>
        </div>
      </motion.div>
    </div>
  );
}

function SideDrawer({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.aside initial={{ x: 520 }} animate={{ x: 0 }} exit={{ x: 520 }} className="fixed bottom-0 right-0 top-[52px] z-[2200] flex w-full max-w-xl flex-col border-l border-[rgba(46,127,255,0.25)] bg-[#0A1628] shadow-2xl">
      <div className="flex items-center justify-between border-b border-[rgba(46,127,255,0.14)] px-5 py-4">
        <h3 className="text-base font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{title}</h3>
        <button onClick={onClose} className="rounded-lg p-2 text-[#7A94B4] hover:bg-white/5 hover:text-white"><X size={18} /></button>
      </div>
      <div className="custom-scrollbar flex-1 overflow-y-auto p-5">{children}</div>
    </motion.aside>
  );
}

export function FieldOpsDashboard({ onToast }: Props) {
  const { clients: properties } = useClients();
  const [tab, setTab] = useState<Tab>('surveys');
  const [query, setQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createTemplate, setCreateTemplate] = useState<FieldOpsTemplate | null>(null);
  const [drawer, setDrawer] = useState<Drawer>(null);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey>(surveys[0]);
  const [selectedSubmission, setSelectedSubmission] = useState<SurveySubmission>(submissions[0]);
  const [aiPrompt, setAiPrompt] = useState(aiGeneratedSurvey.prompt);
  const [aiGenerated, setAiGenerated] = useState(true);

  const filteredSurveys = useMemo(() => {
    const lower = query.toLowerCase();
    return surveys.filter(survey => `${survey.name} ${survey.type} ${survey.assignedTo}`.toLowerCase().includes(lower));
  }, [query]);

  const stats = [
    { label: 'Active Surveys', value: surveys.filter(s => s.status === 'Active').length, icon: ClipboardCheck, tone: 'text-emerald-300' },
    { label: 'In Progress', value: assignments.filter(a => a.status === 'In Progress').length, icon: RadioTower, tone: 'text-blue-300' },
    { label: 'Completed', value: assignments.filter(a => a.status === 'Completed').length, icon: CheckCircle2, tone: 'text-[#E11D2E]' },
    { label: 'Overdue', value: assignments.filter(a => a.status === 'Overdue').length, icon: AlertTriangle, tone: 'text-amber-300' },
    { label: 'Open Issues Detected', value: submissions.reduce((sum, sub) => sum + sub.issuesDetected, 0), icon: ShieldCheck, tone: 'text-red-300' },
  ];

  const openDrawer = (next: Drawer, survey = selectedSurvey) => {
    setSelectedSurvey(survey);
    setDrawer(next);
  };

  const openCreateSurvey = (template?: FieldOpsTemplate) => {
    setCreateTemplate(template ?? null);
    setCreateOpen(true);
  };

  const closeCreateSurvey = () => {
    setCreateOpen(false);
    setCreateTemplate(null);
  };

  const actionButton = (label: string, next: Drawer, survey: Survey, icon: ComponentType<{ size?: number; className?: string }>) => (
    <ActionIconButton label={label} icon={icon} onClick={() => openDrawer(next, survey)} />
  );

  return (
    <div className="flex h-full flex-col overflow-hidden text-[#EEF3FA]">
      <div className="flex-shrink-0 border-b border-[rgba(46,127,255,0.12)] px-6 py-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#E11D2E]">
              <Smartphone size={13} />
              Superadmin Module
            </div>
            <h1 className="text-[22px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>FieldOps</h1>
            <p className="mt-1 text-[12px] text-[#7A94B4]">Create, assign, and track mobile field surveys and inspections.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setTab('ai')} className="flex h-9 items-center gap-2 rounded-lg border border-[rgba(46,127,255,0.22)] bg-[#112040] px-3 text-[12px] font-bold text-[#B8C7DB] hover:bg-white/5">
              <Sparkles size={15} /> AI Assist
            </button>
            <button onClick={() => openCreateSurvey()} className="flex h-9 items-center gap-2 rounded-lg bg-[#E11D2E] px-4 text-[12px] font-bold text-white shadow-lg shadow-red-950/25">
              <Plus size={15} /> Create Survey
            </button>
          </div>
        </div>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto px-6 py-5">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
          {stats.map(stat => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">{stat.label}</span>
                  <Icon size={16} className={stat.tone} />
                </div>
                <div className={`mt-3 text-3xl font-black ${stat.tone}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{stat.value}</div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex gap-1 overflow-x-auto border-b border-[rgba(46,127,255,0.12)] pb-0">
          {tabs.map(item => (
            <button key={item.id} onClick={() => setTab(item.id)} className={`rounded-t-lg border-b-2 px-4 py-2 text-[12px] font-bold transition-colors ${tab === item.id ? 'border-[#E11D2E] bg-[#E11D2E]/8 text-red-200' : 'border-transparent text-[#7A94B4] hover:text-[#EEF3FA]'}`}>
              {item.label}
            </button>
          ))}
        </div>

        {tab === 'surveys' && (
          <div className="mt-4 rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)]">
            <div className="flex flex-col gap-3 border-b border-[rgba(46,127,255,0.12)] p-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-sm font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Survey library</h2>
                <p className="mt-1 text-[11px] text-[#7A94B4]">Design, assign, share, duplicate, archive, and track mobile surveys.</p>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A94B4]" />
                  <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search surveys" className={`${fieldInput} w-64 pl-9`} />
                </div>
                <button className="flex h-9 items-center gap-2 rounded-lg border border-[rgba(46,127,255,0.22)] px-3 text-[11px] font-bold text-[#B8C7DB] hover:bg-white/5"><Filter size={14} /> Filters</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] text-left">
                <thead className="text-[10px] uppercase tracking-wide text-[#7A94B4]">
                  <tr>{['Survey Name', 'Type', 'Status', 'Assigned To', 'Capture Method', 'Responses', 'Last Updated', 'Actions'].map(head => <th key={head} className="px-4 py-3 font-bold">{head}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-[rgba(46,127,255,0.08)]">
                  {filteredSurveys.map(survey => (
                    <tr key={survey.id} className="text-[12px] hover:bg-white/[0.025]">
                      <td className="px-4 py-3">
                        <button onClick={() => openDrawer('detail', survey)} className="text-left">
                          <span className="block font-bold text-[#EEF3FA]">{survey.name}</span>
                          <span className="text-[10px] text-[#7A94B4]">{survey.siteIds.join(', ')}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-[#B8C7DB]">{survey.type}</td>
                      <td className="px-4 py-3"><Badge tone={survey.status}>{survey.status}</Badge></td>
                      <td className="px-4 py-3 text-[#B8C7DB]">{survey.assignedTo}</td>
                      <td className="px-4 py-3 text-[#B8C7DB]">{survey.captureMethod}</td>
                      <td className="px-4 py-3 font-mono font-bold">{survey.responses}</td>
                      <td className="px-4 py-3 text-[#7A94B4]">{survey.lastUpdated}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {actionButton('Design', 'design', survey, PencilRuler)}
                          {actionButton('Assign', 'assign', survey, Users)}
                          {actionButton('Share', 'share', survey, Link2)}
                          <ActionIconButton label="Track" icon={RadioTower} onClick={() => setTab('tracking')} />
                          <ActionIconButton label="Duplicate" icon={Copy} onClick={() => onToast('Survey duplicated as draft', 'success')} />
                          <ActionIconButton label="Archive" icon={Archive} danger onClick={() => onToast('Archive action queued', 'info')} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'assignments' && (
          <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_360px]">
            <div className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
              <h2 className="text-sm font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Assignment control</h2>
              <div className="mt-4 grid gap-3">
                {assignments.map(assignment => {
                  const survey = surveys.find(item => item.id === assignment.surveyId) ?? surveys[0];
                  return (
                    <div key={assignment.id} className="grid gap-3 rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#0A1628] p-4 lg:grid-cols-[1.3fr_1fr_0.8fr_auto] lg:items-center">
                      <div>
                        <p className="text-[13px] font-bold text-[#EEF3FA]">{survey.name}</p>
                        <p className="mt-1 text-[11px] text-[#7A94B4]">{assignment.assignee} - {assignment.role}</p>
                      </div>
                      <div className="text-[11px] text-[#B8C7DB]">{assignment.site}<br />Due {assignment.dueDate}</div>
                      <div>
                        <Badge tone={assignment.status}>{assignment.status}</Badge>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#112040]"><div className="h-full rounded-full bg-[#E11D2E]" style={{ width: `${assignment.progress}%` }} /></div>
                      </div>
                      <button onClick={() => openDrawer('assign', survey)} className="rounded-lg border border-[rgba(46,127,255,0.22)] px-3 py-2 text-[11px] font-bold text-[#B8C7DB] hover:bg-white/5">Edit</button>
                    </div>
                  );
                })}
              </div>
            </div>
            <MobilePreview survey={selectedSurvey} />
          </div>
        )}

        {tab === 'tracking' && (
          <div className="mt-4 rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
            <h2 className="text-sm font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Live submissions</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-[12px]">
                <thead className="text-[10px] uppercase tracking-wide text-[#7A94B4]">
                  <tr>{['Survey', 'Assignee', 'Site', 'Status', 'Progress', 'Submitted At', 'Issues', 'Evidence', 'Reviewer'].map(head => <th key={head} className="px-3 py-2">{head}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-[rgba(46,127,255,0.08)]">
                  {assignments.map(assignment => {
                    const survey = surveys.find(item => item.id === assignment.surveyId) ?? surveys[0];
                    const submission = submissions.find(item => item.assignmentId === assignment.id) ?? submissions[0];
                    return (
                      <tr key={assignment.id} className="hover:bg-white/[0.025]">
                        <td className="px-3 py-3 font-bold text-[#EEF3FA]">{survey.name}</td>
                        <td className="px-3 py-3 text-[#B8C7DB]">{assignment.assignee}</td>
                        <td className="px-3 py-3 text-[#B8C7DB]">{assignment.site}</td>
                        <td className="px-3 py-3"><Badge tone={assignment.status}>{assignment.status}</Badge></td>
                        <td className="px-3 py-3"><div className="h-1.5 w-24 rounded-full bg-[#0A1628]"><div className="h-full rounded-full bg-[#E11D2E]" style={{ width: `${assignment.progress}%` }} /></div></td>
                        <td className="px-3 py-3 text-[#7A94B4]">{submission.submittedAt}</td>
                        <td className="px-3 py-3 font-bold text-red-200">{submission.issuesDetected}</td>
                        <td className="px-3 py-3 text-emerald-300">{submission.evidence.length} files</td>
                        <td className="px-3 py-3"><button onClick={() => { setSelectedSubmission(submission); setDrawer('submission'); }} className="font-bold text-[#7EB8F7]">{submission.reviewer}</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'templates' && (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {templates.map(template => (
              <div key={template.name} className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#E11D2E]/12 text-red-200"><ClipboardCheck size={18} /></div>
                <h3 className="text-sm font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{template.name}</h3>
                <p className="mt-1 text-[11px] text-[#7A94B4]">{template.type}</p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] text-[#B8C7DB]">
                  <span>{template.duration}</span>
                  <span>{template.questions} questions</span>
                  <span className="col-span-2">{template.evidence}</span>
                </div>
                <button onClick={() => openCreateSurvey(normalizeTemplate(template))} className="mt-4 w-full rounded-lg border border-[#E11D2E]/35 bg-[#E11D2E]/10 px-3 py-2 text-[11px] font-bold text-red-200 hover:bg-[#E11D2E]/16">Use template</button>
              </div>
            ))}
          </div>
        )}

        {tab === 'ai' && (
          <div className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-xl border border-[#E11D2E]/30 bg-[linear-gradient(135deg,rgba(225,29,46,0.10),rgba(17,32,64,0.86))] p-4">
              <div className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-red-200"><Bot size={15} /> AI Assist Survey Design</div>
              <textarea value={aiPrompt} onChange={event => setAiPrompt(event.target.value)} className="min-h-28 w-full rounded-xl border border-[rgba(46,127,255,0.22)] bg-[#0A1628] p-3 text-[12px] leading-5 text-[#EEF3FA] outline-none focus:border-[#E11D2E]" />
              <div className="mt-3 flex gap-2">
                <button onClick={() => setAiGenerated(true)} className="rounded-lg bg-[#E11D2E] px-4 py-2 text-[12px] font-bold text-white">Generate</button>
                <button onClick={() => setAiPrompt('Create a site safety inspection for residential tower common areas')} className="rounded-lg border border-[rgba(46,127,255,0.22)] px-4 py-2 text-[12px] font-bold text-[#B8C7DB]">Edit Prompt</button>
              </div>
            </div>
            {aiGenerated && (
              <div className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Generated checklist structure</h3>
                    <p className="mt-1 text-[11px] text-[#7A94B4]">Frequency: {aiGeneratedSurvey.frequency}</p>
                    <p className="text-[11px] text-[#7A94B4]">Responsible role: {aiGeneratedSurvey.responsibleRole}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => onToast('AI structure applied to survey canvas', 'success')} className="rounded-lg bg-[#E11D2E] px-3 py-2 text-[11px] font-bold text-white">Apply to Survey</button>
                    <button onClick={() => onToast('AI regenerated the checklist', 'info')} className="rounded-lg border border-[rgba(46,127,255,0.22)] px-3 py-2 text-[11px] font-bold text-[#B8C7DB]">Regenerate</button>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {aiGeneratedSurvey.sections.map(section => (
                    <div key={section.title} className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#0A1628] p-4">
                      <h4 className="text-[13px] font-bold text-[#EEF3FA]">{section.title}</h4>
                      <div className="mt-3 space-y-2">
                        {section.questions.map(question => <p key={question} className="rounded-lg bg-[#112040] px-3 py-2 text-[11px] leading-4 text-[#B8C7DB]">{question}</p>)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {createOpen && <CreateSurveyModal properties={properties} initialTemplate={createTemplate} onClose={closeCreateSurvey} onDesign={type => { closeCreateSurvey(); setSelectedSurvey({ ...selectedSurvey, type }); setDrawer('design'); }} />}

        {drawer === 'detail' && (
          <SideDrawer title={selectedSurvey.name} onClose={() => setDrawer(null)}>
            <div className="space-y-4">
              <div className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#07111F] p-4">
                <div className="flex items-center justify-between">
                  <Badge tone={selectedSurvey.status}>{selectedSurvey.status}</Badge>
                  <span className="text-[11px] text-[#7A94B4]">Updated {selectedSurvey.lastUpdated}</span>
                </div>
                <p className="mt-3 text-[12px] leading-5 text-[#B8C7DB]">{selectedSurvey.description}</p>
              </div>
              <MobilePreview survey={selectedSurvey} />
            </div>
          </SideDrawer>
        )}

        {drawer === 'design' && (
          <SideDrawer title="Design Survey" onClose={() => setDrawer(null)}>
            <div className="grid gap-4 xl:grid-cols-[190px_1fr]">
              <div className="space-y-2">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-[#7A94B4]">Question palette</h4>
                {questionPalette.map(item => (
                  <button key={item.type} className="w-full rounded-lg border border-[rgba(46,127,255,0.12)] bg-[#07111F] p-3 text-left hover:border-[#E11D2E]/40">
                    <span className="block text-[12px] font-bold text-[#EEF3FA]">{item.label}</span>
                    <span className="text-[10px] text-[#7A94B4]">{item.helper}</span>
                  </button>
                ))}
              </div>
              <div className="space-y-4">
                <div className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#07111F] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-sm font-bold text-[#EEF3FA]">Survey canvas</h4>
                    <button onClick={() => setTab('ai')} className="rounded-lg border border-[#E11D2E]/35 bg-[#E11D2E]/10 px-3 py-2 text-[11px] font-bold text-red-200">Ask AI Assist</button>
                  </div>
                  {selectedSurvey.questions.map(question => (
                    <div key={question.id} className="mb-2 rounded-lg border border-[rgba(46,127,255,0.12)] bg-[#0A1628] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[12px] font-bold text-[#EEF3FA]">{question.label}</span>
                        <Badge>{question.type.replace('_', ' ')}</Badge>
                      </div>
                      <div className="mt-2 flex gap-2">{question.required && <Badge>Mandatory</Badge>}{question.evidenceRequired && <Badge tone="Completed">Evidence required</Badge>}</div>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#07111F] p-4">
                  <h4 className="text-sm font-bold text-[#EEF3FA]">Question settings</h4>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {['Mandatory question', 'Required evidence', 'Conditional logic', 'Score / weight'].map(setting => <Badge key={setting}>{setting}</Badge>)}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="rounded-lg border border-[rgba(46,127,255,0.22)] px-3 py-2 text-[11px] font-bold text-[#B8C7DB]">Preview Mobile Survey</button>
                  <button className="rounded-lg border border-[rgba(46,127,255,0.22)] px-3 py-2 text-[11px] font-bold text-[#B8C7DB]">Save Draft</button>
                  <button onClick={() => onToast('Survey published', 'success')} className="rounded-lg bg-[#E11D2E] px-3 py-2 text-[11px] font-bold text-white">Publish</button>
                </div>
              </div>
            </div>
          </SideDrawer>
        )}

        {drawer === 'assign' && (
          <SideDrawer title="Assign Survey" onClose={() => setDrawer(null)}>
            <div className="grid gap-3 sm:grid-cols-2">
              {['Assignee', 'Role', 'Start date', 'Due date', 'Recurrence', 'Priority', 'Supervisor reviewer'].map((label, index) => (
                <label key={label} className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">{label}</span>
                  <input className={`${fieldInput} w-full`} defaultValue={['MEP Team', 'FM Engineer', '2026-04-27', '2026-04-30', 'monthly', 'High', 'Mariam Saleh'][index]} />
                </label>
              ))}
              <label className="space-y-1.5 sm:col-span-2">
                <span className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">Instructions</span>
                <textarea className="min-h-20 w-full rounded-lg border border-[rgba(46,127,255,0.22)] bg-[#0A1628] px-3 py-2 text-[12px] text-[#EEF3FA] outline-none" defaultValue="Capture readings, upload evidence, and escalate any failed item immediately." />
              </label>
            </div>
            <div className="mt-5 rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#07111F] p-4">
              <h4 className="text-sm font-bold text-[#EEF3FA]">Access control</h4>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {['Authenticated users only', 'Public link allowed', 'QR scan allowed', 'Vendor access allowed', 'Anonymous capture allowed', 'Approval required'].map(item => <Badge key={item}>{item}</Badge>)}
              </div>
            </div>
            <button onClick={() => onToast('Survey assignment saved', 'success')} className="mt-5 w-full rounded-lg bg-[#E11D2E] px-4 py-3 text-[12px] font-bold text-white">Assign Survey</button>
          </SideDrawer>
        )}

        {drawer === 'share' && (
          <SideDrawer title="Share Survey" onClose={() => setDrawer(null)}>
            <div className="grid gap-5 lg:grid-cols-[170px_1fr]">
              <div><QRPreview /></div>
              <div className="space-y-3">
                <div className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#07111F] p-4">
                  <p className="text-[10px] font-bold uppercase text-[#7A94B4]">Mobile survey link</p>
                  <p className="mt-2 break-all font-mono text-[12px] text-[#B8C7DB]">https://4c360.properties/fieldops/survey/{selectedSurvey.id}/capture</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[['Generate QR Code', QrCode], ['Copy Link', Copy], ['Send by Email', Mail], ['Send by WhatsApp', MessageCircle], ['Embed Link', Link2]].map(([label, Icon]) => {
                    const I = Icon as typeof QrCode;
                    return <button key={label as string} className="flex items-center gap-2 rounded-lg border border-[rgba(46,127,255,0.18)] bg-[#07111F] px-3 py-2 text-[11px] font-bold text-[#B8C7DB] hover:bg-white/5"><I size={14} />{label as string}</button>;
                  })}
                </div>
              </div>
            </div>
            <div className="mt-5 rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#07111F] p-4">
              <h4 className="text-sm font-bold text-[#EEF3FA]">Access rules summary</h4>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {['Require login', 'Allow anonymous submission', 'Limit by geography', 'Expiry: 30 Apr 2026', 'Max submissions: 250', 'Allowed roles: Engineer, Inspector, Contractor', 'Allowed organizations: Danube Properties', 'Allowed sites: Lawnz Residences'].map(item => <Badge key={item}>{item}</Badge>)}
              </div>
              <div className="mt-4 rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-[11px] font-bold text-emerald-300">
                <MapPin size={13} className="mr-1 inline" /> Geo-restricted - 150m radius around selected site boundary
              </div>
            </div>
          </SideDrawer>
        )}

        {drawer === 'submission' && (
          <SideDrawer title={selectedSubmission.id} onClose={() => setDrawer(null)}>
            <div className="space-y-4">
              <div className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#07111F] p-4">
                <div className="flex items-center justify-between"><Badge tone={selectedSubmission.status}>{selectedSubmission.status}</Badge><span className="font-mono text-[12px] text-[#B8C7DB]">Score {selectedSubmission.score}%</span></div>
                <p className="mt-3 text-[12px] text-[#7A94B4]">Submitted by {selectedSubmission.submittedBy} - {selectedSubmission.submittedAt}</p>
                <p className="mt-1 text-[12px] text-[#7A94B4]">GPS: {selectedSubmission.gpsLocation.site} ({selectedSubmission.gpsLocation.lat}, {selectedSubmission.gpsLocation.lng})</p>
              </div>
              <div className="space-y-2">
                {selectedSubmission.answers.map(answer => (
                  <div key={answer.question} className="rounded-lg border border-[rgba(46,127,255,0.12)] bg-[#07111F] p-3">
                    <p className="text-[11px] text-[#7A94B4]">{answer.question}</p>
                    <p className="mt-1 text-[12px] font-bold text-[#EEF3FA]">{answer.answer}</p>
                  </div>
                ))}
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {selectedSubmission.evidence.map(item => <div key={item.label} className="rounded-lg border border-[rgba(46,127,255,0.12)] bg-[#07111F] p-3 text-[11px] text-[#B8C7DB]">{item.type}: {item.label}</div>)}
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => onToast('Submission approved', 'success')} className="rounded-lg bg-emerald-500/90 px-3 py-2 text-[11px] font-bold text-white">Approve</button>
                <button onClick={() => onToast('Submission rejected', 'warning')} className="rounded-lg border border-amber-400/35 px-3 py-2 text-[11px] font-bold text-amber-200">Reject</button>
                <button onClick={() => onToast('Incident prefilled from survey finding', 'success')} className="rounded-lg bg-[#E11D2E] px-3 py-2 text-[11px] font-bold text-white">Create Incident from Finding</button>
              </div>
            </div>
          </SideDrawer>
        )}
      </AnimatePresence>
    </div>
  );
}
