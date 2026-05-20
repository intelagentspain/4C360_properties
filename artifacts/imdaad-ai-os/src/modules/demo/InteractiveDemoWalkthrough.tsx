import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from 'react';
import {
  BarChart3,
  BrainCircuit,
  Building2,
  CalendarRange,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  DoorOpen,
  ExternalLink,
  FileText,
  FolderOpen,
  Pause,
  Play,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  X,
  type LucideIcon,
} from 'lucide-react';
import { AllClients } from '@/components/strategic/AllClients';
import { VendorIntelligence } from '@/components/strategic/VendorIntelligence';
import { HospitalityClientView } from '@/components/client/hospitality/HospitalityClientView';
import { FieldOpsDashboard } from '@/modules/fieldops/FieldOpsDashboard';
import { ProjectCommand } from '@/modules/projectcommand';
import type { ProjectCommandScreen } from '@/modules/projectcommand/types';
import type { ToastFn } from '@/lib/ui';

type DemoScreen = 'portfolio' | 'projectcommand' | 'vendoriq' | 'fieldops' | 'resident' | 'value';

type FallbackHotspot = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type DemoFrame = {
  id: string;
  label: string;
  headline: string;
  story: string;
  clientValue: string;
  decisionQuestion: string;
  nextAction: string;
  tryLabel: string;
  anchor?: string;
  fallback?: FallbackHotspot;
};

type DemoChapter = {
  id: string;
  label: string;
  shortLabel: string;
  screen: DemoScreen;
  projectScreen?: ProjectCommandScreen;
  icon: LucideIcon;
  anchor: string;
  fallback: FallbackHotspot;
  livePath: string;
  headline: string;
  story: string;
  clientValue: string;
  decisionQuestion: string;
  nextAction: string;
  tryLabel: string;
};

type HotspotTarget = {
  anchor?: string;
  fallback: FallbackHotspot;
};

type AnchorBox = {
  left: number;
  top: number;
  width: number;
  height: number;
  stageWidth: number;
  stageHeight: number;
};

function copyWithSelection(text: string) {
  if (typeof document.execCommand !== 'function') return false;
  const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const selection = document.getSelection();
  const savedRanges = selection
    ? Array.from({ length: selection.rangeCount }, (_, index) => selection.getRangeAt(index))
    : [];
  const textarea = document.createElement('textarea');

  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  try {
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
    selection?.removeAllRanges();
    savedRanges.forEach(range => selection?.addRange(range));
    activeElement?.focus();
  }
}

async function copyText(text: string) {
  if (copyWithSelection(text)) return true;

  if (navigator.clipboard?.writeText && window.isSecureContext) {
    try {
      await Promise.race([
        navigator.clipboard.writeText(text),
        new Promise((_, reject) => window.setTimeout(() => reject(new Error('Clipboard write timed out')), 900)),
      ]);
      return true;
    } catch {
      return false;
    }
  }

  return false;
}

function buildShareUrl(chapterId: string, frameId?: string) {
  const url = new URL('/demo/properties', window.location.origin);
  url.searchParams.set('chapter', chapterId);
  if (frameId) url.searchParams.set('frame', frameId);
  return url.toString();
}

