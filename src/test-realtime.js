/**
 * Real-time Testing Script
 * 
 * This script tests the real-time functionality of the backend server.
 * It connects to the server using Socket.io and sends simulated sensor data.
 */

const { io } = require("socket.io-client");

// Configuration
const SERVER_URL = "http://localhost:8080"; // Update with your server URL
const SERIAL_NUMBER = "TEST_DEVICE_001";
const TEST_DURATION = 30000; // Run test for 30 seconds

console.log(`Starting real-time test for ${SERVER_URL}`);
console.log(`Test will run for ${TEST_DURATION / 1000} seconds`);

// Connect to the server
const socket = io(SERVER_URL);

// Track connection state
let isConnected = false;

// Handle connection events
socket.on("connect", () => {
    isConnected = true;
    console.log(`✅ Connected to server with socket ID: ${socket.id}`);

    // Register the device
    socket.emit("register_device", {
        serial_number: SERIAL_NUMBER,
        device_type: "test_device"
    });
    console.log(`📱 Registered device: ${SERIAL_NUMBER}`);

    // Start sending test data
    sendTestData();

    // Set up interval to send data regularly
    const interval = setInterval(() => {
        if (isConnected) {
            sendTestData();
        } else {
            clearInterval(interval);
        }
    }, 5000); // Send data every 5 seconds

    // End test after specified duration
    setTimeout(() => {
        console.log(`⏱️ Test duration (${TEST_DURATION / 1000}s) completed`);
        clearInterval(interval);
        socket.disconnect();
        process.exit(0);
    }, TEST_DURATION);
});

socket.on("disconnect", () => {
    isConnected = false;
    console.log("❌ Disconnected from server");
});

socket.on("connect_error", (error) => {
    console.error(`🔴 Connection error: ${error.message}`);
});

// Handle server responses
socket.on("sensor_data_ack", (data) => {
    console.log(`✅ Server acknowledged data: ${JSON.stringify(data)}`);
});

socket.on("error", (error) => {
    console.error(`🔴 Server error: ${JSON.stringify(error)}`);
});

// Function to generate random sensor data
function generateSensorData() {
    return {
        serial_number: SERIAL_NUMBER,
        temperature: parseFloat((20 + Math.random() * 15).toFixed(1)), // 20-35°C
        humidity: parseFloat((40 + Math.random() * 40).toFixed(1)), // 40-80%
        soil_temperature: parseFloat((15 + Math.random() * 10).toFixed(1)), // 15-25°C
        soil_moisture: parseFloat((30 + Math.random() * 50).toFixed(1)), // 30-80%
        livestock_temperature: parseFloat((35 + Math.random() * 5).toFixed(1)) // 35-40°C
    };
}

// Function to send test data
function sendTestData() {
    const data = generateSensorData();
    console.log(`📤 Sending sensor data: ${JSON.stringify(data)}`);

    // Send data via Socket.io
    socket.emit("sensor_data", data);
} 