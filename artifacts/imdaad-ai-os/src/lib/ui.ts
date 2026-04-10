export type ToastFn = (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;

export const SEVERITY_BADGE: Record<string, string> = {
  critical: 'text-red-400 bg-red-500/20 border-red-500/40',
  high: 'text-orange-400 bg-orange-500/20 border-orange-500/40',
  medium: 'text-amber-400 bg-amber-500/20 border-amber-500/40',
  low: 'text-blue-400 bg-blue-500/20 border-blue-500/40',
};

export const PRIORITY_DOT: Record<string, string> = {
  critical: 'bg-red-400',
  high: 'bg-orange-400',
  medium: 'bg-amber-400',
  low: 'bg-[#7A94B4]',
};

export const AVAIL_COLOR: Record<string, string> = {
  available: 'text-emerald-400',
  'en-route': 'text-blue-400',
  busy: 'text-amber-400',
};

export const TASK_STATUS_COLOR: Record<string, string> = {
  new: 'text-[#7A94B4]',
  assigned: 'text-blue-400',
  'in-progress': 'text-cyan-400',
  'awaiting-evidence': 'text-amber-400',
  closed: 'text-emerald-400',
  overdue: 'text-red-400',
};

export function scoreColor(value: number): string {
  if (value >= 90) return '#38D98A';
  if (value >= 70) return '#FF9B38';
  return '#FF4B4B';
}

export function slaStatus(elapsed: number, totalMinutes: number) {
  const left = totalMinutes - elapsed;
  const percent = Math.min(100, (elapsed / totalMinutes) * 100);
  const overdue = left <= 0;
  const critical = left <= 10 && !overdue;
  const warning = left <= 30 && !overdue && !critical;
  const barColor = overdue ? '#FF4B4B' : critical ? '#FF9B38' : '#38D98A';
  const chipColor = overdue ? '#FF4B4B' : critical ? '#FF4B4B' : warning ? '#FF9B38' : '#7A94B4';
  const label = overdue
    ? `OVERDUE ${Math.abs(left)}m`
    : left <= 30
    ? `${left}m`
    : `${left}m`;
  return { left, percent, overdue, critical, warning, barColor, chipColor, label };
}
