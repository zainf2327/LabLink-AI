import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dns from 'dns';
import User from '../models/User.model.js';
import SubscriptionPlan from '../models/SubscriptionPlan.model.js';
import Subscription from '../models/Subscription.model.js';
import FamilyMember from '../models/FamilyMember.model.js';
import AuditLog from '../models/AuditLog.model.js';
import { env } from '../config/env.js';

dns.setServers(['8.8.8.8', '1.1.1.1']);

const MONGODB_URI = env.MONGODB_URI;
const API_URL = `http://localhost:${env.PORT}/api/v1`;

async function runTests() {
  console.log('--- STARTING SUBSCRIPTION INTEGRATION TESTS ---');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to Database.');

  // Create or verify Admin in DB
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);
  let admin = await User.findOne({ email: 'admin@lablink.com' });
  if (!admin) {
    admin = await User.create({
      name: 'Test Admin',
      email: 'admin@lablink.com',
      passwordHash,
      role: 'admin',
      isVerified: true,
      isActive: true,
    });
  }

  // Create Patient directly in DB
  const patientEmail = `patient_${Date.now()}@test.com`;
  const patient = await User.create({
    name: 'Test Patient',
    email: patientEmail,
    passwordHash,
    role: 'patient',
    isVerified: true,
    isActive: true,
  });
  console.log(`Created Patient user: ${patientEmail}`);

  // 1. Log in via API to get tokens
  const adminLoginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@lablink.com', password: 'password123' }),
  });
  const adminLogin = await adminLoginRes.json() as any;
  if (!adminLogin.success) throw new Error('Admin login failed: ' + adminLogin.message);
  const adminToken = adminLogin.accessToken;

  const patientLoginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: patientEmail, password: 'password123' }),
  });
  const patientLogin = await patientLoginRes.json() as any;
  if (!patientLogin.success) throw new Error('Patient login failed: ' + patientLogin.message);
  const patientToken = patientLogin.accessToken;
  console.log('Logged in both Admin and Patient.');

  // 2. Admin creates a new plan
  const planName = `Gold Test Plan ${Date.now()}`;
  const createPlanRes = await fetch(`${API_URL}/subscription-plans`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name: planName,
      price: 49.99,
      maxFamilyMembers: 2,
      features: ['Unlimited Lab Tests', 'Free Home Sampling'],
    }),
  });
  const createPlanData = await createPlanRes.json() as any;
  if (!createPlanData.success) throw new Error('Plan creation failed: ' + createPlanData.message);
  const planId = createPlanData.plan._id;
  console.log(`Admin created plan: ${planName} (${planId})`);

  // Verify Audit Log for Plan Creation
  const createAudit = await AuditLog.findOne({ action: 'CREATE_SUB_PLAN', targetId: planId });
  if (!createAudit) throw new Error('Audit log for plan creation not found');
  console.log('Verified CREATE_SUB_PLAN audit log.');

  // 3. Patient tries to add a family member (should fail - no subscription)
  const addFamilyFailRes = await fetch(`${API_URL}/family-members`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${patientToken}`,
    },
    body: JSON.stringify({
      name: 'Family Member 1',
      dateOfBirth: '1990-01-01',
      relationship: 'spouse',
      gender: 'female',
    }),
  });
  if (addFamilyFailRes.status !== 403) {
    throw new Error('Adding family member without subscription should have returned 403, got: ' + addFamilyFailRes.status);
  }
  console.log('Correctly rejected family member addition without active subscription.');

  // 4. Patient subscribes to plan
  const subscribeRes = await fetch(`${API_URL}/subscriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${patientToken}`,
    },
    body: JSON.stringify({ planId }),
  });
  const subscribeData = await subscribeRes.json() as any;
  if (!subscribeData.success) throw new Error('Subscription failed: ' + subscribeData.message);
  const subId = subscribeData.subscription._id;
  console.log(`Patient subscribed to: ${planName} (${subId})`);

  // Verify Audit Log for Subscription
  const subAudit = await AuditLog.findOne({ action: 'CREATE_SUBSCRIPTION', targetId: subId });
  if (!subAudit) throw new Error('Audit log for subscription creation not found');
  console.log('Verified CREATE_SUBSCRIPTION audit log.');

  // 5. Patient adds family member 1 (should succeed)
  const addFamily1Res = await fetch(`${API_URL}/family-members`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${patientToken}`,
    },
    body: JSON.stringify({
      name: 'Jane Doe',
      dateOfBirth: '1992-05-15',
      relationship: 'spouse',
      gender: 'female',
    }),
  });
  const addFamily1 = await addFamily1Res.json() as any;
  if (!addFamily1.success) throw new Error('Adding family member 1 failed: ' + addFamily1.message);
  console.log('Successfully added Family Member 1 (Jane Doe).');

  // 6. Patient adds family member 2 (should succeed)
  const addFamily2Res = await fetch(`${API_URL}/family-members`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${patientToken}`,
    },
    body: JSON.stringify({
      name: 'Baby Doe',
      dateOfBirth: '2020-10-10',
      relationship: 'child',
      gender: 'other',
    }),
  });
  const addFamily2 = await addFamily2Res.json() as any;
  if (!addFamily2.success) throw new Error('Adding family member 2 failed: ' + addFamily2.message);
  console.log('Successfully added Family Member 2 (Baby Doe).');

  // 7. Patient adds family member 3 (should fail - max family members is 2)
  const addFamily3Res = await fetch(`${API_URL}/family-members`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${patientToken}`,
    },
    body: JSON.stringify({
      name: 'Parent Doe',
      dateOfBirth: '1965-08-20',
      relationship: 'parent',
      gender: 'male',
    }),
  });
  if (addFamily3Res.status !== 403) {
    throw new Error('Adding family member 3 should have returned 403, got: ' + addFamily3Res.status);
  }
  console.log('Correctly rejected family member addition because active plan limit was reached.');

  // 8. Patient cancels subscription
  const cancelRes = await fetch(`${API_URL}/subscriptions/me/cancel`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${patientToken}` },
  });
  const cancelData = await cancelRes.json() as any;
  if (!cancelData.success) throw new Error('Subscription cancellation failed: ' + cancelData.message);
  console.log('Successfully cancelled subscription.');

  // Verify Audit Log for Cancellation
  const cancelAudit = await AuditLog.findOne({ action: 'CANCEL_SUBSCRIPTION', targetId: subId });
  if (!cancelAudit) throw new Error('Audit log for subscription cancellation not found');
  console.log('Verified CANCEL_SUBSCRIPTION audit log.');

  // 9. Clean up test data from DB
  await User.deleteOne({ _id: patient._id });
  await SubscriptionPlan.deleteOne({ _id: planId });
  await Subscription.deleteMany({ userId: patient._id });
  await FamilyMember.deleteMany({ userId: patient._id });
  console.log('Cleaned up integration test records.');

  console.log('--- ALL INTEGRATION TESTS PASSED SUCCESSFULLY! ---');
  await mongoose.disconnect();
  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ INTEGRATION TEST FAILED:', err);
  mongoose.disconnect();
  process.exit(1);
});
