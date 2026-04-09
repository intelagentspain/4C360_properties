import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Brain, CheckCircle } from 'lucide-react';
import { mockPPMRisks } from '@/data/mockData';
import { ConfirmModal } from '@/components/shared/ConfirmModal';

interface Props {
  onToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

const riskColors: Record<string, string> = {
  critical: 'text-red-400 bg-red-500/20 border-red-500/40',
  high: 'text-amber-400 bg-amber-500/20 border-amber-500/40',
  medium: 'text-blue-300 bg-blue-500/20 border-blue-500/40',
};

const dayChipColor = (days: number) => {
  if (days <= 2) return 'bg-red-500/20 text-red-400 border-red-500/40';
  if (days <= 8) return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
  return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
};

export function PPMRiskPanel({ onToast }: Props) {
  const [created, setCreated] = useState<Record<string, boolean>>({});
  const [confirmItem, setConfirmItem] = useState<string | null>(null);

  const handleCreate = (id: string) => {
    setCreated(prev => ({ ...prev, [id]: true }));
    const risk = mockPPMRisks.find(r => r.id === id);
    if (risk) {
      const techs = ['Sara M.', 'Ahmed K.', 'Faisal N.'];
      const tech = techs[Math.floor(Math.random() * techs.length)];
      onToast(`PPM Task #SI-${id}-441 created · Assigned to ${tech}`, 'success');
    }
    setConfirmItem(null);
  };

  const confirmRisk = mockPPMRisks.find(r => r.id === confirmItem);

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[#EEF3FA] text-xs font-semibold uppercase tracking-wide" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Upcoming PPM Risks
        </h3>
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30">
          <Brain size={10} /> PREDICTIVE AI
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {mockPPMRisks.map(risk => (
          <motion.div
            key={risk.id}
            className={`rounded-lg border p-3 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 ${
              created[risk.id]
                ? 'bg-emerald-500/10 border-emerald-500/40'
                : 'bg-[rgba(17,32,64,0.85)] border-[rgba(46,127,255,0.22)]'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="text-[12px] text-[#EEF3FA] font-medium leading-snug flex-1">{risk.asset}</div>
              <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${dayChipColor(risk.daysUntilDue)}`}>
                {risk.daysUntilDue}d
              </span>
            </div>
            <div className="text-[11px] text-[#7A94B4] mb-1">{risk.type}</div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${riskColors[risk.riskLevel]}`}>
                  {risk.riskLevel}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-[#7A94B4]">
                  <Clock size={10} /> Last: {risk.lastDone}d ago
                </span>
              </div>
              {created[risk.id] ? (
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                  <CheckCircle size={12} /> Task Created
                </span>
              ) : (
                <button
                  onClick={() => setConfirmItem(risk.id)}
                  className="text-[11px] text-[#2E7FFF] hover:text-blue-400 font-semibold transition-colors"
                >
                  → Create PPM Task
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <ConfirmModal
        open={!!confirmItem}
        title="Create PPM Task"
        onConfirm={() => confirmItem && handleCreate(confirmItem)}
        onCancel={() => setConfirmItem(null)}
        confirmLabel="Create Task"
      >
        {confirmRisk && (
          <div className="space-y-2">
            <div className="text-[#EEF3FA] text-sm font-medium">{confirmRisk.asset}</div>
            <p>AI will assign based on skill + availability.</p>
          </div>
        )}
      </ConfirmModal>
    </div>
  );
}
