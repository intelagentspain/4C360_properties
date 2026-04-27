import { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, FileText, Link2, Plus, Search, X } from 'lucide-react';
import { obligations, type ObligationStatus, type ProjectObligation } from '../data/obligations';

const statusStyles: Record<ObligationStatus, string> = {
  Overdue: 'border-red-400/30 bg-red-400/10 text-red-300',
  Pending: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  Met: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
};

const statusIcons: Record<ObligationStatus, typeof AlertCircle> = {
  Overdue: AlertCircle,
  Pending: AlertCircle,
  Met: CheckCircle2,
};

function StatusBadge({ status }: { status: ObligationStatus }) {
  const Icon = statusIcons[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-black ${statusStyles[status]}`}>
      <Icon size={12} />
      {status}
    </span>
  );
}

function InfoPair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-[#7A94B4]">{label}</p>
      <p className="mt-2 text-[14px] font-medium text-[#EEF3FA]">{value}</p>
    </div>
  );
}

function LinkCard({ label, code, title, status }: { label: string; code: string; title: string; status: string }) {
  const high = status === 'High' || status === 'Failed';
  return (
    <div className="rounded-xl border border-cyan-400/24 bg-[#111318] p-4">
      <div className="flex items-center justify-between gap-4">
        <p className="font-mono text-[11px] font-bold text-cyan-300">{code}</p>
        <span className={`text-[11px] font-bold ${high ? 'text-amber-300' : 'text-emerald-300'}`}>{status}</span>
      </div>
      <p className="mt-2 text-[14px] font-medium text-[#EEF3FA]">{title}</p>
      <p className="mt-1 text-[10px] uppercase tracking-wider text-[#5A6E88]">{label}</p>
    </div>
  );
}

function ObligationDetail({ obligation, onClose }: { obligation: ProjectObligation; onClose?: () => void }) {
  return (
    <aside className="custom-scrollbar h-full overflow-y-auto border-l border-[rgba(46,127,255,0.14)] bg-[#0B0D11] p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[12px] font-bold text-cyan-300">{obligation.code}</span>
          <StatusBadge status={obligation.status} />
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-[#7A94B4] transition-colors hover:bg-white/5 hover:text-white" aria-label="Close obligation detail">
            <X size={18} />
          </button>
        )}
      </div>

      <h2 className="text-xl font-black leading-7 text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{obligation.obligation}</h2>
      <p className="mt-3 text-[14px] leading-6 text-[#BCC8DC]">{obligation.description}</p>

      <div className="mt-7 grid grid-cols-2 gap-x-8 gap-y-5">
        <InfoPair label="Authority" value={obligation.authority} />
        <InfoPair label="Jurisdiction" value={obligation.jurisdiction} />
        <InfoPair label="Category" value={obligation.category} />
        <InfoPair label="Stage" value={obligation.stage} />
        <InfoPair label="Project" value={obligation.project} />
        <InfoPair label="Owner" value={obligation.owner} />
        <InfoPair label="Due Date" value={obligation.dueDate} />
        <InfoPair label="Next Review" value={obligation.nextReview} />
      </div>

      <div className="my-7 h-px bg-[rgba(46,127,255,0.16)]" />

      <div className="space-y-6">
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-[15px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            <Link2 size={16} className="text-cyan-300" />
            Linked Risks ({obligation.linkedRisks.length})
          </h3>
          <div className="space-y-3">
            {obligation.linkedRisks.map(item => <LinkCard key={item.code} label="Risk" {...item} />)}
          </div>
        </section>

        <section>
          <h3 className="mb-3 flex items-center gap-2 text-[15px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            <Link2 size={16} className="text-cyan-300" />
            Linked Controls ({obligation.linkedControls.length})
          </h3>
          <div className="space-y-3">
            {obligation.linkedControls.map(item => <LinkCard key={item.code} label="Control" {...item} />)}
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-[15px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Evidence Required</h3>
          <ul className="space-y-2">
            {obligation.evidenceRequired.map(item => (
              <li key={item} className="flex items-center gap-2 text-[14px] text-[#EEF3FA]">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="mb-3 text-[15px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Change Log</h3>
          <div className="space-y-0">
            {obligation.changeLog.map((entry, index) => (
              <div key={`${entry.date}-${entry.note}`} className="grid grid-cols-[16px_1fr] gap-3">
                <div className="flex flex-col items-center">
                  <span className={`mt-1 h-2 w-2 rounded-full ${index === 0 ? 'bg-cyan-300' : 'bg-[#5A6E88]'}`} />
                  {index < obligation.changeLog.length - 1 && <span className="h-full min-h-[38px] w-px bg-[#264468]" />}
                </div>
                <div className="pb-4">
                  <p className="text-[11px] text-[#7A94B4]">{entry.date}</p>
                  <p className="mt-1 text-[13px] text-[#EEF3FA]">{entry.note}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}

export function ObligationsRegister({ onToast }: { onToast?: (message: string, type?: 'success' | 'warning' | 'error' | 'info') => void }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'All Status' | ObligationStatus>('All Status');
  const [project, setProject] = useState('All Projects');
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const projects = useMemo(() => ['All Projects', ...Array.from(new Set(obligations.map(item => item.project)))], []);

  const filtered = obligations.filter(item => {
    const searchText = `${item.code} ${item.obligation} ${item.authority} ${item.project} ${item.owner}`.toLowerCase();
    const matchesQuery = searchText.includes(query.toLowerCase());
    const matchesStatus = status === 'All Status' || item.status === status;
    const matchesProject = project === 'All Projects' || item.project === project;
    return matchesQuery && matchesStatus && matchesProject;
  });

  const selected = selectedCode ? obligations.find(item => item.code === selectedCode) ?? null : null;
  const closeDetail = () => setSelectedCode(null);

  return (
    <div className={`grid h-full min-h-0 bg-[#080A0E] text-[#EEF3FA] ${selected ? 'xl:grid-cols-[minmax(0,1fr)_600px]' : 'xl:grid-cols-1'}`}>
      <div className="custom-scrollbar min-h-0 overflow-y-auto">
        <div className="border-b border-[rgba(46,127,255,0.14)] px-6 py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <FileText size={30} className="text-cyan-300" />
                <h1 className="text-2xl font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Obligations Register</h1>
              </div>
              <p className="mt-2 text-[13px] text-[#7A94B4]">Track regulatory and contractual obligations across all projects</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-[13px] text-[#A8B3C7]">{filtered.length} of {obligations.length} obligations</p>
              <button
                type="button"
                onClick={() => onToast?.('Add obligation flow ready to connect', 'info')}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-cyan-400 px-4 text-[12px] font-black text-[#07111F] shadow-lg shadow-cyan-950/25 transition-colors hover:bg-cyan-300"
              >
                <Plus size={15} />
                Add Obligation
              </button>
            </div>
          </div>
        </div>

        <div className="border-b border-[rgba(46,127,255,0.14)] p-6">
          <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_180px_220px]">
            <label className="relative">
              <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A94B4]" />
              <input
                value={query}
                onChange={event => {
                  setQuery(event.target.value);
                  closeDetail();
                }}
                placeholder="Search obligations..."
                className="h-11 w-full rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#111318] pl-11 pr-4 text-[13px] text-[#EEF3FA] outline-none placeholder:text-[#5A6E88] focus:border-cyan-300/70"
              />
            </label>
            <select
              value={status}
              onChange={event => {
                setStatus(event.target.value as 'All Status' | ObligationStatus);
                closeDetail();
              }}
              className="h-11 rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#111318] px-4 text-[13px] text-[#DDE6F8] outline-none focus:border-cyan-300/70"
            >
              {['All Status', 'Overdue', 'Pending', 'Met'].map(item => <option key={item}>{item}</option>)}
            </select>
            <select
              value={project}
              onChange={event => {
                setProject(event.target.value);
                closeDetail();
              }}
              className="h-11 rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#111318] px-4 text-[13px] text-[#DDE6F8] outline-none focus:border-cyan-300/70"
            >
              {projects.map(item => <option key={item}>{item}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left">
            <thead>
              <tr className="border-b border-[rgba(46,127,255,0.14)] text-[11px] font-black uppercase tracking-wide text-[#5A6E88]">
                <th className="px-6 py-4">Code</th>
                <th className="px-4 py-4">Obligation</th>
                <th className="px-4 py-4">Authority</th>
                <th className="px-4 py-4">Project</th>
                <th className="px-4 py-4">Stage</th>
                <th className="px-4 py-4">Due Date</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Owner</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const active = item.code === selected?.code;
                return (
                  <tr
                    key={item.code}
                    onClick={() => setSelectedCode(item.code)}
                    className={`cursor-pointer border-b border-[rgba(46,127,255,0.08)] transition-colors ${active ? 'bg-cyan-400/10' : 'hover:bg-white/[0.035]'}`}
                  >
                    <td className="px-6 py-5 align-top font-mono text-[13px] font-black text-cyan-300">{item.code}</td>
                    <td className="px-4 py-5 align-top">
                      <p className="max-w-[260px] text-[14px] font-black leading-5 text-[#DDE6F8]">{item.obligation}</p>
                      <p className="mt-1 text-[11px] text-[#5A6E88]">{item.category}</p>
                    </td>
                    <td className="px-4 py-5 align-top">
                      <p className="max-w-[190px] text-[14px] text-[#BCC8DC]">{item.authority}</p>
                      <p className="mt-1 text-[11px] text-[#5A6E88]">{item.jurisdiction}</p>
                    </td>
                    <td className="px-4 py-5 align-top text-[14px] text-[#DDE6F8]">{item.project}</td>
                    <td className="px-4 py-5 align-top text-[12px] leading-5 text-[#A8B3C7]">{item.stage}</td>
                    <td className="px-4 py-5 align-top text-[14px] text-[#DDE6F8]">{item.dueDate}</td>
                    <td className="px-4 py-5 align-top"><StatusBadge status={item.status} /></td>
                    <td className="px-4 py-5 align-top text-[14px] text-[#DDE6F8]">{item.owner}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="min-h-0">
          <ObligationDetail obligation={selected} onClose={closeDetail} />
        </div>
      )}
    </div>
  );
}
