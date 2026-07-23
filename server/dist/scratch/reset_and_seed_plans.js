import mongoose from 'mongoose';
import dns from 'dns';
import dotenv from 'dotenv';
import SubscriptionPlan from '../models/SubscriptionPlan.model.js';
import Subscription from '../models/Subscription.model.js';
import User from '../models/User.model.js';
import { subscriptionService } from '../services/subscription.service.js';
import { env } from '../config/env.js';
dns.setServers(['8.8.8.8', '1.1.1.1']);
dotenv.config();
async function run() {
    const uri = env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI is not set');
        process.exit(1);
    }
    console.log('Connecting to database...');
    await mongoose.connect(uri);
    console.log('Clearing existing subscriptions and plans...');
    await SubscriptionPlan.deleteMany({});
    await Subscription.deleteMany({});
    console.log('Collections cleared.');
    console.log('Inserting subscription plans...');
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
    const premiumPlan = await SubscriptionPlan.create({
        name: 'Family Premium Plan',
        price: 99,
        maxFamilyMembers: 10,
        features: ['Dashboard for self & 10 family members', 'Super Express report delivery', '20% discount on all tests', 'Unlimited free home sampling'],
        isActive: true,
        durationMonths: 12,
        isDefault: false,
        testDiscountPercent: 20,
        freeHomeCollections: true,
        aiQuestionsPerMonth: 100,
    });
    console.log('Seeded plans successfully:');
    console.log(`- ${freePlan.name} (${freePlan._id})`);
    console.log(`- ${silverPlan.name} (${silverPlan._id})`);
    console.log(`- ${goldPlan.name} (${goldPlan._id})`);
    console.log(`- ${premiumPlan.name} (${premiumPlan._id})`);
    console.log('Assigning Free plan active subscriptions to all existing patients...');
    const patients = await User.find({ role: 'patient' });
    for (const patient of patients) {
        const sub = await subscriptionService.createSubscriptionFromPlan(patient._id.toString(), freePlan);
        await subscriptionService.initializeFamilyMembers(sub, freePlan);
        console.log(`- Seeded Free subscription for patient: ${patient.email}`);
    }
    console.log('Database script completed successfully.');
    await mongoose.disconnect();
    process.exit(0);
}
run().catch(err => {
    console.error('Script failed:', err);
    mongoose.disconnect();
    process.exit(1);
});
