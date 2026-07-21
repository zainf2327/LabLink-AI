import { Router } from 'express';
import {
  register,
  login,
  refresh,
  logout,
  me,
  initiateGoogleLogin,
  handleGoogleLoginCallback,
  initiateGoogleCalendarConnect,
  handleGoogleCalendarCallback,
  disconnectGoogleCalendar,
  verifyEmail,
  resendVerificationCode,
  forgotPassword,
  resetPassword,
  setPassword,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  setPasswordSchema,
} from '../utils/validators.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authenticate, me);

// Email Verification & Password Recovery
router.post('/verify-email', validate(verifyEmailSchema), verifyEmail);
router.post('/resend-verification', validate(resendVerificationSchema), resendVerificationCode);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.post('/set-password', authenticate, validate(setPasswordSchema), setPassword);

// Google OAuth Authentication
router.get('/google', initiateGoogleLogin);
router.get('/google/callback', handleGoogleLoginCallback);

// Google Calendar Synchronization
router.get('/google/calendar', authenticate, initiateGoogleCalendarConnect);
router.get('/google/calendar/callback', handleGoogleCalendarCallback);
router.delete('/google/calendar', authenticate, disconnectGoogleCalendar);

export default router;
