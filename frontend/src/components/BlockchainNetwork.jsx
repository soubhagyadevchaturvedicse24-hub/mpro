import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { Lock } from 'lucide-react';
import styles from './BlockchainNetwork.module.css';

const BlockchainNetwork = forwardRef((props, ref) => {
  const containerRef = useRef(null);
  const centerCubeRef = useRef(null);
  const cubeFacesRef = useRef([]);
  const nodesRef = useRef([]);
  const linesRef = useRef([]);
  const energyCircleRef = useRef(null);
  const nodeLocksRef = useRef([]);

  useImperativeHandle(ref, () => ({
    container: containerRef.current,
    centerCube: centerCubeRef.current,
    cubeFaces: cubeFacesRef.current,
    nodes: nodesRef.current,
    lines: linesRef.current,
    energyCircle: energyCircleRef.current,
    nodeLocks: nodeLocksRef.current
  }));

  const angles = [0, 60, 120, 180, 240, 300];
  const radius = 350;

  return (
    <div className={styles.networkContainer} ref={containerRef}>
      {/* SVG Connecting Lines */}
      <svg className={styles.linesSvg} viewBox="-500 -500 1000 1000">
        <circle 
          cx="0" cy="0" r={radius} 
          className="energyCircle" 
          ref={energyCircleRef} 
        />
        {angles.map((angle, i) => {
          const x = radius * Math.cos(angle * Math.PI / 180);
          const y = radius * Math.sin(angle * Math.PI / 180);
          return (
            <line 
              key={`line-${i}`} 
              x1="0" y1="0" 
              x2={x} y2={y} 
              className="nodeLine" 
              ref={el => linesRef.current[i] = el}
            />
          )
        })}
      </svg>
      
      {/* Center Cube */}
      <div className={styles.centerCubeWrapper} ref={centerCubeRef}>
        <div className={styles.cube}>
          {['front', 'back', 'right', 'left', 'top', 'bottom'].map((face, i) => (
            <div 
              key={face}
              className={`${styles.cubeFace} ${styles[face]}`}
              ref={el => cubeFacesRef.current[i] = el}
            />
          ))}
        </div>
      </div>

      {/* Nodes */}
      <div className={styles.nodesWrapper}>
        {angles.map((angle, i) => {
           const x = radius * Math.cos(angle * Math.PI / 180);
           const y = radius * Math.sin(angle * Math.PI / 180);
           return (
             <div 
               key={`node-${i}`} 
               className={styles.nodeWrapper} 
               style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)`}}
               ref={el => nodesRef.current[i] = el}
             >
               <div className={styles.smallCube}>
                 <div className={`${styles.cubeFace} ${styles.front}`}>
                   <Lock 
                     size={24} 
                     className="nodeLock" 
                     color="#00d2ff" 
                     ref={el => nodeLocksRef.current[i] = el}
                   />
                 </div>
                 <div className={`${styles.cubeFace} ${styles.back}`}></div>
                 <div className={`${styles.cubeFace} ${styles.right}`}></div>
                 <div className={`${styles.cubeFace} ${styles.left}`}></div>
                 <div className={`${styles.cubeFace} ${styles.top}`}></div>
                 <div className={`${styles.cubeFace} ${styles.bottom}`}></div>
               </div>
             </div>
           )
        })}
      </div>
    </div>
  );
});

export default BlockchainNetwork;
