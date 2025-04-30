import { v2 as cloudinary } from "cloudinary";

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

// Upload a file to Cloudinary
export async function uploadToCloudinary(
  buffer: Buffer,
  options: {
    folder?: string;
    resourceType?: "auto" | "image" | "video" | "raw";
    publicId?: string;
  } = {}
) {
  const cloudinary = initCloudinary();
  
  const uploadOptions = {
    resource_type: options.resourceType || "auto",
    folder: options.folder || "uploads",
    public_id: options.publicId || `file_${Date.now()}`,
  };

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    // Handle upload stream errors
    uploadStream.on('error', (error) => {
      console.error("Upload stream error:", error);
      reject(error);
    });

    uploadStream.end(buffer);
  });
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
