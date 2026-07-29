import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deactivateUser,
  updateProfile,
  getStaffUsers,
  updateStaffRegions,
  createStaff,
  resetStaffPassword,
} from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { updateStaffRegionsSchema, createStaffSchema } from '../utils/validators.js';

const router = Router();

// Staff-listing endpoint for dropdowns (accessible by staff & admin)
router.get('/staff', authenticate, authorize('staff', 'admin'), getStaffUsers);

// Admin-only endpoints
router.post('/staff', authenticate, authorize('admin'), validate(createStaffSchema), createStaff);
router.post('/staff/:id/reset-password', authenticate, authorize('admin'), resetStaffPassword);
router.get('/', authenticate, authorize('admin'), getAllUsers);
router.get('/:id', authenticate, authorize('admin'), getUserById);
router.patch('/:id/regions', authenticate, authorize('admin'), validate(updateStaffRegionsSchema), updateStaffRegions);
router.patch('/:id', authenticate, authorize('admin'), updateUser);
router.delete('/:id', authenticate, authorize('admin'), deactivateUser);

// Patient/Staff profile update
router.patch('/me/profile', authenticate, authorize('patient', 'staff'), updateProfile);

export default router;
