import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock3,
  Copy,
  Gauge,
  MessageSquare,
  PenLine,
  Send,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import type { ProjectCommandScreen } from '../types';
import { getBudgetControlData } from '../data/budgetControl';
import type { ProjectCommandDataset } from '../data/portfolio';
import { useSelectedProjectCommandData } from '../useProjectCommandData';

type Urgency = 'critical' | 'high' | 'medium' | 'info';
type ActionKind = 'draft' | 'task' | 'message' | 'navigate';

type CopilotInsight = {
  title: string;
  detail: string;
  urgency: Urgency;
  signal: string;
};

type CopilotRecommendation = {
  id: string;
  title: string;
  why: string;
  urgency: Urgency;
  linkedObject: string;
  cta: string;
  kind: ActionKind;
  targetScreen?: ProjectCommandScreen;
  draft?: string;
};

type CopilotContext = {
  tabLabel: string;
  monitoringLabel: string;
  badge: string;
  insights: CopilotInsight[];
  recommendations: CopilotRecommendation[];
  facts: { label: string; value: string }[];
  sourceSignals: string[];
};

const screenLabels: Record<ProjectCommandScreen, string> = {
  overview: 'Overview',
  programme: 'Programme',
  stagegates: 'Stage Gates',
  cost: 'Cost',
  risk: 'Risk',
  obligations: 'Obligations',
  evidence: 'Evidence',
  forecast: 'AI Forecast',
};

const controlLens: Record<ProjectCommandScreen, { label: string; focus: string; watch: string }> = {
  overview: {
    label: 'Executive control',
    focus: 'health, critical threat, milestones, and manager actions',
    watch: 'Executive risk picture',
  },
  programme: {
    label: 'Critical path control',
    focus: 'float, dependencies, recovery tasks, and handover exposure',
    watch: 'Programme movement',
  },
  stagegates: {
    label: 'Gate readiness',
    focus: 'blockers, owners, approvals, and evidence clearance',
    watch: 'Gate movement',
  },
  cost: {
    label: 'Budget control',
    focus: 'CPI, EAC, variations, contingency, and cashflow drift',
    watch: 'Financial drift',
  },
  risk: {
    label: 'Risk command',
    focus: 'probability, impact, mitigations, and escalation gaps',
    watch: 'Risk acceleration',
  },
  obligations: {
    label: 'Obligation control',
    focus: 'deadlines, notices, claims exposure, and proof of closure',
    watch: 'Commitment exposure',
  },
  evidence: {
    label: 'Evidence assurance',
    focus: 'missing files, stale documents, verification, and gate proof',
    watch: 'Evidence quality',
  },
  forecast: {
    label: 'Scenario control',
    focus: 'scenario probability, decision impact, and recovery options',
    watch: 'Forecast movement',
  },
};

const urgencyStyles: Record<Urgency, string> = {
  critical: 'border-red-400/30 bg-red-400/12 text-red-200',
  high: 'border-amber-400/30 bg-amber-400/12 text-amber-200',
  medium: 'border-cyan-300/25 bg-cyan-300/10 text-cyan-100',
  info: 'border-[#7C3AED]/30 bg-[#7C3AED]/12 text-violet-100',
};

const urgencyRank: Record<Urgency, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  info: 3,
};

function money(value: number) {
  return `AED ${Math.round(value / 1_000_000)}M`;
}

