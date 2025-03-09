/**
 * Simple Server
 * 
 * This is a very simple server that just handles the POST request
 * for sensor readings.
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Create Express app
const app = express();
const PORT = 5000; // Use a different port

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Endpoint for IoT devices to send sensor readings
app.post('/api/device/readings', (req, res) => {
    try {
        console.time('process-readings');
        const {
            serial_number,
            temperature,
            humidity,
            soil_temperature,
            soil_moisture,
            livestock_temperature
        } = req.body;

        console.log('Received sensor data:', {
            serial_number,
            temperature,
            humidity,
            soil_temperature,
            soil_moisture,
            livestock_temperature
        });

        // Validate required fields
        if (!serial_number) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['serial_number']
            });
        }

        // Create timestamp for the reading
        const timestamp = new Date();
        const readings = [];

        // Process temperature reading
        if (temperature !== undefined && temperature !== null) {
            readings.push({
                id: `temp_${Date.now()}`,
                serial_number,
                farm_id: 'farm_001',
                type: 'temperature',
                value: parseFloat(temperature),
                unit: '°C',
                timestamp
            });
        }

        // Process humidity reading
        if (humidity !== undefined && humidity !== null) {
            readings.push({
                id: `hum_${Date.now()}`,
                serial_number,
                farm_id: 'farm_001',
                type: 'humidity',
                value: parseFloat(humidity),
                unit: '%',
                timestamp
            });
        }

        // Process soil temperature reading
        if (soil_temperature !== undefined && soil_temperature !== null) {
            readings.push({
                id: `soil_temp_${Date.now()}`,
                serial_number,
                farm_id: 'farm_001',
                type: 'soil_temperature',
                value: parseFloat(soil_temperature),
                unit: '°C',
                timestamp
            });
        }

        // Process soil moisture reading
        if (soil_moisture !== undefined && soil_moisture !== null) {
            readings.push({
                id: `soil_moist_${Date.now()}`,
                serial_number,
                farm_id: 'farm_001',
                type: 'soil_moisture',
                value: parseFloat(soil_moisture),
                unit: '%',
                timestamp
            });
        }

        // Process livestock temperature reading
        if (livestock_temperature !== undefined && livestock_temperature !== null) {
            readings.push({
                id: `livestock_temp_${Date.now()}`,
                serial_number,
                farm_id: 'farm_001',
                type: 'livestock_temperature',
                value: parseFloat(livestock_temperature),
                unit: '°C',
                timestamp
            });
        }

        console.timeEnd('process-readings');

        // Return success response with all readings
        res.status(201).json({
            message: 'Sensor readings recorded successfully',
            serial_number,
            farm_id: 'farm_001',
            timestamp,
            readings
        });
    } catch (error) {
        console.error('Error recording sensor readings:', error);
        res.status(500).json({ error: 'Failed to record sensor readings' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Simple server running on port ${PORT}`);
}); 