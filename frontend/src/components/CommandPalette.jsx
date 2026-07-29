import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, LayoutDashboard, GitFork, Map, ShieldCheck, 
  FileCheck, Building2, Scale, BarChart3, Cpu, Plus, CheckCircle, 
  Play, Square, HelpCircle, X
} from 'lucide-react';
import { useSimulatorContext } from '../context/SimulatorContext';

const COMMANDS = [
  { id: 'overview', name: 'Go to Command Center', icon: LayoutDashboard, category: 'Navigation', shortcut: 'G O', path: '/dashboard/overview' },
  { id: 'matching', name: 'Go to Matching Queue', icon: GitFork, category: 'Navigation', shortcut: 'G M', path: '/dashboard/matching' },
  { id: 'transport', name: 'Go to Live Transport', icon: Map, category: 'Navigation', shortcut: 'G T', path: '/dashboard/transport' },
  { id: 'donor', name: 'Go to Donor Consent Compliance', icon: FileCheck, category: 'Navigation', shortcut: 'G D', path: '/dashboard/donor-consent' },
  { id: 'hospital', name: 'Go to Hospital Compliance Registry', icon: Building2, category: 'Navigation', shortcut: 'G H', path: '/dashboard/hospital-registry' },
  { id: 'committee', name: 'Go to Committee Approval Control', icon: Scale, category: 'Navigation', shortcut: 'G C', path: '/dashboard/committee' },
  { id: 'analytics', name: 'Go to Analytics Insights', icon: BarChart3, category: 'Navigation', shortcut: 'G A', path: '/dashboard/analytics' },
  { id: 'data-entry', name: 'Go to System Data Input', icon: LayoutDashboard, category: 'Navigation', shortcut: 'G I', path: '/dashboard/data-entry' },
  { id: 'audit', name: 'Go to Blockchain Audit Ledger', icon: ShieldCheck, category: 'Navigation', shortcut: 'G L', path: '/dashboard/audit' },
  { id: 'report', name: 'Go to Daily Reports', icon: FileCheck, category: 'Navigation', shortcut: 'G R', path: '/dashboard/audit-report' },
  { id: 'simulator', name: 'Go to IoT Telemetry Simulator', icon: Cpu, category: 'Navigation', shortcut: 'G S', path: '/dashboard/simulator' },

  { id: 'add-donor', name: 'Register New Donor', icon: Plus, category: 'Actions', shortcut: 'A D', path: '/dashboard/donor-consent' },
  { id: 'register-hospital', name: 'Register New Hospital', icon: Plus, category: 'Actions', shortcut: 'A H', path: '/dashboard/hospital-registry' },
  { id: 'create-mission', name: 'Create Transport Mission', icon: Plus, category: 'Actions', shortcut: 'A M', path: '/dashboard/data-entry' },
  { id: 'approve-request', name: 'Approve Pending Match Clearances', icon: CheckCircle, category: 'Actions', shortcut: 'A C', path: '/dashboard/committee' },
  { id: 'gen-report', name: 'Generate Daily Audit Report', icon: FileCheck, category: 'Actions', shortcut: 'A R', path: '/dashboard/audit-report' },
  
  { id: 'sim-start', name: 'Start IoT Telemetry Simulator', icon: Play, category: 'Simulator Control', shortcut: 'S S', action: 'startSim' },
  { id: 'sim-stop', name: 'Stop IoT Telemetry Simulator', icon: Square, category: 'Simulator Control', shortcut: 'S X', action: 'stopSim' }
];

const CommandPalette = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const sim = useSimulatorContext();
  const listRef = useRef(null);

  // Filter commands based on query
  const filtered = COMMANDS.filter(cmd => 
    cmd.name.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle key navigation inside palette
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          executeCommand(filtered[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filtered]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[selectedIndex];
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const executeCommand = (cmd) => {
    if (cmd.path) {
      navigate(cmd.path);
    } else if (cmd.action === 'startSim') {
      if (sim && typeof sim.startSimulator === 'function') {
        sim.startSimulator();
      }
    } else if (cmd.action === 'stopSim') {
      if (sim && typeof sim.stopSimulator === 'function') {
        sim.stopSimulator();
      }
    }
    setQuery('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 100000,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: '15vh',
          background: 'rgba(5, 8, 16, 0.7)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)'
        }}>
          {/* Overlay background close */}
          <div 
            onClick={onClose}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{
              position: 'relative',
              zIndex: 2,
              width: '100%',
              maxWidth: '640px',
              background: 'rgba(13, 31, 26, 0.85)',
              border: '1px solid rgba(0, 180, 255, 0.25)',
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6), 0 0 32px rgba(0, 180, 255, 0.1)',
              borderRadius: '16px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            {/* Input Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <Search size={18} color="rgba(0, 180, 255, 0.7)" />
              <input
                type="text"
                autoFocus
                placeholder="Type a command or search sections..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit'
                }}
              />
              <button 
                onClick={onClose}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: 'none',
                  color: 'rgba(255,255,255,0.5)',
                  borderRadius: '4px',
                  padding: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* List area */}
            <div 
              ref={listRef}
              style={{
                maxHeight: '340px',
                overflowY: 'auto',
                padding: '8px'
              }}
            >
              {filtered.length === 0 ? (
                <div style={{
                  padding: '24px',
                  textAlign: 'center',
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: '0.8rem'
                }}>
                  No commands matching your query.
                </div>
              ) : (
                filtered.map((cmd, idx) => {
                  const isSelected = idx === selectedIndex;
                  const CmdIcon = cmd.icon;
                  return (
                    <div
                      key={cmd.id}
                      onClick={() => executeCommand(cmd)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: isSelected ? 'rgba(0, 180, 255, 0.15)' : 'transparent',
                        borderLeft: isSelected ? '3px solid #00B4FF' : '3px solid transparent',
                        cursor: 'pointer',
                        transition: 'background 0.1s, border-left 0.1s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ 
                          color: isSelected ? '#00B4FF' : 'rgba(255,255,255,0.5)',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <CmdIcon size={16} />
                        </span>
                        <div>
                          <div style={{ fontSize: '0.825rem', fontWeight: 600, color: '#ffffff' }}>{cmd.name}</div>
                          <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{cmd.category}</div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {cmd.shortcut && (
                          <div style={{
                            fontSize: '0.62rem',
                            fontFamily: 'var(--font-mono)',
                            color: isSelected ? '#00B4FF' : 'rgba(255,255,255,0.3)',
                            background: 'rgba(255,255,255,0.04)',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            border: '1px solid rgba(255,255,255,0.06)'
                          }}>
                            {cmd.shortcut}
                          </div>
                        )}
                        {isSelected && (
                          <span style={{ fontSize: '0.75rem', color: '#00B4FF' }}>↵</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer hints */}
            <div style={{
              padding: '12px 16px',
              background: 'rgba(0, 0, 0, 0.2)',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.65rem',
              color: 'rgba(255, 255, 255, 0.4)'
            }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <span><strong style={{ color: '#ffffff' }}>↑↓</strong> to navigate</span>
                <span><strong style={{ color: '#ffffff' }}>↵</strong> to select</span>
                <span><strong style={{ color: '#ffffff' }}>esc</strong> to close</span>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)' }}>
                NEOLIFE MISSION CORE
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
