/**
 * AGRI CRAFT-AI - Backend API Client Service (apiService.js)
 * 
 * Provides unified, resilient REST communication between the frontend
 * and the Node.js + Express backend.
 * 
 * Supports automatic fallback to localStorage and in-memory AGRI_DATA
 * if the backend is currently offline.
 */

(function(window) {
  'use strict';

  // Automatically detect API host: relative if served from backend, otherwise localhost:5000
  const API_BASE = (window.location.protocol.startsWith('http') && window.location.port === '5000')
    ? '/api'
    : 'http://localhost:5000/api';

  let isBackendAvailable = null;

  /**
   * Safe fetch with timeout
   */
  async function safeFetch(endpoint, options = {}, timeoutMs = 3000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      isBackendAvailable = true;
      return await response.json();
    } catch (err) {
      clearTimeout(timeoutId);
      isBackendAvailable = false;
      console.info(`[AgriCraft API] Endpoint ${endpoint} unreachable (${err.message}). Using local client state.`);
      return null;
    }
  }

  const ApiService = {
    /**
     * Check backend health status
     */
    async checkHealth() {
      return await safeFetch('/health');
    },

    /**
     * Save farmer profile to backend
     */
    async saveFarmerProfile(profile) {
      const payload = {
        name: profile.name,
        phone: profile.phone || null,
        email: profile.email || null,
        location: profile.district || profile.location || 'Thanjavur',
        land_area: profile.farmSize || profile.land_area || 2.0,
        land_type: profile.soil || profile.land_type || 'Alluvial'
      };

      const existingId = localStorage.getItem('agri_craft_farmer_id');
      if (existingId) {
        const updateRes = await safeFetch(`/farmers/${existingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        if (updateRes && updateRes.success) return updateRes;
      }

      const createRes = await safeFetch('/farmers', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (createRes && createRes.farmer && createRes.farmer.id) {
        localStorage.setItem('agri_craft_farmer_id', createRes.farmer.id);
      }

      return createRes;
    },

    /**
     * Retrieve farmer profile from backend
     */
    async getFarmerProfile(id) {
      return await safeFetch(`/farmers/${id}`);
    },

    /**
     * Register a crop for a farmer
     */
    async createCrop(cropData) {
      const farmerId = cropData.farmer_id || localStorage.getItem('agri_craft_farmer_id') || 1;
      const payload = {
        farmer_id: parseInt(farmerId, 10),
        crop_name: cropData.crop_name || cropData.name,
        season: cropData.season || 'Kharif',
        area: cropData.area || cropData.farmSize || 2.5,
        sowing_date: cropData.sowing_date || new Date().toISOString().split('T')[0],
        expected_harvest_date: cropData.expected_harvest_date || null
      };

      return await safeFetch('/crops', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },

    /**
     * Get all crops associated with a farmer
     */
    async getFarmerCrops(farmerId) {
      const id = farmerId || localStorage.getItem('agri_craft_farmer_id') || 1;
      return await safeFetch(`/crops/${id}`);
    },

    /**
     * Get market prices with optional filters
     */
    async getMarketPrices(filters = {}) {
      let query = '';
      const params = [];
      if (filters.crop) params.push(`crop=${encodeURIComponent(filters.crop)}`);
      if (filters.location) params.push(`location=${encodeURIComponent(filters.location)}`);
      if (params.length > 0) query = `?${params.join('&')}`;

      return await safeFetch(`/market-prices${query}`);
    },

    /**
     * Calculate loan recommendations on backend
     */
    async calculateLoanRecommendation(profile) {
      const farmerId = localStorage.getItem('agri_craft_farmer_id') || 1;
      const payload = {
        ...profile,
        farmer_id: parseInt(farmerId, 10)
      };

      return await safeFetch('/loan-recommendations', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },

    /**
     * Fetch catalog of agricultural loans
     */
    async getLoans() {
      return await safeFetch('/loans');
    },

    /**
     * Match government schemes for a farmer
     */
    async matchGovernmentSchemes(farmerId) {
      const id = farmerId || localStorage.getItem('agri_craft_farmer_id') || 1;
      return await safeFetch(`/government-schemes/match/${id}`);
    },

    /**
     * Fetch all government schemes
     */
    async getGovernmentSchemes() {
      return await safeFetch('/government-schemes');
    },

    get isOnline() {
      return isBackendAvailable;
    }
  };

  window.AgriApiService = ApiService;
})(window);
