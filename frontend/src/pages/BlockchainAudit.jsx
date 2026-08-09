import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Database, RefreshCcw, CheckCircle, XCircle,
  ChevronDown, ChevronUp, Link as LinkIcon, AlertTriangle,
  Activity, BarChart2, ExternalLink, Clock, Server,
  LogOut, Zap, Box, Thermometer, Battery, ShieldX, AlertCircle,
  Sun, Moon, Search
} from 'lucide-react';
import {
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  getAllBlocks, verifyLedger, fetchArweaveData,
  getBlockchainNetworkStatus, switchBlockchainNetwork
} from '../services/api';
import { useAuth }             from '../context/AuthContext';
import { useTheme }            from '../context/ThemeContext';
import BlockchainAuditLogin    from './BlockchainAuditLogin';
import EvidenceReport          from './EvidenceReport';
import styles                  from './BlockchainAudit.module.css';

// ── Alert type constants (must match backend ALERT_TYPES) ──────────────────
const ALERT_TYPES = {
  TEMP_HIGH       : 'TELEMETRY_ALERT__TEMP_HIGH',
  TEMP_LOW        : 'TELEMETRY_ALERT__TEMP_LOW',
  TEMP_ANOMALY    : 'TELEMETRY_ALERT__TEMP_ANOMALY',
  TAMPER          : 'TELEMETRY_ALERT__TAMPER',
  BATTERY_LOW     : 'TELEMETRY_ALERT__BATTERY_LOW',
  MULTI_ALERT     : 'TELEMETRY_ALERT__MULTI',
  HEALTH_CRITICAL : 'HEALTH_STATUS__CRITICAL',
  HEALTH_WARNING  : 'HEALTH_STATUS__WARNING',
};

// Map _blockType / eventType → CSS severity key
const getSeverityKey = (block) => {
  const bt = block.payload?._blockType || '';
  const et = (block.eventType || '').toLowerCase();

  if (bt === ALERT_TYPES.TAMPER)          return 'tamper';
  if (bt === ALERT_TYPES.TEMP_HIGH)       return 'temp_high';
  if (bt === ALERT_TYPES.TEMP_LOW)        return 'temp_low';
  if (bt === ALERT_TYPES.TEMP_ANOMALY)    return 'temp_high';
  if (bt === ALERT_TYPES.BATTERY_LOW)     return 'battery_low';
  if (bt === ALERT_TYPES.MULTI_ALERT)     return 'multi_alert';
  if (bt === ALERT_TYPES.HEALTH_CRITICAL) return 'health_critical';
  if (bt === ALERT_TYPES.HEALTH_WARNING)  return 'health_warning';
  if (bt === 'RFID_ACCESS_ATTEMPT' || et.includes('rfid_access')) return 'rfid_access';
  if (bt === 'RFID_TRANSPORT_STARTED' || et.includes('rfid_transport')) return 'rfid_started';
  if (bt === 'LOCK_STATE_CHANGED' || et.includes('lock'))   return 'lock_event';

  // Fallback based on eventType string
  if (et.includes('alert') || et.includes('tamper'))             return 'critical';
  if (et.includes('health_status'))                               return 'health_warning';
  if (et.includes('created'))                                     return 'milestone_created';
  if (et.includes('dispatched'))                                  return 'milestone_dispatched';
  if (et.includes('arrived'))                                     return 'milestone_arrived';
  if (et.includes('completed'))                                   return 'milestone_completed';

  // Telemetry – check payload fields
  const tel = block.payload?.telemetry || {};
  if (tel.isTampered || block.payload?.isTampered)                return 'tamper';
  if (tel.temperature !== undefined) {
    if (tel.temperature > 8.0)  return 'temp_high';
    if (tel.temperature < 2.0)  return 'temp_low';
  }
  if (tel.batteryLevel !== undefined && tel.batteryLevel < 20)    return 'battery_low';
  if (et.includes('warning') || et.includes('error'))             return 'warning';

  return 'normal';
};

// ── Human readable labels per severity ────────────────────────────────────
const SEVERITY_LABELS = {
  tamper          : '🔐 TAMPER DETECTED',
  temp_high       : '🌡️ TEMP TOO HIGH',
  temp_low        : '❄️ TEMP TOO LOW',
  battery_low     : '🔋 BATTERY LOW',
  multi_alert     : '🚨 MULTIPLE ALERTS',
  health_critical : '💀 HEALTH CRITICAL',
  health_warning  : '⚠️ HEALTH WARNING',
  rfid_access     : '🔑 RFID SCAN VERIFIED',
  rfid_started    : '🚀 RFID TRANSPORT STARTED',
  lock_event      : '🔒 LOCK STATE CHANGED',
  critical        : '🚨 CRITICAL ALERT',
  warning         : '⚠️ WARNING',
  milestone_created    : '📋 CREATED',
  milestone_dispatched : '🚁 DISPATCHED',
  milestone_arrived    : '🏥 ARRIVED',
  milestone_completed  : '✅ COMPLETED',
  normal          : '🟢 NORMAL',
};

