import {
  LayoutDashboard, Map, AlertTriangle, CheckSquare, Calendar,
  Camera, BarChart2, Settings, ClipboardList, Scan, ListChecks,
  Package, Image, Home, Clock, History, Database, PlayCircle, Users, LayoutGrid,
} from 'lucide-react';
import type { Perspective, StrategicPage } from '@/App';

interface NavItem {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  page?: StrategicPage;
  active?: boolean;
  scanLink?: boolean;
}

const strategicItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard',          page: 'dashboard' },
  { icon: Map,             label: 'GIS Map',            page: 'dashboard' },
  { icon: LayoutGrid,      label: 'All Clients',        page: 'allclients' },
  { icon: Users,           label: 'Team',               page: 'team' },
  { icon: AlertTriangle,   label: 'Incidents',          page: 'incidents' },
  { icon: CheckSquare,     label: 'Tasks',              page: 'tasks' },
  { icon: Calendar,        label: 'PPM Schedule',       page: 'ppmschedule' },
  { icon: Camera,          label: 'AI Capture',         page: 'aicapture' },
  { icon: Database,        label: 'Data Sources',       page: 'datasources' },
  { icon: BarChart2,       label: 'Benchmark',          page: 'benchmark' },
  { icon: PlayCircle,      label: 'Operational Replay', page: 'replay' },
  { icon: Settings,        label: 'Settings', page: 'settings' },
];

const operationalItems: NavItem[] = [
  { icon: ClipboardList, label: 'My Task',     active: true },
  { icon: Scan,          label: 'Smart Scan',  active: true, scanLink: true },
  { icon: ListChecks,    label: 'Checklist',   active: true },
  { icon: Package,       label: 'Parts & PO',  active: true },
  { icon: Image,         label: 'Evidence' },
  { icon: Settings,      label: 'Settings' },
];

const clientItems: NavItem[] = [
  { icon: Home,     label: 'My Requests',  active: true },
  { icon: Clock,    label: 'Track Service', active: true },
  { icon: History,  label: 'History' },
  { icon: Settings, label: 'Settings' },
];

const itemSets: Record<Perspective, NavItem[]> = {
  strategic:   strategicItems,
  operational: operationalItems,
  client:      clientItems,
};

interface Props {
  perspective: Perspective;
  strategicPage: StrategicPage;
  onStrategicPageChange: (page: StrategicPage) => void;
  onToast: (msg: string) => void;
}

export function Sidebar({ perspective, strategicPage, onStrategicPageChange, onToast }: Props) {
  const items = itemSets[perspective];

  const isItemActive = (item: NavItem, idx: number): boolean => {
    if (perspective === 'strategic') {
      if (item.page) return item.page === strategicPage;
      return false;
    }
    return idx === 0 && (item.active ?? false);
  };

  const handleClick = (item: NavItem) => {
    if (item.scanLink) {
      window.location.href = import.meta.env.BASE_URL + 'scan/silicon-oasis/general';
      return;
    }
    if (perspective === 'strategic' && item.page) {
      onStrategicPageChange(item.page);
    } else if (!item.active && !item.page) {
      onToast(`${item.label} — available in full deployment`);
    }
  };

  return (
    <aside className="bg-[#0A1628] border-r border-[rgba(46,127,255,0.22)] flex flex-col items-center py-3 gap-1.5 z-[1000] relative" style={{ width: '52px' }}>
      {items.map((item, i) => {
        const Icon     = item.icon;
        const active   = isItemActive(item, i);
        const hasPage  = perspective === 'strategic' && !!item.page;
        const clickable = hasPage || item.active;

        return (
          <div key={i} className="relative group">
            <button
              onClick={() => handleClick(item)}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150 ${
                active
                  ? 'bg-[#2E7FFF] text-white shadow-lg shadow-blue-500/30'
                  : clickable
                  ? 'text-[#7A94B4] hover:bg-white/5 hover:text-[#EEF3FA] cursor-pointer'
                  : 'text-[#7A94B4] hover:bg-white/5 hover:text-[#EEF3FA] opacity-50'
              }`}
            >
              <Icon size={16} />
            </button>
            <div className="absolute left-11 top-1/2 -translate-y-1/2 bg-[#1A3260] border border-[rgba(46,127,255,0.3)] text-[#EEF3FA] text-[11px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              {item.label}
            </div>
          </div>
        );
      })}
    </aside>
  );
}
