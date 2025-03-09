/**
 * Optimized Sensor Readings Endpoint
 * 
 * This is a simplified version of the sensor readings endpoint
 * that focuses on performance by reducing database operations.
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');

// Create Express app
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Create HTTP server and Socket.io instance
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// In-memory storage for the last readings (for testing only)
const lastReadings = {};

// Socket.io connection handler
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Handle device registration
    socket.on('register_device', (data) => {
        console.log('Device registered:', data);
        socket.join(`device_${data.serial_number}`);
    });

    // Handle direct sensor data from Socket.io
    socket.on('sensor_data', async (data) => {
        try {
            console.log('Received sensor data via Socket.io:', data);

            const {
                serial_number,
                temperature,
                humidity,
                soil_temperature,
                soil_moisture,
                livestock_temperature
            } = data;

            // Validate required fields
            if (!serial_number) {
                socket.emit('error', {
                    error: 'Missing required fields',
                    required: ['serial_number']
                });
                return;
            }

            // Store the readings in memory (instead of database)
            const timestamp = new Date();
            const readings = [];

            // Process temperature reading
            if (temperature !== undefined && temperature !== null) {
                const reading = {
                    id: `temp_${Date.now()}`,
                    serial_number,
                    farm_id: 'farm_001',
                    type: 'temperature',
                    value: parseFloat(temperature),
                    unit: '°C',
                    timestamp
                };
                readings.push(reading);
            }

            // Process humidity reading
            if (humidity !== undefined && humidity !== null) {
                const reading = {
                    id: `hum_${Date.now()}`,
                    serial_number,
                    farm_id: 'farm_001',
                    type: 'humidity',
                    value: parseFloat(humidity),
                    unit: '%',
                    timestamp
                };
                readings.push(reading);
            }

            // Process soil temperature reading
            if (soil_temperature !== undefined && soil_temperature !== null) {
                const reading = {
                    id: `soil_temp_${Date.now()}`,
                    serial_number,
                    farm_id: 'farm_001',
                    type: 'soil_temperature',
                    value: parseFloat(soil_temperature),
                    unit: '°C',
                    timestamp
                };
                readings.push(reading);
            }

            // Process soil moisture reading
            if (soil_moisture !== undefined && soil_moisture !== null) {
                const reading = {
                    id: `soil_moist_${Date.now()}`,
                    serial_number,
                    farm_id: 'farm_001',
                    type: 'soil_moisture',
                    value: parseFloat(soil_moisture),
                    unit: '%',
                    timestamp
                };
                readings.push(reading);
            }

            // Process livestock temperature reading
            if (livestock_temperature !== undefined && livestock_temperature !== null) {
                const reading = {
                    id: `livestock_temp_${Date.now()}`,
                    serial_number,
                    farm_id: 'farm_001',
                    type: 'livestock_temperature',
                    value: parseFloat(livestock_temperature),
                    unit: '°C',
                    timestamp
                };
                readings.push(reading);
            }

            // Store the last readings for this device
            lastReadings[serial_number] = {
                serial_number,
                farm_id: 'farm_001',
                timestamp,
                readings
            };

            // Emit real-time data to all connected clients
            io.emit('sensor_data', {
                serial_number,
                farm_id: 'farm_001',
                timestamp,
                readings
            });

            // Also emit to device-specific room
            io.to(`device_${serial_number}`).emit('device_data', {
                serial_number,
                farm_id: 'farm_001',
                timestamp,
                readings
            });

            // Send acknowledgment back to the device
            socket.emit('sensor_data_ack', {
                success: true,
                message: 'Sensor readings recorded successfully',
                timestamp
            });

        } catch (error) {
            console.error('Error processing sensor data via Socket.io:', error);
            socket.emit('error', { error: 'Failed to record sensor readings' });
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

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
            const reading = {
                id: `temp_${Date.now()}`,
                serial_number,
                farm_id: 'farm_001',
                type: 'temperature',
                value: parseFloat(temperature),
                unit: '°C',
                timestamp
            };
            readings.push(reading);
        }

        // Process humidity reading
        if (humidity !== undefined && humidity !== null) {
            const reading = {
                id: `hum_${Date.now()}`,
                serial_number,
                farm_id: 'farm_001',
                type: 'humidity',
                value: parseFloat(humidity),
                unit: '%',
                timestamp
            };
            readings.push(reading);
        }

        // Process soil temperature reading
        if (soil_temperature !== undefined && soil_temperature !== null) {
            const reading = {
                id: `soil_temp_${Date.now()}`,
                serial_number,
                farm_id: 'farm_001',
                type: 'soil_temperature',
                value: parseFloat(soil_temperature),
                unit: '°C',
                timestamp
            };
            readings.push(reading);
        }

        // Process soil moisture reading
        if (soil_moisture !== undefined && soil_moisture !== null) {
            const reading = {
                id: `soil_moist_${Date.now()}`,
                serial_number,
                farm_id: 'farm_001',
                type: 'soil_moisture',
                value: parseFloat(soil_moisture),
                unit: '%',
                timestamp
            };
            readings.push(reading);
        }

        // Process livestock temperature reading
        if (livestock_temperature !== undefined && livestock_temperature !== null) {
            const reading = {
                id: `livestock_temp_${Date.now()}`,
                serial_number,
                farm_id: 'farm_001',
                type: 'livestock_temperature',
                value: parseFloat(livestock_temperature),
                unit: '°C',
                timestamp
            };
            readings.push(reading);
        }

        // Store the last readings for this device
        lastReadings[serial_number] = {
            serial_number,
            farm_id: 'farm_001',
            timestamp,
            readings
        };

        // Emit real-time data to all connected clients
        io.emit('sensor_data', {
            serial_number,
            farm_id: 'farm_001',
            timestamp,
            readings
        });

        // Also emit to device-specific room
        io.to(`device_${serial_number}`).emit('device_data', {
            serial_number,
            farm_id: 'farm_001',
            timestamp,
            readings
        });

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

// Get the last readings for a device
app.get('/api/device/:serial_number/readings', (req, res) => {
    const { serial_number } = req.params;

    if (lastReadings[serial_number]) {
        res.json(lastReadings[serial_number]);
    } else {
        res.status(404).json({ error: 'No readings found for this device' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Optimized server running on port ${PORT}`);
}); 