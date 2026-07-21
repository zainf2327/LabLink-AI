import { Router } from 'express';
import { getAllTests, getTestById, createTest, updateTest, deactivateTest } from '../controllers/test.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createTestSchema, updateTestSchema } from '../utils/validators.js';

const router = Router();

// Publicly viewable test catalog
router.get('/', getAllTests);
router.get('/:id', getTestById);

// Admin-only management endpoints
router.post('/', authenticate, authorize('admin'), validate(createTestSchema), createTest);
router.patch('/:id', authenticate, authorize('admin'), validate(updateTestSchema), updateTest);
router.delete('/:id', authenticate, authorize('admin'), deactivateTest);

export default router;
