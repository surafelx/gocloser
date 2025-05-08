// upload-video-to-s3.js
// A script to upload a local video file to S3 for testing

const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { S3Client } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

// AWS S3 Configuration
const AWS_REGION = process.env.AWS_REGION || "us-east-1";
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

// Check for required AWS environment variables
if (!AWS_S3_BUCKET || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
  console.error("Error: AWS S3 credentials are not properly configured");
  console.error("Please set AWS_REGION, AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY in your .env file");
  process.exit(1);
}

// Initialize S3 client
const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

// Function to upload a file to S3
async function uploadToS3(localPath, key, contentType = "application/octet-stream") {
  console.log(`Uploading to S3: ${localPath} to s3://${AWS_S3_BUCKET}/${key}`);
  
  try {
    const fileBuffer = fs.readFileSync(localPath);
    
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: AWS_S3_BUCKET,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
      },
      queueSize: 1,
      partSize: 5 * 1024 * 1024,
      leavePartsOnError: false,
    });
    
    upload.on("httpUploadProgress", (progress) => {
      console.log(`S3 upload progress: ${JSON.stringify(progress)}`);
    });
    
    const result = await upload.done();
    console.log(`Successfully uploaded: ${key}`);
    
    return {
      key: key,
      location: result.Location || `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`,
    };
  } catch (error) {
    console.error(`Error uploading to S3: ${error.message}`);
    throw error;
  }
}

// Main function
async function uploadVideoToS3() {
  // Get local video file path from command line argument
  const localVideoPath = process.argv[2];
  if (!localVideoPath) {
    console.error("Error: No local video file specified");
    console.error("Usage: node upload-video-to-s3.js <path-to-local-video.mp4>");
    process.exit(1);
  }

  // Check if file exists
  if (!fs.existsSync(localVideoPath)) {
    console.error(`Error: Local video file not found: ${localVideoPath}`);
    process.exit(1);
  }

  // Check if file is an MP4
  if (path.extname(localVideoPath).toLowerCase() !== '.mp4') {
    console.error("Error: File must be an MP4 video");
    process.exit(1);
  }

  try {
    // Generate S3 key (use the filename or a custom key)
    const filename = path.basename(localVideoPath);
    const s3Key = `videos/${filename}`;
    
    // Upload to S3
    const result = await uploadToS3(localVideoPath, s3Key, "video/mp4");
    
    console.log("\nUpload successful!");
    console.log("===================");
    console.log(`S3 Key: ${result.key}`);
    console.log(`S3 URL: ${result.location}`);
    console.log("===================");
    console.log("\nTo transcribe this video, run:");
    console.log(`node scripts/transcribe-video.js ${result.key}`);
    
    return result;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
uploadVideoToS3().catch(error => {
  console.error(`Unhandled error: ${error.message}`);
  process.exit(1);
});
