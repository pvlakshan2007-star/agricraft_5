/**
 * AGRI CRAFT-AI - Farmer Model (Farmer.js)
 * Data access abstraction for the 'farmers' table.
 */

const db = require('../config/db');

class Farmer {
  static async findById(id) {
    const res = await db.query(
      `SELECT id, name, phone, email, location, land_area, land_type, created_at, updated_at
       FROM farmers WHERE id = $1`,
      [id]
    );
    return res.rows[0] || null;
  }

  static async create({ name, phone, email, location, land_area, land_type }) {
    const res = await db.query(
      `INSERT INTO farmers (name, phone, email, location, land_area, land_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, phone, email, location, land_area, land_type, created_at, updated_at`,
      [name, phone, email, location, land_area, land_type]
    );
    return res.rows[0];
  }

  static async update(id, fields) {
    const res = await db.query(
      `UPDATE farmers
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           email = COALESCE($3, email),
           location = COALESCE($4, location),
           land_area = COALESCE($5, land_area),
           land_type = COALESCE($6, land_type),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING id, name, phone, email, location, land_area, land_type, created_at, updated_at`,
      [fields.name, fields.phone, fields.email, fields.location, fields.land_area, fields.land_type, id]
    );
    return res.rows[0] || null;
  }
}

module.exports = Farmer;
