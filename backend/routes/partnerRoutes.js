import express from 'express';
import { getOptimizedRoute } from '../controllers/partnerController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/optimized-route', protect, authorizeRoles('partner'), getOptimizedRoute);

export default router;
