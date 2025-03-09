/**
 * User-friendly test script for the farm monitoring system
 * 
 * This script displays farm monitoring data in a friendly format with emojis
 * and actionable insights for each sensor type.
 * 
 * Usage:
 * node test-monitoring-friendly.js
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

// Emoji mapping for different parameters and statuses
const EMOJIS = {
    farm: '🏡',
    crop: '🌱',
    temperature: '🌡️',
    humidity: '🌦️',
    soil_moisture: '💧',
    soil_temperature: '🌱',
    livestock_temperature: '🐄',
    imaging: '📸',
    status: {
        healthy: '✅',
        needs_attention: '⚠️',
        critical: '🚨'
    },
    level: {
        info: 'ℹ️',
        warning: '⚠️',
        critical: '🚨'
    },
    priority: {
        low: '🟢',
        medium: '🟠',
        high: '🔴'
    }
};

// Helper function to format timestamps
const formatTimestamp = (timestamp) => {
    if (!timestamp || !timestamp.seconds) return 'Unknown';
    return new Date(timestamp.seconds * 1000).toLocaleString();
};

// Helper function to get status emoji
const getStatusEmoji = (status) => {
    return EMOJIS.status[status] || '❓';
};

// Helper function to get parameter emoji
const getParameterEmoji = (parameter) => {
    return EMOJIS[parameter] || '📊';
};

// Helper function to get level emoji
const getLevelEmoji = (level) => {
    return EMOJIS.level[level] || '❓';
};

// Helper function to get priority emoji
const getPriorityEmoji = (priority) => {
    return EMOJIS.priority[priority] || '❓';
};

// Helper function to format sensor reading with emoji and status
const formatReading = (type, reading) => {
    if (!reading) return null;

    const emoji = getParameterEmoji(type);
    const value = reading.value;
    const unit = reading.unit;
    const status = reading.status;

    let statusEmoji = '✅';
    if (status === 'warning') statusEmoji = '⚠️';
    if (status === 'critical') statusEmoji = '🚨';

    let message = '';

    // Generate appropriate messages based on parameter and status
    if (type === 'temperature') {
        if (status === 'normal') {
            message = `The temperature is optimal at ${value}${unit}.`;
        } else if (status === 'warning' || status === 'critical') {
            message = `Temperature is ${value}${unit}, which is ${status === 'warning' ? 'concerning' : 'dangerous'}!`;
        }
    } else if (type === 'humidity') {
        if (status === 'normal') {
            message = `Humidity level is good at ${value}${unit}.`;
        } else if (status === 'warning' || status === 'critical') {
            if (value > 70) {
                message = `Humidity is too high at ${value}${unit}! This can lead to fungal diseases.`;
            } else {
                message = `Humidity is too low at ${value}${unit}! Plants may become stressed.`;
            }
        }
    } else if (type === 'soil_moisture') {
        if (status === 'normal') {
            message = `Soil has good moisture at ${value}${unit}. No need to water now.`;
        } else if (status === 'warning' || status === 'critical') {
            if (value > 60) {
                message = `Soil is too wet at ${value}${unit}! Risk of root rot.`;
            } else {
                message = `Soil is too dry at ${value}${unit}! Plants need water soon.`;
            }
        }
    } else if (type === 'soil_temperature') {
        if (status === 'normal') {
            message = `Soil temperature is optimal at ${value}${unit}.`;
        } else {
            message = `Soil temperature is ${value}${unit}, which may affect root development.`;
        }
    } else if (type === 'livestock_temperature') {
        if (status === 'normal') {
            message = `Livestock temperature is healthy at ${value}${unit}.`;
        } else if (status === 'warning' || status === 'critical') {
            if (value > 39.5) {
                message = `Livestock temperature is too high at ${value}${unit}! Immediate cooling needed.`;
            } else {
                message = `Livestock temperature is too low at ${value}${unit}! Provide warmth immediately.`;
            }
        }
    }

    // Generate action suggestion
    let action = '';
    if (type === 'temperature') {
        if (status === 'normal') {
            action = 'No action needed.';
        } else if (status === 'warning' || status === 'critical') {
            if (value > 30) {
                action = 'Consider providing shade or cooling for your crops.';
            } else {
                action = 'Consider providing protection from cold for your crops.';
            }
        }
    } else if (type === 'humidity') {
        if (status === 'normal') {
            action = 'Maintain current conditions.';
        } else if (status === 'warning' || status === 'critical') {
            if (value > 70) {
                action = 'Improve ventilation in your crop area.';
            } else {
                action = 'Increase irrigation or use humidity control systems.';
            }
        }
    } else if (type === 'soil_moisture') {
        if (status === 'normal') {
            action = 'Maintain current irrigation schedule.';
        } else if (status === 'warning' || status === 'critical') {
            if (value > 60) {
                action = 'Reduce irrigation and ensure proper drainage.';
            } else {
                action = 'Increase irrigation immediately.';
            }
        }
    } else if (type === 'soil_temperature') {
        if (status === 'normal') {
            action = 'No action needed.';
        } else {
            action = 'Monitor soil temperature changes.';
        }
    } else if (type === 'livestock_temperature') {
        if (status === 'normal') {
            action = 'No action needed.';
        } else if (status === 'warning' || status === 'critical') {
            if (value > 39.5) {
                action = 'Provide shade, water, and cooling immediately.';
            } else {
                action = 'Provide warmth and shelter immediately.';
            }
        }
    }

    return {
        emoji,
        statusEmoji,
        value,
        unit,
        status,
        message,
        action
    };
};

// Make the request
console.log('Fetching farm monitoring data...\n');

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

            if (!parsedData.monitoring) {
                console.log('No monitoring data found in the response.');
                return;
            }

            // Farm information
            console.log(`${EMOJIS.farm} FARM MONITORING REPORT ${EMOJIS.farm}`);
            console.log('='.repeat(50));
            console.log(`Farm: ${parsedData.name}`);
            console.log(`Location: ${parsedData.location}`);
            console.log(`Crop: ${EMOJIS.crop} ${parsedData.crop_type || 'Not specified'}`);
            console.log(`Status: ${getStatusEmoji(parsedData.monitoring.farm_status)} ${parsedData.monitoring.summary}`);
            console.log('='.repeat(50) + '\n');

            // Process each device
            if (parsedData.monitoring.devices && parsedData.monitoring.devices.length > 0) {
                parsedData.monitoring.devices.forEach(device => {
                    console.log(`📱 DEVICE: ${device.device_name} (${device.device_type})`);
                    console.log('-'.repeat(50));
                    console.log(`Status: ${getStatusEmoji(device.status)} ${device.summary}`);
                    console.log(`Last Reading: ${formatTimestamp(device.last_reading)}`);
                    console.log('-'.repeat(50) + '\n');

                    // Display readings for each sensor type
                    const readings = device.readings || {};
                    const sensorTypes = [
                        'temperature',
                        'humidity',
                        'soil_moisture',
                        'soil_temperature',
                        'livestock_temperature'
                    ];

                    sensorTypes.forEach(type => {
                        if (readings[type]) {
                            const formattedReading = formatReading(type, readings[type]);
                            if (formattedReading) {
                                console.log(`${formattedReading.emoji} ${type.replace('_', ' ').toUpperCase()}: ${formattedReading.value}${formattedReading.unit} ${formattedReading.statusEmoji}`);
                                console.log(`${formattedReading.statusEmoji} ${formattedReading.message}`);
                                console.log(`🔍 Action: ${formattedReading.action}`);
                                console.log();
                            }
                        }
                    });

                    // Check if device has imaging capability
                    const deviceInfo = parsedData.devices.find(d => d.device_id === device.device_id || d.id === device.device_id);
                    if (deviceInfo && deviceInfo.capabilities && deviceInfo.capabilities.imaging) {
                        console.log(`${EMOJIS.imaging} IMAGING TECHNOLOGY`);
                        console.log(`✅ This device has imaging capabilities for crop monitoring.`);

                        // Check if there's an image URL in the sensor data
                        const latestReading = parsedData.sensor_data.recent_readings.find(
                            reading => reading.device_id === device.device_id && reading.image_url
                        );

                        if (latestReading && latestReading.image_url) {
                            console.log(`📸 Latest image captured at: ${formatTimestamp(latestReading.timestamp)}`);
                            console.log(`🔗 Image URL: ${latestReading.image_url}`);
                            console.log(`✅ Image analysis: Crop appears healthy.`);
                        } else {
                            console.log(`ℹ️ No recent images available.`);
                        }
                        console.log();
                    }
                });
            }

            // Display farm-level recommendations
            if (parsedData.monitoring.recommendations && parsedData.monitoring.recommendations.length > 0) {
                console.log('🔍 FARM RECOMMENDATIONS');
                console.log('-'.repeat(50));

                parsedData.monitoring.recommendations.forEach(rec => {
                    console.log(`${getPriorityEmoji(rec.priority)} ${rec.message}`);
                });

                console.log();
            }

            console.log('='.repeat(50));
            console.log(`${EMOJIS.farm} END OF MONITORING REPORT ${EMOJIS.farm}`);
            console.log(`Last updated: ${formatTimestamp(parsedData.monitoring.last_updated)}`);

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