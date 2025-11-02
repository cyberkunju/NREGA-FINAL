import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';
import { getHeatmapData } from '../../services/api';
import { normalizeDistrictName, createLookupKeys, findBestMatch } from '../../utils/districtNameMapping';
import { detectUserDistrict } from '../../utils/locationDetection';
import perfectMapping from '../../data/perfect-district-mapping-v2.json';
import MetricSelector from './MetricSelector';
import Legend from './Legend';
import Tooltip from './Tooltip';
import LoadingOverlay from './LoadingOverlay';
import SearchBar from './SearchBar';
import Logo from './Logo';
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher';
import LocationPrompt from './LocationPrompt';
import MobileBottomSheet from './MobileBottomSheet';
import './MapView.css';

// Metric configurations with color ramps
// Note: titles will be translated dynamically using i18n
const METRICS = {
  // Primary Metrics
  paymentPercentage: {
    key: 'paymentPercentage',
    titleKey: 'metricTitles.paymentTimeliness',
    unit: '%',
    format: (val) => `${val.toFixed(1)}%`,
    colorStops: [0, '#dc2626', 0.1, '#ef4444', 25, '#f59e0b', 50, '#eab308', 75, '#84cc16', 100, '#10b981'],
    icon: '⏱️',
    category: 'primary'
  },
  averageDays: {
    key: 'averageDays',
    titleKey: 'metricTitles.averagePaymentDays',
    unit: ' days',
    format: (val) => `${Math.round(val)} days`,
    colorStops: [0, '#10b981', 25, '#84cc16', 50, '#eab308', 75, '#f59e0b', 100, '#ef4444', 105, '#dc2626'],
    icon: '📅',
    category: 'primary'
  },
  womenParticipation: {
    key: 'womenParticipationPercent',
    titleKey: 'metricTitles.womenParticipation',
    unit: '%',
    format: (val) => `${val.toFixed(1)}%`,
    colorStops: [0, '#dc2626', 0.1, '#ef4444', 25, '#f59e0b', 50, '#eab308', 75, '#84cc16', 100, '#10b981'],
    icon: '👤',
    category: 'primary'
  },
  
  // Advanced Metrics
  households100Days: {
    key: 'households100DaysPercent',
    titleKey: 'metricTitles.households100Days',
    unit: '%',
    format: (val) => `${val.toFixed(1)}%`,
    colorStops: [0, '#dc2626', 0.1, '#ef4444', 5, '#f59e0b', 10, '#eab308', 15, '#84cc16', 20, '#10b981'],
    icon: '💯',
    category: 'advanced'
  },
  scstParticipation: {
    key: 'scstParticipationPercent',
    titleKey: 'metricTitles.scstParticipation',
    unit: '%',
    format: (val) => `${val.toFixed(1)}%`,
    colorStops: [0, '#dc2626', 0.1, '#ef4444', 15, '#f59e0b', 30, '#eab308', 45, '#84cc16', 60, '#10b981'],
    icon: '🤝',
    category: 'advanced'
  },
  workCompletion: {
    key: 'workCompletionPercent',
    titleKey: 'metricTitles.workCompletionRate',
    unit: '%',
    format: (val) => `${val.toFixed(1)}%`,
    colorStops: [0, '#dc2626', 0.1, '#ef4444', 25, '#f59e0b', 50, '#eab308', 75, '#84cc16', 100, '#10b981'],
    icon: '✅',
    category: 'advanced'
  },
  averageWage: {
    key: 'averageWageRate',
    titleKey: 'metricTitles.averageWageRate',
    unit: '/day',
    format: (val) => `₹${Math.round(val)}`,
    colorStops: [0, '#dc2626', 150, '#ef4444', 200, '#f59e0b', 250, '#eab308', 300, '#84cc16', 350, '#10b981'],
    icon: '💵',
    category: 'advanced'
  },
  agricultureWorks: {
    key: 'agricultureWorksPercent',
    titleKey: 'metricTitles.agricultureWorks',
    unit: '%',
    format: (val) => `${val.toFixed(1)}%`,
    colorStops: [0, '#dc2626', 0.1, '#ef4444', 20, '#f59e0b', 40, '#eab308', 60, '#84cc16', 80, '#10b981'],
    icon: '🌾',
    category: 'advanced'
  }
};

