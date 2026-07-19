import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { errorHandler } from './middleware/errorHandler.middleware.js';
// Route Imports
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import familyMemberRoutes from './routes/familyMember.routes.js';
import subscriptionPlanRoutes from './routes/subscriptionPlan.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';
import testCategoryRoutes from './routes/testCategory.routes.js';
import testRoutes from './routes/test.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import reportRoutes from './routes/report.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import couponRoutes from './routes/coupon.routes.js';
import aiRoutes from './routes/ai.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import auditLogRoutes from './routes/auditLog.routes.js';
import webhookRoutes from './routes/webhook.routes.js';
import walletRoutes from './routes/wallet.routes.js';
const app = express();
// Global Middlewares
//app.use(rateLimiter);
app.use(cors({
    origin: true, // Allow all origins for development, adjust as needed
    credentials: true
}));
// Mount Webhook route BEFORE express.json() because Stripe requires raw body
app.use('/api/v1/webhooks', webhookRoutes);
app.use(express.json());
app.use(cookieParser());
// Legacy/Basic Health Check Route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'LabLink AI backend is running' });
});
// Versioned Health Check Route
app.get('/api/v1/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({
        status: 'ok',
        version: 'v1',
        db: dbStatus
    });
});
// Mount Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/family-members', familyMemberRoutes);
app.use('/api/v1/subscription-plans', subscriptionPlanRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/test-categories', testCategoryRoutes);
app.use('/api/v1/tests', testRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/coupons', couponRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/audit-logs', auditLogRoutes);
app.use('/api/v1/wallet', walletRoutes);
// 404 handler for unknown routes
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});
// Centralized error handler (must be last)
app.use(errorHandler);
export default app;
