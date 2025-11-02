import React, { useEffect, useState } from 'react';
import './ZoomCompensator.css';

const ZoomCompensator = ({ children, className = '' }) => {
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    const updateZoom = () => {
      // Calculate browser zoom level
      const devicePixelRatio = window.devicePixelRatio || 1;
      const screenWidth = window.screen.width;
      const windowWidth = window.innerWidth;
      
      // Detect zoom by comparing expected vs actual viewport width
      // At 100% zoom with 125% DPI: innerWidth should be screen.width / 1.25
      // At 80% zoom with 100% DPI: innerWidth is larger than screen.width
      
      let zoom = 1;
      
      // Method 1: Using device pixel ratio (works for DPI scaling)
      if (devicePixelRatio !== 1) {
        zoom = devicePixelRatio;
      }
      
      // Method 2: Using outerWidth/innerWidth ratio (works for browser zoom)
      if (window.outerWidth && window.innerWidth) {
        const browserZoom = window.outerWidth / window.innerWidth;
        if (browserZoom < 0.95 || browserZoom > 1.05) {
          // Browser zoom is active
          zoom = 1 / browserZoom;
        }
      }
      
      setZoomLevel(zoom);
    };

    updateZoom();
    window.addEventListener('resize', updateZoom);
    
    // Also listen for zoom changes
    const mediaQuery = window.matchMedia('(resolution: 1dppx)');
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateZoom);
    }

    return () => {
      window.removeEventListener('resize', updateZoom);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', updateZoom);
      }
    };
  }, []);

  return (
    <div 
      className={`zoom-compensator ${className}`}
      style={{
        '--zoom-compensation': 1 / zoomLevel
      }}
    >
      {children}
    </div>
  );
};

export default ZoomCompensator;