function buildContext(screen: ProjectCommandScreen, dataset: ProjectCommandDataset): CopilotContext {
  const { project, aiContent, risks, milestones } = dataset;
  const cost = getBudgetControlData(project);
  const pendingVariations = cost.variations
    .filter(item => item.status !== 'Approved' && item.status !== 'Rejected')
    .reduce((sum, item) => sum + item.amount, 0);
  const topCostDriver = aiContent.costInsights.topCostDrivers[0];
  const topRisk = risks.find(risk => risk.severity === 'critical') ?? risks[0];
  const urgentMilestone = milestones[0];
  const eac = cost.evm.eac ? money(cost.evm.eac) : money(project.forecastCost);
  const tabLabel = screenLabels[screen];

  const baseFacts = [
    { label: 'Project', value: project.name },
    { label: 'Completion', value: `${project.completion}%` },
    { label: 'Health score', value: `${project.healthScore}/100` },
    { label: 'Contract value', value: money(project.contractValue) },
    { label: 'Float', value: `${project.floatRemaining} days` },
  ];

  const commonActions: CopilotRecommendation[] = [
    {
      id: 'waterproofing-escalation',
      title: 'Escalate waterproofing delay',
      why: 'Float is being consumed and downstream phases are exposed.',
      urgency: 'critical',
      linkedObject: 'Substructure / critical path',
      cta: 'Draft escalation',
      kind: 'draft',
      draft: `Subject: Critical recovery action required\n\nThe current waterproofing delay is consuming available float and exposing downstream programme phases. Please confirm the recovery crew plan, revised dates, and daily output targets by close of business today.\n\nRequired action: submit an updated recovery programme and evidence plan.\nDeadline: today.`,
    },
    {
      id: 'authority-approval',
      title: 'Request missing authority approval',
      why: 'Gate clearance cannot proceed without approval evidence.',
      urgency: 'high',
      linkedObject: 'Commissioning Ready gate',
      cta: 'Draft request',
      kind: 'draft',
      draft: `Subject: Missing authority approval evidence\n\nPlease upload the authority approval certificate and supporting inspection evidence for the Commissioning Ready gate. The gate cannot move to Clear until the evidence pack is complete and verified.\n\nRequired documents: authority approval certificate, fire system commissioning report, lift inspection sign-off.\nDeadline: within 24 hours.`,
    },
  ];

  const contexts: Record<ProjectCommandScreen, CopilotContext> = {
    overview: {
      tabLabel,
      monitoringLabel: 'Monitoring health, threats, gates, cost drift, and milestones',
      badge: '1 Critical',
      insights: [
        { title: aiContent.healthScore.topThreat, detail: aiContent.healthScore.recommendedAction, urgency: project.healthScore < 60 ? 'critical' : 'high', signal: 'AI top threat' },
        { title: `${project.floatRemaining} days of float remaining`, detail: 'ProjectCommand is watching whether this is enough to absorb downstream handover pressure.', urgency: project.floatRemaining < 22 ? 'critical' : 'high', signal: 'Critical path' },
        { title: `${urgentMilestone.name} is due in ${urgentMilestone.daysRemaining} days`, detail: 'Milestone pressure is now part of the weekly manager action queue.', urgency: urgentMilestone.daysRemaining < 7 ? 'critical' : 'medium', signal: 'Milestone' },
      ],
      recommendations: [
        ...commonActions,
        {
          id: 'exec-summary',
          title: 'Prepare executive project summary',
          why: 'Leadership needs the threat, impact, and action in one concise update.',
          urgency: 'medium',
          linkedObject: 'Overview health banner',
          cta: 'Prepare message',
          kind: 'message',
          draft: `${project.name} is at ${project.completion}% completion with a ${project.healthScore}/100 health score. Main risk: ${aiContent.healthScore.topThreat} Recommended action: ${aiContent.healthScore.recommendedAction}`,
        },
      ],
      facts: baseFacts,
      sourceSignals: ['Health score', 'Milestones', 'Cost forecast', 'Risk register'],
    },
    programme: {
      tabLabel,
      monitoringLabel: 'Tracking float consumption, dependencies, weather, and critical path',
      badge: '3 Actions',
      insights: [
        { title: 'Substructure is consuming float and affecting the downstream programme.', detail: aiContent.programmeInsights.criticalPathNarrative, urgency: 'critical', signal: 'Critical path' },
        { title: 'Waterproofing rework remains the biggest handover threat.', detail: 'If recovery is not confirmed, Superstructure, MEP, Fit-out, and Handover all inherit delay pressure.', urgency: 'critical', signal: 'Delay driver' },
        { title: 'MEP coordination may cascade into Fit-out.', detail: 'The Copilot is watching unresolved coordination items and their effect on fit-out start readiness.', urgency: 'high', signal: 'Dependency' },
      ],
      recommendations: [
        commonActions[0],
        {
          id: 'recovery-task',
          title: 'Create recovery task',
          why: 'A visible owner and due date are needed before the next look-ahead review.',
          urgency: 'critical',
          linkedObject: 'Substructure acceleration',
          cta: 'Create task',
          kind: 'task',
        },
        {
          id: 'programme-report',
          title: 'Draft 2-week look-ahead report',
          why: 'Managers need a concise view of critical activities and dependencies.',
          urgency: 'medium',
          linkedObject: 'Programme',
          cta: 'Draft report',
          kind: 'draft',
          draft: `2-week look-ahead for ${project.name}\n\nFocus areas:\n- Recover substructure float loss\n- Confirm revised waterproofing output\n- Protect Superstructure start sequence\n- Clear MEP coordination dependencies\n\nRecommended: issue daily recovery tracking until float stabilises.`,
        },
      ],
      facts: [...baseFacts, { label: 'Forecast completion', value: project.forecastCompletion }],
      sourceSignals: ['Gantt phases', 'Critical path', 'Milestones', 'Weather risk'],
    },
    stagegates: {
      tabLabel,
      monitoringLabel: 'Monitoring gates, blockers, approvals, evidence, and owners',
      badge: 'Gate Risk',
      insights: [
        { title: 'Commissioning Ready gate is at risk due to missing authority approval evidence.', detail: 'The gate should not clear until the required certificate and commissioning pack are verified.', urgency: 'high', signal: 'Gate evidence' },
        { title: 'Handover Go/No-Go is blocked by unresolved closeout items.', detail: 'Snags and missing sign-offs can prevent final clearance.', urgency: 'critical', signal: 'Blocked gate' },
        { title: 'Evidence pack is 72% complete. 4 documents are missing.', detail: 'Authority approval certificate, fire system commissioning report, lift inspection sign-off, and vendor warranty pack are still open.', urgency: 'high', signal: 'Evidence completeness' },
        { title: 'Warranty Control review needs explicit owner confirmation.', detail: 'Owner assignment should be locked before handover readiness review.', urgency: 'medium', signal: 'Owner gap' },
      ],
      recommendations: [
        commonActions[1],
        {
          id: 'gate-owner-review',
          title: 'Schedule gate owner review',
          why: 'Gate blockers need a named owner and decision date.',
          urgency: 'high',
          linkedObject: 'Stage Gates',
          cta: 'Create task',
          kind: 'task',
        },
        {
          id: 'closeout-task',
          title: 'Create closeout task',
          why: 'Handover closeout items need an owner before the next gate review.',
          urgency: 'high',
          linkedObject: 'Handover Go/No-Go',
          cta: 'Create task',
          kind: 'task',
        },
        {
          id: 'warranty-pack',
          title: 'Ask vendor for warranty pack',
          why: 'Closure cannot be verified without the vendor warranty evidence.',
          urgency: 'medium',
          linkedObject: 'Warranty Control Review',
          cta: 'Prepare message',
          kind: 'message',
          draft: `Please provide the vendor warranty pack for ${project.name}, including signed warranty certificates, asset references, and handover documentation. This is required before the Warranty Control Review can progress.`,
        },
      ],
      facts: [...baseFacts, { label: 'Evidence completeness', value: '72%' }],
      sourceSignals: ['Gate register', 'Evidence repository', 'Owner matrix', 'Required documents'],
    },
    cost: {
      tabLabel,
      monitoringLabel: 'Watching CPI, EAC, variations, contingency, and cashflow drift',
      badge: 'Cost Risk',
      insights: [
        { title: `CPI is ${project.cpi.toFixed(2)}. Cost efficiency is below target.`, detail: `AI forecasts ${eac} at completion against ${money(project.contractValue)} contract value.`, urgency: project.cpi < 0.9 ? 'critical' : 'high', signal: 'Earned value' },
        { title: `Pending variations total ${money(pendingVariations)}.`, detail: 'Variation exposure is waiting for manager or client decision and can move the revised budget.', urgency: 'high', signal: 'Variation log' },
        { title: `${topCostDriver.item} is the top cost driver.`, detail: `${money(topCostDriver.value * 1_000_000)} exposure is contributing to forecast drift.`, urgency: 'high', signal: 'Cost driver' },
        { title: 'Cashflow is tied to baseline schedule, package progress, actuals, and approved variations.', detail: 'The Copilot is watching months where forecast outflow exceeds planned outflow.', urgency: 'medium', signal: 'Cashflow' },
      ],
      recommendations: [
        {
          id: 'open-variations',
          title: 'Review pending variations',
          why: `${money(pendingVariations)} exposure is pending decision.`,
          urgency: 'high',
          linkedObject: 'Variation orders',
          cta: 'Open variations',
          kind: 'navigate',
          targetScreen: 'cost',
        },
        {
          id: 'vendor-clarification',
          title: 'Request vendor clarification',
          why: 'The top cost driver needs commercial backup before approval.',
          urgency: 'high',
          linkedObject: topCostDriver.item,
          cta: 'Draft request',
          kind: 'draft',
          draft: `Subject: Commercial clarification required\n\nPlease provide supporting details for ${topCostDriver.item}, including cost basis, affected package, programme impact, and mitigation options. This is required before the current variation exposure can be recommended for approval.`,
        },
        {
          id: 'contingency-action',
          title: 'Protect contingency',
          why: 'Forecast drift may consume contingency before fit-out and handover packages mature.',
          urgency: 'medium',
          linkedObject: 'Budget Control',
          cta: 'Create task',
          kind: 'task',
        },
      ],
      facts: [...baseFacts, { label: 'CPI / SPI', value: `${project.cpi.toFixed(2)} / ${project.spi.toFixed(2)}` }, { label: 'Forecast', value: eac }],
      sourceSignals: ['Budget baseline', 'Actual costs', 'Variation orders', 'AI forecast'],
    },
    risk: {
      tabLabel,
      monitoringLabel: 'Scanning probability, impact, mitigation gaps, and escalation triggers',
      badge: 'Risk Watch',
      insights: [
        { title: topRisk.title, detail: topRisk.aiEarlyWarning ?? topRisk.mitigation, urgency: topRisk.severity === 'critical' ? 'critical' : 'high', signal: 'Top risk' },
        { title: 'Mitigation ownership needs weekly confirmation.', detail: 'The Copilot is watching risks that have high impact but no recent evidence of mitigation progress.', urgency: 'high', signal: 'Mitigation gap' },
        { title: 'Cost and programme risks are converging.', detail: 'The same packages are driving schedule exposure and variation pressure.', urgency: 'medium', signal: 'Cross-signal' },
      ],
      recommendations: [
        commonActions[0],
        {
          id: 'risk-review',
          title: 'Schedule risk owner review',
          why: 'High-impact risks need owner confirmation before the next reporting cycle.',
          urgency: 'high',
          linkedObject: topRisk.id,
          cta: 'Create task',
          kind: 'task',
        },
      ],
      facts: baseFacts,
      sourceSignals: ['Risk register', 'Mitigations', 'Programme variance', 'Cost exposure'],
    },
    obligations: {
      tabLabel,
      monitoringLabel: 'Checking contractual obligations, deadlines, notices, and claims exposure',
      badge: '2 Due',
      insights: [
        { title: 'Authority and contractual dates need close review.', detail: 'Missed obligation dates can create claims, stop-work risk, or handover delay.', urgency: 'high', signal: 'Obligation dates' },
        { title: 'One overdue obligation should be escalated.', detail: 'The Copilot can draft a notice and link it to the evidence register.', urgency: 'critical', signal: 'Overdue item' },
        { title: 'Evidence should be attached before obligation closure.', detail: 'Closing an obligation without proof weakens the audit trail.', urgency: 'medium', signal: 'Evidence link' },
      ],
      recommendations: [
        {
          id: 'obligation-notice',
          title: 'Draft obligation notice',
          why: 'Formal action is needed for overdue or at-risk obligations.',
          urgency: 'high',
          linkedObject: 'Obligations Register',
          cta: 'Draft notice',
          kind: 'draft',
          draft: `Subject: Obligation review and evidence request\n\nPlease provide current status, evidence, and next action for the linked obligation on ${project.name}. This item is required for governance review and cannot be closed without supporting documentation.`,
        },
      ],
      facts: baseFacts,
      sourceSignals: ['Obligation register', 'Evidence links', 'Owner review', 'Due dates'],
    },
    evidence: {
      tabLabel,
      monitoringLabel: 'Checking missing files, expired documents, evidence quality, and verification',
      badge: 'Evidence Gap',
      insights: [
        { title: '3 evidence items are missing for gate clearance.', detail: 'Authority approval, lift sign-off, and vendor warranty pack are required before closeout.', urgency: 'high', signal: 'Missing evidence' },
        { title: '2 uploaded photos need review.', detail: 'Photo evidence should be verified for location, timestamp, and linked package before acceptance.', urgency: 'medium', signal: 'Evidence review' },
        { title: 'Authority approval document appears outdated.', detail: 'The Copilot recommends requesting the latest version before gate clearance.', urgency: 'high', signal: 'Document freshness' },
      ],
      recommendations: [
        commonActions[1],
        {
          id: 'evidence-message',
          title: 'Ask vendor for evidence',
          why: 'Closure cannot be verified without geotagged evidence.',
          urgency: 'medium',
          linkedObject: 'Evidence Repository',
          cta: 'Prepare message',
          kind: 'message',
          draft: `Please upload geotagged evidence for the open closeout items on ${project.name}. Required: latest document version, photo evidence, timestamp, and linked package reference.`,
        },
      ],
      facts: [...baseFacts, { label: 'Evidence completeness', value: '72%' }],
      sourceSignals: ['Evidence repository', 'Document versions', 'Gate requirements', 'Photo review'],
    },
    forecast: {
      tabLabel,
      monitoringLabel: 'Comparing optimistic, base, pessimistic scenarios and decision impact',
      badge: 'Scenario',
      insights: [
        { title: `Base case completion is ${aiContent.scenarios.base.completionDate}.`, detail: `AI estimates ${money(aiContent.scenarios.base.finalCost)} final cost with ${aiContent.scenarios.base.probability}% probability.`, urgency: 'high', signal: 'Base case' },
        { title: 'Pessimistic scenario is driven by unresolved technical and procurement risks.', detail: 'The Copilot is watching which actions reduce the probability of this scenario.', urgency: 'medium', signal: 'Scenario risk' },
      ],
      recommendations: [
        commonActions[0],
        {
          id: 'scenario-summary',
          title: 'Prepare forecast summary',
          why: 'Stakeholders need a plain-language explanation of the likely scenario.',
          urgency: 'medium',
          linkedObject: 'AI Forecast',
          cta: 'Draft summary',
          kind: 'draft',
          draft: `${project.name} base forecast: completion ${aiContent.scenarios.base.completionDate}, final cost ${money(aiContent.scenarios.base.finalCost)}, probability ${aiContent.scenarios.base.probability}%. Key action: ${aiContent.topDecisions[0]?.title}.`,
        },
      ],
      facts: [...baseFacts, { label: 'Base forecast', value: aiContent.scenarios.base.completionDate }],
      sourceSignals: ['Scenario model', 'Risk register', 'Cost forecast', 'Programme data'],
    },
  };

  return contexts[screen];
}

