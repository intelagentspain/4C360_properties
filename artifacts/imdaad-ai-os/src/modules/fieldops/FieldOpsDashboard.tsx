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
  Eye,
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
type CreateWizardStep = 'start' | 'ai' | 'template' | 'basics';
type CreateStartMode = 'ai' | 'template' | 'manual';

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
const aiPromptChips = [
  'HVAC PPM',
  'Lift Safety Inspection',
  'Cleaning Audit',
  'Fire System Check',
  'Asset Condition Survey',
  'Handover Inspection',
  'Defect Capture',
  'Site Safety Walkthrough',
];
type AiDraftProfile = {
  sections: number;
  questions: number;
  duration: string;
  frequency: string;
  focus: string;
  evidence: string;
};
const aiDraftProfiles: Record<string, AiDraftProfile> = {
  'HVAC PPM': {
    sections: 5,
    questions: 24,
    duration: '18-22 minutes',
    frequency: 'Monthly',
    focus: 'safety isolation, chiller condition, operating readings, cleaning, and sign-off',
    evidence: 'photos, pressure readings, temperature differential, GPS proof, and supervisor signature',
  },
  'Lift Safety Inspection': {
    sections: 4,
    questions: 18,
    duration: '12-15 minutes',
    frequency: 'Weekly',
    focus: 'landing doors, cabin safety, alarms, machine-room checks, and emergency response',
    evidence: 'photos, safety pass/fail checks, technician notes, and signature',
  },
  'Cleaning Audit': {
    sections: 4,
    questions: 16,
    duration: '8-10 minutes',
    frequency: 'Daily',
    focus: 'lobbies, corridors, washrooms, amenities, consumables, and quality scoring',
    evidence: 'optional photos for failed areas, score notes, and supervisor review',
  },
  'Fire System Check': {
    sections: 6,
    questions: 28,
    duration: '20-25 minutes',
    frequency: 'Weekly',
    focus: 'fire pumps, alarms, extinguishers, fire doors, escape routes, and compliance evidence',
    evidence: 'mandatory photos, GPS capture, fail-to-incident rules, and contractor signature',
  },
  'Asset Condition Survey': {
    sections: 5,
    questions: 18,
    duration: '12-15 minutes',
    frequency: 'Monthly',
    focus: 'safety, inspection, readings, condition, and sign-off',
    evidence: 'condition photos, severity rating, lifecycle notes, and GPS proof',
  },
  'Handover Inspection': {
    sections: 6,
    questions: 30,
    duration: '25-35 minutes',
    frequency: 'Per handover batch',
    focus: 'unit readiness, finishes, MEP function, snags, resident-facing evidence, and approval',
    evidence: 'snag photos, QR/unit scan, handover checklist, and QA sign-off',
  },
  'Defect Capture': {
    sections: 3,
    questions: 12,
    duration: '6-8 minutes',
    frequency: 'As needed',
    focus: 'defect location, category, severity, before/after evidence, and incident creation',
    evidence: 'photos, notes, QR/asset scan, and automatic issue trigger',
  },
  'Site Safety Walkthrough': {
    sections: 5,
    questions: 22,
    duration: '15-18 minutes',
    frequency: 'Daily',
    focus: 'PPE, access control, permits, work-at-height, housekeeping, and hazard closure',
    evidence: 'mandatory photos for unsafe observations, GPS proof, and HSE reviewer sign-off',
  },
};
const assignableAssignees = ['MEP Team', 'Fire Safety Vendor', 'Soft Services Team', 'QA/QC Team', 'Handover Team', 'Arabian FM Contractor', 'Mariam Saleh', 'Ahmed Farouk'];
const assignmentRoles = ['FM Engineer', 'Contractor', 'Supervisor', 'QA/QC Lead', 'HSE Lead', 'Site Engineer', 'Property Manager'];
const supervisorReviewers = ['Mariam Saleh', 'Sarah Khan', 'Omar Haddad', 'Nadia Karim', 'James Miller'];
const recurrenceOptions = ['one-time', 'daily', 'weekly', 'monthly', 'quarterly', 'custom'];

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

function inferSurveyTypeFromPrompt(prompt: string): SurveyType {
  const lower = prompt.toLowerCase();
  if (lower.includes('clean')) return 'Cleaning Audit';
  if (lower.includes('fire')) return 'Fire Safety';
  if (lower.includes('handover') || lower.includes('snag')) return 'Handover';
  if (lower.includes('defect') || lower.includes('reactive')) return 'Reactive Maintenance';
  if (lower.includes('asset condition') || lower.includes('condition')) return 'Asset Condition';
  if (lower.includes('safety') || lower.includes('lift')) return 'Safety';
  if (lower.includes('ppm') || lower.includes('preventive') || lower.includes('maintenance') || lower.includes('chiller')) return 'Preventive Maintenance';
  return 'Field Inspection';
}

function titleFromPrompt(prompt: string, type: SurveyType) {
  const lower = prompt.toLowerCase();
  if (lower.includes('chiller')) return 'Water-Cooled Chiller Monthly PPM';
  if (lower.includes('lift')) return 'Lift Safety Inspection';
  if (lower.includes('clean')) return 'Cleaning Audit Checklist';
  if (lower.includes('fire')) return 'Fire Safety Inspection';
  if (lower.includes('handover')) return 'Handover Inspection Checklist';
  if (lower.includes('defect')) return 'Defect Capture Survey';
  return `${type} Survey`;
}

