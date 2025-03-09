/**
 * Test script for the FermWise Monitoring System
 * 
 * This script tests the entire monitoring system with sample data.
 * 
 * Usage:
 * 1. Update the configuration below with your actual values
 * 2. Run this script: node test-monitoring-system.js
 */

require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fetch = require('node-fetch');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Configuration
const config = {
    farmId: 'test-farm-123',
    deviceId: 'test-device-456',
    cropType: 'tomato',
    // Use a Cloudinary URL from the previous test or provide your own
    imageUrl: 'https://res.cloudinary.com/dg78jueqi/image/upload/v1741521376/fermwise/test-farm-123/test-device-456/crop_1741521371432.jpg'
};

// Sample humidity data
const humidityData = [
    {
        device_id: config.deviceId,
        farm_id: config.farmId,
        value: 65.2,
        unit: '%',
        timestamp: { seconds: Date.now() / 1000 - 3600, nanoseconds: 0 } // 1 hour ago
    },
    {
        device_id: config.deviceId,
        farm_id: config.farmId,
        value: 64.8,
        unit: '%',
        timestamp: { seconds: Date.now() / 1000 - 7200, nanoseconds: 0 } // 2 hours ago
    },
    {
        device_id: config.deviceId,
        farm_id: config.farmId,
        value: 66.5,
        unit: '%',
        timestamp: { seconds: Date.now() / 1000 - 10800, nanoseconds: 0 } // 3 hours ago
    }
];

// Sample soil moisture data
const soilMoistureData = [
    {
        device_id: config.deviceId,
        farm_id: config.farmId,
        value: 42.8,
        unit: '%',
        timestamp: { seconds: Date.now() / 1000 - 3600, nanoseconds: 0 } // 1 hour ago
    },
    {
        device_id: config.deviceId,
        farm_id: config.farmId,
        value: 43.2,
        unit: '%',
        timestamp: { seconds: Date.now() / 1000 - 7200, nanoseconds: 0 } // 2 hours ago
    },
    {
        device_id: config.deviceId,
        farm_id: config.farmId,
        value: 41.9,
        unit: '%',
        timestamp: { seconds: Date.now() / 1000 - 10800, nanoseconds: 0 } // 3 hours ago
    }
];

// Sample livestock temperature data
const livestockTemperatureData = {
    device_id: config.deviceId,
    farm_id: config.farmId,
    value: 38.5,
    unit: '°C',
    livestock_id: 'cow-001',
    livestock_type: 'dairy_cow',
    timestamp: { seconds: Date.now() / 1000 - 1800, nanoseconds: 0 } // 30 minutes ago
};

// Sample crop image data
const cropImageData = {
    device_id: config.deviceId,
    farm_id: config.farmId,
    image_url: config.imageUrl,
    crop_type: config.cropType,
    field_section: 'north',
    timestamp: { seconds: Date.now() / 1000 - 3600, nanoseconds: 0 } // 1 hour ago
};

// Monitoring thresholds
const thresholds = {
    humidity: {
        min: 40,
        max: 70
    },
    soil_moisture: {
        min: 30,
        max: 60
    },
    livestock_temperature: {
        min: 37.5,
        max: 39.5
    }
};

// Fetch image from URL and convert to base64
const fetchImageAsBase64 = async (imageUrl) => {
    try {
        console.log('Fetching image from URL...');
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = buffer.toString('base64');

        console.log('✅ Image fetched and converted to base64');
        return base64Image;
    } catch (error) {
        console.error('❌ Error fetching image:', error);
        throw error;
    }
};

// Analyze humidity data
const analyzeHumidity = (humidityData) => {
    console.log('Analyzing humidity data...');

    // Calculate average humidity
    const totalHumidity = humidityData.reduce((sum, data) => sum + data.value, 0);
    const averageHumidity = humidityData.length > 0 ? totalHumidity / humidityData.length : 0;
    const unit = humidityData.length > 0 ? humidityData[0].unit : '%';

    // Format to 2 decimal places
    const formattedAverage = parseFloat(averageHumidity.toFixed(2));

    // Determine status and message based on thresholds
    let status = 'normal';
    let message = '';
    let suggestion = '';

    if (averageHumidity < thresholds.humidity.min) {
        status = 'warning';
        message = `Humidity is too low (${formattedAverage}${unit})! This can stress your crops.`;
        suggestion = 'Consider increasing irrigation or using a humidifier in enclosed spaces.';
    } else if (averageHumidity > thresholds.humidity.max) {
        status = 'warning';
        message = `Humidity is too high (${formattedAverage}${unit})! This can lead to fungal diseases.`;
        suggestion = 'Ensure proper ventilation in your crop area.';
    } else {
        message = `Humidity is at an optimal level (${formattedAverage}${unit}).`;
        suggestion = 'Continue with your current management practices.';
    }

    console.log(`Status: ${status}`);
    console.log(`Message: ${message}`);
    console.log(`Suggestion: ${suggestion}`);

    return {
        timestamp: new Date(),
        status,
        message,
        suggestion,
        average_value: formattedAverage,
        unit,
        min_threshold: thresholds.humidity.min,
        max_threshold: thresholds.humidity.max
    };
};

