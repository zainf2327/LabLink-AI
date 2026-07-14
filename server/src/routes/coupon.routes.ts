import { Router } from 'express';
import { createCoupon, getAllCoupons, getCouponById, updateCoupon, deleteCoupon, validateCoupon } from '../controllers/coupon.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

// Apply auth to all coupon routes
router.use(authenticate);

// Patient validates coupon code during checkout
router.post('/validate', authorize('patient'), validateCoupon);

// Admin-only coupon management CRUD
router.post('/', authorize('admin'), createCoupon);
router.get('/', authorize('admin'), getAllCoupons);
router.get('/:id', authorize('admin'), getCouponById);
router.patch('/:id', authorize('admin'), updateCoupon);
router.delete('/:id', authorize('admin'), deleteCoupon);

export default router;
