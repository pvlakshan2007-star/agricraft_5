/**
 * AGRI CRAFT-AI - Crop Controller (cropController.js)
 * 
 * Manages crop registration and farmer crop associations.
 */

const db = require('../config/db');

// In-memory fallback crops
const memoryCrops = [
  {
    id: 1,
    farmer_id: 1,
    crop_name: 'Paddy (Rice)',
    season: 'Kharif / Kuruvai',
    area: 2.50,
    sowing_date: '2026-06-15',
    expected_harvest_date: '2026-10-25',
    created_at: new Date().toISOString()
  }
];

/**
 * POST /api/crops
 * Add a new crop for a farmer
 */
async function createCrop(req, res) {
  try {
    const { farmer_id, crop_name, season, area, sowing_date, expected_harvest_date } = req.body;

    if (!farmer_id || isNaN(parseInt(farmer_id, 10))) {
      return res.status(400).json({ success: false, error: 'A valid farmer_id is required.' });
    }
    if (!crop_name || typeof crop_name !== 'string' || crop_name.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Crop name is required.' });
    }

    const sanitizedFarmerId = parseInt(farmer_id, 10);
    const sanitizedCropName = crop_name.trim().slice(0, 255);
    const sanitizedSeason = season ? String(season).trim().slice(0, 100) : 'Kharif';
    const parsedArea = !isNaN(parseFloat(area)) ? parseFloat(area) : null;
    const sanitizedSowDate = sowing_date || null;
    const sanitizedHarvestDate = expected_harvest_date || null;

    try {
      const sql = `
        INSERT INTO crops (farmer_id, crop_name, season, area, sowing_date, expected_harvest_date)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, farmer_id, crop_name, season, area, sowing_date, expected_harvest_date, created_at
      `;
      const result = await db.query(sql, [
        sanitizedFarmerId,
        sanitizedCropName,
        sanitizedSeason,
        parsedArea,
        sanitizedSowDate,
        sanitizedHarvestDate
      ]);

      return res.status(201).json({
        success: true,
        message: 'Crop registered successfully for farmer.',
        crop: result.rows[0],
        source: 'database'
      });
    } catch (dbErr) {
      console.warn('DB offline, storing crop in memory:', dbErr.message);
      const newCrop = {
        id: memoryCrops.length + 1,
        farmer_id: sanitizedFarmerId,
        crop_name: sanitizedCropName,
        season: sanitizedSeason,
        area: parsedArea,
        sowing_date: sanitizedSowDate,
        expected_harvest_date: sanitizedHarvestDate,
        created_at: new Date().toISOString()
      };
      memoryCrops.push(newCrop);

      return res.status(201).json({
        success: true,
        message: 'Crop registered successfully (Local fallback).',
        crop: newCrop,
        source: 'memory_fallback'
      });
    }
  } catch (err) {
    console.error('Error in createCrop:', err);
    return res.status(500).json({ success: false, error: 'Internal server error while registering crop.' });
  }
}

/**
 * GET /api/crops/:farmerId
 * Retrieve all crops associated with a specific farmer
 */
async function getCropsByFarmer(req, res) {
  try {
    const farmerId = parseInt(req.params.farmerId, 10);
    if (isNaN(farmerId)) {
      return res.status(400).json({ success: false, error: 'Invalid farmerId parameter.' });
    }

    try {
      const sql = `
        SELECT id, farmer_id, crop_name, season, area, sowing_date, expected_harvest_date, created_at
        FROM crops
        WHERE farmer_id = $1
        ORDER BY created_at DESC
      `;
      const result = await db.query(sql, [farmerId]);
      return res.json({ success: true, count: result.rows.length, crops: result.rows, source: 'database' });
    } catch (dbErr) {
      const filtered = memoryCrops.filter(c => c.farmer_id === farmerId);
      return res.json({ success: true, count: filtered.length, crops: filtered, source: 'memory_fallback' });
    }
  } catch (err) {
    console.error('Error in getCropsByFarmer:', err);
    return res.status(500).json({ success: false, error: 'Internal server error while fetching crops.' });
  }
}

module.exports = {
  createCrop,
  getCropsByFarmer
};