const DEMO_CHAPTERS: DemoChapter[] = [
  {
    id: 'portfolio',
    label: 'Portfolio Command',
    shortLabel: 'Portfolio',
    screen: 'portfolio',
    icon: Building2,
    anchor: 'portfolio-health-actions',
    fallback: { left: 66, top: 8, width: 25, height: 10 },
    livePath: '/',
    headline: 'Start with the portfolio view',
    story: 'Prospects see every property, status, risk level, and the fastest path into a command view.',
    clientValue: 'Leadership gets one operating picture before diving into projects, incidents, vendors, or evidence.',
    decisionQuestion: 'Which properties need leadership attention today?',
    nextAction: 'Open the highest-risk property and inspect the connected command context.',
    tryLabel: 'Focus portfolio signal',
  },
  {
    id: 'projectcommand',
    label: 'ProjectCommand Overview',
    shortLabel: 'Project',
    screen: 'projectcommand',
    projectScreen: 'overview',
    icon: Sparkles,
    anchor: 'projectcommand-context',
    fallback: { left: 4, top: 8, width: 39, height: 13 },
    livePath: '/projectcommand/overview',
    headline: 'Move from property view into project control',
    story: 'The overview ties health, blockers, manager actions, live events, and forecast movement to one project twin.',
    clientValue: 'Owners can stop reading fragmented reports and start reviewing the decisions that change delivery confidence.',
    decisionQuestion: 'What changed since baseline and who needs to act?',
    nextAction: 'Review the top manager action before looking at programme and cost detail.',
    tryLabel: 'Show project twin signal',
  },
  {
    id: 'programme',
    label: 'Programme Timeline',
    shortLabel: 'Programme',
    screen: 'projectcommand',
    projectScreen: 'programme',
    icon: CalendarRange,
    anchor: 'project-programme',
    fallback: { left: 6, top: 15, width: 58, height: 28 },
    livePath: '/projectcommand/programme',
    headline: 'Explain the schedule in business language',
    story: 'Programme view exposes critical path, delay risk, contractor filters, and AI recovery suggestions.',
    clientValue: 'Commercial and delivery teams see the same schedule risk, instead of debating whose report is current.',
    decisionQuestion: 'Which phase is most likely to move handover?',
    nextAction: 'Use contractor and critical-path controls to isolate the recovery discussion.',
    tryLabel: 'Highlight schedule risk',
  },
  {
    id: 'stagegates',
    label: 'Stage Gates',
    shortLabel: 'Gates',
    screen: 'projectcommand',
    projectScreen: 'stagegates',
    icon: Target,
    anchor: 'project-stage-gates',
    fallback: { left: 7, top: 13, width: 56, height: 24 },
    livePath: '/projectcommand/stagegates',
    headline: 'Turn stage gates into owner actions',
    story: 'Gate Control Board shows blocked gates, evidence gaps, approvers, and local recovery actions.',
    clientValue: 'Stage readiness becomes visible and assignable, not buried inside checklist files.',
    decisionQuestion: 'Which gate blocks the next value milestone?',
    nextAction: 'Queue the owner recovery action for the priority gate.',
    tryLabel: 'Show Blocked Gate',
  },
  {
    id: 'cost',
    label: 'Cost Intelligence',
    shortLabel: 'Cost',
    screen: 'projectcommand',
    projectScreen: 'cost',
    icon: BarChart3,
    anchor: 'project-cost',
    fallback: { left: 6, top: 13, width: 60, height: 28 },
    livePath: '/projectcommand/cost',
    headline: 'Connect budget, commitments, variations, and forecast',
    story: 'Cost Intelligence shows the money flow from baseline to forecast, with manager actions tied to live exposure.',
    clientValue: 'Owners can see where cost pressure is coming from and which decision reduces exposure.',
    decisionQuestion: 'Which commercial decision changes the final cost forecast?',
    nextAction: 'Open the VO queue or package driver behind the top exposure.',
    tryLabel: 'Show cost driver',
  },
  {
    id: 'risk',
    label: 'Risk Command',
    shortLabel: 'Risk',
    screen: 'projectcommand',
    projectScreen: 'risk',
    icon: ShieldAlert,
    anchor: 'project-risk',
    fallback: { left: 7, top: 14, width: 55, height: 26 },
    livePath: '/projectcommand/risk',
    headline: 'Make risk registers usable',
    story: 'Risk Command combines probability, impact, trends, Monte Carlo completion, and AI warnings in one workspace.',
    clientValue: 'Risk review moves from static scoring to practical mitigation and scenario awareness.',
    decisionQuestion: 'Which open risk is now driving cost or programme exposure?',
    nextAction: 'Open the risk register and inspect the AI early warning.',
    tryLabel: 'Inspect risk driver',
  },
  {
    id: 'forecast',
    label: 'AI Forecast',
    shortLabel: 'Forecast',
    screen: 'projectcommand',
    projectScreen: 'forecast',
    icon: BrainCircuit,
    anchor: 'project-forecast',
    fallback: { left: 7, top: 13, width: 56, height: 27 },
    livePath: '/projectcommand/forecast',
    headline: 'Show outcomes before they happen',
    story: 'AI Forecast compares optimistic, base, and pessimistic outcomes, then turns them into top decisions.',
    clientValue: 'Potential clients can see how the system supports board-level judgement before month-end reports arrive.',
    decisionQuestion: 'What happens if the current blockers are not resolved?',
    nextAction: 'Compare scenarios and use the chat panel to explain the forecast.',
    tryLabel: 'Compare scenarios',
  },
  {
    id: 'obligations',
    label: 'Obligations',
    shortLabel: 'Obligations',
    screen: 'projectcommand',
    projectScreen: 'obligations',
    icon: FileText,
    anchor: 'project-obligations',
    fallback: { left: 7, top: 13, width: 58, height: 25 },
    livePath: '/projectcommand/obligations',
    headline: 'Keep obligations connected to delivery',
    story: 'The obligations register makes authority, owner, deadline, project, and status visible in one action queue.',
    clientValue: 'Compliance and commercial duties stay connected to the project plan and evidence trail.',
    decisionQuestion: 'Which obligation is overdue or missing proof?',
    nextAction: 'Open the obligation detail and link the required evidence.',
    tryLabel: 'Review obligation',
  },
  {
    id: 'evidence',
    label: 'Evidence',
    shortLabel: 'Evidence',
    screen: 'projectcommand',
    projectScreen: 'evidence',
    icon: FolderOpen,
    anchor: 'project-evidence',
    fallback: { left: 7, top: 14, width: 58, height: 24 },
    livePath: '/projectcommand/evidence',
    headline: 'Make proof part of the operating system',
    story: 'Evidence Control Centre separates current, expired, and action-required documents before they block handover.',
    clientValue: 'Evidence stops being a file repository and becomes a readiness control.',
    decisionQuestion: 'Which proof gap could delay approval or handover?',
    nextAction: 'Prepare the evidence pack and close the expired document action.',
    tryLabel: 'Highlight proof gap',
  },
  {
    id: 'vendoriq',
    label: 'VendorIQ',
    shortLabel: 'VendorIQ',
    screen: 'vendoriq',
    icon: ShieldCheck,
    anchor: 'vendoriq-command',
    fallback: { left: 6, top: 12, width: 56, height: 25 },
    livePath: '/vendorintelligence',
    headline: 'Prove vendor performance with operational data',
    story: 'VendorIQ connects SLA, quality, evidence, cost, repeat failures, and procurement actions.',
    clientValue: 'Clients can defend vendor decisions with measurable performance instead of anecdotal feedback.',
    decisionQuestion: 'Which vendor should be corrected, renewed, or replaced?',
    nextAction: 'Open the procurement copilot and generate an action pack.',
    tryLabel: 'Open vendor signal',
  },
  {
    id: 'fieldops',
    label: 'FieldOps',
    shortLabel: 'FieldOps',
    screen: 'fieldops',
    icon: Smartphone,
    anchor: 'fieldops-kpis',
    fallback: { left: 6, top: 25, width: 56, height: 18 },
    livePath: '/fieldops',
    headline: 'Show how the field closes the loop',
    story: 'FieldOps creates, assigns, shares, and tracks mobile surveys, inspections, and evidence capture.',
    clientValue: 'Execution teams create the proof and action data that ProjectCommand depends on.',
    decisionQuestion: 'How does the system turn site work into verified evidence?',
    nextAction: 'Create or assign a survey and track live submissions.',
    tryLabel: 'Track field survey',
  },
  {
    id: 'resident',
    label: 'Resident Experience',
    shortLabel: 'Resident',
    screen: 'resident',
    icon: DoorOpen,
    anchor: 'resident-experience',
    fallback: { left: 10, top: 13, width: 38, height: 35 },
    livePath: '/residentportal',
    headline: 'Show the client-facing service layer',
    story: 'The resident experience captures issues by camera, upload, voice, or AI chat and connects them to operations.',
    clientValue: 'Property teams can show both executive control and a calmer front-door experience for residents.',
    decisionQuestion: 'How quickly can a resident request become structured work?',
    nextAction: 'Open the reporting options and show how the request is classified.',
    tryLabel: 'Show resident intake',
  },
  {
    id: 'value',
    label: 'Value Recap',
    shortLabel: 'Value',
    screen: 'value',
    icon: CheckCircle2,
    anchor: 'demo-value-recap',
    fallback: { left: 8, top: 18, width: 56, height: 28 },
    livePath: '/',
    headline: 'Close with the operating model',
    story: 'The demo ends by tying portfolio visibility, project controls, evidence, vendors, field execution, and residents into one owner story.',
    clientValue: 'Prospects leave with a clear map of how 4C360 changes decisions, accountability, and delivery confidence.',
    decisionQuestion: 'Which workflow should the client pilot first?',
    nextAction: 'Choose the first pilot path and schedule a tailored walkthrough.',
    tryLabel: 'Summarize value',
  },
];

