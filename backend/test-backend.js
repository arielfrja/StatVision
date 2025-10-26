const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = 'http://localhost:3000';

async function testRegisterEndpoint() {
    console.log('Testing /register endpoint...');
    const firebaseUid = `test-uid-${Date.now()}`;
    const email = `testuser-${Date.now()}@example.com`;

    try {
        const response = await fetch(`${BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ firebaseUid, email }),
        });

        const text = await response.text(); // Get response as text to handle non-JSON
        console.log(`Response Status: ${response.status}`);
        console.log(`Response Body: ${text}`);

        if (response.ok) {
            console.log('User registered successfully!');
        } else {
            console.error('Failed to register user.');
        }
    } catch (error) {
        console.error('Error testing /register endpoint:', error);
    }
}

async function main() {
    // Ensure the backend server is running before running this script
    console.log('Ensure your backend server is running on http://localhost:3000 before proceeding.');
    console.log('Waiting 5 seconds for server to be ready...');
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for server to start

    await testRegisterEndpoint();
}

main();
