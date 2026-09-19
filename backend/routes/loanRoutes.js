/**
 * AGRI CRAFT-AI - Loan Routes (loanRoutes.js)
 */

const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loanController');

// GET /api/loans - Retrieve catalog of verified formal loans
router.get('/', loanController.getLoans);

// POST /api/loan-recommendations - Compute loan match score and store recommendation
router.post('/recommendations', loanController.createLoanRecommendation);

// GET /api/loan-recommendations/:farmerId - Retrieve loan recommendations for a farmer
router.get('/recommendations/:farmerId', loanController.getRecommendationsByFarmer);

module.exports = router;
