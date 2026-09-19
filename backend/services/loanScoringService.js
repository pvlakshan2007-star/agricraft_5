/**
 * AGRI CRAFT-AI - Loan Scoring Service (loanScoringService.js)
 * 
 * Strict 5-Factor Weighted Loan-Matching Model:
 *   1. Credit history / CIBIL:           30% (Max 30 pts)
 *   2. Existing loans & repayment status: 25% (Max 25 pts)
 *   3. Income / repayment capacity:      20% (Max 20 pts)
 *   4. Land & crop details:              15% (Max 15 pts)
 *   5. Location / other criteria:        10% (Max 10 pts)
 *   Total: Strictly 100% (0 - 100 score)
 * 
 * CRITICAL COMPLIANCE NOTICE:
 * This output represents an informational "Loan Match Score" and potential matches.
 * It is NOT a credit guarantee, loan pre-approval, or promise of sanction by any bank.
 */

// Verified Agricultural Loan Products Reference
const LOAN_PRODUCTS = [
  {
    id: 'kcc',
    name: 'Kisan Credit Card (KCC) Scheme',
    provider: 'NABARD / Commercial Banks / RRBs / Cooperative Banks',
    interestRate: '4.0% p.a. (with prompt repayment incentive; 7% baseline)',
    maxLimit: 'Up to ₹3,00,000 (collateral-free up to ₹1,60,000)',
    tenure: '5 Years with annual review',
    suitablePurposes: ['crop_cultivation', 'farm_inputs', 'seasonal'],
    minScore: 45,
    officialUrl: 'https://pib.gov.in/PressReleasePage.aspx?PRID=1908241'
  },
  {
    id: 'sbi_gold',
    name: 'Agricultural Gold Loan',
    provider: 'State Bank of India / Public Sector Commercial Banks',
    interestRate: '7.0% - 7.5% p.a. (Concessional agricultural rate)',
    maxLimit: 'Up to ₹25,00,000 (75% Loan-to-Value of gold pledged)',
    tenure: '12 Months bullet repayment or multi-crop cycle',
    suitablePurposes: ['emergency', 'farm_inputs', 'equipment_repair'],
    minScore: 40,
    officialUrl: 'https://sbi.co.in/web/agri-rural/agriculture-banking/agri-gold-loan'
  },
  {
    id: 'tractor_equipment',
    name: 'Farm Mechanization / Tractor Loan',
    provider: 'NABARD / Commercial Banks / Rural Financial Institutions',
    interestRate: '8.5% - 9.75% p.a.',
    maxLimit: 'Up to 85-90% of Tractor/Equipment On-road quotation',
    tenure: '5 to 7 Years in half-yearly/harvest-linked instalments',
    suitablePurposes: ['machinery', 'tractor', 'farm_assets'],
    minScore: 60,
    officialUrl: 'https://www.nabard.org'
  },
  {
    id: 'mudra_shishu_tarun',
    name: 'Pradhan Mantri MUDRA Yojana (Agri-Allied)',
    provider: 'Public Sector Banks / Regional Rural Banks / Microfinance Institutions',
    interestRate: '8.0% - 9.5% p.a. (Collateral-free micro enterprise credit)',
    maxLimit: 'Shishu (up to ₹50,000), Kishore (₹50k - ₹5L), Tarun (₹5L - ₹10L)',
    tenure: '3 to 5 Years',
    suitablePurposes: ['dairy_allied', 'allied_farming', 'poultry', 'processing'],
    minScore: 50,
    officialUrl: 'https://www.mudra.org.in'
  }
];

/**
 * 1. Credit Score Component (Weight: 30%, Max Score: 30)
 */
function calculateCreditScore(profile) {
  let baseScore = 0;
  const cibil = Number(profile.cibilScore || profile.cibil_score);

  if (!isNaN(cibil) && cibil >= 300 && cibil <= 900) {
    if (cibil >= 750) baseScore = 100;
    else if (cibil >= 700) baseScore = 86.7; // ~26/30
    else if (cibil >= 650) baseScore = 73.3; // ~22/30
    else if (cibil >= 600) baseScore = 53.3; // ~16/30
    else baseScore = 30.0; // ~9/30
  } else {
    const status = (profile.creditStatus || profile.credit_status || 'fair').toLowerCase();
    switch (status) {
      case 'good': baseScore = 93.3; break;
      case 'fair': baseScore = 73.3; break;
      case 'limited': baseScore = 53.3; break;
      case 'poor': baseScore = 26.7; break;
      default: baseScore = 50.0;
    }
  }

  const scoreOutOf30 = Math.round((baseScore * 0.30) * 10) / 10;
  return Math.min(30, Math.max(0, Math.round(scoreOutOf30)));
}

/**
 * 2. Existing Loan & Repayment Status Component (Weight: 25%, Max Score: 25)
 */
function calculateRepaymentScore(profile) {
  let repaymentPts = 10;
  const repayment = (profile.repaymentStatus || profile.existing_loan_status || 'always_on_time').toLowerCase();

  if (repayment.includes('always') || repayment.includes('prompt') || repayment.includes('clean')) {
    repaymentPts = 15;
  } else if (repayment.includes('mostly') || repayment.includes('minor')) {
    repaymentPts = 12;
  } else if (repayment.includes('some') || repayment.includes('delay')) {
    repaymentPts = 7;
  } else if (repayment.includes('frequent') || repayment.includes('default')) {
    repaymentPts = 2;
  }

  let debtVolumePts = 10;
  const numLoans = Number(profile.existingLoansCount) || 0;
  if (numLoans === 0) debtVolumePts = 10;
  else if (numLoans === 1) debtVolumePts = 8;
  else if (numLoans === 2) debtVolumePts = 6;
  else debtVolumePts = 3;

  return Math.min(25, Math.max(0, repaymentPts + debtVolumePts));
}

