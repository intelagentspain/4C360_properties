import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  CreditCard,
  FileText,
  Home,
  Mail,
  MessageCircle,
  Mic,
  Send,
  Sparkles,
  Upload,
  Wrench,
} from 'lucide-react';
import { getUnit, notices, payments, residentDocuments, residentRequests, residents, type ResidentRequest } from './data';

type View = 'home' | 'report' | 'track' | 'notices' | 'payments' | 'documents' | 'contact' | 'requestDetail';

interface Props {
  residentId?: string;
  onToast?: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

function MobileCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>{children}</section>;
}

function StatusPill({ children, tone = 'blue' }: { children: React.ReactNode; tone?: 'blue' | 'green' | 'amber' | 'red' | 'slate' }) {
  const classes = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
    slate: 'bg-slate-100 text-slate-600',
  };
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${classes[tone]}`}>{children}</span>;
}

function QuickAction({
  label,
  icon: Icon,
  onClick,
  primary = false,
}: {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[104px] rounded-3xl p-4 text-left shadow-sm transition-transform active:scale-[0.98] ${
        primary ? 'bg-[#E11D2E] text-white' : 'border border-slate-200 bg-white text-slate-950'
      }`}
    >
      <span className={`grid h-10 w-10 place-items-center rounded-2xl ${primary ? 'bg-white/15 text-white' : 'bg-slate-100 text-[#E11D2E]'}`}>
        <Icon size={20} />
      </span>
      <span className="mt-4 block text-sm font-black">{label}</span>
    </button>
  );
}

