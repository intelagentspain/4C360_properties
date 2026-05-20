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

function buildShareUrl(chapterId: string) {
  const url = new URL('/demo/properties', window.location.origin);
  url.searchParams.set('chapter', chapterId);
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
    tryLabel: 'Surface gate blocker',
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

function resolveInitialChapter() {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get('chapter');
  return DEMO_CHAPTERS.some(chapter => chapter.id === requested) ? requested! : DEMO_CHAPTERS[0].id;
}

function updateChapterUrl(chapterId: string) {
  const url = new URL(window.location.href);
  url.searchParams.set('chapter', chapterId);
  window.history.replaceState({}, '', `${url.pathname}?${url.searchParams.toString()}${url.hash}`);
}

function useAnchorBox(stageRef: RefObject<HTMLDivElement | null>, chapter: DemoChapter) {
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

        const anchor = root.querySelector(`[data-demo-anchor="${chapter.anchor}"]`) as HTMLElement | null;
        if (!anchor) {
          setBox(null);
          return;
        }

        const rootRect = root.getBoundingClientRect();
        const rect = anchor.getBoundingClientRect();
        const fallbackBox = (): AnchorBox => {
          const left = (rootRect.width * chapter.fallback.left) / 100;
          const top = (rootRect.height * chapter.fallback.top) / 100;
          const width = (rootRect.width * chapter.fallback.width) / 100;
          const height = (rootRect.height * chapter.fallback.height) / 100;
          return {
            left: Math.max(10, Math.min(left, rootRect.width - 90)),
            top: Math.max(10, Math.min(top, rootRect.height - 70)),
            width: Math.max(84, Math.min(width, rootRect.width - left - 10)),
            height: Math.max(42, Math.min(height, rootRect.height - top - 10)),
            stageWidth: rootRect.width,
            stageHeight: rootRect.height,
          };
        };
        const relativeLeft = rect.left - rootRect.left;
        const relativeTop = rect.top - rootRect.top;
        const startsNearSurfaceOrigin = relativeLeft < rootRect.width * 0.12 && relativeTop < rootRect.height * 0.12;
        const isFullSurface = startsNearSurfaceOrigin && rect.width > rootRect.width * 0.82 && rect.height > rootRect.height * 0.66;
        if (isFullSurface) {
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
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    const interval = window.setInterval(measure, 900);
    stage.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.clearInterval(interval);
      stage.removeEventListener('scroll', measure, true);
      window.removeEventListener('resize', measure);
    };
  }, [chapter.anchor, stageRef]);

  return box;
}

