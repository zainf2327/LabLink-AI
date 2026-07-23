import mongoose from 'mongoose';
import { env } from './env.js';
import dns from 'dns';
import SubscriptionPlan from '../models/SubscriptionPlan.model.js';
// Override DNS servers to Google and Cloudflare public DNS.
// This prevents MongoDB Atlas connection issues caused by DNS resolution failures in some local ISP/network or docker environments.
dns.setServers(['8.8.8.8', '1.1.1.1']);
const seedDefaultSubscriptionPlan = async () => {
    try {
        const existingDefault = await SubscriptionPlan.findOne({ isDefault: true });
        if (!existingDefault) {
            await SubscriptionPlan.create({
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
            console.log('Default Free subscription plan seeded successfully.');
        }
    }
    catch (err) {
        console.error('Failed to seed default subscription plan:', err);
    }
};
const connectDB = async () => {
    try {
        await mongoose.connect(env.MONGODB_URI);
        console.log('MongoDB connected successfully');
    }
    catch (error) {
        console.error('MongoDB connection failed:', error);
        process.exit(1);
    }
};
export default connectDB;
