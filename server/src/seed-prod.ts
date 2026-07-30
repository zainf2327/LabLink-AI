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

async function seedProd() {
  // Security Confirmation Check
  if (process.env.CONFIRM_SEED !== 'true') {
    console.error(`
⚠️  SECURITY WARNING: You are attempting to run the production seed script.
This script will clear and recreate Users, Tests, and all booking/transaction histories in the database.
Subscription Plans, Regions, and Coupons will NOT be touched.

To proceed, you must explicitly set the environment variable CONFIRM_SEED=true.
Example:
  On Unix/macOS:   CONFIRM_SEED=true npm run seed:prod
  On Windows PS:   $env:CONFIRM_SEED="true"; npm run seed:prod
`);
    process.exit(1);
  }

  const uri = env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not defined in env');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB (Production Context)');

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

    // 1. Confirm and Clear collections
    console.log('Wiping database (except Regions, Subscription Plans, Coupons)...');
    await User.deleteMany({});
    await TestCategory.deleteMany({});
    await Test.deleteMany({});
    await Subscription.deleteMany({});
    await Booking.deleteMany({});
    await Payment.deleteMany({});
    await FamilyMember.deleteMany({});
    await AuditLog.deleteMany({});
    await WalletTransaction.deleteMany({});
    console.log('Database wiped of transaction histories and user accounts.');

    // Helper to get active Region IDs
    const regionId1 = existingRegions[0]._id;
    const regionId2 = existingRegions[1] ? existingRegions[1]._id : existingRegions[0]._id;

    // 2. Create Users
    console.log('Hashing passwords...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    console.log('Creating production-ready users...');
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

    const staff1 = await User.create({
      name: 'Phlebotomist One',
      email: 'staff1@lablink.com',
      passwordHash,
      phone: '+15550201',
      role: 'staff',
      isActive: true,
      isVerified: true,
      assignedRegions: [regionId1],
      shifts: defaultShifts,
    });

    const staff2 = await User.create({
      name: 'Phlebotomist Two',
      email: 'staff2@lablink.com',
      passwordHash,
      phone: '+15550202',
      role: 'staff',
      isActive: true,
      isVerified: true,
      assignedRegions: [regionId2],
      shifts: defaultShifts,
    });

    const patient = await User.create({
      name: 'Patient Account',
      email: 'patient@lablink.com',
      passwordHash,
      phone: '+15550300',
      role: 'patient',
      walletBalance: 0,
      isActive: true,
      isVerified: true,
    });

    console.log(`Created Production Users:\n- Admin: ${adminUser.email}\n- Staff: ${staff1.email}, ${staff2.email}\n- Patient: ${patient.email}`);

    // 3. Create Test Categories
    console.log('Creating production test categories...');
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

    // 4. Create Tests
    console.log('Creating production tests catalog...');
    // Hematology
    await Test.create({
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
    await Test.create({
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

    await Test.create({
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

    await Test.create({
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
    await Test.create({
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

    await Test.create({
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
    await Test.create({
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

    console.log('Production tests catalog created.');
    console.log('Production database seeded successfully! 🌱');

  } catch (error) {
    console.error('Error seeding production database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedProd();
