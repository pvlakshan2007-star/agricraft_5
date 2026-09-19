/**
 * AGRI CRAFT-AI - Market Price Service (marketPriceService.js)
 * 
 * Provides database querying and filtering for daily Mandi market rates.
 * Extensible for integration with official Agmarknet / e-NAM REST APIs.
 */

const db = require('../config/db');

/**
 * Fetch market prices with optional filtering by crop or location
 */
async function getMarketPrices(filters = {}) {
  let sql = `
    SELECT id, crop_name, market_name, location, price, unit, price_date, source, created_at
    FROM market_prices
    WHERE 1=1
  `;
  const params = [];

  if (filters.crop) {
    params.push(`%${filters.crop}%`);
    sql += ` AND LOWER(crop_name) LIKE LOWER($${params.length})`;
  }

  if (filters.location) {
    params.push(`%${filters.location}%`);
    sql += ` AND LOWER(location) LIKE LOWER($${params.length})`;
  }

  sql += ` ORDER BY price_date DESC, crop_name ASC LIMIT 100`;

  const result = await db.query(sql, params);
  return result.rows;
}

/**
 * Record a new market price entry (parameterized query)
 */
async function addMarketPrice(data) {
  const sql = `
    INSERT INTO market_prices (crop_name, market_name, location, price, unit, price_date, source)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, crop_name, market_name, location, price, unit, price_date, source, created_at
  `;
  const params = [
    data.crop_name,
    data.market_name,
    data.location || 'Tamil Nadu',
    data.price,
    data.unit || 'Quintal',
    data.price_date || new Date().toISOString().split('T')[0],
    data.source || 'Agmarknet / Government of India'
  ];

  const result = await db.query(sql, params);
  return result.rows[0];
}

module.exports = {
  getMarketPrices,
  addMarketPrice
};
