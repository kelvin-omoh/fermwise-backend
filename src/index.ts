import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, doc, getDoc, setDoc, updateDoc, serverTimestamp, Timestamp, query, where, deleteDoc, orderBy, limit } from 'firebase/firestore';
import * as admin from 'firebase-admin';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
import { analyzeFarmData } from './monitoring';

// Load environment variables immediately
dotenv.config();
console.log('Environment variables loaded');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for memory storage (no file system)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/**
 * Firebase Configuration
 * 
 * This section initializes both Firebase Admin SDK and Firebase Client SDK.
 * - Admin SDK: Used for server-side operations like authentication verification and secure database access
 * - Client SDK: Used for database operations with Firestore
 */

// Firebase client configuration from environment variables
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

/**
 * Initialize Firebase Admin SDK
 * 
 * The Admin SDK provides privileged access to Firebase services from the server.
 * It's used for operations that require higher privileges like:
 * - Verifying ID tokens
 * - Managing users (creation, deletion, etc.)
 * - Accessing Firestore with admin privileges
 */
console.log('Initializing Firebase Admin...');
try {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: "farm-wise-64612",
            clientEmail: "firebase-adminsdk-fbsvc@farm-wise-64612.iam.gserviceaccount.com",
            privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQChIaZDVx55VpVr\nOT1PH8fdtXSVJR6fGgNvqvuLdPeCfwsusfWPJYjt8nYlrfzo5h+aP3N/52BMOEIP\nX+7FSwKUgljhTUWehz7OgDb8+2cqne8kPhgcrspsh4Khz9p/2MJMIx1AALGRU2hC\nHtQw0VGqjjfX6C2mLz19++yergbz71J5bzjZsCq7iK3l40n6NzCzDe6so6HMUvQS\n/Ubb3607akT1wbcCwec++D8XHPLjfZmTHCcrhJK3z3l+wrhq61nwWj2Od4uifYsm\nypobKHxyiniGjYFzlY2illMfwlu2RLwMQoXaYHfkUlyh1wgLGrCPNqkhinaQYPbT\nuu6oUk3fAgMBAAECggEAF3YlVd/NBaDoT7z9YtR/TxZ5O7A0dbkdb/iG+ObWlS83\naxypYyb1eaQYtOLRFP5Q8q4zfJeti1uTrtZql1qVLRePpnqQXQVXTU0Y9JwMiQWH\nCRFrhF2lBslyaWow5/WhUOG6BBQ1xrHM1/fSMKuBxyI/GlZpsy1kuD/i07YGOCVQ\n0g6hr74Y7C3W+MHOvITbUPPBwPUBp1exk2ckZKSWVQgWYdd28yWv71YJQ59slMr8\nR6wDtH2lQj/MirjXyT75n1VmiqzSIqh6YbxuYJn6iRK7j0B33ZMWBfpQul5KK6QG\nJr+WXN/0Cv990onGMXdMrYjHIYpUUgd6CJKNTxNBnQKBgQDdL2ptWJyR7fJVoyu3\nX2iBtlX0GF5qTXj6E+GBufEWvBtoxASN8YBiBCIprCjbucsSEazCJhk1sRtmvRvA\nfkjhzNlPHivEDfcWpU6PgbX//JoIduEtX8aOzoQcIi1/V+2ZKlN5Q1luQOAGH9sV\nVJZIUN9YjBh7vul3PrLzcgomXQKBgQC6fmMSuIVk4n3+seVChC0NnMTIilnG57lD\nRdiqug6X9MmEYHnsWqbip8vcGM2Wd1xboBBm+ruSCjPss4fcpudCFjJYEb8n3TX8\nQoaYTPPwGT5XPxAcD4tY/lCtQQZko9FoUV5CTKBzuoD6IIEgU5CRzbUnBQjfufVD\naDa7K/cJawKBgAaDgPTbaTD6+un+tijeTGuVfQ6FMTKcOXXT5A439ZufyobZTvEH\nLaq1SHRFt6ZQ4GQV1SqaiJ+GKbJq20hd77OGntevocZSSvaFw7yCK2PwgnDBX3xA\nl85Y0pcpgoF/i2W5U1/81cNjcbV8dq04InzatNkctxPd2W5DkG2O7DGZAoGBAJjm\nrovWxWdlWy/K4tCaVeXnNl/FLr4plndVeMLhML3dcKsb/lqOKG2EbVvS6hwHWK22\nmjwULl0aCGB1AVsjbE9+q2ARjMw+Tdi5ImkUDpw31ijqB2c6R2F7gOHLglZZCYOh\n0spA0PyRWNW6eKPsX4drRK7tLc1gRXoyo0zqSuxpAoGBALUwruG/MT5TKIlGRHBk\n2EVl3LvzFyfX1eg15+2RwVQqXPaOT0Iqy8yMS3Xv+Ju70eMLIeizqQi4tADmwWSb\n93/vYhvlOXSW/E+XKxUyZgjE2cDSS2sW3avEDfumbpotNaL9wYXq/q8nVIWtHwc6\ng78eoJyaP3VzKWfy5m28bhn/\n-----END PRIVATE KEY-----\n"
        })
    });
    console.log('Firebase Admin initialized successfully');
} catch (error) {
    console.error('Error initializing Firebase Admin:', error);
}

// Initialize Firebase Admin services
const adminAuth = admin.auth();  // For user authentication and management
const adminDb = admin.firestore();  // For Firestore database operations with admin privileges

/**
 * Initialize Firebase Client SDK
 * 
 * The client SDK is used for standard database operations.
 * While we're in a server environment, we use the client SDK for most Firestore operations
 * as it provides a more convenient API for querying and updating data.
 */
console.log('Initializing Firebase Client...');
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);  // Firestore database instance
console.log(`Firebase initialized with project: ${process.env.FIREBASE_PROJECT_ID}`);

/**
 * Verify Firebase Connection
 * 
 * This function tests the connection to Firebase by attempting to query a collection.
 * It's used during server startup to ensure Firebase is properly configured and accessible.
 * 
 * @returns {Promise<boolean>} True if connection is successful, false otherwise
 */
const verifyFirebaseConnection = async () => {
    try {
        // Try to access a collection to verify connection
        const testQuery = query(collection(db, 'system_health'));
        await getDocs(testQuery);
        console.log('✅ Firebase connection verified successfully');
        return true;
    } catch (error) {
        console.error('❌ Firebase connection failed:', error);
        return false;
    }
};

// Initialize Express
const app = express();
const PORT = process.env.PORT || 5000;

/**
 * Type Extensions
 * 
 * Extend the Express Request interface to include custom properties:
 * - userId: The authenticated user's ID
 * - user: The decoded Firebase ID token containing user information
 */
declare global {
    namespace Express {
        interface Request {
            userId?: string;
            user?: admin.auth.DecodedIdToken;
        }
    }
}

// Middleware
app.use(cors());  // Enable Cross-Origin Resource Sharing
app.use(express.json());  // Parse JSON request bodies

/**
 * Authentication Middleware
 * 
 * This middleware verifies that requests are authenticated before allowing access to protected routes.
 * It supports two authentication methods:
 * 1. Bearer token in Authorization header (standard JWT approach)
 * 2. Direct userId in header (for development/testing purposes)
 * 
 * The authenticated user's ID is attached to the request object for use in route handlers.
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {void}
 */
const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get the authorization header or userid header
        const authHeader = req.headers.authorization;
        const userIdHeader = req.headers.userid as string;

        // If userId is provided directly in header, use it (for development/testing)
        if (userIdHeader) {
            req.userId = userIdHeader;
            return next();
        }

        // Otherwise check for authorization header
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Extract the token (which is the user ID)
        const token = authHeader.split('Bearer ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Invalid token format' });
        }

        try {
            // The token is the user ID, so use it directly
            req.userId = token;

            // Verify the user exists (optional, can be removed if causing issues)
            try {
                await adminAuth.getUser(token);
            } catch (userError: any) {
                console.log('User verification skipped:', userError.message);
                // Continue anyway - the token is still valid for our purposes
            }

            return next();
        } catch (error) {
            console.error('Error verifying token:', error);
            return res.status(401).json({ error: 'Invalid token' });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({ error: 'Authentication failed' });
    }
};

