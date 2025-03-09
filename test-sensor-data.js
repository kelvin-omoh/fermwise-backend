/**
 * Test script for sensor data API
 * 
 * Usage:
 * 1. Start the server: npm run dev
 * 2. Update the configuration below with your actual values
 * 3. Run this script: node test-sensor-data.js
 * 
 * To get your auth token:
 * 1. Log in to the web application
 * 2. Open browser developer tools (F12)
 * 3. Go to Application tab > Local Storage
 * 4. Find the 'authToken' or 'token' key and copy its value
 */

const fetch = require('node-fetch');
require('dotenv').config();

// ======= CONFIGURATION - UPDATE THESE VALUES =======
const config = {
    apiUrl: `http://localhost:${process.env.PORT || 5000}`,
    authToken: 'YOUR_AUTH_TOKEN', // Get this from browser localStorage after logging in
    farmId: 'YOUR_FARM_ID',       // The ID of your farm
    deviceId: null,               // Optional: specific device ID to filter by
    limit: 50,                    // Number of results per page
    page: 1                       // Page number
};
// ===================================================

console.log(`Using API URL: ${config.apiUrl}`);

// Validate configuration
if (config.authToken === 'YOUR_AUTH_TOKEN' ||
    config.farmId === 'YOUR_FARM_ID') {
    console.error('⚠️ Please update the configuration in the script with your actual values!');
    console.error('See the instructions at the top of the file for how to get your auth token.');
    process.exit(1);
}

// Build query parameters
const buildQueryParams = () => {
    const params = new URLSearchParams();
    params.append('farm_id', config.farmId);

    if (config.deviceId) params.append('device_id', config.deviceId);
    if (config.limit) params.append('limit', config.limit.toString());
    if (config.page) params.append('page', config.page.toString());

    return params.toString();
};

// Fetch sensor data
const fetchSensorData = async () => {
    try {
        console.log('🔍 Fetching sensor data...');

        const queryParams = buildQueryParams();
        const url = `${config.apiUrl}/api/sensor-data?${queryParams}`;

        console.log(`Request URL: ${url}`);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${config.authToken}`,
                'Content-Type': 'application/json'
            }
        });

        // Handle non-JSON responses
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.log('❌ Non-JSON response received:', text);
            throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}...`);
        }

        const result = await response.json();

        if (!response.ok) {
            throw new Error(`Request failed: ${JSON.stringify(result)}`);
        }

        console.log('✅ Sensor data retrieved successfully!');
        console.log(`Total records: ${result.total}`);
        console.log(`Page: ${result.page} of ${Math.ceil(result.total / result.limit)}`);

        // Print sensor data summary
        if (result.data && result.data.length > 0) {
            console.log('\nSensor Data Summary:');
            console.log('-------------------');

            result.data.forEach((item, index) => {
                console.log(`[${index + 1}] ID: ${item.id}`);
                console.log(`    Device: ${item.device_id}`);
                console.log(`    Value: ${item.value} ${item.unit || ''}`);
                console.log(`    Timestamp: ${new Date(item.timestamp.seconds * 1000).toLocaleString()}`);
                console.log('-------------------');
            });
        } else {
            console.log('\nNo sensor data found.');
        }

        return result;
    } catch (error) {
        console.error('❌ Error fetching sensor data:', error);
        throw error;
    }
};

// Main function
const main = async () => {
    try {
        console.log('🚀 Starting sensor data test...');
        await fetchSensorData();
        console.log('🎉 Test completed successfully!');
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
};

// Run the test
main(); 