const DEMO_FRAMES: Record<string, DemoFrame[]> = {
  portfolio: [
    {
      id: 'health-actions',
      label: 'Health Actions',
      anchor: 'portfolio-health-actions',
      fallback: { left: 66, top: 8, width: 25, height: 10 },
      headline: 'Start with owner-level health signals',
      story: 'Use the portfolio controls to show status, risk, and the fastest path into a command view.',
      clientValue: 'Leadership starts with a clean portfolio signal instead of a spreadsheet hunt.',
      decisionQuestion: 'Which asset needs attention first?',
      nextAction: 'Select the property with the clearest control signal.',
      tryLabel: 'Show Portfolio Signal',
    },
    {
      id: 'portfolio-map',
      label: 'Portfolio Map',
      anchor: 'portfolio-command',
      fallback: { left: 5, top: 18, width: 56, height: 26 },
      headline: 'Explain the portfolio as one operating picture',
      story: 'Move from executive status into the property, project, vendor, or evidence context without changing systems.',
      clientValue: 'The client sees how each asset connects to the same operating model.',
      decisionQuestion: 'Where is the risk concentrated across the portfolio?',
      nextAction: 'Use the map or portfolio list to open the relevant operating surface.',
      tryLabel: 'Show Portfolio Map',
    },
    {
      id: 'command-path',
      label: 'Command Path',
      fallback: { left: 56, top: 31, width: 34, height: 22 },
      headline: 'Turn portfolio attention into a command path',
      story: 'Show how a property signal becomes a project control conversation in one click.',
      clientValue: 'There is a visible path from owner concern to the team that can act.',
      decisionQuestion: 'Which command view should the client enter from this signal?',
      nextAction: 'Open ProjectCommand for the selected asset.',
      tryLabel: 'Open Command Path',
    },
  ],
  projectcommand: [
    {
      id: 'project-context',
      label: 'Project Context',
      anchor: 'projectcommand-context',
      fallback: { left: 4, top: 8, width: 39, height: 13 },
      headline: 'Move from property view into project control',
      story: 'Show the project twin, budget, completion, ownership context, and route into detailed controls.',
      clientValue: 'Owners stop reading disconnected reports and enter the live control surface.',
      decisionQuestion: 'What changed since baseline and who needs to act?',
      nextAction: 'Start with the project twin before diving into programme, cost, and risk.',
      tryLabel: 'Show Project Twin',
    },
    {
      id: 'control-tabs',
      label: 'Control Tabs',
      anchor: 'projectcommand-tabs',
      fallback: { left: 6, top: 22, width: 62, height: 10 },
      headline: 'Show the connected command modules',
      story: 'Programme, stage gates, cost, risk, obligations, evidence, and forecast stay in one project context.',
      clientValue: 'The client sees that the project view is not another isolated dashboard.',
      decisionQuestion: "Which control lens explains today's decision best?",
      nextAction: 'Use the tabs to move from overview into the relevant control lane.',
      tryLabel: 'Show Control Tabs',
    },
    {
      id: 'action-queue',
      label: 'Action Queue',
      fallback: { left: 6, top: 42, width: 58, height: 28 },
      headline: 'Turn insight into owner-ready actions',
      story: 'Use the command surface to show manager actions, blockers, and local recovery moves.',
      clientValue: 'A project review ends with assigned actions, not just commentary.',
      decisionQuestion: 'Which action changes delivery confidence this week?',
      nextAction: 'Open the next project control module with the highest signal.',
      tryLabel: 'Show Action Queue',
    },
  ],
  programme: [
    {
      id: 'critical-path',
      label: 'Critical Path',
      anchor: 'project-programme',
      fallback: { left: 6, top: 15, width: 58, height: 28 },
      headline: 'Explain the schedule in business language',
      story: 'Show critical path, float, delay risk, and the phase most likely to affect handover.',
      clientValue: 'Delivery risk becomes visible without asking the client to decode a programme file.',
      decisionQuestion: 'Which phase is most likely to move handover?',
      nextAction: 'Focus the recovery conversation on the critical path.',
      tryLabel: 'Show Critical Path',
    },
    {
      id: 'contractor-view',
      label: 'Contractors',
      fallback: { left: 6, top: 30, width: 40, height: 20 },
      headline: 'Filter programme risk by accountable party',
      story: 'Use contractor and phase views to isolate where delay risk is owned.',
      clientValue: 'The client can move from schedule pressure to the team responsible for recovery.',
      decisionQuestion: 'Which contractor is driving the next delay exposure?',
      nextAction: 'Filter to the contractor with the active programme risk.',
      tryLabel: 'Show Contractor Risk',
    },
    {
      id: 'recovery-plan',
      label: 'Recovery Plan',
      fallback: { left: 50, top: 31, width: 42, height: 24 },
      headline: 'Show recovery options instead of delay narration',
      story: 'Use AI recovery suggestions and phase controls to explain what could protect the milestone.',
      clientValue: 'The demo moves from reporting delay to discussing the recovery decision.',
      decisionQuestion: 'Which recovery move protects the next milestone?',
      nextAction: 'Queue the recovery discussion for the owner review.',
      tryLabel: 'Show Recovery Plan',
    },
  ],
  stagegates: [
    {
      id: 'blocked-gate',
      label: 'Blocked Gate',
      anchor: 'project-stage-gates',
      fallback: { left: 7, top: 13, width: 56, height: 24 },
      headline: 'Turn stage gates into owner actions',
      story: 'Gate Control Board shows blocked gates, evidence gaps, approvers, and local recovery actions.',
      clientValue: 'Stage readiness becomes visible and assignable, not buried inside checklist files.',
      decisionQuestion: 'Which gate blocks the next value milestone?',
      nextAction: 'Queue the owner recovery action for the priority gate.',
      tryLabel: 'Show Blocked Gate',
    },
    {
      id: 'evidence-gaps',
      label: 'Evidence Gaps',
      fallback: { left: 7, top: 42, width: 48, height: 24 },
      headline: 'Expose the proof gap behind the blocked gate',
      story: 'Show how missing, expired, or rejected evidence keeps the gate from moving.',
      clientValue: 'The client sees exactly what proof is needed before approval can progress.',
      decisionQuestion: 'Which evidence item is blocking clearance?',
      nextAction: 'Open the evidence dependency and assign the owner.',
      tryLabel: 'Show Evidence Gap',
    },
    {
      id: 'recovery-actions',
      label: 'Recovery Actions',
      fallback: { left: 56, top: 42, width: 37, height: 25 },
      headline: 'Convert gate risk into a recovery queue',
      story: 'Use the gate action controls to show who must act, what they must provide, and when it is due.',
      clientValue: 'Gate review becomes a decision workflow instead of a static checkpoint.',
      decisionQuestion: 'Who owns the next unblock action?',
      nextAction: 'Queue the recovery action and move to cost or evidence impact.',
      tryLabel: 'Show Recovery Action',
    },
  ],
  cost: [
    {
      id: 'forecast',
      label: 'Forecast',
      anchor: 'project-cost',
      fallback: { left: 6, top: 13, width: 60, height: 28 },
      headline: 'Connect budget, commitments, variations, and forecast',
      story: 'Show how the project moves from baseline budget to live forecast exposure.',
      clientValue: 'Owners see where cost pressure is coming from before it becomes a surprise.',
      decisionQuestion: 'Which commercial decision changes the final cost forecast?',
      nextAction: 'Open the top exposure and inspect the driver.',
      tryLabel: 'Show Cost Forecast',
    },
    {
      id: 'variations',
      label: 'Variations',
      fallback: { left: 6, top: 36, width: 45, height: 25 },
      headline: 'Make variation exposure visible',
      story: 'Use the VO queue to connect pending approvals, contractor pressure, and forecast movement.',
      clientValue: 'The client can see which commercial item needs a decision.',
      decisionQuestion: 'Which variation is changing exposure?',
      nextAction: 'Open the pending variation and assign the commercial response.',
      tryLabel: 'Show Variation Queue',
    },
    {
      id: 'package-drivers',
      label: 'Package Drivers',
      fallback: { left: 52, top: 36, width: 40, height: 25 },
      headline: 'Explain cost movement by package',
      story: 'Package drivers show where procurement, progress, and claims affect final cost.',
      clientValue: 'Budget review becomes specific enough for action.',
      decisionQuestion: 'Which package is driving the forecast change?',
      nextAction: 'Use package detail to agree the next commercial move.',
      tryLabel: 'Show Package Driver',
    },
  ],
  risk: [
    {
      id: 'risk-register',
      label: 'Risk Register',
      anchor: 'project-risk',
      fallback: { left: 7, top: 14, width: 55, height: 26 },
      headline: 'Make risk registers usable',
      story: 'Show probability, impact, trend, and ownership in a live risk workspace.',
      clientValue: 'Risk review becomes practical and current.',
      decisionQuestion: 'Which open risk is now driving cost or programme exposure?',
      nextAction: 'Open the top risk and inspect its mitigation plan.',
      tryLabel: 'Show Risk Register',
    },
    {
      id: 'mitigation',
      label: 'Mitigation',
      fallback: { left: 7, top: 38, width: 42, height: 24 },
      headline: 'Connect risk to mitigation ownership',
      story: 'Show which risks have mitigation progress, stale ownership, or missing evidence.',
      clientValue: 'The client can challenge action quality, not just risk scores.',
      decisionQuestion: 'Which mitigation needs owner confirmation?',
      nextAction: 'Assign the mitigation update to the accountable owner.',
      tryLabel: 'Show Mitigation',
    },
    {
      id: 'risk-scenario',
      label: 'Scenario Impact',
      fallback: { left: 52, top: 38, width: 40, height: 24 },
      headline: 'Tie risk to programme and cost scenarios',
      story: 'Scenario views show what happens if the risk remains open.',
      clientValue: 'Risk becomes a board-level outcome conversation.',
      decisionQuestion: 'What outcome changes if this risk is not closed?',
      nextAction: 'Compare the scenario impact with the mitigation cost.',
      tryLabel: 'Show Scenario Impact',
    },
  ],
  forecast: [
    {
      id: 'scenarios',
      label: 'Scenarios',
      anchor: 'project-forecast',
      fallback: { left: 7, top: 13, width: 56, height: 27 },
      headline: 'Show outcomes before they happen',
      story: 'Compare optimistic, base, and pessimistic outcomes from the same project signal.',
      clientValue: 'Owners can discuss likely outcomes before month-end reports arrive.',
      decisionQuestion: 'What happens if current blockers are not resolved?',
      nextAction: 'Compare the scenarios and call out the decision that changes the curve.',
      tryLabel: 'Show Scenarios',
    },
    {
      id: 'confidence',
      label: 'Confidence',
      fallback: { left: 7, top: 38, width: 42, height: 22 },
      headline: 'Explain confidence, not just prediction',
      story: 'Use confidence signals to show why the forecast is moving and what evidence supports it.',
      clientValue: 'The forecast is easier to trust because the evidence is visible.',
      decisionQuestion: 'Which signal is reducing forecast confidence?',
      nextAction: 'Open the signal and explain its evidence basis.',
      tryLabel: 'Show Confidence',
    },
    {
      id: 'decisions',
      label: 'Decision Cards',
      fallback: { left: 52, top: 38, width: 40, height: 22 },
      headline: 'Turn forecast movement into decisions',
      story: 'Decision cards show which action protects date, cost, or readiness.',
      clientValue: 'The forecast becomes a decision aid rather than a passive prediction.',
      decisionQuestion: 'Which decision improves the base case?',
      nextAction: 'Choose the decision card to discuss with the client.',
      tryLabel: 'Show Decision Card',
    },
  ],
  obligations: [
    {
      id: 'register',
      label: 'Register',
      anchor: 'project-obligations',
      fallback: { left: 7, top: 13, width: 58, height: 25 },
      headline: 'Keep obligations connected to delivery',
      story: 'Show authority, owner, deadline, project, and status in one action queue.',
      clientValue: 'Compliance and commercial duties stay connected to the project plan.',
      decisionQuestion: 'Which obligation is overdue or missing proof?',
      nextAction: 'Open the obligation detail and assign the owner.',
      tryLabel: 'Show Obligation',
    },
    {
      id: 'deadlines',
      label: 'Deadlines',
      fallback: { left: 7, top: 40, width: 44, height: 22 },
      headline: 'Make deadline exposure visible',
      story: 'Use due dates and status to show which obligations need action before handover.',
      clientValue: 'The client can see what must be resolved before it becomes a delay.',
      decisionQuestion: 'Which deadline is most exposed?',
      nextAction: 'Prioritize the overdue or near-due obligation.',
      tryLabel: 'Show Deadline Risk',
    },
    {
      id: 'evidence-link',
      label: 'Evidence Link',
      fallback: { left: 52, top: 40, width: 40, height: 22 },
      headline: 'Connect each obligation to proof',
      story: 'Show how an obligation is closed with linked evidence rather than a manual note.',
      clientValue: 'Compliance can be traced to real documents and approvals.',
      decisionQuestion: 'Which proof is required to close this item?',
      nextAction: 'Open the linked evidence path.',
      tryLabel: 'Show Evidence Link',
    },
  ],
  evidence: [
    {
      id: 'readiness',
      label: 'Readiness',
      anchor: 'project-evidence',
      fallback: { left: 7, top: 14, width: 58, height: 24 },
      headline: 'Make proof part of the operating system',
      story: 'Evidence Control Centre separates current, expired, and action-required documents.',
      clientValue: 'Evidence becomes a readiness control, not just a file repository.',
      decisionQuestion: 'Which proof gap could delay approval or handover?',
      nextAction: 'Open the document state that needs action.',
      tryLabel: 'Show Readiness',
    },
    {
      id: 'expired-docs',
      label: 'Expired Docs',
      fallback: { left: 7, top: 39, width: 44, height: 24 },
      headline: 'Call out documents that can block handover',
      story: 'Expired and rejected documents are shown as control signals with owners and dates.',
      clientValue: 'The client sees proof risk before it becomes an approval issue.',
      decisionQuestion: 'Which document needs replacement now?',
      nextAction: 'Assign the expired document action.',
      tryLabel: 'Show Expired Docs',
    },
    {
      id: 'pack-prep',
      label: 'Pack Prep',
      fallback: { left: 52, top: 39, width: 40, height: 24 },
      headline: 'Prepare evidence packs from the live register',
      story: 'Use the evidence pack flow to show how readiness proof is assembled for review.',
      clientValue: 'Document collection becomes a repeatable handover workflow.',
      decisionQuestion: 'Which pack should be prepared for the next gate?',
      nextAction: 'Prepare the evidence pack for client review.',
      tryLabel: 'Show Pack Prep',
    },
  ],
  vendoriq: [
    {
      id: 'scorecard',
      label: 'Scorecard',
      anchor: 'vendoriq-command',
      fallback: { left: 6, top: 12, width: 56, height: 25 },
      headline: 'Prove vendor performance with operational data',
      story: 'VendorIQ connects SLA, quality, evidence, cost, repeat failures, and procurement actions.',
      clientValue: 'Clients defend vendor decisions with measurable performance.',
      decisionQuestion: 'Which vendor should be corrected, renewed, or replaced?',
      nextAction: 'Open the vendor scorecard and show the performance signal.',
      tryLabel: 'Show Vendor Score',
    },
    {
      id: 'quote-comparison',
      label: 'Quote Compare',
      fallback: { left: 6, top: 36, width: 44, height: 24 },
      headline: 'Compare vendor options with context',
      story: 'Use quote comparison to show how bid ranking connects to performance and risk.',
      clientValue: 'Procurement decisions become explainable and defensible.',
      decisionQuestion: 'Which quote is best once risk and performance are included?',
      nextAction: 'Open the compare quotes flow.',
      tryLabel: 'Show Quote Compare',
    },
    {
      id: 'action-pack',
      label: 'Action Pack',
      fallback: { left: 52, top: 36, width: 40, height: 24 },
      headline: 'Turn vendor risk into an action pack',
      story: 'Show corrective notice, approvals, and KPI targets generated from the scorecard.',
      clientValue: 'Vendor management moves from concern to documented action.',
      decisionQuestion: 'What action should be taken with the at-risk vendor?',
      nextAction: 'Generate the action pack and review the owner route.',
      tryLabel: 'Show Action Pack',
    },
  ],
  fieldops: [
    {
      id: 'kpis',
      label: 'KPI Strip',
      anchor: 'fieldops-kpis',
      fallback: { left: 6, top: 25, width: 56, height: 18 },
      headline: 'Show how the field closes the loop',
      story: 'FieldOps creates, assigns, shares, and tracks mobile surveys, inspections, and evidence capture.',
      clientValue: 'Execution teams create the proof and action data that ProjectCommand depends on.',
      decisionQuestion: 'How does the system turn site work into verified evidence?',
      nextAction: 'Start with the field KPI strip and live survey counts.',
      tryLabel: 'Show Field KPIs',
    },
    {
      id: 'active-surveys',
      label: 'Active Surveys',
      fallback: { left: 6, top: 52, width: 62, height: 24 },
      headline: 'Show the survey work queue',
      story: 'Active surveys show assignment, status, capture method, and response counts.',
      clientValue: 'Field execution becomes visible while work is happening.',
      decisionQuestion: 'Which survey needs attention or assignment?',
      nextAction: 'Open the active survey and inspect its capture state.',
      tryLabel: 'Show Active Survey',
    },
    {
      id: 'capture-methods',
      label: 'Capture Methods',
      fallback: { left: 52, top: 25, width: 40, height: 22 },
      headline: 'Explain proof capture in the field',
      story: 'Field teams can capture evidence through mobile-ready survey and inspection workflows.',
      clientValue: 'Project proof is generated at the source, not reconstructed later.',
      decisionQuestion: 'Which capture method proves the work best?',
      nextAction: 'Show how capture data feeds back to the control surface.',
      tryLabel: 'Show Capture Method',
    },
  ],
  resident: [
    {
      id: 'intake',
      label: 'Resident Intake',
      anchor: 'resident-report-options',
      fallback: { left: 4, top: 36, width: 60, height: 30 },
      headline: 'Show the client-facing service layer',
      story: 'Residents can report issues by camera, upload, voice, or AI chat from one simple front door.',
      clientValue: 'The client sees the resident experience connected to operations.',
      decisionQuestion: 'How quickly can a resident request become structured work?',
      nextAction: 'Open the reporting options and show classification.',
      tryLabel: 'Show Resident Intake',
    },
    {
      id: 'timeline',
      label: 'Timeline',
      anchor: 'resident-service-sla',
      fallback: { left: 4, top: 66, width: 60, height: 14 },
      headline: 'Show the resident-facing service timeline',
      story: 'The timeline makes progress, updates, and next steps visible to the resident.',
      clientValue: 'Residents get clarity without calling for status.',
      decisionQuestion: 'What does the resident see after submitting a request?',
      nextAction: 'Show how the request status is communicated.',
      tryLabel: 'Show Timeline',
    },
    {
      id: 'handoff',
      label: 'Ops Handoff',
      anchor: 'resident-action-links',
      fallback: { left: 4, top: 80, width: 60, height: 16 },
      headline: 'Connect resident requests to operations',
      story: 'Resident intake becomes structured work for field and property teams.',
      clientValue: 'The front-office experience is connected to back-office execution.',
      decisionQuestion: 'Which team owns the next response?',
      nextAction: 'Show the operational handoff path.',
      tryLabel: 'Show Ops Handoff',
    },
  ],
  value: [
    {
      id: 'operating-model',
      label: 'Operating Model',
      anchor: 'demo-value-recap',
      fallback: { left: 8, top: 18, width: 56, height: 28 },
      headline: 'Close with the operating model',
      story: 'Tie portfolio visibility, project controls, evidence, vendors, field execution, and residents into one owner story.',
      clientValue: 'Prospects leave with a clear map of how 4C360 changes decisions and accountability.',
      decisionQuestion: 'Which workflow should the client pilot first?',
      nextAction: 'Choose the first pilot path and schedule a tailored walkthrough.',
      tryLabel: 'Show Operating Model',
    },
    {
      id: 'pilot-path',
      label: 'Pilot Path',
      fallback: { left: 8, top: 53, width: 42, height: 25 },
      headline: 'Recommend a clear pilot path',
      story: 'Start with one active handover, DLP, or critical delivery project where proof and action ownership matter.',
      clientValue: 'The client sees a low-risk way to prove value quickly.',
      decisionQuestion: 'Which pilot has the strongest signal?',
      nextAction: 'Pick the first project and success metric.',
      tryLabel: 'Show Pilot Path',
    },
    {
      id: 'expansion',
      label: 'Expansion',
      fallback: { left: 52, top: 53, width: 38, height: 25 },
      headline: 'Show how the model expands',
      story: 'After ProjectCommand, add VendorIQ, FieldOps capture, and resident intake to widen the operating model.',
      clientValue: 'The demo ends with a path from first pilot to broader portfolio adoption.',
      decisionQuestion: 'What expands after the first pilot succeeds?',
      nextAction: 'Agree the next module sequence and timeline.',
      tryLabel: 'Show Expansion Path',
    },
  ],
};

