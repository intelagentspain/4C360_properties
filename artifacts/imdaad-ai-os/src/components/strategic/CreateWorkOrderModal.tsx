import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Sparkles, ChevronDown, Check, Clock, User, AlertTriangle,
  Loader2, FileText, Zap,
} from 'lucide-react';
import { mockKanbanTasks, mockInspectors } from '@/data/mockData';
import { SEVERITY_BADGE, type ToastFn } from '@/lib/ui';

type KTask = typeof mockKanbanTasks[0];

const ALL_ASSETS = [
  'AHU-Block A', 'WH-Villa 14', 'Chiller C-04', 'MCB Panel',
  'Lift-Cluster A', 'Pipe M22', 'PP-02', 'FP-01', 'AHU-Gym',
  'IC-Main-Gate', 'Light-B3', 'ACU-Roof-D',
];

const ALL_SITES = [
  'Block A, Floor 2', 'Villa 14, Cluster B', 'Villa 23, Cluster A',
  'Villa 31', 'Cluster A, Block 2', 'Villa 7, Cluster B',
  'Recreation Area', 'Community Centre', 'Block C Gym',
  'Main Gate', 'Block B, Corridor 3', 'Block D Rooftop',
];

const SKILL_OPTIONS = ['HVAC', 'Plumbing', 'Electrical', 'General', 'Safety'];
const PRIORITY_OPTIONS = ['critical', 'high', 'medium', 'low'];
const TECH_OPTIONS = ['Karim R.', 'Ahmed K.', 'Sara M.', 'Faisal N.', 'Omar T.'];

const SLA_BY_PRIORITY: Record<string, number> = {
  critical: 45,
  high: 120,
  medium: 240,
  low: 480,
};

const TECH_SKILL_MAP: Record<string, string> = {
  'Karim R.':  'HVAC',
  'Ahmed K.':  'Plumbing',
  'Sara M.':   'Electrical',
  'Faisal N.': 'Plumbing',
  'Omar T.':   'General',
};

const TECH_STATUS_MAP: Record<string, string> = {
  'Karim R.':  'transit',
  'Ahmed K.':  'active',
  'Sara M.':   'available',
  'Faisal N.': 'available',
  'Omar T.':   'overdue',
};

const DURATION_BY_SKILL: Record<string, number> = {
  HVAC:       90,
  Plumbing:   60,
  Electrical: 45,
  General:    30,
  Safety:     120,
};

interface FormState {
  title: string;
  description: string;
  asset: string;
  site: string;
  priority: string;
  skill: string;
  tech: string;
  slaMinutes: number;
}

interface AISuggestions {
  priority: string | null;
  tech: string | null;
  techReason: string | null;
  durationMinutes: number | null;
  similar: KTask[];
}

function computeAISuggestions(form: FormState): AISuggestions {
  const text = (form.title + ' ' + form.description).toLowerCase();

  let priority: string | null = null;
  if (/critical|emergency|fail|no cooling|no power|fire|urgent/.test(text)) priority = 'critical';
  else if (/fault|broken|not working|trip|issue|warning|leak/.test(text)) priority = 'high';
  else if (/check|inspect|service|routine|annual/.test(text)) priority = 'medium';
  else if (/minor|clean|adjust|replace filter|light/.test(text)) priority = 'low';
  else if (form.skill) {
    priority = form.skill === 'Safety' ? 'high' : 'medium';
  }

  let tech: string | null = null;
  let techReason: string | null = null;
  if (form.skill) {
    const skillTechs = TECH_OPTIONS.filter(t => TECH_SKILL_MAP[t] === form.skill);
    const available = skillTechs.filter(t => TECH_STATUS_MAP[t] === 'available');
    if (available.length > 0) {
      tech = available[0];
      techReason = `Available · ${form.skill} specialist`;
    } else if (skillTechs.length > 0) {
      tech = skillTechs[0];
      techReason = `${form.skill} specialist · best match`;
    } else {
      tech = 'Omar T.';
      techReason = 'General inspector · available';
    }
  }

  const durationMinutes = form.skill ? DURATION_BY_SKILL[form.skill] ?? null : null;

  const similar: KTask[] = [];
  if (form.title.length > 3 || form.skill || form.asset) {
    mockKanbanTasks.forEach(t => {
      if (similar.length >= 3) return;
      const titleMatch = form.title.length > 3 && t.title.toLowerCase().includes(form.title.toLowerCase().slice(0, 4));
      const skillMatch = form.skill && t.skill === form.skill;
      const assetMatch = form.asset && t.asset === form.asset;
      if (titleMatch || assetMatch || skillMatch) similar.push(t);
    });
  }

  return { priority, tech, techReason, durationMinutes, similar };
}

