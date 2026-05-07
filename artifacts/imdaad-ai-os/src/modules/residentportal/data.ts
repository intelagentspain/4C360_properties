export type ResidentType = 'Owner' | 'Tenant' | 'Family' | 'Staff';
export type ResidentStatus = 'Invited' | 'Pending Verification' | 'Active' | 'Suspended' | 'Moved Out';
export type RiskLevel = 'Low' | 'Medium' | 'High';
export type PaymentStatus = 'Paid' | 'Pending' | 'Overdue' | 'Failed' | 'Disputed';
export type DocumentStatus = 'Current' | 'Expiring Soon' | 'Expired' | 'Draft' | 'Signature Required' | 'Missing';
export type RequestStatus =
  | 'Submitted'
  | 'Reviewed'
  | 'Assigned'
  | 'In Progress'
  | 'Resolved'
  | 'Resident Confirmed'
  | 'Closed'
  | 'Reopened';

export interface Community {
  id: string;
  name: string;
  developer: string;
  location: string;
  type: 'Residential Tower' | 'Villa Community' | 'Mixed-use' | 'Commercial Residential' | 'Master Community';
  towers: number;
  units: number;
  residents: number;
  openRequests: number;
  satisfaction: number;
  pendingPayments: string;
  risk: RiskLevel;
  amenities: string[];
}

export interface Unit {
  id: string;
  unitNumber: string;
  building: string;
  floor: string;
  communityId: string;
  occupancyStatus: 'Occupied' | 'Vacant' | 'Owner Occupied' | 'Leased';
}

export interface Resident {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: ResidentType;
  unitId: string;
  communityId: string;
  status: ResidentStatus;
  openRequests: number;
  paymentStatus: PaymentStatus;
  satisfaction: number;
  risk: RiskLevel;
  lastActivity: string;
  communicationPreference: 'Portal' | 'Email' | 'WhatsApp' | 'SMS';
  sentiment: 'Positive' | 'Neutral' | 'Frustrated' | 'Escalating';
}

export interface ResidentRequest {
  id: string;
  residentId: string;
  unitId: string;
  communityId: string;
  category: string;
  description: string;
  status: RequestStatus;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  source: 'Resident app' | 'QR code' | 'Photo upload' | 'Voice note' | 'Chat assistant' | 'Manual admin entry' | 'WhatsApp/email';
  evidence: string[];
  assignedTo: string;
  sla: string;
  createdAt: string;
  eta: string;
  aiClassification: string;
  aiSeverity: string;
  aiSummary: string;
  repeatIssue: boolean;
  sentiment: string;
  timeline: { label: string; at: string; detail: string }[];
  satisfactionRating?: number;
}

export interface Amenity {
  id: string;
  name: string;
  capacity: number;
  hours: string;
  approvalRequired: boolean;
  paidBooking: boolean;
  cancellationPolicy: string;
  restrictions: string;
  blackoutDates: string[];
  occupancy: number;
  revenue: string;
  peakInsight: string;
}

export interface AmenityBooking {
  id: string;
  residentId: string;
  unitId: string;
  amenityId: string;
  dateTime: string;
  status: 'Confirmed' | 'Pending Approval' | 'Cancelled' | 'No Show' | 'Completed';
  payment: 'Paid' | 'Free' | 'Pending';
  accessQr: string;
}

export interface Notice {
  id: string;
  title: string;
  message: string;
  category: 'Maintenance' | 'Emergency' | 'Community Event' | 'Payment Reminder' | 'Policy Update' | 'Handover' | 'General';
  audience: string;
  channels: Array<'portal' | 'email' | 'SMS' | 'WhatsApp'>;
  status: 'Draft' | 'Scheduled' | 'Sent';
  sentDate: string;
  deliveryRate: number;
  readRate: number;
  sentiment: string;
}

export interface Payment {
  id: string;
  residentId: string;
  unitId: string;
  amount: number;
  currency: 'AED';
  dueDate: string;
  status: PaymentStatus;
  category: 'Service charges' | 'Amenity fees' | 'Penalties' | 'Maintenance charges' | 'Handover payments' | 'Community fees';
  method: string;
}