function getChapterById(chapterId: string) {
  return DEMO_CHAPTERS.find(chapter => chapter.id === chapterId) ?? DEMO_CHAPTERS[0];
}

function getChapterFrames(chapter: DemoChapter): DemoFrame[] {
  return DEMO_FRAMES[chapter.id] ?? [
    {
      id: 'overview',
      label: chapter.shortLabel,
      headline: chapter.headline,
      story: chapter.story,
      clientValue: chapter.clientValue,
      decisionQuestion: chapter.decisionQuestion,
      nextAction: chapter.nextAction,
      tryLabel: chapter.tryLabel,
      anchor: chapter.anchor,
      fallback: chapter.fallback,
    },
  ];
}

function resolveFrameId(chapter: DemoChapter, requested?: string | null) {
  const frames = getChapterFrames(chapter);
  return frames.some(frame => frame.id === requested) ? requested! : frames[0].id;
}

function readDemoLocationFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get('chapter');
  const chapter = DEMO_CHAPTERS.find(item => item.id === requested);
  if (!chapter) return null;

  return {
    chapterId: chapter.id,
    frameId: resolveFrameId(chapter, params.get('frame')),
  };
}

function resolveInitialChapter() {
  return readDemoLocationFromUrl()?.chapterId ?? DEMO_CHAPTERS[0].id;
}

