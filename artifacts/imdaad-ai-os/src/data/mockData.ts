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
