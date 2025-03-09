/**
 * Monitoring Service for FermWise
 * 
 * This service combines both conditional logic analyzers and AI-based analyzers
 * to provide comprehensive monitoring and insights for farmers.
 */

import {
    HumidityData,
    SoilMoistureData,
    LivestockTemperatureData,
    CropImageData,
    MonitoringAnalysisResults,
    MonitoringThresholds
} from './types';

import {
    analyzeHumidity,
    analyzeSoilMoisture,
    analyzeLivestockTemperature,
    detectAnomalies
} from './conditionalAnalyzers';

import { analyzeCropHealth } from './aiAnalyzers';

/**
 * Load monitoring thresholds from environment variables
 */
const loadThresholds = (): MonitoringThresholds => {
    return {
        humidity: {
            min: Number(process.env.HUMIDITY_MIN || 40),
            max: Number(process.env.HUMIDITY_MAX || 70)
        },
        soil_moisture: {
            min: Number(process.env.SOIL_MOISTURE_MIN || 30),
            max: Number(process.env.SOIL_MOISTURE_MAX || 60)
        },
        livestock_temperature: {
            min: Number(process.env.LIVESTOCK_TEMP_MIN || 37.5),
            max: Number(process.env.LIVESTOCK_TEMP_MAX || 39.5)
        }
    };
};

/**
 * Main monitoring service class
 */
export class MonitoringService {
    private thresholds: MonitoringThresholds;

    constructor() {
        this.thresholds = loadThresholds();
    }

    /**
     * Analyze all environmental data for a farm
     */
    public async analyzeEnvironmentalData(
        farmId: string,
        humidityData: HumidityData[] = [],
        soilMoistureData: SoilMoistureData[] = [],
        livestockTemperatureData?: LivestockTemperatureData,
        cropImageData?: CropImageData
    ): Promise<MonitoringAnalysisResults> {
        const results: MonitoringAnalysisResults = {
            farm_id: farmId,
            timestamp: new Date()
        };

        // Analyze humidity if data is available
        if (humidityData.length > 0) {
            results.humidity = analyzeHumidity(humidityData, this.thresholds);

            // Check for anomalies
            const { isAnomaly, anomalies } = detectAnomalies(humidityData);
            if (isAnomaly) {
                results.humidity.status = 'warning';
                results.humidity.message += ` Anomalies detected in humidity readings.`;
                results.humidity.suggestion += ` Check sensors for calibration issues.`;
            }
        }

        // Analyze soil moisture if data is available
        if (soilMoistureData.length > 0) {
            results.soil_moisture = analyzeSoilMoisture(soilMoistureData, this.thresholds);

            // Check for anomalies
            const { isAnomaly, anomalies } = detectAnomalies(soilMoistureData);
            if (isAnomaly) {
                results.soil_moisture.status = 'warning';
                results.soil_moisture.message += ` Anomalies detected in soil moisture readings.`;
                results.soil_moisture.suggestion += ` Check sensors for calibration issues.`;
            }
        }

        // Analyze livestock temperature if data is available
        if (livestockTemperatureData) {
            results.livestock_temperature = analyzeLivestockTemperature(
                livestockTemperatureData,
                this.thresholds
            );
        }

        // Analyze crop health using AI if image is available
        if (cropImageData) {
            results.crop_health = await analyzeCropHealth(cropImageData);
        }

        return results;
    }

    /**
     * Format the analysis results into a user-friendly message
     */
    public formatAnalysisResults(results: MonitoringAnalysisResults): string {
        let message = `🌾 Farm Monitoring Report for ${results.farm_id}\n`;
        message += `📅 ${results.timestamp.toLocaleString()}\n\n`;

        // Add humidity analysis
        if (results.humidity) {
            message += `🌦️ Average Humidity: ${results.humidity.average_value}${results.humidity.unit}\n`;

            if (results.humidity.status === 'warning' || results.humidity.status === 'critical') {
                message += `⚠️ Warning: ${results.humidity.message}\n`;
            } else {
                message += `✅ ${results.humidity.message}\n`;
            }

            if (results.humidity.suggestion) {
                message += `💡 Suggestion: ${results.humidity.suggestion}\n`;
            }

            message += '\n';
        }

        // Add soil moisture analysis
        if (results.soil_moisture) {
            message += `🌱 Average Soil Moisture: ${results.soil_moisture.average_value}${results.soil_moisture.unit}\n`;

            if (results.soil_moisture.status === 'warning' || results.soil_moisture.status === 'critical') {
                message += `⚠️ Warning: ${results.soil_moisture.message}\n`;
            } else {
                message += `✅ ${results.soil_moisture.message}\n`;
            }

            if (results.soil_moisture.suggestion) {
                message += `💡 Suggestion: ${results.soil_moisture.suggestion}\n`;
            }

            if (results.soil_moisture.action) {
                message += `🚜 Action: ${results.soil_moisture.action}\n`;
            }

            message += '\n';
        }

        // Add livestock temperature analysis
        if (results.livestock_temperature) {
            message += `🌡️ Current Livestock Temperature: ${results.livestock_temperature.value}${results.livestock_temperature.unit}\n`;

            if (results.livestock_temperature.status === 'warning' || results.livestock_temperature.status === 'critical') {
                message += `⚠️ ${results.livestock_temperature.status === 'critical' ? 'CRITICAL' : 'Warning'}: ${results.livestock_temperature.message}\n`;
            } else {
                message += `✅ ${results.livestock_temperature.message}\n`;
            }

            if (results.livestock_temperature.suggestion) {
                message += `💡 Suggestion: ${results.livestock_temperature.suggestion}\n`;
            }

            if (results.livestock_temperature.action) {
                message += `🚜 Action: ${results.livestock_temperature.action}\n`;
            }

            message += '\n';
        }

        // Add crop health analysis
        if (results.crop_health) {
            message += `📸 Crop Health Analysis for image: ${results.crop_health.image_url}\n`;

            if (results.crop_health.status === 'warning' || results.crop_health.status === 'critical') {
                message += `⚠️ ${results.crop_health.status === 'critical' ? 'CRITICAL' : 'Warning'}: ${results.crop_health.message}\n`;
            } else {
                message += `✅ ${results.crop_health.message}\n`;
            }

            if (results.crop_health.suggestion) {
                message += `💡 Suggestion: ${results.crop_health.suggestion}\n`;
            }

            message += '\n';
        }

        return message;
    }

    /**
     * Update monitoring thresholds
     */
    public updateThresholds(newThresholds: Partial<MonitoringThresholds>): void {
        this.thresholds = {
            ...this.thresholds,
            ...newThresholds
        };
    }
}

// Export a singleton instance
export const monitoringService = new MonitoringService(); 