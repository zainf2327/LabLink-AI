import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dns from 'dns';
import { env } from './config/env.js';

dns.setServers(['8.8.8.8', '1.1.1.1']);

// Load env variables
dotenv.config({ override: true });

// Import Mongoose Models
import User from './models/User.model.js';
import TestCategory from './models/TestCategory.model.js';
import Test from './models/Test.model.js';
import Coupon from './models/Coupon.model.js';
import SubscriptionPlan from './models/SubscriptionPlan.model.js';
import Subscription from './models/Subscription.model.js';
import Booking from './models/Booking.model.js';
import Payment from './models/Payment.model.js';
import FamilyMember from './models/FamilyMember.model.js';
import AuditLog from './models/AuditLog.model.js';
import WalletTransaction from './models/WalletTransaction.model.js';
import Region from './models/Region.model.js';

async function seed() {
  const uri = env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not defined in env');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    // Fetch existing admin-only collections
    console.log('Fetching existing Regions, Subscription Plans, and Coupons...');
    const existingRegions = await Region.find();
    const existingPlans = await SubscriptionPlan.find();
    const existingCoupons = await Coupon.find();

    if (existingRegions.length === 0) {
      console.error('❌ Error: No Regions found in the database. Please configure regions in the database first.');
      process.exit(1);
    }
    if (existingPlans.length === 0) {
      console.error('❌ Error: No Subscription Plans found in the database. Please configure subscription plans in the database first.');
      process.exit(1);
    }
    if (existingCoupons.length === 0) {
      console.error('❌ Error: No Coupons found in the database. Please configure coupons in the database first.');
      process.exit(1);
    }

    console.log(`Found ${existingRegions.length} regions, ${existingPlans.length} plans, and ${existingCoupons.length} coupons.`);

    // 1. Clear other collections
    console.log('Clearing database (except Regions, Subscription Plans, Coupons)...');
    await User.deleteMany({});
    await TestCategory.deleteMany({});
    await Test.deleteMany({});
    await Subscription.deleteMany({});
    await Booking.deleteMany({});
    await Payment.deleteMany({});
    await FamilyMember.deleteMany({});
    await AuditLog.deleteMany({});
    await WalletTransaction.deleteMany({});
    console.log('Collections cleared.');

    // Helper functions to get active Region IDs
    const getRegionId = (id: string): string => {
      const match = existingRegions.find((r) => r._id === id);
      return match ? match._id : existingRegions[0]._id;
    };

    // Helper to get Plans
    const freePlan = existingPlans.find((p) => p.name.toLowerCase() === 'free') || existingPlans[0];
    const silverPlan = existingPlans.find((p) => p.name.toLowerCase().includes('silver')) || existingPlans[0];
    const goldPlan = existingPlans.find((p) => p.name.toLowerCase().includes('gold')) || existingPlans[0];

    // Helper to get Coupon
    const save10Coupon = existingCoupons.find((c) => c.code === 'SAVE10') || null;

    // 2. Create Users
    console.log('Hashing passwords...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    console.log('Creating users...');
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@lablink.com',
      passwordHash,
      phone: '+15550100',
      role: 'admin',
      isActive: true,
      isVerified: true,
    });

    const defaultShifts = [
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' },
    ];

    // 5 Staff workers
    const staff1 = await User.create({
      name: 'Dr. John Watson (Phlebotomist)',
      email: 'staff1@lablink.com',
      passwordHash,
      phone: '+15550201',
      role: 'staff',
      isActive: true,
      isVerified: true,
      assignedRegions: [getRegionId('lahore_gulberg'), getRegionId('lahore_johar_town')],
      shifts: defaultShifts,
    });

    const staff2 = await User.create({
      name: 'Sister Clara Barton (Nurse)',
      email: 'staff2@lablink.com',
      passwordHash,
      phone: '+15550202',
      role: 'staff',
      isActive: true,
      isVerified: true,
      assignedRegions: [getRegionId('karachi_clifton'), getRegionId('karachi_gulshan_e_iqbal')],
      shifts: defaultShifts,
    });

    const staff3 = await User.create({
      name: 'Dr. Gregory House (Lab Tech)',
      email: 'staff3@lablink.com',
      passwordHash,
      phone: '+15550203',
      role: 'staff',
      isActive: true,
      isVerified: true,
      assignedRegions: [getRegionId('new_york_manhattan'), getRegionId('new_york_brooklyn')],
      shifts: defaultShifts,
    });

    const staff4 = await User.create({
      name: 'Florence Nightingale (Phlebotomist)',
      email: 'staff4@lablink.com',
      passwordHash,
      phone: '+15550204',
      role: 'staff',
      isActive: true,
      isVerified: true,
      assignedRegions: [getRegionId('lahore_dha_lahore'), getRegionId('lahore_model_town')],
      shifts: defaultShifts,
    });

    const staff5Inactive = await User.create({
      name: 'Carol Danvers (Inactive Worker)',
      email: 'staff5@lablink.com',
      passwordHash,
      phone: '+15550205',
      role: 'staff',
      isActive: false,
      isVerified: true,
      assignedRegions: [getRegionId('lahore_johar_town')],
      shifts: defaultShifts,
    });

    // 3 Patients with diversified profiles
    const patient1 = await User.create({
      name: 'John Doe',
      email: 'patient1@lablink.com',
      passwordHash,
      phone: '+15550301',
      role: 'patient',
      walletBalance: 150,
      isActive: true,
      isVerified: true,
    });

    const patient2 = await User.create({
      name: 'Jane Smith',
      email: 'patient2@lablink.com',
      passwordHash,
      phone: '+15550302',
      role: 'patient',
      walletBalance: 50,
      isActive: true,
      isVerified: true,
    });

    const patient3 = await User.create({
      name: 'Bob Brown',
      email: 'patient3@lablink.com',
      passwordHash,
      phone: '+15550303',
      role: 'patient',
      walletBalance: 0,
      isActive: true,
      isVerified: true,
    });

    console.log('Seeded users list successfully.');

    // 3. Create Family Members
    console.log('Creating family members...');
    const familyMember1 = await FamilyMember.create({
      userId: patient1._id,
      name: 'Sarah Connor',
      dateOfBirth: new Date('1985-11-10'),
      relationship: 'spouse',
      gender: 'female',
    });

    const familyMember2 = await FamilyMember.create({
      userId: patient1._id,
      name: 'John Connor',
      dateOfBirth: new Date('2005-04-12'),
      relationship: 'child',
      gender: 'male',
    });

    const familyMember3 = await FamilyMember.create({
      userId: patient2._id,
      name: 'Baby Smith',
      dateOfBirth: new Date('2024-01-01'),
      relationship: 'child',
      gender: 'other',
    });

    console.log('Family members created.');

    // 4. Create Active Subscriptions for Patients
    console.log('Assigning subscriptions...');
    // Patient 1: Active Family Silver subscription (holds 2 family members)
    const sub1 = await Subscription.create({
      userId: patient1._id,
      planId: silverPlan._id,
      status: 'active',
      startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      activeFamilyMemberIds: [familyMember1._id, familyMember2._id],
      needsFamilySelection: false,
      planSnapshot: {
        price: silverPlan.price,
        name: silverPlan.name,
        durationMonths: silverPlan.durationMonths,
        testDiscountPercent: silverPlan.testDiscountPercent,
        freeHomeCollections: silverPlan.freeHomeCollections,
        aiQuestionsPerMonth: silverPlan.aiQuestionsPerMonth,
        maxFamilyMembers: silverPlan.maxFamilyMembers,
      },
    });

    // Patient 2: Active Family Gold subscription (holds 1 family member)
    const sub2 = await Subscription.create({
      userId: patient2._id,
      planId: goldPlan._id,
      status: 'active',
      startDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
      expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      activeFamilyMemberIds: [familyMember3._id],
      needsFamilySelection: false,
      planSnapshot: {
        price: goldPlan.price,
        name: goldPlan.name,
        durationMonths: goldPlan.durationMonths,
        testDiscountPercent: goldPlan.testDiscountPercent,
        freeHomeCollections: goldPlan.freeHomeCollections,
        aiQuestionsPerMonth: goldPlan.aiQuestionsPerMonth,
        maxFamilyMembers: goldPlan.maxFamilyMembers,
      },
    });

    // Patient 3 has Free Plan (No explicit subscription record required)
    console.log('Subscriptions created.');

    // 5. Create Test Categories
    console.log('Creating test categories...');
    const hematology = await TestCategory.create({
      name: 'Hematology',
      description: 'Study of blood cells and coagulation dynamics.',
    });

    const biochemistry = await TestCategory.create({
      name: 'Biochemistry',
      description: 'Chemical analysis of bodily fluids.',
    });

    const immunology = await TestCategory.create({
      name: 'Immunology',
      description: 'Assays of immune systems and antibody checks.',
    });

    const radiology = await TestCategory.create({
      name: 'Radiology',
      description: 'Imaging services including X-Ray, Ultrasound, and MRI.',
    });

    console.log('Test categories created.');

    // 6. Create Tests
    console.log('Creating tests catalog...');
    // Hematology
    const cbc = await Test.create({
      name: 'Complete Blood Count (CBC)',
      description: 'Evaluates overall health and detects disorders such as anemia and leukemia.',
      type: 'lab',
      categoryId: hematology._id,
      price: 45,
      preparationInstructions: 'No fasting required.',
      duration: '24 Hours',
      isHomeCollectionAvailable: true,
      isActive: true,
    });

    // Biochemistry
    const lft = await Test.create({
      name: 'Liver Function Test (LFT)',
      description: 'Measures proteins, liver enzymes, and bilirubin in your blood to diagnose liver health.',
      type: 'lab',
      categoryId: biochemistry._id,
      price: 60,
      preparationInstructions: 'Fasting for 8-12 hours required.',
      duration: '24 Hours',
      isHomeCollectionAvailable: true,
      isActive: true,
    });

    const lipid = await Test.create({
      name: 'Lipid Profile',
      description: 'Checks cholesterol levels (LDL, HDL, triglycerides) to assess cardiovascular risk.',
      type: 'lab',
      categoryId: biochemistry._id,
      price: 55,
      preparationInstructions: 'Fasting for 12 hours required.',
      duration: '24 Hours',
      isHomeCollectionAvailable: true,
      isActive: true,
    });

    const glucose = await Test.create({
      name: 'Fasting Blood Sugar (FBS)',
      description: 'Measures blood glucose level after fasting to screen for diabetes.',
      type: 'lab',
      categoryId: biochemistry._id,
      price: 25,
      preparationInstructions: 'Fasting for 8 hours required.',
      duration: '12 Hours',
      isHomeCollectionAvailable: true,
      isActive: true,
    });

    // Immunology
    const thyroid = await Test.create({
      name: 'Thyroid Panel (T3, T4, TSH)',
      description: 'Checks thyroid hormone levels to identify hyperthyroidism or hypothyroidism.',
      type: 'lab',
      categoryId: immunology._id,
      price: 80,
      preparationInstructions: 'No fasting required.',
      duration: '24 Hours',
      isHomeCollectionAvailable: true,
      isActive: true,
    });

    const vitD = await Test.create({
      name: 'Vitamin D (25-Hydroxy)',
      description: 'Measures concentration of Vitamin D in blood to diagnose deficiencies.',
      type: 'lab',
      categoryId: immunology._id,
      price: 95,
      preparationInstructions: 'No fasting required.',
      duration: '2 Days',
      isHomeCollectionAvailable: true,
      isActive: true,
    });

    // Radiology
    const xray = await Test.create({
      name: 'Chest X-Ray',
      description: 'Uses low dose radiation to image internal structures of chest and lungs.',
      type: 'radiology',
      categoryId: radiology._id,
      price: 120,
      preparationInstructions: 'Remove all metal objects before the scan.',
      duration: '4 Hours',
      isHomeCollectionAvailable: false,
      isActive: true,
    });

    console.log('Tests catalog created.');

    // 7. Create Mock Bookings
    console.log('Creating mock bookings...');
    const now = new Date();

    const dates = {
      minus25d: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
      minus15d: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      minus10d: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      minus5d: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      minus2d: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      minus1d: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      today: now,
      plus1d: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      plus2d: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
    };

    // Booking 1: Completed 15 days ago, patient1, CBC, walk-in
    const booking1 = await Booking.create({
      patientId: patient1._id,
      tests: [{ testId: cbc._id, name: cbc.name, price: cbc.price }],
      status: 'completed',
      totalAmount: 45,
      discountAmount: 4.5, // 10% Silver plan discount
      finalAmount: 40.5,
      walletAmountUsed: 0,
      homeSampling: { requested: false },
      createdAt: dates.minus15d,
      updatedAt: dates.minus15d,
    });

    // Booking 2: Completed 10 days ago, patient2, LFT + Lipid, home sampling (staff1 assigned)
    const booking2 = await Booking.create({
      patientId: patient2._id,
      tests: [
        { testId: lft._id, name: lft.name, price: lft.price },
        { testId: lipid._id, name: lipid.name, price: lipid.price },
      ],
      status: 'completed',
      totalAmount: 115,
      discountAmount: 17.25, // 15% Gold plan discount
      finalAmount: 97.75,
      walletAmountUsed: 20, // Paid 20 via wallet
      homeSampling: {
        requested: true,
        address: 'Apartment 4B, Gulberg Heights, Lahore',
        scheduledAt: dates.minus10d,
        assignedStaffId: staff1._id,
        region: getRegionId('lahore_gulberg'),
        streetAddress: 'Apartment 4B, Gulberg Heights',
        city: 'Lahore',
        country: 'Pakistan',
      },
      createdAt: dates.minus10d,
      updatedAt: dates.minus10d,
    });

    // Booking 3: Cancelled 5 days ago, patient3, Glucose, walk-in
    const booking3 = await Booking.create({
      patientId: patient3._id,
      tests: [{ testId: glucose._id, name: glucose.name, price: glucose.price }],
      status: 'cancelled',
      totalAmount: 25,
      discountAmount: 0,
      finalAmount: 25,
      walletAmountUsed: 0,
      homeSampling: { requested: false },
      createdAt: dates.minus5d,
      updatedAt: dates.minus5d,
    });

    // Booking 4: Scheduled (Upcoming - 2 days from now), patient1, Thyroid Panel, home sampling (staff1 assigned)
    const booking4 = await Booking.create({
      patientId: patient1._id,
      forMemberId: familyMember1._id, // booking for spouse
      tests: [{ testId: thyroid._id, name: thyroid.name, price: thyroid.price }],
      status: 'scheduled',
      totalAmount: 80,
      discountAmount: 8, // 10% Silver plan discount
      finalAmount: 72,
      walletAmountUsed: 0,
      homeSampling: {
        requested: true,
        address: 'House 42, Johar Town, Lahore',
        scheduledAt: dates.plus2d,
        assignedStaffId: staff1._id,
        region: getRegionId('lahore_johar_town'),
        streetAddress: 'House 42',
        blockNumber: 'Block G',
        city: 'Lahore',
        country: 'Pakistan',
      },
      createdAt: dates.minus1d,
      updatedAt: dates.minus1d,
    });

    // Booking 5: Sample Collected (Today), patient2, Vitamin D, home sampling (staff2 assigned in Karachi Clifton)
    const booking5 = await Booking.create({
      patientId: patient2._id,
      forMemberId: familyMember3._id, // booking for baby
      tests: [{ testId: vitD._id, name: vitD.name, price: vitD.price }],
      status: 'sample_collected',
      totalAmount: 95,
      discountAmount: 14.25, // 15% Gold plan discount
      finalAmount: 80.75,
      walletAmountUsed: 0,
      homeSampling: {
        requested: true,
        address: 'Flat 12, Ocean View Apartments, Clifton, Karachi',
        scheduledAt: dates.today,
        assignedStaffId: staff2._id,
        region: getRegionId('karachi_clifton'),
        streetAddress: 'Flat 12, Ocean View Apartments',
        city: 'Karachi',
        country: 'Pakistan',
      },
      createdAt: dates.today,
      updatedAt: dates.today,
    });

    // Booking 6: In Lab (Yesterday), patient1, Glucose, walk-in, fully paid by wallet
    const booking6 = await Booking.create({
      patientId: patient1._id,
      tests: [{ testId: glucose._id, name: glucose.name, price: glucose.price }],
      status: 'in_lab',
      totalAmount: 25,
      discountAmount: 2.5, // 10% Silver
      finalAmount: 22.5,
      walletAmountUsed: 22.5, // Fully wallet paid
      homeSampling: { requested: false },
      createdAt: dates.minus1d,
      updatedAt: dates.minus1d,
    });

    // Booking 7: Report Ready (2 days ago), patient2, Chest X-Ray, walk-in
    const booking7 = await Booking.create({
      patientId: patient2._id,
      tests: [{ testId: xray._id, name: xray.name, price: xray.price }],
      status: 'report_ready',
      totalAmount: 120,
      discountAmount: 18, // 15% Gold
      finalAmount: 102,
      walletAmountUsed: 0,
      homeSampling: { requested: false },
      createdAt: dates.minus2d,
      updatedAt: dates.minus2d,
    });

    // Booking 8: Pending Payment (Today), patient3, CBC, walk-in
    const booking8 = await Booking.create({
      patientId: patient3._id,
      tests: [{ testId: cbc._id, name: cbc.name, price: cbc.price }],
      status: 'pending_payment',
      totalAmount: 45,
      discountAmount: 0,
      finalAmount: 45,
      walletAmountUsed: 0,
      homeSampling: { requested: false },
      createdAt: dates.today,
      updatedAt: dates.today,
    });

    // Booking 9: Pending Manual Assignment (Tomorrow), patient1, Glucose, home sampling (unassigned)
    const booking9 = await Booking.create({
      patientId: patient1._id,
      tests: [{ testId: glucose._id, name: glucose.name, price: glucose.price }],
      status: 'pending_manual_assignment',
      totalAmount: 25,
      discountAmount: 2.5, // 10% Silver
      finalAmount: 22.5,
      walletAmountUsed: 0,
      homeSampling: {
        requested: true,
        address: 'House 99, Johar Town, Lahore',
        scheduledAt: dates.plus1d,
        assignedStaffId: null, // triggers manual assignment UI
        region: getRegionId('lahore_johar_town'),
        streetAddress: 'House 99',
        city: 'Lahore',
        country: 'Pakistan',
      },
      createdAt: dates.today,
      updatedAt: dates.today,
    });

    console.log('Mock bookings created successfully.');

    // 8. Create Stripe Payments
    console.log('Seeding payment transaction log...');
    // Payment for Booking 1
    await Payment.create({
      bookingId: booking1._id,
      paymentFor: 'booking',
      patientId: patient1._id,
      amount: 40.5,
      walletAmountUsed: 0,
      currency: 'usd',
      method: 'stripe',
      stripePaymentIntentId: 'pi_mock_1',
      status: 'succeeded',
      paidAt: dates.minus15d,
      createdAt: dates.minus15d,
    });

    // Payment for Booking 2
    await Payment.create({
      bookingId: booking2._id,
      paymentFor: 'booking',
      patientId: patient2._id,
      amount: 77.75,
      walletAmountUsed: 20,
      currency: 'usd',
      method: 'stripe',
      stripePaymentIntentId: 'pi_mock_2',
      status: 'succeeded',
      paidAt: dates.minus10d,
      createdAt: dates.minus10d,
    });

    // Payment for Booking 3 (Paid then cancelled)
    await Payment.create({
      bookingId: booking3._id,
      paymentFor: 'booking',
      patientId: patient3._id,
      amount: 25,
      walletAmountUsed: 0,
      currency: 'usd',
      method: 'stripe',
      stripePaymentIntentId: 'pi_mock_3',
      status: 'succeeded',
      paidAt: dates.minus5d,
      createdAt: dates.minus5d,
    });

    // Payment for Booking 4
    await Payment.create({
      bookingId: booking4._id,
      paymentFor: 'booking',
      patientId: patient1._id,
      amount: 72,
      walletAmountUsed: 0,
      currency: 'usd',
      method: 'stripe',
      stripePaymentIntentId: 'pi_mock_4',
      status: 'succeeded',
      paidAt: dates.minus1d,
      createdAt: dates.minus1d,
    });

    // Payment for Booking 5
    await Payment.create({
      bookingId: booking5._id,
      paymentFor: 'booking',
      patientId: patient2._id,
      amount: 80.75,
      walletAmountUsed: 0,
      currency: 'usd',
      method: 'stripe',
      stripePaymentIntentId: 'pi_mock_5',
      status: 'succeeded',
      paidAt: dates.today,
      createdAt: dates.today,
    });

    // Payment for Booking 6 (Fully paid by wallet)
    await Payment.create({
      bookingId: booking6._id,
      paymentFor: 'booking',
      patientId: patient1._id,
      amount: 0,
      walletAmountUsed: 22.5,
      currency: 'usd',
      method: 'stripe',
      stripePaymentIntentId: 'pi_wallet_payment',
      status: 'succeeded',
      paidAt: dates.minus1d,
      createdAt: dates.minus1d,
    });

    // Payment for Booking 7
    await Payment.create({
      bookingId: booking7._id,
      paymentFor: 'booking',
      patientId: patient2._id,
      amount: 102,
      walletAmountUsed: 0,
      currency: 'usd',
      method: 'stripe',
      stripePaymentIntentId: 'pi_mock_7',
      status: 'succeeded',
      paidAt: dates.minus2d,
      createdAt: dates.minus2d,
    });

    // Payment for Booking 9
    await Payment.create({
      bookingId: booking9._id,
      paymentFor: 'booking',
      patientId: patient1._id,
      amount: 22.5,
      walletAmountUsed: 0,
      currency: 'usd',
      method: 'stripe',
      stripePaymentIntentId: 'pi_mock_9',
      status: 'succeeded',
      paidAt: dates.today,
      createdAt: dates.today,
    });

    console.log('Payment transaction logs created.');

    // 9. Seed Wallet Transactions
    console.log('Seeding wallet transaction ledgers...');
    // Patient 1 Wallet Ledger
    await WalletTransaction.create({
      userId: patient1._id,
      type: 'credit',
      amount: 172.5,
      reason: 'cancellation_refund',
      note: 'Initial wallet balance credit and trial promotion',
      createdAt: dates.minus15d,
    });

    await WalletTransaction.create({
      userId: patient1._id,
      type: 'debit',
      amount: 22.5,
      reason: 'booking_payment',
      bookingId: booking6._id,
      note: `Payment debit for Booking ${booking6._id.toString()}`,
      createdAt: dates.minus1d,
    });

    // Patient 2 Wallet Ledger
    await WalletTransaction.create({
      userId: patient2._id,
      type: 'credit',
      amount: 70,
      reason: 'cancellation_refund',
      note: 'Promotional loyalty program credit',
      createdAt: dates.minus25d,
    });

    await WalletTransaction.create({
      userId: patient2._id,
      type: 'debit',
      amount: 20,
      reason: 'booking_payment',
      bookingId: booking2._id,
      note: `Payment partial debit for Booking ${booking2._id.toString()}`,
      createdAt: dates.minus10d,
    });

    // Patient 3 Wallet Ledger: Cancelled Booking 3 refund
    await WalletTransaction.create({
      userId: patient3._id,
      type: 'credit',
      amount: 25,
      reason: 'cancellation_refund',
      bookingId: booking3._id,
      note: `Cancellation refund for Booking ${booking3._id.toString()}`,
      createdAt: dates.minus5d,
    });

    await WalletTransaction.create({
      userId: patient3._id,
      type: 'debit',
      amount: 25,
      reason: 'booking_payment',
      note: 'Administrative wallet balance payout withdrawal',
      createdAt: dates.minus5d,
    });

    console.log('Wallet transaction ledger successfully seeded.');
    console.log('Database seeded successfully! 🌱');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seed();
