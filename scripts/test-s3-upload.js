// Test script for S3 upload functionality
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { S3Client } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const { randomUUID } = require("crypto");

// Initialize S3 client
function initS3() {
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

// Upload a file to S3
async function uploadToS3(buffer, options = {}) {
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
      queueSize: 1,
      partSize: 5 * 1024 * 1024,
      leavePartsOnError: false,
    });

    // Add progress tracking
    upload.on("httpUploadProgress", (progress) => {
      console.log(`S3 upload progress: ${JSON.stringify(progress)}`);
    });

    // Execute the upload
    const result = await upload.done();

    return {
      secure_url: result.Location || `https://${bucketName}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`,
      public_id: key,
      original_filename: publicId,
      format: contentType.split("/")[1],
      resource_type: contentType.startsWith("image/") ? "image" : contentType.startsWith("video/") ? "video" : "raw",
      bytes: buffer.length,
      created_at: new Date().toISOString(),
      etag: result.ETag,
      version: Date.now().toString(),
      signature: result.ETag?.replace(/"/g, "") || "",
      width: 0,
      height: 0,
    };
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw new Error(`Failed to upload to S3: ${error.message}`);
  }
}

// Delete a file from S3
async function deleteFromS3(key) {
  const s3Client = initS3();
  const bucketName = process.env.AWS_S3_BUCKET;

  if (!bucketName) {
    throw new Error("AWS S3 bucket name is not configured");
  }

  try {
    const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    const result = await s3Client.send(command);
    return result;
  } catch (error) {
    console.error("Error deleting from S3:", error);
    throw error;
  }
}

// Check if AWS credentials are configured
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET) {
  console.error('AWS S3 credentials not configured. Please set the following environment variables:');
  console.error('  AWS_REGION (optional, defaults to us-east-1)');
  console.error('  AWS_ACCESS_KEY_ID');
  console.error('  AWS_SECRET_ACCESS_KEY');
  console.error('  AWS_S3_BUCKET');
  process.exit(1);
}

// Create a test file if it doesn't exist
const testFilePath = path.join(__dirname, 'test-file.txt');
if (!fs.existsSync(testFilePath)) {
  fs.writeFileSync(testFilePath, 'This is a test file for S3 upload.');
  console.log(`Created test file: ${testFilePath}`);
}

// Read the test file
const fileBuffer = fs.readFileSync(testFilePath);

async function runTest() {
  try {
    console.log('Starting S3 upload test...');

    // Upload the file to S3
    const uploadResult = await uploadToS3(fileBuffer, {
      folder: 'test',
      publicId: `test-file-${Date.now()}`,
      fileType: 'text/plain'
    });

    console.log('Upload successful!');
    console.log('Upload result:', JSON.stringify(uploadResult, null, 2));

    // Delete the file from S3
    console.log(`Deleting file with key: ${uploadResult.public_id}`);
    await deleteFromS3(uploadResult.public_id);

    console.log('File deleted successfully!');
    console.log('S3 upload and delete test completed successfully!');

    // Clean up the local test file
    fs.unlinkSync(testFilePath);
    console.log(`Deleted local test file: ${testFilePath}`);

    return true;
  } catch (error) {
    console.error('Error during S3 test:', error);
    return false;
  }
}

// Run the test
runTest()
  .then(success => {
    if (success) {
      console.log('✅ S3 functionality is working correctly!');
      process.exit(0);
    } else {
      console.error('❌ S3 functionality test failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unhandled error during test:', error);
    process.exit(1);
  });
