import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileText,
  FolderOpen,
  Search,
  ShieldCheck,
  Shield,
  Upload,
  X,
} from 'lucide-react';
import {
  evidenceDocuments,
  evidenceProjectBuckets,
  type EvidenceDocument,
  type EvidenceStatus,
  type EvidenceType,
} from '../data/evidence';

const statusStyles: Record<EvidenceStatus, string> = {
  Current: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300',
  Superseded: 'border-amber-400/25 bg-amber-400/10 text-amber-300',
  Expired: 'border-red-400/25 bg-red-400/10 text-red-300',
};

const statusIcons: Record<EvidenceStatus, typeof CheckCircle2> = {
  Current: CheckCircle2,
  Superseded: Clock3,
  Expired: AlertTriangle,
};

function StatusBadge({ status }: { status: EvidenceStatus }) {
  const Icon = statusIcons[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-black ${statusStyles[status]}`}>
      <Icon size={12} />
      {status}
    </span>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  accent,
  delta,
}: {
  icon: typeof FolderOpen;
  label: string;
  value: string | number;
  accent: string;
  delta?: string;
}) {
  return (
    <div className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#15171B] p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-8 w-8 place-items-center rounded-lg border" style={{ borderColor: `${accent}55`, background: `${accent}18`, color: accent }}>
          <Icon size={17} />
        </span>
        {delta && <span className="font-mono text-[11px] font-black text-emerald-300">{delta}</span>}
      </div>
      <p className="mt-4 text-2xl font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{value}</p>
      <p className="mt-1 text-[13px] text-[#7A94B4]">{label}</p>
    </div>
  );
}

function MiniDonut({
  title,
  segments,
  legend,
}: {
  title: string;
  segments: { value: number; color: string }[];
  legend: { label: string; color: string; value?: number }[];
}) {
  const total = Math.max(segments.reduce((sum, segment) => sum + segment.value, 0), 1);
  let offset = 25;

  return (
    <div className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#15171B] p-4">
      <h3 className="text-[13px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{title}</h3>
      <div className="mt-3 flex items-center justify-center gap-7">
        <svg viewBox="0 0 42 42" className="h-20 w-20 -rotate-90">
          <circle cx="21" cy="21" r="15.5" fill="none" stroke="#2A3442" strokeWidth="5" />
          {segments.map(segment => {
            const dash = (segment.value / total) * 100;
            const circle = (
              <circle
                key={`${segment.color}-${segment.value}-${offset}`}
                cx="21"
                cy="21"
                r="15.5"
                fill="none"
                stroke={segment.color}
                strokeDasharray={`${dash} ${100 - dash}`}
                strokeDashoffset={offset}
                strokeLinecap="butt"
                strokeWidth="5"
              />
            );
            offset -= dash;
            return circle;
          })}
        </svg>
        <div className="space-y-2">
          {legend.map(item => (
            <div key={item.label} className="flex items-center justify-between gap-10 text-[13px] text-[#A8B3C7]">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
                {item.label}
              </span>
              {typeof item.value === 'number' && <span className="font-mono text-[#7A94B4]">{item.value}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProjectBars({ documents }: { documents: EvidenceDocument[] }) {
  const max = Math.max(...evidenceProjectBuckets.map(project => documents.filter(item => item.project.startsWith(project)).length), 1);

  return (
    <div className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#15171B] p-4">
      <h3 className="text-[13px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>By Project</h3>
      <div className="mt-4 flex h-[86px] items-end gap-4 border-b border-l border-[#3B4658] px-4">
        {evidenceProjectBuckets.map(project => {
          const count = documents.filter(item => item.project.startsWith(project)).length;
          return (
            <div key={project} className="flex flex-1 flex-col items-center gap-2">
              <div className="w-full rounded-t-sm bg-cyan-400" style={{ height: `${Math.max((count / max) * 58, count ? 12 : 0)}px` }} />
              <span className="text-[10px] text-[#5A6E88]">{project}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActionButton({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: typeof Eye;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="grid h-8 w-8 place-items-center rounded-lg text-[#7A94B4] transition-colors hover:bg-white/5 hover:text-cyan-300"
    >
      <Icon size={15} />
    </button>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#15171B] p-4">
      <p className="text-[12px] text-[#7A94B4]">{label}</p>
      <p className="mt-3 text-[15px] font-black leading-5 text-[#EEF3FA]">{value}</p>
    </div>
  );
}

function EvidenceDetailDrawer({
  document,
  onClose,
  onToast,
}: {
  document: EvidenceDocument;
  onClose: () => void;
  onToast?: (message: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/55 backdrop-blur-sm">
      <button type="button" aria-label="Dismiss evidence overlay" className="absolute inset-0 cursor-default" onClick={onClose} />
      <aside className="custom-scrollbar relative z-10 h-full w-full max-w-[760px] overflow-y-auto border-l border-[rgba(46,127,255,0.18)] bg-[#0B0D11] shadow-2xl shadow-black/60">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[rgba(46,127,255,0.12)] bg-[#0B0D11]/96 px-6 py-5 backdrop-blur">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-[12px] font-black text-cyan-300">{document.code}</span>
              <StatusBadge status={document.status} />
              <span className="font-mono text-[12px] text-[#A8B3C7]">{document.version}</span>
            </div>
            <h2 className="mt-4 text-2xl font-black leading-7 text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{document.title}</h2>
            <p className="mt-3 text-[15px] text-[#B8C7DB]">{document.type}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            onMouseDown={onClose}
            aria-label="Close evidence preview"
            className="rounded-lg p-2 text-[#7A94B4] transition-colors hover:bg-white/5 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <DetailCard label="Project" value={document.project} />
            <DetailCard label="Lifecycle Stage" value={document.stage} />
            <DetailCard label="Upload Date" value={document.uploadDate} />
            <DetailCard label="Uploaded By" value={document.uploader} />
          </div>

          <section className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#15171B] p-5">
            <div className="mb-4 flex items-center gap-2 text-[13px] text-[#7A94B4]">
              <Shield size={17} className="text-violet-300" />
              Linked Obligation
            </div>
            <span className="inline-flex rounded-md border border-violet-400/30 bg-violet-400/10 px-3 py-1.5 font-mono text-[12px] font-black text-violet-200">
              {document.linkedObligation}
            </span>
          </section>

          <section className="grid min-h-[210px] place-items-center rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#15171B] p-6 text-center">
            <div>
              <FileText size={54} className="mx-auto text-[#5A6E88]" />
              <h3 className="mt-4 text-base font-medium text-[#DDE6F8]">Document Preview</h3>
              <p className="mt-2 text-[13px] text-[#7A94B4]">Click download to view full document</p>
            </div>
          </section>

          <section className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#15171B] p-5">
            <h3 className="mb-4 text-[13px] font-medium text-[#7A94B4]">Integrity Information</h3>
            <div className="grid gap-3 text-[15px]">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[#BCC8DC]">Version</span>
                <span className="font-mono font-black text-[#EEF3FA]">{document.version}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[#BCC8DC]">File Hash</span>
                <span className="truncate font-mono text-cyan-300">{document.fileHash}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[#BCC8DC]">Blockchain Verified</span>
                <span className={`inline-flex items-center gap-1.5 font-black ${document.blockchainVerified ? 'text-emerald-300' : 'text-amber-300'}`}>
                  {document.blockchainVerified ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  {document.blockchainVerified ? 'Verified' : 'Pending'}
                </span>
              </div>
            </div>
          </section>

          <div className="grid gap-3 pb-2 md:grid-cols-2">
            <button
              type="button"
              onClick={() => onToast?.(`Download queued for ${document.code}`, 'success')}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-4 text-[14px] font-black text-cyan-300 transition-colors hover:bg-cyan-300/15"
            >
              <Download size={18} />
              Download
            </button>
            <button
              type="button"
              onClick={() => onToast?.(`New version upload ready for ${document.code}`, 'info')}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 text-[14px] font-black text-[#07111F] shadow-lg shadow-cyan-950/25 transition-colors hover:bg-cyan-300"
            >
              <Upload size={18} />
              Upload New Version
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

export function EvidenceRepository({ onToast }: { onToast?: (message: string, type?: 'success' | 'warning' | 'error' | 'info') => void }) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'All Types' | EvidenceType>('All Types');
  const [status, setStatus] = useState<'All Status' | EvidenceStatus>('All Status');
  const [project, setProject] = useState('All Projects');
  const [selectedDocument, setSelectedDocument] = useState<EvidenceDocument | null>(null);

  const projects = useMemo(() => ['All Projects', ...Array.from(new Set(evidenceDocuments.map(item => item.project)))], []);
  const evidenceTypes = useMemo(() => ['All Types', ...Array.from(new Set(evidenceDocuments.map(item => item.type)))] as Array<'All Types' | EvidenceType>, []);
  const filtered = evidenceDocuments.filter(item => {
    const searchText = `${item.code} ${item.title} ${item.type} ${item.project} ${item.stage} ${item.uploader}`.toLowerCase();
    return (
      searchText.includes(query.toLowerCase()) &&
      (type === 'All Types' || item.type === type) &&
      (status === 'All Status' || item.status === status) &&
      (project === 'All Projects' || item.project === project)
    );
  });

  const metrics = {
    total: evidenceDocuments.length,
    current: evidenceDocuments.filter(item => item.status === 'Current').length,
    superseded: evidenceDocuments.filter(item => item.status === 'Superseded').length,
    expired: evidenceDocuments.filter(item => item.status === 'Expired').length,
    types: new Set(evidenceDocuments.map(item => item.type)).size,
    compliance: Math.round((evidenceDocuments.filter(item => item.status === 'Current').length / evidenceDocuments.length) * 100),
  };

  const typeCounts = evidenceTypes
    .filter(item => item !== 'All Types')
    .map(item => ({ label: item, value: evidenceDocuments.filter(document => document.type === item).length, color: item === 'Certificate' ? '#06B6D4' : '#8B5CF6' }));
  const statusCounts = (['Current', 'Expired'] as EvidenceStatus[]).map(item => ({
    label: item,
    value: evidenceDocuments.filter(document => document.status === item).length,
    color: item === 'Current' ? '#22C55E' : '#EF4444',
  }));

  return (
    <div className="custom-scrollbar h-full min-h-0 overflow-y-auto bg-[#080A0E] text-[#EEF3FA]">
      <div className="border-b border-[rgba(46,127,255,0.14)] px-5 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <FolderOpen size={28} className="text-cyan-300" />
            <h1 className="text-2xl font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Evidence Repository</h1>
          </div>
          <button
            type="button"
            onClick={() => onToast?.('Bulk export package is ready to connect', 'info')}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-cyan-300/25 bg-cyan-300/10 px-4 text-[12px] font-black text-cyan-300 transition-colors hover:bg-cyan-300/15"
          >
            <Download size={14} />
            Bulk Export
          </button>
        </div>
      </div>

      <div className="border-b border-[rgba(46,127,255,0.12)] p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <KpiCard icon={FolderOpen} label="Total Documents" value={metrics.total} accent="#06B6D4" />
          <KpiCard icon={CheckCircle2} label="Current" value={metrics.current} accent="#22C55E" delta="+8%" />
          <KpiCard icon={Clock3} label="Superseded" value={metrics.superseded} accent="#F59E0B" />
          <KpiCard icon={AlertTriangle} label="Expired" value={metrics.expired} accent="#EF4444" />
          <KpiCard icon={BarChart3} label="Evidence Types" value={metrics.types} accent="#8B5CF6" />
          <KpiCard icon={ShieldCheck} label="Compliance Rate" value={`${metrics.compliance}%`} accent="#60A5FA" delta="+5%" />
        </div>
      </div>

      <div className="grid gap-3 border-b border-[rgba(46,127,255,0.12)] p-5 xl:grid-cols-[1fr_1fr_1fr]">
        <MiniDonut title="By Document Type" segments={typeCounts} legend={typeCounts} />
        <MiniDonut title="By Status" segments={statusCounts} legend={statusCounts} />
        <ProjectBars documents={evidenceDocuments} />
      </div>

      <div className="border-b border-[rgba(46,127,255,0.12)] p-5">
        <div className="grid gap-3 xl:grid-cols-[minmax(280px,1fr)_140px_140px_190px]">
          <label className="relative">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A94B4]" />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search evidence..."
              className="h-10 w-full rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#15171B] pl-11 pr-4 text-[13px] text-[#EEF3FA] outline-none placeholder:text-[#5A6E88] focus:border-cyan-300/70"
            />
          </label>
          <select value={type} onChange={event => setType(event.target.value as 'All Types' | EvidenceType)} className="h-10 rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#15171B] px-3 text-[13px] text-[#DDE6F8] outline-none focus:border-cyan-300/70">
            {evidenceTypes.map(item => <option key={item}>{item}</option>)}
          </select>
          <select value={status} onChange={event => setStatus(event.target.value as 'All Status' | EvidenceStatus)} className="h-10 rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#15171B] px-3 text-[13px] text-[#DDE6F8] outline-none focus:border-cyan-300/70">
            {['All Status', 'Current', 'Superseded', 'Expired'].map(item => <option key={item}>{item}</option>)}
          </select>
          <select value={project} onChange={event => setProject(event.target.value)} className="h-10 rounded-xl border border-[rgba(46,127,255,0.18)] bg-[#15171B] px-3 text-[13px] text-[#DDE6F8] outline-none focus:border-cyan-300/70">
            {projects.map(item => <option key={item}>{item}</option>)}
          </select>
        </div>
      </div>

      <div className="p-4">
        <div className="overflow-x-auto rounded-xl border border-[rgba(46,127,255,0.16)]">
          <table className="w-full min-w-[1120px] text-left">
            <thead className="bg-[#101216]">
              <tr className="text-[11px] font-black text-[#5A6E88]">
                <th className="px-4 py-4">Code</th>
                <th className="px-4 py-4">Document Title</th>
                <th className="px-4 py-4">Type</th>
                <th className="px-4 py-4">Project</th>
                <th className="px-4 py-4">Stage</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Upload Date</th>
                <th className="px-4 py-4">Uploader</th>
                <th className="px-4 py-4">Version</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(document => (
                <tr key={document.code} className="border-t border-[rgba(46,127,255,0.08)] bg-[#15171B] transition-colors hover:bg-[#1B1D23]">
                  <td className="px-4 py-4 align-top font-mono text-[13px] font-black text-cyan-300">{document.code}</td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex items-center gap-3">
                      <FileText size={15} className="text-[#7A94B4]" />
                      <p className="max-w-[330px] text-[14px] font-black leading-5 text-[#DDE6F8]">{document.title}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top text-[14px] text-[#A8B3C7]">{document.type}</td>
                  <td className="px-4 py-4 align-top text-[14px] text-[#A8B3C7]">{document.project}</td>
                  <td className="px-4 py-4 align-top text-[12px] leading-5 text-[#7A94B4]">{document.stage}</td>
                  <td className="px-4 py-4 align-top"><StatusBadge status={document.status} /></td>
                  <td className="px-4 py-4 align-top font-mono text-[13px] text-[#A8B3C7]">{document.uploadDate}</td>
                  <td className="px-4 py-4 align-top text-[14px] text-[#A8B3C7]">{document.uploader}</td>
                  <td className="px-4 py-4 align-top font-mono text-[12px] text-[#7A94B4]">{document.version}</td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex justify-end gap-1">
                      <ActionButton label={`View ${document.title}`} icon={Eye} onClick={() => setSelectedDocument(document)} />
                      <ActionButton label={`Download ${document.title}`} icon={Download} onClick={() => onToast?.(`Download queued for ${document.code}`, 'success')} />
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-[13px] text-[#7A94B4]">
                    No evidence documents match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-[13px] text-[#7A94B4]">Showing {filtered.length} of {evidenceDocuments.length} documents</p>
      </div>
      {selectedDocument && (
        <EvidenceDetailDrawer
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
          onToast={onToast}
        />
      )}
    </div>
  );
}
