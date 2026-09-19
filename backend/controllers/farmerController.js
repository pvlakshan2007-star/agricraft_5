/**
 * AGRI CRAFT-AI - Farmer Controller (farmerController.js)
 * 
 * Handles CRUD operations for farmer profile data with validation
 * and parameterized PostgreSQL queries.
 */

const db = require('../config/db');

// In-memory fallback repository when DB is offline
const memoryFarmers = new Map([
  [1, {
    id: 1,
    name: 'Murugan K',
    phone: '9876543210',
    email: 'murugan.k@agricraft.demo',
    location: 'Thanjavur',
    land_area: 2.50,
    land_type: 'Alluvial',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }]
]);

/**
 * POST /api/farmers
 * Register a new farmer profile or update existing
 */
async function createFarmer(req, res) {
  try {
    const { name, phone, email, location, land_area, land_type } = req.body;

    // Input Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Farmer name is required.' });
    }

    const sanitizedName = name.trim().slice(0, 255);
    const sanitizedPhone = phone ? String(phone).trim().slice(0, 50) : null;
    const sanitizedEmail = email ? String(email).trim().slice(0, 255) : null;
    const sanitizedLocation = location ? String(location).trim().slice(0, 255) : 'Thanjavur';
    const parsedArea = !isNaN(parseFloat(land_area)) ? parseFloat(land_area) : 2.0;
    const sanitizedLandType = land_type ? String(land_type).trim().slice(0, 100) : 'Alluvial';

    try {
      const sql = `
        INSERT INTO farmers (name, phone, email, location, land_area, land_type)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, name, phone, email, location, land_area, land_type, created_at, updated_at
      `;
      const result = await db.query(sql, [
        sanitizedName,
        sanitizedPhone,
        sanitizedEmail,
        sanitizedLocation,
        parsedArea,
        sanitizedLandType
      ]);

      return res.status(201).json({
        success: true,
        message: 'Farmer profile saved successfully in PostgreSQL database.',
        farmer: result.rows[0],
        source: 'database'
      });
    } catch (dbErr) {
      // Fallback to memory store if PostgreSQL connection is not active
      console.warn('DB offline, persisting in temporary memory store:', dbErr.message);
      const newId = memoryFarmers.size + 1;
      const farmerRecord = {
        id: newId,
        name: sanitizedName,
        phone: sanitizedPhone,
        email: sanitizedEmail,
        location: sanitizedLocation,
        land_area: parsedArea,
        land_type: sanitizedLandType,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      memoryFarmers.set(newId, farmerRecord);

      return res.status(201).json({
        success: true,
        message: 'Farmer profile saved successfully (Local fallback).',
        farmer: farmerRecord,
        source: 'memory_fallback',
        dbNotice: 'PostgreSQL database not yet reachable. Verify .env settings.'
      });
    }
  } catch (err) {
    console.error('Error in createFarmer:', err);
    return res.status(500).json({ success: false, error: 'Internal server error while creating farmer.' });
  }
}

/**
 * GET /api/farmers/:id
 * Retrieve farmer profile by ID
 */
async function getFarmerById(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Invalid farmer ID format.' });
    }

    try {
      const sql = `
        SELECT id, name, phone, email, location, land_area, land_type, created_at, updated_at
        FROM farmers
        WHERE id = $1
      `;
      const result = await db.query(sql, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: `Farmer with ID ${id} not found.` });
      }

      return res.json({ success: true, farmer: result.rows[0], source: 'database' });
    } catch (dbErr) {
      if (memoryFarmers.has(id)) {
        return res.json({ success: true, farmer: memoryFarmers.get(id), source: 'memory_fallback' });
      }
      return res.status(404).json({ success: false, error: `Farmer with ID ${id} not found in fallback store.` });
    }
  } catch (err) {
    console.error('Error in getFarmerById:', err);
    return res.status(500).json({ success: false, error: 'Internal server error while fetching farmer.' });
  }
}

/**
 * PUT /api/farmers/:id
 * Update an existing farmer profile
 */
async function updateFarmer(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Invalid farmer ID format.' });
    }

    const { name, phone, email, location, land_area, land_type } = req.body;

    try {
      const sql = `
        UPDATE farmers
        SET
          name = COALESCE($1, name),
          phone = COALESCE($2, phone),
          email = COALESCE($3, email),
          location = COALESCE($4, location),
          land_area = COALESCE($5, land_area),
          land_type = COALESCE($6, land_type),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
        RETURNING id, name, phone, email, location, land_area, land_type, created_at, updated_at
      `;
      const result = await db.query(sql, [
        name ? name.trim() : null,
        phone ? String(phone).trim() : null,
        email ? String(email).trim() : null,
        location ? location.trim() : null,
        land_area !== undefined ? parseFloat(land_area) : null,
        land_type ? land_type.trim() : null,
        id
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: `Farmer with ID ${id} not found.` });
      }

      return res.json({
        success: true,
        message: 'Farmer profile updated successfully.',
        farmer: result.rows[0],
        source: 'database'
      });
    } catch (dbErr) {
      if (memoryFarmers.has(id)) {
        const existing = memoryFarmers.get(id);
        const updated = {
          ...existing,
          name: name ? name.trim() : existing.name,
          phone: phone ? String(phone).trim() : existing.phone,
          email: email ? String(email).trim() : existing.email,
          location: location ? location.trim() : existing.location,
          land_area: land_area !== undefined ? parseFloat(land_area) : existing.land_area,
          land_type: land_type ? land_type.trim() : existing.land_type,
          updated_at: new Date().toISOString()
        };
        memoryFarmers.set(id, updated);
        return res.json({ success: true, farmer: updated, source: 'memory_fallback' });
      }
      return res.status(404).json({ success: false, error: `Farmer with ID ${id} not found.` });
    }
  } catch (err) {
    console.error('Error in updateFarmer:', err);
    return res.status(500).json({ success: false, error: 'Internal server error while updating farmer.' });
  }
}

module.exports = {
  createFarmer,
  getFarmerById,
  updateFarmer
};
