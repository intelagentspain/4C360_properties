export type StageGateStatusValue = 'Approved' | 'Blocked' | 'Pending Review' | 'Open';
export type StageGateDeliverableStatus = 'Complete' | 'Pending' | 'Blocked';

export interface StageGateDeliverable {
  name: string;
  status: StageGateDeliverableStatus;
  documentCode: string;
  documentType: string;
  previewSummary: string;
  previewFields: { label: string; value: string }[];
  previewLines: string[];
}

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
  deliverables: StageGateDeliverable[];
  linkedObligations: string[];
  linkedControls: string[];
  requiredEvidence: string[];
  notes: string;
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
    deliverables: [
      {
        name: 'Market Analysis Report',
        status: 'Complete',
        documentCode: 'DOC-MKT-001',
        documentType: 'Feasibility Report',
        previewSummary: 'Demand and competitor review for marina-residences with absorption assumptions and recommended launch phasing.',
        previewFields: [
          { label: 'Prepared by', value: 'Strategy Office' },
          { label: 'Market sample', value: '12 comparable towers' },
          { label: 'Recommendation', value: 'Proceed to design' },
        ],
        previewLines: ['Target segment demand is stable across waterfront and urban family buyers.', 'Absorption model supports phased release over 14 months.', 'Pricing sensitivity remains inside approved commercial threshold.'],
      },
      {
        name: 'Financial Feasibility Study',
        status: 'Complete',
        documentCode: 'DOC-FIN-001',
        documentType: 'Commercial Model',
        previewSummary: 'Financial model showing margin, cost sensitivity, contingency, and funding assumptions for gate approval.',
        previewFields: [
          { label: 'Base IRR', value: '14.8%' },
          { label: 'Contingency', value: '7.5%' },
          { label: 'Review status', value: 'Approved' },
        ],
        previewLines: ['Base-case revenue covers land, construction, soft costs, and financing.', 'Downside scenario remains viable with 5% sales price pressure.', 'Commercial manager signed off budget envelope.'],
      },
      {
        name: 'Environmental Impact Assessment',
        status: 'Complete',
        documentCode: 'DOC-ENV-001',
        documentType: 'Environmental Report',
        previewSummary: 'Initial environmental impact assessment covering construction controls, waste management, and mitigation actions.',
        previewFields: [
          { label: 'Authority', value: 'Dubai Municipality' },
          { label: 'Risk rating', value: 'Medium' },
          { label: 'Mitigations', value: '9 actions' },
        ],
        previewLines: ['Dust, noise, and waste controls are acceptable with proposed mitigation plan.', 'No protected habitat constraints were identified on site.', 'Environmental monitoring is required during enabling works.'],
      },
      {
        name: 'Site Survey Report',
        status: 'Complete',
        documentCode: 'DOC-SUR-001',
        documentType: 'Technical Survey',
        previewSummary: 'Topographic and boundary survey confirming plot levels, access points, utility interfaces, and survey control points.',
        previewFields: [
          { label: 'Survey date', value: '2025-01-18' },
          { label: 'Control points', value: '8 verified' },
          { label: 'Issues', value: 'None critical' },
        ],
        previewLines: ['Boundary coordinates align with the authority record.', 'Existing utility corridors are marked for design coordination.', 'Survey control points are suitable for design development.'],
      },
    ],
    linkedObligations: ['OBL-001', 'OBL-003'],
    linkedControls: ['CTL-FIN-001', 'CTL-ENV-002'],
    requiredEvidence: ['EVD-001', 'EVD-002'],
    notes: 'Feasibility pack is approved. Keep environmental and financial assumptions current through design freeze.',
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
    deliverables: [
      {
        name: 'Concept Design Freeze',
        status: 'Complete',
        documentCode: 'DOC-DES-014',
        documentType: 'Design Sign-off',
        previewSummary: 'Approved design freeze pack covering architectural massing, unit mix, amenity zones, and baseline drawings.',
        previewFields: [
          { label: 'Revision', value: 'Rev C' },
          { label: 'Signed by', value: 'Design Director' },
          { label: 'Open comments', value: '0 critical' },
        ],
        previewLines: ['Concept drawings are frozen for authority coordination.', 'Unit mix matches approved commercial feasibility.', 'Minor facade comments moved to design development.'],
      },
      {
        name: 'Authority Submission Pack',
        status: 'Pending',
        documentCode: 'DOC-AUT-022',
        documentType: 'Submission Pack',
        previewSummary: 'Authority submission pack awaiting final response to civil defence and accessibility comments.',
        previewFields: [
          { label: 'Package status', value: 'Pending' },
          { label: 'Comments open', value: '5' },
          { label: 'Target issue', value: '2025-03-22' },
        ],
        previewLines: ['Civil defence markups are under consultant review.', 'Accessibility notes require drawing cloud updates.', 'Submission can proceed once MEP clash notes are closed.'],
      },
      {
        name: 'MEP Coordination Sign-off',
        status: 'Blocked',
        documentCode: 'DOC-MEP-009',
        documentType: 'Coordination Certificate',
        previewSummary: 'MEP coordination sign-off is blocked by unresolved clashes around risers, smoke extraction, and plantroom routing.',
        previewFields: [
          { label: 'Clashes open', value: '14' },
          { label: 'Critical clashes', value: '3' },
          { label: 'Owner', value: 'MEP Coordinator' },
        ],
        previewLines: ['Three riser clashes affect the current authority submission.', 'Smoke extraction route overlaps with structural transfer zone.', 'Workshop required before gate can be released.'],
      },
      {
        name: 'Design Risk Review',
        status: 'Pending',
        documentCode: 'DOC-RSK-006',
        documentType: 'Risk Review',
        previewSummary: 'Design risk review summarising cost, programme, compliance, and constructability risks before design gate closure.',
        previewFields: [
          { label: 'High risks', value: '4' },
          { label: 'Mitigations due', value: '2025-03-25' },
          { label: 'Reviewer', value: 'PMO Risk Lead' },
        ],
        previewLines: ['Facade procurement lead time remains a high programme risk.', 'MEP coordination risk is elevated until clash closure.', 'Cost risk is controlled if design freeze is maintained.'],
      },
    ],
    linkedObligations: ['OBL-004', 'OBL-006'],
    linkedControls: ['CTL-DES-004', 'CTL-MEP-002'],
    requiredEvidence: ['EVD-004', 'EVD-007', 'EVD-009'],
    notes: 'Gate is blocked by unresolved MEP coordination items and authority comments. Escalate before next review.',
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
    deliverables: [
      {
        name: 'Dubai Municipality Permit Pack',
        status: 'Complete',
        documentCode: 'DOC-PER-101',
        documentType: 'Permit Pack',
        previewSummary: 'Permit pack containing drawings, consultant letters, ownership details, and authority forms for Dubai Municipality.',
        previewFields: [
          { label: 'Submission ID', value: 'DM-2025-7721' },
          { label: 'Status', value: 'Accepted' },
          { label: 'Reviewer', value: 'Permit Office' },
        ],
        previewLines: ['All mandatory forms were accepted by the portal.', 'Consultant appointment letter is attached.', 'No missing document flags remain.'],
      },
      {
        name: 'NOC Register',
        status: 'Complete',
        documentCode: 'DOC-NOC-018',
        documentType: 'NOC Register',
        previewSummary: 'NOC tracker summarising authority approvals, validity periods, and renewal owners for permit acquisition.',
        previewFields: [
          { label: 'NOCs tracked', value: '11' },
          { label: 'Expired', value: '0' },
          { label: 'Next renewal', value: 'DEWA' },
        ],
        previewLines: ['Roads, utilities, and fire approvals are logged.', 'No NOC is currently expired.', 'DEWA final clearance remains a downstream dependency.'],
      },
      {
        name: 'Utility Clearance Evidence',
        status: 'Pending',
        documentCode: 'DOC-UTL-004',
        documentType: 'Clearance Evidence',
        previewSummary: 'Utility clearance package pending final DEWA confirmation for service corridor conflict checks.',
        previewFields: [
          { label: 'Provider', value: 'DEWA' },
          { label: 'Status', value: 'Pending confirmation' },
          { label: 'Expected', value: '2025-02-24' },
        ],
        previewLines: ['Survey overlay has been submitted to utility provider.', 'No major service diversion expected from the current drawing set.', 'Final stamped clearance is still pending.'],
      },
      {
        name: 'Permit Conditions Tracker',
        status: 'Complete',
        documentCode: 'DOC-CON-031',
        documentType: 'Conditions Tracker',
        previewSummary: 'Tracker for authority permit conditions, assigned owners, due dates, and evidence requirements.',
        previewFields: [
          { label: 'Conditions', value: '16' },
          { label: 'Closed', value: '14' },
          { label: 'Open', value: '2 low risk' },
        ],
        previewLines: ['Most permit conditions are assigned and closed.', 'Open conditions relate to final signage and environmental monitoring plan.', 'No critical blocker remains for gate recommendation.'],
      },
    ],
    linkedObligations: ['OBL-008', 'OBL-010'],
    linkedControls: ['CTL-PER-001', 'CTL-NOC-003'],
    requiredEvidence: ['EVD-011', 'EVD-014'],
    notes: 'Permit gate is close to approval. Utility clearance is the only open dependency before sign-off.',
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
    deliverables: [
      {
        name: 'Construction Readiness Checklist',
        status: 'Pending',
        documentCode: 'DOC-CRD-001',
        documentType: 'Readiness Checklist',
        previewSummary: 'Readiness checklist for site access, permits, inspections, staffing, temporary works, and enabling handover.',
        previewFields: [
          { label: 'Checks complete', value: '7 of 15' },
          { label: 'Critical open', value: '2' },
          { label: 'Owner', value: 'Site Manager' },
        ],
        previewLines: ['Temporary works design approval is pending upload.', 'Access control setup has not been witnessed.', 'Mobilisation evidence is otherwise complete.'],
      },
      {
        name: 'Mobilisation Plan',
        status: 'Complete',
        documentCode: 'DOC-MOB-010',
        documentType: 'Mobilisation Plan',
        previewSummary: 'Mobilisation plan confirming site team deployment, plant access, welfare setup, and initial workface sequencing.',
        previewFields: [
          { label: 'Crew plan', value: 'Approved' },
          { label: 'Plant list', value: '12 assets' },
          { label: 'First workface', value: 'Zone A enabling' },
        ],
        previewLines: ['Core site team has been assigned.', 'Plant mobilisation dates are aligned with access permit window.', 'Welfare and temporary utilities are ready for inspection.'],
      },
      {
        name: 'HSE Induction Evidence',
        status: 'Pending',
        documentCode: 'DOC-HSE-013',
        documentType: 'HSE Evidence Pack',
        previewSummary: 'HSE induction attendance and competency pack for workers, supervisors, and specialist subcontractors.',
        previewFields: [
          { label: 'Inducted', value: '64 of 92' },
          { label: 'Pending vendors', value: '2' },
          { label: 'Reviewer', value: 'HSE Lead' },
        ],
        previewLines: ['Main contractor induction evidence is partially complete.', 'Specialist subcontractor records need upload before site start.', 'Critical work permits should remain locked until induction reaches 100%.'],
      },
      {
        name: 'Site Logistics Approval',
        status: 'Blocked',
        documentCode: 'DOC-LOG-007',
        documentType: 'Logistics Approval',
        previewSummary: 'Logistics approval is blocked by unresolved traffic routing and delivery holding area comments.',
        previewFields: [
          { label: 'Open comments', value: '4' },
          { label: 'Critical comments', value: '2' },
          { label: 'Owner', value: 'Logistics Manager' },
        ],
        previewLines: ['Neighbouring access lane conflict requires revised traffic plan.', 'Delivery holding bay location conflicts with temporary hoarding.', 'Approval meeting is required before construction start.'],
      },
    ],
    linkedObligations: ['OBL-012', 'OBL-014'],
    linkedControls: ['CTL-HSE-001', 'CTL-MOB-002'],
    requiredEvidence: ['EVD-018', 'EVD-021', 'EVD-022'],
    notes: 'Construction commencement depends on HSE induction completion and site logistics approval from the PMO.',
  },
];

export const stageGateProjectBuckets = ['Riverside', 'Marina', 'Old', 'Cocoon'];
export const stageGateTrend = [
  { month: 'Nov', completion: 74 },
  { month: 'Dec', completion: 80 },
  { month: 'Jan', completion: 84 },
  { month: 'Feb', completion: 85 },
];
