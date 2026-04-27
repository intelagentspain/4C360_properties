import { useMemo, useState } from 'react';
import {
  Bell, Building2, Check, ClipboardCheck, ClipboardList, Database, FileText,
  GitBranch, Globe2, HardHat, Leaf, LayoutGrid, LockKeyhole, Mail, MapPin,
  Search, ShieldCheck, SlidersHorizontal, Ticket, ToggleLeft, ToggleRight,
  UserRound, Users, Wrench, X,
} from 'lucide-react';
import { CURRENT_USER } from '@/lib/currentUser';
import { useClients } from '@/context/ClientsContext';
import { useMemberProfiles } from '@/context/MemberProfilesContext';
import type { MockMemberProfile, PortfolioClient } from '@/data/mockData';
import type { ToastFn } from '@/lib/ui';

interface Props {
  onToast: ToastFn;
}

type ProfileSection = 'overview' | 'team' | 'modules' | 'clients' | 'organisation' | 'access';

interface ModuleToggle {
  id: string;
  name: string;
  description: string;
  owner: string;
  active: boolean;
  tagline: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
}

const sections: Array<{ id: ProfileSection; label: string; icon: React.ComponentType<{ size?: number }> }> = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'modules', label: 'Modules', icon: SlidersHorizontal },
  { id: 'clients', label: 'Properties', icon: Building2 },
  { id: 'organisation', label: 'Organisation', icon: Globe2 },
  { id: 'access', label: 'Access', icon: ShieldCheck },
];

const moduleDefaults: ModuleToggle[] = [
  {
    id: 'vendor-iq',
    name: 'VendorIQ',
    tagline: 'Vendor performance',
    description: 'Vendor scorecards, subcontractor performance, risk watchlists, and corrective actions.',
    owner: 'Management',
    active: true,
    icon: ShieldCheck,
  },
  {
    id: 'snapfix',
    name: 'SnapFix',
    tagline: 'Defect & issue capture',
    description: 'Mobile issue capture, evidence, categorisation, triage, and instant task creation.',
    owner: 'Operations',
    active: true,
    icon: HardHat,
  },
  {
    id: 'service-desk',
    name: 'ServiceDesk',
    tagline: 'Ticket management',
    description: 'Ticket intake, prioritisation, SLA clocks, service workflows, and escalation queues.',
    owner: 'In-house',
    active: true,
    icon: Ticket,
  },
  {
    id: 'resident-portal',
    name: 'ResidentPortal',
    tagline: 'Resident & owner mgmt',
    description: 'Resident requests, owner communication, service tracking, and portal access.',
    owner: 'Partner',
    active: true,
    icon: Users,
  },
  {
    id: 'facility-core',
    name: 'FacilityCore',
    tagline: 'Facility management',
    description: 'Asset register, PPM schedule, facility operations, and maintenance controls.',
    owner: 'Contractor',
    active: true,
    icon: Wrench,
  },
  {
    id: 'field-ops',
    name: 'FieldOps',
    tagline: 'Trade services',
    description: 'Technician dispatch, job execution, evidence capture, parts, and field productivity.',
    owner: 'In-house',
    active: true,
    icon: SlidersHorizontal,
  },
  {
    id: 'project-command',
    name: 'ProjectCommand',
    tagline: 'Project management',
    description: 'Project milestones, workflows, approvals, delivery governance, and progress reporting.',
    owner: 'Management',
    active: false,
    icon: GitBranch,
  },
  {
    id: 'green-track',
    name: 'GreenTrack',
    tagline: 'Sustainability & ESG',
    description: 'Sustainability indicators, ESG tracking, energy signals, and improvement actions.',
    owner: 'Partner',
    active: false,
    icon: Leaf,
  },
  {
    id: 'inspect-pro',
    name: 'InspectPro',
    tagline: 'Inspection & audit',
    description: 'Inspections, audits, checklists, compliance findings, and corrective actions.',
    owner: 'Superadmin',
    active: false,
    icon: ClipboardCheck,
  },
];

