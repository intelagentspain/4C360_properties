export type DispatchMode = 'manual' | 'hybrid' | 'ai';

export interface MatchWeight {
  label: string;
  enabled: boolean;
  weight: number;
  desc: string;
}

export interface AutoRule {
  id: string;
  category: string;
  severity: string;
  site: string;
  timeOfDay: string;
  assetType: string;
  clientType?: string;
  slaThreshold: string;
  target: string;
  requireConfirmation: boolean;
}

export interface SeverityRule {
  ticketType: string;
  severity: string;
  allowedMode: DispatchMode;
  escalationRequired: boolean;
  evidenceRequired: boolean;
  supervisorApproval: boolean;
}

export interface SLARule {
  id: string;
  label: string;
  threshold: string;
  dispatchPriority: string;
  techProfile: string;
}

export interface EscalationRule {
  id: string;
  trigger: string;
  condition: string;
  action: string;
  notifyRole: string;
  enabled: boolean;
}

export interface EligibilityRule {
  id: string;
  name: string;
  type: 'vendor' | 'inhouse';
  skillFilter: string;
  regionFilter: string;
  siteFilter: string;
  assetTypeFilter: string;
  serviceLines: string[];
  preference: 'preferred' | 'approved' | 'restricted';
}

export interface DispatchSettings {
  globalMode: DispatchMode;
  modeOverrides: { condition: string; mode: DispatchMode }[];
  matchWeights: Record<string, MatchWeight>;
  autoAssignRules: AutoRule[];
  severityRules: SeverityRule[];
  slaRules: SLARule[];
  escalationRules: EscalationRule[];
  eligibilityRules: EligibilityRule[];
}

