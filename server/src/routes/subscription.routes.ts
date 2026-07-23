import { Router } from 'express';
import {
  getMySubscription,
  createSubscriptionIntent,
  confirmSubscriptionPayment,
  updateActiveFamilyMembers,
  getMySubscriptionHistory,
  cancelMySubscription,
  getAllSubscriptions,
} from '../controllers/subscription.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createSubscriptionSchema } from '../utils/validators.js';
import { resolveSubscription } from '../middleware/subscriptionResolver.middleware.js';

const router = Router();

// Patient endpoints
router.get('/me', authenticate, authorize('patient'), resolveSubscription, getMySubscription);
router.post('/create-intent', authenticate, authorize('patient'), resolveSubscription, validate(createSubscriptionSchema), createSubscriptionIntent);
router.post('/confirm-payment', authenticate, authorize('patient'), resolveSubscription, confirmSubscriptionPayment);
router.patch('/me/family-members', authenticate, authorize('patient'), resolveSubscription, updateActiveFamilyMembers);
router.get('/history', authenticate, authorize('patient'), resolveSubscription, getMySubscriptionHistory);
router.patch('/me/cancel', authenticate, authorize('patient'), resolveSubscription, cancelMySubscription);

// Admin endpoints
router.get('/', authenticate, authorize('admin'), getAllSubscriptions);

export default router;
