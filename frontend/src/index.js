import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import './i18n/config'; // Initialize i18n BEFORE App
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

// Zoom/DPI compensation - ensures consistent visual size across browsers
const updateZoomCompensation = () => {
  const html = document.documentElement;
  
  // Safety check: ensure body exists
  if (!document.body) {
    requestAnimationFrame(updateZoomCompensation);
    return;
  }
  
  try {
    // Detect browser zoom by measuring a test element
    const testDiv = document.createElement('div');
    testDiv.style.cssText = 'width: 100px; height: 100px; position: fixed; left: -9999px; top: -9999px; visibility: hidden; pointer-events: none;';
    testDiv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(testDiv);
    
    const rect = testDiv.getBoundingClientRect();
    const actualWidth = rect.width;
    document.body.removeChild(testDiv);
    
    // Validate measurement
    if (!actualWidth || actualWidth <= 0 || !isFinite(actualWidth)) {
      console.warn('⚠️ Invalid zoom measurement, using default scale');
      html.style.setProperty('--base-scale', 1);
      return;
    }
    
    // Calculate zoom level (100px reference)
    const zoomLevel = 100 / actualWidth;
    
    // DPR compensation for Windows/Mac scaling
    const dpr = window.devicePixelRatio || 1;
    
    // Validate DPR
    if (!isFinite(dpr) || dpr <= 0) {
      console.warn('⚠️ Invalid DPR, using default');
      html.style.setProperty('--base-scale', 1);
      return;
    }
    
    // For scaling: ENLARGE components when zoomed OUT
    // At 80% zoom: zoomLevel = 0.8, scale = 1/0.8 = 1.25
    // At 125% zoom: zoomLevel = 1.25, scale = 1/1.25 = 0.8
    const inverseZoom = 1 / zoomLevel;
    const inverseDpr = 1 / dpr;
    
    // Final scale: compensate for zoom AND DPR
    let baseScale = inverseZoom * inverseDpr;
    
    // Clamp scale to reasonable limits (prevent extreme scaling)
    const MIN_SCALE = 0.5;  // Don't shrink below 50%
    const MAX_SCALE = 2.0;  // Don't enlarge above 200%
    baseScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, baseScale));
    
    // Round to 3 decimal places for precision
    baseScale = Math.round(baseScale * 1000) / 1000;
    
    // Apply the scale
    html.style.setProperty('--base-scale', baseScale);
    
    // Log for debugging (only in development)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔍 Zoom Compensation: Zoom=${(zoomLevel * 100).toFixed(0)}%, DPR=${dpr.toFixed(2)}, Scale=${baseScale.toFixed(3)}`);
    }
    
  } catch (error) {
    console.error('❌ Error in zoom compensation:', error);
    // Fallback to no scaling
    html.style.setProperty('--base-scale', 1);
  }
};

// Initial update with proper timing
const initZoomCompensation = () => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Double RAF for stability
      requestAnimationFrame(() => {
        requestAnimationFrame(updateZoomCompensation);
      });
    });
  } else {
    requestAnimationFrame(() => {
      requestAnimationFrame(updateZoomCompensation);
    });
  }
};

// Debounced resize handler for performance
let resizeTimeout;
const handleResize = () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    requestAnimationFrame(updateZoomCompensation);
  }, 150);
};

// Listen for zoom/resize changes
window.addEventListener('resize', handleResize, { passive: true });

// Listen for DPI/resolution changes
const mediaQueries = [
  window.matchMedia('(resolution: 1dppx)'),
  window.matchMedia('(resolution: 1.25dppx)'),
  window.matchMedia('(resolution: 1.5dppx)'),
  window.matchMedia('(resolution: 2dppx)')
];

mediaQueries.forEach(mql => {
  if (mql.addEventListener) {
    mql.addEventListener('change', () => {
      requestAnimationFrame(updateZoomCompensation);
    });
  }
});

// Listen for orientation changes (mobile/tablet)
window.addEventListener('orientationchange', () => {
  setTimeout(() => requestAnimationFrame(updateZoomCompensation), 200);
}, { passive: true });

// Initialize
initZoomCompensation();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for offline support and caching
serviceWorkerRegistration.register({
  onSuccess: () => {
    console.log('App is ready for offline use');
  },
  onUpdate: (registration) => {
    console.log('New version available. Please refresh to update.');
    // Optionally show a notification to the user
  }
});