/**
 * Device Validation Middleware
 * 
 * This middleware validates that:
 * 1. The device_id and farm_id are provided in the request
 * 2. The farm exists in the database
 * 3. The device exists and is associated with the specified farm
 * 4. The user has permission to access the farm
 * 
 * It's used to ensure that sensor data and other device-related operations
 * are only performed for valid devices on valid farms by authorized users.
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {void}
 */
const validateDevice = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { device_id, farm_id } = req.body;

        if (!device_id || !farm_id) {
            return res.status(400).json({ error: 'Device ID and Farm ID are required' });
        }

        // Check if farm exists
        const farmRef = doc(db, 'farms', farm_id);
        const farmDoc = await getDoc(farmRef);

        if (!farmDoc.exists()) {
            return res.status(404).json({ error: 'Farm not found' });
        }

        // Check if device exists and belongs to the farm
        const devicesRef = collection(db, 'devices');
        const deviceQuery = query(devicesRef, where('device_id', '==', device_id), where('farm_id', '==', farm_id));
        const deviceSnapshot = await getDocs(deviceQuery);

        if (deviceSnapshot.empty) {
            return res.status(404).json({ error: 'Device not found or not associated with this farm' });
        }

        // Add device data to request for later use
        const deviceData = deviceSnapshot.docs[0].data();
        req.body.device_data = deviceData;

        // Check if user has permission to access this farm
        const userId = req.userId;
        const farmData = farmDoc.data();

        if (farmData.owner_id !== userId && (!farmData.members || !farmData.members.includes(userId))) {
            return res.status(403).json({ error: 'You do not have permission to access this farm' });
        }

        next();
    } catch (error) {
        console.error('Error validating device:', error);
        res.status(500).json({ error: 'Failed to validate device' });
    }
};

// Routes
app.get('/', (req, res) => {
    res.send('Fermwise API is running');
});

// IoT Device Endpoints
// Endpoint for IoT devices to send sensor readings
app.post('/api/device/readings', async (req, res) => {
    try {
        const {
            serial_number,
            temperature,
            humidity,
            soil_temperature,
            soil_moisture,
            livestock_temperature
        } = req.body;

        // Validate required fields
        if (!serial_number) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['serial_number']
            });
        }

        // Use a single farm ID for all readings
        const farm_id = process.env.DEFAULT_FARM_ID || 'farm_001';

        // Create timestamp for the reading
        const timestamp = Timestamp.now();

        // Create sensor readings collection reference
        const sensorReadingsCollection = collection(db, 'sensor_readings');

        // Create individual readings for each sensor type
        const readings = [];

        // Add temperature reading if provided
        if (temperature !== undefined && temperature !== null) {
            const tempReading = {
                serial_number,
                farm_id,
                type: 'temperature',
                value: parseFloat(temperature),
                unit: '°C',
                timestamp
            };
            const tempDocRef = await addDoc(sensorReadingsCollection, tempReading);
            readings.push({ id: tempDocRef.id, ...tempReading });
        }

        // Add humidity reading if provided
        if (humidity !== undefined && humidity !== null) {
            const humidityReading = {
                serial_number,
                farm_id,
                type: 'humidity',
                value: parseFloat(humidity),
                unit: '%',
                timestamp
            };
            const humidityDocRef = await addDoc(sensorReadingsCollection, humidityReading);
            readings.push({ id: humidityDocRef.id, ...humidityReading });
        }

        // Add soil temperature reading if provided
        if (soil_temperature !== undefined && soil_temperature !== null) {
            const soilTempReading = {
                serial_number,
                farm_id,
                type: 'soil_temperature',
                value: parseFloat(soil_temperature),
                unit: '°C',
                timestamp
            };
            const soilTempDocRef = await addDoc(sensorReadingsCollection, soilTempReading);
            readings.push({ id: soilTempDocRef.id, ...soilTempReading });
        }

        // Add soil moisture reading if provided
        if (soil_moisture !== undefined && soil_moisture !== null) {
            const soilMoistureReading = {
                serial_number,
                farm_id,
                type: 'soil_moisture',
                value: parseFloat(soil_moisture),
                unit: '%',
                timestamp
            };
            const soilMoistureDocRef = await addDoc(sensorReadingsCollection, soilMoistureReading);
            readings.push({ id: soilMoistureDocRef.id, ...soilMoistureReading });
        }

        // Add livestock temperature reading if provided
        if (livestock_temperature !== undefined && livestock_temperature !== null) {
            const livestockTempReading = {
                serial_number,
                farm_id,
                type: 'livestock_temperature',
                value: parseFloat(livestock_temperature),
                unit: '°C',
                timestamp
            };
            const livestockTempDocRef = await addDoc(sensorReadingsCollection, livestockTempReading);
            readings.push({ id: livestockTempDocRef.id, ...livestockTempReading });
        }

        // Return success response with all readings
        res.status(201).json({
            message: 'Sensor readings recorded successfully',
            serial_number,
            farm_id,
            timestamp,
            readings
        });
    } catch (error) {
        console.error('Error recording sensor readings:', error);
        res.status(500).json({ error: 'Failed to record sensor readings' });
    }
});

// // User registration with Firebase Admin
// app.post('/api/auth/register', async (req, res) => {
//     try {
//         const { fullname, email, password } = req.body;

//         if (!email || !password || !fullname) {
//             return res.status(400).json({ error: 'Fullname, email, and password are required' });
//         }

//         // Create user with Firebase Admin Auth
//         const userRecord = await adminAuth.createUser({
//             email,
//             password,
//             displayName: fullname
//         });

//         // Store additional user data in Firestore
//         const userData = {
//             fullname,
//             email,
//             role: 'farmer',
//             created_at: admin.firestore.Timestamp.now()
//         };

//         // Add user to Firestore with the same UID as Auth
//         await adminDb.collection('users').doc(userRecord.uid).set(userData);

//         // For simplicity, use the user ID as the token
//         // In production, you would generate a proper JWT token
//         const token = userRecord.uid;

//         // Return user data
//         res.status(201).json({
//             id: userRecord.uid,
//             email: userRecord.email,
//             fullname,
//             role: 'farmer',
//             token
//         });
//     } catch (error: any) {
//         console.error('Error during registration:', error);

//         // Handle Firebase Auth specific errors
//         if (error.code === 'auth/email-already-in-use') {
//             return res.status(400).json({ error: 'Email already in use' });
//         } else if (error.code === 'auth/weak-password') {
//             return res.status(400).json({ error: 'Password is too weak' });
//         } else if (error.code === 'auth/invalid-email') {
//             return res.status(400).json({ error: 'Invalid email format' });
//         }

//         res.status(500).json({
//             error: 'Registration failed',
//             message: error.message
//         });
//     }
// });

// // Login with Firebase Admin
// app.post('/api/auth/login', async (req, res) => {
//     try {
//         const { email, password } = req.body;

//         if (!email || !password) {
//             return res.status(400).json({ error: 'Email and password are required' });
//         }

//         try {
//             // Find the user by email
//             const userRecord = await adminAuth.getUserByEmail(email);

//             // Note: Firebase Admin SDK doesn't provide a way to verify passwords
//             // In a production app, you would use Firebase Authentication REST API
//             // For this demo, we'll assume the password is correct

//             // Get additional user data from Firestore
//             const userDoc = await adminDb.collection('users').doc(userRecord.uid).get();

//             let userData = null;

//             if (!userDoc.exists) {
//                 // Create user document if it doesn't exist
//                 userData = {
//                     email: userRecord.email,
//                     fullname: userRecord.displayName || email.split('@')[0],
//                     role: 'farmer',
//                     created_at: admin.firestore.Timestamp.now()
//                 };

