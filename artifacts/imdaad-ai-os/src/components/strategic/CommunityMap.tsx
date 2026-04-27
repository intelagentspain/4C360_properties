import { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, CircleMarker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
  mockTechnicians, mockAssets,
  mockTasks, mockSLAZones, mockPredictedFailures,
} from '@/data/mockData';
import { PPMHistoryDrawer } from '@/components/shared/PPMHistoryDrawer';
import { useClients } from '@/context/ClientsContext';
import { useMemberFilter, isFilterActive } from '@/context/MemberFilterContext';
import { useIncidents } from '@/context/IncidentContext';
import type { Incident } from '@/context/IncidentContext';
import {
  X, Users, AlertTriangle, Layers, ClipboardList,
  ShieldAlert, Cpu, MapPin, Clock, Star, Wrench,
  Activity, ChevronRight, Package,
} from 'lucide-react';

const statusColors: Record<string, string> = {
  active: '#FF9B38',
  available: '#38D98A',
  transit: '#2E7FFF',
  overdue: '#FF4B4B',
};
const severityColors: Record<string, string> = {
  critical: '#FF4B4B',
  high: '#FF7A38',
  medium: '#FF9B38',
  low: '#2E7FFF',
};
const conditionColor = (c: number) => c >= 85 ? '#38D98A' : c >= 65 ? '#FF9B38' : '#FF4B4B';
const taskStatusColor: Record<string, string> = {
  'in-progress': '#2E7FFF',
  completed: '#38D98A',
  assigned: '#FF9B38',
  pending: '#7A94B4',
};

type LayerKey = 'technicians' | 'incidents' | 'assets' | 'tasks' | 'slaZones' | 'predictedFailures';

type DrawerItem =
  | { kind: 'tech'; data: typeof mockTechnicians[0] }
  | { kind: 'incident'; data: Incident }
  | { kind: 'asset'; data: typeof mockAssets[0] }
  | { kind: 'task'; data: typeof mockTasks[0] }
  | { kind: 'failure'; data: typeof mockPredictedFailures[0] };

function createTechIcon(tech: typeof mockTechnicians[0]) {
  const color = statusColors[tech.status] || '#7A94B4';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
    <circle cx="18" cy="18" r="16" fill="${color}" fill-opacity="0.25" stroke="${color}" stroke-width="2"/>
    <circle cx="18" cy="18" r="10" fill="${color}"/>
    <text x="18" y="22" text-anchor="middle" fill="white" font-size="8" font-weight="bold" font-family="sans-serif">${tech.id}</text>
  </svg>`;
  return L.divIcon({ html: svg, className: '', iconSize: [36, 36], iconAnchor: [18, 18] });
}

function createAssetIcon(status: string) {
  const color = status === 'ok' ? '#38D98A' : status === 'warning' ? '#FF9B38' : '#FF4B4B';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26">
    <rect x="3" y="3" width="20" height="20" rx="4" fill="${color}" fill-opacity="0.2" stroke="${color}" stroke-width="1.5"/>
    <rect x="8" y="8" width="10" height="10" rx="2" fill="${color}"/>
  </svg>`;
  return L.divIcon({ html: svg, className: '', iconSize: [26, 26], iconAnchor: [13, 13] });
}

function createTaskIcon(status: string) {
  const color = taskStatusColor[status] || '#7A94B4';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22">
    <polygon points="11,2 20,20 2,20" fill="${color}" fill-opacity="0.2" stroke="${color}" stroke-width="1.5"/>
    <polygon points="11,7 17,18 5,18" fill="${color}"/>
  </svg>`;
  return L.divIcon({ html: svg, className: '', iconSize: [22, 22], iconAnchor: [11, 11] });
}

function createFailureIcon(prob: number) {
  const color = prob >= 70 ? '#FF4B4B' : prob >= 50 ? '#FF9B38' : '#FFCC00';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
    <circle cx="15" cy="15" r="13" fill="${color}" fill-opacity="0.15" stroke="${color}" stroke-width="1.5" stroke-dasharray="4 2"/>
    <text x="15" y="20" text-anchor="middle" fill="${color}" font-size="10" font-weight="bold" font-family="sans-serif">⚠</text>
  </svg>`;
  return L.divIcon({ html: svg, className: '', iconSize: [30, 30], iconAnchor: [15, 15] });
}

