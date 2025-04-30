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

// Upload a file to Cloudinary with retry logic - no local storage
export async function uploadToCloudinary(
  buffer: Buffer,
  options: {
    folder?: string;
    resourceType?: "auto" | "image" | "video" | "raw";
    publicId?: string;
    maxRetries?: number;
    fileType?: string; // Added to help determine resource type
  } = {}
) {
  const cloudinary = initCloudinary();

  // Log Cloudinary configuration for debugging
  console.log("Cloudinary Configuration:", {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ? "Set" : "Missing",
    apiKey: process.env.CLOUDINARY_API_KEY ? "Set" : "Missing",
    apiSecret: process.env.CLOUDINARY_API_SECRET ? "Set" : "Missing",
  });

  // Determine the correct resource type based on fileType if provided
  let resourceType = options.resourceType || "auto";
  if (options.fileType) {
    if (options.fileType.startsWith('audio/')) {
      // Audio files should use 'video' resource type in Cloudinary
      resourceType = "video";
      console.log("Detected audio file, using 'video' resource type for Cloudinary");
    } else if (options.fileType.startsWith('video/')) {
      resourceType = "video";
      console.log("Detected video file, using 'video' resource type");
    } else if (options.fileType.startsWith('image/')) {
      resourceType = "image";
      console.log("Detected image file, using 'image' resource type");
    }
  }

  // Create optimized upload options for serverless environment
  const uploadOptions = {
    resource_type: resourceType,
    folder: options.folder || "uploads",
    public_id: options.publicId || `file_${Date.now()}`,
    // Optimize for Vercel
    timeout: 8000,
    use_filename: true,
    unique_filename: true,
    overwrite: true,
    // Disable any processing that might cause timeouts
    eager_async: true,
  };

  console.log("Upload options:", JSON.stringify(uploadOptions));

  const maxRetries = options.maxRetries || 3;
  let attempt = 0;
  let lastError: any = null;

  while (attempt < maxRetries) {
    attempt++;
    console.log(`Cloudinary upload attempt ${attempt}/${maxRetries}`);

    try {
      // Try a simpler approach for Vercel
      return await new Promise((resolve, reject) => {
        // Create a buffer upload stream
        const uploadStream = cloudinary.uploader.upload_stream(
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
        );

        // Handle stream errors
        uploadStream.on('error', (error) => {
          console.error(`Stream error on attempt ${attempt}:`, error);
          reject(error);
        });

        // Write buffer to stream and end
        uploadStream.write(buffer);
        uploadStream.end();
      });
    } catch (error: any) {
      lastError = error;
      console.error(`Upload attempt ${attempt} failed:`, error.message);

      // If we've reached max retries, throw the error
      if (attempt >= maxRetries) {
        console.error(`All ${maxRetries} upload attempts failed`);
        throw new Error(`Failed to upload to Cloudinary after ${maxRetries} attempts: ${error.message}`);
      }

      // Wait before retrying (shorter backoff for Vercel)
      const delay = Math.min(500 * Math.pow(2, attempt), 5000);
      console.log(`Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // This should never be reached due to the throw in the catch block above
  throw lastError || new Error('Failed to upload to Cloudinary');
}

// Note: These helper functions were removed as they're not currently used
// If needed in the future, they can be re-implemented

// Alternative upload method that might work better on Vercel
export async function uploadToCloudinaryAlternative(
  buffer: Buffer,
  options: {
    folder?: string;
    resourceType?: "auto" | "image" | "video" | "raw";
    publicId?: string;
    fileType?: string; // Added to help determine resource type
  } = {}
) {
  const cloudinary = initCloudinary();

  console.log("Using alternative upload method for Vercel");

  // Convert buffer to base64
  const base64Data = buffer.toString('base64');

  // Determine the correct resource type based on fileType if provided
  let resourceType = options.resourceType || "auto";
  if (options.fileType) {
    if (options.fileType.startsWith('audio/')) {
      // Audio files should use 'video' resource type in Cloudinary
      resourceType = "video";
      console.log("Detected audio file, using 'video' resource type for Cloudinary");
    } else if (options.fileType.startsWith('video/')) {
      resourceType = "video";
      console.log("Detected video file, using 'video' resource type");
    } else if (options.fileType.startsWith('image/')) {
      resourceType = "image";
      console.log("Detected image file, using 'image' resource type");
    }
  }

  // Determine data URI prefix based on resource type
  let dataUriPrefix = 'data:application/octet-stream;base64,';
  if (resourceType === 'image') {
    dataUriPrefix = 'data:image/jpeg;base64,';
  } else if (resourceType === 'video') {
    dataUriPrefix = 'data:video/mp4;base64,';
  }

  // Create upload options optimized for Vercel
  const uploadOptions = {
    resource_type: resourceType,
    folder: options.folder || "uploads",
    public_id: options.publicId || `file_${Date.now()}`,
    timeout: 8000,
    // Optimize for Vercel
    eager_async: true,
    use_filename: true,
    unique_filename: true,
    overwrite: true,
  };

  try {
    // Use the upload method with a data URI
    const result = await cloudinary.uploader.upload(
      `${dataUriPrefix}${base64Data}`,
      uploadOptions
    );

    console.log("Alternative upload successful");
    return result;
  } catch (error: any) {
    console.error("Alternative upload failed:", error);
    throw error;
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