const moduleDetails: Record<string, { workflows: string[]; rules: string[]; policies: string[] }> = {
  'vendor-iq': {
    workflows: ['Vendor onboarding review', 'Performance exception review', 'Corrective action request'],
    rules: ['Low score vendors enter watchlist', 'Repeated SLA misses trigger review', 'Unapproved vendors cannot receive critical jobs'],
    policies: ['Vendor scorecards are management-only', 'Commercial notes are restricted', 'Partner users see only their own performance'],
  },
  snapfix: {
    workflows: ['Capture issue', 'AI categorisation', 'Create incident or task', 'Attach evidence to history'],
    rules: ['Low confidence captures require review', 'Safety issues become incidents', 'Duplicate captures are grouped by site'],
    policies: ['Photos are linked to organisation records', 'Sensitive captures require role approval', 'AI labels are editable by authorised users'],
  },
  'service-desk': {
    workflows: ['Create work order', 'Assign technician', 'Verify completion evidence', 'Close with SLA outcome'],
    rules: ['High severity requires supervisor approval', 'Overdue work orders escalate automatically', 'Evidence required before closure'],
    policies: ['Contractors see assigned jobs only', 'Property-visible notes require approval', 'Edits are retained in work-order history'],
  },
  'resident-portal': {
    workflows: ['Resident request intake', 'Owner notification', 'Service tracking update', 'Satisfaction capture'],
    rules: ['Urgent resident requests notify supervisors', 'Repeated complaints are grouped by property', 'Closed requests trigger satisfaction check'],
    policies: ['Residents see their own requests only', 'Owner data is organisation controlled', 'Public portal access follows property settings'],
  },
  'facility-core': {
    workflows: ['Generate PPM schedule', 'Approve intervention window', 'Dispatch preventive task', 'Update asset health'],
    rules: ['Critical assets cannot skip PPM', 'Overdue PPM affects property risk score', 'Parts shortage blocks auto-dispatch'],
    policies: ['PPM changes require management role', 'Vendor PPM access is limited by contract', 'Asset history is retained for compliance'],
  },
  'field-ops': {
    workflows: ['Dispatch technician', 'Execute field job', 'Capture evidence', 'Close with supervisor review'],
    rules: ['Technicians see assigned jobs only', 'Critical jobs require live status updates', 'Parts requests notify inventory owner'],
    policies: ['Field actions are timestamped', 'Offline updates sync to the organisation record', 'Evidence is required for selected job types'],
  },
  'project-command': {
    workflows: ['Create project board', 'Assign milestone owners', 'Approve variation', 'Publish delivery report'],
    rules: ['Delayed milestones escalate weekly', 'Budget-impacting changes require approval', 'Property-facing reports require management review'],
    policies: ['Project files follow organisation permissions', 'Variation history is retained', 'External partner access is scoped by project'],
  },
  'green-track': {
    workflows: ['Capture sustainability metric', 'Review ESG exception', 'Assign improvement action', 'Publish impact report'],
    rules: ['Energy anomalies create review tasks', 'ESG actions require owner and due date', 'Monthly trend gaps are flagged'],
    policies: ['ESG reports are management controlled', 'Utility data is property scoped', 'Benchmarks are anonymised where required'],
  },
  'inspect-pro': {
    workflows: ['Create inspection plan', 'Run checklist', 'Log finding', 'Close corrective action'],
    rules: ['Critical findings create incidents', 'Failed audits require action owner', 'Overdue actions escalate to management'],
    policies: ['Audit evidence is immutable after closure', 'Inspection templates are versioned', 'Compliance exports require authorised roles'],
  },
};

const accessRows = [
  {
    label: 'Two-factor authentication',
    text: 'Require a second verification step for administrator access.',
    enabled: true,
  },
  {
    label: 'Executive digest emails',
    text: 'Send a weekly portfolio summary to management users.',
    enabled: true,
  },
  {
    label: 'AI recommendations require approval',
    text: 'Route AI dispatch actions through a human approver.',
    enabled: true,
  },
  {
    label: 'Property portal self-registration',
    text: 'Allow property users to request access from the login page.',
    enabled: false,
  },
];

