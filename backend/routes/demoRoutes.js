import express from 'express';
import {
    getDemoStatus,
    injectFloor3Surge,
    injectTankALeak,
    injectBin4Overflow,
    injectCameraMiss,
    resetDemo
} from '../controllers/demoController.js';

const router = express.Router();

router.get('/status', getDemoStatus);
router.post('/inject-floor3', injectFloor3Surge);
router.post('/inject-tank-leak', injectTankALeak);
router.post('/inject-bin-overflow', injectBin4Overflow);
router.post('/inject-camera-miss', injectCameraMiss);
router.post('/reset', resetDemo);

export default router;
