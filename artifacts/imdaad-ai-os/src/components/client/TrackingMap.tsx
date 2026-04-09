import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function createTechMarkerIcon() {
  return L.divIcon({
    html: `<div style="width:22px;height:22px;background:#2E7FFF;border:2px solid #00C6FF;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:8px;font-weight:bold;animation:techPulse 1.5s ease-in-out infinite;box-shadow:0 0 12px rgba(46,127,255,0.6)">KR</div>`,
    className: '',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function createVillaIcon() {
  return L.divIcon({
    html: `<div style="width:16px;height:16px;background:#38D98A;border:2px solid #38D98A;border-radius:50%;box-shadow:0 0 8px rgba(56,217,138,0.6)"></div>`,
    className: '',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

const villaPos: [number, number] = [25.1185, 55.3755];

const techPath: [number, number][] = [
  [25.1180, 55.3740],
  [25.1182, 55.3745],
  [25.1183, 55.3748],
  [25.1184, 55.3751],
  [25.1185, 55.3755],
];

export function TrackingMap() {
  const [techIdx, setTechIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTechIdx(i => (i < techPath.length - 1 ? i + 1 : i));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const techPos = techPath[techIdx];

  return (
    <div className="relative h-40 rounded-xl overflow-hidden border border-[rgba(46,127,255,0.22)]">
      <MapContainer
        center={[25.11825, 55.37475]}
        zoom={16}
        zoomControl={false}
        className="w-full h-full"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution=""
          subdomains="abcd"
        />
        <Marker position={villaPos} icon={createVillaIcon()} />
        <Marker position={techPos} icon={createTechMarkerIcon()} />
        <Polyline
          positions={[techPos, villaPos]}
          pathOptions={{ color: '#2E7FFF', dashArray: '6, 4', weight: 2, opacity: 0.8 }}
        />
      </MapContainer>
      <div className="absolute top-2 right-2 z-[400] bg-[rgba(10,22,40,0.9)] border border-[rgba(46,127,255,0.3)] rounded-lg px-2 py-1">
        <span className="text-[11px] text-[#2E7FFF] font-semibold">ETA: {Math.max(0, 18 - techIdx * 4)} min</span>
      </div>
    </div>
  );
}
