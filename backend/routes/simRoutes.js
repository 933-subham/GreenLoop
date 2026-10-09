import express from 'express';
import { injectSimFault, resetSimFaults, startSim, stopSim, getSimStatus } from '../controllers/simController.js';

const router = express.Router();

router.post('/fault', injectSimFault);
router.post('/inject-fault', injectSimFault);
router.post('/reset', resetSimFaults);
router.post('/start', startSim);
router.post('/stop', stopSim);
router.get('/status', getSimStatus);

export default router;
