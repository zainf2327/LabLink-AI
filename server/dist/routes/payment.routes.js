import { Router } from 'express';
import { createPaymentIntent, confirmPayment, getMyBillingHistory, getAllPayments } from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
const router = Router();
// Apply auth to all payment routes
router.use(authenticate);
// Patient checkout
router.post('/create-intent', authorize('patient'), createPaymentIntent);
router.post('/confirm', authorize('patient'), confirmPayment);
router.get('/me', authorize('patient'), getMyBillingHistory);
// Admin-only review
router.get('/', authorize('admin'), getAllPayments);
export default router;
