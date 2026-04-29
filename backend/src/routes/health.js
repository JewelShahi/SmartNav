import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      ors: !!process.env.ORS_API_KEY,
      mapbox: !!process.env.MAPBOX_TOKEN,
      opencage: !!process.env.OPENCAGE_API_KEY,
    },
  });
});

export default router;