function useProjectCommandCopilotContext(screen: ProjectCommandScreen) {
  const dataset = useSelectedProjectCommandData();
  return useMemo(() => buildContext(screen, dataset), [screen, dataset]);
}

function getProjectCommandCopilotRecommendations(context: CopilotContext) {
  return [...context.recommendations].sort((a, b) => urgencyRank[a.urgency] - urgencyRank[b.urgency]);
}

function getPlainActionLabel(action: CopilotRecommendation) {
  if (action.id.includes('authority')) return 'Request approval';
  if (action.id.includes('warranty')) return 'Request warranty pack';
  if (action.id.includes('closeout')) return 'Create closeout task';
  if (action.id.includes('gate-owner')) return 'Assign owner';
  if (action.kind === 'task') return 'Create task';
  if (action.kind === 'navigate') return 'Open section';
  if (action.kind === 'message') return 'Prepare message';
  return action.cta;
}

function getPlainOutcome(action: CopilotRecommendation) {
  if (action.id.includes('authority')) return 'The gate can be reviewed once the approval is uploaded and verified.';
  if (action.id.includes('warranty')) return 'The handover pack can move forward once vendor warranty evidence is received.';
  if (action.kind === 'task') return 'A named owner and due date will be added to the manager action queue.';
  if (action.kind === 'navigate') return 'You will jump to the relevant section to review the underlying records.';
  return 'A ready-to-send message will be prepared for the responsible party.';
}

