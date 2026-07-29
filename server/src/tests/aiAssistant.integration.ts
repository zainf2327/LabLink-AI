import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import app from '../app.js';
import User from '../models/User.model.js';
import Report from '../models/Report.model.js';
import Booking from '../models/Booking.model.js';
import ChatMessage from '../models/ChatMessage.model.js';
import SubscriptionPlan from '../models/SubscriptionPlan.model.js';
import Subscription from '../models/Subscription.model.js';

describe('AI Assistant Integration Tests', () => {
  let p1Token: string;
  let p2Token: string;
  let staffToken: string;
  let patient1: any;
  let patient2: any;
  let staff: any;
  let mockBooking: any;
  let mockReport: any;

  beforeAll(async () => {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    // Create Patient 1, Patient 2, and Staff users
    const patient1Email = `p1_${Date.now()}@test.com`;
    patient1 = await User.create({
      name: 'Patient One',
      email: patient1Email,
      passwordHash,
      phone: '+923001234567',
      role: 'patient',
      isVerified: true,
      isActive: true,
    });

    const patient2Email = `p2_${Date.now()}@test.com`;
    patient2 = await User.create({
      name: 'Patient Two',
      email: patient2Email,
      passwordHash,
      phone: '+923001234567',
      role: 'patient',
      isVerified: true,
      isActive: true,
    });

    const staffEmail = `staff_${Date.now()}@test.com`;
    staff = await User.create({
      name: 'Staff User',
      email: staffEmail,
      passwordHash,
      phone: '+923001234567',
      role: 'staff',
      isVerified: true,
      isActive: true,
    });

    // Log in all users
    const p1Login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: patient1Email, password: 'password123' });
    p1Token = p1Login.body.accessToken;

    const p2Login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: patient2Email, password: 'password123' });
    p2Token = p2Login.body.accessToken;

    const staffLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: staffEmail, password: 'password123' });
    staffToken = staffLogin.body.accessToken;

    // Create mock booking and report
    mockBooking = await Booking.create({
      patientId: patient1._id,
      tests: [{
        testId: new mongoose.Types.ObjectId(),
        name: 'Hemoglobin A1C',
        price: 29.99
      }],
      status: 'in_lab',
      totalAmount: 29.99,
      finalAmount: 29.99,
      homeSampling: {
        requested: false,
        address: '',
        scheduledAt: new Date(),
        assignedStaffId: null
      },
      notes: 'Integration test booking',
    });

    mockReport = await Report.create({
      bookingId: mockBooking._id,
      patientId: patient1._id,
      fileUrl: 'https://lablink-reports.s3.amazonaws.com/test-report.pdf',
      fileKey: 'reports/test-report.pdf',
      mimeType: 'application/pdf',
      uploadedBy: staff._id,
      tags: ['blood'],
      textContent: 'Patient Hemoglobin level is 14.5 g/dL. Glucose level is 95 mg/dL.',
      vectorized: true,
      summary: 'Your blood test shows normal hemoglobin (14.5 g/dL) and glucose (95 mg/dL) levels.',
      summaryGeneratedAt: new Date(),
    });

    // Get or Create Subscription Plan & Subscription for Patient 1 to allow chat
    let freePlan = await SubscriptionPlan.findOne({ name: 'Free' });
    if (!freePlan) {
      freePlan = await SubscriptionPlan.create({
        name: 'Free',
        price: 0,
        maxFamilyMembers: 0,
        features: ['Single user dashboard'],
        isActive: true,
        durationMonths: null,
        isDefault: true,
        testDiscountPercent: 0,
        freeHomeCollections: false,
        aiQuestionsPerMonth: 5,
      });
    }

    let activeSub = await Subscription.findOne({ userId: patient1._id, status: 'active' });
    if (!activeSub) {
      await Subscription.create({
        userId: patient1._id,
        planId: freePlan._id,
        status: 'active',
        startDate: new Date(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        planSnapshot: {
          name: freePlan.name,
          price: freePlan.price,
          durationMonths: null,
          testDiscountPercent: 0,
          freeHomeCollections: false,
          aiQuestionsPerMonth: 5,
          maxFamilyMembers: 0,
        },
      });
    }
  });

  it('Test 1: should return summary in detail view but exclude textContent/summary in reports list view', async () => {
    // List view
    const getReportsRes = await request(app)
      .get('/api/v1/reports/me')
      .set('Authorization', `Bearer ${p1Token}`);

    expect(getReportsRes.status).toBe(200);
    expect(getReportsRes.body.success).toBe(true);
    
    const reportInList = getReportsRes.body.data.reports.find((r: any) => r._id === mockReport._id.toString());
    expect(reportInList).toBeDefined();
    expect(reportInList.summary).toBeUndefined();
    expect(reportInList.textContent).toBeUndefined();

    // Detail view
    const getDetailRes = await request(app)
      .get(`/api/v1/reports/${mockReport._id}`)
      .set('Authorization', `Bearer ${p1Token}`);

    expect(getDetailRes.status).toBe(200);
    expect(getDetailRes.body.success).toBe(true);
    expect(getDetailRes.body.data.report.summary).toBe(mockReport.summary);
  });

  it('Test 2: should restrict chat history to the report owner and return 403 for other patients', async () => {
    // P1 (Owner) chat history
    const historyRes = await request(app)
      .get(`/api/v1/ai/chat/history?reportId=${mockReport._id}`)
      .set('Authorization', `Bearer ${p1Token}`);

    expect(historyRes.status).toBe(200);
    expect(historyRes.body.success).toBe(true);
    expect(historyRes.body.data.messages).toHaveLength(0);

    // P2 (Non-owner) chat history
    const historyP2Res = await request(app)
      .get(`/api/v1/ai/chat/history?reportId=${mockReport._id}`)
      .set('Authorization', `Bearer ${p2Token}`);

    expect(historyP2Res.status).toBe(403);
  });

  it('Test 3: should restrict posting chat messages to the report owner', async () => {
    // P2 tries to post chat on P1's report (fails)
    const chatP2Res = await request(app)
      .post('/api/v1/ai/chat')
      .set('Authorization', `Bearer ${p2Token}`)
      .send({ message: 'What was my glucose?', reportId: mockReport._id });

    expect(chatP2Res.status).toBe(403);
  });

  it('Test 4: should validate payload and return 400 if message or reportId is missing', async () => {
    const chatInvalidRes = await request(app)
      .post('/api/v1/ai/chat')
      .set('Authorization', `Bearer ${p1Token}`)
      .send({ message: 'Missing reportId' });

    expect(chatInvalidRes.status).toBe(400);
  });

  it('Test 5: should enforce monthly AI query limits based on subscription tier', async () => {
    // Set patient 1's subscription limit to 2
    await Subscription.updateOne(
      { userId: patient1._id, status: 'active' },
      { 'planSnapshot.aiQuestionsPerMonth': 2 }
    );

    // Clear any previous chat messages
    await ChatMessage.deleteMany({ patientId: patient1._id });

    // Send 1st chat message (succeeds)
    const chatMsg1Res = await request(app)
      .post('/api/v1/ai/chat')
      .set('Authorization', `Bearer ${p1Token}`)
      .send({ message: 'What was my hemoglobin level?', reportId: mockReport._id });
    expect(chatMsg1Res.status).toBe(200);

    // Send 2nd chat message (succeeds)
    const chatMsg2Res = await request(app)
      .post('/api/v1/ai/chat')
      .set('Authorization', `Bearer ${p1Token}`)
      .send({ message: 'Is my glucose normal?', reportId: mockReport._id });
    expect(chatMsg2Res.status).toBe(200);

    // Send 3rd chat message (fails, exceeded limit of 2)
    const chatMsg3Res = await request(app)
      .post('/api/v1/ai/chat')
      .set('Authorization', `Bearer ${p1Token}`)
      .send({ message: 'Can you tell me more about it?', reportId: mockReport._id });
    
    expect(chatMsg3Res.status).toBe(403);
    expect(chatMsg3Res.body.message).toContain('reached your monthly limit');
  });
});
