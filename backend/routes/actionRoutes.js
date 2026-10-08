import express from 'express';
import { getRankedActions, getAlerts, updateAlertStatus, runScenarioSimulation } from '../controllers/actionController.js';

const router = express.Router();

router.get('/', getRankedActions);
router.get('/alerts', getAlerts);
router.put('/alerts/:id', updateAlertStatus);
router.post('/scenario', runScenarioSimulation);

export default router;
