/**
 * Conditional Analyzers for FermWise Monitoring System
 * 
 * These analyzers use simple if-else logic to provide insights based on sensor data.
 */

import {
    HumidityData,
    SoilMoistureData,
    LivestockTemperatureData,
    HumidityAnalysisResult,
    SoilMoistureAnalysisResult,
    LivestockTemperatureAnalysisResult,
    MonitoringThresholds
} from './types';

/**
 * Analyzes humidity data using conditional logic
 */
export const analyzeHumidity = (
    humidityData: HumidityData[],
    thresholds: MonitoringThresholds
): HumidityAnalysisResult => {
    // Calculate average humidity
    const totalHumidity = humidityData.reduce((sum, data) => sum + data.value, 0);
    const averageHumidity = humidityData.length > 0 ? totalHumidity / humidityData.length : 0;
    const unit = humidityData.length > 0 ? humidityData[0].unit : '%';

    // Format to 2 decimal places
    const formattedAverage = parseFloat(averageHumidity.toFixed(2));

    // Determine status and message based on thresholds
    let status: 'normal' | 'warning' | 'critical' = 'normal';
    let message = '';
    let suggestion = '';

    if (averageHumidity < thresholds.humidity.min) {
        status = 'warning';
        message = `Humidity is too low (${formattedAverage}${unit})! This can stress your crops.`;
        suggestion = 'Consider increasing irrigation or using a humidifier in enclosed spaces.';
    } else if (averageHumidity > thresholds.humidity.max) {
        status = 'warning';
        message = `Humidity is too high (${formattedAverage}${unit})! This can lead to fungal diseases.`;
        suggestion = 'Ensure proper ventilation in your crop area.';
    } else {
        message = `Humidity is at an optimal level (${formattedAverage}${unit}).`;
        suggestion = 'Continue with your current management practices.';
    }

    return {
        timestamp: new Date(),
        status,
        message,
        suggestion,
        average_value: formattedAverage,
        unit,
        min_threshold: thresholds.humidity.min,
        max_threshold: thresholds.humidity.max
    };
};

/**
 * Analyzes soil moisture data using conditional logic
 */
export const analyzeSoilMoisture = (
    soilMoistureData: SoilMoistureData[],
    thresholds: MonitoringThresholds
): SoilMoistureAnalysisResult => {
    // Calculate average soil moisture
    const totalMoisture = soilMoistureData.reduce((sum, data) => sum + data.value, 0);
    const averageMoisture = soilMoistureData.length > 0 ? totalMoisture / soilMoistureData.length : 0;
    const unit = soilMoistureData.length > 0 ? soilMoistureData[0].unit : '%';

    // Format to 2 decimal places
    const formattedAverage = parseFloat(averageMoisture.toFixed(2));

    // Determine status and message based on thresholds
    let status: 'normal' | 'warning' | 'critical' = 'normal';
    let message = '';
    let suggestion = '';
    let action = '';

    if (averageMoisture < thresholds.soil_moisture.min) {
        status = 'warning';
        message = `Soil moisture is too low (${formattedAverage}${unit})! Your plants might be thirsty.`;
        suggestion = 'Increase irrigation to provide adequate water for your crops.';
        action = 'Turning on the irrigation system.';
    } else if (averageMoisture > thresholds.soil_moisture.max) {
        status = 'warning';
        message = `Soil moisture is too high (${formattedAverage}${unit})! This can lead to root rot.`;
        suggestion = 'Reduce irrigation and ensure proper drainage.';
        action = 'Pausing scheduled irrigation until soil dries.';
    } else {
        message = `Soil moisture is at an optimal level (${formattedAverage}${unit}).`;
        suggestion = 'Continue with your current irrigation schedule.';
        action = 'The soil has enough moisture. No need to water now.';
    }

    return {
        timestamp: new Date(),
        status,
        message,
        suggestion,
        action,
        average_value: formattedAverage,
        unit,
        min_threshold: thresholds.soil_moisture.min,
        max_threshold: thresholds.soil_moisture.max
    };
};

/**
 * Analyzes livestock temperature data using conditional logic
 */
export const analyzeLivestockTemperature = (
    temperatureData: LivestockTemperatureData,
    thresholds: MonitoringThresholds
): LivestockTemperatureAnalysisResult => {
    const temperature = temperatureData.value;
    const unit = temperatureData.unit;

    // Determine status and message based on thresholds
    let status: 'normal' | 'warning' | 'critical' = 'normal';
    let message = '';
    let suggestion = '';
    let action = '';

    if (temperature < thresholds.livestock_temperature.min) {
        status = 'critical';
        message = `Livestock temperature is too low (${temperature}${unit})! This could indicate health issues.`;
        suggestion = 'Provide warmth and shelter immediately.';
        action = 'Activating heating systems in livestock areas.';
    } else if (temperature > thresholds.livestock_temperature.max) {
        status = 'critical';
        message = `Livestock temperature is too high (${temperature}${unit})! This could indicate fever or heat stress.`;
        suggestion = 'Provide shade, water, and contact a veterinarian if needed.';
        action = 'Activating cooling systems and increasing water supply.';
    } else {
        message = `Livestock temperature is normal (${temperature}${unit}).`;
        suggestion = 'Continue regular monitoring.';
        action = 'The temperature is fine for your livestock. No action needed.';
    }

    return {
        timestamp: new Date(),
        status,
        message,
        suggestion,
        action,
        value: temperature,
        unit,
        min_threshold: thresholds.livestock_temperature.min,
        max_threshold: thresholds.livestock_temperature.max
    };
};

/**
 * Detects anomalies in sensor data
 */
export const detectAnomalies = (
    data: (HumidityData | SoilMoistureData)[],
    standardDeviationThreshold = 2
): { anomalies: (HumidityData | SoilMoistureData)[]; isAnomaly: boolean } => {
    if (data.length < 3) {
        return { anomalies: [], isAnomaly: false };
    }

    // Calculate mean
    const values = data.map(item => item.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;

    // Calculate standard deviation
    const squaredDifferences = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDifferences.reduce((sum, val) => sum + val, 0) / values.length;
    const standardDeviation = Math.sqrt(variance);

    // Identify anomalies (values that are more than standardDeviationThreshold standard deviations from the mean)
    const anomalies = data.filter(item =>
        Math.abs(item.value - mean) > standardDeviationThreshold * standardDeviation
    );

    return {
        anomalies,
        isAnomaly: anomalies.length > 0
    };
}; 