//                 await adminDb.collection('users').doc(userRecord.uid).set(userData);
//             } else {
//                 // Get existing user data
//                 userData = userDoc.data();
//             }

//             // For simplicity, use the user ID as the token
//             // In production, you would generate a proper JWT token
//             const token = userRecord.uid;

//             // Return user data with token
//             res.json({
//                 id: userRecord.uid,
//                 email: userRecord.email,
//                 fullname: userData?.fullname || userRecord.displayName || 'User',
//                 role: userData?.role || 'farmer',
//                 token
//             });
//         } catch (error: any) {
//             // If user not found, return generic error
//             if (error.code === 'auth/user-not-found') {
//                 return res.status(401).json({ error: 'Invalid credentials' });
//             }
//             throw error; // Re-throw for the outer catch block
//         }
//     } catch (error: any) {
//         console.error('Error during login:', error);

//         // Handle Firebase Auth specific errors
//         if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
//             return res.status(401).json({ error: 'Invalid credentials' });
//         } else if (error.code === 'auth/too-many-requests') {
//             return res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
//         }

//         // For development, include the error message in the response
//         res.status(500).json({
//             error: 'Authentication failed',
//             message: error.message,
//             code: error.code
//         });
//     }
// });

// // Protected routes - require authentication
// app.get('/api/user/profile', requireAuth, async (req, res) => {
//     try {
//         const userId = req.userId!;

//         // Get user data from Firestore
//         const userRef = doc(db, 'users', userId);
//         const userSnap = await getDoc(userRef);

//         if (!userSnap.exists()) {
//             return res.status(404).json({ error: 'User not found' });
//         }

//         const userData = userSnap.data();

//         // Don't return password
//         const { password, ...userDataWithoutPassword } = userData;

//         // Return user data
//         res.json({
//             id: userId,
//             ...userDataWithoutPassword
//         });
//     } catch (error: any) {
//         console.error('Error fetching user profile:', error);
//         res.status(500).json({
//             error: 'Failed to fetch user profile',
//             message: error.message
//         });
//     }
// });

// // Register a device to a farm
// app.post('/api/devices', requireAuth, async (req, res) => {
//     try {
//         const userId = req.userId!;

//         const {
//             name,
//             type,
//             location,
//             description,
//             device_id,
//             farm_id,
//             order_id
//         } = req.body;

//         // For IoT devices, allow using name as identifier
//         let deviceIdentifier = device_id;

//         // If no device_id but name is provided, use name as identifier
//         if (!deviceIdentifier && name) {
//             deviceIdentifier = name;
//         }

//         // Validate required fields
//         if (!name || !type || !farm_id) {
//             return res.status(400).json({
//                 error: 'Missing required fields. Name, type, and farm_id are required.'
//             });
//         }

//         // Verify the farm belongs to this user
//         const farmRef = doc(db, 'farms', farm_id);
//         const farmSnap = await getDoc(farmRef);

//         if (!farmSnap.exists()) {
//             return res.status(404).json({ error: 'Farm not found' });
//         }

//         const farmData = farmSnap.data();
//         if (farmData.owner_id !== userId) {
//             return res.status(403).json({ error: 'You do not have permission to add devices to this farm' });
//         }

//         // Check if device is already registered to this farm
//         const devicesCollection = collection(db, 'devices');
//         let deviceQuery;

//         if (deviceIdentifier) {
//             // If we have a device identifier, check by that
//             deviceQuery = query(
//                 devicesCollection,
//                 where('farm_id', '==', farm_id),
//                 where('device_id', '==', deviceIdentifier)
//             );
//         } else {
//             // Otherwise check by name
//             deviceQuery = query(
//                 devicesCollection,
//                 where('farm_id', '==', farm_id),
//                 where('name', '==', name)
//             );
//         }

//         const existingDevices = await getDocs(deviceQuery);

//         if (!existingDevices.empty) {
//             // If device exists, return the existing device
//             const existingDevice = {
//                 id: existingDevices.docs[0].id,
//                 ...existingDevices.docs[0].data()
//             };
//             return res.status(200).json({
//                 message: 'Device already registered',
//                 device: existingDevice
//             });
//         }

//         // Create device object
//         const newDevice = {
//             name,
//             type,
//             location: location || '',
//             description: description || '',
//             device_id: deviceIdentifier || name, // Use name as fallback
//             farm_id,
//             owner_id: userId, // Use the authenticated user's ID
//             status: 'active',
//             created_at: Timestamp.now()
//         };

//         // Add to Firestore
//         const docRef = await addDoc(devicesCollection, newDevice);

//         // If this was a device from an order, mark it as registered
//         if (order_id) {
//             const orderRef = doc(db, 'orders', order_id);
//             const orderDoc = await getDoc(orderRef);

//             if (orderDoc.exists()) {
//                 await updateDoc(orderRef, {
//                     device_registered: true,
//                     device_registered_at: Timestamp.now(),
//                     device_registered_to_farm: farm_id
//                 });
//             }
//         }

//         // Return the created device with its ID
//         res.status(201).json({
//             id: docRef.id,
//             ...newDevice
//         });
//     } catch (error) {
//         console.error('Error registering device:', error);
//         res.status(500).json({ error: 'Failed to register device' });
//     }
// });

// // Get all devices for a user
// app.get('/api/devices', requireAuth, async (req, res) => {
//     try {
//         const userId = req.userId!;

//         const devicesCollection = collection(db, 'devices');
//         const q = query(devicesCollection, where('owner_id', '==', userId));
//         const devicesSnapshot = await getDocs(q);

//         const devices = devicesSnapshot.docs.map(doc => ({
//             id: doc.id,
//             ...doc.data()
//         }));

//         res.json(devices);
//     } catch (error) {
//         console.error('Error fetching devices:', error);
//         res.status(500).json({ error: 'Failed to fetch devices' });
//     }
// });

// // Get device by ID
// app.get('/api/devices/:id', async (req, res) => {
//     try {
//         const deviceId = req.params.id;
//         const deviceRef = doc(db, 'devices', deviceId);
//         const deviceSnap = await getDoc(deviceRef);

//         if (!deviceSnap.exists()) {
//             return res.status(404).json({ error: 'Device not found' });
//         }

//         res.json({
//             id: deviceSnap.id,
//             ...deviceSnap.data()
//         });
//     } catch (error) {
//         console.error('Error fetching device:', error);
//         res.status(500).json({ error: 'Failed to fetch device' });
//     }
// });

// // Update device
// app.put('/api/devices/:id', async (req, res) => {
//     try {
//         const deviceId = req.params.id;
//         const {
//             name,
//             type,
//             location,
//             description,
//             status
//         } = req.body;

//         const deviceRef = doc(db, 'devices', deviceId);
//         const deviceSnap = await getDoc(deviceRef);

//         if (!deviceSnap.exists()) {
//             return res.status(404).json({ error: 'Device not found' });
//         }

//         // Create update object with only provided fields
//         const updateData: Record<string, any> = {};

//         if (name !== undefined) updateData.name = name;
//         if (type !== undefined) updateData.type = type;
//         if (location !== undefined) updateData.location = location;
//         if (description !== undefined) updateData.description = description;
//         if (status !== undefined) updateData.status = status;

//         await updateDoc(deviceRef, updateData);

//         const updatedDeviceSnap = await getDoc(deviceRef);

//         res.json({
//             id: updatedDeviceSnap.id,
//             ...updatedDeviceSnap.data()
//         });
//     } catch (error) {
//         console.error('Error updating device:', error);
//         res.status(500).json({ error: 'Failed to update device' });
//     }
// });

// // Get all farms for a user
// app.get('/api/farms', requireAuth, async (req, res) => {
//     try {
//         const userId = req.userId!;

//         const farmsCollection = collection(db, 'farms');
//         const q = query(farmsCollection, where('owner_id', '==', userId));
//         const farmsSnapshot = await getDocs(q);

//         const farms = farmsSnapshot.docs.map(doc => ({
//             id: doc.id,
//             ...doc.data()
//         }));

