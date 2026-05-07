import { useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react';
import {
  Activity,
  AlertTriangle,
  BellRing,
  Bot,
  Briefcase,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  FileCheck2,
  FileText,
  Home,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Plus,
  QrCode,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Upload,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import {
  aiCommunityInsights,
  amenities,
  amenityBookings,
  bulkUploadSummary,
  communities,
  getAmenity,
  getCommunity,
  getResident,
  getUnit,
  handovers,
  insights,
  kpis,
  lifecycleStages,
  notices,
  operationsPulse,
  payments,
  residentDocuments,
  residentRequests,
  residents,
  warrantyClaims,
  type Amenity,
  type AmenityBooking,
  type DocumentStatus,
  type HandoverRecord,
  type Insight,
  type Notice,
  type PaymentStatus,
  type RequestStatus,
  type Resident,
  type ResidentDocument,
  type ResidentRequest,
  type ResidentStatus,
  type RiskLevel,
} from './data';
import { useIncidents, type CreateWorkOrderInput, type Incident } from '@/context/IncidentContext';

type Tab =
  | 'overview'
  | 'residents'
  | 'communities'
  | 'requests'
  | 'incidents'
  | 'amenities'
  | 'notices'
  | 'payments'
  | 'documents'
  | 'handover'
  | 'ai'
  | 'settings';

interface Props {
  onToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

const tabs: Array<{ id: Tab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'residents', label: 'Residents' },
  { id: 'communities', label: 'Communities' },
  { id: 'requests', label: 'Requests' },
  { id: 'incidents', label: 'Incidents' },
  { id: 'amenities', label: 'Amenities' },
  { id: 'notices', label: 'Notices' },
  { id: 'payments', label: 'Payments' },
  { id: 'documents', label: 'Documents' },
  { id: 'handover', label: 'Handover & Warranty' },
  { id: 'ai', label: 'AI Insights' },
  { id: 'settings', label: 'Settings' },
];

const requestStatusClass: Record<RequestStatus, string> = {
  Submitted: 'border-sky-400/30 bg-sky-400/10 text-sky-300',
  Reviewed: 'border-blue-400/30 bg-blue-400/10 text-blue-300',
  Assigned: 'border-violet-400/30 bg-violet-400/10 text-violet-200',
  'In Progress': 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  Resolved: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  'Resident Confirmed': 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300',
  Closed: 'border-slate-400/30 bg-slate-400/10 text-slate-300',
  Reopened: 'border-red-400/30 bg-red-400/10 text-red-300',
};

const residentStatusClass: Record<ResidentStatus, string> = {
  Invited: 'border-sky-400/30 bg-sky-400/10 text-sky-300',
  'Pending Verification': 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  Active: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  Suspended: 'border-red-400/30 bg-red-400/10 text-red-300',
  'Moved Out': 'border-slate-400/30 bg-slate-400/10 text-slate-300',
};

const paymentStatusClass: Record<PaymentStatus, string> = {
  Paid: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  Pending: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  Overdue: 'border-red-400/30 bg-red-400/10 text-red-300',
  Failed: 'border-red-400/30 bg-red-400/10 text-red-300',
  Disputed: 'border-violet-400/30 bg-violet-400/10 text-violet-200',
};

const documentStatusClass: Record<DocumentStatus, string> = {
  Current: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  'Expiring Soon': 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  Expired: 'border-red-400/30 bg-red-400/10 text-red-300',
  Draft: 'border-slate-400/30 bg-slate-400/10 text-slate-300',
  'Signature Required': 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300',
  Missing: 'border-red-400/30 bg-red-400/10 text-red-300',
};

const riskClass: Record<RiskLevel, string> = {
  Low: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  Medium: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  High: 'border-red-400/30 bg-red-400/10 text-red-300',
};

type ResidenceScope = 'all' | string;

const closedRequestStatuses: RequestStatus[] = ['Resolved', 'Resident Confirmed', 'Closed'];

function matchesResidence(residenceId: ResidenceScope, communityId?: string | null) {
  return residenceId === 'all' || communityId === residenceId;
}

function getResidenceLabel(residenceId: ResidenceScope) {
  return residenceId === 'all' ? 'All residences' : getCommunity(residenceId)?.name ?? 'Selected residence';
}

function isRequestOpen(request: ResidentRequest) {
  return !closedRequestStatuses.includes(request.status);
}

function noticeMatchesResidence(notice: Notice, residenceId: ResidenceScope) {
  if (residenceId === 'all') return true;
  const community = getCommunity(residenceId);
  const text = `${notice.title} ${notice.message} ${notice.audience}`.toLowerCase();
  if (!community) return false;
  if (text.includes('all residents') || text.includes(community.name.toLowerCase())) return true;
  if (community.id === 'jumeirah-heights' && (text.includes('tower b') || text.includes('tower a') || text.includes('ac'))) return true;
  if (community.id === 'bayz-102' && (text.includes('bayz') || text.includes('service charge') || text.includes('41 units'))) return true;
  if (community.id === 'marina-residences' && text.includes('marina')) return true;
  return false;
}

function insightMatchesResidence(insight: Insight, residenceId: ResidenceScope) {
  if (residenceId === 'all') return true;
  const community = getCommunity(residenceId);
  const text = `${insight.title} ${insight.affected} ${insight.reason} ${insight.recommendedAction}`.toLowerCase();
  if (!community) return false;
  if (text.includes(community.name.toLowerCase())) return true;
  if (community.id === 'jumeirah-heights' && (text.includes('tower b') || text.includes('hvac') || text.includes('pool') || text.includes('gym'))) return true;
  if (community.id === 'bayz-102' && (text.includes('bayz') || text.includes('collections') || text.includes('handover') || text.includes('warranty'))) return true;
  if (community.id === 'marina-residences' && (text.includes('engagement') || text.includes('event'))) return true;
  return false;
}

function getScopedLifecycleStages(residenceId: ResidenceScope) {
  if (residenceId === 'all') return lifecycleStages;
  const community = getCommunity(residenceId);
  if (!community) return lifecycleStages;
  return lifecycleStages.map(stage => ({
    ...stage,
    count: Math.max(1, Math.round((community.residents * stage.conversion) / 100)),
  }));
}

function getScopedOperationsPulse(residenceId: ResidenceScope) {
  if (residenceId === 'all') return operationsPulse;
  const community = getCommunity(residenceId);
  if (!community) return operationsPulse;
  const scoped = operationsPulse.filter(item => {
    const text = item.toLowerCase();
    return (
      text.includes(community.name.toLowerCase()) ||
      (community.id === 'jumeirah-heights' && (text.includes('tower b') || text.includes('ac') || text.includes('pool'))) ||
      (community.id === 'bayz-102' && (text.includes('bayz') || text.includes('warranty') || text.includes('payment'))) ||
      (community.id === 'marina-residences' && text.includes('booking'))
    );
  });
  return scoped.length > 0 ? scoped : [`${community.name} has no urgent resident operations alerts right now`];
}

function getScopedAiCommunityInsights(residenceId: ResidenceScope) {
  if (residenceId === 'all') return aiCommunityInsights;
  const community = getCommunity(residenceId);
  if (!community) return aiCommunityInsights;
  const scoped = aiCommunityInsights.filter(item => {
    const text = item.toLowerCase();
    return (
      text.includes(community.name.toLowerCase()) ||
      (community.id === 'jumeirah-heights' && (text.includes('tower b') || text.includes('hvac') || text.includes('gym'))) ||
      (community.id === 'bayz-102' && (text.includes('payment') || text.includes('risk'))) ||
      (community.id === 'marina-residences' && text.includes('booking'))
    );
  });
  return scoped.length > 0 ? scoped : [`${community.name} is stable; AI recommends routine engagement checks this week`];
}

function getScopedKpis(residenceId: ResidenceScope): typeof kpis {
  if (residenceId === 'all') return kpis;
  const community = getCommunity(residenceId);
  if (!community) return kpis;

  const scopedResidents = residents.filter(resident => matchesResidence(residenceId, resident.communityId));
  const scopedRequests = residentRequests.filter(request => matchesResidence(residenceId, request.communityId));
  const scopedBookingsToday = amenityBookings.filter(booking => matchesResidence(residenceId, getUnit(booking.unitId)?.communityId) && booking.dateTime.toLowerCase().startsWith('today')).length;
  const scopedNotices = notices.filter(notice => noticeMatchesResidence(notice, residenceId));
  const openRequests = community.openRequests;
  const overdueFactor = community.risk === 'High' ? 0.24 : community.risk === 'Medium' ? 0.13 : 0.06;
  const atRiskFactor = community.risk === 'High' ? 0.036 : community.risk === 'Medium' ? 0.018 : 0.008;
  const overdueRequests = Math.max(
    scopedRequests.filter(request => isRequestOpen(request) && (request.priority === 'Critical' || request.sla.toLowerCase().includes('overdue'))).length,
    Math.round(openRequests * overdueFactor),
  );
  const atRiskResidents = Math.max(scopedResidents.filter(resident => resident.risk === 'High').length, Math.round(community.residents * atRiskFactor));
  const readRate = scopedNotices.length > 0
    ? Math.round(scopedNotices.reduce((total, notice) => total + notice.readRate, 0) / scopedNotices.length)
    : Math.max(65, community.satisfaction - 6);

  return [
    { label: 'Total Residents', value: community.residents.toLocaleString(), delta: `${scopedResidents.length} records` },
    { label: 'Active Units', value: community.units.toLocaleString(), delta: `${community.towers} towers` },
    { label: 'Open Requests', value: openRequests.toString(), delta: `${scopedRequests.filter(isRequestOpen).length} active` },
    { label: 'Overdue Requests', value: overdueRequests.toString(), delta: community.risk === 'High' ? 'SLA risk' : 'Scoped' },
    { label: 'Pending Payments', value: community.pendingPayments, delta: community.risk === 'High' ? 'Needs action' : 'Scoped' },
    { label: 'Amenity Bookings Today', value: Math.max(scopedBookingsToday, Math.round(community.residents * 0.045)).toString(), delta: 'Today' },
    { label: 'Notices Read Rate', value: `${readRate}%`, delta: 'Scoped' },
    { label: 'Satisfaction Score', value: `${community.satisfaction}%`, delta: community.risk === 'High' ? 'Watch' : '+local' },
    { label: 'At-Risk Residents', value: atRiskResidents.toString(), delta: community.risk === 'High' ? 'Needs care' : 'Monitor' },
  ];
}

function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black ${className ?? 'border-[rgba(46,127,255,0.2)] bg-white/5 text-[#B8C7DB]'}`}>
      {children}
    </span>
  );
}

function SectionCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-5 ${className}`}>{children}</section>;
}

function SectionTitle({ title, subtitle, icon: Icon }: { title: string; subtitle?: string; icon?: ComponentType<{ size?: number; className?: string }> }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          {Icon && <Icon size={18} className="text-cyan-300" />}
          <h3 className="text-lg font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{title}</h3>
        </div>
        {subtitle && <p className="mt-1 text-[12px] leading-5 text-[#8FA6C3]">{subtitle}</p>}
      </div>
    </div>
  );
}

