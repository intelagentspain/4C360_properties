import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertTriangle, Loader2, ArrowLeft, RefreshCw } from 'lucide-react';

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';

interface IncidentRow {
  id: string;
  title?: string;
  status?: string;
  severity?: string;
  slaMinutes?: number;
  elapsed?: number;
  description?: string;
  location?: string;
  source?: string;
  createdAt?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle }> = {
  open:          { label: 'Open',        color: '#B45309', bg: '#FEF3C7', icon: Clock       },
  dispatched:    { label: 'Dispatched',  color: '#2563EB', bg: '#EFF6FF', icon: RefreshCw   },
  'in-progress': { label: 'In Progress', color: '#7C3AED', bg: '#F5F3FF', icon: RefreshCw   },
  resolved:      { label: 'Resolved',    color: '#059669', bg: '#ECFDF5', icon: CheckCircle  },
  closed:        { label: 'Resolved',    color: '#059669', bg: '#ECFDF5', icon: CheckCircle  },
};

function getStatusConfig(status = 'open') {
  return STATUS_CONFIG[status.toLowerCase()] ?? STATUS_CONFIG['open'];
}

function getProgressPct(status = 'open', elapsed = 0, slaMinutes = 60): number {
  const s = status.toLowerCase();
  if (s === 'closed' || s === 'resolved') return 100;
  if (s === 'in-progress') return 70;
  if (s === 'dispatched') return 40;
  const pct = slaMinutes > 0 ? Math.min(((elapsed ?? 0) / (slaMinutes * 60)) * 100, 90) : 10;
  return Math.max(pct, 8);
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface Props {
  incidentId: string;
}

export function IncidentTrackingView({ incidentId }: Props) {
  const [incident, setIncident] = useState<IncidentRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  async function fetchIncident() {
    try {
      const res = await fetch(`${BASE_URL}/api/incidents/${encodeURIComponent(incidentId)}`);
      if (res.status === 404) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      if (!res.ok) {
        // Server/network error — show generic error but don't mark as not-found
        setLoading(false);
        return;
      }
      const data: IncidentRow = await res.json();
      setIncident(data);
      setLastUpdated(new Date());
    } catch {
      // Network error — don't mark as not-found on transient failures
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchIncident();
    const interval = setInterval(fetchIncident, 15000);
    return () => clearInterval(interval);
  }, [incidentId]);

  function handleReportAnother() {
    const isResident = window.location.hostname.includes('resident');
    if (isResident) {
      window.location.href = window.location.origin;
    } else {
      const url = new URL(window.location.href);
      url.searchParams.delete('track');
      if (!url.searchParams.has('member')) url.searchParams.set('member', 'resident-portal');
      window.location.href = url.toString();
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col bg-[#FDFAF5]" style={{ minHeight: '100dvh' }}>
        <div
          className="flex-shrink-0 px-5 pt-10 pb-7"
          style={{ background: 'linear-gradient(135deg, #1C3A35 0%, #2D5A50 100%)' }}
        >
          <div className="h-3 w-28 rounded bg-white/20 mb-4 animate-pulse" />
          <div className="h-7 w-40 rounded bg-white/30 mb-2 animate-pulse" />
          <div className="h-3 w-48 rounded bg-white/15 animate-pulse" />
        </div>
        <div className="flex-1 px-4 py-5 space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-[#E8DEC8] space-y-3">
            <div className="h-3 w-24 rounded bg-[#EDE5D4] animate-pulse" />
            <div className="h-6 w-44 rounded bg-[#EDE5D4] animate-pulse" />
            <div className="h-4 w-36 rounded bg-[#EDE5D4] animate-pulse" />
          </div>
          <div className="p-4 rounded-2xl bg-white border border-[#E8DEC8] space-y-3">
            <div className="h-3 w-32 rounded bg-[#EDE5D4] animate-pulse" />
            <div className="h-2 w-full rounded-full bg-[#EDE5D4] animate-pulse" />
            <div className="h-3 w-48 rounded bg-[#EDE5D4] animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !incident) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#FDFAF5] px-8" style={{ minHeight: '100dvh' }}>
        <div className="w-16 h-16 rounded-full bg-[#F5EFE0] border border-[#E8DEC8] flex items-center justify-center mb-4">
          <AlertTriangle size={28} className="text-[#B45309]" />
        </div>
        <h2 className="text-[#2C1810] font-bold text-lg mb-2 text-center">Reference not found</h2>
        <p className="text-[#8B7355] text-[13px] text-center mb-6 leading-relaxed">
          We couldn't find a request with this reference. Please check the link in your email or submit a new request.
        </p>
        <button
          onClick={handleReportAnother}
          className="py-3 px-6 rounded-2xl font-semibold text-white text-sm"
          style={{ background: 'linear-gradient(135deg, #1C3A35 0%, #2D5A50 100%)' }}
        >
          Report an Issue
        </button>
      </div>
    );
  }

  const cfg = getStatusConfig(incident.status);
  const StatusIcon = cfg.icon;
  const progressPct = getProgressPct(incident.status, incident.elapsed, incident.slaMinutes);
  const slaMinutes = incident.slaMinutes ?? 60;
  const slaText = slaMinutes <= 30 ? '30 min' : slaMinutes <= 60 ? '1 hour' : `${slaMinutes} min`;
  const isClosed = ['closed', 'resolved'].includes((incident.status ?? '').toLowerCase());

  return (
    <div className="flex flex-col bg-[#FDFAF5]" style={{ minHeight: '100dvh' }}>
      <div
        className="flex-shrink-0 px-5 pt-10 pb-7"
        style={{ background: 'linear-gradient(135deg, #1C3A35 0%, #2D5A50 100%)' }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#A8C4B8] mb-4">
          4C360 · Track My Request
        </p>
        <h1
          className="text-white text-2xl font-bold mb-1.5 leading-tight"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          Request Status
        </h1>
        <p className="text-[#A8C4B8] text-[13px]">Auto-updates every 15 seconds</p>
      </div>

      <div className="flex-1 px-4 py-5 space-y-4">
        {/* Reference + status */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-2xl bg-white border border-[#E8DEC8] shadow-sm"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-[10px] text-[#A0957A] uppercase tracking-widest font-medium mb-1">Reference</div>
              <div className="text-[#C9A96E] font-bold text-lg" style={{ fontFamily: 'monospace', letterSpacing: '0.5px' }}>{incident.id}</div>
            </div>
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold"
              style={{ background: cfg.bg, color: cfg.color }}
            >
              <StatusIcon size={12} />
              {cfg.label}
            </div>
          </div>
          {incident.title && (
            <div className="text-[#2C1810] font-semibold text-[13px]">{incident.title}</div>
          )}
          {incident.createdAt && (
            <div className="text-[#A0957A] text-[11px] mt-1">Submitted {timeAgo(incident.createdAt)}</div>
          )}
        </motion.div>

        {/* SLA progress */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-2xl bg-white border border-[#E8DEC8] shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] font-semibold text-[#2C1810]">
              {isClosed ? 'Request completed' : 'Response progress'}
            </span>
            <span className="text-[11px] text-[#A0957A]">
              {isClosed ? '100%' : `SLA: ${slaText}`}
            </span>
          </div>
          <div className="h-2 rounded-full bg-[#F5EFE0] overflow-hidden mb-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: isClosed ? '#059669' : 'linear-gradient(90deg, #1C3A35, #2D5A50)' }}
            />
          </div>
          <div className="flex justify-between">
            {['Received', 'Dispatched', 'In Progress', 'Resolved'].map(step => {
              const stepIdx = ['Received', 'Dispatched', 'In Progress', 'Resolved'].indexOf(step);
              const currentIdx = isClosed ? 3 : (incident.status ?? '').toLowerCase() === 'in-progress' ? 2 : (incident.status ?? '').toLowerCase() === 'dispatched' ? 1 : 0;
              const done = stepIdx <= currentIdx;
              return (
                <span key={step} className={`text-[10px] font-medium ${done ? 'text-[#1C3A35]' : 'text-[#BDB09A]'}`}>
                  {step}
                </span>
              );
            })}
          </div>
        </motion.div>

        {/* Description */}
        {incident.description && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-4 rounded-2xl bg-[#F5EFE0] border border-[#E8DEC8]"
          >
            <div className="text-[10px] text-[#A0957A] uppercase tracking-widest font-medium mb-2">Issue Description</div>
            <p className="text-[12px] text-[#5C4A2A] leading-relaxed">{incident.description}</p>
          </motion.div>
        )}

        {/* Last updated + report another */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col gap-2.5"
        >
          <div className="text-center text-[10px] text-[#BDB09A]">
            Last updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <button
            onClick={handleReportAnother}
            className="w-full py-3.5 rounded-2xl font-semibold text-[#5C4A2A] text-sm border border-[#E8DEC8] bg-white flex items-center justify-center gap-2 active:bg-[#F5EFE0] transition-colors"
          >
            <ArrowLeft size={15} />
            Report Another Issue
          </button>
        </motion.div>
      </div>
    </div>
  );
}
