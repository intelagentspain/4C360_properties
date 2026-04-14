import { useState, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Trash2, X, ChevronDown, Edit2,
  ShieldCheck, AlertTriangle, CheckCircle,
} from 'lucide-react';
import { useVendors, buildDefaultVendor } from '@/context/VendorsContext';
import {
  computeVendorScore, classifyVendorRisk,
  type VendorIntelData, type VendorRiskLevel,
} from '@/data/mockData';
import type { ToastFn } from '@/lib/ui';

interface Props {
  onToast: ToastFn;
}

const CATEGORIES = [
  'FM & HVAC', 'MEP & Systems', 'Cleaning & Soft Services',
  'Security', 'Landscaping', 'Waste Management', 'Elevators & Lifts',
  'Fire & Safety', 'Plumbing', 'Electrical', 'General FM',
];

const DEP_RISK_LEVELS = ['Low', 'Medium', 'High', 'Critical'] as const;

function riskBg(level: VendorRiskLevel): string {
  if (level === 'Preferred') return 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400';
  if (level === 'Watchlist') return 'bg-amber-500/10 border-amber-500/25 text-amber-400';
  return 'bg-red-500/10 border-red-500/25 text-red-400';
}

function depRiskColor(level: string): string {
  if (level === 'Low') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25';
  if (level === 'Medium') return 'text-amber-400 bg-amber-500/10 border-amber-500/25';
  if (level === 'High') return 'text-red-400 bg-red-500/10 border-red-500/25';
  return 'text-purple-400 bg-purple-500/10 border-purple-500/25';
}

interface FormState {
  name: string;
  category: string;
  sites: string;
  activeContracts: string;
  contractExpiry: string;
  slaCompliance: string;
  firstTimeFixRate: string;
  avgResolutionMin: string;
  evidenceCompliance: string;
  repeatFailureRate: string;
  jobsLast30d: string;
  avgCostPerJob: string;
  dependencyRisk: 'Low' | 'Medium' | 'High' | 'Critical';
  dependencyNote: string;
  contractFlags: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  category: 'General FM',
  sites: '',
  activeContracts: '1',
  contractExpiry: 'Dec 2026',
  slaCompliance: '85',
  firstTimeFixRate: '80',
  avgResolutionMin: '50',
  evidenceCompliance: '85',
  repeatFailureRate: '8',
  jobsLast30d: '20',
  avgCostPerJob: '450',
  dependencyRisk: 'Low',
  dependencyNote: '',
  contractFlags: '',
};

function vendorToForm(v: VendorIntelData): FormState {
  return {
    name: v.name,
    category: v.category,
    sites: v.sites.join(', '),
    activeContracts: String(v.activeContracts),
    contractExpiry: v.contractExpiry,
    slaCompliance: String(v.slaCompliance),
    firstTimeFixRate: String(v.firstTimeFixRate),
    avgResolutionMin: String(v.avgResolutionMin),
    evidenceCompliance: String(v.evidenceCompliance),
    repeatFailureRate: String(v.repeatFailureRate),
    jobsLast30d: String(v.jobsLast30d),
    avgCostPerJob: String(v.avgCostPerJob),
    dependencyRisk: v.dependencyRisk as 'Low' | 'Medium' | 'High' | 'Critical',
    dependencyNote: v.dependencyNote,
    contractFlags: v.contractFlags.map(f => f.description).join('; '),
  };
}

function parseFlags(raw: string): VendorIntelData['contractFlags'] {
  if (!raw.trim()) return [];
  return raw.split(';').map(s => s.trim()).filter(Boolean).map(description => ({
    type: 'warning' as const,
    description,
  }));
}

function generateId(): string {
  return `VND-${String(Date.now()).slice(-6)}`;
}

interface FieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

