import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import app from '../app.js';
import User from '../models/User.model.js';
import Report from '../models/Report.model.js';
import Booking from '../models/Booking.model.js';
import ChatSession from '../models/ChatSession.model.js';
import ChatMessage from '../models/ChatMessage.model.js';
import SubscriptionPlan from '../models/SubscriptionPlan.model.js';
import Subscription from '../models/Subscription.model.js';

describe('General AI Assistant Integration Tests', () => {
  let p1Token: string;
  let p2Token: string;
  let patient1: any;
  let patient2: any;
  let mockReport: any;
  let sessionId: string;

  beforeAll(async () => {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    const patient1Email = `gp1_${Date.now()}@test.com`;
    patient1 = await User.create({
      name: 'General Patient One',
      email: patient1Email,
      passwordHash,
      phone: '+923001234567',
      role: 'patient',
      isVerified: true,
      isActive: true,
    });

    const patient2Email = `gp2_${Date.now()}@test.com`;
    patient2 = await User.create({
      name: 'General Patient Two',
      email: patient2Email,
      passwordHash,
      phone: '+923001234567',
      role: 'patient',
      isVerified: true,
      isActive: true,
    });

    // Log in
    const p1Login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: patient1Email, password: 'password123' });
    p1Token = p1Login.body.accessToken;

    const p2Login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: patient2Email, password: 'password123' });
    p2Token = p2Login.body.accessToken;

    // Create report & booking for Patient 1
    const mockBooking = await Booking.create({
      patientId: patient1._id,
      tests: [{
        testId: new mongoose.Types.ObjectId(),
        name: 'Lipid Profile',
        price: 35.00
      }],
      status: 'in_lab',
      totalAmount: 35.00,
      finalAmount: 35.00,
      homeSampling: {
        requested: false,
        address: '',
        scheduledAt: new Date(),
        assignedStaffId: null
      },
      notes: 'General AI RAG testing',
    });

    mockReport = await Report.create({
      bookingId: mockBooking._id,
      patientId: patient1._id,
      fileKey: 'reports/general-test-report.pdf',
      mimeType: 'application/pdf',
      uploadedBy: new mongoose.Types.ObjectId(),
      tags: ['lipid'],
      textContent: 'Cholesterol is 240 mg/dL (High). Triglycerides: 150 mg/dL.',
      vectorized: true,
    });

    // Subscriptions setup
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

    const activeSub1 = await Subscription.findOne({ userId: patient1._id, status: 'active' });
    if (!activeSub1) {
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

    const activeSub2 = await Subscription.findOne({ userId: patient2._id, status: 'active' });
    if (!activeSub2) {
      await Subscription.create({
        userId: patient2._id,
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

  it('Test 1: should create a new chat session for patient 1', async () => {
    const res = await request(app)
      .post('/api/v1/ai/sessions')
      .set('Authorization', `Bearer ${p1Token}`);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.session).toBeDefined();
    expect(res.body.data.session.title).toBe('New Chat');
    expect(res.body.data.session.patientId).toBe(patient1._id.toString());
    
    sessionId = res.body.data.session._id;
  });

  it('Test 2: should list chat sessions for patient 1', async () => {
    const res = await request(app)
      .get('/api/v1/ai/sessions')
      .set('Authorization', `Bearer ${p1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.sessions.length).toBeGreaterThan(0);
    const sessionIds = res.body.data.sessions.map((s: any) => s._id);
    expect(sessionIds).toContain(sessionId);
  });

  it('Test 3: should rename the chat session', async () => {
    const res = await request(app)
      .patch(`/api/v1/ai/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${p1Token}`)
      .send({ title: 'My Wellness Inquiry' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.session.title).toBe('My Wellness Inquiry');
  });

  it('Test 4: should restrict renaming session to owner only', async () => {
    const res = await request(app)
      .patch(`/api/v1/ai/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${p2Token}`)
      .send({ title: 'Hacked Title' });

    expect(res.status).toBe(403);
  });

  it('Test 5: should allow general chat streaming interaction and store message', async () => {
    const res = await request(app)
      .post('/api/v1/ai/general-chat')
      .set('Authorization', `Bearer ${p1Token}`)
      .send({ sessionId, message: 'Explain my lipid results' });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/event-stream');

    // Confirm that the user message was saved
    const userMsg = await ChatMessage.findOne({ sessionId, role: 'user' });
    expect(userMsg).toBeDefined();
    expect(userMsg?.content).toBe('Explain my lipid results');

    // Confirm assistant message was saved
    const assistantMsg = await ChatMessage.findOne({ sessionId, role: 'assistant' });
    expect(assistantMsg).toBeDefined();
    expect(assistantMsg?.content).toContain('Mocked AI response');
  });

  it('Test 6: should retrieve general chat history', async () => {
    const res = await request(app)
      .get(`/api/v1/ai/sessions/${sessionId}/history`)
      .set('Authorization', `Bearer ${p1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.messages.length).toBeGreaterThanOrEqual(2);

    const assistantHistoryMsg = res.body.data.messages.find((m: any) => m.role === 'assistant');
    expect(assistantHistoryMsg).toBeDefined();
    expect(assistantHistoryMsg.content).toBeDefined();
  });

  it('Test 7: should delete the chat session and associated messages', async () => {
    const res = await request(app)
      .delete(`/api/v1/ai/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${p1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const session = await ChatSession.findById(sessionId);
    expect(session).toBeNull();

    const messagesCount = await ChatMessage.countDocuments({ sessionId });
    expect(messagesCount).toBe(0);
  });
});
