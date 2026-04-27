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
  propertyName?: string;
}

export const mockMemberProfiles: MockMemberProfile[] = [
  {
    id: 'mbr-001',
    name: 'Hassan Yousef',
    email: 'hassan.yousef@developmentx.ae',
    role: 'FM Manager',
    perspective: 'Strategic',
    assignedClients: ['Dubai Silicon Oasis', 'Gate Avenue DIFC'],
    zones: ['Cluster A', 'Cluster B', 'Block C'],
    skills: 'HVAC, Electrical, PPM Management, Asset Intelligence',
    responsibilities: 'Oversee FM operations for Dubai Silicon Oasis and Gate Avenue DIFC\nMonitor SLA performance and escalate breaches immediately\nReview AI dispatch recommendations and adjust automation rules weekly\nConduct monthly KPI reviews with account managers',
    photo: 'team/hassan-yousef.png',
    isActive: true,
  },
  {
    id: 'mbr-002',
    name: 'Karim R.',
    email: 'karim.r@developmentx.ae',
    role: 'FM Engineer',
    perspective: 'Operational',
    assignedClients: ['Dubai Silicon Oasis'],
    zones: ['Cluster A', 'Block C'],
    skills: 'HVAC Specialist, Refrigerant Handling, Predictive Maintenance',
    responsibilities: 'Respond to HVAC incidents in Cluster A within SLA targets\nConduct quarterly chiller and AHU servicing\nLog all interventions in the platform after each job\nTrain junior technicians on HVAC diagnostic procedures',
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
    responsibilities: 'Manage the Dubai Silicon Oasis client relationship\nDeliver monthly performance reports to the client board\nTrack contract renewal milestones and renewal readiness\nCoordinate with FM Manager on escalation resolution',
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
    skills: 'HVAC & Electrical, Site Safety, Permit to Work',
    responsibilities: 'Conduct daily site walk-arounds and log observations before 09:00\nEnsure all technicians hold valid permits for high-risk tasks\nChase overdue work orders 30 min before SLA breach\nReview team attendance and assign shift coverage',
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
    role: 'Hotel Guest',
    perspective: 'Client',
    assignedClients: ['Palace Residences Hotel'],
    zones: ['Dubai Creek Harbour'],
    skills: 'Hospitality Guest',
    responsibilities: 'Report maintenance issues in your room or hotel area\nTrack the status of your service request\nProvide feedback on completed maintenance',
    photo: 'team/sara-rashidi.png',
    isActive: true,
    clientSector: 'Hospitality',
    propertyName: 'Palace Residences Hotel',
  },
  {
    id: 'mbr-007',
    name: 'Ahmed K.',
    email: 'ahmed.k@developmentx.ae',
    role: 'FM Engineer',
    perspective: 'Operational',
    assignedClients: ['Dubai Silicon Oasis'],
    zones: ['Cluster B', 'Block C'],
    skills: 'Plumbing, Pipe Systems, Water Heater, Gate Systems',
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
    role: 'FM Engineer',
    perspective: 'Operational',
    assignedClients: ['Dubai Silicon Oasis'],
    zones: ['Cluster A', 'Block C'],
    skills: 'Electrical, Safety Inspections, MCB Panels, Fire Systems',
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
    role: 'FM Engineer',
    perspective: 'Operational',
    assignedClients: ['Dubai Silicon Oasis'],
    zones: ['Cluster A', 'Cluster B', 'Recreation Area'],
    skills: 'General Maintenance, Lift Safety, Pool & Grounds, Plumbing',
    responsibilities: 'General maintenance across all cluster zones\nConduct lift monthly safety checks\nManage pool pump and recreation area upkeep\nAssist with plumbing jobs in Cluster A when Ahmed K. is at capacity',
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
    role: 'FM Engineer',
    perspective: 'Operational',
    assignedClients: ['Dubai Silicon Oasis'],
    zones: ['Cluster B', 'Block C', 'Main Gate'],
    skills: 'Electrical, General Maintenance, HVAC (basic)',
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
    responsibilities: 'Conduct weekly safety walks across all zones\nManage fire exit compliance and safety inspection records\nAssist with general maintenance jobs across all clusters\nEnsure all technicians follow safety protocols on site',
    mobile: '+971 54 678 9012',
    availability: 'Full-time',
    shift: 'Business Hours (08:00–17:00)',
    commChannels: ['email', 'phone'],
    isActive: true,
  },
];

export const mockTechnicians = [
  { id: 'AK', name: 'Ahmed K.', skill: 'Plumbing', status: 'active', job: '#SI-301', lat: 25.1190, lng: 55.3760, rating: 4.6, jobsCompleted: 98 },
  { id: 'SM', name: 'Sara M.', skill: 'Electrical', status: 'available', lat: 25.1165, lng: 55.3790, rating: 4.9, jobsCompleted: 210 },
  { id: 'KR', name: 'Karim R.', skill: 'HVAC', status: 'transit', job: '#SI-2241', lat: 25.1180, lng: 55.3740, rating: 4.8, jobsCompleted: 142 },
  { id: 'FN', name: 'Faisal N.', skill: 'Plumbing', status: 'available', lat: 25.1155, lng: 55.3800, rating: 4.7, jobsCompleted: 87 },
  { id: 'OT', name: 'Omar T.', skill: 'General', status: 'overdue', job: '#SI-298', lat: 25.1200, lng: 55.3770, rating: 4.2, jobsCompleted: 63 },
];

export const mockIncidents = [
  {
    id: 'INC-SI-001', title: 'AC Failure', location: 'Villa 23, Cluster A',
    severity: 'critical', slaMinutes: 45, elapsed: 6, lat: 25.1185, lng: 55.3755, source: 'AI Capture',
    status: 'dispatched', assignedTech: 'Karim R.', techId: 'KR', closureNotes: null,
    clientId: 'CLT-001', siteId: 'silicon-oasis',
    description: 'AI detected frost pattern on evaporator coil. Consistent with R-410A refrigerant depletion. Resident confirmed unit not cooling.',
    imageUrl: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80',
    capturedAt: '10:08 AM · 11 Apr 2026',
    activityLog: [
      { time: '10:08 AM', event: 'AI Capture detected via resident photo', type: 'incident' },
      { time: '10:10 AM', event: 'Auto-classified: HVAC · Critical · 45 min SLA', type: 'ai' },
      { time: '10:12 AM', event: 'Karim R. dispatched — ETA 4 min · 0.4 km away', type: 'dispatch' },
    ],
  },
  {
    id: 'INC-SI-002', title: 'Water Leak', location: 'Villa 7, Cluster B',
    severity: 'medium', slaMinutes: 120, elapsed: 14, lat: 25.1160, lng: 55.3785, source: 'AI Capture',
    status: 'open', assignedTech: null, techId: null, closureNotes: null,
    clientId: 'CLT-002', siteId: 'gate-avenue',
    description: 'Resident submitted photo of water pooling under kitchen sink. AI matched pattern to slow pipe joint failure. No structural damage detected.',
    imageUrl: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80',
    capturedAt: '10:10 AM · 11 Apr 2026',
    activityLog: [
      { time: '10:10 AM', event: 'Incident reported via Resident App with photo', type: 'incident' },
      { time: '10:11 AM', event: 'Auto-classified: Plumbing · Medium · 120 min SLA', type: 'ai' },
    ],
  },
  {
    id: 'INC-SI-003', title: 'Lift Fault', location: 'Block C',
    severity: 'high', slaMinutes: 60, elapsed: 22, lat: 25.1195, lng: 55.3765, source: 'WhatsApp → Manual',
    status: 'in-progress', assignedTech: 'Faisal N.', techId: 'FN', closureNotes: null,
    clientId: 'CLT-003', siteId: 'business-bay',
    description: 'Lift stopped between floors — reported via WhatsApp message thread. Manual review escalated to high priority. No occupants trapped.',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    capturedAt: '09:58 AM · 11 Apr 2026',
    activityLog: [
      { time: '09:58 AM', event: 'WhatsApp message received from building supervisor', type: 'incident' },
      { time: '10:00 AM', event: 'Manual review — escalated to High · 60 min SLA', type: 'escalation' },
      { time: '10:05 AM', event: 'Faisal N. dispatched · General · 0.8 km', type: 'dispatch' },
      { time: '10:18 AM', event: 'Faisal N. on-site — diagnosis in progress', type: 'update' },
    ],
  },
  {
    id: 'INC-SI-004', title: 'Power Trip', location: 'Villa 31',
    severity: 'low', slaMinutes: 240, elapsed: 31, lat: 25.1170, lng: 55.3750, source: 'Resident App',
    status: 'assigned', assignedTech: 'Sara M.', techId: 'SM', closureNotes: null,
    clientId: 'CLT-001', siteId: 'silicon-oasis',
    description: 'Resident reported MCB tripping repeatedly. Likely caused by faulty appliance or overloaded circuit. Sara M. assigned for electrical inspection.',
    imageUrl: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&q=80',
    capturedAt: '09:49 AM · 11 Apr 2026',
    activityLog: [
      { time: '09:49 AM', event: 'Service request submitted via Resident App', type: 'incident' },
      { time: '09:51 AM', event: 'Auto-classified: Electrical · Low · 240 min SLA', type: 'ai' },
      { time: '09:55 AM', event: 'Sara M. assigned — ETA 22 min', type: 'dispatch' },
    ],
  },
  {
    id: 'INC-SI-005', title: 'Gate Intercom Down', location: 'Main Gate',
    severity: 'medium', slaMinutes: 180, elapsed: 45, lat: 25.1175, lng: 55.3775, source: 'Resident App',
    status: 'overdue', assignedTech: 'Omar T.', techId: 'OT', closureNotes: null,
    clientId: 'CLT-004', siteId: 'jlt-north',
    description: 'Main gate intercom system unresponsive. Multiple residents unable to grant access to visitors. Omar T. assigned but job is now overdue.',
    imageUrl: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=800&q=80',
    capturedAt: '09:30 AM · 11 Apr 2026',
    activityLog: [
      { time: '09:30 AM', event: 'Multiple residents reported via app', type: 'incident' },
      { time: '09:35 AM', event: 'Classified: Electrical · Medium · 180 min SLA', type: 'ai' },
      { time: '09:40 AM', event: 'Omar T. assigned — ETA 15 min', type: 'dispatch' },
      { time: '10:15 AM', event: 'SLA BREACH — job overdue by 15 min', type: 'escalation' },
    ],
  },
  {
    id: 'INC-SI-006', title: 'Pool Pump Noise', location: 'Recreation Area',
    severity: 'low', slaMinutes: 360, elapsed: 12, lat: 25.1168, lng: 55.3762, source: 'Resident App',
    status: 'open', assignedTech: null, techId: null, closureNotes: null,
    clientId: 'CLT-005', siteId: 'difc-tower',
    description: 'Unusually loud grinding noise from pool pump reported. IoT sensor confirms anomalous vibration signature. Predictive risk flagged at 41%.',
    imageUrl: 'https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=800&q=80',
    capturedAt: '10:12 AM · 11 Apr 2026',
    activityLog: [
      { time: '10:12 AM', event: 'Resident reported noise via app', type: 'incident' },
      { time: '10:13 AM', event: 'IoT corroboration: vibration anomaly on PP-02', type: 'ai' },
    ],
  },
  {
    id: 'INC-SI-007', title: 'Gym AC Serviced', location: 'Block C Gym',
    severity: 'medium', slaMinutes: 240, elapsed: 210, lat: 25.1190, lng: 55.3770, source: 'WhatsApp → Manual',
    status: 'closed', assignedTech: 'Karim R.', techId: 'KR',
    clientId: 'CLT-001', siteId: 'silicon-oasis',
    description: 'Scheduled maintenance service completed on gym AHU. Filter replaced, coils cleaned, refrigerant pressure verified. Unit operating within spec.',
    imageUrl: 'https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=800&q=80',
    capturedAt: 'Yesterday 09:00 AM',
    beforePhotoUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    afterPhotoUrl: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80',
    activityLog: [
      { time: 'Yesterday 09:00 AM', event: 'PPM task triggered — scheduled service due', type: 'incident' },
      { time: 'Yesterday 09:15 AM', event: 'Karim R. assigned for HVAC service', type: 'dispatch' },
      { time: 'Yesterday 11:30 AM', event: 'Service completed — photos submitted', type: 'update' },
      { time: 'Yesterday 11:45 AM', event: 'Supervisor approved closure — SLA met (210/240 min)', type: 'update' },
    ],
    closureNotes: 'Filter replaced (Grade F7). Coils cleaned — 15% fouling removed. Refrigerant at 98% nominal. No further action required. Next PPM due in 60 days.',
  },
];

export const mockClusters = [
  { id: 'A', lat: 25.1188, lng: 55.3758, villas: 42, incidents: 2 },
  { id: 'B', lat: 25.1162, lng: 55.3782, villas: 38, incidents: 0 },
  { id: 'C', lat: 25.1195, lng: 55.3768, villas: 55, incidents: 1 },
];