// Analyze soil moisture data
const analyzeSoilMoisture = (soilMoistureData) => {
    console.log('Analyzing soil moisture data...');

    // Calculate average soil moisture
    const totalMoisture = soilMoistureData.reduce((sum, data) => sum + data.value, 0);
    const averageMoisture = soilMoistureData.length > 0 ? totalMoisture / soilMoistureData.length : 0;
    const unit = soilMoistureData.length > 0 ? soilMoistureData[0].unit : '%';

    // Format to 2 decimal places
    const formattedAverage = parseFloat(averageMoisture.toFixed(2));

    // Determine status and message based on thresholds
    let status = 'normal';
    let message = '';
    let suggestion = '';
    let action = '';

    if (averageMoisture < thresholds.soil_moisture.min) {
        status = 'warning';
        message = `Soil moisture is too low (${formattedAverage}${unit})! Your plants might be thirsty.`;
        suggestion = 'Increase irrigation to provide adequate water for your crops.';
        action = 'Turning on the irrigation system.';
    } else if (averageMoisture > thresholds.soil_moisture.max) {
        status = 'warning';
        message = `Soil moisture is too high (${formattedAverage}${unit})! This can lead to root rot.`;
        suggestion = 'Reduce irrigation and ensure proper drainage.';
        action = 'Pausing scheduled irrigation until soil dries.';
    } else {
        message = `Soil moisture is at an optimal level (${formattedAverage}${unit}).`;
        suggestion = 'Continue with your current irrigation schedule.';
        action = 'The soil has enough moisture. No need to water now.';
    }

    console.log(`Status: ${status}`);
    console.log(`Message: ${message}`);
    console.log(`Suggestion: ${suggestion}`);
    console.log(`Action: ${action}`);

    return {
        timestamp: new Date(),
        status,
        message,
        suggestion,
        action,
        average_value: formattedAverage,
        unit,
        min_threshold: thresholds.soil_moisture.min,
        max_threshold: thresholds.soil_moisture.max
    };
};

// Analyze livestock temperature data
const analyzeLivestockTemperature = (temperatureData) => {
    console.log('Analyzing livestock temperature data...');

    const temperature = temperatureData.value;
    const unit = temperatureData.unit;

    // Determine status and message based on thresholds
    let status = 'normal';
    let message = '';
    let suggestion = '';
    let action = '';

    if (temperature < thresholds.livestock_temperature.min) {
        status = 'critical';
        message = `Livestock temperature is too low (${temperature}${unit})! This could indicate health issues.`;
        suggestion = 'Provide warmth and shelter immediately.';
        action = 'Activating heating systems in livestock areas.';
    } else if (temperature > thresholds.livestock_temperature.max) {
        status = 'critical';
        message = `Livestock temperature is too high (${temperature}${unit})! This could indicate fever or heat stress.`;
        suggestion = 'Provide shade, water, and contact a veterinarian if needed.';
        action = 'Activating cooling systems and increasing water supply.';
    } else {
        message = `Livestock temperature is normal (${temperature}${unit}).`;
        suggestion = 'Continue regular monitoring.';
        action = 'The temperature is fine for your livestock. No action needed.';
    }

    console.log(`Status: ${status}`);
    console.log(`Message: ${message}`);
    console.log(`Suggestion: ${suggestion}`);
    console.log(`Action: ${action}`);

    return {
        timestamp: new Date(),
        status,
        message,
        suggestion,
        action,
        value: temperature,
        unit,
        min_threshold: thresholds.livestock_temperature.min,
        max_threshold: thresholds.livestock_temperature.max
    };
};

