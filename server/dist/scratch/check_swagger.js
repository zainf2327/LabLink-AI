async function run() {
    console.log('Sending request to http://localhost:5001/api-docs...');
    const res = await fetch('http://localhost:5001/api-docs');
    console.log('Response status:', res.status);
    console.log('Response content-type:', res.headers.get('content-type'));
    if (res.ok) {
        const html = await res.text();
        console.log('First 200 characters of response HTML:');
        console.log(html.substring(0, 200));
    }
    else {
        console.error('Failed to load Swagger UI:', await res.text());
    }
}
run().catch(console.error);
export {};
