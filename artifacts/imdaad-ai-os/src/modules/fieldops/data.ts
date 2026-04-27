export type SurveyStatus = 'Draft' | 'Active' | 'In Progress' | 'Completed' | 'Archived';
export type SurveyType =
  | 'Field Inspection'
  | 'Preventive Maintenance'
  | 'Reactive Maintenance'
  | 'Custom'
  | 'Safety'
  | 'Asset Condition'
  | 'Handover'
  | 'Cleaning Audit'
  | 'Fire Safety';

export type QuestionType =
  | 'section'
  | 'text'
  | 'single_choice'
  | 'multiple_choice'
  | 'yes_no'
  | 'pass_fail'
  | 'numeric'
  | 'photo'
  | 'voice'
  | 'signature'
  | 'gps'
  | 'qr_scan';

export interface SurveyQuestion {
  id: string;
  type: QuestionType;
  label: string;
  required: boolean;
  evidenceRequired: boolean;
  options?: string[];
  scoring?: { pass: number; fail: number; weight: number };
  conditionalLogic?: string;
}

export interface Survey {
  id: string;
  name: string;
  type: SurveyType;
  description: string;
  clientId: string;
  siteIds: string[];
  assetIds: string[];
  status: SurveyStatus;
  assignedTo: string;
  captureMethod: string;
  responses: number;
  lastUpdated: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  questions: SurveyQuestion[];
}

export interface SurveyAssignment {
  id: string;
  surveyId: string;
  assignedToType: 'user' | 'team' | 'vendor' | 'role' | 'site' | 'region';
  assignedToId: string;
  assignee: string;
  role: string;
  site: string;
  dueDate: string;
  recurrence: 'one-time' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'custom';
  accessRules: {
    authenticatedOnly: boolean;
    publicLinkAllowed: boolean;
    qrScanAllowed: boolean;
    vendorAccessAllowed: boolean;
    anonymousCaptureAllowed: boolean;
    geofenceEnabled: boolean;
  };
  status: 'Active' | 'In Progress' | 'Completed' | 'Overdue' | 'Failed / Rejected';
  progress: number;
}

export interface SurveySubmission {
  id: string;
  surveyId: string;
  assignmentId: string;
  submittedBy: string;
  answers: Array<{ question: string; answer: string }>;
  evidence: Array<{ type: 'photo' | 'voice' | 'signature'; label: string; previewUrl?: string }>;
  gpsLocation: { lat: number; lng: number; site: string };
  status: 'Submitted' | 'Pending Review' | 'Approved' | 'Rejected';
  issuesDetected: number;
  score: number;
  submittedAt: string;
  reviewer: string;
}

export const surveyTypes: SurveyType[] = [
  'Field Inspection',
  'Preventive Maintenance',
  'Reactive Maintenance',
  'Custom',
  'Safety',
  'Asset Condition',
  'Handover',
  'Cleaning Audit',
  'Fire Safety',
];

export const templateOptions: Record<SurveyType, string[]> = {
  'Preventive Maintenance': ['HVAC PPM', 'Lift PPM', 'Fire System PPM', 'Pump PPM', 'Generator PPM', 'Electrical Panel PPM'],
  'Field Inspection': ['General Site Inspection', 'Common Area Inspection', 'Asset Condition Check', 'Safety Walkthrough', 'Defect Inspection'],
  'Reactive Maintenance': ['Issue Diagnosis', 'Corrective Action Verification', 'Before/After Evidence', 'Root Cause Capture'],
  Custom: ['Blank builder'],
  Safety: ['Site Safety Walkthrough', 'PPE Compliance', 'Permit-to-work Check'],
  'Asset Condition': ['Asset Condition Check', 'Critical Asset Review', 'Lifecycle Scoring'],
  Handover: ['Unit Handover', 'Common Area Handover', 'Snagging Checklist'],
  'Cleaning Audit': ['Lobby Cleaning Audit', 'Washroom Cleaning Audit', 'Common Area Cleaning Audit'],
  'Fire Safety': ['Fire System PPM', 'Fire Door Inspection', 'Emergency Exit Audit'],
};

export const questionPalette: Array<{ type: QuestionType; label: string; helper: string }> = [
  { type: 'section', label: 'Section header', helper: 'Group related questions' },
  { type: 'text', label: 'Text question', helper: 'Notes and descriptions' },
  { type: 'single_choice', label: 'Single choice', helper: 'One option only' },
  { type: 'multiple_choice', label: 'Multiple choice', helper: 'Multiple selections' },
  { type: 'yes_no', label: 'Yes / No', helper: 'Binary confirmation' },
  { type: 'pass_fail', label: 'Pass / Fail', helper: 'Inspection status' },
  { type: 'numeric', label: 'Numeric reading', helper: 'Meter or asset reading' },
  { type: 'photo', label: 'Photo upload', helper: 'Evidence capture' },
  { type: 'voice', label: 'Voice note', helper: 'Field narration' },
  { type: 'signature', label: 'Signature', helper: 'Supervisor sign-off' },
  { type: 'gps', label: 'GPS capture', helper: 'Location proof' },
  { type: 'qr_scan', label: 'QR / asset scan', helper: 'Asset verification' },
];

