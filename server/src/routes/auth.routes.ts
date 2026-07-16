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
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authenticate, me);

// Google OAuth Authentication
router.get('/google', initiateGoogleLogin);
router.get('/google/callback', handleGoogleLoginCallback);

// Google Calendar Synchronization
router.get('/google/calendar', authenticate, initiateGoogleCalendarConnect);
router.get('/google/calendar/callback', handleGoogleCalendarCallback);
router.delete('/google/calendar', authenticate, disconnectGoogleCalendar);

export default router;
