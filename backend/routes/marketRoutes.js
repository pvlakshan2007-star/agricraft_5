/**
 * AGRI CRAFT-AI - Market Routes (marketRoutes.js)
 */

const express = require('express');
const router = express.Router();
const marketController = require('../controllers/marketController');

// GET /api/market-prices - Retrieve mandi prices with optional ?crop= & ?location=
router.get('/', marketController.getPrices);

// POST /api/market-prices - Record a new market price entry
router.post('/', marketController.createPrice);

module.exports = router;
