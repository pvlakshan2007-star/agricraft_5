/**
 * AGRI CRAFT-AI - Crop Model (Crop.js)
 * Data access abstraction for the 'crops' table.
 */

const db = require('../config/db');

class Crop {
  static async findByFarmerId(farmerId) {
    const res = await db.query(
      `SELECT id, farmer_id, crop_name, season, area, sowing_date, expected_harvest_date, created_at
       FROM crops WHERE farmer_id = $1 ORDER BY created_at DESC`,
      [farmerId]
    );
    return res.rows;
  }

  static async create({ farmer_id, crop_name, season, area, sowing_date, expected_harvest_date }) {
    const res = await db.query(
      `INSERT INTO crops (farmer_id, crop_name, season, area, sowing_date, expected_harvest_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, farmer_id, crop_name, season, area, sowing_date, expected_harvest_date, created_at`,
      [farmer_id, crop_name, season, area, sowing_date, expected_harvest_date]
    );
    return res.rows[0];
  }
}

module.exports = Crop;
