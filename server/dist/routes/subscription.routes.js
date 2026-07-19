import { Router } from 'express';
import { getMySubscription, createSubscription, cancelMySubscription, getAllSubscriptions } from '../controllers/subscription.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
const router = Router();
// Patient endpoints
router.get('/me', authenticate, authorize('patient'), getMySubscription);
router.post('/', authenticate, authorize('patient'), createSubscription);
router.patch('/me/cancel', authenticate, authorize('patient'), cancelMySubscription);
// Admin endpoints
router.get('/', authenticate, authorize('admin'), getAllSubscriptions);
export default router;
