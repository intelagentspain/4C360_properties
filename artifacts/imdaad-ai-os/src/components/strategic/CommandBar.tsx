import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Bell, ChevronDown, Zap, Bot, Hand, Plus, X, Building2, MapPin, FileText, User, Users, Sparkles, Loader2, MessageSquare, BookOpen, DollarSign, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemberProfiles } from '@/context/MemberProfilesContext';
import type { MockMemberProfile } from '@/data/mockData';
import { useMemberFilter, isFilterActive } from '@/context/MemberFilterContext';
import { useClients } from '@/context/ClientsContext';
import { WhatsAppModal } from '@/components/shared/WhatsAppModal';
import {
  COMMAND_FILTER_ALL_VALUES,
  COMMAND_SERVICE_OPTIONS,
  COMMAND_ZONE_OPTIONS,
  uniqueCommandOptions,
  type CommandFilterKey,
  type CommandFilters,
} from '@/lib/commandFilters';

export type AutomationMode = 'manual' | 'hybrid' | 'ai';

interface Props {
  onToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
  selectedFilters?: CommandFilters;
  onFiltersChange?: (filters: CommandFilters) => void;
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

export function AutomationModeSelector({
  mode,
  onModeChange,
  onToast,
  variant = 'button',
}: {
  mode: AutomationMode;
  onModeChange: (m: AutomationMode) => void;
  onToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
  variant?: 'button' | 'panel';
}) {
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const cfg = modeConfig[mode];
  const handleModeChange = (m: AutomationMode) => {
    onModeChange(m);
    setShowModeDropdown(false);
    onToast(`Automation mode set to ${modeConfig[m].label}`, m === 'ai' ? 'success' : 'info');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowModeDropdown(!showModeDropdown)}
        className={`flex items-center gap-1.5 border text-[11px] font-semibold transition-all duration-150 ${cfg.bg} ${cfg.color} border-current/30 ${
          variant === 'panel' ? 'h-9 rounded-lg px-3' : 'rounded-lg px-3 py-1.5'
        }`}
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
              className="absolute top-10 right-0 z-[200] bg-[#112040] border border-[rgba(46,127,255,0.3)] rounded-xl shadow-2xl w-56 overflow-hidden"
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
  );
}

const INITIALS_COLORS = [
  '#2E7FFF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
];

const INITIAL_CLIENT_DATA: ClientData[] = [
  { name: 'Silicon Oasis Authority', sector: 'Government', industrySubtype: '', contractType: 'FM Contract', contractStartDate: '', contractEndDate: '', slaTier: 'Gold', contractValue: '', numSites: '1', siteNames: ['Silicon Oasis'], totalAssets: '', assetCategories: [], assets: [], contactName: '', contactEmail: '', contactPhone: '', accountManager: '', initialsColor: '#2E7FFF', knowledgeBaseNotes: '', knowledgeBaseDocs: [], budgetAnnual: '', budgetCurrency: 'AED', budgetCostCentre: '', budgetApprovalThreshold: '', budgetServiceLines: [], inventoryItems: [] },
  { name: 'Emaar', sector: 'Real Estate', industrySubtype: '', contractType: 'Integrated FM', contractStartDate: '', contractEndDate: '', slaTier: 'Platinum', contractValue: '', numSites: '1', siteNames: ['Downtown Dubai'], totalAssets: '', assetCategories: [], assets: [], contactName: '', contactEmail: '', contactPhone: '', accountManager: '', initialsColor: '#10B981', knowledgeBaseNotes: '', knowledgeBaseDocs: [], budgetAnnual: '', budgetCurrency: 'AED', budgetCostCentre: '', budgetApprovalThreshold: '', budgetServiceLines: [], inventoryItems: [] },
  { name: 'DEWA', sector: 'Government', industrySubtype: '', contractType: 'Hard Services', contractStartDate: '', contractEndDate: '', slaTier: 'Gold', contractValue: '', numSites: '1', siteNames: ['HQ'], totalAssets: '', assetCategories: [], assets: [], contactName: '', contactEmail: '', contactPhone: '', accountManager: '', initialsColor: '#F59E0B', knowledgeBaseNotes: '', knowledgeBaseDocs: [], budgetAnnual: '', budgetCurrency: 'AED', budgetCostCentre: '', budgetApprovalThreshold: '', budgetServiceLines: [], inventoryItems: [] },
];

const CONTRACT_TYPES = ['FM Contract', 'Soft Services', 'Hard Services', 'Integrated FM', 'Consultancy'];
const SECTOR_OPTIONS = ['Real Estate', 'Retail', 'Hospitality', 'Healthcare', 'Government', 'Education', 'Industrial', 'Mixed-Use', 'Other'];
const SECTOR_SUBTYPES: Record<string, string[]> = {
  'Real Estate':  ['Mixed Residential', 'High-Rise Residential', 'Commercial Office', 'Retail Mall', 'Serviced Apartments', 'Villa Community'],
  'Retail':       ['Shopping Mall', 'Hypermarket', 'Strip Mall', 'Outlet Centre', 'High Street Retail'],
  'Hospitality':  ['Hotel', 'Resort', 'Serviced Hotel Apartments', 'F&B Complex', 'Convention Centre'],
  'Healthcare':   ['Hospital', 'Clinic', 'Medical Centre', 'Pharmaceutical Facility', 'Diagnostic Lab'],
  'Government':   ['Federal Entity', 'Municipality', 'Regulatory Authority', 'Public Infrastructure', 'Port / Airport'],
  'Education':    ['University', 'K–12 School', 'Vocational Institute', 'Research Campus'],
  'Industrial':   ['Warehouse / Logistics', 'Manufacturing Plant', 'Free Zone Facility', 'Data Centre'],
  'Mixed-Use':    ['Integrated Development', 'TOD / Transit Hub', 'Lifestyle Destination'],
  'Other':        ['Other'],
};
const SLA_TIERS      = ['Platinum', 'Gold', 'Silver', 'Bronze'];
const ASSET_CATEGORIES = ['HVAC', 'Electrical', 'Plumbing', 'Civil', 'Landscaping', 'Cleaning', 'Security', 'Elevators', 'Other'];
const TEAM_ROLES     = ['End Client', 'Account Manager', 'Site Supervisor', 'FM Engineer', 'Project Manager', 'Safety Officer', 'Business', 'Executive', 'Other'];

const ASSET_CONDITION_OPTS = ['Excellent', 'Good', 'Fair', 'Poor'];

interface SectorAssetDef {
  category: string;
  types: string[];
  defaultCondition: string;
  ppmNote: string;
  complianceNote: string;
}

