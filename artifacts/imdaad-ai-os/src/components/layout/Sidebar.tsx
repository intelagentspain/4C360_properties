import {
  LayoutDashboard, Map, AlertTriangle, CheckSquare, Calendar, Camera, BarChart2, Settings,
  ClipboardList, Scan, ListChecks, Package, Image, Home, Clock, History
} from 'lucide-react';

type Perspective = 'strategic' | 'operational' | 'client';

interface Props {
  perspective: Perspective;
  onToast: (msg: string) => void;
}

const strategicIcons = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
  { icon: Map, label: 'GIS Map', active: true },
  { icon: AlertTriangle, label: 'Incidents', active: false },
  { icon: CheckSquare, label: 'Tasks', active: false },
  { icon: Calendar, label: 'PPM Schedule', active: false },
  { icon: Camera, label: 'AI Capture', active: false },
  { icon: BarChart2, label: 'Reports', active: false },
  { icon: Settings, label: 'Settings', active: false },
];

const operationalIcons = [
  { icon: ClipboardList, label: 'My Task', active: true },
  { icon: Scan, label: 'Smart Scan', active: true },
  { icon: ListChecks, label: 'Checklist', active: true },
  { icon: Package, label: 'Parts & PO', active: true },
  { icon: Image, label: 'Evidence', active: false },
  { icon: Settings, label: 'Settings', active: false },
];

const clientIcons = [
  { icon: Home, label: 'My Requests', active: true },
  { icon: Clock, label: 'Track Service', active: true },
  { icon: History, label: 'History', active: false },
  { icon: Settings, label: 'Settings', active: false },
];

const iconSets: Record<Perspective, typeof strategicIcons> = {
  strategic: strategicIcons,
  operational: operationalIcons,
  client: clientIcons,
};

export function Sidebar({ perspective, onToast }: Props) {
  const icons = iconSets[perspective];
  return (
    <aside className="w-13 bg-[#0A1628] border-r border-[rgba(46,127,255,0.22)] flex flex-col items-center py-3 gap-1.5 z-[50]" style={{ width: '52px' }}>
      {icons.map(({ icon: Icon, label, active }, i) => (
        <div key={i} className="relative group">
          <button
            onClick={() => !active && onToast(`${label} — Available in full deployment`)}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150 ${
              i === 0 && active
                ? 'bg-[#2E7FFF] text-white shadow-lg shadow-blue-500/30'
                : 'text-[#7A94B4] hover:bg-white/5 hover:text-[#EEF3FA]'
            }`}
          >
            <Icon size={16} />
          </button>
          <div className="absolute left-11 top-1/2 -translate-y-1/2 bg-[#1A3260] border border-[rgba(46,127,255,0.3)] text-[#EEF3FA] text-[11px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            {label}
          </div>
        </div>
      ))}
    </aside>
  );
}