export const mockPPMSchedule = [
  {
    id: 'PPM-S-001', assetId: 'AST-002', asset: 'Lift — Cluster A, Block 2', type: 'Lift',
    task: 'Monthly Safety Check', skill: 'General', location: 'Cluster A, Block 2',
    daysUntilDue: -3, lastDone: 32, daysScheduled: 30, riskLevel: 'overdue',
    tech: 'Faisal N.', techId: 'FN', condition: 58, nextDueDate: '7 Apr',
    notes: 'Motor vibration anomaly detected by IoT — do not defer.',
  },
  {
    id: 'PPM-S-002', assetId: 'AST-001', asset: 'Chiller Unit C-04', type: 'HVAC',
    task: 'Quarterly HVAC Service', skill: 'HVAC', location: 'Block C Gym',
    daysUntilDue: 2, lastDone: 83, daysScheduled: 90, riskLevel: 'critical',
    tech: 'Karim R.', techId: 'KR', condition: 72, nextDueDate: '12 Apr',
    notes: 'Refrigerant pressure at 72%. Risk of failure in 4–6 days per prediction engine.',
  },
  {
    id: 'PPM-S-003', assetId: 'AST-002', asset: 'Gate Intercom System', type: 'Electrical',
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
    id: 'PPM-S-005', assetId: 'AST-001', asset: 'AHU — Block A Floor 2', type: 'HVAC',
    task: 'Filter & Coil Clean', skill: 'HVAC', location: 'Block A, Floor 2',
    daysUntilDue: 11, lastDone: 44, daysScheduled: 60, riskLevel: 'high',
    tech: 'Karim R.', techId: 'KR', condition: 81, nextDueDate: '21 Apr',
    notes: 'Scheduled routine service — no active faults.',
  },
  {
    id: 'PPM-S-006', assetId: 'AST-003', asset: 'Fire Suppression — Block B', type: 'Safety',
    task: '6-Month Suppression Test', skill: 'Safety', location: 'Block B',
    daysUntilDue: 14, lastDone: 166, daysScheduled: 180, riskLevel: 'medium',
    tech: null, techId: null, condition: 90, nextDueDate: '24 Apr',
    notes: 'Unassigned — requires certified fire safety technician.',
  },
  {
    id: 'PPM-S-007', assetId: 'AST-004', asset: 'Pool Pump PP-02', type: 'Plumbing',
    task: 'Monthly Inspection', skill: 'Plumbing', location: 'Recreation Area',
    daysUntilDue: 18, lastDone: 12, daysScheduled: 30, riskLevel: 'medium',
    tech: 'Ahmed K.', techId: 'AK', condition: 89, nextDueDate: '28 Apr',
    notes: 'Pressure variance detected over 5-day trend — monitor closely.',
  },
  {
    id: 'PPM-S-008', assetId: 'AST-003', asset: 'Generator G-01', type: 'Electrical',
    task: 'Quarterly Load Test', skill: 'Electrical', location: 'Community Centre',
    daysUntilDue: 34, lastDone: 56, daysScheduled: 90, riskLevel: 'low',
    tech: 'Sara M.', techId: 'SM', condition: 94, nextDueDate: '14 May',
    notes: 'No issues — scheduled as planned.',
  },
  {
    id: 'PPM-S-009', assetId: null, asset: 'Irrigation System', type: 'Plumbing',
    task: 'Seasonal Service', skill: 'Plumbing', location: 'Landscape Areas',
    daysUntilDue: 51, lastDone: 219, daysScheduled: 270, riskLevel: 'low',
    tech: 'Faisal N.', techId: 'FN', condition: 85, nextDueDate: '31 May',
    notes: 'Seasonal check — aligned with summer preparation schedule.',
  },
];

export interface PPMHistoryRecord {
  id: string;
  date: string;
  technician: string;
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
    aiInsight: 'Chiller Unit C-04 shows a declining condition trend over the last 4 services, with refrigerant pressure consistently underperforming. Three of the last four services flagged refrigerant-related findings, and the on-time compliance rate has dropped to 71% — indicating scheduling gaps that may be accelerating wear.',
    complianceRate: 71,
    avgDaysBetweenService: 88,
    failureFrequency: 1,
    recurringFindings: [
      { finding: 'Low refrigerant pressure', occurrences: 3, total: 4 },
      { finding: 'Condenser coil fouling', occurrences: 2, total: 4 },
      { finding: 'Filter replacement required', occurrences: 4, total: 4 },
    ],
    records: [
      { id: 'H-001-1', date: '12 Jan 2026', technician: 'Karim R.', techId: 'KR', result: 'partial', conditionScore: 72, durationMinutes: 140, findings: 'Refrigerant at 72% nominal — topped up to 89%. Condenser coils cleaned. Filter replaced (Grade F7). Minor belt wear noted.', partsUsed: ['R-410A Refrigerant 2kg', 'Filter Grade F7'], onTime: false },
      { id: 'H-001-2', date: '13 Oct 2025', technician: 'Karim R.', techId: 'KR', result: 'pass', conditionScore: 81, durationMinutes: 120, findings: 'Quarterly service completed. All readings within spec. Filter replaced. Coils cleaned — light fouling only. Refrigerant pressure at 94%.', partsUsed: ['Filter Grade F7'], onTime: true },
      { id: 'H-001-3', date: '10 Jul 2025', technician: 'Omar T.', techId: 'OT', result: 'partial', conditionScore: 78, durationMinutes: 175, findings: 'Refrigerant pressure at 76% — below threshold. Leak suspected at connection joint. Topped up. Joint re-sealed. Recommend follow-up in 30 days.', partsUsed: ['R-410A Refrigerant 3kg', 'Sealant Kit'], onTime: true },
      { id: 'H-001-4', date: '14 Apr 2025', technician: 'Karim R.', techId: 'KR', result: 'pass', conditionScore: 86, durationMinutes: 115, findings: 'Routine quarterly service. All parameters nominal. Filter replaced, coils washed, thermostat calibrated. Asset in good condition.', partsUsed: ['Filter Grade F7'], onTime: true },
      { id: 'H-001-5', date: '10 Jan 2025', technician: 'Karim R.', techId: 'KR', result: 'fail', conditionScore: 63, durationMinutes: 220, findings: 'Refrigerant critically low at 48%. Compressor showing intermittent fault. Full refrigerant recharge performed. Compressor contacts replaced. Follow-up required.', partsUsed: ['R-410A Refrigerant 5kg', 'Compressor Contacts'], onTime: false },
      { id: 'H-001-6', date: '11 Oct 2024', technician: 'Karim R.', techId: 'KR', result: 'pass', conditionScore: 88, durationMinutes: 110, findings: 'Standard quarterly service. Minor condenser fouling cleared. All readings nominal post-service. Asset operating within specification.', onTime: true },
    ],
  },
  {
    assetId: 'AST-002',
    aiInsight: 'Lift Cluster A Block 2 has a concerning vibration history — motor anomalies were detected in 3 of the last 4 services. The asset compliance rate is 58%, suggesting PPMs are frequently deferred. Given the active IoT vibration alert, the risk of imminent failure is elevated and immediate intervention is recommended.',
    complianceRate: 58,
    avgDaysBetweenService: 34,
    failureFrequency: 2,
    recurringFindings: [
      { finding: 'Motor vibration anomaly', occurrences: 3, total: 4 },
      { finding: 'Guide rail lubrication needed', occurrences: 4, total: 4 },
      { finding: 'Door sensor misalignment', occurrences: 2, total: 4 },
    ],
    records: [
      { id: 'H-002-1', date: '9 Mar 2026', technician: 'Faisal N.', techId: 'FN', result: 'partial', conditionScore: 58, durationMinutes: 95, findings: 'Monthly safety check. Motor vibration at 4.2mm/s — above 3.5mm/s threshold. Guide rails lubricated. Door sensors adjusted. Vibration issue escalated for specialist review.', onTime: false },
      { id: 'H-002-2', date: '6 Feb 2026', technician: 'Faisal N.', techId: 'FN', result: 'pass', conditionScore: 64, durationMinutes: 80, findings: 'Monthly check completed. Light vibration noted (3.1mm/s — within tolerance). Rails lubricated. Emergency button tested and functional. Cabin lighting checked.', onTime: false },
      { id: 'H-002-3', date: '5 Jan 2026', technician: 'Ahmed K.', techId: 'AK', result: 'fail', conditionScore: 55, durationMinutes: 180, findings: 'Motor overheating detected (82°C — limit is 75°C). Lift taken out of service for 4 hours. Motor cooling fan replaced. Bearings greased. Service resumed after cool-down.', partsUsed: ['Cooling Fan Assembly', 'Bearing Grease 500g'], onTime: true },
      { id: 'H-002-4', date: '4 Dec 2025', technician: 'Faisal N.', techId: 'FN', result: 'partial', conditionScore: 62, durationMinutes: 90, findings: 'Motor vibration elevated (3.9mm/s). Door sensor on Floor 3 misaligned — adjusted and re-tested. Guide rails lubricated. Recommend motor inspection next service.', onTime: true },
      { id: 'H-002-5', date: '2 Nov 2025', technician: 'Faisal N.', techId: 'FN', result: 'pass', conditionScore: 71, durationMinutes: 75, findings: 'Standard monthly check. All parameters within spec. No anomalies detected. Rails lubricated, emergency lighting tested.', onTime: true },
      { id: 'H-002-6', date: '1 Oct 2025', technician: 'Ahmed K.', techId: 'AK', result: 'pass', conditionScore: 75, durationMinutes: 85, findings: 'Monthly safety inspection completed. Cabin interior checked. Safety switches tested. Drive belt tension verified. Asset in satisfactory condition.', onTime: false },
    ],
  },
  {
    assetId: 'AST-003',
    aiInsight: 'Generator G-01 has an excellent maintenance track record with 100% compliance and consistent pass results across all 6 recorded services. Condition scores have remained above 90% throughout, and no recurring faults have been identified. The asset is well-maintained and operating well within expected parameters — a model example of preventive maintenance done right.',
    complianceRate: 100,
    avgDaysBetweenService: 91,
    failureFrequency: 0,
    recurringFindings: [
      { finding: 'Load test completed successfully', occurrences: 6, total: 6 },
      { finding: 'Battery voltage check — nominal', occurrences: 6, total: 6 },
      { finding: 'Fuel level verified and topped up', occurrences: 6, total: 6 },
    ],
    records: [
      { id: 'H-003-1', date: '15 Jan 2026', technician: 'Sara M.', techId: 'SM', result: 'pass', conditionScore: 94, durationMinutes: 120, findings: 'Quarterly load test conducted at 80% rated capacity for 30 minutes. All readings nominal. Battery voltage 13.8V. Fuel at 92%. Coolant level OK.', onTime: true },
      { id: 'H-003-2', date: '16 Oct 2025', technician: 'Sara M.', techId: 'SM', result: 'pass', conditionScore: 95, durationMinutes: 115, findings: 'Load test completed. Transfer switch tested — 2.3s switchover (within 3s SLA). Engine oil changed. Air filter cleaned. All systems nominal.', partsUsed: ['Engine Oil 5L', 'Air Filter'], onTime: true },
      { id: 'H-003-3', date: '18 Jul 2025', technician: 'Omar T.', techId: 'OT', result: 'pass', conditionScore: 93, durationMinutes: 130, findings: 'Quarterly service. Load test at 75% capacity — stable. Voltage regulator tested. Fuel injectors cleaned. Battery replaced as preventive measure.', partsUsed: ['Battery 12V 100Ah'], onTime: true },
      { id: 'H-003-4', date: '22 Apr 2025', technician: 'Sara M.', techId: 'SM', result: 'pass', conditionScore: 96, durationMinutes: 105, findings: 'Routine quarterly service. All parameters excellent. Load test completed. Radiator checked — no leaks. Coolant topped up. Asset in excellent condition.', partsUsed: ['Coolant 2L'], onTime: true },
      { id: 'H-003-5', date: '19 Jan 2025', technician: 'Sara M.', techId: 'SM', result: 'pass', conditionScore: 95, durationMinutes: 118, findings: 'Quarterly load test completed — 85% rated capacity for 35 minutes. All fuel, battery, coolant, and oil readings within spec. Exhaust checked — no abnormal emissions. No issues found.', onTime: true },
      { id: 'H-003-6', date: '20 Oct 2024', technician: 'Omar T.', techId: 'OT', result: 'pass', conditionScore: 97, durationMinutes: 108, findings: 'Quarterly service. Load test at 80% capacity — generator held load steadily for 30 minutes. Engine oil changed. Air filter replaced. Fuel topped up to 100%. Asset performing excellently.', partsUsed: ['Engine Oil 5L', 'Air Filter'], onTime: true },
    ],
  },
  {
    assetId: 'AST-004',
    aiInsight: 'Pool Pump PP-02 has been well-maintained with mostly pass results, though a persistent pressure variance issue has emerged over the last 3 services. The current IoT sensor reading anomalous vibration directly aligns with the strainer blockage and impeller wear pattern observed since November 2025. Early intervention is advisable before the next monthly inspection to prevent escalation.',
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
      { id: 'H-004-1', date: '31 Mar 2026', technician: 'Ahmed K.', techId: 'AK', result: 'partial', conditionScore: 89, durationMinutes: 65, findings: 'Monthly inspection. Pressure variance of ±0.4 bar noted — borderline tolerance. Impeller inspected — minor leading-edge wear detected. Seals intact. Monitoring recommended.', onTime: true },
      { id: 'H-004-2', date: '28 Feb 2026', technician: 'Ahmed K.', techId: 'AK', result: 'pass', conditionScore: 91, durationMinutes: 60, findings: 'Routine inspection completed. Pump pressure stable. Flow rate at 98% nominal. Impeller clear. No issues noted.', onTime: true },
      { id: 'H-004-3', date: '30 Jan 2026', technician: 'Faisal N.', techId: 'FN', result: 'partial', conditionScore: 87, durationMinutes: 80, findings: 'Pressure oscillation of ±0.5 bar detected during inspection. Strainer cleaned — significant debris found. Pressure stabilised post-clean. Impeller checked — intact.', onTime: false },
      { id: 'H-004-4', date: '31 Dec 2025', technician: 'Ahmed K.', techId: 'AK', result: 'pass', conditionScore: 92, durationMinutes: 55, findings: 'Year-end inspection. All readings nominal. Pump running smoothly. Seals and gaskets in good condition. Lubrication applied to motor bearings.', partsUsed: ['Bearing Lubricant'], onTime: true },
      { id: 'H-004-5', date: '30 Nov 2025', technician: 'Ahmed K.', techId: 'AK', result: 'partial', conditionScore: 88, durationMinutes: 70, findings: 'Pressure variance of ±0.3 bar first observed this service. Strainer inspected — light debris accumulation cleared. Impeller checked, no wear. Seals intact. Flagged for monitoring.', onTime: true },
      { id: 'H-004-6', date: '31 Oct 2025', technician: 'Faisal N.', techId: 'FN', result: 'pass', conditionScore: 93, durationMinutes: 58, findings: 'Monthly inspection. All pressures nominal. Impeller visually inspected — clear. Seals checked — no leaks. Motor temperature within limits. Asset in good condition.', onTime: true },
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
      { id: 'H-005-1', date: '20 Sep 2025', technician: 'Sara M.', techId: 'SM', result: 'pass', conditionScore: 97, durationMinutes: 180, findings: '6-month inspection completed. All 48 zone detectors tested and functional. Panel battery backup duration verified at 72 hours. All sounders and strobes tested. Regulatory sign-off completed.', onTime: true },
      { id: 'H-005-2', date: '22 Mar 2025', technician: 'Sara M.', techId: 'SM', result: 'pass', conditionScore: 98, durationMinutes: 175, findings: 'Bi-annual inspection. Detector sensitivity calibrated. Manual call points tested. Control panel firmware updated to v3.2.1. All outputs verified functional.', partsUsed: ['Firmware Update Kit'], onTime: true },
      { id: 'H-005-3', date: '20 Sep 2024', technician: 'Omar T.', techId: 'OT', result: 'pass', conditionScore: 99, durationMinutes: 165, findings: 'Full 6-month fire panel inspection. All systems passed. No faults or degradation detected. Panel in excellent condition. Next inspection due March 2025.', onTime: true },
      { id: 'H-005-4', date: '21 Mar 2024', technician: 'Sara M.', techId: 'SM', result: 'pass', conditionScore: 98, durationMinutes: 178, findings: 'Bi-annual inspection completed. All 48 detectors functioning. Manual call points across all zones tested — all operational. Battery backup load-tested — 72-hour capacity confirmed. Regulatory checklist signed off.', onTime: true },
      { id: 'H-005-5', date: '22 Sep 2023', technician: 'Sara M.', techId: 'SM', result: 'pass', conditionScore: 97, durationMinutes: 172, findings: '6-month inspection. Control panel diagnostics run — no fault codes. All zones active. Sounder circuit tested in all zones. Fault LED test passed. Battery checked — 12.9V open circuit voltage.', onTime: true },
      { id: 'H-005-6', date: '24 Mar 2023', technician: 'Omar T.', techId: 'OT', result: 'pass', conditionScore: 96, durationMinutes: 160, findings: 'Annual inspection and bi-annual interim. All detectors, sounders, and manual call points tested. Control panel Earth fault checked — none detected. Panel cleaned. Sign-off documentation submitted to compliance team.', onTime: true },
    ],
  },
];