export const surveys: Survey[] = [
  {
    id: 'srv-hvac-ppm',
    name: 'HVAC Chiller PPM - Tower A',
    type: 'Preventive Maintenance',
    description: 'Monthly chiller preventive maintenance checklist with readings and photo evidence.',
    clientId: 'Danube Properties',
    siteIds: ['Lawnz Residences'],
    assetIds: ['CH-01', 'CH-02'],
    status: 'Active',
    assignedTo: 'MEP Team',
    captureMethod: 'Authenticated QR',
    responses: 28,
    lastUpdated: 'Today, 09:40',
    createdBy: 'Sarah Khan',
    createdAt: '2026-04-18',
    updatedAt: '2026-04-27',
    questions: [
      { id: 'q1', type: 'section', label: 'Visual Inspection', required: false, evidenceRequired: false },
      { id: 'q2', type: 'pass_fail', label: 'Check asset exterior condition', required: true, evidenceRequired: true, scoring: { pass: 10, fail: 0, weight: 2 } },
      { id: 'q3', type: 'numeric', label: 'Record chilled water pressure', required: true, evidenceRequired: false },
      { id: 'q4', type: 'photo', label: 'Upload panel photo evidence', required: true, evidenceRequired: true },
    ],
  },
  {
    id: 'srv-fire-safety',
    name: 'Fire Safety Inspection - Basement',
    type: 'Fire Safety',
    description: 'Fire doors, extinguishers, pumps, and escape route compliance.',
    clientId: 'DevelopmentX',
    siteIds: ['Business Bay Tower Complex'],
    assetIds: ['FSP-03'],
    status: 'In Progress',
    assignedTo: 'Fire Safety Vendor',
    captureMethod: 'Geo-restricted link',
    responses: 14,
    lastUpdated: 'Today, 08:15',
    createdBy: 'Sarah Khan',
    createdAt: '2026-04-20',
    updatedAt: '2026-04-27',
    questions: [
      { id: 'q5', type: 'yes_no', label: 'Emergency exits are clear', required: true, evidenceRequired: true },
      { id: 'q6', type: 'pass_fail', label: 'Fire pump test result', required: true, evidenceRequired: true },
      { id: 'q7', type: 'signature', label: 'Supervisor sign-off', required: true, evidenceRequired: false },
    ],
  },
  {
    id: 'srv-cleaning',
    name: 'Cleaning Audit - Common Areas',
    type: 'Cleaning Audit',
    description: 'Quality audit for lobby, corridors, washrooms, and public amenities.',
    clientId: 'JLT North Cluster',
    siteIds: ['Cluster B'],
    assetIds: [],
    status: 'Completed',
    assignedTo: 'Soft Services Team',
    captureMethod: 'Mobile app',
    responses: 64,
    lastUpdated: 'Yesterday',
    createdBy: 'Sarah Khan',
    createdAt: '2026-04-12',
    updatedAt: '2026-04-26',
    questions: [
      { id: 'q8', type: 'single_choice', label: 'Lobby condition', required: true, evidenceRequired: false, options: ['Excellent', 'Good', 'Needs attention'] },
      { id: 'q9', type: 'photo', label: 'Photo evidence for failed items', required: false, evidenceRequired: true },
    ],
  },
  {
    id: 'srv-defect',
    name: 'Defect Capture - Handover Floors 8-12',
    type: 'Handover',
    description: 'Snagging and handover readiness capture for residential units.',
    clientId: 'Danube Properties',
    siteIds: ['Lawnz Residences'],
    assetIds: ['L08-L12'],
    status: 'Draft',
    assignedTo: 'Unassigned',
    captureMethod: 'Draft',
    responses: 0,
    lastUpdated: '2 hours ago',
    createdBy: 'Sarah Khan',
    createdAt: '2026-04-27',
    updatedAt: '2026-04-27',
    questions: [
      { id: 'q10', type: 'text', label: 'Describe defect', required: true, evidenceRequired: false },
      { id: 'q11', type: 'photo', label: 'Upload defect photo', required: true, evidenceRequired: true },
      { id: 'q12', type: 'qr_scan', label: 'Scan unit QR', required: true, evidenceRequired: false },
    ],
  },
];

