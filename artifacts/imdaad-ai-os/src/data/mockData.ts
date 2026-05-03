export type MemberPerspective = 'Strategic' | 'Operational' | 'Client';

export interface MockMemberProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  perspective: MemberPerspective;
  assignedClients: string[];
  zones: string[];
  skills: string;
  responsibilities: string;
  privileges?: string[];
  mobile?: string;
  whatsapp?: string;
  location?: string;
  availability?: string;
  shift?: string;
  commChannels?: string[];
  photo?: string;
  isActive?: boolean;
  clientSector?: string;
  siteName?: string;
}

export const mockMemberProfiles: MockMemberProfile[] = [
  {
    id: 'mbr-001',
    name: 'Hassan Yousef',
    email: 'hassan.yousef@developmentx.ae',
    role: 'HSE Manager',
    perspective: 'Strategic',
    assignedClients: ['Dubai Silicon Oasis', 'Gate Avenue DIFC'],
    zones: ['Cluster A', 'Cluster B', 'Block C'],
    skills: 'Fall Protection, Electrical Safety, Inspection Management, Asset Intelligence',
    responsibilities: 'Oversee HSE operations for Dubai Silicon Oasis and Gate Avenue DIFC\nMonitor SLA performance and escalate breaches immediately\nReview AI dispatch recommendations and adjust automation rules weekly\nConduct monthly KPI reviews with account managers',
    photo: 'team/hassan-yousef.png',
    isActive: true,
  },
  {
    id: 'mbr-002',
    name: 'Karim R.',
    email: 'karim.r@developmentx.ae',
    role: 'Safety Inspector',
    perspective: 'Operational',
    assignedClients: ['Dubai Silicon Oasis'],
    zones: ['Cluster A', 'Block C'],
    skills: 'Fall Protection Specialist, Hazardous Gas Handling, Predictive Hazard Detection',
    responsibilities: 'Respond to Safety Equipment incidents in Cluster A within SLA targets\nConduct quarterly gas detector and Fume Hood servicing\nLog all interventions in the platform after each job\nTrain junior inspectors on Safety Equipment diagnostic procedures',
    photo: 'team/karim-r.png',
    isActive: true,
  },
  {
    id: 'mbr-003',
    name: 'Rania Al-Farsi',
    email: 'rania.alfarsi@developmentx.ae',
    role: 'Account Manager',
    perspective: 'Strategic',
    assignedClients: ['Dubai Silicon Oasis'],
    zones: ['Dubai East'],
    skills: 'Client Relations, KPI Reporting, Contract Management',
    responsibilities: 'Manage the Dubai Silicon Oasis client relationship\nDeliver monthly performance reports to the client board\nTrack contract renewal milestones and renewal readiness\nCoordinate with HSE Manager on escalation resolution',
    photo: 'team/rania-al-farsi.png',
    isActive: true,
  },
  {
    id: 'mbr-004',
    name: 'Tariq Mansour',
    email: 'tariq.mansour@developmentx.ae',
    role: 'Site Supervisor',
    perspective: 'Operational',
    assignedClients: ['Dubai Silicon Oasis'],
    zones: ['Cluster A', 'Cluster B', 'Block C', 'Recreation Area'],
    skills: 'Fall Protection & Electrical Safety, Site Safety, Permit to Work',
    responsibilities: 'Conduct daily site walk-arounds and log observations before 09:00\nEnsure all inspectors hold valid permits for high-risk tasks\nChase overdue work orders 30 min before SLA breach\nReview team attendance and assign shift coverage',
    photo: 'team/tariq-mansour.png',
    isActive: true,
  },
  {
    id: 'mbr-005',
    name: 'Lina Barakat',
    email: 'lina.barakat@client.ae',
    role: 'Client',
    perspective: 'Client',
    assignedClients: ['JLT North Cluster'],
    zones: ['Dubai Marina'],
    skills: 'Facility Management Oversight, Compliance Review',
    responsibilities: 'Review service request status and SLA compliance\nSubmit and track maintenance requests for JLT North\nAccess performance reports and satisfaction data\nEscalate unresolved issues to DevelopmentX account management',
    photo: 'team/lina-barakat.png',
    isActive: true,
  },
  {
    id: 'mbr-006',
    name: 'Sara Al-Rashidi',
    email: 'sara.rashidi@palacehotel.ae',
    role: 'Site Visitor',
    perspective: 'Client',
    assignedClients: ['Palace Residences Hotel'],
    zones: ['Dubai Creek Harbour'],
    skills: 'Visitor',
    responsibilities: 'Report maintenance issues in your room or hotel area\nTrack the status of your service request\nProvide feedback on completed maintenance',
    photo: 'team/sara-rashidi.png',
    isActive: true,
    clientSector: 'Worksite Visitor',
    siteName: 'Palace Residences Hotel',
  },
  {
    id: 'mbr-007',
    name: 'Ahmed K.',
    email: 'ahmed.k@developmentx.ae',
    role: 'Safety Inspector',
    perspective: 'Operational',
    assignedClients: ['Dubai Silicon Oasis'],
    zones: ['Cluster B', 'Block C'],
    skills: 'Plumbing, Pipe Systems, Eyewash Heater, Gate Systems',
    responsibilities: 'Handle all plumbing work orders in Cluster B\nRespond to plumbing incidents within 30 min SLA\nLog before and after evidence for every job\nConduct monthly pipe pressure inspections',
    mobile: '+971 50 234 5678',
    availability: 'Full-time',
    shift: 'Business Hours (08:00–17:00)',
    commChannels: ['whatsapp', 'phone'],
    isActive: true,
  },
  {
    id: 'mbr-008',
    name: 'Sara M.',
    email: 'sara.m@developmentx.ae',
    role: 'Safety Inspector',
    perspective: 'Operational',
    assignedClients: ['Dubai Silicon Oasis'],
    zones: ['Cluster A', 'Block C'],
    skills: 'Electrical, Safety Inspections, Lockout Panels, Fire Systems',
    responsibilities: 'Manage all electrical and safety work orders in Cluster A and Block C\nConduct fire panel and safety system annual checks\nRespond to electrical incidents within SLA\nMaintain 100% evidence compliance on safety jobs',
    mobile: '+971 55 345 6789',
    availability: 'Full-time',
    shift: 'Business Hours (08:00–17:00)',
    commChannels: ['whatsapp', 'email'],
    isActive: true,
  },
  {
    id: 'mbr-009',
    name: 'Faisal N.',
    email: 'faisal.n@developmentx.ae',
    role: 'Safety Inspector',
    perspective: 'Operational',
    assignedClients: ['Dubai Silicon Oasis'],
    zones: ['Cluster A', 'Cluster B', 'Recreation Area'],
    skills: 'General Maintenance, Lift Safety, Pool & Grounds, Plumbing',
    responsibilities: 'General maintenance across all cluster zones\nConduct scaffold monthly safety inspections\nManage eyewash station and recreation area upkeep\nAssist with plumbing jobs in Cluster A when Ahmed K. is at capacity',
    mobile: '+971 52 456 7890',
    availability: 'Full-time',
    shift: 'Morning (06:00–14:00)',
    commChannels: ['phone', 'radio'],
    isActive: true,
  },
  {
    id: 'mbr-010',
    name: 'Omar T.',
    email: 'omar.t@developmentx.ae',
    role: 'Safety Inspector',
    perspective: 'Operational',
    assignedClients: ['Dubai Silicon Oasis'],
    zones: ['Cluster B', 'Block C', 'Main Gate'],
    skills: 'Electrical, General Maintenance, Safety Inspections (basic)',
    responsibilities: 'Handle electrical and general maintenance in Cluster B and Block C\nRespond to gate and corridor maintenance requests\nComplete all jobs with photo evidence before closing\nReport SLA risk proactively to supervisor',
    mobile: '+971 56 567 8901',
    availability: 'Full-time',
    shift: 'Afternoon (14:00–22:00)',
    commChannels: ['whatsapp', 'radio'],
    isActive: true,
  },
  {
    id: 'mbr-011',
    name: 'Nadia H.',
    email: 'nadia.h@developmentx.ae',
    role: 'Safety Officer',
    perspective: 'Operational',
    assignedClients: ['Dubai Silicon Oasis'],
    zones: ['Cluster A', 'Cluster B', 'Recreation Area', 'Main Gate'],
    skills: 'Safety Compliance, General Maintenance, Plumbing, Fire Safety',
    responsibilities: 'Conduct weekly safety walks across all zones\nManage fire exit compliance and safety inspection records\nAssist with general maintenance jobs across all clusters\nEnsure all inspectors follow safety protocols on site',
    mobile: '+971 54 678 9012',
    availability: 'Full-time',
    shift: 'Business Hours (08:00–17:00)',
    commChannels: ['email', 'phone'],
    isActive: true,
  },
];

export const mockInspectors = [
  { id: 'AK', name: 'Ahmed K.', skill: 'Plumbing', status: 'active', job: '#SI-301', lat: 25.1190, lng: 55.3760, rating: 4.6, jobsCompleted: 98 },
  { id: 'SM', name: 'Sara M.', skill: 'Electrical', status: 'available', lat: 25.1165, lng: 55.3790, rating: 4.9, jobsCompleted: 210 },
  { id: 'KR', name: 'Karim R.', skill: 'Safety Equipment', status: 'transit', job: '#SI-2241', lat: 25.1180, lng: 55.3740, rating: 4.8, jobsCompleted: 142 },
  { id: 'FN', name: 'Faisal N.', skill: 'Plumbing', status: 'available', lat: 25.1155, lng: 55.3800, rating: 4.7, jobsCompleted: 87 },
  { id: 'OT', name: 'Omar T.', skill: 'General', status: 'overdue', job: '#SI-298', lat: 25.1200, lng: 55.3770, rating: 4.2, jobsCompleted: 63 },
];

export const mockIncidents = [
  {
    id: 'INC-SI-001', title: 'Slip Hazard', location: 'Villa 23, Cluster A',
    severity: 'critical', slaMinutes: 45, elapsed: 6, lat: 25.1185, lng: 55.3755, source: 'AI Capture',
    status: 'dispatched', assignedTech: 'Karim R.', techId: 'KR', closureNotes: null,
    clientId: 'CLT-001', siteId: 'silicon-oasis',
    description: 'AI detected wet-floor pattern at workshop entrance — coolant pooling near walkway. High slip risk for workers entering the bay. Karim R. dispatched with absorbent and warning signage.',
    imageUrl: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80',
    capturedAt: '10:08 AM · 11 Apr 2026',
    activityLog: [
      { time: '10:08 AM', event: 'AI Capture detected via worker photo', type: 'incident' },
      { time: '10:10 AM', event: 'Auto-classified: Slip & Trip · Critical · 45 min SLA', type: 'ai' },
      { time: '10:12 AM', event: 'Karim R. dispatched — ETA 4 min · 0.4 km away', type: 'dispatch' },
    ],
  },
  {
    id: 'INC-SI-002', title: 'Chemical Spill', location: 'Workshop 7, Zone B',
    severity: 'medium', slaMinutes: 120, elapsed: 14, lat: 25.1160, lng: 55.3785, source: 'AI Capture',
    status: 'open', assignedTech: null, techId: null, closureNotes: null,
    clientId: 'CLT-002', siteId: 'gate-avenue',
    description: 'Worker submitted photo of solvent pooling under workbench. AI matched pattern to slow drum-seal failure. Area cordoned with cones — no structural damage detected.',
    imageUrl: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80',
    capturedAt: '10:10 AM · 11 Apr 2026',
    activityLog: [
      { time: '10:10 AM', event: 'Incident reported via Worker Safety App with photo', type: 'incident' },
      { time: '10:11 AM', event: 'Auto-classified: Chemical Safety · Medium · 120 min SLA', type: 'ai' },
    ],
  },
  {
    id: 'INC-SI-003', title: 'Scaffold Defect', location: 'Block C',
    severity: 'high', slaMinutes: 60, elapsed: 22, lat: 25.1195, lng: 55.3765, source: 'WhatsApp → Manual',
    status: 'in-progress', assignedTech: 'Faisal N.', techId: 'FN', closureNotes: null,
    clientId: 'CLT-003', siteId: 'business-bay',
    description: 'Scaffold tag missing with edge gap detected on Bay 2 — reported via WhatsApp message thread. Manual review escalated to high priority. Workers withdrawn from level pending re-tag.',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    capturedAt: '09:58 AM · 11 Apr 2026',
    activityLog: [
      { time: '09:58 AM', event: 'WhatsApp message received from building supervisor', type: 'incident' },
      { time: '10:00 AM', event: 'Manual review — escalated to High · 60 min SLA', type: 'escalation' },
      { time: '10:05 AM', event: 'Faisal N. dispatched · Fall Protection · 0.8 km', type: 'dispatch' },
      { time: '10:18 AM', event: 'Faisal N. on-site — re-inspection in progress', type: 'update' },
    ],
  },
  {
    id: 'INC-SI-004', title: 'LOTO Breach', location: 'Workshop 31',
    severity: 'low', slaMinutes: 240, elapsed: 31, lat: 25.1170, lng: 55.3750, source: 'Worker Safety App',
    status: 'assigned', assignedTech: 'Sara M.', techId: 'SM', closureNotes: null,
    clientId: 'CLT-001', siteId: 'silicon-oasis',
    description: 'Worker reported energised circuit found without lockout/tagout during planned maintenance. Likely missed isolation step. Sara M. assigned to verify LOTO and re-train crew.',
    imageUrl: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&q=80',
    capturedAt: '09:49 AM · 11 Apr 2026',
    activityLog: [
      { time: '09:49 AM', event: 'Service request submitted via Worker Safety App', type: 'incident' },
      { time: '09:51 AM', event: 'Auto-classified: Electrical · Low · 240 min SLA', type: 'ai' },
      { time: '09:55 AM', event: 'Sara M. assigned — ETA 22 min', type: 'dispatch' },
    ],
  },
  {
    id: 'INC-SI-005', title: 'Emergency Call Point Down', location: 'Main Gate',
    severity: 'medium', slaMinutes: 180, elapsed: 45, lat: 25.1175, lng: 55.3775, source: 'Worker Safety App',
    status: 'overdue', assignedTech: 'Omar T.', techId: 'OT', closureNotes: null,
    clientId: 'CLT-004', siteId: 'jlt-north',
    description: 'Main emergency call point at site entrance unresponsive. Workers unable to summon first-aid or muster response. Omar T. assigned but job is now overdue.',
    imageUrl: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=800&q=80',
    capturedAt: '09:30 AM · 11 Apr 2026',
    activityLog: [
      { time: '09:30 AM', event: 'Multiple workers reported via app', type: 'incident' },
      { time: '09:35 AM', event: 'Classified: Electrical Safety · Medium · 180 min SLA', type: 'ai' },
      { time: '09:40 AM', event: 'Omar T. assigned — ETA 15 min', type: 'dispatch' },
      { time: '10:15 AM', event: 'SLA BREACH — job overdue by 15 min', type: 'escalation' },
    ],
  },
  {
    id: 'INC-SI-006', title: 'Eyewash Station Vibration', location: 'Recreation Area',
    severity: 'low', slaMinutes: 360, elapsed: 12, lat: 25.1168, lng: 55.3762, source: 'Worker Safety App',
    status: 'open', assignedTech: null, techId: null, closureNotes: null,
    clientId: 'CLT-005', siteId: 'difc-tower',
    description: 'Eyewash station EW-02 reported as vibrating during weekly flow test. IoT sensor confirms anomalous vibration signature in supply line. Predictive risk flagged at 41%.',
    imageUrl: 'https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=800&q=80',
    capturedAt: '10:12 AM · 11 Apr 2026',
    activityLog: [
      { time: '10:12 AM', event: 'Worker reported vibration during flow test', type: 'incident' },
      { time: '10:13 AM', event: 'IoT corroboration: vibration anomaly on EW-02', type: 'ai' },
    ],
  },
  {
    id: 'INC-SI-007', title: 'PPE Cabinet Audit', location: 'Block C Gym',
    severity: 'medium', slaMinutes: 240, elapsed: 210, lat: 25.1190, lng: 55.3770, source: 'WhatsApp → Manual',
    status: 'closed', assignedTech: 'Karim R.', techId: 'KR',
    clientId: 'CLT-001', siteId: 'silicon-oasis',
    description: 'Scheduled PPE cabinet audit completed for Block C lab area. Respirator filters replaced, eyewash test logged, fume-hood face velocity verified. All items within spec.',
    imageUrl: 'https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=800&q=80',
    capturedAt: 'Yesterday 09:00 AM',
    beforePhotoUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    afterPhotoUrl: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80',
    activityLog: [
      { time: 'Yesterday 09:00 AM', event: 'Inspection task triggered — scheduled audit due', type: 'incident' },
      { time: 'Yesterday 09:15 AM', event: 'Karim R. assigned for PPE cabinet audit', type: 'dispatch' },
      { time: 'Yesterday 11:30 AM', event: 'Service completed — photos submitted', type: 'update' },
      { time: 'Yesterday 11:45 AM', event: 'Supervisor approved closure — SLA met (210/240 min)', type: 'update' },
    ],
    closureNotes: 'Respirator filters replaced (HEPA F7). Eyewash flow at 1.5 L/min nominal. Fume hood face velocity 0.5 m/s — within spec. No further action required. Next audit due in 60 days.',
  },
];

export const mockClusters = [
  { id: 'A', lat: 25.1188, lng: 55.3758, villas: 42, incidents: 2 },
  { id: 'B', lat: 25.1162, lng: 55.3782, villas: 38, incidents: 0 },
  { id: 'C', lat: 25.1195, lng: 55.3768, villas: 55, incidents: 1 },
];

export const mockPPMSchedule = [
  {
    id: 'PPM-S-001', assetId: 'AST-002', asset: 'Scaffold — Block A, Bay 2', type: 'Lift',
    task: 'Monthly Safety Check', skill: 'General', location: 'Cluster A, Block 2',
    daysUntilDue: -3, lastDone: 32, daysScheduled: 30, riskLevel: 'overdue',
    tech: 'Faisal N.', techId: 'FN', condition: 58, nextDueDate: '7 Apr',
    notes: 'Motor vibration anomaly detected by IoT — do not defer.',
  },
  {
    id: 'PPM-S-002', assetId: 'AST-001', asset: 'Gas Detection Unit GD-04', type: 'Safety Equipment',
    task: 'Quarterly Safety Equipment Service', skill: 'Safety Equipment', location: 'Block C Gym',
    daysUntilDue: 2, lastDone: 83, daysScheduled: 90, riskLevel: 'critical',
    tech: 'Karim R.', techId: 'KR', condition: 72, nextDueDate: '12 Apr',
    notes: 'Calibration Gas pressure at 72%. Risk of failure in 4–6 days per prediction engine.',
  },
  {
    id: 'PPM-S-003', assetId: 'AST-002', asset: 'Emergency Call Point System', type: 'Electrical',
    task: 'Annual Hardware Check', skill: 'Electrical', location: 'Main Gate',
    daysUntilDue: 3, lastDone: 362, daysScheduled: 365, riskLevel: 'critical',
    tech: 'Sara M.', techId: 'SM', condition: 61, nextDueDate: '13 Apr',
    notes: 'Currently experiencing operational fault. PPM overdue alongside active incident.',
  },
  {
    id: 'PPM-S-004', assetId: 'AST-005', asset: 'Fire Panel FP-01', type: 'Safety',
    task: '6-Month Inspection', skill: 'Safety', location: 'Community Centre',
    daysUntilDue: 8, lastDone: 172, daysScheduled: 180, riskLevel: 'high',
    tech: 'Sara M.', techId: 'SM', condition: 97, nextDueDate: '18 Apr',
    notes: 'Regulatory compliance requirement. Must not be deferred beyond due date.',
  },
  {
    id: 'PPM-S-005', assetId: 'AST-001', asset: 'Fume Hood — Block A Floor 2', type: 'Safety Equipment',
    task: 'Filter & Coil Clean', skill: 'Safety Equipment', location: 'Block A, Floor 2',
    daysUntilDue: 11, lastDone: 44, daysScheduled: 60, riskLevel: 'high',
    tech: 'Karim R.', techId: 'KR', condition: 81, nextDueDate: '21 Apr',
    notes: 'Scheduled routine service — no active faults.',
  },
  {
    id: 'PPM-S-006', assetId: 'AST-003', asset: 'Fire Suppression — Block B', type: 'Safety',
    task: '6-Month Suppression Test', skill: 'Safety', location: 'Block B',
    daysUntilDue: 14, lastDone: 166, daysScheduled: 180, riskLevel: 'medium',
    tech: null, techId: null, condition: 90, nextDueDate: '24 Apr',
    notes: 'Unassigned — requires certified fire safety inspector.',
  },
  {
    id: 'PPM-S-007', assetId: 'AST-004', asset: 'Eyewash Station EW-02', type: 'Plumbing',
    task: 'Monthly Inspection', skill: 'Plumbing', location: 'Recreation Area',
    daysUntilDue: 18, lastDone: 12, daysScheduled: 30, riskLevel: 'medium',
    tech: 'Ahmed K.', techId: 'AK', condition: 89, nextDueDate: '28 Apr',
    notes: 'Pressure variance detected over 5-day trend — monitor closely.',
  },
  {
    id: 'PPM-S-008', assetId: 'AST-003', asset: 'Emergency Lighting Bank EL-01', type: 'Electrical',
    task: 'Quarterly Load Test', skill: 'Electrical', location: 'Community Centre',
    daysUntilDue: 34, lastDone: 56, daysScheduled: 90, riskLevel: 'low',
    tech: 'Sara M.', techId: 'SM', condition: 94, nextDueDate: '14 May',
    notes: 'No issues — scheduled as planned.',
  },
  {
    id: 'PPM-S-009', assetId: null, asset: 'Hot Work Permit Register', type: 'Plumbing',
    task: 'Seasonal Service', skill: 'Plumbing', location: 'Permit-to-Work Zones',
    daysUntilDue: 51, lastDone: 219, daysScheduled: 270, riskLevel: 'low',
    tech: 'Faisal N.', techId: 'FN', condition: 85, nextDueDate: '31 May',
    notes: 'Seasonal check — aligned with summer preparation schedule.',
  },
];

