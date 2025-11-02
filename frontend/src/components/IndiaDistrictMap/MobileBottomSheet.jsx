import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './MobileBottomSheet.css';

// Import metric icons from MetricSelector
const MetricIcons = {
  paymentPercentage: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  averageDays: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
    </svg>
  ),
  womenParticipation: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/>
      <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
    </svg>
  ),
  households100Days: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
      <path d="M2 17l10 5 10-5"/>
      <path d="M2 12l10 5 10-5"/>
    </svg>
  ),
  scstParticipation: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="3"/>
      <circle cx="17" cy="7" r="3"/>
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
      <path d="M16 11h6"/>
    </svg>
  ),
  workCompletion: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4"/>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  ),
  averageWage: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <line x1="2" y1="10" x2="22" y2="10"/>
    </svg>
  ),
  agricultureWorks: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      <circle cx="12" cy="12" r="1" fill="currentColor"/>
    </svg>
  )
};

const MobileBottomSheet = ({ selectedMetric, onChange, metrics, currentLegend }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [showTutorial, setShowTutorial] = useState(true);
  const [canDismissTutorial, setCanDismissTutorial] = useState(false);
  const sheetRef = useRef(null);
  
  const primaryMetrics = Object.keys(metrics).filter(key => metrics[key].category === 'primary');
  const advancedMetrics = Object.keys(metrics).filter(key => metrics[key].category === 'advanced');
  const allMetrics = [...primaryMetrics, ...advancedMetrics];

  // Enable tutorial dismissal after 5 seconds
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setCanDismissTutorial(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Hide tutorial on click only after 5 seconds
  React.useEffect(() => {
    const handleClick = () => {
      if (canDismissTutorial) {
        setShowTutorial(false);
      }
    };
    if (showTutorial) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [showTutorial, canDismissTutorial]);

  // Get legend colors for mini dots
  const getLegendDots = (metricKey) => {
    const metricConfig = metrics[metricKey];
    if (!metricConfig || !metricConfig.colorStops) return [];
    
    const colorStops = metricConfig.colorStops;
    const dots = [];
    
    // Get 3-4 representative colors from the color stops
    const step = Math.floor(colorStops.length / 8); // colorStops has pairs [value, color]
    for (let i = 1; i < colorStops.length; i += step * 2) {
      if (dots.length < 4) {
        dots.push(colorStops[i]);
      }
    }
    
    return dots.slice(0, 4);
  };

  // Swipe to change metrics
  const handleSwipe = (direction) => {
    const currentIndex = allMetrics.indexOf(selectedMetric);
    let newIndex;
    
    if (direction === 'left') {
      newIndex = (currentIndex + 1) % allMetrics.length;
    } else {
      newIndex = (currentIndex - 1 + allMetrics.length) % allMetrics.length;
    }
    
    onChange(allMetrics[newIndex]);
  };

  const handleFABClick = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setShowAdvanced(false);
  };

  const handleMetricSelect = (metricKey) => {
    onChange(metricKey);
    // Auto-close the bottom sheet after selection
    handleClose();
  };

  const handleDragStart = (e) => {
    const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
    setDragStartY(clientY);
    setCurrentY(clientY);
  };

  const handleDragMove = (e) => {
    if (dragStartY === 0) return;
    const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
    setCurrentY(clientY);
    
    const deltaY = clientY - dragStartY;
    if (deltaY > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${deltaY}px)`;
    }
  };

  const handleDragEnd = () => {
    if (dragStartY === 0) return;
    
    const deltaY = currentY - dragStartY;
    if (deltaY > 100) {
      handleClose();
    }
    
    if (sheetRef.current) {
      sheetRef.current.style.transform = '';
    }
    setDragStartY(0);
    setCurrentY(0);
  };

  // Close on backdrop click
  const handleBackdropClick = (e) => {
    if (e.target.classList.contains('bottom-sheet-backdrop')) {
      handleClose();
    }
  };

  return (
    <>
      {/* Tutorial message - appears above bottom navbar */}
      {!isOpen && showTutorial && (
        <div className="tutorial-message">
          <button className="tutorial-close" onClick={() => setShowTutorial(false)}>×</button>
          <div className="tutorial-content">
            {t('mobile.tutorialTapBar')}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            {t('mobile.tutorialToSwitch')}
          </div>
        </div>
      )}

      {/* Main screen metric indicator with swipe arrows - clickable to open menu */}
      {!isOpen && selectedMetric && metrics[selectedMetric] && (
        <div className="mobile-metric-indicator" onClick={handleFABClick}>
          {/* Left swipe arrow */}
          <button 
            className="swipe-arrow swipe-arrow-left" 
            onClick={(e) => { e.stopPropagation(); handleSwipe('right'); }}
            aria-label="Previous metric"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          
          <span className="metric-indicator-icon">{MetricIcons[selectedMetric]}</span>
          <span>{metrics[selectedMetric].title}</span>
          
          {/* Right swipe arrow */}
          <button 
            className="swipe-arrow swipe-arrow-right" 
            onClick={(e) => { e.stopPropagation(); handleSwipe('left'); }}
            aria-label="Next metric"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      )}

      {/* Main screen dot legend */}
      {!isOpen && currentLegend && (
        <div className="mobile-dot-legend">
          {currentLegend.items.map((item, index) => (
            <div key={index} className="legend-dot-item">
              <div 
                className="legend-dot-circle" 
                style={{ backgroundColor: item.color }}
              />
              <span className="legend-dot-label">{item.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Sheet */}
      {isOpen && (
        <div className="bottom-sheet-backdrop" onClick={handleBackdropClick}>
          <div 
            ref={sheetRef}
            className="bottom-sheet"
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchStart={handleDragStart}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
          >
            {/* Drag handle */}
            <div className="bottom-sheet-handle"></div>
            
            {/* Close button */}
            <button className="bottom-sheet-close" onClick={handleClose} aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>

            {/* Title */}
            <h2 className="bottom-sheet-title">{t('map.selectMetric')}</h2>

            {/* Primary Metrics */}
            <div className="bottom-sheet-metrics">
              {primaryMetrics.map((key) => {
                const metric = metrics[key];
                const legendDots = getLegendDots(key);
                return (
                  <button
                    key={key}
                    className={`bottom-sheet-metric-button ${selectedMetric === key ? 'active' : ''}`}
                    data-metric={key}
                    onClick={() => handleMetricSelect(key)}
                  >
                    <span className="metric-icon">{MetricIcons[key]}</span>
                    <span className="metric-label">{metric.title}</span>
                    <div className="metric-mini-legend">
                      {legendDots.map((color, idx) => (
                        <div 
                          key={idx} 
                          className="legend-dot" 
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legend - Dynamic based on selected metric */}
            {currentLegend && (
              <div className="bottom-sheet-legend">
                <h3 className="legend-title">{currentLegend.title}</h3>
                <div className="legend-gradient">
                  {currentLegend.items.map((item, index) => (
                    <div key={index} className="legend-item">
                      <div 
                        className="legend-color" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="legend-value">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Advanced Metrics Toggle */}
            <button 
              className="bottom-sheet-advanced-toggle"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <span>{t('advancedMetrics.title')}</span>
              <svg 
                className={`toggle-icon ${showAdvanced ? 'expanded' : ''}`}
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5"
                style={{ width: '20px', height: '20px' }}
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {/* Advanced Metrics */}
            {showAdvanced && (
              <div className="bottom-sheet-metrics advanced">
                {advancedMetrics.map((key) => {
                  const metric = metrics[key];
                  const legendDots = getLegendDots(key);
                  return (
                    <button
                      key={key}
                      className={`bottom-sheet-metric-button ${selectedMetric === key ? 'active' : ''}`}
                      data-metric={key}
                      onClick={() => handleMetricSelect(key)}
                    >
                      <span className="metric-icon">{MetricIcons[key]}</span>
                      <span className="metric-label">{metric.title}</span>
                      <div className="metric-mini-legend">
                        {legendDots.map((color, idx) => (
                          <div 
                            key={idx} 
                            className="legend-dot" 
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default MobileBottomSheet;