function getAiDraftProfile(prompt: string, selectedChip: string | null) {
  if (selectedChip && aiDraftProfiles[selectedChip]) return aiDraftProfiles[selectedChip];
  const lower = prompt.toLowerCase();
  const matchedChip = aiPromptChips.find(chip => chip.split(' ').some(word => lower.includes(word.toLowerCase())));
  return matchedChip ? aiDraftProfiles[matchedChip] : aiDraftProfiles['Asset Condition Survey'];
}

function getTemplatePreview(template: FieldOpsTemplate) {
  const lower = template.name.toLowerCase();
  if (lower.includes('hvac')) {
    return {
      frequency: 'Monthly',
      responsibleRole: 'FM Engineer with MEP supervisor review',
      sections: [
        { title: 'Safety & Isolation', checks: ['Confirm lockout/tagout is in place', 'Verify safe access around equipment'] },
        { title: 'Operational Readings', checks: ['Record chilled water pressure', 'Record entering and leaving temperature differential'] },
        { title: 'Evidence & Sign-off', checks: ['Upload panel photo evidence', 'Supervisor signature required for abnormal readings'] },
      ],
      triggers: ['Pressure outside range creates incident', 'Failed safety item blocks submission'],
    };
  }
  if (lower.includes('lift')) {
    return {
      frequency: 'Weekly',
      responsibleRole: 'Lift vendor with facility manager review',
      sections: [
        { title: 'Cabin & Landing Checks', checks: ['Inspect doors, buttons, lighting, and emergency phone', 'Confirm landing alignment at sampled floors'] },
        { title: 'Safety Verification', checks: ['Validate alarm response', 'Capture photo evidence for defects'] },
        { title: 'Sign-off', checks: ['Technician notes', 'Supervisor signature'] },
      ],
      triggers: ['Failed safety check creates high-priority incident', 'Missing signature keeps submission pending'],
    };
  }
  if (lower.includes('fire')) {
    return {
      frequency: 'Weekly for critical areas',
      responsibleRole: 'Fire safety contractor',
      sections: [
        { title: 'Life Safety Assets', checks: ['Check extinguishers, hose reels, and fire doors', 'Confirm pump panel status'] },
        { title: 'Escape Routes', checks: ['Verify exits are clear', 'Capture blocked route evidence'] },
        { title: 'Compliance Evidence', checks: ['GPS capture required', 'Attach inspection photos'] },
      ],
      triggers: ['Blocked exit creates critical incident', 'Failed fire pump creates immediate escalation'],
    };
  }
  if (lower.includes('clean')) {
    return {
      frequency: 'Daily',
      responsibleRole: 'Soft services supervisor',
      sections: [
        { title: 'Area Condition', checks: ['Rate lobby, corridors, washrooms, and amenities', 'Capture failed area photos'] },
        { title: 'Consumables', checks: ['Confirm supplies stocked', 'Record missing consumables'] },
        { title: 'Closeout', checks: ['Supervisor notes', 'Optional resident-facing comment'] },
      ],
      triggers: ['Repeated failed area opens corrective task', 'Low score flags vendor performance'],
    };
  }
  return {
    frequency: template.type === 'Handover' ? 'Per handover batch' : 'As scheduled',
    responsibleRole: template.type === 'Handover' ? 'Handover lead with QA/QC review' : 'Assigned field supervisor',
    sections: [
      { title: 'Context & Scope', checks: ['Confirm site, asset, and survey location', 'Scan QR or capture GPS where required'] },
      { title: 'Inspection Checks', checks: ['Complete pass/fail checklist', 'Capture notes for failed items'] },
      { title: 'Evidence & Review', checks: ['Upload required evidence', 'Submit for supervisor review'] },
    ],
    triggers: ['Failed mandatory check creates issue', 'Missing evidence blocks submission'],
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
  disabled = false,
}: {
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      aria-label={label}
      title={label}
      disabled={disabled}
      className={`group relative flex h-8 w-8 items-center justify-center rounded-lg border transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
        disabled
          ? 'border-slate-500/15 bg-slate-500/8 text-slate-500'
          : danger
          ? 'border-red-400/18 bg-red-400/8 text-red-200 hover:border-red-300/45 hover:bg-red-400/14'
          : 'border-[rgba(46,127,255,0.16)] bg-[#07111F] text-[#7EB8F7] hover:border-[#7EB8F7]/45 hover:bg-[#12305C]'
      }`}
    >
      <Icon size={14} />
      <span className={`pointer-events-none absolute -top-8 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-md border px-2 py-1 text-[10px] font-bold opacity-0 shadow-xl transition-all group-hover:-top-9 group-hover:opacity-100 ${
        disabled
          ? 'border-slate-500/20 bg-[#07111F] text-slate-300'
          : danger
          ? 'border-red-400/25 bg-[#2A0B14] text-red-100'
          : 'border-[rgba(46,127,255,0.32)] bg-[#07111F] text-[#DDE6F8]'
      }`}>
        {label}
      </span>
    </button>
  );
}

