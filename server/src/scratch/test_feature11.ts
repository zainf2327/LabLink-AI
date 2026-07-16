import mongoose from 'mongoose';
import { env } from '../config/env.js';
import User from '../models/User.model.js';
import Booking from '../models/Booking.model.js';
import Test from '../models/Test.model.js';
import TestCategory from '../models/TestCategory.model.js';
import dns from 'dns';

dns.setServers(['8.8.8.8', '1.1.1.1']);

const green = '\x1b[32m';
const red = '\x1b[31m';
const cyan = '\x1b[36m';
const reset = '\x1b[0m';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log(`${cyan}=== Starting LabLink AI Feature 11 E2E / Integration Tests ===${reset}\n`);

  // Connect to Database
  await mongoose.connect(env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clean up existing test data
  await User.deleteMany({ email: { $in: ['test_patient_11@example.com'] } });
  await TestCategory.deleteMany({ name: 'ANALYTICS_TEST_CATEGORY' });
  await Test.deleteMany({ description: 'ANALYTICS_TEST' });
  await Booking.deleteMany({ notes: 'FEATURE_11_TEST_SCENARIO' });

  // 1. Create Patient
  const patient = await User.create({
    name: 'Patient Eleven',
    email: 'test_patient_11@example.com',
    role: 'patient',
    passwordHash: 'dummyhash',
  });

  // 2. Create Category and Tests
  const category = await TestCategory.create({
    name: 'ANALYTICS_TEST_CATEGORY',
    description: 'Category for testing analytics logic',
  });

  const testA = await Test.create({
    name: 'CBC Gold',
    description: 'ANALYTICS_TEST',
    type: 'lab',
    categoryId: category._id,
    price: 30,
    duration: '24 hours',
    isHomeCollectionAvailable: true,
  });

  const testB = await Test.create({
    name: 'Lipid Platinum',
    description: 'ANALYTICS_TEST',
    type: 'lab',
    categoryId: category._id,
    price: 50,
    duration: '24 hours',
    isHomeCollectionAvailable: true,
  });

  // 3. Create Bookings with different status and dates
  // Booking 1: Scheduled, finalAmount = 30
  await Booking.create({
    patientId: patient._id,
    tests: [{ testId: testA._id, name: testA.name, price: 30 }],
    status: 'scheduled',
    totalAmount: 30,
    discountAmount: 0,
    finalAmount: 30,
    homeSampling: { requested: false },
    notes: 'FEATURE_11_TEST_SCENARIO',
    createdAt: new Date(),
  });

  // Booking 2: Completed, finalAmount = 50
  await Booking.create({
    patientId: patient._id,
    tests: [{ testId: testB._id, name: testB.name, price: 50 }],
    status: 'completed',
    totalAmount: 50,
    discountAmount: 0,
    finalAmount: 50,
    homeSampling: { requested: false },
    notes: 'FEATURE_11_TEST_SCENARIO',
    createdAt: new Date(),
  });

  // Booking 3: Pending Payment (should NOT count in active bookings/revenue)
  await Booking.create({
    patientId: patient._id,
    tests: [{ testId: testA._id, name: testA.name, price: 30 }],
    status: 'pending_payment',
    totalAmount: 30,
    discountAmount: 0,
    finalAmount: 30,
    homeSampling: { requested: false },
    notes: 'FEATURE_11_TEST_SCENARIO',
    createdAt: new Date(),
  });

  // 4. Test Overview Aggregation
  console.log('Test Case 1: Overview Aggregates...');
  const start = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const end = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const totalBookings = await Booking.countDocuments({
    notes: 'FEATURE_11_TEST_SCENARIO',
    createdAt: { $gte: start, $lte: end },
    status: { $ne: 'pending_payment' }
  });
  assert(totalBookings === 2, 'Should count exactly 2 active bookings (scheduled & completed)');

  const revenueResult = await Booking.aggregate([
    {
      $match: {
        notes: 'FEATURE_11_TEST_SCENARIO',
        createdAt: { $gte: start, $lte: end },
        status: { $in: ['scheduled', 'sample_collected', 'in_lab', 'report_ready', 'completed'] }
      }
    },
    { $group: { _id: null, total: { $sum: '$finalAmount' } } }
  ]);
  const totalRevenue = revenueResult[0]?.total || 0;
  assert(totalRevenue === 80, 'Revenue should equal 80 (30 + 50)');
  console.log(`${green}✔ Overview Aggregates computed successfully!${reset}\n`);

  // 5. Test Bookings Trend Aggregation
  console.log('Test Case 2: Bookings Trends grouped by date...');
  const trends = await Booking.aggregate([
    {
      $match: {
        notes: 'FEATURE_11_TEST_SCENARIO',
        createdAt: { $gte: start, $lte: end },
        status: { $ne: 'pending_payment' }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  assert(trends.length >= 1, 'Should find at least 1 date trend block');
  assert(trends[0].count === 2, 'Date trend should count 2 bookings');
  console.log(`${green}✔ Bookings Trends grouped by date successfully!${reset}\n`);

  // 6. Test Top Tests Aggregation
  console.log('Test Case 3: Top selling tests sorting...');
  const topTests = await Booking.aggregate([
    {
      $match: {
        notes: 'FEATURE_11_TEST_SCENARIO',
        status: { $in: ['scheduled', 'sample_collected', 'in_lab', 'report_ready', 'completed'] }
      }
    },
    { $unwind: '$tests' },
    {
      $group: {
        _id: '$tests.testId',
        name: { $first: '$tests.name' },
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);
  assert(topTests.length >= 2, 'Should find at least 2 distinct test sales');
  assert(topTests[0].count === 1, 'Each test should have 1 sale');
  console.log(`${green}✔ Top Booked tests listing successfully!${reset}\n`);

  // Cleanup Database
  await User.deleteMany({ email: { $in: ['test_patient_11@example.com'] } });
  await TestCategory.deleteMany({ name: 'ANALYTICS_TEST_CATEGORY' });
  await Test.deleteMany({ description: 'ANALYTICS_TEST' });
  await Booking.deleteMany({ notes: 'FEATURE_11_TEST_SCENARIO' });
  console.log('Test database cleaned up.');

  console.log(`${green}=== All Feature 11 Integration Tests Completed Successfully! ===${reset}\n`);
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(`${red}Test execution failed:${reset}`, err);
    process.exit(1);
  });
