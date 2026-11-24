import { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useSimulatorContext } from '../context/SimulatorContext';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Cpu, Play, Square, RotateCcw, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { ORGAN_PROFILES } from '../context/SimulatorContext';
 
const DashboardLayout = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const sim = useSimulatorContext();
  
  const [toasts, setToasts] = useState([]);
  const [simMinimized, setSimMinimized] = useState(true);

  useEffect(() => {
    if (!socket) return;

    const addToast = (message, type = 'warning') => {
      const id = Date.now() + Math.random();
      
      setToasts(prev => {
        // Check if an existing toast has identical or very similar message
        const existingIndex = prev.findIndex(t => t.message === message || t.baseMessage === message);
        if (existingIndex !== -1) {
          const updated = [...prev];
          const existing = updated[existingIndex];
          const count = (existing.count || 1) + 1;
          updated[existingIndex] = {
            ...existing,
            id,
            count,
            displayMessage: `${message} (${count}x)`
          };
          return updated.slice(-3); // Cap max 3 toasts
        }

        const newToast = { id, message, baseMessage: message, displayMessage: message, type, count: 1 };
        return [...prev, newToast].slice(-3); // Cap max 3 toasts
      });

      // Auto-remove after 3.5 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3500);
    };

    socket.on('transport:alert', (payload) => {
      addToast(`🚨 SLA Breach Alert: ${payload.alerts.join(', ')}`, 'critical');
    });

    socket.on('transport:health_change', (payload) => {
      if (payload.health && payload.health.status !== 'NORMAL') {
        addToast(`⚠️ Mission Health status changed to ${payload.health.status}! ${payload.health.reasons?.join(', ') || ''}`, 'warning');
      }
    });

    return () => {
      socket.off('transport:alert');
      socket.off('transport:health_change');
    };
  }, [socket]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <Outlet />
      </div>

      {/* Floating Smart Toast Notifications (Top Center - Zero UI Obstruction) */}
      <div style={{
        position: 'fixed',
        top: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        maxWidth: '460px',
        width: '90%',
        pointerEvents: 'none'
      }}>
        <AnimatePresence>
          {toasts.map(toast => {
            const isCritical = toast.type === 'critical';
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.15 } }}
                style={{
                  pointerEvents: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between',
                  gap: '12px',
                  background: isCritical ? 'rgba(15, 23, 42, 0.92)' : 'rgba(15, 23, 42, 0.88)',
                  backdropFilter: 'blur(16px)',
                  border: isCritical ? '1px solid rgba(239, 68, 68, 0.6)' : '1px solid rgba(245, 158, 11, 0.6)',
                  borderRadius: '14px',
                  padding: '10px 16px',
                  boxShadow: isCritical 
                    ? '0 10px 30px -5px rgba(239, 68, 68, 0.3)' 
                    : '0 10px 30px -5px rgba(0, 0, 0, 0.4)',
                  color: '#ffffff',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  fontWeight: 600,
                  width: '100%'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                  <AlertTriangle size={15} style={{ color: isCritical ? '#ef4444' : '#f59e0b', shrink: 0 }} />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {toast.displayMessage}
                  </span>
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Floating Global Simulator Panel */}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 99998,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        pointerEvents: 'none'
      }}>
        {simMinimized ? (
          <button 
            onClick={() => setSimMinimized(false)}
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: sim.running 
                ? 'rgba(6, 78, 59, 0.6)' 
                : 'rgba(136, 19, 55, 0.6)',
              border: sim.running 
                ? '1px solid rgba(16, 185, 129, 0.5)' 
                : '1px solid rgba(244, 63, 94, 0.5)',
              backdropFilter: 'blur(12px)',
              borderRadius: '24px',
              padding: '8px 14px',
              color: sim.running ? '#6ee7b7' : '#fda4af',
              boxShadow: sim.running ? '0 8px 24px rgba(16,185,129,0.25)' : '0 8px 24px rgba(239,68,68,0.25)',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.78rem',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className={`w-2 h-2 rounded-full ${sim.running ? 'bg-emerald-500' : 'bg-rose-500'} animate-ping absolute inset-0 opacity-75`} />
              <span className={`w-2 h-2 rounded-full ${sim.running ? 'bg-emerald-500' : 'bg-rose-500'} relative inline-flex`} />
            </div>
            <Cpu size={14} className={sim.running ? 'spin' : ''} style={{ animation: sim.running ? 'spin 4s linear infinite' : 'none' }} />
            <span>IoT Simulator: {sim.running ? 'ACTIVE' : 'OFFLINE'}</span>
            <ChevronUp size={14} />
          </button>
        ) : (
          <div style={{
            pointerEvents: 'auto',
            width: '320px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--glass-border)',
            borderRadius: '16px',
            padding: '16px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
            color: 'var(--text-primary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>
              <Cpu size={16} style={{ color: 'var(--brand-purple)' }} />
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>IoT Simulator Overlay</span>
              <button 
                onClick={() => setSimMinimized(true)}
                style={{ marginLeft: 'auto', color: 'var(--text-secondary)', cursor: 'pointer', background: 'none', border: 'none' }}
              >
                <ChevronDown size={16} />
              </button>
            </div>

            {/* Active Mission Indicator */}
            <div style={{
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '6px',
              padding: '6px 8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.7rem'
            }}>
              <span style={{ color: 'var(--text-secondary)' }}>Target Mission:</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#818cf8' }}>{sim.cfg.missionId}</span>
            </div>

            {/* Organ Mission Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Active Mission Type</div>
              <select 
                value={sim.cfg.organType}
                onChange={(e) => sim.setOrganProfile(e.target.value)}
                disabled={sim.running}
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  outline: 'none',
                  cursor: sim.running ? 'not-allowed' : 'pointer'
                }}
              >
                {Object.values(ORGAN_PROFILES).map(p => (
                  <option key={p.organType} value={p.organType}>
                    {p.organType} Transport ({p.min} - {p.max}°C)
                  </option>
                ))}
              </select>
            </div>
            
            {/* Standard Cold Storage Rules Info Box */}
            <div style={{
              background: 'rgba(56, 189, 248, 0.05)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: '6px',
              padding: '8px',
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-start'
            }}>
              <Info size={14} color="#38bdf8" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                <strong style={{ color: '#38bdf8', display: 'block', marginBottom: '2px' }}>Standard Cold Storage Rules</strong>
                {sim.cfg.notes}
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {!sim.running ? (
                <button 
                  onClick={sim.start}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    background: 'var(--brand-green)',
                    color: '#050508',
                    padding: '8px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  <Play size={12} fill="#050508" /> Start
                </button>
              ) : (
                <button 
                  onClick={sim.stop}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    background: 'var(--brand-red)',
                    color: '#ffffff',
                    padding: '8px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  <Square size={12} fill="#ffffff" /> Stop
                </button>
              )}
              <button 
                onClick={sim.reset}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-secondary)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={12} />
              </button>
            </div>

            {/* Telemetry Display */}
            {sim.telemetry && (
              <div style={{
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '8px',
                padding: '8px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)'
              }}>
                <span style={{ color: sim.telemetry.temperature > 8.0 ? 'var(--brand-red)' : 'var(--text-secondary)' }}>
                  Temp: {sim.telemetry.temperature}°C
                </span>
                <span style={{ color: sim.telemetry.batteryLevel < 20.0 ? 'var(--brand-red)' : 'var(--text-secondary)' }}>
                  Bat: {sim.telemetry.batteryLevel}%
                </span>
                <span style={{ color: sim.telemetry.isTampered ? 'var(--brand-red)' : 'var(--brand-green)' }}>
                  {sim.telemetry.isTampered ? 'TAMPERED' : 'SECURE'}
                </span>
              </div>
            )}

            {/* Sliders / Overrides */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  <span>Force Temp (°C)</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{sim.currentTemp}°C</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="20" 
                  step="0.5"
                  value={sim.currentTemp}
                  onChange={e => sim.overrideTemp(parseFloat(e.target.value))}
                  disabled={!sim.running}
                  style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--brand-blue)' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  <span>Force Battery (%)</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{sim.currentBattery}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  step="1"
                  value={sim.currentBattery}
                  onChange={e => sim.overrideBattery(parseFloat(e.target.value))}
                  disabled={!sim.running}
                  style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--brand-green)' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                <span>Force Tamper (Lid Open)</span>
                <input 
                  type="checkbox"
                  checked={sim.isTamperedMode}
                  onChange={e => sim.overrideTamper(e.target.checked)}
                  disabled={!sim.running}
                  style={{ cursor: 'pointer', width: '14px', height: '14px', accentColor: 'var(--brand-red)' }}
                />
              </div>
            </div>

            {/* Milestones Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px', borderTop: '1px solid var(--glass-border)', paddingTop: '10px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Trigger Milestones</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <button 
                  onClick={() => sim.triggerMilestone('transport.created')}
                  style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', padding: '6px', borderRadius: '6px', fontSize: '0.65rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  CREATED
                </button>
                <button 
                  onClick={() => sim.triggerMilestone('transport.dispatched')}
                  style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', padding: '6px', borderRadius: '6px', fontSize: '0.65rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  DISPATCHED
                </button>
                <button 
                  onClick={() => sim.triggerMilestone('transport.arrived')}
                  style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#f59e0b', padding: '6px', borderRadius: '6px', fontSize: '0.65rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  ARRIVED
                </button>
                <button 
                  onClick={() => sim.triggerMilestone('transport.completed')}
                  style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', color: '#8b5cf6', padding: '6px', borderRadius: '6px', fontSize: '0.65rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  COMPLETED
                </button>
              </div>
            </div>

            {/* Manual Release */}
            {sim.isManualMode && (
              <button 
                onClick={sim.releaseManual}
                style={{
                  background: 'rgba(251,191,36,0.1)',
                  border: '1px solid rgba(251,191,36,0.3)',
                  color: 'var(--brand-amber)',
                  borderRadius: '6px',
                  padding: '6px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'center',
                  borderStyle: 'solid'
                }}
              >
                Manual Mode Active: Release
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
 
export default DashboardLayout;
