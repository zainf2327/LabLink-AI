import { Router } from 'express';
import { getAllUsers, getUserById, updateUser, deactivateUser, updateProfile } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

// Admin-only endpoints
router.get('/', authenticate, authorize('admin'), getAllUsers);
router.get('/:id', authenticate, authorize('admin'), getUserById);
router.patch('/:id', authenticate, authorize('admin'), updateUser);
router.delete('/:id', authenticate, authorize('admin'), deactivateUser);

// Patient/Staff profile update
router.patch('/me/profile', authenticate, authorize('patient', 'staff'), updateProfile);

export default router;