// Analyze crop health from image
const analyzeCropHealth = async (cropImageData) => {
    try {
        console.log('Analyzing crop health...');
        console.log('Image URL:', cropImageData.image_url);

        // Fetch image and convert to base64
        const base64Image = await fetchImageAsBase64(cropImageData.image_url);

        // Crop disease knowledge base
        const cropDiseaseKnowledgeBase = [
            {
                disease: "Late Blight",
                crops: ["Potato", "Tomato"],
                symptoms: "Dark, water-soaked lesions on leaves that quickly enlarge and turn brown with a slight yellow border. White fungal growth may be visible on the underside of leaves in humid conditions.",
                causes: "Caused by the oomycete pathogen Phytophthora infestans. Favored by cool, wet weather with high humidity.",
                management: "Use resistant varieties, apply fungicides preventatively, ensure good air circulation, avoid overhead irrigation, remove and destroy infected plants."
            },
            {
                disease: "Powdery Mildew",
                crops: ["Cucumber", "Squash", "Melon", "Grape", "Apple"],
                symptoms: "White powdery spots on leaves and stems that eventually cover the entire surface. Leaves may yellow, curl, or die prematurely.",
                causes: "Caused by various species of fungi. Favored by warm, dry conditions with high humidity, especially at night.",
                management: "Use resistant varieties, apply fungicides, ensure proper spacing for air circulation, avoid overhead irrigation."
            }
        ];

        // Prepare knowledge base as string
        const knowledgeBaseStr = cropDiseaseKnowledgeBase
            .map(entry => `
Disease: ${entry.disease}
Affected Crops: ${entry.crops.join(", ")}
Symptoms: ${entry.symptoms}
Causes: ${entry.causes}
Management: ${entry.management}
      `).join("\n");

        // Prompt template for crop health analysis
        const cropHealthAnalysisPrompt = `
You are an agricultural expert AI assistant helping farmers analyze crop health from images.

CONTEXT:
The farmer has uploaded an image of their crops for analysis. They want to know if there are any signs of disease, pests, or other issues affecting their crops.

CROP DISEASE KNOWLEDGE:
${knowledgeBaseStr}

INSTRUCTIONS:
1. Analyze the image carefully for any signs of disease, pests, nutrient deficiencies, or other issues.
2. If you identify any problems, provide a clear explanation of what you see and what it might indicate.
3. Provide practical advice that a farmer can implement.
4. Use simple, clear language that a farmer would understand.
5. If you're uncertain about anything, acknowledge your uncertainty rather than making definitive claims.
6. Format your response in a structured way with clear sections.

YOUR ANALYSIS:
`;

        // Get Gemini model
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Create content parts
        const imageParts = [
            { text: cropHealthAnalysisPrompt },
            { inlineData: { mimeType: 'image/jpeg', data: base64Image } }
        ];

        // Generate content
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: imageParts }],
        });

        const response = result.response;
        const text = response.text();

        console.log('✅ Crop health analysis complete!');

        // Parse the result to extract key information
        const hasDisease = text.toLowerCase().includes("disease") ||
            text.toLowerCase().includes("pest") ||
            text.toLowerCase().includes("deficiency");

        // Determine status based on analysis
        let status = 'normal';
        if (hasDisease) {
            status = text.toLowerCase().includes("severe") ? 'critical' : 'warning';
        }

        // Extract a concise message from the result
        let message = "No issues detected in your crops.";
        let suggestion = "Continue with your current management practices.";

        if (hasDisease) {
            // Extract the first sentence that mentions a disease or issue
            const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 0);
            const issueSentence = sentences.find(s =>
                s.toLowerCase().includes("disease") ||
                s.toLowerCase().includes("pest") ||
                s.toLowerCase().includes("deficiency")
            );

            if (issueSentence) {
                message = issueSentence.trim() + ".";
            } else {
                message = "Potential issues detected in your crops.";
            }

            // Extract suggestion
            const suggestionSentence = sentences.find(s =>
                s.toLowerCase().includes("recommend") ||
                s.toLowerCase().includes("suggest") ||
                s.toLowerCase().includes("should") ||
                (s.toLowerCase().includes("can") && s.toLowerCase().includes("treat"))
            );

            if (suggestionSentence) {
                suggestion = suggestionSentence.trim() + ".";
            }
        }

        console.log(`Status: ${status}`);
        console.log(`Message: ${message}`);
        console.log(`Suggestion: ${suggestion}`);

        return {
            timestamp: new Date(),
            status,
            message,
            suggestion,
            image_url: cropImageData.image_url,
            detected_issues: hasDisease ? [message] : [],
            confidence_score: hasDisease ? 0.8 : 0.9,
            ai_analysis_details: {
                full_analysis: text,
                crop_type: cropImageData.crop_type || "Unknown"
            }
        };
    } catch (error) {
        console.error('❌ Error analyzing crop health:', error);
        return {
            timestamp: new Date(),
            status: 'warning',
            message: "Failed to analyze crop health image.",
            suggestion: "Please try again or contact support if the issue persists.",
            image_url: cropImageData.image_url
        };
    }
};