const MapView = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const navigate = useNavigate();
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [enrichedGeoJSON, setEnrichedGeoJSON] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('paymentPercentage');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, data: null });
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  
  const hoveredDistrictId = useRef(null);
  const enrichedDataRef = useRef(null); // Store enriched data for property lookups
  const selectedMetricRef = useRef(selectedMetric); // Ref to always have current metric
  const autoDetectionAttempted = useRef(false); // Track if we've already tried auto-detection

  // Auto-detect user's location and navigate to their district
  const tryAutoDetectLocation = useCallback(async (geoJSON) => {
    // Check if already attempted in this session
    const sessionAttempted = sessionStorage.getItem('autoLocationAttempted');
    if (sessionAttempted === 'true') {
      console.log('🚫 Auto-location already attempted in this session');
      return;
    }

    // Only try once per session
    if (autoDetectionAttempted.current) return;
    autoDetectionAttempted.current = true;
    
    // Mark as attempted for this session
    sessionStorage.setItem('autoLocationAttempted', 'true');

    // Check if user has previously dismissed auto-detection permanently
    const dismissed = localStorage.getItem('autoLocationDismissed');
    if (dismissed === 'true') {
      console.log('🚫 Auto-location previously dismissed by user');
      return;
    }

    try {
      console.log('🌍 Attempting auto-location detection...');
      setShowLocationPrompt(true);
      
      const result = await detectUserDistrict(geoJSON);
      
      console.log('🔍 Detection result:', result);
      
      if (result && result.districtName) {
        console.log('✅ Auto-detected district:', result.districtName);
        console.log('🔍 Feature properties:', result.feature.properties);
        
        // Find the matching district in our data using perfect mapping
        const stateNameRaw = result.feature.properties.state_name || result.feature.properties.STATE || result.feature.properties.st_nm;
        const normalizedState = normalizeDistrictName(stateNameRaw);
        const normalizedDistrict = normalizeDistrictName(result.districtName);
        const compositeKey = `${normalizedState}:${normalizedDistrict}`;
        
        console.log('🔍 Looking up mapping with key:', compositeKey);
        let mapping = perfectMapping.mappings[compositeKey];
        let matchedKey = compositeKey; // Track which key was actually matched
        console.log('🔍 Mapping found:', mapping);
        
        // If exact match not found, try fuzzy matching
        if (!mapping) {
          console.log('🔍 Exact match not found, trying fuzzy matching...');
          
          // Get all keys for the same state
          const stateKeys = Object.keys(perfectMapping.mappings).filter(key => 
            key.startsWith(normalizedState + ':')
          );
          
          console.log('🔍 Available keys for state:', stateKeys.slice(0, 10));
          
          // Try to find a partial match
          const partialMatch = stateKeys.find(key => {
            const keyDistrict = key.split(':')[1];
            // Check if either contains the other
            return keyDistrict.includes(normalizedDistrict) || 
                   normalizedDistrict.includes(keyDistrict);
          });
          
          if (partialMatch) {
            console.log('✅ Found partial match:', partialMatch);
            mapping = perfectMapping.mappings[partialMatch];
            matchedKey = partialMatch; // Update matched key
          }
        }
        
        if (mapping) {
          // Get API district and state names
          let apiDistrictName, apiStateName;
          
          if (mapping.apiDistrict && mapping.apiState) {
            // Use explicit API names if available
            apiDistrictName = mapping.apiDistrict;
            apiStateName = mapping.apiState;
          } else if (mapping.geoDistrict && mapping.geoState) {
            // Use geoDistrict name - this is what's in the enriched data
            // The enriched GeoJSON has apiDistrictName property that matches the API
            apiDistrictName = mapping.geoDistrict;
            apiStateName = mapping.geoState;
            
            // Try to find the actual API name from enriched data
            if (enrichedDataRef.current) {
              const matchingFeature = enrichedDataRef.current.features.find(f => 
                f.properties.district_name === mapping.geoDistrict &&
                f.properties.state_name === mapping.geoState
              );
              
              if (matchingFeature && matchingFeature.properties.apiDistrictName) {
                apiDistrictName = matchingFeature.properties.apiDistrictName;
                apiStateName = matchingFeature.properties.apiStateName || mapping.geoState;
                console.log('✅ Found API names from enriched data:', { apiDistrictName, apiStateName });
              }
            }
          } else {
            // Fallback: extract from the matched key
            const [state, district] = matchedKey.split(':');
            apiStateName = state.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            apiDistrictName = district.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          }
          
          console.log('🔍 Using API names:', { apiDistrictName, apiStateName });
          
          // Navigate to the district report page
          // Route format is /district/:districtName (URL encoded)
          const districtParam = encodeURIComponent(apiDistrictName);
          
          console.log(`🚀 Navigating to: /district/${districtParam}`);
          
          // Small delay to ensure map is visible first
          setTimeout(() => {
            setShowLocationPrompt(false);
            navigate(`/district/${districtParam}`);
          }, 2000);
        } else {
          console.warn('⚠️ District found but no API mapping available');
          console.warn('⚠️ Composite key:', compositeKey);
          console.warn('⚠️ Available keys sample:', Object.keys(perfectMapping.mappings).slice(0, 10));
          setShowLocationPrompt(false);
        }
      } else {
        console.warn('⚠️ No district detected from location');
        setShowLocationPrompt(false);
      }
    } catch (error) {
      console.error('❌ Auto-location error:', error);
      console.error('❌ Error stack:', error.stack);
      setShowLocationPrompt(false);
      // Silently fail - user can still use the map normally
    }
  }, [navigate]);

  const handleDismissLocationPrompt = useCallback(() => {
    setShowLocationPrompt(false);
    localStorage.setItem('autoLocationDismissed', 'true');
  }, []);

  // Initialize MapLibre GL map (Task 3)
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    console.log('🗺️  [MapView] Initializing MapLibre GL...');

    // Debounce timer references
    let resizeTimeout = null;
    let visualViewportTimeout = null;

    // Handle window resize to update map size with debouncing
    const handleResize = () => {
      if (!map.current) return;
      
      // Clear existing timeout
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      
      // Debounce resize to prevent loops
      resizeTimeout = setTimeout(() => {
        if (map.current) {
          map.current.resize();
        }
      }, 150); // 150ms debounce
    };

    // Handle visual viewport changes (pinch zoom on mobile) with aggressive debouncing
    const handleVisualViewportResize = () => {
      if (!map.current) return;
      
      // Clear existing timeout
      if (visualViewportTimeout) {
        clearTimeout(visualViewportTimeout);
      }
      
      // More aggressive debounce for visual viewport to prevent pinch-zoom glitches
      visualViewportTimeout = setTimeout(() => {
        if (map.current) {
          map.current.resize();
        }
      }, 250); // 250ms debounce for viewport changes
    };

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {},
          layers: [
            {
              id: 'background',
              type: 'background',
              paint: {
                'background-color': '#E3F2FD'
              }
            }
          ],
          glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf'
        },
        center: [81.1825, 24.0276], // Perfect center for mobile view
        zoom: 3.0, // Perfect zoom to see full India
        minZoom: 3, // Allow more zoom out
        maxZoom: 10,
        renderWorldCopies: false, // Prevent world duplication
        dragRotate: false, // Disable rotation
        touchZoomRotate: true, // Enable touch zoom
        touchPitch: false // Disable pitch on touch
      });

      // Store initial center and bounds
      let initialCenter = { lng: 81.1825, lat: 24.0276 }; // Perfect center for mobile
      let initialBounds = null;
      let isActivelyZooming = false;
      let zoomEndTimeout = null;

      map.current.on('load', () => {
        console.log('✅ [MapView] Map loaded successfully');
        setMapLoaded(true);
      });

      // Track when zoom is actively happening
      map.current.on('zoomstart', () => {
        isActivelyZooming = true;
        // Clear any pending timeout
        if (zoomEndTimeout) {
          clearTimeout(zoomEndTimeout);
        }
      });

      // Track zoom end with delay
      map.current.on('zoomend', () => {
        // Keep the flag true for a bit longer to prevent interference
        if (zoomEndTimeout) {
          clearTimeout(zoomEndTimeout);
        }
        zoomEndTimeout = setTimeout(() => {
          isActivelyZooming = false;
        }, 500); // Wait 500ms after zoom ends before allowing boundary corrections
        
        // Log current position for debugging
        const center = map.current.getCenter();
        const zoom = map.current.getZoom();
        console.log('📍 CURRENT MAP STATE:');
        console.log(`   Center: [${center.lng.toFixed(4)}, ${center.lat.toFixed(4)}]`);
        console.log(`   Zoom: ${zoom.toFixed(2)}`);
        console.log('   Copy this for perfect positioning!');
      });

      // Snap back to center at default zoom, constrain at higher zoom
      // Only trigger when NOT actively zooming to prevent interference
      map.current.on('moveend', () => {
        // Don't interfere if user is currently zooming
        if (isActivelyZooming) return;
        if (!initialBounds) return;
        
        // Log current position after move
        const center = map.current.getCenter();
        const zoom = map.current.getZoom();
        console.log('🗺️ AFTER MOVE:');
        console.log(`   Center: [${center.lng.toFixed(4)}, ${center.lat.toFixed(4)}]`);
        console.log(`   Zoom: ${zoom.toFixed(2)}`);
        
        const currentZoom = map.current.getZoom();
        const currentCenter = map.current.getCenter();
        
        // More lenient snap-back - only at very low zoom and far from center
        if (currentZoom <= 4.3) {
          const distanceFromCenter = Math.sqrt(
            Math.pow(currentCenter.lng - initialCenter.lng, 2) + 
            Math.pow(currentCenter.lat - initialCenter.lat, 2)
          );
          
          // Only snap back if moved very far (increased from 0.1 to 5.0)
          if (distanceFromCenter > 5.0) {
            map.current.easeTo({
              center: initialCenter,
              duration: 500,
              easing: (t) => t * (2 - t) // easeOutQuad
            });
          }
        } else if (currentZoom > 4.5) {
          // When zoomed in, use more lenient bounds checking
          let needsCorrection = false;
          let newCenter = { ...currentCenter };
          
          // Add buffer to bounds (allow going slightly outside)
          const buffer = 2; // degrees
          
          // Check longitude bounds with buffer
          if (currentCenter.lng < initialBounds.getWest() - buffer) {
            newCenter.lng = initialBounds.getWest();
            needsCorrection = true;
          } else if (currentCenter.lng > initialBounds.getEast() + buffer) {
            newCenter.lng = initialBounds.getEast();
            needsCorrection = true;
          }
          
          // Check latitude bounds with buffer
          if (currentCenter.lat < initialBounds.getSouth() - buffer) {
            newCenter.lat = initialBounds.getSouth();
            needsCorrection = true;
          } else if (currentCenter.lat > initialBounds.getNorth() + buffer) {
            newCenter.lat = initialBounds.getNorth();
            needsCorrection = true;
          }
          
          // Smoothly pan back if out of bounds
          if (needsCorrection) {
            map.current.panTo(newCenter, { duration: 300 });
          }
        }
      });

      // Store initial bounds reference
      window.setInitialBounds = (bounds) => {
        initialBounds = bounds;
      };

      // Add navigation controls
      map.current.addControl(new maplibregl.NavigationControl({
        showCompass: false // Hide compass since rotation is disabled
      }), 'top-right');

      // Disable rotation on touch zoom (allow zoom, block rotation)
      map.current.touchZoomRotate.disableRotation();

      // Add resize listeners
      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', handleResize);
      
      // Handle visual viewport for mobile pinch-zoom
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleVisualViewportResize);
      }

      map.current.on('error', (e) => {
        console.error('❌ [MapView] Map error:', e);
        // Don't show error for minor tile loading issues
        if (e.error && !e.error.message.includes('tile')) {
          console.error('Critical map error:', e.error);
          setError('Map failed to load. Please refresh the page.');
        }
      });
    } catch (err) {
      console.error('❌ [MapView] Failed to initialize map:', err);
      setError('Failed to initialize map. Please refresh the page.');
    }

    return () => {
      // Clear debounce timers
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      if (visualViewportTimeout) {
        clearTimeout(visualViewportTimeout);
      }
      
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportResize);
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Fetch heatmap data and GeoJSON, then enrich (Task 2)
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log('📊 [MapView] Loading data...');

        // Fetch heatmap data from API
        const heatmapResponse = await getHeatmapData();
        console.log('🔍 Raw heatmap response:', heatmapResponse);
        const apiData = heatmapResponse.data || heatmapResponse;
        console.log(`✅ Loaded ${apiData.length} districts from API`);
        console.log('🔍 First 3 districts:', apiData.slice(0, 3));
        console.log('🔍 Women participation check:', apiData.filter(d => d.womenParticipationPercent !== null).slice(0, 5).map(d => `${d.districtName}: ${d.womenParticipationPercent}%`));

        // Load GeoJSON from public folder
        const geoResponse = await fetch('/india-districts.geojson');
        if (!geoResponse.ok) {
          console.error('GeoJSON fetch failed:', geoResponse.status, geoResponse.statusText);
          throw new Error(`Failed to load district GeoJSON: ${geoResponse.status}`);
        }
        const geoJSON = await geoResponse.json();
        console.log(`✅ Loaded GeoJSON with ${geoJSON.features.length} features`);
        
        // Validate GeoJSON structure
        if (!geoJSON.features || geoJSON.features.length === 0) {
          throw new Error('Invalid GeoJSON: No features found');
        }
        
        console.log('Sample feature:', geoJSON.features[0].properties);

        // Create comprehensive lookup map for performance data using perfect mapping
        const dataLookup = {};
        
        // Build reverse mapping: geoId -> API data
        const geoIdToApiMap = {};
        
        apiData.forEach(district => {
          // Create composite key for perfect mapping lookup (using : separator for v2)
          const compositeKey = `${normalizeDistrictName(district.stateName)}:${normalizeDistrictName(district.districtName)}`;
          const mapping = perfectMapping.mappings[compositeKey];
          
          // Debug Andaman districts
          if (district.districtName && (district.districtName.includes('Andaman') || district.districtName.includes('Nicobar'))) {
            console.log(`🔍 ANDAMAN DEBUG:`, {
              districtName: district.districtName,
              stateName: district.stateName,
              compositeKey: compositeKey,
              mappingFound: !!mapping,
              geoId: mapping?.geoId
            });
          }
          
          if (mapping && mapping.geoId) {
            // Map by geoId for perfect matching
            if (!geoIdToApiMap[mapping.geoId]) {
              geoIdToApiMap[mapping.geoId] = [];
            }
            geoIdToApiMap[mapping.geoId].push(district);
          }
          
          // Also add fallback lookup keys for backward compatibility
          const lookupKeys = createLookupKeys(district.districtName, district.stateName);
          lookupKeys.forEach(key => {
            if (!dataLookup[key]) {
              dataLookup[key] = district;
            }
          });
        });

        console.log(`📊 Perfect mapping: ${Object.keys(geoIdToApiMap).length} geoIds mapped`);
        console.log(`📊 Fallback lookup: ${Object.keys(dataLookup).length} keys for ${apiData.length} districts`);
        console.log(`📍 Sample lookup keys:`, Object.keys(dataLookup).slice(0, 15));
        console.log(`📍 Sample API data:`, apiData.slice(0, 3).map(d => `${d.districtName} (${d.stateName})`));
        
        // Debug: Check if createLookupKeys is working
        const testKeys = createLookupKeys('Pune', 'Maharashtra');
        console.log(`🧪 Test createLookupKeys('Pune', 'Maharashtra'):`, testKeys);
        console.log(`🧪 Is 'maharashtra:pune' in dataLookup?`, dataLookup['maharashtra:pune'] ? 'YES' : 'NO');

        // Enrich GeoJSON features with performance data using perfect mapping
        let perfectMatchCount = 0;
        let fallbackMatchCount = 0;
        let noMatchCount = 0;
        
        const enriched = {
          ...geoJSON,
          features: geoJSON.features.map(feature => {
            const props = feature.properties;
            // Handle different property naming conventions in GeoJSON
            const districtNameRaw = (props.District || props.district);
            const stateNameRaw = (props.STATE || props.st_nm);
            const geoId = props.dt_code || props.id;
            
            let perfData = null;
            
            // Strategy 1: Use perfect mapping via geoId
            // TEMPORARILY DISABLED: Manual fixes have wrong geoIds causing wrong data display
            // TODO: Regenerate perfect mapping with correct geoIds from GeoJSON
            // const apiDataArray = geoIdToApiMap[geoId];
            // if (apiDataArray && apiDataArray.length > 0) {
            //   perfData = apiDataArray[0]; // Use first match (should only be one)
            //   perfectMatchCount++;
            // }
            
            // Strategy 2: Use perfect mapping to find API key, then lookup data
            if (!perfData) {
              // First, try to find this GeoJSON district in the perfect mapping
              // The mapping structure is: "api-state:api-district" -> { geoDistrict, geoState, geoId }
              // We need to reverse lookup: find the key where geoDistrict matches our GeoJSON district
              
              let apiKey = null;
              const normalizedState = normalizeDistrictName(stateNameRaw);
              const normalizedDistrict = normalizeDistrictName(districtNameRaw);
              
              // Search through perfect mapping for a match
              for (const [key, value] of Object.entries(perfectMapping.mappings)) {
                if (value.geoDistrict === districtNameRaw && value.geoState === stateNameRaw) {
                  apiKey = key;
                  break;
                }
              }
              
              // Debug first 3 districts 
              if (noMatchCount + fallbackMatchCount + perfectMatchCount < 3) {
                console.log(`🔍 GeoJSON: "${districtNameRaw}" (${stateNameRaw})`);
                console.log(`   Normalized: "${normalizedState}:${normalizedDistrict}"`);
                console.log(`   API key from mapping: ${apiKey || 'NOT FOUND'}`);
                console.log(`   Data in lookup: ${apiKey && dataLookup[apiKey] ? '✓' : '✗'}`);
              }
              
              // If we found the API key, use it to lookup the data
              if (apiKey && dataLookup[apiKey]) {
                perfData = dataLookup[apiKey];
                fallbackMatchCount++;
              }
            }
            
            // Strategy 3: Fuzzy matching DISABLED to prevent wrong matches
            // The fuzzy matching was causing Kolkata to match with Soreng
            // Better to show no data than wrong data
            // if (!perfData) {
            //   const bestMatch = findBestMatch(districtNameRaw, stateNameRaw, 
            //     Object.keys(dataLookup).map(key => key.split(':').pop() || key)
            //   );
            //   if (bestMatch) {
            //     perfData = dataLookup[bestMatch] || dataLookup[normalizeDistrictName(bestMatch)];
            //     if (perfData) {
            //       fallbackMatchCount++;
            //     }
            //   }
            // }
            
            if (!perfData) {
              noMatchCount++;
            }

            return {
              ...feature,
              properties: {
                ...props,
                // Keep original GeoJSON properties (handle both naming conventions)
                district_name: districtNameRaw,
                state_name: stateNameRaw,
                dt_code: props.dt_code || props.id,
                st_code: props.st_code || props.State_LGD,
                // Add performance metrics (using camelCase from API)
                hasData: !!perfData,
                paymentPercentage: perfData?.paymentPercentage ?? null,
                averageDays: perfData?.averageDays ?? null,
                womenParticipationPercent: perfData?.womenParticipationPercent ?? null,
                totalHouseholds: perfData?.totalHouseholds ?? null,
                // Advanced metrics
                households100DaysPercent: perfData?.households100DaysPercent ?? null,
                scstParticipationPercent: perfData?.scstParticipationPercent ?? null,
                workCompletionPercent: perfData?.workCompletionPercent ?? null,
                averageWageRate: perfData?.averageWageRate ?? null,
                agricultureWorksPercent: perfData?.agricultureWorksPercent ?? null,
                month: perfData?.month ?? null,
                year: perfData?.finYear ?? null,
                // Store API district name for navigation
                apiDistrictName: perfData?.districtName ?? null,
                apiStateName: perfData?.stateName ?? null,
                // Debug info
                matchedWith: perfData ? `${perfData.districtName}, ${perfData.stateName}` : null
              }
            };
          })
        };

        const withData = enriched.features.filter(f => f.properties.hasData).length;
        const withoutData = enriched.features.filter(f => !f.properties.hasData);
        console.log(`📊 Enriched ${withData}/${enriched.features.length} features with data (${((withData/enriched.features.length)*100).toFixed(1)}% coverage)`);
        console.log(`🎯 Match statistics: Perfect=${perfectMatchCount}, Fallback=${fallbackMatchCount}, None=${noMatchCount}`);
        console.log(`📍 Sample enriched feature:`, enriched.features[0].properties);
        console.log(`✅ Districts WITH data:`, enriched.features.filter(f => f.properties.hasData).slice(0, 5).map(f => `${f.properties.district_name} → ${f.properties.matchedWith}`));
        console.log(`❌ Districts WITHOUT data:`, withoutData.slice(0, 10).map(f => {
          const props = f.properties;
          const districtName = props.district_name;
          const stateName = props.state_name;
          return `${districtName}, ${stateName}`;
        }));
        
        // Log specific problematic districts for debugging
        const problematicDistricts = withoutData.filter(f => {
          const name = f.properties.district_name?.toLowerCase();
          return name?.includes('parganas') || name?.includes('cooch') || name?.includes('koch');
        });
        if (problematicDistricts.length > 0) {
          console.log(`🔍 Problematic districts (should have data):`, problematicDistricts.map(f => 
            `${f.properties.district_name}, ${f.properties.state_name}`
          ));
        }

        // Store enriched data for property lookups
        enrichedDataRef.current = enriched;
        setEnrichedGeoJSON(enriched);
        setLoading(false);

        // Auto-detect user's location and navigate to their district
        tryAutoDetectLocation(geoJSON);
      } catch (err) {
        console.error('❌ Failed to load data:', err);
        setError('Failed to load district data. Please try again.');
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Add source and layers when map and data are ready (Task 4)
  useEffect(() => {
    if (!mapLoaded || !enrichedGeoJSON || !map.current) return;
    if (map.current.getSource('districts')) return; // Avoid re-adding

    console.log('🎨 [MapView] Adding source and layers...');

    map.current.addSource('districts', {
      type: 'geojson',
      data: enrichedGeoJSON,
      generateId: true // ESSENTIAL for feature-state interactions
    });

    if (map.current && enrichedGeoJSON.features.length > 0) {
      const bbox = turf.bbox(enrichedGeoJSON);
      const bounds = [
        [bbox[0], bbox[1]], // Southwest
        [bbox[2], bbox[3]]  // Northeast
      ];
      
      // Different padding for mobile/tablet vs desktop to show full map
      const isMobile = window.innerWidth <= 1024;
      
      // Force specific zoom and center for mobile/tablet to ensure full India is visible
      if (isMobile) {
        // Account for tutorial message at bottom - use less bottom padding when visible
        map.current.setZoom(3.0);
        map.current.setCenter([81.1825, 24.0276]); // Perfect position from user testing
      } else {
        map.current.fitBounds(bounds, {
          padding: 40,
          duration: 0,
          maxZoom: 4
        });
      }
      
      // Store initial bounds for constraint checking
      if (window.setInitialBounds) {
        window.setInitialBounds(map.current.getBounds());
      }
    }

    // Add heatmap fill layer with initial metric
    addHeatmapLayer(selectedMetric);

    // Placeholder districts to hide (new 2022 Chhattisgarh districts with only geometric placeholders)
    const PLACEHOLDER_DISTRICTS = [
      'khairagarh chhuikhadan gandai',
      'manendragarh chirmiri bharatpur',
      'mohla manpur ambagarh chowki',
      'sakti',
      'sarangarh bilaigarh'
    ];

    // Add India background (all districts combined) - lighter color
    map.current.addLayer({
      id: 'india-background',
      type: 'fill',
      source: 'districts',
      paint: {
        'fill-color': '#ffffff',
        'fill-opacity': [
          'case',
          // Hide placeholder districts
          ['in', ['downcase', ['coalesce', ['get', 'district_name'], ['get', 'district'], ['get', 'DISTRICT'], '']], ['literal', PLACEHOLDER_DISTRICTS]],
          0,  // Completely transparent for placeholders
          1   // Normal for real districts
        ]
      }
    }, 'district-heatmap'); // Add below heatmap layer

    // Add district borders - make them more visible
    map.current.addLayer({
      id: 'district-borders',
      type: 'line',
      source: 'districts',
      paint: {
        'line-color': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          '#1e293b',
          '#64748b'
        ],
        'line-width': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          2.5,
          0.8
        ],
        'line-opacity': [
          'case',
          // Hide borders for placeholder districts
          ['in', ['downcase', ['coalesce', ['get', 'district_name'], ['get', 'district'], ['get', 'DISTRICT'], '']], ['literal', PLACEHOLDER_DISTRICTS]],
          0,  // Invisible border for placeholders
          1   // Normal border for real districts
        ]
      }
    });

    // Add district labels (appear only when zoomed in)
    map.current.addLayer({
      id: 'district-labels',
      type: 'symbol',
      source: 'districts',
      minzoom: 5, // Labels appear at zoom level 5+ (changed from 6)
      filter: [
        '!',
        ['in', ['downcase', ['coalesce', ['get', 'district_name'], ['get', 'district'], ['get', 'DISTRICT'], '']], ['literal', PLACEHOLDER_DISTRICTS]]
      ],
      layout: {
        'text-field': ['get', 'district_name'], // Use the normalized property name
        'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
        'text-size': [
          'interpolate',
          ['linear'],
          ['zoom'],
          5, 10,  // Smaller text at zoom 5
          7, 12,  // Regular text at zoom 7
          9, 14   // Larger text at zoom 9
        ],
        'text-transform': 'uppercase',
        'text-letter-spacing': 0.05,
        'text-max-width': 8,
        'text-allow-overlap': false,
        'text-ignore-placement': false
      },
      paint: {
        'text-color': '#2c3e50',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1.5,
        'text-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          5, 0.6,  // More transparent at lower zoom
          7, 0.8,  // More opaque at higher zoom
          9, 1.0   // Fully opaque at high zoom
        ]
      }
    });

    console.log('✅ Layers added successfully');

    // Setup interactions (Task 7 & 8)
    setupInteractions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded, enrichedGeoJSON, selectedMetric]);

  // Helper function to add heatmap layer
  const addHeatmapLayer = (metric) => {
    const metricConfig = METRICS[metric];
    const metricKey = metricConfig.key;

    // Placeholder districts to hide (new 2022 Chhattisgarh districts with only geometric placeholders)
    const PLACEHOLDER_DISTRICTS = [
      'khairagarh chhuikhadan gandai',
      'manendragarh chirmiri bharatpur',
      'mohla manpur ambagarh chowki',
      'sakti',
      'sarangarh bilaigarh'
    ];

    map.current.addLayer({
      id: 'district-heatmap',
      type: 'fill',
      source: 'districts',
      paint: {
        'fill-color': [
          'case',
          // Check if district has no data at all (null value, but NOT 0)
          // Use typeof to distinguish null from 0
          ['==', ['typeof', ['get', metricKey]], 'null'],
          '#bdbdbd', // Gray for no data
          // Otherwise use color scale (includes 0 values which will be red)
          [
            'interpolate',
            ['linear'],
            ['get', metricKey],
            ...metricConfig.colorStops
          ]
        ],
        'fill-opacity': [
          'case',
          // Hide placeholder districts completely
          ['in', ['downcase', ['coalesce', ['get', 'district_name'], ['get', 'district'], ['get', 'DISTRICT'], '']], ['literal', PLACEHOLDER_DISTRICTS]],
          0,  // Completely transparent for placeholders
          [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.9,
            0.7
          ]
        ]
      }
    });
  };

  // Update map colors when metric changes (Task 5)
  const updateMapColors = useCallback((newMetric) => {
    if (!map.current || !map.current.getLayer('district-heatmap')) return;

    const metricConfig = METRICS[newMetric];
    const metricKey = metricConfig.key;

    console.log(`🎨 Updating colors for metric: ${newMetric}`);

    map.current.setPaintProperty('district-heatmap', 'fill-color', [
      'case',
      // Check if district has no data at all (null value, but NOT 0)
      // Use typeof to distinguish null from 0
      ['==', ['typeof', ['get', metricKey]], 'null'],
      '#bdbdbd', // Gray for no data
      // Otherwise use color scale (includes 0 values which will be red)
      [
        'interpolate',
        ['linear'],
        ['get', metricKey],
        ...metricConfig.colorStops
      ]
    ]);
  }, []);

  // Handle metric selection change
  const handleMetricChange = (newMetric) => {
    console.log(`📊 Metric changed to: ${newMetric}`);
    setSelectedMetric(newMetric);
    selectedMetricRef.current = newMetric; // Update ref immediately
    updateMapColors(newMetric);
  };

  // Setup hover and click interactions (Task 7 & 8)
  const setupInteractions = () => {
    if (!map.current) return;

    // Track touch/drag state to prevent accidental clicks during zoom/pan
    let touchStartPos = null;
    let isDragging = false;
    let isZooming = false;
    let zoomEndTimeout = null;
    const CLICK_THRESHOLD = 10; // pixels - if moved more than this, it's not a click

    // Track zoom start
    map.current.on('zoomstart', () => {
      isZooming = true;
      console.log('🔍 Zoom started');
    });

    // Track zoom end with delay
    map.current.on('zoomend', () => {
      console.log('🔍 Zoom ended');
      // Keep isZooming true for a bit longer to catch late click events
      if (zoomEndTimeout) {
        clearTimeout(zoomEndTimeout);
      }
      zoomEndTimeout = setTimeout(() => {
        isZooming = false;
        console.log('🔍 Zoom fully completed');
      }, 300); // 300ms delay after zoom ends
    });

    // Track touch start position
    map.current.on('touchstart', (e) => {
      if (e.originalEvent.touches.length > 1) {
        // Multi-touch = zooming
        isZooming = true;
        touchStartPos = null;
        console.log('👆 Multi-touch detected (zooming)');
      } else {
        touchStartPos = {
          x: e.originalEvent.touches[0].clientX,
          y: e.originalEvent.touches[0].clientY
        };
      }
      isDragging = false;
    });

    // Track if user is dragging
    map.current.on('touchmove', (e) => {
      if (e.originalEvent.touches.length > 1) {
        isZooming = true;
        return;
      }
      
      if (touchStartPos && e.originalEvent.touches.length === 1) {
        const currentPos = {
          x: e.originalEvent.touches[0].clientX,
          y: e.originalEvent.touches[0].clientY
        };
        const distance = Math.sqrt(
          Math.pow(currentPos.x - touchStartPos.x, 2) +
          Math.pow(currentPos.y - touchStartPos.y, 2)
        );
        
        if (distance > CLICK_THRESHOLD) {
          isDragging = true;
        }
      }
    });

    // Reset on touch end
    map.current.on('touchend', () => {
      // Keep isDragging/isZooming state briefly to block the click event
      setTimeout(() => {
        isDragging = false;
        touchStartPos = null;
      }, 150);
      // Note: isZooming is now handled by zoomend event
    });

    // Track mouse drag for desktop
    let mouseDownPos = null;
    
    map.current.on('mousedown', (e) => {
      mouseDownPos = { x: e.point.x, y: e.point.y };
      isDragging = false;
    });

    map.current.on('mousemove', (e) => {
      if (mouseDownPos) {
        const distance = Math.sqrt(
          Math.pow(e.point.x - mouseDownPos.x, 2) +
          Math.pow(e.point.y - mouseDownPos.y, 2)
        );
        if (distance > CLICK_THRESHOLD) {
          isDragging = true;
        }
      }
    });

    map.current.on('mouseup', () => {
      setTimeout(() => {
        mouseDownPos = null;
        isDragging = false;
      }, 50);
    });

    // Remove existing event listeners to prevent duplicates
    map.current.off('mousemove', 'district-heatmap');
    map.current.off('mouseleave', 'district-heatmap');
    map.current.off('click', 'district-heatmap');

    // Hover effect
    map.current.on('mousemove', 'district-heatmap', (e) => {
      if (e.features.length === 0) return;

      const feature = e.features[0];
      const featureId = feature.id;

      // Update hover state
      if (hoveredDistrictId.current !== null && hoveredDistrictId.current !== featureId) {
        map.current.setFeatureState(
          { source: 'districts', id: hoveredDistrictId.current },
          { hover: false }
        );
      }

      hoveredDistrictId.current = featureId;
      map.current.setFeatureState(
        { source: 'districts', id: hoveredDistrictId.current },
        { hover: true }
      );

      // Get properties from rendered feature
      const props = feature.properties;
      
      // Look up full properties from enriched data if available
      let fullProps = props;
      if (enrichedDataRef.current && featureId !== undefined) {
        const matchedFeature = enrichedDataRef.current.features.find(f => 
          f.properties.dt_code === props.dt_code || 
          f.properties.id === props.id ||
          ((f.properties.District || f.properties.district) === (props.District || props.district) && 
           (f.properties.STATE || f.properties.st_nm) === (props.STATE || props.st_nm))
        );
        if (matchedFeature) {
          fullProps = matchedFeature.properties;
        }
      }
      
      const metricConfig = METRICS[selectedMetricRef.current];
      const metricValue = fullProps[metricConfig.key];

      // Get district and state names, handling both naming conventions
      const districtName = fullProps.district_name || fullProps.District || fullProps.district;
      const stateName = fullProps.state_name || fullProps.STATE || fullProps.st_nm;
      
      console.log('Hover - District:', districtName, 'State:', stateName);

      setTooltip({
        show: true,
        x: e.point.x,
        y: e.point.y,
        data: {
          districtName: districtName,
          stateName: stateName,
          currentMetricKey: metricConfig.titleKey, // Pass translation key instead of title
          currentValue: metricValue !== null && metricValue !== undefined 
            ? metricConfig.format(Math.min(100, metricValue)) // Cap display at 100
            : 'No data',
          hasData: fullProps.hasData,
          // All 3 primary metrics
          paymentPercentage: fullProps.paymentPercentage,
          averageDays: fullProps.averageDays,
          womenParticipationPercent: fullProps.womenParticipationPercent
        }
      });

      // Only show pointer cursor for districts with data
      map.current.getCanvas().style.cursor = fullProps.hasData ? 'pointer' : 'default';
    });

    map.current.on('mouseleave', 'district-heatmap', () => {
      if (hoveredDistrictId.current !== null) {
        map.current.setFeatureState(
          { source: 'districts', id: hoveredDistrictId.current },
          { hover: false }
        );
      }
      hoveredDistrictId.current = null;
      setTooltip({ show: false, x: 0, y: 0, data: null });
      map.current.getCanvas().style.cursor = '';
    });

    // Click to navigate
    map.current.on('click', 'district-heatmap', (e) => {
      // Prevent navigation if user was dragging/zooming
      if (isDragging || isZooming) {
        console.log('🚫 Click blocked - user was dragging/zooming');
        return;
      }

      if (e.features.length === 0) return;

      const feature = e.features[0];
      const props = feature.properties;
      
      // Look up full properties from enriched data
      let fullProps = props;
      if (enrichedDataRef.current && feature.id !== undefined) {
        const matchedFeature = enrichedDataRef.current.features.find(f => 
          f.properties.dt_code === props.dt_code || 
          f.properties.id === props.id ||
          ((f.properties.District || f.properties.district) === (props.District || props.district) && 
           (f.properties.STATE || f.properties.st_nm) === (props.STATE || props.st_nm))
        );
        if (matchedFeature) {
          fullProps = matchedFeature.properties;
        }
      }
      
      // Only navigate if district has API data
      if (!fullProps.hasData || !fullProps.apiDistrictName) {
        console.log(`⚠️ District has no data, not navigating`);
        return;
      }
      
      // Use API district name for navigation (not GeoJSON name)
      const districtName = fullProps.apiDistrictName;

      if (districtName) {
        console.log(`📍 Navigating to: ${districtName}`);
        navigate(`/district/${encodeURIComponent(districtName)}`);
      }
    });
  };

  const { t } = useTranslation();
  
  // Get translated metrics for display (titles and units)
  const translatedMetrics = useMemo(() => {
    return Object.keys(METRICS).reduce((acc, key) => {
      const metric = METRICS[key];
      acc[key] = {
        ...metric,
        title: t(metric.titleKey),
        // Translate units if they contain 'days'
        unit: metric.unit.includes('days') ? ` ${t('common.days')}` : metric.unit,
        // Update format function for days
        format: key === 'averageDays' 
          ? (val) => `${Math.round(val)} ${t('common.days')}`
          : metric.format
      };
      return acc;
    }, {});
  }, [t]);

  // Prepare legend data for mobile bottom sheet
  const currentLegendData = useMemo(() => {
    const metricConfig = translatedMetrics[selectedMetric];
    if (!metricConfig) return null;

    const colorStops = metricConfig.colorStops;
    const items = [];
    
    // Create legend items from color stops
    for (let i = 0; i < colorStops.length; i += 2) {
      if (i + 1 < colorStops.length) {
        const value = colorStops[i];
        const color = colorStops[i + 1];
        items.push({
          color: color,
          label: metricConfig.format ? metricConfig.format(value) : `${value}${metricConfig.unit || ''}`
        });
      }
    }

    return {
      title: metricConfig.title,
      items: items
    };
  }, [selectedMetric, translatedMetrics]);

  return (
    <div className="map-wrapper">
      {loading && <LoadingOverlay message={t('map.loadingData')} />}
      {error && (
        <div className="map-error">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Reload</button>
        </div>
      )}
      
      {showLocationPrompt && <LocationPrompt onDismiss={handleDismissLocationPrompt} />}
      
      <Logo />
      <LanguageSwitcher />
      <SearchBar onSelectDistrict={(districtName) => navigate(`/district/${encodeURIComponent(districtName)}`)} />
      
      <div ref={mapContainer} className="map-container" />
      
      {mapLoaded && enrichedGeoJSON && (
        <>
          <MetricSelector 
            selectedMetric={selectedMetric} 
            onChange={handleMetricChange}
            metrics={translatedMetrics}
            onAdvancedToggle={setShowAdvancedMetrics}
          />
          {!showAdvancedMetrics && (
            <Legend 
              selectedMetric={selectedMetric}
              metricConfig={translatedMetrics[selectedMetric]}
            />
          )}
          <Tooltip {...tooltip} />
          
          {/* Mobile Bottom Sheet - only shows on mobile */}
          <MobileBottomSheet
            selectedMetric={selectedMetric}
            onChange={handleMetricChange}
            metrics={translatedMetrics}
            currentLegend={currentLegendData}
          />
        </>
      )}
    </div>
  );
};

export default MapView;
