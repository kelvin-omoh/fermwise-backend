#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
FermWise IoT Device Client

This script is designed to run on an IoT device to collect sensor readings
and send them to the FermWise API. It implements the "Take Reading" functionality
from the IoT device menu.

Requirements:
- Python 3.6+
- requests library (pip install requests)
- Any required sensor libraries based on your hardware
"""

import json
import time
import random
import requests
from datetime import datetime

# Configuration - Update with your device serial number
CONFIG = {
    "api_url": "http://localhost:8080",      # Update with your API URL
    "serial_number": "FW-DEVICE-12345"       # Update with your device serial number
}

# In a real implementation, these would be replaced with actual sensor readings
def read_temperature():
    """Read temperature from sensor"""
    # Replace with actual sensor code
    return round(random.uniform(15, 35), 1)  # 15-35°C

def read_humidity():
    """Read humidity from sensor"""
    # Replace with actual sensor code
    return round(random.uniform(40, 80), 1)  # 40-80%

def read_soil_temperature():
    """Read soil temperature from sensor"""
    # Replace with actual sensor code
    return round(random.uniform(10, 30), 1)  # 10-30°C

def read_soil_moisture():
    """Read soil moisture from sensor"""
    # Replace with actual sensor code
    return round(random.uniform(20, 80), 1)  # 20-80%

def read_livestock_temperature():
    """Read livestock temperature from sensor"""
    # Replace with actual sensor code
    return round(random.uniform(37, 40), 1)  # 37-40°C

def take_reading():
    """Take readings from all sensors and send to API"""
    try:
        print("📊 Taking sensor readings...")
        
        # Collect readings from sensors
        readings = {
            "temperature": read_temperature(),
            "humidity": read_humidity(),
            "soil_temperature": read_soil_temperature(),
            "soil_moisture": read_soil_moisture(),
            "livestock_temperature": read_livestock_temperature()
        }
        
        print(f"📡 Readings collected at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}:")
        for key, value in readings.items():
            print(f"  - {key}: {value}")
        
        # Prepare payload
        payload = {
            **readings,
            "serial_number": CONFIG["serial_number"]
        }
        
        # Send to API
        print(f"📡 Sending readings to FermWise API...")
        response = requests.post(
            f"{CONFIG['api_url']}/api/device/readings",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        # Handle response
        if response.status_code == 201:
            print("✅ Readings sent successfully!")
            result = response.json()
            print(f"  - Response: {json.dumps(result, indent=2)}")
            return True
        else:
            print(f"❌ Failed to send readings: {response.status_code}")
            print(f"  - Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error taking readings: {str(e)}")
        return False

def display_menu():
    """Display the IoT device menu"""
    print("\n" + "=" * 40)
    print("🌱 FermWise IoT Device")
    print("=" * 40)
    print("Select Mode:")
    print("1. Take Reading")
    print("2. Take Picture")
    print("3. Real-Time")
    print("4. Exit")
    print("=" * 40)
    
    choice = input("Enter your choice (1-4): ")
    
    if choice == "1":
        take_reading()
    elif choice == "2":
        print("📸 Take Picture functionality not implemented yet")
    elif choice == "3":
        print("⏱️ Real-Time monitoring not implemented yet")
    elif choice == "4":
        print("👋 Exiting...")
        return False
    else:
        print("❌ Invalid choice. Please try again.")
    
    return True

def main():
    """Main function"""
    print("🌱 FermWise IoT Device Client")
    print("Starting up...")
    
    running = True
    while running:
        running = display_menu()
        if running:
            time.sleep(1)  # Short pause between menu displays
    
    print("Device client shutdown complete.")

if __name__ == "__main__":
    main() 