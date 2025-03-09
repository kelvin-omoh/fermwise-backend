import dotenv from 'dotenv';
import { Timestamp } from 'firebase-admin/firestore';

dotenv.config();

// Environment thresholds from .env
const HUMIDITY_MIN = Number(process.env.HUMIDITY_MIN || 40);
const HUMIDITY_MAX = Number(process.env.HUMIDITY_MAX || 70);
const SOIL_MOISTURE_MIN = Number(process.env.SOIL_MOISTURE_MIN || 30);
const SOIL_MOISTURE_MAX = Number(process.env.SOIL_MOISTURE_MAX || 60);
const LIVESTOCK_TEMP_MIN = Number(process.env.LIVESTOCK_TEMP_MIN || 37.5);
const LIVESTOCK_TEMP_MAX = Number(process.env.LIVESTOCK_TEMP_MAX || 39.5);

// Types
interface SensorReading {
    id: string;
    farm_id: string;
    device_id: string;
    type?: string;
    value?: number;
    unit?: string;
    timestamp: Timestamp;
    temperature?: number;
    humidity?: number;
    soil_moisture?: number;
    soil_temperature?: number;
    livestock_temperature?: number;
    image_url?: string;
    [key: string]: any;
}

interface MonitoringAlert {
    level: 'info' | 'warning' | 'critical';
    parameter: string;
    message: string;
    value: number;
    threshold: {
        min: number;
        max: number;
    };
    timestamp: Timestamp;
}

interface MonitoringRecommendation {
    parameter: string;
    message: string;
    priority: 'low' | 'medium' | 'high';
}

interface DeviceMonitoringResult {
    device_id: string;
    device_name: string;
    device_type: string;
    status: 'healthy' | 'needs_attention' | 'critical';
    alerts: MonitoringAlert[];
    recommendations: MonitoringRecommendation[];
    summary: string;
    last_reading_timestamp: Timestamp | null;
    readings: {
        temperature?: { value: number; unit: string; status: 'normal' | 'warning' | 'critical' };
        humidity?: { value: number; unit: string; status: 'normal' | 'warning' | 'critical' };
        soil_moisture?: { value: number; unit: string; status: 'normal' | 'warning' | 'critical' };
        soil_temperature?: { value: number; unit: string; status: 'normal' | 'warning' | 'critical' };
        livestock_temperature?: { value: number; unit: string; status: 'normal' | 'warning' | 'critical' };
    };
}

interface MonitoringResult {
    alerts: MonitoringAlert[];
    recommendations: MonitoringRecommendation[];
    status: 'healthy' | 'needs_attention' | 'critical';
    last_updated: Timestamp;
    summary: string;
    devices_monitoring: DeviceMonitoringResult[];
}

