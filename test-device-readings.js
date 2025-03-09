/**
 * Test script for IoT device to send sensor readings
 * 
 * This script simulates an IoT device sending sensor readings to the FermWise API.
 * It demonstrates the "Take Reading" functionality from the IoT device menu.
 */

const fetch = require('node-fetch');

// Configuration - Update with your actual serial number
const config = {
    apiUrl: 'http://localhost:8080',     // Update with your API URL
    serial_number: 'FW-DEVICE-12345'     // Update with your device serial number
};

// Function to generate random sensor readings within realistic ranges
function generateSensorReadings() {
    return {
        temperature: (15 + Math.random() * 20).toFixed(1),         // 15-35°C
        humidity: (40 + Math.random() * 40).toFixed(1),            // 40-80%
        soil_temperature: (10 + Math.random() * 20).toFixed(1),    // 10-30°C
        soil_moisture: (20 + Math.random() * 60).toFixed(1),       // 20-80%
        livestock_temperature: (37 + Math.random() * 3).toFixed(1) // 37-40°C
    };
}

// Function to send sensor readings to the API
async function sendSensorReadings() {
    try {
        console.log('📊 Generating sensor readings...');
        const readings = generateSensorReadings();

        console.log('📡 Sending readings to FermWise API:');
        console.log(JSON.stringify(readings, null, 2));

        // Prepare the request payload
        const payload = {
            ...readings,
            serial_number: config.serial_number
        };

        // Send the request to the API
        const response = await fetch(`${config.apiUrl}/api/device/readings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        // Parse the response
        const contentType = response.headers.get('content-type');
        let result;

        if (contentType && contentType.includes('application/json')) {
            result = await response.json();
        } else {
            result = await response.text();
        }

        // Handle the response
        if (response.ok) {
            console.log('✅ Readings sent successfully!');
            console.log('Response:', JSON.stringify(result, null, 2));
        } else {
            console.error('❌ Failed to send readings:', result);
        }
    } catch (error) {
        console.error('❌ Error sending sensor readings:', error.message);
    }
}

// Execute the function
console.log('🌱 FermWise IoT Device - Take Reading Test');
console.log('==========================================');
sendSensorReadings(); 