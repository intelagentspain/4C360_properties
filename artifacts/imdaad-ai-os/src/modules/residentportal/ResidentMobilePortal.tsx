import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bot,
  CalendarClock,
  Camera,
  CheckCircle2,
  CreditCard,
  FileText,
  Home,
  Mail,
  MessageCircle,
  Mic,
  QrCode,
  Send,
  Sparkles,
  Upload,
  Wrench,
} from 'lucide-react';
import {
  amenities,
  amenityBookings,
  getAmenity,
  getCommunity,
  getUnit,
  handovers,
  notices,
  payments,
  residentDocuments,
  residentRequests,
  residents,
  warrantyClaims,
  type Amenity,
  type AmenityBooking,
  type ResidentRequest,
} from './data';

type View = 'home' | 'report' | 'track' | 'notices' | 'payments' | 'documents' | 'contact' | 'requestDetail' | 'amenities' | 'booking' | 'handover' | 'concierge';

interface Props {
  residentId?: string;
  onToast?: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

function MobileCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>{children}</section>;
}

function StatusPill({ children, tone = 'blue' }: { children: React.ReactNode; tone?: 'blue' | 'green' | 'amber' | 'red' | 'slate' | 'violet' }) {
  const classes = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
    slate: 'bg-slate-100 text-slate-600',
    violet: 'bg-violet-50 text-violet-700',
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
  const allSteps = ['Submitted', 'Reviewed', 'Assigned', 'In Progress', 'Resolved', 'Resident Confirmed', 'Closed'];
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

function ResidentAIConcierge({ onToast, onNavigate }: { onToast?: Props['onToast']; onNavigate: (view: View) => void }) {
  const prompts = [
    'When is my AC technician coming?',
    'Can I book the pool tomorrow?',
    'Why do I have an outstanding balance?',
    'Where is my handover pack?',
    'I have water leaking from the ceiling.',
    'What are the gym rules?',
  ];
  const [question, setQuestion] = useState(prompts[0]);
  const answer = question.toLowerCase().includes('pool')
    ? 'The pool has availability tomorrow at 10:00 and 14:00. I can open booking and generate your QR pass after confirmation.'
    : question.toLowerCase().includes('balance')
      ? 'Your outstanding balance is linked to a service charge invoice. I can open the invoice, explain the category, or request a payment plan.'
      : question.toLowerCase().includes('leaking')
        ? 'This sounds urgent. I will classify it as Plumbing / Water leak, suggest Critical priority, and start a request with photo evidence.'
        : 'Your HVAC request is assigned to FieldOps HVAC Team with an ETA today. I can show the timeline or message management.';

  return (
    <MobileCard className="border-red-100 bg-red-50">
      <div className="flex items-center gap-2 text-[#E11D2E]">
        <Bot size={18} />
        <h3 className="text-sm font-black">Layla - Resident Concierge</h3>
      </div>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {prompts.map(prompt => (
          <button key={prompt} type="button" onClick={() => setQuestion(prompt)} className="whitespace-nowrap rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm">
            {prompt}
          </button>
        ))}
      </div>
      <div className="mt-4 rounded-2xl bg-white p-4 text-sm leading-6 text-slate-700">{answer}</div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => onNavigate(question.toLowerCase().includes('pool') ? 'amenities' : question.toLowerCase().includes('balance') ? 'payments' : 'track')} className="h-11 rounded-2xl bg-[#E11D2E] text-xs font-black text-white">Open Workflow</button>
        <button type="button" onClick={() => onToast?.('Layla sent your message to management', 'success')} className="h-11 rounded-2xl border border-red-200 bg-white text-xs font-black text-[#E11D2E]">Send Message</button>
      </div>
    </MobileCard>
  );
}

function AmenityCard({ amenity, onBook }: { amenity: Amenity; onBook: (amenity: Amenity) => void }) {
  return (
    <MobileCard>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-black">{amenity.name}</h3>
          <p className="mt-1 text-sm text-slate-500">{amenity.hours} - capacity {amenity.capacity}</p>
        </div>
        <StatusPill tone={amenity.occupancy > 85 ? 'amber' : 'green'}>{amenity.occupancy}% full</StatusPill>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{amenity.peakInsight}</p>
      <button type="button" onClick={() => onBook(amenity)} className="mt-4 h-11 w-full rounded-2xl bg-slate-950 text-sm font-black text-white">View Availability</button>
    </MobileCard>
  );
}