const RISK_PRIORITY: Record<string, number> = { overdue: 0, critical: 1, high: 2, medium: 3, low: 4 };
export const mockPPMRisks = [...mockPPMSchedule]
  .sort((a, b) => (RISK_PRIORITY[a.riskLevel] ?? 9) - (RISK_PRIORITY[b.riskLevel] ?? 9))
  .slice(0, 3)
  .map(p => ({ id: p.id, asset: p.asset, type: p.task, daysUntilDue: p.daysUntilDue, lastDone: p.lastDone, riskLevel: p.riskLevel }));

export const mockDispatchJobs = [
  { id: 'SI-2241', title: 'AC Failure — Villa 23, Cluster A', severity: 'critical', minutesAgo: 6, slaRemaining: 39, aiMatch: { tech: 'Karim R.', distance: '0.4km', reason: 'HVAC Certified · No parts needed' } },
  { id: 'SI-2242', title: 'Water Leak — Villa 7, Cluster B', severity: 'medium', minutesAgo: 14, slaRemaining: 106, aiMatch: { tech: 'Faisal N.', distance: '0.6km', reason: 'Plumbing · Tools on hand' } },
  { id: 'SI-2243', title: 'Power Trip — Villa 31', severity: 'low', minutesAgo: 31, slaRemaining: 209, aiMatch: { tech: 'Sara M.', distance: '0.8km', reason: 'Electrical · Available now' } },
];

export const mockChecklist = [
  { id: 1, text: 'Visual inspection — chiller unit exterior', mandatory: false, done: true, evidenceRequired: false },
  { id: 2, text: 'Check refrigerant pressure readings', mandatory: true, done: true, evidenceRequired: false },
  { id: 3, text: 'Clean condenser coils', mandatory: false, done: false, evidenceRequired: false },
  { id: 4, text: 'Test thermostat calibration', mandatory: true, done: false, evidenceRequired: false },
  { id: 5, text: 'Upload before & after photos of completed repair', mandatory: true, done: false, evidenceRequired: true },
];

export const mockParts = [
  { name: 'R-410A Refrigerant 10kg', inStock: 0, status: 'out' },
  { name: 'Filter Type-B', inStock: 3, status: 'low' },
  { name: 'Condenser Belt', inStock: 12, status: 'ok' },
  { name: 'Thermostat Unit', inStock: 7, status: 'ok' },
  { name: 'Copper Pipe 22mm', inStock: 2, status: 'low' },
];

export const mockLoggedInTech = {
  id: 'KR', name: 'Karim R.', role: 'HVAC Specialist', pin: '1234', avatar: 'KR', rating: 4.8, jobsCompleted: 142, email: 'karim.r@developmentx.ae',
};

export const mockNotifications = [
  { id: 1, type: 'critical', text: 'AC Failure reported — Villa 23, Silicon Oasis', sub: 'AI captured via photo · 6 min ago', read: false },
  { id: 2, type: 'warning', text: 'SLA breach warning — Job #SI-298 (Omar T.)', sub: '12 min remaining before breach · 14 min ago', read: false },
  { id: 3, type: 'info', text: 'Karim R. assigned to Job #SI-2241', sub: 'GPS tracking started · En route · 18 min ago', read: false },
];

export const mockAssets = [
  { id: 'AST-001', name: 'Chiller Unit C-04', type: 'HVAC', location: 'Block C Gym', status: 'warning', lastService: '83 days ago', nextPPM: '8 days', condition: 72, lat: 25.1195, lng: 55.3768 },
  { id: 'AST-002', name: 'Lift — Cluster A Block 2', type: 'Lift', location: 'Cluster A, Block 2', status: 'critical', lastService: '29 days ago', nextPPM: '2 days', condition: 58, lat: 25.1188, lng: 55.3758 },
  { id: 'AST-003', name: 'Generator G-01', type: 'Electrical', location: 'Community Centre', status: 'ok', lastService: '12 days ago', nextPPM: '48 days', condition: 94, lat: 25.1175, lng: 55.3780 },
  { id: 'AST-004', name: 'Pool Pump PP-02', type: 'Plumbing', location: 'Recreation Area', status: 'ok', lastService: '5 days ago', nextPPM: '25 days', condition: 89, lat: 25.1168, lng: 55.3762 },
  { id: 'AST-005', name: 'Fire Panel FP-01', type: 'Safety', location: 'Community Centre', status: 'ok', lastService: '44 days ago', nextPPM: '136 days', condition: 97, lat: 25.1172, lng: 55.3778 },
];

export const mockTasks = [
  { id: 'TSK-2241', title: 'AC Repair — Villa 23', tech: 'Karim R.', status: 'in-progress', skill: 'HVAC', priority: 'critical', eta: '14 min', lat: 25.1185, lng: 55.3755 },
  { id: 'TSK-2239', title: 'Plumbing Fix — Villa 7', tech: 'Ahmed K.', status: 'completed', skill: 'Plumbing', priority: 'medium', eta: 'Done', lat: 25.1160, lng: 55.3785 },
  { id: 'TSK-2242', title: 'Electrical Inspection — Villa 31', tech: 'Sara M.', status: 'assigned', skill: 'Electrical', priority: 'low', eta: '22 min', lat: 25.1170, lng: 55.3750 },
  { id: 'TSK-2243', title: 'Lift Safety Check — Block 2', tech: 'Faisal N.', status: 'pending', skill: 'General', priority: 'high', eta: 'Unscheduled', lat: 25.1190, lng: 55.3762 },
];

export const mockSLAZones = [
  { id: 'SLA-001', incidentId: 'INC-SI-001', radius: 180, riskLevel: 'critical', lat: 25.1185, lng: 55.3755 },
  { id: 'SLA-002', incidentId: 'INC-SI-003', radius: 140, riskLevel: 'high', lat: 25.1195, lng: 55.3765 },
  { id: 'SLA-003', incidentId: 'INC-SI-002', radius: 100, riskLevel: 'medium', lat: 25.1160, lng: 55.3785 },
];

export const mockPredictedFailures = [
  { id: 'PRD-001', asset: 'Chiller C-04', probability: 87, horizon: '4–6 days', category: 'HVAC', reason: 'Refrigerant at 72%, blockage 34%', lat: 25.1196, lng: 55.3770 },
  { id: 'PRD-002', asset: 'Lift Cluster A', probability: 73, horizon: '2–3 days', category: 'Mechanical', reason: 'Motor vibration anomaly detected', lat: 25.1190, lng: 55.3756 },
  { id: 'PRD-003', asset: 'Pool Pump PP-02', probability: 41, horizon: '10–14 days', category: 'Plumbing', reason: 'Pressure variance over 5-day trend', lat: 25.1168, lng: 55.3762 },
];

export const mockKanbanTasks = [
  { id: 'KT-001', title: 'AC Filter Replacement', asset: 'AHU-Block A', location: 'Block A, Floor 2', skill: 'HVAC', priority: 'high', status: 'new', tech: null, slaMinutes: 120, elapsed: 5, reportedBy: 'Resident App', evidence: [] },
  { id: 'KT-002', title: 'Water Heater Fault', asset: 'WH-Villa 14', location: 'Villa 14, Cluster B', skill: 'Plumbing', priority: 'medium', status: 'new', tech: null, slaMinutes: 180, elapsed: 12, reportedBy: 'WhatsApp', evidence: [] },
  { id: 'KT-003', title: 'HVAC Corrective — Villa 23', asset: 'Chiller C-04', location: 'Villa 23, Cluster A', skill: 'HVAC', priority: 'critical', status: 'assigned', tech: 'Karim R.', slaMinutes: 45, elapsed: 6, reportedBy: 'AI Capture', evidence: [] },
  { id: 'KT-004', title: 'Power Trip — Villa 31', asset: 'MCB Panel', location: 'Villa 31', skill: 'Electrical', priority: 'low', status: 'assigned', tech: 'Sara M.', slaMinutes: 240, elapsed: 31, reportedBy: 'Resident App', evidence: [] },
  { id: 'KT-005', title: 'Lift Safety Check', asset: 'Lift-Cluster A', location: 'Cluster A, Block 2', skill: 'General', priority: 'high', status: 'in-progress', tech: 'Faisal N.', slaMinutes: 60, elapsed: 18, reportedBy: 'PPM Schedule', evidence: [] },
  { id: 'KT-006', title: 'Plumbing Fix — Villa 7', asset: 'Pipe M22', location: 'Villa 7, Cluster B', skill: 'Plumbing', priority: 'medium', status: 'in-progress', tech: 'Ahmed K.', slaMinutes: 120, elapsed: 14, reportedBy: 'AI Capture', evidence: [] },
  { id: 'KT-007', title: 'Pool Pump Inspection', asset: 'PP-02', location: 'Recreation Area', skill: 'Plumbing', priority: 'low', status: 'awaiting-evidence', tech: 'Faisal N.', slaMinutes: 360, elapsed: 45, reportedBy: 'PPM Schedule', evidence: [] },
  { id: 'KT-008', title: 'Fire Panel Annual Check', asset: 'FP-01', location: 'Community Centre', skill: 'Safety', priority: 'high', status: 'awaiting-evidence', tech: 'Sara M.', slaMinutes: 480, elapsed: 120, reportedBy: 'Compliance', evidence: [] },
  { id: 'KT-009', title: 'Gym AC Service', asset: 'AHU-Gym', location: 'Block C Gym', skill: 'HVAC', priority: 'medium', status: 'closed', tech: 'Karim R.', slaMinutes: 240, elapsed: 210, reportedBy: 'PPM Schedule', evidence: ['photo_before.jpg', 'photo_after.jpg'] },
  { id: 'KT-010', title: 'Gate Intercom Repair', asset: 'IC-Main-Gate', location: 'Main Gate', skill: 'Electrical', priority: 'medium', status: 'closed', tech: 'Ahmed K.', slaMinutes: 180, elapsed: 160, reportedBy: 'Supervisor', evidence: ['intercom_photo.jpg'] },
  { id: 'KT-011', title: 'Corridor Light Fix', asset: 'Light-B3', location: 'Block B, Corridor 3', skill: 'Electrical', priority: 'low', status: 'overdue', tech: 'Omar T.', slaMinutes: 60, elapsed: 82, reportedBy: 'Resident App', evidence: [] },
  { id: 'KT-012', title: 'Roof AC Unit — Block D', asset: 'ACU-Roof-D', location: 'Block D Rooftop', skill: 'HVAC', priority: 'high', status: 'overdue', tech: 'Omar T.', slaMinutes: 90, elapsed: 134, reportedBy: 'AI Capture', evidence: [] },
];

