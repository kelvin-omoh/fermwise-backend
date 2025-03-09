# FermWise IoT Device Integration

This directory contains scripts and examples for integrating IoT devices with the FermWise platform. This script demonstrates how to implement the "Take Reading" functionality for your IoT devices.

## API Endpoint

The FermWise API provides an endpoint for IoT devices to send sensor readings:

```
POST /api/device/readings
```

### Request Format

```json
{
  "serial_number": "FW-DEVICE-12345",
  "temperature": 25.4,
  "humidity": 65.2,
  "soil_temperature": 22.1,
  "soil_moisture": 42.8,
  "livestock_temperature": 38.5
}
```

All sensor readings are optional, but at least one should be provided. The `serial_number` field is required.

### Response Format

```json
{
  "message": "Sensor readings recorded successfully",
  "serial_number": "FW-DEVICE-12345",
  "farm_id": "farm_001",
  "timestamp": {
    "seconds": 1672531200,
    "nanoseconds": 0
  },
  "readings": [
    {
      "id": "reading_id_1",
      "serial_number": "FW-DEVICE-12345",
      "farm_id": "farm_001",
      "type": "temperature",
      "value": 25.4,
      "unit": "°C",
      "timestamp": {
        "seconds": 1672531200,
        "nanoseconds": 0
      }
    },
    // Additional readings for other sensor types
  ]
}
```

## JavaScript Test Script

The `test-device-readings.js` script demonstrates how to send sensor readings using JavaScript/Node.js:

1. Install dependencies:
   ```
   npm install node-fetch
   ```

2. Update the configuration in the script with your device serial number:
   ```javascript
   const config = {
       apiUrl: 'http://localhost:8080',     // Update with your API URL
       serial_number: 'FW-DEVICE-12345'     // Update with your device serial number
   };
   ```

3. Run the script:
   ```
   node test-device-readings.js
   ```

## Integrating with Real IoT Devices

To integrate with real IoT devices, you'll need to:

1. Modify the `generateSensorReadings()` function to get actual readings from your sensors
2. Update the serial number to match your device's actual serial number
3. Ensure your device has network connectivity to reach the API endpoint

Example implementation for a real device:

```javascript
// Function to get readings from actual sensors
function getSensorReadings() {
    // Replace with code to read from your actual sensors
    // This is just a placeholder example
    return {
        temperature: readTemperatureSensor(),
        humidity: readHumiditySensor(),
        soil_temperature: readSoilTemperatureSensor(),
        soil_moisture: readSoilMoistureSensor(),
        livestock_temperature: readLivestockTemperatureSensor()
    };
}
```

## Troubleshooting

If you encounter issues:

1. Verify that the FermWise API server is running
2. Check that your device serial number is correctly configured
3. Ensure your network connection allows access to the API endpoint
4. Check the API server logs for error messages

For additional help, contact the FermWise support team. 