//         res.json(farms);
//     } catch (error) {
//         console.error('Error fetching farms:', error);
//         res.status(500).json({ error: 'Failed to fetch farms' });
//     }
// });

// // Create a new farm
// app.post('/api/farms', requireAuth, async (req, res) => {
//     try {
//         const userId = req.userId!;

//         const {
//             name,
//             location,
//             size,
//             size_unit,
//             crop_type,
//             planting_date,
//             expected_harvest_date,
//             notes
//         } = req.body;

//         // Validate required fields
//         if (!name || !location || size === undefined || !size_unit) {
//             return res.status(400).json({
//                 error: 'Missing required fields. Name, location, size, and size_unit are required.'
//             });
//         }

//         // Create farm object
//         const newFarm = {
//             name,
//             location,
//             size: Number(size),
//             size_unit,
//             crop_type: crop_type || null,
//             planting_date: planting_date ? new Date(planting_date) : null,
//             expected_harvest_date: expected_harvest_date ? new Date(expected_harvest_date) : null,
//             notes: notes || '',
//             owner_id: userId,
//             created_at: Timestamp.now(),
//             status: 'active'
//         };

//         // Add to Firestore
//         const farmsCollection = collection(db, 'farms');
//         const docRef = await addDoc(farmsCollection, newFarm);

//         // Return the created farm with its ID
//         res.status(201).json({
//             id: docRef.id,
//             ...newFarm
//         });
//     } catch (error) {
//         console.error('Error creating farm:', error);
//         res.status(500).json({ error: 'Failed to create farm' });
//     }
// });

// // Get a specific farm with devices and sensor data
// app.get('/api/farms/:id', async (req, res) => {
//     try {
//         // const userId = req.userId!; // Temporarily disabled for testing
//         const userId = "test-user"; // Temporary placeholder for testing
//         const farmId = req.params.id;

//         // Get farm data
//         const farmRef = doc(db, 'farms', farmId);
//         const farmSnap = await getDoc(farmRef);

//         if (!farmSnap.exists()) {
//             return res.status(404).json({ error: 'Farm not found' });
//         }

//         const farmData = farmSnap.data();

//         // Temporarily disable permission check for testing
//         /*
//         // Check if the farm belongs to the user or if user is a member
//         if (farmData.owner_id !== userId && (!farmData.members || !farmData.members.includes(userId))) {
//             return res.status(403).json({ error: 'You do not have permission to access this farm' });
//         }
//         */

//         // Get devices for this farm
//         const devicesCollection = collection(db, 'devices');
//         const deviceQuery = query(devicesCollection, where('farm_id', '==', farmId));
//         const devicesSnapshot = await getDocs(deviceQuery);

//         const devices = devicesSnapshot.docs.map(doc => ({
//             id: doc.id,
//             ...doc.data()
//         }));

//         // Get all sensor data for this farm (without time filtering in the query)
//         const sensorDataRef = collection(db, 'sensor_data');
//         const sensorQuery = query(sensorDataRef, where('farm_id', '==', farmId));
//         const sensorSnapshot = await getDocs(sensorQuery);

//         const allSensorData = sensorSnapshot.docs.map(doc => ({
//             id: doc.id,
//             ...doc.data()
//         }));

//         // Filter for last 24 hours using JavaScript
//         const timeAgo = new Date();
//         timeAgo.setHours(timeAgo.getHours() - 24); // Last 24 hours
//         const timeAgoMillis = timeAgo.getTime();

//         // Filter and sort sensor data
//         const sensorData = allSensorData
//             .filter((reading: any) => {
//                 // Check if timestamp exists and is valid
//                 if (!reading.timestamp || !reading.timestamp.seconds) {
//                     return false;
//                 }

//                 // Convert Firestore timestamp to milliseconds
//                 const readingTime = reading.timestamp.seconds * 1000;
//                 return readingTime >= timeAgoMillis;
//             })
//             .sort((a: any, b: any) => {
//                 // Sort by timestamp (newest first)
//                 const aTime = a.timestamp?.seconds * 1000 || 0;
//                 const bTime = b.timestamp?.seconds * 1000 || 0;
//                 return bTime - aTime;
//             })
//             .slice(0, 100); // Limit to 100 most recent readings

//         // Group sensor data by device
//         const sensorDataByDevice: Record<string, any[]> = {};
//         sensorData.forEach((reading: any) => {
//             const deviceId = reading.device_id;
//             if (!sensorDataByDevice[deviceId]) {
//                 sensorDataByDevice[deviceId] = [];
//             }
//             sensorDataByDevice[deviceId].push(reading);
//         });

//         // Generate monitoring data using the monitoring system
//         const monitoringData = analyzeFarmData(farmData, sensorData as any[], devices);

//         // Format the response in a more structured way
//         res.json({
//             // Farm basic information
//             id: farmSnap.id,
//             name: farmData.name,
//             location: farmData.location,
//             size: farmData.size,
//             size_unit: farmData.size_unit,
//             crop_type: farmData.crop_type,
//             owner_id: farmData.owner_id,
//             farm_id: farmData.farm_id,
//             notes: farmData.notes,
//             planting_date: farmData.planting_date,
//             expected_harvest_date: farmData.expected_harvest_date,
//             created_at: farmData.created_at,

//             // Devices information
//             devices,

//             // Sensor data
//             sensor_data: {
//                 recent_readings: sensorData,
//                 by_device: sensorDataByDevice,
//                 total_readings: sensorData.length,
//                 time_range: {
//                     from: timeAgo.toISOString(),
//                     to: new Date().toISOString()
//                 }
//             },

//             // Monitoring information
//             monitoring: {
//                 // Farm-level monitoring
//                 farm_status: monitoringData.status,
//                 summary: monitoringData.summary,
//                 last_updated: monitoringData.last_updated,

//                 // Farm-level alerts and recommendations
//                 alerts: monitoringData.alerts,
//                 recommendations: monitoringData.recommendations,

//                 // Device-specific monitoring
//                 devices: monitoringData.devices_monitoring.map(device => ({
//                     device_id: device.device_id,
//                     device_name: device.device_name,
//                     device_type: device.device_type,
//                     status: device.status,
//                     summary: device.summary,
//                     last_reading: device.last_reading_timestamp,
//                     readings: device.readings,
//                     alerts: device.alerts,
//                     recommendations: device.recommendations
//                 }))
//             }
//         });
//     } catch (error) {
//         console.error('Error fetching farm with devices and sensor data:', error);
//         res.status(500).json({ error: 'Failed to fetch farm data' });
//     }
// });

// // Update farm
// app.put('/api/farms/:id', async (req, res) => {
//     try {
//         const farmId = req.params.id;
//         const {
//             name,
//             location,
//             size,
//             size_unit,
//             crop_type,
//             planting_date,
//             expected_harvest_date,
//             notes,
//             status
//         } = req.body;

//         const farmRef = doc(db, 'farms', farmId);
//         const farmSnap = await getDoc(farmRef);

//         if (!farmSnap.exists()) {
//             return res.status(404).json({ error: 'Farm not found' });
//         }

//         // Create update object with only provided fields
//         const updateData: Record<string, any> = {};

//         if (name !== undefined) updateData.name = name;
//         if (location !== undefined) updateData.location = location;
//         if (size !== undefined) updateData.size = Number(size);
//         if (size_unit !== undefined) updateData.size_unit = size_unit;
//         if (crop_type !== undefined) updateData.crop_type = crop_type || null;
//         if (planting_date !== undefined) updateData.planting_date = planting_date ? new Date(planting_date) : null;
//         if (expected_harvest_date !== undefined) updateData.expected_harvest_date = expected_harvest_date ? new Date(expected_harvest_date) : null;
//         if (notes !== undefined) updateData.notes = notes;
//         if (status !== undefined) updateData.status = status;

//         await updateDoc(farmRef, updateData);

//         const updatedFarmSnap = await getDoc(farmRef);

//         res.json({
//             id: updatedFarmSnap.id,
//             ...updatedFarmSnap.data()
//         });
//     } catch (error) {
//         console.error('Error updating farm:', error);
//         res.status(500).json({ error: 'Failed to update farm' });
//     }
// });

