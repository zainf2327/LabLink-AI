import dotenv from 'dotenv';
import { z } from 'zod';
// Load environment variables from .env file
dotenv.config({ override: true });
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(5001),
    MONGODB_URI: z.string().refine(val => val.startsWith('mongodb://') || val.startsWith('mongodb+srv://'), {
        message: 'MONGODB_URI must start with mongodb:// or mongodb+srv://'
    }),
    JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters long'),
    JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters long'),
    STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is required'),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    PINECONE_API_KEY: z.string().min(1, 'PINECONE_API_KEY is required'),
    PINECONE_INDEX_NAME: z.string().min(1, 'PINECONE_INDEX_NAME is required'),
    GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),
    GOOGLE_CLIENT_SECRET: z.string().min(1, 'GOOGLE_CLIENT_SECRET is required'),
    GOOGLE_REDIRECT_URI: z.string().url('GOOGLE_REDIRECT_URI must be a valid URL'),
    ENCRYPTION_KEY: z.string().min(32, 'ENCRYPTION_KEY must be at least 32 characters').optional(),
    GROQ_API_KEY: z.string().min(1, 'GROQ_API_KEY is required'),
    GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
    FRONTEND_URL: z.string().url('FRONTEND_URL must be a valid URL'),
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    AWS_REGION: z.string().optional(),
    AWS_S3_BUCKET_NAME: z.string().optional(),
    AWS_SES_FROM_EMAIL: z.string().optional(),
    INCLUDE_PATIENT_NAME_IN_FILENAME: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(true),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(JSON.stringify(parsed.error.format(), null, 2));
    process.exit(1);
}
export const env = parsed.data;
