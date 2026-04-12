import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, AlertTriangle, Clock, Bot, CheckCircle, MapPin, User, Zap,
  Camera, TrendingUp, TrendingDown, Minus, ArrowRight, Bell,
  Send, Activity, Briefcase, ShieldCheck,
} from 'lucide-react';
import { useIncidents, type Incident } from '@/context/IncidentContext';
import { AnimatedBar } from '@/components/shared/AnimatedBar';
import { TechAvatar } from '@/components/shared/TechAvatar';
import { slaStatus } from '@/lib/ui';

type EventType = 'incident' | 'sla' | 'ai' | 'task';

interface PulseEvent {
  id: string;
  type: EventType;
  title: string;
  sub: string;
  time: string;
  location?: string;
  severity?: string;
  new?: boolean;
}

interface Props {
  event: PulseEvent;
  onClose: () => void;
  onToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

const TABS = ['Overview', 'AI Analysis & Patterns', 'Evidence (Photos)', 'Trends', 'Timeline', 'Actions'] as const;
type TabName = typeof TABS[number];

const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  open:          { label: 'Open',         dot: 'bg-[#7A94B4]',              text: 'text-[#7A94B4]',    bg: 'bg-white/5 border-white/10' },
  dispatched:    { label: 'Assigned',     dot: 'bg-blue-400',               text: 'text-blue-400',     bg: 'bg-blue-500/10 border-blue-500/30' },
  'in-progress': { label: 'In Progress',  dot: 'bg-cyan-400 animate-pulse', text: 'text-cyan-400',     bg: 'bg-cyan-500/10 border-cyan-500/30' },
  assigned:      { label: 'Assigned',     dot: 'bg-blue-400',               text: 'text-blue-400',     bg: 'bg-blue-500/10 border-blue-500/30' },
  overdue:       { label: 'Overdue',      dot: 'bg-red-400',                text: 'text-red-400',      bg: 'bg-red-500/10 border-red-500/30' },
  resolved:      { label: 'Resolved',     dot: 'bg-amber-400 animate-pulse',text: 'text-amber-400',    bg: 'bg-amber-500/10 border-amber-500/30' },
  closed:        { label: 'Closed',       dot: 'bg-emerald-400',            text: 'text-emerald-400',  bg: 'bg-emerald-500/10 border-emerald-500/30' },
};

const LOG_ICON: Record<string, React.ReactNode> = {
  incident:   <AlertTriangle size={10} />,
  ai:         <Zap size={10} />,
  dispatch:   <Send size={10} />,
  update:     <Clock size={10} />,
  escalation: <TrendingUp size={10} />,
};

const LOG_COLOR: Record<string, string> = {
  incident:   'text-red-400 border-red-500/40 bg-red-500/10',
  ai:         'text-cyan-400 border-cyan-500/40 bg-cyan-500/10',
  dispatch:   'text-blue-400 border-blue-500/40 bg-blue-500/10',
  update:     'text-[#7A94B4] border-white/10 bg-white/5',
  escalation: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
};

const AI_SIGNALS: Record<string, { label: string; value: string; match: number }[]> = {
  'INC-SI-001': [
    { label: 'Visual signal', value: 'Frost on evaporator coil',  match: 97 },
    { label: 'Pattern match', value: 'R-410A shortage profile',   match: 91 },
    { label: 'Asset history', value: 'Last serviced 83 days ago', match: 88 },
  ],
  'INC-SI-002': [
    { label: 'Visual signal', value: 'Water accumulation pattern', match: 89 },
    { label: 'Pattern match', value: 'Pipe joint failure profile', match: 76 },
    { label: 'Material flag', value: 'Corrosion markers present',  match: 64 },
  ],
  'INC-SI-006': [
    { label: 'Acoustic sensor', value: 'Grinding at 1.2 kHz',    match: 71 },
    { label: 'IoT vibration',   value: 'Baseline exceeded 3.4×', match: 64 },
    { label: 'Pattern match',   value: 'Bearing wear signature',  match: 58 },
  ],
};

function deriveSeverityColor(severity: string | undefined) {
  switch (severity) {
    case 'critical': return '#FF4B4B';
    case 'high':     return '#FF9B38';
    case 'medium':   return '#FBBF24';
    default:         return '#38D98A';
  }
}

