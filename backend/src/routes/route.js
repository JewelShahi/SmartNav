import express from "express";
import {
  optimizeRoute,
  buildDistanceMatrix,
} from "../services/routeService.js";
import { geocodeAddress } from "../services/geocodeService.js";

const router = express.Router();

/**
 * Validate a coordinate object { lat, lng }
 */
const isValidCoord = (obj) =>
  obj &&
  typeof obj.lat === "number" &&
  typeof obj.lng === "number" &&
  obj.lat >= -90 &&
  obj.lat <= 90 &&
  obj.lng >= -180 &&
  obj.lng <= 180;

/**
 * Resolve a stop that may have coordinates or just an address string.
 * If `lat`/`lng` are provided, use them; otherwise geocode the address.
 */
const resolveStop = async (stop) => {
  if (isValidCoord(stop)) {
    return {
      lat: stop.lat,
      lng: stop.lng,
      address: stop.address || `${stop.lat.toFixed(5)}, ${stop.lng.toFixed(5)}`,
      label: stop.label || stop.address || "Stop",
    };
  }

  if (stop.address && typeof stop.address === "string") {
    const geocoded = await geocodeAddress(stop.address);
    return {
      lat: geocoded.lat,
      lng: geocoded.lng,
      address: geocoded.formattedAddress,
      label: stop.label || stop.address,
    };
  }

  throw new Error(
    `Invalid stop: must have lat/lng or address. Got: ${JSON.stringify(stop)}`,
  );
};

/**
 * POST /api/route/optimize
 *
 * Body:
 * {
 *   origin: { lat, lng, address? } | { address: string },
 *   stops: Array<{ lat, lng, label? } | { address: string, label? }>,
 *   options?: {
 *     optimizeFor: 'duration' | 'distance',  // default: 'duration'
 *     roundTrip: boolean                      // default: true
 *   }
 * }
 *
 * Returns:
 * {
 *   optimizedOrder: [...],
 *   route: { geometry, totalDistance, totalDuration, steps },
 *   legs: [...],
 *   summary: {...}
 * }
 */
router.post("/optimize", async (req, res, next) => {
  try {
    const { origin, stops, options = {} } = req.body;

    // ── Validate input ──────────────────────────────────────────────────────
    if (!origin) {
      return res.status(400).json({ error: "origin is required" });
    }
    if (!Array.isArray(stops) || stops.length === 0) {
      return res.status(400).json({ error: "stops must be a non-empty array" });
    }
    if (stops.length > 24) {
      return res
        .status(400)
        .json({ error: "Maximum 24 stops supported (ORS matrix limit)" });
    }

    const { optimizeFor = "duration", roundTrip = true } = options;
    if (!["duration", "distance"].includes(optimizeFor)) {
      return res
        .status(400)
        .json({ error: 'optimizeFor must be "duration" or "distance"' });
    }

    // ── Resolve all addresses to coordinates ────────────────────────────────
    console.log("[Route API] Resolving coordinates...");
    const [resolvedOrigin, ...resolvedStops] = await Promise.all([
      resolveStop(origin),
      ...stops.map(resolveStop),
    ]);

    // ── Run optimization ────────────────────────────────────────────────────
    const result = await optimizeRoute(resolvedOrigin, resolvedStops, {
      optimizeFor,
      roundTrip,
    });

    // Attach resolved address info to optimized order
    const allPoints = [resolvedOrigin, ...resolvedStops];
    result.optimizedOrder = result.optimizedOrder.map((item) => ({
      ...item,
      address: allPoints[item.index].address,
      label: allPoints[item.index].label,
    }));

    res.json(result);
  } catch (err) {
    console.error("[Route API] Error:", err.message);
    next(err);
  }
});

/**
 * POST /api/route/matrix
 * Quick distance matrix without full optimization — useful for frontend previews.
 *
 * Body: { points: Array<{ lat, lng }> }
 * Returns: { matrix: N×N array of { distance, duration } }
 */
router.post("/matrix", async (req, res, next) => {
  try {
    const { points } = req.body;

    if (!Array.isArray(points) || points.length < 2) {
      return res
        .status(400)
        .json({ error: "points must be an array of at least 2 coordinates" });
    }
    if (points.length > 25) {
      return res
        .status(400)
        .json({ error: "Maximum 25 points for matrix calculation" });
    }
    if (!points.every(isValidCoord)) {
      return res
        .status(400)
        .json({ error: "All points must have valid lat and lng" });
    }

    const matrix = await buildDistanceMatrix(points);
    res.json({ matrix });
  } catch (err) {
    next(err);
  }
});

export default router;
