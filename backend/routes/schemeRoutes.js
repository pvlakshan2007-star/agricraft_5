/**
 * AGRI CRAFT-AI - Government Scheme Routes (schemeRoutes.js)
 */

const express = require('express');
const router = express.Router();
const schemeController = require('../controllers/schemeController');

// GET /api/government-schemes - Catalog of all government schemes
router.get('/', schemeController.getSchemes);

// GET /api/government-schemes/match/:farmerId - Match schemes for a farmer and persist
router.get('/match/:farmerId', schemeController.matchSchemesForFarmer);

module.exports = router;
