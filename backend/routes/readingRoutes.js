import express from 'express';
import { getDevices, ingestReadings, getReadings, getAlerts, ackAlert } from '../controllers/readingController.js';
import {
    getPowerOverview,
    getPowerProfile,
    getPowerMix,
    getWaterOverview,
    getWaterProfile,
    getWaterMix
} from '../controllers/overviewController.js';
import { getLogStatus, downloadLogs } from '../controllers/logController.js';
import {
    getBuildings,
    addBuilding,
    deleteBuilding,
    autoCreateBuildingMeters,
    addDevice,
    deleteDevice,
    applyFacilityTemplate,
    bulkImportFacility
} from '../controllers/facilitySetupController.js';

const router = express.Router();

// Device Registry & Ingestion
router.get('/devices', getDevices);
router.post('/devices', addDevice);
router.delete('/devices/:id', deleteDevice);
router.post('/ingest/readings', ingestReadings);
router.get('/readings', getReadings);
router.get('/alerts', getAlerts);
router.patch('/alerts/:id/ack', ackAlert);

// Drill-Down Power & Water Overview & Profiles
router.get('/power/overview', getPowerOverview);
router.get('/power/profile', getPowerProfile);
router.get('/power/mix', getPowerMix);
router.get('/water/overview', getWaterOverview);
router.get('/water/profile', getWaterProfile);
router.get('/water/mix', getWaterMix);

// Logs Status & Streaming CSV Export
router.get('/logs/status', getLogStatus);
router.get('/logs/download', downloadLogs);

// Facility Setup
router.get('/buildings', getBuildings);
router.post('/buildings', addBuilding);
router.delete('/buildings/:id', deleteBuilding);
router.post('/buildings/:id/auto-meters', autoCreateBuildingMeters);
router.post('/setup/template', applyFacilityTemplate);
router.post('/setup/bulk-import', bulkImportFacility);

export default router;
