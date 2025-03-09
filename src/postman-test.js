/**
 * Postman-like Test Script
 * 
 * This script simulates Postman functionality for testing the API endpoint.
 */

const fetch = require('node-fetch');

// Configuration
const SERVER_URL = "http://localhost:3000"; // Updated server port
const ENDPOINT = "/api/device/readings";
const SERIAL_NUMBER = "POSTMAN_TEST";

// Generate test data
const testData = {
    serial_number: SERIAL_NUMBER,
    temperature: 25.5,
    humidity: 60.2,
    soil_temperature: 22.3,
    soil_moisture: 45.7,
    livestock_temperature: 38.2
};

console.log('='.repeat(80));
console.log('POSTMAN-LIKE TEST');
console.log('='.repeat(80));
console.log(`URL: ${SERVER_URL}${ENDPOINT}`);
console.log(`Method: POST`);
console.log(`Headers: Content-Type: application/json`);
console.log(`Body: ${JSON.stringify(testData, null, 2)}`);
console.log('='.repeat(80));

// Send the request
async function sendRequest() {
    console.log('Sending request...');
    const startTime = Date.now();

    try {
        const response = await fetch(`${SERVER_URL}${ENDPOINT}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        console.log(`Response time: ${responseTime}ms`);
        console.log(`Status: ${response.status} ${response.statusText}`);

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            console.log('Response body:');
            console.log(JSON.stringify(data, null, 2));
        } else {
            const text = await response.text();
            console.log('Response body:');
            console.log(text);
        }
    } catch (error) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        console.log(`Response time: ${responseTime}ms`);
        console.log('Error:');
        console.log(error.message);

        // Provide troubleshooting tips
        if (error.code === 'ECONNREFUSED') {
            console.log('\nTroubleshooting tips:');
            console.log('1. Make sure the server is running');
            console.log('2. Check if the port is correct');
            console.log('3. Try using a different port');
            console.log('4. Check for any firewall issues');
        }
    }
}

// Run the test
sendRequest(); 