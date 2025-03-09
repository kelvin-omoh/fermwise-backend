# FermWise Backend API

This is the backend API for the FermWise application, which provides endpoints for managing farms, devices, and sensor data.

## Farm API

The backend provides endpoints for managing farms and retrieving farm data with associated devices and sensor readings.

### Endpoints

#### Get Farm with Devices and Sensor Data

```
GET /api/farms/:id
```

Retrieves detailed information about a specific farm, including all registered devices and recent sensor data.

**Authentication Required**: Yes

**URL Parameters**:
- `id` (required): The ID of the farm to retrieve

**Response**:
```json
{
  "id": "farm123",
  "name": "Green Valley Farm",
  "location": "California",
  "owner_id": "user123",
  "size": 100,
  "size_unit": "acres",
  "created_at": { "seconds": 1672531200, "nanoseconds": 0 },
  "devices": [
    {
      "id": "device_doc_id",
      "device_id": "device123",
      "farm_id": "farm123",
      "type": "soil_sensor",
      "status": "active",
      "capabilities": {
        "soil_moisture": true,
        "temperature": true
      }
    }
  ],
  "sensor_data": {
    "recent_readings": [
      {
        "id": "reading_id",
        "device_id": "device123",
        "farm_id": "farm123",
        "value": 42.5,
        "unit": "%",
        "timestamp": { "seconds": 1672531200, "nanoseconds": 0 }
      }
    ],
    "by_device": {
      "device123": [
        {
          "id": "reading_id",
          "device_id": "device123",
          "farm_id": "farm123",
          "value": 42.5,
          "unit": "%",
          "timestamp": { "seconds": 1672531200, "nanoseconds": 0 }
        }
      ]
    },
    "total_readings": 1,
    "time_range": {
      "from": "2023-01-01T00:00:00.000Z",
      "to": "2023-01-02T00:00:00.000Z"
    }
  },
  "monitoring": {
    "alerts": [
      {
        "level": "warning",
        "parameter": "soil_moisture",
        "message": "Soil moisture is too high (75%). Risk of root rot.",
        "value": 75,
        "threshold": {
          "min": 30,
          "max": 60
        },
        "timestamp": { "seconds": 1672531200, "nanoseconds": 0 }
      }
    ],
    "recommendations": [
      {
        "parameter": "soil_moisture",
        "message": "Reduce irrigation and ensure proper drainage.",
        "priority": "medium"
      },
      {
        "parameter": "growth_stage",
        "message": "Vegetative stage: Ensure adequate nitrogen availability for optimal leaf development.",
        "priority": "medium"
      }
    ],
    "status": "needs_attention",
    "last_updated": { "seconds": 1672531200, "nanoseconds": 0 },
    "summary": "Farm requires attention: 1 warning(s) detected."
  }
}
```

## Sensor Data API

The backend provides endpoints for retrieving sensor data from IoT devices on farms.

### Endpoints

#### Get Sensor Data

```
GET /api/sensor-data
```

**Authentication Required**: Yes

**Query Parameters**:
- `farm_id` (string, required): The ID of the farm
- `device_id` (string, optional): Filter by specific device ID
- `limit` (number, optional): Number of results per page (default: 50)
- `page` (number, optional): Page number (default: 1)

**Response**:
```json
{
  "data": [
    {
      "id": "sensor_reading_id",
      "device_id": "device_id",
      "farm_id": "farm_id",
      "value": 25.4,
      "unit": "°C",
      "timestamp": {
        "seconds": 1672531200,
        "nanoseconds": 0
      },
      "metadata": {
        "battery_level": 85,
        "signal_strength": 4
      }
    }
  ],
  "total": 120,
  "page": 1,
  "limit": 50,
  "farm_id": "farm_id",
  "device_id": "device_id"
}
```

## Image Upload Functionality

The backend now supports image uploads from IoT devices with imaging capabilities. This feature allows devices to capture and upload images directly to Cloudinary, with metadata stored in Firebase Firestore.

### Endpoints

#### Upload an Image

```
POST /api/devices/upload-image
```

**Authentication Required**: Yes

**Request Body**:
- `device_id` (string, required): The ID of the device capturing the image
- `farm_id` (string, required): The ID of the farm the device belongs to
- `image` (file, required): The image file to upload (multipart/form-data)

**Response**:
```json
{
  "id": "image_document_id",
  "message": "Image uploaded successfully",
  "image_url": "https://cloudinary.com/...",
  "device_id": "device_id",
  "farm_id": "farm_id",
  "user_id": "user_id",
  "public_id": "cloudinary_public_id",
  "width": 1920,
  "height": 1080,
  "format": "jpg",
  "created_at": "timestamp",
  "device_type": "device_type",
  "metadata": {
    "resource_type": "image",
    "bytes": 123456,
    "etag": "etag"
  }
}
```

#### Get Images for a Device

```
GET /api/devices/:device_id/images?farm_id=farm_id&limit=10&page=1
```

**Authentication Required**: Yes

**URL Parameters**:
- `device_id` (string, required): The ID of the device

