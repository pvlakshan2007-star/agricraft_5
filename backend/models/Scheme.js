/**
 * AGRI CRAFT-AI - Scheme Model (Scheme.js)
 * Data access abstraction for 'government_schemes' and 'scheme_matches' tables.
 */

const db = require('../config/db');

class Scheme {
  static async findAll() {
    const res = await db.query(
      `SELECT id, scheme_name, description, eligibility, benefits, required_documents, official_url, state, created_at, updated_at
       FROM government_schemes ORDER BY id ASC`
    );
    return res.rows;
  }

  static async recordMatch({ farmer_id, scheme_id, eligibility_status, match_reason }) {
    const res = await db.query(
      `INSERT INTO scheme_matches (farmer_id, scheme_id, eligibility_status, match_reason)
       VALUES ($1, $2, $3, $4)
       RETURNING id, farmer_id, scheme_id, eligibility_status, match_reason, created_at`,
      [farmer_id, scheme_id, eligibility_status, match_reason]
    );
    return res.rows[0];
  }

  static async findMatchesByFarmerId(farmerId) {
    const res = await db.query(
      `SELECT sm.id, sm.farmer_id, sm.scheme_id, sm.eligibility_status, sm.match_reason, sm.created_at,
              gs.scheme_name, gs.benefits, gs.required_documents, gs.official_url
       FROM scheme_matches sm
       JOIN government_schemes gs ON sm.scheme_id = gs.id
       WHERE sm.farmer_id = $1
       ORDER BY sm.created_at DESC`,
      [farmerId]
    );
    return res.rows;
  }
}

module.exports = Scheme;
