import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { env } from './config/env.js';
// Middlewares
import { rateLimiter } from './middleware/rateLimiter.middleware.js';
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
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';
const app = express();
// Global Middlewares
if (env.NODE_ENV === 'production') {
    app.use(rateLimiter);
}
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
app.get('/api/v1/health', async (req, res) => {
    // 1. MongoDB Status
    let dbStatus = 'disconnected';
    try {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.db.admin().ping();
            dbStatus = 'connected';
        }
    }
    catch (err) {
        dbStatus = 'error';
    }
    // 2. Stripe Status
    let stripeStatus = 'unconfigured';
    if (env.STRIPE_SECRET_KEY) {
        try {
            const Stripe = (await import('stripe')).default;
            const stripe = new Stripe(env.STRIPE_SECRET_KEY);
            await stripe.balance.retrieve();
            stripeStatus = 'connected';
        }
        catch (err) {
            stripeStatus = 'error';
        }
    }
    // 3. Pinecone Status
    let pineconeStatus = 'unconfigured';
    if (env.PINECONE_API_KEY) {
        try {
            const { pineconeIndex } = await import('./config/pinecone.js');
            await pineconeIndex.describeIndexStats();
            pineconeStatus = 'connected';
        }
        catch (err) {
            pineconeStatus = 'error';
        }
    }
    // 4. AWS S3 Status
    let s3Status = 'unconfigured';
    if (env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.AWS_S3_BUCKET_NAME) {
        try {
            const { S3Client, ListObjectsV2Command } = await import('@aws-sdk/client-s3');
            const s3Client = new S3Client({
                region: env.AWS_REGION || 'us-east-1',
                credentials: {
                    accessKeyId: env.AWS_ACCESS_KEY_ID,
                    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
                },
            });
            await s3Client.send(new ListObjectsV2Command({
                Bucket: env.AWS_S3_BUCKET_NAME,
                MaxKeys: 1
            }));
            s3Status = 'connected';
        }
        catch (err) {
            if (err.name === 'AccessDenied') {
                // AccessDenied means credentials are valid and authenticated, but IAM policy restricts listing the bucket
                s3Status = 'connected';
            }
            else {
                s3Status = 'error';
            }
        }
    }
    // 5. Google Calendar OAuth configurations check
    let googleCalendarStatus = 'unconfigured';
    if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
        googleCalendarStatus = 'configured';
    }
    const allConnected = dbStatus === 'connected' &&
        stripeStatus === 'connected' &&
        pineconeStatus === 'connected' &&
        s3Status === 'connected';
    const configurations = {
        jwtAccessSecret: env.JWT_ACCESS_SECRET ? 'configured' : 'unconfigured',
        jwtRefreshSecret: env.JWT_REFRESH_SECRET ? 'configured' : 'unconfigured',
        groqApiKey: env.GROQ_API_KEY ? 'configured' : 'unconfigured',
        geminiApiKey: env.GEMINI_API_KEY ? 'configured' : 'unconfigured',
        encryptionKey: env.ENCRYPTION_KEY ? 'configured' : 'unconfigured',
        stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET ? 'configured' : 'unconfigured',
        awsSesFromEmail: env.AWS_SES_FROM_EMAIL ? 'configured' : 'unconfigured'
    };
    res.status(allConnected ? 200 : 207).json({
        status: allConnected ? 'ok' : 'degraded',
        version: 'v1',
        timestamp: new Date().toISOString(),
        services: {
            db: dbStatus,
            stripe: stripeStatus,
            pinecone: pineconeStatus,
            s3: s3Status,
            googleCalendar: googleCalendarStatus
        },
        configurations
    });
});
// Mount Routes
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
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
