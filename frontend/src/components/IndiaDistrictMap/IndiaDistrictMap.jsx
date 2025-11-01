import React, { useRef, useEffect, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';
import { getMapboxColorExpression, getDataStatistics } from '../../utils/colorScales';
import { enrichGeoJSONWithPerformance } from '../../utils/districtMapping';
import Legend from './Legend';
import Tooltip from './Tooltip';
import LoadingOverlay from './LoadingOverlay';
import './IndiaDistrictMap.css';

const IndiaDistrictMap = ({ 
  districtPerformance = {},
  metric = 'paymentPercentage',
  onDistrictClick,
  loading = false,
  palette = 'custom'
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, data: null });
  const [dataStats, setDataStats] = useState(null);
  const hoveredDistrictId = useRef(null);
  const geoJsonData = useRef(null);
  const enrichedGeoJsonData = useRef(null); // Store enriched data for lookups

  useEffect(() => {
    if (map.current) return;

    console.log('🗺️ [IndiaDistrictMap] Initializing MapLibre GL...');

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        name: 'India MGNREGA Map',
        sources: {
          'openfreemap': {
            type: 'raster',
            tiles: ['https://tiles.openfreemap.org/styles/bright/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenFreeMap contributors'
          }
        },
        layers: [
          {
            id: 'background',
            type: 'background',
            paint: { 'background-color': '#f8f9fa' }
          },
          {
            id: 'base-tiles',
            type: 'raster',
            source: 'openfreemap',
            paint: { 'raster-opacity': 0.4 }
          }
        ]
      },
      center: [78.9629, 20.5937],
      zoom: 4,
      minZoom: 3,
      maxZoom: 8,
      maxBounds: [[65, 5], [100, 38]],
      attributionControl: true
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.current.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    map.current.on('load', () => {
      console.log('✅ [IndiaDistrictMap] Map loaded successfully');
      setMapLoaded(true);
      loadDistrictData();
    });

    map.current.on('error', (e) => {
      console.error('❌ [IndiaDistrictMap] Map error:', e.error);
    });

    const loadTimeout = setTimeout(() => {
      if (!map.current || !map.current.loaded()) {
        console.error('⏱️ [IndiaDistrictMap] Map failed to load within 10 seconds');
      }
    }, 10000);

    return () => {
      clearTimeout(loadTimeout);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapLoaded || !map.current || !geoJsonData.current) return;
    
    const perfKeys = Object.keys(districtPerformance).length;
    console.log(`[IndiaDistrictMap] districtPerformance updated: ${perfKeys} districts`);
    
    if (perfKeys === 0) {
      console.log('[IndiaDistrictMap] Waiting for performance data...');
      return;
    }
    
    updateMapWithPerformanceData();
  }, [districtPerformance, mapLoaded]);

  const updateMapWithPerformanceData = () => {
    if (!map.current || !geoJsonData.current) return;

    const enrichedData = enrichGeoJSONWithPerformance(geoJsonData.current, districtPerformance);
    const stats = getDataStatistics(enrichedData);
    setDataStats(stats);
    
    const source = map.current.getSource('districts');
    if (source) {
      source.setData(enrichedData);
    }
  };

  const loadDistrictData = useCallback(async () => {
    try {
      const response = await fetch('/india-districts.geojson');
      if (!response.ok) throw new Error(`Failed to load district data: ${response.status}`);
      
      const geojson = await response.json();
      console.log('📍 [GeoJSON] First feature properties:', JSON.stringify(geojson.features[0].properties, null, 2));
      geoJsonData.current = geojson;
      
      const enrichedData = enrichGeoJSONWithPerformance(geojson, districtPerformance);
      const stats = getDataStatistics(enrichedData);
      setDataStats(stats);
      
      // Store enriched data for property lookups
      enrichedGeoJsonData.current = enrichedData;
      
      console.log('📊 [Enriched] First feature properties:', JSON.stringify(enrichedData.features[0].properties, null, 2));
      console.log('📊 Stats:', { withData: stats.districtsWithData, total: enrichedData.features.length });

      map.current.addSource('districts', {
        type: 'geojson',
        data: enrichedData,
        promoteId: 'dt_code' // Use dt_code as feature ID
      });

      const minValue = stats.minValue || 0;
      const maxValue = stats.maxValue || 100;
      const colorExpression = getMapboxColorExpression(minValue, maxValue, 'value', palette);

      map.current.addLayer({
        id: 'district-fills',
        type: 'fill',
        source: 'districts',
        filter: ['has', 'dt_code'], // This forces dt_code to be included in rendered features
        paint: {
          'fill-color': ['case', ['==', ['get', 'hasData'], true], colorExpression, '#bdbdbd'],
          'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.9, 0.7]
        }
      });

      map.current.addLayer({
        id: 'district-borders',
        type: 'line',
        source: 'districts',
        paint: {
          'line-color': ['case', ['boolean', ['feature-state', 'hover'], false], '#000000', '#ffffff'],
          'line-width': ['case', ['boolean', ['feature-state', 'hover'], false], 3, 1],
          'line-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 1, 0.8]
        }
      });

      // Add district name labels (show when zoomed in)
      map.current.addLayer({
        id: 'district-labels',
        type: 'symbol',
        source: 'districts',
        layout: {
          'text-field': ['coalesce', ['get', 'District'], ['get', 'district'], ['get', 'DISTRICT'], ''],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            4, 0,      // Hidden at zoom level 4
            5, 10,     // Start showing at zoom level 5
            8, 14      // Larger at zoom level 8
          ],
          'text-anchor': 'center',
          'text-allow-overlap': false,
          'text-ignore-placement': false
        },
        paint: {
          'text-color': '#2c3e50',
          'text-halo-color': '#ffffff',
          'text-halo-width': 2,
          'text-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            4, 0,    // Invisible at zoom 4
            5, 0.7,  // Fade in at zoom 5
            8, 1     // Full opacity at zoom 8
          ]
        }
      });

      setupInteractions();
      animateEntrance();
      
      // DEBUG: Test if enriched properties are in the source
      setTimeout(() => {
        const source = map.current.getSource('districts');
        if (source && source._data) {
          console.log('🔍 Source data check - first feature:', source._data.features[0].properties);
        }
        
        // Test querySourceFeatures
        const features = map.current.querySourceFeatures('districts', { sourceLayer: null });
        if (features && features.length > 0) {
          console.log('🔍 querySourceFeatures - first feature props:', features[0].properties);
        }
      }, 1000);
    } catch (error) {
      console.error('❌ [loadDistrictData] Failed:', error);
    }
  }, []);

  const setupInteractions = () => {
    map.current.on('mousemove', 'district-fills', (e) => {
      if (e.features.length > 0) {
        const feature = e.features[0];
        const featureId = feature.id; // This is dt_code

        // Use queryRenderedFeatures to get a more reliable property set
        const queryResult = map.current.queryRenderedFeatures(e.point, { layers: ['district-fills'] });
        const renderedProps = (queryResult.length > 0) ? queryResult[0].properties : feature.properties;

        // Extract district and state from rendered properties
        const districtName = renderedProps.District || renderedProps.district || renderedProps.DISTRICT;
        const stateName = renderedProps.STATE || renderedProps.state || renderedProps.st_nm;
        
        console.log('--- HOVER EVENT ---');
        console.log('Feature ID (dt_code):', featureId);
        console.log('Rendered Props:', renderedProps);
        console.log('Extracted District Name:', districtName);
        console.log('Extracted State Name:', stateName);
        console.log('-------------------');
        
        // Look up enriched performance data from our stored ref
        let fullProps = { ...renderedProps };
        if (enrichedGeoJsonData.current && featureId) {
          const matchedFeature = enrichedGeoJsonData.current.features.find(f => 
            f.properties.dt_code === featureId
          );
          if (matchedFeature) {
            fullProps = { ...fullProps, ...matchedFeature.properties };
            console.log('[HOVER] Found enriched data for', districtName);
          } else {
            console.log('[HOVER] No enriched data found for', districtName);
          }
        }
        
        if (hoveredDistrictId.current !== null && hoveredDistrictId.current !== featureId) {
          map.current.setFeatureState({ source: 'districts', id: hoveredDistrictId.current }, { hover: false });
        }

        if (featureId) {
          hoveredDistrictId.current = featureId;
          map.current.setFeatureState({ source: 'districts', id: hoveredDistrictId.current }, { hover: true });
        }
        
        setTooltip({
          show: true,
          x: e.point.x,
          y: e.point.y,
          data: {
            districtName: districtName, // Use the directly extracted name
            stateName: stateName,       // Use the directly extracted name
            hasData: fullProps.hasData,
            metric: 'Payment Timeliness',
            value: fullProps.hasData ? `${fullProps.paymentPercentage?.toFixed(1)}%` : 'No data',
            paymentPercentage: fullProps.paymentPercentage,
            households: fullProps.households,
            averageDays: fullProps.averageDays
          }
        });

        map.current.getCanvas().style.cursor = 'pointer';
      }
    });

    map.current.on('mouseleave', 'district-fills', () => {
      if (hoveredDistrictId.current !== null) {
        map.current.setFeatureState({ source: 'districts', id: hoveredDistrictId.current }, { hover: false });
      }
      hoveredDistrictId.current = null;
      setTooltip({ show: false, x: 0, y: 0, data: null });
      map.current.getCanvas().style.cursor = '';
    });

    map.current.on('click', 'district-fills', (e) => {
      if (e.features.length > 0) {
        const feature = e.features[0];
        
        // Get the feature ID (which is dt_code due to promoteId setting)
        const featureId = feature.id;
        const renderedProps = feature.properties;
        
        // Look up full properties from stored enriched data using dt_code
        let fullProps = renderedProps;
        if (enrichedGeoJsonData.current && featureId) {
          const matchedFeature = enrichedGeoJsonData.current.features.find(f => 
            f.properties.dt_code === featureId
          );
          if (matchedFeature) {
            fullProps = matchedFeature.properties;
          }
        }
        
        console.log('🖱️ CLICK - Feature ID (dt_code):', featureId);
        console.log('🖱️ CLICK - Full props from enriched data:', fullProps);
        
        // Use complete properties from enriched data
        const districtName = fullProps.districtName || fullProps.district;
        const stateName = fullProps.stateName || fullProps.st_nm;

        console.log('🖱️ Navigating with:', { districtName, stateName });

        if (onDistrictClick && districtName) {
          console.log('📍 Navigating to district:', districtName);
          onDistrictClick({
            name: districtName,
            state: stateName,
            data: fullProps.performance || null // Already an object, no need to parse
          });
        } else {
          console.error('❌ Cannot navigate - missing district name or handler');
        }

        // Zoom to district bounds
        if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
          const bbox = turf.bbox(feature);
          map.current.fitBounds(bbox, { padding: 100, duration: 1000 });
        }
      }
    });
  };

  const animateEntrance = () => {
    map.current.setPaintProperty('district-fills', 'fill-opacity', 0);
    setTimeout(() => {
      map.current.easeTo({ duration: 1500, easing: (t) => t * (2 - t) });
      map.current.setPaintProperty('district-fills', 'fill-opacity', 0.7);
    }, 300);
  };

  return (
    <div className="india-district-map-container">
      {loading && <LoadingOverlay message="Loading district data..." />}
      <div ref={mapContainer} className="map-container" />
      {mapLoaded && dataStats && (
        <>
          <Legend minValue={dataStats.minValue} maxValue={dataStats.maxValue} title="Payment Performance" palette={palette} />
          <Tooltip show={tooltip.show} x={tooltip.x} y={tooltip.y} data={tooltip.data} />
          <div className="map-stats">
            <h4 className="map-stats-title">Data Coverage</h4>
            <div className="map-stats-item">
              <span className="map-stats-label">Total Districts:</span>
              <span className="map-stats-value">{dataStats.total}</span>
            </div>
            <div className="map-stats-item">
              <span className="map-stats-label">With Data:</span>
              <span className="map-stats-value">{dataStats.withData}</span>
            </div>
            <div className="map-stats-item">
              <span className="map-stats-label">Coverage:</span>
              <span className="map-stats-value">
                {dataStats.total > 0 ? `${((dataStats.withData / dataStats.total) * 100).toFixed(1)}%` : '0%'}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default IndiaDistrictMap;
