/**
 * IoT Device Client Example
 * 
 * This is an example of how an IoT device can connect to the server
 * and send real-time sensor data using Socket.io.
 * 
 * To use this example:
 * 1. Install dependencies: npm install socket.io-client
 * 2. Update the SERVER_URL to point to your backend server
 * 3. Update the SERIAL_NUMBER to match your device's serial number
 * 4. Run this script on your IoT device
 */

const { io } = require('socket.io-client');

// Configuration
const SERVER_URL = 'http://localhost:8080'; // Update with your server URL
const SERIAL_NUMBER = 'DEVICE_001'; // Update with your device's serial number
const SEND_INTERVAL = 5000; // Send data every 5 seconds

// Connect to the server
const socket = io(SERVER_URL);

// Handle connection events
socket.on('connect', () => {
    console.log('Connected to server with socket ID:', socket.id);

    // Register the device
    socket.emit('register_device', {
        serial_number: SERIAL_NUMBER,
        device_type: 'agricultural_sensor'
    });

    // Start sending sensor data
    startSendingData();
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
});

socket.on('error', (error) => {
    console.error('Socket error:', error);
});

// Function to generate random sensor data (simulate real sensors)
function generateSensorData() {
    return {
        serial_number: SERIAL_NUMBER,
        temperature: (20 + Math.random() * 15).toFixed(1), // 20-35°C
        humidity: (40 + Math.random() * 40).toFixed(1), // 40-80%
        soil_temperature: (15 + Math.random() * 10).toFixed(1), // 15-25°C
        soil_moisture: (30 + Math.random() * 50).toFixed(1), // 30-80%
        livestock_temperature: (35 + Math.random() * 5).toFixed(1) // 35-40°C
    };
}

// Function to send data to the server
function sendSensorData() {
    const data = generateSensorData();
    console.log('Sending sensor data:', data);

    // Method 1: Send data via Socket.io
    socket.emit('sensor_data', data);

    // Method 2: Send data via HTTP POST (as a backup)
    fetch(`${SERVER_URL}/api/device/readings`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(result => console.log('HTTP response:', result))
        .catch(error => console.error('HTTP error:', error));
}

// Start sending data at regular intervals
function startSendingData() {
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