// Helper function to get the latest reading for each sensor type
const getLatestReadings = (sensorData: SensorReading[]): Record<string, SensorReading> => {
    const latestReadings: Record<string, SensorReading> = {};

    // Process readings with specific type field
    sensorData.forEach(reading => {
        if (reading.type) {
            if (!latestReadings[reading.type] ||
                reading.timestamp.seconds > latestReadings[reading.type].timestamp.seconds ||
                (reading.timestamp.seconds === latestReadings[reading.type].timestamp.seconds &&
                    reading.timestamp.nanoseconds > latestReadings[reading.type].timestamp.nanoseconds)) {
                latestReadings[reading.type] = reading;
            }
        }
    });

    // Process readings with multiple parameters in a single document
    sensorData.forEach(reading => {
        // Check for temperature
        if (reading.temperature !== undefined &&
            (!latestReadings['temperature'] ||
                reading.timestamp.seconds > latestReadings['temperature'].timestamp.seconds)) {
            latestReadings['temperature'] = {
                ...reading,
                type: 'temperature',
                value: reading.temperature,
                unit: '°C'
            };
        }

        // Check for humidity
        if (reading.humidity !== undefined &&
            (!latestReadings['humidity'] ||
                reading.timestamp.seconds > latestReadings['humidity'].timestamp.seconds)) {
            latestReadings['humidity'] = {
                ...reading,
                type: 'humidity',
                value: reading.humidity,
                unit: '%'
            };
        }

        // Check for soil_moisture
        if (reading.soil_moisture !== undefined &&
            (!latestReadings['soil_moisture'] ||
                reading.timestamp.seconds > latestReadings['soil_moisture'].timestamp.seconds)) {
            latestReadings['soil_moisture'] = {
                ...reading,
                type: 'soil_moisture',
                value: reading.soil_moisture,
                unit: '%'
            };
        }

        // Check for soil_temperature
        if (reading.soil_temperature !== undefined &&
            (!latestReadings['soil_temperature'] ||
                reading.timestamp.seconds > latestReadings['soil_temperature'].timestamp.seconds)) {
            latestReadings['soil_temperature'] = {
                ...reading,
                type: 'soil_temperature',
                value: reading.soil_temperature,
                unit: '°C'
            };
        }

        // Check for livestock_temperature
        if (reading.livestock_temperature !== undefined &&
            (!latestReadings['livestock_temperature'] ||
                reading.timestamp.seconds > latestReadings['livestock_temperature'].timestamp.seconds)) {
            latestReadings['livestock_temperature'] = {
                ...reading,
                type: 'livestock_temperature',
                value: reading.livestock_temperature,
                unit: '°C'
            };
        }
    });

    return latestReadings;
};

// Helper function to get device info from devices array
const getDeviceInfo = (deviceId: string, devices: any[]): { name: string; type: string } => {
    const device = devices.find(d => d.device_id === deviceId || d.id === deviceId);
    return {
        name: device?.name || 'Unknown Device',
        type: device?.device_type || device?.type || 'Unknown Type'
    };
};

// Helper function to determine status based on value and thresholds
const getParameterStatus = (
    value: number | undefined,
    min: number,
    max: number
): 'normal' | 'warning' | 'critical' => {
    if (value === undefined) return 'normal';

    if (value < min * 0.8 || value > max * 1.2) {
        return 'critical';
    } else if (value < min || value > max) {
        return 'warning';
    }
    return 'normal';
};

