import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import axios from 'axios';
import styles from './SystemHealth.module.css';
import { RefreshCw, Heart, Clock, Server, ShieldCheck, Box, Shield } from 'lucide-react';
import NodeCard from './NodeCard.jsx';

import AnimatedLines from './AnimatedLines.jsx';

// Column Wrapper Component
const ColumnGroup = ({ title, children, color, centerVertically }) => (
  <div className={styles.column} style={{ 
    border: `1.5px solid color-mix(in srgb, ${color} 20%, transparent)`, 
    backgroundColor: `color-mix(in srgb, ${color} 5%, transparent)`, 
    justifyContent: centerVertically ? 'center' : 'flex-start' 
  }}>
    <div className={styles.columnHeader} style={{ color }}>
      {title}
    </div>
    {children}
  </div>
);

// Simulator Log Terminal Component
const SimulatorLogTerminal = () => (
  <div className={styles.terminalContainer}>
    <div className={styles.terminalHeader}>
      <div className={styles.terminalDots}>
        <div className={`${styles.dot} ${styles.red}`} />
        <div className={`${styles.dot} ${styles.yellow}`} />
        <div className={`${styles.dot} ${styles.green}`} />
      </div>
      <div className={styles.terminalTitle}>simulator.log</div>
    </div>
    <div className={styles.terminalBody}>
      <div className={styles.logLine}>
        <span className={styles.logTime}>02:31:31</span>
        <span className={`${styles.logContent} ${styles.info}`}>▶ Simulator started - Box:BOX-2026-FABRIC-ALPHA Mission:TRN-KID-2026-001 Interval:5s</span>
      </div>
      <div className={styles.logLine}>
        <span className={styles.logTime}>02:31:31</span>
        <span className={`${styles.logContent} ${styles.tick}`}>[TICK] Temp:2°C Bat:100% Tamper:false Spike:false</span>
      </div>
      <div className={styles.logLine}>
        <span className={styles.logTime}>02:31:31</span>
        <span className={`${styles.logContent} ${styles.success}`}>✓ Backend accepted [201]</span>
      </div>
      <div className={styles.logLine}>
        <span className={styles.logTime}>02:31:32</span>
        <span className={`${styles.logContent} ${styles.override}`}>Manual override: Temp set to 3.5°C</span>
      </div>
      <div className={styles.logLine}>
        <span className={styles.logTime}>02:31:32</span>
        <span className={`${styles.logContent} ${styles.tick}`}>[TICK] Temp:3.5°C Bat:100% Tamper:false Spike:false</span>
      </div>
      <div className={styles.logLine}>
        <span className={styles.logTime}>02:31:32</span>
        <span className={`${styles.logContent} ${styles.success}`}>✓ Backend accepted [201]</span>
      </div>
      <div className={styles.logLine}>
        <span className={styles.logTime}>02:31:33</span>
        <span className={`${styles.logContent} ${styles.info}`}>◼ Simulator stopped.</span>
      </div>
    </div>
  </div>
);

