import { useState } from 'react';
import { Plus, X, Users } from 'lucide-react';
import type { ToastFn } from '@/lib/ui';

interface Props {
  onToast: ToastFn;
}

const ALL_PERMISSIONS = [
  'View Work Orders',
  'Manage Work Orders',
  'Dispatch Technicians',
  'View Reports',
  'Export Reports',
  'Manage Properties',
  'Manage Assets',
  'Manage Staff',
  'Configure Settings',
  'Override AI Dispatch',
];

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  staffCount: number;
}

const MOCK_ROLES: Role[] = [
  {
    id: 'ROLE-001',
    name: 'FM Engineer',
    description: 'Field maintenance engineer responsible for on-site work orders.',
    permissions: ['View Work Orders', 'Manage Work Orders'],
    staffCount: 34,
  },
  {
    id: 'ROLE-002',
    name: 'Account Manager',
    description: 'Client-facing role managing relationships and reporting.',
    permissions: ['View Work Orders', 'View Reports', 'Export Reports', 'Manage Properties'],
    staffCount: 8,
  },
  {
    id: 'ROLE-003',
    name: 'Supervisor',
    description: 'Oversees teams, approves dispatches, and manages escalations.',
    permissions: ['View Work Orders', 'Manage Work Orders', 'Dispatch Technicians', 'View Reports', 'Override AI Dispatch'],
    staffCount: 12,
  },
  {
    id: 'ROLE-004',
    name: 'Operations Manager',
    description: 'Full access to operations data and staff management.',
    permissions: ['View Work Orders', 'Manage Work Orders', 'Dispatch Technicians', 'View Reports', 'Export Reports', 'Manage Staff', 'Override AI Dispatch'],
    staffCount: 4,
  },
];

const EMPTY_FORM = { name: '', description: '', permissions: [] as string[] };

function ModalOverlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0D1E38] border border-[rgba(46,127,255,0.25)] rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
        {children}
      </div>
    </div>
  );
}

export function RolesSettings({ onToast }: Props) {
  const [roles, setRoles] = useState<Role[]>(MOCK_ROLES);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const togglePermission = (perm: string) => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(perm)
        ? f.permissions.filter(p => p !== perm)
        : [...f.permissions, perm],
    }));
  };

  const handleAdd = () => {
    if (!form.name.trim()) {
      onToast('Role name is required', 'error');
      return;
    }
    const newRole: Role = {
      id: `ROLE-${String(roles.length + 1).padStart(3, '0')}`,
      name: form.name.trim(),
      description: form.description.trim(),
      permissions: form.permissions,
      staffCount: 0,
    };
    setRoles(prev => [newRole, ...prev]);
    onToast('Role added successfully', 'success');
    setShowModal(false);
    setForm(EMPTY_FORM);
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar px-6 py-6">
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-[#EEF3FA] font-bold text-sm mb-0.5" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Roles</h3>
            <p className="text-[11px] text-[#7A94B4]">Define staff roles and their permission sets.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 text-[11px] bg-[#2E7FFF] text-white px-3 py-1.5 rounded-lg hover:bg-blue-500 transition-colors flex-shrink-0"
          >
            <Plus size={12} /> Add Role
          </button>
        </div>

        <div className="space-y-3">
          {roles.map(role => (
            <div
              key={role.id}
              className="bg-[rgba(17,32,64,0.85)] border border-[rgba(46,127,255,0.2)] rounded-xl p-4"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[#EEF3FA] font-bold text-[13px]">{role.name}</span>
                    <span className="text-[9px] text-[#7A94B4] font-mono bg-[#0A1628] px-1.5 py-0.5 rounded">{role.id}</span>
                  </div>
                  {role.description && (
                    <p className="text-[11px] text-[#7A94B4] mt-1 leading-snug">{role.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 text-[#7A94B4]">
                  <Users size={12} />
                  <span className="text-[11px] font-semibold">{role.staffCount}</span>
                  <span className="text-[10px]">staff</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {role.permissions.map(perm => (
                  <span
                    key={perm}
                    className="text-[9px] font-medium text-[#2E7FFF] bg-[#2E7FFF]/10 border border-[#2E7FFF]/25 px-2 py-0.5 rounded-full"
                  >
                    {perm}
                  </span>
                ))}
                {role.permissions.length === 0 && (
                  <span className="text-[10px] text-[#7A94B4] italic">No permissions assigned</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <ModalOverlay onClose={() => { setShowModal(false); setForm(EMPTY_FORM); }}>
          <button
            onClick={() => { setShowModal(false); setForm(EMPTY_FORM); }}
            className="absolute top-4 right-4 text-[#7A94B4] hover:text-[#EEF3FA] transition-colors"
          >
            <X size={16} />
          </button>
          <h4 className="text-[#EEF3FA] font-bold text-sm mb-5" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Add Role</h4>
          <div className="space-y-4">
            <div>
              <label className="text-[9px] text-[#7A94B4] uppercase tracking-wide block mb-1">Role Name</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Senior Technician"
                className="w-full px-3 py-2 text-[12px] bg-[#0A1628] border border-[rgba(46,127,255,0.2)] rounded-lg text-[#EEF3FA] placeholder-[#7A94B4]/50 outline-none focus:border-[rgba(46,127,255,0.5)] transition-colors"
              />
            </div>
            <div>
              <label className="text-[9px] text-[#7A94B4] uppercase tracking-wide block mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Brief description of this role…"
                rows={2}
                className="w-full px-3 py-2 text-[12px] bg-[#0A1628] border border-[rgba(46,127,255,0.2)] rounded-lg text-[#EEF3FA] placeholder-[#7A94B4]/50 outline-none focus:border-[rgba(46,127,255,0.5)] transition-colors resize-none"
              />
            </div>
            <div>
              <label className="text-[9px] text-[#7A94B4] uppercase tracking-wide block mb-2">Permissions</label>
              <div className="space-y-1.5">
                {ALL_PERMISSIONS.map(perm => (
                  <label
                    key={perm}
                    className="flex items-center gap-2.5 cursor-pointer group"
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                        form.permissions.includes(perm)
                          ? 'bg-[#2E7FFF] border-[#2E7FFF]'
                          : 'bg-transparent border-[rgba(46,127,255,0.3)] group-hover:border-[rgba(46,127,255,0.6)]'
                      }`}
                      onClick={() => togglePermission(perm)}
                    >
                      {form.permissions.includes(perm) && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`text-[11px] ${form.permissions.includes(perm) ? 'text-[#EEF3FA]' : 'text-[#7A94B4]'}`}
                      onClick={() => togglePermission(perm)}
                    >
                      {perm}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => { setShowModal(false); setForm(EMPTY_FORM); }}
              className="flex-1 text-[12px] font-medium text-[#7A94B4] border border-[rgba(46,127,255,0.2)] hover:border-[rgba(46,127,255,0.4)] bg-white/[0.03] hover:bg-white/[0.06] px-4 py-2.5 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              className="flex-1 text-[12px] font-bold text-white bg-[#2E7FFF] hover:bg-blue-500 px-4 py-2.5 rounded-xl transition-all"
            >
              Add Role
            </button>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
