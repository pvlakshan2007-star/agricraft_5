/**
 * AGRI CRAFT-AI - Government Scheme Controller (schemeController.js)
 * 
 * Manages government agricultural schemes catalog and farmer eligibility matching.
 */

const db = require('../config/db');
const { matchFarmerSchemes } = require('../services/schemeMatchingService');

// Fallback scheme dataset
const fallbackSchemes = [
  {
    id: 1,
    scheme_name: 'PM-KISAN Samman Nidhi',
    description: 'Direct income support of ₹6,000/yr to all landholding farmer families.',
    eligibility: 'All landholding farmers with cultivable land and e-KYC completed.',
    benefits: '₹6,000/year in 3 installments of ₹2,000 via DBT.',
    required_documents: 'Aadhaar, Land Patta/Chitta, Bank Account Passbook',
    official_url: 'https://pmkisan.gov.in',
    state: 'All India'
  },
  {
    id: 2,
    scheme_name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    description: 'Comprehensive agricultural crop loss insurance against natural risks.',
    eligibility: 'All farmers cultivating notified crops in notified insurance areas.',
    benefits: 'Subsidized crop loss insurance cover: 1.5% Rabi, 2% Kharif premium.',
    required_documents: 'Aadhaar, Land Patta, Sowing Adangal from VAO, Bank Passbook',
    official_url: 'https://pmfby.gov.in',
    state: 'All India'
  },
  {
    id: 3,
    scheme_name: 'PM Krishi Sinchayee Yojana (Per Drop More Crop - Drip Subsidy)',
    description: 'Micro-irrigation subsidy for water conservation.',
    eligibility: 'Farmers with cultivable land and verified water source.',
    benefits: '100% subsidy for Small/Marginal farmers in TN; 75% for others.',
    required_documents: 'Aadhaar, Small/Marginal Farmer Certificate, FMB sketch, Water proof',
    official_url: 'https://pmksy.gov.in',
    state: 'All India'
  },
  {
    id: 4,
    scheme_name: 'Kalaignar All Village Integrated Agriculture Development Programme',
    description: 'Integrated agricultural development and fallow land revitalization in TN.',
    eligibility: 'Farmers residing in selected village panchayats in Tamil Nadu.',
    benefits: 'Free coconut saplings, seed kits, 50% implement subsidy, pond desilting.',
    required_documents: 'Aadhaar, Smart Ration Card, Uzhavan App ID, Patta',
    official_url: 'https://www.tn.gov.in/department/1',
    state: 'Tamil Nadu'
  },
  {
    id: 5,
    scheme_name: 'Sub-Mission on Agricultural Mechanization (SMAM)',
    description: 'Financial assistance for modern tractors and farm machinery.',
    eligibility: 'Farmers with valid land patta who have not claimed machinery subsidy in 5 years.',
    benefits: '40% to 50% subsidy on tractors, weeders, power tillers, sprayers.',
    required_documents: 'Aadhaar, Land Patta, Dealer Proforma Invoice, Bank details',
    official_url: 'https://agrimachinery.nic.in',
    state: 'All India'
  }
];

/**
 * GET /api/government-schemes
 * Return all government schemes
 */
async function getSchemes(req, res) {
  try {
    try {
      const sql = `
        SELECT id, scheme_name, description, eligibility, benefits, required_documents, official_url, state, created_at, updated_at
        FROM government_schemes
        ORDER BY id ASC
      `;
      const result = await db.query(sql);
      if (result.rows.length > 0) {
        return res.json({ success: true, count: result.rows.length, schemes: result.rows, source: 'database' });
      }
    } catch (dbErr) {
      console.warn('DB query failed for government schemes, using fallback catalog:', dbErr.message);
    }

    return res.json({
      success: true,
      count: fallbackSchemes.length,
      schemes: fallbackSchemes,
      source: 'fallback_catalog'
    });
  } catch (err) {
    console.error('Error in getSchemes:', err);
    return res.status(500).json({ success: false, error: 'Internal server error while fetching schemes.' });
  }
}

/**
 * GET /api/government-schemes/match/:farmerId
 * Match schemes for a specific farmer profile and persist results in scheme_matches
 */
async function matchSchemesForFarmer(req, res) {
  try {
    const farmerId = parseInt(req.params.farmerId, 10);
    if (isNaN(farmerId)) {
      return res.status(400).json({ success: false, error: 'Invalid farmerId format.' });
    }

    let farmer = { id: farmerId, name: 'Farmer', land_area: 2.5, location: 'Thanjavur', land_type: 'Alluvial' };
    let schemesList = fallbackSchemes;

    try {
      // 1. Fetch farmer from database
      const farmerRes = await db.query(`SELECT * FROM farmers WHERE id = $1`, [farmerId]);
      if (farmerRes.rows.length > 0) {
        farmer = farmerRes.rows[0];
      }

      // 2. Fetch schemes from database
      const schemesRes = await db.query(`SELECT * FROM government_schemes ORDER BY id ASC`);
      if (schemesRes.rows.length > 0) {
        schemesList = schemesRes.rows;
      }
    } catch (dbErr) {
      console.warn('DB read error in scheme matching, using local profile fallback:', dbErr.message);
    }

    // 3. Evaluate eligibility
    const matches = matchFarmerSchemes(farmer, schemesList);

    // 4. Persist match records if DB is accessible
    try {
      for (const match of matches) {
        if (match.scheme_id) {
          await db.query(`
            INSERT INTO scheme_matches (farmer_id, scheme_id, eligibility_status, match_reason)
            VALUES ($1, $2, $3, $4)
          `, [farmerId, match.scheme_id, match.eligibility_status, match.match_reason]);
        }
      }
    } catch (persistErr) {
      // Non-blocking if table or connection is not ready
      console.warn('Notice: Could not persist scheme matches to table:', persistErr.message);
    }

    return res.json({
      success: true,
      farmerId,
      farmerName: farmer.name,
      matchedCount: matches.length,
      matches,
      source: 'evaluated'
    });
  } catch (err) {
    console.error('Error in matchSchemesForFarmer:', err);
    return res.status(500).json({ success: false, error: 'Internal server error during scheme matching.' });
  }
}

module.exports = {
  getSchemes,
  matchSchemesForFarmer
};
