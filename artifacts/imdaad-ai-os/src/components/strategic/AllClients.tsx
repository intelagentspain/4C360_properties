import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Grid, List, AlertTriangle, CheckCircle, Clock,
  Zap, ChevronRight, Activity, Database, Users, BarChart2,
  TrendingUp, MapPin, ArrowRight, Shield, Bot, Plus,
  FileText, Truck, Package, Wrench, Calendar, Share2, Link2, Mail, Send, Check,
} from 'lucide-react';
import { type PortfolioClient } from '@/data/mockData';
import { type ToastFn } from '@/lib/ui';
import { AnimatedBar } from '@/components/shared/AnimatedBar';
import { AddClientModal, type ClientData, type TeamMember } from './CommandBar';
import { useMemberFilter, isFilterActive } from '@/context/MemberFilterContext';
import { useMemberProfiles } from '@/context/MemberProfilesContext';
import { useClients } from '@/context/ClientsContext';
import { useIncidents } from '@/context/IncidentContext';

const REGIONS   = ['All', 'Dubai East', 'Downtown', 'Business Bay', 'Dubai Marina', 'Jumeirah'];
const SECTORS   = ['All', 'Mixed-Use Residential', 'Commercial Retail', 'Commercial Office', 'Residential Community', 'Luxury Residential'];
const STATUSES  = ['All', 'live', 'warning', 'critical'];
const RISK_LVLS = ['All', 'low', 'medium', 'high', 'critical'];
const SORT_OPTS = [
  { label: 'Highest Risk',   key: 'risk' },
  { label: 'Most Sites',     key: 'sites' },
  { label: 'SLA (Lowest)',   key: 'sla' },
  { label: 'Most Incidents', key: 'incidents' },
];

const RISK_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
const STATUS_ORDER: Record<string, number> = { critical: 0, warning: 1, live: 2 };

const STATUS_DOT: Record<string, string> = {
  live:     'bg-emerald-400',
  warning:  'bg-amber-400 animate-pulse',
  critical: 'bg-red-400 animate-pulse',
};

const STATUS_TEXT: Record<string, string> = {
  live:     'text-emerald-400',
  warning:  'text-amber-400',
  critical: 'text-red-400',
};

const STATUS_BORDER: Record<string, string> = {
  live:     'border-emerald-500/30',
  warning:  'border-amber-500/40',
  critical: 'border-red-500/40',
};

const STATUS_GLOW: Record<string, string> = {
  live:     '',
  warning:  'shadow-[0_0_0_1px_rgba(251,191,36,0.15)]',
  critical: 'shadow-[0_0_0_1px_rgba(239,68,68,0.2)]',
};

const RISK_STRIP: Record<string, string> = {
  low:      'bg-emerald-500',
  medium:   'bg-amber-500',
  high:     'bg-orange-500',
  critical: 'bg-red-500',
};

const RISK_BADGE: Record<string, string> = {
  low:      'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  medium:   'text-amber-400 bg-amber-500/10 border-amber-500/30',
  high:     'text-orange-400 bg-orange-500/10 border-orange-500/30',
  critical: 'text-red-400 bg-red-500/10 border-red-500/30',
};

const SITE_STATUS_DOT: Record<string, string> = {
  ok:       'bg-emerald-400',
  warning:  'bg-amber-400',
  critical: 'bg-red-400',
};

const ACTIVITY_COLOR: Record<string, string> = {
  task:       'text-emerald-400',
  ai:         'text-cyan-400',
  ok:         'text-emerald-400',
  incident:   'text-red-400',
  escalation: 'text-amber-400',
};

const ACTIVITY_ICON: Record<string, React.ReactNode> = {
  task:       <CheckCircle size={10} />,
  ai:         <Bot size={10} />,
  ok:         <CheckCircle size={10} />,
  incident:   <AlertTriangle size={10} />,
  escalation: <TrendingUp size={10} />,
};

interface PulseEvent {
  id: string;
  client: string;
  title: string;
  sub: string;
  time: string;
  severity: 'critical' | 'high' | 'medium' | 'info' | 'ok';
}

const PULSE_EVENTS: PulseEvent[] = [
  { id: 'p1', client: 'JLT North Cluster',       title: 'CRITICAL: Lift fault — 3 residents stranded',    sub: 'Cluster N1, Tower 5 · Escalated',             time: '1 min ago',  severity: 'critical' },
  { id: 'p2', client: 'Business Bay Tower',       title: 'SLA breach cascade — 4 jobs simultaneously',     sub: 'Tower A floors 8–12 · Supervisor notified',   time: '5 min ago',  severity: 'critical' },
  { id: 'p3', client: 'JLT North Cluster',        title: 'AI flag: Technician shortage detected',          sub: '9 overdue tasks · Reassignment required',      time: '10 min ago', severity: 'high'     },
  { id: 'p4', client: 'Business Bay Tower',       title: 'Power BI sync failure — reporting gap',          sub: 'Token expired · IT Ops alerted',               time: '14 min ago', severity: 'high'     },
  { id: 'p5', client: 'Jumeirah Village Circle',  title: 'Irrigation seasonal service overdue 18 days',    sub: 'District 10 · Compliance risk',                time: '20 min ago', severity: 'medium'   },
  { id: 'p6', client: 'Dubai Silicon Oasis',      title: 'IoT: Chiller C-04 predictive flag raised',       sub: 'Refrigerant 72% · Service within 6 days',     time: '28 min ago', severity: 'medium'   },
  { id: 'p7', client: 'Downtown Burj Area',       title: 'AI prevented HVAC fault — PPM dispatched',       sub: 'Residence Tower 1 · Proactive response',       time: '35 min ago', severity: 'info'     },
];

const PULSE_SEV_BORDER: Record<string, string> = {
  critical: 'border-l-red-500',
  high:     'border-l-amber-400',
  medium:   'border-l-amber-500/60',
  info:     'border-l-cyan-500/60',
  ok:       'border-l-emerald-500/60',
};

const PULSE_SEV_ICON: Record<string, { icon: React.ReactNode; cls: string }> = {
  critical: { icon: <AlertTriangle size={11} />, cls: 'text-red-400 bg-red-500/20' },
  high:     { icon: <AlertTriangle size={11} />, cls: 'text-amber-400 bg-amber-500/20' },
  medium:   { icon: <Clock size={11} />, cls: 'text-amber-400 bg-amber-500/20' },
  info:     { icon: <Bot size={11} />, cls: 'text-cyan-400 bg-cyan-500/20' },
  ok:       { icon: <CheckCircle size={11} />, cls: 'text-emerald-400 bg-emerald-500/20' },
};

