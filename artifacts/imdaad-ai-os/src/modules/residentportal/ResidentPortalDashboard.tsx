import { useMemo, useState, type ComponentType, type ReactNode } from 'react';
import {
  AlertTriangle,
  BellRing,
  Bot,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FileText,
  Home,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import {
  communityServices,
  getResident,
  getUnit,
  notices,
  payments,
  residentDocuments,
  residentRequests,
  residents,
  type DocumentStatus,
  type Notice,
  type PaymentStatus,
  type RequestStatus,
  type Resident,
  type ResidentDocument,
  type ResidentRequest,
  type ResidentStatus,
  type ResidentType,
} from './data';

type Tab = 'residents' | 'requests' | 'notices' | 'payments' | 'documents' | 'community' | 'settings';

interface Props {
  onToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

const tabs: Array<{ id: Tab; label: string }> = [
  { id: 'residents', label: 'Residents' },
  { id: 'requests', label: 'Requests' },
  { id: 'notices', label: 'Notices' },
  { id: 'payments', label: 'Payments' },
  { id: 'documents', label: 'Documents' },
  { id: 'community', label: 'Community' },
  { id: 'settings', label: 'Settings' },
];

const requestStatusClass: Record<RequestStatus, string> = {
  Submitted: 'border-sky-400/30 bg-sky-400/10 text-sky-300',
  Reviewed: 'border-blue-400/30 bg-blue-400/10 text-blue-300',
  Assigned: 'border-violet-400/30 bg-violet-400/10 text-violet-200',
  'In Progress': 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  'Awaiting Resident Confirmation': 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300',
  Resolved: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  Closed: 'border-slate-400/30 bg-slate-400/10 text-slate-300',
};

const residentStatusClass: Record<ResidentStatus, string> = {
  Active: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  Pending: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  Inactive: 'border-slate-400/30 bg-slate-400/10 text-slate-300',
};

const paymentStatusClass: Record<PaymentStatus, string> = {
  Paid: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  Pending: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  Overdue: 'border-red-400/30 bg-red-400/10 text-red-300',
  Failed: 'border-red-400/30 bg-red-400/10 text-red-300',
};

const documentStatusClass: Record<DocumentStatus, string> = {
  Current: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  'Expiring Soon': 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  Expired: 'border-red-400/30 bg-red-400/10 text-red-300',
  Draft: 'border-slate-400/30 bg-slate-400/10 text-slate-300',
};

function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black ${className ?? 'border-[rgba(46,127,255,0.2)] bg-white/5 text-[#B8C7DB]'}`}>
      {children}
    </span>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-8 w-8 place-items-center rounded-lg border" style={{ borderColor: `${accent}55`, background: `${accent}18`, color: accent }}>
          <Icon size={17} />
        </span>
        {sub && <span className="text-[10px] font-black text-emerald-300">{sub}</span>}
      </div>
      <p className="mt-4 text-2xl font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{value}</p>
      <p className="mt-1 text-[12px] uppercase tracking-[0.12em] text-[#7A94B4]">{label}</p>
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

function DrawerShell({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/55 backdrop-blur-sm">
      <button type="button" aria-label="Dismiss overlay" className="absolute inset-0 cursor-default" onClick={onClose} />
      <aside className="custom-scrollbar relative z-10 h-full w-full max-w-[760px] overflow-y-auto border-l border-[rgba(46,127,255,0.22)] bg-[#07111F] shadow-2xl shadow-black/60">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[rgba(46,127,255,0.14)] bg-[#07111F]/95 px-6 py-5 backdrop-blur">
          <div>
            <h2 className="text-2xl font-black leading-7 text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{title}</h2>
            {subtitle && <p className="mt-2 text-[13px] text-[#8FA6C3]">{subtitle}</p>}
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

function DetailCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#0A1628] p-4">
      <p className="text-[11px] uppercase tracking-[0.12em] text-[#7A94B4]">{label}</p>
      <div className="mt-2 text-[14px] font-bold leading-5 text-[#EEF3FA]">{value}</div>
    </div>
  );
}

function ResidentProfileDrawer({ resident, onClose, onToast }: { resident: Resident; onClose: () => void; onToast: Props['onToast'] }) {
  const unit = getUnit(resident.unitId);
  const requests = residentRequests.filter(request => request.residentId === resident.id);
  const residentPayments = payments.filter(payment => payment.residentId === resident.id);
  const docs = residentDocuments.filter(document => document.linkedResidentId === resident.id);

  return (
    <DrawerShell title={resident.name} subtitle={`${resident.type} - ${unit?.siteName ?? 'Site'} - Unit ${unit?.unitNumber ?? resident.unitId}`} onClose={onClose}>
      <div className="grid gap-4 md:grid-cols-2">
        <DetailCard label="Profile" value={<>{resident.email}<br />{resident.phone}</>} />
        <DetailCard label="Unit details" value={`${unit?.building ?? 'Building'} / Floor ${unit?.floor ?? '-'}`} />
        <DetailCard label="Status" value={<Badge className={residentStatusClass[resident.status]}>{resident.status}</Badge>} />
        <DetailCard label="Access permissions" value={`${resident.communicationPreference} preferred - own unit only`} />
      </div>

      <section className="mt-6 rounded-xl border border-violet-300/20 bg-violet-300/10 p-4">
        <div className="flex items-center gap-2 text-[13px] font-black text-violet-100">
          <Sparkles size={16} />
          AI resident summary
        </div>
        <p className="mt-3 text-[14px] leading-6 text-[#E5D9FF]">
          {resident.name} has {resident.openRequests} open request{resident.openRequests === 1 ? '' : 's'}, satisfaction at {resident.satisfaction}%, and payment status marked {resident.paymentStatus.toLowerCase()}. AI recommends proactive follow-up on repeat or high-priority service requests before the next notice cycle.
        </p>
      </section>

      <section className="mt-6">
        <h3 className="text-[14px] font-black text-[#EEF3FA]">Requests</h3>
        <div className="mt-3 space-y-2">
          {requests.map(request => (
            <div key={request.id} className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#0A1628] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-[11px] font-black text-cyan-300">{request.id}</p>
                  <p className="mt-1 text-[14px] font-bold text-[#EEF3FA]">{request.category}</p>
                </div>
                <Badge className={requestStatusClass[request.status]}>{request.status}</Badge>
              </div>
              <p className="mt-2 text-[12px] leading-5 text-[#8FA6C3]">{request.description}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#0A1628] p-4">
          <h3 className="text-[13px] font-black text-[#EEF3FA]">Payments</h3>
          <div className="mt-3 space-y-2">
            {residentPayments.map(payment => (
              <div key={payment.id} className="flex items-center justify-between rounded-lg bg-[#07111F] p-3 text-[12px]">
                <span className="font-mono text-cyan-300">{payment.id}</span>
                <Badge className={paymentStatusClass[payment.status]}>{payment.status}</Badge>
              </div>
            ))}
            {residentPayments.length === 0 && <p className="text-[12px] text-[#7A94B4]">No payments linked.</p>}
          </div>
        </section>
        <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#0A1628] p-4">
          <h3 className="text-[13px] font-black text-[#EEF3FA]">Documents</h3>
          <div className="mt-3 space-y-2">
            {docs.map(document => (
              <div key={document.id} className="rounded-lg bg-[#07111F] p-3 text-[12px] text-[#BCC8DC]">{document.name}</div>
            ))}
            {docs.length === 0 && <p className="text-[12px] text-[#7A94B4]">No resident documents linked.</p>}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#0A1628] p-4">
        <h3 className="text-[13px] font-black text-[#EEF3FA]">Communication history</h3>
        <div className="mt-3 space-y-3 text-[13px] text-[#BCC8DC]">
          <p>Portal message: request status update sent after technician assignment.</p>
          <p>WhatsApp notice: chilled water maintenance acknowledged.</p>
        </div>
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={() => onToast(`Message drafted for ${resident.name}`, 'info')} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#E11D2E] px-4 text-[12px] font-black text-white">
          <MessageCircle size={16} />
          Send Message
        </button>
        <button type="button" onClick={() => onToast(`Request form ready for ${resident.name}`, 'info')} className="inline-flex h-10 items-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-4 text-[12px] font-black text-cyan-300">
          <Wrench size={16} />
          Create Request
        </button>
      </div>
    </DrawerShell>
  );
}

function RequestDetailDrawer({ request, onClose, onToast }: { request: ResidentRequest; onClose: () => void; onToast: Props['onToast'] }) {
  const resident = getResident(request.residentId);
  const unit = getUnit(request.unitId);

  return (
    <DrawerShell title={request.id} subtitle={`${request.category} - ${resident?.name ?? 'Resident'} - Unit ${unit?.unitNumber ?? request.unitId}`} onClose={onClose}>
      <div className="grid gap-4 md:grid-cols-2">
        <DetailCard label="Status" value={<Badge className={requestStatusClass[request.status]}>{request.status}</Badge>} />
        <DetailCard label="SLA / ETA" value={`${request.sla} - ${request.eta}`} />
        <DetailCard label="Assigned to" value={request.assignedTo} />
        <DetailCard label="Source" value={`${request.source} -> SnapFix / ServiceDesk`} />
      </div>

      <section className="mt-6 rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#0A1628] p-4">
        <h3 className="text-[13px] font-black text-[#EEF3FA]">Issue description</h3>
        <p className="mt-3 text-[14px] leading-6 text-[#BCC8DC]">{request.description}</p>
      </section>

      <section className="mt-4 rounded-xl border border-violet-300/20 bg-violet-300/10 p-4">
        <div className="flex items-center gap-2 text-[13px] font-black text-violet-100">
          <Bot size={16} />
          AI classification
        </div>
        <p className="mt-3 text-[14px] leading-6 text-[#E5D9FF]">{request.aiClassification}. {request.aiSummary}</p>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#0A1628] p-4">
          <h3 className="text-[13px] font-black text-[#EEF3FA]">Evidence</h3>
          <div className="mt-3 space-y-2">
            {request.evidence.map(item => (
              <div key={item} className="rounded-lg border border-[rgba(46,127,255,0.12)] bg-[#07111F] p-3 text-[12px] text-[#BCC8DC]">
                {item}
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#0A1628] p-4">
          <h3 className="text-[13px] font-black text-[#EEF3FA]">Timeline</h3>
          <div className="mt-4 space-y-4">
            {request.timeline.map(item => (
              <div key={`${item.label}-${item.at}`} className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(6,182,212,0.45)]" />
                <div>
                  <p className="text-[13px] font-black text-[#EEF3FA]">{item.label} <span className="font-mono text-[11px] text-[#7A94B4]">{item.at}</span></p>
                  <p className="mt-1 text-[12px] leading-5 text-[#8FA6C3]">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-4 rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#0A1628] p-4">
        <h3 className="text-[13px] font-black text-[#EEF3FA]">Resident communication</h3>
        <div className="mt-3 rounded-xl bg-[#07111F] p-4 text-[13px] leading-6 text-[#BCC8DC]">
          Template ready: "We have reviewed your request and assigned it to {request.assignedTo}. ETA is {request.eta}."
        </div>
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={() => onToast(`Resident update sent for ${request.id}`, 'success')} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#E11D2E] px-4 text-[12px] font-black text-white">
          <Send size={16} />
          Message Resident
        </button>
        <button type="button" onClick={() => onToast(`Escalation drafted for ${request.id}`, 'warning')} className="inline-flex h-10 items-center gap-2 rounded-xl border border-amber-300/25 bg-amber-300/10 px-4 text-[12px] font-black text-amber-300">
          <AlertTriangle size={16} />
          Escalate
        </button>
      </div>
    </DrawerShell>
  );
}

function CreateNoticeModal({ onClose, onToast }: { onClose: () => void; onToast: Props['onToast'] }) {
  const [title, setTitle] = useState('Tower A chilled water maintenance');
  const [message, setMessage] = useState('Please note that chilled water maintenance is scheduled this Thursday between 10:00 and 14:00. Cooling may fluctuate during the work window.');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <button type="button" aria-label="Dismiss notice modal" className="absolute inset-0 cursor-default" onClick={onClose} />
      <section className="relative z-10 w-full max-w-[720px] rounded-2xl border border-[rgba(46,127,255,0.22)] bg-[#07111F] p-5 shadow-2xl shadow-black/60">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#E11D2E]">Create notice</p>
            <h2 className="mt-2 text-2xl font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Send Community Notice</h2>
            <p className="mt-2 text-[13px] text-[#8FA6C3]">AI can draft and target notices across portal, email, WhatsApp, and SMS.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close notice modal" className="rounded-lg p-2 text-[#7A94B4] hover:bg-white/5 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="text-[11px] font-black uppercase tracking-[0.12em] text-[#7A94B4]">
            Title
            <input value={title} onChange={event => setTitle(event.target.value)} className="mt-2 h-10 w-full rounded-xl border border-[rgba(46,127,255,0.22)] bg-[#0A1628] px-3 text-[13px] normal-case tracking-normal text-[#EEF3FA] outline-none focus:border-[#E11D2E]" />
          </label>
          <label className="text-[11px] font-black uppercase tracking-[0.12em] text-[#7A94B4]">
            Category
            <select className="mt-2 h-10 w-full rounded-xl border border-[rgba(46,127,255,0.22)] bg-[#0A1628] px-3 text-[13px] normal-case tracking-normal text-[#EEF3FA] outline-none focus:border-[#E11D2E]">
              <option>Maintenance notice</option>
              <option>Emergency alert</option>
              <option>Payment reminder</option>
              <option>Event notice</option>
              <option>Policy update</option>
            </select>
          </label>
          <label className="text-[11px] font-black uppercase tracking-[0.12em] text-[#7A94B4]">
            Audience
            <select className="mt-2 h-10 w-full rounded-xl border border-[rgba(46,127,255,0.22)] bg-[#0A1628] px-3 text-[13px] normal-case tracking-normal text-[#EEF3FA] outline-none focus:border-[#E11D2E]">
              <option>All residents</option>
              <option>Tower A residents</option>
              <option>Owners only</option>
              <option>Tenants only</option>
              <option>Floor group</option>
            </select>
          </label>
          <label className="text-[11px] font-black uppercase tracking-[0.12em] text-[#7A94B4]">
            Schedule
            <input type="datetime-local" className="mt-2 h-10 w-full rounded-xl border border-[rgba(46,127,255,0.22)] bg-[#0A1628] px-3 text-[13px] normal-case tracking-normal text-[#EEF3FA] outline-none focus:border-[#E11D2E]" />
          </label>
        </div>

        <label className="mt-4 block text-[11px] font-black uppercase tracking-[0.12em] text-[#7A94B4]">
          Message
          <textarea value={message} onChange={event => setMessage(event.target.value)} rows={5} className="mt-2 w-full rounded-xl border border-[rgba(46,127,255,0.22)] bg-[#0A1628] p-3 text-[13px] normal-case tracking-normal text-[#EEF3FA] outline-none focus:border-[#E11D2E]" />
        </label>

        <div className="mt-4 rounded-xl border border-violet-300/20 bg-violet-300/10 p-4">
          <div className="flex items-center gap-2 text-[13px] font-black text-violet-100">
            <Sparkles size={16} />
            AI draft check
          </div>
          <p className="mt-2 text-[13px] leading-6 text-[#E5D9FF]">Tone is clear and actionable. Recommended channels: Portal + WhatsApp for immediate reach, email for audit trail.</p>
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onClose} className="h-10 rounded-xl border border-[rgba(46,127,255,0.22)] px-4 text-[12px] font-black text-[#B8C7DB]">Save Draft</button>
          <button type="button" onClick={() => { onToast(`Notice "${title}" scheduled`, 'success'); onClose(); }} className="h-10 rounded-xl bg-[#E11D2E] px-4 text-[12px] font-black text-white">Send Notice</button>
        </div>
      </section>
    </div>
  );
}

function ResidentsTable({ onSelect, onToast }: { onSelect: (resident: Resident) => void; onToast: Props['onToast'] }) {
  return (
    <TableShell columns={['Resident Name', 'Unit', 'Site / Building', 'Type', 'Status', 'Open Requests', 'Payment', 'Last Activity', 'Actions']}>
      {residents.map(resident => {
        const unit = getUnit(resident.unitId);
        return (
          <tr key={resident.id} onClick={() => onSelect(resident)} className="cursor-pointer border-t border-[rgba(46,127,255,0.08)] bg-[#0A1628]/70 transition-colors hover:bg-white/[0.045]">
            <td className="px-4 py-4 align-top">
              <p className="text-[14px] font-black text-[#EEF3FA]">{resident.name}</p>
              <p className="mt-1 text-[11px] text-[#7A94B4]">{resident.email}</p>
            </td>
            <td className="px-4 py-4 align-top font-mono text-[13px] text-cyan-300">{unit?.unitNumber}</td>
            <td className="px-4 py-4 align-top text-[13px] text-[#A8B3C7]">{unit?.siteName}<br /><span className="text-[11px] text-[#7A94B4]">{unit?.building}</span></td>
            <td className="px-4 py-4 align-top text-[13px] text-[#A8B3C7]">{resident.type}</td>
            <td className="px-4 py-4 align-top"><Badge className={residentStatusClass[resident.status]}>{resident.status}</Badge></td>
            <td className="px-4 py-4 align-top font-mono text-[13px] text-[#EEF3FA]">{resident.openRequests}</td>
            <td className="px-4 py-4 align-top"><Badge className={paymentStatusClass[resident.paymentStatus]}>{resident.paymentStatus}</Badge></td>
            <td className="px-4 py-4 align-top text-[12px] text-[#7A94B4]">{resident.lastActivity}</td>
            <td className="px-4 py-4 align-top">
              <div className="flex justify-end gap-1">
                <ActionButton label="View Profile" icon={Users} onClick={() => onSelect(resident)} />
                <ActionButton label="Send Message" icon={MessageCircle} onClick={() => onToast(`Message drafted for ${resident.name}`, 'info')} />
                <ActionButton label="Create Request" icon={Wrench} onClick={() => onToast(`New request started for ${resident.name}`, 'info')} />
                <ActionButton label="Deactivate" icon={X} danger onClick={() => onToast(`${resident.name} deactivate flow requires approval`, 'warning')} />
              </div>
            </td>
          </tr>
        );
      })}
    </TableShell>
  );
}

function RequestsTable({ onSelect, onToast }: { onSelect: (request: ResidentRequest) => void; onToast: Props['onToast'] }) {
  return (
    <TableShell columns={['Request ID', 'Resident', 'Unit', 'Category', 'Priority', 'Status', 'SLA', 'Assigned To', 'Source', 'Created At', 'Actions']}>
      {residentRequests.map(request => {
        const resident = getResident(request.residentId);
        const unit = getUnit(request.unitId);
        return (
          <tr key={request.id} onClick={() => onSelect(request)} className="cursor-pointer border-t border-[rgba(46,127,255,0.08)] bg-[#0A1628]/70 transition-colors hover:bg-white/[0.045]">
            <td className="px-4 py-4 align-top font-mono text-[13px] font-black text-cyan-300">{request.id}</td>
            <td className="px-4 py-4 align-top text-[13px] font-bold text-[#EEF3FA]">{resident?.name}</td>
            <td className="px-4 py-4 align-top font-mono text-[13px] text-[#A8B3C7]">{unit?.unitNumber}</td>
            <td className="px-4 py-4 align-top text-[13px] text-[#A8B3C7]">{request.category}</td>
            <td className="px-4 py-4 align-top"><Badge className={request.priority === 'High' || request.priority === 'Critical' ? 'border-red-400/30 bg-red-400/10 text-red-300' : 'border-amber-400/30 bg-amber-400/10 text-amber-300'}>{request.priority}</Badge></td>
            <td className="px-4 py-4 align-top"><Badge className={requestStatusClass[request.status]}>{request.status}</Badge></td>
            <td className="px-4 py-4 align-top text-[12px] text-[#A8B3C7]">{request.sla}</td>
            <td className="px-4 py-4 align-top text-[12px] text-[#A8B3C7]">{request.assignedTo}</td>
            <td className="px-4 py-4 align-top text-[12px] text-[#7A94B4]">{request.source}</td>
            <td className="px-4 py-4 align-top text-[12px] text-[#7A94B4]">{request.createdAt}</td>
            <td className="px-4 py-4 align-top">
              <div className="flex justify-end gap-1">
                <ActionButton label="Open" icon={ChevronRight} onClick={() => onSelect(request)} />
                <ActionButton label="Assign" icon={Users} onClick={() => onToast(`${request.id} assignment panel ready`, 'info')} />
                <ActionButton label="Message Resident" icon={MessageCircle} onClick={() => onToast(`Resident message drafted for ${request.id}`, 'info')} />
                <ActionButton label="Escalate" icon={AlertTriangle} danger onClick={() => onToast(`${request.id} escalation drafted`, 'warning')} />
              </div>
            </td>
          </tr>
        );
      })}
    </TableShell>
  );
}

function TableShell({ columns, children }: { columns: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)]">
      <table className="w-full min-w-[1180px] text-left">
        <thead className="bg-[#0A1628]/85">
          <tr className="text-[11px] font-black uppercase tracking-[0.08em] text-[#5A6E88]">
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

function NoticeCenter({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
      <div className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Notice Center</h3>
            <p className="mt-1 text-[12px] text-[#8FA6C3]">Create, schedule, and track delivery across resident channels.</p>
          </div>
          <button type="button" onClick={onCreate} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#E11D2E] px-4 text-[12px] font-black text-white">
            <Send size={15} />
            Create Notice
          </button>
        </div>
        <div className="space-y-3">
          {notices.map(notice => (
            <div key={notice.id} className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#0A1628] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[14px] font-black text-[#EEF3FA]">{notice.title}</p>
                  <p className="mt-2 max-w-2xl text-[12px] leading-5 text-[#8FA6C3]">{notice.message}</p>
                </div>
                <Badge className={notice.status === 'Sent' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : 'border-amber-400/30 bg-amber-400/10 text-amber-300'}>{notice.status}</Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge>{notice.audience}</Badge>
                <Badge>{notice.category}</Badge>
                {notice.channels.map(channel => <Badge key={channel}>{channel}</Badge>)}
                <Badge>{notice.readRate}% read</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
      <AiPanel title="AI notice intelligence">
        <p>AI flags Tower A cooling notices as high-impact because related HVAC requests are rising. Suggested next action: send maintenance window notice and prepare a post-work satisfaction check.</p>
      </AiPanel>
    </div>
  );
}

function PaymentsTable({ onToast }: { onToast: Props['onToast'] }) {
  return (
    <TableShell columns={['Invoice ID', 'Resident / Owner', 'Unit', 'Amount', 'Due Date', 'Status', 'Method', 'Actions']}>
      {payments.map(payment => {
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
            <td className="px-4 py-4 text-[12px] text-[#A8B3C7]">{payment.method}</td>
            <td className="px-4 py-4">
              <div className="flex justify-end gap-1">
                <ActionButton label="Send Reminder" icon={BellRing} onClick={() => onToast(`Payment reminder queued for ${payment.id}`, 'info')} />
                <ActionButton label="View Invoice" icon={FileText} onClick={() => onToast(`Invoice preview ready for ${payment.id}`, 'info')} />
                <ActionButton label="Mark Paid" icon={CheckCircle2} onClick={() => onToast(`${payment.id} marked paid in demo`, 'success')} />
              </div>
            </td>
          </tr>
        );
      })}
    </TableShell>
  );
}

function DocumentsTable({ onToast }: { onToast: Props['onToast'] }) {
  return (
    <TableShell columns={['Document Name', 'Category', 'Linked Unit / Resident', 'Visibility', 'Expiry', 'Status', 'Actions']}>
      {residentDocuments.map(document => {
        const resident = getResident(document.linkedResidentId);
        const unit = getUnit(document.linkedUnitId);
        return (
          <tr key={document.id} className="border-t border-[rgba(46,127,255,0.08)] bg-[#0A1628]/70">
            <td className="px-4 py-4 text-[13px] font-black text-[#EEF3FA]">{document.name}</td>
            <td className="px-4 py-4 text-[13px] text-[#A8B3C7]">{document.category}</td>
            <td className="px-4 py-4 text-[13px] text-[#A8B3C7]">{unit?.unitNumber} / {resident?.name}</td>
            <td className="px-4 py-4 text-[12px] text-[#7A94B4]">{document.visibility}</td>
            <td className="px-4 py-4 text-[12px] text-[#A8B3C7]">{document.expiryDate}</td>
            <td className="px-4 py-4"><Badge className={documentStatusClass[document.status]}>{document.status}</Badge></td>
            <td className="px-4 py-4">
              <div className="flex justify-end gap-1">
                <ActionButton label="View Document" icon={FileText} onClick={() => onToast(`Document preview ready for ${document.name}`, 'info')} />
                <ActionButton label="Visibility Rules" icon={ShieldCheck} onClick={() => onToast(`Visibility controls ready for ${document.name}`, 'info')} />
              </div>
            </td>
          </tr>
        );
      })}
    </TableShell>
  );
}

function CommunityServicesGrid({ onOpen }: { onOpen: (service: (typeof communityServices)[number]) => void }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {communityServices.map(service => (
        <button key={service.id} type="button" onClick={() => onOpen(service)} className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-5 text-left transition-colors hover:border-[#E11D2E]/45 hover:bg-[#112040]">
          <div className="flex items-start justify-between gap-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-[#E11D2E]/30 bg-[#E11D2E]/12 text-red-200">
              <Home size={18} />
            </span>
            <span className="font-mono text-2xl font-black text-[#EEF3FA]">{service.count}</span>
          </div>
          <h3 className="mt-5 text-lg font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{service.title}</h3>
          <p className="mt-2 text-[13px] leading-6 text-[#8FA6C3]">{service.detail}</p>
          <p className="mt-4 inline-flex items-center gap-2 text-[12px] font-black text-cyan-300">
            Open flow
            <ChevronRight size={14} />
          </p>
        </button>
      ))}
    </div>
  );
}

function SettingsPanel() {
  const rows = [
    'Request categories enabled',
    'Payment module enabled',
    'Documents enabled',
    'Resident confirmation required',
    'WhatsApp communication channel',
    'Notice approval workflow',
    'Invite-only resident registration',
  ];

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
      <div className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-5">
        <h3 className="text-lg font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>ResidentPortal Settings</h3>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {rows.map((row, index) => (
            <div key={row} className="flex items-center justify-between gap-4 rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#0A1628] p-4">
              <span className="text-[13px] font-bold text-[#BCC8DC]">{row}</span>
              <span className={`h-6 w-11 rounded-full border p-0.5 ${index === 0 || index === 3 || index === 6 ? 'border-emerald-400/45 bg-emerald-400/20' : 'border-[#E11D2E]/35 bg-[#E11D2E]/16'}`}>
                <span className={`block h-5 w-5 rounded-full bg-white ${index === 0 || index === 3 || index === 6 ? 'translate-x-5' : 'translate-x-0'}`} />
              </span>
            </div>
          ))}
        </div>
      </div>
      <AiPanel title="Role access assumptions">
        <p>Superadmin sees all residents and settings. Management is scoped to assigned sites. Contractors only see assigned requests. Resident and owner users only see their own unit, requests, documents, messages, and payments.</p>
      </AiPanel>
    </div>
  );
}

function AiPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-violet-300/22 bg-violet-300/10 p-5">
      <div className="flex items-center gap-2 text-[13px] font-black uppercase tracking-[0.16em] text-violet-200">
        <Sparkles size={16} />
        {title}
      </div>
      <div className="mt-4 text-[13px] leading-6 text-[#E5D9FF]">{children}</div>
    </section>
  );
}

export function ResidentPortalDashboard({ onToast }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('residents');
  const [query, setQuery] = useState('');
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ResidentRequest | null>(null);
  const [noticeModalOpen, setNoticeModalOpen] = useState(false);
  const [communityDrawer, setCommunityDrawer] = useState<(typeof communityServices)[number] | null>(null);

  const metrics = useMemo(() => ({
    residents: residents.length,
    activeUnits: new Set(residents.filter(resident => resident.status === 'Active').map(resident => resident.unitId)).size,
    openRequests: residentRequests.filter(request => !['Resolved', 'Closed'].includes(request.status)).length,
    pendingPayments: payments.filter(payment => payment.status === 'Pending' || payment.status === 'Overdue').length,
    noticesSent: notices.filter(notice => notice.status === 'Sent').length,
    satisfaction: Math.round(residents.reduce((sum, resident) => sum + resident.satisfaction, 0) / residents.length),
  }), []);

  const filteredResidents = residents.filter(resident => `${resident.name} ${resident.email} ${resident.type}`.toLowerCase().includes(query.toLowerCase()));
  const residentBody = query ? (
    <TableShell columns={['Resident Name', 'Unit', 'Site / Building', 'Type', 'Status', 'Open Requests', 'Payment', 'Last Activity', 'Actions']}>
      {filteredResidents.map(resident => {
        const unit = getUnit(resident.unitId);
        return (
          <tr key={resident.id} onClick={() => setSelectedResident(resident)} className="cursor-pointer border-t border-[rgba(46,127,255,0.08)] bg-[#0A1628]/70 transition-colors hover:bg-white/[0.045]">
            <td className="px-4 py-4 align-top text-[14px] font-black text-[#EEF3FA]">{resident.name}</td>
            <td className="px-4 py-4 align-top font-mono text-[13px] text-cyan-300">{unit?.unitNumber}</td>
            <td className="px-4 py-4 align-top text-[13px] text-[#A8B3C7]">{unit?.siteName}</td>
            <td className="px-4 py-4 align-top text-[13px] text-[#A8B3C7]">{resident.type}</td>
            <td className="px-4 py-4 align-top"><Badge className={residentStatusClass[resident.status]}>{resident.status}</Badge></td>
            <td className="px-4 py-4 align-top font-mono text-[#EEF3FA]">{resident.openRequests}</td>
            <td className="px-4 py-4 align-top"><Badge className={paymentStatusClass[resident.paymentStatus]}>{resident.paymentStatus}</Badge></td>
            <td className="px-4 py-4 align-top text-[12px] text-[#7A94B4]">{resident.lastActivity}</td>
            <td className="px-4 py-4 align-top text-right"><MoreHorizontal size={16} className="ml-auto text-[#7A94B4]" /></td>
          </tr>
        );
      })}
    </TableShell>
  ) : <ResidentsTable onSelect={setSelectedResident} onToast={onToast} />;

  return (
    <div className="custom-scrollbar h-full min-h-0 overflow-x-hidden overflow-y-auto bg-[#07111F] px-5 py-4 text-[#EEF3FA]">
      <div className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#E11D2E]">
              <Home size={14} />
              Resident-facing module
            </div>
            <h1 className="text-3xl font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>ResidentPortal</h1>
            <p className="mt-2 text-sm text-[#8FA6C3]">Resident and owner services, communications, requests, and engagement.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => onToast('Add Resident workflow ready', 'info')} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#E11D2E] px-4 text-[12px] font-black text-white shadow-lg shadow-red-950/25">
              <Plus size={16} />
              Add Resident
            </button>
            <button type="button" onClick={() => setNoticeModalOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-4 text-[12px] font-black text-cyan-300">
              <Send size={16} />
              Send Notice
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <KpiCard icon={Users} label="Total Residents" value={metrics.residents} sub="+6%" accent="#2E7FFF" />
        <KpiCard icon={Home} label="Active Units" value={metrics.activeUnits} accent="#06B6D4" />
        <KpiCard icon={Wrench} label="Open Requests" value={metrics.openRequests} accent="#E11D2E" />
        <KpiCard icon={CreditCard} label="Pending Payments" value={metrics.pendingPayments} accent="#F59E0B" />
        <KpiCard icon={BellRing} label="Notices Sent" value={metrics.noticesSent} accent="#8B5CF6" />
        <KpiCard icon={Star} label="Satisfaction Score" value={`${metrics.satisfaction}%`} sub="+4%" accent="#22C55E" />
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[1fr_340px]">
        <div className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
          <div className="flex flex-wrap gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-xl px-4 py-2 text-[12px] font-black transition-colors ${
                  activeTab === tab.id ? 'bg-[#E11D2E]/16 text-red-100 ring-1 ring-[#E11D2E]/35' : 'text-[#7A94B4] hover:bg-white/5 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <AiPanel title="AI engagement pulse">
          <p>Repeat cooling requests and one overdue invoice create a medium dissatisfaction risk. Recommended: close RP-REQ-1048 within SLA and send a proactive Tower A maintenance notice.</p>
        </AiPanel>
      </div>

      {(activeTab === 'residents' || activeTab === 'requests') && (
        <div className="mt-4 rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
          <label className="relative block max-w-[460px]">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A94B4]" />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder={activeTab === 'residents' ? 'Search residents...' : 'Search requests...'}
              className="h-10 w-full rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#0A1628] pl-11 pr-4 text-[13px] text-[#EEF3FA] outline-none placeholder:text-[#5A6E88] focus:border-[#E11D2E]"
            />
          </label>
        </div>
      )}

      <div className="mt-4">
        {activeTab === 'residents' && residentBody}
        {activeTab === 'requests' && <RequestsTable onSelect={setSelectedRequest} onToast={onToast} />}
        {activeTab === 'notices' && <NoticeCenter onCreate={() => setNoticeModalOpen(true)} />}
        {activeTab === 'payments' && <PaymentsTable onToast={onToast} />}
        {activeTab === 'documents' && <DocumentsTable onToast={onToast} />}
        {activeTab === 'community' && <CommunityServicesGrid onOpen={setCommunityDrawer} />}
        {activeTab === 'settings' && <SettingsPanel />}
      </div>

      {selectedResident && <ResidentProfileDrawer resident={selectedResident} onClose={() => setSelectedResident(null)} onToast={onToast} />}
      {selectedRequest && <RequestDetailDrawer request={selectedRequest} onClose={() => setSelectedRequest(null)} onToast={onToast} />}
      {noticeModalOpen && <CreateNoticeModal onClose={() => setNoticeModalOpen(false)} onToast={onToast} />}
      {communityDrawer && (
        <DrawerShell title={communityDrawer.title} subtitle={communityDrawer.detail} onClose={() => setCommunityDrawer(null)}>
          <div className="grid gap-4 md:grid-cols-2">
            <DetailCard label="Active items" value={communityDrawer.count} />
            <DetailCard label="Workflow owner" value="Community Services Team" />
          </div>
          <section className="mt-6 rounded-xl border border-violet-300/20 bg-violet-300/10 p-4">
            <div className="flex items-center gap-2 text-[13px] font-black text-violet-100">
              <Sparkles size={16} />
              AI workflow suggestion
            </div>
            <p className="mt-3 text-[14px] leading-6 text-[#E5D9FF]">Prioritise requests linked to move-in windows and visitor access during peak evening periods. AI can auto-route eligible requests to security or concierge queues.</p>
          </section>
        </DrawerShell>
      )}
    </div>
  );
}
