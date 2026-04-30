import express from 'express';

const router = express.Router();

/**
 * GET /api/health
 * Checks for existence of local .env keys
 */
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      ors: !!process.env.ORS_API_KEY,
      opencage: !!process.env.OPENCAGE_API_KEY,
      mapbox: !!process.env.MAPBOX_TOKEN, 
    },
  });
});

export default router;