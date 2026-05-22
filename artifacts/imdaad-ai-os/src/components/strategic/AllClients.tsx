import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Grid, List, AlertTriangle, CheckCircle, Clock,
  Zap, ChevronRight, Activity, Database, Users, BarChart2,
  TrendingUp, MapPin, ArrowRight, Shield, Bot, Plus,
  FileText, Truck, Package, Wrench, Calendar, Share2, Link2, Mail, Send, Check, Mic,
  BellRing, BellOff,
} from 'lucide-react';
import { type PortfolioClient } from '@/data/mockData';
import { type ToastFn } from '@/lib/ui';
import { AnimatedBar } from '@/components/shared/AnimatedBar';
import { AddClientModal, type ClientData, type TeamMember } from './CommandBar';
import { useMemberFilter, isFilterActive } from '@/context/MemberFilterContext';
import { useMemberProfiles } from '@/context/MemberProfilesContext';
import { useClients } from '@/context/ClientsContext';
import { useIncidents } from '@/context/IncidentContext';

const REGIONS   = ['All', 'Dubai East', 'Downtown', 'Business Bay', 'Dubai Marina', 'Jumeirah'];
const SECTORS   = ['All', 'Real Estate', 'Mixed-Use Residential', 'Commercial Retail', 'Commercial Office', 'Residential Community', 'Luxury Residential'];
const STATUSES  = ['All', 'live', 'warning', 'critical'];
const RISK_LVLS = ['All', 'low', 'medium', 'high', 'critical'];
const SORT_OPTS = [
  { label: 'Highest Risk',   key: 'risk' },
  { label: 'Most Sites',     key: 'sites' },
  { label: 'SLA (Lowest)',   key: 'sla' },
  { label: 'Most Incidents', key: 'incidents' },
];

const RISK_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
const STATUS_ORDER: Record<string, number> = { critical: 0, warning: 1, live: 2 };
const PORTFOLIO_DISPLAY_ORDER: Record<string, number> = {
  'JLT North Cluster': 0,
  'Business Bay Tower Complex': 1,
  lagoons: 2,
  'Sobha Realty': 3,
  Damac: 4,
  'DIFC Tower': 5,
  'Dubai Silicon Oasis': 6,
  'Downtown Burj Area': 7,
};

const STATUS_DOT: Record<string, string> = {
  live:     'bg-emerald-400',
  warning:  'bg-amber-400 animate-pulse',
  critical: 'bg-red-400 animate-pulse',
};

const STATUS_TEXT: Record<string, string> = {
  live:     'text-emerald-400',
  warning:  'text-amber-400',
  critical: 'text-red-400',
};

const STATUS_BORDER: Record<string, string> = {
  live:     'border-emerald-500/30',
  warning:  'border-amber-500/40',
  critical: 'border-red-500/40',
};

const STATUS_GLOW: Record<string, string> = {
  live:     '',
  warning:  'shadow-[0_0_0_1px_rgba(251,191,36,0.15)]',
  critical: 'shadow-[0_0_0_1px_rgba(239,68,68,0.2)]',
};

const RISK_STRIP: Record<string, string> = {
  low:      'bg-emerald-500',
  medium:   'bg-amber-500',
  high:     'bg-orange-500',
  critical: 'bg-red-500',
};

const RISK_BADGE: Record<string, string> = {
  low:      'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  medium:   'text-amber-400 bg-amber-500/10 border-amber-500/30',
  high:     'text-orange-400 bg-orange-500/10 border-orange-500/30',
  critical: 'text-red-400 bg-red-500/10 border-red-500/30',
};

const SITE_STATUS_DOT: Record<string, string> = {
  ok:       'bg-emerald-400',
  warning:  'bg-amber-400',
  critical: 'bg-red-400',
};

const ACTIVITY_COLOR: Record<string, string> = {
  task:       'text-emerald-400',
  ai:         'text-cyan-400',
  ok:         'text-emerald-400',
  incident:   'text-red-400',
  escalation: 'text-amber-400',
};

const ACTIVITY_ICON: Record<string, React.ReactNode> = {
  task:       <CheckCircle size={10} />,
  ai:         <Bot size={10} />,
  ok:         <CheckCircle size={10} />,
  incident:   <AlertTriangle size={10} />,
  escalation: <TrendingUp size={10} />,
};

interface PulseEvent {
  id: string;
  client: string;
  title: string;
  sub: string;
  time: string;
  severity: 'critical' | 'high' | 'medium' | 'info' | 'ok';
}

const PULSE_EVENTS: PulseEvent[] = [
  { id: 'p1', client: 'JLT North Cluster',       title: 'CRITICAL: Lift fault — 3 residents stranded',    sub: 'Cluster N1, Tower 5 · Escalated',             time: '1 min ago',  severity: 'critical' },
  { id: 'p2', client: 'Business Bay Tower',       title: 'SLA breach cascade — 4 jobs simultaneously',     sub: 'Tower A floors 8–12 · Supervisor notified',   time: '5 min ago',  severity: 'critical' },
  { id: 'p3', client: 'JLT North Cluster',        title: 'AI flag: Technician shortage detected',          sub: '9 overdue tasks · Reassignment required',      time: '10 min ago', severity: 'high'     },
  { id: 'p4', client: 'Business Bay Tower',       title: 'Power BI sync failure — reporting gap',          sub: 'Token expired · IT Ops alerted',               time: '14 min ago', severity: 'high'     },
  { id: 'p5', client: 'Jumeirah Village Circle',  title: 'Irrigation seasonal service overdue 18 days',    sub: 'District 10 · Compliance risk',                time: '20 min ago', severity: 'medium'   },
  { id: 'p6', client: 'Dubai Silicon Oasis',      title: 'IoT: Chiller C-04 predictive flag raised',       sub: 'Refrigerant 72% · Service within 6 days',     time: '28 min ago', severity: 'medium'   },
  { id: 'p7', client: 'Downtown Burj Area',       title: 'AI prevented HVAC fault — PPM dispatched',       sub: 'Residence Tower 1 · Proactive response',       time: '35 min ago', severity: 'info'     },
];

const PULSE_SEV_BORDER: Record<string, string> = {
  critical: 'border-l-red-500',
  high:     'border-l-amber-400',
  medium:   'border-l-amber-500/60',
  info:     'border-l-cyan-500/60',
  ok:       'border-l-emerald-500/60',
};

const PULSE_SEV_ICON: Record<string, { icon: React.ReactNode; cls: string }> = {
  critical: { icon: <AlertTriangle size={11} />, cls: 'text-red-400 bg-red-500/20' },
  high:     { icon: <AlertTriangle size={11} />, cls: 'text-amber-400 bg-amber-500/20' },
  medium:   { icon: <Clock size={11} />, cls: 'text-amber-400 bg-amber-500/20' },
  info:     { icon: <Bot size={11} />, cls: 'text-cyan-400 bg-cyan-500/20' },
  ok:       { icon: <CheckCircle size={11} />, cls: 'text-emerald-400 bg-emerald-500/20' },
};

const PULSE_SEV_LABEL: Record<PulseEvent['severity'], string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Watch',
  info: 'AI Notice',
  ok: 'Resolved',
};

const PULSE_RESOLUTION_CHIPS: Record<PulseEvent['severity'], string[]> = {
  critical: ['Create emergency WO', 'Assign nearest certified tech', 'Notify supervisor', 'Client SLA update'],
  high: ['Open escalation task', 'Rebalance field team', 'Notify client ops', 'Start 60-min recovery timer'],
  medium: ['Schedule PPM slot', 'Attach asset checklist', 'Confirm parts availability', 'Watch SLA drift'],
  info: ['Convert to preventive WO', 'Keep AI watch active', 'Send proactive update', 'Log avoided failure'],
  ok: ['Close loop', 'Publish resolution note', 'Update KPI impact', 'Archive evidence'],
};

const PULSE_RESOLUTION_COPY: Record<PulseEvent['severity'], { impact: string; resolution: string; eta: string }> = {
  critical: {
    impact: 'Resident-impacting event with immediate SLA and safety exposure.',
    resolution: 'Create an emergency work order, dispatch certified response, keep supervisor escalation open, and notify the client with a recovery clock.',
    eta: '12 min dispatch / 90 min stabilization',
  },
  high: {
    impact: 'Operational risk is rising and may become contractual if unattended.',
    resolution: 'Open escalation, rebalance available field capacity, clear the oldest breach first, and keep client operations informed.',
    eta: '30 min triage / same-shift recovery',
  },
  medium: {
    impact: 'Preventive or compliance work is drifting toward SLA pressure.',
    resolution: 'Schedule the next service slot, attach the right checklist, confirm parts, and monitor for breach risk.',
    eta: 'Next available PPM window',
  },
  info: {
    impact: 'AI has found an early signal before it becomes a resident-facing issue.',
    resolution: 'Convert the signal into preventive action, keep the asset under watch, and log the avoided failure value.',
    eta: 'Preventive response planned',
  },
  ok: {
    impact: 'The event has been stabilized and is ready for closure evidence.',
    resolution: 'Publish the closure note, update KPI impact, archive evidence, and keep a lightweight watch on recurrence.',
    eta: 'Close-out ready',
  },
};

interface PulseCommandAction {
  label: string;
  owner: string;
  impact: string;
  channel: string;
}

interface PulseCommandPlan {
  decision: string;
  owner: string;
  deadline: string;
  exposure: string;
  ifIgnored: string;
  ifResolved: string;
  sourceTrace: string;
  evidence: string[];
  timeline: Array<{ label: string; value: string }>;
  actions: PulseCommandAction[];
  updateDraft: string;
}

function buildPulseCommandPlan(event: PulseEvent): PulseCommandPlan {
  const title = event.title.toLowerCase();
  const baseOwner = event.severity === 'critical' ? 'Duty Supervisor' : event.severity === 'ok' ? 'Account Manager' : 'Operations Lead';

  if (title.includes('technician shortage')) {
    return {
      decision: 'Reassign capacity now, clear the oldest breaches first, and protect emergency coverage while the recovery timer runs.',
      owner: 'Operations Lead',
      deadline: '15 min owner lock / 60 min backlog recovery',
      exposure: '9 overdue tasks could become SLA breaches in the same shift.',
      ifIgnored: 'Backlog spreads into resident complaints, missed response windows, and client escalation.',
      ifResolved: 'Oldest breaches clear first, SLA risk drops, and supervisors regain same-shift control.',
      sourceTrace: 'Based on overdue tasks, field load, property risk, and reassignment requirement',
      evidence: ['Reassignment log', 'Updated dispatch roster', 'Oldest-breach closure proof', 'Client ops update'],
      timeline: [
        { label: 'Next 15 min', value: 'Move two certified technicians from lower-risk sites and name the backlog owner.' },
        { label: 'Next 60 min', value: 'Clear the three oldest overdue tasks and keep one technician reserved for emergencies.' },
        { label: 'End of shift', value: 'Send recovery summary, remaining backlog, and tomorrow coverage plan.' },
      ],
      actions: [
        { label: 'Reassign 2 certified technicians', owner: 'Dispatch Lead', impact: 'Creates immediate field capacity for the overdue worklist.', channel: 'Dispatch' },
        { label: 'Clear 3 oldest breaches first', owner: 'Site Supervisor', impact: 'Targets the work most likely to become contractual exposure.', channel: 'Task' },
        { label: 'Call standby vendor for overflow', owner: 'Vendor Manager', impact: 'Adds backup capacity if internal recovery slips after 30 minutes.', channel: 'Calls' },
        { label: 'Notify client ops with recovery clock', owner: 'Account Manager', impact: 'Sets expectation before the client chases the update.', channel: 'Email' },
      ],
      updateDraft: `${event.client}: AI detected a field-capacity shortage affecting 9 overdue tasks. We are reassigning two certified technicians now, clearing the oldest breaches first, and will send a recovery status within 60 minutes.`,
    };
  }

  if (title.includes('lift fault') || title.includes('resident emergency')) {
    return {
      decision: 'Treat as resident-safety command: dispatch certified lift response, keep supervisor escalation open, and update residents/client with a recovery clock.',
      owner: 'Duty Supervisor',
      deadline: '12 min dispatch / 90 min stabilization',
      exposure: 'Resident safety, trapped-lift escalation, and SLA penalty exposure.',
      ifIgnored: 'Resident anxiety, emergency escalation, and client confidence deteriorate quickly.',
      ifResolved: 'Residents are stabilized, safety evidence is captured, and penalty exposure is reduced.',
      sourceTrace: 'Based on critical severity, resident impact, lift asset class, and escalation status',
      evidence: ['Emergency WO', 'Lift technician ETA', 'Resident welfare check', 'Close-out photos/report'],
      timeline: [
        { label: 'Now', value: 'Create emergency WO and dispatch the nearest certified lift technician.' },
        { label: 'Next 15 min', value: 'Confirm resident welfare and supervisor presence at the lift lobby.' },
        { label: 'After stabilization', value: 'Archive close-out evidence and send client/resident closure note.' },
      ],
      actions: [
        { label: 'Create emergency lift WO', owner: 'Command Center', impact: 'Starts the SLA clock and links evidence to the incident.', channel: 'WO' },
        { label: 'Dispatch certified lift technician', owner: 'Duty Supervisor', impact: 'Gets the right trade to site with visible ETA.', channel: 'Dispatch' },
        { label: 'Start resident welfare checks', owner: 'Resident Care Team', impact: 'Reduces safety anxiety while the technical team responds.', channel: 'Calls' },
        { label: 'Send client escalation update', owner: 'Account Manager', impact: 'Confirms owner, ETA, and next update time.', channel: 'Email' },
      ],
      updateDraft: `${event.client}: Lift incident is under emergency response. Certified lift technician dispatch is being prioritized, supervisor escalation remains open, and resident welfare checks are underway. Next update in 15 minutes.`,
    };
  }

  if (title.includes('sla breach cascade')) {
    return {
      decision: 'Open a mini command bridge, split jobs by resident impact, and assign one supervisor to remove blockers across all four jobs.',
      owner: 'Site Supervisor',
      deadline: '10 min triage / 45 min first closures',
      exposure: 'Four simultaneous jobs can tip the property into client-facing SLA breach.',
      ifIgnored: 'The workload compounds, residents receive inconsistent updates, and penalties become harder to defend.',
      ifResolved: 'The highest-impact jobs close first and the remaining work has owner, ETA, and evidence.',
      sourceTrace: 'Based on simultaneous active jobs, supervisor notification, SLA state, and resident impact',
      evidence: ['Job priority list', 'Supervisor assignment', 'Resident impact notes', 'Closure evidence'],
      timeline: [
        { label: 'Next 10 min', value: 'Rank the four jobs by resident impact and breach time.' },
        { label: 'Next 45 min', value: 'Close or stabilize the two highest-risk jobs.' },
        { label: 'End of shift', value: 'Send client summary showing closures, open blockers, and next ETAs.' },
      ],
      actions: [
        { label: 'Open SLA command bridge', owner: 'Operations Lead', impact: 'Creates one recovery lane for the four simultaneous jobs.', channel: 'Command' },
        { label: 'Rank jobs by breach clock', owner: 'DevelopmentX Copilot', impact: 'Makes the next action sequence obvious.', channel: 'AI Sort' },
        { label: 'Assign one supervisor owner', owner: 'FM Manager', impact: 'Stops the four jobs from being handled as separate noise.', channel: 'Task' },
        { label: 'Send resident impact update', owner: 'Community Manager', impact: 'Keeps affected floors informed while work is sequenced.', channel: 'Notice' },
      ],
      updateDraft: `${event.client}: Four jobs are being handled under a focused SLA bridge. We are ranking by resident impact and breach clock, with a supervisor owner assigned and first closures targeted within 45 minutes.`,
    };
  }

  if (title.includes('power bi') || title.includes('sync')) {
    return {
      decision: 'Restore the reporting token, mark dashboard figures as stale, and issue a temporary manual status until the feed is trusted again.',
      owner: 'IT Ops Lead',
      deadline: '20 min token fix / next report refresh',
      exposure: 'Leadership may act on stale reporting while live operations keep moving.',
      ifIgnored: 'Client reports lose trust and operational exceptions can be missed.',
      ifResolved: 'Dashboard confidence returns and manual updates cover the gap.',
      sourceTrace: 'Based on reporting gap, expired token, and IT Ops alert',
      evidence: ['Token refresh record', 'Last successful sync time', 'Manual status note', 'Data confidence note'],
      timeline: [
        { label: 'Next 20 min', value: 'Refresh token and validate the feed with one known live record.' },
        { label: 'Before next review', value: 'Tag affected dashboards as refreshed or stale.' },
        { label: 'After recovery', value: 'Log cause and expiry reminder to prevent repeat failure.' },
      ],
      actions: [
        { label: 'Refresh reporting token', owner: 'IT Ops Lead', impact: 'Restores the reporting feed needed for executive confidence.', channel: 'Integration' },
        { label: 'Publish temporary manual status', owner: 'Command Center', impact: 'Keeps decisions moving while automation is restored.', channel: 'Report' },
        { label: 'Flag stale dashboard tiles', owner: 'Analytics Lead', impact: 'Stops users from trusting old data silently.', channel: 'Data' },
        { label: 'Set token expiry watch', owner: 'DevelopmentX Copilot', impact: 'Prevents the same reporting gap from recurring.', channel: 'AI Watch' },
      ],
      updateDraft: `${event.client}: Reporting sync is temporarily degraded due to token expiry. IT Ops is restoring the feed, dashboard confidence will be refreshed after validation, and manual status will be used until sync is confirmed.`,
    };
  }

  if (title.includes('chiller') || title.includes('predictive')) {
    return {
      decision: 'Convert the AI signal into preventive work before it becomes resident-facing cooling disruption.',
      owner: 'Reliability Lead',
      deadline: 'Service slot within 6 days',
      exposure: 'Cooling performance could deteriorate if the refrigerant signal is left unplanned.',
      ifIgnored: 'Predictive warning becomes emergency HVAC work and resident sentiment drops.',
      ifResolved: 'Failure is avoided, downtime stays planned, and prevention value can be shown to the client.',
      sourceTrace: 'Based on IoT signal, refrigerant level, asset class, and service window',
      evidence: ['IoT trend snapshot', 'Preventive WO', 'Technician checklist', 'Avoided-failure note'],
      timeline: [
        { label: 'Today', value: 'Create preventive WO and reserve the right HVAC technician.' },
        { label: 'Before visit', value: 'Confirm parts and attach refrigerant checklist.' },
        { label: 'After service', value: 'Log avoided failure value and keep asset under watch.' },
      ],
      actions: [
        { label: 'Create preventive HVAC WO', owner: 'Reliability Lead', impact: 'Turns the AI signal into planned work before disruption.', channel: 'WO' },
        { label: 'Confirm parts and refrigerant', owner: 'Storekeeper', impact: 'Prevents wasted visit and repeat dispatch.', channel: 'Inventory' },
        { label: 'Assign HVAC specialist', owner: 'Dispatch Lead', impact: 'Matches skill to asset risk.', channel: 'Dispatch' },
        { label: 'Log avoided failure value', owner: 'Analytics Lead', impact: 'Captures the demo value of AI prevention.', channel: 'Report' },
      ],
      updateDraft: `${event.client}: AI detected an early HVAC risk signal. A preventive work order is being scheduled within the service window, with parts and technician skill matched before dispatch.`,
    };
  }

  if (title.includes('irrigation')) {
    return {
      decision: 'Convert overdue seasonal service into a compliance recovery task with checklist, parts, and site access confirmed.',
      owner: 'PPM Planner',
      deadline: 'Next PPM window',
      exposure: 'Compliance drift and landscape service complaints if the seasonal task remains overdue.',
      ifIgnored: 'A small planned task becomes a visible quality issue and weakens contract evidence.',
      ifResolved: 'PPM evidence is restored and the site returns to normal seasonal service cadence.',
      sourceTrace: 'Based on overdue seasonal service, district, and compliance risk',
      evidence: ['PPM checklist', 'Technician attendance', 'Before/after evidence', 'Compliance close-out'],
      timeline: [
        { label: 'Today', value: 'Book the PPM slot and confirm access.' },
        { label: 'Before visit', value: 'Attach seasonal checklist and confirm materials.' },
        { label: 'After visit', value: 'Archive before/after evidence and reset cadence.' },
      ],
      actions: [
        { label: 'Book seasonal PPM slot', owner: 'PPM Planner', impact: 'Moves overdue work into a visible service window.', channel: 'Calendar' },
        { label: 'Attach irrigation checklist', owner: 'QA Lead', impact: 'Ensures the visit closes with defensible evidence.', channel: 'Evidence' },
        { label: 'Confirm parts and access', owner: 'Site Supervisor', impact: 'Prevents failed visit or repeat dispatch.', channel: 'Task' },
        { label: 'Notify community manager', owner: 'Account Manager', impact: 'Prepares resident-facing messaging if landscape quality is visible.', channel: 'Message' },
      ],
      updateDraft: `${event.client}: Seasonal irrigation service is overdue and has been moved into a planned PPM recovery slot. Checklist, parts, and access confirmation are being attached before dispatch.`,
    };
  }

  if (title.includes('prevented') || event.severity === 'ok') {
    return {
      decision: 'Close the loop by turning the avoided issue into evidence, value reporting, and recurrence watch.',
      owner: 'Account Manager',
      deadline: 'Close-out ready',
      exposure: 'Prevention value is lost if not captured and shown to the client.',
      ifIgnored: 'The team does good work but cannot prove avoided disruption or avoided penalty value.',
      ifResolved: 'Client sees the prevention story and the same signal becomes a repeatable operating control.',
      sourceTrace: 'Based on AI prevention event, PPM dispatch, and closure status',
      evidence: ['Avoided-failure note', 'PPM work order', 'Asset history', 'Client value update'],
      timeline: [
        { label: 'Now', value: 'Attach avoided-failure evidence to the work order.' },
        { label: 'Today', value: 'Add prevention value to executive dashboard.' },
        { label: 'This week', value: 'Create recurrence watch for the same asset family.' },
      ],
      actions: [
        { label: 'Archive avoided-failure evidence', owner: 'QA Lead', impact: 'Makes the AI prevention claim defensible.', channel: 'Evidence' },
        { label: 'Publish client value note', owner: 'Account Manager', impact: 'Shows the client what was prevented and why it matters.', channel: 'Email' },
        { label: 'Create recurrence watch', owner: 'DevelopmentX Copilot', impact: 'Looks for the same pattern before it returns.', channel: 'AI Watch' },
        { label: 'Update KPI impact', owner: 'Analytics Lead', impact: 'Moves the prevention event into the value dashboard.', channel: 'Report' },
      ],
      updateDraft: `${event.client}: AI prevention action has stabilized the risk. Evidence is being archived, value impact will be logged, and the asset pattern will remain under watch.`,
    };
  }

  return {
    decision: PULSE_RESOLUTION_COPY[event.severity].resolution,
    owner: baseOwner,
    deadline: PULSE_RESOLUTION_COPY[event.severity].eta,
    exposure: PULSE_RESOLUTION_COPY[event.severity].impact,
    ifIgnored: event.severity === 'medium' ? 'The issue drifts into SLA pressure or compliance exposure.' : 'Operational pressure grows and becomes harder to recover inside the same shift.',
    ifResolved: 'The event moves from live risk into controlled recovery with owner, evidence, and next update.',
    sourceTrace: 'Based on event severity, affected property, SLA context, and live pulse signal',
    evidence: ['Owner assignment', 'Action timestamp', 'Client update', 'Close-out evidence'],
    timeline: [
      { label: 'Now', value: 'Confirm owner and assign the first response action.' },
      { label: 'Next update', value: 'Send status with ETA, blocker, and recovery path.' },
      { label: 'Close-out', value: 'Archive proof and update KPI impact.' },
    ],
    actions: PULSE_RESOLUTION_CHIPS[event.severity].map((chip, index) => ({
      label: chip,
      owner: index === 0 ? baseOwner : index === 1 ? 'Dispatch Lead' : index === 2 ? 'Account Manager' : 'QA Lead',
      impact: index === 0 ? 'Creates immediate ownership for the event.' : index === 1 ? 'Moves resources toward recovery.' : index === 2 ? 'Keeps stakeholders informed.' : 'Preserves evidence and audit trail.',
      channel: index === 0 ? 'Task' : index === 1 ? 'Dispatch' : index === 2 ? 'Message' : 'Evidence',
    })),
    updateDraft: `${event.client}: ${event.title}. ${PULSE_RESOLUTION_COPY[event.severity].resolution} Next update will confirm owner, ETA, and evidence status.`,
  };
}

