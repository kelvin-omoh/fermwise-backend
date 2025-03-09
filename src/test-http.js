/**
 * HTTP Testing Script
 * 
 * This script tests the HTTP endpoint for sending sensor data.
 */

const fetch = require('node-fetch');

// Configuration
const SERVER_URL = "http://localhost:8080"; // Update with your server URL
const SERIAL_NUMBER = "TEST_DEVICE_002";
const TEST_DURATION = 30000; // Run test for 30 seconds
const SEND_INTERVAL = 5000; // Send data every 5 seconds

console.log(`Starting HTTP test for ${SERVER_URL}`);
console.log(`Test will run for ${TEST_DURATION / 1000} seconds`);

// Function to generate random sensor data
function generateSensorData() {
    return {
        serial_number: SERIAL_NUMBER,
        temperature: parseFloat((20 + Math.random() * 15).toFixed(1)), // 20-35°C
        humidity: parseFloat((40 + Math.random() * 40).toFixed(1)), // 40-80%
        soil_temperature: parseFloat((15 + Math.random() * 10).toFixed(1)), // 15-25°C
        soil_moisture: parseFloat((30 + Math.random() * 50).toFixed(1)), // 30-80%
        livestock_temperature: parseFloat((35 + Math.random() * 5).toFixed(1)) // 35-40°C
    };
}

// Function to send test data via HTTP
async function sendHttpData() {
    const data = generateSensorData();
    console.log(`📤 Sending HTTP data: ${JSON.stringify(data)}`);

    try {
        const response = await fetch(`${SERVER_URL}/api/device/readings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const result = await response.json();
            console.log(`✅ HTTP response: ${JSON.stringify(result)}`);
        } else {
            console.error(`🔴 HTTP error: ${response.status} - ${await response.text()}`);
        }
    } catch (error) {
        console.error(`🔴 HTTP request failed: ${error.message}`);
    }
}

// Start sending data at regular intervals
let running = true;
const interval = setInterval(() => {
    if (running) {
        sendHttpData();
    } else {
        clearInterval(interval);
    }
}, SEND_INTERVAL);

// Send initial data
sendHttpData();

// End test after specified duration
setTimeout(() => {
    console.log(`⏱️ Test duration (${TEST_DURATION / 1000}s) completed`);
    running = false;
    clearInterval(interval);
    process.exit(0);
}, TEST_DURATION);

// Handle process termination
process.on('SIGINT', () => {
    console.log('Stopping test...');
    running = false;
    clearInterval(interval);
    process.exit();
}); 