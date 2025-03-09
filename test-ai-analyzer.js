/**
 * Test script for AI Crop Health Analyzer with Cloudinary URLs
 * 
 * Usage:
 * 1. Update the configuration below with your actual values
 * 2. Run this script: node test-ai-analyzer.js
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
    // Use a Cloudinary URL from the previous test or provide your own
    imageUrl: 'https://res.cloudinary.com/dg78jueqi/image/upload/v1741521376/fermwise/test-farm-123/test-device-456/crop_1741521371432.jpg',
    farmId: 'test-farm-123',
    deviceId: 'test-device-456',
    cropType: 'tomato'
};

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

// Analyze crop health using Gemini AI
const analyzeCropHealth = async (imageUrl) => {
    try {
        console.log('Analyzing crop health with Gemini AI...');
        console.log('Image URL:', imageUrl);

        // Fetch image and convert to base64
        const base64Image = await fetchImageAsBase64(imageUrl);

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

        console.log('\n✅ Analysis complete!');
        console.log('\nAI Analysis:');
        console.log('-------------------');
        console.log(text);
        console.log('-------------------');

        return text;
    } catch (error) {
        console.error('❌ Error analyzing crop health:', error);
        throw error;
    }
};

// Main function
const main = async () => {
    try {
        console.log('🧪 Testing AI Crop Health Analyzer...\n');

        // Analyze crop health
        await analyzeCropHealth(config.imageUrl);

        console.log('\n🎉 Test completed successfully!');
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
};

// Run the test
main(); 