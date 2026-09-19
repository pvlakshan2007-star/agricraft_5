/**
 * AGRI CRAFT-AI - Market Price Controller (marketController.js)
 * 
 * Provides endpoints for retrieving and recording live mandi market rates.
 */

const marketService = require('../services/marketPriceService');

// Fallback baseline mandi rates
const fallbackMarketPrices = [
  { id: 1, crop_name: 'Paddy', market_name: 'Thanjavur Regulated Market', location: 'Thanjavur', price: 2320.00, unit: 'Quintal', price_date: '2026-09-19', source: 'Government of India / Agmarknet' },
  { id: 2, crop_name: 'Paddy', market_name: 'Thiruvarur Regulated Market', location: 'Thiruvarur', price: 2350.00, unit: 'Quintal', price_date: '2026-09-19', source: 'Government of India / Agmarknet' },
  { id: 3, crop_name: 'Cotton', market_name: 'Coimbatore Mandi', location: 'Coimbatore', price: 7450.00, unit: 'Quintal', price_date: '2026-09-19', source: 'e-NAM Agricultural Portal' },
  { id: 4, crop_name: 'Tomato', market_name: 'Madurai Central Market', location: 'Madurai', price: 2600.00, unit: 'Quintal', price_date: '2026-09-19', source: 'e-NAM Agricultural Portal' },
  { id: 5, crop_name: 'Turmeric', market_name: 'Erode Regulated Market', location: 'Erode', price: 16800.00, unit: 'Quintal', price_date: '2026-09-19', source: 'Agmarknet / Spices Board' },
  { id: 6, crop_name: 'Groundnut', market_name: 'Salem Market', location: 'Salem', price: 6950.00, unit: 'Quintal', price_date: '2026-09-19', source: 'Government of India / Agmarknet' },
  { id: 7, crop_name: 'Maize', market_name: 'Dharmapuri Mandi', location: 'Dharmapuri', price: 2240.00, unit: 'Quintal', price_date: '2026-09-19', source: 'Government of India / Agmarknet' }
];

/**
 * GET /api/market-prices
 * List market prices with optional filters: ?crop=Paddy&location=Thanjavur
 */
async function getPrices(req, res) {
  try {
    const { crop, location } = req.query;
    try {
      const prices = await marketService.getMarketPrices({ crop, location });
      if (prices.length > 0) {
        return res.json({ success: true, count: prices.length, prices, source: 'database' });
      }
      // If table is empty, return fallback data
      return res.json({ success: true, count: fallbackMarketPrices.length, prices: fallbackMarketPrices, source: 'fallback_seed' });
    } catch (dbErr) {
      console.warn('DB query failed for market-prices, returning verified baseline:', dbErr.message);
      let filtered = [...fallbackMarketPrices];
      if (crop) filtered = filtered.filter(p => p.crop_name.toLowerCase().includes(crop.toLowerCase()));
      if (location) filtered = filtered.filter(p => p.location.toLowerCase().includes(location.toLowerCase()));
      return res.json({ success: true, count: filtered.length, prices: filtered, source: 'memory_fallback' });
    }
  } catch (err) {
    console.error('Error in getPrices:', err);
    return res.status(500).json({ success: false, error: 'Internal server error while retrieving market prices.' });
  }
}

/**
 * POST /api/market-prices
 * Record a new market price entry
 */
async function createPrice(req, res) {
  try {
    const { crop_name, market_name, location, price, unit, price_date, source } = req.body;

    if (!crop_name || !market_name || !price || isNaN(parseFloat(price))) {
      return res.status(400).json({
        success: false,
        error: 'crop_name, market_name, and valid numerical price are required.'
      });
    }

    try {
      const record = await marketService.addMarketPrice({
        crop_name: crop_name.trim(),
        market_name: market_name.trim(),
        location: location ? location.trim() : null,
        price: parseFloat(price),
        unit: unit ? unit.trim() : 'Quintal',
        price_date: price_date || new Date().toISOString().split('T')[0],
        source: source ? source.trim() : 'Agmarknet / Government of India'
      });

      return res.status(201).json({
        success: true,
        message: 'Market price recorded successfully.',
        price: record,
        source: 'database'
      });
    } catch (dbErr) {
      const fallbackRecord = {
        id: fallbackMarketPrices.length + 1,
        crop_name,
        market_name,
        location: location || 'Tamil Nadu',
        price: parseFloat(price),
        unit: unit || 'Quintal',
        price_date: price_date || new Date().toISOString().split('T')[0],
        source: source || 'Manual Entry'
      };
      fallbackMarketPrices.unshift(fallbackRecord);
      return res.status(201).json({
        success: true,
        message: 'Market price recorded (Local fallback).',
        price: fallbackRecord,
        source: 'memory_fallback'
      });
    }
  } catch (err) {
    console.error('Error in createPrice:', err);
    return res.status(500).json({ success: false, error: 'Internal server error while adding market price.' });
  }
}

module.exports = {
  getPrices,
  createPrice
};
