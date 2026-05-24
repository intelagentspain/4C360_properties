import { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bot, Star, CheckCircle, Briefcase, MapPin, Layers, Tag } from 'lucide-react';
import { mockTechnicians } from '@/data/mockData';
import { useMemberProfiles } from '@/context/MemberProfilesContext';
import { TechAvatar } from '@/components/shared/TechAvatar';
import { scoreColor } from '@/lib/ui';
import { AnimatedBar } from '@/components/shared/AnimatedBar';

interface WorkOrderContext {
  id: string;
  title: string;
  skill: string;
  location: string;
  zone?: string;
}

interface ScoredTech {
  id: string;
  name: string;
  initials: string;
  role: string;
  primarySkill: string;
  skillsSummary: string;
  zones: string[];
  zoneDisplay: string;
  availability: string;
  activeTasks: number;
  score: number;
  reasoning: string;
  rating: number;
}

interface Props {
  open: boolean;
  workOrder: WorkOrderContext | null;
  onConfirm: (techName: string) => void;
  onCancel: () => void;
  demoActionRequest?: { actionId: string; nonce: number } | null;
}

const SKILL_KEYWORDS: Record<string, string[]> = {
  HVAC:        ['hvac', 'refrigerant', 'chiller', 'cooling', 'air conditioning'],
  Electrical:  ['electrical', 'electric', 'wiring', 'power'],
  Plumbing:    ['plumbing', 'pipe', 'water', 'drain', 'leak'],
  General:     ['general', 'maintenance', 'permit', 'safety', 'site'],
  Safety:      ['safety', 'permit', 'emergency', 'fire'],
  Lift:        ['lift', 'elevator', 'general'],
};

