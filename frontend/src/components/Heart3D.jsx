import React, { useEffect, useRef, useState } from 'react';
import '@google/model-viewer';

const Heart3D = ({ mousePos, modelUrl, className }) => {
  const modelRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const viewer = modelRef.current;
    
    const handleLoad = () => {
      setIsLoaded(true);
    };

    if (viewer) {
      viewer.addEventListener('load', handleLoad);
      // Fallback in case it's already loaded or event fires too fast
      if (viewer.modelIsVisible) handleLoad();
    }

    return () => {
      if (viewer) viewer.removeEventListener('load', handleLoad);
    };
  }, [modelUrl]);

  useEffect(() => {
    if (modelRef.current && mousePos) {
      // Calculate angles based on mouse position (-1 to 1)
      const theta = mousePos.x * -45; // rotate left/right
      const phi = 90 + (mousePos.y * -20); // rotate up/down (90 is straight on)
      modelRef.current.cameraOrbit = `${theta}deg ${phi}deg 105%`;
    }
  }, [mousePos]);

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
          '--progress-bar-height': '0px'
        }}
      >
      </model-viewer>
    </div>
  );
};

export default Heart3D;