function getActionChipLabel(action: CopilotRecommendation) {
  if (action.id.includes('gate-owner')) return 'Schedule gate owner review';
  if (action.id.includes('warranty')) return 'Request warranty pack';
  if (action.id.includes('closeout')) return 'Create closeout task';
  return action.title;
}

function getPriorityWhy(action: CopilotRecommendation) {
  if (action.id.includes('authority')) return 'Commissioning Ready gate cannot move forward without approval evidence.';
  if (action.id.includes('warranty')) return 'Warranty Control cannot close without the vendor warranty pack.';
  return action.why;
}

function getPriorityNext(action: CopilotRecommendation) {
  if (action.id.includes('authority')) return 'Upload or request the approval pack before the next gate review.';
  if (action.id.includes('warranty')) return 'Request the signed warranty pack and attach it to the evidence register.';
  if (action.kind === 'task') return 'Assign an owner, deadline, and review date.';
  return getPlainOutcome(action);
}

function getBlockerDisplay(insight: CopilotInsight, index: number) {
  const stageGateBlockers = [
    {
      title: 'Missing authority approval',
      summary: 'Blocked because approval evidence is missing.',
      why: 'Commissioning cannot be cleared without proof from the authority.',
      evidence: 'Authority approval certificate and inspection pack.',
      action: 'Request approval',
    },
    {
      title: 'Handover closeout unresolved',
      summary: 'Open closeout items are preventing handover readiness.',
      why: 'The gate should not move while snags, owner sign-offs, or closeout tasks remain open.',
      evidence: 'Snag closure list, owner sign-off, and final closeout evidence.',
      action: 'Create closeout task',
    },
    {
      title: 'Evidence pack 72% complete',
      summary: 'Four proof items are still missing.',
      why: 'The review team cannot validate readiness without the full evidence pack.',
      evidence: 'Fire report, lift sign-off, authority approval, and warranty pack.',
      action: 'Request missing files',
    },
  ];

  return stageGateBlockers[index] ?? {
    title: insight.signal,
    summary: insight.title,
    why: insight.detail,
    evidence: 'Linked project evidence and owner confirmation.',
    action: 'Prepare action',
  };
}

