import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, MapPin, Wrench, User, Camera, Upload, CheckCircle, AlertTriangle, FileImage } from 'lucide-react';
import { mockKanbanTasks } from '@/data/mockData';

type Task = typeof mockKanbanTasks[0];

const priorityColor: Record<string, string> = {
  critical: 'text-red-400 bg-red-500/20 border-red-500/40',
  high: 'text-orange-400 bg-orange-500/20 border-orange-500/40',
  medium: 'text-amber-400 bg-amber-500/20 border-amber-500/40',
  low: 'text-[#7A94B4] bg-white/5 border-white/10',
};

const statusColor: Record<string, string> = {
  new: 'text-[#7A94B4]',
  assigned: 'text-blue-400',
  'in-progress': 'text-cyan-400',
  'awaiting-evidence': 'text-amber-400',
  closed: 'text-emerald-400',
  overdue: 'text-red-400',
};

interface Props {
  task: Task | null;
  onClose: () => void;
  onToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export function TaskDetailSheet({ task, onClose, onToast }: Props) {
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!task) return null;

  const slaLeft = task.slaMinutes - task.elapsed;
  const slaPercent = Math.min(100, (task.elapsed / task.slaMinutes) * 100);
  const slaOverdue = slaLeft <= 0;
  const slaCritical = slaLeft <= 10 && !slaOverdue;
  const slaColor = slaOverdue ? '#FF4B4B' : slaCritical ? '#FF9B38' : '#38D98A';

  const handleUpload = () => {
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      const name = `evidence_${Date.now()}.jpg`;
      setUploadedFiles(f => [...f, name]);
      onToast('Evidence photo uploaded', 'success');
    }, 1400);
  };

  const allEvidence = [...task.evidence, ...uploadedFiles];

  return (
    <AnimatePresence>
      {task && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 z-[600]"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
            className="absolute bottom-0 left-0 right-0 z-[700] bg-[#0D1E3A] rounded-t-2xl overflow-hidden max-h-[85%] flex flex-col"
          >
            <div className="w-10 h-1 bg-[rgba(46,127,255,0.3)] rounded-full mx-auto mt-3 mb-3 flex-shrink-0" />

            <div className="flex items-start justify-between px-4 pb-3 border-b border-[rgba(46,127,255,0.15)] flex-shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border capitalize ${priorityColor[task.priority]}`}>
                    {task.priority}
                  </span>
                  <span className="text-[10px] text-[#7A94B4] font-mono">{task.id}</span>
                </div>
                <h3 className="text-[#EEF3FA] font-bold text-sm leading-tight">{task.title}</h3>
              </div>
              <button onClick={onClose} className="text-[#7A94B4] hover:text-white transition-colors ml-2 mt-0.5"><X size={16} /></button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pt-3 pb-4 space-y-4">
              <div className="bg-[#112040] rounded-xl p-3 border border-[rgba(46,127,255,0.15)]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} className="text-[#7A94B4]" />
                    <span className="text-[10px] text-[#7A94B4] uppercase tracking-wide">SLA Status</span>
                  </div>
                  <span className="text-[12px] font-bold font-mono" style={{ color: slaColor }}>
                    {slaOverdue ? `⚠ OVERDUE ${Math.abs(slaLeft)}min` : `${slaLeft} min remaining`}
                  </span>
                </div>
                <div className="h-1.5 bg-[#0A1628] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${slaPercent}%` }}
                    transition={{ duration: 0.6 }}
                    className="h-full rounded-full"
                    style={{ background: slaColor }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[9px] text-[#7A94B4]">Elapsed: {task.elapsed} min</span>
                  <span className="text-[9px] text-[#7A94B4]">SLA Window: {task.slaMinutes} min</span>
                </div>
              </div>

              <div className="space-y-2">
                {[
                  { icon: <MapPin size={11} />, label: 'Location', value: task.location },
                  { icon: <Wrench size={11} />, label: 'Asset', value: task.asset },
                  { icon: <User size={11} />, label: 'Assigned To', value: task.tech || 'Unassigned' },
                  { icon: <Clock size={11} />, label: 'Reported By', value: task.reportedBy },
                ].map(row => (
                  <div key={row.label} className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-md bg-[#112040] border border-[rgba(46,127,255,0.15)] flex items-center justify-center text-[#2E7FFF] flex-shrink-0">
                      {row.icon}
                    </div>
                    <div className="flex-1 flex items-center justify-between">
                      <span className="text-[10px] text-[#7A94B4]">{row.label}</span>
                      <span className={`text-[11px] font-medium ${row.value === 'Unassigned' ? 'text-[#7A94B4] italic' : 'text-[#EEF3FA]'}`}>{row.value}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Camera size={11} className="text-[#7A94B4]" />
                    <span className="text-[10px] text-[#7A94B4] uppercase tracking-wide">Evidence</span>
                  </div>
                  {task.status === 'awaiting-evidence' && (
                    <span className="text-[9px] text-amber-400 flex items-center gap-1"><AlertTriangle size={9} /> Required</span>
                  )}
                </div>

                {allEvidence.length > 0 ? (
                  <div className="space-y-1.5 mb-2">
                    {allEvidence.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 bg-[#112040] rounded-lg px-2.5 py-2 border border-emerald-500/20">
                        <FileImage size={11} className="text-emerald-400" />
                        <span className="text-[11px] text-[#EEF3FA] flex-1 truncate">{f}</span>
                        <CheckCircle size={11} className="text-emerald-400 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mb-2 py-3 bg-[#112040] rounded-xl border border-dashed border-[rgba(46,127,255,0.2)] flex flex-col items-center gap-1">
                    <Upload size={16} className="text-[#7A94B4]" />
                    <span className="text-[10px] text-[#7A94B4]">No evidence uploaded yet</span>
                  </div>
                )}

                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={() => handleUpload()} />
                <button
                  onClick={() => { fileRef.current?.click(); handleUpload(); }}
                  disabled={uploading}
                  className="w-full py-2 flex items-center justify-center gap-1.5 border border-[rgba(46,127,255,0.3)] text-[#7A94B4] text-[11px] rounded-xl hover:bg-white/5 transition-colors disabled:opacity-60"
                >
                  {uploading ? (
                    <><div className="w-3 h-3 border border-[#7A94B4] border-t-white rounded-full animate-spin" /> Uploading…</>
                  ) : (
                    <><Camera size={12} /> Upload Evidence Photo</>
                  )}
                </button>
              </div>

              <div className="flex gap-2">
                {task.status !== 'closed' && task.status !== 'overdue' && (
                  <button
                    onClick={() => { onToast(`Task ${task.id} marked complete`, 'success'); onClose(); }}
                    className="flex-1 py-2.5 bg-emerald-500 text-white text-[11px] font-bold rounded-xl hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle size={13} /> Mark Complete
                  </button>
                )}
                {(task.status === 'new' || task.status === 'overdue') && (
                  <button
                    onClick={() => { onToast(`Escalating task ${task.id}`, 'warning'); onClose(); }}
                    className="flex-1 py-2.5 border border-red-500/40 text-red-400 text-[11px] font-semibold rounded-xl hover:bg-red-500/10 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <AlertTriangle size={13} /> Escalate
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
