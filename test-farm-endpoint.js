/**
 * Test script for the enhanced farm endpoint
 * 
 * Usage:
 * 1. Update the configuration below with your actual values
 * 2. Run this script: node test-farm-endpoint.js
 */

require('dotenv').config();
const fetch = require('node-fetch');

// ======= CONFIGURATION - UPDATE THESE VALUES =======
const config = {
    apiUrl: `http://localhost:8080`,
    authToken: 'YOUR_AUTH_TOKEN', // Get this from browser localStorage after logging in
    farmId: 'cvs0zzBaayfJP4xKzZqr'  // The ID of your farm
};
// ===================================================

console.log(`Using API URL: ${config.apiUrl}`);

// Validate configuration
if (config.authToken === 'YOUR_AUTH_TOKEN') {
    console.error('⚠️ Please update the configuration in the script with your actual auth token!');
    process.exit(1);
}

// Fetch farm data with devices and sensor data
const fetchFarmData = async () => {
    try {
        console.log('🔍 Fetching farm data with devices and sensor data...');
        console.log(`Farm ID: ${config.farmId}`);

        const url = `${config.apiUrl}/api/farms/${config.farmId}`;
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

        console.log('✅ Farm data retrieved successfully!');

        // Print farm summary
        console.log('\nFarm Summary:');
        console.log('-------------------');
        console.log(`Farm ID: ${result.id}`);
        console.log(`Name: ${result.name}`);
        console.log(`Location: ${result.location}`);
        console.log(`Owner ID: ${result.owner_id}`);

        // Print devices summary
        console.log('\nDevices Summary:');
        console.log('-------------------');
        console.log(`Total Devices: ${result.devices.length}`);

        if (result.devices.length > 0) {
            result.devices.forEach((device, index) => {
                console.log(`\nDevice ${index + 1}:`);
                console.log(`  ID: ${device.id}`);
                console.log(`  Device ID: ${device.device_id}`);
                console.log(`  Type: ${device.type}`);
                console.log(`  Status: ${device.status}`);
            });
        } else {
            console.log('No devices found for this farm.');
        }

        // Print sensor data summary
        console.log('\nSensor Data Summary:');
        console.log('-------------------');
        console.log(`Total Readings: ${result.sensor_data.total_readings}`);
        console.log(`Time Range: ${result.sensor_data.time_range.from} to ${result.sensor_data.time_range.to}`);

        if (result.sensor_data.total_readings > 0) {
            console.log('\nRecent Readings by Device:');

            for (const [deviceId, readings] of Object.entries(result.sensor_data.by_device)) {
                console.log(`\nDevice ID: ${deviceId}`);
                console.log(`  Number of Readings: ${readings.length}`);

                if (readings.length > 0) {
                    const latestReading = readings[0];
                    console.log(`  Latest Reading:`);
                    console.log(`    Timestamp: ${new Date(latestReading.timestamp.seconds * 1000).toLocaleString()}`);

                    if (latestReading.value !== undefined) {
                        console.log(`    Value: ${latestReading.value} ${latestReading.unit || ''}`);
                    }

                    // Print other properties if they exist
                    Object.keys(latestReading).forEach(key => {
                        if (!['id', 'device_id', 'farm_id', 'timestamp', 'value', 'unit'].includes(key)) {
                            console.log(`    ${key}: ${JSON.stringify(latestReading[key])}`);
                        }
                    });
                }
            }
        } else {
            console.log('No sensor data found for this farm.');
        }

        return result;
    } catch (error) {
        console.error('❌ Error fetching farm data:', error);
        throw error;
    }
};

// Main function
const main = async () => {
    try {
        console.log('🚀 Testing Farm Endpoint...\n');
        await fetchFarmData();
        console.log('\n🎉 Test completed successfully!');
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
};

// Run the test
main(); 