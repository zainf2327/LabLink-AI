import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditLog.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

// Admin-only audit log browsing
router.get('/', authenticate, authorize('admin'), getAuditLogs);

export default router;
