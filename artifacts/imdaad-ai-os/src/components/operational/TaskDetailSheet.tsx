import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, MapPin, Wrench, User, Camera, Upload, CheckCircle, AlertTriangle, FileImage, Play, Shield, FileCheck } from 'lucide-react';
import { mockKanbanTasks } from '@/data/mockData';
import { SEVERITY_BADGE, TASK_STATUS_COLOR, slaStatus, type ToastFn } from '@/lib/ui';
import { AnimatedBar } from '@/components/shared/AnimatedBar';
import { api } from '@/lib/api';
import { useIncidents, type ResolveIncidentInput } from '@/context/IncidentContext';
import { CURRENT_USER } from '@/lib/currentUser';

type Task = typeof mockKanbanTasks[0];

interface EvidenceFile {
  id: string;
  url: string;
  filename: string;
}

interface Props {
  task: Task | null;
  onClose: () => void;
  onToast: ToastFn;
  onStatusChange?: (taskId: string, newStatus: string) => void;
}

const STATUS_TRANSITIONS: Record<string, { label: string; nextStatus: string; color: string; icon: React.ComponentType<{ size?: number; className?: string }> }[]> = {
  new:               [{ label: 'Start Job', nextStatus: 'in-progress', color: 'bg-blue-500 text-white hover:bg-blue-600', icon: Play }],
  assigned:          [{ label: 'Mark In Progress', nextStatus: 'in-progress', color: 'bg-blue-500 text-white hover:bg-blue-600', icon: Play }],
  'in-progress':     [{ label: 'Ready for Evidence', nextStatus: 'awaiting-evidence', color: 'bg-amber-500 text-white hover:bg-amber-600', icon: Camera }],
  'awaiting-evidence': [],
  closed:            [],
  overdue:           [{ label: 'Start Job', nextStatus: 'in-progress', color: 'bg-blue-500 text-white hover:bg-blue-600', icon: Play }],
};

