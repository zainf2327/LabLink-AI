import { Router } from 'express';
import { getAllRegions, createRegion, updateRegion, deactivateRegion } from '../controllers/region.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createRegionSchema, updateRegionSchema } from '../utils/validators.js';

const router = Router();

// Publicly viewable list of regions (restricted to active ones unless admin)
router.get('/', getAllRegions);

// Admin-only management endpoints
router.post('/', authenticate, authorize('admin'), validate(createRegionSchema), createRegion);
router.patch('/:id', authenticate, authorize('admin'), validate(updateRegionSchema), updateRegion);
router.delete('/:id', authenticate, authorize('admin'), deactivateRegion);

export default router;
