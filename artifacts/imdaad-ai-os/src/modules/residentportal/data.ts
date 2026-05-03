export type ResidentType = 'Owner' | 'Tenant' | 'Family Member' | 'Staff';
export type ResidentStatus = 'Active' | 'Pending' | 'Inactive';
export type RequestStatus =
  | 'Submitted'
  | 'Reviewed'
  | 'Assigned'
  | 'In Progress'
  | 'Awaiting Resident Confirmation'
  | 'Resolved'
  | 'Closed';
export type PaymentStatus = 'Paid' | 'Pending' | 'Overdue' | 'Failed';
export type DocumentStatus = 'Current' | 'Expiring Soon' | 'Expired' | 'Draft';

export interface Resident {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: ResidentType;
  unitId: string;
  siteId: string;
  status: ResidentStatus;
  openRequests: number;
  paymentStatus: PaymentStatus;
  satisfaction: number;
  lastActivity: string;
  communicationPreference: 'Portal' | 'Email' | 'WhatsApp' | 'SMS';
}

export interface Unit {
  id: string;
  unitNumber: string;
  building: string;
  floor: string;
  siteId: string;
  siteName: string;
  occupancyStatus: 'Occupied' | 'Vacant' | 'Owner Occupied' | 'Leased';
}

export interface ResidentRequest {
  id: string;
  residentId: string;
  unitId: string;
  category: string;
  description: string;
  status: RequestStatus;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  source: 'ResidentPortal' | 'SnapFix Mobile' | 'ServiceDesk' | 'WhatsApp';
  evidence: string[];
  assignedTo: string;
  sla: string;
  createdAt: string;
  eta: string;
  aiClassification: string;
  aiSummary: string;
  timeline: { label: string; at: string; detail: string }[];
  satisfactionRating?: number;
}

export interface Notice {
  id: string;
  title: string;
  message: string;
  category: 'Maintenance notice' | 'Community announcement' | 'Emergency alert' | 'Payment reminder' | 'Event notice' | 'Policy update';
  audience: string;
  channels: Array<'Portal' | 'Email' | 'WhatsApp' | 'SMS'>;
  status: 'Draft' | 'Scheduled' | 'Sent';
  scheduledAt: string;
  sentAt?: string;
  readRate: number;
}

export interface Payment {
  id: string;
  residentId: string;
  unitId: string;
  amount: number;
  currency: 'AED';
  dueDate: string;
  status: PaymentStatus;
  method: string;
  invoiceUrl: string;
}

export interface ResidentDocument {
  id: string;
  name: string;
  category: 'Tenancy Contract' | 'Ownership Document' | 'Community Rules' | 'Invoice' | 'Service Agreement' | 'Notice' | 'Handover Document';
  linkedResidentId: string;
  linkedUnitId: string;
  visibility: 'Resident only' | 'Owner only' | 'Unit household' | 'Building residents';
  expiryDate: string;
  status: DocumentStatus;
}

export const units: Unit[] = [
  { id: 'unit-a1204', unitNumber: 'A-1204', building: 'Tower A', floor: '12', siteId: 'lawnz', siteName: 'Lawnz Residences', occupancyStatus: 'Owner Occupied' },
  { id: 'unit-b0807', unitNumber: 'B-0807', building: 'Tower B', floor: '8', siteId: 'bayz', siteName: 'Bayz 102', occupancyStatus: 'Leased' },
  { id: 'unit-c0211', unitNumber: 'C-0211', building: 'Cluster C', floor: '2', siteId: 'verdana', siteName: 'Verdana Tower', occupancyStatus: 'Occupied' },
  { id: 'unit-p1401', unitNumber: 'P-1401', building: 'Podium Residences', floor: '14', siteId: 'lawnz', siteName: 'Lawnz Residences', occupancyStatus: 'Occupied' },
];

