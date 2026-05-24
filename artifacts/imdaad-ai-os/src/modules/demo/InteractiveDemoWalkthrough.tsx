import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from 'react';
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
  Mic,
  MicOff,
  MonitorPlay,
  MousePointer2,
  Pause,
  Play,
  Plus,
  RotateCcw,
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
import { Dashboard as StrategicDashboard } from '@/components/strategic/StrategicView';
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

type DemoSpotlightBeat = {
  anchor?: string;
  fallback: FallbackHotspot;
  startPct: number;
  endPct: number;
  label?: string;
};

type DemoTimelineCue =
  | { atMs: number; type: 'spotlight'; anchor?: string; fallback: FallbackHotspot; durationMs?: number }
  | { atMs: number; type: 'scrollTo'; anchor: string }
  | { atMs: number; type: 'slowScrollTo'; anchor: string; durationMs: number }
  | { atMs: number; type: 'pulse'; anchor?: string; fallback: FallbackHotspot; durationMs?: number }
  | { atMs: number; type: 'pinPulse'; anchor?: string; fallback: FallbackHotspot; durationMs?: number }
  | { atMs: number; type: 'flash'; anchor?: string; fallback: FallbackHotspot; durationMs?: number }
  | { atMs: number; type: 'demoAction'; actionId: string }
  | { atMs: number; type: 'clearDemoAction' }
  | { atMs: number; type: 'chapterPause' };

type DemoSeekRequest = {
  id: number;
  elapsedMs: number;
};

type DemoActionRequest = {
  actionId: string;
  nonce: number;
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

const DEMO_SPOTLIGHTS_ENABLED = false;
const PORTFOLIO_CLARITY_REVEAL_MS = 13_300;
const PORTFOLIO_GIS_HANDOFF_MS = 25_200;
const PORTFOLIO_GIS_ZOOM_OUT_MS = 35_700;
const PORTFOLIO_DISPATCH_SITE_TEAM_MS = 69_000;
const PORTFOLIO_ASSIGN_TECHNICIAN_MS = 83_500;
const PORTFOLIO_PROPERTIES_RECAP_MS = 84_000;
const PORTFOLIO_PROPERTIES_RECAP_FADE_MS = 1_650;
const PORTFOLIO_REPORT_SEQUENCE_MS = 98_800;
const PORTFOLIO_REPORT_OPEN_MS = 102_000;

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

type DemoShowMode = 'board';

type DemoAutopilotState = {
  status: 'idle' | 'playing' | 'paused';
  started: boolean;
};

type DemoNarrationPhase = 'intro' | 'section' | 'closing' | 'chapterEnd';

type DemoVoiceState = 'unavailable' | 'ready' | 'connecting' | 'listening' | 'speaking' | 'error';

type DemoNarrationScript = {
  caption: string;
  audio: string;
  presenterNote: string;
  audioSrc: string;
  estimatedDurationMs: number;
  beats: DemoSpotlightBeat[];
  timelineCues: DemoTimelineCue[];
  requiresChapterConfirmation?: boolean;
};

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
  chapterIntroScript: DemoNarrationScript;
  sectionScript: DemoNarrationScript;
  chapterClosingPrompt: DemoNarrationScript;
  audioSrc: string;
  estimatedDurationMs: number;
  requiresChapterConfirmation: boolean;
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
  if (chapterId) url.searchParams.set('chapter', chapterId);
  if (sectionId) url.searchParams.set('section', sectionId);
  if (showMode) url.searchParams.set('duration', showModeToQuery(showMode));
  url.searchParams.set('mode', 'board');
  if (autoplay) {
    url.searchParams.set('autoplay', 'true');
    if (sectionId) url.searchParams.set('phase', 'section');
  }
  return url.toString();
}

const DEMO_PROGRESS_STORAGE_KEY = '4c360-properties-demo-progress-v1';
const DEMO_AGENT_STORAGE_KEY = '4c360-elevenlabs-demo-agent-id';
const DEFAULT_DEMO_AGENT_ID = 'agent_5601ks3evt2rftyttrk7br8m5rtd';
const DEMO_SCENARIO = 'Sobha Pilot Tower handover risk: recover readiness, control cost exposure, close evidence gaps, and prepare owner decisions.';
const DEMO_AGENT_ID = (
  import.meta.env.VITE_ELEVENLABS_DEMO_AGENT_ID
  ?? import.meta.env.VITE_ELEVENLABS_SOLUTIONS_AGENT_ID
  ?? import.meta.env.VITE_ELEVENLABS_AGENT_ID
  ?? DEFAULT_DEMO_AGENT_ID
) as string | undefined;
const DEMO_VOICE_ID = (
  import.meta.env.VITE_ELEVENLABS_DEMO_VOICE_ID
  ?? import.meta.env.VITE_ELEVENLABS_VOICE_ID
) as string | undefined;
const DEMO_SIGNED_URL_ENDPOINT = (
  import.meta.env.VITE_ELEVENLABS_DEMO_SIGNED_URL_ENDPOINT
  ?? import.meta.env.VITE_ELEVENLABS_SIGNED_URL_ENDPOINT
) as string | undefined;

const SHOW_MODE_OPTIONS: Array<{
  id: DemoShowMode;
  query: string;
  label: string;
  shortLabel: string;
  description: string;
  durationLabel: string;
}> = [
  { id: 'board', query: '6', label: '6-minute owner command walkthrough', shortLabel: 'Board', durationLabel: '6 min', description: 'Follow one property risk from portfolio signal to accountable action.' },
];

const DEFAULT_SHOW_MODE: DemoShowMode = 'board';

const ENTRY_BRIEFINGS: Array<{
  icon: LucideIcon;
  label: string;
  title: string;
  body: string;
  proof: string;
  question: string;
  metric: string;
}> = [
  {
    icon: Building2,
    label: 'Portfolio signal',
    title: 'Know where leadership attention should go first.',
    body: '4C360 combines asset health, SLA pressure, incidents, workload, compliance, and risk into one owner view, so the first decision is clear before teams start preparing reports.',
    proof: 'Priority asset identified before the project review starts.',
    question: 'Which property needs owner action today?',
    metric: '1 owner view',
  },
  {
    icon: Target,
    label: 'Risk to action',
    title: 'Turn a risk signal into the work that can resolve it.',
    body: 'The walkthrough moves from portfolio concern into project control, programme, cost, risk, obligations, evidence, vendor action, field proof, and resident follow-through.',
    proof: 'Every concern points to a team, blocker, artifact, and next decision.',
    question: 'Who owns the recovery path?',
    metric: '13 linked sections',
  },
  {
    icon: ShieldAlert,
    label: 'Exposure control',
    title: 'See the commercial and readiness consequence early.',
    body: 'Cost movement, gate blockers, missing evidence, vendor performance, and forecast scenarios are shown together, so the board can compare the cost of action with the cost of delay.',
    proof: 'Risk, readiness, and cost impact stay in the same conversation.',
    question: 'What happens if we wait?',
    metric: 'live impact',
  },
  {
    icon: CheckCircle2,
    label: 'Operating proof',
    title: 'Leave with evidence, assignments, and owner outputs.',
    body: 'The demo closes with prepared artifacts for owner action, gate blockers, evidence readiness, vendor correction, field survey instruction, resident handoff, and pilot recommendation.',
    proof: 'The board sees action-ready outputs, not only dashboards.',
    question: 'What can the team do next?',
    metric: '7 outputs',
  },
];

const ENTRY_PATH_STEPS = [
  'Portfolio signal',
  'Create property',
  'Project command',
  'Cost and risk',
  'Evidence proof',
  'Vendor and field action',
  'Owner recommendation',
];

