import { Router } from 'express';
import { getOverview, getBookingsTrends, getRevenueTrends, getTopTests } from '../controllers/analytics.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
const router = Router();
// Admin-only business analytics
router.use(authenticate, authorize('admin'));
router.get('/overview', getOverview);
router.get('/bookings', getBookingsTrends);
router.get('/revenue', getRevenueTrends);
router.get('/top-tests', getTopTests);
export default router;
