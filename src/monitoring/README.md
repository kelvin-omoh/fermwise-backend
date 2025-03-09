# FermWise Monitoring System

The FermWise Monitoring System is a comprehensive solution for analyzing environmental conditions on farms and providing actionable insights to farmers. The system differentiates between scenarios that require AI analysis and those that can be managed with basic conditional logic.

## System Architecture

The monitoring system consists of the following components:

1. **Conditional Logic Analyzers**: Simple if-else logic for analyzing:
   - Humidity levels
   - Soil moisture levels
   - Livestock temperature
   - Anomaly detection in sensor readings

2. **AI-based Analyzers**: Using Google's Gemini AI with LangChain for RAG (Retrieval Augmented Generation):
   - Crop health analysis from images

3. **Cloudinary Integration**: Direct image upload and storage:
   - Images are uploaded directly to Cloudinary
   - Image URLs are stored in Firestore
   - No local file storage is used

4. **Monitoring Service**: Combines both types of analyzers to provide comprehensive insights.

5. **API Routes**: Endpoints for accessing the monitoring system.

## Scenarios and Analysis Methods

### Scenarios Using If-Else Logic

#### 1. Average Humidity Analysis
- **Description**: Analyzes humidity levels against predefined thresholds.
- **Logic**: If humidity is below minimum threshold, suggest increasing irrigation. If above maximum threshold, suggest improving ventilation.
- **Output Example**:
  ```
  🌦️ Average Humidity: 65.20%
  ⚠️ Warning: Humidity is too high (65.20%)! This can lead to fungal diseases.
  💡 Suggestion: Ensure proper ventilation in your crop area.
  ```

#### 2. Average Soil Moisture Analysis
- **Description**: Analyzes soil moisture levels against predefined thresholds.
- **Logic**: If soil moisture is below minimum threshold, suggest increasing irrigation. If above maximum threshold, suggest improving drainage.
- **Output Example**:
  ```
  🌱 Average Soil Moisture: 42.80%
  ✅ Soil moisture is at an optimal level (42.80%).
  💡 Suggestion: Continue with your current irrigation schedule.
  🚜 Action: The soil has enough moisture. No need to water now.
  ```

#### 3. Livestock Temperature Monitoring
- **Description**: Analyzes livestock temperature against predefined thresholds.
- **Logic**: If temperature is below minimum threshold, suggest providing warmth. If above maximum threshold, suggest cooling measures and veterinary attention.
- **Output Example**:
  ```
  🌡️ Current Livestock Temperature: 38.5°C
  ✅ Livestock temperature is normal (38.5°C).
  💡 Suggestion: Continue regular monitoring.
  🚜 Action: The temperature is fine for your livestock. No action needed.
  ```

#### 4. Anomaly Detection
- **Description**: Detects outliers in sensor readings that may indicate sensor malfunction or unusual conditions.
- **Logic**: Uses statistical methods (standard deviation) to identify readings that deviate significantly from the mean.
- **Output**: Integrated into the humidity and soil moisture analysis results.

### Scenarios Using AI Analysis

#### 1. Crop Health Analysis from Images
- **Description**: Analyzes images of crops to detect diseases, pests, or nutrient deficiencies.
- **Method**: Uses Google's Gemini AI with LangChain for RAG, incorporating a knowledge base of common crop diseases.
- **Output Example**:
  ```
  📸 Crop Health Analysis for image: https://res.cloudinary.com/example/image/upload/v1234567890/fermwise/farm123/device456/crop_1234567890.jpg
  ⚠️ Warning: I can see signs of powdery mildew on the leaves.
  💡 Suggestion: Apply a fungicide specifically designed for powdery mildew and ensure better air circulation between plants.
  ```

## API Endpoints

### 1. Analyze Environmental Data

```
GET /api/monitoring/analyze?farm_id=YOUR_FARM_ID&hours=24
```

Analyzes all available environmental data for a farm, including humidity, soil moisture, livestock temperature, and crop images.

**Query Parameters**:
- `farm_id` (required): The ID of the farm to analyze
- `hours` (optional): The number of hours of data to analyze (default: 24)

**Response**:
```json
{
  "farm_id": "farm123",
  "timestamp": "2023-06-15T10:30:00Z",
  "analysis": {
    "humidity": { ... },
    "soil_moisture": { ... },
    "livestock_temperature": { ... },
    "crop_health": { ... }
  },
  "formatted_message": "🌾 Farm Monitoring Report for farm123\n...",
  "data_summary": {
    "humidity_readings": 24,
    "soil_moisture_readings": 24,
    "has_livestock_data": true,
    "has_crop_image": true
  }
}
```

### 2. Update Monitoring Thresholds

```
POST /api/monitoring/thresholds
```

Updates the thresholds used for environmental monitoring.

**Request Body**:
```json
{
  "humidity": {
    "min": 40,
    "max": 70
  },
  "soil_moisture": {
    "min": 30,
    "max": 60
  },
  "livestock_temperature": {
    "min": 37.5,
    "max": 39.5
  }
}
```

**Response**:
```json
{
  "message": "Thresholds updated successfully",
  "thresholds": { ... }
}
```

