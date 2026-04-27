import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, X, Search, User, Clock, CheckCircle,
  Zap, ChevronRight, Send, TrendingUp, AlertCircle,
  ChevronUp, ChevronDown as ChevronDownIcon, QrCode, Plus,
  MessageSquare, Smartphone, Bot, Briefcase,
  Camera, Upload, Loader2, Sparkles, Bell,
  ThumbsUp, ThumbsDown, Hourglass, FileCheck, ShieldCheck,
} from 'lucide-react';
import { SEVERITY_BADGE, slaStatus, type ToastFn } from '@/lib/ui';
import { AnimatedBar } from '@/components/shared/AnimatedBar';
import { TechAvatar } from '@/components/shared/TechAvatar';
import { useIncidents, type Incident, type CreateWorkOrderInput, type TicketState, type ResolveIncidentInput } from '@/context/IncidentContext';
import { WhatsAppModal } from '@/components/shared/WhatsAppModal';
import { CURRENT_USER } from '@/lib/currentUser';
import { useClients } from '@/context/ClientsContext';

const WO_ALLOWED_ROLES = new Set(['FM Engineer', 'Site Supervisor', 'FM Manager', 'Safety Officer', 'Project Manager', 'Account Manager', 'Executive']);
const canCreateWorkOrder = WO_ALLOWED_ROLES.has(CURRENT_USER.role);
const APPROVER_ROLES = new Set(['Site Supervisor', 'Account Manager', 'FM Manager', 'Operations Supervisor']);
const canApprove = APPROVER_ROLES.has(CURRENT_USER.role);
const RESOLVER_ROLES = new Set(['FM Engineer', 'Site Supervisor', 'FM Manager', 'Safety Officer']);
const canResolve = RESOLVER_ROLES.has(CURRENT_USER.role);

