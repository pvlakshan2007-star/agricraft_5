/**
 * AGRI CRAFT-AI - MarketPrice Model (MarketPrice.js)
 * Data access abstraction for the 'market_prices' table.
 */

const db = require('../config/db');

class MarketPrice {
  static async findAll(filters = {}) {
    let sql = `SELECT id, crop_name, market_name, location, price, unit, price_date, source, created_at FROM market_prices WHERE 1=1`;
    const params = [];
    if (filters.crop) {
      params.push(`%${filters.crop}%`);
      sql += ` AND LOWER(crop_name) LIKE LOWER($${params.length})`;
    }
    if (filters.location) {
      params.push(`%${filters.location}%`);
      sql += ` AND LOWER(location) LIKE LOWER($${params.length})`;
    }
    sql += ` ORDER BY price_date DESC LIMIT 100`;
    const res = await db.query(sql, params);
    return res.rows;
  }

  static async create({ crop_name, market_name, location, price, unit, price_date, source }) {
    const res = await db.query(
      `INSERT INTO market_prices (crop_name, market_name, location, price, unit, price_date, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, crop_name, market_name, location, price, unit, price_date, source, created_at`,
      [crop_name, market_name, location, price, unit, price_date, source]
    );
    return res.rows[0];
  }
}

module.exports = MarketPrice;
