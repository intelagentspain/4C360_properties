import { useState } from 'react';
import { Search, Bell, ChevronDown, Zap, Bot, Hand, Plus, X, Building2, MapPin, FileText, User } from 'lucide-react';
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

const INITIALS_COLORS = [
  '#2E7FFF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
];

const INITIAL_CLIENT_DATA: ClientData[] = [
  { name: 'Silicon Oasis Authority', sector: 'Government', industrySubtype: '', contractType: 'FM Contract', contractStartDate: '', contractEndDate: '', contractValue: '', slaTier: 'Gold', zone: 'All Zones', numSites: '1', siteNames: ['Silicon Oasis'], totalAssets: '', assetCategories: [], contactName: '', contactEmail: '', contactPhone: '', accountManager: '', initialsColor: '#2E7FFF' },
  { name: 'Emaar', sector: 'Real Estate', industrySubtype: '', contractType: 'Integrated FM', contractStartDate: '', contractEndDate: '', contractValue: '', slaTier: 'Platinum', zone: 'All Zones', numSites: '1', siteNames: ['Downtown Dubai'], totalAssets: '', assetCategories: [], contactName: '', contactEmail: '', contactPhone: '', accountManager: '', initialsColor: '#10B981' },
  { name: 'DEWA', sector: 'Government', industrySubtype: '', contractType: 'Hard Services', contractStartDate: '', contractEndDate: '', contractValue: '', slaTier: 'Gold', zone: 'All Zones', numSites: '1', siteNames: ['HQ'], totalAssets: '', assetCategories: [], contactName: '', contactEmail: '', contactPhone: '', accountManager: '', initialsColor: '#F59E0B' },
];

const CONTRACT_TYPES = ['FM Contract', 'Soft Services', 'Hard Services', 'Integrated FM', 'Consultancy'];
const ZONE_OPTIONS   = ['All Zones', 'Cluster A', 'Cluster B', 'Block C', 'Recreation Area', 'Main Gate'];
const SECTOR_OPTIONS = ['Real Estate', 'Retail', 'Hospitality', 'Healthcare', 'Government', 'Education', 'Industrial', 'Mixed-Use', 'Other'];
const SLA_TIERS      = ['Platinum', 'Gold', 'Silver', 'Bronze'];
const ASSET_CATEGORIES = ['HVAC', 'Electrical', 'Plumbing', 'Civil', 'Landscaping', 'Cleaning', 'Security', 'Elevators', 'Other'];

export interface ClientData {
  name: string;
  sector: string;
  industrySubtype: string;
  initialsColor: string;
  contractType: string;
  contractStartDate: string;
  contractEndDate: string;
  contractValue: string;
  slaTier: string;
  zone: string;
  numSites: string;
  siteNames: string[];
  totalAssets: string;
  assetCategories: string[];
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  accountManager: string;
}

interface AddClientModalProps {
  onClose: () => void;
  onSave: (data: ClientData) => void;
}

const SECTION_ICONS = {
  business: <Building2 size={13} className="text-[#2E7FFF]" />,
  sites:    <MapPin size={13} className="text-[#2E7FFF]" />,
  contract: <FileText size={13} className="text-[#2E7FFF]" />,
  contact:  <User size={13} className="text-[#2E7FFF]" />,
};

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-5 h-5 rounded-md bg-[#2E7FFF]/15 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <span className="text-[11px] font-bold text-[#2E7FFF] uppercase tracking-widest">{title}</span>
      <div className="flex-1 h-px bg-[rgba(46,127,255,0.15)]" />
    </div>
  );
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <label className="block text-[10px] font-semibold text-[#7A94B4] uppercase tracking-wide mb-1">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
  );
}

const inputCls = (hasErr?: boolean) =>
  `w-full px-2.5 py-1.5 bg-[#0A1628] border rounded-lg text-[11px] text-[#EEF3FA] placeholder-[#4A6080] focus:outline-none transition-colors ${
    hasErr
      ? 'border-red-500/60 focus:border-red-500'
      : 'border-[rgba(46,127,255,0.22)] focus:border-[#2E7FFF]'
  }`;

