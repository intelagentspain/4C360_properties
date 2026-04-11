import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Mail, MapPin, Wrench, ClipboardList, UserPlus, X,
  MessageSquare, Building2, FileText, User, Shield,
} from 'lucide-react';
import { useMemberProfiles } from '@/context/MemberProfilesContext';
import { useClients } from '@/context/ClientsContext';
import { WhatsAppModal } from '@/components/shared/WhatsAppModal';
import type { ToastFn } from '@/lib/ui';

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

const ROLE_OPTIONS = [
  { group: 'Strategic', roles: ['FM Manager', 'Account Manager', 'Project Manager', 'Executive'] },
  { group: 'Operational', roles: ['FM Engineer', 'Site Supervisor', 'Safety Officer', 'HVAC Specialist', 'Plumber', 'Electrician'] },
];

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
  'FM Manager':      ['view_dashboard', 'view_work_orders', 'create_work_orders', 'approve_dispatch', 'view_reports', 'export_reports', 'manage_team', 'manage_assets', 'manage_ppm', 'view_ai_insights', 'configure_ai_rules'],
  'Account Manager': ['view_dashboard', 'view_work_orders', 'create_work_orders', 'view_reports', 'export_reports', 'manage_team', 'view_ai_insights'],
  'Project Manager': ['view_dashboard', 'view_work_orders', 'create_work_orders', 'view_reports', 'export_reports', 'manage_ppm', 'manage_vendors'],
  'Executive':       RBAC_PRIVILEGES.map(p => p.key),
  'FM Engineer':     ['view_dashboard', 'view_work_orders', 'create_work_orders', 'manage_assets'],
  'Site Supervisor': ['view_dashboard', 'view_work_orders', 'create_work_orders', 'approve_dispatch', 'manage_assets', 'manage_ppm'],
  'Safety Officer':  ['view_dashboard', 'view_work_orders', 'view_reports', 'manage_assets'],
  'HVAC Specialist': ['view_dashboard', 'view_work_orders', 'create_work_orders', 'manage_assets'],
  'Plumber':         ['view_dashboard', 'view_work_orders', 'create_work_orders'],
  'Electrician':     ['view_dashboard', 'view_work_orders', 'create_work_orders'],
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
  name: '',
  email: '',
  role: 'FM Engineer',
  perspective: 'Operational',
  assignedClients: [],
  zones: [],
  skills: '',
  responsibilities: '',
  privileges: ROLE_DEFAULT_PRIVILEGES['FM Engineer'] ?? [],
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
}

