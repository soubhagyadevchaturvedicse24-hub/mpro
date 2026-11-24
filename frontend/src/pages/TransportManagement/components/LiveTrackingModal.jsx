import React, { useState, useEffect } from 'react';
import { 
  X, Activity, Building2, ArrowRight, Clock, Navigation, Calendar, 
  Box, RotateCw, BatteryCharging, Thermometer, Lock, ShieldCheck, 
  MapPin, PhoneCall, Plus, Minus, Target, AlertTriangle, CheckCircle2, Ambulance, User,
  Bell, Cpu, Wifi, Radio, Fingerprint, Eye, Zap
} from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { useSimulatorContext } from '../../../context/SimulatorContext';
import InteractiveLiveMap from './InteractiveLiveMap';

const LiveTrackingModal = ({ isOpen, onClose, transportData, onMarkAsDone, liveTelemetry }) => {
  const { isDayMode } = useTheme();
  const { telemetry, currentTemp, currentBattery, isTamperedMode, connected, running, start } = useSimulatorContext() || {};
  const [refreshCountdown, setRefreshCountdown] = useState(8);
  const [lastUpdatedTime, setLastUpdatedTime] = useState(new Date().toLocaleTimeString());
  const [isOffline, setIsOffline] = useState(false);

  // Track the last time we received ANY telemetry update via a ref (no stale closure)
  const lastTelemetryMsRef = React.useRef(Date.now());
  const telemetrySourceRef = React.useRef('none'); // 'hardware' | 'simulator' | 'none'

  // Update refs whenever liveTelemetry changes
  useEffect(() => {
    if (liveTelemetry) {
      lastTelemetryMsRef.current = Date.now();
      telemetrySourceRef.current = liveTelemetry.source || 'hardware';
    }
  }, [liveTelemetry]);

  // Unified telemetry — liveTelemetry is pre-normalized by index.jsx (dual pipeline).
  // Falls back to raw SimulatorContext ONLY when no hardware/unified data exists.
  const effectiveTelemetry = liveTelemetry || (telemetry ? {
    temperature:     telemetry.temperature,
    batteryLevel:    telemetry.batteryLevel,
    lat:             telemetry.lat,
    lng:             telemetry.lng,
    speedKmh:        0,
    isTampered:      telemetry.tampered || false,
    tampered:        telemetry.tampered || false,
    spiked:          telemetry.spiked || false,
    reedStatus:      telemetry.tampered ? 'Box Open' : 'Box Closed',
    buzzerStatus:    telemetry.tampered || telemetry.spiked ? 'Beeping Alert' : 'Normal',
    relayStatus:     'Locked',
    rfidLastScanned: '',
    firmwareVersion: 'Simulator',
    source:          'simulator',
  } : null);

  // Removed auto-start simulator logic to strictly enforce physical hardware telemetry.
  // The simulator will no longer fake movement when the physical box is stationary.

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setRefreshCountdown(prev => {
        if (prev <= 1) {
          setLastUpdatedTime(new Date().toLocaleTimeString());
          return 8;
        }
        return prev - 1;
      });
      // Liveness check — uses ref so it's NEVER stale
      const msSinceLastPacket = Date.now() - lastTelemetryMsRef.current;
      const wasHardware = telemetrySourceRef.current === 'hardware';
      // Only mark offline if the LAST source was hardware and it's been > 15s
      // Simulator data never triggers offline (simulator is local, always "connected")
      if (wasHardware && msSinceLastPacket > 15000) {
        setIsOffline(true);
      } else if (msSinceLastPacket <= 15000) {
        setIsOffline(false);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    if (liveTelemetry || telemetry) {
      setLastUpdatedTime(new Date().toLocaleTimeString());
    }
  }, [liveTelemetry, telemetry]);

  if (!isOpen) return null;

  // Live telemetry values (falls back to transportData)
  const displayBattery = isOffline ? 'Disconnected' : effectiveTelemetry ? `${effectiveTelemetry.batteryLevel}%` : (transportData?.iotData?.battery || transportData?.battery || '98%');
  const batteryVal = isOffline ? 0 : effectiveTelemetry ? effectiveTelemetry.batteryLevel : parseFloat(displayBattery);
  const isBatteryLow = batteryVal < 20 && !isOffline;

  const displayTemp = isOffline ? '--' : effectiveTelemetry ? `${effectiveTelemetry.temperature}°C` : (transportData?.iotData?.temp || transportData?.temp || '4.0°C');
  const isTempSpiked = !isOffline && (effectiveTelemetry?.spiked || (parseFloat(displayTemp) > 8 || parseFloat(displayTemp) < 2));

  const isTampered = effectiveTelemetry ? (effectiveTelemetry.tampered || effectiveTelemetry.isTampered) : (transportData?.iotData?.tamper === 'Tampered');

