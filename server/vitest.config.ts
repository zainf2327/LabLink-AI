import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/tests/**/*.integration.ts', 'src/tests/**/*.test.ts', 'src/tests/**/*.ts'],
    exclude: ['src/tests/setup.ts'],
    setupFiles: ['./src/tests/setup.ts'],
    testTimeout: 15000,
    env: {
      NODE_ENV: 'test',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/test_dummy',
      JWT_ACCESS_SECRET: 'test_access_secret_longer_than_32_chars',
      JWT_REFRESH_SECRET: 'test_refresh_secret_longer_than_32_chars',
      ENCRYPTION_KEY: 'test_encryption_key_32_characters_long',
      STRIPE_SECRET_KEY: 'dummy_stripe',
      PINECONE_API_KEY: 'dummy_pinecone',
      PINECONE_INDEX_NAME: 'dummy_index',
      GOOGLE_CLIENT_ID: 'dummy_google_client_id',
      GOOGLE_CLIENT_SECRET: 'dummy_google_client_secret',
      GOOGLE_REDIRECT_URI: 'http://localhost:5001/dummy_callback',
      GROQ_API_KEY: 'dummy_groq',
      GEMINI_API_KEY: 'dummy_gemini',
      FRONTEND_URL: 'http://localhost:5173',
      RESEND_API_KEY: 'dummy_resend',
    },
  },
});
