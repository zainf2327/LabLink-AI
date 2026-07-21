import { Router } from 'express';
import { getMySubscription, createSubscription, cancelMySubscription, getAllSubscriptions } from '../controllers/subscription.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createSubscriptionSchema } from '../utils/validators.js';

const router = Router();

// Patient endpoints
router.get('/me', authenticate, authorize('patient'), getMySubscription);
router.post('/', authenticate, authorize('patient'), validate(createSubscriptionSchema), createSubscription);
router.patch('/me/cancel', authenticate, authorize('patient'), cancelMySubscription);

// Admin endpoints
router.get('/', authenticate, authorize('admin'), getAllSubscriptions);

export default router;