function BookingConfirmation({ amenity, booking, onToast }: { amenity: Amenity; booking?: AmenityBooking; onToast?: Props['onToast'] }) {
  return (
    <MobileCard className="border-emerald-100 bg-emerald-50">
      <QrCode size={30} className="text-emerald-700" />
      <h3 className="mt-3 text-lg font-black text-emerald-950">{amenity.name} access pass</h3>
      <p className="mt-1 font-mono text-sm text-emerald-700">{booking?.accessQr ?? 'QR-POOL-DEMO'}</p>
      <p className="mt-2 text-sm leading-6 text-emerald-800">Confirmed for the selected slot. Security can scan this pass at the amenity entrance.</p>
      <button type="button" onClick={() => onToast?.('Amenity QR pass saved', 'success')} className="mt-4 h-11 w-full rounded-2xl bg-emerald-700 text-sm font-black text-white">Save QR Pass</button>
    </MobileCard>
  );
}

export function ResidentMobilePortal({ residentId = 'res-ahmad', onToast }: Props) {
  const resident = residents.find(item => item.id === residentId) ?? residents[0];
  const unit = getUnit(resident.unitId);
  const community = getCommunity(resident.communityId);
  const requests = residentRequests.filter(request => request.residentId === resident.id);
  const docs = residentDocuments.filter(document => document.linkedResidentId === resident.id || document.linkedUnitId === resident.unitId || document.linkedCommunityId === resident.communityId);
  const residentPayments = payments.filter(payment => payment.residentId === resident.id);
  const bookings = amenityBookings.filter(booking => booking.residentId === resident.id);
  const handover = handovers.find(item => item.residentId === resident.id);
  const claims = warrantyClaims.filter(claim => claim.unitId === resident.unitId);
  const [view, setView] = useState<View>('home');
  const [selectedRequest, setSelectedRequest] = useState<ResidentRequest | null>(requests[0] ?? null);
  const [selectedAmenity, setSelectedAmenity] = useState<Amenity>(amenities.find(item => item.id === 'pool') ?? amenities[0]);
  const [description, setDescription] = useState('');
  const [generatedRequestId, setGeneratedRequestId] = useState<string | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  const summary = useMemo(() => {
    const outstanding = residentPayments.filter(payment => payment.status !== 'Paid').reduce((sum, payment) => sum + payment.amount, 0);
    return {
      outstanding,
      open: requests.filter(request => !['Resolved', 'Resident Confirmed', 'Closed'].includes(request.status)).length,
      upcomingBookings: bookings.filter(booking => booking.status === 'Confirmed' || booking.status === 'Pending Approval').length,
      unreadNotices: notices.filter(notice => notice.status === 'Sent').length,
    };
  }, [residentPayments, requests, bookings]);

  const submitIssue = () => {
    const id = `RP-REQ-${Math.floor(2000 + Math.random() * 7000)}`;
    setGeneratedRequestId(id);
    setDescription('');
    onToast?.(`${id} submitted to SnapFix / ServiceDesk as HVAC`, 'success');
  };

  const headerTitle =
    view === 'home'
      ? `Welcome, ${resident.name.split(' ')[0]}`
      : view === 'report'
        ? 'Report Issue'
        : view === 'track'
          ? 'Track Requests'
          : view === 'requestDetail'
            ? selectedRequest?.id ?? 'Request'
            : view === 'amenities'
              ? 'Book Amenity'
              : view === 'booking'
                ? selectedAmenity.name
                : view === 'concierge'
                  ? 'Layla'
                  : view === 'handover'
                    ? 'Handover / Warranty'
                    : view.charAt(0).toUpperCase() + view.slice(1);

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
            <p className="text-[11px] font-black text-[#E11D2E]">ResidentPortal</p>
            <h1 className="truncate text-xl font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{headerTitle}</h1>
          </div>
          <button type="button" onClick={() => setView('concierge')} aria-label="Open AI concierge" className="grid h-10 w-10 place-items-center rounded-2xl bg-red-50 text-[#E11D2E]">
            <Bot size={18} />
          </button>
        </div>
      </header>

      <main className="space-y-5 px-5 py-5">
        {view === 'home' && (
          <>
            <MobileCard className="bg-[#07111F] text-white">
              <p className="text-[11px] text-red-200">Community / Unit</p>
              <h2 className="mt-2 text-2xl font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{community?.name}</h2>
              <p className="mt-1 text-sm text-slate-300">Unit {unit?.unitNumber} - {unit?.building}</p>
              <div className="mt-5 grid grid-cols-2 gap-3 text-center">
                <div className="rounded-2xl bg-white/8 p-3">
                  <p className="text-xl font-black">AED {summary.outstanding.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-300">Outstanding</p>
                </div>
                <div className="rounded-2xl bg-white/8 p-3">
                  <p className="text-xl font-black">{summary.open}</p>
                  <p className="text-[10px] text-slate-300">Open requests</p>
                </div>
                <div className="rounded-2xl bg-white/8 p-3">
                  <p className="text-xl font-black">{summary.upcomingBookings}</p>
                  <p className="text-[10px] text-slate-300">Bookings</p>
                </div>
                <div className="rounded-2xl bg-white/8 p-3">
                  <p className="text-xl font-black">{summary.unreadNotices}</p>
                  <p className="text-[10px] text-slate-300">Notices</p>
                </div>
              </div>
            </MobileCard>

            <div className="grid grid-cols-2 gap-3">
              <QuickAction label="Report Issue" icon={Wrench} primary onClick={() => setView('report')} />
              <QuickAction label="Book Amenity" icon={CalendarClock} onClick={() => setView('amenities')} />
              <QuickAction label="Pay Invoice" icon={CreditCard} onClick={() => setView('payments')} />
              <QuickAction label="View Documents" icon={FileText} onClick={() => setView('documents')} />
              <QuickAction label="Contact Management" icon={MessageCircle} onClick={() => setView('contact')} />
              <QuickAction label="Handover / Warranty" icon={Home} onClick={() => setView('handover')} />
            </div>

            <ResidentAIConcierge onToast={onToast} onNavigate={setView} />
          </>
        )}

        {view === 'report' && (
          <>
            <MobileCard>
              <h2 className="text-lg font-black">Tell us what happened</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Add a photo, upload evidence, record a voice note, or describe the issue. AI will classify it before ServiceDesk creates the request.</p>
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
                <h3 className="text-sm font-black">AI triage</h3>
              </div>
              <p className="mt-2 text-sm leading-6 text-red-900">Likely category: HVAC. Suggested priority: High. Connected workflow: ServiceDesk ticket, FieldOps HVAC assignment, resident timeline, closure evidence, confirmation, and rating.</p>
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
                <p className="text-xs font-black text-slate-400">Assigned team</p>
                <p className="mt-1 text-sm font-black">{selectedRequest.assignedTo}</p>
                <p className="mt-1 text-xs text-slate-500">ETA: {selectedRequest.eta}</p>
              </div>
            </MobileCard>
            <MobileCard>
              <h3 className="text-sm font-black">Timeline</h3>
              <div className="mt-4"><RequestTimeline request={selectedRequest} /></div>
            </MobileCard>
            <MobileCard className="border-red-100 bg-red-50">
              <h3 className="text-sm font-black text-[#E11D2E]">AI status summary</h3>
              <p className="mt-2 text-sm leading-6 text-red-900">{selectedRequest.aiSummary}</p>
            </MobileCard>
            <button type="button" onClick={() => onToast?.('Resolution confirmation saved and satisfaction score updated', 'success')} className="h-13 w-full rounded-3xl bg-[#07111F] py-4 text-sm font-black text-white">Confirm Resolution & Rate</button>
          </>
        )}

        {view === 'amenities' && (
          <div className="space-y-3">
            {amenities.map(amenity => (
              <AmenityCard key={amenity.id} amenity={amenity} onBook={amenityToBook => { setSelectedAmenity(amenityToBook); setBookingConfirmed(false); setView('booking'); }} />
            ))}
          </div>
        )}

        {view === 'booking' && (
          <>
            <MobileCard>
              <h2 className="text-xl font-black">{selectedAmenity.name}</h2>
              <p className="mt-2 text-sm text-slate-500">{selectedAmenity.hours} - {selectedAmenity.restrictions}</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {['10:00', '14:00', '18:00', '20:00'].map((slot, index) => (
                  <button key={slot} type="button" onClick={() => onToast?.(`${slot} selected`, 'info')} className={`h-12 rounded-2xl text-sm font-black ${index > 1 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>{slot}</button>
                ))}
              </div>
              <label className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-700">
                <input type="checkbox" defaultChecked />
                I confirm the amenity rules and cancellation policy.
              </label>
              {selectedAmenity.paidBooking && <p className="mt-3 text-sm text-slate-600">Payment required before QR access is issued.</p>}
              <button type="button" onClick={() => { setBookingConfirmed(true); onToast?.(`${selectedAmenity.name} booking confirmed`, 'success'); }} className="mt-4 h-12 w-full rounded-3xl bg-[#E11D2E] text-sm font-black text-white">Confirm Booking</button>
            </MobileCard>
            {bookingConfirmed && <BookingConfirmation amenity={selectedAmenity} booking={bookings.find(booking => booking.amenityId === selectedAmenity.id)} onToast={onToast} />}
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
                    <p className="mt-1 text-sm text-slate-500">{payment.category} - due {payment.dueDate}</p>
                  </div>
                  <StatusPill tone={payment.status === 'Paid' ? 'green' : payment.status === 'Overdue' ? 'red' : payment.status === 'Disputed' ? 'violet' : 'amber'}>{payment.status}</StatusPill>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => onToast?.(`Payment link opened for ${payment.id}`, 'info')} className="h-11 rounded-2xl bg-[#E11D2E] text-xs font-black text-white">Pay Now</button>
                  <button type="button" onClick={() => onToast?.(`AI explained ${payment.id}`, 'info')} className="h-11 rounded-2xl border border-slate-200 bg-white text-xs font-black text-slate-700">Explain Invoice</button>
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
                {document.signatureRequired && <StatusPill tone="amber">Signature required</StatusPill>}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => onToast?.(`Opening ${document.name}`, 'info')} className="h-10 rounded-2xl bg-slate-950 px-4 text-xs font-black text-white">View</button>
                  <button type="button" onClick={() => onToast?.(`Layla summarized ${document.name}`, 'info')} className="h-10 rounded-2xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700">Ask AI</button>
                </div>
              </MobileCard>
            ))}
          </div>
        )}

        {view === 'handover' && (
          <div className="space-y-3">
            <MobileCard>
              <Home size={24} className="text-[#E11D2E]" />
              <h2 className="mt-3 text-xl font-black">Move-in readiness</h2>
              {handover ? (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Checklist</p><p className="text-sm font-black">{handover.checklistStatus}</p></div>
                  <div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Snags open</p><p className="text-sm font-black">{handover.snagsOpen}</p></div>
                  <div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Docs signed</p><p className="text-sm font-black">{handover.documentsSigned}</p></div>
                  <div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Move-in</p><p className="text-sm font-black">{handover.moveInStatus}</p></div>
                </div>
              ) : <p className="mt-2 text-sm text-slate-600">No active handover workflow for this unit.</p>}
              <button type="button" onClick={() => onToast?.('Handover appointment booking opened', 'info')} className="mt-4 h-11 w-full rounded-2xl bg-[#E11D2E] text-sm font-black text-white">Book Handover Appointment</button>
            </MobileCard>
            {claims.map(claim => (
              <MobileCard key={claim.id}>
                <p className="font-mono text-xs font-black text-[#E11D2E]">{claim.id}</p>
                <h3 className="mt-2 text-lg font-black">{claim.category}</h3>
                <p className="mt-2 text-sm text-slate-600">{claim.status} with {claim.assignedVendor}</p>
                <StatusPill tone={claim.warrantyValid ? 'green' : 'red'}>{claim.warrantyValid ? 'Warranty valid' : 'Warranty expired'}</StatusPill>
              </MobileCard>
            ))}
          </div>
        )}

        {view === 'contact' && (
          <MobileCard>
            <MessageCircle size={28} className="text-[#E11D2E]" />
            <h2 className="mt-4 text-xl font-black">Contact Management</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Send a message to the property management team or attach it to an existing request.</p>
            <textarea rows={5} placeholder="Write your message..." className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none focus:border-[#E11D2E]" />
            <button type="button" onClick={() => onToast?.('Message sent to management', 'success')} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-3xl bg-[#E11D2E] text-sm font-black text-white">
              <Send size={18} />
              Send Message
            </button>
          </MobileCard>
        )}

        {view === 'concierge' && <ResidentAIConcierge onToast={onToast} onNavigate={setView} />}
      </main>
    </div>
  );
}
