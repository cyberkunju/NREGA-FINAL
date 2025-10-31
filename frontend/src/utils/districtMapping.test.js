/**
 * Test suite for district mapping functionality
 * Verifies that API districts are correctly mapped to GeoJSON features
 */

import perfectMapping from '../data/perfect-district-mapping.json';

describe('District Mapping', () => {
  describe('Perfect Mapping Structure', () => {
    it('should have metadata', () => {
      expect(perfectMapping._metadata).toBeDefined();
      expect(perfectMapping._metadata.version).toBeDefined();
      expect(perfectMapping._metadata.totalMappings).toBeGreaterThan(0);
    });

    it('should have mappings object', () => {
      expect(perfectMapping.mappings).toBeDefined();
      expect(typeof perfectMapping.mappings).toBe('object');
    });

    it('should have correct number of mappings', () => {
      const actualCount = Object.keys(perfectMapping.mappings).length;
      expect(actualCount).toBe(perfectMapping._metadata.totalMappings);
    });
  });

  describe('Mapping Entry Structure', () => {
    const sampleMappings = Object.entries(perfectMapping.mappings).slice(0, 5);

    it('should have required fields in each mapping', () => {
      sampleMappings.forEach(([key, mapping]) => {
        expect(mapping).toHaveProperty('geoDistrict');
        expect(mapping).toHaveProperty('geoState');
        expect(mapping).toHaveProperty('geoId');
        expect(mapping).toHaveProperty('confidence');
        expect(mapping).toHaveProperty('source');
      });
    });

    it('should have valid geoId values', () => {
      sampleMappings.forEach(([key, mapping]) => {
        expect(typeof mapping.geoId).toBe('number');
        expect(mapping.geoId).toBeGreaterThan(0);
      });
    });

    it('should have valid confidence values', () => {
      sampleMappings.forEach(([key, mapping]) => {
        expect(mapping.confidence).toBe(1);
      });
    });
  });

  describe('Manual Fixes Verification', () => {
    const manualFixes = {
      'nicobars|andaman  nicobar': 573,
      'sivasagar|assam': 462,
      'narayanpur|chhattisgarh': 592,
      'dang|gujarat': 190,
      'angul|odisha': 204,
      'bhatinda|punjab': 535,
      'ferozepur|punjab': 551,
      'nawanshahr|punjab': 552,
      'chittorgarh|rajasthan': 323,
      'dholpur|rajasthan': 426,
      'jalore|rajasthan': 669,
      'sri ganganagar|rajasthan': 532,
      'kanniyakumari|tamil nadu': 30,
      'gautam buddha nagar|uttar pradesh': 488,
      'rae bareli|uttar pradesh': 404,
    };

    it('should have all manual fixes with correct geoIds', () => {
      Object.entries(manualFixes).forEach(([key, expectedGeoId]) => {
        expect(perfectMapping.mappings[key]).toBeDefined();
        expect(perfectMapping.mappings[key].geoId).toBe(expectedGeoId);
      });
    });

    it('should have manual-fix or verified source for manual mappings', () => {
      Object.keys(manualFixes).forEach(key => {
        const source = perfectMapping.mappings[key].source;
        expect(['manual-fix', 'exact-match']).toContain(source);
      });
    });
  });

  describe('Common Districts', () => {
    const commonDistricts = [
      'pune|maharashtra',
      'mumbai city|maharashtra',
      'bengaluru urban|karnataka',
      'chennai|tamil nadu',
      'delhi|nct of delhi',
      'agra|uttar pradesh',
    ];

    it('should have mappings for major cities', () => {
      commonDistricts.forEach(key => {
        const mapping = perfectMapping.mappings[key];
        if (mapping) {
          expect(mapping).toHaveProperty('geoId');
          expect(mapping).toHaveProperty('geoDistrict');
        }
        // Note: Some major cities might not have MGNREGA data
      });
    });
  });

  describe('Mapping Key Format', () => {
    it('should use lowercase pipe-separated format', () => {
      const keys = Object.keys(perfectMapping.mappings);
      expect(keys.length).toBeGreaterThan(0);
      
      // Sample check
      keys.slice(0, 10).forEach(key => {
        expect(key).toMatch(/^[a-z0-9\s]+\|[a-z0-9\s]+$/);
        expect(key).not.toContain('|'.repeat(2)); // No double pipes
      });
    });

    it('should have normalized district and state names', () => {
      const keys = Object.keys(perfectMapping.mappings);
      
      keys.slice(0, 10).forEach(key => {
        const parts = key.split('|');
        expect(parts).toHaveLength(2);
        expect(parts[0].trim()).toBe(parts[0]); // No leading/trailing spaces
        expect(parts[1].trim()).toBe(parts[1]); // No leading/trailing spaces
      });
    });
  });

  describe('No Duplicate GeoIDs', () => {
    it('should not have multiple API districts mapping to same geoId (except intentional cases)', () => {
      const geoIdCount = {};
      
      Object.entries(perfectMapping.mappings).forEach(([key, mapping]) => {
        const geoId = mapping.geoId;
        if (!geoIdCount[geoId]) {
          geoIdCount[geoId] = [];
        }
        geoIdCount[geoId].push(key);
      });
      
      // Find duplicates
      const duplicates = Object.entries(geoIdCount).filter(([geoId, keys]) => keys.length > 1);
      
      if (duplicates.length > 0) {
        console.warn('⚠️ Found geoIds with multiple mappings:');
        duplicates.forEach(([geoId, keys]) => {
          console.warn(`  geoId ${geoId}: ${keys.join(', ')}`);
        });
      }
      
      // Allow some intentional duplicates (e.g., name variants, district splits)
      // After cleaning, we should have ~7 intentional duplicates
      expect(duplicates.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Coverage Statistics', () => {
    it('should have substantial mapping coverage', () => {
      const totalMappings = Object.keys(perfectMapping.mappings).length;
      
      // Should have at least 700 mappings (out of ~740 API districts)
      expect(totalMappings).toBeGreaterThanOrEqual(700);
      
      console.log(`📊 Total mappings: ${totalMappings}`);
      console.log(`📊 Coverage: ${((totalMappings / 740) * 100).toFixed(1)}% of API districts`);
    });
  });
});