**Query Parameters**:
- `farm_id` (string, required): The ID of the farm
- `limit` (number, optional): Number of images per page (default: 10)
- `page` (number, optional): Page number (default: 1)

**Response**:
```json
{
  "images": [
    {
      "id": "image_document_id",
      "image_url": "https://cloudinary.com/...",
      "device_id": "device_id",
      "farm_id": "farm_id",
      "user_id": "user_id",
      "public_id": "cloudinary_public_id",
      "width": 1920,
      "height": 1080,
      "format": "jpg",
      "created_at": "timestamp",
      "device_type": "device_type",
      "metadata": {
        "resource_type": "image",
        "bytes": 123456,
        "etag": "etag"
      }
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10,
  "device_id": "device_id",
  "farm_id": "farm_id"
}
```

#### Delete an Image

```
DELETE /api/images/:image_id
```

**Authentication Required**: Yes

**URL Parameters**:
- `image_id` (string, required): The ID of the image to delete

**Response**:
```json
{
  "message": "Image deleted successfully",
  "id": "image_id"
}
```

### Requirements

- The device must have imaging capabilities
- The user must have permission to access the farm
- The device must be registered to the farm
- The image file must be a valid image format (JPEG, PNG, etc.)
- Maximum file size: 5MB

### Implementation Details

- Images are uploaded directly to Cloudinary without storing files locally
- Images are stored in Cloudinary with a folder structure of `fermwise/{farm_id}/{device_id}`
- Image metadata and URLs are stored in Firestore in the `device_images` collection
- Authentication and authorization are handled by Firebase Auth

## Monitoring System

The backend includes a comprehensive monitoring system that analyzes farm data and sensor readings to provide insights, alerts, and recommendations for optimal farm management. The monitoring system provides both farm-level and device-specific monitoring.

### Endpoints

#### Get Farm Monitoring Data

```
GET /api/farms/:id
```

This endpoint returns detailed farm data including monitoring information as part of the response.

#### Get Formatted Monitoring Data

```
GET /api/farms/:id/monitoring-formatted
```

This endpoint returns monitoring data in a user-friendly format with emojis and actionable insights. It's designed for mobile applications and notifications.

**Authentication Required**: Yes

**URL Parameters**:
- `id` (required): The ID of the farm to retrieve monitoring data for

**Response**:
```json
{
  "farm_name": "Corn Farm",
  "farm_status": "healthy",
  "readings": {
    "humidity": {
      "value": 65.2,
      "unit": "%",
      "status": "normal"
    },
    "soil_moisture": {
      "value": 42.8,
      "unit": "%",
      "status": "normal"
    },
    "temperature": {
      "value": 25.4,
      "unit": "°C",
      "status": "normal"
    },
    "soil_temperature": {
      "value": 22.1,
      "unit": "°C",
      "status": "normal"
    },
    "livestock_temperature": {
      "value": 38.5,
      "unit": "°C",
      "status": "normal"
    }
  },
  "insights": [
    {
      "type": "humidity",
      "value": "65.20%",
      "message": "🌦️ Average Humidity: 65.20%",
      "warning": "⚠️ Warning: Humidity is too high! This can lead to fungal diseases.",
      "action": "🌬️ Suggestion: Ensure proper ventilation in your crop area."
    },
    {
      "type": "soil_moisture",
      "value": "42.80%",
      "message": "🌱 Average Soil Moisture: 42.80%",
      "action": "💧 Action: The soil has enough moisture. No need to water now."
    },
    {
      "type": "livestock_temperature",
      "value": "38.5°C",
      "message": "🌡️ Current Livestock Temperature: 38.5°C",
      "action": "🌡️ Action: The temperature is fine for your livestock. No action needed."
    },
    {
      "type": "image_analysis",
      "image_url": "https://example.com/image.jpg",
      "message": "📸 Analyzing the image of your crops at: https://example.com/image.jpg",
      "result": "✅ Result: No diseases detected.",
      "conclusion": "😊 Great! Your crops are healthy."
    }
  ],
  "formatted_text": "🌦️ Average Humidity: 65.20%\n⚠️ Warning: Humidity is too high! This can lead to fungal diseases.\n🌬️ Suggestion: Ensure proper ventilation in your crop area.\n\n🌱 Average Soil Moisture: 42.80%\n💧 Action: The soil has enough moisture. No need to water now.\n\n🌡️ Current Livestock Temperature: 38.5°C\n🌡️ Action: The temperature is fine for your livestock. No action needed.\n\n📸 Analyzing the image of your crops at: https://example.com/image.jpg\n✅ Result: No diseases detected.\n😊 Great! Your crops are healthy."
}
```

The `formatted_text` field contains the complete formatted output that can be displayed directly to users in mobile applications or sent as notifications.

### Monitoring Data Structure

The monitoring system provides the following data:

#### Farm-Level Monitoring

- **Status**: The overall status of the farm:
  - `healthy`: All parameters are within optimal ranges
  - `needs_attention`: Some parameters require attention (warnings)
  - `critical`: Critical issues detected that require immediate action