function SparkBar({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-0.5 h-8">
      {values.map((v, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          animate={{ height: `${(v / max) * 100}%` }}
          transition={{ duration: 0.4, delay: i * 0.03 }}
          className="flex-1 rounded-sm opacity-80"
          style={{ backgroundColor: color, minHeight: v > 0 ? 2 : 0 }}
        />
      ))}
    </div>
  );
}

function PatternBlock({ incident, allIncidents }: { incident: Incident; allIncidents: Incident[] }) {
  const similar = useMemo(() => {
    const locKey = incident.location.split(',')[0].trim().toLowerCase();
    return allIncidents.filter(
      inc =>
        inc.id !== incident.id &&
        (inc.location.toLowerCase().includes(locKey) ||
          (incident.clientId && inc.clientId === incident.clientId))
    );
  }, [incident, allIncidents]);

  const category = incident.aiMetadata?.category ?? (
    incident.title.toLowerCase().includes('ac') || incident.title.toLowerCase().includes('hvac') ? 'HVAC' :
    incident.title.toLowerCase().includes('water') || incident.title.toLowerCase().includes('leak') ? 'Plumbing' :
    incident.title.toLowerCase().includes('power') || incident.title.toLowerCase().includes('lift') ? 'Electrical' : 'General'
  );

  const sameCategory = similar.filter(inc => {
    const t = (inc.aiMetadata?.category ?? inc.title).toLowerCase();
    return t.includes(category.toLowerCase());
  });

  if (similar.length === 0) return null;

  return (
    <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5">
      <div className="flex items-center gap-1.5 mb-2">
        <Activity size={12} className="text-amber-400" />
        <span className="text-[11px] font-bold text-amber-400">Pattern Detected</span>
      </div>
      {sameCategory.length > 0 ? (
        <p className="text-[11px] text-[#EEF3FA] leading-relaxed">
          <span className="font-semibold">{sameCategory.length + 1} {category} incidents</span> at this site in the past 30 days. Recurring fault profile — consider preventative audit.
        </p>
      ) : (
        <p className="text-[11px] text-[#EEF3FA] leading-relaxed">
          <span className="font-semibold">{similar.length} other incident{similar.length !== 1 ? 's' : ''}</span> logged at this location or client recently.
        </p>
      )}
      <div className="mt-2 space-y-1">
        {similar.slice(0, 3).map(inc => (
          <div key={inc.id} className="flex items-center gap-2 text-[10px] text-[#7A94B4]">
            <div className="w-1 h-1 rounded-full bg-amber-500 flex-shrink-0" />
            <span>{inc.id} — {inc.title} · {inc.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function OverviewTab({ incident, event }: { incident: Incident | null; event: PulseEvent }) {
  if (!incident) {
    return (
      <div className="space-y-4">
        <div className="p-3 bg-[#0A1628] rounded-xl space-y-2">
          <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide">Event Type</div>
          <div className="text-[13px] text-[#EEF3FA] font-semibold capitalize">{event.type}</div>
        </div>
        <div className="p-3 bg-[#0A1628] rounded-xl space-y-2">
          <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide">Description</div>
          <div className="text-[12px] text-[#EEF3FA] leading-relaxed">{event.sub}</div>
        </div>
        {event.location && (
          <div className="flex items-center gap-2 p-3 bg-[#0A1628] rounded-xl">
            <MapPin size={12} className="text-[#2E7FFF]" />
            <span className="text-[12px] text-[#EEF3FA]">{event.location}</span>
          </div>
        )}
        {event.severity && (
          <div className="flex items-center gap-2 p-3 bg-[#0A1628] rounded-xl">
            <AlertTriangle size={12} className="text-amber-400" />
            <span className="text-[10px] text-[#7A94B4]">Severity:</span>
            <span className="text-[12px] text-[#EEF3FA] capitalize font-semibold">{event.severity}</span>
          </div>
        )}
      </div>
    );
  }

  const st = STATUS_CONFIG[incident.status] || STATUS_CONFIG['open'];
  const sla = slaStatus(incident.elapsed, incident.slaMinutes);

  return (
    <div className="space-y-4">
      <p className="text-[12px] text-[#7A94B4] leading-relaxed">{incident.description}</p>

      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Incident ID',    value: incident.id },
          { label: 'Type',           value: incident.source },
          { label: 'Severity',       value: incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1) },
          { label: 'SLA Window',     value: `${incident.slaMinutes} min` },
          { label: 'Elapsed',        value: `${incident.elapsed} min` },
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
              <div className="text-[10px] text-blue-400">
                {incident.status === 'closed' ? 'Closed by technician' : 'En route · GPS tracking active'}
              </div>
            </div>
          </div>
        </div>
      )}

      {incident.notifiedRoles && incident.notifiedRoles.length > 0 && (
        <div>
          <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-1.5">Notification Status</div>
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
    </div>
  );
}

function AITab({ incident, allIncidents, event }: { incident: Incident | null; allIncidents: Incident[]; event: PulseEvent }) {
  if (!incident) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
        <Bot size={28} className="text-[#7A94B4] opacity-40" />
        <div className="text-[12px] text-[#7A94B4] opacity-60">No incident record — {event.type} event</div>
        <div className="text-[11px] text-[#7A94B4] opacity-40">AI analysis is linked to incident records only</div>
      </div>
    );
  }

  const signals = AI_SIGNALS[incident.id];
  const hasAI = incident.source.includes('AI Capture') || incident.source.includes('IoT') || incident.source === 'QR Scan';
  const aiMeta = incident.aiMetadata;

  if (!hasAI && !signals && !aiMeta) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
        <AlertTriangle size={28} className="text-[#7A94B4] opacity-40" />
        <div className="text-[12px] text-[#7A94B4] opacity-60">No AI analysis — manually reported incident</div>
        <div className="text-[11px] text-[#7A94B4] opacity-40">AI analysis is available for AI Capture or IoT incidents</div>
      </div>
    );
  }

  const confidence = aiMeta?.confidence ?? (
    incident.severity === 'critical' ? 94 :
    incident.severity === 'high' ? 88 :
    incident.severity === 'medium' ? 81 : 67
  );

  const category = aiMeta?.category ?? (
    incident.title.toLowerCase().includes('ac') || incident.title.toLowerCase().includes('hvac') ? 'HVAC / Cooling' :
    incident.title.toLowerCase().includes('lift') ? 'Mechanical / Lift' :
    incident.title.toLowerCase().includes('water') || incident.title.toLowerCase().includes('pool') ? 'Plumbing' :
    incident.title.toLowerCase().includes('power') ? 'Electrical' : 'General Facility'
  );

  return (
    <div className="space-y-4">
      <div className="p-3 bg-[rgba(46,127,255,0.08)] border border-[rgba(46,127,255,0.2)] rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Zap size={13} className="text-cyan-400" />
            <span className="text-[11px] text-cyan-400 font-bold">4C360 AI Classification</span>
          </div>
          <span className="text-[11px] font-bold text-emerald-400">{confidence}% conf.</span>
        </div>
        <div className="text-[14px] text-[#EEF3FA] font-semibold">{category}</div>
        {aiMeta?.issueType && <div className="text-[10px] text-[#7A94B4] mt-0.5">{aiMeta.issueType}</div>}
        <div className="text-[10px] text-[#7A94B4] mt-0.5">Classified via {incident.source}</div>
      </div>

      <div>
        <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-1.5">Confidence Score</div>
        <AnimatedBar value={confidence} color={confidence >= 85 ? '#38D98A' : confidence >= 70 ? '#FF9B38' : '#FF4B4B'} height="h-2.5" />
        <div className="text-[9px] text-[#7A94B4] mt-1">{confidence}% — {confidence >= 85 ? 'High confidence' : 'Medium confidence'}</div>
      </div>

      {(aiMeta?.identifiedAsset || aiMeta?.recommendedAction) && (
        <div className="grid grid-cols-1 gap-2">
          {aiMeta.identifiedAsset && (
            <div className="bg-[#0A1628] rounded-lg p-2.5">
              <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-0.5">Identified Asset</div>
              <div className="text-[11px] text-[#EEF3FA] font-semibold">{aiMeta.identifiedAsset}</div>
            </div>
          )}
          {aiMeta?.recommendedAction && (
            <div className="bg-[#0A1628] rounded-lg p-2.5">
              <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-0.5">Recommended Action</div>
              <div className="text-[11px] text-[#EEF3FA]">{aiMeta.recommendedAction}</div>
            </div>
          )}
        </div>
      )}

      {aiMeta?.observations && aiMeta.observations.length > 0 && (
        <div>
          <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-2">AI Observations</div>
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
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${sig.match}%` }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                      className="h-full rounded-full bg-emerald-400"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <PatternBlock incident={incident} allIncidents={allIncidents} />
    </div>
  );
}

function EvidenceTab({ incident, event }: { incident: Incident | null; event: PulseEvent }) {
  const hasDedicatedBefore = !!incident?.beforePhotoUrl;
  const photoUrl = incident?.beforePhotoUrl || incident?.imageUrl || null;
  const beforeIsCaptureFallback = !hasDedicatedBefore && !!incident?.imageUrl;
  const afterUrl = incident?.afterPhotoUrl;

  if (!photoUrl && !afterUrl) {
    return (
      <div className="space-y-4">
        <div className="text-[11px] text-[#7A94B4] leading-relaxed">
          {incident
            ? 'No photo evidence has been captured for this incident yet.'
            : `No evidence attached to this ${event.type} event.`}
        </div>
        <div className="rounded-xl border-2 border-dashed border-[rgba(46,127,255,0.2)] flex flex-col items-center justify-center py-12 gap-3 text-center">
          <Camera size={28} className="text-[#7A94B4] opacity-30" />
          <div className="text-[11px] text-[#7A94B4] opacity-50">Before Photo</div>
          <div className="text-[10px] text-[#7A94B4] opacity-30">AI-captured evidence will appear here</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide">Photo Evidence</div>

      {photoUrl && (
        <div>
          <div className="text-[9px] text-[#7A94B4] mb-1.5 uppercase tracking-wide">
            {beforeIsCaptureFallback ? 'Before — Incident Capture' : 'Before — AI Captured'}
          </div>
          <div className="relative rounded-xl overflow-hidden border border-red-500/30">
            <img src={photoUrl} alt="Before" className="w-full object-cover max-h-52" />
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
      )}

      {!photoUrl && (
        <div className="rounded-xl border-2 border-dashed border-[rgba(46,127,255,0.2)] flex flex-col items-center justify-center py-10 gap-2 text-center">
          <Camera size={22} className="text-[#7A94B4] opacity-30" />
          <div className="text-[10px] text-[#7A94B4] opacity-50">Before photo pending</div>
        </div>
      )}

      {afterUrl ? (
        <div>
          <div className="text-[9px] text-[#7A94B4] mb-1.5 uppercase tracking-wide">After — Resolved</div>
          <div className="rounded-xl overflow-hidden border border-emerald-500/30">
            <img src={afterUrl} alt="After" className="w-full object-cover max-h-52" />
          </div>
        </div>
      ) : incident && (incident.status === 'resolved' || incident.status === 'closed') ? (
        <div className="rounded-xl border-2 border-red-500/50 bg-red-500/10 flex flex-col items-center justify-center py-8 gap-2 text-center">
          <AlertTriangle size={22} className="text-red-400" />
          <div className="text-[11px] text-red-400 font-semibold">After photo required</div>
          <div className="text-[10px] text-red-400/70">Resolution evidence is incomplete — after photo missing</div>
        </div>
      ) : null}

      {incident?.source && (
        <div className="text-[10px] text-[#7A94B4]">
          Captured via <span className="text-[#EEF3FA]">{incident.source}</span>
        </div>
      )}
    </div>
  );
}

function TrendsTab({ incident, allIncidents, event }: { incident: Incident | null; allIncidents: Incident[]; event: PulseEvent }) {
  const { sparkData, trend } = useMemo(() => {
    if (!incident) return { sparkData: [], trend: 'stable' as const };

    const locKey = incident.location.split(',')[0].trim().toLowerCase();
    const related = allIncidents.filter(
      inc => inc.location.toLowerCase().includes(locKey) || inc.clientId === incident.clientId
    );

    const byDay: number[] = Array(30).fill(0);
    related.forEach((inc, i) => {
      const seed = inc.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), i * 17);
      const dayIndex = seed % 30;
      byDay[dayIndex] += 1;
    });
    if (related.length > 0 && byDay[byDay.length - 1] === 0) {
      byDay[byDay.length - 1] = 1;
    }

    const recentHalf = byDay.slice(15).reduce((a, b) => a + b, 0);
    const olderHalf = byDay.slice(0, 15).reduce((a, b) => a + b, 0);
    const trend = recentHalf > olderHalf + 1 ? 'worsening' : recentHalf < olderHalf - 1 ? 'improving' : 'stable';

    return { sparkData: byDay, trend };
  }, [incident, allIncidents]);

  if (!incident) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
        <Activity size={28} className="text-[#7A94B4] opacity-40" />
        <div className="text-[12px] text-[#7A94B4] opacity-60">Trends not available for {event.type} events</div>
      </div>
    );
  }

  const trendColor = trend === 'worsening' ? '#FF4B4B' : trend === 'improving' ? '#38D98A' : '#FF9B38';
  const TrendIcon = trend === 'worsening' ? TrendingUp : trend === 'improving' ? TrendingDown : Minus;
  const trendLabel = trend === 'worsening' ? 'Worsening' : trend === 'improving' ? 'Improving' : 'Stable';

  const locKey = incident.location.split(',')[0].trim().toLowerCase();
  const related = allIncidents.filter(
    inc => inc.location.toLowerCase().includes(locKey) || inc.clientId === incident.clientId
  );

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-3">
          Incident Frequency — Last 30 Days
          <span className="ml-1 text-[#EEF3FA] normal-case">(this location/client)</span>
        </div>
        <SparkBar values={sparkData} color="#2E7FFF" />
        <div className="flex justify-between mt-1 text-[9px] text-[#7A94B4]">
          <span>30 days ago</span>
          <span>Today</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#0A1628] rounded-xl p-3">
          <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1">Total Incidents (30d)</div>
          <div className="text-[20px] font-bold text-[#EEF3FA]">{related.length}</div>
          <div className="text-[10px] text-[#7A94B4]">at this location/client</div>
        </div>
        <div className="bg-[#0A1628] rounded-xl p-3">
          <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1">Severity Trend</div>
          <div className="flex items-center gap-1.5 mt-1">
            <TrendIcon size={16} style={{ color: trendColor }} />
            <span className="text-[13px] font-bold" style={{ color: trendColor }}>{trendLabel}</span>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div>
          <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-2">Related Incidents</div>
          <div className="space-y-1.5">
            {related.slice(0, 5).map(inc => (
              <div key={inc.id} className="flex items-center justify-between p-2 bg-[#0A1628] rounded-lg">
                <div>
                  <div className="text-[10px] text-[#EEF3FA] font-medium">{inc.id} — {inc.title}</div>
                  <div className="text-[9px] text-[#7A94B4]">{inc.location}</div>
                </div>
                <span className="text-[9px] capitalize px-1.5 py-0.5 rounded" style={{
                  backgroundColor: `${deriveSeverityColor(inc.severity)}20`,
                  color: deriveSeverityColor(inc.severity),
                }}>
                  {inc.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TimelineTab({ incident, event }: { incident: Incident | null; event: PulseEvent }) {
  if (!incident || incident.activityLog.length === 0) {
    return (
      <div className="space-y-3">
        <div className="relative pl-5">
          <div className="absolute left-2 top-0 bottom-0 w-px bg-[rgba(46,127,255,0.2)]" />
          <div className="relative mb-4">
            <div className="absolute -left-5 top-1 w-5 h-5 rounded-full flex items-center justify-center border text-blue-400 border-blue-500/40 bg-blue-500/10">
              <Clock size={10} />
            </div>
            <div className="ml-3">
              <div className="text-[9px] text-[#7A94B4] font-mono mb-0.5">{event.time}</div>
              <div className="text-[11px] text-[#EEF3FA]">{event.title}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-[11px] text-[#7A94B4]">Activity log for {incident.id}</div>
      <div className="relative pl-5">
        <div className="absolute left-2 top-0 bottom-0 w-px bg-[rgba(46,127,255,0.2)]" />
        {incident.activityLog.map((entry, i) => {
          const color = LOG_COLOR[entry.type] || LOG_COLOR['update'];
          const icon = LOG_ICON[entry.type] || <Clock size={10} />;
          return (
            <div key={i} className="relative mb-4 last:mb-0">
              <div className={`absolute -left-5 top-1 w-5 h-5 rounded-full flex items-center justify-center border ${color}`}>
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

function ActionsTab({ incident, event, onToast, onClose }: { incident: Incident | null; event: PulseEvent; onToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void; onClose: () => void }) {
  const canAcknowledge = !incident || !['closed', 'resolved'].includes(incident.status);
  const canWorkOrder = incident && !incident.workOrderId && !['assigned', 'closed', 'resolved'].includes(incident.status);
  const canEditWorkOrder = incident && (!!incident.workOrderId || incident.status === 'assigned') && !['closed', 'resolved'].includes(incident.status);
  const canResolve = incident && ['dispatched', 'in-progress', 'assigned'].includes(incident.status);

  return (
    <div className="space-y-3">
      <div className="text-[11px] text-[#7A94B4] leading-relaxed">
        {incident
          ? `Actions available for ${incident.id} based on current status: ${incident.status}.`
          : `Quick actions for this ${event.type} event.`}
      </div>

      {canAcknowledge && (
        <button
          onClick={() => { onToast('Event acknowledged', 'success'); onClose(); }}
          className="w-full flex items-center justify-between p-3 bg-[#0A1628] hover:bg-[#112040] border border-[rgba(46,127,255,0.2)] rounded-xl transition-colors group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle size={14} className="text-emerald-400" />
            </div>
            <div className="text-left">
              <div className="text-[12px] text-[#EEF3FA] font-semibold">Acknowledge</div>
              <div className="text-[10px] text-[#7A94B4]">Mark as seen and acknowledged</div>
            </div>
          </div>
          <ArrowRight size={12} className="text-[#7A94B4] opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      )}

      {canWorkOrder && (
        <button
          onClick={() => { onToast('Opening work order creation…', 'info'); }}
          className="w-full flex items-center justify-between p-3 bg-[#0A1628] hover:bg-[#112040] border border-[rgba(46,127,255,0.2)] rounded-xl transition-colors group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Briefcase size={14} className="text-blue-400" />
            </div>
            <div className="text-left">
              <div className="text-[12px] text-[#EEF3FA] font-semibold">Create Work Order</div>
              <div className="text-[10px] text-[#7A94B4]">Generate work order for {incident?.id}</div>
            </div>
          </div>
          <ArrowRight size={12} className="text-[#7A94B4] opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      )}

      {canEditWorkOrder && (
        <button
          onClick={() => { onToast('Opening work order editor…', 'info'); }}
          className="w-full flex items-center justify-between p-3 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/30 rounded-xl transition-colors group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <Briefcase size={14} className="text-amber-400" />
            </div>
            <div className="text-left">
              <div className="text-[12px] text-amber-300 font-semibold">Edit Work Order</div>
              <div className="text-[10px] text-amber-400/60">Modify existing work order for {incident?.id}</div>
            </div>
          </div>
          <ArrowRight size={12} className="text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      )}

      {canResolve && (
        <button
          onClick={() => { onToast('Opening resolution flow…', 'info'); }}
          className="w-full flex items-center justify-between p-3 bg-[#0A1628] hover:bg-[#112040] border border-[rgba(46,127,255,0.2)] rounded-xl transition-colors group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <ShieldCheck size={14} className="text-amber-400" />
            </div>
            <div className="text-left">
              <div className="text-[12px] text-[#EEF3FA] font-semibold">Resolve Incident</div>
              <div className="text-[10px] text-[#7A94B4]">Submit resolution with evidence</div>
            </div>
          </div>
          <ArrowRight size={12} className="text-[#7A94B4] opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      )}

      {incident?.status === 'closed' && (
        <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-center">
          <CheckCircle size={20} className="text-emerald-400 mx-auto mb-2" />
          <div className="text-[12px] text-emerald-400 font-semibold">Incident Closed</div>
          <div className="text-[10px] text-[#7A94B4] mt-0.5">No further actions required</div>
        </div>
      )}

      {!canAcknowledge && !canWorkOrder && !canEditWorkOrder && !canResolve && incident?.status !== 'closed' && (
        <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
          <div className="text-[11px] text-[#7A94B4] opacity-60">No actions available for current status</div>
        </div>
      )}
    </div>
  );
}

export function IncidentFullDetailPanel({ event, onClose, onToast }: Props) {
  const [activeTab, setActiveTab] = useState<TabName>('Overview');
  const { incidents } = useIncidents();

  const incident = useMemo<Incident | null>(() => {
    const byId = incidents.find(inc => inc.id === event.id);
    if (byId) return byId;

    const incIdMatch = (event.sub + ' ' + event.title).match(/INC-[A-Z]+-\d+/);
    if (incIdMatch) {
      const bySub = incidents.find(inc => inc.id === incIdMatch[0]);
      if (bySub) return bySub;
    }

    const titleKey = event.title
      .replace(/\s*—.*$/, '')
      .replace(/\s+(reported|detected|found|alert|failure|imminent|auto-dispatched)\b.*/i, '')
      .trim()
      .toLowerCase();

    return (
      incidents.find(inc => inc.title.toLowerCase() === titleKey) ??
      incidents.find(inc => titleKey.includes(inc.title.toLowerCase())) ??
      incidents.find(inc => inc.title.toLowerCase().includes(titleKey)) ??
      null
    );
  }, [incidents, event]);

  const visibleTabs = useMemo<TabName[]>(() => {
    if (!incident) {
      return ['Overview', 'Timeline', 'Actions'];
    }
    return [...TABS];
  }, [incident]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[500]" onClick={onClose} />
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        className="fixed right-0 top-0 bottom-0 z-[600] w-[520px] max-w-[95vw] bg-[#0D1F3C] border-l border-[rgba(46,127,255,0.3)] shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(46,127,255,0.15)] flex-shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <div className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${
                event.type === 'incident' ? 'bg-red-500/20 text-red-400' :
                event.type === 'sla'      ? 'bg-amber-500/20 text-amber-400' :
                event.type === 'ai'       ? 'bg-cyan-500/20 text-cyan-400' :
                'bg-emerald-500/20 text-emerald-400'
              }`}>
                {event.type}
              </div>
              {incident && (
                <span className="text-[10px] text-[#7A94B4] font-mono">{incident.id}</span>
              )}
            </div>
            <h2 className="text-[14px] text-[#EEF3FA] font-bold truncate leading-tight">{event.title}</h2>
            <p className="text-[11px] text-[#7A94B4] truncate mt-0.5">{event.sub}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[#7A94B4] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex gap-0 border-b border-[rgba(46,127,255,0.15)] flex-shrink-0 overflow-x-auto custom-scrollbar">
          {visibleTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2.5 text-[10px] font-semibold whitespace-nowrap transition-colors relative flex-shrink-0 ${
                activeTab === tab
                  ? 'text-[#2E7FFF]'
                  : 'text-[#7A94B4] hover:text-[#EEF3FA]'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div
                  layoutId="fullDetailTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2E7FFF] rounded-full"
                />
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'Overview' && <OverviewTab incident={incident} event={event} />}
              {activeTab === 'AI Analysis & Patterns' && <AITab incident={incident} allIncidents={incidents} event={event} />}
              {activeTab === 'Evidence (Photos)' && <EvidenceTab incident={incident} event={event} />}
              {activeTab === 'Trends' && <TrendsTab incident={incident} allIncidents={incidents} event={event} />}
              {activeTab === 'Timeline' && <TimelineTab incident={incident} event={event} />}
              {activeTab === 'Actions' && <ActionsTab incident={incident} event={event} onToast={onToast} onClose={onClose} />}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="px-5 py-3 border-t border-[rgba(46,127,255,0.15)] flex-shrink-0">
          <div className="flex items-center gap-1.5 text-[10px] text-[#7A94B4]">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live data · Updated just now · {event.time}
            {incident && (
              <span className="ml-auto font-mono text-[#2E7FFF]">{incident.id}</span>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
