import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, Mail, MapPin, Wrench, ClipboardList } from 'lucide-react';
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

interface Props {
  onToast: ToastFn;
}

export function Team({ onToast }: Props) {
  const { profiles } = useMemberProfiles();

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
  );
}
