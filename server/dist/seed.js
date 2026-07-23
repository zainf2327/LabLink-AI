import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dns from 'dns';
import { env } from './config/env.js';
dns.setServers(['8.8.8.8', '1.1.1.1']);
// Load env variables
dotenv.config();
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
async function seed() {
    const uri = env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI is not defined in env');
        process.exit(1);
    }
    try {
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');
        // 1. Clear database
        console.log('Clearing database...');
        await User.deleteMany({});
        await TestCategory.deleteMany({});
        await Test.deleteMany({});
        await Coupon.deleteMany({});
        await SubscriptionPlan.deleteMany({});
        await Subscription.deleteMany({});
        await Booking.deleteMany({});
        await Payment.deleteMany({});
        await FamilyMember.deleteMany({});
        await AuditLog.deleteMany({});
        await WalletTransaction.deleteMany({});
        console.log('Database cleared.');
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
        const staffUser1 = await User.create({
            name: 'Staff Worker',
            email: 'staff@lablink.com',
            passwordHash,
            phone: '+15550200',
            role: 'staff',
            isActive: true,
            isVerified: true,
        });
        const staffUser2 = await User.create({
            name: 'Alice Smith (Nurse)',
            email: 'alice.smith@lablink.com',
            passwordHash,
            phone: '+15550201',
            role: 'staff',
            isActive: true,
            isVerified: true,
        });
        const staffUser3 = await User.create({
            name: 'Bob Johnson (Phlebotomist)',
            email: 'bob.johnson@lablink.com',
            passwordHash,
            phone: '+15550202',
            role: 'staff',
            isActive: true,
            isVerified: true,
        });
        const staffUser4 = await User.create({
            name: 'Carol Williams (Inactive Tech)',
            email: 'carol.williams@lablink.com',
            passwordHash,
            phone: '+15550203',
            role: 'staff',
            isActive: false,
            isVerified: true,
        });
        const patientUser = await User.create({
            name: 'Patient Account',
            email: 'patient@lablink.com',
            passwordHash,
            phone: '+15550300',
            role: 'patient',
            walletBalance: 150, // Seeding patient with initial $150 credit for wallet flow testing
            isActive: true,
            isVerified: true,
        });
        console.log(`Created Users:\n- Admin: ${adminUser.email}\n- Staff (Active): ${staffUser1.email}, ${staffUser2.email}, ${staffUser3.email}\n- Staff (Inactive): ${staffUser4.email}\n- Patient: ${patientUser.email}`);
        // 3. Create Family Member first
        console.log('Creating family member for patient user...');
        const familyMember = await FamilyMember.create({
            userId: patientUser._id,
            name: 'Sarah Connor',
            dateOfBirth: '1985-11-10',
            relationship: 'spouse',
            gender: 'female',
        });
        console.log(`Created Family Member: ${familyMember.name} (Spouse)`);
        // 4. Create Subscription Plans
        console.log('Creating subscription plans...');
        const freePlan = await SubscriptionPlan.create({
            name: 'Free',
            price: 0,
            maxFamilyMembers: 0,
            features: ['Single user dashboard', 'Standard report delivery'],
            isActive: true,
            durationMonths: null,
            isDefault: true,
            testDiscountPercent: 0,
            freeHomeCollections: false,
            aiQuestionsPerMonth: 5,
        });
        const silverPlan = await SubscriptionPlan.create({
            name: 'Family Silver Plan',
            price: 29,
            maxFamilyMembers: 2,
            features: ['Dashboard for self & 2 family members', 'Priority report delivery', '10% discount on all tests'],
            isActive: true,
            durationMonths: 1,
            isDefault: false,
            testDiscountPercent: 10,
            freeHomeCollections: false,
            aiQuestionsPerMonth: 15,
        });
        const goldPlan = await SubscriptionPlan.create({
            name: 'Family Gold Plan',
            price: 59,
            maxFamilyMembers: 5,
            features: ['Dashboard for self & 5 family members', 'Express 12hr report delivery', '15% discount on all tests', 'Free home sampling'],
            isActive: true,
            durationMonths: 1,
            isDefault: false,
            testDiscountPercent: 15,
            freeHomeCollections: true,
            aiQuestionsPerMonth: 50,
        });
        console.log('Created subscription plans.');
        // 5. Create Active Subscription for Patient
        console.log('Assigning Family Silver Plan active subscription to patient user...');
        await Subscription.create({
            userId: patientUser._id,
            planId: silverPlan._id,
            status: 'active',
            startDate: new Date(),
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days later
            activeFamilyMemberIds: [familyMember._id],
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
        console.log('Active subscription created.');
        // 6. Create Test Categories
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
        // 7. Create Tests
        console.log('Creating tests catalog...');
        // Hematology tests
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
        // Biochemistry tests
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
        // Immunology tests
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
        // Radiology tests
        const xray = await Test.create({
            name: 'Chest X-Ray',
            description: 'Uses low dose radiation to image internal structures of chest and lungs.',
            type: 'radiology',
            categoryId: radiology._id,
            price: 120,
            preparationInstructions: 'Remove all metal objects before the scan.',
            duration: '4 Hours',
            isHomeCollectionAvailable: false, // Radiology requires visiting lab
            isActive: true,
        });
        console.log('Tests catalog created.');
        // 8. Create Coupons
        console.log('Creating coupons...');
        await Coupon.create({
            code: 'SAVE10',
            discountType: 'fixed',
            discountValue: 10,
            minOrderValue: 30,
            maxUses: 100,
            usedCount: 0,
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            isActive: true,
        });
        await Coupon.create({
            code: 'SAVE20',
            discountType: 'percentage',
            discountValue: 20,
            minOrderValue: 50,
            maxUses: 50,
            usedCount: 0,
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            isActive: true,
        });
        await Coupon.create({
            code: 'WELCOME15',
            discountType: 'fixed',
            discountValue: 15,
            minOrderValue: 0,
            maxUses: 200,
            usedCount: 0,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            isActive: true,
        });
        await Coupon.create({
            code: 'FREELAB',
            discountType: 'percentage',
            discountValue: 100,
            minOrderValue: 0,
            maxUses: 10,
            usedCount: 0,
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            isActive: true,
        });
        console.log('Coupons created.');
        // 9. Create Mock Bookings for Analytics Visualization
        console.log('Creating mock bookings for analytics...');
        const cbcTest = await Test.findOne({ name: 'Complete Blood Count (CBC)' });
        const glucoseTest = await Test.findOne({ name: 'Fasting Blood Sugar (FBS)' });
        const thyroidTest = await Test.findOne({ name: 'Thyroid Panel (T3, T4, TSH)' });
        if (cbcTest && glucoseTest && thyroidTest && patientUser) {
            const dates = [
                new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
                new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
                new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
                new Date(), // today
            ];
            // Booking 1
            const booking1 = await Booking.create({
                patientId: patientUser._id,
                tests: [{ testId: cbcTest._id, name: cbcTest.name, price: cbcTest.price }],
                status: 'completed',
                totalAmount: cbcTest.price,
                discountAmount: 0,
                finalAmount: cbcTest.price,
                walletAmountUsed: 0,
                homeSampling: { requested: false },
                createdAt: dates[0],
                updatedAt: dates[0]
            });
            // Booking 2
            const booking2 = await Booking.create({
                patientId: patientUser._id,
                tests: [{ testId: glucoseTest._id, name: glucoseTest.name, price: glucoseTest.price }],
                status: 'completed',
                totalAmount: glucoseTest.price,
                discountAmount: 0,
                finalAmount: glucoseTest.price,
                walletAmountUsed: 15, // Mocking that $15 was paid by wallet
                homeSampling: { requested: false },
                createdAt: dates[1],
                updatedAt: dates[1]
            });
            // Booking 3
            const booking3 = await Booking.create({
                patientId: patientUser._id,
                tests: [
                    { testId: cbcTest._id, name: cbcTest.name, price: cbcTest.price },
                    { testId: thyroidTest._id, name: thyroidTest.name, price: thyroidTest.price }
                ],
                status: 'scheduled',
                totalAmount: cbcTest.price + thyroidTest.price,
                discountAmount: 0,
                finalAmount: cbcTest.price + thyroidTest.price,
                walletAmountUsed: 0,
                homeSampling: {
                    requested: true,
                    address: '123 Health Ave, Islamabad',
                    scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
                },
                createdAt: dates[2],
                updatedAt: dates[2]
            });
            // Booking 4
            const booking4 = await Booking.create({
                patientId: patientUser._id,
                tests: [{ testId: thyroidTest._id, name: thyroidTest.name, price: thyroidTest.price }],
                status: 'sample_collected',
                totalAmount: thyroidTest.price,
                discountAmount: 10,
                finalAmount: thyroidTest.price - 10,
                walletAmountUsed: 0,
                homeSampling: { requested: false },
                createdAt: dates[3],
                updatedAt: dates[3]
            });
            console.log('Mock bookings created.');
            // 10. Seed diversified WalletTransaction records for Patient
            console.log('Seeding patient wallet transaction ledger...');
            await WalletTransaction.create({
                userId: patientUser._id,
                type: 'credit',
                amount: 45,
                reason: 'cancellation_refund',
                bookingId: booking1._id,
                note: `Refund for cancellation of Booking ${booking1._id.toString()}`,
                createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            });
            await WalletTransaction.create({
                userId: patientUser._id,
                type: 'debit',
                amount: 15,
                reason: 'booking_payment',
                bookingId: booking2._id,
                note: `Payment partial debit for Booking ${booking2._id.toString()}`,
                createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            });
            await WalletTransaction.create({
                userId: patientUser._id,
                type: 'credit',
                amount: 120,
                reason: 'cancellation_refund',
                note: 'Manual administrative balance adjustment',
                createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            });
            console.log('Wallet transaction ledger seeded.');
        }
        console.log('Database seeded successfully! 🌱');
    }
    catch (error) {
        console.error('Error seeding database:', error);
    }
    finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}
seed();
