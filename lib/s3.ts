import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { randomUUID } from "crypto";

// Initialize S3 client
export function initS3() {
  const region = process.env.AWS_REGION || "us-east-1";
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    console.error("AWS credentials missing:", {
      accessKeyId: !!accessKeyId,
      secretAccessKey: !!secretAccessKey,
    });
    throw new Error("AWS credentials are not properly configured");
  }

  // Configure S3 client
  const s3Client = new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return s3Client;
}

// Upload a file to S3 - optimized for serverless environments
export async function uploadToS3(
  buffer: Buffer,
  options: {
    folder?: string;
    fileType?: string;
    publicId?: string;
    maxRetries?: number;
  } = {}
) {
  const s3Client = initS3();
  const bucketName = process.env.AWS_S3_BUCKET;

  if (!bucketName) {
    throw new Error("AWS S3 bucket name is not configured");
  }

  // Determine content type based on fileType
  let contentType = "application/octet-stream";
  if (options.fileType) {
    contentType = options.fileType;
  }

  // Create a unique key for the file
  const folder = options.folder || "uploads";
  const publicId = options.publicId || `file_${randomUUID()}`;
  const key = `${folder}/${publicId}`;

  console.log(`Uploading to S3 bucket ${bucketName}, key: ${key}`);

  try {
    // Use the Upload utility which handles multipart uploads
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      },
      // Configure for serverless environments
      queueSize: 1, // Reduce concurrency for serverless
      partSize: 5 * 1024 * 1024, // 5MB parts
      leavePartsOnError: false, // Clean up failed uploads
    });

    // Add progress tracking
    upload.on("httpUploadProgress", (progress) => {
      console.log(`S3 upload progress: ${JSON.stringify(progress)}`);
    });

    // Execute the upload
    const result = await upload.done();

    // Return a response similar to Cloudinary for compatibility
    return {
      secure_url: result.Location || `https://${bucketName}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`,
      public_id: key,
      original_filename: publicId,
      format: contentType.split("/")[1],
      resource_type: contentType.startsWith("image/") ? "image" : contentType.startsWith("video/") ? "video" : "raw",
      bytes: buffer.length,
      created_at: new Date().toISOString(),
      etag: result.ETag,
      // Add additional fields to match Cloudinary response structure
      version: Date.now().toString(),
      signature: result.ETag?.replace(/"/g, "") || "",
      width: 0, // Not applicable for S3
      height: 0, // Not applicable for S3
    };
  } catch (error: any) {
    console.error("Error uploading to S3:", error);
    throw new Error(`Failed to upload to S3: ${error.message}`);
  }
}

// Delete a file from S3
export async function deleteFromS3(key: string) {
  const s3Client = initS3();
  const bucketName = process.env.AWS_S3_BUCKET;

  if (!bucketName) {
    throw new Error("AWS S3 bucket name is not configured");
  }

  try {
    const result = await s3Client.send({
      Bucket: bucketName,
      Key: key,
    });
    return result;
  } catch (error) {
    console.error("Error deleting from S3:", error);
    throw error;
  }
}

// Get a signed URL for a file in S3 (useful for temporary access)
export async function getSignedUrl(key: string, expiresIn = 3600) {
  const s3Client = initS3();
  const bucketName = process.env.AWS_S3_BUCKET;

  if (!bucketName) {
    throw new Error("AWS S3 bucket name is not configured");
  }

  try {
    const url = `https://${bucketName}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`;
    return url;
  } catch (error) {
    console.error("Error generating signed URL:", error);
    throw error;
  }
}

// Extract audio from video using S3 and return the URL
// Since we can't directly extract audio in S3, we'll just return the video URL
// and let the Google Speech API handle it (it can process video files directly)
export async function extractAudioFromS3Video(videoKey: string) {
  console.log(`Using S3 video directly for transcription: ${videoKey}`);

  // Get a signed URL for the video file
  const videoUrl = await getSignedUrl(videoKey);

  // Log the URL for debugging
  console.log(`S3 video URL for transcription: ${videoUrl}`);

  // Return the video URL - Google Speech API will handle it
  return videoUrl;
}
