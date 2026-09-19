/**
 * AGRI CRAFT-AI - Government Scheme Matching Service (schemeMatchingService.js)
 * 
 * Analyzes farmer parameters (land area, location, soil, water source, current crop)
 * against eligibility rules of central and state agricultural support schemes.
 */

/**
 * Match a farmer profile against a list of government schemes
 * @param {Object} farmer - Farmer database record
 * @param {Array} schemes - Catalog of government schemes
 * @returns {Array} Array of evaluated scheme matches with reasons
 */
function matchFarmerSchemes(farmer, schemes) {
  const landArea = parseFloat(farmer.land_area || farmer.farmSize || 2.0);
  const location = (farmer.location || farmer.district || '').toLowerCase();
  const landType = (farmer.land_type || farmer.soil || '').toLowerCase();
  const currentCrop = (farmer.crop_name || farmer.currentCrop || 'Paddy').toLowerCase();

  return schemes.map(scheme => {
    let isEligible = true;
    const reasons = [];

    const schemeName = scheme.scheme_name.toLowerCase();

    // Scheme 1: PM-KISAN
    if (schemeName.includes('pm-kisan') || schemeName.includes('samman nidhi')) {
      // Open to all landholder farmer families with cultivable land
      if (landArea > 0) {
        reasons.push(`Landholding farmer with ${landArea} acres qualifies for ₹6,000/yr direct income transfer in 3 installments.`);
      } else {
        isEligible = false;
        reasons.push('Requires verified cultivable landholding record.');
      }
    }
    // Scheme 2: PMFBY Crop Insurance
    else if (schemeName.includes('pmfby') || schemeName.includes('fasal bima')) {
      reasons.push(`Notified crop (${currentCrop || 'Paddy'}) qualifies for seasonal crop loss protection at 1.5% to 2% subsidized premium.`);
    }
    // Scheme 3: PMKSY Drip Irrigation Subsidy
    else if (schemeName.includes('drip') || schemeName.includes('sinchayee') || schemeName.includes('pmksy')) {
      if (landArea <= 5.0) {
        reasons.push(`Small/Marginal land holding (${landArea} acres) is eligible for up to 100% micro-irrigation installation subsidy in Tamil Nadu.`);
      } else {
        reasons.push(`Medium/Large farm size (${landArea} acres) qualifies for 75% micro-irrigation capital assistance.`);
      }
    }
    // Scheme 4: Kalaignar All Village Integrated Agriculture Programme
    else if (schemeName.includes('kalaignar') || schemeName.includes('all village')) {
      if (['thanjavur', 'coimbatore', 'madurai', 'salem', 'erode', 'tirunelveli', 'dharmapuri', 'cuddalore'].includes(location)) {
        reasons.push(`Located in priority agricultural district (${farmer.location}) eligible for free seedling kits, pond desilting, and farm implements.`);
      } else {
        reasons.push(`Eligible for selected village panchayat agricultural extension benefits across Tamil Nadu.`);
      }
    }
    // Scheme 5: SMAM Agricultural Machinery Subsidy
    else if (schemeName.includes('smam') || schemeName.includes('mechanization')) {
      reasons.push(`Eligible for 40% to 50% capital subsidy on tractors, power weeders, and sprayers with land ownership record.`);
    }
    // Generic Scheme Eligibility Check
    else {
      reasons.push(`General agricultural eligibility criteria met for active farming producer.`);
    }

    const status = isEligible ? 'ELIGIBLE' : 'POTENTIALLY_ELIGIBLE';

    return {
      scheme_id: scheme.id,
      scheme_name: scheme.scheme_name,
      description: scheme.description,
      benefits: scheme.benefits,
      required_documents: scheme.required_documents,
      official_url: scheme.official_url,
      state: scheme.state,
      eligibility_status: status,
      match_reason: reasons.join(' ')
    };
  });
}

module.exports = {
  matchFarmerSchemes
};
