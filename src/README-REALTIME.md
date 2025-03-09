# Real-Time Sensor Data Implementation

This document explains how to use the real-time functionality for IoT devices to send sensor data to the FermWise platform.

## Overview

The FermWise platform now supports real-time data transmission from IoT devices using WebSockets (Socket.io). This allows for:

1. Instant data updates on the dashboard
2. Reduced latency compared to HTTP polling
3. Lower bandwidth usage for continuous monitoring
4. Bidirectional communication between the server and IoT devices

## Server Implementation

The server uses Socket.io to establish WebSocket connections with clients. It supports:

- Device registration
- Real-time sensor data transmission
- Device-specific data rooms
- Fallback to HTTP when WebSockets are not available

## IoT Device Implementation

### JavaScript Example

For IoT devices that can run JavaScript (e.g., Raspberry Pi, ESP32 with Node.js):

1. Install the required dependencies:
   ```bash
   npm install socket.io-client node-fetch
   ```

2. Use the provided example in `iot-client-example.js`:
   ```bash
   node iot-client-example.js
   ```

3. Make sure to update the `SERVER_URL` and `SERIAL_NUMBER` in the example to match your configuration.

### TypeScript Example

For IoT devices that support TypeScript:

1. Install the required dependencies:
   ```bash
   npm install socket.io-client node-fetch @types/socket.io-client @types/node-fetch
   ```

2. Compile and run the provided example in `iot-client-example.ts`:
   ```bash
   tsc iot-client-example.ts
   node iot-client-example.js
   ```

### Python Example

For IoT devices that run Python (e.g., Raspberry Pi, many microcontrollers):

1. Install the required dependencies:
   ```bash
   pip install python-socketio requests
   ```

2. Run the provided example in `iot-client-example.py`:
   ```bash
   python iot-client-example.py
   ```

3. Make sure to update the `SERVER_URL` and `SERIAL_NUMBER` in the example to match your configuration.

### Other Platforms

For other platforms (Arduino, ESP8266, etc.), you can use any WebSocket client library that supports the Socket.io protocol, or fall back to using HTTP POST requests to the `/api/device/readings` endpoint.

## Testing the Implementation

1. Start the server:
   ```bash
   npm run dev
   ```

2. Open the client example in a browser:
   ```
   file:///path/to/client-example.html
   ```
   (Update the SERVER_URL in the HTML file if needed)

3. Run the IoT device example:
   ```bash
   node iot-client-example.js
   ```

4. You should see real-time updates in the browser as the IoT device sends data.

## Data Format

The expected data format for sensor readings is:

```json
{
  "serial_number": "DEVICE_001",
  "temperature": 25.5,
  "humidity": 60.2,
  "soil_temperature": 22.3,
  "soil_moisture": 45.7,
  "livestock_temperature": 38.2
}
```

All fields except `serial_number` are optional. If a field is not provided, it will not be recorded or updated.

## Socket.io Events

### Client to Server

- `register_device`: Register a device with the server
  ```json
  {
    "serial_number": "DEVICE_001",
    "device_type": "agricultural_sensor"
  }
  ```

- `sensor_data`: Send sensor data to the server (same format as HTTP POST)

### Server to Client

- `sensor_data`: Broadcast to all clients when new sensor data is received
- `device_data`: Sent only to clients in the specific device room

## Security Considerations

- For production, make sure to implement proper authentication for IoT devices
- Consider using TLS/SSL for secure WebSocket connections (wss://)
- Implement rate limiting to prevent DoS attacks

## Troubleshooting

- If the WebSocket connection fails, the client will automatically fall back to HTTP
- Check the server logs for connection issues
- Ensure your firewall allows WebSocket connections (usually on the same port as HTTP)
- For production deployments, make sure your load balancer supports WebSockets 