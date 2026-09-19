/**
 * AGRI CRAFT-AI - Core AI Reasoning Engines
 * 1. AI Crop Recommendation Engine
 * 2. Computer Vision Crop Disease Detection Engine (Simulated Diagnostic Model)
 * 3. Multi-Factor Crop Risk Engine
 * 4. Government Scheme & Agricultural Loan Eligibility Matcher
 * 5. "What Should I Do Now?" Multi-Modal Action Prioritizer
 */

const AgriEngine = {
  /**
   * AI Crop Recommendation Engine
   * Evaluates agronomic suitability based on soil, season, water, irrigation, and district.
   */
  recommendCrops(inputs) {
    const { soil, season, water, irrigation, farmSize, district } = inputs;
    const allCrops = AGRI_DATA.crops;

    const scored = allCrops.map(crop => {
      let score = 50; // base score
      let reasons = [];

      // Soil compatibility (+25 points)
      if (crop.idealSoils.includes(soil)) {
        score += 25;
        reasons.push(`Optimal match with ${soil} soil type.`);
      } else {
        score -= 10;
      }

      // Season compatibility (+20 points)
      if (crop.idealSeasons.includes(season)) {
        score += 20;
        reasons.push(`Aligned with ${season.toUpperCase()} seasonal weather conditions.`);
      } else {
        score -= 15;
      }

      // Water Availability & Irrigation synergy (+15 points)
      if (crop.waterRequirement.includes('High') && (water === 'canal' || water === 'borewell')) {
        score += 15;
        reasons.push('Adequate high-capacity water source supports intensive requirement.');
      } else if (crop.waterRequirement.includes('Low') && (water === 'rainfed' || irrigation === 'rainfed')) {
        score += 20;
        reasons.push('High drought resilience makes it safe under rainfed/limited water.');
      } else if (crop.waterRequirement.includes('High') && water === 'rainfed') {
        score -= 30; // heavy penalty for water thirsty crops with rainfed only
      }

      // Drip efficiency bonus
      if (irrigation === 'drip' && (crop.id === 'tomato' || crop.id === 'sugarcane' || crop.id === 'turmeric')) {
        score += 10;
        reasons.push('Drip fertigation dramatically maximizes yield and input efficiency.');
      }

      // Cap score between 45% and 98%
      const finalScore = Math.min(98, Math.max(45, score));

      // Determine risk tier for this specific farmer's condition
      let dynamicRisk = crop.riskBaseline;
      if (score > 85) dynamicRisk = 'LOW';
      else if (score > 65) dynamicRisk = 'MODERATE';
      else dynamicRisk = 'HIGH';

      return {
        ...crop,
        suitabilityScore: finalScore,
        dynamicRisk,
        customReasons: reasons.length ? reasons : ['Moderate agronomic suitability under selected farm parameters.']
      };
    });

    // Sort by suitability score descending
    return scored.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
  },

  /**
   * Computer Vision Crop Disease Diagnostic Engine
   * Simulates deep learning leaf feature classification
   */
  detectDisease(imageIdOrKey, cropHint = '') {
    const diseaseList = AGRI_DATA.diseases;
    let match = null;

    if (imageIdOrKey) {
      match = diseaseList.find(d => d.id === imageIdOrKey);
    }
    if (!match && cropHint) {
      match = diseaseList.find(d => d.crop.toLowerCase().includes(cropHint.toLowerCase()));
    }
    // Fallback to random or healthy leaf
    if (!match) {
      match = diseaseList[Math.floor(Math.random() * diseaseList.length)];
    }

    return {
      id: match.id,
      crop: match.crop,
      crop_ta: match.crop_ta,
      diseaseName: match.diseaseName,
      diseaseName_ta: match.diseaseName_ta,
      confidence: match.confidence,
      riskLevel: match.riskLevel,
      symptoms: match.symptoms,
      symptoms_ta: match.symptoms_ta,
      organicAction: match.organicAction,
      organicAction_ta: match.organicAction_ta,
      chemicalAction: match.chemicalAction,
      chemicalAction_ta: match.chemicalAction_ta,
      preventiveAction: match.preventiveAction,
      preventiveAction_ta: match.preventiveAction_ta,
      sampleImage: match.sampleImage,
      disclaimer: 'AI disease detection is an automated preliminary evaluation. For high severity risk, verify with your Assistant Agricultural Officer (AAO) or call Kisan Call Center (1800-180-1551).'
    };
  },

  /**
   * Multi-Factor Crop Risk Engine
   * Factors: Crop Stage + Weather + Soil Moisture + Irrigation + Disease Status
   */
  calculateCropRisk(params) {
    const { cropStage = 'Vegetative', weather = 'Normal', soil = 'Alluvial', irrigation = 'drip', disease = 'None' } = params;

    let riskPoints = 15; // baseline
    let riskFactors = [];
    let actions = [];

    // Weather impact
    if (weather === 'Heavy Rain' || weather === 'Unseasonal Rain') {
      riskPoints += 30;
      riskFactors.push({
        title: 'Excessive Rainfall & Inundation Risk',
        impact: 'Risk of root rot, lodging, and anaerobic soil conditions in low-lying fields.'
      });
      actions.push('Provide drainage channels immediately to prevent water logging around root zones.');
    } else if (weather === 'Heatwave' || weather === 'Dry Spell') {
      riskPoints += 25;
      riskFactors.push({
        title: 'Moisture Stress & Heat Scorching',
        impact: 'Rapid evapotranspiration depleting root zone moisture.'
      });
      actions.push('Apply light, frequent evening irrigation or pulse drip cycles.');
    } else {
      riskFactors.push({
        title: 'Weather Conditions Favorable',
        impact: 'Temperature and sunshine hours are within optimal physiological thresholds.'
      });
    }

    // Crop Stage vulnerability
    if (cropStage === 'Flowering' || cropStage === 'Panicle / Pegging') {
      riskPoints += 15;
      riskFactors.push({
        title: 'Critical Reproductive Stage',
        impact: 'Crop is in its most sensitive water and nutrient uptake phase.'
      });
      actions.push('Avoid water stress or sudden heavy fertilizer application during flower drop/pegging.');
    } else if (cropStage === 'Maturity / Pre-Harvest') {
      riskFactors.push({
        title: 'Pre-Harvest Phase',
        impact: 'Requires dry weather for uniform ripening.'
      });
      actions.push('Withhold irrigation 10-12 days prior to scheduled cutting.');
    }

    // Irrigation factor
    if (irrigation === 'rainfed') {
      riskPoints += 20;
      riskFactors.push({
        title: 'Rainfed Dependency',
        impact: 'Vulnerable to erratic precipitation gaps.'
      });
      actions.push('Conserve moisture through organic mulching or cover crops.');
    }

    // Disease factor
    if (disease && disease !== 'None' && disease !== 'healthy_leaf') {
      riskPoints += 30;
      riskFactors.push({
        title: 'Active Pathogen / Pest Presence',
        impact: 'Spore count or pest population threatens leaf surface area and photosynthesis.'
      });
      actions.push('Apply recommended bio-fungicide or targeted low-toxicity chemical formulation.');
    }

    // Determine final tier
    let level = 'LOW';
    let color = '#2e7d32'; // green
    if (riskPoints >= 55) {
      level = 'HIGH';
      color = '#d32f2f'; // red
    } else if (riskPoints >= 30) {
      level = 'MODERATE';
      color = '#f57c00'; // orange
    }

    return {
      level,
      score: Math.min(100, riskPoints),
      color,
      factors: riskFactors,
      immediateActions: actions.length ? actions : ['Continue routine field observation and maintain scheduled moisture.']
    };
  },

  /**
   * Government Scheme Eligibility Matcher
   */
  matchSchemes(farmer) {
    const { farmSize = 2, category = 'Small', district = 'thanjavur', water = 'borewell' } = farmer;

    return AGRI_DATA.schemes.map(scheme => {
      let status = 'Likely Eligible';
      let matchNotes = [];

      if (scheme.id === 'pm_kisan') {
        status = 'Likely Eligible';
        matchNotes.push('Applicable to all verified landholding farm families.');
      } else if (scheme.id === 'pmksy_drip') {
        if (['borewell', 'open_well', 'canal'].includes(water)) {
          status = 'Likely Eligible (100% Subsidy for Small/Marginal)';
          matchNotes.push('Has verified water source. High priority for drip grant in Tamil Nadu.');
        } else {
          status = 'More Information Required';
          matchNotes.push('Requires verified irrigation source on land to approve drip subsidy.');
        }
      } else if (scheme.id === 'tn_kalaignar') {
        if (['Marginal', 'Small'].includes(category)) {
          status = 'Likely Eligible';
          matchNotes.push('Eligible for free vegetable kit, tree seedlings, and 50% tool grant.');
        } else {
          status = 'May Be Eligible';
          matchNotes.push('Community water pond desilting open to entire village panchayat.');
        }
      } else if (scheme.id === 'smam_machinery') {
        status = 'Likely Eligible';
        matchNotes.push('Subsidy (40-50%) available for power tiller, rotavator, or knapsack sprayer.');
      } else if (scheme.id === 'pmfby') {
        status = 'Likely Eligible';
        matchNotes.push('Covers notified crops in your district at nominal 1.5% - 2% premium.');
      }

      return {
        ...scheme,
        eligibilityStatus: status,
        matchNotes
      };
    });
  },

  /**
   * Agricultural Loan Finder & Calculator
   */
  matchLoans(farmer, requirements = {}) {
    const { requiredAmount = 150000, purpose = 'crop_cultivation' } = requirements;

    return AGRI_DATA.loans.map(loan => {
      let relevance = 'High Match';
      let emiEstimate = 'N/A';

      if (loan.id === 'kcc') {
        relevance = 'Best for Crop Cultivation (Subsidized 4%)';
        // Calculate annual interest at 4%
        const interest = (requiredAmount * 0.04).toFixed(0);
        emiEstimate = `Annual Repayment: ₹${(Number(requiredAmount) + Number(interest)).toLocaleString('en-IN')} (Prompt repayment saves ₹${(requiredAmount * 0.03).toFixed(0)}/yr)`;
      } else if (loan.id === 'sbi_gold') {
        relevance = 'Fastest Disbursement (1-2 Hours)';
        emiEstimate = `Monthly Interest: ~₹${((requiredAmount * 0.0725) / 12).toFixed(0)} @ 7.25% p.a.`;
      } else if (loan.id === 'tractor_equipment') {
        relevance = purpose === 'farm_machinery' ? 'High Match' : 'Medium Match';
        emiEstimate = `Estimated 5-Year Monthly EMI: ~₹${((requiredAmount * 1.25) / 60).toFixed(0)}`;
      } else if (loan.id === 'mudra_shishu_tarun') {
        relevance = purpose === 'allied_dairy' ? 'High Match' : 'General Allied';
        emiEstimate = `3-Year Monthly EMI: ~₹${((requiredAmount * 1.18) / 36).toFixed(0)}`;
      }

      return {
        ...loan,
        relevance,
        emiEstimate
      };
    });
  },

  /**
   * "What Should I Do Now?" Top Priority AI Action Synthesizer
   * Returns top priority recommendation card + 4 immediate action items
   */
  getTopPriorityActions(farmer, riskReport, diseaseReport, currentCrop) {
    let topAction = {
      title: 'Maintain Scheduled Soil Moisture & Monitor Canopy',
      title_ta: 'மண் ஈரப்பதத்தை பராமரித்து பயிரை கண்காணிக்கவும்',
      urgency: 'Routine (Next 48 Hours)',
      urgency_ta: 'வழக்கமான பணி (அடுத்த 48 மணி நேரத்தில்)',
      badgeClass: 'badge-low',
      description: `Your ${currentCrop || 'crop'} is progressing well. Keep irrigation consistent and inspect leaf undersides for early sucking pest colonies.`
    };

    let nextSteps = [
      {
        icon: '💧',
        text: 'Irrigate via drip or channel based on current 31°C weather forecast.',
        text_ta: 'தற்போதைய 31°C வெப்பநிலைக்கேற்ப சொட்டு நீர் அல்லது பாசனம் செய்யவும்.'
      },
      {
        icon: '🛡️',
        text: 'Review PMFBY crop insurance cutoff date for this season at PACCS branch.',
        text_ta: 'தொடக்க வேளாண்மை கூட்டுறவு வங்கியில் பயிர் காப்பீடு காலக்கெடுவை சரிபார்க்கவும்.'
      },
      {
        icon: '💰',
        text: 'KCC annual renewal eligible for 3% prompt repayment interest subvention.',
        text_ta: 'KCC கடனை உரிய காலத்தில் திருப்பிச் செலுத்தி 3% வட்டி தள்ளுபடி பெறவும்.'
      },
      {
        icon: '📈',
        text: 'Thanjavur & Madurai mandi prices are up +1.7% to +10.6% this week.',
        text_ta: 'தஞ்சை மற்றும் மதுரை சந்தைகளில் விலை +1.7% முதல் +10.6% வரை உயர்ந்துள்ளது.'
      }
    ];

    // Override if high risk disease or weather
    if (diseaseReport && diseaseReport.riskLevel === 'HIGH') {
      topAction = {
        title: `URGENT: Treat ${diseaseReport.diseaseName} to Prevent Yield Loss`,
        title_ta: `அவசரம்: மகசூல் இழப்பை தடுக்க ${diseaseReport.diseaseName_ta} நோயை கட்டுப்படுத்தவும்`,
        urgency: 'Immediate (Within 24 Hours)',
        urgency_ta: 'உடனடி நடவடிக்கை (24 மணி நேரத்திற்குள்)',
        badgeClass: 'badge-high',
        description: diseaseReport.organicAction
      };
      nextSteps[0] = {
        icon: '⚠️',
        text: `Apply bio-formulation: ${diseaseReport.organicAction}`,
        text_ta: `மருந்து தெளிக்கவும்: ${diseaseReport.organicAction_ta}`
      };
    } else if (riskReport && riskReport.level === 'HIGH') {
      topAction = {
        title: 'High Environmental Risk Detected: Action Required',
        title_ta: 'சுற்றுச்சூழல் இடர் கண்டறியப்பட்டுள்ளது: உடனடி நடவடிக்கை தேவை',
        urgency: 'Action within 24 Hours',
        urgency_ta: '24 மணி நேரத்திற்குள் நடவடிக்கை',
        badgeClass: 'badge-high',
        description: riskReport.immediateActions[0] || 'Provide immediate field drainage or protective moisture cover.'
      };
    }

    return {
      topAction,
      nextSteps
    };
  }
};

// Export for browser
if (typeof window !== 'undefined') {
  window.AgriEngine = AgriEngine;
}
