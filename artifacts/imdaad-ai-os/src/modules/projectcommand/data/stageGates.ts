export type StageGateStatusValue = 'Approved' | 'Blocked' | 'Pending Review' | 'Open';

export interface StageGate {
  code: string;
  name: string;
  project: string;
  stage: string;
  status: StageGateStatusValue;
  completion: number;
  criteriaComplete: number;
  criteriaTotal: number;
  blockers: number;
  targetDate: string;
  approver: string;
}

export const stageGates: StageGate[] = [
  {
    code: 'SG-MAR-001',
    name: 'Feasibility Study Gate',
    project: 'marina-residences',
    stage: 'Planning & Feasibility',
    status: 'Approved',
    completion: 100,
    criteriaComplete: 12,
    criteriaTotal: 12,
    blockers: 0,
    targetDate: '2025-02-15',
    approver: 'Dr. Ahmed Al Maktoum',
  },
  {
    code: 'SG-MAR-002',
    name: 'Design Approval Gate',
    project: 'marina-residences',
    stage: 'Design & Permitting',
    status: 'Blocked',
    completion: 75,
    criteriaComplete: 9,
    criteriaTotal: 12,
    blockers: 3,
    targetDate: '2025-03-30',
    approver: 'Eng. Mohammed Rahman',
  },
  {
    code: 'SG-BUR-001',
    name: 'Permit Acquisition Gate',
    project: 'burj-skyline',
    stage: 'Design & Permitting',
    status: 'Pending Review',
    completion: 88,
    criteriaComplete: 14,
    criteriaTotal: 16,
    blockers: 1,
    targetDate: '2025-02-28',
    approver: 'Khalid bin Rashid',
  },
  {
    code: 'SG-PAL-001',
    name: 'Construction Commencement Gate',
    project: 'palm-villas',
    stage: 'Construction',
    status: 'Open',
    completion: 45,
    criteriaComplete: 7,
    criteriaTotal: 15,
    blockers: 2,
    targetDate: '2025-03-15',
    approver: 'Abdullah Al-Qasimi',
  },
];

export const stageGateProjectBuckets = ['Riverside', 'Marina', 'Old', 'Cocoon'];
export const stageGateTrend = [
  { month: 'Nov', completion: 74 },
  { month: 'Dec', completion: 80 },
  { month: 'Jan', completion: 84 },
  { month: 'Feb', completion: 85 },
];
