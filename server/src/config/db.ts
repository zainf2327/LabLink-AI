import mongoose from 'mongoose';
import { env } from './env.js';
import dns from 'dns';

dns.setServers(['8.8.8.8', '1.1.1.1']);
const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};

export default connectDB;