export const residents: Resident[] = [
  {
    id: 'res-001',
    name: 'Layla Hassan',
    email: 'layla.hassan@example.ae',
    phone: '+971 50 221 9001',
    type: 'Owner',
    unitId: 'unit-a1204',
    siteId: 'lawnz',
    status: 'Active',
    openRequests: 2,
    paymentStatus: 'Pending',
    satisfaction: 87,
    lastActivity: 'Today, 10:42',
    communicationPreference: 'WhatsApp',
  },
  {
    id: 'res-002',
    name: 'Omar Nadeem',
    email: 'omar.nadeem@example.ae',
    phone: '+971 55 018 4012',
    type: 'Tenant',
    unitId: 'unit-b0807',
    siteId: 'bayz',
    status: 'Active',
    openRequests: 1,
    paymentStatus: 'Paid',
    satisfaction: 92,
    lastActivity: 'Today, 09:15',
    communicationPreference: 'Portal',
  },
  {
    id: 'res-003',
    name: 'Mariam Al Falasi',
    email: 'mariam.alfalasi@example.ae',
    phone: '+971 52 700 1440',
    type: 'Owner',
    unitId: 'unit-c0211',
    siteId: 'verdana',
    status: 'Pending',
    openRequests: 0,
    paymentStatus: 'Overdue',
    satisfaction: 76,
    lastActivity: 'Yesterday',
    communicationPreference: 'Email',
  },
  {
    id: 'res-004',
    name: 'Karim Boulos',
    email: 'karim.boulos@example.ae',
    phone: '+971 58 611 2204',
    type: 'Family Member',
    unitId: 'unit-p1401',
    siteId: 'lawnz',
    status: 'Active',
    openRequests: 1,
    paymentStatus: 'Paid',
    satisfaction: 89,
    lastActivity: '2 days ago',
    communicationPreference: 'SMS',
  },
];

export const residentRequests: ResidentRequest[] = [
  {
    id: 'RP-REQ-1048',
    residentId: 'res-001',
    unitId: 'unit-a1204',
    category: 'Safety Equipment / Cooling',
    description: 'Bedroom cooling is weak and the thermostat is showing intermittent compressor lockout warnings.',
    status: 'In Progress',
    priority: 'High',
    source: 'SnapFix Mobile',
    evidence: ['Photo: thermostat-warning.jpg', 'Voice note: cooling issue description'],
    assignedTo: 'FieldOps Safety Equipment Team',
    sla: '2h remaining',
    createdAt: 'Today, 09:36',
    eta: 'Today, 12:30',
    aiClassification: 'Likely FCU airflow or actuator issue',
    aiSummary: 'AI grouped this with two recent Tower A cooling complaints and recommends checking riser airflow before closing.',
    timeline: [
      { label: 'Submitted', at: '09:36', detail: 'Resident submitted via SnapFix mobile with photo evidence.' },
      { label: 'Reviewed', at: '09:41', detail: 'AI classified as Safety Equipment / Cooling, high priority.' },
      { label: 'Assigned', at: '09:48', detail: 'Assigned to FieldOps Safety Equipment Team.' },
      { label: 'In progress', at: '10:20', detail: 'Inspector en route after completing nearby PPM.' },
    ],
  },
  {
    id: 'RP-REQ-1042',
    residentId: 'res-002',
    unitId: 'unit-b0807',
    category: 'Chemical Safety',
    description: 'Slow drain in guest bathroom, recurring after previous visit.',
    status: 'Awaiting Resident Confirmation',
    priority: 'Medium',
    source: 'ResidentPortal',
    evidence: ['Photo: sink-drain.jpg'],
    assignedTo: 'ServiceDesk Plumbing Vendor',
    sla: 'On target',
    createdAt: 'Yesterday, 16:05',
    eta: 'Completed',
    aiClassification: 'Repeat complaint risk',
    aiSummary: 'AI detected this is the second similar drain complaint in 30 days and recommends resident confirmation before closure.',
    timeline: [
      { label: 'Submitted', at: 'Yesterday 16:05', detail: 'Resident submitted via portal.' },
      { label: 'Assigned', at: 'Yesterday 16:22', detail: 'ServiceDesk routed to plumbing vendor.' },
      { label: 'Resolved', at: 'Today 08:35', detail: 'Vendor uploaded completion photo and drain test.' },
    ],
    satisfactionRating: 4,
  },
  {
    id: 'RP-REQ-1035',
    residentId: 'res-004',
    unitId: 'unit-p1401',
    category: 'Access Control',
    description: 'Visitor QR access failed twice at podium security gate.',
    status: 'Assigned',
    priority: 'Low',
    source: 'WhatsApp',
    evidence: ['Screenshot: visitor-qr-error.png'],
    assignedTo: 'Community Services Desk',
    sla: '6h remaining',
    createdAt: 'Today, 08:10',
    eta: 'Today, 15:00',
    aiClassification: 'Community service / access request',
    aiSummary: 'AI suggests checking visitor invite expiry and gate reader sync before escalating to security systems vendor.',
    timeline: [
      { label: 'Submitted', at: '08:10', detail: 'Message received via WhatsApp channel.' },
      { label: 'Reviewed', at: '08:16', detail: 'Classified as access control support.' },
      { label: 'Assigned', at: '08:23', detail: 'Community Services Desk accepted request.' },
    ],
  },
];

