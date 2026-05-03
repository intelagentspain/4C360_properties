import { useState } from 'react';
import { Plus, X, Zap } from 'lucide-react';
import type { ToastFn } from '@/lib/ui';

interface Props {
  onToast: ToastFn;
}

interface Rule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  type: 'escalation' | 'sla' | 'notification' | 'assignment';
}

const RULE_TYPES: Rule['type'][] = ['escalation', 'sla', 'notification', 'assignment'];

const TYPE_COLORS: Record<Rule['type'], string> = {
  escalation: 'text-red-400 bg-red-400/10 border-red-400/30',
  sla: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  notification: 'text-[#2E7FFF] bg-[#2E7FFF]/10 border-[#2E7FFF]/30',
  assignment: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
};

const MOCK_RULES: Rule[] = [
  {
    id: 'RUL-001',
    name: 'Critical Ticket Escalation',
    trigger: 'Ticket severity = Critical AND unassigned > 5 min',
    action: 'Escalate to On-Call Supervisor + notify Operations Manager',
    type: 'escalation',
  },
  {
    id: 'RUL-002',
    name: 'SLA Breach Warning',
    trigger: 'SLA remaining < 30 min AND ticket still open',
    action: 'Send alert to assigned inspector and supervisor',
    type: 'sla',
  },
  {
    id: 'RUL-003',
    name: 'After-Hours Assignment',
    trigger: 'Ticket created between 22:00–06:00',
    action: 'Auto-assign to on-call inspector roster',
    type: 'assignment',
  },
  {
    id: 'RUL-004',
    name: 'Client Notification on Completion',
    trigger: 'Work order status = Completed',
    action: 'Send completion report to client contact via email',
    type: 'notification',
  },
  {
    id: 'RUL-005',
    name: 'High Priority Reassignment',
    trigger: 'Inspector unavailable AND ticket priority = High',
    action: 'Auto-reassign to next best available inspector',
    type: 'assignment',
  },
];

const TRIGGER_SUGGESTIONS = [
  'Ticket severity = Critical',
  'SLA remaining < 30 min',
  'Ticket unassigned > 15 min',
  'Work order status = Completed',
  'Ticket created between 22:00–06:00',
  'Client type = VIP',
];

const ACTION_SUGGESTIONS = [
  'Escalate to On-Call Supervisor',
  'Notify Operations Manager',
  'Auto-assign to nearest inspector',
  'Send email to client contact',
  'Create follow-up ticket',
  'Override dispatch mode to Manual',
];

const EMPTY_FORM = { name: '', trigger: '', action: '', type: 'escalation' as Rule['type'] };

function ModalOverlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0D1E38] border border-[rgba(46,127,255,0.25)] rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
        {children}
      </div>
    </div>
  );
}