export const initialDispatchSettings: DispatchSettings = {
  globalMode: 'hybrid',

  modeOverrides: [
    { condition: 'Critical severity — any ticket type', mode: 'manual' },
    { condition: 'HVAC Failure — SLA < 30 min remaining', mode: 'ai' },
    { condition: 'Fire safety incident — any severity', mode: 'manual' },
    { condition: 'Off-hours (22:00–06:00) — low/medium tickets', mode: 'ai' },
  ],

  matchWeights: {
    proximityDistance: { label: 'Proximity / Distance',    enabled: true,  weight: 30, desc: 'Prefer the nearest available technician to the incident location' },
    skillMatch:        { label: 'Skill Match',             enabled: true,  weight: 25, desc: 'Exact or closest skill match to the ticket category' },
    availability:      { label: 'Availability Status',     enabled: true,  weight: 20, desc: 'Technician must be Available or En Route with low load' },
    slaRisk:           { label: 'SLA Risk Weight',         enabled: true,  weight: 15, desc: 'Elevate priority if SLA breach is imminent' },
    techRating:        { label: 'Tech Performance Rating', enabled: true,  weight: 5,  desc: 'Higher-rated technicians preferred for critical jobs' },
    shiftCompliance:   { label: 'Shift Compliance',        enabled: true,  weight: 5,  desc: 'Do not assign technicians outside their scheduled shift' },
    pastPerformance:   { label: 'Past Performance Score',  enabled: false, weight: 0,  desc: 'Historical job closure rate and SLA adherence per technician' },
    vendorPreference:  { label: 'Client Vendor Preference', enabled: false, weight: 0, desc: "Match the client's preferred vendor/team when specified" },
    clientPreference:  { label: 'Client Preference Tag',   enabled: false, weight: 0,  desc: 'Client-specific technician preference flags' },
    languageMatch:     { label: 'Language Match',          enabled: false, weight: 0,  desc: 'Match technician language to resident language preference' },
    assetFamiliarity:  { label: 'Asset Familiarity',       enabled: false, weight: 0,  desc: 'Prefer technicians who have worked on the same asset previously' },
  },

  autoAssignRules: [
    {
      id: 'AR-001',
      category: 'HVAC',
      severity: 'critical',
      site: 'All Sites',
      timeOfDay: 'Any',
      assetType: 'Chiller / AHU',
      slaThreshold: '< 45 min',
      target: 'Nearest HVAC-certified tech',
      requireConfirmation: false,
    },
    {
      id: 'AR-002',
      category: 'Plumbing',
      severity: 'medium',
      site: 'Silicon Oasis',
      timeOfDay: 'Business hours',
      assetType: 'Any',
      slaThreshold: '< 120 min',
      target: 'Available plumber — in-house preferred',
      requireConfirmation: true,
    },
    {
      id: 'AR-003',
      category: 'Electrical',
      severity: 'low',
      site: 'All Sites',
      timeOfDay: 'Off-hours',
      assetType: 'Any',
      slaThreshold: '< 240 min',
      target: 'On-call electrician',
      requireConfirmation: false,
    },
  ],

  severityRules: [
    { ticketType: 'Cleaning',        severity: 'low',      allowedMode: 'ai',     escalationRequired: false, evidenceRequired: false, supervisorApproval: false },
    { ticketType: 'HVAC',            severity: 'medium',   allowedMode: 'hybrid', escalationRequired: false, evidenceRequired: true,  supervisorApproval: false },
    { ticketType: 'HVAC',            severity: 'critical', allowedMode: 'manual', escalationRequired: true,  evidenceRequired: true,  supervisorApproval: true  },
    { ticketType: 'Plumbing',        severity: 'high',     allowedMode: 'hybrid', escalationRequired: false, evidenceRequired: true,  supervisorApproval: false },
    { ticketType: 'Electrical',      severity: 'critical', allowedMode: 'manual', escalationRequired: true,  evidenceRequired: true,  supervisorApproval: true  },
    { ticketType: 'Fire Safety',     severity: 'critical', allowedMode: 'manual', escalationRequired: true,  evidenceRequired: true,  supervisorApproval: true  },
    { ticketType: 'General',         severity: 'low',      allowedMode: 'ai',     escalationRequired: false, evidenceRequired: false, supervisorApproval: false },
    { ticketType: 'Lift / Elevator', severity: 'high',     allowedMode: 'manual', escalationRequired: true,  evidenceRequired: true,  supervisorApproval: true  },
  ],

  slaRules: [
    { id: 'SLA-001', label: 'Emergency',  threshold: '< 15 min', dispatchPriority: 'Override all — nearest available', techProfile: 'Any certified tech' },
    { id: 'SLA-002', label: 'Critical',   threshold: '< 30 min', dispatchPriority: 'Highest skill + nearest',          techProfile: 'Specialist required' },
    { id: 'SLA-003', label: 'Urgent',     threshold: '< 60 min', dispatchPriority: 'Best skill match',                 techProfile: 'Certified or experienced' },
    { id: 'SLA-004', label: 'Standard',   threshold: '< 120 min', dispatchPriority: 'Balanced — skill + proximity',   techProfile: 'Any available' },
    { id: 'SLA-005', label: 'Routine',    threshold: '< 240 min', dispatchPriority: 'Nearest available',              techProfile: 'Scheduled shift preferred' },
  ],

  escalationRules: [
    {
      id: 'ESC-001',
      trigger: 'Critical Safety Incident',
      condition: 'Fire, structural, or life-safety ticket opened',
      action: 'Immediately notify Regional Manager + Safety Officer',
      notifyRole: 'Regional Manager',
      enabled: true,
    },
    {
      id: 'ESC-002',
      trigger: 'SLA Breach',
      condition: 'Job exceeds SLA deadline by > 10 min',
      action: 'Escalate to Supervisor — flag on Command Center',
      notifyRole: 'Supervisor',
      enabled: true,
    },
    {
      id: 'ESC-003',
      trigger: 'Vendor No-Response',
      condition: 'Assigned vendor has not accepted job in 15 min',
      action: 'Reassign to in-house team and notify Procurement',
      notifyRole: 'Operations Manager',
      enabled: true,
    },
    {
      id: 'ESC-004',
      trigger: 'Repeat Failure',
      condition: 'Same asset has 3+ incidents in 30 days',
      action: 'Trigger full asset audit and notify Engineering Lead',
      notifyRole: 'Engineering Lead',
      enabled: true,
    },
    {
      id: 'ESC-005',
      trigger: 'Off-Hours Critical',
      condition: 'Critical ticket opened between 22:00–06:00',
      action: 'Auto-page on-call supervisor via WhatsApp + SMS',
      notifyRole: 'On-Call Supervisor',
      enabled: false,
    },
  ],

  eligibilityRules: [
    {
      id: 'ELG-001',
      name: 'Emirates HVAC Co.',
      type: 'vendor',
      skillFilter: 'HVAC',
      regionFilter: 'Dubai',
      siteFilter: 'Silicon Oasis',
      assetTypeFilter: 'Chiller / AHU',
      serviceLines: ['Chiller Service', 'AHU Maintenance', 'Refrigeration'],
      preference: 'preferred',
    },
    {
      id: 'ELG-002',
      name: 'Al Futtaim Engineering',
      type: 'vendor',
      skillFilter: 'Electrical',
      regionFilter: 'Dubai, Abu Dhabi',
      siteFilter: 'All Sites',
      assetTypeFilter: 'Generator',
      serviceLines: ['HV Systems', 'Generator Service', 'Fire Detection'],
      preference: 'approved',
    },
    {
      id: 'ELG-003',
      name: 'Imdaad In-House Team A',
      type: 'inhouse',
      skillFilter: 'General',
      regionFilter: 'Silicon Oasis',
      siteFilter: 'Silicon Oasis',
      assetTypeFilter: 'Any',
      serviceLines: ['Cleaning', 'Minor Repairs', 'Plumbing'],
      preference: 'preferred',
    },
    {
      id: 'ELG-004',
      name: 'TechServ ME',
      type: 'vendor',
      skillFilter: 'Any',
      regionFilter: 'All Regions',
      siteFilter: 'All Sites',
      assetTypeFilter: 'Any',
      serviceLines: ['General FM'],
      preference: 'restricted',
    },
    {
      id: 'ELG-005',
      name: 'Imdaad In-House Team B',
      type: 'inhouse',
      skillFilter: 'HVAC',
      regionFilter: 'Dubai',
      siteFilter: 'Gate Avenue',
      assetTypeFilter: 'Lift',
      serviceLines: ['PPM Tasks', 'Corrective Maintenance'],
      preference: 'preferred',
    },
  ],
};