function resolveInitialFrame(chapterId: string) {
  const location = readDemoLocationFromUrl();
  if (location?.chapterId === chapterId) return location.frameId;
  return resolveFrameId(getChapterById(chapterId));
}

function updateChapterUrl(chapterId: string, frameId?: string) {
  const url = new URL(window.location.href);
  url.searchParams.set('chapter', chapterId);
  url.searchParams.set('frame', frameId ?? resolveFrameId(getChapterById(chapterId)));
  window.history.replaceState({}, '', `${url.pathname}?${url.searchParams.toString()}${url.hash}`);
}

function useAnchorBox(stageRef: RefObject<HTMLDivElement | null>, target: HotspotTarget) {
  const [box, setBox] = useState<AnchorBox | null>(null);

  useEffect(() => {
    let frame = 0;
    const stage = stageRef.current;
    if (!stage) return undefined;

    const measure = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const root = stageRef.current;
        if (!root) return;

        const rootRect = root.getBoundingClientRect();
        const fallbackBox = (): AnchorBox => {
          const left = (rootRect.width * target.fallback.left) / 100;
          const top = (rootRect.height * target.fallback.top) / 100;
          const width = (rootRect.width * target.fallback.width) / 100;
          const height = (rootRect.height * target.fallback.height) / 100;
          return {
            left: Math.max(10, Math.min(left, rootRect.width - 90)),
            top: Math.max(10, Math.min(top, rootRect.height - 70)),
            width: Math.max(84, Math.min(width, rootRect.width - left - 10)),
            height: Math.max(42, Math.min(height, rootRect.height - top - 10)),
            stageWidth: rootRect.width,
            stageHeight: rootRect.height,
          };
        };

        if (!target.anchor) {
          setBox(fallbackBox());
          return;
        }

        const anchor = root.querySelector(`[data-demo-anchor="${target.anchor}"]`) as HTMLElement | null;
        if (!anchor) {
          setBox(fallbackBox());
          return;
        }

        const rect = anchor.getBoundingClientRect();
        const relativeLeft = rect.left - rootRect.left;
        const relativeTop = rect.top - rootRect.top;
        const startsNearSurfaceOrigin = relativeLeft < rootRect.width * 0.12 && relativeTop < rootRect.height * 0.12;
        const isFullSurface = startsNearSurfaceOrigin && rect.width > rootRect.width * 0.82 && rect.height > rootRect.height * 0.66;
        const isOversizedAnchor = rect.width > rootRect.width * 0.76 && rect.height > rootRect.height * 0.38;
        if (isFullSurface || isOversizedAnchor) {
          setBox(fallbackBox());
          return;
        }

        const left = Math.max(10, Math.min(rect.left - rootRect.left, rootRect.width - 90));
        const top = Math.max(10, Math.min(rect.top - rootRect.top, rootRect.height - 70));
        const width = Math.max(84, Math.min(rect.width, rootRect.width - left - 10));
        const height = Math.max(42, Math.min(rect.height, rootRect.height - top - 10));
        setBox({ left, top, width, height, stageWidth: rootRect.width, stageHeight: rootRect.height });
      });
    };

    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(stage);
    const interval = window.setInterval(measure, 900);
    stage.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);

    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      window.clearInterval(interval);
      stage.removeEventListener('scroll', measure, true);
      window.removeEventListener('resize', measure);
    };
  }, [stageRef, target.anchor, target.fallback.height, target.fallback.left, target.fallback.top, target.fallback.width]);

  return box;
}