function getBlockerAction(index: number, actions: CopilotRecommendation[]) {
  if (index === 0) return actions.find(action => action.id.includes('authority')) ?? actions[0];
  if (index === 1) return actions.find(action => action.id.includes('closeout')) ?? actions.find(action => action.kind === 'task') ?? actions[0];
  if (index === 2) return actions.find(action => action.id.includes('warranty')) ?? actions.find(action => action.id.includes('authority')) ?? actions[0];
  return actions[index] ?? actions[0];
}

function CopilotContextHeader({
  context,
  projectName,
  screen,
}: {
  context: CopilotContext;
  projectName: string;
  screen: ProjectCommandScreen;
}) {
  const health = context.facts.find(fact => fact.label === 'Health score')?.value ?? '74/100';
  const completion = context.facts.find(fact => fact.label === 'Completion')?.value ?? '43%';

  return (
    <div className="border-b border-[rgba(46,127,255,0.12)] bg-[linear-gradient(135deg,rgba(124,58,237,0.12),rgba(9,21,42,0.97))] px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[#C4B5FD]">ProjectCommand Copilot</div>
          <p className="mt-2 text-[12px] font-bold leading-5 text-[#B8C7DB]">
            {projectName} - {screenLabels[screen]} - Health {health} - {completion} complete
          </p>
        </div>
        <span className="mt-1 shrink-0 rounded-full border border-red-300/22 bg-red-400/10 px-2.5 py-1 text-[10px] font-black text-red-100">{context.badge}</span>
      </div>
    </div>
  );
}