export interface ResidentDocument {
  id: string;
  name: string;
  category:
    | 'Tenancy contract'
    | 'Ownership document'
    | 'Handover pack'
    | 'Community rules'
    | 'Invoices'
    | 'Warranty documents'
    | 'Maintenance manuals'
    | 'NOC'
    | 'ID/passport copies'
    | 'Service agreements';
  linkedResidentId: string;
  linkedUnitId: string;
  linkedCommunityId: string;
  visibility: 'Resident only' | 'Owner only' | 'Unit household' | 'Building residents' | 'Community';
  expiryDate: string;
  signatureRequired: boolean;
  status: DocumentStatus;
}

export interface HandoverRecord {
  id: string;
  unitId: string;
  residentId: string;
  handoverDate: string;
  checklistStatus: string;
  snagsOpen: number;
  documentsSigned: string;
  warrantyStatus: string;
  moveInStatus: string;
}

export interface WarrantyClaim {
  id: string;
  category: string;
  unitId: string;
  reportedDate: string;
  warrantyValid: boolean;
  assignedVendor: string;
  status: string;
  evidence: string;
}

export interface Insight {
  id: string;
  title: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  affected: string;
  reason: string;
  recommendedAction: string;
  section: 'satisfaction' | 'operations' | 'engagement' | 'revenue' | 'actions';
}

export const lifecycleStages = [
  { stage: 'Invited', count: 248, conversion: 100 },
  { stage: 'Registered', count: 219, conversion: 88 },
  { stage: 'Verified', count: 194, conversion: 78 },
  { stage: 'Active', count: 176, conversion: 71 },
  { stage: 'Moved In', count: 162, conversion: 65 },
  { stage: 'Handover Complete', count: 149, conversion: 60 },
];

export const kpis = [
  { label: 'Total Residents', value: '1,248', delta: '+6%' },
  { label: 'Active Units', value: '872', delta: '+3%' },
  { label: 'Open Requests', value: '143', delta: '+12' },
  { label: 'Overdue Requests', value: '18', delta: 'SLA risk' },
  { label: 'Pending Payments', value: 'AED 382K', delta: '+AED 41K' },
  { label: 'Amenity Bookings Today', value: '64', delta: '92% peak' },
  { label: 'Notices Read Rate', value: '78%', delta: '+5%' },
  { label: 'Satisfaction Score', value: '86%', delta: '+4%' },
  { label: 'At-Risk Residents', value: '23', delta: 'Needs care' },
];

export const communities: Community[] = [
  {
    id: 'jumeirah-heights',
    name: 'Jumeirah Heights',
    developer: '4C360 Communities',
    location: 'Jumeirah, Dubai',
    type: 'Residential Tower',
    towers: 3,
    units: 420,
    residents: 612,
    openRequests: 48,
    satisfaction: 84,
    pendingPayments: 'AED 122K',
    risk: 'Medium',
    amenities: ['Gym', 'Pool', 'Padel Court', 'BBQ Area', 'Community Room'],
  },
  {
    id: 'bayz-102',
    name: 'Bayz 102',
    developer: 'Danube Properties',
    location: 'Business Bay, Dubai',
    type: 'Residential Tower',
    towers: 1,
    units: 680,
    residents: 910,
    openRequests: 76,
    satisfaction: 78,
    pendingPayments: 'AED 211K',
    risk: 'High',
    amenities: ['Gym', 'Pool', 'Cinema Room', 'Co-working Lounge', 'Guest Parking'],
  },
  {
    id: 'marina-residences',
    name: 'Marina Residences',
    developer: '4C360 Communities',
    location: 'Dubai Marina',
    type: 'Mixed-use',
    towers: 2,
    units: 260,
    residents: 390,
    openRequests: 19,
    satisfaction: 91,
    pendingPayments: 'AED 31K',
    risk: 'Low',
    amenities: ['Gym', 'Pool', 'Kids Play Area', 'BBQ Area'],
  },
  {
    id: 'creek-view-towers',
    name: 'Creek View Towers',
    developer: 'Creek View Master Developer',
    location: 'Dubai Creek Harbour',
    type: 'Master Community',
    towers: 4,
    units: 540,
    residents: 690,
    openRequests: 34,
    satisfaction: 88,
    pendingPayments: 'AED 59K',
    risk: 'Medium',
    amenities: ['Pool', 'Community Room', 'Kids Play Area', 'Co-working Lounge'],
  },
];