export const notices: Notice[] = [
  {
    id: 'notice-001',
    title: 'Chilled Water Maintenance - Tower A',
    message: 'Cooling maintenance will take place on Thursday from 10:00 to 14:00. Cooling may fluctuate for short periods.',
    category: 'Maintenance notice',
    audience: 'Tower A residents',
    channels: ['Portal', 'Email', 'WhatsApp'],
    status: 'Sent',
    scheduledAt: '2026-04-24 09:00',
    sentAt: '2026-04-24 09:00',
    readRate: 84,
  },
  {
    id: 'notice-002',
    title: 'Community Pool Reopening',
    message: 'The podium pool reopens this weekend after water quality certification.',
    category: 'Community announcement',
    audience: 'All residents',
    channels: ['Portal', 'Email'],
    status: 'Scheduled',
    scheduledAt: '2026-04-28 12:00',
    readRate: 0,
  },
];

export const payments: Payment[] = [
  { id: 'INV-2026-0018', residentId: 'res-001', unitId: 'unit-a1204', amount: 4200, currency: 'AED', dueDate: '2026-05-10', status: 'Pending', method: 'Portal card', invoiceUrl: '#' },
  { id: 'INV-2026-0013', residentId: 'res-002', unitId: 'unit-b0807', amount: 1850, currency: 'AED', dueDate: '2026-04-18', status: 'Paid', method: 'Bank transfer', invoiceUrl: '#' },
  { id: 'INV-2026-0009', residentId: 'res-003', unitId: 'unit-c0211', amount: 5600, currency: 'AED', dueDate: '2026-04-05', status: 'Overdue', method: 'Pending', invoiceUrl: '#' },
];

export const residentDocuments: ResidentDocument[] = [
  { id: 'doc-res-001', name: 'Tenancy Contract - Unit B-0807', category: 'Tenancy Contract', linkedResidentId: 'res-002', linkedUnitId: 'unit-b0807', visibility: 'Unit household', expiryDate: '2026-12-31', status: 'Current' },
  { id: 'doc-res-002', name: 'Community Rules Handbook', category: 'Community Rules', linkedResidentId: 'res-001', linkedUnitId: 'unit-a1204', visibility: 'Building residents', expiryDate: 'N/A', status: 'Current' },
  { id: 'doc-res-003', name: 'Move-in Handover Pack', category: 'Handover Document', linkedResidentId: 'res-004', linkedUnitId: 'unit-p1401', visibility: 'Resident only', expiryDate: 'N/A', status: 'Current' },
  { id: 'doc-res-004', name: 'Service Charge Invoice Q2', category: 'Invoice', linkedResidentId: 'res-003', linkedUnitId: 'unit-c0211', visibility: 'Owner only', expiryDate: '2026-05-01', status: 'Expiring Soon' },
];

export const communityServices = [
  { id: 'amenity', title: 'Amenity Bookings', count: 18, detail: 'Pool, gym, meeting room, and multipurpose hall bookings.' },
  { id: 'visitor', title: 'Visitor Access', count: 42, detail: 'QR visitor passes, security approvals, and access logs.' },
  { id: 'move', title: 'Move-in / Move-out', count: 6, detail: 'Move permits, lift bookings, and security coordination.' },
  { id: 'events', title: 'Community Events', count: 3, detail: 'Resident events, registrations, and attendance tracking.' },
  { id: 'suggestions', title: 'Suggestions', count: 11, detail: 'Community feedback, complaints, and improvement ideas.' },
];

export function getUnit(unitId: string) {
  return units.find(unit => unit.id === unitId);
}

export function getResident(residentId: string) {
  return residents.find(resident => resident.id === residentId);
}