- **Alerts**: Generated when sensor readings fall outside of optimal ranges:
  - `info`: Informational alerts (e.g., outdated sensor data)
  - `warning`: Parameters that require attention but are not critical
  - `critical`: Parameters that require immediate action

- **Recommendations**: Actionable suggestions based on the current farm conditions

- **Summary**: A concise summary of the farm's current status and any issues detected

#### Device-Specific Monitoring

Each device connected to the farm has its own monitoring data, including:

- **Device Status**: The operational status of the device
- **Device Readings**: Current sensor readings with status indicators:
  - `normal`: Reading is within optimal range
  - `warning`: Reading is outside optimal range but not critical
  - `critical`: Reading requires immediate attention

- **Device Alerts**: Specific alerts for each device
- **Device Recommendations**: Tailored recommendations for each device

### Example Response

```json
{
  "monitoring": {
    "farm_status": "needs_attention",
    "summary": "Farm requires attention: 1 warning(s) detected.",
    "last_updated": { "seconds": 1672531200, "nanoseconds": 0 },
    "alerts": [
      {
        "level": "warning",
        "parameter": "humidity",
        "message": "Humidity is too high (75%). Consider improving ventilation.",
        "value": 75,
        "threshold": { "min": 40, "max": 70 },
        "timestamp": { "seconds": 1672531200, "nanoseconds": 0 }
      }
    ],
    "recommendations": [
      {
        "parameter": "humidity",
        "message": "Improve ventilation or reduce irrigation frequency.",
        "priority": "medium"
      }
    ],
    "devices": [
      {
        "device_id": "device123",
        "device_name": "FermWise Bot - Enterprise",
        "device_type": "soil_sensor",
        "status": "needs_attention",
        "summary": "Device requires attention: 1 warning(s) detected.",
        "last_reading": { "seconds": 1672531200, "nanoseconds": 0 },
        "readings": {
          "temperature": { "value": 25.4, "unit": "°C", "status": "normal" },
          "humidity": { "value": 75, "unit": "%", "status": "warning" },
          "soil_moisture": { "value": 45, "unit": "%", "status": "normal" }
        },
        "alerts": [
          {
            "level": "warning",
            "parameter": "humidity",
            "message": "Humidity is too high (75%). Consider improving ventilation.",
            "value": 75,
            "threshold": { "min": 40, "max": 70 },
            "timestamp": { "seconds": 1672531200, "nanoseconds": 0 }
          }
        ],
        "recommendations": [
          {
            "parameter": "humidity",
            "message": "Improve ventilation or reduce irrigation frequency.",
            "priority": "medium"
          }
        ]
      }
    ]
  }
}
```

### Environment Variables

The monitoring system uses the following environment variables to define optimal ranges:

```
# Humidity thresholds (%)
HUMIDITY_MIN=40
HUMIDITY_MAX=70

# Soil moisture thresholds (%)
SOIL_MOISTURE_MIN=30
SOIL_MOISTURE_MAX=60

# Livestock temperature thresholds (°C)
LIVESTOCK_TEMP_MIN=37.5
LIVESTOCK_TEMP_MAX=39.5
```

### Crop-Specific Recommendations

The monitoring system provides crop-specific recommendations based on the crop type and growth stage. Currently supported crops:
- Maize/Corn

### Testing the Monitoring System

Three test scripts are provided to verify the monitoring system implementation:

```
node test-monitoring.js
```

This script makes a request to the farm endpoint and logs the monitoring data, including both farm-level and device-specific monitoring information.

```
node test-monitoring-friendly.js
```

This user-friendly script displays the monitoring data with emojis and actionable insights for each sensor type. It provides:

- 🏡 Farm overview with status
- 📱 Device-specific information
- 🌡️ Temperature readings with status and recommendations
- 🌦️ Humidity readings with status and recommendations
- 💧 Soil moisture readings with status and recommendations
- 🌱 Soil temperature readings with status and recommendations
- 🐄 Livestock temperature readings with status and recommendations
- 📸 Imaging technology information
- 🔍 Farm-level recommendations

```
node test-monitoring-simple.js
```

This simplified script produces a concise, emoji-based output format focused on actionable insights:

```
🌦️ Average Humidity: 65.20%
⚠️ Warning: Humidity is too high! This can lead to fungal diseases.
🌬️ Suggestion: Ensure proper ventilation in your crop area.

🌱 Average Soil Moisture: 42.80%
💧 Action: The soil has enough moisture. No need to water now.

⚠️ Warning: Humidity is 65.20%. This is not good for your crops!
💧 Suggestion: Increase irrigation to raise humidity levels.

⚠️ Warning: Soil moisture is 42.80%. Your plants might be thirsty!
🚰 Action: Turning on the irrigation system.

🌡️ Current Livestock Temperature: 38.5°C
🌡️ Action: The temperature is fine for your livestock. No action needed.

📸 Analyzing the image of your crops at: https://example.com/image.jpg
✅ Result: No diseases detected.
😊 Great! Your crops are healthy.
```

This format is ideal for mobile notifications or quick status updates for farmers.