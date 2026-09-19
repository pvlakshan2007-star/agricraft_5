/**
 * AGRI CRAFT-AI - Loan Controller (loanController.js)
 * 
 * Computes transparent, weighted loan matching scores and manages
 * loan recommendations stored in PostgreSQL.
 */

const db = require('../config/db');
const { evaluateLoanMatch, LOAN_PRODUCTS } = require('../services/loanScoringService');

// In-memory fallback for loan recommendations
const memoryRecommendations = [];

/**
 * GET /api/loans
 * Retrieve catalog of verified formal agricultural loans
 */
async function getLoans(req, res) {
  try {
    try {
      const sql = `
        SELECT id, farmer_id, loan_name, provider, interest_rate, maximum_amount, tenure, eligibility, application_url, created_at
        FROM loans
        ORDER BY id ASC
      `;
      const result = await db.query(sql);
      if (result.rows.length > 0) {
        return res.json({ success: true, count: result.rows.length, loans: result.rows, source: 'database' });
      }
    } catch (dbErr) {
      console.warn('DB query failed for loans, using verified reference products:', dbErr.message);
    }

    return res.json({
      success: true,
      count: LOAN_PRODUCTS.length,
      loans: LOAN_PRODUCTS,
      source: 'fallback_products'
    });
  } catch (err) {
    console.error('Error in getLoans:', err);
    return res.status(500).json({ success: false, error: 'Internal server error while fetching loans.' });
  }
}

/**
 * POST /api/loan-recommendations
 * Calculate 5-factor loan match score and persist recommendation
 */
async function createLoanRecommendation(req, res) {
  try {
    const profile = req.body;
    if (!profile) {
      return res.status(400).json({ success: false, error: 'Farmer profile parameters are required.' });
    }

    const evaluation = evaluateLoanMatch(profile);
    const farmerId = parseInt(profile.farmer_id || profile.farmerId, 10) || 1;

    try {
      const sql = `
        INSERT INTO loan_recommendations (
          farmer_id, cibil_score, existing_loan_status, repayment_capacity,
          land_crop_score, location_score, total_match_score, recommendation_reason
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, farmer_id, cibil_score, existing_loan_status, repayment_capacity,
                  land_crop_score, location_score, total_match_score, recommendation_reason, created_at
      `;
      const result = await db.query(sql, [
        farmerId,
        evaluation.breakdown.creditScore.score,
        profile.repaymentStatus || profile.existing_loan_status || 'On-Time',
        evaluation.breakdown.repaymentCapacity.score,
        evaluation.breakdown.landCropDetails.score,
        evaluation.breakdown.locationCriteria.score,
        evaluation.totalMatchScore,
        evaluation.recommendationReason
      ]);

      return res.status(201).json({
        success: true,
        message: 'Loan match score evaluated and recorded in database.',
        evaluation: {
          id: result.rows[0].id,
          farmerId: result.rows[0].farmer_id,
          totalMatchScore: evaluation.totalMatchScore,
          breakdown: evaluation.breakdown,
          recommendationReason: evaluation.recommendationReason,
          matchedLoans: evaluation.matchedLoans,
          disclaimer: evaluation.disclaimer,
          created_at: result.rows[0].created_at
        },
        source: 'database'
      });
    } catch (dbErr) {
      console.warn('DB offline, recording recommendation in memory:', dbErr.message);
      const memRecord = {
        id: memoryRecommendations.length + 1,
        farmer_id: farmerId,
        totalMatchScore: evaluation.totalMatchScore,
        breakdown: evaluation.breakdown,
        recommendationReason: evaluation.recommendationReason,
        matchedLoans: evaluation.matchedLoans,
        disclaimer: evaluation.disclaimer,
        created_at: new Date().toISOString()
      };
      memoryRecommendations.push(memRecord);

      return res.status(201).json({
        success: true,
        message: 'Loan match score evaluated (Local fallback).',
        evaluation: memRecord,
        source: 'memory_fallback'
      });
    }
  } catch (err) {
    console.error('Error in createLoanRecommendation:', err);
    return res.status(500).json({ success: false, error: 'Internal server error while evaluating loan.' });
  }
}

/**
 * GET /api/loan-recommendations/:farmerId
 * Retrieve loan recommendation history for a specific farmer
 */
async function getRecommendationsByFarmer(req, res) {
  try {
    const farmerId = parseInt(req.params.farmerId, 10);
    if (isNaN(farmerId)) {
      return res.status(400).json({ success: false, error: 'Invalid farmerId format.' });
    }

    try {
      const sql = `
        SELECT id, farmer_id, cibil_score, existing_loan_status, repayment_capacity,
               land_crop_score, location_score, total_match_score, recommendation_reason, created_at
        FROM loan_recommendations
        WHERE farmer_id = $1
        ORDER BY created_at DESC
      `;
      const result = await db.query(sql, [farmerId]);
      return res.json({
        success: true,
        count: result.rows.length,
        recommendations: result.rows,
        source: 'database'
      });
    } catch (dbErr) {
      const filtered = memoryRecommendations.filter(r => r.farmer_id === farmerId);
      return res.json({
        success: true,
        count: filtered.length,
        recommendations: filtered,
        source: 'memory_fallback'
      });
    }
  } catch (err) {
    console.error('Error in getRecommendationsByFarmer:', err);
    return res.status(500).json({ success: false, error: 'Internal server error while fetching recommendations.' });
  }
}

module.exports = {
  getLoans,
  createLoanRecommendation,
  getRecommendationsByFarmer
};
