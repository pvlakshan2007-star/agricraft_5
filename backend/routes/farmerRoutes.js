/**
 * AGRI CRAFT-AI - Farmer Routes (farmerRoutes.js)
 */

const express = require('express');
const router = express.Router();
const farmerController = require('../controllers/farmerController');

// POST /api/farmers - Register a new farmer
router.post('/', farmerController.createFarmer);

// GET /api/farmers/:id - Get farmer details by ID
router.get('/:id', farmerController.getFarmerById);

// PUT /api/farmers/:id - Update farmer details
router.put('/:id', farmerController.updateFarmer);

module.exports = router;