const userTypes = ['In-house', 'Contractor', 'Partner', 'Management', 'Superadmin'];

function initials(name: string) {
  return name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();
}

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] ${className}`}>
      {children}
    </section>
  );
}

function StatTile({ label, value, icon: Icon, tone }: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number }>;
  tone: string;
}) {
  return (
    <Panel className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">{label}</span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}>
          <Icon size={15} />
        </span>
      </div>
      <div className="text-[24px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
        {value}
      </div>
    </Panel>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="h-9 w-full rounded-lg border border-[rgba(46,127,255,0.22)] bg-[#0A1628] px-3 text-[12px] text-[#EEF3FA] outline-none transition-colors placeholder:text-[#4A6080] focus:border-[#2E7FFF]"
    />
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">{label}</span>
      {children}
    </label>
  );
}

function moduleTeam(module: ModuleToggle, profiles: MockMemberProfile[]) {
  const query = `${module.owner} ${module.name}`.toLowerCase();
  const matched = profiles.filter(profile => {
    const haystack = `${profile.name} ${profile.role} ${profile.perspective} ${profile.skills} ${profile.responsibilities}`.toLowerCase();
    if (query.includes('contractor') || query.includes('facility')) return /contractor|engineer|technician|fm engineer/i.test(haystack);
    if (query.includes('partner') || query.includes('snapfix') || query.includes('green')) return /operational|engineer|supervisor|field/i.test(haystack);
    if (query.includes('management') || query.includes('vendor') || query.includes('project')) return /manager|management|executive|strategic|supervisor/i.test(haystack);
    if (query.includes('operations') || query.includes('service') || query.includes('field')) return /operational|strategic|engineer|supervisor|manager/i.test(haystack);
    return true;
  });
  return (matched.length ? matched : profiles).slice(0, 5);
}

function moduleClients(module: ModuleToggle, clients: PortfolioClient[]) {
  if (module.id === 'project-command' || module.id === 'inspect-pro') return clients.filter(client => client.sla < 90).slice(0, 4);
  if (module.id === 'vendor-iq') return clients.filter(client => client.riskLevel !== 'low').slice(0, 4);
  if (module.id === 'facility-core' || module.id === 'field-ops') return clients.filter(client => client.overdueTasks > 0 || client.riskLevel !== 'low').slice(0, 4);
  return clients.slice(0, 4);
}

function ModuleIconMark({ module, size = 'large' }: { module: ModuleToggle; size?: 'large' | 'small' }) {
  const Icon = module.icon;
  const large = size === 'large';
  return (
    <div className={`relative flex shrink-0 items-center justify-center ${large ? 'h-28 w-28' : 'h-16 w-16'}`}>
      <span
        aria-hidden="true"
        className={`absolute font-black leading-none text-[#e11d2e] drop-shadow-[0_0_18px_rgba(225,29,46,0.22)] ${large ? 'text-[8.8rem]' : 'text-[5rem]'}`}
        style={{ fontFamily: 'Arial Black, Space Grotesk, sans-serif' }}
      >
        C
      </span>
      <div className={`relative z-10 flex items-center justify-center rounded-2xl bg-[#061225]/45 text-white shadow-[0_16px_34px_rgba(0,0,0,0.3)] ${large ? 'h-[4.6rem] w-[4.6rem]' : 'h-10 w-10'}`}>
        <Icon size={large ? 48 : 27} strokeWidth={2.6} className="drop-shadow-[0_2px_10px_rgba(255,255,255,0.16)]" />
      </div>
    </div>
  );
}