export const units: Unit[] = [
  { id: 'unit-jh-a1204', unitNumber: 'Tower A 1204', building: 'Tower A', floor: '12', communityId: 'jumeirah-heights', occupancyStatus: 'Owner Occupied' },
  { id: 'unit-bayz-2608', unitNumber: 'Unit 2608', building: 'Bayz 102', floor: '26', communityId: 'bayz-102', occupancyStatus: 'Leased' },
  { id: 'unit-marina-1802', unitNumber: 'Unit 1802', building: 'Marina Tower 1', floor: '18', communityId: 'marina-residences', occupancyStatus: 'Owner Occupied' },
  { id: 'unit-jh-b904', unitNumber: 'Tower B 904', building: 'Tower B', floor: '9', communityId: 'jumeirah-heights', occupancyStatus: 'Leased' },
  { id: 'unit-bayz-4110', unitNumber: 'Unit 4110', building: 'Bayz 102', floor: '41', communityId: 'bayz-102', occupancyStatus: 'Owner Occupied' },
];

export const residents: Resident[] = [
  {
    id: 'res-ahmad',
    name: 'Ahmad M.',
    email: 'ahmad.m@example.ae',
    phone: '+971 50 221 9001',
    type: 'Owner',
    unitId: 'unit-jh-a1204',
    communityId: 'jumeirah-heights',
    status: 'Active',
    openRequests: 2,
    paymentStatus: 'Overdue',
    satisfaction: 82,
    risk: 'Medium',
    lastActivity: 'Today, 10:42',
    communicationPreference: 'WhatsApp',
    sentiment: 'Frustrated',
  },
  {
    id: 'res-sara',
    name: 'Sara K.',
    email: 'sara.k@example.ae',
    phone: '+971 55 018 4012',
    type: 'Tenant',
    unitId: 'unit-bayz-2608',
    communityId: 'bayz-102',
    status: 'Pending Verification',
    openRequests: 3,
    paymentStatus: 'Pending',
    satisfaction: 71,
    risk: 'High',
    lastActivity: 'Today, 09:15',
    communicationPreference: 'Portal',
    sentiment: 'Escalating',
  },
  {
    id: 'res-omar',
    name: 'Omar H.',
    email: 'omar.h@example.ae',
    phone: '+971 52 700 1440',
    type: 'Owner',
    unitId: 'unit-marina-1802',
    communityId: 'marina-residences',
    status: 'Active',
    openRequests: 0,
    paymentStatus: 'Paid',
    satisfaction: 94,
    risk: 'Low',
    lastActivity: 'Yesterday',
    communicationPreference: 'Email',
    sentiment: 'Positive',
  },
  {
    id: 'res-lina',
    name: 'Lina R.',
    email: 'lina.r@example.ae',
    phone: '+971 58 611 2204',
    type: 'Tenant',
    unitId: 'unit-jh-b904',
    communityId: 'jumeirah-heights',
    status: 'Active',
    openRequests: 1,
    paymentStatus: 'Paid',
    satisfaction: 87,
    risk: 'Medium',
    lastActivity: '2 days ago',
    communicationPreference: 'SMS',
    sentiment: 'Neutral',
  },
  {
    id: 'res-noura',
    name: 'Noura A.',
    email: 'noura.a@example.ae',
    phone: '+971 54 181 9090',
    type: 'Owner',
    unitId: 'unit-bayz-4110',
    communityId: 'bayz-102',
    status: 'Invited',
    openRequests: 1,
    paymentStatus: 'Disputed',
    satisfaction: 74,
    risk: 'High',
    lastActivity: 'Invite sent yesterday',
    communicationPreference: 'WhatsApp',
    sentiment: 'Frustrated',
  },
];

