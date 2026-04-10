import { createContext, useContext, type ReactNode } from 'react';

export interface MemberFilter {
  memberId: string | null;
  assignedClients: string[];
  zones: string[];
  perspective: string | null;
}

const DEFAULT_FILTER: MemberFilter = {
  memberId: null,
  assignedClients: [],
  zones: [],
  perspective: null,
};

const MemberFilterContext = createContext<MemberFilter>(DEFAULT_FILTER);

export function MemberFilterProvider({
  value,
  children,
}: {
  value: MemberFilter;
  children: ReactNode;
}) {
  return (
    <MemberFilterContext.Provider value={value}>
      {children}
    </MemberFilterContext.Provider>
  );
}

export function useMemberFilter(): MemberFilter {
  return useContext(MemberFilterContext);
}

export function isFilterActive(filter: MemberFilter): boolean {
  return filter.memberId !== null;
}
