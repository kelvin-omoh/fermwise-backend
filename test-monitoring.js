/**
 * Test script for the farm endpoint with enhanced monitoring system
 * 
 * This script tests the farm endpoint with the enhanced monitoring system implementation,
 * including device-specific monitoring.
 * 
 * Usage:
 * node test-monitoring.js
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

console.log(`Making request to http://${config.host}:${config.port}${config.path}`);

// Make the request
const req = http.request(config, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

    let data = '';

    // Collect data chunks
    res.on('data', (chunk) => {
        data += chunk;
    });

    // Process the complete response
    res.on('end', () => {
        try {
            const parsedData = JSON.parse(data);

            // Check if monitoring data exists
            if (parsedData.monitoring) {
                console.log('\n===== FARM MONITORING SUMMARY =====\n');
                console.log(`Farm Name: ${parsedData.name}`);
                console.log(`Location: ${parsedData.location}`);
                console.log(`Crop Type: ${parsedData.crop_type}`);
                console.log(`Status: ${parsedData.monitoring.farm_status}`);
                console.log(`Summary: ${parsedData.monitoring.summary}`);

                // Display farm-level alerts
                if (parsedData.monitoring.alerts && parsedData.monitoring.alerts.length > 0) {
                    console.log('\n----- FARM ALERTS -----');
                    parsedData.monitoring.alerts.forEach((alert, index) => {
                        console.log(`\nAlert #${index + 1}:`);
                        console.log(`Level: ${alert.level}`);
                        console.log(`Parameter: ${alert.parameter}`);
                        console.log(`Message: ${alert.message}`);
                        console.log(`Value: ${alert.value} (Threshold: ${alert.threshold.min}-${alert.threshold.max})`);
                    });
                } else {
                    console.log('\nNo farm-level alerts detected.');
                }

                // Display farm-level recommendations
                if (parsedData.monitoring.recommendations && parsedData.monitoring.recommendations.length > 0) {
                    console.log('\n----- FARM RECOMMENDATIONS -----');
                    parsedData.monitoring.recommendations.forEach((rec, index) => {
                        console.log(`\nRecommendation #${index + 1}:`);
                        console.log(`Parameter: ${rec.parameter}`);
                        console.log(`Priority: ${rec.priority}`);
                        console.log(`Message: ${rec.message}`);
                    });
                } else {
                    console.log('\nNo farm-level recommendations available.');
                }

                // Display device-specific monitoring
                if (parsedData.monitoring.devices && parsedData.monitoring.devices.length > 0) {
                    console.log('\n===== DEVICE-SPECIFIC MONITORING =====');

                    parsedData.monitoring.devices.forEach((device, deviceIndex) => {
                        console.log(`\n----- DEVICE: ${device.device_name} (${device.device_type}) -----`);
                        console.log(`Status: ${device.status}`);
                        console.log(`Summary: ${device.summary}`);

                        // Display device readings
                        if (device.readings) {
                            console.log('\nCurrent Readings:');

                            if (device.readings.temperature) {
                                console.log(`Temperature: ${device.readings.temperature.value}${device.readings.temperature.unit} (${device.readings.temperature.status})`);
                            }

                            if (device.readings.humidity) {
                                console.log(`Humidity: ${device.readings.humidity.value}${device.readings.humidity.unit} (${device.readings.humidity.status})`);
                            }

                            if (device.readings.soil_moisture) {
                                console.log(`Soil Moisture: ${device.readings.soil_moisture.value}${device.readings.soil_moisture.unit} (${device.readings.soil_moisture.status})`);
                            }

                            if (device.readings.soil_temperature) {
                                console.log(`Soil Temperature: ${device.readings.soil_temperature.value}${device.readings.soil_temperature.unit} (${device.readings.soil_temperature.status})`);
                            }

                            if (device.readings.livestock_temperature) {
                                console.log(`Livestock Temperature: ${device.readings.livestock_temperature.value}${device.readings.livestock_temperature.unit} (${device.readings.livestock_temperature.status})`);
                            }
                        }

                        // Display device alerts
                        if (device.alerts && device.alerts.length > 0) {
                            console.log('\nDevice Alerts:');
                            device.alerts.forEach((alert, index) => {
                                console.log(`  ${index + 1}. [${alert.level.toUpperCase()}] ${alert.message}`);
                            });
                        } else {
                            console.log('\nNo device-specific alerts.');
                        }

                        // Display device recommendations
                        if (device.recommendations && device.recommendations.length > 0) {
                            console.log('\nDevice Recommendations:');
                            device.recommendations.forEach((rec, index) => {
                                console.log(`  ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.message}`);
                            });
                        } else {
                            console.log('\nNo device-specific recommendations.');
                        }
                    });
                }

                console.log('\n===== END OF MONITORING DATA =====\n');
            } else {
                console.log('No monitoring data found in the response.');
                console.log('Response data:', parsedData);
            }
        } catch (e) {
            console.error('Error parsing JSON response:', e);
            console.log('Raw response:', data);
        }
    });
});

// Handle request errors
req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

// End the request
req.end(); 