const SECTOR_ASSET_MAP: Record<string, SectorAssetDef[]> = {
  'Healthcare': [
    { category: 'Medical Gas', types: ['Oxygen Pipeline', 'Vacuum System', 'Medical Air Compressor'], defaultCondition: 'Good', ppmNote: 'Monthly inspection required per DHA standards', complianceNote: 'Complies with DHA Medical Gas Guidelines' },
    { category: 'HVAC', types: ['Air Handling Unit', 'Fan Coil Unit', 'Chiller', 'Cooling Tower'], defaultCondition: 'Good', ppmNote: 'Quarterly maintenance; HEPA filter replacement every 6 months', complianceNote: 'Infection control HVAC per JCI/CBAHI standards' },
    { category: 'Nurse Call', types: ['Nurse Call Panel', 'Patient Bedhead Unit', 'Emergency Pull Cord'], defaultCondition: 'Good', ppmNote: 'Bi-annual testing and calibration', complianceNote: 'Must comply with HTM 08-03' },
    { category: 'Electrical', types: ['UPS System', 'Generator', 'LV Switchgear', 'Emergency Lighting'], defaultCondition: 'Good', ppmNote: 'Annual load testing; monthly battery checks', complianceNote: 'IEC 60364 & local DEWA standards' },
    { category: 'Plumbing', types: ['Hot & Cold Water System', 'Steam Boiler', 'Water Treatment Unit'], defaultCondition: 'Good', ppmNote: 'Quarterly legionella risk assessment', complianceNote: 'DHA water safety regulations' },
  ],
  'Hospitality': [
    { category: 'Chiller', types: ['Centrifugal Chiller', 'Screw Chiller', 'Absorption Chiller'], defaultCondition: 'Good', ppmNote: 'Quarterly servicing; annual refrigerant check', complianceNote: 'ASHRAE 15 refrigerant safety' },
    { category: 'Pool & Spa', types: ['Pool Pump', 'Filtration System', 'Spa Jet Pump', 'Pool Heating'], defaultCondition: 'Good', ppmNote: 'Weekly water quality checks; monthly equipment inspection', complianceNote: 'Dubai Municipality pool health standards' },
    { category: 'BMS', types: ['Building Management System', 'SCADA Panel', 'DDC Controller'], defaultCondition: 'Good', ppmNote: 'Semi-annual software audit and sensor calibration', complianceNote: 'DEWA smart building compliance' },
    { category: 'Kitchen', types: ['Commercial Range', 'Walk-in Refrigerator', 'Exhaust Hood', 'Dishwasher'], defaultCondition: 'Good', ppmNote: 'Monthly deep clean and grease trap inspection', complianceNote: 'Dubai Municipality food safety regulations' },
    { category: 'Elevators', types: ['Passenger Elevator', 'Service Elevator', 'Escalator'], defaultCondition: 'Good', ppmNote: 'Monthly inspection; annual load test', complianceNote: 'Dubai Municipality elevator regulations' },
  ],
  'Retail': [
    { category: 'Escalators', types: ['Passenger Escalator', 'Moving Walkway'], defaultCondition: 'Good', ppmNote: 'Monthly safety inspection; annual load test', complianceNote: 'BS EN 115 safety standard' },
    { category: 'CCTV', types: ['IP Camera', 'DVR/NVR System', 'Access Control Panel'], defaultCondition: 'Good', ppmNote: 'Quarterly camera alignment and recording verification', complianceNote: 'Dubai Police CCTV code of practice' },
    { category: 'Refrigeration', types: ['Display Case Refrigerator', 'Cold Storage Room', 'Ice Machine'], defaultCondition: 'Good', ppmNote: 'Monthly coil cleaning; quarterly refrigerant check', complianceNote: 'Food safety cold chain regulations' },
    { category: 'HVAC', types: ['Split AC', 'FAHU', 'Air Handling Unit', 'Chiller'], defaultCondition: 'Good', ppmNote: 'Quarterly filter replacement and coil cleaning', complianceNote: 'ASHRAE 62.1 ventilation standard' },
    { category: 'Fire Safety', types: ['Fire Alarm Panel', 'Sprinkler System', 'Fire Suppression System'], defaultCondition: 'Good', ppmNote: 'Monthly testing; annual full commissioning', complianceNote: 'DCD / NFPA 72 compliance' },
  ],
  'Real Estate': [
    { category: 'HVAC', types: ['Split AC', 'FAHU', 'Chiller', 'Cooling Tower', 'AHU'], defaultCondition: 'Good', ppmNote: 'Quarterly filter change; annual full service', complianceNote: 'ASHRAE 90.1 energy standard' },
    { category: 'Electrical', types: ['LV Panel', 'Transformer', 'Generator', 'Emergency Lighting'], defaultCondition: 'Good', ppmNote: 'Annual thermographic scan; monthly visual inspection', complianceNote: 'DEWA grid connection requirements' },
    { category: 'Elevators', types: ['Passenger Elevator', 'Goods Elevator'], defaultCondition: 'Good', ppmNote: 'Monthly inspection; annual load test', complianceNote: 'Dubai Municipality elevator regulations' },
    { category: 'Plumbing', types: ['Fire Fighting System', 'Water Tanks', 'Booster Pumps', 'Drainage'], defaultCondition: 'Good', ppmNote: 'Bi-annual tank cleaning; monthly pump checks', complianceNote: 'Dubai Civil Defense firefighting code' },
    { category: 'Security', types: ['CCTV System', 'Access Control', 'Intercom System'], defaultCondition: 'Good', ppmNote: 'Quarterly system audit and camera check', complianceNote: 'Dubai Police CCTV code of practice' },
  ],
  'Government': [
    { category: 'HVAC', types: ['Chiller', 'AHU', 'FCU', 'FAHU'], defaultCondition: 'Good', ppmNote: 'Quarterly full service; monthly filter checks', complianceNote: 'Dubai Government energy efficiency mandate' },
    { category: 'Electrical', types: ['LV Switchgear', 'UPS System', 'Generator', 'Solar PV'], defaultCondition: 'Good', ppmNote: 'Annual thermographic scan; monthly testing', complianceNote: 'DEWA net metering policy for solar' },
    { category: 'BMS', types: ['Building Management System', 'Energy Meters', 'DDC Controllers'], defaultCondition: 'Good', ppmNote: 'Semi-annual software audit and optimization', complianceNote: 'Smart Dubai green building requirements' },
    { category: 'Fire Safety', types: ['Fire Alarm Panel', 'Sprinkler System', 'Gas Suppression'], defaultCondition: 'Good', ppmNote: 'Monthly testing; annual commissioning', complianceNote: 'DCD / NFPA compliance' },
    { category: 'Security', types: ['CCTV', 'Biometric Access Control', 'Perimeter Fencing System'], defaultCondition: 'Good', ppmNote: 'Monthly system check and recording verification', complianceNote: 'Dubai Police security standards' },
  ],
  'Education': [
    { category: 'HVAC', types: ['Split AC', 'FAHU', 'Chiller', 'AHU'], defaultCondition: 'Good', ppmNote: 'Quarterly filter replacement; annual coil cleaning', complianceNote: 'KHDA building standards' },
    { category: 'Fire Safety', types: ['Fire Alarm Panel', 'Sprinkler System', 'Emergency Lighting'], defaultCondition: 'Good', ppmNote: 'Monthly testing; annual drill and commissioning', complianceNote: 'DCD / NFPA 72 & 13' },
    { category: 'Electrical', types: ['LV Distribution Board', 'UPS', 'Emergency Lighting'], defaultCondition: 'Good', ppmNote: 'Annual thermographic scan; monthly checks', complianceNote: 'DEWA standards' },
    { category: 'Plumbing', types: ['Water Tanks', 'Hot Water Boilers', 'Booster Pumps'], defaultCondition: 'Good', ppmNote: 'Quarterly legionella test; bi-annual tank clean', complianceNote: 'DM water safety guidelines' },
    { category: 'ICT', types: ['Server Room AC', 'UPS / PDU', 'Structured Cabling'], defaultCondition: 'Good', ppmNote: 'Monthly monitoring; annual infrastructure audit', complianceNote: 'TIA-942 data centre standard' },
  ],
  'Industrial': [
    { category: 'Mechanical', types: ['Compressors', 'Conveyors', 'Cooling Towers', 'Boilers'], defaultCondition: 'Good', ppmNote: 'Weekly vibration check; quarterly full maintenance', complianceNote: 'ISO 55001 asset management' },
    { category: 'Electrical', types: ['HV Switchgear', 'Transformers', 'VFDs', 'Motor Control Centers'], defaultCondition: 'Good', ppmNote: 'Monthly inspection; annual thermographic scan', complianceNote: 'IEC 61439 LV switchgear standard' },
    { category: 'Fire & Gas', types: ['Gas Detector', 'Flame Detector', 'Deluge System', 'CO2 System'], defaultCondition: 'Good', ppmNote: 'Monthly sensor calibration; quarterly system test', complianceNote: 'NFPA 72 / local DCD requirements' },
    { category: 'HVAC', types: ['Process Air Handling Unit', 'Dust Collector', 'Exhaust Fans'], defaultCondition: 'Good', ppmNote: 'Monthly filter service; quarterly duct inspection', complianceNote: 'ASHRAE industrial ventilation standards' },
    { category: 'Plumbing', types: ['Process Water System', 'Effluent Treatment Plant', 'Fire Fighting Pumps'], defaultCondition: 'Good', ppmNote: 'Weekly water quality test; quarterly pump checks', complianceNote: 'DM industrial effluent regulations' },
  ],
  'Mixed-Use': [
    { category: 'HVAC', types: ['District Cooling Connection', 'AHU', 'FCU', 'Chiller'], defaultCondition: 'Good', ppmNote: 'Quarterly service; annual energy audit', complianceNote: 'ASHRAE 90.1 / DEWA standards' },
    { category: 'Electrical', types: ['HV/LV Substation', 'Generator', 'UPS', 'Emergency Lighting'], defaultCondition: 'Good', ppmNote: 'Annual thermographic scan; monthly visual checks', complianceNote: 'DEWA grid connection requirements' },
    { category: 'Elevators', types: ['Passenger Elevator', 'Service Elevator', 'Escalator', 'Moving Walkway'], defaultCondition: 'Good', ppmNote: 'Monthly inspection; annual load test', complianceNote: 'Dubai Municipality elevator regulations' },
    { category: 'BMS', types: ['Integrated BMS', 'Energy Meters', 'Tenant Sub-metering'], defaultCondition: 'Good', ppmNote: 'Semi-annual audit; monthly data review', complianceNote: 'Smart Dubai green building requirements' },
    { category: 'Security', types: ['CCTV', 'Access Control', 'Perimeter Security', 'Parking Management'], defaultCondition: 'Good', ppmNote: 'Quarterly audit; monthly recording verification', complianceNote: 'Dubai Police CCTV code of practice' },
  ],
  'Other': [
    { category: 'HVAC', types: ['Split AC', 'Package Unit', 'AHU'], defaultCondition: 'Good', ppmNote: 'Quarterly filter replacement and coil cleaning', complianceNote: 'ASHRAE standards' },
    { category: 'Electrical', types: ['LV Panel', 'Emergency Lighting', 'Generator'], defaultCondition: 'Good', ppmNote: 'Annual thermographic scan; monthly checks', complianceNote: 'DEWA standards' },
    { category: 'Fire Safety', types: ['Fire Alarm Panel', 'Sprinkler System'], defaultCondition: 'Good', ppmNote: 'Monthly testing; annual commissioning', complianceNote: 'DCD / NFPA compliance' },
  ],
};

export interface AssetRow {
  id: string;
  assetName: string;
  category: string;
  type: string;
  assignedSite: string;
  quantity: string;
  installYear: string;
  condition: string;
  notes: string;
}

const EMPTY_ASSET = (): AssetRow => ({
  id: Math.random().toString(36).slice(2),
  assetName: '',
  category: '',
  type: '',
  assignedSite: '',
  quantity: '1',
  installYear: '',
  condition: '',
  notes: '',
});

const TYPE_LEVEL_NOTES: Record<string, { condition: string; ppmNote: string; complianceNote: string }> = {
  'Oxygen Pipeline':            { condition: 'Good', ppmNote: 'Monthly pressure & flow test; quarterly valve inspection', complianceNote: 'DHA Medical Gas Guidelines — mandatory annual certification' },
  'UPS System':                 { condition: 'Good', ppmNote: 'Monthly battery check; annual full-load test', complianceNote: 'IEC 62040-3 UPS standard; DEWA grid code' },
  'Generator':                  { condition: 'Good', ppmNote: 'Weekly run test; quarterly full-load exercise', complianceNote: 'NFPA 110 emergency power; Dubai Civil Defense approval' },
  'Centrifugal Chiller':        { condition: 'Good', ppmNote: 'Monthly oil/refrigerant check; annual oil analysis', complianceNote: 'ASHRAE 15 refrigerant safety; DEWA efficiency mandate' },
  'Pool Pump':                  { condition: 'Good', ppmNote: 'Weekly water quality test; monthly pump/filter service', complianceNote: 'Dubai Municipality pool health standards' },
  'Passenger Escalator':        { condition: 'Good', ppmNote: 'Monthly safety trip test; semi-annual brake inspection', complianceNote: 'BS EN 115; Dubai Municipality elevator regulations' },
  'IP Camera':                  { condition: 'Good', ppmNote: 'Quarterly lens/recording verification; annual firmware update', complianceNote: 'Dubai Police CCTV code of practice' },
  'Display Case Refrigerator':  { condition: 'Good', ppmNote: 'Monthly coil cleaning; quarterly refrigerant leak check', complianceNote: 'Food safety cold chain regulations — DM' },
  'Fire Alarm Panel':           { condition: 'Good', ppmNote: 'Monthly detector test; annual full commissioning', complianceNote: 'NFPA 72; Dubai Civil Defense fire code' },
  'Sprinkler System':           { condition: 'Good', ppmNote: 'Monthly valve inspection; annual flush & pressure test', complianceNote: 'NFPA 13; Dubai Civil Defense approval' },
  'Building Management System': { condition: 'Good', ppmNote: 'Semi-annual software audit; monthly sensor calibration', complianceNote: 'Smart Dubai green building requirements; DEWA BMS standard' },
  'Air Handling Unit':          { condition: 'Good', ppmNote: 'Quarterly filter replacement; annual coil & duct inspection', complianceNote: 'ASHRAE 62.1 indoor air quality; DEWA energy efficiency' },
  'Solar PV':                   { condition: 'Excellent', ppmNote: 'Bi-annual panel cleaning; annual inverter inspection', complianceNote: 'DEWA net metering policy; Dubai Clean Energy Strategy 2050' },
  'Biometric Access Control':   { condition: 'Good', ppmNote: 'Monthly database audit; quarterly hardware check', complianceNote: 'Dubai Police security standards; UAE data privacy law' },
  'Effluent Treatment Plant':   { condition: 'Good', ppmNote: 'Weekly effluent sampling; quarterly process audit', complianceNote: 'Dubai Municipality industrial effluent discharge standards' },
};

interface SubtypeHint {
  defaultCondition?: string;
  ppmNote?: string;
}

const INDUSTRY_SUBTYPE_ASSET_HINTS: Record<string, SubtypeHint> = {
  'Mixed Residential':  { ppmNote: 'Residential-grade maintenance schedule applies; coordinate with building management during off-peak hours' },
  'Office Tower':       { ppmNote: 'Business hours access constraints; ensure night/weekend maintenance windows' },
  'Luxury Hotel':       { defaultCondition: 'Excellent', ppmNote: 'Highest presentation standard required; use non-disruptive maintenance windows' },
  'Hospital':           { defaultCondition: 'Excellent', ppmNote: 'Infection control protocols mandatory; maintain 24/7 clinical environment' },
  'School':             { ppmNote: 'School holiday windows preferred for major works; adhere to KHDA building standards' },
  'Mall':               { ppmNote: 'Night maintenance windows (00:00–06:00); zero disruption to retail trading hours' },
  'Warehouse':          { ppmNote: 'Coordinate with operations team; priority on mechanical reliability' },
  'Data Centre':        { defaultCondition: 'Excellent', ppmNote: 'N+1 redundancy required; no single-point-of-failure maintenance; 24/7 monitoring' },
};

export interface KnowledgeBaseDoc {
  id: string;
  title: string;
  url: string;
}

export interface BudgetServiceLine {
  id: string;
  service: string;
  allocated: string;
  actual: string;
}

export interface InventoryItem {
  id: string;
  itemName: string;
  category: string;
  quantity: string;
  unit: string;
  site: string;
}

export interface ClientData {
  name: string;
  sector: string;
  industrySubtype: string;
  initialsColor: string;
  contractType: string;
  contractStartDate: string;
  contractEndDate: string;
  slaTier: string;
  contractValue: string;
  numSites: string;
  siteNames: string[];
  totalAssets: string;
  assetCategories: string[];
  assets: AssetRow[];
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  accountManager: string;
  knowledgeBaseNotes: string;
  knowledgeBaseDocs: KnowledgeBaseDoc[];
  budgetAnnual: string;
  budgetCurrency: string;
  budgetCostCentre: string;
  budgetApprovalThreshold: string;
  budgetServiceLines: BudgetServiceLine[];
  inventoryItems: InventoryItem[];
}