export interface PPMHistoryRecord {
  id: string;
  date: string;
  inspector: string;
  techId: string;
  result: 'pass' | 'fail' | 'partial';
  conditionScore: number;
  durationMinutes: number;
  findings: string;
  partsUsed?: string[];
  onTime: boolean;
}

export interface PPMAssetHistory {
  assetId: string;
  aiInsight: string;
  complianceRate: number;
  avgDaysBetweenService: number;
  failureFrequency: number;
  recurringFindings: { finding: string; occurrences: number; total: number }[];
  records: PPMHistoryRecord[];
}

export const mockPPMHistory: PPMAssetHistory[] = [
  {
    assetId: 'AST-001',
    aiInsight: 'Gas Detection Unit GD-04 shows a declining condition trend over the last 4 services, with calibration gas pressure consistently underperforming. Three of the last four services flagged calibration gas-related findings, and the on-time compliance rate has dropped to 71% — indicating scheduling gaps that may be accelerating wear.',
    complianceRate: 71,
    avgDaysBetweenService: 88,
    failureFrequency: 1,
    recurringFindings: [
      { finding: 'Low calibration gas pressure', occurrences: 3, total: 4 },
      { finding: 'Condenser coil fouling', occurrences: 2, total: 4 },
      { finding: 'Filter replacement required', occurrences: 4, total: 4 },
    ],
    records: [
      { id: 'H-001-1', date: '12 Jan 2026', inspector: 'Karim R.', techId: 'KR', result: 'partial', conditionScore: 72, durationMinutes: 140, findings: 'Calibration Gas at 72% nominal — topped up to 89%. Condenser coils cleaned. Filter replaced (Grade F7). Minor belt wear noted.', partsUsed: ['Cal-Gas-410 Calibration Gas 2kg', 'HEPA Filter F7'], onTime: false },
      { id: 'H-001-2', date: '13 Oct 2025', inspector: 'Karim R.', techId: 'KR', result: 'pass', conditionScore: 81, durationMinutes: 120, findings: 'Quarterly service completed. All readings within spec. Filter replaced. Coils cleaned — light fouling only. Calibration Gas pressure at 94%.', partsUsed: ['HEPA Filter F7'], onTime: true },
      { id: 'H-001-3', date: '10 Jul 2025', inspector: 'Omar T.', techId: 'OT', result: 'partial', conditionScore: 78, durationMinutes: 175, findings: 'Calibration Gas pressure at 76% — below threshold. Leak suspected at connection joint. Topped up. Joint re-sealed. Recommend follow-up in 30 days.', partsUsed: ['Cal-Gas-410 Calibration Gas 3kg', 'Sealant Kit'], onTime: true },
      { id: 'H-001-4', date: '14 Apr 2025', inspector: 'Karim R.', techId: 'KR', result: 'pass', conditionScore: 86, durationMinutes: 115, findings: 'Routine quarterly service. All parameters nominal. Filter replaced, coils washed, thermostat calibrated. Asset in good condition.', partsUsed: ['HEPA Filter F7'], onTime: true },
      { id: 'H-001-5', date: '10 Jan 2025', inspector: 'Karim R.', techId: 'KR', result: 'fail', conditionScore: 63, durationMinutes: 220, findings: 'Calibration Gas critically low at 48%. Compressor showing intermittent fault. Full calibration gas recharge performed. Compressor contacts replaced. Follow-up required.', partsUsed: ['Cal-Gas-410 Calibration Gas 5kg', 'Compressor Contacts'], onTime: false },
      { id: 'H-001-6', date: '11 Oct 2024', inspector: 'Karim R.', techId: 'KR', result: 'pass', conditionScore: 88, durationMinutes: 110, findings: 'Standard quarterly service. Minor condenser fouling cleared. All readings nominal post-service. Asset operating within specification.', onTime: true },
    ],
  },
  {
    assetId: 'AST-002',
    aiInsight: 'Scaffold Block A Block 2 has a concerning vibration history — motor anomalies were detected in 3 of the last 4 services. The asset compliance rate is 58%, suggesting PPMs are frequently deferred. Given the active IoT vibration alert, the risk of imminent failure is elevated and immediate intervention is recommended.',
    complianceRate: 58,
    avgDaysBetweenService: 34,
    failureFrequency: 2,
    recurringFindings: [
      { finding: 'Motor vibration anomaly', occurrences: 3, total: 4 },
      { finding: 'Guide rail lubrication needed', occurrences: 4, total: 4 },
      { finding: 'Door sensor misalignment', occurrences: 2, total: 4 },
    ],
    records: [
      { id: 'H-002-1', date: '9 Mar 2026', inspector: 'Faisal N.', techId: 'FN', result: 'partial', conditionScore: 58, durationMinutes: 95, findings: 'Monthly safety check. Motor vibration at 4.2mm/s — above 3.5mm/s threshold. Guide rails lubricated. Door sensors adjusted. Vibration issue escalated for specialist review.', onTime: false },
      { id: 'H-002-2', date: '6 Feb 2026', inspector: 'Faisal N.', techId: 'FN', result: 'pass', conditionScore: 64, durationMinutes: 80, findings: 'Monthly check completed. Light vibration noted (3.1mm/s — within tolerance). Rails lubricated. Emergency button tested and functional. Cabin lighting checked.', onTime: false },
      { id: 'H-002-3', date: '5 Jan 2026', inspector: 'Ahmed K.', techId: 'AK', result: 'fail', conditionScore: 55, durationMinutes: 180, findings: 'Motor overheating detected (82°C — limit is 75°C). Lift taken out of service for 4 hours. Motor cooling fan replaced. Bearings greased. Service resumed after cool-down.', partsUsed: ['Cooling Fan Assembly', 'Bearing Grease 500g'], onTime: true },
      { id: 'H-002-4', date: '4 Dec 2025', inspector: 'Faisal N.', techId: 'FN', result: 'partial', conditionScore: 62, durationMinutes: 90, findings: 'Motor vibration elevated (3.9mm/s). Door sensor on Floor 3 misaligned — adjusted and re-tested. Guide rails lubricated. Recommend motor inspection next service.', onTime: true },
      { id: 'H-002-5', date: '2 Nov 2025', inspector: 'Faisal N.', techId: 'FN', result: 'pass', conditionScore: 71, durationMinutes: 75, findings: 'Standard monthly check. All parameters within spec. No anomalies detected. Rails lubricated, emergency lighting tested.', onTime: true },
      { id: 'H-002-6', date: '1 Oct 2025', inspector: 'Ahmed K.', techId: 'AK', result: 'pass', conditionScore: 75, durationMinutes: 85, findings: 'Monthly safety inspection completed. Cabin interior checked. Safety switches tested. Drive belt tension verified. Asset in satisfactory condition.', onTime: false },
    ],
  },
  {
    assetId: 'AST-003',
    aiInsight: 'Emergency Lighting Bank EL-01 has an excellent maintenance track record with 100% compliance and consistent pass results across all 6 recorded services. Condition scores have remained above 90% throughout, and no recurring faults have been identified. The asset is well-maintained and operating well within expected parameters — a model example of preventive maintenance done right.',
    complianceRate: 100,
    avgDaysBetweenService: 91,
    failureFrequency: 0,
    recurringFindings: [
      { finding: 'Load test completed successfully', occurrences: 6, total: 6 },
      { finding: 'Battery voltage check — nominal', occurrences: 6, total: 6 },
      { finding: 'Fuel level verified and topped up', occurrences: 6, total: 6 },
    ],
    records: [
      { id: 'H-003-1', date: '15 Jan 2026', inspector: 'Sara M.', techId: 'SM', result: 'pass', conditionScore: 94, durationMinutes: 120, findings: 'Quarterly load test conducted at 80% rated capacity for 30 minutes. All readings nominal. Battery voltage 13.8V. Fuel at 92%. Coolant level OK.', onTime: true },
      { id: 'H-003-2', date: '16 Oct 2025', inspector: 'Sara M.', techId: 'SM', result: 'pass', conditionScore: 95, durationMinutes: 115, findings: 'Load test completed. Transfer switch tested — 2.3s switchover (within 3s SLA). Engine oil changed. Air filter cleaned. All systems nominal.', partsUsed: ['Engine Oil 5L', 'Air Filter'], onTime: true },
      { id: 'H-003-3', date: '18 Jul 2025', inspector: 'Omar T.', techId: 'OT', result: 'pass', conditionScore: 93, durationMinutes: 130, findings: 'Quarterly service. Load test at 75% capacity — stable. Voltage regulator tested. Fuel injectors cleaned. Battery replaced as preventive measure.', partsUsed: ['Battery 12V 100Ah'], onTime: true },
      { id: 'H-003-4', date: '22 Apr 2025', inspector: 'Sara M.', techId: 'SM', result: 'pass', conditionScore: 96, durationMinutes: 105, findings: 'Routine quarterly service. All parameters excellent. Load test completed. Radiator checked — no leaks. Coolant topped up. Asset in excellent condition.', partsUsed: ['Coolant 2L'], onTime: true },
      { id: 'H-003-5', date: '19 Jan 2025', inspector: 'Sara M.', techId: 'SM', result: 'pass', conditionScore: 95, durationMinutes: 118, findings: 'Quarterly load test completed — 85% rated capacity for 35 minutes. All fuel, battery, coolant, and oil readings within spec. Exhaust checked — no abnormal emissions. No issues found.', onTime: true },
      { id: 'H-003-6', date: '20 Oct 2024', inspector: 'Omar T.', techId: 'OT', result: 'pass', conditionScore: 97, durationMinutes: 108, findings: 'Quarterly service. Load test at 80% capacity — generator held load steadily for 30 minutes. Engine oil changed. Air filter replaced. Fuel topped up to 100%. Asset performing excellently.', partsUsed: ['Engine Oil 5L', 'Air Filter'], onTime: true },
    ],
  },
  {
    assetId: 'AST-004',
    aiInsight: 'Eyewash Station EW-02 has been well-maintained with mostly pass results, though a persistent pressure variance issue has emerged over the last 3 services. The current IoT sensor reading anomalous vibration directly aligns with the strainer blockage and impeller wear pattern observed since November 2025. Early intervention is advisable before the next monthly inspection to prevent escalation.',
    complianceRate: 83,
    avgDaysBetweenService: 31,
    failureFrequency: 0,
    recurringFindings: [
      { finding: 'Pressure variance detected', occurrences: 3, total: 6 },
      { finding: 'Impeller inspection completed', occurrences: 5, total: 6 },
      { finding: 'Seal integrity verified', occurrences: 6, total: 6 },
      { finding: 'Strainer cleaning required', occurrences: 2, total: 6 },
    ],
    records: [
      { id: 'H-004-1', date: '31 Mar 2026', inspector: 'Ahmed K.', techId: 'AK', result: 'partial', conditionScore: 89, durationMinutes: 65, findings: 'Monthly inspection. Pressure variance of ±0.4 bar noted — borderline tolerance. Impeller inspected — minor leading-edge wear detected. Seals intact. Monitoring recommended.', onTime: true },
      { id: 'H-004-2', date: '28 Feb 2026', inspector: 'Ahmed K.', techId: 'AK', result: 'pass', conditionScore: 91, durationMinutes: 60, findings: 'Routine inspection completed. Pump pressure stable. Flow rate at 98% nominal. Impeller clear. No issues noted.', onTime: true },
      { id: 'H-004-3', date: '30 Jan 2026', inspector: 'Faisal N.', techId: 'FN', result: 'partial', conditionScore: 87, durationMinutes: 80, findings: 'Pressure oscillation of ±0.5 bar detected during inspection. Strainer cleaned — significant debris found. Pressure stabilised post-clean. Impeller checked — intact.', onTime: false },
      { id: 'H-004-4', date: '31 Dec 2025', inspector: 'Ahmed K.', techId: 'AK', result: 'pass', conditionScore: 92, durationMinutes: 55, findings: 'Year-end inspection. All readings nominal. Pump running smoothly. Seals and gaskets in good condition. Lubrication applied to motor bearings.', partsUsed: ['Bearing Lubricant'], onTime: true },
      { id: 'H-004-5', date: '30 Nov 2025', inspector: 'Ahmed K.', techId: 'AK', result: 'partial', conditionScore: 88, durationMinutes: 70, findings: 'Pressure variance of ±0.3 bar first observed this service. Strainer inspected — light debris accumulation cleared. Impeller checked, no wear. Seals intact. Flagged for monitoring.', onTime: true },
      { id: 'H-004-6', date: '31 Oct 2025', inspector: 'Faisal N.', techId: 'FN', result: 'pass', conditionScore: 93, durationMinutes: 58, findings: 'Monthly inspection. All pressures nominal. Impeller visually inspected — clear. Seals checked — no leaks. Motor temperature within limits. Asset in good condition.', onTime: true },
    ],
  },
  {
    assetId: 'AST-005',
    aiInsight: 'Fire Panel FP-01 is one of the best-maintained assets on site, with 100% compliance and perfect pass results across all 6 inspections spanning nearly 3 years. Condition scores have remained above 95% throughout, reflecting the priority given to life-safety equipment. No corrective actions have been required — this asset represents the compliance standard all critical equipment should meet.',
    complianceRate: 100,
    avgDaysBetweenService: 182,
    failureFrequency: 0,
    recurringFindings: [
      { finding: 'All zone detectors tested — functional', occurrences: 6, total: 6 },
      { finding: 'Battery backup duration verified', occurrences: 6, total: 6 },
      { finding: 'Alarm sounders and strobes tested', occurrences: 6, total: 6 },
    ],
    records: [
      { id: 'H-005-1', date: '20 Sep 2025', inspector: 'Sara M.', techId: 'SM', result: 'pass', conditionScore: 97, durationMinutes: 180, findings: '6-month inspection completed. All 48 zone detectors tested and functional. Panel battery backup duration verified at 72 hours. All sounders and strobes tested. Regulatory sign-off completed.', onTime: true },
      { id: 'H-005-2', date: '22 Mar 2025', inspector: 'Sara M.', techId: 'SM', result: 'pass', conditionScore: 98, durationMinutes: 175, findings: 'Bi-annual inspection. Detector sensitivity calibrated. Manual call points tested. Control panel firmware updated to v3.2.1. All outputs verified functional.', partsUsed: ['Firmware Update Kit'], onTime: true },
      { id: 'H-005-3', date: '20 Sep 2024', inspector: 'Omar T.', techId: 'OT', result: 'pass', conditionScore: 99, durationMinutes: 165, findings: 'Full 6-month fire panel inspection. All systems passed. No faults or degradation detected. Panel in excellent condition. Next inspection due March 2025.', onTime: true },
      { id: 'H-005-4', date: '21 Mar 2024', inspector: 'Sara M.', techId: 'SM', result: 'pass', conditionScore: 98, durationMinutes: 178, findings: 'Bi-annual inspection completed. All 48 detectors functioning. Manual call points across all zones tested — all operational. Battery backup load-tested — 72-hour capacity confirmed. Regulatory checklist signed off.', onTime: true },
      { id: 'H-005-5', date: '22 Sep 2023', inspector: 'Sara M.', techId: 'SM', result: 'pass', conditionScore: 97, durationMinutes: 172, findings: '6-month inspection. Control panel diagnostics run — no fault codes. All zones active. Sounder circuit tested in all zones. Fault LED test passed. Battery checked — 12.9V open circuit voltage.', onTime: true },
      { id: 'H-005-6', date: '24 Mar 2023', inspector: 'Omar T.', techId: 'OT', result: 'pass', conditionScore: 96, durationMinutes: 160, findings: 'Annual inspection and bi-annual interim. All detectors, sounders, and manual call points tested. Control panel Earth fault checked — none detected. Panel cleaned. Sign-off documentation submitted to compliance team.', onTime: true },
    ],
  },
];

const RISK_PRIORITY: Record<string, number> = { overdue: 0, critical: 1, high: 2, medium: 3, low: 4 };
export const mockPPMRisks = [...mockPPMSchedule]
  .sort((a, b) => (RISK_PRIORITY[a.riskLevel] ?? 9) - (RISK_PRIORITY[b.riskLevel] ?? 9))
  .slice(0, 3)
  .map(p => ({ id: p.id, asset: p.asset, type: p.task, daysUntilDue: p.daysUntilDue, lastDone: p.lastDone, riskLevel: p.riskLevel }));

export const mockDispatchJobs = [
  { id: 'SI-2241', title: 'Slip Hazard — Workshop 23, Zone A', severity: 'critical', minutesAgo: 6, slaRemaining: 39, aiMatch: { tech: 'Karim R.', distance: '0.4km', reason: 'Fall Protection Certified · No parts needed' } },
  { id: 'SI-2242', title: 'Chemical Spill — Workshop 7, Zone B', severity: 'medium', minutesAgo: 14, slaRemaining: 106, aiMatch: { tech: 'Faisal N.', distance: '0.6km', reason: 'Plumbing · Tools on hand' } },
  { id: 'SI-2243', title: 'LOTO Breach — Workshop 31', severity: 'low', minutesAgo: 31, slaRemaining: 209, aiMatch: { tech: 'Sara M.', distance: '0.8km', reason: 'Electrical · Available now' } },
];

export const mockChecklist = [
  { id: 1, text: 'Visual inspection — gas detector unit exterior', mandatory: false, done: true, evidenceRequired: false },
  { id: 2, text: 'Check calibration gas pressure readings', mandatory: true, done: true, evidenceRequired: false },
  { id: 3, text: 'Clean condenser coils', mandatory: false, done: false, evidenceRequired: false },
  { id: 4, text: 'Test thermostat calibration', mandatory: true, done: false, evidenceRequired: false },
  { id: 5, text: 'Upload before & after photos of completed repair', mandatory: true, done: false, evidenceRequired: true },
];

export const mockParts = [
  { name: 'Cal-Gas-410 Calibration Gas 10kg', inStock: 0, status: 'out' },
  { name: 'Respirator Filter Type-B', inStock: 3, status: 'low' },
  { name: 'Harness Lanyard', inStock: 12, status: 'ok' },
  { name: 'Thermostat Unit', inStock: 7, status: 'ok' },
  { name: 'Copper Pipe 22mm', inStock: 2, status: 'low' },
];

export const mockLoggedInTech = {
  id: 'KR', name: 'Karim R.', role: 'Fall Protection Specialist', pin: '1234', avatar: 'KR', rating: 4.8, jobsCompleted: 142, email: 'karim.r@developmentx.ae',
};

export const mockNotifications = [
  { id: 1, type: 'critical', text: 'Slip Hazard reported — Villa 23, Silicon Oasis', sub: 'AI captured via photo · 6 min ago', read: false },
  { id: 2, type: 'warning', text: 'SLA breach warning — Hazard report #SI-298 (Omar T.)', sub: '12 min remaining before breach · 14 min ago', read: false },
  { id: 3, type: 'info', text: 'Karim R. assigned to Job #SI-2241', sub: 'GPS tracking started · En route · 18 min ago', read: false },
];

