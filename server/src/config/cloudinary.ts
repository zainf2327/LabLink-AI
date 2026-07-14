import { env } from './env.js';

// Stub Cloudinary configuration
export const cloudinaryConfig = {
  cloudName: env.CLOUDINARY_CLOUD_NAME || '',
  apiKey: env.CLOUDINARY_API_KEY || '',
  apiSecret: env.CLOUDINARY_API_SECRET || '',
};

console.log('Cloudinary Config initialized (Stub)');
