/**
 * Script to display the raw JSON response from the farm endpoint
 * 
 * This script makes a request to the farm endpoint and displays the complete
 * JSON response structure without any formatting or processing.
 * 
 * Usage:
 * node show-farm-endpoint.js
 */

const http = require('http');
const fs = require('fs');

// Configuration
const config = {
    host: 'localhost',
    port: 8080,
    path: '/api/farms/cvs0zzBaayfJP4xKzZqr',
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
};

console.log(`Making request to http://${config.host}:${config.port}${config.path}`);

// Make the request
const req = http.request(config, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

    let data = '';

    // Collect data chunks
    res.on('data', (chunk) => {
        data += chunk;
    });

    // Process the complete response
    res.on('end', () => {
        try {
            const parsedData = JSON.parse(data);

            // Save the response to a file for easier viewing
            fs.writeFileSync('farm-endpoint-response.json', JSON.stringify(parsedData, null, 2));
            console.log('\nResponse saved to farm-endpoint-response.json');

            // Display the complete response structure
            console.log('\n===== COMPLETE RESPONSE STRUCTURE =====\n');
            console.log(JSON.stringify(parsedData, null, 2));

        } catch (e) {
            console.error('Error parsing JSON response:', e);
            console.log('Raw response:', data);
        }
    });
});

// Handle request errors
req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

// End the request
req.end(); 