import React, { forwardRef, useEffect, useRef } from 'react';
import styles from './SystemHealth.module.css';
import { 
  Monitor, 
  Box, 
  Server, 
  Database, 
  Link as LinkIcon, 
  FileText,
  Activity,
  Copy
} from 'lucide-react';

const iconMap = {
  frontend: Monitor,
  iot: Box,
  backend: Server,
  mongo: Database,
  arweave: Activity,
  ganache: Box,
  smart_contract: FileText,
};

const NodeCard = forwardRef(({ id, type, title, status, details, metrics, color, outgoing, incoming }, ref) => {
  const Icon = iconMap[type] || LinkIcon;

  const getStatusClass = (st) => {
    if (st === 'ONLINE' || st === 'Healthy') return styles.healthy;
    if (st === 'DEGRADED' || st === 'Warning') return styles.warning;
    return styles.critical;
  };

  const statusText = status === 'ONLINE' ? 'Healthy' : 
                     status === 'DEGRADED' ? 'Warning' : 
                     status === 'OFFLINE' ? 'Critical' : 'Unknown';

  // We assign data-id so the parent can query all anchors
  const statusClass = status === 'OFFLINE' ? styles.offline : (status !== 'ONLINE' ? styles.degraded : '');

  return (
    <div className={`${styles.nodeCard} ${statusClass}`} ref={ref} id={`node-${id}`}>
      {/* Anchor dots for lines */}
      {incoming && <div className={`${styles.anchor} ${styles.left}`} data-anchor="in" data-id={id} />}
      {outgoing && <div className={`${styles.anchor} ${styles.right}`} data-anchor="out" data-id={id} />}

      <div className={styles.cardHeader}>
        <div className={styles.cardIcon} style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color }}>
          <Icon size={24} strokeWidth={1.5} />
        </div>
        <div className={styles.cardTitle}>
          <h3>{title}</h3>
          <div className={styles.cardStatus} title={status !== 'ONLINE' && details ? `Failing detail: ${details}` : ''}>
            <span className={`${styles.statusDot} ${status.toLowerCase() === 'warning' || status === 'DEGRADED' ? styles.warning : status === 'OFFLINE' || status === 'CRITICAL' ? styles.critical : styles.healthy}`}></span>
            <span style={{ color: getStatusClass(status) === styles.healthy ? 'var(--status-healthy)' : 'inherit' }}>
              {statusText}
            </span>
          </div>
          {status !== 'ONLINE' && details && (
            <div style={{ fontSize: '0.75rem', color: 'var(--status-warning)', marginTop: '4px', lineHeight: '1.2' }}>
              ({details})
            </div>
          )}
        </div>
      </div>


    </div>
  );
});

export default NodeCard;