export const mockAssets = [
  { id: 'AST-001', name: 'Gas Detection Unit GD-04', type: 'Safety Equipment', location: 'Block C Gym', status: 'warning', lastService: '83 days ago', nextPPM: '8 days', condition: 72, lat: 25.1195, lng: 55.3768 },
  { id: 'AST-002', name: 'Scaffold — Block A Bay 2', type: 'Lift', location: 'Cluster A, Block 2', status: 'critical', lastService: '29 days ago', nextPPM: '2 days', condition: 58, lat: 25.1188, lng: 55.3758 },
  { id: 'AST-003', name: 'Emergency Lighting Bank EL-01', type: 'Electrical', location: 'Community Centre', status: 'ok', lastService: '12 days ago', nextPPM: '48 days', condition: 94, lat: 25.1175, lng: 55.3780 },
  { id: 'AST-004', name: 'Eyewash Station EW-02', type: 'Plumbing', location: 'Recreation Area', status: 'ok', lastService: '5 days ago', nextPPM: '25 days', condition: 89, lat: 25.1168, lng: 55.3762 },
  { id: 'AST-005', name: 'Fire Panel FP-01', type: 'Safety', location: 'Community Centre', status: 'ok', lastService: '44 days ago', nextPPM: '136 days', condition: 97, lat: 25.1172, lng: 55.3778 },
];

export const mockTasks = [
  { id: 'TSK-2241', title: 'Slip Hazard Remediation — Workshop 23', tech: 'Karim R.', status: 'in-progress', skill: 'Safety Equipment', priority: 'critical', eta: '14 min', lat: 25.1185, lng: 55.3755 },
  { id: 'TSK-2239', title: 'Plumbing Fix — Villa 7', tech: 'Ahmed K.', status: 'completed', skill: 'Plumbing', priority: 'medium', eta: 'Done', lat: 25.1160, lng: 55.3785 },
  { id: 'TSK-2242', title: 'Electrical Inspection — Villa 31', tech: 'Sara M.', status: 'assigned', skill: 'Electrical', priority: 'low', eta: '22 min', lat: 25.1170, lng: 55.3750 },
  { id: 'TSK-2243', title: 'Fall Arrest Inspection — Block 2', tech: 'Faisal N.', status: 'pending', skill: 'General', priority: 'high', eta: 'Unscheduled', lat: 25.1190, lng: 55.3762 },
];

export const mockSLAZones = [
  { id: 'SLA-001', incidentId: 'INC-SI-001', radius: 180, riskLevel: 'critical', lat: 25.1185, lng: 55.3755 },
  { id: 'SLA-002', incidentId: 'INC-SI-003', radius: 140, riskLevel: 'high', lat: 25.1195, lng: 55.3765 },
  { id: 'SLA-003', incidentId: 'INC-SI-002', radius: 100, riskLevel: 'medium', lat: 25.1160, lng: 55.3785 },
];

export const mockPredictedFailures = [
  { id: 'PRD-001', asset: 'Gas Detector GD-04', probability: 87, horizon: '4–6 days', category: 'Safety Equipment', reason: 'Calibration Gas at 72%, blockage 34%', lat: 25.1196, lng: 55.3770 },
  { id: 'PRD-002', asset: 'Scaffold Block A', probability: 73, horizon: '2–3 days', category: 'Mechanical Hazard', reason: 'Motor vibration anomaly detected', lat: 25.1190, lng: 55.3756 },
  { id: 'PRD-003', asset: 'Eyewash Station EW-02', probability: 41, horizon: '10–14 days', category: 'Chemical Safety', reason: 'Pressure variance over 5-day trend', lat: 25.1168, lng: 55.3762 },
];

export const mockKanbanTasks = [
  { id: 'KT-001', title: 'Eyewash Station Inspection', asset: 'Fume Hood Block A', location: 'Block A, Floor 2', skill: 'Safety Equipment', priority: 'high', status: 'new', tech: null, slaMinutes: 120, elapsed: 5, reportedBy: 'Worker Safety App', evidence: [] },
  { id: 'KT-002', title: 'Eyewash Heater Fault', asset: 'WH-Villa 14', location: 'Villa 14, Cluster B', skill: 'Plumbing', priority: 'medium', status: 'new', tech: null, slaMinutes: 180, elapsed: 12, reportedBy: 'WhatsApp', evidence: [] },
  { id: 'KT-003', title: 'Hazard Remediation — Workshop 23', asset: 'Gas Detector GD-04', location: 'Villa 23, Cluster A', skill: 'Safety Equipment', priority: 'critical', status: 'assigned', tech: 'Karim R.', slaMinutes: 45, elapsed: 6, reportedBy: 'AI Capture', evidence: [] },
  { id: 'KT-004', title: 'LOTO Breach — Workshop 31', asset: 'Lockout Panel', location: 'Villa 31', skill: 'Electrical', priority: 'low', status: 'assigned', tech: 'Sara M.', slaMinutes: 240, elapsed: 31, reportedBy: 'Worker Safety App', evidence: [] },
  { id: 'KT-005', title: 'Fall Arrest Inspection', asset: 'Lift-Cluster A', location: 'Cluster A, Block 2', skill: 'General', priority: 'high', status: 'in-progress', tech: 'Faisal N.', slaMinutes: 60, elapsed: 18, reportedBy: 'PPM Schedule', evidence: [] },
  { id: 'KT-006', title: 'Plumbing Fix — Villa 7', asset: 'Pipe M22', location: 'Villa 7, Cluster B', skill: 'Plumbing', priority: 'medium', status: 'in-progress', tech: 'Ahmed K.', slaMinutes: 120, elapsed: 14, reportedBy: 'AI Capture', evidence: [] },
  { id: 'KT-007', title: 'Eyewash Station Inspection', asset: 'EW-02', location: 'Recreation Area', skill: 'Plumbing', priority: 'low', status: 'awaiting-evidence', tech: 'Faisal N.', slaMinutes: 360, elapsed: 45, reportedBy: 'PPM Schedule', evidence: [] },
  { id: 'KT-008', title: 'Fire Panel Annual Check', asset: 'FP-01', location: 'Community Centre', skill: 'Safety', priority: 'high', status: 'awaiting-evidence', tech: 'Sara M.', slaMinutes: 480, elapsed: 120, reportedBy: 'Compliance', evidence: [] },
  { id: 'KT-009', title: 'PPE Cabinet Audit', asset: 'Fume Hood Lab', location: 'Block C Gym', skill: 'Safety Equipment', priority: 'medium', status: 'closed', tech: 'Karim R.', slaMinutes: 240, elapsed: 210, reportedBy: 'PPM Schedule', evidence: ['photo_before.jpg', 'photo_after.jpg'] },
  { id: 'KT-010', title: 'Emergency Call Point Repair', asset: 'IC-Main-Gate', location: 'Main Gate', skill: 'Electrical', priority: 'medium', status: 'closed', tech: 'Ahmed K.', slaMinutes: 180, elapsed: 160, reportedBy: 'Supervisor', evidence: ['intercom_photo.jpg'] },
  { id: 'KT-011', title: 'Corridor Light Fix', asset: 'Light-B3', location: 'Block B, Corridor 3', skill: 'Electrical', priority: 'low', status: 'overdue', tech: 'Omar T.', slaMinutes: 60, elapsed: 82, reportedBy: 'Worker Safety App', evidence: [] },
  { id: 'KT-012', title: 'Roof Edge Protection — Block D', asset: 'ACU-Roof-D', location: 'Block D Rooftop', skill: 'Safety Equipment', priority: 'high', status: 'overdue', tech: 'Omar T.', slaMinutes: 90, elapsed: 134, reportedBy: 'AI Capture', evidence: [] },
];

export const mockTechPerformance = {
  name: 'Karim R.',
  role: 'Fall Protection Specialist',
  id: 'KR',
  rating: 4.8,
  jobsCompleted: 142,
  jobsThisMonth: 18,
  slaSuccessRate: 94,
  avgResponseTime: 8.4,
  avgResolutionTime: 42,
  efficiency: 89,
  categories: [
    { label: 'Safety Equipment', count: 11, color: '#2E7FFF' },
    { label: 'General', count: 4, color: '#38D98A' },
    { label: 'Plumbing', count: 3, color: '#FF9B38' },
  ],
  recentJobs: [
    { id: 'SI-2241', title: 'Safety Equipment — Villa 23', status: 'in-progress', sla: 'On Track', date: 'Today' },
    { id: 'SI-2235', title: 'PPE Cabinet Audit', status: 'closed', sla: 'Met', date: 'Yesterday' },
    { id: 'SI-2228', title: 'Gas Detector Inspection', status: 'closed', sla: 'Met', date: '2 days ago' },
  ],
};

export const mockDataSources = [
  {
    id: 'DS-001', name: 'Maximo API', type: 'API', status: 'active' as const,
    lastSync: '2 min ago', lastSyncTime: '10:22 AM', volume: 1240, quality: 96,
    owner: 'IT Ops', frequency: 'Every 5 min',
    feeds: ['Work Orders', 'Assets', 'PPM Tasks'],
    errors: [] as { time: string; message: string; severity: string }[],
    description: 'Primary IBM Maximo integration — syncs all field work orders, asset records, and planned maintenance tasks in real-time.',
  },
  {
    id: 'DS-002', name: 'WhatsApp Gateway', type: 'WhatsApp', status: 'active' as const,
    lastSync: '5 min ago', lastSyncTime: '10:19 AM', volume: 340, quality: 72,
    owner: 'Operations', frequency: 'Real-time',
    feeds: ['Incidents', 'Photo evidence'],
    errors: [] as { time: string; message: string; severity: string }[],
    description: 'Captures resident-reported issues via WhatsApp and converts them to structured incidents using AI parsing.',
  },
  {
    id: 'DS-003', name: 'IoT Sensor Network', type: 'IoT', status: 'active' as const,
    lastSync: '30 sec ago', lastSyncTime: '10:23 AM', volume: 8600, quality: 99,
    owner: 'Engineering', frequency: 'Every 30 sec',
    feeds: ['Asset telemetry', 'Predicted failures'],
    errors: [] as { time: string; message: string; severity: string }[],
    description: 'Network of 86 IoT sensors across Safety Equipment units, lifts, and water systems. Feeds the predictive failure engine.',
  },
  {
    id: 'DS-004', name: 'QR Inspection Scanner', type: 'QR', status: 'active' as const,
    lastSync: '18 min ago', lastSyncTime: '10:06 AM', volume: 120, quality: 88,
    owner: 'Supervisors', frequency: 'On scan',
    feeds: ['Inspection records', 'Checklists'],
    errors: [] as { time: string; message: string; severity: string }[],
    description: 'Mobile QR code scanning for physical asset inspections. Inspectors scan on-site to log inspection results.',
  },
  {
    id: 'DS-005', name: 'Oracle ERP', type: 'External System', status: 'syncing' as const,
    lastSync: '1 hr ago', lastSyncTime: '09:24 AM', volume: 560, quality: 91,
    owner: 'Finance', frequency: 'Hourly',
    feeds: ['Vendor contracts', 'PO records', 'Cost tracking'],
    errors: [] as { time: string; message: string; severity: string }[],
    description: 'Integration with Oracle ERP for vendor management, purchase orders, and financial cost attribution.',
  },
  {
    id: 'DS-006', name: 'Worker Safety App API', type: 'API', status: 'active' as const,
    lastSync: '1 min ago', lastSyncTime: '10:23 AM', volume: 210, quality: 95,
    owner: 'Product', frequency: 'Real-time',
    feeds: ['Service requests', 'Ratings', 'Feedback'],
    errors: [] as { time: string; message: string; severity: string }[],
    description: 'Resident-facing mobile application. Submits requests, captures photos, and receives live service updates.',
  },
  {
    id: 'DS-007', name: 'ISO 45001 Audit Dashboard', type: 'External System', status: 'error' as const,
    lastSync: '3 hr ago', lastSyncTime: '07:22 AM', volume: 0, quality: 0,
    owner: 'Analytics', frequency: 'Every 6 hrs',
    feeds: ['SLA reports', 'KPI dashboards'],
    errors: [
      { time: '07:22 AM', message: 'Authentication token expired — refresh required', severity: 'error' },
      { time: '01:22 AM', message: 'Connection timeout after 30s — retry failed', severity: 'warning' },
    ],
    description: 'Microsoft Audit Dashboard integration for executive reporting. Currently experiencing authentication token issues.',
  },
];

export type VendorRiskLevel = 'Preferred' | 'Watchlist' | 'At Risk';
export type VendorTrend = 'up' | 'flat' | 'down';

/**
 * Raw input metrics for vendor scoring. `score` and `riskLevel` are NOT stored
 * here — they are derived by `computeVendorScore` / `classifyVendorRisk`.
 *
 * Scoring formula (5 dimensions, weights sum to 1.00):
 *   resolutionScore  = max(0, 100 - (avgResolutionMin - 30) * 2)
 *   costEfficiency   = max(0, min(100, 100 - (avgCostPerJob / VENDOR_PEER_AVG_COST - 1) * 200))
 *   score = round(
 *     0.35 * slaCompliance    +   // SLA compliance
 *     0.25 * firstTimeFixRate +   // first-time fix rate
 *     0.20 * resolutionScore  +   // response / resolution time
 *     0.12 * evidenceCompliance + // evidence / documentation compliance
 *     0.08 * costEfficiency       // cost efficiency vs peer average
 *   )
 *
 * Risk classification bands:
 *   Preferred  : score >= 78
 *   Watchlist  : score >= 58
 *   At Risk    : score <  58
 */
export interface VendorIntelData {
  id: string;
  name: string;
  category: string;
  trend: VendorTrend;
  slaCompliance: number;
  firstTimeFixRate: number;
  avgResolutionMin: number;
  evidenceCompliance: number;
  repeatFailureRate: number;
  avgCostPerJob: number;
  activeContracts: number;
  contractExpiry: string;
  sites: string[];
  jobsLast30d: number;
  insights: string[];
  anomaly: string | null;
  contractFlags: { type: 'breach' | 'missing' | 'warning'; description: string }[];
  predictedRisk30d: number;
  projectedTrend: VendorTrend;
  recommendations: { title: string; detail: string; action: 'reassign' | 'renegotiate' | 'review' | 'limit' }[];
  dependencyRisk: 'Low' | 'Medium' | 'High' | 'Critical';
  dependencyNote: string;
  costTrend: { month: string; cost: number; peerAvg: number }[];
  scoreTrend: { month: string; score: number }[];
  address: { street: string; city: string; country: string };
  poc: { name: string; title: string; phone: string; email: string };
}

/**
 * Peer-average cost per job (AED) across the 6-vendor portfolio.
 * Used to normalise the cost-efficiency dimension in `computeVendorScore`.
 * Value: (420 + 385 + 465 + 530 + 512 + 498) / 6 = 468.
 */
const VENDOR_PEER_AVG_COST = 468;

/**
 * Compute a vendor's composite performance score (0–100) from five raw input
 * dimensions: SLA compliance, first-time fix rate, response time, evidence
 * compliance, and cost efficiency relative to the peer average.
 *
 *   resolutionScore = max(0, 100 - (avgResolutionMin - 30) × 2)
 *   costEfficiency  = max(0, min(100, 100 − (avgCostPerJob / PEER_AVG − 1) × 200))
 *
 * A vendor at peer-average cost scores 100 on cost efficiency; one 50 % above
 * peer average scores 0; vendors below peer average are capped at 100.
 */
export function computeVendorScore(
  v: Pick<VendorIntelData, 'slaCompliance' | 'firstTimeFixRate' | 'avgResolutionMin' | 'evidenceCompliance' | 'avgCostPerJob'>,
): number {
  const resolutionScore = Math.max(0, 100 - (v.avgResolutionMin - 30) * 2);
  const costEfficiency = Math.max(0, Math.min(100, 100 - (v.avgCostPerJob / VENDOR_PEER_AVG_COST - 1) * 200));
  return Math.round(
    0.35 * v.slaCompliance +
    0.25 * v.firstTimeFixRate +
    0.20 * resolutionScore +
    0.12 * v.evidenceCompliance +
    0.08 * costEfficiency,
  );
}

/**
 * Classify a vendor into a risk tier based on their computed score.
 *   Preferred : score >= 78
 *   Watchlist : score >= 58
 *   At Risk   : score <  58
 */
export function classifyVendorRisk(score: number): VendorRiskLevel {
  if (score >= 78) return 'Preferred';
  if (score >= 58) return 'Watchlist';
  return 'At Risk';
}

