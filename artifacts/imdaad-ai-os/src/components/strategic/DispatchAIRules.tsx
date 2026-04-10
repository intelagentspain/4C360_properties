import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Bot, Hand, SlidersHorizontal, ShieldAlert, Clock,
  AlertTriangle, Users, FlaskConical, ChevronRight, Plus,
  Trash2, ToggleLeft, ToggleRight, CheckCircle, X, Play,
  Settings2,
} from 'lucide-react';
import { type ToastFn } from '@/lib/ui';
import {
  initialDispatchSettings,
  type DispatchSettings,
  type DispatchMode,
  type EscalationRule,
} from '@/data/dispatchSettings';

interface Props { onToast: ToastFn }

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
      {on
        ? <ToggleRight size={20} className="text-[#2E7FFF]" />
        : <ToggleLeft  size={20} className="text-[#7A94B4] opacity-50" />}
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

/* ─────────────────────────────────────────── 1 · Dispatch Modes ─────────── */

function SectionDispatchModes({ settings, setSettings, onToast }: {
  settings: DispatchSettings; setSettings: (s: DispatchSettings) => void; onToast: ToastFn;
}) {
  const setMode = (m: DispatchMode) => {
    setSettings({ ...settings, globalMode: m });
    onToast(`Global dispatch mode set to ${MODE_CFG[m].label}`, 'success');
  };
  const removeOverride = (i: number) =>
    setSettings({ ...settings, modeOverrides: settings.modeOverrides.filter((_, idx) => idx !== i) });
  const addOverride = () =>
    setSettings({ ...settings, modeOverrides: [...settings.modeOverrides, { condition: 'New condition — edit me', mode: 'hybrid' }] });

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
              className={`flex flex-col gap-2 p-3 rounded-xl border transition-all ${
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
              <p className="text-[10px] text-[#7A94B4] leading-snug text-left">{cfg.desc}</p>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide">Condition-Based Mode Overrides</div>
          <button
            onClick={addOverride}
            className="flex items-center gap-1 text-[10px] text-[#2E7FFF] hover:text-blue-300 transition-colors"
          >
            <Plus size={11} /> Add Rule
          </button>
        </div>
        <div className="space-y-2">
          {settings.modeOverrides.map((ov, i) => {
            const cfg = MODE_CFG[ov.mode];
            return (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-[#0A1628] rounded-lg group">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${MODE_BADGE[ov.mode]}`}>
                  {cfg.label}
                </span>
                <span className="flex-1 text-[11px] text-[#EEF3FA]">{ov.condition}</span>
                <button
                  onClick={() => removeOverride(i)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────── 2 · AI Top Match Logic ─────────── */

function SectionMatchLogic({ settings, setSettings, onToast }: {
  settings: DispatchSettings; setSettings: (s: DispatchSettings) => void; onToast: ToastFn;
}) {
  const weights = settings.matchWeights;

  const totalEnabled = Object.values(weights)
    .filter(w => w.enabled)
    .reduce((s, w) => s + w.weight, 0);

  const setWeight = (key: string, val: number) => {
    setSettings({ ...settings, matchWeights: { ...weights, [key]: { ...weights[key], weight: val } } });
  };
  const toggleWeight = (key: string) => {
    const current = weights[key];
    setSettings({
      ...settings,
      matchWeights: {
        ...weights,
        [key]: { ...current, enabled: !current.enabled, weight: !current.enabled ? 10 : current.weight },
      },
    });
    onToast(`${current.label} ${current.enabled ? 'disabled' : 'enabled'}`, 'info');
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
                  <input
                    type="range"
                    min={0}
                    max={60}
                    value={w.weight}
                    onChange={e => setWeight(key, Number(e.target.value))}
                    className="w-full h-1 accent-[#2E7FFF] cursor-pointer"
                  />
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
                    <motion.div
                      key={pct}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.4 }}
                      className="h-full rounded-full bg-[#2E7FFF]"
                    />
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

function SectionAutoRules({ settings, setSettings, onToast }: {
  settings: DispatchSettings; setSettings: (s: DispatchSettings) => void; onToast: ToastFn;
}) {
  const [editId, setEditId] = useState<string | null>(null);

  const removeRule = (id: string) => {
    setSettings({ ...settings, autoAssignRules: settings.autoAssignRules.filter(r => r.id !== id) });
    onToast('Auto-assignment rule removed', 'info');
  };
  const addRule = () => {
    const newRule = {
      id: `AR-${String(settings.autoAssignRules.length + 1).padStart(3, '0')}`,
      category: 'HVAC',
      severity: 'medium',
      site: 'All Sites',
      timeOfDay: 'Any',
      assetType: 'Any',
      slaThreshold: '< 60 min',
      target: 'Nearest available tech',
      requireConfirmation: true,
    };
    setSettings({ ...settings, autoAssignRules: [...settings.autoAssignRules, newRule] });
    setEditId(newRule.id);
    onToast('New auto-assignment rule added', 'success');
  };

  return (
    <div className="space-y-5">
      <SectionTitle title="Auto-Assignment Rules" subtitle="Define conditions that trigger automatic technician assignment" />

      <div className="flex justify-end">
        <button
          onClick={addRule}
          className="flex items-center gap-1.5 text-[11px] bg-[#2E7FFF] text-white px-3 py-1.5 rounded-lg hover:bg-blue-500 transition-colors"
        >
          <Plus size={12} /> Add Rule
        </button>
      </div>

      <div className="space-y-3">
        {settings.autoAssignRules.map(rule => (
          <Card key={rule.id} className="group">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#7A94B4] font-mono bg-[#0A1628] px-1.5 py-0.5 rounded">{rule.id}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                  rule.severity === 'critical' ? 'text-red-400 bg-red-500/10 border-red-500/30'
                  : rule.severity === 'high' ? 'text-orange-400 bg-orange-500/10 border-orange-500/30'
                  : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                }`}>{rule.severity}</span>
              </div>
              <button onClick={() => removeRule(rule.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 mt-0.5">
                <Trash2 size={13} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {[
                { label: 'Category',       value: rule.category },
                { label: 'Site',           value: rule.site },
                { label: 'Time of Day',    value: rule.timeOfDay },
                { label: 'Asset Type',     value: rule.assetType },
                { label: 'SLA Threshold',  value: rule.slaThreshold },
                { label: 'Assign To',      value: rule.target },
              ].map(f => (
                <div key={f.label}>
                  <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide">{f.label}</div>
                  <div className="text-[11px] text-[#EEF3FA] font-medium">{f.value}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-[rgba(46,127,255,0.1)] flex items-center gap-2">
              <Toggle
                on={!rule.requireConfirmation}
                onToggle={() =>
                  setSettings({
                    ...settings,
                    autoAssignRules: settings.autoAssignRules.map(r =>
                      r.id === rule.id ? { ...r, requireConfirmation: !r.requireConfirmation } : r
                    ),
                  })
                }
              />
              <span className="text-[11px] text-[#7A94B4]">
                {rule.requireConfirmation ? 'Requires supervisor confirmation' : 'Fully autonomous — no confirmation needed'}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────── 4 · Severity & Ticket Type Rules ──────── */

function SectionSeverityRules({ settings, setSettings, onToast }: {
  settings: DispatchSettings; setSettings: (s: DispatchSettings) => void; onToast: ToastFn;
}) {
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
        <table className="w-full text-left text-[11px] min-w-[700px]">
          <thead>
            <tr className="border-b border-[rgba(46,127,255,0.12)]">
              {['Ticket Type', 'Severity', 'Allowed Mode', 'Escalation', 'Evidence', 'Supervisor Approval'].map(h => (
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
                  }`}>
                    {row.severity}
                  </span>
                </td>
                <td className="py-2.5 pr-4">
                  <select
                    value={row.allowedMode}
                    onChange={e => setMode(i, e.target.value as DispatchMode)}
                    className="text-[10px] bg-[#0A1628] border border-[rgba(46,127,255,0.2)] rounded-lg px-2 py-1 outline-none cursor-pointer text-[#EEF3FA]"
                  >
                    <option value="manual">Manual</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="ai">AI Auto</option>
                  </select>
                </td>
                <td className="py-2.5 pr-4">
                  <button onClick={() => toggle(i, 'escalationRequired')}>
                    {row.escalationRequired
                      ? <CheckCircle size={14} className="text-emerald-400" />
                      : <div className="w-3.5 h-3.5 rounded border border-[rgba(46,127,255,0.2)]" />}
                  </button>
                </td>
                <td className="py-2.5 pr-4">
                  <button onClick={() => toggle(i, 'evidenceRequired')}>
                    {row.evidenceRequired
                      ? <CheckCircle size={14} className="text-emerald-400" />
                      : <div className="w-3.5 h-3.5 rounded border border-[rgba(46,127,255,0.2)]" />}
                  </button>
                </td>
                <td className="py-2.5 pr-4">
                  <button onClick={() => toggle(i, 'supervisorApproval')}>
                    {row.supervisorApproval
                      ? <CheckCircle size={14} className="text-emerald-400" />
                      : <div className="w-3.5 h-3.5 rounded border border-[rgba(46,127,255,0.2)]" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ───────────────────────────────────────────── 5 · SLA Rules ────────────── */

function SectionSLARules({ settings, setSettings, onToast }: {
  settings: DispatchSettings; setSettings: (s: DispatchSettings) => void; onToast: ToastFn;
}) {
  const urgencyColor = ['#FF4B4B', '#FF9B38', '#FFD700', '#2E7FFF', '#38D98A'];

  return (
    <div className="space-y-5">
      <SectionTitle title="SLA Rules" subtitle="Map SLA urgency thresholds to dispatch priorities and technician profiles" />

      <div className="space-y-3">
        {settings.slaRules.map((rule, i) => (
          <Card key={rule.id}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-8 rounded-full flex-shrink-0" style={{ background: urgencyColor[i] }} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[12px] font-bold" style={{ color: urgencyColor[i] }}>{rule.label}</span>
                  <span className="text-[10px] text-[#7A94B4] bg-[#0A1628] px-2 py-0.5 rounded-full border border-[rgba(46,127,255,0.15)]">{rule.threshold}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-[#7A94B4]">
                  <Clock size={9} />
                  <span>SLA window</span>
                </div>
              </div>
            </div>
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
          </Card>
        ))}
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

function SectionEscalationRules({ settings, setSettings, onToast }: {
  settings: DispatchSettings; setSettings: (s: DispatchSettings) => void; onToast: ToastFn;
}) {
  const toggleRule = (id: string) => {
    setSettings({
      ...settings,
      escalationRules: settings.escalationRules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r),
    });
    const rule = settings.escalationRules.find(r => r.id === id);
    onToast(`Escalation rule "${rule?.trigger}" ${rule?.enabled ? 'disabled' : 'enabled'}`, 'info');
  };

  return (
    <div className="space-y-5">
      <SectionTitle title="Escalation Rules" subtitle="Define automatic escalation triggers and the corresponding actions taken" />

      <div className="space-y-3">
        {settings.escalationRules.map(rule => (
          <Card key={rule.id} className={!rule.enabled ? 'opacity-60' : ''}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShieldAlert size={13} className={rule.enabled ? 'text-red-400' : 'text-[#7A94B4]'} />
                <span className="text-[12px] font-bold text-[#EEF3FA]">{rule.trigger}</span>
              </div>
              <Toggle on={rule.enabled} onToggle={() => toggleRule(rule.id)} />
            </div>
            <div className="space-y-2 pl-5">
              <div>
                <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide">Condition</div>
                <div className="text-[11px] text-[#EEF3FA]">{rule.condition}</div>
              </div>
              <div>
                <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide">Action</div>
                <div className="text-[11px] text-[#EEF3FA]">{rule.action}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide">Notifies</div>
                <span className="text-[10px] text-[#2E7FFF] bg-[rgba(46,127,255,0.12)] border border-[rgba(46,127,255,0.25)] px-1.5 py-0.5 rounded-full">{rule.notifyRole}</span>
              </div>
            </div>
          </Card>
        ))}
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

function SectionEligibility({ settings, onToast }: {
  settings: DispatchSettings; onToast: ToastFn;
}) {
  const [filter, setFilter] = useState<'all' | 'vendor' | 'inhouse'>('all');

  const shown = settings.eligibilityRules.filter(r => filter === 'all' || r.type === filter);

  return (
    <div className="space-y-5">
      <SectionTitle title="Vendor & Team Eligibility" subtitle="Control which vendors and teams are eligible for dispatch per skill, region, and service line" />

      <div className="flex gap-1.5">
        {(['all', 'vendor', 'inhouse'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-[10px] px-3 py-1 rounded-lg border transition-all capitalize ${
              filter === f
                ? 'bg-[rgba(46,127,255,0.2)] border-[#2E7FFF] text-[#EEF3FA]'
                : 'border-[rgba(46,127,255,0.15)] text-[#7A94B4] hover:text-[#EEF3FA]'
            }`}
          >
            {f === 'all' ? 'All' : f === 'inhouse' ? 'In-House' : 'Vendors'}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {shown.map(rule => {
          const pref = PREF_CFG[rule.preference];
          return (
            <Card key={rule.id}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                    rule.type === 'inhouse'
                      ? 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10'
                      : 'text-purple-400 border-purple-500/30 bg-purple-500/10'
                  }`}>
                    {rule.type === 'inhouse' ? 'In-House' : 'Vendor'}
                  </span>
                  <span className="text-[12px] font-bold text-[#EEF3FA]">{rule.name}</span>
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${pref.color}`}>{pref.label}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1">Skill Filter</div>
                  <div className="text-[11px] text-[#EEF3FA]">{rule.skillFilter}</div>
                </div>
                <div>
                  <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1">Region</div>
                  <div className="text-[11px] text-[#EEF3FA]">{rule.regionFilter}</div>
                </div>
              </div>
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

interface SimInput {
  ticketType: string;
  severity: string;
  site: string;
  asset: string;
  timeOfDay: string;
  slaMinutes: number;
}

interface SimResult {
  recommendedMode: DispatchMode;
  tech: string;
  score: number;
  reasonSummary: string;
  supervisorRequired: boolean;
  escalationTriggered: boolean;
}

const TICKET_TYPES = ['HVAC', 'Plumbing', 'Electrical', 'General', 'Fire Safety', 'Lift / Elevator', 'Cleaning'];
const SEVERITIES   = ['low', 'medium', 'high', 'critical'];
const SITES        = ['Silicon Oasis', 'Gate Avenue', 'Business Bay', 'DIFC Tower'];
const ASSETS       = ['Chiller / AHU', 'Lift', 'Generator', 'Pool Pump', 'Fire Panel', 'General Asset'];
const TIMES        = ['Business Hours', 'Off-Hours (22:00–06:00)', 'Early Morning (06:00–09:00)'];
const TECHS        = [
  { name: 'Karim R.',  skill: 'HVAC',       distance: 0.4, rating: 4.8 },
  { name: 'Sara M.',   skill: 'Electrical',  distance: 0.8, rating: 4.9 },
  { name: 'Ahmed K.',  skill: 'Plumbing',    distance: 0.6, rating: 4.6 },
  { name: 'Faisal N.', skill: 'General',     distance: 1.1, rating: 4.7 },
  { name: 'Omar T.',   skill: 'General',     distance: 0.9, rating: 4.2 },
];

function computeSimResult(input: SimInput, settings: DispatchSettings): SimResult {
  // Determine mode
  let mode: DispatchMode = settings.globalMode;
  if (input.severity === 'critical') mode = 'manual';
  else if (input.ticketType === 'Fire Safety') mode = 'manual';
  else if (input.slaMinutes < 30) mode = 'manual';
  else if (input.timeOfDay === 'Off-Hours (22:00–06:00)' && (input.severity === 'low' || input.severity === 'medium')) mode = 'ai';

  // Find best tech (simple mock logic)
  const skillMap: Record<string, string> = {
    HVAC: 'HVAC', Plumbing: 'Plumbing', Electrical: 'Electrical',
    'Fire Safety': 'Electrical', General: 'General', Cleaning: 'General', 'Lift / Elevator': 'General',
  };
  const targetSkill = skillMap[input.ticketType] ?? 'General';
  const sorted = [...TECHS].sort((a, b) => {
    const scoreA = (a.skill === targetSkill ? 40 : 0) + (1 / (a.distance + 0.1)) * 30 + a.rating * 6;
    const scoreB = (b.skill === targetSkill ? 40 : 0) + (1 / (b.distance + 0.1)) * 30 + b.rating * 6;
    return scoreB - scoreA;
  });
  const top = sorted[0];
  const score = Math.min(99, Math.round((top.skill === targetSkill ? 55 : 30) + (1 / (top.distance + 0.1)) * 25 + top.rating * 3));

  const supervisorRequired = mode === 'manual' || input.severity === 'critical';
  const escalationTriggered = input.severity === 'critical' || input.slaMinutes < 20;

  return {
    recommendedMode: mode,
    tech: top.name,
    score,
    reasonSummary: `${top.skill === targetSkill ? 'Skill match' : 'Best available'} · ${top.distance} km away · Rating ${top.rating} · ETA ~${Math.round(top.distance * 7 + 3)} min`,
    supervisorRequired,
    escalationTriggered,
  };
}

function SectionPreview({ settings, onToast }: { settings: DispatchSettings; onToast: ToastFn }) {
  const [input, setInput] = useState<SimInput>({
    ticketType: 'HVAC',
    severity: 'critical',
    site: 'Silicon Oasis',
    asset: 'Chiller / AHU',
    timeOfDay: 'Business Hours',
    slaMinutes: 45,
  });
  const [result, setResult] = useState<SimResult | null>(null);

  const runSim = () => {
    const r = computeSimResult(input, settings);
    setResult(r);
    onToast('Simulation complete', 'success');
  };

  const modeCfg = result ? MODE_CFG[result.recommendedMode] : null;

  return (
    <div className="space-y-5">
      <SectionTitle title="Preview & Simulation" subtitle="Run a mock dispatch simulation against the current rules to preview AI decision output" />

      <Card>
        <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-4">Simulation Inputs</div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {([
            { label: 'Ticket Type',  key: 'ticketType',  options: TICKET_TYPES },
            { label: 'Severity',     key: 'severity',    options: SEVERITIES   },
            { label: 'Site',         key: 'site',        options: SITES        },
            { label: 'Asset',        key: 'asset',       options: ASSETS       },
            { label: 'Time of Day',  key: 'timeOfDay',   options: TIMES        },
          ] as const).map(f => (
            <div key={f.key}>
              <label className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1 block">{f.label}</label>
              <select
                value={(input as unknown as Record<string, string>)[f.key]}
                onChange={e => setInput(prev => ({ ...prev, [f.key]: e.target.value }))}
                className="w-full text-[11px] bg-[#0A1628] border border-[rgba(46,127,255,0.2)] rounded-lg px-2 py-1.5 text-[#EEF3FA] outline-none cursor-pointer"
              >
                {f.options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <div>
            <label className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1 block">SLA Remaining (min)</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={5}
                max={240}
                step={5}
                value={input.slaMinutes}
                onChange={e => setInput(prev => ({ ...prev, slaMinutes: Number(e.target.value) }))}
                className="flex-1 accent-[#2E7FFF]"
              />
              <span className="text-[11px] font-bold text-[#2E7FFF] w-10 text-right">{input.slaMinutes}m</span>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={runSim}
            className="flex items-center gap-2 px-4 py-2 bg-[#2E7FFF] text-white text-[11px] font-bold rounded-lg hover:bg-blue-500 transition-colors"
          >
            <Play size={12} /> Run Simulation
          </button>
        </div>
      </Card>

      <AnimatePresence>
        {result && modeCfg && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-3">Simulation Result</div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className={`p-3 rounded-xl border ${modeCfg.border} ${modeCfg.bg}`}>
                  <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1">Recommended Mode</div>
                  <div className={`flex items-center gap-1.5 text-[13px] font-bold ${modeCfg.color}`}>
                    {modeCfg.icon} {modeCfg.label}
                  </div>
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
              <div className="p-3 bg-[#0A1628] rounded-lg">
                <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1">Reason Summary</div>
                <div className="text-[11px] text-[#EEF3FA]">{result.reasonSummary}</div>
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
  { id: 'modes',      label: 'Dispatch Modes',          icon: <Zap size={14} /> },
  { id: 'match',      label: 'AI Top Match Logic',       icon: <Bot size={14} /> },
  { id: 'auto',       label: 'Auto-Assignment Rules',    icon: <Settings2 size={14} /> },
  { id: 'severity',   label: 'Severity & Ticket Rules',  icon: <AlertTriangle size={14} /> },
  { id: 'sla',        label: 'SLA Rules',                icon: <Clock size={14} /> },
  { id: 'escalation', label: 'Escalation Rules',         icon: <ShieldAlert size={14} /> },
  { id: 'eligibility',label: 'Vendor Eligibility',       icon: <Users size={14} /> },
  { id: 'preview',    label: 'Preview & Testing',        icon: <FlaskConical size={14} /> },
];

export function DispatchAIRules({ onToast }: Props) {
  const [settings, setSettings]   = useState<DispatchSettings>(initialDispatchSettings);
  const [activeSection, setActive] = useState('modes');

  const renderSection = () => {
    switch (activeSection) {
      case 'modes':       return <SectionDispatchModes     settings={settings} setSettings={setSettings} onToast={onToast} />;
      case 'match':       return <SectionMatchLogic        settings={settings} setSettings={setSettings} onToast={onToast} />;
      case 'auto':        return <SectionAutoRules         settings={settings} setSettings={setSettings} onToast={onToast} />;
      case 'severity':    return <SectionSeverityRules     settings={settings} setSettings={setSettings} onToast={onToast} />;
      case 'sla':         return <SectionSLARules          settings={settings} setSettings={setSettings} onToast={onToast} />;
      case 'escalation':  return <SectionEscalationRules   settings={settings} setSettings={setSettings} onToast={onToast} />;
      case 'eligibility': return <SectionEligibility       settings={settings} onToast={onToast} />;
      case 'preview':     return <SectionPreview           settings={settings} onToast={onToast} />;
      default:            return null;
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Page header */}
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

      {/* 2-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left nav */}
        <div className="w-52 flex-shrink-0 border-r border-[rgba(46,127,255,0.15)] py-3 flex flex-col gap-0.5 overflow-y-auto custom-scrollbar bg-[#0A1628]">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={`flex items-center gap-2.5 px-4 py-2.5 text-left text-[12px] font-medium transition-all border-r-2 ${
                activeSection === s.id
                  ? 'text-[#EEF3FA] bg-[rgba(46,127,255,0.1)] border-[#2E7FFF]'
                  : 'text-[#7A94B4] border-transparent hover:text-[#EEF3FA] hover:bg-white/[0.02]'
              }`}
            >
              <span className={activeSection === s.id ? 'text-[#2E7FFF]' : 'text-[#7A94B4]'}>{s.icon}</span>
              {s.label}
              {activeSection === s.id && <ChevronRight size={11} className="ml-auto text-[#2E7FFF]" />}
            </button>
          ))}
        </div>

        {/* Right content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
            >
              {renderSection()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
