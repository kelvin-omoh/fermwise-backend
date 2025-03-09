/**
 * Performance Test Script
 * 
 * This script tests the performance of the API endpoint for sending sensor data.
 * It measures the response time for each request.
 */

const fetch = require('node-fetch');

// Configuration
const SERVER_URL = "http://localhost:3000";
const ENDPOINT = "/api/device/readings";
const SERIAL_NUMBER = "PERF_TEST_DEVICE";
const NUM_REQUESTS = 5; // Number of requests to send

console.log(`Performance test for ${SERVER_URL}${ENDPOINT}`);
console.log(`Sending ${NUM_REQUESTS} requests...`);

// Function to generate sensor data
function generateSensorData() {
    return {
        serial_number: SERIAL_NUMBER,
        temperature: parseFloat((20 + Math.random() * 15).toFixed(1)),
        humidity: parseFloat((40 + Math.random() * 40).toFixed(1)),
        soil_temperature: parseFloat((15 + Math.random() * 10).toFixed(1)),
        soil_moisture: parseFloat((30 + Math.random() * 50).toFixed(1)),
        livestock_temperature: parseFloat((35 + Math.random() * 5).toFixed(1))
    };
}

// Function to send a request and measure response time
async function sendRequest(requestNum) {
    const data = generateSensorData();
    console.log(`\nRequest #${requestNum}: Sending data...`);

    const startTime = Date.now();

    try {
        const response = await fetch(`${SERVER_URL}${ENDPOINT}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data),
            timeout: 30000 // 30 second timeout
        });

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        if (response.ok) {
            const result = await response.json();
            console.log(`✅ Request #${requestNum}: Success in ${responseTime}ms`);
            console.log(`   Response status: ${response.status}`);
            console.log(`   Response size: ${JSON.stringify(result).length} bytes`);
            return { success: true, responseTime };
        } else {
            console.error(`❌ Request #${requestNum}: Failed with status ${response.status} in ${responseTime}ms`);
            console.error(`   Error: ${await response.text()}`);
            return { success: false, responseTime };
        }
    } catch (error) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        console.error(`❌ Request #${requestNum}: Error in ${responseTime}ms`);
        console.error(`   ${error.message}`);
        return { success: false, responseTime };
    }
}

// Run the performance test
async function runTest() {
    const results = [];

    for (let i = 1; i <= NUM_REQUESTS; i++) {
        const result = await sendRequest(i);
        results.push(result);

        // Add a small delay between requests
        if (i < NUM_REQUESTS) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    // Calculate statistics
    const successfulRequests = results.filter(r => r.success);
    const failedRequests = results.filter(r => !r.success);

    const totalTime = results.reduce((sum, r) => sum + r.responseTime, 0);
    const avgTime = totalTime / results.length;

    const minTime = Math.min(...results.map(r => r.responseTime));
    const maxTime = Math.max(...results.map(r => r.responseTime));

    console.log("\n=== PERFORMANCE TEST RESULTS ===");
    console.log(`Total requests: ${results.length}`);
    console.log(`Successful: ${successfulRequests.length}`);
    console.log(`Failed: ${failedRequests.length}`);
    console.log(`Average response time: ${avgTime.toFixed(2)}ms`);
    console.log(`Minimum response time: ${minTime}ms`);
    console.log(`Maximum response time: ${maxTime}ms`);

    if (avgTime > 5000) {
        console.log("\n⚠️ WARNING: Average response time is very high (>5s)");
        console.log("This could be due to:");
        console.log("1. Slow database operations");
        console.log("2. Network latency");
        console.log("3. Server processing overhead");
        console.log("4. Resource constraints");
    }
}

// Run the test
runTest().catch(error => {
    console.error("Test failed:", error);
    process.exit(1);
}); 