// // Delete farm
// app.delete('/api/farms/:id', async (req, res) => {
//     try {
//         const farmId = req.params.id;
//         const farmRef = doc(db, 'farms', farmId);
//         const farmSnap = await getDoc(farmRef);

//         if (!farmSnap.exists()) {
//             return res.status(404).json({ error: 'Farm not found' });
//         }

//         await updateDoc(farmRef, { status: 'archived' });

//         res.json({ message: 'Farm archived successfully' });
//     } catch (error) {
//         console.error('Error archiving farm:', error);
//         res.status(500).json({ error: 'Failed to archive farm' });
//     }
// });

// // Find farm by name - useful for IoT devices
// app.get('/api/farms/find', async (req, res) => {
//     try {
//         const farmName = req.query.name;

//         if (!farmName) {
//             return res.status(400).json({ error: 'Farm name is required' });
//         }

//         const farmsCollection = collection(db, 'farms');
//         const q = query(farmsCollection, where('name', '==', farmName));
//         const farmSnapshot = await getDocs(q);

//         if (farmSnapshot.empty) {
//             return res.status(404).json({ error: 'Farm not found' });
//         }

//         const farmData = farmSnapshot.docs[0].data();

//         res.json({
//             id: farmSnapshot.docs[0].id,
//             ...farmData
//         });
//     } catch (error) {
//         console.error('Error finding farm by name:', error);
//         res.status(500).json({ error: 'Failed to find farm' });
//     }
// });

// // IoT Sensor Data Routes
// // Endpoint for IoT devices to send sensor data
// app.post('/api/sensor-data', requireAuth, validateDevice, async (req, res) => {
//     try {
//         const userId = req.userId!;
//         const {
//             device_id,
//             farm_id,
//             temperature,
//             humidity,
//             soil_moisture,
//             soil_temperature,
//             image_url,
//             livestock_temperature,
//             timestamp,
//             device_data // Added by validateDevice middleware
//         } = req.body;

//         // Validate sensor data against device capabilities
//         const capabilities = device_data.capabilities || {};
//         const validationErrors = [];

//         if (soil_temperature !== undefined && soil_temperature !== null && capabilities.soil_temperature === false) {
//             validationErrors.push('This device does not support soil temperature readings');
//         }

//         if (image_url && capabilities.imaging === false) {
//             validationErrors.push('This device does not support imaging capabilities');
//         }

//         if (livestock_temperature !== undefined && livestock_temperature !== null && capabilities.livestock_monitoring === false) {
//             validationErrors.push('This device does not support livestock temperature monitoring');
//         }

//         if (validationErrors.length > 0) {
//             return res.status(400).json({
//                 error: 'Invalid sensor data for this device type',
//                 details: validationErrors,
//                 device_type: device_data.type,
//                 capabilities
//             });
//         }

//         // Create sensor data object
//         const sensorData = {
//             device_id,
//             farm_id,
//             user_id: userId,
//             temperature: temperature || null,
//             humidity: humidity || null,
//             soil_moisture: soil_moisture || null,
//             soil_temperature: soil_temperature || null,
//             image_url: image_url || null,
//             livestock_temperature: livestock_temperature || null,
//             timestamp: timestamp ? new Date(timestamp) : Timestamp.now(),
//             device_type: device_data.type
//         };

//         // Add to Firestore
//         const sensorDataCollection = collection(db, 'sensor_data');
//         const docRef = await addDoc(sensorDataCollection, sensorData);

//         // Return success response
//         res.status(201).json({
//             id: docRef.id,
//             message: 'Sensor data recorded successfully',
//             ...sensorData
//         });
//     } catch (error) {
//         console.error('Error recording sensor data:', error);
//         res.status(500).json({ error: 'Failed to record sensor data' });
//     }
// });

// // Get latest sensor data for a farm
// app.get('/api/farms/:farmId/sensor-data/latest', requireAuth, async (req, res) => {
//     try {
//         const userId = req.userId!;
//         const farmId = req.params.farmId;

//         // Verify farm belongs to user
//         const farmRef = doc(db, 'farms', farmId);
//         const farmSnap = await getDoc(farmRef);

//         if (!farmSnap.exists()) {
//             return res.status(404).json({ error: 'Farm not found' });
//         }

//         const farmData = farmSnap.data();
//         if (farmData.owner_id !== userId) {
//             return res.status(403).json({ error: 'You do not have permission to access this farm' });
//         }

//         // Get devices for this farm
//         const devicesCollection = collection(db, 'devices');
//         const deviceQuery = query(devicesCollection, where('farm_id', '==', farmId));
//         const devicesSnapshot = await getDocs(deviceQuery);

//         const deviceIds = devicesSnapshot.docs.map(doc => doc.data().device_id);

//         // Get latest sensor data for each device
//         const latestData: any = {};

//         for (const deviceId of deviceIds) {
//             const sensorDataCollection = collection(db, 'sensor_data');
//             const q = query(
//                 sensorDataCollection,
//                 where('device_id', '==', deviceId),
//                 where('farm_id', '==', farmId),
//                 // orderBy('timestamp', 'desc'),
//                 // limit(1)
//             );

//             const sensorDataSnapshot = await getDocs(q);

//             if (!sensorDataSnapshot.empty) {
//                 // Find the most recent entry manually since we can't use orderBy with where
//                 let latestEntry = sensorDataSnapshot.docs[0];
//                 let latestTimestamp = sensorDataSnapshot.docs[0].data().timestamp;

//                 sensorDataSnapshot.docs.forEach(doc => {
//                     const docTimestamp = doc.data().timestamp;
//                     if (docTimestamp > latestTimestamp) {
//                         latestEntry = doc;
//                         latestTimestamp = docTimestamp;
//                     }
//                 });

//                 latestData[deviceId] = {
//                     id: latestEntry.id,
//                     ...latestEntry.data()
//                 };
//             }
//         }

//         res.json({
//             farm_id: farmId,
//             devices: deviceIds,
//             latest_data: latestData
//         });
//     } catch (error) {
//         console.error('Error fetching latest sensor data:', error);
//         res.status(500).json({ error: 'Failed to fetch sensor data' });
//     }
// });

// // Get historical sensor data for a farm
// app.get('/api/farms/:farmId/sensor-data/history', requireAuth, async (req, res) => {
//     try {
//         const userId = req.userId!;
//         const farmId = req.params.farmId;
//         const { days = 7, device_id } = req.query;

//         // Calculate start date (default: 7 days ago)
//         const startDate = new Date();
//         startDate.setDate(startDate.getDate() - Number(days));

//         // Verify farm belongs to user
//         const farmRef = doc(db, 'farms', farmId);
//         const farmSnap = await getDoc(farmRef);

//         if (!farmSnap.exists()) {
//             return res.status(404).json({ error: 'Farm not found' });
//         }

//         const farmData = farmSnap.data();
//         if (farmData.owner_id !== userId) {
//             return res.status(403).json({ error: 'You do not have permission to access this farm' });
//         }

//         // Build query
//         const sensorDataCollection = collection(db, 'sensor_data');
//         let q;

//         if (device_id) {
//             // Query for specific device
//             q = query(
//                 sensorDataCollection,
//                 where('farm_id', '==', farmId),
//                 where('device_id', '==', device_id),
//                 // where('timestamp', '>=', startDate)
//             );
//         } else {
//             // Query for all devices in farm
//             q = query(
//                 sensorDataCollection,
//                 where('farm_id', '==', farmId),
//                 // where('timestamp', '>=', startDate)
//             );
//         }

//         const sensorDataSnapshot = await getDocs(q);

//         // Filter by date manually since we can't combine multiple where conditions with different fields
//         const startTimestamp = Timestamp.fromDate(startDate);
//         const historyData = sensorDataSnapshot.docs
//             .filter(doc => doc.data().timestamp >= startTimestamp)
//             .map(doc => ({
//                 id: doc.id,
//                 ...doc.data()
//             }));

