import express from "express";
import {
  geocodeAddress,
  autocompleteAddress,
  reverseGeocode,
} from "../services/geocodeService.js";

const router = express.Router();

/**
 * Helper: Validate that a coordinate is a real number
 */
const validateCoord = (val) => {
  const n = parseFloat(val);
  return !isNaN(n) && isFinite(n);
};

/**
 * GET /api/geocode/autocomplete?q=...
 * Used for dynamic suggestions as the user types.
 */
router.get("/autocomplete", async (req, res, next) => {
  try {
    const { q, lat, lng } = req.query;

    // 1. CHARACTER GATE:
    // Do not hit external APIs if the query is shorter than 3 characters.
    // This stops "blasts" of requests while the user is just starting to type.
    if (!q || q.trim().length < 3) {
      return res.json([]);
    }

    const biasLat = validateCoord(lat) ? parseFloat(lat) : null;
    const biasLng = validateCoord(lng) ? parseFloat(lng) : null;

    const suggestions = await autocompleteAddress(q.trim(), biasLat, biasLng);
    res.json(suggestions);
  } catch (err) {
    // If we hit a rate limit from the provider, return a clean error
    if (err.response?.status === 429) {
      return res
        .status(429)
        .json({ error: "Search provider busy. Try again in a second." });
    }
    next(err);
  }
});

/**
 * POST /api/geocode
 * Body: { address: string }
 */
router.post("/", async (req, res, next) => {
  try {
    const { address } = req.body;

    if (!address || typeof address !== "string" || address.trim().length < 3) {
      return res
        .status(400)
        .json({ error: "Address must be at least 3 characters" });
    }

    const result = await geocodeAddress(address.trim());
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/geocode/reverse?lat=...&lng=...
 */
router.get("/reverse", async (req, res, next) => {
  try {
    const { lat, lng } = req.query;

    if (!validateCoord(lat) || !validateCoord(lng)) {
      return res.status(400).json({ error: "Invalid latitude or longitude" });
    }

    const result = await reverseGeocode(parseFloat(lat), parseFloat(lng));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