export const residentRequests: ResidentRequest[] = [
  {
    id: 'RP-REQ-1048',
    residentId: 'res-ahmad',
    unitId: 'unit-jh-a1204',
    communityId: 'jumeirah-heights',
    category: 'HVAC',
    description: 'AC not cooling in bedroom and thermostat shows a warning.',
    status: 'In Progress',
    priority: 'High',
    source: 'Photo upload',
    evidence: ['Photo: thermostat-warning.jpg', 'Voice note: cooling issue description'],
    assignedTo: 'FieldOps HVAC Team',
    sla: '2h remaining',
    createdAt: 'Today, 09:36',
    eta: 'Today, 12:30',
    aiClassification: 'HVAC / Cooling',
    aiSeverity: 'High because cooling is unavailable and Tower B has repeat complaints',
    aiSummary: 'AI grouped this with rising HVAC complaints and recommends checking riser airflow before closure.',
    repeatIssue: true,
    sentiment: 'Resident is frustrated after a previous visit did not resolve cooling.',
    timeline: [
      { label: 'Submitted', at: '09:36', detail: 'Resident submitted via mobile portal with photo evidence.' },
      { label: 'Reviewed', at: '09:41', detail: 'AI classified as HVAC and suggested high priority.' },
      { label: 'Assigned', at: '09:48', detail: 'ServiceDesk created the ticket and FieldOps accepted.' },
      { label: 'In Progress', at: '10:20', detail: 'Technician en route after nearby preventive maintenance.' },
    ],
  },
  {
    id: 'RP-REQ-1044',
    residentId: 'res-sara',
    unitId: 'unit-bayz-2608',
    communityId: 'bayz-102',
    category: 'Plumbing',
    description: 'Water leak from ceiling in guest bathroom.',
    status: 'Assigned',
    priority: 'Critical',
    source: 'QR code',
    evidence: ['Photo: ceiling-leak.jpg'],
    assignedTo: 'ServiceDesk Plumbing Vendor',
    sla: '45m remaining',
    createdAt: 'Today, 08:50',
    eta: 'Today, 11:15',
    aiClassification: 'Water ingress / active leak',
    aiSeverity: 'Critical because damage can spread to electrical and ceiling finishes',
    aiSummary: 'AI recommends immediate vendor dispatch and warranty eligibility check for Unit 2608.',
    repeatIssue: false,
    sentiment: 'Urgent concern and high escalation risk.',
    timeline: [
      { label: 'Submitted', at: '08:50', detail: 'Resident scanned lobby QR and uploaded photo.' },
      { label: 'Reviewed', at: '08:53', detail: 'AI flagged possible active leak.' },
      { label: 'Assigned', at: '09:02', detail: 'ServiceDesk routed to plumbing vendor and FieldOps supervisor.' },
    ],
  },
  {
    id: 'RP-REQ-1038',
    residentId: 'res-lina',
    unitId: 'unit-jh-b904',
    communityId: 'jumeirah-heights',
    category: 'Elevator',
    description: 'Elevator noise in Tower B during evening peak.',
    status: 'Submitted',
    priority: 'Medium',
    source: 'Chat assistant',
    evidence: ['Voice note: elevator noise'],
    assignedTo: 'Pending ServiceDesk triage',
    sla: '6h remaining',
    createdAt: 'Today, 07:40',
    eta: 'Pending',
    aiClassification: 'Vertical transport / noise complaint',
    aiSeverity: 'Medium because multiple residents reported peak-hour noise',
    aiSummary: 'AI suggests checking lift logs and combining with the Tower B asset inspection.',
    repeatIssue: true,
    sentiment: 'Resident is patient but expects visible follow-up.',
    timeline: [{ label: 'Submitted', at: '07:40', detail: 'Layla concierge captured the report and created a draft request.' }],
  },
  {
    id: 'RP-REQ-1032',
    residentId: 'res-noura',
    unitId: 'unit-bayz-4110',
    communityId: 'bayz-102',
    category: 'Access Control',
    description: 'Gym access card not working.',
    status: 'Resolved',
    priority: 'Low',
    source: 'Manual admin entry',
    evidence: ['Access log screenshot'],
    assignedTo: 'Community Services Desk',
    sla: 'On target',
    createdAt: 'Yesterday, 16:05',
    eta: 'Completed',
    aiClassification: 'Access card sync issue',
    aiSeverity: 'Low because access can be restored by desk reset',
    aiSummary: 'AI recommends confirming resident card sync and closing after resident confirmation.',
    repeatIssue: false,
    sentiment: 'Neutral.',
    timeline: [
      { label: 'Submitted', at: 'Yesterday 16:05', detail: 'Admin entered request from front desk call.' },
      { label: 'Assigned', at: 'Yesterday 16:20', detail: 'Community desk reset the credential.' },
      { label: 'Resolved', at: 'Today 08:35', detail: 'Access test passed at gym reader.' },
    ],
    satisfactionRating: 4,
  },
];