function getInitials(name: string): string {
  const parts = name.split(/[\s.]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function toAvailability(status: string): string {
  if (status === 'active') return 'active';
  if (status === 'transit') return 'transit';
  if (status === 'overdue') return 'overdue';
  return 'available';
}

function buildReasoning(tech: ScoredTech, workOrder: WorkOrderContext): string {
  const parts: string[] = [];
  const skillLower = tech.skillsSummary.toLowerCase();
  const keywords = SKILL_KEYWORDS[workOrder.skill] ?? [workOrder.skill.toLowerCase()];
  const skillMatch = keywords.some(k => skillLower.includes(k));

  if (skillMatch) parts.push(`${workOrder.skill} certified`);
  else if (tech.primarySkill !== 'General') parts.push(`${tech.primarySkill} specialist`);

  const zoneMatch = tech.zones.some(z =>
    workOrder.location.toLowerCase().includes(z.toLowerCase()) ||
    (workOrder.zone ?? '').toLowerCase().includes(z.toLowerCase())
  );
  if (zoneMatch) parts.push('zone matched');

  if (tech.availability === 'available') parts.push('currently idle');
  else if (tech.availability === 'transit') parts.push('en route, finishing soon');
  else if (tech.availability === 'active') parts.push('on active job');

  if (tech.activeTasks === 0) parts.push('no active tasks');
  else parts.push(`${tech.activeTasks} active task${tech.activeTasks > 1 ? 's' : ''}`);

  if (tech.rating >= 4.8) parts.push(`${tech.rating}★ SLA record`);

  return parts.slice(0, 4).join(' · ') || 'General maintenance technician';
}

function scoreCandidate(tech: ScoredTech, workOrder: WorkOrderContext): number {
  let score = 0;
  const skillLower = tech.skillsSummary.toLowerCase();
  const keywords = SKILL_KEYWORDS[workOrder.skill] ?? [workOrder.skill.toLowerCase()];

  if (keywords.some(k => skillLower.includes(k))) score += 40;
  else if (skillLower.includes('general')) score += 10;

  const zoneMatch = tech.zones.some(z =>
    workOrder.location.toLowerCase().includes(z.toLowerCase()) ||
    (workOrder.zone ?? '').toLowerCase().includes(z.toLowerCase())
  );
  if (zoneMatch) score += 25;

  if (tech.availability === 'available') score += 20;
  else if (tech.availability === 'transit') score += 10;
  else if (tech.availability === 'active') score += 5;

  score -= Math.min(tech.activeTasks * 8, 20);
  score += Math.round((tech.rating / 5) * 15);

  return Math.max(0, Math.min(100, score));
}

const AVAIL_COLOR: Record<string, string> = {
  available: 'text-emerald-400',
  transit:   'text-amber-400',
  active:    'text-blue-400',
  overdue:   'text-red-400',
};

const AVAIL_LABEL: Record<string, string> = {
  available: 'Available',
  transit:   'En Route',
  active:    'On Job',
  overdue:   'Overdue',
};

export function AssignTechModal({ open, workOrder, onConfirm, onCancel, demoActionRequest }: Props) {
  const { profiles } = useMemberProfiles();

  const candidates = useMemo<ScoredTech[]>(() => {
    if (!workOrder) return [];

    const profileMap = Object.fromEntries(profiles.map(p => [p.name, p]));

    const pool: ScoredTech[] = mockTechnicians.map(t => {
      const profile = profileMap[t.name];
      const skills = profile?.skills ?? t.skill;
      const zones = profile?.zones ?? [];
      const zoneDisplay = zones.length > 0 ? zones[0] : 'Site-wide';
      return {
        id: t.id,
        name: t.name,
        initials: getInitials(t.name),
        role: profile?.role ?? 'Field Technician',
        primarySkill: t.skill,
        skillsSummary: skills,
        zones,
        zoneDisplay,
        availability: toAvailability(t.status),
        activeTasks: t.status === 'active' || t.status === 'transit' ? 1 : 0,
        score: 0,
        reasoning: '',
        rating: t.rating,
      };
    });

    return pool
      .map(t => {
        const score = scoreCandidate(t, workOrder);
        return { ...t, score, reasoning: buildReasoning({ ...t, score }, workOrder) };
      })
      .sort((a, b) => b.score - a.score);
  }, [workOrder, profiles]);

  const topPick = candidates[0] ?? null;
  const alternatives = candidates.slice(1);

  useEffect(() => {
    if (!open || !topPick) return;
    if (demoActionRequest?.actionId !== 'resident-confirm-ai-pick') return;
    onConfirm(topPick.name);
  }, [demoActionRequest?.actionId, demoActionRequest?.nonce, onConfirm, open, topPick]);

  return (
    <AnimatePresence>
      {open && workOrder && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[3000] bg-black/60 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.18 }}
            className="bg-[#0D1E38] border border-[rgba(46,127,255,0.3)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: '90vh' }}
            onClick={e => e.stopPropagation()}
            data-demo-anchor="resident-assign-tech-modal"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(46,127,255,0.15)] flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <Bot size={14} className="text-cyan-400" />
                </div>
                <div>
                  <div className="text-[#EEF3FA] text-sm font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    AI Assign Technician
                  </div>
                  <div className="text-[10px] text-[#7A94B4]">{workOrder.id} · {workOrder.skill}</div>
                </div>
              </div>
              <button onClick={onCancel} className="text-[#7A94B4] hover:text-white transition-colors rounded-md p-1 hover:bg-white/5">
                <X size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {topPick && (
                <div className="px-5 pt-5 pb-4">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Bot size={10} className="text-cyan-400" />
                    <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider">AI Top Pick</span>
                    <span className="ml-auto text-[9px] text-[#7A94B4]">scored {topPick.score}/100</span>
                  </div>

                  <div className="bg-[rgba(46,127,255,0.08)] border border-[rgba(46,127,255,0.28)] rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative">
                        <TechAvatar initials={topPick.initials} size={10} />
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#0D1E38] flex items-center justify-center">
                          <Star size={8} className="text-amber-400 fill-amber-400" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] text-[#EEF3FA] font-bold">{topPick.name}</div>
                        <div className="text-[10px] text-[#7A94B4]">{topPick.role}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-[13px] font-bold" style={{ color: scoreColor(topPick.score) }}>{topPick.score}%</div>
                        <div className="text-[9px] text-[#7A94B4]">match</div>
                      </div>
                    </div>

                    <AnimatedBar value={topPick.score} color={scoreColor(topPick.score)} height="h-1.5" />

                    <div className="grid grid-cols-2 gap-2 mt-3 mb-2">
                      <div className="flex items-center gap-1.5 bg-[#0A1628] rounded-lg px-2 py-1.5">
                        <Tag size={9} className="text-[#2E7FFF] flex-shrink-0" />
                        <span className="text-[9px] text-[#EEF3FA] truncate">{topPick.primarySkill}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-[#0A1628] rounded-lg px-2 py-1.5">
                        <MapPin size={9} className="text-[#2E7FFF] flex-shrink-0" />
                        <span className="text-[9px] text-[#EEF3FA] truncate">{topPick.zoneDisplay}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="bg-[#0A1628] rounded-lg px-2 py-1.5 text-center">
                        <div className={`text-[10px] font-semibold ${AVAIL_COLOR[topPick.availability]}`}>
                          {AVAIL_LABEL[topPick.availability]}
                        </div>
                        <div className="text-[8px] text-[#7A94B4] mt-0.5">Status</div>
                      </div>
                      <div className="bg-[#0A1628] rounded-lg px-2 py-1.5 text-center">
                        <div className="text-[10px] font-semibold text-[#EEF3FA]">{topPick.activeTasks}</div>
                        <div className="text-[8px] text-[#7A94B4] mt-0.5">Active Tasks</div>
                      </div>
                      <div className="bg-[#0A1628] rounded-lg px-2 py-1.5 text-center">
                        <div className="text-[10px] font-semibold text-amber-400">{topPick.rating}★</div>
                        <div className="text-[8px] text-[#7A94B4] mt-0.5">Rating</div>
                      </div>
                    </div>

                    <div className="text-[10px] text-[#7A94B4] mb-3 leading-relaxed italic">
                      "{topPick.reasoning}"
                    </div>

                    <button
                      onClick={() => onConfirm(topPick.name)}
                      data-demo-action="resident-confirm-ai-pick"
                      data-demo-anchor="resident-confirm-ai-pick-button"
                      className="w-full flex items-center justify-center gap-1.5 py-2 bg-[#2E7FFF] text-white text-[11px] font-semibold rounded-lg hover:bg-blue-500 transition-colors"
                    >
                      <CheckCircle size={12} /> Confirm AI Pick — {topPick.name}
                    </button>
                  </div>
                </div>
              )}

              {alternatives.length > 0 && (
                <div className="px-5 pb-5">
                  <div className="text-[9px] text-[#7A94B4] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Layers size={9} />
                    Other Available Resources
                    <span className="ml-auto text-[#4A6080]">{alternatives.length} options</span>
                  </div>
                  <div className="space-y-2">
                    {alternatives.map(tech => (
                      <div
                        key={tech.id}
                        className="bg-[rgba(17,32,64,0.7)] border border-[rgba(46,127,255,0.15)] rounded-xl p-3 hover:border-[rgba(46,127,255,0.35)] transition-colors"
                      >
                        <div className="flex items-center gap-2.5 mb-2">
                          <TechAvatar initials={tech.initials} size={8} />
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] text-[#EEF3FA] font-semibold">{tech.name}</div>
                            <div className="text-[9px] text-[#7A94B4] truncate">{tech.role}</div>
                          </div>
                          <div className="text-right flex-shrink-0 mr-2">
                            <div className="text-[11px] font-bold" style={{ color: scoreColor(tech.score) }}>{tech.score}%</div>
                            <div className="text-[8px] text-[#7A94B4]">match</div>
                          </div>
                          <button
                            onClick={() => onConfirm(tech.name)}
                            className="flex-shrink-0 px-2.5 py-1.5 bg-[rgba(46,127,255,0.15)] border border-[rgba(46,127,255,0.3)] text-[#2E7FFF] text-[10px] font-semibold rounded-lg hover:bg-[rgba(46,127,255,0.25)] transition-colors"
                          >
                            Select
                          </button>
                        </div>

                        <div className="grid grid-cols-4 gap-1.5 mb-2">
                          <div className="flex items-center gap-1 text-[9px] text-[#7A94B4] col-span-2">
                            <Tag size={8} className="text-[#2E7FFF] flex-shrink-0" />
                            <span className="truncate">{tech.primarySkill}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[9px] text-[#7A94B4] col-span-2">
                            <MapPin size={8} className="text-[#2E7FFF] flex-shrink-0" />
                            <span className="truncate">{tech.zoneDisplay}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[9px] text-[#7A94B4] col-span-2">
                            <Briefcase size={8} className="text-[#2E7FFF] flex-shrink-0" />
                            <span>{tech.activeTasks} task{tech.activeTasks !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[9px] col-span-2">
                            <span className={`font-medium ${AVAIL_COLOR[tech.availability]}`}>{AVAIL_LABEL[tech.availability]}</span>
                            <span className="text-amber-400 ml-auto">{tech.rating}★</span>
                          </div>
                        </div>

                        <AnimatedBar value={tech.score} color={scoreColor(tech.score)} height="h-1" />
                        <div className="text-[9px] text-[#7A94B4] mt-1.5 leading-snug">{tech.reasoning}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {candidates.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-[#7A94B4]">
                  <Bot size={24} className="opacity-40" />
                  <span className="text-[12px] opacity-60">No available technicians found</span>
                </div>
              )}
            </div>

            <div className="px-5 pb-5 pt-1 border-t border-[rgba(46,127,255,0.1)] flex-shrink-0">
              <button
                onClick={onCancel}
                className="w-full py-2 border border-[rgba(46,127,255,0.25)] text-[#7A94B4] text-xs rounded-lg hover:bg-white/5 hover:text-[#EEF3FA] transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
