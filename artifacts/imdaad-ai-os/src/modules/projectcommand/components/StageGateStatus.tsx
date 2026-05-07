import { useState, type ReactNode } from 'react';
import { AlertTriangle, BookOpen, CalendarClock, CheckCircle2, FileText, GitBranch, Mail, MessageCircle, Mic, Plus, Settings2, ShieldAlert, Sparkles, Target, UserRound, X } from 'lucide-react';
import { useSelectedProjectCommandData } from '../useProjectCommandData';

type GateStatus = 'Clear' | 'At Risk' | 'Blocked';
type GateIssue = {
  id: string;
  title: string;
  severity: 'Critical' | 'High' | 'Medium';
  status: string;
  owner: string;
  due: string;
  summary: string;
  evidence: string;
  nextAction: string;
};
type GateRow = { gate: string; projectName: string; status: GateStatus; issues: GateIssue[] };

const statusStyles: Record<GateStatus, string> = {
  Clear: 'border-emerald-400/25 bg-emerald-400/12 text-emerald-300',
  'At Risk': 'border-amber-400/25 bg-amber-400/12 text-amber-300',
  Blocked: 'border-red-400/25 bg-red-400/12 text-red-300',
};

const exposureStyles: Record<string, string> = {
  'Very High': 'text-red-300',
  High: 'text-amber-400',
  Medium: 'text-yellow-300',
  Effective: 'text-emerald-300',
  Failed: 'text-red-300',
  Exception: 'text-amber-400',
};

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#111318] p-4">
      <div className="mb-4 flex items-center gap-2 text-[15px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function IssueBadge({ severity }: { severity: GateIssue['severity'] }) {
  const styles: Record<GateIssue['severity'], string> = {
    Critical: 'border-red-400/30 bg-red-400/12 text-red-200',
    High: 'border-amber-400/30 bg-amber-400/12 text-amber-200',
    Medium: 'border-yellow-300/30 bg-yellow-300/12 text-yellow-200',
  };
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${styles[severity]}`}>{severity}</span>;
}

function GateIssuesModal({ row, onClose }: { row: GateRow; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[2600] flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-label="Close issue details" />
      <div className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[rgba(46,127,255,0.24)] bg-[#0A1628] shadow-2xl">
        <div className="flex shrink-0 items-start justify-between border-b border-[rgba(46,127,255,0.14)] bg-[linear-gradient(135deg,rgba(217,43,28,0.16),rgba(124,58,237,0.08))] px-5 py-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-red-200">Stage gate blockers</div>
            <h3 className="mt-1 text-xl font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{row.gate}</h3>
            <p className="mt-1 text-[12px] text-[#8EA7C7]">{row.projectName} · {row.issues.length} active {row.issues.length === 1 ? 'issue' : 'issues'}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-[#8EA7C7] hover:bg-white/5 hover:text-white"><X size={18} /></button>
        </div>
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-5">
          <div className="space-y-3">
            {row.issues.map(issue => (
              <div key={issue.id} className="rounded-2xl border border-[rgba(46,127,255,0.16)] bg-[#07111F] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-cyan-300">{issue.id}</span>
                      <IssueBadge severity={issue.severity} />
                      <span className="rounded-full border border-[rgba(46,127,255,0.18)] bg-white/5 px-2.5 py-1 text-[10px] font-bold text-[#B8C7DB]">{issue.status}</span>
                    </div>
                    <h4 className="mt-3 text-[15px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{issue.title}</h4>
                    <p className="mt-2 text-[12px] leading-5 text-[#B8C7DB]">{issue.summary}</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 md:grid-cols-3">
                  <div className="rounded-xl border border-[rgba(46,127,255,0.12)] bg-[#0A1628] p-3">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wide text-[#7A94B4]"><UserRound size={13} /> Owner</div>
                    <p className="mt-1 text-[12px] font-bold text-white">{issue.owner}</p>
                  </div>
                  <div className="rounded-xl border border-[rgba(46,127,255,0.12)] bg-[#0A1628] p-3">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wide text-[#7A94B4]"><CalendarClock size={13} /> Due</div>
                    <p className="mt-1 text-[12px] font-bold text-white">{issue.due}</p>
                  </div>
                  <div className="rounded-xl border border-[rgba(46,127,255,0.12)] bg-[#0A1628] p-3">
                    <div className="text-[10px] font-black uppercase tracking-wide text-[#7A94B4]">Evidence</div>
                    <p className="mt-1 text-[12px] font-bold text-white">{issue.evidence}</p>
                  </div>
                </div>
                <div className="mt-3 rounded-xl border border-[#7C3AED]/25 bg-[#7C3AED]/10 px-3 py-2 text-[12px] leading-5 text-violet-100">
                  <span className="font-black">Next action: </span>{issue.nextAction}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function GateAgentModal({ onClose }: { onClose: () => void }) {
  const ruleCards = [
    { title: 'Authority approval rules', detail: 'Require evidence packs before a gate can move from At Risk to Clear.', active: true },
    { title: 'Blocker escalation', detail: 'Escalate unresolved critical blockers after 48 hours to the project director.', active: true },
    { title: 'Evidence completeness', detail: 'Prevent handover gate clearance when required documents are missing.', active: true },
  ];
  const knowledgeItems = [
    'Stage gate operating procedure',
    'Handover evidence checklist',
    'Authority inspection guide',
    'Warranty control playbook',
  ];
  const docItems = [
    'Fire Safety Certificate template',
    'Commissioning pack index',
    'O&M manual acceptance form',
  ];
  const workflowItems = [
    'Commissioning Ready approval workflow',
    'Handover Go/No-Go workflow',
    'Warranty Control review workflow',
  ];

  return (
    <div className="fixed inset-0 z-[2600] flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-label="Close gate configuration" />
      <div className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[rgba(46,127,255,0.24)] bg-[#0A1628] shadow-2xl">
        <div className="flex shrink-0 items-start justify-between border-b border-[rgba(46,127,255,0.14)] bg-[linear-gradient(135deg,rgba(124,58,237,0.16),rgba(9,21,42,0.96),rgba(217,43,28,0.1))] px-5 py-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-[#C4B5FD]">Dedicated AI agent</div>
            <h3 className="mt-1 text-xl font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Stage Gate Agent</h3>
            <p className="mt-1 max-w-2xl text-[12px] leading-5 text-[#8EA7C7]">Ask the agent to explain blockers, check required evidence, draft escalation notes, build workflows, or prepare updates for gate owners.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-[#8EA7C7] hover:bg-white/5 hover:text-white" aria-label="Close Stage Gate Agent"><X size={18} /></button>
        </div>
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-5">
          <div className="mb-4 grid gap-3 md:grid-cols-4">
            {[
              ['Chat', 'Ask about gate blockers and evidence gaps', MessageCircle],
              ['Voice', 'Talk through gate decisions live', Mic],
              ['Email', 'Draft gate owner updates and escalations', Mail],
              ['WhatsApp', 'Prepare short action messages for field teams', MessageCircle],
            ].map(([label, detail, Icon]) => (
              <button key={label as string} className="rounded-2xl border border-[#7C3AED]/24 bg-[#7C3AED]/10 p-4 text-left transition-colors hover:border-[#7C3AED]/55 hover:bg-[#7C3AED]/16">
                <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#7C3AED]/22 text-[#C4B5FD]"><Icon size={16} /></span>
                <p className="text-[12px] font-black text-[#EEF3FA]">{label as string}</p>
                <p className="mt-1 text-[10px] leading-4 text-[#8EA7C7]">{detail as string}</p>
              </button>
            ))}
          </div>
          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-[rgba(46,127,255,0.16)] bg-[#07111F] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[14px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    <Settings2 size={16} className="text-[#C4B5FD]" />
                    What this agent can manage
                  </div>
                  <button className="inline-flex items-center gap-1 rounded-lg border border-[#7C3AED]/35 bg-[#7C3AED]/12 px-3 py-1.5 text-[10px] font-black text-[#C4B5FD] hover:bg-[#7C3AED]/18">
                    <Plus size={12} />
                    Add rule
                  </button>
                </div>
                <div className="grid gap-3">
                  {ruleCards.map(rule => (
                    <div key={rule.title} className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#0A1628] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[12px] font-black text-[#DDE6F8]">{rule.title}</p>
                          <p className="mt-1 text-[11px] leading-5 text-[#8EA7C7]">{rule.detail}</p>
                        </div>
                        <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-1 text-[9px] font-black uppercase text-emerald-200">{rule.active ? 'Active' : 'Draft'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <ConfigList title="Knowledge base" icon={<BookOpen size={15} className="text-cyan-300" />} action="Add article" items={knowledgeItems} />
                <ConfigList title="Required documents" icon={<FileText size={15} className="text-emerald-300" />} action="Add document" items={docItems} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-[#7C3AED]/22 bg-[linear-gradient(135deg,rgba(124,58,237,0.16),rgba(7,17,31,0.82))] p-4">
                <div className="mb-3 flex items-center gap-2 text-[14px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  <GitBranch size={16} className="text-[#C4B5FD]" />
                  Workflows
                </div>
                <div className="space-y-2">
                  {workflowItems.map(item => (
                    <button key={item} className="w-full rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#07111F]/80 px-3 py-2 text-left text-[11px] font-bold text-[#DDE6F8] hover:border-[#7C3AED]/45 hover:bg-[#7C3AED]/12">
                      {item}
                    </button>
                  ))}
                </div>
                <button className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-[12px] font-black text-white hover:bg-[#6D28D9]">
                  <Plus size={14} />
                  Create workflow
                </button>
              </div>

              <div className="rounded-2xl border border-[rgba(46,127,255,0.16)] bg-[#07111F] p-4">
                <p className="text-[13px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>AI gate checks</p>
                <p className="mt-2 text-[11px] leading-5 text-[#8EA7C7]">ProjectCommand uses these settings to explain blockers, recommend evidence, and decide which gates need escalation.</p>
                <div className="mt-3 grid gap-2">
                  {['Use knowledge base in blocker explanations', 'Require linked evidence before clearance', 'Auto-draft escalation notes', 'Show missing document warnings'].map(item => (
                    <label key={item} className="flex items-center gap-2 rounded-xl bg-[#0A1628] px-3 py-2 text-[11px] font-bold text-[#B8C7DB]">
                      <input type="checkbox" defaultChecked className="h-4 w-4 accent-[#7C3AED]" />
                      {item}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 justify-end gap-2 border-t border-[rgba(46,127,255,0.14)] bg-[#09152A] px-5 py-4">
          <button onClick={onClose} className="rounded-xl border border-[rgba(46,127,255,0.22)] px-4 py-2 text-[12px] font-bold text-[#B8C7DB] hover:bg-white/5">Close</button>
          <button onClick={onClose} className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-5 py-2 text-[12px] font-black text-white hover:bg-[#6D28D9]"><MessageCircle size={14} /> Start chat</button>
        </div>
      </div>
    </div>
  );
}

function ConfigList({ title, icon, action, items }: { title: string; icon: ReactNode; action: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-[rgba(46,127,255,0.16)] bg-[#07111F] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[14px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          {icon}
          {title}
        </div>
        <button className="rounded-lg border border-[rgba(46,127,255,0.18)] bg-[#0A1628] px-2 py-1 text-[9px] font-black uppercase text-[#8EA7C7] hover:text-white">{action}</button>
      </div>
      <div className="space-y-2">
        {items.map(item => (
          <button key={item} className="w-full rounded-xl border border-[rgba(46,127,255,0.12)] bg-[#0A1628] px-3 py-2 text-left text-[11px] font-bold text-[#B8C7DB] hover:border-cyan-300/35 hover:text-white">
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

export function StageGateStatus() {
  const { project, risks } = useSelectedProjectCommandData();
  const [selectedRow, setSelectedRow] = useState<GateRow | null>(null);
  const [showAgent, setShowAgent] = useState(false);
  const highRisks = risks.filter(risk => risk.severity === 'high' || risk.severity === 'critical');
  const criticalRisk = highRisks[0]?.title ?? 'Fire Safety Compliance';
  const programmeRisk = highRisks.find(risk => risk.category === 'programme')?.title ?? 'Building Completion Delay';
  const legalRisk = highRisks.find(risk => risk.category === 'legal' || risk.category === 'external')?.title ?? 'Environmental Permit';

  const rows: GateRow[] = [
    { gate: 'Construction Start', projectName: project.name, status: 'Clear', issues: [] },
    {
      gate: 'Commissioning Ready',
      projectName: project.developer.includes('Danube') ? 'Riverside Towers' : 'Downtown Residences',
      status: 'At Risk',
      issues: [
        {
          id: 'COM-002',
          title: 'Integrated MEP testing pack incomplete',
          severity: 'High',
          status: 'Open',
          owner: 'MEP Coordinator',
          due: '30 Apr 2026',
          summary: 'Chiller, fire pump, and emergency power test evidence is not yet consolidated for commissioning sign-off.',
          evidence: '3 test reports missing',
          nextAction: 'Collect vendor test sheets and upload the consolidated commissioning pack before the next gate review.',
        },
        {
          id: 'COM-006',
          title: 'Fire pump pressure variance unresolved',
          severity: 'Medium',
          status: 'In review',
          owner: 'Fire Safety Vendor',
          due: '29 Apr 2026',
          summary: 'Latest pressure reading is outside the acceptable band and needs supervisor verification before commissioning can clear.',
          evidence: 'Reading trend + site photo',
          nextAction: 'Retest with QA present and attach signed readings to the evidence repository.',
        },
      ],
    },
    {
      gate: 'Handover Go/No-Go',
      projectName: project.location.includes('Dubai') ? 'Marina Vista' : 'Harbour View',
      status: 'Blocked',
      issues: [
        {
          id: 'HGO-001',
          title: 'Fire Safety Certificate not cleared',
          severity: 'Critical',
          status: 'Blocked',
          owner: 'Sarah Chen',
          due: '28 Apr 2026',
          summary: 'DCD clearance is still pending and blocks occupation approval until evidence is accepted.',
          evidence: 'DCD inspection report',
          nextAction: 'Escalate with authority liaison and resubmit the corrected fire-stopping evidence pack.',
        },
        {
          id: 'HGO-004',
          title: 'Final authority inspection slot unconfirmed',
          severity: 'High',
          status: 'Open',
          owner: 'Permits Lead',
          due: '30 Apr 2026',
          summary: 'The final inspection appointment has not been confirmed, which could push handover beyond the planned window.',
          evidence: 'Appointment request log',
          nextAction: 'Confirm the inspection date and link the booking reference to the gate record.',
        },
        {
          id: 'HGO-008',
          title: 'Resident handover snag pack incomplete',
          severity: 'High',
          status: 'In progress',
          owner: 'QA/QC Lead',
          due: '1 May 2026',
          summary: 'Snag evidence for common-area items is incomplete and cannot be released to resident-facing workflows.',
          evidence: '42 photos outstanding',
          nextAction: 'Close critical snags first and publish the batch pack for management review.',
        },
        {
          id: 'HGO-011',
          title: 'O&M manuals missing final version',
          severity: 'Medium',
          status: 'Open',
          owner: 'Document Controller',
          due: '2 May 2026',
          summary: 'The latest O&M manuals are still in draft status and need final consultant sign-off.',
          evidence: 'Manual revision log',
          nextAction: 'Request final consultant approval and upload the signed PDF bundle.',
        },
        {
          id: 'HGO-014',
          title: 'As-built drawings pending consultant sign-off',
          severity: 'Medium',
          status: 'Open',
          owner: 'Design Consultant',
          due: '3 May 2026',
          summary: 'As-built drawings are uploaded but not accepted, leaving the handover pack incomplete.',
          evidence: 'Drawing register',
          nextAction: 'Resolve comments and re-submit the drawings for final approval.',
        },
      ],
    },
    { gate: 'Warranty Control Point', projectName: 'Cocoon Residences A', status: 'Clear', issues: [] },
  ];

  const exposures = [
    { label: criticalRisk, value: 'Very High' },
    { label: programmeRisk, value: 'High' },
    { label: legalRisk, value: 'Medium' },
  ];

  const exceptions = [
    { label: 'Fire-Stopping Inspection', value: 'Failed' },
    { label: 'Warranty SLA Monitoring', value: 'Exception' },
    { label: 'All Others', value: 'Effective' },
  ];

  const readiness = [
    { label: 'Evidence Completeness', value: '94%' },
    { label: 'Control Documentation', value: '97%' },
    { label: 'Risk Register Currency', value: '82%' },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#111318] p-4">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-lg font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            <span className="flex h-8 w-8 items-center justify-center rounded-full text-cyan-300">
              <Target size={22} />
            </span>
            Stage Gate Status &amp; Blockers
          </div>
          <button
            type="button"
            onClick={() => setShowAgent(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[linear-gradient(135deg,#3B82F6,#7C3AED)] px-3 text-[11px] font-black text-white shadow-[0_0_22px_rgba(124,58,237,0.32)] transition-transform hover:scale-[1.03]"
            aria-label="Open Stage Gate AI Agent"
          >
            <Sparkles size={14} />
            AI
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-[#243448] text-[11px] font-black uppercase tracking-wide text-[#5A6E88]">
                <th className="pb-3 pr-4">Gate</th>
                <th className="pb-3 px-4">Project</th>
                <th className="pb-3 px-4">Status</th>
                <th className="pb-3 pl-4 text-right">Blockers</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.gate} className="border-b border-[#202A38]/80 last:border-b-0">
                  <td className="py-4 pr-4 text-[13px] font-black text-[#DDE6F8]">{row.gate}</td>
                  <td className="px-4 py-4 text-[13px] text-[#A8B3C7]">{row.projectName}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded-md border px-3 py-1.5 text-[11px] font-black ${statusStyles[row.status]}`}>{row.status}</span>
                  </td>
                  <td className="py-4 pl-4 text-right text-[13px] font-bold">
                    {row.issues.length === 0 ? (
                      <span className="text-[#7A8295]">None</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedRow(row)}
                        className="rounded-md border border-red-400/25 bg-red-400/10 px-2.5 py-1 text-red-200 transition-colors hover:border-red-300/55 hover:bg-red-400/16 hover:text-white"
                      >
                        {row.issues.length} {row.issues.length === 1 ? 'issue' : 'issues'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Top Risk Exposures" icon={<AlertTriangle size={16} className="text-amber-400" />}>
          <div className="space-y-3">
            {exposures.map(item => (
              <div key={item.label} className="flex items-center justify-between gap-4 text-[13px]">
                <span className="truncate text-[#A8B3C7]">{item.label}</span>
                <span className={`shrink-0 font-black ${exposureStyles[item.value]}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Control Exceptions" icon={<ShieldAlert size={16} className="text-[#C084FC]" />}>
          <div className="space-y-3">
            {exceptions.map(item => (
              <div key={item.label} className="flex items-center justify-between gap-4 text-[13px]">
                <span className="truncate text-[#A8B3C7]">{item.label}</span>
                <span className={`shrink-0 font-black ${exposureStyles[item.value]}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Audit Readiness Score" icon={<CheckCircle2 size={16} className="text-emerald-300" />}>
          <div className="space-y-3">
            {readiness.map(item => (
              <div key={item.label} className="flex items-center justify-between gap-4 text-[13px]">
                <span className="truncate text-[#A8B3C7]">{item.label}</span>
                <span className={`shrink-0 font-black ${item.value === '82%' ? 'text-amber-400' : 'text-emerald-300'}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      {selectedRow && <GateIssuesModal row={selectedRow} onClose={() => setSelectedRow(null)} />}
      {showAgent && <GateAgentModal onClose={() => setShowAgent(false)} />}
    </div>
  );
}