export const assignments: SurveyAssignment[] = [
  {
    id: 'asg-001',
    surveyId: 'srv-hvac-ppm',
    assignedToType: 'team',
    assignedToId: 'mep-team',
    assignee: 'MEP Team',
    role: 'FM Engineer',
    site: 'Lawnz Residences',
    dueDate: '2026-04-30',
    recurrence: 'monthly',
    accessRules: { authenticatedOnly: true, publicLinkAllowed: false, qrScanAllowed: true, vendorAccessAllowed: true, anonymousCaptureAllowed: false, geofenceEnabled: true },
    status: 'In Progress',
    progress: 72,
  },
  {
    id: 'asg-002',
    surveyId: 'srv-fire-safety',
    assignedToType: 'vendor',
    assignedToId: 'fire-vendor',
    assignee: 'Fire Safety Vendor',
    role: 'Contractor',
    site: 'Business Bay Tower Complex',
    dueDate: '2026-04-29',
    recurrence: 'weekly',
    accessRules: { authenticatedOnly: true, publicLinkAllowed: true, qrScanAllowed: true, vendorAccessAllowed: true, anonymousCaptureAllowed: false, geofenceEnabled: true },
    status: 'Overdue',
    progress: 48,
  },
  {
    id: 'asg-003',
    surveyId: 'srv-cleaning',
    assignedToType: 'role',
    assignedToId: 'soft-services',
    assignee: 'Soft Services Team',
    role: 'Supervisor',
    site: 'JLT North Cluster',
    dueDate: '2026-04-26',
    recurrence: 'daily',
    accessRules: { authenticatedOnly: true, publicLinkAllowed: false, qrScanAllowed: false, vendorAccessAllowed: false, anonymousCaptureAllowed: false, geofenceEnabled: false },
    status: 'Completed',
    progress: 100,
  },
];

export const submissions: SurveySubmission[] = [
  {
    id: 'SUB-2026-0418',
    surveyId: 'srv-hvac-ppm',
    assignmentId: 'asg-001',
    submittedBy: 'Ahmed Farouk',
    answers: [
      { question: 'Check asset exterior condition', answer: 'Pass' },
      { question: 'Record chilled water pressure', answer: '4.8 bar' },
      { question: 'Upload panel photo evidence', answer: '2 photos uploaded' },
    ],
    evidence: [{ type: 'photo', label: 'Panel cover photo' }, { type: 'signature', label: 'Engineer signature' }],
    gpsLocation: { lat: 25.0381, lng: 55.2442, site: 'Lawnz Residences' },
    status: 'Pending Review',
    issuesDetected: 1,
    score: 86,
    submittedAt: 'Today, 10:22',
    reviewer: 'Mariam Saleh',
  },
  {
    id: 'SUB-2026-0419',
    surveyId: 'srv-fire-safety',
    assignmentId: 'asg-002',
    submittedBy: 'Khalid Noor',
    answers: [
      { question: 'Emergency exits are clear', answer: 'No' },
      { question: 'Fire pump test result', answer: 'Fail - pressure drop detected' },
    ],
    evidence: [{ type: 'photo', label: 'Blocked exit photo' }, { type: 'voice', label: 'Technician note' }],
    gpsLocation: { lat: 25.1851, lng: 55.2728, site: 'Business Bay Tower Complex' },
    status: 'Pending Review',
    issuesDetected: 3,
    score: 62,
    submittedAt: 'Today, 08:42',
    reviewer: 'Sarah Khan',
  },
];

export const templates = [
  { name: 'HVAC PPM', type: 'Preventive Maintenance', duration: '18 min', questions: 24, evidence: 'Photos + readings' },
  { name: 'Lift Inspection', type: 'Field Inspection', duration: '12 min', questions: 18, evidence: 'Photos + signature' },
  { name: 'Fire Safety Inspection', type: 'Fire Safety', duration: '20 min', questions: 28, evidence: 'Photos + GPS' },
  { name: 'Cleaning Audit', type: 'Cleaning Audit', duration: '9 min', questions: 16, evidence: 'Photos optional' },
  { name: 'Site Safety Walkthrough', type: 'Safety', duration: '15 min', questions: 22, evidence: 'Photos required' },
  { name: 'Defect Capture', type: 'Reactive Maintenance', duration: '7 min', questions: 12, evidence: 'Before/after photos' },
  { name: 'Asset Condition Survey', type: 'Asset Condition', duration: '14 min', questions: 20, evidence: 'QR + readings' },
  { name: 'Handover Checklist', type: 'Handover', duration: '25 min', questions: 36, evidence: 'Photos + signature' },
];

export const aiGeneratedSurvey = {
  prompt: 'Create a preventive maintenance checklist for a water-cooled chiller',
  frequency: 'Monthly during summer, quarterly during low-load periods',
  responsibleRole: 'FM Engineer with MEP supervisor review',
  sections: [
    {
      title: 'Visual Inspection',
      questions: [
        'Check asset exterior condition - Pass/Fail - mandatory',
        'Confirm no visible corrosion, leaks, or panel damage - Yes/No - mandatory',
        'Upload photo evidence of chiller exterior - required',
      ],
    },
    {
      title: 'Operational Readings',
      questions: [
        'Record entering chilled water temperature - numeric',
        'Record leaving chilled water temperature - numeric',
        'Record condenser pressure reading - numeric - abnormal readings create issue',
      ],
    },
    {
      title: 'Safety',
      questions: [
        'Confirm isolation procedures followed - Yes/No - mandatory',
        'Confirm access area is clear and safe - Pass/Fail - mandatory',
        'Supervisor signature - required before submission',
      ],
    },
  ],
};
