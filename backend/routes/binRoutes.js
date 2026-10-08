import express from 'express';
import { getBins, verifyBin, confirmPickup, getPickupRequests, updateRequestStatus } from '../controllers/binController.js';

const router = express.Router();

router.get('/', getBins);
router.put('/:id/verify', verifyBin);
router.post('/:id/confirm-pickup', confirmPickup);
router.get('/requests', getPickupRequests);
router.put('/requests/:id/status', updateRequestStatus);

export default router;
