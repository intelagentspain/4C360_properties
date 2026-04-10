import { createContext, useContext, useState, type ReactNode } from 'react';
import { mockMemberProfiles } from '@/data/mockData';
import type { MockMemberProfile, MemberPerspective } from '@/data/mockData';
import type { TeamMember } from '@/components/strategic/CommandBar';

interface MemberProfilesContextValue {
  profiles: MockMemberProfile[];
  addProfiles: (members: TeamMember[]) => void;
  getById: (id: string) => MockMemberProfile | undefined;
}

const MemberProfilesContext = createContext<MemberProfilesContextValue | null>(null);

export function MemberProfilesProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<MockMemberProfile[]>(mockMemberProfiles);

  const addProfiles = (members: TeamMember[]) => {
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

    if (newProfiles.length > 0) {
      setProfiles(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const toAdd = newProfiles.filter(p => !existingIds.has(p.id));
        return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
      });
    }
  };

  const getById = (id: string) => profiles.find(p => p.id === id);

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