export const mockVendorIntelligence: VendorIntelData[] = [
  {
    id: 'VND-001',
    name: 'DevelopmentX Core',
    category: 'FM & Safety Equipment',
    trend: 'up',
    slaCompliance: 96,
    firstTimeFixRate: 91,
    avgResolutionMin: 38,
    evidenceCompliance: 95,
    repeatFailureRate: 4,
    avgCostPerJob: 420,
    activeContracts: 3,
    contractExpiry: 'Dec 2026',
    sites: ['Silicon Oasis', 'Gate Avenue', 'DIFC Tower'],
    jobsLast30d: 187,
    insights: [
      'SLA compliance at 96% is the highest across all active vendors — consistent delivery on critical and high-severity jobs.',
      'First-time fix rate of 91% reflects strong diagnostic capability; repeat visits are rare and concentrated in complex safety hazards.',
      'Evidence compliance at 95% indicates reliable documentation; before/after photos submitted on 95% of closed jobs.',
      'Average cost per job of AED 420 is 18% below peer average — strong cost efficiency without compromising quality.',
    ],
    anomaly: null,
    contractFlags: [],
    predictedRisk30d: 8,
    projectedTrend: 'up',
    recommendations: [
      { title: 'Expand scope to Business Bay', detail: 'Performance data supports extending DevelopmentX Core\'s safety scope to Business Bay cluster — projected to reduce response time by 22%.', action: 'renegotiate' },
      { title: 'Maintain current SLA terms', detail: 'No renegotiation required — vendor is consistently outperforming SLA targets across all three managed sites.', action: 'review' },
    ],
    dependencyRisk: 'Medium',
    dependencyNote: '3 sites depend on this vendor — a performance drop would impact 58% of managed sites.',
    address: { street: 'Building 7, Dubai Silicon Oasis', city: 'Dubai', country: 'UAE' },
    poc: { name: 'Khalid Al Mansoori', title: 'Operations Director', phone: '+971 50 111 2233', email: 'k.mansoori@developmentxcore.ae' },
    costTrend: [
      { month: 'Nov', cost: 435, peerAvg: 510 },
      { month: 'Dec', cost: 428, peerAvg: 508 },
      { month: 'Jan', cost: 422, peerAvg: 505 },
      { month: 'Feb', cost: 418, peerAvg: 502 },
      { month: 'Mar', cost: 420, peerAvg: 500 },
      { month: 'Apr', cost: 415, peerAvg: 498 },
    ],
    scoreTrend: [
      { month: 'Nov', score: 82 },
      { month: 'Dec', score: 84 },
      { month: 'Jan', score: 85 },
      { month: 'Feb', score: 86 },
      { month: 'Mar', score: 87 },
      { month: 'Apr', score: 88 },
    ],
  },
  {
    id: 'VND-002',
    name: 'Muscat FM',
    category: 'General Safety & PPE',
    trend: 'up',
    slaCompliance: 88,
    firstTimeFixRate: 84,
    avgResolutionMin: 44,
    evidenceCompliance: 91,
    repeatFailureRate: 6,
    avgCostPerJob: 385,
    activeContracts: 2,
    contractExpiry: 'Mar 2027',
    sites: ['JLT North', 'Business Bay'],
    jobsLast30d: 94,
    insights: [
      'Score has improved 8 points over 6 months — driven by targeted improvements in evidence compliance and response time.',
      'SLA compliance at 88% is above vendor average but trails the top performer by 8 percentage points.',
      'Cost per job of AED 385 is the most competitive across all preferred vendors — consistent cost efficiency.',
      'Evidence compliance improved from 81% to 91% following a corrective action plan introduced in Q1.',
    ],
    anomaly: null,
    contractFlags: [
      { type: 'warning', description: 'Contract renewal due in 11 months — initiate renegotiation review by Q3 to secure current rate.' },
    ],
    predictedRisk30d: 12,
    projectedTrend: 'up',
    recommendations: [
      { title: 'Lock in multi-year renewal', detail: 'Current rate of AED 385/job is the most competitive in portfolio. A 2-year renewal agreement would protect against market rate increases.', action: 'renegotiate' },
      { title: 'Extend scope to safety inspections', detail: 'Muscat FM\'s safety compliance track record supports taking on additional fire panel and safety walk scope.', action: 'review' },
    ],
    dependencyRisk: 'Low',
    dependencyNote: '2 sites covered — moderate dependency. Alternate vendors available for both sites if needed.',
    address: { street: 'Office 204, Al Moosa Tower 2, Sheikh Zayed Road', city: 'Dubai', country: 'UAE' },
    poc: { name: 'Fatima Al Rashidi', title: 'Account Manager', phone: '+971 55 344 7821', email: 'f.rashidi@muscatfm.ae' },
    costTrend: [
      { month: 'Nov', cost: 400, peerAvg: 510 },
      { month: 'Dec', cost: 395, peerAvg: 508 },
      { month: 'Jan', cost: 392, peerAvg: 505 },
      { month: 'Feb', cost: 388, peerAvg: 502 },
      { month: 'Mar', cost: 385, peerAvg: 500 },
      { month: 'Apr', cost: 385, peerAvg: 498 },
    ],
    scoreTrend: [
      { month: 'Nov', score: 74 },
      { month: 'Dec', score: 76 },
      { month: 'Jan', score: 78 },
      { month: 'Feb', score: 79 },
      { month: 'Mar', score: 81 },
      { month: 'Apr', score: 82 },
    ],
  },
  {
    id: 'VND-003',
    name: 'Emrill FM',
    category: 'HSE & Electrical Safety',
    trend: 'flat',
    slaCompliance: 85,
    firstTimeFixRate: 80,
    avgResolutionMin: 47,
    evidenceCompliance: 88,
    repeatFailureRate: 7,
    avgCostPerJob: 465,
    activeContracts: 2,
    contractExpiry: 'Jun 2026',
    sites: ['Silicon Oasis', 'Dubai Marina'],
    jobsLast30d: 112,
    insights: [
      'Performance score of 76 has been stable for 4 consecutive months — no significant improvement or decline.',
      'SLA compliance at 85% is adequate but 11 points below the top vendor; performance plateau may indicate resource ceiling.',
      'Cost per job of AED 465 is 7% above peer average — marginal premium without proportional performance advantage.',
      'Evidence compliance at 88% is consistent; electrical safety jobs maintain 100% photo evidence rate.',
    ],
    anomaly: null,
    contractFlags: [
      { type: 'warning', description: 'Contract expires in 2 months — renewal or replacement decision required urgently.' },
      { type: 'missing', description: 'Q4 2025 performance review report not submitted per contract clause 8.3.' },
    ],
    predictedRisk30d: 18,
    projectedTrend: 'flat',
    recommendations: [
      { title: 'Renegotiate cost rate at renewal', detail: 'AED 465/job is above market rate for the services delivered. Benchmark shows Muscat FM delivers comparable quality at 17% lower cost.', action: 'renegotiate' },
      { title: 'Request missing performance report', detail: 'Q4 2025 performance report is contractually required per clause 8.3. Issue formal notice and request submission within 14 days.', action: 'review' },
    ],
    dependencyRisk: 'Medium',
    dependencyNote: 'Silicon Oasis electrical scope primarily covered by this vendor — dependency risk if contract lapses.',
    address: { street: 'Unit 3, Al Quoz Industrial Area 2', city: 'Dubai', country: 'UAE' },
    poc: { name: 'Mohammed Saeed', title: 'Senior Contracts Manager', phone: '+971 52 908 6641', email: 'm.saeed@emrillfm.ae' },
    costTrend: [
      { month: 'Nov', cost: 462, peerAvg: 510 },
      { month: 'Dec', cost: 465, peerAvg: 508 },
      { month: 'Jan', cost: 468, peerAvg: 505 },
      { month: 'Feb', cost: 465, peerAvg: 502 },
      { month: 'Mar', cost: 466, peerAvg: 500 },
      { month: 'Apr', cost: 465, peerAvg: 498 },
    ],
    scoreTrend: [
      { month: 'Nov', score: 77 },
      { month: 'Dec', score: 76 },
      { month: 'Jan', score: 75 },
      { month: 'Feb', score: 76 },
      { month: 'Mar', score: 76 },
      { month: 'Apr', score: 76 },
    ],
  },
  {
    id: 'VND-004',
    name: 'Belhasa Eng.',
    category: 'Safety Engineering & Civil',
    trend: 'up',
    slaCompliance: 80,
    firstTimeFixRate: 75,
    avgResolutionMin: 52,
    evidenceCompliance: 82,
    repeatFailureRate: 9,
    avgCostPerJob: 530,
    activeContracts: 1,
    contractExpiry: 'Sep 2026',
    sites: ['Business Bay'],
    jobsLast30d: 58,
    insights: [
      'Score improved from 63 to 70 over 3 months — upward trend driven by response time improvements after a coaching intervention.',
      'SLA compliance at 80% is below the preferred threshold — 3 SLA breaches recorded in the last 30 days.',
      'Cost per job of AED 530 is the highest in the vendor portfolio — performance does not currently justify the premium.',
      'Evidence compliance at 82% leaves a notable gap; 18% of engineering jobs closed without complete documentation.',
    ],
    anomaly: '3 SLA breaches in last 30 days — elevated breach rate for HSE Inspections scope. Monitor trend.',
    contractFlags: [
      { type: 'breach', description: '3 SLA breaches recorded in March — triggers performance improvement clause (Clause 11.2).' },
      { type: 'missing', description: 'Monthly progress report for February not submitted — now 6 weeks overdue.' },
    ],
    predictedRisk30d: 28,
    projectedTrend: 'up',
    recommendations: [
      { title: 'Issue performance improvement notice', detail: '3 SLA breaches triggers Clause 11.2 — formal notice must be issued within 30 days. Set 60-day improvement window with measurable KPI targets.', action: 'review' },
      { title: 'Limit scope to civil works only', detail: 'Redirect M&E tasks to Emrill FM or DevelopmentX Core. Engineering-only scope better aligns with Belhasa\'s demonstrated competency.', action: 'limit' },
      { title: 'Renegotiate day rate at next review', detail: 'AED 530/job is not justified by current performance. Benchmark shows Emrill FM delivers comparable engineering services at AED 465.', action: 'renegotiate' },
    ],
    dependencyRisk: 'Low',
    dependencyNote: 'Single site coverage — Business Bay. Alternate engineering vendor available if required.',
    address: { street: 'Warehouse 12, Ras Al Khor Industrial Area', city: 'Dubai', country: 'UAE' },
    poc: { name: 'Ahmed Belhasa', title: 'Project Director', phone: '+971 50 782 3394', email: 'a.belhasa@belhasa-eng.ae' },
    costTrend: [
      { month: 'Nov', cost: 545, peerAvg: 510 },
      { month: 'Dec', cost: 540, peerAvg: 508 },
      { month: 'Jan', cost: 535, peerAvg: 505 },
      { month: 'Feb', cost: 532, peerAvg: 502 },
      { month: 'Mar', cost: 530, peerAvg: 500 },
      { month: 'Apr', cost: 530, peerAvg: 498 },
    ],
    scoreTrend: [
      { month: 'Nov', score: 63 },
      { month: 'Dec', score: 65 },
      { month: 'Jan', score: 67 },
      { month: 'Feb', score: 68 },
      { month: 'Mar', score: 69 },
      { month: 'Apr', score: 70 },
    ],
  },
  {
    id: 'VND-005',
    name: 'TechServ ME',
    category: 'MEP & Systems',
    trend: 'down',
    slaCompliance: 72,
    firstTimeFixRate: 70,
    avgResolutionMin: 62,
    evidenceCompliance: 78,
    repeatFailureRate: 12,
    avgCostPerJob: 488,
    activeContracts: 1,
    contractExpiry: 'Nov 2026',
    sites: ['JLT North'],
    jobsLast30d: 43,
    insights: [
      'Score has declined 9 points over 3 months — persistent SLA breaches and rising repeat failure rate driving the decline.',
      'SLA compliance at 72% means 1 in 4 jobs is delivered late; the breach rate has worsened month-on-month for 3 consecutive periods.',
      'Repeat failure rate of 12% is the second highest in the portfolio — root cause analysis not yet submitted.',
      'Response time averaging 62 minutes is 64% above the preferred 38-minute benchmark.',
    ],
    anomaly: 'Score declining 3 consecutive months — SLA breaches increasing. Escalation recommended.',
    contractFlags: [
      { type: 'breach', description: '8 SLA breaches in last period — threshold for contract review clause triggered (Clause 9.1).' },
      { type: 'breach', description: 'Root cause analysis for repeat failures not submitted per Clause 10.4 requirement.' },
      { type: 'warning', description: 'Cost per job has risen 8% in 6 months without performance improvement.' },
    ],
    predictedRisk30d: 38,
    projectedTrend: 'down',
    recommendations: [
      { title: 'Trigger formal vendor review', detail: 'Declining score over 3 consecutive periods triggers the mandatory vendor review clause. Schedule formal review meeting within 21 days with clear KPI targets.', action: 'review' },
      { title: 'Reassign MEP scope to Emrill FM', detail: 'Consider transitioning 50% of JLT North MEP jobs to Emrill FM as a risk mitigation measure while the review is underway.', action: 'reassign' },
      { title: 'Request root cause analysis immediately', detail: '12% repeat failure rate with no root cause report is a contract breach. Issue 7-day notice for submission — failure to respond escalates to contract termination proceedings.', action: 'review' },
    ],
    dependencyRisk: 'Medium',
    dependencyNote: 'Primary MEP vendor for JLT North — transition to alternate vendor would take 4–6 weeks.',
    address: { street: 'Office 18B, Latifa Tower, Sheikh Zayed Road', city: 'Dubai', country: 'UAE' },
    poc: { name: 'Tariq Hassan', title: 'Service Delivery Manager', phone: '+971 56 221 4477', email: 't.hassan@techservme.ae' },
    costTrend: [
      { month: 'Nov', cost: 452, peerAvg: 510 },
      { month: 'Dec', cost: 460, peerAvg: 508 },
      { month: 'Jan', cost: 468, peerAvg: 505 },
      { month: 'Feb', cost: 474, peerAvg: 502 },
      { month: 'Mar', cost: 482, peerAvg: 500 },
      { month: 'Apr', cost: 488, peerAvg: 498 },
    ],
    scoreTrend: [
      { month: 'Nov', score: 70 },
      { month: 'Dec', score: 68 },
      { month: 'Jan', score: 66 },
      { month: 'Feb', score: 64 },
      { month: 'Mar', score: 62 },
      { month: 'Apr', score: 61 },
    ],
  },
  {
    id: 'VND-006',
    name: 'Farnek Serv.',
    category: 'Hygiene & Soft Safety',
    trend: 'down',
    slaCompliance: 63,
    firstTimeFixRate: 62,
    avgResolutionMin: 71,
    evidenceCompliance: 68,
    repeatFailureRate: 15,
    avgCostPerJob: 310,
    activeContracts: 2,
    contractExpiry: 'Aug 2026',
    sites: ['Gate Avenue', 'Downtown'],
    jobsLast30d: 76,
    insights: [
      'Score of 52 is critically below the Watchlist threshold — this vendor is At Risk and requires immediate intervention.',
      'SLA compliance at 63% means over one-third of all jobs are delivered late — the worst performance in the active vendor portfolio.',
      'Evidence compliance at 68% is the lowest across all vendors; nearly 1 in 3 jobs closed without required documentation.',
      'Repeat failure rate of 15% indicates systematic quality issues — the same faults are recurring without permanent resolution.',
    ],
    anomaly: 'CRITICAL: Score below 55 for 2 consecutive months. 11 SLA breaches in last period. Immediate contract review required.',
    contractFlags: [
      { type: 'breach', description: '11 SLA breaches in last period — far exceeds the 5-breach contract threshold (Clause 9.1).' },
      { type: 'breach', description: 'Evidence compliance below 70% for 3 consecutive months — breach of Clause 12.1 documentation requirements.' },
      { type: 'missing', description: 'Q1 2026 self-assessment report not submitted — overdue by 8 weeks.' },
      { type: 'warning', description: 'Contract expiry in 4 months — replacement vendor sourcing should begin immediately given risk level.' },
    ],
    predictedRisk30d: 58,
    projectedTrend: 'down',
    recommendations: [
      { title: 'Trigger immediate contract review', detail: 'Multiple contract clauses in breach. Issue formal notice under Clause 9.1 and schedule a review meeting within 14 days with executive attendance.', action: 'review' },
      { title: 'Reassign Gate Avenue scope', detail: 'Transition Gate Avenue soft FM scope to Muscat FM within 30 days. Gate Avenue represents higher-visibility client — risk of client satisfaction impact is significant.', action: 'reassign' },
      { title: 'Begin replacement vendor sourcing', detail: 'With contract expiry in 4 months and At Risk status, begin RFP for replacement vendor immediately. Shortlist at least 2 alternates.', action: 'renegotiate' },
      { title: 'Limit active job allocation', detail: 'Cap new job assignments to Farnek to essential soft FM only while review proceeds. Do not assign any hard FM or compliance-critical tasks.', action: 'limit' },
    ],
    dependencyRisk: 'High',
    dependencyNote: 'Covers 2 sites for soft FM. No ready alternate for full-scope replacement — transition risk is significant without 60-day notice.',
    address: { street: 'P.O. Box 37848, Al Garhoud', city: 'Dubai', country: 'UAE' },
    poc: { name: 'Layla Al Farsi', title: 'Client Relations Manager', phone: '+971 50 663 9102', email: 'l.alfarsi@farnekserv.ae' },
    costTrend: [
      { month: 'Nov', cost: 298, peerAvg: 510 },
      { month: 'Dec', cost: 302, peerAvg: 508 },
      { month: 'Jan', cost: 305, peerAvg: 505 },
      { month: 'Feb', cost: 308, peerAvg: 502 },
      { month: 'Mar', cost: 310, peerAvg: 500 },
      { month: 'Apr', cost: 310, peerAvg: 498 },
    ],
    scoreTrend: [
      { month: 'Nov', score: 62 },
      { month: 'Dec', score: 59 },
      { month: 'Jan', score: 57 },
      { month: 'Feb', score: 55 },
      { month: 'Mar', score: 53 },
      { month: 'Apr', score: 52 },
    ],
  },
];

export const mockBenchmarkData = {
  sites: [
    { name: 'Silicon Oasis', sla: 94, incidents: 47, compliance: 94 },
    { name: 'Gate Avenue',   sla: 88, incidents: 31, compliance: 88 },
    { name: 'Business Bay',  sla: 91, incidents: 52, compliance: 91 },
    { name: 'JLT North',     sla: 79, incidents: 63, compliance: 79 },
    { name: 'DIFC Tower',    sla: 96, incidents: 18, compliance: 96 },
  ],
  vendors: [
    { name: 'DevelopmentX Core',  slaBreaches: 2,  avgResolution: 38, repeatFailure: 4,  rating: 4.8 },
    { name: 'TechServ ME',  slaBreaches: 8,  avgResolution: 62, repeatFailure: 12, rating: 3.9 },
    { name: 'Emrill FM',    slaBreaches: 5,  avgResolution: 47, repeatFailure: 7,  rating: 4.2 },
    { name: 'Farnek Serv.', slaBreaches: 11, avgResolution: 71, repeatFailure: 15, rating: 3.6 },
  ],
  regions: [
    { name: 'Dubai East',    incidentDensity: 4.2, riskScore: 68, trend: +12 },
    { name: 'Dubai Marina',  incidentDensity: 2.1, riskScore: 42, trend: -8  },
    { name: 'Downtown',      incidentDensity: 6.8, riskScore: 81, trend: +24 },
    { name: 'Jumeirah',      incidentDensity: 1.4, riskScore: 31, trend: -3  },
    { name: 'Business Bay',  incidentDensity: 5.3, riskScore: 74, trend: +18 },
  ],
};

export const mockReplayEvents = [
  { id: 'EV-001', time: '09:00', minute: 0,  type: 'incident',      entity: 'INC-SI-004', title: 'LOTO Breach reported — Villa 31', severity: 'low',      lat: 25.1170, lng: 55.3750 },
  { id: 'EV-002', time: '09:02', minute: 2,  type: 'assignment',    entity: 'INC-SI-004', title: 'Sara M. dispatched — Electrical', severity: 'info',    lat: 25.1165, lng: 55.3790 },
  { id: 'EV-003', time: '09:08', minute: 8,  type: 'incident',      entity: 'INC-SI-001', title: 'Slip Hazard reported — Villa 23 · AI Capture', severity: 'critical', lat: 25.1185, lng: 55.3755 },
  { id: 'EV-004', time: '09:10', minute: 10, type: 'assignment',    entity: 'INC-SI-001', title: 'Karim R. dispatched — Safety Equipment · 0.4 km', severity: 'info', lat: 25.1180, lng: 55.3740 },
  { id: 'EV-005', time: '09:16', minute: 16, type: 'task-update',   entity: 'TSK-2241',   title: 'Karim R. arrived on-site — Villa 23', severity: 'info', lat: 25.1185, lng: 55.3755 },
  { id: 'EV-006', time: '09:22', minute: 22, type: 'incident',      entity: 'INC-SI-003', title: 'Scaffold Defect reported — Block C', severity: 'high',        lat: 25.1195, lng: 55.3765 },
  { id: 'EV-007', time: '09:25', minute: 25, type: 'sla-escalation',entity: 'INC-SI-003', title: 'SLA warning — Scaffold Defect · 35 min remaining', severity: 'warning', lat: 25.1195, lng: 55.3765 },
  { id: 'EV-008', time: '09:30', minute: 30, type: 'assignment',    entity: 'INC-SI-003', title: 'Faisal N. dispatched — General · 0.8 km', severity: 'info', lat: 25.1155, lng: 55.3800 },
  { id: 'EV-009', time: '09:41', minute: 41, type: 'task-update',   entity: 'TSK-2241',   title: 'Repair in progress — Safety Equipment Villa 23', severity: 'info',    lat: 25.1185, lng: 55.3755 },
  { id: 'EV-010', time: '09:54', minute: 54, type: 'closure',       entity: 'TSK-2241',   title: 'Job closed — Safety Equipment Villa 23 · SLA Met ✓', severity: 'success', lat: 25.1185, lng: 55.3755 },
  { id: 'EV-011', time: '10:02', minute: 62, type: 'sla-escalation',entity: 'INC-SI-002', title: 'SLA breached — Chemical Spill Villa 7', severity: 'error',   lat: 25.1160, lng: 55.3785 },
  { id: 'EV-012', time: '10:06', minute: 66, type: 'incident',      entity: 'INC-SI-002', title: 'Chemical Spill escalated — Cluster B', severity: 'medium',   lat: 25.1160, lng: 55.3785 },
  { id: 'EV-013', time: '10:14', minute: 74, type: 'incident',      entity: 'INC-SI-005', title: 'New hazard report — Workshop 23 · Worker Safety App', severity: 'critical', lat: 25.1185, lng: 55.3755 },
  { id: 'EV-014', time: '10:16', minute: 76, type: 'assignment',    entity: 'INC-SI-005', title: 'Karim R. re-dispatched · ETA 18 min', severity: 'info',  lat: 25.1180, lng: 55.3740 },
];

export const mockAiClassification = {
  category: 'AC / Safety Equipment',
  subCategory: 'Calibration Gas / Cooling Failure',
  confidence: 94,
  priority: 'critical' as const,
  slaWindow: '2 hours',
  reasoning:
    'Frost pattern on evaporator coil detected. Compressor vibration signature visible in photo metadata. Consistent with low calibration gas pressure.',
  signals: [
    { label: 'Visual signal', value: 'Frost on coil unit', match: 97 },
    { label: 'Pattern match', value: 'Cal-Gas-410 shortage profile', match: 91 },
    { label: 'Asset history', value: 'Last serviced 83 days ago', match: 88 },
  ],
};

export const mockSmartDispatch = [
  {
    incidentId: 'INC-SI-001',
    incidentTitle: 'Slip Hazard — Workshop 23, Zone A',
    severity: 'critical',
    slaRemaining: 39,
    recommendations: [
      { tech: 'Karim R.', techId: 'KR', skill: 'Safety Equipment', distance: '0.4 km', eta: '4 min', skillMatch: 98, availability: 'en-route', reason: 'Fall protection certified · Nearest available · No parts needed' },
      { tech: 'Ahmed K.', techId: 'AK', skill: 'Plumbing', distance: '1.1 km', eta: '9 min', skillMatch: 52, availability: 'busy', reason: 'Partial skill match · Currently on another job' },
    ],
  },
  {
    incidentId: 'INC-SI-002',
    incidentTitle: 'Chemical Spill — Workshop 7, Zone B',
    severity: 'medium',
    slaRemaining: 106,
    recommendations: [
      { tech: 'Faisal N.', techId: 'FN', skill: 'Plumbing', distance: '0.6 km', eta: '6 min', skillMatch: 100, availability: 'available', reason: 'Plumbing specialist · Tools on hand · Fully available' },
      { tech: 'Ahmed K.', techId: 'AK', skill: 'Plumbing', distance: '0.9 km', eta: '8 min', skillMatch: 95, availability: 'busy', reason: 'Strong match · Currently finishing Job SI-301' },
    ],
  },
  {
    incidentId: 'INC-SI-003',
    incidentTitle: 'Scaffold Defect — Block C',
    severity: 'high',
    slaRemaining: 38,
    recommendations: [
      { tech: 'Sara M.', techId: 'SM', skill: 'Electrical', distance: '0.8 km', eta: '7 min', skillMatch: 85, availability: 'available', reason: 'Electrical systems certified · Fully available · High rating' },
    ],
  },
];

