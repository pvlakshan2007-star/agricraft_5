/**
 * AGRI CRAFT-AI - Crop Routes (cropRoutes.js)
 */

const express = require('express');
const router = express.Router();
const cropController = require('../controllers/cropController');

// POST /api/crops - Register a new crop for a farmer
router.post('/', cropController.createCrop);

// GET /api/crops/:farmerId - Get all crops for a farmer
router.get('/:farmerId', cropController.getCropsByFarmer);

module.exports = router;
