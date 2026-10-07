import express from 'express';
import { getLeaderboard } from '../controllers/leaderboardController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Both citizens and admins can view the leaderboard
router.get('/', protect, authorizeRoles('citizen', 'admin'), getLeaderboard);

export default router;
