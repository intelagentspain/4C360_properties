import { useEffect, useMemo, useState } from 'react';
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
import {
  buildProjectControlContext,
  formatProjectCurrency,
  type ProjectControlContext,
  type ProjectEvent,
} from '../data/projectControlDemoEngine';
import type { ProjectCommandDataset } from '../data/portfolio';
import { useProjectCommandStore } from '../state/projectCommandStore';
import { useSelectedProjectCommandData } from '../useProjectCommandData';

type Urgency = 'critical' | 'high' | 'medium' | 'info';
type ActionKind = 'draft' | 'task' | 'message' | 'navigate';

type CopilotInsight = {
  title: string;
  detail: string;
  urgency: Urgency;
  signal: string;
  dependencyChain?: string[];
  confidence?: number;
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
  confidence?: number;
  effect?: string;
};

type CopilotContext = {
  tabLabel: string;
  monitoringLabel: string;
  badge: string;
  prediction: {
    handoverRisk: string;
    unresolvedAfterDate: string;
    confidence: number;
    primaryBlocker: string;
    daysAtRisk: number;
    costExposure: string;
    confidenceGainIfResolved: number;
    riskAfterResolved: string;
  };
  insights: CopilotInsight[];
  recommendations: CopilotRecommendation[];
  facts: { label: string; value: string }[];
  sourceSignals: string[];
  control: ProjectControlContext;
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

function buildContext(screen: ProjectCommandScreen, dataset: ProjectCommandDataset, events: ProjectEvent[]): CopilotContext {
  const { project, aiContent, risks, milestones } = dataset;
  const control = buildProjectControlContext(dataset, events);
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
    { label: 'Completion', value: `${control.metrics.completion}%` },
    { label: 'Health score', value: `${control.metrics.healthScore}/100` },
    { label: 'Contract value', value: money(project.contractValue) },
    { label: 'Float', value: `${control.metrics.floatRemaining} days` },
  ];

  const prediction: CopilotContext['prediction'] = {
    handoverRisk: control.projectControlStatus === 'critical' ? 'Critical' : control.projectControlStatus === 'at-risk' ? 'High' : 'Moderate',
    unresolvedAfterDate: control.metrics.forecastHandover,
    confidence: control.events.length > 0 ? 94 : 88,
    primaryBlocker: control.latestEvent?.title ?? control.topThreat,
    daysAtRisk: Math.max(0, control.healthMovement.from - control.healthMovement.to + Math.max(0, 34 - control.metrics.floatRemaining)),
    costExposure: formatProjectCurrency(control.metrics.riskExposure),
    confidenceGainIfResolved: control.controlExceptions.length > 0 ? 8 : 4,
    riskAfterResolved: control.projectControlStatus === 'critical' ? 'High' : 'Medium',
  };

  const commonActions: CopilotRecommendation[] = [
    {
      id: 'critical-path-escalation',
      title: 'Escalate critical path recovery',
      why: 'Float is being consumed and downstream phases are exposed.',
      urgency: 'high',
      linkedObject: 'Programme / critical path',
      cta: 'Draft escalation',
      kind: 'draft',
      confidence: 91,
      effect: 'Recover 2d',
      draft: `Subject: Critical path recovery action required\n\nThe current project control events are consuming available float and exposing downstream programme phases. Please confirm the recovery crew plan, revised dates, and daily output targets by close of business today.\n\nRequired action: submit an updated recovery programme and evidence plan.\nDeadline: today.`,
    },
    {
      id: 'authority-approval',
      title: 'Request missing authority approval',
      why: 'Gate clearance cannot proceed without approval evidence.',
      urgency: 'high',
      linkedObject: 'Commissioning Ready gate',
      cta: 'Draft request',
      kind: 'draft',
      confidence: 92,
      effect: '+6% confidence',
      draft: `Subject: Missing authority approval evidence\n\nPlease upload the authority approval certificate and supporting inspection evidence for the Commissioning Ready gate. The gate cannot move to Clear until the evidence pack is complete and verified.\n\nRequired documents: authority approval certificate, fire system commissioning report, lift inspection sign-off.\nDeadline: within 24 hours.`,
    },
  ];

  const contexts: Record<ProjectCommandScreen, Omit<CopilotContext, 'prediction' | 'control'>> = {
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
        { title: 'Commissioning Ready gate is at risk due to missing authority approval evidence.', detail: 'The gate should not clear until the required certificate and commissioning pack are verified.', urgency: 'high', signal: 'Gate evidence', confidence: 92, dependencyChain: ['Authority approval', 'Commissioning Ready', 'Handover Review', 'Final Occupancy Permit'] },
        { title: 'Handover Go/No-Go is blocked by unresolved closeout items.', detail: 'Snags and missing sign-offs can prevent final clearance.', urgency: 'critical', signal: 'Blocked gate', confidence: 90, dependencyChain: ['Closeout items', 'Handover Go/No-Go', 'Resident move-in readiness', 'Final handover'] },
        { title: 'Evidence pack is 72% complete. 4 documents are missing.', detail: 'Authority approval certificate, fire system commissioning report, lift inspection sign-off, and vendor warranty pack are still open.', urgency: 'high', signal: 'Evidence completeness', confidence: 92, dependencyChain: ['Missing evidence', 'Gate validation failure', 'Stage gate blocked', 'Project manager escalation'] },
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
          confidence: 88,
          effect: 'Reduce aging',
        },
        {
          id: 'closeout-task',
          title: 'Create closeout task',
          why: 'Handover closeout items need an owner before the next gate review.',
          urgency: 'high',
          linkedObject: 'Handover Go/No-Go',
          cta: 'Create task',
          kind: 'task',
          confidence: 89,
          effect: 'Recover 2d',
        },
        {
          id: 'warranty-pack',
          title: 'Ask vendor for warranty pack',
          why: 'Closure cannot be verified without the vendor warranty evidence.',
          urgency: 'medium',
          linkedObject: 'Warranty Control Review',
          cta: 'Prepare message',
          kind: 'message',
          confidence: 86,
          effect: 'Unlock review',
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

  const dynamicInsights: CopilotInsight[] = [
    {
      title: control.latestEvent ? `Latest change: ${control.latestEvent.title}` : 'AI baseline is ready for live project-event simulation.',
      detail: control.latestImpact,
      urgency: control.latestEvent?.severity === 'critical' ? 'critical' : control.latestEvent?.severity === 'positive' ? 'info' : control.latestEvent ? 'high' : 'medium',
      signal: 'What changed today',
      confidence: 94,
      dependencyChain: control.latestEvent
        ? [control.latestEvent.affectedModule, 'Control metrics recalculated', 'Manager action queue updated', 'Forecast scenario refreshed']
        : ['Property created', 'Project baseline generated', 'Controls connected', 'Ready for event simulation'],
    },
    {
      title: `Health moved ${control.healthMovement.from} -> ${control.healthMovement.to}`,
      detail: control.topThreat,
      urgency: control.metrics.healthScore < 58 ? 'critical' : control.metrics.healthScore < 70 ? 'high' : 'medium',
      signal: 'Health recalculation',
      confidence: 92,
    },
    ...control.controlExceptions.slice(0, 2).map(exception => ({
      title: exception.title,
      detail: `${exception.impact} ${exception.impactMetric ? `Metric impact: ${exception.impactMetric}.` : ''}`,
      urgency: exception.severity === 'critical' ? 'critical' : exception.severity === 'high' ? 'high' : 'medium',
      signal: exception.sourceEvent ?? exception.linkedObject,
      confidence: 91,
      dependencyChain: [exception.sourceEvent ?? 'Control exception', exception.linkedObject, exception.impactMetric ?? 'Metric impact', exception.cta],
    } satisfies CopilotInsight)),
  ];

  const dynamicRecommendations: CopilotRecommendation[] = control.managerActions.slice(0, 3).map(action => {
    const linkedToLatest = Boolean(control.latestEvent && action.triggerLabel === control.latestEvent.title);
    const urgency = linkedToLatest
      ? 'critical'
      : action.priority === 'critical' ? 'critical' : action.priority === 'high' ? 'high' : action.priority === 'medium' ? 'medium' : 'info';
    return ({
    id: action.id,
    title: action.title,
    why: action.whyItMatters,
    urgency,
    linkedObject: action.triggerLabel,
    cta: action.cta,
    kind: 'task',
    confidence: linkedToLatest ? 96 : 93,
    effect: action.expectedImpact,
    draft: `Project event: ${action.triggerLabel}\nRecommended decision: ${action.title}\nWhy it matters: ${action.whyItMatters}\nExpected impact: ${action.expectedImpact}\nCost implication: ${action.costImplication}`,
    });
  });

  const selectedContext = contexts[screen];
  return {
    ...selectedContext,
    prediction,
    control,
    insights: [...dynamicInsights, ...selectedContext.insights],
    recommendations: [...dynamicRecommendations, ...selectedContext.recommendations],
    facts: [
      ...baseFacts,
      { label: 'Forecast handover', value: control.metrics.forecastHandover },
      { label: 'EAC', value: formatProjectCurrency(control.metrics.eac) },
      { label: 'Exceptions', value: String(control.controlExceptions.length) },
    ],
    sourceSignals: ['Project event engine', 'Control metrics', 'Manager actions', ...selectedContext.sourceSignals],
  };
}

function useProjectCommandCopilotContext(screen: ProjectCommandScreen) {
  const dataset = useSelectedProjectCommandData();
  const { projectEventsByProjectId } = useProjectCommandStore();
  const events = projectEventsByProjectId[dataset.id] ?? [];
  return useMemo(() => buildContext(screen, dataset, events), [screen, dataset, events]);
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
  if (action.id.includes('gate-owner')) return 'Assign gate owner';
  if (action.id.includes('warranty')) return 'Request warranty pack';
  if (action.id.includes('closeout')) return 'Create closeout task';
  if (action.id.includes('authority')) return 'Upload authority approval';
  return action.title;
}

function getActionEffect(action: CopilotRecommendation) {
  if (action.effect) return action.effect;
  if (action.id.includes('authority')) return '+6% confidence';
  if (action.id.includes('gate-owner')) return 'Reduce aging';
  if (action.id.includes('closeout')) return 'Recover 2d';
  if (action.id.includes('warranty')) return 'Unlock review';
  if (action.id.includes('variation')) return 'Reduce risk';
  return 'Reduce risk';
}

function getConfidence(action?: CopilotRecommendation | CopilotInsight | null) {
  return action?.confidence ?? 92;
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
  if (insight.signal === 'What changed today' || insight.signal === 'Health recalculation') {
    return {
      title: insight.title.replace('Latest change: ', ''),
      summary: insight.detail,
      why: insight.detail,
      evidence: insight.signal === 'What changed today' ? 'Live project event, recalculated metrics, and manager action queue.' : 'Health scoring model plus latest event impact.',
      action: insight.signal === 'What changed today' ? 'Open event action' : 'Explain health movement',
      chain: insight.dependencyChain ?? [insight.signal, 'Control metrics recalculated', 'Decision queue updated', 'Forecast refreshed'],
    };
  }

  if (insight.detail.includes('Metric impact:')) {
    return {
      title: insight.title,
      summary: insight.detail,
      why: insight.detail,
      evidence: `Linked object: ${insight.signal}.`,
      action: 'Open linked action',
      chain: insight.dependencyChain ?? [insight.signal, 'Control exception', 'Manager action', 'Forecast refreshed'],
    };
  }

  const stageGateBlockers = [
    {
      title: 'Missing authority approval',
      summary: 'Blocked because approval evidence is missing.',
      why: 'Commissioning cannot be cleared without proof from the authority.',
      evidence: 'Authority approval certificate and inspection pack.',
      action: 'Request approval',
      chain: insight.dependencyChain ?? ['Authority approval', 'Commissioning Ready', 'Handover Review', 'Final Occupancy Permit'],
    },
    {
      title: 'Handover closeout unresolved',
      summary: 'Open closeout items are preventing handover readiness.',
      why: 'The gate should not move while snags, owner sign-offs, or closeout tasks remain open.',
      evidence: 'Snag closure list, owner sign-off, and final closeout evidence.',
      action: 'Create closeout task',
      chain: insight.dependencyChain ?? ['Closeout items', 'Handover Go/No-Go', 'Resident move-in readiness', 'Final handover'],
    },
    {
      title: 'Evidence pack 72% complete',
      summary: 'Four proof items are still missing.',
      why: 'The review team cannot validate readiness without the full evidence pack.',
      evidence: 'Fire report, lift sign-off, authority approval, and warranty pack.',
      action: 'Request missing files',
      chain: insight.dependencyChain ?? ['Missing evidence', 'Gate validation failure', 'Stage gate blocked', 'Project manager escalation'],
    },
  ];

  return stageGateBlockers[index] ?? {
    title: insight.signal,
    summary: insight.title,
    why: insight.detail,
    evidence: 'Linked project evidence and owner confirmation.',
    action: 'Prepare action',
    chain: insight.dependencyChain ?? [insight.signal, 'Manager review', 'Decision action', 'Project control update'],
  };
}

function getBlockerAction(index: number, actions: CopilotRecommendation[], insight?: CopilotInsight) {
  if (insight?.signal === 'What changed today' || insight?.signal === 'Health recalculation') return actions[0];
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
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[#C4B5FD]">DevelopmentX Copilot</div>
          <div className="mt-1 inline-flex rounded-full border border-[#7C3AED]/28 bg-[#7C3AED]/12 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-[#DDD6FE]">
            ProjectCommand mode
          </div>
          <p className="mt-2 text-[12px] font-bold leading-5 text-[#B8C7DB]">
            {projectName} - {screenLabels[screen]} - Health {health} - {completion} complete
          </p>
        </div>
        <span className="mt-1 shrink-0 rounded-full border border-red-300/22 bg-red-400/10 px-2.5 py-1 text-[10px] font-black text-red-100">{context.badge}</span>
      </div>
    </div>
  );
}

function AIConfidenceBadge({ value = 92 }: { value?: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-300/8 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-cyan-100 ring-1 ring-cyan-300/14">
      <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.45)]" />
      AI {value}%
    </span>
  );
}