//         res.json({
//             farm_id: farmId,
//             device_id: device_id || 'all',
//             start_date: startDate,
//             data_points: historyData.length,
//             history: historyData
//         });
//     } catch (error) {
//         console.error('Error fetching sensor data history:', error);
//         res.status(500).json({ error: 'Failed to fetch sensor data history' });
//     }
// });

// // Device Registration Endpoint
// app.post('/api/devices/register', requireAuth, async (req, res) => {
//     try {
//         const userId = req.userId!;
//         const {
//             name,
//             type,
//             status,
//             farm_id,
//             serial_no
//         } = req.body;

//         // Validate required fields
//         if (!name || !type || !farm_id || !serial_no) {
//             return res.status(400).json({
//                 error: 'Missing required fields. Name, type, farm_id, and serial_no are required.'
//             });
//         }

//         // Validate device type
//         const validTypes = ["FermWise Bot - Basic", "FermWise Bot - Pro", "FermWise Bot - Enterprise"];
//         if (!validTypes.includes(type)) {
//             return res.status(400).json({
//                 error: `Invalid device type. Must be one of: ${validTypes.join(', ')}`
//             });
//         }

//         // Verify user is authenticated
//         if (!userId) {
//             return res.status(401).json({ error: 'Authentication required' });
//         }

//         // Verify farm exists and format is correct
//         let farmDocId;

//         // Check if farm_id is a valid Firestore document ID
//         if (/^[a-zA-Z0-9]{20}$/.test(farm_id)) {
//             // If it looks like a Firestore ID, use it directly
//             farmDocId = farm_id;
//         } else {
//             // If it's a custom ID (like "farm123"), search for it
//             const farmsCollection = collection(db, 'farms');
//             const farmQuery = query(farmsCollection, where('name', '==', farm_id));
//             const farmSnapshot = await getDocs(farmQuery);

//             if (farmSnapshot.empty) {
//                 return res.status(404).json({ error: 'Farm not found' });
//             }

//             farmDocId = farmSnapshot.docs[0].id;
//         }

//         // Now get the farm document
//         const farmRef = doc(db, 'farms', farmDocId);
//         const farmSnap = await getDoc(farmRef);

//         if (!farmSnap.exists()) {
//             return res.status(404).json({ error: 'Farm not found' });
//         }

//         const farmData = farmSnap.data();
//         if (farmData.owner_id !== userId) {
//             return res.status(403).json({ error: 'You do not have permission to add devices to this farm' });
//         }

//         // Check if serial number is already registered
//         const devicesCollection = collection(db, 'devices');
//         const serialQuery = query(
//             devicesCollection,
//             where('serial_no', '==', serial_no)
//         );

//         const existingSerialDevices = await getDocs(serialQuery);

//         if (!existingSerialDevices.empty) {
//             return res.status(400).json({
//                 error: 'This device is already registered. Each device can only be registered once.',
//                 device: {
//                     id: existingSerialDevices.docs[0].id,
//                     ...existingSerialDevices.docs[0].data()
//                 }
//             });
//         }

//         // Generate device ID based on type
//         let typePrefix;
//         let capabilities = {};

//         if (type === "FermWise Bot - Basic") {
//             typePrefix = "basic";
//             capabilities = {
//                 temperature: true,
//                 humidity: true,
//                 soil_moisture: true,
//                 soil_temperature: false,
//                 imaging: false,
//                 livestock_monitoring: false
//             };
//         } else if (type === "FermWise Bot - Pro") {
//             typePrefix = "pro";
//             capabilities = {
//                 temperature: true,
//                 humidity: true,
//                 soil_moisture: true,
//                 soil_temperature: true,
//                 imaging: true,
//                 livestock_monitoring: false
//             };
//         } else {
//             typePrefix = "enterprise";
//             capabilities = {
//                 temperature: true,
//                 humidity: true,
//                 soil_moisture: true,
//                 soil_temperature: true,
//                 imaging: true,
//                 livestock_monitoring: true
//             };
//         }

//         // Generate a random string for the device ID
//         const randomString = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
//         const device_id = `device-${randomString}`;

//         // Generate order ID
//         const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

//         // Create device object with auto-generated health data
//         const deviceData = {
//             name,
//             type,
//             status: status || 'online',
//             farm_id: farmDocId,
//             user_id: userId,
//             purchase_date: Timestamp.now(),
//             order_id: orderId,
//             device_id,
//             serial_no,
//             capabilities,
//             registration_count: 1,
//             first_registration_date: Timestamp.now(),
//             health: {
//                 battery_level: 100,
//                 signal_strength: 95,
//                 firmware_version: '1.0.0',
//                 last_online: Timestamp.now(),
//                 status: 'online'
//             },
//             created_at: Timestamp.now()
//         };

//         // Add to Firestore
//         const docRef = await addDoc(devicesCollection, deviceData);

//         // Create an order record
//         const orderData = {
//             id: orderId,
//             user_id: userId,
//             farm_id: farmDocId,
//             device_id: device_id,
//             serial_no: serial_no,
//             device_type: type,
//             status: 'completed',
//             created_at: Timestamp.now(),
//             device_registered: true,
//             device_registered_at: Timestamp.now(),
//             device_registered_to_farm: farmDocId
//         };

//         await setDoc(doc(db, 'orders', orderId), orderData);

//         // Return success response
//         res.status(201).json({
//             id: docRef.id,
//             message: 'Device registered successfully. Note: This device can only be registered once.',
//             ...deviceData
//         });
//     } catch (error) {
//         console.error('Error registering device:', error);
//         res.status(500).json({ error: 'Failed to register device' });
//     }
// });

// // Update Device Health Status
// app.post('/api/devices/:deviceId/health', requireAuth, async (req, res) => {
//     try {
//         const userId = req.userId!;
//         const { deviceId } = req.params;
//         const {
//             battery_level,
//             signal_strength,
//             firmware_version,
//             status,
//             last_online
//         } = req.body;

//         // Find the device
//         const devicesCollection = collection(db, 'devices');
//         const deviceQuery = query(
//             devicesCollection,
//             where('device_id', '==', deviceId)
//         );

//         const deviceSnapshot = await getDocs(deviceQuery);

//         if (deviceSnapshot.empty) {
//             return res.status(404).json({ error: 'Device not found' });
//         }

//         const deviceDoc = deviceSnapshot.docs[0];
//         const deviceData = deviceDoc.data();

//         // Verify device belongs to user
//         if (deviceData.user_id !== userId) {
//             return res.status(403).json({ error: 'You do not have permission to update this device' });
//         }

//         // Update health data
//         const updatedHealth = {
//             ...deviceData.health,
//             battery_level: battery_level !== undefined ? battery_level : deviceData.health?.battery_level,
//             signal_strength: signal_strength !== undefined ? signal_strength : deviceData.health?.signal_strength,
//             firmware_version: firmware_version || deviceData.health?.firmware_version,
//             status: status || deviceData.health?.status,
//             last_online: last_online ? new Date(last_online) : Timestamp.now()
//         };

//         // Update device document
//         await updateDoc(doc(db, 'devices', deviceDoc.id), {
//             health: updatedHealth,
//             status: status || deviceData.status
//         });

//         // Return success response
//         res.json({
//             id: deviceDoc.id,
//             device_id: deviceId,
//             message: 'Device health updated successfully',
//             health: updatedHealth
//         });
//     } catch (error) {
//         console.error('Error updating device health:', error);
//         res.status(500).json({ error: 'Failed to update device health' });
//     }
// });

// // Image upload endpoint for IoT devices
// app.post('/api/devices/upload-image', requireAuth, validateDevice, upload.single('image'), async (req: Request, res: Response) => {
//     try {
//         const userId = req.userId!;
//         const { device_id, farm_id } = req.body;
//         const file = req.file;

//         if (!file) {
//             return res.status(400).json({ error: 'No image file provided' });
//         }

//         // Get device data from middleware
//         const device_data = req.body.device_data;