function escapeSvgText(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function createClientMarkerIcon(name: string, riskLevel: string, marketLabel?: string) {
  const color = riskLevel === 'critical' ? '#FF4B4B' : riskLevel === 'high' ? '#FF7A38' : riskLevel === 'medium' ? '#FF9B38' : '#38D98A';
  const initials = name.split(' ').map(w => w[0]).join('').substring(0, 3).toUpperCase();
  const displayLabel = escapeSvgText(marketLabel ?? initials);
  const width = Math.max(52, (marketLabel ?? initials).length * 7 + 24);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="44" viewBox="0 0 ${width} 44">
    <rect x="1" y="1" width="${width - 2}" height="30" rx="8" fill="#0A1628" stroke="${color}" stroke-width="1.5"/>
    <rect x="1" y="1" width="${width - 2}" height="30" rx="8" fill="${color}" fill-opacity="0.18"/>
    <text x="${width / 2}" y="21" text-anchor="middle" fill="${color}" font-size="10" font-weight="700" font-family="sans-serif" letter-spacing="0.5">${displayLabel}</text>
    <polygon points="${width / 2 - 5},31 ${width / 2 + 5},31 ${width / 2},42" fill="${color}"/>
  </svg>`;
  return L.divIcon({ html: svg, className: '', iconSize: [width, 44], iconAnchor: [width / 2, 42] });
}

const layers: { key: LayerKey; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'technicians', label: 'Technicians', icon: <Users size={11} />, color: '#38D98A' },
  { key: 'incidents', label: 'Incidents', icon: <AlertTriangle size={11} />, color: '#FF4B4B' },
  { key: 'assets', label: 'Assets', icon: <Package size={11} />, color: '#2E7FFF' },
  { key: 'tasks', label: 'Tasks', icon: <ClipboardList size={11} />, color: '#FF9B38' },
  { key: 'slaZones', label: 'SLA Zones', icon: <ShieldAlert size={11} />, color: '#FF7A38' },
  { key: 'predictedFailures', label: 'Predicted Failures', icon: <Cpu size={11} />, color: '#FFCC00' },
];

interface MapDrawerProps {
  item: DrawerItem | null;
  onClose: () => void;
  onToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
  onViewHistory: (asset: typeof mockAssets[0]) => void;
}

function MapDrawer({ item, onClose, onToast, onViewHistory }: MapDrawerProps) {
  return (
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 340, damping: 32 }}
          className="absolute top-0 right-0 bottom-0 w-64 z-[800] bg-[rgba(10,18,38,0.97)] border-l border-[rgba(46,127,255,0.3)] flex flex-col backdrop-blur-xl"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(46,127,255,0.15)] flex-shrink-0">
            <span className="text-[11px] font-bold text-[#EEF3FA] uppercase tracking-wider">
              {item.kind === 'tech' ? 'Technician' :
               item.kind === 'incident' ? 'Incident' :
               item.kind === 'asset' ? 'Asset' :
               item.kind === 'task' ? 'Task' : 'Predicted Failure'}
            </span>
            <button onClick={onClose} className="text-[#7A94B4] hover:text-white transition-colors"><X size={14} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {item.kind === 'tech' && <TechDetail data={item.data} onToast={onToast} onClose={onClose} />}
            {item.kind === 'incident' && <IncidentDetail data={item.data} onToast={onToast} onClose={onClose} />}
            {item.kind === 'asset' && <AssetDetail data={item.data} onToast={onToast} onClose={onClose} onViewHistory={onViewHistory} />}
            {item.kind === 'task' && <TaskDetail data={item.data} onToast={onToast} onClose={onClose} />}
            {item.kind === 'failure' && <FailureDetail data={item.data} onToast={onToast} onClose={onClose} />}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[10px] text-[#7A94B4]">{label}</span>
      <span className={`text-[11px] font-medium ${accent ? 'text-amber-400' : 'text-[#EEF3FA]'}`}>{value}</span>
    </div>
  );
}

function ActionBtn({ children, primary, onClick }: { children: React.ReactNode; primary?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-colors ${
        primary
          ? 'bg-[#2E7FFF] text-white hover:bg-blue-500'
          : 'border border-[rgba(46,127,255,0.3)] text-[#7A94B4] hover:text-white hover:bg-white/5'
      }`}
    >
      {children}
    </button>
  );
}

