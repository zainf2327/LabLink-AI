import { Router } from 'express';
import { getAllCategories, createCategory, updateCategory, deleteCategory } from '../controllers/testCategory.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createCategorySchema, updateCategorySchema } from '../utils/validators.js';

const router = Router();

// Publicly viewable categories
router.get('/', getAllCategories);

// Admin-only CRUD actions
router.post('/', authenticate, authorize('admin'), validate(createCategorySchema), createCategory);
router.patch('/:id', authenticate, authorize('admin'), validate(updateCategorySchema), updateCategory);
router.delete('/:id', authenticate, authorize('admin'), deleteCategory);

export default router;
