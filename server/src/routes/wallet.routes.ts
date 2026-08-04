import { Router } from 'express';
import {
  getWalletBalance,
  getWalletTransactions,
  createTopUpIntent,
  confirmTopUp,
} from '../controllers/walletTransaction.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { topUpWalletSchema, confirmTopUpSchema } from '../utils/validators.js';

const router = Router();

// All wallet routes require authentication
router.use(authenticate);

// Patient wallet endpoints (read-only)
router.get('/balance', authorize('patient'), getWalletBalance);
router.get('/transactions', authorize('patient'), getWalletTransactions);

// Patient top-up flow (Stripe create-intent → confirm)
router.post('/topup/intent', authorize('patient'), validate(topUpWalletSchema), createTopUpIntent);
router.post('/topup/confirm', authorize('patient'), validate(confirmTopUpSchema), confirmTopUp);

export default router;
