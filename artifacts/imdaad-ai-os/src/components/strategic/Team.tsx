import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Mail, MapPin, Wrench, ClipboardList, UserPlus, X } from 'lucide-react';
import { useMemberProfiles } from '@/context/MemberProfilesContext';
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
  return name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

interface AddStaffForm {
  name: string;
  email: string;
  role: string;
  perspective: 'Strategic' | 'Operational';
  zones: string;
  skills: string;
}

const ROLE_OPTIONS = [
  { group: 'Strategic', roles: ['FM Manager', 'Account Manager'] },
  { group: 'Operational', roles: ['FM Engineer', 'Site Supervisor', 'Safety Officer', 'HVAC Specialist', 'Plumber', 'Electrician'] },
];

const EMPTY_FORM: AddStaffForm = {
  name: '',
  email: '',
  role: 'FM Engineer',
  perspective: 'Operational',
  zones: '',
  skills: '',
};

interface AddStaffModalProps {
  onClose: () => void;
  onToast: ToastFn;
}

function AddStaffModal({ onClose, onToast }: AddStaffModalProps) {
  const { addProfiles } = useMemberProfiles();
  const [form, setForm] = useState<AddStaffForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof AddStaffForm>(key: K, value: AddStaffForm[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      onToast('Name and email are required', 'error');
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
        zones: form.zones ? form.zones.split(',').map(z => z.trim()).filter(Boolean) : [],
        skills: form.skills.trim(),
        assignedClients: [],
        responsibilities: '',
        privileges: [],
        mobile: '',
        whatsapp: '',
        location: '',
        availability: '',
        shift: '',
        commChannels: [],
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

  const inputCls = 'w-full bg-[#0A1628] border border-[rgba(46,127,255,0.25)] rounded-lg px-3 py-2 text-[12px] text-[#EEF3FA] placeholder:text-[#4A6490] focus:outline-none focus:border-[#2E7FFF] transition-colors';
  const labelCls = 'block text-[10px] font-semibold text-[#7A94B4] uppercase tracking-wider mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18 }}
        className="relative w-full max-w-md bg-[#0D1E3A] border border-[rgba(46,127,255,0.25)] rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(46,127,255,0.15)]">
          <div>
            <h3 className="text-[#EEF3FA] font-bold text-[14px]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Add Staff Member
            </h3>
            <p className="text-[10px] text-[#7A94B4] mt-0.5">Fill in the details to add a new team member</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#7A94B4] hover:text-[#EEF3FA] hover:bg-white/5 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3.5">
          <div>
            <label className={labelCls}>Name *</label>
            <input
              className={inputCls}
              placeholder="Full name"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className={labelCls}>Email *</label>
            <input
              type="email"
              className={inputCls}
              placeholder="email@example.com"
              value={form.email}
              onChange={e => set('email', e.target.value)}
            />
          </div>

          <div>
            <label className={labelCls}>Role</label>
            <select
              className={inputCls}
              value={form.role}
              onChange={e => set('role', e.target.value)}
            >
              {ROLE_OPTIONS.map(({ group, roles }) => (
                <optgroup key={group} label={group}>
                  {roles.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Perspective</label>
            <select
              className={inputCls}
              value={form.perspective}
              onChange={e => set('perspective', e.target.value as 'Strategic' | 'Operational')}
            >
              <option value="Strategic">Strategic</option>
              <option value="Operational">Operational</option>
            </select>
          </div>

          <div>
            <label className={labelCls}>Zones <span className="normal-case text-[#4A6490] font-normal">(optional, comma-separated)</span></label>
            <input
              className={inputCls}
              placeholder="e.g. Zone A, Zone B"
              value={form.zones}
              onChange={e => set('zones', e.target.value)}
            />
          </div>

          <div>
            <label className={labelCls}>Skills <span className="normal-case text-[#4A6490] font-normal">(optional)</span></label>
            <input
              className={inputCls}
              placeholder="e.g. HVAC, Electrical, Plumbing"
              value={form.skills}
              onChange={e => set('skills', e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2.5 pt-1">
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
              {submitting ? 'Adding…' : 'Add Staff'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

interface Props {
  onToast: ToastFn;
}

export function Team({ onToast }: Props) {
  const { profiles } = useMemberProfiles();
  const [showModal, setShowModal] = useState(false);

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
          <AddStaffModal onClose={() => setShowModal(false)} onToast={onToast} />
        )}
      </AnimatePresence>
    </>
  );
}