function PortfolioSummaryStrip({ clients }: { clients: PortfolioClient[] }) {
  const totalSites       = clients.reduce((s, c) => s + c.sites, 0);
  const totalWO          = clients.reduce((s, c) => s + c.workOrders, 0);
  const { incidents }    = useIncidents();
  const criticalInc      = incidents.filter(i => i.severity === 'critical' && i.status !== 'closed').length;
  const avgSLA           = Math.round(clients.reduce((s, c) => s + c.sla, 0) / clients.length);
  const totalDS          = clients.reduce((s, c) => s + c.dataSources.length, 0);

  const kpis = [
    { label: 'Total Clients',        value: clients.length,  icon: <Users size={13} />,    color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20' },
    { label: 'Total Sites',          value: totalSites,      icon: <MapPin size={13} />,   color: 'text-cyan-400',    bg: 'bg-cyan-500/10 border-cyan-500/20' },
    { label: 'Active Work Orders',   value: totalWO,         icon: <Activity size={13} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Critical Incidents',   value: criticalInc,     icon: <AlertTriangle size={13} />, color: criticalInc > 0 ? 'text-red-400' : 'text-emerald-400', bg: criticalInc > 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Avg SLA',              value: `${avgSLA}%`,    icon: <Shield size={13} />,   color: avgSLA >= 90 ? 'text-emerald-400' : avgSLA >= 80 ? 'text-amber-400' : 'text-red-400', bg: avgSLA >= 90 ? 'bg-emerald-500/10 border-emerald-500/20' : avgSLA >= 80 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20' },
    { label: 'Connected Data Sources', value: totalDS,         icon: <Database size={13} />, color: 'text-purple-400',  bg: 'bg-purple-500/10 border-purple-500/20' },
  ];

  return (
    <div className="grid grid-cols-6 gap-2 px-5 py-3 border-b border-[rgba(46,127,255,0.12)] flex-shrink-0">
      {kpis.map(k => (
        <div key={k.label} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border ${k.bg}`}>
          <div className={k.color}>{k.icon}</div>
          <div>
            <div className={`text-base font-bold leading-tight ${k.color}`}>{k.value}</div>
            <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide leading-tight mt-0.5">{k.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PortfolioPulseFeed() {
  const [events, setEvents] = useState<PulseEvent[]>(PULSE_EVENTS.slice(0, 5));
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setIdx(i => i + 1);
    }, 12000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (idx > 0) {
      const next = PULSE_EVENTS[(4 + idx) % PULSE_EVENTS.length];
      if (next) setEvents(prev => {
        const updated = [{ ...next, id: `${next.id}-${idx}`, time: 'Just now' }, ...prev];
        return updated.slice(0, 7);
      });
    }
  }, [idx]);

  return (
    <div className="mx-5 mb-3 rounded-xl border border-[rgba(46,127,255,0.2)] bg-[rgba(17,32,64,0.7)] overflow-hidden flex-shrink-0">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[rgba(46,127,255,0.12)]">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          <span className="text-[10px] font-bold text-[#EEF3FA] uppercase tracking-wide">Portfolio Pulse</span>
          <span className="text-[9px] text-[#7A94B4]">Cross-client live events</span>
        </div>
        <span className="text-[9px] text-[#7A94B4]">{events.length} events</span>
      </div>
      <div className="flex overflow-hidden">
        <AnimatePresence initial={false}>
          {events.map(ev => {
            const border = PULSE_SEV_BORDER[ev.severity];
            const cfg    = PULSE_SEV_ICON[ev.severity];
            return (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22 }}
                className={`flex-1 min-w-0 flex items-start gap-2 px-3 py-2 border-r border-[rgba(46,127,255,0.08)] border-l-2 ${border} last:border-r-0`}
              >
                <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.cls}`}>
                  {cfg.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] text-[#7A94B4] truncate">{ev.client}</div>
                  <div className="text-[11px] text-[#EEF3FA] font-medium leading-tight truncate">{ev.title}</div>
                  <div className="text-[9px] text-[#7A94B4] mt-0.5 truncate">{ev.sub}</div>
                  <div className="text-[8px] text-[#7A94B4] opacity-60 mt-0.5">{ev.time}</div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

function MetricPill({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="flex flex-col items-center bg-[#0A1628] rounded-lg px-2 py-1.5 min-w-[48px]">
      <span className={`text-[13px] font-bold leading-tight ${color}`}>{value}</span>
      <span className="text-[8px] text-[#7A94B4] uppercase tracking-wide mt-0.5 text-center">{label}</span>
    </div>
  );
}

function CardActions({
  client,
  onToast,
  onNavigateToIncidents,
  onNavigateToCommand,
  onReport,
}: {
  client: PortfolioClient;
  onToast: ToastFn;
  onNavigateToIncidents: (clientId: string) => void;
  onNavigateToCommand: (clientId: string, clientName?: string) => void;
  onReport: (c: PortfolioClient) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-1 pt-2 border-t border-[rgba(46,127,255,0.1)]">
      <button
        onClick={e => { e.stopPropagation(); onNavigateToCommand(client.id, client.name); }}
        className="flex flex-col items-center gap-0.5 py-1.5 rounded-lg bg-[rgba(46,127,255,0.1)] hover:bg-[rgba(46,127,255,0.2)] text-cyan-400 transition-colors"
        title="Command Center"
      >
        <Activity size={11} />
        <span className="text-[8px] font-semibold">Command</span>
      </button>
      <button
        onClick={e => { e.stopPropagation(); onNavigateToIncidents(client.id); }}
        className="flex flex-col items-center gap-0.5 py-1.5 rounded-lg bg-[rgba(46,127,255,0.1)] hover:bg-[rgba(46,127,255,0.2)] text-amber-400 transition-colors"
        title="View Incidents"
      >
        <AlertTriangle size={11} />
        <span className="text-[8px] font-semibold">Incidents</span>
      </button>
      <button
        onClick={e => { e.stopPropagation(); onReport(client); }}
        className="flex flex-col items-center gap-0.5 py-1.5 rounded-lg bg-[rgba(46,127,255,0.1)] hover:bg-[rgba(46,127,255,0.2)] text-emerald-400 transition-colors"
        title="Generate Report"
      >
        <TrendingUp size={11} />
        <span className="text-[8px] font-semibold">Report</span>
      </button>
    </div>
  );
}

function ClientPortfolioCard({
  client,
  onSelect,
  onToast,
  onReport,
  view,
  onNavigateToIncidents,
  onNavigateToCommand,
}: {
  client: PortfolioClient;
  onSelect: (c: PortfolioClient) => void;
  onToast: ToastFn;
  onReport: (c: PortfolioClient) => void;
  view: 'grid' | 'list';
  onNavigateToIncidents: (clientId: string) => void;
  onNavigateToCommand: (clientId: string, clientName?: string) => void;
}) {
  const slaColor = client.sla >= 90 ? 'text-emerald-400' : client.sla >= 80 ? 'text-amber-400' : 'text-red-400';
  const compColor = client.compliance >= 90 ? 'text-emerald-400' : client.compliance >= 80 ? 'text-amber-400' : 'text-red-400';

  if (view === 'list') {
    return (
      <motion.div
        whileTap={{ scale: 0.995 }}
        className={`w-full flex flex-col rounded-xl border bg-[rgba(17,32,64,0.7)] overflow-hidden ${STATUS_BORDER[client.status]} ${STATUS_GLOW[client.status]}`}
      >
        <button
          onClick={() => onSelect(client)}
          className="w-full text-left flex items-center gap-4 px-4 py-3 hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-2 w-52 flex-shrink-0">
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${STATUS_DOT[client.status]}`} />
            <div>
              <div className="text-[13px] text-[#EEF3FA] font-bold leading-tight">{client.name}</div>
              <div className="text-[9px] text-[#7A94B4]">{client.region} · {client.sector}</div>
            </div>
          </div>
          <div className="flex gap-2 flex-1">
            <MetricPill label="Sites"   value={client.sites}      color="text-[#EEF3FA]" />
            <MetricPill label="WOs"     value={client.workOrders} color="text-blue-400" />
            <MetricPill label="Incidents" value={client.incidents} color={client.incidents > 5 ? 'text-red-400' : client.incidents > 2 ? 'text-amber-400' : 'text-emerald-400'} />
            <MetricPill label="SLA"     value={`${client.sla}%`}  color={slaColor} />
            <MetricPill label="Comply"  value={`${client.compliance}%`} color={compColor} />
          </div>
          <div className={`text-[10px] font-bold px-2 py-1 rounded-lg border capitalize flex-shrink-0 ${RISK_BADGE[client.riskLevel]}`}>
            {client.riskLevel}
          </div>
          <div className="flex gap-1 flex-shrink-0">
            {client.dataSources.map(ds => (
              <span key={ds.label} className="text-[9px] bg-[rgba(46,127,255,0.1)] border border-[rgba(46,127,255,0.2)] text-blue-300 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                {ds.label} <span className="opacity-60">·{ds.count.toLocaleString()}</span>
              </span>
            ))}
          </div>
          <ChevronRight size={14} className="text-[#7A94B4] flex-shrink-0" />
        </button>
        <div className="px-4 pb-2.5">
          <CardActions client={client} onToast={onToast} onNavigateToIncidents={onNavigateToIncidents} onNavigateToCommand={onNavigateToCommand} onReport={onReport} />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col rounded-xl border bg-[rgba(17,32,64,0.7)] overflow-hidden ${STATUS_BORDER[client.status]} ${STATUS_GLOW[client.status]}`}
    >
      <div className={`h-1 w-full ${RISK_STRIP[client.riskLevel]}`} />

      <button
        onClick={() => onSelect(client)}
        className="p-3 flex-1 flex flex-col gap-2.5 text-left hover:bg-white/[0.02] transition-colors group"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5 ${STATUS_DOT[client.status]}`} />
            <div>
              <div className="text-[13px] text-[#EEF3FA] font-bold leading-tight">{client.name}</div>
              <div className="text-[9px] text-[#7A94B4] mt-0.5">{client.region} · {client.sector}</div>
            </div>
          </div>
          <div className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border capitalize flex-shrink-0 ${RISK_BADGE[client.riskLevel]}`}>
            {client.riskLevel}
          </div>
        </div>

        <div className="grid grid-cols-5 gap-1">
          <MetricPill label="Sites"    value={client.sites}      color="text-[#EEF3FA]" />
          <MetricPill label="WOs"      value={client.workOrders} color="text-blue-400" />
          <MetricPill label="Inc."     value={client.incidents}  color={client.incidents > 5 ? 'text-red-400' : client.incidents > 2 ? 'text-amber-400' : 'text-emerald-400'} />
          <MetricPill label="SLA"      value={`${client.sla}%`}  color={slaColor} />
          <MetricPill label="Comply"   value={`${client.compliance}%`} color={compColor} />
        </div>

        <div className="flex flex-wrap gap-1">
          {client.dataSources.map(ds => (
            <span key={ds.label} className="text-[9px] bg-[rgba(46,127,255,0.1)] border border-[rgba(46,127,255,0.2)] text-blue-300 px-1.5 py-0.5 rounded-full whitespace-nowrap">
              {ds.label} <span className="opacity-60">·{ds.count.toLocaleString()}</span>
            </span>
          ))}
        </div>

        <div className="flex items-start gap-1.5 p-2 bg-[rgba(6,182,212,0.05)] border border-cyan-500/10 rounded-lg">
          <Zap size={10} className="text-cyan-400 flex-shrink-0 mt-0.5" />
          <span className="text-[10px] text-[#7A94B4] leading-snug line-clamp-2">{client.aiInsight}</span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className={`text-[9px] font-semibold capitalize flex items-center gap-1 ${STATUS_TEXT[client.status]}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[client.status]}`} />
            {client.status}
          </span>
          <span className="text-[9px] text-[#7A94B4]">Updated {client.lastUpdated}</span>
        </div>
      </button>

      <div className="px-3 pb-3">
        <CardActions client={client} onToast={onToast} onNavigateToIncidents={onNavigateToIncidents} onNavigateToCommand={onNavigateToCommand} onReport={onReport} />
      </div>
    </motion.div>
  );
}

function ArcGauge({ value, label, color }: { value: number; label: string; color: string }) {
  const cx = 45;
  const cy = 45;
  const r = 36;
  const stroke = 7;

  const polarToCartesian = (angle: number) => ({
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  });

  const arcPath = (from: number, to: number) => {
    const s = polarToCartesian(from);
    const e = polarToCartesian(to);
    const large = Math.abs(to - from) > Math.PI ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y}`;
  };

  const pct = Math.min(Math.max(value, 0), 100) / 100;
  const angle80 = Math.PI - 0.8 * Math.PI;
  const angle90 = Math.PI - 0.9 * Math.PI;
  const m80 = polarToCartesian(angle80);
  const m90 = polarToCartesian(angle90);

  const circumference = Math.PI * r;
  const dashOffset = circumference * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: cx * 2, height: cy + stroke }}>
        <svg width={cx * 2} height={cy + stroke} style={{ overflow: 'visible' }}>
          <path d={arcPath(Math.PI, 0)} fill="none" stroke="rgba(46,127,255,0.15)" strokeWidth={stroke} strokeLinecap="round" />
          <motion.path
            d={arcPath(Math.PI, 0)}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
          <circle cx={m80.x} cy={m80.y} r={3} fill="#FF9B38" opacity={0.8} />
          <circle cx={m90.x} cy={m90.y} r={3} fill="#38D98A" opacity={0.8} />
        </svg>
        <div className="absolute inset-0 flex items-end justify-center pb-0.5">
          <span className="text-lg font-bold" style={{ color }}>{value}%</span>
        </div>
      </div>
      <span className="text-[10px] text-[#7A94B4] uppercase tracking-wide">{label}</span>
    </div>
  );
}

function ReportSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-[rgba(46,127,255,0.15)]">
        <div className="text-blue-400">{icon}</div>
        <span className="text-[11px] font-bold text-[#EEF3FA] uppercase tracking-widest">{title}</span>
      </div>
      {children}
    </div>
  );
}

function KPITile({ label, value, color, sub }: { label: string; value: string | number; color: string; sub?: string }) {
  const colorMap: Record<string, string> = {
    green: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
    red: 'text-red-400 bg-red-500/10 border-red-500/25',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/25',
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/25',
    white: 'text-[#EEF3FA] bg-white/5 border-white/10',
  };
  return (
    <div className={`rounded-xl border px-3 py-3 flex flex-col gap-1 ${colorMap[color] ?? colorMap.white}`}>
      <span className={`text-2xl font-bold leading-tight ${colorMap[color]?.split(' ')[0]}`}>{value}</span>
      <span className="text-[9px] text-[#7A94B4] uppercase tracking-wide leading-tight">{label}</span>
      {sub && <span className="text-[9px] text-[#7A94B4] opacity-70">{sub}</span>}
    </div>
  );
}

function ClientReportPanel({
  client,
  onClose,
}: {
  client: PortfolioClient;
  onClose: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareMode, setShareMode] = useState<'menu' | 'email'>('menu');
  const [emailTo, setEmailTo] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailResult, setEmailResult] = useState<'idle' | 'sent' | 'error'>('idle');
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  function closeShare() {
    setShareOpen(false);
    setShareMode('menu');
    setEmailTo('');
    setEmailResult('idle');
    setCopyFailed(false);
  }

  function handleCopyLink() {
    const url = `${window.location.origin}${window.location.pathname}?report=${client.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setCopyFailed(false);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      setCopyFailed(true);
      setTimeout(() => setCopyFailed(false), 3000);
    });
  }

  async function handleSendEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!emailTo) return;
    setEmailSending(true);
    setEmailResult('idle');
    try {
      const apiBase = (import.meta.env.VITE_API_URL ?? '/api') as string;
      const res = await fetch(`${apiBase}/share-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailTo,
          client: {
            id: client.id,
            name: client.name,
            riskLevel: client.riskLevel,
            sla: client.sla,
            compliance: client.compliance,
            incidents: client.incidents,
            resources: client.resources,
          },
        }),
      });
      if (res.ok) {
        setEmailResult('sent');
        setTimeout(() => closeShare(), 2000);
      } else {
        setEmailResult('error');
      }
    } catch {
      setEmailResult('error');
    } finally {
      setEmailSending(false);
    }
  }

  const slaColor = client.sla >= 90 ? '#38D98A' : client.sla >= 80 ? '#FF9B38' : '#FF4B4B';
  const compColor = client.compliance >= 90 ? '#38D98A' : client.compliance >= 80 ? '#FF9B38' : '#FF4B4B';
  const slaGaugeColor = client.sla >= 90 ? '#38D98A' : client.sla >= 80 ? '#FF9B38' : '#FF4B4B';
  const compGaugeColor = client.compliance >= 90 ? '#38D98A' : client.compliance >= 80 ? '#FF9B38' : '#FF4B4B';

  const dsQuality = (ds: { count: number }) => {
    if (ds.count === 0) return 0;
    if (ds.count >= 500) return 96;
    if (ds.count >= 100) return 88;
    return 74;
  };

  const kpiColor = (val: number, good: number, warn: number, invert = false): string => {
    if (invert) return val === 0 ? 'green' : val <= warn ? 'amber' : 'red';
    return val >= good ? 'green' : val >= warn ? 'amber' : 'red';
  };

  const budgetPct = Math.round((client.resources.budgetUsed / client.resources.budgetTotal) * 100);

  return (
    <motion.div
      key={`report-${client.id}`}
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute right-0 top-0 bottom-0 w-[520px] z-[300] bg-[#0A1628] border-l border-[rgba(46,127,255,0.3)] shadow-2xl flex flex-col"
    >
      <div className={`h-1 w-full ${RISK_STRIP[client.riskLevel]}`} />

      <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(46,127,255,0.15)] flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <FileText size={14} className="text-blue-400" />
          <div>
            <div className="text-[#EEF3FA] font-bold text-sm leading-tight">Client Insight Report</div>
            <div className="text-[10px] text-[#7A94B4]">Snapshot · {client.lastUpdated}</div>
          </div>
        </div>
        <div className="flex items-center gap-1 relative">
          {/* Share button */}
          <button
            onClick={() => { setShareOpen(v => !v); setShareMode('menu'); setEmailResult('idle'); }}
            className="text-[#7A94B4] hover:text-white transition-colors p-1 rounded"
            title="Share report"
          >
            <Share2 size={15} />
          </button>
          <button onClick={onClose} className="text-[#7A94B4] hover:text-white transition-colors p-1">
            <X size={16} />
          </button>

          {/* Share popover */}
          <AnimatePresence>
            {shareOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: -6 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-8 z-[400] w-64 bg-[#0F1E35] border border-[rgba(46,127,255,0.3)] rounded-xl shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                {shareMode === 'menu' && (
                  <div className="p-2">
                    <div className="text-[10px] text-[#4A7FBF] font-semibold uppercase tracking-wider px-3 py-1.5">Share Report</div>
                    <button
                      onClick={handleCopyLink}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-[rgba(46,127,255,0.1)] transition-colors text-left"
                    >
                      {copied ? <Check size={14} className="text-green-400 flex-shrink-0" /> : <Link2 size={14} className={`flex-shrink-0 ${copyFailed ? 'text-red-400' : 'text-[#7A94B4]'}`} />}
                      <span className={`text-sm ${copied ? 'text-green-400' : copyFailed ? 'text-red-400' : 'text-[#EEF3FA]'}`}>{copied ? 'Copied!' : copyFailed ? 'Copy failed' : 'Copy Link'}</span>
                    </button>
                    <button
                      onClick={() => setShareMode('email')}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-[rgba(46,127,255,0.1)] transition-colors text-left"
                    >
                      <Mail size={14} className="text-[#7A94B4] flex-shrink-0" />
                      <span className="text-sm text-[#EEF3FA]">Email Report</span>
                    </button>
                  </div>
                )}

                {shareMode === 'email' && (
                  <div className="p-3">
                    <button
                      onClick={() => setShareMode('menu')}
                      className="text-[10px] text-[#4A7FBF] hover:text-blue-400 font-semibold uppercase tracking-wider flex items-center gap-1 mb-3 transition-colors"
                    >
                      ← Back
                    </button>
                    <form onSubmit={handleSendEmail} className="flex flex-col gap-2">
                      <input
                        type="email"
                        placeholder="recipient@example.com"
                        value={emailTo}
                        onChange={e => setEmailTo(e.target.value)}
                        required
                        disabled={emailSending || emailResult === 'sent'}
                        className="w-full bg-[#0A1628] border border-[rgba(46,127,255,0.3)] rounded-lg px-3 py-2 text-sm text-[#EEF3FA] placeholder-[#4A7FBF] focus:outline-none focus:border-blue-500 disabled:opacity-50"
                      />
                      {emailResult === 'error' && (
                        <p className="text-xs text-red-400">Failed to send. Please try again.</p>
                      )}
                      {emailResult === 'sent' && (
                        <p className="text-xs text-green-400 flex items-center gap-1"><Check size={11} /> Sent successfully!</p>
                      )}
                      <button
                        type="submit"
                        disabled={emailSending || emailResult === 'sent' || !emailTo}
                        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-2 px-3 rounded-lg transition-colors"
                      >
                        {emailSending ? (
                          <span className="animate-pulse">Sending…</span>
                        ) : (
                          <><Send size={13} /> Send</>
                        )}
                      </button>
                    </form>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">

        <ReportSection title="Executive Summary" icon={<Shield size={13} />}>
          <div className="flex items-start gap-3 p-3 bg-[rgba(17,32,64,0.8)] rounded-xl border border-[rgba(46,127,255,0.12)]">
            <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${STATUS_DOT[client.status]}`} />
            <div className="flex-1 min-w-0">
              <div className="text-base font-bold text-[#EEF3FA] leading-tight">{client.name}</div>
              <div className="text-[10px] text-[#7A94B4] mt-0.5">{client.region} · {client.sector}</div>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${STATUS_TEXT[client.status]} bg-transparent border-current/30`}>
                  {client.status}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${RISK_BADGE[client.riskLevel]}`}>
                  {client.riskLevel} risk
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300">
                  {client.contract.tier}
                </span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide">Last Updated</div>
              <div className="text-[11px] text-[#EEF3FA] font-semibold mt-0.5">{client.lastUpdated}</div>
            </div>
          </div>
        </ReportSection>

        <ReportSection title="KPI Scorecard" icon={<BarChart2 size={13} />}>
          <div className="grid grid-cols-3 gap-2">
            <KPITile label="Sites"         value={client.sites}       color="white" />
            <KPITile label="Work Orders"   value={client.workOrders}  color="blue" />
            <KPITile label="Incidents"     value={client.incidents}   color={kpiColor(client.incidents, 0, 3, true)} />
            <KPITile label="Overdue Tasks" value={client.overdueTasks} color={kpiColor(client.overdueTasks, 0, 2, true)} />
            <KPITile label="SLA %"         value={`${client.sla}%`}   color={kpiColor(client.sla, 90, 80)} />
            <KPITile label="Compliance %"  value={`${client.compliance}%`} color={kpiColor(client.compliance, 90, 80)} />
          </div>
        </ReportSection>

        <ReportSection title="Performance Gauges" icon={<Activity size={13} />}>
          <div className="flex justify-around items-end py-2">
            <ArcGauge value={client.sla} label="SLA Performance" color={slaGaugeColor} />
            <div className="flex flex-col items-center gap-2 text-[9px] text-[#7A94B4]">
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400/70 inline-block" />80% threshold</div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400/70 inline-block" />90% threshold</div>
            </div>
            <ArcGauge value={client.compliance} label="Compliance" color={compGaugeColor} />
          </div>
        </ReportSection>

        <ReportSection title="Top Sites Health" icon={<MapPin size={13} />}>
          <div className="space-y-2">
            {client.topSites.map((site, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 bg-[rgba(17,32,64,0.6)] rounded-lg border border-[rgba(46,127,255,0.08)]">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${SITE_STATUS_DOT[site.status]}`} />
                <span className="text-[12px] text-[#EEF3FA] flex-1 truncate">{site.name}</span>
                <span className={`text-[9px] capitalize font-semibold flex-shrink-0 ${site.status === 'ok' ? 'text-emerald-400' : site.status === 'warning' ? 'text-amber-400' : 'text-red-400'}`}>
                  {site.status}
                </span>
                {site.incidents > 0 ? (
                  <span className="text-[9px] text-red-400 font-bold flex-shrink-0 bg-red-500/10 px-1.5 py-0.5 rounded-full border border-red-500/20">
                    {site.incidents} inc.
                  </span>
                ) : (
                  <span className="text-[9px] text-emerald-400 flex-shrink-0">Clear</span>
                )}
              </div>
            ))}
          </div>
        </ReportSection>

        <ReportSection title="Data Source Quality" icon={<Database size={13} />}>
          <div className="space-y-3">
            {client.dataSources.map(ds => {
              const q = dsQuality(ds);
              const qColor = q >= 90 ? '#38D98A' : q >= 70 ? '#FF9B38' : '#FF4B4B';
              const qLabel = q >= 90 ? 'Excellent' : q >= 70 ? 'Good' : 'Poor';
              return (
                <div key={ds.label}>
                  <div className="flex justify-between text-[10px] mb-1.5">
                    <span className="text-[#EEF3FA] font-medium">{ds.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#7A94B4]">{ds.count > 0 ? `${ds.count.toLocaleString()} rec.` : 'Error'}</span>
                      <span className="font-bold" style={{ color: qColor }}>{q}% · {qLabel}</span>
                    </div>
                  </div>
                  <AnimatedBar value={q} color={qColor} height="h-1.5" />
                </div>
              );
            })}
          </div>
        </ReportSection>

        <ReportSection title="Incident Breakdown" icon={<AlertTriangle size={13} />}>
          <div className="p-3 bg-[rgba(17,32,64,0.6)] rounded-xl border border-[rgba(46,127,255,0.1)] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-[#EEF3FA]">{client.incidents}</div>
                <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide">Total Incidents</div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-bold capitalize ${RISK_BADGE[client.riskLevel].split(' ')[0]}`}>{client.riskLevel} Risk</div>
                <div className="text-[9px] text-[#7A94B4]">Current severity</div>
              </div>
            </div>
            {client.overdueTasks > 0 && (
              <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                <Clock size={11} className="text-red-400 flex-shrink-0" />
                <span className="text-[10px] text-red-300">{client.overdueTasks} overdue task{client.overdueTasks !== 1 ? 's' : ''} require immediate attention</span>
              </div>
            )}
            <div className="flex items-start gap-2 p-2 bg-[rgba(6,182,212,0.05)] border border-cyan-500/10 rounded-lg">
              <Zap size={10} className="text-cyan-400 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-[#7A94B4] leading-relaxed">{client.aiInsight}</p>
            </div>
          </div>
        </ReportSection>

        <ReportSection title="Recent Activity Timeline" icon={<Clock size={13} />}>
          <div className="relative pl-4">
            <div className="absolute left-1.5 top-0 bottom-0 w-px bg-[rgba(46,127,255,0.2)]" />
            <div className="space-y-3">
              {client.recentActivity.map((act, i) => {
                const col = ACTIVITY_COLOR[act.type] || 'text-[#7A94B4]';
                const icon = ACTIVITY_ICON[act.type] || <Clock size={10} />;
                return (
                  <div key={i} className="relative flex items-start gap-3">
                    <div className={`absolute -left-[13px] w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${col} bg-[#0A1628] border border-[rgba(46,127,255,0.2)]`}>
                      {icon}
                    </div>
                    <div className="flex-1 pl-1">
                      <div className="text-[11px] text-[#EEF3FA] leading-snug">{act.event}</div>
                      <div className="text-[9px] text-[#7A94B4] mt-0.5">{act.time}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ReportSection>

        <ReportSection title="AI Insight" icon={<Bot size={13} />}>
          <div className="p-4 bg-[rgba(6,182,212,0.07)] border border-cyan-500/25 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center flex-shrink-0">
                <Zap size={14} className="text-cyan-400" />
              </div>
              <div className="flex-1">
                <p className="text-[12px] text-[#EEF3FA] leading-relaxed">{client.aiInsight}</p>
                <div className="flex items-center gap-1 mt-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-[9px] text-cyan-400 font-semibold uppercase tracking-wider">Powered by Imdaad AI</span>
                </div>
              </div>
            </div>
          </div>
        </ReportSection>

        <ReportSection title="Contract Snapshot" icon={<Calendar size={13} />}>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 bg-[rgba(17,32,64,0.6)] rounded-lg border border-[rgba(46,127,255,0.1)]">
                <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1">Contract Tier</div>
                <div className="text-[13px] font-bold text-blue-300">{client.contract.tier}</div>
              </div>
              <div className="p-2.5 bg-[rgba(17,32,64,0.6)] rounded-lg border border-[rgba(46,127,255,0.1)]">
                <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1">Annual Value</div>
                <div className="text-[13px] font-bold text-emerald-400">{client.contract.annualValue}</div>
              </div>
              <div className="p-2.5 bg-[rgba(17,32,64,0.6)] rounded-lg border border-[rgba(46,127,255,0.1)]">
                <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1">Renewal Date</div>
                <div className="text-[12px] font-semibold text-[#EEF3FA]">{client.contract.renewalDate}</div>
              </div>
              <div className="p-2.5 bg-[rgba(17,32,64,0.6)] rounded-lg border border-[rgba(46,127,255,0.1)]">
                <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1">Contract No.</div>
                <div className="text-[10px] font-mono text-[#7A94B4]">{client.contract.number}</div>
              </div>
            </div>
            <div className="p-2.5 bg-[rgba(17,32,64,0.6)] rounded-lg border border-[rgba(46,127,255,0.1)]">
              <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-2">Response SLA Targets</div>
              <div className="space-y-1">
                {client.contract.responseTimes.map(rt => (
                  <div key={rt.severity} className="flex items-center justify-between text-[10px]">
                    <span className="text-[#7A94B4]">{rt.severity}</span>
                    <span className="text-[#EEF3FA] font-semibold">{rt.target}</span>
                  </div>
                ))}
              </div>
            </div>
            {client.contract.penalties && (
              <div className="flex items-start gap-2 p-2.5 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                <AlertTriangle size={11} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-[9px] text-amber-400 font-semibold uppercase tracking-wide mb-0.5">Penalty Clause</div>
                  <div className="text-[10px] text-[#7A94B4] leading-snug">{client.contract.penalties}</div>
                </div>
              </div>
            )}
          </div>
        </ReportSection>

        <ReportSection title="Resource Overview" icon={<Wrench size={13} />}>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-[10px] mb-1.5">
                <span className="text-[#7A94B4]">Budget Utilisation</span>
                <span className={`font-bold ${budgetPct >= 90 ? 'text-red-400' : budgetPct >= 75 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  AED {(client.resources.budgetUsed / 1000).toFixed(0)}K / {(client.resources.budgetTotal / 1000).toFixed(0)}K · {budgetPct}%
                </span>
              </div>
              <AnimatedBar
                value={budgetPct}
                color={budgetPct >= 90 ? '#FF4B4B' : budgetPct >= 75 ? '#FF9B38' : '#38D98A'}
                height="h-2"
              />
            </div>

            {client.resources.fleet.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Truck size={10} className="text-blue-400" />
                  <span className="text-[9px] text-[#7A94B4] uppercase tracking-wide">Fleet Availability</span>
                </div>
                <div className="space-y-1.5">
                  {client.resources.fleet.map(f => (
                    <div key={f.label} className="flex items-center justify-between text-[10px]">
                      <span className="text-[#7A94B4]">{f.label}</span>
                      <span className={`font-semibold ${f.available === f.total ? 'text-emerald-400' : f.available > 0 ? 'text-amber-400' : 'text-red-400'}`}>
                        {f.available}/{f.total} available
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {client.resources.partsStock.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Package size={10} className="text-purple-400" />
                  <span className="text-[9px] text-[#7A94B4] uppercase tracking-wide">Spare Parts Stock</span>
                </div>
                <div className="space-y-1">
                  {client.resources.partsStock.map(p => (
                    <div key={p.name} className="flex items-center justify-between text-[10px]">
                      <span className="text-[#7A94B4] truncate max-w-[60%]">{p.name}</span>
                      <span className={`font-semibold flex-shrink-0 ${p.status === 'ok' ? 'text-emerald-400' : p.status === 'low' ? 'text-amber-400' : 'text-red-400'}`}>
                        {p.qty} units · {p.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {client.resources.equipment.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Wrench size={10} className="text-cyan-400" />
                  <span className="text-[9px] text-[#7A94B4] uppercase tracking-wide">Equipment Condition</span>
                </div>
                <div className="space-y-2">
                  {client.resources.equipment.map(eq => {
                    const eqColor = eq.condition >= 90 ? '#38D98A' : eq.condition >= 70 ? '#FF9B38' : '#FF4B4B';
                    return (
                      <div key={eq.name}>
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-[#7A94B4]">{eq.name}</span>
                          <span className="font-semibold" style={{ color: eqColor }}>{eq.condition}% · Next: {eq.nextService}</span>
                        </div>
                        <AnimatedBar value={eq.condition} color={eqColor} height="h-1" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </ReportSection>

      </div>

      <div className="px-5 py-3 border-t border-[rgba(46,127,255,0.15)] flex-shrink-0 flex items-center gap-2">
        <div className="flex items-center gap-1.5 flex-1">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          <span className="text-[9px] text-[#7A94B4]">Static snapshot · {client.lastUpdated}</span>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 text-[11px] font-semibold text-[#7A94B4] border border-[rgba(46,127,255,0.2)] rounded-lg hover:text-white hover:border-[rgba(46,127,255,0.4)] transition-colors"
        >
          Close Report
        </button>
      </div>
    </motion.div>
  );
}

function ClientDetailDrawer({
  client,
  onClose,
  onToast,
  onNavigateToCommand,
  onReport,
}: {
  client: PortfolioClient;
  onClose: () => void;
  onToast: ToastFn;
  onNavigateToCommand: (clientId: string, clientName?: string) => void;
  onReport: (c: PortfolioClient) => void;
}) {
  const slaColor = client.sla >= 90 ? '#38D98A' : client.sla >= 80 ? '#FF9B38' : '#FF4B4B';
  const compColor = client.compliance >= 90 ? '#38D98A' : client.compliance >= 80 ? '#FF9B38' : '#FF4B4B';
  const dsQuality = (ds: { count: number }) => {
    if (ds.count === 0) return 0;
    if (ds.count >= 500) return 96;
    if (ds.count >= 100) return 88;
    return 74;
  };

  return (
    <AnimatePresence>
      {client && (
        <motion.div
          key={client.id}
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className="absolute right-0 top-0 bottom-0 w-80 z-[200] bg-[#112040] border-l border-[rgba(46,127,255,0.3)] shadow-2xl flex flex-col"
        >
          <div className={`h-1 w-full ${RISK_STRIP[client.riskLevel]}`} />

          <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(46,127,255,0.15)]">
            <div className="flex items-center gap-2.5">
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${STATUS_DOT[client.status]}`} />
              <div>
                <div className="text-[#EEF3FA] font-bold text-sm leading-tight">{client.name}</div>
                <div className="text-[10px] text-[#7A94B4]">{client.region} · {client.sector}</div>
              </div>
            </div>
            <button onClick={onClose} className="text-[#7A94B4] hover:text-white transition-colors">
              <X size={15} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
            <div>
              <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-2">Client Overview</div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Sites',     value: client.sites,         color: 'text-[#EEF3FA]' },
                  { label: 'Work Orders', value: client.workOrders,  color: 'text-blue-400' },
                  { label: 'Incidents', value: client.incidents,     color: client.incidents > 5 ? 'text-red-400' : 'text-amber-400' },
                  { label: 'SLA',       value: `${client.sla}%`,     color: client.sla >= 90 ? 'text-emerald-400' : 'text-amber-400' },
                  { label: 'Compliance', value: `${client.compliance}%`, color: client.compliance >= 90 ? 'text-emerald-400' : 'text-amber-400' },
                  { label: 'Overdue',   value: client.overdueTasks,  color: client.overdueTasks > 0 ? 'text-red-400' : 'text-emerald-400' },
                ].map(r => (
                  <div key={r.label} className="bg-[#0A1628] rounded-lg p-2 text-center">
                    <div className={`text-[14px] font-bold leading-tight ${r.color}`}>{r.value}</div>
                    <div className="text-[8px] text-[#7A94B4] uppercase tracking-wide mt-0.5">{r.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-2">Top Sites</div>
              <div className="space-y-1.5">
                {client.topSites.map((site, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-[#0A1628] rounded-lg">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${SITE_STATUS_DOT[site.status]}`} />
                    <span className="text-[11px] text-[#EEF3FA] flex-1 truncate">{site.name}</span>
                    {site.incidents > 0 && (
                      <span className="text-[9px] text-red-400 font-semibold flex-shrink-0">{site.incidents} inc.</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-2">Risk Summary</div>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-[#7A94B4]">SLA Performance</span>
                    <span style={{ color: slaColor }}>{client.sla}%</span>
                  </div>
                  <AnimatedBar value={client.sla} color={slaColor} height="h-1.5" />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-[#7A94B4]">Compliance</span>
                    <span style={{ color: compColor }}>{client.compliance}%</span>
                  </div>
                  <AnimatedBar value={client.compliance} color={compColor} height="h-1.5" />
                </div>
              </div>
              <div className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold capitalize ${RISK_BADGE[client.riskLevel]}`}>
                <Shield size={10} /> {client.riskLevel} risk
              </div>
            </div>

            <div>
              <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-2">Data Source Quality</div>
              <div className="space-y-2">
                {client.dataSources.map(ds => {
                  const q = dsQuality(ds);
                  const qColor = q >= 90 ? '#38D98A' : q >= 70 ? '#FF9B38' : '#FF4B4B';
                  return (
                    <div key={ds.label}>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-[#7A94B4]">{ds.label}</span>
                        <span className="text-[#7A94B4]">{ds.count > 0 ? `${ds.count.toLocaleString()} rec.` : 'Error'}</span>
                      </div>
                      <AnimatedBar value={q} color={qColor} height="h-1" />
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-2">Recent Activity</div>
              <div className="space-y-1.5">
                {client.recentActivity.map((act, i) => {
                  const col = ACTIVITY_COLOR[act.type] || 'text-[#7A94B4]';
                  const icon = ACTIVITY_ICON[act.type] || <Clock size={10} />;
                  return (
                    <div key={i} className="flex items-start gap-2 py-1.5 border-b border-[rgba(46,127,255,0.08)] last:border-0">
                      <div className={`flex-shrink-0 mt-0.5 ${col}`}>{icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-[#EEF3FA] leading-snug">{act.event}</div>
                      </div>
                      <span className="text-[9px] text-[#7A94B4] flex-shrink-0">{act.time}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-2">AI Insight</div>
              <div className="p-3 bg-[rgba(6,182,212,0.06)] border border-cyan-500/20 rounded-xl flex items-start gap-2">
                <Zap size={12} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-[#EEF3FA] leading-relaxed">{client.aiInsight}</p>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-[rgba(46,127,255,0.15)] space-y-2">
            <button
              onClick={() => { onNavigateToCommand(client.id, client.name); onClose(); }}
              className="w-full py-2.5 bg-[#2E7FFF] text-white text-[12px] font-semibold rounded-lg hover:bg-blue-500 transition-colors flex items-center justify-center gap-1.5"
            >
              Open Command Center <ArrowRight size={13} />
            </button>
            <button
              onClick={() => onReport(client)}
              className="w-full py-2 border border-[rgba(46,127,255,0.3)] text-[#7A94B4] text-[11px] rounded-lg hover:bg-white/5 transition-colors flex items-center justify-center gap-1.5"
            >
              <FileText size={12} /> Generate Report
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface Props {
  onToast: ToastFn;
  onClientSelect: (clientId: string) => void;
  onNavigateToIncidents: (clientId: string) => void;
  onNavigateToCommand: (clientId: string, clientName?: string) => void;
}

export function AllClients({ onToast, onClientSelect, onNavigateToIncidents, onNavigateToCommand }: Props) {
  const memberFilter  = useMemberFilter();
  const { addProfiles } = useMemberProfiles();
  const { clients: allClients, addClient } = useClients();
  const isMemberMode  = isFilterActive(memberFilter);

  const defaultRegion = useMemo(() => {
    if (!isMemberMode || memberFilter.zones.length === 0) return 'All';
    const regionMatch = REGIONS.find(r => r !== 'All' && memberFilter.zones.some(z => z.toLowerCase().includes(r.toLowerCase())));
    return regionMatch ?? 'All';
  }, [isMemberMode, memberFilter.zones]);

  const [search,        setSearch]        = useState('');
  const [region,        setRegion]        = useState(defaultRegion);
  const [sector,        setSector]        = useState('All');
  const [status,        setStatus]        = useState('All');
  const [riskLevel,     setRiskLevel]     = useState('All');
  const [sortKey,       setSortKey]       = useState('risk');
  const [view,          setView]          = useState<'grid' | 'list'>('grid');
  const [selected,      setSelected]      = useState<PortfolioClient | null>(null);
  const [reportClient,  setReportClient]  = useState<PortfolioClient | null>(null);
  const [showAddModal,  setShowAddModal]  = useState(false);

  const handleAddClient = (data: ClientData, teamMembers: TeamMember[], inviteOk: boolean, failedCount: number) => {
    addClient({
      id: `CLT-${Date.now()}`,
      name: data.name,
      status: 'live',
      region: data.siteNames?.[0] ?? '',
      sector: data.sector ?? '',
      sites: Number(data.numSites ?? 0),
      workOrders: 0,
      incidentsCount: 0,
      sla: 100,
      compliance: 100,
      riskLevel: 'low',
      overdueTasks: 0,
      aiInsight: '',
      lastUpdated: 'Just now',
      contract: { number: `IMD-${Date.now()}`, tier: data.slaTier ?? 'Standard', annualValue: data.contractValue ?? '' },
    }).catch(err => console.warn('[AllClients] Failed to persist client:', err));
    addProfiles(teamMembers);
    setShowAddModal(false);
    if (teamMembers.length > 0 && !inviteOk) {
      const msg = failedCount > 0
        ? `${data.name} added — ${failedCount} invite${failedCount > 1 ? 's' : ''} failed to send`
        : `${data.name} added — invites could not be delivered (check SMTP config)`;
      onToast(msg, 'warning');
    } else if (teamMembers.length > 0) {
      onToast(`${data.name} added — invites sent to ${teamMembers.length} team member${teamMembers.length > 1 ? 's' : ''}`, 'success');
    } else {
      onToast(`${data.name} added — ${data.contractType} · ${data.slaTier} SLA`, 'success');
    }
  };

  const filtered = allClients
    .filter(c => {
      if (isMemberMode && memberFilter.assignedClients.length > 0 &&
          !memberFilter.assignedClients.some(ac => c.name.toLowerCase().includes(ac.toLowerCase()) || ac.toLowerCase().includes(c.name.toLowerCase()))) {
        return false;
      }
      if (region    !== 'All' && c.region    !== region)    return false;
      if (sector    !== 'All' && c.sector    !== sector)    return false;
      if (status    !== 'All' && c.status    !== status)    return false;
      if (riskLevel !== 'All' && c.riskLevel !== riskLevel) return false;
      if (search && !c.name.toLowerCase().includes(search.toLowerCase()) &&
                    !c.region.toLowerCase().includes(search.toLowerCase()) &&
                    !c.sector.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortKey === 'risk')      return (RISK_ORDER[a.riskLevel] ?? 9) - (RISK_ORDER[b.riskLevel] ?? 9);
      if (sortKey === 'sites')     return b.sites - a.sites;
      if (sortKey === 'sla')       return a.sla - b.sla;
      if (sortKey === 'incidents') return b.incidents - a.incidents;
      return (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
    });

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(46,127,255,0.15)] flex-shrink-0">
        <div>
          <h2 className="text-[#EEF3FA] font-bold text-base" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {isMemberMode ? 'My Clients' : 'All Clients'}
          </h2>
          <p className="text-[11px] text-[#7A94B4]">
            {isMemberMode
              ? `Personalized scope · ${filtered.length} assigned client${filtered.length !== 1 ? 's' : ''}`
              : `Portfolio command view · ${allClients.length} clients · Master Admin`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {[
            { label: 'Critical', count: allClients.filter(c => c.status === 'critical').length, color: 'text-red-400 bg-red-500/10 border-red-500/30' },
            { label: 'Warning',  count: allClients.filter(c => c.status === 'warning').length,  color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
            { label: 'Live',     count: allClients.filter(c => c.status === 'live').length,     color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
          ].map(k => (
            <div key={k.label} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-semibold ${k.color}`}>
              <span className="text-[13px] font-bold">{k.count}</span>
              <span>{k.label}</span>
            </div>
          ))}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2E7FFF] hover:bg-blue-500 text-white text-[11px] font-semibold rounded-lg transition-colors shadow-[0_0_12px_rgba(46,127,255,0.35)]"
          >
            <Plus size={13} />
            Add New Client
          </button>
        </div>
      </div>

      <PortfolioSummaryStrip clients={allClients} />

      <PortfolioPulseFeed />

      <div className="flex items-center gap-2 px-5 pb-2.5 flex-shrink-0 flex-wrap gap-y-2">
        <div className="flex items-center gap-1.5 bg-[#112040] rounded-lg px-2.5 py-1.5 border border-[rgba(46,127,255,0.2)] flex-shrink-0">
          <Search size={11} className="text-[#7A94B4]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search clients…"
            className="bg-transparent text-[11px] text-[#EEF3FA] placeholder-[#7A94B4] outline-none w-28"
          />
        </div>

        <select
          value={region}
          onChange={e => setRegion(e.target.value)}
          className="text-[10px] px-2 py-1.5 rounded-lg border border-[rgba(46,127,255,0.2)] bg-[#112040] text-[#7A94B4] outline-none cursor-pointer"
        >
          {REGIONS.map(r => <option key={r} value={r}>Region: {r}</option>)}
        </select>

        <select
          value={sector}
          onChange={e => setSector(e.target.value)}
          className="text-[10px] px-2 py-1.5 rounded-lg border border-[rgba(46,127,255,0.2)] bg-[#112040] text-[#7A94B4] outline-none cursor-pointer"
        >
          {SECTORS.map(s => <option key={s} value={s}>Sector: {s.length > 20 ? s.slice(0, 18) + '…' : s}</option>)}
        </select>

        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="text-[10px] px-2 py-1.5 rounded-lg border border-[rgba(46,127,255,0.2)] bg-[#112040] text-[#7A94B4] outline-none cursor-pointer capitalize"
        >
          {STATUSES.map(s => <option key={s} value={s}>Status: {s}</option>)}
        </select>

        <select
          value={riskLevel}
          onChange={e => setRiskLevel(e.target.value)}
          className="text-[10px] px-2 py-1.5 rounded-lg border border-[rgba(46,127,255,0.2)] bg-[#112040] text-[#7A94B4] outline-none cursor-pointer capitalize"
        >
          {RISK_LVLS.map(r => <option key={r} value={r}>Risk: {r}</option>)}
        </select>

        <select
          value={sortKey}
          onChange={e => setSortKey(e.target.value)}
          className="text-[10px] px-2 py-1.5 rounded-lg border border-[rgba(46,127,255,0.2)] bg-[#112040] text-[#7A94B4] outline-none cursor-pointer"
        >
          {SORT_OPTS.map(s => <option key={s.key} value={s.key}>Sort: {s.label}</option>)}
        </select>

        <div className="ml-auto flex items-center gap-1 bg-[#112040] rounded-lg p-0.5 border border-[rgba(46,127,255,0.2)]">
          <button
            onClick={() => setView('grid')}
            className={`p-1.5 rounded-md transition-all ${view === 'grid' ? 'bg-[#2E7FFF] text-white' : 'text-[#7A94B4] hover:text-[#EEF3FA]'}`}
          >
            <Grid size={12} />
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-1.5 rounded-md transition-all ${view === 'list' ? 'bg-[#2E7FFF] text-white' : 'text-[#7A94B4] hover:text-[#EEF3FA]'}`}
          >
            <List size={12} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-5 pb-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Users size={32} className="text-[#7A94B4] opacity-30" />
            <span className="text-[13px] text-[#7A94B4] opacity-60">No clients match filters</span>
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-3 gap-3">
            {filtered.map(c => (
              <ClientPortfolioCard key={c.id} client={c} onSelect={client => onClientSelect(client.id)} onToast={onToast} onReport={setReportClient} view="grid" onNavigateToIncidents={onNavigateToIncidents} onNavigateToCommand={onNavigateToCommand} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map(c => (
              <ClientPortfolioCard key={c.id} client={c} onSelect={client => onClientSelect(client.id)} onToast={onToast} onReport={setReportClient} view="list" onNavigateToIncidents={onNavigateToIncidents} onNavigateToCommand={onNavigateToCommand} />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <>
            <div className="absolute inset-0 z-[100]" onClick={() => setSelected(null)} />
            <ClientDetailDrawer
              client={selected}
              onClose={() => setSelected(null)}
              onToast={onToast}
              onNavigateToCommand={onNavigateToCommand}
              onReport={setReportClient}
            />
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {reportClient && (
          <>
            <div className="absolute inset-0 z-[250]" onClick={() => setReportClient(null)} />
            <ClientReportPanel
              client={reportClient}
              onClose={() => setReportClient(null)}
            />
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddModal && (
          <AddClientModal
            onClose={() => setShowAddModal(false)}
            onSave={handleAddClient}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
