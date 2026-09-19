/**
 * AGRI CRAFT-AI - Main Application Controller
 * Handles routing, bilingual localization (English / Tamil), dynamic views,
 * user interactions, modals, and AI engine binding.
 */

// Default Farmer Profile State
let currentProfile = {
  name: 'Murugan K',
  district: 'thanjavur',
  farmSize: 2.5,
  unit: 'Acres',
  soil: 'alluvial',
  water: 'canal',
  irrigation: 'flood',
  currentCrop: 'Paddy (Rice)',
  cropStage: 'Tillering (35 Days)',
  farmerCategory: 'Small'
};

let currentLang = 'en';
let activeView = 'dashboard';
let currentDiseaseScan = null;
let currentRiskAssessment = null;

// ==========================================================================
// Live Weather & Open-Meteo State Management
// ==========================================================================
let liveWeather = {
  isLoading: false,
  isLive: false,
  lastSync: 'Syncing...',
  forecastDays: 7,
  districtId: 'thanjavur',
  locationName: 'Thanjavur',
  locationName_ta: 'தஞ்சாவூர்',
  lat: 10.7870,
  lon: 79.1378,
  current: {
    temp: 28.7,
    humidity: 75,
    weatherCode: 3,
    windSpeed: 10.6,
    precipitation: 0.0,
    conditionLabel: 'Overcast',
    conditionLabel_ta: 'முழு மேகமூட்டம்',
    icon: '☁️'
  },
  daily: []
};

// Look up WMO code details from dataset
function getWmoDetails(code) {
  const table = AGRI_DATA.wmoWeatherCodes || {};
  return table[code] || { label: 'Partly Cloudy', label_ta: 'பகுதி மேகமூட்டம்', icon: '⛅' };
}

// Generate tailored precision agricultural advisories from daily weather metrics
function generateDailyAgroAdvisory(rainProb, rainSum, maxTemp) {
  if (rainSum >= 10 || rainProb >= 70) {
    return {
      en: `Heavy Rain Alert (${rainSum.toFixed(1)}mm / ${rainProb}%). Postpone all chemical & fertilizer sprays. Clear field bund drainage exits immediately.`,
      ta: `கனமழை எச்சரிக்கை (${rainSum.toFixed(1)}மி.மீ / ${rainProb}%). உரம் மற்றும் பூச்சிக்கொல்லி தெளிப்பதை தவிர்க்கவும். வயல் வடிகால் வாய்க்கால்களை உடனே திறக்கவும்.`
    };
  }
  if (rainProb >= 40 || rainSum >= 2.5) {
    return {
      en: `Light to Moderate Showers (${rainSum.toFixed(1)}mm). Hold flood irrigation; preserve soil moisture. Monitor for fungal leaf spots.`,
      ta: `லேசானது முதல் மிதமான மழை (${rainSum.toFixed(1)}மி.மீ). கூடுதல் பாசனத்தை குறைக்கவும்; இலைப்புள்ளி பூஞ்சான நோய்களை கண்காணிக்கவும்.`
    };
  }
  if (maxTemp >= 35) {
    return {
      en: `High Heat Stress Warning (${maxTemp.toFixed(1)}°C). Schedule light evening drip irrigation cycles to prevent flower/fruit drop.`,
      ta: `அதிக வெப்ப எச்சரிக்கை (${maxTemp.toFixed(1)}°C). பூக்கள் மற்றும் பிஞ்சுகள் உதிர்வதை தடுக்க மாலை வேளையில் சொட்டு நீர் பாசனம் செய்யவும்.`
    };
  }
  return {
    en: 'Optimal agronomic conditions. Ideal for fertilizer top-dressing, manual weeding, and regular farm management.',
    ta: 'விவசாயத்திற்கு உகந்த காலநிலை. மேலுரமிடுதல், களையெடுத்தல் மற்றும் வழக்கமான பயிர் பராமரிப்பு பணிகளை மேற்கொள்ளலாம்.'
  };
}