function AddStaffModal({ onClose, onToast, clientNames }: AddStaffModalProps) {
  const { addProfiles } = useMemberProfiles();
  const [form, setForm] = useState<AddStaffForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [whatsappTarget, setWhatsappTarget] = useState<{ recipientName: string; recipientPhone: string; defaultMessage: string } | null>(null);

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
    try {
      await addProfiles([{
        id: '',
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role.trim(),
        perspective: form.perspective,
        assignedClients: form.assignedClients,
        zones: form.zones,
        skills: form.skills.trim(),
        responsibilities: form.responsibilities.trim(),
        privileges: form.privileges,
        mobile: form.mobile.trim(),
        whatsapp: form.whatsapp.trim(),
        location: form.location.trim(),
        availability: form.availability,
        shift: form.shift,
        commChannels: form.commChannels,
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
                Add Staff Member
              </h3>
              <p className="text-[10px] text-[#7A94B4] mt-0.5">Fill in details to add a new team member</p>
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
                      placeholder="e.g. ahmed@imdaad.ae"
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
                      {ROLE_OPTIONS.map(({ group, roles }) => (
                        <optgroup key={group} label={group}>
                          {roles.map(r => (
                            <option key={r} value={r} className="bg-[#0A1628]">{r}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    {errors.role && <p className="mt-0.5 text-[10px] text-red-400">{errors.role}</p>}
                  </div>
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
                      {form.perspective === 'Strategic' ? 'KPIs, dispatch, AI rules, all clients' : form.perspective === 'Operational' ? 'Tasks, kanban, smart scan' : 'Service requests & tracking'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Assignment */}
              <div>
                <SectionHeader icon={<Building2 size={12} className="text-[#2E7FFF]" />} title="Assignment" />
                <div className="space-y-3">
                  <div>
                    <FieldLabel label="Assigned Clients" />
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {clientNames.map(name => (
                        <PillButton key={name} active={form.assignedClients.includes(name)} onClick={() => toggleClient(name)}>
                          {name}
                        </PillButton>
                      ))}
                    </div>
                    <p className="mt-1 text-[9px] text-[#4A6080]">Leave empty to grant access to all clients</p>
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

              {/* Skills & Responsibilities */}
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

              {/* Privileges */}
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
                            defaultMessage: `Hi ${form.name || 'there'}, welcome to Imdaad AI-OS! You have been added as ${form.role || 'a team member'}. Please check your email for login credentials.`,
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
                {submitting ? 'Adding…' : 'Add Staff Member'}
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

interface Props {
  onToast: ToastFn;
}

export function Team({ onToast }: Props) {
  const { profiles } = useMemberProfiles();
  const { clients } = useClients();
  const [showModal, setShowModal] = useState(false);

  const clientNames = useMemo(() => clients.map(c => c.name), [clients]);

  const teamMembers = useMemo(
    () => profiles.filter(p => p.perspective !== 'Client' && p.role.toLowerCase() !== 'client' && p.role.toLowerCase() !== 'vendor'),
    [profiles],
  );

  const byPerspective = useMemo(() => {
    const strategic   = teamMembers.filter(m => m.perspective === 'Strategic');
    const operational = teamMembers.filter(m => m.perspective === 'Operational');
    return { strategic, operational };
  }, [teamMembers]);

  return (
    <>
      <div className="h-full flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(46,127,255,0.15)] flex-shrink-0">
          <div>
            <h2 className="text-[#EEF3FA] font-bold text-base" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Team
            </h2>
            <p className="text-[11px] text-[#7A94B4]">
              Internal staff &amp; technicians · {teamMembers.length} members
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

        <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4">
          {teamMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Users size={32} className="text-[#7A94B4] opacity-30" />
              <span className="text-[13px] text-[#7A94B4] opacity-60">No team members found</span>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {teamMembers.map((member, idx) => {
                const avatarGradient = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                const badgeCls = PERSPECTIVE_BADGE[member.perspective] ?? 'bg-[#112040] text-[#7A94B4] border-[rgba(46,127,255,0.2)]';
                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: idx * 0.04 }}
                    className="flex flex-col rounded-xl border border-[rgba(46,127,255,0.2)] bg-[rgba(17,32,64,0.7)] overflow-hidden"
                  >
                    <div className="p-4 flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0 bg-gradient-to-br ${avatarGradient}`}
                      >
                        {getInitials(member.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] text-[#EEF3FA] font-bold leading-tight truncate">{member.name}</div>
                        <div className="text-[10px] text-[#7A94B4] mt-0.5 truncate">{member.role}</div>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-semibold ${badgeCls}`}>
                            {member.perspective}
                          </div>
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-semibold bg-emerald-500/10 border-emerald-500/25 text-emerald-400">
                            <span className="w-1 h-1 rounded-full bg-emerald-400 inline-block" />
                            Active
                          </div>
                        </div>
                      </div>
                    </div>

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

                    <div className="px-4 pb-4">
                      <button
                        onClick={() => onToast(`${member.name} — profile view coming soon`, 'info')}
                        className="w-full py-1.5 text-[10px] font-semibold rounded-lg border border-[rgba(46,127,255,0.25)] text-[#7A94B4] hover:text-[#EEF3FA] hover:bg-white/5 transition-colors"
                      >
                        View Profile
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <AddStaffModal
            onClose={() => setShowModal(false)}
            onToast={onToast}
            clientNames={clientNames}
          />
        )}
      </AnimatePresence>
    </>
  );
}