/**
 * 3. Income / Repayment Capacity Component (Weight: 20%, Max Score: 20)
 */
function calculateIncomeCapacityScore(profile) {
  const annualIncome = Number(profile.agriIncome || profile.income || 150000);
  const requested = Number(profile.requestedAmount || 100000);
  const monthlyIncome = annualIncome / 12;
  const monthlyEMI = Number(profile.monthlyObligations || (requested * 0.03));

  const dti = monthlyIncome > 0 ? (monthlyEMI / monthlyIncome) : 0.5;

  let score = 10;
  if (dti <= 0.25) score = 20;
  else if (dti <= 0.40) score = 16;
  else if (dti <= 0.55) score = 12;
  else if (dti <= 0.70) score = 7;
  else score = 3;

  return Math.min(20, Math.max(0, score));
}

/**
 * 4. Land & Crop Details Component (Weight: 15%, Max Score: 15)
 */
function calculateLandCropScore(profile) {
  let landAreaPts = 5;
  const land = Number(profile.landArea || profile.land_area || 2.5);
  if (land >= 5.0) landAreaPts = 8;
  else if (land >= 2.5) landAreaPts = 7;
  else if (land >= 1.0) landAreaPts = 5;
  else landAreaPts = 3;

  let tenurePts = 4;
  const tenure = (profile.landTenure || profile.land_type || 'owner').toLowerCase();
  if (tenure.includes('owner')) tenurePts = 7;
  else if (tenure.includes('joint')) tenurePts = 6;
  else if (tenure.includes('tenant') || tenure.includes('alluvial') || tenure.includes('black')) tenurePts = 5;
  else tenurePts = 3;

  return Math.min(15, Math.max(0, landAreaPts + tenurePts));
}

/**
 * 5. Location / Other Criteria Component (Weight: 10%, Max Score: 10)
 */
function calculateLocationScore(profile) {
  let locPts = 5;
  const loc = (profile.location || profile.district || '').toLowerCase();
  // Validated agricultural banking districts receive full regional coverage
  if (loc && ['thanjavur', 'coimbatore', 'madurai', 'salem', 'erode', 'tirunelveli', 'dharmapuri', 'cuddalore'].includes(loc)) {
    locPts = 7;
  } else if (loc) {
    locPts = 6;
  }

  let waterPts = 3;
  const water = (profile.water || profile.waterSource || 'canal').toLowerCase();
  if (['canal', 'borewell', 'river'].includes(water)) waterPts = 3;
  else waterPts = 2;

  return Math.min(10, Math.max(0, locPts + waterPts));
}

/**
 * Evaluate complete loan matching score
 */
function evaluateLoanMatch(profile) {
  const creditScore = calculateCreditScore(profile);
  const repaymentScore = calculateRepaymentScore(profile);
  const incomeScore = calculateIncomeCapacityScore(profile);
  const landCropScore = calculateLandCropScore(profile);
  const locationScore = calculateLocationScore(profile);

  const totalScore = Math.min(100, Math.max(0, creditScore + repaymentScore + incomeScore + landCropScore + locationScore));

  // Determine potential loan matches based on calculated score
  const matchedProducts = LOAN_PRODUCTS.filter(p => totalScore >= p.minScore).map(p => ({
    ...p,
    matchConfidence: totalScore >= 75 ? 'HIGH' : totalScore >= 50 ? 'MODERATE' : 'LOW'
  }));

  // Generate explanatory recommendation summary
  let reason = '';
  if (totalScore >= 75) {
    reason = `Strong overall borrower profile (${totalScore}/100). Credit rating (${creditScore}/30) and repayment track record (${repaymentScore}/25) position farmer well for concessional lending such as KCC at 4.0% p.a.`;
  } else if (totalScore >= 50) {
    reason = `Satisfactory loan matching profile (${totalScore}/100). Farmer qualifies for standard priority agricultural loans with documented crop/income records.`;
  } else {
    reason = `Conditional loan match score (${totalScore}/100). Additional co-borrower endorsement or asset-backed options (e.g. Agri Gold Loan) may be advantageous.`;
  }

  return {
    farmerId: profile.farmerId || profile.farmer_id || null,
    totalMatchScore: totalScore,
    breakdown: {
      creditScore: { score: creditScore, max: 30, weight: '30%' },
      existingLoanRepayment: { score: repaymentScore, max: 25, weight: '25%' },
      repaymentCapacity: { score: incomeScore, max: 20, weight: '20%' },
      landCropDetails: { score: landCropScore, max: 15, weight: '15%' },
      locationCriteria: { score: locationScore, max: 10, weight: '10%' }
    },
    recommendationReason: reason,
    matchedLoans: matchedProducts,
    disclaimer: 'IMPORTANT: This Loan Match Score is an informational calculation model based on public agricultural lending criteria. It does not represent bank approval, a pre-approved loan, or a guaranteed credit sanction.'
  };
}

module.exports = {
  evaluateLoanMatch,
  LOAN_PRODUCTS
};