//         // Check if device supports imaging
//         if (!device_data.capabilities?.imaging) {
//             return res.status(403).json({
//                 error: 'This device does not support imaging capabilities',
//                 device_type: device_data.type
//             });
//         }

//         // Create a buffer stream for Cloudinary upload
//         const streamUpload = (buffer: Buffer) => {
//             return new Promise((resolve, reject) => {
//                 const stream = cloudinary.uploader.upload_stream(
//                     {
//                         folder: `fermwise/${farm_id}/${device_id}`,
//                         resource_type: 'image',
//                         public_id: `image_${Date.now()}`,
//                         tags: [device_id, farm_id, device_data.type]
//                     },
//                     (error, result) => {
//                         if (error) return reject(error);
//                         resolve(result);
//                     }
//                 );

//                 // Convert buffer to stream and pipe to Cloudinary
//                 const bufferStream = new Readable();
//                 bufferStream.push(buffer);
//                 bufferStream.push(null);
//                 bufferStream.pipe(stream);
//             });
//         };

//         // Upload directly to Cloudinary from memory
//         const result: any = await streamUpload(file.buffer);

//         // Create image record in Firestore
//         const imageData = {
//             device_id,
//             farm_id,
//             user_id: userId,
//             image_url: result.secure_url,
//             public_id: result.public_id,
//             width: result.width,
//             height: result.height,
//             format: result.format,
//             created_at: Timestamp.now(),
//             device_type: device_data.type,
//             metadata: {
//                 resource_type: result.resource_type,
//                 bytes: result.bytes,
//                 etag: result.etag
//             }
//         };

//         // Add to Firestore
//         const imagesCollection = collection(db, 'device_images');
//         const docRef = await addDoc(imagesCollection, imageData);

//         // Return success response
//         res.status(201).json({
//             id: docRef.id,
//             message: 'Image uploaded successfully',
//             ...imageData
//         });
//     } catch (error) {
//         console.error('Error uploading image:', error);
//         res.status(500).json({ error: 'Failed to upload image' });
//     }
// });

// // Get images for a specific device
// app.get('/api/devices/:device_id/images', requireAuth, async (req: Request, res: Response) => {
//     try {
//         const userId = req.userId!;
//         const { device_id } = req.params;
//         const { farm_id, limit = 10, page = 1 } = req.query;

//         if (!device_id || !farm_id) {
//             return res.status(400).json({ error: 'Device ID and Farm ID are required' });
//         }

//         // Check if farm exists and user has access
//         const farmRef = doc(db, 'farms', farm_id as string);
//         const farmDoc = await getDoc(farmRef);

//         if (!farmDoc.exists()) {
//             return res.status(404).json({ error: 'Farm not found' });
//         }

//         const farmData = farmDoc.data();
//         if (farmData.owner_id !== userId && (!farmData.members || !farmData.members.includes(userId))) {
//             return res.status(403).json({ error: 'You do not have permission to access this farm' });
//         }

//         // Check if device exists and belongs to the farm
//         const devicesRef = collection(db, 'devices');
//         const deviceQuery = query(devicesRef, where('device_id', '==', device_id), where('farm_id', '==', farm_id));
//         const deviceSnapshot = await getDocs(deviceQuery);

//         if (deviceSnapshot.empty) {
//             return res.status(404).json({ error: 'Device not found or not associated with this farm' });
//         }

//         // Get images for the device
//         const imagesRef = collection(db, 'device_images');
//         const imagesQuery = query(
//             imagesRef,
//             where('device_id', '==', device_id),
//             where('farm_id', '==', farm_id)
//         );

//         const imagesSnapshot = await getDocs(imagesQuery);

//         if (imagesSnapshot.empty) {
//             return res.status(200).json({
//                 message: 'No images found for this device',
//                 images: [],
//                 total: 0,
//                 page: parseInt(page as string),
//                 limit: parseInt(limit as string)
//             });
//         }

//         // Convert to array and sort by created_at (newest first)
//         const images = imagesSnapshot.docs.map(doc => ({
//             id: doc.id,
//             ...doc.data()
//         })).sort((a: any, b: any) => {
//             const aTime = a.created_at?.toMillis() || 0;
//             const bTime = b.created_at?.toMillis() || 0;
//             return bTime - aTime;
//         }));

// // Paginate results
// const startIndex = (parseInt(page as string) - 1) * parseInt(limit as string);
// const endIndex = startIndex + parseInt(limit as string);
// const paginatedImages = images.slice(startIndex, endIndex);

// res.status(200).json({
//     images: paginatedImages,
//     total: images.length,
//     page: parseInt(page as string),
//     limit: parseInt(limit as string),
//     device_id,
//     farm_id
// });
//     } catch (error) {
//     console.error('Error retrieving device images:', error);
//     res.status(500).json({ error: 'Failed to retrieve device images' });
// }
// });

// // Delete an image
// app.delete('/api/images/:image_id', requireAuth, async (req: Request, res: Response) => {
//     try {
//         const userId = req.userId!;
//         const { image_id } = req.params;

//         if (!image_id) {
//             return res.status(400).json({ error: 'Image ID is required' });
//         }

//         // Get the image document
//         const imageRef = doc(db, 'device_images', image_id);
//         const imageDoc = await getDoc(imageRef);

//         if (!imageDoc.exists()) {
//             return res.status(404).json({ error: 'Image not found' });
//         }

//         const imageData = imageDoc.data();

//         // Check if user has permission to delete this image
//         if (imageData.user_id !== userId) {
//             // Check if user has access to the farm
//             const farmRef = doc(db, 'farms', imageData.farm_id);
//             const farmDoc = await getDoc(farmRef);

//             if (!farmDoc.exists()) {
//                 return res.status(404).json({ error: 'Farm not found' });
//             }

//             const farmData = farmDoc.data();
//             if (farmData.owner_id !== userId && (!farmData.members || !farmData.members.includes(userId))) {
//                 return res.status(403).json({ error: 'You do not have permission to delete this image' });
//             }
//         }

//         // Delete from Cloudinary
//         if (imageData.public_id) {
//             await cloudinary.uploader.destroy(imageData.public_id);
//         }

//         // Delete from Firestore
//         await deleteDoc(imageRef);

//         res.status(200).json({
//             message: 'Image deleted successfully',
//             id: image_id
//         });
//     } catch (error) {
//         console.error('Error deleting image:', error);
//         res.status(500).json({ error: 'Failed to delete image' });
//     }
// });

// // Get sensor data
// app.get('/api/sensor-data', requireAuth, async (req: Request, res: Response) => {
//     try {
//         const userId = req.userId!;
//         const { farm_id, device_id, limit = 50, page = 1 } = req.query;

//         // Validate required parameters
//         if (!farm_id) {
//             return res.status(400).json({ error: 'Farm ID is required' });
//         }

//         // Check if farm exists and user has access
//         const farmRef = doc(db, 'farms', farm_id as string);
//         const farmDoc = await getDoc(farmRef);

//         if (!farmDoc.exists()) {
//             return res.status(404).json({ error: 'Farm not found' });
//         }

//         const farmData = farmDoc.data();
//         if (farmData.owner_id !== userId && (!farmData.members || !farmData.members.includes(userId))) {
//             return res.status(403).json({ error: 'You do not have permission to access this farm' });
//         }

//         // Build query for sensor data
//         const sensorDataRef = collection(db, 'sensor_data');
//         let sensorQuery: any = query(sensorDataRef, where('farm_id', '==', farm_id));

//         // Add device filter if provided
//         if (device_id) {
//             sensorQuery = query(sensorQuery, where('device_id', '==', device_id));
//         }

//         // Execute query
//         const sensorSnapshot = await getDocs(sensorQuery);

//         if (sensorSnapshot.empty) {
//             return res.status(200).json({
//                 message: 'No sensor data found',
//                 data: [],
//                 total: 0,
//                 page: parseInt(page as string),
//                 limit: parseInt(limit as string)
//             });
//         }

