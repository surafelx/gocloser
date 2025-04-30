import { v2 as cloudinary } from "cloudinary";
import axios from "axios";
import fs from "fs";
import path from "path";
import os from "os";

// Initialize Cloudinary with environment variables
export function initCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.error("Cloudinary credentials missing:", {
      cloudName: !!cloudName,
      apiKey: !!apiKey,
      apiSecret: !!apiSecret,
    });
    throw new Error("Cloudinary credentials are not properly configured");
  }

  // Configure Cloudinary
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  return cloudinary;
}

// Upload a file to Cloudinary with retry logic
export async function uploadToCloudinary(
  buffer: Buffer,
  options: {
    folder?: string;
    resourceType?: "auto" | "image" | "video" | "raw";
    publicId?: string;
    maxRetries?: number;
  } = {}
) {
  const cloudinary = initCloudinary();

  // Log Cloudinary configuration for debugging
  console.log("Cloudinary Configuration:", {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ? "Set" : "Missing",
    apiKey: process.env.CLOUDINARY_API_KEY ? "Set" : "Missing",
    apiSecret: process.env.CLOUDINARY_API_SECRET ? "Set" : "Missing",
  });

  const uploadOptions = {
    resource_type: options.resourceType || "auto",
    folder: options.folder || "uploads",
    public_id: options.publicId || `file_${Date.now()}`,
    timeout: 120000, // 120 second timeout
  };

  console.log("Upload options:", JSON.stringify(uploadOptions));

  const maxRetries = options.maxRetries || 3;
  let attempt = 0;
  let lastError: any = null;

  while (attempt < maxRetries) {
    attempt++;
    console.log(`Cloudinary upload attempt ${attempt}/${maxRetries}`);

    try {
      // Use Cloudinary's upload API with a buffer
      return await new Promise((resolve, reject) => {
        // Create a temporary file name for the buffer
        const fileName = `temp_${Date.now()}.${getFileExtension(options.resourceType)}`;

        // Use Cloudinary's upload API directly with buffer
        cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              console.error(`Cloudinary upload error (attempt ${attempt}/${maxRetries}):`, error);
              reject(error);
            } else {
              console.log(`Cloudinary upload successful on attempt ${attempt}`);
              resolve(result);
            }
          }
        ).end(buffer);
      });
    } catch (error: any) {
      lastError = error;
      console.error(`Upload attempt ${attempt} failed:`, error.message);

      // If we've reached max retries, throw the error
      if (attempt >= maxRetries) {
        console.error(`All ${maxRetries} upload attempts failed`);
        throw new Error(`Failed to upload to Cloudinary after ${maxRetries} attempts: ${error.message}`);
      }

      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
      console.log(`Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // This should never be reached due to the throw in the catch block above
  throw lastError || new Error('Failed to upload to Cloudinary');
}

// Helper function to determine MIME type based on resource type
function getMimeType(resourceType?: string): string {
  switch (resourceType) {
    case 'image':
      return 'image/jpeg';
    case 'video':
      return 'video/mp4';
    case 'raw':
      return 'application/octet-stream';
    case 'auto':
    default:
      return 'application/octet-stream';
  }
}

// Helper function to get file extension based on resource type
function getFileExtension(resourceType?: string): string {
  switch (resourceType) {
    case 'image':
      return 'jpg';
    case 'video':
      return 'mp4';
    case 'raw':
      return 'bin';
    case 'auto':
    default:
      return 'bin';
  }
}

// Delete a file from Cloudinary
export async function deleteFromCloudinary(publicId: string) {
  const cloudinary = initCloudinary();

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    throw error;
  }
}

// Convert a Cloudinary video URL to an audio URL using transformations
export function getAudioUrlFromVideo(videoUrl: string): string {
  if (!videoUrl.includes('cloudinary.com')) {
    throw new Error('Not a Cloudinary URL');
  }

  // Insert f_mp3 transformation before the version part of the URL
  // Example: https://res.cloudinary.com/demo/video/upload/v1234/sample.mp4
  // becomes: https://res.cloudinary.com/demo/video/upload/f_mp3/v1234/sample.mp4
  return videoUrl.replace(/\/upload\//, '/upload/f_mp3/');
}

// Get raw binary data from a Cloudinary URL
export async function getCloudinaryBuffer(url: string): Promise<Buffer> {
  try {
    console.log(`Fetching data from Cloudinary: ${url}`);

    // Fetch the file as an array buffer
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'arraybuffer'
    });

    // Convert to buffer
    const buffer = Buffer.from(response.data);
    console.log(`Successfully fetched ${buffer.length} bytes from Cloudinary`);

    return buffer;
  } catch (error: any) {
    console.error(`Error fetching from Cloudinary: ${error.message}`);
    throw new Error(`Failed to fetch from Cloudinary: ${error.message}`);
  }
}

// Create a transformed URL for Cloudinary resources
export function createTransformedUrl(
  originalUrl: string,
  transformations: string[]
): string {
  if (!originalUrl.includes('cloudinary.com')) {
    throw new Error('Not a Cloudinary URL');
  }

  // Insert transformations before the version part of the URL
  // Example: https://res.cloudinary.com/demo/video/upload/v1234/sample.mp4
  // becomes: https://res.cloudinary.com/demo/video/upload/t1,t2,t3/v1234/sample.mp4
  const transformationString = transformations.join(',');
  return originalUrl.replace(/\/upload\//, `/upload/${transformationString}/`);
}

// Extract the public ID from a Cloudinary URL
export function getPublicIdFromUrl(url: string): string {
  if (!url.includes('cloudinary.com')) {
    throw new Error('Not a Cloudinary URL');
  }

  // Extract the public ID from the URL
  // Example: https://res.cloudinary.com/demo/video/upload/v1234/folder/file.mp4
  // Returns: folder/file
  const regex = /\/upload\/(?:.*?\/)?v\d+\/(.+?)(?:\.\w+)?$/;
  const match = url.match(regex);

  if (!match || !match[1]) {
    throw new Error('Could not extract public ID from Cloudinary URL');
  }

  return match[1];
}

// Create a new audio file in Cloudinary from a video
export async function createAudioFromVideo(videoUrl: string): Promise<any> {
  try {
    const cloudinary = initCloudinary();

    // Extract the public ID from the video URL
    const videoPublicId = getPublicIdFromUrl(videoUrl);

    // Create a new public ID for the audio file
    const audioPublicId = `audio_${Date.now()}_${videoPublicId}`;

    // Use Cloudinary's API to create a new audio file from the video
    return new Promise((resolve, reject) => {
      cloudinary.uploader.explicit(
        videoPublicId,
        {
          type: 'upload',
          resource_type: 'video',
          eager: [
            { format: 'mp3', resource_type: 'video' }
          ],
          eager_async: false,
          public_id: audioPublicId,
          folder: 'temp_audio'
        },
        (error, result) => {
          if (error) {
            console.error('Error creating audio from video:', error);
            reject(error);
          } else {
            console.log('Successfully created audio from video:', result);
            resolve(result);
          }
        }
      );
    });
  } catch (error: any) {
    console.error(`Error creating audio from video: ${error.message}`);
    throw new Error(`Failed to create audio from video: ${error.message}`);
  }
}
