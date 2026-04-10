import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database, Wifi, MessageSquare, Scan, Cpu, Globe, X,
  CheckCircle, AlertTriangle, RefreshCw, Plus, Search,
  ChevronRight, Activity, Clock, Shield, FileText, Settings,
  BarChart2, Calendar, Users, AlertCircle,
} from 'lucide-react';
import { mockDataSources } from '@/data/mockData';
import { type ToastFn } from '@/lib/ui';
import { AnimatedBar } from '@/components/shared/AnimatedBar';

type DataSource = typeof mockDataSources[0];

const TYPE_ICON: Record<string, React.ReactNode> = {
  'API':             <Globe size={13} />,
  'WhatsApp':        <MessageSquare size={13} />,
  'IoT':             <Cpu size={13} />,
  'QR':              <Scan size={13} />,
  'External System': <Database size={13} />,
  'Manual':          <FileText size={13} />,
};

const TYPE_COLOR: Record<string, string> = {
  'API':             'text-blue-400 bg-blue-500/20 border-blue-500/30',
  'WhatsApp':        'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
  'IoT':             'text-cyan-400 bg-cyan-500/20 border-cyan-500/30',
  'QR':              'text-purple-400 bg-purple-500/20 border-purple-500/30',
  'External System': 'text-amber-400 bg-amber-500/20 border-amber-500/30',
  'Manual':          'text-[#7A94B4] bg-white/5 border-white/10',
};