// Function to analyze device-specific data
const analyzeDeviceData = (
    deviceId: string,
    deviceReadings: SensorReading[],
    devices: any[]
): DeviceMonitoringResult => {
    const deviceInfo = getDeviceInfo(deviceId, devices);
    const latestReadings = getLatestReadings(deviceReadings);

    const alerts: MonitoringAlert[] = [];
    const recommendations: MonitoringRecommendation[] = [];
    let criticalCount = 0;
    let warningCount = 0;

    // Get latest timestamp from readings
    let latestTimestamp: Timestamp | null = null;
    Object.values(latestReadings).forEach(reading => {
        if (!latestTimestamp ||
            reading.timestamp.seconds > latestTimestamp.seconds ||
            (reading.timestamp.seconds === latestTimestamp.seconds &&
                reading.timestamp.nanoseconds > latestTimestamp.nanoseconds)) {
            latestTimestamp = reading.timestamp;
        }
    });

    // Initialize readings object
    const readings: DeviceMonitoringResult['readings'] = {};

    // Check humidity
    if (latestReadings['humidity']) {
        const humidity = latestReadings['humidity'].value || latestReadings['humidity'].humidity;
        if (humidity !== undefined) {
            readings.humidity = {
                value: humidity,
                unit: '%',
                status: getParameterStatus(humidity, HUMIDITY_MIN, HUMIDITY_MAX)
            };

            if (humidity < HUMIDITY_MIN) {
                alerts.push({
                    level: 'warning',
                    parameter: 'humidity',
                    message: `Humidity is too low (${humidity}%). Consider irrigation or humidity control.`,
                    value: humidity,
                    threshold: { min: HUMIDITY_MIN, max: HUMIDITY_MAX },
                    timestamp: latestReadings['humidity'].timestamp
                });
                recommendations.push({
                    parameter: 'humidity',
                    message: 'Increase irrigation frequency or use humidity control systems.',
                    priority: 'medium'
                });
                warningCount++;
            } else if (humidity > HUMIDITY_MAX) {
                alerts.push({
                    level: 'warning',
                    parameter: 'humidity',
                    message: `Humidity is too high (${humidity}%). Consider improving ventilation.`,
                    value: humidity,
                    threshold: { min: HUMIDITY_MIN, max: HUMIDITY_MAX },
                    timestamp: latestReadings['humidity'].timestamp
                });
                recommendations.push({
                    parameter: 'humidity',
                    message: 'Improve ventilation or reduce irrigation frequency.',
                    priority: 'medium'
                });
                warningCount++;
            }
        }
    }

    // Check soil moisture
    if (latestReadings['soil_moisture']) {
        const soilMoisture = latestReadings['soil_moisture'].value || latestReadings['soil_moisture'].soil_moisture;
        if (soilMoisture !== undefined) {
            readings.soil_moisture = {
                value: soilMoisture,
                unit: '%',
                status: getParameterStatus(soilMoisture, SOIL_MOISTURE_MIN, SOIL_MOISTURE_MAX)
            };

            if (soilMoisture < SOIL_MOISTURE_MIN) {
                alerts.push({
                    level: 'critical',
                    parameter: 'soil_moisture',
                    message: `Soil moisture is critically low (${soilMoisture}%). Immediate irrigation needed.`,
                    value: soilMoisture,
                    threshold: { min: SOIL_MOISTURE_MIN, max: SOIL_MOISTURE_MAX },
                    timestamp: latestReadings['soil_moisture'].timestamp
                });
                recommendations.push({
                    parameter: 'soil_moisture',
                    message: 'Irrigate immediately and consider increasing regular irrigation schedule.',
                    priority: 'high'
                });
                criticalCount++;
            } else if (soilMoisture > SOIL_MOISTURE_MAX) {
                alerts.push({
                    level: 'warning',
                    parameter: 'soil_moisture',
                    message: `Soil moisture is too high (${soilMoisture}%). Risk of root rot.`,
                    value: soilMoisture,
                    threshold: { min: SOIL_MOISTURE_MIN, max: SOIL_MOISTURE_MAX },
                    timestamp: latestReadings['soil_moisture'].timestamp
                });
                recommendations.push({
                    parameter: 'soil_moisture',
                    message: 'Reduce irrigation and ensure proper drainage.',
                    priority: 'medium'
                });
                warningCount++;
            }
        }
    }

    // Check temperature
    if (latestReadings['temperature']) {
        const temperature = latestReadings['temperature'].value || latestReadings['temperature'].temperature;
        if (temperature !== undefined) {
            readings.temperature = {
                value: temperature,
                unit: '°C',
                status: 'normal' // Temperature doesn't have specific thresholds in our system yet
            };
        }
    }

    // Check soil temperature
    if (latestReadings['soil_temperature']) {
        const soilTemperature = latestReadings['soil_temperature'].value || latestReadings['soil_temperature'].soil_temperature;
        if (soilTemperature !== undefined) {
            readings.soil_temperature = {
                value: soilTemperature,
                unit: '°C',
                status: 'normal' // Soil temperature doesn't have specific thresholds in our system yet
            };
        }
    }

    // Check livestock temperature if applicable
    if (latestReadings['livestock_temperature']) {
        const livestockTemp = latestReadings['livestock_temperature'].value ||
            latestReadings['livestock_temperature'].livestock_temperature;
        if (livestockTemp !== undefined) {
            readings.livestock_temperature = {
                value: livestockTemp,
                unit: '°C',
                status: getParameterStatus(livestockTemp, LIVESTOCK_TEMP_MIN, LIVESTOCK_TEMP_MAX)
            };

            if (livestockTemp < LIVESTOCK_TEMP_MIN) {
                alerts.push({
                    level: 'critical',
                    parameter: 'livestock_temperature',
                    message: `Livestock temperature is too low (${livestockTemp}°C). Immediate attention required.`,
                    value: livestockTemp,
                    threshold: { min: LIVESTOCK_TEMP_MIN, max: LIVESTOCK_TEMP_MAX },
                    timestamp: latestReadings['livestock_temperature'].timestamp
                });
                recommendations.push({
                    parameter: 'livestock_temperature',
                    message: 'Provide warmth and shelter. Consider veterinary consultation.',
                    priority: 'high'
                });
                criticalCount++;
            } else if (livestockTemp > LIVESTOCK_TEMP_MAX) {
                alerts.push({
                    level: 'critical',
                    parameter: 'livestock_temperature',
                    message: `Livestock temperature is too high (${livestockTemp}°C). Immediate cooling needed.`,
                    value: livestockTemp,
                    threshold: { min: LIVESTOCK_TEMP_MIN, max: LIVESTOCK_TEMP_MAX },
                    timestamp: latestReadings['livestock_temperature'].timestamp
                });
                recommendations.push({
                    parameter: 'livestock_temperature',
                    message: 'Provide shade, water, and cooling. Consider veterinary consultation.',
                    priority: 'high'
                });
                criticalCount++;
            }
        }
    }

    // Check for data freshness
    const now = Timestamp.now();
    const oldestAllowedTimestamp = new Timestamp(now.seconds - 86400, 0); // 24 hours ago
    let hasStaleData = false;

    Object.values(latestReadings).forEach(reading => {
        if (reading.timestamp.seconds < oldestAllowedTimestamp.seconds) {
            hasStaleData = true;
            alerts.push({
                level: 'info',
                parameter: reading.type || 'sensor',
                message: `Sensor data for ${reading.type || 'sensor'} is more than 24 hours old.`,
                value: 0,
                threshold: { min: 0, max: 0 },
                timestamp: reading.timestamp
            });
        }
    });

    if (hasStaleData) {
        recommendations.push({
            parameter: 'data_collection',
            message: 'Check sensor connectivity and ensure regular data collection.',
            priority: 'low'
        });
    }

    // Determine overall status
    let status: 'healthy' | 'needs_attention' | 'critical' = 'healthy';
    if (criticalCount > 0) {
        status = 'critical';
    } else if (warningCount > 0 || hasStaleData) {
        status = 'needs_attention';
    }

    // Generate summary
    let summary = '';
    if (status === 'healthy') {
        summary = `Device "${deviceInfo.name}" is operating normally with all parameters in optimal ranges.`;
    } else if (status === 'needs_attention') {
        summary = `Device "${deviceInfo.name}" requires attention: ${warningCount} warning(s) detected.`;
        if (hasStaleData) {
            summary += ' Some sensor data is outdated.';
        }
    } else {
        summary = `Device "${deviceInfo.name}" has critical issues: ${criticalCount} critical alert(s) require immediate action.`;
    }

    return {
        device_id: deviceId,
        device_name: deviceInfo.name,
        device_type: deviceInfo.type,
        status,
        alerts,
        recommendations,
        summary,
        last_reading_timestamp: latestTimestamp,
        readings
    };
};