export const amenities: Amenity[] = [
  { id: 'gym', name: 'Gym', capacity: 28, hours: '05:00 - 23:00', approvalRequired: false, paidBooking: false, cancellationPolicy: 'Cancel anytime before slot', restrictions: 'Residents and approved family members', blackoutDates: ['2026-05-12'], occupancy: 86, revenue: 'AED 0', peakInsight: 'Bookings exceed capacity every weekday 6-8 PM.' },
  { id: 'pool', name: 'Pool', capacity: 52, hours: '07:00 - 22:00', approvalRequired: false, paidBooking: false, cancellationPolicy: 'Cancel 2 hours before slot', restrictions: 'Unit households only', blackoutDates: ['2026-05-09'], occupancy: 92, revenue: 'AED 0', peakInsight: 'Weekend pool capacity reaches 92%.' },
  { id: 'padel', name: 'Padel Court', capacity: 4, hours: '06:00 - 23:00', approvalRequired: true, paidBooking: true, cancellationPolicy: 'AED 50 late cancellation fee', restrictions: 'One active booking per unit', blackoutDates: [], occupancy: 79, revenue: 'AED 6,400', peakInsight: 'AI recommends adding one 21:00 slot.' },
  { id: 'bbq', name: 'BBQ Area', capacity: 18, hours: '10:00 - 22:00', approvalRequired: true, paidBooking: true, cancellationPolicy: 'Cancel 24 hours before slot', restrictions: 'Owners and tenants only', blackoutDates: [], occupancy: 61, revenue: 'AED 2,150', peakInsight: 'Repeated no-shows on Friday evenings.' },
  { id: 'community-room', name: 'Community Room', capacity: 35, hours: '08:00 - 22:00', approvalRequired: true, paidBooking: true, cancellationPolicy: 'Cancel 48 hours before event', restrictions: 'Management approval required', blackoutDates: [], occupancy: 44, revenue: 'AED 3,800', peakInsight: 'Good candidate for resident events.' },
  { id: 'coworking', name: 'Co-working Lounge', capacity: 22, hours: '06:00 - 23:00', approvalRequired: false, paidBooking: false, cancellationPolicy: 'Cancel anytime before slot', restrictions: 'Residents only', blackoutDates: [], occupancy: 68, revenue: 'AED 0', peakInsight: 'Morning demand rising among tenants.' },
];

export const amenityBookings: AmenityBooking[] = [
  { id: 'BK-5021', residentId: 'res-ahmad', unitId: 'unit-jh-a1204', amenityId: 'pool', dateTime: 'Today 18:00', status: 'Confirmed', payment: 'Free', accessQr: 'QR-POOL-5021' },
  { id: 'BK-5022', residentId: 'res-sara', unitId: 'unit-bayz-2608', amenityId: 'padel', dateTime: 'Today 20:00', status: 'Pending Approval', payment: 'Pending', accessQr: 'QR-PADEL-5022' },
  { id: 'BK-5017', residentId: 'res-omar', unitId: 'unit-marina-1802', amenityId: 'gym', dateTime: 'Today 07:00', status: 'Completed', payment: 'Free', accessQr: 'QR-GYM-5017' },
  { id: 'BK-5009', residentId: 'res-lina', unitId: 'unit-jh-b904', amenityId: 'bbq', dateTime: 'Tomorrow 19:00', status: 'Confirmed', payment: 'Paid', accessQr: 'QR-BBQ-5009' },
];

