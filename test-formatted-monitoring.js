/**
 * Test script for the formatted monitoring endpoint
 * 
 * This script makes a request to the formatted monitoring endpoint and displays
 * both the JSON response and the formatted text output.
 * 
 * Usage:
 * node test-formatted-monitoring.js
 */

const http = require('http');

// Configuration
const config = {
    host: 'localhost',
    port: 8080,
    path: '/api/farms/cvs0zzBaayfJP4xKzZqr/monitoring-formatted',
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

            // Display the formatted text output
            console.log('\n===== FORMATTED TEXT OUTPUT =====\n');
            console.log(parsedData.formatted_text);

            // Display the JSON response structure
            console.log('\n===== JSON RESPONSE STRUCTURE =====\n');
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