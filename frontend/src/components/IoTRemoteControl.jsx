/**
 * IoTRemoteControl.jsx
 * ─────────────────────────────────────────────────────────────────────────
 * Floating, draggable, minimisable IoT Box Remote Control widget.
 * Acts as a full physical IoT-box replacement for demos / presentations.
 *
 * Features:
 *  • Draggable from any edge — stays within viewport
 *  • Collapsible to a slim pill (shows live temp + status at a glance)
 *  • Temperature slider with organ-safe zone visualisation
 *  • Battery level slider
 *  • Tamper / Reed-switch toggle with animated alert
 *  • Lock / Unlock relay control
 *  • RFID tap simulation buttons (3 cards)
 *  • One-click state machine transitions (IDLE → IN_TRANSIT → COMPLETED)
 *  • Live telemetry ticker — sends to backend every N seconds
 *  • Full dark + day-mode token support
 * ─────────────────────────────────────────────────────────────────────────
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Thermometer, Battery, Wifi, WifiOff, Lock, Unlock,
  AlertTriangle, CheckCircle2, Radio, Zap, ChevronDown,
  ChevronUp, GripVertical, Cpu, RefreshCcw, Play, Square,
  CreditCard, Shield, Package, Truck, Flag
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
  { slot: 1, uid: '3913DDB7', label: 'Card 1 – Pickup' },
  { slot: 2, uid: '19DB5AB7', label: 'Card 2 – Transit' },
  { slot: 3, uid: '29EE69B7', label: 'Card 3 – Delivery' },
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

/* ══════════════════════════════════════════════════════════════════════ */
export default function IoTRemoteControl() {
  /* ── Context (shared with SimulatorPage) ─ */
  const sim = useSimulatorContext();

  /* ── Widget UI state ─────────────────────────────────────────────── */
  const [minimised, setMinimised] = useState(false);
  const [pos,       setPos]       = useState({ x: 24, y: 80 }); // px from bottom-right
  const [organ,     setOrgan]     = useState('KIDNEY');

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
  const [rfidActive, setRfidActive] = useState(null);  // uid string | null
  const [autoRun,    setAutoRun]    = useState(false);
  const autoTimerRef = useRef(null);

  const profile = ORGAN_PROFILES[organ];

  /* ── Dragging ────────────────────────────────────────────────────── */
  const dragging  = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const widgetRef = useRef(null);

  const onMouseDown = useCallback((e) => {
    if (e.target.closest('button, input, select')) return;
    dragging.current  = true;
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y };
    document.body.style.userSelect = 'none';
  }, [pos]);

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return;
      const dx = e.clientX - dragStart.current.mx;
      const dy = e.clientY - dragStart.current.my;
      const W  = widgetRef.current?.offsetWidth  || 320;
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
  }, []);

  /* ── Temperature auto-drift (simulates real sensor noise) ─────────── */
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

  /* ── Battery drain (slow) ─────────────────────────────────────────── */
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
        coordinates: [
          parseFloat((81.6686 + tickCount * 0.0022).toFixed(6)),
          parseFloat((21.1348 + tickCount * 0.0015).toFixed(6)),
        ],
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
      // Also mirror into shared SimulatorContext so live map / audit trail updates
      sim?.overrideTemp?.(temp);
      sim?.overrideBattery?.(battery);
      if (tampered) sim?.overrideTamper?.(true);
    } catch (_) { /* offline OK */ }
    finally { setSending(false); }
  }, [wifiOn, temp, battery, tampered, locked, buzzer, boxState, organ, sim, tickCount]);

  /* ── Auto-run loop (sends telemetry every 5 s when running) ───────── */
  useEffect(() => {
    if (!autoRun) { clearInterval(autoTimerRef.current); return; }
    clearInterval(autoTimerRef.current);
    autoTimerRef.current = setInterval(() => sendTelemetry(), 5000);
    return () => clearInterval(autoTimerRef.current);
  }, [autoRun, sendTelemetry]);

  /* ── Tamper → auto trigger buzzer ─────────────────────────────────── */
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
    if (nextState === 'IN_TRANSIT') setLocked(true);
    if (nextState === 'COMPLETED')  setLocked(false);

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

  /* ════════════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════════════ */
  return (
    <>
      {/* Global keyframe injection */}
      <style>{`
        @keyframes iotPulse {
          0%, 100% { opacity: 1;  transform: scale(1);    }
          50%       { opacity: .6; transform: scale(1.35); }
        }
        @keyframes iotSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes iotSlideIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0);    }
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
          width:       minimised ? 220 : 310,
          cursor:      'grab',
          userSelect:  'none',
          fontFamily:  'var(--font-sans, Inter, sans-serif)',
          transition:  'width .25s ease',
        }}
      >
        {/* ── Widget Shell ─────────────────────────────────────────── */}
        <div style={{
          background:   'rgba(9,9,18,0.92)',
          backdropFilter: 'blur(20px) saturate(1.4)',
          border:       `1.5px solid ${tampered ? '#f87171' : 'rgba(34,211,160,0.28)'}`,
          borderRadius: 16,
          boxShadow:    tampered
            ? '0 0 32px rgba(248,113,113,0.35), 0 8px 40px rgba(0,0,0,0.85)'
            : '0 0 24px rgba(34,211,160,0.12), 0 8px 40px rgba(0,0,0,0.85)',
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
              ? 'linear-gradient(90deg,rgba(248,113,113,0.18),rgba(9,9,18,0))'
              : 'linear-gradient(90deg,rgba(34,211,160,0.12),rgba(9,9,18,0))',
            borderBottom:   '1px solid rgba(255,255,255,0.07)',
            cursor:         'grab',
          }}>
            <GripVertical size={13} style={{ color: '#475569', flexShrink: 0 }} />

            {/* Logo / icon */}
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background:  'linear-gradient(135deg,#22d3a0,#60a5fa)',
              display:     'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink:  0,
            }}>
              <Cpu size={15} color="#050508" />
            </div>

            {/* Title */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '.3px' }}>
                IoT Box Remote
              </div>
              {!minimised && (
                <div style={{ fontSize: '0.6rem', color: '#64748b', marginTop: 1 }}>
                  OrganShield ESP32 · v3.1.0
                </div>
              )}
            </div>

            {/* Live temp pill (always visible) */}
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

          {/* ── BODY (collapsed when minimised) ───────────────────── */}
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
                <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>

                  {/* ── TAMPER BANNER ──────────────────────────────── */}
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
                          background: 'rgba(248,113,113,0.12)',
                          border: '1px solid rgba(248,113,113,0.4)',
                          fontSize: '0.68rem', fontWeight: 700, color: '#f87171',
                        }}
                      >
                        <AlertTriangle size={12} style={{ flexShrink: 0 }} />
                        🚨 TAMPER DETECTED — Lid Open!
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ── STATE + ORGAN SELECTOR ─────────────────────── */}
                  <Section label="Box State" icon={<Package size={11} />} colour="#60a5fa">
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {BOX_STATES.map(s => (
                        <StateChip
                          key={s} label={s}
                          active={boxState === s}
                          colour={stateColour}
                          onClick={() => setBoxState(s)}
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

                  {/* ── TEMPERATURE SLIDER ─────────────────────────── */}
                  <Section label="Temperature" icon={<Thermometer size={11} />} colour={tCol}>
                    <div style={{ position: 'relative' }}>
                      {/* Safe-zone band */}
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
                    <div style={{ fontSize: '0.58rem', color: '#475569', marginTop: 2 }}>
                      Safe zone: {profile.min}–{profile.max}°C (green band)
                    </div>
                  </Section>

                  {/* ── BATTERY SLIDER ─────────────────────────────── */}
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

                  {/* ── TOGGLES ROW ────────────────────────────────── */}
                  <Section label="Hardware Controls" icon={<Shield size={11} />} colour="#fbbf24">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      {/* Tamper */}
                      <ToggleBtn
                        label="🔓 Reed / Tamper"
                        active={tampered}
                        activeColour="#f87171"
                        onClick={() => setTampered(t => !t)}
                      />
                      {/* Lock */}
                      <ToggleBtn
                        label={locked ? '🔒 Locked' : '🔓 Unlocked'}
                        active={locked}
                        activeColour="#22d3a0"
                        onClick={() => setLocked(l => !l)}
                      />
                      {/* Buzzer */}
                      <ToggleBtn
                        label={buzzer ? '🔊 Buzzer ON' : '🔇 Buzzer OFF'}
                        active={buzzer}
                        activeColour="#fbbf24"
                        onClick={() => setBuzzer(b => !b)}
                      />
                      {/* WiFi */}
                      <ToggleBtn
                        label={wifiOn ? '📡 WiFi ON' : '📵 WiFi OFF'}
                        active={wifiOn}
                        activeColour="#60a5fa"
                        onClick={() => setWifiOn(w => !w)}
                      />
                    </div>
                  </Section>

                  {/* ── RFID CARDS ─────────────────────────────────── */}
                  <Section label="RFID Card Tap" icon={<CreditCard size={11} />} colour="#a78bfa">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {RFID_CARDS.map(card => (
                        <button
                          key={card.uid}
                          onClick={() => tapCard(card)}
                          className={rfidActive === card.uid ? 'iot-rfid-flash' : ''}
                          style={{
                            display:        'flex',
                            alignItems:     'center',
                            gap:            8,
                            padding:        '6px 10px',
                            borderRadius:   8,
                            background:     rfidActive === card.uid
                              ? 'rgba(167,139,250,0.25)'
                              : 'rgba(167,139,250,0.08)',
                            border:         `1px solid ${rfidActive === card.uid
                              ? 'rgba(167,139,250,0.6)'
                              : 'rgba(167,139,250,0.2)'}`,
                            cursor:         'pointer',
                            transition:     'all .15s',
                            width:          '100%',
                            textAlign:      'left',
                          }}
                        >
                          <Radio size={12} style={{ color: '#a78bfa', flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#e2e8f0' }}>
                              {card.label}
                            </div>
                            <div style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: '#7c3aed', letterSpacing: '1px' }}>
                              UID: {card.uid}
                            </div>
                          </div>
                          <span style={{ fontSize: '0.58rem', color: '#a78bfa', background: 'rgba(167,139,250,0.15)', padding: '1px 6px', borderRadius: 10, border: '1px solid rgba(167,139,250,0.3)' }}>
                            TAP
                          </span>
                        </button>
                      ))}
                    </div>
                  </Section>

                  {/* ── ACTION BUTTONS ─────────────────────────────── */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                    {/* Auto-run toggle */}
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
                    {/* Manual ping */}
                    <ActionBtn
                      label={sending ? '...' : 'Ping'}
                      icon={sending
                        ? <RefreshCcw size={11} style={{ animation: 'iotSpin 1s linear infinite' }} />
                        : <Zap size={11} />}
                      colour="#60a5fa"
                      onClick={() => sendTelemetry({ milestone: 'MANUAL_PING' })}
                      disabled={sending}
                    />
                    {/* Reset */}
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
                        sim?.reset?.();
                      }}
                    />
                  </div>

                  {/* ── STATUS BAR ─────────────────────────────────── */}
                  <div style={{
                    display:    'flex',
                    alignItems: 'center',
                    gap:        6,
                    padding:    '6px 8px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.03)',
                    border:     '1px solid rgba(255,255,255,0.06)',
                    fontSize:   '0.6rem',
                    color:      '#475569',
                    fontFamily: 'monospace',
                  }}>
                    <Led colour={wifiOn ? '#22d3a0' : '#475569'} pulse={autoRun && wifiOn} />
                    <span style={{ color: stateColour, fontWeight: 700 }}>{boxState}</span>
                    <span style={{ marginLeft: 'auto' }}>
                      {lastPing ? `Last ping: ${lastPing}` : 'No ping yet'}
                    </span>
                    <span>#{tickCount}</span>
                  </div>

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
        fontSize:   '0.6rem',
        fontWeight: active ? 700 : 500,
        padding:    '3px 8px',
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
    width:      '100%',
    appearance: 'none',
    height:     6,
    borderRadius: 4,
    background: `linear-gradient(90deg, ${accentColour} var(--v,50%), rgba(255,255,255,0.08) var(--v,50%))`,
    outline:    'none',
    cursor:     'pointer',
    display:    'block',
  };
}
