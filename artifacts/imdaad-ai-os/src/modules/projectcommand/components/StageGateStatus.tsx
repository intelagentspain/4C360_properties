import { AlertTriangle, CheckCircle2, ShieldAlert, Target } from 'lucide-react';
import { useSelectedProjectCommandData } from '../useProjectCommandData';

type GateStatus = 'Clear' | 'At Risk' | 'Blocked';

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
  icon: React.ReactNode;
  children: React.ReactNode;
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

export function StageGateStatus() {
  const { project, risks } = useSelectedProjectCommandData();
  const highRisks = risks.filter(risk => risk.severity === 'high' || risk.severity === 'critical');
  const criticalRisk = highRisks[0]?.title ?? 'Fire Safety Compliance';
  const programmeRisk = highRisks.find(risk => risk.category === 'programme')?.title ?? 'Building Completion Delay';
  const legalRisk = highRisks.find(risk => risk.category === 'legal' || risk.category === 'external')?.title ?? 'Environmental Permit';

  const rows: Array<{ gate: string; projectName: string; status: GateStatus; blockers: string }> = [
    { gate: 'Construction Start', projectName: project.name, status: 'Clear', blockers: 'None' },
    { gate: 'Commissioning Ready', projectName: project.developer.includes('Danube') ? 'Riverside Towers' : 'Downtown Residences', status: 'At Risk', blockers: '2 issues' },
    { gate: 'Handover Go/No-Go', projectName: project.location.includes('Dubai') ? 'Marina Vista' : 'Harbour View', status: 'Blocked', blockers: '5 issues' },
    { gate: 'Warranty Control Point', projectName: 'Cocoon Residences A', status: 'Clear', blockers: 'None' },
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
                  <td className={`py-4 pl-4 text-right text-[13px] font-bold ${row.blockers === 'None' ? 'text-[#7A8295]' : 'text-red-300'}`}>{row.blockers}</td>
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
    </div>
  );
}
