/**
 * Districts API Route Handler
 * Endpoint: GET /api/districts
 * Returns list of all district names with 24-hour caching
 */

const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// In-memory cache for district list
let districtCache = {
  data: null,
  timestamp: null,
  ttl: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
};

/**
 * Check if cache is valid
 * @returns {boolean} True if cache is valid
 */
function isCacheValid() {
  if (!districtCache.data || !districtCache.timestamp) {
    return false;
  }
  
  const now = Date.now();
  const age = now - districtCache.timestamp;
  
  return age < districtCache.ttl;
}

/**
 * GET /api/districts
 * Returns array of district names
 * 
 * Response format:
 * {
 *   "districts": ["Agra", "Aligarh", ...]
 * }
 */
router.get('/', async (req, res, next) => {
  try {
    // Check cache first
    if (isCacheValid()) {
      console.log('Returning districts from cache');
      return res.json(districtCache.data);
    }
    
    // Cache miss or expired - fetch from database
    console.log('Fetching districts from database');
    
    const query = `
      SELECT name 
      FROM districts 
      ORDER BY name ASC
    `;
    
    const result = await db.query(query);
    
    // Extract district names from result
    const districts = result.rows.map(row => row.name);
    
    // Prepare response
    const response = {
      districts: districts,
    };
    
    // Update cache
    districtCache.data = response;
    districtCache.timestamp = Date.now();
    
    console.log(`Fetched ${districts.length} districts from database`);
    
    // Set cache headers for client-side caching
    res.set({
      'Cache-Control': 'public, max-age=86400', // 24 hours
      'Expires': new Date(Date.now() + 86400000).toUTCString(),
    });
    
    res.json(response);
    
  } catch (error) {
    console.error('Error fetching districts:', error);
    
    // Check if it's a database connection error
    if (error.code && error.code.startsWith('08')) {
      return res.status(503).json({
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'Unable to fetch districts. Please try again later.',
        },
      });
    }
    
    // Pass other errors to global error handler
    next(error);
  }
});

module.exports = router;
