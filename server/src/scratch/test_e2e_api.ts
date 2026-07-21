import mongoose from 'mongoose';
import { env } from '../config/env.js';
import User from '../models/User.model.js';
import Stripe from 'stripe';
import Test from '../models/Test.model.js';
import TestCategory from '../models/TestCategory.model.js';
import Coupon from '../models/Coupon.model.js';
import FamilyMember from '../models/FamilyMember.model.js';
import SubscriptionPlan from '../models/SubscriptionPlan.model.js';
import Subscription from '../models/Subscription.model.js';
import Booking from '../models/Booking.model.js';
import Payment from '../models/Payment.model.js';

import dns from 'dns';

dns.setServers(['8.8.8.8', '1.1.1.1']);

// Setup colors for console logs
const green = '\x1b[32m';
const red = '\x1b[31m';
const yellow = '\x1b[33m';
const cyan = '\x1b[36m';
const reset = '\x1b[0m';

const BASE_URL = `http://localhost:${env.PORT}/api/v1`;

async function runTests() {
  console.log(`${cyan}=== Starting LabLink AI Feature 4 Booking Flow E2E Tests ===${reset}\n`);

  // 1. Connect directly to Database for cleanup & seeding
  await mongoose.connect(env.MONGODB_URI);
  console.log('Connected to MongoDB for seeding');

  // Cleanup existing test data
  console.log('Cleaning up existing test data...');
  const testEmail = 'jane.doe.test@example.com';
  await User.deleteMany({ email: testEmail });
  await TestCategory.deleteMany({ name: 'General Health Test Category' });
  await Test.deleteMany({ name: { $in: ['Test A (CBC)', 'Test B (MRI Brain)'] } });
  await Coupon.deleteMany({ code: { $in: ['SAVE10', 'FREEBIE', 'EXPIRED', 'MAXED'] } });
  await SubscriptionPlan.deleteMany({ name: 'Premium Plan' });
  await Booking.deleteMany({ notes: { $regex: /TEST_SCENARIO/ } });

  // Seed Subscription Plan
  const plan = new SubscriptionPlan({
    name: 'Premium Plan',
    price: 20,
    maxFamilyMembers: 3,
    features: ['Unlimited reports', 'Up to 3 family members'],
    isActive: true,
  });
  await plan.save();

  // Seed Category
  const category = new TestCategory({
    name: 'General Health Test Category',
    description: 'Basic health tests',
  });
  await category.save();

  // Seed Tests
  const testA = new Test({
    name: 'Test A (CBC)',
    description: 'Complete Blood Count',
    type: 'lab',
    categoryId: category._id,
    price: 15,
    duration: '24 hours',
    isHomeCollectionAvailable: true,
    isActive: true,
  });
  await testA.save();

  const testB = new Test({
    name: 'Test B (MRI Brain)',
    description: 'Magnetic Resonance Imaging',
    type: 'radiology',
    categoryId: category._id,
    price: 250,
    duration: '48 hours',
    isHomeCollectionAvailable: false,
    isActive: true,
  });
  await testB.save();

  // Seed Coupons
  const couponSave10 = new Coupon({
    code: 'SAVE10',
    discountType: 'percentage',
    discountValue: 10,
    minOrderValue: 20,
    maxUses: 5,
    usedCount: 0,
    isActive: true,
  });
  await couponSave10.save();

  const couponFreebie = new Coupon({
    code: 'FREEBIE',
    discountType: 'fixed',
    discountValue: 50,
    minOrderValue: 10,
    maxUses: 5,
    usedCount: 0,
    isActive: true,
  });
  await couponFreebie.save();

  const couponExpired = new Coupon({
    code: 'EXPIRED',
    discountType: 'fixed',
    discountValue: 10,
    expiresAt: new Date(Date.now() - 3600000), // 1 hour ago
    isActive: true,
  });
  await couponExpired.save();

  const couponMaxed = new Coupon({
    code: 'MAXED',
    discountType: 'fixed',
    discountValue: 10,
    maxUses: 1,
    usedCount: 1,
    isActive: true,
  });
  await couponMaxed.save();

  console.log(`${green}Database successfully seeded!${reset}\n`);

  // --- Step 2: REST API Endpoints Testing ---

  // 1. Register test patient
  console.log('Test Case 1: Register Patient...');
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Jane Doe',
      email: testEmail,
      password: 'Password123!',
      phone: '1234567890',
    }),
  });
  const regData = await regRes.json();
  if (regRes.status !== 201) {
    throw new Error(`Failed to register patient: ${JSON.stringify(regData)}`);
  }
  // Verify user in DB directly to bypass SES sandbox/manual verification step in E2E tests
  await User.updateOne({ email: testEmail }, { isVerified: true });
  console.log(`${green}✔ Patient registered and verified in DB successfully!${reset}`);

  // 2. Login to get token
  console.log('Test Case 2: Login Patient...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'Password123!',
    }),
  });
  const loginData = await loginRes.json();
  if (loginRes.status !== 200) {
    throw new Error(`Failed to login patient: ${JSON.stringify(loginData)}`);
  }
  const token = loginData.accessToken;
  const patientId = loginData.user.id;
  console.log(`${green}✔ Login successful, token acquired!${reset}`);

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // Seed Family Member & Subscription (for verification gate testing)
  const familyMember = new FamilyMember({
    userId: new mongoose.Types.ObjectId(patientId),
    name: 'Bobby Doe',
    relationship: 'child',
    gender: 'male',
    dateOfBirth: new Date('2020-01-01'),
  });
  await familyMember.save();

  const activeSub = new Subscription({
    userId: new mongoose.Types.ObjectId(patientId),
    planId: plan._id,
    status: 'active',
    renewalDate: new Date(Date.now() + 30 * 24 * 3600 * 1000), // 30 days
  });
  await activeSub.save();

  // 3. Test Coupon Validation Endpoint (POST /coupons/validate)
  console.log('\nTest Case 3: Validate Coupon...');
  const valCouponRes = await fetch(`${BASE_URL}/coupons/validate`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ code: 'SAVE10', totalAmount: 100 }),
  });
  const valCouponData = await valCouponRes.json();
  assert(valCouponRes.status === 200, 'Coupon should be valid');
  assert(valCouponData.data.discountAmount === 10, 'SAVE10 should give 10% of 100 (which is 10)');
  console.log(`${green}✔ Coupon validation endpoint works!${reset}`);

  // Test Coupon validation failure (expired)
  const valExpiredRes = await fetch(`${BASE_URL}/coupons/validate`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ code: 'EXPIRED', totalAmount: 100 }),
  });
  assert(valExpiredRes.status === 400, 'Expired coupon should fail validation');
  console.log(`${green}✔ Expired coupon validation correctly blocked!${reset}`);

  // Test Coupon validation failure (max uses)
  const valMaxedRes = await fetch(`${BASE_URL}/coupons/validate`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ code: 'MAXED', totalAmount: 100 }),
  });
  assert(valMaxedRes.status === 400, 'Maxed coupon should fail validation');
  console.log(`${green}✔ Max uses coupon validation correctly blocked!${reset}`);

  // 4. Test Booking Creation Failures
  console.log('\nTest Case 4: Booking creation failures...');
  // A: Empty tests
  const createEmptyRes = await fetch(`${BASE_URL}/bookings`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ tests: [], notes: 'TEST_SCENARIO_FAIL' }),
  });
  assert(createEmptyRes.status === 400, 'Empty tests should fail');
  console.log(`${green}✔ Empty tests check passed!${reset}`);

  // B: Test doesn't support home collection
  const createSamplingFailRes = await fetch(`${BASE_URL}/bookings`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      tests: [testA._id, testB._id],
      homeSampling: {
        requested: true,
        address: '123 Test St',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      },
      notes: 'TEST_SCENARIO_FAIL',
    }),
  });
  assert(createSamplingFailRes.status === 400, 'Home sampling check should reject MRI scan');
  console.log(`${green}✔ Home sampling availability check passed!${reset}`);

  // C: Appointment date in past
  const createDatePastRes = await fetch(`${BASE_URL}/bookings`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      tests: [testA._id],
      homeSampling: {
        requested: true,
        address: '123 Test St',
        scheduledAt: new Date(Date.now() - 3600000).toISOString(),
      },
      notes: 'TEST_SCENARIO_FAIL',
    }),
  });
  assert(createDatePastRes.status === 400, 'Appointment slot in the past should fail');
  console.log(`${green}✔ Date validation check passed!${reset}`);

  // 5. Test Successful Booking Creation for Self
  console.log('\nTest Case 5: Create Booking for Self...');
  const createBookingRes = await fetch(`${BASE_URL}/bookings`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      tests: [testA._id, testB._id],
      couponCode: 'SAVE10',
      homeSampling: {
        requested: false,
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      },
      notes: 'TEST_SCENARIO_SELF',
    }),
  });
  const createBookingData = await createBookingRes.json();
  assert(createBookingRes.status === 201, 'Booking creation should succeed');
  const booking = createBookingData.data.booking;
  assert(booking.status === 'pending_payment', 'Status should be pending_payment');
  assert(booking.totalAmount === 265, 'Total should be 265');
  assert(booking.discountAmount === 26.5, 'Discount should be 26.5');
  assert(booking.finalAmount === 238.5, 'Final total should be 238.5');
  console.log(`${green}✔ Booking created successfully in pending_payment!${reset}`);

  // 6. Test Payment Intent Creation (POST /payments/create-intent)
  console.log('\nTest Case 6: Create Payment Intent...');
  const createIntentRes = await fetch(`${BASE_URL}/payments/create-intent`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ bookingId: booking._id }),
  });
  const createIntentData = await createIntentRes.json();
  assert(createIntentRes.status === 200, 'Create PaymentIntent should succeed');
  const clientSecret = createIntentData.data.clientSecret;
  const paymentId = createIntentData.data.paymentId;
  assert(clientSecret !== null, 'Client secret should be returned');
  console.log(`${green}✔ Payment Intent generated: ${clientSecret}${reset}`);

  // Test idempotency of Intent Creation
  const createIntentIdempotentRes = await fetch(`${BASE_URL}/payments/create-intent`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ bookingId: booking._id }),
  });
  const createIntentIdempotentData = await createIntentIdempotentRes.json();
  assert(
    createIntentIdempotentData.data.clientSecret === clientSecret,
    'Should return the same clientSecret for pending payment'
  );
  console.log(`${green}✔ Payment Intent creation is idempotent!${reset}`);

  // Check standalone Payment record
  const paymentRecord = await Payment.findById(paymentId);
  assert(paymentRecord !== null, 'Payment record should exist in DB');
  assert(paymentRecord?.status === 'pending', 'Payment record status should be pending');
  console.log(`${green}✔ Stands-alone Payment record created as pending!${reset}`);

  // 7. Test Payment Confirmation (POST /payments/confirm)
  console.log('\nTest Case 7: Confirm Payment...');
  const paymentIntentId = clientSecret.split('_secret_')[0];
  
  // Confirm the payment intent directly with Stripe using a test card to mock successful checkout
  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  await stripe.paymentIntents.confirm(paymentIntentId, {
    payment_method: 'pm_card_visa',
    return_url: 'http://localhost:5001/api/v1/health',
  });

  const confirmRes = await fetch(`${BASE_URL}/payments/confirm`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ paymentIntentId }),
  });
  const confirmData = await confirmRes.json();
  if (confirmRes.status !== 200) {
    console.error('Confirm Payment Failed. Response status:', confirmRes.status);
    console.error('Response data:', JSON.stringify(confirmData, null, 2));
  }
  assert(confirmRes.status === 200, 'Payment confirmation should succeed');
  assert(confirmData.data.booking.status === 'scheduled', 'Booking status should become scheduled');

  // Verify DB state
  const updatedBooking = await Booking.findById(booking._id);
  assert(updatedBooking?.status === 'scheduled', 'Booking status in DB should be scheduled');
  const updatedPayment = await Payment.findById(paymentId);
  assert(updatedPayment?.status === 'succeeded', 'Payment record status should be succeeded');
  assert(updatedPayment?.paidAt !== null, 'Payment paidAt should be saved');

  const updatedCoupon = await Coupon.findOne({ code: 'SAVE10' });
  assert(updatedCoupon?.usedCount === 1, 'Coupon usedCount should be incremented to 1');
  console.log(`${green}✔ Payment confirmed, Booking scheduled, Coupon consumed!${reset}`);

  // Test confirming already processed payment (idempotency)
  const confirmAgainRes = await fetch(`${BASE_URL}/payments/confirm`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ paymentIntentId }),
  });
  assert(confirmAgainRes.status === 200, 'Should confirm again idempotently');
  console.log(`${green}✔ Payment confirmation is idempotent!${reset}`);

  // 8. Test Zero-Value Checkout Bypass
  console.log('\nTest Case 8: Zero-Value Checkout Bypass...');
  // Create booking with freebie coupon covering 100% of $15 Complete Blood Count
  const createFreeBookingRes = await fetch(`${BASE_URL}/bookings`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      tests: [testA._id],
      couponCode: 'FREEBIE',
      homeSampling: {
        requested: true,
        address: '742 Evergreen Terrace',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      },
      notes: 'TEST_SCENARIO_FREE',
    }),
  });
  const createFreeBookingData = await createFreeBookingRes.json();
  assert(createFreeBookingRes.status === 201, 'Zero-value booking creation should succeed');
  const freeBooking = createFreeBookingData.data.booking;
  assert(freeBooking.status === 'scheduled', 'Should transition directly to scheduled');
  assert(freeBooking.finalAmount === 0, 'Final amount should be 0');
  console.log(`${green}✔ Zero-value checkout successfully bypassed Stripe and scheduled!${reset}`);

  // 9. Test Patient Booking Cancellation Limits
  console.log('\nTest Case 9: Patient Booking Cancellation Limits...');
  // Patient tries to cancel a cancelled booking (should fail)
  // Patient cancels the scheduled SAVE10 booking
  const cancelRes = await fetch(`${BASE_URL}/bookings/${booking._id}/cancel`, {
    method: 'PATCH',
    headers: authHeaders,
  });
  assert(cancelRes.status === 200, 'Patient cancelling scheduled booking should succeed');

  const cancelledBooking = await Booking.findById(booking._id);
  assert(cancelledBooking?.status === 'cancelled', 'Booking status should become cancelled');
  console.log(`${green}✔ Patient cancelled scheduled booking!${reset}`);

  // Try to cancel again
  const cancelAgainRes = await fetch(`${BASE_URL}/bookings/${booking._id}/cancel`, {
    method: 'PATCH',
    headers: authHeaders,
  });
  assert(cancelAgainRes.status === 400, 'Patient cancelling a cancelled booking should fail');
  console.log(`${green}✔ Patient cancellation limits verified!${reset}`);

  console.log(`\n${cyan}====================================================${reset}`);
  console.log(`${green}🎉 ALL FEATURE 4 BOOKING FLOW TEST CASES PASSED SUCCESSFULLY! 🎉${reset}`);
  console.log(`${cyan}====================================================${reset}\n`);

  process.exit(0);
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`${red}✖ Test assertion failed: ${message}${reset}`);
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error(`${red}✖ Test run failed with error: ${err.message}${reset}`);
  console.error(err);
  process.exit(1);
});
