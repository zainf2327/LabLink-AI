import mongoose from 'mongoose';
import { env } from '../config/env.js';
import User from '../models/User.model.js';
import dns from 'dns';

dns.setServers(['8.8.8.8', '1.1.1.1']);

const BASE_URL = `http://127.0.0.1:${env.PORT}/api/v1`;

async function testAuth() {
  console.log('Connecting to database...');
  await mongoose.connect(env.MONGODB_URI);
  console.log('Connected.');

  const testEmail = 'test.auth@example.com';

  // 1. Pre-cleanup
  console.log(`Checking for existing test user: ${testEmail}`);
  const existing = await User.findOne({ email: testEmail });
  if (existing) {
    console.log('Test user exists. Deleting...');
    await User.deleteOne({ email: testEmail });
    console.log('Deleted.');
  }

  // 2. Perform Register API Call
  console.log('1. Testing Register API...');
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Auth User',
      email: testEmail,
      password: 'Password123!',
      phone: '1234567890',
    }),
  });
  const regData = await regRes.json();
  console.log('Register Response Status:', regRes.status);
  console.log('Register Response Body:', JSON.stringify(regData, null, 2));

  // 3. Register Duplicate test
  console.log('2. Testing Duplicate Register API...');
  const dupRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Auth User',
      email: testEmail,
      password: 'Password123!',
      phone: '1234567890',
    }),
  });
  const dupData = await dupRes.json();
  console.log('Duplicate Register Status:', dupRes.status);
  console.log('Duplicate Register Body:', JSON.stringify(dupData, null, 2));

  // Verify the user in DB so login can succeed
  await User.updateOne({ email: testEmail }, { isVerified: true });

  // 4. Login API Test
  console.log('3. Testing Login API...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'Password123!',
    }),
  });
  const loginData = await loginRes.json();
  console.log('Login Response Status:', loginRes.status);
  console.log('Login Response Body:', JSON.stringify(loginData, null, 2));

  if (loginRes.status === 200) {
    const token = loginData.accessToken;
    const cookies = loginRes.headers.get('set-cookie');
    console.log('Set-Cookie Header:', cookies);

    // 5. Testing getMe Profile API
    console.log('4. Testing Me API...');
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const meData = await meRes.json();
    console.log('Me API Response Status:', meRes.status);
    console.log('Me API Response Body:', JSON.stringify(meData, null, 2));
  }

  process.exit(0);
}

testAuth().catch((err) => {
  console.error('Test script crashed:', err);
  process.exit(1);
});
