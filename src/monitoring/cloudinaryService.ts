/**
 * Cloudinary Service for FermWise Monitoring System
 * 
 * This service handles direct uploads to Cloudinary without storing files locally.
 */

import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Interface for Cloudinary upload response
 */
export interface CloudinaryUploadResponse {
    public_id: string;
    secure_url: string;
    original_filename: string;
    format: string;
    width: number;
    height: number;
    resource_type: string;
    bytes: number;
    etag: string;
    created_at: string;
}

/**
 * Interface for Cloudinary upload options
 */
export interface CloudinaryUploadOptions {
    folder?: string;
    public_id?: string;
    tags?: string[];
    resource_type?: "image" | "video" | "raw" | "auto";
    overwrite?: boolean;
}

/**
 * Uploads a base64 image to Cloudinary
 * 
 * @param base64Image Base64 encoded image data
 * @param options Upload options
 * @returns Promise with Cloudinary upload response
 */
export const uploadBase64Image = async (
    base64Image: string,
    options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResponse> => {
    try {
        // Ensure base64 string is properly formatted
        const formattedBase64 = base64Image.includes('data:image')
            ? base64Image
            : `data:image/jpeg;base64,${base64Image}`;

        // Set default options
        const uploadOptions = {
            resource_type: "image" as "image",
            overwrite: true,
            ...options
        };

        // Upload to Cloudinary
        const result = await new Promise<CloudinaryUploadResponse>((resolve, reject) => {
            cloudinary.uploader.upload(
                formattedBase64,
                uploadOptions,
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result as CloudinaryUploadResponse);
                }
            );
        });

        return result;
    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        throw new Error('Failed to upload image to Cloudinary');
    }
};

/**
 * Uploads an image from a URL to Cloudinary
 * 
 * @param imageUrl URL of the image to upload
 * @param options Upload options
 * @returns Promise with Cloudinary upload response
 */
export const uploadImageFromUrl = async (
    imageUrl: string,
    options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResponse> => {
    try {
        // Set default options
        const uploadOptions = {
            resource_type: "image" as "image",
            overwrite: true,
            ...options
        };

        // Upload to Cloudinary
        const result = await new Promise<CloudinaryUploadResponse>((resolve, reject) => {
            cloudinary.uploader.upload(
                imageUrl,
                uploadOptions,
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result as CloudinaryUploadResponse);
                }
            );
        });

        return result;
    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        throw new Error('Failed to upload image to Cloudinary');
    }
};

/**
 * Generates a Cloudinary URL for an image with transformations
 * 
 * @param publicId Cloudinary public ID of the image
 * @param transformations Cloudinary transformations to apply
 * @returns Cloudinary URL with transformations
 */
export const getImageUrl = (
    publicId: string,
    transformations: Record<string, any> = {}
): string => {
    return cloudinary.url(publicId, transformations);
};

export default {
    uploadBase64Image,
    uploadImageFromUrl,
    getImageUrl
}; 