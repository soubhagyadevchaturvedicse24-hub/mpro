/**
 * IoTRemoteControl.jsx
 * ─────────────────────────────────────────────────────────────────────────
 * Floating, draggable, minimisable IoT Box Remote Control widget with:
 *  • Physical hardware simulator (temperature, battery, tamper, locks, RFID)
 *  • Interactive 3D Holographic Globe with animated great-circle flight arcs
 *  • 2D Tactical Radar Corridor Map for precision waypoint tracking
 *  • Real-time GPS coordinate calculation & route progression
 *  • Expandable Wide Command Console mode (320px ➔ 700px)
 *  • Dark/Tactical Sci-Fi visual aesthetics matching OrganShield
 * ─────────────────────────────────────────────────────────────────────────
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Thermometer, Battery, Wifi, WifiOff, Lock, Unlock,
  AlertTriangle, CheckCircle2, Radio, Zap, ChevronDown,
  ChevronUp, GripVertical, Cpu, RefreshCcw, Play, Square,
  CreditCard, Shield, Package, Truck, Flag, Globe,
  Maximize2, Minimize2, Navigation, Compass, Layers,
  Crosshair, Plane, Activity, Satellite
} from 'lucide-react';
import { useSimulatorContext } from '../context/SimulatorContext';

/* ─── Helpers ────────────────────────────────────────────────────────── */
const clamp = (v, mn, mx) => Math.max(mn, Math.min(mx, v));
const lerp  = (a, b, t)   => a + (b - a) * t;

/** Returns a CSS colour based on temperature vs organ safe range */
function tempColour(temp, min, max) {
  if (temp < min - 0.5) return '#60a5fa';   // too cold – blue
  if (temp > max + 1.5) return '#f87171';   // critical hot – red
  if (temp > max)       return '#fbbf24';   // warning – amber
  return '#22d3a0';                          // safe – green
}

/** Tiny circular "LED" indicator */
const Led = ({ colour, pulse }) => (
  <span style={{
    display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
    background: colour,
    boxShadow: pulse ? `0 0 8px 2px ${colour}88` : 'none',
    animation: pulse ? 'iotPulse 1.4s ease-in-out infinite' : 'none',
    flexShrink: 0,
  }} />
);

/* ─── RFID Cards ─────────────────────────────────────────────────────── */
const RFID_CARDS = [
  { slot: 1, uid: '3913DDB7', label: 'Card 1 – AIIMS Dispatch' },
  { slot: 2, uid: '19DB5AB7', label: 'Card 2 – Transit Custody' },
  { slot: 3, uid: '29EE69B7', label: 'Card 3 – NIMHANS Arrival' },
];

/* ─── Organ profiles (temperature ranges) ───────────────────────────── */
const ORGAN_PROFILES = {
  KIDNEY:   { label: 'Kidney',   min: 0, max: 4,  target: 2.0, icon: '🫘' },
  LIVER:    { label: 'Liver',    min: 0, max: 4,  target: 2.0, icon: '🩺' },
  HEART:    { label: 'Heart',    min: 3, max: 5,  target: 4.0, icon: '❤️' },
  LUNGS:    { label: 'Lungs',    min: 4, max: 8,  target: 6.0, icon: '🫁' },
  PANCREAS: { label: 'Pancreas', min: 0, max: 4,  target: 2.0, icon: '🧬' },
  CORNEA:   { label: 'Cornea',   min: 2, max: 8,  target: 4.0, icon: '👁️' },
};

/* ─── Box States ─────────────────────────────────────────────────────── */
const BOX_STATES = ['IDLE', 'IN_TRANSIT', 'COMPLETED', 'TAMPERED'];

/* ─── Transit Waypoints & Hubs (Real Indian Hospital Corridor) ───────── */
const CORRIDOR = {
  origin: { name: 'AIIMS New Delhi', lat: 28.5672, lng: 77.2100, code: 'HOS-DEL-0001' },
  destination: { name: 'NIMHANS Bengaluru', lat: 12.9447, lng: 77.5946, code: 'HOS-BLR-0002' },
  distanceKm: 1740,
  checkpoints: [
    { name: 'AIIMS Organ Retrieval OT', lat: 28.5672, lng: 77.2100, pct: 0 },
    { name: 'IGI Airport Green Corridor', lat: 28.5562, lng: 77.1000, pct: 0.15 },
    { name: 'Air Ambulance Mid-Corridor (Bhopal Airspace)', lat: 23.2599, lng: 77.4126, pct: 0.45 },
    { name: 'Hyderabad Transit Relay', lat: 17.3850, lng: 78.4867, pct: 0.72 },
    { name: 'KIA Bengaluru Green Corridor', lat: 13.1986, lng: 77.7066, pct: 0.90 },
    { name: 'NIMHANS Cardiac/Renal OT', lat: 12.9447, lng: 77.5946, pct: 1.0 },
  ]
};

/* Geographic anchor dots representing Indian subcontinent & major global landmasses */
const GLOBE_POINTS = [
  // India Core & Capitals
  [28.61, 77.20], [12.97, 77.59], [19.07, 72.87], [22.57, 88.36], [13.08, 80.27],
  [17.38, 78.48], [23.02, 72.57], [26.91, 75.78], [26.84, 80.94], [21.14, 79.08],
  [21.25, 81.63], [25.59, 85.13], [30.73, 76.77], [34.08, 74.79], [15.29, 74.12],
  [9.93, 76.26], [8.52, 76.93], [26.14, 91.73], [23.83, 91.28], [20.29, 85.82],
  // Indian Peninsula Coastline Contours
  [8.08, 77.55], [10.0, 79.8], [12.0, 79.8], [14.0, 80.1], [16.0, 81.2],
  [18.0, 83.5], [20.0, 86.5], [21.5, 87.0], [22.0, 69.0], [21.0, 72.5],
  [18.5, 73.0], [15.5, 73.8], [13.0, 74.8], [10.0, 75.8], [8.5, 77.0],
  // Himalayan & Border Outline
  [31.0, 78.0], [32.5, 76.0], [34.5, 77.0], [29.0, 82.0], [28.0, 85.0],
  [27.5, 88.5], [27.0, 92.0], [28.0, 95.0], [24.0, 94.0], [22.0, 92.5],
  // Neighboring Reference Points
  [6.92, 79.86], [33.68, 73.04], [24.86, 67.00], [23.81, 90.41], [27.71, 85.32],
  [25.0, 55.0], [24.0, 45.0], [35.0, 51.0], [1.35, 103.8], [13.75, 100.5],
  [39.9, 116.4], [35.6, 139.6], [51.5, -0.12], [48.8, 2.35], [-33.8, 151.2]
];

