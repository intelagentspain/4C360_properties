import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { mockMemberProfiles } from '@/data/mockData';
import type { MockMemberProfile, MemberPerspective } from '@/data/mockData';
import type { TeamMember } from '@/components/strategic/CommandBar';
import { api } from '@/lib/api';

interface MemberProfilesContextValue {
  profiles: MockMemberProfile[];
  addProfiles: (members: TeamMember[]) => Promise<void>;
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
    const newProfiles: MockMemberProfile[] = members
      .filter(m => m.id && m.name.trim() && m.email.trim())
      .map(m => ({
        id: m.id,
        name: m.name.trim(),
        email: m.email.trim(),
        role: m.role,
        perspective: (m.perspective ?? 'Operational') as MemberPerspective,
        assignedClients: m.assignedClients ?? [],
        zones: m.zones ?? [],
        skills: m.skills ?? '',
        responsibilities: m.responsibilities ?? '',
      }));

    for (const profile of newProfiles) {
      try {
        await api.teamMembers.create({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          perspective: profile.perspective,
          assignedClients: profile.assignedClients,
          zones: profile.zones,
          skills: profile.skills,
          responsibilities: profile.responsibilities,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        if (!message.includes('[409]')) {
          console.warn('[MemberProfilesContext] Failed to persist member to API:', err);
        }
      }
    }

    if (newProfiles.length > 0) {
      setProfiles(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const toAdd = newProfiles.filter(p => !existingIds.has(p.id));
        return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
      });
    }
  }, []);

  const getById = useCallback((id: string) => profiles.find(p => p.id === id), [profiles]);

  return (
    <MemberProfilesContext.Provider value={{ profiles, addProfiles, getById }}>
      {children}
    </MemberProfilesContext.Provider>
  );
}

export function useMemberProfiles(): MemberProfilesContextValue {
  const ctx = useContext(MemberProfilesContext);
  if (!ctx) throw new Error('useMemberProfiles must be used within MemberProfilesProvider');
  return ctx;
}
