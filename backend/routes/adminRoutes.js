import express from 'express';
import {
    getDashboardStats, getAllUsers, getAllReports,
    getPendingPartners, getActivePartners, approvePartner, rejectPartner, blockUser,
    reviewFalseReport, getAnalyticsWasteTypes, getAnalyticsMonthlyCleanups,
    getAnalyticsAreaCleanliness, getAnalyticsPartnerPerformance, getHotspots
} from '../controllers/adminController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect, authorizeRoles('admin'));

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/reports', getAllReports);
router.get('/partners/pending', getPendingPartners);
router.get('/partners/active', getActivePartners);
router.put('/partners/:id/approve', approvePartner);
router.put('/partners/:id/reject', rejectPartner);
router.put('/users/:id/block', blockUser);
router.put('/reports/:id/review-false-report', reviewFalseReport);

// Analytics & Map
router.get('/analytics/waste-types', getAnalyticsWasteTypes);
router.get('/analytics/monthly-cleanups', getAnalyticsMonthlyCleanups);
router.get('/analytics/area-cleanliness', getAnalyticsAreaCleanliness);
router.get('/analytics/partner-performance', getAnalyticsPartnerPerformance);
router.get('/hotspots', getHotspots);

export default router;