export const notices: Notice[] = [
  { id: 'notice-001', title: 'Scheduled AC maintenance', message: 'Chilled water maintenance is scheduled for Tower B this Thursday from 10:00 to 14:00.', category: 'Maintenance', audience: 'Tower B residents', channels: ['portal', 'email', 'WhatsApp'], status: 'Sent', sentDate: '2026-05-06', deliveryRate: 96, readRate: 84, sentiment: 'Mostly neutral, 12 residents asked about timing' },
  { id: 'notice-002', title: 'Pool temporary closure', message: 'The podium pool is closed Saturday morning for water quality certification.', category: 'Maintenance', audience: 'All residents', channels: ['portal', 'WhatsApp'], status: 'Scheduled', sentDate: '2026-05-08', deliveryRate: 0, readRate: 0, sentiment: 'Predicted read rate 81%' },
  { id: 'notice-003', title: 'Service charge reminder', message: 'Service charge invoices due this month can be paid through ResidentPortal.', category: 'Payment Reminder', audience: '41 units with pending balance', channels: ['portal', 'email', 'SMS'], status: 'Sent', sentDate: '2026-05-05', deliveryRate: 93, readRate: 78, sentiment: 'Positive after payment link added' },
  { id: 'notice-004', title: 'Fire drill notice', message: 'A scheduled fire drill will take place next Tuesday at 10:30.', category: 'Emergency', audience: 'All residents', channels: ['portal', 'email', 'SMS', 'WhatsApp'], status: 'Draft', sentDate: 'Not scheduled', deliveryRate: 0, readRate: 0, sentiment: 'AI recommends simpler wording' },
  { id: 'notice-005', title: 'Community event', message: 'Register for the Marina family evening this Friday in the community room.', category: 'Community Event', audience: 'Marina Residences', channels: ['portal', 'email'], status: 'Sent', sentDate: '2026-05-03', deliveryRate: 91, readRate: 73, sentiment: 'Strong engagement from family units' },
];

export const payments: Payment[] = [
  { id: 'INV-2026-0018', residentId: 'res-ahmad', unitId: 'unit-jh-a1204', amount: 4500, currency: 'AED', dueDate: '2026-05-10', status: 'Overdue', category: 'Service charges', method: 'Pending' },
  { id: 'INV-2026-0014', residentId: 'res-lina', unitId: 'unit-jh-b904', amount: 350, currency: 'AED', dueDate: '2026-05-06', status: 'Paid', category: 'Amenity fees', method: 'Portal card' },
  { id: 'INV-2026-0013', residentId: 'res-sara', unitId: 'unit-bayz-2608', amount: 1200, currency: 'AED', dueDate: '2026-05-16', status: 'Pending', category: 'Maintenance charges', method: 'Payment link sent' },
  { id: 'INV-2026-0009', residentId: 'res-noura', unitId: 'unit-bayz-4110', amount: 8900, currency: 'AED', dueDate: '2026-04-29', status: 'Disputed', category: 'Handover payments', method: 'Dispute opened' },
];

export const residentDocuments: ResidentDocument[] = [
  { id: 'doc-res-001', name: 'Tenancy Contract - Unit 2608', category: 'Tenancy contract', linkedResidentId: 'res-sara', linkedUnitId: 'unit-bayz-2608', linkedCommunityId: 'bayz-102', visibility: 'Unit household', expiryDate: '2026-12-31', signatureRequired: false, status: 'Current' },
  { id: 'doc-res-002', name: 'Community Rules Handbook', category: 'Community rules', linkedResidentId: 'res-ahmad', linkedUnitId: 'unit-jh-a1204', linkedCommunityId: 'jumeirah-heights', visibility: 'Community', expiryDate: 'N/A', signatureRequired: false, status: 'Current' },
  { id: 'doc-res-003', name: 'Move-in Handover Pack - Tower A', category: 'Handover pack', linkedResidentId: 'res-lina', linkedUnitId: 'unit-jh-b904', linkedCommunityId: 'jumeirah-heights', visibility: 'Resident only', expiryDate: 'N/A', signatureRequired: true, status: 'Signature Required' },
  { id: 'doc-res-004', name: 'Warranty Manual - Unit 4110', category: 'Warranty documents', linkedResidentId: 'res-noura', linkedUnitId: 'unit-bayz-4110', linkedCommunityId: 'bayz-102', visibility: 'Owner only', expiryDate: '2027-04-30', signatureRequired: false, status: 'Current' },
  { id: 'doc-res-005', name: 'Service Charge Invoice Q2', category: 'Invoices', linkedResidentId: 'res-ahmad', linkedUnitId: 'unit-jh-a1204', linkedCommunityId: 'jumeirah-heights', visibility: 'Owner only', expiryDate: '2026-05-10', signatureRequired: false, status: 'Expiring Soon' },
];

