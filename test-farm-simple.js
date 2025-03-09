/**
 * Simple test script for the farm endpoint
 * 
 * This script makes a direct HTTP request to the farm endpoint without authentication.
 * It's useful for testing the endpoint when authentication is disabled for development.
 * 
 * Usage:
 * node test-farm-simple.js
 */

const http = require('http');

// Configuration
const config = {
    host: 'localhost',
    port: 8080,
    path: '/api/farms/cvs0zzBaayfJP4xKzZqr',
    method: 'GET'
};

console.log(`Making request to http://${config.host}:${config.port}${config.path}`);

// Make the request
const req = http.request(config, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            // Try to parse as JSON
            const jsonData = JSON.parse(data);
            console.log('Response received:');
            console.log(JSON.stringify(jsonData, null, 2));
        } catch (e) {
            // If not JSON, just print the raw data
            console.log('Raw response:');
            console.log(data);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

// End the request
req.end(); 