const DEMO_ACTS: DemoAct[] = [
  {
    id: 'portfolio-control',
    label: 'Act 1',
    title: 'Portfolio Control',
    promise: 'The board sees which assets need attention before teams start explaining reports.',
    chapterIds: ['portfolio', 'propertysetup'],
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

const PORTFOLIO_CHAPTER_ONE_SCRIPT = [
  'Before teams open spreadsheets, prepare reports, or explain delays, leadership needs one thing first: clarity.',
  'Across a large property portfolio, the real challenge is not lack of data.',
  'It is knowing where attention is required now.',
  '4C360 brings operational health, compliance exposure, incidents, SLA pressure, open actions, and asset risk into one live command environment.',
  'Instead of reviewing disconnected updates from multiple departments, leadership can immediately identify which properties are stable, which are deteriorating, and which require intervention.',
  'In this example, one property immediately surfaces above the rest.',
  'That property is Sobha Pilot Tower.',
  'The platform detects increasing operational pressure: unresolved incidents, service degradation, compliance exposure, and handover readiness concerns.',
  'The objective is not simply to display risk.',
  'The objective is to direct action.',
  'This is where most systems stop.',
  'They report the issue.',
  '4C360 continues further.',
  'From the portfolio signal, leadership can move directly into the operational command layer behind the property: programme controls, commercial exposure, readiness status, evidence gaps, vendor performance, field operations, and accountable ownership.',
  'For leadership, this changes the operating model completely.',
  'Instead of reacting after escalation, the organization gains early visibility, operational alignment, accountable workflows, and faster decision cycles.',
  'The result is not just better reporting.',
  'It is better control.',
  'Now that the priority asset has been identified, the next step is understanding how the property enters the system operationally.',
  'We move from portfolio oversight into intelligent property onboarding.',
].join('\n\n');

const PROPERTYSETUP_CHAPTER_TWO_SCRIPT = [
  'Once leadership identifies Sobha Pilot Tower as the priority asset, the next question becomes operational:',
  'How does the property enter the system in a structured, scalable way?',
  '4C360 is designed to onboard operational environments quickly, while preserving governance, accountability, and operational context from day one.',
  'The onboarding process begins with a guided property setup workflow.',
  'Teams can define the property profile, service scope, operational ownership, SLA structure, locations, teams, budgets, inventory, and supporting operational context.',
  'This creates a clean operational baseline before daily activity begins.',
  '4C360 can then accelerate setup using AI-assisted operational modeling.',
  'Based on the property type, asset category, and operational environment, the platform can suggest typical assets, maintenance structures, compliance references, service assumptions, and operational relationships.',
  'Teams remain fully in control.',
  'AI accelerates setup without replacing operational oversight.',
  'The platform also supports direct onboarding from existing property documentation.',
  'Teams can upload handover packs, asset registers, contracts, SOPs, authority documents, warranties, technical reports, and spreadsheets.',
  'Those materials become part of the operational knowledge layer, transforming disconnected files into structured operational intelligence.',
  'This becomes especially powerful across large portfolios.',
  'Instead of repeating onboarding manually for every property, teams can standardize operational structures while still adapting each asset to its real operating conditions.',
  'The result is faster deployment, better governance, cleaner operational data, and a stronger foundation for portfolio-wide intelligence.',
  'Once the property is operationally established, leadership can move beyond onboarding and into live project execution.',
  'We now enter the Project Command environment.',
].join('\n\n');

const PROJECTCOMMAND_CHAPTER_THREE_SCRIPT = [
  'Once Sobha Pilot Tower is operationally established, leadership needs a live control environment.',
  'This is where Project Command begins.',
  'Instead of moving between separate reports, meetings, spreadsheets, and email updates, 4C360 brings the project into one connected command surface.',
  'The board can see the project context immediately:',
  'budget,',
  'progress,',
  'current status,',
  'key owners,',
  'active blockers,',
  'and the decisions required to keep delivery moving.',
  'This is not a static project dashboard.',
  'It is a live operating layer.',
  'From here, leadership can move across every control lens without losing the project story:',
  'programme,',
  'stage gates,',
  'cost,',
  'risk,',
  'forecast,',
  'obligations,',
  'and evidence.',
  'Each view answers a different executive question.',
  'Is the schedule recoverable?',
  'Is the next gate ready?',
  'Where is cost exposure building?',
  'Which risks need owner action?',
  'What outcome is now most likely?',
  'Which obligations are approaching?',
  'And what evidence is still missing?',
  'The value is continuity.',
  'The conversation does not restart every time the topic changes.',
  'Every control area remains connected to the same property, the same project, and the same accountable action path.',
  'Project Command gives leadership one place to understand what is happening, what is blocking progress, who owns the next move, and which decisions matter now.',
  'This is how 4C360 turns project complexity into executive control.',
  'From here, we move into the first major control lens:',
  'the programme.',
].join('\n\n');

const PROGRAMME_CHAPTER_FOUR_SCRIPT = [
  'Now we move into the programme view for the same Sobha Pilot Tower handover path.',
  'At this stage, leadership does not need a complex scheduling file.',
  'They need to understand whether the delivery path is still recoverable.',
  '4C360 translates programme complexity into an executive control view.',
  'The board can see the critical path, delayed activities, contractor responsibility, recovery windows, and the milestones most likely to affect handover.',
  'This changes the schedule discussion.',
  'Instead of asking for another update, leadership can see where time is being lost, which package is creating pressure, and who owns the recovery path.',
  'The programme view connects delay to accountability.',
  'If a contractor activity is slipping, the impact is visible immediately.',
  'If a milestone is under pressure, the required recovery action is shown in context.',
  'If the handover date is at risk, the board can see the trade-off before the issue becomes irreversible.',
  'The value is not simply knowing that a project is late.',
  'The value is knowing where intervention still matters.',
  '4C360 helps leadership move from schedule reporting to schedule control.',
  'The programme becomes a decision tool: what can still be recovered, who must act, what must be approved, and what happens if the organization waits.',
  'From here, we move to the next readiness question:',
  'Is the next stage gate actually ready to pass?',
].join('\n\n');

const STAGEGATES_CHAPTER_FIVE_SCRIPT = [
  'Now that schedule pressure is visible on Sobha Pilot Tower, the next question is readiness.',
  'A milestone is not ready simply because the date has arrived.',
  'It is ready when the required work, approvals, documents, inspections, and evidence are complete.',
  'This is where the stage gates view becomes critical.',
  '4C360 shows which gates are open, which are approaching, and which are blocked.',
  'For each blocked gate, leadership can see the reason:',
  'missing evidence,',
  'expired documentation,',
  'unresolved inspections,',
  'authority dependencies,',
  'or owner decisions still pending.',
  'This changes the readiness conversation.',
  'Instead of discovering blockers late, the board can see exactly what prevents the next gate from moving forward.',
  'The issue becomes specific,',
  'assignable,',
  'and recoverable.',
  'The stage gates view connects every readiness blocker to an owner, a required action, and the evidence needed to close it.',
  'This means leadership can challenge progress with proof, not assumptions.',
  'For handover, commissioning, and owner approvals, this is essential.',
  '4C360 turns stage gates from a checklist into a control mechanism.',
  'It shows whether the project is truly ready to proceed, what is holding it back, and what action protects the next milestone.',
  'From here, we move into the commercial question:',
  'What is this delay or readiness gap costing us?',
].join('\n\n');

const COST_CHAPTER_SIX_SCRIPT = [
  'Once readiness gaps and schedule pressure are visible on the same handover path, the next question is commercial exposure.',
  'What is this delay costing us?',
  'Where is the budget moving?',
  'And which decisions can still reduce the impact?',
  '4C360 brings cost control into the same project command environment.',
  'Leadership can see the current forecast, approved budget, pending variations, package-level drivers, and the commercial pressure linked to delays, vendors, and unresolved decisions.',
  'This makes cost movement explainable.',
  'The board can see whether exposure is coming from procurement,',
  'claims,',
  'scope changes,',
  'delayed approvals,',
  'contractor performance,',
  'or unresolved readiness blockers.',
  'Instead of reviewing cost as a separate finance report, 4C360 connects commercial exposure directly to the operational reality behind it.',
  'This changes the discussion.',
  'The question is no longer only, “Are we over budget?”',
  'The better question is:',
  '“What action can still protect the forecast?”',
  'Cost control becomes a decision framework.',
  'Approve recovery.',
  'Hold payment until evidence is complete.',
  'Escalate a variation.',
  'Challenge a package driver.',
  'Or accept the exposure with full visibility.',
  '4C360 helps leadership compare the cost of action with the cost of delay.',
  'That is where commercial reporting becomes commercial control.',
  'From here, we move into the risk view:',
  'Which risks are most likely to affect delivery, cost, and readiness next?',
].join('\n\n');

const RISK_CHAPTER_SEVEN_SCRIPT = [
  'Now we move from commercial exposure into delivery risk for Sobha Pilot Tower.',
  'The question is no longer only what has happened.',
  'The question is what could still damage the outcome.',
  '4C360 brings the project risk register into the same command environment as programme, cost, stage gates, obligations, and evidence.',
  'Leadership can see the highest priority risks, their probability, impact, trend, owner, mitigation status, and consequence.',
  'This makes risk operational.',
  'A risk is not just a line in a register.',
  'It is a live management question: who owns it, what action is underway, whether the mitigation is strong enough, and what happens if the risk materializes.',
  'This gives the board a better way to challenge delivery confidence.',
  'Instead of asking whether risks have been reviewed, leadership can ask whether the right risks are being controlled.',
  '4C360 connects each risk to the parts of the project it can affect: schedule, cost, readiness, vendors, obligations, and evidence.',
  'That connection matters.',
  'Because the most dangerous risks are not always the loudest.',
  'They are the ones that quietly weaken confidence until recovery becomes expensive.',
  'The risk view helps leadership act before exposure becomes reality.',
  'It turns risk management from a compliance exercise into an operating discipline.',
  'From here, we move into the forecast view:',
  'Given what we now know, what outcome is most likely?',
].join('\n\n');

const FORECAST_CHAPTER_EIGHT_SCRIPT = [
  'After reviewing Sobha Pilot Tower programme, readiness, cost, and risk, leadership needs a forward view.',
  'Not just what happened.',
  'What is likely to happen next?',
  'This is where the forecast view becomes powerful.',
  '4C360 brings together project signals from schedule, cost, risk, obligations, evidence, and delivery performance to compare possible outcomes.',
  'The board can see the base case, upside case, and downside case in one view.',
  'Each scenario is supported by assumptions: expected completion, final cost, risk pressure, confidence level, and the actions that could shift the outcome.',
  'This makes forecasting explainable.',
  'Leadership can understand not only the projected outcome, but why that outcome is becoming more or less likely.',
  'That is the difference between a prediction and a decision tool.',
  'If confidence is weakening, the board can see the causes.',
  'If the downside case is growing, the required intervention becomes visible.',
  'If the base case can still be protected, the action path is clear.',
  '4C360 helps leadership move from reactive reporting to forward control.',
  'The forecast view shows what could happen, what is driving that movement, and which decisions can still change the result.',
  'From here, we move into obligations:',
  'Which contractual, regulatory, and authority duties must be controlled before they create exposure?',
].join('\n\n');

const OBLIGATIONS_CHAPTER_NINE_SCRIPT = [
  'After forecast, leadership needs to understand obligation exposure around the same handover risk.',
  'Because delivery risk does not only come from schedule, cost, or vendors.',
  'It also comes from missed duties.',
  '4C360 brings contractual, regulatory, authority, and owner obligations into the same project command environment.',
  'Leadership can see what is due, what is overdue, what is approaching, who owns it, and what evidence is required to prove completion.',
  'This changes obligation management.',
  'Instead of treating obligations as disconnected legal or compliance records, 4C360 connects them directly to delivery progress, stage gates, evidence, and owner decisions.',
  'A missed obligation is not just an administrative issue.',
  'It can delay approvals, weaken handover readiness, increase commercial exposure, or create regulatory risk.',
  'That is why obligations need to be visible before they become problems.',
  'The obligations view helps leadership prioritize by consequence, not just by due date.',
  'The board can see which duties matter most, which owners need to act, and which proof is still missing.',
  'This creates a stronger governance model.',
  'Duties become traceable.',
  'Owners become accountable.',
  'Evidence becomes connected.',
  '4C360 turns obligation management from a passive register into an active control layer.',
  'From here, we move into evidence:',
  'What proof is still missing, expired, or blocking readiness?',
].join('\n\n');

const EVIDENCE_CHAPTER_TEN_SCRIPT = [
  'Now we arrive at the evidence layer for Sobha Pilot Tower.',
  'This is where readiness becomes provable.',
  'A project may look on track in meetings, but handover, approvals, compliance, and owner confidence depend on proof.',
  '4C360 brings evidence into the same operating environment as programme, stage gates, cost, risk, forecast, and obligations.',
  'Leadership can see which documents are current, which are expired, which are missing, and which evidence items are blocking readiness.',
  'This changes the role of documentation.',
  'Evidence is no longer passive storage.',
  'It becomes an active control signal.',
  'Expired certificates, missing inspection records, incomplete handover packs, authority submissions, warranties, test reports, and compliance documents are surfaced before they delay the next decision.',
  'The board can see what proof is required, who owns it, when it is due, and which milestone or obligation depends on it.',
  'This creates confidence.',
  'Not because someone says the project is ready.',
  'But because the evidence supports it.',
  '4C360 turns evidence into operational intelligence.',
  'It helps teams prepare approval packs, resolve readiness blockers, and protect handover confidence before issues escalate.',
  'From here, the project control journey moves beyond internal readiness.',
  'We now look at vendor performance:',
  'Which external partners are helping execution, and which ones are creating risk?',
].join('\n\n');

const VENDORIQ_CHAPTER_ELEVEN_SCRIPT = [
  'Now we move from internal project control into vendor intelligence for the same handover risk.',
  'Because delivery performance depends heavily on external partners.',
  'A vendor may look competitive on price, but still create risk through poor service, weak documentation, slow response times, repeated failures, or incomplete evidence.',
  'VendorIQ gives leadership a defensible view of partner performance.',
  '4C360 brings together vendor score, SLA performance, quality history, evidence completeness, cost pressure, and repeat issues into one decision layer.',
  'This changes vendor management.',
  'The conversation is no longer based only on opinion, price, or isolated complaints.',
  'Leadership can see which vendors are performing, which are under pressure, and which ones need corrective action.',
  'The platform also connects vendor performance back to the project.',
  'If a vendor is delaying evidence, affecting readiness, increasing cost exposure, or weakening service performance, that impact is visible.',
  'This creates better procurement and operational decisions.',
  'The lowest quote is not always the best decision.',
  'The best vendor decision is the one that balances price, risk, quality, evidence, and delivery confidence.',
  '4C360 turns vendor review into an accountable action path: compare performance, identify risk, prepare corrective notices, and protect the project outcome.',
  'From here, we move into FieldOps:',
  'How does the operating model reach the teams on site?',
].join('\n\n');

const FIELDOPS_CHAPTER_TWELVE_SCRIPT = [
  'Now we move from vendor intelligence into field operations at the Sobha Pilot Tower site.',
  'Because executive control only works if site activity is connected to the command layer.',
  'FieldOps brings the operating model to the teams closest to the work.',
  'Survey tasks, inspections, field updates, issue capture, progress checks, and evidence collection can all be managed from the field.',
  'This closes the gap between what leadership sees and what is actually happening on site.',
  '4C360 gives field teams a clear work queue: what needs to be checked, where it needs to happen, who owns it, what proof must be captured, and what status needs to be updated.',
  'This means field activity becomes structured, traceable, and connected.',
  'When a survey is completed, evidence can support stage gates.',
  'When an issue is captured, it can feed risk, cost, vendor, or programme decisions.',
  'When progress is updated, the project command layer becomes more accurate.',
  'This is where the operating system becomes real.',
  'Not just dashboards.',
  'Not just executive views.',
  'But field execution connected back to leadership control.',
  'FieldOps helps organizations reduce reporting delay, improve evidence quality, and create a live connection between site teams and owner decisions.',
  'From here, we move into the resident and service experience:',
  'How does 4C360 connect operational control to the people receiving the service?',
].join('\n\n');

const RESIDENT_CHAPTER_THIRTEEN_SCRIPT = [
  'Now we move from field execution into the resident and service experience connected to the same operating model.',
  'Because the final test of any property operating model is not only what leadership sees.',
  'It is what residents, tenants, guests, or end users experience every day.',
  '4C360 connects service requests, resident intake, complaints, updates, SLA tracking, and operational follow-through into the same command environment.',
  'This means service issues do not disappear into disconnected inboxes, call logs, or manual follow-ups.',
  'Every request can be captured, categorized, assigned, tracked, and connected to the right operational owner.',
  'Leadership can see whether service demand is increasing, whether response times are slipping, whether repeated issues are appearing, and whether the operating team is closing the loop.',
  'This creates a better service model.',
  'Residents get clearer follow-up.',
  'Operations teams get accountable workflows.',
  'Owners get visibility into service quality and recurring pressure.',
  'And the organization gets a stronger connection between front-line experience and executive control.',
  '4C360 helps transform resident service from reactive complaint handling into measurable operational intelligence.',
  'From here, we move into the final chapter:',
  'What is the overall value of this operating system, and how should the pilot scale?',
].join('\n\n');

const VALUE_CHAPTER_FOURTEEN_SCRIPT = [
  'Now we close the walkthrough with the value view for the Sobha Pilot Tower pilot story.',
  'Across the journey, 4C360 has followed one operating thread:',
  'from portfolio signal,',
  'to property onboarding,',
  'to project command,',
  'to programme, cost, risk, forecast, obligations, evidence, vendors, field execution, and resident experience.',
  'The value is not in any single dashboard.',
  'The value is in the connected operating system.',
  'Leadership can see where attention is needed.',
  'Teams can understand what action is required.',
  'Owners can see who is accountable.',
  'And the organization can move from reporting problems to controlling outcomes.',
  'For a pilot, this creates a practical path.',
  'Start with a focused portfolio or priority asset group.',
  'Measure faster decision cycles, reduced reporting effort, clearer evidence readiness, stronger vendor accountability, better field visibility, and improved service follow-through.',
  'Then scale the model across more properties, more workflows, and more operating teams.',
  '4C360 gives the organization a foundation for portfolio intelligence, project control, service quality, and AI-assisted operational decision-making.',
  'The result is a smarter property operating model:',
  'more transparent,',
  'more accountable,',
  'more predictive,',
  'and more controlled.',
  'This is the shift from property management software...',
  'to an AI-powered operating system for real estate performance.',
].join('\n\n');

const NARRATION_DURATION_OVERRIDES_MS: Record<string, number> = {
  'portfolio:intro': 123_071,
  'propertysetup:intro': 131_686,
  'projectcommand:intro': 108_738,
  'programme:intro': 89_810,
  'stagegates:intro': 87_780,
  'cost:intro': 104_752,
  'risk:intro': 97_117,
  'forecast:intro': 99_725,
  'obligations:intro': 101_107,
  'evidence:intro': 93_667,
  'vendoriq:intro': 98_037,
  'fieldops:intro': 96_316,
  'resident:intro': 95_355,
  'value:intro': 109_461,
};

const TIMELINE_DESIGN_DURATIONS_MS: Record<string, number> = {
  'portfolio:intro': 123_071,
  'propertysetup:intro': 95_000,
  'projectcommand:intro': 108_738,
  'programme:intro': 80_000,
  'stagegates:intro': 80_000,
  'cost:intro': 85_000,
  'risk:intro': 85_000,
  'forecast:intro': 85_000,
  'obligations:intro': 80_000,
  'evidence:intro': 85_000,
  'vendoriq:intro': 85_000,
  'fieldops:intro': 85_000,
  'resident:intro': 80_000,
  'value:intro': 85_000,
};

const FULL_CHAPTER_NARRATION_IDS = [
  'portfolio',
  'propertysetup',
  'projectcommand',
  'programme',
  'stagegates',
  'cost',
  'risk',
  'forecast',
  'obligations',
  'evidence',
  'vendoriq',
  'fieldops',
  'resident',
  'value',
] as const;

const CHAPTER_CINEMATIC_META: Record<string, { title: string; question: string }> = {
  portfolio: {
    title: 'Portfolio Control',
    question: 'Where should leadership attention go right now?',
  },
  propertysetup: {
    title: 'Intelligent Property Onboarding',
    question: 'How does a property enter the operating system?',
  },
  projectcommand: {
    title: 'Project Command',
    question: 'How does leadership control execution?',
  },
  programme: {
    title: 'Programme Recovery',
    question: 'Is the schedule recoverable, and where should recovery focus?',
  },
  stagegates: {
    title: 'Readiness Gates',
    question: 'Is the next milestone ready, or blocked by missing proof?',
  },
  cost: {
    title: 'Commercial Exposure',
    question: 'What is the exposure, and which decision can still reduce it?',
  },
  risk: {
    title: 'Delivery Risk',
    question: 'Which risks are most likely to affect delivery, cost, and readiness?',
  },
  forecast: {
    title: 'Outcome Forecast',
    question: 'Given what we now know, what outcome is most likely?',
  },
  obligations: {
    title: 'Obligation Control',
    question: 'Which contractual and authority duties must be controlled?',
  },
  evidence: {
    title: 'Evidence Readiness',
    question: 'What proof is missing, expired, or blocking readiness?',
  },
  vendoriq: {
    title: 'Vendor Intelligence',
    question: 'Which partners are helping execution, and which ones create risk?',
  },
  fieldops: {
    title: 'Field Execution',
    question: 'How does the operating model reach the teams on site?',
  },
  resident: {
    title: 'Resident Follow-through',
    question: 'How does operational control reach the people receiving the service?',
  },
  value: {
    title: 'Value And Scale',
    question: 'How should the pilot scale into an operating-system model?',
  },
};

function hasFullChapterNarration(chapterId: string) {
  return (FULL_CHAPTER_NARRATION_IDS as readonly string[]).includes(chapterId);
}

const INTRO_SECTION_SYNC_MS: Record<string, { sectionId: string; atMs: number }[]> = {
  portfolio: [
    { sectionId: 'health-actions', atMs: 0 },
    { sectionId: 'portfolio-map', atMs: 35_700 },
    { sectionId: 'command-path', atMs: 66_000 },
  ],
  propertysetup: [
    { sectionId: 'wizard', atMs: 0 },
    { sectionId: 'ai', atMs: 38_000 },
    { sectionId: 'upload', atMs: 66_000 },
  ],
};

function getSyncedIntroSectionId(
  chapterId: string,
  frames: DemoSection[],
  elapsedMs: number,
  estimatedDurationMs: number,
  fallbackFrameId: string,
) {
  if (frames.length === 0) return fallbackFrameId;
  const explicitSync = INTRO_SECTION_SYNC_MS[chapterId];
  if (explicitSync) {
    return explicitSync.reduce((current, item) => (
      elapsedMs >= item.atMs ? item.sectionId : current
    ), explicitSync[0]?.sectionId ?? fallbackFrameId);
  }

  const sectionIndex = Math.min(
    frames.length - 1,
    Math.floor((Math.max(0, elapsedMs) / Math.max(1, estimatedDurationMs)) * frames.length),
  );
  return frames[sectionIndex]?.id ?? fallbackFrameId;
}

function getIntroSectionStartMs(
  chapterId: string,
  frameId: string,
  frames: DemoSection[],
  estimatedDurationMs: number,
) {
  const explicitSync = INTRO_SECTION_SYNC_MS[chapterId];
  const explicitMatch = explicitSync?.find(item => item.sectionId === frameId);
  if (explicitMatch) return explicitMatch.atMs;

  const frameIndex = Math.max(0, frames.findIndex(frame => frame.id === frameId));
  if (frameIndex <= 0) return 0;

  const safeDuration = Math.max(1, estimatedDurationMs);
  return Math.min(
    safeDuration - 1000,
    Math.round((safeDuration * frameIndex) / Math.max(1, frames.length)),
  );
}

const CHAPTER_FEATURES: Record<string, string[]> = {
  propertysetup: ['Guided property wizard', 'AI asset setup', 'Document upload'],
  portfolio: ['Portfolio health signals', 'Asset prioritization', 'Command routing'],
  projectcommand: ['Owner decision surface', 'Live control lanes', 'Impact-to-action chain'],
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
  propertysetup: { id: 'property-onboarding-pack', label: 'Property onboarding pack', detail: 'Property profile, AI asset baseline, and uploaded source documents prepared.' },
  portfolio: { id: 'owner-action-plan', label: 'Owner action plan', detail: 'Priority property, control route, and first owner decision captured.' },
  projectcommand: { id: 'project-control-note', label: 'Owner command note', detail: 'What changed, next decision, and accountable review path prepared for the owner.' },
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
  propertysetup: { timeSavedMinutes: 18, riskReduction: 2, readinessGain: 4 },
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
  propertysetup: PROPERTYSETUP_CHAPTER_TWO_SCRIPT,
  portfolio: PORTFOLIO_CHAPTER_ONE_SCRIPT,
  projectcommand: PROJECTCOMMAND_CHAPTER_THREE_SCRIPT,
  programme: PROGRAMME_CHAPTER_FOUR_SCRIPT,
  stagegates: STAGEGATES_CHAPTER_FIVE_SCRIPT,
  cost: COST_CHAPTER_SIX_SCRIPT,
  risk: RISK_CHAPTER_SEVEN_SCRIPT,
  forecast: FORECAST_CHAPTER_EIGHT_SCRIPT,
  obligations: OBLIGATIONS_CHAPTER_NINE_SCRIPT,
  evidence: EVIDENCE_CHAPTER_TEN_SCRIPT,
  vendoriq: VENDORIQ_CHAPTER_ELEVEN_SCRIPT,
  fieldops: FIELDOPS_CHAPTER_TWELVE_SCRIPT,
  resident: RESIDENT_CHAPTER_THIRTEEN_SCRIPT,
  value: VALUE_CHAPTER_FOURTEEN_SCRIPT,
};

const SECTION_NARRATION_SCRIPTS: Record<string, DemoNarration> = {
  'propertysetup:wizard': {
    caption: 'Start with the guided property wizard. Your team can capture the property name, sector, contract type, SLA tier, locations, contacts, team ownership, budgets, inventory, and knowledge base in one onboarding flow. This matters because the operating model is only as good as the first property record. 4C360 makes the setup structured enough for governance, but simple enough for an operations team to complete without waiting for a technical implementation project.',
    presenterNote: 'Highlight the Add New Property wizard and explain that onboarding starts from structured owner and operating context.',
  },
  'propertysetup:ai': {
    caption: 'Now look at the AI-supported setup path. Once the property type and site are known, the system can suggest typical assets, maintenance context, condition notes, compliance references, and PPM assumptions. Your team can edit the AI output before saving, so it accelerates setup without removing human control. This is especially useful when a portfolio has many similar towers, communities, or facilities that need to be onboarded quickly.',
    presenterNote: 'Show the AI Suggest Assets control in the Sites tab and position it as faster baseline creation, not blind automation.',
  },
  'propertysetup:upload': {
    caption: 'The third path is simple file-based onboarding. Your team can start from handover packs, asset registers, contracts, SOPs, warranties, authority documents, or spreadsheet files. Those source documents become part of the property knowledge base, so the operating context is not trapped in inboxes or shared folders. This gives the owner a practical route: use the wizard for clean data, AI for acceleration, and file upload for existing property packs.',
    presenterNote: 'Highlight documents and links in the Knowledge Base tab. The point is fast ingestion of existing property material.',
  },
  'portfolio:health-actions': {
    caption: 'Look at the health signals at the top of the portfolio view. This is the first decision point for an owner: which properties are critical, which are warning, and which are operating normally. Instead of waiting for separate updates from each team, your leadership group can immediately see where attention is needed and start the review from priority, not noise.',
    presenterNote: 'Point to the status and action strip. The client should see that the review starts with priority, not scattered reporting.',
  },
  'portfolio:portfolio-map': {
    caption: 'Now look across the full portfolio command view. Each property is carrying more than a name and location. You can see operating status, incidents, SLA performance, compliance, integrations, and risk context in one place. This lets your team stay at owner level while still knowing that every asset can connect into project, vendor, evidence, field, or resident operations.',
    presenterNote: 'Spotlight the full portfolio command surface. Emphasize that the owner can stay high level while every property remains connected to operating detail.',
  },
  'portfolio:command-path': {
    caption: 'This is where the portfolio view becomes actionable. When a property shows risk, the owner does not need to ask who has the latest report. The command action takes the team straight into the control surface for that asset, where project progress, blockers, cost, risk, evidence, and owners can be reviewed in context. The signal becomes an accountable operating path.',
    presenterNote: 'Spotlight the command action. This is the handoff from portfolio signal to accountable project control.',
  },
  'projectcommand:project-context': {
    caption: 'This opening surface answers the owner question before anyone opens a report: what changed, what is now at risk, and what decision needs attention? Programme, cost, risk, evidence, and forecast are already connected behind the same project signal.',
    presenterNote: 'Spotlight the owner command surface. Emphasize that this is a decision entry point, not a status page.',
  },
  'projectcommand:control-tabs': {
    caption: 'The command path turns the decision into a practical review route. If the issue is programme, cost, risk, or evidence, your team opens that lane from the same owner context instead of rebuilding the story in separate files.',
    presenterNote: 'Show the control-lane buttons. The benefit is continuity between executive review and detailed operating work.',
  },
  'projectcommand:action-queue': {
    caption: 'The impact chain shows why the decision matters. If leadership waits, delay, cost, and confidence move together. If the action is taken now, the system shows the recovery effect and prepares the owner action with a named owner and due window.',
    presenterNote: 'Spotlight the impact chain and next-decision card. This is the so-what of ProjectCommand.',
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
    caption: 'Cost now resolves into a choice. You can see the forecast delta, pending variations, top package driver, and the three commercial paths available to the owner.',
    presenterNote: 'Frame this as a board decision: approve recovery, hold proof, or accept the exposure.',
  },
  'cost:variations': {
    caption: 'The variation queue shows which changes are still waiting for a commercial decision, who owns the approval, and how each item affects programme and forecast.',
    presenterNote: 'Show that pending VOs are not admin noise. They are decision pressure.',
  },
  'cost:package-drivers': {
    caption: 'Package drivers make the forecast explainable. You can trace procurement, progress, claims, vendor score, and delay exposure back to the exact package moving final cost.',
    presenterNote: 'Use this when the board asks why the number changed.',
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
    caption: 'Forecast scenarios compare the outcome paths side by side. You can see probability, completion date, final cost, assumptions, and cost movement before the board commits to an action.',
    presenterNote: 'Frame this as decision support, not prediction theatre.',
  },
  'forecast:confidence': {
    caption: 'Confidence explains why the forecast should be trusted. The system exposes cost range, early warnings, ranked actions, and evidence basis so your team can challenge the forecast intelligently.',
    presenterNote: 'Make the trust point explicit. The forecast is only persuasive when the evidence basis is visible.',
  },
  'forecast:decisions': {
    caption: 'Decision cards turn the forecast into a next move. The board sees which action improves the base case, the impact it protects, and the deadline for the accountable owner.',
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
    story: 'The portfolio view surfaces Sobha Pilot Tower as the priority handover risk and shows the fastest path into control.',
    clientValue: 'Leadership gets one operating picture before diving into projects, incidents, vendors, or evidence.',
    decisionQuestion: 'Which properties need leadership attention today?',
    nextAction: 'Open the highest-risk property and inspect the connected command context.',
    tryLabel: 'Focus portfolio signal',
  },
  {
    id: 'propertysetup',
    label: 'Property Onboarding',
    shortLabel: 'Onboarding',
    screen: 'portfolio',
    icon: Plus,
    anchor: 'property-onboarding-entry',
    fallback: { left: 70, top: 8, width: 22, height: 10 },
    livePath: '/',
    headline: 'Add a new property into the operating model',
    story: 'The owner sees how Sobha Pilot Tower could enter 4C360 through a guided wizard, AI-assisted setup, or existing handover files.',
    clientValue: 'New properties enter 4C360 with enough context to support operations, evidence, budgets, teams, and portfolio control from day one.',
    decisionQuestion: 'How quickly can a new property become operationally usable?',
    nextAction: 'Choose the fastest onboarding route for the property context.',
    tryLabel: 'Show property setup',
  },
  {
    id: 'projectcommand',
    label: 'ProjectCommand Overview',
    shortLabel: 'Project',
    screen: 'projectcommand',
    projectScreen: 'overview',
    icon: Sparkles,
    anchor: 'project-overview-command-strip',
    fallback: { left: 4, top: 8, width: 88, height: 34 },
    livePath: '/projectcommand/overview',
    headline: 'Turn the portfolio signal into an owner decision',
    story: 'ProjectCommand opens the control layer behind Sobha Pilot Tower: what changed, what is at risk, and which decision matters now.',
    clientValue: 'Owners move from reporting to action without losing the context behind cost, risk, evidence, or programme pressure.',
    decisionQuestion: 'What changed, what happens if we wait, and who owns the next move?',
    nextAction: 'Review the command decision before opening the detailed control lanes.',
    tryLabel: 'Show owner command',
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
    story: 'Programme view exposes the Sobha Pilot Tower critical path, delay risk, contractor accountability, and recovery suggestions.',
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
    story: 'Gate Control Board shows which Sobha Pilot Tower readiness gate is blocked by evidence, approvals, or owner action.',
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
    story: 'Cost Intelligence shows how the handover risk moves from readiness pressure into forecast exposure and commercial action.',
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
    story: 'Risk Command shows which future threats could still weaken Sobha Pilot Tower delivery confidence.',
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
    story: 'AI Forecast compares likely Sobha Pilot Tower outcomes and turns the scenario movement into board decisions.',
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
    story: 'The obligations register keeps contractual, authority, and owner duties connected to the same handover path.',
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
    story: 'Evidence Control Centre shows which Sobha Pilot Tower proof is current, expired, missing, or blocking readiness.',
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
    story: 'VendorIQ connects external partner performance to Sobha Pilot Tower readiness, evidence, cost, and service risk.',
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
    story: 'FieldOps shows how site teams create the survey updates and evidence needed to close the Sobha Pilot Tower loop.',
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
    story: 'The resident experience shows how service requests become structured work connected back to the operating model.',
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
    story: 'The demo closes by tying the Sobha Pilot Tower handover risk to portfolio visibility, project controls, evidence, vendors, field execution, and service follow-through.',
    clientValue: 'Prospects leave with a clear map of how 4C360 changes decisions, accountability, and delivery confidence.',
    decisionQuestion: 'Which workflow should the client pilot first?',
    nextAction: 'Choose the first pilot path and schedule a tailored walkthrough.',
    tryLabel: 'Summarize value',
  },
];

const DEMO_FRAMES: Record<string, DemoFrame[]> = {
  propertysetup: [
    {
      id: 'wizard',
      label: 'Wizard',
      anchor: 'property-onboarding-wizard',
      fallback: { left: 28, top: 12, width: 44, height: 70 },
      headline: 'Create the property through a guided wizard',
      story: 'The wizard captures business profile, sites, team, knowledge base, budget, and inventory in one controlled flow.',
      clientValue: 'Owners get a repeatable onboarding path that keeps property setup consistent across the portfolio.',
      decisionQuestion: 'What minimum information is needed before this property can be managed?',
      nextAction: 'review the property profile, location, contract, owner, and operating tabs.',
      tryLabel: 'Show setup wizard',
    },
    {
      id: 'ai',
      label: 'AI Setup',
      anchor: 'property-onboarding-ai',
      fallback: { left: 32, top: 40, width: 38, height: 12 },
      headline: 'Use AI to speed up asset setup',
      story: 'AI can suggest likely assets, conditions, maintenance notes, and compliance context from the property type and site.',
      clientValue: 'Teams can create a usable baseline faster while still reviewing and editing every AI suggestion.',
      decisionQuestion: 'Which asset baseline should AI prepare for this property?',
      nextAction: 'use AI to suggest assets and operating context for the site.',
      tryLabel: 'Show AI setup',
    },
    {
      id: 'upload',
      label: 'File Upload',
      anchor: 'property-onboarding-upload',
      fallback: { left: 30, top: 38, width: 42, height: 30 },
      headline: 'Start from existing property files',
      story: 'Handover packs, asset registers, contracts, SOPs, warranties, and authority documents can be added to the knowledge base.',
      clientValue: 'The owner can onboard a property from the material they already have instead of rebuilding context manually.',
      decisionQuestion: 'Which existing files should become the property knowledge base?',
      nextAction: 'attach the handover pack, asset register, and operating documents.',
      tryLabel: 'Show file upload',
    },
  ],
  portfolio: [
    {
      id: 'health-actions',
      label: 'Health Actions',
      anchor: 'portfolio-health-actions',
      fallback: { left: 66, top: 8, width: 25, height: 10 },
      headline: 'Start with owner-level health signals',
      story: 'Health, risk, incidents, and next actions are visible at portfolio level before the team opens another report.',
      clientValue: 'Leadership gets a clean priority signal and can decide where management attention goes first.',
      decisionQuestion: 'Which asset needs attention first?',
      nextAction: 'select the property with the clearest control signal.',
      tryLabel: 'Show Portfolio Signal',
    },
    {
      id: 'portfolio-map',
      label: 'Portfolio Map',
      anchor: 'portfolio-command',
      fallback: { left: 5, top: 18, width: 56, height: 26 },
      headline: 'Explain the portfolio as one operating picture',
      story: 'Each property connects to project, vendor, evidence, field, and resident context without changing systems.',
      clientValue: 'The portfolio view stays executive-level while every asset remains connected to operational detail.',
      decisionQuestion: 'Where is the risk concentrated across the portfolio?',
      nextAction: 'use the map or portfolio list to open the relevant operating surface.',
      tryLabel: 'Show Portfolio Map',
    },
    {
      id: 'command-path',
      label: 'Command Path',
      anchor: 'portfolio-command-path',
      fallback: { left: 56, top: 31, width: 34, height: 22 },
      headline: 'Turn portfolio attention into a command path',
      story: 'A property signal can move directly into the control surface owned by the team that can resolve it.',
      clientValue: 'Owner concern becomes an accountable project, vendor, evidence, or field action.',
      decisionQuestion: 'Which command view should the client enter from this signal?',
      nextAction: 'open ProjectCommand for the selected asset.',
      tryLabel: 'Open Command Path',
    },
  ],
  projectcommand: [
    {
      id: 'project-context',
      label: 'Owner Decision',
      anchor: 'project-overview-command-strip',
      fallback: { left: 4, top: 8, width: 88, height: 34 },
      headline: 'Show the decision surface',
      story: 'The opening view ties health, float, EAC, confidence, and the latest signal into one owner decision surface.',
      clientValue: 'The board immediately sees why the project needs attention and what action path is available.',
      decisionQuestion: 'What changed, what is at risk, and what decision is required?',
      nextAction: 'Use the command surface to choose the right control lane.',
      tryLabel: 'Show Owner Decision',
    },
    {
      id: 'control-tabs',
      label: 'Control Lanes',
      anchor: 'project-overview-what-changed',
      fallback: { left: 5, top: 20, width: 52, height: 16 },
      headline: 'Keep the story connected',
      story: 'The same project signal can be reviewed through programme, cost, risk, and evidence without rebuilding context.',
      clientValue: 'Teams stay aligned because every detailed review starts from the same owner-level decision.',
      decisionQuestion: 'Which control lane explains the decision fastest?',
      nextAction: 'Open the lane that proves the decision.',
      tryLabel: 'Show Control Lanes',
    },
    {
      id: 'action-queue',
      label: 'Impact Chain',
      anchor: 'project-overview-impact-chain',
      fallback: { left: 63, top: 14, width: 32, height: 30 },
      headline: 'Make the consequence visible',
      story: 'The impact chain compares waiting against acting now, then ties the response to a named owner and due window.',
      clientValue: 'The review ends with an accountable path, not another open discussion.',
      decisionQuestion: 'What happens if leadership waits?',
      nextAction: 'Prepare the owner action or open the detailed control lane.',
      tryLabel: 'Show Impact Chain',
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
      anchor: 'project-stage-gate-loop',
      fallback: { left: 7, top: 31, width: 86, height: 26 },
      headline: 'Turn stage gates into owner actions',
      story: 'Gate Control Board shows the priority gate, readiness, evidence blocker, approver, and recovery path together.',
      clientValue: 'Stage readiness becomes visible and assignable, not buried inside checklist files.',
      decisionQuestion: 'Which gate blocks the next value milestone?',
      nextAction: 'Queue the owner recovery action for the priority gate.',
      tryLabel: 'Show Blocked Gate',
    },
    {
      id: 'evidence-gaps',
      label: 'Evidence Gaps',
      anchor: 'project-stage-evidence-gaps',
      fallback: { left: 36, top: 31, width: 30, height: 26 },
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
      anchor: 'project-stage-recovery-actions',
      fallback: { left: 66, top: 31, width: 27, height: 26 },
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
      anchor: 'project-cost-summary',
      fallback: { left: 6, top: 13, width: 86, height: 34 },
      headline: 'Convert cost exposure into a board choice',
      story: 'Show the commercial decision bridge: approve recovery, hold cash until proof arrives, or accept the cost and programme consequence.',
      clientValue: 'Owners see the decision that changes final cost, not just the number that moved.',
      decisionQuestion: 'Which commercial decision changes the final cost forecast?',
      nextAction: 'Select the preferred commercial path and inspect the supporting driver.',
      tryLabel: 'Show Cost Forecast',
    },
    {
      id: 'variations',
      label: 'Variations',
      anchor: 'project-cost-variations',
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
      anchor: 'project-cost-package-drivers',
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
      anchor: 'project-risk-register',
      fallback: { left: 64, top: 46, width: 28, height: 42 },
      headline: 'Make risk registers decision-ready',
      story: 'Show probability, impact, ownership, mitigation, and early warnings in one live register.',
      clientValue: 'Risk review moves from status scoring to accountable operating decisions.',
      decisionQuestion: 'Which open risk is now driving cost or programme exposure?',
      nextAction: 'Open the top risk and inspect its mitigation plan.',
      tryLabel: 'Show Risk Register',
    },
    {
      id: 'mitigation',
      label: 'Mitigation',
      anchor: 'project-risk-actions',
      fallback: { left: 7, top: 30, width: 58, height: 24 },
      headline: 'Convert risk into manager actions',
      story: 'The action queue turns each risk condition into owner, due date, trigger, impact, and cost logic.',
      clientValue: 'The client can challenge action quality, ownership, and timing from the same risk surface.',
      decisionQuestion: 'Which mitigation is ready to assign now?',
      nextAction: 'Prepare the action pack for the accountable owner.',
      tryLabel: 'Show Mitigation',
    },
    {
      id: 'risk-scenario',
      label: 'Scenario Impact',
      anchor: 'project-risk-scenario',
      fallback: { left: 7, top: 12, width: 86, height: 25 },
      headline: 'Simulate risk before it becomes delay',
      story: 'Trigger a facade delay, approval gap, contractor drift, or recovery decision and see cost, float, evidence, and confidence move together.',
      clientValue: 'Risk becomes a board-level choice between mitigation cost and unresolved exposure.',
      decisionQuestion: 'What changes if this risk is left open today?',
      nextAction: 'Run a scenario and compare the action cost with the exposure.',
      tryLabel: 'Show Scenario Impact',
    },
  ],
  forecast: [
    {
      id: 'scenarios',
      label: 'Scenarios',
      anchor: 'project-forecast-scenarios',
      fallback: { left: 7, top: 13, width: 56, height: 27 },
      headline: 'Show outcomes before they happen',
      story: 'Compare optimistic, base, and pessimistic outcomes from the same project signal, including final cost, date, and assumptions.',
      clientValue: 'Owners can compare the cost of action with the cost of waiting before month-end reports arrive.',
      decisionQuestion: 'What happens if current blockers are not resolved?',
      nextAction: 'Compare the scenarios and call out the decision that changes the curve.',
      tryLabel: 'Show Scenarios',
    },
    {
      id: 'confidence',
      label: 'Confidence',
      anchor: 'project-forecast-confidence',
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
      anchor: 'project-forecast-decisions',
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
      anchor: 'project-evidence-readiness',
      fallback: { left: 7, top: 19, width: 86, height: 18 },
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
      anchor: 'project-evidence-expired',
      fallback: { left: 7, top: 51, width: 56, height: 25 },
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
      anchor: 'project-evidence-pack-prep',
      fallback: { left: 7, top: 38, width: 86, height: 22 },
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

function queryToShowMode(_value?: string | null): DemoShowMode {
  return DEFAULT_SHOW_MODE;
}

function getShowModeOption(showMode: DemoShowMode) {
  return SHOW_MODE_OPTIONS.find(option => option.id === showMode) ?? SHOW_MODE_OPTIONS[0];
}

const CHAPTER_AUDIO_FILES: Record<string, string> = {
  portfolio: 'chapter-01-portfolio-control.mp3',
  propertysetup: 'chapter-02-property-onboarding.mp3',
  projectcommand: 'chapter-03-project-command.mp3',
  programme: 'chapter-04-programme.mp3',
  stagegates: 'chapter-05-stage-gates.mp3',
  cost: 'chapter-06-cost.mp3',
  risk: 'chapter-07-risk.mp3',
  forecast: 'chapter-08-forecast.mp3',
  obligations: 'chapter-09-obligations.mp3',
  evidence: 'chapter-10-evidence.mp3',
  vendoriq: 'chapter-11-vendoriq.mp3',
  fieldops: 'chapter-12-fieldops.mp3',
  resident: 'chapter-13-resident-experience.mp3',
  value: 'chapter-14-value-and-scale.mp3',
};

function getDemoAudioSrc(chapterId: string, _segmentId: string) {
  if (CHAPTER_AUDIO_FILES[chapterId]) {
    return `/audio/demo/4c360/${CHAPTER_AUDIO_FILES[chapterId]}`;
  }

  return `/demo-audio/properties/${chapterId}/${_segmentId}.mp3`;
}

function estimateNarrationDurationMs(script: string) {
  const words = script.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(9000, Math.round((words / 2.25) * 1000));
}

function formatDemoTimecode(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function spotlightBeat(
  anchor: string | undefined,
  fallback: FallbackHotspot,
  startPct: number,
  endPct: number,
  label?: string,
): DemoSpotlightBeat {
  return {
    anchor,
    fallback,
    startPct: Math.max(0, Math.min(100, startPct)),
    endPct: Math.max(0, Math.min(100, endPct)),
    label,
  };
}

function spotlightCue(atMs: number, anchor: string | undefined, fallback: FallbackHotspot, durationMs = 3600): DemoTimelineCue {
  return { atMs, type: 'spotlight', anchor, fallback, durationMs };
}

function scrollCue(atMs: number, anchor: string): DemoTimelineCue {
  return { atMs, type: 'scrollTo', anchor };
}

function slowScrollCue(atMs: number, anchor: string, durationMs = 3800): DemoTimelineCue {
  return { atMs, type: 'slowScrollTo', anchor, durationMs };
}

function pulseCue(atMs: number, anchor: string | undefined, fallback: FallbackHotspot, durationMs = 1400): DemoTimelineCue {
  return { atMs, type: 'pulse', anchor, fallback, durationMs };
}

function pinPulseCue(atMs: number, anchor: string | undefined, fallback: FallbackHotspot, durationMs = 1800): DemoTimelineCue {
  return { atMs, type: 'pinPulse', anchor, fallback, durationMs };
}

function flashCue(atMs: number, anchor: string | undefined, fallback: FallbackHotspot, durationMs = 1150): DemoTimelineCue {
  return { atMs, type: 'flash', anchor, fallback, durationMs };
}

function cuesFromBeats(beats: DemoSpotlightBeat[], estimatedDurationMs: number): DemoTimelineCue[] {
  return beats.flatMap(beat => {
    const atMs = Math.max(0, Math.round((beat.startPct / 100) * estimatedDurationMs));
    const endMs = Math.max(atMs + 1000, Math.round((beat.endPct / 100) * estimatedDurationMs));
    const cue = spotlightCue(atMs, beat.anchor, beat.fallback, endMs - atMs);
    return beat.anchor ? [scrollCue(Math.max(0, atMs - 180), beat.anchor), cue] : [cue];
  });
}

function scaleTimelineCue(cue: DemoTimelineCue, scale: number): DemoTimelineCue {
  const atMs = Math.round(cue.atMs * scale);
  if (cue.type === 'spotlight' || cue.type === 'pulse' || cue.type === 'pinPulse' || cue.type === 'flash') {
    return {
      ...cue,
      atMs,
      durationMs: cue.durationMs === undefined ? undefined : Math.round(cue.durationMs * scale),
    };
  }
  if (cue.type === 'slowScrollTo') {
    return {
      ...cue,
      atMs,
      durationMs: Math.round(cue.durationMs * scale),
    };
  }
  return { ...cue, atMs };
}

function getTimelineCues(chapterId: string, segmentId: string, estimatedDurationMs: number, beats: DemoSpotlightBeat[]): DemoTimelineCue[] {
  const key = `${chapterId}:${segmentId}`;
  const portfolioIntroFallback = { left: 3, top: 3, width: 94, height: 90 };
  const timelineMap: Record<string, DemoTimelineCue[]> = {
    'portfolio:intro': [
      scrollCue(0, 'portfolio-command'),
      slowScrollCue(15000, 'portfolio-command-path', 7200),
      pulseCue(23400, 'portfolio-command-path', { left: 6, top: 74, width: 12, height: 10 }, 1900),
      { atMs: PORTFOLIO_GIS_HANDOFF_MS, type: 'demoAction', actionId: 'open-property-command' },
      flashCue(29000, 'gis-critical-incidents-card', { left: 64, top: 20, width: 16, height: 14 }, 1150),
      flashCue(30300, 'gis-sla-alerts-card', { left: 82, top: 20, width: 16, height: 14 }, 1150),
      flashCue(31600, 'gis-compliance-card', { left: 64, top: 36, width: 16, height: 14 }, 1150),
      flashCue(32900, 'gis-active-engineers-card', { left: 82, top: 36, width: 16, height: 14 }, 1800),
      pinPulseCue(41000, 'gis-jlt-map-pin', { left: 8, top: 49, width: 8, height: 8 }, 2000),
      flashCue(48000, 'gis-jlt-map-pin', { left: 8, top: 49, width: 8, height: 8 }, 1500),
      pulseCue(PORTFOLIO_DISPATCH_SITE_TEAM_MS, 'gis-dispatch-site-team', { left: 61, top: 67, width: 27, height: 8 }, 1900),
      pulseCue(82400, 'ai-smart-dispatch-assign', { left: 75, top: 50, width: 16, height: 8 }, 1500),
      scrollCue(PORTFOLIO_PROPERTIES_RECAP_MS, 'portfolio-health-actions'),
      flashCue(84600, 'portfolio-kpi-workorders', { left: 34, top: 12, width: 16, height: 10 }, 1450),
      flashCue(86500, 'portfolio-impact-aed-risk', { left: 3, top: 28, width: 18, height: 10 }, 1450),
      flashCue(88400, 'portfolio-impact-admin-load-reducer', { left: 60, top: 28, width: 18, height: 10 }, 1450),
      flashCue(90300, 'portfolio-kpi-incidents', { left: 50, top: 12, width: 16, height: 10 }, 1450),
      flashCue(92200, 'portfolio-impact-technician-utilization', { left: 79, top: 28, width: 18, height: 10 }, 1450),
      flashCue(94100, 'portfolio-impact-workload-optimizer', { left: 22, top: 28, width: 18, height: 10 }, 1450),
      flashCue(96000, 'portfolio-kpi-sla', { left: 66, top: 12, width: 16, height: 10 }, 1700),
      slowScrollCue(PORTFOLIO_REPORT_SEQUENCE_MS, 'portfolio-report-action', 3000),
      { atMs: PORTFOLIO_REPORT_OPEN_MS, type: 'demoAction', actionId: 'open-property-report' },
      slowScrollCue(PORTFOLIO_REPORT_OPEN_MS + 1900, 'portfolio-report-bottom', 10500),
      scrollCue(116800, 'property-onboarding-entry'),
      { atMs: 123071, type: 'chapterPause' },
    ],
    'propertysetup:intro': [
      scrollCue(0, 'property-onboarding-entry'),
      spotlightCue(3000, 'property-onboarding-entry', { left: 10, top: 14, width: 80, height: 70 }, 9000),
      scrollCue(11800, 'property-onboarding-entry'),
      { atMs: 12400, type: 'demoAction', actionId: 'open-add-property-chooser' },
      flashCue(14500, 'property-onboarding-choice-wizard', { left: 10, top: 38, width: 38, height: 22 }, 1300),
      flashCue(16400, 'property-onboarding-choice-ai', { left: 52, top: 38, width: 38, height: 22 }, 1300),
      flashCue(18300, 'property-onboarding-choice-upload', { left: 10, top: 62, width: 38, height: 22 }, 1300),
      flashCue(20200, 'property-onboarding-choice-api', { left: 52, top: 62, width: 38, height: 22 }, 1500),
      { atMs: 22200, type: 'demoAction', actionId: 'open-add-property-wizard' },
      scrollCue(23600, 'property-wizard-business'),
      { atMs: 24500, type: 'demoAction', actionId: 'property-wizard-fill-name' },
      { atMs: 27000, type: 'demoAction', actionId: 'property-wizard-fill-sector' },
      { atMs: 29200, type: 'demoAction', actionId: 'property-wizard-fill-subtype' },
      scrollCue(31400, 'property-wizard-contact-fields'),
      { atMs: 32600, type: 'demoAction', actionId: 'property-wizard-fill-contact' },
      { atMs: 37200, type: 'demoAction', actionId: 'property-wizard-tab-sites' },
      scrollCue(37900, 'property-wizard-site-field'),
      { atMs: 39400, type: 'demoAction', actionId: 'property-wizard-fill-site' },
      { atMs: 42800, type: 'demoAction', actionId: 'property-wizard-ai-assets' },
      { atMs: 50000, type: 'demoAction', actionId: 'property-wizard-tab-team' },
      scrollCue(50800, 'property-wizard-team'),
      { atMs: 53200, type: 'demoAction', actionId: 'property-wizard-fill-team' },
      { atMs: 60200, type: 'demoAction', actionId: 'property-wizard-tab-knowledge' },
      scrollCue(61000, 'property-wizard-knowledge'),
      { atMs: 63500, type: 'demoAction', actionId: 'property-wizard-fill-knowledge' },
      { atMs: 70600, type: 'demoAction', actionId: 'property-wizard-tab-budget' },
      scrollCue(71400, 'property-wizard-budget'),
      { atMs: 74000, type: 'demoAction', actionId: 'property-wizard-fill-budget' },
      { atMs: 81200, type: 'demoAction', actionId: 'property-wizard-tab-inventory' },
      scrollCue(82000, 'property-wizard-inventory'),
      { atMs: 84600, type: 'demoAction', actionId: 'property-wizard-fill-inventory' },
      { atMs: 88400, type: 'demoAction', actionId: 'close-add-property-modal' },
      scrollCue(89800, 'projectcommand-context'),
      spotlightCue(90000, 'projectcommand-context', { left: 58, top: 68, width: 28, height: 12 }, 5000),
      { atMs: 95000, type: 'chapterPause' },
    ],
    'projectcommand:intro': [
      scrollCue(0, 'projectcommand-context'),
      scrollCue(2_800, 'projectcommand-property-dropdown'),
      scrollCue(5_400, 'projectcommand-project-dropdown'),
      scrollCue(8_800, 'project-overview-control-metrics'),
      slowScrollCue(10_000, 'project-overview-bottom', 43_000),
      scrollCue(53_000, 'projectcommand-tabs'),
      scrollCue(54_000, 'programme-control-tab'),
      scrollCue(59_000, 'stage-gates-control-tab'),
      scrollCue(65_000, 'cost-control-tab'),
      scrollCue(68_000, 'risk-control-tab'),
      scrollCue(74_000, 'obligations-control-tab'),
      scrollCue(80_000, 'evidence-control-tab'),
      scrollCue(96_000, 'forecast-control-tab'),
      slowScrollCue(96_400, 'project-forecast-bottom', 12_300),
      { atMs: 108_738, type: 'chapterPause' },
    ],
    'programme:intro': [
      scrollCue(0, 'programme-contractor-filter'),
      spotlightCue(3000, 'project-programme', { left: 8, top: 12, width: 84, height: 74 }, 9000),
      spotlightCue(12000, 'programme-critical-path', { left: 10, top: 20, width: 80, height: 22 }, 12000),
      spotlightCue(24000, 'programme-delayed-activities', { left: 12, top: 38, width: 76, height: 22 }, 10000),
      spotlightCue(34000, 'programme-contractor-accountability', { left: 14, top: 46, width: 72, height: 20 }, 10000),
      spotlightCue(44000, 'programme-recovery-window', { left: 16, top: 28, width: 68, height: 24 }, 10000),
      spotlightCue(54000, 'programme-handover-risk', { left: 12, top: 56, width: 76, height: 18 }, 10000),
      spotlightCue(64000, 'programme-recovery-action', { left: 58, top: 66, width: 28, height: 12 }, 10000),
      spotlightCue(74000, 'stage-gates-control-tab', { left: 58, top: 68, width: 28, height: 12 }, 6000),
      { atMs: 80000, type: 'chapterPause' },
    ],
    'stagegates:intro': [
      scrollCue(0, 'project-stage-gates'),
      spotlightCue(3000, 'project-stage-gates', { left: 8, top: 12, width: 84, height: 74 }, 9000),
      { atMs: 80000, type: 'chapterPause' },
    ],
    'cost:intro': [
      scrollCue(0, 'project-cost-summary'),
      spotlightCue(3000, 'project-cost-summary', { left: 8, top: 12, width: 84, height: 34 }, 9000),
      scrollCue(11800, 'project-cost-bridge'),
      spotlightCue(12000, 'project-cost-bridge', { left: 10, top: 18, width: 80, height: 18 }, 10000),
      scrollCue(21800, 'project-cost-variations'),
      spotlightCue(22000, 'project-cost-variations', { left: 14, top: 36, width: 72, height: 20 }, 10000),
      scrollCue(31800, 'project-cost-package-drivers'),
      spotlightCue(32000, 'project-cost-package-drivers', { left: 12, top: 44, width: 76, height: 20 }, 10000),
      scrollCue(41800, 'project-cost-bridge'),
      spotlightCue(42000, 'project-cost-bridge', { left: 10, top: 24, width: 80, height: 42 }, 12000),
      spotlightCue(54000, 'project-cost-bridge', { left: 16, top: 56, width: 68, height: 16 }, 10000),
      spotlightCue(64000, 'project-cost-bridge', { left: 18, top: 28, width: 64, height: 28 }, 10000),
      scrollCue(73800, 'projectcommand-tabs'),
      spotlightCue(74000, 'risk-control-tab', { left: 58, top: 68, width: 28, height: 12 }, 7000),
      { atMs: 85000, type: 'chapterPause' },
    ],
    'risk:intro': [
      scrollCue(0, 'project-risk'),
      spotlightCue(3000, 'project-risk', { left: 8, top: 12, width: 84, height: 74 }, 9000),
      scrollCue(11800, 'project-risk-register'),
      spotlightCue(12000, 'project-risk-register', { left: 10, top: 20, width: 80, height: 24 }, 10000),
      scrollCue(21800, 'project-risk-metrics'),
      spotlightCue(22000, 'project-risk-metrics', { left: 12, top: 34, width: 76, height: 20 }, 10000),
      scrollCue(31800, 'project-risk-actions'),
      spotlightCue(32000, 'project-risk-actions', { left: 14, top: 46, width: 72, height: 20 }, 10000),
      scrollCue(41800, 'project-risk-board-decision'),
      spotlightCue(42000, 'project-risk-board-decision', { left: 12, top: 26, width: 76, height: 36 }, 12000),
      scrollCue(53800, 'project-risk-scenario'),
      spotlightCue(54000, 'project-risk-scenario', { left: 10, top: 38, width: 80, height: 26 }, 10000),
      scrollCue(63800, 'project-risk'),
      spotlightCue(64000, 'project-risk', { left: 12, top: 18, width: 76, height: 56 }, 10000),
      scrollCue(73800, 'projectcommand-tabs'),
      spotlightCue(74000, 'forecast-control-tab', { left: 58, top: 68, width: 28, height: 12 }, 7000),
      { atMs: 85000, type: 'chapterPause' },
    ],
    'forecast:intro': [
      scrollCue(0, 'project-forecast'),
      spotlightCue(3000, 'project-forecast', { left: 8, top: 12, width: 84, height: 74 }, 9000),
      scrollCue(11800, 'project-forecast-scenarios'),
      spotlightCue(12000, 'project-forecast-scenarios', { left: 10, top: 18, width: 80, height: 18 }, 10000),
      spotlightCue(22000, 'project-forecast-scenarios', { left: 10, top: 30, width: 80, height: 28 }, 12000),
      spotlightCue(34000, 'project-forecast-scenarios', { left: 12, top: 44, width: 76, height: 20 }, 10000),
      scrollCue(43800, 'project-forecast-confidence'),
      spotlightCue(44000, 'project-forecast-confidence', { left: 14, top: 22, width: 72, height: 22 }, 10000),
      scrollCue(53800, 'project-forecast-decisions'),
      spotlightCue(54000, 'project-forecast-decisions', { left: 16, top: 56, width: 68, height: 18 }, 10000),
      spotlightCue(64000, 'project-forecast-decisions', { left: 12, top: 24, width: 76, height: 44 }, 10000),
      scrollCue(73800, 'projectcommand-tabs'),
      spotlightCue(74000, 'obligations-control-tab', { left: 58, top: 68, width: 28, height: 12 }, 7000),
      { atMs: 85000, type: 'chapterPause' },
    ],
    'obligations:intro': [
      scrollCue(0, 'project-obligations'),
      spotlightCue(3000, 'project-obligations', { left: 8, top: 12, width: 84, height: 74 }, 9000),
      spotlightCue(12000, 'project-obligations', { left: 10, top: 20, width: 80, height: 24 }, 10000),
      spotlightCue(22000, 'obligation-due-overdue-upcoming', { left: 12, top: 30, width: 76, height: 22 }, 10000),
      spotlightCue(32000, 'obligation-owner-accountability', { left: 14, top: 44, width: 72, height: 20 }, 10000),
      spotlightCue(42000, 'obligation-evidence-requirements', { left: 12, top: 52, width: 76, height: 18 }, 10000),
      spotlightCue(52000, 'obligations-linked-to-delivery', { left: 10, top: 24, width: 80, height: 42 }, 10000),
      spotlightCue(62000, 'obligation-consequence-priority', { left: 12, top: 18, width: 76, height: 56 }, 10000),
      scrollCue(71800, 'projectcommand-tabs'),
      spotlightCue(72000, 'evidence-control-tab', { left: 58, top: 68, width: 28, height: 12 }, 6000),
      { atMs: 80000, type: 'chapterPause' },
    ],
    'evidence:intro': [
      scrollCue(0, 'project-evidence'),
      spotlightCue(3000, 'project-evidence', { left: 8, top: 12, width: 84, height: 74 }, 9000),
      scrollCue(11800, 'project-evidence-readiness'),
      spotlightCue(12000, 'project-evidence-readiness', { left: 10, top: 18, width: 80, height: 18 }, 10000),
      spotlightCue(22000, 'project-evidence-readiness', { left: 12, top: 30, width: 76, height: 22 }, 10000),
      scrollCue(31800, 'project-evidence-expired'),
      spotlightCue(32000, 'project-evidence-expired', { left: 14, top: 42, width: 72, height: 22 }, 10000),
      spotlightCue(42000, 'project-evidence-expired', { left: 12, top: 50, width: 76, height: 20 }, 10000),
      scrollCue(51800, 'project-evidence-pack-prep'),
      spotlightCue(52000, 'project-evidence-pack-prep', { left: 10, top: 28, width: 80, height: 34 }, 10000),
      spotlightCue(62000, 'project-evidence-pack-prep', { left: 14, top: 22, width: 72, height: 38 }, 10000),
      scrollCue(71800, 'projectcommand-tabs'),
      spotlightCue(72000, 'vendoriq-module-entry', { left: 58, top: 68, width: 28, height: 12 }, 8000),
      { atMs: 85000, type: 'chapterPause' },
    ],
    'vendoriq:intro': [
      scrollCue(0, 'vendoriq-command'),
      spotlightCue(3000, 'vendoriq-command', { left: 8, top: 12, width: 84, height: 74 }, 9000),
      spotlightCue(12000, 'vendor-performance-scorecard', { left: 10, top: 18, width: 80, height: 22 }, 10000),
      spotlightCue(22000, 'vendor-sla-quality-evidence', { left: 12, top: 30, width: 76, height: 24 }, 10000),
      spotlightCue(32000, 'vendor-risk-repeat-issues', { left: 14, top: 44, width: 72, height: 22 }, 10000),
      spotlightCue(42000, 'vendor-comparison-context', { left: 10, top: 24, width: 80, height: 38 }, 10000),
      spotlightCue(52000, 'vendor-project-impact-link', { left: 12, top: 40, width: 76, height: 24 }, 10000),
      spotlightCue(62000, 'vendor-corrective-action-pack', { left: 14, top: 54, width: 72, height: 18 }, 10000),
      spotlightCue(72000, 'fieldops-module-entry', { left: 58, top: 68, width: 28, height: 12 }, 8000),
      { atMs: 85000, type: 'chapterPause' },
    ],
    'fieldops:intro': [
      scrollCue(0, 'fieldops-command'),
      spotlightCue(3000, 'fieldops-command', { left: 8, top: 12, width: 84, height: 74 }, 9000),
      scrollCue(11800, 'fieldops-kpis'),
      spotlightCue(12000, 'fieldops-kpis', { left: 10, top: 20, width: 80, height: 24 }, 10000),
      spotlightCue(22000, 'fieldops-surveys-inspections', { left: 12, top: 32, width: 76, height: 22 }, 10000),
      spotlightCue(32000, 'fieldops-issue-capture', { left: 14, top: 44, width: 72, height: 22 }, 10000),
      spotlightCue(42000, 'fieldops-evidence-capture', { left: 12, top: 52, width: 76, height: 18 }, 10000),
      spotlightCue(52000, 'fieldops-command-link', { left: 10, top: 26, width: 80, height: 38 }, 10000),
      spotlightCue(62000, 'fieldops-progress-status-update', { left: 14, top: 54, width: 72, height: 18 }, 10000),
      spotlightCue(72000, 'resident-module-entry', { left: 58, top: 68, width: 28, height: 12 }, 8000),
      { atMs: 85000, type: 'chapterPause' },
    ],
    'resident:intro': [
      scrollCue(0, 'resident-experience'),
      spotlightCue(3000, 'resident-experience', { left: 8, top: 12, width: 84, height: 74 }, 9000),
      scrollCue(11800, 'resident-report-options'),
      spotlightCue(12000, 'resident-report-options', { left: 10, top: 20, width: 80, height: 22 }, 10000),
      spotlightCue(22000, 'resident-report-options', { left: 12, top: 32, width: 76, height: 22 }, 10000),
      scrollCue(31800, 'resident-service-sla'),
      spotlightCue(32000, 'resident-service-sla', { left: 14, top: 44, width: 72, height: 20 }, 10000),
      scrollCue(41800, 'resident-action-links'),
      spotlightCue(42000, 'resident-action-links', { left: 12, top: 52, width: 76, height: 18 }, 10000),
      spotlightCue(52000, 'resident-service-sla', { left: 10, top: 24, width: 80, height: 40 }, 10000),
      spotlightCue(62000, 'resident-action-links', { left: 14, top: 54, width: 72, height: 18 }, 10000),
      spotlightCue(72000, 'value-module-entry', { left: 58, top: 68, width: 28, height: 12 }, 6000),
      { atMs: 80000, type: 'chapterPause' },
    ],
    'value:intro': [
      scrollCue(0, 'demo-value-recap'),
      spotlightCue(3000, 'value-overview', { left: 8, top: 12, width: 84, height: 74 }, 11000),
      scrollCue(14800, 'connected-operating-journey'),
      spotlightCue(15000, 'connected-operating-journey', { left: 10, top: 18, width: 80, height: 26 }, 9000),
      scrollCue(25800, 'leadership-team-accountability'),
      spotlightCue(26000, 'leadership-team-accountability', { left: 12, top: 32, width: 76, height: 22 }, 10000),
      scrollCue(37800, 'pilot-success-metrics'),
      spotlightCue(38000, 'pilot-success-metrics', { left: 12, top: 54, width: 76, height: 18 }, 12000),
      scrollCue(51800, 'ai-operating-system-summary'),
      spotlightCue(52000, 'ai-operating-system-summary', { left: 12, top: 20, width: 76, height: 46 }, 10000),
      scrollCue(62800, 'pilot-rollout-strategy'),
      spotlightCue(63000, 'pilot-rollout-strategy', { left: 14, top: 44, width: 72, height: 22 }, 9000),
      scrollCue(72800, 'portfolio-scale-expansion'),
      spotlightCue(73000, 'portfolio-scale-expansion', { left: 10, top: 24, width: 80, height: 40 }, 7000),
      scrollCue(81800, 'walkthrough-complete'),
      spotlightCue(82000, 'walkthrough-complete', { left: 24, top: 28, width: 52, height: 24 }, 6000),
      { atMs: 85000, type: 'chapterPause' },
    ],
    'portfolio:health-actions': [
      scrollCue(0, 'portfolio-health-actions'),
      spotlightCue(600, 'portfolio-health-actions', { left: 4, top: 7, width: 92, height: 15 }, 4200),
      spotlightCue(5200, 'portfolio-kpi-cards', { left: 4, top: 16, width: 92, height: 17 }, 5200),
      spotlightCue(10800, 'portfolio-impact-cards', { left: 4, top: 34, width: 92, height: 14 }, 5200),
    ],
    'portfolio:portfolio-map': [
      scrollCue(0, 'portfolio-command'),
      spotlightCue(500, 'portfolio-command', portfolioIntroFallback, 3800),
      spotlightCue(4700, 'portfolio-pulse-feed', { left: 72, top: 5, width: 10, height: 8 }, 4400),
      spotlightCue(9400, 'portfolio-property-grid', { left: 4, top: 58, width: 92, height: 34 }, 5600),
    ],
    'portfolio:command-path': [
      scrollCue(0, 'portfolio-property-grid'),
      spotlightCue(500, 'portfolio-primary-card', { left: 4, top: 58, width: 44, height: 34 }, 4200),
      spotlightCue(5200, 'portfolio-command-path', { left: 6, top: 74, width: 38, height: 12 }, 3600),
      spotlightCue(9300, 'portfolio-command-path', { left: 6, top: 74, width: 38, height: 12 }, 4200),
    ],
    'propertysetup:wizard': [
      scrollCue(0, 'property-onboarding-entry'),
      spotlightCue(500, 'property-onboarding-entry', { left: 76, top: 5, width: 18, height: 8 }, 3800),
    ],
    'propertysetup:ai': [
      scrollCue(0, 'property-onboarding-entry'),
      spotlightCue(500, 'property-onboarding-entry', { left: 76, top: 5, width: 18, height: 8 }, 3600),
    ],
    'propertysetup:upload': [
      scrollCue(0, 'property-onboarding-entry'),
      spotlightCue(500, 'property-onboarding-entry', { left: 76, top: 5, width: 18, height: 8 }, 3600),
    ],
  };

  const explicitCues = timelineMap[key] ?? cuesFromBeats(beats, estimatedDurationMs);
  if (key === 'portfolio:intro' || key === 'propertysetup:intro' || key === 'projectcommand:intro' || key === 'programme:intro' || key === 'stagegates:intro' || key === 'cost:intro' || key === 'risk:intro' || key === 'forecast:intro' || key === 'obligations:intro' || key === 'evidence:intro' || key === 'vendoriq:intro' || key === 'fieldops:intro' || key === 'resident:intro' || key === 'value:intro') {
    const designDuration = TIMELINE_DESIGN_DURATIONS_MS[key] ?? estimatedDurationMs;
    const scale = designDuration > 0 ? estimatedDurationMs / designDuration : 1;
    return explicitCues.map(cue => scaleTimelineCue(cue, scale)).sort((a, b) => a.atMs - b.atMs);
  }
  return [
    ...explicitCues,
    { atMs: Math.max(0, estimatedDurationMs - 250), type: 'chapterPause' as const },
  ].sort((a, b) => a.atMs - b.atMs);
}

function makeNarrationScript(
  chapterId: string,
  segmentId: string,
  audio: string,
  presenterNote: string,
  beats: DemoSpotlightBeat[] = [],
  requiresChapterConfirmation = false,
): DemoNarrationScript {
  const estimatedDurationMs = NARRATION_DURATION_OVERRIDES_MS[`${chapterId}:${segmentId}`] ?? estimateNarrationDurationMs(audio);
  return {
    caption: audio,
    audio,
    presenterNote,
    audioSrc: getDemoAudioSrc(chapterId, segmentId),
    estimatedDurationMs,
    beats,
    timelineCues: getTimelineCues(chapterId, segmentId, estimatedDurationMs, beats),
    requiresChapterConfirmation,
  };
}

function buildEvenSpotlightBeats(frames: DemoFrame[], fallback: FallbackHotspot) {
  if (frames.length === 0) return [spotlightBeat(undefined, fallback, 0, 100)];
  const span = 100 / frames.length;
  return frames.map((frame, index) => spotlightBeat(
    frame.anchor,
    frame.fallback ?? fallback,
    index * span,
    index === frames.length - 1 ? 100 : (index + 1) * span,
    frame.label,
  ));
}

function getChapterIntroBeats(chapter: DemoChapter, frames: DemoFrame[]) {
  if (chapter.id === 'portfolio') {
    return [
      spotlightBeat('portfolio-health-actions', { left: 58, top: 8, width: 32, height: 9 }, 0, 34, 'Health signals'),
      spotlightBeat('portfolio-command', chapter.fallback, 34, 68, 'Portfolio command'),
      spotlightBeat('portfolio-command-path', { left: 6, top: 69, width: 38, height: 13 }, 68, 100, 'Command path'),
    ];
  }
  return buildEvenSpotlightBeats(frames, chapter.fallback);
}

function getSectionSpotlightBeats(chapter: DemoChapter, frame: EnrichedDemoFrame) {
  const key = `${chapter.id}:${frame.id}`;
  const beatMap: Record<string, DemoSpotlightBeat[]> = {
    'portfolio:health-actions': [
      spotlightBeat('portfolio-health-actions', { left: 58, top: 8, width: 32, height: 9 }, 0, 24, 'Health actions'),
      spotlightBeat('portfolio-kpi-cards', { left: 4, top: 16, width: 92, height: 17 }, 24, 62, 'Portfolio KPIs'),
      spotlightBeat('portfolio-impact-cards', { left: 4, top: 34, width: 92, height: 14 }, 62, 100, 'Impact cards'),
    ],
    'portfolio:portfolio-map': [
      spotlightBeat('portfolio-command', { left: 3, top: 3, width: 94, height: 90 }, 0, 28, 'Portfolio command'),
      spotlightBeat('portfolio-pulse-feed', { left: 4, top: 47, width: 92, height: 15 }, 28, 68, 'Portfolio pulse'),
      spotlightBeat('portfolio-primary-card', { left: 4, top: 62, width: 44, height: 28 }, 68, 100, 'Property card'),
    ],
    'portfolio:command-path': [
      spotlightBeat('portfolio-primary-card', { left: 4, top: 62, width: 44, height: 28 }, 0, 36, 'Property card'),
      spotlightBeat('portfolio-command-path', { left: 6, top: 69, width: 38, height: 13 }, 36, 78, 'Command action'),
      spotlightBeat('projectcommand-context', { left: 4, top: 8, width: 39, height: 13 }, 78, 100, 'ProjectCommand route'),
    ],
  };

  return beatMap[key] ?? [
    spotlightBeat(frame.anchor ?? chapter.anchor, frame.fallback ?? chapter.fallback, 0, 100, frame.label),
  ];
}

function buildChapterIntroScript(chapter: DemoChapter) {
  if (chapter.id === 'portfolio') {
    return makeNarrationScript(
      chapter.id,
      'intro',
      PORTFOLIO_CHAPTER_ONE_SCRIPT,
      'Play the full Chapter 1 portfolio-control narration and let the timeline drive the portfolio spotlights.',
      getChapterIntroBeats(chapter, getChapterFrames(chapter)),
      true,
    );
  }

  if (chapter.id === 'propertysetup') {
    return makeNarrationScript(
      chapter.id,
      'intro',
      PROPERTYSETUP_CHAPTER_TWO_SCRIPT,
      'Play the full Chapter 2 onboarding narration and let the timeline drive the property setup spotlights.',
      getChapterIntroBeats(chapter, getChapterFrames(chapter)),
      true,
    );
  }

  if (chapter.id === 'projectcommand') {
    return makeNarrationScript(
      chapter.id,
      'intro',
      PROJECTCOMMAND_CHAPTER_THREE_SCRIPT,
      'Play the full Chapter 3 ProjectCommand narration and let the timeline drive the executive control spotlights.',
      getChapterIntroBeats(chapter, getChapterFrames(chapter)),
      true,
    );
  }

  if (chapter.id === 'programme') {
    return makeNarrationScript(
      chapter.id,
      'intro',
      PROGRAMME_CHAPTER_FOUR_SCRIPT,
      'Play the full Chapter 4 programme narration and let the timeline drive the schedule recovery spotlights.',
      getChapterIntroBeats(chapter, getChapterFrames(chapter)),
      true,
    );
  }

  if (chapter.id === 'stagegates') {
    return makeNarrationScript(
      chapter.id,
      'intro',
      STAGEGATES_CHAPTER_FIVE_SCRIPT,
      'Play the full Chapter 5 stage-gates narration and let the timeline drive the readiness and evidence spotlights.',
      getChapterIntroBeats(chapter, getChapterFrames(chapter)),
      true,
    );
  }

  if (chapter.id === 'cost') {
    return makeNarrationScript(
      chapter.id,
      'intro',
      COST_CHAPTER_SIX_SCRIPT,
      'Play the full Chapter 6 cost narration and let the timeline drive the commercial exposure spotlights.',
      getChapterIntroBeats(chapter, getChapterFrames(chapter)),
      true,
    );
  }

  if (chapter.id === 'risk') {
    return makeNarrationScript(
      chapter.id,
      'intro',
      RISK_CHAPTER_SEVEN_SCRIPT,
      'Play the full Chapter 7 risk narration and let the timeline drive the risk register and mitigation spotlights.',
      getChapterIntroBeats(chapter, getChapterFrames(chapter)),
      true,
    );
  }

  if (chapter.id === 'forecast') {
    return makeNarrationScript(
      chapter.id,
      'intro',
      FORECAST_CHAPTER_EIGHT_SCRIPT,
      'Play the full Chapter 8 forecast narration and let the timeline drive the scenario and decision spotlights.',
      getChapterIntroBeats(chapter, getChapterFrames(chapter)),
      true,
    );
  }

  if (chapter.id === 'obligations') {
    return makeNarrationScript(
      chapter.id,
      'intro',
      OBLIGATIONS_CHAPTER_NINE_SCRIPT,
      'Play the full Chapter 9 obligations narration and let the timeline drive the governance and proof spotlights.',
      getChapterIntroBeats(chapter, getChapterFrames(chapter)),
      true,
    );
  }

  if (chapter.id === 'evidence') {
    return makeNarrationScript(
      chapter.id,
      'intro',
      EVIDENCE_CHAPTER_TEN_SCRIPT,
      'Play the full Chapter 10 evidence narration and let the timeline drive the readiness proof spotlights.',
      getChapterIntroBeats(chapter, getChapterFrames(chapter)),
      true,
    );
  }

  if (chapter.id === 'vendoriq') {
    return makeNarrationScript(
      chapter.id,
      'intro',
      VENDORIQ_CHAPTER_ELEVEN_SCRIPT,
      'Play the full Chapter 11 VendorIQ narration and let the timeline drive the vendor performance and corrective action spotlights.',
      getChapterIntroBeats(chapter, getChapterFrames(chapter)),
      true,
    );
  }

  if (chapter.id === 'fieldops') {
    return makeNarrationScript(
      chapter.id,
      'intro',
      FIELDOPS_CHAPTER_TWELVE_SCRIPT,
      'Play the full Chapter 12 FieldOps narration and let the timeline drive the site execution and evidence capture spotlights.',
      getChapterIntroBeats(chapter, getChapterFrames(chapter)),
      true,
    );
  }

  if (chapter.id === 'resident') {
    return makeNarrationScript(
      chapter.id,
      'intro',
      RESIDENT_CHAPTER_THIRTEEN_SCRIPT,
      'Play the full Chapter 13 resident experience narration and let the timeline drive the service intake and follow-through spotlights.',
      getChapterIntroBeats(chapter, getChapterFrames(chapter)),
      true,
    );
  }

  if (chapter.id === 'value') {
    return makeNarrationScript(
      chapter.id,
      'intro',
      VALUE_CHAPTER_FOURTEEN_SCRIPT,
      'Play the full Chapter 14 value narration and let the timeline drive the operating model, pilot, and completion spotlights.',
      getChapterIntroBeats(chapter, getChapterFrames(chapter)),
      true,
    );
  }

  const frames = getChapterFrames(chapter);
  const sectionList = frames.map(frame => frame.label).join(', ');
  const opener = CHAPTER_NARRATION_OPENERS[chapter.id] ?? chapter.story;
  const audio = `${opener} In this chapter, focus on ${sectionList}. By the end of the chapter, your team should be able to answer this board question: ${chapter.decisionQuestion}`;
  return makeNarrationScript(
    chapter.id,
    'intro',
    audio,
    `Open ${chapter.label} by framing the owner question before pointing to individual sections.`,
    getChapterIntroBeats(chapter, frames),
  );
}

function normalizeActionPhrase(action: string) {
  const trimmed = action.trim();
  if (!trimmed) return 'move to the next operating action';
  return trimmed.charAt(0).toLowerCase() + trimmed.slice(1).replace(/\.$/, '');
}

function buildSectionScript(chapter: DemoChapter, frame: EnrichedDemoFrame, baseScript: DemoNarration) {
  const baseCaption = baseScript.caption.trim();
  const featureCue = `The highlighted area is ${frame.label}. It shows ${frame.story.charAt(0).toLowerCase()}${frame.story.slice(1).replace(/\.$/, '')}.`;
  const valueCue = `${frame.clientValue}`;
  const decisionCue = `The decision for your team is clear: ${frame.decisionQuestion}`;
  const actionCue = `From here, your team can ${normalizeActionPhrase(frame.nextAction)}.`;
  const audio = [baseCaption, featureCue, valueCue, decisionCue, actionCue].join(' ');
  return makeNarrationScript(chapter.id, frame.id, audio, baseScript.presenterNote, getSectionSpotlightBeats(chapter, frame));
}

function buildChapterClosingPrompt(chapter: DemoChapter) {
  const nextChapter = DEMO_CHAPTERS[(DEMO_CHAPTERS.findIndex(item => item.id === chapter.id) + 1) % DEMO_CHAPTERS.length];
  const frames = getChapterFrames(chapter);
  const sectionList = frames.map(frame => frame.label).join(', ');
  const audio = chapter.id === 'value'
    ? `That closes the 4C360 board walkthrough. You have seen ${sectionList}, and the pilot question is now ready for discussion: ${chapter.decisionQuestion} You can ask a question, replay the value chapter, or replay the full walkthrough.`
    : `That closes ${chapter.label}. You have seen ${sectionList}, and the key question is now ready for discussion: ${chapter.decisionQuestion} Would you like to ask a question about this chapter, replay it, or move to ${nextChapter.label}?`;
  return makeNarrationScript(
    chapter.id,
    'closing',
    audio,
    `Stop at the end of ${chapter.label} and wait for the viewer to choose the next step.`,
    [spotlightBeat(chapter.anchor, chapter.fallback, 0, 100, chapter.label)],
    true,
  );
}

function getSectionNarrationScript(section: DemoSection): DemoNarrationScript {
  return section.sectionScript;
}

function getActiveNarrationScript(section: DemoSection, phase: DemoNarrationPhase) {
  if (phase === 'intro') return section.chapterIntroScript;
  if (phase === 'closing' || phase === 'chapterEnd') return section.chapterClosingPrompt;
  return section.sectionScript;
}

function getActiveTimelineSpotlight(script: DemoNarrationScript, elapsedMs: number): HotspotTarget | null {
  const boundedElapsed = Math.max(0, elapsedMs);
  const activeCue = script.timelineCues.find(cue => (
    cue.type === 'spotlight'
    && boundedElapsed >= cue.atMs
    && boundedElapsed < cue.atMs + (cue.durationMs ?? 3600)
  ));

  if (!activeCue || activeCue.type !== 'spotlight') return null;
  return {
    anchor: activeCue.anchor,
    fallback: activeCue.fallback,
  };
}

function getDemoActionAnchor(actionId: string): HotspotTarget | null {
  const actionAnchors: Record<string, HotspotTarget> = {
    'open-property-command': {
      anchor: 'portfolio-command-path',
      fallback: { left: 6, top: 74, width: 38, height: 12 },
    },
    'open-property-report': {
      anchor: 'portfolio-report-action',
      fallback: { left: 30, top: 76, width: 12, height: 8 },
    },
    'open-add-property-chooser': {
      anchor: 'property-onboarding-entry',
      fallback: { left: 82, top: 16, width: 14, height: 8 },
    },
    'show-portfolio-pulse': {
      anchor: 'portfolio-pulse-feed',
      fallback: { left: 72, top: 5, width: 10, height: 8 },
    },
    'open-add-property-wizard': {
      anchor: 'property-onboarding-choice-wizard',
      fallback: { left: 10, top: 38, width: 38, height: 22 },
    },
    'open-ai-onboarding': {
      anchor: 'property-onboarding-entry',
      fallback: { left: 76, top: 5, width: 18, height: 8 },
    },
    'open-upload-panel': {
      anchor: 'property-onboarding-entry',
      fallback: { left: 76, top: 5, width: 18, height: 8 },
    },
    'property-wizard-fill-name': {
      anchor: 'property-wizard-name-field',
      fallback: { left: 25, top: 30, width: 50, height: 10 },
    },
    'property-wizard-fill-sector': {
      anchor: 'property-wizard-sector-field',
      fallback: { left: 25, top: 40, width: 24, height: 10 },
    },
    'property-wizard-fill-subtype': {
      anchor: 'property-wizard-subtype-field',
      fallback: { left: 51, top: 40, width: 24, height: 10 },
    },
    'property-wizard-fill-contact': {
      anchor: 'property-wizard-contact-fields',
      fallback: { left: 24, top: 58, width: 52, height: 24 },
    },
    'property-wizard-tab-sites': {
      anchor: 'property-wizard-tab-sites',
      fallback: { left: 34, top: 15, width: 12, height: 8 },
    },
    'property-wizard-fill-site': {
      anchor: 'property-wizard-site-field',
      fallback: { left: 20, top: 30, width: 60, height: 18 },
    },
    'property-wizard-ai-assets': {
      anchor: 'property-onboarding-ai',
      fallback: { left: 18, top: 42, width: 64, height: 14 },
    },
    'property-wizard-tab-team': {
      anchor: 'property-wizard-tab-team',
      fallback: { left: 45, top: 15, width: 12, height: 8 },
    },
    'property-wizard-fill-team': {
      anchor: 'property-wizard-team',
      fallback: { left: 16, top: 25, width: 68, height: 44 },
    },
    'property-wizard-tab-knowledge': {
      anchor: 'property-wizard-tab-knowledge',
      fallback: { left: 56, top: 15, width: 12, height: 8 },
    },
    'property-wizard-fill-knowledge': {
      anchor: 'property-wizard-knowledge',
      fallback: { left: 16, top: 25, width: 68, height: 44 },
    },
    'property-wizard-tab-budget': {
      anchor: 'property-wizard-tab-budget',
      fallback: { left: 68, top: 15, width: 12, height: 8 },
    },
    'property-wizard-fill-budget': {
      anchor: 'property-wizard-budget',
      fallback: { left: 16, top: 25, width: 68, height: 44 },
    },
    'property-wizard-tab-inventory': {
      anchor: 'property-wizard-tab-inventory',
      fallback: { left: 78, top: 15, width: 12, height: 8 },
    },
    'property-wizard-fill-inventory': {
      anchor: 'property-wizard-inventory',
      fallback: { left: 16, top: 25, width: 68, height: 44 },
    },
  };

  return actionAnchors[actionId] ?? null;
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
  if (chapterId === 'portfolio' && frameId === 'command-path') return { type: 'demoAction', action: 'open-property-command' };
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
  const boardNarrative = [
    frame.headline,
    frame.story,
  ].join(' ');
  const sectionScript = buildSectionScript(chapter, frame, script);
  const chapterIntroScript = buildChapterIntroScript(chapter);
  const chapterClosingPrompt = buildChapterClosingPrompt(chapter);

  return {
    ...frame,
    sectionId: frame.id,
    legacyFrameId: frame.id,
    title: frame.label,
    boardNarrative,
    clientProof: frame.decisionQuestion,
    durationByMode: {
      board: 9000 + (frameIndex % 2) * 750,
    },
    metricImpact: {
      ...frame.outcome,
      decisionsSurfaced: 1,
    },
    narration: {
      caption: sectionScript.caption,
      presenterNote: script.presenterNote,
    },
    chapterIntroScript,
    sectionScript,
    chapterClosingPrompt,
    audioSrc: sectionScript.audioSrc,
    estimatedDurationMs: sectionScript.estimatedDurationMs,
    requiresChapterConfirmation: frameIndex === getChapterFrames(chapter).length - 1,
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

function loadStoredDemoAgentId() {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(DEMO_AGENT_STORAGE_KEY)?.trim() ?? '';
  } catch {
    return '';
  }
}

function saveStoredDemoAgentId(agentId: string) {
  try {
    window.localStorage.setItem(DEMO_AGENT_STORAGE_KEY, agentId);
    return true;
  } catch {
    return false;
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
  options: { showMode?: DemoShowMode; autoplay?: boolean; phase?: 'intro' | 'section' } = {},
) {
  const currentUrl = new URL(window.location.href);
  const url = new URL('/demo/properties', window.location.origin);
  url.searchParams.set('chapter', chapterId);
  url.searchParams.set('section', frameId ?? resolveFrameId(getChapterById(chapterId)));
  url.searchParams.set('duration', showModeToQuery(options.showMode ?? queryToShowMode(currentUrl.searchParams.get('duration'))));
  url.searchParams.set('mode', 'board');
  if (options.autoplay) {
    url.searchParams.set('autoplay', 'true');
  }
  if (options.phase) {
    url.searchParams.set('phase', options.phase);
  }
  if (currentUrl.searchParams.get('voiceSetup') === 'true') url.searchParams.set('voiceSetup', 'true');
  window.history.replaceState({}, '', `${url.pathname}?${url.searchParams.toString()}${url.hash}`);
}

function useAnchorBox(stageRef: RefObject<HTMLDivElement | null>, target: HotspotTarget) {
  const [box, setBox] = useState<AnchorBox | null>(null);

  useLayoutEffect(() => {
    let frame = 0;
    const stage = stageRef.current;
    if (!stage) return undefined;
    setBox(null);

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
        const isOversizedAnchor = rect.width > rootRect.width * 0.86 && rect.height > rootRect.height * 0.58;
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

function StageSpotlight({ box, fallback, variant = 'standard' }: { box: AnchorBox | null; fallback: FallbackHotspot; variant?: 'standard' | 'frame' }) {
  const fallbackStyle: CSSProperties = { left: `${fallback.left}%`, top: `${fallback.top}%`, width: `${fallback.width}%`, height: `${fallback.height}%` };
  const inset = variant === 'frame' ? 58 : 14;
  const target = box
    ? {
        left: Math.max(14, box.left - inset),
        top: Math.max(14, box.top - inset),
        width: Math.min(box.stageWidth - Math.max(14, box.left - inset) - 14, box.width + inset * 2),
        height: Math.min(box.stageHeight - Math.max(14, box.top - inset) - 14, box.height + inset * 2),
        stageWidth: box.stageWidth,
        stageHeight: box.stageHeight,
      }
    : null;

  const targetStyle: CSSProperties = target
    ? {
        left: target.left,
        top: target.top,
        width: target.width,
        height: target.height,
        transition: 'left 760ms cubic-bezier(0.22, 1, 0.36, 1), top 760ms cubic-bezier(0.22, 1, 0.36, 1), width 760ms cubic-bezier(0.22, 1, 0.36, 1), height 760ms cubic-bezier(0.22, 1, 0.36, 1)',
      }
    : fallbackStyle;

  if (variant === 'frame') {
    return (
      <div
        aria-hidden="true"
        data-demo-frame-spotlight="true"
        className="pointer-events-none absolute z-40 rounded-[26px] border border-cyan-100/85 bg-cyan-200/[0.018] shadow-[0_0_0_9999px_rgba(1,8,20,0.76),0_0_58px_rgba(34,211,238,0.44),0_0_150px_rgba(46,127,255,0.26),inset_0_0_30px_rgba(34,211,238,0.13)]"
        style={targetStyle}
      />
    );
  }

  const centerX = target ? target.left + target.width / 2 : `calc(${fallback.left}% + ${fallback.width / 2}%)`;
  const centerY = target ? target.top + target.height / 2 : `calc(${fallback.top}% + ${fallback.height / 2}%)`;
  const radiusX = target ? Math.max(160, target.width / 2 + 48) : '34%';
  const radiusY = target ? Math.max(110, target.height / 2 + 42) : '28%';
  const maskImage = target
    ? `radial-gradient(ellipse ${radiusX}px ${radiusY}px at ${centerX}px ${centerY}px, transparent 0%, transparent 48%, rgba(0,0,0,0.22) 61%, #000 100%)`
    : `radial-gradient(ellipse ${radiusX} ${radiusY} at ${centerX} ${centerY}, transparent 0%, transparent 48%, rgba(0,0,0,0.22) 61%, #000 100%)`;

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-30 bg-[#010814]/72 backdrop-blur-[1.5px] transition-all duration-700"
        style={{
          WebkitMaskImage: maskImage,
          maskImage,
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
        }}
      />
      <div
        aria-hidden="true"
        data-demo-spotlight="true"
        className="pointer-events-none absolute z-40 rounded-[22px] border border-cyan-100/70 bg-cyan-200/[0.025] shadow-[0_0_44px_rgba(34,211,238,0.30),0_0_110px_rgba(46,127,255,0.18),inset_0_0_26px_rgba(34,211,238,0.11)]"
        style={targetStyle}
      />
    </>
  );
}

function DemoActionPulse({ box }: { box: AnchorBox | null }) {
  if (!box) return null;
  const clickX = Math.max(12, Math.min(box.stageWidth - 12, box.left + box.width / 2));
  const clickY = Math.max(12, Math.min(box.stageHeight - 12, box.top + box.height / 2));
  const style: CSSProperties = {
    left: clickX,
    top: clickY,
    width: 0,
    height: 0,
  };

  return (
    <div
      aria-hidden="true"
      data-demo-action-pulse="true"
      className="pointer-events-none absolute z-[2600] text-white drop-shadow-[0_10px_24px_rgba(0,0,0,0.7)]"
      style={style}
    >
      <div className="absolute -left-5 -top-5 h-10 w-10 animate-ping rounded-full border border-cyan-200/85 bg-cyan-300/20" />
      <div className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full bg-cyan-100 shadow-[0_0_18px_rgba(103,232,249,0.85)]" />
      <MousePointer2 size={32} className="absolute -left-1 -top-1 fill-[#EAF6FF] text-[#06101F]" />
    </div>
  );
}

function DemoCardFlash({ box }: { box: AnchorBox | null }) {
  if (!box) return null;
  const style: CSSProperties = {
    left: Math.max(0, box.left - 3),
    top: Math.max(0, box.top - 3),
    width: box.width + 6,
    height: box.height + 6,
  };

  return (
    <div
      aria-hidden="true"
      data-demo-card-flash="true"
      className="pointer-events-none absolute z-[2550] rounded-2xl border border-cyan-100/85 bg-cyan-200/[0.065] shadow-[0_0_26px_rgba(34,211,238,0.56),0_0_68px_rgba(46,127,255,0.30),inset_0_0_24px_rgba(34,211,238,0.16)] backdrop-blur-[0.5px]"
      style={style}
    >
      <div className="absolute inset-0 animate-pulse rounded-2xl border border-white/18 bg-white/[0.035]" />
    </div>
  );
}

function IntroDashboardReveal({ progress }: { progress: number }) {
  const revealProgress = Math.max(0, Math.min(1, progress / 48));
  const dimOpacity = Math.max(0.04, 0.93 * (1 - revealProgress));
  const glowOpacity = Math.min(1, Math.max(0, (progress - 18) / 38));

  return (
    <>
      <div
        aria-hidden="true"
        data-demo-intro-reveal="true"
        className="pointer-events-none absolute inset-0 z-30 transition-opacity duration-500"
        style={{
          background: `rgba(1, 8, 22, ${dimOpacity})`,
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-3 z-40 rounded-2xl border border-cyan-200/45 transition-opacity duration-500"
        style={{
          opacity: glowOpacity,
          boxShadow: '0 0 34px rgba(34,211,238,0.26), inset 0 0 34px rgba(46,127,255,0.12)',
        }}
      />
    </>
  );
}

function PortfolioClarityReveal({ elapsedMs }: { elapsedMs: number }) {
  const fadeWindowMs = 620;
  const revealProgress = Math.max(0, Math.min(1, (elapsedMs - PORTFOLIO_CLARITY_REVEAL_MS) / fadeWindowMs));
  const dimOpacity = Math.max(0, 0.97 * (1 - revealProgress));
  const glowProgress = Math.max(0, Math.min(1, (elapsedMs - PORTFOLIO_CLARITY_REVEAL_MS) / 2200));
  const glowOpacity = Math.max(0, Math.sin(glowProgress * Math.PI) * 0.62);

  if (elapsedMs > PORTFOLIO_CLARITY_REVEAL_MS + 4200) return null;

  return (
    <>
      <div
        aria-hidden="true"
        data-demo-clarity-reveal="true"
        className="pointer-events-none absolute inset-0 z-30 transition-opacity duration-200"
        style={{
          opacity: dimOpacity,
          background: 'radial-gradient(circle at 50% 36%, rgba(7,20,42,0.72), rgba(1,6,16,0.99) 62%, rgba(0,0,0,1) 100%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-30 transition-opacity duration-300"
        style={{
          opacity: glowOpacity,
          background: 'radial-gradient(circle at 50% 38%, rgba(34,211,238,0.28), rgba(46,127,255,0.13) 28%, transparent 58%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-4 z-30 rounded-[28px] border border-cyan-200/35 transition-opacity duration-300"
        style={{
          opacity: glowOpacity,
          boxShadow: '0 0 48px rgba(34,211,238,0.22), inset 0 0 54px rgba(46,127,255,0.14)',
        }}
      />
    </>
  );
}

function ChapterTitleOverlay({ chapter, progress }: { chapter: DemoChapter; progress: number }) {
  const chapterIndex = Math.max(0, FULL_CHAPTER_NARRATION_IDS.indexOf(chapter.id as (typeof FULL_CHAPTER_NARRATION_IDS)[number]));
  const meta = CHAPTER_CINEMATIC_META[chapter.id] ?? { title: chapter.label, question: chapter.decisionQuestion };
  const fadeOut = Math.max(0, Math.min(1, (progress - 6) / 5));
  const opacity = Math.max(0, 1 - fadeOut);

  if (opacity <= 0.02) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-[#010714]/92 px-8 backdrop-blur-[2px] transition-all duration-700"
      style={{
        opacity,
      }}
    >
      <div
        className="w-[min(760px,100%)] rounded-[28px] border border-cyan-200/18 bg-[#06101F]/82 px-8 py-8 text-center shadow-[0_30px_90px_rgba(0,0,0,0.45),0_0_70px_rgba(46,127,255,0.14)]"
        style={{
          transform: `translateY(${(1 - opacity) * -10}px) scale(${0.985 + opacity * 0.015})`,
        }}
      >
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="rounded-full border border-cyan-200/24 bg-cyan-200/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100">
            Chapter {String(chapterIndex + 1).padStart(2, '0')}
          </span>
          <span className="rounded-full border border-[#2E7FFF]/24 bg-[#2E7FFF]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#9CC8FF]">
            Sobha Pilot Tower handover risk
          </span>
        </div>
        <h2 className="mt-5 text-[clamp(34px,5vw,64px)] font-black leading-none text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          {meta.title}
        </h2>
        <p className="mx-auto mt-4 max-w-[620px] text-[clamp(16px,2vw,22px)] font-semibold leading-8 text-[#CFE6FF]">
          {meta.question}
        </p>
      </div>
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
        <div className="rounded-2xl border border-[#2E7FFF]/24 bg-[linear-gradient(135deg,rgba(46,127,255,0.18),rgba(124,58,237,0.14),rgba(7,17,31,0.98))] p-6" data-demo-anchor="value-overview">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">
            <Sparkles size={14} />
            Client demo close
          </div>
          <h2 className="mt-4 max-w-3xl text-3xl font-black leading-tight text-white" data-demo-anchor="final-value-statement" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            One connected operating model from owner signal to field proof.
          </h2>
          <p className="mt-3 max-w-3xl text-[14px] leading-6 text-[#B8C7DB]" data-demo-anchor="connected-operating-journey">
            The walkthrough shows how a property owner can discover portfolio risk, open a project twin, trace cost and evidence blockers, act on vendor performance, and see field or resident activity flow back into the same system.
          </p>
        </div>

        <section className="grid gap-3 lg:grid-cols-[1fr_1.2fr]" data-demo-anchor="leadership-team-accountability">
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

        <section className="rounded-2xl border border-emerald-300/18 bg-emerald-300/8 p-4" data-demo-anchor="pilot-success-metrics">
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

        <div className="grid gap-3 lg:grid-cols-5" data-demo-anchor="ai-operating-system-summary">
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

        <div className="grid gap-4 lg:grid-cols-3" data-demo-anchor="pilot-rollout-strategy">
          {[
            ['Pilot path', 'Start with ProjectCommand on one active handover or DLP project.'],
            ['Success proof', 'Show avoided delay, closed evidence gaps, and action ownership in the first review cycle.'],
            ['Expansion path', 'Add VendorIQ, FieldOps capture, and resident intake once the control twin is trusted.'],
          ].map(([title, body]) => (
            <section
              key={title}
              className="rounded-xl border border-[#7C3AED]/22 bg-[#7C3AED]/10 p-4"
              data-demo-anchor={title === 'Expansion path' ? 'portfolio-scale-expansion' : title === 'Pilot path' ? 'walkthrough-complete' : undefined}
            >
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

function ExecutiveControlRoom({
  onStart,
  onCopyBoardLink,
}: {
  onStart: () => void;
  onCopyBoardLink: () => void;
}) {
  const [activeBriefingIndex, setActiveBriefingIndex] = useState(0);
  const activeBriefing = ENTRY_BRIEFINGS[activeBriefingIndex];
  const ActiveBriefingIcon = activeBriefing.icon;
  const promises = [
    { icon: Building2, title: 'Portfolio command', detail: 'One owner view for health, SLA, incidents, workload, compliance, and risk.' },
    { icon: Target, title: 'Risk-to-action chain', detail: 'Every concern links to project control, recovery ownership, cost, evidence, and forecast.' },
    { icon: BrainCircuit, title: 'Proof of execution', detail: 'Vendors, field teams, residents, and owners end with action-ready outputs.' },
  ];

  useEffect(() => {
    const briefingTimer = window.setInterval(() => {
      setActiveBriefingIndex(current => (current + 1) % ENTRY_BRIEFINGS.length);
    }, 4200);

    return () => window.clearInterval(briefingTimer);
  }, []);

  return (
    <div className="min-h-screen overflow-y-auto bg-[#030A15] text-[#EEF3FA] lg:h-screen lg:overflow-hidden">
      <div className="mx-auto flex min-h-screen max-w-[1580px] flex-col px-4 py-4 lg:h-screen lg:min-h-0 lg:px-6">
        <header className="flex h-11 flex-shrink-0 items-center gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <img src="/4c-logo.png" alt="4C logo" className="h-9 w-9 rounded-xl object-contain" />
            <div className="min-w-0">
              <div className="truncate text-[16px] font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>DevelopmentX</div>
              <div className="truncate text-[11px] font-semibold text-[#7A94B4]">Powered by 4C360</div>
            </div>
          </div>
        </header>

        <main className="grid flex-1 items-start gap-4 py-4 md:grid-cols-[minmax(0,1fr)_minmax(320px,0.82fr)] lg:min-h-0 lg:items-stretch lg:py-3 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.9fr)]">
          <section className="min-w-0 lg:flex lg:min-h-0 lg:flex-col">
            <div>
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#E11D2E]/28 bg-[#E11D2E]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#FFB4BC]">
                <MonitorPlay size={13} />
                6-minute owner command walkthrough
              </div>
            </div>
            <h1 className="mt-4 max-w-4xl text-[clamp(30px,4.35vw,56px)] font-black leading-[0.95] text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              See the whole operating chain before risk becomes delay.
            </h1>
            <p className="mt-3 max-w-3xl text-[15px] leading-6 text-[#B8C7DB]">
              In one live walkthrough, your team follows a real portfolio signal into project command, cost exposure, evidence readiness, vendor recovery, field proof, resident handoff, and an owner-ready decision.
            </p>

            <div className="mt-4 grid gap-2 md:hidden">
              <button
                type="button"
                onClick={onStart}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#2E7FFF] px-4 text-[14px] font-black text-white shadow-xl shadow-blue-950/35"
              >
                <Play size={17} />
                Start Demo
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-[#2E7FFF]/18 bg-[#07111F] p-3 shadow-2xl shadow-black/20">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_128px] sm:items-center">
                <div className="min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">Owner outcome path</div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {ENTRY_PATH_STEPS.map((step, index) => (
                      <div key={step} className="flex items-center gap-1.5">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${
                          index === 0
                            ? 'border-cyan-300/30 bg-cyan-300/12 text-cyan-100'
                            : 'border-[#2E7FFF]/16 bg-[#06101F] text-[#8EA7C7]'
                        }`}>
                          {step}
                        </span>
                        {index < ENTRY_PATH_STEPS.length - 1 && <ChevronRight size={13} className="hidden text-[#3C5D86] sm:block" />}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-2.5 text-center">
                  <div className="text-[19px] font-black text-white">6 min</div>
                  <div className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-emerald-100">decision-ready path</div>
                </div>
              </div>
            </div>

            <div className="mt-4 hidden items-stretch gap-2 xl:mt-auto xl:grid xl:grid-cols-3">
              {promises.map(({ icon: Icon, title, detail }) => (
                <div key={title} className="flex min-h-[128px] flex-col rounded-2xl border border-[#2E7FFF]/20 bg-[#07111F] p-3 shadow-2xl shadow-black/20">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-300/24 bg-cyan-300/10 text-cyan-200">
                    <Icon size={17} />
                  </div>
                  <h2 className="mt-2 text-[13px] font-black text-white">{title}</h2>
                  <p className="mt-1.5 flex-1 text-[11px] leading-4 text-[#8EA7C7]">{detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="min-h-0 rounded-3xl border border-[#2E7FFF]/24 bg-[linear-gradient(155deg,rgba(46,127,255,0.18),rgba(124,58,237,0.12),rgba(7,17,31,0.98))] p-4 shadow-2xl shadow-black/40 lg:flex lg:max-h-full lg:flex-col lg:pb-0">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">Live board briefing</div>
                <h2 className="mt-1 text-[22px] font-black leading-tight text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{activeBriefing.title}</h2>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/24 bg-cyan-300/10 text-cyan-200">
                <ActiveBriefingIcon size={20} />
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[#2E7FFF]/18 bg-[#06101F]/82 p-3 lg:mt-auto">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200">{activeBriefing.label}</div>
                <div className="rounded-full border border-[#2E7FFF]/18 bg-[#0A1628] px-2 py-1 text-[10px] font-black text-[#8DBDFF]">
                  {activeBriefing.metric}
                </div>
              </div>
              <p className="mt-2 text-[13px] leading-5 text-[#DCEBFF]">{activeBriefing.body}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-2xl border border-emerald-300/18 bg-emerald-300/10 p-2.5">
                  <div className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-100">Proof point</div>
                  <p className="mt-1 text-[11px] font-bold leading-4 text-[#DCEBFF]">{activeBriefing.proof}</p>
                </div>
                <div className="rounded-2xl border border-amber-300/18 bg-amber-300/10 p-2.5">
                  <div className="text-[9px] font-black uppercase tracking-[0.16em] text-amber-100">Board question</div>
                  <p className="mt-1 text-[11px] font-bold leading-4 text-[#DCEBFF]">{activeBriefing.question}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-1.5" aria-label="Board briefing rotation">
                {ENTRY_BRIEFINGS.map((briefing, index) => (
                  <button
                    key={briefing.label}
                    type="button"
                    onClick={() => setActiveBriefingIndex(index)}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      index === activeBriefingIndex ? 'bg-cyan-300' : 'bg-[#2E7FFF]/20 hover:bg-[#2E7FFF]/35'
                    }`}
                    aria-label={`Show ${briefing.label}`}
                  />
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
              <button
                type="button"
                onClick={onStart}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#2E7FFF] px-4 text-[14px] font-black text-white shadow-xl shadow-blue-950/35 transition-colors hover:bg-[#4B91FF]"
              >
                <Play size={17} />
                Start Demo
              </button>
              <button
                type="button"
                onClick={onCopyBoardLink}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#2E7FFF]/24 bg-[#06101F] px-4 text-[13px] font-black text-[#DCEBFF] transition-colors hover:bg-[#112040]"
              >
                <Copy size={16} />
                Share demo link
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-[#2E7FFF]/18 bg-[#06101F]/82 p-3">
              <div className="grid grid-cols-3 gap-2">
                {[
                  ['1', 'priority risk'],
                  ['6', 'minute path'],
                  ['7', 'ready outputs'],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-xl border border-[#2E7FFF]/14 bg-[#0A1628] p-2.5 text-center">
                    <div className="text-[18px] font-black text-white">{value}</div>
                    <div className="mt-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#7A94B4]">{label}</div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] leading-4 text-[#8EA7C7]">
                The demo shows how 4C360 changes a board conversation from status reporting into accountable operating decisions.
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

type DemoVoiceSingleton = {
  session: DemoVoiceSession | null;
  token: number;
};

declare global {
  interface Window {
    __4C360_DEMO_VOICE_SINGLETON__?: DemoVoiceSingleton;
  }
}

function getDemoVoiceSingleton() {
  if (typeof window === 'undefined') return null;
  window.__4C360_DEMO_VOICE_SINGLETON__ ??= { session: null, token: 0 };
  return window.__4C360_DEMO_VOICE_SINGLETON__;
}

function buildElevenLabsNarrationCue(section: DemoSection) {
  const script = getSectionNarrationScript(section);
  return `Say only the following client-facing script. Do not add tone labels, stage directions, bracketed text, introductions, closings, or extra explanation: "${script.audio}"`;
}

function formatElevenLabsError(error: unknown) {
  const rawMessage = error instanceof Error ? error.message : String(error || '');
  if (!rawMessage) {
    return 'ElevenLabs could not start the audio session. Check the agent ID, agent access, and microphone permission.';
  }

  if (/permission|notallowed|denied/i.test(rawMessage)) {
    return 'Microphone permission is blocked for this browser. Allow microphone access, then press Enable audio again.';
  }

  if (/401|authentication|authorization|signed url|conversation token/i.test(rawMessage)) {
    return 'ElevenLabs rejected this as a private or protected agent. For this frontend demo, make the agent public/client-connect enabled, or add a signed URL endpoint for production.';
  }

  if (/404|not found|agent/i.test(rawMessage)) {
    return 'ElevenLabs could not find that agent ID. Recheck the pasted ID and save it again.';
  }

  return rawMessage;
}

function formatElevenLabsDisconnect(details: unknown) {
  if (!details || typeof details !== 'object') return '';
  const candidate = details as { reason?: string; message?: string; closeReason?: string; closeCode?: number };
  if (candidate.reason !== 'error') return '';
  const message = candidate.message || candidate.closeReason || 'The ElevenLabs session disconnected unexpectedly.';
  return candidate.closeCode ? `${message} (code ${candidate.closeCode})` : message;
}

function withVoiceConnectionTimeout<T>(promise: Promise<T>, timeoutMs = 15000) {
  return new Promise<T>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error('ElevenLabs did not connect within 15 seconds. Check agent access, browser audio permissions, and network access.'));
    }, timeoutMs);

    promise
      .then(value => resolve(value))
      .catch(error => reject(error))
      .finally(() => window.clearTimeout(timeout));
  });
}

async function requestDemoMicrophoneAccess() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('This browser does not expose microphone access. ElevenLabs voice needs microphone permission to start a live session.');
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  stream.getTracks().forEach(track => track.stop());
}

async function getElevenLabsSignedUrl(agentId: string) {
  if (!DEMO_SIGNED_URL_ENDPOINT) return '';

  const url = new URL(DEMO_SIGNED_URL_ENDPOINT, window.location.origin);
  url.searchParams.set('agentId', agentId);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Signed URL endpoint returned ${response.status}. Check the ElevenLabs signing endpoint configuration.`);
  }

  const payload = await response.json() as { signedUrl?: string; signed_url?: string };
  const signedUrl = payload.signedUrl ?? payload.signed_url ?? '';
  if (!signedUrl) {
    throw new Error('Signed URL endpoint did not return signedUrl.');
  }

  return signedUrl;
}

function isDemoVoiceSetupMode() {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('voiceSetup') === 'true';
}

function DemoVoiceAdvisor({
  chapter,
  section,
  tourStatus,
  narrationLaunchRequest,
  onToast,
  purpose = 'qna',
}: {
  chapter?: DemoChapter;
  section: DemoSection;
  tourStatus: DemoAutopilotState['status'];
  narrationLaunchRequest: number;
  onToast: ToastFn;
  purpose?: 'narration' | 'qna';
}) {
  const [open, setOpen] = useState(false);
  const voiceSetupMode = isDemoVoiceSetupMode();
  const [storedAgentId, setStoredAgentId] = useState(loadStoredDemoAgentId);
  const [agentIdInput, setAgentIdInput] = useState(() => loadStoredDemoAgentId());
  const configuredAgentId = (DEMO_AGENT_ID ?? storedAgentId).trim();
  const agentConfigured = Boolean(configuredAgentId);
  const [voiceStatus, setVoiceStatus] = useState<DemoVoiceState>(() => (DEMO_AGENT_ID ?? loadStoredDemoAgentId()) ? 'ready' : 'unavailable');
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceErrorMessage, setVoiceErrorMessage] = useState('');
  const [autoNarrationEnabled, setAutoNarrationEnabled] = useState(true);
  const conversationRef = useRef<DemoVoiceSession | null>(null);
  const lastNarratedSectionRef = useRef<string | null>(null);
  const previousTourStatusRef = useRef<DemoAutopilotState['status']>(tourStatus);
  const handledNarrationLaunchRequestRef = useRef(0);
  const voiceStartInFlightRef = useRef(false);
  const voiceSessionTokenRef = useRef(0);

  useEffect(() => {
    if (agentConfigured && voiceStatus === 'unavailable') setVoiceStatus('ready');
    if (!agentConfigured && voiceStatus === 'ready') setVoiceStatus('unavailable');
  }, [agentConfigured, voiceStatus]);

  const sendNarrationCue = useCallback((targetSection: DemoSection) => {
    if (!conversationRef.current) return;
    lastNarratedSectionRef.current = targetSection.sectionId;
    conversationRef.current.sendUserMessage(buildElevenLabsNarrationCue(targetSection));
  }, []);

  const sendQnaCue = useCallback(() => {
    if (!conversationRef.current) return;
    conversationRef.current.sendContextualUpdate(`Board demo Q&A context. Current chapter: ${chapter?.label ?? section.chapterId}. Current section: ${section.title}. Current decision question: ${section.decisionQuestion}.`);
    conversationRef.current.sendUserMessage(`Tell the viewer you can answer questions about ${chapter?.label ?? 'this chapter'}, or they can continue to the next chapter when ready. Keep it brief and client-facing.`);
  }, [chapter?.label, section]);

  const stopVoice = useCallback(async () => {
    voiceSessionTokenRef.current += 1;
    voiceStartInFlightRef.current = false;
    const voiceSingleton = getDemoVoiceSingleton();
    const activeConversation = conversationRef.current ?? voiceSingleton?.session ?? null;
    conversationRef.current = null;
    if (voiceSingleton) voiceSingleton.session = null;
    lastNarratedSectionRef.current = null;

    if (activeConversation) {
      try {
        await activeConversation.endSession();
      } catch {
        // no-op
      }
    }
    setVoiceActive(false);
    setVoiceErrorMessage('');
    setVoiceStatus(configuredAgentId ? 'ready' : 'unavailable');
  }, [configuredAgentId]);

  const startVoiceWithAgentId = useCallback(async (agentIdToUse: string) => {
    const nextAgentId = agentIdToUse.trim();
    if (!nextAgentId) {
      setVoiceStatus('unavailable');
      onToast('Paste the ElevenLabs agent ID to enable board audio', 'info');
      return;
    }
    if (voiceActive || conversationRef.current || voiceStartInFlightRef.current) return;

    const sessionToken = voiceSessionTokenRef.current + 1;
    voiceSessionTokenRef.current = sessionToken;
    voiceStartInFlightRef.current = true;

    const voiceSingleton = getDemoVoiceSingleton();
    if (voiceSingleton?.session && voiceSingleton.session !== conversationRef.current) {
      try {
        await voiceSingleton.session.endSession();
      } catch {
        // no-op
      }
      voiceSingleton.session = null;
    }

    try {
      setOpen(voiceSetupMode);
      setVoiceActive(true);
      setVoiceErrorMessage('');
      setVoiceStatus('connecting');
      await requestDemoMicrophoneAccess();
      const { Conversation } = await import('@11labs/client');
      const signedUrl = await getElevenLabsSignedUrl(nextAgentId);
      const conversation = await withVoiceConnectionTimeout(Conversation.startSession({
        ...(signedUrl ? { signedUrl } : { agentId: nextAgentId }),
        connectionType: 'websocket',
        ...(DEMO_VOICE_ID ? { overrides: { tts: { voiceId: DEMO_VOICE_ID } } } : {}),
        onConnect: () => {
          if (voiceSessionTokenRef.current !== sessionToken) return;
          setVoiceStatus('listening');
          onToast('ElevenLabs board audio connected', 'success');
        },
        onDisconnect: (details: unknown) => {
          if (voiceSessionTokenRef.current !== sessionToken) return;
          const activeSingleton = getDemoVoiceSingleton();
          if (activeSingleton?.token === sessionToken) activeSingleton.session = null;
          conversationRef.current = null;
          voiceStartInFlightRef.current = false;
          setVoiceActive(false);
          const disconnectError = formatElevenLabsDisconnect(details);
          if (disconnectError) {
            setVoiceErrorMessage(disconnectError);
            setVoiceStatus('error');
          } else {
            setVoiceStatus('ready');
          }
        },
        onError: (message: string) => {
          if (voiceSessionTokenRef.current !== sessionToken) return;
          const errorMessage = formatElevenLabsError(message);
          const activeSingleton = getDemoVoiceSingleton();
          if (activeSingleton?.token === sessionToken) activeSingleton.session = null;
          conversationRef.current = null;
          voiceStartInFlightRef.current = false;
          setVoiceActive(false);
          setVoiceErrorMessage(errorMessage);
          setVoiceStatus('error');
          onToast(errorMessage, 'error');
        },
        onModeChange: (mode: { mode: 'speaking' | 'listening' }) => {
          if (voiceSessionTokenRef.current !== sessionToken) return;
          setVoiceStatus(mode.mode);
        },
        onStatusChange: (status: { status: 'connecting' | 'connected' | 'disconnecting' | 'disconnected' }) => {
          if (voiceSessionTokenRef.current !== sessionToken) return;
          if (status.status === 'connecting') setVoiceStatus('connecting');
          if (status.status === 'disconnected') setVoiceStatus('ready');
        },
      }));

      if (voiceSessionTokenRef.current !== sessionToken) {
        await conversation.endSession().catch(() => undefined);
        return;
      }

      conversationRef.current = conversation;
      const activeSingleton = getDemoVoiceSingleton();
      if (activeSingleton) {
        activeSingleton.session = conversation;
        activeSingleton.token = sessionToken;
      }
      lastNarratedSectionRef.current = section.sectionId;
      conversationRef.current.sendContextualUpdate(`Demo scenario: ${DEMO_SCENARIO}. Format: presenter-led board walkthrough. Current chapter: ${chapter?.label ?? section.chapterId}. Current section: ${section.title}.`);
      if (purpose === 'qna') {
        sendQnaCue();
      } else {
        conversationRef.current.sendUserMessage(buildElevenLabsNarrationCue(section));
      }
    } catch (error) {
      if (voiceSessionTokenRef.current !== sessionToken) return;
      const errorMessage = formatElevenLabsError(error);
      const activeSingleton = getDemoVoiceSingleton();
      if (activeSingleton?.token === sessionToken) activeSingleton.session = null;
      conversationRef.current = null;
      setVoiceActive(false);
      setVoiceErrorMessage(errorMessage);
      setVoiceStatus('error');
      onToast(errorMessage, 'error');
    } finally {
      if (voiceSessionTokenRef.current === sessionToken) {
        voiceStartInFlightRef.current = false;
      }
    }
  }, [chapter?.label, onToast, purpose, section, sendQnaCue, voiceActive, voiceSetupMode]);

  const saveAgentId = useCallback(() => {
    const nextAgentId = agentIdInput.trim();
    if (!nextAgentId) {
      onToast('Paste the ElevenLabs agent ID first', 'info');
      return;
    }

    const saved = saveStoredDemoAgentId(nextAgentId);
    setStoredAgentId(nextAgentId);
    setVoiceStatus('ready');
    onToast(saved ? 'ElevenLabs agent ID saved. Connecting audio now.' : 'ElevenLabs agent ID ready. Connecting audio now.', saved ? 'success' : 'info');
    void startVoiceWithAgentId(nextAgentId);
  }, [agentIdInput, onToast, startVoiceWithAgentId]);

  const startVoice = useCallback(async () => {
    await startVoiceWithAgentId(configuredAgentId);
  }, [configuredAgentId, startVoiceWithAgentId]);

  useEffect(() => {
    if (purpose !== 'narration') return;
    if (!voiceActive || !autoNarrationEnabled || !conversationRef.current) return;
    if (lastNarratedSectionRef.current === section.sectionId) return;
    sendNarrationCue(section);
  }, [autoNarrationEnabled, purpose, section, sendNarrationCue, voiceActive]);

  useEffect(() => {
    if (purpose !== 'narration') return;
    if (!narrationLaunchRequest || handledNarrationLaunchRequestRef.current === narrationLaunchRequest) return;
    handledNarrationLaunchRequestRef.current = narrationLaunchRequest;
    if (!agentConfigured || voiceActive || conversationRef.current || voiceStartInFlightRef.current) return;
    void startVoice();
  }, [agentConfigured, narrationLaunchRequest, purpose, startVoice, voiceActive]);

  useEffect(() => {
    if (purpose !== 'narration') return;
    if (tourStatus !== 'playing' || !autoNarrationEnabled || !agentConfigured || voiceActive || conversationRef.current || voiceStartInFlightRef.current) return;
    void startVoice();
  }, [agentConfigured, autoNarrationEnabled, purpose, startVoice, tourStatus, voiceActive]);

  useEffect(() => () => {
    void stopVoice();
  }, [stopVoice]);

  useEffect(() => {
    if (!voiceSetupMode) setOpen(false);
  }, [voiceSetupMode]);

  useEffect(() => {
    if (previousTourStatusRef.current === 'playing' && tourStatus !== 'playing' && voiceActive) {
      void stopVoice();
    }
    previousTourStatusRef.current = tourStatus;
  }, [stopVoice, tourStatus, voiceActive]);

  const voiceLabel = voiceStatus === 'unavailable'
    ? 'Connect ElevenLabs audio'
    : voiceStatus === 'ready'
    ? 'ElevenLabs ready'
    : voiceStatus === 'connecting'
    ? 'Connecting to ElevenLabs'
    : voiceStatus === 'listening'
    ? 'ElevenLabs listening'
    : voiceStatus === 'speaking'
    ? 'ElevenLabs speaking'
    : 'ElevenLabs error';
  const narrationButtonLabel = voiceActive
    ? purpose === 'qna' ? 'Q&A live' : 'Audio on'
    : voiceStatus === 'connecting'
    ? 'Connecting'
    : voiceStatus === 'error'
    ? 'Audio issue'
    : purpose === 'qna' ? 'Ask a question' : 'Narration';
  const narrationScript = getSectionNarrationScript(section);

  if (!voiceSetupMode && !agentConfigured) return null;

  const handleNarrationClick = () => {
    if (voiceSetupMode) {
      setOpen(current => !current);
      return;
    }

    void (voiceActive ? stopVoice() : startVoice());
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleNarrationClick}
        className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-[11px] font-black transition-colors ${
          voiceActive
            ? 'border-cyan-300/34 bg-cyan-300/12 text-cyan-100'
            : voiceStatus === 'error'
            ? 'border-[#E11D2E]/34 bg-[#E11D2E]/14 text-[#FFB4BC] hover:bg-[#E11D2E]/20'
            : agentConfigured
            ? 'border-[#2E7FFF]/24 bg-[#0A1628] text-[#B8C7DB] hover:bg-[#112040] hover:text-white'
            : 'border-amber-300/24 bg-amber-300/10 text-amber-100 hover:bg-amber-300/14'
        }`}
        aria-label={voiceSetupMode ? 'Open ElevenLabs voice setup' : voiceActive ? 'Stop narration audio' : 'Start narration audio'}
      >
        {voiceActive ? <Volume2 size={14} /> : voiceStatus === 'error' ? <MicOff size={14} /> : <Mic size={14} />}
        <span className="hidden sm:inline">{voiceSetupMode && !agentConfigured ? 'Voice setup' : narrationButtonLabel}</span>
      </button>

      {voiceSetupMode && open && (
        <div className="absolute right-0 top-12 z-50 max-h-[calc(100vh-96px)] w-[min(440px,calc(100vw-32px))] overflow-y-auto rounded-2xl border border-[#2E7FFF]/24 bg-[#07111F] p-4 shadow-2xl shadow-black/50">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">Board voice advisor</div>
              <h3 className="mt-1 text-[16px] font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{voiceLabel}</h3>
              <p className="mt-2 text-[12px] leading-5 text-[#8EA7C7]">
                Premium demo audio uses your ElevenLabs agent. Paste the agent ID once for local demos, or set the environment variable for deployment.
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
            <div className={`mt-3 rounded-xl border p-3 ${agentConfigured ? 'border-emerald-300/24 bg-emerald-300/10' : 'border-amber-300/24 bg-amber-300/10'}`}>
              <div className={`text-[10px] font-black uppercase tracking-[0.16em] ${agentConfigured ? 'text-emerald-100' : 'text-amber-100'}`}>
                {agentConfigured ? 'Agent saved' : 'Connect agent'}
              </div>
              <p className={`mt-1 text-[12px] leading-5 ${agentConfigured ? 'text-emerald-50' : 'text-amber-50'}`}>
                {agentConfigured
                  ? 'Using the saved ElevenLabs agent ID for this browser. Save again if you changed it, or enable audio below.'
                  : 'Paste the ElevenLabs agent ID you created. This saves it in this browser and connects the board audio immediately.'}
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                <input
                  type="text"
                  value={agentIdInput}
                  onChange={event => setAgentIdInput(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter') saveAgentId();
                  }}
                  placeholder="Paste ElevenLabs agent ID"
                  className="h-10 min-w-0 rounded-xl border border-[#2E7FFF]/22 bg-[#06101F] px-3 text-[12px] font-bold text-white outline-none placeholder:text-[#5F7FA8] focus:border-cyan-300/45"
                />
                <button
                  type="button"
                  onClick={saveAgentId}
                  className="h-10 rounded-xl bg-[#2E7FFF] px-3 text-[12px] font-black text-white transition-colors hover:bg-[#4B91FF]"
                >
                  Save and connect
                </button>
              </div>
            </div>
          )}

          {voiceErrorMessage && (
            <div className="mt-3 rounded-xl border border-[#E11D2E]/28 bg-[#E11D2E]/12 p-3">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#FFB4BC]">Connection issue</div>
              <p className="mt-1 text-[12px] leading-5 text-[#FFE1E5]">{voiceErrorMessage}</p>
              <p className="mt-2 text-[11px] leading-4 text-[#FFB4BC]">
                If the ID is correct, check that the ElevenLabs agent allows public client connections. For private agents, set a signed URL endpoint for deployment.
              </p>
            </div>
          )}

          <div className="mt-3 rounded-xl border border-[#2E7FFF]/16 bg-[#0A1628] p-3">
            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#7A94B4]">Current narration</div>
            <p className="mt-1 text-[12px] leading-5 text-[#DCEBFF]">{narrationScript.audio}</p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={voiceActive ? stopVoice : startVoice}
              disabled={!agentConfigured && !voiceActive}
              className={`flex h-10 items-center justify-center gap-2 rounded-xl text-[12px] font-black transition-colors ${
                voiceActive
                  ? 'border border-[#E11D2E]/34 bg-[#E11D2E]/18 text-[#FFB4BC]'
                  : agentConfigured
                  ? 'bg-[#2E7FFF] text-white hover:bg-[#4B91FF]'
                  : 'cursor-not-allowed border border-[#2E7FFF]/18 bg-[#06101F] text-[#7A94B4]'
              }`}
            >
              {voiceActive ? <MicOff size={15} /> : <Mic size={15} />}
                  {!agentConfigured ? 'Save ID first' : voiceStatus === 'connecting' ? 'Connecting...' : voiceActive ? 'End Q&A' : purpose === 'qna' ? 'Start Q&A' : 'Enable audio'}
            </button>
            <button
              type="button"
              onClick={() => voiceActive ? (purpose === 'qna' ? sendQnaCue() : sendNarrationCue(section)) : startVoice()}
              className={`flex h-10 items-center justify-center gap-2 rounded-xl border text-[12px] font-black transition-colors ${
                agentConfigured
                  ? 'border-[#2E7FFF]/22 bg-[#06101F] text-[#DCEBFF] hover:bg-[#112040]'
                  : 'cursor-not-allowed border-[#2E7FFF]/18 bg-[#06101F] text-[#7A94B4]'
              }`}
              disabled={!agentConfigured}
            >
              <Volume2 size={15} />
              {purpose === 'qna' ? 'Ask prompt' : 'Read cue'}
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

function DemoTimelinePlayer({
  script,
  status,
  playbackKey,
  seekRequest,
  onEnded,
  onProgress,
  onCue,
  onPlaybackBlocked,
}: {
  script: DemoNarrationScript;
  status: DemoAutopilotState['status'];
  playbackKey: string;
  seekRequest: DemoSeekRequest | null;
  onEnded: () => void;
  onProgress: (progress: number, elapsedMs: number) => void;
  onCue: (cue: DemoTimelineCue) => void;
  onPlaybackBlocked: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const endedRef = useRef(false);
  const firedCuesRef = useRef<Set<string>>(new Set());
  const onEndedRef = useRef(onEnded);
  const onProgressRef = useRef(onProgress);
  const onCueRef = useRef(onCue);
  const onPlaybackBlockedRef = useRef(onPlaybackBlocked);
  const statusRef = useRef(status);
  const scriptRef = useRef(script);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    scriptRef.current = script;
  }, [script]);

  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  useEffect(() => {
    onCueRef.current = onCue;
  }, [onCue]);

  useEffect(() => {
    onPlaybackBlockedRef.current = onPlaybackBlocked;
  }, [onPlaybackBlocked]);

  const cueKey = useCallback((cue: DemoTimelineCue) => {
    if (cue.type === 'spotlight') return `${cue.atMs}:spotlight:${cue.anchor ?? 'fallback'}`;
    if (cue.type === 'scrollTo') return `${cue.atMs}:scrollTo:${cue.anchor}`;
    if (cue.type === 'slowScrollTo') return `${cue.atMs}:slowScrollTo:${cue.anchor}`;
    if (cue.type === 'pulse') return `${cue.atMs}:pulse:${cue.anchor ?? 'fallback'}`;
    if (cue.type === 'pinPulse') return `${cue.atMs}:pinPulse:${cue.anchor ?? 'fallback'}`;
    if (cue.type === 'flash') return `${cue.atMs}:flash:${cue.anchor ?? 'fallback'}`;
    if (cue.type === 'demoAction') return `${cue.atMs}:demoAction:${cue.actionId}`;
    if (cue.type === 'clearDemoAction') return `${cue.atMs}:clearDemoAction`;
    return `${cue.atMs}:chapterPause`;
  }, []);

  const markCuesThrough = useCallback((elapsedMs: number) => {
    const nextFired = new Set<string>();
    scriptRef.current.timelineCues.forEach(cue => {
      if (cue.atMs <= elapsedMs) nextFired.add(cueKey(cue));
    });
    firedCuesRef.current = nextFired;
  }, [cueKey]);

  const emitTimeline = useCallback((elapsedMs: number, durationMs = scriptRef.current.estimatedDurationMs) => {
    const safeDuration = Math.max(1000, durationMs);
    const boundedElapsed = Math.max(0, Math.min(safeDuration, elapsedMs));
    onProgressRef.current(Math.min(100, (boundedElapsed / safeDuration) * 100), boundedElapsed);

    scriptRef.current.timelineCues.forEach(cue => {
      if (cue.type === 'chapterPause') return;
      if (boundedElapsed < cue.atMs) return;
      const key = cueKey(cue);
      if (firedCuesRef.current.has(key)) return;
      firedCuesRef.current.add(key);
      onCueRef.current(cue);
    });
  }, [cueKey]);

  const finishNarration = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    audioRef.current?.pause();
    emitTimeline(scriptRef.current.estimatedDurationMs, scriptRef.current.estimatedDurationMs);
    onEndedRef.current();
  }, [emitTimeline]);

  const handlePlaybackFailure = useCallback(() => {
    audioRef.current?.pause();
    onPlaybackBlockedRef.current();
  }, []);

  useEffect(() => {
    endedRef.current = false;
    firedCuesRef.current = new Set();
    emitTimeline(0, script.estimatedDurationMs);

    const audio = new Audio(script.audioSrc);
    audio.preload = 'auto';
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
      emitTimeline(audio.currentTime * 1000, audio.duration * 1000);
    };
    const handleError = () => {
      if (statusRef.current === 'playing') handlePlaybackFailure();
    };
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', finishNarration);
    audio.addEventListener('error', handleError);

    if (statusRef.current === 'playing') {
      audio.play().catch(handlePlaybackFailure);
    }

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', finishNarration);
      audio.removeEventListener('error', handleError);
      audio.removeAttribute('src');
      audio.load();
      if (audioRef.current === audio) audioRef.current = null;
    };
  }, [emitTimeline, finishNarration, handlePlaybackFailure, playbackKey, script.audioSrc, script.estimatedDurationMs]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || endedRef.current) return;

    if (status === 'playing') {
      if (audio.error) {
        handlePlaybackFailure();
        return;
      }
      audio.play().catch(handlePlaybackFailure);
      return;
    }

    audio.pause();
  }, [handlePlaybackFailure, status]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !seekRequest) return;

    const safeDurationMs = Number.isFinite(audio.duration) && audio.duration > 0
      ? audio.duration * 1000
      : scriptRef.current.estimatedDurationMs;
    const boundedElapsed = Math.max(0, Math.min(safeDurationMs, seekRequest.elapsedMs));
    endedRef.current = false;
    markCuesThrough(boundedElapsed);
    audio.currentTime = boundedElapsed / 1000;
    onProgressRef.current(Math.min(100, (boundedElapsed / Math.max(1000, safeDurationMs)) * 100), boundedElapsed);
  }, [markCuesThrough, seekRequest]);

  return null;
}

function ChapterEndPanel({
  chapter,
  nextChapter,
  section,
  onClose,
  onNextChapter,
  onReplayChapter,
  onToast,
}: {
  chapter: DemoChapter;
  nextChapter: DemoChapter;
  section: DemoSection;
  onClose: () => void;
  onNextChapter: () => void;
  onReplayChapter: () => void;
  onToast: ToastFn;
}) {
  const isFinalChapter = chapter.id === 'value';
  const [dismissed, setDismissed] = useState(false);

  const handleNextChapter = () => {
    setDismissed(true);
    window.requestAnimationFrame(onNextChapter);
  };

  if (dismissed) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#010814]/62 p-4 backdrop-blur-[2px]">
      <div
        data-demo-chapter-end-panel="true"
        className="w-[min(560px,calc(100vw-40px))] rounded-2xl border border-cyan-300/28 bg-[#07111F]/97 p-4 shadow-2xl shadow-black/60"
      >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">{isFinalChapter ? 'Walkthrough complete' : 'Chapter pause'}</div>
          <h2 className="mt-1 text-[17px] font-black leading-tight text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {isFinalChapter ? '4C360 board walkthrough is complete.' : `${chapter.label} is ready for questions.`}
          </h2>
          <p className="mt-2 text-[12px] leading-5 text-[#B8C7DB]">{section.chapterClosingPrompt.caption}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chapter pause"
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#2E7FFF]/22 bg-[#0A1628] text-[#9FB6D5] transition-colors hover:bg-[#112040] hover:text-white"
        >
          <X size={17} />
        </button>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr]">
        <button
          type="button"
          onClick={handleNextChapter}
          className="flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#2E7FFF] px-3 py-2 text-[12px] font-black text-white hover:bg-[#4B91FF]"
        >
          {isFinalChapter ? 'Replay walkthrough' : `Next chapter: ${nextChapter.shortLabel}`}
          <ChevronRight size={15} />
        </button>
        <button
          type="button"
          onClick={onReplayChapter}
          className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#2E7FFF]/22 bg-[#0A1628] px-3 py-2 text-[12px] font-black text-[#DCEBFF] hover:bg-[#112040]"
        >
          <RotateCcw size={14} />
          Replay
        </button>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-[#2E7FFF]/16 bg-[#06101F] px-3 py-2">
        <div className="min-w-0">
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#7A94B4]">Board Q&A</div>
          <div className="mt-0.5 truncate text-[12px] font-bold text-[#DCEBFF]">{isFinalChapter ? 'Discuss pilot scope, rollout, and next steps.' : 'Ask about this chapter before moving on.'}</div>
        </div>
        <DemoVoiceAdvisor
          chapter={chapter}
          section={section}
          tourStatus="paused"
          narrationLaunchRequest={0}
          onToast={onToast}
          purpose="qna"
        />
      </div>
      </div>
    </div>
  );
}

function DemoStage({
  chapter,
  section,
  onToast,
  onOpenChapter,
  totals,
  onCopySummary,
  demoActionRequest,
  demoPlaying,
  demoTimelineMs,
  demoOverlayReset,
  portfolioGisActive,
  portfolioGisZoomedOut,
  portfolioJltPinPulsing,
  portfolioJltDrawerOpen,
  portfolioPropertyCommandScrollActive,
  portfolioManagerActionActive,
  portfolioSmartDispatchScrollActive,
  portfolioSmartDispatchActive,
  portfolioSmartDispatchAssigned,
  portfolioPropertiesRecapActive,
  portfolioRecapFadeProgress,
  portfolioReportSequenceActive,
}: {
  chapter: DemoChapter;
  section: DemoSection;
  onToast: ToastFn;
  onOpenChapter: (chapterId: string) => void;
  totals: ReturnType<typeof getOutcomeTotals>;
  onCopySummary: () => void;
  demoActionRequest: DemoActionRequest | null;
  demoPlaying: boolean;
  demoTimelineMs: number;
  demoOverlayReset: boolean;
  portfolioGisActive: boolean;
  portfolioGisZoomedOut: boolean;
  portfolioJltPinPulsing: boolean;
  portfolioJltDrawerOpen: boolean;
  portfolioPropertyCommandScrollActive: boolean;
  portfolioManagerActionActive: boolean;
  portfolioSmartDispatchScrollActive: boolean;
  portfolioSmartDispatchActive: boolean;
  portfolioSmartDispatchAssigned: boolean;
  portfolioPropertiesRecapActive: boolean;
  portfolioRecapFadeProgress: number;
  portfolioReportSequenceActive: boolean;
}) {
  if (chapter.id === 'portfolio' && portfolioPropertiesRecapActive) {
    return (
      <div
        className="h-full min-h-0 bg-[#030A15] transition-opacity duration-700"
        data-demo-anchor="portfolio-properties-recap"
        style={{ opacity: 0.12 + portfolioRecapFadeProgress * 0.88 }}
      >
        <AllClients
          onToast={onToast}
          onClientSelect={clientId => onToast(`Portfolio focus set to ${clientId}`, 'info')}
          onNavigateToIncidents={clientId => onToast(`Incident view ready for ${clientId}`, 'info')}
          onNavigateToCommand={() => onOpenChapter('projectcommand')}
          demoPortfolioSection={portfolioReportSequenceActive ? 'command-path' : 'health-actions'}
          demoActionRequest={demoActionRequest}
          demoPlaying={demoPlaying}
          demoOverlayReset={demoOverlayReset}
        />
      </div>
    );
  }

  if (chapter.id === 'portfolio' && portfolioGisActive) {
    return (
      <div
        className="h-full min-h-0 transition-opacity duration-700"
        data-demo-anchor="portfolio-gis-page"
        style={{
          opacity: portfolioPropertiesRecapActive ? Math.max(0, 1 - portfolioRecapFadeProgress) : 1,
          filter: portfolioPropertiesRecapActive ? `blur(${portfolioRecapFadeProgress * 8}px)` : undefined,
        }}
      >
          <StrategicDashboard
            key={portfolioGisZoomedOut ? 'portfolio-gis-all' : 'portfolio-gis-jlt'}
            onToast={onToast}
            selectedClientId={portfolioGisZoomedOut ? null : 'CLT-004'}
            compactClientMarkers={portfolioGisZoomedOut}
            pulsingClientIds={[
              ...(portfolioJltPinPulsing ? ['CLT-004'] : []),
            ]}
            demoOpenClientId={portfolioJltDrawerOpen ? 'CLT-004' : null}
            demoPropertyCommandScrollActive={portfolioPropertyCommandScrollActive}
            demoManagerActionActive={portfolioManagerActionActive}
            demoSmartDispatchScrollActive={portfolioSmartDispatchScrollActive}
            demoSmartDispatchActive={portfolioSmartDispatchActive}
            demoSmartDispatchAssigned={portfolioSmartDispatchAssigned}
            onNavigateToIncident={() => onToast('Incident focus ready for JLT North Cluster', 'info')}
            onNavigateToTasks={() => onToast('Field task queue ready for JLT North Cluster', 'info')}
            onMarkPPMCreated={() => onToast('PPM recovery action prepared for JLT North Cluster', 'success')}
          ppmCreatedTasks={{}}
        />
      </div>
    );
  }

  if (chapter.screen === 'portfolio') {
    return (
      <AllClients
        onToast={onToast}
        onClientSelect={clientId => onToast(`Portfolio focus set to ${clientId}`, 'info')}
        onNavigateToIncidents={clientId => onToast(`Incident view ready for ${clientId}`, 'info')}
        onNavigateToCommand={() => onOpenChapter('projectcommand')}
        demoAddPropertySection={undefined}
        demoPortfolioSection={chapter.id === 'portfolio' ? section.id as 'health-actions' | 'portfolio-map' | 'command-path' : undefined}
        demoActionRequest={demoActionRequest}
        demoPlaying={demoPlaying}
        demoOverlayReset={demoOverlayReset}
      />
    );
  }

  if (chapter.screen === 'projectcommand') {
    return (
      <ProjectCommand
        key={chapter.id}
        initialScreen={chapter.projectScreen}
        demoMode
        demoTimelineMs={demoTimelineMs}
        demoChapterId={chapter.id}
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
  const [sectionProgress, setSectionProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Guided demo ready');
  const [shareCopied, setShareCopied] = useState(false);
  const [sharePanelOpen, setSharePanelOpen] = useState(false);
  const [narrationPhase, setNarrationPhase] = useState<DemoNarrationPhase>('section');
  const [chapterEndOpen, setChapterEndOpen] = useState(false);
  const [timelineElapsedMs, setTimelineElapsedMs] = useState(0);
  const [seekRequest, setSeekRequest] = useState<DemoSeekRequest | null>(null);
  const [playbackRunId, setPlaybackRunId] = useState(0);
  const [demoActionRequest, setDemoActionRequest] = useState<DemoActionRequest | null>(null);
  const [actionPulseTarget, setActionPulseTarget] = useState<HotspotTarget | null>(null);
  const [cardFlashTarget, setCardFlashTarget] = useState<HotspotTarget | null>(null);
  const [progressState, setProgressState] = useState<DemoProgressState>(loadDemoProgressState);
  const shareInputRef = useRef<HTMLInputElement>(null);
  const sectionElapsedRef = useRef(0);
  const actionPulseTimerRef = useRef<number | null>(null);
  const cardFlashTimerRef = useRef<number | null>(null);
  const scrollAnimationRef = useRef<number | null>(null);
  const scrollAnimationTargetRef = useRef<HTMLElement | null>(null);
  const scrollAnimationBehaviorRef = useRef('');

  const activeIndex = Math.max(0, DEMO_CHAPTERS.findIndex(chapter => chapter.id === activeId));
  const chapter = DEMO_CHAPTERS[activeIndex] ?? DEMO_CHAPTERS[0];
  const frames = useMemo(() => getDemoSections(chapter), [chapter]);
  const activeFrameIndex = Math.max(0, frames.findIndex(frame => frame.id === activeFrameId));
  const activeFrame = frames[activeFrameIndex] ?? frames[0];
  const nextFrame = frames[activeFrameIndex + 1] ?? null;
  const allMissionFrames = useMemo(getAllDemoSections, []);
  const completedMissionSet = useMemo(() => new Set(progressState.completedMissionIds), [progressState.completedMissionIds]);
  const activeSectionComplete = completedMissionSet.has(activeFrame.mission.id);
  const outcomeTotals = useMemo(() => getOutcomeTotals(progressState), [progressState]);
  const activeAct = useMemo(() => getActForChapter(chapter.id), [chapter.id]);
  const activeActProgress = useMemo(() => getActProgress(activeAct, completedMissionSet), [activeAct, completedMissionSet]);
  const activeNarrationScript = useMemo(() => getActiveNarrationScript(activeFrame, narrationPhase), [activeFrame, narrationPhase]);
  const syncedActiveFrameId = narrationPhase === 'intro' && hasFullChapterNarration(chapter.id)
    ? getSyncedIntroSectionId(chapter.id, frames, timelineElapsedMs, activeNarrationScript.estimatedDurationMs, activeFrame.id)
    : activeFrame.id;
  const baseHotspotTarget = useMemo<HotspotTarget>(() => ({
    anchor: activeFrame.anchor ?? chapter.anchor,
    fallback: activeFrame.fallback ?? chapter.fallback,
  }), [activeFrame, chapter.anchor, chapter.fallback]);
  const activeSpotlightTarget = useMemo(
    () => getActiveTimelineSpotlight(activeNarrationScript, timelineElapsedMs),
    [activeNarrationScript, timelineElapsedMs],
  );
  const chapterTitleVisible = DEMO_SPOTLIGHTS_ENABLED && autopilot.started && narrationPhase === 'intro' && sectionProgress < 12;
  const portfolioClarityRevealVisible = !chapterEndOpen
    && autopilot.started
    && chapter.id === 'portfolio'
    && narrationPhase === 'intro'
    && timelineElapsedMs < PORTFOLIO_CLARITY_REVEAL_MS + 4200;
  const spotlightVisible = DEMO_SPOTLIGHTS_ENABLED
    && !chapterEndOpen
    && autopilot.started
    && activeSpotlightTarget
    && (narrationPhase !== 'intro' || (hasFullChapterNarration(chapter.id) && !chapterTitleVisible));
  const hotspotTarget = activeSpotlightTarget ?? baseHotspotTarget;
  const smartDispatchSpotlightTarget = useMemo<HotspotTarget>(() => ({
    anchor: 'ai-smart-dispatch-panel',
    fallback: { left: 49, top: 2, width: 49, height: 88 },
  }), []);
  const jltPinClickTarget = useMemo<HotspotTarget>(() => ({
    anchor: 'gis-jlt-map-pin',
    fallback: { left: 8, top: 49, width: 8, height: 8 },
  }), []);
  const anchorBox = useAnchorBox(stageRef, hotspotTarget);
  const smartDispatchSpotlightBox = useAnchorBox(stageRef, smartDispatchSpotlightTarget);
  const jltPinClickBox = useAnchorBox(stageRef, jltPinClickTarget);
  const actionPulseBox = useAnchorBox(stageRef, actionPulseTarget ?? baseHotspotTarget);
  const cardFlashBox = useAnchorBox(stageRef, cardFlashTarget ?? baseHotspotTarget);
  const sectionControlProgress = autopilot.status === 'playing'
    ? sectionProgress
    : Math.round(((activeFrameIndex + 1) / frames.length) * 100);
  const narrationPlaybackKey = `${chapter.id}:${activeFrame.id}:${narrationPhase}:${playbackRunId}`;
  const shareUrl = useMemo(
    () => buildShareUrl(chapter.id, activeFrame.sectionId, showMode, autopilot.status === 'playing'),
    [activeFrame.sectionId, autopilot.status, chapter.id, showMode],
  );
  const nextChapter = DEMO_CHAPTERS[(activeIndex + 1) % DEMO_CHAPTERS.length];
  const nextSectionLabel = nextFrame ? `Next: ${nextFrame.label}` : `Next: ${nextChapter.shortLabel}`;
  const timecodeElapsed = formatDemoTimecode(timelineElapsedMs);
  const timecodeTotal = formatDemoTimecode(activeNarrationScript.estimatedDurationMs);
  const timecodeSeekPercent = Math.round(
    (Math.max(0, Math.min(activeNarrationScript.estimatedDurationMs, timelineElapsedMs))
      / Math.max(1, activeNarrationScript.estimatedDurationMs)) * 100,
  );
  const timecodePhaseLabel = narrationPhase === 'intro'
    ? 'Chapter audio'
    : narrationPhase === 'closing' || narrationPhase === 'chapterEnd'
    ? 'Chapter pause'
    : 'Section audio';
  const timecodeChapterLabel = `CH ${String(activeIndex + 1).padStart(2, '0')}`;
  const portfolioGisActive = chapter.id === 'portfolio'
    && narrationPhase === 'intro'
    && timelineElapsedMs >= PORTFOLIO_GIS_HANDOFF_MS;
  const portfolioGisZoomedOut = portfolioGisActive && timelineElapsedMs >= PORTFOLIO_GIS_ZOOM_OUT_MS;
  const portfolioPropertiesRecapActive = portfolioGisActive && timelineElapsedMs >= PORTFOLIO_PROPERTIES_RECAP_MS;
  const portfolioReportSequenceActive = portfolioPropertiesRecapActive
    && timelineElapsedMs >= PORTFOLIO_REPORT_SEQUENCE_MS
    && !chapterEndOpen;
  const portfolioRecapFadeProgress = portfolioPropertiesRecapActive
    ? Math.max(0, Math.min(1, (timelineElapsedMs - PORTFOLIO_PROPERTIES_RECAP_MS) / PORTFOLIO_PROPERTIES_RECAP_FADE_MS))
    : 0;
  const portfolioJltPinPulsing = portfolioGisZoomedOut && timelineElapsedMs >= 41000;
  const portfolioJltPinClickActive = portfolioGisZoomedOut && timelineElapsedMs >= 48000 && timelineElapsedMs < 50100;
  const portfolioJltDrawerOpen = portfolioGisZoomedOut && timelineElapsedMs >= 48600;
  const portfolioPropertyCommandScrollActive = portfolioGisZoomedOut && timelineElapsedMs >= 52000 && timelineElapsedMs < 66000;
  const portfolioManagerActionActive = portfolioGisZoomedOut && timelineElapsedMs >= 66000;
  const portfolioSmartDispatchScrollActive = portfolioGisZoomedOut
    && timelineElapsedMs >= PORTFOLIO_DISPATCH_SITE_TEAM_MS
    && timelineElapsedMs < PORTFOLIO_ASSIGN_TECHNICIAN_MS
    && !portfolioPropertiesRecapActive;
  const portfolioSmartDispatchActive = portfolioGisZoomedOut
    && timelineElapsedMs >= PORTFOLIO_DISPATCH_SITE_TEAM_MS
    && timelineElapsedMs < PORTFOLIO_PROPERTIES_RECAP_MS;
  const portfolioSmartDispatchAssigned = portfolioGisZoomedOut
    && timelineElapsedMs >= PORTFOLIO_ASSIGN_TECHNICIAN_MS
    && !portfolioPropertiesRecapActive;
  const activeMissionComplete = activeSectionComplete;
  const primaryActionLabel = nextSectionLabel;
  const demoInteractionLocked = autopilot.status === 'playing' && !chapterEndOpen;
  const [presenterNotesOpen, setPresenterNotesOpen] = useState(false);

  const seekToTimecodePercent = useCallback((percent: number) => {
    const boundedPercent = Math.max(0, Math.min(100, percent));
    const elapsedMs = Math.round((boundedPercent / 100) * activeNarrationScript.estimatedDurationMs);
    setChapterEndOpen(false);
    setTimelineElapsedMs(elapsedMs);
    setSectionProgress(boundedPercent);
    setSeekRequest(current => ({ id: (current?.id ?? 0) + 1, elapsedMs }));
  }, [activeNarrationScript.estimatedDurationMs]);

  const selectChapter = useCallback((chapterId: string, frameId?: string) => {
    const nextChapter = getChapterById(chapterId);
    const nextFrameId = resolveFrameId(nextChapter, frameId);
    const nextFrames = getDemoSections(nextChapter);
    const shouldSeekIntoChapter = Boolean(frameId) && hasFullChapterNarration(chapterId);
    const nextIntroDurationMs = nextFrames[0]?.chapterIntroScript.estimatedDurationMs ?? 60_000;
    const nextStartMs = shouldSeekIntoChapter
      ? getIntroSectionStartMs(chapterId, nextFrameId, nextFrames, nextIntroDurationMs)
      : 0;
    const nextProgress = Math.min(100, (nextStartMs / Math.max(1, nextIntroDurationMs)) * 100);

    setShowIntro(false);
    setChapterEndOpen(false);
    setNarrationPhase(shouldSeekIntoChapter || !frameId ? 'intro' : 'section');
    setActiveId(chapterId);
    setActiveFrameId(nextFrameId);
    setAutopilot({ status: 'playing', started: true });
    setSectionProgress(nextProgress);
    setTimelineElapsedMs(nextStartMs);
    setPlaybackRunId(current => current + 1);
    setSeekRequest(current => ({ id: (current?.id ?? 0) + 1, elapsedMs: nextStartMs }));
    setDemoActionRequest(null);
    setActionPulseTarget(null);
    setCardFlashTarget(null);
    sectionElapsedRef.current = nextStartMs;
    updateChapterUrl(chapterId, nextFrameId, { showMode, autoplay: true, phase: shouldSeekIntoChapter || !frameId ? 'intro' : 'section' });
  }, [showMode]);

  const selectFrame = useCallback((frameId: string) => {
    const nextFrameId = resolveFrameId(chapter, frameId);
    const shouldSeekIntoChapter = hasFullChapterNarration(chapter.id);
    const nextStartMs = shouldSeekIntoChapter
      ? getIntroSectionStartMs(chapter.id, nextFrameId, frames, activeNarrationScript.estimatedDurationMs)
      : 0;
    const nextProgress = Math.min(100, (nextStartMs / Math.max(1, activeNarrationScript.estimatedDurationMs)) * 100);

    setShowIntro(false);
    setChapterEndOpen(false);
    setNarrationPhase(shouldSeekIntoChapter ? 'intro' : 'section');
    setActiveFrameId(nextFrameId);
    setAutopilot({ status: 'playing', started: true });
    setSectionProgress(nextProgress);
    setTimelineElapsedMs(nextStartMs);
    setPlaybackRunId(current => current + 1);
    setSeekRequest(current => ({ id: (current?.id ?? 0) + 1, elapsedMs: nextStartMs }));
    setDemoActionRequest(null);
    setActionPulseTarget(null);
    setCardFlashTarget(null);
    sectionElapsedRef.current = nextStartMs;
    updateChapterUrl(chapter.id, nextFrameId, { showMode, autoplay: true, phase: shouldSeekIntoChapter ? 'intro' : 'section' });
  }, [activeNarrationScript.estimatedDurationMs, chapter, frames, showMode]);

  const advanceFrame = useCallback(() => {
    if (nextFrame) {
      selectFrame(nextFrame.id);
      return;
    }

    setNarrationPhase('closing');
    setAutopilot({ status: 'playing', started: true });
    setChapterEndOpen(false);
    updateChapterUrl(chapter.id, activeFrame.id, { showMode, autoplay: true });
  }, [activeFrame.id, chapter.id, nextFrame, selectFrame, showMode]);

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
    setNarrationPhase('section');
    setChapterEndOpen(false);
    setSectionProgress(0);
    setTimelineElapsedMs(0);
    setPlaybackRunId(current => current + 1);
    setDemoActionRequest(null);
    setActionPulseTarget(null);
    setCardFlashTarget(null);
    sectionElapsedRef.current = 0;
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

  const scrollToDemoAnchor = useCallback((anchor: string) => {
    const root = stageRef.current;
    if (!root) return;
    const target = root.querySelector(`[data-demo-anchor="${anchor}"]`) as HTMLElement | null;
    if (!target) return;

    if (anchor === 'project-cost-summary') {
      let scroller: HTMLElement | null = target.parentElement;
      while (scroller && scroller !== root) {
        const styles = window.getComputedStyle(scroller);
        const canScroll = /(auto|scroll)/.test(styles.overflowY) && scroller.scrollHeight > scroller.clientHeight;
        if (canScroll) break;
        scroller = scroller.parentElement;
      }

      if (scroller && scroller !== root) {
        const targetRect = target.getBoundingClientRect();
        const scrollerRect = scroller.getBoundingClientRect();
        const targetTop = targetRect.top - scrollerRect.top + scroller.scrollTop - 8;
        scroller.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
        return;
      }

      target.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'smooth' });
      return;
    }

    target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
  }, []);

  const cancelSlowScroll = useCallback(() => {
    if (scrollAnimationRef.current !== null) {
      window.cancelAnimationFrame(scrollAnimationRef.current);
      scrollAnimationRef.current = null;
    }
    if (scrollAnimationTargetRef.current) {
      scrollAnimationTargetRef.current.style.scrollBehavior = scrollAnimationBehaviorRef.current;
      scrollAnimationTargetRef.current = null;
    }
  }, []);

  const slowScrollToDemoAnchor = useCallback((anchor: string, durationMs: number) => {
    const root = stageRef.current;
    if (!root) return;
    const target = root.querySelector(`[data-demo-anchor="${anchor}"]`) as HTMLElement | null;
    if (!target) return;

    let scroller: HTMLElement | null = target.parentElement;
    while (scroller && scroller !== root) {
      const styles = window.getComputedStyle(scroller);
      const canScroll = /(auto|scroll)/.test(styles.overflowY) && scroller.scrollHeight > scroller.clientHeight;
      if (canScroll) break;
      scroller = scroller.parentElement;
    }

    if (!scroller || scroller === root) {
      target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
      return;
    }

    cancelSlowScroll();

    const targetRect = target.getBoundingClientRect();
    const scrollerRect = scroller.getBoundingClientRect();
    const startTop = scroller.scrollTop;
    const targetTop = targetRect.top - scrollerRect.top + scroller.scrollTop - Math.max(16, scroller.clientHeight * 0.08);
    const maxTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
    const endTop = Math.max(0, Math.min(maxTop, targetTop));
    const distance = endTop - startTop;
    const startedAt = performance.now();
    const safeDuration = Math.max(300, durationMs);
    const originalScrollBehavior = scroller.style.scrollBehavior;
    scrollAnimationTargetRef.current = scroller;
    scrollAnimationBehaviorRef.current = originalScrollBehavior;
    scroller.style.scrollBehavior = 'auto';

    const animate = (now: number) => {
      const progress = Math.max(0, Math.min(1, (now - startedAt) / safeDuration));
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      scroller.scrollTop = startTop + distance * eased;
      if (progress < 1) {
        scrollAnimationRef.current = window.requestAnimationFrame(animate);
        return;
      }
      scroller.scrollTop = endTop;
      scroller.style.scrollBehavior = originalScrollBehavior;
      scrollAnimationRef.current = null;
      scrollAnimationTargetRef.current = null;
    };

    scrollAnimationRef.current = window.requestAnimationFrame(animate);
  }, [cancelSlowScroll]);

  const runDemoAction = useCallback((actionId: string) => {
    const root = stageRef.current;
    const demoControl = root?.querySelector(`[data-demo-action="${actionId}"]`) as HTMLElement | null;
    if (root && demoControl) {
      const rect = demoControl.getBoundingClientRect();
      const rootRect = root.getBoundingClientRect();
      setActionPulseTarget({
        fallback: {
          left: ((rect.left - rootRect.left) / Math.max(1, rootRect.width)) * 100,
          top: ((rect.top - rootRect.top) / Math.max(1, rootRect.height)) * 100,
          width: (rect.width / Math.max(1, rootRect.width)) * 100,
          height: (rect.height / Math.max(1, rootRect.height)) * 100,
        },
      });
      if (actionPulseTimerRef.current) window.clearTimeout(actionPulseTimerRef.current);
      actionPulseTimerRef.current = window.setTimeout(() => setActionPulseTarget(null), 1700);
    }

    const target = getDemoActionAnchor(actionId);
    if (!demoControl && target) {
      setActionPulseTarget(target);
      if (actionPulseTimerRef.current) window.clearTimeout(actionPulseTimerRef.current);
      actionPulseTimerRef.current = window.setTimeout(() => setActionPulseTarget(null), 1300);
    }

    setDemoActionRequest({ actionId, nonce: Date.now() });
    const matchedFrame = allMissionFrames.find(frame => (
      frame.mission.trigger.type === 'demoAction' && frame.mission.trigger.action === actionId
    ));
    if (matchedFrame) completeMission(matchedFrame.mission.id);
  }, [allMissionFrames, completeMission]);

  const pulseDemoAnchor = useCallback((target: HotspotTarget, durationMs = 1400) => {
    setActionPulseTarget(target);
    if (actionPulseTimerRef.current) window.clearTimeout(actionPulseTimerRef.current);
    actionPulseTimerRef.current = window.setTimeout(() => setActionPulseTarget(null), durationMs);
  }, []);

  const flashDemoAnchor = useCallback((target: HotspotTarget, durationMs = 1150) => {
    setCardFlashTarget(target);
    if (cardFlashTimerRef.current) window.clearTimeout(cardFlashTimerRef.current);
    cardFlashTimerRef.current = window.setTimeout(() => setCardFlashTarget(null), durationMs);
  }, []);

  const handleTimelineCue = useCallback((cue: DemoTimelineCue) => {
    if (cue.type === 'scrollTo') {
      scrollToDemoAnchor(cue.anchor);
      return;
    }

    if (cue.type === 'slowScrollTo') {
      slowScrollToDemoAnchor(cue.anchor, cue.durationMs);
      return;
    }

    if (cue.type === 'spotlight' && cue.anchor) {
      if (DEMO_SPOTLIGHTS_ENABLED) scrollToDemoAnchor(cue.anchor);
      return;
    }

    if (cue.type === 'pulse') {
      pulseDemoAnchor({ anchor: cue.anchor, fallback: cue.fallback }, cue.durationMs);
      return;
    }

    if (cue.type === 'pinPulse') {
      return;
    }

    if (cue.type === 'flash') {
      flashDemoAnchor({ anchor: cue.anchor, fallback: cue.fallback }, cue.durationMs);
      return;
    }

    if (cue.type === 'demoAction') {
      runDemoAction(cue.actionId);
      return;
    }

    if (cue.type === 'clearDemoAction') {
      setDemoActionRequest(null);
      return;
    }

    if (cue.type === 'chapterPause' && narrationPhase === 'intro' && activeNarrationScript.requiresChapterConfirmation) {
      getDemoSections(chapter).forEach(section => {
        if (!isMissionComplete(section.mission.id)) completeMission(section.mission.id);
      });
      cancelSlowScroll();
      setDemoActionRequest(null);
      setActionPulseTarget(null);
      setCardFlashTarget(null);
      setNarrationPhase('chapterEnd');
      setChapterEndOpen(true);
      setAutopilot(current => ({ status: 'paused', started: current.started }));
      updateChapterUrl(chapter.id, activeFrame.id, { showMode, autoplay: false });
    }
  }, [activeFrame.id, activeNarrationScript.requiresChapterConfirmation, cancelSlowScroll, chapter, completeMission, flashDemoAnchor, isMissionComplete, narrationPhase, pulseDemoAnchor, runDemoAction, scrollToDemoAnchor, showMode, slowScrollToDemoAnchor]);

  const handleTimelineProgress = useCallback((progress: number, elapsedMs: number) => {
    setSectionProgress(progress);
    setTimelineElapsedMs(elapsedMs);
  }, []);

  const handlePlaybackBlocked = useCallback(() => {
    setAutopilot(current => current.status === 'playing'
      ? { status: 'paused', started: current.started }
      : current);
    updateChapterUrl(chapter.id, activeFrame.id, { showMode, autoplay: false });
    setStatusMessage('Audio did not start. Press Play once to continue with sound.');
    window.setTimeout(() => setStatusMessage('Guided demo ready'), 4200);
  }, [activeFrame.id, chapter.id, showMode]);

  const advanceMissionOrFrame = useCallback(() => {
    if (!isMissionComplete(activeFrame.mission.id)) completeMission(activeFrame.mission.id);
    advanceFrame();
  }, [activeFrame.mission.id, advanceFrame, completeMission, isMissionComplete]);

  const startBoardDemo = useCallback(() => {
    const firstChapter = DEMO_CHAPTERS[0];
    const firstSection = getDemoSections(firstChapter)[0];
    setShowMode(DEFAULT_SHOW_MODE);
    setShowIntro(false);
    setActiveId(firstChapter.id);
    setActiveFrameId(firstSection.id);
    setNarrationPhase('intro');
    setChapterEndOpen(false);
    setAutopilot({ status: 'playing', started: true });
    setSectionProgress(0);
    setTimelineElapsedMs(0);
    setPlaybackRunId(current => current + 1);
    setDemoActionRequest(null);
    setActionPulseTarget(null);
    setCardFlashTarget(null);
    sectionElapsedRef.current = 0;
    updateChapterUrl(firstChapter.id, firstSection.id, { showMode: DEFAULT_SHOW_MODE, autoplay: true, phase: 'intro' });
    setStatusMessage('SUCCESS: Board demo running');
    window.setTimeout(() => setStatusMessage('Guided demo ready'), 2400);
  }, []);

  const restartShow = useCallback(() => {
    const firstChapter = DEMO_CHAPTERS[0];
    const firstSection = getDemoSections(firstChapter)[0];
    setShowMode(DEFAULT_SHOW_MODE);
    setActiveId(firstChapter.id);
    setActiveFrameId(firstSection.id);
    setShowIntro(false);
    setNarrationPhase('intro');
    setChapterEndOpen(false);
    setAutopilot({ status: 'playing', started: true });
    setSectionProgress(0);
    setTimelineElapsedMs(0);
    setPlaybackRunId(current => current + 1);
    setDemoActionRequest(null);
    setActionPulseTarget(null);
    setCardFlashTarget(null);
    sectionElapsedRef.current = 0;
    updateChapterUrl(firstChapter.id, firstSection.id, { showMode: DEFAULT_SHOW_MODE, autoplay: true, phase: 'intro' });
  }, []);

  const toggleAutopilot = useCallback(() => {
    setShowIntro(false);
    if (chapterEndOpen) {
      setChapterEndOpen(false);
      setNarrationPhase('closing');
      setAutopilot({ status: 'playing', started: true });
      setPlaybackRunId(current => current + 1);
      updateChapterUrl(chapter.id, activeFrame.id, { showMode, autoplay: true });
      return;
    }
    const playing = autopilot.status !== 'playing';
    if (playing && !autopilot.started) {
      const firstSection = frames[0] ?? activeFrame;
      setActiveFrameId(firstSection.id);
      setNarrationPhase('intro');
      setSectionProgress(0);
      setTimelineElapsedMs(0);
      setPlaybackRunId(current => current + 1);
      setDemoActionRequest(null);
      setActionPulseTarget(null);
      setCardFlashTarget(null);
      setAutopilot({ status: 'playing', started: true });
      updateChapterUrl(chapter.id, firstSection.id, { showMode, autoplay: true, phase: 'intro' });
      return;
    }
    setAutopilot(current => ({ status: playing ? 'playing' : 'paused', started: current.started || playing }));
    updateChapterUrl(chapter.id, activeFrame.id, { showMode, autoplay: playing });
  }, [activeFrame, autopilot.started, autopilot.status, chapter.id, chapterEndOpen, frames, showMode]);

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

  useEffect(() => () => {
    if (actionPulseTimerRef.current) window.clearTimeout(actionPulseTimerRef.current);
    if (cardFlashTimerRef.current) window.clearTimeout(cardFlashTimerRef.current);
  }, []);

  useEffect(() => {
    setSectionProgress(0);
    setTimelineElapsedMs(0);
    setDemoActionRequest(null);
    setActionPulseTarget(null);
    setCardFlashTarget(null);
    sectionElapsedRef.current = 0;
  }, [activeFrame.id, narrationPhase, showMode]);

  useEffect(() => {
    if (!hotspotTarget.anchor) return;
    if (chapter.id === 'stagegates' && narrationPhase === 'intro') return;
    scrollToDemoAnchor(hotspotTarget.anchor);
  }, [activeFrame.id, chapter.id, hotspotTarget.anchor, narrationPhase, scrollToDemoAnchor]);

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

  useEffect(() => {
    if (!['projectcommand', 'stagegates', 'cost'].includes(chapter.id) || narrationPhase !== 'intro') return;
    if (timelineElapsedMs > 500) return;
    const root = stageRef.current;
    if (!root) return;
    const scrollers = root.querySelectorAll<HTMLElement>('.custom-scrollbar');
    scrollers.forEach(scroller => {
      scroller.scrollTop = 0;
    });
  }, [chapter.id, narrationPhase, timelineElapsedMs]);

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
      const shouldPlay = params.get('autoplay') === 'true';
      const phaseParam = params.get('phase');
      const nextNarrationPhase: DemoNarrationPhase = phaseParam === 'intro' || phaseParam === 'section'
        ? phaseParam
        : hasFullChapterNarration(next.chapterId) && shouldPlay ? 'intro' : 'section';
      setActiveId(current => {
        if (current === next.chapterId) return current;
        setChapterEndOpen(false);
        setNarrationPhase(nextNarrationPhase);
        return next.chapterId;
      });
      setActiveFrameId(current => {
        if (current === next.frameId) return current;
        setChapterEndOpen(false);
        setNarrationPhase(nextNarrationPhase);
        return next.frameId;
      });
      if (shouldPlay) setNarrationPhase(nextNarrationPhase);
      setAutopilot(current => {
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
    if (!demoInteractionLocked) return undefined;

    const blockInteraction = (event: Event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest('[data-demo-pause-control="true"], [data-demo-navigation-control="true"], [data-demo-timecode-control="true"]')) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };

    const lockedEvents = [
      'click',
      'contextmenu',
      'dblclick',
      'mousedown',
      'mouseup',
      'pointerdown',
      'pointerup',
      'touchstart',
      'touchend',
    ];

    lockedEvents.forEach(eventName => document.addEventListener(eventName, blockInteraction, true));
    return () => {
      lockedEvents.forEach(eventName => document.removeEventListener(eventName, blockInteraction, true));
    };
  }, [demoInteractionLocked]);

  useEffect(() => {
    if (autopilot.status === 'playing') return;
    cancelSlowScroll();
  }, [autopilot.status, cancelSlowScroll]);

  useEffect(() => {
    return () => cancelSlowScroll();
  }, [cancelSlowScroll]);

  useEffect(() => {
    if (chapter.id !== 'portfolio' || narrationPhase !== 'intro') return;

    if (timelineElapsedMs < PORTFOLIO_GIS_HANDOFF_MS) {
      if (demoActionRequest?.actionId === 'open-property-command') setDemoActionRequest(null);
      return;
    }

    if (timelineElapsedMs >= PORTFOLIO_PROPERTIES_RECAP_MS) {
      if (demoActionRequest?.actionId === 'open-property-command') setDemoActionRequest(null);
      return;
    }

    if (timelineElapsedMs >= PORTFOLIO_GIS_HANDOFF_MS && demoActionRequest?.actionId !== 'open-property-command') {
      setDemoActionRequest({ actionId: 'open-property-command', nonce: Date.now() });
    }
  }, [chapter.id, demoActionRequest?.actionId, narrationPhase, timelineElapsedMs]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select')) return;

      if (autopilot.status === 'playing' && event.key !== ' ') {
        event.preventDefault();
        return;
      }

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
  }, [advanceMissionOrFrame, autopilot.status, goBack, toggleAutopilot]);

  const handleNarrationEnded = useCallback(() => {
    if (autopilot.status !== 'playing') return;

    if (narrationPhase === 'intro') {
      if (activeNarrationScript.requiresChapterConfirmation) {
        getDemoSections(chapter).forEach(section => {
          if (!isMissionComplete(section.mission.id)) completeMission(section.mission.id);
        });
        cancelSlowScroll();
        setDemoActionRequest(null);
        setActionPulseTarget(null);
        setCardFlashTarget(null);
        setNarrationPhase('chapterEnd');
        setChapterEndOpen(true);
        setAutopilot(current => ({ status: 'paused', started: current.started }));
        updateChapterUrl(chapter.id, activeFrame.id, { showMode, autoplay: false });
        return;
      }

      setNarrationPhase('section');
      return;
    }

    if (narrationPhase === 'section') {
      completeMission(activeFrame.mission.id);
      if (nextFrame) {
        selectFrame(nextFrame.id);
        return;
      }
      setNarrationPhase('closing');
      return;
    }

    if (narrationPhase === 'closing') {
      cancelSlowScroll();
      setDemoActionRequest(null);
      setActionPulseTarget(null);
      setCardFlashTarget(null);
      setNarrationPhase('chapterEnd');
      setChapterEndOpen(true);
      setAutopilot(current => ({ status: 'paused', started: current.started }));
      updateChapterUrl(chapter.id, activeFrame.id, { showMode, autoplay: false });
    }
  }, [activeFrame.id, activeFrame.mission.id, activeNarrationScript.requiresChapterConfirmation, autopilot.status, cancelSlowScroll, chapter, completeMission, isMissionComplete, narrationPhase, nextFrame, selectFrame, showMode]);

  const continueToNextChapter = useCallback(() => {
    const nextIndex = (activeIndex + 1) % DEMO_CHAPTERS.length;
    const targetChapter = DEMO_CHAPTERS[nextIndex];
    const firstSection = getDemoSections(targetChapter)[0];
    setShowIntro(false);
    setChapterEndOpen(false);
    setActiveId(targetChapter.id);
    setActiveFrameId(firstSection.id);
    setNarrationPhase('intro');
    setAutopilot({ status: 'playing', started: true });
    setSectionProgress(0);
    setTimelineElapsedMs(0);
    setPlaybackRunId(current => current + 1);
    setDemoActionRequest(null);
    setActionPulseTarget(null);
    setCardFlashTarget(null);
    updateChapterUrl(targetChapter.id, firstSection.id, { showMode, autoplay: true, phase: 'intro' });
  }, [activeIndex, showMode]);

  const replayChapter = useCallback(() => {
    const firstSection = frames[0];
    setShowIntro(false);
    setChapterEndOpen(false);
    setActiveFrameId(firstSection.id);
    setNarrationPhase('intro');
    setAutopilot({ status: 'playing', started: true });
    setSectionProgress(0);
    setTimelineElapsedMs(0);
    setPlaybackRunId(current => current + 1);
    setDemoActionRequest(null);
    setActionPulseTarget(null);
    setCardFlashTarget(null);
    updateChapterUrl(chapter.id, firstSection.id, { showMode, autoplay: true, phase: 'intro' });
  }, [chapter.id, frames, showMode]);

  const replaySection = useCallback(() => {
    setShowIntro(false);
    setChapterEndOpen(false);
    setNarrationPhase('section');
    setAutopilot({ status: 'playing', started: true });
    setSectionProgress(0);
    setTimelineElapsedMs(0);
    setPlaybackRunId(current => current + 1);
    setDemoActionRequest(null);
    setActionPulseTarget(null);
    setCardFlashTarget(null);
    updateChapterUrl(chapter.id, activeFrame.id, { showMode, autoplay: true, phase: 'section' });
  }, [activeFrame.id, chapter.id, showMode]);

  const closeChapterEndPanel = useCallback(() => {
    setChapterEndOpen(false);
    setNarrationPhase('section');
    setAutopilot(current => ({ status: 'paused', started: current.started }));
    updateChapterUrl(chapter.id, activeFrame.id, { showMode, autoplay: false });
  }, [activeFrame.id, chapter.id, showMode]);

  const railItems = useMemo(() => DEMO_CHAPTERS, []);

  if (showIntro) {
    return (
      <ExecutiveControlRoom
        onStart={startBoardDemo}
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
            <div className="truncate text-[15px] font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>DevelopmentX</div>
            <div className="truncate text-[11px] font-semibold text-[#7A94B4]">Powered by 4C360</div>
          </div>
        </div>
        <div
          data-demo-timecode="true"
          data-demo-timecode-control="true"
          className="hidden h-12 min-w-0 max-w-[560px] flex-1 items-center gap-3 rounded-xl border border-cyan-300/20 bg-[#030A15]/74 px-3 py-1 shadow-lg shadow-black/20 md:flex"
        >
          <div className="min-w-[88px]">
            <div className="font-mono text-[17px] font-black leading-none text-white">{timecodeElapsed}</div>
            <div className="mt-0.5 font-mono text-[10px] font-bold text-[#8EA7C7]">/ {timecodeTotal}</div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex min-w-0 items-center gap-2 text-[9px] font-black uppercase tracking-[0.16em] text-cyan-200">
              <span>{timecodeChapterLabel}</span>
              <span className="h-1 w-1 rounded-full bg-cyan-200/70" />
              <span className="truncate">{timecodePhaseLabel}</span>
              <span className="hidden min-w-0 truncate text-[#7A94B4] lg:block">{chapter.label} · {activeFrame.title}</span>
            </div>
            <input
              data-demo-timecode-control="true"
              type="range"
              min={0}
              max={100}
              value={timecodeSeekPercent}
              onInput={event => seekToTimecodePercent(Number(event.currentTarget.value))}
              onChange={event => seekToTimecodePercent(Number(event.target.value))}
              className="h-1.5 w-full cursor-pointer accent-cyan-300"
              aria-label="Demo audio timeline"
            />
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              data-demo-timecode-control="true"
              onClick={() => seekToTimecodePercent(timecodeSeekPercent - Math.round((10000 / Math.max(1, activeNarrationScript.estimatedDurationMs)) * 100))}
              className="flex h-7 w-9 items-center justify-center rounded-lg border border-[#2E7FFF]/24 bg-[#06101F] font-mono text-[10px] font-black text-cyan-100 transition-colors hover:border-cyan-300/45 hover:bg-cyan-300/10"
              aria-label="Rewind 10 seconds"
            >
              -10
            </button>
            <button
              type="button"
              data-demo-timecode-control="true"
              onClick={() => seekToTimecodePercent(timecodeSeekPercent + Math.round((10000 / Math.max(1, activeNarrationScript.estimatedDurationMs)) * 100))}
              className="flex h-7 w-9 items-center justify-center rounded-lg border border-[#2E7FFF]/24 bg-[#06101F] font-mono text-[10px] font-black text-cyan-100 transition-colors hover:border-cyan-300/45 hover:bg-cyan-300/10"
              aria-label="Forward 10 seconds"
            >
              +10
            </button>
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

      <div className="grid h-[calc(100vh-64px)] min-h-0 grid-cols-1 overflow-y-auto md:grid-cols-[72px_minmax(0,1fr)] md:overflow-hidden 2xl:grid-cols-[232px_minmax(0,1fr)]">
        <aside className="min-h-0 border-b border-[#2E7FFF]/16 bg-[#07111F] p-2 md:border-b-0 md:border-r 2xl:p-3">
          <div className="mb-2 flex items-center justify-between gap-2 md:justify-center 2xl:justify-between">
            <div className="md:hidden 2xl:block">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">Story path</div>
              <div className="mt-1 text-[11px] font-bold text-[#8EA7C7]">
                {activeAct.label} · {activeActProgress.completed}/{activeActProgress.total} sections
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-[#13294A]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#22D3EE,#2E7FFF,#7C3AED)] transition-all duration-300"
                  style={{ width: `${Math.round((activeActProgress.completed / Math.max(1, activeActProgress.total)) * 100)}%` }}
                />
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                data-demo-pause-control="true"
                onClick={toggleAutopilot}
                className={`relative z-[1100] inline-flex h-9 w-9 items-center justify-center rounded-lg border text-white transition-colors ${autopilot.status === 'playing' ? 'border-violet-300/34 bg-violet-400/20' : 'border-[#2E7FFF]/22 bg-[#0A1628] hover:bg-[#112040]'}`}
                aria-label={autopilot.status === 'playing' ? 'Pause narration' : 'Start narration'}
              >
                {autopilot.status === 'playing' ? <Pause size={15} /> : <Play size={15} />}
              </button>
            </div>
          </div>

          <div className="custom-scrollbar flex gap-2 overflow-x-auto pb-1 md:block md:max-h-[calc(100vh-132px)] md:space-y-1.5 md:overflow-y-auto md:pr-0 2xl:pr-1">
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
                    data-demo-navigation-control="true"
                    onClick={() => selectChapter(item.id)}
                    className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left transition-all md:justify-center md:px-2 2xl:justify-start 2xl:px-3 ${
                      active
                        ? 'border-[#2E7FFF]/50 bg-[#2E7FFF]/16 text-white shadow-[0_0_22px_rgba(46,127,255,0.14)]'
                        : 'border-transparent bg-[#0A1628]/70 text-[#8EA7C7] hover:border-[#2E7FFF]/22 hover:bg-[#112040]'
                    }`}
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${active ? 'border-cyan-300/30 bg-cyan-300/12 text-cyan-200' : 'border-[#2E7FFF]/14 bg-[#07111F] text-[#7A94B4]'}`}>
                      {itemDone ? <CheckCircle2 size={15} /> : <Icon size={15} />}
                    </span>
                    <span className="min-w-0 md:hidden 2xl:block">
                      <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-[#5F7FA8]">Chapter {String(index + 1).padStart(2, '0')} · {itemAct.label}</span>
                      <span className="block truncate text-[12px] font-black">{item.label}</span>
                      <span className="block text-[9px] font-black uppercase tracking-[0.12em] text-[#5F7FA8]">{itemCompleted}/{itemFrames.length} sections</span>
                    </span>
                  </button>
                  {active && (
                    <div className="mt-1.5 hidden space-y-1 pl-10 2xl:block">
                      {itemFrames.map((frame, frameIndex) => {
                        const frameActive = active && syncedActiveFrameId === frame.id;
                        const complete = completedMissionSet.has(frame.mission.id);
                        return (
                          <button
                            key={frame.id}
                            type="button"
                            data-demo-navigation-control="true"
                            data-demo-chapter-id={item.id}
                            data-demo-section-id={frame.id}
                            onClick={() => selectChapter(item.id, frame.id)}
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

        <main className="min-h-[620px] min-w-0 overflow-hidden bg-[#06101F] p-2 md:min-h-0">
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#2E7FFF]/22 bg-[#0A1628] shadow-2xl shadow-black/30">
            <div className="hidden flex-shrink-0 border-b border-[#2E7FFF]/14 bg-[#07111F] px-4 py-2">
              <ValueSpine totals={outcomeTotals} />
            </div>
            <div className="flex flex-shrink-0 items-center gap-2 overflow-x-auto border-b border-[#2E7FFF]/14 bg-[#07111F] px-3 py-2 2xl:hidden">
              <div className="hidden shrink-0 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200 sm:block">
                Sections
              </div>
              {frames.map((frame, frameIndex) => {
                const frameActive = syncedActiveFrameId === frame.id;
                const complete = completedMissionSet.has(frame.mission.id);
                return (
                  <button
                    key={frame.id}
                    type="button"
                    data-demo-navigation-control="true"
                    data-demo-chapter-id={chapter.id}
                    data-demo-section-id={frame.id}
                    onClick={() => selectFrame(frame.id)}
                    className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border px-3 text-[11px] font-black transition-colors ${
                      frameActive
                        ? 'border-cyan-300/38 bg-cyan-300/14 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.12)]'
                        : 'border-[#2E7FFF]/14 bg-[#06101F] text-[#8EA7C7] hover:border-[#2E7FFF]/30 hover:bg-[#112040] hover:text-white'
                    }`}
                    aria-label={`Play ${chapter.label} section ${frameIndex + 1}: ${frame.title}`}
                  >
                    <span>{frameIndex + 1}. {frame.title}</span>
                    {complete && <CheckCircle2 size={12} className="shrink-0 text-emerald-200" />}
                  </button>
                );
              })}
            </div>
            <div ref={stageRef} className="relative min-h-0 flex-1 overflow-hidden">
              <DemoTimelinePlayer
                script={activeNarrationScript}
                status={chapterEndOpen ? 'paused' : autopilot.status}
                playbackKey={narrationPlaybackKey}
                seekRequest={seekRequest}
                onEnded={handleNarrationEnded}
                onProgress={handleTimelineProgress}
                onCue={handleTimelineCue}
                onPlaybackBlocked={handlePlaybackBlocked}
              />
              <DemoStage
                key={`${chapter.id}:${activeFrame.id}`}
                chapter={chapter}
                section={activeFrame}
                onToast={onToast}
                onOpenChapter={selectChapter}
                totals={outcomeTotals}
                onCopySummary={copyOutcomeSummary}
                demoActionRequest={demoActionRequest}
                demoPlaying={autopilot.status === 'playing'}
                demoTimelineMs={timelineElapsedMs}
                demoOverlayReset={chapterEndOpen}
                portfolioGisActive={portfolioGisActive}
                portfolioGisZoomedOut={portfolioGisZoomedOut}
                portfolioJltPinPulsing={portfolioJltPinPulsing}
                portfolioJltDrawerOpen={portfolioJltDrawerOpen}
                portfolioPropertyCommandScrollActive={portfolioPropertyCommandScrollActive}
                portfolioManagerActionActive={portfolioManagerActionActive}
                portfolioSmartDispatchScrollActive={portfolioSmartDispatchScrollActive}
                portfolioSmartDispatchActive={portfolioSmartDispatchActive}
                portfolioSmartDispatchAssigned={portfolioSmartDispatchAssigned}
                portfolioPropertiesRecapActive={portfolioPropertiesRecapActive}
                portfolioRecapFadeProgress={portfolioRecapFadeProgress}
                portfolioReportSequenceActive={portfolioReportSequenceActive}
              />
              {!chapterEndOpen && portfolioPropertiesRecapActive && portfolioRecapFadeProgress < 1 && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 z-20 bg-[#030A15] transition-opacity duration-700"
                  style={{ opacity: Math.max(0, 0.52 - portfolioRecapFadeProgress * 0.52) }}
                />
              )}
              {portfolioClarityRevealVisible && <PortfolioClarityReveal elapsedMs={timelineElapsedMs} />}
              {!chapterEndOpen && autopilot.started && narrationPhase === 'intro' && !hasFullChapterNarration(chapter.id) && <IntroDashboardReveal progress={sectionProgress} />}
              {spotlightVisible && <StageSpotlight box={anchorBox} fallback={hotspotTarget.fallback} />}
              {!chapterEndOpen && portfolioSmartDispatchActive && (
                <StageSpotlight box={smartDispatchSpotlightBox} fallback={smartDispatchSpotlightTarget.fallback} variant="frame" />
              )}
              {!chapterEndOpen && chapterTitleVisible && <ChapterTitleOverlay chapter={chapter} progress={sectionProgress} />}
              {!chapterEndOpen && cardFlashTarget && <DemoCardFlash box={cardFlashBox} />}
              {!chapterEndOpen && !portfolioPropertiesRecapActive && portfolioJltPinClickActive && <DemoActionPulse box={jltPinClickBox} />}
              {!chapterEndOpen && !portfolioPropertiesRecapActive && actionPulseTarget && <DemoActionPulse box={actionPulseBox} />}
              {chapterEndOpen && (
                <ChapterEndPanel
                  chapter={chapter}
                  nextChapter={nextChapter}
                  section={activeFrame}
                  onClose={closeChapterEndPanel}
                  onNextChapter={continueToNextChapter}
                  onReplayChapter={replayChapter}
                  onToast={onToast}
                />
              )}
            </div>
            <div className="hidden">
              <div className="grid items-center gap-2 md:grid-cols-[40px_minmax(0,1fr)_40px_140px]">
                <button
                  type="button"
                  onClick={goBack}
                  className="flex h-10 items-center justify-center rounded-xl border border-[#2E7FFF]/22 bg-[#0A1628] text-[#B8C7DB] transition-colors hover:bg-[#112040] hover:text-white"
                  aria-label="Previous section"
                >
                  <ChevronLeft size={17} />
                </button>
                <div className="min-w-0 rounded-xl border border-[#2E7FFF]/14 bg-[#06101F] px-3 py-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-[12px] font-black text-white">{activeFrame.title}</div>
                      <div className="mt-0.5 truncate text-[10px] font-black uppercase tracking-[0.12em] text-[#5F7FA8]">
                        Section {activeFrameIndex + 1}/{frames.length} · {getShowModeOption(showMode).durationLabel}
                      </div>
                    </div>
                    {activeSectionComplete && <CheckCircle2 size={16} className="shrink-0 text-emerald-200" />}
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#13294A]">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#2E7FFF,#22D3EE,#7C3AED)] transition-all duration-300"
                      style={{ width: `${sectionControlProgress}%` }}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={restartShow}
                  className="flex h-10 items-center justify-center rounded-xl border border-[#2E7FFF]/22 bg-[#0A1628] text-[#B8C7DB] transition-colors hover:bg-[#112040] hover:text-white"
                  aria-label="Restart board demo"
                >
                  <TimerReset size={16} />
                </button>
                <button
                  type="button"
                  onClick={advanceMissionOrFrame}
                  className="flex h-10 min-w-0 items-center justify-center gap-2 rounded-xl bg-[#2E7FFF] px-3 text-[12px] font-black text-white shadow-lg shadow-blue-950/30 transition-colors hover:bg-[#4B91FF]"
                >
                  <span className="truncate">{nextSectionLabel}</span>
                  <ChevronRight size={16} className="shrink-0" />
                </button>
              </div>
            </div>
          </div>
        </main>

        <aside className="hidden">
          <div className="custom-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">Mission HUD</div>
                <div className="rounded-full border border-[#2E7FFF]/22 bg-[#0A1628] px-2 py-1 text-[10px] font-black text-[#8DBDFF]">
                  {activeMissionComplete ? 'Complete' : `${activeFrameIndex + 1}/${frames.length}`}
                </div>
              </div>
              <h1 className="mt-1.5 text-[19px] font-black leading-tight text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{activeFrame.headline}</h1>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {[
                  [`-${activeFrame.outcome.riskReduction}`, 'risk'],
                  [`+${activeFrame.outcome.readinessGain}`, 'ready'],
                  [`${activeFrame.outcome.timeSavedMinutes}m`, 'save'],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-lg border border-[#2E7FFF]/16 bg-[#0A1628] px-2 py-1.5 text-center">
                    <div className="text-[14px] font-black text-white">{value}</div>
                    <div className="text-[8px] font-black uppercase tracking-[0.12em] text-[#5F7FA8]">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <section className="rounded-xl border border-cyan-300/18 bg-cyan-300/10 px-3 py-2.5">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200">Goal</div>
              <p className="mt-1 text-[13px] font-black leading-5 text-white">{activeFrame.nextAction}</p>
            </section>

            <section className={`rounded-xl border px-3 py-2.5 ${activeMissionComplete ? 'border-emerald-300/24 bg-emerald-300/10' : 'border-[#2E7FFF]/22 bg-[#0A1628]'}`}>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={15} className={`mt-0.5 shrink-0 ${activeMissionComplete ? 'text-emerald-200' : 'text-[#5F7FA8]'}`} />
                <div className="min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8DBDFF]">Win condition</div>
                  <p className="mt-1 text-[12px] font-bold leading-5 text-white">{activeFrame.decisionQuestion}</p>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[#8EA7C7]">{activeFrame.clientValue}</p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-[#2E7FFF]/18 bg-[#0A1628] p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#7A94B4]">Pace</div>
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
                    data-demo-navigation-control="true"
                    data-demo-chapter-id={chapter.id}
                    data-demo-section-id={frame.id}
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
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#7A94B4]">Playbook</div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2 py-1 text-[10px] font-black text-cyan-100">Risk</span>
                  <span className="text-[#5F7FA8]">→</span>
                  <span className="rounded-full border border-[#2E7FFF]/22 bg-[#2E7FFF]/12 px-2 py-1 text-[10px] font-black text-[#DCEBFF]">Owner</span>
                  <span className="text-[#5F7FA8]">→</span>
                  <span className="rounded-full border border-emerald-300/22 bg-emerald-300/10 px-2 py-1 text-[10px] font-black text-emerald-100">Recovery</span>
                </div>
              </div>
              <div className="border-t border-[#2E7FFF]/12 px-3 py-2">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-200">Say this</div>
                <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-amber-50">{activeFrame.narration.caption}</p>
              </div>
              <div className="border-t border-[#2E7FFF]/12 px-3 py-2">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-200">Next click</div>
                <p className="mt-1 text-[12px] font-bold leading-5 text-emerald-50">{activeFrame.mission.actionLabel}</p>
              </div>
              <div className="border-t border-[#2E7FFF]/12 px-3 py-2">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200">Unlocked</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {activeFrame.features.map(feature => (
                    <span key={feature} className="rounded-full border border-[#2E7FFF]/18 bg-[#07111F] px-2 py-1 text-[10px] font-bold text-[#B8C7DB]">{feature}</span>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-[#2E7FFF]/18 bg-[#0A1628] px-3 py-2">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#7A94B4]">Reward</div>
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
      <div className="hidden">
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
