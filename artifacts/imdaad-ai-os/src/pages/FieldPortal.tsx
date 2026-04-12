import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { mockAssets, mockKBResources, mockIncidents, mockParts, mockChecklist, type KBResource, type KBCategory } from '@/data/mockData';
import {
  ClipboardList, BookOpen, MessageSquare, ChevronLeft, Search, Upload,
  Camera, CheckCircle, Clock, AlertTriangle, XCircle, MapPin, Wrench,
  User, Calendar, Send, ArrowRight, RefreshCw, X, ZoomIn,
  Play, FileText, Video, ListChecks, ChevronDown, ChevronUp,
  TriangleAlert, Lightbulb, Hammer, Brain, Mic,
} from 'lucide-react';
import { AssetExpertCopilot } from '@/components/shared/AssetExpertCopilot';

type WOStatus = 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed' | string;
type TabId = 'workorders' | 'knowledge' | 'comms';

interface WorkOrder {
  id: string;
  title: string;
  location?: string | null;
  priority?: string | null;
  asset?: string | null;
  skill?: string | null;
  status: WOStatus;
  assignedTo?: string | null;
  siteId?: string | null;
  incidentId?: string | null;
  description?: string | null;
  createdAt?: string | null;
}

interface ActivityEntry {
  id?: string;
  time?: string;
  event?: string;
  type?: string;
  author?: string;
  authorId?: string | null;
  postedAt?: string;
}

interface CommsMessage {
  id: string;
  author: string;
  role: string;
  text: string;
  time: string;
  type?: string;
}

function priorityColor(p: string) {
  switch ((p ?? '').toLowerCase()) {
    case 'critical': return '#EF4444';
    case 'high':     return '#F97316';
    case 'medium':   return '#F59E0B';
    default:         return '#10B981';
  }
}

function statusInfo(s: WOStatus): { label: string; color: string; icon: React.ReactNode } {
  const normalized = (s ?? '').toLowerCase().replace(/-/g, '_');
  switch (normalized) {
    case 'open':        return { label: 'Open',        color: '#F59E0B', icon: <Clock size={12} /> };
    case 'assigned':    return { label: 'Assigned',    color: '#2E7FFF', icon: <User size={12} /> };
    case 'in_progress': return { label: 'In Progress', color: '#A78BFA', icon: <Wrench size={12} /> };
    case 'resolved':    return { label: 'Resolved',    color: '#10B981', icon: <CheckCircle size={12} /> };
    case 'closed':      return { label: 'Closed',      color: '#7A94B4', icon: <XCircle size={12} /> };
    case 'new':         return { label: 'Open',        color: '#F59E0B', icon: <Clock size={12} /> };
    case 'overdue':     return { label: 'Overdue',     color: '#EF4444', icon: <AlertTriangle size={12} /> };
    default:            return { label: s,             color: '#7A94B4', icon: <Clock size={12} /> };
  }
}