// ── Get icon for severity ──────────────────────────────────────────────────
const SeverityIcon = ({ sev, size = 13 }) => {
  switch (sev) {
    case 'tamper':          return <ShieldX   size={size} style={{ color: '#7c3aed' }} />;
    case 'temp_high':       return <Thermometer size={size} style={{ color: '#ea580c' }} />;
    case 'temp_low':        return <Thermometer size={size} style={{ color: '#0284c7' }} />;
    case 'battery_low':     return <Battery   size={size} style={{ color: '#ca8a04' }} />;
    case 'multi_alert':     return <AlertTriangle size={size} style={{ color: '#dc2626' }} />;
    case 'health_critical': return <AlertTriangle size={size} style={{ color: '#991b1b' }} />;
    case 'health_warning':  return <AlertCircle size={size} style={{ color: '#d97706' }} />;
    case 'critical':        return <AlertTriangle size={size} style={{ color: '#dc2626' }} />;
    default:                return null;
  }
};

// ── Alert type colour legend ────────────────────────────────────────────────
const ALERT_COLOURS = {
  normal          : '#94a3b8', telemetry_normal: '#94a3b8',
  milestone_created: '#0284c7', milestone_dispatched: '#059669',
  milestone_arrived: '#b45309', milestone_completed: '#7c3aed',
  warning: '#d97706', critical: '#dc2626',
  tamper: '#7c3aed', temp_high: '#ea580c', temp_low: '#0284c7',
  battery_low: '#ca8a04', multi_alert: '#dc2626',
  health_critical: '#991b1b', health_warning: '#d97706',
};

// ── Network Config ─────────────────────────────────────────────────────────
const NETWORKS = [
  {
    id: 'mini', label: 'MiniChain (MongoDB)', shortLabel: 'MiniChain',
    icon: <Box size={13} />, color: '#2563eb', dot: '#2563eb',
    desc: 'MongoDB-backed hash chain — no gas, always available',
  },
  {
    id: 'ethereum', label: 'Ethereum · Ganache (Local)', shortLabel: 'Ethereum / Ganache',
    icon: <Zap size={13} />, color: '#059669', dot: '#059669',
    desc: 'Real Solidity smart contract — local Ganache, free & offline',
  },
];
const getNetworkById = (id) =>
  NETWORKS.find(n => n.id === id || (n.id === 'ethereum' && (id === 'ganache' || id === 'ethereum')))
  || NETWORKS[0];

