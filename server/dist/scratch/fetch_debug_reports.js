async function run() {
    const BASE_URL = 'http://localhost:5001/api/v1';
    console.log('Fetching debug reports list...');
    const res = await fetch(`${BASE_URL}/reports/debug-all`);
    if (!res.ok) {
        console.error('Fetch failed:', res.status, await res.text());
        return;
    }
    const data = await res.json();
    console.log(`Found ${data.count} reports in the database:`);
    console.log(JSON.stringify(data.reports, null, 2));
}
run().catch(console.error);
export {};
