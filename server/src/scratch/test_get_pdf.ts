const BASE_URL = 'http://localhost:5001/api/v1';

async function run() {
  console.log('Logging in as patient...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'patient@lablink.com',
      password: 'password123',
    }),
  });
  
  if (!loginRes.ok) {
    console.error('Login failed:', loginRes.status, await loginRes.text());
    return;
  }
  
  const loginData: any = await loginRes.json();
  const token = loginData.accessToken;
  console.log('Logged in! Token retrieved.');

  console.log('Fetching patient reports...');
  const reportsRes = await fetch(`${BASE_URL}/reports/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!reportsRes.ok) {
    console.error('Reports fetch failed:', reportsRes.status, await reportsRes.text());
    return;
  }

  const reportsData: any = await reportsRes.json();
  const reports = reportsData.data.reports;
  console.log(`Found ${reports.length} reports.`);

  if (reports.length === 0) {
    console.log('No reports found to test. Exiting.');
    return;
  }

  const reportId = reports[0]._id;
  console.log(`Testing report ${reportId}...`);

  try {
    const viewRes = await fetch(`${BASE_URL}/reports/${reportId}/view`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('Response Status:', viewRes.status);
    console.log('Response Headers:');
    viewRes.headers.forEach((val, key) => {
      console.log(`  ${key}: ${val}`);
    });

    const buffer = await viewRes.arrayBuffer();
    console.log('Byte length:', buffer.byteLength);
    const textSnippet = new TextDecoder('utf-8').decode(buffer.slice(0, Math.min(buffer.byteLength, 150)));
    console.log('First 150 characters as string:', textSnippet);
  } catch (err: any) {
    console.error('Request failed!', err.message);
  }
}

run().catch(console.error);
