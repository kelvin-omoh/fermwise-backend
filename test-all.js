/**
 * Comprehensive Test Script
 * 
 * This script:
 * 1. Starts the server
 * 2. Tests WebSocket (Socket.io) functionality
 * 3. Tests HTTP endpoint
 * 4. Provides detailed logs
 */

const { spawn } = require('child_process');
const path = require('path');
const { io } = require('socket.io-client');
const fetch = require('node-fetch');

// Configuration
const SERVER_URL = "http://localhost:8080";
const WS_DEVICE_ID = "TEST_WS_DEVICE";
const HTTP_DEVICE_ID = "TEST_HTTP_DEVICE";
const SERVER_START_TIMEOUT = 5000; // Wait 5 seconds for server to start
const TEST_DURATION = 30000; // Run test for 30 seconds
const SEND_INTERVAL = 5000; // Send data every 5 seconds

console.log('='.repeat(80));
console.log('COMPREHENSIVE REAL-TIME TEST');
console.log('='.repeat(80));

// Start the server
console.log('\n📡 STARTING SERVER...');
const serverProcess = spawn('node', [path.join(__dirname, 'src', 'start-server.js')], {
    stdio: 'pipe',
    shell: true
});

let serverOutput = '';

serverProcess.stdout.on('data', (data) => {
    const output = data.toString();
    serverOutput += output;
    console.log(`🖥️  SERVER: ${output.trim()}`);
});

serverProcess.stderr.on('data', (data) => {
    const output = data.toString();
    serverOutput += output;
    console.error(`🔴 SERVER ERROR: ${output.trim()}`);
});

// Wait for server to start
console.log(`⏳ Waiting ${SERVER_START_TIMEOUT / 1000} seconds for server to start...`);

setTimeout(() => {
    if (serverProcess.killed) {
        console.error('❌ Server failed to start');
        process.exit(1);
    }

    console.log('\n✅ Server should be running now. Starting tests...');

    // Start WebSocket test
    startWebSocketTest();

    // Start HTTP test
    startHttpTest();

    // End test after specified duration
    setTimeout(() => {
        console.log('\n='.repeat(80));
        console.log(`⏱️ Test duration (${TEST_DURATION / 1000}s) completed`);
        console.log('='.repeat(80));

        // Kill server process
        serverProcess.kill('SIGINT');

        // Exit after a short delay to allow for cleanup
        setTimeout(() => {
            process.exit(0);
        }, 1000);
    }, TEST_DURATION);

}, SERVER_START_TIMEOUT);

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n🛑 Stopping tests and server...');
    serverProcess.kill('SIGINT');
    process.exit();
});

// WebSocket Test
function startWebSocketTest() {
    console.log('\n='.repeat(80));
    console.log('WEBSOCKET (SOCKET.IO) TEST');
    console.log('='.repeat(80));

    // Connect to the server
    const socket = io(SERVER_URL);

    // Track connection state
    let isConnected = false;

    // Handle connection events
    socket.on("connect", () => {
        isConnected = true;
        console.log(`\n✅ WS: Connected to server with socket ID: ${socket.id}`);

        // Register the device
        socket.emit("register_device", {
            serial_number: WS_DEVICE_ID,
            device_type: "test_device"
        });
        console.log(`📱 WS: Registered device: ${WS_DEVICE_ID}`);

        // Start sending test data
        sendWebSocketData(socket);

        // Set up interval to send data regularly
        const interval = setInterval(() => {
            if (isConnected) {
                sendWebSocketData(socket);
            } else {
                clearInterval(interval);
            }
        }, SEND_INTERVAL);
    });

    socket.on("disconnect", () => {
        isConnected = false;
        console.log("❌ WS: Disconnected from server");
    });

    socket.on("connect_error", (error) => {
        console.error(`🔴 WS: Connection error: ${error.message}`);
    });

    // Handle server responses
    socket.on("sensor_data_ack", (data) => {
        console.log(`✅ WS: Server acknowledged data: ${JSON.stringify(data)}`);
    });

    socket.on("error", (error) => {
        console.error(`🔴 WS: Server error: ${JSON.stringify(error)}`);
    });
}

// HTTP Test
function startHttpTest() {
    console.log('\n='.repeat(80));
    console.log('HTTP TEST');
    console.log('='.repeat(80));

    // Start sending data at regular intervals
    const interval = setInterval(() => {
        sendHttpData();
    }, SEND_INTERVAL);

    // Send initial data
    sendHttpData();
}

// Function to generate random sensor data
function generateSensorData(deviceId) {
    return {
        serial_number: deviceId,
        temperature: parseFloat((20 + Math.random() * 15).toFixed(1)), // 20-35°C
        humidity: parseFloat((40 + Math.random() * 40).toFixed(1)), // 40-80%
        soil_temperature: parseFloat((15 + Math.random() * 10).toFixed(1)), // 15-25°C
        soil_moisture: parseFloat((30 + Math.random() * 50).toFixed(1)), // 30-80%
        livestock_temperature: parseFloat((35 + Math.random() * 5).toFixed(1)) // 35-40°C
    };
}

// Function to send WebSocket data
function sendWebSocketData(socket) {
    const data = generateSensorData(WS_DEVICE_ID);
    console.log(`📤 WS: Sending data: ${JSON.stringify(data)}`);

    // Send data via Socket.io
    socket.emit("sensor_data", data);
}

// Function to send HTTP data
async function sendHttpData() {
    const data = generateSensorData(HTTP_DEVICE_ID);
    console.log(`📤 HTTP: Sending data: ${JSON.stringify(data)}`);

    try {
        const response = await fetch(`${SERVER_URL}/api/device/readings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const result = await response.json();
            console.log(`✅ HTTP: Response: ${JSON.stringify(result)}`);
        } else {
            console.error(`🔴 HTTP: Error: ${response.status} - ${await response.text()}`);
        }
    } catch (error) {
        console.error(`🔴 HTTP: Request failed: ${error.message}`);
    }
} 