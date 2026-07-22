import { Router } from 'express';
import { createBooking, getMyBookings, getBookingById, getAllBookings, updateBookingStatus, cancelBooking, assignStaff } from '../controllers/booking.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createBookingSchema, updateBookingStatusSchema, assignStaffSchema } from '../utils/validators.js';
const router = Router();
// Apply auth to all booking routes
router.use(authenticate);
// Patient actions
router.post('/', authorize('patient'), validate(createBookingSchema), createBooking);
router.get('/me', authorize('patient'), getMyBookings);
// Shared role read access
router.get('/:id', authorize('patient', 'staff', 'admin'), getBookingById);
// Staff/Admin actions
router.get('/', authorize('staff', 'admin'), getAllBookings);
router.patch('/:id/status', authorize('staff'), validate(updateBookingStatusSchema), updateBookingStatus);
router.patch('/:id/assign-staff', authorize('admin'), validate(assignStaffSchema), assignStaff);
// Cancellation endpoint (patient status limits enforced in logic)
router.patch('/:id/cancel', authorize('patient', 'staff', 'admin'), cancelBooking);
export default router;
