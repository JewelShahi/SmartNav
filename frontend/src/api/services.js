import api from "./axios";

export const RouteService = {
  optimize: async (origin, stops, roundTrip = false) => {
    const filteredStops = stops.filter(s => s && s.trim());
    return api.post("/route/optimize", {
      origin: origin.trim(),
      stops: filteredStops.map((s) => s.trim()),
      options: { 
        optimizeFor: 'duration',
        roundTrip: true
      },
    });
  },

  getMatrix: (points) => api.post("/route/matrix", { points }),
};

export const GeocodeService = {
  // Add 'signal' as the 4th parameter
  autocomplete: async (query, lat = null, lng = null, signal = null) => {
    if (!query || query.trim().length < 3) return [];

    const params = { q: query.trim() };
    if (lat !== null) params.lat = lat;
    if (lng !== null) params.lng = lng;
    
    // Pass the signal to axios here
    return api.get("/geocode/autocomplete", { params, signal });
  },

  reverseGeocode: (lat, lng) => 
    api.get("/geocode/reverse", { params: { lat, lng } }),
};