function RequestTimeline({ request }: { request: ResidentRequest }) {
  const allSteps = ['Submitted', 'Reviewed', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
  const completed = request.timeline.map(item => item.label.toLowerCase());

  return (
    <div className="space-y-3">
      {allSteps.map(step => {
        const active = completed.includes(step.toLowerCase()) || request.status.toLowerCase().includes(step.toLowerCase());
        return (
          <div key={step} className="flex items-center gap-3">
            <span className={`grid h-7 w-7 place-items-center rounded-full ${active ? 'bg-[#E11D2E] text-white' : 'bg-slate-100 text-slate-400'}`}>
              <CheckCircle2 size={14} />
            </span>
            <span className={`text-sm font-bold ${active ? 'text-slate-950' : 'text-slate-400'}`}>{step}</span>
          </div>
        );
      })}
    </div>
  );
}

export function ResidentMobilePortal({ residentId = 'res-001', onToast }: Props) {
  const resident = residents.find(item => item.id === residentId) ?? residents[0];
  const unit = getUnit(resident.unitId);
  const requests = residentRequests.filter(request => request.residentId === resident.id);
  const docs = residentDocuments.filter(document => document.linkedResidentId === resident.id || document.linkedUnitId === resident.unitId);
  const residentPayments = payments.filter(payment => payment.residentId === resident.id);
  const [view, setView] = useState<View>('home');
  const [selectedRequest, setSelectedRequest] = useState<ResidentRequest | null>(requests[0] ?? null);
  const [description, setDescription] = useState('');
  const [generatedRequestId, setGeneratedRequestId] = useState<string | null>(null);

  const summary = useMemo(() => ({
    open: requests.filter(request => !['Resolved', 'Closed'].includes(request.status)).length,
    inProgress: requests.filter(request => request.status === 'In Progress' || request.status === 'Assigned').length,
    resolved: requests.filter(request => request.status === 'Resolved' || request.status === 'Closed' || request.status === 'Awaiting Resident Confirmation').length,
  }), [requests]);

  const submitIssue = () => {
    const id = `RP-REQ-${Math.floor(2000 + Math.random() * 7000)}`;
    setGeneratedRequestId(id);
    setDescription('');
    onToast?.(`${id} submitted to SnapFix / ServiceDesk`, 'success');
  };

  const headerTitle = view === 'home' ? `Hi ${resident.name.split(' ')[0]}` : view === 'report' ? 'Report Issue' : view === 'track' ? 'Track Requests' : view === 'requestDetail' ? selectedRequest?.id ?? 'Request' : view.charAt(0).toUpperCase() + view.slice(1);

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-slate-950" style={{ maxWidth: 480, margin: '0 auto' }}>
      <header className="sticky top-0 z-20 bg-white/92 px-5 py-4 shadow-sm backdrop-blur">
        <div className="flex items-center gap-3">
          {view !== 'home' && (
            <button type="button" onClick={() => setView('home')} className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-700" aria-label="Back to home">
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#E11D2E]">ResidentPortal</p>
            <h1 className="truncate text-xl font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{headerTitle}</h1>
          </div>
          <img src="/4c-logo.png" alt="4C logo" className="h-10 w-10 rounded-2xl object-contain" />
        </div>
      </header>

      <main className="space-y-5 px-5 py-5">
        {view === 'home' && (
          <>
            <MobileCard className="bg-[#07111F] text-white">
              <p className="text-[11px] uppercase tracking-[0.18em] text-red-200">Home context</p>
              <h2 className="mt-2 text-2xl font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{unit?.propertyName}</h2>
              <p className="mt-1 text-sm text-slate-300">Unit {unit?.unitNumber} - {unit?.building}</p>
              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl bg-white/8 p-3">
                  <p className="text-xl font-black">{summary.open}</p>
                  <p className="text-[10px] text-slate-300">Open</p>
                </div>
                <div className="rounded-2xl bg-white/8 p-3">
                  <p className="text-xl font-black">{summary.inProgress}</p>
                  <p className="text-[10px] text-slate-300">Active</p>
                </div>
                <div className="rounded-2xl bg-white/8 p-3">
                  <p className="text-xl font-black">{summary.resolved}</p>
                  <p className="text-[10px] text-slate-300">Resolved</p>
                </div>
              </div>
            </MobileCard>

            <div className="grid grid-cols-2 gap-3">
              <QuickAction label="Report Issue" icon={Wrench} primary onClick={() => setView('report')} />
              <QuickAction label="Track Request" icon={CheckCircle2} onClick={() => setView('track')} />
              <QuickAction label="View Notices" icon={Mail} onClick={() => setView('notices')} />
              <QuickAction label="Payments" icon={CreditCard} onClick={() => setView('payments')} />
              <QuickAction label="Documents" icon={FileText} onClick={() => setView('documents')} />
              <QuickAction label="Contact Management" icon={MessageCircle} onClick={() => setView('contact')} />
            </div>

            <MobileCard>
              <div className="flex items-center gap-2">
                <Sparkles size={17} className="text-[#E11D2E]" />
                <h3 className="text-sm font-black">AI request pulse</h3>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">Your HVAC request is active and expected today. AI suggests keeping the thermostat photo available for the technician.</p>
            </MobileCard>
          </>
        )}

        {view === 'report' && (
          <>
            <MobileCard>
              <h2 className="text-lg font-black">Tell us what happened</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Add a photo, voice note, or short description. AI will classify the issue and create a structured request.</p>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { label: 'Take Photo', icon: Camera },
                  { label: 'Upload', icon: Upload },
                  { label: 'Voice', icon: Mic },
                ].map(action => {
                  const Icon = action.icon;
                  return (
                    <button key={action.label} type="button" onClick={() => onToast?.(`${action.label} capture ready`, 'info')} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center text-xs font-black text-slate-700">
                      <Icon size={18} className="mx-auto mb-2 text-[#E11D2E]" />
                      {action.label}
                    </button>
                  );
                })}
              </div>
              <textarea
                value={description}
                onChange={event => setDescription(event.target.value)}
                placeholder="Example: AC in bedroom is not cooling and thermostat shows a warning."
                rows={5}
                className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none focus:border-[#E11D2E]"
              />
            </MobileCard>
            <MobileCard className="border-red-100 bg-red-50">
              <div className="flex items-center gap-2 text-[#E11D2E]">
                <Sparkles size={17} />
                <h3 className="text-sm font-black">AI suggestion</h3>
              </div>
              <p className="mt-2 text-sm leading-6 text-red-900">Likely category: HVAC / Cooling. Suggested priority: High if cooling is fully unavailable or affecting children/elderly residents.</p>
            </MobileCard>
            <button type="button" onClick={submitIssue} className="flex h-14 w-full items-center justify-center gap-2 rounded-3xl bg-[#E11D2E] text-sm font-black text-white shadow-lg shadow-red-200">
              <Send size={18} />
              Submit Request
            </button>
            {generatedRequestId && (
              <MobileCard className="border-emerald-100 bg-emerald-50">
                <CheckCircle2 size={24} className="text-emerald-600" />
                <h3 className="mt-3 text-lg font-black text-emerald-950">Request submitted</h3>
                <p className="mt-1 font-mono text-sm text-emerald-700">{generatedRequestId}</p>
                <p className="mt-2 text-sm text-emerald-800">Status: Submitted - estimated response within 2 hours.</p>
              </MobileCard>
            )}
          </>
        )}

        {view === 'track' && (
          <div className="space-y-3">
            {requests.map(request => (
              <button
                key={request.id}
                type="button"
                onClick={() => {
                  setSelectedRequest(request);
                  setView('requestDetail');
                }}
                className="w-full rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs font-black text-[#E11D2E]">{request.id}</p>
                    <h3 className="mt-1 text-base font-black">{request.category}</h3>
                  </div>
                  <StatusPill tone={request.status === 'Resolved' || request.status === 'Closed' ? 'green' : request.status === 'In Progress' ? 'amber' : 'blue'}>{request.status}</StatusPill>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{request.description}</p>
              </button>
            ))}
          </div>
        )}

        {view === 'requestDetail' && selectedRequest && (
          <>
            <MobileCard>
              <StatusPill tone="blue">{selectedRequest.status}</StatusPill>
              <h2 className="mt-3 text-xl font-black">{selectedRequest.category}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{selectedRequest.description}</p>
              <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Assigned team</p>
                <p className="mt-1 text-sm font-black">{selectedRequest.assignedTo}</p>
                <p className="mt-1 text-xs text-slate-500">ETA: {selectedRequest.eta}</p>
              </div>
            </MobileCard>
            <MobileCard>
              <h3 className="text-sm font-black">Timeline</h3>
              <div className="mt-4">
                <RequestTimeline request={selectedRequest} />
              </div>
            </MobileCard>
            <MobileCard>
              <h3 className="text-sm font-black">Messages</h3>
              <div className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">Management: We have assigned your request and will update you when the technician arrives.</div>
              <button type="button" onClick={() => onToast?.('Reply composer ready', 'info')} className="mt-4 h-11 w-full rounded-2xl border border-slate-200 text-sm font-black text-slate-700">Reply to Management</button>
            </MobileCard>
            <button type="button" onClick={() => onToast?.('Resolution confirmation saved', 'success')} className="h-13 w-full rounded-3xl bg-[#07111F] py-4 text-sm font-black text-white">Confirm Resolution</button>
          </>
        )}

        {view === 'notices' && (
          <div className="space-y-3">
            {notices.map(notice => (
              <MobileCard key={notice.id}>
                <StatusPill tone={notice.status === 'Sent' ? 'green' : 'amber'}>{notice.status}</StatusPill>
                <h3 className="mt-3 text-lg font-black">{notice.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{notice.message}</p>
                <p className="mt-3 text-xs font-bold text-slate-400">{notice.audience} - {notice.channels.join(', ')}</p>
              </MobileCard>
            ))}
          </div>
        )}

        {view === 'payments' && (
          <div className="space-y-3">
            {residentPayments.map(payment => (
              <MobileCard key={payment.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs font-black text-[#E11D2E]">{payment.id}</p>
                    <h3 className="mt-2 text-2xl font-black">AED {payment.amount.toLocaleString()}</h3>
                    <p className="mt-1 text-sm text-slate-500">Due {payment.dueDate}</p>
                  </div>
                  <StatusPill tone={payment.status === 'Paid' ? 'green' : payment.status === 'Overdue' ? 'red' : 'amber'}>{payment.status}</StatusPill>
                </div>
              </MobileCard>
            ))}
            {residentPayments.length === 0 && <MobileCard>No payments due.</MobileCard>}
          </div>
        )}

        {view === 'documents' && (
          <div className="space-y-3">
            {docs.map(document => (
              <MobileCard key={document.id}>
                <FileText size={22} className="text-[#E11D2E]" />
                <h3 className="mt-3 text-base font-black">{document.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{document.category} - {document.visibility}</p>
                <button type="button" onClick={() => onToast?.(`Opening ${document.name}`, 'info')} className="mt-4 h-10 rounded-2xl bg-slate-950 px-4 text-xs font-black text-white">View Document</button>
              </MobileCard>
            ))}
          </div>
        )}

        {view === 'contact' && (
          <MobileCard>
            <MessageCircle size={28} className="text-[#E11D2E]" />
            <h2 className="mt-4 text-xl font-black">Contact Management</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Send a message to the property management team or attach a photo to an existing request.</p>
            <textarea rows={5} placeholder="Write your message..." className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none focus:border-[#E11D2E]" />
            <button type="button" onClick={() => onToast?.('Message sent to management', 'success')} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-3xl bg-[#E11D2E] text-sm font-black text-white">
              <Send size={18} />
              Send Message
            </button>
          </MobileCard>
        )}
      </main>
    </div>
  );
}