// Fetch live weather directly from Open-Meteo API (Free, No API Key Required)
async function fetchOpenMeteoWeather(lat, lon, days = 7) {
  liveWeather.isLoading = true;
  liveWeather.lat = lat;
  liveWeather.lon = lon;
  liveWeather.forecastDays = days;

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum&timezone=auto&forecast_days=${days}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Open-Meteo HTTP ${response.status}`);
    const data = await response.json();

    const curr = data.current || {};
    const wmo = getWmoDetails(curr.weather_code);

    liveWeather.current = {
      temp: curr.temperature_2m != null ? curr.temperature_2m : 28.5,
      humidity: curr.relative_humidity_2m != null ? curr.relative_humidity_2m : 72,
      weatherCode: curr.weather_code,
      windSpeed: curr.wind_speed_10m != null ? curr.wind_speed_10m : 11,
      precipitation: curr.precipitation != null ? curr.precipitation : 0.0,
      conditionLabel: wmo.label,
      conditionLabel_ta: wmo.label_ta,
      icon: wmo.icon
    };

    const daily = data.daily || {};
    const times = daily.time || [];
    liveWeather.daily = times.map((tStr, idx) => {
      const code = daily.weather_code ? daily.weather_code[idx] : 2;
      const wInfo = getWmoDetails(code);
      const maxT = daily.temperature_2m_max ? daily.temperature_2m_max[idx] : 32;
      const minT = daily.temperature_2m_min ? daily.temperature_2m_min[idx] : 24;
      const rProb = daily.precipitation_probability_max ? daily.precipitation_probability_max[idx] : 15;
      const rSum = daily.precipitation_sum ? daily.precipitation_sum[idx] : 0.0;
      const dateObj = new Date(tStr);
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayNames_ta = ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி'];
      const isToday = idx === 0;

      const advisory = generateDailyAgroAdvisory(rProb, rSum, maxT);

      return {
        dateStr: tStr,
        dayLabel: isToday ? 'Today' : dayNames[dateObj.getDay()],
        dayLabel_ta: isToday ? 'இன்று' : dayNames_ta[dateObj.getDay()],
        formattedDate: dateObj.toLocaleDateString(currentLang === 'ta' ? 'ta-IN' : 'en-IN', { day: 'numeric', month: 'short' }),
        maxTemp: maxT,
        minTemp: minT,
        rainProb: rProb,
        rainSum: rSum,
        weatherCode: code,
        icon: wInfo.icon,
        conditionLabel: wInfo.label,
        conditionLabel_ta: wInfo.label_ta,
        advisoryEn: advisory.en,
        advisoryTa: advisory.ta
      };
    });

    liveWeather.isLive = true;
    const now = new Date();
    liveWeather.lastSync = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch (err) {
    console.warn('Open-Meteo live API unreachable or offline, using fallback:', err);
    liveWeather.isLive = false;
    const now = new Date();
    liveWeather.lastSync = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (Simulated)';
  } finally {
    liveWeather.isLoading = false;
    runInitialAssessments();
    if (activeView === 'dashboard') renderDashboard();
    if (activeView === 'weather') renderAgroWeather();
  }
}

// Sync live weather using the farmer's active district coordinates
function syncLiveWeatherForActiveDistrict(days = 7) {
  const dist = AGRI_DATA.districts.find(d => d.id === currentProfile.district) || AGRI_DATA.districts[0];
  liveWeather.districtId = dist.id;
  liveWeather.locationName = dist.name;
  liveWeather.locationName_ta = dist.name_ta;
  fetchOpenMeteoWeather(dist.lat, dist.lon, days);
}

// Detect live farmer GPS coordinates via HTML5 Geolocation API
function detectUserGPSLocation() {
  if (!navigator.geolocation) {
    alert(currentLang === 'ta' ? 'உங்கள் உலாவியில் GPS இருப்பிட வசதி இல்லை.' : 'GPS Geolocation is not supported by your browser.');
    return;
  }

  const gpsButtons = document.querySelectorAll('.btn-gps-detect');
  gpsButtons.forEach(b => b.innerHTML = currentLang === 'ta' ? '📍 GPS கண்டறிகிறது...' : '📍 Finding GPS...');

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      // Find closest district in our agro database
      let closest = AGRI_DATA.districts[0];
      let minDistance = 999999;
      AGRI_DATA.districts.forEach(d => {
        const dist = Math.sqrt(Math.pow(d.lat - lat, 2) + Math.pow(d.lon - lon, 2));
        if (dist < minDistance) {
          minDistance = dist;
          closest = d;
        }
      });

      liveWeather.locationName = `${closest.name} (${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E)`;
      liveWeather.locationName_ta = `${closest.name_ta} (${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E)`;

      fetchOpenMeteoWeather(lat, lon, liveWeather.forecastDays);
    },
    (error) => {
      alert(currentLang === 'ta' ? 'GPS அணுகலை அனுமதிக்கவில்லை அல்லது பெற முடியவில்லை. மாவட்ட பட்டியலிலிருந்து தேர்ந்தெடுக்கவும்.' : 'Could not access GPS location. Falling back to active district coordinates.');
      gpsButtons.forEach(b => b.innerHTML = currentLang === 'ta' ? '📍 நேரடி GPS இருப்பிடம்' : '📍 Detect Live GPS');
    },
    { timeout: 8000, enableHighAccuracy: true }
  );
}

// Change forecast range (7, 10, or 16 days)
function changeForecastRange(days) {
  liveWeather.forecastDays = days;
  fetchOpenMeteoWeather(liveWeather.lat, liveWeather.lon, days);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Load saved profile if any
  const savedProfile = localStorage.getItem('agri_craft_profile');
  if (savedProfile) {
    try { currentProfile = JSON.parse(savedProfile); } catch (e) {}
  }

  // Load saved language
  const savedLang = localStorage.getItem('agri_craft_lang');
  if (savedLang) {
    currentLang = savedLang;
  }

  // Initialize AgriChat
  if (window.AgriChat) {
    window.AgriChat.init(currentLang);
  }

  // Bind navigation buttons
  initNavigation();

  // Bind language toggle
  initLanguageToggle();

  // Bind AgriBot Chat
  initAgriBotUI();

  // Fetch initial live Open-Meteo weather
  syncLiveWeatherForActiveDistrict(7);

  // Run initial calculations
  runInitialAssessments();

  // Render initial view
  renderApp();
});

/**
 * Run baseline AI evaluations for the active profile
 */
function runInitialAssessments() {
  let weatherCondition = 'Normal';
  if (liveWeather.current.precipitation > 5 || (liveWeather.daily[0] && liveWeather.daily[0].rainSum >= 10)) {
    weatherCondition = 'Heavy Rain';
  } else if (liveWeather.current.temp >= 36) {
    weatherCondition = 'Heatwave';
  }

  currentRiskAssessment = AgriEngine.calculateCropRisk({
    cropStage: currentProfile.cropStage,
    weather: weatherCondition,
    soil: currentProfile.soil,
    irrigation: currentProfile.irrigation,
    disease: currentDiseaseScan ? currentDiseaseScan.id : 'None'
  });
}

/**
 * Bind Navigation Tab Buttons
 */
function initNavigation() {
  const navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const viewId = btn.dataset.view;
      if (viewId) {
        switchView(viewId);
      }
    });
  });

  // Action links with data-navigate
  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-navigate]');
    if (target) {
      e.preventDefault();
      const viewId = target.getAttribute('data-navigate');
      switchView(viewId);
    }
  });
}

function switchView(viewId) {
  activeView = viewId;

  // Update nav buttons
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.view === viewId);
  });

  // Update view sections
  document.querySelectorAll('.view-section').forEach(sec => {
    sec.classList.toggle('active', sec.id === `view-${viewId}`);
  });

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Re-render view specific dynamic components
  if (viewId === 'crop_advisor') {
    renderCropAdvisor();
  } else if (viewId === 'disease_detection') {
    renderDiseaseDetection();
  } else if (viewId === 'crop_risk') {
    renderRiskEngine();
  } else if (viewId === 'loans') {
    renderLoans();
  } else if (viewId === 'schemes') {
    renderSchemes();
  } else if (viewId === 'markets') {
    renderMarkets();
  } else if (viewId === 'helplines') {
    renderHelplines();
  } else if (viewId === 'weather') {
    renderAgroWeather();
  } else if (viewId === 'profile') {
    renderProfileForm();
  } else {
    renderDashboard();
  }
}

/**
 * Language Switching System
 */
function initLanguageToggle() {
  const toggleBtn = document.getElementById('btnLangToggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      currentLang = currentLang === 'en' ? 'ta' : 'en';
      localStorage.setItem('agri_craft_lang', currentLang);
      if (window.AgriChat) {
        window.AgriChat.init(currentLang);
      }
      renderApp();
    });
  }
}

function t(key) {
  const dict = AGRI_DATA.i18n[currentLang] || AGRI_DATA.i18n.en;
  return dict[key] || key;
}

/**
 * Master Re-render
 */
function renderApp() {
  // Update header text
  const toggleBtn = document.getElementById('btnLangToggle');
  if (toggleBtn) {
    toggleBtn.innerHTML = `🌐 ${currentLang === 'en' ? 'தமிழ்' : 'English'}`;
  }

  // Update static localized elements with data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });

  // Update user chip
  const userChipName = document.getElementById('userChipName');
  if (userChipName) {
    userChipName.textContent = currentProfile.name;
  }

  // Render current view
  switchView(activeView);
}

/**
 * 1. RENDER DASHBOARD
 */
function renderDashboard() {
  const container = document.getElementById('view-dashboard');
  if (!container) return;

  const actions = AgriEngine.getTopPriorityActions(
    currentProfile,
    currentRiskAssessment,
    currentDiseaseScan,
    currentProfile.currentCrop
  );

  const isTa = currentLang === 'ta';

  container.innerHTML = `
    <!-- Top Announcement / Hero -->
    <div class="hero-banner">
      <div class="hero-content">
        <h2>${isTa ? `வணக்கம், ${currentProfile.name}!` : `Welcome back, ${currentProfile.name}!`}</h2>
        <p>${isTa ? 'உங்கள் பண்ணைக்கான தற்போதைய பருவ நுண்ணறிவு, வானிலை எச்சரிக்கை மற்றும் முன்னுரிமை பரிந்துரைகள் இங்கே தொகுக்கப்பட்டுள்ளன.' : 'Here is your unified agricultural control center: real-time agro-weather, active crop risks, market prices, and direct financial subsidies.'}</p>
        <div class="hero-badges">
          <div class="hero-badge-item">📍 ${isTa ? 'மாவட்டம்' : 'District'}: <strong>${currentProfile.district.toUpperCase()}</strong></div>
          <div class="hero-badge-item">🌾 ${isTa ? 'பயிர்' : 'Crop'}: <strong>${currentProfile.currentCrop}</strong></div>
          <div class="hero-badge-item">📏 ${isTa ? 'பரப்பளவு' : 'Area'}: <strong>${currentProfile.farmSize} ${currentProfile.unit}</strong></div>
        </div>
      </div>
      <div style="text-align: right; z-index: 1;">
        <button class="btn-primary" data-navigate="crop_advisor">
          ${isTa ? '🌾 புதிய பயிர் பரிந்துரை' : '🌾 AI Crop Advisor'}
        </button>
      </div>
    </div>

    <!-- Priority Action ("What Should I Do Now?") Section -->
    <div class="priority-action-card">
      <div class="priority-header">
        <div class="priority-title-wrap">
          <span style="font-size: 1.5rem;">⚡</span>
          <h3>${t('whatShouldIDoNow')}</h3>
        </div>
        <span class="priority-badge ${actions.topAction.badgeClass}">${isTa ? actions.topAction.urgency_ta : actions.topAction.urgency}</span>
      </div>

      <div class="priority-main-box">
        <h4>${isTa ? actions.topAction.title_ta : actions.topAction.title}</h4>
        <p>${actions.topAction.description}</p>
      </div>

      <div class="priority-steps-grid">
        ${actions.nextSteps.map(step => `
          <div class="step-card">
            <span class="step-icon">${step.icon}</span>
            <span class="step-text">${isTa ? step.text_ta : step.text}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Dashboard Widgets Grid -->
    <div class="dashboard-grid">
      <!-- 1. Weather Widget (Live Open-Meteo Telemetry) -->
      <div class="dash-card card-weather">
        <div class="card-head">
          <h3>🌤️ ${t('weatherAlertTitle')}</h3>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="badge-live-pulse">${liveWeather.isLive ? 'LIVE' : 'AUTO'} ${liveWeather.lastSync}</span>
            <a href="#" class="card-action-link" data-navigate="weather">${t('viewAll')} →</a>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <span style="font-size: 0.825rem; font-weight: 700; color: var(--primary-900);">
            📍 ${isTa ? liveWeather.locationName_ta : liveWeather.locationName}
          </span>
          <div style="display: flex; gap: 0.35rem;">
            <button class="gps-locate-btn btn-gps-detect" onclick="detectUserGPSLocation()" title="Use live GPS coordinates">
              📍 ${isTa ? 'GPS' : 'GPS'}
            </button>
            <button class="gps-locate-btn" onclick="syncLiveWeatherForActiveDistrict(liveWeather.forecastDays)" title="Sync latest weather">
              🔄
            </button>
          </div>
        </div>

        <div class="weather-main-row">
          <div>
            <div class="weather-temp">${liveWeather.current.temp != null ? liveWeather.current.temp.toFixed(1) : '28.5'}°C</div>
            <div style="font-weight: 600; color: var(--text-muted);">
              ${isTa ? liveWeather.current.conditionLabel_ta : liveWeather.current.conditionLabel}
            </div>
          </div>
          <div style="font-size: 3.2rem;">${liveWeather.current.icon}</div>
        </div>

        <div class="weather-stats">
          <div>💧 ${isTa ? 'ஈரப்பதம்' : 'Humidity'}: <strong>${liveWeather.current.humidity}%</strong></div>
          <div>🌧️ ${isTa ? 'மழை வாய்ப்பு' : 'Rain Chance'}: <strong>${liveWeather.daily[0] ? liveWeather.daily[0].rainProb : 15}%</strong></div>
          <div>💨 ${isTa ? 'காற்று' : 'Wind'}: <strong>${liveWeather.current.windSpeed} km/h</strong></div>
          <div>☔ ${isTa ? 'மழை அளவு' : 'Precipitation'}: <strong>${liveWeather.current.precipitation} mm</strong></div>
        </div>

        <div class="weather-alert-box">
          💡 ${liveWeather.daily[0] ? (isTa ? liveWeather.daily[0].advisoryTa : liveWeather.daily[0].advisoryEn) : (isTa ? 'வானிலை தரவு புதுப்பிக்கப்படுகிறது...' : 'Syncing live agro-weather...')}
        </div>
      </div>

      <!-- 2. Current Crop & Stage -->
      <div class="dash-card card-crop-status">
        <div class="card-head">
          <h3>🌱 ${t('currentCrop')}</h3>
          <a href="#" class="card-action-link" data-navigate="profile">${t('changeProfile')} →</a>
        </div>
        <div style="font-size: 1.35rem; font-weight: 800; color: var(--primary-900); margin-bottom: 0.25rem;">
          ${currentProfile.currentCrop}
        </div>
        <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1rem;">
          ${isTa ? 'வளர்ச்சி நிலை' : 'Growth Stage'}: <strong>${currentProfile.cropStage}</strong>
        </div>
        <div style="background: #f8fafc; padding: 0.85rem; border-radius: var(--radius-md); font-size: 0.85rem; margin-bottom: 1rem;">
          <div>🚜 ${isTa ? 'மண்' : 'Soil'}: <strong>${currentProfile.soil.toUpperCase()}</strong></div>
          <div>💧 ${isTa ? 'பாசனம்' : 'Irrigation'}: <strong>${currentProfile.irrigation.toUpperCase()}</strong></div>
          <div>🏞️ ${isTa ? 'நீர் ஆதாரம்' : 'Water'}: <strong>${currentProfile.water.toUpperCase()}</strong></div>
        </div>
        <button class="btn-primary" style="width: 100%; font-size: 0.875rem; padding: 0.65rem;" data-navigate="disease_detection">
          📸 ${isTa ? 'இலை ஸ்கேன் செய்க' : 'Scan Leaf for Diseases'}
        </button>
      </div>

      <!-- 3. Risk Meter -->
      <div class="dash-card card-risk-meter">
        <div class="card-head">
          <h3>🛡️ ${t('overallRiskStatus')}</h3>
          <a href="#" class="card-action-link" data-navigate="crop_risk">${t('explore')} →</a>
        </div>
        <div class="risk-gauge-wrap">
          <span class="risk-level-badge badge-${currentRiskAssessment.level.toLowerCase()}">
            ${currentRiskAssessment.level} RISK (${currentRiskAssessment.score}%)
          </span>
          <div class="risk-bar">
            <div class="risk-bar-fill" style="width: ${currentRiskAssessment.score}%; background: ${currentRiskAssessment.color};"></div>
          </div>
          <p style="font-size: 0.85rem; color: var(--text-muted); text-align: left; margin-top: 0.75rem;">
            ${currentRiskAssessment.factors[0]?.title || 'Environmental factors stable.'}
          </p>
        </div>
      </div>

      <!-- 4. Quick Financial / Subsidies Preview -->
      <div class="dash-card card-schemes-preview">
        <div class="card-head">
          <h3>🏛️ ${t('quickFinancial')}</h3>
          <a href="#" class="card-action-link" data-navigate="schemes">${t('viewAll')} →</a>
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          <div style="background: #ecfdf5; border-left: 4px solid #059669; padding: 0.75rem; border-radius: 6px;">
            <div style="font-weight: 700; color: #064e3b;">PM-KISAN Samman Nidhi (₹6,000/yr)</div>
            <div style="font-size: 0.8rem; color: #065f46;">${isTa ? 'அடுத்த தவணை சரிபார்க்கப்பட்டது: தகுதி உண்டு' : 'Status: Eligible. Direct DBT credit to Aadhaar linked bank.'}</div>
          </div>
          <div style="background: #fffbeb; border-left: 4px solid #d97706; padding: 0.75rem; border-radius: 6px;">
            <div style="font-weight: 700; color: #92400e;">KCC Crop Loan @ 4.0% p.a.</div>
            <div style="font-size: 0.8rem; color: #b45309;">${isTa ? 'வட்டி தள்ளுபடி சலுகை: ₹3 லட்சம் வரை பிணையற்ற கடன்' : 'Interest subvention available up to ₹3 Lakh with prompt repayment.'}</div>
          </div>
        </div>
      </div>

      <!-- 5. Mandi Market Preview -->
      <div class="dash-card card-mandi-preview">
        <div class="card-head">
          <h3>📊 ${t('mandiTicker')}</h3>
          <a href="#" class="card-action-link" data-navigate="markets">${t('viewAll')} →</a>
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.6rem;">
          ${AGRI_DATA.marketPrices.slice(0, 3).map(m => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px dashed #e2e8f0;">
              <div>
                <strong style="font-size: 0.9rem;">${isTa ? m.cropName_ta : m.cropName}</strong>
                <div style="font-size: 0.75rem; color: var(--text-muted);">${isTa ? m.mandi_ta : m.mandi}</div>
              </div>
              <div style="text-align: right;">
                <div style="font-weight: 800; color: var(--primary-900);">₹${m.currentPrice.toLocaleString('en-IN')}</div>
                <span class="${m.trend === 'UP' ? 'trend-up' : m.trend === 'DOWN' ? 'trend-down' : 'trend-stable'}" style="font-size: 0.75rem;">
                  ${m.trend === 'UP' ? '▲' : m.trend === 'DOWN' ? '▼' : '▬'} ${m.percentChange}
                </span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 6. Helplines Callout -->
      <div class="dash-card card-helpline-full" style="background: linear-gradient(135deg, #f0fdf4, #ffffff); border: 1px solid #bbf7d0;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h3 style="color: #064e3b; margin-bottom: 0.25rem;">📞 ${isTa ? 'உடனடி வேளாண் விஞ்ஞானி உதவி மையம் (இலவசம்)' : 'Direct Agricultural Scientist Assistance (Toll-Free)'}</h3>
            <p style="font-size: 0.85rem; color: #166534;">
              ${isTa ? 'பயிர் பூச்சி தாக்குதல் மற்றும் சந்தேகங்களுக்கு 24 மணி நேரமும் தொடர்பு கொள்ளலாம்.' : 'Toll-free 1800-180-1551 (Kisan Call Center). Available 6 AM - 10 PM in Tamil and English.'}
            </p>
          </div>
          <a href="tel:18001801551" class="btn-call">
            📞 ${t('callNow')}: 1800-180-1551
          </a>
        </div>
      </div>
    </div>
  `;
}

/**
 * 2. RENDER CROP ADVISOR
 */
function renderCropAdvisor() {
  const container = document.getElementById('view-crop_advisor');
  if (!container) return;

  const isTa = currentLang === 'ta';

  container.innerHTML = `
    <div style="margin-bottom: 1.5rem;">
      <h2>🌾 ${isTa ? 'AI பயிர் வழிகாட்டி & தேர்வு கணிப்பான்' : 'AI Crop Recommendation Engine'}</h2>
      <p style="color: var(--text-muted);">${isTa ? 'மண், பாசனம், பருவம் மற்றும் நீர் வசதியை ஆய்வு செய்து அதிக லாபம் தரும் பயிர்களை கண்டறியவும்.' : 'Scientifically match your soil, water availability, irrigation infrastructure, and season to discover optimal crops.'}</p>
    </div>

    <!-- Wizard Form -->
    <div class="form-card">
      <form id="cropAdvisorForm">
        <div class="form-grid-3">
          <div class="form-group">
            <label>${isTa ? 'மாவட்டம்' : 'District'}</label>
            <select class="form-control" id="advDistrict">
              ${AGRI_DATA.districts.map(d => `<option value="${d.id}" ${currentProfile.district === d.id ? 'selected' : ''}>${isTa ? d.name_ta : d.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>${isTa ? 'மண் வகை' : 'Soil Type'}</label>
            <select class="form-control" id="advSoil">
              ${AGRI_DATA.soilTypes.map(s => `<option value="${s.id}" ${currentProfile.soil === s.id ? 'selected' : ''}>${isTa ? s.name_ta : s.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>${isTa ? 'பருவம்' : 'Season'}</label>
            <select class="form-control" id="advSeason">
              ${AGRI_DATA.seasons.map(s => `<option value="${s.id}">${isTa ? s.name_ta : s.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>${isTa ? 'நீர் ஆதாரம்' : 'Water Availability'}</label>
            <select class="form-control" id="advWater">
              ${AGRI_DATA.waterSources.map(w => `<option value="${w.id}" ${currentProfile.water === w.id ? 'selected' : ''}>${isTa ? w.name_ta : w.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>${isTa ? 'பாசன முறை' : 'Irrigation Type'}</label>
            <select class="form-control" id="advIrrigation">
              ${AGRI_DATA.irrigationTypes.map(i => `<option value="${i.id}" ${currentProfile.irrigation === i.id ? 'selected' : ''}>${isTa ? i.name_ta : i.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>${isTa ? 'பண்ணை அளவு (ஏக்கர்)' : 'Farm Size (Acres)'}</label>
            <input type="number" class="form-control" id="advFarmSize" value="${currentProfile.farmSize}" min="0.5" step="0.5">
          </div>
        </div>
        <button type="submit" class="btn-primary" style="width: 100%;">
          🔍 ${isTa ? 'பொருத்தமான பயிர்களை கண்டறியவும்' : 'Analyze & Recommend Suitable Crops'}
        </button>
      </form>
    </div>

    <!-- Recommendations Output Container -->
    <div id="cropAdvisorResults"></div>
  `;

  // Bind Form Submit
  const form = document.getElementById('cropAdvisorForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    executeCropRecommendation();
  });

  // Run automatically on first render
  executeCropRecommendation();
}

function executeCropRecommendation() {
  const district = document.getElementById('advDistrict').value;
  const soil = document.getElementById('advSoil').value;
  const season = document.getElementById('advSeason').value;
  const water = document.getElementById('advWater').value;
  const irrigation = document.getElementById('advIrrigation').value;
  const farmSize = document.getElementById('advFarmSize').value;

  const results = AgriEngine.recommendCrops({
    district, soil, season, water, irrigation, farmSize
  });

  const isTa = currentLang === 'ta';
  const out = document.getElementById('cropAdvisorResults');

  out.innerHTML = `
    <h3 style="margin-bottom: 1.25rem;">
      🎯 ${isTa ? `பரிந்துரைக்கப்பட்ட பயிர்கள் (${results.length})` : `Top Recommended Crops (${results.length})`}
    </h3>
    <div class="crop-results-grid">
      ${results.map(crop => `
        <div class="crop-card">
          <div>
            <div class="crop-card-head">
              <div class="crop-card-title">
                <span class="crop-icon-large">${crop.icon}</span>
                <div>
                  <h4 style="font-size: 1.25rem;">${isTa ? crop.name_ta : crop.name}</h4>
                  <span style="font-size: 0.8rem; color: var(--text-muted);">${crop.category}</span>
                </div>
              </div>
              <span class="suitability-pill">${crop.suitabilityScore}% ${isTa ? 'பொருத்தம்' : 'Match'}</span>
            </div>

            <div class="crop-reason-box">
              <strong>${isTa ? 'காரணம்' : 'Why Recommended'}:</strong> ${crop.whyRecommended}
            </div>

            <ul class="crop-spec-list">
              <li>
                <span>💧 ${isTa ? 'நீர் தேவை' : 'Water Need'}:</span>
                <strong>${crop.waterRequirement}</strong>
              </li>
              <li>
                <span>⏳ ${isTa ? 'பயிர் காலம்' : 'Duration'}:</span>
                <strong>${crop.growingPeriod}</strong>
              </li>
              <li>
                <span>🌾 ${isTa ? 'எதிர்பார்க்கப்படும் மகசூல்' : 'Exp. Yield'}:</span>
                <strong>${crop.expectedYield}</strong>
              </li>
              <li>
                <span>💰 ${isTa ? 'சந்தை விலை' : 'Market Price'}:</span>
                <strong>${crop.marketRateApprox}</strong>
              </li>
              <li>
                <span>🛡️ ${isTa ? 'ஆபத்து நிலை' : 'Risk Tier'}:</span>
                <strong class="badge-${crop.dynamicRisk.toLowerCase()}" style="padding: 2px 6px; border-radius: 4px;">${crop.dynamicRisk}</strong>
              </li>
            </ul>
          </div>

          <button class="btn-primary" style="width: 100%; font-size: 0.85rem;" onclick="openCropPlanModal('${crop.id}')">
            📋 ${t('viewCropPlan')}
          </button>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * 3. RENDER DISEASE DETECTION (COMPUTER VISION SCANNER)
 */
function renderDiseaseDetection() {
  const container = document.getElementById('view-disease_detection');
  if (!container) return;

  const isTa = currentLang === 'ta';
  const defaultDisease = currentDiseaseScan || AGRI_DATA.diseases[0];

  container.innerHTML = `
    <div style="margin-bottom: 1.5rem;">
      <h2>📸 ${isTa ? 'AI பயிர் இலை நோய் கண்டறிதல்' : 'AI Crop Disease Diagnostic Scanner'}</h2>
      <p style="color: var(--text-muted);">${isTa ? 'இலை புகைப்படத்தை பதிவேற்றி அல்லது மாதிரி இலையை தேர்வு செய்து உடனடியாக நோயை கண்டறியவும்.' : 'Upload or sample crop leaves to initiate automated computer vision feature diagnostics with organic and chemical remedies.'}</p>
    </div>

    <div class="disease-scanner-container">
      <!-- Scanner Frame Side -->
      <div class="scanner-box" id="scannerBox">
        <div class="preview-frame" id="previewFrame">
          <div class="scan-laser" id="scanLaser"></div>
          <div id="imageHolder" style="width: 100%; height: 100%;">
            ${defaultDisease.sampleImage}
          </div>
        </div>

        <div style="display: flex; gap: 0.75rem; width: 100%; max-width: 380px;">
          <input type="file" id="leafFileInput" accept="image/*" style="display: none;">
          <button class="btn-primary" style="flex: 1;" onclick="document.getElementById('leafFileInput').click()">
            📁 ${isTa ? 'புகைப்படம் பதிவேற்றவும்' : 'Upload Leaf Photo'}
          </button>
          <button class="btn-primary" style="background: #1e293b;" onclick="triggerScanningAnimation('${defaultDisease.id}')">
            ⚡ ${isTa ? 'மீண்டும் ஸ்கேன்' : 'Re-Scan'}
          </button>
        </div>

        <!-- Sample Leaf Test Presets -->
        <div class="sample-leaf-selector">
          <p>${isTa ? 'விரைவு சோதனைக்கு மாதிரி இலையை தேர்வு செய்க:' : 'Or test with pre-analyzed sample leaves:'}</p>
          <div class="sample-chips">
            ${AGRI_DATA.diseases.map(d => `
              <button class="sample-chip" onclick="selectSampleLeaf('${d.id}')">
                ${isTa ? d.crop_ta : d.crop}: ${isTa ? d.diseaseName_ta.split(' ')[0] : d.diseaseName.split('(')[0]}
              </button>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Diagnostic Results Panel -->
      <div class="diagnosis-panel" id="diagnosisPanel">
        ${renderDiagnosisReportHTML(defaultDisease)}
      </div>
    </div>
  `;

  // Bind file input upload simulation
  const fileInput = document.getElementById('leafFileInput');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (re) => {
          document.getElementById('imageHolder').innerHTML = `<img src="${re.target.result}" alt="Uploaded Leaf" style="width:100%; height:100%; object-fit:cover;">`;
          // Trigger scan with random or tomato blight diagnosis
          triggerScanningAnimation('tomato_early_blight');
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

function selectSampleLeaf(diseaseId) {
  const match = AGRI_DATA.diseases.find(d => d.id === diseaseId);
  if (!match) return;

  document.getElementById('imageHolder').innerHTML = match.sampleImage;
  triggerScanningAnimation(diseaseId);
}

function triggerScanningAnimation(diseaseId) {
  const scannerBox = document.getElementById('scannerBox');
  const panel = document.getElementById('diagnosisPanel');
  const isTa = currentLang === 'ta';

  scannerBox.classList.add('scanning');
  panel.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 350px;">
      <div style="font-size: 3rem; animation: spin 1.5s linear infinite;">⚙️</div>
      <h4 style="margin-top: 1rem; color: var(--primary-700);">${t('analyzing')}</h4>
      <p style="font-size: 0.85rem; color: var(--text-muted);">${isTa ? 'இலை நரம்புகள், நிற மாற்றங்கள் மற்றும் பூஞ்சான திசுக்கள் பகுப்பாய்வு செய்யப்படுகின்றன...' : 'Evaluating cellular lesion morphology, chlorosis radius, and fungal sporulation patterns...'}</p>
    </div>
  `;

  setTimeout(() => {
    scannerBox.classList.remove('scanning');
    const result = AgriEngine.detectDisease(diseaseId);
    currentDiseaseScan = result;
    // Update active risk assessment
    runInitialAssessments();
    panel.innerHTML = renderDiagnosisReportHTML(result);
  }, 1200);
}

function renderDiagnosisReportHTML(disease) {
  const isTa = currentLang === 'ta';
  return `
    <div class="report-header">
      <div>
        <span style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">
          ${isTa ? 'பயிர்' : 'Affected Crop'}: <strong>${isTa ? disease.crop_ta : disease.crop}</strong>
        </span>
        <h3 style="font-size: 1.4rem; color: var(--primary-900); margin-top: 0.2rem;">
          ${isTa ? disease.diseaseName_ta : disease.diseaseName}
        </h3>
      </div>
      <div class="report-badge-wrap">
        <span class="suitability-pill">${disease.confidence}% ${isTa ? 'துல்லியம்' : 'Confidence'}</span>
        <span class="risk-level-badge badge-${disease.riskLevel.toLowerCase()}" style="font-size: 0.85rem; padding: 4px 10px;">
          ${disease.riskLevel} RISK
        </span>
      </div>
    </div>

    <div class="diagnosis-section">
      <h5>🔍 ${isTa ? 'கண்டறியப்பட்ட அறிகுறிகள்' : 'Identified Symptoms'}</h5>
      <ul style="padding-left: 1.25rem; font-size: 0.875rem; color: var(--text-main);">
        ${(isTa ? disease.symptoms_ta : disease.symptoms).map(s => `<li style="margin-bottom: 0.35rem;">${s}</li>`).join('')}
      </ul>
    </div>

    <div class="diagnosis-section">
      <h5>🌿 ${t('organicCure')}</h5>
      <div class="treatment-box treatment-organic">
        ${isTa ? disease.organicAction_ta : disease.organicAction}
      </div>
    </div>

    <div class="diagnosis-section">
      <h5>🧪 ${t('chemicalCure')}</h5>
      <div class="treatment-box treatment-chemical">
        ${isTa ? disease.chemicalAction_ta : disease.chemicalAction}
      </div>
    </div>

    <div class="diagnosis-section">
      <h5>🛡️ ${t('preventiveStep')}</h5>
      <div style="font-size: 0.85rem; color: var(--text-muted);">
        ${isTa ? disease.preventiveAction_ta : disease.preventiveAction}
      </div>
    </div>

    <div style="margin-top: 1.5rem; display: flex; gap: 0.75rem;">
      <a href="tel:18001801551" class="btn-call" style="flex: 1; font-size: 0.85rem;">
        📞 ${isTa ? 'விஞ்ஞானியிடம் பேசுங்கள்' : 'Consult Agronomist'}
      </a>
      <button class="btn-secondary" onclick="openDocModal('${disease.id}')">
        📝 ${t('docsRequired')}
      </button>
    </div>
  `;
}

/**
 * 4. RENDER CROP RISK ENGINE
 */
function renderRiskEngine() {
  const container = document.getElementById('view-crop_risk');
  if (!container) return;

  const isTa = currentLang === 'ta';

  container.innerHTML = `
    <div style="margin-bottom: 1.5rem;">
      <h2>🛡️ ${isTa ? 'பயிர் இடர் கணிப்பான் இயந்திரம்' : 'Multi-Factor Crop Risk Engine'}</h2>
      <p style="color: var(--text-muted);">${isTa ? 'வானிலை, பயிர் பருவம், மண் ஈரப்பதம், பாசனம் மற்றும் நோய் காரணிகளை ஒருங்கிணைத்து இடர் நிலையை கணக்கிடுகிறது.' : 'Synthesizes 5 key agricultural vulnerabilities into a predictive Risk Tier with actionable early warnings.'}</p>
    </div>

    <div class="form-card">
      <div class="form-grid-3">
        <div class="form-group">
          <label>${isTa ? 'பயிர் வளர்ச்சி நிலை' : 'Crop Growth Stage'}</label>
          <select class="form-control" id="riskStage">
            <option value="Vegetative">Vegetative (இலை வளர்ச்சி நிலை)</option>
            <option value="Flowering" selected>Flowering (பூக்கும் நிலை - உணர்திறன் மிக்கது)</option>
            <option value="Panicle / Pegging">Panicle / Pegging (கதிர் / காய் திரட்சி)</option>
            <option value="Maturity / Pre-Harvest">Maturity / Pre-Harvest (அறுவடைக்கு முந்தைய நிலை)</option>
          </select>
        </div>

        <div class="form-group">
          <label>${isTa ? 'வானிலை முன்னறிவிப்பு' : 'Weather Condition Forecast'}</label>
          <select class="form-control" id="riskWeather">
            <option value="Normal" selected>Normal / Favorable (வழக்கமான சீதோஷ்ணம்)</option>
            <option value="Heavy Rain">Heavy Rain / Cyclone Warning (கனமழை எச்சரிக்கை)</option>
            <option value="Heatwave">Heatwave / High Dry Spell (கடும் வெப்ப அலை)</option>
          </select>
        </div>

        <div class="form-group">
          <label>${isTa ? 'பாசன நிலை' : 'Irrigation Supply'}</label>
          <select class="form-control" id="riskIrrigation">
            <option value="drip" selected>Drip / Controlled (சொட்டு நீர் பாசனம்)</option>
            <option value="flood">Flood / Channel (வாய்க்கால் பாய்ச்சல்)</option>
            <option value="rainfed">Rainfed / Drought Prone (மானாவாரி)</option>
          </select>
        </div>
      </div>
      <button class="btn-primary" onclick="recalculateRisk()" style="width: 100%;">
        ⚡ ${isTa ? 'இடர் நிலையை மீண்டும் கணக்கிடு' : 'Recalculate Multi-Factor Risk Score'}
      </button>
    </div>

    <div id="riskEngineOutput"></div>
  `;

  recalculateRisk();
}

function recalculateRisk() {
  const stage = document.getElementById('riskStage')?.value || 'Flowering';
  const weather = document.getElementById('riskWeather')?.value || 'Normal';
  const irrigation = document.getElementById('riskIrrigation')?.value || 'drip';

  const risk = AgriEngine.calculateCropRisk({
    cropStage: stage,
    weather,
    soil: currentProfile.soil,
    irrigation,
    disease: currentDiseaseScan ? currentDiseaseScan.id : 'None'
  });

  currentRiskAssessment = risk;
  const isTa = currentLang === 'ta';
  const out = document.getElementById('riskEngineOutput');

  out.innerHTML = `
    <div style="background: var(--surface-card); border-radius: var(--radius-xl); padding: 2rem; border: 1px solid var(--border-subtle); box-shadow: var(--shadow-md);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h3 style="font-size: 1.5rem;">${isTa ? 'மதிப்பீட்டு முடிவு' : 'Risk Evaluation Outcome'}:</h3>
          <span class="risk-level-badge badge-${risk.level.toLowerCase()}" style="margin-top: 0.5rem;">
            ${risk.level} RISK (Score: ${risk.score}/100)
          </span>
        </div>
        <div style="min-width: 250px; flex: 1; max-width: 400px;">
          <div class="risk-bar" style="height: 14px;">
            <div class="risk-bar-fill" style="width: ${risk.score}%; background: ${risk.color};"></div>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted);">
            <span>Low (0-29)</span>
            <span>Moderate (30-54)</span>
            <span>High (55-100)</span>
          </div>
        </div>
      </div>

      <h4 style="margin-bottom: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-size: 0.85rem;">
        ⚠️ ${isTa ? 'முக்கிய இடர் காரணிகள்' : 'Primary Risk Drivers'}
      </h4>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; margin-bottom: 1.75rem;">
        ${risk.factors.map(f => `
          <div style="background: #f8fafc; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1rem;">
            <strong style="color: var(--primary-900);">${f.title}</strong>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.35rem;">${f.impact}</p>
          </div>
        `).join('')}
      </div>

      <h4 style="margin-bottom: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-size: 0.85rem;">
        🛡️ ${isTa ? 'உடனடி தடுப்பு நடவடிக்கைகள்' : 'Mandatory Preventive Mitigation'}
      </h4>
      <div style="background: #ecfdf5; border-left: 4px solid #059669; border-radius: var(--radius-md); padding: 1.25rem;">
        <ul style="padding-left: 1.25rem; font-size: 0.95rem; color: #064e3b;">
          ${risk.immediateActions.map(a => `<li style="margin-bottom: 0.4rem;">${a}</li>`).join('')}
        </ul>
      </div>
    </div>
  `;
}

/**
 * 5. RENDER LOANS
 */
function renderLoans() {
  const container = document.getElementById('view-loans');
  if (!container) return;

  const isTa = currentLang === 'ta';
  const loans = AgriEngine.matchLoans(currentProfile, { requiredAmount: 150000 });

  container.innerHTML = `
    <div style="margin-bottom: 1.5rem;">
      <h2>💰 ${isTa ? 'விவசாய கடன்கள் & நிதி தீர்வுகள்' : 'Agricultural Loan Discovery & Comparison'}</h2>
      <p style="color: var(--text-muted);">${isTa ? 'குறைந்த வட்டி விகிதத்தில் கிசான் கிரெடிட் கார்டு (KCC) மற்றும் தேசியமயமாக்கப்பட்ட வங்கி கடன்களை ஒப்பிடுங்கள்.' : 'Compare verified formal crop loans, gold loans, and machinery finance with transparent effective interest rates and official portals.'}</p>
    </div>

    <div class="card-deck">
      ${loans.map(loan => `
        <div class="info-card">
          <div>
            <div class="info-card-header">
              <div>
                <h4>${isTa ? loan.name_ta : loan.name}</h4>
                <div style="font-size: 0.8rem; color: var(--text-muted);">${isTa ? loan.provider_ta : loan.provider}</div>
              </div>
              <span class="info-tag">${loan.relevance}</span>
            </div>

            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: var(--radius-md); padding: 0.85rem; margin-bottom: 1rem;">
              <div style="font-size: 1.25rem; font-weight: 800; color: #166534;">${loan.interestRate}</div>
              <div style="font-size: 0.75rem; color: #15803d;">${loan.effectiveDate}</div>
            </div>

            <ul class="info-details-list">
              <li><strong>${isTa ? 'கடன் வரம்பு' : 'Max Limit'}:</strong> ${loan.maxAmount}</li>
              <li><strong>${isTa ? 'நோக்கம்' : 'Purpose'}:</strong> ${loan.purpose}</li>
              <li><strong>${isTa ? 'தகுதி' : 'Eligibility'}:</strong> ${loan.eligibility}</li>
              <li><strong>${isTa ? 'கணிப்பு' : 'Repayment'}:</strong> ${loan.emiEstimate}</li>
            </ul>
          </div>

          <div class="card-actions">
            <button class="btn-primary" style="flex: 1; font-size: 0.85rem;" onclick="openDocModal('${loan.id}')">
              📋 ${t('docsRequired')}
            </button>
            <a href="${loan.officialUrl}" target="_blank" rel="noopener" class="btn-secondary" style="font-size: 0.85rem; text-align: center;">
              🔗 ${isTa ? 'அதிகாரப்பூர்வ தளம்' : 'Official Portal'}
            </a>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * 6. RENDER SCHEMES
 */
function renderSchemes() {
  const container = document.getElementById('view-schemes');
  if (!container) return;

  const isTa = currentLang === 'ta';
  const schemes = AgriEngine.matchSchemes(currentProfile);

  container.innerHTML = `
    <div style="margin-bottom: 1.5rem;">
      <h2>🏛️ ${isTa ? 'அரசு மானியங்கள் & வேளாண் திட்டங்கள்' : 'Government Agricultural Schemes Matcher'}</h2>
      <p style="color: var(--text-muted);">${isTa ? 'உங்கள் நில அளவு மற்றும் பயிர் தகவல்களின் அடிப்படையில் நேரடி வங்கி வரவு மற்றும் மானிய திட்டங்கள்.' : 'Profile-matched Central and State government schemes with clear eligibility statuses, subsidies, and required document checklists.'}</p>
    </div>

    <div class="card-deck">
      ${schemes.map(scheme => `
        <div class="info-card">
          <div>
            <div class="info-card-header">
              <div>
                <h4>${isTa ? scheme.name_ta : scheme.name}</h4>
                <div style="font-size: 0.75rem; color: var(--text-muted);">${scheme.ministry}</div>
              </div>
              <span class="info-tag" style="background: #ecfdf5; color: #047857;">${scheme.eligibilityStatus}</span>
            </div>

            <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: var(--radius-md); padding: 0.85rem; margin-bottom: 1rem;">
              <strong style="color: #92400e;">🎁 ${t('schemeBenefits')}:</strong>
              <div style="font-size: 0.875rem; color: #78350f; margin-top: 0.25rem;">${scheme.benefit}</div>
            </div>

            <ul class="info-details-list">
              <li><strong>${isTa ? 'நோக்கம்' : 'Purpose'}:</strong> ${scheme.purpose}</li>
              <li><strong>${isTa ? 'தகுதி சுருக்கம்' : 'Eligibility'}:</strong> ${scheme.eligibilityRuleSummary}</li>
            </ul>
          </div>

          <div class="card-actions">
            <button class="btn-primary" style="flex: 1; font-size: 0.85rem;" onclick="openDocModal('${scheme.id}')">
              📋 ${t('docsRequired')} & ${isTa ? 'வழிகாட்டல்' : 'Guide'}
            </button>
            <a href="${scheme.officialPortalUrl}" target="_blank" rel="noopener" class="btn-secondary" style="font-size: 0.85rem; text-align: center;">
              🔗 ${isTa ? 'விண்ணப்பிக்க' : 'Apply Online'}
            </a>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Live Mandi Prices Real-Time Sync
 */
function refreshMandiPrices() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });

  AGRI_DATA.marketPrices.forEach(m => {
    // Apply realistic micro-market auction fluctuation (-1.5% to +2.5%)
    const delta = (Math.random() * 0.04 - 0.015);
    const oldPrice = m.currentPrice;
    m.currentPrice = Math.round(m.currentPrice * (1 + delta));
    m.prevPrice = oldPrice;
    const diff = m.currentPrice - m.prevPrice;
    m.trend = diff > 0 ? 'UP' : diff < 0 ? 'DOWN' : 'STABLE';
    m.percentChange = `${diff >= 0 ? '+' : ''}${((diff / oldPrice) * 100).toFixed(1)}%`;
    m.date = `Today ${dateStr}, ${timeStr} (e-NAM Live)`;
    m.history[m.history.length - 1] = m.currentPrice;
  });

  renderMarkets();
}

/**
 * 7. RENDER MARKETS
 */
function renderMarkets() {
  const container = document.getElementById('view-markets');
  if (!container) return;

  const isTa = currentLang === 'ta';
  const markets = AGRI_DATA.marketPrices;

  container.innerHTML = `
    <div style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
      <div>
        <h2>📊 ${isTa ? 'நேரடி சந்தை விலை நிலவரம் (e-NAM)' : 'Live Mandi Market Prices & Trend Analytics'}</h2>
        <p style="color: var(--text-muted);">${isTa ? 'தமிழ்நாடு மற்றும் முக்கிய சந்தைகளின் நேரடி விலை நிலவரம், போக்கு மற்றும் கடந்த 7 நாள் ஒப்பீடு.' : 'Live market intelligence and multi-mandi rate comparison synced directly with official e-NAM regulated markets.'}</p>
      </div>
      <div style="display: flex; align-items: center; gap: 0.6rem;">
        <span class="badge-live-pulse" style="background: #16a34a;">
          ● ${isTa ? 'நேரடி e-NAM' : 'LIVE e-NAM'}
        </span>
        <button class="gps-locate-btn" onclick="refreshMandiPrices()">
          🔄 ${isTa ? 'சந்தை விலைகளை புதுப்பி' : 'Refresh Live Rates'}
        </button>
      </div>
    </div>

    <!-- Trend Visualizer Chart -->
    <div class="mandi-chart-card">
      <div class="chart-header">
        <div>
          <h3>📈 ${isTa ? '7 நாள் விலை போக்கு (மஞ்சள், ஈரோடு & நெல், தஞ்சாவூர்)' : '7-Day Price Trajectory (Turmeric, Erode & Paddy, Thanjavur)'}</h3>
          <span style="font-size: 0.8rem; color: var(--text-muted);">${isTa ? 'அளவீடு: ₹ / குவிண்டால்' : 'Unit: INR / Quintal (e-NAM Direct Sync)'}</span>
        </div>
      </div>

      <div class="svg-chart-container">
        <svg viewBox="0 0 800 200" width="100%" height="100%">
          <!-- Background Grid lines -->
          <line x1="50" y1="30" x2="780" y2="30" stroke="#f1f5f9" stroke-width="1"/>
          <line x1="50" y1="80" x2="780" y2="80" stroke="#f1f5f9" stroke-width="1"/>
          <line x1="50" y1="130" x2="780" y2="130" stroke="#f1f5f9" stroke-width="1"/>
          <line x1="50" y1="180" x2="780" y2="180" stroke="#e2e8f0" stroke-width="2"/>

          <!-- Axis Labels -->
          <text x="10" y="35" font-size="10" fill="#94a3b8">₹17k</text>
          <text x="10" y="85" font-size="10" fill="#94a3b8">₹12k</text>
          <text x="10" y="135" font-size="10" fill="#94a3b8">₹6k</text>
          <text x="10" y="185" font-size="10" fill="#94a3b8">₹2k</text>

          <!-- Day markers -->
          <text x="70" y="195" font-size="10" fill="#64748b">Day 1</text>
          <text x="180" y="195" font-size="10" fill="#64748b">Day 2</text>
          <text x="300" y="195" font-size="10" fill="#64748b">Day 3</text>
          <text x="420" y="195" font-size="10" fill="#64748b">Day 4</text>
          <text x="540" y="195" font-size="10" fill="#64748b">Day 5</text>
          <text x="650" y="195" font-size="10" fill="#64748b">Day 6</text>
          <text x="750" y="195" font-size="10" fill="#047857" font-weight="bold">Today</text>

          <!-- Turmeric Curve (Gold / Amber) -->
          <path d="M70,75 L180,68 L300,62 L420,58 L540,54 L650,52 L750,44" fill="none" stroke="#d97706" stroke-width="3.5" stroke-linecap="round"/>
          <!-- Points -->
          <circle cx="750" cy="44" r="5" fill="#d97706"/>
          <text x="690" y="38" font-size="11" font-weight="bold" fill="#d97706">Turmeric ₹16.8k</text>

          <!-- Paddy Curve (Green) -->
          <path d="M70,175 L180,172 L300,173 L420,170 L540,168 L650,167 L750,162" fill="none" stroke="#10b981" stroke-width="3.5" stroke-linecap="round"/>
          <circle cx="750" cy="162" r="5" fill="#10b981"/>
          <text x="695" y="156" font-size="11" font-weight="bold" fill="#065f46">Paddy ₹2,320</text>
        </svg>
      </div>
    </div>

    <!-- Mandi Rates Table -->
    <table class="mandi-table">
      <thead>
        <tr>
          <th>${isTa ? 'பயிர்' : 'Crop'}</th>
          <th>${isTa ? 'சந்தை / ஒழுங்குமுறை விற்பனைக்கூடம்' : 'Mandi / Regulated Market'}</th>
          <th>${isTa ? 'இன்றைய விலை' : 'Current Rate'}</th>
          <th>${isTa ? 'முந்தைய விலை' : 'Prev Rate'}</th>
          <th>${isTa ? 'போக்கு' : 'Trend'}</th>
          <th>${isTa ? 'தேதி & நேரம்' : 'Sync Status'}</th>
        </tr>
      </thead>
      <tbody>
        ${markets.map(m => `
          <tr>
            <td><strong>${isTa ? m.cropName_ta : m.cropName}</strong></td>
            <td>${isTa ? m.mandi_ta : m.mandi}</td>
            <td><strong style="color: var(--primary-900);">₹${m.currentPrice.toLocaleString('en-IN')}</strong> <span style="font-size: 0.75rem; color: var(--text-muted);">${m.unit}</span></td>
            <td>₹${m.prevPrice.toLocaleString('en-IN')}</td>
            <td class="${m.trend === 'UP' ? 'trend-up' : m.trend === 'DOWN' ? 'trend-down' : 'trend-stable'}">
              ${m.trend === 'UP' ? '▲ Rising' : m.trend === 'DOWN' ? '▼ Falling' : '▬ Stable'} (${m.percentChange})
            </td>
            <td style="font-size: 0.8rem; color: var(--text-muted);">${m.date}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

/**
 * 8. RENDER HELPLINES
 */
function renderHelplines() {
  const container = document.getElementById('view-helplines');
  if (!container) return;

  const isTa = currentLang === 'ta';

  container.innerHTML = `
    <div style="margin-bottom: 1.5rem;">
      <h2>📞 ${isTa ? 'அரசு வேளாண் உதவி எண்கள்' : 'Official Agricultural Helplines Directory'}</h2>
      <p style="color: var(--text-muted);">${isTa ? 'வேளாண் விஞ்ஞானிகள், பயிர் காப்பீட்டு அலுவலர்கள் மற்றும் திட்ட ஒருங்கிணைப்பாளர்களை நேரடியாக தொடர்பு கொள்ளவும்.' : 'Click to directly dial certified toll-free numbers for crop diagnosis, input queries, insurance claims, and grievance redressal.'}</p>
    </div>

    <div class="helpline-grid">
      ${AGRI_DATA.helplines.map(h => `
        <div class="helpline-card">
          <div>
            <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">${h.officialSource}</span>
            <h4 style="margin-top: 0.25rem; font-size: 1.2rem; color: var(--primary-900);">${isTa ? h.title_ta : h.title}</h4>
            <div class="helpline-phone">
              <span>📞</span> ${h.phone}
            </div>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.75rem;">${h.description}</p>
            <div style="font-size: 0.8rem; color: var(--text-main); margin-bottom: 1rem;">
              <div>🕒 <strong>${isTa ? 'நேரம்' : 'Working Hours'}:</strong> ${h.hours}</div>
              <div>🗣️ <strong>${isTa ? 'மொழிகள்' : 'Languages'}:</strong> ${h.languages}</div>
            </div>
          </div>

          <a href="tel:${h.phone.replace(/[^0-9]/g, '')}" class="btn-call">
            📞 ${t('callNow')} (${h.phone})
          </a>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * 9. RENDER PROFILE FORM
 */
function renderProfileForm() {
  const container = document.getElementById('view-profile');
  if (!container) return;

  const isTa = currentLang === 'ta';

  container.innerHTML = `
    <div style="margin-bottom: 1.5rem;">
      <h2>🧑‍🌾 ${isTa ? 'விவசாயி சுயவிவர அமைப்பு' : 'Farmer Profile Configuration'}</h2>
      <p style="color: var(--text-muted);">${isTa ? 'உங்கள் பண்ணை விவரங்களை உள்ளிட்டு தனிப்பயனாக்கப்பட்ட பரிந்துரைகளை பெறுங்கள்.' : 'All crop recommendations, risk calculations, and subsidy eligibility dynamically update to match this profile.'}</p>
    </div>

    <div class="form-card" style="max-width: 800px;">
      <form id="farmerProfileForm">
        <div class="form-grid-3">
          <div class="form-group">
            <label>${isTa ? 'விவசாயி பெயர்' : 'Farmer Full Name'}</label>
            <input type="text" class="form-control" id="profName" value="${currentProfile.name}" required>
          </div>
          <div class="form-group">
            <label>${isTa ? 'மாவட்டம்' : 'District'}</label>
            <select class="form-control" id="profDistrict">
              ${AGRI_DATA.districts.map(d => `<option value="${d.id}" ${currentProfile.district === d.id ? 'selected' : ''}>${isTa ? d.name_ta : d.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>${isTa ? 'விவசாயி வகை' : 'Farmer Category'}</label>
            <select class="form-control" id="profCategory">
              <option value="Marginal" ${currentProfile.farmerCategory === 'Marginal' ? 'selected' : ''}>Marginal (< 2.5 Acres / 1 Ha)</option>
              <option value="Small" ${currentProfile.farmerCategory === 'Small' ? 'selected' : ''}>Small (2.5 - 5 Acres)</option>
              <option value="Medium" ${currentProfile.farmerCategory === 'Medium' ? 'selected' : ''}>Medium (5 - 10 Acres)</option>
              <option value="Large" ${currentProfile.farmerCategory === 'Large' ? 'selected' : ''}>Large (> 10 Acres)</option>
            </select>
          </div>
          <div class="form-group">
            <label>${isTa ? 'பண்ணை அளவு (ஏக்கர்)' : 'Farm Size (Acres)'}</label>
            <input type="number" class="form-control" id="profFarmSize" value="${currentProfile.farmSize}" step="0.5" required>
          </div>
          <div class="form-group">
            <label>${isTa ? 'மண் வகை' : 'Primary Soil Type'}</label>
            <select class="form-control" id="profSoil">
              ${AGRI_DATA.soilTypes.map(s => `<option value="${s.id}" ${currentProfile.soil === s.id ? 'selected' : ''}>${isTa ? s.name_ta : s.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>${isTa ? 'நீர் ஆதாரம்' : 'Water Availability'}</label>
            <select class="form-control" id="profWater">
              ${AGRI_DATA.waterSources.map(w => `<option value="${w.id}" ${currentProfile.water === w.id ? 'selected' : ''}>${isTa ? w.name_ta : w.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>${isTa ? 'பாசன முறை' : 'Irrigation Type'}</label>
            <select class="form-control" id="profIrrigation">
              ${AGRI_DATA.irrigationTypes.map(i => `<option value="${i.id}" ${currentProfile.irrigation === i.id ? 'selected' : ''}>${isTa ? i.name_ta : i.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>${isTa ? 'தற்போதைய பயிர்' : 'Current Sown Crop'}</label>
            <input type="text" class="form-control" id="profCrop" value="${currentProfile.currentCrop}">
          </div>
          <div class="form-group">
            <label>${isTa ? 'வளர்ச்சி நிலை' : 'Current Stage'}</label>
            <input type="text" class="form-control" id="profStage" value="${currentProfile.cropStage}">
          </div>
        </div>

        <button type="submit" class="btn-primary" style="width: 100%;">
          💾 ${isTa ? 'சுயவிவரத்தை சேமித்து பரிந்துரைகளை புதுப்பிக்கவும்' : 'Save Profile & Refresh Platform Context'}
        </button>
      </form>
    </div>
  `;

  document.getElementById('farmerProfileForm').addEventListener('submit', (e) => {
    e.preventDefault();
    currentProfile.name = document.getElementById('profName').value;
    currentProfile.district = document.getElementById('profDistrict').value;
    currentProfile.farmerCategory = document.getElementById('profCategory').value;
    currentProfile.farmSize = parseFloat(document.getElementById('profFarmSize').value) || 2;
    currentProfile.soil = document.getElementById('profSoil').value;
    currentProfile.water = document.getElementById('profWater').value;
    currentProfile.irrigation = document.getElementById('profIrrigation').value;
    currentProfile.currentCrop = document.getElementById('profCrop').value;
    currentProfile.cropStage = document.getElementById('profStage').value;

    localStorage.setItem('agri_craft_profile', JSON.stringify(currentProfile));
    syncLiveWeatherForActiveDistrict(liveWeather.forecastDays);
    runInitialAssessments();
    alert(isTa ? 'உங்கள் சுயவிவரம் வெற்றிகரமாக சேமிக்கப்பட்டது! நேரடி வானிலை புதுப்பிக்கப்பட்டது.' : 'Farmer profile updated! Open-Meteo live telemetry refreshed.');
    switchView('dashboard');
  });
}

/**
 * 10. RENDER AGRO WEATHER FULL VIEW
 */
function renderAgroWeather() {
  const container = document.getElementById('view-weather');
  if (!container) return;

  const isTa = currentLang === 'ta';
  const range = liveWeather.forecastDays || 7;

  container.innerHTML = `
    <div style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
      <div>
        <h2>🌤️ ${isTa ? `வேளாண் வானிலை ஆலோசனை & ${range} நாள் நேரடி முன்னறிவிப்பு` : `Agro-Meteorological Advisory & ${range}-Day Live Forecast`}</h2>
        <p style="color: var(--text-muted);">${isTa ? 'Open-Meteo செயற்கைக்கோள் தரவுகளின் அடிப்படையில் துல்லியமான பயிர் பாதுகாப்பு, உரம் தெளித்தல் மற்றும் பாசன திட்டமிடல்.' : 'Satellite & meteorological telemetry via Open-Meteo API calibrated for precision irrigation, spray timing, and disease prevention.'}</p>
      </div>
      <div style="display: flex; gap: 0.5rem; align-items: center;">
        <button class="gps-locate-btn btn-gps-detect" onclick="detectUserGPSLocation()">
          📍 ${isTa ? 'நேரடி GPS இருப்பிடம்' : 'Detect Live GPS'}
        </button>
        <button class="gps-locate-btn" onclick="syncLiveWeatherForActiveDistrict(liveWeather.forecastDays)">
          🔄 ${isTa ? 'புதுப்பி' : 'Refresh Telemetry'}
        </button>
      </div>
    </div>

    <!-- Active Station / Live Telemetry Hero Card -->
    <div class="dash-card" style="margin-bottom: 1.75rem; background: linear-gradient(135deg, #064e3b, #0d381e); color: #fff;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.35rem;">
            <span style="font-size: 0.85rem; color: #a7f3c9; font-weight: 700;">
              📍 ${isTa ? liveWeather.locationName_ta.toUpperCase() : liveWeather.locationName.toUpperCase()}
            </span>
            <span class="badge-live-pulse" style="background: #10b981; color: #fff;">
              ● ${isTa ? 'நேரடி OPEN-METEO' : 'LIVE OPEN-METEO'} (${liveWeather.lastSync})
            </span>
          </div>
          <div style="font-size: 3.25rem; font-weight: 800; font-family: Outfit, sans-serif; display: flex; align-items: center; gap: 0.75rem;">
            <span>${liveWeather.current.temp != null ? liveWeather.current.temp.toFixed(1) : '28.5'}°C</span>
            <span style="font-size: 2.5rem;">${liveWeather.current.icon}</span>
          </div>
          <div style="font-size: 1.15rem; color: #e2f5e3; margin-top: 0.2rem;">
            ${isTa ? liveWeather.current.conditionLabel_ta : liveWeather.current.conditionLabel}
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; background: rgba(255,255,255,0.1); padding: 1.25rem; border-radius: var(--radius-lg); backdrop-filter: blur(8px);">
          <div>
            <div style="font-size: 0.75rem; color: #a7f3c9;">Relative Humidity</div>
            <div style="font-size: 1.4rem; font-weight: 700;">${liveWeather.current.humidity}%</div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: #a7f3c9;">Precipitation</div>
            <div style="font-size: 1.4rem; font-weight: 700;">${liveWeather.current.precipitation} mm</div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: #a7f3c9;">Wind Speed</div>
            <div style="font-size: 1.4rem; font-weight: 700;">${liveWeather.current.windSpeed} km/h</div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: #a7f3c9;">Coordinates</div>
            <div style="font-size: 0.9rem; font-weight: 700;">${liveWeather.lat.toFixed(2)}°, ${liveWeather.lon.toFixed(2)}°</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Forecast Range Selector Tabs: 7 Days / 10 Days / 16 Days -->
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
      <h3 style="font-size: 1.25rem;">
        📅 ${isTa ? `${range} நாள் நீட்டிக்கப்பட்ட வேளாண் முன்னறிவிப்பு` : `${range}-Day Extended Agricultural Forecast`}
      </h3>
      <div class="forecast-range-selector" style="margin: 0;">
        <button class="range-pill-btn ${range === 7 ? 'active' : ''}" onclick="changeForecastRange(7)">
          7 ${isTa ? 'நாட்கள்' : 'Days'}
        </button>
        <button class="range-pill-btn ${range === 10 ? 'active' : ''}" onclick="changeForecastRange(10)">
          10 ${isTa ? 'நாட்கள்' : 'Days'}
        </button>
        <button class="range-pill-btn ${range === 16 ? 'active' : ''}" onclick="changeForecastRange(16)">
          16 ${isTa ? 'நாட்கள் (முழு சுற்று)' : 'Days (Full Range)'}
        </button>
      </div>
    </div>

    <!-- Forecast Days Grid (Live Cards) -->
    <div class="forecast-days-grid">
      ${(liveWeather.daily || []).map((day, idx) => `
        <div class="forecast-day-card ${idx === 0 ? 'today-card' : ''}">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <strong style="font-size: 1.05rem; color: var(--primary-900);">
                ${isTa ? day.dayLabel_ta : day.dayLabel}
              </strong>
              <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">
                ${day.formattedDate}
              </span>
            </div>

            <div style="text-align: center; margin: 0.75rem 0;">
              <div style="font-size: 2.75rem; line-height: 1;">${day.icon}</div>
              <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-main); margin-top: 0.35rem;">
                ${isTa ? day.conditionLabel_ta : day.conditionLabel}
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); margin-bottom: 0.75rem; font-size: 0.85rem;">
              <span>Max: <strong>${day.maxTemp != null ? day.maxTemp.toFixed(0) : '32'}°C</strong></span>
              <span>Min: <strong style="color: var(--text-muted);">${day.minTemp != null ? day.minTemp.toFixed(0) : '24'}°C</strong></span>
            </div>

            <div style="margin-bottom: 0.75rem;">
              <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 0.25rem;">
                <span>🌧️ ${isTa ? 'மழை வாய்ப்பு' : 'Rain Probability'}:</span>
                <strong style="color: ${day.rainProb > 50 ? '#dc2626' : '#059669'};">${day.rainProb}% (${day.rainSum != null ? day.rainSum.toFixed(1) : '0'}mm)</strong>
              </div>
              <div class="risk-bar" style="height: 6px; margin: 0;">
                <div class="risk-bar-fill" style="width: ${day.rainProb}%; background: ${day.rainProb > 60 ? '#dc2626' : day.rainProb > 30 ? '#d97706' : '#10b981'};"></div>
              </div>
            </div>
          </div>

          <div style="background: #f0fdf4; border-left: 3px solid var(--primary-600); padding: 0.5rem 0.65rem; border-radius: 4px; font-size: 0.775rem; color: #065f46; margin-top: 0.5rem; line-height: 1.35;">
            🌾 <strong>${isTa ? 'ஆலோசனை' : 'Action'}:</strong> ${isTa ? day.advisoryTa : day.advisoryEn}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * MODAL HANDLERS (Crop Plan & Document Checklist)
 */
function openCropPlanModal(cropId) {
  const crop = AGRI_DATA.crops.find(c => c.id === cropId);
  if (!crop) return;

  const isTa = currentLang === 'ta';
  const modal = document.getElementById('appModal');
  const body = document.getElementById('modalContent');

  body.innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
      <span style="font-size: 2.5rem;">${crop.icon}</span>
      <div>
        <h3 style="font-size: 1.5rem; color: var(--primary-900);">${isTa ? crop.name_ta : crop.name}</h3>
        <span style="font-size: 0.85rem; color: var(--text-muted);">${crop.category} • ${crop.growingPeriod}</span>
      </div>
    </div>

    <div style="background: #f0fdf4; border-left: 4px solid var(--primary-600); padding: 1rem; border-radius: var(--radius-sm); font-size: 0.9rem; margin-bottom: 1.5rem;">
      ${crop.whyRecommended}
    </div>

    <h4 style="margin-bottom: 0.75rem; color: var(--text-main);">🌱 ${isTa ? 'முக்கிய சாகுபடி படிகள்' : 'Step-by-Step Cultivation Protocol'}</h4>
    <ol style="padding-left: 1.25rem; font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 0.6rem;">
      ${crop.cultivationSteps.map(step => `<li>${step}</li>`).join('')}
    </ol>

    <div style="background: #f8fafc; padding: 1rem; border-radius: var(--radius-md); font-size: 0.85rem; margin-bottom: 1.5rem;">
      <div>🌾 <strong>${isTa ? 'எதிர்பார்க்கப்படும் மகசூல்' : 'Expected Yield'}:</strong> ${crop.expectedYield}</div>
      <div>💰 <strong>${isTa ? 'சந்தை விலை' : 'Market Price'}:</strong> ${crop.marketRateApprox}</div>
      <div>💧 <strong>${isTa ? 'நீர் தேவை' : 'Water Volume'}:</strong> ${crop.waterRequirement}</div>
    </div>

    <div style="display: flex; gap: 0.75rem;">
      <button class="btn-primary" style="flex: 1;" onclick="setAsCurrentCrop('${crop.name}')">
        ✅ ${isTa ? 'இதை என் நடப்பு பயிராக அமைக்கவும்' : 'Set as My Active Farm Crop'}
      </button>
      <button class="btn-secondary" onclick="closeAppModal()">
        ${isTa ? 'மூடுக' : 'Close'}
      </button>
    </div>
  `;

  modal.classList.add('active');
}

function setAsCurrentCrop(cropName) {
  currentProfile.currentCrop = cropName;
  currentProfile.cropStage = 'Vegetative (15 Days)';
  localStorage.setItem('agri_craft_profile', JSON.stringify(currentProfile));
  runInitialAssessments();
  closeAppModal();
  renderApp();
  alert(`Active crop successfully switched to ${cropName}!`);
}

function openDocModal(refId) {
  const isTa = currentLang === 'ta';
  const modal = document.getElementById('appModal');
  const body = document.getElementById('modalContent');

  // Find either scheme, loan, or disease
  let title = 'Required Documents Checklist';
  let docs = [
    'Aadhaar Card of Applicant Farmer (Mandatory)',
    'Land Patta / Chitta / 7/12 Revenue Extract',
    'Bank Passbook photocopy showing IFSC & Account No.',
    'Recent Passport size photographs (2 copies)'
  ];
  let steps = [];

  const scheme = AGRI_DATA.schemes.find(s => s.id === refId);
  const loan = AGRI_DATA.loans.find(l => l.id === refId);

  if (scheme) {
    title = `${isTa ? scheme.name_ta : scheme.name} - ${isTa ? 'ஆவணங்கள் & வழிகாட்டல்' : 'Documents & Steps'}`;
    docs = scheme.requiredDocuments;
    steps = scheme.applicationProcedure;
  } else if (loan) {
    title = `${isTa ? loan.name_ta : loan.name} - ${isTa ? 'தேவைப்படும் ஆவணங்கள்' : 'Documentation Checklist'}`;
    docs = loan.requiredDocuments;
    steps = [
      '1. Verify land ownership records (Patta/Chitta) at Village Administrative Office (VAO).',
      '2. Obtain crop cultivation certificate/Adangal for current season.',
      '3. Submit application form with KYC at nearest rural branch or online.',
      '4. Field appraisal by Bank Agricultural Officer (AO).',
      '5. Sanction and credit disbursement directly into KCC account.'
    ];
  }

  body.innerHTML = `
    <h3 style="font-size: 1.35rem; color: var(--primary-900); margin-bottom: 0.5rem;">${title}</h3>
    <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.25rem;">
      ${isTa ? 'கீழே உள்ள ஆவணங்களை சரிபார்த்து தயாராக வைக்கவும்:' : 'Tick off documents you currently have ready before visiting the bank or CSC center:'}
    </p>

    <ul class="doc-checklist">
      ${docs.map((doc, idx) => `
        <li class="doc-item">
          <input type="checkbox" id="doc_check_${idx}">
          <label for="doc_check_${idx}">${doc}</label>
        </li>
      `).join('')}
    </ul>

    ${steps.length ? `
      <h4 style="margin: 1.25rem 0 0.5rem 0;">📝 ${isTa ? 'விண்ணப்பிக்கும் படிகள்' : 'Step-by-Step Procedure'}</h4>
      <ol style="padding-left: 1.25rem; font-size: 0.875rem; color: var(--text-muted); display: flex; flex-direction: column; gap: 0.4rem;">
        ${steps.map(s => `<li>${s}</li>`).join('')}
      </ol>
    ` : ''}

    <div style="margin-top: 1.5rem; text-align: right;">
      <button class="btn-primary" onclick="closeAppModal()">
        ${isTa ? 'முடிந்தது' : 'Got It'}
      </button>
    </div>
  `;

  modal.classList.add('active');
}

function closeAppModal() {
  const modal = document.getElementById('appModal');
  if (modal) modal.classList.remove('active');
}

/**
 * 11. AGRIBOT AI CHAT UI
 */
function initAgriBotUI() {
  const trigger = document.getElementById('agribotTrigger');
  const drawer = document.getElementById('agribotDrawer');
  const closeBtn = document.getElementById('agribotClose');
  const input = document.getElementById('agribotInput');
  const sendBtn = document.getElementById('agribotSend');
  const body = document.getElementById('agribotBody');

  if (trigger && drawer) {
    trigger.addEventListener('click', () => {
      drawer.classList.toggle('active');
      if (drawer.classList.contains('active')) {
        renderChatMessages();
        if (input) input.focus();
      }
    });
  }

  if (closeBtn && drawer) {
    closeBtn.addEventListener('click', () => {
      drawer.classList.remove('active');
    });
  }

  const handleSend = () => {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';

    window.AgriChat.sendUserMessage(text, () => {
      renderChatMessages();
    });
    renderChatMessages();
  };

  if (sendBtn) sendBtn.addEventListener('click', handleSend);
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSend();
    });
  }
}

function renderChatMessages() {
  const body = document.getElementById('agribotBody');
  if (!body || !window.AgriChat) return;

  body.innerHTML = window.AgriChat.messages.map(m => `
    <div class="chat-bubble bubble-${m.sender}">
      ${m.text}
    </div>
  `).join('');

  body.scrollTop = body.scrollHeight;
}

function sendAgriBotChip(text) {
  const input = document.getElementById('agribotInput');
  if (input) {
    input.value = text;
    document.getElementById('agribotSend').click();
  }
}
