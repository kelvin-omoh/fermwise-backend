/**
 * Test script for image upload functionality
 * 
 * Usage:
 * 1. Start the server: npm run dev
 * 2. Update the configuration below with your actual values
 * 3. Run this script: node test-image-upload.js
 * 
 * To get your auth token:
 * 1. Log in to the web application
 * 2. Open browser developer tools (F12)
 * 3. Go to Application tab > Local Storage
 * 4. Find the 'authToken' or 'token' key and copy its value
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const FormData = require('form-data');
const fetch = require('node-fetch');

// ======= CONFIGURATION - UPDATE THESE VALUES =======
const config = {
    apiUrl: 'http://localhost:5000',
    authToken: 'YOUR_AUTH_TOKEN', // Get this from browser localStorage after logging in
    deviceId: 'YOUR_DEVICE_ID',   // The ID of a device registered to your farm
    farmId: 'YOUR_FARM_ID',       // The ID of your farm
    testImageUrl: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1374&q=80'
};
// ===================================================

// Validate configuration
if (config.authToken === 'YOUR_AUTH_TOKEN' ||
    config.deviceId === 'YOUR_DEVICE_ID' ||
    config.farmId === 'YOUR_FARM_ID') {
    console.error('⚠️ Please update the configuration in the script with your actual values!');
    console.error('See the instructions at the top of the file for how to get your auth token.');
    process.exit(1);
}

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

// Upload image to the API
const uploadImage = async (filepath) => {
    const form = new FormData();
    form.append('device_id', config.deviceId);
    form.append('farm_id', config.farmId);
    form.append('image', fs.createReadStream(filepath));

    try {
        console.log(`Sending request to ${config.apiUrl}/api/devices/upload-image`);
        console.log(`Using device_id: ${config.deviceId}, farm_id: ${config.farmId}`);

        const response = await fetch(`${config.apiUrl}/api/devices/upload-image`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.authToken}`
            },
            body: form
        });

        // Handle non-JSON responses
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.log('❌ Non-JSON response received:', text);
            throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}...`);
        }

        const result = await response.json();

        if (!response.ok) {
            throw new Error(`Upload failed: ${JSON.stringify(result)}`);
        }

        console.log('✅ Upload successful!');
        console.log(JSON.stringify(result, null, 2));
        return result;
    } catch (error) {
        console.error('❌ Error uploading image:', error);
        throw error;
    }
};

// Main function
const main = async () => {
    try {
        console.log('🚀 Starting image upload test...');

        // Step 1: Download a test image
        const testImagePath = path.join(uploadsDir, 'test-image.jpg');
        await downloadImage(config.testImageUrl, testImagePath);

        // Step 2: Upload the image to the API
        console.log('�� Uploading image to API...');
        await uploadImage(testImagePath);

        console.log('🎉 Test completed successfully!');
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
};

// Run the test
main(); 