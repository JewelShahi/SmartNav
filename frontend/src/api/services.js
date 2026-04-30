import api from "./axios";

export const RouteService = {
  /**
   * POST /api/route/optimize
   */
  optimize: async (origin, stops, roundTrip = false) => {
    // RESTORED: Standard cleanup and object structure for local Express
    const filteredStops = stops.filter(s => s && (typeof s === 'string' ? s.trim() : true));
    
    return api.post("/route/optimize", {
      origin: typeof origin === 'string' ? origin.trim() : origin,
      stops: filteredStops.map((s) => typeof s === 'string' ? s.trim() : s),
      options: { 
        optimizeFor: 'duration',
        roundTrip: roundTrip 
      },
    });
  },

  /**
   * POST /api/route/matrix
   */
  getMatrix: (points) => api.post("/route/matrix", { points }),
};

export const GeocodeService = {
  /**
   * GET /api/geocode/autocomplete
   * RESTORED: Standard parameter order (query, lat, lng, signal)
   */
  autocomplete: async (query, lat = null, lng = null, signal = null) => {
    const trimmedQuery = query?.trim() || '';
    if (trimmedQuery.length < 3) return [];

    const params = { q: trimmedQuery };
    
    // Ensure coordinates are sent as valid floats
    if (lat !== null && !isNaN(parseFloat(lat))) params.lat = parseFloat(lat);
    if (lng !== null && !isNaN(parseFloat(lng))) params.lng = parseFloat(lng);
    
    try {
      const response = await api.get("/geocode/autocomplete", { 
        params, 
        signal 
      });

      /**
       * RESTORED: Since axios.js uses (response) => response.data,
       * 'response' here is usually already the array.
       */
      return Array.isArray(response) ? response : (response?.data || []);
    } catch (error) {
      // Ignore AbortController cancellations
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        return null;
      }
      console.error("Autocomplete error:", error);
      return [];
    }
  },

  /**
   * GET /api/geocode/reverse
   */
  reverseGeocode: async (lat, lng) => {
    try {
      return await api.get("/geocode/reverse", { 
        params: { 
          lat: parseFloat(lat), 
          lng: parseFloat(lng) 
        } 
      });
    } catch (error) {
      console.error("Reverse geocode error:", error);
      throw error;
    }
  },
};