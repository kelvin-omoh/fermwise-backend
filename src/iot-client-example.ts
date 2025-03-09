/**
 * IoT Device Client Example (TypeScript version)
 * 
 * This is an example of how an IoT device can connect to the server
 * and send real-time sensor data using Socket.io.
 * 
 * To use this example:
 * 1. Install dependencies: npm install socket.io-client @types/socket.io-client
 * 2. Update the SERVER_URL to point to your backend server
 * 3. Update the SERIAL_NUMBER to match your device's serial number
 * 4. Compile with TypeScript and run on your IoT device
 */

import { io, Socket } from 'socket.io-client';
import fetch from 'node-fetch';

// Configuration
const SERVER_URL: string = 'http://localhost:8080'; // Update with your server URL
const SERIAL_NUMBER: string = 'DEVICE_001'; // Update with your device's serial number
const SEND_INTERVAL: number = 5000; // Send data every 5 seconds

// Define sensor data interface
interface SensorData {
    serial_number: string;
    temperature?: number;
    humidity?: number;
    soil_temperature?: number;
    soil_moisture?: number;
    livestock_temperature?: number;
}

// Connect to the server
const socket: Socket = io(SERVER_URL);

// Handle connection events
socket.on('connect', () => {
    console.log('Connected to server with socket ID:', socket.id);

    // Register the device
    socket.emit('register_device', {
        serial_number: SERIAL_NUMBER,
        device_type: 'agricultural_sensor'
    });

    // Send test data
    const testData: SensorData = {
        serial_number: SERIAL_NUMBER,
        temperature: 25.5,
        humidity: 60.2,
        soil_temperature: 22.3,
        soil_moisture: 45.7,
        livestock_temperature: 38.2
    };

    console.log('Sending test data:', testData);
    socket.emit('sensor_data', testData);

    // Listen for acknowledgment
    socket.on('sensor_data_ack', (data) => {
        console.log('Server acknowledged data:', data);
        // Disconnect after receiving acknowledgment
        setTimeout(() => {
            socket.disconnect();
            process.exit(0);
        }, 1000);
    });

    socket.on('error', (error: Error) => {
        console.error('Server error:', error);
        socket.disconnect();
        process.exit(1);
    });
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
});

socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
});

// Function to generate random sensor data (simulate real sensors)
function generateSensorData(): SensorData {
    return {
        serial_number: SERIAL_NUMBER,
        temperature: parseFloat((20 + Math.random() * 15).toFixed(1)), // 20-35°C
        humidity: parseFloat((40 + Math.random() * 40).toFixed(1)), // 40-80%
        soil_temperature: parseFloat((15 + Math.random() * 10).toFixed(1)), // 15-25°C
        soil_moisture: parseFloat((30 + Math.random() * 50).toFixed(1)), // 30-80%
        livestock_temperature: parseFloat((35 + Math.random() * 5).toFixed(1)) // 35-40°C
    };
}

// Function to send data to the server
async function sendSensorData(): Promise<void> {
    const data: SensorData = generateSensorData();
    console.log('Sending sensor data:', data);

    // Method 1: Send data via Socket.io
    socket.emit('sensor_data', data);

    // Method 2: Send data via HTTP POST (as a backup)
    try {
        const response = await fetch(`${SERVER_URL}/api/device/readings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        console.log('HTTP response:', result);
    } catch (error) {
        console.error('HTTP error:', error);
    }
}

// Start sending data at regular intervals
function startSendingData(): void {
    console.log(`Starting to send data every ${SEND_INTERVAL / 1000} seconds`);

    // Send initial data
    sendSensorData();

    // Set up interval to send data regularly
    setInterval(sendSensorData, SEND_INTERVAL);
}

// Handle process termination
process.on('SIGINT', () => {
    console.log('Disconnecting from server...');
    socket.disconnect();
    process.exit();
}); 