export type MemberPerspective = 'Strategic' | 'Operational' | 'Client';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  perspective: MemberPerspective;
  assignedClients: string[];
  zones: string[];
  skills: string[];
  responsibilities: string[];
  privileges: string[];
  mobile: string;
  whatsapp: string;
  location: string;
  availability: string;
  shift: string;
  commChannels: string[];
  photo?: string;
}

interface AddClientModalProps {
  onClose: () => void;
  onSave: (data: ClientData, teamMembers: TeamMember[], inviteOk: boolean, failedCount: number) => void;
}

const SECTION_ICONS = {
  business: <Building2 size={13} className="text-[#2E7FFF]" />,
  sites:    <MapPin size={13} className="text-[#2E7FFF]" />,
  contract: <FileText size={13} className="text-[#2E7FFF]" />,
  contact:  <User size={13} className="text-[#2E7FFF]" />,
  team:     <Users size={13} className="text-[#2E7FFF]" />,
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

function MultiSelectPill({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: string[];
  value: string[];
  onChange: (val: string[]) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const remaining = options.filter(o => !value.includes(o));

  const remove = (item: string) => onChange(value.filter(v => v !== item));
  const add = (item: string) => {
    onChange([...value, item]);
  };

  return (
    <div ref={ref} className="relative">
      <div
        className="min-h-[32px] w-full px-2 py-1 bg-[#0A1628] border border-[rgba(46,127,255,0.22)] rounded-lg flex flex-wrap gap-1 items-center cursor-pointer focus-within:border-[#2E7FFF] transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        {value.length === 0 && (
          <span className="text-[11px] text-[#4A6080] select-none">{placeholder ?? 'Select…'}</span>
        )}
        {value.map(item => (
          <span
            key={item}
            className="flex items-center gap-1 bg-[#2E7FFF]/15 border border-[#2E7FFF]/30 text-[#7BB4FF] text-[10px] px-1.5 py-0.5 rounded-md"
          >
            {item}
            <button
              type="button"
              aria-label={`Remove ${item}`}
              className="text-[#4A6080] hover:text-[#EEF3FA] transition-colors leading-none p-0.5 -mr-0.5 rounded"
              onClick={e => { e.stopPropagation(); remove(item); }}
            >
              <X size={9} />
            </button>
          </span>
        ))}
      </div>
      {open && remaining.length > 0 && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-[#0D1E35] border border-[rgba(46,127,255,0.22)] rounded-lg shadow-xl overflow-hidden max-h-44 overflow-y-auto">
          {remaining.map(option => (
            <button
              key={option}
              type="button"
              className="w-full text-left px-2.5 py-1.5 text-[11px] text-[#EEF3FA] hover:bg-[#2E7FFF]/10 transition-colors"
              onClick={e => { e.stopPropagation(); add(option); if (remaining.length === 1) setOpen(false); }}
            >
              {option}
            </button>
          ))}
        </div>
      )}
      {open && remaining.length === 0 && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-[#0D1E35] border border-[rgba(46,127,255,0.22)] rounded-lg shadow-xl px-2.5 py-2">
          <span className="text-[11px] text-[#4A6080] italic">All options selected</span>
        </div>
      )}
    </div>
  );
}

type Tab = 'business' | 'sites' | 'team' | 'knowledge' | 'budget' | 'inventory';

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'business',  label: 'Business',       icon: <Building2 size={11} /> },
  { key: 'sites',     label: 'Sites',           icon: <MapPin size={11} /> },
  { key: 'team',      label: 'Team',            icon: <Users size={11} /> },
  { key: 'knowledge', label: 'Knowledge Base',  icon: <BookOpen size={11} /> },
  { key: 'budget',    label: 'Budget',          icon: <DollarSign size={11} /> },
  { key: 'inventory', label: 'Inventory',       icon: <Package size={11} /> },
];

const RBAC_PRIVILEGES = [
  { key: 'view_dashboard',     label: 'View Dashboard' },
  { key: 'view_work_orders',   label: 'View Work Orders' },
  { key: 'create_work_orders', label: 'Create Work Orders' },
  { key: 'approve_dispatch',   label: 'Approve Dispatches' },
  { key: 'view_reports',       label: 'View Reports' },
  { key: 'export_reports',     label: 'Export Reports' },
  { key: 'manage_team',        label: 'Manage Team' },
  { key: 'manage_assets',      label: 'Manage Assets' },
  { key: 'manage_ppm',         label: 'Manage PPM Schedule' },
  { key: 'view_ai_insights',   label: 'AI Insights' },
  { key: 'configure_ai_rules', label: 'Configure AI Rules' },
  { key: 'approve_invoices',   label: 'Approve Invoices' },
  { key: 'manage_vendors',     label: 'Manage Vendors' },
  { key: 'edit_client_profile',label: 'Edit Property Profile' },
];

const ROLE_DEFAULT_PRIVILEGES: Record<string, string[]> = {
  'End Client':      ['view_dashboard', 'view_reports', 'view_work_orders'],
  'Account Manager': ['view_dashboard', 'view_work_orders', 'create_work_orders', 'view_reports', 'export_reports', 'manage_team', 'view_ai_insights'],
  'Site Supervisor': ['view_dashboard', 'view_work_orders', 'create_work_orders', 'approve_dispatch', 'manage_assets', 'manage_ppm'],
  'FM Engineer':     ['view_dashboard', 'view_work_orders', 'create_work_orders', 'manage_assets'],
  'Project Manager': ['view_dashboard', 'view_work_orders', 'create_work_orders', 'view_reports', 'export_reports', 'manage_ppm', 'manage_vendors'],
  'Safety Officer':  ['view_dashboard', 'view_work_orders', 'view_reports', 'manage_assets'],
  'Business':        ['view_dashboard', 'view_work_orders', 'view_reports', 'export_reports', 'view_ai_insights'],
  'Executive':       RBAC_PRIVILEGES.map(p => p.key),
};

const AVAILABILITY_OPTS = ['Full-time', 'Part-time', 'On-call', 'Contractor', 'Freelance'];
const SHIFT_OPTS = ['Business Hours (08:00–17:00)', 'Morning (06:00–14:00)', 'Afternoon (14:00–22:00)', 'Night (22:00–06:00)', 'Rotating / Flexible'];
const COMM_CHANNELS = [
  { key: 'whatsapp', label: 'WhatsApp',       icon: '💬' },
  { key: 'email',    label: 'Email',           icon: '✉️' },
  { key: 'phone',    label: 'Phone Call',      icon: '📞' },
  { key: 'teams',    label: 'Microsoft Teams', icon: '🟦' },
  { key: 'sms',      label: 'SMS',             icon: '📱' },
  { key: 'radio',    label: 'Walkie-Talkie',   icon: '📻' },
];

const PERSPECTIVE_OPTS: MemberPerspective[] = ['Strategic', 'Operational', 'Client'];

const ZONE_MULTI_OPTIONS = ['Cluster A', 'Cluster B', 'Block C', 'Recreation Area', 'Main Gate', 'Dubai Marina', 'Downtown', 'Dubai East', 'Jumeirah', 'Business Bay'];

const SKILL_OPTIONS = [
  'HVAC', 'Electrical', 'Plumbing', 'Civil Works', 'PPM Management',
  'Fire & Safety', 'Landscaping', 'Cleaning', 'Pest Control', 'MEP',
  'IT/AV', 'Sustainability',
];

const RESPONSIBILITY_OPTIONS = [
  'Manage assets',
  'Respond to critical incidents',
  'Conduct PPM inspections',
  'Approve work orders',
  'Oversee subcontractors',
  'Generate reports',
  'Coordinate property communication',
  'Perform site audits',
];

const EMPTY_MEMBER = (): TeamMember => ({
  id: Math.random().toString(36).slice(2, 10),
  name: '', email: '', role: '', perspective: 'Operational',
  assignedClients: [], zones: [], skills: [], responsibilities: [],
  privileges: [],
  mobile: '', whatsapp: '', location: '',
  availability: '', shift: '',
  commChannels: ['whatsapp', 'email'],
});

