import express from 'express';
import { handleChat } from '../controllers/chatbotController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, authorizeRoles('citizen'), handleChat);

export default router;
