import express from 'express';
import {
    createReport, getReports, getAvailableReports, getMyReports,
    assignReport, adminAssignReport, markCleaning, completeReport,
    getMyTasks, getTaskHistory, checkDuplicate, getMapData, markFalseReport,
    createPublicStreetReport
} from '../controllers/reportController.js';
import { classifyWaste } from '../controllers/aiController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { uploadReport, uploadProof } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Public Citizen Street Report (Outside Organization boundary - Zero Auth required)
router.post('/public-street', uploadReport.single('image'), createPublicStreetReport);

// Citizen
router.post('/classify-waste', protect, authorizeRoles('citizen'), uploadReport.single('image'), classifyWaste);
router.get('/check-duplicate', protect, authorizeRoles('citizen'), checkDuplicate);
router.post('/', protect, authorizeRoles('citizen'), uploadReport.single('image'), createReport);

router.get('/myreports', protect, authorizeRoles('citizen'), getMyReports);

// Partner
router.get('/available', protect, authorizeRoles('partner'), getAvailableReports);
router.get('/mytasks', protect, authorizeRoles('partner'), getMyTasks);
router.get('/task-history', protect, authorizeRoles('partner'), getTaskHistory);
router.put('/:id/assign', protect, authorizeRoles('partner'), assignReport);
router.put('/:id/cleaning', protect, authorizeRoles('partner'), markCleaning);
router.put('/:id/complete', protect, authorizeRoles('partner'), uploadProof.single('proof'), completeReport);
router.put('/:id/false-report', protect, authorizeRoles('partner'), uploadProof.single('proof'), markFalseReport);

// Admin & Partner (Map Data)
router.get('/map-data', protect, authorizeRoles('admin', 'partner'), getMapData);

// Admin
router.get('/', protect, authorizeRoles('admin', 'partner'), getReports);
router.put('/:id/assign-partner', protect, authorizeRoles('admin'), adminAssignReport);

export default router;
