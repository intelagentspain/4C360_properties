import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { mockTechnicians, mockIncidents, mockClusters } from '@/data/mockData';
import { StatusBadge } from '@/components/shared/StatusBadge';

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

function createTechIcon(tech: typeof mockTechnicians[0]) {
  const color = statusColors[tech.status] || '#7A94B4';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="16" fill="${color}" fill-opacity="0.25" stroke="${color}" stroke-width="2"/>
      <circle cx="18" cy="18" r="10" fill="${color}"/>
      <text x="18" y="22" text-anchor="middle" fill="white" font-size="8" font-weight="bold" font-family="sans-serif">${tech.id}</text>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
}

function createClusterIcon() {
  return L.divIcon({
    html: `<div style="width:18px;height:18px;background:#2E7FFF;border:2px solid #00C6FF;border-radius:3px;opacity:0.85;"></div>`,
    className: '',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -12],
  });
}

export function CommunityMap() {
  const mapRef = useRef<L.Map | null>(null);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-[rgba(46,127,255,0.22)]">
      <MapContainer
        center={[25.1175, 55.3775]}
        zoom={15}
        className="w-full h-full"
        ref={mapRef}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />

        {mockTechnicians.map(tech => (
          <Marker key={tech.id} position={[tech.lat, tech.lng]} icon={createTechIcon(tech)}>
            <Popup className="imdaad-popup">
              <div className="bg-[#112040] text-[#EEF3FA] p-2 rounded-lg min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: `linear-gradient(135deg, ${statusColors[tech.status]}, #0A1628)` }}>
                    {tech.id}
                  </div>
                  <div>
                    <div className="font-bold text-sm">{tech.name}</div>
                    <StatusBadge severity={tech.status} />
                  </div>
                </div>
                <div className="text-xs text-[#7A94B4] space-y-1">
                  <div>Skill: <span className="text-[#EEF3FA]">{tech.skill}</span></div>
                  {tech.job && <div>Current task: <span className="text-[#EEF3FA]">Job {tech.job}</span></div>}
                  <div>Rating: <span className="text-amber-400">★ {tech.rating}</span></div>
                  <div>Completed: <span className="text-[#EEF3FA]">{tech.jobsCompleted} jobs</span></div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button className="flex-1 py-1 text-xs bg-[#2E7FFF] text-white rounded">View Task</button>
                  <button className="flex-1 py-1 text-xs border border-[rgba(46,127,255,0.4)] text-[#2E7FFF] rounded">Reassign</button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {mockIncidents.map(inc => (
          <CircleMarker
            key={inc.id}
            center={[inc.lat, inc.lng]}
            radius={10}
            pathOptions={{
              color: severityColors[inc.severity],
              fillColor: severityColors[inc.severity],
              fillOpacity: 0.85,
              weight: 2,
            }}
          >
            <Popup className="imdaad-popup">
              <div className="bg-[#112040] text-[#EEF3FA] p-2 rounded-lg min-w-[200px]">
                <div className="font-bold text-sm mb-1">{inc.id}</div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold">{inc.title}</span>
                  <StatusBadge severity={inc.severity} />
                </div>
                <div className="text-xs text-[#7A94B4] space-y-1">
                  <div>Location: <span className="text-[#EEF3FA]">{inc.location}</span></div>
                  <div>Reported: <span className="text-[#EEF3FA]">{inc.elapsed} min ago</span></div>
                  <div>Source: <span className="text-[#EEF3FA]">{inc.source}</span></div>
                  <div>SLA: <span className="text-amber-400">{inc.slaMinutes - inc.elapsed} min remaining</span></div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button className="flex-1 py-1 text-xs bg-[#2E7FFF] text-white rounded">View Incident</button>
                  <button className="flex-1 py-1 text-xs border border-[rgba(46,127,255,0.4)] text-[#2E7FFF] rounded">Reassign</button>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {mockClusters.map(cluster => (
          <Marker key={cluster.id} position={[cluster.lat, cluster.lng]} icon={createClusterIcon()}>
            <Popup>
              <div className="bg-[#112040] text-[#EEF3FA] p-2 rounded min-w-[160px]">
                <div className="font-bold text-sm">Cluster {cluster.id}</div>
                <div className="text-xs text-[#7A94B4] mt-1">
                  <div>{cluster.villas} villas</div>
                  <div className={cluster.incidents > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                    {cluster.incidents > 0 ? `${cluster.incidents} open incident${cluster.incidents > 1 ? 's' : ''}` : 'No open incidents'}
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="absolute top-3 left-3 z-[400] flex items-center gap-2 bg-[rgba(10,22,40,0.85)] border border-[rgba(46,127,255,0.3)] rounded-full px-3 py-1 backdrop-blur-md">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[11px] text-[#EEF3FA] font-semibold tracking-wide">SILICON OASIS COMMUNITY — LIVE</span>
      </div>

      <div className="absolute bottom-14 left-3 right-3 z-[400] flex gap-2">
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
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Available</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> On Job</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> En Route</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Overdue</div>
          <div className="mt-1 pt-1 border-t border-[rgba(46,127,255,0.15)]">
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Critical Incident</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Medium Incident</div>
          </div>
        </div>
      </div>
    </div>
  );
}
