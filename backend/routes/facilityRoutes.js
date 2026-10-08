import express from 'express';
import {
    getActiveFacility,
    listFacilities,
    switchFacility,
    updateFacilityAssumptions,
    createInternalReport,
    getInternalReports,
    updateInternalReportStatus,
    triggerCameraSnapshot,
    alertWarden
} from '../controllers/facilityController.js';

const router = express.Router();

router.get('/active', getActiveFacility);
router.get('/list', listFacilities);
router.post('/switch', switchFacility);
router.put('/assumptions', updateFacilityAssumptions);

// Internal campus waste reports
router.post('/internal-reports', createInternalReport);
router.get('/internal-reports', getInternalReports);
router.put('/internal-reports/:id/status', updateInternalReportStatus);

// Hourly camera simulator
router.post('/camera/snapshot', triggerCameraSnapshot);

// Alert warden
router.post('/alert-warden', alertWarden);

export default router;
