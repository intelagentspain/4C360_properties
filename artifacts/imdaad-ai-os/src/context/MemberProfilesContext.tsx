import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { mockMemberProfiles } from '@/data/mockData';
import type { MockMemberProfile, MemberPerspective } from '@/data/mockData';
import type { TeamMember } from '@/components/strategic/CommandBar';
import { api } from '@/lib/api';

interface MemberProfilesContextValue {
  profiles: MockMemberProfile[];
  addProfiles: (members: TeamMember[]) => Promise<void>;
  updateProfile: (id: string, patch: Partial<MockMemberProfile>) => void;
  getById: (id: string) => MockMemberProfile | undefined;
}

const MemberProfilesContext = createContext<MemberProfilesContextValue | null>(null);

function dbMemberToProfile(m: Record<string, unknown>): MockMemberProfile {
  return {
    id: String(m['id'] ?? ''),
    name: String(m['name'] ?? ''),
    email: String(m['email'] ?? ''),
    role: String(m['role'] ?? ''),
    perspective: (m['perspective'] ?? 'Operational') as MemberPerspective,
    assignedClients: (m['assignedClients'] as string[] | null) ?? [],
    zones: (m['zones'] as string[] | null) ?? [],
    skills: String(m['skills'] ?? ''),
    responsibilities: String(m['responsibilities'] ?? ''),
    privileges: (m['privileges'] as string[] | null) ?? [],
    mobile: m['mobile'] ? String(m['mobile']) : undefined,
    whatsapp: m['whatsapp'] ? String(m['whatsapp']) : undefined,
    location: m['location'] ? String(m['location']) : undefined,
    availability: m['availability'] ? String(m['availability']) : undefined,
    shift: m['shift'] ? String(m['shift']) : undefined,
    commChannels: (m['commChannels'] as string[] | null) ?? [],
    photo: m['photo'] ? String(m['photo']) : undefined,
    isActive: m['isActive'] !== undefined ? Boolean(m['isActive']) : true,
  };
}

export function MemberProfilesProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<MockMemberProfile[]>(mockMemberProfiles);

  useEffect(() => {
    api.teamMembers.list()
      .then(data => {
        if (data.length > 0) {
          setProfiles(data.map(dbMemberToProfile));
        }
      })
      .catch(err => {
        console.warn('[MemberProfilesContext] Failed to load from API, using mock data:', err);
      });
  }, []);

  const addProfiles = useCallback(async (members: TeamMember[]) => {
    const candidates = members.filter(m => m.name.trim() && m.email.trim());

    const saved: MockMemberProfile[] = [];
    const errors: Array<{ member: TeamMember; err: unknown }> = [];

    for (const m of candidates) {
      try {
        const result = await api.teamMembers.create({
          ...(m.id ? { id: m.id } : {}),
          name: m.name.trim(),
          email: m.email.trim(),
          role: m.role,
          perspective: m.perspective ?? 'Operational',
          assignedClients: m.assignedClients ?? [],
          zones: m.zones ?? [],
          skills: Array.isArray(m.skills) ? m.skills.join(', ') : (m.skills ?? null),
          responsibilities: Array.isArray(m.responsibilities) ? m.responsibilities.join(', ') : (m.responsibilities ?? null),
          privileges: m.privileges ?? [],
          mobile: m.mobile ?? null,
          whatsapp: m.whatsapp ?? null,
          location: m.location ?? null,
          availability: m.availability ?? null,
          shift: m.shift ?? null,
          commChannels: m.commChannels ?? [],
          ...(m.photo ? { photo: m.photo } : {}),
        });
        const profile = dbMemberToProfile(result);
        if (!profile.photo && m.photo) profile.photo = m.photo;
        saved.push(profile);
      } catch (err: unknown) {
        errors.push({ member: m, err });
      }
    }

    if (saved.length > 0) {
      setProfiles(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const toAdd = saved.filter(p => !existingIds.has(p.id));
        return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
      });
    }

    if (errors.length > 0) {
      const firstErr = errors[0].err;
      const message = firstErr instanceof Error ? firstErr.message : String(firstErr);
      throw new Error(message);
    }
  }, []);

  const updateProfile = useCallback((id: string, patch: Partial<MockMemberProfile>) => {
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
  }, []);

  const getById = useCallback((id: string) => profiles.find(p => p.id === id), [profiles]);

  return (
    <MemberProfilesContext.Provider value={{ profiles, addProfiles, updateProfile, getById }}>
      {children}
    </MemberProfilesContext.Provider>
  );
}

export function useMemberProfiles(): MemberProfilesContextValue {
  const ctx = useContext(MemberProfilesContext);
  if (!ctx) throw new Error('useMemberProfiles must be used within MemberProfilesProvider');
  return ctx;
}