function SelectField({
  label, value, options, placeholder, onChange, required,
}: {
  label: string; value: string; options: string[]; placeholder: string;
  onChange: (v: string) => void; required?: boolean;
}) {
  return (
    <div>
      <label className="text-[9px] text-[#7A94B4] uppercase tracking-wide block mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-[#0D1F3A] border border-[rgba(46,127,255,0.2)] rounded-lg px-3 py-2 text-[11px] text-[#EEF3FA] outline-none appearance-none cursor-pointer focus:border-[#2E7FFF] transition-colors pr-7"
        >
          <option value="" disabled>{placeholder}</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#7A94B4] pointer-events-none" />
      </div>
    </div>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (task: KTask) => void;
  onToast: ToastFn;
}

export function CreateWorkOrderModal({ open, onClose, onCreated, onToast }: Props) {
  const [form, setForm] = useState<FormState>({
    title: '', description: '', asset: '', site: '',
    priority: '', skill: '', tech: '', slaMinutes: 120,
  });
  const [submitting, setSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestions>({
    priority: null, tech: null, techReason: null, durationMinutes: null, similar: [],
  });
  const [aiLoading, setAiLoading] = useState(false);

  const setField = useCallback(<K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm(prev => ({ ...prev, [k]: v }));
  }, []);

  useEffect(() => {
    if (!open) return;
    const hasInput = form.title.length > 2 || form.skill || form.asset;
    if (!hasInput) {
      setSuggestions({ priority: null, tech: null, techReason: null, durationMinutes: null, similar: [] });
      return;
    }
    setAiLoading(true);
    const timer = setTimeout(() => {
      setSuggestions(computeAISuggestions(form));
      setAiLoading(false);
    }, 480);
    return () => clearTimeout(timer);
  }, [form.title, form.description, form.skill, form.asset, open]);

  useEffect(() => {
    if (form.priority) setField('slaMinutes', SLA_BY_PRIORITY[form.priority] ?? 120);
  }, [form.priority, setField]);

  function handleClose() {
    setForm({ title: '', description: '', asset: '', site: '', priority: '', skill: '', tech: '', slaMinutes: 120 });
    setSuggestions({ priority: null, tech: null, techReason: null, durationMinutes: null, similar: [] });
    onClose();
  }

  function handleSubmit() {
    if (!form.title || !form.priority || !form.skill) {
      onToast('Please fill in Title, Priority, and Skill Category', 'warning');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      const newTask: KTask = {
        id: `KT-${String(Date.now()).slice(-4)}`,
        title: form.title,
        asset: form.asset || 'Unspecified',
        location: form.site || 'Silicon Oasis',
        skill: form.skill as KTask['skill'],
        priority: form.priority as KTask['priority'],
        status: form.tech ? 'assigned' : 'new',
        tech: form.tech || null,
        slaMinutes: form.slaMinutes,
        elapsed: 0,
        reportedBy: 'Strategic Dashboard',
        evidence: [],
      };
      onCreated(newTask);
      onToast(`Work order "${form.title}" created successfully`, 'success');
      setSubmitting(false);
      handleClose();
    }, 700);
  }

  const hasSuggestions = suggestions.priority || suggestions.tech || suggestions.durationMinutes !== null || suggestions.similar.length > 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(5,12,30,0.85)', backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-[rgba(46,127,255,0.25)] bg-[#0A1628] shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(46,127,255,0.15)] flex-shrink-0">
              <div>
                <h2 className="text-[#EEF3FA] font-bold text-sm" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Create Work Order
                </h2>
                <p className="text-[10px] text-[#7A94B4] mt-0.5">Fill in the details — AI will suggest values as you type</p>
              </div>
              <button onClick={handleClose} className="text-[#7A94B4] hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                <div>
                  <label className="text-[9px] text-[#7A94B4] uppercase tracking-wide block mb-1">
                    Title<span className="text-red-400 ml-0.5">*</span>
                  </label>
                  <input
                    value={form.title}
                    onChange={e => setField('title', e.target.value)}
                    placeholder="e.g. AC Filter Replacement — Block A"
                    className="w-full bg-[#0D1F3A] border border-[rgba(46,127,255,0.2)] rounded-lg px-3 py-2 text-[11px] text-[#EEF3FA] placeholder-[#7A94B4]/60 outline-none focus:border-[#2E7FFF] transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[9px] text-[#7A94B4] uppercase tracking-wide block mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => setField('description', e.target.value)}
                    placeholder="Describe the issue or task in detail…"
                    rows={3}
                    className="w-full bg-[#0D1F3A] border border-[rgba(46,127,255,0.2)] rounded-lg px-3 py-2 text-[11px] text-[#EEF3FA] placeholder-[#7A94B4]/60 outline-none resize-none focus:border-[#2E7FFF] transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <SelectField label="Asset" value={form.asset} options={ALL_ASSETS} placeholder="Select asset…" onChange={v => setField('asset', v)} />
                  <SelectField label="Site / Location" value={form.site} options={ALL_SITES} placeholder="Select location…" onChange={v => setField('site', v)} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <SelectField label="Skill Category" value={form.skill} options={SKILL_OPTIONS} placeholder="Select skill…" onChange={v => setField('skill', v)} required />
                  <div>
                    <label className="text-[9px] text-[#7A94B4] uppercase tracking-wide block mb-1">
                      Priority<span className="text-red-400 ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={form.priority}
                        onChange={e => setField('priority', e.target.value)}
                        className="w-full bg-[#0D1F3A] border border-[rgba(46,127,255,0.2)] rounded-lg px-3 py-2 text-[11px] text-[#EEF3FA] outline-none appearance-none cursor-pointer focus:border-[#2E7FFF] transition-colors pr-7 capitalize"
                      >
                        <option value="" disabled>Select priority…</option>
                        {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                      </select>
                      <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#7A94B4] pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <SelectField label="Assigned Inspector" value={form.tech} options={TECH_OPTIONS} placeholder="Select inspector…" onChange={v => setField('tech', v)} />
                  <div>
                    <label className="text-[9px] text-[#7A94B4] uppercase tracking-wide block mb-1">SLA Window</label>
                    <div className="flex items-center gap-2 bg-[#0D1F3A] border border-[rgba(46,127,255,0.2)] rounded-lg px-3 py-2">
                      <Clock size={11} className="text-[#7A94B4] flex-shrink-0" />
                      <span className="text-[11px] text-[#EEF3FA]">
                        {form.slaMinutes >= 60
                          ? `${Math.floor(form.slaMinutes / 60)}h ${form.slaMinutes % 60 > 0 ? `${form.slaMinutes % 60}m` : ''}`
                          : `${form.slaMinutes}m`}
                      </span>
                      {form.priority && (
                        <span className="text-[9px] text-[#7A94B4] ml-auto capitalize">auto-set by priority</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[rgba(46,127,255,0.1)]">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 text-[11px] text-[#7A94B4] hover:text-[#EEF3FA] border border-[rgba(46,127,255,0.2)] rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-5 py-2 text-[11px] font-semibold text-white rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #2E7FFF 0%, #1a5fd4 100%)' }}
                  >
                    {submitting ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
                    {submitting ? 'Creating…' : 'Create Work Order'}
                  </button>
                </div>
              </div>

              <div className="w-64 flex-shrink-0 border-l border-[rgba(46,127,255,0.15)] flex flex-col bg-[#071220]">
                <div className="px-4 py-3 border-b border-[rgba(46,127,255,0.1)] flex items-center gap-2 flex-shrink-0">
                  <div className="w-5 h-5 rounded-md bg-[rgba(46,127,255,0.2)] flex items-center justify-center">
                    <Sparkles size={10} className="text-[#2E7FFF]" />
                  </div>
                  <span className="text-[11px] text-[#EEF3FA] font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>AI Suggestions</span>
                  {aiLoading && <Loader2 size={10} className="text-[#2E7FFF] animate-spin ml-auto" />}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                  {!hasSuggestions && !aiLoading && (
                    <div className="flex flex-col items-center justify-center py-8 gap-2 opacity-40">
                      <Sparkles size={20} className="text-[#2E7FFF]" />
                      <p className="text-[10px] text-[#7A94B4] text-center leading-relaxed">
                        Start filling in the form to get AI suggestions
                      </p>
                    </div>
                  )}

                  {suggestions.priority && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[#0D1F3A] border border-[rgba(46,127,255,0.15)] rounded-xl p-3 space-y-2"
                    >
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle size={10} className="text-amber-400" />
                        <span className="text-[9px] text-[#7A94B4] uppercase tracking-wide">Priority</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold capitalize px-2 py-0.5 rounded border ${SEVERITY_BADGE[suggestions.priority]}`}>
                          {suggestions.priority}
                        </span>
                        <button
                          onClick={() => setField('priority', suggestions.priority!)}
                          className="flex items-center gap-1 text-[9px] text-[#2E7FFF] hover:text-blue-300 transition-colors font-semibold"
                        >
                          <Check size={9} /> Apply
                        </button>
                      </div>
                      <p className="text-[9px] text-[#7A94B4] leading-relaxed">Based on keywords in your title and description.</p>
                    </motion.div>
                  )}

                  {suggestions.tech && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 }}
                      className="bg-[#0D1F3A] border border-[rgba(46,127,255,0.15)] rounded-xl p-3 space-y-2"
                    >
                      <div className="flex items-center gap-1.5">
                        <User size={10} className="text-blue-400" />
                        <span className="text-[9px] text-[#7A94B4] uppercase tracking-wide">Inspector</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-[#EEF3FA] font-semibold">{suggestions.tech}</span>
                        <button
                          onClick={() => setField('tech', suggestions.tech!)}
                          className="flex items-center gap-1 text-[9px] text-[#2E7FFF] hover:text-blue-300 transition-colors font-semibold"
                        >
                          <Check size={9} /> Apply
                        </button>
                      </div>
                      {suggestions.techReason && (
                        <p className="text-[9px] text-[#7A94B4]">{suggestions.techReason}</p>
                      )}
                    </motion.div>
                  )}

                  {suggestions.durationMinutes !== null && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-[#0D1F3A] border border-[rgba(46,127,255,0.15)] rounded-xl p-3 space-y-2"
                    >
                      <div className="flex items-center gap-1.5">
                        <Clock size={10} className="text-cyan-400" />
                        <span className="text-[9px] text-[#7A94B4] uppercase tracking-wide">Est. Duration</span>
                      </div>
                      <div className="text-[13px] text-[#EEF3FA] font-bold">
                        {suggestions.durationMinutes >= 60
                          ? `${Math.floor(suggestions.durationMinutes / 60)}h ${suggestions.durationMinutes % 60 > 0 ? `${suggestions.durationMinutes % 60}m` : ''}`
                          : `${suggestions.durationMinutes}m`}
                      </div>
                      <p className="text-[9px] text-[#7A94B4]">Estimated based on {form.skill} job history.</p>
                    </motion.div>
                  )}

                  {suggestions.similar.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="bg-[#0D1F3A] border border-[rgba(46,127,255,0.15)] rounded-xl p-3 space-y-2"
                    >
                      <div className="flex items-center gap-1.5">
                        <Zap size={10} className="text-emerald-400" />
                        <span className="text-[9px] text-[#7A94B4] uppercase tracking-wide">Similar Past Orders</span>
                      </div>
                      <div className="space-y-1.5">
                        {suggestions.similar.map(t => (
                          <div key={t.id} className="p-2 rounded-lg bg-[#071220] border border-[rgba(46,127,255,0.1)]">
                            <div className="text-[10px] text-[#EEF3FA] font-semibold leading-tight">{t.title}</div>
                            <div className="text-[9px] text-[#7A94B4] mt-0.5">{t.id} · {t.status}</div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
