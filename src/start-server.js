/**
 * Server Starter Script
 * 
 * This script starts the server directly using ts-node.
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('Starting server...');

// Path to the index.ts file
const indexPath = path.join(__dirname, 'index.ts');

// Start the server using ts-node
const server = spawn('npx', ['ts-node', indexPath], {
    stdio: 'inherit',
    shell: true
});

// Handle server process events
server.on('error', (error) => {
    console.error(`Server error: ${error.message}`);
});

server.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('Stopping server...');
    server.kill('SIGINT');
    process.exit();
}); 