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
 * RESTORED: Standard parameter passing for local standalone logic.
 */
router.get("/autocomplete", async (req, res, next) => {
  try {
    const { q, lat, lng } = req.query;

    // 1. CHARACTER GATE:
    // Matches the backend service requirement (length < 3)
    if (!q || q.trim().length < 3) {
      return res.json([]);
    }

    const biasLat = validateCoord(lat) ? parseFloat(lat) : null;
    const biasLng = validateCoord(lng) ? parseFloat(lng) : null;

    // Calls service with direct parameters
    const suggestions = await autocompleteAddress(q.trim(), biasLat, biasLng);
    res.json(suggestions);
  } catch (err) {
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
 * GET /api/geocode/reverse
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