export const mockAICaptures = [
  {
    id: 'AIC-001', category: 'Safety Equipment', subCategory: 'Slip Hazard Detected',
    title: 'Wet-Floor Pattern at Workshop Entrance', location: 'Workshop 23, Zone A',
    severity: 'critical', confidence: 94, source: 'Worker Safety App Photo',
    capturedAt: '10:08 AM', status: 'confirmed' as const,
    linkedIncident: 'INC-SI-001', linkedJob: 'KT-003',
    signals: [
      { label: 'Coolant pooling on workshop floor', match: 97 },
      { label: 'Pedestrian path proximity', match: 91 },
      { label: 'No warning signage detected', match: 88 },
    ],
    gradient: 'from-[#0a1f3a] to-[#061428]',
    boxColor: '#00C6FF',
  },
  {
    id: 'AIC-002', category: 'Chemical Safety', subCategory: 'Chemical Container Leak',
    title: 'Solvent Pooling Under Workbench', location: 'Workshop 7, Zone B',
    severity: 'medium', confidence: 81, source: 'Worker Safety App Photo',
    capturedAt: '10:10 AM', status: 'pending' as const,
    linkedIncident: 'INC-SI-002', linkedJob: null,
    signals: [
      { label: 'Liquid accumulation pattern', match: 89 },
      { label: 'Drum-seal drip trajectory', match: 76 },
      { label: 'Solvent vapour markers', match: 64 },
    ],
    gradient: 'from-[#0f1e30] to-[#071522]',
    boxColor: '#2E7FFF',
  },
  {
    id: 'AIC-003', category: 'Mechanical Hazard', subCategory: 'Hoist Motor Anomaly',
    title: 'Scaffold Tagged Out — Floor Gap Detected', location: 'Block C, Lift 2',
    severity: 'high', confidence: 88, source: 'IoT Sensor Alert',
    capturedAt: '09:58 AM', status: 'confirmed' as const,
    linkedIncident: 'INC-SI-003', linkedJob: 'KT-005',
    signals: [
      { label: 'Scaffold tag missing', match: 93 },
      { label: 'Edge-gap detected on Bay 2', match: 86 },
      { label: 'Historical fall-arrest fault pattern', match: 79 },
    ],
    gradient: 'from-[#1a1208] to-[#0d0b04]',
    boxColor: '#FF9B38',
  },
  {
    id: 'AIC-004', category: 'Electrical Safety', subCategory: 'Lockout Override',
    title: 'Repeated Lockout Override — Villa 31', location: 'Villa 31',
    severity: 'low', confidence: 72, source: 'Worker Safety App Photo',
    capturedAt: '09:49 AM', status: 'confirmed' as const,
    linkedIncident: 'INC-SI-004', linkedJob: 'KT-004',
    signals: [
      { label: 'Trip pattern frequency', match: 78 },
      { label: 'Panel heat signature', match: 69 },
      { label: 'Load profile anomaly', match: 61 },
    ],
    gradient: 'from-[#0f1a2e] to-[#06101e]',
    boxColor: '#38D98A',
  },
  {
    id: 'AIC-005', category: 'Chemical Safety', subCategory: 'Eyewash Station Vibration',
    title: 'Eyewash Station Grinding Noise Detected', location: 'Recreation Area',
    severity: 'low', confidence: 67, source: 'IoT Acoustic Sensor',
    capturedAt: '10:12 AM', status: 'pending' as const,
    linkedIncident: 'INC-SI-006', linkedJob: null,
    signals: [
      { label: 'Acoustic anomaly frequency', match: 71 },
      { label: 'Vibration baseline deviation', match: 64 },
      { label: 'Bearing wear signature', match: 58 },
    ],
    gradient: 'from-[#071a14] to-[#041010]',
    boxColor: '#38D98A',
  },
  {
    id: 'AIC-006', category: 'Safety Equipment', subCategory: 'Respirator Filter Blockage',
    title: 'Fume Hood Filter Discolouration — Block A', location: 'Block A, Floor 2',
    severity: 'medium', confidence: 85, source: 'QR Scan Photo',
    capturedAt: '09:30 AM', status: 'pending' as const,
    linkedIncident: null, linkedJob: 'KT-001',
    signals: [
      { label: 'Filter colour deviation', match: 91 },
      { label: 'Airflow restriction indicator', match: 82 },
      { label: 'PPM schedule overdue 14 days', match: 78 },
    ],
    gradient: 'from-[#0a1628] to-[#060e1a]',
    boxColor: '#00C6FF',
  },
  {
    id: 'AIC-007', category: 'PPE & Hazard', subCategory: 'Corridor Hazard',
    title: 'Spill Detected — Block B Corridor', location: 'Block B, Corridor 3',
    severity: 'medium', confidence: 79, source: 'Hazard Detection AI Module',
    capturedAt: '09:15 AM', status: 'rejected' as const,
    linkedIncident: null, linkedJob: null,
    signals: [
      { label: 'Floor reflectance anomaly', match: 82 },
      { label: 'Slip hazard classification', match: 74 },
      { label: 'Area foot traffic context', match: 61 },
    ],
    gradient: 'from-[#1a0a0a] to-[#0d0404]',
    boxColor: '#FF4B4B',
  },
  {
    id: 'AIC-008', category: 'Safety Equipment', subCategory: 'Hazardous Gas Leak',
    title: 'Oily Residue Near Compressor Unit', location: 'Roof — Block D',
    severity: 'high', confidence: 83, source: 'Inspector Photo',
    capturedAt: '08:55 AM', status: 'pending' as const,
    linkedIncident: null, linkedJob: 'KT-012',
    signals: [
      { label: 'Calibration Gas residue pattern', match: 87 },
      { label: 'Compressor surface analysis', match: 81 },
      { label: 'Thermal imaging correlation', match: 74 },
    ],
    gradient: 'from-[#0a1628] to-[#050d1a]',
    boxColor: '#FF9B38',
  },
  {
    id: 'AIC-009', category: 'Electrical Safety', subCategory: 'Emergency Light Failure',
    title: 'Multiple Corridor Lights Out — Block B', location: 'Block B, Corridor 3',
    severity: 'low', confidence: 96, source: 'Hazard Detection AI Module',
    capturedAt: '08:40 AM', status: 'confirmed' as const,
    linkedIncident: null, linkedJob: 'KT-011',
    signals: [
      { label: 'Luminance zone failure', match: 98 },
      { label: 'Circuit fault identifier', match: 94 },
      { label: 'Ballast failure pattern', match: 88 },
    ],
    gradient: 'from-[#0f1525] to-[#080c18]',
    boxColor: '#2E7FFF',
  },
];

export interface PortfolioDataSource {
  label: string;
  count: number;
}

export interface PortfolioClientPerson {
  name: string;
  role: string;
  initials: string;
  status: 'available' | 'on-site' | 'off-duty' | 'transit';
  skill?: string;
  jobsThisMonth?: number;
  slaRate?: number;
}

export interface PortfolioClientResources {
  budgetUsed: number;
  budgetTotal: number;
  fleet: { label: string; available: number; total: number }[];
  partsStock: { name: string; qty: number; status: 'ok' | 'low' | 'out' }[];
  equipment: { name: string; condition: number; nextService: string }[];
}

export interface PortfolioClientContract {
  number: string;
  tier: 'Platinum' | 'Gold' | 'Silver' | 'Standard';
  startDate: string;
  endDate: string;
  renewalDate: string;
  annualValue: string;
  penalties: string;
  responseTimes: { severity: string; target: string }[];
  vendorManager: string;
  notes: string;
}

export interface PortfolioClient {
  id: string;
  name: string;
  status: 'live' | 'warning' | 'critical';
  region: string;
  sector: string;
  sites: number;
  workOrders: number;
  incidents: number;
  sla: number;
  compliance: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  overdueTasks: number;
  dataSources: PortfolioDataSource[];
  aiInsight: string;
  lastUpdated: string;
  topSites: { name: string; status: 'ok' | 'warning' | 'critical'; incidents: number }[];
  recentActivity: { time: string; event: string; type: string }[];
  people: {
    accountManager: PortfolioClientPerson;
    fmManager: PortfolioClientPerson;
    supervisors: PortfolioClientPerson[];
    inspectors: PortfolioClientPerson[];
  };
  resources: PortfolioClientResources;
  contract: PortfolioClientContract;
  lat?: number;
  lng?: number;
  marketLabel?: string;
}