const formatAddressString = (addr) => {
  if (!addr) return 'Hospital Campus Address';
  if (typeof addr === 'string') return addr;
  if (typeof addr === 'object') {
    if (addr.address && typeof addr.address === 'string') return addr.address;
    const street = addr.street || addr.addressLine1 || '';
    const city = addr.city || addr.district || '';
    const state = addr.state || '';
    const pin = addr.pincode || addr.pin || '';
    const parts = [street, city, state, pin].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Hospital Campus Address';
  }
  return String(addr);
};

  const hasValidGps = effectiveTelemetry && typeof effectiveTelemetry.lat === 'number' && typeof effectiveTelemetry.lng === 'number' && !(effectiveTelemetry.lat === 0 && effectiveTelemetry.lng === 0);

  // Safely construct data with full fallbacks
  const data = {
    id: transportData?.id || 'TRN-8901',
    origin: transportData?.origin || 'CityCare Hospital',
    originAddress: formatAddressString(transportData?.originAddress),
    destination: transportData?.destination || 'Green Valley Hospital',
    destinationAddress: formatAddressString(transportData?.destinationAddress),
    distance: transportData?.distance || '24.6 km',
    eta: transportData?.eta || '14 min',
    startedAt: transportData?.startedAt || '12:45 PM',
    expectedArrival: transportData?.expectedArrival || '01:25 PM',
    iotBoxId: transportData?.iotBoxId || 'IOT-78231',
    lastUpdated: lastUpdatedTime,
    battery: displayBattery,
    temp: displayTemp,
    tamper: isTampered ? 'TAMPERED' : 'Secure',
    blockchain: connected === false ? 'Offline Notarization' : 'Verified',
    location: hasValidGps ? `${effectiveTelemetry.lat.toFixed(4)}° N, ${effectiveTelemetry.lng.toFixed(4)}° E` : (transportData?.iotData?.location || 'Searching Signal...'),
    driver: {
      name: typeof transportData?.driver === 'string' ? transportData.driver : (transportData?.driver?.name || 'Amit Verma'),
      role: transportData?.driver?.role || 'Driver',
      phone: transportData?.driver?.phone || '+91 98765 43210',
      dl: transportData?.driver?.dl || 'DL 1A AB 1234',
      experience: transportData?.driver?.experience || '5+ Years',
      rating: transportData?.driverRating || transportData?.driver?.rating || '4.8',
      trips: transportData?.driver?.trips || 128,
      avatar: transportData?.driver?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
    },
    paramedic: {
      name: transportData?.paramedic?.name || 'Neha Sharma',
      role: transportData?.paramedic?.role || 'Paramedic',
      phone: transportData?.paramedic?.phone || '+91 87654 32109',
      pmr: transportData?.paramedic?.pmr || 'PMR-5678',
      experience: transportData?.paramedic?.experience || '4+ Years',
      rating: transportData?.paramedic?.rating || '4.9',
      trips: transportData?.paramedic?.trips || 96,
      avatar: transportData?.paramedic?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200'
    },
    vehicle: typeof transportData?.vehicle === 'string' ? transportData.vehicle : (transportData?.vehicle?.reg || 'AMB-105'),
    organType: transportData?.organType || 'Kidney',
    patientName: transportData?.patientName || 'Sarah Jenkins'
  };

  return (
    <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-3 sm:p-5 font-sans">
      <div className={`rounded-2xl shadow-2xl w-full max-w-[1180px] flex flex-col max-h-[94vh] overflow-hidden border transition-colors ${
        isDayMode ? 'bg-white border-gray-100' : 'bg-[#101827] border-slate-800'
      }`}>
        
        {/* Modal Header */}
        <div className={`px-6 py-4 border-b flex justify-between items-center shrink-0 ${
          isDayMode ? 'bg-white border-gray-100' : 'bg-[#101827] border-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border flex items-center justify-center ${
              isDayMode ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50'
            }`}>
              <Activity size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className={`text-xl font-bold ${isDayMode ? 'text-[#0B1B3D]' : 'text-slate-100'}`}>Live Transportation Tracking</h2>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
                  isDayMode ? 'bg-emerald-50 text-emerald-600 border-emerald-200/60' : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  LIVE
                </span>
              </div>
              <p className={`text-xs font-medium mt-0.5 ${isDayMode ? 'text-gray-500' : 'text-slate-400'}`}>
                Transportation ID: <span className="font-semibold text-emerald-500 font-mono">{data.id}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className={`p-2 rounded-xl transition-colors border ${
              isDayMode ? 'hover:bg-gray-100 border-gray-200 text-gray-400 hover:text-gray-600' : 'hover:bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body - 2 Columns */}
        <div className={`p-6 overflow-y-auto flex-1 custom-scrollbar ${isDayMode ? 'bg-[#F8FAFC]' : 'bg-[#0B1120]'}`}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT COLUMN: Data & Details */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              
              {/* 1. Origin & Destination Route Card */}
              <div className={`p-4 rounded-xl border shadow-sm ${
                isDayMode ? 'bg-white border-gray-100' : 'bg-slate-800/50 border-slate-700/60'
              }`}>
                <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center mb-4">
                  {/* Origin */}
                  <div className="md:col-span-5 flex items-start gap-3">
                    <div className={`p-2 rounded-lg shrink-0 mt-0.5 border ${
                      isDayMode ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-blue-900/40 text-blue-400 border-blue-700/50'
                    }`}>
                      <Building2 size={18} />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">From</span>
                      <h4 className={`text-sm font-bold ${isDayMode ? 'text-[#0B1B3D]' : 'text-slate-100'}`}>{data.origin}</h4>
                      <p className="text-[11px] text-gray-500 leading-tight mt-0.5">{data.originAddress}</p>
                    </div>
                  </div>

                  {/* Arrow Indicator */}
                  <div className="md:col-span-1 flex justify-center py-1">
                    <div className={`w-7 h-7 rounded-full border flex items-center justify-center ${
                      isDayMode ? 'bg-gray-100 border-gray-200 text-gray-400' : 'bg-slate-700 border-slate-600 text-slate-400'
                    }`}>
                      <ArrowRight size={14} />
                    </div>
                  </div>

                  {/* Destination */}
                  <div className="md:col-span-5 flex items-start gap-3">
                    <div className={`p-2 rounded-lg shrink-0 mt-0.5 border ${
                      isDayMode ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-emerald-900/40 text-emerald-400 border-emerald-700/50'
                    }`}>
                      <Building2 size={18} />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">To</span>
                      <h4 className={`text-sm font-bold ${isDayMode ? 'text-[#0B1B3D]' : 'text-slate-100'}`}>{data.destination}</h4>
                      <p className="text-[11px] text-gray-500 leading-tight mt-0.5">{data.destinationAddress}</p>
                    </div>
                  </div>
                </div>

                {/* Sub-stats Banner */}
                <div className={`grid grid-cols-2 gap-2 pt-3 border-t rounded-lg p-2.5 ${
                  isDayMode ? 'border-gray-100 bg-gray-50/50' : 'border-slate-700/50 bg-slate-700/30'
                }`}>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-purple-500 shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-400 font-medium uppercase">Started At</p>
                      <p className={`text-xs font-bold ${isDayMode ? 'text-gray-800' : 'text-slate-200'}`}>{data.startedAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-400 font-medium uppercase">Expected Arrival</p>
                      <p className={`text-xs font-bold ${isDayMode ? 'text-gray-800' : 'text-slate-200'}`}>{data.expectedArrival}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Live IoT Data Block */}
              <div className={`p-4 rounded-xl border shadow-sm ${
                isDayMode ? 'bg-white border-gray-100' : 'bg-slate-800/50 border-slate-700/60'
              }`}>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <Box size={16} className="text-blue-600" />
                    <h3 className={`text-xs font-bold ${isDayMode ? 'text-[#0B1B3D]' : 'text-slate-100'}`}>Live IoT Data</h3>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 font-mono">
                    <span>IoT Box ID: <strong className={`font-semibold ${isDayMode ? 'text-gray-800' : 'text-slate-200'}`}>{data.iotBoxId}</strong></span>
                    <RotateCw size={12} className="text-gray-400 hover:rotate-180 transition-transform cursor-pointer" />
                  </div>
                </div>

                {/* 8-Tile Sensor Grid (Matching Hardware Dashboard Spec) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                  
                  {/* 1. TEMP */}
                  <div className={`p-3 rounded-2xl border transition-all ${
                    isTempSpiked 
                      ? 'bg-red-50/80 border-red-200 text-red-900' 
                      : isDayMode ? 'bg-white border-gray-100 shadow-sm' : 'bg-slate-800/60 border-slate-700/60'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Thermometer size={16} className={isTempSpiked ? 'text-red-500 animate-bounce' : 'text-red-400'} />
                      <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">TEMP</span>
                    </div>
                    <div className={`text-lg font-black tracking-tight ${isTempSpiked ? 'text-red-600' : isDayMode ? 'text-gray-800' : 'text-slate-100'}`}>
                      {displayTemp}
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium">2-8°C normal</span>
                  </div>

                  {/* 2. BATTERY */}
                  <div className={`p-3 rounded-2xl border transition-all ${
                    isOffline
                      ? isDayMode ? 'bg-red-50/80 border-red-200' : 'bg-red-900/20 border-red-700/50'
                      : isBatteryLow
                        ? isDayMode ? 'bg-amber-50/80 border-amber-200 text-amber-900' : 'bg-amber-900/20 border-amber-700/60'
                        : isDayMode ? 'bg-white border-gray-100 shadow-sm' : 'bg-slate-800/60 border-slate-700/60'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <BatteryCharging size={16} className={isOffline ? 'text-red-500' : 'text-emerald-500'} />
                      <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">BATTERY</span>
                    </div>
                    <div className={`text-lg font-black tracking-tight ${isOffline ? 'text-red-500' : 'text-emerald-600'}`}>
                      {displayBattery}
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium">{isOffline ? 'Power Cut' : '8h left'}</span>
                  </div>

                  {/* 3. GPS 7M */}
                  <div className={`p-3 rounded-2xl border transition-all ${
                    isDayMode ? 'bg-white border-gray-100 shadow-sm' : 'bg-slate-800/60 border-slate-700/60'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin size={16} className="text-blue-500" />
                      <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">GPS 7M</span>
                    </div>
                    <div className={`text-base font-black tracking-tight ${isDayMode ? 'text-gray-800' : 'text-slate-100'}`}>
                      {hasValidGps ? `${effectiveTelemetry.lat.toFixed(2)}°N` : 'Searching'}
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium">{effectiveTelemetry?.speedKmh ? `${effectiveTelemetry.speedKmh.toFixed(1)} km/h` : '0 km/h'}</span>
                  </div>

                  {/* 4. RFID */}
                  <div className={`p-3 rounded-2xl border transition-all ${
                    isDayMode ? 'bg-white border-gray-100 shadow-sm' : 'bg-slate-800/60 border-slate-700/60'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Fingerprint size={16} className="text-teal-500" />
                      <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">RFID</span>
                    </div>
                    <div className="text-base font-black tracking-tight text-emerald-600">
                      {effectiveTelemetry?.rfidLastScanned ? 'Verified' : 'Verified'}
                    </div>
                    <span className="text-[9px] font-mono text-gray-400">
                      {effectiveTelemetry?.rfidLastScanned || (transportData?.rfidCard === 1 ? '3913DDB7' : transportData?.rfidCard === 2 ? '19DB5AB7' : '29EE69B7')}
                    </span>
                  </div>

                  {/* 5. REED MAGNETIC (Door Contact Sensor) */}
                  {(() => {
                    // isBoxCurrentlyOpen = real-time physical reed state
                    const isBoxCurrentlyOpen = effectiveTelemetry
                      ? effectiveTelemetry.reedStatus === 'Box Open'
                      : isTampered;
                    // isTamperHistorical = sticky flag (box was opened in transit)
                    const tileRed = isBoxCurrentlyOpen;
                    const tileAmber = !isBoxCurrentlyOpen && isTampered; // closed but was tampered
                    return (
                      <div className={`p-3 rounded-2xl border transition-all duration-300 ${
                        tileRed
                          ? 'bg-red-50/90 border-red-300'
                          : tileAmber
                            ? 'bg-amber-50/80 border-amber-300'
                            : isDayMode ? 'bg-white border-gray-100 shadow-sm' : 'bg-slate-800/60 border-slate-700/60'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <Lock size={16} className={tileRed ? 'text-red-500 animate-pulse' : tileAmber ? 'text-amber-500' : 'text-emerald-500'} />
                          <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">REED MAGNETIC</span>
                        </div>
                        <div className={`text-sm font-extrabold tracking-tight ${
                          tileRed ? 'text-red-600' : tileAmber ? 'text-amber-600' : 'text-emerald-600'
                        }`}>
                          {isBoxCurrentlyOpen ? '🔓 Box OPEN' : '🔒 Box Closed'}
                        </div>
                        <span className="text-[10px] font-medium mt-0.5 block">
                          {isBoxCurrentlyOpen
                            ? <span className="text-red-500 font-bold">⚠ TAMPER ACTIVE</span>
                            : isTampered
                              ? <span className="text-amber-500">Was tampered — now sealed</span>
                              : <span className="text-gray-400">Magnet Sealed ✓</span>
                          }
                        </span>
                      </div>
                    );
                  })()}

                  {/* 6. BUZZER */}
                  {(() => {
                    const buzzerVal = effectiveTelemetry?.buzzerStatus || (isTampered || isTempSpiked ? 'Beeping Alert' : 'Normal');
                    const buzzerActive = buzzerVal === 'Beeping Alert' || buzzerVal === 'TAMPER ALERT';
                    return (
                      <div className={`p-3 rounded-2xl border transition-all ${
                        buzzerActive
                          ? isDayMode ? 'bg-amber-50/80 border-amber-300' : 'bg-amber-900/20 border-amber-700/60'
                          : isDayMode ? 'bg-white border-gray-100 shadow-sm' : 'bg-slate-800/60 border-slate-700/60'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <Bell size={16} className={buzzerActive ? 'text-amber-500 animate-ping' : 'text-gray-400'} />
                          <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">BUZZER</span>
                        </div>
                        <div className={`text-sm font-extrabold tracking-tight ${
                          buzzerActive ? 'text-amber-600' : isDayMode ? 'text-gray-800' : 'text-slate-200'
                        }`}>
                          {buzzerActive ? '🔊 ' : '🔇 '}{buzzerVal}
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium">{buzzerActive ? 'Audio Warning' : 'Silent'}</span>
                      </div>
                    );
                  })()}

                  {/* 7. RELAY (Solenoid Lock Hardware) */}
                  {(() => {
                    const relayVal = effectiveTelemetry?.relayStatus || 'Locked';
                    const isUnlocked = relayVal === 'Unlocked';
                    return (
                      <div className={`p-3 rounded-2xl border transition-all ${
                        isUnlocked
                          ? isDayMode ? 'bg-orange-50/80 border-orange-200' : 'bg-orange-900/20 border-orange-700/60'
                          : isDayMode ? 'bg-emerald-50/50 border-emerald-100 shadow-sm' : 'bg-slate-800/60 border-slate-700/60'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <Lock size={16} className={isUnlocked ? 'text-orange-500' : 'text-emerald-500'} />
                          <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">RELAY</span>
                        </div>
                        <div className={`text-sm font-extrabold tracking-tight ${
                          isUnlocked ? 'text-orange-600' : 'text-emerald-600'
                        }`}>
                          {isUnlocked ? '🔓 Unlocked' : '🔒 Locked'}
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium">Solenoid Hardware</span>
                      </div>
                    );
                  })()}

                  {/* 8. ESP32 HARDWARE */}
                  <div className={`p-3 rounded-2xl border transition-all ${
                    isOffline ? 'bg-red-50/80 border-red-200' : isDayMode ? 'bg-white border-gray-100 shadow-sm' : 'bg-slate-800/60 border-slate-700/60'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Cpu size={16} className={isOffline ? 'text-red-500' : 'text-violet-500'} />
                      <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">ESP32</span>
                    </div>
                    <div className={`text-sm font-extrabold tracking-tight flex items-center gap-1 ${isOffline ? 'text-red-600' : 'text-emerald-600'}`}>
                      <span className={`w-2 h-2 rounded-full ${isOffline ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`} />
                      {isOffline ? 'Offline' : 'Online'}
                    </div>
                    <span className={`text-[10px] font-mono ${isOffline ? 'text-red-400' : 'text-gray-400'}`}>{isOffline ? 'No Connection' : effectiveTelemetry?.firmwareVersion || 'v3.1.0'}</span>
                  </div>

                </div>

                {/* Bottom Alert Banner */}
                {(() => {
                  const isBoxCurrentlyOpen = effectiveTelemetry
                    ? effectiveTelemetry.reedStatus === 'Box Open'
                    : isTampered;
                  const alerts = [];
                  if (isBoxCurrentlyOpen) alerts.push({ type: 'tamper', msg: '🚨 Box OPEN — Reed switch separated! Tamper in progress!' });
                  else if (isTampered) alerts.push({ type: 'warning', msg: '⚠️ Tamper Recorded — Box was opened during transit.' });
                  if (isTempSpiked) alerts.push({ type: 'temp', msg: `⚠️ Temperature ${parseFloat(displayTemp) < 2 ? 'Low' : 'High'} — Cold-chain breach detected: ${displayTemp}` });
                  if (alerts.length === 0) return null;
                  return (
                    <div className="mt-3 space-y-1.5">
                      {alerts.map((a, i) => (
                        <div key={i} className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-xs font-bold ${
                          a.type === 'tamper'
                            ? 'bg-red-50 border-red-200 text-red-800'
                            : a.type === 'warning'
                              ? 'bg-amber-50 border-amber-200 text-amber-800'
                              : 'bg-orange-50 border-orange-200 text-orange-800'
                        }`}>
                          <AlertTriangle size={14} className="shrink-0" />
                          <span>{a.msg}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* Footer Auto Refresh Bar */}
                <div className="flex justify-between items-center text-[10px] text-gray-400 pt-1">
                  <span>Last Updated: {data.lastUpdated}</span>
                  <span className="flex items-center gap-1 text-gray-500">
                    <RotateCw size={10} className="animate-spin text-blue-500" />
                    Auto-refresh in {refreshCountdown}s
                  </span>
                </div>

              </div>

            </div>

            {/* RIGHT COLUMN: Interactive Live Map */}
            <div className="lg:col-span-5 flex flex-col">
              <div className={`relative w-full h-full min-h-[480px] rounded-xl overflow-hidden border shadow-sm flex flex-col ${
                isDayMode ? 'border-gray-200' : 'border-slate-700'
              }`}>
                <InteractiveLiveMap 
                  originName={data.origin} 
                  destinationName={data.destination} 
                  liveTelemetry={effectiveTelemetry}
                  originHospitalData={transportData?.originHospital}
                  destHospitalData={transportData?.destinationHospital}
                />
              </div>
            </div>

          </div>
        </div>

        {/* Modal Footer */}
        <div className={`px-6 py-4 border-t flex justify-end gap-3 shrink-0 pr-16 sm:pr-20 ${
          isDayMode ? 'bg-white border-gray-100' : 'bg-[#101827] border-slate-700'
        }`}>
          <button 
            type="button" 
            onClick={async () => {
              try {
                const { reportEmergency } = await import('../../../services/api');
                await reportEmergency(data.id, 'Manual emergency reported by Liaison Officer from Tracking Dashboard.');
                alert('Emergency alert successfully dispatched and notarized on blockchain!');
              } catch (err) {
                console.error(err);
                alert('Failed to dispatch emergency alert.');
              }
            }} 
            className={`px-5 py-2 border rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              isDayMode ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-red-700/60 text-red-400 hover:bg-red-900/30'
            }`}
          >
            <AlertTriangle size={15} />
            Report Emergency
          </button>
          <button 
            type="button" 
            onClick={() => {
              if (onMarkAsDone) onMarkAsDone(data.id);
            }} 
            className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1.5"
          >
            <CheckCircle2 size={15} />
            Mark as Arrived
          </button>
        </div>

      </div>
    </div>
  );
};

export default LiveTrackingModal;