function StageHotspot({ box }: { box: AnchorBox | null }) {
  if (!box) return null;

  const highlightStyle: CSSProperties = { left: box.left, top: box.top, width: box.width, height: box.height };

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute z-30 rounded-2xl border border-cyan-300/80 bg-cyan-300/[0.055] shadow-[0_0_0_9999px_rgba(3,10,21,0.16),0_0_32px_rgba(34,211,238,0.34)]"
      style={highlightStyle}
    >
      <div className="absolute -right-2 -top-2 h-5 w-5 rounded-full border border-cyan-200 bg-cyan-300 shadow-[0_0_22px_rgba(34,211,238,0.8)]" />
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
  const [autoplay, setAutoplay] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Guided demo ready');
  const [shareCopied, setShareCopied] = useState(false);
  const [sharePanelOpen, setSharePanelOpen] = useState(false);
  const shareInputRef = useRef<HTMLInputElement>(null);

  const activeIndex = Math.max(0, DEMO_CHAPTERS.findIndex(chapter => chapter.id === activeId));
  const chapter = DEMO_CHAPTERS[activeIndex] ?? DEMO_CHAPTERS[0];
  const anchorBox = useAnchorBox(stageRef, chapter);
  const progress = Math.round(((activeIndex + 1) / DEMO_CHAPTERS.length) * 100);
  const shareUrl = useMemo(() => buildShareUrl(chapter.id), [chapter.id]);

  const selectChapter = useCallback((chapterId: string) => {
    setActiveId(chapterId);
    updateChapterUrl(chapterId);
  }, []);

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
      onToast('Share link copied for this chapter', 'success');
      window.setTimeout(() => setShareCopied(false), 2200);
      return;
    }

    window.setTimeout(() => shareInputRef.current?.select(), 0);
    onToast('Share link ready to copy below', 'info');
  }, [onToast, shareUrl]);

  useEffect(() => {
    setShareCopied(false);
  }, [chapter.id]);

  const openLivePage = useCallback(() => {
    window.location.href = chapter.livePath;
  }, [chapter.livePath]);

  const tryChapter = useCallback(() => {
    onToast(`${chapter.tryLabel}: demo focus is active on the live product surface`, 'success');
  }, [chapter.tryLabel, onToast]);

  useEffect(() => {
    const syncFromBrowser = () => {
      const next = resolveInitialChapter();
      setActiveId(next);
    };
    window.addEventListener('popstate', syncFromBrowser);
    return () => window.removeEventListener('popstate', syncFromBrowser);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select')) return;

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goBy(1);
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goBy(-1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goBy]);

  useEffect(() => {
    if (!autoplay) return undefined;
    const interval = window.setInterval(() => goBy(1), 8500);
    return () => window.clearInterval(interval);
  }, [autoplay, goBy]);

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
            aria-label={shareCopied ? 'Share link copied' : 'Share this chapter'}
          >
            {shareCopied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
            <span className="hidden sm:inline">{shareCopied ? 'Copied' : 'Share'}</span>
          </button>
          {sharePanelOpen && (
            <div className="absolute right-0 top-12 z-50 w-[min(420px,calc(100vw-32px))] rounded-xl border border-[#2E7FFF]/24 bg-[#07111F] p-3 shadow-2xl shadow-black/50">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.16em] text-cyan-200">Share chapter</div>
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

      <div className="grid h-[calc(100vh-64px)] min-h-0 grid-cols-1 overflow-y-auto lg:grid-cols-[248px_minmax(0,1fr)_330px] lg:overflow-hidden">
        <aside className="min-h-0 border-b border-[#2E7FFF]/16 bg-[#07111F] p-3 lg:border-b-0 lg:border-r">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8DBDFF]">Guided path</div>
              <div className="mt-1 text-[11px] text-[#7A94B4]">{activeIndex + 1} of {DEMO_CHAPTERS.length} chapters</div>
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

          <div className="custom-scrollbar flex gap-2 overflow-x-auto pb-1 lg:block lg:max-h-[calc(100vh-150px)] lg:space-y-1.5 lg:overflow-y-auto lg:pr-1">
            {railItems.map((item, index) => {
              const Icon = item.icon;
              const active = item.id === chapter.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectChapter(item.id)}
                  className={`flex min-w-[170px] items-center gap-2 rounded-xl border px-3 py-2 text-left transition-all lg:min-w-0 lg:w-full ${
                    active
                      ? 'border-[#2E7FFF]/50 bg-[#2E7FFF]/16 text-white shadow-[0_0_22px_rgba(46,127,255,0.14)]'
                      : 'border-transparent bg-[#0A1628]/70 text-[#8EA7C7] hover:border-[#2E7FFF]/22 hover:bg-[#112040]'
                  }`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${active ? 'border-cyan-300/30 bg-cyan-300/12 text-cyan-200' : 'border-[#2E7FFF]/14 bg-[#07111F] text-[#7A94B4]'}`}>
                    <Icon size={15} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-[#5F7FA8]">{String(index + 1).padStart(2, '0')}</span>
                    <span className="block truncate text-[12px] font-black">{item.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="min-h-[620px] min-w-0 overflow-hidden bg-[#06101F] p-3 lg:min-h-0">
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#2E7FFF]/22 bg-[#0A1628] shadow-2xl shadow-black/30">
            <div className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-[#2E7FFF]/14 bg-[#07111F] px-4 py-2.5">
              <div className="min-w-0">
                <div className="truncate text-[13px] font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{chapter.label}</div>
                <div className="truncate text-[10px] font-bold uppercase tracking-[0.15em] text-[#5F7FA8]">Actual 4C360 surface</div>
                <div className="mt-0.5 truncate text-[11px] font-semibold text-cyan-100/90">Focus: {chapter.headline}</div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-200">Live demo data</span>
              </div>
            </div>
            <div ref={stageRef} className="relative min-h-0 flex-1 overflow-hidden">
              <DemoStage key={chapter.id} chapter={chapter} onToast={onToast} onOpenChapter={selectChapter} />
              <StageHotspot box={anchorBox} />
            </div>
          </div>
        </main>

        <aside className="custom-scrollbar min-h-0 overflow-y-auto border-t border-[#2E7FFF]/16 bg-[#07111F] p-3 lg:border-l lg:border-t-0">
          <div className="flex min-h-full flex-col gap-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">Why this matters</div>
              <h1 className="mt-2 text-[21px] font-black leading-tight text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{chapter.headline}</h1>
              <p className="mt-2 text-[12px] leading-5 text-[#B8C7DB]">{chapter.story}</p>
            </div>

            <section className="rounded-xl border border-[#2E7FFF]/18 bg-[#0A1628]">
              <div className="px-3 py-2.5">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#7A94B4]">Client value</div>
                <p className="mt-1 text-[12px] leading-5 text-[#E6EEF9]">{chapter.clientValue}</p>
              </div>
              <div className="border-t border-[#2E7FFF]/12 px-3 py-2.5">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-200">Client question</div>
                <p className="mt-1 text-[12px] leading-5 text-amber-50">{chapter.decisionQuestion}</p>
              </div>
              <div className="border-t border-[#2E7FFF]/12 px-3 py-2.5">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-200">Next action</div>
                <p className="mt-1 text-[12px] leading-5 text-emerald-50">{chapter.nextAction}</p>
              </div>
            </section>

            <div className="mt-auto space-y-2">
              <button
                type="button"
                onClick={tryChapter}
                className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-3 py-2.5 text-center text-[12px] font-black leading-tight text-white shadow-lg shadow-violet-950/30 transition-colors hover:bg-[#6D28D9]"
              >
                <Sparkles size={15} className="shrink-0" />
                <span className="min-w-0">{chapter.tryLabel}</span>
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => goBy(-1)}
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
                  Next
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