export function RulesSettings({ onToast }: Props) {
  const [rules, setRules] = useState<Rule[]>(MOCK_RULES);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const handleAdd = () => {
    if (!form.name.trim()) {
      onToast('Rule name is required', 'error');
      return;
    }
    if (!form.trigger.trim()) {
      onToast('Trigger condition is required', 'error');
      return;
    }
    if (!form.action.trim()) {
      onToast('Action is required', 'error');
      return;
    }
    const newRule: Rule = {
      id: `RUL-${String(rules.length + 1).padStart(3, '0')}`,
      name: form.name.trim(),
      trigger: form.trigger.trim(),
      action: form.action.trim(),
      type: form.type,
    };
    setRules(prev => [newRule, ...prev]);
    onToast('Rule added successfully', 'success');
    setShowModal(false);
    setForm(EMPTY_FORM);
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar px-6 py-6">
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-[#EEF3FA] font-bold text-sm mb-0.5" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Rules</h3>
            <p className="text-[11px] text-[#7A94B4]">Define operational rules for escalation, SLA enforcement, notifications, and assignments.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 text-[11px] bg-[#2E7FFF] text-white px-3 py-1.5 rounded-lg hover:bg-blue-500 transition-colors flex-shrink-0"
          >
            <Plus size={12} /> Add Rule
          </button>
        </div>

        <div className="bg-[rgba(17,32,64,0.85)] border border-[rgba(46,127,255,0.2)] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] min-w-[640px]">
              <thead>
                <tr className="border-b border-[rgba(46,127,255,0.12)]">
                  {['Rule Name', 'Type', 'Trigger Condition', 'Action'].map(h => (
                    <th key={h} className="text-[9px] text-[#7A94B4] uppercase tracking-wide px-4 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rules.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-[#7A94B4] text-[11px]">No rules defined.</td>
                  </tr>
                )}
                {rules.map(rule => (
                  <tr key={rule.id} className="border-b border-[rgba(46,127,255,0.06)] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Zap size={10} className="text-[#7A94B4] flex-shrink-0" />
                        <div>
                          <div className="text-[#EEF3FA] font-medium">{rule.name}</div>
                          <div className="text-[9px] text-[#7A94B4] font-mono mt-0.5">{rule.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${TYPE_COLORS[rule.type]}`}>
                        {rule.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#7A94B4] max-w-[220px]">
                      <span className="font-mono text-[10px] leading-snug">{rule.trigger}</span>
                    </td>
                    <td className="px-4 py-3 text-[#7A94B4] max-w-[220px]">
                      <span className="text-[11px] leading-snug">{rule.action}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <ModalOverlay onClose={() => { setShowModal(false); setForm(EMPTY_FORM); }}>
          <button
            onClick={() => { setShowModal(false); setForm(EMPTY_FORM); }}
            className="absolute top-4 right-4 text-[#7A94B4] hover:text-[#EEF3FA] transition-colors"
          >
            <X size={16} />
          </button>
          <h4 className="text-[#EEF3FA] font-bold text-sm mb-5" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Add Rule</h4>
          <div className="space-y-4">
            <div>
              <label className="text-[9px] text-[#7A94B4] uppercase tracking-wide block mb-1">Rule Name</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. High Priority Escalation"
                className="w-full px-3 py-2 text-[12px] bg-[#0A1628] border border-[rgba(46,127,255,0.2)] rounded-lg text-[#EEF3FA] placeholder-[#7A94B4]/50 outline-none focus:border-[rgba(46,127,255,0.5)] transition-colors"
              />
            </div>
            <div>
              <label className="text-[9px] text-[#7A94B4] uppercase tracking-wide block mb-1">Rule Type</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as Rule['type'] }))}
                className="w-full px-3 py-2 text-[12px] bg-[#0A1628] border border-[rgba(46,127,255,0.2)] rounded-lg text-[#EEF3FA] outline-none cursor-pointer focus:border-[rgba(46,127,255,0.5)] transition-colors"
              >
                {RULE_TYPES.map(t => <option key={t} value={t} className="bg-[#0A1628] capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] text-[#7A94B4] uppercase tracking-wide block mb-1">Trigger Condition</label>
              <textarea
                value={form.trigger}
                onChange={e => setForm(f => ({ ...f, trigger: e.target.value }))}
                placeholder="e.g. Ticket severity = Critical AND unassigned > 5 min"
                rows={2}
                className="w-full px-3 py-2 text-[12px] bg-[#0A1628] border border-[rgba(46,127,255,0.2)] rounded-lg text-[#EEF3FA] placeholder-[#7A94B4]/50 outline-none focus:border-[rgba(46,127,255,0.5)] transition-colors resize-none font-mono"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {TRIGGER_SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => setForm(f => ({ ...f, trigger: s }))}
                    className="text-[9px] text-[#7A94B4] hover:text-[#2E7FFF] bg-white/[0.04] hover:bg-[#2E7FFF]/10 border border-white/10 hover:border-[#2E7FFF]/30 px-1.5 py-0.5 rounded transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[9px] text-[#7A94B4] uppercase tracking-wide block mb-1">Action</label>
              <textarea
                value={form.action}
                onChange={e => setForm(f => ({ ...f, action: e.target.value }))}
                placeholder="e.g. Escalate to On-Call Supervisor + notify Operations Manager"
                rows={2}
                className="w-full px-3 py-2 text-[12px] bg-[#0A1628] border border-[rgba(46,127,255,0.2)] rounded-lg text-[#EEF3FA] placeholder-[#7A94B4]/50 outline-none focus:border-[rgba(46,127,255,0.5)] transition-colors resize-none"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {ACTION_SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => setForm(f => ({ ...f, action: s }))}
                    className="text-[9px] text-[#7A94B4] hover:text-[#2E7FFF] bg-white/[0.04] hover:bg-[#2E7FFF]/10 border border-white/10 hover:border-[#2E7FFF]/30 px-1.5 py-0.5 rounded transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => { setShowModal(false); setForm(EMPTY_FORM); }}
              className="flex-1 text-[12px] font-medium text-[#7A94B4] border border-[rgba(46,127,255,0.2)] hover:border-[rgba(46,127,255,0.4)] bg-white/[0.03] hover:bg-white/[0.06] px-4 py-2.5 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              className="flex-1 text-[12px] font-bold text-white bg-[#2E7FFF] hover:bg-blue-500 px-4 py-2.5 rounded-xl transition-all"
            >
              Add Rule
            </button>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