export const handovers: HandoverRecord[] = [
  { id: 'HO-2608', unitId: 'unit-bayz-2608', residentId: 'res-sara', handoverDate: '2026-05-14', checklistStatus: 'Pending snag closure', snagsOpen: 6, documentsSigned: '76%', warrantyStatus: 'DLP active', moveInStatus: 'Conditional readiness' },
  { id: 'HO-4110', unitId: 'unit-bayz-4110', residentId: 'res-noura', handoverDate: '2026-05-18', checklistStatus: 'Warranty claim open', snagsOpen: 3, documentsSigned: '88%', warrantyStatus: 'Claim open', moveInStatus: 'Not ready' },
  { id: 'HO-TOWER-A', unitId: 'unit-jh-a1204', residentId: 'res-ahmad', handoverDate: '2026-05-09', checklistStatus: 'Documents 92% complete', snagsOpen: 1, documentsSigned: '92%', warrantyStatus: 'DLP active', moveInStatus: 'Ready' },
];

export const warrantyClaims: WarrantyClaim[] = [
  { id: 'WC-881', category: 'Ceiling leak', unitId: 'unit-bayz-2608', reportedDate: '2026-05-07', warrantyValid: true, assignedVendor: 'Bayz MEP Vendor', status: 'Assigned', evidence: 'Photo and moisture reading' },
  { id: 'WC-874', category: 'Kitchen cabinet alignment', unitId: 'unit-bayz-4110', reportedDate: '2026-05-05', warrantyValid: true, assignedVendor: 'Joinery vendor', status: 'In Progress', evidence: 'Resident photos' },
  { id: 'WC-861', category: 'Balcony door seal', unitId: 'unit-jh-a1204', reportedDate: '2026-05-01', warrantyValid: true, assignedVendor: 'Facade vendor', status: 'Resident Confirmed', evidence: 'Closure photos' },
];

export const operationsPulse = [
  'AC complaints increased in Tower B',
  'Pool booking capacity at 92% this weekend',
  '5 residents pending handover document signature',
  '3 overdue warranty defects in Bayz 102',
];

export const aiCommunityInsights = [
  'Tower B has a 28% increase in HVAC complaints',
  '23 residents at escalation risk',
  'Payment reminders should be sent to 41 units',
  'Gym bookings exceed capacity every weekday 6-8 PM',
];

export const insights: Insight[] = [
  { id: 'ai-001', title: 'HVAC complaints rising in Tower B', severity: 'High', affected: '42 residents / 31 units', reason: '28% increase in HVAC complaints and two repeat issues in the same riser.', recommendedAction: 'Inspect Tower B riser and send maintenance notice.', section: 'operations' },
  { id: 'ai-002', title: '23 residents at escalation risk', severity: 'High', affected: '23 residents', reason: 'Repeated unresolved requests, frustrated sentiment, and delayed payment disputes.', recommendedAction: 'Create outreach tasks for community managers.', section: 'satisfaction' },
  { id: 'ai-003', title: 'Pool and gym demand exceeds peak capacity', severity: 'Medium', affected: '168 bookings', reason: 'Weekend pool occupancy reaches 92% and gym peaks every weekday 6-8 PM.', recommendedAction: 'Add booking slots and set capacity alerts.', section: 'engagement' },
  { id: 'ai-004', title: 'Collections risk concentrated in Bayz 102', severity: 'Medium', affected: '41 units / AED 211K', reason: 'Overdue service charges and disputed handover payments cluster in one tower.', recommendedAction: 'Send staged reminders and offer payment plans.', section: 'revenue' },
  { id: 'ai-005', title: 'Handover defects repeating by vendor', severity: 'Critical', affected: '9 warranty claims', reason: 'Ceiling leaks and cabinet alignment issues are recurring during DLP.', recommendedAction: 'Escalate vendor and schedule preventive inspection.', section: 'actions' },
];

export const bulkUploadSummary = {
  uploaded: 318,
  valid: 284,
  errors: 34,
  invitationsSent: 284,
  validations: ['duplicate email', 'missing unit', 'invalid phone', 'unit already occupied', 'missing resident type'],
};

export function getUnit(unitId: string) {
  return units.find(unit => unit.id === unitId);
}

export function getCommunity(communityId: string) {
  return communities.find(community => community.id === communityId);
}

export function getResident(residentId: string) {
  return residents.find(resident => resident.id === residentId);
}

export function getAmenity(amenityId: string) {
  return amenities.find(amenity => amenity.id === amenityId);
}
