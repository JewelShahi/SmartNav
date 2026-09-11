import express from "express";
import { optimizeRoute } from "../services/routeService.js";
import { geocodeAddress } from "../services/geocodeService.js";

const router = express.Router();

/**
 * POST /api/route/optimize
 */
router.post("/optimize", async (req, res, next) => {
  try {
    const { origin, stops, options = {} } = req.body;

    if (!origin) return res.status(400).json({ error: "Origin is required" });

    const validStops = Array.isArray(stops)
      ? stops.filter(s => {
          if (typeof s === 'string') return s.trim() !== '';
          if (typeof s === 'object' && s !== null) return !!(s.address || (s.lat && s.lng));
          return false;
        })
      : [];

    if (validStops.length === 0) {
      return res.status(400).json({ error: "At least one stop is required" });
    }

    // Resolves strings to coordinates using the Geocode Service
    const resolveToCoords = async (input) => {
      if (typeof input === 'object' && input !== null && input.lat && input.lng) {
        return { 
          lat: input.lat, 
          lng: input.lng, 
          address: input.address || '', 
          label: input.label || input.address || '' 
        };
      }
      const str = typeof input === 'object' ? input.address : input;
      const result = await geocodeAddress(str);
      return { lat: result.lat, lng: result.lng, address: str, label: str };
    };

    const resolvedPoints = await Promise.all([
      resolveToCoords(origin),
      ...validStops.map(resolveToCoords)
    ]);

    const resolvedOrigin = resolvedPoints[0];
    const resolvedStops = resolvedPoints.slice(1);

    // Call the restored service logic
    const result = await optimizeRoute(resolvedOrigin, resolvedStops, { 
      ...options, 
      roundTrip: true 
    });

    // Map labels back to the optimized order
    const allLabels = [
      typeof origin === 'object' ? (origin.address || '') : origin,
      ...validStops.map(s => typeof s === 'object' ? (s.address || '') : s)
    ];

    result.optimizedOrder = result.optimizedOrder.map(item => ({
      ...item,
      label: item.isOrigin ? allLabels[0] : allLabels[item.index]
    }));

    res.json(result);
  } catch (err) {
    console.error("[Route API Error]:", err.message);
    res.status(500).json({ 
      error: "Route calculation failed.",
      details: err.message 
    });
  }
});

export default router;