function TechDetail({ data, onToast, onClose }: { data: typeof mockTechnicians[0]; onToast: (m: string, t?: any) => void; onClose: () => void }) {
  const color = statusColors[data.status] || '#7A94B4';
  return (
    <>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: `linear-gradient(135deg, ${color}, #0A1628)` }}>{data.id}</div>
        <div>
          <div className="text-[#EEF3FA] font-bold text-sm">{data.name}</div>
          <div className="text-[10px] capitalize" style={{ color }}>{data.status.replace('-', ' ')}</div>
        </div>
      </div>
      <div className="bg-[#0A1628] rounded-xl p-3 space-y-2">
        <Row label="Skill" value={data.skill} />
        <Row label="Rating" value={`★ ${data.rating}`} accent />
        <Row label="Jobs Completed" value={String(data.jobsCompleted)} />
        {data.job && <Row label="Current Job" value={data.job} />}
        <Row label="Location" value="Silicon Oasis" />
      </div>
      <div className="flex gap-2">
        <ActionBtn primary onClick={() => { onToast(`Viewing task for ${data.name}`, 'info'); onClose(); }}>View Task</ActionBtn>
        <ActionBtn onClick={() => { onToast(`Reassigning ${data.name}`, 'warning'); onClose(); }}>Reassign</ActionBtn>
      </div>
    </>
  );
}

function IncidentDetail({ data, onToast, onClose }: { data: Incident; onToast: (m: string, t?: any) => void; onClose: () => void }) {
  const color = severityColors[data.severity];
  const slaLeft = data.slaMinutes - data.elapsed;
  return (
    <>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: color + '30', color }}>{data.severity.toUpperCase()}</span>
          <span className="text-[10px] text-[#7A94B4]">{data.id}</span>
        </div>
        <div className="text-[#EEF3FA] font-bold text-sm">{data.title}</div>
      </div>
      <div className="bg-[#0A1628] rounded-xl p-3 space-y-2">
        <Row label="Location" value={data.location} />
        <Row label="Source" value={data.source} />
        <Row label="Reported" value={`${data.elapsed} min ago`} />
        <Row label="SLA Remaining" value={`${slaLeft} min`} accent={slaLeft < 20} />
      </div>
      <div className="bg-[#0A1628] rounded-xl p-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-[#7A94B4]">SLA Progress</span>
          <span className="text-[10px] text-[#EEF3FA]">{Math.round((data.elapsed / data.slaMinutes) * 100)}% elapsed</span>
        </div>
        <div className="h-1.5 bg-[#1A2E50] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${(data.elapsed / data.slaMinutes) * 100}%`,
              background: slaLeft < 15 ? '#FF4B4B' : slaLeft < 30 ? '#FF9B38' : '#38D98A',
            }}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <ActionBtn primary onClick={() => { onToast('Dispatching to incident', 'success'); onClose(); }}>Dispatch</ActionBtn>
        <ActionBtn onClick={() => { onToast(`Escalating ${data.id}`, 'warning'); onClose(); }}>Escalate</ActionBtn>
      </div>
    </>
  );
}