function StageHotspot({ box, fallback }: { box: AnchorBox | null; fallback: FallbackHotspot }) {
  const highlightStyle: CSSProperties = box
    ? { left: box.left, top: box.top, width: box.width, height: box.height }
    : { left: `${fallback.left}%`, top: `${fallback.top}%`, width: `${fallback.width}%`, height: `${fallback.height}%` };

  return (
    <div
      aria-hidden="true"
      data-demo-hotspot="true"
      className="pointer-events-none absolute z-30 bg-transparent"
      style={highlightStyle}
    >
      <span className="absolute left-0 top-0 h-3 w-3 -translate-x-px -translate-y-px rounded-tl-xl border-l-2 border-t-2 border-cyan-200/80" />
      <span className="absolute right-0 top-0 h-3 w-3 translate-x-px -translate-y-px rounded-tr-xl border-r-2 border-t-2 border-cyan-200/80" />
      <span className="absolute bottom-0 left-0 h-3 w-3 -translate-x-px translate-y-px rounded-bl-xl border-b-2 border-l-2 border-cyan-200/80" />
      <span className="absolute bottom-0 right-0 h-3 w-3 translate-x-px translate-y-px rounded-br-xl border-b-2 border-r-2 border-cyan-200/80" />
    </div>
  );
}

