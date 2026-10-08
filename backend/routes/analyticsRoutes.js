import express from 'express';
import { getPowerAnalytics, getWaterAnalytics, getWeatherAqi, getFacilityOverview } from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/power', getPowerAnalytics);
router.get('/water', getWaterAnalytics);
router.get('/weather-aqi', getWeatherAqi);
router.get('/overview', getFacilityOverview);

export default router;
