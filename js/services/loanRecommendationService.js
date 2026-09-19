/**
 * AGRI CRAFT-AI - Farmer Loan Recommendation Service (loanRecommendationService.js)
 * 
 * Transparent, weighted loan-matching calculation model.
 * Evaluates farmer profile data against official agricultural lending guidelines.
 * 
 * Weights (Strictly 100% Total):
 *   1. Credit history / CIBIL:           30% (Max 30 pts)
 *   2. Existing loans & repayment status: 25% (Max 25 pts)
 *   3. Income / repayment capacity:      20% (Max 20 pts)
 *   4. Land & crop details:              15% (Max 15 pts)
 *   5. Location / other criteria:        10% (Max 10 pts)
 * 
 * IMPORTANT: This model outputs a "Loan Match Score" (0–100) and "Potential Loan Matches".
 * It is an informational matching tool and does NOT represent bank approval or a guaranteed credit decision.
 */

(function(window) {
  'use strict';

  // Verified Agricultural Loan Products and Reference Criteria
  const VERIFIED_LOAN_PRODUCTS = [
    {
      id: 'kcc',
      name: 'Kisan Credit Card (KCC) Scheme',
      name_ta: 'கிசான் கிரெடிட் கார்டு (KCC)',
      provider: 'NABARD / Commercial Banks / RRBs / Cooperative Banks',
      provider_ta: 'நபார்டு / தேசியமயமாக்கப்பட்ட வங்கிகள் / கூட்டுறவு வங்கிகள்',
      purpose: 'Crop cultivation, seasonal agricultural inputs, post-harvest expenses, farm asset maintenance',
      purpose_ta: 'பயிர் சாகுபடி, இடுபொருட்கள், அறுவடை பின்செலவுகள், பண்ணை பராமரிப்பு',
      interestRate: '4.0% p.a. (with prompt repayment incentive; 7% baseline)',
      maxLimit: 'Up to ₹3,00,000 (collateral-free up to ₹1,60,000)',
      targetCategory: ['Marginal', 'Small', 'Medium', 'Large'],
      tenureSuitability: ['owner', 'joint', 'tenant', 'sharecropper'],
      suitablePurposes: ['crop_cultivation', 'farm_inputs', 'seasonal'],
      minScore: 45,
      requiredDocuments: [
        'Identity Proof (Aadhaar card / Voter ID)',
        'Land Ownership Record (Patta / Chitta / RoR) or Registered Tenant Agreement',
        'Crop Cultivation Certificate / Sowing Adangal from Village Administrative Officer (VAO)',
        'Bank Account Passbook (Aadhaar linked)',
        '2 Passport-size Photographs'
      ],
      officialUrl: 'https://pib.gov.in/PressReleasePage.aspx?PRID=1908241',
      matchCriteriaRules: {
        matchesTenure: (tenure) => ['owner', 'joint', 'tenant', 'sharecropper'].includes(tenure),
        matchesIncome: (dti) => dti <= 0.70,
        matchesCredit: (credScore) => credScore >= 12
      }
    },
    {
      id: 'sbi_gold',
      name: 'Agricultural Gold Loan',
      name_ta: 'விவசாய தங்கக் கடன்',
      provider: 'State Bank of India / Public Sector Commercial Banks',
      provider_ta: 'ஸ்டேட் பாங்க் ஆஃப் இந்தியா / பொதுத்துறை வங்கிகள்',
      purpose: 'Immediate emergency liquidity, seeds, fertilizers, urgent farm equipment repairs, labour wages',
      purpose_ta: 'உடனடி இடுபொருள் கொள்முதல், உரம், அவசர பராமரிப்பு, கூலி செலவுகள்',
      interestRate: '7.0% - 7.5% p.a. (Concessional agricultural lending rate)',
      maxLimit: 'Up to ₹25,00,000 (75% Loan-to-Value of gold pledged)',
      targetCategory: ['Marginal', 'Small', 'Medium', 'Large'],
      tenureSuitability: ['owner', 'joint', 'tenant', 'sharecropper'],
      suitablePurposes: ['emergency_inputs', 'crop_cultivation', 'general_agri'],
      minScore: 40,
      requiredDocuments: [
        'Identity & Address Proof (Aadhaar / PAN card)',
        'Agricultural land cultivation proof (Patta / Chitta or Crop cultivation receipt)',
        'Self-declaration of agricultural purpose',
        'Gold ornaments for bank appraisal'
      ],
      officialUrl: 'https://sbi.co.in/web/agri-rural/agriculture-banking/agri-gold-loan',
      matchCriteriaRules: {
        matchesTenure: () => true, // Gold acts as physical security
        matchesIncome: () => true,
        matchesCredit: (credScore) => credScore >= 10
      }
    },
    {
      id: 'tractor_equipment',
      name: 'Farm Mechanization & Tractor Loan',
      name_ta: 'விவசாய டிராக்டர் மற்றும் உபகரண கடன்',
      provider: 'Commercial Banks / NABARD Refinanced Facilities',
      provider_ta: 'வணிக வங்கிகள் / நபார்டு மறுநிதியளிப்பு',
      purpose: 'Purchase of new tractor, power tiller, drone sprayer, rotavator, or harvester',
      purpose_ta: 'புதிய டிராக்டர், பவர் டில்லர், ட்ரோன் தெளிப்பான், அறுவடை இயந்திரம் வாங்குதல்',
      interestRate: '8.5% - 9.75% p.a. (Repayment term 5 to 7 years)',
      maxLimit: 'Up to 85% - 90% of equipment invoice value',
      targetCategory: ['Small', 'Medium', 'Large'],
      tenureSuitability: ['owner', 'joint'],
      suitablePurposes: ['machinery', 'equipment', 'irrigation'],
      minScore: 60,
      requiredDocuments: [
        'Aadhaar and PAN Card',
        'Verified Land Records showing minimum 2 acres irrigated holding',
        'Official quotation / proforma invoice from authorized equipment dealer',
        'Last 6 months bank statement showing regular cash flow',
        'Income Certificate / Revenue declaration'
      ],
      officialUrl: 'https://www.nabard.org',
      matchCriteriaRules: {
        matchesTenure: (tenure) => ['owner', 'joint'].includes(tenure),
        matchesIncome: (dti) => dti <= 0.55,
        matchesCredit: (credScore) => credScore >= 18
      }
    },
    {
      id: 'mudra_shishu_tarun',
      name: 'Pradhan Mantri MUDRA Yojana (Agri-Allied)',
      name_ta: 'பிரதான் மந்திரி முத்ரா திட்டம் (வேளாண் சார்ந்த தொழில்)',
      provider: 'Public Sector Banks / Regional Rural Banks / Microfinance Institutions',
      provider_ta: 'பொதுத்துறை வங்கிகள் / RRBs / மைக்ரோஃபைனான்ஸ்',
      purpose: 'Dairy farming, poultry, sheep/goat rearing, honeybee farming, post-harvest packaging units',
      purpose_ta: 'பால் பண்ணை, கோழி வளர்ப்பு, ஆடு வளர்ப்பு, தேனீ வளர்ப்பு, வேளாண் பதப்படுத்துதல்',
      interestRate: '8.0% - 9.5% p.a. (Collateral-free micro enterprise credit)',
      maxLimit: 'Shishu (up to ₹50,000), Kishore (₹50,000 - ₹5,00,000), Tarun (₹5,00,000 - ₹10,00,000)',
      targetCategory: ['Marginal', 'Small', 'Medium'],
      tenureSuitability: ['owner', 'joint', 'tenant', 'sharecropper'],
      suitablePurposes: ['dairy_allied', 'allied_farming', 'poultry', 'processing'],
      minScore: 50,
      requiredDocuments: [
        'Identity and Address Proof (Aadhaar / Voter ID)',
        'Proof of agricultural or allied enterprise activity',
        'Detailed cost quotation / project estimate for livestock or equipment',
        'Bank statement for previous 6 months'
      ],
      officialUrl: 'https://www.mudra.org.in',
      matchCriteriaRules: {
        matchesTenure: () => true,
        matchesIncome: (dti) => dti <= 0.65,
        matchesCredit: (credScore) => credScore >= 14
      }
    }
  ];

  /**
   * Validate required profile inputs.
   * If mandatory information is missing, do not invent a score!
   */
  function validateProfile(profile) {
    const missing = [];

    if (!profile) {
      return { isValid: false, missingFields: ['Complete loan profile'] };
    }

    // Check Credit History
    const hasCibil = profile.cibilScore !== undefined && profile.cibilScore !== null && profile.cibilScore !== '';
    const hasCreditStatus = profile.creditStatus !== undefined && profile.creditStatus !== null && profile.creditStatus !== '';
    if (!hasCibil && !hasCreditStatus) {
      missing.push('Credit History / CIBIL');
    }

    // Check Existing Loans / Repayment
    if (!profile.repaymentStatus) {
      missing.push('Repayment Status on Existing Loans');
    }

    // Check Income / Repayment Capacity
    const agriIncome = Number(profile.agriIncome);
    if (isNaN(agriIncome) || agriIncome <= 0) {
      missing.push('Documented Agricultural Income');
    }

    const requestedAmount = Number(profile.requestedAmount);
    if (isNaN(requestedAmount) || requestedAmount <= 0) {
      missing.push('Requested Loan Amount');
    }

    // Check Land & Crop Details
    const landArea = Number(profile.landArea);
    if (isNaN(landArea) || landArea <= 0) {
      missing.push('Land Area (in Acres)');
    }
    if (!profile.landTenure) {
      missing.push('Land Ownership / Tenancy Status');
    }

    // Check Location
    if (!profile.state || !profile.district) {
      missing.push('State & District');
    }

    return {
      isValid: missing.length === 0,
      missingFields: missing
    };
  }

  /**
   * 1. Credit Score Component (Weight: 30%, Max Score: 30)
   */
  function calculateCreditScore(profile) {
    let baseScore = 0; // 0 to 100
    const cibil = Number(profile.cibilScore);

    if (!isNaN(cibil) && cibil >= 300 && cibil <= 900) {
      if (cibil >= 750) {
        baseScore = 100;
      } else if (cibil >= 700) {
        baseScore = 86.7; // ~26/30
      } else if (cibil >= 650) {
        baseScore = 73.3; // ~22/30
      } else if (cibil >= 600) {
        baseScore = 53.3; // ~16/30
      } else {
        baseScore = 30.0; // ~9/30
      }
    } else {
      // Use qualitative credit history status
      const status = (profile.creditStatus || '').toLowerCase();
      switch (status) {
        case 'good':
          baseScore = 93.3; // ~28/30
          break;
        case 'fair':
          baseScore = 73.3; // ~22/30
          break;
        case 'limited':
          baseScore = 53.3; // ~16/30 - baseline for new-to-credit rural borrowers
          break;
        case 'poor':
          baseScore = 26.7; // ~8/30
          break;
        default:
          baseScore = 50.0;
      }
    }

    // Component weight: 30%
    const scoreOutOf30 = Math.round((baseScore * 0.30) * 10) / 10;
    return {
      basePercentage: baseScore,
      score: Math.min(30, Math.max(0, Math.round(scoreOutOf30))),
      max: 30,
      weight: 30,
      statusLabel: baseScore >= 80 ? 'Good' : baseScore >= 60 ? 'Fair' : baseScore >= 45 ? 'Limited' : 'Needs Attention'
    };
  }

  /**
   * 2. Existing Loan & Repayment Status Component (Weight: 25%, Max Score: 25)
   */
  function calculateLoanRepaymentScore(profile) {
    // Sub-factor A: Repayment track record (60% of component = 15 pts max)
    let repaymentPts = 0;
    const repayment = (profile.repaymentStatus || 'always_on_time').toLowerCase();
    switch (repayment) {
      case 'always_on_time':
        repaymentPts = 15;
        break;
      case 'mostly_on_time':
        repaymentPts = 12;
        break;
      case 'some_delays':
        repaymentPts = 7;
        break;
      case 'frequently_delayed':
        repaymentPts = 2;
        break;
      default:
        repaymentPts = 10;
    }

    // Sub-factor B: Active loan volume and balance (40% of component = 10 pts max)
    let debtVolumePts = 10;
    const numLoans = Number(profile.existingLoansCount) || 0;
    const outstanding = Number(profile.outstandingAmount) || 0;
    const annualAgri = Number(profile.agriIncome) || 100000;

    if (numLoans === 0) {
      debtVolumePts = 10; // Debt-free
    } else if (numLoans === 1) {
      debtVolumePts = outstanding < (annualAgri * 0.4) ? 9 : 7;
    } else if (numLoans === 2) {
      debtVolumePts = outstanding < (annualAgri * 0.6) ? 7 : 5;
    } else {
      debtVolumePts = 3; // Multiple existing encumbrances
    }

    const totalScore = repaymentPts + debtVolumePts;
    return {
      score: Math.min(25, Math.max(0, totalScore)),
      max: 25,
      weight: 25,
      repaymentPart: repaymentPts,
      debtVolumePart: debtVolumePts
    };
  }

  /**
   * 3. Income / Repayment Capacity Component (Weight: 20%, Max Score: 20)
   */
  function calculateRepaymentCapacityScore(profile) {
    const agriAnnual = Number(profile.agriIncome) || 0;
    const otherMonthly = Number(profile.otherIncomeMonthly) || 0;
    const totalMonthlyIncome = (agriAnnual / 12) + otherMonthly;

    const existingMonthlyEMI = Number(profile.monthlyObligations) || 0;
    const requestedAmount = Number(profile.requestedAmount) || 100000;

    // Approximate monthly amortized burden of requested loan (7% nominal rate, 3-year illustrative repayment)
    const estimatedNewEMI = (requestedAmount * 1.10) / 36;
    const totalObligations = existingMonthlyEMI + estimatedNewEMI;

    const dtiRatio = totalMonthlyIncome > 0 ? (totalObligations / totalMonthlyIncome) : 1.0;

    let score = 0;
    if (dtiRatio <= 0.30) {
      score = 20; // High repayment headroom
    } else if (dtiRatio <= 0.45) {
      score = 17; // Strong capacity
    } else if (dtiRatio <= 0.60) {
      score = 13; // Moderate capacity
    } else if (dtiRatio <= 0.75) {
      score = 8;  // Stretched capacity
    } else {
      score = 4;  // High debt burden relative to income
    }

    return {
      score: Math.min(20, Math.max(0, score)),
      max: 20,
      weight: 20,
      dtiRatio: Math.round(dtiRatio * 100),
      monthlyIncome: Math.round(totalMonthlyIncome),
      totalMonthlyObligations: Math.round(totalObligations)
    };
  }

  /**
   * 4. Land & Crop Details Component (Weight: 15%, Max Score: 15)
   */
  function calculateLandCropScore(profile) {
    // Factor A: Ownership/tenancy status (Max 6 pts)
    let tenurePts = 0;
    const tenure = (profile.landTenure || 'owner').toLowerCase();
    switch (tenure) {
      case 'owner':
        tenurePts = 6;
        break;
      case 'joint':
        tenurePts = 5.2;
        break;
      case 'tenant':
        tenurePts = 4.5; // Eligible under KCC & RBI rural guidelines with tenancy record
        break;
      case 'sharecropper':
        tenurePts = 3.5;
        break;
      default:
        tenurePts = 4.0;
    }

    // Factor B: Irrigation status (Max 4.5 pts)
    let irrigationPts = 0;
    const irrigation = (profile.irrigation || 'canal').toLowerCase();
    if (['canal', 'borewell', 'drip', 'sprinkler'].includes(irrigation)) {
      irrigationPts = 4.5;
    } else if (irrigation === 'open_well') {
      irrigationPts = 3.8;
    } else {
      irrigationPts = 2.5; // Rainfed
    }

    // Factor C: Cropping pattern & yield continuity (Max 4.5 pts)
    let croppingPts = 0;
    const pattern = (profile.croppingPattern || 'double').toLowerCase();
    if (['double', 'multi', 'intercrop'].includes(pattern)) {
      croppingPts = 4.5; // Multi-season cash flow
    } else {
      croppingPts = 3.3; // Single season mono-crop
    }

    const total = Math.round(tenurePts + irrigationPts + croppingPts);
    return {
      score: Math.min(15, Math.max(0, total)),
      max: 15,
      weight: 15,
      tenurePts: Math.round(tenurePts * 10) / 10,
      irrigationPts: Math.round(irrigationPts * 10) / 10,
      croppingPts: Math.round(croppingPts * 10) / 10
    };
  }

  /**
   * 5. Location & Scheme-Specific Criteria Component (Weight: 10%, Max Score: 10)
   */
  function calculateLocationScore(profile) {
    // Factor A: Agrarian Priority District (Max 5 pts)
    const district = (profile.district || '').toLowerCase();
    // Major recognized agrarian districts with active lead bank credit allocations
    const priorityAgriDistricts = [
      'thanjavur', 'thiruvarur', 'nagapattinam', 'mayiladuthurai', 
      'madurai', 'erode', 'salem', 'dharmapuri', 'coimbatore', 'tiruchirappalli'
    ];
    const geoPts = priorityAgriDistricts.includes(district) ? 5 : 4;

    // Factor B: Scheme & Subvention Priority Classification (Max 5 pts)
    const category = (profile.farmerCategory || 'Small');
    let categoryPts = 4;
    if (category === 'Marginal' || category === 'Small') {
      // 100% target focus of central interest subvention scheme (Govt 3% prompt incentive)
      categoryPts = 5;
    } else if (category === 'Medium') {
      categoryPts = 4.2;
    } else {
      categoryPts = 3.5;
    }

    const total = Math.round(geoPts + categoryPts);
    return {
      score: Math.min(10, Math.max(0, total)),
      max: 10,
      weight: 10,
      geoPts,
      categoryPts: Math.round(categoryPts * 10) / 10
    };
  }

  /**
   * Master Calculation Function: Computes exact 5 weighted components and final score
   */
  function calculateLoanMatchScore(profile) {
    const validation = validateProfile(profile);
    if (!validation.isValid) {
      return {
        isValid: false,
        error: 'More information required',
        missingFields: validation.missingFields
      };
    }

    const creditComp = calculateCreditScore(profile);
    const loanRepaymentComp = calculateLoanRepaymentScore(profile);
    const repaymentCapacityComp = calculateRepaymentCapacityScore(profile);
    const landCropComp = calculateLandCropScore(profile);
    const locationComp = calculateLocationScore(profile);

    // Sum of exact weights: 30 + 25 + 20 + 15 + 10 = 100
    const totalScore = creditComp.score + 
                       loanRepaymentComp.score + 
                       repaymentCapacityComp.score + 
                       landCropComp.score + 
                       locationComp.score;

    return {
      isValid: true,
      totalScore: Math.min(100, Math.max(0, totalScore)),
      maxTotal: 100,
      breakdown: {
        credit: creditComp,
        existingLoans: loanRepaymentComp,
        repaymentCapacity: repaymentCapacityComp,
        landCrop: landCropComp,
        location: locationComp
      },
      explanation: getScoreExplanation(),
      suggestions: getImprovementSuggestions({
        credit: creditComp,
        existingLoans: loanRepaymentComp,
        repaymentCapacity: repaymentCapacityComp,
        landCrop: landCropComp,
        location: locationComp
      })
    };
  }

  /**
   * Explanations for "Why did I get this score?"
   */
  function getScoreExplanation() {
    return [
      {
        factor: 'Credit history',
        weight: '30%',
        description: 'Your credit history contributes 30% of the matching score. Lenders evaluate past credit discipline and bureau track records to gauge future reliability.'
      },
      {
        factor: 'Existing loans',
        weight: '25%',
        description: 'Your current loan obligations and repayment history contribute 25%. A clean record of on-time payments with manageable existing debt boosts lender confidence.'
      },
      {
        factor: 'Income / repayment capacity',
        weight: '20%',
        description: 'Your income and estimated ability to repay contribute 20%. Compares your documented farm cash flow against existing and requested monthly commitments.'
      },
      {
        factor: 'Land & crop details',
        weight: '15%',
        description: 'Your agricultural land and crop information contribute 15%. Validates cultivable acreage, irrigation availability, and multi-season crop security.'
      },
      {
        factor: 'Location / other criteria',
        weight: '10%',
        description: 'Location and lender/scheme-specific criteria contribute 10%. Accounts for district banking networks and special priority categories like Small/Marginal subventions.'
      }
    ];
  }

  /**
   * Neutral "Things to check" improvement suggestions
   */
  function getImprovementSuggestions(breakdown) {
    const suggestions = [];

    // Check Repayment Capacity (Max 20)
    if (breakdown.repaymentCapacity && breakdown.repaymentCapacity.score < 15) {
      suggestions.push({
        title: 'Repayment Capacity Considerations',
        component: 'Income / Repayment Capacity',
        scoreInfo: `${breakdown.repaymentCapacity.score} / 20`,
        items: [
          'Review existing monthly obligations and active EMI commitments.',
          'Consider adjusting the requested loan amount to better align with current seasonal cash flow.',
          'Ensure all sources of agricultural income (secondary crops, dairy, allied sales) are fully documented.'
        ]
      });
    }

    // Check Existing Loans (Max 25)
    if (breakdown.existingLoans && breakdown.existingLoans.score < 18) {
      suggestions.push({
        title: 'Existing Debt Load Review',
        component: 'Existing Loans & Repayment Status',
        scoreInfo: `${breakdown.existingLoans.score} / 25`,
        items: [
          'Verify that past seasonal loans have no pending overdue interest charges.',
          'Closing smaller short-term borrowings can lower overall debt encumbrance before applying for new credit.'
        ]
      });
    }

    // Check Credit History (Max 30)
    if (breakdown.credit && breakdown.credit.score < 20) {
      suggestions.push({
        title: 'Credit History Considerations',
        component: 'Credit History',
        scoreInfo: `${breakdown.credit.score} / 30`,
        items: [
          'Check your official credit report for any reporting discrepancies or outdated overdue notices.',
          'If you have limited credit history, formal institutional loans like KCC provide an established pathway to build your score.'
        ]
      });
    }

    // Check Land & Crop (Max 15)
    if (breakdown.landCrop && breakdown.landCrop.score < 11) {
      suggestions.push({
        title: 'Land & Tenancy Documentation',
        component: 'Land & Crop Details',
        scoreInfo: `${breakdown.landCrop.score} / 15`,
        items: [
          'If farming as a tenant or sharecropper, maintain an updated signed tenancy agreement or revenue cultivation certificate.',
          'Keep latest Patta/Chitta and village sowing records (Adangal) readily accessible for lender verification.'
        ]
      });
    }

    return suggestions;
  }

  /**
   * Match farmer profile with verified agricultural loan products
   */
  function getLoanRecommendations(profile, matchScoreResult) {
    if (!matchScoreResult || !matchScoreResult.isValid) {
      return [];
    }

    const totalScore = matchScoreResult.totalScore;
    const breakdown = matchScoreResult.breakdown;
    const requestedPurpose = (profile.loanPurpose || 'crop_cultivation').toLowerCase();
    const tenure = (profile.landTenure || 'owner').toLowerCase();

    return VERIFIED_LOAN_PRODUCTS.map(product => {
      let matchPct = totalScore;
      const reasons = [];

      // Product-specific affinity adjustments
      if (product.id === 'kcc') {
        if (['crop_cultivation', 'farm_inputs', 'seasonal'].includes(requestedPurpose)) {
          matchPct = Math.min(96, matchPct + 8);
          reasons.push('Directly designed for crop cultivation and seasonal farm inputs');
        }
        if (['Marginal', 'Small'].includes(profile.farmerCategory)) {
          reasons.push('Eligible for subsidized 4% effective interest under government prompt repayment incentive');
        }
        if (['owner', 'joint', 'tenant', 'sharecropper'].includes(tenure)) {
          reasons.push('Open to owner-cultivators, joint farmers, and tenant cultivators');
        }
        reasons.push('Collateral-free up to ₹1,60,000 for standard agricultural operations');
      } 
      else if (product.id === 'sbi_gold') {
        matchPct = Math.min(94, matchPct + 5);
        reasons.push('Fastest processing with instant valuation against pledged gold');
        reasons.push('Concessional agricultural rate (7.0% - 7.5% p.a.) for farming activities');
        reasons.push('Flexible seasonal repayment aligned with crop harvest cycles');
      }
      else if (product.id === 'tractor_equipment') {
        if (['machinery', 'equipment', 'irrigation', 'tractor'].includes(requestedPurpose)) {
          matchPct = Math.min(92, matchPct + 10);
          reasons.push('Customized asset financing for tractors and mechanized farm implements');
        } else {
          matchPct = Math.max(30, matchPct - 15);
        }
        if (Number(profile.landArea) >= 2) {
          reasons.push('Meets standard 2-acre cultivable land guideline for tractor loans');
        } else {
          reasons.push('May require joint co-applicant or custom equipment sub-limit for small holdings');
        }
      }
      else if (product.id === 'mudra_shishu_tarun') {
        if (['dairy', 'allied', 'poultry', 'dairy_allied'].includes(requestedPurpose)) {
          matchPct = Math.min(95, matchPct + 10);
          reasons.push('Dedicated micro-credit window for dairy, poultry, and rural micro-enterprise');
        }
        reasons.push('No collateral or third-party guarantee required for amounts up to ₹10 Lakhs');
        reasons.push('Provides formal banking credit access for small and tenant producers');
      }

      return {
        ...product,
        potentialMatchPercent: Math.min(99, Math.max(25, matchPct)),
        matchReasons: reasons,
        disclaimerNotice: "Loan information is currently based on verified reference data. Check the official lender before applying."
      };
    }).sort((a, b) => b.potentialMatchPercent - a.potentialMatchPercent);
  }

  /**
   * Built-in Sample Profiles for testing all prompt edge-cases
   */
  function getSampleProfiles() {
    return {
      strong: {
        label: 'Case 1: Strong Credit + Steady Income',
        cibilScore: 780,
        creditStatus: 'good',
        existingLoansCount: 0,
        outstandingAmount: 0,
        monthlyObligations: 0,
        repaymentStatus: 'always_on_time',
        agriIncome: 360000,
        otherIncomeMonthly: 12000,
        requestedAmount: 150000,
        loanPurpose: 'crop_cultivation',
        landTenure: 'owner',
        landArea: 3.5,
        crop: 'Paddy',
        croppingPattern: 'double',
        irrigation: 'canal',
        state: 'Tamil Nadu',
        district: 'thanjavur',
        farmerCategory: 'Small'
      },
      average_with_loans: {
        label: 'Case 2: Average Credit + Existing Loans',
        cibilScore: 680,
        creditStatus: 'fair',
        existingLoansCount: 2,
        outstandingAmount: 85000,
        monthlyObligations: 4200,
        repaymentStatus: 'mostly_on_time',
        agriIncome: 240000,
        otherIncomeMonthly: 3000,
        requestedAmount: 120000,
        loanPurpose: 'crop_cultivation',
        landTenure: 'owner',
        landArea: 2.0,
        crop: 'Cotton',
        croppingPattern: 'single',
        irrigation: 'borewell',
        state: 'Tamil Nadu',
        district: 'erode',
        farmerCategory: 'Small'
      },
      limited_credit: {
        label: 'Case 3: Limited / No Credit History',
        cibilScore: '',
        creditStatus: 'limited',
        existingLoansCount: 0,
        outstandingAmount: 0,
        monthlyObligations: 0,
        repaymentStatus: 'always_on_time',
        agriIncome: 180000,
        otherIncomeMonthly: 2000,
        requestedAmount: 80000,
        loanPurpose: 'crop_cultivation',
        landTenure: 'joint',
        landArea: 1.8,
        crop: 'Paddy',
        croppingPattern: 'double',
        irrigation: 'canal',
        state: 'Tamil Nadu',
        district: 'thiruvarur',
        farmerCategory: 'Small'
      },
      low_capacity: {
        label: 'Case 4: Low Repayment Capacity',
        cibilScore: 620,
        creditStatus: 'fair',
        existingLoansCount: 2,
        outstandingAmount: 120000,
        monthlyObligations: 9000,
        repaymentStatus: 'some_delays',
        agriIncome: 120000,
        otherIncomeMonthly: 0,
        requestedAmount: 200000,
        loanPurpose: 'crop_cultivation',
        landTenure: 'owner',
        landArea: 1.5,
        crop: 'Millets',
        croppingPattern: 'single',
        irrigation: 'rainfed',
        state: 'Tamil Nadu',
        district: 'dharmapuri',
        farmerCategory: 'Marginal'
      },
      tenant_farmer: {
        label: 'Case 6: Tenant Farmer',
        cibilScore: 710,
        creditStatus: 'good',
        existingLoansCount: 0,
        outstandingAmount: 0,
        monthlyObligations: 1000,
        repaymentStatus: 'always_on_time',
        agriIncome: 200000,
        otherIncomeMonthly: 5000,
        requestedAmount: 100000,
        loanPurpose: 'crop_cultivation',
        landTenure: 'tenant',
        landArea: 2.5,
        crop: 'Paddy',
        croppingPattern: 'double',
        irrigation: 'canal',
        state: 'Tamil Nadu',
        district: 'nagapattinam',
        farmerCategory: 'Small'
      },
      missing_info: {
        label: 'Case 7: Incomplete Profile (Missing Info)',
        cibilScore: '',
        creditStatus: '',
        existingLoansCount: 0,
        outstandingAmount: 0,
        monthlyObligations: 0,
        repaymentStatus: '',
        agriIncome: 0,
        otherIncomeMonthly: 0,
        requestedAmount: 0,
        loanPurpose: 'crop_cultivation',
        landTenure: '',
        landArea: 0,
        crop: '',
        croppingPattern: '',
        irrigation: '',
        state: '',
        district: '',
        farmerCategory: ''
      }
    };
  }

  // Expose service globally
  window.LoanRecommendationService = {
    calculateLoanMatchScore,
    calculateCreditScore,
    calculateLoanRepaymentScore,
    calculateRepaymentCapacityScore,
    calculateLandCropScore,
    calculateLocationScore,
    getLoanRecommendations,
    getScoreExplanation,
    getImprovementSuggestions,
    getSampleProfiles,
    validateProfile
  };

})(window);
