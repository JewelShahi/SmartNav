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
   * Supports debounced search with AbortSignal cancellation
   * Parameters:
   * 1. query: The string to search
   * 2. lat: Optional latitude for location bias
   * 3. lng: Optional longitude for location bias
   * 4. signal: The AbortSignal from AbortController
   */
  autocomplete: async (query, lat = null, lng = null, signal = null) => {
    // Prevent API calls for very short strings
    if (!query || query.trim().length < 3) return [];

    const params = { q: query.trim() };
    
    // Only add coordinates to params if they are valid numbers
    if (lat !== null && !isNaN(lat)) params.lat = lat;
    if (lng !== null && !isNaN(lng)) params.lng = lng;
    
    // Pass 'signal' inside the Axios config object
    return api.get("/geocode/autocomplete", { 
      params, 
      signal 
    });
  },

  /**
   * GET /api/geocode/reverse
   * Converts coordinates into a human-readable address
   */
  reverseGeocode: (lat, lng) => 
    api.get("/geocode/reverse", { 
      params: { lat, lng } 
    }),
};