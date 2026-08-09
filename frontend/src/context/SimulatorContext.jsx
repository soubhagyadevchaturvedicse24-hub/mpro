import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { getBaseUrl } from '../services/api';

const SimulatorContext = createContext(null);

const defaults = {
  boxId:       'BOX-2026-FABRIC-ALPHA',
  deviceSecret:'secret123',
  missionId:   'TRN-KID-2026-001',
  organType:   'KIDNEY',
  interval:    5,        // seconds
  tempTarget:  2.0,      // target temperature
  minTemp:     0.0,
  maxTemp:     4.0,
  notes:       '0–4°C. Also increasingly uses machine perfusion (hypothermic, ~4-8°C) to extend viability beyond static storage.',
  tempSpike:   0.0,      // NO automatic random temp spikes (user controlled only)
  tamperChance:0.0,      // NO automatic random lid open (user controlled only)
  batteryDrain:0.0,      // NO automatic battery drain (user controlled only)
  startLat:    28.5659,
  startLng:    77.2090,
};

export const ORGAN_PROFILES = {
  KIDNEY: { organType: 'KIDNEY', tempTarget: 2.0, min: 0.0, max: 4.0, notes: '0–4°C. Also increasingly uses machine perfusion (hypothermic, ~4-8°C) to extend viability beyond static storage.' },
  LIVER: { organType: 'LIVER', tempTarget: 2.0, min: 0.0, max: 4.0, notes: '0–4°C. Machine perfusion (both hypothermic and normothermic) increasingly used.' },
  HEART: { organType: 'HEART', tempTarget: 4.0, min: 3.0, max: 5.0, notes: '4°C (Tight range 3-5°C). Very time-sensitive even at cold temp; newer "warm perfusion" devices keep it beating at near-body temp (~34-37°C) instead.' },
  LUNGS: { organType: 'LUNGS', tempTarget: 6.0, min: 4.0, max: 8.0, notes: '4–8°C. Ex-vivo lung perfusion (EVLP) systems can recondition lungs at normothermic temps before transplant.' },
  PANCREAS: { organType: 'PANCREAS', tempTarget: 2.0, min: 0.0, max: 4.0, notes: '0–4°C. Very sensitive to warm ischemia (islet cells damage quickly).' },
  CORNEA: { organType: 'CORNEA', tempTarget: 4.0, min: 2.0, max: 8.0, notes: '2–8°C (short-term) or -196°C (liquid nitrogen, for long-term eye bank storage). Corneas tolerate much longer storage.' },
};