function AssetDetail({ data, onToast, onClose, onViewHistory }: { data: typeof mockAssets[0]; onToast: (m: string, t?: any) => void; onClose: () => void; onViewHistory: (asset: typeof mockAssets[0]) => void }) {
  return (
    <>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${data.status === 'ok' ? 'bg-emerald-500/20 text-emerald-400' : data.status === 'warning' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
            {data.status.toUpperCase()}
          </span>
          <span className="text-[10px] text-[#7A94B4]">{data.id}</span>
        </div>
        <div className="text-[#EEF3FA] font-bold text-sm">{data.name}</div>
      </div>
      <div className="bg-[#0A1628] rounded-xl p-3 space-y-2">
        <Row label="Type" value={data.type} />
        <Row label="Location" value={data.location} />
        <Row label="Last Service" value={data.lastService} />
        <Row label="Next PPM" value={data.nextPPM} accent={parseInt(data.nextPPM) < 10} />
      </div>
      <div className="bg-[#0A1628] rounded-xl p-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-[#7A94B4]">Condition</span>
          <span className="text-[10px] font-bold" style={{ color: conditionColor(data.condition) }}>{data.condition}%</span>
        </div>
        <div className="h-1.5 bg-[#1A2E50] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${data.condition}%`, background: conditionColor(data.condition) }} />
        </div>
      </div>
      <div className="flex gap-2">
        <ActionBtn primary onClick={() => { onToast('Creating PPM task', 'success'); onClose(); }}>Schedule PPM</ActionBtn>
        <ActionBtn onClick={() => { onViewHistory(data); onClose(); }}>View History</ActionBtn>
      </div>
    </>
  );
}

function TaskDetail({ data, onToast, onClose }: { data: typeof mockTasks[0]; onToast: (m: string, t?: any) => void; onClose: () => void }) {
  const color = taskStatusColor[data.status] || '#7A94B4';
  return (
    <>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize" style={{ background: color + '30', color }}>{data.status.replace('-', ' ')}</span>
          <span className="text-[10px] text-[#7A94B4]">{data.id}</span>
        </div>
        <div className="text-[#EEF3FA] font-bold text-sm">{data.title}</div>
      </div>
      <div className="bg-[#0A1628] rounded-xl p-3 space-y-2">
        <Row label="Assigned To" value={data.tech} />
        <Row label="Skill Required" value={data.skill} />
        <Row label="Priority" value={data.priority} accent={data.priority === 'critical' || data.priority === 'high'} />
        <Row label="ETA" value={data.eta} />
      </div>
      <div className="flex gap-2">
        <ActionBtn primary onClick={() => { onToast(`Navigating to task ${data.id}`, 'info'); onClose(); }}>Open Task</ActionBtn>
        <ActionBtn onClick={() => { onToast(`Reassigning task ${data.id}`, 'warning'); onClose(); }}>Reassign</ActionBtn>
      </div>
    </>
  );
}

function FailureDetail({ data, onToast, onClose }: { data: typeof mockPredictedFailures[0]; onToast: (m: string, t?: any) => void; onClose: () => void }) {
  const probColor = data.probability >= 70 ? '#FF4B4B' : data.probability >= 50 ? '#FF9B38' : '#FFCC00';
  return (
    <>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: probColor + '30', color: probColor }}>
            {data.probability}% Probability
          </span>
        </div>
        <div className="text-[#EEF3FA] font-bold text-sm">{data.asset}</div>
      </div>
      <div className="bg-[#0A1628] rounded-xl p-3 space-y-2">
        <Row label="Category" value={data.category} />
        <Row label="Predicted Horizon" value={data.horizon} accent />
        <Row label="ID" value={data.id} />
      </div>
      <div className="bg-[#0A1628] rounded-xl p-3">
        <div className="text-[10px] text-[#7A94B4] mb-1">AI Diagnosis</div>
        <div className="text-[11px] text-[#EEF3FA] leading-relaxed">{data.reason}</div>
      </div>
      <div className="bg-[#0A1628] rounded-xl p-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-[#7A94B4]">Failure Probability</span>
          <span className="text-[10px] font-bold" style={{ color: probColor }}>{data.probability}%</span>
        </div>
        <div className="h-1.5 bg-[#1A2E50] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${data.probability}%` }}
            transition={{ duration: 0.6 }}
            className="h-full rounded-full"
            style={{ background: probColor }}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <ActionBtn primary onClick={() => { onToast('Creating preventive work order', 'success'); onClose(); }}>Raise PPM</ActionBtn>
        <ActionBtn onClick={() => { onToast('Dismissed prediction', 'info'); onClose(); }}>Dismiss</ActionBtn>
      </div>
    </>
  );
}

