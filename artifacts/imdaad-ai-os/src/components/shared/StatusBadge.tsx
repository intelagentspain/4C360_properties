interface Props {
  severity: string;
  className?: string;
}

const config: Record<string, { label: string; className: string }> = {
  critical: { label: 'CRITICAL', className: 'bg-red-500/20 text-red-400 border border-red-500/40' },
  high: { label: 'HIGH', className: 'bg-red-500/10 text-red-300 border border-red-400/30' },
  medium: { label: 'MEDIUM', className: 'bg-amber-500/20 text-amber-400 border border-amber-500/40' },
  low: { label: 'LOW', className: 'bg-blue-500/20 text-blue-300 border border-blue-500/40' },
  available: { label: 'AVAILABLE', className: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' },
  active: { label: 'ON JOB', className: 'bg-amber-500/20 text-amber-400 border border-amber-500/40' },
  transit: { label: 'EN ROUTE', className: 'bg-blue-500/20 text-blue-300 border border-blue-500/40' },
  overdue: { label: 'OVERDUE', className: 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse' },
  out: { label: 'OUT OF STOCK', className: 'bg-red-500/20 text-red-400 border border-red-500/40' },
  low_stock: { label: 'LOW STOCK', className: 'bg-amber-500/20 text-amber-400 border border-amber-500/40' },
  ok: { label: 'AVAILABLE', className: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' },
};

export function StatusBadge({ severity, className = '' }: Props) {
  const c = config[severity] || { label: severity.toUpperCase(), className: 'bg-blue-500/20 text-blue-300 border border-blue-500/40' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${c.className} ${className}`}>
      {c.label}
    </span>
  );
}