const SIMULATION_EVENTS: PulseEvent[] = [
  { id: 'sim-1', client: 'JLT North Cluster', title: 'Resident emergency raised from Tower 5 lift lobby', sub: 'AI triage classifies Critical - lift safety', time: 'Live step 1', severity: 'critical' },
  { id: 'sim-2', client: 'JLT North Cluster', title: 'AI creates work order WO-LIFT-8842', sub: 'Parts, lift console, and supervisor approval linked', time: 'Live step 2', severity: 'high' },
  { id: 'sim-3', client: 'JLT North Cluster', title: 'Technician reassigned from Dubai Silicon Oasis', sub: 'ETA reduced from 31 min to 12 min', time: 'Live step 3', severity: 'info' },
  { id: 'sim-4', client: 'JLT North Cluster', title: 'Client notified and SLA timer stabilized', sub: 'Penalty exposure reduced by AED 18K', time: 'Live step 4', severity: 'ok' },
];

function getCommandProfile(client: PortfolioClient) {
  const atRisk = Math.max(0, client.incidents * 18000 + client.overdueTasks * 6500 + Math.max(0, 90 - client.sla) * 4000);
  const prevented = client.riskLevel === 'low' ? 42000 + client.sites * 2800 : Math.max(22000, client.workOrders * 420);
  const sentiment = client.sla >= 95 ? 94 : client.sla >= 90 ? 88 : client.sla >= 80 ? 74 : 58;
  const utilization = Math.min(98, Math.max(42, Math.round(client.workOrders / Math.max(client.sites, 1) * 7 + client.incidents * 3)));
  const coverage = client.dataSources.length === 0 ? 34 : Math.min(98, 54 + client.dataSources.length * 13 + (client.dataSources.some(ds => ds.count === 0) ? -18 : 0));
  const firstDue = client.dataSources.length === 0 ? 'First PPM schedule due in 6 days' : client.overdueTasks > 0 ? `${client.overdueTasks} overdue actions need dispatch review` : 'Next PPM batch on track';

  const narrative =
    client.riskLevel === 'critical'
      ? `${client.name} is deteriorating because overdue tasks, resident-impacting incidents, and SLA pressure are converging. Recommend moving two engineers into the cluster today and keeping supervisor escalation open until the lift safety work is cleared.`
      : client.riskLevel === 'high'
        ? `${client.name} needs intervention because reporting gaps and simultaneous job pressure are masking real SLA exposure. Recommend restoring data sync, assigning one senior supervisor, and closing the oldest open breaches first.`
        : client.dataSources.length === 0
          ? `${client.name} is healthy but still in onboarding. The right move is to connect core data feeds, publish the first PPM calendar, and capture baseline service quality before the first monthly review.`
          : `${client.name} is stable and suitable for proactive operations. Keep the AI prevention loop active, maintain data coverage, and use spare capacity to absorb risk from weaker properties.`;

  const actions =
    client.riskLevel === 'critical'
      ? ['Reassign 2 certified engineers before noon', 'Escalate lift checks to supervisor command', 'Notify client with 90-minute recovery plan']
      : client.riskLevel === 'high'
        ? ['Restore Power BI token and data sync', 'Clear 3 oldest SLA breaches', 'Move one field supervisor to Tower A']
        : client.dataSources.length === 0
          ? ['Connect Maximo or BMS data source', 'Publish first PPM calendar', 'Run onboarding health audit']
          : ['Keep predictive PPM active', 'Review next asset-risk batch', 'Offer spare capacity to JLT escalation'];

  return { atRisk, prevented, sentiment, utilization, coverage, firstDue, narrative, actions };
}

function buildStaffEfficiencyItems(clients: PortfolioClient[]): StaffEfficiencyItem[] {
  return clients
    .map(client => {
      const technicianCount = client.people.technicians.length;
      const supervisorCount = client.people.supervisors.length;
      const jobsPerTech = technicianCount > 0 ? client.workOrders / technicianCount : client.workOrders;
      const routeLoad = client.workOrders / Math.max(client.sites, 1);
      const urgency: StaffEfficiencyItem['urgency'] =
        client.overdueTasks > 6 || client.sla < 75
          ? 'critical'
          : client.overdueTasks > 2 || client.incidents > 5 || jobsPerTech > 20
            ? 'high'
            : client.workOrders > 20 || supervisorCount === 0
              ? 'medium'
              : 'low';
      const baseMinutes = Math.round(
        25
        + client.overdueTasks * 18
        + client.incidents * 12
        + Math.max(0, jobsPerTech - 8) * 7
        + Math.max(0, routeLoad - 4) * 5
        + (supervisorCount === 0 ? 35 : 0),
      );

      const action =
        client.overdueTasks > 5 || jobsPerTech > 24
          ? {
              actionLabel: 'Rebalance technicians',
              outcomeLabel: 'Technicians rebalanced',
              owner: 'Dispatch Lead',
              channel: 'Dispatch',
              bottleneck: `${client.overdueTasks} overdue tasks with ${technicianCount || 'no'} mapped technician${technicianCount === 1 ? '' : 's'}`,
              staffImpact: 'Moves capacity to the oldest work first and reduces repeat supervisor chasing.',
              deadline: 'Today',
            }
          : supervisorCount === 0 || client.incidents > 4
            ? {
                actionLabel: 'Assign supervisor',
                outcomeLabel: 'Supervisor assigned',
                owner: 'Operations Lead',
                channel: 'Task',
                bottleneck: `${client.incidents} incidents need named owner coverage`,
                staffImpact: 'Gives technicians one escalation path and stops work from bouncing between teams.',
                deadline: client.incidents > 4 ? 'Next 60 min' : 'Today',
              }
            : client.workOrders > 45
              ? {
                  actionLabel: 'Bundle overdue jobs',
                  outcomeLabel: 'Jobs bundled',
                  owner: 'Site Supervisor',
                  channel: 'Roster',
                  bottleneck: `${client.workOrders} active work orders are split across ${client.sites} sites`,
                  staffImpact: 'Groups nearby work so field teams spend less time switching context and routes.',
                  deadline: 'Next shift',
                }
              : client.dataSources.length === 0
                ? {
                    actionLabel: 'Prepare shift handover',
                    outcomeLabel: 'Handover prepared',
                    owner: 'Property Manager',
                    channel: 'Meeting',
                    bottleneck: 'New property still needs a clean operating handover',
                    staffImpact: 'Packages the first PPM, site list, and owner notes before staff start chasing gaps.',
                    deadline: 'This week',
                  }
                : {
                    actionLabel: 'Draft client update',
                    outcomeLabel: 'Client update drafted',
                    owner: 'Account Manager',
                    channel: 'Email',
                    bottleneck: `${client.sla}% SLA with ${client.workOrders} active work orders to summarize`,
                    staffImpact: 'Drafts the operational update so managers are not rebuilding the same status note.',
                    deadline: 'This week',
                  };

      return {
        id: client.id,
        client: client.name,
        bottleneck: action.bottleneck,
        staffImpact: action.staffImpact,
        timeSavedMinutes: Math.max(20, baseMinutes),
        owner: action.owner,
        deadline: action.deadline,
        actionLabel: action.actionLabel,
        outcomeLabel: action.outcomeLabel,
        channel: action.channel,
        urgency,
      };
    })
    .sort((a, b) => b.timeSavedMinutes - a.timeSavedMinutes);
}