interface MapViewControllerProps {
  filterClientId: string;
  clients: import('@/data/mockData').PortfolioClient[];
}

function MapViewController({ filterClientId, clients }: MapViewControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (!filterClientId) {
      const validClients = clients.filter(c => c.lat != null && c.lng != null);
      if (validClients.length === 0) return;
      if (validClients.length === 1) {
        map.flyTo([validClients[0].lat, validClients[0].lng], 14, { animate: true, duration: 1.2 });
        return;
      }
      const bounds = L.latLngBounds(validClients.map(c => [c.lat, c.lng] as L.LatLngTuple));
      map.flyToBounds(bounds, { padding: [80, 80], animate: true, duration: 1.2 });
      return;
    }

    const client = clients.find(c => c.id === filterClientId);
    if (client && client.lat != null && client.lng != null) {
      map.flyTo([client.lat, client.lng], 14, { animate: true, duration: 1.2 });
    } else {
      const validClients = clients.filter(c => c.lat != null && c.lng != null);
      if (validClients.length > 0) {
        const bounds = L.latLngBounds(validClients.map(c => [c.lat!, c.lng!] as L.LatLngTuple));
        map.flyToBounds(bounds, { padding: [80, 80], animate: true, duration: 1.2 });
      }
    }
  }, [filterClientId, clients, map]);

  return null;
}

interface Props {
  onToast?: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
  selectedClientId?: string | null;
}

function matchesZone(location: string, zones: string[]): boolean {
  if (zones.length === 0) return true;
  const loc = location.toLowerCase();
  return zones.some(z => loc.includes(z.toLowerCase()) || z.toLowerCase().includes(loc));
}

