import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, CheckCircle, MapPin, Clock } from 'lucide-react';
import { mockDispatchJobs } from '@/data/mockData';
import { StatusBadge } from '@/components/shared/StatusBadge';

interface Props {
  onToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export function DispatchQueue({ onToast }: Props) {
  const [assigned, setAssigned] = useState<Record<string, boolean>>({});

  const handleAssign = (id: string, tech: string) => {
    setAssigned(prev => ({ ...prev, [id]: true }));
    onToast(`Job dispatched to ${tech} — ETA 12 min`, 'success');
  };

  const formatSLA = (mins: number) => {
    if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}min remaining`;
    return `${mins} min remaining`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[#EEF3FA] text-xs font-semibold uppercase tracking-wide" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          AI-Suggested Dispatch
        </h3>
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-bold border border-cyan-500/30">
          <Bot size={10} /> AI ENGINE
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {mockDispatchJobs.map(job => (
          <motion.div
            key={job.id}
            className={`rounded-lg border p-3 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 ${
              assigned[job.id]
                ? 'bg-emerald-500/10 border-emerald-500/40'
                : 'bg-[rgba(17,32,64,0.85)] border-[rgba(46,127,255,0.22)]'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="text-[12px] text-[#EEF3FA] font-medium leading-snug flex-1">{job.title}</div>
              <StatusBadge severity={job.severity} />
            </div>
            <div className="flex items-center gap-3 text-[10px] text-[#7A94B4] mb-2">
              <span className="flex items-center gap-1"><Clock size={10} />{job.minutesAgo} min ago</span>
              <span className="flex items-center gap-1"><MapPin size={10} />Silicon Oasis</span>
              <span className={job.slaRemaining < 30 ? 'text-red-400' : 'text-amber-400'}>
                SLA: {formatSLA(job.slaRemaining)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#0A1628] rounded-lg px-2 py-1.5 mb-2">
              <Bot size={11} className="text-cyan-400 flex-shrink-0" />
              <span className="text-[11px] text-[#7A94B4]">
                <span className="text-[#EEF3FA] font-medium">{job.aiMatch.tech}</span>
                {' · '}{job.aiMatch.distance}{' · '}{job.aiMatch.reason}
              </span>
            </div>
            {assigned[job.id] ? (
              <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-semibold">
                <CheckCircle size={12} />
                Assigned · {job.aiMatch.tech} notified on app · GPS tracking active
              </div>
            ) : (
              <button
                onClick={() => handleAssign(job.id, job.aiMatch.tech)}
                className="w-full py-1.5 rounded-lg bg-[#2E7FFF] text-white text-[11px] font-semibold hover:bg-blue-500 transition-all duration-150 active:scale-95"
              >
                Assign to {job.aiMatch.tech}
              </button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