export const mockTechPerformance = {
  name: 'Karim R.',
  role: 'HVAC Specialist',
  id: 'KR',
  rating: 4.8,
  jobsCompleted: 142,
  jobsThisMonth: 18,
  slaSuccessRate: 94,
  avgResponseTime: 8.4,
  avgResolutionTime: 42,
  efficiency: 89,
  categories: [
    { label: 'HVAC', count: 11, color: '#2E7FFF' },
    { label: 'General', count: 4, color: '#38D98A' },
    { label: 'Plumbing', count: 3, color: '#FF9B38' },
  ],
  recentJobs: [
    { id: 'SI-2241', title: 'HVAC — Villa 23', status: 'in-progress', sla: 'On Track', date: 'Today' },
    { id: 'SI-2235', title: 'Gym AC Service', status: 'closed', sla: 'Met', date: 'Yesterday' },
    { id: 'SI-2228', title: 'Chiller Inspection', status: 'closed', sla: 'Met', date: '2 days ago' },
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
    description: 'Network of 86 IoT sensors across HVAC units, lifts, and water systems. Feeds the predictive failure engine.',
  },
  {
    id: 'DS-004', name: 'QR Inspection Scanner', type: 'QR', status: 'active' as const,
    lastSync: '18 min ago', lastSyncTime: '10:06 AM', volume: 120, quality: 88,
    owner: 'Supervisors', frequency: 'On scan',
    feeds: ['Inspection records', 'Checklists'],
    errors: [] as { time: string; message: string; severity: string }[],
    description: 'Mobile QR code scanning for physical asset inspections. Technicians scan on-site to log inspection results.',
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
    id: 'DS-006', name: 'Resident App API', type: 'API', status: 'active' as const,
    lastSync: '1 min ago', lastSyncTime: '10:23 AM', volume: 210, quality: 95,
    owner: 'Product', frequency: 'Real-time',
    feeds: ['Service requests', 'Ratings', 'Feedback'],
    errors: [] as { time: string; message: string; severity: string }[],
    description: 'Resident-facing mobile application. Submits requests, captures photos, and receives live service updates.',
  },
  {
    id: 'DS-007', name: 'Power BI Reports', type: 'External System', status: 'error' as const,
    lastSync: '3 hr ago', lastSyncTime: '07:22 AM', volume: 0, quality: 0,
    owner: 'Analytics', frequency: 'Every 6 hrs',
    feeds: ['SLA reports', 'KPI dashboards'],
    errors: [
      { time: '07:22 AM', message: 'Authentication token expired — refresh required', severity: 'error' },
      { time: '01:22 AM', message: 'Connection timeout after 30s — retry failed', severity: 'warning' },
    ],
    description: 'Microsoft Power BI integration for executive reporting. Currently experiencing authentication token issues.',
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
    category: 'FM & HVAC',
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
      'First-time fix rate of 91% reflects strong diagnostic capability; repeat visits are rare and concentrated in complex HVAC faults.',
      'Evidence compliance at 95% indicates reliable documentation; before/after photos submitted on 95% of closed jobs.',
      'Average cost per job of AED 420 is 18% below peer average — strong cost efficiency without compromising quality.',
    ],
    anomaly: null,
    contractFlags: [],
    predictedRisk30d: 8,
    projectedTrend: 'up',
    recommendations: [
      { title: 'Expand scope to Business Bay', detail: 'Performance data supports extending DevelopmentX Core\'s HVAC scope to Business Bay cluster — projected to reduce response time by 22%.', action: 'renegotiate' },
      { title: 'Maintain current SLA terms', detail: 'No renegotiation required — vendor is consistently outperforming SLA targets across all three managed sites.', action: 'review' },
    ],
    dependencyRisk: 'Medium',
    dependencyNote: '3 sites depend on this vendor — a performance drop would impact 58% of managed properties.',
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
    category: 'General & Safety',
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
    category: 'FM & Electrical',
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
    category: 'Engineering & Civil',
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
    anomaly: '3 SLA breaches in last 30 days — elevated breach rate for Engineering scope. Monitor trend.',
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
    category: 'Cleaning & Soft FM',
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
  { id: 'EV-001', time: '09:00', minute: 0,  type: 'incident',      entity: 'INC-SI-004', title: 'Power Trip reported — Villa 31', severity: 'low',      lat: 25.1170, lng: 55.3750 },
  { id: 'EV-002', time: '09:02', minute: 2,  type: 'assignment',    entity: 'INC-SI-004', title: 'Sara M. dispatched — Electrical', severity: 'info',    lat: 25.1165, lng: 55.3790 },
  { id: 'EV-003', time: '09:08', minute: 8,  type: 'incident',      entity: 'INC-SI-001', title: 'AC Failure reported — Villa 23 · AI Capture', severity: 'critical', lat: 25.1185, lng: 55.3755 },
  { id: 'EV-004', time: '09:10', minute: 10, type: 'assignment',    entity: 'INC-SI-001', title: 'Karim R. dispatched — HVAC · 0.4 km', severity: 'info', lat: 25.1180, lng: 55.3740 },
  { id: 'EV-005', time: '09:16', minute: 16, type: 'task-update',   entity: 'TSK-2241',   title: 'Karim R. arrived on-site — Villa 23', severity: 'info', lat: 25.1185, lng: 55.3755 },
  { id: 'EV-006', time: '09:22', minute: 22, type: 'incident',      entity: 'INC-SI-003', title: 'Lift Fault reported — Block C', severity: 'high',        lat: 25.1195, lng: 55.3765 },
  { id: 'EV-007', time: '09:25', minute: 25, type: 'sla-escalation',entity: 'INC-SI-003', title: 'SLA warning — Lift Fault · 35 min remaining', severity: 'warning', lat: 25.1195, lng: 55.3765 },
  { id: 'EV-008', time: '09:30', minute: 30, type: 'assignment',    entity: 'INC-SI-003', title: 'Faisal N. dispatched — General · 0.8 km', severity: 'info', lat: 25.1155, lng: 55.3800 },
  { id: 'EV-009', time: '09:41', minute: 41, type: 'task-update',   entity: 'TSK-2241',   title: 'Repair in progress — HVAC Villa 23', severity: 'info',    lat: 25.1185, lng: 55.3755 },
  { id: 'EV-010', time: '09:54', minute: 54, type: 'closure',       entity: 'TSK-2241',   title: 'Job closed — HVAC Villa 23 · SLA Met ✓', severity: 'success', lat: 25.1185, lng: 55.3755 },
  { id: 'EV-011', time: '10:02', minute: 62, type: 'sla-escalation',entity: 'INC-SI-002', title: 'SLA breached — Water Leak Villa 7', severity: 'error',   lat: 25.1160, lng: 55.3785 },
  { id: 'EV-012', time: '10:06', minute: 66, type: 'incident',      entity: 'INC-SI-002', title: 'Water Leak escalated — Cluster B', severity: 'medium',   lat: 25.1160, lng: 55.3785 },
  { id: 'EV-013', time: '10:14', minute: 74, type: 'incident',      entity: 'INC-SI-005', title: 'New AC request — Villa 23 · Resident App', severity: 'critical', lat: 25.1185, lng: 55.3755 },
  { id: 'EV-014', time: '10:16', minute: 76, type: 'assignment',    entity: 'INC-SI-005', title: 'Karim R. re-dispatched · ETA 18 min', severity: 'info',  lat: 25.1180, lng: 55.3740 },
];

export const mockAiClassification = {
  category: 'AC / HVAC',
  subCategory: 'Refrigerant / Cooling Failure',
  confidence: 94,
  priority: 'critical' as const,
  slaWindow: '2 hours',
  reasoning:
    'Frost pattern on evaporator coil detected. Compressor vibration signature visible in photo metadata. Consistent with low refrigerant pressure.',
  signals: [
    { label: 'Visual signal', value: 'Frost on coil unit', match: 97 },
    { label: 'Pattern match', value: 'R-410A shortage profile', match: 91 },
    { label: 'Asset history', value: 'Last serviced 83 days ago', match: 88 },
  ],
};

export const mockSmartDispatch = [
  {
    incidentId: 'INC-SI-001',
    incidentTitle: 'AC Failure — Villa 23, Cluster A',
    severity: 'critical',
    slaRemaining: 39,
    recommendations: [
      { tech: 'Karim R.', techId: 'KR', skill: 'HVAC', distance: '0.4 km', eta: '4 min', skillMatch: 98, availability: 'en-route', reason: 'HVAC certified · Nearest available · No parts needed' },
      { tech: 'Ahmed K.', techId: 'AK', skill: 'Plumbing', distance: '1.1 km', eta: '9 min', skillMatch: 52, availability: 'busy', reason: 'Partial skill match · Currently on another job' },
    ],
  },
  {
    incidentId: 'INC-SI-002',
    incidentTitle: 'Water Leak — Villa 7, Cluster B',
    severity: 'medium',
    slaRemaining: 106,
    recommendations: [
      { tech: 'Faisal N.', techId: 'FN', skill: 'Plumbing', distance: '0.6 km', eta: '6 min', skillMatch: 100, availability: 'available', reason: 'Plumbing specialist · Tools on hand · Fully available' },
      { tech: 'Ahmed K.', techId: 'AK', skill: 'Plumbing', distance: '0.9 km', eta: '8 min', skillMatch: 95, availability: 'busy', reason: 'Strong match · Currently finishing Job SI-301' },
    ],
  },
  {
    incidentId: 'INC-SI-003',
    incidentTitle: 'Lift Fault — Block C',
    severity: 'high',
    slaRemaining: 38,
    recommendations: [
      { tech: 'Sara M.', techId: 'SM', skill: 'Electrical', distance: '0.8 km', eta: '7 min', skillMatch: 85, availability: 'available', reason: 'Electrical systems certified · Fully available · High rating' },
    ],
  },
];

