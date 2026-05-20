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
  ListTree,
  Mic,
  MicOff,
  MonitorPlay,
  Pause,
  Play,
  Presentation,
  RotateCcw,
  Rocket,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  TimerReset,
  Volume2,
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
  features?: string[];
  mission?: DemoMission;
  artifact?: DemoArtifact;
  outcome?: DemoOutcome;
};

type DemoMissionTrigger =
  | { type: 'cta' }
  | { type: 'frameVisit' }
  | { type: 'toastIncludes'; value: string }
  | { type: 'demoAction'; action: string };

type DemoMission = {
  id: string;
  prompt: string;
  actionLabel: string;
  completionToast: string;
  talkingPoint: string;
  trigger: DemoMissionTrigger;
};

type DemoArtifact = {
  id: string;
  label: string;
  detail: string;
};

type DemoOutcome = {
  timeSavedMinutes: number;
  riskReduction: number;
  readinessGain: number;
};

type DemoProgressState = {
  completedMissionIds: string[];
  completedAtByMissionId: Record<string, string>;
};

type DemoShowMode = 'teaser' | 'board' | 'deepDive';

type DemoAutopilotState = {
  status: 'idle' | 'playing' | 'paused';
  started: boolean;
};

type DemoVoiceState = 'unavailable' | 'ready' | 'connecting' | 'listening' | 'speaking' | 'error';

type DemoNarration = {
  caption: string;
  presenterNote: string;
};

type DemoMetricImpact = DemoOutcome & {
  decisionsSurfaced: number;
};

type EnrichedDemoFrame = DemoFrame & {
  features: string[];
  mission: DemoMission;
  artifact: DemoArtifact;
  outcome: DemoOutcome;
  chapterId: string;
};

type DemoSection = EnrichedDemoFrame & {
  sectionId: string;
  legacyFrameId: string;
  title: string;
  boardNarrative: string;
  clientProof: string;
  durationByMode: Record<DemoShowMode, number>;
  metricImpact: DemoMetricImpact;
  narration: DemoNarration;
  actId: string;
};