export const mockPortfolioClients: PortfolioClient[] = [
  {
    id: 'CLT-001',
    name: 'Dubai Silicon Oasis',
    status: 'live',
    region: 'Dubai East',
    sector: 'Mixed-Use Workplace',
    sites: 14,
    workOrders: 47,
    incidents: 3,
    sla: 94,
    compliance: 98,
    riskLevel: 'low',
    overdueTasks: 1,
    dataSources: [
      { label: 'Maximo API', count: 1240 },
      { label: 'IoT Sensors', count: 86 },
      { label: 'Worker Safety App', count: 210 },
    ],
    aiInsight: 'All critical assets within SLA. Gas Detector GD-04 flagged for proactive service within 6 days.',
    lastUpdated: '2 min ago',
    topSites: [
      { name: 'Cluster A — Villas', status: 'warning', incidents: 2 },
      { name: 'Block C — Towers', status: 'ok', incidents: 1 },
      { name: 'Recreation Centre', status: 'ok', incidents: 0 },
    ],
    recentActivity: [
      { time: '10:22 AM', event: 'Slip Hazard resolved — Villa 23', type: 'task' },
      { time: '09:45 AM', event: 'IoT anomaly: Eyewash Station vibration flagged', type: 'ai' },
      { time: '09:10 AM', event: 'SLA met: scaffold defect closed in 58 min', type: 'ok' },
    ],
    people: {
      accountManager: { name: 'Rania Al-Farsi', role: 'Account Manager', initials: 'RA', status: 'available' },
      fmManager: { name: 'Hassan Yousef', role: 'HSE Manager', initials: 'HY', status: 'on-site' },
      supervisors: [
        { name: 'Tariq Mansour', role: 'Site Supervisor', initials: 'TM', status: 'on-site', skill: 'Fall Protection & Electrical Safety' },
        { name: 'Layla Nour', role: 'Compliance Lead', initials: 'LN', status: 'available', skill: 'Safety & Inspections' },
      ],
      inspectors: [
        { name: 'Karim R.', role: 'Fall Protection Specialist', initials: 'KR', status: 'on-site', skill: 'Safety Equipment', jobsThisMonth: 18, slaRate: 94 },
        { name: 'Ahmed K.', role: 'Plumber', initials: 'AK', status: 'transit', skill: 'Plumbing', jobsThisMonth: 12, slaRate: 91 },
        { name: 'Sara M.', role: 'Electrician', initials: 'SM', status: 'available', skill: 'Electrical', jobsThisMonth: 15, slaRate: 97 },
        { name: 'Faisal N.', role: 'General Tech', initials: 'FN', status: 'on-site', skill: 'General', jobsThisMonth: 10, slaRate: 88 },
      ],
    },
    resources: {
      budgetUsed: 820000,
      budgetTotal: 1100000,
      fleet: [
        { label: 'Inspection Vans', available: 4, total: 5 },
        { label: 'Response Pickups', available: 2, total: 2 },
      ],
      partsStock: [
        { name: 'Cal-Gas-410 Calibration Gas', qty: 8, status: 'ok' },
        { name: 'Respirator Filter Type-B', qty: 3, status: 'low' },
        { name: 'Harness Lanyard', qty: 12, status: 'ok' },
        { name: 'Lockout Padlock 63A', qty: 0, status: 'out' },
      ],
      equipment: [
        { name: 'PPE Inspection Kit', condition: 92, nextService: '30 days' },
        { name: 'Gas Detector Calibration Rig', condition: 85, nextService: '45 days' },
        { name: 'Thermal Imaging Camera', condition: 98, nextService: '90 days' },
      ],
    },
    contract: {
      number: 'IMD-2024-DSO-001',
      tier: 'Platinum',
      startDate: '1 Jan 2024',
      endDate: '31 Dec 2026',
      renewalDate: '1 Oct 2026',
      annualValue: 'AED 1.1M',
      penalties: 'AED 5,000 per SLA breach beyond 3 per quarter',
      responseTimes: [
        { severity: 'Critical', target: '< 45 min' },
        { severity: 'High',     target: '< 2 hrs' },
        { severity: 'Medium',   target: '< 4 hrs' },
        { severity: 'Low',      target: '< 24 hrs' },
      ],
      vendorManager: 'Zaid Al-Hamdan — DevelopmentX HQ',
      notes: 'Renewal auto-triggers at 85% contract term. Resident satisfaction score included in KPI review.',
    },
    lat: 25.1185,
    lng: 55.3800,
    marketLabel: 'Silicon Oasis',
  },
  {
    id: 'CLT-002',
    name: 'Gate Avenue DIFC',
    status: 'live',
    region: 'Downtown',
    sector: 'Commercial Retail Workforce',
    sites: 6,
    workOrders: 31,
    incidents: 1,
    sla: 97,
    compliance: 99,
    riskLevel: 'low',
    overdueTasks: 0,
    dataSources: [
      { label: 'Oracle ERP', count: 560 },
      { label: 'WhatsApp Gateway', count: 120 },
      { label: 'QR Scanner', count: 88 },
    ],
    aiInsight: 'Exemplary compliance across all zones. Zero overdue tasks. SLA track record above portfolio average.',
    lastUpdated: '5 min ago',
    topSites: [
      { name: 'Retail Boulevard Level 1', status: 'ok', incidents: 1 },
      { name: 'Parking Structure B', status: 'ok', incidents: 0 },
      { name: 'Food Court Zone', status: 'ok', incidents: 0 },
    ],
    recentActivity: [
      { time: '10:18 AM', event: 'Routine PPM completed — Confined Space Zone 3', type: 'task' },
      { time: '09:30 AM', event: 'QR scan inspection: PPE Cabinet Level 2 passed', type: 'ok' },
      { time: '08:55 AM', event: 'Service request submitted: Wet floor sign request', type: 'incident' },
    ],
    people: {
      accountManager: { name: 'Nadia Samir', role: 'Account Manager', initials: 'NS', status: 'available' },
      fmManager: { name: 'Walid Kareem', role: 'HSE Manager', initials: 'WK', status: 'available' },
      supervisors: [
        { name: 'Amira Haddad', role: 'Operations Supervisor', initials: 'AH', status: 'on-site', skill: 'Retail Safety' },
      ],
      inspectors: [
        { name: 'Omar T.', role: 'MEP Inspector', initials: 'OT', status: 'on-site', skill: 'Electrical', jobsThisMonth: 14, slaRate: 99 },
        { name: 'Bilal S.', role: 'Safety Inspector', initials: 'BS', status: 'available', skill: 'Safety Equipment', jobsThisMonth: 11, slaRate: 97 },
        { name: 'Nour A.', role: 'General Tech', initials: 'NA', status: 'available', skill: 'General', jobsThisMonth: 9, slaRate: 96 },
      ],
    },
    resources: {
      budgetUsed: 390000,
      budgetTotal: 600000,
      fleet: [
        { label: 'Inspection Vans', available: 2, total: 2 },
        { label: 'Cargo Bikes', available: 3, total: 3 },
      ],
      partsStock: [
        { name: 'LED Panel 60W', qty: 24, status: 'ok' },
        { name: 'Escalator Chain Link', qty: 6, status: 'ok' },
        { name: 'Respirator Filter G4', qty: 2, status: 'low' },
      ],
      equipment: [
        { name: 'Escalator Diagnostic Tool', condition: 97, nextService: '60 days' },
        { name: 'Electrical Test Kit', condition: 94, nextService: '30 days' },
      ],
    },
    contract: {
      number: 'IMD-2024-GAV-002',
      tier: 'Platinum',
      startDate: '1 Mar 2024',
      endDate: '28 Feb 2027',
      renewalDate: '1 Dec 2026',
      annualValue: 'AED 600K',
      penalties: 'AED 3,000 per SLA breach beyond 2 per quarter',
      responseTimes: [
        { severity: 'Critical', target: '< 30 min' },
        { severity: 'High',     target: '< 1 hr' },
        { severity: 'Medium',   target: '< 3 hrs' },
        { severity: 'Low',      target: '< 12 hrs' },
      ],
      vendorManager: 'Zaid Al-Hamdan — DevelopmentX HQ',
      notes: 'DIFC compliance audit scheduled Q3. Retail trading hours limit maintenance windows to 10 PM–6 AM.',
    },
    lat: 25.2048,
    lng: 55.2708,
    marketLabel: 'DIFC',
  },
  {
    id: 'CLT-003',
    name: 'Business Bay Tower Complex',
    status: 'warning',
    region: 'Business Bay',
    sector: 'Commercial Office Workforce',
    sites: 9,
    workOrders: 62,
    incidents: 7,
    sla: 81,
    compliance: 84,
    riskLevel: 'high',
    overdueTasks: 5,
    dataSources: [
      { label: 'Maximo API', count: 980 },
      { label: 'IoT Sensors', count: 54 },
      { label: 'Audit Dashboard', count: 0 },
    ],
    aiInsight: 'Audit dashboard sync failure causing reporting gaps. 5 overdue tasks require immediate escalation. SLA degrading — 3 open breaches.',
    lastUpdated: '12 min ago',
    topSites: [
      { name: 'Tower A — Floors 1–20', status: 'critical', incidents: 4 },
      { name: 'Tower B — Floors 1–18', status: 'warning', incidents: 2 },
      { name: 'Podium Retail', status: 'ok', incidents: 1 },
    ],
    recentActivity: [
      { time: '10:05 AM', event: 'SLA breach: Emergency lighting failure unreached 4h', type: 'escalation' },
      { time: '09:50 AM', event: 'Audit dashboard sync failure — auth token expired', type: 'ai' },
      { time: '09:20 AM', event: 'Gas Detector fault escalated to critical — Tower A', type: 'incident' },
    ],
    people: {
      accountManager: { name: 'Khaled Badawi', role: 'Account Manager', initials: 'KB', status: 'available' },
      fmManager: { name: 'Fatima Aziz', role: 'HSE Manager', initials: 'FA', status: 'on-site' },
      supervisors: [
        { name: 'Yusuf Rahimi', role: 'Operations Supervisor', initials: 'YR', status: 'on-site', skill: 'MEP' },
        { name: 'Dana Saleh', role: 'Safety Supervisor', initials: 'DS', status: 'off-duty', skill: 'Safety' },
      ],
      inspectors: [
        { name: 'Rami B.', role: 'Electrical Tech', initials: 'RB', status: 'on-site', skill: 'Electrical', jobsThisMonth: 16, slaRate: 78 },
        { name: 'Ali M.', role: 'Fall Protection Specialist', initials: 'AM', status: 'transit', skill: 'Safety Equipment', jobsThisMonth: 14, slaRate: 82 },
        { name: 'Hassan T.', role: 'Plumber', initials: 'HT', status: 'off-duty', skill: 'Plumbing', jobsThisMonth: 8, slaRate: 75 },
      ],
    },
    resources: {
      budgetUsed: 1050000,
      budgetTotal: 1200000,
      fleet: [
        { label: 'Inspection Vans', available: 3, total: 5 },
        { label: 'Response Pickups', available: 0, total: 2 },
      ],
      partsStock: [
        { name: 'Circuit Breaker 100A', qty: 1, status: 'low' },
        { name: 'Gas Detector Calibration Gas', qty: 0, status: 'out' },
        { name: 'UPS Battery Module', qty: 4, status: 'ok' },
        { name: 'Fire Damper Actuator', qty: 2, status: 'low' },
      ],
      equipment: [
        { name: 'Generator Test Set', condition: 68, nextService: '5 days' },
        { name: 'Thermal Imaging Camera', condition: 72, nextService: '14 days' },
        { name: 'Cable Fault Locator', condition: 55, nextService: 'Overdue' },
      ],
    },
    contract: {
      number: 'IMD-2023-BBT-003',
      tier: 'Gold',
      startDate: '1 Jul 2023',
      endDate: '30 Jun 2026',
      renewalDate: '1 Apr 2026',
      annualValue: 'AED 1.2M',
      penalties: 'AED 8,000 per SLA breach — 3 breaches triggered this quarter',
      responseTimes: [
        { severity: 'Critical', target: '< 60 min' },
        { severity: 'High',     target: '< 3 hrs' },
        { severity: 'Medium',   target: '< 6 hrs' },
        { severity: 'Low',      target: '< 24 hrs' },
      ],
      vendorManager: 'Mariam Nasser — DevelopmentX HQ',
      notes: 'Penalty review scheduled end of month. Upgrade to Platinum tier being discussed pending SLA recovery.',
    },
    lat: 25.1858,
    lng: 55.2650,
    marketLabel: 'Business Bay',
  },
  {
    id: 'CLT-004',
    name: 'JLT North Cluster',
    status: 'critical',
    region: 'Dubai Marina',
    sector: 'Mixed-Use Workplace',
    sites: 11,
    workOrders: 78,
    incidents: 12,
    sla: 67,
    compliance: 71,
    riskLevel: 'critical',
    overdueTasks: 9,
    dataSources: [
      { label: 'WhatsApp Gateway', count: 340 },
      { label: 'Worker Safety App', count: 195 },
      { label: 'IoT Sensors', count: 31 },
    ],
    aiInsight: 'CRITICAL: 9 overdue tasks and SLA at 67%. AI predicts further deterioration without immediate supervisor intervention. Fall protection inspections overdue.',
    lastUpdated: '1 min ago',
    topSites: [
      { name: 'Cluster N1 — Towers', status: 'critical', incidents: 6 },
      { name: 'Cluster N2 — Villas', status: 'critical', incidents: 4 },
      { name: 'Community Amenities', status: 'warning', incidents: 2 },
    ],
    recentActivity: [
      { time: '10:20 AM', event: 'CRITICAL: scaffold defect — 3 residents affected', type: 'incident' },
      { time: '10:10 AM', event: 'SLA breach cascade — 4 jobs overdue simultaneously', type: 'escalation' },
      { time: '09:55 AM', event: 'AI flag: HSE Inspector shortage detected — reassignment required', type: 'ai' },
    ],
    people: {
      accountManager: { name: 'Sami Qasem', role: 'Account Manager', initials: 'SQ', status: 'available' },
      fmManager: { name: 'Lina Barakat', role: 'HSE Manager', initials: 'LB', status: 'on-site' },
      supervisors: [
        { name: 'Ismail Rashid', role: 'Site Supervisor', initials: 'IR', status: 'on-site', skill: 'General HSE' },
      ],
      inspectors: [
        { name: 'Tariq H.', role: 'Safety Inspector', initials: 'TH', status: 'on-site', skill: 'Safety Equipment', jobsThisMonth: 22, slaRate: 63 },
        { name: 'Ziad K.', role: 'Electrician', initials: 'ZK', status: 'on-site', skill: 'Electrical', jobsThisMonth: 19, slaRate: 68 },
      ],
    },
    resources: {
      budgetUsed: 1380000,
      budgetTotal: 1400000,
      fleet: [
        { label: 'Inspection Vans', available: 1, total: 4 },
        { label: 'Response Pickups', available: 0, total: 2 },
      ],
      partsStock: [
        { name: 'Hoist Motor Drive', qty: 0, status: 'out' },
        { name: 'Emergency Light Units', qty: 0, status: 'out' },
        { name: 'Pipe Joint 22mm', qty: 1, status: 'low' },
        { name: 'Lockout Padlock 32A', qty: 2, status: 'low' },
      ],
      equipment: [
        { name: 'Scaffold Inspection Kit', condition: 42, nextService: 'Overdue' },
        { name: 'Electrical Test Set', condition: 58, nextService: 'Overdue' },
        { name: 'Safety Harness Kit', condition: 61, nextService: '3 days' },
      ],
    },
    contract: {
      number: 'IMD-2022-JLT-004',
      tier: 'Silver',
      startDate: '1 Jan 2023',
      endDate: '31 Dec 2025',
      renewalDate: '1 Sep 2025',
      annualValue: 'AED 1.4M',
      penalties: 'AED 10,000 per breach — 9 breaches triggered YTD · Escalation notice issued',
      responseTimes: [
        { severity: 'Critical', target: '< 90 min' },
        { severity: 'High',     target: '< 4 hrs' },
        { severity: 'Medium',   target: '< 8 hrs' },
        { severity: 'Low',      target: '< 48 hrs' },
      ],
      vendorManager: 'Mariam Nasser — DevelopmentX HQ',
      notes: 'Formal improvement plan in progress. Client has requested senior management review. Contract at risk of non-renewal.',
    },
    lat: 25.0779,
    lng: 55.1397,
    marketLabel: 'JLT',
  },
  {
    id: 'CLT-005',
    name: 'Jumeirah Village Circle',
    status: 'warning',
    region: 'Jumeirah',
    sector: 'Workforce Community',
    sites: 18,
    workOrders: 54,
    incidents: 5,
    sla: 88,
    compliance: 91,
    riskLevel: 'medium',
    overdueTasks: 3,
    dataSources: [
      { label: 'Maximo API', count: 870 },
      { label: 'Worker Safety App', count: 310 },
      { label: 'QR Scanner', count: 145 },
    ],
    aiInsight: 'Hot Work Permit system seasonal service overdue by 18 days. Eyewash maintenance compliance dipped below threshold last week.',
    lastUpdated: '8 min ago',
    topSites: [
      { name: 'District 10 — North', status: 'warning', incidents: 3 },
      { name: 'District 14 — South', status: 'ok', incidents: 1 },
      { name: 'Community Pool & Gym', status: 'warning', incidents: 1 },
    ],
    recentActivity: [
      { time: '10:12 AM', event: 'Hot work permit audit — 18 days overdue', type: 'escalation' },
      { time: '09:40 AM', event: 'eyewash station inspection completed — Inspection met', type: 'task' },
      { time: '09:15 AM', event: 'Resident feedback: 4.6 avg — improved from last month', type: 'ok' },
    ],
    people: {
      accountManager: { name: 'Dina Moussa', role: 'Account Manager', initials: 'DM', status: 'available' },
      fmManager: { name: 'Yassir Nabil', role: 'HSE Manager', initials: 'YN', status: 'on-site' },
      supervisors: [
        { name: 'Samira Kamel', role: 'Community Supervisor', initials: 'SK', status: 'on-site', skill: 'Spill Response & Permits' },
        { name: 'Adel Farouk', role: 'Safety Lead', initials: 'AF', status: 'available', skill: 'Safety & Compliance' },
      ],
      inspectors: [
        { name: 'Malik R.', role: 'Plumber', initials: 'MR', status: 'on-site', skill: 'Plumbing', jobsThisMonth: 13, slaRate: 87 },
        { name: 'Jad T.', role: 'General Tech', initials: 'JT', status: 'transit', skill: 'General', jobsThisMonth: 11, slaRate: 84 },
        { name: 'Rana H.', role: 'Electrician', initials: 'RH', status: 'available', skill: 'Electrical', jobsThisMonth: 9, slaRate: 91 },
      ],
    },
    resources: {
      budgetUsed: 760000,
      budgetTotal: 950000,
      fleet: [
        { label: 'Inspection Vans', available: 4, total: 5 },
        { label: 'Emergency Response Vehicles', available: 1, total: 2 },
      ],
      partsStock: [
        { name: 'Permit Tag Set', qty: 3, status: 'low' },
        { name: 'Spill Containment Kit', qty: 8, status: 'ok' },
        { name: 'Eyewash Seal Kit', qty: 0, status: 'out' },
        { name: 'Emergency Floodlight', qty: 12, status: 'ok' },
      ],
      equipment: [
        { name: 'Permit Control Cabinet', condition: 74, nextService: '7 days' },
        { name: 'Eyewash Test Kit', condition: 88, nextService: '30 days' },
        { name: 'Pressure Washer', condition: 82, nextService: '21 days' },
      ],
    },
    contract: {
      number: 'IMD-2024-JVC-005',
      tier: 'Gold',
      startDate: '1 Apr 2024',
      endDate: '31 Mar 2027',
      renewalDate: '1 Jan 2027',
      annualValue: 'AED 950K',
      penalties: 'AED 4,000 per SLA breach beyond 4 per quarter — 1 triggered this quarter',
      responseTimes: [
        { severity: 'Critical', target: '< 60 min' },
        { severity: 'High',     target: '< 3 hrs' },
        { severity: 'Medium',   target: '< 6 hrs' },
        { severity: 'Low',      target: '< 24 hrs' },
      ],
      vendorManager: 'Zaid Al-Hamdan — DevelopmentX HQ',
      notes: 'Community management board review every 6 months. Permit-to-work KPIs tracked separately to FM KPIs.',
    },
    lat: 25.0550,
    lng: 55.2100,
    marketLabel: 'JVC',
  },
  {
    id: 'CLT-006',
    name: 'Downtown Burj Area',
    status: 'live',
    region: 'Downtown',
    sector: 'Executive Workplace',
    sites: 5,
    workOrders: 22,
    incidents: 2,
    sla: 96,
    compliance: 97,
    riskLevel: 'low',
    overdueTasks: 0,
    dataSources: [
      { label: 'Oracle ERP', count: 420 },
      { label: 'IoT Sensors', count: 112 },
      { label: 'Maximo API', count: 680 },
    ],
    aiInsight: 'Portfolio best performer. IoT coverage at 112 sensors. Proactive failure prediction prevented 2 major safety hazards this quarter.',
    lastUpdated: '4 min ago',
    topSites: [
      { name: 'Residence Tower 1', status: 'ok', incidents: 1 },
      { name: 'Residence Tower 2', status: 'ok', incidents: 1 },
      { name: 'Amenities & Podium', status: 'ok', incidents: 0 },
    ],
    recentActivity: [
      { time: '10:15 AM', event: 'AI prevented safety hazard — proactive PPM dispatched', type: 'ai' },
      { time: '09:30 AM', event: 'Quarterly compliance report: 97% — approved', type: 'ok' },
      { time: '08:50 AM', event: 'IoT anomaly cleared — false positive confirmed', type: 'task' },
    ],
    people: {
      accountManager: { name: 'Leila Mahmoud', role: 'Account Manager', initials: 'LM', status: 'available' },
      fmManager: { name: 'Samir Haddad', role: 'HSE Manager', initials: 'SH', status: 'available' },
      supervisors: [
        { name: 'Camille Raza', role: 'Luxury Standards Supervisor', initials: 'CR', status: 'on-site', skill: 'MEP & Safety Concierge' },
        { name: 'Nabil Oueida', role: 'Engineering Supervisor', initials: 'NO', status: 'available', skill: 'Fall Protection & BMS' },
      ],
      inspectors: [
        { name: 'Emad S.', role: 'Safety Systems Specialist', initials: 'ES', status: 'available', skill: 'Safety Systems', jobsThisMonth: 8, slaRate: 100 },
        { name: 'Lara K.', role: 'Fall Protection Specialist', initials: 'LK', status: 'on-site', skill: 'Safety Equipment', jobsThisMonth: 10, slaRate: 96 },
        { name: 'Fares M.', role: 'Electrician', initials: 'FM', status: 'available', skill: 'Electrical', jobsThisMonth: 7, slaRate: 97 },
      ],
    },
    resources: {
      budgetUsed: 480000,
      budgetTotal: 750000,
      fleet: [
        { label: 'Premium Inspection Vans', available: 2, total: 2 },
        { label: 'Electric Vehicles', available: 1, total: 1 },
      ],
      partsStock: [
        { name: 'Safety Sensor Node', qty: 18, status: 'ok' },
        { name: 'HEPA Respirator Filter', qty: 12, status: 'ok' },
        { name: 'Emergency Generator Fuel', qty: 6, status: 'ok' },
        { name: 'LED Chandelier Bulb', qty: 24, status: 'ok' },
      ],
      equipment: [
        { name: 'Safety Monitoring Terminal', condition: 99, nextService: '120 days' },
        { name: 'Thermal Imaging Suite', condition: 97, nextService: '90 days' },
        { name: 'Confined Space Air Monitor', condition: 94, nextService: '60 days' },
      ],
    },
    contract: {
      number: 'IMD-2024-DBA-006',
      tier: 'Platinum',
      startDate: '1 Jun 2024',
      endDate: '31 May 2027',
      renewalDate: '1 Mar 2027',
      annualValue: 'AED 750K',
      penalties: 'AED 6,000 per SLA breach — zero breaches YTD',
      responseTimes: [
        { severity: 'Critical', target: '< 30 min' },
        { severity: 'High',     target: '< 1 hr' },
        { severity: 'Medium',   target: '< 2 hrs' },
        { severity: 'Low',      target: '< 8 hrs' },
      ],
      vendorManager: 'Leila Mahmoud — DevelopmentX HQ',
      notes: 'White-glove service standard. All staff must hold valid DTCM certification. Branded uniforms mandatory on-site.',
    },
    lat: 25.1972,
    lng: 55.2744,
    marketLabel: 'Downtown',
  },
];

export type KBCategory = 'guide' | 'video' | 'sop' | 'checklist';
export type KBDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface KBStep {
  title: string;
  body: string;
  warning?: string;
  tip?: string;
}

export interface KBResource {
  id: string;
  title: string;
  category: KBCategory;
  description: string;
  estimatedTime: string;
  difficulty: KBDifficulty;
  tags: string[];
  tools?: string[];
  steps: KBStep[];
  videoUrl?: string;
  thumbnailUrl?: string;
}

