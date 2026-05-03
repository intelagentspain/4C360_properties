import { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Mail, MapPin, Wrench, ClipboardList, UserPlus, X,
  MessageSquare, Building2, FileText, User, Shield, Search, Phone, Camera, Pencil,
  Star, AlertTriangle, Activity,
} from 'lucide-react';
import { useMemberProfiles } from '@/context/MemberProfilesContext';
import { useClients } from '@/context/ClientsContext';
import { WhatsAppModal } from '@/components/shared/WhatsAppModal';
import type { ToastFn } from '@/lib/ui';
import type { MockMemberProfile } from '@/data/mockData';
import {
  TechIntelligenceDetail, getTechIntel, scoreColor, riskBadgeCls, TrendIcon,
} from './TechIntelligenceDetail';

function resolvePhoto(photo: string | undefined): string | undefined {
  if (!photo) return undefined;
  if (photo.startsWith('data:') || photo.startsWith('http')) return photo;
  const base = (import.meta.env.BASE_URL ?? '/').replace(/\/+$/, '');
  if (photo.startsWith('/')) {
    const teamPathMatch = photo.match(/^\/(team\/.+)$/);
    return teamPathMatch ? `${base}/${teamPathMatch[1]}` : photo;
  }
  return `${base}/${photo}`;
}

const PERSPECTIVE_BADGE: Record<string, string> = {
  Strategic:   'bg-blue-500/15 text-blue-300 border-blue-500/30',
  Operational: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
};

const AVATAR_COLORS = [
  'from-blue-600 to-blue-800',
  'from-emerald-600 to-emerald-800',
  'from-purple-600 to-purple-800',
  'from-cyan-600 to-cyan-800',
  'from-amber-600 to-amber-800',
  'from-rose-600 to-rose-800',
];

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

type MemberPerspective = 'Strategic' | 'Operational' | 'Client';

interface AddStaffForm {
  photo: string;
  name: string;
  email: string;
  role: string;
  perspective: MemberPerspective;
  assignedClients: string[];
  zones: string[];
  skills: string;
  responsibilities: string;
  privileges: string[];
  mobile: string;
  whatsapp: string;
  location: string;
  availability: string;
  shift: string;
  commChannels: string[];
}

const ROLE_OPTIONS = ['End Client', 'Account Manager', 'Site Supervisor', 'FM Engineer', 'Project Manager', 'Safety Officer', 'Business', 'Executive', 'Other'];

const ZONE_OPTIONS = ['Cluster A', 'Cluster B', 'Block C', 'Recreation Area', 'Main Gate', 'Dubai Marina', 'Downtown', 'Dubai East', 'Jumeirah', 'Business Bay'];

const RBAC_PRIVILEGES = [
  { key: 'view_dashboard',     label: 'View Dashboard' },
  { key: 'view_work_orders',   label: 'View Work Orders' },
  { key: 'create_work_orders', label: 'Create Work Orders' },
  { key: 'approve_dispatch',   label: 'Approve Dispatches' },
  { key: 'view_reports',       label: 'View Reports' },
  { key: 'export_reports',     label: 'Export Reports' },
  { key: 'manage_team',        label: 'Manage Team' },
  { key: 'manage_assets',      label: 'Manage Assets' },
  { key: 'manage_ppm',         label: 'Manage PPM Schedule' },
  { key: 'view_ai_insights',   label: 'AI Insights' },
  { key: 'configure_ai_rules', label: 'Configure AI Rules' },
  { key: 'approve_invoices',   label: 'Approve Invoices' },
  { key: 'manage_vendors',     label: 'Manage Vendors' },
  { key: 'edit_client_profile', label: 'Edit Client Profile' },
];

const ROLE_DEFAULT_PRIVILEGES: Record<string, string[]> = {
  'End Client':      ['view_dashboard', 'view_reports', 'view_work_orders'],
  'Account Manager': ['view_dashboard', 'view_work_orders', 'create_work_orders', 'view_reports', 'export_reports', 'manage_team', 'view_ai_insights'],
  'Site Supervisor': ['view_dashboard', 'view_work_orders', 'create_work_orders', 'approve_dispatch', 'manage_assets', 'manage_ppm'],
  'FM Engineer':     ['view_dashboard', 'view_work_orders', 'create_work_orders', 'manage_assets'],
  'Project Manager': ['view_dashboard', 'view_work_orders', 'create_work_orders', 'view_reports', 'export_reports', 'manage_ppm', 'manage_vendors'],
  'Safety Officer':  ['view_dashboard', 'view_work_orders', 'view_reports', 'manage_assets'],
  'Business':        ['view_dashboard', 'view_work_orders', 'view_reports', 'export_reports', 'view_ai_insights'],
  'Executive':       RBAC_PRIVILEGES.map(p => p.key),
  'Other':           ['view_dashboard', 'view_work_orders'],
};

const AVAILABILITY_OPTS = ['Full-time', 'Part-time', 'On-call', 'Contractor', 'Freelance'];
const SHIFT_OPTS = ['Business Hours (08:00–17:00)', 'Morning (06:00–14:00)', 'Afternoon (14:00–22:00)', 'Night (22:00–06:00)', 'Rotating / Flexible'];
const COMM_CHANNELS = [
  { key: 'whatsapp', label: 'WhatsApp',       icon: '💬' },
  { key: 'email',    label: 'Email',           icon: '✉️' },
  { key: 'phone',    label: 'Phone Call',      icon: '📞' },
  { key: 'teams',    label: 'Microsoft Teams', icon: '🟦' },
  { key: 'sms',      label: 'SMS',             icon: '📱' },
  { key: 'radio',    label: 'Walkie-Talkie',   icon: '📻' },
];

const EMPTY_FORM: AddStaffForm = {
  photo: '',
  name: '',
  email: '',
  role: '',
  perspective: 'Operational',
  assignedClients: [],
  zones: [],
  skills: '',
  responsibilities: '',
  privileges: [],
  mobile: '',
  whatsapp: '',
  location: '',
  availability: '',
  shift: '',
  commChannels: [],
};

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <div className="w-5 h-5 rounded-md bg-[#2E7FFF]/15 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <span className="text-[10px] font-bold text-[#2E7FFF] uppercase tracking-widest">{title}</span>
      <div className="flex-1 h-px bg-[rgba(46,127,255,0.15)]" />
    </div>
  );
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <label className="block text-[10px] font-semibold text-[#7A94B4] uppercase tracking-wide mb-1">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

function PillButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-[10px] px-2 py-1 rounded-lg border transition-all font-medium ${
        active
          ? 'bg-[rgba(46,127,255,0.18)] border-[#2E7FFF] text-[#EEF3FA]'
          : 'border-[rgba(46,127,255,0.15)] text-[#7A94B4] hover:border-[rgba(46,127,255,0.35)] hover:text-[#EEF3FA]'
      }`}
    >
      {active && <span className="mr-1 text-[#2E7FFF]">✓</span>}
      {children}
    </button>
  );
}

interface AddStaffModalProps {
  onClose: () => void;
  onToast: ToastFn;
  clientNames: string[];
  editMember?: MockMemberProfile;
}

function AddStaffModal({ onClose, onToast, clientNames, editMember }: AddStaffModalProps) {
  const { addProfiles, updateProfile } = useMemberProfiles();
  const isEditMode = !!editMember;

  const initialForm: AddStaffForm = editMember ? {
    photo: editMember.photo ?? '',
    name: editMember.name,
    email: editMember.email,
    role: editMember.role,
    perspective: editMember.perspective as MemberPerspective,
    assignedClients: editMember.assignedClients,
    zones: editMember.zones,
    skills: editMember.skills ?? '',
    responsibilities: editMember.responsibilities ?? '',
    privileges: editMember.privileges ?? [],
    mobile: editMember.mobile ?? '',
    whatsapp: editMember.whatsapp ?? '',
    location: editMember.location ?? '',
    availability: editMember.availability ?? '',
    shift: editMember.shift ?? '',
    commChannels: editMember.commChannels ?? [],
  } : EMPTY_FORM;

  const [form, setForm] = useState<AddStaffForm>(initialForm);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [whatsappTarget, setWhatsappTarget] = useState<{ recipientName: string; recipientPhone: string; defaultMessage: string } | null>(null);
  const isClientRole = form.role === 'Client';

  const inputCls = (hasErr?: boolean) =>
    `w-full px-2.5 py-1.5 bg-[#0A1628] border rounded-lg text-[11px] text-[#EEF3FA] placeholder-[#4A6080] focus:outline-none transition-colors ${
      hasErr
        ? 'border-red-500/60 focus:border-red-500'
        : 'border-[rgba(46,127,255,0.22)] focus:border-[#2E7FFF]'
    }`;
  const selectCls = `w-full px-2.5 py-1.5 bg-[#0A1628] border border-[rgba(46,127,255,0.22)] rounded-lg text-[11px] text-[#EEF3FA] focus:outline-none focus:border-[#2E7FFF] transition-colors appearance-none cursor-pointer`;

  function setField<K extends keyof AddStaffForm>(key: K, value: AddStaffForm[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => { const e = { ...prev }; delete e[key]; return e; });
  }

  function toggleClient(name: string) {
    setForm(prev => ({
      ...prev,
      assignedClients: prev.assignedClients.includes(name)
        ? prev.assignedClients.filter(c => c !== name)
        : [...prev.assignedClients, name],
    }));
  }

  function toggleZone(zone: string) {
    setForm(prev => ({
      ...prev,
      zones: prev.zones.includes(zone)
        ? prev.zones.filter(z => z !== zone)
        : [...prev.zones, zone],
    }));
  }

  function togglePrivilege(key: string) {
    setForm(prev => ({
      ...prev,
      privileges: prev.privileges.includes(key)
        ? prev.privileges.filter(p => p !== key)
        : [...prev.privileges, key],
    }));
  }

  function toggleCommChannel(key: string) {
    setForm(prev => ({
      ...prev,
      commChannels: prev.commChannels.includes(key)
        ? prev.commChannels.filter(c => c !== key)
        : [...prev.commChannels, key],
    }));
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) setField('photo', dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function handleRoleChange(role: string) {
    const defaults = ROLE_DEFAULT_PRIVILEGES[role] ?? [];
    setForm(prev => ({ ...prev, role, privileges: defaults }));
    if (errors.role) setErrors(prev => { const e = { ...prev }; delete e.role; return e; });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    if (!form.role.trim()) errs.role = 'Role is required';
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);

    if (isEditMode && editMember) {
      updateProfile(editMember.id, {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role.trim(),
        perspective: form.perspective,
        assignedClients: form.assignedClients,
        zones: form.zones,
        skills: form.skills.trim(),
        responsibilities: form.responsibilities.trim(),
        privileges: form.privileges,
        mobile: form.mobile.trim() || undefined,
        whatsapp: form.whatsapp.trim() || undefined,
        location: form.location.trim() || undefined,
        availability: form.availability || undefined,
        shift: form.shift || undefined,
        commChannels: form.commChannels,
        ...(form.photo ? { photo: form.photo } : {}),
      });
      onToast(`${form.name.trim()} updated`, 'success');
      setSubmitting(false);
      onClose();
      return;
    }

    try {
      await addProfiles([{
        id: '',
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role.trim(),
        perspective: form.perspective,
        assignedClients: form.assignedClients,
        zones: form.zones,
        skills: form.skills.trim() ? form.skills.trim().split(',').map(s => s.trim()).filter(Boolean) : [],
        responsibilities: form.responsibilities.trim() ? form.responsibilities.trim().split(',').map(s => s.trim()).filter(Boolean) : [],
        privileges: form.privileges,
        mobile: form.mobile.trim(),
        whatsapp: form.whatsapp.trim(),
        location: form.location.trim(),
        availability: form.availability,
        shift: form.shift,
        commChannels: form.commChannels,
        ...(form.photo ? { photo: form.photo } : {}),
      }]);
      onToast(`${form.name.trim()} added to the team`, 'success');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('[409]')) {
        onToast('A team member with this email already exists', 'error');
      } else {
        onToast('Failed to add staff member', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.18 }}
          className="relative w-full max-w-xl bg-[#0D1E3A] border border-[rgba(46,127,255,0.25)] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          style={{ maxHeight: '90vh' }}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(46,127,255,0.15)] flex-shrink-0">
            <div>
              <h3 className="text-[#EEF3FA] font-bold text-[14px]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {isEditMode ? 'Edit Staff Member' : 'Add Staff Member'}
              </h3>
              <p className="text-[10px] text-[#7A94B4] mt-0.5">{isEditMode ? 'Update this team member\u2019s details' : 'Fill in details to add a new team member'}</p>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-[#7A94B4] hover:text-[#EEF3FA] hover:bg-white/5 transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="overflow-y-auto custom-scrollbar flex-1">
            <div className="px-5 py-4 space-y-5">

              {/* Identity */}
              <div>
                <SectionHeader icon={<User size={12} className="text-[#2E7FFF]" />} title="Identity" />

                {/* Photo upload */}
                <div className="flex justify-center mb-4">
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="relative w-20 h-20 rounded-full overflow-hidden bg-[#0A1628] border-2 border-dashed border-[rgba(46,127,255,0.35)] hover:border-[#2E7FFF] transition-colors group flex items-center justify-center flex-shrink-0"
                    title="Upload profile photo"
                  >
                    {form.photo ? (
                      <>
                        <img src={resolvePhoto(form.photo) ?? form.photo} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Camera size={16} className="text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-[#4A6080] group-hover:text-[#7A94B4] transition-colors">
                        <Camera size={18} />
                        <span className="text-[9px] font-medium leading-tight text-center">Add<br />Photo</span>
                      </div>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel label="Full Name" required />
                    <input
                      className={inputCls(!!errors.name)}
                      placeholder="e.g. Ahmed Al Rashid"
                      value={form.name}
                      onChange={e => setField('name', e.target.value)}
                      autoFocus
                    />
                    {errors.name && <p className="mt-0.5 text-[10px] text-red-400">{errors.name}</p>}
                  </div>
                  <div>
                    <FieldLabel label="Email Address" required />
                    <input
                      type="email"
                      className={inputCls(!!errors.email)}
                      placeholder="e.g. ahmed@developmentx.ae"
                      value={form.email}
                      onChange={e => setField('email', e.target.value)}
                    />
                    {errors.email && <p className="mt-0.5 text-[10px] text-red-400">{errors.email}</p>}
                  </div>
                  <div>
                    <FieldLabel label="Role" required />
                    <select
                      className={`${selectCls} ${errors.role ? 'border-red-500/60' : ''}`}
                      value={form.role}
                      onChange={e => handleRoleChange(e.target.value)}
                    >
                      <option value="" className="bg-[#0A1628]">Select role…</option>
                      {ROLE_OPTIONS.map(r => (
                        <option key={r} value={r} className="bg-[#0A1628]">{r}</option>
                      ))}
                    </select>
                    {errors.role && <p className="mt-0.5 text-[10px] text-red-400">{errors.role}</p>}
                  </div>
                  {!isClientRole && (
                  <div>
                    <FieldLabel label="Dashboard Perspective" />
                    <select
                      className={selectCls}
                      value={form.perspective}
                      onChange={e => setField('perspective', e.target.value as MemberPerspective)}
                    >
                      <option value="Strategic" className="bg-[#0A1628]">Strategic</option>
                      <option value="Operational" className="bg-[#0A1628]">Operational</option>
                      <option value="Client" className="bg-[#0A1628]">Client</option>
                    </select>
                    <p className="mt-0.5 text-[9px] text-[#4A6080]">
                      {form.perspective === 'Strategic' ? 'KPIs, dispatch, AI rules, all sites' : form.perspective === 'Operational' ? 'Tasks, kanban, smart scan' : 'Service requests & tracking'}
                    </p>
                  </div>
                  )}
                </div>
              </div>

              {/* Assignment */}
              {!isClientRole && (
              <div>
                <SectionHeader icon={<Building2 size={12} className="text-[#2E7FFF]" />} title="Assignment" />
                <div className="space-y-3">
                  <div>
                    <FieldLabel label="Assigned Sites" />
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {clientNames.map(name => (
                        <PillButton key={name} active={form.assignedClients.includes(name)} onClick={() => toggleClient(name)}>
                          {name}
                        </PillButton>
                      ))}
                    </div>
                    <p className="mt-1 text-[9px] text-[#4A6080]">Leave empty to grant access to all sites</p>
                  </div>
                  <div>
                    <FieldLabel label="Geographical Zones" />
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {ZONE_OPTIONS.map(z => (
                        <PillButton key={z} active={form.zones.includes(z)} onClick={() => toggleZone(z)}>
                          {z}
                        </PillButton>
                      ))}
                    </div>
                    <p className="mt-1 text-[9px] text-[#4A6080]">Dashboard map and dispatch panels will be pre-filtered to these zones</p>
                  </div>
                </div>
              </div>
              )}

              {/* Skills & Responsibilities */}
              {!isClientRole && (
              <div>
                <SectionHeader icon={<Wrench size={12} className="text-[#2E7FFF]" />} title="Skills & Responsibilities" />
                <div className="space-y-3">
                  <div>
                    <FieldLabel label="Skills / Specialisation" />
                    <input
                      className={inputCls()}
                      placeholder="e.g. HVAC, Electrical, PPM Management"
                      value={form.skills}
                      onChange={e => setField('skills', e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel label="Responsibilities" />
                    <textarea
                      value={form.responsibilities}
                      onChange={e => setField('responsibilities', e.target.value)}
                      placeholder="e.g. Manage all HVAC assets in Cluster A. Respond to critical incidents within 45 min."
                      rows={2}
                      className={`${inputCls()} resize-none`}
                    />
                    <p className="mt-0.5 text-[9px] text-[#4A6080]">These will appear on their personalized dashboard</p>
                  </div>
                </div>
              </div>
              )}

              {/* Privileges */}
              {!isClientRole && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <SectionHeader icon={<Shield size={12} className="text-[#2E7FFF]" />} title="Privileges" />
                  <div className="flex gap-2 -mt-2.5">
                    <button type="button" onClick={() => setField('privileges', RBAC_PRIVILEGES.map(p => p.key))} className="text-[9px] text-[#2E7FFF] hover:text-blue-300 transition-colors">
                      Select all
                    </button>
                    <span className="text-[#7A94B4] opacity-30">|</span>
                    <button type="button" onClick={() => setField('privileges', [])} className="text-[9px] text-[#7A94B4] hover:text-[#EEF3FA] transition-colors">
                      Clear
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {RBAC_PRIVILEGES.map(p => (
                    <PillButton key={p.key} active={form.privileges.includes(p.key)} onClick={() => togglePrivilege(p.key)}>
                      {p.label}
                    </PillButton>
                  ))}
                </div>
                {form.privileges.length > 0 && (
                  <p className="mt-1.5 text-[9px] text-[#7A94B4]">{form.privileges.length} privilege{form.privileges.length !== 1 ? 's' : ''} selected</p>
                )}
              </div>
              )}

              {/* Comm & Availability */}
              <div>
                <SectionHeader icon={<FileText size={12} className="text-[#2E7FFF]" />} title="Comm & Availability" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel label="Mobile Number" />
                    <input
                      className={inputCls()}
                      placeholder="+971 50 000 0000"
                      value={form.mobile}
                      onChange={e => setField('mobile', e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel label="WhatsApp Number" />
                    <div className="flex items-center gap-1.5">
                      <input
                        className={`${inputCls()} flex-1`}
                        placeholder="+971 50 000 0000"
                        value={form.whatsapp}
                        onChange={e => setField('whatsapp', e.target.value)}
                      />
                      <button
                        type="button"
                        title="Same as mobile"
                        onClick={() => setField('whatsapp', form.mobile)}
                        className="flex-shrink-0 text-[9px] px-1.5 py-1.5 rounded-lg border border-[rgba(46,127,255,0.2)] text-[#7A94B4] hover:text-[#EEF3FA] hover:border-[rgba(46,127,255,0.4)] transition-all whitespace-nowrap"
                      >
                        = Mobile
                      </button>
                      {form.whatsapp.trim() && (
                        <button
                          type="button"
                          title="Send WhatsApp"
                          onClick={() => setWhatsappTarget({
                            recipientName: form.name || 'New Staff Member',
                            recipientPhone: form.whatsapp.trim(),
                            defaultMessage: `Hi ${form.name || 'there'}, welcome to DevelopmentX AI-OS! You have been added as ${form.role || 'a team member'}. Please check your email for login credentials.`,
                          })}
                          className="flex-shrink-0 p-1.5 rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-all"
                        >
                          <MessageSquare size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <FieldLabel label="Base Location" />
                    <input
                      className={inputCls()}
                      placeholder="e.g. Silicon Oasis, Dubai"
                      value={form.location}
                      onChange={e => setField('location', e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel label="Availability" />
                    <select
                      className={selectCls}
                      value={form.availability}
                      onChange={e => setField('availability', e.target.value)}
                    >
                      <option value="" className="bg-[#0A1628]">Select…</option>
                      {AVAILABILITY_OPTS.map(o => <option key={o} value={o} className="bg-[#0A1628]">{o}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <FieldLabel label="Shift" />
                    <select
                      className={selectCls}
                      value={form.shift}
                      onChange={e => setField('shift', e.target.value)}
                    >
                      <option value="" className="bg-[#0A1628]">Select shift…</option>
                      {SHIFT_OPTS.map(o => <option key={o} value={o} className="bg-[#0A1628]">{o}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <FieldLabel label="Preferred Comm Channels" />
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {COMM_CHANNELS.map(ch => (
                        <button
                          key={ch.key}
                          type="button"
                          onClick={() => toggleCommChannel(ch.key)}
                          className={`flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-lg border transition-all font-medium ${
                            form.commChannels.includes(ch.key)
                              ? 'bg-[rgba(46,127,255,0.18)] border-[#2E7FFF] text-[#EEF3FA]'
                              : 'border-[rgba(46,127,255,0.15)] text-[#7A94B4] hover:border-[rgba(46,127,255,0.35)] hover:text-[#EEF3FA]'
                          }`}
                        >
                          <span>{ch.icon}</span>
                          {ch.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <div className="flex items-center gap-2.5 px-5 py-4 border-t border-[rgba(46,127,255,0.15)] flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 text-[11px] font-semibold rounded-lg border border-[rgba(46,127,255,0.25)] text-[#7A94B4] hover:text-[#EEF3FA] hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2 text-[11px] font-semibold rounded-lg bg-[#2E7FFF] text-white hover:bg-[#2270E8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (isEditMode ? 'Saving…' : 'Adding…') : (isEditMode ? 'Save Changes' : 'Add Staff Member')}
              </button>
            </div>
          </form>
        </motion.div>
      </div>

      <AnimatePresence>
        {whatsappTarget && (
          <WhatsAppModal
            recipientName={whatsappTarget.recipientName}
            recipientPhone={whatsappTarget.recipientPhone}
            defaultMessage={whatsappTarget.defaultMessage}
            onClose={() => setWhatsappTarget(null)}
            onSent={() => setWhatsappTarget(null)}
            onError={() => setWhatsappTarget(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[9px] font-bold text-[#4A6080] uppercase tracking-widest mb-2">{title}</div>
      {children}
    </div>
  );
}

interface ProfileDrawerProps {
  member: MockMemberProfile;
  onClose: () => void;
  onEdit: () => void;
}

function ProfileDrawer({ member, onClose, onEdit }: ProfileDrawerProps) {
  const [whatsappOpen, setWhatsappOpen] = useState(false);
  const avatarGradient = AVATAR_COLORS[member.id.charCodeAt(0) % AVATAR_COLORS.length];
  const badgeCls = PERSPECTIVE_BADGE[member.perspective] ?? 'bg-[#112040] text-[#7A94B4] border-[rgba(46,127,255,0.2)]';

  const grantedPrivileges = new Set(member.privileges ?? []);
  const grantedCount = RBAC_PRIVILEGES.filter(p => grantedPrivileges.has(p.key)).length;

  const skills = member.skills
    ? member.skills.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const pillCls = 'text-[10px] px-2 py-0.5 rounded-lg bg-[rgba(46,127,255,0.12)] border border-[rgba(46,127,255,0.25)] text-[#93B8FF]';

  const hasContact = !!(member.email || member.mobile || member.whatsapp || member.location);
  const hasSkills = skills.length > 0 || !!member.responsibilities;
  const hasAvailability = !!(member.availability || member.shift || (member.commChannels && member.commChannels.length > 0));

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="fixed right-0 top-0 h-full w-[400px] bg-[#0D1E3D] border-l border-[rgba(46,127,255,0.2)] z-50 flex flex-col overflow-hidden"
      >
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-[rgba(46,127,255,0.15)]">
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#7A94B4] hover:text-[#EEF3FA] hover:bg-white/5 transition-colors"
          >
            <X size={16} />
          </button>
          <span className="text-[11px] font-semibold text-[#7A94B4]">Staff Profile</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[rgba(46,127,255,0.12)] border border-[rgba(46,127,255,0.3)] text-[#2E7FFF] hover:bg-[rgba(46,127,255,0.22)] transition-colors text-[10px] font-semibold"
            >
              <Pencil size={11} />
              Edit
            </button>
            {(member.whatsapp || member.mobile) && (
              <button
                onClick={() => setWhatsappOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 transition-colors text-[10px] font-semibold"
              >
                <MessageSquare size={12} />
                WhatsApp
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <div className="flex items-start gap-4">
            <div className={`w-16 h-16 rounded-full flex-shrink-0 overflow-hidden bg-gradient-to-br ${avatarGradient} flex items-center justify-center`}>
              {resolvePhoto(member.photo) ? (
                <img src={resolvePhoto(member.photo)} alt={member.name} className="w-full h-full object-cover" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                <span className="text-white text-xl font-bold">{getInitials(member.name)}</span>
              )}
            </div>
            <div className="min-w-0 flex-1 pt-1">
              <div className="text-base font-bold text-[#EEF3FA] leading-tight">{member.name}</div>
              <div className="text-[12px] text-[#7A94B4] mt-0.5">{member.role}</div>
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <div className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[9px] font-semibold ${badgeCls}`}>
                  {member.perspective}
                </div>
                {member.isActive !== false ? (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-semibold bg-emerald-500/10 border-emerald-500/25 text-emerald-400">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 inline-block" />
                    Active
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-semibold bg-[rgba(100,100,120,0.15)] border-[rgba(100,100,120,0.3)] text-[#6B7A8D]">
                    <span className="w-1 h-1 rounded-full bg-[#6B7A8D] inline-block" />
                    Inactive
                  </div>
                )}
              </div>
            </div>
          </div>

          {hasContact && (
            <DrawerSection title="Contact">
              <div className="space-y-2">
                {member.email && (
                  <div className="flex items-center gap-2 text-[11px] text-[#7A94B4]">
                    <Mail size={13} className="flex-shrink-0 text-[#4A6490]" />
                    <span className="break-all">{member.email}</span>
                  </div>
                )}
                {member.mobile && (
                  <div className="flex items-center gap-2 text-[11px] text-[#7A94B4]">
                    <Phone size={13} className="flex-shrink-0 text-[#4A6490]" />
                    <span>{member.mobile}</span>
                  </div>
                )}
                {member.whatsapp && (
                  <div className="flex items-center gap-2 text-[11px] text-[#7A94B4]">
                    <MessageSquare size={13} className="flex-shrink-0 text-[#4A6490]" />
                    <span>{member.whatsapp}</span>
                    <span className="text-[9px] text-emerald-400 font-semibold">(WhatsApp)</span>
                  </div>
                )}
                {member.location && (
                  <div className="flex items-center gap-2 text-[11px] text-[#7A94B4]">
                    <MapPin size={13} className="flex-shrink-0 text-[#4A6490]" />
                    <span>{member.location}</span>
                  </div>
                )}
              </div>
            </DrawerSection>
          )}

          <DrawerSection title="Assignment">
            <div className="space-y-2">
              <div>
                <span className="text-[10px] text-[#4A6080] mr-2">Clients:</span>
                {member.assignedClients.length > 0 ? (
                  <div className="inline-flex flex-wrap gap-1">
                    {member.assignedClients.map(c => (
                      <span key={c} className={pillCls}>{c}</span>
                    ))}
                  </div>
                ) : (
                  <span className="text-[10px] text-[#4A6080] italic">All sites</span>
                )}
              </div>
              <div>
                <span className="text-[10px] text-[#4A6080] mr-2">Zones:</span>
                {member.zones.length > 0 ? (
                  <div className="inline-flex flex-wrap gap-1">
                    {member.zones.map(z => (
                      <span key={z} className={pillCls}>{z}</span>
                    ))}
                  </div>
                ) : (
                  <span className="text-[10px] text-[#4A6080] italic">No zone restriction</span>
                )}
              </div>
            </div>
          </DrawerSection>

          {hasSkills && (
            <DrawerSection title="Skills & Responsibilities">
              <div className="space-y-2">
                {skills.length > 0 && (
                  <div>
                    <span className="text-[10px] text-[#4A6080] block mb-1">Skills:</span>
                    <div className="flex flex-wrap gap-1">
                      {skills.map(s => (
                        <span key={s} className={pillCls}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {member.responsibilities && (
                  <div>
                    <span className="text-[10px] text-[#4A6080] block mb-1">Responsibilities:</span>
                    <p className="text-[11px] text-[#7A94B4] leading-relaxed">{member.responsibilities}</p>
                  </div>
                )}
              </div>
            </DrawerSection>
          )}

          {hasAvailability && (
            <DrawerSection title="Availability">
              <div className="space-y-2">
                {member.availability && (
                  <div className="text-[11px] text-[#7A94B4]">
                    <span className="text-[10px] text-[#4A6080]">Availability: </span>
                    {member.availability}
                  </div>
                )}
                {member.shift && (
                  <div className="text-[11px] text-[#7A94B4]">
                    <span className="text-[10px] text-[#4A6080]">Shift: </span>
                    {member.shift}
                  </div>
                )}
                {member.commChannels && member.commChannels.length > 0 && (
                  <div>
                    <span className="text-[10px] text-[#4A6080] block mb-1">Channels:</span>
                    <div className="flex flex-wrap gap-1">
                      {member.commChannels.map(ch => {
                        const channelObj = COMM_CHANNELS.find(c => c.key === ch);
                        return (
                          <span key={ch} className={pillCls}>
                            {channelObj ? `${channelObj.icon} ${channelObj.label}` : ch}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </DrawerSection>
          )}

          <DrawerSection title={`Access Privileges  (${grantedCount} granted)`}>
            <div className="flex flex-wrap gap-1.5">
              {RBAC_PRIVILEGES.map(p => {
                const granted = grantedPrivileges.has(p.key);
                return (
                  <span
                    key={p.key}
                    className={`text-[10px] px-2 py-0.5 rounded-lg border ${
                      granted
                        ? 'bg-[rgba(46,127,255,0.15)] border-[rgba(46,127,255,0.4)] text-[#93B8FF]'
                        : 'border-[rgba(46,127,255,0.1)] text-[#3A5070]'
                    }`}
                  >
                    {p.label}
                  </span>
                );
              })}
            </div>
          </DrawerSection>
        </div>
      </motion.div>

      <AnimatePresence>
        {whatsappOpen && (
          <WhatsAppModal
            recipientName={member.name}
            recipientPhone={member.whatsapp || member.mobile || ''}
            defaultMessage={`Hi ${member.name}, `}
            onClose={() => setWhatsappOpen(false)}
            onSent={() => setWhatsappOpen(false)}
            onError={() => setWhatsappOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

interface Props {
  onToast: ToastFn;
}

const PERSPECTIVE_FILTER_OPTS = ['All', 'Strategic', 'Operational'] as const;

export function Team({ onToast }: Props) {
  const { profiles, updateProfile } = useMemberProfiles();
  const { clients } = useClients();
  const [showModal, setShowModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MockMemberProfile | null>(null);
  const [editingMember, setEditingMember] = useState<MockMemberProfile | null>(null);
  const [selectedTechId, setSelectedTechId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterPerspective, setFilterPerspective] = useState('All');
  const [filterRole, setFilterRole] = useState('');
  const [filterZone, setFilterZone] = useState('');
  const [filterAvailability, setFilterAvailability] = useState('');
  const [filterClient, setFilterClient] = useState('');

  const clientNames = useMemo(() => clients.map(c => c.name), [clients]);

  const teamMembers = useMemo(
    () => profiles.filter(p => p.perspective !== 'Client' && p.role.toLowerCase() !== 'end client' && p.role.toLowerCase() !== 'vendor'),
    [profiles],
  );

  const byPerspective = useMemo(() => {
    const strategic   = teamMembers.filter(m => m.perspective === 'Strategic');
    const operational = teamMembers.filter(m => m.perspective === 'Operational');
    return { strategic, operational };
  }, [teamMembers]);

  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return teamMembers.filter(m => {
      if (q && !m.name.toLowerCase().includes(q) && !m.email.toLowerCase().includes(q)) return false;
      if (filterPerspective !== 'All' && m.perspective !== filterPerspective) return false;
      if (filterRole && m.role !== filterRole) return false;
      if (filterZone && !m.zones.includes(filterZone)) return false;
      if (filterAvailability && m.availability !== filterAvailability) return false;
      if (filterClient && !m.assignedClients.includes(filterClient)) return false;
      return true;
    });
  }, [teamMembers, searchQuery, filterPerspective, filterRole, filterZone, filterAvailability, filterClient]);

  const isFiltered = searchQuery.trim() !== '' || filterPerspective !== 'All' || filterRole !== '' || filterZone !== '' || filterAvailability !== '' || filterClient !== '';

  function clearAllFilters() {
    setSearchQuery('');
    setFilterPerspective('All');
    setFilterRole('');
    setFilterZone('');
    setFilterAvailability('');
    setFilterClient('');
  }

  const selectCls = `px-2.5 py-1.5 bg-[#0A1628] border border-[rgba(46,127,255,0.22)] rounded-lg text-[11px] text-[#EEF3FA] focus:outline-none focus:border-[#2E7FFF] transition-colors appearance-none cursor-pointer`;

  const selectedTechMember = useMemo(
    () => selectedTechId ? (profiles.find(p => p.id === selectedTechId) ?? null) : null,
    [selectedTechId, profiles],
  );
  const selectedTechIntel = useMemo(
    () => selectedTechMember ? getTechIntel(selectedTechMember.name) : null,
    [selectedTechMember],
  );

  const operationalMembers = useMemo(
    () => filteredMembers.filter(m => m.perspective === 'Operational'),
    [filteredMembers],
  );
  const topPerformers = useMemo(
    () => operationalMembers.filter(m => (getTechIntel(m.name)?.performanceScore ?? 0) >= 85)
      .sort((a, b) => (getTechIntel(b.name)?.performanceScore ?? 0) - (getTechIntel(a.name)?.performanceScore ?? 0)),
    [operationalMembers],
  );
  const atRiskMembers = useMemo(
    () => operationalMembers.filter(m => (getTechIntel(m.name)?.performanceScore ?? 100) < 65)
      .sort((a, b) => (getTechIntel(a.name)?.performanceScore ?? 100) - (getTechIntel(b.name)?.performanceScore ?? 100)),
    [operationalMembers],
  );

  if (selectedTechId && selectedTechMember && selectedTechIntel) {
    return (
      <>
        <div className="h-full flex flex-col overflow-hidden">
          <TechIntelligenceDetail
            member={selectedTechMember}
            intel={selectedTechIntel}
            onBack={() => setSelectedTechId(null)}
            onEditProfile={() => {
              const m = profiles.find(p => p.id === selectedTechMember.id) ?? selectedTechMember;
              setSelectedTechId(null);
              setSelectedMember(m);
            }}
            onToast={onToast}
          />
        </div>
        <AnimatePresence>
          {(showModal || editingMember) && (
            <AddStaffModal
              onClose={() => { setShowModal(false); setEditingMember(null); }}
              onToast={onToast}
              clientNames={clientNames}
              editMember={editingMember ?? undefined}
            />
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <>
      <div className="h-full flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(46,127,255,0.15)] flex-shrink-0">
          <div>
            <h2 className="text-[#EEF3FA] font-bold text-base" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Inspector Intelligence &amp; Performance Control
            </h2>
            <p className="text-[11px] text-[#7A94B4]">
              Internal staff &amp; inspectors · {teamMembers.length} members
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-semibold bg-blue-500/10 border-blue-500/30 text-blue-400">
              <span className="text-[13px] font-bold">{byPerspective.strategic.length}</span>
              <span>Strategic</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-semibold bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
              <span className="text-[13px] font-bold">{byPerspective.operational.length}</span>
              <span>Operational</span>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 bg-[#2E7FFF] text-white hover:bg-[#2270E8] rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors"
            >
              <UserPlus size={13} />
              Add Staff
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-[rgba(46,127,255,0.1)] flex-shrink-0 flex-wrap">
          <div className="relative flex-1 min-w-[160px]">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#4A6080]" />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-2.5 py-1.5 bg-[#0A1628] border border-[rgba(46,127,255,0.22)] rounded-lg text-[11px] text-[#EEF3FA] placeholder-[#4A6080] focus:outline-none focus:border-[#2E7FFF] transition-colors"
            />
          </div>
          <select
            value={filterPerspective}
            onChange={e => setFilterPerspective(e.target.value)}
            className={selectCls}
          >
            {PERSPECTIVE_FILTER_OPTS.map(p => (
              <option key={p} value={p} className="bg-[#0A1628]">{p === 'All' ? 'All Perspectives' : p}</option>
            ))}
          </select>
          <select
            value={filterRole}
            onChange={e => setFilterRole(e.target.value)}
            className={selectCls}
          >
            <option value="" className="bg-[#0A1628]">All Roles</option>
            {ROLE_OPTIONS.map(r => (
              <option key={r} value={r} className="bg-[#0A1628]">{r}</option>
            ))}
          </select>
          <select
            value={filterZone}
            onChange={e => setFilterZone(e.target.value)}
            className={selectCls}
          >
            <option value="" className="bg-[#0A1628]">All Zones</option>
            {ZONE_OPTIONS.map(z => (
              <option key={z} value={z} className="bg-[#0A1628]">{z}</option>
            ))}
          </select>
          <select
            value={filterAvailability}
            onChange={e => setFilterAvailability(e.target.value)}
            className={selectCls}
          >
            <option value="" className="bg-[#0A1628]">All Availability</option>
            {AVAILABILITY_OPTS.map(a => (
              <option key={a} value={a} className="bg-[#0A1628]">{a}</option>
            ))}
          </select>
          <select
            value={filterClient}
            onChange={e => setFilterClient(e.target.value)}
            className={selectCls}
          >
            <option value="" className="bg-[#0A1628]">All Sites</option>
            {clientNames.map(name => (
              <option key={name} value={name} className="bg-[#0A1628]">{name}</option>
            ))}
          </select>
          {isFiltered && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 text-[10px] font-semibold text-[#7A94B4] hover:text-[#EEF3FA] px-2.5 py-1.5 rounded-lg border border-[rgba(46,127,255,0.15)] hover:border-[rgba(46,127,255,0.35)] transition-colors flex-shrink-0"
            >
              <X size={10} />
              Clear all
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4">
          {filteredMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Users size={32} className="text-[#7A94B4] opacity-30" />
              <span className="text-[13px] text-[#7A94B4] opacity-60">
                {isFiltered ? 'No members match the active filters' : 'No team members found'}
              </span>
              {isFiltered && (
                <button
                  onClick={clearAllFilters}
                  className="text-[11px] text-[#2E7FFF] hover:text-blue-300 transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {topPerformers.length > 0 && (filterPerspective === 'All' || filterPerspective === 'Operational') && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Star size={12} className="text-emerald-400" />
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Top Performers</span>
                    <div className="flex-1 h-px bg-emerald-500/15" />
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {topPerformers.map(m => {
                      const intel = getTechIntel(m.name);
                      if (!intel) return null;
                      const sc = scoreColor(intel.performanceScore);
                      return (
                        <button
                          key={m.id}
                          onClick={() => setSelectedTechId(m.id)}
                          className="flex-shrink-0 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-emerald-500/8 border border-emerald-500/25 hover:border-emerald-500/50 hover:bg-emerald-500/12 transition-all"
                        >
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-[9px] font-bold">{getInitials(m.name)}</span>
                          </div>
                          <div className="text-left">
                            <div className="text-[11px] font-bold text-[#EEF3FA]">{m.name}</div>
                            <div className="text-[9px] text-emerald-400">{intel.primaryConcern}</div>
                          </div>
                          <div className="ml-2 text-center">
                            <div className="text-[15px] font-extrabold" style={{ color: sc, fontFamily: 'Space Grotesk, sans-serif' }}>{intel.performanceScore}</div>
                            <TrendIcon trend={intel.trend} size={10} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {atRiskMembers.length > 0 && (filterPerspective === 'All' || filterPerspective === 'Operational') && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={12} className="text-red-400" />
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">At-Risk Inspectors</span>
                    <div className="flex-1 h-px bg-red-500/15" />
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {atRiskMembers.map(m => {
                      const intel = getTechIntel(m.name);
                      if (!intel) return null;
                      const sc = scoreColor(intel.performanceScore);
                      return (
                        <button
                          key={m.id}
                          onClick={() => setSelectedTechId(m.id)}
                          className="flex-shrink-0 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-red-500/8 border border-red-500/25 hover:border-red-500/50 hover:bg-red-500/12 transition-all"
                        >
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-[9px] font-bold">{getInitials(m.name)}</span>
                          </div>
                          <div className="text-left">
                            <div className="text-[11px] font-bold text-[#EEF3FA]">{m.name}</div>
                            <div className="text-[9px] text-red-400 font-semibold">{intel.primaryConcern}</div>
                          </div>
                          <div className="ml-2 text-center">
                            <div className="text-[15px] font-extrabold" style={{ color: sc, fontFamily: 'Space Grotesk, sans-serif' }}>{intel.performanceScore}</div>
                            <TrendIcon trend={intel.trend} size={10} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                {filteredMembers.map((member, idx) => {
                  const avatarGradient = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                  const badgeCls = PERSPECTIVE_BADGE[member.perspective] ?? 'bg-[#112040] text-[#7A94B4] border-[rgba(46,127,255,0.2)]';
                  const isActive = member.isActive !== false;
                  const photoSrc = resolvePhoto(member.photo);
                  const intel = member.perspective === 'Operational' ? getTechIntel(member.name) : null;

                  return (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18, delay: idx * 0.04 }}
                      onClick={() => { if (intel) setSelectedTechId(member.id); }}
                      className={`flex flex-col rounded-xl border overflow-hidden transition-all ${
                        isActive
                          ? 'border-[rgba(46,127,255,0.2)] bg-[rgba(17,32,64,0.7)]'
                          : 'border-[rgba(100,100,120,0.2)] bg-[rgba(17,20,32,0.6)] opacity-70'
                      } ${intel ? 'cursor-pointer hover:border-[rgba(46,127,255,0.45)] hover:bg-[rgba(17,32,64,0.9)]' : ''}`}
                    >
                      <div className="p-4 flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full flex-shrink-0 overflow-hidden bg-gradient-to-br ${avatarGradient} flex items-center justify-center`}>
                          {photoSrc ? (
                            <img src={photoSrc} alt={member.name} className="w-full h-full object-cover" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                          ) : (
                            <span className="text-white text-[13px] font-bold">{getInitials(member.name)}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] text-[#EEF3FA] font-bold leading-tight truncate">{member.name}</div>
                          <div className="text-[10px] text-[#7A94B4] mt-0.5 truncate">{member.role}</div>
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-semibold ${badgeCls}`}>
                              {member.perspective}
                            </div>
                            {isActive ? (
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-semibold bg-emerald-500/10 border-emerald-500/25 text-emerald-400">
                                <span className="w-1 h-1 rounded-full bg-emerald-400 inline-block" />
                                Active
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-semibold bg-[rgba(100,100,120,0.15)] border-[rgba(100,100,120,0.3)] text-[#6B7A8D]">
                                <span className="w-1 h-1 rounded-full bg-[#6B7A8D] inline-block" />
                                Inactive
                              </div>
                            )}
                            {intel && (
                              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-semibold ${riskBadgeCls(intel.riskLevel)}`}>
                                {intel.riskLevel === 'High Performer' && <Star size={8} />}
                                {intel.riskLevel === 'At Risk' && <AlertTriangle size={8} />}
                                {intel.riskLevel}
                              </div>
                            )}
                          </div>
                        </div>
                        {intel && (
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <div className="flex items-center gap-1">
                              <span className="text-[16px] font-extrabold" style={{ color: scoreColor(intel.performanceScore), fontFamily: 'Space Grotesk, sans-serif' }}>
                                {intel.performanceScore}
                              </span>
                              <TrendIcon trend={intel.trend} size={12} />
                            </div>
                            <span className="text-[8px] text-[#4A6080] uppercase tracking-wide">Score</span>
                          </div>
                        )}
                      </div>

                      {intel && (
                        <div className="px-4 pb-2">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex-1 h-1 rounded-full bg-[rgba(46,127,255,0.1)]">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${intel.performanceScore}%`, backgroundColor: scoreColor(intel.performanceScore) }}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-1 text-center">
                            <div>
                              <div className="text-[10px] font-bold text-[#EEF3FA]">{intel.slaCompliance}%</div>
                              <div className="text-[8px] text-[#4A6080]">SLA</div>
                            </div>
                            <div>
                              <div className="text-[10px] font-bold text-[#EEF3FA]">{intel.firstTimeFixRate}%</div>
                              <div className="text-[8px] text-[#4A6080]">First-Fix</div>
                            </div>
                            <div>
                              <div className="flex items-center justify-center gap-0.5">
                                <Activity size={9} className="text-[#4A6080]" />
                                <span className="text-[10px] font-bold text-[#EEF3FA]">{intel.workload.active}/{intel.workload.max}</span>
                              </div>
                              <div className="text-[8px] text-[#4A6080]">Load</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {!intel && (
                        <div className="px-4 pb-3 space-y-1.5">
                          {member.email && (
                            <div className="flex items-center gap-2 text-[10px] text-[#7A94B4]">
                              <Mail size={11} className="flex-shrink-0 text-[#4A6490]" />
                              <span className="truncate">{member.email}</span>
                            </div>
                          )}
                          {member.zones.length > 0 && (
                            <div className="flex items-start gap-2 text-[10px] text-[#7A94B4]">
                              <MapPin size={11} className="flex-shrink-0 mt-0.5 text-[#4A6490]" />
                              <span className="line-clamp-1">{member.zones.join(', ')}</span>
                            </div>
                          )}
                          {member.skills && (
                            <div className="flex items-start gap-2 text-[10px] text-[#7A94B4]">
                              <Wrench size={11} className="flex-shrink-0 mt-0.5 text-[#4A6490]" />
                              <span className="line-clamp-1">{member.skills}</span>
                            </div>
                          )}
                          {member.assignedClients.length > 0 && (
                            <div className="flex items-start gap-2 text-[10px] text-[#7A94B4]">
                              <ClipboardList size={11} className="flex-shrink-0 mt-0.5 text-[#4A6490]" />
                              <span className="line-clamp-1">{member.assignedClients.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="px-4 pb-4 flex items-center gap-2 mt-auto">
                        {intel ? (
                          <button
                            onClick={e => { e.stopPropagation(); setSelectedTechId(member.id); }}
                            className="flex-1 py-1.5 text-[10px] font-semibold rounded-lg bg-[rgba(46,127,255,0.12)] border border-[#2E7FFF]/40 text-[#2E7FFF] hover:bg-[rgba(46,127,255,0.22)] transition-colors"
                          >
                            View Intelligence
                          </button>
                        ) : (
                          <button
                            onClick={e => { e.stopPropagation(); setSelectedMember(member); }}
                            className="flex-1 py-1.5 text-[10px] font-semibold rounded-lg border border-[rgba(46,127,255,0.35)] text-[#2E7FFF] hover:bg-[rgba(46,127,255,0.12)] transition-colors"
                          >
                            View
                          </button>
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); setEditingMember(profiles.find(p => p.id === member.id) ?? member); }}
                          className="flex-1 py-1.5 text-[10px] font-semibold rounded-lg border border-[rgba(46,127,255,0.35)] text-[#2E7FFF] hover:bg-[rgba(46,127,255,0.12)] transition-colors flex items-center justify-center gap-1"
                        >
                          <Pencil size={10} />
                          Edit
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); updateProfile(member.id, { isActive: !isActive }); }}
                          title={isActive ? 'Mark as Inactive' : 'Mark as Active'}
                          className="flex items-center gap-1.5 flex-shrink-0"
                          aria-label={isActive ? 'Deactivate' : 'Activate'}
                        >
                          <div className={`relative w-7 h-4 rounded-full transition-colors ${isActive ? 'bg-emerald-500/60' : 'bg-[rgba(100,100,120,0.35)]'}`}>
                            <span className={`absolute top-0.5 w-3 h-3 rounded-full shadow transition-all ${isActive ? 'left-3.5 bg-emerald-300' : 'left-0.5 bg-[#6B7A8D]'}`} />
                          </div>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {(showModal || editingMember) && (
          <AddStaffModal
            onClose={() => { setShowModal(false); setEditingMember(null); }}
            onToast={onToast}
            clientNames={clientNames}
            editMember={editingMember ?? undefined}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedMember && (
          <ProfileDrawer
            member={selectedMember}
            onClose={() => setSelectedMember(null)}
            onEdit={() => {
              const m = profiles.find(p => p.id === selectedMember.id) ?? selectedMember;
              setSelectedMember(null);
              setEditingMember(m);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