const TICKET_STATE_CONFIG: Record<TicketState, { label: string; dot: string; text: string; bg: string }> = {
  pending_approval:  { label: 'Pending Approval', dot: 'bg-amber-400 animate-pulse', text: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
  approved:          { label: 'Approved',          dot: 'bg-emerald-400',            text: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  rejected:          { label: 'Rejected',          dot: 'bg-red-400',                text: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/30' },
  work_order_created:{ label: 'Work Order Created',dot: 'bg-blue-400',               text: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/30' },
};

const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  open:        { label: 'Open',        dot: 'bg-[#7A94B4]',       text: 'text-[#7A94B4]',    bg: 'bg-white/5 border-white/10' },
  dispatched:  { label: 'Assigned',    dot: 'bg-blue-400',        text: 'text-blue-400',     bg: 'bg-blue-500/10 border-blue-500/30' },
  'in-progress':{ label: 'In Progress', dot: 'bg-cyan-400 animate-pulse', text: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30' },
  assigned:    { label: 'Assigned',    dot: 'bg-blue-400',        text: 'text-blue-400',     bg: 'bg-blue-500/10 border-blue-500/30' },
  overdue:     { label: 'Overdue',     dot: 'bg-red-400',         text: 'text-red-400',      bg: 'bg-red-500/10 border-red-500/30' },
  resolved:    { label: 'Resolved',    dot: 'bg-amber-400 animate-pulse', text: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
  closed:      { label: 'Closed',      dot: 'bg-emerald-400',     text: 'text-emerald-400',  bg: 'bg-emerald-500/10 border-emerald-500/30' },
};

const SOURCE_CONFIG: Record<string, { text: string; bg: string; border: string; icon: React.ReactNode }> = {
  'AI Capture':        { text: 'text-cyan-400',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/30',    icon: <Bot size={8} /> },
  'QR Scan':           { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: <QrCode size={8} /> },
  'WhatsApp → Manual': { text: 'text-green-400',   bg: 'bg-green-500/10',   border: 'border-green-500/30',   icon: <MessageSquare size={8} /> },
  'Resident App':      { text: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/30',    icon: <Smartphone size={8} /> },
  'Manual':            { text: 'text-[#7A94B4]',   bg: 'bg-white/5',        border: 'border-white/10',       icon: <User size={8} /> },
};

function SourceBadge({ source }: { source: string }) {
  const cfg = SOURCE_CONFIG[source] || SOURCE_CONFIG['Manual'];
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-semibold w-fit ${cfg.text} ${cfg.bg} ${cfg.border}`}>
      {cfg.icon}
      {source}
    </span>
  );
}

const LOG_ICON: Record<string, React.ReactNode> = {
  incident:    <AlertTriangle size={11} />,
  ai:          <Zap size={11} />,
  dispatch:    <Send size={11} />,
  update:      <Clock size={11} />,
  escalation:  <TrendingUp size={11} />,
};

const LOG_COLOR: Record<string, string> = {
  incident:    'text-red-400 border-red-500/40 bg-red-500/10',
  ai:          'text-cyan-400 border-cyan-500/40 bg-cyan-500/10',
  dispatch:    'text-blue-400 border-blue-500/40 bg-blue-500/10',
  update:      'text-[#7A94B4] border-white/10 bg-white/5',
  escalation:  'text-amber-400 border-amber-500/40 bg-amber-500/10',
};

const ALL_SEVERITIES = ['All', 'critical', 'high', 'medium', 'low'];
const ALL_STATUSES   = ['All', 'open', 'dispatched', 'in-progress', 'overdue', 'resolved', 'closed'];
const ALL_SOURCES    = ['All', 'AI Capture', 'QR Scan', 'WhatsApp → Manual', 'Resident App', 'Manual'];
const NEW_INC_SOURCES = ['AI Capture', 'QR Scan', 'WhatsApp → Manual', 'Resident App', 'Manual'];

const DETAIL_TABS = ['Overview', 'Photos', 'Timeline', 'AI Analysis', 'Actions'];

const AI_SIGNALS: Record<string, { label: string; value: string; match: number }[]> = {
  'INC-SI-001': [
    { label: 'Visual signal',  value: 'Frost on evaporator coil',  match: 97 },
    { label: 'Pattern match',  value: 'R-410A shortage profile',   match: 91 },
    { label: 'Asset history',  value: 'Last serviced 83 days ago', match: 88 },
  ],
  'INC-SI-002': [
    { label: 'Visual signal',  value: 'Water accumulation pattern', match: 89 },
    { label: 'Pattern match',  value: 'Pipe joint failure profile', match: 76 },
    { label: 'Material flag',  value: 'Corrosion markers present',  match: 64 },
  ],
  'INC-SI-006': [
    { label: 'Acoustic sensor', value: 'Grinding at 1.2 kHz',       match: 71 },
    { label: 'IoT vibration',   value: 'Baseline exceeded 3.4×',    match: 64 },
    { label: 'Pattern match',   value: 'Bearing wear signature',     match: 58 },
  ],
};

function SLABar({ incident }: { incident: Incident }) {
  const sla = slaStatus(incident.elapsed, incident.slaMinutes);
  return (
    <div className="w-full">
      <AnimatedBar value={sla.percent} color={sla.barColor} height="h-1" />
      <div className="flex items-center justify-between mt-0.5">
        <span className="text-[9px]" style={{ color: sla.chipColor }}>{sla.label}</span>
        <span className="text-[9px] text-[#7A94B4]">{incident.elapsed}m elapsed</span>
      </div>
    </div>
  );
}

function OverviewTab({ incident }: { incident: Incident }) {
  const st = STATUS_CONFIG[incident.status] || STATUS_CONFIG['open'];
  const sla = slaStatus(incident.elapsed, incident.slaMinutes);
  return (
    <div className="space-y-4">
      <p className="text-[12px] text-[#7A94B4] leading-relaxed">{incident.description}</p>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Incident ID',   value: incident.id },
          { label: 'Source',        value: incident.source },
          { label: 'Severity',      value: incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1) },
          { label: 'SLA Window',    value: `${incident.slaMinutes} min` },
          { label: 'Elapsed',       value: `${incident.elapsed} min` },
          { label: 'Time Remaining', value: sla.overdue ? 'OVERDUE' : `${sla.left} min` },
        ].map(r => (
          <div key={r.label} className="bg-[#0A1628] rounded-lg p-2.5">
            <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-0.5">{r.label}</div>
            <div className="text-[11px] text-[#EEF3FA] font-semibold">{r.value}</div>
          </div>
        ))}
      </div>
      <div>
        <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-1.5">SLA Progress</div>
        <AnimatedBar value={sla.percent} color={sla.barColor} height="h-2" />
        <div className="flex justify-between mt-1 text-[9px] text-[#7A94B4]">
          <span>0 min</span>
          <span>{incident.slaMinutes} min limit</span>
        </div>
      </div>
      <div>
        <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-1.5">Status</div>
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold ${st.bg} ${st.text}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
          {st.label}
        </div>
      </div>
      {incident.assignedTech && (
        <div>
          <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-1.5">Assigned Technician</div>
          <div className="flex items-center gap-2.5 p-2.5 bg-[#112040] rounded-xl border border-[rgba(46,127,255,0.2)]">
            <TechAvatar initials={incident.techId || '?'} size={8} />
            <div>
              <div className="text-[12px] text-[#EEF3FA] font-semibold">{incident.assignedTech}</div>
              <div className="text-[10px] text-blue-400">{incident.status === 'closed' ? 'Closed by technician' : 'En route · GPS tracking active'}</div>
            </div>
          </div>
        </div>
      )}
      {incident.notifiedRoles && incident.notifiedRoles.length > 0 && (
        <div>
          <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-1.5">Notification Sent</div>
          <div className="p-2.5 bg-blue-500/5 border border-blue-500/20 rounded-xl">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Bell size={11} className="text-blue-400" />
              <span className="text-[10px] text-blue-400 font-semibold">Notified {incident.notifiedRoles.length} stakeholder{incident.notifiedRoles.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {incident.notifiedRoles.map(role => (
                <span key={role} className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-500/10 border border-blue-500/25 text-blue-300">
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
      {incident.ticketState && (
        <div>
          <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-1.5">Ticket Status</div>
          {(() => {
            const cfg = TICKET_STATE_CONFIG[incident.ticketState!];
            return (
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </div>
            );
          })()}
          {incident.ticketState === 'rejected' && incident.rejectionReason && (
            <p className="text-[10px] text-[#7A94B4] mt-1.5 leading-relaxed">Reason: {incident.rejectionReason}</p>
          )}
        </div>
      )}
      {incident.status === 'resolved' && (
        <div>
          <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-1.5">Resolution (Pending Confirmation)</div>
          <div className="p-2.5 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5">
              <Hourglass size={11} className="text-amber-400" />
              <span className="text-[10px] text-amber-400 font-semibold">Awaiting Supervisor/AM Confirmation</span>
            </div>
            {incident.resolvedBy && (
              <p className="text-[11px] text-[#EEF3FA]">Resolved by: <span className="font-semibold">{incident.resolvedBy}</span></p>
            )}
            {incident.resolutionNotes && (
              <p className="text-[11px] text-[#7A94B4] leading-relaxed">{incident.resolutionNotes}</p>
            )}
          </div>
        </div>
      )}
      {incident.status === 'closed' && (
        <div className="space-y-3">
          <div>
            <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-1.5">Resolution Audit Trail</div>
            <div className="p-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle size={11} className="text-emerald-400" />
                <span className="text-[10px] text-emerald-400 font-semibold">Incident Closed · Client Notified</span>
              </div>
              {[
                { label: 'Resolved By', value: incident.resolvedBy ?? incident.assignedTech },
                { label: 'Resolved At', value: incident.resolvedAt ? new Date(incident.resolvedAt).toLocaleString('en-GB', { hour12: false }) : undefined },
                { label: 'Confirmed By', value: incident.confirmedBy },
                { label: 'Confirmed At', value: incident.confirmedAt ? new Date(incident.confirmedAt).toLocaleString('en-GB', { hour12: false }) : undefined },
              ].filter(r => r.value).map(r => (
                <div key={r.label} className="flex items-center justify-between">
                  <span className="text-[10px] text-[#7A94B4]">{r.label}</span>
                  <span className="text-[10px] text-[#EEF3FA] font-medium">{r.value}</span>
                </div>
              ))}
              {incident.resolutionNotes && (
                <div className="pt-1.5 border-t border-emerald-500/15">
                  <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1">Resolution Notes</div>
                  <p className="text-[11px] text-[#EEF3FA] leading-relaxed">{incident.resolutionNotes}</p>
                </div>
              )}
            </div>
          </div>
          {(incident.beforePhotoUrl || incident.afterPhotoUrl) && (
            <div>
              <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-1.5">Photo Evidence</div>
              <div className="grid grid-cols-2 gap-2">
                {incident.beforePhotoUrl && (
                  <div>
                    <div className="text-[9px] text-[#7A94B4] mb-1">Before</div>
                    <img src={incident.beforePhotoUrl} alt="Before" className="w-full rounded-lg object-cover max-h-28 border border-red-500/30" />
                  </div>
                )}
                {incident.afterPhotoUrl && (
                  <div>
                    <div className="text-[9px] text-[#7A94B4] mb-1">After</div>
                    <img src={incident.afterPhotoUrl} alt="After" className="w-full rounded-lg object-cover max-h-28 border border-emerald-500/30" />
                  </div>
                )}
              </div>
            </div>
          )}
          {incident.closureNotes && !incident.resolutionNotes && (
            <div className="p-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
              <p className="text-[11px] text-[#EEF3FA] leading-relaxed">{incident.closureNotes}</p>
            </div>
          )}
        </div>
      )}
      {!incident.closureNotes && incident.status !== 'closed' && incident.status !== 'resolved' && incident.closureNotes && (
        <div>
          <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-1.5">Closure Notes</div>
          <div className="p-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
            <div className="flex items-center gap-1.5 mb-1.5">
              <CheckCircle size={11} className="text-emerald-400" />
              <span className="text-[10px] text-emerald-400 font-semibold">Incident Closed · SLA Met</span>
            </div>
            <p className="text-[11px] text-[#EEF3FA] leading-relaxed">{incident.closureNotes}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function PhotosTab({ incident }: { incident: Incident }) {
  const capturedAt = (incident as any).capturedAt as string | undefined;
  const hasCapture   = !!incident.imageUrl;
  const hasBefore    = !!incident.beforePhotoUrl;
  const hasAfter     = !!incident.afterPhotoUrl;
  const isClosed     = incident.status === 'closed' || incident.status === 'resolved';
  const isAI         = incident.source.includes('AI Capture') || incident.source.includes('IoT') || incident.source === 'QR Scan';

  const effectiveBeforeUrl = incident.beforePhotoUrl || incident.imageUrl || null;
  const beforeIsCaptureFallback = !hasBefore && !!incident.imageUrl;

  const SEVERITY_PHOTO_RING: Record<string, string> = {
    critical: 'ring-red-500/60',
    high: 'ring-orange-400/60',
    medium: 'ring-amber-400/60',
    low: 'ring-emerald-500/60',
  };

  return (
    <div className="space-y-5">
      {hasCapture ? (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide font-semibold">Incident Capture</div>
            {isAI && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <span className="w-1 h-1 rounded-full bg-cyan-400 inline-block" />
                AI Captured
              </span>
            )}
          </div>
          <div className={`relative rounded-xl overflow-hidden ring-1 ${SEVERITY_PHOTO_RING[incident.severity] || 'ring-white/10'}`}>
            <img
              src={incident.imageUrl}
              alt="Incident capture"
              className="w-full object-cover"
              style={{ maxHeight: 220 }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A1628]/90 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-[11px] text-white font-semibold">{incident.location}</div>
                  {capturedAt && <div className="text-[9px] text-[#7A94B4] mt-0.5">{capturedAt}</div>}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-black/50 text-[#EEF3FA] border border-white/10 font-mono">{incident.id}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#2E7FFF]/20 border border-[#2E7FFF]/40 text-[#2E7FFF] font-semibold">{incident.source}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 gap-2 rounded-xl border border-[rgba(46,127,255,0.12)] bg-[#112040]/30">
          <Camera size={28} className="text-[#7A94B4] opacity-30" />
          <div className="text-[11px] text-[#7A94B4] opacity-60">No incident photo captured yet</div>
          <div className="text-[10px] text-[#7A94B4] opacity-40">AI Capture or resident upload will appear here</div>
        </div>
      )}

      <div>
        <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide font-semibold mb-2">Resolution Evidence</div>
        {effectiveBeforeUrl || hasAfter ? (
          <div className="grid grid-cols-2 gap-3">
            {effectiveBeforeUrl ? (
              <div>
                <div className="flex items-center gap-1 mb-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500/100" />
                  <span className="text-[9px] text-[#7A94B4] font-semibold uppercase tracking-wide">Before</span>
                </div>
                <div className="relative rounded-xl overflow-hidden ring-1 ring-red-500/30">
                  <img
                    src={effectiveBeforeUrl}
                    alt="Before"
                    className="w-full object-cover"
                    style={{ maxHeight: 160 }}
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                  {beforeIsCaptureFallback && (
                    <div className="absolute top-1.5 left-1.5">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-black/60 border border-white/15 text-[#7A94B4]">
                        <Camera size={8} />
                        Incident Capture
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 rounded-xl border border-red-500/15 bg-red-500/5 gap-1.5">
                <Camera size={18} className="text-red-400 opacity-30" />
                <span className="text-[9px] text-red-400 opacity-50">Before photo pending</span>
              </div>
            )}
            {hasAfter ? (
              <div>
                <div className="flex items-center gap-1 mb-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400/80" />
                  <span className="text-[9px] text-[#7A94B4] font-semibold uppercase tracking-wide">After</span>
                </div>
                <div className="rounded-xl overflow-hidden ring-1 ring-emerald-500/30">
                  <img
                    src={incident.afterPhotoUrl}
                    alt="After"
                    className="w-full object-cover"
                    style={{ maxHeight: 160 }}
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              </div>
            ) : isClosed ? (
              <div className="flex flex-col items-center justify-center py-6 rounded-xl border-2 border-red-500/50 bg-red-500/10 gap-1.5">
                <AlertTriangle size={18} className="text-red-400" />
                <span className="text-[9px] text-red-400 font-semibold">After photo required</span>
                <span className="text-[8px] text-red-400/70">Evidence incomplete</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 rounded-xl border border-emerald-500/15 bg-emerald-500/5 gap-1.5">
                <Camera size={18} className="text-emerald-400 opacity-30" />
                <span className="text-[9px] text-emerald-400 opacity-50">Awaiting resolution</span>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col items-center justify-center py-6 rounded-xl border border-red-500/15 bg-red-500/5 gap-1.5">
              <Camera size={18} className="text-red-400 opacity-30" />
              <span className="text-[9px] text-red-400 opacity-50">Before photo pending</span>
            </div>
            {isClosed ? (
              <div className="flex flex-col items-center justify-center py-6 rounded-xl border-2 border-red-500/50 bg-red-500/10 gap-1.5">
                <AlertTriangle size={18} className="text-red-400" />
                <span className="text-[9px] text-red-400 font-semibold">After photo required</span>
                <span className="text-[8px] text-red-400/70">Evidence incomplete</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 rounded-xl border border-emerald-500/15 bg-emerald-500/5 gap-1.5">
                <Camera size={18} className="text-emerald-400 opacity-30" />
                <span className="text-[9px] text-emerald-400 opacity-50">Awaiting resolution</span>
              </div>
            )}
          </div>
        )}
      </div>

      {hasCapture && (
        <div className="p-3 rounded-xl bg-[#112040]/60 border border-[rgba(46,127,255,0.12)] space-y-2">
          <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide font-semibold">Photo Metadata</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Source', value: incident.source },
              { label: 'Incident ID', value: incident.id },
              { label: 'Location', value: incident.location },
              { label: 'Captured', value: capturedAt || 'Unknown' },
            ].map(r => (
              <div key={r.label}>
                <div className="text-[9px] text-[#7A94B4] mb-0.5">{r.label}</div>
                <div className="text-[10px] text-[#EEF3FA] font-medium">{r.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TimelineTab({ incident }: { incident: Incident }) {
  return (
    <div className="space-y-2">
      <div className="text-[11px] text-[#7A94B4]">Activity log for {incident.id}</div>
      <div className="relative pl-4">
        <div className="absolute left-1.5 top-0 bottom-0 w-px bg-[rgba(46,127,255,0.2)]" />
        {incident.activityLog.map((entry, i) => {
          const color = LOG_COLOR[entry.type] || LOG_COLOR['update'];
          const icon  = LOG_ICON[entry.type]  || <Clock size={11} />;
          return (
            <div key={i} className="relative mb-4 last:mb-0">
              <div className={`absolute -left-4 top-1 w-5 h-5 rounded-full flex items-center justify-center border ${color}`}>
                {icon}
              </div>
              <div className="ml-3">
                <div className="text-[9px] text-[#7A94B4] font-mono mb-0.5">{entry.time}</div>
                <div className="text-[11px] text-[#EEF3FA] leading-snug">{entry.event}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AIAnalysisTab({ incident }: { incident: Incident }) {
  const signals = AI_SIGNALS[incident.id];
  const hasAI = incident.source.includes('AI Capture') || incident.source.includes('IoT') || incident.source === 'QR Scan';
  const aiMeta = (incident as any).aiMetadata;

  if (!hasAI && !signals && !aiMeta) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
        <AlertCircle size={28} className="text-[#7A94B4] opacity-40" />
        <div className="text-[12px] text-[#7A94B4] opacity-60">No AI analysis — manually reported incident</div>
        <div className="text-[11px] text-[#7A94B4] opacity-40">AI analysis is available for incidents captured via AI Capture or IoT sensors</div>
      </div>
    );
  }

  const confidence = aiMeta?.confidence ?? (incident.severity === 'critical' ? 94 : incident.severity === 'high' ? 88 : incident.severity === 'medium' ? 81 : 67);
  const category   = aiMeta?.category ?? (
    incident.title.toLowerCase().includes('ac') || incident.title.toLowerCase().includes('hvac') ? 'HVAC / Cooling' :
    incident.title.toLowerCase().includes('lift') ? 'Mechanical / Lift' :
    incident.title.toLowerCase().includes('water') || incident.title.toLowerCase().includes('pool') ? 'Plumbing' :
    incident.title.toLowerCase().includes('power') ? 'Electrical' : 'General Facility'
  );

  return (
    <div className="space-y-4">
      {(incident as any).imageUrl && (
        <div>
          <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-1.5">Captured Photo</div>
          <div className="rounded-xl overflow-hidden border border-[rgba(46,127,255,0.2)]">
            <img src={(incident as any).imageUrl} alt="Issue photo" className="w-full object-cover max-h-48" />
          </div>
        </div>
      )}

      <div className="p-3 bg-[rgba(46,127,255,0.08)] border border-[rgba(46,127,255,0.2)] rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Zap size={13} className="text-cyan-400" />
            <span className="text-[11px] text-cyan-400 font-bold">4C360 AI Classification</span>
          </div>
          <span className="text-[11px] font-bold text-emerald-400">{confidence}% conf.</span>
        </div>
        <div className="text-[13px] text-[#EEF3FA] font-semibold">{category}</div>
        {aiMeta?.issueType && <div className="text-[10px] text-[#7A94B4] mt-0.5">{aiMeta.issueType}</div>}
        <div className="text-[10px] text-[#7A94B4] mt-0.5">Classified via {incident.source}</div>
      </div>

      {aiMeta?.identifiedAsset && (
        <div className="grid grid-cols-1 gap-2">
          <div className="bg-[#0A1628] rounded-lg p-2.5">
            <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-0.5">Identified Asset</div>
            <div className="text-[11px] text-[#EEF3FA] font-semibold">{aiMeta.identifiedAsset}</div>
          </div>
          {aiMeta.recommendedAction && (
            <div className="bg-[#0A1628] rounded-lg p-2.5">
              <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-0.5">Recommended Action</div>
              <div className="text-[11px] text-[#EEF3FA]">{aiMeta.recommendedAction}</div>
            </div>
          )}
        </div>
      )}

      <div>
        <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-2">Confidence Score</div>
        <AnimatedBar value={confidence} color={confidence >= 85 ? '#38D98A' : confidence >= 70 ? '#FF9B38' : '#FF4B4B'} height="h-2.5" />
        <div className="text-[9px] text-[#7A94B4] mt-1">{confidence}% — {confidence >= 85 ? 'High confidence' : 'Medium confidence'}</div>
      </div>

      {aiMeta?.observations && aiMeta.observations.length > 0 && (
        <div>
          <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-2">Observations</div>
          <div className="space-y-1.5">
            {aiMeta.observations.map((obs: string, i: number) => (
              <div key={i} className="flex items-start gap-2 text-[11px] text-[#7A94B4]">
                <span className="text-cyan-400 flex-shrink-0 mt-0.5">·</span>
                {obs}
              </div>
            ))}
          </div>
        </div>
      )}

      {aiMeta?.reporterName && (
        <div className="p-2.5 bg-[#0A1628] rounded-lg">
          <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-0.5">Reported By</div>
          <div className="text-[11px] text-[#EEF3FA]">
            {aiMeta.reporterName}{aiMeta.reporterRole ? ` · ${aiMeta.reporterRole}` : ''}
          </div>
        </div>
      )}

      {signals && (
        <div>
          <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-2">Detection Signals</div>
          <div className="space-y-2">
            {signals.map((sig, i) => (
              <div key={i} className="flex items-start gap-3 p-2.5 bg-[#0A1628] rounded-lg">
                <div className="flex-1">
                  <div className="text-[10px] text-[#7A94B4]">{sig.label}</div>
                  <div className="text-[11px] text-[#EEF3FA] font-medium">{sig.value}</div>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-[10px] font-bold text-emerald-400">{sig.match}%</span>
                  <div className="w-14 h-1 bg-[#112040] rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${sig.match}%` }} transition={{ duration: 0.5, delay: i * 0.1 }}
                      className="h-full rounded-full bg-emerald-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const TECH_WHATSAPP: Record<string, string> = {
  'Karim R.':  '+971501112233',
  'Sara M.':   '+971502223344',
  'Ahmed K.':  '+971503334455',
  'Faisal N.': '+971504445566',
  'Omar T.':   '+971505556677',
};

function deriveSkillFromIncident(incident: Incident): string {
  const cat = (incident.aiMetadata?.category ?? incident.title ?? '').toLowerCase();
  if (cat.includes('hvac') || cat.includes('ac') || cat.includes('cooling') || cat.includes('chiller')) return 'HVAC';
  if (cat.includes('plumb') || cat.includes('water') || cat.includes('pool') || cat.includes('leak')) return 'Plumbing';
  if (cat.includes('electrical') || cat.includes('power') || cat.includes('lift') || cat.includes('intercom')) return 'Electrical';
  if (cat.includes('safety') || cat.includes('fire')) return 'Safety';
  return 'General';
}

interface CreateWorkOrderModalProps {
  incident: Incident;
  onClose: () => void;
  onConfirm: (data: CreateWorkOrderInput) => void;
}

function CreateWorkOrderModal({ incident, onClose, onConfirm }: CreateWorkOrderModalProps) {
  const [form, setForm] = useState<CreateWorkOrderInput>({
    title: incident.title,
    location: incident.location,
    priority: incident.severity === 'critical' ? 'critical' : incident.severity === 'high' ? 'high' : incident.severity === 'medium' ? 'medium' : 'low',
    asset: incident.aiMetadata?.identifiedAsset ?? incident.asset ?? '',
    skill: deriveSkillFromIncident(incident),
    description: incident.description,
    siteId: incident.siteId,
  });

  const set = <K extends keyof CreateWorkOrderInput>(k: K, v: CreateWorkOrderInput[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const valid = form.title.trim() && form.location.trim();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2 }}
          className="bg-[#0D1F3C] border border-[rgba(46,127,255,0.25)] rounded-2xl w-full max-w-md shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(46,127,255,0.15)]">
            <div>
              <h3 className="text-[#EEF3FA] font-bold text-sm" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Create Work Order
              </h3>
              <p className="text-[10px] text-[#7A94B4] mt-0.5">Promote incident {incident.id} to a formal work order</p>
            </div>
            <button onClick={onClose} className="text-[#7A94B4] hover:text-white transition-colors">
              <X size={15} />
            </button>
          </div>

          <div className="px-5 py-4 space-y-3 max-h-[65vh] overflow-y-auto custom-scrollbar">
            <div className="p-2.5 bg-blue-500/5 border border-blue-500/20 rounded-xl text-[11px] text-[#7A94B4]">
              Pre-filled from incident data. Adjust as needed before confirming.
            </div>
            <div>
              <label className="block text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1">Title *</label>
              <input
                value={form.title}
                onChange={e => set('title', e.target.value)}
                className="w-full bg-[#112040] border border-[rgba(46,127,255,0.2)] rounded-lg px-3 py-2 text-[12px] text-[#EEF3FA] outline-none focus:border-[#2E7FFF] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1">Location *</label>
              <input
                value={form.location}
                onChange={e => set('location', e.target.value)}
                className="w-full bg-[#112040] border border-[rgba(46,127,255,0.2)] rounded-lg px-3 py-2 text-[12px] text-[#EEF3FA] outline-none focus:border-[#2E7FFF] transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1">Priority</label>
                <select
                  value={form.priority}
                  onChange={e => set('priority', e.target.value)}
                  className="w-full bg-[#112040] border border-[rgba(46,127,255,0.2)] rounded-lg px-3 py-2 text-[12px] text-[#EEF3FA] outline-none focus:border-[#2E7FFF] transition-colors capitalize"
                >
                  {['critical', 'high', 'medium', 'low'].map(p => (
                    <option key={p} value={p} className="bg-[#0D1F3C] capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1">Skill</label>
                <select
                  value={form.skill}
                  onChange={e => set('skill', e.target.value)}
                  className="w-full bg-[#112040] border border-[rgba(46,127,255,0.2)] rounded-lg px-3 py-2 text-[12px] text-[#EEF3FA] outline-none focus:border-[#2E7FFF] transition-colors"
                >
                  {['HVAC', 'Plumbing', 'Electrical', 'Safety', 'General'].map(s => (
                    <option key={s} value={s} className="bg-[#0D1F3C]">{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1">Asset</label>
              <input
                value={form.asset}
                onChange={e => set('asset', e.target.value)}
                placeholder="e.g. Chiller C-04"
                className="w-full bg-[#112040] border border-[rgba(46,127,255,0.2)] rounded-lg px-3 py-2 text-[12px] text-[#EEF3FA] placeholder-[#7A94B4]/50 outline-none focus:border-[#2E7FFF] transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 px-5 pb-5">
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-[rgba(46,127,255,0.2)] text-[11px] text-[#7A94B4] hover:text-[#EEF3FA] hover:border-[rgba(46,127,255,0.4)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => valid && onConfirm(form)}
              disabled={!valid}
              className={`flex-1 py-2 rounded-lg text-[11px] font-semibold transition-colors flex items-center justify-center gap-1.5 ${valid ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-emerald-600/30 text-white/40 cursor-not-allowed'}`}
            >
              <Briefcase size={12} />
              Create Work Order
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function RejectReasonModal({ incidentId, onClose, onConfirm }: { incidentId: string; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState('');
  const valid = reason.trim().length > 0;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.18 }}
          className="bg-[#0D1F3C] border border-red-500/30 rounded-2xl w-full max-w-sm shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-red-500/20">
            <div>
              <h3 className="text-[#EEF3FA] font-bold text-sm">Reject Ticket</h3>
              <p className="text-[10px] text-[#7A94B4] mt-0.5">Provide a reason for rejecting {incidentId}</p>
            </div>
            <button onClick={onClose} className="text-[#7A94B4] hover:text-white transition-colors">
              <X size={15} />
            </button>
          </div>
          <div className="px-5 py-4 space-y-3">
            <div>
              <label className="block text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1">Rejection Reason *</label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="e.g. Insufficient information provided. Please resubmit with photo evidence."
                rows={4}
                className="w-full bg-[#112040] border border-red-500/30 rounded-lg px-3 py-2 text-[12px] text-[#EEF3FA] placeholder-[#7A94B4]/50 outline-none focus:border-red-400 transition-colors resize-none"
                autoFocus
              />
            </div>
          </div>
          <div className="flex items-center gap-2 px-5 pb-5">
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-[rgba(46,127,255,0.2)] text-[11px] text-[#7A94B4] hover:text-[#EEF3FA] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => valid && onConfirm(reason.trim())}
              disabled={!valid}
              className={`flex-1 py-2 rounded-lg text-[11px] font-semibold transition-colors flex items-center justify-center gap-1.5 ${valid ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-red-500/30 text-white/40 cursor-not-allowed'}`}
            >
              <ThumbsDown size={11} />
              Confirm Rejection
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ResolveIncidentModal({ incident, onClose, onConfirm }: { incident: Incident; onClose: () => void; onConfirm: (data: ResolveIncidentInput) => void }) {
  const prefillBefore = incident.beforePhotoUrl || incident.imageUrl || '';
  const [notes, setNotes] = useState('');
  const [beforeUrl, setBeforeUrl] = useState(prefillBefore);
  const [afterUrl, setAfterUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const valid = notes.trim().length > 0 && beforeUrl.trim().length > 0 && afterUrl.trim().length > 0;

  const handleSubmit = async () => {
    if (!valid) return;
    setSubmitting(true);
    try {
      await onConfirm({
        resolvedBy: CURRENT_USER.name,
        resolutionNotes: notes.trim(),
        beforePhotoUrl: beforeUrl.trim() || undefined,
        afterPhotoUrl: afterUrl.trim() || undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const missingPhotos = !beforeUrl.trim() || !afterUrl.trim();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.18 }}
          className="bg-[#0D1F3C] border border-emerald-500/30 rounded-2xl w-full max-w-sm shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-500/20">
            <div>
              <h3 className="text-[#EEF3FA] font-bold text-sm">Submit Resolution</h3>
              <p className="text-[10px] text-[#7A94B4] mt-0.5">Resolve {incident.id} with photo evidence</p>
            </div>
            <button onClick={onClose} className="text-[#7A94B4] hover:text-white transition-colors">
              <X size={15} />
            </button>
          </div>
          <div className="px-5 py-4 space-y-3">
            <div>
              <label className="block text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1">Resolution Notes *</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Describe what was done to resolve this incident…"
                rows={4}
                className="w-full bg-[#112040] border border-emerald-500/30 rounded-lg px-3 py-2 text-[12px] text-[#EEF3FA] placeholder-[#7A94B4]/50 outline-none focus:border-emerald-400 transition-colors resize-none"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1">
                Before Photo URL <span className="text-red-400">*</span>
              </label>
              <input
                value={beforeUrl}
                onChange={e => setBeforeUrl(e.target.value)}
                placeholder="https://…"
                className={`w-full bg-[#112040] border rounded-lg px-3 py-2 text-[12px] text-[#EEF3FA] placeholder-[#7A94B4]/50 outline-none transition-colors ${beforeUrl.trim() ? 'border-emerald-500/40 focus:border-emerald-400' : 'border-red-500/40 focus:border-red-400'}`}
              />
              {!beforeUrl && (incident.imageUrl || incident.beforePhotoUrl) && (
                <button type="button" onClick={() => setBeforeUrl(prefillBefore)} className="text-[9px] text-blue-400 hover:text-blue-300 mt-1">
                  Use incident photo as before photo
                </button>
              )}
            </div>
            <div>
              <label className="block text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1">
                After Photo URL <span className="text-red-400">*</span>
              </label>
              <input
                value={afterUrl}
                onChange={e => setAfterUrl(e.target.value)}
                placeholder="https://…"
                className={`w-full bg-[#112040] border rounded-lg px-3 py-2 text-[12px] text-[#EEF3FA] placeholder-[#7A94B4]/50 outline-none transition-colors ${afterUrl.trim() ? 'border-emerald-500/40 focus:border-emerald-400' : 'border-red-500/40 focus:border-red-400'}`}
              />
            </div>
            {missingPhotos && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                <AlertTriangle size={12} className="text-red-400 flex-shrink-0" />
                <span className="text-[10px] text-red-400">
                  {!beforeUrl.trim() && !afterUrl.trim()
                    ? 'Before and after photos are required'
                    : !beforeUrl.trim()
                    ? 'Before photo URL is required'
                    : 'After photo URL is required'}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 px-5 pb-5">
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-[rgba(46,127,255,0.2)] text-[11px] text-[#7A94B4] hover:text-[#EEF3FA] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!valid || submitting}
              className={`flex-1 py-2 rounded-lg text-[11px] font-semibold transition-colors flex items-center justify-center gap-1.5 ${valid && !submitting ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-emerald-600/30 text-white/40 cursor-not-allowed'}`}
            >
              {submitting ? (
                <><div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" /> Submitting…</>
              ) : (
                <><FileCheck size={11} /> Submit Resolution</>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ActionsTab({ incident, onToast, onCreateWorkOrder }: { incident: Incident; onToast: ToastFn; onCreateWorkOrder: () => void }) {
  const [whatsappOpen, setWhatsappOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [approvingTicket, setApprovingTicket] = useState(false);
  const [confirmingResolution, setConfirmingResolution] = useState(false);
  const { approveTicket, rejectTicket, resolveIncident, confirmResolution } = useIncidents();

  const isClosed  = incident.status === 'closed';
  const isOverdue = incident.status === 'overdue';
  const hasWorkOrder = !!incident.workOrderId;
  const techWhatsapp = incident.assignedTech ? TECH_WHATSAPP[incident.assignedTech] : null;
  const ticketState = incident.ticketState;
  const isPendingApproval = ticketState === 'pending_approval';
  const isRejected = ticketState === 'rejected';
  const isWorkOrderCreated = ticketState === 'work_order_created';

  const defaultWhatsappMsg = incident.assignedTech
    ? `Hi ${incident.assignedTech}, this is DevelopmentX AI-OS.\n\nIncident ${incident.id}: ${incident.title}\nLocation: ${incident.location}\nSeverity: ${incident.severity.toUpperCase()}\n\nPlease acknowledge this message and confirm your ETA.`
    : '';

  const handleApprove = async () => {
    setApprovingTicket(true);
    try {
      await approveTicket(incident.id, CURRENT_USER.name);
      onToast(`Work Order created — engineer dispatched`, 'success');
    } catch {
      onToast('Failed to approve ticket', 'error');
    } finally {
      setApprovingTicket(false);
    }
  };

  const handleReject = async (reason: string) => {
    setRejectModalOpen(false);
    try {
      await rejectTicket(incident.id, reason, CURRENT_USER.name);
      onToast(`Ticket ${incident.id} rejected — reporter notified`, 'info');
    } catch {
      onToast('Failed to reject ticket', 'error');
    }
  };

  const isResolved = incident.status === 'resolved';

  const handleResolve = async (data: ResolveIncidentInput) => {
    setResolveModalOpen(false);
    try {
      await resolveIncident(incident.id, data);
      onToast(`${incident.id} marked resolved — supervisor/AM notified for confirmation`, 'success');
    } catch {
      onToast('Failed to submit resolution', 'error');
    }
  };

  const handleConfirmResolution = async () => {
    setConfirmingResolution(true);
    try {
      await confirmResolution(incident.id, CURRENT_USER.name);
      onToast(`Resolution confirmed — incident closed, client notified`, 'success');
    } catch {
      onToast('Failed to confirm resolution', 'error');
    } finally {
      setConfirmingResolution(false);
    }
  };

  return (
    <div className="space-y-3">
      {whatsappOpen && incident.assignedTech && techWhatsapp && (
        <WhatsAppModal
          recipientName={incident.assignedTech}
          recipientPhone={techWhatsapp}
          defaultMessage={defaultWhatsappMsg}
          onClose={() => setWhatsappOpen(false)}
          onSent={name => onToast(`WhatsApp sent to ${name}`, 'success')}
          onError={name => onToast(`Failed to send — check number for ${name}`, 'error')}
        />
      )}
      {rejectModalOpen && (
        <RejectReasonModal
          incidentId={incident.id}
          onClose={() => setRejectModalOpen(false)}
          onConfirm={handleReject}
        />
      )}
      {resolveModalOpen && (
        <ResolveIncidentModal
          incident={incident}
          onClose={() => setResolveModalOpen(false)}
          onConfirm={handleResolve}
        />
      )}

      <div className="text-[11px] text-[#7A94B4]">Actions available for {incident.id}</div>

      {isPendingApproval && canApprove && (
        <div className="p-3 bg-amber-500/5 border border-amber-500/25 rounded-xl space-y-2">
          <div className="flex items-center gap-1.5 mb-1">
            <Hourglass size={12} className="text-amber-400" />
            <span className="text-[11px] text-amber-400 font-semibold">Awaiting Approval</span>
          </div>
          <p className="text-[10px] text-[#7A94B4]">As a supervisor/account manager, your decision is required to proceed.</p>
          <div className="flex gap-2">
            <button
              onClick={handleApprove}
              disabled={approvingTicket}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600/15 border border-emerald-500/40 text-emerald-400 text-[11px] font-bold hover:bg-emerald-600/25 transition-colors disabled:opacity-60"
            >
              {approvingTicket ? <><div className="w-3 h-3 border border-emerald-400 border-t-transparent rounded-full animate-spin" /> Approving…</> : <><ThumbsUp size={12} /> Approve</>}
            </button>
            <button
              onClick={() => setRejectModalOpen(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] font-bold hover:bg-red-500/20 transition-colors"
            >
              <ThumbsDown size={12} /> Reject
            </button>
          </div>
        </div>
      )}

      {isPendingApproval && !canApprove && (
        <div className="flex items-center gap-2 p-3 bg-amber-500/5 border border-amber-500/25 rounded-xl">
          <Hourglass size={13} className="text-amber-400 flex-shrink-0" />
          <div>
            <div className="text-[11px] text-amber-400 font-semibold">Pending Approval</div>
            <div className="text-[10px] text-[#7A94B4]">Awaiting supervisor or account manager decision</div>
          </div>
        </div>
      )}

      {isRejected && (
        <div className="p-3 bg-red-500/5 border border-red-500/25 rounded-xl">
          <div className="flex items-center gap-1.5 mb-1">
            <ThumbsDown size={12} className="text-red-400" />
            <span className="text-[11px] text-red-400 font-semibold">Ticket Rejected</span>
          </div>
          {incident.rejectionReason && (
            <p className="text-[10px] text-[#7A94B4] leading-relaxed">Reason: {incident.rejectionReason}</p>
          )}
          {incident.rejectedBy && (
            <p className="text-[10px] text-[#7A94B4] mt-0.5">Rejected by: {incident.rejectedBy}</p>
          )}
        </div>
      )}

      {!ticketState && canCreateWorkOrder && !isClosed && !hasWorkOrder && (
        <button
          onClick={onCreateWorkOrder}
          className="w-full flex items-center gap-2.5 p-3 rounded-xl bg-emerald-600/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/20 transition-colors"
        >
          <Briefcase size={14} />
          <div className="text-left">
            <div className="text-[12px] font-bold">Create Work Order</div>
            <div className="text-[10px] opacity-80">Promote to formal work order · notifies stakeholders</div>
          </div>
        </button>
      )}

      {(hasWorkOrder || isWorkOrderCreated) && (
        <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
          <Briefcase size={14} className="text-blue-400" />
          <div>
            <div className="text-[12px] text-blue-400 font-semibold">Work Order Raised</div>
            <div className="text-[10px] text-[#7A94B4]">ID: {incident.workOrderId} · Appears in Kanban Board</div>
          </div>
        </div>
      )}

      {!incident.assignedTech && !isClosed && !isRejected && !isResolved && (
        <button
          onClick={() => onToast(`Smart dispatch opened for ${incident.id}`, 'info')}
          className="w-full flex items-center gap-2.5 p-3 rounded-xl bg-[#2E7FFF] text-white hover:bg-blue-500 transition-colors"
        >
          <Send size={14} />
          <div className="text-left">
            <div className="text-[12px] font-bold">Dispatch Technician</div>
            <div className="text-[10px] opacity-80">Open AI smart-dispatch panel</div>
          </div>
        </button>
      )}
      {incident.assignedTech && techWhatsapp && !isClosed && !isResolved && (
        <button
          onClick={() => setWhatsappOpen(true)}
          className="w-full flex items-center gap-2.5 p-3 rounded-xl bg-emerald-600/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/20 transition-colors"
        >
          <MessageSquare size={14} />
          <div className="text-left">
            <div className="text-[12px] font-bold">Send WhatsApp to {incident.assignedTech}</div>
            <div className="text-[10px] opacity-80">Notify technician via WhatsApp</div>
          </div>
        </button>
      )}
      {!isClosed && !isRejected && !isResolved && (
        <button
          onClick={() => onToast(`${incident.id} escalated to senior supervisor`, 'warning')}
          className="w-full flex items-center gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-colors"
        >
          <TrendingUp size={14} />
          <div className="text-left">
            <div className="text-[12px] font-bold">Escalate</div>
            <div className="text-[10px] opacity-80">Notify senior supervisor immediately</div>
          </div>
        </button>
      )}
      {isOverdue && !isResolved && (
        <button
          onClick={() => onToast(`SLA breach report generated for ${incident.id}`, 'error')}
          className="w-full flex items-center gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"
        >
          <AlertTriangle size={14} />
          <div className="text-left">
            <div className="text-[12px] font-bold">Generate SLA Breach Report</div>
            <div className="text-[10px] opacity-80">Document and notify compliance team</div>
          </div>
        </button>
      )}
      {canResolve && !isClosed && !isRejected && !isResolved && (
        <button
          onClick={() => setResolveModalOpen(true)}
          className="w-full flex items-center gap-2.5 p-3 rounded-xl bg-emerald-600/10 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-600/20 transition-colors"
        >
          <FileCheck size={14} />
          <div className="text-left">
            <div className="text-[12px] font-bold">Submit Resolution</div>
            <div className="text-[10px] opacity-80">Mark resolved with notes and photo evidence · notifies supervisor/AM</div>
          </div>
        </button>
      )}
      {isResolved && canApprove && (
        <div className="p-3 bg-amber-500/5 border border-amber-500/30 rounded-xl space-y-2">
          <div className="flex items-center gap-1.5 mb-1">
            <ShieldCheck size={13} className="text-amber-400" />
            <span className="text-[11px] text-amber-400 font-semibold">Confirm Resolution</span>
          </div>
          <p className="text-[10px] text-[#7A94B4] leading-relaxed">
            The engineer has submitted a resolution. Confirm to close the incident and send the client a full resolution report.
          </p>
          {incident.resolvedBy && (
            <div className="text-[10px] text-[#7A94B4]">Resolved by: <span className="text-[#EEF3FA]">{incident.resolvedBy}</span></div>
          )}
          {incident.resolutionNotes && (
            <div className="text-[10px] text-[#7A94B4] leading-relaxed italic">"{incident.resolutionNotes}"</div>
          )}
          <button
            onClick={handleConfirmResolution}
            disabled={confirmingResolution}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 text-[11px] font-bold hover:bg-emerald-600/30 transition-colors disabled:opacity-60"
          >
            {confirmingResolution ? (
              <><div className="w-3 h-3 border border-emerald-400 border-t-transparent rounded-full animate-spin" /> Confirming…</>
            ) : (
              <><ShieldCheck size={13} /> Confirm Resolution &amp; Close Incident</>
            )}
          </button>
        </div>
      )}
      {isResolved && !canApprove && (
        <div className="flex items-center gap-2 p-3 bg-amber-500/5 border border-amber-500/25 rounded-xl">
          <Hourglass size={13} className="text-amber-400 flex-shrink-0" />
          <div>
            <div className="text-[11px] text-amber-400 font-semibold">Awaiting Supervisor/AM Confirmation</div>
            <div className="text-[10px] text-[#7A94B4]">Resolution submitted — a supervisor or account manager must confirm to close</div>
          </div>
        </div>
      )}
      {isClosed && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
          <CheckCircle size={14} className="text-emerald-400" />
          <div>
            <div className="text-[12px] text-emerald-400 font-semibold">Incident Closed · Client Notified</div>
            {incident.confirmedBy && (
              <div className="text-[10px] text-[#7A94B4]">Confirmed by {incident.confirmedBy}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const SLA_OPTIONS: Record<string, number> = { critical: 45, high: 60, medium: 120, low: 240 };

interface AiAnalysisMeta {
  title?: string;
  description?: string;
  severity?: string;
  issueType?: string;
  category?: string;
  identifiedAsset?: string;
  observations?: string[];
  recommendedAction?: string;
  confidence?: number;
}

interface NewIncidentForm {
  title: string;
  location: string;
  severity: string;
  description: string;
  source: string;
  imageUrl?: string;
  aiMetadata?: AiAnalysisMeta;
}

const EMPTY_FORM: NewIncidentForm = { title: '', location: '', severity: 'medium', description: '', source: 'Manual' };

interface ChatMsg { role: 'user' | 'assistant'; content: string; }

function parseSuggestions(text: string): { title?: string; severity?: string; description?: string } {
  const out: { title?: string; severity?: string; description?: string } = {};
  const titleMatch = text.match(/\*\*Title:\*\*\s*(.+)/i);
  if (titleMatch) out.title = titleMatch[1].trim();
  const sevMatch = text.match(/\*\*Severity:\*\*\s*(critical|high|medium|low)/i);
  if (sevMatch) out.severity = sevMatch[1].toLowerCase();
  const descMatch = text.match(/\*\*Description:\*\*\s*([\s\S]+?)(?:\n\n|$)/i);
  if (descMatch) out.description = descMatch[1].trim();
  return out;
}

function NewIncidentModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (f: NewIncidentForm) => void }) {
  const [form, setForm] = useState<NewIncidentForm>(EMPTY_FORM);
  const set = (k: keyof NewIncidentForm, v: string) => setForm(prev => ({ ...prev, [k]: v }));
  const valid = form.title.trim() && form.location.trim() && form.description.trim();

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  const [aiSuggested, setAiSuggested] = useState<{ title?: boolean; severity?: boolean; description?: boolean }>({});
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [pendingSuggestions, setPendingSuggestions] = useState<{ title?: string; severity?: string; description?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const apiBase = window.location.origin + '/api';

  const handlePhotoFile = useCallback(async (file: File) => {
    const preview = URL.createObjectURL(file);
    setPhotoPreview(preview);
    setAnalyzingPhoto(true);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('siteId', '');
    formData.append('assetId', '');

    try {
      const res = await fetch(`${apiBase}/ai/analyze-issue-image`, { method: 'POST', body: formData });
      const data = await res.json() as { success: boolean; imageUrl?: string; analysis?: AiAnalysisMeta };
      if (data.success && data.analysis) {
        const a = data.analysis;
        const imageUrl = data.imageUrl ? window.location.origin + data.imageUrl : preview;
        setForm(prev => {
          setAiSuggested({
            title: !prev.title && !!a.title,
            severity: !!a.severity,
            description: !prev.description && !!a.description,
          });
          return {
            ...prev,
            title: prev.title || (a.title ?? ''),
            severity: a.severity && ['critical','high','medium','low'].includes(a.severity) ? a.severity : prev.severity,
            description: prev.description || (a.description ?? ''),
            imageUrl,
            aiMetadata: a,
          };
        });
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: `Photo analyzed! I detected **${a.title ?? 'an issue'}** (${a.severity ?? 'medium'} severity, ${a.confidence ?? '?'}% confidence).\n\nI've pre-filled the form fields. You can edit them freely or ask me anything about this incident.`,
        }]);
        setAiPanelOpen(true);
      }
    } catch {
      setForm(prev => ({ ...prev, imageUrl: preview }));
    } finally {
      setAnalyzingPhoto(false);
    }
  }, [apiBase]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handlePhotoFile(file);
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setForm(prev => ({ ...prev, imageUrl: undefined, aiMetadata: undefined }));
    setAiSuggested({});
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const sendChatMessage = useCallback(async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    setChatInput('');
    const userMsg: ChatMsg = { role: 'user', content: text };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatLoading(true);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

    try {
      const res = await fetch(`${apiBase}/ai/incident-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          formContext: {
            title: form.title,
            location: form.location,
            severity: form.severity,
            description: form.description,
            imageAnalysis: form.aiMetadata,
          },
        }),
      });
      const data = await res.json() as { reply: string };
      const assistantMsg: ChatMsg = { role: 'assistant', content: data.reply };
      setChatMessages(prev => [...prev, assistantMsg]);
      const suggestions = parseSuggestions(data.reply);
      if (suggestions.title || suggestions.severity || suggestions.description) {
        setPendingSuggestions(suggestions);
      }
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not reach the AI assistant right now. Please try again.' }]);
    } finally {
      setChatLoading(false);
    }
  }, [chatInput, chatLoading, chatMessages, form, apiBase]);

  const acceptSuggestion = (field: 'title' | 'severity' | 'description', value: string) => {
    set(field, value);
    setAiSuggested(prev => ({ ...prev, [field]: true }));
    setPendingSuggestions(prev => {
      if (!prev) return null;
      const next = { ...prev };
      delete next[field];
      return Object.keys(next).length ? next : null;
    });
  };

  const AISuggestedBadge = () => (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-semibold bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 ml-1.5">
      <Sparkles size={7} />AI
    </span>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2 }}
          className="bg-[#0D1F3C] border border-[rgba(46,127,255,0.25)] rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(46,127,255,0.15)] flex-shrink-0">
            <div>
              <h3 className="text-[#EEF3FA] font-bold text-sm" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>New Incident</h3>
              <p className="text-[10px] text-[#7A94B4] mt-0.5">Manually report a new incident</p>
            </div>
            <button onClick={onClose} className="text-[#7A94B4] hover:text-white transition-colors">
              <X size={15} />
            </button>
          </div>

          <div className="overflow-y-auto flex-1">
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="block text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1.5">Photo</label>
                {!photoPreview ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border border-dashed border-[rgba(46,127,255,0.3)] bg-[#112040] hover:bg-[rgba(46,127,255,0.08)] hover:border-[rgba(46,127,255,0.5)] transition-colors text-[10px] text-[#7A94B4]"
                    >
                      <Camera size={18} className="text-[#2E7FFF]" />
                      Take Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border border-dashed border-[rgba(46,127,255,0.3)] bg-[#112040] hover:bg-[rgba(46,127,255,0.08)] hover:border-[rgba(46,127,255,0.5)] transition-colors text-[10px] text-[#7A94B4]"
                    >
                      <Upload size={18} className="text-[#2E7FFF]" />
                      Upload Image
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <img src={photoPreview} alt="Incident photo" className="w-full rounded-xl object-cover max-h-36 border border-[rgba(46,127,255,0.2)]" />
                    {analyzingPhoto && (
                      <div className="absolute inset-0 rounded-xl bg-black/60 flex flex-col items-center justify-center gap-2">
                        <Loader2 size={20} className="text-cyan-400 animate-spin" />
                        <span className="text-[10px] text-cyan-300">Analyzing with AI…</span>
                      </div>
                    )}
                    {!analyzingPhoto && (
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                      >
                        <X size={11} />
                      </button>
                    )}
                  </div>
                )}
                <input ref={cameraInputRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" onChange={handleFileChange} />
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
              </div>

              <div>
                <label className="block text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1">
                  Title *{aiSuggested.title && <AISuggestedBadge />}
                </label>
                <input
                  value={form.title}
                  onChange={e => { set('title', e.target.value); setAiSuggested(p => ({ ...p, title: false })); }}
                  placeholder="e.g. AC Failure — Villa 12"
                  className="w-full bg-[#112040] border border-[rgba(46,127,255,0.2)] rounded-lg px-3 py-2 text-[12px] text-[#EEF3FA] placeholder-[#7A94B4]/50 outline-none focus:border-[#2E7FFF] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1">Location *</label>
                <input
                  value={form.location}
                  onChange={e => set('location', e.target.value)}
                  placeholder="e.g. Villa 12, Cluster A"
                  className="w-full bg-[#112040] border border-[rgba(46,127,255,0.2)] rounded-lg px-3 py-2 text-[12px] text-[#EEF3FA] placeholder-[#7A94B4]/50 outline-none focus:border-[#2E7FFF] transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1">
                    Severity{aiSuggested.severity && <AISuggestedBadge />}
                  </label>
                  <select
                    value={form.severity}
                    onChange={e => { set('severity', e.target.value); setAiSuggested(p => ({ ...p, severity: false })); }}
                    className="w-full bg-[#112040] border border-[rgba(46,127,255,0.2)] rounded-lg px-3 py-2 text-[12px] text-[#EEF3FA] outline-none focus:border-[#2E7FFF] transition-colors capitalize"
                  >
                    {['critical', 'high', 'medium', 'low'].map(s => (
                      <option key={s} value={s} className="bg-[#0D1F3C] capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1">Source</label>
                  <select
                    value={form.source}
                    onChange={e => set('source', e.target.value)}
                    className="w-full bg-[#112040] border border-[rgba(46,127,255,0.2)] rounded-lg px-3 py-2 text-[12px] text-[#EEF3FA] outline-none focus:border-[#2E7FFF] transition-colors"
                  >
                    {NEW_INC_SOURCES.map(s => (
                      <option key={s} value={s} className="bg-[#0D1F3C]">{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1">
                  Description *{aiSuggested.description && <AISuggestedBadge />}
                </label>
                <textarea
                  value={form.description}
                  onChange={e => { set('description', e.target.value); setAiSuggested(p => ({ ...p, description: false })); }}
                  placeholder="Describe the incident in detail…"
                  rows={3}
                  className="w-full bg-[#112040] border border-[rgba(46,127,255,0.2)] rounded-lg px-3 py-2 text-[12px] text-[#EEF3FA] placeholder-[#7A94B4]/50 outline-none focus:border-[#2E7FFF] transition-colors resize-none"
                />
              </div>

              <div className="border border-[rgba(46,127,255,0.2)] rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    setAiPanelOpen(v => !v);
                    if (!aiPanelOpen && chatMessages.length === 0) {
                      setChatMessages([{ role: 'assistant', content: 'Hi! I\'m here to help you fill in this incident report. You can upload a photo for automatic analysis, or describe the issue and I\'ll suggest the title, severity, and description.' }]);
                    }
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-[rgba(46,127,255,0.06)] hover:bg-[rgba(46,127,255,0.1)] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles size={12} className="text-cyan-400" />
                    <span className="text-[11px] font-semibold text-cyan-400">AI Assistant</span>
                    {chatMessages.length > 0 && (
                      <span className="text-[9px] text-[#7A94B4]">· {chatMessages.length} message{chatMessages.length !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                  {aiPanelOpen ? <ChevronUp size={13} className="text-[#7A94B4]" /> : <ChevronDownIcon size={13} className="text-[#7A94B4]" />}
                </button>

                <AnimatePresence>
                  {aiPanelOpen && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-[rgba(46,127,255,0.15)]">
                        <div className="max-h-44 overflow-y-auto px-3 py-2 space-y-2">
                          {chatMessages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[85%] rounded-xl px-2.5 py-2 text-[11px] leading-relaxed whitespace-pre-wrap ${
                                msg.role === 'user'
                                  ? 'bg-[#2E7FFF] text-white rounded-br-sm'
                                  : 'bg-[rgba(46,127,255,0.1)] text-[#EEF3FA] rounded-bl-sm border border-[rgba(46,127,255,0.2)]'
                              }`}>
                                {msg.content}
                              </div>
                            </div>
                          ))}
                          {chatLoading && (
                            <div className="flex justify-start">
                              <div className="bg-[rgba(46,127,255,0.1)] border border-[rgba(46,127,255,0.2)] rounded-xl rounded-bl-sm px-3 py-2">
                                <div className="flex gap-1">
                                  {[0,1,2].map(i => (
                                    <motion.div key={i} animate={{ opacity: [0.3,1,0.3] }} transition={{ repeat: Infinity, duration: 1, delay: i*0.3 }}
                                      className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                          <div ref={chatEndRef} />
                        </div>

                        {pendingSuggestions && (Object.keys(pendingSuggestions).length > 0) && (
                          <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                            {pendingSuggestions.title && (
                              <button type="button" onClick={() => acceptSuggestion('title', pendingSuggestions.title!)}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-[9px] text-cyan-400 hover:bg-cyan-500/25 transition-colors">
                                <CheckCircle size={8} /> Accept title
                              </button>
                            )}
                            {pendingSuggestions.severity && (
                              <button type="button" onClick={() => acceptSuggestion('severity', pendingSuggestions.severity!)}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-[9px] text-cyan-400 hover:bg-cyan-500/25 transition-colors">
                                <CheckCircle size={8} /> Accept severity
                              </button>
                            )}
                            {pendingSuggestions.description && (
                              <button type="button" onClick={() => acceptSuggestion('description', pendingSuggestions.description!)}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-[9px] text-cyan-400 hover:bg-cyan-500/25 transition-colors">
                                <CheckCircle size={8} /> Accept description
                              </button>
                            )}
                          </div>
                        )}

                        <div className="border-t border-[rgba(46,127,255,0.1)] px-3 py-2 flex gap-2">
                          <input
                            value={chatInput}
                            onChange={e => setChatInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChatMessage()}
                            placeholder="Ask AI for help…"
                            className="flex-1 bg-[#112040] border border-[rgba(46,127,255,0.2)] rounded-lg px-2.5 py-1.5 text-[11px] text-[#EEF3FA] placeholder-[#7A94B4]/50 outline-none focus:border-[#2E7FFF] transition-colors"
                          />
                          <button
                            type="button"
                            onClick={sendChatMessage}
                            disabled={!chatInput.trim() || chatLoading}
                            className="w-7 h-7 rounded-lg bg-[#2E7FFF] flex items-center justify-center text-white disabled:opacity-40 hover:bg-blue-500 transition-colors flex-shrink-0"
                          >
                            <Send size={11} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-5 pb-5 pt-3 flex-shrink-0 border-t border-[rgba(46,127,255,0.1)]">
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-[rgba(46,127,255,0.2)] text-[11px] text-[#7A94B4] hover:text-[#EEF3FA] hover:border-[rgba(46,127,255,0.4)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => valid && onSubmit(form)}
              disabled={!valid}
              className={`flex-1 py-2 rounded-lg text-[11px] font-semibold transition-colors ${valid ? 'bg-[#2E7FFF] text-white hover:bg-blue-500' : 'bg-[#2E7FFF]/30 text-white/40 cursor-not-allowed'}`}
            >
              Create Incident
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

interface Props { onToast: ToastFn; initialClientId?: string; initialIncidentId?: string; onInitialIncidentHandled?: () => void }

type SortKey = 'severity' | 'sla' | 'status' | 'none';
type SortDir = 'asc' | 'desc';

const SEVERITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
const STATUS_ORDER: Record<string, number>   = { overdue: 0, 'in-progress': 1, open: 2, dispatched: 3, assigned: 4, closed: 5 };

export function Incidents({ onToast, initialClientId, initialIncidentId, onInitialIncidentHandled }: Props) {
  const { incidents, addIncident, createWorkOrder } = useIncidents();
  const { clients } = useClients();
  const [search,      setSearch]      = useState('');
  const [severity,    setSeverity]    = useState('All');
  const [status,      setStatus]      = useState('All');
  const [source,      setSource]      = useState('All');
  const [client,      setClient]      = useState(initialClientId ?? 'All');
  const [site,        setSite]        = useState('All');
  const [selected,    setSelected]    = useState<Incident | null>(null);
  const [activeTab,   setActiveTab]   = useState('Overview');
  const [sortKey,     setSortKey]     = useState<SortKey>('none');
  const [sortDir,     setSortDir]     = useState<SortDir>('asc');
  const [showModal,   setShowModal]   = useState(false);
  const [woModalFor,  setWoModalFor]  = useState<Incident | null>(null);
  const handledRef = useRef(false);

  useEffect(() => {
    if (!initialIncidentId || handledRef.current) return;
    const inc = incidents.find(i => i.id === initialIncidentId);
    if (inc) {
      openIncident(inc);
      handledRef.current = true;
      onInitialIncidentHandled?.();
    } else if (incidents.length > 0) {
      handledRef.current = true;
      onInitialIncidentHandled?.();
    }
  }, [initialIncidentId, incidents]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const handleCreateIncident = (form: NewIncidentForm) => {
    const maxNum = incidents.reduce((max, inc) => {
      const m = inc.id.match(/INC-SI-(\d+)/);
      return m ? Math.max(max, parseInt(m[1], 10)) : max;
    }, 0);
    const nextId = `INC-SI-${String(maxNum + 1).padStart(3, '0')}`;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const loc = form.location.trim().toLowerCase();
    const siteId =
      loc.includes('silicon oasis') || loc.includes('cluster') || loc.includes('villa')
        ? 'silicon-oasis'
        : loc.includes('gate avenue')
        ? 'gate-avenue'
        : loc.includes('business bay')
        ? 'business-bay'
        : loc.includes('jlt')
        ? 'jlt-north'
        : loc.includes('difc')
        ? 'difc-tower'
        : 'silicon-oasis';
    const activityLog: Incident['activityLog'] = [
      { time: timeStr, event: `Incident manually reported via ${form.source}`, type: 'incident' },
    ];
    if (form.aiMetadata) {
      activityLog.push({ time: timeStr, event: `AI photo analysis: ${form.aiMetadata.category ?? 'General'} · ${form.aiMetadata.confidence ?? '?'}% confidence`, type: 'ai' });
    }
    const newInc: Incident = {
      id: nextId,
      title: form.title.trim(),
      location: form.location.trim(),
      severity: form.severity,
      slaMinutes: SLA_OPTIONS[form.severity] ?? 120,
      elapsed: 0,
      source: form.source,
      status: 'open',
      assignedTech: null,
      techId: null,
      closureNotes: null,
      description: form.description.trim(),
      siteId,
      clientId: 'CLT-001',
      activityLog,
      ...(form.imageUrl ? { imageUrl: form.imageUrl } : {}),
      ...(form.aiMetadata ? {
        aiMetadata: {
          confidence: form.aiMetadata.confidence ?? 0,
          issueType: form.aiMetadata.issueType ?? '',
          category: form.aiMetadata.category ?? '',
          identifiedAsset: form.aiMetadata.identifiedAsset ?? '',
          observations: form.aiMetadata.observations ?? [],
          recommendedAction: form.aiMetadata.recommendedAction ?? '',
        },
      } : {}),
    };
    addIncident(newInc);
    setShowModal(false);
    setSelected(newInc);
    setActiveTab('Overview');
    onToast(`Incident ${newInc.id} created`, 'success');
  };

  const handleCreateWorkOrder = (data: CreateWorkOrderInput) => {
    if (!woModalFor) return;
    const wo = createWorkOrder(woModalFor.id, data);
    setWoModalFor(null);
    onToast(`Work Order ${wo.id} created · stakeholders notified`, 'success');
  };

  const anyFilterActive = client !== 'All' || site !== 'All' || severity !== 'All' || status !== 'All' || source !== 'All' || search !== '';

  const filtered = incidents
    .filter(inc => {
      if (severity !== 'All' && inc.severity !== severity) return false;
      if (status   !== 'All' && inc.status   !== status)   return false;
      if (source   !== 'All' && inc.source   !== source)   return false;
      if (client   !== 'All' && inc.clientId !== client)   return false;
      if (site     !== 'All' && inc.siteId   !== site)     return false;
      if (search && !inc.title.toLowerCase().includes(search.toLowerCase()) &&
                    !inc.location.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortKey === 'none') return 0;
      let cmp = 0;
      if (sortKey === 'severity') cmp = (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9);
      if (sortKey === 'sla')      cmp = slaStatus(a.elapsed, a.slaMinutes).percent - slaStatus(b.elapsed, b.slaMinutes).percent;
      if (sortKey === 'status')   cmp = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const openIncident = (inc: Incident) => { setSelected(inc); setActiveTab('Overview'); };

  const displayedIncident = selected
    ? (incidents.find(i => i.id === selected.id) ?? selected)
    : null;

  const counts = {
    critical: incidents.filter(i => i.severity === 'critical').length,
    open:     incidents.filter(i => i.status === 'open').length,
    overdue:  incidents.filter(i => i.status === 'overdue').length,
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {showModal && (
        <NewIncidentModal
          onClose={() => setShowModal(false)}
          onSubmit={handleCreateIncident}
        />
      )}
      {woModalFor && (
        <CreateWorkOrderModal
          incident={woModalFor}
          onClose={() => setWoModalFor(null)}
          onConfirm={handleCreateWorkOrder}
        />
      )}

      <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(46,127,255,0.15)] flex-shrink-0">
        <div>
          <h2 className="text-[#EEF3FA] font-bold text-base" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Incidents</h2>
          <p className="text-[11px] text-[#7A94B4]">All active incidents · Silicon Oasis · {incidents.length} total</p>
        </div>
        <div className="flex items-center gap-3">
          {[
            { label: 'Critical', value: counts.critical, color: 'text-red-400 bg-red-500/10 border-red-500/30' },
            { label: 'Open',     value: counts.open,     color: 'text-[#7A94B4] bg-white/5 border-white/10' },
            { label: 'Overdue',  value: counts.overdue,  color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
          ].map(k => (
            <div key={k.label} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-semibold ${k.color}`}>
              <span className="text-[13px] font-bold">{k.value}</span>
              <span>{k.label}</span>
            </div>
          ))}
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2E7FFF] text-white text-[11px] font-semibold hover:bg-blue-500 transition-colors"
          >
            <Plus size={12} />
            New Incident
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 px-5 py-2.5 border-b border-[rgba(46,127,255,0.1)] flex-shrink-0 flex-wrap gap-y-2">
        <select value={client} onChange={e => setClient(e.target.value)} className="bg-[#112040] border border-[rgba(46,127,255,0.2)] rounded-lg px-2 py-1.5 text-[11px] text-[#EEF3FA] outline-none cursor-pointer">
          <option value="All">All properties</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select value={site} onChange={e => setSite(e.target.value)} className="bg-[#112040] border border-[rgba(46,127,255,0.2)] rounded-lg px-2 py-1.5 text-[11px] text-[#EEF3FA] outline-none cursor-pointer">
          <option value="All">All sites</option>
          {['silicon-oasis', 'gate-avenue', 'business-bay', 'jlt-north', 'difc-tower'].map(s => (
            <option key={s} value={s}>{s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
          ))}
        </select>
        <div className="flex items-center gap-1.5 bg-[#112040] rounded-lg px-2.5 py-1.5 border border-[rgba(46,127,255,0.2)] flex-shrink-0">
          <Search size={11} className="text-[#7A94B4]" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search incidents…"
            className="bg-transparent text-[11px] text-[#EEF3FA] placeholder-[#7A94B4] outline-none w-28"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {ALL_SEVERITIES.map(s => (
            <button key={s} onClick={() => setSeverity(s)}
              className={`text-[10px] px-2 py-1 rounded-lg border capitalize transition-all ${severity === s ? 'bg-[rgba(46,127,255,0.2)] border-[#2E7FFF] text-[#EEF3FA]' : 'border-[rgba(46,127,255,0.15)] text-[#7A94B4] hover:text-[#EEF3FA]'}`}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-1 flex-wrap">
          {ALL_STATUSES.map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`text-[10px] px-2 py-1 rounded-lg border capitalize transition-all ${status === s ? 'bg-[rgba(46,127,255,0.2)] border-[#2E7FFF] text-[#EEF3FA]' : 'border-[rgba(46,127,255,0.15)] text-[#7A94B4] hover:text-[#EEF3FA]'}`}>
              {s === 'All' ? 'All' : (STATUS_CONFIG[s]?.label ?? s.replace('-', ' '))}
            </button>
          ))}
        </div>
        <div className="flex gap-1 flex-wrap">
          {ALL_SOURCES.map(s => (
            <button key={s} onClick={() => setSource(s)}
              className={`text-[10px] px-2 py-1 rounded-lg border transition-all ${source === s ? 'bg-[rgba(46,127,255,0.2)] border-[#2E7FFF] text-[#EEF3FA]' : 'border-[rgba(46,127,255,0.15)] text-[#7A94B4] hover:text-[#EEF3FA]'}`}>
              {s}
            </button>
          ))}
        </div>
        {anyFilterActive && (
          <button
            onClick={() => { setClient('All'); setSite('All'); setSeverity('All'); setStatus('All'); setSource('All'); setSearch(''); }}
            className="flex items-center gap-1 text-[10px] text-[#7A94B4] hover:text-red-400 transition-colors px-2 py-1 rounded-lg border border-[rgba(255,255,255,0.08)] hover:border-red-500/30 ml-auto"
          >
            <X size={10} /> Clear filters
          </button>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className={`flex flex-col overflow-hidden transition-all duration-300 ${selected ? 'flex-[55]' : 'flex-1'}`}>
          <div className="hidden sm:grid grid-cols-[2fr_1.2fr_0.9fr_1.4fr_0.9fr_1.1fr_1.2fr] px-5 py-2 text-[9px] text-[#7A94B4] uppercase tracking-wide border-b border-[rgba(46,127,255,0.08)] flex-shrink-0">
            {[
              { label: 'Incident',       key: null },
              { label: 'Location',       key: null },
              { label: 'Severity',       key: 'severity' as SortKey },
              { label: 'SLA / Progress', key: 'sla' as SortKey },
              { label: 'Status',         key: 'status' as SortKey },
              { label: 'Source',         key: null },
              { label: 'Tech',           key: null },
            ].map(h => (
              <div key={h.label}
                className={`flex items-center gap-0.5 ${h.key ? 'cursor-pointer hover:text-[#EEF3FA] select-none' : ''} ${sortKey === h.key ? 'text-[#EEF3FA]' : ''}`}
                onClick={() => h.key && handleSort(h.key)}
              >
                {h.label}
                {h.key && sortKey === h.key && (sortDir === 'asc' ? <ChevronUp size={9} /> : <ChevronDownIcon size={9} />)}
                {h.key && sortKey !== h.key && <ChevronUp size={9} className="opacity-0 group-hover:opacity-40" />}
              </div>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filtered.map(inc => {
              const st  = STATUS_CONFIG[inc.status] || STATUS_CONFIG['open'];
              const isSelected = selected?.id === inc.id;
              const hasWO = !!inc.workOrderId;
              return (
                <motion.div
                  key={inc.id}
                  whileTap={{ scale: 0.995 }}
                  className={`w-full text-left px-5 py-3 border-b border-[rgba(46,127,255,0.08)] hover:bg-white/[0.02] transition-all cursor-pointer ${isSelected ? 'bg-[rgba(46,127,255,0.08)]' : ''}`}
                  onClick={() => openIncident(inc)}
                >
                  <div className="grid grid-cols-[2fr_1.2fr_0.9fr_1.4fr_0.9fr_1.1fr_1.2fr] items-center gap-2">
                    <div>
                      <div className="text-[12px] text-[#EEF3FA] font-semibold">{inc.title}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] text-[#7A94B4]">{inc.id}</span>
                        {hasWO && (
                          <span className="text-[8px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-1 py-0.5 rounded font-semibold">
                            WO: {inc.workOrderId}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-[11px] text-[#7A94B4]">{inc.location}</div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border w-fit capitalize ${SEVERITY_BADGE[inc.severity]}`}>
                      {inc.severity}
                    </span>
                    <SLABar incident={inc} />
                    <div className="flex items-center gap-1 flex-wrap">
                      <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-semibold w-fit ${st.bg} ${st.text}`}>
                        <div className={`w-1 h-1 rounded-full flex-shrink-0 ${st.dot}`} />
                        {st.label}
                      </div>
                      {inc.ticketState && (() => {
                        const tcfg = TICKET_STATE_CONFIG[inc.ticketState];
                        return (
                          <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-semibold w-fit ${tcfg.bg} ${tcfg.text}`}>
                            <div className={`w-1 h-1 rounded-full flex-shrink-0 ${tcfg.dot}`} />
                            {tcfg.label}
                          </div>
                        );
                      })()}
                    </div>
                    <SourceBadge source={inc.source} />
                    <div className="flex items-center gap-1.5">
                      {inc.assignedTech ? (
                        <>
                          <TechAvatar initials={inc.techId || '?'} size={6} />
                          <span className="text-[10px] text-[#EEF3FA]">{inc.assignedTech}</span>
                        </>
                      ) : (
                        <span className="text-[10px] text-[#7A94B4] opacity-50">Unassigned</span>
                      )}
                      {canCreateWorkOrder && !hasWO && inc.status !== 'closed' && (
                        <button
                          onClick={e => { e.stopPropagation(); setWoModalFor(inc); }}
                          className="ml-auto flex items-center gap-1 px-1.5 py-0.5 rounded-lg border border-emerald-500/30 text-emerald-400 text-[9px] font-semibold hover:bg-emerald-500/10 transition-colors flex-shrink-0"
                        >
                          <Briefcase size={9} />
                          <span className="hidden xl:inline">WO</span>
                        </button>
                      )}
                      {hasWO && (
                        <Briefcase size={10} className="text-emerald-400 ml-auto flex-shrink-0" />
                      )}
                      <ChevronRight size={11} className={`text-[#7A94B4] transition-transform ${isSelected ? 'rotate-90' : ''} ${hasWO ? '' : 'ml-auto'}`} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-2">
                <AlertTriangle size={28} className="text-[#7A94B4] opacity-30" />
                <span className="text-[12px] text-[#7A94B4] opacity-60">No incidents match filters</span>
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {displayedIncident && (
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.22 }}
              className="flex-[45] border-l border-[rgba(46,127,255,0.2)] flex flex-col overflow-hidden bg-[#0A1628]"
            >
              {displayedIncident.imageUrl && (
                <div className="relative flex-shrink-0 overflow-hidden" style={{ height: 130 }}>
                  <img
                    src={displayedIncident.imageUrl}
                    alt="Incident"
                    className="w-full h-full object-cover"
                    onError={e => { (e.currentTarget as HTMLImageElement).parentElement!.style.display = 'none'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A1628] via-[#0A1628]/40 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0A1628]/20 to-transparent" />
                  <button
                    onClick={() => setSelected(null)}
                    className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors border border-white/10"
                  >
                    <X size={12} />
                  </button>
                  <div className="absolute bottom-3 left-5">
                    <div className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border mb-1 capitalize ${SEVERITY_BADGE[displayedIncident.severity]}`}>
                      {displayedIncident.severity}
                    </div>
                    <div className="text-white font-bold text-sm drop-shadow">{displayedIncident.title}</div>
                    <div className="text-[10px] text-[#7A94B4]">{displayedIncident.location}</div>
                  </div>
                  <div className="absolute bottom-3 right-5 flex flex-col items-end gap-1">
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-black/60 text-[#EEF3FA] border border-white/10 font-mono">{displayedIncident.id}</span>
                    {displayedIncident.source.includes('AI') && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-semibold">AI Captured</span>
                    )}
                  </div>
                </div>
              )}
              {!displayedIncident.imageUrl && (
                <div className="flex items-start justify-between px-5 py-4 border-b border-[rgba(46,127,255,0.15)] flex-shrink-0">
                  <div>
                    <div className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border mb-1.5 capitalize ${SEVERITY_BADGE[displayedIncident.severity]}`}>
                      {displayedIncident.severity}
                    </div>
                    <div className="text-[#EEF3FA] font-bold text-sm">{displayedIncident.title}</div>
                    <div className="text-[10px] text-[#7A94B4]">{displayedIncident.location}</div>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-[#7A94B4] hover:text-white transition-colors">
                    <X size={15} />
                  </button>
                </div>
              )}

              <div className="flex gap-0 px-4 pt-3 border-b border-[rgba(46,127,255,0.1)] flex-shrink-0 overflow-x-auto no-scrollbar">
                {DETAIL_TABS.map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`text-[10px] px-3 py-2 font-semibold whitespace-nowrap transition-all border-b-2 ${activeTab === tab ? 'text-[#2E7FFF] border-[#2E7FFF]' : 'text-[#7A94B4] border-transparent hover:text-[#EEF3FA]'}`}>
                    {tab}
                    {tab === 'AI Analysis' && (displayedIncident.source.includes('AI') || displayedIncident.source.includes('IoT')) && (
                      <span className="ml-1 w-1.5 h-1.5 inline-block rounded-full bg-cyan-400" />
                    )}
                    {tab === 'Photos' && displayedIncident.imageUrl && (
                      <span className="ml-1 w-1.5 h-1.5 inline-block rounded-full bg-blue-400" />
                    )}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
                <AnimatePresence mode="wait">
                  <motion.div key={`${displayedIncident.id}-${activeTab}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
                    {activeTab === 'Overview'     && <OverviewTab     incident={displayedIncident} />}
                    {activeTab === 'Photos'       && <PhotosTab       incident={displayedIncident} />}
                    {activeTab === 'Timeline'     && <TimelineTab     incident={displayedIncident} />}
                    {activeTab === 'AI Analysis'  && <AIAnalysisTab   incident={displayedIncident} />}
                    {activeTab === 'Actions'      && <ActionsTab      incident={displayedIncident} onToast={onToast} onCreateWorkOrder={() => setWoModalFor(displayedIncident)} />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
