import asyncHandler from '../utils/asyncHandler.js';
import Payment from '../models/Payment.model.js';
import { paymentService } from '../services/payment.service.js';
export const createPaymentIntent = asyncHandler(async (req, res) => {
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
    }
    const validated = req.body;
    const result = await paymentService.createPaymentIntent(req.user.id, validated.bookingId);
    res.status(200).json({
        success: true,
        data: result,
    });
});
export const confirmPayment = asyncHandler(async (req, res) => {
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
    }
    const validated = req.body;
    const booking = await paymentService.confirmPayment(req.user.id, validated.paymentIntentId);
    res.status(200).json({
        success: true,
        message: 'Payment confirmed and booking scheduled',
        data: { booking },
    });
});
export const getMyBillingHistory = asyncHandler(async (req, res) => {
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const total = await Payment.countDocuments({ patientId: req.user.id });
    const payments = await Payment.find({ patientId: req.user.id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('bookingId');
    res.status(200).json({
        success: true,
        data: {
            payments,
            pagination: {
                page,
                limit,
                total,
            },
        },
    });
});
export const getAllPayments = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const total = await Payment.countDocuments();
    const payments = await Payment.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('patientId', 'name email')
        .populate('bookingId');
    res.status(200).json({
        success: true,
        data: {
            payments,
            pagination: {
                page,
                limit,
                total,
            },
        },
    });
});
