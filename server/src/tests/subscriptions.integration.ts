import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Stripe from 'stripe';
import app from '../app.js';
import User from '../models/User.model.js';
import SubscriptionPlan from '../models/SubscriptionPlan.model.js';
import Subscription from '../models/Subscription.model.js';
import FamilyMember from '../models/FamilyMember.model.js';
import Booking from '../models/Booking.model.js';
import AuditLog from '../models/AuditLog.model.js';
import Test from '../models/Test.model.js';
import Coupon from '../models/Coupon.model.js';

describe('Subscription Integration Tests', () => {
  let adminToken: string;
  let patientToken: string;
  let patientUser: any;
  let planId: string;
  let planName: string;
  let familyMember1Id: string;
  let familyMember2Id: string;
  let subId: string;

  beforeAll(async () => {
    // Create Admin User
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);
    await User.create({
      name: 'Test Admin',
      email: 'admin@lablink.com',
      passwordHash,
      phone: '+923001234567',
      role: 'admin',
      isVerified: true,
      isActive: true,
    });

    // Create Patient User
    const patientEmail = `patient_${Date.now()}@test.com`;
    patientUser = await User.create({
      name: 'Test Patient',
      email: patientEmail,
      passwordHash,
      phone: '+923001234567',
      role: 'patient',
      isVerified: true,
      isActive: true,
    });

    // Log in both
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@lablink.com', password: 'password123' });
    adminToken = adminLogin.body.accessToken;

    const patientLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: patientEmail, password: 'password123' });
    patientToken = patientLogin.body.accessToken;
  });

  it('should automatically assign default Free subscription on registration', async () => {
    const initialSub = await Subscription.findOne({ userId: patientUser._id, status: 'active' }).populate('planId');
    expect(initialSub).toBeDefined();
    expect((initialSub!.planId as any).name).toBe('Free');
  });

  it('should allow admin to create a new subscription plan', async () => {
    planName = `Gold Test Plan ${Date.now()}`;
    const createPlanRes = await request(app)
      .post('/api/v1/subscription-plans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: planName,
        price: 49.99,
        maxFamilyMembers: 2,
        features: ['Unlimited Lab Tests', 'Free Home Sampling'],
      });

    expect(createPlanRes.status).toBe(201);
    expect(createPlanRes.body.success).toBe(true);
    planId = createPlanRes.body.plan._id;

    // Verify Audit Log
    const createAudit = await AuditLog.findOne({ action: 'CREATE_SUB_PLAN', targetId: planId });
    expect(createAudit).toBeDefined();
  });

  it('should fail when patient tries to add a family member on the Free plan (limit 0)', async () => {
    const addFamilyFailRes = await request(app)
      .post('/api/v1/family-members')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        name: 'Family Member 1',
        dateOfBirth: '1990-01-01',
        relationship: 'spouse',
        gender: 'female',
      });

    expect(addFamilyFailRes.status).toBe(403);
  });

  it('should allow patient to initiate and purchase a premium subscription plan', async () => {
    // Initiate intent
    const intentRes = await request(app)
      .post('/api/v1/subscriptions/create-intent')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ planId });

    expect(intentRes.status).toBe(200);
    expect(intentRes.body.success).toBe(true);
    const paymentIntentId = intentRes.body.data.stripePaymentIntentId;

    // Confirm payment directly with Stripe SDK (mocked in setup.ts)
    const stripe = new Stripe('sk_test_dummy');
    await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: 'pm_card_visa',
      return_url: 'http://localhost:5001/api/health',
    });

    // Confirm payment on backend
    const confirmRes = await request(app)
      .post('/api/v1/subscriptions/confirm-payment')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ paymentIntentId });

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.success).toBe(true);
    subId = confirmRes.body.subscription._id;

    // Verify Audit Log
    const subAudit = await AuditLog.findOne({
      action: { $in: ['PURCHASE_SUBSCRIPTION', 'UPGRADE_SUBSCRIPTION'] },
      targetId: subId,
    });
    expect(subAudit).toBeDefined();
  });

  it('should allow family member addition under premium subscription limits', async () => {
    // Add Member 1
    const addFamily1Res = await request(app)
      .post('/api/v1/family-members')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        name: 'Jane Doe',
        dateOfBirth: '1992-05-15',
        relationship: 'spouse',
        gender: 'female',
      });

    expect(addFamily1Res.status).toBe(201);
    expect(addFamily1Res.body.success).toBe(true);
    familyMember1Id = addFamily1Res.body.familyMember._id;

    // Add Member 2
    const addFamily2Res = await request(app)
      .post('/api/v1/family-members')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        name: 'Baby Doe',
        dateOfBirth: '2020-10-10',
        relationship: 'child',
        gender: 'other',
      });

    expect(addFamily2Res.status).toBe(201);
    expect(addFamily2Res.body.success).toBe(true);
    familyMember2Id = addFamily2Res.body.familyMember._id;

    // Add Member 3 (fails due to max limit of 2)
    const addFamily3Res = await request(app)
      .post('/api/v1/family-members')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        name: 'Parent Doe',
        dateOfBirth: '1965-08-20',
        relationship: 'parent',
        gender: 'male',
      });

    expect(addFamily3Res.status).toBe(403);
  });

  it('should handle on-demand subscription expiry and degrade plan to Free', async () => {
    // Expire subscription in past
    await Subscription.updateOne({ _id: subId }, { expiryDate: new Date(Date.now() - 1000) });

    // Fetch subscription
    const getSubMeRes = await request(app)
      .get('/api/v1/subscriptions/me')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(getSubMeRes.status).toBe(200);
    expect(getSubMeRes.body.success).toBe(true);
    expect(getSubMeRes.body.subscription.planSnapshot.name).toBe('Free');

    // Verify Audit Log
    const expiryAudit = await AuditLog.findOne({ action: 'EXPIRE_SUBSCRIPTION', actorId: patientUser._id });
    expect(expiryAudit).toBeDefined();
  });

  it('should enforce locking/deleting rules on Free plan (locked members)', async () => {
    // Edit locked family member (fails)
    const editLockedRes = await request(app)
      .patch(`/api/v1/family-members/${familyMember1Id}`)
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ name: 'Jane Doe Updated' });

    expect(editLockedRes.status).toBe(403);

    // Delete locked member without history (succeeds)
    const deleteLockedRes = await request(app)
      .delete(`/api/v1/family-members/${familyMember1Id}`)
      .set('Authorization', `Bearer ${patientToken}`);

    expect(deleteLockedRes.status).toBe(200);
  });

  it('should apply combined subscription discounts and coupon calculation on booking creation', async () => {
    // Create test
    const dummyTest = await Test.create({
      name: `Test for Discount ${Date.now()}`,
      description: 'A test description',
      type: 'lab',
      categoryId: new mongoose.Types.ObjectId(),
      price: 100,
      duration: '24h',
      isHomeCollectionAvailable: true,
      isActive: true,
    });

    // 1) Set 20% discount on patient's active subscription
    await Subscription.updateOne(
      { userId: patientUser._id, status: 'active' },
      { 'planSnapshot.testDiscountPercent': 20 }
    );

    // Test booking with discount only (100 -> 80)
    const booking1Res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        tests: [dummyTest._id.toString()],
        homeSampling: {
          requested: false,
          scheduledAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        },
      });

    expect(booking1Res.status).toBe(201);
    expect(booking1Res.body.success).toBe(true);
    expect(booking1Res.body.data.booking.discountAmount).toBe(20);
    expect(booking1Res.body.data.booking.finalAmount).toBe(80);

    // 2) Test booking with subscription discount (20%) + coupon discount (10%)
    const couponCode = `TESTSUB${Date.now()}`;
    await Coupon.create({
      code: couponCode,
      discountType: 'percentage',
      discountValue: 10,
      isActive: true,
    });

    const booking2Res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        tests: [dummyTest._id.toString()],
        couponCode: couponCode,
        homeSampling: {
          requested: false,
          scheduledAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        },
      });

    expect(booking2Res.status).toBe(201);
    expect(booking2Res.body.success).toBe(true);
    expect(booking2Res.body.data.booking.discountAmount).toBe(28); // 20 sub discount + 8 coupon discount (10% of 80)
    expect(booking2Res.body.data.booking.finalAmount).toBe(72);
  });
});