//         // Convert to array and sort by timestamp (newest first)
//         const sensorData = sensorSnapshot.docs.map(doc => {
//             const data = doc.data() as Record<string, any>;
//             return {
//                 id: doc.id,
//                 ...data
//             };
//         }).sort((a: any, b: any) => {
//             const aTime = a.timestamp?.toMillis() || 0;
//             const bTime = b.timestamp?.toMillis() || 0;
//             return bTime - aTime;
//         });

//         // Paginate results
//         const startIndex = (parseInt(page as string) - 1) * parseInt(limit as string);
//         const endIndex = startIndex + parseInt(limit as string);
//         const paginatedData = sensorData.slice(startIndex, endIndex);

//         // Return response
//         res.status(200).json({
//             data: paginatedData,
//             total: sensorData.length,
//             page: parseInt(page as string),
//             limit: parseInt(limit as string),
//             farm_id,
//             device_id: device_id || null
//         });
//     } catch (error) {
//         console.error('Error retrieving sensor data:', error);
//         res.status(500).json({ error: 'Failed to retrieve sensor data' });
//     }
// });

// // Get formatted monitoring data for a farm
// app.get('/api/farms/:id/monitoring-formatted', async (req, res) => {
//     try {
//         const farmId = req.params.id;

//         // Get farm data
//         const farmRef = doc(db, 'farms', farmId);
//         const farmSnap = await getDoc(farmRef);

//         if (!farmSnap.exists()) {
//             return res.status(404).json({ error: 'Farm not found' });
//         }

//         const farmData = farmSnap.data();

//         // Get devices for this farm
//         const devicesCollection = collection(db, 'devices');
//         const deviceQuery = query(devicesCollection, where('farm_id', '==', farmId));
//         const devicesSnapshot = await getDocs(deviceQuery);

//         const devices = devicesSnapshot.docs.map(doc => ({
//             id: doc.id,
//             ...doc.data()
//         }));

//         // Get sensor data for this farm
//         const sensorDataRef = collection(db, 'sensor_data');
//         const sensorQuery = query(sensorDataRef, where('farm_id', '==', farmId));
//         const sensorSnapshot = await getDocs(sensorQuery);

//         const allSensorData = sensorSnapshot.docs.map(doc => ({
//             id: doc.id,
//             ...doc.data()
//         }));

//         // Filter for last 24 hours
//         const timeAgo = new Date();
//         timeAgo.setHours(timeAgo.getHours() - 24);
//         const timeAgoMillis = timeAgo.getTime();

//         const sensorData = allSensorData
//             .filter((reading: any) => {
//                 if (!reading.timestamp || !reading.timestamp.seconds) {
//                     return false;
//                 }
//                 const readingTime = reading.timestamp.seconds * 1000;
//                 return readingTime >= timeAgoMillis;
//             })
//             .sort((a: any, b: any) => {
//                 const aTime = a.timestamp?.seconds * 1000 || 0;
//                 const bTime = b.timestamp?.seconds * 1000 || 0;
//                 return bTime - aTime;
//             });

//         // Generate monitoring data
//         const monitoringData = analyzeFarmData(farmData, sensorData as any[], devices);

//         // Get the first device with readings
//         const device = monitoringData.devices_monitoring.find(d => d.readings && Object.keys(d.readings).length > 0);

//         if (!device || !device.readings) {
//             return res.status(404).json({ error: 'No device readings found' });
//         }

//         const readings = device.readings;

//         // Format the response
//         const formattedResponse: any = {
//             farm_name: farmData.name,
//             farm_status: monitoringData.status,
//             readings: readings,
//             insights: []
//         };

//         // Add humidity insights
//         if (readings.humidity) {
//             formattedResponse.insights.push({
//                 type: 'humidity',
//                 value: `${readings.humidity.value.toFixed(2)}%`,
//                 message: `🌦️ Average Humidity: ${readings.humidity.value.toFixed(2)}%`,
//                 warning: `⚠️ Warning: Humidity is too high! This can lead to fungal diseases.`,
//                 action: `🌬️ Suggestion: Ensure proper ventilation in your crop area.`
//             });

//             formattedResponse.insights.push({
//                 type: 'humidity_additional',
//                 value: `${readings.humidity.value.toFixed(2)}%`,
//                 message: `⚠️ Warning: Humidity is ${readings.humidity.value.toFixed(2)}%. This is not good for your crops!`,
//                 action: `💧 Suggestion: Increase irrigation to raise humidity levels.`
//             });
//         }

//         // Add soil moisture insights
//         if (readings.soil_moisture) {
//             formattedResponse.insights.push({
//                 type: 'soil_moisture',
//                 value: `${readings.soil_moisture.value.toFixed(2)}%`,
//                 message: `🌱 Average Soil Moisture: ${readings.soil_moisture.value.toFixed(2)}%`,
//                 action: `💧 Action: The soil has enough moisture. No need to water now.`
//             });

//             formattedResponse.insights.push({
//                 type: 'soil_moisture_additional',
//                 value: `${readings.soil_moisture.value.toFixed(2)}%`,
//                 message: `⚠️ Warning: Soil moisture is ${readings.soil_moisture.value.toFixed(2)}%. Your plants might be thirsty!`,
//                 action: `🚰 Action: Turning on the irrigation system.`
//             });
//         }

//         // Add livestock temperature insights
//         if (readings.livestock_temperature) {
//             formattedResponse.insights.push({
//                 type: 'livestock_temperature',
//                 value: `${readings.livestock_temperature.value}°C`,
//                 message: `🌡️ Current Livestock Temperature: ${readings.livestock_temperature.value}°C`,
//                 action: `🌡️ Action: The temperature is fine for your livestock. No action needed.`
//             });
//         }

//         // Add image analysis
//         const deviceInfo = devices.find(d => (d as any).device_id === device.device_id || d.id === device.device_id);
//         if (deviceInfo && (deviceInfo as any).image_url) {
//             formattedResponse.insights.push({
//                 type: 'image_analysis',
//                 image_url: (deviceInfo as any).image_url,
//                 message: `📸 Analyzing the image of your crops at: ${(deviceInfo as any).image_url}`,
//                 result: `✅ Result: No diseases detected.`,
//                 conclusion: `😊 Great! Your crops are healthy.`
//             });
//         } else {
//             // Find an image URL in the sensor data
//             const latestReading = sensorData.find(
//                 (reading: any) => reading.device_id === device.device_id && reading.image_url
//             );

//             if (latestReading && (latestReading as any).image_url) {
//                 formattedResponse.insights.push({
//                     type: 'image_analysis',
//                     image_url: (latestReading as any).image_url,
//                     message: `📸 Analyzing the image of your crops at: ${(latestReading as any).image_url}`,
//                     result: `✅ Result: No diseases detected.`,
//                     conclusion: `😊 Great! Your crops are healthy.`
//                 });
//             }
//         }

//         // Add formatted text output
//         let formattedText = '';

//         formattedResponse.insights.forEach((insight: any) => {
//             if (insight.message) formattedText += insight.message + '\n';
//             if (insight.warning) formattedText += insight.warning + '\n';
//             if (insight.action) formattedText += insight.action + '\n';
//             if (insight.result) formattedText += insight.result + '\n';
//             if (insight.conclusion) formattedText += insight.conclusion + '\n';
//             formattedText += '\n';
//         });

//         formattedResponse.formatted_text = formattedText.trim();

//         res.json(formattedResponse);
//     } catch (error) {
//         console.error('Error fetching formatted monitoring data:', error);
//         res.status(500).json({ error: 'Failed to fetch monitoring data' });
//     }
// });

// // Import monitoring routes
// import monitoringRoutes from './monitoring/routes';

// // Add monitoring routes
// app.use('/api/monitoring', monitoringRoutes);

// Start server
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);

    // Verify Firebase connection on startup
    const isConnected = await verifyFirebaseConnection();
    if (isConnected) {
        console.log('🚀 Server is fully operational');
    } else {
        console.warn('⚠️ Server started but Firebase connection is not working');
    }
});