const selectCls = `w-full px-2.5 py-1.5 bg-[#0A1628] border border-[rgba(46,127,255,0.22)] rounded-lg text-[11px] text-[#EEF3FA] focus:outline-none focus:border-[#2E7FFF] transition-colors appearance-none cursor-pointer`;

function AddClientModal({ onClose, onSave }: AddClientModalProps) {
  const [name, setName]                       = useState('');
  const [sector, setSector]                   = useState('');
  const [industrySubtype, setIndustrySubtype] = useState('');
  const [initialsColor, setInitialsColor]     = useState(INITIALS_COLORS[0]);
  const [contractType, setContractType]       = useState('');
  const [contractStart, setContractStart]     = useState('');
  const [contractEnd, setContractEnd]         = useState('');
  const [contractValue, setContractValue]     = useState('');
  const [slaTier, setSlaTier]                 = useState('');
  const [zone, setZone]                       = useState(ZONE_OPTIONS[0]);
  const [siteNames, setSiteNames]             = useState<string[]>(['']);
  const [totalAssets, setTotalAssets]         = useState('');
  const [assetCategories, setAssetCategories] = useState<string[]>([]);
  const [contactName, setContactName]         = useState('');
  const [contactEmail, setContactEmail]       = useState('');
  const [contactPhone, setContactPhone]       = useState('');
  const [accountManager, setAccountManager]   = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleAsset = (cat: string) => {
    setAssetCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const addSite = () => setSiteNames(prev => [...prev, '']);
  const removeSite = (i: number) => setSiteNames(prev => prev.filter((_, idx) => idx !== i));
  const updateSite = (i: number, val: string) => {
    setSiteNames(prev => prev.map((s, idx) => (idx === i ? val : s)));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim())          errs.name = 'Client name is required';
    if (!sector)               errs.sector = 'Sector is required';
    if (siteNames.filter(s => s.trim()).length === 0) errs.sites = 'At least one site is required';
    if (!contractType)         errs.contractType = 'Contract type is required';
    if (!contractStart)        errs.contractStart = 'Start date is required';
    if (!slaTier)              errs.slaTier = 'SLA tier is required';
    if (!contactName.trim())   errs.contactName = 'Contact name is required';
    return errs;
  };

  const handleSave = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSave({
      name: name.trim(),
      sector,
      industrySubtype,
      initialsColor,
      contractType,
      contractStartDate: contractStart,
      contractEndDate: contractEnd,
      contractValue,
      slaTier,
      zone,
      numSites: String(siteNames.filter(s => s.trim()).length),
      siteNames: siteNames.filter(s => s.trim()),
      totalAssets,
      assetCategories,
      contactName: contactName.trim(),
      contactEmail,
      contactPhone,
      accountManager,
    });
  };

  const clearErr = (key: string) => {
    if (errors[key]) setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  return (
    <>
      <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -10 }}
        transition={{ duration: 0.18 }}
        className="fixed z-[2001] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] max-h-[85vh] flex flex-col bg-[#0D1E38] border border-[rgba(46,127,255,0.3)] rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[rgba(46,127,255,0.15)] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#2E7FFF]/20 flex items-center justify-center">
              <Building2 size={14} className="text-[#2E7FFF]" />
            </div>
            <div>
              <div className="text-[#EEF3FA] text-sm font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Add New Client
              </div>
              <div className="text-[10px] text-[#7A94B4]">Complete all sections to onboard a new client</div>
            </div>
          </div>
          <button onClick={onClose} className="text-[#7A94B4] hover:text-white transition-colors rounded-md p-1 hover:bg-white/5">
            <X size={14} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 custom-scrollbar">

          {/* ── Business Information ── */}
          <div>
            <SectionHeader icon={SECTION_ICONS.business} title="Business Information" />
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <FieldLabel label="Client Name" required />
                <input
                  autoFocus
                  value={name}
                  onChange={e => { setName(e.target.value); clearErr('name'); }}
                  placeholder="e.g. Dubai Marina Estate"
                  className={inputCls(!!errors.name)}
                />
                {errors.name && <p className="mt-0.5 text-[10px] text-red-400">{errors.name}</p>}
              </div>

              <div>
                <FieldLabel label="Sector" required />
                <div className="relative">
                  <select
                    value={sector}
                    onChange={e => { setSector(e.target.value); clearErr('sector'); }}
                    className={`${selectCls} ${errors.sector ? 'border-red-500/60' : ''}`}
                  >
                    <option value="" className="bg-[#0A1628]">Select sector…</option>
                    {SECTOR_OPTIONS.map(s => (
                      <option key={s} value={s} className="bg-[#0A1628]">{s}</option>
                    ))}
                  </select>
                </div>
                {errors.sector && <p className="mt-0.5 text-[10px] text-red-400">{errors.sector}</p>}
              </div>

              <div>
                <FieldLabel label="Industry Sub-type" />
                <input
                  value={industrySubtype}
                  onChange={e => setIndustrySubtype(e.target.value)}
                  placeholder="e.g. Mixed Residential"
                  className={inputCls()}
                />
              </div>

              <div className="col-span-2">
                <FieldLabel label="Initials Colour" />
                <div className="flex items-center gap-2 flex-wrap">
                  {INITIALS_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setInitialsColor(color)}
                      title={color}
                      className={`w-6 h-6 rounded-full border-2 transition-all flex-shrink-0 ${
                        initialsColor === color
                          ? 'border-white scale-110 shadow-lg'
                          : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <div className="flex items-center gap-1.5 ml-1">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: initialsColor }}
                    >
                      {name.trim() ? name.trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() : 'AB'}
                    </div>
                    <span className="text-[10px] text-[#7A94B4]">Preview</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Sites & Assets ── */}
          <div>
            <SectionHeader icon={SECTION_ICONS.sites} title="Sites & Assets" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel label="Number of Sites" />
                <div className={`${inputCls()} flex items-center text-[#7A94B4] cursor-default select-none`}>
                  {siteNames.length}
                  <span className="ml-1.5 text-[10px] text-[#4A6080]">(from site list below)</span>
                </div>
              </div>

              <div>
                <FieldLabel label="Total Asset Count" />
                <input
                  type="number"
                  min="0"
                  value={totalAssets}
                  onChange={e => setTotalAssets(e.target.value)}
                  placeholder="e.g. 250"
                  className={inputCls()}
                />
              </div>

              <div className="col-span-2">
                <FieldLabel label="Site Names / Locations" required />
                <div className="space-y-1.5">
                  {siteNames.map((site, i) => (
                    <div key={i} className="flex gap-1.5">
                      <input
                        value={site}
                        onChange={e => { updateSite(i, e.target.value); clearErr('sites'); }}
                        placeholder={`Site ${i + 1} name or location`}
                        className={`flex-1 ${inputCls(i === 0 && !!errors.sites)}`}
                      />
                      {siteNames.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSite(i)}
                          className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-[#7A94B4] hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors border border-[rgba(46,127,255,0.15)]"
                        >
                          <X size={11} />
                        </button>
                      )}
                    </div>
                  ))}
                  {errors.sites && <p className="text-[10px] text-red-400">{errors.sites}</p>}
                  <button
                    type="button"
                    onClick={addSite}
                    className="flex items-center gap-1.5 text-[11px] text-[#2E7FFF] hover:text-blue-300 transition-colors font-medium mt-0.5"
                  >
                    <Plus size={11} />
                    Add another site
                  </button>
                </div>
              </div>

              <div className="col-span-2">
                <FieldLabel label="Asset Categories" />
                <div className="grid grid-cols-3 gap-1.5">
                  {ASSET_CATEGORIES.map(cat => (
                    <label
                      key={cat}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] cursor-pointer transition-all ${
                        assetCategories.includes(cat)
                          ? 'border-[#2E7FFF] bg-[#2E7FFF]/15 text-[#EEF3FA]'
                          : 'border-[rgba(46,127,255,0.18)] text-[#7A94B4] hover:border-[rgba(46,127,255,0.35)] hover:text-[#EEF3FA]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={assetCategories.includes(cat)}
                        onChange={() => toggleAsset(cat)}
                        className="hidden"
                      />
                      <span className={`w-3 h-3 rounded border flex-shrink-0 flex items-center justify-center ${
                        assetCategories.includes(cat) ? 'bg-[#2E7FFF] border-[#2E7FFF]' : 'border-[rgba(46,127,255,0.3)]'
                      }`}>
                        {assetCategories.includes(cat) && (
                          <svg viewBox="0 0 8 8" className="w-2 h-2 fill-white">
                            <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" fill="none" />
                          </svg>
                        )}
                      </span>
                      {cat}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Contract Details ── */}
          <div>
            <SectionHeader icon={SECTION_ICONS.contract} title="Contract Details" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel label="Contract Type" required />
                <select
                  value={contractType}
                  onChange={e => { setContractType(e.target.value); clearErr('contractType'); }}
                  className={`${selectCls} ${errors.contractType ? 'border-red-500/60' : ''}`}
                >
                  <option value="" className="bg-[#0A1628]">Select type…</option>
                  {CONTRACT_TYPES.map(ct => (
                    <option key={ct} value={ct} className="bg-[#0A1628]">{ct}</option>
                  ))}
                </select>
                {errors.contractType && <p className="mt-0.5 text-[10px] text-red-400">{errors.contractType}</p>}
              </div>

              <div>
                <FieldLabel label="SLA Tier" required />
                <select
                  value={slaTier}
                  onChange={e => { setSlaTier(e.target.value); clearErr('slaTier'); }}
                  className={`${selectCls} ${errors.slaTier ? 'border-red-500/60' : ''}`}
                >
                  <option value="" className="bg-[#0A1628]">Select tier…</option>
                  {SLA_TIERS.map(t => (
                    <option key={t} value={t} className="bg-[#0A1628]">{t}</option>
                  ))}
                </select>
                {errors.slaTier && <p className="mt-0.5 text-[10px] text-red-400">{errors.slaTier}</p>}
              </div>

              <div>
                <FieldLabel label="Contract Start Date" required />
                <input
                  type="date"
                  value={contractStart}
                  onChange={e => { setContractStart(e.target.value); clearErr('contractStart'); }}
                  className={`${inputCls(!!errors.contractStart)} [color-scheme:dark]`}
                />
                {errors.contractStart && <p className="mt-0.5 text-[10px] text-red-400">{errors.contractStart}</p>}
              </div>

              <div>
                <FieldLabel label="Contract End Date" />
                <input
                  type="date"
                  value={contractEnd}
                  onChange={e => setContractEnd(e.target.value)}
                  className={`${inputCls()} [color-scheme:dark]`}
                />
              </div>

              <div>
                <FieldLabel label="Contract Value (AED)" />
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[#7A94B4] font-medium">AED</span>
                  <input
                    type="number"
                    min="0"
                    value={contractValue}
                    onChange={e => setContractValue(e.target.value)}
                    placeholder="0"
                    className={`${inputCls()} pl-10`}
                  />
                </div>
              </div>

              <div>
                <FieldLabel label="Primary Zone" />
                <select
                  value={zone}
                  onChange={e => setZone(e.target.value)}
                  className={selectCls}
                >
                  {ZONE_OPTIONS.map(z => (
                    <option key={z} value={z} className="bg-[#0A1628]">{z}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ── Primary Contact ── */}
          <div>
            <SectionHeader icon={SECTION_ICONS.contact} title="Primary Contact" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel label="Contact Name" required />
                <input
                  value={contactName}
                  onChange={e => { setContactName(e.target.value); clearErr('contactName'); }}
                  placeholder="e.g. Ahmed Al Mansouri"
                  className={inputCls(!!errors.contactName)}
                />
                {errors.contactName && <p className="mt-0.5 text-[10px] text-red-400">{errors.contactName}</p>}
              </div>

              <div>
                <FieldLabel label="Account Manager" />
                <input
                  value={accountManager}
                  onChange={e => setAccountManager(e.target.value)}
                  placeholder="e.g. Sara Hassan"
                  className={inputCls()}
                />
              </div>

              <div>
                <FieldLabel label="Contact Email" />
                <input
                  type="email"
                  value={contactEmail}
                  onChange={e => setContactEmail(e.target.value)}
                  placeholder="e.g. ahmed@client.ae"
                  className={inputCls()}
                />
              </div>

              <div>
                <FieldLabel label="Contact Phone" />
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={e => setContactPhone(e.target.value)}
                  placeholder="e.g. +971 50 123 4567"
                  className={inputCls()}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-[rgba(46,127,255,0.12)] flex gap-2 flex-shrink-0 bg-[#0A1628]/60">
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
  const [search, setSearch]                     = useState('');
  const [clientData, setClientData]             = useState<ClientData[]>(INITIAL_CLIENT_DATA);
  const [openFilter, setOpenFilter]             = useState<FilterKey | null>(null);
  const [selected, setSelected]                 = useState<Record<FilterKey, string>>({
    Client: 'All Clients',
    Zone:   'All Zones',
    Service: 'All Services',
  });
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [showAddClient, setShowAddClient]       = useState(false);

  const clientNames = ['All Clients', ...clientData.map(c => c.name)];
  const selectedClientInfo = clientData.find(c => c.name === selected.Client);

  const filters: Record<FilterKey, string[]> = {
    Client:  clientNames,
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

  const handleAddClient = (data: ClientData) => {
    setClientData(prev => [...prev, data]);
    setSelected(prev => ({ ...prev, Client: data.name }));
    setShowAddClient(false);
    setOpenFilter(null);
    onToast(
      `${data.name} added — ${data.sector} · ${data.contractType} · ${data.slaTier}`,
      'success'
    );
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
                {key === 'Client' && selectedClientInfo && (
                  <span
                    className="w-3.5 h-3.5 rounded flex-shrink-0 flex items-center justify-center text-[7px] font-bold text-white mr-0.5"
                    style={{ backgroundColor: selectedClientInfo.initialsColor }}
                  >
                    {selectedClientInfo.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
                  </span>
                )}
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
                      className={`absolute top-8 left-0 z-[200] bg-[#112040] border border-[rgba(46,127,255,0.3)] rounded-lg overflow-hidden shadow-xl ${key === 'Client' ? 'w-56' : 'w-44'}`}
                    >
                      {filters[key].map(opt => {
                        const info = key === 'Client' ? clientData.find(c => c.name === opt) : null;
                        return (
                          <button
                            key={opt}
                            onClick={() => handleFilter(key, opt)}
                            className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] transition-colors hover:bg-white/5 ${
                              selected[key] === opt ? 'text-[#2E7FFF] font-semibold' : 'text-[#7A94B4]'
                            }`}
                          >
                            {info && (
                              <span
                                className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center text-[8px] font-bold text-white"
                                style={{ backgroundColor: info.initialsColor }}
                              >
                                {info.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
                              </span>
                            )}
                            <span className="flex-1 text-left truncate">{opt}</span>
                            {info && (info.sector || info.slaTier) && (
                              <span className="text-[9px] text-[#4A6080] flex-shrink-0">
                                {[info.sector, info.slaTier].filter(Boolean).join(' · ')}
                              </span>
                            )}
                          </button>
                        );
                      })}

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