function KpiCard({ label, value, delta, icon: Icon }: { label: string; value: string; delta: string; icon: ComponentType<{ size?: number; className?: string }> }) {
  return (
    <div className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg border border-[#E11D2E]/30 bg-[#E11D2E]/12 text-red-200">
          <Icon size={17} />
        </span>
        <span className="text-[10px] font-black text-cyan-300">{delta}</span>
      </div>
      <p className="mt-4 text-2xl font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{value}</p>
      <p className="mt-1 text-[12px] text-[#7A94B4]">{label}</p>
    </div>
  );
}

function ActionButton({
  label,
  icon: Icon,
  onClick,
  danger = false,
}: {
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={event => {
        event.stopPropagation();
        onClick();
      }}
      title={label}
      aria-label={label}
      className={`group relative grid h-8 w-8 place-items-center rounded-lg transition-colors ${
        danger ? 'text-red-300 hover:bg-red-400/10' : 'text-[#7A94B4] hover:bg-white/5 hover:text-cyan-300'
      }`}
    >
      <Icon size={15} />
      <span className="pointer-events-none absolute right-0 top-9 z-30 hidden whitespace-nowrap rounded-lg border border-[rgba(46,127,255,0.2)] bg-[#07111F] px-2 py-1 text-[10px] font-bold text-[#EEF3FA] shadow-xl group-hover:block">
        {label}
      </span>
    </button>
  );
}

function PrimaryButton({ children, onClick, icon: Icon }: { children: ReactNode; onClick: () => void; icon?: ComponentType<{ size?: number; className?: string }> }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#E11D2E] px-4 text-[12px] font-black text-white shadow-lg shadow-red-950/25">
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}

function SecondaryButton({ children, onClick, icon: Icon }: { children: ReactNode; onClick: () => void; icon?: ComponentType<{ size?: number; className?: string }> }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex h-10 items-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-4 text-[12px] font-black text-cyan-300">
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}

function DrawerShell({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/55 backdrop-blur-sm">
      <button type="button" aria-label="Dismiss overlay" className="absolute inset-0 cursor-default" onClick={onClose} />
      <aside className="custom-scrollbar relative z-10 h-full w-full max-w-[820px] overflow-y-auto border-l border-[rgba(46,127,255,0.22)] bg-[#07111F] shadow-2xl shadow-black/60">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[rgba(46,127,255,0.14)] bg-[#07111F]/95 px-6 py-5 backdrop-blur">
          <div>
            <h2 className="text-2xl font-black leading-7 text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{title}</h2>
            {subtitle && <p className="mt-2 text-[13px] leading-5 text-[#8FA6C3]">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close drawer" className="rounded-lg p-2 text-[#7A94B4] transition-colors hover:bg-white/5 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </aside>
    </div>
  );
}

function ModalShell({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-hidden bg-black/60 px-2 pb-4 pt-16 backdrop-blur-sm sm:px-4 sm:pt-20">
      <button type="button" aria-label="Dismiss modal" className="absolute inset-0 cursor-default" onClick={onClose} />
      <section className="relative z-10 flex max-h-[calc(100dvh-5rem)] w-full max-w-[860px] flex-col overflow-hidden rounded-2xl border border-[rgba(46,127,255,0.22)] bg-[#07111F] shadow-2xl shadow-black/60 sm:max-h-[calc(100dvh-6rem)]">
        <div className="flex flex-shrink-0 items-start justify-between gap-4 border-b border-[rgba(46,127,255,0.14)] bg-[#07111F] p-5">
          <div>
            <h2 className="text-2xl font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{title}</h2>
            {subtitle && <p className="mt-2 text-[13px] leading-5 text-[#8FA6C3]">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close modal" className="rounded-lg p-2 text-[#7A94B4] hover:bg-white/5 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-5">
          {children}
        </div>
      </section>
    </div>
  );
}

function DetailCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#0A1628] p-4">
      <p className="text-[11px] text-[#7A94B4]">{label}</p>
      <div className="mt-2 text-[14px] font-bold leading-5 text-[#EEF3FA]">{value}</div>
    </div>
  );
}

function TableShell({ columns, children, minWidth = '1180px' }: { columns: string[]; children: ReactNode; minWidth?: string }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)]">
      <table className="w-full text-left" style={{ minWidth }}>
        <thead className="bg-[#0A1628]/85">
          <tr className="text-[11px] font-black text-[#5A6E88]">
            {columns.map(column => (
              <th key={column} className={`px-4 py-4 ${column === 'Actions' ? 'text-right' : ''}`}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function AiPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-violet-300/22 bg-violet-300/10 p-5">
      <div className="flex items-center gap-2 text-[13px] font-black text-violet-200">
        <Sparkles size={16} />
        {title}
      </div>
      <div className="mt-4 text-[13px] leading-6 text-[#E5D9FF]">{children}</div>
    </section>
  );
}

function ResidentLifecycleFunnel({ residenceId = 'all' }: { residenceId?: ResidenceScope }) {
  const scopedLifecycleStages = getScopedLifecycleStages(residenceId);
  return (
    <SectionCard>
      <SectionTitle title="Resident Lifecycle Funnel" subtitle={`Invite to handover completion ${residenceId === 'all' ? 'across active communities' : `for ${getResidenceLabel(residenceId)}`}.`} icon={Users} />
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {scopedLifecycleStages.map(stage => (
          <div key={stage.stage} className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#0A1628] p-4">
            <p className="text-[12px] font-bold text-[#8FA6C3]">{stage.stage}</p>
            <p className="mt-3 text-2xl font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{stage.count}</p>
            <div className="mt-3 h-2 rounded-full bg-[#07111F]">
              <div className="h-full rounded-full bg-[#E11D2E]" style={{ width: `${stage.conversion}%` }} />
            </div>
            <p className="mt-2 text-[11px] text-cyan-300">{stage.conversion}% conversion</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function CommunityHealthCards({ residenceId = 'all' }: { residenceId?: ResidenceScope }) {
  const visibleCommunities = communities.filter(community => matchesResidence(residenceId, community.id));
  return (
    <SectionCard>
      <SectionTitle title="Community Health" subtitle="Portfolio -> Community -> Building/Tower -> Floor -> Unit -> Resident." icon={Building2} />
      <div className="grid gap-3 lg:grid-cols-2">
        {visibleCommunities.map(community => (
          <div key={community.id} className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#0A1628] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-base font-black text-[#EEF3FA]">{community.name}</h4>
                <p className="mt-1 text-[12px] text-[#7A94B4]">{community.towers} towers / {community.units} units</p>
              </div>
              <Badge className={riskClass[community.risk]}>{community.risk} risk</Badge>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
              <DetailCard label="Residents" value={community.residents} />
              <DetailCard label="Units" value={community.units} />
              <DetailCard label="Requests" value={community.openRequests} />
              <DetailCard label="Satisfaction" value={`${community.satisfaction}%`} />
              <DetailCard label="Payments" value={community.pendingPayments} />
            </div>
          </div>
        ))}
        {visibleCommunities.length === 0 && <p className="text-[13px] text-[#7A94B4]">No residence matches this filter.</p>}
      </div>
    </SectionCard>
  );
}

function ResidentOverview({ residenceId = 'all' }: { residenceId?: ResidenceScope }) {
  const scopedPulse = getScopedOperationsPulse(residenceId);
  const scopedInsights = getScopedAiCommunityInsights(residenceId);
  return (
    <div className="space-y-4">
      <ResidentLifecycleFunnel residenceId={residenceId} />
      <CommunityHealthCards residenceId={residenceId} />
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <SectionCard>
          <SectionTitle title="Operations Pulse" subtitle="Live signals from ResidentPortal, SnapFix, ServiceDesk, FieldOps, and payments." icon={CalendarClock} />
          <div className="space-y-3">
            {scopedPulse.map(item => (
              <div key={item} className="flex items-start gap-3 rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#0A1628] p-4">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#E11D2E]" />
                <p className="text-[13px] leading-5 text-[#BCC8DC]">{item}</p>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard>
          <SectionTitle title="AI Community Insights" subtitle="Pattern detection, risk prediction, and next best actions." icon={Sparkles} />
          <div className="grid gap-3 md:grid-cols-2">
            {scopedInsights.map(item => (
              <div key={item} className="rounded-xl border border-violet-300/20 bg-violet-300/10 p-4 text-[13px] leading-5 text-[#E5D9FF]">{item}</div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function BulkResidentUploadModal({ onClose, onToast }: { onClose: () => void; onToast: Props['onToast'] }) {
  const steps = ['Upload CSV/Excel', 'Map fields', 'Validate records', 'Preview import', 'Send invitations'];
  const required = ['Resident Name', 'Email', 'Phone', 'Resident Type', 'Community', 'Building/Tower', 'Floor', 'Unit', 'Ownership/Tenancy Status'];
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: string } | null>(null);

  const handleFile = (file?: File) => {
    if (!file) return;
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !['csv', 'xls', 'xlsx'].includes(extension)) {
      onToast('Please choose a CSV or Excel file', 'warning');
      return;
    }
    const size = file.size >= 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`;
    setSelectedFile({ name: file.name, size });
    onToast(`${file.name} selected and ready to validate`, 'success');
  };

  return (
    <ModalShell title="Bulk Resident Upload" subtitle="Onboard residents at scale, link them to units, and send invitations by email, SMS, or WhatsApp." onClose={onClose}>
      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_300px]">
        <div
          className="rounded-xl border border-dashed border-cyan-300/28 bg-cyan-300/8 p-5 text-center"
          onDragOver={event => event.preventDefault()}
          onDrop={event => {
            event.preventDefault();
            handleFile(event.dataTransfer.files[0]);
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={event => handleFile(event.target.files?.[0])}
          />
          <Upload size={32} className="mx-auto text-cyan-300" />
          <h3 className="mt-3 text-lg font-black text-[#EEF3FA]">Drop CSV or Excel file</h3>
          <p className="mt-2 text-[13px] leading-6 text-[#8FA6C3]">Supported fields are mapped into residents, units, invitations, and verification status.</p>
          <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-4 h-10 rounded-xl bg-[#E11D2E] px-4 text-[12px] font-black text-white">Choose File</button>
          {selectedFile && (
            <div className="mx-auto mt-4 max-w-md rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-left">
              <p className="text-[12px] font-black text-emerald-300">File selected</p>
              <p className="mt-1 truncate text-[13px] font-bold text-[#EEF3FA]">{selectedFile.name}</p>
              <p className="mt-1 text-[11px] text-[#8FA6C3]">{selectedFile.size} - ready for field mapping and validation</p>
            </div>
          )}
        </div>
        <div className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#0A1628] p-4">
          <p className="text-[12px] font-black text-[#EEF3FA]">Import summary</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <DetailCard label="Uploaded" value={bulkUploadSummary.uploaded} />
            <DetailCard label="Valid" value={bulkUploadSummary.valid} />
            <DetailCard label="Errors" value={bulkUploadSummary.errors} />
            <DetailCard label="Invites" value={bulkUploadSummary.invitationsSent} />
          </div>
        </div>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <SectionCard>
          <SectionTitle title="Workflow Steps" />
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={step} className="flex items-center gap-3 rounded-xl bg-[#0A1628] p-3">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[#E11D2E] text-xs font-black text-white">{index + 1}</span>
                <span className="text-[13px] font-bold text-[#BCC8DC]">{step}</span>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard>
          <SectionTitle title="Validation Rules" />
          <div className="flex flex-wrap gap-2">
            {bulkUploadSummary.validations.map(rule => <Badge key={rule} className="border-amber-400/30 bg-amber-400/10 text-amber-300">{rule}</Badge>)}
          </div>
          <p className="mt-4 text-[12px] leading-5 text-[#8FA6C3]">Required fields: {required.join(', ')}.</p>
        </SectionCard>
      </div>
      <div className="mt-5 flex justify-end gap-3">
        <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
        <PrimaryButton icon={Send} onClick={() => { onToast('284 invitations sent and residents set to Invited', 'success'); onClose(); }}>Send Invitations</PrimaryButton>
      </div>
    </ModalShell>
  );
}

function CreateCommunityWizard({ onClose, onToast }: { onClose: () => void; onToast: Props['onToast'] }) {
  const generated = ['3 towers', '420 generated units', 'Gym, pool, padel, BBQ defaults', 'Owner, tenant, family groups', 'Starter notices', 'HVAC, plumbing, access request categories'];
  return (
    <ModalShell title="Create Community" subtitle="Build a community structure from portfolio down to units and resident groups." onClose={onClose}>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {['Community name', 'Developer / Owner', 'Location', 'Number of buildings/towers', 'Number of units', 'Amenities'].map((field, index) => (
          <label key={field} className="text-[12px] font-black text-[#7A94B4]">
            {field}
            <input defaultValue={index === 0 ? 'Jumeirah Heights' : index === 3 ? '3' : index === 4 ? '420' : ''} className="mt-2 h-10 w-full rounded-xl border border-[rgba(46,127,255,0.22)] bg-[#0A1628] px-3 text-[13px] text-[#EEF3FA] outline-none focus:border-[#E11D2E]" />
          </label>
        ))}
        <label className="text-[12px] font-black text-[#7A94B4]">
          Community type
          <select className="mt-2 h-10 w-full rounded-xl border border-[rgba(46,127,255,0.22)] bg-[#0A1628] px-3 text-[13px] text-[#EEF3FA] outline-none focus:border-[#E11D2E]">
            <option>Residential Tower</option>
            <option>Villa Community</option>
            <option>Mixed-use</option>
            <option>Commercial Residential</option>
            <option>Master Community</option>
          </select>
        </label>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {['Rules enabled', 'Payment module enabled', 'Handover module enabled'].map(item => (
          <div key={item} className="flex items-center justify-between rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#0A1628] p-4">
            <span className="text-[13px] font-bold text-[#BCC8DC]">{item}</span>
            <span className="h-6 w-11 rounded-full border border-emerald-400/45 bg-emerald-400/20 p-0.5"><span className="block h-5 w-5 translate-x-5 rounded-full bg-white" /></span>
          </div>
        ))}
      </div>
      <AiPanel title="AI Assist - Generate community structure">
        <p>For Jumeirah Heights, 3 towers, 420 units, AI generates:</p>
        <div className="mt-3 flex flex-wrap gap-2">{generated.map(item => <Badge key={item} className="border-violet-300/25 bg-violet-300/10 text-violet-100">{item}</Badge>)}</div>
      </AiPanel>
      <div className="mt-5 flex justify-end gap-3">
        <SecondaryButton onClick={() => onToast('AI community structure generated', 'success')} icon={Sparkles}>Generate Structure</SecondaryButton>
        <PrimaryButton onClick={() => { onToast('Community created with towers, floors, units, amenities, notices, and request categories', 'success'); onClose(); }} icon={Building2}>Create Community</PrimaryButton>
      </div>
    </ModalShell>
  );
}

function ResidentProfileDrawer({ resident, onClose, onToast }: { resident: Resident; onClose: () => void; onToast: Props['onToast'] }) {
  const unit = getUnit(resident.unitId);
  const community = getCommunity(resident.communityId);
  const requests = residentRequests.filter(request => request.residentId === resident.id);
  const residentPayments = payments.filter(payment => payment.residentId === resident.id);
  const docs = residentDocuments.filter(document => document.linkedResidentId === resident.id || document.linkedUnitId === resident.unitId);
  const bookings = amenityBookings.filter(booking => booking.residentId === resident.id);
  const handover = handovers.find(item => item.residentId === resident.id);

  return (
    <DrawerShell title={resident.name} subtitle={`${resident.type} - ${community?.name ?? 'Community'} - ${unit?.unitNumber ?? resident.unitId}`} onClose={onClose}>
      <div className="grid gap-4 md:grid-cols-2">
        <DetailCard label="Profile" value={<>{resident.email}<br />{resident.phone}</>} />
        <DetailCard label="Unit & Community" value={`${community?.name} / ${unit?.building} / ${unit?.floor}`} />
        <DetailCard label="Status" value={<Badge className={residentStatusClass[resident.status]}>{resident.status}</Badge>} />
        <DetailCard label="Satisfaction / Risk" value={<><span>{resident.satisfaction}%</span> <Badge className={riskClass[resident.risk]}>{resident.risk}</Badge></>} />
      </div>

      <section className="mt-6 rounded-xl border border-violet-300/20 bg-violet-300/10 p-4">
        <div className="flex items-center gap-2 text-[13px] font-black text-violet-100">
          <Sparkles size={16} />
          AI Satisfaction Summary
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <DetailCard label="Sentiment" value={resident.sentiment} />
          <DetailCard label="Repeated complaints" value={requests.filter(request => request.repeatIssue).length} />
          <DetailCard label="Unresolved requests" value={requests.filter(request => !['Closed', 'Resident Confirmed'].includes(request.status)).length} />
          <DetailCard label="Payment risk" value={resident.paymentStatus} />
        </div>
        <p className="mt-4 text-[14px] leading-6 text-[#E5D9FF]">Recommended outreach: ask about the latest service experience, confirm any unresolved request, and offer payment clarification where relevant.</p>
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <SectionCard>
          <SectionTitle title="Requests" />
          <div className="space-y-2">{requests.map(request => <div key={request.id} className="rounded-lg bg-[#07111F] p-3 text-[12px] text-[#BCC8DC]">{request.id} - {request.category} - {request.status}</div>)}</div>
        </SectionCard>
        <SectionCard>
          <SectionTitle title="Payments" />
          <div className="space-y-2">{residentPayments.map(payment => <div key={payment.id} className="flex justify-between rounded-lg bg-[#07111F] p-3 text-[12px]"><span className="font-mono text-cyan-300">{payment.id}</span><Badge className={paymentStatusClass[payment.status]}>{payment.status}</Badge></div>)}</div>
        </SectionCard>
        <SectionCard>
          <SectionTitle title="Documents" />
          <div className="space-y-2">{docs.map(document => <div key={document.id} className="rounded-lg bg-[#07111F] p-3 text-[12px] text-[#BCC8DC]">{document.name}</div>)}</div>
        </SectionCard>
        <SectionCard>
          <SectionTitle title="Amenity Bookings" />
          <div className="space-y-2">{bookings.map(booking => <div key={booking.id} className="rounded-lg bg-[#07111F] p-3 text-[12px] text-[#BCC8DC]">{getAmenity(booking.amenityId)?.name} - {booking.dateTime}</div>)}</div>
        </SectionCard>
      </div>

      <SectionCard className="mt-6">
        <SectionTitle title="Communication History" />
        <div className="space-y-3 text-[13px] text-[#BCC8DC]">
          <p>WhatsApp notice acknowledged for scheduled AC maintenance.</p>
          <p>Portal message sent after FieldOps accepted the HVAC request.</p>
        </div>
      </SectionCard>

      <SectionCard className="mt-6">
        <SectionTitle title="Handover / Warranty" />
        {handover ? <p className="text-[13px] leading-6 text-[#BCC8DC]">{handover.checklistStatus}. Documents signed {handover.documentsSigned}. Move-in status: {handover.moveInStatus}.</p> : <p className="text-[13px] text-[#7A94B4]">No active handover workflow.</p>}
      </SectionCard>

      <div className="mt-6 flex flex-wrap gap-3">
        <PrimaryButton icon={MessageCircle} onClick={() => onToast(`Message drafted for ${resident.name}`, 'info')}>Send Message</PrimaryButton>
        <SecondaryButton icon={Wrench} onClick={() => onToast(`Request creation opened for ${resident.name}`, 'info')}>Create Request</SecondaryButton>
      </div>
    </DrawerShell>
  );
}

function ResidentsTable({ query, residenceId = 'all', onSelect, onToast }: { query: string; residenceId?: ResidenceScope; onSelect: (resident: Resident) => void; onToast: Props['onToast'] }) {
  const filtered = residents.filter(resident => {
    const unit = getUnit(resident.unitId);
    const community = getCommunity(resident.communityId);
    if (!matchesResidence(residenceId, resident.communityId)) return false;
    return `${resident.name} ${resident.email} ${resident.type} ${unit?.unitNumber} ${community?.name}`.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <TableShell columns={['Resident Name', 'Type', 'Community', 'Unit', 'Status', 'Open Requests', 'Payment Status', 'Satisfaction', 'Risk', 'Last Activity', 'Actions']} minWidth="1320px">
      {filtered.map(resident => {
        const unit = getUnit(resident.unitId);
        const community = getCommunity(resident.communityId);
        return (
          <tr key={resident.id} onClick={() => onSelect(resident)} className="cursor-pointer border-t border-[rgba(46,127,255,0.08)] bg-[#0A1628]/70 transition-colors hover:bg-white/[0.045]">
            <td className="px-4 py-4 align-top"><p className="text-[14px] font-black text-[#EEF3FA]">{resident.name}</p><p className="mt-1 text-[11px] text-[#7A94B4]">{resident.email}</p></td>
            <td className="px-4 py-4 align-top text-[13px] text-[#A8B3C7]">{resident.type}</td>
            <td className="px-4 py-4 align-top text-[13px] text-[#A8B3C7]">{community?.name}</td>
            <td className="px-4 py-4 align-top font-mono text-[13px] text-cyan-300">{unit?.unitNumber}</td>
            <td className="px-4 py-4 align-top"><Badge className={residentStatusClass[resident.status]}>{resident.status}</Badge></td>
            <td className="px-4 py-4 align-top font-mono text-[13px] text-[#EEF3FA]">{resident.openRequests}</td>
            <td className="px-4 py-4 align-top"><Badge className={paymentStatusClass[resident.paymentStatus]}>{resident.paymentStatus}</Badge></td>
            <td className="px-4 py-4 align-top font-mono text-[13px] text-[#EEF3FA]">{resident.satisfaction}%</td>
            <td className="px-4 py-4 align-top"><Badge className={riskClass[resident.risk]}>{resident.risk}</Badge></td>
            <td className="px-4 py-4 align-top text-[12px] text-[#7A94B4]">{resident.lastActivity}</td>
            <td className="px-4 py-4 align-top">
              <div className="flex justify-end gap-1">
                <ActionButton label="View Profile" icon={Users} onClick={() => onSelect(resident)} />
                <ActionButton label="Send Message" icon={MessageCircle} onClick={() => onToast(`Message drafted for ${resident.name}`, 'info')} />
                <ActionButton label="Create Request" icon={Wrench} onClick={() => onToast(`Request started for ${resident.name}`, 'info')} />
                <ActionButton label="Invite Again" icon={Mail} onClick={() => onToast(`Invite resent to ${resident.name}`, 'success')} />
                <ActionButton label="Suspend" icon={ShieldCheck} danger onClick={() => onToast(`${resident.name} suspension requires approval`, 'warning')} />
                <ActionButton label="Move Out" icon={Home} onClick={() => onToast(`Move-out checklist opened for ${resident.name}`, 'info')} />
              </div>
            </td>
          </tr>
        );
      })}
      {filtered.length === 0 && (
        <tr className="border-t border-[rgba(46,127,255,0.08)] bg-[#0A1628]/70">
          <td colSpan={11} className="px-4 py-10 text-center text-[13px] text-[#7A94B4]">No residents match this residence filter.</td>
        </tr>
      )}
    </TableShell>
  );
}

function CommunitiesTab({ residenceId = 'all', onCreate }: { residenceId?: ResidenceScope; onCreate: () => void }) {
  const visibleCommunities = communities.filter(community => matchesResidence(residenceId, community.id));
  return (
    <div className="space-y-4">
      <SectionCard>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <SectionTitle title="Community Structure" subtitle="Portfolio -> Community -> Building/Tower -> Floor -> Unit -> Resident." icon={Building2} />
          <PrimaryButton icon={Plus} onClick={onCreate}>Create Community</PrimaryButton>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {visibleCommunities.map(community => (
            <div key={community.id} className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#0A1628] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-base font-black text-[#EEF3FA]">{community.name}</h4>
                  <p className="mt-1 text-[12px] text-[#8FA6C3]">{community.developer} - {community.location}</p>
                </div>
                <Badge className={riskClass[community.risk]}>{community.risk}</Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                <DetailCard label="Type" value={community.type} />
                <DetailCard label="Towers" value={community.towers} />
                <DetailCard label="Units" value={community.units} />
                <DetailCard label="Residents" value={community.residents} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">{community.amenities.map(item => <Badge key={item}>{item}</Badge>)}</div>
            </div>
          ))}
          {visibleCommunities.length === 0 && <p className="text-[13px] text-[#7A94B4]">No community structure matches the current residence filter.</p>}
        </div>
      </SectionCard>
    </div>
  );
}

function RequestDetailDrawer({ request, onClose, onToast }: { request: ResidentRequest; onClose: () => void; onToast: Props['onToast'] }) {
  const resident = getResident(request.residentId);
  const unit = getUnit(request.unitId);
  const community = getCommunity(request.communityId);
  return (
    <DrawerShell title={request.id} subtitle={`${resident?.name ?? 'Resident'} - ${community?.name ?? 'Community'} - ${unit?.unitNumber ?? 'Unit'}`} onClose={onClose}>
      <div className="grid gap-4 md:grid-cols-4">
        <DetailCard label="Status" value={<Badge className={requestStatusClass[request.status]}>{request.status}</Badge>} />
        <DetailCard label="Priority" value={<Badge className={request.priority === 'High' || request.priority === 'Critical' ? 'border-red-400/30 bg-red-400/10 text-red-300' : 'border-amber-400/30 bg-amber-400/10 text-amber-300'}>{request.priority}</Badge>} />
        <DetailCard label="SLA" value={request.sla} />
        <DetailCard label="Source" value={request.source} />
      </div>
      <SectionCard className="mt-5">
        <SectionTitle title="Issue Summary" />
        <p className="text-[14px] leading-6 text-[#BCC8DC]">{request.description}</p>
      </SectionCard>
      <AiPanel title="AI request intelligence">
        <p><strong>Classification:</strong> {request.aiClassification}</p>
        <p className="mt-2"><strong>Severity:</strong> {request.aiSeverity}</p>
        <p className="mt-2"><strong>Repeat issue:</strong> {request.repeatIssue ? 'Yes' : 'No'}</p>
        <p className="mt-2"><strong>Resident sentiment:</strong> {request.sentiment}</p>
        <p className="mt-2"><strong>Recommended team:</strong> {request.assignedTo}</p>
      </AiPanel>
      <div className="mt-5 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionCard>
          <SectionTitle title="Photo / Voice Evidence" />
          <div className="space-y-2">{request.evidence.map(item => <div key={item} className="rounded-lg border border-[rgba(46,127,255,0.12)] bg-[#07111F] p-3 text-[12px] text-[#BCC8DC]">{item}</div>)}</div>
        </SectionCard>
        <SectionCard>
          <SectionTitle title="Timeline" />
          <div className="space-y-4">
            {request.timeline.map(item => (
              <div key={`${item.label}-${item.at}`} className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-300" />
                <div>
                  <p className="text-[13px] font-black text-[#EEF3FA]">{item.label} <span className="font-mono text-[11px] text-[#7A94B4]">{item.at}</span></p>
                  <p className="mt-1 text-[12px] leading-5 text-[#8FA6C3]">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
      <SectionCard className="mt-5">
        <SectionTitle title="Closure and Resident Confirmation" />
        <p className="text-[13px] leading-6 text-[#BCC8DC]">Technician closure evidence, resident confirmation, rating, and reopened status are tracked here before ServiceDesk closes the workflow.</p>
      </SectionCard>
      <div className="mt-6 flex flex-wrap gap-3">
        <PrimaryButton icon={Send} onClick={() => onToast(`Resident update sent for ${request.id}`, 'success')}>Message Resident</PrimaryButton>
        <SecondaryButton icon={Users} onClick={() => onToast(`${request.id} assigned through FieldOps`, 'info')}>Assign FieldOps</SecondaryButton>
        <SecondaryButton icon={AlertTriangle} onClick={() => onToast(`${request.id} escalation recommended`, 'warning')}>Escalate</SecondaryButton>
      </div>
    </DrawerShell>
  );
}

function ResidentRequestsTable({ residenceId = 'all', onSelect, onToast }: { residenceId?: ResidenceScope; onSelect: (request: ResidentRequest) => void; onToast: Props['onToast'] }) {
  const visibleRequests = residentRequests.filter(request => matchesResidence(residenceId, request.communityId));
  return (
    <TableShell columns={['Request ID', 'Resident', 'Unit', 'Community', 'Category', 'Priority', 'Status', 'Assigned To', 'SLA', 'Source', 'Satisfaction', 'Actions']} minWidth="1420px">
      {visibleRequests.map(request => {
        const resident = getResident(request.residentId);
        const unit = getUnit(request.unitId);
        const community = getCommunity(request.communityId);
        return (
          <tr key={request.id} onClick={() => onSelect(request)} className="cursor-pointer border-t border-[rgba(46,127,255,0.08)] bg-[#0A1628]/70 transition-colors hover:bg-white/[0.045]">
            <td className="px-4 py-4 align-top font-mono text-[13px] font-black text-cyan-300">{request.id}</td>
            <td className="px-4 py-4 align-top text-[13px] font-bold text-[#EEF3FA]">{resident?.name}</td>
            <td className="px-4 py-4 align-top font-mono text-[13px] text-[#A8B3C7]">{unit?.unitNumber}</td>
            <td className="px-4 py-4 align-top text-[13px] text-[#A8B3C7]">{community?.name}</td>
            <td className="px-4 py-4 align-top text-[13px] text-[#A8B3C7]">{request.category}</td>
            <td className="px-4 py-4 align-top"><Badge className={request.priority === 'Critical' || request.priority === 'High' ? 'border-red-400/30 bg-red-400/10 text-red-300' : 'border-amber-400/30 bg-amber-400/10 text-amber-300'}>{request.priority}</Badge></td>
            <td className="px-4 py-4 align-top"><Badge className={requestStatusClass[request.status]}>{request.status}</Badge></td>
            <td className="px-4 py-4 align-top text-[12px] text-[#A8B3C7]">{request.assignedTo}</td>
            <td className="px-4 py-4 align-top text-[12px] text-[#A8B3C7]">{request.sla}</td>
            <td className="px-4 py-4 align-top text-[12px] text-[#7A94B4]">{request.source}</td>
            <td className="px-4 py-4 align-top text-[12px] text-[#A8B3C7]">{request.satisfactionRating ? `${request.satisfactionRating}/5` : 'Pending'}</td>
            <td className="px-4 py-4 align-top">
              <div className="flex justify-end gap-1">
                <ActionButton label="Open" icon={ChevronRight} onClick={() => onSelect(request)} />
                <ActionButton label="Classify Issue" icon={Bot} onClick={() => onToast(`${request.id} classified as ${request.aiClassification}`, 'info')} />
                <ActionButton label="Assign" icon={Users} onClick={() => onToast(`${request.id} assignment panel ready`, 'info')} />
                <ActionButton label="Escalate" icon={AlertTriangle} danger onClick={() => onToast(`${request.id} escalation drafted`, 'warning')} />
              </div>
            </td>
          </tr>
        );
      })}
      {visibleRequests.length === 0 && (
        <tr className="border-t border-[rgba(46,127,255,0.08)] bg-[#0A1628]/70">
          <td colSpan={12} className="px-4 py-10 text-center text-[13px] text-[#7A94B4]">No resident requests match this residence filter.</td>
        </tr>
      )}
    </TableShell>
  );
}

const residentIncidentSources = new Set(['Resident App', 'AI Capture', 'QR Scan', 'Photo upload', 'Voice note', 'Chat assistant']);

const siteCommunityMap: Record<string, string> = {
  'silicon-oasis': 'jumeirah-heights',
  'gate-avenue': 'bayz-102',
  'business-bay': 'bayz-102',
  'jlt-north': 'marina-residences',
  'difc-tower': 'creek-view-towers',
};

const incidentSeverityClass: Record<string, string> = {
  critical: 'border-red-400/30 bg-red-400/10 text-red-300',
  high: 'border-orange-400/30 bg-orange-400/10 text-orange-300',
  medium: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  low: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
};

const incidentStatusClass: Record<string, string> = {
  open: 'border-slate-400/30 bg-slate-400/10 text-slate-300',
  dispatched: 'border-blue-400/30 bg-blue-400/10 text-blue-300',
  assigned: 'border-blue-400/30 bg-blue-400/10 text-blue-300',
  'in-progress': 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300',
  overdue: 'border-red-400/30 bg-red-400/10 text-red-300',
  resolved: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  closed: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
};

function normalize(text?: string | null) {
  return (text ?? '').toLowerCase();
}

function isResidentRaisedIncident(incident: Incident) {
  const source = incident.source ?? '';
  const activityText = incident.activityLog.map(item => `${item.event} ${item.type}`).join(' ').toLowerCase();
  const metadataText = [
    incident.aiMetadata?.reporterName,
    incident.aiMetadata?.reporterRole,
    incident.aiMetadata?.issueType,
    incident.aiMetadata?.category,
  ].filter(Boolean).join(' ').toLowerCase();

  return (
    residentIncidentSources.has(source) ||
    activityText.includes('resident') ||
    activityText.includes('snapfix') ||
    activityText.includes('photo') ||
    activityText.includes('voice') ||
    activityText.includes('qr') ||
    metadataText.includes('resident') ||
    metadataText.includes('owner') ||
    metadataText.includes('tenant')
  );
}

function getResidentIncidentContext(incident: Incident) {
  const haystack = normalize(`${incident.id} ${incident.title} ${incident.description} ${incident.location} ${incident.siteId} ${incident.aiMetadata?.category} ${incident.aiMetadata?.issueType}`);
  const siteCommunityId = incident.siteId ? siteCommunityMap[incident.siteId] : undefined;
  const matchedCommunity =
    communities.find(community => haystack.includes(community.name.toLowerCase())) ??
    (siteCommunityId ? getCommunity(siteCommunityId) : undefined) ??
    communities.find(community => haystack.includes(community.id));

  const directResident = residents.find(resident => {
    const unit = getUnit(resident.unitId);
    return haystack.includes(resident.name.toLowerCase()) || (unit ? haystack.includes(unit.unitNumber.toLowerCase()) : false);
  });

  const category = normalize(`${incident.title} ${incident.aiMetadata?.category} ${incident.aiMetadata?.issueType}`);
  const fallbackResident =
    directResident ??
    (category.includes('hvac') || category.includes('ac') || category.includes('cooling')
      ? residents.find(resident => resident.id === (haystack.includes('tower b') ? 'res-lina' : 'res-ahmad'))
      : category.includes('water') || category.includes('leak') || category.includes('plumb')
        ? residents.find(resident => resident.id === 'res-sara')
        : category.includes('gym') || category.includes('access') || category.includes('gate') || category.includes('intercom')
          ? residents.find(resident => resident.id === 'res-noura')
          : undefined) ??
    residents.find(resident => matchedCommunity && resident.communityId === matchedCommunity.id) ??
    residents[0];

  const unit = fallbackResident ? getUnit(fallbackResident.unitId) : undefined;
  const community = unit ? getCommunity(unit.communityId) : matchedCommunity;
  const linkedRequest = residentRequests.find(request => {
    const sameResident = fallbackResident && request.residentId === fallbackResident.id;
    const issueMatch = category.includes(request.category.toLowerCase()) || request.category.toLowerCase().includes(category.split(' ')[0] ?? '');
    return sameResident && issueMatch;
  }) ?? residentRequests.find(request => fallbackResident && request.residentId === fallbackResident.id);

  return {
    resident: fallbackResident,
    unit,
    community,
    linkedRequest,
  };
}

function getIncidentSlaTone(incident: Incident) {
  const elapsed = Number.isFinite(incident.elapsed) ? incident.elapsed : 0;
  const slaMinutes = Number.isFinite(incident.slaMinutes) && incident.slaMinutes > 0 ? incident.slaMinutes : 60;
  const percent = Math.min(100, Math.round((elapsed / slaMinutes) * 100));
  const left = Math.max(0, slaMinutes - elapsed);
  const overdue = incident.status === 'overdue' || elapsed > slaMinutes;

  if (overdue) {
    return { percent: 100, label: 'Overdue', text: 'text-red-300', bar: 'bg-red-400', pill: 'border-red-400/30 bg-red-400/10 text-red-300' };
  }
  if (percent >= 80) {
    return { percent, label: `${left}m left`, text: 'text-amber-300', bar: 'bg-amber-400', pill: 'border-amber-400/30 bg-amber-400/10 text-amber-300' };
  }
  return { percent, label: `${left}m left`, text: 'text-emerald-300', bar: 'bg-emerald-400', pill: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' };
}

function deriveIncidentSkill(incident: Incident) {
  const category = normalize(`${incident.title} ${incident.description} ${incident.aiMetadata?.category} ${incident.aiMetadata?.issueType}`);
  if (category.includes('hvac') || category.includes('ac') || category.includes('cooling') || category.includes('chiller')) return 'HVAC';
  if (category.includes('plumb') || category.includes('water') || category.includes('leak') || category.includes('pipe')) return 'Plumbing';
  if (category.includes('electrical') || category.includes('power') || category.includes('lift') || category.includes('intercom') || category.includes('gate')) return 'Electrical';
  if (category.includes('fire') || category.includes('safety')) return 'Safety';
  return 'General';
}

function buildIncidentWorkOrderInput(incident: Incident): CreateWorkOrderInput {
  return {
    title: incident.title,
    location: incident.location,
    priority: ['critical', 'high', 'medium', 'low'].includes(incident.severity) ? incident.severity : 'medium',
    asset: incident.aiMetadata?.identifiedAsset ?? incident.title,
    skill: deriveIncidentSkill(incident),
    description: incident.description,
    siteId: incident.siteId,
  };
}

function IncidentStatusBadge({ status }: { status: string }) {
  return <Badge className={incidentStatusClass[status] ?? 'border-slate-400/30 bg-slate-400/10 text-slate-300'}>{status.replace('-', ' ')}</Badge>;
}

function IncidentSeverityBadge({ severity }: { severity: string }) {
  return <Badge className={incidentSeverityClass[severity] ?? 'border-slate-400/30 bg-slate-400/10 text-slate-300'}>{severity}</Badge>;
}

function IncidentSlaCell({ incident }: { incident: Incident }) {
  const tone = getIncidentSlaTone(incident);
  return (
    <div className="min-w-[120px]">
      <div className="h-1.5 overflow-hidden rounded-full bg-[#07111F]">
        <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${tone.percent}%` }} />
      </div>
      <div className="mt-1 flex items-center justify-between text-[10px]">
        <span className={tone.text}>{tone.label}</span>
        <span className="text-[#7A94B4]">{incident.elapsed}m / {incident.slaMinutes}m</span>
      </div>
    </div>
  );
}

function ResidentIncidentDetailDrawer({ incident, onClose, onToast }: { incident: Incident; onClose: () => void; onToast: Props['onToast'] }) {
  const { approveTicket, rejectTicket, createWorkOrder, resolveIncident, confirmResolution } = useIncidents();
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const context = getResidentIncidentContext(incident);
  const sla = getIncidentSlaTone(incident);
  const ai = incident.aiMetadata;

  const runAction = async (label: string, action: () => Promise<void> | void, success: string) => {
    setBusyAction(label);
    try {
      await action();
      onToast(success, 'success');
    } catch (error) {
      onToast(error instanceof Error ? error.message : `${label} failed`, 'error');
    } finally {
      setBusyAction(null);
    }
  };

  const canCreateWo = !incident.workOrderId && incident.status !== 'closed';
  const canResolve = !['resolved', 'closed'].includes(incident.status);
  const canConfirm = incident.status === 'resolved';
  const pendingApproval = incident.ticketState === 'pending_approval';

  return (
    <DrawerShell title={incident.id} subtitle={`${incident.title} - ${context.community?.name ?? 'Resident community'} - ${context.unit?.unitNumber ?? incident.location}`} onClose={onClose}>
      <div className="grid gap-4 md:grid-cols-4">
        <DetailCard label="Severity" value={<IncidentSeverityBadge severity={incident.severity} />} />
        <DetailCard label="Status" value={<IncidentStatusBadge status={incident.status} />} />
        <DetailCard label="SLA" value={<Badge className={sla.pill}>{sla.label}</Badge>} />
        <DetailCard label="Source" value={incident.source} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <SectionCard>
          <SectionTitle title="Resident Context" icon={Users} />
          <div className="grid gap-3 md:grid-cols-2">
            <DetailCard label="Resident" value={context.resident?.name ?? 'Unmatched'} />
            <DetailCard label="Unit" value={context.unit?.unitNumber ?? incident.location} />
            <DetailCard label="Community" value={context.community?.name ?? 'Unmatched'} />
            <DetailCard label="Linked request" value={context.linkedRequest?.id ?? 'No matching request'} />
          </div>
        </SectionCard>
        <SectionCard>
          <SectionTitle title="SLA and Dispatch" icon={CalendarClock} />
          <IncidentSlaCell incident={incident} />
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <DetailCard label="Assigned tech" value={incident.assignedTech ?? 'Unassigned'} />
            <DetailCard label="Work order" value={incident.workOrderId ?? 'Not created'} />
          </div>
        </SectionCard>
      </div>

      <SectionCard className="mt-5">
        <SectionTitle title="Overview" icon={AlertTriangle} />
        <p className="text-[14px] leading-6 text-[#BCC8DC]">{incident.description}</p>
      </SectionCard>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <SectionCard>
          <SectionTitle title="Evidence" icon={FileText} />
          {incident.imageUrl ? (
            <img src={incident.imageUrl} alt="Incident evidence" className="max-h-56 w-full rounded-xl border border-[rgba(46,127,255,0.16)] object-cover" />
          ) : (
            <div className="rounded-xl border border-dashed border-[rgba(46,127,255,0.22)] bg-[#07111F] p-5 text-center text-[13px] text-[#7A94B4]">
              No photo evidence attached to this resident incident.
            </div>
          )}
          <div className="mt-3 grid gap-2">
            {(ai?.observations ?? ['Resident-submitted incident is visible in the shared IncidentOS workflow.']).map(item => (
              <div key={item} className="rounded-lg bg-[#07111F] p-3 text-[12px] leading-5 text-[#BCC8DC]">{item}</div>
            ))}
          </div>
        </SectionCard>

        <SectionCard>
          <SectionTitle title="AI Analysis" icon={Sparkles} />
          <div className="grid gap-3 md:grid-cols-2">
            <DetailCard label="Category" value={ai?.category ?? deriveIncidentSkill(incident)} />
            <DetailCard label="Issue type" value={ai?.issueType ?? 'Resident reported issue'} />
            <DetailCard label="Identified asset" value={ai?.identifiedAsset ?? incident.title} />
            <DetailCard label="Confidence" value={ai?.confidence != null ? `${ai.confidence}%` : 'Pending'} />
          </div>
          <p className="mt-4 text-[13px] leading-6 text-[#E5D9FF]">{ai?.recommendedAction ?? 'Review evidence, confirm resident impact, then approve ticket or create a work order from the existing incident workflow.'}</p>
        </SectionCard>
      </div>

      <SectionCard className="mt-5">
        <SectionTitle title="Timeline" icon={Activity} />
        <div className="space-y-4">
          {incident.activityLog.length > 0 ? incident.activityLog.map((item, index) => (
            <div key={`${item.time}-${index}`} className="flex gap-3">
              <span className="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-300" />
              <div>
                <p className="text-[13px] font-black text-[#EEF3FA]">{item.type} <span className="font-mono text-[11px] text-[#7A94B4]">{item.time}</span></p>
                <p className="mt-1 text-[12px] leading-5 text-[#8FA6C3]">{item.event}</p>
              </div>
            </div>
          )) : (
            <p className="text-[13px] text-[#7A94B4]">No activity log available.</p>
          )}
        </div>
      </SectionCard>

      <SectionCard className="mt-5">
        <SectionTitle title="Actions" subtitle="Uses the existing IncidentOS, ticket, and work-order workflow." icon={Briefcase} />
        <div className="flex flex-wrap gap-3">
          {pendingApproval && (
            <>
              <PrimaryButton icon={CheckCircle2} onClick={() => runAction('approve', () => approveTicket(incident.id, 'ResidentPortal'), `Ticket ${incident.id} approved and work order created`)}>
                {busyAction === 'approve' ? 'Approving...' : 'Approve Ticket'}
              </PrimaryButton>
              <SecondaryButton icon={X} onClick={() => runAction('reject', () => rejectTicket(incident.id, 'ResidentPortal requested more resident evidence', 'ResidentPortal'), `Ticket ${incident.id} rejected`)}>
                {busyAction === 'reject' ? 'Rejecting...' : 'Reject Ticket'}
              </SecondaryButton>
            </>
          )}
          {canCreateWo && (
            <SecondaryButton icon={Briefcase} onClick={() => runAction('work order', () => {
              const workOrder = createWorkOrder(incident.id, buildIncidentWorkOrderInput(incident));
              onToast(`Work Order ${workOrder.id} created from ${incident.id}`, 'success');
            }, `Work order workflow updated for ${incident.id}`)}>
              Create Work Order
            </SecondaryButton>
          )}
          {canResolve && (
            <SecondaryButton icon={FileCheck2} onClick={() => runAction('resolve', () => resolveIncident(incident.id, {
              resolvedBy: 'ResidentPortal',
              resolutionNotes: 'Resolved through ResidentPortal incident management with resident evidence reviewed.',
              beforePhotoUrl: incident.imageUrl,
              afterPhotoUrl: incident.afterPhotoUrl ?? 'residentportal-resolution-evidence.jpg',
            }), `${incident.id} marked resolved`)}>
              Resolve with Evidence
            </SecondaryButton>
          )}
          {canConfirm && (
            <PrimaryButton icon={ShieldCheck} onClick={() => runAction('confirm', () => confirmResolution(incident.id, 'ResidentPortal'), `${incident.id} confirmed and closed`)}>
              Confirm Resolution
            </PrimaryButton>
          )}
          <SecondaryButton icon={AlertTriangle} onClick={() => onToast(`${incident.id} escalated to community operations`, 'warning')}>Escalate</SecondaryButton>
          <SecondaryButton icon={MessageCircle} onClick={() => onToast(`Resident update drafted for ${context.resident?.name ?? incident.id}`, 'info')}>Message Resident</SecondaryButton>
        </div>
      </SectionCard>
    </DrawerShell>
  );
}

function ResidentIncidentsManager({ residenceId = 'all', onToast }: { residenceId?: ResidenceScope; onToast: Props['onToast'] }) {
  const { incidents } = useIncidents();
  const [query, setQuery] = useState('');
  const [severity, setSeverity] = useState('All');
  const [status, setStatus] = useState('All');
  const [source, setSource] = useState('All');
  const [community, setCommunity] = useState('All');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const residentIncidents = useMemo(() => incidents.filter(incident => {
    if (!isResidentRaisedIncident(incident)) return false;
    return matchesResidence(residenceId, getResidentIncidentContext(incident).community?.id);
  }), [incidents, residenceId]);

  const filtered = useMemo(() => residentIncidents.filter(incident => {
    const context = getResidentIncidentContext(incident);
    const haystack = `${incident.id} ${incident.title} ${incident.location} ${incident.source} ${context.resident?.name ?? ''} ${context.unit?.unitNumber ?? ''} ${context.community?.name ?? ''}`.toLowerCase();
    if (severity !== 'All' && incident.severity !== severity) return false;
    if (status !== 'All' && incident.status !== status) return false;
    if (source !== 'All' && incident.source !== source) return false;
    if (residenceId === 'all' && community !== 'All' && context.community?.id !== community) return false;
    if (query && !haystack.includes(query.toLowerCase())) return false;
    return true;
  }), [residentIncidents, severity, status, source, community, query, residenceId]);

  const selectedCurrent = selectedIncident ? incidents.find(incident => incident.id === selectedIncident.id) ?? selectedIncident : null;
  const uniqueSources = Array.from(new Set(residentIncidents.map(incident => incident.source))).sort();
  const uniqueStatuses = Array.from(new Set(residentIncidents.map(incident => incident.status))).sort();
  const communityOptions = residenceId === 'all' ? communities : communities.filter(item => matchesResidence(residenceId, item.id));
  const counts = {
    resident: residentIncidents.length,
    critical: residentIncidents.filter(incident => incident.severity === 'critical').length,
    open: residentIncidents.filter(incident => ['open', 'assigned', 'dispatched', 'in-progress'].includes(incident.status)).length,
    overdue: residentIncidents.filter(incident => incident.status === 'overdue' || incident.elapsed > incident.slaMinutes).length,
    pendingApproval: residentIncidents.filter(incident => incident.ticketState === 'pending_approval').length,
    workOrders: residentIncidents.filter(incident => incident.workOrderId || incident.ticketState === 'work_order_created').length,
  };

  return (
    <div className="space-y-4">
      <SectionCard>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <SectionTitle title="Resident-Raised Incidents" subtitle="Formal SnapFix and resident-app incidents from the existing IncidentOS workflow." icon={AlertTriangle} />
          <div className="flex flex-wrap gap-2">
            <Badge>{counts.resident} resident incidents</Badge>
            <Badge className="border-red-400/30 bg-red-400/10 text-red-300">{counts.critical} critical</Badge>
            <Badge className="border-sky-400/30 bg-sky-400/10 text-sky-300">{counts.open} open</Badge>
            <Badge className="border-amber-400/30 bg-amber-400/10 text-amber-300">{counts.pendingApproval} pending approval</Badge>
            <Badge className="border-violet-400/30 bg-violet-400/10 text-violet-200">{counts.workOrders} work orders</Badge>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <DetailCard label="Resident incidents" value={counts.resident} />
          <DetailCard label="Critical" value={counts.critical} />
          <DetailCard label="Open" value={counts.open} />
          <DetailCard label="Overdue" value={counts.overdue} />
          <DetailCard label="Pending approval" value={counts.pendingApproval} />
          <DetailCard label="Work orders" value={counts.workOrders} />
        </div>
      </SectionCard>

      <SectionCard>
        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.9fr_1fr]">
          <label className="relative block">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A94B4]" />
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search incident, resident, unit, community..." className="h-10 w-full rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#0A1628] pl-11 pr-4 text-[13px] text-[#EEF3FA] outline-none placeholder:text-[#5A6E88] focus:border-[#E11D2E]" />
          </label>
          <select value={severity} onChange={event => setSeverity(event.target.value)} className="h-10 rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#0A1628] px-3 text-[13px] text-[#EEF3FA] outline-none focus:border-[#E11D2E]">
            {['All', 'critical', 'high', 'medium', 'low'].map(item => <option key={item}>{item}</option>)}
          </select>
          <select value={status} onChange={event => setStatus(event.target.value)} className="h-10 rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#0A1628] px-3 text-[13px] text-[#EEF3FA] outline-none focus:border-[#E11D2E]">
            <option>All</option>
            {uniqueStatuses.map(item => <option key={item}>{item}</option>)}
          </select>
          <select value={source} onChange={event => setSource(event.target.value)} className="h-10 rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#0A1628] px-3 text-[13px] text-[#EEF3FA] outline-none focus:border-[#E11D2E]">
            <option>All</option>
            {uniqueSources.map(item => <option key={item}>{item}</option>)}
          </select>
          <select value={residenceId === 'all' ? community : residenceId} onChange={event => setCommunity(event.target.value)} disabled={residenceId !== 'all'} className="h-10 rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#0A1628] px-3 text-[13px] text-[#EEF3FA] outline-none focus:border-[#E11D2E] disabled:opacity-70">
            {residenceId === 'all' && <option value="All">All communities</option>}
            {communityOptions.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </div>
      </SectionCard>

      <TableShell columns={['Incident ID', 'Title', 'Resident / Unit', 'Community', 'Source', 'Severity', 'Status', 'SLA', 'AI Category', 'Assigned Tech', 'Work Order', 'Actions']} minWidth="1480px">
        {filtered.map(incident => {
          const context = getResidentIncidentContext(incident);
          return (
            <tr key={incident.id} onClick={() => setSelectedIncident(incident)} className="cursor-pointer border-t border-[rgba(46,127,255,0.08)] bg-[#0A1628]/70 transition-colors hover:bg-white/[0.045]">
              <td className="px-4 py-4 align-top font-mono text-[13px] font-black text-cyan-300">{incident.id}</td>
              <td className="px-4 py-4 align-top"><p className="text-[13px] font-black text-[#EEF3FA]">{incident.title}</p><p className="mt-1 text-[11px] text-[#7A94B4]">{incident.location}</p></td>
              <td className="px-4 py-4 align-top text-[13px] text-[#A8B3C7]">{context.resident?.name ?? 'Unmatched'}<br /><span className="font-mono text-[11px] text-cyan-300">{context.unit?.unitNumber ?? '-'}</span></td>
              <td className="px-4 py-4 align-top text-[13px] text-[#A8B3C7]">{context.community?.name ?? '-'}</td>
              <td className="px-4 py-4 align-top"><Badge>{incident.source}</Badge></td>
              <td className="px-4 py-4 align-top"><IncidentSeverityBadge severity={incident.severity} /></td>
              <td className="px-4 py-4 align-top"><IncidentStatusBadge status={incident.status} /></td>
              <td className="px-4 py-4 align-top"><IncidentSlaCell incident={incident} /></td>
              <td className="px-4 py-4 align-top text-[12px] text-[#A8B3C7]">{incident.aiMetadata?.category ?? deriveIncidentSkill(incident)}</td>
              <td className="px-4 py-4 align-top text-[12px] text-[#A8B3C7]">{incident.assignedTech ?? 'Unassigned'}</td>
              <td className="px-4 py-4 align-top text-[12px] text-[#A8B3C7]">{incident.workOrderId ?? (incident.ticketState === 'work_order_created' ? 'Created' : 'Not created')}</td>
              <td className="px-4 py-4 align-top">
                <div className="flex justify-end gap-1">
                  <ActionButton label="Open" icon={ChevronRight} onClick={() => setSelectedIncident(incident)} />
                  <ActionButton label="Create Work Order" icon={Briefcase} onClick={() => onToast(`Open ${incident.id} to create a work order from IncidentOS`, 'info')} />
                  <ActionButton label="Escalate" icon={AlertTriangle} danger onClick={() => onToast(`${incident.id} escalation drafted`, 'warning')} />
                </div>
              </td>
            </tr>
          );
        })}
        {filtered.length === 0 && (
          <tr className="border-t border-[rgba(46,127,255,0.08)] bg-[#0A1628]/70">
            <td colSpan={12} className="px-4 py-10 text-center text-[13px] text-[#7A94B4]">No resident-raised incidents match the current filters.</td>
          </tr>
        )}
      </TableShell>

      {selectedCurrent && <ResidentIncidentDetailDrawer incident={selectedCurrent} onClose={() => setSelectedIncident(null)} onToast={onToast} />}
    </div>
  );
}

function AmenityBookingCalendar({ amenity }: { amenity: Amenity }) {
  const slots = ['06:00', '08:00', '10:00', '14:00', '18:00', '20:00'];
  return (
    <div className="grid grid-cols-3 gap-2">
      {slots.map((slot, index) => (
        <div key={slot} className={`rounded-lg border p-3 text-center text-[12px] font-black ${index > 3 ? 'border-red-400/30 bg-red-400/10 text-red-300' : 'border-[rgba(46,127,255,0.16)] bg-[#07111F] text-[#BCC8DC]'}`}>
          {slot}<br /><span className="text-[10px] font-bold">{index > 3 ? 'Peak' : `${Math.max(0, amenity.capacity - index * 4)} free`}</span>
        </div>
      ))}
    </div>
  );
}

function AmenitiesManager({ residenceId = 'all', onToast }: { residenceId?: ResidenceScope; onToast: Props['onToast'] }) {
  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(amenities[0]);
  const visibleBookings = amenityBookings.filter(booking => matchesResidence(residenceId, getUnit(booking.unitId)?.communityId));
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <SectionCard>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <SectionTitle title="Amenity Booking Module" subtitle="Capacity, hours, booking slots, access QR, payments, policies, and blackout dates." icon={CalendarClock} />
          <PrimaryButton icon={Plus} onClick={() => onToast('Amenity creation form opened', 'info')}>Create Amenity</PrimaryButton>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {amenities.map(amenity => (
            <button key={amenity.id} type="button" onClick={() => setSelectedAmenity(amenity)} className={`rounded-xl border p-4 text-left transition-colors ${selectedAmenity?.id === amenity.id ? 'border-[#E11D2E]/50 bg-[#E11D2E]/10' : 'border-[rgba(46,127,255,0.14)] bg-[#0A1628] hover:bg-white/[0.04]'}`}>
              <div className="flex items-start justify-between gap-3">
                <h4 className="text-base font-black text-[#EEF3FA]">{amenity.name}</h4>
                <Badge>{amenity.occupancy}% occ</Badge>
              </div>
              <p className="mt-2 text-[12px] text-[#8FA6C3]">Capacity {amenity.capacity} - {amenity.hours}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {amenity.approvalRequired && <Badge>Approval</Badge>}
                {amenity.paidBooking && <Badge>Paid</Badge>}
                <Badge>{amenity.restrictions}</Badge>
              </div>
            </button>
          ))}
        </div>
        <div className="mt-5">
          <TableShell columns={['Booking ID', 'Resident', 'Unit', 'Amenity', 'Date/Time', 'Status', 'Payment', 'Access QR', 'Actions']} minWidth="1050px">
            {visibleBookings.map(booking => {
              const resident = getResident(booking.residentId);
              const unit = getUnit(booking.unitId);
              return (
                <tr key={booking.id} className="border-t border-[rgba(46,127,255,0.08)] bg-[#0A1628]/70">
                  <td className="px-4 py-4 font-mono text-[13px] font-black text-cyan-300">{booking.id}</td>
                  <td className="px-4 py-4 text-[13px] font-bold text-[#EEF3FA]">{resident?.name}</td>
                  <td className="px-4 py-4 font-mono text-[13px] text-[#A8B3C7]">{unit?.unitNumber}</td>
                  <td className="px-4 py-4 text-[13px] text-[#A8B3C7]">{getAmenity(booking.amenityId)?.name}</td>
                  <td className="px-4 py-4 text-[12px] text-[#A8B3C7]">{booking.dateTime}</td>
                  <td className="px-4 py-4"><Badge>{booking.status}</Badge></td>
                  <td className="px-4 py-4 text-[12px] text-[#A8B3C7]">{booking.payment}</td>
                  <td className="px-4 py-4 font-mono text-[12px] text-cyan-300">{booking.accessQr}</td>
                  <td className="px-4 py-4 text-right"><ActionButton label="Send QR" icon={QrCode} onClick={() => onToast(`QR sent for ${booking.id}`, 'success')} /></td>
                </tr>
              );
            })}
            {visibleBookings.length === 0 && (
              <tr className="border-t border-[rgba(46,127,255,0.08)] bg-[#0A1628]/70">
                <td colSpan={9} className="px-4 py-10 text-center text-[13px] text-[#7A94B4]">No amenity bookings match this residence filter.</td>
              </tr>
            )}
          </TableShell>
        </div>
      </SectionCard>
      {selectedAmenity && (
        <SectionCard>
          <SectionTitle title={`${selectedAmenity.name} Detail`} subtitle="Calendar, occupancy, rules, revenue, peak analytics." />
          <AmenityBookingCalendar amenity={selectedAmenity} />
          <div className="mt-4 grid gap-3">
            <DetailCard label="Revenue if paid" value={selectedAmenity.revenue} />
            <DetailCard label="Cancellation policy" value={selectedAmenity.cancellationPolicy} />
            <DetailCard label="Blackout dates" value={selectedAmenity.blackoutDates.length ? selectedAmenity.blackoutDates.join(', ') : 'None'} />
          </div>
          <AiPanel title="AI amenity insights">
            <p>{selectedAmenity.peakInsight}</p>
            <p className="mt-2">AI can predict overbooked slots, recommend capacity changes, flag no-shows, and suggest maintenance windows.</p>
          </AiPanel>
        </SectionCard>
      )}
    </div>
  );
}

function NoticesCenter({ residenceId = 'all', onCreate, onToast }: { residenceId?: ResidenceScope; onCreate: () => void; onToast: Props['onToast'] }) {
  const visibleNotices = notices.filter(notice => noticeMatchesResidence(notice, residenceId));
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
      <SectionCard>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <SectionTitle title="Communication Center" subtitle="Target portal, email, SMS, and WhatsApp notices by community, tower, floor, owner group, tenant group, or risk segment." icon={BellRing} />
          <PrimaryButton icon={Send} onClick={onCreate}>Create Notice</PrimaryButton>
        </div>
        <TableShell columns={['Title', 'Audience', 'Channel', 'Sent Date', 'Delivery Rate', 'Read Rate', 'Reactions/Sentiment', 'Actions']} minWidth="1050px">
          {visibleNotices.map(notice => (
            <tr key={notice.id} className="border-t border-[rgba(46,127,255,0.08)] bg-[#0A1628]/70">
              <td className="px-4 py-4"><p className="text-[13px] font-black text-[#EEF3FA]">{notice.title}</p><p className="mt-1 text-[11px] text-[#7A94B4]">{notice.category}</p></td>
              <td className="px-4 py-4 text-[13px] text-[#A8B3C7]">{notice.audience}</td>
              <td className="px-4 py-4 text-[12px] text-[#A8B3C7]">{notice.channels.join(', ')}</td>
              <td className="px-4 py-4 text-[12px] text-[#A8B3C7]">{notice.sentDate}</td>
              <td className="px-4 py-4 font-mono text-[13px] text-[#EEF3FA]">{notice.deliveryRate}%</td>
              <td className="px-4 py-4 font-mono text-[13px] text-cyan-300">{notice.readRate}%</td>
              <td className="px-4 py-4 text-[12px] text-[#8FA6C3]">{notice.sentiment}</td>
              <td className="px-4 py-4 text-right"><ActionButton label="AI Draft" icon={Sparkles} onClick={() => onToast(`AI rewrote ${notice.title}`, 'info')} /></td>
            </tr>
          ))}
          {visibleNotices.length === 0 && (
            <tr className="border-t border-[rgba(46,127,255,0.08)] bg-[#0A1628]/70">
              <td colSpan={8} className="px-4 py-10 text-center text-[13px] text-[#7A94B4]">No notices match this residence filter.</td>
            </tr>
          )}
        </TableShell>
      </SectionCard>
      <AiPanel title="AI notice intelligence">
        <p>AI can draft notices, simplify tone, translate content, recommend audiences, and predict read rates. HVAC notices should target Tower B with WhatsApp plus portal for immediate reach.</p>
      </AiPanel>
    </div>
  );
}

function CreateNoticeModal({ onClose, onToast }: { onClose: () => void; onToast: Props['onToast'] }) {
  return (
    <ModalShell title="Send Notice" subtitle="Create, target, schedule, attach, and publish resident communications." onClose={onClose}>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="text-[12px] font-black text-[#7A94B4]">Title<input defaultValue="Tower B HVAC inspection" className="mt-2 h-10 w-full rounded-xl border border-[rgba(46,127,255,0.22)] bg-[#0A1628] px-3 text-[13px] text-[#EEF3FA] outline-none focus:border-[#E11D2E]" /></label>
        <label className="text-[12px] font-black text-[#7A94B4]">Category<select className="mt-2 h-10 w-full rounded-xl border border-[rgba(46,127,255,0.22)] bg-[#0A1628] px-3 text-[13px] text-[#EEF3FA] outline-none focus:border-[#E11D2E]"><option>Maintenance</option><option>Emergency</option><option>Community Event</option><option>Payment Reminder</option><option>Policy Update</option><option>Handover</option><option>General</option></select></label>
        <label className="text-[12px] font-black text-[#7A94B4]">Audience<select className="mt-2 h-10 w-full rounded-xl border border-[rgba(46,127,255,0.22)] bg-[#0A1628] px-3 text-[13px] text-[#EEF3FA] outline-none focus:border-[#E11D2E]"><option>All residents</option><option>Selected community</option><option>Tower/building</option><option>Floor</option><option>Unit group</option><option>Owners only</option><option>Tenants only</option><option>At-risk residents</option></select></label>
        <label className="text-[12px] font-black text-[#7A94B4]">Schedule send<input type="datetime-local" className="mt-2 h-10 w-full rounded-xl border border-[rgba(46,127,255,0.22)] bg-[#0A1628] px-3 text-[13px] text-[#EEF3FA] outline-none focus:border-[#E11D2E]" /></label>
      </div>
      <label className="mt-4 block text-[12px] font-black text-[#7A94B4]">Message<textarea rows={5} defaultValue="We are inspecting Tower B HVAC after a rise in cooling complaints. Please keep access available if your unit is contacted by the community team." className="mt-2 w-full rounded-xl border border-[rgba(46,127,255,0.22)] bg-[#0A1628] p-3 text-[13px] text-[#EEF3FA] outline-none focus:border-[#E11D2E]" /></label>
      <div className="mt-4 flex flex-wrap gap-2">{['portal', 'email', 'SMS', 'WhatsApp', 'attachment'].map(item => <Badge key={item}>{item}</Badge>)}</div>
      <AiPanel title="AI notice tools">
        <p>Draft notice, simplify tone, translate notice, recommend audience, and predict read rate. Predicted read rate: 82% with portal + WhatsApp.</p>
      </AiPanel>
      <div className="mt-5 flex justify-end gap-3">
        <SecondaryButton onClick={onClose}>Save Draft</SecondaryButton>
        <PrimaryButton icon={Send} onClick={() => { onToast('Notice scheduled across portal, email, SMS, and WhatsApp', 'success'); onClose(); }}>Send Notice</PrimaryButton>
      </div>
    </ModalShell>
  );
}

function PaymentsManager({ residenceId = 'all', onToast }: { residenceId?: ResidenceScope; onToast: Props['onToast'] }) {
  const visiblePayments = payments.filter(payment => matchesResidence(residenceId, getUnit(payment.unitId)?.communityId));
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
      <SectionCard>
        <SectionTitle title="Payments and Service Charges" subtitle="Service charges, amenity fees, penalties, maintenance charges, handover payments, and community fees." icon={CreditCard} />
        <TableShell columns={['Invoice ID', 'Resident', 'Unit', 'Amount', 'Due Date', 'Status', 'Category', 'Method', 'Actions']} minWidth="1120px">
          {visiblePayments.map(payment => {
            const resident = getResident(payment.residentId);
            const unit = getUnit(payment.unitId);
            return (
              <tr key={payment.id} className="border-t border-[rgba(46,127,255,0.08)] bg-[#0A1628]/70">
                <td className="px-4 py-4 font-mono text-[13px] font-black text-cyan-300">{payment.id}</td>
                <td className="px-4 py-4 text-[13px] font-bold text-[#EEF3FA]">{resident?.name}</td>
                <td className="px-4 py-4 font-mono text-[13px] text-[#A8B3C7]">{unit?.unitNumber}</td>
                <td className="px-4 py-4 font-mono text-[13px] text-[#EEF3FA]">{payment.currency} {payment.amount.toLocaleString()}</td>
                <td className="px-4 py-4 text-[12px] text-[#A8B3C7]">{payment.dueDate}</td>
                <td className="px-4 py-4"><Badge className={paymentStatusClass[payment.status]}>{payment.status}</Badge></td>
                <td className="px-4 py-4 text-[12px] text-[#A8B3C7]">{payment.category}</td>
                <td className="px-4 py-4 text-[12px] text-[#A8B3C7]">{payment.method}</td>
                <td className="px-4 py-4">
                  <div className="flex justify-end gap-1">
                    <ActionButton label="Send Reminder" icon={BellRing} onClick={() => onToast(`Payment reminder queued for ${payment.id}`, 'info')} />
                    <ActionButton label="View Invoice" icon={FileText} onClick={() => onToast(`Invoice preview ready for ${payment.id}`, 'info')} />
                    <ActionButton label="Mark Paid" icon={CheckCircle2} onClick={() => onToast(`${payment.id} marked paid in demo`, 'success')} />
                    <ActionButton label="Open Dispute" icon={AlertTriangle} onClick={() => onToast(`Dispute opened for ${payment.id}`, 'warning')} />
                  </div>
                </td>
              </tr>
            );
          })}
          {visiblePayments.length === 0 && (
            <tr className="border-t border-[rgba(46,127,255,0.08)] bg-[#0A1628]/70">
              <td colSpan={9} className="px-4 py-10 text-center text-[13px] text-[#7A94B4]">No payments match this residence filter.</td>
            </tr>
          )}
        </TableShell>
      </SectionCard>
      <AiPanel title="AI payment intelligence">
        <p>AI predicts default risk, recommends reminders, suggests payment plans, and forecasts collections. Highest risk: Bayz 102 handover disputes and overdue service charges.</p>
      </AiPanel>
    </div>
  );
}

function DocumentsVault({ residenceId = 'all', onToast }: { residenceId?: ResidenceScope; onToast: Props['onToast'] }) {
  const visibleDocuments = residentDocuments.filter(document => matchesResidence(residenceId, document.linkedCommunityId));
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
      <SectionCard>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <SectionTitle title="Resident Document Vault" subtitle="Upload, assign, control visibility, track expiry, request signatures, and audit downloads." icon={FileCheck2} />
          <PrimaryButton icon={Upload} onClick={() => onToast('Document upload flow opened', 'info')}>Upload Document</PrimaryButton>
        </div>
        <TableShell columns={['Document', 'Category', 'Resident / Unit', 'Visibility', 'Expiry', 'Signature', 'Status', 'Actions']} minWidth="1120px">
          {visibleDocuments.map(document => {
            const resident = getResident(document.linkedResidentId);
            const unit = getUnit(document.linkedUnitId);
            return (
              <tr key={document.id} className="border-t border-[rgba(46,127,255,0.08)] bg-[#0A1628]/70">
                <td className="px-4 py-4 text-[13px] font-black text-[#EEF3FA]">{document.name}</td>
                <td className="px-4 py-4 text-[13px] text-[#A8B3C7]">{document.category}</td>
                <td className="px-4 py-4 text-[13px] text-[#A8B3C7]">{resident?.name} / {unit?.unitNumber}</td>
                <td className="px-4 py-4 text-[12px] text-[#7A94B4]">{document.visibility}</td>
                <td className="px-4 py-4 text-[12px] text-[#A8B3C7]">{document.expiryDate}</td>
                <td className="px-4 py-4 text-[12px] text-[#A8B3C7]">{document.signatureRequired ? 'Required' : 'No'}</td>
                <td className="px-4 py-4"><Badge className={documentStatusClass[document.status]}>{document.status}</Badge></td>
                <td className="px-4 py-4">
                  <div className="flex justify-end gap-1">
                    <ActionButton label="View Document" icon={FileText} onClick={() => onToast(`Document preview ready for ${document.name}`, 'info')} />
                    <ActionButton label="Ask AI" icon={Sparkles} onClick={() => onToast(`AI summary generated for ${document.name}`, 'info')} />
                    <ActionButton label="Visibility Rules" icon={ShieldCheck} onClick={() => onToast(`Visibility controls ready for ${document.name}`, 'info')} />
                  </div>
                </td>
              </tr>
            );
          })}
          {visibleDocuments.length === 0 && (
            <tr className="border-t border-[rgba(46,127,255,0.08)] bg-[#0A1628]/70">
              <td colSpan={8} className="px-4 py-10 text-center text-[13px] text-[#7A94B4]">No documents match this residence filter.</td>
            </tr>
          )}
        </TableShell>
      </SectionCard>
      <AiPanel title="AI document intelligence">
        <p>AI can answer document questions, detect missing required documents, alert on expiry, and summarize handover packs. It flags 5 residents pending handover signatures.</p>
      </AiPanel>
    </div>
  );
}

function HandoverWarrantyCenter({ residenceId = 'all', onToast }: { residenceId?: ResidenceScope; onToast: Props['onToast'] }) {
  const visibleHandovers = handovers.filter(item => matchesResidence(residenceId, getUnit(item.unitId)?.communityId));
  const visibleWarrantyClaims = warrantyClaims.filter(claim => matchesResidence(residenceId, getUnit(claim.unitId)?.communityId));
  return (
    <div className="space-y-4">
      <SectionCard>
        <SectionTitle title="Handover & Warranty" subtitle="Appointments, handover checklists, snagging, DLP tracking, signatures, and move-in readiness." icon={ClipboardCheck} />
        <TableShell columns={['Unit', 'Resident/Owner', 'Handover Date', 'Checklist Status', 'Snags Open', 'Documents Signed', 'Warranty Status', 'Move-in Status', 'Actions']} minWidth="1120px">
          {visibleHandovers.map((item: HandoverRecord) => {
            const unit = getUnit(item.unitId);
            const resident = getResident(item.residentId);
            return (
              <tr key={item.id} className="border-t border-[rgba(46,127,255,0.08)] bg-[#0A1628]/70">
                <td className="px-4 py-4 font-mono text-[13px] text-cyan-300">{unit?.unitNumber}</td>
                <td className="px-4 py-4 text-[13px] font-bold text-[#EEF3FA]">{resident?.name}</td>
                <td className="px-4 py-4 text-[12px] text-[#A8B3C7]">{item.handoverDate}</td>
                <td className="px-4 py-4 text-[12px] text-[#A8B3C7]">{item.checklistStatus}</td>
                <td className="px-4 py-4 font-mono text-[13px] text-[#EEF3FA]">{item.snagsOpen}</td>
                <td className="px-4 py-4 text-[12px] text-[#A8B3C7]">{item.documentsSigned}</td>
                <td className="px-4 py-4 text-[12px] text-[#A8B3C7]">{item.warrantyStatus}</td>
                <td className="px-4 py-4"><Badge>{item.moveInStatus}</Badge></td>
                <td className="px-4 py-4 text-right"><ActionButton label="Readiness Summary" icon={Sparkles} onClick={() => onToast(`AI readiness summary created for ${unit?.unitNumber}`, 'info')} /></td>
              </tr>
            );
          })}
          {visibleHandovers.length === 0 && (
            <tr className="border-t border-[rgba(46,127,255,0.08)] bg-[#0A1628]/70">
              <td colSpan={9} className="px-4 py-10 text-center text-[13px] text-[#7A94B4]">No handover records match this residence filter.</td>
            </tr>
          )}
        </TableShell>
      </SectionCard>
      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <SectionCard>
          <SectionTitle title="Warranty Claims" subtitle="Claim status, warranty validity, assigned vendor, and closure evidence." />
          <TableShell columns={['Claim ID', 'Category', 'Unit', 'Reported Date', 'Warranty Valid?', 'Assigned Vendor', 'Status', 'Evidence']} minWidth="950px">
            {visibleWarrantyClaims.map(claim => (
              <tr key={claim.id} className="border-t border-[rgba(46,127,255,0.08)] bg-[#0A1628]/70">
                <td className="px-4 py-4 font-mono text-[13px] font-black text-cyan-300">{claim.id}</td>
                <td className="px-4 py-4 text-[13px] text-[#A8B3C7]">{claim.category}</td>
                <td className="px-4 py-4 font-mono text-[13px] text-[#A8B3C7]">{getUnit(claim.unitId)?.unitNumber}</td>
                <td className="px-4 py-4 text-[12px] text-[#A8B3C7]">{claim.reportedDate}</td>
                <td className="px-4 py-4"><Badge className={claim.warrantyValid ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : 'border-red-400/30 bg-red-400/10 text-red-300'}>{claim.warrantyValid ? 'Yes' : 'No'}</Badge></td>
                <td className="px-4 py-4 text-[12px] text-[#A8B3C7]">{claim.assignedVendor}</td>
                <td className="px-4 py-4 text-[12px] text-[#A8B3C7]">{claim.status}</td>
                <td className="px-4 py-4 text-[12px] text-[#8FA6C3]">{claim.evidence}</td>
              </tr>
            ))}
            {visibleWarrantyClaims.length === 0 && (
              <tr className="border-t border-[rgba(46,127,255,0.08)] bg-[#0A1628]/70">
                <td colSpan={8} className="px-4 py-10 text-center text-[13px] text-[#7A94B4]">No warranty claims match this residence filter.</td>
              </tr>
            )}
          </TableShell>
        </SectionCard>
        <AiPanel title="AI handover intelligence">
          <p>AI identifies repeated handover defects, predicts warranty claim risk, recommends vendor escalation, and summarizes readiness. Current alert: 3 overdue warranty defects in Bayz 102.</p>
        </AiPanel>
      </div>
    </div>
  );
}

function InsightCard({ insight, onToast }: { insight: Insight; onToast: Props['onToast'] }) {
  const severityClass = insight.severity === 'Critical' || insight.severity === 'High' ? 'border-red-400/30 bg-red-400/10 text-red-300' : insight.severity === 'Medium' ? 'border-amber-400/30 bg-amber-400/10 text-amber-300' : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300';
  return (
    <div className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#0A1628] p-4">
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-base font-black text-[#EEF3FA]">{insight.title}</h4>
        <Badge className={severityClass}>{insight.severity}</Badge>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <DetailCard label="Affected residents/units" value={insight.affected} />
        <DetailCard label="Reason" value={insight.reason} />
        <DetailCard label="Recommended action" value={insight.recommendedAction} />
      </div>
      <button type="button" onClick={() => onToast(`Task created: ${insight.recommendedAction}`, 'success')} className="mt-4 inline-flex h-9 items-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-3 text-[12px] font-black text-cyan-300">
        <Plus size={14} />
        Create Task
      </button>
    </div>
  );
}

function ResidentAIInsights({ residenceId = 'all', onToast }: { residenceId?: ResidenceScope; onToast: Props['onToast'] }) {
  const groups: Array<{ id: Insight['section']; title: string; subtitle: string }> = [
    { id: 'satisfaction', title: 'Resident Satisfaction Intelligence', subtitle: 'Satisfaction score, at-risk residents, sentiment trend, and top complaint drivers.' },
    { id: 'operations', title: 'Operational Pattern Detection', subtitle: 'Repeated issues by tower, recurring asset complaints, noisy categories, and SLA risk.' },
    { id: 'engagement', title: 'Community Engagement', subtitle: 'Notice read rates, amenity booking trends, event participation, and low engagement groups.' },
    { id: 'revenue', title: 'Revenue / Payment Risk', subtitle: 'Overdue payments, high-risk residents, recommended reminders, and collection forecasts.' },
    { id: 'actions', title: 'Recommended Actions', subtitle: 'Call resident, send notice, inspect asset, escalate vendor, offer payment plan, or schedule maintenance.' },
  ];
  const visibleInsights = insights.filter(insight => insightMatchesResidence(insight, residenceId));

  return (
    <div className="space-y-4">
      {groups.map(group => (
        <SectionCard key={group.id}>
          <SectionTitle title={group.title} subtitle={group.subtitle} icon={Sparkles} />
          <div className="space-y-3">
            {visibleInsights.filter(insight => insight.section === group.id).map(insight => <InsightCard key={insight.id} insight={insight} onToast={onToast} />)}
            {visibleInsights.filter(insight => insight.section === group.id).length === 0 && (
              <p className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#0A1628] p-4 text-[13px] text-[#7A94B4]">No AI insight is currently flagged for {getResidenceLabel(residenceId)} in this category.</p>
            )}
          </div>
        </SectionCard>
      ))}
    </div>
  );
}

function ResidentPortalSettings() {
  const rows = [
    'Request categories enabled',
    'Payment module on',
    'Amenity booking on',
    'Handover module on',
    'Resident confirmation required',
    'Resident registration approval required',
    'Channels enabled',
    'Notification templates',
    'Satisfaction scoring enabled',
    'AI concierge enabled',
  ];

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
      <SectionCard>
        <SectionTitle title="ResidentPortal Settings" subtitle="Module controls and operational policies." icon={Settings} />
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((row, index) => (
            <div key={row} className="flex items-center justify-between gap-4 rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#0A1628] p-4">
              <span className="text-[13px] font-bold text-[#BCC8DC]">{row}</span>
              <span className={`h-6 w-11 rounded-full border p-0.5 ${index === 5 ? 'border-amber-400/45 bg-amber-400/20' : 'border-emerald-400/45 bg-emerald-400/20'}`}>
                <span className={`block h-5 w-5 rounded-full bg-white ${index === 5 ? 'translate-x-0' : 'translate-x-5'}`} />
              </span>
            </div>
          ))}
        </div>
      </SectionCard>
      <AiPanel title="Role and workflow guardrails">
        <p>Managers see scoped communities. Contractors only see assigned requests. Residents and owners see their own units, requests, payments, documents, notices, bookings, and handover items.</p>
      </AiPanel>
    </div>
  );
}

export function ResidentPortalDashboard({ onToast }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [query, setQuery] = useState('');
  const [selectedResidenceId, setSelectedResidenceId] = useState<ResidenceScope>('all');
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ResidentRequest | null>(null);
  const [noticeModalOpen, setNoticeModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [communityWizardOpen, setCommunityWizardOpen] = useState(false);

  const kpiIcons = useMemo(() => [Users, Home, Wrench, AlertTriangle, CreditCard, CalendarClock, BellRing, Star, ShieldCheck], []);
  const visibleKpis = useMemo(() => getScopedKpis(selectedResidenceId), [selectedResidenceId]);
  const showSearch = activeTab === 'residents';

  return (
    <div className="custom-scrollbar h-full min-h-0 overflow-x-hidden overflow-y-auto bg-[#07111F] px-5 py-4 text-[#EEF3FA]">
      <div className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-black text-[#E11D2E]">
              <Home size={14} />
              Resident, owner, and community experience
            </div>
            <h1 className="text-3xl font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>ResidentPortal</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#8FA6C3]">Resident lifecycle, community operations, requests, communications, and experience intelligence.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex h-10 min-w-[230px] items-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-3 text-[12px] font-black text-cyan-300">
              <Building2 size={16} />
              <span className="hidden text-[10px] uppercase tracking-[0.08em] text-[#7A94B4] sm:inline">Residence</span>
              <select
                value={selectedResidenceId}
                onChange={event => setSelectedResidenceId(event.target.value as ResidenceScope)}
                aria-label="Filter ResidentPortal by residence"
                className="min-w-0 flex-1 bg-transparent text-[12px] font-black text-cyan-300 outline-none"
              >
                <option value="all">All residences</option>
                {communities.map(community => <option key={community.id} value={community.id}>{community.name}</option>)}
              </select>
            </label>
            <PrimaryButton icon={Plus} onClick={() => onToast('Add Resident workflow ready', 'info')}>Add Resident</PrimaryButton>
            <SecondaryButton icon={Upload} onClick={() => setBulkModalOpen(true)}>Bulk Upload</SecondaryButton>
            <SecondaryButton icon={Building2} onClick={() => setCommunityWizardOpen(true)}>Create Community</SecondaryButton>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5 2xl:grid-cols-9">
        {visibleKpis.map((kpi, index) => <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} delta={kpi.delta} icon={kpiIcons[index]} />)}
      </div>

      <div className="mt-4 rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-3">
        <div className="custom-scrollbar flex gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-[12px] font-black transition-colors ${
                activeTab === tab.id ? 'bg-[#E11D2E]/16 text-red-100 ring-1 ring-[#E11D2E]/35' : 'text-[#7A94B4] hover:bg-white/5 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {showSearch && (
        <div className="mt-4 rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
          <label className="relative block max-w-[460px]">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A94B4]" />
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search residents, units, or communities..." className="h-10 w-full rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#0A1628] pl-11 pr-4 text-[13px] text-[#EEF3FA] outline-none placeholder:text-[#5A6E88] focus:border-[#E11D2E]" />
          </label>
        </div>
      )}

      <div className="mt-4">
        {activeTab === 'overview' && <ResidentOverview residenceId={selectedResidenceId} />}
        {activeTab === 'residents' && <ResidentsTable query={query} residenceId={selectedResidenceId} onSelect={setSelectedResident} onToast={onToast} />}
        {activeTab === 'communities' && <CommunitiesTab residenceId={selectedResidenceId} onCreate={() => setCommunityWizardOpen(true)} />}
        {activeTab === 'requests' && <ResidentRequestsTable residenceId={selectedResidenceId} onSelect={setSelectedRequest} onToast={onToast} />}
        {activeTab === 'incidents' && <ResidentIncidentsManager residenceId={selectedResidenceId} onToast={onToast} />}
        {activeTab === 'amenities' && <AmenitiesManager residenceId={selectedResidenceId} onToast={onToast} />}
        {activeTab === 'notices' && <NoticesCenter residenceId={selectedResidenceId} onCreate={() => setNoticeModalOpen(true)} onToast={onToast} />}
        {activeTab === 'payments' && <PaymentsManager residenceId={selectedResidenceId} onToast={onToast} />}
        {activeTab === 'documents' && <DocumentsVault residenceId={selectedResidenceId} onToast={onToast} />}
        {activeTab === 'handover' && <HandoverWarrantyCenter residenceId={selectedResidenceId} onToast={onToast} />}
        {activeTab === 'ai' && <ResidentAIInsights residenceId={selectedResidenceId} onToast={onToast} />}
        {activeTab === 'settings' && <ResidentPortalSettings />}
      </div>

      {selectedResident && <ResidentProfileDrawer resident={selectedResident} onClose={() => setSelectedResident(null)} onToast={onToast} />}
      {selectedRequest && <RequestDetailDrawer request={selectedRequest} onClose={() => setSelectedRequest(null)} onToast={onToast} />}
      {noticeModalOpen && <CreateNoticeModal onClose={() => setNoticeModalOpen(false)} onToast={onToast} />}
      {bulkModalOpen && <BulkResidentUploadModal onClose={() => setBulkModalOpen(false)} onToast={onToast} />}
      {communityWizardOpen && <CreateCommunityWizard onClose={() => setCommunityWizardOpen(false)} onToast={onToast} />}
    </div>
  );
}
