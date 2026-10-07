import express from 'express';
import { getShopItems, buyItem, getMyPurchases, addShopItem, deleteShopItem } from '../controllers/shopController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getShopItems);
router.get('/my-purchases', protect, authorizeRoles('citizen'), getMyPurchases);
router.post('/buy/:id', protect, authorizeRoles('citizen'), buyItem);
router.post('/', protect, authorizeRoles('admin'), addShopItem);
router.delete('/:id', protect, authorizeRoles('admin'), deleteShopItem);

export default router;