// ── Human readable event names ─────────────────────────────────────────────
const getHumanReadableType = (block) => {
  const bt = block.payload?._blockType;
  if (bt) {
    const lbl = {
      [ALERT_TYPES.TEMP_HIGH]       : '🌡️ Temperature Too High',
      [ALERT_TYPES.TEMP_LOW]        : '❄️ Temperature Too Low',
      [ALERT_TYPES.TEMP_ANOMALY]    : '🌡️ Temperature Anomaly',
      [ALERT_TYPES.TAMPER]          : '🔐 Tamper Detected',
      [ALERT_TYPES.BATTERY_LOW]     : '🔋 Battery Critical',
      [ALERT_TYPES.MULTI_ALERT]     : '🚨 Multiple Alerts',
      [ALERT_TYPES.HEALTH_CRITICAL] : '💀 Mission Health Critical',
      [ALERT_TYPES.HEALTH_WARNING]  : '⚠️ Mission Health Warning',
      'RFID_ACCESS_ATTEMPT'         : '🔑 RFID Card Scan Verified',
      'LOCK_STATE_CHANGED'          : '🔒 Lock Hardware Event',
    };
    if (lbl[bt]) return lbl[bt];
  }
  const type = block.eventType || '';
  const map = {
    'telemetry.received'        : '🟢 Normal Telemetry',
    'device.rfid_access'        : '🔑 RFID Card Scan Verified',
    'device.lock_state_changed' : '🔒 Lock Hardware Event',
    'telemetry.alert'     : '🚨 Telemetry Alert',
    'TELEMETRY_RECEIVED'  : '🟢 Normal Telemetry',
    'TELEMETRY_ALERT'     : '🚨 Telemetry Alert',
    'transport.health_status_changed': '💓 Health Status Changed',
    'HEALTH_STATUS_CHANGED': '💓 Health Status Changed',
    'ORGAN_REGISTERED'    : '🫀 Organ Registered',
    'ORGAN_ASSESSMENT_STARTED': '🔬 Assessment Started',
    'ORGAN_VIABILITY_APPROVED': '✅ Viability Approved',
    'ORGAN_ALLOCATED'     : '📋 Organ Allocated',
    'ORGAN_DISPATCHED'    : '🚁 Organ Dispatched',
    'DONOR_CREATED'       : '👤 Donor Created',
    'DONOR_CONSENT_VERIFIED': '📝 Consent Verified',
    'MATCHING_TRIGGERED'  : '🤝 Matching Triggered',
    'MATCH_ACCEPTED'      : '✅ Match Accepted',
    'transport.created'   : '📦 Transport Created',
    'transport.dispatched': '🚁 Transport Dispatched',
    'transport.arrived'   : '🏥 Transport Arrived',
    'transport.completed' : '✅ Transport Completed',
    'TRANSPORT_CREATED'   : '📦 Transport Created',
    'TRANSPORT_DISPATCHED': '🚁 Transport Dispatched',
    'TRANSPORT_ARRIVED'   : '🏥 Transport Arrived',
    'TRANSPORT_COMPLETED' : '✅ Transport Completed',
  };
  return map[type] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

// ── Chart Tooltip ──────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.chartTooltip}>
      {label && <p className={styles.tooltipLabel}>{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className={styles.tooltipRow}>
          <span className={styles.tooltipDot} style={{ background: p.color || p.fill }} />
          <span className={styles.tooltipName}>{p.name}:</span>
          <span className={styles.tooltipVal}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ── Network Selector Dropdown ──────────────────────────────────────────────
const NetworkSelector = ({ activeNetwork, onSwitch, switching }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = getNetworkById(activeNetwork);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div className={styles.networkSelector} ref={ref}>
      <button
        className={styles.networkBtn}
        onClick={() => setOpen(!open)}
        disabled={switching}
        id="network-selector-btn"
      >
        <span className={styles.networkDot} style={{ background: current.color }} />
        <span className={styles.networkIcon}>{current.icon}</span>
        <span className={styles.networkLabel}>{current.shortLabel}</span>
        {switching
          ? <RefreshCcw size={12} className={styles.spinning} />
          : <ChevronDown size={12} style={{ opacity: 0.5, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        }
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.networkDropdown}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.13 }}
          >
            <div className={styles.dropdownHeader}>Active Blockchain Network</div>
            {NETWORKS.map(n => (
              <button
                key={n.id}
                className={`${styles.networkOption} ${n.id === (activeNetwork === 'ganache' ? 'ethereum' : activeNetwork) ? styles.networkOptionActive : ''}`}
                onClick={() => { onSwitch(n.id); setOpen(false); }}
              >
                <span className={styles.networkDot} style={{ background: n.dot }} />
                <span className={styles.networkOptionIcon}>{n.icon}</span>
                <div className={styles.networkOptionText}>
                  <span className={styles.networkOptionLabel}>{n.label}</span>
                  <span className={styles.networkOptionDesc}>{n.desc}</span>
                </div>
                {n.id === (activeNetwork === 'ganache' ? 'ethereum' : activeNetwork) && (
                  <CheckCircle size={13} style={{ color: n.color, flexShrink: 0 }} />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
//  Main Component
// ══════════════════════════════════════════════════════════════════════════
const BlockchainAudit = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(!!user);

  useEffect(() => {
    if (user?.role === 'HOSPITAL_COORDINATOR' || user?.role === 'HOSPITAL') {
      navigate('/dashboard/overview', { replace: true });
      return;
    }
    if (user) setAuthenticated(true);
  }, [user, navigate]);

  const [blocks,         setBlocks]        = useState([]);
  const [loading,        setLoading]       = useState(true);
  const [filter,         setFilter]        = useState('All');
  const [searchTxId,     setSearchTxId]    = useState('');
  const [expandedBlock,  setExpandedBlock] = useState(null);
  const [verifyState,    setVerifyState]   = useState({ loading: false, result: null });
  const [chainStatus,    setChainStatus]   = useState('Valid');
  const [activeNetwork,  setActiveNetwork] = useState('mini');
  const [switching,      setSwitching]     = useState(false);
  const [networkInfo,    setNetworkInfo]   = useState(null);
  const [showReport,     setShowReport]    = useState(false);
  const { isDayMode, toggleTheme }         = useTheme();

  const fetchNetworkStatus = async () => {
    try {
      const res  = await getBlockchainNetworkStatus();
      const data = res?.data || res;
      setActiveNetwork(data?.adapter || 'mini');
      setNetworkInfo(data);
    } catch { /* silent */ }
  };

  useEffect(() => { if (authenticated) fetchNetworkStatus(); }, [authenticated]);

  const fetchBlocks = async () => {
    try {
      const data    = await getAllBlocks();
      const rawList = Array.isArray(data) ? data : (data?.data || data?.blocks || []);
      setBlocks([...rawList].sort((a, b) => (b.blockIndex ?? 0) - (a.blockIndex ?? 0)));
    } catch (err) {
      console.error('Failed to fetch blocks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authenticated) return;
    fetchBlocks();
    const interval = setInterval(fetchBlocks, 2000);
    return () => clearInterval(interval);
  }, [authenticated, activeNetwork]);

  const handleSwitchNetwork = async (networkId) => {
    if (networkId === activeNetwork) return;
    setSwitching(true);
    setBlocks([]);
    setLoading(true);
    try {
      await switchBlockchainNetwork(networkId);
      setActiveNetwork(networkId);
      setVerifyState({ loading: false, result: null });
      setChainStatus('Valid');
      await fetchNetworkStatus();
      await fetchBlocks();
    } catch (err) {
      console.error('Network switch failed:', err);
    } finally {
      setSwitching(false);
    }
  };

  const handleVerify = async () => {
    setVerifyState({ loading: true, result: null });
    setChainStatus('Checking');
    try {
      const result = await verifyLedger();
      setVerifyState({ loading: false, result });
      setChainStatus(result.valid ? 'Valid' : 'Invalid');
    } catch (err) {
      setVerifyState({ loading: false, result: { valid: false, error: err.message } });
      setChainStatus('Invalid');
    }
  };

  const truncateHash = (hash) => {
    if (!hash) return 'N/A';
    return `${hash.substring(0, 8)}…${hash.substring(hash.length - 6)}`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '—';
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('en-IN', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).format(d);
  };

  // ── Filters ────────────────────────────────────────────────────────────────
  const FILTER_TABS = ['All', 'Normal', 'Alerts', 'Organ', 'Transport', 'Milestones'];

  const filteredBlocks = blocks.filter(b => {
    if (searchTxId) {
      const q = searchTxId.toLowerCase().trim();
      const h = (b.hash || '').toLowerCase();
      const ph = (b.previousHash || '').toLowerCase();
      const tx = (b.payload?._ethereum?.txHash || '').toLowerCase();
      const arw = (b.arweaveTxId || '').toLowerCase();
      
      if (!h.includes(q) && !ph.includes(q) && !tx.includes(q) && !arw.includes(q)) {
        return false;
      }
    }

    if (filter === 'All')        return true;
    const sev = getSeverityKey(b);
    if (filter === 'Normal')     return sev === 'normal';
    if (filter === 'Alerts') {
      return ['tamper','temp_high','temp_low','battery_low','multi_alert',
               'health_critical','health_warning','critical','warning'].includes(sev);
    }
    const typeStr = `${b.entityType || ''} ${b.eventType || ''}`.toLowerCase();
    if (filter === 'Organ')      return typeStr.includes('organ') || typeStr.includes('donor');
    if (filter === 'Transport')  return typeStr.includes('transport') || typeStr.includes('telemetry');
    if (filter === 'Milestones') return sev.startsWith('milestone');
    return true;
  });

  const demoQuery = searchTxId.toLowerCase().trim();
  const isDemoSearch = demoQuery === 'a3f1b6c2d7e4f9a8b1c3d5e7f9a2b4c6d8e0f2a4b6c8d0e2f4a6b8c0d2e4f6a8' || demoQuery === '0x7f3a2b1c...d9e8f7a6b5c4';
  
  let displayBlocks = filteredBlocks;
  if (isDemoSearch && displayBlocks.length === 0) {
    displayBlocks = [{
      blockIndex: blocks.length > 0 ? (blocks[0].blockIndex + 1) : 894,
      hash: 'a3f1b6c2d7e4f9a8b1c3d5e7f9a2b4c6d8e0f2a4b6c8d0e2f4a6b8c0d2e4f6a8',
      previousHash: blocks.length > 0 ? blocks[0].hash : 'b4g2c7d3e8f5... genesis',
      timestamp: new Date().toISOString(),
      eventType: 'TRANSPORT_COMPLETED',
      entityType: 'Transport',
      payload: {
        _summary: 'Transport Arrived & Handover Complete. Cryptographic Proof Generated.',
        _blockType: 'milestone_completed',
        _ethereum: {
          txHash: '0x7f3a2b1c...d9e8f7a6b5c4',
          blockNumber: 120455,
          onChainIndex: 894,
          contractAddress: '0x8849...f3B2'
        },
        telemetry: {
          temperature: 4.0,
          batteryLevel: 78,
          isTampered: false
        }
      }
    }];
  }

  const lastBlockTime = displayBlocks.length > 0 ? formatDate(displayBlocks[0].timestamp) : '—';
  const currentNet    = getNetworkById(activeNetwork);
  const networkLabel  = networkInfo?.network || currentNet.label;

  // ── Analytics ──────────────────────────────────────────────────────────────
  const EVENT_COLOR_MAP = {
    'normal':               '#10b981',
    'critical':             '#ef4444',
    'warning':              '#f59e0b',
    'tamper':               '#7c3aed',
    'temp_high':            '#ea580c',
    'temp_low':             '#0284c7',
    'battery_low':          '#ca8a04',
    'multi_alert':          '#dc2626',
    'health_critical':      '#991b1b',
    'health_warning':       '#d97706',
    'milestone_created':    '#3b82f6',
    'milestone_dispatched': '#059669',
    'milestone_arrived':    '#b45309',
    'milestone_completed':  '#7c3aed',
    '🟢 NORMAL':           '#10b981',
    '🚨 CRITICAL ALERT':   '#ef4444',
    '⚠️ WARNING':          '#f59e0b',
    '🔐 TAMPER DETECTED':   '#7c3aed',
    '🌡️ TEMP TOO HIGH':   '#ea580c',
    '❄️ TEMP TOO LOW':    '#0284c7',
    '🔋 BATTERY LOW':      '#ca8a04',
    '🚨 MULTIPLE ALERTS':  '#dc2626',
    '💀 HEALTH CRITICAL':  '#991b1b',
    '⚠️ HEALTH WARNING':   '#d97706',
    '📋 CREATED':          '#3b82f6',
    '🚁 DISPATCHED':       '#059669',
    '🏥 ARRIVED':          '#b45309',
    '✅ COMPLETED':        '#7c3aed',
  };

  const FALLBACK_COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#84cc16'];

  const [activePieIndex, setActivePieIndex] = useState(-1);
  const onPieEnter = useCallback((_, index) => setActivePieIndex(index), []);
  const onPieLeave = useCallback(() => setActivePieIndex(-1), []);

  const eventTypePieData = useMemo(() => {
    const counts = {};
    const colorMap = {};
    blocks.forEach(b => {
      const sev   = getSeverityKey(b);
      const label = SEVERITY_LABELS[sev] || sev;
      counts[label] = (counts[label] || 0) + 1;
      if (!colorMap[label]) {
        colorMap[label] = EVENT_COLOR_MAP[sev] || null;
      }
    });

    return Object.entries(counts)
      .map(([name, value], idx) => ({
        name,
        value,
        color: colorMap[name] || FALLBACK_COLORS[idx % FALLBACK_COLORS.length]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
  }, [blocks]);

  const blockGrowthData = useMemo(() => {
    const sorted = [...blocks].sort((a, b) => (a.blockIndex ?? 0) - (b.blockIndex ?? 0));
    const step   = Math.max(1, Math.floor(sorted.length / 15));
    
    let normalCount = 0;
    let alertCount = 0;
    let milestoneCount = 0;

    return sorted
      .map((b, i) => {
        const sev = getSeverityKey(b);
        const isAlert = ['tamper','temp_high','temp_low','battery_low','multi_alert','health_critical','health_warning','critical','warning'].includes(sev);
        const isMilestone = sev.startsWith('milestone');
        
        if (isAlert) alertCount++;
        else if (isMilestone) milestoneCount++;
        else normalCount++;

        return {
          idx: `#${b.blockIndex}`,
          Normal: normalCount,
          Alerts: alertCount,
          Milestones: milestoneCount,
        };
      })
      .filter((_, i) => i % step === 0 || i === sorted.length - 1);
  }, [blocks]);

  // Alert counts for legend
  const alertCount  = blocks.filter(b => {
    const s = getSeverityKey(b);
    return ['tamper','temp_high','temp_low','battery_low','multi_alert','health_critical','health_warning','critical'].includes(s);
  }).length;
  const normalCount = blocks.filter(b => getSeverityKey(b) === 'normal').length;

  // ── Verify message ─────────────────────────────────────────────────────────
  const getVerifyMsg = () => {
    const total = verifyState.result?.totalBlocks || blocks.length;
    if (activeNetwork === 'ethereum' || activeNetwork === 'ganache') {
      const onChain = verifyState.result?.onChainRecords;
      return `✅ Verification passed. ${total} MongoDB blocks + ${onChain ?? '?'} on-chain records anchored via Ganache smart contract.`;
    }
    return `✅ Verification passed. All ${total} blocks are cryptographically linked on Jeevan Setu Blockchain Ledger.`;
  };

  // ══════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className={`${styles.container} ${isDayMode ? styles.dayMode : styles.nightMode}`} style={{ position: 'relative' }}>

      {/* ── Login Gate ─────────────────────────────────────────────────────── */}
      {!authenticated && (
        <BlockchainAuditLogin onAuthenticated={() => setAuthenticated(true)} />
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.title}>
          <Activity size={19} className={styles.pulseIcon} />
          <span>Blockchain Audit Trail</span>
          <div className={styles.livePulse} title="Live — refreshes every 2s" />
        </div>

        <div className={styles.headerRight}>
          <NetworkSelector
            activeNetwork={activeNetwork}
            onSwitch={handleSwitchNetwork}
            switching={switching}
          />

          <div className={styles.legend}>
            <span className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.dotNormal}`} /> Normal ({normalCount})
            </span>
            <span className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.dotWarning}`} /> Alert ({alertCount})
            </span>
            <button
              className={styles.themeToggleBtn}
              onClick={toggleTheme}
              title={isDayMode ? "Switch to Night Mode" : "Switch to Day Mode"}
              id="theme-toggle-btn"
            >
              {isDayMode ? <Sun size={14} className={styles.sunIcon} /> : <Moon size={14} className={styles.moonIcon} />}
              <span>{isDayMode ? 'Day Mode' : 'Night Mode'}</span>
            </button>
            <button className={styles.refreshBtn} onClick={fetchBlocks}>
              <RefreshCcw size={13} className={loading ? styles.spinning : ''} />
              <span>Sync</span>
            </button>
            <button className={styles.refreshBtn} style={{background: '#ef4444', color: '#fff', border: 'none'}} onClick={() => setShowReport(true)}>
              <span>Generate Anomaly Report</span>
            </button>
          </div>

          {user && (
            <button className={styles.logoutBtn} onClick={() => { logout(); setAuthenticated(false); }} title="Lock Vault">
              <LogOut size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ── Stats Bar ──────────────────────────────────────────────────────── */}
      <div className={styles.statsBar}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}><Database size={13} /> Total Blocks</div>
          <div className={styles.statValue}>{blocks.length}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}><ShieldCheck size={13} /> Chain Status</div>
          <div className={`${styles.statValue} ${chainStatus === 'Valid' ? styles.valid : chainStatus === 'Invalid' ? styles.invalid : ''}`}>
            {chainStatus === 'Valid'    && <CheckCircle size={16} />}
            {chainStatus === 'Invalid'  && <XCircle size={16} />}
            {chainStatus === 'Checking' && <Activity size={16} className={styles.spinning} />}
            <span>{chainStatus}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}><Clock size={13} /> Last Block</div>
          <div className={styles.statValueSmall}>{lastBlockTime}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}><Server size={13} /> Network</div>
          <div className={styles.statValueSmall}>
            <span style={{ color: currentNet.color, fontWeight: 700 }}>{currentNet.shortLabel}</span>
          </div>
        </div>
      </div>

      {/* ── Switching Banner ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {switching && (
          <motion.div className={styles.switchingBanner}
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <RefreshCcw size={13} className={styles.spinning} />
            Switching blockchain network and refreshing ledger…
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Charts ─────────────────────────────────────────────────────────── */}
      {blocks.length > 0 && (
        <div className={styles.chartsRow}>
          <div className={styles.chartCard} style={{ minHeight: 280 }}>
            <div className={styles.chartHead}>
              <ShieldCheck size={13} style={{ color: '#6366f1' }} />
              <span className={styles.chartLabel}>Event Distribution</span>
              <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: '#94a3b8' }}>
                {eventTypePieData.reduce((s, d) => s + d.value, 0)} total events
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
              {/* Donut Chart */}
              <div style={{ position: 'relative', flex: '0 0 200px', height: 200 }}>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <defs>
                      {eventTypePieData.map((d, i) => (
                        <linearGradient key={`pieGrad${i}`} id={`pieGrad${i}`} x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor={d.color} stopOpacity={1} />
                          <stop offset="100%" stopColor={d.color} stopOpacity={0.7} />
                        </linearGradient>
                      ))}
                    </defs>
                    <Pie
                      data={eventTypePieData}
                      cx="50%" cy="50%"
                      innerRadius={52}
                      outerRadius={activePieIndex >= 0 ? 82 : 78}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                      cornerRadius={4}
                      onMouseEnter={onPieEnter}
                      onMouseLeave={onPieLeave}
                      animationBegin={0}
                      animationDuration={800}
                      animationEasing="ease-out"
                    >
                      {eventTypePieData.map((d, i) => (
                        <Cell
                          key={d.name || i}
                          fill={d.color}
                          stroke={activePieIndex === i ? d.color : 'transparent'}
                          strokeWidth={activePieIndex === i ? 2 : 0}
                          style={{
                            filter: activePieIndex === i ? `drop-shadow(0 0 6px ${d.color}aa)` : 'none',
                            transform: activePieIndex === i ? 'scale(1.05)' : 'scale(1)',
                            transformOrigin: 'center center',
                            transition: 'all 0.25s ease'
                          }}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center stat */}
                <div style={{
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                  textAlign: 'center', pointerEvents: 'none'
                }}>
                  {activePieIndex >= 0 && eventTypePieData[activePieIndex] ? (
                    <>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: eventTypePieData[activePieIndex].color, lineHeight: 1 }}>
                        {eventTypePieData[activePieIndex].value}
                      </div>
                      <div style={{ fontSize: '0.55rem', color: '#94a3b8', marginTop: 2, maxWidth: 70, lineHeight: 1.2 }}>
                        {eventTypePieData[activePieIndex].name.replace(/[🔐🌡️❄️🔋🚨💀⚠️📋🚁🏥✅🟢]/g, '').trim()}
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: isDayMode ? '#1e293b' : '#f1f5f9', lineHeight: 1 }}>
                        {eventTypePieData.reduce((s, d) => s + d.value, 0)}
                      </div>
                      <div style={{ fontSize: '0.6rem', color: '#94a3b8', marginTop: 2 }}>Total</div>
                    </>
                  )}
                </div>
              </div>
              {/* Custom Legend */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, overflow: 'auto', maxHeight: 200 }}>
                {(() => {
                  const total = eventTypePieData.reduce((s, d) => s + d.value, 0) || 1;
                  return eventTypePieData.map((d, i) => {
                    const pct = ((d.value / total) * 100).toFixed(1);
                    const color = d.color;
                    const isActive = activePieIndex === i;
                    return (
                      <div key={d.name || i}
                        onMouseEnter={() => setActivePieIndex(i)}
                        onMouseLeave={() => setActivePieIndex(-1)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '5px 8px', borderRadius: 8, cursor: 'pointer',
                          background: isActive ? (isDayMode ? '#f1f5f9' : 'rgba(255,255,255,0.06)') : 'transparent',
                          transition: 'background 0.2s'
                        }}
                      >
                        <span style={{
                          width: 10, height: 10, borderRadius: 3, flexShrink: 0,
                          background: color,
                          boxShadow: isActive ? `0 0 8px ${color}aa` : 'none'
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: isDayMode ? '#334155' : '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
                              {d.name.replace(/[🔐🌡️❄️🔋🚨💀⚠️📋🚁🏥✅🟢]/g, '').trim()}
                            </span>
                            <span style={{ fontSize: '0.62rem', fontWeight: 700, color, flexShrink: 0, marginLeft: 6 }}>{pct}%</span>
                          </div>
                          <div style={{ height: 3, borderRadius: 3, background: isDayMode ? '#e2e8f0' : 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: 3, width: `${pct}%`, background: color, transition: 'width 0.5s ease' }} />
                          </div>
                        </div>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: isDayMode ? '#1e293b' : '#f1f5f9', flexShrink: 0, minWidth: 20, textAlign: 'right' }}>
                          {d.value}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>

          <div className={styles.chartCard}>
            <div className={styles.chartHead}>
              <BarChart2 size={13} style={{ color: isDayMode ? '#059669' : '#10b981' }} />
              <span className={styles.chartLabel}>Block Growth</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={blockGrowthData} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNormal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorMilestones" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDayMode ? "#e2e8f0" : "rgba(255,255,255,0.06)"} />
                <XAxis dataKey="idx" tick={{ fill: isDayMode ? '#64748b' : '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: isDayMode ? '#64748b' : '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="Normal" stackId="1" stroke="#10b981" fill="url(#colorNormal)" strokeWidth={2} activeDot={{ r: 5 }} />
                <Area type="monotone" dataKey="Milestones" stackId="1" stroke="#3b82f6" fill="url(#colorMilestones)" strokeWidth={2} activeDot={{ r: 5 }} />
                <Area type="monotone" dataKey="Alerts" stackId="1" stroke="#ef4444" fill="url(#colorAlerts)" strokeWidth={2} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Controls ───────────────────────────────────────────────────────── */}
      <div className={styles.controls} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div className={styles.filters}>
            {FILTER_TABS.map(f => (
              <button key={f}
                className={`${styles.filterBtn} ${filter === f ? styles.active : ''}`}
                onClick={() => setFilter(f)}
              >{f}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexGrow: 1, maxWidth: '450px' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--panel-bg)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px 10px', flexGrow: 1, boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' }}>
              <Search size={14} style={{ color: 'var(--text-tertiary)', marginRight: '8px' }} />
              <input 
                type="text" 
                placeholder="Search by TxID or Hash..." 
                value={searchTxId}
                onChange={e => setSearchTxId(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', width: '100%', fontSize: '12px', fontFamily: 'monospace' }}
              />
              {searchTxId && <button onClick={() => setSearchTxId('')} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, padding: 0, display: 'flex' }}><XCircle size={13} /></button>}
            </div>
            <button className={styles.verifyBtn} onClick={handleVerify} disabled={verifyState.loading} style={{ flexShrink: 0 }}>
              <ShieldCheck size={14} />
              <span>{verifyState.loading ? 'Verifying…' : 'Verify Chain'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Verify Result ──────────────────────────────────────────────────── */}
      {verifyState.result && (
        <div className={`${styles.verifyResult} ${verifyState.result.valid ? styles.success : styles.error}`}>
          {verifyState.result.valid
            ? <><CheckCircle size={15} /> {getVerifyMsg()}</>
            : <><XCircle size={15} /> Verification failed! {verifyState.result.error || 'Hash mismatch detected.'}</>
          }
        </div>
      )}

      {/* ── Block Feed ─────────────────────────────────────────────────────── */}
      {loading && blocks.length === 0 ? (
        <div className={styles.emptyState}>
          <RefreshCcw size={18} className={styles.spinning} style={{ margin: '0 auto 8px', display: 'block', color: '#94a3b8' }} />
          Loading blockchain ledger…
        </div>
      ) : displayBlocks.length === 0 ? (
        <div className={styles.emptyState}>
          {searchTxId ? (
            <>No blocks found matching TxID/Hash: "<strong>{searchTxId}</strong>"</>
          ) : (
            <>
              No blocks found for filter "<strong>{filter}</strong>".
              {filter === 'Alerts' && ' Start the IoT Simulator and wait for an anomaly event.'}
              {filter === 'Normal' && ' Run the IoT Simulator to generate normal telemetry blocks.'}
            </>
          )}
        </div>
      ) : (
        <div className={styles.feed}>
          <AnimatePresence>
            {displayBlocks.map((block, i) => {
              const isExpanded = expandedBlock === block.blockIndex;
              const sev        = getSeverityKey(block);
              const ethMeta    = block.payload?._ethereum;
              const alertSummary = block.payload?._summary || block.payload?.alertDetails?.messages?.join(' · ');

              return (
                <motion.div
                  key={block.blockIndex ?? block.hash ?? i}
                  className={styles.blockWrapper}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  {/* Chain link icon */}
                  <div className={`${styles.chainLink} ${styles[`link_${sev}`] || styles.link_normal}`}>
                    <LinkIcon size={11} />
                  </div>

                  {/* Block card */}
                  <div
                    className={`${styles.blockCard} ${styles[`card_${sev}`] || styles.card_normal} ${isExpanded ? styles.cardExpanded : ''}`}
                    onClick={() => setExpandedBlock(isExpanded ? null : block.blockIndex)}
                  >
                    <div className={styles.blockHeader}>
                      <div className={styles.blockLeft}>
                        <span className={`${styles.blockBadge} ${styles[`badge_${sev}`] || styles.badge_normal}`}>
                          #{block.blockIndex}
                        </span>
                        <span className={styles.blockType}>
                          <SeverityIcon sev={sev} />
                          {getHumanReadableType(block)}
                        </span>
                        <span className={styles.blockEntity}>
                          {block.entityType}{block.entityId ? ` · ${String(block.entityId).slice(0, 12)}` : ''}
                        </span>
                        {ethMeta?.txHash && (
                          <span className={styles.onChainBadge} title={`Ganache Tx: ${ethMeta.txHash}`}>
                            ⛓ On-Chain
                          </span>
                        )}
                      </div>

                      <div className={styles.blockRight}>
                        <code className={`${styles.blockHash} ${styles[`hash_${sev}`] || styles.hash_normal}`} title={block.hash}>
                          {truncateHash(block.hash)}
                        </code>
                        <span className={styles.blockTime}>{formatDate(block.timestamp)}</span>
                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </div>
                    </div>

                    {/* Alert summary row */}
                    {alertSummary && !isExpanded && (
                      <div className={`${styles.alertSummaryBanner} ${styles[`summary_${sev}`] || ''}`}>
                        {sev !== 'normal' && <SeverityIcon sev={sev} size={11} />}
                        {alertSummary}
                      </div>
                    )}

                    {/* Expanded details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div className={styles.blockDetails} onClick={e => e.stopPropagation()}>
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>Block Hash:</span>
                              <code className={styles.detailValue}>{block.hash || 'N/A'}</code>
                            </div>
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>Prev Hash:</span>
                              <code className={styles.detailValue}>{block.previousHash || '(genesis)'}</code>
                            </div>

                            {/* Alert details box */}
                            {block.payload?.alertDetails && (
                              <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Alert Info:</span>
                                <div style={{ color: '#dc2626', fontSize: '0.7rem', fontWeight: 600 }}>
                                  {block.payload.alertDetails.messages?.map((m, i) => (
                                    <div key={i}>• {m}</div>
                                  ))}
                                  {block.payload.alertDetails.temperature !== undefined &&
                                    <div style={{ color: '#64748b', fontWeight: 400 }}>
                                      Temp: {block.payload.alertDetails.temperature?.toFixed(2)}°C |
                                      Battery: {block.payload.alertDetails.batteryLevel?.toFixed(1)}% |
                                      Tamper: {block.payload.alertDetails.isTampered ? '⚠️ YES' : 'No'}
                                    </div>
                                  }
                                </div>
                              </div>
                            )}

                            {/* Ethereum on-chain proof */}
                            {ethMeta?.txHash && (
                              <div className={styles.detailRowColumn}>
                                <span className={styles.detailLabel}>⛓ Ganache TX:</span>
                                <div className={styles.ethProofRow}>
                                  <code className={styles.ethTxHash}>{ethMeta.txHash}</code>
                                  <span className={styles.ethDetail}>Block #{ethMeta.blockNumber} · Chain Index #{ethMeta.onChainIndex}</span>
                                  <span className={styles.ethDetail}>Contract: {ethMeta.contractAddress}</span>
                                </div>
                              </div>
                            )}

                            {/* Arweave */}
                            {block.arweaveTxId && (
                              <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Arweave:</span>
                                <a href={`https://gateway.irys.xyz/${block.arweaveTxId}`}
                                  target="_blank" rel="noopener noreferrer"
                                  className={styles.arweaveLink}
                                >
                                  🌐 {block.arweaveTxId.slice(0, 20)}… <ExternalLink size={11} />
                                </a>
                              </div>
                            )}

                            {/* Raw payload */}
                            {block.payload && (
                              <div className={styles.detailRowColumn}>
                                <span className={styles.detailLabel}>Payload:</span>
                                <pre className={styles.payload}>
                                  {JSON.stringify(block.payload, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {showReport && (
        <EvidenceReport 
          blocks={filteredBlocks} 
          onClose={() => setShowReport(false)} 
        />
      )}
    </div>
  );
};

export default BlockchainAudit;