function CopilotMonitoringStrip({ context }: { context: CopilotContext }) {
  const signals = ['Gates', 'Float', 'Evidence', 'Variations', 'Contractors'];
  const latest = context.control.latestEvent;

  return (
    <div className="border-b border-[rgba(46,127,255,0.10)] bg-[#07111F]/78 px-5 py-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#0A1628] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#C4B5FD] ring-1 ring-[rgba(46,127,255,0.12)]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-40" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
          </span>
          Project controls live scan
        </span>
        {signals.map(item => (
          <span key={item} className="rounded-full bg-white/[0.035] px-2.5 py-1 text-[10px] font-bold text-[#8EA7C7]">
            {item}
          </span>
        ))}
        {latest && (
          <span className="rounded-full border border-[#7C3AED]/30 bg-[#7C3AED]/12 px-2.5 py-1 text-[10px] font-black text-[#DDD6FE]">
            Event: {latest.title}
          </span>
        )}
      </div>
      <motion.p
        className="mt-3 rounded-2xl bg-amber-300/7 px-3 py-2 text-[11px] font-semibold leading-5 text-[#DCE8F8] ring-1 ring-amber-300/12"
        initial={{ opacity: 0.75 }}
        animate={{ opacity: [0.75, 1, 0.75] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      >
        ProjectCommand mode is reading live project events, KPI deltas, stage gates, evidence, variations, vendors, and manager actions. Prediction: {context.prediction.handoverRisk} handover risk if blockers remain after <span className="font-black text-amber-100">{context.prediction.unresolvedAfterDate}</span>.
        {' '}Health {context.control.healthMovement.from} {'->'} {context.control.healthMovement.to}; EAC {formatProjectCurrency(context.control.metrics.eac)}.
      </motion.p>
    </div>
  );
}

function ConsequenceSimulation({ context }: { context: CopilotContext }) {
  return (
    <div className="mt-4">
      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#8EA7C7]">Predicted consequence</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-2xl bg-red-400/7 p-3 ring-1 ring-red-300/12">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-red-200">If unresolved</p>
            <span className="rounded-full bg-red-300/10 px-2 py-0.5 text-[9px] font-black text-red-100">High risk</span>
          </div>
          <p className="mt-2 text-[20px] font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{context.prediction.daysAtRisk}d slip</p>
          <p className="mt-1 text-[10px] font-bold leading-4 text-[#FECACA]">MEP start exposed. Cost exposure {context.prediction.costExposure}.</p>
        </div>
        <div className="rounded-2xl bg-emerald-300/7 p-3 ring-1 ring-emerald-300/12">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-200">If resolved today</p>
            <span className="rounded-full bg-emerald-300/10 px-2 py-0.5 text-[9px] font-black text-emerald-100">Risk down</span>
          </div>
          <p className="mt-2 text-[20px] font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>+{context.prediction.confidenceGainIfResolved}%</p>
          <p className="mt-1 text-[10px] font-bold leading-4 text-emerald-100">Gate risk moves to {context.prediction.riskAfterResolved}. Review can proceed tomorrow.</p>
        </div>
      </div>
    </div>
  );
}

function DependencyChain({ items }: { items: string[] }) {
  return (
    <div className="mt-3">
      <p className="mb-2 text-[9px] font-black uppercase tracking-[0.14em] text-[#7A94B4]">Dependency path</p>
      <div className="rounded-xl bg-[#07111F]/72 p-2">
        {items.map((item, index) => (
          <div key={`${item}-${index}`} className="grid grid-cols-[18px_1fr] gap-2">
            <div className="flex flex-col items-center">
              <span className={`mt-0.5 h-2.5 w-2.5 rounded-full ${index === 0 ? 'bg-red-300' : index === items.length - 1 ? 'bg-emerald-300' : 'bg-[#5A6E88]'}`} />
              {index < items.length - 1 && <span className="my-1 h-4 w-px bg-[rgba(142,167,199,0.22)]" />}
            </div>
            <p className="pb-1 text-[10px] font-bold leading-4 text-[#DCE8F8]">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const askPrompts: Record<ProjectCommandScreen, string[]> = {
  overview: ['Ask what changed today...', 'Ask why did health drop...', 'Ask what is the biggest threat...'],
  programme: ['Ask what is consuming float...', 'Ask which phase threatens handover...', 'Ask what recovers the most time...'],
  stagegates: ['Ask why this gate is blocked...', 'Ask what evidence is missing...', 'Ask how to clear this gate fastest...'],
  cost: ['Ask what is driving cost variance...', 'Ask why CPI is below target...', 'Ask how to reduce forecast overrun...'],
  risk: ['Ask which risks need escalation...', 'Ask what happens if this risk is ignored...', 'Ask which mitigation is missing...'],
  obligations: ['Ask which obligation is most exposed...', 'Ask what notice should be sent...', 'Ask what proof is missing...'],
  evidence: ['Ask which documents are missing...', 'Ask whether this evidence is sufficient...', 'Ask what blocks verification...'],
  forecast: ['Ask which scenario is most likely...', 'Ask which decision recovers most time...', 'Ask what happens if we ignore this...'],
};

function CopilotAskBar({ screen, onAsk }: { screen: ProjectCommandScreen; onAsk: (question: string) => void }) {
  const [value, setValue] = useState('');
  const [promptIndex, setPromptIndex] = useState(0);
  const prompts = askPrompts[screen] ?? askPrompts.overview;

  useEffect(() => {
    const interval = window.setInterval(() => {
      setPromptIndex(current => (current + 1) % prompts.length);
    }, 4200);
    return () => window.clearInterval(interval);
  }, [screen, prompts.length]);

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
        Ask Copilot
      </label>
      <div className="mt-2 flex gap-2 rounded-2xl bg-[#0A1628] p-1.5 ring-1 ring-[rgba(46,127,255,0.14)] focus-within:ring-[#7C3AED]/45">
        <input
          value={value}
          onChange={event => setValue(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter') submit();
          }}
          placeholder={prompts[promptIndex]}
          className="min-w-0 flex-1 rounded-xl bg-transparent px-3 py-2.5 text-[12px] font-semibold text-[#EEF3FA] outline-none placeholder:text-[#5A6E88]"
        />
        <button onClick={submit} className="inline-flex h-10 w-11 items-center justify-center rounded-xl bg-[#7C3AED] text-white shadow-[0_10px_24px_rgba(124,58,237,0.25)] hover:bg-[#6D28D9]" aria-label="Ask Copilot">
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
      <div className="divide-y divide-[rgba(46,127,255,0.10)] overflow-hidden rounded-2xl bg-[#07111F]/62">
        {insights.slice(0, 3).map((insight, index) => {
          const blocker = getBlockerDisplay(insight, index);
          const rowAction = getBlockerAction(index, actions, insight);
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
                  <span className="text-[10px] font-black text-[#DCE8F8]">{blocker.title}</span>
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
                    <div className="rounded-2xl bg-[#0A1628]/70 p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p><span className="font-black text-white">Why: </span>{blocker.why}</p>
                        <AIConfidenceBadge value={getConfidence(insight)} />
                      </div>
                      <p><span className="font-black text-white">Required: </span>{blocker.evidence}</p>
                      <DependencyChain items={blocker.chain} />
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
  context,
  onSelect,
}: {
  recommendation: CopilotRecommendation;
  alternateActions: CopilotRecommendation[];
  context: CopilotContext;
  onSelect: (recommendation: CopilotRecommendation) => void;
}) {
  return (
    <section className="rounded-[24px] bg-[linear-gradient(135deg,rgba(124,58,237,0.16),rgba(7,17,31,0.96))] p-4 shadow-[0_18px_44px_rgba(0,0,0,0.18)] ring-1 ring-[#7C3AED]/16">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#C4B5FD]">
          <Zap size={13} />
          Do this first
        </span>
        <div className="flex items-center gap-1.5">
          <AIConfidenceBadge value={getConfidence(recommendation)} />
          <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${urgencyStyles[recommendation.urgency]}`}>{recommendation.urgency}</span>
        </div>
      </div>
      <h4 className="text-[16px] font-black leading-5 text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{recommendation.title}</h4>
      <div className="mt-3 grid gap-2 text-[12px] leading-5 text-[#DCE8F8]">
        <p className="rounded-2xl border border-[#7C3AED]/18 bg-[#7C3AED]/10 px-3 py-2"><span className="font-black text-[#DDD6FE]">Triggered by: </span>{recommendation.linkedObject}</p>
        <p className="rounded-2xl bg-white/[0.035] px-3 py-2"><span className="font-black text-white">Why: </span>{getPriorityWhy(recommendation)}</p>
        <p className="rounded-2xl bg-white/[0.035] px-3 py-2"><span className="font-black text-white">Next: </span>{getPriorityNext(recommendation)}</p>
      </div>
      <ConsequenceSimulation context={context} />
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button onClick={() => onSelect(recommendation)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-[12px] font-black text-white shadow-[0_12px_26px_rgba(124,58,237,0.25)] hover:bg-[#6D28D9]">
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
      <h4 className="mb-2 text-[12px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Fastest recovery actions</h4>
      <div className="flex flex-wrap gap-2">
        {recommendations.slice(0, 3).map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item)}
            className="group inline-flex items-center gap-2 rounded-full bg-[#07111F]/72 px-3 py-2 text-[10px] font-black text-[#DCE8F8] ring-1 ring-[rgba(46,127,255,0.12)] transition-colors hover:bg-[#7C3AED]/12 hover:ring-[#7C3AED]/35"
          >
            {getActionChipLabel(item)}
            <span className="rounded-full bg-emerald-300/10 px-2 py-0.5 text-[9px] text-emerald-100 group-hover:bg-emerald-300/14">{getActionEffect(item)}</span>
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
  const changedToday = lower.includes('changed today') || lower.includes('what changed');
  const healthDrop = lower.includes('health') || lower.includes('drop');
  const biggestThreat = lower.includes('biggest threat') || lower.includes('main threat');
  const ignore = lower.includes('ignore') || lower.includes('if we ignore');
  const recoverTime = lower.includes('recovers most time') || lower.includes('recover most time') || lower.includes('which decision');
  const primary = context.insights[0];
  const nextAction = getProjectCommandCopilotRecommendations(context)[0];

  const title = handover
    ? 'Handover is exposed by float loss and gate dependencies.'
    : cost
      ? 'Cost drift is being driven by efficiency loss and pending exposure.'
      : evidence
        ? 'Evidence gaps are blocking reliable gate clearance.'
        : changedToday
          ? context.control.latestEvent ? `${context.control.latestEvent.title} changed the control picture.` : 'The baseline is ready and no project event has been simulated yet.'
          : healthDrop
            ? `Health moved ${context.control.healthMovement.from} -> ${context.control.healthMovement.to}.`
            : biggestThreat
              ? context.control.topThreat
              : recoverTime
                ? `${context.control.managerActions[0]?.title ?? nextAction?.title} recovers the most time.`
                : primary.title;

  const whatISee = handover
    ? ['Float is being consumed by the critical path.', 'Gate clearance still depends on required evidence.', 'Downstream phases can inherit delay if recovery is not confirmed.']
    : cost
      ? ['CPI is below target.', 'Pending variations can move the revised budget.', 'Forecast at completion is trending above approved budget.']
      : evidence
        ? ['Required evidence is incomplete.', 'Some documents need owner or version review.', 'Gate movement should remain blocked until proof is verified.']
        : changedToday
          ? (context.control.changedToday.length > 0
              ? context.control.changedToday.slice(0, 3).map(event => `${event.title}: ${event.impactLabel}`)
              : ['AI generated the project control baseline.', 'No live event has been injected yet.', 'Demo controls can simulate delay, variation, evidence, inspection, vendor, or recovery events.'])
          : healthDrop
            ? [`Health score changed from ${context.control.healthMovement.from} to ${context.control.healthMovement.to}.`, context.control.latestImpact, `${context.control.controlExceptions.length} control exception(s) are active.`]
            : biggestThreat
              ? [context.control.topThreat, context.control.latestImpact, `Risk exposure is ${formatProjectCurrency(context.control.metrics.riskExposure)}.`]
              : recoverTime
                ? context.control.managerActions.slice(0, 3).map(action => `${action.title}: ${action.expectedImpact}`)
                : context.insights.slice(0, 3).map(item => item.title);

  const consequence = ignore
    ? `If ignored, forecast handover can move to ${context.control.forecastScenarios[2].handoverDate}, EAC can reach ${formatProjectCurrency(context.control.forecastScenarios[2].forecastCost)}, and ${context.control.controlExceptions.length || 1} control exception(s) remain unresolved.`
    : `MEP completion and handover review could slip by ${context.prediction.daysAtRisk} days, with estimated exposure of ${context.prediction.costExposure}.`;

  return (
    <div className="rounded-2xl border border-[#7C3AED]/24 bg-[linear-gradient(135deg,rgba(124,58,237,0.14),rgba(7,17,31,0.94))] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.25)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#C4B5FD]">
          <Bot size={14} />
          Answer
        </div>
        <AIConfidenceBadge value={context.prediction.confidence} />
      </div>
      <h4 className="text-[14px] font-black leading-5 text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{title}</h4>
      <div className="mt-3 space-y-3 text-[11px] leading-5 text-[#B8C7DB]">
        <div>
          <p className="font-black text-white">Evidence / signals</p>
          <ul className="mt-1 space-y-1">
            {whatISee.slice(0, 3).map(item => <li key={item}>- {item}</li>)}
          </ul>
        </div>
        <div>
          <p className="font-black text-white">If ignored</p>
          <p className="mt-1">{consequence}</p>
        </div>
        <div className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#07111F] px-3 py-2">
          <p className="font-black text-white">Recommended action</p>
          <p className="mt-1 text-[#DCE8F8]">{nextAction?.title}: {nextAction?.why}</p>
          <p className="mt-1 text-[10px] font-bold text-[#C4B5FD]">Triggered by: {nextAction?.linkedObject}</p>
          <p className="mt-2 text-[10px] font-bold text-[#7A94B4]">Sources: {context.sourceSignals.slice(0, 3).join(' - ')} - Confidence {context.prediction.confidence}%</p>
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
  const [editing, setEditing] = useState(isTask);
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
      ) : !editing ? (
        <div className="space-y-3">
          <div className="rounded-2xl bg-[#0A1628] p-3 ring-1 ring-[rgba(46,127,255,0.12)]">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[12px] font-black text-white">{action.title}</p>
              <span className="rounded-full bg-emerald-300/10 px-2 py-0.5 text-[9px] font-black text-emerald-100">Ready</span>
            </div>
            <div className="grid gap-1.5 text-[10px] font-bold leading-4 text-[#8EA7C7] sm:grid-cols-2">
              <p><span className="text-[#DCE8F8]">To</span> Authority / vendor contact</p>
              <p><span className="text-[#DCE8F8]">Due</span> 48h</p>
              <p><span className="text-[#DCE8F8]">Channel</span> Email / WhatsApp</p>
              <p><span className="text-[#DCE8F8]">Purpose</span> Clear blocker</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => setDone(true)} className="rounded-xl bg-[#7C3AED] px-3 py-2.5 text-[12px] font-black text-white hover:bg-[#6D28D9]">Send</button>
            <button onClick={() => setEditing(true)} className="rounded-xl bg-white/[0.04] px-3 py-2.5 text-[12px] font-black text-[#DCE8F8] hover:bg-white/[0.07]">Edit</button>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(text).catch(() => undefined);
                setCopied(true);
              }}
              className="rounded-xl bg-white/[0.04] px-3 py-2.5 text-[12px] font-black text-[#DCE8F8] hover:bg-white/[0.07]"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
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
          <button onClick={() => setEditing(false)} className="w-full rounded-xl border border-[rgba(46,127,255,0.16)] px-4 py-2 text-[11px] font-black text-[#8EA7C7] hover:bg-white/5">Collapse message</button>
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
        <button onClick={onClose} className="absolute right-4 top-4 rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#0A1628] p-2 text-[#8EA7C7] hover:bg-white/5 hover:text-white" aria-label="Close DevelopmentX Copilot">
          <X size={17} />
        </button>
      </div>
      <CopilotMonitoringStrip context={context} />
      <div className="custom-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto p-5 pb-6">
        {primaryAction && <CopilotNextActionCard recommendation={primaryAction} alternateActions={alternateActions} context={context} onSelect={setActiveAction} />}
        {activeAction && <CopilotActionComposer action={activeAction} onClose={() => setActiveAction(null)} onNavigate={next => { onNavigate(next); onClose(); }} />}
        <CopilotAttentionList insights={context.insights} actions={recommendations} onSelect={setActiveAction} />
        <CopilotActionChips recommendations={alternateActions} onSelect={setActiveAction} />
        {question && <CopilotResponse question={question} context={context} />}
      </div>
      <CopilotAskBar
        screen={screen}
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
          className="relative flex h-16 w-16 items-center justify-center rounded-full border border-[#7C3AED]/45 bg-[radial-gradient(circle_at_35%_30%,#60A5FA,#7C3AED_48%,#111827_78%)] text-white shadow-[0_0_34px_rgba(124,58,237,0.45)] transition-transform hover:scale-105"
          aria-label="Open DevelopmentX Copilot"
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
              aria-label="Close DevelopmentX Copilot overlay"
            />
            <ProjectCommandCopilotPanel screen={screen} onClose={() => setOpen(false)} onNavigate={onNavigate} />
          </>
        )}
      </AnimatePresence>
    </>
  );
}