### 3. Upload and Analyze Crop Image

```
POST /api/monitoring/upload-crop-image
```

Uploads an image to Cloudinary, stores the URL in Firestore, and analyzes the image for crop health issues.

**Request Body** (multipart/form-data):
- `farm_id` (required): The ID of the farm
- `device_id` (optional): The ID of the device that captured the image
- `crop_type` (optional): The type of crop in the image
- `field_section` (optional): The section of the field where the image was taken
- `image` (required): The image file to upload

**Response**:
```json
{
  "id": "firestore_document_id",
  "farm_id": "farm123",
  "timestamp": "2023-06-15T10:30:00Z",
  "image_url": "https://res.cloudinary.com/example/image/upload/v1234567890/fermwise/farm123/device456/crop_1234567890.jpg",
  "public_id": "fermwise/farm123/device456/crop_1234567890",
  "analysis": {
    "status": "warning",
    "message": "I can see signs of powdery mildew on the leaves.",
    "suggestion": "Apply a fungicide specifically designed for powdery mildew.",
    "image_url": "https://res.cloudinary.com/example/image/upload/v1234567890/fermwise/farm123/device456/crop_1234567890.jpg",
    "detected_issues": ["powdery mildew"],
    "confidence_score": 0.8,
    "ai_analysis_details": { ... }
  },
  "message": "Image uploaded and analyzed successfully"
}
```

### 4. Analyze Existing Crop Image

```
POST /api/monitoring/analyze-image
```

Analyzes an existing image URL for crop health issues.

**Request Body**:
```json
{
  "farm_id": "farm123",
  "device_id": "device456",
  "image_url": "https://res.cloudinary.com/example/image/upload/v1234567890/fermwise/farm123/device456/crop_1234567890.jpg",
  "crop_type": "tomato",
  "field_section": "north",
  "public_id": "fermwise/farm123/device456/crop_1234567890"
}
```

**Response**:
```json
{
  "farm_id": "farm123",
  "timestamp": "2023-06-15T10:30:00Z",
  "analysis": {
    "status": "warning",
    "message": "I can see signs of powdery mildew on the leaves.",
    "suggestion": "Apply a fungicide specifically designed for powdery mildew.",
    "image_url": "https://res.cloudinary.com/example/image/upload/v1234567890/fermwise/farm123/device456/crop_1234567890.jpg",
    "detected_issues": ["powdery mildew"],
    "confidence_score": 0.8,
    "ai_analysis_details": { ... }
  },
  "image_url": "https://res.cloudinary.com/example/image/upload/v1234567890/fermwise/farm123/device456/crop_1234567890.jpg"
}
```

### 5. Get Crop Images for a Farm

```
GET /api/monitoring/crop-images?farm_id=YOUR_FARM_ID&limit=10&page=1
```

Retrieves crop images for a specific farm.

**Query Parameters**:
- `farm_id` (required): The ID of the farm
- `limit` (optional): Number of images per page (default: 10)
- `page` (optional): Page number (default: 1)

**Response**:
```json
{
  "farm_id": "farm123",
  "images": [
    {
      "id": "firestore_document_id",
      "farm_id": "farm123",
      "device_id": "device456",
      "image_url": "https://res.cloudinary.com/example/image/upload/v1234567890/fermwise/farm123/device456/crop_1234567890.jpg",
      "crop_type": "tomato",
      "field_section": "north",
      "public_id": "fermwise/farm123/device456/crop_1234567890",
      "timestamp": { ... },
      "metadata": {
        "width": 1920,
        "height": 1080,
        "format": "jpg",
        "resource_type": "image",
        "bytes": 123456
      }
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

## Environment Variables

The monitoring system uses the following environment variables:

```
# Gemini AI Configuration
GEMINI_API_KEY=your-gemini-api-key

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Monitoring System Thresholds
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

## Implementation Details

### Conditional Logic

The conditional logic analyzers use simple if-else statements to compare sensor readings against predefined thresholds. This approach is efficient for straightforward scenarios where the decision boundaries are clear.

### AI Analysis with RAG

The AI-based analyzers use Google's Gemini AI model with LangChain for Retrieval Augmented Generation (RAG). This approach enhances the AI's analysis by providing it with a knowledge base of relevant information (e.g., crop diseases and their symptoms).

The RAG process works as follows:
1. The system retrieves relevant information from the knowledge base
2. This information is included in the prompt to the AI model
3. The AI model generates an analysis based on both the image and the retrieved information
4. The system extracts key insights from the AI's response and formats them for the farmer

### Cloudinary Integration

The system uses Cloudinary for image storage with the following workflow:
1. Images are uploaded directly to Cloudinary using their API
2. Cloudinary returns a URL and metadata for the uploaded image
3. The URL and metadata are stored in Firestore
4. The Gemini AI model analyzes the image using the Cloudinary URL
5. No local file storage is used, reducing server load and storage requirements

This approach provides several benefits:
- Efficient image storage and delivery through Cloudinary's CDN
- No need for local file storage on the server
- Automatic image optimization and transformation through Cloudinary
- Secure and reliable image hosting 