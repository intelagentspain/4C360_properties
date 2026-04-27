import { useMemo } from 'react';
import { useSelectedProjectCommandData } from './useProjectCommandData';

export type MetricName =
  | 'Completion'
  | 'Budget Used'
  | 'Days to Handover'
  | 'CPI'
  | 'SPI'
  | 'Float Remaining'
  | 'PV / BCWS'
  | 'AC / ACWP'
  | 'EV / BCWP'
  | 'Cost Variance';

export type MetricInsight = {
  metricName: MetricName;
  valueLabel: string;
  summary: string;
  rationale: string[];
  interpretation: string;
  recommendation: string;
  severity: 'positive' | 'monitor' | 'critical';
};

function formatMoney(value: number) {
  return `AED ${Math.round(Math.abs(value) / 1_000_000)}M`;
}

function formatMillions(value: number) {
  return `AED ${Math.abs(value)}M`;
}

function scoreSeverity(isCritical: boolean, isMonitor: boolean): MetricInsight['severity'] {
  if (isCritical) return 'critical';
  if (isMonitor) return 'monitor';
  return 'positive';
}

export function useMetricInsight(metricName: MetricName, value: string | number): MetricInsight {
  const { project, aiContent, evmSummary } = useSelectedProjectCommandData();

  return useMemo(() => {
    const valueLabel = typeof value === 'number' ? String(value) : value;
    const budgetCompletionGap = project.budgetUsed - project.completion;

    switch (metricName) {
      case 'Completion':
        return {
          metricName,
          valueLabel,
          severity: scoreSeverity(project.completion < 35 && project.budgetUsed > 45, project.completion < 50),
          summary: `${project.name} is ${project.completion}% complete against a ${project.budgetUsed}% budget utilization profile.`,
          rationale: [
            `Current AI 30-day forecast expects completion to reach ${aiContent.healthScore.forecast30d.completion}%.`,
            budgetCompletionGap > 15 ? `Budget use is ${budgetCompletionGap}% ahead of physical completion, which points to delivery inefficiency.` : 'Completion and budget consumption are broadly aligned.',
            `Health score is ${project.healthScore}/100, so progress should be read together with cost and float.`,
          ],
          interpretation: budgetCompletionGap > 15 ? 'The project is spending faster than it is physically progressing.' : 'Progress is broadly consistent with the current delivery plan.',
          recommendation: budgetCompletionGap > 15 ? 'Review package productivity, validate earned value, and focus weekly controls on trades consuming budget fastest.' : 'Keep current progress controls active and verify the next 30-day forecast at the next project review.',
        };
      case 'Budget Used':
        return {
          metricName,
          valueLabel,
          severity: scoreSeverity(budgetCompletionGap > 25, budgetCompletionGap > 12),
          summary: `${project.budgetUsed}% of the budget is consumed while physical completion is ${project.completion}%.`,
          rationale: [
            budgetCompletionGap > 0 ? `Budget is running ${budgetCompletionGap}% ahead of completion.` : `Completion is ${Math.abs(budgetCompletionGap)}% ahead of budget consumption.`,
            `AI forecast cost is ${formatMoney(project.forecastCost)} against a contract value of ${formatMoney(project.contractValue)}.`,
            `Current cost variance is ${project.costVariance < 0 ? '-' : '+'}${formatMoney(project.costVariance)}.`,
          ],
          interpretation: budgetCompletionGap > 12 ? 'The cost curve needs attention because spending is outpacing visible progress.' : 'Budget use is within a manageable range for the current delivery stage.',
          recommendation: budgetCompletionGap > 12 ? 'Open the Cost page, review top cost drivers, and challenge packages with high spend but low earned value.' : 'Continue monitoring the forecast band and keep change orders current.',
        };
      case 'Days to Handover':
        return {
          metricName,
          valueLabel,
          severity: scoreSeverity(project.daysToHandover < 90 && project.completion < 80, project.daysToHandover < 180),
          summary: `${project.daysToHandover} days remain until the target handover date.`,
          rationale: [
            `Target handover is ${new Date(project.targetHandover).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}.`,
            `AI base forecast is ${new Date(project.forecastCompletion).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}.`,
            `Remaining float is ${project.floatRemaining} days, so the schedule horizon depends on critical-path stability.`,
          ],
          interpretation: project.daysToHandover < 180 ? 'The project is entering a tighter control window where late approvals and inspections matter more.' : 'There is still enough horizon to recover issues if decisions are made early.',
          recommendation: project.daysToHandover < 180 ? 'Move handover blockers, approvals, and long-lead decisions into weekly executive review.' : 'Use scenario planning now to protect the baseline before the handover window narrows.',
        };
      case 'CPI':
        return {
          metricName,
          valueLabel,
          severity: scoreSeverity(project.cpi < 0.9, project.cpi < 1),
          summary: `CPI is ${project.cpi.toFixed(2)}, which means every AED spent is currently producing ${project.cpi.toFixed(2)} AED of earned value.`,
          rationale: [
            project.cpi < 1 ? 'CPI below 1.00 indicates cost inefficiency.' : project.cpi > 1 ? 'CPI above 1.00 indicates cost efficiency.' : 'CPI at 1.00 means cost is on target.',
            `Earned value is ${formatMoney(project.earnedValue)} against actual cost of ${formatMoney(project.actualCost)}.`,
            `AI forecast cost is ${formatMoney(project.forecastCost)}.`,
          ],
          interpretation: project.cpi < 1 ? 'The project is paying more than planned for the amount of work earned.' : 'Cost performance is currently efficient.',
          recommendation: project.cpi < 1 ? 'Review rework, procurement escalation, overtime, and variation leakage before the next payment cycle.' : 'Protect the current cost discipline and keep variation approval moving.',
        };
      case 'SPI':
        return {
          metricName,
          valueLabel,
          severity: scoreSeverity(project.spi < 0.92, project.spi < 1),
          summary: `SPI is ${project.spi.toFixed(2)}, comparing earned progress against planned progress.`,
          rationale: [
            project.spi < 1 ? 'SPI below 1.00 means the project is behind the planned schedule curve.' : project.spi > 1 ? 'SPI above 1.00 means the project is ahead of plan.' : 'SPI at 1.00 means schedule performance is on target.',
            `Schedule variance is ${project.scheduleVariance < 0 ? '-' : '+'}${formatMoney(project.scheduleVariance)}.`,
            aiContent.programmeInsights.criticalPathNarrative,
          ],
          interpretation: project.spi < 1 ? 'Schedule delivery is under pressure and may require resequencing or acceleration.' : 'Schedule delivery is healthy, but critical-path items still need protection.',
          recommendation: project.spi < 1 ? 'Prioritize critical path blockers, contractor productivity, and approval turnaround this week.' : 'Keep the baseline intact and avoid pulling resources away from critical activities.',
        };
      case 'Float Remaining':
        return {
          metricName,
          valueLabel,
          severity: scoreSeverity(project.floatRemaining < 15, project.floatRemaining < 30),
          summary: `${project.floatRemaining} days of float remain on the critical path.`,
          rationale: [
            project.floatRemaining < 30 ? 'Float below 30 days leaves limited room for rework, procurement slips, or authority delays.' : 'Float is currently adequate, but still needs protection.',
            aiContent.healthScore.topThreat,
            `Base forecast completion is ${new Date(project.forecastCompletion).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}.`,
          ],
          interpretation: project.floatRemaining < 30 ? 'This is a schedule-risk metric. Small delays can now cascade into handover.' : 'There is enough buffer to manage normal disruption if decisions stay on time.',
          recommendation: project.floatRemaining < 30 ? 'Escalate the top threat, freeze weekly recovery actions, and simulate the impact of a 7-14 day delay.' : 'Keep tracking float weekly and preserve the current decision cadence.',
        };
      case 'PV / BCWS':
        return {
          metricName,
          valueLabel,
          severity: scoreSeverity(evmSummary.ev < evmSummary.pv * 0.9, evmSummary.ev < evmSummary.pv),
          summary: `Planned Value is ${formatMillions(evmSummary.pv)}, showing the budgeted value of work that should be complete by now.`,
          rationale: [
            `Earned Value is ${formatMillions(evmSummary.ev)}, creating a schedule variance of ${evmSummary.sv < 0 ? '-' : '+'}${formatMillions(evmSummary.sv)}.`,
            `SPI is ${evmSummary.spi.toFixed(2)}, so planned work is ahead of earned progress.`,
            `The current baseline is being pressured by ${aiContent.healthScore.topThreat.toLowerCase()}`,
          ],
          interpretation: evmSummary.ev < evmSummary.pv ? 'The project has planned more work than it has actually earned, which points to schedule drag.' : 'Earned work is keeping pace with the baseline plan.',
          recommendation: evmSummary.ev < evmSummary.pv ? 'Use the Programme page to isolate the activities causing the PV-to-EV gap and protect the next critical milestones.' : 'Keep the baseline active and continue monitoring planned value against weekly earned progress.',
        };
      case 'AC / ACWP':
        return {
          metricName,
          valueLabel,
          severity: scoreSeverity(evmSummary.ac > evmSummary.ev * 1.18, evmSummary.ac > evmSummary.ev),
          summary: `Actual Cost is ${formatMillions(evmSummary.ac)}, representing the cumulative spend booked against the project to date.`,
          rationale: [
            `Actual Cost is ${formatMillions(evmSummary.ac)} versus Earned Value of ${formatMillions(evmSummary.ev)}.`,
            `CPI is ${evmSummary.cpi.toFixed(2)}, indicating ${evmSummary.cpi < 1 ? 'cost inefficiency' : 'cost efficiency'} at the current run rate.`,
            'Top cost pressure is linked to rework, procurement escalation, and pending variations.',
          ],
          interpretation: evmSummary.ac > evmSummary.ev ? 'Spend is ahead of earned progress, so the project is paying more than the work currently justifies.' : 'Spend is aligned with earned progress.',
          recommendation: evmSummary.ac > evmSummary.ev ? 'Review high-spend packages, validate rework claims, and tighten variation approvals before the next payment cycle.' : 'Maintain current cost controls and keep procurement exposure visible.',
        };
      case 'EV / BCWP':
        return {
          metricName,
          valueLabel,
          severity: scoreSeverity(evmSummary.ev < evmSummary.ac * 0.85, evmSummary.ev < evmSummary.pv),
          summary: `Earned Value is ${formatMillions(evmSummary.ev)}, showing the budgeted value of the work actually completed.`,
          rationale: [
            `EV is ${formatMillions(evmSummary.ev)} against PV of ${formatMillions(evmSummary.pv)} and AC of ${formatMillions(evmSummary.ac)}.`,
            `The project has earned ${Math.round((evmSummary.ev / Math.max(evmSummary.pv, 1)) * 100)}% of planned value to date.`,
            `Completion is ${project.completion}% while budget used is ${project.budgetUsed}%.`,
          ],
          interpretation: evmSummary.ev < evmSummary.pv ? 'The project is not converting planned spend into earned progress fast enough.' : 'Earned work is aligned with the current baseline.',
          recommendation: evmSummary.ev < evmSummary.pv ? 'Prioritize activities with low earned value but high actual cost, then confirm recovery actions in the weekly project review.' : 'Continue validating earned value through site progress and package sign-offs.',
        };
      case 'Cost Variance':
        return {
          metricName,
          valueLabel,
          severity: scoreSeverity(evmSummary.cv < -20, evmSummary.cv < 0),
          summary: `Cost Variance is ${evmSummary.cv < 0 ? '-' : '+'}${formatMillions(evmSummary.cv)}, calculated as Earned Value minus Actual Cost.`,
          rationale: [
            `Earned Value is ${formatMillions(evmSummary.ev)} and Actual Cost is ${formatMillions(evmSummary.ac)}.`,
            evmSummary.cv < 0 ? 'A negative variance means the project has spent more than the value of work earned.' : 'A positive variance means the project has earned more value than it has spent.',
            `AI estimate at completion is ${formatMillions(evmSummary.eac)} with a variance at completion of ${evmSummary.vac < 0 ? '-' : '+'}${formatMillions(evmSummary.vac)}.`,
          ],
          interpretation: evmSummary.cv < 0 ? 'Cost performance needs intervention because current spend is not being matched by earned progress.' : 'Cost performance is favorable at this point in the project.',
          recommendation: evmSummary.cv < 0 ? 'Challenge rework, pending VOs, and package productivity immediately, then simulate whether acceleration costs worsen the EAC.' : 'Protect the current variance and continue tracking pending change orders.',
        };
      default:
        return {
          metricName,
          valueLabel,
          severity: 'monitor',
          summary: 'AI is reviewing this metric against current project context.',
          rationale: ['Metric is compared against programme, cost, and risk signals.'],
          interpretation: 'Use this as a directional control signal.',
          recommendation: 'Review connected project data before taking action.',
        };
    }
  }, [aiContent, metricName, project, value]);
}
