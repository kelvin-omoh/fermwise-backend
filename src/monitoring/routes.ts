/**
 * API Routes for the FermWise Monitoring System
 */

import { Router, Request, Response } from 'express';
import { monitoringService } from './monitoringService';
import {
    HumidityData,
    SoilMoistureData,
    LivestockTemperatureData,
    CropImageData,
    MonitoringThresholds
} from './types';
import { collection, query, where, getDocs, Timestamp, orderBy, limit, addDoc } from 'firebase/firestore';
import { analyzeCropHealth } from './aiAnalyzers';
import cloudinaryService, { CloudinaryUploadOptions } from './cloudinaryService';
import multer from 'multer';
import { getFirestore } from 'firebase/firestore';

const db = getFirestore();

const router = Router();

// Configure multer for memory storage (no file system storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(null, false);
        }
    }
});

/**
 * Get recent sensor data for a farm
 */
const getRecentSensorData = async (
    farmId: string,
    sensorType: string,
    hours = 24,
    maxResults = 100
) => {
    try {
        const sensorDataRef = collection(db, 'sensor_data');
        const timeAgo = new Date();
        timeAgo.setHours(timeAgo.getHours() - hours);

        const q = query(
            sensorDataRef,
            where('farm_id', '==', farmId),
            where('sensor_type', '==', sensorType),
            where('timestamp', '>=', Timestamp.fromDate(timeAgo)),
            orderBy('timestamp', 'desc'),
            limit(maxResults)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error(`Error fetching ${sensorType} data:`, error);
        return [];
    }
};

/**
 * GET /api/monitoring/analyze
 * Analyze environmental data for a farm
 */
router.get('/analyze', async (req: Request, res: Response) => {
    try {
        const { farm_id, hours = 24 } = req.query;

        if (!farm_id) {
            return res.status(400).json({ error: 'Farm ID is required' });
        }

        // Fetch recent sensor data
        const humidityData = await getRecentSensorData(farm_id as string, 'humidity', Number(hours));
        const soilMoistureData = await getRecentSensorData(farm_id as string, 'soil_moisture', Number(hours));

        // Get the most recent livestock temperature if available
        const livestockTempData = await getRecentSensorData(farm_id as string, 'livestock_temperature', Number(hours), 1);
        const livestockTemperatureData = livestockTempData.length > 0 ? livestockTempData[0] as LivestockTemperatureData : undefined;

        // Get the most recent crop image if available
        const cropImageData = await getRecentSensorData(farm_id as string, 'crop_image', Number(hours), 1);
        const cropImage = cropImageData.length > 0 ? cropImageData[0] as CropImageData : undefined;

        // Analyze the data
        const analysisResults = await monitoringService.analyzeEnvironmentalData(
            farm_id as string,
            humidityData as HumidityData[],
            soilMoistureData as SoilMoistureData[],
            livestockTemperatureData,
            cropImage
        );

        // Format the results for display
        const formattedResults = monitoringService.formatAnalysisResults(analysisResults);

        res.status(200).json({
            farm_id,
            timestamp: new Date(),
            analysis: analysisResults,
            formatted_message: formattedResults,
            data_summary: {
                humidity_readings: humidityData.length,
                soil_moisture_readings: soilMoistureData.length,
                has_livestock_data: !!livestockTemperatureData,
                has_crop_image: !!cropImage
            }
        });
    } catch (error) {
        console.error('Error analyzing environmental data:', error);
        res.status(500).json({ error: 'Failed to analyze environmental data' });
    }
});

/**
 * POST /api/monitoring/thresholds
 * Update monitoring thresholds
 */
router.post('/thresholds', async (req: Request, res: Response) => {
    try {
        const thresholds = req.body as Partial<MonitoringThresholds>;

        // Validate thresholds
        if (thresholds.humidity) {
            if (thresholds.humidity.min >= thresholds.humidity.max) {
                return res.status(400).json({
                    error: 'Invalid humidity thresholds. Min must be less than max.'
                });
            }
        }

        if (thresholds.soil_moisture) {
            if (thresholds.soil_moisture.min >= thresholds.soil_moisture.max) {
                return res.status(400).json({
                    error: 'Invalid soil moisture thresholds. Min must be less than max.'
                });
            }
        }

        if (thresholds.livestock_temperature) {
            if (thresholds.livestock_temperature.min >= thresholds.livestock_temperature.max) {
                return res.status(400).json({
                    error: 'Invalid livestock temperature thresholds. Min must be less than max.'
                });
            }
        }

        // Update thresholds
        monitoringService.updateThresholds(thresholds);

        res.status(200).json({
            message: 'Thresholds updated successfully',
            thresholds
        });
    } catch (error) {
        console.error('Error updating thresholds:', error);
        res.status(500).json({ error: 'Failed to update thresholds' });
    }
});

/**
 * POST /api/monitoring/upload-crop-image
 * Upload a crop image to Cloudinary and store the URL in Firestore
 */
router.post('/upload-crop-image', upload.single('image'), async (req: Request, res: Response) => {
    try {
        const { farm_id, device_id, crop_type, field_section } = req.body;

        if (!farm_id) {
            return res.status(400).json({
                error: 'Farm ID is required'
            });
        }

        // Check if image file was uploaded
        if (!req.file) {
            return res.status(400).json({
                error: 'No image file provided'
            });
        }

        // Convert buffer to base64
        const base64Image = req.file.buffer.toString('base64');

        // Set Cloudinary upload options
        const uploadOptions: CloudinaryUploadOptions = {
            folder: `fermwise/${farm_id}/${device_id || 'manual-upload'}`,
            public_id: `crop_${Date.now()}`,
            tags: [farm_id, device_id || 'manual-upload', crop_type || 'unknown']
        };

        // Upload to Cloudinary
        const cloudinaryResult = await cloudinaryService.uploadBase64Image(base64Image, uploadOptions);

        // Create crop image data object
        const cropImageData: CropImageData = {
            farm_id,
            device_id: device_id || 'manual-upload',
            image_url: cloudinaryResult.secure_url,
            crop_type,
            field_section,
            public_id: cloudinaryResult.public_id,
            timestamp: Timestamp.now(),
            metadata: {
                width: cloudinaryResult.width,
                height: cloudinaryResult.height,
                format: cloudinaryResult.format,
                resource_type: cloudinaryResult.resource_type,
                bytes: cloudinaryResult.bytes
            }
        };

        // Store in Firestore
        const cropImagesCollection = collection(db, 'crop_images');
        const docRef = await addDoc(cropImagesCollection, cropImageData);

        // Analyze the image
        const analysisResult = await analyzeCropHealth(cropImageData);

        res.status(201).json({
            id: docRef.id,
            farm_id,
            timestamp: new Date(),
            image_url: cloudinaryResult.secure_url,
            public_id: cloudinaryResult.public_id,
            analysis: analysisResult,
            message: 'Image uploaded and analyzed successfully'
        });
    } catch (error) {
        console.error('Error uploading and analyzing crop image:', error);
        res.status(500).json({ error: 'Failed to upload and analyze crop image' });
    }
});

/**
 * POST /api/monitoring/analyze-image
 * Analyze a crop image that's already uploaded to Cloudinary
 */
router.post('/analyze-image', async (req: Request, res: Response) => {
    try {
        const { farm_id, device_id, image_url, crop_type, field_section, public_id } = req.body;

        if (!farm_id || !image_url) {
            return res.status(400).json({
                error: 'Farm ID and image URL are required'
            });
        }

        // Create crop image data object
        const cropImageData: CropImageData = {
            farm_id,
            device_id: device_id || 'manual-upload',
            image_url,
            crop_type,
            field_section,
            public_id,
            timestamp: Timestamp.now()
        };

        // Analyze the image
        const analysisResult = await analyzeCropHealth(cropImageData);

        res.status(200).json({
            farm_id,
            timestamp: new Date(),
            analysis: analysisResult,
            image_url
        });
    } catch (error) {
        console.error('Error analyzing crop image:', error);
        res.status(500).json({ error: 'Failed to analyze crop image' });
    }
});

/**
 * GET /api/monitoring/crop-images
 * Get crop images for a farm
 */
router.get('/crop-images', async (req: Request, res: Response) => {
    try {
        const { farm_id, limit: limitParam = 10, page = 1 } = req.query;

        if (!farm_id) {
            return res.status(400).json({ error: 'Farm ID is required' });
        }

        // Query Firestore for crop images
        const cropImagesCollection = collection(db, 'crop_images');
        const q = query(
            cropImagesCollection,
            where('farm_id', '==', farm_id),
            orderBy('timestamp', 'desc'),
            limit(Number(limitParam))
        );

        const snapshot = await getDocs(q);

        // Convert to array
        const images = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.status(200).json({
            farm_id,
            images,
            total: images.length,
            page: Number(page),
            limit: Number(limitParam)
        });
    } catch (error) {
        console.error('Error fetching crop images:', error);
        res.status(500).json({ error: 'Failed to fetch crop images' });
    }
});

export default router; 