/**
 * Test script for Cloudinary direct upload functionality
 * 
 * Usage:
 * 1. Update the configuration below with your actual values
 * 2. Run this script: node test-cloudinary.js
 */

require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const https = require('https');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuration
const config = {
    testImageUrl: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1374&q=80',
    farmId: 'test-farm-123',
    deviceId: 'test-device-456',
    cropType: 'tomato'
};

// Create test-uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'test-uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Download a test image
const downloadImage = (url, filepath) => {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;

        console.log(`Downloading test image from ${url}...`);
        client.get(url, (res) => {
            if (res.statusCode === 200) {
                const fileStream = fs.createWriteStream(filepath);
                res.pipe(fileStream);

                fileStream.on('finish', () => {
                    fileStream.close();
                    console.log(`✅ Downloaded image to ${filepath}`);
                    resolve(filepath);
                });
            } else {
                reject(new Error(`Failed to download image: ${res.statusCode}`));
            }
        }).on('error', (err) => {
            reject(err);
        });
    });
};

// Upload image to Cloudinary directly
const uploadToCloudinary = async (filepath) => {
    try {
        console.log('Uploading to Cloudinary...');

        // Read file as base64
        const imageBuffer = fs.readFileSync(filepath);
        const base64Image = imageBuffer.toString('base64');

        // Upload options
        const uploadOptions = {
            folder: `fermwise/${config.farmId}/${config.deviceId}`,
            public_id: `crop_${Date.now()}`,
            tags: [config.farmId, config.deviceId, config.cropType],
            resource_type: 'image'
        };

        // Upload using base64
        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload(
                `data:image/jpeg;base64,${base64Image}`,
                uploadOptions,
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                }
            );
        });

        console.log('✅ Upload successful!');
        console.log('Image URL:', result.secure_url);
        console.log('Public ID:', result.public_id);

        // Log the data that would be stored in Firestore
        console.log('\nData to store in Firestore:');
        console.log(JSON.stringify({
            farm_id: config.farmId,
            device_id: config.deviceId,
            image_url: result.secure_url,
            crop_type: config.cropType,
            public_id: result.public_id,
            timestamp: new Date(),
            metadata: {
                width: result.width,
                height: result.height,
                format: result.format,
                resource_type: result.resource_type,
                bytes: result.bytes
            }
        }, null, 2));

        return result;
    } catch (error) {
        console.error('❌ Error uploading to Cloudinary:', error);
        throw error;
    }
};

// Upload image directly from URL to Cloudinary
const uploadFromUrlToCloudinary = async (imageUrl) => {
    try {
        console.log('Uploading from URL to Cloudinary...');

        // Upload options
        const uploadOptions = {
            folder: `fermwise/${config.farmId}/${config.deviceId}`,
            public_id: `crop_url_${Date.now()}`,
            tags: [config.farmId, config.deviceId, config.cropType],
            resource_type: 'image'
        };

        // Upload using URL
        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload(
                imageUrl,
                uploadOptions,
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                }
            );
        });

        console.log('✅ URL Upload successful!');
        console.log('Image URL:', result.secure_url);
        console.log('Public ID:', result.public_id);

        return result;
    } catch (error) {
        console.error('❌ Error uploading from URL to Cloudinary:', error);
        throw error;
    }
};

// Main function
const main = async () => {
    try {
        console.log('🧪 Testing Cloudinary Direct Upload...\n');

        // Test 1: Download and upload from file
        console.log('📋 Test 1: Download and upload from file');
        const testImagePath = path.join(uploadsDir, 'test-image.jpg');
        await downloadImage(config.testImageUrl, testImagePath);
        await uploadToCloudinary(testImagePath);

        console.log('\n📋 Test 2: Upload directly from URL');
        await uploadFromUrlToCloudinary(config.testImageUrl);

        console.log('\n🎉 All tests completed successfully!');
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
};

// Run the test
main(); 