export const mockAICaptures = [
  {
    id: 'AIC-001', category: 'HVAC', subCategory: 'Cooling Failure',
    title: 'Frost Pattern on AC Evaporator Coil', location: 'Villa 23, Cluster A',
    severity: 'critical', confidence: 94, source: 'Resident App Photo',
    capturedAt: '10:08 AM', status: 'confirmed' as const,
    linkedIncident: 'INC-SI-001', linkedJob: 'KT-003',
    signals: [
      { label: 'Frost on evaporator coil', match: 97 },
      { label: 'Compressor vibration profile', match: 91 },
      { label: 'Asset last serviced 83 days ago', match: 88 },
    ],
    gradient: 'from-[#0a1f3a] to-[#061428]',
    boxColor: '#00C6FF',
  },
  {
    id: 'AIC-002', category: 'Plumbing', subCategory: 'Pipe Joint Failure',
    title: 'Water Pooling Under Kitchen Sink', location: 'Villa 7, Cluster B',
    severity: 'medium', confidence: 81, source: 'Resident App Photo',
    capturedAt: '10:10 AM', status: 'pending' as const,
    linkedIncident: 'INC-SI-002', linkedJob: null,
    signals: [
      { label: 'Water accumulation pattern', match: 89 },
      { label: 'Drip trajectory analysis', match: 76 },
      { label: 'Material corrosion markers', match: 64 },
    ],
    gradient: 'from-[#0f1e30] to-[#071522]',
    boxColor: '#2E7FFF',
  },
  {
    id: 'AIC-003', category: 'Mechanical', subCategory: 'Lift Motor Anomaly',
    title: 'Lift Stopped — Floor Gap Detected', location: 'Block C, Lift 2',
    severity: 'high', confidence: 88, source: 'IoT Sensor Alert',
    capturedAt: '09:58 AM', status: 'confirmed' as const,
    linkedIncident: 'INC-SI-003', linkedJob: 'KT-005',
    signals: [
      { label: 'Motor torque deviation', match: 93 },
      { label: 'Door sensor misalignment', match: 86 },
      { label: 'Historical fault pattern', match: 79 },
    ],
    gradient: 'from-[#1a1208] to-[#0d0b04]',
    boxColor: '#FF9B38',
  },
  {
    id: 'AIC-004', category: 'Electrical', subCategory: 'MCB Overload',
    title: 'Repeated MCB Tripping — Villa 31', location: 'Villa 31',
    severity: 'low', confidence: 72, source: 'Resident App Photo',
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
    id: 'AIC-005', category: 'Plumbing', subCategory: 'Pump Vibration',
    title: 'Pool Pump Grinding Noise Detected', location: 'Recreation Area',
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
    id: 'AIC-006', category: 'HVAC', subCategory: 'Filter Blockage',
    title: 'AHU Filter Discolouration — Block A', location: 'Block A, Floor 2',
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
    id: 'AIC-007', category: 'Safety', subCategory: 'Corridor Hazard',
    title: 'Spill Detected — Block B Corridor', location: 'Block B, Corridor 3',
    severity: 'medium', confidence: 79, source: 'CCTV AI Module',
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
    id: 'AIC-008', category: 'HVAC', subCategory: 'Refrigerant Leak',
    title: 'Oily Residue Near Compressor Unit', location: 'Roof — Block D',
    severity: 'high', confidence: 83, source: 'Technician Photo',
    capturedAt: '08:55 AM', status: 'pending' as const,
    linkedIncident: null, linkedJob: 'KT-012',
    signals: [
      { label: 'Refrigerant residue pattern', match: 87 },
      { label: 'Compressor surface analysis', match: 81 },
      { label: 'Thermal imaging correlation', match: 74 },
    ],
    gradient: 'from-[#0a1628] to-[#050d1a]',
    boxColor: '#FF9B38',
  },
  {
    id: 'AIC-009', category: 'Electrical', subCategory: 'Light Failure',
    title: 'Multiple Corridor Lights Out — Block B', location: 'Block B, Corridor 3',
    severity: 'low', confidence: 96, source: 'CCTV AI Module',
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
    technicians: PortfolioClientPerson[];
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
    sector: 'Mixed-Use Residential',
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
      { label: 'Resident App', count: 210 },
    ],
    aiInsight: 'All critical assets within SLA. Chiller C-04 flagged for proactive service within 6 days.',
    lastUpdated: '2 min ago',
    topSites: [
      { name: 'Cluster A — Villas', status: 'warning', incidents: 2 },
      { name: 'Block C — Towers', status: 'ok', incidents: 1 },
      { name: 'Recreation Centre', status: 'ok', incidents: 0 },
    ],
    recentActivity: [
      { time: '10:22 AM', event: 'AC Failure resolved — Villa 23', type: 'task' },
      { time: '09:45 AM', event: 'IoT anomaly: Pool Pump vibration flagged', type: 'ai' },
      { time: '09:10 AM', event: 'SLA met: Lift fault closed in 58 min', type: 'ok' },
    ],
    people: {
      accountManager: { name: 'Rania Al-Farsi', role: 'Account Manager', initials: 'RA', status: 'available' },
      fmManager: { name: 'Hassan Yousef', role: 'FM Manager', initials: 'HY', status: 'on-site' },
      supervisors: [
        { name: 'Tariq Mansour', role: 'Site Supervisor', initials: 'TM', status: 'on-site', skill: 'HVAC & Electrical' },
        { name: 'Layla Nour', role: 'Compliance Lead', initials: 'LN', status: 'available', skill: 'Safety & PPM' },
      ],
      technicians: [
        { name: 'Karim R.', role: 'HVAC Specialist', initials: 'KR', status: 'on-site', skill: 'HVAC', jobsThisMonth: 18, slaRate: 94 },
        { name: 'Ahmed K.', role: 'Plumber', initials: 'AK', status: 'transit', skill: 'Plumbing', jobsThisMonth: 12, slaRate: 91 },
        { name: 'Sara M.', role: 'Electrician', initials: 'SM', status: 'available', skill: 'Electrical', jobsThisMonth: 15, slaRate: 97 },
        { name: 'Faisal N.', role: 'General Tech', initials: 'FN', status: 'on-site', skill: 'General', jobsThisMonth: 10, slaRate: 88 },
      ],
    },
    resources: {
      budgetUsed: 820000,
      budgetTotal: 1100000,
      fleet: [
        { label: 'Service Vans', available: 4, total: 5 },
        { label: 'Pickup Trucks', available: 2, total: 2 },
      ],
      partsStock: [
        { name: 'R-410A Refrigerant', qty: 8, status: 'ok' },
        { name: 'Filter Type-B', qty: 3, status: 'low' },
        { name: 'Condenser Belt', qty: 12, status: 'ok' },
        { name: 'MCB 63A', qty: 0, status: 'out' },
      ],
      equipment: [
        { name: 'HVAC Diagnostic Kit', condition: 92, nextService: '30 days' },
        { name: 'Pressure Test Rig', condition: 85, nextService: '45 days' },
        { name: 'Thermal Camera', condition: 98, nextService: '90 days' },
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
    sector: 'Commercial Retail',
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
      { time: '10:18 AM', event: 'Routine PPM completed — HVAC Zone 3', type: 'task' },
      { time: '09:30 AM', event: 'QR scan inspection: Parking Level 2 passed', type: 'ok' },
      { time: '08:55 AM', event: 'Service request submitted: Escalator noise', type: 'incident' },
    ],
    people: {
      accountManager: { name: 'Nadia Samir', role: 'Account Manager', initials: 'NS', status: 'available' },
      fmManager: { name: 'Walid Kareem', role: 'FM Manager', initials: 'WK', status: 'available' },
      supervisors: [
        { name: 'Amira Haddad', role: 'Operations Supervisor', initials: 'AH', status: 'on-site', skill: 'Retail FM' },
      ],
      technicians: [
        { name: 'Omar T.', role: 'MEP Technician', initials: 'OT', status: 'on-site', skill: 'Electrical', jobsThisMonth: 14, slaRate: 99 },
        { name: 'Bilal S.', role: 'HVAC Tech', initials: 'BS', status: 'available', skill: 'HVAC', jobsThisMonth: 11, slaRate: 97 },
        { name: 'Nour A.', role: 'General Tech', initials: 'NA', status: 'available', skill: 'General', jobsThisMonth: 9, slaRate: 96 },
      ],
    },
    resources: {
      budgetUsed: 390000,
      budgetTotal: 600000,
      fleet: [
        { label: 'Service Vans', available: 2, total: 2 },
        { label: 'Cargo Bikes', available: 3, total: 3 },
      ],
      partsStock: [
        { name: 'LED Panel 60W', qty: 24, status: 'ok' },
        { name: 'Escalator Chain Link', qty: 6, status: 'ok' },
        { name: 'HVAC Filter G4', qty: 2, status: 'low' },
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
    sector: 'Commercial Office',
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
      { label: 'Power BI', count: 0 },
    ],
    aiInsight: 'Power BI sync failure causing reporting gaps. 5 overdue tasks require immediate escalation. SLA degrading — 3 open breaches.',
    lastUpdated: '12 min ago',
    topSites: [
      { name: 'Tower A — Floors 1–20', status: 'critical', incidents: 4 },
      { name: 'Tower B — Floors 1–18', status: 'warning', incidents: 2 },
      { name: 'Podium Retail', status: 'ok', incidents: 1 },
    ],
    recentActivity: [
      { time: '10:05 AM', event: 'SLA breach: Generator fault unreached 4h', type: 'escalation' },
      { time: '09:50 AM', event: 'Power BI sync failure — token expired', type: 'ai' },
      { time: '09:20 AM', event: 'Chiller fault escalated to critical — Tower A', type: 'incident' },
    ],
    people: {
      accountManager: { name: 'Khaled Badawi', role: 'Account Manager', initials: 'KB', status: 'available' },
      fmManager: { name: 'Fatima Aziz', role: 'FM Manager', initials: 'FA', status: 'on-site' },
      supervisors: [
        { name: 'Yusuf Rahimi', role: 'Operations Supervisor', initials: 'YR', status: 'on-site', skill: 'MEP' },
        { name: 'Dana Saleh', role: 'Safety Supervisor', initials: 'DS', status: 'off-duty', skill: 'Safety' },
      ],
      technicians: [
        { name: 'Rami B.', role: 'Electrical Tech', initials: 'RB', status: 'on-site', skill: 'Electrical', jobsThisMonth: 16, slaRate: 78 },
        { name: 'Ali M.', role: 'HVAC Specialist', initials: 'AM', status: 'transit', skill: 'HVAC', jobsThisMonth: 14, slaRate: 82 },
        { name: 'Hassan T.', role: 'Plumber', initials: 'HT', status: 'off-duty', skill: 'Plumbing', jobsThisMonth: 8, slaRate: 75 },
      ],
    },
    resources: {
      budgetUsed: 1050000,
      budgetTotal: 1200000,
      fleet: [
        { label: 'Service Vans', available: 3, total: 5 },
        { label: 'Pickup Trucks', available: 0, total: 2 },
      ],
      partsStock: [
        { name: 'Circuit Breaker 100A', qty: 1, status: 'low' },
        { name: 'Chiller Refrigerant', qty: 0, status: 'out' },
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
    sector: 'Mixed-Use Residential',
    sites: 11,
    workOrders: 78,
    incidents: 12,
    sla: 67,
    compliance: 71,
    riskLevel: 'critical',
    overdueTasks: 9,
    dataSources: [
      { label: 'WhatsApp Gateway', count: 340 },
      { label: 'Resident App', count: 195 },
      { label: 'IoT Sensors', count: 31 },
    ],
    aiInsight: 'CRITICAL: 9 overdue tasks and SLA at 67%. AI predicts further deterioration without immediate supervisor intervention. Lift safety checks overdue.',
    lastUpdated: '1 min ago',
    topSites: [
      { name: 'Cluster N1 — Towers', status: 'critical', incidents: 6 },
      { name: 'Cluster N2 — Villas', status: 'critical', incidents: 4 },
      { name: 'Community Amenities', status: 'warning', incidents: 2 },
    ],
    recentActivity: [
      { time: '10:20 AM', event: 'CRITICAL: Lift fault — 3 residents affected', type: 'incident' },
      { time: '10:10 AM', event: 'SLA breach cascade — 4 jobs overdue simultaneously', type: 'escalation' },
      { time: '09:55 AM', event: 'AI flag: Technician shortage detected — reassignment required', type: 'ai' },
    ],
    people: {
      accountManager: { name: 'Sami Qasem', role: 'Account Manager', initials: 'SQ', status: 'available' },
      fmManager: { name: 'Lina Barakat', role: 'FM Manager', initials: 'LB', status: 'on-site' },
      supervisors: [
        { name: 'Ismail Rashid', role: 'Site Supervisor', initials: 'IR', status: 'on-site', skill: 'General FM' },
      ],
      technicians: [
        { name: 'Tariq H.', role: 'HVAC Tech', initials: 'TH', status: 'on-site', skill: 'HVAC', jobsThisMonth: 22, slaRate: 63 },
        { name: 'Ziad K.', role: 'Electrician', initials: 'ZK', status: 'on-site', skill: 'Electrical', jobsThisMonth: 19, slaRate: 68 },
      ],
    },
    resources: {
      budgetUsed: 1380000,
      budgetTotal: 1400000,
      fleet: [
        { label: 'Service Vans', available: 1, total: 4 },
        { label: 'Pickup Trucks', available: 0, total: 2 },
      ],
      partsStock: [
        { name: 'Lift Motor Drive', qty: 0, status: 'out' },
        { name: 'Emergency Light Units', qty: 0, status: 'out' },
        { name: 'Pipe Joint 22mm', qty: 1, status: 'low' },
        { name: 'MCB 32A', qty: 2, status: 'low' },
      ],
      equipment: [
        { name: 'Lift Diagnostic Console', condition: 42, nextService: 'Overdue' },
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
    sector: 'Residential Community',
    sites: 18,
    workOrders: 54,
    incidents: 5,
    sla: 88,
    compliance: 91,
    riskLevel: 'medium',
    overdueTasks: 3,
    dataSources: [
      { label: 'Maximo API', count: 870 },
      { label: 'Resident App', count: 310 },
      { label: 'QR Scanner', count: 145 },
    ],
    aiInsight: 'Irrigation system seasonal service overdue by 18 days. Pool maintenance compliance dipped below threshold last week.',
    lastUpdated: '8 min ago',
    topSites: [
      { name: 'District 10 — North', status: 'warning', incidents: 3 },
      { name: 'District 14 — South', status: 'ok', incidents: 1 },
      { name: 'Community Pool & Gym', status: 'warning', incidents: 1 },
    ],
    recentActivity: [
      { time: '10:12 AM', event: 'Irrigation seasonal service — 18 days overdue', type: 'escalation' },
      { time: '09:40 AM', event: 'Pool pump inspection completed — PPM met', type: 'task' },
      { time: '09:15 AM', event: 'Resident feedback: 4.6 avg — improved from last month', type: 'ok' },
    ],
    people: {
      accountManager: { name: 'Dina Moussa', role: 'Account Manager', initials: 'DM', status: 'available' },
      fmManager: { name: 'Yassir Nabil', role: 'FM Manager', initials: 'YN', status: 'on-site' },
      supervisors: [
        { name: 'Samira Kamel', role: 'Community Supervisor', initials: 'SK', status: 'on-site', skill: 'Landscape & Plumbing' },
        { name: 'Adel Farouk', role: 'Safety Lead', initials: 'AF', status: 'available', skill: 'Safety & Compliance' },
      ],
      technicians: [
        { name: 'Malik R.', role: 'Plumber', initials: 'MR', status: 'on-site', skill: 'Plumbing', jobsThisMonth: 13, slaRate: 87 },
        { name: 'Jad T.', role: 'General Tech', initials: 'JT', status: 'transit', skill: 'General', jobsThisMonth: 11, slaRate: 84 },
        { name: 'Rana H.', role: 'Electrician', initials: 'RH', status: 'available', skill: 'Electrical', jobsThisMonth: 9, slaRate: 91 },
      ],
    },
    resources: {
      budgetUsed: 760000,
      budgetTotal: 950000,
      fleet: [
        { label: 'Service Vans', available: 4, total: 5 },
        { label: 'Landscape Trucks', available: 1, total: 2 },
      ],
      partsStock: [
        { name: 'Irrigation Valve 25mm', qty: 3, status: 'low' },
        { name: 'Pool Chemical Pack', qty: 8, status: 'ok' },
        { name: 'Pump Seal Kit', qty: 0, status: 'out' },
        { name: 'LED Garden Light', qty: 12, status: 'ok' },
      ],
      equipment: [
        { name: 'Irrigation Control Unit', condition: 74, nextService: '7 days' },
        { name: 'Pool Test Kit', condition: 88, nextService: '30 days' },
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
      notes: 'Community management board review every 6 months. Landscape KPIs tracked separately to FM KPIs.',
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
    sector: 'Luxury Residential',
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
    aiInsight: 'Portfolio best performer. IoT coverage at 112 sensors. Proactive failure prediction prevented 2 major HVAC faults this quarter.',
    lastUpdated: '4 min ago',
    topSites: [
      { name: 'Residence Tower 1', status: 'ok', incidents: 1 },
      { name: 'Residence Tower 2', status: 'ok', incidents: 1 },
      { name: 'Amenities & Podium', status: 'ok', incidents: 0 },
    ],
    recentActivity: [
      { time: '10:15 AM', event: 'AI prevented HVAC fault — proactive PPM dispatched', type: 'ai' },
      { time: '09:30 AM', event: 'Quarterly compliance report: 97% — approved', type: 'ok' },
      { time: '08:50 AM', event: 'IoT anomaly cleared — false positive confirmed', type: 'task' },
    ],
    people: {
      accountManager: { name: 'Leila Mahmoud', role: 'Account Manager', initials: 'LM', status: 'available' },
      fmManager: { name: 'Samir Haddad', role: 'FM Manager', initials: 'SH', status: 'available' },
      supervisors: [
        { name: 'Camille Raza', role: 'Luxury Standards Supervisor', initials: 'CR', status: 'on-site', skill: 'MEP & Concierge FM' },
        { name: 'Nabil Oueida', role: 'Engineering Supervisor', initials: 'NO', status: 'available', skill: 'HVAC & BMS' },
      ],
      technicians: [
        { name: 'Emad S.', role: 'BMS Specialist', initials: 'ES', status: 'available', skill: 'BMS / Smart Systems', jobsThisMonth: 8, slaRate: 100 },
        { name: 'Lara K.', role: 'HVAC Specialist', initials: 'LK', status: 'on-site', skill: 'HVAC', jobsThisMonth: 10, slaRate: 96 },
        { name: 'Fares M.', role: 'Electrician', initials: 'FM', status: 'available', skill: 'Electrical', jobsThisMonth: 7, slaRate: 97 },
      ],
    },
    resources: {
      budgetUsed: 480000,
      budgetTotal: 750000,
      fleet: [
        { label: 'Premium Service Vans', available: 2, total: 2 },
        { label: 'Electric Vehicles', available: 1, total: 1 },
      ],
      partsStock: [
        { name: 'BMS Sensor Node', qty: 18, status: 'ok' },
        { name: 'HVAC Filter F9', qty: 12, status: 'ok' },
        { name: 'Emergency Generator Fuel', qty: 6, status: 'ok' },
        { name: 'LED Chandelier Bulb', qty: 24, status: 'ok' },
      ],
      equipment: [
        { name: 'BMS Diagnostic Terminal', condition: 99, nextService: '120 days' },
        { name: 'Thermal Imaging Suite', condition: 97, nextService: '90 days' },
        { name: 'Air Quality Monitor', condition: 94, nextService: '60 days' },
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
    title: 'HVAC Refrigerant Top-Up Procedure',
    category: 'guide',
    description: 'Step-by-step guide to safely check, recover, and recharge refrigerant in split and central AC units.',
    estimatedTime: '25 min',
    difficulty: 'intermediate',
    tags: ['HVAC', 'refrigerant', 'AC', 'R-410A'],
    tools: ['Manifold gauge set', 'Refrigerant cylinder (R-410A)', 'Leak detector', 'Safety gloves & goggles', 'Torque wrench'],
    steps: [
      {
        title: 'Safety first — PPE and isolation',
        body: 'Put on safety gloves and goggles before handling any refrigerant. Isolate the AC unit at the MCB panel and confirm power is off using a voltage tester.',
        warning: 'Never work on a live system. Refrigerant under pressure is hazardous — always isolate before connecting gauges.',
      },
      {
        title: 'Connect the manifold gauge set',
        body: 'Attach the low-pressure (blue) and high-pressure (red) hoses to the service ports. Finger-tighten first, then quarter-turn with a wrench to ensure a leak-free connection.',
        tip: 'Blow a small puff of refrigerant through the hoses before connecting to the gauge to purge any air or moisture.',
      },
      {
        title: 'Record initial pressure readings',
        body: 'Switch the unit on in cooling mode and allow 5 minutes for pressures to stabilise. Record low-side and high-side readings on your job sheet. For R-410A, normal low-side should be 65–80 PSI.',
      },
      {
        title: 'Check for leaks',
        body: 'Run the electronic leak detector around all joints, valves, and flare connections. If a leak is found, mark it with a UV dye pen and report it as a separate fault. Do not top up if there is an active leak.',
        warning: 'Topping up a leaking system is a temporary fix and a regulatory violation. Always fix the root cause first.',
      },
      {
        title: 'Add refrigerant in liquid phase',
        body: 'With the cylinder inverted (liquid valve open), slowly open the low-side manifold valve. Add refrigerant in 30-second bursts, monitoring suction pressure. Target 70–75 PSI for R-410A in standard ambient conditions.',
        tip: 'Never open the high-side manifold valve while adding refrigerant — this can cause liquid slugging and compressor damage.',
      },
      {
        title: 'Verify superheat and subcooling',
        body: 'Use a clamp thermometer on the suction line. Superheat should read 10–15°F above saturation temperature. Subcooling on the liquid line should be 10–12°F. If values are off, consult the manufacturer specs.',
      },
      {
        title: 'Disconnect and complete job sheet',
        body: 'Close both manifold valves, then disconnect hoses slowly to minimise refrigerant loss. Replace service port caps. Log all pressure readings, refrigerant amount added, and any anomalies on your job sheet.',
      },
    ],
  },
  {
    id: 'KB-002',
    title: 'How to Reset a Tripped MCB Panel',
    category: 'guide',
    description: 'Safe procedure to diagnose and reset a miniature circuit breaker (MCB) that has tripped due to overload or fault.',
    estimatedTime: '10 min',
    difficulty: 'beginner',
    tags: ['electrical', 'MCB', 'circuit breaker', 'power'],
    tools: ['Voltage tester', 'Torch/flashlight', 'Safety gloves'],
    steps: [
      {
        title: 'Do not reset immediately',
        body: 'Before touching the panel, identify which MCB has tripped — it will be in the middle or OFF position. Do not reset it yet. First, unplug all appliances from the affected circuit.',
        warning: 'Resetting an MCB without removing the fault can cause sparks, fire, or repeated tripping that damages the breaker.',
      },
      {
        title: 'Inspect for visible hazards',
        body: 'Check the panel for burn marks, melted insulation, or unusual heat. Use a torch to inspect the inside of the panel if the cover allows. If you see visible burning or smell burning rubber, do not proceed — escalate immediately.',
      },
      {
        title: 'Reset the MCB',
        body: 'Push the tripped MCB fully to the OFF position first (some models need this to reset), then flip it firmly back to ON. You should feel a firm click.',
        tip: 'If the MCB trips again immediately, the fault is still present — do not keep resetting. Log the fault and isolate the circuit.',
      },
      {
        title: 'Test appliances one at a time',
        body: 'Plug appliances back in one at a time, waiting 30 seconds between each. This helps identify a faulty appliance causing the overload.',
      },
      {
        title: 'Document and close',
        body: 'Log the MCB location, circuit reference, and any appliances that caused the trip. If the root cause is a faulty appliance, advise the resident to have it inspected by an electrician.',
      },
    ],
  },
  {
    id: 'KB-003',
    title: 'Lift Safety Inspection — Monthly Check',
    category: 'sop',
    description: 'Standard Operating Procedure for the monthly lift safety inspection, covering mechanical, electrical, and safety components.',
    estimatedTime: '45 min',
    difficulty: 'intermediate',
    tags: ['lift', 'elevator', 'safety', 'inspection', 'SOP'],
    tools: ['Inspection checklist', 'Multimeter', 'Lux meter', 'Torque wrench', 'Safety harness'],
    steps: [
      {
        title: 'Pre-inspection — isolate and notify',
        body: 'Notify building management and place "Lift Under Maintenance" notices at all landing levels. Use the key switch in the machine room to take the lift out of service before entering the shaft.',
        warning: 'Never enter the lift shaft without confirming the lift car is secured and the main isolator is locked out with your personal lock.',
      },
      {
        title: 'Machine room checks',
        body: 'Inspect the machine room for signs of overheating, oil leaks, or unusual noise. Check the motor temperature (should not exceed 70°C). Verify all electrical connections are tight. Log the oil level on the gearbox if applicable.',
      },
      {
        title: 'Inspect ropes and pulleys',
        body: 'Examine main hoist ropes for fraying, corrosion, and kinking. Measure rope diameter — replace if 10% or more reduction from nominal. Check all pulleys and sheaves for wear and correct alignment.',
        warning: 'Ropes with broken wires exceeding the manufacturer limit must be replaced immediately. Do not return the lift to service.',
      },
      {
        title: 'Door mechanisms and safety devices',
        body: 'Test each landing door — check door closing speed, re-opening sensitivity, and interlock function. Verify the door safety edge retracts correctly. All landing doors must lock positively before the lift can move.',
      },
      {
        title: 'Safety gear and buffers',
        body: 'With the lift at ground floor level, inspect the buffer condition and oil level (hydraulic buffers). Test the overspeed governor trip mechanism as per the manufacturer schedule. Record the date and governor trip speed.',
        tip: 'If the governor trip speed is outside tolerance, do not put the lift back in service — contact the specialist contractor.',
      },
      {
        title: 'Emergency systems test',
        body: 'Test the emergency lighting inside the car and machine room. Verify the emergency phone/intercom connects correctly. Check the emergency stop button function in the car and machine room.',
      },
      {
        title: 'Return to service and document',
        body: 'Remove all isolation locks, restore the key switch to normal, and test the lift through five complete runs before returning to service. Complete the statutory inspection logbook with all findings, dates, and your signature.',
      },
    ],
  },
  {
    id: 'KB-004',
    title: 'Fire Safety Panel — Weekly Function Test',
    category: 'checklist',
    description: 'Weekly test checklist for fire alarm panels including zone testing, battery backup, and audible alarm verification.',
    estimatedTime: '20 min',
    difficulty: 'beginner',
    tags: ['fire safety', 'fire panel', 'alarm', 'safety', 'weekly'],
    tools: ['Fire panel key', 'Test detector spray or magnet', 'Log book'],
    steps: [
      {
        title: 'Notify occupants and control room',
        body: 'Inform building occupants and the main security control room that a fire alarm test is about to be carried out. Ensure no false evacuations are triggered by keeping fire brigade on a "test notification" hold.',
        tip: 'Always test during agreed hours (typically 09:00–17:00 weekdays) and confirm with the building manager before proceeding.',
      },
      {
        title: 'Log panel current status',
        body: 'Open the fire panel and note any existing faults or isolations. Do not proceed if there are unresolved critical faults — report to supervisor first. Record the current date, time, and panel reading in the log book.',
      },
      {
        title: 'Activate a test zone',
        body: 'Select one zone per week for testing on a rotating schedule. Activate a detector in that zone using the appropriate test tool (spray aerosol or magnet). The panel should show the zone alarm within 30 seconds.',
        warning: 'Use only the correct test method for the detector type. Using the wrong method can damage optical or heat detectors.',
      },
      {
        title: 'Verify audible alarm and outputs',
        body: 'Confirm audible alarms are sounding on all sounders in the building. Check that any output relays (door holders, ventilation shutdown) are activating correctly. Verify the alarm is received at the monitoring station.',
      },
      {
        title: 'Reset and log',
        body: 'Reset the fire panel using the key. Confirm the panel returns to normal status with no residual faults. Complete the log book entry with zone tested, time of alarm, time of reset, and any observations.',
      },
    ],
  },
  {
    id: 'KB-005',
    title: 'Diagnosing Water Leaks — Pipe and Joint Faults',
    category: 'guide',
    description: 'How to locate, assess, and temporarily contain water leaks from pipe joints, isolation valves, and flexible hoses in residential units.',
    estimatedTime: '15 min',
    difficulty: 'beginner',
    tags: ['plumbing', 'water leak', 'pipe', 'joint', 'diagnosis'],
    tools: ['Torch', 'Dry cloth or paper towels', 'Isolation valve key', 'Camera (for documentation)'],
    steps: [
      {
        title: 'Locate the source of the leak',
        body: 'Dry the area around the suspected leak with a cloth, then observe carefully. Use a torch to inspect behind pipes and under joints. Look for active dripping, staining, or corrosion at joints and connections.',
        tip: 'If the source is not immediately visible, trace the water upward — leaks often travel along pipe runs before dripping.',
      },
      {
        title: 'Assess the severity',
        body: 'Determine if it is a slow drip (low urgency), a steady flow (medium urgency), or active gushing (emergency — isolate immediately). Check if any electrical items are at risk from the water.',
        warning: 'If water is near electrical outlets or appliances, isolate the electrical circuit at the MCB before proceeding with the plumbing work.',
      },
      {
        title: 'Isolate the water supply',
        body: 'Locate the nearest isolation valve upstream of the leak — usually found directly on the supply pipe to the fixture. Turn clockwise to close. If no local isolation valve exists, use the main stop tap.',
      },
      {
        title: 'Document and photograph',
        body: 'Photograph the source of the leak, the pipe type, and any visible damage. Note the location, pipe size, and fitting type on your job sheet. This is critical for ordering the correct replacement parts.',
      },
      {
        title: 'Apply temporary containment if needed',
        body: 'If a permanent repair cannot be done immediately (waiting for parts), apply PTFE tape or a temporary pipe repair clamp to slow the leak. Inform the resident and supervisor of the temporary fix status.',
      },
      {
        title: 'Permanent repair and function test',
        body: 'Replace or re-seal the faulty joint or pipe section. Slowly re-open the isolation valve and observe for at least 2 minutes. Run the fixture to test flow and confirm no leakage before signing off.',
      },
    ],
  },
  {
    id: 'KB-006',
    title: 'Chiller Unit Quarterly Service — Full Procedure',
    category: 'sop',
    description: 'Complete SOP for the quarterly service of central chiller units including coil cleaning, oil checks, and performance verification.',
    estimatedTime: '3–4 hours',
    difficulty: 'advanced',
    tags: ['HVAC', 'chiller', 'quarterly', 'SOP', 'maintenance'],
    tools: ['Manifold gauges', 'Refrigerant recovery unit', 'Fin comb', 'Chemical coil cleaner', 'High-pressure washer', 'Oil analysis kit', 'Multimeter'],
    steps: [
      {
        title: 'Pre-service planning and isolation',
        body: 'Review the asset history and last service report. Confirm the service window with building management. Isolate the chiller at the main MCC and attach lockout tags. Close all refrigerant circuit valves and allow 10 minutes for pressure equalisation.',
        warning: 'Central chiller units operate at high refrigerant pressures (200–400 PSI). All technicians must hold a valid refrigerant handling certificate.',
      },
      {
        title: 'Condenser coil inspection and cleaning',
        body: 'Inspect the condenser coil for fouling, fin damage, and corrosion. Apply chemical coil cleaner (allow 10 minutes dwell time), then rinse with a low-pressure water wash. Do not use high pressure directly on fins — use a fan pattern nozzle at 45°.',
        tip: 'Document the fouling level (% area blocked) before and after cleaning. This data feeds the PPM trend analysis.',
      },
      {
        title: 'Evaporator coil and drain pan inspection',
        body: 'Inspect the evaporator coil for ice formation, blocked fins, or refrigerant oil contamination. Check and clear the condensate drain pan and drain line — pour water to verify free-flow drainage.',
      },
      {
        title: 'Oil and lubrication checks',
        body: 'Check compressor oil level in the sight glass. If the oil appears cloudy or discoloured, take an oil sample for analysis. Grease all bearing points on motors and fans with the manufacturer-specified grease type.',
        warning: 'Using the wrong lubricant type will void the compressor warranty. Always check the asset\'s spec sheet.',
      },
      {
        title: 'Electrical and controls checks',
        body: 'Inspect all electrical connections, contactors, and capacitors. Measure compressor motor winding insulation resistance (should be >1 MΩ). Verify the control panel settings against the commissioning sheet — do not change setpoints without supervisor approval.',
      },
      {
        title: 'Performance test and data logging',
        body: 'Restore power and run the chiller through a full start-up cycle. Record suction/discharge pressures, superheat, subcooling, leaving chilled water temperature, and compressor amps. Compare against baseline data from the last service.',
      },
      {
        title: 'Close out and update asset record',
        body: 'Complete all documentation including parts used, oil added, and performance readings. Update the asset maintenance record in the platform. Attach before/after photos of the coil condition. Notify the FM Manager of the completed service.',
      },
    ],
  },
  {
    id: 'KB-007',
    title: 'Pool Pump Inspection & Maintenance',
    category: 'checklist',
    description: 'Monthly inspection checklist for pool pump systems covering motor, impeller, seals, and water chemistry equipment.',
    estimatedTime: '30 min',
    difficulty: 'beginner',
    tags: ['plumbing', 'pool pump', 'monthly', 'checklist', 'inspection'],
    tools: ['Multimeter', 'Clip-on ammeter', 'Strainer basket', 'Silicone lubricant', 'Water test kit'],
    steps: [
      {
        title: 'Visual pre-check',
        body: 'Inspect the pump body for cracks, corrosion, and water staining. Check all union connections and O-ring glands for drips. Note any unusual discolouration around the motor housing (can indicate overheating).',
      },
      {
        title: 'Clean the strainer basket',
        body: 'Switch the pump off and close the suction isolation valve. Remove the strainer lid, extract the basket, and clean all debris. Inspect the basket for cracks or missing sections — replace if damaged.',
        tip: 'Apply a thin coat of silicone lubricant to the lid O-ring before replacing to ensure a good seal and prevent air ingress.',
      },
      {
        title: 'Motor temperature and amp draw check',
        body: 'Run the pump and use a clip-on ammeter to check running current against the nameplate rating. Use a contact thermometer to check motor housing temperature — should not exceed nameplate rating + ambient temperature.',
        warning: 'If the motor draws 10% above nameplate current consistently, this indicates bearing wear or impeller blockage. Do not defer — arrange full service.',
      },
      {
        title: 'Pressure gauge check',
        body: 'Record the filter inlet pressure. If pressure has risen 8–10 PSI above the clean baseline, the filter requires backwashing or replacement media. Log the reading and compare to last month\'s data.',
      },
      {
        title: 'Water chemistry and dosing equipment',
        body: 'Test pH, free chlorine, and total alkalinity. Verify the chemical dosing pump is operating correctly. Check the chemical storage containers and ensure they are labelled and secured.',
        warning: 'Pool chemicals are hazardous. Never mix different chemicals and always store acids and chlorine separately.',
      },
      {
        title: 'Log and report',
        body: 'Complete the monthly inspection log with all readings, observations, and any work carried out. Flag any items requiring follow-up parts or specialist inspection to the FM Manager.',
      },
    ],
  },
  {
    id: 'KB-008',
    title: 'How to Recharge a Fire Extinguisher',
    category: 'guide',
    description: 'Procedure for inspecting and recharging CO2 and dry powder fire extinguishers following discharge or scheduled service.',
    estimatedTime: '20 min',
    difficulty: 'intermediate',
    tags: ['fire safety', 'extinguisher', 'safety', 'recharge'],
    tools: ['Refill station', 'Weighing scale', 'CO2 cylinder (for CO2 units)', 'Tamper seal', 'Inspection tag'],
    steps: [
      {
        title: 'Safety — depressurise and inspect',
        body: 'Ensure the extinguisher is fully discharged and depressurised before opening. Inspect the body for dents, corrosion, or damage to the neck thread. Any structural damage means the extinguisher must be decommissioned, not recharged.',
        warning: 'Never attempt to recharge a damaged, corroded, or overdue-for-hydrostatic-test extinguisher. This is a serious safety risk.',
      },
      {
        title: 'Disassemble and clean',
        body: 'Remove the valve assembly using the correct valve wrench. Empty any residual agent and clean the cylinder interior. Inspect the valve O-rings and seals — replace all O-rings as a matter of course.',
      },
      {
        title: 'Recharge with agent',
        body: 'For dry powder: weigh the correct charge of powder into the cylinder using a scale. For CO2: connect to the CO2 filling station and fill to the weight marked on the cylinder nameplate label. Do not overfill.',
      },
      {
        title: 'Reassemble and pressurise',
        body: 'Replace the valve assembly and torque to specification. For stored pressure units, pressurise with dry nitrogen to the pressure marked on the label. Check the gauge reads in the green zone.',
      },
      {
        title: 'Final inspection and tag',
        body: 'Pull the pin and squeeze the trigger briefly to confirm pressure. Replace the pin and fit a new tamper seal. Attach a new inspection tag showing the service date, technician name, and next service date.',
      },
    ],
  },
  {
    id: 'KB-009',
    title: 'AC Installation — Condensate Drain Line Setup',
    category: 'video',
    description: 'Video guide covering correct condensate drain line installation, slope requirements, and trap placement for split AC units.',
    estimatedTime: '12 min watch',
    difficulty: 'intermediate',
    tags: ['HVAC', 'AC installation', 'drain', 'condensate', 'video'],
    tools: ['PVC pipe cutter', 'Spirit level', 'PVC cement', 'Drain trap kit', 'Insulation tape'],
    videoUrl: 'https://www.youtube.com/embed/V3BDkDlzH7Q',
    thumbnailUrl: 'https://img.youtube.com/vi/V3BDkDlzH7Q/hqdefault.jpg',
    steps: [
      {
        title: 'Drain line slope requirement',
        body: 'Condensate drain lines must slope a minimum of 1:100 (1 cm fall per 100 cm run). Use a spirit level to verify slope during installation. Insufficient slope causes water backup and mould growth.',
        warning: 'Never run drain lines horizontally — even a small negative slope will cause drain pans to overflow and damage ceilings.',
      },
      {
        title: 'Installing the P-trap',
        body: 'A P-trap is required on all fan coil drain connections to prevent air from being siphoned back through the drain and causing drain pan overflow. Position the trap as close to the unit drain outlet as possible.',
      },
      {
        title: 'Pipe sizing and connections',
        body: 'Use the pipe size specified by the manufacturer (typically 25mm or 32mm OD). All joints must be PVC solvent-welded — do not use rubber connectors on indoor drain lines. Insulate all drain pipe in humid areas to prevent condensation dripping.',
      },
      {
        title: 'Test before finishing',
        body: 'Pour water into the drain pan to test flow before closing up any ceiling or casing. Confirm water flows freely to the discharge point. Check all joints for weeping.',
      },
    ],
  },
  {
    id: 'KB-010',
    title: 'Understanding and Setting HVAC Thermostat Setpoints',
    category: 'video',
    description: 'Video walkthrough of how to read, configure, and calibrate digital and analogue thermostats in commercial HVAC systems.',
    estimatedTime: '18 min watch',
    difficulty: 'beginner',
    tags: ['HVAC', 'thermostat', 'setpoints', 'controls', 'video'],
    videoUrl: 'https://www.youtube.com/embed/qSqz4Xg0LxU',
    thumbnailUrl: 'https://img.youtube.com/vi/qSqz4Xg0LxU/hqdefault.jpg',
    steps: [
      {
        title: 'Understanding the deadband',
        body: 'The deadband (or differential) is the temperature range around the setpoint where neither heating nor cooling activates. A typical deadband is 1–2°C. Narrower deadbands cause the system to cycle more frequently.',
        tip: 'In commercial buildings, a deadband of 1.5°C is typically a good balance between comfort and equipment longevity.',
      },
      {
        title: 'Setting cooling setpoints',
        body: 'For residential units, the standard cooling setpoint is 23–24°C. For commercial spaces, follow the client\'s comfort specification. Change the setpoint in the thermostat programming menu — never set below 20°C without supervisor approval.',
        warning: 'Do not override setpoints without a written instruction from the FM Manager or client. Unauthorised changes can invalidate the service contract.',
      },
      {
        title: 'Calibration offset adjustment',
        body: 'If the measured air temperature differs from the thermostat display by more than 1°C, apply a calibration offset in the thermostat settings. This corrects for sensor position or age drift — do not move the sensor itself.',
      },
    ],
  },
  {
    id: 'KB-011',
    title: 'Plumbing Isolation Valve Replacement',
    category: 'sop',
    description: 'Standard procedure for safely replacing a faulty isolation valve on domestic water services without full building shutdown.',
    estimatedTime: '40 min',
    difficulty: 'intermediate',
    tags: ['plumbing', 'isolation valve', 'SOP', 'replacement'],
    tools: ['Adjustable spanner', 'Pipe wrench', 'PTFE tape', 'Compression fitting tool', 'Isolation valve (correct size)', 'Bucket and towels'],
    steps: [
      {
        title: 'Identify the correct isolation point',
        body: 'Locate the next upstream isolation point — typically the flat stopcock on the water meter or the zone valve. Turn it off and check that water flow has stopped at the faulty valve location by opening the downstream fixture.',
      },
      {
        title: 'Drain the line',
        body: 'Place a bucket beneath the faulty valve. Open the fixture served by the valve to drain any residual water from the line. Absorb remaining water with towels before cutting or undoing any fittings.',
      },
      {
        title: 'Remove the faulty valve',
        body: 'Unscrew or disconnect the faulty valve using the appropriate tool. For compression fittings, slide the nut back and ease the valve off. Do not force or twist the pipe — support it firmly.',
        tip: 'If the valve has seized and cannot be turned, use penetrating oil and allow 10 minutes before attempting again. Do not apply excessive force to plastic pipe.',
      },
      {
        title: 'Prepare and fit the new valve',
        body: 'Check the replacement valve matches the pipe size and material. Apply PTFE tape clockwise to threaded connections. For compression fittings, ensure the olive is correctly positioned and the nut is finger-tight before tightening 1–1.5 turns with a spanner.',
      },
      {
        title: 'Reinstate water and test',
        body: 'Slowly open the upstream isolation. Observe the new valve and all connections for 2 minutes — look for drips at the fittings. Open the downstream fixture to purge air from the line. Confirm full flow before closing up.',
      },
    ],
  },
  {
    id: 'KB-012',
    title: 'Electrical Safety — Working at Heights',
    category: 'sop',
    description: 'Safety SOP for electrical maintenance work carried out above 2 metres, covering ladder safety, harness use, and permit requirements.',
    estimatedTime: '30 min read',
    difficulty: 'intermediate',
    tags: ['electrical', 'safety', 'working at height', 'SOP', 'permit'],
    tools: ['Safety harness', 'Anchor point / anchor strap', 'Scaffold/platform (where required)', 'Ladder (BS EN 131 rated)', 'Permit to Work form'],
    steps: [
      {
        title: 'Obtain a Permit to Work',
        body: 'All work above 2 metres requires a signed Permit to Work (PTW) from the Site Supervisor before starting. The PTW defines the work area, method, and rescue plan. Do not start work without a valid signed PTW.',
        warning: 'Starting work at height without a valid PTW is a disciplinary offence and may result in removal from site.',
      },
      {
        title: 'Inspect equipment before use',
        body: 'Check ladder for cracks, bent rungs, and secure feet before each use. Inspect the harness for fraying, damaged buckles, or previous shock-loading. Any defective equipment must be tagged and removed from service immediately.',
      },
      {
        title: 'Set up safe access',
        body: 'Position the ladder at the correct angle (1:4 ratio — 1 metre out for every 4 metres up). Secure the top and bottom against movement. A second person must foot the ladder when ascending or descending.',
        tip: 'Use a mobile elevated work platform (MEWP) for any work exceeding 4 metres — ladder use should be limited to short-duration access only.',
      },
      {
        title: 'Attach the fall arrest system',
        body: 'If working at height above 2 metres for more than 30 minutes or without stable footing, wear the full harness and connect the lanyard to a certified anchor point. The anchor must be above shoulder height.',
      },
      {
        title: 'Carry out the electrical work',
        body: 'Work within arm\'s reach only — do not lean out or overreach from the ladder. Tools must be in a belt pouch or on a tool tray. All cables must be secured before working to prevent them pulling you off balance.',
      },
      {
        title: 'Clear down and close PTW',
        body: 'Remove all tools and materials from height before descending. Inspect the work area from below. Return the signed PTW to the supervisor for closure and log all work in the maintenance record.',
      },
    ],
  },
  {
    id: 'KB-013',
    title: 'Generator Load Test — Quarterly Procedure',
    category: 'checklist',
    description: 'Quarterly load test checklist for standby diesel generators to verify fuel, battery, start-up, and load transfer performance.',
    estimatedTime: '1.5 hours',
    difficulty: 'intermediate',
    tags: ['electrical', 'generator', 'load test', 'quarterly', 'checklist'],
    tools: ['Multimeter', 'Clip-on ammeter', 'Load bank (if required)', 'Fuel test kit', 'Battery tester'],
    steps: [
      {
        title: 'Pre-test checks',
        body: 'Verify fuel level is at least 75% full. Check coolant level and condition. Inspect battery terminals for corrosion and check battery voltage (should be 24V for most standby generators at rest). Check oil level on the dipstick.',
      },
      {
        title: 'Notify building management',
        body: 'Inform the FM Manager and building occupants that a generator test will take place. Confirm the test time with the control room and ensure any critical systems are prepared for a momentary transfer.',
      },
      {
        title: 'Manual start test',
        body: 'Start the generator manually using the local start button. Observe start-up sequence — it should reach operating speed within 10 seconds. Check for exhaust smoke colour (light grey is normal; black smoke indicates fuel or air issues).',
        warning: 'Do not attempt a load transfer test if the generator does not reach stable voltage and frequency within 30 seconds of start-up.',
      },
      {
        title: 'Automatic transfer switch test',
        body: 'With the generator running in manual, initiate a simulated mains failure through the ATS panel. Verify the ATS transfers load to the generator within the specified time (typically <10 seconds). Confirm all essential circuits are energised.',
      },
      {
        title: 'Load run and data logging',
        body: 'Run the generator under load for at least 30 minutes. Record voltage on all three phases, frequency, current per phase, oil pressure, and coolant temperature every 10 minutes. Compare against the factory test sheet.',
      },
      {
        title: 'Restore mains and cool down',
        body: 'Transfer load back to mains. Allow the generator to run off-load for 5 minutes to cool down before shutting down. Check for fluid leaks after shutdown. Log all data and update the generator maintenance record.',
      },
    ],
  },
  {
    id: 'KB-014',
    title: 'Lift Troubleshooting — Common Faults',
    category: 'video',
    description: 'Video guide covering the five most common lift faults encountered on site, how to diagnose them, and when to escalate.',
    estimatedTime: '22 min watch',
    difficulty: 'intermediate',
    tags: ['lift', 'elevator', 'troubleshooting', 'faults', 'video'],
    videoUrl: 'https://www.youtube.com/embed/hJMPQ6eCGq8',
    thumbnailUrl: 'https://img.youtube.com/vi/hJMPQ6eCGq8/hqdefault.jpg',
    steps: [
      {
        title: 'Fault 1 — Lift will not move, door open',
        body: 'Most common cause: a door interlock fault on a landing door. Inspect each landing door for debris in the door track, damaged door edges, or a loose interlock contact. Reset the lift via the car operating panel.',
        tip: 'If the fault repeats, check the controller fault log — it will show which zone triggered the interlock fault.',
      },
      {
        title: 'Fault 2 — Lift stopping between floors',
        body: 'Usually caused by a levelling sensor fault or brake adjustment issue. Do not attempt to re-level the car yourself. Take the lift out of service and contact the specialist contractor. Verify no occupants are trapped.',
        warning: 'Never try to manually move a lift car that has stopped between floors without proper training and the correct rescue equipment.',
      },
      {
        title: 'Fault 3 — Sluggish door operation',
        body: 'Check the door drive belt for wear and the door operator motor for correct voltage. Clean the door tracks and apply the correct door lubricant. Adjust the door closing time in the controller menu if required.',
      },
      {
        title: 'Fault 4 — Overheating machine room alarm',
        body: 'Check that the machine room ventilation fan is running. Clean the fan filters and check the thermostat setting. If the ambient temperature exceeds 40°C, the lift must be taken out of service until cooling is restored.',
      },
    ],
  },
  {
    id: 'KB-015',
    title: 'Building Hand-Over Defect Walk — Checklist',
    category: 'checklist',
    description: 'Checklist for field engineers conducting a building handover or defect liability period inspection across all FM systems.',
    estimatedTime: '2–3 hours',
    difficulty: 'advanced',
    tags: ['inspection', 'handover', 'defects', 'checklist', 'all systems'],
    tools: ['Inspection app / tablet', 'Torch', 'Lux meter', 'Thermometer', 'Camera', 'Measuring tape'],
    steps: [
      {
        title: 'Prepare the inspection pack',
        body: 'Before starting, obtain the as-built drawings, commissioning certificates, and the defect log from the project team. Load the inspection checklist into the platform and assign the correct building zone to your session.',
      },
      {
        title: 'HVAC systems check',
        body: 'Verify all AC units, AHUs, and exhaust fans are commissioned and operational. Check supply and extract grille positions match the design drawings. Measure supply air temperature — should be within 2°C of the design setpoint.',
      },
      {
        title: 'Electrical systems check',
        body: 'Verify all lighting circuits are functioning (use lux meter in critical areas — corridors, stairwells, car parks). Test all emergency lighting on a 3-hour duration test per BS 5266. Confirm all MCB labels are accurate and legible.',
        warning: 'Do not energise any unfused or unlabelled circuits. Flag these to the project electrical engineer before proceeding.',
      },
      {
        title: 'Plumbing and sanitary check',
        body: 'Run all taps, showers, and WCs for 30 seconds each. Check for drain blockages, slow drainage, or water hammer. Verify hot water is reaching ≥55°C at the calorifier outlet to meet Legionella prevention requirements.',
      },
      {
        title: 'Fire and safety systems check',
        body: 'Confirm fire panel is live with no faults. Test all pull-stations and heat detectors in rotation. Verify all fire doors close and latch correctly and all exit signs are illuminated with emergency backup.',
      },
      {
        title: 'Document all defects',
        body: 'Log every defect with a photo, location reference, system category, and severity. Submit the completed defect schedule to the project manager and FM Manager within 48 hours of the walk.',
        tip: 'Use consistent location references (floor, zone, room number) so defects can be tracked accurately through the snagging period.',
      },
    ],
  },
  {
    id: 'KB-016',
    title: 'Legionella Risk — Hot and Cold Water Management',
    category: 'sop',
    description: 'SOP for managing Legionella risk in domestic hot and cold water systems, covering temperature checks, flushing, and remediation.',
    estimatedTime: '45 min read',
    difficulty: 'advanced',
    tags: ['plumbing', 'legionella', 'water management', 'health & safety', 'SOP'],
    tools: ['Calibrated thermometer', 'Water sampling bottles', 'Flushing log sheet', 'PPE (face shield for hot work)'],
    steps: [
      {
        title: 'Understand the risk conditions',
        body: 'Legionella bacteria thrive at temperatures between 20–45°C. Water stored or distributed within this range for extended periods poses a risk. The highest risk is in infrequently used outlets, dead legs, and low-flow areas.',
        warning: 'Legionellosis (Legionnaire\'s Disease) is a notifiable disease. Any suspected case must be reported immediately to the FM Manager and, where required, to the health authority.',
      },
      {
        title: 'Monthly temperature monitoring',
        body: 'Measure hot water temperature at the calorifier flow (must be ≥60°C), calorifier return (must be ≥50°C), and at representative sentinel outlets (nearest and furthest from calorifier). Cold water storage must be <20°C.',
        tip: 'Use a calibrated digital thermometer and run the tap for at least 1 minute before taking the temperature reading.',
      },
      {
        title: 'Flush infrequently used outlets',
        body: 'Any outlet not used in the past 7 days must be flushed for 2–5 minutes. In buildings with long periods of low occupancy, establish a weekly flushing programme for all outlets. Log every flush event.',
      },
      {
        title: 'Inspect and clean cold water storage tanks',
        body: 'Inspect cold water storage tanks at least annually — check for debris, insulation damage, signs of birds or insects, and any discolouration. Tanks must have a close-fitting lid and overflow screen.',
      },
      {
        title: 'Respond to a temperature failure',
        body: 'If a temperature reading falls outside acceptable limits, do not wait — increase calorifier setpoint to 60°C immediately and flush all outlets on the affected system. Take a water sample and send for laboratory analysis within 24 hours.',
        warning: 'Do not increase the calorifier above 65°C without specialist guidance — scalding risk to residents must be managed via thermostatic mixing valves.',
      },
    ],
  },
  {
    id: 'KB-017',
    title: 'Generator Emergency Start — Quick Reference',
    category: 'guide',
    description: 'Quick reference guide for field engineers on how to manually start the standby generator during a mains power failure.',
    estimatedTime: '5 min',
    difficulty: 'beginner',
    tags: ['electrical', 'generator', 'emergency', 'power failure', 'quick reference'],
    tools: ['Generator key', 'Torch', 'Radio or phone for comms'],
    steps: [
      {
        title: 'Confirm mains failure',
        body: 'Before going to the generator, confirm this is a mains supply failure (not an internal distribution fault). Check the incoming mains breaker at the main LV switchboard. If the breaker has tripped, do not start the generator — investigate the board first.',
      },
      {
        title: 'Go to the generator',
        body: 'Go to the generator room and check fuel level — must be above 25% to attempt a start. Visually inspect for any obvious faults (fluid leaks, disconnected cables). Confirm the mode selector is set to AUTO or MANUAL.',
      },
      {
        title: 'Manual start',
        body: 'Turn the key to the START position and hold for up to 10 seconds. Release when the engine fires. The generator should reach operating speed within 20 seconds. Check the panel for green "Generator Running" indication.',
        warning: 'Do not crank the engine for more than 10 seconds continuously — rest for 30 seconds between attempts to avoid battery damage. Maximum 3 attempts.',
      },
      {
        title: 'Transfer load',
        body: 'Once the generator is stable (check voltage 380–415V, frequency 49.5–50.5 Hz), manually transfer the ATS to generator supply if it has not transferred automatically. Notify the control room and FM Manager immediately.',
      },
      {
        title: 'Monitor and log',
        body: 'Stay with the generator for the first 15 minutes of operation. Monitor fuel consumption, temperature, and voltage. Keep the FM Manager updated every 30 minutes. Log the start time, reason, and fuel level before and after.',
      },
    ],
  },
  {
    id: 'KB-018',
    title: 'HVAC Filter Replacement — Step-by-Step',
    category: 'video',
    description: 'Video guide for replacing air handling unit (AHU) and fan coil unit (FCU) filters, covering filter grades, fitting, and disposal.',
    estimatedTime: '8 min watch',
    difficulty: 'beginner',
    tags: ['HVAC', 'filter', 'AHU', 'FCU', 'replacement', 'video'],
    videoUrl: 'https://www.youtube.com/embed/kQCKmhpBj_4',
    thumbnailUrl: 'https://img.youtube.com/vi/kQCKmhpBj_4/hqdefault.jpg',
    steps: [
      {
        title: 'Identify the correct filter grade',
        body: 'Check the asset record for the required filter specification — typically G4 (coarse pre-filter) or F7 (fine filter) for most commercial AHUs. Using the wrong filter grade can restrict airflow or reduce air quality.',
        tip: 'Filter grades are stamped on the filter frame. Never substitute a lower grade filter — it will not catch the contaminants the system is designed to filter.',
      },
      {
        title: 'Switch off and open access panel',
        body: 'Stop the AHU at the local isolator. Open the filter access panel — most panels have a quarter-turn fastener. Do not reach into the unit while it is running.',
      },
      {
        title: 'Remove old filter and inspect',
        body: 'Slide the filter out carefully — fold a bag around it as you withdraw to contain dust. Photograph the dirty filter as evidence of the service. Inspect the filter housing and seals for damage or bypass gaps.',
      },
      {
        title: 'Install new filter and restart',
        body: 'Insert the new filter in the correct airflow direction (arrow on the filter frame must point in the direction of airflow). Ensure the filter seats flush against all four sides with no gaps. Close and secure the access panel. Restart the AHU and verify normal operation.',
      },
    ],
  },
  {
    id: 'KB-019',
    title: 'PPM Schedule Compliance — Field Guide',
    category: 'sop',
    description: 'Guide for field engineers on accessing, completing, and closing PPM tasks in the platform, including evidence requirements.',
    estimatedTime: '10 min read',
    difficulty: 'beginner',
    tags: ['PPM', 'compliance', 'platform', 'SOP', 'documentation'],
    tools: ['Mobile device with DevelopmentX platform access', 'Camera'],
    steps: [
      {
        title: 'Access your assigned PPM tasks',
        body: 'Open the DevelopmentX Field portal and navigate to your Work Orders. PPM tasks will appear with the "PPM" tag. Filter by "Open" to see all due tasks. Tap a task to view the service requirement and equipment checklist.',
      },
      {
        title: 'Arrive on site and log start time',
        body: 'Tap "Start Work" as soon as you arrive on site. This timestamps your arrival and starts the SLA clock correctly. Do not forget to start the job — late logging affects your SLA performance metrics.',
        warning: 'Starting a job before physically arriving on site is a recordable compliance breach and will be flagged in your monthly performance review.',
      },
      {
        title: 'Complete the service checklist',
        body: 'Work through each checklist item in the task. Tick each item as you complete it. Mandatory items marked with an asterisk (*) must be completed — you cannot close the job without them.',
      },
      {
        title: 'Upload evidence',
        body: 'Photograph before and after shots of the asset worked on. Upload them directly in the task view. High-quality, well-lit photos are required — blurry or unrelated photos will be rejected by the supervisor.',
        tip: 'Take the "after" photo from the same angle as the "before" photo — this makes supervisor review much faster and reduces queries.',
      },
      {
        title: 'Add notes and submit',
        body: 'Complete the resolution notes field with a brief summary of work done (parts replaced, readings taken, issues found). Tap "Submit" to send the completed job for supervisor review. The task status will change to "Awaiting Review".',
      },
    ],
  },
  {
    id: 'KB-020',
    title: 'Incident Reporting — When and How',
    category: 'sop',
    description: 'SOP for field engineers on correctly logging and escalating incidents discovered on site, including near-misses and safety hazards.',
    estimatedTime: '8 min read',
    difficulty: 'beginner',
    tags: ['incident', 'reporting', 'SOP', 'safety', 'escalation'],
    tools: ['Mobile device', 'Camera'],
    steps: [
      {
        title: 'Identify what must be reported',
        body: 'Any of the following must be reported immediately: personal injury or near-miss, structural damage, active water leaks near electrical, fire or smoke, gas smell, hazardous chemical spill, or any fault affecting life safety systems.',
        warning: 'Never assume someone else has reported a hazard. If you see it, you own it — report it immediately.',
      },
      {
        title: 'Make the area safe',
        body: 'Before logging the incident, make the immediate area safe if it is safe to do so. Cordon off slip hazards, isolate faulty electrical equipment, and keep people clear of the affected area.',
      },
      {
        title: 'Log the incident in the platform',
        body: 'Open the DevelopmentX platform, navigate to New Incident, and complete the form: location, description, severity, and your name. Attach at least one photo. Submit within 15 minutes of discovery.',
        tip: 'Be factual and specific — "Water dripping from ceiling in corridor B3 near light fitting LE-042" is much more useful than "wet floor in block B".',
      },
      {
        title: 'Notify your supervisor verbally',
        body: 'After logging the incident in the platform, call or radio your site supervisor to notify them verbally. For critical or life-safety incidents, call first, then log.',
      },
      {
        title: 'Follow up and close the loop',
        body: 'Monitor the incident status in the platform. If a corrective work order has been raised, track it through to completion. If the incident is not acted on within the SLA timeframe, escalate to the FM Manager.',
      },
    ],
  },
];