function ValueRecap() {
  const outcomes = [
    ['Portfolio', 'One view of property health, risk, and next actions.'],
    ['ProjectCommand', 'Programme, cost, risk, obligations, evidence, and forecast in one control model.'],
    ['VendorIQ', 'Partner performance tied to SLA, quality, cost, and proof.'],
    ['FieldOps', 'Mobile execution creates structured evidence and live progress.'],
    ['Resident layer', 'Requests enter the same operating system instead of a disconnected inbox.'],
  ];

  return (
    <div className="custom-scrollbar h-full overflow-y-auto bg-[#07111F] px-6 py-6 text-[#EEF3FA]" data-demo-anchor="demo-value-recap">
      <div className="mx-auto flex max-w-5xl flex-col gap-5">
        <div className="rounded-2xl border border-[#2E7FFF]/24 bg-[linear-gradient(135deg,rgba(46,127,255,0.18),rgba(124,58,237,0.14),rgba(7,17,31,0.98))] p-6">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">
            <Sparkles size={14} />
            Client demo close
          </div>
          <h2 className="mt-4 max-w-3xl text-3xl font-black leading-tight text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            One connected operating model from owner signal to field proof.
          </h2>
          <p className="mt-3 max-w-3xl text-[14px] leading-6 text-[#B8C7DB]">
            The walkthrough shows how a property owner can discover portfolio risk, open a project twin, trace cost and evidence blockers, act on vendor performance, and see field or resident activity flow back into the same system.
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-5">
          {outcomes.map(([label, detail]) => (
            <div key={label} className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.82)] p-4">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-300/24 bg-cyan-300/10 text-cyan-200">
                <CheckCircle2 size={17} />
              </div>
              <div className="text-[13px] font-black text-white">{label}</div>
              <p className="mt-2 text-[11px] leading-5 text-[#8EA7C7]">{detail}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {[
            ['Pilot path', 'Start with ProjectCommand on one active handover or DLP project.'],
            ['Success proof', 'Show avoided delay, closed evidence gaps, and action ownership in the first review cycle.'],
            ['Expansion path', 'Add VendorIQ, FieldOps capture, and resident intake once the control twin is trusted.'],
          ].map(([title, body]) => (
            <section key={title} className="rounded-xl border border-[#7C3AED]/22 bg-[#7C3AED]/10 p-4">
              <h3 className="text-[14px] font-black text-[#DDD6FE]">{title}</h3>
              <p className="mt-2 text-[12px] leading-5 text-[#C4B5FD]">{body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function DemoStage({
  chapter,
  onToast,
  onOpenChapter,
}: {
  chapter: DemoChapter;
  onToast: ToastFn;
  onOpenChapter: (chapterId: string) => void;
}) {
  if (chapter.screen === 'portfolio') {
    return (
      <AllClients
        onToast={onToast}
        onClientSelect={clientId => onToast(`Portfolio focus set to ${clientId}`, 'info')}
        onNavigateToIncidents={clientId => onToast(`Incident view ready for ${clientId}`, 'info')}
        onNavigateToCommand={() => onOpenChapter('projectcommand')}
      />
    );
  }

  if (chapter.screen === 'projectcommand') {
    return (
      <ProjectCommand
        key={chapter.id}
        initialScreen={chapter.projectScreen}
        demoMode
        onToast={onToast}
        onOpenVendorIQ={() => onOpenChapter('vendoriq')}
      />
    );
  }

  if (chapter.screen === 'vendoriq') {
    return <VendorIntelligence onToast={onToast} />;
  }

  if (chapter.screen === 'fieldops') {
    return <FieldOpsDashboard onToast={onToast} />;
  }

  if (chapter.screen === 'resident') {
    return (
      <HospitalityClientView
        onToast={onToast}
        guestName="Layla"
        propertyName="Sobha Handover Tower"
        memberToken="demo-client"
        clientId="CLT-004"
        siteId="business-bay"
      />
    );
  }

  return <ValueRecap />;
}

export function InteractiveDemoWalkthrough() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState(resolveInitialChapter);
  const [activeFrameId, setActiveFrameId] = useState(() => resolveInitialFrame(resolveInitialChapter()));
  const [autoplay, setAutoplay] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Guided demo ready');
  const [shareCopied, setShareCopied] = useState(false);
  const [sharePanelOpen, setSharePanelOpen] = useState(false);
  const shareInputRef = useRef<HTMLInputElement>(null);

  const activeIndex = Math.max(0, DEMO_CHAPTERS.findIndex(chapter => chapter.id === activeId));
  const chapter = DEMO_CHAPTERS[activeIndex] ?? DEMO_CHAPTERS[0];
  const frames = useMemo(() => getChapterFrames(chapter), [chapter]);
  const activeFrameIndex = Math.max(0, frames.findIndex(frame => frame.id === activeFrameId));
  const activeFrame = frames[activeFrameIndex] ?? frames[0];
  const nextFrame = frames[activeFrameIndex + 1] ?? null;
  const hotspotTarget = useMemo<HotspotTarget>(() => ({
    anchor: activeFrame.anchor ?? chapter.anchor,
    fallback: activeFrame.fallback ?? chapter.fallback,
  }), [activeFrame, chapter.anchor, chapter.fallback]);
  const anchorBox = useAnchorBox(stageRef, hotspotTarget);
  const progress = Math.round(((activeIndex + ((activeFrameIndex + 1) / frames.length)) / DEMO_CHAPTERS.length) * 100);
  const shareUrl = useMemo(() => buildShareUrl(chapter.id, activeFrame.id), [activeFrame.id, chapter.id]);
  const nextChapter = DEMO_CHAPTERS[(activeIndex + 1) % DEMO_CHAPTERS.length];
  const primaryActionLabel = nextFrame ? `Next: ${nextFrame.label}` : `Next page: ${nextChapter.shortLabel}`;

  const selectChapter = useCallback((chapterId: string, frameId?: string) => {
    const nextChapter = getChapterById(chapterId);
    const nextFrameId = resolveFrameId(nextChapter, frameId);
    setActiveId(chapterId);
    setActiveFrameId(nextFrameId);
    updateChapterUrl(chapterId, nextFrameId);
  }, []);

  const selectFrame = useCallback((frameId: string) => {
    const nextFrameId = resolveFrameId(chapter, frameId);
    setActiveFrameId(nextFrameId);
    updateChapterUrl(chapter.id, nextFrameId);
  }, [chapter]);

  const advanceFrame = useCallback(() => {
    if (nextFrame) {
      selectFrame(nextFrame.id);
      return;
    }

    const nextIndex = (activeIndex + 1) % DEMO_CHAPTERS.length;
    selectChapter(DEMO_CHAPTERS[nextIndex].id);
  }, [activeIndex, nextFrame, selectChapter, selectFrame]);

  const goBack = useCallback(() => {
    const previousFrame = frames[activeFrameIndex - 1];
    if (previousFrame) {
      selectFrame(previousFrame.id);
      return;
    }

    const previousIndex = (activeIndex - 1 + DEMO_CHAPTERS.length) % DEMO_CHAPTERS.length;
    const previousChapter = DEMO_CHAPTERS[previousIndex];
    const previousFrames = getChapterFrames(previousChapter);
    selectChapter(previousChapter.id, previousFrames[previousFrames.length - 1]?.id);
  }, [activeFrameIndex, activeIndex, frames, selectChapter, selectFrame]);

  const goBy = useCallback((delta: number) => {
    const nextIndex = (activeIndex + delta + DEMO_CHAPTERS.length) % DEMO_CHAPTERS.length;
    selectChapter(DEMO_CHAPTERS[nextIndex].id);
  }, [activeIndex, selectChapter]);

  const onToast: ToastFn = useCallback((message, type = 'info') => {
    setStatusMessage(`${type.toUpperCase()}: ${message}`);
    window.setTimeout(() => setStatusMessage('Guided demo ready'), 3200);
  }, []);

  const copyLink = useCallback(async () => {
    setSharePanelOpen(true);
    const copied = await copyText(shareUrl);
    if (copied) {
      setShareCopied(true);
      onToast('Share link copied for this frame', 'success');
      window.setTimeout(() => setShareCopied(false), 2200);
      return;
    }

    window.setTimeout(() => shareInputRef.current?.select(), 0);
    onToast('Share link ready to copy below', 'info');
  }, [onToast, shareUrl]);

  useEffect(() => {
    setShareCopied(false);
  }, [activeFrame.id, chapter.id]);

  const openLivePage = useCallback(() => {
    window.location.href = chapter.livePath;
  }, [chapter.livePath]);

  useEffect(() => {
    const syncFromBrowser = () => {
      const next = readDemoLocationFromUrl();
      if (!next) return;

      setActiveId(current => (current === next.chapterId ? current : next.chapterId));
      setActiveFrameId(current => (current === next.frameId ? current : next.frameId));
    };

    window.addEventListener('popstate', syncFromBrowser);
    const interval = window.setInterval(syncFromBrowser, 400);

    return () => {
      window.removeEventListener('popstate', syncFromBrowser);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select')) return;

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        advanceFrame();
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [advanceFrame, goBack]);

  useEffect(() => {
    if (!autoplay) return undefined;
    const interval = window.setInterval(advanceFrame, 8500);
    return () => window.clearInterval(interval);
  }, [advanceFrame, autoplay]);

  const railItems = useMemo(() => DEMO_CHAPTERS, []);

  return (
    <div className="h-screen overflow-hidden bg-[#030A15] text-[#EEF3FA]">
      <header className="flex h-16 flex-shrink-0 items-center justify-between gap-3 border-b border-[#2E7FFF]/18 bg-[#07111F] px-4">
        <div className="flex min-w-0 items-center gap-3">
          <img src="/4c-logo.png" alt="4C logo" className="h-9 w-9 rounded-lg object-contain" />
          <div className="min-w-0">
            <div className="truncate text-[15px] font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>4C360 Properties Interactive Demo</div>
            <div className="truncate text-[11px] font-semibold text-[#7A94B4]">Actual system walkthrough for property-owner prospects</div>
          </div>
        </div>
        <div className="hidden min-w-0 flex-1 items-center justify-center lg:flex">
          <div className="w-full max-w-xl rounded-full border border-[#2E7FFF]/22 bg-[#0A1628] p-1">
            <div className="h-2 rounded-full bg-[#13294A]">
              <div className="h-full rounded-full bg-[linear-gradient(90deg,#2E7FFF,#22D3EE,#7C3AED)] transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
        <div className="relative flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={copyLink}
            className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-[11px] font-black transition-colors ${
              shareCopied
                ? 'border-emerald-300/30 bg-emerald-300/12 text-emerald-100'
                : 'border-[#2E7FFF]/24 bg-[#0A1628] text-[#B8C7DB] hover:bg-[#112040] hover:text-white'
            }`}
            aria-label={shareCopied ? 'Share link copied' : 'Share this frame'}
          >
            {shareCopied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
            <span className="hidden sm:inline">{shareCopied ? 'Copied' : 'Share'}</span>
          </button>
          {sharePanelOpen && (
            <div className="absolute right-0 top-12 z-50 w-[min(420px,calc(100vw-32px))] rounded-xl border border-[#2E7FFF]/24 bg-[#07111F] p-3 shadow-2xl shadow-black/50">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.16em] text-cyan-200">Share frame</div>
                  <div className="mt-1 text-[11px] text-[#8EA7C7]">Send this link to open the same demo step.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setSharePanelOpen(false)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#2E7FFF]/18 text-[#8EA7C7] hover:bg-white/5 hover:text-white"
                  aria-label="Close share panel"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  ref={shareInputRef}
                  readOnly
                  value={shareUrl}
                  onFocus={event => event.currentTarget.select()}
                  className="min-w-0 flex-1 rounded-lg border border-[#2E7FFF]/22 bg-[#0A1628] px-3 py-2 text-[12px] font-semibold text-[#E6EEF9] outline-none"
                  aria-label="Share link"
                />
                <button
                  type="button"
                  onClick={copyLink}
                  className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg bg-[#2E7FFF] px-3 text-[11px] font-black text-white hover:bg-[#4B91FF]"
                >
                  {shareCopied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                  <span>{shareCopied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={openLivePage}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#2E7FFF] px-3 text-[11px] font-black text-white shadow-lg shadow-blue-950/30 transition-colors hover:bg-[#4B91FF]"
          >
            <ExternalLink size={14} />
            <span className="hidden sm:inline">Open live page</span>
          </button>
        </div>
      </header>

      <div className="grid h-[calc(100vh-64px)] min-h-0 grid-cols-1 overflow-y-auto md:grid-cols-[76px_minmax(0,1fr)_292px] md:overflow-hidden xl:grid-cols-[248px_minmax(0,1fr)_330px]">
        <aside className="min-h-0 border-b border-[#2E7FFF]/16 bg-[#07111F] p-3 md:border-b-0 md:border-r md:p-2 xl:p-3">
          <div className="mb-3 flex items-center justify-between gap-2 md:justify-center xl:justify-between">
            <div className="md:hidden xl:block">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8DBDFF]">Guided path</div>
              <div className="mt-1 text-[11px] text-[#7A94B4]">{activeIndex + 1} of {DEMO_CHAPTERS.length} pages, frame {activeFrameIndex + 1} of {frames.length}</div>
            </div>
            <button
              type="button"
              onClick={() => setAutoplay(current => !current)}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border text-white transition-colors ${autoplay ? 'border-violet-300/34 bg-violet-400/20' : 'border-[#2E7FFF]/22 bg-[#0A1628] hover:bg-[#112040]'}`}
              aria-label={autoplay ? 'Pause autoplay' : 'Start autoplay'}
            >
              {autoplay ? <Pause size={15} /> : <Play size={15} />}
            </button>
          </div>

          <div className="custom-scrollbar flex gap-2 overflow-x-auto pb-1 md:block md:max-h-[calc(100vh-150px)] md:space-y-1.5 md:overflow-y-auto md:pr-0 xl:pr-1">
            {railItems.map((item, index) => {
              const Icon = item.icon;
              const active = item.id === chapter.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectChapter(item.id)}
                  className={`flex min-w-[170px] items-center gap-2 rounded-xl border px-3 py-2 text-left transition-all md:min-w-0 md:w-full md:justify-center md:px-2 xl:justify-start xl:px-3 ${
                    active
                      ? 'border-[#2E7FFF]/50 bg-[#2E7FFF]/16 text-white shadow-[0_0_22px_rgba(46,127,255,0.14)]'
                      : 'border-transparent bg-[#0A1628]/70 text-[#8EA7C7] hover:border-[#2E7FFF]/22 hover:bg-[#112040]'
                  }`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${active ? 'border-cyan-300/30 bg-cyan-300/12 text-cyan-200' : 'border-[#2E7FFF]/14 bg-[#07111F] text-[#7A94B4]'}`}>
                    <Icon size={15} />
                  </span>
                  <span className="min-w-0 md:hidden xl:block">
                    <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-[#5F7FA8]">{String(index + 1).padStart(2, '0')}</span>
                    <span className="block truncate text-[12px] font-black">{item.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="min-h-[620px] min-w-0 overflow-hidden bg-[#06101F] p-3 md:min-h-0">
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#2E7FFF]/22 bg-[#0A1628] shadow-2xl shadow-black/30">
            <div className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-[#2E7FFF]/14 bg-[#07111F] px-4 py-2.5">
              <div className="min-w-0">
                <div className="truncate text-[13px] font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{chapter.label}</div>
                <div className="truncate text-[10px] font-bold uppercase tracking-[0.15em] text-[#5F7FA8]">Actual 4C360 surface</div>
                <div className="mt-0.5 truncate text-[11px] font-semibold text-cyan-100/90">Focus: {activeFrame.headline}</div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-200">Live demo data</span>
              </div>
            </div>
            <div ref={stageRef} className="relative min-h-0 flex-1 overflow-hidden">
              <DemoStage key={chapter.id} chapter={chapter} onToast={onToast} onOpenChapter={selectChapter} />
              <StageHotspot box={anchorBox} fallback={hotspotTarget.fallback} />
            </div>
          </div>
        </main>

        <aside className="custom-scrollbar min-h-0 overflow-y-auto border-t border-[#2E7FFF]/16 bg-[#07111F] p-3 pb-5 md:border-l md:border-t-0">
          <div className="flex h-full min-h-0 flex-col gap-2">
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">Why this matters</div>
                <div className="rounded-full border border-[#2E7FFF]/22 bg-[#0A1628] px-2 py-1 text-[10px] font-black text-[#8DBDFF]">
                  {activeFrameIndex + 1}/{frames.length}
                </div>
              </div>
              <h1 className="mt-1.5 text-[19px] font-black leading-tight text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{activeFrame.headline}</h1>
              <p className="mt-2 text-[12px] leading-5 text-[#B8C7DB]">{activeFrame.story}</p>
            </div>

            <section className="grid grid-cols-3 gap-1.5">
              {frames.map((frame, index) => {
                const active = frame.id === activeFrame.id;
                return (
                  <button
                    key={frame.id}
                    type="button"
                    onClick={() => selectFrame(frame.id)}
                    className={`min-w-0 rounded-xl border px-2 py-2 text-left transition-colors ${
                      active
                        ? 'border-[#2E7FFF]/56 bg-[#2E7FFF]/18 text-white shadow-[0_0_18px_rgba(46,127,255,0.14)]'
                        : 'border-[#2E7FFF]/14 bg-[#0A1628] text-[#8EA7C7] hover:border-[#2E7FFF]/32 hover:bg-[#112040] hover:text-white'
                    }`}
                    aria-current={active ? 'step' : undefined}
                  >
                    <span className="block text-[9px] font-black uppercase tracking-[0.14em] text-[#5F7FA8]">{String(index + 1).padStart(2, '0')}</span>
                    <span className="mt-0.5 block truncate text-[11px] font-black">{frame.label}</span>
                  </button>
                );
              })}
            </section>

            <section className="rounded-xl border border-[#2E7FFF]/18 bg-[#0A1628]">
              <div className="px-3 py-2">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#7A94B4]">Client value</div>
                <p className="mt-1 text-[12px] leading-5 text-[#E6EEF9]">{activeFrame.clientValue}</p>
              </div>
              <div className="border-t border-[#2E7FFF]/12 px-3 py-2">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-200">Client question</div>
                <p className="mt-1 text-[12px] leading-5 text-amber-50">{activeFrame.decisionQuestion}</p>
              </div>
              <div className="border-t border-[#2E7FFF]/12 px-3 py-2">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-200">Next action</div>
                <p className="mt-1 text-[12px] leading-5 text-emerald-50">{activeFrame.nextAction}</p>
              </div>
            </section>

            <div className="mt-auto space-y-2">
              <button
                type="button"
                onClick={advanceFrame}
                className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#2E7FFF] px-3 py-2.5 text-center text-[12px] font-black leading-tight text-white shadow-lg shadow-blue-950/30 transition-colors hover:bg-[#4B91FF]"
              >
                <Sparkles size={15} className="shrink-0" />
                <span className="min-w-0 truncate">{primaryActionLabel}</span>
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={goBack}
                  className="flex h-9 items-center justify-center gap-2 rounded-xl border border-[#2E7FFF]/22 bg-[#0A1628] text-[12px] font-black text-[#B8C7DB] transition-colors hover:bg-[#112040] hover:text-white"
                >
                  <ChevronLeft size={15} />
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => goBy(1)}
                  className="flex h-9 items-center justify-center gap-2 rounded-xl border border-[#2E7FFF]/22 bg-[#0A1628] text-[12px] font-black text-[#B8C7DB] transition-colors hover:bg-[#112040] hover:text-white"
                >
                  Next page
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
      {statusMessage !== 'Guided demo ready' && (
        <div className="fixed right-3 top-20 z-[70] max-w-[340px] rounded-xl border border-[#2E7FFF]/22 bg-[#07111F]/95 px-3 py-2 text-[11px] font-bold leading-5 text-[#DCEBFF] shadow-2xl shadow-black/40 backdrop-blur" aria-live="polite">
          {statusMessage}
        </div>
      )}
    </div>
  );
}