export const SimulatorProvider = ({ children }) => {
  const [cfg, setCfg] = useState({ ...defaults });
  const [running,  setRunning]  = useState(false);
  const [telemetry,setTelemetry]= useState(null);
  const [logs,     setLogs]     = useState([]);
  const [ticks,    setTicks]    = useState(0);
  const [connected,setConnected]= useState(null);
  const [isManualMode, setIsManualMode] = useState(false);
  const [isTamperedMode, setIsTamperedMode] = useState(false);

  // States to drive slider inputs instantly without lag
  const [currentTemp, setCurrentTemp] = useState(defaults.tempTarget);
  const [currentBattery, setCurrentBattery] = useState(100);
  const [routePolyline, setRoutePolyline] = useState([]);

  const state = useRef({
    temp:        cfg.tempTarget,
    battery:     100,
    lat:         cfg.startLat,
    lng:         cfg.startLng,
    isManual:    false,
    isTampered:  false,
    routePoints: [],
    routeIndex:  0,
  });

  // Keep state ref in sync when config changes
  useEffect(() => {
    if (!state.current.isManual) {
      state.current.temp = cfg.tempTarget;
      setCurrentTemp(cfg.tempTarget);
    }
  }, [cfg]);

  const addLog = useCallback((type, msg) => {
    setLogs(prev => [{
      id:   Date.now() + Math.random(),
      type,
      msg,
      ts:   new Date().toLocaleTimeString('en-IN', { hour12:false }),
    }, ...prev].slice(0, 200));
  }, []);

  // Fetch realistic route coordinates via OSRM or fallback interpolation
  const setRoute = useCallback(async (origin, destination) => {
    const startLat = origin?.lat || 28.6675;
    const startLng = origin?.lng || 77.2274;
    const endLat = destination?.lat || 28.4682;
    const endLng = destination?.lng || 77.0378;

    const routeKey = `${origin?.name || startLat}_${destination?.name || endLat}`;

    // Preserve ongoing route progress if modal is re-opened for the same trip!
    // Also, if the simulator is currently running, DO NOT reset lat/lng even if keys jitter.
    if ((running || state.current.activeRouteKey === routeKey) && state.current.routePoints?.length > 0) {
      setRoutePolyline(state.current.routePoints);
      return state.current.routePoints;
    }

    state.current.activeRouteKey = routeKey;
    state.current.lat = startLat;
    state.current.lng = startLng;
    state.current.routeIndex = 0;

    addLog('info', `Fetching optimized route from ${origin?.name || 'Origin'} to ${destination?.name || 'Destination'}...`);

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.routes && data.routes[0]) {
          const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
          state.current.routePoints = coords;
          setRoutePolyline(coords);
          addLog('success', `✓ OSRM Route loaded: ${coords.length} GPS waypoints (${(data.routes[0].distance / 1000).toFixed(1)} km)`);
          return coords;
        }
      }
    } catch (err) {
      addLog('warn', `OSRM offline, generating fallback route: ${err.message}`);
    }

    // Fallback: Interpolate 30 points
    const points = [];
    const steps = 30;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const lat = startLat + t * (endLat - startLat);
      const lng = startLng + t * (endLng - startLng);
      points.push([lat, lng]);
    }
    state.current.routePoints = points;
    setRoutePolyline(points);
    return points;
  }, [addLog]);

  const tick = useCallback(async () => {
    const s = state.current;
    
    // Completely deterministic - temperature, battery, tamper strictly follow state ref
    const spiked = s.temp > cfg.maxTemp || s.temp < cfg.minTemp;
    const tampered = s.isTampered || false;

    // Update UI state representations
    setCurrentTemp(parseFloat(s.temp.toFixed(2)));
    setCurrentBattery(parseFloat(s.battery.toFixed(1)));

    // AdvanceAlong Route
    if (s.routePoints && s.routePoints.length > 0) {
      // OSRM coordinates are very dense. Advance by 12 points per tick (60 secs of real driving) 
      // so the vehicle visibly moves on the map during demonstrations.
      const jumpStep = 12; 
      if (s.routeIndex < s.routePoints.length - 1) {
        s.routeIndex = Math.min(s.routePoints.length - 1, s.routeIndex + jumpStep);
      }
      const [curLat, curLng] = s.routePoints[s.routeIndex];
      s.lat = curLat;
      s.lng = curLng;
    }

    const payload = {
      missionId:   cfg.missionId,
      organType:   cfg.organType,
      temperature: parseFloat(s.temp.toFixed(2)),
      batteryLevel:parseFloat(s.battery.toFixed(1)),
      isTampered:  tampered,
      geoLocation: { type:'Point', coordinates:[s.lng, s.lat] },
    };

    setTelemetry({ ...payload, lat: s.lat, lng: s.lng, spiked, tampered, routeIndex: s.routeIndex });
    setTicks(t => t + 1);

    const logMsg = `[TICK] Lat:${s.lat.toFixed(4)} Lng:${s.lng.toFixed(4)} Temp:${payload.temperature}°C Bat:${payload.batteryLevel}%`;
    addLog('send', logMsg);

    try {
      const API = getBaseUrl();
      const res = await fetch(`${API}/device/telemetry`, {
        method: 'POST',
        headers: {
          'Content-Type':   'application/json',
          'x-device-id':    cfg.boxId,
          'x-device-secret':cfg.deviceSecret,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(4000),
      });

      if (res.ok) {
        setConnected(true);
        addLog('success', `✓ Backend accepted  [${res.status}]`);
      } else {
        const txt = await res.text().catch(() => '');
        setConnected(false);
        addLog('warn', `✗ Backend rejected  [${res.status}] ${txt.slice(0,80)}`);
      }
    } catch (err) {
      setConnected(false);
      addLog('error', `✗ Cannot reach backend — ${err.message} (packet generated locally)`);
    }
  }, [cfg, addLog]);

  const timerRef = useRef(null);

  const fastForward = useCallback((startedAtStr) => {
    if (!state.current.routePoints || state.current.routePoints.length === 0 || !startedAtStr) return;
    try {
      const now = new Date();
      const match = startedAtStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (match) {
        let hours = parseInt(match[1]);
        const mins = parseInt(match[2]);
        const ampm = match[3].toUpperCase();
        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        
        const started = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, mins, 0);
        let diffSecs = (now.getTime() - started.getTime()) / 1000;
        if (diffSecs < 0) diffSecs += 86400; // Handle cross-day simulation

        if (diffSecs > 0) {
           const ticksToAdvance = Math.floor(diffSecs / cfg.interval);
           const newIndex = Math.min(ticksToAdvance, state.current.routePoints.length - 1);
           state.current.routeIndex = newIndex;
           const [curLat, curLng] = state.current.routePoints[newIndex];
           state.current.lat = curLat;
           state.current.lng = curLng;
           addLog('info', `Fast-forwarded simulation by ${Math.floor(diffSecs / 60)} mins.`);
        }
      }
    } catch(e) {}
  }, [cfg.interval, addLog]);

  const start = useCallback((originHospital, destinationHospital, fastForwardTimeStr = null) => {
    if (running) return;
    addLog('info', `▶ Simulator started — Box:${cfg.boxId}  Mission:${cfg.missionId}  Interval:${cfg.interval}s`);
    setRunning(true);

    if (originHospital && destinationHospital) {
      setRoute(originHospital, destinationHospital).then(() => {
        if (fastForwardTimeStr) {
          fastForward(fastForwardTimeStr);
        }
        tick();
        timerRef.current = setInterval(tick, cfg.interval * 1000);
      });
    } else {
      tick();
      timerRef.current = setInterval(tick, cfg.interval * 1000);
    }
  }, [running, tick, cfg, addLog, setRoute, fastForward]);

  const stop = useCallback(() => {
    clearInterval(timerRef.current);
    setRunning(false);
    addLog('info', '■ Simulator stopped.');
  }, [addLog]);

  const reset = useCallback(() => {
    stop();
    state.current = { temp: cfg.tempTarget, battery: 100, lat: cfg.startLat, lng: cfg.startLng, isManual: false, isTampered: false };
    setIsManualMode(false);
    setIsTamperedMode(false);
    setCurrentTemp(cfg.tempTarget);
    setCurrentBattery(100);
    setTelemetry(null);
    setTicks(0);
    setConnected(null);
    setLogs([]);
    addLog('info', '↺ Simulator reset.');
  }, [stop, cfg, addLog]);

  const overrideTemp = useCallback((val) => {
    state.current.temp = val;
    state.current.isManual = true;
    setIsManualMode(true);
    setCurrentTemp(val);
    addLog('info', `Manual override: Temp set to ${val}°C`);
    tick(); // Trigger instant ping & notification update!
  }, [addLog, tick]);

  const overrideBattery = useCallback((val) => {
    state.current.battery = val;
    state.current.isManual = true;
    setIsManualMode(true);
    setCurrentBattery(val);
    addLog('info', `Manual override: Battery set to ${val}%`);
    tick(); // Trigger instant ping & notification update!
  }, [addLog, tick]);

  const overrideTamper = useCallback((val) => {
    state.current.isTampered = val;
    state.current.isManual = true;
    setIsManualMode(true);
    setIsTamperedMode(val);
    addLog('info', `Manual override: Tamper set to ${val ? 'ON' : 'OFF'}`);
    tick(); // Trigger instant ping & notification update!
  }, [addLog, tick]);

  const releaseManual = useCallback(() => {
    state.current.isManual = false;
    setIsManualMode(false);
    setIsTamperedMode(false);
    state.current.isTampered = false;
    
    // Return strictly to current organ target temperature
    state.current.temp = cfg.tempTarget;
    setCurrentTemp(cfg.tempTarget);
    
    addLog('info', 'Manual override released.');
    tick();
  }, [addLog, tick, cfg.tempTarget]);

  const setOrganProfile = useCallback((typeKey) => {
    const profile = ORGAN_PROFILES[typeKey];
    if (!profile) return;
    const shortType = typeKey.substring(0, 3).toUpperCase();
    
    stop(); // stop running simulator on switch
    
    setCfg(prev => ({
      ...prev,
      missionId: `TRN-${shortType}-2026-001`,
      organType: typeKey,
      tempTarget: profile.tempTarget,
      minTemp: profile.min,
      maxTemp: profile.max,
      notes: profile.notes
    }));
    
    addLog('info', `Switched organ profile to ${typeKey}`);
  }, [stop, addLog]);

  const triggerMilestone = useCallback(async (milestone) => {
    addLog('info', `⚡ Triggering Milestone: ${milestone}`);
    try {
      const stepId = milestone.replace('.', '_'); // transport.created -> transport_created
      const API = getBaseUrl();
      let res = await fetch(`${API}/simulator/step`, {
        method: 'POST',
        headers: {
          'Content-Type':   'application/json',
          'x-device-id':    cfg.boxId,
          'x-device-secret':cfg.deviceSecret,
        },
        body: JSON.stringify({ stepId, missionId: cfg.missionId, organType: cfg.organType }),
      });

      if (!res.ok && res.status === 404) {
        // Fail-safe fallback to telemetry route with milestone metadata
        res = await fetch(`${API}/device/telemetry`, {
          method: 'POST',
          headers: {
            'Content-Type':   'application/json',
            'x-device-id':    cfg.boxId,
            'x-device-secret':cfg.deviceSecret,
          },
          body: JSON.stringify({
            missionId: cfg.missionId,
            organType: cfg.organType,
            temperature: currentTemp || cfg.tempTarget,
            batteryLevel: currentBattery || 100,
            isTampered: isTamperedMode || false,
            milestone,
            geoLocation: { type: 'Point', coordinates: [cfg.startLng, cfg.startLat] }
          }),
        });
      }

      if (res.ok) {
        addLog('success', `✓ Backend Generated & Notarized Milestone: ${milestone}`);
      } else {
        addLog('warn', `✗ Milestone rejected [${res.status}]`);
      }
    } catch (err) {
      addLog('error', `✗ Milestone error — ${err.message}`);
    }
  }, [cfg, currentTemp, currentBattery, isTamperedMode, addLog]);

  useEffect(() => () => clearInterval(timerRef.current), []);

  return (
    <SimulatorContext.Provider value={{
      cfg, setCfg, running, telemetry, logs, ticks, connected, isManualMode, isTamperedMode, defaults,
      currentTemp, currentBattery, routePolyline, setRoute,
      start, stop, reset, overrideTemp, overrideBattery, overrideTamper, releaseManual, triggerMilestone, setOrganProfile
    }}>
      {children}
    </SimulatorContext.Provider>
  );
};

export const useSimulatorContext = () => useContext(SimulatorContext);