const SystemHealthFlowchart = ({ hideHeader = false }) => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [coordsMap, setCoordsMap] = useState({});
  const containerRef = useRef(null);

  // Hardcode tokens (to use in JS logic where needed)
  const colors = {
    client: 'var(--accent-client)',
    hub: 'var(--accent-hub)',
    offchain: 'var(--accent-offchain)',
    onchain: 'var(--accent-onchain)',
  };

  const fetchHealth = async () => {
    try {
      const res = await axios.get('/api/system/health/full');
      setHealthData(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Health fetch error", err);
      setErrorMsg(err.message || 'Failed to fetch architecture data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const int = setInterval(fetchHealth, 8000);
    return () => clearInterval(int);
  }, []);

  // --- Resize & Anchor Tracking Logic ---
  const updateCoords = () => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const anchors = containerRef.current.querySelectorAll(`.${styles.anchor}`);
    
    const newCoords = {};
    anchors.forEach(anchor => {
      const rect = anchor.getBoundingClientRect();
      const id = anchor.getAttribute('data-id');
      const type = anchor.getAttribute('data-anchor'); // 'in' or 'out'
      // Coordinates relative to the SVG container (which is containerRef)
      newCoords[`${id}-${type}`] = {
        x: rect.left - containerRect.left + (rect.width / 2),
        y: rect.top - containerRect.top + (rect.height / 2)
      };
    });
    setCoordsMap(newCoords);
  };

  useEffect(() => {
    // 1. Wait for web fonts to load to prevent snapping
    let timeoutId;
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        updateCoords();
        setIsReady(true);
      });
    } else {
      // Fallback if fonts API is unavailable
      timeoutId = setTimeout(() => {
        updateCoords();
        setIsReady(true);
      }, 500);
    }

    // 2. Setup ResizeObserver on the container to catch layout shifts
    const observer = new ResizeObserver(() => {
      requestAnimationFrame(updateCoords);
    });
    
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    // Also observe window resize as a fallback
    window.addEventListener('resize', updateCoords);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
      window.removeEventListener('resize', updateCoords);
    };
  }, [healthData]); // Re-run if data changes (new DOM nodes might appear)

  if (errorMsg) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#DC2626' }}>
        <h3>System Architecture Data Error</h3>
        <p>{errorMsg}</p>
        <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#64748B' }}>
          Please make sure the backend server is running and has been restarted.
        </p>
      </div>
    );
  }

  if (loading || !healthData) {
    return <div style={{ padding: '2rem' }}>Loading System Architecture...</div>;
  }

  const { nodes, overall, timestamp } = healthData;

  // Define the multi-anchor connections (N:1, 1:N, 1:1 supported)
  const connections = [
    // Client to Hub (Blue)
    { sourceId: 'frontend_node-out', targetId: 'api_gateway-in', color: colors.client },
    { sourceId: 'iot_simulator-out', targetId: 'api_gateway-in', color: colors.client },
    // Hub to Offchain (Green)
    { sourceId: 'api_gateway-out', targetId: 'mongo_db-in', color: colors.hub },
    { sourceId: 'api_gateway-out', targetId: 'arweave_permaweb-in', color: colors.hub },
    // Offchain to Onchain (Purple)
    { sourceId: 'arweave_permaweb-out', targetId: 'ganache_chain-in', color: colors.onchain },
    { sourceId: 'mongo_db-out', targetId: 'ganache_chain-in', color: colors.onchain },
    { sourceId: 'ganache_chain-out', targetId: 'smart_contract-in', color: colors.onchain },
  ];

  return (
    <div className={styles.container}>
      
      {/* Header (Hidden if nested inside Dashboard) */}
      {!hideHeader && (
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1>System Health & Live Data Flow</h1>
            <p>Real-time architecture monitoring and data flow visualization</p>
          </div>
          <div className={styles.headerRight}>
            <div className={`${styles.overallStatusPill} ${overall === 'DEGRADED' ? styles.degraded : overall === 'OFFLINE' ? styles.offline : ''}`}>
              <span className={styles.statusDot} style={{ background: 'currentColor', marginRight: '4px' }}></span>
              <div>
                {overall === 'ONLINE' ? 'All Systems Operational' : `System ${overall}`}
                {overall !== 'ONLINE' && nodes && (
                  <div style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: '2px', fontWeight: 'normal' }}>
                    Failing: {Object.values(nodes).filter(n => n.status !== 'ONLINE').map(n => n.details).join(', ')}
                  </div>
                )}
              </div>
            </div>
            <div className={styles.lastUpdated}>
              <Clock size={16} />
              Last Updated: {new Date(timestamp).toLocaleTimeString()}
              <RefreshCw size={16} className={styles.refreshIcon} onClick={fetchHealth} />
            </div>
          </div>
        </div>
      )}

      {/* Main Flowchart Canvas */}
      <div className={styles.canvasWrapper}>
        <div className={styles.flowchartGrid} ref={containerRef}>
          
          <AnimatedLines 
            connections={connections} 
            coordsMap={coordsMap} 
            isReady={isReady} 
          />

          {/* Column 1: Client / Edge */}
          <ColumnGroup number="1" title="Client / Edge" color={colors.client}>
            <NodeCard 
              id="frontend_node" type="frontend" title="React Dashboard" color={colors.client}
              status={nodes.frontend_node.status} details={nodes.frontend_node.details} metrics={nodes.frontend_node.metrics}
              outgoing={true}
            />
            <NodeCard 
              id="iot_simulator" type="iot" title="IoT Box Simulator" color={colors.client}
              status={nodes.iot_simulator.status} details={nodes.iot_simulator.details} metrics={nodes.iot_simulator.metrics}
              outgoing={true}
            />
          </ColumnGroup>

          {/* Column 2: Processing Hub */}
          <ColumnGroup number="2" title="Processing Hub" color={colors.hub} centerVertically={true}>
            <NodeCard 
              id="api_gateway" type="backend" title="Node.js Backend Core" color={colors.hub}
              status={nodes.api_gateway.status} details={nodes.api_gateway.details} metrics={nodes.api_gateway.metrics}
              incoming={true} outgoing={true}
            />
          </ColumnGroup>

          {/* Column 3: Private Off-Chain */}
          <ColumnGroup number="3" title="Private Off-Chain" color={colors.offchain}>
            <NodeCard 
              id="mongo_db" type="mongo" title="MongoDB" color={colors.offchain}
              status={nodes.mongo_db.status} details={nodes.mongo_db.details} metrics={nodes.mongo_db.metrics}
              incoming={true} outgoing={true}
            />
            <NodeCard 
              id="arweave_permaweb" type="arweave" title="Arweave Permaweb" color={colors.offchain}
              status={nodes.arweave_permaweb.status} details={nodes.arweave_permaweb.details} metrics={nodes.arweave_permaweb.metrics}
              incoming={true} outgoing={true}
            />
          </ColumnGroup>

          {/* Column 4: Public On-Chain */}
          <ColumnGroup number="4" title="Public On-Chain" color={colors.onchain}>
            <NodeCard 
              id="ganache_chain" type="ganache" title="Ganache (Local)" color={colors.onchain}
              status={nodes.ganache_chain.status} details={nodes.ganache_chain.details} metrics={nodes.ganache_chain.metrics}
              incoming={true} outgoing={true}
            />
            <NodeCard 
              id="smart_contract" type="smart_contract" title="Smart Contract" color={colors.onchain}
              status={nodes.smart_contract.status} details={nodes.smart_contract.details} metrics={nodes.smart_contract.metrics}
              incoming={true}
            />
          </ColumnGroup>

        </div>
      </div>

      {/* Legend */}
      <div className={styles.bottomSection}>
        <div className={styles.legendRow}>
          <div style={{ fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.05em' }}>LEGEND</div>
          <div className={styles.legendGroup}>
            <div className={styles.legendItem}><span className={`${styles.statusDot} ${styles.healthy}`}></span> Healthy</div>
            <div className={styles.legendItem}><span className={`${styles.statusDot} ${styles.warning}`}></span> Warning</div>
            <div className={styles.legendItem}><span className={`${styles.statusDot} ${styles.critical}`}></span> Critical</div>
          </div>
          <div className={styles.legendGroup}>
            <div className={styles.legendItem} style={{ color: colors.client }}><div className={`${styles.legendLine} ${styles.dashed}`} style={{ color: colors.client }}></div> Incoming Requests</div>
            <div className={styles.legendItem} style={{ color: colors.hub }}><div className={`${styles.legendLine} ${styles.dashed}`} style={{ color: colors.hub }}></div> Database Writes</div>
            <div className={styles.legendItem} style={{ color: colors.offchain }}><div className={`${styles.legendLine} ${styles.dashed}`} style={{ color: colors.offchain }}></div> Blockchain Notarization</div>
            <div className={styles.legendItem} style={{ color: colors.onchain }}><div className={`${styles.legendLine} ${styles.animated}`} style={{ color: colors.onchain }}></div> Live Data Flow</div>
          </div>
        </div>
        {/* Simulator Log Terminal */}
        <SimulatorLogTerminal />
      </div>

    </div>
  );
};

export default SystemHealthFlowchart;
