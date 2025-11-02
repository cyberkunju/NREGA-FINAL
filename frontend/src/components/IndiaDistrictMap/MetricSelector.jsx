import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './MetricSelector.css';

// Minimalistic modern icons
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

const MetricSelector = ({ selectedMetric, onChange, metrics, onAdvancedToggle }) => {
  const { t } = useTranslation();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  
  const primaryMetrics = Object.keys(metrics).filter(key => metrics[key].category === 'primary');
  const advancedMetrics = Object.keys(metrics).filter(key => metrics[key].category === 'advanced');
  
  // Check if selected metric is an advanced one
  const isAdvancedMetricSelected = advancedMetrics.includes(selectedMetric);
  const shouldShowSelectedAdvanced = isAdvancedMetricSelected && !showAdvanced;
  
  const handleAdvancedToggle = () => {
    const newState = !showAdvanced;
    setShowAdvanced(newState);
    if (onAdvancedToggle) {
      onAdvancedToggle(newState);
    }
  };
  
  const handleMobileToggle = () => {
    setIsMobileExpanded(!isMobileExpanded);
  };

  return (
    <div className={`metric-selector ${isMobileExpanded ? 'expanded' : ''}`} onClick={handleMobileToggle}>
      <div className="metric-selector-title">{t('map.selectMetric')}</div>
      
      {/* Primary Metrics */}
      <div className="metric-buttons" onClick={(e) => e.stopPropagation()}>
        {primaryMetrics.map((key) => {
          const metric = metrics[key];
          return (
            <button
              key={key}
              className={`metric-button ${selectedMetric === key ? 'active' : ''}`}
              onClick={() => {
                onChange(key);
                // Close advanced section if open
                if (showAdvanced) {
                  handleAdvancedToggle();
                }
                // Close mobile menu after selection
                setIsMobileExpanded(false);
              }}
              title={metric.title}
            >
              <span className="metric-icon">{MetricIcons[key]}</span>
              <span className="metric-label">{metric.title}</span>
            </button>
          );
        })}
      </div>
      
      {/* Show selected advanced metric when collapsed */}
      {shouldShowSelectedAdvanced && (
        <div className="selected-advanced-metric">
          <button
            className="metric-button active"
            onClick={() => handleAdvancedToggle()}
            title={`${metrics[selectedMetric].title} (Click to see more advanced metrics)`}
          >
            <span className="metric-icon">{MetricIcons[selectedMetric]}</span>
            <span className="metric-label">{metrics[selectedMetric].title}</span>
          </button>
        </div>
      )}
      
      {/* Advanced Metrics Toggle */}
      <button 
        className="advanced-toggle"
        onClick={(e) => {
          e.stopPropagation();
          handleAdvancedToggle();
        }}
        title={showAdvanced ? t('advancedMetrics.hideDetailed') : t('advancedMetrics.showDetailed')}
      >
        <span className="advanced-toggle-text">{t('advancedMetrics.title')}</span>
        <svg 
          className={`advanced-toggle-icon ${showAdvanced ? 'expanded' : ''}`}
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      
      {/* Advanced Metrics */}
      {showAdvanced && (
        <div className="metric-buttons advanced-metrics">
          {advancedMetrics.map((key) => {
            const metric = metrics[key];
            return (
              <button
                key={key}
                className={`metric-button ${selectedMetric === key ? 'active' : ''}`}
                onClick={() => {
                  onChange(key);
                  // Auto-collapse after selection
                  handleAdvancedToggle();
                  // Close mobile menu
                  setIsMobileExpanded(false);
                }}
                title={metric.title}
              >
                <span className="metric-icon">{MetricIcons[key]}</span>
                <span className="metric-label">{metric.title}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MetricSelector;
