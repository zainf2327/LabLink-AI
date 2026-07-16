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

export const createCouponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required'),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().min(0, 'Discount value must be a non-negative number'),
  minOrderValue: z.number().min(0, 'Minimum order value must be a non-negative number').nullable().optional(),
  maxUses: z.number().int().min(0, 'Max uses must be a non-negative integer').nullable().optional(),
  expiresAt: z.coerce.date().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const updateCouponSchema = createCouponSchema.partial();

export const validateCouponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required'),
  totalAmount: z.number().min(0, 'Total amount must be a non-negative number'),
});

export const createBookingSchema = z.object({
  forMemberId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid family member ID').nullable().optional(),
  tests: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid test ID')).min(1, 'Booking must contain at least one test'),
  couponCode: z.string().nullable().optional(),
  homeSampling: z.object({
    requested: z.boolean(),
    address: z.string().optional(),
    scheduledAt: z.string().optional(),
  }).optional(),
  notes: z.string().optional(),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum([
    'pending_payment',
    'scheduled',
    'sample_collected',
    'in_lab',
    'report_ready',
    'completed',
    'cancelled',
  ], {
    message: 'Invalid booking status',
  }),
});

export const assignStaffSchema = z.object({
  assignedStaffId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid staff ID').nullable().optional(),
});

export const createPaymentIntentSchema = z.object({
  bookingId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid booking ID'),
});

export const confirmPaymentSchema = z.object({
  paymentIntentId: z.string().min(1, 'paymentIntentId is required'),
});

