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
}

export const mockMemberProfiles: MockMemberProfile[] = [
  {
    id: 'mbr-001',
    name: 'Hassan Yousef',
    email: 'hassan.yousef@imdaad.ae',
    role: 'FM Manager',
    perspective: 'Strategic',
    assignedClients: ['Dubai Silicon Oasis', 'Gate Avenue DIFC'],
    zones: ['Cluster A', 'Cluster B', 'Block C'],
    skills: 'HVAC, Electrical, PPM Management, Asset Intelligence',
    responsibilities: 'Oversee FM operations for Dubai Silicon Oasis and Gate Avenue DIFC\nMonitor SLA performance and escalate breaches immediately\nReview AI dispatch recommendations and adjust automation rules weekly\nConduct monthly KPI reviews with account managers',
    photo: '/team/hassan-yousef.png',
  },
  {
    id: 'mbr-002',
    name: 'Karim R.',
    email: 'karim.r@imdaad.ae',
    role: 'FM Engineer',
    perspective: 'Operational',
    assignedClients: ['Dubai Silicon Oasis'],
    zones: ['Cluster A', 'Block C'],
    skills: 'HVAC Specialist, Refrigerant Handling, Predictive Maintenance',
    responsibilities: 'Respond to HVAC incidents in Cluster A within SLA targets\nConduct quarterly chiller and AHU servicing\nLog all interventions in the platform after each job\nTrain junior technicians on HVAC diagnostic procedures',
    photo: '/team/karim-r.png',
  },
  {
    id: 'mbr-003',
    name: 'Rania Al-Farsi',
    email: 'rania.alfarsi@imdaad.ae',
    role: 'Account Manager',
    perspective: 'Strategic',
    assignedClients: ['Dubai Silicon Oasis'],
    zones: ['Dubai East'],
    skills: 'Client Relations, KPI Reporting, Contract Management',
    responsibilities: 'Manage the Dubai Silicon Oasis client relationship\nDeliver monthly performance reports to the client board\nTrack contract renewal milestones and renewal readiness\nCoordinate with FM Manager on escalation resolution',
    photo: '/team/rania-al-farsi.png',
  },
  {
    id: 'mbr-004',
    name: 'Tariq Mansour',
    email: 'tariq.mansour@imdaad.ae',
    role: 'Site Supervisor',
    perspective: 'Operational',
    assignedClients: ['Dubai Silicon Oasis'],
    zones: ['Cluster A', 'Cluster B', 'Block C', 'Recreation Area'],
    skills: 'HVAC & Electrical, Site Safety, Permit to Work',
    responsibilities: 'Conduct daily site walk-arounds and log observations before 09:00\nEnsure all technicians hold valid permits for high-risk tasks\nChase overdue work orders 30 min before SLA breach\nReview team attendance and assign shift coverage',
    photo: '/team/tariq-mansour.png',
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
    responsibilities: 'Review service request status and SLA compliance\nSubmit and track maintenance requests for JLT North\nAccess performance reports and satisfaction data\nEscalate unresolved issues to Imdaad account management',
    photo: '/team/lina-barakat.png',
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
  id: 'KR', name: 'Karim R.', role: 'HVAC Specialist', pin: '1234', avatar: 'KR', rating: 4.8, jobsCompleted: 142, email: 'karim.r@imdaad.ae',
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

export const mockBenchmarkData = {
  sites: [
    { name: 'Silicon Oasis', sla: 94, incidents: 47, compliance: 94 },
    { name: 'Gate Avenue',   sla: 88, incidents: 31, compliance: 88 },
    { name: 'Business Bay',  sla: 91, incidents: 52, compliance: 91 },
    { name: 'JLT North',     sla: 79, incidents: 63, compliance: 79 },
    { name: 'DIFC Tower',    sla: 96, incidents: 18, compliance: 96 },
  ],
  vendors: [
    { name: 'Imdaad Core',  slaBreaches: 2,  avgResolution: 38, repeatFailure: 4,  rating: 4.8 },
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
      vendorManager: 'Zaid Al-Hamdan — Imdaad HQ',
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
      vendorManager: 'Zaid Al-Hamdan — Imdaad HQ',
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
      vendorManager: 'Mariam Nasser — Imdaad HQ',
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
      vendorManager: 'Mariam Nasser — Imdaad HQ',
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
      vendorManager: 'Zaid Al-Hamdan — Imdaad HQ',
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
      vendorManager: 'Leila Mahmoud — Imdaad HQ',
      notes: 'White-glove service standard. All staff must hold valid DTCM certification. Branded uniforms mandatory on-site.',
    },
    lat: 25.1972,
    lng: 55.2744,
    marketLabel: 'Downtown',
  },
];
