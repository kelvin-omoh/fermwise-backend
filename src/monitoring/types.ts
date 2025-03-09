/**
 * Types for the FermWise Monitoring System
 */

// Sensor data types
export interface SensorData {
    id?: string;
    device_id: string;
    farm_id: string;
    timestamp: any; // Firestore Timestamp
    metadata?: Record<string, any>;
}

// Humidity sensor data
export interface HumidityData extends SensorData {
    value: number;
    unit: string; // Usually '%'
}

// Soil moisture sensor data
export interface SoilMoistureData extends SensorData {
    value: number;
    unit: string; // Usually '%'
}

// Temperature sensor data
export interface TemperatureData extends SensorData {
    value: number;
    unit: string; // Usually '°C'
}

// Livestock temperature data
export interface LivestockTemperatureData extends SensorData {
    value: number;
    unit: string; // Usually '°C'
    livestock_id?: string;
    livestock_type?: string;
}

// Image data for crop health analysis
export interface CropImageData extends SensorData {
    image_url: string;
    crop_type?: string;
    field_section?: string;
    public_id?: string;
}

// Analysis result types
export interface AnalysisResult {
    timestamp: Date;
    status: 'normal' | 'warning' | 'critical';
    message: string;
    suggestion?: string;
    action?: string;
}

// Humidity analysis result
export interface HumidityAnalysisResult extends AnalysisResult {
    average_value: number;
    unit: string;
    min_threshold: number;
    max_threshold: number;
}

// Soil moisture analysis result
export interface SoilMoistureAnalysisResult extends AnalysisResult {
    average_value: number;
    unit: string;
    min_threshold: number;
    max_threshold: number;
}

// Livestock temperature analysis result
export interface LivestockTemperatureAnalysisResult extends AnalysisResult {
    value: number;
    unit: string;
    min_threshold: number;
    max_threshold: number;
}

// Crop health analysis result
export interface CropHealthAnalysisResult extends AnalysisResult {
    image_url: string;
    detected_issues?: string[];
    confidence_score?: number;
    ai_analysis_details?: Record<string, any>;
}

// Combined analysis results
export interface MonitoringAnalysisResults {
    farm_id: string;
    timestamp: Date;
    humidity?: HumidityAnalysisResult;
    soil_moisture?: SoilMoistureAnalysisResult;
    livestock_temperature?: LivestockTemperatureAnalysisResult;
    crop_health?: CropHealthAnalysisResult;
}

// Thresholds for monitoring
export interface MonitoringThresholds {
    humidity: {
        min: number;
        max: number;
    };
    soil_moisture: {
        min: number;
        max: number;
    };
    livestock_temperature: {
        min: number;
        max: number;
    };
} 