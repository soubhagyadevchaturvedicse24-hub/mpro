import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useSimulatorContext } from '../../../context/SimulatorContext';
import { getHospitalByName } from '../../../data/hospitals';
import { useTheme } from '../../../context/ThemeContext';
import { useLiveRoutePipeline } from '../../../hooks/useLiveRoutePipeline';

// Custom Leaflet Icons with high-resolution vector styling
const createCustomIcon = (svgString, color = '#2563eb', size = 36) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 14px rgba(0,0,0,0.35);
        color: white;
      ">
        ${svgString}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
};

const hospitalIcon = createCustomIcon(`
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M12 4v4"/><path d="M10 12h4"/><path d="M10 16h4"/></svg>
`, '#0284c7', 32);

const destHospitalIcon = createCustomIcon(`
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M12 4v4"/><path d="M10 12h4"/><path d="M10 16h4"/></svg>
`, '#10b981', 32);

// Rotated & Animated Ambulance Live Marker
const createAmbulanceIcon = (bearing = 0) => L.divIcon({
  className: 'custom-ambulance-marker',
  html: `
    <div style="position: relative; width: 44px; height: 44px; transform: rotate(${bearing}deg); transition: transform 0.3s ease-out;">
      <span style="
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: rgba(37, 99, 235, 0.4);
        animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
      "></span>
      <div style="
        position: relative;
        width: 44px;
        height: 44px;
        background: #2563eb;
        border: 2.5px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 20px rgba(37, 99, 235, 0.6);
        color: white;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 10H6"/><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.3-.7l-4.2-4.2a1 1 0 0 0-.7-.3H14"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
      </div>
    </div>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 22]
});

// Map Smooth Auto Pan Recenter Helper
const MapRecenter = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.panTo(center, { animate: true, duration: 1.2 });
    }
  }, [center, map]);
  return null;
};

const InteractiveLiveMap = ({ originName, destinationName, liveTelemetry }) => {
  const { isDayMode } = useTheme();
  const sim = useSimulatorContext();

  const originHosp = getHospitalByName(originName) || { lat: 28.6139, lng: 77.2090, name: originName || 'Origin Hospital' };
  const destHosp   = getHospitalByName(destinationName) || { lat: 28.4595, lng: 77.0266, name: destinationName || 'Destination Hospital' };

  const rawLivePos = liveTelemetry || sim?.telemetry || { lat: originHosp.lat, lng: originHosp.lng };

  // High-performance robust pipeline hook
  const {
    displayPos,
    bearing,
    traveledPath,
    remainingPath,
    originCoords,
    destCoords,
  } = useLiveRoutePipeline({
    origin: originHosp,
    destination: destHosp,
    rawLivePos,
    lerpDuration: 2000
  });

  const tileUrl = isDayMode 
    ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

  const defaultCenter = [
    (originHosp.lat + destHosp.lat) / 2,
    (originHosp.lng + destHosp.lng) / 2
  ];

  return (
    <div className="w-full h-full min-h-[480px] rounded-xl overflow-hidden relative shadow-inner">
      <MapContainer 
        center={defaultCenter} 
        zoom={12} 
        scrollWheelZoom={true} 
        style={{ width: '100%', height: '100%', minHeight: '480px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={tileUrl}
        />

        <MapRecenter center={displayPos} />

        {/* Origin Hospital Marker */}
        <Marker position={originCoords} icon={hospitalIcon}>
          <Popup>
            <div className="font-sans text-xs">
              <strong className="text-blue-600 block">{originHosp.name}</strong>
              <span>Dispatch Origin</span>
            </div>
          </Popup>
        </Marker>

        {/* Destination Hospital Marker */}
        <Marker position={destCoords} icon={destHospitalIcon}>
          <Popup>
            <div className="font-sans text-xs">
              <strong className="text-emerald-600 block">{destHosp.name}</strong>
              <span>Destination Hospital</span>
            </div>
          </Popup>
        </Marker>

        {/* Leg 1: Traveled Route (Origin -> Current Live Position) */}
        {traveledPath && traveledPath.length > 1 && (
          <Polyline 
            positions={traveledPath} 
            color="#2563eb" 
            weight={6} 
            opacity={0.9} 
          />
        )}

        {/* Leg 2: Remaining Route (Current Live Position -> Destination) */}
        {remainingPath && remainingPath.length > 1 && (
          <Polyline 
            positions={remainingPath} 
            color="#8b5cf6" 
            weight={4} 
            opacity={0.7} 
            dashArray="6 8"
          />
        )}

        {/* Smooth 60 FPS Animated Live Ambulance Marker */}
        <Marker position={displayPos} icon={createAmbulanceIcon(bearing)}>
          <Popup className="modern-live-popup" closeButton={false}>
            <div className="font-sans min-w-[210px] -m-1">
              <div className="flex items-center gap-2.5 border-b border-gray-100/80 pb-2.5 mb-2.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30 text-lg">
                  🚑
                </div>
                <div>
                  <h4 className="text-[13px] font-extrabold text-gray-900 tracking-tight leading-tight m-0">Live Transport</h4>
                  <p className="text-[10px] text-blue-600 font-bold m-0 mt-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                    GPS Active (College Demo)
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="bg-gray-50/80 rounded-lg p-2 border border-gray-100 text-center">
                  <span className="block text-[9px] text-gray-400 font-extrabold uppercase mb-0.5 tracking-wider">Latitude</span>
                  <span className="block text-[11px] font-mono font-bold text-gray-800">{displayPos[0].toFixed(5)}°</span>
                </div>
                <div className="bg-gray-50/80 rounded-lg p-2 border border-gray-100 text-center">
                  <span className="block text-[9px] text-gray-400 font-extrabold uppercase mb-0.5 tracking-wider">Longitude</span>
                  <span className="block text-[11px] font-mono font-bold text-gray-800">{displayPos[1].toFixed(5)}°</span>
                </div>
              </div>

              <div className="bg-emerald-50/60 rounded-lg p-2 border border-emerald-100 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></svg>
                  </div>
                  <span className="text-[10px] text-emerald-800 font-extrabold uppercase tracking-tight">Core Temp</span>
                </div>
                <span className="text-[13px] font-black text-emerald-700">{rawLivePos?.temperature || 4.0}°C</span>
              </div>
            </div>
          </Popup>
        </Marker>

      </MapContainer>
    </div>
  );
};

export default InteractiveLiveMap;
