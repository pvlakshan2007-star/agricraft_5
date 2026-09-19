/**
 * AGRI CRAFT-AI - Loan Model (Loan.js)
 * Data access abstraction for 'loans' and 'loan_recommendations' tables.
 */

const db = require('../config/db');

class Loan {
  static async findAll() {
    const res = await db.query(
      `SELECT id, farmer_id, loan_name, provider, interest_rate, maximum_amount, tenure, eligibility, application_url, created_at
       FROM loans ORDER BY id ASC`
    );
    return res.rows;
  }

  static async recordRecommendation({
    farmer_id, cibil_score, existing_loan_status, repayment_capacity,
    land_crop_score, location_score, total_match_score, recommendation_reason
  }) {
    const res = await db.query(
      `INSERT INTO loan_recommendations (
        farmer_id, cibil_score, existing_loan_status, repayment_capacity,
        land_crop_score, location_score, total_match_score, recommendation_reason
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, farmer_id, cibil_score, existing_loan_status, repayment_capacity,
                land_crop_score, location_score, total_match_score, recommendation_reason, created_at`,
      [farmer_id, cibil_score, existing_loan_status, repayment_capacity, land_crop_score, location_score, total_match_score, recommendation_reason]
    );
    return res.rows[0];
  }

  static async findRecommendationsByFarmerId(farmerId) {
    const res = await db.query(
      `SELECT id, farmer_id, cibil_score, existing_loan_status, repayment_capacity,
              land_crop_score, location_score, total_match_score, recommendation_reason, created_at
       FROM loan_recommendations WHERE farmer_id = $1 ORDER BY created_at DESC`,
      [farmerId]
    );
    return res.rows;
  }
}

module.exports = Loan;
