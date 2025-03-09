/**
 * Test script for the FermWise Monitoring System
 * 
 * This script tests the monitoring system with sample data.
 * 
 * Usage:
 * ts-node src/monitoring/test.ts
 */

import { monitoringService } from './monitoringService';
import {
    HumidityData,
    SoilMoistureData,
    LivestockTemperatureData,
    CropImageData
} from './types';
import { Timestamp } from 'firebase/firestore';

// Sample farm ID
const FARM_ID = 'test-farm-123';

// Sample humidity data (last 24 hours)
const humidityData: HumidityData[] = [
    {
        device_id: 'device-001',
        farm_id: FARM_ID,
        value: 65.2,
        unit: '%',
        timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 60 * 1)) // 1 hour ago
    },
    {
        device_id: 'device-001',
        farm_id: FARM_ID,
        value: 64.8,
        unit: '%',
        timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 60 * 2)) // 2 hours ago
    },
    {
        device_id: 'device-001',
        farm_id: FARM_ID,
        value: 66.5,
        unit: '%',
        timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 60 * 3)) // 3 hours ago
    },
    {
        device_id: 'device-001',
        farm_id: FARM_ID,
        value: 67.1,
        unit: '%',
        timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 60 * 4)) // 4 hours ago
    },
    {
        device_id: 'device-001',
        farm_id: FARM_ID,
        value: 63.9,
        unit: '%',
        timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 60 * 5)) // 5 hours ago
    }
];

// Sample soil moisture data (last 24 hours)
const soilMoistureData: SoilMoistureData[] = [
    {
        device_id: 'device-002',
        farm_id: FARM_ID,
        value: 42.8,
        unit: '%',
        timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 60 * 1)) // 1 hour ago
    },
    {
        device_id: 'device-002',
        farm_id: FARM_ID,
        value: 43.2,
        unit: '%',
        timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 60 * 2)) // 2 hours ago
    },
    {
        device_id: 'device-002',
        farm_id: FARM_ID,
        value: 41.9,
        unit: '%',
        timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 60 * 3)) // 3 hours ago
    },
    {
        device_id: 'device-002',
        farm_id: FARM_ID,
        value: 40.5,
        unit: '%',
        timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 60 * 4)) // 4 hours ago
    },
    {
        device_id: 'device-002',
        farm_id: FARM_ID,
        value: 44.1,
        unit: '%',
        timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 60 * 5)) // 5 hours ago
    }
];

// Sample livestock temperature data
const livestockTemperatureData: LivestockTemperatureData = {
    device_id: 'device-003',
    farm_id: FARM_ID,
    value: 38.5,
    unit: '°C',
    livestock_id: 'cow-001',
    livestock_type: 'dairy_cow',
    timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 30)) // 30 minutes ago
};

// Sample crop image data
const cropImageData: CropImageData = {
    device_id: 'device-004',
    farm_id: FARM_ID,
    image_url: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1374&q=80',
    crop_type: 'tomato',
    field_section: 'north',
    timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 60)) // 1 hour ago
};

/**
 * Test the monitoring system
 */
const testMonitoringSystem = async () => {
    console.log('🧪 Testing FermWise Monitoring System...\n');

    // Test with all data types
    console.log('📊 Testing with all data types...');
    const results = await monitoringService.analyzeEnvironmentalData(
        FARM_ID,
        humidityData,
        soilMoistureData,
        livestockTemperatureData,
        cropImageData
    );

    // Format and display results
    const formattedResults = monitoringService.formatAnalysisResults(results);
    console.log(formattedResults);

    // Test with only humidity data
    console.log('📊 Testing with only humidity data...');
    const humidityResults = await monitoringService.analyzeEnvironmentalData(
        FARM_ID,
        humidityData
    );

    // Format and display results
    const formattedHumidityResults = monitoringService.formatAnalysisResults(humidityResults);
    console.log(formattedHumidityResults);

    // Test with only soil moisture data
    console.log('📊 Testing with only soil moisture data...');
    const soilMoistureResults = await monitoringService.analyzeEnvironmentalData(
        FARM_ID,
        [],
        soilMoistureData
    );

    // Format and display results
    const formattedSoilMoistureResults = monitoringService.formatAnalysisResults(soilMoistureResults);
    console.log(formattedSoilMoistureResults);

    // Test with only livestock temperature data
    console.log('📊 Testing with only livestock temperature data...');
    const livestockResults = await monitoringService.analyzeEnvironmentalData(
        FARM_ID,
        [],
        [],
        livestockTemperatureData
    );

    // Format and display results
    const formattedLivestockResults = monitoringService.formatAnalysisResults(livestockResults);
    console.log(formattedLivestockResults);

    // Test with only crop image data
    console.log('📊 Testing with only crop image data...');
    const cropImageResults = await monitoringService.analyzeEnvironmentalData(
        FARM_ID,
        [],
        [],
        undefined,
        cropImageData
    );

    // Format and display results
    const formattedCropImageResults = monitoringService.formatAnalysisResults(cropImageResults);
    console.log(formattedCropImageResults);

    console.log('✅ Testing complete!');
};

// Run the test
testMonitoringSystem().catch(error => {
    console.error('❌ Error during testing:', error);
}); 