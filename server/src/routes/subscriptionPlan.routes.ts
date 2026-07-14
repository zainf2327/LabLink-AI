import { Router } from 'express';
import { getAllPlans, createPlan, updatePlan, deactivatePlan } from '../controllers/subscriptionPlan.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

// Publicly viewable plans
router.get('/', getAllPlans);

// Admin-only CRUD actions
router.post('/', authenticate, authorize('admin'), createPlan);
router.patch('/:id', authenticate, authorize('admin'), updatePlan);
router.delete('/:id', authenticate, authorize('admin'), deactivatePlan);

export default router;
