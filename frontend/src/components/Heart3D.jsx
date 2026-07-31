import React, { useEffect, useRef, useState } from 'react';
import '@google/model-viewer';

const Heart3D = ({ modelUrl, className }) => {
  const modelRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [localMousePos, setLocalMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let frameId;
    const handleMouseMove = (e) => {
      if (frameId) return;
      frameId = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        setLocalMousePos({ x, y });
        frameId = null;
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    const viewer = modelRef.current;
    
    const handleLoad = () => {
      setIsLoaded(true);
    };

    if (viewer) {
      viewer.addEventListener('load', handleLoad);
      if (viewer.modelIsVisible) handleLoad();
    }

    return () => {
      if (viewer) viewer.removeEventListener('load', handleLoad);
    };
  }, [modelUrl]);

  useEffect(() => {
    if (modelRef.current) {
      const theta = localMousePos.x * -45; 
      const phi = 90 + (localMousePos.y * -20); 
      modelRef.current.cameraOrbit = `${theta}deg ${phi}deg 105%`;
    }
  }, [localMousePos]);

  return (
    <div style={{ 
      width: '100%', height: '100%', position: 'relative', zIndex: 5, 
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      opacity: isLoaded ? 1 : 0,
      transform: isLoaded ? 'scale(1)' : 'scale(0.3)',
      filter: isLoaded ? 'blur(0px)' : 'blur(15px)',
      transition: 'opacity 1.5s ease-out, transform 1.5s cubic-bezier(0.22, 1, 0.36, 1), filter 1.5s ease-out'
    }} className={className}>
      <model-viewer 
        ref={modelRef}
        src={modelUrl || "/heart3d.glb"} 
        alt="NeoLife 3D Holographic Heart"
        shadow-intensity="1" 
        environment-image="neutral"
        exposure="1"
        style={{ 
          width: '80%', 
          height: '80%', 
          backgroundColor: 'transparent',
          '--progress-bar-color': 'transparent',
          '--progress-bar-height': '0px',
          pointerEvents: 'none'
        }}
      >
      </model-viewer>
    </div>
  );
};

export default Heart3D;
