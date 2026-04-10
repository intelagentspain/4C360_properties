import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Bot, Hand, SlidersHorizontal, ShieldAlert, Clock,
  AlertTriangle, Users, FlaskConical, ChevronRight, Plus,
  Trash2, ToggleLeft, ToggleRight, CheckCircle, X, Play,
  Settings2, Pencil, Save,
} from 'lucide-react';
import { type ToastFn } from '@/lib/ui';
import {
  type DispatchSettings,
  type DispatchMode,
} from '@/data/dispatchSettings';

interface Props {
  onToast: ToastFn;
  settings: DispatchSettings;
  setSettings: (s: DispatchSettings) => void;
}

/* ─────────────────────────────────────────────────────────────────── helpers */

const MODE_CFG = {
  manual: { label: 'Manual',  icon: <Hand size={14} />, color: 'text-[#7A94B4]', border: 'border-[#7A94B4]/40', bg: 'bg-[#7A94B4]/10', desc: 'Every dispatch requires human approval before any assignment is made.' },
  hybrid: { label: 'Hybrid',  icon: <Zap  size={14} />, color: 'text-amber-400', border: 'border-amber-400/40', bg: 'bg-amber-400/10', desc: 'AI recommends the best tech and action; supervisor confirms before execution.' },
  ai:     { label: 'AI Auto', icon: <Bot  size={14} />, color: 'text-emerald-400', border: 'border-emerald-400/40', bg: 'bg-emerald-400/10', desc: 'AI dispatches autonomously within defined rules. No human step required.' },
};

const MODE_BADGE: Record<DispatchMode, string> = {
  manual: 'text-[#7A94B4] bg-[#7A94B4]/10 border-[#7A94B4]/30',
  hybrid: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  ai:     'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
};

