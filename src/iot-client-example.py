#!/usr/bin/env python3
"""
IoT Device Client Example (Python version)

This is an example of how an IoT device can connect to the server
and send real-time sensor data using Socket.io.

To use this example:
1. Install dependencies: pip install python-socketio requests
2. Update the SERVER_URL to point to your backend server
3. Update the SERIAL_NUMBER to match your device's serial number
4. Run this script on your IoT device
"""

import socketio
import time
import random
import json
import requests
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('iot-client')

# Configuration
SERVER_URL = 'http://localhost:8080'  # Update with your server URL
SERIAL_NUMBER = 'DEVICE_001'  # Update with your device's serial number
SEND_INTERVAL = 5  # Send data every 5 seconds

# Create Socket.io client
sio = socketio.Client()

# Generate random sensor data (simulate real sensors)
def generate_sensor_data():
    return {
        'serial_number': SERIAL_NUMBER,
        'temperature': round(20 + random.random() * 15, 1),  # 20-35°C
        'humidity': round(40 + random.random() * 40, 1),  # 40-80%
        'soil_temperature': round(15 + random.random() * 10, 1),  # 15-25°C
        'soil_moisture': round(30 + random.random() * 50, 1),  # 30-80%
        'livestock_temperature': round(35 + random.random() * 5, 1)  # 35-40°C
    }

# Send data via HTTP POST (as a backup)
def send_http_data(data):
    try:
        response = requests.post(
            f"{SERVER_URL}/api/device/readings",
            json=data,
            headers={'Content-Type': 'application/json'}
        )
        if response.status_code == 201:
            logger.info(f"HTTP response: {response.json()}")
        else:
            logger.error(f"HTTP error: {response.status_code} - {response.text}")
    except Exception as e:
        logger.error(f"HTTP request failed: {e}")

# Send data via Socket.io
def send_socketio_data():
    data = generate_sensor_data()
    logger.info(f"Sending sensor data: {data}")
    
    # Method 1: Send data via Socket.io
    sio.emit('sensor_data', data)
    
    # Method 2: Send data via HTTP POST (as a backup)
    # Uncomment the following line to enable HTTP backup
    # send_http_data(data)

# Socket.io event handlers
@sio.event
def connect():
    logger.info(f"Connected to server with session ID: {sio.sid}")
    
    # Register the device
    sio.emit('register_device', {
        'serial_number': SERIAL_NUMBER,
        'device_type': 'agricultural_sensor'
    })
    
    # Start sending data
    logger.info(f"Starting to send data every {SEND_INTERVAL} seconds")
    
    # Send initial data
    send_socketio_data()

@sio.event
def connect_error(data):
    logger.error(f"Connection error: {data}")

@sio.event
def disconnect():
    logger.info("Disconnected from server")

@sio.on('sensor_data_ack')
def on_sensor_data_ack(data):
    logger.info(f"Server acknowledged data: {data}")

@sio.on('error')
def on_error(data):
    logger.error(f"Server error: {data}")

# Main function
def main():
    try:
        # Connect to the server
        logger.info(f"Connecting to server at {SERVER_URL}")
        sio.connect(SERVER_URL)
        
        # Send data at regular intervals
        while True:
            time.sleep(SEND_INTERVAL)
            send_socketio_data()
            
    except KeyboardInterrupt:
        logger.info("Stopping client...")
    except Exception as e:
        logger.error(f"Error: {e}")
    finally:
        if sio.connected:
            sio.disconnect()

if __name__ == "__main__":
    main() 