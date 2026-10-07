import express from 'express';
import { registerCitizen, registerPartner, registerAdmin, registerUser, loginUser, getUserProfile, deleteAccount } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);           // Unified — dispatches by role
router.post('/register-citizen', registerCitizen);
router.post('/register-partner', registerPartner);
router.post('/register-admin', registerAdmin);    // Secure admin registration with code
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.delete('/delete-account', protect, deleteAccount);

export default router;