export function CommunityMap({ onToast, selectedClientId }: Props) {
  const memberFilter = useMemberFilter();
  const isMemberMode = isFilterActive(memberFilter);
  const { clients } = useClients();
  const { incidents: contextIncidents } = useIncidents();

  const [filterClientId, setFilterClientId] = useState<string>(selectedClientId ?? '');

  useEffect(() => {
    setFilterClientId(selectedClientId ?? '');
  }, [selectedClientId]);

  const focusedClient = useMemo(
    () => (filterClientId ? clients.find(c => c.id === filterClientId) ?? null : null),
    [filterClientId, clients],
  );

  const visibleIncidents = useMemo(() => {
    let base = contextIncidents;
    if (isMemberMode && memberFilter.zones.length > 0) {
      base = base.filter(inc => matchesZone(inc.location, memberFilter.zones));
    }
    if (filterClientId) {
      base = base.filter(inc => inc.clientId === filterClientId);
    }
    return base;
  }, [contextIncidents, isMemberMode, memberFilter.zones, filterClientId]);

  const focusedClientIncidentCount = useMemo(() => {
    if (!filterClientId) return 0;
    return contextIncidents.filter(inc => inc.clientId === filterClientId).length;
  }, [contextIncidents, filterClientId]);

  const visibleTasks = useMemo(() => {
    if (!isMemberMode || memberFilter.zones.length === 0) return mockTasks;
    return mockTasks.filter(t => matchesZone(t.title, memberFilter.zones));
  }, [isMemberMode, memberFilter.zones]);

  const [activeLayers, setActiveLayers] = useState<Record<LayerKey, boolean>>({
    technicians: true,
    incidents: true,
    assets: false,
    tasks: false,
    slaZones: false,
    predictedFailures: false,
  });
  const [drawer, setDrawer] = useState<DrawerItem | null>(null);
  const [historyAsset, setHistoryAsset] = useState<typeof mockAssets[0] | null>(null);

  const toggleLayer = (key: LayerKey) => setActiveLayers(prev => ({ ...prev, [key]: !prev[key] }));

  const open = (item: DrawerItem) => { setDrawer(item); };

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-[rgba(46,127,255,0.22)]">
      <MapContainer
        center={[25.1175, 55.3775]}
        zoom={15}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap &copy; CARTO'
          subdomains="abcd"
          maxZoom={20}
        />

        <MapViewController filterClientId={filterClientId} clients={clients} />

        {clients
          .filter(c => c.lat != null && c.lng != null && (!filterClientId || c.id === filterClientId))
          .map(c => (
            <Marker
              key={`client-${c.id}`}
              position={[c.lat, c.lng]}
              icon={createClientMarkerIcon(c.name, c.riskLevel, c.marketLabel)}
            />
          ))}

        {activeLayers.slaZones && mockSLAZones.map(zone => (
          <Circle
            key={zone.id}
            center={[zone.lat, zone.lng]}
            radius={zone.radius}
            pathOptions={{
              color: severityColors[zone.riskLevel] || '#FF9B38',
              fillColor: severityColors[zone.riskLevel] || '#FF9B38',
              fillOpacity: 0.08,
              weight: 1.5,
              dashArray: '6 4',
            }}
          />
        ))}

        {activeLayers.technicians && mockTechnicians.map(tech => (
          <Marker
            key={tech.id}
            position={[tech.lat, tech.lng]}
            icon={createTechIcon(tech)}
            eventHandlers={{ click: () => open({ kind: 'tech', data: tech }) }}
          />
        ))}

        {activeLayers.incidents && visibleIncidents.filter(inc => inc.lat != null && inc.lng != null).map(inc => (
          <CircleMarker
            key={inc.id}
            center={[inc.lat!, inc.lng!]}
            radius={10}
            pathOptions={{
              color: severityColors[inc.severity],
              fillColor: severityColors[inc.severity],
              fillOpacity: 0.85,
              weight: 2,
            }}
            eventHandlers={{ click: () => open({ kind: 'incident', data: inc }) }}
          />
        ))}

        {activeLayers.assets && mockAssets.map(asset => (
          <Marker
            key={asset.id}
            position={[asset.lat, asset.lng]}
            icon={createAssetIcon(asset.status)}
            eventHandlers={{ click: () => open({ kind: 'asset', data: asset }) }}
          />
        ))}

        {activeLayers.tasks && visibleTasks.map(task => (
          <Marker
            key={task.id}
            position={[task.lat, task.lng]}
            icon={createTaskIcon(task.status)}
            eventHandlers={{ click: () => open({ kind: 'task', data: task }) }}
          />
        ))}

        {activeLayers.predictedFailures && mockPredictedFailures.map(pf => (
          <Marker
            key={pf.id}
            position={[pf.lat, pf.lng]}
            icon={createFailureIcon(pf.probability)}
            eventHandlers={{ click: () => open({ kind: 'failure', data: pf }) }}
          />
        ))}
      </MapContainer>

      <div className="absolute top-3 left-3 z-[400] flex flex-col gap-2">
        <div className="flex items-center gap-2 bg-[rgba(10,22,40,0.85)] border border-[rgba(46,127,255,0.3)] rounded-full px-3 py-1 backdrop-blur-md">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] text-[#EEF3FA] font-semibold tracking-wide">
            {focusedClient ? (focusedClient.marketLabel ?? focusedClient.name).toUpperCase() + ' — LIVE' : 'ALL PROPERTIES — LIVE'}
          </span>
        </div>
        <select
          value={filterClientId}
          onChange={e => setFilterClientId(e.target.value)}
          className="bg-[rgba(10,22,40,0.85)] border border-[rgba(46,127,255,0.3)] rounded-full px-3 py-1 text-[11px] text-[#EEF3FA] backdrop-blur-md cursor-pointer outline-none appearance-none"
        >
          <option value="">All Properties</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <AnimatePresence>
          {focusedClient && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 bg-[rgba(46,127,255,0.18)] border border-[rgba(46,127,255,0.55)] rounded-full px-3 py-1 backdrop-blur-md"
            >
              <MapPin size={11} className="text-blue-300 flex-shrink-0" />
              <span className="text-[11px] text-blue-200 font-semibold tracking-wide">
                {focusedClient.name}
              </span>
              {focusedClientIncidentCount > 0 && (
                <span className="text-[9px] text-blue-300 opacity-80">
                  · {focusedClientIncidentCount} incident{focusedClientIncidentCount !== 1 ? 's' : ''}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="absolute top-3 right-3 z-[400] flex flex-col gap-1.5">
        {layers.map(layer => (
          <button
            key={layer.key}
            onClick={() => toggleLayer(layer.key)}
            className={`flex items-center gap-1.5 pl-2 pr-3 py-1 rounded-full text-[10px] font-semibold border transition-all duration-150 backdrop-blur-md ${
              activeLayers[layer.key]
                ? 'bg-[rgba(10,22,40,0.92)] border-current text-white'
                : 'bg-[rgba(10,22,40,0.6)] border-[rgba(255,255,255,0.08)] text-[#7A94B4] hover:text-white hover:border-[rgba(255,255,255,0.2)]'
            }`}
            style={activeLayers[layer.key] ? { color: layer.color, borderColor: layer.color + '80' } : {}}
          >
            <span style={activeLayers[layer.key] ? { color: layer.color } : {}}>{layer.icon}</span>
            {layer.label}
          </button>
        ))}
      </div>

      <div className="absolute bottom-14 left-3 z-[400] flex gap-2" style={{ right: '100px' }}>
        {[
          { label: 'Engineers On-site', value: '5' },
          { label: 'Open Jobs', value: '4' },
          { label: 'SLA Compliance', value: '94%' },
          { label: 'Avg Response', value: '11 min' },
        ].map(s => (
          <div key={s.label} className="flex-1 bg-[rgba(10,22,40,0.9)] border border-[rgba(46,127,255,0.2)] rounded-lg px-2 py-2 backdrop-blur-md text-center">
            <div className="text-[14px] font-bold text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{s.value}</div>
            <div className="text-[9px] text-[#7A94B4] leading-tight mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="absolute bottom-3 right-3 z-[400] bg-[rgba(10,22,40,0.9)] border border-[rgba(46,127,255,0.2)] rounded-lg px-3 py-2 backdrop-blur-md">
        <div className="text-[10px] text-[#7A94B4] space-y-1">
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-blue-400 inline-block" /> Property Market</div>
          <div className="mt-1 pt-1 border-t border-[rgba(46,127,255,0.15)]">
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Available</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> On Job</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> En Route</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Overdue</div>
          </div>
          <div className="mt-1 pt-1 border-t border-[rgba(46,127,255,0.15)]">
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Critical</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Medium</div>
          </div>
        </div>
      </div>

      <MapDrawer
        item={drawer}
        onClose={() => setDrawer(null)}
        onToast={onToast ?? (() => {})}
        onViewHistory={asset => setHistoryAsset(asset)}
      />

      <PPMHistoryDrawer
        asset={historyAsset}
        open={historyAsset !== null}
        onClose={() => setHistoryAsset(null)}
      />
    </div>
  );
}
