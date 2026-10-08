import express from 'express';
import {
    applyPartner,
    getPartners,
    updatePartnerStatus,
    getPartnerTasks,
    completePickupTask,
    getOptimizedRoute
} from '../controllers/partnerController.js';

const router = express.Router();

router.post('/apply', applyPartner);
router.get('/', getPartners);
router.put('/:id/status', updatePartnerStatus);
router.get('/tasks', getPartnerTasks);
router.post('/tasks/:id/complete', completePickupTask);
router.get('/optimized-route', getOptimizedRoute);

export default router;