function StatusBadge({ status }: { status: WOStatus }) {
  const { label, color, icon } = statusInfo(status);
  return (
    <span style={{ background: `${color}22`, border: `1px solid ${color}66`, color }}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold">
      {icon} {label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const c = priorityColor(priority);
  return (
    <span style={{ background: `${c}22`, border: `1px solid ${c}66`, color: c }}
      className="px-2 py-0.5 rounded-full text-xs font-bold uppercase">{priority || 'medium'}</span>
  );
}

function isoTimeAgo(ts?: string | null): string {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}


function activityToCommsMessage(entry: ActivityEntry, index: number): CommsMessage {
  const isFieldMsg = entry.type === 'field_message';
  const author = entry.author ?? (isFieldMsg ? 'Field Staff' : 'System');
  const role = isFieldMsg ? 'FM Engineer' : (entry.type === 'dispatch' ? 'Dispatch' : entry.type === 'ai' ? 'AI System' : 'System');
  const time = entry.time ?? (entry.postedAt ? new Date(entry.postedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '');
  return {
    id: entry.id ?? `msg-${index}`,
    author,
    role,
    text: entry.event ?? '',
    time,
    type: entry.type,
  };
}

export interface FieldPortalProps {
  initialWorkOrderId?: string;
}

function getInitialTab(initialWorkOrderId?: string): TabId {
  const hash = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';
  if (hash === 'comms') return 'comms';
  if (hash === 'knowledge') return 'knowledge';
  return 'workorders';
}

const API_BASE = (import.meta.env.VITE_API_URL ?? '/api') as string;

async function fetchWorkOrderMessages(workOrderId: string): Promise<CommsMessage[]> {
  const res = await fetch(`${API_BASE}/workorders/${encodeURIComponent(workOrderId)}/messages`);
  if (!res.ok) throw new Error(`Failed to fetch messages: ${res.status}`);
  const data = await res.json() as { messages: ActivityEntry[] };
  return (data.messages ?? []).map(activityToCommsMessage);
}

async function postWorkOrderMessage(workOrderId: string, text: string, author = 'Field Staff'): Promise<CommsMessage> {
  const res = await fetch(`${API_BASE}/workorders/${encodeURIComponent(workOrderId)}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, author }),
  });
  if (!res.ok) throw new Error(`Failed to post message: ${res.status}`);
  const entry = await res.json() as ActivityEntry;
  return activityToCommsMessage(entry, 0);
}

export function FieldPortal({ initialWorkOrderId }: FieldPortalProps) {
  const [tab, setTab] = useState<TabId>(() => getInitialTab(initialWorkOrderId));
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);
  const [assetSearch, setAssetSearch] = useState('');
  const [commsMessage, setCommsMessage] = useState('');
  const [commsList, setCommsList] = useState<CommsMessage[]>([]);
  const [commsLoading, setCommsLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [resolutionModal, setResolutionModal] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [beforePhoto, setBeforePhoto] = useState<string | null>(null);
  const [afterPhoto, setAfterPhoto] = useState<string | null>(null);
  const [beforePhotoFile, setBeforePhotoFile] = useState<File | null>(null);
  const [afterPhotoFile, setAfterPhotoFile] = useState<File | null>(null);
  const [resolutionSubmitting, setResolutionSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [expertOpen, setExpertOpen] = useState(false);
  const commsEndRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const loadWorkOrders = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    api.workOrders.list()
      .then(data => {
        const wos: WorkOrder[] = data.map(d => ({
          id: String(d['id'] ?? ''),
          title: String(d['title'] ?? ''),
          location: d['location'] != null ? String(d['location']) : null,
          priority: d['priority'] != null ? String(d['priority']) : null,
          asset: d['asset'] != null ? String(d['asset']) : null,
          skill: d['skill'] != null ? String(d['skill']) : null,
          status: String(d['status'] ?? 'open') as WOStatus,
          assignedTo: d['assignedTo'] != null ? String(d['assignedTo']) : null,
          siteId: d['siteId'] != null ? String(d['siteId']) : null,
          incidentId: d['incidentId'] != null ? String(d['incidentId']) : null,
          description: d['description'] != null ? String(d['description']) : null,
          createdAt: d['createdAt'] != null ? String(d['createdAt']) : null,
        }));
        setWorkOrders(wos);
        if (initialWorkOrderId) {
          const found = wos.find(w => w.id === initialWorkOrderId);
          if (found) {
            setSelectedWO(found);
          } else {
            api.workOrders.get(initialWorkOrderId).then(d => {
              const wo: WorkOrder = {
                id: String(d['id'] ?? ''), title: String(d['title'] ?? ''),
                location: d['location'] != null ? String(d['location']) : null,
                priority: d['priority'] != null ? String(d['priority']) : null,
                asset: d['asset'] != null ? String(d['asset']) : null,
                skill: d['skill'] != null ? String(d['skill']) : null,
                status: String(d['status'] ?? 'open') as WOStatus,
                assignedTo: d['assignedTo'] != null ? String(d['assignedTo']) : null,
                siteId: d['siteId'] != null ? String(d['siteId']) : null,
                incidentId: d['incidentId'] != null ? String(d['incidentId']) : null,
                description: d['description'] != null ? String(d['description']) : null,
                createdAt: d['createdAt'] != null ? String(d['createdAt']) : null,
              };
              setSelectedWO(wo);
              setWorkOrders(prev => prev.some(w => w.id === wo.id) ? prev : [wo, ...prev]);
            }).catch(() => { /* not found — leave list view */ });
          }
        }
      })
      .catch(() => {
        setLoadError('Unable to load work orders. Please check your connection and try again.');
        setWorkOrders([]);
        if (initialWorkOrderId) {
          api.workOrders.get(initialWorkOrderId).then(d => {
            const wo: WorkOrder = {
              id: String(d['id'] ?? ''), title: String(d['title'] ?? ''),
              location: d['location'] != null ? String(d['location']) : null,
              priority: d['priority'] != null ? String(d['priority']) : null,
              asset: d['asset'] != null ? String(d['asset']) : null,
              skill: d['skill'] != null ? String(d['skill']) : null,
              status: String(d['status'] ?? 'open') as WOStatus,
              assignedTo: d['assignedTo'] != null ? String(d['assignedTo']) : null,
              siteId: d['siteId'] != null ? String(d['siteId']) : null,
              incidentId: d['incidentId'] != null ? String(d['incidentId']) : null,
              description: d['description'] != null ? String(d['description']) : null,
              createdAt: d['createdAt'] != null ? String(d['createdAt']) : null,
            };
            setSelectedWO(wo);
            setWorkOrders([wo]);
            setLoadError(null);
          }).catch(() => { /* both failed */ });
        }
      })
      .finally(() => setLoading(false));
  }, [initialWorkOrderId]);

  useEffect(() => {
    loadWorkOrders();
  }, [loadWorkOrders]);

  const loadComms = useCallback((woId: string) => {
    setCommsLoading(true);
    fetchWorkOrderMessages(woId)
      .then(msgs => setCommsList(msgs))
      .catch(() => setCommsList([]))
      .finally(() => setCommsLoading(false));
  }, []);

  useEffect(() => {
    if (selectedWO) {
      loadComms(selectedWO.id);
    } else {
      setCommsList([]);
    }
  }, [selectedWO, loadComms]);

  useEffect(() => {
    commsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [commsList]);

  const handleStartWork = async (wo: WorkOrder) => {
    setStatusUpdating(true);
    try {
      await api.workOrders.update(wo.id, { status: 'in_progress' });
      const updated = { ...wo, status: 'in_progress' as WOStatus };
      setWorkOrders(wos => wos.map(w => w.id === wo.id ? updated : w));
      setSelectedWO(updated);
      try {
        const msg = await postWorkOrderMessage(wo.id, 'Started work on site. Job is In Progress.', 'Field Engineer');
        setCommsList(prev => [...prev, msg]);
      } catch { /* non-fatal */ }
      showToast('Status updated to In Progress', 'success');
    } catch {
      showToast('Failed to update status', 'error');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleResolveOpen = () => {
    setResolutionModal(true);
    setResolutionNotes('');
    setBeforePhoto(null);
    setAfterPhoto(null);
    setBeforePhotoFile(null);
    setAfterPhotoFile(null);
  };

  const handlePhotoSelect = (type: 'before' | 'after', file: File) => {
    const url = URL.createObjectURL(file);
    if (type === 'before') { setBeforePhoto(url); setBeforePhotoFile(file); }
    else { setAfterPhoto(url); setAfterPhotoFile(file); }
  };

  const handleSubmitResolution = async () => {
    if (!selectedWO) return;
    if (!resolutionNotes.trim()) { showToast('Please add resolution notes', 'error'); return; }
    if (!beforePhoto) { showToast('Before photo is required to resolve', 'error'); return; }
    if (!afterPhoto) { showToast('After photo is required to resolve', 'error'); return; }
    setResolutionSubmitting(true);
    try {
      let beforeUrl: string | undefined;
      let afterUrl: string | undefined;

      if (beforePhotoFile) {
        try {
          const r = await api.workOrders.uploadEvidence(selectedWO.id, beforePhotoFile, 'Field Engineer');
          beforeUrl = String(r['url'] ?? '');
        } catch {
          showToast('Before photo upload failed — please try again', 'error');
          return;
        }
      }
      if (!beforeUrl) {
        showToast('Before photo upload returned no URL — please try again', 'error');
        return;
      }

      if (afterPhotoFile) {
        try {
          const r = await api.workOrders.uploadEvidence(selectedWO.id, afterPhotoFile, 'Field Engineer');
          afterUrl = String(r['url'] ?? '');
        } catch {
          showToast('After photo upload failed — please try again', 'error');
          return;
        }
      }
      if (!afterUrl) {
        showToast('After photo upload returned no URL — please try again', 'error');
        return;
      }

      const incidentId = selectedWO.incidentId;
      if (incidentId) {
        const resolveRes = await fetch(`${API_BASE}/incidents/${encodeURIComponent(incidentId)}/resolve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resolvedBy: selectedWO.assignedTo ?? 'Field Engineer',
            resolutionNotes: resolutionNotes.trim(),
            beforePhotoUrl: beforeUrl,
            afterPhotoUrl: afterUrl,
          }),
        });
        if (!resolveRes.ok) {
          const errBody = await resolveRes.text().catch(() => '');
          throw new Error(`Resolve failed (${resolveRes.status}): ${errBody}`);
        }
      }

      await api.workOrders.update(selectedWO.id, { status: 'resolved' });
      const updated = { ...selectedWO, status: 'resolved' as WOStatus };
      setWorkOrders(wos => wos.map(w => w.id === selectedWO.id ? updated : w));
      setSelectedWO(updated);
      try {
        const summary = `Job resolved. Notes: ${resolutionNotes.trim()}.${beforeUrl || afterUrl ? ' Photo evidence uploaded.' : ''}`;
        const msg = await postWorkOrderMessage(selectedWO.id, summary, 'Field Engineer');
        setCommsList(prev => [...prev, msg]);
      } catch { /* non-fatal */ }
      setResolutionModal(false);
      showToast('Work order resolved — supervisor has been notified for confirmation', 'success');
    } catch {
      showToast('Failed to submit resolution', 'error');
    } finally {
      setResolutionSubmitting(false);
    }
  };

  const handleSendComm = async () => {
    if (!commsMessage.trim() || !selectedWO) return;
    const text = commsMessage.trim();
    setCommsMessage('');
    try {
      const msg = await postWorkOrderMessage(selectedWO.id, text, 'Field Staff');
      setCommsList(prev => [...prev, msg]);
    } catch {
      showToast('Failed to send message', 'error');
      setCommsMessage(text);
    }
  };

  const filteredAssets = mockAssets.filter(a =>
    !assetSearch || a.name.toLowerCase().includes(assetSearch.toLowerCase()) ||
    a.type.toLowerCase().includes(assetSearch.toLowerCase()) ||
    a.location.toLowerCase().includes(assetSearch.toLowerCase())
  );

  const relevantAsset = selectedWO
    ? mockAssets.find(a => selectedWO.asset && (a.name.toLowerCase().includes(selectedWO.asset.toLowerCase()) || selectedWO.asset.toLowerCase().includes(a.name.toLowerCase())))
    : null;

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'workorders', label: 'Work Orders', icon: <ClipboardList size={16} /> },
    { id: 'knowledge',  label: 'Knowledge',   icon: <BookOpen size={16} /> },
    { id: 'comms',      label: 'Comms',       icon: <MessageSquare size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-[#060F1E] flex flex-col">
      <div className="sticky top-0 z-30 bg-[#0A1628] border-b border-[rgba(46,127,255,0.2)] px-4 py-3 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="bg-[rgba(46,127,255,0.15)] border border-[rgba(46,127,255,0.3)] rounded-lg px-3 py-1.5">
            <span className="text-[#2E7FFF] font-bold text-base tracking-wider">IMDAAD</span>
            <span className="text-[#7A94B4] text-sm ml-1 font-light">Field</span>
          </div>
        </div>
        <div className="flex-1" />
        <button onClick={loadWorkOrders} className="text-[#7A94B4] hover:text-[#2E7FFF] transition-colors p-1.5 rounded-lg hover:bg-[rgba(46,127,255,0.08)]">
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="sticky top-[57px] z-20 bg-[#0A1628] border-b border-[rgba(46,127,255,0.15)] px-4">
        <div className="flex">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                tab === t.id
                  ? 'text-[#2E7FFF] border-[#2E7FFF]'
                  : 'text-[#7A94B4] border-transparent hover:text-[#EEF3FA]'
              }`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {toast && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-2xl border transition-all ${
          toast.type === 'success' ? 'bg-emerald-900/90 border-emerald-500/50 text-emerald-300'
          : toast.type === 'error' ? 'bg-red-900/90 border-red-500/50 text-red-300'
          : 'bg-[#0D1E38] border-[rgba(46,127,255,0.3)] text-[#EEF3FA]'
        }`}>{toast.msg}</div>
      )}

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {tab === 'workorders' && (
            <motion.div key="workorders" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
              {selectedWO ? (
                <WorkOrderDetail
                  wo={selectedWO}
                  onBack={() => setSelectedWO(null)}
                  onStartWork={() => handleStartWork(selectedWO)}
                  onResolve={handleResolveOpen}
                  onGoToComms={() => setTab('comms')}
                  onGoToKnowledge={() => setTab('knowledge')}
                  statusUpdating={statusUpdating}
                  onExpertOpen={() => setExpertOpen(true)}
                />
              ) : (
                <WorkOrderList
                  workOrders={workOrders}
                  loading={loading}
                  loadError={loadError}
                  onSelect={setSelectedWO}
                  onRetry={loadWorkOrders}
                />
              )}
            </motion.div>
          )}

          {tab === 'knowledge' && (
            <motion.div key="knowledge" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
              <KnowledgeBase
                relevantAsset={relevantAsset}
                selectedWO={selectedWO}
                assetSearch={assetSearch}
                setAssetSearch={setAssetSearch}
                filteredAssets={filteredAssets}
              />
            </motion.div>
          )}

          {tab === 'comms' && (
            <motion.div key="comms" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}
              className="flex flex-col h-[calc(100vh-120px)]">
              {selectedWO ? (
                <>
                  <div className="px-4 py-3 border-b border-[rgba(46,127,255,0.12)] bg-[rgba(46,127,255,0.04)]">
                    <p className="text-[#7A94B4] text-xs uppercase tracking-widest font-bold">Thread · {selectedWO.id}</p>
                    <p className="text-[#EEF3FA] text-sm font-semibold mt-0.5 truncate">{selectedWO.title}</p>
                  </div>
                  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                    {commsLoading && (
                      <div className="flex items-center justify-center py-6">
                        <div className="w-5 h-5 border-2 border-[#2E7FFF] border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    {!commsLoading && commsList.length === 0 && (
                      <p className="text-center text-[#4A6080] text-sm py-6">No messages yet — be the first to post an update</p>
                    )}
                    {commsList.map(msg => (
                      <div key={msg.id} className={`flex ${msg.author === 'Field Staff' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                          msg.author === 'Field Staff' ? 'bg-[#2E7FFF] text-white rounded-br-sm'
                          : msg.role === 'System' || msg.type === 'ai' || (!msg.author || msg.author === 'System') ? 'bg-[rgba(255,255,255,0.05)] border border-[rgba(46,127,255,0.15)] text-[#7A94B4] text-xs italic'
                          : 'bg-[#0D1E38] border border-[rgba(46,127,255,0.18)] text-[#EEF3FA] rounded-bl-sm'
                        }`}>
                          {msg.author !== 'Field Staff' && msg.role !== 'System' && msg.author && (
                            <p className="text-[10px] text-[#7A94B4] font-semibold mb-1">{msg.author} · {msg.role}</p>
                          )}
                          <p className="text-sm leading-relaxed">{msg.text}</p>
                          <p className="text-[10px] opacity-60 mt-1 text-right">{msg.time}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={commsEndRef} />
                  </div>
                  <div className="px-4 py-3 border-t border-[rgba(46,127,255,0.15)] flex gap-2 bg-[#0A1628]">
                    <input
                      value={commsMessage}
                      onChange={e => setCommsMessage(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendComm()}
                      placeholder="Type a message…"
                      className="flex-1 bg-[#0D1E38] border border-[rgba(46,127,255,0.18)] rounded-xl px-4 py-2.5 text-sm text-[#EEF3FA] placeholder-[#4A6080] outline-none focus:border-[rgba(46,127,255,0.4)]"
                    />
                    <button onClick={handleSendComm} disabled={!commsMessage.trim()}
                      className="bg-[#2E7FFF] hover:bg-[#1a6ae8] disabled:opacity-40 text-white rounded-xl px-4 py-2.5 transition-colors">
                      <Send size={16} />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4 text-center">
                  <MessageSquare size={40} className="text-[#7A94B4] opacity-40" />
                  <div>
                    <p className="text-[#EEF3FA] font-semibold">No work order selected</p>
                    <p className="text-[#7A94B4] text-sm mt-1">Select a work order first to view its communications thread</p>
                  </div>
                  <button onClick={() => setTab('workorders')}
                    className="flex items-center gap-2 text-[#2E7FFF] text-sm font-semibold mt-2 px-4 py-2 bg-[rgba(46,127,255,0.1)] border border-[rgba(46,127,255,0.25)] rounded-xl hover:bg-[rgba(46,127,255,0.18)] transition-colors">
                    <ClipboardList size={14} /> Go to Work Orders
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {resolutionModal && selectedWO && (
        <ResolutionModal
          wo={selectedWO}
          resolutionNotes={resolutionNotes}
          onNotesChange={setResolutionNotes}
          beforePhoto={beforePhoto}
          afterPhoto={afterPhoto}
          onPhotoSelect={handlePhotoSelect}
          onSubmit={handleSubmitResolution}
          onClose={() => setResolutionModal(false)}
          submitting={resolutionSubmitting}
        />
      )}

      <AssetExpertCopilot
        open={expertOpen}
        onClose={() => setExpertOpen(false)}
        variant="sheet"
        assetType={selectedWO?.skill ?? 'HVAC'}
        assetName={selectedWO?.asset ?? undefined}
        siteName={selectedWO?.location ?? selectedWO?.siteId ?? 'Silicon Oasis'}
        ppmTemplateName={selectedWO?.title}
        currentStep={
          selectedWO?.status === 'in_progress' ? 'On-site — job in progress'
          : selectedWO?.status === 'assigned' ? 'Travelling to site'
          : selectedWO?.status === 'open' ? 'Not yet started'
          : selectedWO?.status === 'resolved' ? 'Awaiting supervisor sign-off'
          : undefined
        }
        techReadings={selectedWO ? {
          'Work Order': selectedWO.id,
          'Priority': selectedWO.priority ?? 'medium',
          'Status': selectedWO.status,
          ...(selectedWO.description ? { 'Description / Fault Summary': selectedWO.description } : {}),
          ...(selectedWO.assignedTo ? { 'Assigned Tech': selectedWO.assignedTo } : {}),
        } : undefined}
        priorIncidents={
          mockIncidents
            .filter(inc => {
              const skill = (selectedWO?.skill ?? '').toLowerCase();
              const asset = (selectedWO?.asset ?? '').toLowerCase();
              return (
                inc.title.toLowerCase().includes(skill) ||
                inc.description.toLowerCase().includes(skill) ||
                (asset && inc.description.toLowerCase().includes(asset.split(' ')[0]))
              );
            })
            .slice(0, 3)
            .map(inc => ({
              title: inc.title,
              description: inc.description,
              date: inc.capturedAt,
              status: inc.status,
              severity: inc.severity,
            }))
        }
        partsAvailability={(() => {
          const skill = (selectedWO?.skill ?? '').toLowerCase();
          const relevantParts = mockParts.filter(p => {
            const pn = p.name.toLowerCase();
            if (skill.includes('hvac')) return pn.includes('refrigerant') || pn.includes('filter') || pn.includes('condenser') || pn.includes('thermostat');
            if (skill.includes('plumbing')) return pn.includes('pipe') || pn.includes('filter');
            if (skill.includes('electrical')) return true;
            return true;
          });
          return (relevantParts.length > 0 ? relevantParts : mockParts).map(p => ({
            name: p.name,
            inStock: p.inStock,
            status: p.status,
          }));
        })()}
        onCreateIncident={prefill => {
          showToast(`Corrective incident prefilled: ${prefill.title}`, 'info');
          setExpertOpen(false);
        }}
      />
    </div>
  );
}

function WorkOrderList({ workOrders, loading, loadError, onSelect, onRetry }: {
  workOrders: WorkOrder[];
  loading: boolean;
  loadError?: string | null;
  onSelect: (wo: WorkOrder) => void;
  onRetry?: () => void;
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = workOrders.filter(wo => {
    const matchSearch = !search || wo.title.toLowerCase().includes(search.toLowerCase()) ||
      (wo.location ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (wo.asset ?? '').toLowerCase().includes(search.toLowerCase());
    const normalizedWoStatus = (wo.status ?? '').toLowerCase().replace(/-/g, '_');
    const matchStatus = statusFilter === 'all' || normalizedWoStatus === statusFilter ||
      (statusFilter === 'open' && (normalizedWoStatus === 'new' || normalizedWoStatus === 'open'));
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 bg-[#0D1E38] border border-[rgba(46,127,255,0.18)] rounded-xl px-3 py-2.5 mb-3">
        <Search size={14} className="text-[#7A94B4]" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search work orders…"
          className="flex-1 bg-transparent text-sm text-[#EEF3FA] placeholder-[#4A6080] outline-none" />
        {search && <button onClick={() => setSearch('')}><X size={14} className="text-[#7A94B4]" /></button>}
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {['all','open','assigned','in_progress','resolved','closed'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === s
                ? 'bg-[#2E7FFF] text-white'
                : 'bg-[rgba(46,127,255,0.08)] border border-[rgba(46,127,255,0.15)] text-[#7A94B4] hover:text-[#EEF3FA]'
            }`}>
            {s === 'all' ? 'All' : s.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-[#2E7FFF] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : loadError ? (
        <div className="text-center py-12 px-4">
          <AlertTriangle size={36} className="text-red-400 opacity-60 mx-auto mb-3" />
          <p className="text-[#EEF3FA] font-semibold mb-1">Could not load work orders</p>
          <p className="text-[#7A94B4] text-sm mb-4">{loadError}</p>
          {onRetry && (
            <button onClick={onRetry}
              className="flex items-center gap-2 mx-auto text-[#2E7FFF] text-sm font-semibold px-4 py-2 bg-[rgba(46,127,255,0.1)] border border-[rgba(46,127,255,0.25)] rounded-xl hover:bg-[rgba(46,127,255,0.18)] transition-colors">
              <RefreshCw size={14} /> Retry
            </button>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardList size={36} className="text-[#7A94B4] opacity-30 mx-auto mb-3" />
          <p className="text-[#7A94B4] text-sm">No work orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(wo => (
            <button key={wo.id} onClick={() => onSelect(wo)}
              className="w-full text-left bg-[#0D1E38] border border-[rgba(46,127,255,0.2)] rounded-xl p-4 hover:border-[rgba(46,127,255,0.4)] hover:bg-[rgba(46,127,255,0.05)] transition-all active:scale-[0.99]">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[#EEF3FA] font-semibold text-sm leading-tight">{wo.title}</p>
                  <p className="text-[#2E7FFF] font-mono text-xs mt-0.5">{wo.id}</p>
                </div>
                <StatusBadge status={wo.status} />
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <PriorityBadge priority={wo.priority ?? 'medium'} />
                {wo.location && (
                  <span className="flex items-center gap-1 text-[#7A94B4] text-xs">
                    <MapPin size={10} /> {wo.location}
                  </span>
                )}
                {wo.assignedTo && (
                  <span className="flex items-center gap-1 text-[#7A94B4] text-xs">
                    <User size={10} /> {wo.assignedTo}
                  </span>
                )}
              </div>
              {wo.asset && (
                <p className="text-[#4A6080] text-xs mt-2 flex items-center gap-1">
                  <Wrench size={10} /> {wo.asset}
                </p>
              )}
              <div className="flex items-center justify-between mt-3">
                <span className="text-[#4A6080] text-xs">{isoTimeAgo(wo.createdAt)}</span>
                <span className="text-[#2E7FFF] text-xs font-semibold flex items-center gap-1">
                  View <ArrowRight size={10} />
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function WorkOrderDetail({ wo, onBack, onStartWork, onResolve, onGoToComms, onGoToKnowledge, statusUpdating, onExpertOpen }: {
  wo: WorkOrder;
  onBack: () => void;
  onStartWork: () => void;
  onResolve: () => void;
  onGoToComms: () => void;
  onGoToKnowledge: () => void;
  statusUpdating: boolean;
  onExpertOpen: () => void;
}) {
  const normalizedStatus = (wo.status ?? '').toLowerCase().replace(/-/g, '_');
  const canStart = normalizedStatus === 'open' || normalizedStatus === 'assigned';
  const canResolve = normalizedStatus === 'in_progress';
  const isResolved = normalizedStatus === 'resolved' || normalizedStatus === 'closed';

  return (
    <div>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[rgba(46,127,255,0.12)] bg-[rgba(46,127,255,0.04)]">
        <button onClick={onBack} className="text-[#7A94B4] hover:text-[#2E7FFF] transition-colors p-1.5 rounded-lg hover:bg-[rgba(46,127,255,0.08)]">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[#2E7FFF] font-mono text-xs">{wo.id}</p>
          <p className="text-[#EEF3FA] font-bold text-sm truncate">{wo.title}</p>
        </div>
        <StatusBadge status={wo.status} />
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-[rgba(46,127,255,0.07)] border border-[rgba(46,127,255,0.22)] rounded-xl p-4">
          <p className="text-[#7A94B4] text-xs uppercase tracking-widest font-bold mb-3">Work Order Details</p>
          <div className="space-y-2">
            {[
              { label: 'Priority', value: <PriorityBadge priority={wo.priority ?? 'medium'} /> },
              { label: 'Location', value: wo.location, icon: <MapPin size={12} className="text-[#7A94B4]" /> },
              { label: 'Asset', value: wo.asset, icon: <Wrench size={12} className="text-[#7A94B4]" /> },
              { label: 'Skill Required', value: wo.skill },
              { label: 'Assigned To', value: wo.assignedTo, icon: <User size={12} className="text-[#7A94B4]" /> },
              { label: 'Incident Ref', value: wo.incidentId },
            ].filter(r => r.value).map((row, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <span className="text-[#7A94B4] text-xs">{row.label}</span>
                <span className="text-[#EEF3FA] text-xs font-semibold flex items-center gap-1">
                  {row.icon} {typeof row.value === 'string' ? row.value : row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {wo.description && (
          <div className="bg-[rgba(16,185,129,0.06)] border border-[rgba(16,185,129,0.2)] rounded-xl p-4">
            <p className="text-[#7A94B4] text-xs uppercase tracking-widest font-bold mb-2">Description / AI Analysis</p>
            <p className="text-[#EEF3FA] text-sm leading-relaxed">{wo.description}</p>
          </div>
        )}

        {!isResolved && (
          <div>
            <p className="text-[#7A94B4] text-xs uppercase tracking-widest font-bold mb-3">Actions</p>
            <div className="grid grid-cols-2 gap-3">
              {canStart && (
                <button onClick={onStartWork} disabled={statusUpdating}
                  className="flex items-center justify-center gap-2 bg-[#2E7FFF] hover:bg-[#1a6ae8] disabled:opacity-50 text-white font-bold text-sm py-4 px-4 rounded-xl transition-colors active:scale-[0.98] col-span-2">
                  {statusUpdating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Wrench size={16} />}
                  Start Work
                </button>
              )}
              {canResolve && (
                <button onClick={onResolve}
                  className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm py-4 px-4 rounded-xl transition-colors active:scale-[0.98] col-span-2">
                  <CheckCircle size={16} /> Mark Resolved
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <button onClick={onGoToKnowledge}
                className="flex items-center justify-center gap-2 bg-[rgba(245,158,11,0.12)] border border-[rgba(245,158,11,0.3)] text-[#F59E0B] font-semibold text-sm py-3.5 px-3 rounded-xl hover:bg-[rgba(245,158,11,0.2)] transition-colors active:scale-[0.98]">
                <BookOpen size={14} /> Knowledge Base
              </button>
              <button onClick={onGoToComms}
                className="flex items-center justify-center gap-2 bg-[rgba(139,92,246,0.12)] border border-[rgba(139,92,246,0.3)] text-[#A78BFA] font-semibold text-sm py-3.5 px-3 rounded-xl hover:bg-[rgba(139,92,246,0.2)] transition-colors active:scale-[0.98]">
                <MessageSquare size={14} /> Comms Thread
              </button>
            </div>
          </div>
        )}

        {isResolved && (
          <div className="bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.25)] rounded-xl p-4 text-center">
            <CheckCircle size={28} className="text-emerald-400 mx-auto mb-2" />
            <p className="text-emerald-400 font-bold">Work Order {wo.status === 'closed' ? 'Closed' : 'Resolved'}</p>
            <p className="text-[#7A94B4] text-xs mt-1">Awaiting supervisor confirmation</p>
            <button onClick={onGoToComms}
              className="mt-3 flex items-center justify-center gap-2 mx-auto text-[#A78BFA] text-sm font-semibold px-4 py-2 bg-[rgba(139,92,246,0.12)] border border-[rgba(139,92,246,0.25)] rounded-xl hover:bg-[rgba(139,92,246,0.2)] transition-colors">
              <MessageSquare size={14} /> View Comms Thread
            </button>
          </div>
        )}

        <button
          onClick={onExpertOpen}
          className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl font-bold text-sm text-white transition-all active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #1a3a5c 0%, #0D2845 50%, #0A1E38 100%)', border: '1px solid rgba(46,127,255,0.35)' }}
        >
          <Brain size={16} className="text-[#2E7FFF]" />
          Talk to Asset Expert
          <Mic size={14} className="text-[#7A94B4]" />
        </button>

        {wo.location && (
          <a href={`https://www.google.com/maps/search/${encodeURIComponent(wo.location)}`} target="_blank" rel="noreferrer"
            className="flex items-center justify-center gap-2 bg-[rgba(46,127,255,0.08)] border border-[rgba(46,127,255,0.25)] text-[#2E7FFF] font-semibold text-sm py-3.5 rounded-xl hover:bg-[rgba(46,127,255,0.15)] transition-colors w-full">
            <MapPin size={14} /> Navigate to Site
          </a>
        )}
      </div>
    </div>
  );
}

function AssetCard({ asset, highlighted }: {
  asset: typeof mockAssets[number];
  highlighted?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const statusColor = asset.status === 'critical' ? '#EF4444' : asset.status === 'warning' ? '#F59E0B' : '#10B981';

  return (
    <div className={`rounded-xl border transition-all ${
      highlighted
        ? 'border-[rgba(46,127,255,0.4)] bg-[rgba(46,127,255,0.09)]'
        : 'border-[rgba(46,127,255,0.18)] bg-[#0D1E38]'
    }`}>
      <button className="w-full text-left p-4" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-[#EEF3FA] font-semibold text-sm">{asset.name}</p>
            <p className="text-[#7A94B4] text-xs mt-0.5 flex items-center gap-1">
              <MapPin size={10} /> {asset.location}
            </p>
          </div>
          <span style={{ background: `${statusColor}22`, border: `1px solid ${statusColor}66`, color: statusColor }}
            className="px-2 py-0.5 rounded-full text-xs font-bold uppercase whitespace-nowrap">
            {asset.status}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <span className="bg-[rgba(139,92,246,0.12)] border border-[rgba(139,92,246,0.25)] text-[#A78BFA] px-2 py-0.5 rounded text-xs font-semibold">{asset.type}</span>
          <div className="flex-1 bg-[rgba(255,255,255,0.06)] rounded-full h-1.5">
            <div className="h-1.5 rounded-full" style={{ width: `${asset.condition}%`, background: statusColor }} />
          </div>
          <span className="text-[#7A94B4] text-xs">{asset.condition}%</span>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="overflow-hidden">
            <div className="px-4 pb-4 border-t border-[rgba(46,127,255,0.12)] pt-3 space-y-2">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-[#7A94B4]">Last Service</p>
                  <p className="text-[#EEF3FA] font-semibold mt-0.5">{asset.lastService}</p>
                </div>
                <div>
                  <p className="text-[#7A94B4]">Next PPM</p>
                  <p className="text-[#EEF3FA] font-semibold mt-0.5">{asset.nextPPM}</p>
                </div>
              </div>
              <div>
                <p className="text-[#7A94B4] text-xs mb-1">Recommended Actions</p>
                {asset.status === 'critical' ? (
                  <p className="text-[#EEF3FA] text-xs leading-relaxed bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] rounded-lg p-2">
                    Immediate inspection required. Do not operate until safety check is complete.
                  </p>
                ) : asset.status === 'warning' ? (
                  <p className="text-[#EEF3FA] text-xs leading-relaxed bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)] rounded-lg p-2">
                    Schedule maintenance within 7 days. Monitor performance closely.
                  </p>
                ) : (
                  <p className="text-[#EEF3FA] text-xs leading-relaxed bg-[rgba(16,185,129,0.06)] border border-[rgba(16,185,129,0.15)] rounded-lg p-2">
                    Asset operating normally. Continue regular PPM schedule.
                  </p>
                )}
              </div>
              <a href={`https://www.google.com/maps?q=${asset.lat},${asset.lng}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-[#2E7FFF] text-xs font-semibold hover:underline mt-1">
                <MapPin size={10} /> View on Map
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ResolutionModal({ wo, resolutionNotes, onNotesChange, beforePhoto, afterPhoto, onPhotoSelect, onSubmit, onClose, submitting }: {
  wo: WorkOrder;
  resolutionNotes: string;
  onNotesChange: (v: string) => void;
  beforePhoto: string | null;
  afterPhoto: string | null;
  onPhotoSelect: (type: 'before' | 'after', file: File) => void;
  onSubmit: () => void;
  onClose: () => void;
  submitting: boolean;
}) {
  const beforeRef = useRef<HTMLInputElement>(null);
  const afterRef = useRef<HTMLInputElement>(null);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end">
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full bg-[#0D1E38] border-t border-[rgba(46,127,255,0.25)] rounded-t-3xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(46,127,255,0.12)]">
          <div>
            <p className="text-[#EEF3FA] font-bold text-base">Mark Resolved</p>
            <p className="text-[#7A94B4] text-xs mt-0.5">{wo.id} · {wo.title}</p>
          </div>
          <button onClick={onClose} className="text-[#7A94B4] hover:text-[#EEF3FA] p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.06)] transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-5 space-y-5">
          <div>
            <p className="text-[#7A94B4] text-xs uppercase tracking-widest font-bold mb-2">Resolution Notes <span className="text-red-400">*</span></p>
            <textarea value={resolutionNotes} onChange={e => onNotesChange(e.target.value)}
              placeholder="Describe what was done, parts replaced, root cause identified…"
              rows={4}
              className="w-full bg-[#112040] border border-[rgba(46,127,255,0.2)] rounded-xl p-3 text-sm text-[#EEF3FA] placeholder-[#4A6080] outline-none focus:border-[rgba(46,127,255,0.45)] resize-none"
            />
          </div>

          <div>
            <p className="text-[#7A94B4] text-xs uppercase tracking-widest font-bold mb-3">Photo Evidence</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[#7A94B4] text-xs mb-2">Before <span className="text-red-400">*</span></p>
                <input ref={beforeRef} type="file" accept="image/*" capture="environment" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) onPhotoSelect('before', f); }} />
                {beforePhoto ? (
                  <div className="relative rounded-xl overflow-hidden aspect-square border border-[rgba(46,127,255,0.25)]">
                    <img src={beforePhoto} alt="Before" className="w-full h-full object-cover" />
                    <button onClick={() => beforeRef.current?.click()} className="absolute bottom-1.5 right-1.5 bg-black/60 rounded-lg p-1">
                      <ZoomIn size={12} className="text-white" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => beforeRef.current?.click()}
                    className="w-full aspect-square rounded-xl border-2 border-dashed border-[rgba(46,127,255,0.25)] flex flex-col items-center justify-center gap-2 hover:border-[rgba(46,127,255,0.5)] hover:bg-[rgba(46,127,255,0.05)] transition-colors">
                    <Camera size={20} className="text-[#7A94B4]" />
                    <span className="text-[#7A94B4] text-xs">Take Photo</span>
                  </button>
                )}
              </div>
              <div>
                <p className="text-[#7A94B4] text-xs mb-2">After <span className="text-red-400">*</span></p>
                <input ref={afterRef} type="file" accept="image/*" capture="environment" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) onPhotoSelect('after', f); }} />
                {afterPhoto ? (
                  <div className="relative rounded-xl overflow-hidden aspect-square border border-[rgba(16,185,129,0.25)]">
                    <img src={afterPhoto} alt="After" className="w-full h-full object-cover" />
                    <button onClick={() => afterRef.current?.click()} className="absolute bottom-1.5 right-1.5 bg-black/60 rounded-lg p-1">
                      <ZoomIn size={12} className="text-white" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => afterRef.current?.click()}
                    className="w-full aspect-square rounded-xl border-2 border-dashed border-[rgba(16,185,129,0.2)] flex flex-col items-center justify-center gap-2 hover:border-[rgba(16,185,129,0.5)] hover:bg-[rgba(16,185,129,0.05)] transition-colors">
                    <Upload size={20} className="text-[#7A94B4]" />
                    <span className="text-[#7A94B4] text-xs">Upload After</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {(!beforePhoto || !afterPhoto) && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/30 rounded-xl">
              <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
              <span className="text-xs text-red-400">
                {!beforePhoto && !afterPhoto
                  ? 'Before and after photos are required'
                  : !beforePhoto
                  ? 'Before photo is required'
                  : 'After photo is required'}
              </span>
            </div>
          )}
          <button onClick={onSubmit} disabled={submitting || !resolutionNotes.trim() || !beforePhoto || !afterPhoto}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm py-4 rounded-xl transition-colors active:scale-[0.99]">
            {submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle size={18} />}
            Submit Resolution
          </button>
        </div>
      </motion.div>
    </div>
  );
}

const KB_CATEGORY_META: Record<KBCategory, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  guide:     { label: 'Guide',     color: '#2E7FFF', bg: 'rgba(46,127,255,0.12)',   border: 'rgba(46,127,255,0.3)',   icon: <FileText size={12} /> },
  video:     { label: 'Video',     color: '#A78BFA', bg: 'rgba(167,139,250,0.12)',  border: 'rgba(167,139,250,0.3)',  icon: <Video size={12} /> },
  sop:       { label: 'SOP',       color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',   border: 'rgba(245,158,11,0.3)',   icon: <FileText size={12} /> },
  checklist: { label: 'Checklist', color: '#10B981', bg: 'rgba(16,185,129,0.12)',   border: 'rgba(16,185,129,0.3)',   icon: <ListChecks size={12} /> },
};

const KB_DIFFICULTY_META: Record<string, { label: string; color: string }> = {
  beginner:     { label: 'Beginner',     color: '#10B981' },
  intermediate: { label: 'Intermediate', color: '#F59E0B' },
  advanced:     { label: 'Advanced',     color: '#EF4444' },
};

function KBCategoryBadge({ category }: { category: KBCategory }) {
  const meta = KB_CATEGORY_META[category];
  return (
    <span style={{ background: meta.bg, border: `1px solid ${meta.border}`, color: meta.color }}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap">
      {meta.icon} {meta.label}
    </span>
  );
}

function KnowledgeBase({ relevantAsset, selectedWO, assetSearch, setAssetSearch, filteredAssets }: {
  relevantAsset: typeof mockAssets[number] | null | undefined;
  selectedWO: { title?: string | null } | null;
  assetSearch: string;
  setAssetSearch: (v: string) => void;
  filteredAssets: typeof mockAssets;
}) {
  const [kbSearch, setKbSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<KBCategory | 'all'>('all');
  const [selectedResource, setSelectedResource] = useState<KBResource | null>(null);
  const [assetsExpanded, setAssetsExpanded] = useState(() => !!(relevantAsset && selectedWO));

  const filtered = mockKBResources.filter(r => {
    const matchCat = categoryFilter === 'all' || r.category === categoryFilter;
    const q = kbSearch.toLowerCase();
    const matchSearch = !q ||
      r.title.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.tags.some(t => t.toLowerCase().includes(q));
    return matchCat && matchSearch;
  });

  if (selectedResource) {
    return (
      <KnowledgeResourceDetail
        resource={selectedResource}
        onBack={() => setSelectedResource(null)}
      />
    );
  }

  const categoryFilters: { id: KBCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'guide', label: 'Guides' },
    { id: 'video', label: 'Videos' },
    { id: 'sop', label: 'SOPs' },
    { id: 'checklist', label: 'Checklists' },
  ];

  return (
    <div className="p-4">
      <div className="mb-5">
        <h2 className="text-[#EEF3FA] font-bold text-base">Knowledge Base</h2>
        <p className="text-[#7A94B4] text-xs mt-0.5">How-to guides, SOPs, videos & checklists</p>
      </div>

      <div className="flex items-center gap-2 bg-[#0D1E38] border border-[rgba(46,127,255,0.18)] rounded-xl px-3 py-2.5 mb-3">
        <Search size={14} className="text-[#7A94B4]" />
        <input value={kbSearch} onChange={e => setKbSearch(e.target.value)}
          placeholder="Search guides, SOPs, videos…"
          className="flex-1 bg-transparent text-sm text-[#EEF3FA] placeholder-[#4A6080] outline-none" />
        {kbSearch && <button onClick={() => setKbSearch('')}><X size={14} className="text-[#7A94B4]" /></button>}
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {categoryFilters.map(f => (
          <button key={f.id} onClick={() => setCategoryFilter(f.id)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              categoryFilter === f.id
                ? 'bg-[#2E7FFF] text-white'
                : 'bg-[rgba(46,127,255,0.08)] border border-[rgba(46,127,255,0.15)] text-[#7A94B4] hover:text-[#EEF3FA]'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen size={36} className="text-[#7A94B4] opacity-30 mx-auto mb-3" />
          <p className="text-[#7A94B4] text-sm">No resources found</p>
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {filtered.map(r => (
            <KBResourceCard key={r.id} resource={r} onOpen={() => setSelectedResource(r)} />
          ))}
        </div>
      )}

      <div className="mt-4 border-t border-[rgba(46,127,255,0.12)] pt-4">
        <button
          onClick={() => setAssetsExpanded(!assetsExpanded)}
          className="w-full flex items-center justify-between py-2 text-left">
          <span className="text-[#7A94B4] text-xs uppercase tracking-widest font-bold">Assets</span>
          {assetsExpanded ? <ChevronUp size={14} className="text-[#7A94B4]" /> : <ChevronDown size={14} className="text-[#7A94B4]" />}
        </button>

        <AnimatePresence>
          {assetsExpanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
              className="overflow-hidden">
              {relevantAsset && selectedWO && (
                <div className="mb-3 bg-[rgba(46,127,255,0.07)] border border-[rgba(46,127,255,0.22)] rounded-xl p-3">
                  <p className="text-[#7A94B4] text-xs uppercase tracking-widest font-bold mb-2">Asset for Current WO</p>
                  <AssetCard asset={relevantAsset} highlighted />
                </div>
              )}
              <div className="flex items-center gap-2 bg-[#0D1E38] border border-[rgba(46,127,255,0.18)] rounded-xl px-3 py-2.5 mb-3">
                <Search size={14} className="text-[#7A94B4]" />
                <input value={assetSearch} onChange={e => setAssetSearch(e.target.value)}
                  placeholder="Search assets by name, type, location…"
                  className="flex-1 bg-transparent text-sm text-[#EEF3FA] placeholder-[#4A6080] outline-none" />
                {assetSearch && <button onClick={() => setAssetSearch('')}><X size={14} className="text-[#7A94B4]" /></button>}
              </div>
              <div className="space-y-3">
                {filteredAssets.map(a => <AssetCard key={a.id} asset={a} />)}
                {filteredAssets.length === 0 && (
                  <p className="text-center text-[#4A6080] text-sm py-4">No assets found</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function KBResourceCard({ resource, onOpen }: { resource: KBResource; onOpen: () => void }) {
  const meta = KB_CATEGORY_META[resource.category];
  const diff = KB_DIFFICULTY_META[resource.difficulty];
  const isVideo = resource.category === 'video';

  return (
    <button onClick={onOpen}
      className="w-full text-left bg-[#0D1E38] border border-[rgba(46,127,255,0.18)] rounded-xl p-4 hover:border-[rgba(46,127,255,0.4)] hover:bg-[rgba(46,127,255,0.05)] transition-all active:scale-[0.99]">
      {isVideo && resource.thumbnailUrl && (
        <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-3 bg-[#060F1E]">
          <img src={resource.thumbnailUrl} alt={resource.title} className="w-full h-full object-cover opacity-80" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-[rgba(167,139,250,0.9)] flex items-center justify-center shadow-lg">
              <Play size={20} className="text-white ml-0.5" />
            </div>
          </div>
          <div className="absolute bottom-2 right-2 bg-black/70 rounded px-1.5 py-0.5 text-white text-xs font-semibold">
            {resource.estimatedTime}
          </div>
        </div>
      )}
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-[#EEF3FA] font-semibold text-sm leading-tight flex-1">{resource.title}</p>
        <KBCategoryBadge category={resource.category} />
      </div>
      <p className="text-[#7A94B4] text-xs leading-relaxed mb-3">{resource.description}</p>
      <div className="flex items-center gap-3">
        {!isVideo && (
          <span className="flex items-center gap-1 text-[#7A94B4] text-xs">
            <Clock size={11} /> {resource.estimatedTime}
          </span>
        )}
        <span style={{ color: diff.color }} className="text-xs font-semibold">{diff.label}</span>
        <span className="ml-auto text-[#2E7FFF] text-xs font-semibold flex items-center gap-1">
          {isVideo ? 'Watch' : 'Open'} <ArrowRight size={10} />
        </span>
      </div>
    </button>
  );
}

function KnowledgeResourceDetail({ resource, onBack }: { resource: KBResource; onBack: () => void }) {
  const meta = KB_CATEGORY_META[resource.category];
  const diff = KB_DIFFICULTY_META[resource.difficulty];
  const isVideo = resource.category === 'video';

  return (
    <div>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[rgba(46,127,255,0.12)] bg-[rgba(46,127,255,0.04)] sticky top-[105px] z-10">
        <button onClick={onBack} className="text-[#7A94B4] hover:text-[#2E7FFF] transition-colors p-1.5 rounded-lg hover:bg-[rgba(46,127,255,0.08)]">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[#7A94B4] text-xs">Knowledge Base</p>
          <p className="text-[#EEF3FA] font-bold text-sm truncate">{resource.title}</p>
        </div>
        <KBCategoryBadge category={resource.category} />
      </div>

      <div className="p-4 space-y-4">
        {isVideo && resource.videoUrl ? (
          <div className="rounded-xl overflow-hidden border border-[rgba(167,139,250,0.25)] aspect-video bg-black">
            <iframe
              src={resource.videoUrl}
              title={resource.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        ) : isVideo && resource.thumbnailUrl ? (
          <a href={resource.thumbnailUrl} target="_blank" rel="noreferrer"
            className="relative block w-full aspect-video rounded-xl overflow-hidden border border-[rgba(167,139,250,0.25)] bg-[#060F1E]">
            <img src={resource.thumbnailUrl} alt={resource.title} className="w-full h-full object-cover opacity-80" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-[rgba(167,139,250,0.9)] flex items-center justify-center shadow-xl">
                <Play size={28} className="text-white ml-1" />
              </div>
            </div>
          </a>
        ) : null}

        <div className="bg-[rgba(46,127,255,0.07)] border border-[rgba(46,127,255,0.2)] rounded-xl p-4">
          <p className="text-[#EEF3FA] text-sm leading-relaxed mb-3">{resource.description}</p>
          <div className="flex flex-wrap gap-3 text-xs">
            <span className="flex items-center gap-1 text-[#7A94B4]"><Clock size={11} /> {resource.estimatedTime}</span>
            <span style={{ color: diff.color }} className="font-semibold">{diff.label}</span>
          </div>
          {resource.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {resource.tags.map(tag => (
                <span key={tag} className="bg-[rgba(46,127,255,0.1)] border border-[rgba(46,127,255,0.2)] text-[#7A94B4] px-2 py-0.5 rounded text-xs">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {resource.tools && resource.tools.length > 0 && (
          <div className="bg-[#0D1E38] border border-[rgba(46,127,255,0.15)] rounded-xl p-4">
            <p className="text-[#7A94B4] text-xs uppercase tracking-widest font-bold mb-3 flex items-center gap-1.5">
              <Hammer size={12} /> Tools Required
            </p>
            <ul className="space-y-1.5">
              {resource.tools.map((tool, i) => (
                <li key={i} className="flex items-center gap-2 text-[#EEF3FA] text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2E7FFF] flex-shrink-0" />
                  {tool}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <p className="text-[#7A94B4] text-xs uppercase tracking-widest font-bold mb-3">
            {isVideo ? 'Key Points' : `Steps (${resource.steps.length})`}
          </p>
          <div className="space-y-3">
            {resource.steps.map((step, i) => (
              <div key={i} className="bg-[#0D1E38] border border-[rgba(46,127,255,0.15)] rounded-xl overflow-hidden">
                <div className="flex items-start gap-3 p-4">
                  <div className="w-7 h-7 rounded-full bg-[rgba(46,127,255,0.15)] border border-[rgba(46,127,255,0.3)] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[#2E7FFF] text-xs font-bold">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#EEF3FA] font-semibold text-sm mb-1.5">{step.title}</p>
                    <p className="text-[#B0C4DC] text-xs leading-relaxed">{step.body}</p>
                  </div>
                </div>
                {step.warning && (
                  <div className="mx-4 mb-3 flex items-start gap-2 bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.25)] rounded-lg p-3">
                    <TriangleAlert size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-300 text-xs leading-relaxed">{step.warning}</p>
                  </div>
                )}
                {step.tip && (
                  <div className="mx-4 mb-3 flex items-start gap-2 bg-[rgba(16,185,129,0.07)] border border-[rgba(16,185,129,0.2)] rounded-lg p-3">
                    <Lightbulb size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                    <p className="text-emerald-300 text-xs leading-relaxed">{step.tip}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <button onClick={onBack}
          className="w-full flex items-center justify-center gap-2 bg-[rgba(46,127,255,0.1)] border border-[rgba(46,127,255,0.25)] text-[#2E7FFF] font-semibold text-sm py-3.5 rounded-xl hover:bg-[rgba(46,127,255,0.18)] transition-colors mt-2">
          <ChevronLeft size={16} /> Back to Knowledge Base
        </button>
      </div>
    </div>
  );
}
