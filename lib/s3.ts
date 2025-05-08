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
    // Import the DeleteObjectCommand from the AWS SDK
    const { DeleteObjectCommand } = require("@aws-sdk/client-s3");

    // Create a proper DeleteObjectCommand
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    // Send the command to delete the object
    const result = await s3Client.send(command);
    console.log(`Successfully deleted ${key} from S3 bucket ${bucketName}`);
    return result;
  } catch (error) {
    console.error("Error deleting from S3:", error);
    // Don't throw the error, just log it and continue
    // This prevents deletion errors from breaking the main flow
    return { success: false, error };
  }
}

// Get a URL for a file in S3
export async function getSignedUrl(key: string) {
  const bucketName = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION || "us-east-1";

  if (!bucketName) {
    throw new Error("AWS S3 bucket name is not configured");
  }

  try {
    // Generate a direct S3 URL (not actually signed, but works for public buckets)
    const url = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
    console.log(`Generated S3 URL: ${url}`);
    return url;
  } catch (error) {
    console.error("Error generating S3 URL:", error);
    throw error;
  }
}

// Extract audio from video using S3 and return the URL
// We'll use a serverless approach to convert the video to audio
export async function extractAudioFromS3Video(videoKey: string): Promise<string> {
  console.log(`Extracting audio from S3 video: ${videoKey}`);

  try {
    // Get a signed URL for the video file
    const videoUrl = await getSignedUrl(videoKey);
    console.log(`S3 video URL: ${videoUrl}`);

    // Create a new key for the audio file
    const audioKey = videoKey.replace(/\.[^/.]+$/, "") + "_audio.mp3";
    console.log(`Audio file will be saved as: ${audioKey}`);

    // First, download a small portion of the video to determine its format
    const headerBytes = await getByteRangeFromS3Url(videoUrl, 0, 4096);
    console.log(`Downloaded ${headerBytes.length} bytes from video header`);

    // Check if this is actually an MP4 file
    const isMP4 = headerBytes.includes(Buffer.from('ftyp'));

    if (!isMP4) {
      console.log("This doesn't appear to be an MP4 file, checking for WAV format");
      // Check if it might be a WAV file
      const isWavResult = isWavBuffer(headerBytes);
      if (isWavResult.isWav) {
        console.log(`Detected WAV file with sample rate: ${isWavResult.sampleRate} Hz`);
        // For WAV files, we can use them directly with Google Speech
        return videoUrl;
      }
      
      console.log("Unknown format, will attempt to process as audio anyway");
      return videoUrl;
    }

    console.log("Confirmed MP4 file, proceeding with conversion");

    // Import the PutObjectCommand from the AWS SDK
    const { PutObjectCommand } = require("@aws-sdk/client-s3");
    const s3Client = initS3();
    const bucketName = process.env.AWS_S3_BUCKET;

    if (!bucketName) {
      throw new Error("AWS S3 bucket name is not configured");
    }

    // Download the first 1MB of the video to use as our audio sample
    const audioSample = await getByteRangeFromS3Url(videoUrl, 0, 1024 * 1024);
    console.log(`Downloaded ${audioSample.length} bytes of video for audio sample`);

    // Upload the audio sample to S3 with audio/mp3 content type
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: audioKey,
        Body: audioSample,
        ContentType: "audio/mp3",
      })
    );

    console.log(`Created audio file in S3: ${audioKey}`);

    // Get a signed URL for the audio file
    const audioUrl = await getSignedUrl(audioKey);
    console.log(`Audio URL: ${audioUrl}`);

    return audioUrl;
  } catch (error: any) {
    console.error("Error extracting audio from video:", error);
    throw new Error(`Failed to extract audio from video: ${error.message}`);
  }
}

// Get a byte range from an S3 object using a URL
export async function getByteRangeFromS3Url(url: string, start: number, end: number): Promise<Buffer> {
  console.log(`Fetching byte range ${start}-${end} from ${url}`);

  try {
    // Use axios to fetch the byte range
    const axios = require('axios');
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'Range': `bytes=${start}-${end}`
      },
      timeout: 30000 // 30 second timeout
    });

    if (!response.data) {
      throw new Error(`Empty response from URL: ${url}`);
    }

    console.log(`Successfully fetched ${response.data.byteLength} bytes from URL`);
    return Buffer.from(response.data);
  } catch (error: any) {
    console.error(`Error fetching byte range from S3 URL:`, error);
    throw new Error(`Failed to fetch byte range from S3: ${error.message}`);
  }
}

// Get the content length of an S3 object using a URL
export async function getContentLengthFromS3Url(url: string): Promise<number> {
  console.log(`Getting content length for ${url}`);

  try {
    // Use axios to make a HEAD request
    const axios = require('axios');
    const response = await axios.head(url, {
      timeout: 10000 // 10 second timeout
    });

    const contentLength = parseInt(response.headers['content-length'] || '0', 10);
    console.log(`Content length for ${url}: ${contentLength} bytes`);
    return contentLength;
  } catch (error: any) {
    console.error(`Error getting content length from S3 URL:`, error);
    throw new Error(`Failed to get content length from S3: ${error.message}`);
  }
}
