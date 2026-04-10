export const mockTechnicians = [
  { id: 'AK', name: 'Ahmed K.', skill: 'Plumbing', status: 'active', job: '#SI-301', lat: 25.1190, lng: 55.3760, rating: 4.6, jobsCompleted: 98 },
  { id: 'SM', name: 'Sara M.', skill: 'Electrical', status: 'available', lat: 25.1165, lng: 55.3790, rating: 4.9, jobsCompleted: 210 },
  { id: 'KR', name: 'Karim R.', skill: 'HVAC', status: 'transit', job: '#SI-2241', lat: 25.1180, lng: 55.3740, rating: 4.8, jobsCompleted: 142 },
  { id: 'FN', name: 'Faisal N.', skill: 'Plumbing', status: 'available', lat: 25.1155, lng: 55.3800, rating: 4.7, jobsCompleted: 87 },
  { id: 'OT', name: 'Omar T.', skill: 'General', status: 'overdue', job: '#SI-298', lat: 25.1200, lng: 55.3770, rating: 4.2, jobsCompleted: 63 },
];

export const mockIncidents = [
  { id: 'INC-SI-001', title: 'AC Failure', location: 'Villa 23, Cluster A', severity: 'critical', slaMinutes: 45, elapsed: 6, lat: 25.1185, lng: 55.3755, source: 'AI Capture' },
  { id: 'INC-SI-002', title: 'Water Leak', location: 'Villa 7, Cluster B', severity: 'medium', slaMinutes: 120, elapsed: 14, lat: 25.1160, lng: 55.3785, source: 'AI Capture' },
  { id: 'INC-SI-003', title: 'Lift Fault', location: 'Block C', severity: 'high', slaMinutes: 60, elapsed: 22, lat: 25.1195, lng: 55.3765, source: 'WhatsApp → Manual' },
  { id: 'INC-SI-004', title: 'Power Trip', location: 'Villa 31', severity: 'low', slaMinutes: 240, elapsed: 31, lat: 25.1170, lng: 55.3750, source: 'Resident App' },
];

export const mockClusters = [
  { id: 'A', lat: 25.1188, lng: 55.3758, villas: 42, incidents: 2 },
  { id: 'B', lat: 25.1162, lng: 55.3782, villas: 38, incidents: 0 },
  { id: 'C', lat: 25.1195, lng: 55.3768, villas: 55, incidents: 1 },
];

export const mockPPMRisks = [
  { id: 'PPM-001', asset: 'Chiller Unit — Block C Gym', type: 'Quarterly HVAC Service', daysUntilDue: 8, lastDone: 83, riskLevel: 'high' },
  { id: 'PPM-002', asset: 'Lift — Villa Cluster A, Block 2', type: 'Monthly Safety Check', daysUntilDue: 2, lastDone: 29, riskLevel: 'critical' },
  { id: 'PPM-003', asset: 'Fire Suppression — Community Centre', type: '6-Month Inspection', daysUntilDue: 14, lastDone: 167, riskLevel: 'medium' },
];

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
  id: 'KR', name: 'Karim R.', role: 'HVAC Specialist', pin: '1234', avatar: 'KR', rating: 4.8, jobsCompleted: 142,
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