export function TaskDetailSheet({ task, onClose, onToast, onStatusChange }: Props) {
  const [uploadedEvidence, setUploadedEvidence] = useState<EvidenceFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [resolveMode, setResolveMode] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [afterUrl, setAfterUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { resolveIncident, incidents } = useIncidents();

  useEffect(() => {
    if (!task) return;
    setCurrentStatus(task.status);
    setUploadedEvidence([]);
    setResolveMode(false);
    setResolutionNotes('');
    setAfterUrl('');

    api.workOrders.getEvidence(task.id)
      .then(rows => {
        const parsed: EvidenceFile[] = rows.map(r => ({
          id: String(r['id'] ?? ''),
          url: String(r['url'] ?? ''),
          filename: String(r['filename'] ?? ''),
        }));
        setUploadedEvidence(parsed);
      })
      .catch(() => {});
  }, [task?.id]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !task) return;

    setUploading(true);
    try {
      const result = await api.workOrders.uploadEvidence(task.id, file);
      const newEvidence: EvidenceFile = {
        id: String(result['id'] ?? ''),
        url: String(result['url'] ?? ''),
        filename: String(result['filename'] ?? file.name),
      };
      setUploadedEvidence(prev => [...prev, newEvidence]);
      onToast('Evidence photo uploaded', 'success');

      if (currentStatus === 'in-progress') {
        setCurrentStatus('awaiting-evidence');
        onStatusChange?.(task.id, 'awaiting-evidence');
        api.workOrders.update(task.id, { status: 'awaiting-evidence' }).catch(() => {});
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      onToast(msg, 'error');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }, [task, currentStatus, onStatusChange, onToast]);

  const handleStatusTransition = useCallback(async (nextStatus: string) => {
    if (!task) return;
    setStatusLoading(true);
    try {
      await api.workOrders.update(task.id, { status: nextStatus });
      setCurrentStatus(nextStatus);
      onStatusChange?.(task.id, nextStatus);
      const statusLabel = nextStatus.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      onToast(`Work order ${task.id} moved to ${statusLabel}`, 'success');
    } catch {
      onToast('Failed to update status', 'error');
    } finally {
      setStatusLoading(false);
    }
  }, [task, onStatusChange, onToast]);

  const handleSubmitResolution = async () => {
    if (!resolutionNotes.trim() || !task) return;
    const allUrls = [
      ...task.evidence.map(f => f),
      ...uploadedEvidence.map(e => e.url),
    ].filter(Boolean);
    if (allUrls.length === 0) {
      onToast('A before photo (evidence upload) is required to submit resolution', 'error');
      return;
    }
    if (!afterUrl.trim()) {
      onToast('An after photo URL is required to submit resolution', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const data: ResolveIncidentInput = {
        resolvedBy: CURRENT_USER.name,
        resolutionNotes: resolutionNotes.trim(),
        afterPhotoUrl: afterUrl.trim() || undefined,
        beforePhotoUrl: allUrls.length > 0 ? allUrls[0] : undefined,
      };
      if (linkedIncident) {
        await resolveIncident(linkedIncident.id, data);
        onToast(`Work order resolved — supervisor/AM notified for confirmation`, 'success');
      } else {
        await api.workOrders.update(task.id, { status: 'closed' });
        onStatusChange?.(task.id, 'closed');
        onToast(`Task ${task.id} marked complete`, 'success');
      }
      onClose();
    } catch {
      onToast('Failed to submit resolution', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!task) return null;

  const sla = slaStatus(task.elapsed, task.slaMinutes);
  const status = currentStatus || task.status;
  const allEvidence = [
    ...task.evidence.map((f, i) => ({ id: `mock-${i}`, url: f, filename: f })),
    ...uploadedEvidence,
  ];
  const transitions = STATUS_TRANSITIONS[status] ?? [];

  const linkedIncident = (task as unknown as Record<string, unknown>)['incidentId']
    ? incidents.find(i => i.id === (task as unknown as Record<string, unknown>)['incidentId'])
    : null;

  const showResolveButton = (status === 'awaiting-evidence' || status === 'in-progress') && !resolveMode;

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
            className="absolute bottom-0 left-0 right-0 z-[700] bg-[#0D1E3A] rounded-t-2xl overflow-hidden max-h-[90%] flex flex-col"
          >
            <div className="w-10 h-1 bg-[rgba(46,127,255,0.3)] rounded-full mx-auto mt-3 mb-3 flex-shrink-0" />

            <div className="flex items-start justify-between px-4 pb-3 border-b border-[rgba(46,127,255,0.15)] flex-shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border capitalize ${SEVERITY_BADGE[task.priority]}`}>
                    {task.priority}
                  </span>
                  <span className="text-[10px] text-[#7A94B4] font-mono">{task.id}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${TASK_STATUS_COLOR[status] ?? 'text-[#7A94B4] border-[rgba(46,127,255,0.2)]'}`}>
                    {status.replace(/-/g, ' ').toUpperCase()}
                  </span>
                  {linkedIncident && (
                    <span className="text-[9px] text-blue-400 bg-blue-500/10 border border-blue-500/25 px-1.5 py-0.5 rounded font-semibold">
                      INC: {linkedIncident.id}
                    </span>
                  )}
                </div>
                <h3 className="text-[#EEF3FA] font-bold text-sm leading-tight">{task.title}</h3>
              </div>
              <button onClick={onClose} className="text-[#7A94B4] hover:text-white transition-colors ml-2 mt-0.5">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pt-3 pb-4 space-y-4">
              <div className="bg-[#112040] rounded-xl p-3 border border-[rgba(46,127,255,0.15)]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} className="text-[#7A94B4]" />
                    <span className="text-[10px] text-[#7A94B4] uppercase tracking-wide">SLA Status</span>
                  </div>
                  <span className="text-[12px] font-bold font-mono" style={{ color: sla.barColor }}>
                    {sla.overdue ? `⚠ ${sla.label}` : `${sla.left} min remaining`}
                  </span>
                </div>
                <AnimatedBar value={sla.percent} color={sla.barColor} />
                <div className="flex justify-between mt-1.5">
                  <span className="text-[9px] text-[#7A94B4]">Elapsed: {task.elapsed} min</span>
                  <span className="text-[9px] text-[#7A94B4]">SLA Window: {task.slaMinutes} min</span>
                </div>
              </div>

              <div className="space-y-2">
                {[
                  { icon: <MapPin size={11} />, label: 'Location',    value: task.location },
                  { icon: <Wrench size={11} />, label: 'Asset',       value: task.asset },
                  { icon: <User size={11} />,   label: 'Assigned To', value: task.tech || 'Unassigned' },
                  { icon: <Clock size={11} />,  label: 'Reported By', value: task.reportedBy },
                ].map(row => (
                  <div key={row.label} className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-md bg-[#112040] border border-[rgba(46,127,255,0.15)] flex items-center justify-center text-[#2E7FFF] flex-shrink-0">
                      {row.icon}
                    </div>
                    <div className="flex-1 flex items-center justify-between">
                      <span className="text-[10px] text-[#7A94B4]">{row.label}</span>
                      <span className={`text-[11px] font-medium ${row.value === 'Unassigned' ? 'text-[#7A94B4] italic' : 'text-[#EEF3FA]'}`}>
                        {row.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Camera size={11} className="text-[#7A94B4]" />
                    <span className="text-[10px] text-[#7A94B4] uppercase tracking-wide">Evidence Photos</span>
                  </div>
                  {(status === 'awaiting-evidence' || status === 'in-progress') && (
                    <span className="text-[9px] text-amber-400 flex items-center gap-1">
                      <AlertTriangle size={9} /> {allEvidence.length === 0 ? 'Required' : `${allEvidence.length} uploaded`}
                    </span>
                  )}
                </div>

                {allEvidence.length > 0 ? (
                  <div className="space-y-1.5 mb-2">
                    {allEvidence.map((f) => (
                      <div key={f.id} className="flex items-center gap-2 bg-[#112040] rounded-lg px-2.5 py-2 border border-emerald-500/20">
                        <FileImage size={11} className="text-emerald-400" />
                        <span className="text-[11px] text-[#EEF3FA] flex-1 truncate">{f.filename}</span>
                        {f.url && (
                          <a
                            href={f.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[9px] text-[#2E7FFF] hover:underline flex-shrink-0"
                          >
                            View
                          </a>
                        )}
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

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {status !== 'closed' && (
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="w-full py-2 flex items-center justify-center gap-1.5 border border-[rgba(46,127,255,0.3)] text-[#7A94B4] text-[11px] rounded-xl hover:bg-white/5 transition-colors disabled:opacity-60"
                  >
                    {uploading ? (
                      <><div className="w-3 h-3 border border-[#7A94B4] border-t-white rounded-full animate-spin" /> Uploading…</>
                    ) : (
                      <><Camera size={12} /> Upload Evidence Photo</>
                    )}
                  </button>
                )}
              </div>

              {transitions.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Shield size={11} className="text-[#7A94B4]" />
                    <span className="text-[10px] text-[#7A94B4] uppercase tracking-wide">Actions</span>
                  </div>
                  {transitions.map(t => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.nextStatus}
                        onClick={() => handleStatusTransition(t.nextStatus)}
                        disabled={statusLoading}
                        className={`w-full py-2.5 rounded-xl text-[11px] font-bold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60 ${t.color}`}
                      >
                        {statusLoading ? (
                          <div className="w-3 h-3 border border-current/30 border-t-current rounded-full animate-spin" />
                        ) : (
                          <Icon size={13} />
                        )}
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {resolveMode ? (
                <div className="space-y-3 p-3 bg-emerald-500/5 border border-emerald-500/25 rounded-xl">
                  <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5">
                    <FileCheck size={12} /> Submit Resolution
                  </div>
                  <div>
                    <label className="block text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1">Resolution Notes *</label>
                    <textarea
                      value={resolutionNotes}
                      onChange={e => setResolutionNotes(e.target.value)}
                      placeholder="Describe what was done to resolve this work order…"
                      rows={3}
                      className="w-full bg-[#112040] border border-emerald-500/30 rounded-lg px-3 py-2 text-[12px] text-[#EEF3FA] placeholder-[#7A94B4]/50 outline-none focus:border-emerald-400 transition-colors resize-none"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-[#7A94B4] uppercase tracking-wide mb-1">
                      After Photo URL <span className="text-red-400">*</span>
                    </label>
                    <input
                      value={afterUrl}
                      onChange={e => setAfterUrl(e.target.value)}
                      placeholder="https://…"
                      className={`w-full bg-[#112040] border rounded-lg px-3 py-2 text-[12px] text-[#EEF3FA] placeholder-[#7A94B4]/50 outline-none transition-colors ${afterUrl.trim() ? 'border-emerald-500/40 focus:border-emerald-400' : 'border-red-500/40 focus:border-red-400'}`}
                    />
                  </div>
                  {(allEvidence.length === 0 || !afterUrl.trim()) && (
                    <div className="flex items-center gap-1.5 px-2.5 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <AlertTriangle size={11} className="text-red-400 flex-shrink-0" />
                      <span className="text-[10px] text-red-400">
                        {allEvidence.length === 0 && !afterUrl.trim()
                          ? 'Upload a before photo and provide an after photo URL'
                          : allEvidence.length === 0
                          ? 'Upload at least one before photo (evidence) to proceed'
                          : 'After photo URL is required to submit resolution'}
                      </span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setResolveMode(false)}
                      className="flex-1 py-2 rounded-lg border border-[rgba(46,127,255,0.2)] text-[11px] text-[#7A94B4] hover:text-[#EEF3FA] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitResolution}
                      disabled={!resolutionNotes.trim() || submitting || allEvidence.length === 0 || !afterUrl.trim()}
                      className="flex-1 py-2 rounded-lg bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <><div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" /> Submitting…</>
                      ) : (
                        <><FileCheck size={12} /> Submit</>
                      )}
                    </button>
                  </div>
                </div>
              ) : showResolveButton ? (
                <button
                  onClick={() => setResolveMode(true)}
                  className="w-full py-2.5 bg-emerald-500 text-white text-[11px] font-bold rounded-xl hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1.5"
                >
                  <FileCheck size={13} /> {linkedIncident ? 'Submit Resolution' : 'Mark Resolved'}
                </button>
              ) : null}

              {status === 'closed' && (
                <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl">
                  <CheckCircle size={14} className="text-emerald-400" />
                  <div>
                    <div className="text-[11px] text-emerald-400 font-bold">Work Order Resolved</div>
                    <div className="text-[10px] text-[#7A94B4]">{allEvidence.length} evidence file{allEvidence.length !== 1 ? 's' : ''} attached. Pending supervisor review.</div>
                  </div>
                </div>
              )}

              {status === 'overdue' && (
                <button
                  onClick={() => { onToast(`Escalating task ${task.id}`, 'warning'); onClose(); }}
                  className="w-full py-2.5 border border-red-500/40 text-red-400 text-[11px] font-semibold rounded-xl hover:bg-red-500/10 transition-colors flex items-center justify-center gap-1.5"
                >
                  <AlertTriangle size={13} /> Escalate to Supervisor
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
