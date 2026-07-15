import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').max(50, 'Name must not exceed 50 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const createCategorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters long').max(50, 'Category name must not exceed 50 characters'),
  description: z.string().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const createTestSchema = z.object({
  name: z.string().min(2, 'Test name must be at least 2 characters long').max(100, 'Test name must not exceed 100 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters long'),
  type: z.enum(['lab', 'radiology']),
  categoryId: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), { message: 'Invalid Category ID' }),
  price: z.number().min(0, 'Price must be a positive number'),
  preparationInstructions: z.string().optional(),
  duration: z.string().min(1, 'Duration turnaround description is required'),
  isHomeCollectionAvailable: z.boolean().optional(),
});

export const updateTestSchema = createTestSchema.partial().extend({
  isActive: z.boolean().optional(),
});