export const mockKBResources: KBResource[] = [
  {
    id: 'KB-001',
    title: 'Portable Gas Detector — Bump Test & Calibration',
    category: 'guide',
    description: 'Pre-shift bump test and full span calibration procedure for 4-gas personal monitors (LEL, O₂, CO, H₂S).',
    estimatedTime: '15 min',
    difficulty: 'intermediate',
    tags: ['gas detection', 'bump test', 'calibration', 'PPE', 'pre-shift'],
    tools: ['Calibration cap & tubing', 'Cal-gas cylinder (quad-mix 50% LEL CH₄ / 18% O₂ / 25 ppm H₂S / 100 ppm CO)', 'Demand-flow regulator', 'Bump test log'],
    steps: [
      {
        title: 'Inspect the instrument',
        body: 'Power on the detector in fresh air. Check the battery icon, sensor icons, and confirm the last calibration date is within 180 days. Inspect the sensor filter for dust, water, or paint contamination — replace if blocked.',
        warning: 'Never deploy a detector with an expired calibration or a "sensor fail" icon. Tag it out and draw a replacement.',
      },
      {
        title: 'Zero in clean air',
        body: 'Take the instrument outside the work area to a known clean-air location. Initiate Auto Zero from the menu. Wait for all four sensors to settle to zero (LEL, CO, H₂S = 0; O₂ = 20.9%).',
        tip: 'Never zero indoors near vehicles, generators, or paint stores — a false zero will mask real exposures.',
      },
      {
        title: 'Apply calibration gas',
        body: 'Fit the calibration cap, attach the demand-flow regulator to the cylinder, and connect the tubing. Open the cylinder and start the bump test from the menu. Gas must reach the sensors within 30 seconds.',
        warning: 'Do not use a fixed-flow regulator on diffusion-style detectors — over-pressurising the sensor housing damages the membranes.',
      },
      {
        title: 'Verify response',
        body: 'A passing bump test shows readings within ±10% of the cylinder concentration for each sensor. If any sensor fails, repeat once. A second failure means a full span calibration is required before the detector can be used.',
      },
      {
        title: 'Full span calibration (if required)',
        body: 'Select Span Calibration. Enter the cylinder concentrations from the certificate. Apply gas for the prescribed time (typically 3 minutes). The detector will adjust internal gain and store the new span.',
        tip: 'Always log the cylinder lot number and expiry date — calibration is invalid if the gas has expired.',
      },
      {
        title: 'Log and seal',
        body: 'Close the cylinder, vent the regulator, and remove the cap. Log the bump/cal result, your name, and the next due date in the gas detector register. Affix a fresh inspection sticker to the instrument.',
      },
    ],
  },
  {
    id: 'KB-002',
    title: 'Lockout/Tagout (LOTO) — Application & Verification',
    category: 'sop',
    description: 'Six-step LOTO procedure for isolating energised equipment before maintenance, including stored-energy dissipation and verification of zero energy.',
    estimatedTime: '20 min',
    difficulty: 'intermediate',
    tags: ['LOTO', 'electrical', 'isolation', 'permit', 'energy control'],
    tools: ['Personal padlock & uniquely numbered tag', 'Multi-lock hasp', 'Voltage tester (CAT III/IV rated)', 'Insulated gloves Class 0+', 'LOTO kit'],
    steps: [
      {
        title: 'Notify and prepare',
        body: 'Notify all affected workers and the supervisor before starting. Identify every energy source feeding the equipment — electrical, pneumatic, hydraulic, gravitational, thermal, chemical. Reference the equipment-specific isolation procedure.',
        warning: 'Never assume single-source isolation. Many machines have control circuits, capacitor banks, or backup feeds that remain live after the main breaker is opened.',
      },
      {
        title: 'Shut down the equipment',
        body: 'Stop the equipment using its normal stop sequence. Allow rotating parts to come to rest. Do not begin isolation while the machine is mid-cycle.',
      },
      {
        title: 'Isolate every energy source',
        body: 'Open each disconnect to the OFF position. Close pneumatic and hydraulic isolation valves. Block raised loads. Drain or vent stored fluid pressure to atmosphere. Each isolation point gets its own lock.',
        tip: 'Use a multi-lock hasp wherever more than one worker will perform the maintenance — every individual applies their own personal padlock.',
      },
      {
        title: 'Apply lock and tag',
        body: 'Fit your personal padlock to each isolation point. Attach a tag stating your name, date, contact number, and the reason for isolation. Only the person who applied the lock may remove it.',
        warning: 'Tagout-only (no physical lock) is permitted only where lock-out is not physically possible — and must be authorised in writing by the HSE Manager.',
      },
      {
        title: 'Dissipate stored energy',
        body: 'Discharge capacitors. Bleed pressure from accumulators. Block or pin gravity-loaded parts. Allow thermal sources to cool to a safe touch temperature.',
      },
      {
        title: 'Verify zero energy',
        body: 'Test the voltage tester on a known live source first, then test the isolated circuit (live–live, live–earth) at the work point. Attempt to start the equipment from the local controls — it must not respond. Only then begin work.',
        warning: 'Never skip the test-before-touch step. The single most common LOTO fatality is contact with a circuit assumed to be dead.',
      },
    ],
  },
  {
    id: 'KB-003',
    title: 'Scaffold & Fall-Arrest — Monthly Inspection',
    category: 'sop',
    description: 'Monthly competent-person inspection of fixed and mobile scaffolds, edge protection, anchor points, and personal fall-arrest systems.',
    estimatedTime: '45 min',
    difficulty: 'intermediate',
    tags: ['scaffold', 'fall protection', 'working at height', 'PFAS', 'inspection'],
    tools: ['Scaftag and inspection log', 'Torque wrench (for couplers)', 'Tape measure', 'Anchor pull-test gauge', 'Camera'],
    steps: [
      {
        title: 'Verify the scaftag and load class',
        body: 'Check the scaftag is current (signed and dated within 7 days), shows the load class (light/general/heavy duty), and lists any restrictions. A missing, unsigned, or out-of-date tag means the scaffold must be taken out of use immediately.',
        warning: 'Do not allow workers to access a scaffold with no scaftag, a red tag, or evidence of unauthorised modification.',
      },
      {
        title: 'Foundations and base plates',
        body: 'Confirm sole boards are sound, level, and bearing on firm ground. Check base plates and adjustable jacks are not over-extended (>300 mm exposed thread is a fail). Look for ground subsidence or wash-out around base plates.',
      },
      {
        title: 'Standards, ledgers and bracing',
        body: 'Inspect every standard for plumb, every ledger for level, and every coupler for correct torque. Check diagonal bracing is fitted in alternating bays per the design. Replace any bent, cracked, or rusted tube immediately.',
        warning: 'A scaffold missing diagonal bracing can collapse laterally even at low load. Stop work, evacuate the affected lift, and red-tag every access point if bracing is incomplete.',
      },
      {
        title: 'Working platform and edge protection',
        body: 'All boards must be fully supported, no traps (gaps >25 mm), and secured against lift-off. Verify guardrails at 950–1100 mm, mid-rails, and toe boards at every open edge. Confirm internal access (ladders or stair towers) is sound.',
      },
      {
        title: 'Anchor points for fall arrest',
        body: 'Each certified fall-arrest anchor must withstand ≥12 kN single-user (EN 795) or ≥22 kN shared / OSHA 5,000 lbf. Verify the certification stamp and the date of the last proof test. Replace any anchor showing deformation, corrosion, or missing certification. Photograph each anchor and the test value.',
        tip: 'Anchor points must be at or above the worker\'s dorsal D-ring whenever practical to keep fall distance and swing risk to a minimum.',
      },
      {
        title: 'Personal Fall Arrest Systems (PFAS)',
        body: 'Inspect every harness for cuts, frayed webbing, distorted D-rings, and chemical contamination. Check shock packs are intact (deployed packs = harness retired). Verify lanyards have current inspection tags. Quarantine any defective item.',
      },
      {
        title: 'Sign off and tag',
        body: 'Update the scaftag and inspection log with date, your name, competent-person signature, and any restrictions. If defects are found, raise a corrective work order before re-tagging the scaffold green.',
      },
    ],
  },
  {
    id: 'KB-004',
    title: 'Fire Alarm Panel — Weekly Function Test',
    category: 'checklist',
    description: 'Weekly fire alarm panel test covering battery backup, zone activation, sounders, and brigade signal verification.',
    estimatedTime: '20 min',
    difficulty: 'beginner',
    tags: ['fire safety', 'fire panel', 'alarm', 'weekly', 'life safety'],
    tools: ['Fire panel key', 'Test detector smoke aerosol or magnet', 'Sounder dB meter (optional)', 'Log book'],
    steps: [
      {
        title: 'Notify occupants and brigade receiver',
        body: 'Inform building occupants and the security control room before starting. Place the brigade receiving station onto "test" status to suppress automatic dispatch. Do not skip this step — false call-outs are a chargeable offence.',
        tip: 'Test during agreed windows (typically 09:00–17:00 weekdays) and confirm with the building manager beforehand.',
      },
      {
        title: 'Log existing panel status',
        body: 'Open the panel and record any active faults, isolations, or disablements. Do not proceed if there are unresolved critical faults — escalate to the HSE Manager first.',
      },
      {
        title: 'Activate one rotating zone',
        body: 'Test a different zone each week so all zones are exercised quarterly. Activate one detector using the appropriate test stimulus (smoke aerosol for optical, magnet for manual call points). The panel must register the alarm within 30 seconds.',
        warning: 'Use the right stimulus per detector type. Smoke aerosol on heat detectors will not trigger them; flame on optical detectors damages them.',
      },
      {
        title: 'Verify sounders and outputs',
        body: 'Confirm sounders are audible across all zones — ≥65 dB(A) overall, or +5 dB above the highest 30-second background noise level (BS 5839-1). Check ancillary outputs — door holders release, ventilation shutdown, lift homing — operate as designed.',
      },
      {
        title: 'Battery and standby power',
        body: 'View the battery menu and confirm both PSU batteries are >24 V. Open the battery isolator briefly to confirm the panel runs on standby. Restore mains within 60 seconds.',
      },
      {
        title: 'Reset and log',
        body: 'Reset the panel and confirm it returns to normal status. Restore brigade receiver to live. Complete the log book: zone tested, time activated, time reset, sounder check pass/fail, and your signature.',
      },
    ],
  },
  {
    id: 'KB-005',
    title: 'Chemical Spill Response — Containment & Reporting',
    category: 'sop',
    description: 'First-responder procedure for hazardous chemical spills covering personal protection, containment, neutralisation, and regulatory reporting.',
    estimatedTime: '30 min',
    difficulty: 'intermediate',
    tags: ['chemical spill', 'HAZMAT', 'COSHH', 'spill kit', 'environmental'],
    tools: ['Spill kit (universal or chemical-specific)', 'Chemical-resistant gloves & boots', 'Splash goggles or face shield', 'SCBA or air-purifying respirator (if vapour risk)', 'Safety Data Sheet (SDS)'],
    steps: [
      {
        title: 'Stop, assess, evacuate if required',
        body: 'Do not approach the spill until you know what it is. Identify the substance from labels or the issuing area. Pull the relevant SDS and read Sections 4 (first aid), 6 (accidental release), and 8 (PPE) before acting.',
        warning: 'For unknown substances, large spills (>50 L), or any release with vapour, fire, or reactive risk — evacuate, isolate, and call the HSE Manager. Do not attempt to contain.',
      },
      {
        title: 'Isolate the area and ignition sources',
        body: 'Cordon off a minimum 5 m perimeter. Turn off ignition sources within 10 m for flammables. Close fire doors to limit vapour spread. Stop any process feeding into the spill if it can be done safely.',
      },
      {
        title: 'Don the correct PPE',
        body: 'Select PPE from SDS Section 8 — never improvise. Acid spills require nitrile or butyl gloves; solvent spills require Viton; corrosives require splash goggles plus face shield. SCBA is mandatory whenever the vapour exceeds the IDLH value.',
      },
      {
        title: 'Contain the spill',
        body: 'Surround the spill with absorbent socks or booms, working from the outside in. Block drains and floor gullies first to prevent migration to the watercourse. Never wash the spill toward a drain.',
        warning: 'Mixing incompatible absorbents (e.g. acid absorbent on a base spill) can cause violent reaction. Use the chemical-specific kit, or a universal kit where unsure.',
      },
      {
        title: 'Recover and neutralise',
        body: 'Once contained, scoop the absorbent into a labelled HAZMAT waste container. For acids and bases, apply the appropriate neutraliser and verify pH 6–8 before disposal. Decontaminate the affected surface with the SDS-recommended cleaner.',
      },
      {
        title: 'Report and document',
        body: 'Log the incident in the platform within 1 hour. Record substance, volume, root cause, exposure (if any), and corrective actions. For reportable releases (RIDDOR / local environmental authority), the HSE Manager must be informed within the regulatory timeframe.',
      },
    ],
  },
  {
    id: 'KB-006',
    title: 'Fixed Gas Detection System — Quarterly Calibration',
    category: 'sop',
    description: 'Quarterly bump test, span calibration, and alarm verification for fixed point gas detection systems in confined or process areas.',
    estimatedTime: '3–4 hours',
    difficulty: 'advanced',
    tags: ['gas detection', 'fixed system', 'quarterly', 'SOP', 'alarm verification'],
    tools: ['Calibration cap & tubing for each sensor type', 'Cal-gas cylinders (target gas + zero air)', 'Demand-flow regulator', 'Multimeter', 'Two-way radio for alarm verification'],
    steps: [
      {
        title: 'Permit and notification',
        body: 'Raise a Permit to Work covering the calibration. Notify the control room, fire panel monitoring station, and any downstream emergency systems (ventilation trip, ESD). Place all alarm outputs into "inhibit" mode for the test window.',
        warning: 'Failing to inhibit alarm outputs will trigger emergency ventilation, plant trips, and brigade dispatch. Always confirm inhibit status on the master controller before applying gas.',
      },
      {
        title: 'Visual and electrical check',
        body: 'Inspect the sensor housing for damage, water ingress, paint over-spray, or insect blockage of the diffusion holes. Check sensor cable glands are weather-tight. Measure the loop current at the head — a 4-wire transmitter at clean air should read 4 mA.',
      },
      {
        title: 'Zero in clean air',
        body: 'Apply a zero-air cylinder (or confirm clean ambient air at known low background). Allow 60 seconds for the reading to settle. Adjust zero from the local HMI if drift exceeds the manufacturer tolerance.',
      },
      {
        title: 'Apply span gas',
        body: 'Connect the calibration cap and apply target gas at the certificate concentration (typically 50% LEL for combustibles, 25 ppm for H₂S, 100 ppm for CO). Allow the reading to stabilise — the response should reach 90% of final value within T90 (typically 30–60 s).',
        tip: 'Always start with the lowest-range sensor first — exposing an O₂ sensor to high CO or H₂S can cross-contaminate and force a soak time before calibration.',
      },
      {
        title: 'Verify alarm thresholds',
        body: 'Apply gas above the L1 (low) and L2 (high) alarm setpoints in turn. Verify each alarm actuates at the master panel, the local sounder/beacon, and any engineered control output (ventilation start, plant trip). Time the response from gas-on to alarm.',
      },
      {
        title: 'Restore and document',
        body: 'Disconnect calibration gas and allow readings to return to baseline. Remove the alarm inhibit. Complete the calibration certificate: sensor serial, gas lot, pre/post readings, alarm response times, and the next due date. File against the asset record.',
      },
    ],
  },
  {
    id: 'KB-007',
    title: 'Eyewash & Safety Shower — Monthly Function Test',
    category: 'checklist',
    description: 'Monthly activation test of plumbed eyewash stations and emergency safety showers to verify flow, water quality, and unobstructed access.',
    estimatedTime: '30 min',
    difficulty: 'beginner',
    tags: ['eyewash', 'safety shower', 'monthly', 'first aid', 'emergency equipment'],
    tools: ['Bucket or test pan (10 L+)', 'Stopwatch', 'pH test strips', 'Inspection tag', 'Photo log'],
    steps: [
      {
        title: 'Pre-check the access path',
        body: 'Walk the route from the nearest hazard to the unit. The path must be unobstructed, no greater than 10 seconds travel time, and clearly signed. Remove any stored items, equipment, or trip hazards within a 1 m radius of the unit.',
        warning: 'Storing items around an eyewash is a finable offence in most jurisdictions and a common audit finding. Any blockage = immediate fail.',
      },
      {
        title: 'Activate the unit hands-free',
        body: 'Push the activation paddle or pull the shower handle. Both eyewash and shower must activate within 1 second of single-motion actuation and stay on hands-free until manually closed.',
      },
      {
        title: 'Verify flow and pattern',
        body: 'Eyewash must deliver ≥1.5 L/min per nozzle, with twin streams meeting evenly at 100 mm above the spray heads. Safety showers must deliver ≥75 L/min in a uniform 50 cm-diameter pattern at 1.5 m height. Run for the full 15-minute duration on at least one quarterly test.',
      },
      {
        title: 'Water quality and temperature',
        body: 'Catch a sample after 30 seconds of flow. Verify the water is clear and free from rust or sediment. Test pH (6.0–8.0). Temperature must be 16–38 °C (tepid) — too cold causes hypothermia of the eye, too hot causes scald injury.',
        warning: 'Black or rust-coloured first-flush water indicates stagnant supply and a serious Legionella risk. Flush until clear, then escalate for plumbing remediation.',
      },
      {
        title: 'Inspect heads and dust caps',
        body: 'Check the eyewash dust caps fit and pop free under flow. Check the spray heads for limescale and debris — clean with a soft brush. Confirm the bowl is clean and the drain is clear.',
      },
      {
        title: 'Tag and log',
        body: 'Sign the inspection tag with date and your initials. Record results in the platform: flow rate, temperature, pH, and any defects raised. A failed test triggers an immediate corrective work order — the unit must be tagged out of service until repaired.',
      },
    ],
  },
  {
    id: 'KB-008',
    title: 'Fire Extinguisher — Service & Recharge',
    category: 'guide',
    description: 'Annual service and post-discharge recharge for portable fire extinguishers (CO₂, dry powder, water, foam).',
    estimatedTime: '20 min per unit',
    difficulty: 'intermediate',
    tags: ['fire safety', 'extinguisher', 'recharge', 'annual service'],
    tools: ['Refill station', 'Calibrated weighing scale', 'CO₂ filling adaptor', 'Tamper seals', 'Service collar tags', 'Hydrostatic test stamp (every 5 years)'],
    steps: [
      {
        title: 'Visual inspection and depressurise',
        body: 'Check the body for dents, corrosion, neck-thread damage, and gauge condition. Any structural damage = decommission, do not recharge. Discharge any residual pressure to atmosphere with the trigger before opening.',
        warning: 'Never open a pressurised cylinder. Stored pressure CO₂ extinguishers can release the valve assembly with lethal force.',
      },
      {
        title: 'Disassemble and internal inspection',
        body: 'Unscrew the valve assembly with the correct wrench. Empty residual agent into a labelled recovery container. Inspect the cylinder interior for corrosion, pitting, or contamination. Renew all O-rings as standard.',
      },
      {
        title: 'Recharge with agent',
        body: 'Dry powder: weigh the correct charge into the cylinder. CO₂: connect to the filling station and fill to the weight stamped on the cylinder neck. Water/foam: refill to the marked volume. Never overfill — overfilling is a major hazard at the next discharge.',
      },
      {
        title: 'Reassemble and pressurise',
        body: 'Refit the valve assembly to torque spec. Pressurise stored-pressure units with dry nitrogen to the label pressure. Verify the gauge needle reads in the green zone with the cylinder upright.',
      },
      {
        title: 'Final check, tag and log',
        body: 'Check the gauge holds steady for 60 seconds. Refit the safety pin and a new tamper seal. Apply the service collar tag with date, your competent-person ID, and next service date. Log the asset in the extinguisher register.',
        tip: 'Hydrostatic test is due every 5 years — do not service an extinguisher with an expired hydro stamp; send it to the test house instead.',
      },
    ],
  },
  {
    id: 'KB-009',
    title: 'Eyewash Station Installation — Plumbing & Flow Setup',
    category: 'video',
    description: 'Video walkthrough covering supply pipe sizing, tepid-water mixing, drain provision, and commissioning flow tests for a new eyewash installation.',
    estimatedTime: '12 min watch',
    difficulty: 'intermediate',
    tags: ['eyewash', 'installation', 'commissioning', 'tepid water', 'video'],
    tools: ['Pipe cutter', 'Spirit level', 'Thermostatic mixing valve', 'Calibrated thermometer', 'Flow gauge'],
    videoUrl: 'https://www.youtube.com/embed/V3BDkDlzH7Q',
    thumbnailUrl: 'https://img.youtube.com/vi/V3BDkDlzH7Q/hqdefault.jpg',
    steps: [
      {
        title: 'Locate and orient the unit',
        body: 'Mount the eyewash within 10 seconds (≈15 m) of the hazard, on the same level, with no obstructions. Spray heads sit 838–1143 mm above the floor. The shower handle must be reachable by an injured worker.',
        warning: 'Never install eyewashes on a different level to the hazard. An injured worker cannot navigate stairs blind.',
      },
      {
        title: 'Pipe sizing for guaranteed flow',
        body: 'Eyewash supply must deliver ≥1.5 L/min per nozzle for 15 minutes. Minimum 15 mm CWS feed for eyewash; minimum 25 mm feed for combination shower units. Avoid long runs or shared takeoffs that starve flow when other outlets are open.',
      },
      {
        title: 'Tepid-water mixing valve',
        body: 'Fit an ANSI Z358.1-compliant TMV sized for the unit\'s flow rating. Set the blended temperature to 16–38 °C. Use a fail-safe valve that defaults to cold-water-only on hot-supply failure (never the other way round).',
      },
      {
        title: 'Drain provision',
        body: 'Combination units require a floor gully or trapped drain rated for ≥75 L/min. Slope the floor 1:60 toward the drain. An ungully\'d unit will flood the work area on each test and discourage activation.',
      },
      {
        title: 'Commission and tag',
        body: 'Run the unit for the full 15-minute duration on first commission. Verify flow, pattern, temperature, and drain capacity. Photograph commissioning data and attach to the asset record. Hang a green commissioning tag and a monthly inspection tag.',
      },
    ],
  },
  {
    id: 'KB-010',
    title: 'Hot Work Permit — Issuance & Fire Watch',
    category: 'sop',
    description: 'Issue, control, and close-out of Hot Work Permits for welding, cutting, grinding, and brazing in non-designated areas.',
    estimatedTime: '20 min',
    difficulty: 'intermediate',
    tags: ['hot work', 'permit to work', 'fire watch', 'welding', 'permit'],
    tools: ['Hot Work Permit pad', 'Calibrated gas detector (LEL)', 'Fire blanket', 'Two extinguishers (CO₂ + water/foam)', 'Spark screens'],
    steps: [
      {
        title: 'Justify the permit',
        body: 'Hot work outside a designated welding bay needs a permit. First check whether the work can be done in the welding bay or by a non-spark method (mechanical cutting, cold cutting, bolting). If yes, do not issue a permit.',
        warning: 'Hot work is the leading cause of industrial fire losses. Always exhaust cold alternatives first.',
      },
      {
        title: 'Pre-work site survey',
        body: 'Walk the work area with the operator. Identify combustibles within 10 m horizontally and 15 m vertically (welding spatter travels). Move what can be moved; cover the rest with fire blankets. Seal floor and wall openings within the spark zone.',
      },
      {
        title: 'Atmospheric test',
        body: 'In any area that may contain flammable vapours (process areas, drains, ducts, paint stores), bump-test a calibrated LEL meter and verify reading <1% LEL before issue. Re-test before each restart and every 30 minutes during work. Action bands: <1% LEL safe to proceed; 1–4% LEL stop work and ventilate until back below 1%; ≥5% LEL evacuate, isolate ignition, and re-permit only after engineering review.',
        warning: 'Any reading ≥5% LEL = immediate evacuation, isolate ignition, ventilate, and do not re-permit without engineering sign-off. Never weld through a rising LEL trend, even below 5%.',
      },
      {
        title: 'Position fire watch and equipment',
        body: 'Assign a dedicated fire watch (not the operator) with no competing duties. Provide a CO₂ extinguisher and a water/foam extinguisher within 3 m. Confirm the fire watch knows the alarm path, evacuation route, and first response actions.',
      },
      {
        title: 'Issue and post the permit',
        body: 'Complete the permit: location, work description, hazards, controls, time-limited validity (max 8 hours, never overnight). Both issuer and acceptor sign. Display a copy at the work location and retain the original at the permit desk.',
      },
      {
        title: 'Post-work fire watch',
        body: 'Maintain the fire watch for at least 60 minutes after hot work stops, with periodic checks for a further 3 hours. Smouldering ignition can take hours to develop. Sign off the permit and return to the issuer only after final inspection.',
      },
    ],
  },
  {
    id: 'KB-011',
    title: 'Confined Space Entry — Atmospheric Monitoring & Rescue',
    category: 'sop',
    description: 'Pre-entry, in-entry, and rescue protocol for confined spaces (tanks, vessels, manholes, ducts, pits).',
    estimatedTime: '40 min',
    difficulty: 'advanced',
    tags: ['confined space', 'permit to work', 'rescue', 'gas detection', 'atmospheric monitoring'],
    tools: ['Confined Space Permit', 'Calibrated 4-gas detector with sample pump', 'Tripod & rescue winch', 'Full-body harness with rear & front D-rings', 'Two-way radio', 'Forced-air ventilation blower'],
    steps: [
      {
        title: 'Confirm the space classification',
        body: 'Confined space = limited entry/exit + not designed for continuous occupancy + potential for hazardous atmosphere or engulfment. If any of those apply, the entry is permit-required regardless of how routine the task feels.',
        warning: 'Most confined-space fatalities occur on jobs the team has done many times before. Familiarity does not waive the permit.',
      },
      {
        title: 'Pre-entry atmospheric test',
        body: 'Lower a sampling probe through the entry point — never put your head in to test. Sample top, middle, and bottom of the space. Acceptable: O₂ 19.5–23.5%, LEL <10%, CO <25 ppm, H₂S <10 ppm. Continue purging until results are stable.',
      },
      {
        title: 'Ventilate and isolate',
        body: 'Fit forced-air ventilation aimed to push air to the breathing zone of the entrant. Ventilate for at least 5 air changes before entry. Isolate and lock out all incoming pipework, agitators, and fill systems via LOTO.',
      },
      {
        title: 'Rig rescue equipment',
        body: 'Erect tripod over the entry point. Connect retrieval line via the entrant\'s rear D-ring to the rescue winch. The attendant must never enter the space — their job is communications, monitoring, and triggering rescue.',
        warning: '60% of confined-space deaths are would-be rescuers. The attendant calls for help and operates the winch from outside — they do not enter under any circumstances.',
      },
      {
        title: 'Issue permit, brief team, enter',
        body: 'Issue the permit listing entrants, attendant, rescue plan, max duration, and emergency contacts. Brief everyone on the rescue plan. Enter only when atmospheric readings are stable and rescue is rigged.',
      },
      {
        title: 'Continuous monitoring',
        body: 'The 4-gas detector stays inside the space at the entrant\'s breathing zone. The attendant logs O₂, LEL, CO, H₂S every 15 minutes. Any alarm = immediate evacuation. Communications check every 5 minutes.',
      },
      {
        title: 'Exit and close-out',
        body: 'On exit, sign the permit closed and return to the issuer. Remove ventilation, recover rescue gear, restore isolations only after permit closure. File the permit for the regulatory retention period (typically 5 years).',
      },
    ],
  },
  {
    id: 'KB-012',
    title: 'Working at Height — Permit & Personal Fall Arrest',
    category: 'sop',
    description: 'Permit, equipment selection, and method for any task above 2 m where edge protection alone is insufficient.',
    estimatedTime: '30 min read',
    difficulty: 'intermediate',
    tags: ['working at height', 'fall protection', 'permit', 'PFAS', 'SOP'],
    tools: ['Working at Height Permit', 'Full-body harness (EN 361)', 'Shock-absorbing lanyard or SRL', 'Certified anchor strap', 'MEWP (preferred over ladders)'],
    steps: [
      {
        title: 'Hierarchy of control',
        body: 'Always work through the hierarchy: (1) avoid the work, (2) prevent the fall with edge protection or MEWP, (3) arrest the fall with PFAS only as a last resort. Document the reason if you skip a higher control.',
        warning: 'Defaulting to harness-and-lanyard without trying engineering controls first is a serious procedural failure.',
      },
      {
        title: 'Issue the permit',
        body: 'Permit covers the location, height, duration, anchor strategy, rescue plan, and weather constraints. The Site Supervisor must sign before the team begins. The permit lapses at end-of-shift or wind/lightning trigger conditions.',
      },
      {
        title: 'Inspect equipment before each use',
        body: 'Pre-use check the harness (webbing cuts, frayed stitching, distorted hardware), lanyard (deployed shock pack = retire), and the inspection tag (within 12 months). Defective gear is tagged out and locked away.',
      },
      {
        title: 'Anchor selection and fall clearance',
        body: 'Anchor must be certified (≥12 kN single-user, ≥22 kN shared), ideally above the dorsal D-ring. Calculate fall clearance: lanyard length + deceleration distance (1.75 m typical) + worker height + 1 m safety margin. If clearance is short, use an SRL instead of a 2 m lanyard.',
      },
      {
        title: 'Carry out the work',
        body: 'Stay 100% tied off — connect the second lanyard before disconnecting the first when transitioning. Tools tethered or in a pouch. Never lean past the point of recovery. Stop in adverse weather.',
      },
      {
        title: 'Rescue plan in action',
        body: 'A worker hanging in a harness has 15–30 minutes before suspension trauma. The rescue plan must allow recovery within that window — call brigade only as a final option. Practise the rescue method during the toolbox talk.',
        warning: 'Suspension trauma can be fatal even after a successful arrest. Get a hanging worker upright and on a flat surface within 20 minutes.',
      },
      {
        title: 'Close the permit',
        body: 'Recover all tools and gear from height. Inspect the work area from below. Hand the signed permit back to the supervisor for closure. Record any near-misses or equipment issues.',
      },
    ],
  },
  {
    id: 'KB-013',
    title: 'Emergency Lighting — 3-Hour Duration Test',
    category: 'checklist',
    description: 'Annual 3-hour discharge test of emergency escape lighting per BS EN 50172 / BS 5266-1.',
    estimatedTime: '3.5 hours',
    difficulty: 'intermediate',
    tags: ['emergency lighting', 'life safety', 'annual test', 'BS 5266', 'checklist'],
    tools: ['Emergency lighting test key (or central battery test menu)', 'Lux meter', 'Ladder / MEWP for ceiling-mounted units', 'Test log book'],
    steps: [
      {
        title: 'Plan the outage window',
        body: 'Schedule the test outside critical occupancy. The building will rely on emergency batteries for up to 3 hours and a battery flat at end-of-test means no escape lighting until recharge (24 hours typical). Notify the duty manager.',
        warning: 'Never run a 3-hour test on consecutive nights. Batteries need a full 24-hour recharge between deep discharges.',
      },
      {
        title: 'Activate the test',
        body: 'For self-contained luminaires, turn the test key (or use the smart-switch / DALI command) to remove mains supply. For central battery systems, initiate the duration test from the controller. Note the start time precisely.',
      },
      {
        title: 'Walk the building at start',
        body: 'Within the first 10 minutes, walk every escape route and verify each emergency luminaire is illuminated. Record any failures with location reference. Take a lux reading at the centre of each escape route — minimum 1 lux per BS 5266.',
      },
      {
        title: 'Check open areas and high-risk task areas',
        body: 'Open (anti-panic) areas need ≥0.5 lux at floor. High-risk task areas (around live machinery, lab benches, control rooms) need ≥10% of normal task illuminance, minimum 15 lux. Record measurements at representative points.',
      },
      {
        title: 'Mid-test and end-test inspection',
        body: 'At 90 minutes, walk the routes again and confirm all units are still lit. At 3 hours exactly, do a final check — every unit must still be functioning at the end of the rated duration. Any failure = unit replacement.',
      },
      {
        title: 'Restore mains and recharge',
        body: 'Return the test key to normal / restore mains supply. Verify the green charge LED is lit on every luminaire. The battery flat alarm must clear within 30 minutes. Failed units stay tagged out until replaced.',
      },
      {
        title: 'Log and report',
        body: 'Complete the BS 5266 logbook: test date, duration, individual luminaire results, lux measurements, any defects, your competent-person signature. Issue corrective work orders for every failure within 24 hours.',
      },
    ],
  },
  {
    id: 'KB-014',
    title: 'Scaffold Defects — Field Diagnosis & Escalation',
    category: 'video',
    description: 'Video walkthrough of the most common scaffold defects encountered on site, how to diagnose them, and when to escalate.',
    estimatedTime: '22 min watch',
    difficulty: 'intermediate',
    tags: ['scaffold', 'defects', 'fall protection', 'troubleshooting', 'video'],
    videoUrl: 'https://www.youtube.com/embed/hJMPQ6eCGq8',
    thumbnailUrl: 'https://img.youtube.com/vi/hJMPQ6eCGq8/hqdefault.jpg',
    steps: [
      {
        title: 'Defect 1 — Missing or expired scaftag',
        body: 'No tag, an unsigned tag, or a tag dated >7 days old means the scaffold cannot be used. Apply a red "Do Not Use" tag at every access point and notify the scaffold supplier immediately for re-inspection.',
        warning: 'Letting workers onto a scaffold with no current scaftag exposes the duty-holder to corporate manslaughter risk if a collapse occurs.',
      },
      {
        title: 'Defect 2 — Missing diagonal bracing',
        body: 'Single missing braces in non-load-bearing bays may be tolerated short-term with engineer sign-off. Multiple missing braces or any missing brace in a load-bearing bay = stop work, clear the affected lifts, red-tag the scaffold, and escalate to the scaffold contractor.',
      },
      {
        title: 'Defect 3 — Edge protection gaps',
        body: 'Guardrails missing at any open edge, mid-rails removed, or toe boards missing on a working platform = immediate stop. Common when materials are stacked at an open edge and the rail was removed for loading then forgotten.',
      },
      {
        title: 'Defect 4 — Unauthorised modification',
        body: 'Any tube, board, or coupler added or removed by anyone other than the certified scaffold contractor invalidates the design. Even a single removed brace can change the load path. Tag out and re-inspect before restoration.',
        warning: 'Workers commonly remove tubes "just to fit a pipe through". This is a sackable offence on most sites and a leading cause of partial collapse.',
      },
      {
        title: 'Defect 5 — Foundation movement',
        body: 'Look for tilted standards, washed-out base plates, or sole boards bearing on soft ground. Common after rain or near excavations. Stop work, install additional sole boards or grout, re-plumb the standards before re-tagging.',
      },
    ],
  },
  {
    id: 'KB-015',
    title: 'Site Safety Walk — Daily Inspection Checklist',
    category: 'checklist',
    description: 'Daily 30-minute supervisor walk covering housekeeping, edge protection, permits, PPE compliance, and welfare.',
    estimatedTime: '30 min',
    difficulty: 'beginner',
    tags: ['safety walk', 'daily inspection', 'supervisor', 'housekeeping', 'PPE'],
    tools: ['Inspection app / tablet', 'Camera', 'Hi-vis & site PPE'],
    steps: [
      {
        title: 'Access and housekeeping',
        body: 'Walk every active area. Check access routes are clear, walkways defined, materials stacked safely (max 1.5 m), and waste removed daily. Slip/trip hazards (cables, hoses, water) addressed at source, not just signed.',
      },
      {
        title: 'Edge protection and openings',
        body: 'Every open edge above 2 m must have guardrail (950–1100 mm), mid-rail, and toe board. Floor openings covered, secured, and labelled. Check no temporary guardrails have been removed and not reinstated.',
      },
      {
        title: 'Permits in date and on display',
        body: 'For every active hot work, confined space, working at height, or LOTO job, locate the permit at the work face. Verify it is in date, signed by the issuer, and matches the activity in front of you. Stop work on any expired or missing permit.',
        warning: 'A permit that exists at the desk but not at the work face = effectively no permit. Operators must hold the live document.',
      },
      {
        title: 'PPE compliance',
        body: 'Spot-check workers across the site for the right PPE: hard hat, safety boots, hi-vis, gloves, eye protection. For task-specific PPE (hearing, respiratory, fall arrest, chemical), verify against the risk assessment. Coach in the field, escalate repeat non-compliance.',
      },
      {
        title: 'Plant and equipment',
        body: 'Check inspection tags on lifting gear, ladders, MEWPs, scaffolds, and hand tools. Tagged-out equipment must be physically locked or quarantined. Any defective gear in active use = immediate stop and remove from site.',
      },
      {
        title: 'Welfare facilities',
        body: 'Toilets clean, drinking water available, break area clean, first aid kit stocked and within seal date, AED charged and serviced. Fire muster point clearly signed and unobstructed.',
      },
      {
        title: 'Document and close findings',
        body: 'Photograph every observation. Log positives (good practice) as well as negatives. Raise corrective work orders for hazards needing more than on-the-spot fix. Brief findings at the next toolbox talk.',
        tip: 'A safety walk that finds zero issues usually means the walker did not look hard enough. Aim for 5 observations every walk — positive or corrective.',
      },
    ],
  },
  {
    id: 'KB-016',
    title: 'Legionella Risk — Hot & Cold Water Management',
    category: 'sop',
    description: 'Operational management of Legionella risk in domestic and process water systems: temperature monitoring, flushing, and remediation.',
    estimatedTime: '45 min read',
    difficulty: 'advanced',
    tags: ['legionella', 'water hygiene', 'occupational health', 'ACoP L8', 'SOP'],
    tools: ['Calibrated thermometer (probe or surface)', 'Sample bottles (sterile, sodium thiosulphate)', 'Flushing log', 'PPE: gloves & splash goggles'],
    steps: [
      {
        title: 'Understand the risk conditions',
        body: 'Legionella multiplies between 20–45 °C in stagnant or low-flow systems. The route of infection is inhalation of aerosols, so any outlet that aerosolises water (showers, eyewashes, cooling towers, spray taps) is a control point.',
        warning: 'Legionellosis is a notifiable disease in most jurisdictions. Any suspected case must be reported immediately to the HSE Manager and to the public health authority within the regulatory timeframe.',
      },
      {
        title: 'Monthly temperature monitoring',
        body: 'Calorifier flow ≥60 °C, return ≥50 °C. Sentinel hot outlets (nearest and furthest) must reach ≥50 °C within 1 minute of running. Cold water at sentinel outlets must remain <20 °C after 2 minutes of flow. Log every reading against the asset.',
      },
      {
        title: 'Flush low-use outlets weekly',
        body: 'Any outlet not used in the previous 7 days must be flushed for 2–5 minutes (cold then hot). Showers run at full flow with the head removed and the run-off into a bucket — never aerosolise into the room. Record every flush.',
      },
      {
        title: 'Inspect cold water storage',
        body: 'Annual inspection of CWS tanks: tight-fitting lid, insect screen, no debris, no insulation damage, no biofilm, water clear. Check stored temperature is <20 °C. Sample for total bacterial count if any deficiency is found.',
      },
      {
        title: 'Respond to a temperature failure',
        body: 'Out-of-spec reading → raise calorifier setpoint to 60 °C immediately, flush every outlet on the affected leg, take a Legionella sample (send to UKAS-accredited lab within 24 hours), and notify the HSE Manager. Do not return the system to normal until results are clear.',
        warning: 'Calorifier setpoint above 65 °C is a scald risk. Always pair temperature controls with thermostatic mixing valves at user outlets.',
      },
      {
        title: 'Document the written scheme',
        body: 'All monitoring, flushing, and remedial actions must be recorded against the written scheme of control. Records must be retained for 5 years (UK ACoP L8). Make the records available for audit at any time.',
      },
    ],
  },
  {
    id: 'KB-017',
    title: 'Emergency Evacuation — Site Marshal Quick Reference',
    category: 'guide',
    description: 'Quick-reference card for fire marshals and floor wardens during an evacuation: alarm verification, sweep, muster, head-count.',
    estimatedTime: '5 min',
    difficulty: 'beginner',
    tags: ['evacuation', 'fire marshal', 'emergency response', 'muster', 'quick reference'],
    tools: ['Hi-vis marshal vest', 'Torch', 'Two-way radio', 'Floor plan with sweep route', 'Muster sheet'],
    steps: [
      {
        title: 'Confirm the alarm — do not investigate',
        body: 'On hearing the alarm, put on your hi-vis and start the evacuation. Do not "go and check if it\'s real" — the alarm IS the trigger. Investigation is the brigade\'s job.',
        warning: 'Marshals delaying evacuation to investigate is a leading cause of casualty in commercial fires. Trust the alarm.',
      },
      {
        title: 'Sweep your zone',
        body: 'Walk your assigned zone in the planned route. Check toilets, meeting rooms, server rooms, plant rooms — anywhere a person can be. Open every door, look in, mark with a marker or door wedge to show "swept and clear".',
      },
      {
        title: 'Direct the flow',
        body: 'Direct people away from lifts (do not use), toward the nearest stairwell, and out via the designated exit. Calm but firm voice. Help anyone who appears confused, hesitant, or has a mobility impairment.',
      },
      {
        title: 'Personal Emergency Evacuation Plans',
        body: 'For pre-identified PEEP holders, escort them to the refuge area and operate the refuge intercom to notify the brigade of their location. Do not attempt to carry anyone down the stairs — the brigade has the right equipment.',
      },
      {
        title: 'Muster and head-count',
        body: 'At the muster point, your zone\'s sign-in list is the source of truth. Tick off every person physically present. Anyone unaccounted for is reported to the Incident Controller — by name, last known location, last seen time.',
      },
      {
        title: 'Hand over to brigade',
        body: 'When the brigade arrives, the Incident Controller (not individual marshals) briefs them. Marshals stand by and provide info on request. No-one re-enters the building until the brigade gives the All Clear.',
      },
    ],
  },
  {
    id: 'KB-018',
    title: 'PPE Cabinet — Monthly Inspection',
    category: 'video',
    description: 'Video guide to monthly inspection and replenishment of the site PPE cabinet: stock levels, expiry dates, and quarantine of damaged kit.',
    estimatedTime: '15 min',
    difficulty: 'beginner',
    tags: ['PPE', 'inspection', 'monthly', 'cabinet audit', 'video'],
    videoUrl: 'https://www.youtube.com/embed/kQCKmhpBj_4',
    thumbnailUrl: 'https://img.youtube.com/vi/kQCKmhpBj_4/hqdefault.jpg',
    steps: [
      {
        title: 'Match stock to risk assessment',
        body: 'Open the cabinet inventory list (matched to the site risk assessment). Verify min/max stock for each line: hard hats, safety glasses, gloves (chemical, cut, general), hearing protection, dust masks, FFP3, eyewash bottles, first-aid stock.',
      },
      {
        title: 'Check expiry dates',
        body: 'Inspect every dated item: respirator filters, chemical gloves, eyewash bottles, first-aid creams, AED pads. Quarantine anything within 30 days of expiry into a separate "use-first" box; bin anything expired.',
        warning: 'Expired respirator filters and chemical gloves give a false sense of protection. They must come out of the active cabinet immediately.',
      },
      {
        title: 'Inspect for damage and contamination',
        body: 'Check harnesses, lanyards, and reusable PPE for cuts, abrasion, chemical staining, or signs of shock-load. Quarantine any damaged item to the "Out of Service" tag. Do not return defective kit to the cabinet.',
      },
      {
        title: 'Replenish to max stock',
        body: 'Re-order from the approved supplier list. Verify the certifications on incoming PPE (CE / UKCA / ANSI marking) before adding to the cabinet. Wrong-spec gear (e.g. EN 388 1131 gloves where 4544 is required) is worse than no gear.',
      },
      {
        title: 'Sign and log',
        body: 'Sign the cabinet inspection card with date and your initials. Log results in the platform: items renewed, items quarantined, any near-stock-outs. A near-stock-out triggers a review of consumption rate and reorder threshold.',
      },
    ],
  },
  {
    id: 'KB-019',
    title: 'Inspection Compliance — Field Guide',
    category: 'sop',
    description: 'Guide for inspectors on accessing, completing, and closing scheduled OSH inspections in the platform, including evidence requirements.',
    estimatedTime: '10 min read',
    difficulty: 'beginner',
    tags: ['inspection', 'compliance', 'platform', 'SOP', 'documentation'],
    tools: ['Mobile device with platform access', 'Camera'],
    steps: [
      {
        title: 'Access your assigned inspections',
        body: 'Open the Field portal and navigate to Work Orders. Scheduled inspections appear with the "Inspection" tag. Filter to "Open" to see what is due. Tap an inspection to view the checklist and asset details.',
      },
      {
        title: 'Arrive on site and log start time',
        body: 'Tap "Start Inspection" the moment you arrive. This timestamps your arrival and starts the SLA clock honestly. Late starts skew SLA performance and reflect on the team.',
        warning: 'Starting an inspection before physically arriving on site is a recordable compliance breach and will be flagged in your monthly review.',
      },
      {
        title: 'Work the checklist in order',
        body: 'Tick each checklist item as completed. Mandatory items marked with * cannot be skipped — the platform will block submission until they are answered. Do not bulk-tick items at the end; complete in real time.',
      },
      {
        title: 'Upload before/after evidence',
        body: 'Photograph every defect found, every corrective action taken, and the final state. Photos must be clear, well-lit, and identifiable. Blurry or out-of-context shots are rejected by the supervisor and bounce the inspection back to you.',
        tip: 'Take the "after" shot from the same angle as the "before" — supervisor review takes seconds, not minutes, when angles match.',
      },
      {
        title: 'Add notes and submit',
        body: 'Resolution notes summarise: what was checked, what was found, what was actioned, and any onward referrals. Submit to send the inspection for supervisor review. Status moves to "Awaiting Review".',
      },
    ],
  },
  {
    id: 'KB-020',
    title: 'Incident Reporting — When and How',
    category: 'sop',
    description: 'SOP for inspectors and site personnel on logging and escalating incidents discovered on site, including near-misses and unsafe acts.',
    estimatedTime: '8 min read',
    difficulty: 'beginner',
    tags: ['incident', 'reporting', 'near-miss', 'escalation', 'SOP'],
    tools: ['Mobile device', 'Camera'],
    steps: [
      {
        title: 'Identify what must be reported',
        body: 'Report immediately: any injury or near-miss, fall from height, hazardous chemical release, fire or smoke, confined-space alarm, energised-circuit contact, scaffold movement, dropped object, or any unsafe act/condition affecting life-safety systems.',
        warning: 'Never assume someone else has reported a hazard. If you see it, you own it — log it within 15 minutes.',
      },
      {
        title: 'Make the area safe (if safe to do so)',
        body: 'Cordon off the hazard, isolate energy sources, apply LOTO if needed, and keep people clear. Do not put yourself at risk to make the area safe — calling for help is also a valid first action.',
      },
      {
        title: 'Log the incident in the platform',
        body: 'Open the platform → New Incident → complete: location, type, severity, description, your name, witnesses. Attach at least one photo. Submit within 15 minutes of discovery.',
        tip: 'Be factual and specific — "Anchor pull-test on AP-04 returned 4.2 kN against 6 kN spec, mast 3 of scaffold North-A1" beats "anchor not strong enough".',
      },
      {
        title: 'Notify your supervisor verbally',
        body: 'After logging, call or radio the site supervisor to confirm receipt. For critical incidents (any injury, life-safety, environmental release) — call first, then log. Always get a verbal acknowledgement.',
      },
      {
        title: 'Follow up to closure',
        body: 'Watch the incident through to closure in the platform. If a corrective work order is raised, track it. If actions stall past SLA, escalate to the HSE Manager. A near-miss closed without root-cause analysis is a missed prevention opportunity.',
      },
    ],
  },
];