/* ══════════════════════════════════════════════════════════════════════ */
/* 3D HOLOGRAPHIC CYBER-GLOBE CANVAS COMPONENT                          */
/* ══════════════════════════════════════════════════════════════════════ */
function CyberGlobe({ progress = 0, isTampered = false, activeOrgan = 'KIDNEY' }) {
  const canvasRef = useRef(null);
  const rotRef = useRef({ yaw: 1.35, pitch: -0.45 }); // centered around India
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const animFrameId = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = canvas.width;
    let height = canvas.height;

    const render = () => {
      // Auto-spin slowly if not dragging
      if (!isDragging.current) {
        rotRef.current.yaw += 0.0035;
      }

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const R  = Math.min(width, height) * 0.40;

      const yaw = rotRef.current.yaw;
      const pitch = rotRef.current.pitch;

      // Outer radial atmosphere glow
      const atmoGrad = ctx.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 1.3);
      atmoGrad.addColorStop(0, 'rgba(6, 182, 212, 0.08)');
      atmoGrad.addColorStop(0.7, 'rgba(16, 185, 129, 0.04)');
      atmoGrad.addColorStop(1, 'rgba(6, 9, 18, 0)');
      ctx.fillStyle = atmoGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.35, 0, Math.PI * 2);
      ctx.fill();

      // Sphere Base (Dark space gradient)
      const sphereGrad = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R);
      sphereGrad.addColorStop(0, 'rgba(15, 23, 42, 0.95)');
      sphereGrad.addColorStop(0.8, 'rgba(6, 9, 20, 0.98)');
      sphereGrad.addColorStop(1, 'rgba(2, 6, 23, 1)');
      ctx.fillStyle = sphereGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      // Sphere Outer Boundary Ring
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Project spherical (lat, lng in degrees) to screen (x, y, z)
      const project = (latDeg, lngDeg, elev = 0) => {
        const phi = (latDeg * Math.PI) / 180;
        const theta = (lngDeg * Math.PI) / 180;
        const r = R + elev;

        const x0 = r * Math.cos(phi) * Math.sin(theta);
        const y0 = -r * Math.sin(phi);
        const z0 = r * Math.cos(phi) * Math.cos(theta);

        // Rotate yaw (around Y)
        const x1 = x0 * Math.cos(yaw) + z0 * Math.sin(yaw);
        const z1 = -x0 * Math.sin(yaw) + z0 * Math.cos(yaw);

        // Rotate pitch (around X)
        const y2 = y0 * Math.cos(pitch) - z1 * Math.sin(pitch);
        const z2 = y0 * Math.sin(pitch) + z1 * Math.cos(pitch);

        return { x: cx + x1, y: cy + y2, z: z2, isFront: z2 > 0 };
      };

      // ── Draw Latitude Parallels ────────────────────────────────────
      ctx.lineWidth = 0.6;
      [-45, -20, 0, 20, 45].forEach(lat => {
        ctx.beginPath();
        let first = true;
        for (let lng = 0; lng <= 360; lng += 8) {
          const pt = project(lat, lng);
          if (pt.isFront) {
            if (first) { ctx.moveTo(pt.x, pt.y); first = false; }
            else ctx.lineTo(pt.x, pt.y);
          } else {
            first = true;
          }
        }
        ctx.strokeStyle = lat === 0 ? 'rgba(34, 211, 160, 0.25)' : 'rgba(56, 189, 248, 0.10)';
        ctx.stroke();
      });

      // ── Draw Longitude Meridians ───────────────────────────────────
      [0, 45, 90, 135, 180, 225, 270, 315].forEach(lng => {
        ctx.beginPath();
        let first = true;
        for (let lat = -80; lat <= 80; lat += 6) {
          const pt = project(lat, lng);
          if (pt.isFront) {
            if (first) { ctx.moveTo(pt.x, pt.y); first = false; }
            else ctx.lineTo(pt.x, pt.y);
          } else {
            first = true;
          }
        }
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
        ctx.stroke();
      });

      // ── Draw Geographic Contour Points ─────────────────────────────
      GLOBE_POINTS.forEach(([lat, lng]) => {
        const pt = project(lat, lng);
        if (pt.isFront) {
          const alpha = (pt.z / R) * 0.75 + 0.15;
          ctx.fillStyle = `rgba(34, 211, 160, ${alpha.toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // ── Draw Great Circle Transit Arc (AIIMS ➔ NIMHANS) ────────────
      const p1 = CORRIDOR.origin;
      const p2 = CORRIDOR.destination;
      const arcSteps = 40;
      const arcPoints = [];

      for (let i = 0; i <= arcSteps; i++) {
        const t = i / arcSteps;
        const curLat = lerp(p1.lat, p2.lat, t);
        const curLng = lerp(p1.lng, p2.lng, t);
        // Elevate the arc into the 3D space above the globe surface
        const elevation = Math.sin(t * Math.PI) * (R * 0.18);
        arcPoints.push({ ...project(curLat, curLng, elevation), t });
      }

      // Draw Glowing Flight Arc
      ctx.beginPath();
      let hasStarted = false;
      arcPoints.forEach(pt => {
        if (pt.isFront) {
          if (!hasStarted) { ctx.moveTo(pt.x, pt.y); hasStarted = true; }
          else ctx.lineTo(pt.x, pt.y);
        } else {
          hasStarted = false;
        }
      });
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.65)';
      ctx.lineWidth = 2.0;
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);

      // ── Origin Node: AIIMS (Blue Halo) ─────────────────────────────
      const oPt = project(p1.lat, p1.lng, 2);
      if (oPt.isFront) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
        ctx.beginPath(); ctx.arc(oPt.x, oPt.y, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath(); ctx.arc(oPt.x, oPt.y, 3, 0, Math.PI * 2); ctx.fill();

        ctx.font = '9px monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('DELHI', oPt.x + 8, oPt.y - 4);
      }

      // ── Destination Node: NIMHANS (Emerald Halo) ───────────────────
      const dPt = project(p2.lat, p2.lng, 2);
      if (dPt.isFront) {
        ctx.fillStyle = 'rgba(34, 211, 160, 0.35)';
        ctx.beginPath(); ctx.arc(dPt.x, dPt.y, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#22d3a0';
        ctx.beginPath(); ctx.arc(dPt.x, dPt.y, 3, 0, Math.PI * 2); ctx.fill();

        ctx.font = '9px monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('BLR', dPt.x + 8, dPt.y + 4);
      }

      // ── Moving IoT Box Beacon ──────────────────────────────────────
      const boxT = clamp(progress, 0.02, 0.98);
      const boxLat = lerp(p1.lat, p2.lat, boxT);
      const boxLng = lerp(p1.lng, p2.lng, boxT);
      const boxElev = Math.sin(boxT * Math.PI) * (R * 0.18);
      const boxPt = project(boxLat, boxLng, boxElev);

      if (boxPt.isFront) {
        const beaconCol = isTampered ? '#f87171' : '#22d3a0';
        const now = Date.now() / 300;
        const pulseR = 5 + (Math.sin(now) + 1) * 3;

        // Sonar ping ring
        ctx.strokeStyle = beaconCol;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(boxPt.x, boxPt.y, pulseR, 0, Math.PI * 2);
        ctx.stroke();

        // Core dot
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(boxPt.x, boxPt.y, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Callout Tag
        ctx.fillStyle = isTampered ? 'rgba(248,113,113,0.9)' : 'rgba(15,23,42,0.85)';
        ctx.strokeStyle = beaconCol;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(boxPt.x + 8, boxPt.y - 18, 76, 16, 4);
        ctx.fill();
        ctx.stroke();

        ctx.font = '8px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`BOX-ALPHA · ${Math.round(boxT * 100)}%`, boxPt.x + 12, boxPt.y - 7);
      }

      animFrameId.current = requestAnimationFrame(render);
    };

    render();

    // Mouse Drag Rotation Listeners
    const onCanvasDown = (e) => {
      isDragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
    };

    const onCanvasMove = (e) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      rotRef.current.yaw += dx * 0.008;
      rotRef.current.pitch = clamp(rotRef.current.pitch + dy * 0.008, -1.2, 1.2);
    };

    const onCanvasUp = () => {
      isDragging.current = false;
    };

    canvas.addEventListener('mousedown', onCanvasDown);
    window.addEventListener('mousemove', onCanvasMove);
    window.addEventListener('mouseup', onCanvasUp);

    return () => {
      cancelAnimationFrame(animFrameId.current);
      canvas.removeEventListener('mousedown', onCanvasDown);
      window.removeEventListener('mousemove', onCanvasMove);
      window.removeEventListener('mouseup', onCanvasUp);
    };
  }, [progress, isTampered]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        width={320}
        height={260}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: 'grab',
        }}
      />
      <div style={{
        position: 'absolute',
        bottom: 8,
        left: 10,
        fontSize: '0.58rem',
        color: '#64748b',
        fontFamily: 'monospace',
        pointerEvents: 'none',
      }}>
        👆 Drag to spin 3D globe · Auto-tracking
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════ */
/* 2D TACTICAL RADAR CORRIDOR COMPONENT                                 */
/* ══════════════════════════════════════════════════════════════════════ */
function TacticalCorridorMap({ progress = 0, isTampered = false }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let angle = 0;
    let animId;

    const render = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // Radar Concentric Grid
      const cx = W / 2;
      const cy = H / 2;
      [40, 80, 110].forEach(r => {
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Crosshair lines
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)';
      ctx.beginPath();
      ctx.moveTo(cx, 10); ctx.lineTo(cx, H - 10);
      ctx.moveTo(10, cy); ctx.lineTo(W - 10, cy);
      ctx.stroke();

      // Rotating Radar Sweep Beam
      angle += 0.04;
      const sweepLen = 115;
      const sx = cx + Math.cos(angle) * sweepLen;
      const sy = cy + Math.sin(angle) * sweepLen;
      const grad = ctx.createLinearGradient(cx, cy, sx, sy);
      grad.addColorStop(0, 'rgba(34, 211, 160, 0.45)');
      grad.addColorStop(1, 'rgba(34, 211, 160, 0)');

      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(sx, sy);
      ctx.stroke();

      // Highway / Air Corridor Vector Path
      const startX = 50, startY = 40;
      const endX = W - 50, endY = H - 40;

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.bezierCurveTo(startX + 80, startY + 20, endX - 80, endY - 20, endX, endY);
      ctx.stroke();

      // Checkpoints along corridor
      CORRIDOR.checkpoints.forEach((cp, idx) => {
        const cxPt = lerp(startX, endX, cp.pct);
        const cyPt = lerp(startY, endY, cp.pct);
        const passed = progress >= cp.pct;

        ctx.fillStyle = passed ? '#22d3a0' : '#475569';
        ctx.beginPath();
        ctx.arc(cxPt, cyPt, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '7.5px monospace';
        ctx.fillStyle = passed ? '#94a3b8' : '#334155';
        ctx.fillText(`WP${idx + 1}`, cxPt + 6, cyPt + 2);
      });

      // Current IoT Position on Corridor
      const curX = lerp(startX, endX, progress);
      const curY = lerp(startY, endY, progress);
      const pColor = isTampered ? '#f87171' : '#22d3a0';

      ctx.fillStyle = pColor;
      ctx.beginPath();
      ctx.arc(curX, curY, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [progress, isTampered]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        width={320}
        height={260}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════ */
/* MAIN IOT REMOTE CONTROL COMPONENT                                    */
/* ══════════════════════════════════════════════════════════════════════ */
export default function IoTRemoteControl() {
  /* ── Context (shared with SimulatorPage) ─ */
  const sim = useSimulatorContext();

  /* ── Widget UI state ─────────────────────────────────────────────── */
  const [minimised, setMinimised]   = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // Wide Tactical Mode
  const [mapMode, setMapMode]       = useState('3d');  // '3d' (Globe) | 'radar' (2D Tactical)
  const [pos, setPos]               = useState({ x: 24, y: 70 }); // px from top-left or relative
  const [organ, setOrgan]           = useState('KIDNEY');

  /* ── IoT box state (mirrors physical device) ─────────────────────── */
  const [boxState,   setBoxState]   = useState('IDLE');
  const [temp,       setTempVal]    = useState(2.0);
  const [battery,    setBattery]    = useState(95);
  const [locked,     setLocked]     = useState(false);
  const [tampered,   setTampered]   = useState(false);
  const [buzzer,     setBuzzer]     = useState(false);
  const [wifiOn,     setWifiOn]     = useState(true);
  const [sending,    setSending]    = useState(false);
  const [lastPing,   setLastPing]   = useState(null);
  const [tickCount,  setTickCount]  = useState(0);
  const [rfidActive, setRfidActive] = useState(null);
  const [autoRun,    setAutoRun]    = useState(false);
  const [transitProgress, setTransitProgress] = useState(0.24); // 0 to 1
  const autoTimerRef = useRef(null);

  const profile = ORGAN_PROFILES[organ];

  /* ── Dragging ────────────────────────────────────────────────────── */
  const dragging  = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const widgetRef = useRef(null);

  const onMouseDown = useCallback((e) => {
    if (e.target.closest('button, input, select, canvas')) return;
    dragging.current  = true;
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y };
    document.body.style.userSelect = 'none';
  }, [pos]);

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return;
      const dx = e.clientX - dragStart.current.mx;
      const dy = e.clientY - dragStart.current.my;
      const W  = widgetRef.current?.offsetWidth  || (isExpanded ? 680 : 310);
      const H  = widgetRef.current?.offsetHeight || 500;
      setPos({
        x: clamp(dragStart.current.px + dx, 0, window.innerWidth  - W - 8),
        y: clamp(dragStart.current.py + dy, 0, window.innerHeight - H - 8),
      });
    };
    const onUp = () => {
      dragging.current = false;
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };
  }, [isExpanded]);

  /* ── Automatic Transit Progression when in IN_TRANSIT mode ───────── */
  useEffect(() => {
    if (boxState === 'IN_TRANSIT' || autoRun) {
      const id = setInterval(() => {
        setTransitProgress(p => (p >= 1 ? 0 : parseFloat((p + 0.02).toFixed(3))));
      }, 3000);
      return () => clearInterval(id);
    }
  }, [boxState, autoRun]);

  /* ── Temperature auto-drift ───────────────────────────────────────── */
  useEffect(() => {
    if (tampered) return;
    const id = setInterval(() => {
      setTempVal(t => {
        const noise = (Math.random() - 0.5) * 0.08;
        return parseFloat(clamp(t + noise, profile.min - 2, profile.max + 4).toFixed(2));
      });
    }, 3000);
    return () => clearInterval(id);
  }, [tampered, profile]);

  /* ── Battery drain ────────────────────────────────────────────────── */
  useEffect(() => {
    if (!autoRun) return;
    const id = setInterval(() => {
      setBattery(b => Math.max(0, parseFloat((b - 0.1).toFixed(1))));
    }, 5000);
    return () => clearInterval(id);
  }, [autoRun]);

  /* ── Send telemetry to backend ───────────────────────────────────── */
  const sendTelemetry = useCallback(async (extras = {}) => {
    if (!wifiOn) return;
    setSending(true);
    setTickCount(t => t + 1);

    // Compute live coordinates along Delhi ➔ Bengaluru corridor
    const curLat = parseFloat(lerp(CORRIDOR.origin.lat, CORRIDOR.destination.lat, transitProgress).toFixed(4));
    const curLng = parseFloat(lerp(CORRIDOR.origin.lng, CORRIDOR.destination.lng, transitProgress).toFixed(4));

    const payload = {
      boxId:        sim?.cfg?.boxId        || 'BOX-2026-FABRIC-ALPHA',
      deviceSecret: sim?.cfg?.deviceSecret || 'secret123',
      missionId:    sim?.cfg?.missionId    || 'TRN-KID-2026-001',
      organType:    organ,
      temperature:  temp,
      batteryLevel: battery,
      isTampered:   tampered,
      locked,
      buzzerActive: buzzer,
      boxState,
      geoLocation: {
        type: 'Point',
        coordinates: [curLng, curLat],
      },
      ...extras,
    };

    try {
      const { getBaseUrl } = await import('../services/api');
      const base = getBaseUrl();
      await fetch(`${base}/device/telemetry`, {
        method: 'POST',
        headers: {
          'Content-Type':    'application/json',
          'x-device-id':     payload.boxId,
          'x-device-secret': payload.deviceSecret,
        },
        body: JSON.stringify(payload),
      });
      setLastPing(new Date().toLocaleTimeString('en-IN', { hour12: false }));
      sim?.overrideTemp?.(temp);
      sim?.overrideBattery?.(battery);
      if (tampered) sim?.overrideTamper?.(true);
    } catch (_) { /* offline OK */ }
    finally { setSending(false); }
  }, [wifiOn, temp, battery, tampered, locked, buzzer, boxState, organ, sim, transitProgress]);

  /* ── Auto-run loop ────────────────────────────────────────────────── */
  useEffect(() => {
    if (!autoRun) { clearInterval(autoTimerRef.current); return; }
    clearInterval(autoTimerRef.current);
    autoTimerRef.current = setInterval(() => sendTelemetry(), 5000);
    return () => clearInterval(autoTimerRef.current);
  }, [autoRun, sendTelemetry]);

  /* ── Tamper → buzzer alarm ────────────────────────────────────────── */
  useEffect(() => {
    if (tampered) {
      setBuzzer(true);
      setBoxState('TAMPERED');
      sim?.overrideTamper?.(true);
      sendTelemetry({ milestone: 'TAMPER_DETECTED' });
    } else {
      setBuzzer(false);
      if (boxState === 'TAMPERED') setBoxState('IN_TRANSIT');
      sim?.overrideTamper?.(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tampered]);

  /* ── RFID Tap simulation ─────────────────────────────────────────── */
  const tapCard = useCallback(async (card) => {
    setRfidActive(card.uid);
    setTimeout(() => setRfidActive(null), 1200);

    const nextState = boxState === 'IDLE' ? 'IN_TRANSIT' : 'COMPLETED';
    setBoxState(nextState);
    if (nextState === 'IN_TRANSIT') {
      setLocked(true);
      setTransitProgress(0.15);
    }
    if (nextState === 'COMPLETED') {
      setLocked(false);
      setTransitProgress(1.0);
    }

    await sendTelemetry({
      rfidUid: card.uid,
      milestone: nextState === 'IN_TRANSIT' ? 'TRANSPORT_STARTED' : 'DELIVERY_COMPLETED',
    });
    sim?.triggerMilestone?.(nextState === 'IN_TRANSIT' ? 'transport.started' : 'transport.completed');
  }, [boxState, sendTelemetry, sim]);

  /* ── Colour helpers ─────────────────────────────────────────────── */
  const tCol = tempColour(temp, profile.min, profile.max);
  const batCol = battery > 50 ? '#22d3a0' : battery > 20 ? '#fbbf24' : '#f87171';

  const stateColour = {
    IDLE:       '#60a5fa',
    IN_TRANSIT: '#22d3a0',
    COMPLETED:  '#a78bfa',
    TAMPERED:   '#f87171',
  }[boxState] || '#60a5fa';

  const liveLat = lerp(CORRIDOR.origin.lat, CORRIDOR.destination.lat, transitProgress).toFixed(4);
  const liveLng = lerp(CORRIDOR.origin.lng, CORRIDOR.destination.lng, transitProgress).toFixed(4);
  const distanceCovered = Math.round(CORRIDOR.distanceKm * transitProgress);
  const etaMinutes = Math.max(4, Math.round((1 - transitProgress) * 75));

  /* ════════════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════════════ */
  return (
    <>
      <style>{`
        @keyframes iotPulse {
          0%, 100% { opacity: 1;  transform: scale(1);    }
          50%       { opacity: .6; transform: scale(1.35); }
        }
        @keyframes iotSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes iotTamperShake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-3px); }
          40%     { transform: translateX(3px); }
          60%     { transform: translateX(-2px); }
          80%     { transform: translateX(2px); }
        }
        .iot-tamper-banner { animation: iotTamperShake .4s ease infinite; }
        .iot-rfid-flash    { animation: iotPulse .3s ease 4; }
      `}</style>

      <div
        ref={widgetRef}
        onMouseDown={onMouseDown}
        style={{
          position:    'fixed',
          left:        pos.x,
          top:         pos.y,
          zIndex:      9999,
          width:       minimised ? 230 : isExpanded ? 680 : 320,
          maxWidth:    '96vw',
          cursor:      'grab',
          userSelect:  'none',
          fontFamily:  'var(--font-sans, Inter, sans-serif)',
          transition:  'width .28s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* ── Widget Shell ─────────────────────────────────────────── */}
        <div style={{
          background:   'rgba(9, 11, 22, 0.94)',
          backdropFilter: 'blur(24px) saturate(1.5)',
          border:       `1.5px solid ${tampered ? '#f87171' : 'rgba(34,211,160,0.30)'}`,
          borderRadius: 16,
          boxShadow:    tampered
            ? '0 0 32px rgba(248,113,113,0.35), 0 10px 48px rgba(0,0,0,0.9)'
            : '0 0 28px rgba(34,211,160,0.16), 0 10px 48px rgba(0,0,0,0.9)',
          overflow:     'hidden',
          transition:   'border-color .3s, box-shadow .3s',
        }}>

          {/* ── HEADER / DRAG HANDLE ──────────────────────────────── */}
          <div style={{
            display:        'flex',
            alignItems:     'center',
            gap:            8,
            padding:        '10px 12px',
            background:     tampered
              ? 'linear-gradient(90deg, rgba(248,113,113,0.18), rgba(9,11,22,0))'
              : 'linear-gradient(90deg, rgba(34,211,160,0.14), rgba(9,11,22,0))',
            borderBottom:   '1px solid rgba(255,255,255,0.08)',
            cursor:         'grab',
          }}>
            <GripVertical size={13} style={{ color: '#475569', flexShrink: 0 }} />

            {/* Logo / icon */}
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background:  'linear-gradient(135deg, #22d3a0, #38bdf8)',
              display:     'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink:  0,
              boxShadow:   '0 2px 8px rgba(34,211,160,0.3)',
            }}>
              <Cpu size={15} color="#050508" />
            </div>

            {/* Title */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '.3px' }}>
                OrganShield IoT Remote
              </div>
              {!minimised && (
                <div style={{ fontSize: '0.6rem', color: '#64748b', marginTop: 1 }}>
                  {isExpanded ? 'Tactical Telemetry & 3D Radar Station' : 'ESP32 Hardware Sim · v3.2'}
                </div>
              )}
            </div>

            {/* Live temp pill */}
            <div style={{
              display:      'flex', alignItems: 'center', gap: 4,
              padding:      '2px 8px', borderRadius: 20,
              background:   `${tCol}18`,
              border:       `1px solid ${tCol}44`,
              fontSize:     '0.65rem', fontWeight: 700, color: tCol,
              flexShrink:   0,
            }}>
              <Thermometer size={10} />
              {temp.toFixed(1)}°C
            </div>

            {/* Status LED */}
            <Led colour={stateColour} pulse={boxState === 'IN_TRANSIT'} />

            {/* Expand Wide Map Toggle */}
            {!minimised && (
              <button
                onClick={() => setIsExpanded(e => !e)}
                style={{
                  background: isExpanded ? 'rgba(34,211,160,0.15)' : 'none',
                  border: isExpanded ? '1px solid rgba(34,211,160,0.35)' : 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  color: isExpanded ? '#22d3a0' : '#64748b',
                  padding: '3px 5px',
                  display: 'flex', alignItems: 'center', gap: 3,
                  fontSize: '0.62rem', fontWeight: 600,
                  transition: 'all .15s',
                }}
                title={isExpanded ? 'Collapse Map' : 'Expand 3D Globe / Tactical Map'}
              >
                <Globe size={13} />
                <span style={{ display: isExpanded ? 'inline' : 'none' }}>3D</span>
              </button>
            )}

            {/* Minimise toggle */}
            <button
              onClick={() => setMinimised(m => !m)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#64748b', padding: 2, display: 'flex', alignItems: 'center',
              }}
              title={minimised ? 'Expand' : 'Minimise'}
            >
              {minimised ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
          </div>

          {/* ── BODY ──────────────────────────────────────────────── */}
          <AnimatePresence initial={false}>
            {!minimised && (
              <motion.div
                key="body"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                style={{ overflow: 'hidden' }}
              >
                {/* Responsive Split Container (2 columns when expanded) */}
                <div style={{
                  display: isExpanded ? 'grid' : 'block',
                  gridTemplateColumns: isExpanded ? '310px 1fr' : '1fr',
                  gap: 12,
                  padding: '12px 14px',
                }}>

                  {/* ═════════════════════════════════════════════════
                      COLUMN 1: PHYSICAL HARDWARE CONTROLLER
                      ═════════════════════════════════════════════════ */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                    {/* Tamper Alert Banner */}
                    <AnimatePresence>
                      {tampered && (
                        <motion.div
                          key="tamper-banner"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="iot-tamper-banner"
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '7px 10px', borderRadius: 8,
                            background: 'rgba(248,113,113,0.14)',
                            border: '1px solid rgba(248,113,113,0.4)',
                            fontSize: '0.68rem', fontWeight: 700, color: '#f87171',
                          }}
                        >
                          <AlertTriangle size={12} style={{ flexShrink: 0 }} />
                          🚨 TAMPER DETECTED — Box Lid Open!
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* State + Organ Profile Chips */}
                    <Section label="Box State" icon={<Package size={11} />} colour="#60a5fa">
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {BOX_STATES.map(s => (
                          <StateChip
                            key={s} label={s}
                            active={boxState === s}
                            colour={stateColour}
                            onClick={() => {
                              setBoxState(s);
                              if (s === 'IN_TRANSIT') setLocked(true);
                              if (s === 'COMPLETED') { setLocked(false); setTransitProgress(1.0); }
                            }}
                          />
                        ))}
                      </div>
                    </Section>

                    <Section label="Organ Profile" icon={<span style={{ fontSize: 11 }}>{profile.icon}</span>} colour="#a78bfa">
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {Object.entries(ORGAN_PROFILES).map(([key, p]) => (
                          <StateChip
                            key={key} label={p.label}
                            active={organ === key}
                            colour="#a78bfa"
                            onClick={() => {
                              setOrgan(key);
                              setTempVal(p.target);
                              sim?.setOrganProfile?.(key);
                            }}
                          />
                        ))}
                      </div>
                    </Section>

                    {/* Temperature Slider */}
                    <Section label="Temperature" icon={<Thermometer size={11} />} colour={tCol}>
                      <div style={{ position: 'relative' }}>
                        <div style={{
                          position: 'absolute', top: 10, height: 6, borderRadius: 3,
                          background: 'rgba(34,211,160,0.18)',
                          border: '1px solid rgba(34,211,160,0.3)',
                          left:  `${((profile.min + 2) / 14) * 100}%`,
                          width: `${((profile.max - profile.min) / 14) * 100}%`,
                          pointerEvents: 'none',
                        }} />
                        <input
                          type="range" min={-2} max={12} step={0.1}
                          value={temp}
                          onChange={e => {
                            const v = parseFloat(e.target.value);
                            setTempVal(v);
                            sim?.overrideTemp?.(v);
                          }}
                          style={sliderStyle(tCol)}
                        />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                        <span style={{ fontSize: '0.6rem', color: '#475569' }}>-2°C</span>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: tCol }}>
                          {temp.toFixed(1)}°C
                          {temp >= profile.min && temp <= profile.max
                            ? ' ✓ SAFE' : temp > profile.max ? ' ⚠ HOT' : ' ❄ COLD'}
                        </span>
                        <span style={{ fontSize: '0.6rem', color: '#475569' }}>+12°C</span>
                      </div>
                    </Section>

                    {/* Battery Slider */}
                    <Section label="Battery Level" icon={<Battery size={11} />} colour={batCol}>
                      <input
                        type="range" min={0} max={100} step={1}
                        value={battery}
                        onChange={e => {
                          const v = parseInt(e.target.value, 10);
                          setBattery(v);
                          sim?.overrideBattery?.(v);
                        }}
                        style={sliderStyle(batCol)}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                        <span style={{ fontSize: '0.6rem', color: '#475569' }}>0%</span>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: batCol }}>
                          {battery}%
                          {battery > 50 ? ' 🟢' : battery > 20 ? ' 🟡' : ' 🔴 LOW'}
                        </span>
                        <span style={{ fontSize: '0.6rem', color: '#475569' }}>100%</span>
                      </div>
                    </Section>

                    {/* Hardware Toggles */}
                    <Section label="Hardware Controls" icon={<Shield size={11} />} colour="#fbbf24">
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                        <ToggleBtn
                          label="🔓 Reed / Tamper"
                          active={tampered}
                          activeColour="#f87171"
                          onClick={() => setTampered(t => !t)}
                        />
                        <ToggleBtn
                          label={locked ? '🔒 Locked' : '🔓 Unlocked'}
                          active={locked}
                          activeColour="#22d3a0"
                          onClick={() => setLocked(l => !l)}
                        />
                        <ToggleBtn
                          label={buzzer ? '🔊 Buzzer ON' : '🔇 Buzzer OFF'}
                          active={buzzer}
                          activeColour="#fbbf24"
                          onClick={() => setBuzzer(b => !b)}
                        />
                        <ToggleBtn
                          label={wifiOn ? '📡 WiFi ON' : '📵 WiFi OFF'}
                          active={wifiOn}
                          activeColour="#60a5fa"
                          onClick={() => setWifiOn(w => !w)}
                        />
                      </div>
                    </Section>

                    {/* RFID Cards */}
                    <Section label="RFID Card Tap" icon={<CreditCard size={11} />} colour="#a78bfa">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {RFID_CARDS.map(card => (
                          <button
                            key={card.uid}
                            onClick={() => tapCard(card)}
                            className={rfidActive === card.uid ? 'iot-rfid-flash' : ''}
                            style={{
                              display:        'flex',
                              alignItems:     'center',
                              gap:            8,
                              padding:        '5px 8px',
                              borderRadius:   8,
                              background:     rfidActive === card.uid
                                ? 'rgba(167,139,250,0.25)'
                                : 'rgba(167,139,250,0.08)',
                              border:         `1px solid ${rfidActive === card.uid
                                ? 'rgba(167,139,250,0.6)'
                                : 'rgba(167,139,250,0.2)'}`,
                              cursor:         'pointer',
                              width:          '100%',
                              textAlign:      'left',
                            }}
                          >
                            <Radio size={12} style={{ color: '#a78bfa', flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#e2e8f0' }}>
                                {card.label}
                              </div>
                              <div style={{ fontFamily: 'monospace', fontSize: '0.58rem', color: '#a78bfa' }}>
                                UID: {card.uid}
                              </div>
                            </div>
                            <span style={{ fontSize: '0.55rem', color: '#a78bfa', background: 'rgba(167,139,250,0.15)', padding: '1px 5px', borderRadius: 8 }}>
                              TAP
                            </span>
                          </button>
                        ))}
                      </div>
                    </Section>

                    {/* Action Buttons */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                      <ActionBtn
                        label={autoRun ? 'Stop' : 'Auto'}
                        icon={autoRun ? <Square size={11} /> : <Play size={11} />}
                        colour={autoRun ? '#f87171' : '#22d3a0'}
                        onClick={() => {
                          setAutoRun(r => !r);
                          if (!autoRun) sim?.start?.();
                          else sim?.stop?.();
                        }}
                      />
                      <ActionBtn
                        label={sending ? '...' : 'Ping'}
                        icon={sending
                          ? <RefreshCcw size={11} style={{ animation: 'iotSpin 1s linear infinite' }} />
                          : <Zap size={11} />}
                        colour="#60a5fa"
                        onClick={() => sendTelemetry({ milestone: 'MANUAL_PING' })}
                        disabled={sending}
                      />
                      <ActionBtn
                        label="Reset"
                        icon={<RefreshCcw size={11} />}
                        colour="#fbbf24"
                        onClick={() => {
                          setBoxState('IDLE');
                          setTempVal(profile.target);
                          setBattery(95);
                          setLocked(false);
                          setTampered(false);
                          setBuzzer(false);
                          setAutoRun(false);
                          setTransitProgress(0.0);
                          sim?.reset?.();
                        }}
                      />
                    </div>

                    {/* If not expanded, give a 1-click shortcut to launch the Map */}
                    {!isExpanded && (
                      <button
                        onClick={() => setIsExpanded(true)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          padding: '7px 10px', borderRadius: 8,
                          background: 'rgba(6, 182, 212, 0.12)',
                          border: '1px solid rgba(6, 182, 212, 0.35)',
                          color: '#38bdf8', fontSize: '0.65rem', fontWeight: 700,
                          cursor: 'pointer', transition: 'all .15s',
                        }}
                      >
                        <Globe size={13} />
                        Open Live 3D Globe & Radar Tracking
                      </button>
                    )}

                  </div>

                  {/* ═════════════════════════════════════════════════
                      COLUMN 2: LIVE 3D GLOBE & TACTICAL RADAR STATION
                      ═════════════════════════════════════════════════ */}
                  {isExpanded && (
                    <div style={{
                      display: 'flex', flexDirection: 'column', gap: 8,
                      borderLeft: '1px solid rgba(255,255,255,0.07)',
                      paddingLeft: 12,
                    }}>

                      {/* Station Header & View Mode Switch */}
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '4px 6px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Compass size={13} style={{ color: '#22d3a0' }} />
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#e2e8f0' }}>
                            Live Transit Corridor
                          </span>
                        </div>

                        {/* Toggle between 3D Globe and 2D Radar */}
                        <div style={{
                          display: 'flex', gap: 3, background: 'rgba(255,255,255,0.05)',
                          padding: 2, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
                        }}>
                          <button
                            onClick={() => setMapMode('3d')}
                            style={{
                              border: 'none',
                              padding: '3px 8px', borderRadius: 6,
                              background: mapMode === '3d' ? 'rgba(34,211,160,0.25)' : 'none',
                              color: mapMode === '3d' ? '#22d3a0' : '#64748b',
                              fontSize: '0.6rem', fontWeight: 700, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: 4,
                            }}
                          >
                            <Globe size={11} /> 3D Globe
                          </button>
                          <button
                            onClick={() => setMapMode('radar')}
                            style={{
                              border: 'none',
                              padding: '3px 8px', borderRadius: 6,
                              background: mapMode === 'radar' ? 'rgba(56,189,248,0.25)' : 'none',
                              color: mapMode === 'radar' ? '#38bdf8' : '#64748b',
                              fontSize: '0.6rem', fontWeight: 700, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: 4,
                            }}
                          >
                            <Crosshair size={11} /> 2D Radar
                          </button>
                        </div>
                      </div>

                      {/* Origin ➔ Destination Route Banner */}
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '6px 10px', borderRadius: 8,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        fontSize: '0.62rem',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ color: '#38bdf8', fontWeight: 700 }}>AIIMS (DEL)</span>
                          <span style={{ color: '#64748b' }}>➔</span>
                          <span style={{ color: '#22d3a0', fontWeight: 700 }}>NIMHANS (BLR)</span>
                        </div>
                        <span style={{ color: '#94a3b8', fontFamily: 'monospace' }}>
                          {distanceCovered} / {CORRIDOR.distanceKm} km ({Math.round(transitProgress * 100)}%)
                        </span>
                      </div>

                      {/* Visualizer Canvas Frame */}
                      <div style={{
                        height: 250,
                        background: '#040711',
                        borderRadius: 12,
                        border: '1px solid rgba(6,182,212,0.25)',
                        overflow: 'hidden',
                        position: 'relative',
                        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)',
                      }}>
                        {mapMode === '3d' ? (
                          <CyberGlobe
                            progress={transitProgress}
                            isTampered={tampered}
                            activeOrgan={organ}
                          />
                        ) : (
                          <TacticalCorridorMap
                            progress={transitProgress}
                            isTampered={tampered}
                          />
                        )}
                      </div>

                      {/* Telemetry GPS Coordinates Readout */}
                      <div style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6,
                        fontFamily: 'monospace', fontSize: '0.58rem',
                      }}>
                        <div style={{
                          padding: '5px 8px', borderRadius: 6,
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.05)',
                          color: '#94a3b8',
                        }}>
                          🛰️ LAT: <span style={{ color: '#e2e8f0', fontWeight: 700 }}>{liveLat}° N</span>
                        </div>
                        <div style={{
                          padding: '5px 8px', borderRadius: 6,
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.05)',
                          color: '#94a3b8',
                        }}>
                          🧭 LNG: <span style={{ color: '#e2e8f0', fontWeight: 700 }}>{liveLng}° E</span>
                        </div>
                      </div>

                      {/* Quick Route Advance Slider */}
                      <div style={{
                        padding: '6px 8px', borderRadius: 8,
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ fontSize: '0.58rem', color: '#64748b' }}>Simulate Waypoint Position</span>
                          <span style={{ fontSize: '0.58rem', color: '#38bdf8', fontWeight: 700, fontFamily: 'monospace' }}>
                            ETA: ~{etaMinutes} min
                          </span>
                        </div>
                        <input
                          type="range" min={0} max={1} step={0.01}
                          value={transitProgress}
                          onChange={e => setTransitProgress(parseFloat(e.target.value))}
                          style={sliderStyle('#38bdf8')}
                        />
                      </div>

                    </div>
                  )}

                </div>

                {/* ── FOOTER STATUS BAR ───────────────────────────── */}
                <div style={{
                  display:    'flex',
                  alignItems: 'center',
                  gap:        6,
                  padding:    '7px 12px',
                  background: 'rgba(255,255,255,0.02)',
                  borderTop:  '1px solid rgba(255,255,255,0.06)',
                  fontSize:   '0.6rem',
                  color:      '#475569',
                  fontFamily: 'monospace',
                }}>
                  <Led colour={wifiOn ? '#22d3a0' : '#475569'} pulse={autoRun && wifiOn} />
                  <span style={{ color: stateColour, fontWeight: 700 }}>{boxState}</span>
                  <span style={{ color: '#334155' }}>|</span>
                  <span>GPS: {liveLat}°N, {liveLng}°E</span>
                  <span style={{ marginLeft: 'auto' }}>
                    {lastPing ? `Ping: ${lastPing}` : 'No ping'}
                  </span>
                  <span>#{tickCount}</span>
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════ Sub-components ════════════════════════════ */

/** Labelled collapsible section */
function Section({ label, icon, colour, children }) {
  return (
    <div style={{
      borderRadius: 10,
      background:   'rgba(255,255,255,0.025)',
      border:       '1px solid rgba(255,255,255,0.06)',
      overflow:     'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '5px 10px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: `${colour}0a`,
      }}>
        <span style={{ color: colour }}>{icon}</span>
        <span style={{ fontSize: '0.62rem', fontWeight: 700, color: colour, letterSpacing: '.5px', textTransform: 'uppercase' }}>
          {label}
        </span>
      </div>
      <div style={{ padding: '8px 10px' }}>{children}</div>
    </div>
  );
}

/** Chip button for state / organ selection */
function StateChip({ label, active, colour, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize:     '0.6rem',
        fontWeight:   active ? 700 : 500,
        padding:      '3px 8px',
        borderRadius: 20,
        background:   active ? `${colour}22` : 'rgba(255,255,255,0.04)',
        border:       `1px solid ${active ? colour : 'rgba(255,255,255,0.1)'}`,
        color:        active ? colour : '#64748b',
        cursor:       'pointer',
        transition:   'all .15s',
        whiteSpace:   'nowrap',
      }}
    >
      {label}
    </button>
  );
}

/** Toggle button (on/off) */
function ToggleBtn({ label, active, activeColour, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize:     '0.62rem',
        fontWeight:   600,
        padding:      '5px 8px',
        borderRadius: 8,
        background:   active ? `${activeColour}18` : 'rgba(255,255,255,0.04)',
        border:       `1px solid ${active ? activeColour + '55' : 'rgba(255,255,255,0.1)'}`,
        color:        active ? activeColour : '#64748b',
        cursor:       'pointer',
        transition:   'all .15s',
        textAlign:    'center',
      }}
    >
      {label}
    </button>
  );
}

/** Primary action button */
function ActionBtn({ label, icon, colour, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display:      'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        padding:      '7px 4px',
        borderRadius: 8,
        background:   `${colour}18`,
        border:       `1px solid ${colour}44`,
        color:        colour,
        fontSize:     '0.65rem',
        fontWeight:   700,
        cursor:       disabled ? 'not-allowed' : 'pointer',
        opacity:      disabled ? 0.6 : 1,
        transition:   'all .15s',
      }}
    >
      {icon}{label}
    </button>
  );
}

/** Shared slider style factory */
function sliderStyle(accentColour) {
  return {
    width:        '100%',
    appearance:   'none',
    height:       6,
    borderRadius: 4,
    background:   `linear-gradient(90deg, ${accentColour} var(--v,50%), rgba(255,255,255,0.08) var(--v,50%))`,
    outline:      'none',
    cursor:       'pointer',
    display:      'block',
  };
}
