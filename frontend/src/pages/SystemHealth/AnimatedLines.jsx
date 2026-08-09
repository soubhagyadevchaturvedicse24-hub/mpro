import React from 'react';
import styles from './SystemHealth.module.css';

/**
 * AnimatedLines renders an SVG overlay mapping connections between HTML elements.
 * @param {Array} connections - Array of { sourceId, targetId, color }
 * @param {Object} coordsMap - Map of id -> { x, y } (relative to SVG container)
 * @param {Boolean} isReady - Whether fonts/layout are ready to show lines
 */
const AnimatedLines = ({ connections, coordsMap, isReady }) => {
  return (
    <svg 
      className={`${styles.svgLayer} ${isReady ? styles.visible : ''}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" opacity="0.6" />
        </marker>
      </defs>
      {connections.map((conn, idx) => {
        const source = coordsMap[conn.sourceId];
        const target = coordsMap[conn.targetId];

        if (!source || !target) return null;

        // Calculate cubic bezier path for smooth S-curve
        // We use a horizontal offset for the control points to make the line exit horizontally
        const offset = Math.max(Math.abs(target.x - source.x) * 0.4, 40);
        
        const pathData = `M ${source.x} ${source.y} C ${source.x + offset} ${source.y}, ${target.x - offset} ${target.y}, ${target.x} ${target.y}`;

        return (
          <g key={idx}>
            {/* Background line (solid, slightly transparent) */}
            <path
              d={pathData}
              fill="none"
              stroke={conn.color}
              strokeWidth="2"
              opacity="0.3"
              markerEnd="url(#arrow)"
              color={conn.color}
            />
            {/* Animated flowing data line (dashed) */}
            <path
              className={styles.animLine}
              d={pathData}
              fill="none"
              stroke={conn.color}
              strokeWidth="2"
            />
            {/* Target dot */}
            <circle cx={target.x} cy={target.y} r="3" fill={conn.color} />
            <circle cx={source.x} cy={source.y} r="3" fill={conn.color} />
          </g>
        );
      })}
    </svg>
  );
};

export default AnimatedLines;
