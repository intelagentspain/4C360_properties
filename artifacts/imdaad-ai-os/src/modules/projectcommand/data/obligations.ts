export type ObligationStatus = 'Overdue' | 'Pending' | 'Met';

export interface ObligationLink {
  code: string;
  title: string;
  status: string;
}

export interface ObligationLogEntry {
  date: string;
  note: string;
}

export interface ProjectObligation {
  code: string;
  obligation: string;
  category: string;
  authority: string;
  jurisdiction: string;
  project: string;
  stage: string;
  dueDate: string;
  nextReview: string;
  status: ObligationStatus;
  owner: string;
  description: string;
  linkedRisks: ObligationLink[];
  linkedControls: ObligationLink[];
  evidenceRequired: string[];
  changeLog: ObligationLogEntry[];
}

export const obligations: ProjectObligation[] = [
  {
    code: 'DM-FS-001',
    obligation: 'Fire Safety Certificate - Before Occupation',
    category: 'Fire & Life Safety',
    authority: 'Dubai Civil Defence',
    jurisdiction: 'Dubai',
    project: 'Marina Vista',
    stage: 'Commissioning & Handover',
    dueDate: '28/02/2025',
    nextReview: '15/02/2025',
    status: 'Overdue',
    owner: 'Sarah Chen',
    description: 'Obtain Fire Safety Certificate from Dubai Civil Defence before first occupation',
    linkedRisks: [{ code: 'R-FLS-001', title: 'Fire Safety Compliance Breach', status: 'High' }],
    linkedControls: [{ code: 'C-FLS-003', title: 'Fire-Stopping Inspection Program', status: 'Failed' }],
    evidenceRequired: ['Fire Safety Certificate', 'DCD Inspection Report'],
    changeLog: [
      { date: '2025-01-15', note: 'Last reviewed by Sarah Chen' },
      { date: '2024-12-01', note: 'Status changed to Overdue' },
      { date: '2024-10-15', note: 'Obligation created' },
    ],
  },
  {
    code: 'DM-BLD-002',
    obligation: 'Building Completion Certificate',
    category: 'Building Permits',
    authority: 'Dubai Municipality',
    jurisdiction: 'Dubai',
    project: 'Riverside Towers',
    stage: 'Commissioning & Handover',
    dueDate: '31/08/2025',
    nextReview: '15/07/2025',
    status: 'Pending',
    owner: 'Mike Rodriguez',
    description: 'Secure Dubai Municipality Building Completion Certificate before handover and occupancy activities',
    linkedRisks: [{ code: 'R-BLD-004', title: 'Completion Certificate Delay', status: 'Medium' }],
    linkedControls: [{ code: 'C-BLD-002', title: 'Completion Documentation Review', status: 'Effective' }],
    evidenceRequired: ['Completion certificate', 'Final inspection approval', 'As-built drawing pack'],
    changeLog: [
      { date: '2025-02-10', note: 'Authority submission pack updated' },
      { date: '2025-01-20', note: 'Next review owner assigned to Mike Rodriguez' },
    ],
  },
  {
    code: 'RERA-WR-001',
    obligation: 'Warranty Registration with RERA',
    category: 'Consumer Protection',
    authority: 'RERA',
    jurisdiction: 'Dubai',
    project: 'Cocoon Residences A',
    stage: 'Post-Sale Warranty & Defects Liability',
    dueDate: '30/07/2024',
    nextReview: '15/07/2024',
    status: 'Met',
    owner: 'Lisa Wang',
    description: 'Register warranty obligations with RERA and maintain evidence for owner handover packs',
    linkedRisks: [{ code: 'R-WAR-002', title: 'Warranty SLA Dispute', status: 'Low' }],
    linkedControls: [{ code: 'C-WAR-001', title: 'Warranty Evidence Register', status: 'Effective' }],
    evidenceRequired: ['RERA warranty submission', 'Buyer notification record'],
    changeLog: [
      { date: '2024-07-29', note: 'RERA warranty registration marked as met' },
      { date: '2024-07-02', note: 'Evidence pack approved' },
    ],
  },
  {
    code: 'DM-ENV-003',
    obligation: 'Environmental Impact Assessment Approval',
    category: 'Environmental',
    authority: 'Dubai Municipality - Environment',
    jurisdiction: 'Dubai',
    project: 'Old Town Renewal',
    stage: 'Design & Permitting',
    dueDate: '30/06/2025',
    nextReview: '30/04/2025',
    status: 'Pending',
    owner: 'Ahmed Al-Mansoori',
    description: 'Maintain EIA approval before design permit release and construction mobilization',
    linkedRisks: [{ code: 'R-ENV-003', title: 'Environmental Permit Delay', status: 'Medium' }],
    linkedControls: [{ code: 'C-ENV-004', title: 'Permit Evidence Review', status: 'Effective' }],
    evidenceRequired: ['EIA approval letter', 'Environmental consultant report'],
    changeLog: [
      { date: '2025-03-01', note: 'Environmental consultant appointed' },
      { date: '2025-01-12', note: 'Authority comments received' },
    ],
  },
  {
    code: 'DEWA-CON-001',
    obligation: 'DEWA Connection Certificate',
    category: 'Utilities',
    authority: 'DEWA',
    jurisdiction: 'Dubai',
    project: 'Marina Vista',
    stage: 'Commissioning & Handover',
    dueDate: '01/03/2025',
    nextReview: '01/02/2025',
    status: 'Pending',
    owner: 'Sarah Chen',
    description: 'Secure DEWA connection certification before final commissioning and utility release',
    linkedRisks: [{ code: 'R-UTL-001', title: 'Utility Connection Delay', status: 'High' }],
    linkedControls: [{ code: 'C-UTL-002', title: 'Utility Readiness Checklist', status: 'Exception' }],
    evidenceRequired: ['DEWA certificate', 'Connection test report', 'Final meter approval'],
    changeLog: [
      { date: '2025-01-22', note: 'Connection test report requested' },
      { date: '2024-12-16', note: 'DEWA inspection date reserved' },
    ],
  },
];
