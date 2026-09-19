/**
 * AGRI CRAFT-AI - Comprehensive Data Store & Knowledge Base
 * Contains agronomy facts, government schemes, agricultural loans,
 * market prices, crop disease database, helplines, and bilingual translations (English & Tamil).
 */

const AGRI_DATA = {
  // Available districts in Tamil Nadu & South India with GPS coordinates for Open-Meteo live sync
  districts: [
    { id: 'thanjavur', name: 'Thanjavur', name_ta: 'தஞ்சாவூர்', defaultSoil: 'Alluvial', waterZone: 'High', lat: 10.7870, lon: 79.1378 },
    { id: 'coimbatore', name: 'Coimbatore', name_ta: 'கோயம்புத்தூர்', defaultSoil: 'Red Loam', waterZone: 'Moderate', lat: 11.0168, lon: 76.9558 },
    { id: 'madurai', name: 'Madurai', name_ta: 'மதுரை', defaultSoil: 'Black Clay', waterZone: 'Moderate', lat: 9.9252, lon: 78.1198 },
    { id: 'salem', name: 'Salem', name_ta: 'சேலம்', defaultSoil: 'Red Soil', waterZone: 'Moderate', lat: 11.6643, lon: 78.1460 },
    { id: 'erode', name: 'Erode', name_ta: 'ஈரோடு', defaultSoil: 'Black Soil', waterZone: 'High', lat: 11.3410, lon: 77.7172 },
    { id: 'tirunelveli', name: 'Tirunelveli', name_ta: 'திருநெல்வேலி', defaultSoil: 'Alluvial/Red', waterZone: 'High', lat: 8.7139, lon: 77.7567 },
    { id: 'dharmapuri', name: 'Dharmapuri', name_ta: 'தருமபுரி', defaultSoil: 'Sandy Loam', waterZone: 'Low', lat: 12.1211, lon: 78.1582 },
    { id: 'cuddalore', name: 'Cuddalore', name_ta: 'கடலூர்', defaultSoil: 'Clay Loam', waterZone: 'High', lat: 11.7480, lon: 79.7714 }
  ],

  // WMO Weather Interpretation Codes (Open-Meteo Standard)
  wmoWeatherCodes: {
    0: { label: 'Clear Sky', label_ta: 'தெளிவான வானம்', icon: '☀️' },
    1: { label: 'Mainly Clear', label_ta: 'பெரும்பாலும் தெளிவானது', icon: '🌤️' },
    2: { label: 'Partly Cloudy', label_ta: 'பகுதி மேகமூட்டம்', icon: '⛅' },
    3: { label: 'Overcast', label_ta: 'முழு மேகமூட்டம்', icon: '☁️' },
    45: { label: 'Foggy', label_ta: 'பனிமூட்டம்', icon: '🌫️' },
    48: { label: 'Depositing Rime Fog', label_ta: 'அடர் பனி', icon: '🌫️' },
    51: { label: 'Light Drizzle', label_ta: 'லேசான தூறல்', icon: '🌦️' },
    53: { label: 'Moderate Drizzle', label_ta: 'மிதமான தூறல்', icon: '🌦️' },
    55: { label: 'Dense Drizzle', label_ta: 'அடர் தூறல்', icon: '🌧️' },
    61: { label: 'Slight Rain', label_ta: 'லேசான மழை', icon: '🌧️' },
    63: { label: 'Moderate Rain', label_ta: 'மிதமான மழை', icon: '🌧️' },
    65: { label: 'Heavy Rain', label_ta: 'கனமழை', icon: '🌧️' },
    80: { label: 'Slight Rain Showers', label_ta: 'லேசான சாரல் மழை', icon: '🌦️' },
    81: { label: 'Moderate Rain Showers', label_ta: 'மிதமான சாரல் மழை', icon: '🌧️' },
    82: { label: 'Violent Rain Showers', label_ta: 'பலத்த மழைச் சாரல்', icon: '⛈️' },
    95: { label: 'Thunderstorm', label_ta: 'இடிமின்னலுடன் கூடிய மழை', icon: '⛈️' },
    96: { label: 'Thunderstorm with Hail', label_ta: 'ஆலங்கட்டி மழை', icon: '⛈️' }
  },

  // Soil types
  soilTypes: [
    { id: 'alluvial', name: 'Alluvial Soil', name_ta: 'வண்டல் மண்', desc: 'Rich in nutrients, ideal for paddy, sugarcane' },
    { id: 'black', name: 'Black Cotton Soil', name_ta: 'கரிசல் மண்', desc: 'High clay content, moisture retentive, ideal for cotton, pulses' },
    { id: 'red', name: 'Red Loam Soil', name_ta: 'செம்மண்', desc: 'Porous and friable, ideal for groundnut, millets' },
    { id: 'clay', name: 'Clay Soil', name_ta: 'களிமண்', desc: 'Dense water-holding capacity, good for paddy' },
    { id: 'sandy', name: 'Sandy Loam', name_ta: 'மணல் கலந்த மண்', desc: 'High drainage, suitable for vegetables and tubers' }
  ],

  // Irrigation types
  irrigationTypes: [
    { id: 'drip', name: 'Drip Irrigation', name_ta: 'சொட்டு நீர் பாசனம்', waterSaving: '60-70%' },
    { id: 'sprinkler', name: 'Sprinkler Irrigation', name_ta: 'தெளிப்பு நீர் பாசனம்', waterSaving: '30-40%' },
    { id: 'flood', name: 'Flood / Channel Irrigation', name_ta: 'வாய்க்கால் / பாய்ச்சல் பாசனம்', waterSaving: 'Traditional' },
    { id: 'rainfed', name: 'Rainfed (No Irrigation)', name_ta: 'மானாவாரி (மழை சார்ந்தது)', waterSaving: 'Weather dependent' }
  ],

  // Seasons
  seasons: [
    { id: 'kharif', name: 'Kharif / Kuruvai (Jun - Sep)', name_ta: 'குருவை / காரீப் (ஜூன் - செப்)', rainExpected: 'High' },
    { id: 'rabi', name: 'Rabi / Samba / Thaladi (Oct - Feb)', name_ta: 'சம்பா / தாளடி / ரபி (அக் - பிப்)', rainExpected: 'Moderate-High' },
    { id: 'zaid', name: 'Zaid / Navarai / Summer (Mar - May)', name_ta: 'நவரை / கோடை (மார்ச் - மே)', rainExpected: 'Low' }
  ],

  // Water sources
  waterSources: [
    { id: 'borewell', name: 'Borewell', name_ta: 'ஆழ்துளை கிணறு' },
    { id: 'canal', name: 'River / Canal', name_ta: 'ஆறு / கால்வாய்' },
    { id: 'open_well', name: 'Open Well', name_ta: 'திறந்த கிணறு' },
    { id: 'rainfed', name: 'Rainfed Only', name_ta: 'மழை நீர் மட்டும்' }
  ],

  // Comprehensive Crop Database with agronomy rules
  crops: [
    {
      id: 'paddy',
      name: 'Paddy (Rice)',
      name_ta: 'நெல்',
      icon: '🌾',
      category: 'Cereal',
      idealSoils: ['alluvial', 'clay'],
      idealSeasons: ['kharif', 'rabi'],
      waterRequirement: 'High (1200-1400 mm)',
      growingPeriod: '115 - 135 Days',
      expectedYield: '25 - 32 Quintal / Acre',
      marketRateApprox: '₹2,203 - ₹2,350 / Qtl',
      riskBaseline: 'LOW',
      whyRecommended: 'Alluvial soil with dependable canal/borewell water provides maximum yield and MSP price security under Tamil Nadu procurement centers.',
      cultivationSteps: [
        'Seed treatment with Pseudomonas fluorescens (10g/kg seed).',
        'Maintain 2-3 cm standing water during transplanting and tillering.',
        'Split nitrogen fertilizer application: Basal (25%), Tillering (50%), Panicle initiation (25%).',
        'Drain water 10 days before harvest for uniform grain maturity.'
      ]
    },
    {
      id: 'cotton',
      name: 'Cotton',
      name_ta: 'பருத்தி',
      icon: '☁️',
      category: 'Cash Crop',
      idealSoils: ['black', 'red'],
      idealSeasons: ['kharif', 'rabi'],
      waterRequirement: 'Moderate (650-750 mm)',
      growingPeriod: '150 - 165 Days',
      expectedYield: '8 - 12 Quintal / Acre',
      marketRateApprox: '₹7,121 - ₹7,600 / Qtl',
      riskBaseline: 'MODERATE',
      whyRecommended: 'Thrives in black and red loam soils with deep root moisture. High commercial cash return in textile hubs.',
      cultivationSteps: [
        'Deep summer ploughing to destroy overwintering pink bollworm pupae.',
        'Spacing 90x60 cm; nip terminal shoots at 75-80 days to encourage boll formation.',
        'Install yellow sticky traps and pheromone traps (5/acre) at 45 days.',
        'Avoid excessive nitrogen to prevent vegetative overgrowth.'
      ]
    },
    {
      id: 'groundnut',
      name: 'Groundnut (Peanut)',
      name_ta: 'நிலக்கடலை',
      icon: '🥜',
      category: 'Oilseed',
      idealSoils: ['red', 'sandy'],
      idealSeasons: ['kharif', 'zaid'],
      waterRequirement: 'Low-Moderate (450-550 mm)',
      growingPeriod: '100 - 110 Days',
      expectedYield: '10 - 15 Quintal / Acre',
      marketRateApprox: '₹6,783 - ₹7,200 / Qtl',
      riskBaseline: 'LOW',
      whyRecommended: 'Fixes atmospheric nitrogen, highly drought-tolerant, and yields excellent oil and fodder value.',
      cultivationSteps: [
        'Treat kernels with Rhizobium culture (200g/acre) and Trichoderma viride.',
        'Apply Gypsum @ 200 kg/acre at 40-45th day (pegging stage) for healthy pod filling.',
        'Critical irrigation stages: Flowering, Peg penetration, and Pod formation.',
        'Protect against Tikka leaf spot with neem seed kernel extract (5%).'
      ]
    },
    {
      id: 'tomato',
      name: 'Tomato',
      name_ta: 'தக்காளி',
      icon: '🍅',
      category: 'Vegetable',
      idealSoils: ['red', 'sandy', 'alluvial'],
      idealSeasons: ['rabi', 'zaid'],
      waterRequirement: 'Moderate (Drip Ideal, 500-600 mm)',
      growingPeriod: '90 - 110 Days',
      expectedYield: '120 - 180 Quintal / Acre',
      marketRateApprox: '₹1,800 - ₹3,200 / Qtl (Dynamic)',
      riskBaseline: 'MODERATE',
      whyRecommended: 'High-frequency picking crop providing consistent weekly cash flow. Highly responsive to drip fertigation.',
      cultivationSteps: [
        'Transplant 25-day old healthy seedlings onto raised beds with silver-black mulch.',
        'Trellis with bamboo poles and twines for aeration and pest prevention.',
        'Regular foliar calcium spray during fruit development to prevent Blossom End Rot.',
        'Irrigate at uniform intervals to prevent fruit cracking.'
      ]
    },
    {
      id: 'sugarcane',
      name: 'Sugarcane',
      name_ta: 'கரும்பு',
      icon: '🎋',
      category: 'Commercial',
      idealSoils: ['alluvial', 'black', 'clay'],
      idealSeasons: ['rabi', 'zaid'],
      waterRequirement: 'Very High (1800-2200 mm)',
      growingPeriod: '300 - 365 Days',
      expectedYield: '40 - 55 Tonnes / Acre',
      marketRateApprox: '₹3,150 / Tonne (FRP/SAP)',
      riskBaseline: 'LOW',
      whyRecommended: 'Steady contracted mill procurement with assured FRP payment. Highly productive under drip systems.',
      cultivationSteps: [
        'Single bud chip nursery planting for 80% seed sett saving.',
        'Incorporate trash mulching between cane rows to conserve soil moisture.',
        'Earthing up at 45 and 90 days to prevent lodging.',
        'Apply drip fertigation for uniform cane elongation.'
      ]
    },
    {
      id: 'maize',
      name: 'Maize (Corn)',
      name_ta: 'மக்காச்சோளம்',
      icon: '🌽',
      category: 'Cereal / Fodder',
      idealSoils: ['red', 'black', 'alluvial'],
      idealSeasons: ['kharif', 'rabi', 'zaid'],
      waterRequirement: 'Moderate (500-600 mm)',
      growingPeriod: '95 - 110 Days',
      expectedYield: '28 - 35 Quintal / Acre',
      marketRateApprox: '₹2,090 - ₹2,300 / Qtl',
      riskBaseline: 'LOW',
      whyRecommended: 'All-season crop with booming poultry and cattle feed market demand. Resilient and fast turnover.',
      cultivationSteps: [
        'Maintain plant population: 60 cm row-to-row, 20 cm plant-to-plant.',
        'Apply pre-emergence herbicide Atrazine @ 500g/acre within 3 days of sowing.',
        'Monitor for Fall Armyworm (FAW) whorl feeding; use Metarhizium anisopliae biopesticide.',
        'Critical irrigation at tasseling and silking stages.'
      ]
    },
    {
      id: 'millets',
      name: 'Finger Millet (Ragi)',
      name_ta: 'கேழ்வரகு (ராகி)',
      icon: '🥣',
      category: 'Nutri-Cereal',
      idealSoils: ['red', 'sandy', 'black'],
      idealSeasons: ['kharif', 'rabi'],
      waterRequirement: 'Low (350-400 mm)',
      growingPeriod: '95 - 105 Days',
      expectedYield: '12 - 18 Quintal / Acre',
      marketRateApprox: '₹3,846 - ₹4,100 / Qtl',
      riskBaseline: 'LOW',
      whyRecommended: 'Superfood with rising health demand, extreme drought resistance, and guaranteed government millet mission purchase.',
      cultivationSteps: [
        'Direct broadcasting or line sowing behind the plough with 30x10 cm spacing.',
        'Needs only 2-3 protective irrigations; thrives even in dryland conditions.',
        'Minimal pest pressure; apply organic Panchagavya foliar spray at 30 days.',
        'Harvest when earheads turn brown and grains harden.'
      ]
    },
    {
      id: 'turmeric',
      name: 'Turmeric',
      name_ta: 'மஞ்சள்',
      icon: '🪴',
      category: 'Spices',
      idealSoils: ['alluvial', 'red', 'black'],
      idealSeasons: ['kharif'],
      waterRequirement: 'High (1000-1200 mm)',
      growingPeriod: '240 - 270 Days',
      expectedYield: '20 - 25 Quintal (Cured) / Acre',
      marketRateApprox: '₹14,500 - ₹17,200 / Qtl',
      riskBaseline: 'MODERATE',
      whyRecommended: 'Extremely lucrative commercial spice. Erode & Salem mandis provide direct export access and highest historic prices.',
      cultivationSteps: [
        'Mother rhizome planting on raised beds with drip lateral lines.',
        'Apply heavy Farm Yard Manure (FYM 10 tonnes/acre) with Neem cake.',
        'Provide shade or intercrop with maize/dhaicha during initial sprout phase.',
        'Mulch with green leaves (5 tonnes/acre) twice in first 90 days.'
      ]
    }
  ],

  // Crop Disease Knowledge Base with test images & diagnostics
  diseases: [
    {
      id: 'rice_blast',
      crop: 'Paddy (Rice)',
      crop_ta: 'நெல்',
      diseaseName: 'Rice Blast (Magnaporthe oryzae)',
      diseaseName_ta: 'நெல் குலை நோய்',
      confidence: 94,
      riskLevel: 'HIGH',
      symptoms: [
        'Spindle-shaped elliptical lesions with gray/white centers and brownish margins on leaf blades',
        'Blackening and rot of neck node resulting in empty or unfilled grains',
        'Rapid spread during foggy mornings and high relative humidity (>90%)'
      ],
      symptoms_ta: [
        'இலைகளில் கண் போன்ற அல்லது கதிர் போன்ற மையத்தில் சாம்பல் நிறமும் விளிம்பில் பழுப்பு நிறமும் கொண்ட புள்ளிகள்',
        'கழுத்து பகுதியில் கறுத்து அழுகல் ஏற்பட்டு தானியங்கள் பதராக மாறுதல்',
        'பனி மூட்டம் மற்றும் அதிக காற்றில் ஈரப்பதம் உள்ள சூழலில் வேகமாக பரவும்'
      ],
      organicAction: 'Spray Neem seed kernel extract (5%) or Pseudomonas fluorescens @ 10g/Litre water at 7-day intervals.',
      organicAction_ta: 'வேப்பங்கொட்டை சாறு 5% அல்லது சூடோமோனாஸ் 10 கிராம்/லிட்டர் நீரில் கலந்து 7 நாட்கள் இடைவெளியில் தெளிக்கவும்.',
      chemicalAction: 'Apply Tricyclazole 75% WP @ 0.6g/L or Isoprothiolane 40% EC @ 1.5ml/L at early lesion appearance.',
      chemicalAction_ta: 'ட்ரைசைக்ளசோல் 75% WP @ 0.6 கிராம்/லிட்டர் அல்லது ஐசோபுரோதியோலேன் 1.5 மி.லி/லிட்டர் தெளிக்கவும்.',
      preventiveAction: 'Avoid excessive split application of nitrogen. Drain excess water and maintain aerated field conditions.',
      preventiveAction_ta: 'அளவுக்கு அதிகமான தழைச்சத்து (யூரியா) இடுவதை தவிர்க்கவும். வயலில் தேங்கிய நீரை வடித்து காற்று புக அனுமதிக்கவும்.',
      sampleImage: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="%232e5339"/><path d="M50,280 C120,200 200,100 350,40" stroke="%236da06f" stroke-width="32" fill="none" stroke-linecap="round"/><ellipse cx="180" cy="150" rx="35" ry="14" fill="%23d8c89d" stroke="%236e3b21" stroke-width="4" transform="rotate(-35 180 150)"/><ellipse cx="240" cy="110" rx="28" ry="10" fill="%23d8c89d" stroke="%236e3b21" stroke-width="3" transform="rotate(-30 240 110)"/><ellipse cx="130" cy="195" rx="20" ry="8" fill="%23d8c89d" stroke="%236e3b21" stroke-width="3" transform="rotate(-40 130 195)"/><text x="20" y="35" fill="%23e2f5e3" font-family="sans-serif" font-size="16" font-weight="bold">Sample: Rice Leaf Blast</text></svg>'
    },
    {
      id: 'tomato_early_blight',
      crop: 'Tomato',
      crop_ta: 'தக்காளி',
      diseaseName: 'Early Blight (Alternaria solani)',
      diseaseName_ta: 'தக்காளி இலை கருகல் நோய்',
      confidence: 91,
      riskLevel: 'MODERATE',
      symptoms: [
        'Concentric target-like dark brown rings on older lower leaves',
        'Yellowing halo around necrotic leaf spots leading to defoliation',
        'Stem collar rot and dark sunken lesions at fruit stem-end'
      ],
      symptoms_ta: [
        'கீழ் இலைகளில் வளைய வடிவிலான அடர் பழுப்பு நிற கருகல் புள்ளிகள்',
        'புள்ளிகளை சுற்றி மஞ்சள் வளையம் தோன்றி இலைகள் உதிர்தல்',
        'தண்டு மற்றும் காய் காம்புகளில் பள்ளமான கரும்புள்ளிகள்'
      ],
      organicAction: 'Foliar spray of Trichoderma viride @ 5g/L combined with Panchagavya 3% solution in evening.',
      organicAction_ta: 'டிரைக்கோடெர்மா விரிடி 5 கிராம்/லிட்டர் மற்றும் பஞ்சகாவ்யா 3% கரைசல் கலந்து மாலையில் தெளிக்கவும்.',
      chemicalAction: 'Spray Mancozeb 75% WP @ 2g/L or Azoxystrobin 23% SC @ 1ml/L every 10-14 days.',
      chemicalAction_ta: 'மேன்கோசெப் 75% WP @ 2 கிராம்/லிட்டர் அல்லது அஸாக்ஸிஸ்ட்ரோபின் 1 மி.லி/லிட்டர் தெளிக்கவும்.',
      preventiveAction: 'Stake plants off soil, remove affected lower leaves, and avoid overhead sprinkler watering.',
      preventiveAction_ta: 'செடிகளுக்கு முட்டு கொடுத்து உயர்த்தவும். பாதிக்கப்பட்ட கீழ் இலைகளை அகற்றி எரிக்கவும்.',
      sampleImage: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="%231e3b2b"/><path d="M200,280 Q200,160 210,50" stroke="%234b8b3b" stroke-width="12" fill="none"/><path d="M205,170 C130,150 110,80 180,80 C220,80 210,140 205,170" fill="%23589b43"/><circle cx="160" cy="115" r="18" fill="%23432714"/><circle cx="160" cy="115" r="13" fill="%23734623"/><circle cx="160" cy="115" r="7" fill="%232b170c"/><circle cx="185" cy="140" r="12" fill="%23593318"/><path d="M195,190 C270,180 290,120 230,100 C190,90 200,170 195,190" fill="%23589b43"/><circle cx="240" cy="140" r="15" fill="%23432714"/><text x="20" y="35" fill="%23e2f5e3" font-family="sans-serif" font-size="16" font-weight="bold">Sample: Tomato Early Blight</text></svg>'
    },
    {
      id: 'cotton_leaf_curl',
      crop: 'Cotton',
      crop_ta: 'பருத்தி',
      diseaseName: 'Cotton Leaf Curl Viral Disease (CLCuD)',
      diseaseName_ta: 'பருத்தி இலை சுருட்டு வைரஸ் நோய்',
      confidence: 89,
      riskLevel: 'HIGH',
      symptoms: [
        'Upward curling and thickening of young leaves with vein clearing',
        'Leaf enations (cup-shaped outgrowths) on underside of main veins',
        'Transmitted aggressively by Whiteflies (Bemisia tabaci) under warm dry weather'
      ],
      symptoms_ta: [
        'இளம் இலைகள் மேல்நோக்கி சுருண்டு நரம்புகள் தடித்து காணப்படுதல்',
        'இலைகளின் அடிப்பகுதியில் சிறு கிண்ணம் போன்ற தசை வளர்ச்சிகள் தோன்றுதல்',
        'வெள்ளைப் பூச்சிகள் மூலம் வேகமாக பரவும் வைரஸ் நோய்'
      ],
      organicAction: 'Install 20 yellow sticky traps per acre; spray 2% Neem oil emulsion or fish amino acid.',
      organicAction_ta: 'ஏக்கருக்கு 20 மஞ்சள் ஒட்டும் பொறிகளை அமைக்கவும்; 2% வேப்பெண்ணெய் கரைசல் தெளிக்கவும்.',
      chemicalAction: 'Control whitefly vector: Spray Diafenthiuron 50% WP @ 1.2g/L or Flonicamid 50% WG @ 0.3g/L.',
      chemicalAction_ta: 'வெள்ளைப் பூச்சியை கட்டுப்படுத்த டயாபென்தியூரான் 1.2 கிராம்/லிட்டர் தெளிக்கவும்.',
      preventiveAction: 'Rogue out and bury severely stunted infected plants. Keep borders weed-free from Parthenium.',
      preventiveAction_ta: 'பாதிக்கப்பட்ட செடிகளை வேரோடு பிடுங்கி தீயிட்டு அழிக்கவும். பார்த்தீனிய களைகளை அழிக்கவும்.',
      sampleImage: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="%2326382b"/><path d="M200,270 L200,90" stroke="%233e7039" stroke-width="10"/><path d="M200,160 Q120,130 130,90 Q170,80 200,140 Q230,80 270,90 Q280,130 200,160" fill="%2368a854"/><path d="M130,90 Q125,70 145,65 Q170,75 160,95" fill="%239ab85c" stroke="%234d702d"/><path d="M270,90 Q275,70 255,65 Q230,75 240,95" fill="%239ab85c" stroke="%234d702d"/><text x="20" y="35" fill="%23e2f5e3" font-family="sans-serif" font-size="16" font-weight="bold">Sample: Cotton Leaf Curl</text></svg>'
    },
    {
      id: 'groundnut_tikka',
      crop: 'Groundnut',
      crop_ta: 'நிலக்கடலை',
      diseaseName: 'Tikka Leaf Spot (Cercospora personata)',
      diseaseName_ta: 'நிலக்கடலை டிக்கா இலைப்புள்ளி நோய்',
      confidence: 93,
      riskLevel: 'MODERATE',
      symptoms: [
        'Small circular dark brown to jet black spots on upper leaf surfaces',
        'Yellow chlorotic halos surrounding necrotic spots',
        'Premature shedding of foliage causing reduction in pod development'
      ],
      symptoms_ta: [
        'இலைகளின் மேல் பகுதியில் வட்டமான அடர் பழுப்பு நிற புள்ளிகள்',
        'புள்ளிகளை சுற்றி வெளிர் மஞ்சள் நிற வளையம்',
        'இலைகள் முன்கூட்டியே உதிர்ந்து காய் திரட்சி பாதிக்கப்படுதல்'
      ],
      organicAction: 'Spray Ginger-Garlic-Chilli extract (3%) or Pseudomonas culture (10g/L) on bottom canopy.',
      organicAction_ta: 'இஞ்சி-பூண்டு-பச்சை மிளகாய் சாறு 3% அல்லது சூடோமோனாஸ் 10 கிராம்/லிட்டர் தெளிக்கவும்.',
      chemicalAction: 'Spray Carbendazim 12% + Mancozeb 63% WP @ 2g/L or Hexaconazole 5% SC @ 2ml/L.',
      chemicalAction_ta: 'கார்பெண்டாசிம் + மேன்கோசெப் 2 கிராம்/லிட்டர் அல்லது ஹெக்சாகோனசோல் 2 மி.லி/லிட்டர் தெளிக்கவும்.',
      preventiveAction: 'Practice crop rotation with maize or sorghum. Treat seed before sowing.',
      preventiveAction_ta: 'மக்காச்சோளம் அல்லது சோளத்துடன் பயிர் சுழற்சி செய்யவும். விதை நேர்த்தி செய்யவும்.',
      sampleImage: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23243321"/><ellipse cx="200" cy="160" rx="90" ry="60" fill="%2361993b"/><circle cx="160" cy="140" r="10" fill="%23211508" stroke="%23c4b83b" stroke-width="3"/><circle cx="210" cy="130" r="14" fill="%23211508" stroke="%23c4b83b" stroke-width="4"/><circle cx="240" cy="170" r="8" fill="%23211508" stroke="%23c4b83b" stroke-width="2"/><circle cx="175" cy="180" r="11" fill="%23211508" stroke="%23c4b83b" stroke-width="3"/><text x="20" y="35" fill="%23e2f5e3" font-family="sans-serif" font-size="16" font-weight="bold">Sample: Groundnut Tikka Spot</text></svg>'
    },
    {
      id: 'healthy_leaf',
      crop: 'General / Rice / Cotton',
      crop_ta: 'அனைத்து பயிர்கள்',
      diseaseName: 'Healthy Crop (No Disease Detected)',
      diseaseName_ta: 'ஆரோக்கியமான பயிர் (நோய்த்தொற்று இல்லை)',
      confidence: 97,
      riskLevel: 'LOW',
      symptoms: [
        'Vibrant natural green pigmentation across all leaf venation',
        'No fungal lesions, necrosis, curling, or insect chewing detected',
        'Strong photosynthetic surface area and robust turgor pressure'
      ],
      symptoms_ta: [
        'இலை முழுவதும் இயல்பான செழுமையான பச்சை நிறம்',
        'எந்தவித பூஞ்சான புள்ளிகள், சுருட்டல் அல்லது பூச்சி சேதம் இல்லை',
        'ஆரோக்கியமான ஒளிச்சேர்க்கை பரப்பளவு மற்றும் வளர்ச்சி'
      ],
      organicAction: 'Continue routine organic foliar nutrition (Panchagavya 3% or Vermiwash) to sustain high immunity.',
      organicAction_ta: 'பயிரின் நோய் எதிர்ப்பு திறனை தக்கவைக்க தொடர்ந்து 15 நாட்களுக்கு ஒருமுறை பஞ்சகாவ்யா 3% தெளிக்கவும்.',
      chemicalAction: 'No chemical fungicides or insecticides required. Protect beneficial predators.',
      chemicalAction_ta: 'ரசாயன மருந்துகள் எதுவும் தேவையில்லை. நன்மை செய்யும் பூச்சிகளை பாதுகாக்கவும்.',
      preventiveAction: 'Maintain clean field bunds, monitor soil moisture, and check once a week.',
      preventiveAction_ta: 'வரப்புகளை சுத்தமாக வைக்கவும், வாரத்திற்கு ஒருமுறை கள ஆய்வு செய்யவும்.',
      sampleImage: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="%231a2e22"/><path d="M70,250 C120,180 200,90 330,60" stroke="%23529e47" stroke-width="18" fill="none" stroke-linecap="round"/><path d="M150,190 C190,130 250,90 330,60 C260,130 200,190 150,190" fill="%2368ba5b"/><circle cx="260" cy="95" r="4" fill="%23c9ffc2" opacity="0.6"/><text x="20" y="35" fill="%23e2f5e3" font-family="sans-serif" font-size="16" font-weight="bold">Sample: Healthy Green Leaf</text></svg>'
    }
  ],

  // Agricultural Loan Options
  loans: [
    {
      id: 'kcc',
      name: 'Kisan Credit Card (KCC) Scheme',
      name_ta: 'கிசான் கிரெடிட் கார்டு (KCC)',
      provider: 'Nationalized & Regional Rural Banks (NABARD supported)',
      provider_ta: 'தேசியமயமாக்கப்பட்ட வங்கிகள் / நபார்டு',
      interestRate: '4.0% p.a. (Effective after 3% Prompt Repayment Incentive)',
      nominalRate: '7.0% p.a. (with subvention)',
      effectiveDate: 'Updated Aug 2026 / RBI Circular FIDD.CO',
      maxAmount: 'Up to ₹3,00,000 without collateral up to ₹1,60,000',
      purpose: 'Short-term crop cultivation, post-harvest expenses, farm asset maintenance',
      eligibility: 'All farmers, individual/joint cultivators, tenant farmers, oral lessees, SHGs',
      requiredDocuments: [
        'Completed KCC application form',
        'Identity proof (Aadhaar Card / Voter ID)',
        'Address proof (Ration Card / Aadhaar)',
        'Land ownership record (Patta / Chitta / 7/12 extract / Adangal)',
        'Current crop cultivation certificate from VAO / Revenue Inspector',
        'Passport size photographs (2 copies)'
      ],
      applicationMethod: 'Online via State Bank YONO Agri / CSC Center or at nearest rural branch',
      officialUrl: 'https://pib.gov.in/PressReleasePage.aspx?PRID=1908241'
    },
    {
      id: 'sbi_gold',
      name: 'Agricultural Gold Loan',
      name_ta: 'விவசாய தங்கக் கடன்',
      provider: 'State Bank of India / Canara Bank / Indian Bank',
      provider_ta: 'ஸ்டேட் பாங்க் ஆஃப் இந்தியா / இந்தியன் வங்கி',
      interestRate: '7.0% - 7.5% p.a. (Concessional Agri rate)',
      nominalRate: '8.85% (Standard)',
      effectiveDate: 'Updated Sep 2026 / Bank Base Lending Rates',
      maxAmount: 'Up to ₹25,00,000 based on gold valuation (75% LTV)',
      purpose: 'Immediate seasonal input purchase, seeds, fertilizer, labour wages',
      eligibility: 'Farmers owning agricultural land with proof of farming activity',
      requiredDocuments: [
        'Aadhaar card & PAN card',
        'Land revenue document (Patta/Chitta copy)',
        'Declaration of agricultural purpose',
        'Gold ornaments for bank appraisal'
      ],
      applicationMethod: 'Walk-in instant sanction within 1-2 hours at any rural bank branch',
      officialUrl: 'https://sbi.co.in/web/agri-rural/agriculture-banking/agri-gold-loan'
    },
    {
      id: 'tractor_equipment',
      name: 'Farm Mechanization / Tractor Loan',
      name_ta: 'விவசாய டிராக்டர் மற்றும் உபகரண கடன்',
      provider: 'NABARD / Commercial Banks / HDFC Agri',
      provider_ta: 'நபார்டு / அனைத்து வணிக வங்கிகள்',
      interestRate: '8.5% - 9.75% p.a.',
      nominalRate: '9.5% p.a.',
      effectiveDate: 'Updated July 2026',
      maxAmount: 'Up to 85-90% of Tractor/Equipment On-road price',
      purpose: 'Purchase of new tractor, power tiller, combine harvester, drone, rotavator',
      eligibility: 'Farmer owning minimum 2 acres irrigated land with stable annual income',
      requiredDocuments: [
        'Aadhaar and PAN card',
        'Land holding certificate (minimum 2 acres verified by VAO)',
        'Quotation / Proforma invoice from authorized tractor dealer',
        'Bank statement for last 6 months',
        'Income proof / Tax returns (if available)'
      ],
      applicationMethod: 'Direct dealer assisted application or online through bank portal',
      officialUrl: 'https://www.nabard.org'
    },
    {
      id: 'mudra_shishu_tarun',
      name: 'Pradhan Mantri MUDRA Yojana (Agri-Allied)',
      name_ta: 'பிரதான் மந்திரி முத்ரா திட்டம் (வேளாண் சார்ந்த)',
      provider: 'All Public Sector Banks & Microfinance Institutions',
      provider_ta: 'பொதுத்துறை வங்கிகள் & MFIs',
      interestRate: '8.0% - 9.5% p.a. (No collateral required)',
      nominalRate: '8.5% p.a.',
      effectiveDate: 'Updated Sep 2026 / MUDRA guidelines',
      maxAmount: 'Shishu (up to ₹50,000), Kishore (₹50k - ₹5L), Tarun (₹5L - ₹10L)',
      purpose: 'Dairy, poultry, beekeeping, grading/sorting unit, agri-retail shop',
      eligibility: 'Small agricultural allied producers, rural micro-entrepreneurs',
      requiredDocuments: [
        'Aadhaar card and Voter ID',
        'Proof of business/allied activity address',
        'Project report / Quotation for machinery or livestock',
        'Bank account details for last 6 months'
      ],
      applicationMethod: 'Apply online on Udyamimitra portal (www.udyamimitra.in) or local bank branch',
      officialUrl: 'https://www.mudra.org.in'
    }
  ],

  // Government Agricultural Schemes
  schemes: [
    {
      id: 'pm_kisan',
      name: 'PM-KISAN Samman Nidhi',
      name_ta: 'பி.எம் கிசான் சம்மான் நிதி',
      ministry: 'Ministry of Agriculture & Farmers Welfare, Govt of India',
      benefit: '₹6,000 per year directly credited in 3 equal installments of ₹2,000',
      purpose: 'Direct income support to landholding farmer families to meet farm input costs',
      eligibilityCriteria: {
        maxLand: 999, // All landholding farmers
        categories: ['Marginal', 'Small', 'Medium', 'Large'],
        excluded: 'Institutional landholders, income tax payers, government retired officers'
      },
      eligibilityRuleSummary: 'All landholder farmers with Aadhaar-seeded bank account and eKYC completed.',
      requiredDocuments: [
        'Aadhaar Card (Mandatory)',
        'Bank Account Passbook (Aadhaar linked / NPCI mapped)',
        'Land Ownership Record (Patta / RoR / Chitta)',
        'Active Mobile Number for OTP'
      ],
      applicationProcedure: [
        '1. Visit the official PM-KISAN portal (pmkisan.gov.in) or your local CSC / e-Seva Center.',
        '2. Click on "New Farmer Registration" and enter Aadhaar number + mobile number.',
        '3. Select State, District, Sub-district, Block, and Village.',
        '4. Enter land survey number, dag/khasra number, and land area.',
        '5. Complete biometric e-KYC or OTP verification and submit.'
      ],
      officialPortalUrl: 'https://pmkisan.gov.in'
    },
    {
      id: 'pmfby',
      name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
      name_ta: 'பிரதான் மந்திரி பயிர் காப்பீட்டுத் திட்டம்',
      ministry: 'Ministry of Agriculture & Farmers Welfare',
      benefit: 'Comprehensive crop loss cover with minimal premium: 1.5% for Rabi, 2% for Kharif, 5% for Annual Commercial Crops',
      purpose: 'Financial relief against non-preventable natural risks (drought, flood, cyclone, pest attack, unseasonal rain)',
      eligibilityCriteria: {
        maxLand: 999,
        categories: ['Marginal', 'Small', 'Medium', 'Large'],
        cropsCovered: ['Paddy', 'Cotton', 'Sugarcane', 'Maize', 'Groundnut', 'Tomato', 'Millets', 'Pulses']
      },
      eligibilityRuleSummary: 'All farmers cultivating notified crops in notified insurance units.',
      requiredDocuments: [
        'Aadhaar Card',
        'Bank Passbook with IFSC code',
        'Land Ownership Patta or Tenant/Sharecropper Agreement',
        'Sowing Certificate / Adangal issued by VAO',
        'Crop Insurance declaration form'
      ],
      applicationProcedure: [
        '1. Login to pmfby.gov.in or approach Primary Agricultural Cooperative Credit Society (PACCS).',
        '2. Ensure enrollment is completed before the crop cutoff date for your district.',
        '3. Submit land and sowing details with crop premium.',
        '4. Obtain Policy Acknowledgment receipt with unique application ID.'
      ],
      officialPortalUrl: 'https://pmfby.gov.in'
    },
    {
      id: 'pmksy_drip',
      name: 'PM Krishi Sinchayee Yojana (Per Drop More Crop - Drip Subsidy)',
      name_ta: 'சொட்டு நீர் பாசன மானியத் திட்டம் (PMKSY)',
      ministry: 'Department of Horticulture & State Agriculture Engineering',
      benefit: '100% subsidy for Small & Marginal farmers in Tamil Nadu; 75% for other farmers',
      purpose: 'Water conservation, micro-irrigation installation, boosting crop water-use efficiency',
      eligibilityCriteria: {
        categories: ['Marginal', 'Small', 'Medium'],
        waterSources: ['borewell', 'open_well', 'canal']
      },
      eligibilityRuleSummary: 'Farmers having a verified water source and cultivable land.',
      requiredDocuments: [
        'Aadhaar card copy',
        'Small/Marginal Farmer Certificate from Tahsildar / VAO',
        'Patta, Chitta, FMB sketch of farm field',
        'Water and electricity connection / borewell proof',
        'Soil and water test lab report'
      ],
      applicationProcedure: [
        '1. Register online on TN Micro-Irrigation Portal (tnhorticulture.tn.gov.in) or state portal.',
        '2. Select approved micro-irrigation manufacturer/vendor.',
        '3. Assistant Director of Horticulture (ADH) conducts physical field inspection.',
        '4. Work order issued; installation done; post-inspection subsidy disbursed directly.'
      ],
      officialPortalUrl: 'https://pmksy.gov.in'
    },
    {
      id: 'tn_kalaignar',
      name: 'Kalaignar All Village Integrated Agriculture Development Programme',
      name_ta: 'கலைஞரின் அனைத்து கிராம ஒருங்கிணைந்த வேளாண் வளர்ச்சி திட்டம்',
      ministry: 'Department of Agriculture & Farmers Welfare, Tamil Nadu',
      benefit: 'Free coconut seedlings, vegetable seed kits, farm implements at 50% subsidy, and desilting of farm ponds',
      purpose: 'Village self-sufficiency in agriculture, fallow land conversion to cultivation',
      eligibilityCriteria: {
        districts: ['thanjavur', 'coimbatore', 'madurai', 'salem', 'erode', 'tirunelveli', 'dharmapuri', 'cuddalore'],
        categories: ['Marginal', 'Small']
      },
      eligibilityRuleSummary: 'Farmers residing in selected village panchayats in Tamil Nadu.',
      requiredDocuments: [
        'Farmer Aadhaar card & Smart Ration card',
        'Uzhavan App Registration ID',
        'Land Patta / Chitta copy'
      ],
      applicationProcedure: [
        '1. Register on the Uzhavan Mobile App (உழவன் செயலி) or visit Assistant Agricultural Officer (AAO).',
        '2. Choose the scheme benefits (tree saplings, sprayer subsidy, kit).',
        '3. Collect items from nearest Agricultural Extension Center (AEC).'
      ],
      officialPortalUrl: 'https://www.tn.gov.in/department/1'
    },
    {
      id: 'smam_machinery',
      name: 'Sub-Mission on Agricultural Mechanization (SMAM)',
      name_ta: 'வேளாண் இயந்திரமயமாக்கல் திட்டம் (SMAM)',
      ministry: 'Ministry of Agriculture & Farmers Welfare',
      benefit: '40% to 50% financial subsidy on tractors, power weeders, brush cutters, sprayers',
      purpose: 'Mechanization of farm operations to overcome labour shortage and lower input costs',
      eligibilityCriteria: {
        categories: ['Marginal', 'Small', 'Medium', 'Large']
      },
      eligibilityRuleSummary: 'Any farmer with valid land patta who has not availed machinery subsidy in past 5 years.',
      requiredDocuments: [
        'Aadhaar card & Bank Passbook',
        'Land Patta / Chitta',
        'Category certificate (SC/ST/Women/Small/Marginal farmer certificate)',
        'Dealer quotation for selected machine model'
      ],
      applicationProcedure: [
        '1. Register online on agrimachinery.nic.in.',
        '2. Upload documents and select machine make & dealer.',
        '3. Approval issued by Agricultural Engineering Department.',
        '4. Buy machine and submit invoice for direct DBT subsidy credit.'
      ],
      officialPortalUrl: 'https://agrimachinery.nic.in'
    }
  ],

  // Mandi Market Live Prices (Historical 7-day curves & current quotes)
  marketPrices: [
    {
      cropId: 'paddy',
      cropName: 'Paddy (Basmati / Common)',
      cropName_ta: 'நெல் (பொன்னி / ஐ.ஆர்-20)',
      mandi: 'Thanjavur Regulated Market',
      mandi_ta: 'தஞ்சாவூர் ஒழுங்குமுறை விற்பனைக்கூடம்',
      district: 'thanjavur',
      currentPrice: 2320,
      prevPrice: 2280,
      trend: 'UP',
      percentChange: '+1.75%',
      unit: '₹ / Quintal',
      date: 'Today, 06:00 AM (e-NAM Sync)',
      history: [2210, 2240, 2230, 2260, 2275, 2280, 2320]
    },
    {
      cropId: 'cotton',
      cropName: 'Cotton (MCU-5 / DCH-32)',
      cropName_ta: 'பருத்தி',
      mandi: 'Coimbatore Mandi',
      mandi_ta: 'கோயம்புத்தூர் மார்க்கெட்',
      district: 'coimbatore',
      currentPrice: 7450,
      prevPrice: 7520,
      trend: 'DOWN',
      percentChange: '-0.93%',
      unit: '₹ / Quintal',
      date: 'Today, 06:00 AM (e-NAM Sync)',
      history: [7600, 7580, 7550, 7520, 7490, 7520, 7450]
    },
    {
      cropId: 'tomato',
      cropName: 'Tomato (Hybrid Native)',
      cropName_ta: 'தக்காளி',
      mandi: 'Madurai Central Market',
      mandi_ta: 'மதுரை மத்திய சந்தை',
      district: 'madurai',
      currentPrice: 2600,
      prevPrice: 2350,
      trend: 'UP',
      percentChange: '+10.6%',
      unit: '₹ / Quintal (₹26/kg)',
      date: 'Today, 05:30 AM (e-NAM Sync)',
      history: [1950, 2100, 2200, 2150, 2300, 2350, 2600]
    },
    {
      cropId: 'turmeric',
      cropName: 'Turmeric (Finger Grade)',
      cropName_ta: 'மஞ்சள் (விரலி)',
      mandi: 'Erode Regulated Market (Semmampalayam)',
      mandi_ta: 'ஈரோடு ஒழுங்குமுறை விற்பனைக்கூடம்',
      district: 'erode',
      currentPrice: 16800,
      prevPrice: 16400,
      trend: 'UP',
      percentChange: '+2.44%',
      unit: '₹ / Quintal',
      date: 'Today, 07:00 AM (e-NAM Sync)',
      history: [15200, 15600, 15900, 16100, 16300, 16400, 16800]
    },
    {
      cropId: 'groundnut',
      cropName: 'Groundnut (Pods)',
      cropName_ta: 'நிலக்கடலை',
      mandi: 'Salem Market',
      mandi_ta: 'சேலம் சந்தை',
      district: 'salem',
      currentPrice: 6950,
      prevPrice: 6900,
      trend: 'UP',
      percentChange: '+0.72%',
      unit: '₹ / Quintal',
      date: 'Today, 06:15 AM (e-NAM Sync)',
      history: [6800, 6820, 6850, 6890, 6880, 6900, 6950]
    },
    {
      cropId: 'maize',
      cropName: 'Maize (Hybrid Feed)',
      cropName_ta: 'மக்காச்சோளம்',
      mandi: 'Dharmapuri Mandi',
      mandi_ta: 'தருமபுரி மார்க்கெட்',
      district: 'dharmapuri',
      currentPrice: 2240,
      prevPrice: 2250,
      trend: 'STABLE',
      percentChange: '-0.44%',
      unit: '₹ / Quintal',
      date: 'Today, 06:30 AM (e-NAM Sync)',
      history: [2220, 2230, 2240, 2250, 2260, 2250, 2240]
    }
  ],

  // Official Agricultural Helplines (verified toll-free numbers)
  helplines: [
    {
      id: 'kcc_helpline',
      title: 'Kisan Call Center (Government of India)',
      title_ta: 'கிசான் அழைப்பு மையம் (மத்திய அரசு)',
      phone: '1800-180-1551',
      hours: '6:00 AM to 10:00 PM (All 7 Days)',
      languages: 'Tamil, English, Hindi & 19 regional languages',
      description: 'Expert agricultural scientists answer queries regarding crops, fertilizers, pest control, weather warnings, and government schemes directly.',
      officialSource: 'Ministry of Agriculture & Farmers Welfare'
    },
    {
      id: 'pm_kisan_helpline',
      title: 'PM-KISAN Samman Nidhi Helpdesk',
      title_ta: 'பி.எம் கிசான் உதவி எண்',
      phone: '155261',
      altPhone: '011-24300606',
      hours: '9:30 AM to 6:00 PM (Monday to Saturday)',
      languages: 'English, Tamil, Hindi',
      description: 'Assistance for installment status, Aadhaar seeding issues, pending approval, and bank account mapping verification.',
      officialSource: 'PM-KISAN Central Cell'
    },
    {
      id: 'tn_uzhavan_helpline',
      title: 'Tamil Nadu Agri Extension / Uzhavan Sevai',
      title_ta: 'தமிழ்நாடு உழவன் சேவை மையம்',
      phone: '1800-425-4444',
      hours: '8:00 AM to 7:00 PM',
      languages: 'Tamil (தமிழ்) & English',
      description: 'State agricultural department advisory on certified seed availability, fertilizer stocks, sub-collector schemes, and village camp schedules.',
      officialSource: 'Govt of Tamil Nadu Dept of Agriculture'
    },
    {
      id: 'crop_insurance_helpline',
      title: 'Crop Insurance Grievance Toll-Free (PMFBY)',
      title_ta: 'பயிர் காப்பீட்டு குறைதீர்ப்பு உதவி எண்',
      phone: '14447',
      hours: '24 Hours / 7 Days',
      languages: 'Tamil, English, Hindi',
      description: 'Report localized natural disasters (inundation, cloudburst, hailstorm) within 72 hours to initiate immediate crop loss survey.',
      officialSource: 'National Crop Insurance Portal'
    }
  ],

  // Translations dictionary (English <-> Tamil)
  i18n: {
    en: {
      appName: 'AGRI CRAFT-AI',
      tagline: 'Right Crop. Right Time. Right Action. Right Support.',
      navDashboard: 'Dashboard',
      navCropAdvisor: 'Crop Advisor',
      navDiseaseDetection: 'Disease Detection',
      navCropRisk: 'Crop Risk Engine',
      navWeather: 'Weather Advisory',
      navLoans: 'Agri Loans',
      navSchemes: 'Govt Schemes',
      navMarkets: 'Market Prices',
      navHelplines: 'Helplines',
      navProfile: 'Farmer Profile',
      whatShouldIDoNow: 'What Should I Do Now? (Top Priority)',
      greeting: 'Welcome back, Farmer',
      changeProfile: 'Edit Profile',
      farmerCategory: 'Farmer Category',
      landHolding: 'Land Holding',
      currentCrop: 'Current Crop',
      growthStage: 'Growth Stage',
      weatherAlertTitle: 'Agro-Meteorological Advisory',
      overallRiskStatus: 'Current Crop Risk Status',
      quickFinancial: 'Financial & Subsidy Highlights',
      mandiTicker: 'Live Mandi Snapshot',
      viewAll: 'View All',
      explore: 'Explore',
      callNow: 'Call Now',
      checkEligibility: 'Check Eligibility',
      getGuidance: 'View Application Guidance',
      viewCropPlan: 'View Full Crop Plan',
      scanCrop: 'Scan Plant Leaf',
      uploadPhoto: 'Upload or Select Leaf Photo',
      analyzing: 'AI Neural Model Scanning Leaf Matrix...',
      diagnosisReport: 'Crop Health Diagnosis Report',
      organicCure: 'Organic & Bio-Control Remedy',
      chemicalCure: 'Recommended Chemical Formulation',
      preventiveStep: 'Preventive Measures',
      reScan: 'Scan Another Leaf',
      calcRisk: 'Assess Crop Risk',
      loanAmount: 'Required Loan Amount',
      loanPurpose: 'Loan Purpose',
      filterLoans: 'Find Matching Loans',
      filterSchemes: 'Check Eligible Schemes',
      schemeBenefits: 'Benefits & Subsidy',
      docsRequired: 'Documents Checklist',
      howToApply: 'Step-by-Step Procedure',
      aiChatTitle: 'AgriBot - AI Farm Assistant',
      aiChatPlaceholder: 'Ask AgriBot about crops, diseases, loans, or mandis...',
      send: 'Send',
      askQuestionsHint: 'Try asking:',
      chip1: 'What crop to plant in Kharif with canal water?',
      chip2: 'How to cure rice leaf blast organically?',
      chip3: 'How to apply for KCC loan at 4% interest?',
      chip4: 'Best market to sell turmeric today?'
    },
    ta: {
      appName: 'அக்ரி கிராஃப்ட்-AI',
      tagline: 'சரியான பயிர். சரியான நேரம். சரியான செயல். சரியான ஆதரவு.',
      navDashboard: 'முகப்பு பலகை',
      navCropAdvisor: 'பயிர் வழிகாட்டி',
      navDiseaseDetection: 'நோய் கண்டறிதல்',
      navCropRisk: 'பயிர் ஆபத்து கணிப்பான்',
      navWeather: 'வானிலை எச்சரிக்கை',
      navLoans: 'விவசாய கடன்கள்',
      navSchemes: 'அரசு திட்டங்கள்',
      navMarkets: 'சந்தை நிலவரம்',
      navHelplines: 'உதவி எண்கள்',
      navProfile: 'விவசாயி சுயவிவரம்',
      whatShouldIDoNow: 'நான் இப்போது என்ன செய்ய வேண்டும்? (முன்னுரிமை)',
      greeting: 'வணக்கம் விவசாய பெருந்தகையே',
      changeProfile: 'சுயவிவரம் மாற்று',
      farmerCategory: 'விவசாயி வகை',
      landHolding: 'நில அளவு',
      currentCrop: 'தற்போதைய பயிர்',
      growthStage: 'வளர்ச்சி நிலை',
      weatherAlertTitle: 'வேளாண் வானிலை ஆலோசனை',
      overallRiskStatus: 'தற்போதைய பயிர் இடர் நிலை',
      quickFinancial: 'நிதி மற்றும் மானிய சலுகைகள்',
      mandiTicker: 'நேரடி சந்தை விலை நிலவரம்',
      viewAll: 'அனைத்தையும் காண்க',
      explore: 'ஆராய்க',
      callNow: 'அழைக்க',
      checkEligibility: 'தகுதியை சரிபார்க்க',
      getGuidance: 'விண்ணப்ப வழிகாட்டல்',
      viewCropPlan: 'முழு பயிர் திட்டம்',
      scanCrop: 'இலையை ஸ்கேன் செய்க',
      uploadPhoto: 'இலை படத்தை பதிவேற்றவும்',
      analyzing: 'AI நரம்பியல் மாதிரி இலையை ஆய்வு செய்கிறது...',
      diagnosisReport: 'பயிர் ஆரோக்கிய ஆய்வு அறிக்கை',
      organicCure: 'இயற்கை & உயிரியல் கட்டுப்பாடு',
      chemicalCure: 'பரிந்துரைக்கப்பட்ட மருந்து அளவு',
      preventiveStep: 'தடுப்பு நடவடிக்கைகள்',
      reScan: 'மற்றொரு இலையை ஸ்கேன் செய்ய',
      calcRisk: 'ஆபத்தை கணக்கிடு',
      loanAmount: 'தேவைப்படும் கடன் தொகை',
      loanPurpose: 'கடன் நோக்கம்',
      filterLoans: 'பொருத்தமான கடன்களை காண்க',
      filterSchemes: 'தகுதியான திட்டங்களை காண்க',
      schemeBenefits: 'நன்மைகள் & மானியம்',
      docsRequired: 'தேவைப்படும் ஆவணங்கள் பட்டியல்',
      howToApply: 'விண்ணப்பிக்கும் முறை',
      aiChatTitle: 'அக்ரிபாட் - AI வேளாண் உதவியாளர்',
      aiChatPlaceholder: 'பயிர், நோய், கடன் அல்லது சந்தை பற்றி கேட்கவும்...',
      send: 'அனுப்புக',
      askQuestionsHint: 'பரிந்துரைக்கப்பட்ட கேள்விகள்:',
      chip1: 'வாய்க்கால் பாசனத்திற்கு எந்த பயிர் ஏற்றது?',
      chip2: 'நெல் குலை நோயை இயற்கை முறையில் குணப்படுத்துவது எப்படி?',
      chip3: '4% வட்டியில் KCC கடன் பெறுவது எப்படி?',
      chip4: 'இன்று மஞ்சளை விற்க சிறந்த சந்தை எது?'
    }
  }
};

// Export to window for browser access
if (typeof window !== 'undefined') {
  window.AGRI_DATA = AGRI_DATA;
}