type DemoAct = {
  id: string;
  label: string;
  title: string;
  promise: string;
  chapterIds: string[];
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

function buildShareUrl(chapterId?: string, sectionId?: string, showMode?: DemoShowMode, autoplay?: boolean) {
  const url = new URL('/demo/properties', window.location.origin);
  url.searchParams.set('mode', 'board');
  if (showMode) url.searchParams.set('duration', showModeToQuery(showMode));
  if (chapterId) url.searchParams.set('chapter', chapterId);
  if (sectionId) url.searchParams.set('section', sectionId);
  if (autoplay) url.searchParams.set('autoplay', 'true');
  return url.toString();
}

const DEMO_PROGRESS_STORAGE_KEY = '4c360-properties-demo-progress-v1';
const DEMO_SCENARIO = 'Sobha Pilot Tower handover risk: recover readiness, control cost exposure, close evidence gaps, and prepare owner decisions.';
const DEMO_AGENT_ID = (
  import.meta.env.VITE_ELEVENLABS_DEMO_AGENT_ID
  ?? import.meta.env.VITE_ELEVENLABS_SOLUTIONS_AGENT_ID
  ?? import.meta.env.VITE_ELEVENLABS_AGENT_ID
) as string | undefined;
const DEMO_VOICE_ID = (
  import.meta.env.VITE_ELEVENLABS_DEMO_VOICE_ID
  ?? import.meta.env.VITE_ELEVENLABS_VOICE_ID
) as string | undefined;

const SHOW_MODE_OPTIONS: Array<{
  id: DemoShowMode;
  query: string;
  label: string;
  shortLabel: string;
  description: string;
  durationLabel: string;
}> = [
  { id: 'teaser', query: '3', label: '3 min teaser', shortLabel: 'Teaser', durationLabel: '3 min', description: 'Fast executive punch for first meetings.' },
  { id: 'board', query: '6', label: '6 min board show', shortLabel: 'Board', durationLabel: '6 min', description: 'Recommended boardroom pacing with proof and payoff.' },
  { id: 'deepDive', query: '12', label: '12 min deep dive', shortLabel: 'Deep Dive', durationLabel: '12 min', description: 'Slower product-led walkthrough for active buyers.' },
];

const DEFAULT_SHOW_MODE: DemoShowMode = 'board';

const DEMO_ACTS: DemoAct[] = [
  {
    id: 'portfolio-control',
    label: 'Act 1',
    title: 'Portfolio Control',
    promise: 'The board sees which assets need attention before teams start explaining reports.',
    chapterIds: ['portfolio'],
  },
  {
    id: 'risk-to-action',
    label: 'Act 2',
    title: 'Risk To Action',
    promise: 'One handover risk becomes cost, gate, obligation, evidence, and forecast decisions.',
    chapterIds: ['projectcommand', 'programme', 'stagegates', 'cost', 'risk', 'forecast', 'obligations', 'evidence'],
  },
  {
    id: 'ai-operating-system',
    label: 'Act 3',
    title: 'AI Operating System',
    promise: 'Vendor, field, resident, and owner workflows close the loop in one operating model.',
    chapterIds: ['vendoriq', 'fieldops', 'resident', 'value'],
  },
];

const EMPTY_PROGRESS_STATE: DemoProgressState = {
  completedMissionIds: [],
  completedAtByMissionId: {},
};

const CHAPTER_FEATURES: Record<string, string[]> = {
  portfolio: ['Portfolio health signals', 'Asset prioritization', 'Command routing'],
  projectcommand: ['Project twin context', 'Control module navigation', 'Owner action queue'],
  programme: ['Critical path view', 'Contractor accountability', 'Recovery planning'],
  stagegates: ['Gate status board', 'Evidence dependencies', 'Recovery ownership'],
  cost: ['Forecast exposure', 'Variation queue', 'Package drivers'],
  risk: ['Risk register', 'Mitigation ownership', 'Scenario impact'],
  forecast: ['Outcome scenarios', 'Forecast confidence', 'Decision cards'],
  obligations: ['Obligation register', 'Deadline exposure', 'Evidence linkage'],
  evidence: ['Readiness status', 'Expired documents', 'Pack preparation'],
  vendoriq: ['Vendor scorecard', 'Quote context', 'Action pack'],
  fieldops: ['Field KPI strip', 'Survey work queue', 'Mobile capture'],
  resident: ['Resident intake', 'Service SLA', 'Operations handoff'],
  value: ['Operating model', 'Pilot pathway', 'Expansion roadmap'],
};

const CHAPTER_ARTIFACTS: Record<string, DemoArtifact> = {
  portfolio: { id: 'owner-action-plan', label: 'Owner action plan', detail: 'Priority property, control route, and first owner decision captured.' },
  projectcommand: { id: 'project-control-note', label: 'Project control note', detail: 'Project twin context and review path prepared for the owner.' },
  programme: { id: 'recovery-path-note', label: 'Programme recovery note', detail: 'Critical path risk and recovery owner summarized.' },
  stagegates: { id: 'gate-blocker-note', label: 'Gate blocker note', detail: 'Blocked gate, evidence gap, and next unblock owner documented.' },
  cost: { id: 'cost-exposure-summary', label: 'Cost exposure summary', detail: 'Variation/package pressure and forecast action captured.' },
  risk: { id: 'risk-mitigation-brief', label: 'Risk mitigation brief', detail: 'Top risk, mitigation owner, and scenario consequence prepared.' },
  forecast: { id: 'forecast-decision-brief', label: 'Forecast decision brief', detail: 'Base/pessimistic outcome and decision lever summarized.' },
  obligations: { id: 'obligation-proof-note', label: 'Obligation proof note', detail: 'Obligation, due exposure, and evidence requirement connected.' },
  evidence: { id: 'evidence-pack-summary', label: 'Evidence pack summary', detail: 'Readiness pack, expired proof, and handover blocker summarized.' },
  vendoriq: { id: 'vendor-corrective-notice', label: 'Vendor corrective action notice', detail: 'Vendor score signal and corrective action route prepared.' },
  fieldops: { id: 'field-survey-instruction', label: 'Field survey instruction', detail: 'Survey capture task and field proof route prepared.' },
  resident: { id: 'resident-request-handoff', label: 'Resident request handoff', detail: 'Resident intake and operations ownership path captured.' },
  value: { id: 'final-pilot-recommendation', label: 'Final pilot recommendation', detail: 'Pilot workflow, success proof, and expansion path summarized.' },
};

const CHAPTER_OUTCOMES: Record<string, DemoOutcome> = {
  portfolio: { timeSavedMinutes: 12, riskReduction: 3, readinessGain: 2 },
  projectcommand: { timeSavedMinutes: 18, riskReduction: 4, readinessGain: 3 },
  programme: { timeSavedMinutes: 20, riskReduction: 5, readinessGain: 4 },
  stagegates: { timeSavedMinutes: 22, riskReduction: 7, readinessGain: 7 },
  cost: { timeSavedMinutes: 18, riskReduction: 5, readinessGain: 2 },
  risk: { timeSavedMinutes: 16, riskReduction: 6, readinessGain: 3 },
  forecast: { timeSavedMinutes: 14, riskReduction: 5, readinessGain: 3 },
  obligations: { timeSavedMinutes: 15, riskReduction: 4, readinessGain: 5 },
  evidence: { timeSavedMinutes: 20, riskReduction: 5, readinessGain: 8 },
  vendoriq: { timeSavedMinutes: 18, riskReduction: 4, readinessGain: 2 },
  fieldops: { timeSavedMinutes: 16, riskReduction: 3, readinessGain: 5 },
  resident: { timeSavedMinutes: 12, riskReduction: 2, readinessGain: 4 },
  value: { timeSavedMinutes: 10, riskReduction: 2, readinessGain: 3 },
};

const CHAPTER_NARRATION_OPENERS: Record<string, string> = {
  portfolio: 'Act one starts at portfolio level. The board needs to know where attention is required before anyone opens a project file.',
  projectcommand: 'Now we enter the command surface for the live handover risk. The point is not more reporting, it is one place to decide.',
  programme: 'The programme chapter translates schedule complexity into a business conversation about handover confidence.',
  stagegates: 'Stage gates show whether the next milestone is truly ready, and what evidence or owner action is holding it back.',
  cost: 'Cost intelligence links budget movement to the specific decisions that can still reduce exposure.',
  risk: 'Risk command turns the risk register into a live operating discussion about ownership, mitigation, and consequence.',
  forecast: 'The forecast chapter shows the board what can happen before it happens, with confidence signals attached.',
  obligations: 'Obligations connect regulatory, contractual, and authority duties directly to delivery progress and proof.',
  evidence: 'Evidence is where the platform proves readiness, not by storing files, but by controlling gaps before handover.',
  vendoriq: 'VendorIQ moves the conversation from subjective vendor opinion to measurable performance and corrective action.',
  fieldops: 'FieldOps shows how site teams create the proof that executive controls need in order to move.',
  resident: 'The resident layer proves that executive control and front-door service can belong to the same operating system.',
  value: 'The final chapter converts the story into a pilot recommendation the board can act on.',
};

const SECTION_NARRATION_SCRIPTS: Record<string, DemoNarration> = {
  'portfolio:health-actions': {
    caption: 'Here, the board sees the portfolio health signal first. Instead of asking for updates asset by asset, leadership can spot the property that needs attention and move straight to action.',
    presenterNote: 'Emphasize that the first win is prioritization. The demo starts with the question every owner asks: where should we spend management time today?',
  },
  'portfolio:portfolio-map': {
    caption: 'The portfolio map turns multiple buildings into one operating picture. The value is not the map itself, it is the connection from asset health into project, vendor, evidence, and field execution.',
    presenterNote: 'Point out that the board can stay at portfolio altitude while still knowing the system is connected underneath.',
  },
  'portfolio:command-path': {
    caption: 'This is the moment the demo becomes actionable. A portfolio signal is no longer an observation, it becomes a command path into the project and the teams that can recover readiness.',
    presenterNote: 'Use this as the bridge from executive visibility to operational control.',
  },
  'projectcommand:project-context': {
    caption: 'The project twin gives the board the essential context: budget, progress, owner route, and current control state. It replaces fragmented status packs with one live project surface.',
    presenterNote: 'Make clear that ProjectCommand is not a dashboard island. It is the entry point into all project control lenses.',
  },
  'projectcommand:control-tabs': {
    caption: 'These tabs are the control model. Programme, stage gates, cost, risk, obligations, evidence, and forecast stay in the same project context, so the conversation does not reset every time the topic changes.',
    presenterNote: 'Explain that the board can ask any control question without leaving the project story.',
  },
  'projectcommand:action-queue': {
    caption: 'The action queue is where the review earns its value. The system surfaces what changed, who owns the next move, and which action protects delivery confidence this week.',
    presenterNote: 'Anchor this on action accountability. This is the difference between reporting and operating.',
  },
  'programme:critical-path': {
    caption: 'Critical path is shown in language the board can use. Instead of decoding programme files, leaders see which phase can move handover and where recovery effort should focus.',
    presenterNote: 'Keep it executive: schedule risk is only useful when it identifies a decision.',
  },
  'programme:contractor-view': {
    caption: 'The contractor view connects schedule pressure to accountable parties. Delay is no longer an abstract timeline problem, it is a recovery conversation with the right owner.',
    presenterNote: 'Call out accountability. This is where delivery teams and commercial teams stop debating the source of delay.',
  },
  'programme:recovery-plan': {
    caption: 'Recovery planning changes the tone from bad news to options. The board can see what move protects the milestone and what trade-off must be approved.',
    presenterNote: 'Use this to show the platform supports forward action, not only retrospective delay narration.',
  },
  'stagegates:blocked-gate': {
    caption: 'The blocked gate makes readiness visible. The board can see the milestone, the blocker, and the owner path without waiting for a separate checklist review.',
    presenterNote: 'This is a strong proof point for handover and commissioning audiences.',
  },
  'stagegates:evidence-gaps': {
    caption: 'The evidence gap explains why the gate cannot move. Missing or expired proof is tied to the control point, so the issue becomes specific and assignable.',
    presenterNote: 'Show that 4C360 does not just flag a red status, it explains what proof is missing.',
  },
  'stagegates:recovery-actions': {
    caption: 'The recovery action turns the gate problem into a workflow. The board sees who must act, what they need to provide, and how that action protects the next milestone.',
    presenterNote: 'Stress owner action, due timing, and readiness movement.',
  },
  'cost:forecast': {
    caption: 'Cost starts with the movement from baseline to forecast. The board can immediately see whether exposure is a budget issue, a commitment issue, or a decision still waiting for approval.',
    presenterNote: 'Keep the money story simple: where is exposure coming from, and what decision changes it?',
  },
  'cost:variations': {
    caption: 'The variation queue shows commercial pressure before it becomes a surprise. Each pending item is connected to forecast movement and a needed response.',
    presenterNote: 'This is where owners see that compare quotes and variations belong in one commercial view.',
  },
  'cost:package-drivers': {
    caption: 'Package drivers make the forecast explainable. Procurement, progress, and claims can be traced to the package that is actually moving final cost.',
    presenterNote: 'Use this when the board asks, why is the number changing?',
  },
  'risk:risk-register': {
    caption: 'The risk register becomes useful because it is live. Probability, impact, trend, and owner are all visible, so risk review becomes an operating discipline.',
    presenterNote: 'Avoid sounding like generic risk software. The key is connection to project outcomes.',
  },
  'risk:mitigation': {
    caption: 'Mitigation ownership is where risk becomes controllable. The board can challenge whether the action is current, evidenced, and strong enough to reduce exposure.',
    presenterNote: 'Focus on action quality. This is where static risk scores become management accountability.',
  },
  'risk:risk-scenario': {
    caption: 'Scenario impact connects the open risk to cost and programme consequence. The board can compare the cost of mitigation with the cost of doing nothing.',
    presenterNote: 'This is a strong board-level line: risk is shown as a future outcome, not a register entry.',
  },
  'forecast:scenarios': {
    caption: 'Forecast scenarios show what happens if today’s blockers continue. Optimistic, base, and pessimistic paths give the board a way to discuss timing, cost, and readiness before the month closes.',
    presenterNote: 'Frame this as decision support, not prediction theatre.',
  },
  'forecast:confidence': {
    caption: 'Confidence explains why the forecast should be trusted. The system exposes the signals and evidence behind the forecast, so the board understands what is strengthening or weakening it.',
    presenterNote: 'Make the trust point explicit. The forecast is only persuasive when the evidence basis is visible.',
  },
  'forecast:decisions': {
    caption: 'Decision cards turn the forecast into a choice. The board sees which action improves the base case and which owner must move next.',
    presenterNote: 'Close the forecast chapter on action, not charts.',
  },
  'obligations:register': {
    caption: 'The obligations register keeps authority, contractual, and owner duties in the delivery conversation. Nothing important sits outside the operating picture.',
    presenterNote: 'Useful for compliance-heavy owners. Show that obligations are connected to projects and owners.',
  },
  'obligations:deadlines': {
    caption: 'Deadline exposure shows what must be closed before it becomes a delivery issue. The board can prioritize obligations by consequence, not just due date.',
    presenterNote: 'Tie obligations to handover readiness and escalation timing.',
  },
  'obligations:evidence-link': {
    caption: 'The evidence link closes the loop. An obligation is not complete because someone wrote a note, it is complete when the required proof is attached and traceable.',
    presenterNote: 'This is a simple but powerful proof point for governance.',
  },
  'evidence:readiness': {
    caption: 'Evidence readiness turns the document repository into a control room. Current, expired, and action-required proof is organized around what can block approval.',
    presenterNote: 'Position evidence as readiness control, not file storage.',
  },
  'evidence:expired-docs': {
    caption: 'Expired documents are surfaced as operating risk. The board sees the proof that could block handover and the action needed to replace it.',
    presenterNote: 'This section should feel practical and urgent.',
  },
  'evidence:pack-prep': {
    caption: 'Pack preparation shows how proof becomes board-ready. The system assembles the evidence needed for the next gate so readiness can be reviewed with confidence.',
    presenterNote: 'Connect this directly to handover meetings and owner approvals.',
  },
  'vendoriq:scorecard': {
    caption: 'VendorIQ starts with measurable performance. SLA, quality, evidence, cost, and repeat failures are pulled into one vendor signal the board can defend.',
    presenterNote: 'Avoid anecdotal vendor language. This is about defensible performance decisions.',
  },
  'vendoriq:quote-comparison': {
    caption: 'Quote comparison becomes stronger when performance context is included. The lowest price is not automatically the best decision if risk and delivery history tell a different story.',
    presenterNote: 'This directly answers the earlier concern about duplicate price analysis. The value is context, not another price table.',
  },
  'vendoriq:action-pack': {
    caption: 'The action pack converts vendor concern into a formal route. Corrective notice, approvals, KPI targets, and owner follow-up are prepared from the scorecard.',
    presenterNote: 'This is a high-impact section. Show the board that vendor movement is produced, not merely discussed.',
  },
  'fieldops:kpis': {
    caption: 'FieldOps proves that the operating model reaches the site. Survey counts, field progress, and capture status show whether execution data is being created where the work happens.',
    presenterNote: 'Connect field activity back to ProjectCommand and evidence readiness.',
  },
  'fieldops:active-surveys': {
    caption: 'The survey queue shows work in motion. Assignments, status, capture method, and responses are visible before anyone waits for a weekly site summary.',
    presenterNote: 'Make this practical for operations teams.',
  },
  'fieldops:capture-methods': {
    caption: 'Capture methods create proof at the source. Mobile inspections and survey workflows make the evidence trail usable before memories fade or documents scatter.',
    presenterNote: 'This is the field-to-evidence bridge.',
  },
  'resident:intake': {
    caption: 'Resident intake shows the front door of the operating system. Camera, upload, voice, and AI chat routes capture the issue in a structured way from the start.',
    presenterNote: 'Emphasize simplicity for residents and structure for operations.',
  },
  'resident:timeline': {
    caption: 'The resident timeline reduces status noise. Residents see progress, updates, and next steps, while the operating team keeps the work connected behind the scenes.',
    presenterNote: 'This is the customer-experience proof point.',
  },
  'resident:handoff': {
    caption: 'The handoff connects resident service to execution. A resident request becomes structured work with an accountable team and a clear next response.',
    presenterNote: 'Show that the platform connects experience, operations, and accountability.',
  },
  'value:operating-model': {
    caption: 'The recap pulls the story together. Portfolio control, project command, evidence, vendors, field execution, and resident experience now operate as one system.',
    presenterNote: 'Use this to land the three board promises: control, risk to action, and AI operating system.',
  },
  'value:pilot-path': {
    caption: 'The recommended pilot is intentionally focused. Start with one active handover or critical project where readiness, proof, and action ownership matter immediately.',
    presenterNote: 'Make the next step feel low-risk and concrete.',
  },
  'value:expansion': {
    caption: 'Expansion is the natural path after the pilot proves value. Add VendorIQ, FieldOps, and resident intake to extend the same operating model across the portfolio.',
    presenterNote: 'Close with a clear path from first win to broader adoption.',
  },
};

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

function showModeToQuery(showMode: DemoShowMode) {
  return SHOW_MODE_OPTIONS.find(option => option.id === showMode)?.query ?? '6';
}

function queryToShowMode(value?: string | null): DemoShowMode {
  const normalized = (value ?? '').trim().toLowerCase();
  const matched = SHOW_MODE_OPTIONS.find(option => (
    option.query === normalized || option.id.toLowerCase() === normalized || option.label.toLowerCase() === normalized
  ));
  return matched?.id ?? DEFAULT_SHOW_MODE;
}

function getShowModeOption(showMode: DemoShowMode) {
  return SHOW_MODE_OPTIONS.find(option => option.id === showMode) ?? SHOW_MODE_OPTIONS[1];
}

function getActForChapter(chapterId: string) {
  return DEMO_ACTS.find(act => act.chapterIds.includes(chapterId)) ?? DEMO_ACTS[0];
}

function getActProgress(act: DemoAct, completedMissionSet: Set<string>) {
  const actFrames = act.chapterIds.flatMap(chapterId => getEnrichedFrames(getChapterById(chapterId)));
  const completed = actFrames.filter(frame => completedMissionSet.has(frame.mission.id)).length;
  return { completed, total: actFrames.length };
}

function normalizeSectionRequest(chapterId: string, requested?: string | null) {
  if (!requested) return requested;
  const aliases: Record<string, string> = {
    'stagegates:evidence-gap': 'evidence-gaps',
    'stagegates:blocked-gate': 'blocked-gate',
    'stagegates:recovery-action': 'recovery-actions',
    'cost:variation-driver': 'variations',
    'cost:package-driver': 'package-drivers',
    'portfolio:health-action': 'health-actions',
    'projectcommand:project-context': 'project-context',
    'resident:ops-handoff': 'handoff',
  };
  return aliases[`${chapterId}:${requested}`] ?? requested;
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
  const normalized = normalizeSectionRequest(chapter.id, requested);
  const frames = getChapterFrames(chapter);
  return frames.some(frame => frame.id === normalized) ? normalized! : frames[0].id;
}

function missionTriggerForFrame(chapterId: string, frameId: string): DemoMissionTrigger {
  if (chapterId === 'portfolio' && frameId === 'command-path') return { type: 'demoAction', action: 'portfolio-open-command' };
  if (chapterId === 'projectcommand' && frameId === 'control-tabs') return { type: 'demoAction', action: 'projectcommand-tab-cost' };
  if (chapterId === 'fieldops' && frameId === 'capture-methods') return { type: 'demoAction', action: 'fieldops-apply-survey' };
  if (chapterId === 'resident' && frameId === 'intake') return { type: 'demoAction', action: 'resident-mode-camera' };
  if (chapterId === 'resident' && frameId === 'handoff') return { type: 'demoAction', action: 'resident-copy-link' };
  if (chapterId === 'value') return { type: 'frameVisit' };
  return { type: 'cta' };
}

function enrichDemoFrame(chapter: DemoChapter, frame: DemoFrame, frameIndex: number): EnrichedDemoFrame {
  const missionId = `${chapter.id}:${frame.id}`;
  const chapterFeatures = CHAPTER_FEATURES[chapter.id] ?? [chapter.shortLabel, frame.label, 'Owner decision support'];
  const artifact = frame.artifact ?? CHAPTER_ARTIFACTS[chapter.id] ?? {
    id: `${chapter.id}-demo-artifact`,
    label: `${chapter.shortLabel} artifact`,
    detail: frame.nextAction,
  };
  const baseOutcome = frame.outcome ?? CHAPTER_OUTCOMES[chapter.id] ?? { timeSavedMinutes: 10, riskReduction: 2, readinessGain: 2 };
  const outcome = {
    timeSavedMinutes: Math.max(4, Math.round(baseOutcome.timeSavedMinutes / 3)),
    riskReduction: Math.max(1, Math.round(baseOutcome.riskReduction / 3)),
    readinessGain: Math.max(1, Math.round(baseOutcome.readinessGain / 3)),
  };

  return {
    ...frame,
    chapterId: chapter.id,
    features: frame.features ?? [
      chapterFeatures[frameIndex % chapterFeatures.length],
      chapterFeatures[(frameIndex + 1) % chapterFeatures.length],
      chapterFeatures[(frameIndex + 2) % chapterFeatures.length],
    ],
    artifact,
    outcome,
    mission: frame.mission ?? {
      id: missionId,
      prompt: `Complete this client demo step: ${frame.nextAction}`,
      actionLabel: frame.tryLabel,
      completionToast: `${artifact.label} prepared`,
      talkingPoint: frame.clientValue,
      trigger: missionTriggerForFrame(chapter.id, frame.id),
    },
  };
}

function getEnrichedFrames(chapter: DemoChapter) {
  return getChapterFrames(chapter).map((frame, index) => enrichDemoFrame(chapter, frame, index));
}

function enrichDemoSection(chapter: DemoChapter, frame: EnrichedDemoFrame, frameIndex: number): DemoSection {
  const act = getActForChapter(chapter.id);
  const script = SECTION_NARRATION_SCRIPTS[`${chapter.id}:${frame.id}`] ?? {
    caption: `${frame.headline}. ${frame.clientValue}`,
    presenterNote: `${frame.nextAction} Board proof: ${frame.decisionQuestion}`,
  };
  const chapterOpener = frameIndex === 0 ? CHAPTER_NARRATION_OPENERS[chapter.id] : undefined;
  const boardNarrative = [
    frame.headline,
    frame.story,
  ].join(' ');

  return {
    ...frame,
    sectionId: frame.id,
    legacyFrameId: frame.id,
    title: frame.label,
    boardNarrative,
    clientProof: frame.decisionQuestion,
    durationByMode: {
      teaser: 4600 + (frameIndex % 2) * 400,
      board: 9000 + (frameIndex % 2) * 750,
      deepDive: 18000 + (frameIndex % 2) * 1200,
    },
    metricImpact: {
      ...frame.outcome,
      decisionsSurfaced: 1,
    },
    narration: {
      caption: chapterOpener ? `${chapterOpener} ${script.caption}` : script.caption,
      presenterNote: script.presenterNote,
    },
    actId: act.id,
  };
}

function getDemoSections(chapter: DemoChapter) {
  return getEnrichedFrames(chapter).map((frame, index) => enrichDemoSection(chapter, frame, index));
}

function getAllEnrichedFrames() {
  return DEMO_CHAPTERS.flatMap(chapter => getEnrichedFrames(chapter));
}

function getAllDemoSections() {
  return DEMO_CHAPTERS.flatMap(chapter => getDemoSections(chapter));
}

function normalizeProgressState(value: Partial<DemoProgressState> | null | undefined): DemoProgressState {
  const completedMissionIds = Array.from(new Set(value?.completedMissionIds?.filter(Boolean) ?? []));
  const completedAtByMissionId = value?.completedAtByMissionId ?? {};
  return {
    completedMissionIds,
    completedAtByMissionId: completedMissionIds.reduce<Record<string, string>>((acc, missionId) => {
      acc[missionId] = completedAtByMissionId[missionId] ?? new Date().toISOString();
      return acc;
    }, {}),
  };
}

function loadDemoProgressState(): DemoProgressState {
  if (typeof window === 'undefined') return EMPTY_PROGRESS_STATE;
  try {
    const raw = window.sessionStorage.getItem(DEMO_PROGRESS_STORAGE_KEY);
    if (!raw) return EMPTY_PROGRESS_STATE;
    return normalizeProgressState(JSON.parse(raw) as DemoProgressState);
  } catch {
    return EMPTY_PROGRESS_STATE;
  }
}

function saveDemoProgressState(state: DemoProgressState) {
  try {
    window.sessionStorage.setItem(DEMO_PROGRESS_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Demo progress is helpful, but never worth blocking the walkthrough.
  }
}

function getOutcomeTotals(progressState: DemoProgressState) {
  const completedSet = new Set(progressState.completedMissionIds);
  const allFrames = getAllEnrichedFrames();
  const completedFrames = allFrames.filter(frame => completedSet.has(frame.mission.id));
  const artifacts = new Map<string, DemoArtifact>();
  const features = new Set<string>();

  completedFrames.forEach(frame => {
    artifacts.set(frame.artifact.id, frame.artifact);
    frame.features.forEach(feature => features.add(feature));
  });

  return {
    totalMissions: allFrames.length,
    completedMissions: completedFrames.length,
    artifacts: Array.from(artifacts.values()),
    artifactCount: artifacts.size,
    featureCount: features.size,
    decisionsSurfaced: completedFrames.length,
    timeSavedMinutes: completedFrames.reduce((sum, frame) => sum + frame.outcome.timeSavedMinutes, 0),
    riskReduction: completedFrames.reduce((sum, frame) => sum + frame.outcome.riskReduction, 0),
    readinessGain: completedFrames.reduce((sum, frame) => sum + frame.outcome.readinessGain, 0),
  };
}

function buildOutcomeSummary(totals: ReturnType<typeof getOutcomeTotals>) {
  return [
    `4C360 Properties demo outcome`,
    `Missions completed: ${totals.completedMissions}/${totals.totalMissions}`,
    `Artifacts prepared: ${totals.artifactCount}`,
    `Feature signals covered: ${totals.featureCount}`,
    `Board decisions surfaced: ${totals.decisionsSurfaced}`,
    `Estimated time saved: ${totals.timeSavedMinutes} minutes`,
    `Risk reduced: ${totals.riskReduction} points`,
    `Readiness gained: ${totals.readinessGain} points`,
    `Recommended pilot: ProjectCommand on one active handover project, then expand into evidence, VendorIQ, FieldOps, and resident intake.`,
  ].join('\n');
}

function readDemoLocationFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get('chapter');
  const chapter = DEMO_CHAPTERS.find(item => item.id === requested);
  if (!chapter) return null;
  const sectionRequest = params.get('section') ?? params.get('frame');

  return {
    chapterId: chapter.id,
    frameId: resolveFrameId(chapter, sectionRequest),
  };
}

function resolveInitialShowMode() {
  const params = new URLSearchParams(window.location.search);
  return queryToShowMode(params.get('duration'));
}

function resolveInitialAutopilot(): DemoAutopilotState {
  const params = new URLSearchParams(window.location.search);
  const playing = params.get('autoplay') === 'true';
  return { status: playing ? 'playing' : 'idle', started: playing };
}

function shouldShowIntroInitially() {
  const params = new URLSearchParams(window.location.search);
  return !params.has('chapter') && params.get('autoplay') !== 'true';
}

function resolveInitialChapter() {
  return readDemoLocationFromUrl()?.chapterId ?? DEMO_CHAPTERS[0].id;
}

function resolveInitialFrame(chapterId: string) {
  const location = readDemoLocationFromUrl();
  if (location?.chapterId === chapterId) return location.frameId;
  return resolveFrameId(getChapterById(chapterId));
}

function updateChapterUrl(
  chapterId: string,
  frameId?: string,
  options: { showMode?: DemoShowMode; autoplay?: boolean } = {},
) {
  const url = new URL(window.location.href);
  url.searchParams.set('mode', 'board');
  url.searchParams.set('chapter', chapterId);
  url.searchParams.set('section', frameId ?? resolveFrameId(getChapterById(chapterId)));
  url.searchParams.delete('frame');
  url.searchParams.set('duration', showModeToQuery(options.showMode ?? queryToShowMode(url.searchParams.get('duration'))));
  if (options.autoplay) {
    url.searchParams.set('autoplay', 'true');
  } else {
    url.searchParams.delete('autoplay');
  }
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

function ValueRecap({ totals, onCopySummary }: { totals: ReturnType<typeof getOutcomeTotals>; onCopySummary: () => void }) {
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

        <section className="grid gap-3 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-2xl border border-[#E11D2E]/22 bg-[#E11D2E]/10 p-4">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#FFB4BC]">Before 4C360</div>
            <h3 className="mt-2 text-xl font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Board risk was trapped in reports.</h3>
            <p className="mt-2 text-[12px] leading-5 text-[#FECACA]">Handover readiness, vendor action, field proof, resident impact, and commercial exposure were reviewed as separate conversations.</p>
          </div>
          <div className="rounded-2xl border border-cyan-300/22 bg-cyan-300/10 p-4">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">After the board show</div>
            <h3 className="mt-2 text-xl font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>One operating decision is ready.</h3>
            <p className="mt-2 text-[12px] leading-5 text-cyan-50">The board sees the risk, the recovery owner, the evidence pack, the vendor response, the field instruction, and the pilot recommendation in one connected model.</p>
          </div>
        </section>

        <section className="rounded-2xl border border-emerald-300/18 bg-emerald-300/8 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">Outcome scorecard</div>
              <h3 className="mt-1 text-xl font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Client-ready proof from this walkthrough.</h3>
            </div>
            <button
              type="button"
              onClick={onCopySummary}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#2E7FFF] px-4 text-[12px] font-black text-white transition-colors hover:bg-[#4B91FF]"
            >
              <Copy size={15} />
              Copy summary
            </button>
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-7">
            {[
              [`${totals.completedMissions}/${totals.totalMissions}`, 'missions'],
              [`${totals.artifactCount}`, 'artifacts'],
              [`${totals.featureCount}`, 'features'],
              [`${totals.decisionsSurfaced}`, 'decisions'],
              [`${totals.timeSavedMinutes}m`, 'time saved'],
              [`-${totals.riskReduction}`, 'risk points'],
              [`+${totals.readinessGain}`, 'readiness'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-xl border border-emerald-300/14 bg-[#07111F] p-3">
                <div className="text-[18px] font-black text-white">{value}</div>
                <div className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">{label}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {totals.artifacts.slice(0, 6).map(artifact => (
              <div key={artifact.id} className="rounded-xl border border-[#2E7FFF]/14 bg-[#0A1628] p-3">
                <div className="text-[12px] font-black text-white">{artifact.label}</div>
                <p className="mt-1 text-[11px] leading-4 text-[#8EA7C7]">{artifact.detail}</p>
              </div>
            ))}
          </div>
        </section>

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

function ValueSpine({ totals }: { totals: ReturnType<typeof getOutcomeTotals> }) {
  const items = [
    [`-${totals.riskReduction}`, 'risk reduced'],
    [`+${totals.readinessGain}`, 'readiness'],
    [`${totals.artifactCount}`, 'artifacts'],
    [`${totals.decisionsSurfaced}`, 'decisions'],
    [`${totals.timeSavedMinutes}m`, 'time saved'],
  ];

  return (
    <div className="grid grid-cols-5 gap-1.5">
      {items.map(([value, label]) => (
        <div key={label} className="min-w-0 rounded-lg border border-[#2E7FFF]/18 bg-[#06101F] px-2 py-1.5 text-center">
          <div className="truncate text-[13px] font-black text-white">{value}</div>
          <div className="truncate text-[8px] font-black uppercase tracking-[0.11em] text-[#7A94B4]">{label}</div>
        </div>
      ))}
    </div>
  );
}

function BoardCaptionBar({
  act,
  section,
  showMode,
  autopilotStatus,
  progress,
}: {
  act: DemoAct;
  section: DemoSection;
  showMode: DemoShowMode;
  autopilotStatus: DemoAutopilotState['status'];
  progress: number;
}) {
  return (
    <div className="flex flex-shrink-0 items-center gap-3 border-b border-[#2E7FFF]/14 bg-[#081426] px-4 py-3">
      <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cyan-300/24 bg-cyan-300/10 text-cyan-200 sm:flex">
        <Presentation size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200">{act.label}: {act.title}</span>
          <span className="rounded-full border border-[#2E7FFF]/20 bg-[#06101F] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-[#8DBDFF]">
            {getShowModeOption(showMode).label}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] ${
            autopilotStatus === 'playing'
              ? 'bg-emerald-300/14 text-emerald-100'
              : autopilotStatus === 'paused'
              ? 'bg-amber-300/14 text-amber-100'
              : 'bg-[#2E7FFF]/12 text-[#B8C7DB]'
          }`}>
            {autopilotStatus === 'playing' ? 'Auto tour running' : autopilotStatus === 'paused' ? 'Paused' : 'Manual'}
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-[13px] font-semibold leading-5 text-[#E6EEF9]">{section.narration.caption}</p>
      </div>
      <div className="hidden w-28 shrink-0 sm:block">
        <div className="mb-1 flex items-center justify-between text-[9px] font-black uppercase tracking-[0.12em] text-[#7A94B4]">
          <span>section</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-[#13294A]">
          <div className="h-full rounded-full bg-[linear-gradient(90deg,#22D3EE,#2E7FFF,#7C3AED)] transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}

function ExecutiveControlRoom({
  showMode,
  onShowModeChange,
  onStart,
  onBrowse,
  onCopyBoardLink,
}: {
  showMode: DemoShowMode;
  onShowModeChange: (showMode: DemoShowMode) => void;
  onStart: () => void;
  onBrowse: () => void;
  onCopyBoardLink: () => void;
}) {
  const promises = [
    { icon: Building2, title: 'Portfolio Control', detail: 'One board view of asset health, owner risk, and the command path.' },
    { icon: Target, title: 'Risk To Action', detail: 'A handover threat becomes gates, cost exposure, proof gaps, and assigned recovery.' },
    { icon: BrainCircuit, title: 'AI Operating System', detail: 'Vendor, field, resident, and project signals resolve into one owner recommendation.' },
  ];

  return (
    <div className="min-h-screen overflow-y-auto bg-[#030A15] text-[#EEF3FA]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-5">
        <header className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <img src="/4c-logo.png" alt="4C logo" className="h-10 w-10 rounded-xl object-contain" />
            <div className="min-w-0">
              <div className="truncate text-[16px] font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>4C360 Board Demo</div>
              <div className="truncate text-[11px] font-bold uppercase tracking-[0.16em] text-[#7A94B4]">Actual system, cinematic walkthrough</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onCopyBoardLink}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-[#2E7FFF]/24 bg-[#0A1628] px-3 text-[12px] font-black text-[#B8C7DB] hover:bg-[#112040] hover:text-white"
          >
            <Copy size={15} />
            Copy Board Link
          </button>
        </header>

        <main className="grid flex-1 items-center gap-5 py-6 md:grid-cols-[minmax(0,1fr)_minmax(320px,0.82fr)] xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
          <section className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E11D2E]/28 bg-[#E11D2E]/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#FFB4BC]">
              <MonitorPlay size={14} />
              Executive control room
            </div>
            <h1 className="mt-5 max-w-4xl text-[clamp(32px,5.2vw,64px)] font-black leading-[0.96] text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              One handover risk becomes a board-ready operating decision.
            </h1>
            <p className="mt-4 max-w-3xl text-[16px] leading-7 text-[#B8C7DB]">
              {DEMO_SCENARIO} The show moves through live 4C360 screens, narrated proof points, and timed sections so the board sees the system working, not a static pitch.
            </p>

            <div className="mt-4 grid gap-2 md:hidden">
              <button
                type="button"
                onClick={onStart}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#2E7FFF] px-4 text-[14px] font-black text-white shadow-xl shadow-blue-950/35"
              >
                <Play size={17} />
                Start Board Demo
              </button>
              <button
                type="button"
                onClick={onBrowse}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#2E7FFF]/24 bg-[#06101F] px-4 text-[13px] font-black text-[#DCEBFF]"
              >
                <ListTree size={16} />
                Browse Chapters
              </button>
            </div>

            <div className="mt-5 hidden gap-2 xl:grid xl:grid-cols-3">
              {promises.map(({ icon: Icon, title, detail }) => (
                <div key={title} className="rounded-2xl border border-[#2E7FFF]/20 bg-[#07111F] p-3 shadow-2xl shadow-black/20">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/24 bg-cyan-300/10 text-cyan-200">
                    <Icon size={19} />
                  </div>
                  <h2 className="mt-3 text-[14px] font-black text-white">{title}</h2>
                  <p className="mt-2 text-[12px] leading-5 text-[#8EA7C7]">{detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-[#2E7FFF]/24 bg-[linear-gradient(155deg,rgba(46,127,255,0.18),rgba(124,58,237,0.12),rgba(7,17,31,0.98))] p-5 shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">Choose pacing</div>
                <h2 className="mt-1 text-2xl font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Start the board show.</h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-300/24 bg-emerald-300/10 text-emerald-200">
                <Rocket size={22} />
              </div>
            </div>

            <div className="mt-5 space-y-2">
              {SHOW_MODE_OPTIONS.map(option => {
                const active = showMode === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => onShowModeChange(option.id)}
                    className={`flex w-full items-center justify-between gap-3 rounded-2xl border p-3 text-left transition-colors ${
                      active
                        ? 'border-[#2E7FFF]/60 bg-[#2E7FFF]/18 text-white'
                        : 'border-[#2E7FFF]/16 bg-[#06101F]/76 text-[#B8C7DB] hover:border-[#2E7FFF]/34 hover:bg-[#112040]'
                    }`}
                  >
                    <span>
                      <span className="block text-[13px] font-black">{option.label}</span>
                      <span className="mt-1 block text-[11px] leading-4 text-[#8EA7C7]">{option.description}</span>
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${active ? 'bg-cyan-300/14 text-cyan-100' : 'bg-[#0A1628] text-[#7A94B4]'}`}>
                      {option.durationLabel}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto]">
              <button
                type="button"
                onClick={onStart}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#2E7FFF] px-4 text-[14px] font-black text-white shadow-xl shadow-blue-950/35 transition-colors hover:bg-[#4B91FF]"
              >
                <Play size={17} />
                Start Board Demo
              </button>
              <button
                type="button"
                onClick={onBrowse}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[#2E7FFF]/24 bg-[#06101F] px-4 text-[13px] font-black text-[#DCEBFF] transition-colors hover:bg-[#112040]"
              >
                <ListTree size={16} />
                Browse Chapters
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-[#2E7FFF]/18 bg-[#06101F]/82 p-4">
              <div className="grid grid-cols-3 gap-2">
                {[
                  ['39', 'live sections'],
                  ['7', 'prepared artifacts'],
                  ['1', 'board decision'],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-xl border border-[#2E7FFF]/14 bg-[#0A1628] p-3 text-center">
                    <div className="text-[20px] font-black text-white">{value}</div>
                    <div className="mt-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#7A94B4]">{label}</div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[12px] leading-5 text-[#8EA7C7]">
                Premium audio is handled by the ElevenLabs board advisor when an agent ID is configured. Captions stay on-screen for every board show.
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

type DemoVoiceSession = {
  endSession(): Promise<void>;
  sendUserMessage(text: string): void;
  sendContextualUpdate(text: string): void;
  setMicMuted(isMuted: boolean): void;
};

function buildElevenLabsSystemPrompt() {
  return [
    'You are the 4C360 board demo voice advisor for a property-owner executive audience.',
    'When a message starts with NARRATE:, speak the narration cue in a polished boardroom tone.',
    'Keep narration concise, confident, and close to the supplied wording.',
    'Do not invent product claims. If the board asks a question, answer from the Sobha Pilot Tower handover-risk scenario.',
  ].join(' ');
}

function buildElevenLabsNarrationCue(section: DemoSection) {
  return `NARRATE: ${section.narration.caption}`;
}

function DemoVoiceAdvisor({ section, onToast }: { section: DemoSection; onToast: ToastFn }) {
  const [open, setOpen] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<DemoVoiceState>(DEMO_AGENT_ID ? 'ready' : 'unavailable');
  const [voiceActive, setVoiceActive] = useState(false);
  const [autoNarrationEnabled, setAutoNarrationEnabled] = useState(true);
  const conversationRef = useRef<DemoVoiceSession | null>(null);
  const lastNarratedSectionRef = useRef<string | null>(null);

  const sendNarrationCue = useCallback((targetSection: DemoSection) => {
    if (!conversationRef.current) return;
    lastNarratedSectionRef.current = targetSection.sectionId;
    conversationRef.current.sendUserMessage(buildElevenLabsNarrationCue(targetSection));
  }, []);

  const stopVoice = useCallback(async () => {
    if (conversationRef.current) {
      try {
        await conversationRef.current.endSession();
      } catch {
        // no-op
      }
    }
    conversationRef.current = null;
    setVoiceActive(false);
    setVoiceStatus(DEMO_AGENT_ID ? 'ready' : 'unavailable');
  }, []);

  const startVoice = useCallback(async () => {
    if (!DEMO_AGENT_ID) {
      setVoiceStatus('unavailable');
      onToast('Voice unavailable, captions active', 'info');
      return;
    }
    if (voiceActive) return;

    try {
      setOpen(true);
      setVoiceActive(true);
      setVoiceStatus('connecting');
      const { Conversation } = await import('@11labs/client');
      const ttsOverride = DEMO_VOICE_ID ? { voiceId: DEMO_VOICE_ID } : undefined;
      lastNarratedSectionRef.current = section.sectionId;
      conversationRef.current = await Conversation.startSession({
        agentId: DEMO_AGENT_ID,
        connectionType: 'websocket',
        overrides: {
          agent: {
            prompt: { prompt: buildElevenLabsSystemPrompt() },
            firstMessage: section.narration.caption,
            language: 'en',
          },
          ...(ttsOverride ? { tts: ttsOverride } : {}),
        },
        dynamicVariables: {
          demo_scenario: DEMO_SCENARIO,
          current_chapter: section.chapterId,
          current_section: section.title,
        },
        onConnect: () => {
          setVoiceStatus('listening');
          onToast('ElevenLabs board audio connected', 'success');
        },
        onDisconnect: () => {
          conversationRef.current = null;
          setVoiceActive(false);
          setVoiceStatus('ready');
        },
        onError: () => {
          conversationRef.current = null;
          setVoiceActive(false);
          setVoiceStatus('error');
        },
        onModeChange: (mode: { mode: 'speaking' | 'listening' }) => setVoiceStatus(mode.mode),
      });
    } catch {
      conversationRef.current = null;
      setVoiceActive(false);
      setVoiceStatus('error');
    }
  }, [onToast, section, voiceActive]);

  useEffect(() => {
    if (!voiceActive || !autoNarrationEnabled || !conversationRef.current) return;
    if (lastNarratedSectionRef.current === section.sectionId) return;
    sendNarrationCue(section);
  }, [autoNarrationEnabled, section, sendNarrationCue, voiceActive]);

  useEffect(() => () => {
    void stopVoice();
  }, [stopVoice]);

  const voiceLabel = voiceStatus === 'unavailable'
    ? 'ElevenLabs not configured'
    : voiceStatus === 'ready'
    ? 'ElevenLabs ready'
    : voiceStatus === 'connecting'
    ? 'Connecting to ElevenLabs'
    : voiceStatus === 'listening'
    ? 'ElevenLabs listening'
    : voiceStatus === 'speaking'
    ? 'ElevenLabs speaking'
    : 'ElevenLabs error';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(current => !current)}
        className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-[11px] font-black transition-colors ${
          voiceActive
            ? 'border-cyan-300/34 bg-cyan-300/12 text-cyan-100'
            : DEMO_AGENT_ID
            ? 'border-[#2E7FFF]/24 bg-[#0A1628] text-[#B8C7DB] hover:bg-[#112040] hover:text-white'
            : 'border-amber-300/24 bg-amber-300/10 text-amber-100 hover:bg-amber-300/14'
        }`}
        aria-label="Open ElevenLabs board audio"
      >
        {voiceActive ? <Volume2 size={14} /> : <Mic size={14} />}
        <span className="hidden sm:inline">{voiceActive ? 'Audio on' : 'ElevenLabs'}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(390px,calc(100vw-32px))] rounded-2xl border border-[#2E7FFF]/24 bg-[#07111F] p-4 shadow-2xl shadow-black/50">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">Board voice advisor</div>
              <h3 className="mt-1 text-[16px] font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{voiceLabel}</h3>
              <p className="mt-2 text-[12px] leading-5 text-[#8EA7C7]">
                Premium demo audio uses ElevenLabs. Browser text-to-speech is intentionally not used for client demos.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#2E7FFF]/18 text-[#8EA7C7] hover:bg-white/5 hover:text-white"
              aria-label="Close voice advisor"
            >
              <X size={14} />
            </button>
          </div>

          {!DEMO_AGENT_ID && (
            <div className="mt-3 rounded-xl border border-amber-300/24 bg-amber-300/10 p-3">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-100">Setup needed</div>
              <p className="mt-1 text-[12px] leading-5 text-amber-50">
                Add an ElevenLabs agent ID as VITE_ELEVENLABS_DEMO_AGENT_ID. The demo will also accept VITE_ELEVENLABS_SOLUTIONS_AGENT_ID or VITE_ELEVENLABS_AGENT_ID.
              </p>
            </div>
          )}

          <div className="mt-3 rounded-xl border border-[#2E7FFF]/16 bg-[#0A1628] p-3">
            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#7A94B4]">Current narration</div>
            <p className="mt-1 text-[12px] leading-5 text-[#DCEBFF]">{section.narration.caption}</p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={voiceActive ? stopVoice : startVoice}
              disabled={!DEMO_AGENT_ID && !voiceActive}
              className={`flex h-10 items-center justify-center gap-2 rounded-xl text-[12px] font-black transition-colors ${
                voiceActive
                  ? 'border border-[#E11D2E]/34 bg-[#E11D2E]/18 text-[#FFB4BC]'
                  : DEMO_AGENT_ID
                  ? 'bg-[#2E7FFF] text-white hover:bg-[#4B91FF]'
                  : 'cursor-not-allowed border border-[#2E7FFF]/18 bg-[#06101F] text-[#7A94B4]'
              }`}
            >
              {voiceActive ? <MicOff size={15} /> : <Mic size={15} />}
              {!DEMO_AGENT_ID ? 'Needs agent ID' : voiceActive ? 'Stop audio' : 'Enable audio'}
            </button>
            <button
              type="button"
              onClick={() => voiceActive ? sendNarrationCue(section) : startVoice()}
              className={`flex h-10 items-center justify-center gap-2 rounded-xl border text-[12px] font-black transition-colors ${
                DEMO_AGENT_ID
                  ? 'border-[#2E7FFF]/22 bg-[#06101F] text-[#DCEBFF] hover:bg-[#112040]'
                  : 'cursor-not-allowed border-[#2E7FFF]/18 bg-[#06101F] text-[#7A94B4]'
              }`}
              disabled={!DEMO_AGENT_ID}
            >
              <Volume2 size={15} />
              Read cue
            </button>
          </div>

          <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[#2E7FFF]/16 bg-[#06101F] px-3 py-2">
            <span>
              <span className="block text-[11px] font-black text-white">Auto-read each section</span>
              <span className="mt-0.5 block text-[10px] leading-4 text-[#7A94B4]">When ElevenLabs is connected, the advisor narrates every new spotlight.</span>
            </span>
            <input
              type="checkbox"
              checked={autoNarrationEnabled}
              onChange={event => setAutoNarrationEnabled(event.target.checked)}
              className="h-4 w-4 accent-[#2E7FFF]"
            />
          </label>
        </div>
      )}
    </div>
  );
}

function DemoStage({
  chapter,
  onToast,
  onOpenChapter,
  totals,
  onCopySummary,
}: {
  chapter: DemoChapter;
  onToast: ToastFn;
  onOpenChapter: (chapterId: string) => void;
  totals: ReturnType<typeof getOutcomeTotals>;
  onCopySummary: () => void;
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

  return <ValueRecap totals={totals} onCopySummary={onCopySummary} />;
}

export function InteractiveDemoWalkthrough() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState(resolveInitialChapter);
  const [activeFrameId, setActiveFrameId] = useState(() => resolveInitialFrame(resolveInitialChapter()));
  const [showMode, setShowMode] = useState<DemoShowMode>(resolveInitialShowMode);
  const [showIntro, setShowIntro] = useState(shouldShowIntroInitially);
  const [autopilot, setAutopilot] = useState<DemoAutopilotState>(resolveInitialAutopilot);
  const [presenterNotesOpen, setPresenterNotesOpen] = useState(false);
  const [sectionProgress, setSectionProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Guided demo ready');
  const [shareCopied, setShareCopied] = useState(false);
  const [sharePanelOpen, setSharePanelOpen] = useState(false);
  const [progressState, setProgressState] = useState<DemoProgressState>(loadDemoProgressState);
  const shareInputRef = useRef<HTMLInputElement>(null);

  const activeIndex = Math.max(0, DEMO_CHAPTERS.findIndex(chapter => chapter.id === activeId));
  const chapter = DEMO_CHAPTERS[activeIndex] ?? DEMO_CHAPTERS[0];
  const frames = useMemo(() => getDemoSections(chapter), [chapter]);
  const activeFrameIndex = Math.max(0, frames.findIndex(frame => frame.id === activeFrameId));
  const activeFrame = frames[activeFrameIndex] ?? frames[0];
  const nextFrame = frames[activeFrameIndex + 1] ?? null;
  const allMissionFrames = useMemo(getAllDemoSections, []);
  const completedMissionSet = useMemo(() => new Set(progressState.completedMissionIds), [progressState.completedMissionIds]);
  const activeMissionComplete = completedMissionSet.has(activeFrame.mission.id);
  const outcomeTotals = useMemo(() => getOutcomeTotals(progressState), [progressState]);
  const activeAct = useMemo(() => getActForChapter(chapter.id), [chapter.id]);
  const hotspotTarget = useMemo<HotspotTarget>(() => ({
    anchor: activeFrame.anchor ?? chapter.anchor,
    fallback: activeFrame.fallback ?? chapter.fallback,
  }), [activeFrame, chapter.anchor, chapter.fallback]);
  const anchorBox = useAnchorBox(stageRef, hotspotTarget);
  const progress = Math.round(((activeIndex + ((activeFrameIndex + 1) / frames.length)) / DEMO_CHAPTERS.length) * 100);
  const sectionDurationMs = activeFrame.durationByMode[showMode];
  const shareUrl = useMemo(
    () => buildShareUrl(chapter.id, activeFrame.sectionId, showMode, autopilot.status === 'playing'),
    [activeFrame.sectionId, autopilot.status, chapter.id, showMode],
  );
  const nextChapter = DEMO_CHAPTERS[(activeIndex + 1) % DEMO_CHAPTERS.length];
  const primaryActionLabel = activeMissionComplete
    ? nextFrame ? `Next: ${nextFrame.label}` : `Next page: ${nextChapter.shortLabel}`
    : activeFrame.mission.actionLabel;

  const selectChapter = useCallback((chapterId: string, frameId?: string) => {
    const nextChapter = getChapterById(chapterId);
    const nextFrameId = resolveFrameId(nextChapter, frameId);
    setShowIntro(false);
    setActiveId(chapterId);
    setActiveFrameId(nextFrameId);
    updateChapterUrl(chapterId, nextFrameId, { showMode, autoplay: autopilot.status === 'playing' });
  }, [autopilot.status, showMode]);

  const selectFrame = useCallback((frameId: string) => {
    const nextFrameId = resolveFrameId(chapter, frameId);
    setShowIntro(false);
    setActiveFrameId(nextFrameId);
    updateChapterUrl(chapter.id, nextFrameId, { showMode, autoplay: autopilot.status === 'playing' });
  }, [autopilot.status, chapter, showMode]);

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
    const previousFrames = getDemoSections(previousChapter);
    selectChapter(previousChapter.id, previousFrames[previousFrames.length - 1]?.id);
  }, [activeFrameIndex, activeIndex, frames, selectChapter, selectFrame]);

  const goBy = useCallback((delta: number) => {
    const nextIndex = (activeIndex + delta + DEMO_CHAPTERS.length) % DEMO_CHAPTERS.length;
    selectChapter(DEMO_CHAPTERS[nextIndex].id);
  }, [activeIndex, selectChapter]);

  const completeMission = useCallback((missionId: string) => {
    let completedNow = false;
    setProgressState(current => {
      if (current.completedMissionIds.includes(missionId)) return current;
      completedNow = true;
      return {
        completedMissionIds: [...current.completedMissionIds, missionId],
        completedAtByMissionId: {
          ...current.completedAtByMissionId,
          [missionId]: new Date().toISOString(),
        },
      };
    });
    return completedNow;
  }, []);

  const resetDemoProgress = useCallback(() => {
    setProgressState(EMPTY_PROGRESS_STATE);
    setAutopilot({ status: 'idle', started: false });
    setSectionProgress(0);
    try {
      window.sessionStorage.removeItem(DEMO_PROGRESS_STORAGE_KEY);
    } catch {
      // Ignore blocked storage during demo reset.
    }
    setStatusMessage('INFO: Demo progress reset');
    window.setTimeout(() => setStatusMessage('Guided demo ready'), 2400);
  }, []);

  const isMissionComplete = useCallback((missionId: string) => completedMissionSet.has(missionId), [completedMissionSet]);

  const onToast: ToastFn = useCallback((message, type = 'info') => {
    const matchedFrame = allMissionFrames.find(frame => (
      frame.mission.trigger.type === 'toastIncludes' && message.includes(frame.mission.trigger.value)
    ));
    if (matchedFrame) completeMission(matchedFrame.mission.id);
    setStatusMessage(`${type.toUpperCase()}: ${message}`);
    window.setTimeout(() => setStatusMessage('Guided demo ready'), 3200);
  }, [allMissionFrames, completeMission]);

  const completeActiveMission = useCallback(() => {
    const completedNow = completeMission(activeFrame.mission.id);
    const message = completedNow ? activeFrame.mission.completionToast : `${activeFrame.artifact.label} already prepared`;
    setStatusMessage(`${completedNow ? 'SUCCESS' : 'INFO'}: ${message}`);
    window.setTimeout(() => setStatusMessage('Guided demo ready'), 2600);
  }, [activeFrame, completeMission]);

  const advanceMissionOrFrame = useCallback(() => {
    if (!isMissionComplete(activeFrame.mission.id)) {
      completeActiveMission();
      return;
    }
    advanceFrame();
  }, [activeFrame.mission.id, advanceFrame, completeActiveMission, isMissionComplete]);

  const startBoardDemo = useCallback(() => {
    const firstChapter = DEMO_CHAPTERS[0];
    const firstSection = getDemoSections(firstChapter)[0];
    setShowIntro(false);
    setActiveId(firstChapter.id);
    setActiveFrameId(firstSection.id);
    setAutopilot({ status: 'playing', started: true });
    updateChapterUrl(firstChapter.id, firstSection.id, { showMode, autoplay: true });
    setStatusMessage('SUCCESS: Board demo running');
    window.setTimeout(() => setStatusMessage('Guided demo ready'), 2400);
  }, [showMode]);

  const browseChapters = useCallback(() => {
    setShowIntro(false);
    setAutopilot({ status: 'idle', started: false });
    updateChapterUrl(chapter.id, activeFrame.id, { showMode, autoplay: false });
  }, [activeFrame.id, chapter.id, showMode]);

  const restartShow = useCallback(() => {
    const firstChapter = DEMO_CHAPTERS[0];
    const firstSection = getDemoSections(firstChapter)[0];
    setActiveId(firstChapter.id);
    setActiveFrameId(firstSection.id);
    setShowIntro(false);
    setAutopilot({ status: 'playing', started: true });
    updateChapterUrl(firstChapter.id, firstSection.id, { showMode, autoplay: true });
  }, [showMode]);

  const toggleAutopilot = useCallback(() => {
    setShowIntro(false);
    const playing = autopilot.status !== 'playing';
    setAutopilot(current => ({ status: playing ? 'playing' : 'paused', started: current.started || playing }));
    updateChapterUrl(chapter.id, activeFrame.id, { showMode, autoplay: playing });
  }, [activeFrame.id, autopilot.status, chapter.id, showMode]);

  const copyLink = useCallback(async () => {
    setSharePanelOpen(true);
    const copied = await copyText(shareUrl);
    if (copied) {
      setShareCopied(true);
      onToast('Share link copied for this section', 'success');
      window.setTimeout(() => setShareCopied(false), 2200);
      return;
    }

    window.setTimeout(() => shareInputRef.current?.select(), 0);
    onToast('Share link ready to copy below', 'info');
  }, [onToast, shareUrl]);

  const copyOutcomeSummary = useCallback(async () => {
    const copied = await copyText(buildOutcomeSummary(outcomeTotals));
    onToast(copied ? 'Outcome scorecard copied' : 'Outcome scorecard is ready to copy from the page', copied ? 'success' : 'info');
  }, [onToast, outcomeTotals]);

  const copyBoardLink = useCallback(async () => {
    const copied = await copyText(buildShareUrl(undefined, undefined, showMode));
    onToast(copied ? 'Board demo link copied' : 'Board demo link is ready to copy', copied ? 'success' : 'info');
  }, [onToast, showMode]);

  const chooseShowMode = useCallback((nextMode: DemoShowMode) => {
    setShowMode(nextMode);
    const url = new URL(window.location.href);
    url.searchParams.set('mode', 'board');
    url.searchParams.set('duration', showModeToQuery(nextMode));
    if (!showIntro) {
      url.searchParams.set('chapter', chapter.id);
      url.searchParams.set('section', activeFrame.id);
      url.searchParams.delete('frame');
      if (autopilot.status === 'playing') url.searchParams.set('autoplay', 'true');
    }
    window.history.replaceState({}, '', `${url.pathname}?${url.searchParams.toString()}${url.hash}`);
  }, [activeFrame.id, autopilot.status, chapter.id, showIntro]);

  useEffect(() => {
    setShareCopied(false);
  }, [activeFrame.id, chapter.id]);

  useEffect(() => {
    saveDemoProgressState(progressState);
  }, [progressState]);

  useEffect(() => {
    setSectionProgress(0);
  }, [activeFrame.id, autopilot.status, showMode]);

  useEffect(() => {
    const root = stageRef.current;
    if (!root || !hotspotTarget.anchor) return;
    const target = root.querySelector(`[data-demo-anchor="${hotspotTarget.anchor}"]`) as HTMLElement | null;
    target?.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
  }, [activeFrame.id, hotspotTarget.anchor]);

  useEffect(() => {
    if (activeFrame.mission.trigger.type !== 'frameVisit') return;
    completeMission(activeFrame.mission.id);
  }, [activeFrame.mission.id, activeFrame.mission.trigger.type, completeMission]);

  useEffect(() => {
    const root = stageRef.current;
    if (!root) return undefined;

    const handleDemoAction = (event: MouseEvent) => {
      const target = event.target instanceof HTMLElement
        ? event.target.closest('[data-demo-action]') as HTMLElement | null
        : null;
      const action = target?.dataset.demoAction;
      if (!action) return;

      const matchedFrame = allMissionFrames.find(frame => (
        frame.mission.trigger.type === 'demoAction' && frame.mission.trigger.action === action
      ));
      if (!matchedFrame) return;

      const completedNow = completeMission(matchedFrame.mission.id);
      setStatusMessage(`${completedNow ? 'SUCCESS' : 'INFO'}: ${matchedFrame.mission.completionToast}`);
      window.setTimeout(() => setStatusMessage('Guided demo ready'), 2600);
    };

    root.addEventListener('click', handleDemoAction, true);
    return () => root.removeEventListener('click', handleDemoAction, true);
  }, [allMissionFrames, completeMission]);

  const openLivePage = useCallback(() => {
    window.location.href = chapter.livePath;
  }, [chapter.livePath]);

  useEffect(() => {
    const syncFromBrowser = () => {
      const next = readDemoLocationFromUrl();
      const params = new URLSearchParams(window.location.search);
      setShowMode(current => {
        const nextMode = queryToShowMode(params.get('duration'));
        return current === nextMode ? current : nextMode;
      });
      if (!next) {
        if (!params.has('chapter')) setShowIntro(true);
        return;
      }

      setShowIntro(false);
      setActiveId(current => (current === next.chapterId ? current : next.chapterId));
      setActiveFrameId(current => (current === next.frameId ? current : next.frameId));
      setAutopilot(current => {
        const shouldPlay = params.get('autoplay') === 'true';
        if (shouldPlay && current.status !== 'playing') return { status: 'playing', started: true };
        if (!shouldPlay && current.status === 'playing') return { status: 'paused', started: current.started };
        return current;
      });
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
        advanceMissionOrFrame();
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goBack();
      }

      if (event.key === ' ') {
        event.preventDefault();
        toggleAutopilot();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [advanceMissionOrFrame, goBack, toggleAutopilot]);

  useEffect(() => {
    if (autopilot.status !== 'playing') return undefined;
    const startedAt = Date.now();
    const progressInterval = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      setSectionProgress(Math.min(100, (elapsed / sectionDurationMs) * 100));
    }, 250);
    const advanceTimer = window.setTimeout(() => {
      completeMission(activeFrame.mission.id);
      advanceFrame();
    }, sectionDurationMs);

    return () => {
      window.clearInterval(progressInterval);
      window.clearTimeout(advanceTimer);
    };
  }, [activeFrame.mission.id, advanceFrame, autopilot.status, completeMission, sectionDurationMs]);

  const railItems = useMemo(() => DEMO_CHAPTERS, []);

  if (showIntro) {
    return (
      <ExecutiveControlRoom
        showMode={showMode}
        onShowModeChange={chooseShowMode}
        onStart={startBoardDemo}
        onBrowse={browseChapters}
        onCopyBoardLink={copyBoardLink}
      />
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-[#030A15] text-[#EEF3FA]">
      <header className="flex h-16 flex-shrink-0 items-center justify-between gap-3 border-b border-[#2E7FFF]/18 bg-[#07111F] px-4">
        <div className="flex min-w-0 items-center gap-3">
          <img src="/4c-logo.png" alt="4C logo" className="h-9 w-9 rounded-lg object-contain" />
          <div className="min-w-0">
            <div className="truncate text-[15px] font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>4C360 Board Demo</div>
            <div className="truncate text-[11px] font-semibold text-[#7A94B4]">Cinematic actual-system walkthrough</div>
          </div>
        </div>
        <div className="hidden min-w-0 flex-1 items-center justify-center gap-3 lg:flex">
          <div className="min-w-0 flex-1 max-w-xl">
            <div className="mb-1 truncate text-center text-[10px] font-black uppercase tracking-[0.14em] text-cyan-200">{activeAct.title}: {DEMO_SCENARIO}</div>
            <div className="rounded-full border border-[#2E7FFF]/22 bg-[#0A1628] p-1">
              <div className="h-2 rounded-full bg-[#13294A]">
                <div className="h-full rounded-full bg-[linear-gradient(90deg,#2E7FFF,#22D3EE,#7C3AED)] transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
          <div className="hidden shrink-0 grid-cols-5 gap-1 2xl:grid">
            {[
              [`-${outcomeTotals.riskReduction}`, 'risk'],
              [`+${outcomeTotals.readinessGain}`, 'ready'],
              [`${outcomeTotals.artifactCount}`, 'artifacts'],
              [`${outcomeTotals.decisionsSurfaced}`, 'decisions'],
              [`${outcomeTotals.timeSavedMinutes}m`, 'saved'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-lg border border-[#2E7FFF]/18 bg-[#0A1628] px-2 py-1 text-center">
                <div className="text-[12px] font-black text-white">{value}</div>
                <div className="text-[8px] font-black uppercase tracking-[0.12em] text-[#7A94B4]">{label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={toggleAutopilot}
            className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-[11px] font-black text-white transition-colors ${
              autopilot.status === 'playing' ? 'bg-[#E11D2E] hover:bg-[#F43F5E]' : 'bg-[#2E7FFF] hover:bg-[#4B91FF]'
            }`}
            aria-label={autopilot.status === 'playing' ? 'Pause board demo' : 'Start board demo'}
          >
            {autopilot.status === 'playing' ? <Pause size={14} /> : <Play size={14} />}
            <span className="hidden sm:inline">{autopilot.status === 'playing' ? 'Pause' : 'Play'}</span>
          </button>
          <DemoVoiceAdvisor section={activeFrame} onToast={onToast} />
          <button
            type="button"
            onClick={resetDemoProgress}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#2E7FFF]/24 bg-[#0A1628] px-3 text-[11px] font-black text-[#B8C7DB] transition-colors hover:bg-[#112040] hover:text-white"
            aria-label="Reset demo progress"
          >
            <RotateCcw size={14} />
            <span className="hidden sm:inline">Reset</span>
          </button>
          <button
            type="button"
            onClick={copyLink}
            className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-[11px] font-black transition-colors ${
              shareCopied
                ? 'border-emerald-300/30 bg-emerald-300/12 text-emerald-100'
                : 'border-[#2E7FFF]/24 bg-[#0A1628] text-[#B8C7DB] hover:bg-[#112040] hover:text-white'
            }`}
            aria-label={shareCopied ? 'Share link copied' : 'Share this section'}
          >
            {shareCopied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
            <span className="hidden sm:inline">{shareCopied ? 'Copied' : 'Share'}</span>
          </button>
          {sharePanelOpen && (
            <div className="absolute right-0 top-12 z-50 w-[min(420px,calc(100vw-32px))] rounded-xl border border-[#2E7FFF]/24 bg-[#07111F] p-3 shadow-2xl shadow-black/50">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.16em] text-cyan-200">Share section</div>
                  <div className="mt-1 text-[11px] text-[#8EA7C7]">Send this link to open the same board-demo section.</div>
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
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8DBDFF]">Board show path</div>
              <div className="mt-1 text-[11px] text-[#7A94B4]">{activeIndex + 1} of {DEMO_CHAPTERS.length} pages, section {activeFrameIndex + 1} of {frames.length}</div>
            </div>
            <button
              type="button"
              onClick={toggleAutopilot}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border text-white transition-colors ${autopilot.status === 'playing' ? 'border-violet-300/34 bg-violet-400/20' : 'border-[#2E7FFF]/22 bg-[#0A1628] hover:bg-[#112040]'}`}
              aria-label={autopilot.status === 'playing' ? 'Pause auto tour' : 'Start auto tour'}
            >
              {autopilot.status === 'playing' ? <Pause size={15} /> : <Play size={15} />}
            </button>
          </div>

          <div className="custom-scrollbar flex gap-2 overflow-x-auto pb-1 md:block md:max-h-[calc(100vh-150px)] md:space-y-1.5 md:overflow-y-auto md:pr-0 xl:pr-1">
            {railItems.map((item, index) => {
              const Icon = item.icon;
              const active = item.id === chapter.id;
              const itemFrames = getDemoSections(item);
              const itemCompleted = itemFrames.filter(frame => completedMissionSet.has(frame.mission.id)).length;
              const itemDone = itemCompleted === itemFrames.length;
              const itemAct = getActForChapter(item.id);
              return (
                <div key={item.id} className="min-w-[170px] md:min-w-0">
                  <button
                    type="button"
                    onClick={() => selectChapter(item.id)}
                    className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left transition-all md:justify-center md:px-2 xl:justify-start xl:px-3 ${
                      active
                        ? 'border-[#2E7FFF]/50 bg-[#2E7FFF]/16 text-white shadow-[0_0_22px_rgba(46,127,255,0.14)]'
                        : 'border-transparent bg-[#0A1628]/70 text-[#8EA7C7] hover:border-[#2E7FFF]/22 hover:bg-[#112040]'
                    }`}
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${active ? 'border-cyan-300/30 bg-cyan-300/12 text-cyan-200' : 'border-[#2E7FFF]/14 bg-[#07111F] text-[#7A94B4]'}`}>
                      {itemDone ? <CheckCircle2 size={15} /> : <Icon size={15} />}
                    </span>
                    <span className="min-w-0 md:hidden xl:block">
                      <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-[#5F7FA8]">{itemAct.label} / {String(index + 1).padStart(2, '0')}</span>
                      <span className="block truncate text-[12px] font-black">{item.label}</span>
                      <span className="block text-[9px] font-black uppercase tracking-[0.12em] text-[#5F7FA8]">{itemCompleted}/{itemFrames.length} sections</span>
                    </span>
                  </button>
                  {active && (
                    <div className="mt-1.5 hidden space-y-1 pl-10 xl:block">
                      {itemFrames.map((frame, frameIndex) => {
                        const frameActive = activeFrame.id === frame.id;
                        const complete = completedMissionSet.has(frame.mission.id);
                        return (
                          <button
                            key={frame.id}
                            type="button"
                            onClick={() => selectFrame(frame.id)}
                            className={`flex w-full items-center justify-between gap-2 rounded-lg border px-2 py-1.5 text-left text-[11px] font-bold transition-colors ${
                              frameActive
                                ? 'border-cyan-300/32 bg-cyan-300/12 text-cyan-100'
                                : 'border-[#2E7FFF]/10 bg-[#06101F] text-[#7A94B4] hover:border-[#2E7FFF]/24 hover:text-white'
                            }`}
                          >
                            <span className="truncate">{frameIndex + 1}. {frame.title}</span>
                            {complete && <CheckCircle2 size={11} className="shrink-0 text-emerald-200" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
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
            <BoardCaptionBar
              act={activeAct}
              section={activeFrame}
              showMode={showMode}
              autopilotStatus={autopilot.status}
              progress={sectionProgress}
            />
            <div className="flex-shrink-0 border-b border-[#2E7FFF]/14 bg-[#07111F] px-4 py-2 2xl:hidden">
              <ValueSpine totals={outcomeTotals} />
            </div>
            <div ref={stageRef} className="relative min-h-0 flex-1 overflow-hidden">
              <DemoStage key={chapter.id} chapter={chapter} onToast={onToast} onOpenChapter={selectChapter} totals={outcomeTotals} onCopySummary={copyOutcomeSummary} />
              <StageHotspot box={anchorBox} fallback={hotspotTarget.fallback} />
            </div>
          </div>
        </main>

        <aside className="flex min-h-0 flex-col border-t border-[#2E7FFF]/16 bg-[#07111F] p-3 md:border-l md:border-t-0">
          <div className="custom-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">Board narration</div>
                <div className="rounded-full border border-[#2E7FFF]/22 bg-[#0A1628] px-2 py-1 text-[10px] font-black text-[#8DBDFF]">
                  {activeMissionComplete ? 'Complete' : `${activeFrameIndex + 1}/${frames.length}`}
                </div>
              </div>
              <h1 className="mt-1.5 text-[19px] font-black leading-tight text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{activeFrame.headline}</h1>
              <p className="mt-2 text-[12px] leading-5 text-[#B8C7DB]">{activeFrame.boardNarrative}</p>
            </div>

            <section className="rounded-xl border border-cyan-300/18 bg-cyan-300/10 px-3 py-2.5">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200">Voice script</div>
              <p className="mt-1 text-[12px] font-semibold leading-5 text-[#E6EEF9]">{activeFrame.narration.caption}</p>
            </section>

            <section className={`rounded-xl border px-3 py-2.5 ${activeMissionComplete ? 'border-emerald-300/24 bg-emerald-300/10' : 'border-[#2E7FFF]/22 bg-[#0A1628]'}`}>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={15} className={`mt-0.5 shrink-0 ${activeMissionComplete ? 'text-emerald-200' : 'text-[#5F7FA8]'}`} />
                <div className="min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8DBDFF]">Client proof</div>
                  <p className="mt-1 text-[12px] font-bold leading-5 text-white">{activeFrame.mission.prompt}</p>
                  <p className="mt-1 text-[11px] leading-4 text-[#8EA7C7]">{activeFrame.mission.talkingPoint}</p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-[#2E7FFF]/18 bg-[#0A1628] p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#7A94B4]">Show length</div>
                <button
                  type="button"
                  onClick={() => setPresenterNotesOpen(current => !current)}
                  className="rounded-lg border border-[#2E7FFF]/18 px-2 py-1 text-[10px] font-black text-[#8DBDFF] hover:bg-[#112040]"
                >
                  {presenterNotesOpen ? 'Hide notes' : 'Presenter notes'}
                </button>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {SHOW_MODE_OPTIONS.map(option => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => chooseShowMode(option.id)}
                    className={`rounded-lg border px-2 py-1.5 text-[10px] font-black transition-colors ${
                      showMode === option.id
                        ? 'border-cyan-300/36 bg-cyan-300/12 text-cyan-100'
                        : 'border-[#2E7FFF]/14 bg-[#06101F] text-[#7A94B4] hover:text-white'
                    }`}
                  >
                    {option.shortLabel}
                  </button>
                ))}
              </div>
              {presenterNotesOpen && (
                <p className="mt-2 rounded-lg border border-amber-300/18 bg-amber-300/10 p-2 text-[11px] leading-4 text-amber-50">
                  {activeFrame.narration.presenterNote}
                </p>
              )}
            </section>

            <section className="grid grid-cols-3 gap-1.5">
              {frames.map((frame, index) => {
                const active = frame.id === activeFrame.id;
                const complete = completedMissionSet.has(frame.mission.id);
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
                    <span className="flex items-center justify-between gap-1 text-[9px] font-black uppercase tracking-[0.14em] text-[#5F7FA8]">
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      {complete && <CheckCircle2 size={10} className="text-emerald-200" />}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] font-black">{frame.title}</span>
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
              <div className="border-t border-[#2E7FFF]/12 px-3 py-2">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200">Features covered</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {activeFrame.features.map(feature => (
                    <span key={feature} className="rounded-full border border-[#2E7FFF]/18 bg-[#07111F] px-2 py-1 text-[10px] font-bold text-[#B8C7DB]">{feature}</span>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-[#2E7FFF]/18 bg-[#0A1628] px-3 py-2">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#7A94B4]">Prepared artifact</div>
              <div className="mt-1 text-[12px] font-black text-white">{activeFrame.artifact.label}</div>
              <p className="mt-1 text-[11px] leading-4 text-[#8EA7C7]">{activeFrame.artifact.detail}</p>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {[
                  [`${activeFrame.outcome.timeSavedMinutes}m`, 'saved'],
                  [`-${activeFrame.outcome.riskReduction}`, 'risk'],
                  [`+${activeFrame.outcome.readinessGain}`, 'ready'],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-lg border border-[#2E7FFF]/14 bg-[#07111F] px-2 py-1 text-center">
                    <div className="text-[12px] font-black text-white">{value}</div>
                    <div className="text-[8px] font-black uppercase tracking-[0.12em] text-[#5F7FA8]">{label}</div>
                  </div>
                ))}
              </div>
            </section>

          </div>

          <div className="mt-3 shrink-0 space-y-2 border-t border-[#2E7FFF]/14 pt-3">
            <button
              type="button"
              onClick={advanceMissionOrFrame}
              className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#2E7FFF] px-3 py-2.5 text-center text-[12px] font-black leading-tight text-white shadow-lg shadow-blue-950/30 transition-colors hover:bg-[#4B91FF]"
            >
              {activeMissionComplete ? <ChevronRight size={15} className="shrink-0" /> : <Sparkles size={15} className="shrink-0" />}
              <span className="min-w-0 truncate">{primaryActionLabel}</span>
            </button>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={goBack}
                className="flex h-9 items-center justify-center gap-2 rounded-xl border border-[#2E7FFF]/22 bg-[#0A1628] text-[12px] font-black text-[#B8C7DB] transition-colors hover:bg-[#112040] hover:text-white"
              >
                <ChevronLeft size={15} />
                <span className="hidden xl:inline">Previous</span>
              </button>
              <button
                type="button"
                onClick={restartShow}
                className="flex h-9 items-center justify-center gap-2 rounded-xl border border-[#2E7FFF]/22 bg-[#0A1628] text-[12px] font-black text-[#B8C7DB] transition-colors hover:bg-[#112040] hover:text-white"
              >
                <TimerReset size={15} />
                <span className="hidden xl:inline">Restart</span>
              </button>
              <button
                type="button"
                onClick={() => goBy(1)}
                className="flex h-9 items-center justify-center gap-2 rounded-xl border border-[#2E7FFF]/22 bg-[#0A1628] text-[12px] font-black text-[#B8C7DB] transition-colors hover:bg-[#112040] hover:text-white"
              >
                <span className="hidden xl:inline">Next page</span>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </aside>
      </div>
      {statusMessage !== 'Guided demo ready' && (
        <div className="fixed right-3 top-20 z-[70] max-w-[340px] rounded-xl border border-[#2E7FFF]/22 bg-[#07111F]/95 px-3 py-2 text-[11px] font-bold leading-5 text-[#DCEBFF] shadow-2xl shadow-black/40 backdrop-blur" aria-live="polite">
          {statusMessage}
        </div>
      )}
      <div className="fixed inset-x-0 bottom-0 z-[65] border-t border-[#2E7FFF]/24 bg-[#07111F]/96 p-2 shadow-2xl shadow-black/50 backdrop-blur md:hidden">
        <div className="grid grid-cols-[44px_minmax(0,1fr)_44px] gap-2">
          <button
            type="button"
            onClick={toggleAutopilot}
            className={`flex h-11 items-center justify-center rounded-xl text-white ${autopilot.status === 'playing' ? 'bg-[#E11D2E]' : 'bg-[#0A1628] border border-[#2E7FFF]/22'}`}
            aria-label={autopilot.status === 'playing' ? 'Pause auto tour' : 'Start auto tour'}
          >
            {autopilot.status === 'playing' ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button
            type="button"
            onClick={advanceMissionOrFrame}
            className="flex h-11 min-w-0 items-center justify-center gap-2 rounded-xl bg-[#2E7FFF] px-3 text-[12px] font-black text-white"
          >
            {activeMissionComplete ? <ChevronRight size={15} className="shrink-0" /> : <Sparkles size={15} className="shrink-0" />}
            <span className="truncate">{primaryActionLabel}</span>
          </button>
          <button
            type="button"
            onClick={goBack}
            className="flex h-11 items-center justify-center rounded-xl border border-[#2E7FFF]/22 bg-[#0A1628] text-[#B8C7DB]"
            aria-label="Previous section"
          >
            <ChevronLeft size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