export function AddClientModal({ onClose, onSave }: AddClientModalProps) {
  const [activeTab, setActiveTab]             = useState<Tab>('business');
  const [name, setName]                       = useState('');
  const [sector, setSector]                   = useState('');
  const [industrySubtype, setIndustrySubtype] = useState('');
  const [initialsColor, setInitialsColor]     = useState(INITIALS_COLORS[0]);
  const [contractType, setContractType]       = useState('');
  const [contractStart, setContractStart]     = useState('');
  const [contractEnd, setContractEnd]         = useState('');
  const [slaTier, setSlaTier]                 = useState('');
  const [contractValue, setContractValue]     = useState('');
  const [siteNames, setSiteNames]             = useState<string[]>(['']);
  const [contactName, setContactName]         = useState('');
  const [contactEmail, setContactEmail]       = useState('');
  const [contactPhone, setContactPhone]       = useState('');
  const [accountManager, setAccountManager]   = useState('');

  const [teamMembers, setTeamMembers]         = useState<TeamMember[]>([EMPTY_MEMBER()]);
  const [siteAssets, setSiteAssets]           = useState<Record<number, AssetRow[]>>({ 0: [] });
  const [staffSearch, setStaffSearch]         = useState('');

  const [kbNotes, setKbNotes]                 = useState('');
  const [kbDocs, setKbDocs]                   = useState<KnowledgeBaseDoc[]>([]);

  const [budgetAnnual, setBudgetAnnual]               = useState('');
  const [budgetCurrency, setBudgetCurrency]           = useState('AED');
  const [budgetCostCentre, setBudgetCostCentre]       = useState('');
  const [budgetApprovalThreshold, setBudgetApprovalThreshold] = useState('');
  const [budgetServiceLines, setBudgetServiceLines]   = useState<BudgetServiceLine[]>([]);

  const [inventoryItems, setInventoryItems]   = useState<InventoryItem[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [suggestingSiteIdx, setSuggestingSiteIdx] = useState<number | null>(null);
  const [detectingSet, setDetectingSet] = useState<Set<number>>(new Set());
  const [geoErrors, setGeoErrors] = useState<Record<number, string>>({});
  const [whatsappTarget, setWhatsappTarget] = useState<{ name: string; phone: string; message: string } | null>(null);

  const { profiles } = useMemberProfiles();

  const detectSiteLocation = async (siteIdx: number) => {
    setGeoErrors(prev => { const next = { ...prev }; delete next[siteIdx]; return next; });
    setDetectingSet(prev => new Set(prev).add(siteIdx));
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 15000, enableHighAccuracy: true })
      );
      const { latitude, longitude } = pos.coords;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (!res.ok) throw new Error('Geocode failed');
      const data = await res.json();
      const addr = data.address ?? {};
      const parts = [
        addr.amenity || addr.building || addr.tourism || addr.office,
        addr.house_number ? `${addr.house_number} ${addr.road || addr.street || ''}`.trim() : (addr.road || addr.street || addr.pedestrian || addr.path),
        addr.suburb || addr.neighbourhood || addr.quarter || addr.residential,
        addr.city_district || addr.district,
        addr.city || addr.town || addr.village || addr.county,
      ].filter(Boolean);
      const label = parts.length ? parts.join(', ') : data.display_name ?? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      updateSite(siteIdx, label);
    } catch (err: unknown) {
      const msg = err instanceof GeolocationPositionError && err.code === 1
        ? 'Location permission denied'
        : 'Could not detect location';
      setGeoErrors(prev => ({ ...prev, [siteIdx]: msg }));
    } finally {
      setDetectingSet(prev => { const next = new Set(prev); next.delete(siteIdx); return next; });
    }
  };

  const addSite = () => {
    setSiteNames(prev => {
      const newIdx = prev.length;
      setSiteAssets(sa => ({ ...sa, [newIdx]: [] }));
      return [...prev, ''];
    });
  };
  const removeSite = (i: number) => {
    setSiteNames(prev => prev.filter((_, idx) => idx !== i));
    setSiteAssets(prev => {
      const next: Record<number, AssetRow[]> = {};
      let newIdx = 0;
      Object.keys(prev).forEach(k => {
        const ki = Number(k);
        if (ki !== i) { next[newIdx] = prev[ki]; newIdx++; }
      });
      return next;
    });
    setGeoErrors(prev => {
      const next: Record<number, string> = {};
      let newIdx = 0;
      Object.keys(prev).forEach(k => {
        const ki = Number(k);
        if (ki !== i) { next[newIdx] = prev[ki]; newIdx++; }
      });
      return next;
    });
  };
  const updateSite = (i: number, val: string) => {
    setSiteNames(prev => prev.map((s, idx) => (idx === i ? val : s)));
    setSiteAssets(prev => ({
      ...prev,
      [i]: (prev[i] ?? []).map(a => ({ ...a, assignedSite: val })),
    }));
  };

  const addAssetRowToSite = (siteIdx: number) => {
    const siteName = siteNames[siteIdx] ?? '';
    setSiteAssets(prev => ({
      ...prev,
      [siteIdx]: [...(prev[siteIdx] ?? []), { ...EMPTY_ASSET(), assignedSite: siteName }],
    }));
  };
  const removeAssetRowFromSite = (siteIdx: number, id: string) => {
    setSiteAssets(prev => ({
      ...prev,
      [siteIdx]: (prev[siteIdx] ?? []).filter(a => a.id !== id),
    }));
  };
  const updateAssetRowInSite = (siteIdx: number, id: string, field: keyof AssetRow, val: string) => {
    setSiteAssets(prev => ({
      ...prev,
      [siteIdx]: (prev[siteIdx] ?? []).map(a => {
        if (a.id !== id) return a;
        const updated = { ...a, [field]: val };
        if (field === 'category') updated.type = '';
        return updated;
      }),
    }));
    setErrors(e => { const n = { ...e }; delete n[`asset_${field}_${id}`]; return n; });
  };

  const aiSuggestAssetsForSite = async (siteIdx: number) => {
    setSuggestingSiteIdx(siteIdx);
    const siteName = siteNames[siteIdx] ?? '';
    try {
      const base = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';
      const res = await fetch(`${base}/api/suggest-assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sector,
          industrySubtype,
          siteNames: [siteName].filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json() as { success: boolean; assets?: AssetRow[] };
      if (!data.success || !Array.isArray(data.assets) || data.assets.length === 0) throw new Error('Empty response');
      setSiteAssets(prev => ({
        ...prev,
        [siteIdx]: data.assets!.map(a => ({ ...a, assignedSite: siteName })),
      }));
    } catch {
      const defs = SECTOR_ASSET_MAP[sector] ?? SECTOR_ASSET_MAP['Other'];
      const subtypeHint = industrySubtype ? INDUSTRY_SUBTYPE_ASSET_HINTS[industrySubtype] : undefined;
      const suggested: AssetRow[] = defs.map(def => {
        const primaryType = def.types[0];
        const typeLvl = TYPE_LEVEL_NOTES[primaryType];
        const condition = subtypeHint?.defaultCondition ?? typeLvl?.condition ?? def.defaultCondition;
        const ppmNote = subtypeHint?.ppmNote ?? typeLvl?.ppmNote ?? def.ppmNote;
        const complianceNote = typeLvl?.complianceNote ?? def.complianceNote;
        return {
          id: Math.random().toString(36).slice(2),
          assetName: primaryType,
          category: def.category,
          type: primaryType,
          assignedSite: siteName,
          quantity: '1',
          installYear: String(new Date().getFullYear() - 2),
          condition,
          notes: `${ppmNote} | ${complianceNote}`,
        };
      });
      setSiteAssets(prev => ({ ...prev, [siteIdx]: suggested }));
    } finally {
      setSuggestingSiteIdx(null);
    }
  };

  const aiSuggestRowInSite = (siteIdx: number, id: string) => {
    setSiteAssets(prev => ({
      ...prev,
      [siteIdx]: (prev[siteIdx] ?? []).map(a => {
        if (a.id !== id) return a;
        const defs = SECTOR_ASSET_MAP[sector] ?? SECTOR_ASSET_MAP['Other'];
        const def = defs.find(d => d.category === a.category) ?? defs[0];
        const typeLvl = TYPE_LEVEL_NOTES[a.type] ?? TYPE_LEVEL_NOTES[a.assetName];
        const subtypeHint = industrySubtype ? INDUSTRY_SUBTYPE_ASSET_HINTS[industrySubtype] : undefined;
        const condition = subtypeHint?.defaultCondition ?? typeLvl?.condition ?? (a.condition || def.defaultCondition);
        const ppmNote = subtypeHint?.ppmNote ?? typeLvl?.ppmNote ?? def.ppmNote;
        const complianceNote = typeLvl?.complianceNote ?? def.complianceNote;
        return { ...a, condition, notes: `${ppmNote} | ${complianceNote}` };
      }),
    }));
  };

  const allAssetRows = Object.values(siteAssets).flat();

  const addMember = () => setTeamMembers(prev => [...prev, EMPTY_MEMBER()]);
  const removeMember = (i: number) => setTeamMembers(prev => prev.filter((_, idx) => idx !== i));
  const addExistingStaff = (profile: MockMemberProfile) => {
    const member: TeamMember = {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      perspective: (profile.role === 'End Client' || profile.role === 'Client' || profile.role === 'Hotel Guest') ? 'Client' : (profile.perspective ?? 'Operational'),
      assignedClients: profile.assignedClients ?? [],
      zones: profile.zones ?? [],
      skills: Array.isArray(profile.skills)
        ? profile.skills
        : profile.skills ? [profile.skills as string] : [],
      responsibilities: Array.isArray(profile.responsibilities)
        ? profile.responsibilities
        : profile.responsibilities ? [profile.responsibilities as string] : [],
      privileges: profile.privileges ?? [],
      mobile: profile.mobile ?? '',
      whatsapp: profile.whatsapp ?? '',
      location: profile.location ?? '',
      availability: profile.availability ?? '',
      shift: profile.shift ?? '',
      commChannels: (profile.commChannels?.length ? profile.commChannels : ['whatsapp', 'email']),
    };
    setTeamMembers(prev => {
      const isEmpty = prev.length === 1 && !prev[0].name.trim() && !prev[0].email.trim() && !prev[0].role;
      return isEmpty ? [member] : [...prev, member];
    });
    setStaffSearch('');
  };
  const updateMember = (i: number, field: Exclude<keyof TeamMember, 'privileges' | 'commChannels' | 'assignedClients' | 'zones' | 'skills' | 'responsibilities'>, val: string) => {
    setTeamMembers(prev => {
      const updated = prev.map((m, idx) => {
        if (idx !== i) return m;
        const updated_m = { ...m, [field]: val };
        if (field === 'role' && val && ROLE_DEFAULT_PRIVILEGES[val]) {
          updated_m.privileges = [...ROLE_DEFAULT_PRIVILEGES[val]];
        }
        if (field === 'role' && val === 'End Client') {
          updated_m.perspective = 'Client';
        }
        return updated_m;
      });
      const hasComplete = updated.some(m => m.name.trim() && m.email.trim() && m.role);
      setErrors(e => {
        const n = { ...e };
        delete n[`team_${field}_${i}`];
        if (hasComplete) delete n.team_required;
        return n;
      });
      return updated;
    });
  };
  const updateMemberArray = (i: number, field: 'skills' | 'responsibilities', val: string[]) => {
    setTeamMembers(prev => prev.map((m, idx) => idx !== i ? m : { ...m, [field]: val }));
  };
  const toggleMemberClient = (i: number, client: string) => {
    setTeamMembers(prev => prev.map((m, idx) => {
      if (idx !== i) return m;
      const has = m.assignedClients.includes(client);
      return { ...m, assignedClients: has ? m.assignedClients.filter(c => c !== client) : [...m.assignedClients, client] };
    }));
  };
  const toggleMemberZone = (i: number, zone: string) => {
    setTeamMembers(prev => prev.map((m, idx) => {
      if (idx !== i) return m;
      const has = m.zones.includes(zone);
      return { ...m, zones: has ? m.zones.filter(z => z !== zone) : [...m.zones, zone] };
    }));
  };
  const togglePrivilege = (i: number, key: string) => {
    setTeamMembers(prev => prev.map((m, idx) => {
      if (idx !== i) return m;
      const has = m.privileges.includes(key);
      return { ...m, privileges: has ? m.privileges.filter(p => p !== key) : [...m.privileges, key] };
    }));
  };
  const toggleCommChannel = (i: number, key: string) => {
    setTeamMembers(prev => prev.map((m, idx) => {
      if (idx !== i) return m;
      const has = m.commChannels.includes(key);
      return { ...m, commChannels: has ? m.commChannels.filter(c => c !== key) : [...m.commChannels, key] };
    }));
  };

  const addKbDoc = () => setKbDocs(prev => [...prev, { id: Math.random().toString(36).slice(2), title: '', url: '' }]);
  const removeKbDoc = (id: string) => setKbDocs(prev => prev.filter(d => d.id !== id));
  const updateKbDoc = (id: string, field: 'title' | 'url', val: string) =>
    setKbDocs(prev => prev.map(d => d.id === id ? { ...d, [field]: val } : d));

  const SERVICE_LINE_OPTIONS = ['Cleaning', 'Security', 'MEP', 'Landscaping', 'Pest Control', 'Waste Management', 'HVAC', 'Electrical', 'Plumbing', 'Civil', 'Other'];
  const CURRENCY_OPTIONS = ['AED', 'USD', 'EUR', 'GBP', 'SAR', 'QAR'];
  const INVENTORY_CATEGORIES = ['Equipment', 'Consumables', 'Spare Parts', 'Safety', 'Cleaning Supplies', 'Tools', 'PPE', 'Office Supplies', 'Other'];
  const INVENTORY_UNITS = ['Pcs', 'Sets', 'Boxes', 'Litres', 'Kg', 'Metres', 'Rolls', 'Pairs', 'Units'];

  const addBudgetServiceLine = () =>
    setBudgetServiceLines(prev => [...prev, { id: Math.random().toString(36).slice(2), service: '', allocated: '', actual: '' }]);
  const removeBudgetServiceLine = (id: string) =>
    setBudgetServiceLines(prev => prev.filter(l => l.id !== id));
  const updateBudgetServiceLine = (id: string, field: 'service' | 'allocated' | 'actual', val: string) =>
    setBudgetServiceLines(prev => prev.map(l => l.id === id ? { ...l, [field]: val } : l));

  const addInventoryItem = () =>
    setInventoryItems(prev => [...prev, { id: Math.random().toString(36).slice(2), itemName: '', category: '', quantity: '1', unit: 'Pcs', site: siteNames[0] ?? '' }]);
  const removeInventoryItem = (id: string) =>
    setInventoryItems(prev => prev.filter(item => item.id !== id));
  const updateInventoryItem = (id: string, field: keyof InventoryItem, val: string) =>
    setInventoryItems(prev => prev.map(item => item.id === id ? { ...item, [field]: val } : item));

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim())          errs.name = 'Property name is required';
    if (!sector)               errs.sector = 'Sector is required';
    if (siteNames.filter(s => s.trim()).length === 0) errs.sites = 'At least one site is required';
    if (!contactName.trim())   errs.contactName = 'Contact name is required';

    allAssetRows.forEach(a => {
      const isPartial = a.assetName.trim() || a.category || a.type;
      if (isPartial) {
        if (!a.assetName.trim()) errs[`asset_assetName_${a.id}`] = 'Asset name required';
        if (!a.category)         errs[`asset_category_${a.id}`]  = 'Category required';
        if (!a.type)             errs[`asset_type_${a.id}`]      = 'Type required';
      }
    });

    const completedMembers = teamMembers.filter(m => m.name.trim() && m.email.trim() && m.role);
    if (completedMembers.length === 0) {
      errs.team_required = 'At least one team member with name, email, and role is required';
    }
    teamMembers.forEach((m, i) => {
      const isPartial = m.name.trim() || m.email.trim() || m.role;
      if (isPartial) {
        if (!m.name.trim())  errs[`team_name_${i}`]  = 'Name required';
        if (!m.email.trim()) errs[`team_email_${i}`] = 'Email required';
        if (!m.role)         errs[`team_role_${i}`]  = 'Role required';
      }
    });

    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      const teamErrKeys = Object.keys(errs).filter(k => k.startsWith('team_'));
      const assetErrKeys = Object.keys(errs).filter(k => k.startsWith('asset_'));
      if (teamErrKeys.length > 0 || errs.team_required) setActiveTab('team');
      else if (assetErrKeys.length > 0 || errs.sites) setActiveTab('sites');
      else if (errs.name || errs.sector || errs.contactName || errs.contractType || errs.contractStart || errs.slaTier) setActiveTab('business');
      return;
    }

    const filledMembers = teamMembers.filter(m => m.name.trim() && m.email.trim() && m.role);
    const compiledAssets = allAssetRows;
    const clientData: ClientData = {
      name: name.trim(),
      sector,
      industrySubtype,
      initialsColor,
      contractType,
      contractStartDate: contractStart,
      contractEndDate: contractEnd,
      slaTier,
      contractValue,
      numSites: String(siteNames.filter(s => s.trim()).length),
      siteNames: siteNames.filter(s => s.trim()),
      totalAssets: String(compiledAssets.length),
      assetCategories: [...new Set(compiledAssets.map(a => a.category).filter(Boolean))],
      assets: compiledAssets,
      contactName: contactName.trim(),
      contactEmail,
      contactPhone,
      accountManager,
      knowledgeBaseNotes: kbNotes,
      knowledgeBaseDocs: kbDocs,
      budgetAnnual,
      budgetCurrency,
      budgetCostCentre,
      budgetApprovalThreshold,
      budgetServiceLines,
      inventoryItems,
    };

    setIsSaving(true);
    let inviteOk = true;
    let failedCount = 0;
    try {
      const base = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';
      const res = await fetch(`${base}/api/clients/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: clientData.name,
          sector: clientData.sector,
          contractType: clientData.contractType,
          slaTier: clientData.slaTier,
          contractStartDate: clientData.contractStartDate,
          contractEndDate: clientData.contractEndDate,
          contractValue: clientData.contractValue,
          siteNames: clientData.siteNames,
          teamMembers: filledMembers.map(m => ({
            ...m,
            skills: m.skills.join(', '),
            responsibilities: m.responsibilities.join(', '),
          })),
        }),
      });
      if (res.ok) {
        const data = await res.json() as { results: { email: string; status: string }[] };
        failedCount = data.results.filter(r => r.status === 'failed').length;
        if (failedCount > 0) inviteOk = false;
      } else {
        inviteOk = false;
      }
    } catch {
      inviteOk = false;
    } finally {
      setIsSaving(false);
    }

    onSave(clientData, filledMembers, inviteOk, failedCount);
  };

  const clearErr = (key: string) => {
    if (errors[key]) setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const tabHasError = (tab: Tab): boolean => {
    if (tab === 'business') return !!(errors.name || errors.sector || errors.contactName || errors.contractType || errors.contractStart || errors.slaTier);
    if (tab === 'sites') return !!(errors.sites) || Object.keys(errors).some(k => k.startsWith('asset_'));
    if (tab === 'team') return !!(errors.team_required) || Object.keys(errors).some(k => k.startsWith('team_') && k !== 'team_required');
    return false;
  };

  return (
    <>
      {whatsappTarget && (
        <WhatsAppModal
          recipientName={whatsappTarget.name}
          recipientPhone={whatsappTarget.phone}
          defaultMessage={whatsappTarget.message}
          onClose={() => setWhatsappTarget(null)}
          onSent={n => setWhatsappTarget(null)}
          onError={() => setWhatsappTarget(null)}
        />
      )}
      <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -10 }}
        transition={{ duration: 0.18 }}
        className="fixed z-[2001] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[580px] max-h-[85vh] flex flex-col bg-[#0D1E38] border border-[rgba(46,127,255,0.3)] rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[rgba(46,127,255,0.15)] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#2E7FFF]/20 flex items-center justify-center">
              <Building2 size={14} className="text-[#2E7FFF]" />
            </div>
            <div>
              <div className="text-[#EEF3FA] text-sm font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Add New Property
              </div>
              <div className="text-[10px] text-[#7A94B4]">Complete all sections to onboard a new property</div>
            </div>
          </div>
          <button onClick={onClose} className="text-[#7A94B4] hover:text-white transition-colors rounded-md p-1 hover:bg-white/5">
            <X size={14} />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center gap-0.5 px-5 pt-3 pb-0 flex-shrink-0 border-b border-[rgba(46,127,255,0.12)]">
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            const hasErr = tabHasError(tab.key);
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold rounded-t-lg transition-all border-b-2 -mb-px relative ${
                  isActive
                    ? 'text-[#2E7FFF] border-[#2E7FFF] bg-[#2E7FFF]/08'
                    : 'text-[#7A94B4] border-transparent hover:text-[#EEF3FA] hover:bg-white/4'
                }`}
              >
                {tab.icon}
                {tab.label}
                {hasErr && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 absolute top-1.5 right-1.5" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar">

          {activeTab === 'business' && (
            <div className="space-y-4">
              <SectionHeader icon={SECTION_ICONS.business} title="Business Information" />
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <FieldLabel label="Property Name" required />
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
                      onChange={e => { setSector(e.target.value); setIndustrySubtype(''); clearErr('sector'); }}
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
                  <div className="relative">
                    <select
                      value={industrySubtype}
                      onChange={e => setIndustrySubtype(e.target.value)}
                      disabled={!sector}
                      className={`${selectCls} ${!sector ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <option value="" className="bg-[#0A1628]">
                        {sector ? 'Select sub-type…' : 'Select sector first…'}
                      </option>
                      {(SECTOR_SUBTYPES[sector] ?? []).map(sub => (
                        <option key={sub} value={sub} className="bg-[#0A1628]">{sub}</option>
                      ))}
                    </select>
                  </div>
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

                <div className="col-span-2">
                  <FieldLabel label="Contract Value (AED)" />
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#7A94B4] font-medium">AED</span>
                    <input
                      type="text"
                      value={contractValue}
                      onChange={e => setContractValue(e.target.value)}
                      placeholder="e.g. 1,200,000"
                      className={`${inputCls()} pl-9`}
                    />
                  </div>
                </div>
              </div>

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
                    placeholder="e.g. ahmed@property.ae"
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
          )}

          {activeTab === 'sites' && (
            <div className="space-y-3">
              <SectionHeader icon={SECTION_ICONS.sites} title="Sites & Assets" />

              <div className="flex items-center gap-3 text-[11px] text-[#7A94B4]">
                <span><span className="font-semibold text-[#EEF3FA]">{siteNames.length}</span> site{siteNames.length !== 1 ? 's' : ''}</span>
                <span className="text-[#2E3A52]">·</span>
                <span><span className="font-semibold text-[#EEF3FA]">{allAssetRows.length}</span> total asset{allAssetRows.length !== 1 ? 's' : ''}</span>
              </div>

              {errors.sites && <p className="text-[10px] text-red-400">{errors.sites}</p>}

              <div className="space-y-3">
                {siteNames.map((site, siteIdx) => {
                  const siteRows = siteAssets[siteIdx] ?? [];
                  const isSuggesting = suggestingSiteIdx === siteIdx;
                  const sectorDefs = SECTOR_ASSET_MAP[sector] ?? SECTOR_ASSET_MAP['Other'];
                  const siteCategories = sectorDefs.map(d => d.category);

                  return (
                    <div key={siteIdx} className="bg-[#0A1628] border border-[rgba(46,127,255,0.22)] rounded-xl overflow-hidden">
                      {/* Site header */}
                      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                        <MapPin size={11} className="text-[#2E7FFF] flex-shrink-0" />
                        <input
                          value={site}
                          onChange={e => { updateSite(siteIdx, e.target.value); clearErr('sites'); }}
                          placeholder={`Site ${siteIdx + 1} name or location`}
                          className={`flex-1 ${inputCls(siteIdx === 0 && !!errors.sites)}`}
                        />
                        <button
                          type="button"
                          title="Detect my location"
                          disabled={detectingSet.has(siteIdx)}
                          onClick={() => detectSiteLocation(siteIdx)}
                          className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-[#2E7FFF] hover:bg-[rgba(46,127,255,0.15)] rounded-lg transition-colors border border-[rgba(46,127,255,0.22)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {detectingSet.has(siteIdx)
                            ? <Loader2 size={11} className="animate-spin" />
                            : <MapPin size={11} />}
                        </button>
                        {siteNames.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSite(siteIdx)}
                            className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-[#7A94B4] hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors border border-[rgba(46,127,255,0.15)]"
                          >
                            <X size={11} />
                          </button>
                        )}
                      </div>
                      {geoErrors[siteIdx] && (
                        <p className="text-[10px] text-red-400 px-3 pb-1">{geoErrors[siteIdx]}</p>
                      )}

                      {/* Assets area */}
                      <div className="px-3 pb-3 space-y-2.5">
                        {/* AI Suggest strip */}
                        <div className="flex items-center justify-between bg-[rgba(46,127,255,0.05)] border border-[rgba(46,127,255,0.14)] rounded-lg px-2.5 py-2">
                          <p className="text-[10px] text-[#7A94B4]">
                            {siteRows.length > 0
                              ? <span><span className="text-[#EEF3FA] font-semibold">{siteRows.length}</span> asset{siteRows.length !== 1 ? 's' : ''} registered</span>
                              : 'No assets yet'}
                          </p>
                          <button
                            type="button"
                            onClick={() => aiSuggestAssetsForSite(siteIdx)}
                            disabled={isSuggesting || !sector}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-[#2E7FFF]/15 border border-[#2E7FFF]/35 text-[#2E7FFF] hover:bg-[#2E7FFF]/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                          >
                            {isSuggesting ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                            AI Suggest Assets
                          </button>
                        </div>

                        {/* Asset rows */}
                        {siteRows.map((asset) => {
                          const selectedDef = sectorDefs.find(d => d.category === asset.category);
                          const types = selectedDef ? selectedDef.types : [];
                          return (
                            <div
                              key={asset.id}
                              className="bg-[#0D1E38] border border-[rgba(46,127,255,0.15)] rounded-xl p-2.5 space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-bold text-[#4A6080] uppercase tracking-widest">Asset</span>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => aiSuggestRowInSite(siteIdx, asset.id)}
                                    disabled={!sector}
                                    title="AI fill condition & notes"
                                    className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-lg border border-[rgba(46,127,255,0.25)] text-[#2E7FFF] hover:bg-[#2E7FFF]/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    <Sparkles size={8} />
                                    AI Fill
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeAssetRowFromSite(siteIdx, asset.id)}
                                    className="flex items-center gap-1 text-[9px] text-[#7A94B4] hover:text-red-400 transition-colors"
                                  >
                                    <X size={9} />
                                    Remove
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <FieldLabel label="Asset Name" required />
                                  <input
                                    value={asset.assetName}
                                    onChange={e => updateAssetRowInSite(siteIdx, asset.id, 'assetName', e.target.value)}
                                    placeholder="e.g. Rooftop AHU-01"
                                    className={inputCls(!!errors[`asset_assetName_${asset.id}`])}
                                  />
                                  {errors[`asset_assetName_${asset.id}`] && (
                                    <p className="mt-0.5 text-[10px] text-red-400">{errors[`asset_assetName_${asset.id}`]}</p>
                                  )}
                                </div>

                                <div>
                                  <FieldLabel label="Category" required />
                                  <select
                                    value={asset.category}
                                    onChange={e => updateAssetRowInSite(siteIdx, asset.id, 'category', e.target.value)}
                                    className={`${selectCls} ${errors[`asset_category_${asset.id}`] ? 'border-red-500/60' : ''}`}
                                  >
                                    <option value="" className="bg-[#0A1628]">Select category…</option>
                                    {siteCategories.map(c => (
                                      <option key={c} value={c} className="bg-[#0A1628]">{c}</option>
                                    ))}
                                  </select>
                                  {errors[`asset_category_${asset.id}`] && (
                                    <p className="mt-0.5 text-[10px] text-red-400">{errors[`asset_category_${asset.id}`]}</p>
                                  )}
                                </div>

                                <div>
                                  <FieldLabel label="Type" required />
                                  <select
                                    value={asset.type}
                                    onChange={e => updateAssetRowInSite(siteIdx, asset.id, 'type', e.target.value)}
                                    className={`${selectCls} ${errors[`asset_type_${asset.id}`] ? 'border-red-500/60' : ''}`}
                                  >
                                    <option value="" className="bg-[#0A1628]">Select type…</option>
                                    {types.map(t => (
                                      <option key={t} value={t} className="bg-[#0A1628]">{t}</option>
                                    ))}
                                  </select>
                                  {errors[`asset_type_${asset.id}`] && (
                                    <p className="mt-0.5 text-[10px] text-red-400">{errors[`asset_type_${asset.id}`]}</p>
                                  )}
                                </div>

                                <div>
                                  <FieldLabel label="Quantity" />
                                  <input
                                    type="number"
                                    min="1"
                                    value={asset.quantity}
                                    onChange={e => updateAssetRowInSite(siteIdx, asset.id, 'quantity', e.target.value)}
                                    placeholder="1"
                                    className={inputCls()}
                                  />
                                </div>

                                <div>
                                  <FieldLabel label="Installation Year" />
                                  <input
                                    type="number"
                                    min="1990"
                                    max={new Date().getFullYear()}
                                    value={asset.installYear}
                                    onChange={e => updateAssetRowInSite(siteIdx, asset.id, 'installYear', e.target.value)}
                                    placeholder={String(new Date().getFullYear())}
                                    className={inputCls()}
                                  />
                                </div>

                                <div>
                                  <FieldLabel label="Condition" />
                                  <select
                                    value={asset.condition}
                                    onChange={e => updateAssetRowInSite(siteIdx, asset.id, 'condition', e.target.value)}
                                    className={selectCls}
                                  >
                                    <option value="" className="bg-[#0A1628]">Select…</option>
                                    {ASSET_CONDITION_OPTS.map(c => (
                                      <option key={c} value={c} className="bg-[#0A1628]">{c}</option>
                                    ))}
                                  </select>
                                </div>

                                <div className="col-span-2">
                                  <FieldLabel label="Notes / PPM Interval" />
                                  <input
                                    value={asset.notes}
                                    onChange={e => updateAssetRowInSite(siteIdx, asset.id, 'notes', e.target.value)}
                                    placeholder="e.g. Quarterly service; Annual refrigerant check"
                                    className={inputCls()}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        <button
                          type="button"
                          onClick={() => addAssetRowToSite(siteIdx)}
                          className="flex items-center gap-1.5 text-[10px] text-[#2E7FFF] hover:text-blue-300 transition-colors font-medium"
                        >
                          <Plus size={10} />
                          Add asset to this site
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={addSite}
                className="flex items-center gap-1.5 text-[11px] text-[#2E7FFF] hover:text-blue-300 transition-colors font-medium"
              >
                <Plus size={11} />
                Add another site
              </button>

              <div className="p-3 bg-[rgba(46,127,255,0.06)] border border-[rgba(46,127,255,0.15)] rounded-xl">
                <p className="text-[10px] text-[#7A94B4] leading-relaxed">
                  <span className="text-[#2E7FFF] font-semibold">Tip:</span> Enter each site name then add its assets inline. Asset registration is optional — partially entered rows must have a name, category, and type filled.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="space-y-4">
              <SectionHeader icon={SECTION_ICONS.team} title="Team Members" />
              <p className="text-[11px] text-[#7A94B4] -mt-2 mb-2 leading-relaxed">
                Invite team members to this property workspace. Each person will receive a welcome email with login credentials.
              </p>

              {/* Search existing staff */}
              <div>
                <div className="relative">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#4A6080] pointer-events-none" />
                  <input
                    value={staffSearch}
                    onChange={e => setStaffSearch(e.target.value)}
                    placeholder="Search existing staff by name or role…"
                    className="w-full bg-[#0A1628] border border-[rgba(46,127,255,0.18)] rounded-xl pl-7 pr-3 py-2 text-[11px] text-[#EEF3FA] placeholder:text-[#4A6080] focus:outline-none focus:border-[#2E7FFF] transition-colors"
                  />
                </div>
                {staffSearch.trim().length > 0 && (() => {
                  const q = staffSearch.trim().toLowerCase();
                  const addedEmails = new Set(teamMembers.map(m => m.email.trim().toLowerCase()));
                  const matches = profiles
                    .filter(p => (p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q)) && !addedEmails.has(p.email.trim().toLowerCase()))
                    .slice(0, 5);
                  return (
                    <div className="mt-1 bg-[#0A1628] border border-[rgba(46,127,255,0.18)] rounded-xl overflow-hidden">
                      {matches.length === 0 ? (
                        <p className="px-3 py-2 text-[10px] text-[#4A6080]">No matching staff found</p>
                      ) : matches.map((p, idx) => {
                        const color = INITIALS_COLORS[idx % INITIALS_COLORS.length];
                        const initials = p.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                        return (
                          <div key={p.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-[rgba(46,127,255,0.06)] transition-colors border-b border-[rgba(46,127,255,0.08)] last:border-0">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-bold text-white" style={{ backgroundColor: color }}>{initials}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-semibold text-[#EEF3FA] truncate">{p.name}</p>
                              <p className="text-[10px] text-[#7A94B4] truncate">{p.role}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => addExistingStaff(p)}
                              className="flex-shrink-0 text-[10px] font-semibold text-[#2E7FFF] hover:text-blue-300 bg-[rgba(46,127,255,0.1)] hover:bg-[rgba(46,127,255,0.18)] border border-[rgba(46,127,255,0.25)] px-2 py-0.5 rounded-lg transition-all"
                            >
                              Add
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-2 my-1">
                <div className="flex-1 border-t border-[rgba(46,127,255,0.12)]" />
                <span className="text-[10px] text-[#4A6080] whitespace-nowrap">or add new member</span>
                <div className="flex-1 border-t border-[rgba(46,127,255,0.12)]" />
              </div>

              <div className="space-y-3">
                {teamMembers.map((member, i) => {
                  const isExisting = profiles.some(p => p.id === member.id);
                  return (
                  <div
                    key={i}
                    className="bg-[#0A1628] border border-[rgba(46,127,255,0.18)] rounded-xl p-3 space-y-2.5 relative"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-[#4A6080] uppercase tracking-widest">Member {i + 1}</span>
                        {isExisting && (
                          <span className="ml-2 inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-0.5 rounded-full">
                            ● Existing Staff
                          </span>
                        )}
                      </div>
                      {teamMembers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMember(i)}
                          className="flex items-center gap-1 text-[10px] text-[#7A94B4] hover:text-red-400 transition-colors"
                        >
                          <X size={10} />
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <FieldLabel label="Full Name" required />
                        <input
                          value={member.name}
                          onChange={e => updateMember(i, 'name', e.target.value)}
                          placeholder="e.g. Ahmed Al Rashid"
                          className={inputCls(!!errors[`team_name_${i}`])}
                        />
                        {errors[`team_name_${i}`] && <p className="mt-0.5 text-[10px] text-red-400">{errors[`team_name_${i}`]}</p>}
                      </div>

                      <div>
                        <FieldLabel label="Email Address" required />
                        <input
                          type="email"
                          value={member.email}
                          onChange={e => updateMember(i, 'email', e.target.value)}
                          placeholder="e.g. ahmed@developmentx.ae"
                          className={inputCls(!!errors[`team_email_${i}`])}
                        />
                        {errors[`team_email_${i}`] && <p className="mt-0.5 text-[10px] text-red-400">{errors[`team_email_${i}`]}</p>}
                      </div>

                      <div>
                        <FieldLabel label="Role" required />
                        <select
                          value={member.role}
                          onChange={e => updateMember(i, 'role', e.target.value)}
                          className={`${selectCls} ${errors[`team_role_${i}`] ? 'border-red-500/60' : ''}`}
                        >
                          <option value="" className="bg-[#0A1628]">Select role…</option>
                          {TEAM_ROLES.map(r => (
                            <option key={r} value={r} className="bg-[#0A1628]">{r}</option>
                          ))}
                        </select>
                        {errors[`team_role_${i}`] && <p className="mt-0.5 text-[10px] text-red-400">{errors[`team_role_${i}`]}</p>}
                      </div>

                      <div>
                        <FieldLabel label="Dashboard Perspective" />
                        <select
                          value={member.perspective}
                          onChange={e => updateMember(i, 'perspective', e.target.value as MemberPerspective)}
                          className={selectCls}
                        >
                          {PERSPECTIVE_OPTS.map(p => (
                            <option key={p} value={p} className="bg-[#0A1628]">{p}</option>
                          ))}
                        </select>
                        <p className="mt-0.5 text-[9px] text-[#4A6080]">
                          {member.perspective === 'Strategic' ? 'KPIs, dispatch, AI rules, all properties' : member.perspective === 'Operational' ? 'Tasks, kanban, smart scan' : 'Service requests & tracking'}
                        </p>
                      </div>

                      <div className="col-span-2">
                        <FieldLabel label="Assigned Properties" />
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {INITIAL_CLIENT_DATA.map(c => {
                            const active = member.assignedClients.includes(c.name);
                            return (
                              <button
                                key={c.name}
                                type="button"
                                onClick={() => toggleMemberClient(i, c.name)}
                                className={`text-[10px] px-2 py-1 rounded-lg border transition-all font-medium ${
                                  active
                                    ? 'bg-[rgba(46,127,255,0.18)] border-[#2E7FFF] text-[#EEF3FA]'
                                    : 'border-[rgba(46,127,255,0.15)] text-[#7A94B4] hover:border-[rgba(46,127,255,0.35)] hover:text-[#EEF3FA]'
                                }`}
                              >
                                {active && <span className="mr-1 text-[#2E7FFF]">✓</span>}
                                {c.name}
                              </button>
                            );
                          })}
                        </div>
                        <p className="mt-1 text-[9px] text-[#4A6080]">Leave empty to grant access to all properties</p>
                      </div>

                      <div className="col-span-2">
                        <FieldLabel label="Geographical Zones" />
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {ZONE_MULTI_OPTIONS.map(z => {
                            const active = member.zones.includes(z);
                            return (
                              <button
                                key={z}
                                type="button"
                                onClick={() => toggleMemberZone(i, z)}
                                className={`text-[10px] px-2 py-1 rounded-lg border transition-all font-medium ${
                                  active
                                    ? 'bg-[rgba(46,127,255,0.18)] border-[#2E7FFF] text-[#EEF3FA]'
                                    : 'border-[rgba(46,127,255,0.15)] text-[#7A94B4] hover:border-[rgba(46,127,255,0.35)] hover:text-[#EEF3FA]'
                                }`}
                              >
                                {active && <span className="mr-1 text-[#2E7FFF]">✓</span>}
                                {z}
                              </button>
                            );
                          })}
                        </div>
                        <p className="mt-1 text-[9px] text-[#4A6080]">Dashboard map and dispatch panels will be pre-filtered to these zones</p>
                      </div>

                      <div className="col-span-2">
                        <FieldLabel label="Skills / Specialisation" />
                        <MultiSelectPill
                          options={SKILL_OPTIONS}
                          value={member.skills}
                          onChange={val => updateMemberArray(i, 'skills', val)}
                          placeholder="Select skills…"
                        />
                      </div>

                      <div className="col-span-2">
                        <FieldLabel label="Responsibilities" />
                        <MultiSelectPill
                          options={RESPONSIBILITY_OPTIONS}
                          value={member.responsibilities}
                          onChange={val => updateMemberArray(i, 'responsibilities', val)}
                          placeholder="Select responsibilities…"
                        />
                        <p className="mt-0.5 text-[9px] text-[#4A6080]">These will appear in the welcome email and on their personalized dashboard</p>
                      </div>

                      <div className="col-span-2">
                        <div className="flex items-center justify-between mb-1.5">
                          <FieldLabel label="Privileges" />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setTeamMembers(prev => prev.map((m, idx) => idx === i ? { ...m, privileges: RBAC_PRIVILEGES.map(p => p.key) } : m))}
                              className="text-[9px] text-[#2E7FFF] hover:text-blue-300 transition-colors"
                            >
                              Select all
                            </button>
                            <span className="text-[#7A94B4] opacity-30">|</span>
                            <button
                              type="button"
                              onClick={() => setTeamMembers(prev => prev.map((m, idx) => idx === i ? { ...m, privileges: [] } : m))}
                              className="text-[9px] text-[#7A94B4] hover:text-[#EEF3FA] transition-colors"
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {RBAC_PRIVILEGES.map(p => {
                            const active = member.privileges.includes(p.key);
                            return (
                              <button
                                key={p.key}
                                type="button"
                                onClick={() => togglePrivilege(i, p.key)}
                                className={`text-[10px] px-2 py-1 rounded-lg border transition-all font-medium ${
                                  active
                                    ? 'bg-[rgba(46,127,255,0.18)] border-[#2E7FFF] text-[#EEF3FA]'
                                    : 'border-[rgba(46,127,255,0.15)] text-[#7A94B4] hover:border-[rgba(46,127,255,0.35)] hover:text-[#EEF3FA]'
                                }`}
                              >
                                {active && <span className="mr-1 text-[#2E7FFF]">✓</span>}
                                {p.label}
                              </button>
                            );
                          })}
                        </div>
                        {member.privileges.length > 0 && (
                          <p className="mt-1.5 text-[9px] text-[#7A94B4]">{member.privileges.length} privilege{member.privileges.length !== 1 ? 's' : ''} selected</p>
                        )}
                      </div>

                      {/* ── Comm & Availability ── */}
                      <div className="col-span-2 pt-3 mt-1 border-t border-[rgba(46,127,255,0.12)]">
                        <p className="text-[9px] font-bold text-[#4A6080] uppercase tracking-widest mb-2.5">Comm &amp; Availability</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <FieldLabel label="Mobile Number" />
                            <input
                              value={member.mobile}
                              onChange={e => updateMember(i, 'mobile', e.target.value)}
                              placeholder="+971 50 000 0000"
                              className={inputCls()}
                            />
                          </div>
                          <div>
                            <FieldLabel label="WhatsApp Number" />
                            <div className="flex items-center gap-1.5">
                              <input
                                value={member.whatsapp}
                                onChange={e => updateMember(i, 'whatsapp', e.target.value)}
                                placeholder="+971 50 000 0000"
                                className={`${inputCls()} flex-1`}
                              />
                              <button
                                type="button"
                                title="Same as mobile"
                                onClick={() => updateMember(i, 'whatsapp', member.mobile)}
                                className="flex-shrink-0 text-[9px] px-1.5 py-1.5 rounded-lg border border-[rgba(46,127,255,0.2)] text-[#7A94B4] hover:text-[#EEF3FA] hover:border-[rgba(46,127,255,0.4)] transition-all whitespace-nowrap"
                              >
                                = Mobile
                              </button>
                              {member.whatsapp.trim() && (
                                <button
                                  type="button"
                                  title="Send WhatsApp"
                                  onClick={() => setWhatsappTarget({
                                    name: member.name || `Member ${i + 1}`,
                                    phone: member.whatsapp.trim(),
                                    message: `Hi ${member.name || 'there'}, welcome to DevelopmentX AI-OS! You have been added as ${member.role || 'a team member'}. Please check your email for login credentials.`,
                                  })}
                                  className="flex-shrink-0 p-1.5 rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-all"
                                >
                                  <MessageSquare size={11} />
                                </button>
                              )}
                            </div>
                          </div>
                          <div>
                            <FieldLabel label="Base Location" />
                            <input
                              value={member.location}
                              onChange={e => updateMember(i, 'location', e.target.value)}
                              placeholder="e.g. Silicon Oasis, Dubai"
                              className={inputCls()}
                            />
                          </div>
                          <div>
                            <FieldLabel label="Availability" />
                            <select
                              value={member.availability}
                              onChange={e => updateMember(i, 'availability', e.target.value)}
                              className={selectCls}
                            >
                              <option value="" className="bg-[#0A1628]">Select…</option>
                              {AVAILABILITY_OPTS.map(o => <option key={o} value={o} className="bg-[#0A1628]">{o}</option>)}
                            </select>
                          </div>
                          <div className="col-span-2">
                            <FieldLabel label="Shift" />
                            <select
                              value={member.shift}
                              onChange={e => updateMember(i, 'shift', e.target.value)}
                              className={selectCls}
                            >
                              <option value="" className="bg-[#0A1628]">Select shift…</option>
                              {SHIFT_OPTS.map(o => <option key={o} value={o} className="bg-[#0A1628]">{o}</option>)}
                            </select>
                          </div>
                          <div className="col-span-2">
                            <FieldLabel label="Preferred Comm Channels" />
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {COMM_CHANNELS.map(ch => {
                                const active = member.commChannels.includes(ch.key);
                                return (
                                  <button
                                    key={ch.key}
                                    type="button"
                                    onClick={() => toggleCommChannel(i, ch.key)}
                                    className={`flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-lg border transition-all font-medium ${
                                      active
                                        ? 'bg-[rgba(46,127,255,0.18)] border-[#2E7FFF] text-[#EEF3FA]'
                                        : 'border-[rgba(46,127,255,0.15)] text-[#7A94B4] hover:border-[rgba(46,127,255,0.35)] hover:text-[#EEF3FA]'
                                    }`}
                                  >
                                    <span>{ch.icon}</span>
                                    {ch.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={addMember}
                className="flex items-center gap-1.5 text-[11px] text-[#2E7FFF] hover:text-blue-300 transition-colors font-medium"
              >
                <Plus size={11} />
                Add another team member
              </button>

              {errors.team_required && (
                <p className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2">
                  {errors.team_required}
                </p>
              )}

              <div className="mt-1 p-3 bg-[rgba(46,127,255,0.06)] border border-[rgba(46,127,255,0.15)] rounded-xl">
                <p className="text-[10px] text-[#7A94B4] leading-relaxed">
                  <span className="text-[#2E7FFF] font-semibold">Note:</span> At least one team member with name, email, and role is required. Each invited member receives a welcome email with a platform access link.
                </p>
              </div>
            </div>
          )}

          {/* ── Knowledge Base Tab ── */}
          {activeTab === 'knowledge' && (
            <div className="space-y-4">
              <SectionHeader icon={<BookOpen size={13} className="text-[#2E7FFF]" />} title="Knowledge Base" />

              <div>
                <FieldLabel label="Notes / SOPs / Escalation Contacts" />
                <textarea
                  value={kbNotes}
                  onChange={e => setKbNotes(e.target.value)}
                  placeholder="Paste SOPs, escalation contacts, site notes, or any relevant information about this property..."
                  rows={6}
                  className={`${inputCls()} resize-none leading-relaxed`}
                />
                <p className="mt-0.5 text-[9px] text-[#4A6080]">Free-form notes - visible to the team in the property's knowledge panel</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <FieldLabel label="Documents & Links" />
                  <button
                    type="button"
                    onClick={addKbDoc}
                    className="flex items-center gap-1 text-[10px] text-[#2E7FFF] hover:text-blue-300 transition-colors font-medium"
                  >
                    <Plus size={10} />
                    Add document / link
                  </button>
                </div>

                {kbDocs.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-6 border border-dashed border-[rgba(46,127,255,0.2)] rounded-xl text-[#4A6080]">
                    <BookOpen size={20} className="mb-2 opacity-40" />
                    <p className="text-[11px]">No documents added yet</p>
                    <button
                      type="button"
                      onClick={addKbDoc}
                      className="mt-2 text-[10px] text-[#2E7FFF] hover:text-blue-300 transition-colors"
                    >
                      Add your first document or link
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  {kbDocs.map(doc => (
                    <div key={doc.id} className="flex items-start gap-2 p-2.5 bg-[#0A1628] border border-[rgba(46,127,255,0.15)] rounded-xl">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <div>
                          <FieldLabel label="Title / Description" />
                          <input
                            value={doc.title}
                            onChange={e => updateKbDoc(doc.id, 'title', e.target.value)}
                            placeholder="e.g. Fire Safety SOP"
                            className={inputCls()}
                          />
                        </div>
                        <div>
                          <FieldLabel label="URL or File Name" />
                          <input
                            value={doc.url}
                            onChange={e => updateKbDoc(doc.id, 'url', e.target.value)}
                            placeholder="https://… or filename.pdf"
                            className={inputCls()}
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeKbDoc(doc.id)}
                        className="mt-5 p-1 rounded-md text-[#4A6080] hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Budget Tab ── */}
          {activeTab === 'budget' && (
            <div className="space-y-4">
              <SectionHeader icon={<DollarSign size={13} className="text-[#2E7FFF]" />} title="Budget" />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel label="Annual Budget" />
                  <input
                    value={budgetAnnual}
                    onChange={e => setBudgetAnnual(e.target.value)}
                    placeholder="e.g. 2500000"
                    type="number"
                    min="0"
                    className={inputCls()}
                  />
                </div>
                <div>
                  <FieldLabel label="Currency" />
                  <select
                    value={budgetCurrency}
                    onChange={e => setBudgetCurrency(e.target.value)}
                    className={selectCls}
                  >
                    {CURRENCY_OPTIONS.map(c => (
                      <option key={c} value={c} className="bg-[#0A1628]">{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel label="Cost Centre Code" />
                  <input
                    value={budgetCostCentre}
                    onChange={e => setBudgetCostCentre(e.target.value)}
                    placeholder="e.g. CC-2024-FM-001"
                    className={inputCls()}
                  />
                </div>
                <div>
                  <FieldLabel label="Approval Threshold" />
                  <input
                    value={budgetApprovalThreshold}
                    onChange={e => setBudgetApprovalThreshold(e.target.value)}
                    placeholder="e.g. 10000"
                    type="number"
                    min="0"
                    className={inputCls()}
                  />
                  <p className="mt-0.5 text-[9px] text-[#4A6080]">Spend above this amount requires approval</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <FieldLabel label="Service Line Breakdown" />
                  <button
                    type="button"
                    onClick={addBudgetServiceLine}
                    className="flex items-center gap-1 text-[10px] text-[#2E7FFF] hover:text-blue-300 transition-colors font-medium"
                  >
                    <Plus size={10} />
                    Add service line
                  </button>
                </div>

                {budgetServiceLines.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-6 border border-dashed border-[rgba(46,127,255,0.2)] rounded-xl text-[#4A6080]">
                    <DollarSign size={20} className="mb-2 opacity-40" />
                    <p className="text-[11px]">No service lines added yet</p>
                    <button
                      type="button"
                      onClick={addBudgetServiceLine}
                      className="mt-2 text-[10px] text-[#2E7FFF] hover:text-blue-300 transition-colors"
                    >
                      Add your first service line
                    </button>
                  </div>
                )}

                {budgetServiceLines.length > 0 && (
                  <div className="rounded-xl border border-[rgba(46,127,255,0.15)] overflow-hidden">
                    <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-0 bg-[#0A1628]/80 border-b border-[rgba(46,127,255,0.1)] px-3 py-1.5">
                      <span className="text-[9px] font-bold text-[#4A6080] uppercase tracking-wider">Service Line</span>
                      <span className="text-[9px] font-bold text-[#4A6080] uppercase tracking-wider">Allocated ({budgetCurrency})</span>
                      <span className="text-[9px] font-bold text-[#4A6080] uppercase tracking-wider">Actual ({budgetCurrency})</span>
                      <span className="w-7" />
                    </div>
                    <div className="divide-y divide-[rgba(46,127,255,0.07)]">
                      {budgetServiceLines.map(line => (
                        <div key={line.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center px-3 py-2 bg-[#0A1628] hover:bg-[#0D1E38] transition-colors">
                          <select
                            value={line.service}
                            onChange={e => updateBudgetServiceLine(line.id, 'service', e.target.value)}
                            className={`${selectCls} text-[11px]`}
                          >
                            <option value="" className="bg-[#0A1628]">Select service…</option>
                            {SERVICE_LINE_OPTIONS.map(s => (
                              <option key={s} value={s} className="bg-[#0A1628]">{s}</option>
                            ))}
                          </select>
                          <input
                            value={line.allocated}
                            onChange={e => updateBudgetServiceLine(line.id, 'allocated', e.target.value)}
                            placeholder="0"
                            type="number"
                            min="0"
                            className={inputCls()}
                          />
                          <input
                            value={line.actual}
                            onChange={e => updateBudgetServiceLine(line.id, 'actual', e.target.value)}
                            placeholder="0"
                            type="number"
                            min="0"
                            className={inputCls()}
                          />
                          <button
                            type="button"
                            onClick={() => removeBudgetServiceLine(line.id)}
                            className="p-1 rounded-md text-[#4A6080] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                    {(budgetServiceLines.some(l => l.allocated) || budgetServiceLines.some(l => l.actual)) && (
                      <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center px-3 py-2 bg-[rgba(46,127,255,0.05)] border-t border-[rgba(46,127,255,0.1)]">
                        <span className="text-[10px] text-[#7A94B4] font-semibold">Totals</span>
                        <span className="text-[11px] text-[#2E7FFF] font-bold">
                          {budgetServiceLines.reduce((sum, l) => sum + (parseFloat(l.allocated) || 0), 0).toLocaleString()}
                        </span>
                        <span className="text-[11px] text-emerald-400 font-bold">
                          {budgetServiceLines.reduce((sum, l) => sum + (parseFloat(l.actual) || 0), 0).toLocaleString()}
                        </span>
                        <span className="w-7" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Inventory Tab ── */}
          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <SectionHeader icon={<Package size={13} className="text-[#2E7FFF]" />} title="Inventory" />

              <div className="flex items-center justify-between">
                <p className="text-[10px] text-[#7A94B4]">Track inventory items associated with this property</p>
                <button
                  type="button"
                  onClick={addInventoryItem}
                  className="flex items-center gap-1 text-[10px] text-[#2E7FFF] hover:text-blue-300 transition-colors font-medium"
                >
                  <Plus size={10} />
                  Add item
                </button>
              </div>

              {inventoryItems.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 border border-dashed border-[rgba(46,127,255,0.2)] rounded-xl text-[#4A6080]">
                  <Package size={24} className="mb-2 opacity-40" />
                  <p className="text-[11px]">No inventory items added yet</p>
                  <button
                    type="button"
                    onClick={addInventoryItem}
                    className="mt-2 text-[10px] text-[#2E7FFF] hover:text-blue-300 transition-colors"
                  >
                    Add your first item
                  </button>
                </div>
              )}

              {inventoryItems.length > 0 && (
                <div className="rounded-xl border border-[rgba(46,127,255,0.15)] overflow-hidden">
                  <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-0 bg-[#0A1628]/80 border-b border-[rgba(46,127,255,0.1)] px-3 py-1.5">
                    <span className="text-[9px] font-bold text-[#4A6080] uppercase tracking-wider">Item Name</span>
                    <span className="text-[9px] font-bold text-[#4A6080] uppercase tracking-wider">Category</span>
                    <span className="text-[9px] font-bold text-[#4A6080] uppercase tracking-wider">Qty</span>
                    <span className="text-[9px] font-bold text-[#4A6080] uppercase tracking-wider">Unit</span>
                    <span className="text-[9px] font-bold text-[#4A6080] uppercase tracking-wider">Site</span>
                    <span className="w-7" />
                  </div>
                  <div className="divide-y divide-[rgba(46,127,255,0.07)]">
                    {inventoryItems.map(item => (
                      <div key={item.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-2 items-center px-3 py-2 bg-[#0A1628] hover:bg-[#0D1E38] transition-colors">
                        <input
                          value={item.itemName}
                          onChange={e => updateInventoryItem(item.id, 'itemName', e.target.value)}
                          placeholder="e.g. Fire Extinguisher"
                          className={inputCls()}
                        />
                        <select
                          value={item.category}
                          onChange={e => updateInventoryItem(item.id, 'category', e.target.value)}
                          className={selectCls}
                        >
                          <option value="" className="bg-[#0A1628]">—</option>
                          {INVENTORY_CATEGORIES.map(c => (
                            <option key={c} value={c} className="bg-[#0A1628]">{c}</option>
                          ))}
                        </select>
                        <input
                          value={item.quantity}
                          onChange={e => updateInventoryItem(item.id, 'quantity', e.target.value)}
                          placeholder="1"
                          type="number"
                          min="0"
                          className={inputCls()}
                        />
                        <select
                          value={item.unit}
                          onChange={e => updateInventoryItem(item.id, 'unit', e.target.value)}
                          className={selectCls}
                        >
                          {INVENTORY_UNITS.map(u => (
                            <option key={u} value={u} className="bg-[#0A1628]">{u}</option>
                          ))}
                        </select>
                        <select
                          value={item.site}
                          onChange={e => updateInventoryItem(item.id, 'site', e.target.value)}
                          className={selectCls}
                        >
                          <option value="" className="bg-[#0A1628]">All sites</option>
                          {siteNames.filter(s => s.trim()).map(s => (
                            <option key={s} value={s} className="bg-[#0A1628]">{s}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => removeInventoryItem(item.id)}
                          className="p-1 rounded-md text-[#4A6080] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 bg-[rgba(46,127,255,0.05)] border-t border-[rgba(46,127,255,0.1)]">
                    <span className="text-[10px] text-[#7A94B4] font-semibold">{inventoryItems.length} item{inventoryItems.length !== 1 ? 's' : ''}</span>
                    <span className="text-[10px] text-[#7A94B4]">Total qty: {inventoryItems.reduce((s, i) => s + (parseFloat(i.quantity) || 0), 0).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          )}

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
            disabled={isSaving}
            className="flex-1 py-2 bg-[#2E7FFF] text-white text-xs font-semibold rounded-lg hover:bg-blue-500 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Sending invites…
              </>
            ) : (
              <>
                <Plus size={11} />
                Add Property
              </>
            )}
          </button>
        </div>
      </motion.div>
    </>
  );
}

const FILTER_LABELS: Record<CommandFilterKey, string> = {
  Client: 'Property',
  Zone: 'Zone',
  Service: 'Service',
};

interface ClientFilterOption {
  name: string;
  sector?: string;
  slaTier?: string;
  initialsColor: string;
}

export function CommandBar({ onToast, selectedFilters, onFiltersChange }: Props) {
  const { addProfiles }                         = useMemberProfiles();
  const memberFilter                            = useMemberFilter();
  const isMemberMode                            = isFilterActive(memberFilter);
  const { clients }                             = useClients();

  const initialSelected: CommandFilters = {
    Client: isMemberMode && memberFilter.assignedClients.length === 1
      ? memberFilter.assignedClients[0]
      : COMMAND_FILTER_ALL_VALUES.Client,
    Zone: isMemberMode && memberFilter.zones.length === 1
      ? memberFilter.zones[0]
      : COMMAND_FILTER_ALL_VALUES.Zone,
    Service: COMMAND_FILTER_ALL_VALUES.Service,
  };

  const [search, setSearch]                     = useState('');
  const [clientData, setClientData]             = useState<ClientData[]>(INITIAL_CLIENT_DATA);
  const [openFilter, setOpenFilter]             = useState<CommandFilterKey | null>(null);
  const [selected, setSelected]                 = useState<CommandFilters>(initialSelected);
  const [showAddClient, setShowAddClient]       = useState(false);

  const activeSelected = selectedFilters ?? selected;
  const updateSelected = (next: CommandFilters) => {
    setSelected(next);
    onFiltersChange?.(next);
  };

  const clientOptions = useMemo<ClientFilterOption[]>(() => {
    return uniqueCommandOptions([...clients.map(c => c.name), ...clientData.map(c => c.name)]).map((name, index) => {
      const portfolioClient = clients.find(c => c.name === name);
      const localClient = clientData.find(c => c.name === name);
      return {
        name,
        sector: portfolioClient?.sector ?? localClient?.sector,
        slaTier: portfolioClient?.contract.tier ?? localClient?.slaTier,
        initialsColor: localClient?.initialsColor ?? INITIALS_COLORS[index % INITIALS_COLORS.length],
      };
    });
  }, [clients, clientData]);

  const clientNames = [COMMAND_FILTER_ALL_VALUES.Client, ...clientOptions.map(c => c.name)];
  const selectedClientInfo = clientOptions.find(c => c.name === activeSelected.Client);

  const zoneOptions = useMemo(() => uniqueCommandOptions([
    COMMAND_FILTER_ALL_VALUES.Zone,
    ...clients.map(c => c.region),
    ...clients.flatMap(c => c.topSites.map(site => site.name)),
    ...COMMAND_ZONE_OPTIONS.filter(option => option !== COMMAND_FILTER_ALL_VALUES.Zone),
  ]), [clients]);

  const filters: Record<CommandFilterKey, string[]> = {
    Client:  clientNames,
    Zone:    zoneOptions,
    Service: COMMAND_SERVICE_OPTIONS,
  };

  const handleFilter = (key: CommandFilterKey, val: string) => {
    updateSelected({ ...activeSelected, [key]: val });
    setOpenFilter(null);
  };

  const handleAddClient = (data: ClientData, teamMembers: TeamMember[], inviteOk: boolean, failedCount: number) => {
    setClientData(prev => [...prev, data]);
    updateSelected({ ...activeSelected, Client: data.name });
    setShowAddClient(false);
    setOpenFilter(null);
    addProfiles(teamMembers);
    if (!inviteOk) {
      if (failedCount > 0) {
        onToast(
          `${data.name} added — ${failedCount} invite${failedCount > 1 ? 's' : ''} failed to send`,
          'warning'
        );
      } else {
        onToast(
          `${data.name} added — invites could not be delivered (check SMTP config)`,
          'warning'
        );
      }
    } else {
      onToast(
        `${data.name} added — invites sent to ${teamMembers.length} team member${teamMembers.length > 1 ? 's' : ''}`,
        'success'
      );
    }
  };

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
          {(Object.keys(filters) as CommandFilterKey[]).map(key => (
            <div key={key} className="relative">
              <button
                onClick={() => setOpenFilter(openFilter === key ? null : key)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-[11px] font-medium transition-all duration-150 ${
                  activeSelected[key] !== COMMAND_FILTER_ALL_VALUES[key]
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
                {FILTER_LABELS[key]}: <span className="text-[#EEF3FA] ml-0.5">{activeSelected[key].replace(COMMAND_FILTER_ALL_VALUES[key], 'All')}</span>
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
                        const info = key === 'Client' ? clientOptions.find(c => c.name === opt) : null;
                        return (
                          <button
                            key={opt}
                            onClick={() => handleFilter(key, opt)}
                            className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] transition-colors hover:bg-white/5 ${
                              activeSelected[key] === opt ? 'text-[#2E7FFF] font-semibold' : 'text-[#7A94B4]'
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
                            Add New Property
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
