import { useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import {
  Anchor,
  ArrowRight,
  BarChart3,
  Bot,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  DoorOpen,
  Factory,
  Flame,
  Leaf,
  Mic,
  MicOff,
  Network,
  Radar,
  Search,
  ShieldCheck,
  Sparkles,
  TicketCheck,
  Users,
  Waves,
  Wrench,
  X,
} from 'lucide-react';

type Audience = 'Executive' | 'Operations' | 'Property Management' | 'Field Teams' | 'Residents' | 'Compliance' | 'HSE' | 'Marine';
type SolutionSlug = 'properties' | 'fm' | 'marine' | 'osh';

interface SolutionModule {
  id: string;
  name: string;
  tagline: string;
  category: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  accent: string;
  audiences: Audience[];
  summary: string;
  outcomes: string[];
  workflows: string[];
  aiCapabilities: string[];
  kpis: string[];
  integrations: string[];
  clientValue: string;
}

interface Solution {
  slug: SolutionSlug;
  name: string;
  label: string;
  headline: string;
  subheadline: string;
  audience: string;
  accent: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  stats: Array<[string, string]>;
  modules: SolutionModule[];
  organizationValue: Array<[string, string]>;
  ctas: string[];
}

const SOLUTIONS_AGENT_ID = import.meta.env.VITE_ELEVENLABS_SOLUTIONS_AGENT_ID as string | undefined;
const DEMO_URL = 'https://calendly.com/4c360/intro-meeting';

const audiences: Array<'All' | Audience> = ['All', 'Executive', 'Operations', 'Property Management', 'Field Teams', 'Residents', 'Compliance', 'HSE', 'Marine'];

const propertiesModules: SolutionModule[] = [
  {
    id: 'projectcommand',
    name: 'ProjectCommand',
    tagline: 'Predictive project command centre',
    category: 'Property Development',
    icon: Factory,
    accent: '#7C3AED',
    audiences: ['Executive', 'Property Management', 'Compliance'],
    summary: 'A construction intelligence layer for project owners and developers. It combines programme, cost, risk, obligations, evidence, stage gates, and AI forecast views into one operating picture.',
    outcomes: ['Forecast project delays before they become claims', 'Connect programme risk with cost impact', 'Track obligations, evidence, and stage-gate readiness', 'Give leaders one view of delivery confidence'],
    workflows: ['Review AI threat score and top decisions', 'Switch between projects and compare delivery health', 'Track stage gates, obligations, risks, and evidence', 'Run forecast scenarios for handover and final cost'],
    aiCapabilities: ['Delay and cost forecast narratives', 'Metric explanations on KPI cards', 'AI readiness and risk summaries', 'Scenario-based recommendations'],
    kpis: ['Completion %', 'Budget used', 'CPI / SPI', 'Float remaining', 'Open blockers', 'Evidence compliance'],
    integrations: ['Programme data', 'Cost reports', 'Risk register', 'Evidence repository', 'Vendor performance', 'FieldOps submissions'],
    clientValue: 'Turns project reporting from a backward-looking status update into a forward-looking decision system.',
  },
  {
    id: 'fieldops',
    name: 'FieldOps',
    tagline: 'AI-assisted mobile surveys and inspections',
    category: 'Field Execution',
    icon: ClipboardCheck,
    accent: '#E11D2E',
    audiences: ['Operations', 'Field Teams', 'Compliance'],
    summary: 'A mobile survey studio for creating, assigning, sharing, capturing, and tracking inspections across properties, assets, teams, vendors, and contractors.',
    outcomes: ['Standardize field inspections across properties', 'Capture evidence, GPS, readings, and signatures', 'Convert failed checks into incidents', 'Track live submissions from email or QR code'],
    workflows: ['Create a survey with AI, template, or manual flow', 'Assign to teams, vendors, roles, sites, and assets', 'Share by email, QR, WhatsApp, or link', 'Review submitted answers, photos, and issues'],
    aiCapabilities: ['Prompt-based checklist generation', 'AI draft preview by inspection type', 'Copilot guidance for technical checks', 'AI-assisted instructions and readiness checks'],
    kpis: ['Active surveys', 'In progress', 'Completed', 'Overdue', 'Open issues detected', 'Evidence files'],
    integrations: ['ServiceDesk', 'SnapFix', 'Assets', 'ProjectCommand evidence', 'Email service', 'QR capture'],
    clientValue: 'Replaces scattered paper checklists and ad hoc site updates with a governed, evidence-backed mobile capture process.',
  },
  {
    id: 'residentportal',
    name: 'ResidentPortal',
    tagline: 'Resident and owner service experience',
    category: 'Community Services',
    icon: DoorOpen,
    accent: '#2E7FFF',
    audiences: ['Residents', 'Property Management', 'Operations'],
    summary: 'A connected resident and owner portal for requests, notices, documents, community services, payments, and communication with property management.',
    outcomes: ['Improve resident satisfaction and transparency', 'Reduce support calls with self-service tracking', 'Connect resident requests to operations', 'Manage notices, documents, and community services'],
    workflows: ['Resident reports an issue with photo or voice note', 'AI classifies and routes the request', 'Management tracks status and communication', 'Resident confirms resolution and rates service'],
    aiCapabilities: ['Issue description assistance', 'Request status summaries', 'Repeat complaint detection', 'Priority and escalation suggestions'],
    kpis: ['Total residents', 'Open requests', 'Pending payments', 'Notices sent', 'Read rate', 'Satisfaction score'],
    integrations: ['SnapFix', 'ServiceDesk', 'Payments', 'Documents', 'Notices', 'Resident messaging'],
    clientValue: 'Creates a calmer resident experience while giving management a live view of demand, service quality, and satisfaction risk.',
  },
  {
    id: 'vendoriq',
    name: 'VendorIQ',
    tagline: 'Vendor performance intelligence',
    category: 'Procurement and Partners',
    icon: ShieldCheck,
    accent: '#00B894',
    audiences: ['Executive', 'Operations', 'Property Management'],
    summary: 'A vendor performance cockpit that connects SLA, quality, evidence, cost, first-time-fix, compliance, and risk into one partner score.',
    outcomes: ['Rank vendors by true operational performance', 'Identify SLA and quality drift early', 'Support renewals and contract reviews with evidence', 'Reduce repeat visits and unmanaged cost leakage'],
    workflows: ['Review vendor score and AI insights', 'Compare vendors by property and service type', 'Open contract and job performance details', 'Trigger corrective action or escalation'],
    aiCapabilities: ['Performance explanation badges', 'Repeat failure detection', 'Cost efficiency insights', 'Recommended escalation actions'],
    kpis: ['Vendor score', 'SLA compliance', 'First-time fix', 'Evidence compliance', 'Jobs last 30 days', 'Average cost per job'],
    integrations: ['Work orders', 'Contracts', 'ServiceDesk', 'FieldOps evidence', 'ProjectCommand risks'],
    clientValue: 'Turns vendor management into a measurable, defensible, and improvement-focused operating model.',
  },
  {
    id: 'snapfix',
    name: 'SnapFix',
    tagline: 'Defect and issue capture',
    category: 'Issue Intake',
    icon: Radar,
    accent: '#FF4B4B',
    audiences: ['Operations', 'Field Teams', 'Residents'],
    summary: 'Fast photo, voice, and QR-based issue capture that converts field observations into structured incidents or service requests.',
    outcomes: ['Reduce friction at the point of issue capture', 'Improve classification quality', 'Route issues faster', 'Attach clean evidence from the start'],
    workflows: ['Scan asset or location QR', 'Capture photo or voice note', 'AI classifies issue and suggests priority', 'Create incident or request for dispatch'],
    aiCapabilities: ['Image and text classification', 'Structured issue summary', 'Suggested severity and category', 'Duplicate issue hints'],
    kpis: ['Issues captured', 'Auto-classification rate', 'Evidence completeness', 'Time to dispatch', 'Duplicate reduction'],
    integrations: ['ServiceDesk', 'FieldOps', 'Assets', 'ResidentPortal', 'GIS map'],
    clientValue: 'Makes issue reporting fast enough for field teams and residents to actually use, while keeping data structured for operations.',
  },
  {
    id: 'servicedesk',
    name: 'ServiceDesk',
    tagline: 'Ticket and SLA command layer',
    category: 'Service Operations',
    icon: TicketCheck,
    accent: '#00C6FF',
    audiences: ['Operations', 'Property Management', 'Residents'],
    summary: 'A ticket management layer for reviewing, assigning, escalating, communicating, and closing service requests across properties and vendors.',
    outcomes: ['Control SLA exposure in real time', 'Improve dispatch decisions', 'Keep residents and clients informed', 'Close work with proper evidence'],
    workflows: ['Review incoming requests', 'Assign internal team or vendor', 'Track SLA and escalation rules', 'Close with evidence and confirmation'],
    aiCapabilities: ['Priority suggestions', 'SLA risk warnings', 'Assignment recommendations', 'Closure summary drafting'],
    kpis: ['Open tickets', 'SLA compliance', 'Average resolution', 'Escalations', 'Resident confirmation', 'Closure evidence'],
    integrations: ['SnapFix', 'ResidentPortal', 'VendorIQ', 'Work orders', 'Notifications'],
    clientValue: 'Brings discipline to service delivery and makes every request visible from intake to close.',
  },
  {
    id: 'facilitycore',
    name: 'FacilityCore',
    tagline: 'Asset and facility management backbone',
    category: 'Operations Backbone',
    icon: Wrench,
    accent: '#C8A020',
    audiences: ['Operations', 'Field Teams', 'Property Management'],
    summary: 'The operational backbone for assets, PPM schedules, work orders, site teams, service areas, and property-level maintenance planning.',
    outcomes: ['Know what assets exist and where they are', 'Plan preventive maintenance by asset and risk', 'Coordinate work orders across teams', 'Reduce reactive maintenance through better cadence'],
    workflows: ['Maintain asset registry', 'Create PPM plans and schedules', 'Assign work orders', 'Review completion and evidence'],
    aiCapabilities: ['Asset risk suggestions', 'PPM schedule recommendations', 'Work order preparation', 'Failure pattern detection'],
    kpis: ['Asset count', 'PPM compliance', 'Work order backlog', 'Open defects', 'Mean time to repair'],
    integrations: ['FieldOps', 'ServiceDesk', 'VendorIQ', 'GIS', 'Data sources'],
    clientValue: 'Creates the operational structure needed to manage properties consistently at scale.',
  },
  {
    id: 'greentrack',
    name: 'GreenTrack',
    tagline: 'Sustainability and ESG tracking',
    category: 'ESG and Utilities',
    icon: Leaf,
    accent: '#38D98A',
    audiences: ['Executive', 'Property Management', 'Compliance'],
    summary: 'A sustainability intelligence module for monitoring utility performance, ESG evidence, initiatives, alerts, and portfolio-wide improvement opportunities.',
    outcomes: ['Track consumption and efficiency by property', 'Identify anomalies and waste', 'Support ESG reporting with evidence', 'Prioritize sustainability investments'],
    workflows: ['Review utility and carbon trends', 'Open anomalies by property or asset', 'Track improvement initiatives', 'Export evidence for reporting'],
    aiCapabilities: ['Consumption anomaly detection', 'Savings opportunity summaries', 'ESG evidence completeness checks', 'Forecasted utility impact'],
    kpis: ['Energy intensity', 'Water usage', 'Carbon trend', 'Savings forecast', 'Evidence completeness'],
    integrations: ['IoT sensors', 'Utility data', 'Assets', 'Evidence repository', 'Executive dashboard'],
    clientValue: 'Helps property teams move from passive utility reporting to active sustainability performance management.',
  },
  {
    id: 'inspectpro',
    name: 'InspectPro',
    tagline: 'Inspection and audit assurance',
    category: 'Compliance and Assurance',
    icon: ClipboardList,
    accent: '#A855F7',
    audiences: ['Compliance', 'Field Teams', 'Property Management'],
    summary: 'A structured inspection and audit module for evidence, control checks, corrective actions, readiness scoring, and inspection history.',
    outcomes: ['Prepare for audits with confidence', 'Link evidence to controls and obligations', 'Track failed checks and remediation', 'Reduce compliance blind spots'],
    workflows: ['Plan inspection cycle', 'Capture findings and evidence', 'Review exceptions and corrective actions', 'Export audit-ready packs'],
    aiCapabilities: ['Readiness score explanations', 'Evidence gap detection', 'Corrective action suggestions', 'Inspection summary generation'],
    kpis: ['Inspection completion', 'Failed controls', 'Evidence gaps', 'Open actions', 'Audit readiness'],
    integrations: ['FieldOps', 'ProjectCommand obligations', 'Evidence repository', 'ServiceDesk'],
    clientValue: 'Makes assurance work practical, traceable, and connected to the operational teams who can fix issues.',
  },
];

const solutions: Solution[] = [
  {
    slug: 'properties',
    name: '4C360 Properties',
    label: 'Property Development & Management',
    headline: 'One operating system for properties, projects, people, and performance.',
    subheadline: 'Connect development, operations, field teams, vendors, residents, evidence, and AI-assisted decisions in one platform.',
    audience: 'Property developers, owners, operators, and community managers',
    accent: '#E11D2E',
    icon: Building2,
    stats: [['12+', 'Connected capability areas'], ['AI-first', 'Guidance inside workflows'], ['360', 'Portfolio to field visibility'], ['1 source', 'Evidence and decisions aligned']],
    modules: propertiesModules,
    organizationValue: [
      ['Leadership', 'Portfolio risk, cost, service, and delivery confidence in one view.'],
      ['Operations', 'Clear workflows for tickets, surveys, vendors, work orders, and evidence.'],
      ['Field teams', 'Mobile-first guidance, QR capture, photo evidence, and fewer manual reports.'],
      ['Residents and owners', 'Simple self-service requests, communication, tracking, and transparency.'],
    ],
    ctas: ['Book a walkthrough', 'Ask the AI advisor', 'Explore modules', 'Discuss this solution'],
  },
  {
    slug: 'fm',
    name: '4C360 FM',
    label: 'Facilities Management',
    headline: 'AI-assisted facilities operations from asset register to service closeout.',
    subheadline: 'Unify preventive maintenance, reactive jobs, vendors, evidence, compliance, and client reporting for modern FM teams.',
    audience: 'FM operators, asset owners, service providers, and portfolio managers',
    accent: '#00C6FF',
    icon: Wrench,
    stats: [['24/7', 'Service visibility'], ['PPM', 'Risk-aware maintenance'], ['SLA', 'Live exposure tracking'], ['AI', 'Dispatch and evidence support']],
    modules: [
      {
        id: 'facilitycore',
        name: 'FacilityCore',
        tagline: 'Asset and maintenance backbone',
        category: 'FM Operations',
        icon: Wrench,
        accent: '#C8A020',
        audiences: ['Operations', 'Field Teams'],
        summary: 'A single operational base for sites, assets, planned maintenance, work orders, service areas, and completion evidence.',
        outcomes: ['Improve PPM compliance', 'Reduce reactive workload', 'Standardize asset maintenance', 'Give clients clear service visibility'],
        workflows: ['Maintain asset register', 'Build PPM schedules', 'Assign work orders', 'Capture completion evidence'],
        aiCapabilities: ['PPM risk scoring', 'Asset failure pattern detection', 'Work order preparation', 'Maintenance frequency suggestions'],
        kpis: ['PPM compliance', 'Backlog', 'MTTR', 'Asset risk', 'Completion evidence'],
        integrations: ['Assets', 'FieldOps', 'ServiceDesk', 'VendorIQ'],
        clientValue: 'Turns FM delivery into measurable, auditable, and repeatable service performance.',
      },
      {
        id: 'servicedesk',
        name: 'ServiceDesk',
        tagline: 'Ticket and SLA command layer',
        category: 'Service Delivery',
        icon: TicketCheck,
        accent: '#00C6FF',
        audiences: ['Operations', 'Property Management'],
        summary: 'A service request command layer for intake, assignment, escalation, resident/client communication, and closure.',
        outcomes: ['Protect SLA commitments', 'Improve dispatch speed', 'Reduce missed follow-ups', 'Close jobs with evidence'],
        workflows: ['Receive request', 'Classify priority', 'Assign technician or vendor', 'Close and confirm'],
        aiCapabilities: ['Priority suggestions', 'SLA risk explanations', 'Assignment recommendations', 'Closure summaries'],
        kpis: ['Open tickets', 'SLA compliance', 'Average resolution', 'Escalations'],
        integrations: ['SnapFix', 'ResidentPortal', 'FieldOps', 'Notifications'],
        clientValue: 'Keeps every service request visible and controlled from intake to close.',
      },
      {
        id: 'vendoriq',
        name: 'VendorIQ',
        tagline: 'Vendor performance intelligence',
        category: 'Partner Management',
        icon: ShieldCheck,
        accent: '#00B894',
        audiences: ['Executive', 'Operations'],
        summary: 'Vendor scoring across SLA, quality, cost, first-time fix, and evidence compliance.',
        outcomes: ['Identify underperforming vendors', 'Support contract reviews', 'Reduce repeat visits', 'Improve accountability'],
        workflows: ['Review vendor score', 'Open service history', 'Compare cost and quality', 'Trigger action plan'],
        aiCapabilities: ['Performance explanations', 'Repeat failure detection', 'Cost efficiency insights', 'Escalation recommendations'],
        kpis: ['Vendor score', 'SLA', 'First-time fix', 'Evidence compliance'],
        integrations: ['ServiceDesk', 'FieldOps', 'Contracts'],
        clientValue: 'Makes outsourced service quality visible, comparable, and easier to improve.',
      },
    ],
    organizationValue: [
      ['FM leadership', 'Portfolio performance, SLA exposure, and vendor quality in one place.'],
      ['Supervisors', 'Better dispatch, clearer priorities, and fewer missed service risks.'],
      ['Technicians', 'Mobile jobs, checklists, photos, and AI guidance at the point of work.'],
      ['Clients', 'Transparent reporting backed by real evidence and live status.'],
    ],
    ctas: ['Book a walkthrough', 'Ask the AI advisor', 'Explore FM workflows', 'Discuss rollout'],
  },
  {
    slug: 'marine',
    name: '4C360 Marine',
    label: 'Marine Operations & Compliance',
    headline: 'Connect marine assets, inspections, compliance evidence, and operational risk.',
    subheadline: 'A command layer for fleets, port facilities, marine service teams, inspection cycles, safety checks, and audit readiness.',
    audience: 'Marine operators, ports, marinas, vessel service teams, and compliance leaders',
    accent: '#38BDF8',
    icon: Anchor,
    stats: [['Fleet', 'Asset visibility'], ['Port', 'Operations workflow'], ['Safety', 'Inspection evidence'], ['AI', 'Risk and readiness support']],
    modules: [
      {
        id: 'marineops',
        name: 'MarineOps',
        tagline: 'Fleet and marine asset operations',
        category: 'Marine Operations',
        icon: Anchor,
        accent: '#38BDF8',
        audiences: ['Marine', 'Operations'],
        summary: 'A marine operations module for asset registers, vessel readiness, maintenance activities, port tasks, and operational status.',
        outcomes: ['Improve fleet readiness', 'Standardize maintenance visibility', 'Track port-side tasks', 'Reduce fragmented reporting'],
        workflows: ['Register vessel or marine asset', 'Schedule service checks', 'Assign marine team tasks', 'Review readiness and evidence'],
        aiCapabilities: ['Readiness summaries', 'Maintenance risk prompts', 'Inspection gap detection', 'Priority suggestions'],
        kpis: ['Asset readiness', 'Open tasks', 'Maintenance due', 'Inspection compliance'],
        integrations: ['FieldOps', 'Evidence repository', 'ServiceDesk'],
        clientValue: 'Gives marine teams one operating picture across assets, people, and evidence.',
      },
      {
        id: 'marineinspect',
        name: 'MarineInspect',
        tagline: 'Mobile marine inspections',
        category: 'Inspections',
        icon: Waves,
        accent: '#00C6FF',
        audiences: ['Marine', 'Field Teams', 'Compliance'],
        summary: 'Mobile inspection templates for vessel, dock, pontoon, safety equipment, and environmental checks.',
        outcomes: ['Capture inspection evidence consistently', 'Reduce manual forms', 'Flag failed items quickly', 'Support audit readiness'],
        workflows: ['Select marine template', 'Capture checklist and photos', 'Record readings and defects', 'Submit for review'],
        aiCapabilities: ['Inspection prompt generation', 'Photo evidence guidance', 'Defect classification', 'Risk summary'],
        kpis: ['Inspections completed', 'Defects found', 'Evidence completeness', 'Failed safety checks'],
        integrations: ['FieldOps', 'ServiceDesk', 'Evidence repository'],
        clientValue: 'Moves marine inspection work from paper and email into traceable, operationally useful data.',
      },
      {
        id: 'marinecompliance',
        name: 'MarineCompliance',
        tagline: 'Compliance and permit evidence',
        category: 'Compliance',
        icon: ShieldCheck,
        accent: '#A855F7',
        audiences: ['Marine', 'Compliance', 'Executive'],
        summary: 'Compliance tracking for certificates, permits, inspection records, corrective actions, and readiness packs.',
        outcomes: ['Track expiring certificates', 'Link evidence to obligations', 'Prepare for audits faster', 'Reduce compliance exposure'],
        workflows: ['Monitor permit register', 'Attach evidence', 'Review gaps', 'Export readiness summary'],
        aiCapabilities: ['Expiry risk summaries', 'Evidence gap detection', 'Corrective action suggestions', 'Audit readiness explanations'],
        kpis: ['Current certificates', 'Expired evidence', 'Open obligations', 'Readiness score'],
        integrations: ['Evidence repository', 'Obligations register', 'FieldOps'],
        clientValue: 'Keeps marine compliance visible, current, and tied to operational action.',
      },
    ],
    organizationValue: [
      ['Operations', 'Vessel and facility readiness shown in one operating view.'],
      ['Field teams', 'Guided inspections and evidence capture on mobile.'],
      ['Compliance', 'Certificates, permits, and obligations connected to proof.'],
      ['Leadership', 'Risk, readiness, and service confidence across marine assets.'],
    ],
    ctas: ['Book a walkthrough', 'Ask the AI advisor', 'Explore marine use cases', 'Discuss this solution'],
  },
  {
    slug: 'osh',
    name: '4C360 OSH',
    label: 'Occupational Safety & Health',
    headline: 'Safety intelligence that connects observations, inspections, incidents, and controls.',
    subheadline: 'Give safety teams a live view of inspections, corrective actions, high-risk observations, evidence, and compliance readiness.',
    audience: 'HSE leaders, safety officers, contractors, compliance teams, and operations managers',
    accent: '#FF9B38',
    icon: Flame,
    stats: [['Live', 'Safety observations'], ['Controls', 'Linked to evidence'], ['AI', 'Risk and action guidance'], ['Audit', 'Readiness tracking']],
    modules: [
      {
        id: 'safetywalk',
        name: 'SafetyWalk',
        tagline: 'Mobile safety inspections',
        category: 'Safety Fieldwork',
        icon: ClipboardCheck,
        accent: '#FF9B38',
        audiences: ['HSE', 'Field Teams', 'Compliance'],
        summary: 'Guided safety inspections and walkthroughs with photos, GPS, mandatory checks, and corrective action triggers.',
        outcomes: ['Standardize safety checks', 'Capture better evidence', 'Escalate failed safety items', 'Track corrective actions'],
        workflows: ['Pick safety template', 'Capture pass/fail checks', 'Add evidence and notes', 'Create corrective action'],
        aiCapabilities: ['Safety checklist generation', 'Risk wording suggestions', 'Evidence requirement prompts', 'Corrective action drafting'],
        kpis: ['Inspections completed', 'Failed checks', 'Corrective actions', 'Evidence completeness'],
        integrations: ['FieldOps', 'ServiceDesk', 'Evidence repository'],
        clientValue: 'Makes safety fieldwork easier to execute and stronger as compliance evidence.',
      },
      {
        id: 'incidentos',
        name: 'IncidentOS',
        tagline: 'Safety incident and observation management',
        category: 'Incident Management',
        icon: Radar,
        accent: '#E11D2E',
        audiences: ['HSE', 'Operations', 'Executive'],
        summary: 'A structured workflow for observations, near misses, incidents, investigations, actions, and closure evidence.',
        outcomes: ['Improve incident visibility', 'Track actions to closure', 'Reduce repeat risk', 'Support executive safety reporting'],
        workflows: ['Log observation or incident', 'Classify severity', 'Assign investigation/action', 'Close with evidence'],
        aiCapabilities: ['Severity suggestions', 'Root-cause prompts', 'Action recommendations', 'Executive summaries'],
        kpis: ['Open incidents', 'Near misses', 'Actions overdue', 'Repeat findings'],
        integrations: ['ServiceDesk', 'FieldOps', 'Notifications'],
        clientValue: 'Turns safety events into structured learning and accountable action.',
      },
      {
        id: 'controlassurance',
        name: 'ControlAssurance',
        tagline: 'Controls, obligations, and audit readiness',
        category: 'Assurance',
        icon: ShieldCheck,
        accent: '#A855F7',
        audiences: ['HSE', 'Compliance', 'Executive'],
        summary: 'Links safety controls, obligations, evidence, inspections, and corrective actions into a readiness view.',
        outcomes: ['Know which controls are effective', 'Find missing evidence', 'Prepare for audits', 'Prioritize high-risk gaps'],
        workflows: ['Map controls to obligations', 'Review evidence coverage', 'Open exceptions', 'Track remediation'],
        aiCapabilities: ['Readiness score explanation', 'Evidence gap detection', 'Control exception summaries', 'Risk-based prioritization'],
        kpis: ['Control effectiveness', 'Evidence coverage', 'Open exceptions', 'Audit readiness'],
        integrations: ['Evidence repository', 'Obligations register', 'Stage gates'],
        clientValue: 'Connects safety activity to assurance, proof, and management confidence.',
      },
    ],
    organizationValue: [
      ['HSE leaders', 'A live view of risk, controls, evidence, and corrective actions.'],
      ['Safety officers', 'Guided mobile capture and clearer follow-through.'],
      ['Operations', 'Safety actions connected to the teams who can resolve them.'],
      ['Executives', 'Board-ready safety performance and assurance visibility.'],
    ],
    ctas: ['Book a walkthrough', 'Ask the AI advisor', 'Explore safety workflows', 'Discuss this solution'],
  },
];

function getBasePath() {
  const path = window.location.pathname;
  if (path.startsWith('/4c360')) return '/4c360';
  return path.startsWith('/brochure') ? '/brochure' : '';
}

function getCurrentSolutionSlug(): SolutionSlug | null {
  const path = window.location.pathname.replace(/\/$/, '');
  const basePath = getBasePath();
  const segment = (basePath ? path.replace(basePath, '') : path).split('/').filter(Boolean)[0];
  if (segment && solutions.some(solution => solution.slug === segment)) return segment as SolutionSlug;
  return null;
}

function routeTo(slug?: SolutionSlug) {
  const basePath = getBasePath() || (window.location.hostname === 'brochures.4cgrc.com' ? '/4c360' : '/brochure');
  const nextPath = slug ? `${basePath}/${slug}` : basePath;
  window.history.pushState({}, '', nextPath);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function MetricPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-[rgba(46,127,255,0.22)] bg-[#07111F] px-3 py-1 text-[11px] font-bold text-[#B8C7DB]">
      {children}
    </span>
  );
}

function SectionLabel({ icon: Icon, children }: { icon: ComponentType<{ size?: number; className?: string }>; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#7EB8F7]">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-[rgba(46,127,255,0.22)] bg-[#0A1628] text-[#2E7FFF]">
        <Icon size={14} />
      </span>
      {children}
    </div>
  );
}

function SolutionAgentWidget({ solution }: { solution?: Solution }) {
  const [open, setOpen] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking' | 'error'>('idle');
  const conversationRef = useRef<{ endSession(): Promise<void> } | null>(null);
  const agentAvailable = Boolean(SOLUTIONS_AGENT_ID);

  const stopVoice = async () => {
    if (conversationRef.current) {
      try {
        await conversationRef.current.endSession();
      } catch {
        // no-op
      }
    }
    conversationRef.current = null;
    setVoiceActive(false);
    setStatus('idle');
  };

  const startVoice = async () => {
    if (!agentAvailable || voiceActive) return;
    try {
      setOpen(true);
      setVoiceActive(true);
      setStatus('connecting');
      const { Conversation } = await import('@11labs/client');
      conversationRef.current = await Conversation.startSession({
        agentId: SOLUTIONS_AGENT_ID!,
        connectionType: 'websocket',
        onConnect: () => setStatus('listening'),
        onDisconnect: () => {
          conversationRef.current = null;
          setVoiceActive(false);
          setStatus('idle');
        },
        onError: () => {
          conversationRef.current = null;
          setVoiceActive(false);
          setStatus('error');
        },
        onModeChange: (mode: { mode: 'speaking' | 'listening' }) => setStatus(mode.mode),
      });
    } catch {
      conversationRef.current = null;
      setVoiceActive(false);
      setStatus('error');
    }
  };

  useEffect(() => () => {
    void stopVoice();
  }, []);

  useEffect(() => {
    const openAdvisor = () => setOpen(true);
    window.addEventListener('open-solutions-agent', openAdvisor);
    return () => window.removeEventListener('open-solutions-agent', openAdvisor);
  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 w-[min(360px,calc(100vw-40px))] rounded-3xl border border-[#E11D2E]/35 bg-[#07111F]/96 p-4 text-white shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#FFB4BC]">4C360 AI Advisor</div>
              <h3 className="mt-1 text-lg font-black">{solution ? `${solution.name} questions` : 'Solutions questions'}</h3>
              <p className="mt-2 text-sm leading-6 text-[#B8C7DB]">
                Ask about modules, business benefits, implementation approach, integrations, rollout options, or which solution fits your client.
              </p>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-xl border border-white/10 p-2 text-[#B8C7DB] hover:text-white" aria-label="Close AI advisor">
              <X size={16} />
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-[rgba(46,127,255,0.16)] bg-[#0A1628] p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-bold">{agentAvailable ? 'Voice advisor ready' : 'Voice advisor not configured'}</div>
                <div className="mt-1 text-[12px] text-[#7A94B4]">
                  {agentAvailable ? 'Uses the dedicated solutions agent, not the platform Copilot.' : 'Set VITE_ELEVENLABS_SOLUTIONS_AGENT_ID to enable this widget.'}
                </div>
              </div>
              <button
                onClick={voiceActive ? stopVoice : startVoice}
                disabled={!agentAvailable || status === 'connecting'}
                className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition ${
                  !agentAvailable
                    ? 'cursor-not-allowed border-white/10 bg-white/5 text-white/35'
                    : voiceActive
                    ? 'border-[#E11D2E]/50 bg-[#E11D2E]/20 text-[#FFB4BC]'
                    : 'border-[#2E7FFF]/35 bg-[#2E7FFF]/12 text-[#B8C7DB] hover:text-white'
                }`}
                aria-label={voiceActive ? 'Stop voice advisor' : 'Start voice advisor'}
              >
                {voiceActive ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            </div>
            <div className="mt-3 rounded-xl bg-black/20 px-3 py-2 text-[12px] font-semibold text-[#B8C7DB]">
              {status === 'connecting' && 'Connecting to the solutions advisor...'}
              {status === 'listening' && 'Listening now. Ask your question.'}
              {status === 'speaking' && 'Advisor is responding...'}
              {status === 'error' && 'Voice connection failed. Check the dedicated agent ID and browser microphone permissions.'}
              {status === 'idle' && (agentAvailable ? 'Click the microphone to start.' : 'Agent ID missing.')}
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(value => !value)}
        className="flex h-16 w-16 items-center justify-center rounded-full border border-[#E11D2E]/50 bg-[radial-gradient(circle_at_32%_28%,rgba(255,255,255,0.22),rgba(46,127,255,0.18)_34%,#08111F_64%,#050A14)] text-white shadow-xl shadow-[#E11D2E]/20"
        aria-label="Open 4C360 AI advisor"
      >
        <Sparkles size={26} />
      </button>
    </div>
  );
}

function SolutionsLanding() {
  return (
    <div className="min-h-screen bg-[#07101C] text-[#EEF3FA]">
      <section className="relative overflow-hidden border-b border-[rgba(46,127,255,0.16)] bg-[radial-gradient(circle_at_18%_12%,rgba(225,29,46,0.2),transparent_34%),radial-gradient(circle_at_76%_20%,rgba(46,127,255,0.24),transparent_36%),linear-gradient(135deg,#07101C,#0A1628_48%,#101A34)] px-6 py-10 lg:px-10">
        <div className="absolute inset-0 opacity-35" style={{ backgroundImage: 'linear-gradient(rgba(46,127,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(46,127,255,.12) 1px, transparent 1px)', backgroundSize: '42px 42px' }} />
        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-4xl">
              <div className="flex items-center gap-3">
                <img src="/4c-logo.png" alt="4C360" className="h-12 w-12 rounded-xl border border-white/10 bg-[#07111F]" />
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.26em] text-[#FFB4BC]">brochures.4cgrc.com / 4C360</p>
                  <p className="text-[12px] font-semibold text-[#7A94B4]">Interactive solution brochures</p>
                </div>
              </div>
              <h1 className="mt-8 max-w-4xl text-4xl font-black leading-[1.05] tracking-[-0.02em] text-white lg:text-6xl" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Explore 4C360 solutions by industry, workflow, and client outcome.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#B8C7DB]">
                A public microsite for prospects to understand each 4C360 solution, the modules inside it, the benefits it creates, and how AI supports the operating model.
              </p>
            </div>
            <a href={DEMO_URL} target="_blank" rel="noreferrer" className="flex h-11 items-center gap-2 rounded-xl bg-[#E11D2E] px-4 text-sm font-black text-white shadow-lg shadow-[#E11D2E]/20 hover:bg-[#F02A3A]">
              <ArrowRight size={16} />
              Book Demo
            </a>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-6 lg:px-10">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {solutions.map(solution => {
            const Icon = solution.icon;
            return (
              <button
                key={solution.slug}
                onClick={() => routeTo(solution.slug)}
                className="group rounded-3xl border border-[rgba(46,127,255,0.18)] bg-[#0A1628] p-5 text-left transition hover:-translate-y-1 hover:border-[#E11D2E]/55 hover:bg-[#0D1C34]"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10" style={{ background: `${solution.accent}22`, color: solution.accent }}>
                  <Icon size={26} />
                </span>
                <div className="mt-5 text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: solution.accent }}>{solution.label}</div>
                <h2 className="mt-2 text-2xl font-black text-white">{solution.name}</h2>
                <p className="mt-3 min-h-[96px] text-sm leading-6 text-[#B8C7DB]">{solution.subheadline}</p>
                <div className="mt-5 flex items-center gap-2 text-sm font-black text-[#7EB8F7]">
                  Open brochure <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                </div>
              </button>
            );
          })}
        </section>

        <section className="rounded-3xl border border-[#E11D2E]/25 bg-[linear-gradient(135deg,rgba(225,29,46,0.16),rgba(46,127,255,0.08))] p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.24em] text-[#FFB4BC]">Client-facing by design</div>
              <h2 className="mt-2 text-2xl font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Built for public sharing, sales conversations, and AI-assisted discovery.</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#B8C7DB]">
                Each brochure is independent from the platform app, easy to send as a link, and ready for a dedicated ElevenLabs sales advisor that can answer prospect questions.
              </p>
            </div>
            <button
              onClick={() => window.dispatchEvent(new Event('open-solutions-agent'))}
              className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-[#E11D2E] px-4 text-sm font-black text-white shadow-lg shadow-[#E11D2E]/20"
            >
              <Sparkles size={16} />
              Ask the AI advisor
            </button>
          </div>
        </section>
      </main>
      <SolutionAgentWidget />
    </div>
  );
}

function SolutionBrochure({ solution }: { solution: Solution }) {
  const [activeAudience, setActiveAudience] = useState<'All' | Audience>('All');
  const [selectedId, setSelectedId] = useState(solution.modules[0].id);
  const [query, setQuery] = useState('');
  const detailRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setActiveAudience('All');
    setQuery('');
    setSelectedId(solution.modules[0].id);
  }, [solution.slug]);

  const filteredModules = useMemo(() => {
    const lower = query.trim().toLowerCase();
    return solution.modules.filter(module => {
      const matchesAudience = activeAudience === 'All' || module.audiences.includes(activeAudience);
      const matchesQuery = !lower || `${module.name} ${module.tagline} ${module.category} ${module.summary}`.toLowerCase().includes(lower);
      return matchesAudience && matchesQuery;
    });
  }, [activeAudience, query, solution.modules]);

  useEffect(() => {
    if (!filteredModules.length) return;
    if (!filteredModules.some(module => module.id === selectedId)) {
      setSelectedId(filteredModules[0].id);
    }
  }, [filteredModules, selectedId]);

  const selected = solution.modules.find(module => module.id === selectedId) ?? solution.modules[0];
  const relevantAudiences = audiences.filter(audience => audience === 'All' || solution.modules.some(module => module.audiences.includes(audience)));

  const openModuleBrief = (id: string) => {
    setSelectedId(id);
    window.requestAnimationFrame(() => {
      detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <div className="min-h-screen bg-[#07101C] text-[#EEF3FA]">
      <section className="relative overflow-hidden border-b border-[rgba(46,127,255,0.16)] bg-[radial-gradient(circle_at_20%_20%,rgba(225,29,46,0.18),transparent_34%),radial-gradient(circle_at_76%_12%,rgba(46,127,255,0.22),transparent_36%),linear-gradient(135deg,#07101C,#0A1628_48%,#101A34)] px-6 py-8 lg:px-10">
        <div className="absolute inset-0 opacity-35" style={{ backgroundImage: 'linear-gradient(rgba(46,127,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(46,127,255,.12) 1px, transparent 1px)', backgroundSize: '42px 42px' }} />
        <div className="relative mx-auto max-w-7xl">
          <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
            <button onClick={() => routeTo()} className="flex items-center gap-2 text-sm font-bold text-[#7EB8F7] hover:text-white">
              <ArrowRight size={16} className="rotate-180" />
              Solutions hub
            </button>
            <div className="flex flex-wrap gap-2">
              {solutions.map(item => (
                <button
                  key={item.slug}
                  onClick={() => routeTo(item.slug)}
                  className={`rounded-full px-3 py-1.5 text-[12px] font-black transition ${item.slug === solution.slug ? 'bg-[#E11D2E] text-white' : 'border border-[rgba(46,127,255,0.22)] bg-[#07111F] text-[#B8C7DB] hover:text-white'}`}
                >
                  {item.name.replace('4C360 ', '')}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3">
                <img src="/4c-logo.png" alt="4C360" className="h-11 w-11 rounded-xl border border-white/10 bg-[#07111F]" />
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.26em] text-[#FFB4BC]">{solution.name}</p>
                  <p className="text-[12px] font-semibold text-[#7A94B4]">{solution.label}</p>
                </div>
              </div>
              <h1 className="mt-7 max-w-4xl text-4xl font-black leading-[1.05] tracking-[-0.02em] text-white lg:text-6xl" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {solution.headline}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#B8C7DB]">{solution.subheadline}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a href={DEMO_URL} target="_blank" rel="noreferrer" className="flex h-11 items-center gap-2 rounded-xl bg-[#E11D2E] px-4 text-sm font-black text-white shadow-lg shadow-[#E11D2E]/20 hover:bg-[#F02A3A]">
                <ArrowRight size={16} />
                Book Demo
              </a>
              <button
                onClick={() => window.dispatchEvent(new Event('open-solutions-agent'))}
                className="flex h-11 items-center gap-2 rounded-xl border border-[#E11D2E]/45 bg-[#E11D2E]/14 px-4 text-sm font-black text-[#FFB4BC] hover:bg-[#E11D2E]/22 hover:text-white"
              >
                <Sparkles size={16} />
                Ask the AI advisor
              </button>
              <button onClick={() => document.getElementById('solution-modules')?.scrollIntoView({ behavior: 'smooth' })} className="flex h-11 items-center gap-2 rounded-xl border border-[rgba(46,127,255,0.28)] bg-[#0A1628] px-4 text-sm font-bold text-[#B8C7DB] hover:text-white">
                Explore modules
              </button>
            </div>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-4">
            {solution.stats.map(([value, label]) => (
              <div key={value} className="rounded-2xl border border-[rgba(46,127,255,0.18)] bg-[#0A1628]/80 p-4">
                <div className="text-2xl font-black text-white">{value}</div>
                <div className="mt-1 text-[12px] font-semibold text-[#7A94B4]">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-6 lg:px-10">
        <section className="rounded-2xl border border-[rgba(46,127,255,0.18)] bg-[#0A1628] p-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative min-w-0 flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A94B4]" />
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Search modules, workflows, benefits..."
                className="h-11 w-full rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#07111F] pl-10 pr-3 text-sm text-[#EEF3FA] outline-none focus:border-[#E11D2E]"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {relevantAudiences.map(audience => (
                <button
                  key={audience}
                  onClick={() => {
                    setActiveAudience(audience);
                    const lower = query.trim().toLowerCase();
                    const firstMatch = solution.modules.find(module => {
                      const matchesAudience = audience === 'All' || module.audiences.includes(audience);
                      const matchesQuery = !lower || `${module.name} ${module.tagline} ${module.category} ${module.summary}`.toLowerCase().includes(lower);
                      return matchesAudience && matchesQuery;
                    });
                    if (firstMatch) setSelectedId(firstMatch.id);
                  }}
                  className={`h-10 rounded-xl px-3 text-[12px] font-black transition ${activeAudience === audience ? 'bg-[#E11D2E] text-white' : 'border border-[rgba(46,127,255,0.18)] bg-[#07111F] text-[#B8C7DB] hover:text-white'}`}
                >
                  {audience}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section id="solution-modules" className="grid gap-5 xl:grid-cols-[380px_1fr]">
          <div className="space-y-3">
            <SectionLabel icon={Network}>Module Library</SectionLabel>
            <div className="text-[12px] font-semibold text-[#7A94B4]">
              Showing {filteredModules.length} module{filteredModules.length === 1 ? '' : 's'} for {activeAudience === 'All' ? 'all audiences' : activeAudience}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {filteredModules.map(module => {
                const Icon = module.icon;
                const isSelected = module.id === selected.id;
                return (
                  <button
                    key={module.id}
                    onClick={() => openModuleBrief(module.id)}
                    className={`group rounded-2xl border p-4 text-left transition ${isSelected ? 'border-[#E11D2E]/70 bg-[rgba(225,29,46,0.10)]' : 'border-[rgba(46,127,255,0.16)] bg-[#0A1628] hover:border-[rgba(46,127,255,0.34)]'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10" style={{ background: `${module.accent}22`, color: module.accent }}>
                          <Icon size={20} />
                        </span>
                        <div>
                          <h3 className="text-base font-black text-white">{module.name}</h3>
                          <p className="mt-1 text-[11px] font-semibold text-[#7A94B4]">{module.category}</p>
                        </div>
                      </div>
                      <span className="rounded-full border border-[rgba(46,127,255,0.18)] px-2 py-1 text-[10px] font-bold text-[#7A94B4]">{module.audiences[0]}</span>
                    </div>
                    <p className="mt-3 text-[12px] leading-5 text-[#B8C7DB]">{module.tagline}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[11px] font-bold text-[#7EB8F7]">Open module brief <ArrowRight size={12} /></span>
                      {isSelected && <span className="rounded-full bg-emerald-400/12 px-2 py-1 text-[10px] font-black text-emerald-200">Selected</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <article ref={detailRef} className="scroll-mt-6 rounded-3xl border border-[rgba(46,127,255,0.18)] bg-[#0A1628] p-5 lg:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em]" style={{ background: `${selected.accent}22`, color: selected.accent }}>
                    {selected.category}
                  </span>
                  {selected.audiences.map(audience => <MetricPill key={audience}>{audience}</MetricPill>)}
                </div>
                <h2 className="mt-4 text-3xl font-black text-white lg:text-4xl" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{selected.name}</h2>
                <p className="mt-2 text-lg font-bold" style={{ color: selected.accent }}>{selected.tagline}</p>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-[#B8C7DB]">{selected.summary}</p>
              </div>
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl border border-white/10" style={{ background: `${selected.accent}22`, color: selected.accent }}>
                <selected.icon size={36} />
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-[rgba(46,127,255,0.14)] bg-[#07111F] p-4">
                <SectionLabel icon={CheckCircle2}>Business Benefits</SectionLabel>
                <ul className="mt-4 space-y-3">
                  {selected.outcomes.map(item => (
                    <li key={item} className="flex gap-3 text-sm leading-6 text-[#DDE6F8]">
                      <CheckCircle2 size={16} className="mt-1 shrink-0 text-emerald-300" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-[rgba(46,127,255,0.14)] bg-[#07111F] p-4">
                <SectionLabel icon={Sparkles}>AI Capabilities</SectionLabel>
                <ul className="mt-4 space-y-3">
                  {selected.aiCapabilities.map(item => (
                    <li key={item} className="flex gap-3 text-sm leading-6 text-[#DDE6F8]">
                      <Bot size={16} className="mt-1 shrink-0 text-[#E11D2E]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-2xl border border-[rgba(46,127,255,0.14)] bg-[#07111F] p-4">
                <SectionLabel icon={ArrowRight}>Example Workflow</SectionLabel>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {selected.workflows.map((step, index) => (
                    <div key={step} className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#0A1628] p-3">
                      <div className="text-[11px] font-black uppercase tracking-widest" style={{ color: selected.accent }}>Step {index + 1}</div>
                      <div className="mt-2 text-sm font-semibold leading-6 text-[#DDE6F8]">{step}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-[rgba(46,127,255,0.14)] bg-[#07111F] p-4">
                  <SectionLabel icon={BarChart3}>KPIs</SectionLabel>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selected.kpis.map(item => <MetricPill key={item}>{item}</MetricPill>)}
                  </div>
                </div>
                <div className="rounded-2xl border border-[rgba(46,127,255,0.14)] bg-[#07111F] p-4">
                  <SectionLabel icon={Building2}>Connected Data</SectionLabel>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selected.integrations.map(item => <MetricPill key={item}>{item}</MetricPill>)}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[#E11D2E]/25 bg-[linear-gradient(135deg,rgba(225,29,46,0.14),rgba(46,127,255,0.06))] p-4">
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#FFB4BC]">Client value</div>
              <p className="mt-2 text-lg font-black leading-7 text-white">{selected.clientValue}</p>
            </div>
          </article>
        </section>

        <section className="rounded-3xl border border-[rgba(46,127,255,0.18)] bg-[#0A1628] p-5 lg:p-6">
          <SectionLabel icon={Users}>How {solution.name} Creates Value</SectionLabel>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {solution.organizationValue.map(([title, body]) => (
              <div key={title} className="rounded-2xl border border-[rgba(46,127,255,0.14)] bg-[#07111F] p-4">
                <h3 className="text-base font-black text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#B8C7DB]">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="mb-6 rounded-3xl border border-[#E11D2E]/25 bg-[linear-gradient(135deg,rgba(225,29,46,0.16),rgba(46,127,255,0.08))] p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.24em] text-[#FFB4BC]">Who this is for</div>
              <h2 className="mt-2 text-2xl font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{solution.audience}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#B8C7DB]">{solution.name} helps prospects understand the operating model, business outcomes, connected workflows, and AI layer before a live demo.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {solution.ctas.map(cta => <MetricPill key={cta}>{cta}</MetricPill>)}
            </div>
          </div>
        </footer>
      </main>
      <SolutionAgentWidget solution={solution} />
    </div>
  );
}

export function ModuleBrochure() {
  const [slug, setSlug] = useState<SolutionSlug | null>(getCurrentSolutionSlug);

  useEffect(() => {
    const updateSlug = () => setSlug(getCurrentSolutionSlug());
    window.addEventListener('popstate', updateSlug);
    return () => window.removeEventListener('popstate', updateSlug);
  }, []);

  const solution = slug ? solutions.find(item => item.slug === slug) : undefined;

  if (!solution) {
    return <SolutionsLanding />;
  }

  return <SolutionBrochure solution={solution} />;
}