const STATUS_CONFIG = {
  active:   { label: 'Active',   dot: 'bg-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  syncing:  { label: 'Syncing',  dot: 'bg-blue-400 animate-pulse', text: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
  error:    { label: 'Error',    dot: 'bg-red-400',     text: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' },
};

const DRAWER_TABS = ['Overview', 'Deployment', 'Assignments', 'Scheduling', 'Validation', 'Logs', 'Settings'];

const ALL_TYPES = ['All', 'API', 'WhatsApp', 'IoT', 'QR', 'External System'];
const ALL_STATUSES = ['All', 'active', 'syncing', 'error'];

function QualityBar({ value }: { value: number }) {
  const color = value >= 90 ? '#38D98A' : value >= 70 ? '#FF9B38' : '#FF4B4B';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-[#0A1628] rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-[10px] font-bold w-7 text-right" style={{ color }}>{value > 0 ? `${value}%` : '—'}</span>
    </div>
  );
}

function DrawerContent({ source, tab }: { source: DataSource; tab: string }) {
  if (tab === 'Overview') {
    return (
      <div className="space-y-4">
        <p className="text-[12px] text-[#7A94B4] leading-relaxed">{source.description}</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Source ID',  value: source.id },
            { label: 'Owner',      value: source.owner },
            { label: 'Type',       value: source.type },
            { label: 'Frequency',  value: source.frequency },
            { label: 'Last Sync',  value: source.lastSyncTime },
            { label: 'Volume/day', value: source.volume > 0 ? `${source.volume.toLocaleString()} records` : '—' },
          ].map(r => (
            <div key={r.label} className="bg-[#0A1628] rounded-lg p-2.5">
              <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-0.5">{r.label}</div>
              <div className="text-[12px] text-[#EEF3FA] font-medium">{r.value}</div>
            </div>
          ))}
        </div>
        <div>
          <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-2">Feeds into</div>
          <div className="flex flex-wrap gap-1.5">
            {source.feeds.map(f => (
              <span key={f} className="text-[10px] bg-[rgba(46,127,255,0.15)] border border-[rgba(46,127,255,0.3)] text-blue-300 px-2 py-0.5 rounded-full">
                {f}
              </span>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-1.5">Data Quality</div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-[#EEF3FA]">Quality Score</span>
            <span className="text-[11px] font-bold" style={{ color: source.quality >= 90 ? '#38D98A' : source.quality >= 70 ? '#FF9B38' : '#FF4B4B' }}>
              {source.quality > 0 ? `${source.quality}%` : 'Unavailable'}
            </span>
          </div>
          {source.quality > 0 && <AnimatedBar value={source.quality} color={source.quality >= 90 ? '#38D98A' : source.quality >= 70 ? '#FF9B38' : '#FF4B4B'} />}
        </div>
      </div>
    );
  }
  if (tab === 'Logs') {
    return (
      <div className="space-y-3">
        <div className="text-[11px] text-[#7A94B4]">Recent sync events and error logs.</div>
        {source.errors.length === 0 ? (
          <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <CheckCircle size={14} className="text-emerald-400" />
            <span className="text-[12px] text-emerald-400">No errors — all syncs successful</span>
          </div>
        ) : (
          <div className="space-y-2">
            {source.errors.map((err, i) => (
              <div key={i} className={`p-3 rounded-lg border ${err.severity === 'error' ? 'bg-red-500/10 border-red-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle size={11} className={err.severity === 'error' ? 'text-red-400' : 'text-amber-400'} />
                  <span className={`text-[10px] font-bold ${err.severity === 'error' ? 'text-red-400' : 'text-amber-400'}`}>{err.severity.toUpperCase()}</span>
                  <span className="text-[9px] text-[#7A94B4] ml-auto">{err.time}</span>
                </div>
                <div className="text-[11px] text-[#EEF3FA]">{err.message}</div>
              </div>
            ))}
          </div>
        )}
        <div className="space-y-1">
          {[
            { time: source.lastSyncTime, msg: `Sync completed — ${source.volume.toLocaleString()} records processed`, ok: true },
            { time: '09:58 AM', msg: 'Sync completed — schema validation passed', ok: true },
            { time: '09:53 AM', msg: 'Sync completed — deduplication: 3 records skipped', ok: true },
          ].map((l, i) => (
            <div key={i} className="flex items-start gap-2 py-1.5 border-b border-[rgba(46,127,255,0.08)] last:border-0">
              <CheckCircle size={10} className="text-emerald-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-[10px] text-[#EEF3FA]">{l.msg}</div>
              </div>
              <span className="text-[9px] text-[#7A94B4] flex-shrink-0">{l.time}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (tab === 'Deployment') {
    return (
      <div className="space-y-3">
        {[
          { label: 'Environment', value: 'Production' },
          { label: 'Endpoint', value: source.type === 'API' || source.type === 'External System' ? 'https://api.imdaad.ae/v2/...' : 'N/A — device-based' },
          { label: 'Auth Method', value: source.type === 'API' ? 'OAuth 2.0 Bearer Token' : source.type === 'IoT' ? 'MQTT + TLS certificate' : 'Webhook signature' },
          { label: 'Protocol', value: source.type === 'IoT' ? 'MQTT v5' : 'HTTPS REST' },
          { label: 'Timeout', value: '30 seconds' },
          { label: 'Retry Policy', value: 'Exponential backoff · max 3 retries' },
          { label: 'Region', value: 'UAE East (Dubai)' },
          { label: 'SLA', value: '99.5% uptime' },
        ].map(r => (
          <div key={r.label} className="flex items-center justify-between py-1.5 border-b border-[rgba(46,127,255,0.08)]">
            <span className="text-[11px] text-[#7A94B4]">{r.label}</span>
            <span className="text-[11px] text-[#EEF3FA] font-medium">{r.value}</span>
          </div>
        ))}
      </div>
    );
  }
  if (tab === 'Validation') {
    const rules = [
      { rule: 'Schema validation', status: 'pass', detail: 'All fields present and typed correctly' },
      { rule: 'Deduplication check', status: 'pass', detail: 'No duplicate records in last sync' },
      { rule: 'Timestamp integrity', status: 'pass', detail: 'All timestamps within acceptable drift' },
      { rule: 'Required field completeness', status: source.quality < 80 ? 'warn' : 'pass', detail: source.quality < 80 ? `${100 - source.quality}% records missing optional fields` : '100% complete' },
      { rule: 'Format conformance', status: 'pass', detail: 'JSON schema v3.1 compliant' },
    ];
    return (
      <div className="space-y-2">
        {rules.map(r => (
          <div key={r.rule} className={`p-3 rounded-lg border flex items-start gap-3 ${r.status === 'pass' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/30'}`}>
            {r.status === 'pass'
              ? <CheckCircle size={13} className="text-emerald-400 flex-shrink-0 mt-0.5" />
              : <AlertTriangle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />}
            <div>
              <div className="text-[11px] text-[#EEF3FA] font-medium">{r.rule}</div>
              <div className="text-[10px] text-[#7A94B4]">{r.detail}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  const tabContent: Record<string, { icon: React.ReactNode; title: string; body: string }> = {
    Assignments: { icon: <Users size={16} className="text-[#2E7FFF]" />, title: 'Team Assignments', body: `This source is managed by ${source.owner}. Access is granted to: Operations Manager, System Integrator, Data Analyst. Changes require IT Ops approval.` },
    Scheduling:  { icon: <Calendar size={16} className="text-[#2E7FFF]" />, title: 'Sync Schedule', body: `Frequency: ${source.frequency}\nNext sync window: ${source.lastSyncTime ? 'In ~${source.frequency}' : 'Not scheduled'}\nMaintenance window: Sundays 02:00–04:00 AM GST.` },
    Settings:    { icon: <Settings size={16} className="text-[#2E7FFF]" />, title: 'Source Settings', body: 'Rate limiting: 1,000 req/min. Payload compression: gzip enabled. Webhook retry: 3 attempts. Alert on error: Operations Manager notified within 5 min.' },
  };
  const content = tabContent[tab];
  if (!content) return null;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">{content.icon}<span className="text-[12px] text-[#EEF3FA] font-semibold">{content.title}</span></div>
      <p className="text-[12px] text-[#7A94B4] leading-relaxed whitespace-pre-line">{content.body}</p>
    </div>
  );
}

interface Props { onToast: ToastFn }

export function DataSources({ onToast }: Props) {
  const [typeFilter,   setTypeFilter]   = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search,       setSearch]       = useState('');
  const [selectedSource, setSelectedSource] = useState<DataSource | null>(null);
  const [drawerTab,    setDrawerTab]    = useState('Overview');

  const filtered = mockDataSources.filter(s => {
    if (typeFilter   !== 'All' && s.type   !== typeFilter)   return false;
    if (statusFilter !== 'All' && s.status !== statusFilter) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const openSource = (s: DataSource) => { setSelectedSource(s); setDrawerTab('Overview'); };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(46,127,255,0.15)] flex-shrink-0">
        <div>
          <h2 className="text-[#EEF3FA] font-bold text-base" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Data Sources</h2>
          <p className="text-[11px] text-[#7A94B4]">All inputs feeding the 4C360 intelligence layer · {mockDataSources.filter(s => s.status === 'active').length} active</p>
        </div>
        <button
          onClick={() => onToast('Add Source wizard — available in full deployment', 'info')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2E7FFF] text-white text-[11px] font-semibold hover:bg-blue-500 transition-colors"
        >
          <Plus size={12} /> Add Source
        </button>
      </div>

      <div className="flex items-center gap-3 px-5 py-2.5 border-b border-[rgba(46,127,255,0.1)] flex-shrink-0 flex-wrap gap-y-2">
        <div className="flex items-center gap-1.5 bg-[#112040] rounded-lg px-2.5 py-1.5 border border-[rgba(46,127,255,0.2)] flex-shrink-0">
          <Search size={11} className="text-[#7A94B4]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search sources…"
            className="bg-transparent text-[11px] text-[#EEF3FA] placeholder-[#7A94B4] outline-none w-32"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {ALL_TYPES.map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`text-[10px] px-2 py-1 rounded-lg border transition-all ${typeFilter === t ? 'bg-[rgba(46,127,255,0.2)] border-[#2E7FFF] text-[#EEF3FA]' : 'border-[rgba(46,127,255,0.15)] text-[#7A94B4] hover:text-[#EEF3FA]'}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {ALL_STATUSES.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`text-[10px] px-2 py-1 rounded-lg border capitalize transition-all ${statusFilter === s ? 'bg-[rgba(46,127,255,0.2)] border-[#2E7FFF] text-[#EEF3FA]' : 'border-[rgba(46,127,255,0.15)] text-[#7A94B4] hover:text-[#EEF3FA]'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className={`flex flex-col overflow-hidden transition-all duration-300 ${selectedSource ? 'flex-[55]' : 'flex-1'}`}>
          <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1.2fr_1fr_1.5fr_1.2fr] px-5 py-2 text-[9px] text-[#7A94B4] uppercase tracking-wide border-b border-[rgba(46,127,255,0.08)] flex-shrink-0">
            {['Source', 'Type', 'Status', 'Last Sync', 'Volume', 'Quality', 'Owner'].map(h => <div key={h}>{h}</div>)}
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filtered.map(source => {
              const st = STATUS_CONFIG[source.status];
              const isSelected = selectedSource?.id === source.id;
              return (
                <motion.button
                  key={source.id}
                  onClick={() => openSource(source)}
                  whileTap={{ scale: 0.995 }}
                  className={`w-full text-left px-5 py-3 border-b border-[rgba(46,127,255,0.08)] hover:bg-white/[0.02] transition-all flex items-center gap-0 ${isSelected ? 'bg-[rgba(46,127,255,0.08)]' : ''}`}
                >
                  <div className="grid w-full grid-cols-[2fr_1fr_1fr_1.2fr_1fr_1.5fr_1.2fr] items-center gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center border flex-shrink-0 ${TYPE_COLOR[source.type]}`}>
                        {TYPE_ICON[source.type]}
                      </div>
                      <div>
                        <div className="text-[12px] text-[#EEF3FA] font-semibold">{source.name}</div>
                        <div className="text-[9px] text-[#7A94B4]">{source.id}</div>
                      </div>
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border w-fit ${TYPE_COLOR[source.type]}`}>{source.type}</span>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${st.dot}`} />
                      <span className={`text-[10px] font-semibold ${st.text}`}>{st.label}</span>
                    </div>
                    <span className="text-[11px] text-[#7A94B4]">{source.lastSync}</span>
                    <span className="text-[11px] text-[#EEF3FA] font-medium">{source.volume > 0 ? `${source.volume.toLocaleString()}` : '—'}</span>
                    <QualityBar value={source.quality} />
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#7A94B4]">{source.owner}</span>
                      <ChevronRight size={12} className={`text-[#7A94B4] flex-shrink-0 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                </motion.button>
              );
            })}
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-2">
                <Database size={28} className="text-[#7A94B4] opacity-30" />
                <span className="text-[12px] text-[#7A94B4] opacity-60">No sources match filters</span>
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {selectedSource && (
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.22 }}
              className="flex-[45] border-l border-[rgba(46,127,255,0.2)] flex flex-col overflow-hidden bg-[#0A1628]"
            >
              <div className="flex items-start justify-between px-5 py-4 border-b border-[rgba(46,127,255,0.15)] flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${TYPE_COLOR[selectedSource.type]}`}>
                    {TYPE_ICON[selectedSource.type]}
                  </div>
                  <div>
                    <div className="text-[#EEF3FA] font-bold text-sm">{selectedSource.name}</div>
                    <div className={`flex items-center gap-1.5 text-[10px] font-semibold ${STATUS_CONFIG[selectedSource.status].text}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[selectedSource.status].dot}`} />
                      {STATUS_CONFIG[selectedSource.status].label}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedSource.status === 'error' && (
                    <button
                      onClick={() => onToast(`Retrying connection to ${selectedSource.name}…`, 'warning')}
                      className="flex items-center gap-1 text-[10px] text-amber-400 border border-amber-500/30 px-2 py-1 rounded-lg hover:bg-amber-500/10 transition-colors"
                    >
                      <RefreshCw size={10} /> Retry
                    </button>
                  )}
                  <button onClick={() => setSelectedSource(null)} className="text-[#7A94B4] hover:text-white transition-colors">
                    <X size={15} />
                  </button>
                </div>
              </div>

              <div className="flex gap-0 px-4 pt-3 border-b border-[rgba(46,127,255,0.1)] flex-shrink-0 overflow-x-auto no-scrollbar">
                {DRAWER_TABS.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setDrawerTab(tab)}
                    className={`text-[10px] px-3 py-2 font-semibold whitespace-nowrap transition-all border-b-2 ${
                      drawerTab === tab
                        ? 'text-[#2E7FFF] border-[#2E7FFF]'
                        : 'text-[#7A94B4] border-transparent hover:text-[#EEF3FA]'
                    }`}
                  >
                    {tab}
                    {tab === 'Logs' && selectedSource.errors.length > 0 && (
                      <span className="ml-1 text-[8px] bg-red-500 text-white rounded-full px-1">{selectedSource.errors.length}</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
                <DrawerContent source={selectedSource} tab={drawerTab} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
