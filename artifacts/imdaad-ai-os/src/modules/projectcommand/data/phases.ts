export type SubTask = {
  id: string;
  name: string;
  startPct: number;
  widthPct: number;
  completePct: number;
  isCritical: boolean;
};

export type Phase = {
  id: string;
  name: string;
  startPct: number;
  widthPct: number;
  completePct: number;
  color: string;
  isCritical: boolean;
  aiAnnotation?: string;
  subTasks?: SubTask[];
};

export const phases: Phase[] = [
  {
    id: 'design',
    name: 'Design & Approvals',
    startPct: 0,
    widthPct: 22,
    completePct: 100,
    color: '#00B894',
    isCritical: false,
    subTasks: [
      { id: 'design-1', name: 'Architectural drawings', startPct: 0, widthPct: 14, completePct: 100, isCritical: false },
      { id: 'design-2', name: 'DDA permit submission', startPct: 8, widthPct: 10, completePct: 100, isCritical: false },
      { id: 'design-3', name: 'Building permit approval', startPct: 16, widthPct: 6, completePct: 100, isCritical: false },
    ],
  },
  {
    id: 'enabling',
    name: 'Enabling Works',
    startPct: 20,
    widthPct: 14,
    completePct: 100,
    color: '#00B894',
    isCritical: false,
    subTasks: [
      { id: 'en-1', name: 'Site hoarding + access', startPct: 20, widthPct: 6, completePct: 100, isCritical: false },
      { id: 'en-2', name: 'Piling works', startPct: 24, widthPct: 10, completePct: 100, isCritical: false },
    ],
  },
  {
    id: 'substructure',
    name: 'Substructure',
    startPct: 34,
    widthPct: 20,
    completePct: 78,
    color: '#C8A020',
    isCritical: true,
    aiAnnotation: '78% · on baseline',
    subTasks: [
      { id: 'sub-1', name: 'Basement excavation', startPct: 34, widthPct: 10, completePct: 100, isCritical: true },
      { id: 'sub-2', name: 'Basement waterproofing', startPct: 40, widthPct: 8, completePct: 45, isCritical: true },
      { id: 'sub-3', name: 'Ground floor slab', startPct: 46, widthPct: 8, completePct: 80, isCritical: true },
    ],
  },
  {
    id: 'superstructure',
    name: 'Superstructure',
    startPct: 50,
    widthPct: 28,
    completePct: 32,
    color: '#D97706',
    isCritical: true,
    aiAnnotation: '8d slip risk',
    subTasks: [
      { id: 'sup-1', name: 'Levels 1-8 concrete', startPct: 50, widthPct: 12, completePct: 100, isCritical: true },
      { id: 'sup-2', name: 'Levels 9-16 concrete', startPct: 60, widthPct: 12, completePct: 30, isCritical: true },
      { id: 'sup-3', name: 'Levels 17-32 concrete', startPct: 70, widthPct: 8, completePct: 0, isCritical: true },
    ],
  },
  {
    id: 'mep',
    name: 'MEP Rough-in',
    startPct: 60,
    widthPct: 25,
    completePct: 15,
    color: '#7C3AED',
    isCritical: true,
    aiAnnotation: 'Awaiting L16 approval',
    subTasks: [
      { id: 'mep-1', name: 'HVAC rough-in B1-L8', startPct: 60, widthPct: 10, completePct: 40, isCritical: true },
      { id: 'mep-2', name: 'Electrical containment', startPct: 64, widthPct: 12, completePct: 20, isCritical: true },
      { id: 'mep-3', name: 'Plumbing riser stacks', startPct: 68, widthPct: 17, completePct: 5, isCritical: true },
    ],
  },
  {
    id: 'fitout',
    name: 'Fit-out & Finishing',
    startPct: 72,
    widthPct: 22,
    completePct: 0,
    color: '#243448',
    isCritical: true,
    subTasks: [
      { id: 'fo-1', name: 'Facade & glazing', startPct: 72, widthPct: 18, completePct: 0, isCritical: true },
      { id: 'fo-2', name: 'Internal fit-out L1-L20', startPct: 78, widthPct: 12, completePct: 0, isCritical: true },
      { id: 'fo-3', name: 'Internal fit-out L21-L48', startPct: 86, widthPct: 8, completePct: 0, isCritical: true },
    ],
  },
  {
    id: 'handover',
    name: 'Handover & Snagging',
    startPct: 90,
    widthPct: 10,
    completePct: 0,
    color: '#243448',
    isCritical: true,
    subTasks: [
      { id: 'ho-1', name: 'Snag list clearance', startPct: 90, widthPct: 6, completePct: 0, isCritical: true },
      { id: 'ho-2', name: 'Authority sign-offs', startPct: 94, widthPct: 4, completePct: 0, isCritical: true },
      { id: 'ho-3', name: 'Unit handover', startPct: 97, widthPct: 3, completePct: 0, isCritical: true },
    ],
  },
];