// Format analysis results
const formatAnalysisResults = (results) => {
    let message = `🌾 Farm Monitoring Report for ${results.farm_id}\n`;
    message += `📅 ${results.timestamp.toLocaleString()}\n\n`;

    // Add humidity analysis
    if (results.humidity) {
        message += `🌦️ Average Humidity: ${results.humidity.average_value}${results.humidity.unit}\n`;

        if (results.humidity.status === 'warning' || results.humidity.status === 'critical') {
            message += `⚠️ Warning: ${results.humidity.message}\n`;
        } else {
            message += `✅ ${results.humidity.message}\n`;
        }

        if (results.humidity.suggestion) {
            message += `💡 Suggestion: ${results.humidity.suggestion}\n`;
        }

        message += '\n';
    }

    // Add soil moisture analysis
    if (results.soil_moisture) {
        message += `🌱 Average Soil Moisture: ${results.soil_moisture.average_value}${results.soil_moisture.unit}\n`;

        if (results.soil_moisture.status === 'warning' || results.soil_moisture.status === 'critical') {
            message += `⚠️ Warning: ${results.soil_moisture.message}\n`;
        } else {
            message += `✅ ${results.soil_moisture.message}\n`;
        }

        if (results.soil_moisture.suggestion) {
            message += `💡 Suggestion: ${results.soil_moisture.suggestion}\n`;
        }

        if (results.soil_moisture.action) {
            message += `🚜 Action: ${results.soil_moisture.action}\n`;
        }

        message += '\n';
    }

    // Add livestock temperature analysis
    if (results.livestock_temperature) {
        message += `🌡️ Current Livestock Temperature: ${results.livestock_temperature.value}${results.livestock_temperature.unit}\n`;

        if (results.livestock_temperature.status === 'warning' || results.livestock_temperature.status === 'critical') {
            message += `⚠️ ${results.livestock_temperature.status === 'critical' ? 'CRITICAL' : 'Warning'}: ${results.livestock_temperature.message}\n`;
        } else {
            message += `✅ ${results.livestock_temperature.message}\n`;
        }

        if (results.livestock_temperature.suggestion) {
            message += `💡 Suggestion: ${results.livestock_temperature.suggestion}\n`;
        }

        if (results.livestock_temperature.action) {
            message += `🚜 Action: ${results.livestock_temperature.action}\n`;
        }

        message += '\n';
    }

    // Add crop health analysis
    if (results.crop_health) {
        message += `📸 Crop Health Analysis for image: ${results.crop_health.image_url}\n`;

        if (results.crop_health.status === 'warning' || results.crop_health.status === 'critical') {
            message += `⚠️ ${results.crop_health.status === 'critical' ? 'CRITICAL' : 'Warning'}: ${results.crop_health.message}\n`;
        } else {
            message += `✅ ${results.crop_health.message}\n`;
        }

        if (results.crop_health.suggestion) {
            message += `💡 Suggestion: ${results.crop_health.suggestion}\n`;
        }

        message += '\n';
    }

    return message;
};

// Main function
const main = async () => {
    try {
        console.log('🧪 Testing FermWise Monitoring System...\n');

        // Analyze all data
        console.log('📊 Analyzing all environmental data...\n');

        // Analyze humidity
        const humidityResults = analyzeHumidity(humidityData);
        console.log('');

        // Analyze soil moisture
        const soilMoistureResults = analyzeSoilMoisture(soilMoistureData);
        console.log('');

        // Analyze livestock temperature
        const livestockResults = analyzeLivestockTemperature(livestockTemperatureData);
        console.log('');

        // Analyze crop health
        const cropHealthResults = await analyzeCropHealth(cropImageData);
        console.log('');

        // Combine results
        const results = {
            farm_id: config.farmId,
            timestamp: new Date(),
            humidity: humidityResults,
            soil_moisture: soilMoistureResults,
            livestock_temperature: livestockResults,
            crop_health: cropHealthResults
        };

        // Format results
        const formattedResults = formatAnalysisResults(results);

        console.log('📝 Formatted Results:');
        console.log('-------------------');
        console.log(formattedResults);
        console.log('-------------------');

        console.log('🎉 Test completed successfully!');
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
};

// Run the test
main(); 