function Field({ label, hint, children }: FieldProps) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-semibold text-[#7A94B4] uppercase tracking-wide">
        {label}
        {hint && <span className="ml-1 text-[#4A6480] normal-case font-normal tracking-normal">({hint})</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = 'w-full bg-[#0A1628] border border-[rgba(46,127,255,0.2)] rounded-lg px-3 py-2 text-[11px] text-[#EEF3FA] focus:outline-none focus:border-[#2E7FFF] placeholder:text-[#4A6480] transition-colors';
const selectCls = `${inputCls} appearance-none cursor-pointer`;

interface SectionHeadingProps {
  icon: React.ReactNode;
  title: string;
}

function SectionHeading({ icon, title }: SectionHeadingProps) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <div className="w-5 h-5 rounded-md bg-[#2E7FFF]/15 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <span className="text-[9px] font-bold text-[#2E7FFF] uppercase tracking-widest">{title}</span>
      <div className="flex-1 h-px bg-[rgba(46,127,255,0.12)]" />
    </div>
  );
}

interface VendorModalProps {
  mode: 'add' | 'edit';
  initial?: VendorIntelData;
  onClose: () => void;
  onSave: (v: VendorIntelData) => void;
}

function VendorModal({ mode, initial, onClose, onSave }: VendorModalProps) {
  const formId = useId();
  const [form, setForm] = useState<FormState>(
    initial ? vendorToForm(initial) : EMPTY_FORM,
  );
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  function set(key: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    const numFields: (keyof FormState)[] = [
      'slaCompliance', 'firstTimeFixRate', 'evidenceCompliance',
    ];
    numFields.forEach(f => {
      const n = Number(form[f]);
      if (isNaN(n) || n < 0 || n > 100) e[f] = 'Enter a value between 0 and 100';
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;

    const sites = form.sites.split(',').map(s => s.trim()).filter(Boolean);
    const overrides: Partial<VendorIntelData> & { id: string; name: string } = {
      id: initial?.id ?? generateId(),
      name: form.name.trim(),
      category: form.category,
      sites,
      activeContracts: Number(form.activeContracts) || 1,
      contractExpiry: form.contractExpiry || 'Dec 2026',
      slaCompliance: Number(form.slaCompliance),
      firstTimeFixRate: Number(form.firstTimeFixRate),
      avgResolutionMin: Number(form.avgResolutionMin) || 50,
      evidenceCompliance: Number(form.evidenceCompliance),
      repeatFailureRate: Number(form.repeatFailureRate) || 8,
      jobsLast30d: Number(form.jobsLast30d) || 20,
      avgCostPerJob: Number(form.avgCostPerJob) || 450,
      dependencyRisk: form.dependencyRisk,
      dependencyNote: form.dependencyNote,
      contractFlags: parseFlags(form.contractFlags),
    };

    if (initial) {
      onSave(buildDefaultVendor({
        ...initial,
        ...overrides,
      }));
    } else {
      onSave(buildDefaultVendor(overrides));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-2xl bg-[#06101E] border border-[rgba(46,127,255,0.22)] rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(46,127,255,0.12)] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#2E7FFF]/15 flex items-center justify-center">
              <ShieldCheck size={13} className="text-[#2E7FFF]" />
            </div>
            <span className="text-[#EEF3FA] font-bold text-sm" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {mode === 'add' ? 'Register New Vendor' : `Edit — ${initial?.name}`}
            </span>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#7A94B4] hover:text-white transition-all">
            <X size={13} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-4" id={formId}>
          <SectionHeading icon={<ShieldCheck size={10} className="text-[#2E7FFF]" />} title="Identity & Scope" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Vendor Name">
              <input
                className={`${inputCls} ${errors.name ? 'border-red-500/50' : ''}`}
                placeholder="e.g. Emrill Services"
                value={form.name}
                onChange={e => set('name', e.target.value)}
              />
              {errors.name && <p className="text-[10px] text-red-400 mt-0.5">{errors.name}</p>}
            </Field>
            <Field label="Category">
              <div className="relative">
                <select className={selectCls} value={form.category} onChange={e => set('category', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7A94B4] pointer-events-none" />
              </div>
            </Field>
            <Field label="Sites Assigned" hint="comma-separated">
              <input
                className={inputCls}
                placeholder="e.g. Silicon Oasis, Gate Avenue"
                value={form.sites}
                onChange={e => set('sites', e.target.value)}
              />
            </Field>
            <Field label="Active Contracts">
              <input
                type="number" min="0"
                className={inputCls}
                placeholder="e.g. 2"
                value={form.activeContracts}
                onChange={e => set('activeContracts', e.target.value)}
              />
            </Field>
            <Field label="Contract Expiry">
              <input
                className={inputCls}
                placeholder="e.g. Dec 2026"
                value={form.contractExpiry}
                onChange={e => set('contractExpiry', e.target.value)}
              />
            </Field>
          </div>

          <SectionHeading icon={<CheckCircle size={10} className="text-[#2E7FFF]" />} title="Performance Baselines (KPIs)" />
          <div className="grid grid-cols-3 gap-3">
            <Field label="SLA Compliance" hint="%">
              <input type="number" min="0" max="100" className={`${inputCls} ${errors.slaCompliance ? 'border-red-500/50' : ''}`}
                placeholder="85" value={form.slaCompliance} onChange={e => set('slaCompliance', e.target.value)} />
              {errors.slaCompliance && <p className="text-[10px] text-red-400 mt-0.5">{errors.slaCompliance}</p>}
            </Field>
            <Field label="First-Time Fix Rate" hint="%">
              <input type="number" min="0" max="100" className={`${inputCls} ${errors.firstTimeFixRate ? 'border-red-500/50' : ''}`}
                placeholder="80" value={form.firstTimeFixRate} onChange={e => set('firstTimeFixRate', e.target.value)} />
              {errors.firstTimeFixRate && <p className="text-[10px] text-red-400 mt-0.5">{errors.firstTimeFixRate}</p>}
            </Field>
            <Field label="Avg Resolution Time" hint="minutes">
              <input type="number" min="0" className={inputCls}
                placeholder="50" value={form.avgResolutionMin} onChange={e => set('avgResolutionMin', e.target.value)} />
            </Field>
            <Field label="Evidence Compliance" hint="%">
              <input type="number" min="0" max="100" className={`${inputCls} ${errors.evidenceCompliance ? 'border-red-500/50' : ''}`}
                placeholder="85" value={form.evidenceCompliance} onChange={e => set('evidenceCompliance', e.target.value)} />
              {errors.evidenceCompliance && <p className="text-[10px] text-red-400 mt-0.5">{errors.evidenceCompliance}</p>}
            </Field>
            <Field label="Repeat Failure Rate" hint="%">
              <input type="number" min="0" max="100" className={inputCls}
                placeholder="8" value={form.repeatFailureRate} onChange={e => set('repeatFailureRate', e.target.value)} />
            </Field>
            <Field label="Jobs Last 30 Days">
              <input type="number" min="0" className={inputCls}
                placeholder="20" value={form.jobsLast30d} onChange={e => set('jobsLast30d', e.target.value)} />
            </Field>
          </div>

          <SectionHeading icon={<ShieldCheck size={10} className="text-[#2E7FFF]" />} title="Financial" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Avg Cost Per Job" hint="AED">
              <input type="number" min="0" className={inputCls}
                placeholder="450" value={form.avgCostPerJob} onChange={e => set('avgCostPerJob', e.target.value)} />
            </Field>
          </div>

          <SectionHeading icon={<AlertTriangle size={10} className="text-[#2E7FFF]" />} title="Risk & Compliance" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Dependency Risk Level">
              <div className="relative">
                <select className={selectCls} value={form.dependencyRisk}
                  onChange={e => set('dependencyRisk', e.target.value as FormState['dependencyRisk'])}>
                  {DEP_RISK_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7A94B4] pointer-events-none" />
              </div>
            </Field>
            <Field label="Dependency Note">
              <input className={inputCls}
                placeholder="e.g. Sole HVAC provider for DSO"
                value={form.dependencyNote} onChange={e => set('dependencyNote', e.target.value)} />
            </Field>
            <Field label="Contract Flags" hint="semicolon-separated descriptions">
              <input className={inputCls}
                placeholder="e.g. SLA breach in March; Missing evidence April"
                value={form.contractFlags} onChange={e => set('contractFlags', e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[rgba(46,127,255,0.12)] flex-shrink-0">
          <button
            onClick={onClose}
            className="text-[11px] font-semibold px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[#7A94B4] hover:text-[#EEF3FA] hover:bg-white/8 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="text-[11px] font-semibold px-4 py-2 rounded-lg bg-[#2E7FFF] hover:bg-[#2470E8] text-white transition-all"
          >
            {mode === 'add' ? 'Register Vendor' : 'Save Changes'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

interface DeleteConfirmProps {
  vendorName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirm({ vendorName, onConfirm, onCancel }: DeleteConfirmProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.15 }}
        className="w-full max-w-sm bg-[#06101E] border border-red-500/25 rounded-2xl shadow-2xl p-5"
      >
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center">
            <AlertTriangle size={13} className="text-red-400" />
          </div>
          <span className="text-[#EEF3FA] font-bold text-sm" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Remove Vendor</span>
        </div>
        <p className="text-[11px] text-[#C8D8EE] mb-4 leading-relaxed">
          Are you sure you want to remove <span className="text-[#EEF3FA] font-semibold">{vendorName}</span>? This will also remove them from the Vendor Intelligence page.
        </p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="text-[11px] font-semibold px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[#7A94B4] hover:text-[#EEF3FA] transition-all">
            Cancel
          </button>
          <button onClick={onConfirm} className="text-[11px] font-semibold px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all">
            Remove
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function VendorsSettings({ onToast }: Props) {
  const { vendors, addVendor, updateVendor, removeVendor } = useVendors();
  const [search, setSearch] = useState('');
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<VendorIntelData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VendorIntelData | null>(null);

  const filtered = vendors.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.category.toLowerCase().includes(search.toLowerCase()),
  );

  function handleSave(v: VendorIntelData) {
    if (modalMode === 'add') {
      addVendor(v);
      onToast(`${v.name} registered successfully`, 'success');
    } else {
      updateVendor(v);
      onToast(`${v.name} updated`, 'success');
    }
    setModalMode(null);
    setEditTarget(null);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    removeVendor(deleteTarget.id);
    onToast(`${deleteTarget.name} removed`, 'success');
    setDeleteTarget(null);
  }

  function openEdit(v: VendorIntelData) {
    setEditTarget(v);
    setModalMode('edit');
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar px-6 py-6">
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[#EEF3FA] font-bold text-sm mb-0.5" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Vendors</h3>
            <p className="text-[11px] text-[#7A94B4]">Register and manage vendors. Changes are reflected in the Vendor Intelligence page.</p>
          </div>
          <button
            onClick={() => { setEditTarget(null); setModalMode('add'); }}
            className="flex items-center gap-1.5 text-[11px] font-semibold px-3.5 py-2 rounded-lg bg-[#2E7FFF] hover:bg-[#2470E8] text-white transition-all flex-shrink-0"
          >
            <Plus size={12} />
            Add Vendor
          </button>
        </div>

        <div className="relative">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A94B4] pointer-events-none" />
          <input
            className="w-full bg-[rgba(17,32,64,0.85)] border border-[rgba(46,127,255,0.18)] rounded-xl pl-8 pr-4 py-2.5 text-[11px] text-[#EEF3FA] focus:outline-none focus:border-[#2E7FFF] placeholder:text-[#4A6480] transition-colors"
            placeholder="Search by name or category…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="bg-[rgba(17,32,64,0.85)] border border-[rgba(46,127,255,0.2)] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[780px]">
              <thead>
                <tr className="border-b border-[rgba(46,127,255,0.12)]">
                  {['Vendor', 'Category', 'Sites', 'Contracts', 'Expiry', 'Risk Tier', 'Dep. Risk', ''].map(h => (
                    <th key={h} className="text-[9px] text-[#7A94B4] uppercase tracking-wide px-4 py-3 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-[#7A94B4] text-[11px]">
                      {search ? 'No vendors match your search.' : 'No vendors registered yet.'}
                    </td>
                  </tr>
                )}
                {filtered.map(v => {
                  const score = computeVendorScore(v);
                  const risk = classifyVendorRisk(score);
                  return (
                    <tr
                      key={v.id}
                      className="border-b border-[rgba(46,127,255,0.06)] hover:bg-white/[0.02] transition-colors cursor-pointer"
                      onClick={() => openEdit(v)}
                    >
                      <td className="px-4 py-3">
                        <div className="text-[#EEF3FA] font-semibold text-[11px]">{v.name}</div>
                        <div className="text-[9px] text-[#4A6480] font-mono mt-0.5">{v.id}</div>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-[#7A94B4] whitespace-nowrap">{v.category}</td>
                      <td className="px-4 py-3 text-[11px] text-[#7A94B4]">
                        {v.sites.length > 0 ? (
                          <span title={v.sites.join(', ')}>
                            {v.sites.slice(0, 2).join(', ')}{v.sites.length > 2 ? ` +${v.sites.length - 2}` : ''}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-[#7A94B4] text-center">{v.activeContracts}</td>
                      <td className="px-4 py-3 text-[11px] text-[#7A94B4] whitespace-nowrap">{v.contractExpiry}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${riskBg(risk)}`}>{risk}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${depRiskColor(v.dependencyRisk)}`}>{v.dependencyRisk}</span>
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => openEdit(v)}
                            className="flex items-center gap-1 text-[10px] text-[#7A94B4] hover:text-[#2E7FFF] border border-[rgba(46,127,255,0.2)] hover:border-[#2E7FFF]/40 bg-white/3 hover:bg-[#2E7FFF]/10 px-2 py-1.5 rounded-lg transition-all"
                          >
                            <Edit2 size={10} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(v)}
                            className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 border border-red-400/20 hover:border-red-400/50 bg-red-400/5 hover:bg-red-400/10 px-2 py-1.5 rounded-lg transition-all"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div className="px-4 py-2.5 border-t border-[rgba(46,127,255,0.08)]">
              <span className="text-[9px] text-[#4A6480]">{filtered.length} vendor{filtered.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {(modalMode === 'add' || modalMode === 'edit') && (
          <VendorModal
            key={modalMode === 'edit' ? editTarget?.id : 'new'}
            mode={modalMode}
            initial={editTarget ?? undefined}
            onClose={() => { setModalMode(null); setEditTarget(null); }}
            onSave={handleSave}
          />
        )}
        {deleteTarget && (
          <DeleteConfirm
            vendorName={deleteTarget.name}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
