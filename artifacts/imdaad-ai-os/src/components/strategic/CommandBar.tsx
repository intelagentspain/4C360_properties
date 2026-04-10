import { useState } from 'react';
import { Search, Bell, ChevronDown, Zap, Bot, Hand, Plus, X, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type AutomationMode = 'manual' | 'hybrid' | 'ai';

interface Props {
  mode: AutomationMode;
  onModeChange: (m: AutomationMode) => void;
  onToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

const modeConfig: Record<AutomationMode, { label: string; icon: React.ReactNode; color: string; bg: string; desc: string }> = {
  manual: {
    label: 'Manual',
    icon: <Hand size={12} />,
    color: 'text-[#7A94B4]',
    bg: 'bg-[#1A3260]',
    desc: 'All dispatch and assignment requires human approval',
  },
  hybrid: {
    label: 'Hybrid',
    icon: <Zap size={12} />,
    color: 'text-amber-400',
    bg: 'bg-amber-500/20',
    desc: 'AI suggests actions, supervisor confirms before executing',
  },
  ai: {
    label: 'AI Auto',
    icon: <Bot size={12} />,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/20',
    desc: 'AI dispatches and assigns autonomously within defined rules',
  },
};

const STATIC_FILTERS = {
  Zone:    ['All Zones', 'Cluster A', 'Cluster B', 'Block C', 'Recreation Area', 'Main Gate'],
  Service: ['All Services', 'HVAC', 'Plumbing', 'Electrical', 'General'],
};

const INITIAL_CLIENTS = ['All Clients', 'Silicon Oasis Authority', 'Emaar', 'DEWA'];

const CONTRACT_TYPES = ['FM Contract', 'Soft Services', 'Hard Services', 'Integrated FM', 'Consultancy'];
const ZONE_OPTIONS   = ['All Zones', 'Cluster A', 'Cluster B', 'Block C', 'Recreation Area', 'Main Gate'];

interface AddClientModalProps {
  onClose: () => void;
  onSave: (name: string, contractType: string, zone: string) => void;
}

function AddClientModal({ onClose, onSave }: AddClientModalProps) {
  const [name, setName]                 = useState('');
  const [contractType, setContractType] = useState(CONTRACT_TYPES[0]);
  const [zone, setZone]                 = useState(ZONE_OPTIONS[0]);
  const [error, setError]               = useState('');

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) { setError('Client name is required'); return; }
    onSave(trimmed, contractType, zone);
  };

  return (
    <>
      <div className="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -8 }}
        transition={{ duration: 0.15 }}
        className="fixed z-[2001] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] bg-[#112040] border border-[rgba(46,127,255,0.35)] rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(46,127,255,0.15)]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#2E7FFF]/20 flex items-center justify-center">
              <Building2 size={14} className="text-[#2E7FFF]" />
            </div>
            <div>
              <div className="text-[#EEF3FA] text-sm font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Add New Client
              </div>
              <div className="text-[10px] text-[#7A94B4]">Register a new client to the portfolio</div>
            </div>
          </div>
          <button onClick={onClose} className="text-[#7A94B4] hover:text-white transition-colors rounded-md p-1 hover:bg-white/5">
            <X size={14} />
          </button>
        </div>

        {/* Form */}
        <div className="px-5 py-4 space-y-4">
          {/* Client Name */}
          <div>
            <label className="block text-[11px] font-semibold text-[#7A94B4] uppercase tracking-wide mb-1.5">
              Client Name <span className="text-red-400">*</span>
            </label>
            <input
              autoFocus
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder="e.g. Dubai Marina Estate"
              className={`w-full px-3 py-2 bg-[#0A1628] border rounded-lg text-[12px] text-[#EEF3FA] placeholder-[#7A94B4] focus:outline-none transition-colors ${
                error ? 'border-red-500/60 focus:border-red-500' : 'border-[rgba(46,127,255,0.22)] focus:border-[#2E7FFF]'
              }`}
            />
            {error && <p className="mt-1 text-[10px] text-red-400">{error}</p>}
          </div>

          {/* Contract Type */}
          <div>
            <label className="block text-[11px] font-semibold text-[#7A94B4] uppercase tracking-wide mb-1.5">
              Contract Type
            </label>
            <select
              value={contractType}
              onChange={e => setContractType(e.target.value)}
              className="w-full px-3 py-2 bg-[#0A1628] border border-[rgba(46,127,255,0.22)] rounded-lg text-[12px] text-[#EEF3FA] focus:outline-none focus:border-[#2E7FFF] transition-colors appearance-none cursor-pointer"
            >
              {CONTRACT_TYPES.map(ct => (
                <option key={ct} value={ct} className="bg-[#0A1628]">{ct}</option>
              ))}
            </select>
          </div>

          {/* Zone */}
          <div>
            <label className="block text-[11px] font-semibold text-[#7A94B4] uppercase tracking-wide mb-1.5">
              Primary Zone
            </label>
            <select
              value={zone}
              onChange={e => setZone(e.target.value)}
              className="w-full px-3 py-2 bg-[#0A1628] border border-[rgba(46,127,255,0.22)] rounded-lg text-[12px] text-[#EEF3FA] focus:outline-none focus:border-[#2E7FFF] transition-colors appearance-none cursor-pointer"
            >
              {ZONE_OPTIONS.map(z => (
                <option key={z} value={z} className="bg-[#0A1628]">{z}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-[rgba(46,127,255,0.25)] text-[#7A94B4] text-xs rounded-lg hover:bg-white/5 hover:text-[#EEF3FA] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2 bg-[#2E7FFF] text-white text-xs font-semibold rounded-lg hover:bg-blue-500 transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus size={11} />
            Add Client
          </button>
        </div>
      </motion.div>
    </>
  );
}

type FilterKey = 'Client' | 'Zone' | 'Service';

export function CommandBar({ mode, onModeChange, onToast }: Props) {
  const [search, setSearch]                 = useState('');
  const [clients, setClients]               = useState<string[]>(INITIAL_CLIENTS);
  const [openFilter, setOpenFilter]         = useState<FilterKey | null>(null);
  const [selected, setSelected]             = useState<Record<FilterKey, string>>({
    Client: 'All Clients',
    Zone:   'All Zones',
    Service: 'All Services',
  });
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [showAddClient, setShowAddClient]       = useState(false);

  const filters: Record<FilterKey, string[]> = {
    Client:  clients,
    Zone:    STATIC_FILTERS.Zone,
    Service: STATIC_FILTERS.Service,
  };

  const handleModeChange = (m: AutomationMode) => {
    onModeChange(m);
    setShowModeDropdown(false);
    onToast(`Automation mode set to ${modeConfig[m].label}`, m === 'ai' ? 'success' : 'info');
  };

  const handleFilter = (key: FilterKey, val: string) => {
    setSelected(prev => ({ ...prev, [key]: val }));
    setOpenFilter(null);
  };

  const handleAddClient = (name: string, contractType: string, zone: string) => {
    setClients(prev => [...prev, name]);
    setSelected(prev => ({ ...prev, Client: name }));
    setShowAddClient(false);
    setOpenFilter(null);
    onToast(`${name} added — ${contractType} · ${zone}`, 'success');
  };

  const cfg = modeConfig[mode];

  return (
    <>
      <div className="h-11 bg-[#0A1628] border-b border-[rgba(46,127,255,0.22)] flex items-center gap-3 px-4 flex-shrink-0 relative z-[1000]">
        <div className="flex items-center gap-2 mr-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[#EEF3FA] text-xs font-bold tracking-wide" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Command Center
          </span>
        </div>

        <div className="w-px h-5 bg-[rgba(46,127,255,0.2)]" />

        <div className="flex items-center gap-1.5">
          {(Object.keys(filters) as FilterKey[]).map(key => (
            <div key={key} className="relative">
              <button
                onClick={() => setOpenFilter(openFilter === key ? null : key)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-[11px] font-medium transition-all duration-150 ${
                  selected[key] !== `All ${key}s`
                    ? 'border-[#2E7FFF] bg-[rgba(46,127,255,0.15)] text-[#EEF3FA]'
                    : 'border-[rgba(46,127,255,0.22)] text-[#7A94B4] hover:text-[#EEF3FA] hover:border-[rgba(46,127,255,0.4)]'
                }`}
              >
                {key}: <span className="text-[#EEF3FA] ml-0.5">{selected[key].replace(`All ${key}s`, 'All')}</span>
                <ChevronDown size={10} className={`transition-transform ${openFilter === key ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {openFilter === key && (
                  <>
                    <div className="fixed inset-0" onClick={() => setOpenFilter(null)} />
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.12 }}
                      className="absolute top-8 left-0 z-[200] bg-[#112040] border border-[rgba(46,127,255,0.3)] rounded-lg overflow-hidden shadow-xl w-44"
                    >
                      {filters[key].map(opt => (
                        <button
                          key={opt}
                          onClick={() => handleFilter(key, opt)}
                          className={`w-full text-left px-3 py-1.5 text-[11px] transition-colors hover:bg-white/5 ${
                            selected[key] === opt ? 'text-[#2E7FFF] font-semibold' : 'text-[#7A94B4]'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}

                      {/* "Add New Client" — only for Client dropdown */}
                      {key === 'Client' && (
                        <>
                          <div className="mx-3 my-1 border-t border-[rgba(46,127,255,0.15)]" />
                          <button
                            onClick={() => { setOpenFilter(null); setShowAddClient(true); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-[#2E7FFF] hover:bg-[rgba(46,127,255,0.08)] transition-colors font-semibold"
                          >
                            <Plus size={11} />
                            Add New Client
                          </button>
                        </>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <div className="flex-1 max-w-48">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7A94B4]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search incidents, assets…"
              className="w-full pl-7 pr-3 py-1 bg-[#112040] border border-[rgba(46,127,255,0.22)] rounded-md text-[11px] text-[#EEF3FA] placeholder-[#7A94B4] focus:outline-none focus:border-[#2E7FFF] transition-colors"
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowModeDropdown(!showModeDropdown)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-all duration-150 ${cfg.bg} ${cfg.color} border-current/30`}
            >
              {cfg.icon}
              {cfg.label}
              <ChevronDown size={10} className={`transition-transform ${showModeDropdown ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {showModeDropdown && (
                <>
                  <div className="fixed inset-0" onClick={() => setShowModeDropdown(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.97 }}
                    transition={{ duration: 0.12 }}
                    className="absolute top-9 right-0 z-[200] bg-[#112040] border border-[rgba(46,127,255,0.3)] rounded-xl shadow-2xl w-56 overflow-hidden"
                  >
                    <div className="px-3 py-2 border-b border-[rgba(46,127,255,0.12)]">
                      <span className="text-[10px] text-[#7A94B4] uppercase tracking-wider">Automation Mode</span>
                    </div>
                    {(Object.entries(modeConfig) as [AutomationMode, typeof modeConfig.manual][]).map(([key, val]) => (
                      <button
                        key={key}
                        onClick={() => handleModeChange(key)}
                        className={`w-full flex items-start gap-3 px-3 py-2.5 transition-colors hover:bg-white/5 ${mode === key ? 'bg-white/5' : ''}`}
                      >
                        <div className={`mt-0.5 ${val.color}`}>{val.icon}</div>
                        <div className="text-left">
                          <div className={`text-[12px] font-semibold ${val.color}`}>{val.label}</div>
                          <div className="text-[10px] text-[#7A94B4] leading-snug">{val.desc}</div>
                        </div>
                        {mode === key && <div className="ml-auto mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <button className="relative w-7 h-7 flex items-center justify-center text-[#7A94B4] hover:text-white transition-colors rounded-md hover:bg-white/5">
            <Bell size={14} />
            <span className="absolute top-0.5 right-0.5 w-3 h-3 bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center font-bold">3</span>
          </button>
        </div>
      </div>

      {/* Add New Client Modal */}
      <AnimatePresence>
        {showAddClient && (
          <AddClientModal
            onClose={() => setShowAddClient(false)}
            onSave={handleAddClient}
          />
        )}
      </AnimatePresence>
    </>
  );
}