// Main monitoring function (updated)
export const analyzeFarmData = (
    farmData: any,
    sensorData: SensorReading[],
    devices?: any[]
): MonitoringResult => {
    const farmDevices = devices || farmData.devices || [];
    const alerts: MonitoringAlert[] = [];
    const recommendations: MonitoringRecommendation[] = [];
    let criticalCount = 0;
    let warningCount = 0;

    // Get latest readings for each sensor type
    const latestReadings = getLatestReadings(sensorData);

    // Current timestamp for the analysis
    const now = Timestamp.now();

    // Group sensor data by device
    const sensorDataByDevice: Record<string, SensorReading[]> = {};
    sensorData.forEach(reading => {
        const deviceId = reading.device_id;
        if (!sensorDataByDevice[deviceId]) {
            sensorDataByDevice[deviceId] = [];
        }
        sensorDataByDevice[deviceId].push(reading);
    });

    // Analyze each device
    const devicesMonitoring: DeviceMonitoringResult[] = [];
    Object.keys(sensorDataByDevice).forEach(deviceId => {
        const deviceMonitoring = analyzeDeviceData(deviceId, sensorDataByDevice[deviceId], farmDevices);
        devicesMonitoring.push(deviceMonitoring);

        // Add device alerts to farm alerts
        deviceMonitoring.alerts.forEach(alert => {
            alerts.push(alert);
            if (alert.level === 'critical') criticalCount++;
            if (alert.level === 'warning') warningCount++;
        });

        // Add unique device recommendations to farm recommendations
        deviceMonitoring.recommendations.forEach(rec => {
            if (!recommendations.some(r => r.parameter === rec.parameter && r.message === rec.message)) {
                recommendations.push(rec);
            }
        });
    });

    // Check for data freshness
    const oldestAllowedTimestamp = new Timestamp(now.seconds - 86400, 0); // 24 hours ago
    let hasStaleData = false;

    Object.values(latestReadings).forEach(reading => {
        if (reading.timestamp.seconds < oldestAllowedTimestamp.seconds) {
            hasStaleData = true;
        }
    });

    // Add crop-specific recommendations based on crop type
    if (farmData.crop_type) {
        const cropType = farmData.crop_type.toLowerCase();

        if (cropType === 'maize' || cropType === 'corn') {
            // Maize/Corn specific recommendations
            recommendations.push({
                parameter: 'crop_management',
                message: 'For optimal maize growth, maintain soil moisture between 40-60% during tasseling stage.',
                priority: 'medium'
            });

            // Check growth stage based on planting date
            if (farmData.planting_date && farmData.planting_date.seconds) {
                const plantingDate = new Date(farmData.planting_date.seconds * 1000);
                const currentDate = new Date();
                const daysSincePlanting = Math.floor((currentDate.getTime() - plantingDate.getTime()) / (1000 * 60 * 60 * 24));

                if (daysSincePlanting < 30) {
                    recommendations.push({
                        parameter: 'growth_stage',
                        message: 'Early growth stage: Focus on weed control and maintaining adequate soil moisture.',
                        priority: 'medium'
                    });
                } else if (daysSincePlanting < 60) {
                    recommendations.push({
                        parameter: 'growth_stage',
                        message: 'Vegetative stage: Ensure adequate nitrogen availability for optimal leaf development.',
                        priority: 'medium'
                    });
                } else if (daysSincePlanting < 90) {
                    recommendations.push({
                        parameter: 'growth_stage',
                        message: 'Reproductive stage: Critical period for water needs. Maintain consistent soil moisture.',
                        priority: 'high'
                    });
                } else {
                    recommendations.push({
                        parameter: 'growth_stage',
                        message: 'Maturation stage: Reduce irrigation to allow proper grain drying.',
                        priority: 'medium'
                    });
                }
            }
        }
        // Add more crop types as needed
    }

    // Determine overall status
    let status: 'healthy' | 'needs_attention' | 'critical' = 'healthy';
    if (criticalCount > 0) {
        status = 'critical';
    } else if (warningCount > 0 || hasStaleData) {
        status = 'needs_attention';
    }

    // Generate summary
    let summary = '';
    if (status === 'healthy') {
        summary = 'All farm parameters are within optimal ranges.';
    } else if (status === 'needs_attention') {
        summary = `Farm requires attention: ${warningCount} warning(s) detected.`;
        if (hasStaleData) {
            summary += ' Some sensor data is outdated.';
        }
    } else {
        summary = `Critical issues detected: ${criticalCount} critical alert(s) require immediate action.`;
    }

    return {
        alerts,
        recommendations,
        status,
        last_updated: now,
        summary,
        devices_monitoring: devicesMonitoring
    };
}; 