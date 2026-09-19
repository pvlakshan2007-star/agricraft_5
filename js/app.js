/**
 * AGRI CRAFT-AI - Main Application Controller
 * Handles routing, bilingual localization (English / Tamil), dynamic views,
 * user interactions, modals, and AI engine binding.
 */

// Default Farmer Profile State
let currentProfile = {
  id: 1,
  name: 'Murugan K',
  phone: '9876543210',
  email: 'murugan.k@agricraft.demo',
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
      <p style="color: var(--text-muted);">${isTa ? 'பயிர் வளர்ச்சி நிலை, வானிலை முன்னறிவிப்பு, பாசன விநியோகம் மற்றும் மண் / வயல் நிலை — இந்த நான்கு காரணிகளை ஒருங்கிணைத்து இடர் நிலையை கணக்கிடுகிறது.' : 'Synthesizes 4 key agricultural factors into a predictive Risk Score (0–100): Crop Growth Stage (20%) · Weather Forecast (30%) · Irrigation Supply (25%) · Soil &amp; Field Condition (25%).'}</p>
    </div>

    <div class="form-card">
      <div class="form-grid-2">
        <div class="form-group">
          <label>🌱 ${isTa ? 'பயிர் வளர்ச்சி நிலை' : 'Crop Growth Stage'} <span style="font-size:0.78rem;color:var(--text-muted);">(20%)</span></label>
          <select class="form-control" id="riskStage">
            <option value="Vegetative">Vegetative (இலை வளர்ச்சி நிலை)</option>
            <option value="Flowering" selected>Flowering (பூக்கும் நிலை - உணர்திறன் மிக்கது)</option>
            <option value="Panicle / Pegging">Panicle / Pegging (கதிர் / காய் திரட்சி)</option>
            <option value="Maturity / Pre-Harvest">Maturity / Pre-Harvest (அறுவடைக்கு முந்தைய நிலை)</option>
          </select>
        </div>

        <div class="form-group">
          <label>🌦️ ${isTa ? 'வானிலை முன்னறிவிப்பு' : 'Weather Condition Forecast'} <span style="font-size:0.78rem;color:var(--text-muted);">(30%)</span></label>
          <select class="form-control" id="riskWeather">
            <option value="Normal" selected>Normal / Favorable (வழக்கமான சீதோஷ்ணம்)</option>
            <option value="Heavy Rain">Heavy Rain / Cyclone Warning (கனமழை எச்சரிக்கை)</option>
            <option value="Heatwave">Heatwave / High Dry Spell (கடும் வெப்ப அலை)</option>
          </select>
        </div>

        <div class="form-group">
          <label>💧 ${isTa ? 'பாசன விநியோகம்' : 'Irrigation Supply'} <span style="font-size:0.78rem;color:var(--text-muted);">(25%)</span></label>
          <select class="form-control" id="riskIrrigation">
            <option value="drip" selected>Drip / Controlled (சொட்டு நீர் பாசனம்)</option>
            <option value="flood">Flood / Channel (வாய்க்கால் பாய்ச்சல்)</option>
            <option value="rainfed">Rainfed / Drought Prone (மானாவாரி)</option>
          </select>
        </div>

        <div class="form-group">
          <label>🌍 ${isTa ? 'மண் / வயல் நிலை' : 'Soil &amp; Field Condition'} <span style="font-size:0.78rem;color:var(--text-muted);">(25%)</span></label>
          <select class="form-control" id="riskSoilField">
            <option value="Good" selected>Good / Optimal (சரியான மண் நிலை)</option>
            <option value="Nutrient Deficient">Nutrient Deficient (ஊட்டச்சத்து குறைவு)</option>
            <option value="Compacted / Cracked">Compacted / Cracked (அடர்த்தியான / வெடிப்பு மண்)</option>
            <option value="Waterlogged">Waterlogged (நீர் தேக்கம்)</option>
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
  const stage     = document.getElementById('riskStage')?.value     || 'Flowering';
  const weather   = document.getElementById('riskWeather')?.value   || 'Normal';
  const irrigation = document.getElementById('riskIrrigation')?.value || 'drip';
  const soilField = document.getElementById('riskSoilField')?.value  || 'Good';

  const risk = AgriEngine.calculateCropRisk({
    cropStage: stage,
    weather,
    irrigation,
    soilField
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
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">
              <strong style="color: var(--primary-900);">${f.title}</strong>
              ${f.weight ? `<span style="font-size:0.75rem;font-weight:700;color:var(--text-muted);background:#e2e8f0;border-radius:4px;padding:2px 7px;">${f.weight}</span>` : ''}
            </div>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">${f.impact}</p>
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

// Loan Matching System State
let loanProfileState = {
  cibilScore: 720,
  creditStatus: 'good',
  existingLoansCount: 0,
  outstandingAmount: 0,
  monthlyObligations: 1000,
  repaymentStatus: 'always_on_time',
  agriIncome: 280000,
  otherIncomeMonthly: 5000,
  requestedAmount: 150000,
  loanPurpose: 'crop_cultivation',
  landTenure: 'owner',
  landArea: 2.5,
  crop: 'Paddy',
  croppingPattern: 'double',
  irrigation: 'canal',
  state: 'Tamil Nadu',
  district: 'thanjavur',
  farmerCategory: 'Small'
};
let activeLoanMatchResult = null;
let isWhyScoreOpen = false;
let activeSampleCaseKey = '';

/**
 * 5. RENDER LOANS (Transparent Farmer Loan Matching System)
 */
function renderLoans() {
  const container = document.getElementById('view-loans');
  if (!container) return;

  const isTa = currentLang === 'ta';
  const service = window.LoanRecommendationService;

  if (!service) {
    container.innerHTML = `<div style="padding: 2rem; text-align: center;">Loan matching service loading...</div>`;
    return;
  }

  // Calculate default match if not yet computed
  if (!activeLoanMatchResult) {
    activeLoanMatchResult = service.calculateLoanMatchScore(loanProfileState);
  }

  const sampleProfiles = service.getSampleProfiles();
  const matchResult = activeLoanMatchResult;
  const recommendations = matchResult.isValid 
    ? service.getLoanRecommendations(loanProfileState, matchResult)
    : [];

  container.innerHTML = `
    <div class="loan-system-wrapper">
      <!-- Section Header -->
      <div>
        <h2>💰 ${isTa ? 'வேளாண் கடன் உதவி & பொருத்தம் கணிப்பான்' : 'FARMER LOAN ASSISTANT & MATCHING SYSTEM'}</h2>
        <p style="color: var(--text-muted); font-size: 0.95rem; margin-top: 0.25rem;">
          ${isTa 
            ? 'உங்கள் தகுதிக்கு ஏற்ப வெளிப்படையான கடன் பொருத்த மதிப்பெண் (0-100) மற்றும் அரசு திட்டங்களை கண்டறியுங்கள்.' 
            : 'Transparent weighted matching model (0–100) connecting farmers to verified formal agricultural credit without automated loan guarantees.'}
        </p>
      </div>

      <!-- Quick Test Scenario Presets -->
      <div class="loan-presets-bar">
        <div style="font-size: 0.85rem; font-weight: 700; color: var(--primary-900); text-transform: uppercase;">
          🧪 ${isTa ? 'மாதிரி சுயவிவரங்கள் (விரைவு சோதனை):' : 'Sample Test Profiles (Instant Verification):'}
        </div>
        <div class="preset-pills-row">
          <button class="sample-preset-btn ${activeSampleCaseKey === 'strong' ? 'active' : ''}" 
                  onclick="applySampleLoanProfile('strong')">
            🌟 1. Strong Credit (Good Income)
          </button>
          <button class="sample-preset-btn ${activeSampleCaseKey === 'average_with_loans' ? 'active' : ''}" 
                  onclick="applySampleLoanProfile('average_with_loans')">
            ⚖️ 2. Average Credit + Loans
          </button>
          <button class="sample-preset-btn ${activeSampleCaseKey === 'limited_credit' ? 'active' : ''}" 
                  onclick="applySampleLoanProfile('limited_credit')">
            🌱 3. Limited Credit History
          </button>
          <button class="sample-preset-btn ${activeSampleCaseKey === 'low_capacity' ? 'active' : ''}" 
                  onclick="applySampleLoanProfile('low_capacity')">
            ⚠️ 4. Low Repayment Capacity
          </button>
          <button class="sample-preset-btn ${activeSampleCaseKey === 'tenant_farmer' ? 'active' : ''}" 
                  onclick="applySampleLoanProfile('tenant_farmer')">
            🌾 6. Tenant Farmer
          </button>
          <button class="sample-preset-btn ${activeSampleCaseKey === 'missing_info' ? 'active' : ''}" 
                  onclick="applySampleLoanProfile('missing_info')">
            ❓ 7. Missing Information
          </button>
        </div>
      </div>

      <!-- Step-by-Step Farmer Loan Profile Form -->
      <div class="loan-form-card">
        <h3 style="font-size: 1.3rem; margin-bottom: 1.5rem; color: var(--primary-900);">
          📝 ${isTa ? 'விவசாயி கடன் சுயவிவர படிவம்' : 'FARMER LOAN PROFILE ASSESSMENT'}
        </h3>

        <form id="loanProfileForm" onsubmit="event.preventDefault(); submitLoanAssistantForm();">
          <!-- Step 1: Credit History (Weight: 30%) -->
          <div class="loan-step-section">
            <div class="step-section-header">
              <span class="step-badge">1</span>
              <div>
                <h3>${isTa ? 'கடன் வரலாறு (Credit History)' : 'Step 1: Credit History'}</h3>
                <span style="font-size: 0.8rem; color: var(--primary-700); font-weight: 700;">★ Weight: 30%</span>
              </div>
            </div>

            <div class="loan-inputs-grid">
              <div class="loan-field">
                <label for="fldCibil">
                  <span>${isTa ? 'சிபில் / கடன் மதிப்பெண்' : 'CIBIL / Credit Score'}</span>
                  <span class="sub-tag">${isTa ? 'சுயமாக பதிவு செய்யும் முறை' : 'Self-reported credit score'}</span>
                </label>
                <input type="number" id="fldCibil" min="300" max="900" 
                       placeholder="e.g. 720 (300-900)" 
                       value="${loanProfileState.cibilScore || ''}" 
                       oninput="loanProfileState.cibilScore = this.value">
                <small style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">
                  ℹ️ ${isTa ? 'அங்கீகரிக்கப்பட்ட ஒருங்கிணைப்பு இல்லாததால் சுய-மதிப்பீடு பயன்படுத்தப்படுகிறது.' : 'Official credit bureau integration pending; prototype uses self-reported score.'}
                </small>
              </div>

              <div class="loan-field">
                <label for="fldCreditStatus">${isTa ? 'கடன் வரலாற்று நிலை' : 'Credit History Status'}</label>
                <select id="fldCreditStatus" onchange="loanProfileState.creditStatus = this.value">
                  <option value="good" ${loanProfileState.creditStatus === 'good' ? 'selected' : ''}>Good (750+ / Clean repayment track record)</option>
                  <option value="fair" ${loanProfileState.creditStatus === 'fair' ? 'selected' : ''}>Fair (650–749 / Minor delays in past)</option>
                  <option value="limited" ${loanProfileState.creditStatus === 'limited' ? 'selected' : ''}>Limited / No prior credit history</option>
                  <option value="poor" ${loanProfileState.creditStatus === 'poor' ? 'selected' : ''}>Poor (&lt;600 / Default history)</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Step 2: Existing Loans (Weight: 25%) -->
          <div class="loan-step-section">
            <div class="step-section-header">
              <span class="step-badge">2</span>
              <div>
                <h3>${isTa ? 'தற்போதைய கடன்கள் & திருப்பி செலுத்தும் முறை' : 'Step 2: Existing Loans & Repayment Status'}</h3>
                <span style="font-size: 0.8rem; color: var(--primary-700); font-weight: 700;">★ Weight: 25%</span>
              </div>
            </div>

            <div class="loan-inputs-grid">
              <div class="loan-field">
                <label for="fldLoanCount">${isTa ? 'தற்போதுள்ள கடன்களின் எண்ணிக்கை' : 'Number of Existing Loans'}</label>
                <input type="number" id="fldLoanCount" min="0" max="10" 
                       value="${loanProfileState.existingLoansCount}" 
                       oninput="loanProfileState.existingLoansCount = Number(this.value)">
              </div>

              <div class="loan-field">
                <label for="fldOutstanding">${isTa ? 'பாக்கி உள்ள தொகை (₹)' : 'Current Outstanding Amount (₹)'}</label>
                <input type="number" id="fldOutstanding" min="0" step="5000" 
                       value="${loanProfileState.outstandingAmount}" 
                       oninput="loanProfileState.outstandingAmount = Number(this.value)">
              </div>

              <div class="loan-field">
                <label for="fldRepaymentStatus">${isTa ? 'திருப்பி செலுத்தும் ஒழுக்கம்' : 'Repayment Status'}</label>
                <select id="fldRepaymentStatus" onchange="loanProfileState.repaymentStatus = this.value">
                  <option value="always_on_time" ${loanProfileState.repaymentStatus === 'always_on_time' ? 'selected' : ''}>Always on time (Never missed EMI / due date)</option>
                  <option value="mostly_on_time" ${loanProfileState.repaymentStatus === 'mostly_on_time' ? 'selected' : ''}>Mostly on time (1-2 minor grace delays)</option>
                  <option value="some_delays" ${loanProfileState.repaymentStatus === 'some_delays' ? 'selected' : ''}>Some delayed payments (Seasonal crop cash gaps)</option>
                  <option value="frequently_delayed" ${loanProfileState.repaymentStatus === 'frequently_delayed' ? 'selected' : ''}>Frequently delayed / Overdue notices</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Step 3: Income & Repayment Capacity (Weight: 20%) -->
          <div class="loan-step-section">
            <div class="step-section-header">
              <span class="step-badge">3</span>
              <div>
                <h3>${isTa ? 'வருமானம் & திருப்பி செலுத்தும் திறன்' : 'Step 3: Income / Repayment Capacity'}</h3>
                <span style="font-size: 0.8rem; color: var(--primary-700); font-weight: 700;">★ Weight: 20%</span>
              </div>
            </div>

            <div class="loan-inputs-grid">
              <div class="loan-field">
                <label for="fldAgriIncome">${isTa ? 'வருடாந்திர விவசாய வருமானம் (₹)' : 'Annual Agricultural Income (₹)'}</label>
                <input type="number" id="fldAgriIncome" min="10000" step="10000" 
                       value="${loanProfileState.agriIncome}" 
                       oninput="loanProfileState.agriIncome = Number(this.value)">
              </div>

              <div class="loan-field">
                <label for="fldOtherIncome">${isTa ? 'மற்ற மாத வருமானம் (₹)' : 'Other Monthly Income (₹)'}</label>
                <input type="number" id="fldOtherIncome" min="0" step="1000" 
                       value="${loanProfileState.otherIncomeMonthly}" 
                       oninput="loanProfileState.otherIncomeMonthly = Number(this.value)">
              </div>

              <div class="loan-field">
                <label for="fldObligations">${isTa ? 'தற்போதைய மாத தவணை / EMI (₹)' : 'Existing Monthly Obligations / EMI (₹)'}</label>
                <input type="number" id="fldObligations" min="0" step="500" 
                       value="${loanProfileState.monthlyObligations}" 
                       oninput="loanProfileState.monthlyObligations = Number(this.value)">
              </div>

              <div class="loan-field">
                <label for="fldReqAmount">${isTa ? 'தேவைப்படும் கடன் தொகை (₹)' : 'Requested Loan Amount (₹)'}</label>
                <input type="number" id="fldReqAmount" min="10000" step="10000" 
                       value="${loanProfileState.requestedAmount}" 
                       oninput="loanProfileState.requestedAmount = Number(this.value)">
              </div>

              <div class="loan-field">
                <label for="fldPurpose">${isTa ? 'கடன் நோக்கம்' : 'Loan Purpose'}</label>
                <select id="fldPurpose" onchange="loanProfileState.loanPurpose = this.value">
                  <option value="crop_cultivation" ${loanProfileState.loanPurpose === 'crop_cultivation' ? 'selected' : ''}>Crop Cultivation / Seasonal Production (KCC)</option>
                  <option value="emergency_inputs" ${loanProfileState.loanPurpose === 'emergency_inputs' ? 'selected' : ''}>Immediate Farm Inputs / Seeds & Fertilizer (Gold Loan)</option>
                  <option value="machinery" ${loanProfileState.loanPurpose === 'machinery' ? 'selected' : ''}>Farm Mechanization / Tractor / Drone Sprayer</option>
                  <option value="dairy_allied" ${loanProfileState.loanPurpose === 'dairy_allied' ? 'selected' : ''}>Dairy / Livestock / Poultry / Micro-enterprise (MUDRA)</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Step 4: Land & Crop Details (Weight: 15%) -->
          <div class="loan-step-section">
            <div class="step-section-header">
              <span class="step-badge">4</span>
              <div>
                <h3>${isTa ? 'நிலம் & பயிர் விவரங்கள்' : 'Step 4: Land & Crop Details'}</h3>
                <span style="font-size: 0.8rem; color: var(--primary-700); font-weight: 700;">★ Weight: 15%</span>
              </div>
            </div>

            <div class="loan-inputs-grid">
              <div class="loan-field">
                <label for="fldTenure">${isTa ? 'நில உரிமை / குத்தகை நிலை' : 'Land Ownership / Tenancy Status'}</label>
                <select id="fldTenure" onchange="loanProfileState.landTenure = this.value">
                  <option value="owner" ${loanProfileState.landTenure === 'owner' ? 'selected' : ''}>Owner (Freehold Patta holder)</option>
                  <option value="joint" ${loanProfileState.landTenure === 'joint' ? 'selected' : ''}>Joint Family Land Holding</option>
                  <option value="tenant" ${loanProfileState.landTenure === 'tenant' ? 'selected' : ''}>Tenant Farmer (Registered Lease Agreement)</option>
                  <option value="sharecropper" ${loanProfileState.landTenure === 'sharecropper' ? 'selected' : ''}>Oral Lessee / Sharecropper</option>
                </select>
              </div>

              <div class="loan-field">
                <label for="fldLandArea">${isTa ? 'நில அளவு (ஏக்கர்)' : 'Cultivable Land Area (Acres)'}</label>
                <input type="number" id="fldLandArea" min="0.1" step="0.5" 
                       value="${loanProfileState.landArea}" 
                       oninput="loanProfileState.landArea = Number(this.value)">
              </div>

              <div class="loan-field">
                <label for="fldCrop">${isTa ? 'முக்கிய பயிர்' : 'Primary Crop'}</label>
                <select id="fldCrop" onchange="loanProfileState.crop = this.value">
                  <option value="Paddy" ${loanProfileState.crop === 'Paddy' ? 'selected' : ''}>Paddy (Rice)</option>
                  <option value="Cotton" ${loanProfileState.crop === 'Cotton' ? 'selected' : ''}>Cotton</option>
                  <option value="Groundnut" ${loanProfileState.crop === 'Groundnut' ? 'selected' : ''}>Groundnut</option>
                  <option value="Tomato" ${loanProfileState.crop === 'Tomato' ? 'selected' : ''}>Tomato</option>
                  <option value="Turmeric" ${loanProfileState.crop === 'Turmeric' ? 'selected' : ''}>Turmeric</option>
                  <option value="Maize" ${loanProfileState.crop === 'Maize' ? 'selected' : ''}>Maize</option>
                </select>
              </div>

              <div class="loan-field">
                <label for="fldPattern">${isTa ? 'பயிர் சாகுபடி முறை' : 'Cropping Pattern'}</label>
                <select id="fldPattern" onchange="loanProfileState.croppingPattern = this.value">
                  <option value="double" ${loanProfileState.croppingPattern === 'double' ? 'selected' : ''}>Double Crop (Kharif + Rabi seasons)</option>
                  <option value="multi" ${loanProfileState.croppingPattern === 'multi' ? 'selected' : ''}>Multi-Crop / Commercial Intercropping</option>
                  <option value="single" ${loanProfileState.croppingPattern === 'single' ? 'selected' : ''}>Single Season Crop (Mono-crop)</option>
                </select>
              </div>

              <div class="loan-field">
                <label for="fldIrrigation">${isTa ? 'பாசன வசதி' : 'Irrigation Availability'}</label>
                <select id="fldIrrigation" onchange="loanProfileState.irrigation = this.value">
                  <option value="canal" ${loanProfileState.irrigation === 'canal' ? 'selected' : ''}>Canal / River Water</option>
                  <option value="borewell" ${loanProfileState.irrigation === 'borewell' ? 'selected' : ''}>Borewell / Tube-well</option>
                  <option value="open_well" ${loanProfileState.irrigation === 'open_well' ? 'selected' : ''}>Open Well</option>
                  <option value="rainfed" ${loanProfileState.irrigation === 'rainfed' ? 'selected' : ''}>Rainfed Only (Monsoon dependent)</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Step 5: Location & Scheme Criteria (Weight: 10%) -->
          <div class="loan-step-section">
            <div class="step-section-header">
              <span class="step-badge">5</span>
              <div>
                <h3>${isTa ? 'இடம் & விவசாயி பிரிவு' : 'Step 5: Location & Scheme Criteria'}</h3>
                <span style="font-size: 0.8rem; color: var(--primary-700); font-weight: 700;">★ Weight: 10%</span>
              </div>
            </div>

            <div class="loan-inputs-grid">
              <div class="loan-field">
                <label for="fldState">${isTa ? 'மாநிலம்' : 'State'}</label>
                <select id="fldState" onchange="loanProfileState.state = this.value">
                  <option value="Tamil Nadu" selected>Tamil Nadu</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                </select>
              </div>

              <div class="loan-field">
                <label for="fldDistrict">${isTa ? 'மாவட்டம்' : 'District'}</label>
                <select id="fldDistrict" onchange="loanProfileState.district = this.value">
                  <option value="thanjavur" ${loanProfileState.district === 'thanjavur' ? 'selected' : ''}>Thanjavur</option>
                  <option value="thiruvarur" ${loanProfileState.district === 'thiruvarur' ? 'selected' : ''}>Thiruvarur</option>
                  <option value="nagapattinam" ${loanProfileState.district === 'nagapattinam' ? 'selected' : ''}>Nagapattinam</option>
                  <option value="mayiladuthurai" ${loanProfileState.district === 'mayiladuthurai' ? 'selected' : ''}>Mayiladuthurai</option>
                  <option value="madurai" ${loanProfileState.district === 'madurai' ? 'selected' : ''}>Madurai</option>
                  <option value="erode" ${loanProfileState.district === 'erode' ? 'selected' : ''}>Erode</option>
                  <option value="salem" ${loanProfileState.district === 'salem' ? 'selected' : ''}>Salem</option>
                  <option value="dharmapuri" ${loanProfileState.district === 'dharmapuri' ? 'selected' : ''}>Dharmapuri</option>
                  <option value="coimbatore" ${loanProfileState.district === 'coimbatore' ? 'selected' : ''}>Coimbatore</option>
                </select>
              </div>

              <div class="loan-field">
                <label for="fldCategory">${isTa ? 'விவசாயி வகை' : 'Farmer Category'}</label>
                <select id="fldCategory" onchange="loanProfileState.farmerCategory = this.value">
                  <option value="Marginal" ${loanProfileState.farmerCategory === 'Marginal' ? 'selected' : ''}>Marginal (&lt; 2.5 Acres)</option>
                  <option value="Small" ${loanProfileState.farmerCategory === 'Small' ? 'selected' : ''}>Small (2.5 – 5 Acres)</option>
                  <option value="Medium" ${loanProfileState.farmerCategory === 'Medium' ? 'selected' : ''}>Medium (5 – 10 Acres)</option>
                  <option value="Large" ${loanProfileState.farmerCategory === 'Large' ? 'selected' : ''}>Large (&gt; 10 Acres)</option>
                </select>
              </div>
            </div>
          </div>

          <button type="submit" class="btn-calculate-match">
            🔍 ${isTa ? 'எனக்கான கடன் பொருத்தத்தை கணக்கிடு' : 'CHECK MY LOAN OPTIONS'}
          </button>
        </form>
      </div>

      <!-- RESULTS SECTION -->
      <div id="loanMatchResultsSection">
        ${!matchResult.isValid ? `
          <!-- Missing Information Alert -->
          <div class="loan-missing-alert">
            <div style="font-size: 1.75rem;">⚠️</div>
            <div>
              <h4>${isTa ? 'கூடுதல் தகவல்கள் தேவை' : 'More information required'}</h4>
              <p>${isTa ? 'முழுமையான மதிப்பீட்டை பெற பின்வரும் கட்டாய விவரங்களை படிவத்தில் பூர்த்தி செய்யவும்:' : 'To calculate an accurate loan match score without fabrication, please provide the following required fields:'}</p>
              <ul>
                ${matchResult.missingFields.map(f => `<li><strong>${f}</strong></li>`).join('')}
              </ul>
            </div>
          </div>
        ` : `
          <!-- 1. Hero Score Block -->
          <div class="loan-score-hero">
            <div class="score-hero-tagline">${isTa ? 'உங்கள் கடன் பொருத்தம்' : 'YOUR LOAN MATCH'}</div>
            <div class="score-main-number">${matchResult.totalScore} <span style="font-size: 2rem; color: var(--text-muted);">/ 100</span></div>
            <div class="score-number-label">${isTa ? 'கடன் பொருத்த மதிப்பெண்' : 'Loan Match Score'}</div>

            <!-- Mandatory Non-Approval Legal Disclaimer -->
            <div class="loan-disclaimer-banner">
              <span style="font-size: 1.5rem;">ℹ️</span>
              <div>
                <strong>${isTa ? 'முக்கிய அறிவிப்பு:' : 'Important Notice:'}</strong>
                ${isTa 
                  ? 'கடன் பொருத்த மதிப்பெண் என்பது ஒரு வழிகாட்டுதல் கருவி மட்டுமே. இது வங்கியின் இறுதி ஒப்புதல் அல்லது கடன் உத்தரவாதம் அல்ல. இறுதி ஒப்புதல் வங்கியின் ஆவண சரிபார்ப்பு மற்றும் தகுதி சோதனைகளுக்கு உட்பட்டது.' 
                  : 'Loan Match Score is an informational matching tool. It does not represent a bank\'s credit decision or guarantee loan approval. Final approval depends on the lender\'s eligibility checks, documentation, credit assessment and other applicable criteria.'}
              </div>
            </div>
          </div>

          <!-- 2. Visual Score Breakdown (5 Horizontal Progress Bars) -->
          <div class="score-breakdown-card" style="margin-top: 1.5rem;">
            <div class="score-breakdown-header">
              <h3>📊 ${isTa ? 'காரணி வாரியான மதிப்பெண் விவரம்' : 'Visual Score Breakdown'}</h3>
              <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">
                ${isTa ? 'மொத்தம்' : 'Total'}: <strong>${matchResult.totalScore} / 100</strong>
              </span>
            </div>

            <div class="breakdown-bars-list">
              <!-- Credit History: 30% -->
              <div class="score-bar-item">
                <div class="bar-labels-row">
                  <span class="bar-title">
                    <span>💳</span>
                    <span>${isTa ? 'கடன் வரலாறு (Credit history)' : 'Credit history'}</span>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">(Weight: 30%)</span>
                  </span>
                  <span class="bar-points">${matchResult.breakdown.credit.score} / 30</span>
                </div>
                <div class="bar-track">
                  <div class="bar-fill" style="width: ${(matchResult.breakdown.credit.score / 30) * 100}%;"></div>
                </div>
              </div>

              <!-- Existing Loans: 25% -->
              <div class="score-bar-item">
                <div class="bar-labels-row">
                  <span class="bar-title">
                    <span>📑</span>
                    <span>${isTa ? 'தற்போதைய கடன்கள் (Existing loans)' : 'Existing loans'}</span>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">(Weight: 25%)</span>
                  </span>
                  <span class="bar-points">${matchResult.breakdown.existingLoans.score} / 25</span>
                </div>
                <div class="bar-track">
                  <div class="bar-fill" style="width: ${(matchResult.breakdown.existingLoans.score / 25) * 100}%;"></div>
                </div>
              </div>

              <!-- Repayment Capacity: 20% -->
              <div class="score-bar-item">
                <div class="bar-labels-row">
                  <span class="bar-title">
                    <span>💼</span>
                    <span>${isTa ? 'திருப்பி செலுத்தும் திறன் (Repayment capacity)' : 'Repayment capacity'}</span>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">(Weight: 20%)</span>
                  </span>
                  <span class="bar-points">${matchResult.breakdown.repaymentCapacity.score} / 20</span>
                </div>
                <div class="bar-track">
                  <div class="bar-fill" style="width: ${(matchResult.breakdown.repaymentCapacity.score / 20) * 100}%;"></div>
                </div>
              </div>

              <!-- Land & Crop: 15% -->
              <div class="score-bar-item">
                <div class="bar-labels-row">
                  <span class="bar-title">
                    <span>🌾</span>
                    <span>${isTa ? 'நிலம் & பயிர் விவரங்கள் (Land & crop)' : 'Land & crop'}</span>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">(Weight: 15%)</span>
                  </span>
                  <span class="bar-points">${matchResult.breakdown.landCrop.score} / 15</span>
                </div>
                <div class="bar-track">
                  <div class="bar-fill" style="width: ${(matchResult.breakdown.landCrop.score / 15) * 100}%;"></div>
                </div>
              </div>

              <!-- Location & Other: 10% -->
              <div class="score-bar-item">
                <div class="bar-labels-row">
                  <span class="bar-title">
                    <span>📍</span>
                    <span>${isTa ? 'இடம் & பிற தகுதிகள் (Location & other)' : 'Location & other'}</span>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">(Weight: 10%)</span>
                  </span>
                  <span class="bar-points">${matchResult.breakdown.location.score} / 10</span>
                </div>
                <div class="bar-track">
                  <div class="bar-fill" style="width: ${(matchResult.breakdown.location.score / 10) * 100}%;"></div>
                </div>
              </div>
            </div>

            <!-- "Why did I get this score?" Expandable Accordion -->
            <div class="why-score-card" style="margin-top: 1.75rem;">
              <button class="why-score-toggle" onclick="toggleWhyScore()">
                <h4>❓ ${isTa ? 'எனக்கு ஏன் இந்த மதிப்பெண் கிடைத்தது? (Why did I get this score?)' : 'Why did I get this score?'}</h4>
                <span style="font-size: 1.25rem; color: var(--primary-700);">${isWhyScoreOpen ? '▲' : '▼'}</span>
              </button>

              ${isWhyScoreOpen ? `
                <div class="why-score-body">
                  ${matchResult.explanation.map(exp => `
                    <div class="weight-factor-box">
                      <div class="weight-factor-header">
                        <span>${exp.factor}</span>
                        <span class="weight-factor-badge">${exp.weight}</span>
                      </div>
                      <div class="weight-factor-desc">${exp.description}</div>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          </div>

          <!-- 3. Neutral Improvement Suggestions ("Things to check") -->
          ${matchResult.suggestions.length > 0 ? `
            <div class="loan-suggestions-card" style="margin-top: 1.5rem;">
              <div class="loan-suggestions-header">
                <span>💡</span>
                <h4>${isTa ? 'கவனிக்க வேண்டியவை (Things to check)' : 'Things to check'}</h4>
              </div>
              <p style="font-size: 0.85rem; color: #166534; margin-bottom: 1rem;">
                ${isTa 
                  ? 'உங்கள் மதிப்பீட்டில் சில பகுதிகள் குறைவாக உள்ளதால், பின்வரும் ஆவணங்கள் மற்றும் தகவல்களை சரிபார்க்கவும்:' 
                  : 'Certain evaluation components received a lower subscore. Here are neutral, objective factors to review before applying:'}
              </p>
              ${matchResult.suggestions.map(s => `
                <div class="suggestion-block">
                  <div class="suggestion-title">⚠️ ${s.title} (${s.scoreInfo})</div>
                  <ul class="suggestion-list">
                    ${s.items.map(it => `<li>${it}</li>`).join('')}
                  </ul>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <!-- 4. Potential Loan Matches Grid -->
          <div style="margin-top: 2rem;">
            <div class="matches-section-header">
              <div>
                <h3>🏛️ ${isTa ? 'பொருத்தமான கடன் திட்டங்கள்' : 'POTENTIAL LOAN MATCHES'}</h3>
                <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">
                  ${isTa 
                    ? 'சரிபார்க்கப்பட்ட அதிகாரப்பூர்வ கடன் திட்டங்கள் மற்றும் வட்டி சலுகைகள்.' 
                    : 'Matched with official agricultural credit schemes based on your profile and verified guidelines.'}
                </p>
              </div>
            </div>

            <div class="loan-matches-grid">
              ${recommendations.map(loan => `
                <div class="loan-match-card">
                  <div>
                    <div class="match-card-top">
                      <div>
                        <div class="match-card-title">${isTa ? loan.name_ta : loan.name}</div>
                        <div class="match-provider-name">${isTa ? loan.provider_ta : loan.provider}</div>
                      </div>
                      <div class="match-percent-pill">
                        ${loan.potentialMatchPercent}% ${isTa ? 'பொருத்தம்' : 'Match'}
                      </div>
                    </div>

                    <div class="match-details-box">
                      <div><strong>${isTa ? 'வட்டி விகிதம்' : 'Interest Rate'}:</strong> ${loan.interestRate}</div>
                      <div style="margin-top: 0.25rem;"><strong>${isTa ? 'கடன் வரம்பு' : 'Limit'}:</strong> ${loan.maxLimit}</div>
                      <div style="margin-top: 0.25rem;"><strong>${isTa ? 'நோக்கம்' : 'Purpose'}:</strong> ${isTa ? loan.purpose_ta : loan.purpose}</div>
                    </div>

                    <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.35rem;">
                      ✅ ${isTa ? 'ஏன் இந்த திட்டம் பொருந்துகிறது?' : 'Why it matches:'}
                    </div>
                    <ul class="match-reasons-list">
                      ${loan.matchReasons.map(r => `
                        <li class="match-reason-item">
                          <span>•</span>
                          <span>${r}</span>
                        </li>
                      `).join('')}
                    </ul>

                    <div class="match-docs-section">
                      <strong>📄 ${isTa ? 'பொதுவாக தேவைப்படும் ஆவணங்கள்:' : 'Documents commonly required:'}</strong>
                      <ul class="match-docs-list">
                        ${loan.requiredDocuments.slice(0, 4).map(d => `<li>${d}</li>`).join('')}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 1rem; font-style: italic;">
                      ℹ️ ${loan.disclaimerNotice}
                    </div>
                    <div class="match-card-actions">
                      <button class="btn-primary" style="flex: 1; font-size: 0.85rem;" onclick="openDocModal('${loan.id}')">
                        📋 ${t('docsRequired')}
                      </button>
                      <a href="${loan.officialUrl}" target="_blank" rel="noopener" class="btn-secondary" style="font-size: 0.85rem; text-align: center;">
                        🔗 ${isTa ? 'அதிகாரப்பூர்வ தளம்' : 'Open Official Website'}
                      </a>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `}
      </div>
    </div>
  `;
}

/**
 * Handle Sample Preset Profile Click
 */
function applySampleLoanProfile(presetKey) {
  const service = window.LoanRecommendationService;
  if (!service) return;
  const presets = service.getSampleProfiles();
  if (presets[presetKey]) {
    activeSampleCaseKey = presetKey;
    loanProfileState = { ...presets[presetKey] };
    activeLoanMatchResult = service.calculateLoanMatchScore(loanProfileState);

    // Persist recommendation asynchronously to backend PostgreSQL
    if (window.AgriApiService) {
      window.AgriApiService.calculateLoanRecommendation(loanProfileState).catch(err => {
        console.debug('Backend loan recommendation sync note:', err.message);
      });
    }

    renderLoans();
    
    // Smooth scroll down to results
    setTimeout(() => {
      const el = document.getElementById('loanMatchResultsSection');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }
}

/**
 * Handle Form Submission to Calculate Match
 */
function submitLoanAssistantForm() {
  const service = window.LoanRecommendationService;
  if (!service) return;

  activeSampleCaseKey = '';
  activeLoanMatchResult = service.calculateLoanMatchScore(loanProfileState);

  // Persist recommendation asynchronously to backend PostgreSQL
  if (window.AgriApiService) {
    window.AgriApiService.calculateLoanRecommendation(loanProfileState).catch(err => {
      console.debug('Backend loan recommendation sync note:', err.message);
    });
  }

  renderLoans();

  setTimeout(() => {
    const el = document.getElementById('loanMatchResultsSection');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

/**
 * Toggle "Why did I get this score?" explanation
 */
function toggleWhyScore() {
  isWhyScoreOpen = !isWhyScoreOpen;
  renderLoans();
}

// Expose functions globally for inline onclick
window.applySampleLoanProfile = applySampleLoanProfile;
window.submitLoanAssistantForm = submitLoanAssistantForm;
window.toggleWhyScore = toggleWhyScore;
window.renderLoans = renderLoans;

/**
 * 6. RENDER SCHEMES
 */
function renderSchemes() {
  const container = document.getElementById('view-schemes');
  if (!container) return;

  const isTa = currentLang === 'ta';
  const schemes = AgriEngine.matchSchemes(currentProfile);

  // Asynchronously record scheme matches in backend PostgreSQL
  if (window.AgriApiService) {
    window.AgriApiService.matchGovernmentSchemes(currentProfile.id || 1).catch(err => {
      console.debug('Backend scheme matching sync note:', err.message);
    });
  }

  container.innerHTML = `
    <div style="margin-bottom: 1.5rem;">
      <h2>🏛️ ${isTa ? 'அரசு மானியங்கள் & வேளாண் திட்டங்கள்' : 'Government Agricultural Schemes Matcher'}</h2>
      <p style="color: var(--text-muted);">${isTa ? 'உங்கள் நில அளவு மற்றும் பயிர் தகவல்களின் அடிப்படையில் நேரடி வங்கி வரவு மற்றும் மானிய திட்டங்கள்.' : 'Profile-matched Central and State government schemes with clear eligibility statuses, subsidies, and required document checklists.'}</p>
      <a href="https://www.myscheme.gov.in/" target="_blank" rel="noopener noreferrer"
         class="btn-primary"
         style="display: inline-flex; align-items: center; gap: 0.5rem; margin-top: 0.75rem; font-size: 0.95rem; text-decoration: none;">
        🌐 ${isTa ? 'அனைத்து திட்டங்களையும் MyScheme போர்ட்டலில் காண்க' : 'Explore All Schemes on MyScheme.gov.in'}
        <span style="font-size: 0.8rem; opacity: 0.8;">↗</span>
      </a>
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

let currentMarketSort = 'highest';

/**
 * Live Mandi Prices Real-Time Sync
 */
async function refreshMandiPrices() {
  if (window.MarketService) {
    window.MarketService.refreshRates();
    
    // Sync AGRI_DATA.marketPrices so the dashboard preview stays consistent
    const activeRates = window.MarketService.getMarketPrices();
    if (AGRI_DATA && AGRI_DATA.marketPrices) {
      AGRI_DATA.marketPrices.forEach(m => {
        const found = activeRates.find(a => a.cropId === m.cropId);
        if (found) {
          m.currentPrice = found.modalPrice;
          m.prevPrice = found.prevPrice;
          m.trend = found.trendInfo.direction;
          m.percentChange = `${found.trendInfo.diff >= 0 ? '+' : ''}${((found.trendInfo.diff / (found.prevPrice || 1)) * 100).toFixed(1)}%`;
        }
      });
    }
  }

  renderMarkets();
}

/**
 * 7. RENDER MARKETS (Farmer-Friendly, 5-Second Clarity)
 */
function renderMarkets() {
  const container = document.getElementById('view-markets');
  if (!container) return;

  const isTa = currentLang === 'ta';
  const service = window.MarketService;

  if (!service) {
    container.innerHTML = `<div style="padding: 2rem; text-align: center;">Market service loading...</div>`;
    return;
  }

  // Get active filters (from localStorage or defaults)
  const savedFilters = service.getSelectedFilters();
  const availableCrops = service.getAvailableCrops();
  const locations = service.getLocations();

  // Active crop and market data
  const cropData = service.getCropPrices(savedFilters.cropId, savedFilters);
  const trendData = service.getPriceTrend(savedFilters.cropId, cropData.market);
  const comparisonData = service.getMarketComparison(savedFilters.cropId, cropData.district, currentMarketSort);
  const liveStatus = service.getLiveStatus();

  // Selected State object
  const currentStateObj = locations.find(l => l.state === (savedFilters.state || 'Tamil Nadu')) || locations[0];
  const currentDistricts = currentStateObj.districts || [];
  const currentDistrictObj = currentDistricts.find(d => d.id === (savedFilters.district || 'thiruvarur')) || currentDistricts[0];
  const currentMarketList = currentDistrictObj ? currentDistrictObj.markets : [];

  // Range pin percentage calculation
  const minP = cropData.lowestPrice || cropData.minPrice || 2100;
  const maxP = cropData.highestPrice || cropData.maxPrice || 2500;
  const curP = cropData.commonPrice || cropData.modalPrice || 2350;
  const rangeSpan = maxP - minP;
  const pinPercent = rangeSpan > 0 
    ? Math.max(6, Math.min(94, Math.round(((curP - minP) / rangeSpan) * 100))) 
    : 50;

  // 7-day summary metrics
  const weekPrices = (trendData.history || []).map(h => h.price);
  const highest7Day = weekPrices.length > 0 ? Math.max(...weekPrices) : maxP;
  const lowest7Day = weekPrices.length > 0 ? Math.min(...weekPrices) : minP;
  const changeDiff = trendData.trendInfo ? trendData.trendInfo.diff : 0;
  const changeSymbol = changeDiff > 0 ? '↑' : changeDiff < 0 ? '↓' : '→';
  const changeClass = changeDiff > 0 ? 'metric-change-up' : changeDiff < 0 ? 'metric-change-down' : 'metric-change-stable';

  // SVG Line Chart coordinates calculation
  const history = trendData.history || [];
  const chartWidth = 800;
  const chartHeight = 240;
  const padLeft = 80;
  const padRight = 50;
  const padTop = 35;
  const padBottom = 55;
  const usableW = chartWidth - padLeft - padRight;
  const usableH = chartHeight - padTop - padBottom;

  let yMin = lowest7Day;
  let yMax = highest7Day;
  if (yMin === yMax) {
    yMin -= 100;
    yMax += 100;
  }
  const yPadding = (yMax - yMin) * 0.15 || 50;
  const chartYMin = Math.max(0, Math.floor((yMin - yPadding) / 50) * 50);
  const chartYMax = Math.ceil((yMax + yPadding) / 50) * 50;
  const chartYSpan = chartYMax - chartYMin || 1;

  const points = history.map((pt, idx) => {
    const x = history.length > 1 
      ? padLeft + (idx * (usableW / (history.length - 1))) 
      : padLeft + (usableW / 2);
    const y = padTop + usableH - (((pt.price - chartYMin) / chartYSpan) * usableH);
    return { ...pt, x, y };
  });

  const polylinePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = points.length > 0
    ? `${polylinePath} L ${points[points.length - 1].x.toFixed(1)},${(padTop + usableH).toFixed(1)} L ${points[0].x.toFixed(1)},${(padTop + usableH).toFixed(1)} Z`
    : '';

  // Y-axis grid levels
  const yStep = Math.round(chartYSpan / 3);
  const gridLevels = [
    chartYMax,
    chartYMax - yStep,
    chartYMax - (yStep * 2),
    chartYMin
  ];

  container.innerHTML = `
    <div class="farmer-market-wrap">
      <!-- 1. Header & Live/Demo Status Banner -->
      <div class="market-header-row">
        <div>
          <h2>📊 ${isTa ? 'நேரடி சந்தை விலை நிலவரம்' : 'MARKET PRICES'}</h2>
          <p style="color: var(--text-muted); font-size: 0.95rem; margin-top: 0.2rem;">
            ${isTa ? 'விவசாயிகளுக்கான நேரடி மண்டி விலை நிலவரம், விலை வரம்பு மற்றும் 7 நாள் போக்கு.' : 'Real-time mandi crop prices, simple price ranges, and 7-day trend analytics.'}
          </p>
        </div>

        <div class="market-status-bar">
          <span class="badge-source">
            🏛️ ${isTa ? 'அரசு தரவு / அக்மார்க்நெட்' : 'Government of India / Agmarknet'}
          </span>
          ${!liveStatus.isLive ? `
            <span class="badge-demo-notice" title="Direct API connection offline or simulated">
              ⚠️ ${isTa ? 'நேரடி விலை கிடைக்கவில்லை — மாதிரி தரவு காட்டப்படுகிறது' : 'Live price unavailable — showing demo data'}
            </span>
          ` : `
            <span class="badge-live-pulse" style="background: #16a34a;">
              ● ${isTa ? 'நேரடி அக்மார்க்நெட்' : 'LIVE Agmarknet'}
            </span>
          `}
          <button class="gps-locate-btn" onclick="refreshMandiPrices()" title="Refresh latest price rates">
            🔄 ${isTa ? 'விலைகளை புதுப்பி' : 'Refresh Rates'}
          </button>
        </div>
      </div>

      <!-- 2. Easy Search & Select Controls -->
      <div class="farmer-search-card">
        <div class="farmer-search-row">
          <!-- Quick Crop Chips -->
          <div>
            <div class="crop-chip-label">${isTa ? 'விரைவு பயிர் தேர்வு:' : 'Quick Select Crop:'}</div>
            <div class="crop-quick-chips" style="margin-top: 0.4rem;">
              ${availableCrops.map(c => `
                <button class="crop-chip ${c.id === savedFilters.cropId ? 'active' : ''}" 
                        onclick="onSelectCropQuick('${c.id}')">
                  <span>${c.icon}</span>
                  <span>${isTa ? c.name_ta : c.name}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Dropdown Selectors Grid -->
          <div class="farmer-filters-grid">
            <div class="filter-field">
              <label for="mktSelectCrop">${isTa ? 'பயிர்' : 'Select Crop 🔍'}</label>
              <select id="mktSelectCrop" onchange="onCropFilterChange(this.value)">
                ${availableCrops.map(c => `
                  <option value="${c.id}" ${c.id === savedFilters.cropId ? 'selected' : ''}>
                    ${c.icon} ${isTa ? c.name_ta : c.name}
                  </option>
                `).join('')}
              </select>
            </div>

            <div class="filter-field">
              <label for="mktSelectState">${isTa ? 'மாநிலம்' : 'Select State'}</label>
              <select id="mktSelectState" onchange="onStateFilterChange(this.value)">
                ${locations.map(l => `
                  <option value="${l.state}" ${l.state === savedFilters.state ? 'selected' : ''}>
                    ${isTa ? l.state_ta : l.state}
                  </option>
                `).join('')}
              </select>
            </div>

            <div class="filter-field">
              <label for="mktSelectDistrict">${isTa ? 'மாவட்டம்' : 'Select District'}</label>
              <select id="mktSelectDistrict" onchange="onDistrictFilterChange(this.value)">
                ${currentDistricts.map(d => `
                  <option value="${d.id}" ${d.id === savedFilters.district ? 'selected' : ''}>
                    ${isTa ? d.name_ta : d.name}
                  </option>
                `).join('')}
              </select>
            </div>

            <div class="filter-field">
              <label for="mktSelectMarket">${isTa ? 'சந்தை / மண்டி' : 'Select Market'}</label>
              <select id="mktSelectMarket" onchange="onMarketFilterChange(this.value)">
                ${currentMarketList.map(m => `
                  <option value="${m.name}" ${savedFilters.market && m.name.includes(savedFilters.market) ? 'selected' : ''}>
                    ${isTa ? m.name_ta : m.name}
                  </option>
                `).join('')}
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. Primary Farmer Price Card (5-Second Understanding) -->
      <div class="farmer-price-hero">
        <div class="hero-crop-banner">
          <div class="farmer-crop-title">
            <span>${cropData.cropId === 'paddy' ? '🌾' : cropData.cropId === 'cotton' ? '☁️' : cropData.cropId === 'tomato' ? '🍅' : cropData.cropId === 'groundnut' ? '🥜' : cropData.cropId === 'onion' ? '🧅' : cropData.cropId === 'maize' ? '🌽' : '🪴'}</span>
            <span>${isTa ? cropData.cropName_ta : cropData.cropName}</span>
          </div>
          <div class="farmer-market-badge">
            📍 ${isTa ? (cropData.market_ta || cropData.market) : cropData.market}
          </div>
        </div>

        <div class="hero-price-display">
          <div class="hero-price-label">${isTa ? 'இன்றைய பொதுவான சந்தை விலை' : "Today's Common Price"}</div>
          <div class="hero-price-row">
            <div class="hero-price-val">₹${cropData.commonPrice.toLocaleString('en-IN')}</div>
            <div class="hero-unit-label">/ ${isTa ? 'குவிண்டால்' : cropData.unit}</div>
            
            <div class="farmer-trend-pill ${cropData.trendInfo.direction === 'UP' ? 'trend-pill-up' : cropData.trendInfo.direction === 'DOWN' ? 'trend-pill-down' : 'trend-pill-stable'}">
              <span>${cropData.trendInfo.symbol}</span>
              <span>${cropData.trendInfo.diff !== 0 ? `₹${Math.abs(cropData.trendInfo.diff).toLocaleString('en-IN')}` : ''} ${isTa ? 'முந்தைய நாளை விட' : 'from previous available day'}</span>
            </div>
          </div>
        </div>

        <!-- Meta Grid -->
        <div class="hero-meta-row">
          <div class="hero-meta-item">
            <span class="meta-lbl">${isTa ? 'வழக்கமான விலை' : 'Typical Price'}</span>
            <span class="meta-val">₹${cropData.typicalPrice.toLocaleString('en-IN')} / ${cropData.unit}</span>
          </div>

          <div class="hero-meta-item">
            <span class="meta-lbl">${isTa ? 'விலை வரம்பு' : 'Price Range'}</span>
            <span class="meta-val">₹${cropData.lowestPrice.toLocaleString('en-IN')} — ₹${cropData.highestPrice.toLocaleString('en-IN')}</span>
          </div>

          <div class="hero-meta-item">
            <span class="meta-lbl">${isTa ? 'கடைசி புதுப்பிப்பு' : 'Last Updated'}</span>
            <span class="meta-val">${cropData.arrivalDate}</span>
          </div>

          <div class="hero-meta-item">
            <span class="meta-lbl">${isTa ? 'மூலம்' : 'Source'}</span>
            <span class="meta-val" style="color: var(--primary-800);">${cropData.source}</span>
          </div>
        </div>
      </div>

      <!-- 4. Explain "Modal Price" (3-Pillar Breakdown with Tooltip) -->
      <div class="price-pillars-card">
        <div class="pillars-grid">
          <div class="pillar-box">
            <div class="pillar-title">${isTa ? 'குறைந்தபட்ச விலை' : 'Lowest price'}</div>
            <div class="pillar-price">₹${cropData.lowestPrice.toLocaleString('en-IN')}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.35rem;">/ ${cropData.unit}</div>
          </div>

          <div class="pillar-box pillar-common">
            <div class="pillar-title">
              <span>${isTa ? 'பொதுவான விலை' : 'Common price'}</span>
              <span class="tooltip-container" tabindex="0" role="button" aria-label="Information about common price">
                <span class="tooltip-icon">i</span>
                <span class="tooltip-box">
                  ${isTa 
                    ? 'பொதுவான விலை = இந்த சந்தையில் பெரும்பாலான விற்பனைகள் நடக்கும் விலை.' 
                    : 'Common price = the price seen most often in this market.'}
                </span>
              </span>
            </div>
            <div class="pillar-price">₹${cropData.commonPrice.toLocaleString('en-IN')}</div>
            <div style="font-size: 0.85rem; font-weight: 700; color: var(--primary-700); margin-top: 0.35rem;">
              ★ ${isTa ? 'பெரும்பாலான விற்பனை விலை' : 'Most frequent selling rate'}
            </div>
          </div>

          <div class="pillar-box">
            <div class="pillar-title">${isTa ? 'அதிகபட்ச விலை' : 'Highest price'}</div>
            <div class="pillar-price">₹${cropData.highestPrice.toLocaleString('en-IN')}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.35rem;">/ ${cropData.unit}</div>
          </div>
        </div>

        <div class="tooltip-helper-note">
          💡 <strong>${isTa ? 'தெரிந்து கொள்ளுங்கள்:' : 'Farmer Note:'}</strong> 
          ${isTa 
            ? 'அரசு பதிவேடுகளில் "Modal Price" என்று அழைக்கப்படுவது தான் நமது "பொதுவான விலை". இது பெரும்பாலான விவசாயிகள் விற்கும் உண்மை விலையாகும்.' 
            : 'In government data, "Modal Price" is reported as Common price — the actual rate at which most crop lots were auctioned.'}
        </div>
      </div>

      <!-- 5. Visual Price Range Bar -->
      <div class="price-range-card">
        <div class="range-header">
          <h4>📊 ${isTa ? 'விலை வரம்பு வரைபடம்' : 'PRICE RANGE VISUALIZATION'}</h4>
          <p style="font-size: 0.85rem; color: var(--text-muted);">
            ${isTa ? 'குறைந்தபட்சம் முதல் அதிகபட்சம் வரை இன்றைய சந்தை விலை எங்கு நிற்கிறது என்பதை எளிதாக காணுங்கள்.' : 'See exactly where today\'s common price stands between lowest and highest auction rates.'}
          </p>
        </div>

        <div class="range-track-wrap">
          <div class="range-track-bar">
            <!-- Position Marker Pin -->
            <div class="range-pin-marker" style="left: ${pinPercent}%;">
              <div class="pin-bubble">
                ₹${cropData.commonPrice.toLocaleString('en-IN')} ${isTa ? 'பொதுவான விலை' : 'Common price'}
              </div>
              <div class="pin-dot"></div>
            </div>
          </div>

          <div class="range-extremes">
            <div class="range-extreme-box">
              <span class="extreme-title">${isTa ? 'குறைந்தபட்சம்' : 'Lowest'}</span>
              <span class="extreme-price">₹${cropData.lowestPrice.toLocaleString('en-IN')}</span>
            </div>
            <div class="range-extreme-box right">
              <span class="extreme-title">${isTa ? 'அதிகபட்சம்' : 'Highest'}</span>
              <span class="extreme-price">₹${cropData.highestPrice.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 6. 7-Day Price Summary -->
      <div class="summary-7day-card">
        <div class="range-header" style="margin-bottom: 0.5rem;">
          <h4>🗓️ ${isTa ? '7 நாள் விலை சுருக்கம்' : '7-DAY PRICE SUMMARY'}</h4>
          <p style="font-size: 0.85rem; color: var(--text-muted);">
            ${isTa ? 'வரைபடத்தை படிக்காமலேயே கடந்த வாரத்தின் முக்கிய மாற்றங்களை உடனே புரிந்து கொள்ளுங்கள்.' : 'Understand week-long movement in seconds without needing to analyze complex charts.'}
          </p>
        </div>

        <div class="summary-cards-grid">
          <div class="summary-metric-box">
            <div class="metric-lbl">${isTa ? 'அதிகபட்சம்' : 'Highest'}</div>
            <div class="metric-num">₹${highest7Day.toLocaleString('en-IN')}</div>
          </div>

          <div class="summary-metric-box">
            <div class="metric-lbl">${isTa ? 'குறைந்தபட்சம்' : 'Lowest'}</div>
            <div class="metric-num">₹${lowest7Day.toLocaleString('en-IN')}</div>
          </div>

          <div class="summary-metric-box active-current">
            <div class="metric-lbl">${isTa ? 'இன்றைய விலை' : 'Current'}</div>
            <div class="metric-num" style="color: var(--primary-800);">₹${curP.toLocaleString('en-IN')}</div>
          </div>

          <div class="summary-metric-box">
            <div class="metric-lbl">${isTa ? 'மாற்றம்' : 'Change'}</div>
            <div class="metric-num ${changeClass}">
              ${changeSymbol} ₹${Math.abs(changeDiff).toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>

      <!-- 7. Simple 7-Day Price Trend Chart -->
      <div class="farmer-chart-box">
        <div class="chart-header-simple">
          <div>
            <h3>📈 ${isTa ? '7 நாள் விலை போக்கு (சந்தை விலை)' : '7-Day Price Trend (Market Price)'}</h3>
            <span style="font-size: 0.85rem; color: var(--text-muted);">
              ${trendData.isPartial ? (isTa ? 'கிடைக்கக்கூடிய சந்தை தரவு காட்டப்படுகிறது.' : 'Showing available market data.') : (isTa ? 'அளவீடு: ₹ / குவிண்டால்' : 'Unit: Price ₹ / quintal')}
            </span>
          </div>
        </div>

        <div class="chart-svg-wrap">
          <svg viewBox="0 0 ${chartWidth} ${chartHeight}" width="100%" height="100%" preserveAspectRatio="none">
            <defs>
              <linearGradient id="farmerChartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#10b981" stop-opacity="0.35"/>
                <stop offset="100%" stop-color="#10b981" stop-opacity="0.0"/>
              </linearGradient>
            </defs>

            <!-- Horizontal Grid lines & Y labels -->
            ${gridLevels.map(level => {
              const y = padTop + usableH - (((level - chartYMin) / chartYSpan) * usableH);
              return `
                <line x1="${padLeft}" y1="${y}" x2="${chartWidth - padRight}" y2="${y}" stroke="#f1f5f9" stroke-width="1.5"/>
                <text x="${padLeft - 10}" y="${y + 4}" text-anchor="end" font-size="11" fill="#94a3b8" font-weight="600">
                  ₹${level.toLocaleString('en-IN')}
                </text>
              `;
            }).join('')}

            <!-- Bottom X-axis baseline -->
            <line x1="${padLeft}" y1="${padTop + usableH}" x2="${chartWidth - padRight}" y2="${padTop + usableH}" stroke="#e2e8f0" stroke-width="2"/>

            <!-- Area fill -->
            ${areaPath ? `<path d="${areaPath}" fill="url(#farmerChartGrad)"/>` : ''}

            <!-- Single Main Line: Market Price -->
            ${polylinePath ? `<path d="${polylinePath}" fill="none" stroke="#059669" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>` : ''}

            <!-- Interactive Circles and X Date Labels -->
            ${points.map((pt, idx) => {
              const isLast = idx === points.length - 1;
              return `
                <!-- Point Marker -->
                <circle cx="${pt.x}" cy="${pt.y}" r="${isLast ? '7' : '5.5'}" 
                        fill="${isLast ? '#047857' : '#10b981'}" 
                        stroke="#ffffff" stroke-width="2.5"
                        style="cursor: pointer;"
                        onmouseover="showChartHoverTooltip('${pt.date}', '₹${pt.price.toLocaleString('en-IN')} / ${cropData.unit}')"
                        onclick="showChartHoverTooltip('${pt.date}', '₹${pt.price.toLocaleString('en-IN')} / ${cropData.unit}')"
                        tabindex="0"
                        aria-label="${pt.date}: ₹${pt.price} per quintal"
                />

                <!-- Date Label on X Axis -->
                <text x="${pt.x}" y="${padTop + usableH + 22}" text-anchor="middle" font-size="11" 
                      fill="${isLast ? '#047857' : '#64748b'}" font-weight="${isLast ? '800' : '600'}">
                  ${pt.date}
                </text>
              `;
            }).join('')}
          </svg>
        </div>

        <!-- Interactive Tap / Hover Result Pill -->
        <div class="chart-tooltip-display">
          <div id="chartTooltipPill" class="chart-hover-pill">
            <span>📅 ${history[history.length - 1] ? history[history.length - 1].date : 'Today'}</span>
            <span>₹${curP.toLocaleString('en-IN')} / ${cropData.unit}</span>
          </div>
        </div>

        <!-- Simple Trend Explanation Message -->
        <div class="trend-explanation-banner ${trendData.trendInfo.direction === 'UP' ? 'banner-up' : trendData.trendInfo.direction === 'DOWN' ? 'banner-down' : 'banner-stable'}">
          <div class="banner-icon">${trendData.trendInfo.direction === 'UP' ? '📈' : trendData.trendInfo.direction === 'DOWN' ? '📉' : '▬'}</div>
          <div>
            <div class="banner-heading">
              ${trendData.trendInfo.symbol} ${isTa ? (trendData.trendInfo.direction === 'UP' ? 'விலை உயர்ந்து வருகிறது' : trendData.trendInfo.direction === 'DOWN' ? 'விலை சரிந்து வருகிறது' : 'விலை நிலையாக உள்ளது') : (trendData.trendInfo.direction === 'UP' ? 'Price is rising' : trendData.trendInfo.direction === 'DOWN' ? 'Price is falling' : 'Price is stable')}
            </div>
            <div class="banner-detail">
              ${isTa ? trendData.trendInfo.detailedMsgTa : trendData.trendInfo.detailedMsgEn}
            </div>
          </div>
        </div>
      </div>

      <!-- 8. "WHERE CAN I GET A BETTER PRICE?" Section -->
      <div class="better-market-card">
        <div class="better-market-header">
          <div>
            <h3>🏪 ${isTa ? 'எங்கே சிறந்த விலை கிடைக்கும்?' : 'WHERE CAN I GET A BETTER PRICE?'}</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">
              ${isTa ? 'அருகிலுள்ள முக்கிய ஒழுங்குமுறை சந்தைகளின் விலை ஒப்பீடு.' : 'Compare nearby regulated markets for the best reported rates.'}
            </p>
          </div>

          <div class="market-sort-controls">
            <button class="sort-btn ${currentMarketSort === 'highest' ? 'active' : ''}" onclick="onMarketSortChange('highest')">
              ▲ ${isTa ? 'அதிகபட்ச விலை' : 'Highest price'}
            </button>
            <button class="sort-btn ${currentMarketSort === 'lowest' ? 'active' : ''}" onclick="onMarketSortChange('lowest')">
              ▼ ${isTa ? 'குறைந்த விலை' : 'Lowest price'}
            </button>
            <button class="sort-btn ${currentMarketSort === 'nearest' ? 'active' : ''}" onclick="onMarketSortChange('nearest')">
              📍 ${isTa ? 'அருகிலுள்ள சந்தை' : 'Nearest market'}
            </button>
          </div>
        </div>

        <table class="market-comparison-table">
          <thead>
            <tr>
              <th>${isTa ? 'சந்தை / மண்டி' : 'Market'}</th>
              <th>${isTa ? 'பொதுவான விலை' : 'Common Price'}</th>
              <th>${isTa ? 'விலை போக்கு' : 'Trend'}</th>
              <th>${isTa ? 'தொலைவு' : 'Distance'}</th>
            </tr>
          </thead>
          <tbody>
            ${comparisonData.items.map(m => `
              <tr>
                <td>
                  <strong>${isTa ? m.market_ta : m.market}</strong>
                  ${m.isHighestReported ? `<span class="highest-price-tag">★ ${isTa ? 'அதிகபட்ச விலை' : 'Highest reported price'}</span>` : ''}
                </td>
                <td>
                  <strong style="color: var(--primary-900); font-size: 1.1rem;">
                    ₹${m.commonPrice.toLocaleString('en-IN')}
                  </strong>
                  <span style="font-size: 0.8rem; color: var(--text-muted);">/ qtl</span>
                </td>
                <td>
                  <span class="${m.trendInfo.direction === 'UP' ? 'trend-up' : m.trendInfo.direction === 'DOWN' ? 'trend-down' : 'trend-stable'}">
                    ${m.trendInfo.symbol} ${m.trendInfo.diff !== 0 ? `₹${Math.abs(m.trendInfo.diff)}` : isTa ? 'நிலையானது' : 'Stable'}
                  </span>
                </td>
                <td style="color: var(--text-muted); font-size: 0.85rem;">
                  ${m.distanceKm === 0 ? (isTa ? 'உள்ளூர் சந்தை' : 'Selected local market') : `~${m.distanceKm} km`}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Cost & Commission Disclaimer -->
        <div class="transport-disclaimer-box">
          <span style="font-size: 1.25rem;">⚠️</span>
          <span>
            ${isTa ? comparisonData.disclaimer_ta : comparisonData.disclaimer}
          </span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Filter Change Event Handlers (Persisted in localStorage)
 */
function onSelectCropQuick(cropId) {
  const service = window.MarketService;
  if (!service) return;
  const current = service.getSelectedFilters();
  current.cropId = cropId;
  service.saveSelectedFilters(current);
  renderMarkets();
}

function onCropFilterChange(cropId) {
  const service = window.MarketService;
  if (!service) return;
  const current = service.getSelectedFilters();
  current.cropId = cropId;
  service.saveSelectedFilters(current);
  renderMarkets();
}

function onStateFilterChange(stateName) {
  const service = window.MarketService;
  if (!service) return;
  const locations = service.getLocations();
  const stateObj = locations.find(l => l.state === stateName);
  const current = service.getSelectedFilters();
  current.state = stateName;
  if (stateObj && stateObj.districts && stateObj.districts.length > 0) {
    current.district = stateObj.districts[0].id;
    current.market = stateObj.districts[0].markets[0] ? stateObj.districts[0].markets[0].name : '';
  }
  service.saveSelectedFilters(current);
  renderMarkets();
}

function onDistrictFilterChange(districtId) {
  const service = window.MarketService;
  if (!service) return;
  const locations = service.getLocations();
  const current = service.getSelectedFilters();
  const stateObj = locations.find(l => l.state === current.state) || locations[0];
  const distObj = (stateObj.districts || []).find(d => d.id === districtId);
  current.district = districtId;
  if (distObj && distObj.markets && distObj.markets.length > 0) {
    current.market = distObj.markets[0].name;
  }
  service.saveSelectedFilters(current);
  renderMarkets();
}

function onMarketFilterChange(marketName) {
  const service = window.MarketService;
  if (!service) return;
  const current = service.getSelectedFilters();
  current.market = marketName;
  service.saveSelectedFilters(current);
  renderMarkets();
}

function onMarketSortChange(sortOption) {
  currentMarketSort = sortOption;
  renderMarkets();
}

function showChartHoverTooltip(date, priceText) {
  const pill = document.getElementById('chartTooltipPill');
  if (pill) {
    pill.innerHTML = `<span>📅 ${date}</span><span>${priceText}</span>`;
  }
}

// Expose handlers to window for inline onclick / onchange
window.onSelectCropQuick = onSelectCropQuick;
window.onCropFilterChange = onCropFilterChange;
window.onStateFilterChange = onStateFilterChange;
window.onDistrictFilterChange = onDistrictFilterChange;
window.onMarketFilterChange = onMarketFilterChange;
window.onMarketSortChange = onMarketSortChange;
window.showChartHoverTooltip = showChartHoverTooltip;
window.refreshMandiPrices = refreshMandiPrices;
window.renderMarkets = renderMarkets;

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
            <label>${isTa ? 'தொலைபேசி எண்' : 'Phone Number'}</label>
            <input type="tel" class="form-control" id="profPhone" value="${currentProfile.phone || ''}" placeholder="e.g. 9876543210">
          </div>
          <div class="form-group">
            <label>${isTa ? 'மின்னஞ்சல்' : 'Email Address'}</label>
            <input type="email" class="form-control" id="profEmail" value="${currentProfile.email || ''}" placeholder="farmer@agricraft.com">
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

  document.getElementById('farmerProfileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    currentProfile.name = document.getElementById('profName').value;
    currentProfile.phone = document.getElementById('profPhone') ? document.getElementById('profPhone').value : (currentProfile.phone || '');
    currentProfile.email = document.getElementById('profEmail') ? document.getElementById('profEmail').value : (currentProfile.email || '');
    currentProfile.district = document.getElementById('profDistrict').value;
    currentProfile.farmerCategory = document.getElementById('profCategory').value;
    currentProfile.farmSize = parseFloat(document.getElementById('profFarmSize').value) || 2;
    currentProfile.soil = document.getElementById('profSoil').value;
    currentProfile.water = document.getElementById('profWater').value;
    currentProfile.irrigation = document.getElementById('profIrrigation').value;
    currentProfile.currentCrop = document.getElementById('profCrop').value;
    currentProfile.cropStage = document.getElementById('profStage').value;

    localStorage.setItem('agri_craft_profile', JSON.stringify(currentProfile));

    // Asynchronously save to PostgreSQL backend API
    if (window.AgriApiService) {
      try {
        const apiRes = await window.AgriApiService.saveFarmerProfile(currentProfile);
        if (apiRes && apiRes.farmer && apiRes.farmer.id) {
          currentProfile.id = apiRes.farmer.id;
          localStorage.setItem('agri_craft_farmer_id', apiRes.farmer.id);
        }
      } catch (saveErr) {
        console.warn('Backend profile persistence notice:', saveErr.message);
      }
    }

    syncLiveWeatherForActiveDistrict(liveWeather.forecastDays);
    runInitialAssessments();
    alert(isTa ? 'உங்கள் சுயவிவரம் வெற்றிகரமாக சேமிக்கப்பட்டது! நேரடி வானிலை புதுப்பிக்கப்பட்டது.' : 'Farmer profile updated and saved! Open-Meteo live telemetry refreshed.');
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

  // Asynchronously register crop in backend crops table
  if (window.AgriApiService) {
    window.AgriApiService.createCrop({
      farmer_id: currentProfile.id || 1,
      crop_name: cropName,
      season: 'Kharif',
      area: currentProfile.farmSize || 2.5
    }).catch(err => console.debug('Backend crop registration note:', err.message));
  }

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