function ModuleDetailModal({
  module,
  profiles,
  clients,
  onClose,
  onToggle,
}: {
  module: ModuleToggle;
  profiles: MockMemberProfile[];
  clients: PortfolioClient[];
  onClose: () => void;
  onToggle: () => void;
}) {
  const details = moduleDetails[module.id];
  const team = moduleTeam(module, profiles);
  const scopedClients = moduleClients(module, clients);

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} aria-label="Close module details" />
      <div className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[rgba(46,127,255,0.28)] bg-[#0A1628] shadow-2xl">
        <div className="flex flex-shrink-0 items-start justify-between gap-4 border-b border-[rgba(46,127,255,0.14)] bg-[linear-gradient(135deg,rgba(46,127,255,0.15),rgba(0,198,255,0.04))] px-5 py-4">
          <div className="flex gap-4">
            <ModuleIconMark module={module} size="small" />
            <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${module.active ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : 'border-slate-500/30 bg-slate-500/10 text-slate-300'}`}>
                {module.active ? 'Enabled' : 'Disabled'}
              </span>
              <span className="rounded-full border border-[rgba(46,127,255,0.22)] bg-white/5 px-2.5 py-1 text-[10px] font-bold text-[#B8C7DB]">{module.owner}</span>
            </div>
            <h3 className="text-lg font-bold text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{module.name}</h3>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A94B4]">{module.tagline}</p>
            <p className="mt-1 max-w-2xl text-[12px] leading-5 text-[#7A94B4]">{module.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggle}
              className={`rounded-lg border px-3 py-2 text-[11px] font-bold transition-colors ${
                module.active
                  ? 'border-emerald-400/35 bg-emerald-400/10 text-emerald-300'
                  : 'border-slate-500/30 bg-slate-500/10 text-slate-300'
              }`}
            >
              {module.active ? 'Disable module' : 'Enable module'}
            </button>
            <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-[#7A94B4] transition-colors hover:bg-white/5 hover:text-[#EEF3FA]" aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
          <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <Panel className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <Users size={15} className="text-[#2E7FFF]" />
                <h4 className="text-[13px] font-bold text-[#EEF3FA]">Assigned team</h4>
              </div>
              <div className="space-y-2">
                {team.map(member => (
                  <div key={member.id} className="flex items-center justify-between gap-3 rounded-xl border border-[rgba(46,127,255,0.1)] bg-[#07111F] px-3 py-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2E7FFF]/15 text-[10px] font-bold text-blue-200">{initials(member.name)}</div>
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-bold text-[#EEF3FA]">{member.name}</p>
                        <p className="truncate text-[10px] text-[#7A94B4]">{member.role}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-white/5 px-2 py-1 text-[10px] font-semibold text-[#B8C7DB]">{member.perspective}</span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <Building2 size={15} className="text-[#2E7FFF]" />
                <h4 className="text-[13px] font-bold text-[#EEF3FA]">Property scope</h4>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {scopedClients.map(client => (
                  <div key={client.id} className="rounded-xl border border-[rgba(46,127,255,0.1)] bg-[#07111F] p-3">
                    <p className="truncate text-[12px] font-bold text-[#EEF3FA]">{client.name}</p>
                    <p className="mt-1 text-[10px] text-[#7A94B4]">{client.region} · {client.sites} sites</p>
                    <div className="mt-2 flex items-center justify-between text-[10px]">
                      <span className="text-[#B8C7DB]">SLA {client.sla}%</span>
                      <span className={`font-bold ${client.riskLevel === 'low' ? 'text-emerald-300' : client.riskLevel === 'medium' ? 'text-amber-300' : 'text-red-300'}`}>{client.riskLevel}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-3">
            {[
              { title: 'Workflows', icon: ClipboardList, items: details.workflows },
              { title: 'Rules', icon: SlidersHorizontal, items: details.rules },
              { title: 'Policies', icon: FileText, items: details.policies },
            ].map(section => {
              const Icon = section.icon;
              return (
                <Panel key={section.title} className="p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Icon size={15} className="text-[#2E7FFF]" />
                    <h4 className="text-[13px] font-bold text-[#EEF3FA]">{section.title}</h4>
                  </div>
                  <div className="space-y-2">
                    {section.items.map(item => (
                      <div key={item} className="flex gap-2 rounded-lg bg-[#07111F] px-3 py-2 text-[11px] leading-5 text-[#B8C7DB]">
                        <Check size={13} className="mt-0.5 shrink-0 text-emerald-300" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </Panel>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProfileSettings({ onToast }: Props) {
  const { profiles, updateProfile } = useMemberProfiles();
  const { clients } = useClients();
  const [activeSection, setActiveSection] = useState<ProfileSection>('overview');
  const [modules, setModules] = useState<ModuleToggle[]>(moduleDefaults);
  const [teamQuery, setTeamQuery] = useState('');
  const [clientQuery, setClientQuery] = useState('');
  const [orgName, setOrgName] = useState('DevelopmentX');
  const [orgDomain, setOrgDomain] = useState('developmentx.ae');
  const [region, setRegion] = useState('UAE and GCC');
  const [accessState, setAccessState] = useState<Record<string, boolean>>(
    Object.fromEntries(accessRows.map(row => [row.label, row.enabled]))
  );
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  const activeMembers = profiles.filter(profile => profile.isActive !== false);
  const activeModules = modules.filter(module => module.active);
  const filteredTeam = profiles.filter(profile =>
    `${profile.name} ${profile.email} ${profile.role} ${profile.perspective}`.toLowerCase().includes(teamQuery.toLowerCase())
  );
  const filteredClients = clients.filter(client =>
    `${client.name} ${client.region} ${client.sector}`.toLowerCase().includes(clientQuery.toLowerCase())
  );

  const riskSummary = useMemo(() => ({
    watch: clients.filter(client => client.riskLevel === 'critical' || client.riskLevel === 'high' || client.riskLevel === 'medium').length,
    live: clients.filter(client => client.status === 'live').length,
  }), [clients]);

  const toggleModule = (id: string) => {
    setModules(current => current.map(module => module.id === id ? { ...module, active: !module.active } : module));
    const module = modules.find(item => item.id === id);
    if (module) onToast(`${module.name} ${module.active ? 'disabled' : 'enabled'}`, 'info');
  };

  const toggleAccess = (label: string) => {
    setAccessState(current => ({ ...current, [label]: !current[label] }));
    onToast(`${label} updated`, 'success');
  };

  const renderOverview = () => (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Team members" value={profiles.length} icon={Users} tone="bg-blue-500/12 text-blue-300" />
        <StatTile label="Active modules" value={`${activeModules.length}/${modules.length}`} icon={LayoutGrid} tone="bg-emerald-500/12 text-emerald-300" />
        <StatTile label="Properties" value={clients.length} icon={Building2} tone="bg-cyan-500/12 text-cyan-300" />
        <StatTile label="Risk watch" value={riskSummary.watch} icon={ShieldCheck} tone="bg-red-500/12 text-red-300" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel className="p-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2E7FFF] to-[#00C6FF] text-2xl font-bold text-white shadow-lg shadow-blue-500/20">
              {CURRENT_USER.initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300">Active</span>
                <span className="rounded-full border border-red-400/25 bg-red-400/10 px-2.5 py-1 text-[10px] font-bold text-red-300">Superadmin ready</span>
              </div>
              <h3 className="text-2xl font-bold text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{CURRENT_USER.name}</h3>
              <p className="mt-2 flex items-center gap-2 text-[12px] text-[#7A94B4]"><Mail size={14} /> {CURRENT_USER.email}</p>
              <p className="mt-1 text-[12px] text-[#B8C7DB]">{CURRENT_USER.role} · Management access</p>
            </div>
          </div>
        </Panel>

        <Panel className="p-5">
          <h4 className="text-[13px] font-bold text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Organisation health</h4>
          <div className="mt-4 space-y-3">
            {[
              { label: 'Live properties', value: riskSummary.live, total: clients.length || 1 },
              { label: 'Active users', value: activeMembers.length, total: profiles.length || 1 },
              { label: 'Enabled modules', value: activeModules.length, total: modules.length },
            ].map(row => (
              <div key={row.label}>
                <div className="mb-1.5 flex items-center justify-between text-[11px]">
                  <span className="text-[#B8C7DB]">{row.label}</span>
                  <span className="font-bold text-[#EEF3FA]">{row.value}/{row.total}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#0A1628]">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#2E7FFF] to-[#00C6FF]" style={{ width: `${Math.round((row.value / row.total) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );

  const renderTeam = () => (
    <Panel className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-[rgba(46,127,255,0.12)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-[13px] font-bold text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Team control</h4>
          <p className="mt-1 text-[11px] text-[#7A94B4]">Review users, roles, perspectives, property assignment, and active status.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A94B4]" />
          <input
            value={teamQuery}
            onChange={event => setTeamQuery(event.target.value)}
            placeholder="Search team"
            className="h-9 w-full rounded-lg border border-[rgba(46,127,255,0.2)] bg-[#0A1628] pl-9 pr-3 text-[12px] text-[#EEF3FA] outline-none placeholder:text-[#4A6080] focus:border-[#2E7FFF]"
          />
        </div>
      </div>
      <div className="divide-y divide-[rgba(46,127,255,0.08)]">
        {filteredTeam.slice(0, 12).map(profile => {
          const active = profile.isActive !== false;
          return (
            <div key={profile.id} className="grid gap-3 p-4 lg:grid-cols-[1.4fr_1fr_0.9fr_auto] lg:items-center">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2E7FFF]/15 text-[12px] font-bold text-blue-200">
                  {initials(profile.name)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-bold text-[#EEF3FA]">{profile.name}</p>
                  <p className="truncate text-[10px] text-[#7A94B4]">{profile.email}</p>
                </div>
              </div>
              <div>
                <p className="text-[12px] font-semibold text-[#B8C7DB]">{profile.role}</p>
                <p className="text-[10px] text-[#7A94B4]">{profile.perspective} perspective</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(profile.assignedClients.length ? profile.assignedClients : ['Portfolio']).slice(0, 2).map(client => (
                  <span key={client} className="rounded-full bg-white/5 px-2 py-1 text-[10px] font-semibold text-[#B8C7DB]">{client}</span>
                ))}
              </div>
              <button
                onClick={() => updateProfile(profile.id, { isActive: !active })}
                className={`flex w-28 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[10px] font-bold transition-colors ${
                  active
                    ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                    : 'border-slate-500/30 bg-slate-500/10 text-slate-300'
                }`}
              >
                {active ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                {active ? 'Active' : 'Inactive'}
              </button>
            </div>
          );
        })}
      </div>
    </Panel>
  );

  const renderModules = () => (
    <div className="overflow-hidden rounded-2xl border border-[rgba(46,127,255,0.18)] bg-[radial-gradient(circle_at_50%_0%,rgba(46,127,255,0.14),transparent_34%),linear-gradient(145deg,#07111F,#0A1628)]">
      <div className="flex flex-col gap-3 border-b border-[rgba(46,127,255,0.16)] px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h4 className="text-[18px] font-black uppercase text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            4C360 Module Icons
          </h4>
          <p className="mt-1 text-[13px] text-[#B8C7DB]">Consistent. Modern. Purpose-driven.</p>
        </div>
        <p className="max-w-sm text-[11px] leading-5 text-[#7A94B4]">
          Click a module to manage team members, workflows, rules, policies, and property scope.
        </p>
      </div>

      <div className="grid md:grid-cols-3">
        {modules.map((module, index) => (
          <div
            key={module.id}
            className={`relative min-h-[250px] border-[rgba(126,148,180,0.22)] ${
              index % 3 !== 2 ? 'md:border-r' : ''
            } ${index < 6 ? 'md:border-b' : ''}`}
          >
            <button
              type="button"
              onClick={() => setSelectedModuleId(module.id)}
              className={`group flex h-full w-full flex-col items-center justify-center px-5 py-8 text-center transition-all duration-200 hover:bg-white/[0.035] ${
                module.active ? 'bg-transparent' : 'opacity-62'
              }`}
            >
              <ModuleIconMark module={module} />
              <h4 className="mt-4 text-[22px] font-black text-white transition-colors group-hover:text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {module.name}
              </h4>
              <p className="mt-1 text-[12px] font-bold uppercase tracking-[0.12em] text-[#93A4BA]">
                {module.tagline}
              </p>
              <div className="mt-4 flex items-center gap-2">
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                  module.active
                    ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                    : 'border-slate-500/30 bg-slate-500/10 text-slate-300'
                }`}>
                  {module.active ? 'Active' : 'Inactive'}
                </span>
                <span className="rounded-full border border-[rgba(46,127,255,0.2)] bg-[#07111F] px-2.5 py-1 text-[10px] font-bold text-[#7A94B4]">
                  {module.owner}
                </span>
              </div>
            </button>

            <button
              onClick={event => {
                event.stopPropagation();
                toggleModule(module.id);
              }}
              className={`absolute right-3 top-3 rounded-lg border px-2.5 py-1.5 text-[10px] font-bold transition-colors ${
                module.active
                  ? 'border-emerald-400/35 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/15'
                  : 'border-slate-500/30 bg-slate-500/10 text-slate-300 hover:bg-slate-500/15'
              }`}
            >
              {module.active ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        ))}
      </div>

    </div>
  );

  const renderClients = () => (
    <Panel className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-[rgba(46,127,255,0.12)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-[13px] font-bold text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Property access</h4>
          <p className="mt-1 text-[11px] text-[#7A94B4]">Control which properties are visible to this organisation profile.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A94B4]" />
          <input
            value={clientQuery}
            onChange={event => setClientQuery(event.target.value)}
            placeholder="Search properties"
            className="h-9 w-full rounded-lg border border-[rgba(46,127,255,0.2)] bg-[#0A1628] pl-9 pr-3 text-[12px] text-[#EEF3FA] outline-none placeholder:text-[#4A6080] focus:border-[#2E7FFF]"
          />
        </div>
      </div>
      <div className="grid gap-3 p-4 lg:grid-cols-2">
        {filteredClients.map(client => (
          <div key={client.id} className="rounded-xl border border-[rgba(46,127,255,0.12)] bg-[#0A1628]/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h4 className="truncate text-[13px] font-bold text-[#EEF3FA]">{client.name}</h4>
                <p className="mt-1 flex items-center gap-1.5 text-[10px] text-[#7A94B4]"><MapPin size={12} /> {client.region} · {client.sector}</p>
              </div>
              <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                client.riskLevel === 'critical' || client.riskLevel === 'high'
                  ? 'bg-red-400/10 text-red-300'
                  : client.riskLevel === 'medium'
                  ? 'bg-amber-400/10 text-amber-300'
                  : 'bg-emerald-400/10 text-emerald-300'
              }`}>
                {client.riskLevel}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div><p className="text-lg font-bold text-[#EEF3FA]">{client.sites}</p><p className="text-[10px] text-[#7A94B4]">Sites</p></div>
              <div><p className="text-lg font-bold text-[#EEF3FA]">{client.workOrders}</p><p className="text-[10px] text-[#7A94B4]">Work orders</p></div>
              <div><p className="text-lg font-bold text-[#EEF3FA]">{client.sla}%</p><p className="text-[10px] text-[#7A94B4]">SLA</p></div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );

  const renderOrganisation = () => (
    <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
      <Panel className="p-5">
        <h4 className="text-[13px] font-bold text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Organisation profile</h4>
        <p className="mt-1 text-[11px] text-[#7A94B4]">Local profile controls until organisation APIs are connected.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Organisation name"><TextInput value={orgName} onChange={event => setOrgName(event.target.value)} /></Field>
          <Field label="Primary domain"><TextInput value={orgDomain} onChange={event => setOrgDomain(event.target.value)} /></Field>
          <Field label="Operating region"><TextInput value={region} onChange={event => setRegion(event.target.value)} /></Field>
          <Field label="Default user type"><TextInput value="Management" readOnly /></Field>
        </div>
      </Panel>
      <Panel className="p-5">
        <h4 className="text-[13px] font-bold text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Organisation-based access</h4>
        <p className="mt-1 text-[11px] text-[#7A94B4]">All members belong to an organisation. Roles are assigned by the organisation administrator.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {userTypes.map(type => (
            <div key={type} className="flex items-center justify-between rounded-xl border border-[rgba(46,127,255,0.12)] bg-[#0A1628]/70 px-3 py-3">
              <span className="text-[12px] font-semibold text-[#EEF3FA]">{type}</span>
              <Check size={15} className="text-emerald-300" />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );

  const renderAccess = () => (
    <div className="space-y-3">
      {accessRows.map(row => {
        const enabled = accessState[row.label];
        return (
          <Panel key={row.label} className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="text-[13px] font-bold text-[#EEF3FA]">{row.label}</h4>
                <p className="mt-1 text-[11px] text-[#7A94B4]">{row.text}</p>
              </div>
              <button
                onClick={() => toggleAccess(row.label)}
                className={`flex w-24 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[10px] font-bold transition-colors ${
                  enabled
                    ? 'border-emerald-400/35 bg-emerald-400/10 text-emerald-300'
                    : 'border-slate-500/30 bg-slate-500/10 text-slate-300'
                }`}
              >
                {enabled ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                {enabled ? 'On' : 'Off'}
              </button>
            </div>
          </Panel>
        );
      })}
    </div>
  );

  const renderSection = () => {
    if (activeSection === 'overview') return renderOverview();
    if (activeSection === 'team') return renderTeam();
    if (activeSection === 'modules') return renderModules();
    if (activeSection === 'clients') return renderClients();
    if (activeSection === 'organisation') return renderOrganisation();
    return renderAccess();
  };

  const selectedModule = modules.find(module => module.id === selectedModuleId) ?? null;

  return (
    <div className="flex h-full overflow-hidden">
      <aside className="hidden w-64 flex-shrink-0 border-r border-[rgba(46,127,255,0.12)] bg-[#07111F] p-4 lg:block">
        <div className="mb-4 rounded-2xl border border-[rgba(46,127,255,0.12)] bg-[rgba(17,32,64,0.7)] p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2E7FFF] to-[#00C6FF] text-[12px] font-bold text-white">
              {CURRENT_USER.initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-bold text-[#EEF3FA]">{CURRENT_USER.name}</p>
              <p className="truncate text-[10px] text-[#7A94B4]">{CURRENT_USER.role}</p>
            </div>
          </div>
        </div>
        <nav className="space-y-1">
          {sections.map(section => {
            const Icon = section.icon;
            const active = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[12px] font-bold transition-colors ${
                  active ? 'bg-[#2E7FFF] text-white shadow-lg shadow-blue-500/20' : 'text-[#7A94B4] hover:bg-white/5 hover:text-[#EEF3FA]'
                }`}
              >
                <Icon size={15} />
                {section.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex-shrink-0 border-b border-[rgba(46,127,255,0.12)] px-5 py-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#2E7FFF]">
                <UserRound size={13} />
                Profile and organisation control
              </div>
              <h3 className="text-[#EEF3FA] font-bold text-sm" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>DevelopmentX profile</h3>
              <p className="mt-1 text-[11px] text-[#7A94B4]">Control team, modules, properties, organisation identity, and access policies inside Settings.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full border border-[rgba(46,127,255,0.18)] bg-white/5 px-3 py-1.5 text-[10px] font-bold text-[#B8C7DB]">
                <LockKeyhole size={13} /> Organisation admin
              </span>
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-bold text-emerald-300">
                <Database size={13} /> Local controls
              </span>
              <span className="flex items-center gap-1.5 rounded-full border border-blue-400/25 bg-blue-400/10 px-3 py-1.5 text-[10px] font-bold text-blue-300">
                <Bell size={13} /> Notifications ready
              </span>
            </div>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {sections.map(section => {
              const Icon = section.icon;
              const active = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex flex-shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-bold transition-colors ${
                    active ? 'border-[#2E7FFF] bg-[#2E7FFF] text-white' : 'border-[rgba(46,127,255,0.18)] text-[#7A94B4]'
                  }`}
                >
                  <Icon size={13} />
                  {section.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-5">
          {renderSection()}
        </div>
      </div>
      {selectedModule && (
        <ModuleDetailModal
          module={selectedModule}
          profiles={profiles}
          clients={clients}
          onClose={() => setSelectedModuleId(null)}
          onToggle={() => toggleModule(selectedModule.id)}
        />
      )}
    </div>
  );
}
