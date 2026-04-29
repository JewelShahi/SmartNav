import api from "./axios";

export const RouteService = {
  /**
   * POST /api/route/optimize
   * Sends origin and stops to be optimized by the backend
   */
  optimize: async (origin, stops, roundTrip = false) => {
    const filteredStops = stops.filter(s => s && s.trim());
    return api.post("/route/optimize", {
      origin: origin.trim(),
      stops: filteredStops.map((s) => s.trim()),
      options: { 
        optimizeFor: 'duration',
        roundTrip: roundTrip // Now uses the actual variable passed from the component
      },
    });
  },

  /**
   * POST /api/route/matrix
   * Gets distance/duration matrix for a set of points
   */
  getMatrix: (points) => api.post("/route/matrix", { points }),
};

export const GeocodeService = {
  /**
   * GET /api/geocode/autocomplete
   */
  autocomplete: async (query, lat = null, lng = null, signal = null) => {
    // 1. Ensure we don't send empty or tiny strings
    const trimmedQuery = query?.trim() || '';
    if (trimmedQuery.length < 3) return [];

    // 2. Build params object
    const params = { q: trimmedQuery };
    
    // 3. Strict coordinate check
    // We use Number() to ensure we aren't passing strings like "null" or "[object]"
    if (lat !== null && !isNaN(parseFloat(lat))) {
      params.lat = parseFloat(lat);
    }
    if (lng !== null && !isNaN(parseFloat(lng))) {
      params.lng = parseFloat(lng);
    }
    
    try {
      // 4. Axios GET request
      // We wrap this to ensure we return the data part of the response
      const response = await api.get("/geocode/autocomplete", { 
        params, 
        signal 
      });

      // 5. Always return an array (even if the backend sends something else)
      return Array.isArray(response) ? response : (response?.data || []);
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        return null; // Silent return for cancelled requests
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