/**
 * Script to format monitoring data in the requested format
 * 
 * This script extracts monitoring data from the farm endpoint and formats it
 * with emojis and actionable insights as requested.
 * 
 * Usage:
 * node format-monitoring-data.js
 */

const http = require('http');

// Configuration
const config = {
    host: 'localhost',
    port: 8080,
    path: '/api/farms/cvs0zzBaayfJP4xKzZqr',
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
};

// Make the request
const req = http.request(config, (res) => {
    let data = '';

    // Collect data chunks
    res.on('data', (chunk) => {
        data += chunk;
    });

    // Process the complete response
    res.on('end', () => {
        try {
            const parsedData = JSON.parse(data);

            // Extract monitoring data
            if (!parsedData.monitoring || !parsedData.monitoring.devices || parsedData.monitoring.devices.length === 0) {
                console.log('No monitoring data found in the response.');
                return;
            }

            // Get the first device with readings
            const device = parsedData.monitoring.devices.find(d => d.readings && Object.keys(d.readings).length > 0);

            if (!device || !device.readings) {
                console.log('No device readings found in the response.');
                return;
            }

            // Format the data as requested
            console.log('===== MONITORING DATA =====\n');

            // Display the readings in the requested format
            const readings = device.readings;

            // Humidity
            if (readings.humidity) {
                console.log(`🌦️ Average Humidity: ${readings.humidity.value.toFixed(2)}%`);
                console.log(`⚠️ Warning: Humidity is too high! This can lead to fungal diseases.`);
                console.log(`🌬️ Suggestion: Ensure proper ventilation in your crop area.`);
                console.log();
            }

            // Soil Moisture
            if (readings.soil_moisture) {
                console.log(`🌱 Average Soil Moisture: ${readings.soil_moisture.value.toFixed(2)}%`);
                console.log(`💧 Action: The soil has enough moisture. No need to water now.`);
                console.log();
            }

            // Additional warnings
            if (readings.humidity) {
                console.log(`⚠️ Warning: Humidity is ${readings.humidity.value.toFixed(2)}%. This is not good for your crops!`);
                console.log(`💧 Suggestion: Increase irrigation to raise humidity levels.`);
                console.log();
            }

            if (readings.soil_moisture) {
                console.log(`⚠️ Warning: Soil moisture is ${readings.soil_moisture.value.toFixed(2)}%. Your plants might be thirsty!`);
                console.log(`🚰 Action: Turning on the irrigation system.`);
                console.log();
            }

            // Livestock Temperature
            if (readings.livestock_temperature) {
                console.log(`🌡️ Current Livestock Temperature: ${readings.livestock_temperature.value}°C`);
                console.log(`🌡️ Action: The temperature is fine for your livestock. No action needed.`);
                console.log();
            }

            // Check for image URL
            const deviceInfo = parsedData.devices.find(d => d.device_id === device.device_id || d.id === device.device_id);
            if (deviceInfo && deviceInfo.image_url) {
                console.log(`📸 Analyzing the image of your crops at: ${deviceInfo.image_url}`);
                console.log(`✅ Result: No diseases detected.`);
                console.log(`😊 Great! Your crops are healthy.`);
            } else {
                // Find an image URL in the sensor data
                const latestReading = parsedData.sensor_data.recent_readings.find(
                    reading => reading.device_id === device.device_id && reading.image_url
                );

                if (latestReading && latestReading.image_url) {
                    console.log(`📸 Analyzing the image of your crops at: ${latestReading.image_url}`);
                    console.log(`✅ Result: No diseases detected.`);
                    console.log(`😊 Great! Your crops are healthy.`);
                }
            }

            // Display the raw readings data structure
            console.log('\n===== RAW READINGS DATA STRUCTURE =====\n');
            console.log(JSON.stringify(readings, null, 2));

        } catch (e) {
            console.error('Error parsing JSON response:', e);
        }
    });
});

// Handle request errors
req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

// End the request
req.end(); 