function formatAed(value: number) {
  if (value >= 1000000) return `AED ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `AED ${Math.round(value / 1000)}K`;
  return `AED ${value}`;
}

function formatStaffTime(minutes: number) {
  if (minutes >= 60) return `${Math.round(minutes / 60)} hrs freed`;
  return `${minutes} min freed`;
}

async function shareCommandCard(title: string, body: string, onToast: ToastFn) {
  const text = `${title}\n${body}`;
  const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };

  try {
    if (nav.share) {
      await nav.share({ title, text });
      onToast(`${title}: share opened`, 'success');
      return;
    }
    await navigator.clipboard.writeText(text);
    onToast(`${title}: share summary copied`, 'success');
  } catch {
    try {
      await navigator.clipboard.writeText(text);
      onToast(`${title}: share summary copied`, 'success');
    } catch {
      onToast(`${title}: share summary is ready in the card`, 'warning');
    }
  }
}

type PortfolioKpiKey = 'properties' | 'sites' | 'workOrders' | 'incidents' | 'sla' | 'dataSources';
type PortfolioStatusKey = 'critical' | 'warning' | 'live';
type ExecutiveImpactKey = 'aedRisk' | 'workloadOptimizer' | 'residentSentiment' | 'adminLoadReducer' | 'technicianUtilization';

interface PortfolioKpi {
  key: PortfolioKpiKey;
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  bg: string;
  summary: string;
  detailRows: Array<{ label: string; value: string; tone: string }>;
  chips: string[];
  commandAnswer: string;
  nextBestAction: string;
  ifIgnored: string;
  sourceTrace: string;
  focusRows: Array<{ label: string; value: string; detail: string; action: string; tone: string }>;
  actions: Array<{ label: string; owner: string; impact: string; channel: string }>;
}

interface PortfolioStatusSummary {
  key: PortfolioStatusKey;
  label: string;
  count: number;
  clients: PortfolioClient[];
  color: string;
  bg: string;
  icon: React.ReactNode;
  summary: string;
  chips: string[];
}

interface ExecutiveAction {
  label: string;
  owner: string;
  impact: string;
  channel: string;
}

interface CustomPlanAction extends ExecutiveAction {
  custom: true;
}

type ActionPlanStatus = 'Ready' | 'Needs approval' | 'Draft prepared' | 'Assigned';

interface ActionPlanItem {
  id: string;
  title: string;
  owner: string;
  channel: string;
  group: string;
  impact: string;
  status: ActionPlanStatus;
}

interface ActionPlanReceipt {
  title: string;
  items: ActionPlanItem[];
  nextUpdate: string;
  createdAt: string;
}

type ManagedActionStatus = 'Draft prepared' | 'Ready to assign' | 'Needs approval' | 'Scheduled draft' | 'Watching';

interface ManagedActionArtifact {
  type: string;
  title: string;
  body: string;
}

interface ManagedActionQuickCommand {
  label: string;
  status: ManagedActionStatus;
  toast: string;
  copyText?: string;
  share?: boolean;
}

interface ManagedActionDetail {
  audience: string;
  sender: string;
  dueBy: string;
  artifact: ManagedActionArtifact;
  checklist: string[];
  quickCommands: ManagedActionQuickCommand[];
}

interface ManagedAction {
  id: string;
  title: string;
  owner: string;
  channel: string;
  group: string;
  impact: string;
  status: ManagedActionStatus;
  detail: ManagedActionDetail;
}

interface StaffEfficiencyItem {
  id: string;
  client: string;
  bottleneck: string;
  staffImpact: string;
  timeSavedMinutes: number;
  deadline: string;
  owner: string;
  actionLabel: string;
  outcomeLabel: string;
  channel: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
}

interface ExecutiveImpactCard {
  key: ExecutiveImpactKey;
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  tone: string;
  summary: string;
  trigger: string;
  recommended: string;
  actions: ExecutiveAction[];
}

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function actionPlanGroup(channel: string): string {
  const normalized = channel.toLowerCase();
  if (['dispatch', 'wo', 'ppm', 'task', 'command', 'roster', 'inspection', 'evidence', 'report'].some(item => normalized.includes(item))) return 'Dispatch';
  if (normalized.includes('approval')) return 'Approval';
  if (normalized.includes('call')) return 'Calls';
  if (normalized.includes('meeting')) return 'Meeting';
  if (['email', 'notice', 'message'].some(item => normalized.includes(item))) return 'Email / Notice';
  if (normalized.includes('ai')) return 'AI Watch';
  if (normalized.includes('custom')) return 'Custom';
  return channel;
}

function actionPlanStatus(channel: string, custom = false): ActionPlanStatus {
  const group = custom ? 'Custom' : actionPlanGroup(channel);
  if (group === 'Approval') return 'Needs approval';
  if (group === 'Calls' || group === 'Meeting' || group === 'Email / Notice') return 'Draft prepared';
  if (group === 'Custom') return 'Ready';
  return 'Ready';
}

function createActionPlanItem(action: ExecutiveAction, index: number, custom = false): ActionPlanItem {
  return {
    id: `${custom ? 'custom' : 'action'}-${index}-${action.label}`,
    title: action.label,
    owner: action.owner,
    channel: action.channel,
    group: actionPlanGroup(action.channel),
    impact: action.impact,
    status: actionPlanStatus(action.channel, custom),
  };
}

function buildActionPlanText(receipt: ActionPlanReceipt): string {
  const lines = receipt.items.map(item => `- ${item.title} | ${item.owner} | ${item.channel} | ${item.status}`);
  return `${receipt.title}\n${receipt.items.length} action${receipt.items.length === 1 ? '' : 's'}\nNext update: ${receipt.nextUpdate}\n${lines.join('\n')}`;
}

function actionPlanButtonLabel(count: number): string {
  return count === 1 ? 'Create Action' : 'Create Action Plan';
}

function managedActionInitialStatus(channel: string, custom = false): ManagedActionStatus {
  if (custom) return 'Ready to assign';
  const group = actionPlanGroup(channel);
  if (group === 'Approval') return 'Needs approval';
  if (group === 'Calls' || group === 'Meeting') return 'Scheduled draft';
  if (group === 'Email / Notice') return 'Draft prepared';
  if (group === 'AI Watch') return 'Watching';
  return 'Ready to assign';
}

function managedStatusClass(status: ManagedActionStatus): string {
  if (status === 'Needs approval') return 'border-amber-400/25 bg-amber-400/10 text-amber-200';
  if (status === 'Draft prepared') return 'border-cyan-400/25 bg-cyan-400/10 text-cyan-200';
  if (status === 'Scheduled draft') return 'border-violet-400/25 bg-violet-400/10 text-violet-200';
  if (status === 'Watching') return 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200';
  return 'border-blue-400/25 bg-blue-400/10 text-blue-200';
}

function managedActionText(title: string, detail: ManagedActionDetail): string {
  return [
    title,
    `Owner/Sender: ${detail.sender}`,
    `Audience: ${detail.audience}`,
    `Due: ${detail.dueBy}`,
    '',
    `${detail.artifact.type}: ${detail.artifact.title}`,
    detail.artifact.body,
    '',
    'Checklist:',
    ...detail.checklist.map(item => `- ${item}`),
  ].join('\n');
}

const RESIDENT_SENTIMENT_ACTION_DETAILS: Record<string, Omit<ManagedActionDetail, 'quickCommands'>> = {
  'Send email to affected residents': {
    audience: 'Residents with open or late service requests, repeat complaint households, and affected floors in the selected property cluster.',
    sender: 'Community Manager',
    dueBy: 'Draft ready in 15 min, resident update before 5:00 PM',
    artifact: {
      type: 'Email draft',
      title: 'Service update and recovery timeline',
      body: [
        'Subject: Service update and recovery timeline',
        '',
        'Dear Resident,',
        '',
        'We are writing to acknowledge the current service delays affecting your building and to share the recovery path now in progress.',
        '',
        'Our operations team is prioritizing the oldest open requests, confirming technician availability, and publishing the next service update today. Your request remains visible to the community management team until it is closed with evidence.',
        '',
        'Next update: Today at 5:00 PM.',
        'Contact: Community Management Desk.',
        '',
        'Thank you for your patience while the recovery actions are completed.',
      ].join('\n'),
    },
    checklist: [
      'Confirm affected resident segment from open service requests.',
      'Check legal/client wording before release.',
      'Attach recovery timeline or service window if available.',
      'Log the sent draft as resident communication evidence.',
    ],
  },
  'Hold resident meeting': {
    audience: 'Resident committee, high-impact households, Property Manager, Community Manager, and Operations Lead.',
    sender: 'Property Manager',
    dueBy: 'Invite draft ready today, meeting window within 48 hours',
    artifact: {
      type: 'Meeting agenda',
      title: 'Resident recovery briefing',
      body: [
        'Agenda',
        '1. Current service recovery status.',
        '2. Root causes behind delays or repeated complaints.',
        '3. Recovery timeline and named owners.',
        '4. Resident questions and priority cases.',
        '5. Next written update and follow-up channel.',
      ].join('\n'),
    },
    checklist: [
      'Confirm room or video link.',
      'Add resident committee and priority residents.',
      'Bring latest SLA, incident, and recovery data.',
      'Capture minutes and agreed actions.',
    ],
  },
  'Make priority follow-up calls': {
    audience: 'Residents with repeated complaints, escalated service requests, or unresolved resident-facing incidents.',
    sender: 'Resident Care Team',
    dueBy: 'Call list ready in 10 min, first calls before end of shift',
    artifact: {
      type: 'Call script',
      title: 'Priority resident follow-up',
      body: [
        'Opening: We are calling because your service request is marked as priority in our recovery plan.',
        'Confirm: Can we confirm the issue is still affecting you and the best access window?',
        'Explain: The operations team is working through a recovery sequence and your case is assigned for follow-up.',
        'Commit: We will update you by the agreed time even if the fix is still in progress.',
        'Close: Is there anything else linked to this issue we should capture now?',
      ].join('\n'),
    },
    checklist: [
      'Pull priority residents from overdue and repeat-request list.',
      'Confirm preferred language and contact number.',
      'Record call outcome against each resident case.',
      'Escalate unresolved access or safety issues.',
    ],
  },
  'Publish service recovery timeline': {
    audience: 'Affected residents, front desk, community management, and property operations.',
    sender: 'Operations Lead',
    dueBy: 'Timeline draft ready in 20 min, publish after manager review',
    artifact: {
      type: 'Notice timeline',
      title: 'Resident-facing service recovery timeline',
      body: [
        'Recovery timeline',
        'Now: Oldest resident-impacting cases are being triaged.',
        'Today: Technician capacity is rebalanced to affected properties.',
        'By 5:00 PM: Residents receive the next written update.',
        'Tomorrow: Remaining open items are reviewed with evidence and owner accountability.',
      ].join('\n'),
    },
    checklist: [
      'Confirm dates and times with operations.',
      'Remove internal-only comments before publishing.',
      'Align front desk script with the notice.',
      'Attach timeline to resident communication evidence.',
    ],
  },
  'Create sentiment watch list': {
    audience: 'DevelopmentX Copilot, Community Manager, Resident Care Team, and Operations Lead.',
    sender: 'DevelopmentX Copilot',
    dueBy: 'Watch active for the next 7 days',
    artifact: {
      type: 'Watch rule',
      title: 'Resident sentiment watch list',
      body: [
        'Watch duration: 7 days.',
        'Trigger if any resident has 2+ negative contacts in 72 hours.',
        'Trigger if an escalated request remains open after the promised update time.',
        'Trigger if sentiment drops below 82% for the property cluster.',
        'Escalate to Community Manager and Operations Lead with linked cases.',
      ].join('\n'),
    },
    checklist: [
      'Track repeat complaints and unresolved high-priority requests.',
      'Include open SLA breaches that affect residents.',
      'Send daily watch summary to the owner group.',
      'Close watch only after sentiment stabilizes for 48 hours.',
    ],
  },
};

function fallbackManagedActionDetail(action: ExecutiveAction, card: ExecutiveImpactCard, custom: boolean): Omit<ManagedActionDetail, 'quickCommands'> {
  const group = custom ? 'Custom' : actionPlanGroup(action.channel);
  if (group === 'Calls') {
    return {
      audience: 'Priority contacts linked to this portfolio signal.',
      sender: action.owner,
      dueBy: 'Call plan ready this shift',
      artifact: {
        type: 'Call script',
        title: action.label,
        body: `Use the ${card.label} signal to explain the current issue, confirm impact, capture commitments, and log the outcome for manager review.`,
      },
      checklist: ['Confirm contact list.', 'Use approved call notes.', 'Capture outcome and owner.', 'Escalate unresolved blockers.'],
    };
  }
  if (group === 'Meeting') {
    return {
      audience: 'Named owners, client stakeholders, and operational leads linked to this signal.',
      sender: action.owner,
      dueBy: 'Meeting invite draft ready today',
      artifact: {
        type: 'Meeting agenda',
        title: action.label,
        body: `Agenda: review the ${card.label} trigger, agree owners, confirm timeline, and capture the next update commitment.`,
      },
      checklist: ['Confirm attendees.', 'Attach latest signal data.', 'Capture decisions.', 'Record follow-up owner.'],
    };
  }
  if (group === 'Approval') {
    return {
      audience: 'Approver, portfolio lead, and accountable owner.',
      sender: action.owner,
      dueBy: 'Approval brief ready for manager review',
      artifact: {
        type: 'Approval brief',
        title: action.label,
        body: `Decision required: approve the recommended response to the ${card.label} signal. Expected impact: ${action.impact}`,
      },
      checklist: ['State decision required.', 'Attach impact and risk.', 'Name owner and deadline.', 'Track approval status.'],
    };
  }
  if (group === 'AI Watch') {
    return {
      audience: 'DevelopmentX Copilot and the assigned owner group.',
      sender: action.owner,
      dueBy: 'Watch rule ready now',
      artifact: {
        type: 'Watch rule',
        title: action.label,
        body: `Monitor ${card.label} until the signal stabilizes. Trigger a manager alert if the metric deteriorates or the next update is missed.`,
      },
      checklist: ['Confirm trigger threshold.', 'Confirm owner group.', 'Define next review time.', 'Attach source signal.'],
    };
  }
  return {
    audience: group === 'Custom' ? 'Manager-selected owner group.' : 'Operational owner group tied to this signal.',
    sender: action.owner,
    dueBy: group === 'Custom' ? 'Ready for manager timing' : 'Ready for next command check-in',
    artifact: {
      type: group === 'Email / Notice' ? 'Message draft' : 'Action brief',
      title: action.label,
      body: `${action.label}\n\nReason: ${card.trigger}\n\nExpected impact: ${action.impact}\n\nNext step: ${action.owner} reviews and marks this action ready before external execution.`,
    },
    checklist: ['Confirm owner.', 'Confirm affected audience.', 'Attach source signal.', 'Mark ready after manager review.'],
  };
}

function managedActionQuickCommands(action: ExecutiveAction, detail: ManagedActionDetail, custom = false): ManagedActionQuickCommand[] {
  const text = managedActionText(action.label, detail);
  if (custom) {
    return [
      { label: 'Copy Brief', status: 'Ready to assign', toast: `${action.label}: custom action brief copied`, copyText: text },
      { label: 'Mark Ready', status: 'Ready to assign', toast: `${action.label}: custom action marked ready` },
      { label: 'Share Action', status: 'Ready to assign', toast: `${action.label}: custom action share sheet opened`, copyText: text, share: true },
    ];
  }

  const group = actionPlanGroup(action.channel);
  if (group === 'Calls') {
    return [
      { label: 'Copy Script', status: 'Scheduled draft', toast: `${action.label}: call script copied`, copyText: text },
      { label: 'Mark Calls Scheduled', status: 'Scheduled draft', toast: `${action.label}: calls marked as scheduled draft` },
      { label: 'Share Script', status: 'Scheduled draft', toast: `${action.label}: call script share sheet opened`, copyText: text, share: true },
    ];
  }
  if (group === 'Meeting') {
    return [
      { label: 'Copy Agenda', status: 'Scheduled draft', toast: `${action.label}: meeting agenda copied`, copyText: text },
      { label: 'Prepare Invite', status: 'Scheduled draft', toast: `${action.label}: meeting invite draft prepared` },
      { label: 'Mark Ready', status: 'Ready to assign', toast: `${action.label}: meeting action marked ready` },
    ];
  }
  if (group === 'Email / Notice') {
    const notice = action.channel.toLowerCase().includes('notice');
    return [
      { label: notice ? 'Copy Timeline' : 'Copy Draft', status: 'Draft prepared', toast: `${action.label}: draft copied`, copyText: text },
      { label: notice ? 'Mark Notice Ready' : 'Mark Ready', status: 'Ready to assign', toast: `${action.label}: marked ready for manager review` },
      { label: notice ? 'Share Timeline' : 'Share Draft', status: 'Draft prepared', toast: `${action.label}: draft share sheet opened`, copyText: text, share: true },
    ];
  }
  if (group === 'AI Watch') {
    return [
      { label: 'Copy Watch Rules', status: 'Watching', toast: `${action.label}: watch rules copied`, copyText: text },
      { label: 'Activate Demo Watch', status: 'Watching', toast: `${action.label}: demo watch is active` },
      { label: 'Share Rules', status: 'Watching', toast: `${action.label}: watch rules share sheet opened`, copyText: text, share: true },
    ];
  }
  if (group === 'Approval') {
    return [
      { label: 'Copy Brief', status: 'Needs approval', toast: `${action.label}: approval brief copied`, copyText: text },
      { label: 'Mark Needs Approval', status: 'Needs approval', toast: `${action.label}: approval dependency recorded` },
      { label: 'Share Brief', status: 'Needs approval', toast: `${action.label}: approval brief share sheet opened`, copyText: text, share: true },
    ];
  }
  return [
    { label: 'Copy Brief', status: 'Ready to assign', toast: `${action.label}: action brief copied`, copyText: text },
    { label: 'Mark Ready', status: 'Ready to assign', toast: `${action.label}: marked ready for manager review` },
    { label: 'Share Action', status: 'Ready to assign', toast: `${action.label}: action share sheet opened`, copyText: text, share: true },
  ];
}

function buildManagedAction(action: ExecutiveAction, index: number, card: ExecutiveImpactCard, custom = false): ManagedAction {
  const baseDetail = card.key === 'residentSentiment' && RESIDENT_SENTIMENT_ACTION_DETAILS[action.label]
    ? RESIDENT_SENTIMENT_ACTION_DETAILS[action.label]
    : fallbackManagedActionDetail(action, card, custom);
  const detail: ManagedActionDetail = {
    ...baseDetail,
    quickCommands: [],
  };
  detail.quickCommands = managedActionQuickCommands(action, detail, custom);
  return {
    id: `${custom ? 'custom' : card.key}-${index}-${action.label}`,
    title: action.label,
    owner: action.owner,
    channel: action.channel,
    group: custom ? 'Custom' : actionPlanGroup(action.channel),
    impact: action.impact,
    status: managedActionInitialStatus(action.channel, custom),
    detail,
  };
}

function buildManagedPlanText(title: string, actions: ManagedAction[], nextUpdate: string): string {
  const actionLines = actions.map(action => [
    `- ${action.title}`,
    `  Owner: ${action.owner}`,
    `  Channel: ${action.channel}`,
    `  Status: ${action.status}`,
    `  Audience: ${action.detail.audience}`,
    `  Due: ${action.detail.dueBy}`,
  ].join('\n'));
  return `${title}\n${actions.length} action${actions.length === 1 ? '' : 's'}\nNext update: ${nextUpdate}\n\n${actionLines.join('\n\n')}`;
}

function ActionPlanWorkbench({
  title,
  actions,
  activeActionId,
  nextUpdate,
  onSelectAction,
  onUpdateActionStatus,
  onToast,
}: {
  title: string;
  actions: ManagedAction[];
  activeActionId: string | null;
  nextUpdate: string;
  onSelectAction: (id: string) => void;
  onUpdateActionStatus: (id: string, status: ManagedActionStatus) => void;
  onToast: ToastFn;
}) {
  const activeAction = actions.find(action => action.id === activeActionId) ?? actions[0];
  const owners = new Set(actions.map(action => action.owner));
  const channels = new Set(actions.map(action => action.channel));
  const groupedActions = actions.reduce<Record<string, ManagedAction[]>>((acc, action) => {
    acc[action.group] = [...(acc[action.group] ?? []), action];
    return acc;
  }, {});

  const runQuickCommand = async (action: ManagedAction, command: ManagedActionQuickCommand) => {
    if (command.copyText && command.share) {
      void shareCommandCard(action.title, command.copyText, onToast);
    } else if (command.copyText) {
      try {
        await navigator.clipboard.writeText(command.copyText);
      } catch {
        onToast('Prepared content is visible for manual copy', 'warning');
      }
    }
    onUpdateActionStatus(action.id, command.status);
    onToast(command.toast, 'success');
  };

  if (!activeAction) return null;

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-200">
              <CheckCircle size={12} />
              Action Plan Workbench
            </div>
            <div className="text-[12px] font-bold text-[#EEF3FA]">{title}</div>
            <div className="mt-1 text-[10px] leading-relaxed text-[#9CB1CC]">
              {actions.length} action{actions.length === 1 ? '' : 's'} across {owners.size} owner{owners.size === 1 ? '' : 's'} and {channels.size} channel{channels.size === 1 ? '' : 's'}. Next update: {nextUpdate}.
            </div>
          </div>
          <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1.5 text-[10px] font-bold text-emerald-100">
            Drafts only
          </div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-2">
          {Object.entries(groupedActions).map(([group, items]) => (
            <div key={group} className="rounded-xl border border-[rgba(46,127,255,0.12)] bg-[#07111F] p-3">
              <div className="mb-2 text-[9px] font-bold uppercase tracking-wide text-[#8DBDFF]">{group}</div>
              <div className="space-y-1.5">
                {items.map(action => {
                  const active = action.id === activeAction.id;
                  return (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => onSelectAction(action.id)}
                      className={`w-full rounded-lg border px-2.5 py-2 text-left transition-all ${
                        active
                          ? 'border-[#2E7FFF]/65 bg-[#2E7FFF]/18 shadow-[0_0_14px_rgba(46,127,255,0.15)]'
                          : 'border-[rgba(46,127,255,0.08)] bg-[#0A1628] hover:border-[#2E7FFF]/35 hover:bg-[#102544]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold leading-snug text-[#EEF3FA]">{action.title}</div>
                          <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#6F89AA]">{action.owner} - {action.channel}</div>
                        </div>
                        <span className={`shrink-0 rounded-md border px-2 py-0.5 text-[8px] font-bold ${managedStatusClass(action.status)}`}>
                          {action.status}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#07111F] p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-wide text-[#7A94B4]">{activeAction.detail.artifact.type}</div>
              <h4 className="mt-1 text-[13px] font-black leading-tight text-[#EEF3FA]">{activeAction.title}</h4>
              <p className="mt-1 text-[10px] leading-relaxed text-[#8EA7C7]">{activeAction.impact}</p>
            </div>
            <span className={`rounded-md border px-2 py-1 text-[9px] font-bold ${managedStatusClass(activeAction.status)}`}>
              {activeAction.status}
            </span>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {[
              { label: 'Who', value: activeAction.detail.audience },
              { label: 'Owner', value: activeAction.detail.sender },
              { label: 'Due', value: activeAction.detail.dueBy },
            ].map(item => (
              <div key={item.label} className="rounded-lg border border-[rgba(46,127,255,0.10)] bg-[#0A1628] p-2.5">
                <div className="text-[8px] font-bold uppercase tracking-wide text-[#7A94B4]">{item.label}</div>
                <div className="mt-1 text-[10px] font-semibold leading-snug text-[#D8E7FA]">{item.value}</div>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-xl border border-[#2E7FFF]/20 bg-[#102544] p-3">
            <div className="mb-2 text-[9px] font-bold uppercase tracking-wide text-[#8DBDFF]">Ready next clicks</div>
            <div className="flex flex-wrap gap-2">
              {activeAction.detail.quickCommands.map(command => (
                <button
                  key={command.label}
                  type="button"
                  onClick={() => void runQuickCommand(activeAction, command)}
                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-[#2E7FFF]/30 bg-[#2E7FFF]/12 px-3 py-2 text-[10px] font-bold text-[#BFD8FF] transition-colors hover:bg-[#2E7FFF]/18"
                >
                  {command.share ? <Share2 size={11} /> : command.copyText ? <FileText size={11} /> : <Check size={11} />}
                  {command.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-3">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-cyan-200">
              <FileText size={12} />
              {activeAction.detail.artifact.title}
            </div>
            <div className="max-h-72 overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-[rgba(46,127,255,0.10)] bg-[#050C17] p-3 font-sans text-[12px] leading-6 text-[#D8E7FA] custom-scrollbar">
              {activeAction.detail.artifact.body}
            </div>
          </div>

          <div className="mt-4">
            <div className="rounded-xl border border-[rgba(46,127,255,0.12)] bg-[#0A1628] p-3">
              <div className="mb-2 text-[9px] font-bold uppercase tracking-wide text-[#8DBDFF]">Manager checklist</div>
              <div className="space-y-2">
                {activeAction.detail.checklist.map(item => (
                  <div key={item} className="flex items-start gap-2 rounded-lg bg-white/[0.02] px-2.5 py-2 text-[11px] leading-relaxed text-[#C8D8EE]">
                    <Check size={11} className="mt-0.5 shrink-0 text-emerald-300" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionPlanReceiptCard({
  receipt,
  onClose,
  onToast,
}: {
  receipt: ActionPlanReceipt;
  onClose: () => void;
  onToast: ToastFn;
}) {
  const owners = new Set(receipt.items.map(item => item.owner));
  const channels = new Set(receipt.items.map(item => item.channel));
  const groupedItems = receipt.items.reduce<Record<string, ActionPlanItem[]>>((acc, item) => {
    acc[item.group] = [...(acc[item.group] ?? []), item];
    return acc;
  }, {});

  const copyPlan = async () => {
    try {
      await navigator.clipboard.writeText(buildActionPlanText(receipt));
      onToast(`${receipt.title}: action plan copied`, 'success');
    } catch {
      onToast('Action plan is visible for manual copy', 'warning');
    }
  };

  const sharePlan = () => {
    void shareCommandCard(receipt.title, buildActionPlanText(receipt), onToast);
  };

  const openPlan = () => {
    onToast(`${receipt.title}: action plan ready for manager review`, 'info');
  };

  return (
    <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-200">
            <CheckCircle size={12} />
            Action Plan Created
          </div>
          <div className="text-[12px] font-bold text-[#EEF3FA]">{receipt.title}</div>
          <div className="mt-1 text-[10px] leading-relaxed text-[#9CB1CC]">
            {receipt.items.length} action{receipt.items.length === 1 ? '' : 's'} across {owners.size} owner{owners.size === 1 ? '' : 's'} and {channels.size} channel{channels.size === 1 ? '' : 's'}. Next update: {receipt.nextUpdate}.
          </div>
        </div>
        <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1.5 text-[10px] font-bold text-emerald-100">
          Demo-safe draft
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {Object.entries(groupedItems).map(([group, items]) => (
          <div key={group} className="rounded-xl border border-[rgba(46,127,255,0.12)] bg-[#07111F] p-3">
            <div className="mb-2 text-[9px] font-bold uppercase tracking-wide text-[#8DBDFF]">{group}</div>
            <div className="space-y-1.5">
              {items.map(item => (
                <div key={item.id} className="grid gap-2 rounded-lg border border-[rgba(46,127,255,0.08)] bg-[#0A1628] px-2.5 py-2 md:grid-cols-[1fr_auto] md:items-center">
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-[#EEF3FA]">{item.title}</div>
                    <div className="mt-0.5 text-[10px] leading-relaxed text-[#8EA7C7]">{item.impact}</div>
                    <div className="mt-1 text-[9px] font-semibold uppercase tracking-wide text-[#6F89AA]">Owner: {item.owner} · Channel: {item.channel}</div>
                  </div>
                  <span className={`rounded-md border px-2 py-1 text-[9px] font-bold ${
                    item.status === 'Needs approval'
                      ? 'border-amber-400/25 bg-amber-400/10 text-amber-200'
                      : item.status === 'Draft prepared'
                        ? 'border-cyan-400/25 bg-cyan-400/10 text-cyan-200'
                        : 'border-blue-400/25 bg-blue-400/10 text-blue-200'
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <button type="button" onClick={copyPlan} className="rounded-lg border border-[rgba(46,127,255,0.22)] px-3 py-2 text-[11px] font-bold text-[#BFD8FF] transition-colors hover:bg-[#2E7FFF]/12">Copy Plan</button>
        <button type="button" onClick={sharePlan} className="rounded-lg border border-[rgba(46,127,255,0.22)] px-3 py-2 text-[11px] font-bold text-[#BFD8FF] transition-colors hover:bg-[#2E7FFF]/12">Share Plan</button>
        <button type="button" onClick={openPlan} className="rounded-lg border border-[rgba(46,127,255,0.22)] px-3 py-2 text-[11px] font-bold text-[#BFD8FF] transition-colors hover:bg-[#2E7FFF]/12">Open Action Plan</button>
        <button type="button" onClick={onClose} className="rounded-lg bg-[#2E7FFF] px-3 py-2 text-[11px] font-bold text-white shadow-[0_0_14px_rgba(46,127,255,0.32)] transition-colors hover:bg-blue-500">Done</button>
      </div>
    </div>
  );
}

const STATUS_SUMMARY_CONFIG: Record<PortfolioStatusKey, Omit<PortfolioStatusSummary, 'key' | 'count' | 'clients'>> = {
  critical: {
    label: 'Critical',
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/30',
    icon: <AlertTriangle size={13} />,
    summary: 'Critical properties need immediate command attention, supervisor ownership, and client-facing recovery updates.',
    chips: ['Open command bridge', 'Assign supervisor', 'Notify client lead', 'Start SLA recovery'],
  },
  warning: {
    label: 'Warning',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/30',
    icon: <Clock size={13} />,
    summary: 'Warning properties are trending toward SLA or operational risk and should be stabilized before they become critical.',
    chips: ['Review warning list', 'Rebalance field load', 'Schedule recovery check', 'Watch oldest breaches'],
  },
  live: {
    label: 'Live',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    icon: <CheckCircle size={13} />,
    summary: 'Live properties are healthy enough to support proactive maintenance, prevention loops, and spare-capacity planning.',
    chips: ['Open healthy roster', 'Keep AI watch active', 'Export live portfolio', 'Share spare capacity'],
  },
};

function propertyNoun(count: number): string {
  return count === 1 ? 'Property' : 'Properties';
}

function topClientRows(clients: PortfolioClient[], getValue: (client: PortfolioClient) => number, suffix = '') {
  return [...clients]
    .sort((a, b) => getValue(b) - getValue(a))
    .slice(0, 3)
    .map(client => ({ label: client.name, value: `${getValue(client).toLocaleString()}${suffix}`, tone: 'text-[#EEF3FA]' }));
}

function StatusSummaryModal({
  summary,
  onClose,
  onToast,
  onOpenClient,
}: {
  summary: PortfolioStatusSummary;
  onClose: () => void;
  onToast: ToastFn;
  onOpenClient: (client: PortfolioClient) => void;
}) {
  const [selectedChips, setSelectedChips] = useState<string[]>(summary.chips.slice(0, 3));
  const totalSites = summary.clients.reduce((sum, client) => sum + client.sites, 0);
  const totalWorkOrders = summary.clients.reduce((sum, client) => sum + client.workOrders, 0);
  const totalIncidents = summary.clients.reduce((sum, client) => sum + client.incidents, 0);
  const avgSla = summary.clients.length > 0
    ? Math.round(summary.clients.reduce((sum, client) => sum + client.sla, 0) / summary.clients.length)
    : 0;
  const visibleClients = summary.clients.slice(0, 5);
  const footprintSummary = summary.count > 0
    ? `${summary.count} ${summary.label.toLowerCase()} ${propertyNoun(summary.count).toLowerCase()} spans ${totalSites.toLocaleString()} site${totalSites === 1 ? '' : 's'} with ${totalIncidents.toLocaleString()} active incident${totalIncidents === 1 ? '' : 's'} across that footprint.`
    : `No ${summary.label.toLowerCase()} properties are currently in this portfolio slice.`;

  const toggleChip = (chip: string) => {
    setSelectedChips(prev => prev.includes(chip) ? prev.filter(c => c !== chip) : [...prev, chip]);
  };

  const createStatusActionPlan = () => {
    onToast(`${summary.label}: ${selectedChips.length} status action${selectedChips.length === 1 ? '' : 's'} added to action plan`, 'success');
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 12 }}
      transition={{ duration: 0.18 }}
      className="fixed left-1/2 top-1/2 z-[320] flex max-h-[calc(100dvh-32px)] w-[min(560px,calc(100%-32px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-[rgba(46,127,255,0.28)] bg-[#0B172A] shadow-2xl"
      role="dialog"
      aria-modal="true"
      aria-label={`${summary.label} status details`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-[rgba(46,127,255,0.16)] bg-[#112040] px-4 py-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${summary.bg} ${summary.color}`}>
            {summary.icon}
          </div>
          <div className="min-w-0">
            <div className="text-[9px] font-bold uppercase tracking-wide text-[#7A94B4]">Portfolio Status</div>
            <h3 className="mt-0.5 text-sm font-bold leading-tight text-[#EEF3FA]">{summary.label} Properties</h3>
            <p className="mt-1 text-[11px] leading-relaxed text-[#9DB9E8]">{summary.summary}</p>
          </div>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-[#7A94B4] transition-colors hover:bg-white/5 hover:text-white" aria-label="Close status details">
          <X size={15} />
        </button>
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {[
            { label: 'Properties', value: String(summary.count), tone: summary.color },
            { label: 'Sites', value: totalSites.toLocaleString(), tone: 'text-cyan-300' },
            { label: 'Active Incidents', value: totalIncidents.toLocaleString(), tone: totalIncidents > 0 ? 'text-amber-300' : 'text-emerald-300' },
            { label: 'Work Orders', value: totalWorkOrders.toLocaleString(), tone: 'text-blue-300' },
          ].map(item => (
            <div key={item.label} className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#0A1628] p-3">
              <div className="text-[9px] uppercase tracking-wide text-[#7A94B4]">{item.label}</div>
              <div className={`mt-1 text-[14px] font-bold leading-tight ${item.tone}`}>{item.value}</div>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-[rgba(46,127,255,0.12)] bg-[#081528] px-3 py-2 text-[11px] leading-relaxed text-[#9DB9E8]">
          {footprintSummary} Avg SLA is <span className={avgSla >= 90 ? 'font-bold text-emerald-300' : avgSla >= 80 ? 'font-bold text-amber-300' : 'font-bold text-red-300'}>{summary.count > 0 ? `${avgSla}%` : 'N/A'}</span>.
        </div>

        <div className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#0A1628] p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">Property Breakdown</div>
            <div className="text-[9px] text-[#7A94B4]">{totalIncidents.toLocaleString()} active incidents</div>
          </div>
          <div className="space-y-1.5">
            {visibleClients.length > 0 ? visibleClients.map(client => (
              <button
                key={client.id}
                onClick={() => onOpenClient(client)}
                className="grid w-full grid-cols-[1fr_auto_auto_auto_auto] items-center gap-2 rounded-lg border border-[rgba(46,127,255,0.08)] bg-[#081528] px-2.5 py-2 text-left transition-colors hover:border-[#2E7FFF]/35 hover:bg-[#102544]"
              >
                <span className="min-w-0 truncate text-[11px] font-semibold text-[#EEF3FA]">{client.name}</span>
                <span className="text-[10px] text-cyan-300">{client.sites} sites</span>
                <span className={client.incidents > 0 ? 'text-[10px] font-semibold text-amber-300' : 'text-[10px] text-emerald-300'}>{client.incidents} inc.</span>
                <span className="text-[10px] text-[#7A94B4]">{client.workOrders} WOs</span>
                <span className={client.sla >= 90 ? 'text-[10px] font-bold text-emerald-300' : client.sla >= 80 ? 'text-[10px] font-bold text-amber-300' : 'text-[10px] font-bold text-red-300'}>{client.sla}% SLA</span>
              </button>
            )) : (
              <div className="rounded-lg border border-[rgba(46,127,255,0.08)] bg-[#081528] px-2.5 py-3 text-[11px] text-[#7A94B4]">No properties currently match this status.</div>
            )}
          </div>
        </div>

        <div>
          <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">Command Chips</div>
          <div className="flex flex-wrap gap-2">
            {summary.chips.map(chip => {
              const active = selectedChips.includes(chip);
              return (
                <button
                  key={chip}
                  onClick={() => toggleChip(chip)}
                  className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold transition-all ${active ? 'border-[#2E7FFF] bg-[#2E7FFF]/20 text-blue-100' : 'border-[rgba(46,127,255,0.16)] bg-[#0A1628] text-[#7A94B4] hover:text-[#EEF3FA]'}`}
                >
                  {active && <Check size={10} className="mr-1 inline" />}
                  {chip}
                </button>
              );
            })}
          </div>
        </div>
      </div>

        <div className="flex flex-shrink-0 items-center justify-between gap-3 border-t border-[rgba(46,127,255,0.12)] bg-[#0B172A]/96 px-4 py-3">
          <div className="text-[10px] text-[#7A94B4]">{selectedChips.length} selected for the manager action plan</div>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-lg border border-[rgba(46,127,255,0.18)] px-3 py-2 text-[11px] font-semibold text-[#9DB9E8] transition-colors hover:bg-white/5">Close</button>
            <button onClick={createStatusActionPlan} className="rounded-lg bg-[#2E7FFF] px-3 py-2 text-[11px] font-bold text-white shadow-[0_0_14px_rgba(46,127,255,0.32)] transition-colors hover:bg-blue-500">{actionPlanButtonLabel(selectedChips.length)}</button>
          </div>
        </div>
    </motion.div>
  );
}

function PortfolioKpiModal({ kpi, onClose, onToast }: { kpi: PortfolioKpi; onClose: () => void; onToast: ToastFn }) {
  const [selectedActions, setSelectedActions] = useState<string[]>(kpi.actions.slice(0, 2).map(action => action.label));
  const [selectedFocusActions, setSelectedFocusActions] = useState<string[]>([]);
  const [reviewScheduled, setReviewScheduled] = useState(false);
  const [actionPlanRoute, setActionPlanRoute] = useState<{ total: number; owners: number; channels: number } | null>(null);

  const toggleAction = (action: string) => {
    setSelectedActions(prev => prev.includes(action) ? prev.filter(item => item !== action) : [...prev, action]);
    setActionPlanRoute(null);
  };

  const toggleFocusAction = (row: PortfolioKpi['focusRows'][number]) => {
    const key = `${row.label}:${row.action}`;
    setSelectedFocusActions(prev => {
      const active = prev.includes(key);
      if (!active) onToast(`${row.action} selected for ${row.label}`, 'success');
      setActionPlanRoute(null);
      return active ? prev.filter(item => item !== key) : [...prev, key];
    });
  };

  const selectedFocusRows = kpi.focusRows.filter(row => selectedFocusActions.includes(`${row.label}:${row.action}`));
  const selectedCommandActions = kpi.actions.filter(action => selectedActions.includes(action.label));
  const actionCount = selectedActions.length + selectedFocusActions.length;
  const isSitesKpi = kpi.key === 'sites';
  const topFocusRow = kpi.focusRows[0];

  const reviewLater = () => {
    setReviewScheduled(true);
    onToast(`${kpi.label}: review scheduled for the next command check-in`, 'info');
  };

  const createKpiActionPlan = () => {
    const owners = new Set([
      ...selectedCommandActions.map(action => action.owner),
      ...selectedFocusRows.map(row => row.label),
    ]);
    const channels = new Set([
      ...selectedCommandActions.map(action => action.channel),
      ...selectedFocusRows.map(row => row.action),
    ]);
    setActionPlanRoute({ total: actionCount, owners: owners.size, channels: channels.size });
    onToast(`${kpi.label}: ${actionCount} action${actionCount === 1 ? '' : 's'} assigned to ${owners.size} owner${owners.size === 1 ? '' : 's'}`, 'success');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 12 }}
      transition={{ duration: 0.18 }}
      className="fixed left-1/2 top-1/2 z-[320] flex max-h-[calc(100dvh-32px)] w-[min(720px,calc(100%-32px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-[rgba(46,127,255,0.28)] bg-[#0B172A] shadow-2xl"
      role="dialog"
      aria-modal="true"
      aria-label={`${kpi.label} details`}
    >
      <div className="flex flex-shrink-0 items-start justify-between gap-3 border-b border-[rgba(46,127,255,0.16)] bg-[linear-gradient(90deg,rgba(46,127,255,0.18),rgba(17,32,64,0.98))] px-4 py-3">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${kpi.bg} ${kpi.color}`}>
            {kpi.icon}
          </div>
          <div>
            <div className="text-[9px] font-bold uppercase tracking-wide text-[#7A94B4]">
              {isSitesKpi ? 'Coverage OS' : 'Command Decision'}
            </div>
            <h3 className="mt-0.5 text-sm font-bold leading-tight text-[#EEF3FA]">{kpi.label}</h3>
            <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-[#9DB9E8]">
              {isSitesKpi ? 'Every job, asset, sensor, technician, and SLA clock needs a zone.' : kpi.summary}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-[#7A94B4] transition-colors hover:bg-white/5 hover:text-white" aria-label="Close KPI details">
          <X size={15} />
        </button>
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {isSitesKpi && (
          <div className="rounded-xl border border-cyan-300/22 bg-[linear-gradient(135deg,rgba(8,145,178,0.16),rgba(46,127,255,0.08))] p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">Coverage OS</div>
                <h4 className="mt-1 text-[15px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {kpi.value} zones under command
                </h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {['Techs', 'Assets', 'Sensors', 'Incidents', 'Evidence', 'SLA'].map(item => (
                  <span key={item} className="rounded-full border border-cyan-300/18 bg-[#06101F]/80 px-3 py-1 text-[10px] font-black text-cyan-100">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-[150px_minmax(0,1fr)]">
          <div className={`rounded-xl border p-3 ${kpi.bg}`}>
            <div className="text-[9px] font-bold uppercase tracking-wide text-[#7A94B4]">{isSitesKpi ? 'Footprint' : 'Signal'}</div>
            <div className={`mt-1 text-3xl font-black leading-none ${kpi.color}`}>{kpi.value}</div>
            <div className="mt-1 text-[10px] text-[#8EA7C7]">{kpi.label}</div>
          </div>
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wide text-emerald-200">
                  <Zap size={11} />
                  Do this now
                </div>
                <div className="text-[13px] font-black leading-snug text-[#EEF3FA]">{kpi.nextBestAction}</div>
                <div className="mt-2 flex items-start gap-1.5 text-[10px] leading-4 text-amber-100/90">
                  <AlertTriangle size={11} className="mt-0.5 shrink-0 text-amber-200" />
                  {kpi.ifIgnored}
                </div>
              </div>
              <button
                type="button"
                onClick={createKpiActionPlan}
                className="shrink-0 rounded-lg bg-[#2E7FFF] px-3 py-2 text-[10px] font-black text-white shadow-[0_0_14px_rgba(46,127,255,0.32)] transition-colors hover:bg-blue-500"
              >
                Create plan
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#07111F] p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="text-[10px] font-black uppercase tracking-wide text-[#8DBDFF]">{isSitesKpi ? 'Pressure zones' : 'Act first'}</div>
            <div className="rounded-full border border-[rgba(46,127,255,0.16)] bg-[#0A1628] px-2 py-0.5 text-[9px] text-[#7A94B4]">{kpi.sourceTrace}</div>
          </div>
          <div className="space-y-1.5">
            {kpi.focusRows.slice(0, 3).map((row, index) => (
              <div key={`${row.label}-${row.value}`} className="grid gap-2 rounded-lg border border-[rgba(46,127,255,0.10)] bg-[#0A1628] px-3 py-2 md:grid-cols-[1fr_auto] md:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="grid h-5 w-5 place-items-center rounded-md border border-white/10 bg-white/[0.04] text-[9px] font-black text-[#8DBDFF]">{index + 1}</span>
                    <div className="truncate text-[12px] font-black text-[#EEF3FA]">{row.label}</div>
                    <div className={`rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold ${row.tone}`}>{row.value}</div>
                  </div>
                  <div className="mt-1 text-[10px] leading-relaxed text-[#8EA7C7]">{row.detail}</div>
                </div>
                {(() => {
                  const active = selectedFocusActions.includes(`${row.label}:${row.action}`);
                  return (
                    <button
                      type="button"
                      onClick={() => toggleFocusAction(row)}
                      className={`inline-flex items-center justify-center gap-1 rounded-lg border px-2.5 py-1.5 text-[10px] font-bold transition-all ${
                        active
                          ? 'border-emerald-400/35 bg-emerald-400/14 text-emerald-200'
                          : 'border-[#2E7FFF]/22 bg-[#2E7FFF]/10 text-[#BFD8FF] hover:border-[#2E7FFF]/55 hover:bg-[#2E7FFF]/18 hover:text-white'
                      }`}
                      aria-pressed={active}
                    >
                      {active ? <Check size={11} /> : null}
                      {active ? 'Selected' : row.action}
                      {!active && <ArrowRight size={11} />}
                    </button>
                  );
                })()}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#07111F] p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="text-[10px] font-black uppercase tracking-wide text-[#8DBDFF]">Action checklist</div>
            <div className="text-[9px] text-[#7A94B4]">{actionCount} selected</div>
          </div>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {kpi.actions.slice(0, 4).map(action => {
            const active = selectedActions.includes(action.label);
            return (
              <button
                key={action.label}
                type="button"
                onClick={() => toggleAction(action.label)}
                className={`rounded-lg border px-3 py-2 text-left transition-all ${
                  active
                    ? 'border-[#2E7FFF]/70 bg-[#2E7FFF]/18 shadow-[0_0_16px_rgba(46,127,255,0.16)]'
                    : 'border-[rgba(46,127,255,0.14)] bg-[#0A1628] hover:border-[#2E7FFF]/45 hover:bg-[#102544]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[11px] font-black text-[#EEF3FA]">
                      {active ? <Check size={12} className="shrink-0 text-blue-200" /> : <span className="h-3 w-3 shrink-0 rounded border border-white/20" />}
                      <span className="truncate">{action.label}</span>
                    </div>
                    <p className="mt-1 truncate text-[9px] text-[#8EA7C7]">{action.owner} / {action.channel}</p>
                  </div>
                  <ArrowRight size={11} className="shrink-0 text-[#7A94B4]" />
                </div>
              </button>
            );
          })}
          </div>
          {topFocusRow && (
            <p className="mt-2 text-[10px] leading-4 text-[#7A94B4]">
              First target: <span className="font-bold text-[#C8D6E8]">{topFocusRow.label}</span>. Use the row action above if the plan needs a property-specific task.
            </p>
          )}
        </div>

      </div>

      <div className="flex flex-shrink-0 flex-col gap-2 border-t border-[rgba(46,127,255,0.12)] bg-[#0B172A]/96 px-4 py-3">
        {(reviewScheduled || actionPlanRoute) && (
          <div className="grid gap-2 sm:grid-cols-2">
            {reviewScheduled && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-[10px] font-semibold text-amber-200">
                <Calendar size={12} />
                Review reminder set for the next command check-in.
              </div>
            )}
            {actionPlanRoute && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-[10px] font-semibold text-emerald-200">
                <Send size={12} />
                {actionPlanRoute.total} routed to {actionPlanRoute.owners} owner{actionPlanRoute.owners === 1 ? '' : 's'} across {actionPlanRoute.channels} channel{actionPlanRoute.channels === 1 ? '' : 's'}.
              </div>
            )}
          </div>
        )}
        <div className="flex items-center justify-between gap-3">
          <div className="text-[10px] text-[#7A94B4]">{actionCount} action{actionCount === 1 ? '' : 's'} in the manager plan</div>
          <div className="flex gap-2">
            <button
              onClick={reviewLater}
              className={`rounded-lg border px-3 py-2 text-[11px] font-semibold transition-colors ${
                reviewScheduled
                  ? 'border-amber-400/25 bg-amber-400/10 text-amber-200'
                  : 'border-[rgba(46,127,255,0.18)] text-[#9DB9E8] hover:bg-white/5'
              }`}
            >
              {reviewScheduled ? 'Review Scheduled' : 'Schedule Review'}
            </button>
            <button onClick={createKpiActionPlan} className="rounded-lg bg-[#2E7FFF] px-3 py-2 text-[11px] font-bold text-white shadow-[0_0_14px_rgba(46,127,255,0.32)] transition-colors hover:bg-blue-500">
              {actionPlanRoute ? 'Update Action Plan' : actionPlanButtonLabel(actionCount)}
            </button>
            <button onClick={onClose} className="rounded-lg border border-[rgba(46,127,255,0.18)] px-3 py-2 text-[11px] font-semibold text-[#9DB9E8] transition-colors hover:bg-white/5">Close</button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PortfolioSummaryStrip({ clients, onToast }: { clients: PortfolioClient[]; onToast: ToastFn }) {
  const totalSites       = clients.reduce((s, c) => s + c.sites, 0);
  const totalWO          = clients.reduce((s, c) => s + c.workOrders, 0);
  const { incidents }    = useIncidents();
  const criticalInc      = Math.max(6, incidents.filter(i => i.severity === 'critical' && i.status !== 'closed').length);
  const avgSLA           = Math.round(clients.reduce((s, c) => s + c.sla, 0) / clients.length);
  const totalDS          = clients.reduce((s, c) => s + c.dataSources.length, 0);
  const [selectedKpi, setSelectedKpi] = useState<PortfolioKpi | null>(null);
  const statusCounts = {
    critical: clients.filter(c => c.status === 'critical').length,
    warning: clients.filter(c => c.status === 'warning').length,
    live: clients.filter(c => c.status === 'live').length,
  };
  const sourceTotals = clients
    .flatMap(c => c.dataSources)
    .reduce<Record<string, number>>((acc, source) => {
      acc[source.label] = (acc[source.label] ?? 0) + source.count;
      return acc;
    }, {});
  const topSourceRows = Object.entries(sourceTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label, value]) => ({ label, value: value.toLocaleString(), tone: 'text-purple-200' }));
  const pressureScore = (client: PortfolioClient) =>
    client.incidents * 10 + client.overdueTasks * 6 + client.workOrders / Math.max(client.sites, 1) + (100 - client.sla);
  const statusFocusRows = [...clients]
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel] || b.incidents - a.incidents)
    .slice(0, 3)
    .map(client => ({
      label: client.name,
      value: `${client.status.toUpperCase()} · ${client.riskLevel.toUpperCase()}`,
      detail: `${client.sites} sites, ${client.incidents} incidents, ${client.overdueTasks} overdue tasks, ${client.sla}% SLA.`,
      action: client.status === 'critical' ? 'Open recovery bridge' : client.status === 'warning' ? 'Stabilize next shift' : 'Use spare capacity',
      tone: client.status === 'critical' ? 'text-red-200' : client.status === 'warning' ? 'text-amber-200' : 'text-emerald-200',
    }));
  const siteCoverageRows = [...clients]
    .sort((a, b) => pressureScore(b) - pressureScore(a) || b.sites - a.sites)
    .slice(0, 3)
    .map(client => ({
      label: client.name,
      value: `${client.sites} zones`,
      detail: `${Math.round(client.workOrders / Math.max(client.sites, 1))} WOs/zone / ${client.incidents} incidents / ${client.sla}% SLA.`,
      action: client.incidents > 5 || client.sla < 85 ? 'Move techs here' : 'Open zone view',
      tone: client.sla < 85 ? 'text-red-200' : client.incidents > 5 ? 'text-amber-200' : 'text-cyan-200',
    }));
  const workOrderFocusRows = [...clients]
    .sort((a, b) => b.workOrders - a.workOrders || b.overdueTasks - a.overdueTasks)
    .slice(0, 3)
    .map(client => ({
      label: client.name,
      value: `${client.workOrders} WOs`,
      detail: `${client.overdueTasks} overdue tasks, ${client.incidents} incidents, ${client.people.technicians.length} technicians mapped.`,
      action: client.overdueTasks > 5 ? 'Escalate backlog' : 'Tune dispatch',
      tone: client.overdueTasks > 5 ? 'text-red-200' : client.workOrders > 50 ? 'text-amber-200' : 'text-emerald-200',
    }));
  const incidentFocusRows = [...clients]
    .sort((a, b) => b.incidents - a.incidents || a.sla - b.sla)
    .slice(0, 3)
    .map(client => ({
      label: client.name,
      value: `${client.incidents} incidents`,
      detail: `${client.sla}% SLA, ${client.overdueTasks} overdue tasks, ${client.people.supervisors[0]?.name ?? 'Supervisor'} owns first response.`,
      action: client.incidents > 0 ? 'Assign supervisor' : 'Keep watch',
      tone: client.incidents > 8 ? 'text-red-200' : client.incidents > 0 ? 'text-amber-200' : 'text-emerald-200',
    }));
  const slaFocusRows = [...clients]
    .sort((a, b) => a.sla - b.sla || b.incidents - a.incidents)
    .slice(0, 3)
    .map(client => ({
      label: client.name,
      value: `${client.sla}% SLA`,
      detail: `${client.incidents} incidents and ${client.overdueTasks} overdue tasks are the fastest path to recovery.`,
      action: client.sla < 80 ? 'Start SLA recovery' : client.sla < 90 ? 'Protect next breach' : 'Maintain standard',
      tone: client.sla < 80 ? 'text-red-200' : client.sla < 90 ? 'text-amber-200' : 'text-emerald-200',
    }));
  const dataSourceFocusRows = [...clients]
    .sort((a, b) => a.dataSources.length - b.dataSources.length || a.dataSources.reduce((sum, source) => sum + source.count, 0) - b.dataSources.reduce((sum, source) => sum + source.count, 0))
    .slice(0, 3)
    .map(client => {
      const sourceCount = client.dataSources.length;
      const recordCount = client.dataSources.reduce((sum, source) => sum + source.count, 0);
      return {
        label: client.name,
        value: `${sourceCount} feeds`,
        detail: `${recordCount.toLocaleString()} records connected. Missing feeds weaken AI confidence and client evidence.`,
        action: sourceCount < 3 ? 'Complete onboarding' : 'Audit data quality',
        tone: sourceCount < 3 ? 'text-amber-200' : 'text-purple-200',
      };
    });

  const kpis: PortfolioKpi[] = [
    {
      key: 'properties',
      label: 'Total Properties',
      value: clients.length,
      icon: <Users size={13} />,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
      summary: `${clients.length} properties are under the master command view, with ${statusCounts.critical} critical and ${statusCounts.warning} warning portfolios requiring attention.`,
      detailRows: [
        { label: 'Critical', value: String(statusCounts.critical), tone: 'text-red-300' },
        { label: 'Warning', value: String(statusCounts.warning), tone: 'text-amber-300' },
        { label: 'Live', value: String(statusCounts.live), tone: 'text-emerald-300' },
      ],
      chips: ['Open property review', 'Prioritize critical sites', 'Assign account owner', 'Export roster'],
      commandAnswer: `${clients.length} properties is only useful if it shows where leadership attention should move. Right now the command priority is ${statusCounts.critical} critical and ${statusCounts.warning} warning properties, with the rest available for prevention capacity.`,
      nextBestAction: statusCounts.critical > 0 ? 'Open a recovery bridge for the critical property before reviewing healthy assets.' : 'Use healthy properties for preventive work and client value stories.',
      ifIgnored: 'Critical and warning portfolios stay blended into the total count, so recovery ownership gets delayed.',
      sourceTrace: 'Based on property status, SLA, incidents, and overdue tasks',
      focusRows: statusFocusRows,
      actions: [
        { label: 'Open portfolio recovery board', owner: 'Portfolio Director', impact: 'Separates critical, warning, and healthy assets into the right operating rhythm.', channel: 'Command' },
        { label: 'Assign named recovery owners', owner: 'Operations Lead', impact: 'Moves the riskiest properties from observation into accountability.', channel: 'Task' },
        { label: 'Prepare client sponsor update', owner: 'Account Manager', impact: 'Creates a clean executive update for critical and warning accounts.', channel: 'Email' },
        { label: 'Shift spare capacity to prevention', owner: 'Dispatch Lead', impact: 'Uses healthy properties to reduce future incident pressure.', channel: 'Dispatch' },
      ],
    },
    {
      key: 'sites',
      label: 'Sites / Zones',
      value: totalSites,
      icon: <MapPin size={13} />,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/20',
      summary: `${totalSites} operating zones are the control layer for work, assets, sensors, people, evidence, and SLA.`,
      detailRows: topClientRows(clients, c => c.sites),
      chips: ['Open zone command', 'Move technicians', 'Assign zone owners', 'Start SLA watch'],
      commandAnswer: `${totalSites} zones show where work is owned: people, assets, sensors, incidents, evidence, and SLA in one operating footprint.`,
      nextBestAction: 'Move technicians to the zones with the most incidents, open work, and SLA risk.',
      ifIgnored: 'Unowned zones become slow routes, missed evidence, and late SLA breaches.',
      sourceTrace: 'Zones / WOs / incidents / SLA',
      focusRows: siteCoverageRows,
      actions: [
        { label: 'Move technicians to pressure zones', owner: 'Dispatch Lead', impact: 'Sends available technicians to the zones most likely to breach SLA.', channel: 'Dispatch' },
        { label: 'Assign zone owners', owner: 'Operations Lead', impact: 'Makes each risky footprint accountable.', channel: 'Task' },
        { label: 'Open asset layer', owner: 'Command Center', impact: 'Shows the assets and sensors driving pressure.', channel: 'Map' },
        { label: 'Start SLA watch', owner: 'DevelopmentX Copilot', impact: 'Warns before the next breach.', channel: 'AI Watch' },
      ],
    },
    {
      key: 'workOrders',
      label: 'Active Work Orders',
      value: totalWO,
      icon: <Activity size={13} />,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      summary: `${totalWO} active work orders are currently visible to command. High-volume properties should be checked for backlog concentration.`,
      detailRows: topClientRows(clients, c => c.workOrders),
      chips: ['Open WO command', 'Rebalance technicians', 'Escalate overdue jobs', 'Notify supervisors'],
      commandAnswer: `${totalWO} work orders matter because they show where today’s field capacity is being consumed. The decision is whether to rebalance technicians now, escalate overdue work, or protect specialist capacity.`,
      nextBestAction: 'Sort by overdue and resident-impacting work, then move technicians before the backlog becomes an SLA breach.',
      ifIgnored: 'Work volume turns into hidden backlog, repeat visits, and resident-facing delays.',
      sourceTrace: 'Based on active WOs, overdue tasks, incidents, and technician coverage',
      focusRows: workOrderFocusRows,
      actions: [
        { label: 'Rebalance technician load', owner: 'Dispatch Lead', impact: 'Moves field capacity to the properties with the highest backlog pressure.', channel: 'Dispatch' },
        { label: 'Escalate overdue jobs', owner: 'Site Supervisor', impact: 'Pushes aged work into named recovery before SLA breach.', channel: 'Task' },
        { label: 'Protect specialist capacity', owner: 'Field Supervisor', impact: 'Keeps HVAC, lift, MEP, and fire resources available for critical work.', channel: 'Roster' },
        { label: 'Notify supervisors of pressure points', owner: 'Command Center', impact: 'Gives each site lead the exact pressure list that needs attention now.', channel: 'Message' },
      ],
    },
    {
      key: 'incidents',
      label: 'Critical Incidents',
      value: criticalInc,
      icon: <AlertTriangle size={13} />,
      color: criticalInc > 0 ? 'text-red-400' : 'text-emerald-400',
      bg: criticalInc > 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20',
      summary: `${criticalInc} critical incidents are open or simulated for demo command. Focus on resident safety, SLA exposure, and supervisor response.`,
      detailRows: [
        { label: 'Critical Props', value: String(statusCounts.critical), tone: 'text-red-300' },
        { label: 'Overdue Tasks', value: clients.reduce((sum, c) => sum + c.overdueTasks, 0).toLocaleString(), tone: 'text-amber-300' },
        { label: 'Open Feed', value: String(incidents.filter(i => i.status !== 'closed').length), tone: 'text-[#EEF3FA]' },
      ],
      chips: ['Open incident bridge', 'Notify client leads', 'Assign supervisor', 'Start SLA recovery'],
      commandAnswer: `${criticalInc} critical incidents means the portfolio needs a command response, not just a count. Prioritize resident safety, trapped-lift or life-safety cases, and any incident creating immediate client exposure.`,
      nextBestAction: 'Assign one supervisor per critical incident and publish the next update time to client-facing teams.',
      ifIgnored: 'Critical incidents create resident escalation, penalty exposure, and loss of client confidence within the same shift.',
      sourceTrace: 'Based on open incidents, severity, overdue tasks, and SLA exposure',
      focusRows: incidentFocusRows,
      actions: [
        { label: 'Open incident bridge', owner: 'Command Center', impact: 'Creates one place for incident status, owner, resident impact, and next update.', channel: 'Command' },
        { label: 'Notify client leads', owner: 'Account Manager', impact: 'Keeps the client informed before they ask for escalation.', channel: 'Email' },
        { label: 'Assign supervisor now', owner: 'Operations Lead', impact: 'Stops critical work from sitting without named field ownership.', channel: 'Task' },
        { label: 'Start resident communication', owner: 'Community Manager', impact: 'Reduces uncertainty for affected residents while operations recover.', channel: 'Notice' },
      ],
    },
    {
      key: 'sla',
      label: 'Avg SLA',
      value: `${avgSLA}%`,
      icon: <Shield size={13} />,
      color: avgSLA >= 90 ? 'text-emerald-400' : avgSLA >= 80 ? 'text-amber-400' : 'text-red-400',
      bg: avgSLA >= 90 ? 'bg-emerald-500/10 border-emerald-500/20' : avgSLA >= 80 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20',
      summary: `Portfolio SLA is averaging ${avgSLA}%. Lowest-SLA properties need recovery planning before the next client review.`,
      detailRows: [...clients]
        .sort((a, b) => a.sla - b.sla)
        .slice(0, 3)
        .map(client => ({ label: client.name, value: `${client.sla}%`, tone: client.sla >= 90 ? 'text-emerald-300' : client.sla >= 80 ? 'text-amber-300' : 'text-red-300' })),
      chips: ['Open SLA recovery', 'Schedule client update', 'Prioritize breaches', 'Export SLA pack'],
      commandAnswer: `${avgSLA}% average SLA can look acceptable while individual properties are failing. The useful answer is which property is dragging the portfolio and what operational lever recovers it fastest.`,
      nextBestAction: 'Start with the lowest-SLA property and clear overdue or resident-impacting work before opening broad reports.',
      ifIgnored: 'The average masks weak spots, and the next client review becomes a defensive explanation instead of a recovery story.',
      sourceTrace: 'Based on property SLA, incidents, overdue tasks, and active WOs',
      focusRows: slaFocusRows,
      actions: [
        { label: 'Start SLA recovery sprint', owner: 'Operations Lead', impact: 'Targets the lowest-SLA properties with owners, deadlines, and update cadence.', channel: 'Command' },
        { label: 'Prioritize breach-risk jobs', owner: 'Dispatch Lead', impact: 'Moves work likely to breach SLA ahead of low-impact tasks.', channel: 'Dispatch' },
        { label: 'Schedule client recovery update', owner: 'Account Manager', impact: 'Turns low SLA into a visible recovery plan before the governance meeting.', channel: 'Meeting' },
        { label: 'Lock evidence for closed jobs', owner: 'QA Lead', impact: 'Prevents recovered jobs from being challenged later due to missing proof.', channel: 'Evidence' },
      ],
    },
    {
      key: 'dataSources',
      label: 'Connected Data Sources',
      value: totalDS,
      icon: <Database size={13} />,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20',
      summary: `${totalDS} source connections are feeding portfolio intelligence. Low or missing feeds should be pushed into onboarding.`,
      detailRows: topSourceRows.length > 0 ? topSourceRows : [{ label: 'Onboarding', value: '0', tone: 'text-amber-300' }],
      chips: ['Open data health', 'Reconnect failed feeds', 'Audit zero-count sources', 'Export source map'],
      commandAnswer: `${totalDS} connected sources only matter if they improve trust. The useful question is where missing, stale, or low-volume feeds weaken AI recommendations and client evidence.`,
      nextBestAction: 'Audit the weakest property feeds first, then reconnect sources that drive SLA, evidence, and resident communication.',
      ifIgnored: 'AI confidence drops, evidence gaps appear, and teams argue over whose data is correct.',
      sourceTrace: 'Based on connected feeds, source record volume, and property onboarding state',
      focusRows: dataSourceFocusRows,
      actions: [
        { label: 'Open data health review', owner: 'Data Lead', impact: 'Shows which feeds are missing, stale, or producing weak signal quality.', channel: 'Data' },
        { label: 'Reconnect priority feeds', owner: 'Integration Lead', impact: 'Restores the systems needed for SLA, evidence, and resident confidence.', channel: 'Integration' },
        { label: 'Audit zero-count sources', owner: 'QA Lead', impact: 'Finds broken connectors before AI decisions rely on incomplete data.', channel: 'Audit' },
        { label: 'Publish source confidence note', owner: 'DevelopmentX Copilot', impact: 'Makes AI recommendations explain which systems they are based on.', channel: 'AI Explain' },
      ],
    },
  ];

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-6 gap-2 px-5 py-3 border-b border-[rgba(46,127,255,0.12)] flex-shrink-0" data-demo-anchor="portfolio-kpi-cards">
        {kpis.map(k => (
          <div
            key={k.key}
            className={`group relative rounded-xl border transition-all hover:-translate-y-0.5 hover:border-[#2E7FFF]/45 hover:shadow-[0_0_18px_rgba(46,127,255,0.16)] ${k.bg} ${
              k.key === 'sites' ? 'ring-1 ring-cyan-300/25 shadow-[0_0_22px_rgba(34,211,238,0.10)]' : ''
            }`}
          >
            <button
              type="button"
              onClick={() => setSelectedKpi(k)}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 pr-9 text-left focus:outline-none focus:ring-1 focus:ring-[#2E7FFF]/70"
              aria-label={`Open ${k.label} KPI details`}
            >
              <div className={k.color}>{k.icon}</div>
              <div>
                <div className={`text-base font-bold leading-tight ${k.color}`}>{k.value}</div>
                <div className="mt-0.5 text-[9px] uppercase tracking-wide leading-tight text-[#7A94B4]">{k.label}</div>
                {k.key === 'sites' && (
                  <div className="mt-1 text-[8px] font-black uppercase tracking-[0.14em] text-cyan-200">Coverage OS</div>
                )}
              </div>
            </button>
            <button
              type="button"
              onClick={event => {
                event.stopPropagation();
                void shareCommandCard(
                  `${k.label}: ${k.value}`,
                  `${k.commandAnswer}\nBest next move: ${k.nextBestAction}\nIf ignored: ${k.ifIgnored}`,
                  onToast,
                );
              }}
              className="absolute right-2 top-2 rounded-md border border-white/10 bg-black/10 p-1.5 text-[#7A94B4] opacity-75 transition-colors hover:border-[#2E7FFF]/35 hover:bg-[#2E7FFF]/12 hover:text-[#BFD8FF] group-hover:opacity-100"
              aria-label={`Share ${k.label} summary`}
              title={`Share ${k.label}`}
            >
              <Share2 size={12} />
            </button>
          </div>
        ))}
      </div>
      <AnimatePresence>
        {selectedKpi && (
          <>
            <div className="fixed inset-0 z-[300] bg-black/35 backdrop-blur-[1px]" onClick={() => setSelectedKpi(null)} />
            <PortfolioKpiModal kpi={selectedKpi} onClose={() => setSelectedKpi(null)} onToast={onToast} />
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function ExecutiveImpactActionModal({
  card,
  staffEfficiencyItems = [],
  onClose,
  onToast,
}: {
  card: ExecutiveImpactCard;
  staffEfficiencyItems?: StaffEfficiencyItem[];
  onClose: () => void;
  onToast: ToastFn;
}) {
  const [selectedActions, setSelectedActions] = useState<string[]>(card.actions.slice(0, 3).map(action => action.label));
  const [customAction, setCustomAction] = useState('');
  const [customActions, setCustomActions] = useState<CustomPlanAction[]>([]);
  const [customOwner, setCustomOwner] = useState('Manager');
  const [customChannel, setCustomChannel] = useState('Custom');
  const [isListening, setIsListening] = useState(false);
  const [completedEfficiencyIds, setCompletedEfficiencyIds] = useState<string[]>([]);
  const [managedActions, setManagedActions] = useState<ManagedAction[] | null>(null);
  const [activeManagedActionId, setActiveManagedActionId] = useState<string | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => () => {
    speechRecognitionRef.current?.stop();
  }, []);

  const toggleAction = (action: string) => {
    setSelectedActions(prev => prev.includes(action) ? prev.filter(item => item !== action) : [...prev, action]);
    setManagedActions(null);
    setActiveManagedActionId(null);
  };

  const normalizeCustomAction = (action: string) => action.trim().replace(/\s+/g, ' ');

  const addCustomAction = () => {
    const normalized = normalizeCustomAction(customAction);
    if (!normalized) return;
    if ([...selectedActions, ...customActions.map(action => action.label)].includes(normalized)) {
      setCustomAction('');
      return;
    }
    setCustomActions(prev => [...prev, {
      label: normalized,
      owner: customOwner,
      channel: customChannel,
      impact: 'Manager-defined action added during the live review.',
      custom: true,
    }]);
    setCustomAction('');
    setManagedActions(null);
    setActiveManagedActionId(null);
  };

  const removeCustomAction = (action: string) => {
    setCustomActions(prev => prev.filter(item => item.label !== action));
    setManagedActions(null);
    setActiveManagedActionId(null);
  };

  const startDictation = () => {
    const speechWindow = window as typeof window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      onToast('Voice dictation is not available here. Type the custom action instead.', 'warning');
      return;
    }

    speechRecognitionRef.current?.stop();
    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => {
      setIsListening(false);
      onToast('Dictation stopped. You can type the action instead.', 'warning');
    };
    recognition.onresult = event => {
      const latestResult = event.results[event.results.length - 1];
      const transcript = latestResult?.[0]?.transcript?.trim();
      if (transcript) {
        setCustomAction(prev => normalizeCustomAction(`${prev} ${transcript}`));
      }
    };
    speechRecognitionRef.current = recognition;
    recognition.start();
  };

  const stopDictation = () => {
    speechRecognitionRef.current?.stop();
    setIsListening(false);
  };

  const buildSelectedExecutiveActions = () => {
    const typedAction = normalizeCustomAction(customAction);
    const selectedPresetActions = card.actions.filter(action => selectedActions.includes(action.label));
    const typedCustomAction: CustomPlanAction | null = typedAction && ![...selectedActions, ...customActions.map(action => action.label)].includes(typedAction)
      ? {
          label: typedAction,
          owner: customOwner,
          channel: customChannel,
          impact: 'Manager-defined action added during the live review.',
          custom: true,
        }
      : null;
    const allActions = [
      ...selectedPresetActions,
      ...customActions,
      ...(typedCustomAction ? [typedCustomAction] : []),
    ];
    return allActions;
  };

  const createActionPlan = () => {
    const actions = buildSelectedExecutiveActions();
    if (actions.length === 0) {
      onToast('Select at least one action before creating the plan', 'warning');
      return;
    }
    const nextManagedActions = actions.map((action, index) => buildManagedAction(action, index, card, 'custom' in action));
    setManagedActions(nextManagedActions);
    setActiveManagedActionId(nextManagedActions[0]?.id ?? null);
    setCustomAction('');
    onToast(`${card.label}: action plan workbench ready`, 'success');
  };

  const pendingCustomAction = normalizeCustomAction(customAction);
  const actionCount = new Set([
    ...selectedActions,
    ...customActions.map(action => action.label),
    ...(pendingCustomAction ? [pendingCustomAction] : []),
  ]).size;
  const hasCustomSelection = customActions.length > 0 || Boolean(pendingCustomAction);
  const primaryActionLabel = actionPlanButtonLabel(actionCount);
  const isStaffEfficiencyCard = card.key === 'workloadOptimizer';
  const totalStaffMinutes = staffEfficiencyItems.reduce((sum, item) => sum + item.timeSavedMinutes, 0);
  const actionPlanTitle = `${card.label} Action Plan`;
  const actionPlanNextUpdate = card.key === 'residentSentiment' ? 'Today, 5:00 PM' : 'Next command check-in';

  const handleEfficiencyAction = (item: StaffEfficiencyItem) => {
    setCompletedEfficiencyIds(prev => prev.includes(item.id) ? prev : [...prev, item.id]);
    onToast(`${item.client}: ${item.outcomeLabel}`, 'success');
  };

  const updateManagedActionStatus = (id: string, status: ManagedActionStatus) => {
    setManagedActions(prev => prev?.map(action => action.id === id ? { ...action, status } : action) ?? null);
  };

  const copyManagedPlan = async () => {
    if (!managedActions) return;
    try {
      await navigator.clipboard.writeText(buildManagedPlanText(actionPlanTitle, managedActions, actionPlanNextUpdate));
      onToast(`${card.label}: action plan copied`, 'success');
    } catch {
      onToast('Action plan is visible for manual copy', 'warning');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 12 }}
      transition={{ duration: 0.18 }}
      className={`fixed left-1/2 top-1/2 z-[320] flex max-h-[calc(100dvh-32px)] ${managedActions ? 'w-[min(960px,calc(100%-32px))]' : 'w-[min(680px,calc(100%-32px))]'} -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-[rgba(46,127,255,0.28)] bg-[#0B172A] shadow-2xl`}
      role="dialog"
      aria-modal="true"
      aria-label={`${card.label} action options`}
    >
      <div className="flex flex-shrink-0 items-start justify-between gap-3 border-b border-[rgba(46,127,255,0.16)] bg-[#112040] px-4 py-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${card.tone}`}>
            {card.icon}
          </div>
          <div className="min-w-0">
            <div className="text-[9px] font-bold uppercase tracking-wide text-[#7A94B4]">Executive Action Chooser</div>
            <h3 className="mt-0.5 text-sm font-bold leading-tight text-[#EEF3FA]">{card.label} - {card.value}</h3>
            <p className="mt-1 text-[11px] leading-relaxed text-[#9DB9E8]">{card.summary}</p>
          </div>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-[#7A94B4] transition-colors hover:bg-white/5 hover:text-white" aria-label="Close action chooser">
          <X size={15} />
        </button>
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {isStaffEfficiencyCard ? (
          <>
            <div className="grid gap-2 md:grid-cols-3">
              {[
                { label: 'Efficiency Items', value: String(staffEfficiencyItems.length) },
                { label: 'Time To Free', value: formatStaffTime(totalStaffMinutes) },
                { label: 'Action Status', value: `${completedEfficiencyIds.length}/${staffEfficiencyItems.length} done` },
              ].map(item => (
                <div key={item.label} className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#0A1628] p-3">
                  <div className="text-[9px] uppercase tracking-wide text-[#7A94B4]">{item.label}</div>
                  <div className="mt-1 text-[12px] font-bold leading-snug text-[#EEF3FA]">{item.value}</div>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3">
              <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-emerald-200">
                <Shield size={12} /> Staff efficiency queue
              </div>
              <p className="text-[11px] leading-relaxed text-[#D8E7FA]">
                These are the workload bottlenecks where managers can save staff time now. Review the pressure point, owner, deadline, and expected time saving before taking action.
              </p>
            </div>

            <div className="space-y-2">
              {staffEfficiencyItems.map(item => {
                const completed = completedEfficiencyIds.includes(item.id);
                return (
                  <div key={item.id} className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#07111F] p-3">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-[12px] font-black text-[#EEF3FA]">{item.client}</div>
                          <span className="rounded-md border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-200">{formatStaffTime(item.timeSavedMinutes)}</span>
                          <span className={`rounded-md border px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide ${
                            item.urgency === 'critical'
                              ? 'border-red-400/25 bg-red-400/10 text-red-200'
                              : item.urgency === 'high'
                                ? 'border-amber-400/25 bg-amber-400/10 text-amber-200'
                                : 'border-white/10 bg-white/5 text-[#9DB9E8]'
                          }`}>{item.urgency}</span>
                          <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-[#9DB9E8]">{item.channel}</span>
                        </div>
                        <p className="mt-1 text-[11px] font-semibold leading-relaxed text-[#D8E7FA]">{item.bottleneck}</p>
                        <p className="mt-1 text-[10px] leading-relaxed text-[#8EA7C7]">{item.staffImpact}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-[9px] font-semibold uppercase tracking-wide text-[#6F89AA]">
                          <span>Owner: {item.owner}</span>
                          <span>Deadline: {item.deadline}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleEfficiencyAction(item)}
                        className={`inline-flex shrink-0 items-center justify-center gap-1 rounded-lg border px-3 py-2 text-[10px] font-bold transition-all ${
                          completed
                            ? 'border-emerald-400/35 bg-emerald-400/14 text-emerald-200'
                            : 'border-[#2E7FFF]/30 bg-[#2E7FFF]/12 text-[#BFD8FF] hover:border-[#2E7FFF]/55 hover:bg-[#2E7FFF]/18 hover:text-white'
                        }`}
                      >
                        {completed ? <Check size={11} /> : <ArrowRight size={11} />}
                        {completed ? item.outcomeLabel : item.actionLabel}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : managedActions ? (
          <ActionPlanWorkbench
            title={actionPlanTitle}
            actions={managedActions}
            activeActionId={activeManagedActionId}
            nextUpdate={actionPlanNextUpdate}
            onSelectAction={setActiveManagedActionId}
            onUpdateActionStatus={updateManagedActionStatus}
            onToast={onToast}
          />
        ) : (
          <>
        <div className="grid gap-2 md:grid-cols-3">
          {[
            { label: 'Trigger', value: card.trigger },
            { label: 'Recommended', value: card.recommended },
            { label: 'Metric', value: `${card.value} ${card.sub}` },
          ].map(item => (
            <div key={item.label} className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#0A1628] p-3">
              <div className="text-[9px] uppercase tracking-wide text-[#7A94B4]">{item.label}</div>
              <div className="mt-1 text-[11px] font-semibold leading-snug text-[#EEF3FA]">{item.value}</div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3">
          <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-cyan-200">
            <Bot size={12} /> Context-aware playbook
          </div>
          <p className="text-[11px] leading-relaxed text-[#D8E7FA]">
            Select actions to turn into a managed response plan. Each selected item opens with recipients, drafts, owners, status, and safe next-click controls.
          </p>
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          {card.actions.map(action => {
            const active = selectedActions.includes(action.label);
            return (
              <button
                key={action.label}
                onClick={() => toggleAction(action.label)}
                className={`rounded-xl border p-3 text-left transition-all ${
                  active
                    ? 'border-[#2E7FFF]/70 bg-[#2E7FFF]/18 shadow-[0_0_16px_rgba(46,127,255,0.18)]'
                    : 'border-[rgba(46,127,255,0.14)] bg-[#0A1628] hover:border-[#2E7FFF]/45 hover:bg-[#102544]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[12px] font-bold text-[#EEF3FA]">
                      {active && <Check size={12} className="text-blue-200" />}
                      {action.label}
                    </div>
                    <p className="mt-1 text-[10px] leading-relaxed text-[#8EA7C7]">{action.impact}</p>
                  </div>
                  <span className="shrink-0 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-[#9DB9E8]">
                    {action.channel}
                  </span>
                </div>
                <div className="mt-2 text-[9px] font-semibold uppercase tracking-wide text-[#6F89AA]">Owner: {action.owner}</div>
              </button>
            );
          })}
        </div>

        <div className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#07111F] p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-[#8DBDFF]">Custom action</div>
              <p className="mt-0.5 text-[10px] leading-relaxed text-[#7A94B4]">
                Type or dictate a one-off action for this situation. It will be added to the managed response plan with the selected playbook actions.
              </p>
            </div>
            <button
              type="button"
              onClick={isListening ? stopDictation : startDictation}
              className={`inline-flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-2 text-[10px] font-bold transition-colors ${
                isListening
                  ? 'border-red-400/45 bg-red-500/15 text-red-100'
                  : 'border-cyan-400/25 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/15'
              }`}
              aria-label={isListening ? 'Stop dictating custom action' : 'Dictate custom action'}
            >
              <Mic size={12} />
              {isListening ? 'Listening' : 'Dictate'}
            </button>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <textarea
              value={customAction}
              onChange={event => setCustomAction(event.target.value)}
              rows={2}
              className="min-h-[58px] flex-1 resize-none rounded-lg border border-[rgba(46,127,255,0.18)] bg-[#0B172A] px-3 py-2 text-[12px] leading-5 text-[#EEF3FA] outline-none transition-colors placeholder:text-[#57708E] focus:border-[#2E7FFF]/70"
              placeholder={`Example: ${card.key === 'residentSentiment' ? 'Send SMS update to residents in Tower B before 5 PM' : 'Add a manager-approved action for this signal'}`}
              aria-label="Type custom action"
            />
            <button
              type="button"
              onClick={addCustomAction}
              disabled={!normalizeCustomAction(customAction)}
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-[#2E7FFF]/35 bg-[#2E7FFF]/12 px-3 py-2 text-[11px] font-bold text-[#BFD8FF] transition-colors hover:bg-[#2E7FFF]/18 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-[#657891]"
            >
              <Plus size={12} />
              Add Custom
            </button>
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <label className="text-[9px] font-bold uppercase tracking-wide text-[#7A94B4]">
              Owner
              <select
                value={customOwner}
                onChange={event => setCustomOwner(event.target.value)}
                className="mt-1 w-full rounded-lg border border-[rgba(46,127,255,0.18)] bg-[#0B172A] px-2.5 py-2 text-[11px] font-semibold normal-case tracking-normal text-[#D8E7FA] outline-none focus:border-[#2E7FFF]/70"
              >
                {['Manager', 'Operations Lead', 'Dispatch Lead', 'Property Manager', 'Community Manager', 'Vendor Manager', 'DevelopmentX Copilot'].map(owner => (
                  <option key={owner} value={owner}>{owner}</option>
                ))}
              </select>
            </label>
            <label className="text-[9px] font-bold uppercase tracking-wide text-[#7A94B4]">
              Channel
              <select
                value={customChannel}
                onChange={event => setCustomChannel(event.target.value)}
                className="mt-1 w-full rounded-lg border border-[rgba(46,127,255,0.18)] bg-[#0B172A] px-2.5 py-2 text-[11px] font-semibold normal-case tracking-normal text-[#D8E7FA] outline-none focus:border-[#2E7FFF]/70"
              >
                {['Custom', 'Dispatch', 'Approval', 'Calls', 'Meeting', 'Email', 'Notice', 'AI Watch'].map(channel => (
                  <option key={channel} value={channel}>{channel}</option>
                ))}
              </select>
            </label>
          </div>
          {customActions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {customActions.map(action => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => removeCustomAction(action.label)}
                  className="inline-flex items-center gap-1 rounded-full border border-cyan-400/25 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-semibold text-cyan-100 transition-colors hover:border-red-400/35 hover:bg-red-500/10 hover:text-red-100"
                  aria-label={`Remove custom action ${action.label}`}
                >
                  <Check size={10} />
                  {action.label}
                  <span className="text-[#7A94B4]">· {action.owner} · {action.channel}</span>
                  <X size={10} />
                </button>
              ))}
            </div>
          )}
        </div>
          </>
        )}
      </div>

        <div className="flex flex-shrink-0 items-center justify-between gap-3 border-t border-[rgba(46,127,255,0.12)] bg-[#0B172A]/96 px-4 py-3">
          <div className="text-[10px] text-[#7A94B4]">
            {isStaffEfficiencyCard
              ? `${completedEfficiencyIds.length} of ${staffEfficiencyItems.length} efficiency actions completed`
              : managedActions
              ? `${managedActions.length} action${managedActions.length === 1 ? '' : 's'} ready in the manager workbench`
              : hasCustomSelection
              ? `${actionCount} action${actionCount === 1 ? '' : 's'} will be added to the action plan, including custom action${customActions.length + (pendingCustomAction ? 1 : 0) === 1 ? '' : 's'}`
              : `${actionCount} action${actionCount === 1 ? '' : 's'} will be added to the action plan`}
          </div>
          <div className="flex gap-2">
            {managedActions ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setManagedActions(null);
                    setActiveManagedActionId(null);
                  }}
                  className="rounded-lg border border-[rgba(46,127,255,0.18)] px-3 py-2 text-[11px] font-semibold text-[#9DB9E8] transition-colors hover:bg-white/5"
                >
                  Back to Edit
                </button>
                <button
                  type="button"
                  onClick={() => void copyManagedPlan()}
                  className="rounded-lg border border-[#2E7FFF]/30 bg-[#2E7FFF]/12 px-3 py-2 text-[11px] font-bold text-[#BFD8FF] transition-colors hover:bg-[#2E7FFF]/18"
                >
                  Copy Plan
                </button>
                <button onClick={onClose} className="rounded-lg bg-[#2E7FFF] px-3 py-2 text-[11px] font-bold text-white shadow-[0_0_14px_rgba(46,127,255,0.32)] transition-colors hover:bg-blue-500">Done</button>
              </>
            ) : (
              <>
                <button onClick={onClose} className="rounded-lg border border-[rgba(46,127,255,0.18)] px-3 py-2 text-[11px] font-semibold text-[#9DB9E8] transition-colors hover:bg-white/5">Close</button>
                {!isStaffEfficiencyCard && (
                  <button onClick={createActionPlan} className="rounded-lg bg-[#2E7FFF] px-3 py-2 text-[11px] font-bold text-white shadow-[0_0_14px_rgba(46,127,255,0.32)] transition-colors hover:bg-blue-500">{primaryActionLabel}</button>
                )}
              </>
            )}
          </div>
        </div>
    </motion.div>
  );
}

function ExecutiveImpactStrip({ clients, onToast }: { clients: PortfolioClient[]; onToast: ToastFn }) {
  const profiles = clients.map(getCommandProfile);
  const aedAtRisk = profiles.reduce((sum, p) => sum + p.atRisk, 0);
  const staffEfficiencyItems = buildStaffEfficiencyItems(clients);
  const staffTimeFreed = staffEfficiencyItems.reduce((sum, item) => sum + item.timeSavedMinutes, 0);
  const adminLoadTasks = clients.reduce((sum, client) => {
    return sum
      + (client.overdueTasks > 0 ? 1 : 0)
      + (client.incidents > 0 ? 1 : 0)
      + (client.people.supervisors.length === 0 ? 1 : 0)
      + (client.dataSources.some(source => source.count === 0) ? 1 : 0);
  }, 0);
  const avgSentiment = Math.round(profiles.reduce((sum, p) => sum + p.sentiment, 0) / Math.max(profiles.length, 1));
  const avgUtilization = Math.round(profiles.reduce((sum, p) => sum + p.utilization, 0) / Math.max(profiles.length, 1));
  const [selectedCard, setSelectedCard] = useState<ExecutiveImpactCard | null>(null);

  const sentimentTrigger = avgSentiment < 75
    ? 'Resident sentiment is low and requires proactive outreach.'
    : avgSentiment < 88
      ? 'Resident sentiment is softening; prevent escalation before complaints spike.'
      : 'Resident sentiment is healthy; maintain visible communication and trust.';
  const utilizationTrigger = avgUtilization >= 85
    ? 'Technician utilization is stretched and may slow response times.'
    : avgUtilization >= 72
      ? 'Field load is elevated; rebalance before SLA backlog builds.'
      : 'Field load is stable; use spare capacity for planned work and resident follow-ups.';

  const items: ExecutiveImpactCard[] = [
    {
      key: 'aedRisk',
      label: 'AED at Risk',
      value: formatAed(aedAtRisk),
      sub: 'live exposure',
      icon: <AlertTriangle size={13} />,
      tone: 'text-red-300 bg-red-500/10 border-red-500/20',
      summary: 'Financial exposure is being driven by active incidents, overdue actions, SLA pressure, and operational drift.',
      trigger: aedAtRisk > 500_000 ? 'Exposure is above executive review threshold.' : 'Exposure is visible and should be watched.',
      recommended: 'Open a focused recovery review and assign owners for the top exposure drivers.',
      actions: [
        { label: 'Open exposure recovery room', owner: 'Portfolio Director', impact: 'Creates a command review for the largest cost and SLA exposure drivers.', channel: 'Command' },
        { label: 'Send client risk update', owner: 'Account Manager', impact: 'Gives the client a clear status, recovery plan, and next update time.', channel: 'Email' },
        { label: 'Freeze non-critical spend', owner: 'Commercial Lead', impact: 'Protects margin while urgent corrective actions are prioritized.', channel: 'Approval' },
        { label: 'Assign recovery owner', owner: 'Operations Lead', impact: 'Moves the top risk from observation into named accountability.', channel: 'Task' },
      ],
    },
    {
      key: 'workloadOptimizer',
      label: 'Workload Optimizer',
      value: formatStaffTime(staffTimeFreed),
      sub: 'field efficiency',
      icon: <Shield size={13} />,
      tone: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
      summary: 'Field teams can recover time by rebalancing overloaded sites, bundling nearby work, and giving each pressure point a named owner.',
      trigger: 'Workload pressure is visible across overdue tasks, incidents, SLA risk, and technician coverage.',
      recommended: 'Open the staff efficiency queue and clear the largest time-saving actions one by one.',
      actions: [
        { label: 'Rebalance technicians', owner: 'Dispatch Lead', impact: 'Moves field capacity toward the highest-pressure work queue.', channel: 'Dispatch' },
        { label: 'Assign supervisor', owner: 'Operations Lead', impact: 'Gives overloaded work one owner and stops repeated escalation chasing.', channel: 'Task' },
        { label: 'Bundle overdue jobs', owner: 'Site Supervisor', impact: 'Groups nearby work so technicians make fewer route and context switches.', channel: 'Roster' },
        { label: 'Prepare shift handover', owner: 'Property Manager', impact: 'Packages owner, task, and update notes before the next shift starts.', channel: 'Meeting' },
      ],
    },
    {
      key: 'residentSentiment',
      label: 'Resident Sentiment',
      value: `${avgSentiment}%`,
      sub: 'portfolio pulse',
      icon: <Users size={13} />,
      tone: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/20',
      summary: 'Resident sentiment combines SLA performance, incident load, overdue work, and resident-impacting service signals.',
      trigger: sentimentTrigger,
      recommended: avgSentiment < 88 ? 'Start proactive resident communication and targeted follow-up now.' : 'Keep resident trust high with visible updates and community touchpoints.',
      actions: [
        { label: 'Send email to affected residents', owner: 'Community Manager', impact: 'Acknowledges the issue, explains the fix path, and reduces uncertainty.', channel: 'Email' },
        { label: 'Hold resident meeting', owner: 'Property Manager', impact: 'Creates a visible forum for concerns, timelines, and accountability.', channel: 'Meeting' },
        { label: 'Make priority follow-up calls', owner: 'Resident Care Team', impact: 'Calls frustrated or repeat residents before escalation spreads.', channel: 'Calls' },
        { label: 'Publish service recovery timeline', owner: 'Operations Lead', impact: 'Shows when each resident-facing issue will be resolved.', channel: 'Notice' },
        { label: 'Create sentiment watch list', owner: 'DevelopmentX Copilot', impact: 'Tracks repeat complaints, open requests, and negative sentiment for 7 days.', channel: 'AI Watch' },
      ],
    },
    {
      key: 'adminLoadReducer',
      label: 'Admin Load Reducer',
      value: `${adminLoadTasks} tasks`,
      sub: 'less desk work',
      icon: <FileText size={13} />,
      tone: 'text-blue-300 bg-blue-500/10 border-blue-500/20',
      summary: 'Managers can compress routine desk work by drafting updates, bundling evidence, preparing handovers, and assigning follow-up owners.',
      trigger: 'Open incidents, overdue tasks, missing owners, and reporting gaps are creating avoidable admin work.',
      recommended: 'Create a focused admin action plan so supervisors spend less time rebuilding the same updates.',
      actions: [
        { label: 'Draft client update', owner: 'Account Manager', impact: 'Prepares the current status, owner, ETA, and next update time.', channel: 'Email' },
        { label: 'Bundle overdue jobs', owner: 'Site Supervisor', impact: 'Creates one supervisor-ready list instead of separate chases.', channel: 'Roster' },
        { label: 'Prepare shift handover', owner: 'Property Manager', impact: 'Packages open work, owners, and risks for the next shift.', channel: 'Meeting' },
        { label: 'Assign supervisor follow-up', owner: 'Operations Lead', impact: 'Turns loose follow-ups into named accountability.', channel: 'Task' },
      ],
    },
    {
      key: 'technicianUtilization',
      label: 'Technician Utilization',
      value: `${avgUtilization}%`,
      sub: 'field load',
      icon: <Activity size={13} />,
      tone: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
      summary: 'Field load measures how hard the service teams are being stretched across work orders, incidents, sites, and overdue tasks.',
      trigger: utilizationTrigger,
      recommended: avgUtilization >= 72 ? 'Rebalance field load and protect specialist capacity.' : 'Use available capacity for prevention, inspections, and resident follow-ups.',
      actions: [
        { label: 'Rebalance field team load', owner: 'Dispatch Lead', impact: 'Moves capacity toward the properties with highest SLA and resident risk.', channel: 'Dispatch' },
        { label: 'Approve overtime window', owner: 'Operations Lead', impact: 'Creates short-term recovery capacity without changing the roster.', channel: 'Approval' },
        { label: 'Call standby vendor', owner: 'Vendor Manager', impact: 'Adds external coverage for specialist or overflow work.', channel: 'Calls' },
        { label: 'Schedule toolbox briefing', owner: 'Field Supervisor', impact: 'Aligns technicians on priorities, safety, and resident-facing messaging.', channel: 'Meeting' },
      ],
    },
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-2 px-5 py-2.5 border-b border-[rgba(46,127,255,0.12)] flex-shrink-0 lg:grid-cols-5" data-demo-anchor="portfolio-impact-cards">
        {items.map(item => (
          <div
            key={item.key}
            className={`group relative rounded-lg border text-left transition-all hover:-translate-y-0.5 hover:border-[#2E7FFF]/45 hover:shadow-[0_0_18px_rgba(46,127,255,0.16)] ${item.tone}`}
          >
            <button
              type="button"
              onClick={() => setSelectedCard(item)}
              className="w-full px-3 py-2 pr-9 text-left focus:outline-none focus:ring-1 focus:ring-[#2E7FFF]/70"
              aria-label={`Open ${item.label} actions`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] uppercase tracking-wide opacity-75">{item.label}</span>
                {item.icon}
              </div>
              <div className="mt-1 text-base font-bold leading-tight">{item.value}</div>
              <div className="text-[9px] opacity-60">{item.sub}</div>
            </button>
            <button
              type="button"
              onClick={event => {
                event.stopPropagation();
                void shareCommandCard(
                  `${item.label}: ${item.value}`,
                  `${item.summary}\nTrigger: ${item.trigger}\nRecommended: ${item.recommended}`,
                  onToast,
                );
              }}
              className="absolute right-2 top-2 rounded-md border border-white/10 bg-black/10 p-1.5 opacity-75 transition-colors hover:border-[#2E7FFF]/35 hover:bg-[#2E7FFF]/12 hover:text-white group-hover:opacity-100"
              aria-label={`Share ${item.label} action summary`}
              title={`Share ${item.label}`}
            >
              <Share2 size={12} />
            </button>
          </div>
        ))}
      </div>
      <AnimatePresence>
        {selectedCard && (
          <>
            <div className="fixed inset-0 z-[300] bg-black/35 backdrop-blur-[1px]" onClick={() => setSelectedCard(null)} />
            <ExecutiveImpactActionModal
              card={selectedCard}
              staffEfficiencyItems={staffEfficiencyItems}
              onClose={() => setSelectedCard(null)}
              onToast={onToast}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function PulseEventModal({ event, onClose, onToast }: { event: PulseEvent; onClose: () => void; onToast: ToastFn }) {
  const cfg = PULSE_SEV_ICON[event.severity];
  const plan = buildPulseCommandPlan(event);
  const [selectedActions, setSelectedActions] = useState<string[]>(plan.actions.slice(0, 3).map(action => action.label));
  const [responsePlanReceipt, setResponsePlanReceipt] = useState<ActionPlanReceipt | null>(null);

  const toggleAction = (action: string) => {
    setSelectedActions(prev => prev.includes(action) ? prev.filter(item => item !== action) : [...prev, action]);
    setResponsePlanReceipt(null);
  };

  const launchResponsePlan = () => {
    const items = plan.actions
      .filter(action => selectedActions.includes(action.label))
      .map((action, index) => createActionPlanItem(action, index));
    if (items.length === 0) {
      onToast('Select at least one response action before launching the plan', 'warning');
      return;
    }
    setResponsePlanReceipt({
      title: `${event.client} Response Plan`,
      items,
      nextUpdate: plan.deadline,
      createdAt: 'Just now',
    });
    onToast(`${event.client}: response plan launched`, 'success');
  };

  const copyDraft = async () => {
    try {
      await navigator.clipboard.writeText(plan.updateDraft);
      onToast(`${event.client}: client update copied`, 'success');
    } catch {
      onToast('Client update is visible in the modal for manual copy', 'warning');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 12 }}
      transition={{ duration: 0.18 }}
      className="fixed left-1/2 top-1/2 z-[320] flex max-h-[calc(100dvh-32px)] w-[min(760px,calc(100%-32px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-[rgba(46,127,255,0.28)] bg-[#0B172A] shadow-2xl"
      role="dialog"
      aria-modal="true"
      aria-label="Portfolio pulse event"
    >
      <div className="flex flex-shrink-0 items-start justify-between gap-3 border-b border-[rgba(46,127,255,0.16)] bg-[linear-gradient(90deg,rgba(46,127,255,0.18),rgba(17,32,64,0.98))] px-4 py-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${cfg.cls}`}>
            {cfg.icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#9DB9E8]">{PULSE_SEV_LABEL[event.severity]}</span>
              <span className="text-[10px] text-[#7A94B4]">{event.time}</span>
            </div>
            <h3 className="mt-1 text-sm font-bold leading-tight text-[#EEF3FA]">{event.title}</h3>
            <p className="mt-1 text-[11px] text-[#7A94B4]">{event.client} - {event.sub}</p>
          </div>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-[#7A94B4] transition-colors hover:bg-white/5 hover:text-white" aria-label="Close event details">
          <X size={15} />
        </button>
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3">
          <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-cyan-200">
            <Bot size={12} /> Command decision
          </div>
          <p className="text-[12px] font-semibold leading-relaxed text-[#EEF3FA]">{plan.decision}</p>
          <div className="mt-2 text-[10px] leading-relaxed text-[#8EA7C7]">{plan.sourceTrace}</div>
        </div>

        <div className="grid gap-2 md:grid-cols-3">
          <div className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#0A1628] p-3">
            <div className="text-[9px] uppercase tracking-wide text-[#7A94B4]">Owner</div>
            <div className="mt-1 text-[12px] font-bold leading-snug text-[#EEF3FA]">{plan.owner}</div>
          </div>
          <div className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#0A1628] p-3">
            <div className="text-[9px] uppercase tracking-wide text-[#7A94B4]">Deadline</div>
            <div className="mt-1 text-[12px] font-bold leading-snug text-[#EEF3FA]">{plan.deadline}</div>
          </div>
          <div className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#0A1628] p-3">
            <div className="text-[9px] uppercase tracking-wide text-[#7A94B4]">Exposure</div>
            <div className="mt-1 text-[12px] font-bold leading-snug text-[#EEF3FA]">{plan.exposure}</div>
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wide text-red-200">
              <AlertTriangle size={11} />
              If ignored
            </div>
            <div className="text-[11px] font-semibold leading-relaxed text-[#EEF3FA]">{plan.ifIgnored}</div>
          </div>
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wide text-emerald-200">
              <CheckCircle size={11} />
              If resolved now
            </div>
            <div className="text-[11px] font-semibold leading-relaxed text-[#EEF3FA]">{plan.ifResolved}</div>
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-3">
          {plan.timeline.map(step => (
            <div key={step.label} className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#07111F] p-3">
              <div className="text-[9px] font-bold uppercase tracking-wide text-[#8DBDFF]">{step.label}</div>
              <div className="mt-1 text-[11px] leading-relaxed text-[#C8D8EE]">{step.value}</div>
            </div>
          ))}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[10px] font-bold uppercase tracking-wide text-[#8DBDFF]">Assign response actions</div>
            <div className="text-[9px] text-[#7A94B4]">{selectedActions.length} selected</div>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {plan.actions.map(action => {
              const active = selectedActions.includes(action.label);
              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => toggleAction(action.label)}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    active
                      ? 'border-[#2E7FFF]/70 bg-[#2E7FFF]/18 shadow-[0_0_16px_rgba(46,127,255,0.16)]'
                      : 'border-[rgba(46,127,255,0.14)] bg-[#0A1628] hover:border-[#2E7FFF]/45 hover:bg-[#102544]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 text-[12px] font-bold text-[#EEF3FA]">
                        {active && <Check size={12} className="text-blue-200" />}
                        {action.label}
                      </div>
                      <p className="mt-1 text-[10px] leading-relaxed text-[#8EA7C7]">{action.impact}</p>
                    </div>
                    <span className="shrink-0 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-[#9DB9E8]">
                      {action.channel}
                    </span>
                  </div>
                  <div className="mt-2 text-[9px] font-semibold uppercase tracking-wide text-[#6F89AA]">Owner: {action.owner}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#0A1628] p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="text-[10px] font-bold uppercase tracking-wide text-[#8DBDFF]">Client update draft</div>
              <button
                type="button"
                onClick={copyDraft}
                className="rounded-lg border border-[#2E7FFF]/25 bg-[#2E7FFF]/10 px-2.5 py-1.5 text-[10px] font-bold text-[#BFD8FF] transition-colors hover:bg-[#2E7FFF]/18"
              >
                Copy update
              </button>
            </div>
            <div className="rounded-lg border border-[rgba(46,127,255,0.10)] bg-[#07111F] p-3 text-[11px] leading-relaxed text-[#D8E7FA]">
              {plan.updateDraft}
            </div>
          </div>
          <div className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#0A1628] p-3">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[#8DBDFF]">Evidence to capture</div>
            <div className="space-y-1.5">
              {plan.evidence.map(item => (
                <div key={item} className="flex items-center gap-2 rounded-lg border border-[rgba(46,127,255,0.08)] bg-[#07111F] px-2 py-1.5 text-[10px] text-[#C8D8EE]">
                  <Check size={10} className="text-emerald-300" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
        {responsePlanReceipt && (
          <ActionPlanReceiptCard receipt={responsePlanReceipt} onClose={onClose} onToast={onToast} />
        )}
      </div>

      <div className="flex flex-shrink-0 items-center justify-between gap-3 border-t border-[rgba(46,127,255,0.12)] bg-[#0B172A]/96 px-4 py-3">
          <div className="text-[10px] text-[#7A94B4]">{selectedActions.length} response action{selectedActions.length === 1 ? '' : 's'} will be added to the response plan</div>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-lg border border-[rgba(46,127,255,0.18)] px-3 py-2 text-[11px] font-semibold text-[#9DB9E8] transition-colors hover:bg-white/5">Close</button>
            <button onClick={launchResponsePlan} className="rounded-lg bg-[#2E7FFF] px-3 py-2 text-[11px] font-bold text-white shadow-[0_0_14px_rgba(46,127,255,0.32)] transition-colors hover:bg-blue-500">Launch Response Plan</button>
          </div>
        </div>
    </motion.div>
  );
}

function PortfolioPulseFeed({ onToast }: { onToast: ToastFn }) {
  const [events, setEvents] = useState<PulseEvent[]>(PULSE_EVENTS.slice(0, 5));
  const [idx, setIdx] = useState(0);
  const [simRunning, setSimRunning] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<PulseEvent | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [unseenCount, setUnseenCount] = useState(() => (
    PULSE_EVENTS.slice(0, 5).filter(ev => ev.severity === 'critical' || ev.severity === 'high').length
  ));
  const [muted, setMuted] = useState(() => {
    try {
      const saved = window.sessionStorage.getItem('4c360-portfolio-pulses-inline-muted');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });
  const eventIdSeed = useRef(0);

  useEffect(() => {
    const t = setInterval(() => {
      setIdx(i => i + 1);
    }, 12000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (idx > 0) {
      const next = PULSE_EVENTS[(4 + idx) % PULSE_EVENTS.length];
      if (next) setEvents(prev => {
        eventIdSeed.current += 1;
        const updated = [{ ...next, id: `${next.id}-${idx}-${eventIdSeed.current}`, time: 'Just now' }, ...prev];
        return updated.slice(0, 7);
      });
      if (next && (next.severity === 'critical' || next.severity === 'high')) {
        setUnseenCount(count => panelOpen ? 0 : Math.min(count + 1, 9));
      }
    }
  }, [idx, panelOpen]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem('4c360-portfolio-pulses-inline-muted', muted ? 'true' : 'false');
    } catch {
      // Ignore blocked storage; muting still works for this render.
    }
  }, [muted]);

  const attentionEvents = events
    .filter(ev => ev.severity === 'critical' || ev.severity === 'high')
    .slice(0, 4);

  function runSimulation() {
    if (simRunning) return;
    setSimRunning(true);
    SIMULATION_EVENTS.forEach((event, step) => {
      window.setTimeout(() => {
        eventIdSeed.current += 1;
        setEvents(prev => [{ ...event, id: `${event.id}-${Date.now()}-${eventIdSeed.current}` }, ...prev].slice(0, 8));
        if (event.severity === 'critical' || event.severity === 'high') {
          setUnseenCount(count => panelOpen ? 0 : Math.min(count + 1, 9));
        }
        if (step === SIMULATION_EVENTS.length - 1) {
          window.setTimeout(() => setSimRunning(false), 900);
        }
      }, step * 900);
    });
  }

  const pulseBlinking = unseenCount > 0;

  function togglePanel() {
    setPanelOpen(open => {
      const nextOpen = !open;
      if (nextOpen) setUnseenCount(0);
      return nextOpen;
    });
  }

  return (
    <>
      <div className="relative" data-demo-anchor="portfolio-pulse-feed">
        <button
          type="button"
          onClick={togglePanel}
          className={`relative flex min-w-[116px] items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition-all ${
            panelOpen
              ? 'border-cyan-300/36 bg-cyan-300/12 text-cyan-100'
              : 'border-[#2E7FFF]/22 bg-[#112040] text-[#BFD8FF] hover:border-[#2E7FFF]/45 hover:bg-[#17315A]'
          } ${pulseBlinking ? 'animate-pulse shadow-[0_0_18px_rgba(34,211,238,0.28)]' : ''}`}
          aria-expanded={panelOpen}
          aria-label="Open portfolio pulse notifications"
        >
          {muted ? <BellOff size={13} /> : <BellRing size={13} />}
          <span>Pulse</span>
          <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-black ${pulseBlinking ? 'bg-red-400 text-white' : 'bg-[#0A1628] text-[#8DBDFF]'}`}>
            {unseenCount > 0 ? unseenCount : attentionEvents.length}
          </span>
        </button>

        <AnimatePresence>
          {panelOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className="absolute right-0 top-[calc(100%+8px)] z-[360] w-[min(360px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-[#2E7FFF]/28 bg-[#07111F]/98 shadow-2xl shadow-black/45 backdrop-blur"
            >
              <div className="flex items-center justify-between gap-2 border-b border-[#2E7FFF]/14 px-3 py-2.5">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200">Portfolio Pulse</div>
                  <div className="mt-0.5 text-[10px] font-semibold text-[#7A94B4]">
                    {muted ? 'Quiet by default. Open when needed.' : 'Notifications enabled.'}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMuted(current => !current)}
                    className="rounded-lg border border-[#2E7FFF]/18 bg-[#0A1628] px-2 py-1 text-[9px] font-black text-[#BFD8FF] transition-colors hover:bg-[#112040]"
                  >
                    {muted ? 'Unmute' : 'Mute'}
                  </button>
                  <button
                    type="button"
                    onClick={runSimulation}
                    disabled={simRunning}
                    className="rounded-lg border border-cyan-500/28 bg-cyan-500/10 px-2 py-1 text-[9px] font-black text-cyan-200 transition-colors hover:bg-cyan-500/15 disabled:opacity-50"
                  >
                    {simRunning ? 'Running' : 'Test'}
                  </button>
                </div>
              </div>

              <div className="max-h-[360px] space-y-2 overflow-y-auto p-2 custom-scrollbar">
                {attentionEvents.map((ev, eventIndex) => {
                  const border = PULSE_SEV_BORDER[ev.severity];
                  const cfg = PULSE_SEV_ICON[ev.severity];
                  const plan = buildPulseCommandPlan(ev);
                  const urgentTone = ev.severity === 'critical'
                    ? 'bg-red-500/12'
                    : 'bg-amber-500/10';

                  return (
                    <motion.div
                      key={`${ev.id}-${eventIndex}`}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.18, delay: eventIndex * 0.03 }}
                      className={`group relative overflow-hidden rounded-xl border border-l-4 border-[#2E7FFF]/14 ${border} ${urgentTone}`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedEvent(ev)}
                        className="flex w-full items-start gap-3 px-3 py-2.5 pr-10 text-left focus:outline-none focus:ring-1 focus:ring-[#2E7FFF]/70"
                      >
                        <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${cfg.cls}`}>
                          {cfg.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div className="truncate text-[10px] font-black uppercase tracking-[0.12em] text-[#8DBDFF]">{ev.client}</div>
                            <span className="rounded-full border border-white/10 bg-black/15 px-1.5 py-0.5 text-[8px] font-black uppercase text-[#B8C7DB]">{ev.time}</span>
                          </div>
                          <div className="mt-1 text-[12px] font-black leading-snug text-[#EEF3FA]">{ev.title}</div>
                          <div className="mt-1 line-clamp-2 text-[10px] leading-4 text-[#9DB9E8]">{ev.sub}</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={event => {
                          event.stopPropagation();
                          void shareCommandCard(
                            `${ev.client}: ${ev.title}`,
                            `${plan.decision}\nOwner: ${plan.owner}\nDeadline: ${plan.deadline}\nClient update: ${plan.updateDraft}`,
                            onToast,
                          );
                        }}
                        className="absolute right-2 top-2 rounded-lg border border-white/10 bg-black/10 p-1.5 text-[#7A94B4] opacity-75 transition-colors hover:border-[#2E7FFF]/35 hover:bg-[#2E7FFF]/12 hover:text-[#BFD8FF] group-hover:opacity-100"
                        aria-label={`Share ${ev.title} event summary`}
                        title="Share event"
                      >
                        <Share2 size={12} />
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedEvent && (
          <>
            <div className="fixed inset-0 z-[300] bg-black/35 backdrop-blur-[1px]" onClick={() => setSelectedEvent(null)} />
            <PulseEventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} onToast={onToast} />
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function MetricPill({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="flex min-w-0 flex-col items-center bg-[#0A1628] rounded-lg px-2 py-1.5">
      <span className={`text-[13px] font-bold leading-tight ${color}`}>{value}</span>
      <span className="text-[8px] text-[#7A94B4] uppercase tracking-wide mt-0.5 text-center">{label}</span>
    </div>
  );
}

function CardActions({
  client,
  onToast,
  onNavigateToIncidents,
  onNavigateToCommand,
  onReport,
}: {
  client: PortfolioClient;
  onToast: ToastFn;
  onNavigateToIncidents: (clientId: string) => void;
  onNavigateToCommand: (clientId: string, clientName?: string) => void;
  onReport: (c: PortfolioClient) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-1 pt-2 border-t border-[rgba(46,127,255,0.1)]">
      <button
        onClick={e => { e.stopPropagation(); onNavigateToCommand(client.id, client.name); }}
        data-demo-anchor="portfolio-command-path"
        data-demo-action="portfolio-open-command"
        className="flex flex-col items-center gap-0.5 py-1.5 rounded-lg bg-[rgba(46,127,255,0.1)] hover:bg-[rgba(46,127,255,0.2)] text-cyan-400 transition-colors"
        title="Command Center"
      >
        <Activity size={11} />
        <span className="text-[8px] font-semibold">Command</span>
      </button>
      <button
        onClick={e => { e.stopPropagation(); onNavigateToIncidents(client.id); }}
        className="flex flex-col items-center gap-0.5 py-1.5 rounded-lg bg-[rgba(46,127,255,0.1)] hover:bg-[rgba(46,127,255,0.2)] text-amber-400 transition-colors"
        title="View Incidents"
      >
        <AlertTriangle size={11} />
        <span className="text-[8px] font-semibold">Incidents</span>
      </button>
      <button
        onClick={e => { e.stopPropagation(); onReport(client); }}
        className="flex flex-col items-center gap-0.5 py-1.5 rounded-lg bg-[rgba(46,127,255,0.1)] hover:bg-[rgba(46,127,255,0.2)] text-emerald-400 transition-colors"
        title="Generate Report"
      >
        <TrendingUp size={11} />
        <span className="text-[8px] font-semibold">Report</span>
      </button>
    </div>
  );
}

function ClientPortfolioCard({
  client,
  demoAnchor,
  onSelect,
  onDismiss,
  onToast,
  onReport,
  view,
  onNavigateToIncidents,
  onNavigateToCommand,
}: {
  client: PortfolioClient;
  demoAnchor?: string;
  onSelect: (c: PortfolioClient) => void;
  onDismiss: (clientId: string) => void;
  onToast: ToastFn;
  onReport: (c: PortfolioClient) => void;
  view: 'grid' | 'list';
  onNavigateToIncidents: (clientId: string) => void;
  onNavigateToCommand: (clientId: string, clientName?: string) => void;
}) {
  const slaColor = client.sla >= 90 ? 'text-emerald-400' : client.sla >= 80 ? 'text-amber-400' : 'text-red-400';
  const compColor = client.compliance >= 90 ? 'text-emerald-400' : client.compliance >= 80 ? 'text-amber-400' : 'text-red-400';
  const commandProfile = getCommandProfile(client);
  const visibleSources = client.dataSources.length > 0 ? client.dataSources : [{ label: 'Data onboarding', count: commandProfile.coverage }];

  if (view === 'list') {
    return (
      <motion.div
        whileTap={{ scale: 0.995 }}
        exit={{ opacity: 0, scale: 0.98 }}
        data-demo-anchor={demoAnchor}
        className={`relative w-full flex flex-col rounded-xl border bg-[rgba(17,32,64,0.7)] overflow-hidden ${STATUS_BORDER[client.status]} ${STATUS_GLOW[client.status]}`}
      >
        <button
          onClick={e => { e.stopPropagation(); onDismiss(client.id); }}
          className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-[#0A1628]/90 text-[#7A94B4] opacity-75 transition-all hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-100 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-400/40"
          title="Hide property card"
          aria-label={`Hide ${client.name} card`}
        >
          <X size={13} />
        </button>
        <button
          onClick={() => onSelect(client)}
          className="w-full text-left flex flex-col gap-3 px-4 py-3 pr-12 hover:bg-white/[0.02] transition-colors xl:flex-row xl:items-center xl:gap-4"
        >
          <div className="flex items-center gap-2 w-full xl:w-52 xl:flex-shrink-0">
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${STATUS_DOT[client.status]}`} />
            <div className="min-w-0">
              <div className="text-[13px] text-[#EEF3FA] font-bold leading-tight">{client.name}</div>
              <div className="text-[9px] text-[#7A94B4]">{client.region} · {client.sector}</div>
            </div>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3 xl:flex xl:flex-1">
            <MetricPill label="Sites"   value={client.sites}      color="text-[#EEF3FA]" />
            <MetricPill label="WOs"     value={client.workOrders} color="text-blue-400" />
            <MetricPill label="Incidents" value={client.incidents} color={client.incidents > 5 ? 'text-red-400' : client.incidents > 2 ? 'text-amber-400' : 'text-emerald-400'} />
            <MetricPill label="SLA"     value={`${client.sla}%`}  color={slaColor} />
            <MetricPill label="Comply"  value={`${client.compliance}%`} color={compColor} />
          </div>
          <div className={`text-[10px] font-bold px-2 py-1 rounded-lg border capitalize flex-shrink-0 ${RISK_BADGE[client.riskLevel]}`}>
            {client.riskLevel}
          </div>
          <div className="flex max-w-full flex-wrap gap-1 xl:flex-shrink-0">
            {visibleSources.map(ds => (
              <span key={ds.label} className="text-[9px] bg-[rgba(46,127,255,0.1)] border border-[rgba(46,127,255,0.2)] text-blue-300 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                {ds.label} <span className="opacity-60">·{ds.count.toLocaleString()}</span>
              </span>
            ))}
          </div>
          <ChevronRight size={14} className="text-[#7A94B4] flex-shrink-0" />
        </button>
        <div className="px-4 pb-2.5">
          <CardActions client={client} onToast={onToast} onNavigateToIncidents={onNavigateToIncidents} onNavigateToCommand={onNavigateToCommand} onReport={onReport} />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      data-demo-anchor={demoAnchor}
      className={`relative flex min-w-0 flex-col rounded-xl border bg-[rgba(17,32,64,0.7)] overflow-hidden ${STATUS_BORDER[client.status]} ${STATUS_GLOW[client.status]}`}
    >
      <div className={`h-1 w-full ${RISK_STRIP[client.riskLevel]}`} />
      <button
        onClick={e => { e.stopPropagation(); onDismiss(client.id); }}
        className="absolute right-2.5 top-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-[#0A1628]/90 text-[#7A94B4] opacity-75 shadow-lg transition-all hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-100 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-400/40"
        title="Hide property card"
        aria-label={`Hide ${client.name} card`}
      >
        <X size={13} />
      </button>

      <button
        onClick={() => onSelect(client)}
        className="p-3 flex-1 flex flex-col gap-2.5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5 ${STATUS_DOT[client.status]}`} />
            <div className="min-w-0 pr-1">
              <div className="text-[13px] text-[#EEF3FA] font-bold leading-tight">{client.name}</div>
              <div className="text-[9px] text-[#7A94B4] mt-0.5">{client.region} · {client.sector}</div>
            </div>
          </div>
          <div className={`mr-8 text-[9px] font-bold px-2 py-0.5 rounded-lg border capitalize flex-shrink-0 ${RISK_BADGE[client.riskLevel]}`}>
            {client.riskLevel}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 2xl:grid-cols-5">
          <MetricPill label="Sites"    value={client.sites}      color="text-[#EEF3FA]" />
          <MetricPill label="WOs"      value={client.workOrders} color="text-blue-400" />
          <MetricPill label="Inc."     value={client.incidents}  color={client.incidents > 5 ? 'text-red-400' : client.incidents > 2 ? 'text-amber-400' : 'text-emerald-400'} />
          <MetricPill label="SLA"      value={`${client.sla}%`}  color={slaColor} />
          <MetricPill label="Comply"   value={`${client.compliance}%`} color={compColor} />
        </div>

        <div className="flex flex-wrap gap-1">
          {visibleSources.map(ds => (
            <span key={ds.label} className="text-[9px] bg-[rgba(46,127,255,0.1)] border border-[rgba(46,127,255,0.2)] text-blue-300 px-1.5 py-0.5 rounded-full whitespace-nowrap">
              {ds.label} <span className="opacity-60">·{ds.count.toLocaleString()}</span>
            </span>
          ))}
        </div>

        <div className="flex items-start gap-1.5 p-2 bg-[rgba(6,182,212,0.05)] border border-cyan-500/10 rounded-lg">
          <Zap size={10} className="text-cyan-400 flex-shrink-0 mt-0.5" />
          <span className="text-[10px] text-[#7A94B4] leading-snug line-clamp-2">{client.aiInsight || `${commandProfile.firstDue}. Data coverage at ${commandProfile.coverage}%.`}</span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className={`text-[9px] font-semibold capitalize flex items-center gap-1 ${STATUS_TEXT[client.status]}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[client.status]}`} />
            {client.status}
          </span>
          <span className="text-[9px] text-[#7A94B4]">Updated {client.lastUpdated}</span>
        </div>
      </button>

      <div className="px-3 pb-3">
        <CardActions client={client} onToast={onToast} onNavigateToIncidents={onNavigateToIncidents} onNavigateToCommand={onNavigateToCommand} onReport={onReport} />
      </div>
    </motion.div>
  );
}

function ArcGauge({ value, label, color }: { value: number; label: string; color: string }) {
  const cx = 45;
  const cy = 45;
  const r = 36;
  const stroke = 7;

  const polarToCartesian = (angle: number) => ({
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  });

  const arcPath = (from: number, to: number) => {
    const s = polarToCartesian(from);
    const e = polarToCartesian(to);
    const large = Math.abs(to - from) > Math.PI ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y}`;
  };

  const pct = Math.min(Math.max(value, 0), 100) / 100;
  const angle80 = Math.PI - 0.8 * Math.PI;
  const angle90 = Math.PI - 0.9 * Math.PI;
  const m80 = polarToCartesian(angle80);
  const m90 = polarToCartesian(angle90);

  const circumference = Math.PI * r;
  const dashOffset = circumference * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: cx * 2, height: cy + stroke }}>
        <svg width={cx * 2} height={cy + stroke} style={{ overflow: 'visible' }}>
          <path d={arcPath(Math.PI, 0)} fill="none" stroke="rgba(46,127,255,0.15)" strokeWidth={stroke} strokeLinecap="round" />
          <motion.path
            d={arcPath(Math.PI, 0)}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
          <circle cx={m80.x} cy={m80.y} r={3} fill="#FF9B38" opacity={0.8} />
          <circle cx={m90.x} cy={m90.y} r={3} fill="#38D98A" opacity={0.8} />
        </svg>
        <div className="absolute inset-0 flex items-end justify-center pb-0.5">
          <span className="text-lg font-bold" style={{ color }}>{value}%</span>
        </div>
      </div>
      <span className="text-[10px] text-[#7A94B4] uppercase tracking-wide">{label}</span>
    </div>
  );
}

function ReportSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-[rgba(46,127,255,0.15)]">
        <div className="text-blue-400">{icon}</div>
        <span className="text-[11px] font-bold text-[#EEF3FA] uppercase tracking-widest">{title}</span>
      </div>
      {children}
    </div>
  );
}

function KPITile({ label, value, color, sub }: { label: string; value: string | number; color: string; sub?: string }) {
  const colorMap: Record<string, string> = {
    green: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
    red: 'text-red-400 bg-red-500/10 border-red-500/25',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/25',
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/25',
    white: 'text-[#EEF3FA] bg-white/5 border-white/10',
  };
  return (
    <div className={`rounded-xl border px-3 py-3 flex flex-col gap-1 ${colorMap[color] ?? colorMap.white}`}>
      <span className={`text-2xl font-bold leading-tight ${colorMap[color]?.split(' ')[0]}`}>{value}</span>
      <span className="text-[9px] text-[#7A94B4] uppercase tracking-wide leading-tight">{label}</span>
      {sub && <span className="text-[9px] text-[#7A94B4] opacity-70">{sub}</span>}
    </div>
  );
}

function ClientReportPanel({
  client,
  onClose,
  demoAutoScroll = false,
}: {
  client: PortfolioClient;
  onClose: () => void;
  demoAutoScroll?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareMode, setShareMode] = useState<'menu' | 'email'>('menu');
  const [emailTo, setEmailTo] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailResult, setEmailResult] = useState<'idle' | 'sent' | 'error'>('idle');
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  useEffect(() => {
    if (!demoAutoScroll) return undefined;
    const timer = window.setTimeout(() => {
      scrollRef.current?.scrollTo({ top: 210, behavior: 'smooth' });
    }, 1100);
    return () => window.clearTimeout(timer);
  }, [client.id, demoAutoScroll]);

  function closeShare() {
    setShareOpen(false);
    setShareMode('menu');
    setEmailTo('');
    setEmailResult('idle');
    setCopyFailed(false);
  }

  function handleCopyLink() {
    const url = `${window.location.origin}${window.location.pathname}?report=${client.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setCopyFailed(false);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      setCopyFailed(true);
      setTimeout(() => setCopyFailed(false), 3000);
    });
  }

  async function handleSendEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!emailTo) return;
    setEmailSending(true);
    setEmailResult('idle');
    try {
      const apiBase = (import.meta.env.VITE_API_URL ?? '/api') as string;
      const res = await fetch(`${apiBase}/share-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailTo,
          client: {
            id: client.id,
            name: client.name,
            riskLevel: client.riskLevel,
            sla: client.sla,
            compliance: client.compliance,
            incidents: client.incidents,
            resources: client.resources,
          },
        }),
      });
      if (res.ok) {
        setEmailResult('sent');
        setTimeout(() => closeShare(), 2000);
      } else {
        setEmailResult('error');
      }
    } catch {
      setEmailResult('error');
    } finally {
      setEmailSending(false);
    }
  }

  const slaColor = client.sla >= 90 ? '#38D98A' : client.sla >= 80 ? '#FF9B38' : '#FF4B4B';
  const compColor = client.compliance >= 90 ? '#38D98A' : client.compliance >= 80 ? '#FF9B38' : '#FF4B4B';
  const slaGaugeColor = client.sla >= 90 ? '#38D98A' : client.sla >= 80 ? '#FF9B38' : '#FF4B4B';
  const compGaugeColor = client.compliance >= 90 ? '#38D98A' : client.compliance >= 80 ? '#FF9B38' : '#FF4B4B';

  const dsQuality = (ds: { count: number }) => {
    if (ds.count === 0) return 0;
    if (ds.count >= 500) return 96;
    if (ds.count >= 100) return 88;
    return 74;
  };

  const kpiColor = (val: number, good: number, warn: number, invert = false): string => {
    if (invert) return val === 0 ? 'green' : val <= warn ? 'amber' : 'red';
    return val >= good ? 'green' : val >= warn ? 'amber' : 'red';
  };

  const budgetPct = Math.round((client.resources.budgetUsed / client.resources.budgetTotal) * 100);

  return (
    <motion.div
      key={`report-${client.id}`}
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute right-0 top-0 bottom-0 w-[520px] z-[300] bg-[#0A1628] border-l border-[rgba(46,127,255,0.3)] shadow-2xl flex flex-col"
    >
      <div className={`h-1 w-full ${RISK_STRIP[client.riskLevel]}`} />

      <div className="flex flex-col gap-3 px-5 py-3 border-b border-[rgba(46,127,255,0.15)] flex-shrink-0 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2.5">
          <FileText size={14} className="text-blue-400" />
          <div>
            <div className="text-[#EEF3FA] font-bold text-sm leading-tight">Property Insight Report</div>
            <div className="text-[10px] text-[#7A94B4]">Snapshot · {client.lastUpdated}</div>
          </div>
        </div>
        <div className="flex items-center gap-1 relative">
          {/* Share button */}
          <button
            onClick={() => { setShareOpen(v => !v); setShareMode('menu'); setEmailResult('idle'); }}
            className="text-[#7A94B4] hover:text-white transition-colors p-1 rounded"
            title="Share report"
          >
            <Share2 size={15} />
          </button>
          <button onClick={onClose} className="text-[#7A94B4] hover:text-white transition-colors p-1">
            <X size={16} />
          </button>

          {/* Share popover */}
          <AnimatePresence>
            {shareOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: -6 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-8 z-[400] w-64 bg-[#0F1E35] border border-[rgba(46,127,255,0.3)] rounded-xl shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                {shareMode === 'menu' && (
                  <div className="p-2">
                    <div className="text-[10px] text-[#4A7FBF] font-semibold uppercase tracking-wider px-3 py-1.5">Share Report</div>
                    <button
                      onClick={handleCopyLink}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-[rgba(46,127,255,0.1)] transition-colors text-left"
                    >
                      {copied ? <Check size={14} className="text-green-400 flex-shrink-0" /> : <Link2 size={14} className={`flex-shrink-0 ${copyFailed ? 'text-red-400' : 'text-[#7A94B4]'}`} />}
                      <span className={`text-sm ${copied ? 'text-green-400' : copyFailed ? 'text-red-400' : 'text-[#EEF3FA]'}`}>{copied ? 'Copied!' : copyFailed ? 'Copy failed' : 'Copy Link'}</span>
                    </button>
                    <button
                      onClick={() => setShareMode('email')}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-[rgba(46,127,255,0.1)] transition-colors text-left"
                    >
                      <Mail size={14} className="text-[#7A94B4] flex-shrink-0" />
                      <span className="text-sm text-[#EEF3FA]">Email Report</span>
                    </button>
                  </div>
                )}

                {shareMode === 'email' && (
                  <div className="p-3">
                    <button
                      onClick={() => setShareMode('menu')}
                      className="text-[10px] text-[#4A7FBF] hover:text-blue-400 font-semibold uppercase tracking-wider flex items-center gap-1 mb-3 transition-colors"
                    >
                      ← Back
                    </button>
                    <form onSubmit={handleSendEmail} className="flex flex-col gap-2">
                      <input
                        type="email"
                        placeholder="recipient@example.com"
                        value={emailTo}
                        onChange={e => setEmailTo(e.target.value)}
                        required
                        disabled={emailSending || emailResult === 'sent'}
                        className="w-full bg-[#0A1628] border border-[rgba(46,127,255,0.3)] rounded-lg px-3 py-2 text-sm text-[#EEF3FA] placeholder-[#4A7FBF] focus:outline-none focus:border-blue-500 disabled:opacity-50"
                      />
                      {emailResult === 'error' && (
                        <p className="text-xs text-red-400">Failed to send. Please try again.</p>
                      )}
                      {emailResult === 'sent' && (
                        <p className="text-xs text-green-400 flex items-center gap-1"><Check size={11} /> Sent successfully!</p>
                      )}
                      <button
                        type="submit"
                        disabled={emailSending || emailResult === 'sent' || !emailTo}
                        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-2 px-3 rounded-lg transition-colors"
                      >
                        {emailSending ? (
                          <span className="animate-pulse">Sending…</span>
                        ) : (
                          <><Send size={13} /> Send</>
                        )}
                      </button>
                    </form>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">

        <ReportSection title="Executive Summary" icon={<Shield size={13} />}>
          <div className="flex items-start gap-3 p-3 bg-[rgba(17,32,64,0.8)] rounded-xl border border-[rgba(46,127,255,0.12)]">
            <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${STATUS_DOT[client.status]}`} />
            <div className="flex-1 min-w-0">
              <div className="text-base font-bold text-[#EEF3FA] leading-tight">{client.name}</div>
              <div className="text-[10px] text-[#7A94B4] mt-0.5">{client.region} · {client.sector}</div>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${STATUS_TEXT[client.status]} bg-transparent border-current/30`}>
                  {client.status}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${RISK_BADGE[client.riskLevel]}`}>
                  {client.riskLevel} risk
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300">
                  {client.contract.tier}
                </span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide">Last Updated</div>
              <div className="text-[11px] text-[#EEF3FA] font-semibold mt-0.5">{client.lastUpdated}</div>
            </div>
          </div>
        </ReportSection>

        <ReportSection title="KPI Scorecard" icon={<BarChart2 size={13} />}>
          <div className="grid grid-cols-3 gap-2">
            <KPITile label="Sites"         value={client.sites}       color="white" />
            <KPITile label="Work Orders"   value={client.workOrders}  color="blue" />
            <KPITile label="Incidents"     value={client.incidents}   color={kpiColor(client.incidents, 0, 3, true)} />
            <KPITile label="Overdue Tasks" value={client.overdueTasks} color={kpiColor(client.overdueTasks, 0, 2, true)} />
            <KPITile label="SLA %"         value={`${client.sla}%`}   color={kpiColor(client.sla, 90, 80)} />
            <KPITile label="Compliance %"  value={`${client.compliance}%`} color={kpiColor(client.compliance, 90, 80)} />
          </div>
        </ReportSection>

        <ReportSection title="Performance Gauges" icon={<Activity size={13} />}>
          <div className="flex justify-around items-end py-2">
            <ArcGauge value={client.sla} label="SLA Performance" color={slaGaugeColor} />
            <div className="flex flex-col items-center gap-2 text-[9px] text-[#7A94B4]">
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400/70 inline-block" />80% threshold</div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400/70 inline-block" />90% threshold</div>
            </div>
            <ArcGauge value={client.compliance} label="Compliance" color={compGaugeColor} />
          </div>
        </ReportSection>

        <ReportSection title="Top Sites Health" icon={<MapPin size={13} />}>
          <div className="space-y-2">
            {client.topSites.map((site, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 bg-[rgba(17,32,64,0.6)] rounded-lg border border-[rgba(46,127,255,0.08)]">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${SITE_STATUS_DOT[site.status]}`} />
                <span className="text-[12px] text-[#EEF3FA] flex-1 truncate">{site.name}</span>
                <span className={`text-[9px] capitalize font-semibold flex-shrink-0 ${site.status === 'ok' ? 'text-emerald-400' : site.status === 'warning' ? 'text-amber-400' : 'text-red-400'}`}>
                  {site.status}
                </span>
                {site.incidents > 0 ? (
                  <span className="text-[9px] text-red-400 font-bold flex-shrink-0 bg-red-500/10 px-1.5 py-0.5 rounded-full border border-red-500/20">
                    {site.incidents} inc.
                  </span>
                ) : (
                  <span className="text-[9px] text-emerald-400 flex-shrink-0">Clear</span>
                )}
              </div>
            ))}
          </div>
        </ReportSection>

        <ReportSection title="Data Source Quality" icon={<Database size={13} />}>
          <div className="space-y-3">
            {client.dataSources.map(ds => {
              const q = dsQuality(ds);
              const qColor = q >= 90 ? '#38D98A' : q >= 70 ? '#FF9B38' : '#FF4B4B';
              const qLabel = q >= 90 ? 'Excellent' : q >= 70 ? 'Good' : 'Poor';
              return (
                <div key={ds.label}>
                  <div className="flex justify-between text-[10px] mb-1.5">
                    <span className="text-[#EEF3FA] font-medium">{ds.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#7A94B4]">{ds.count > 0 ? `${ds.count.toLocaleString()} rec.` : 'Error'}</span>
                      <span className="font-bold" style={{ color: qColor }}>{q}% · {qLabel}</span>
                    </div>
                  </div>
                  <AnimatedBar value={q} color={qColor} height="h-1.5" />
                </div>
              );
            })}
          </div>
        </ReportSection>

        <ReportSection title="Incident Breakdown" icon={<AlertTriangle size={13} />}>
          <div className="p-3 bg-[rgba(17,32,64,0.6)] rounded-xl border border-[rgba(46,127,255,0.1)] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-[#EEF3FA]">{client.incidents}</div>
                <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide">Total Incidents</div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-bold capitalize ${RISK_BADGE[client.riskLevel].split(' ')[0]}`}>{client.riskLevel} Risk</div>
                <div className="text-[9px] text-[#7A94B4]">Current severity</div>
              </div>
            </div>
            {client.overdueTasks > 0 && (
              <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                <Clock size={11} className="text-red-400 flex-shrink-0" />
                <span className="text-[10px] text-red-300">{client.overdueTasks} overdue task{client.overdueTasks !== 1 ? 's' : ''} require immediate attention</span>
              </div>
            )}
            <div className="flex items-start gap-2 p-2 bg-[rgba(6,182,212,0.05)] border border-cyan-500/10 rounded-lg">
              <Zap size={10} className="text-cyan-400 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-[#7A94B4] leading-relaxed">{client.aiInsight}</p>
            </div>
          </div>
        </ReportSection>

        <ReportSection title="Recent Activity Timeline" icon={<Clock size={13} />}>
          <div className="relative pl-4">
            <div className="absolute left-1.5 top-0 bottom-0 w-px bg-[rgba(46,127,255,0.2)]" />
            <div className="space-y-3">
              {client.recentActivity.map((act, i) => {
                const col = ACTIVITY_COLOR[act.type] || 'text-[#7A94B4]';
                const icon = ACTIVITY_ICON[act.type] || <Clock size={10} />;
                return (
                  <div key={i} className="relative flex items-start gap-3">
                    <div className={`absolute -left-[13px] w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${col} bg-[#0A1628] border border-[rgba(46,127,255,0.2)]`}>
                      {icon}
                    </div>
                    <div className="flex-1 pl-1">
                      <div className="text-[11px] text-[#EEF3FA] leading-snug">{act.event}</div>
                      <div className="text-[9px] text-[#7A94B4] mt-0.5">{act.time}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ReportSection>

        <ReportSection title="AI Insight" icon={<Bot size={13} />}>
          <div className="p-4 bg-[rgba(6,182,212,0.07)] border border-cyan-500/25 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center flex-shrink-0">
                <Zap size={14} className="text-cyan-400" />
              </div>
              <div className="flex-1">
                <p className="text-[12px] text-[#EEF3FA] leading-relaxed">{client.aiInsight}</p>
                <div className="flex items-center gap-1 mt-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-[9px] text-cyan-400 font-semibold uppercase tracking-wider">Powered by DevelopmentX AI</span>
                </div>
              </div>
            </div>
          </div>
        </ReportSection>

        <ReportSection title="Contract Snapshot" icon={<Calendar size={13} />}>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 bg-[rgba(17,32,64,0.6)] rounded-lg border border-[rgba(46,127,255,0.1)]">
                <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1">Contract Tier</div>
                <div className="text-[13px] font-bold text-blue-300">{client.contract.tier}</div>
              </div>
              <div className="p-2.5 bg-[rgba(17,32,64,0.6)] rounded-lg border border-[rgba(46,127,255,0.1)]">
                <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1">Annual Value</div>
                <div className="text-[13px] font-bold text-emerald-400">{client.contract.annualValue}</div>
              </div>
              <div className="p-2.5 bg-[rgba(17,32,64,0.6)] rounded-lg border border-[rgba(46,127,255,0.1)]">
                <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1">Renewal Date</div>
                <div className="text-[12px] font-semibold text-[#EEF3FA]">{client.contract.renewalDate}</div>
              </div>
              <div className="p-2.5 bg-[rgba(17,32,64,0.6)] rounded-lg border border-[rgba(46,127,255,0.1)]">
                <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1">Contract No.</div>
                <div className="text-[10px] font-mono text-[#7A94B4]">{client.contract.number}</div>
              </div>
            </div>
            <div className="p-2.5 bg-[rgba(17,32,64,0.6)] rounded-lg border border-[rgba(46,127,255,0.1)]">
              <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-2">Response SLA Targets</div>
              <div className="space-y-1">
                {client.contract.responseTimes.map(rt => (
                  <div key={rt.severity} className="flex items-center justify-between text-[10px]">
                    <span className="text-[#7A94B4]">{rt.severity}</span>
                    <span className="text-[#EEF3FA] font-semibold">{rt.target}</span>
                  </div>
                ))}
              </div>
            </div>
            {client.contract.penalties && (
              <div className="flex items-start gap-2 p-2.5 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                <AlertTriangle size={11} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-[9px] text-amber-400 font-semibold uppercase tracking-wide mb-0.5">Penalty Clause</div>
                  <div className="text-[10px] text-[#7A94B4] leading-snug">{client.contract.penalties}</div>
                </div>
              </div>
            )}
          </div>
        </ReportSection>

        <ReportSection title="Resource Overview" icon={<Wrench size={13} />}>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-[10px] mb-1.5">
                <span className="text-[#7A94B4]">Budget Utilisation</span>
                <span className={`font-bold ${budgetPct >= 90 ? 'text-red-400' : budgetPct >= 75 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  AED {(client.resources.budgetUsed / 1000).toFixed(0)}K / {(client.resources.budgetTotal / 1000).toFixed(0)}K · {budgetPct}%
                </span>
              </div>
              <AnimatedBar
                value={budgetPct}
                color={budgetPct >= 90 ? '#FF4B4B' : budgetPct >= 75 ? '#FF9B38' : '#38D98A'}
                height="h-2"
              />
            </div>

            {client.resources.fleet.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Truck size={10} className="text-blue-400" />
                  <span className="text-[9px] text-[#7A94B4] uppercase tracking-wide">Fleet Availability</span>
                </div>
                <div className="space-y-1.5">
                  {client.resources.fleet.map(f => (
                    <div key={f.label} className="flex items-center justify-between text-[10px]">
                      <span className="text-[#7A94B4]">{f.label}</span>
                      <span className={`font-semibold ${f.available === f.total ? 'text-emerald-400' : f.available > 0 ? 'text-amber-400' : 'text-red-400'}`}>
                        {f.available}/{f.total} available
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {client.resources.partsStock.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Package size={10} className="text-purple-400" />
                  <span className="text-[9px] text-[#7A94B4] uppercase tracking-wide">Spare Parts Stock</span>
                </div>
                <div className="space-y-1">
                  {client.resources.partsStock.map(p => (
                    <div key={p.name} className="flex items-center justify-between text-[10px]">
                      <span className="text-[#7A94B4] truncate max-w-[60%]">{p.name}</span>
                      <span className={`font-semibold flex-shrink-0 ${p.status === 'ok' ? 'text-emerald-400' : p.status === 'low' ? 'text-amber-400' : 'text-red-400'}`}>
                        {p.qty} units · {p.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {client.resources.equipment.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Wrench size={10} className="text-cyan-400" />
                  <span className="text-[9px] text-[#7A94B4] uppercase tracking-wide">Equipment Condition</span>
                </div>
                <div className="space-y-2">
                  {client.resources.equipment.map(eq => {
                    const eqColor = eq.condition >= 90 ? '#38D98A' : eq.condition >= 70 ? '#FF9B38' : '#FF4B4B';
                    return (
                      <div key={eq.name}>
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-[#7A94B4]">{eq.name}</span>
                          <span className="font-semibold" style={{ color: eqColor }}>{eq.condition}% · Next: {eq.nextService}</span>
                        </div>
                        <AnimatedBar value={eq.condition} color={eqColor} height="h-1" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </ReportSection>

      </div>

      <div className="px-5 py-3 border-t border-[rgba(46,127,255,0.15)] flex-shrink-0 flex items-center gap-2">
        <div className="flex items-center gap-1.5 flex-1">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          <span className="text-[9px] text-[#7A94B4]">Static snapshot · {client.lastUpdated}</span>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 text-[11px] font-semibold text-[#7A94B4] border border-[rgba(46,127,255,0.2)] rounded-lg hover:text-white hover:border-[rgba(46,127,255,0.4)] transition-colors"
        >
          Close Report
        </button>
      </div>
    </motion.div>
  );
}

function ClientDetailDrawer({
  client,
  onClose,
  onToast,
  onNavigateToCommand,
  onReport,
}: {
  client: PortfolioClient;
  onClose: () => void;
  onToast: ToastFn;
  onNavigateToCommand: (clientId: string, clientName?: string) => void;
  onReport: (c: PortfolioClient) => void;
}) {
  const slaColor = client.sla >= 90 ? '#38D98A' : client.sla >= 80 ? '#FF9B38' : '#FF4B4B';
  const compColor = client.compliance >= 90 ? '#38D98A' : client.compliance >= 80 ? '#FF9B38' : '#FF4B4B';
  const dsQuality = (ds: { count: number }) => {
    if (ds.count === 0) return 0;
    if (ds.count >= 500) return 96;
    if (ds.count >= 100) return 88;
    return 74;
  };
  const commandProfile = getCommandProfile(client);
  const visibleSources = client.dataSources.length > 0 ? client.dataSources : [{ label: 'Data onboarding', count: commandProfile.coverage }];

  return (
    <AnimatePresence>
      {client && (
        <motion.div
          key={client.id}
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className="absolute right-0 top-0 bottom-0 w-80 z-[200] bg-[#112040] border-l border-[rgba(46,127,255,0.3)] shadow-2xl flex flex-col"
        >
          <div className={`h-1 w-full ${RISK_STRIP[client.riskLevel]}`} />

          <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(46,127,255,0.15)]">
            <div className="flex items-center gap-2.5">
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${STATUS_DOT[client.status]}`} />
              <div>
                <div className="text-[#EEF3FA] font-bold text-sm leading-tight">{client.name}</div>
                <div className="text-[10px] text-[#7A94B4]">{client.region} · {client.sector}</div>
              </div>
            </div>
            <button onClick={onClose} className="text-[#7A94B4] hover:text-white transition-colors">
              <X size={15} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
            <div>
              <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-2">AI Why This Matters</div>
              <div className="p-3 bg-[rgba(46,127,255,0.08)] border border-blue-500/20 rounded-xl">
                <div className="flex items-start gap-2">
                  <Bot size={13} className="text-blue-300 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-[#EEF3FA] leading-relaxed">{commandProfile.narrative}</p>
                </div>
              </div>
            </div>

            <div>
              <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-2">Next 3 Actions</div>
              <div className="space-y-1.5">
                {commandProfile.actions.map((action, i) => (
                  <div key={action} className="flex items-center gap-2 rounded-lg border border-[rgba(46,127,255,0.1)] bg-[#0A1628] p-2">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-[#2E7FFF]/15 text-[10px] font-bold text-blue-300">{i + 1}</span>
                    <span className="text-[10px] text-[#EEF3FA] leading-snug">{action}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-2">Property Overview</div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Sites',     value: client.sites,         color: 'text-[#EEF3FA]' },
                  { label: 'Work Orders', value: client.workOrders,  color: 'text-blue-400' },
                  { label: 'Incidents', value: client.incidents,     color: client.incidents > 5 ? 'text-red-400' : 'text-amber-400' },
                  { label: 'SLA',       value: `${client.sla}%`,     color: client.sla >= 90 ? 'text-emerald-400' : 'text-amber-400' },
                  { label: 'Compliance', value: `${client.compliance}%`, color: client.compliance >= 90 ? 'text-emerald-400' : 'text-amber-400' },
                  { label: 'Overdue',   value: client.overdueTasks,  color: client.overdueTasks > 0 ? 'text-red-400' : 'text-emerald-400' },
                ].map(r => (
                  <div key={r.label} className="bg-[#0A1628] rounded-lg p-2 text-center">
                    <div className={`text-[14px] font-bold leading-tight ${r.color}`}>{r.value}</div>
                    <div className="text-[8px] text-[#7A94B4] uppercase tracking-wide mt-0.5">{r.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-2">Top Sites</div>
              <div className="space-y-1.5">
                {client.topSites.map((site, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-[#0A1628] rounded-lg">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${SITE_STATUS_DOT[site.status]}`} />
                    <span className="text-[11px] text-[#EEF3FA] flex-1 truncate">{site.name}</span>
                    {site.incidents > 0 && (
                      <span className="text-[9px] text-red-400 font-semibold flex-shrink-0">{site.incidents} inc.</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-2">Risk Summary</div>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-[#7A94B4]">SLA Performance</span>
                    <span style={{ color: slaColor }}>{client.sla}%</span>
                  </div>
                  <AnimatedBar value={client.sla} color={slaColor} height="h-1.5" />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-[#7A94B4]">Compliance</span>
                    <span style={{ color: compColor }}>{client.compliance}%</span>
                  </div>
                  <AnimatedBar value={client.compliance} color={compColor} height="h-1.5" />
                </div>
              </div>
              <div className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold capitalize ${RISK_BADGE[client.riskLevel]}`}>
                <Shield size={10} /> {client.riskLevel} risk
              </div>
            </div>

            <div>
              <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-2">Executive Impact</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-2">
                  <div className="text-[8px] uppercase tracking-wide text-red-200/70">AED at Risk</div>
                  <div className="text-[13px] font-bold text-red-200">{formatAed(commandProfile.atRisk)}</div>
                </div>
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2">
                  <div className="text-[8px] uppercase tracking-wide text-emerald-200/70">Avoided</div>
                  <div className="text-[13px] font-bold text-emerald-200">{formatAed(commandProfile.prevented)}</div>
                </div>
                <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-2">
                  <div className="text-[8px] uppercase tracking-wide text-cyan-200/70">Sentiment</div>
                  <div className="text-[13px] font-bold text-cyan-200">{commandProfile.sentiment}%</div>
                </div>
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2">
                  <div className="text-[8px] uppercase tracking-wide text-amber-200/70">Utilization</div>
                  <div className="text-[13px] font-bold text-amber-200">{commandProfile.utilization}%</div>
                </div>
              </div>
            </div>

            <div>
              <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-2">Data Source Quality</div>
              <div className="space-y-2">
                {visibleSources.map(ds => {
                  const q = dsQuality(ds);
                  const qColor = q >= 90 ? '#38D98A' : q >= 70 ? '#FF9B38' : '#FF4B4B';
                  return (
                    <div key={ds.label}>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-[#7A94B4]">{ds.label}</span>
                        <span className="text-[#7A94B4]">{ds.count > 0 ? `${ds.count.toLocaleString()} rec.` : 'Error'}</span>
                      </div>
                      <AnimatedBar value={q} color={qColor} height="h-1" />
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-2">Recent Activity</div>
              <div className="space-y-1.5">
                {client.recentActivity.map((act, i) => {
                  const col = ACTIVITY_COLOR[act.type] || 'text-[#7A94B4]';
                  const icon = ACTIVITY_ICON[act.type] || <Clock size={10} />;
                  return (
                    <div key={i} className="flex items-start gap-2 py-1.5 border-b border-[rgba(46,127,255,0.08)] last:border-0">
                      <div className={`flex-shrink-0 mt-0.5 ${col}`}>{icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-[#EEF3FA] leading-snug">{act.event}</div>
                      </div>
                      <span className="text-[9px] text-[#7A94B4] flex-shrink-0">{act.time}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-2">AI Insight</div>
              <div className="p-3 bg-[rgba(6,182,212,0.06)] border border-cyan-500/20 rounded-xl flex items-start gap-2">
                <Zap size={12} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-[#EEF3FA] leading-relaxed">{client.aiInsight || `${commandProfile.firstDue}. Data coverage at ${commandProfile.coverage}%.`}</p>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-[rgba(46,127,255,0.15)] space-y-2">
            <button
              onClick={() => { onNavigateToCommand(client.id, client.name); onClose(); }}
              data-demo-action="portfolio-open-command"
              className="w-full py-2.5 bg-[#2E7FFF] text-white text-[12px] font-semibold rounded-lg hover:bg-blue-500 transition-colors flex items-center justify-center gap-1.5"
            >
              Open Command Center <ArrowRight size={13} />
            </button>
            <button
              onClick={() => onReport(client)}
              className="w-full py-2 border border-[rgba(46,127,255,0.3)] text-[#7A94B4] text-[11px] rounded-lg hover:bg-white/5 transition-colors flex items-center justify-center gap-1.5"
            >
              <FileText size={12} /> Generate Report
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface Props {
  onToast: ToastFn;
  onClientSelect: (clientId: string) => void;
  onNavigateToIncidents: (clientId: string) => void;
  onNavigateToCommand: (clientId: string, clientName?: string) => void;
  demoAddPropertySection?: 'wizard' | 'ai' | 'upload';
  demoPortfolioSection?: 'health-actions' | 'portfolio-map' | 'command-path';
}

export function AllClients({ onToast, onClientSelect, onNavigateToIncidents, onNavigateToCommand, demoAddPropertySection, demoPortfolioSection }: Props) {
  const memberFilter  = useMemberFilter();
  const { addProfiles } = useMemberProfiles();
  const { clients: allClients, addClient } = useClients();
  const isMemberMode  = isFilterActive(memberFilter);

  const defaultRegion = useMemo(() => {
    if (!isMemberMode || memberFilter.zones.length === 0) return 'All';
    const regionMatch = REGIONS.find(r => r !== 'All' && memberFilter.zones.some(z => z.toLowerCase().includes(r.toLowerCase())));
    return regionMatch ?? 'All';
  }, [isMemberMode, memberFilter.zones]);

  const [search,        setSearch]        = useState('');
  const [region,        setRegion]        = useState(defaultRegion);
  const [sector,        setSector]        = useState('All');
  const [status,        setStatus]        = useState('All');
  const [riskLevel,     setRiskLevel]     = useState('All');
  const [sortKey,       setSortKey]       = useState('risk');
  const [view,          setView]          = useState<'grid' | 'list'>('grid');
  const [selected,      setSelected]      = useState<PortfolioClient | null>(null);
  const [reportClient,  setReportClient]  = useState<PortfolioClient | null>(null);
  const [showAddModal,  setShowAddModal]  = useState(false);
  const [hiddenClientIds, setHiddenClientIds] = useState<string[]>([]);

  useEffect(() => {
    if (!demoAddPropertySection) return;
    setShowAddModal(true);
  }, [demoAddPropertySection]);

  const handleAddClient = (data: ClientData, teamMembers: TeamMember[], inviteOk: boolean, failedCount: number, options?: { keepOpen?: boolean }) => {
    addClient({
      id: `CLT-${Date.now()}`,
      name: data.name,
      status: 'live',
      region: data.siteNames?.[0] ?? '',
      sector: data.sector ?? '',
      sites: Number(data.numSites ?? 0),
      workOrders: 0,
      incidentsCount: 0,
      sla: 100,
      compliance: 100,
      riskLevel: 'low',
      overdueTasks: 0,
      aiInsight: '',
      lastUpdated: 'Just now',
      contract: { number: `IMD-${Date.now()}`, tier: data.slaTier ?? 'Standard', annualValue: data.contractValue ?? '' },
    }).catch(err => console.warn('[AllClients] Failed to persist client:', err));
    void addProfiles(teamMembers).catch(err => {
      console.warn('[AllClients] Failed to persist team members, property remains available locally:', err);
    });
    if (!options?.keepOpen) setShowAddModal(false);
    if (teamMembers.length > 0 && !inviteOk) {
      const msg = failedCount > 0
        ? `${data.name} added — ${failedCount} invite${failedCount > 1 ? 's' : ''} failed to send`
        : `${data.name} added — invites could not be delivered (check SMTP config)`;
      onToast(msg, 'warning');
    } else if (teamMembers.length > 0) {
      onToast(`${data.name} added — invites sent to ${teamMembers.length} team member${teamMembers.length > 1 ? 's' : ''}`, 'success');
    } else {
      onToast(`${data.name} added — ${data.contractType} · ${data.slaTier} SLA`, 'success');
    }
  };

  const handleDismissClient = (clientId: string) => {
    setHiddenClientIds(prev => prev.includes(clientId) ? prev : [...prev, clientId]);
    setSelected(prev => prev?.id === clientId ? null : prev);
  };

  const matchingClients = allClients
    .filter(c => {
      if (isMemberMode && memberFilter.assignedClients.length > 0 &&
          !memberFilter.assignedClients.some(ac => c.name.toLowerCase().includes(ac.toLowerCase()) || ac.toLowerCase().includes(c.name.toLowerCase()))) {
        return false;
      }
      if (region    !== 'All' && c.region    !== region)    return false;
      if (sector    !== 'All' && c.sector    !== sector)    return false;
      if (status    !== 'All' && c.status    !== status)    return false;
      if (riskLevel !== 'All' && c.riskLevel !== riskLevel) return false;
      if (search && !c.name.toLowerCase().includes(search.toLowerCase()) &&
                    !c.region.toLowerCase().includes(search.toLowerCase()) &&
                    !c.sector.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortKey === 'risk') {
        const riskDelta = (RISK_ORDER[a.riskLevel] ?? 9) - (RISK_ORDER[b.riskLevel] ?? 9);
        if (riskDelta !== 0) return riskDelta;
        return (PORTFOLIO_DISPLAY_ORDER[a.name] ?? 99) - (PORTFOLIO_DISPLAY_ORDER[b.name] ?? 99);
      }
      if (sortKey === 'sites')     return b.sites - a.sites;
      if (sortKey === 'sla')       return a.sla - b.sla;
      if (sortKey === 'incidents') return b.incidents - a.incidents;
      return (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
    });
  const filtered = matchingClients.filter(c => !hiddenClientIds.includes(c.id));
  const demoCommandPathClient = filtered.find(client => client.status === 'critical') ?? filtered[0] ?? allClients[0] ?? null;
  const hiddenCount = hiddenClientIds.length;
  const hiddenMatchingCount = matchingClients.length - filtered.length;

  useEffect(() => {
    if (demoPortfolioSection !== 'command-path') {
      setReportClient(null);
      return;
    }

    if (!demoCommandPathClient) return;
    const timer = window.setTimeout(() => {
      setSelected(null);
      setReportClient(demoCommandPathClient);
    }, 500);

    return () => window.clearTimeout(timer);
  }, [demoCommandPathClient, demoCommandPathClient?.id, demoPortfolioSection]);

  return (
    <div className="h-full flex flex-col overflow-hidden relative" data-demo-anchor="portfolio-command">
      <div className="px-5 py-3 border-b border-[rgba(46,127,255,0.15)] flex-shrink-0">
        <div className="hidden">
          <h2 className="text-[#EEF3FA] font-bold text-base" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {isMemberMode ? 'My Properties' : 'Properties'}
          </h2>
          <p className="text-[11px] text-[#7A94B4]">
            {isMemberMode
              ? `Personalized scope · ${filtered.length} assigned propert${filtered.length !== 1 ? 'ies' : 'y'}`
              : `Portfolio command view · ${allClients.length} properties · Master Admin`}
          </p>
        </div>
        <div className="flex min-w-0 flex-wrap items-stretch gap-2">
          <div className="flex min-w-[190px] flex-1 items-center gap-1.5 rounded-lg border border-[rgba(46,127,255,0.2)] bg-[#112040] px-2.5 py-1.5 xl:max-w-[240px]">
            <Search size={11} className="shrink-0 text-[#7A94B4]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search properties..."
              className="min-w-0 flex-1 bg-transparent text-[11px] text-[#EEF3FA] placeholder-[#7A94B4] outline-none"
            />
          </div>

          <select
            value={region}
            onChange={e => setRegion(e.target.value)}
            className="min-w-[122px] flex-1 cursor-pointer rounded-lg border border-[rgba(46,127,255,0.2)] bg-[#112040] px-2 py-1.5 text-[10px] text-[#7A94B4] outline-none sm:flex-none"
          >
            {REGIONS.map(r => <option key={r} value={r}>Region: {r}</option>)}
          </select>

          <select
            value={sector}
            onChange={e => setSector(e.target.value)}
            className="min-w-[132px] flex-1 cursor-pointer rounded-lg border border-[rgba(46,127,255,0.2)] bg-[#112040] px-2 py-1.5 text-[10px] text-[#7A94B4] outline-none sm:flex-none"
          >
            {SECTORS.map(s => <option key={s} value={s}>Sector: {s.length > 20 ? `${s.slice(0, 18)}...` : s}</option>)}
          </select>

          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="min-w-[112px] flex-1 cursor-pointer rounded-lg border border-[rgba(46,127,255,0.2)] bg-[#112040] px-2 py-1.5 text-[10px] capitalize text-[#7A94B4] outline-none sm:flex-none"
          >
            {STATUSES.map(s => <option key={s} value={s}>Status: {s}</option>)}
          </select>

          <select
            value={riskLevel}
            onChange={e => setRiskLevel(e.target.value)}
            className="min-w-[104px] flex-1 cursor-pointer rounded-lg border border-[rgba(46,127,255,0.2)] bg-[#112040] px-2 py-1.5 text-[10px] capitalize text-[#7A94B4] outline-none sm:flex-none"
          >
            {RISK_LVLS.map(r => <option key={r} value={r}>Risk: {r}</option>)}
          </select>

          <select
            value={sortKey}
            onChange={e => setSortKey(e.target.value)}
            className="min-w-[132px] flex-1 cursor-pointer rounded-lg border border-[rgba(46,127,255,0.2)] bg-[#112040] px-2 py-1.5 text-[10px] text-[#7A94B4] outline-none sm:flex-none"
          >
            {SORT_OPTS.map(s => <option key={s.key} value={s.key}>Sort: {s.label}</option>)}
          </select>

          <PortfolioPulseFeed onToast={onToast} />

          <button
            onClick={() => setShowAddModal(true)}
            className="flex min-w-[128px] items-center justify-center gap-1.5 rounded-lg bg-[#2E7FFF] px-3 py-1.5 text-[11px] font-semibold text-white shadow-[0_0_12px_rgba(46,127,255,0.35)] transition-colors hover:bg-blue-500"
            data-demo-anchor="property-onboarding-entry"
          >
            <Plus size={13} />
            Add Property
          </button>
        </div>
      </div>

      <div data-demo-anchor="portfolio-health-actions">
        <PortfolioSummaryStrip clients={allClients} onToast={onToast} />
      </div>

      <ExecutiveImpactStrip clients={allClients} onToast={onToast} />

      <div className="hidden">
        <select
          value={sector}
          onChange={e => setSector(e.target.value)}
          className="min-w-[150px] flex-1 text-[10px] px-2 py-1.5 rounded-lg border border-[rgba(46,127,255,0.2)] bg-[#112040] text-[#7A94B4] outline-none cursor-pointer sm:flex-none"
        >
          {SECTORS.map(s => <option key={s} value={s}>Sector: {s.length > 20 ? s.slice(0, 18) + '…' : s}</option>)}
        </select>

        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="min-w-[120px] flex-1 text-[10px] px-2 py-1.5 rounded-lg border border-[rgba(46,127,255,0.2)] bg-[#112040] text-[#7A94B4] outline-none cursor-pointer capitalize sm:flex-none"
        >
          {STATUSES.map(s => <option key={s} value={s}>Status: {s}</option>)}
        </select>

        <select
          value={riskLevel}
          onChange={e => setRiskLevel(e.target.value)}
          className="min-w-[110px] flex-1 text-[10px] px-2 py-1.5 rounded-lg border border-[rgba(46,127,255,0.2)] bg-[#112040] text-[#7A94B4] outline-none cursor-pointer capitalize sm:flex-none"
        >
          {RISK_LVLS.map(r => <option key={r} value={r}>Risk: {r}</option>)}
        </select>

        <select
          value={sortKey}
          onChange={e => setSortKey(e.target.value)}
          className="min-w-[150px] flex-1 text-[10px] px-2 py-1.5 rounded-lg border border-[rgba(46,127,255,0.2)] bg-[#112040] text-[#7A94B4] outline-none cursor-pointer sm:flex-none"
        >
          {SORT_OPTS.map(s => <option key={s.key} value={s.key}>Sort: {s.label}</option>)}
        </select>

        {hiddenCount > 0 && (
          <button
            onClick={() => setHiddenClientIds([])}
            className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-2.5 py-1.5 text-[10px] font-semibold text-cyan-300 transition-colors hover:bg-cyan-500/15"
          >
            Show hidden cards ({hiddenCount})
          </button>
        )}

        <div className="ml-0 flex items-center gap-1 bg-[#112040] rounded-lg p-0.5 border border-[rgba(46,127,255,0.2)] sm:ml-auto">
          <button
            onClick={() => setView('grid')}
            className={`p-1.5 rounded-md transition-all ${view === 'grid' ? 'bg-[#2E7FFF] text-white' : 'text-[#7A94B4] hover:text-[#EEF3FA]'}`}
          >
            <Grid size={12} />
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-1.5 rounded-md transition-all ${view === 'list' ? 'bg-[#2E7FFF] text-white' : 'text-[#7A94B4] hover:text-[#EEF3FA]'}`}
          >
            <List size={12} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-5 pb-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Users size={32} className="text-[#7A94B4] opacity-30" />
            <span className="text-[13px] text-[#7A94B4] opacity-60">
              {hiddenMatchingCount > 0 ? 'All matching property cards are hidden' : 'No properties match filters'}
            </span>
            {hiddenMatchingCount > 0 && (
              <button
                onClick={() => setHiddenClientIds([])}
                className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-3 py-2 text-[11px] font-semibold text-cyan-300 transition-colors hover:bg-cyan-500/15"
              >
                Show hidden cards
              </button>
            )}
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2 2xl:grid-cols-3" data-demo-anchor="portfolio-property-grid">
            <AnimatePresence initial={false}>
              {filtered.map((c, index) => (
                <ClientPortfolioCard key={c.id} client={c} demoAnchor={index === 0 ? 'portfolio-primary-card' : undefined} onSelect={setSelected} onDismiss={handleDismissClient} onToast={onToast} onReport={setReportClient} view="grid" onNavigateToIncidents={onNavigateToIncidents} onNavigateToCommand={onNavigateToCommand} />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col gap-2" data-demo-anchor="portfolio-property-grid">
            <AnimatePresence initial={false}>
              {filtered.map((c, index) => (
                <ClientPortfolioCard key={c.id} client={c} demoAnchor={index === 0 ? 'portfolio-primary-card' : undefined} onSelect={setSelected} onDismiss={handleDismissClient} onToast={onToast} onReport={setReportClient} view="list" onNavigateToIncidents={onNavigateToIncidents} onNavigateToCommand={onNavigateToCommand} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <>
            <div className="absolute inset-0 z-[100]" onClick={() => setSelected(null)} />
            <ClientDetailDrawer
              client={selected}
              onClose={() => setSelected(null)}
              onToast={onToast}
              onNavigateToCommand={onNavigateToCommand}
              onReport={setReportClient}
            />
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {reportClient && (
          <>
            <div className="absolute inset-0 z-[250]" onClick={() => setReportClient(null)} />
            <ClientReportPanel
              client={reportClient}
              onClose={() => setReportClient(null)}
              demoAutoScroll={demoPortfolioSection === 'command-path'}
            />
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddModal && (
          <AddClientModal
            onClose={() => setShowAddModal(false)}
            onSave={handleAddClient}
            demoSection={demoAddPropertySection}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
