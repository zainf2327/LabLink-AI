import { Router } from 'express';
import { getWalletBalance, getWalletTransactions } from '../controllers/walletTransaction.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

// All wallet routes require authentication
router.use(authenticate);

// Patient wallet endpoints (read-only)
router.get('/balance', authorize('patient'), getWalletBalance);
router.get('/transactions', authorize('patient'), getWalletTransactions);

export default router;
