import api from "./axios";

export const RouteService = {
  optimize: (origin, stops, roundTrip = true) =>
    api.post("/route/optimize", {
      origin: { address: origin },
      stops: stops.map((s) => ({ address: s })),
      options: { roundTrip },
    }),

  getMatrix: (points) => api.post("/route/matrix", { points }),
};

export const GeocodeService = {
  autocomplete: (query) =>
    api.get(`/geocode/autocomplete`, { params: { q: query } }),

  // Renamed to reverseGeocode to match the App.jsx call
  reverseGeocode: async (lat, lng) => {
    const { data } = await api.get(`/geocode/reverse`, {
      params: { lat, lng },
    });
    return data;
  },
};