const CATEGORIES   = ['HVAC', 'Plumbing', 'Electrical', 'General', 'Fire Safety', 'Lift / Elevator', 'Cleaning', 'Safety'];
const SEVERITIES   = ['low', 'medium', 'high', 'critical'];
const SITES_LIST   = ['All Sites', 'Silicon Oasis', 'Gate Avenue', 'Business Bay', 'DIFC Tower'];
const TIME_OPTS    = ['Any', 'Business hours', 'Off-hours', 'Early morning'];
const ASSET_TYPES  = ['Any', 'Chiller / AHU', 'Lift', 'Generator', 'Pool Pump', 'Fire Panel', 'Gate / Intercom'];
const SLA_THRESH   = ['< 15 min', '< 30 min', '< 45 min', '< 60 min', '< 90 min', '< 120 min', '< 240 min'];
const CLIENT_TYPES = ['Any', 'Residential', 'Commercial', 'Industrial', 'Government'];
const TARGETS      = ['Nearest available tech', 'Nearest HVAC-certified tech', 'Available plumber — in-house preferred', 'On-call electrician', 'Approved vendor only', 'Highest-rated tech'];
const NOTIFY_ROLES = ['Supervisor', 'Regional Manager', 'Engineering Lead', 'Operations Manager', 'On-Call Supervisor', 'Safety Officer'];
const SLA_PRIOS    = ['Override all — nearest available', 'Highest skill + nearest', 'Best skill match', 'Balanced — skill + proximity', 'Nearest available', 'Scheduled shift preferred'];
const TECH_PROFS   = ['Any certified tech', 'Specialist required', 'Certified or experienced', 'Any available', 'Scheduled shift preferred'];
const SKILL_OPTS   = ['Any', 'HVAC', 'Plumbing', 'Electrical', 'General', 'Safety'];
const REGION_OPTS  = ['All Regions', 'Dubai', 'Silicon Oasis', 'Abu Dhabi', 'Dubai, Abu Dhabi'];
const SITE_FILT    = ['All Sites', 'Silicon Oasis', 'Gate Avenue', 'Business Bay', 'DIFC Tower'];
const ASSET_FILT   = ['Any', 'Chiller / AHU', 'Lift', 'Generator', 'Pool Pump', 'Fire Panel', 'Gate / Intercom'];
const SERVICE_OPTS = ['Any', 'Chiller Service', 'AHU Maintenance', 'Refrigeration', 'HV Systems', 'Generator Service', 'Fire Detection', 'Cleaning', 'Minor Repairs', 'PPM Tasks', 'Corrective Maintenance', 'General FM'];
const PREF_OPTS    = ['preferred', 'approved', 'restricted'] as const;

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-5">
      <h3 className="text-[#EEF3FA] font-bold text-sm mb-0.5" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{title}</h3>
      <p className="text-[11px] text-[#7A94B4]">{subtitle}</p>
    </div>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="flex-shrink-0">
      {on ? <ToggleRight size={20} className="text-[#2E7FFF]" /> : <ToggleLeft size={20} className="text-[#7A94B4] opacity-50" />}
    </button>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[rgba(17,32,64,0.85)] border border-[rgba(46,127,255,0.2)] rounded-xl p-4 ${className}`}>
      {children}
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1">{label}</div>
      {children}
    </div>
  );
}

function Sel({ value, opts, onChange }: { value: string; opts: string[]; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full text-[11px] bg-[#0A1628] border border-[rgba(46,127,255,0.2)] rounded-lg px-2 py-1.5 text-[#EEF3FA] outline-none cursor-pointer"
    >
      {opts.map(o => <option key={o} value={o} className="bg-[#0A1628]">{o}</option>)}
    </select>
  );
}

/* ─────────────────────────────────────── 1 · Dispatch Modes ─────────────── */

function SectionDispatchModes({ settings, setSettings, onToast }: Props) {
  const setMode = (m: DispatchMode) => {
    setSettings({ ...settings, globalMode: m });
    onToast(`Global dispatch mode set to ${MODE_CFG[m].label}`, 'success');
  };
  const removeOverride = (i: number) =>
    setSettings({ ...settings, modeOverrides: settings.modeOverrides.filter((_, idx) => idx !== i) });
  const addOverride = () =>
    setSettings({ ...settings, modeOverrides: [...settings.modeOverrides, { condition: 'New condition — edit me', mode: 'hybrid' as DispatchMode }] });
  const updateOverride = (i: number, field: 'condition' | 'mode', val: string) => {
    const updated = [...settings.modeOverrides];
    updated[i] = { ...updated[i], [field]: val };
    setSettings({ ...settings, modeOverrides: updated });
  };

  return (
    <div className="space-y-5">
      <SectionTitle title="Dispatch Modes" subtitle="Set the global default dispatch mode and define condition-based overrides" />

      <Card>
        <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-3">Global Default Mode</div>
        <div className="grid grid-cols-3 gap-3">
          {(Object.entries(MODE_CFG) as [DispatchMode, typeof MODE_CFG.manual][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`flex flex-col gap-2 p-3 rounded-xl border transition-all text-left ${
                settings.globalMode === key
                  ? `${cfg.border} ${cfg.bg} ring-1 ring-current/30`
                  : 'border-[rgba(46,127,255,0.15)] hover:border-[rgba(46,127,255,0.3)] hover:bg-white/[0.02]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={settings.globalMode === key ? cfg.color : 'text-[#7A94B4]'}>{cfg.icon}</span>
                <span className={`text-[12px] font-bold ${settings.globalMode === key ? cfg.color : 'text-[#7A94B4]'}`}>{cfg.label}</span>
                {settings.globalMode === key && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />}
              </div>
              <p className="text-[10px] text-[#7A94B4] leading-snug">{cfg.desc}</p>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide">Condition-Based Mode Overrides</div>
          <button onClick={addOverride} className="flex items-center gap-1 text-[10px] text-[#2E7FFF] hover:text-blue-300 transition-colors">
            <Plus size={11} /> Add Rule
          </button>
        </div>
        <div className="space-y-2">
          {settings.modeOverrides.map((ov, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 bg-[#0A1628] rounded-lg group">
              <select
                value={ov.mode}
                onChange={e => updateOverride(i, 'mode', e.target.value)}
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded border bg-transparent outline-none cursor-pointer ${MODE_BADGE[ov.mode]}`}
              >
                <option value="manual">Manual</option>
                <option value="hybrid">Hybrid</option>
                <option value="ai">AI Auto</option>
              </select>
              <input
                value={ov.condition}
                onChange={e => updateOverride(i, 'condition', e.target.value)}
                className="flex-1 text-[11px] text-[#EEF3FA] bg-transparent outline-none border-b border-transparent focus:border-[rgba(46,127,255,0.3)] transition-colors"
              />
              <button onClick={() => removeOverride(i)} className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300">
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────── 2 · AI Top Match Logic ─────────── */

function SectionMatchLogic({ settings, setSettings, onToast }: Props) {
  const weights = settings.matchWeights;
  const totalEnabled = Object.values(weights).filter(w => w.enabled).reduce((s, w) => s + w.weight, 0);

  const setWeight = (key: string, val: number) =>
    setSettings({ ...settings, matchWeights: { ...weights, [key]: { ...weights[key], weight: val } } });

  const toggleWeight = (key: string) => {
    const cur = weights[key];
    setSettings({ ...settings, matchWeights: { ...weights, [key]: { ...cur, enabled: !cur.enabled, weight: !cur.enabled ? 10 : cur.weight } } });
    onToast(`${cur.label} ${cur.enabled ? 'disabled' : 'enabled'}`, 'info');
  };

  return (
    <div className="space-y-5">
      <SectionTitle title="AI Top Match Logic" subtitle="Configure the weighted scoring formula used to rank technicians for dispatch" />

      <Card>
        <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-3">Match Parameters</div>
        <div className="space-y-3">
          {Object.entries(weights).map(([key, w]) => (
            <div key={key} className={`space-y-1.5 pb-3 border-b border-[rgba(46,127,255,0.08)] last:border-0 last:pb-0 ${!w.enabled ? 'opacity-45' : ''}`}>
              <div className="flex items-center gap-2">
                <Toggle on={w.enabled} onToggle={() => toggleWeight(key)} />
                <span className="flex-1 text-[12px] text-[#EEF3FA] font-medium">{w.label}</span>
                <span className="text-[11px] font-bold text-[#2E7FFF] w-8 text-right">{w.enabled ? `${w.weight}%` : '—'}</span>
              </div>
              <p className="text-[10px] text-[#7A94B4] pl-6">{w.desc}</p>
              {w.enabled && (
                <div className="pl-6">
                  <input type="range" min={0} max={60} value={w.weight} onChange={e => setWeight(key, Number(e.target.value))} className="w-full h-1 accent-[#2E7FFF] cursor-pointer" />
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-3">
          Live Formula Preview
          {totalEnabled !== 100 && (
            <span className="ml-2 text-amber-400 normal-case font-normal">(weights sum to {totalEnabled}% — normalised below)</span>
          )}
        </div>
        <div className="space-y-1.5">
          {Object.entries(weights)
            .filter(([, w]) => w.enabled && w.weight > 0)
            .sort((a, b) => b[1].weight - a[1].weight)
            .map(([key, w]) => {
              const pct = totalEnabled > 0 ? Math.round((w.weight / totalEnabled) * 100) : 0;
              return (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-[10px] text-[#7A94B4] w-40 flex-shrink-0">{w.label}</span>
                  <div className="flex-1 h-2 bg-[#0A1628] rounded-full overflow-hidden">
                    <motion.div key={pct} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }} className="h-full rounded-full bg-[#2E7FFF]" />
                  </div>
                  <span className="text-[10px] font-bold text-[#2E7FFF] w-7 text-right">{pct}%</span>
                </div>
              );
            })}
        </div>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────── 3 · Auto-Assignment Rules ──────────── */

function SectionAutoRules({ settings, setSettings, onToast }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const update = (id: string, field: string, val: string | boolean) =>
    setSettings({ ...settings, autoAssignRules: settings.autoAssignRules.map(r => r.id === id ? { ...r, [field]: val } : r) });

  const removeRule = (id: string) => {
    setSettings({ ...settings, autoAssignRules: settings.autoAssignRules.filter(r => r.id !== id) });
    onToast('Auto-assignment rule removed', 'info');
  };

  const addRule = () => {
    const newRule = {
      id: `AR-${String(settings.autoAssignRules.length + 1).padStart(3, '0')}`,
      category: 'HVAC', severity: 'medium', site: 'All Sites', timeOfDay: 'Any',
      assetType: 'Any', clientType: 'Any', slaThreshold: '< 60 min',
      target: 'Nearest available tech', requireConfirmation: true,
    };
    setSettings({ ...settings, autoAssignRules: [...settings.autoAssignRules, newRule] });
    setEditingId(newRule.id);
    onToast('New rule added', 'success');
  };

  return (
    <div className="space-y-5">
      <SectionTitle title="Auto-Assignment Rules" subtitle="Define conditions that trigger automatic technician assignment" />
      <div className="flex justify-end">
        <button onClick={addRule} className="flex items-center gap-1.5 text-[11px] bg-[#2E7FFF] text-white px-3 py-1.5 rounded-lg hover:bg-blue-500 transition-colors">
          <Plus size={12} /> Add Rule
        </button>
      </div>

      <div className="space-y-3">
        {settings.autoAssignRules.map(rule => {
          const isEditing = editingId === rule.id;
          return (
            <Card key={rule.id}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#7A94B4] font-mono bg-[#0A1628] px-1.5 py-0.5 rounded">{rule.id}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                    rule.severity === 'critical' ? 'text-red-400 bg-red-500/10 border-red-500/30'
                    : rule.severity === 'high' ? 'text-orange-400 bg-orange-500/10 border-orange-500/30'
                    : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                  }`}>{rule.severity}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditingId(isEditing ? null : rule.id)} className="text-[#7A94B4] hover:text-[#2E7FFF] transition-colors">
                    {isEditing ? <Save size={13} /> : <Pencil size={13} />}
                  </button>
                  <button onClick={() => removeRule(rule.id)} className="text-[#7A94B4] hover:text-red-400 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {isEditing ? (
                <div className="grid grid-cols-2 gap-3">
                  <FieldRow label="Category"><Sel value={rule.category} opts={CATEGORIES} onChange={v => update(rule.id, 'category', v)} /></FieldRow>
                  <FieldRow label="Severity"><Sel value={rule.severity} opts={SEVERITIES} onChange={v => update(rule.id, 'severity', v)} /></FieldRow>
                  <FieldRow label="Site"><Sel value={rule.site} opts={SITES_LIST} onChange={v => update(rule.id, 'site', v)} /></FieldRow>
                  <FieldRow label="Time of Day"><Sel value={rule.timeOfDay} opts={TIME_OPTS} onChange={v => update(rule.id, 'timeOfDay', v)} /></FieldRow>
                  <FieldRow label="Asset Type"><Sel value={rule.assetType} opts={ASSET_TYPES} onChange={v => update(rule.id, 'assetType', v)} /></FieldRow>
                  <FieldRow label="Client Type"><Sel value={rule.clientType ?? 'Any'} opts={CLIENT_TYPES} onChange={v => update(rule.id, 'clientType', v)} /></FieldRow>
                  <FieldRow label="SLA Threshold"><Sel value={rule.slaThreshold} opts={SLA_THRESH} onChange={v => update(rule.id, 'slaThreshold', v)} /></FieldRow>
                  <FieldRow label="Assign To"><Sel value={rule.target} opts={TARGETS} onChange={v => update(rule.id, 'target', v)} /></FieldRow>
                  <div className="col-span-2 flex items-center gap-2 pt-1">
                    <Toggle on={!rule.requireConfirmation} onToggle={() => update(rule.id, 'requireConfirmation', !rule.requireConfirmation)} />
                    <span className="text-[11px] text-[#7A94B4]">
                      {rule.requireConfirmation ? 'Requires confirmation' : 'Fully autonomous'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {[
                    { label: 'Category',   value: rule.category },
                    { label: 'Site',       value: rule.site },
                    { label: 'Time',       value: rule.timeOfDay },
                    { label: 'Asset',      value: rule.assetType },
                    { label: 'Client Type',value: rule.clientType ?? 'Any' },
                    { label: 'SLA',        value: rule.slaThreshold },
                    { label: 'Assign To',  value: rule.target },
                  ].map(f => (
                    <div key={f.label}>
                      <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide">{f.label}</div>
                      <div className="text-[11px] text-[#EEF3FA] font-medium">{f.value}</div>
                    </div>
                  ))}
                  <div className="flex items-center gap-1.5 pt-0.5 col-span-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${rule.requireConfirmation ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                    <span className="text-[10px] text-[#7A94B4]">{rule.requireConfirmation ? 'Confirmation required' : 'Autonomous'}</span>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ──────────────────────────────── 4 · Severity & Ticket Type Rules ──────── */

function SectionSeverityRules({ settings, setSettings, onToast }: Props) {
  const toggle = (i: number, field: 'escalationRequired' | 'evidenceRequired' | 'supervisorApproval') => {
    const updated = [...settings.severityRules];
    updated[i] = { ...updated[i], [field]: !updated[i][field] };
    setSettings({ ...settings, severityRules: updated });
    onToast('Rule updated', 'info');
  };
  const setMode = (i: number, mode: DispatchMode) => {
    const updated = [...settings.severityRules];
    updated[i] = { ...updated[i], allowedMode: mode };
    setSettings({ ...settings, severityRules: updated });
  };

  return (
    <div className="space-y-5">
      <SectionTitle title="Severity & Ticket Type Rules" subtitle="Define the allowed dispatch mode, escalation, and approval requirements per ticket category" />
      <Card className="overflow-x-auto">
        <table className="w-full text-left text-[11px] min-w-[680px]">
          <thead>
            <tr className="border-b border-[rgba(46,127,255,0.12)]">
              {['Ticket Type', 'Severity', 'Allowed Mode', 'Escalation', 'Evidence', 'Supervisor'].map(h => (
                <th key={h} className="text-[9px] text-[#7A94B4] uppercase tracking-wide pb-2 pr-4 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {settings.severityRules.map((row, i) => (
              <tr key={i} className="border-b border-[rgba(46,127,255,0.06)] hover:bg-white/[0.02] transition-colors">
                <td className="py-2.5 pr-4 text-[#EEF3FA] font-medium">{row.ticketType}</td>
                <td className="py-2.5 pr-4">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                    row.severity === 'critical' ? 'text-red-400 border-red-500/30 bg-red-500/10'
                    : row.severity === 'high' ? 'text-orange-400 border-orange-500/30 bg-orange-500/10'
                    : row.severity === 'medium' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                    : 'text-[#7A94B4] border-white/10 bg-white/5'
                  }`}>{row.severity}</span>
                </td>
                <td className="py-2.5 pr-4">
                  <select value={row.allowedMode} onChange={e => setMode(i, e.target.value as DispatchMode)}
                    className="text-[10px] bg-[#0A1628] border border-[rgba(46,127,255,0.2)] rounded-lg px-2 py-1 outline-none cursor-pointer text-[#EEF3FA]">
                    <option value="manual">Manual</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="ai">AI Auto</option>
                  </select>
                </td>
                {(['escalationRequired', 'evidenceRequired', 'supervisorApproval'] as const).map(field => (
                  <td key={field} className="py-2.5 pr-4">
                    <button onClick={() => toggle(i, field)}>
                      {row[field]
                        ? <CheckCircle size={14} className="text-emerald-400" />
                        : <div className="w-3.5 h-3.5 rounded border border-[rgba(46,127,255,0.2)]" />}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ────────────────────────────────────────────── 5 · SLA Rules ───────────── */

function SectionSLARules({ settings, setSettings, onToast }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const urgencyColor = ['#FF4B4B', '#FF9B38', '#FFD700', '#2E7FFF', '#38D98A'];

  const update = (id: string, field: string, val: string) =>
    setSettings({ ...settings, slaRules: settings.slaRules.map(r => r.id === id ? { ...r, [field]: val } : r) });

  return (
    <div className="space-y-5">
      <SectionTitle title="SLA Rules" subtitle="Map SLA urgency thresholds to dispatch priorities and technician profiles" />

      <div className="space-y-3">
        {settings.slaRules.map((rule, i) => {
          const isEditing = editingId === rule.id;
          return (
            <Card key={rule.id}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-2 h-8 rounded-full flex-shrink-0" style={{ background: urgencyColor[i] }} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[12px] font-bold" style={{ color: urgencyColor[i] }}>{rule.label}</span>
                    {isEditing ? (
                      <select value={rule.threshold} onChange={e => update(rule.id, 'threshold', e.target.value)}
                        className="text-[10px] bg-[#0A1628] border border-[rgba(46,127,255,0.2)] rounded-lg px-1.5 py-0.5 text-[#EEF3FA] outline-none cursor-pointer">
                        {SLA_THRESH.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    ) : (
                      <span className="text-[10px] text-[#7A94B4] bg-[#0A1628] px-2 py-0.5 rounded-full border border-[rgba(46,127,255,0.15)]">{rule.threshold}</span>
                    )}
                  </div>
                </div>
                <button onClick={() => setEditingId(isEditing ? null : rule.id)} className="text-[#7A94B4] hover:text-[#2E7FFF] transition-colors">
                  {isEditing ? <Save size={13} /> : <Pencil size={13} />}
                </button>
              </div>

              {isEditing ? (
                <div className="grid grid-cols-2 gap-3 pl-5">
                  <FieldRow label="Dispatch Priority">
                    <Sel value={rule.dispatchPriority} opts={SLA_PRIOS} onChange={v => update(rule.id, 'dispatchPriority', v)} />
                  </FieldRow>
                  <FieldRow label="Technician Profile">
                    <Sel value={rule.techProfile} opts={TECH_PROFS} onChange={v => update(rule.id, 'techProfile', v)} />
                  </FieldRow>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 pl-5">
                  <div>
                    <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1">Dispatch Priority</div>
                    <div className="text-[11px] text-[#EEF3FA]">{rule.dispatchPriority}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1">Technician Profile</div>
                    <div className="text-[11px] text-[#EEF3FA]">{rule.techProfile}</div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Card>
        <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-3">Urgency Ladder</div>
        <div className="flex gap-0">
          {settings.slaRules.map((rule, i) => (
            <div key={rule.id} className="flex-1 text-center">
              <div className="h-8 rounded-sm mx-0.5 flex items-end justify-center pb-1" style={{ background: urgencyColor[i] + '30', borderBottom: `3px solid ${urgencyColor[i]}` }}>
                <span className="text-[8px] font-bold" style={{ color: urgencyColor[i] }}>{rule.label}</span>
              </div>
              <div className="text-[8px] text-[#7A94B4] mt-1 px-0.5">{rule.threshold}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ──────────────────────────────────────── 6 · Escalation Rules ──────────── */

function SectionEscalationRules({ settings, setSettings, onToast }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const toggle = (id: string) => {
    const rule = settings.escalationRules.find(r => r.id === id)!;
    setSettings({ ...settings, escalationRules: settings.escalationRules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r) });
    onToast(`"${rule.trigger}" ${rule.enabled ? 'disabled' : 'enabled'}`, 'info');
  };
  const update = (id: string, field: string, val: string) =>
    setSettings({ ...settings, escalationRules: settings.escalationRules.map(r => r.id === id ? { ...r, [field]: val } : r) });

  return (
    <div className="space-y-5">
      <SectionTitle title="Escalation Rules" subtitle="Define automatic escalation triggers and the corresponding actions taken" />

      <div className="space-y-3">
        {settings.escalationRules.map(rule => {
          const isEditing = editingId === rule.id;
          return (
            <Card key={rule.id} className={!rule.enabled ? 'opacity-60' : ''}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={13} className={rule.enabled ? 'text-red-400' : 'text-[#7A94B4]'} />
                  {isEditing ? (
                    <input value={rule.trigger} onChange={e => update(rule.id, 'trigger', e.target.value)}
                      className="text-[12px] font-bold text-[#EEF3FA] bg-transparent border-b border-[rgba(46,127,255,0.3)] outline-none" />
                  ) : (
                    <span className="text-[12px] font-bold text-[#EEF3FA]">{rule.trigger}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditingId(isEditing ? null : rule.id)} className="text-[#7A94B4] hover:text-[#2E7FFF] transition-colors">
                    {isEditing ? <Save size={13} /> : <Pencil size={13} />}
                  </button>
                  <Toggle on={rule.enabled} onToggle={() => toggle(rule.id)} />
                </div>
              </div>

              <div className="space-y-2 pl-5">
                <div>
                  <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1">Condition</div>
                  {isEditing ? (
                    <input value={rule.condition} onChange={e => update(rule.id, 'condition', e.target.value)}
                      className="w-full text-[11px] text-[#EEF3FA] bg-[#0A1628] border border-[rgba(46,127,255,0.2)] rounded-lg px-2 py-1 outline-none focus:border-[#2E7FFF]" />
                  ) : (
                    <div className="text-[11px] text-[#EEF3FA]">{rule.condition}</div>
                  )}
                </div>
                <div>
                  <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1">Action</div>
                  {isEditing ? (
                    <input value={rule.action} onChange={e => update(rule.id, 'action', e.target.value)}
                      className="w-full text-[11px] text-[#EEF3FA] bg-[#0A1628] border border-[rgba(46,127,255,0.2)] rounded-lg px-2 py-1 outline-none focus:border-[#2E7FFF]" />
                  ) : (
                    <div className="text-[11px] text-[#EEF3FA]">{rule.action}</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide">Notifies</div>
                  {isEditing ? (
                    <Sel value={rule.notifyRole} opts={NOTIFY_ROLES} onChange={v => update(rule.id, 'notifyRole', v)} />
                  ) : (
                    <span className="text-[10px] text-[#2E7FFF] bg-[rgba(46,127,255,0.12)] border border-[rgba(46,127,255,0.25)] px-1.5 py-0.5 rounded-full">{rule.notifyRole}</span>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ──────────────────────────────── 7 · Vendor / Team Eligibility ─────────── */

const PREF_CFG = {
  preferred:  { label: 'Preferred',  color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  approved:   { label: 'Approved',   color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
  restricted: { label: 'Restricted', color: 'text-red-400 border-red-500/30 bg-red-500/10' },
};

function SectionEligibility({ settings, setSettings, onToast }: Props) {
  const [typeFilter,   setTypeFilter]   = useState<'all' | 'vendor' | 'inhouse'>('all');
  const [skillFilter,  setSkillFilter]  = useState('Any');
  const [regionFilter, setRegionFilter] = useState('All Regions');
  const [siteFilter,   setSiteFilter]   = useState('All Sites');
  const [assetFilter,  setAssetFilter]  = useState('Any');
  const [serviceFilter,setServiceFilter]= useState('Any');

  const [editingId, setEditingId] = useState<string | null>(null);

  const update = (id: string, field: string, val: string | string[]) =>
    setSettings({ ...settings, eligibilityRules: settings.eligibilityRules.map(r => r.id === id ? { ...r, [field]: val } : r) });

  const shown = settings.eligibilityRules.filter(r => {
    if (typeFilter !== 'all' && r.type !== typeFilter) return false;
    if (skillFilter !== 'Any' && !r.skillFilter.includes(skillFilter)) return false;
    if (regionFilter !== 'All Regions' && !r.regionFilter.includes(regionFilter)) return false;
    if (siteFilter !== 'All Sites' && r.siteFilter !== 'All Sites' && !r.siteFilter.includes(siteFilter)) return false;
    if (assetFilter !== 'Any' && r.assetTypeFilter !== 'Any' && !r.assetTypeFilter.includes(assetFilter)) return false;
    if (serviceFilter !== 'Any' && !r.serviceLines.some(s => s.includes(serviceFilter.split(' ')[0]))) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <SectionTitle title="Vendor & Team Eligibility" subtitle="Control which vendors and teams are eligible for dispatch per skill, region, and service line" />

      <Card>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <FieldRow label="Type">
            <div className="flex gap-1">
              {(['all', 'vendor', 'inhouse'] as const).map(f => (
                <button key={f} onClick={() => setTypeFilter(f)}
                  className={`text-[10px] px-2 py-1 rounded-lg border transition-all capitalize ${typeFilter === f ? 'bg-[rgba(46,127,255,0.2)] border-[#2E7FFF] text-[#EEF3FA]' : 'border-[rgba(46,127,255,0.15)] text-[#7A94B4] hover:text-[#EEF3FA]'}`}>
                  {f === 'inhouse' ? 'In-House' : f === 'all' ? 'All' : 'Vendors'}
                </button>
              ))}
            </div>
          </FieldRow>
          <FieldRow label="Skill"><Sel value={skillFilter} opts={SKILL_OPTS} onChange={setSkillFilter} /></FieldRow>
          <FieldRow label="Region"><Sel value={regionFilter} opts={REGION_OPTS} onChange={setRegionFilter} /></FieldRow>
          <FieldRow label="Site"><Sel value={siteFilter} opts={SITE_FILT} onChange={setSiteFilter} /></FieldRow>
          <FieldRow label="Asset Type"><Sel value={assetFilter} opts={ASSET_FILT} onChange={setAssetFilter} /></FieldRow>
          <FieldRow label="Service"><Sel value={serviceFilter} opts={SERVICE_OPTS} onChange={setServiceFilter} /></FieldRow>
        </div>
      </Card>

      {shown.length === 0 && (
        <div className="text-center py-8 text-[12px] text-[#7A94B4] opacity-60">No rules match current filters</div>
      )}

      <div className="space-y-3">
        {shown.map(rule => {
          const pref = PREF_CFG[rule.preference];
          const isEditing = editingId === rule.id;
          return (
            <Card key={rule.id}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${rule.type === 'inhouse' ? 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' : 'text-purple-400 border-purple-500/30 bg-purple-500/10'}`}>
                    {rule.type === 'inhouse' ? 'In-House' : 'Vendor'}
                  </span>
                  <span className="text-[12px] font-bold text-[#EEF3FA]">{rule.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <Sel value={rule.preference} opts={[...PREF_OPTS]} onChange={v => update(rule.id, 'preference', v)} />
                  ) : (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${pref.color}`}>{pref.label}</span>
                  )}
                  <button onClick={() => setEditingId(isEditing ? null : rule.id)} className="text-[#7A94B4] hover:text-[#2E7FFF] transition-colors">
                    {isEditing ? <Save size={13} /> : <Pencil size={13} />}
                  </button>
                </div>
              </div>
              {isEditing ? (
                <div className="grid grid-cols-2 gap-3">
                  <FieldRow label="Skill Filter"><Sel value={rule.skillFilter} opts={SKILL_OPTS} onChange={v => update(rule.id, 'skillFilter', v)} /></FieldRow>
                  <FieldRow label="Region"><Sel value={rule.regionFilter} opts={REGION_OPTS} onChange={v => update(rule.id, 'regionFilter', v)} /></FieldRow>
                  <FieldRow label="Site"><Sel value={rule.siteFilter} opts={SITE_FILT} onChange={v => update(rule.id, 'siteFilter', v)} /></FieldRow>
                  <FieldRow label="Asset Type"><Sel value={rule.assetTypeFilter} opts={ASSET_FILT} onChange={v => update(rule.id, 'assetTypeFilter', v)} /></FieldRow>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1">Skill Filter</div>
                    <div className="text-[11px] text-[#EEF3FA]">{rule.skillFilter}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1">Region</div>
                    <div className="text-[11px] text-[#EEF3FA]">{rule.regionFilter}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1">Site</div>
                    <div className="text-[11px] text-[#EEF3FA]">{rule.siteFilter}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1">Asset Type</div>
                    <div className="text-[11px] text-[#EEF3FA]">{rule.assetTypeFilter}</div>
                  </div>
                </div>
              )}
              <div className="mt-2">
                <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1">Service Lines</div>
                <div className="flex flex-wrap gap-1">
                  {rule.serviceLines.map(s => (
                    <span key={s} className="text-[9px] bg-[rgba(46,127,255,0.1)] border border-[rgba(46,127,255,0.2)] text-blue-300 px-1.5 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ──────────────────────────────────── 8 · Preview & Testing ─────────────── */

const TICKET_TYPES_SIM = ['HVAC', 'Plumbing', 'Electrical', 'General', 'Fire Safety', 'Lift / Elevator', 'Cleaning'];
const SITES_SIM        = ['Silicon Oasis', 'Gate Avenue', 'Business Bay', 'DIFC Tower'];
const ASSETS_SIM       = ['Chiller / AHU', 'Lift', 'Generator', 'Pool Pump', 'Fire Panel', 'General Asset'];
const TIMES_SIM        = ['Business Hours', 'Off-Hours (22:00–06:00)', 'Early Morning (06:00–09:00)'];
const AVAIL_TECHS      = ['Karim R. (HVAC · 0.4 km)', 'Sara M. (Electrical · 0.8 km)', 'Ahmed K. (Plumbing · 0.6 km)', 'Faisal N. (General · 1.1 km)', 'Omar T. (General · 0.9 km)'];

const TECH_POOL = [
  { name: 'Karim R.',  skill: 'HVAC',       distance: 0.4, rating: 4.8 },
  { name: 'Sara M.',   skill: 'Electrical',  distance: 0.8, rating: 4.9 },
  { name: 'Ahmed K.',  skill: 'Plumbing',    distance: 0.6, rating: 4.6 },
  { name: 'Faisal N.', skill: 'General',     distance: 1.1, rating: 4.7 },
  { name: 'Omar T.',   skill: 'General',     distance: 0.9, rating: 4.2 },
];

interface SimInput {
  ticketType: string;
  severity: string;
  site: string;
  asset: string;
  timeOfDay: string;
  slaMinutes: number;
  availableTech: string;
}

interface SimResult {
  recommendedMode: DispatchMode;
  tech: string;
  score: number;
  reasonSummary: string;
  supervisorRequired: boolean;
  escalationTriggered: boolean;
  ruleApplied: string;
}

function computeSimResult(input: SimInput, settings: DispatchSettings): SimResult {
  // Check severity rules for allowed mode
  const sevRule = settings.severityRules.find(r => r.ticketType === input.ticketType && r.severity === input.severity);
  let mode: DispatchMode = sevRule?.allowedMode ?? settings.globalMode;

  // Check condition-based overrides
  if (input.severity === 'critical') mode = 'manual';
  else if (input.ticketType === 'Fire Safety') mode = 'manual';
  else if (input.slaMinutes < 20) mode = 'manual';
  else if (input.timeOfDay === 'Off-Hours (22:00–06:00)' && (input.severity === 'low' || input.severity === 'medium')) mode = 'ai';

  const ruleApplied = sevRule ? `Severity rule: ${input.ticketType}/${input.severity}` : `Global mode: ${MODE_CFG[settings.globalMode].label}`;

  // Use match weights to score techs
  const weights = settings.matchWeights;
  const totalW = Object.values(weights).filter(w => w.enabled).reduce((s, w) => s + w.weight, 0) || 100;
  const skillMap: Record<string, string> = {
    HVAC: 'HVAC', Plumbing: 'Plumbing', Electrical: 'Electrical',
    'Fire Safety': 'Electrical', General: 'General', Cleaning: 'General', 'Lift / Elevator': 'General',
  };
  const targetSkill = skillMap[input.ticketType] ?? 'General';

  // If user selected a specific available tech, use only that
  const selectedTechName = input.availableTech !== 'Any Available' ? input.availableTech.split(' (')[0] : null;
  const pool = selectedTechName ? TECH_POOL.filter(t => t.name === selectedTechName) : TECH_POOL;

  const scored = pool.map(t => {
    let score = 0;
    if (weights.skillMatch?.enabled)        score += (t.skill === targetSkill ? 1 : 0.3) * (weights.skillMatch.weight / totalW) * 100;
    if (weights.proximityDistance?.enabled) score += (1 / (t.distance + 0.1)) * (weights.proximityDistance.weight / totalW) * 10;
    if (weights.techRating?.enabled)        score += (t.rating / 5) * (weights.techRating.weight / totalW) * 100;
    return { ...t, score: Math.min(99, Math.round(score + 30)) };
  });
  scored.sort((a, b) => b.score - a.score);
  const top = scored[0];

  const supervisorRequired = sevRule?.supervisorApproval ?? (mode === 'manual' || input.severity === 'critical');
  const escalationTriggered = sevRule?.escalationRequired ?? (input.severity === 'critical' || input.slaMinutes < 20);

  return {
    recommendedMode: mode,
    tech: top?.name ?? 'No tech available',
    score: top?.score ?? 0,
    reasonSummary: `${top?.skill === targetSkill ? 'Skill match' : 'Best available'} · ${top?.distance} km away · Rating ${top?.rating} · ETA ~${Math.round((top?.distance ?? 1) * 7 + 3)} min`,
    supervisorRequired,
    escalationTriggered,
    ruleApplied,
  };
}

function SectionPreview({ settings, onToast }: { settings: DispatchSettings; onToast: ToastFn }) {
  const [input, setInput] = useState<SimInput>({
    ticketType: 'HVAC', severity: 'critical', site: 'Silicon Oasis',
    asset: 'Chiller / AHU', timeOfDay: 'Business Hours', slaMinutes: 45, availableTech: 'Any Available',
  });
  const [result, setResult] = useState<SimResult | null>(null);

  const runSim = () => {
    setResult(computeSimResult(input, settings));
    onToast('Simulation complete', 'success');
  };

  const modeCfg = result ? MODE_CFG[result.recommendedMode] : null;

  const strFields = [
    { label: 'Ticket Type',        key: 'ticketType',    opts: TICKET_TYPES_SIM },
    { label: 'Severity',           key: 'severity',      opts: SEVERITIES },
    { label: 'Site',               key: 'site',          opts: SITES_SIM },
    { label: 'Asset',              key: 'asset',         opts: ASSETS_SIM },
    { label: 'Time of Day',        key: 'timeOfDay',     opts: TIMES_SIM },
    { label: 'Available Tech',     key: 'availableTech', opts: ['Any Available', ...AVAIL_TECHS] },
  ] as const;

  return (
    <div className="space-y-5">
      <SectionTitle title="Preview & Simulation" subtitle="Run a mock dispatch simulation against the current rules to preview AI decision output" />

      <Card>
        <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-4">Simulation Inputs</div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {strFields.map(f => (
            <FieldRow key={f.key} label={f.label}>
              <Sel value={input[f.key]} opts={[...f.opts]} onChange={v => setInput(prev => ({ ...prev, [f.key]: v }))} />
            </FieldRow>
          ))}
          <div className="col-span-2">
            <label className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1 block">SLA Remaining (min)</label>
            <div className="flex items-center gap-3">
              <input type="range" min={5} max={240} step={5} value={input.slaMinutes}
                onChange={e => setInput(prev => ({ ...prev, slaMinutes: Number(e.target.value) }))}
                className="flex-1 accent-[#2E7FFF]" />
              <span className="text-[11px] font-bold text-[#2E7FFF] w-10 text-right">{input.slaMinutes}m</span>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <button onClick={runSim} className="flex items-center gap-2 px-4 py-2 bg-[#2E7FFF] text-white text-[11px] font-bold rounded-lg hover:bg-blue-500 transition-colors">
            <Play size={12} /> Run Simulation
          </button>
        </div>
      </Card>

      <AnimatePresence>
        {result && modeCfg && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }}>
            <Card>
              <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-3">Simulation Result</div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className={`p-3 rounded-xl border ${modeCfg.border} ${modeCfg.bg}`}>
                  <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1">Recommended Mode</div>
                  <div className={`flex items-center gap-1.5 text-[13px] font-bold ${modeCfg.color}`}>{modeCfg.icon} {modeCfg.label}</div>
                </div>
                <div className="p-3 rounded-xl border border-[rgba(46,127,255,0.3)] bg-[rgba(46,127,255,0.08)]">
                  <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1">Top Match</div>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold text-[#EEF3FA]">{result.tech}</span>
                    <span className="text-[13px] font-bold text-[#2E7FFF]">{result.score}%</span>
                  </div>
                </div>
                <div className={`p-3 rounded-xl border ${result.supervisorRequired ? 'border-amber-500/30 bg-amber-500/10' : 'border-emerald-500/30 bg-emerald-500/10'}`}>
                  <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1">Supervisor Confirmation</div>
                  <div className={`text-[12px] font-bold ${result.supervisorRequired ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {result.supervisorRequired ? 'Required' : 'Not Required'}
                  </div>
                </div>
                <div className={`p-3 rounded-xl border ${result.escalationTriggered ? 'border-red-500/30 bg-red-500/10' : 'border-[rgba(46,127,255,0.2)] bg-[rgba(46,127,255,0.05)]'}`}>
                  <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1">Escalation Triggered</div>
                  <div className={`text-[12px] font-bold ${result.escalationTriggered ? 'text-red-400' : 'text-[#7A94B4]'}`}>
                    {result.escalationTriggered ? 'Yes — supervisor notified' : 'No'}
                  </div>
                </div>
              </div>
              <div className="p-3 bg-[#0A1628] rounded-lg space-y-2">
                <div>
                  <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-0.5">Reason Summary</div>
                  <div className="text-[11px] text-[#EEF3FA]">{result.reasonSummary}</div>
                </div>
                <div>
                  <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-0.5">Rule Applied</div>
                  <div className="text-[11px] text-[#2E7FFF]">{result.ruleApplied}</div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────── main page ──────── */

const SECTIONS = [
  { id: 'modes',       label: 'Dispatch Modes',         icon: <Zap size={14} /> },
  { id: 'match',       label: 'AI Top Match Logic',      icon: <Bot size={14} /> },
  { id: 'auto',        label: 'Auto-Assignment Rules',   icon: <Settings2 size={14} /> },
  { id: 'severity',    label: 'Severity & Ticket Rules', icon: <AlertTriangle size={14} /> },
  { id: 'sla',         label: 'SLA Rules',               icon: <Clock size={14} /> },
  { id: 'escalation',  label: 'Escalation Rules',        icon: <ShieldAlert size={14} /> },
  { id: 'eligibility', label: 'Vendor Eligibility',      icon: <Users size={14} /> },
  { id: 'preview',     label: 'Preview & Testing',       icon: <FlaskConical size={14} /> },
];

export function DispatchAIRules({ onToast, settings, setSettings }: Props) {
  const [activeSection, setActive] = useState('modes');

  const renderSection = () => {
    const props = { settings, setSettings, onToast };
    switch (activeSection) {
      case 'modes':       return <SectionDispatchModes    {...props} />;
      case 'match':       return <SectionMatchLogic       {...props} />;
      case 'auto':        return <SectionAutoRules        {...props} />;
      case 'severity':    return <SectionSeverityRules    {...props} />;
      case 'sla':         return <SectionSLARules         {...props} />;
      case 'escalation':  return <SectionEscalationRules  {...props} />;
      case 'eligibility': return <SectionEligibility      {...props} />;
      case 'preview':     return <SectionPreview settings={settings} onToast={onToast} />;
      default:            return null;
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(46,127,255,0.15)] flex-shrink-0">
        <div>
          <h2 className="text-[#EEF3FA] font-bold text-base" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Dispatch &amp; AI Rules
          </h2>
          <p className="text-[11px] text-[#7A94B4]">
            Configure Smart Dispatch engine behaviour, match weights, escalation logic, and SLA rules
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[10px] text-[#7A94B4]">
            <Bot size={12} className="text-[#2E7FFF]" />
            <span>4C360 AI Engine</span>
          </div>
          <button
            onClick={() => onToast('Settings saved', 'success')}
            className="px-3 py-1.5 bg-[#2E7FFF] text-white text-[11px] font-semibold rounded-lg hover:bg-blue-500 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-52 flex-shrink-0 border-r border-[rgba(46,127,255,0.15)] py-3 flex flex-col gap-0.5 overflow-y-auto custom-scrollbar bg-[#0A1628]">
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setActive(s.id)}
              className={`flex items-center gap-2.5 px-4 py-2.5 text-left text-[12px] font-medium transition-all border-r-2 ${
                activeSection === s.id
                  ? 'text-[#EEF3FA] bg-[rgba(46,127,255,0.1)] border-[#2E7FFF]'
                  : 'text-[#7A94B4] border-transparent hover:text-[#EEF3FA] hover:bg-white/[0.02]'
              }`}>
              <span className={activeSection === s.id ? 'text-[#2E7FFF]' : 'text-[#7A94B4]'}>{s.icon}</span>
              {s.label}
              {activeSection === s.id && <ChevronRight size={11} className="ml-auto text-[#2E7FFF]" />}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5">
          <AnimatePresence mode="wait">
            <motion.div key={activeSection} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.15 }}>
              {renderSection()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