function CopilotAskBar({ onAsk }: { onAsk: (question: string) => void }) {
  const [value, setValue] = useState('');
  const submit = () => {
    const question = value.trim();
    if (!question) return;
    onAsk(question);
    setValue('');
  };

  return (
    <div className="border-t border-[rgba(46,127,255,0.12)] bg-[#07111F]/96 p-4 shadow-[0_-18px_54px_rgba(0,0,0,0.22)]">
      <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#C4B5FD]">
        <Sparkles size={13} />
        Ask a question
      </label>
      <div className="mt-2 flex gap-2">
        <input
          value={value}
          onChange={event => setValue(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter') submit();
          }}
          placeholder="Ask why this is blocked, what to do next, or draft an update..."
          className="min-w-0 flex-1 rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#0A1628] px-3 py-3 text-[12px] font-semibold text-[#EEF3FA] outline-none transition-colors placeholder:text-[#5A6E88] focus:border-[#7C3AED]"
        />
        <button onClick={submit} className="inline-flex h-11 w-12 items-center justify-center rounded-xl bg-[#7C3AED] text-white hover:bg-[#6D28D9]" aria-label="Ask Copilot">
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

function CopilotAttentionList({
  insights,
  actions,
  onSelect,
}: {
  insights: CopilotInsight[];
  actions: CopilotRecommendation[];
  onSelect: (recommendation: CopilotRecommendation) => void;
}) {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-[12px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>What is stopping progress</h4>
      </div>
      <div className="divide-y divide-[rgba(46,127,255,0.12)] overflow-hidden rounded-2xl bg-[#07111F]/62">
        {insights.slice(0, 3).map((insight, index) => {
          const blocker = getBlockerDisplay(insight, index);
          const rowAction = getBlockerAction(index, actions);
          const isOpen = expanded === index;

          return (
          <div
            key={insight.title}
            className="relative"
          >
            <button
              type="button"
              onClick={() => setExpanded(isOpen ? null : index)}
              className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-white/[0.025]"
            >
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-1.5">
                  <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${urgencyStyles[insight.urgency]}`}>{insight.urgency}</span>
                  <span className="text-[10px] font-bold text-[#7A94B4]">{blocker.title}</span>
                </div>
                <p className="text-[12px] font-semibold leading-5 text-[#B8C7DB]">{blocker.summary}</p>
              </div>
              <ArrowRight size={15} className={`ml-auto shrink-0 text-[#7A94B4] transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3 text-[11px] leading-5 text-[#9FB2CD]">
                    <div className="rounded-xl bg-[#0A1628]/78 p-3">
                      <p><span className="font-black text-white">Why: </span>{blocker.why}</p>
                      <p className="mt-1"><span className="font-black text-white">Required: </span>{blocker.evidence}</p>
                      <button
                        type="button"
                        onClick={() => rowAction && onSelect(rowAction)}
                        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#7C3AED] px-3 py-2 text-[10px] font-black text-white hover:bg-[#6D28D9]"
                      >
                        {blocker.action}
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          );
        })}
      </div>
    </section>
  );
}

function CopilotNextActionCard({
  recommendation,
  alternateActions,
  onSelect,
}: {
  recommendation: CopilotRecommendation;
  alternateActions: CopilotRecommendation[];
  onSelect: (recommendation: CopilotRecommendation) => void;
}) {
  return (
    <section className="rounded-[22px] bg-[linear-gradient(135deg,rgba(124,58,237,0.18),rgba(7,17,31,0.96))] p-4 shadow-[0_18px_44px_rgba(0,0,0,0.2)] ring-1 ring-[#7C3AED]/18">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#C4B5FD]">
          <Zap size={13} />
          Do this first
        </span>
        <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${urgencyStyles[recommendation.urgency]}`}>{recommendation.urgency}</span>
      </div>
      <h4 className="text-[15px] font-black leading-5 text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{recommendation.title}</h4>
      <div className="mt-3 space-y-2 text-[12px] leading-5 text-[#DCE8F8]">
        <p><span className="font-black text-white">Why: </span>{getPriorityWhy(recommendation)}</p>
        <p><span className="font-black text-white">Next: </span>{getPriorityNext(recommendation)}</p>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button onClick={() => onSelect(recommendation)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-[12px] font-black text-white hover:bg-[#6D28D9]">
          {getPlainActionLabel(recommendation)}
          <ArrowRight size={13} />
        </button>
        {alternateActions.slice(0, 1).map(action => (
          <button key={action.id} onClick={() => onSelect(action)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#0A1628] px-4 py-2.5 text-[12px] font-black text-[#DCE8F8] hover:bg-white/5">
            {getPlainActionLabel(action)}
          </button>
        ))}
      </div>
    </section>
  );
}

function CopilotActionChips({
  recommendations,
  onSelect,
}: {
  recommendations: CopilotRecommendation[];
  onSelect: (recommendation: CopilotRecommendation) => void;
}) {
  return (
    <section>
      <h4 className="mb-2 text-[12px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Suggested next actions</h4>
      <div className="flex flex-wrap gap-2">
        {recommendations.slice(0, 3).map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item)}
            className="rounded-full border border-[rgba(46,127,255,0.14)] bg-[#07111F]/72 px-3 py-2 text-[10px] font-black text-[#DCE8F8] transition-colors hover:border-[#7C3AED]/45 hover:bg-[#7C3AED]/14"
          >
            {getActionChipLabel(item)}
          </button>
        ))}
      </div>
    </section>
  );
}

function CopilotResponse({
  question,
  context,
}: {
  question: string;
  context: CopilotContext;
}) {
  const lower = question.toLowerCase();
  const handover = lower.includes('handover') || lower.includes('delay') || lower.includes('late');
  const cost = lower.includes('cost') || lower.includes('budget') || lower.includes('variation') || lower.includes('cpi');
  const evidence = lower.includes('evidence') || lower.includes('document') || lower.includes('proof');
  const primary = context.insights[0];
  const nextAction = getProjectCommandCopilotRecommendations(context)[0];

  const title = handover
    ? 'Handover risk is driven by float loss and clearance dependencies.'
    : cost
      ? 'Cost drift is being driven by efficiency loss and pending exposure.'
      : evidence
        ? 'Evidence completeness is the main clearance dependency.'
        : primary.title;

  const whatISee = handover
    ? ['Float is being consumed by the critical path.', 'Gate clearance still depends on required evidence.', 'Downstream phases can inherit delay if recovery is not confirmed.']
    : cost
      ? ['CPI is below target.', 'Pending variations can move the revised budget.', 'Forecast at completion is trending above approved budget.']
      : evidence
        ? ['Required evidence is incomplete.', 'Some documents need owner or version review.', 'Gate movement should remain blocked until proof is verified.']
        : context.insights.slice(0, 3).map(item => item.title);

  return (
    <div className="rounded-2xl border border-[#7C3AED]/24 bg-[linear-gradient(135deg,rgba(124,58,237,0.14),rgba(7,17,31,0.94))] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.25)]">
      <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#C4B5FD]">
        <Bot size={14} />
        Answer
      </div>
      <h4 className="text-[14px] font-black leading-5 text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{title}</h4>
      <div className="mt-3 space-y-3 text-[11px] leading-5 text-[#B8C7DB]">
        <div>
          <p className="font-black text-white">What I see</p>
          <ul className="mt-1 space-y-1">
            {whatISee.slice(0, 3).map(item => <li key={item}>- {item}</li>)}
          </ul>
        </div>
        <div className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#07111F] px-3 py-2">
          <p className="font-black text-white">Do next</p>
          <p className="mt-1 text-[#DCE8F8]">{nextAction?.title}: {nextAction?.why}</p>
          <p className="mt-2 text-[10px] font-bold text-[#7A94B4]">Sources: {context.sourceSignals.slice(0, 3).join(' - ')}</p>
        </div>
      </div>
    </div>
  );
}

function CopilotActionComposer({
  action,
  onClose,
  onNavigate,
}: {
  action: CopilotRecommendation;
  onClose: () => void;
  onNavigate: (screen: ProjectCommandScreen) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [done, setDone] = useState(false);
  const isTask = action.kind === 'task';
  const text = action.draft ?? `${action.title}\n\nWhy it matters: ${action.why}\nLinked item: ${action.linkedObject}\nRecommended action: ${action.cta}`;

  if (action.kind === 'navigate' && action.targetScreen) {
    return (
      <div className="rounded-2xl border border-[#7C3AED]/24 bg-[#07111F] p-4">
        <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#C4B5FD]">
          <Gauge size={13} />
          Control action
        </div>
        <p className="text-[13px] font-black text-[#EEF3FA]">{action.title}</p>
        <p className="mt-1 text-[11px] leading-5 text-[#8EA7C7]">{action.why}</p>
        <button onClick={() => onNavigate(action.targetScreen!)} className="mt-3 w-full rounded-xl bg-[#7C3AED] px-4 py-2.5 text-[12px] font-black text-white hover:bg-[#6D28D9]">Open related section</button>
      </div>
    );
  }

  return (
    <div className="rounded-[22px] bg-[#07111F] p-4 ring-1 ring-[#7C3AED]/20">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#C4B5FD]">
            {isTask ? <PenLine size={13} /> : <MessageSquare size={13} />}
            {isTask ? 'Task ready' : 'Message ready'}
          </p>
          <h4 className="mt-1 text-[14px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{action.title}</h4>
          <p className="mt-1 text-[11px] leading-5 text-[#8EA7C7]">{getPlainOutcome(action)}</p>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-[#7A94B4] hover:bg-white/5 hover:text-white" aria-label="Close action composer"><X size={15} /></button>
      </div>
      {done && (
        <div className="mb-3 rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-[11px] font-black text-emerald-100">
          {isTask ? 'Task created in the manager action queue.' : 'Message marked as sent.'}
        </div>
      )}
      {isTask ? (
        <div className="space-y-2">
          <input className="w-full rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#0A1628] px-3 py-2 text-[12px] font-semibold text-white outline-none" defaultValue={action.title} />
          <div className="grid grid-cols-2 gap-2">
            <input className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#0A1628] px-3 py-2 text-[12px] font-semibold text-white outline-none" defaultValue="PM Team" />
            <input type="date" className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#0A1628] px-3 py-2 text-[12px] font-semibold text-white outline-none" />
          </div>
          <textarea className="min-h-[84px] w-full rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#0A1628] px-3 py-2 text-[12px] font-semibold leading-5 text-white outline-none" defaultValue={`Linked item: ${action.linkedObject}\nPriority: ${action.urgency}\nReason: ${action.why}`} />
          <button onClick={() => setDone(true)} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-[12px] font-black text-white hover:bg-[#6D28D9]">
            <CheckCircle2 size={14} />
            Create task
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-[1fr_132px] gap-2">
            <input className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#0A1628] px-3 py-2 text-[12px] font-semibold text-white outline-none" defaultValue="Authority / vendor contact" aria-label="Recipient" />
            <input type="date" className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#0A1628] px-3 py-2 text-[12px] font-semibold text-white outline-none" aria-label="Deadline" />
          </div>
          <textarea className="min-h-[116px] w-full rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#0A1628] px-3 py-2 text-[12px] font-semibold leading-5 text-white outline-none" defaultValue={text} />
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                navigator.clipboard?.writeText(text).catch(() => undefined);
                setCopied(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[rgba(46,127,255,0.2)] px-4 py-2.5 text-[12px] font-black text-[#B8C7DB] hover:bg-white/5"
            >
              <Copy size={13} />
              {copied ? 'Copied' : 'Copy note'}
            </button>
            <button onClick={() => setDone(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-[12px] font-black text-white hover:bg-[#6D28D9]">
              <Clock3 size={13} />
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectCommandCopilotPanel({
  screen,
  onClose,
  onNavigate,
}: {
  screen: ProjectCommandScreen;
  onClose: () => void;
  onNavigate: (screen: ProjectCommandScreen) => void;
}) {
  const dataset = useSelectedProjectCommandData();
  const context = useProjectCommandCopilotContext(screen);
  const [question, setQuestion] = useState('');
  const [activeAction, setActiveAction] = useState<CopilotRecommendation | null>(null);
  const recommendations = getProjectCommandCopilotRecommendations(context);
  const primaryAction = recommendations[0];
  const alternateActions = recommendations.slice(1);

  return (
    <motion.aside
      initial={{ x: 560, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 560, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
      className="fixed bottom-0 right-0 top-0 z-[2600] flex w-full max-w-[520px] flex-col border-l border-[#7C3AED]/20 bg-[#09152A] shadow-2xl shadow-black/45 sm:w-[500px]"
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_5%,rgba(124,58,237,0.12),transparent_30%)]" />
      <div className="flex items-start justify-between">
        <CopilotContextHeader context={context} projectName={dataset.project.name} screen={screen} />
        <button onClick={onClose} className="absolute right-4 top-4 rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#0A1628] p-2 text-[#8EA7C7] hover:bg-white/5 hover:text-white" aria-label="Close ProjectCommand Copilot">
          <X size={17} />
        </button>
      </div>
      <div className="custom-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto p-5 pb-6">
        {primaryAction && <CopilotNextActionCard recommendation={primaryAction} alternateActions={alternateActions} onSelect={setActiveAction} />}
        {activeAction && <CopilotActionComposer action={activeAction} onClose={() => setActiveAction(null)} onNavigate={next => { onNavigate(next); onClose(); }} />}
        <CopilotAttentionList insights={context.insights} actions={recommendations} onSelect={setActiveAction} />
        <CopilotActionChips recommendations={alternateActions} onSelect={setActiveAction} />
        {question && <CopilotResponse question={question} context={context} />}
      </div>
      <CopilotAskBar
        onAsk={nextQuestion => {
          setQuestion(nextQuestion);
          setActiveAction(null);
        }}
      />
    </motion.aside>
  );
}

export function ProjectCommandCopilotButton({
  screen,
  onNavigate,
}: {
  screen: ProjectCommandScreen;
  onNavigate: (screen: ProjectCommandScreen) => void;
}) {
  const [open, setOpen] = useState(false);
  const context = useProjectCommandCopilotContext(screen);
  const hasCritical = context.insights.some(item => item.urgency === 'critical');
  const lens = controlLens[screen];

  return (
    <>
      <motion.div
        className="fixed bottom-6 right-6 z-[2100] flex items-center gap-2"
        initial={false}
        animate={hasCritical ? { y: [0, -2, 0] } : { y: 0 }}
        transition={{ duration: 2.8, repeat: hasCritical ? Infinity : 0, ease: 'easeInOut' }}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="hidden max-w-[220px] items-center gap-2 rounded-full border border-[#7C3AED]/38 bg-[#07111F]/92 px-3.5 py-2.5 text-left shadow-[0_0_34px_rgba(124,58,237,0.28)] backdrop-blur sm:flex"
          aria-label="Open ProjectCommand Copilot"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#60A5FA,#7C3AED_52%,#111827_82%)] text-white">
            <Sparkles size={16} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[10px] font-black uppercase tracking-[0.12em] text-[#C4B5FD]">Copilot</span>
            <span className="block truncate text-[11px] font-bold text-[#DCE8F8]">{lens.label}</span>
          </span>
          <span className={`ml-auto shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-black ${hasCritical ? 'border-red-300/35 bg-red-400/16 text-red-100' : 'border-cyan-300/24 bg-cyan-300/10 text-cyan-100'}`}>{context.badge}</span>
        </button>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative flex h-16 w-16 items-center justify-center rounded-full border border-[#7C3AED]/45 bg-[radial-gradient(circle_at_35%_30%,#60A5FA,#7C3AED_48%,#111827_78%)] text-white shadow-[0_0_34px_rgba(124,58,237,0.45)] transition-transform hover:scale-105"
          aria-label="Open ProjectCommand Copilot"
        >
          {hasCritical && <span className="absolute inset-[-8px] rounded-full border border-red-300/25" />}
          <Sparkles size={24} />
          <span className="absolute -right-2 -top-2 rounded-full border border-red-300/40 bg-[#D92B1C] px-2 py-1 text-[9px] font-black text-white shadow-lg">{context.badge}</span>
        </button>
      </motion.div>
      <AnimatePresence>
        {open && (
          <>
            <motion.button
              className="fixed inset-0 z-[2550] bg-black/30 backdrop-blur-[1px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              aria-label="Close ProjectCommand Copilot overlay"
            />
            <ProjectCommandCopilotPanel screen={screen} onClose={() => setOpen(false)} onNavigate={onNavigate} />
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export function StageGateStatusCopilotButton() {
  const [open, setOpen] = useState(false);
  const context = useProjectCommandCopilotContext('stagegates');
  const criticalCount = context.insights.filter(item => item.urgency === 'critical').length;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#3B82F6,#7C3AED)] px-3 text-[11px] font-black text-white shadow-[0_0_22px_rgba(124,58,237,0.32)] transition-transform hover:scale-[1.03]"
        aria-label="Open Stage Gate AI Copilot"
      >
        <Sparkles size={14} />
        AI Gate Copilot
        <span className="rounded-full border border-white/20 bg-white/14 px-2 py-0.5 text-[9px] font-black">
          {criticalCount > 0 ? `${criticalCount} critical` : context.badge}
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <>
            <motion.button
              className="fixed inset-0 z-[2550] bg-black/30 backdrop-blur-[1px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              aria-label="Close Stage Gate AI Copilot overlay"
            />
            <ProjectCommandCopilotPanel screen="stagegates" onClose={() => setOpen(false)} onNavigate={() => undefined} />
          </>
        )}
      </AnimatePresence>
    </>
  );
}