function TemplateSurveyDetails({
  template,
  onUseTemplate,
}: {
  template: FieldOpsTemplate;
  onUseTemplate?: () => void;
}) {
  const preview = getTemplatePreview(template);
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#E11D2E]/25 bg-[linear-gradient(135deg,rgba(225,29,46,0.13),rgba(46,127,255,0.06))] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-[#E11D2E]">Survey template</div>
            <h4 className="mt-1 text-xl font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{template.name}</h4>
            <p className="mt-1 text-[12px] text-[#7A94B4]">{template.type}</p>
          </div>
          <Badge tone="Completed">{template.questions} checks</Badge>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl bg-[#07111F] p-3">
            <div className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">Duration</div>
            <div className="mt-1 text-sm font-black text-white">{template.duration}</div>
          </div>
          <div className="rounded-xl bg-[#07111F] p-3">
            <div className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">Evidence</div>
            <div className="mt-1 text-sm font-black text-white">{template.evidence}</div>
          </div>
          <div className="rounded-xl bg-[#07111F] p-3">
            <div className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">Frequency</div>
            <div className="mt-1 text-sm font-black text-white">{preview.frequency}</div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[rgba(46,127,255,0.18)] bg-[#07111F] p-4">
        <h5 className="text-sm font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Survey structure</h5>
        <div className="mt-3 space-y-3">
          {preview.sections.map(section => (
            <div key={section.title} className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#0A1628] p-3">
              <div className="text-[12px] font-bold text-white">{section.title}</div>
              <div className="mt-2 space-y-2">
                {section.checks.map(check => (
                  <div key={check} className="flex gap-2 text-[11px] leading-4 text-[#B8C7DB]">
                    <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-300" />
                    <span>{check}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[rgba(46,127,255,0.18)] bg-[#07111F] p-4">
        <h5 className="text-sm font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Automation and review</h5>
        <p className="mt-1 text-[12px] text-[#7A94B4]">Responsible role: {preview.responsibleRole}</p>
        <div className="mt-3 space-y-2">
          {preview.triggers.map(trigger => (
            <div key={trigger} className="rounded-xl border border-[#E11D2E]/20 bg-[#E11D2E]/8 px-3 py-2 text-[11px] font-semibold text-red-100">{trigger}</div>
          ))}
        </div>
      </div>

      {onUseTemplate && (
        <button onClick={onUseTemplate} className="h-10 w-full rounded-xl bg-[#E11D2E] text-[12px] font-bold text-white shadow-lg shadow-red-950/25">Use this template</button>
      )}
    </div>
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
  const [wizardStep, setWizardStep] = useState<CreateWizardStep>(initialTemplate ? 'basics' : 'start');
  const [startMode, setStartMode] = useState<CreateStartMode>(initialTemplate ? 'template' : 'ai');
  const [selectedTemplate, setSelectedTemplate] = useState<FieldOpsTemplate | null>(initialTemplate ?? null);
  const [previewTemplate, setPreviewTemplate] = useState<FieldOpsTemplate | null>(null);
  const [aiPrompt, setAiPrompt] = useState(aiGeneratedSurvey.prompt);
  const [selectedAiChip, setSelectedAiChip] = useState<string | null>('Asset Condition Survey');
  const [aiGeneratedPreview, setAiGeneratedPreview] = useState(false);
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
  const aiDraftProfile = useMemo(() => getAiDraftProfile(aiPrompt, selectedAiChip), [aiPrompt, selectedAiChip]);
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

  const applyTemplate = (template: FieldOpsTemplate) => {
    setSelectedTemplate(template);
    setStartMode('template');
    setType(template.type);
    setSurveyName(`${template.name} survey`);
    setDescriptionEdited(false);
    setWizardStep('basics');
  };

  const startManual = () => {
    setSelectedTemplate(null);
    setStartMode('manual');
    setType('Custom');
    setSurveyName('New custom field survey');
    setDescriptionEdited(false);
    setWizardStep('basics');
  };

  const applyAiDraft = () => {
    const inferredType = inferSurveyTypeFromPrompt(aiPrompt);
    setSelectedTemplate(null);
    setStartMode('ai');
    setType(inferredType);
    setSurveyName(titleFromPrompt(aiPrompt, inferredType));
    setDescriptionEdited(false);
    setAiGeneratedPreview(true);
    setWizardStep('basics');
  };

  const goBackFromBasics = () => {
    if (startMode === 'template') {
      setWizardStep('template');
      return;
    }
    if (startMode === 'ai') {
      setWizardStep('ai');
      return;
    }
    setWizardStep('start');
  };

  const stepLabel = wizardStep === 'start' ? 'Step 1 / Choose path' : wizardStep === 'ai' ? 'Step 1 / AI Assist' : wizardStep === 'template' ? 'Step 1 / Template Library' : 'Step 2 / Survey Basics';
  const helperText = wizardStep === 'start'
    ? 'Start with AI, choose a proven template, or build manually.'
    : wizardStep === 'ai'
    ? 'Describe what you need and AI will prepare the first survey draft.'
    : wizardStep === 'template'
    ? 'Pick a best-practice structure and then refine the survey basics.'
    : selectedTemplate
    ? `Starting from ${selectedTemplate.name}: ${selectedTemplate.questions} questions, ${selectedTemplate.duration}, ${selectedTemplate.evidence}.`
    : startMode === 'ai'
    ? 'AI has prepared the first draft. Review the basics before opening the designer.'
    : 'Superadmin can create, publish, and assign surveys across all organizations.';

  return (
    <div className="fixed inset-0 z-[2500] flex items-center justify-center p-3 sm:p-4">
      <button className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} aria-label="Close create survey" />
      <motion.div initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.97 }} className="relative flex max-h-[calc(100vh-1.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[rgba(46,127,255,0.25)] bg-[#0A1628] shadow-2xl sm:max-h-[calc(100vh-2rem)]">
        <div className="shrink-0 flex items-start justify-between border-b border-[rgba(46,127,255,0.14)] bg-[linear-gradient(135deg,rgba(225,29,46,0.14),rgba(46,127,255,0.06))] px-5 py-3.5">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#E11D2E]">{stepLabel}</div>
            <h3 className="mt-1 text-lg font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Create Survey</h3>
            <p className="mt-1 text-[12px] text-[#7A94B4]">
              {helperText}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-[#7A94B4] hover:bg-white/5 hover:text-white"><X size={18} /></button>
        </div>
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {wizardStep === 'start' && (
            <div className="grid gap-3 lg:grid-cols-3">
              <button
                type="button"
                onClick={() => { setStartMode('ai'); setWizardStep('ai'); }}
                className="group rounded-2xl border border-[#E11D2E]/35 bg-[linear-gradient(135deg,rgba(225,29,46,0.18),rgba(46,127,255,0.08))] p-5 text-left shadow-xl shadow-red-950/10 transition hover:-translate-y-0.5 hover:border-[#E11D2E]/70"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E11D2E] text-white shadow-lg shadow-red-950/30"><Sparkles size={20} /></div>
                <div className="text-[10px] font-black uppercase tracking-widest text-red-200">Recommended</div>
                <h4 className="mt-2 text-lg font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Start with AI</h4>
                <p className="mt-2 text-[12px] leading-5 text-[#B8C7DB]">Tell AI what you need and get a complete mobile-ready survey draft instantly.</p>
                <span className="mt-5 inline-flex rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-white group-hover:bg-[#E11D2E]">AI Assist</span>
              </button>
              <button
                type="button"
                onClick={() => { setStartMode('template'); setWizardStep('template'); }}
                className="group rounded-2xl border border-[rgba(46,127,255,0.2)] bg-[#07111F] p-5 text-left transition hover:-translate-y-0.5 hover:border-[#7EB8F7]/55 hover:bg-[#102040]"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#12305C] text-[#7EB8F7]"><ClipboardCheck size={20} /></div>
                <h4 className="text-lg font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Use Template</h4>
                <p className="mt-2 text-[12px] leading-5 text-[#B8C7DB]">Choose a best-practice checklist by asset, service type, or inspection workflow.</p>
                <span className="mt-5 inline-flex rounded-full border border-[rgba(46,127,255,0.24)] px-3 py-1 text-[11px] font-bold text-[#B8C7DB] group-hover:text-white">Browse templates</span>
              </button>
              <button
                type="button"
                onClick={startManual}
                className="group rounded-2xl border border-[rgba(46,127,255,0.2)] bg-[#07111F] p-5 text-left transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-[#102040]"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/8 text-[#B8C7DB]"><PencilRuler size={20} /></div>
                <h4 className="text-lg font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Build Manually</h4>
                <p className="mt-2 text-[12px] leading-5 text-[#B8C7DB]">Start from a blank survey and define fields, evidence, rules, and scoring yourself.</p>
                <span className="mt-5 inline-flex rounded-full border border-white/10 px-3 py-1 text-[11px] font-bold text-[#B8C7DB] group-hover:text-white">Manual setup</span>
              </button>
            </div>
          )}

          {wizardStep === 'ai' && (
            <div className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
              <div className="rounded-2xl border border-[#E11D2E]/30 bg-[linear-gradient(135deg,rgba(225,29,46,0.12),rgba(17,32,64,0.78))] p-5">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-200"><Bot size={14} /> AI survey brief</div>
                <textarea
                  value={aiPrompt}
                  onChange={event => { setAiPrompt(event.target.value); setSelectedAiChip(null); setAiGeneratedPreview(false); }}
                  placeholder="Example: Create a preventive maintenance checklist for a water-cooled chiller in a residential tower."
                  className="mt-4 min-h-32 w-full rounded-xl border border-[rgba(46,127,255,0.22)] bg-[#0A1628] p-3 text-[12px] leading-5 text-[#EEF3FA] outline-none placeholder:text-[#4A6080] focus:border-[#E11D2E]"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  {aiPromptChips.map(chip => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => {
                        setSelectedAiChip(chip);
                        setAiPrompt(`Create a ${chip.toLowerCase()} checklist for a residential tower.`);
                        setAiGeneratedPreview(false);
                      }}
                      className={`rounded-full border px-3 py-1.5 text-[10px] font-bold transition ${selectedAiChip === chip ? 'border-[#E11D2E]/70 bg-[#E11D2E]/12 text-white shadow-lg shadow-red-950/20' : 'border-[rgba(46,127,255,0.22)] bg-[#07111F] text-[#B8C7DB] hover:border-[#E11D2E]/45 hover:text-white'}`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-[rgba(46,127,255,0.18)] bg-[#07111F] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>AI draft preview</h4>
                    <p className="mt-1 text-[11px] text-[#7A94B4]">Structured and ready for the survey basics step.</p>
                  </div>
                  <Badge tone={aiGeneratedPreview ? 'Completed' : 'default'}>{aiGeneratedPreview ? 'Draft generated' : 'Ready to generate'}</Badge>
                </div>
                <div className="mt-4 grid gap-2 text-[11px] text-[#B8C7DB]">
                  <div className="rounded-xl bg-[#102040] p-3"><b className="text-white">{aiDraftProfile.sections} sections</b> across {aiDraftProfile.focus}.</div>
                  <div className="rounded-xl bg-[#102040] p-3"><b className="text-white">{aiDraftProfile.questions} questions</b> with mandatory checks and evidence rules.</div>
                  <div className="rounded-xl bg-[#102040] p-3"><b className="text-white">{aiDraftProfile.duration}</b> estimated field completion time.</div>
                  <div className="rounded-xl bg-[#102040] p-3"><b className="text-white">{aiDraftProfile.frequency}</b> recommended frequency with {aiDraftProfile.evidence}.</div>
                </div>
              </div>
            </div>
          )}

          {wizardStep === 'template' && (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {templates.map(template => {
                const normalized = normalizeTemplate(template);
                return (
                  <div key={template.name} className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#E11D2E]/12 text-red-200"><ClipboardCheck size={18} /></div>
                    <h3 className="text-sm font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{template.name}</h3>
                    <p className="mt-1 text-[11px] text-[#7A94B4]">{template.type}</p>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] text-[#B8C7DB]">
                      <span>{template.duration}</span>
                      <span>{template.questions} questions</span>
                      <span className="col-span-2">{template.evidence}</span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button onClick={() => setPreviewTemplate(normalized)} className="rounded-lg border border-[rgba(46,127,255,0.24)] bg-[#07111F] px-3 py-2 text-[11px] font-bold text-[#B8C7DB] hover:border-[#7EB8F7]/50 hover:text-white">
                        View survey
                      </button>
                      <button onClick={() => applyTemplate(normalized)} className="rounded-lg border border-[#E11D2E]/35 bg-[#E11D2E]/10 px-3 py-2 text-[11px] font-bold text-red-200 hover:bg-[#E11D2E]/16">Use template</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {wizardStep === 'basics' && (
            <>
              <div className="grid gap-3 lg:grid-cols-2">
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
                      {startMode === 'ai' && <span className="rounded-full border border-[#E11D2E]/25 bg-[#E11D2E]/10 px-2.5 py-1 text-red-100">AI draft applied</span>}
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
              <div className="mt-4 rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#07111F] p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-[#EEF3FA]">Template options for {type}</h4>
                    {selectedTemplate && <p className="mt-1 text-[11px] text-[#7A94B4]">{selectedTemplate.name} is selected as the starting structure.</p>}
                  </div>
                  {selectedTemplate && <Badge tone="Completed">Template loaded</Badge>}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {templateOptions[type].map(template => <Badge key={template} tone={template === selectedTemplate?.name ? 'Completed' : 'default'}>{template}</Badge>)}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="shrink-0 flex flex-col-reverse gap-2 border-t border-[rgba(46,127,255,0.14)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          {wizardStep === 'basics' && !initialTemplate ? (
            <button onClick={goBackFromBasics} className="rounded-lg border border-[rgba(46,127,255,0.22)] px-4 py-2 text-[12px] font-bold text-[#B8C7DB] hover:bg-white/5">Back</button>
          ) : <span />}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {wizardStep === 'start' && <button onClick={onClose} className="rounded-lg border border-[rgba(46,127,255,0.22)] px-4 py-2 text-[12px] font-bold text-[#B8C7DB] hover:bg-white/5">Close</button>}
            {wizardStep === 'ai' && (
              <>
                <button onClick={() => setWizardStep('start')} className="rounded-lg border border-[rgba(46,127,255,0.22)] px-4 py-2 text-[12px] font-bold text-[#B8C7DB] hover:bg-white/5">Back</button>
                <button onClick={() => setAiGeneratedPreview(true)} className="rounded-lg border border-[#E11D2E]/35 bg-[#E11D2E]/10 px-4 py-2 text-[12px] font-bold text-red-100 hover:bg-[#E11D2E]/16">Preview AI Draft</button>
                <button onClick={applyAiDraft} className="rounded-lg bg-[#E11D2E] px-4 py-2 text-[12px] font-bold text-white shadow-lg shadow-red-950/25">Generate Survey</button>
              </>
            )}
            {wizardStep === 'template' && (
              <>
                <button onClick={() => setWizardStep('start')} className="rounded-lg border border-[rgba(46,127,255,0.22)] px-4 py-2 text-[12px] font-bold text-[#B8C7DB] hover:bg-white/5">Back</button>
                <button onClick={startManual} className="rounded-lg border border-[#E11D2E]/35 bg-[#E11D2E]/10 px-4 py-2 text-[12px] font-bold text-red-100 hover:bg-[#E11D2E]/16">Build Manually</button>
              </>
            )}
            {wizardStep === 'basics' && (
              <>
                <button onClick={onClose} className="rounded-lg border border-[rgba(46,127,255,0.22)] px-4 py-2 text-[12px] font-bold text-[#B8C7DB] hover:bg-white/5">Save Draft</button>
                <button onClick={() => onDesign(type)} className="rounded-lg bg-[#E11D2E] px-4 py-2 text-[12px] font-bold text-white shadow-lg shadow-red-950/25">Continue to Design</button>
              </>
            )}
          </div>
        </div>
        {previewTemplate && (
          <div className="absolute inset-0 z-10 flex flex-col bg-[#0A1628]">
            <div className="flex shrink-0 items-center justify-between border-b border-[rgba(46,127,255,0.14)] bg-[linear-gradient(135deg,rgba(225,29,46,0.14),rgba(46,127,255,0.06))] px-5 py-4">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-[#E11D2E]">Template preview</div>
                <h3 className="mt-1 text-lg font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{previewTemplate.name}</h3>
              </div>
              <button onClick={() => setPreviewTemplate(null)} className="rounded-lg p-2 text-[#7A94B4] hover:bg-white/5 hover:text-white"><X size={18} /></button>
            </div>
            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-5">
              <TemplateSurveyDetails
                template={previewTemplate}
                onUseTemplate={() => {
                  applyTemplate(previewTemplate);
                  setPreviewTemplate(null);
                }}
              />
            </div>
          </div>
        )}
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

function AssignSurveyPanel({ survey, onToast }: { survey: Survey; onToast: Props['onToast'] }) {
  const assignment = assignments.find(item => item.surveyId === survey.id) ?? assignments[0];
  const [assignees, setAssignees] = useState(() => assignment.assignee.split(',').map(item => item.trim()).filter(Boolean));
  const [role, setRole] = useState(assignment.role);
  const [site, setSite] = useState(assignment.site);
  const [startDate, setStartDate] = useState(formatDateInput(new Date()));
  const [dueDate, setDueDate] = useState(assignment.dueDate);
  const [recurrence, setRecurrence] = useState(assignment.recurrence);
  const [priority, setPriority] = useState<SurveyPriority>('High');
  const [reviewer, setReviewer] = useState('Mariam Saleh');
  const [instructions, setInstructions] = useState('Capture readings, upload evidence, and escalate any failed item immediately.');

  const scopeOptions = useMemo(() => {
    const scopes = [...survey.siteIds, ...survey.assetIds];
    return scopes.length ? scopes : ['All sites and common areas'];
  }, [survey.assetIds, survey.siteIds]);

  const toggleAssignee = (assignee: string) => {
    setAssignees(current => current.includes(assignee) ? current.filter(item => item !== assignee) : [...current, assignee]);
  };

  const generateInstructions = (mode: 'draft' | 'safety' | 'short') => {
    const selected = assignees.length ? assignees.join(', ') : 'selected assignees';
    if (mode === 'short') {
      setInstructions(`Complete ${survey.name}, attach required evidence, and escalate failed critical checks before ${dueDate}.`);
      return;
    }
    if (mode === 'safety') {
      setInstructions(`Before starting ${survey.name}, confirm safe access, PPE, isolation requirements, and site permissions. Capture photo evidence for failed checks, add notes for abnormal readings, and escalate any high-risk finding to ${reviewer}.`);
      return;
    }
    setInstructions(`Assign ${survey.name} to ${selected}. Complete the survey within the selected validity window, capture mandatory photos/readings/GPS evidence, document failed items clearly, and route high-priority findings to ${reviewer} for review.`);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-[#E11D2E]/25 bg-[linear-gradient(135deg,rgba(225,29,46,0.12),rgba(46,127,255,0.05))] p-4">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-200"><Sparkles size={13} /> AI assignment setup</div>
        <p className="mt-2 text-[12px] leading-5 text-[#B8C7DB]">Choose one or more registered assignees, define schedule and access rules, then let AI refine the field instructions.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">Assignee</span>
          <div className="rounded-xl border border-[rgba(46,127,255,0.22)] bg-[#07111F] p-3">
            <div className="mb-3 flex flex-wrap gap-2">
              {assignees.length ? assignees.map(assignee => (
                <span key={assignee} className="inline-flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold text-emerald-200">
                  {assignee}
                  <button type="button" onClick={() => toggleAssignee(assignee)} className="text-emerald-100 hover:text-white">x</button>
                </span>
              )) : <span className="text-[11px] text-[#7A94B4]">Select one or more assignees</span>}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {assignableAssignees.map(assignee => (
                <label key={assignee} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-[11px] font-bold transition-colors ${assignees.includes(assignee) ? 'border-[#E11D2E]/45 bg-[#E11D2E]/10 text-red-100' : 'border-[rgba(46,127,255,0.14)] bg-[#0A1628] text-[#B8C7DB] hover:border-[#7EB8F7]/40'}`}>
                  <input type="checkbox" checked={assignees.includes(assignee)} onChange={() => toggleAssignee(assignee)} className="accent-[#E11D2E]" />
                  {assignee}
                </label>
              ))}
            </div>
          </div>
        </div>

        <label className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">Role</span>
          <select className={`${fieldInput} w-full`} value={role} onChange={event => setRole(event.target.value)}>
            {assignmentRoles.map(option => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">Site / Scope</span>
          <select className={`${fieldInput} w-full`} value={site} onChange={event => setSite(event.target.value)}>
            {scopeOptions.map(option => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">Start date</span>
          <input type="date" className={`${fieldInput} w-full`} value={startDate} onChange={event => { setStartDate(event.target.value); if (dueDate < event.target.value) setDueDate(event.target.value); }} />
        </label>
        <label className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">Due date</span>
          <input type="date" className={`${fieldInput} w-full`} value={dueDate} min={startDate} onChange={event => setDueDate(event.target.value)} />
        </label>
        <label className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">Recurrence</span>
          <select className={`${fieldInput} w-full capitalize`} value={recurrence} onChange={event => setRecurrence(event.target.value as typeof recurrence)}>
            {recurrenceOptions.map(option => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">Priority</span>
          <select className={`${fieldInput} w-full`} value={priority} onChange={event => setPriority(event.target.value as SurveyPriority)}>
            {priorityOptions.map(option => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label className="space-y-1.5 sm:col-span-2">
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">Supervisor reviewer</span>
          <select className={`${fieldInput} w-full`} value={reviewer} onChange={event => setReviewer(event.target.value)}>
            {supervisorReviewers.map(option => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label className="space-y-1.5 sm:col-span-2">
          <span className="flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">
            Instructions
            <span className="inline-flex items-center gap-1 rounded-full border border-[#E11D2E]/25 bg-[#E11D2E]/10 px-2.5 py-1 text-[10px] font-black normal-case tracking-normal text-red-100"><Bot size={12} /> AI Copilot</span>
          </span>
          <textarea className="min-h-24 w-full rounded-lg border border-[rgba(46,127,255,0.22)] bg-[#0A1628] px-3 py-2 text-[12px] leading-5 text-[#EEF3FA] outline-none focus:border-[#E11D2E]" value={instructions} onChange={event => setInstructions(event.target.value)} />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => generateInstructions('draft')} className="rounded-full border border-[#E11D2E]/30 bg-[#E11D2E]/10 px-3 py-1.5 text-[10px] font-bold text-red-100 hover:bg-[#E11D2E]/16">Draft with AI</button>
            <button type="button" onClick={() => generateInstructions('safety')} className="rounded-full border border-[rgba(46,127,255,0.22)] bg-[#07111F] px-3 py-1.5 text-[10px] font-bold text-[#B8C7DB] hover:text-white">Add safety notes</button>
            <button type="button" onClick={() => generateInstructions('short')} className="rounded-full border border-[rgba(46,127,255,0.22)] bg-[#07111F] px-3 py-1.5 text-[10px] font-bold text-[#B8C7DB] hover:text-white">Make concise</button>
          </div>
        </label>
      </div>

      <div className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#07111F] p-4">
        <h4 className="text-sm font-bold text-[#EEF3FA]">Access control</h4>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {['Authenticated users only', 'Public link allowed', 'QR scan allowed', 'Vendor access allowed', 'Anonymous capture allowed', 'Approval required'].map(item => <Badge key={item}>{item}</Badge>)}
        </div>
      </div>

      <button onClick={() => onToast(`Survey assigned to ${assignees.length || 0} assignee${assignees.length === 1 ? '' : 's'}`, 'success')} className="w-full rounded-lg bg-[#E11D2E] px-4 py-3 text-[12px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50" disabled={assignees.length === 0}>Assign Survey</button>
    </div>
  );
}

function ShareSurveyPanel({ survey, onToast }: { survey: Survey; onToast: Props['onToast'] }) {
  const surveyLink = `https://4c360.properties/fieldops/survey/${survey.id}/capture`;
  const [qrGenerated, setQrGenerated] = useState(true);
  const [rules, setRules] = useState<Record<string, boolean>>({
    requireLogin: true,
    anonymousSubmission: false,
    limitByGeography: true,
    expiry: true,
    maxSubmissions: true,
    allowedRoles: true,
    allowedOrganizations: true,
    allowedSites: true,
  });

  const toggleRule = (id: string) => {
    setRules(current => ({ ...current, [id]: !current[id] }));
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(surveyLink);
      onToast('Survey link copied', 'success');
    } catch {
      onToast('Copy blocked by browser. Link is visible in the drawer.', 'warning');
    }
  };

  const shareActions: Array<{ label: string; icon: typeof QrCode; onClick: () => void }> = [
    { label: 'Generate QR Code', icon: QrCode, onClick: () => { setQrGenerated(true); onToast('QR code generated', 'success'); } },
    { label: 'Copy Link', icon: Copy, onClick: copyLink },
    { label: 'Send by Email', icon: Mail, onClick: () => onToast('Email share draft prepared', 'success') },
    { label: 'Send by WhatsApp', icon: MessageCircle, onClick: () => onToast('WhatsApp share link prepared', 'success') },
    { label: 'Embed Link', icon: Link2, onClick: () => onToast('Embed link copied for portal use', 'success') },
  ];

  const accessRules = [
    { id: 'requireLogin', label: 'Require login' },
    { id: 'anonymousSubmission', label: 'Allow anonymous submission' },
    { id: 'limitByGeography', label: 'Limit by geography' },
    { id: 'expiry', label: 'Expiry: 30 Apr 2026' },
    { id: 'maxSubmissions', label: 'Max submissions: 250' },
    { id: 'allowedRoles', label: 'Allowed roles: Engineer, Inspector, Contractor' },
    { id: 'allowedOrganizations', label: 'Allowed organizations: DevelopmentX' },
    { id: 'allowedSites', label: `Allowed sites: ${survey.siteIds[0] ?? 'Selected sites'}` },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[170px_1fr]">
        <div className="space-y-3">
          <QRPreview />
          <div className={`rounded-xl border px-3 py-2 text-center text-[10px] font-black uppercase tracking-widest ${qrGenerated ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200' : 'border-amber-400/25 bg-amber-400/10 text-amber-200'}`}>
            {qrGenerated ? 'QR ready' : 'QR pending'}
          </div>
        </div>
        <div className="space-y-3">
          <div className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#07111F] p-4">
            <p className="text-[10px] font-bold uppercase text-[#7A94B4]">Mobile survey link</p>
            <p className="mt-2 break-all font-mono text-[12px] text-[#B8C7DB]">{surveyLink}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {shareActions.map(({ label, icon: Icon, onClick }) => (
              <button key={label} onClick={onClick} className="flex items-center gap-2 rounded-lg border border-[rgba(46,127,255,0.18)] bg-[#07111F] px-3 py-2 text-[11px] font-bold text-[#B8C7DB] transition hover:border-[#E11D2E]/40 hover:bg-white/5 hover:text-white">
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#07111F] p-4">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-sm font-bold text-[#EEF3FA]">Access rules summary</h4>
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">{Object.values(rules).filter(Boolean).length} active</span>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {accessRules.map(rule => (
            <label key={rule.id} className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-bold transition ${rules[rule.id] ? 'border-[rgba(46,127,255,0.24)] bg-[#112033] text-[#B8C7DB]' : 'border-slate-500/15 bg-[#07111F] text-[#5A6F8E]'}`}>
              <input type="checkbox" checked={rules[rule.id]} onChange={() => toggleRule(rule.id)} className="h-3.5 w-3.5 rounded accent-[#E11D2E]" />
              {rule.label}
            </label>
          ))}
        </div>
        {rules.limitByGeography && (
          <div className="mt-4 rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-[11px] font-bold text-emerald-300">
            <MapPin size={13} className="mr-1 inline" /> Geo-restricted - 150m radius around selected site boundary
          </div>
        )}
      </div>
    </div>
  );
}

export function FieldOpsDashboard({ onToast }: Props) {
  const { clients: properties } = useClients();
  const [tab, setTab] = useState<Tab>('surveys');
  const [query, setQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createTemplate, setCreateTemplate] = useState<FieldOpsTemplate | null>(null);
  const [templatePreview, setTemplatePreview] = useState<FieldOpsTemplate | null>(null);
  const [drawer, setDrawer] = useState<Drawer>(null);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey>(surveys[0]);
  const [selectedSubmission, setSelectedSubmission] = useState<SurveySubmission>(submissions[0]);
  const [aiPrompt, setAiPrompt] = useState(aiGeneratedSurvey.prompt);
  const [aiGenerated, setAiGenerated] = useState(true);

  const filteredSurveys = useMemo(() => {
    const lower = query.toLowerCase();
    return surveys.filter(survey => `${survey.name} ${survey.type} ${survey.assignedTo}`.toLowerCase().includes(lower));
  }, [query]);

  const activeSurveyCount = surveys.filter(survey => survey.status !== 'Archived').length;

  const stats = [
    { label: 'Active Surveys', value: activeSurveyCount, icon: ClipboardCheck, tone: 'text-emerald-300' },
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
    setTemplatePreview(null);
    setCreateOpen(true);
  };

  const closeCreateSurvey = () => {
    setCreateOpen(false);
    setCreateTemplate(null);
  };

  const actionButton = (label: string, next: Drawer, survey: Survey, icon: ComponentType<{ size?: number; className?: string }>, disabled = false) => (
    <ActionIconButton label={label} icon={icon} disabled={disabled} onClick={() => openDrawer(next, survey)} />
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
                <h2 className="text-sm font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Active Surveys</h2>
                <p className="mt-1 text-[11px] text-[#7A94B4]">{activeSurveyCount} active surveys ready to design, assign, share, duplicate, archive, and track.</p>
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
                          {actionButton('Edit', 'design', survey, PencilRuler, survey.status === 'Completed')}
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
            {templates.map(template => {
              const normalized = normalizeTemplate(template);
              return (
                <div key={template.name} className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#E11D2E]/12 text-red-200"><ClipboardCheck size={18} /></div>
                  <h3 className="text-sm font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{template.name}</h3>
                  <p className="mt-1 text-[11px] text-[#7A94B4]">{template.type}</p>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] text-[#B8C7DB]">
                    <span>{template.duration}</span>
                    <span>{template.questions} questions</span>
                    <span className="col-span-2">{template.evidence}</span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button onClick={() => setTemplatePreview(normalized)} className="rounded-lg border border-[rgba(46,127,255,0.24)] bg-[#07111F] px-3 py-2 text-[11px] font-bold text-[#B8C7DB] hover:border-[#7EB8F7]/50 hover:text-white">
                      <Eye size={13} className="mr-1 inline" />
                      View
                    </button>
                    <button onClick={() => openCreateSurvey(normalized)} className="rounded-lg border border-[#E11D2E]/35 bg-[#E11D2E]/10 px-3 py-2 text-[11px] font-bold text-red-200 hover:bg-[#E11D2E]/16">Use template</button>
                  </div>
                </div>
              );
            })}
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
        {templatePreview && (
          <SideDrawer title="Survey Template Preview" onClose={() => setTemplatePreview(null)}>
            <TemplateSurveyDetails
              template={templatePreview}
              onUseTemplate={() => openCreateSurvey(templatePreview)}
            />
          </SideDrawer>
        )}

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
            <AssignSurveyPanel survey={selectedSurvey} onToast={onToast} />
          </SideDrawer>
        )}

        {drawer === 'share' && (
          <SideDrawer title="Share Survey" onClose={() => setDrawer(null)}>
            <ShareSurveyPanel survey={selectedSurvey} onToast={onToast} />
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
