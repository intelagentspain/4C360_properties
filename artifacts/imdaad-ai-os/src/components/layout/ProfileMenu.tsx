import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  KeyRound,
  LogOut,
  MonitorCog,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  Users,
  X,
} from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

const profileActions = [
  { label: 'Personal profile', sub: 'Name, photo, title and contact details', icon: UserRound },
  { label: 'Organisation', sub: 'DevelopmentX workspace and company details', icon: Building2 },
  { label: 'Team access', sub: 'Role, permissions and assigned sites', icon: Users },
  { label: 'Security', sub: 'Password, MFA and active sessions', icon: ShieldCheck },
  { label: 'Preferences', sub: 'Theme, language, timezone and notifications', icon: SlidersHorizontal },
];

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`relative flex h-6 w-11 shrink-0 items-center rounded-full border p-0.5 transition-colors ${
        checked ? 'border-emerald-400/45 bg-emerald-400/22' : 'border-slate-500/35 bg-slate-700/45'
      }`}
    >
      <span
        className={`h-5 w-5 rounded-full shadow-sm transition-transform ${
          checked ? 'translate-x-5 bg-white' : 'translate-x-0 bg-[#8BA1BD]'
        }`}
      />
    </button>
  );
}

export function ProfileMenu({ open, onClose }: Props) {
  const [available, setAvailable] = useState(true);
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [compactMode, setCompactMode] = useState(false);

  const handleSignOut = () => {
    sessionStorage.removeItem('4c360-auth-status');
    localStorage.removeItem('4c360-auth-status');
    const base = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
    window.location.assign(`${base}/login`);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <div className="fixed bottom-0 left-0 right-0 top-[52px] z-[200]" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className="absolute right-4 top-12 z-[310] w-[380px] overflow-hidden rounded-2xl border border-[rgba(46,127,255,0.3)] bg-[#0A1628] shadow-2xl"
          >
            <div className="border-b border-[rgba(46,127,255,0.16)] bg-[linear-gradient(135deg,rgba(46,127,255,0.16),rgba(225,29,46,0.07))] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#2E7FFF] via-[#0B1220] to-[#E11D2E] text-sm font-black text-white shadow-lg shadow-blue-950/30">
                    SK
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        Sarah Khan
                      </h3>
                      <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-300">
                        Active
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-[#B8C7DB]">Strategic Director · DevelopmentX</p>
                    <p className="mt-1 text-[10px] text-[#7A94B4]">sarah.khan@developmentx.ae</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#7A94B4] transition-colors hover:bg-white/5 hover:text-white"
                  aria-label="Close profile menu"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 border-b border-[rgba(46,127,255,0.12)] p-3">
              {[
                { label: 'Role', value: 'Management' },
                { label: 'Sites', value: '18' },
                { label: 'Modules', value: '9' },
              ].map(stat => (
                <div key={stat.label} className="min-w-0 rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#07111F] p-2.5">
                  <div className="truncate text-[8px] font-bold uppercase tracking-[0.1em] text-[#7A94B4]">{stat.label}</div>
                  <div className="mt-1 truncate text-[15px] font-black leading-5 text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{stat.value}</div>
                </div>
              ))}
            </div>

            <div className="max-h-[420px] overflow-y-auto p-3 custom-scrollbar">
              <div className="space-y-1">
                {profileActions.map(action => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.label}
                      className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-white/[0.045]"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[rgba(46,127,255,0.16)] bg-[#112040] text-[#7EB8F7]">
                        <Icon size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[12px] font-bold text-[#EEF3FA]">{action.label}</span>
                        <span className="block truncate text-[10px] text-[#7A94B4]">{action.sub}</span>
                      </span>
                      <ChevronRight size={15} className="text-[#4A6080] transition-colors group-hover:text-[#B8C7DB]" />
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#07111F] p-3">
                <div className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-[#B8C7DB]">
                  <MonitorCog size={14} />
                  Quick settings
                </div>
                {[
                  { label: 'Available for escalations', value: available, setter: setAvailable },
                  { label: 'Multi-factor authentication', value: mfaEnabled, setter: setMfaEnabled },
                  { label: 'Compact dashboard mode', value: compactMode, setter: setCompactMode },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between border-t border-white/5 py-2 first:border-t-0">
                    <span className="text-[12px] text-[#B8C7DB]">{row.label}</span>
                    <ToggleSwitch checked={row.value} onChange={() => row.setter(!row.value)} label={row.label} />
                  </div>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button className="flex items-center justify-center gap-2 rounded-xl border border-[rgba(46,127,255,0.22)] bg-[#112040] px-3 py-2.5 text-[11px] font-bold text-[#B8C7DB] transition-colors hover:text-white">
                  <KeyRound size={14} />
                  Change password
                </button>
                <button className="flex items-center justify-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-2.5 text-[11px] font-bold text-emerald-300">
                  <CheckCircle2 size={14} />
                  Account secure
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-[rgba(46,127,255,0.14)] px-4 py-3">
              <button className="text-[11px] font-bold text-[#2E7FFF] transition-colors hover:text-blue-300">
                Open full profile
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-2 text-[11px] font-bold text-red-300 transition-colors hover:text-red-200"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
