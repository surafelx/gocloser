#!/usr/bin/env node
// s3-video-transcriber.js
// A serverless-friendly script to process and transcribe videos using AWS S3
// Optimized for environments with limited disk access and execution time

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const https = require("https");
const FormData = require("form-data");
const axios = require("axios");
const dotenv = require("dotenv");
const { SpeechClient } = require("@google-cloud/speech");
const os = require("os");
const { 
  S3Client, 
  GetObjectCommand, 
  PutObjectCommand,
  HeadObjectCommand
} = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const { Readable } = require("stream");
const { finished } = require("stream/promises");
const { v4: uuidv4 } = require("uuid");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

// Config
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GOOGLE_CREDENTIALS_PATH = path.join(os.tmpdir(), `google-creds-${uuidv4()}.json`);
const TEMP_DIR = path.join(os.tmpdir(), `transcribe-${uuidv4()}`);

// AWS S3 Configuration
const AWS_REGION = process.env.AWS_REGION || "us-east-1";
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

// Sample video URL for downloading
const SAMPLE_VIDEO_URL = "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4";

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
  maxAttempts: 5, // Add retry capability
});

// Create temp directory with unique name to avoid conflicts in serverless environments
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
  console.log(`Created temporary directory: ${TEMP_DIR}`);
}

// Construct the Google credentials object
const creds = {
  type: "service_account",
  project_id: process.env.GOOGLE_PROJECT_ID || "angular-argon-452914-f1",
  private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  token_uri: "https://oauth2.googleapis.com/token",
};

// Write the credentials to a temporary file with unique name
try {
  fs.writeFileSync(GOOGLE_CREDENTIALS_PATH, JSON.stringify(creds, null, 2));
  console.log(`Google credentials written to: ${GOOGLE_CREDENTIALS_PATH}`);
} catch (error) {
  console.error(`Error writing Google credentials: ${error.message}`);
  process.exit(1);
}

// Check for required environment variables
if (!process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_CLIENT_EMAIL) {
  console.error("Error: GOOGLE_PRIVATE_KEY and GOOGLE_CLIENT_EMAIL environment variables are required");
  console.error("Please set these in your .env file");
  process.exit(1);
}

// Function to check if ffmpeg is installed
function checkFfmpeg() {
  try {
    execSync("ffmpeg -version", { stdio: "ignore" });
    return true;
  } catch (error) {
    console.error("Error: ffmpeg is not installed or not in PATH");
    console.error("Please install ffmpeg: https://ffmpeg.org/download.html");
    return false;
  }
}

// Function to check if a file exists in S3
async function checkS3FileExists(key) {
  try {
    const command = new HeadObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: key,
    });
    
    await s3Client.send(command);
    return true;
  } catch (error) {
    if (error.name === 'NotFound') {
      return false;
    }
    throw error;
  }
}

// Function to download a sample video - optimized for serverless
function downloadSampleVideo() {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(TEMP_DIR, `sample-video-${uuidv4()}.mp4`);
    console.log(`Downloading sample video from: ${SAMPLE_VIDEO_URL}`);
    console.log(`Saving to: ${outputPath}`);

    const file = fs.createWriteStream(outputPath);

    https.get(SAMPLE_VIDEO_URL, (response) => {
      response.pipe(file);

      file.on("finish", () => {
        file.close();
        console.log("Sample video download completed!");
        resolve(outputPath);
      });

      file.on("error", (err) => {
        fs.unlink(outputPath, () => {}); // Delete the file on error
        reject(err);
      });
    }).on("error", (err) => {
      fs.unlink(outputPath, () => {}); // Delete the file on error
      reject(err);
    });
  });
}

// Function to upload a file to S3 - optimized for serverless
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
      queueSize: 1, // Reduce for serverless
      partSize: 5 * 1024 * 1024, // 5MB parts
      leavePartsOnError: false,
    });
    
    // Simplified progress tracking for serverless
    upload.on("httpUploadProgress", () => {
      // Just log a dot to show progress without flooding logs
      process.stdout.write(".");
    });
    
    const result = await upload.done();
    console.log(`\nSuccessfully uploaded: ${key}`);
    
    return {
      key: key,
      location: result.Location || `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`,
    };
  } catch (error) {
    console.error(`Error uploading to S3: ${error.message}`);
    throw error;
  }
}

// Function to download a file from S3 - optimized for serverless
async function downloadFromS3(key, localPath) {
  console.log(`Downloading from S3: s3://${AWS_S3_BUCKET}/${key} to ${localPath}`);
  
  try {
    // First check if the file exists
    const exists = await checkS3FileExists(key);
    if (!exists) {
      throw new Error(`The specified key does not exist: ${key}`);
    }
    
    const command = new GetObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: key,
    });
    
    const response = await s3Client.send(command);
    const writeStream = fs.createWriteStream(localPath);
    
    await finished(Readable.fromWeb(response.Body).pipe(writeStream));
    console.log(`Successfully downloaded: ${key}`);
    
    return localPath;
  } catch (error) {
    console.error(`Error downloading from S3: ${error.message}`);
    throw error;
  }
}

// Function to upload text directly to S3 - optimized for serverless
async function uploadTextToS3(text, key) {
  console.log(`Uploading text to S3: s3://${AWS_S3_BUCKET}/${key}`);
  
  try {
    const command = new PutObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: key,
      Body: text,
      ContentType: "text/plain",
    });
    
    const result = await s3Client.send(command);
    console.log(`Successfully uploaded text: ${key}`);
    
    return {
      key: key,
      location: `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`,
      etag: result.ETag,
    };
  } catch (error) {
    console.error(`Error uploading text to S3: ${error.message}`);
    throw error;
  }
}

// Function to get video/audio duration - optimized for serverless
function getMediaDuration(filePath) {
  try {
    const cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`;
    return parseFloat(execSync(cmd).toString().trim());
  } catch (error) {
    console.error(`Error getting media duration: ${error.message}`);
    // Return a default duration if we can't determine it
    return 60;
  }
}

// Function to extract audio from video - optimized for serverless
async function extractAudioFromVideo(videoFilePath, videoKey) {
  const videoName = path.basename(videoKey, path.extname(videoKey));
  const audioLocalPath = path.join(TEMP_DIR, `${videoName}-${uuidv4()}.mp3`);
  const audioS3Key = `audio_extracts/${videoName}-${Date.now()}.mp3`;
  
  console.log(`Extracting audio to: ${audioLocalPath}`);
  try {
    // Use lower quality for faster processing in serverless
    const cmd = `ffmpeg -y -i "${videoFilePath}" -vn -acodec mp3 -ab 64k -ac 1 "${audioLocalPath}"`;
    execSync(cmd);
    
    // Upload audio to S3
    await uploadToS3(audioLocalPath, audioS3Key, "audio/mp3");
    
    return {
      localPath: audioLocalPath,
      s3Key: audioS3Key,
    };
  } catch (error) {
    console.error(`Error extracting audio: ${error.message}`);
    throw error;
  }
}

// Function to split audio into chunks - optimized for serverless
async function splitAudio(audioLocalPath, audioS3Key, chunkDurationSec = 30) {
  const audioName = path.basename(audioS3Key, path.extname(audioS3Key));
  const duration = getMediaDuration(audioLocalPath);
  const numChunks = Math.ceil(duration / chunkDurationSec);
  
  // For serverless, limit the number of chunks to avoid timeouts
  const maxChunks = 10;
  const actualNumChunks = Math.min(numChunks, maxChunks);
  const adjustedChunkDuration = duration / actualNumChunks;

  console.log(`Audio duration: ${duration}s, splitting into ${actualNumChunks} chunks`);

  const chunks = [];
  for (let i = 0; i < actualNumChunks; i++) {
    const startTime = i * adjustedChunkDuration;
    const chunkLocalPath = path.join(TEMP_DIR, `chunk-${i}-${uuidv4()}.mp3`);
    const chunkS3Key = `chunks/${audioName}/chunk-${i}-${Date.now()}.mp3`;
    
    // Use lower quality for faster processing in serverless
    const cmd = `ffmpeg -y -i "${audioLocalPath}" -ss ${startTime} -t ${adjustedChunkDuration} -acodec mp3 -ab 64k -ac 1 "${chunkLocalPath}"`;
    execSync(cmd);
    
    // Upload chunk to S3
    await uploadToS3(chunkLocalPath, chunkS3Key, "audio/mp3");
    
    chunks.push({
      localPath: chunkLocalPath,
      s3Key: chunkS3Key,
    });
  }
  
  return chunks;
}

// Function to transcribe with Google Speech-to-Text - optimized for serverless
async function transcribeWithGoogleSpeech(audioLocalPath) {
  console.log(`Transcribing with Google Speech: ${audioLocalPath}`);
  
  const client = new SpeechClient({
    keyFilename: GOOGLE_CREDENTIALS_PATH,
  });

  const file = fs.readFileSync(audioLocalPath);
  const audioBytes = file.toString("base64");

  const audio = { content: audioBytes };
  const config = {
    encoding: "MP3",
    sampleRateHertz: 16000,
    languageCode: "en-US",
    enableAutomaticPunctuation: true,
    model: "video",
    useEnhanced: true,
  };

  const request = { audio, config };
  
  try {
    const [response] = await client.recognize(request);
    return response.results.map((r) => r.alternatives[0].transcript).join("\n");
  } catch (error) {
    console.error(`Google Speech error: ${error.message}`);
    throw error;
  }
}

// Function to transcribe with OpenAI Whisper (fallback) - optimized for serverless
async function transcribeWithWhisper(audioLocalPath) {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  console.log(`Transcribing with OpenAI Whisper: ${audioLocalPath}`);
  
  const formData = new FormData();
  formData.append("file", fs.createReadStream(audioLocalPath));
  formData.append("model", "whisper-1");
  formData.append("language", "en");

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/audio/transcriptions",
      formData,
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          ...formData.getHeaders(),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 30000, // 30 second timeout for serverless
      }
    );

    return response.data.text;
  } catch (error) {
    console.error(`Whisper error: ${error.message}`);
    throw error;
  }
}

// Function to clean up temporary files - critical for serverless
function cleanupTempFiles() {
  console.log("Cleaning up temporary files...");
  
  try {
    // Delete Google credentials file
    if (fs.existsSync(GOOGLE_CREDENTIALS_PATH)) {
      fs.unlinkSync(GOOGLE_CREDENTIALS_PATH);
      console.log(`Deleted: ${GOOGLE_CREDENTIALS_PATH}`);
    }
    
    // Read all files in the temp directory
    if (fs.existsSync(TEMP_DIR)) {
      const files = fs.readdirSync(TEMP_DIR);
      
      // Delete each file
      for (const file of files) {
        const filePath = path.join(TEMP_DIR, file);
        fs.unlinkSync(filePath);
      }
      
      // Remove the directory itself
      fs.rmdirSync(TEMP_DIR);
      console.log(`Removed temp directory: ${TEMP_DIR}`);
    }
    
    console.log("Temporary files cleaned up successfully");
  } catch (error) {
    console.error(`Error cleaning up temporary files: ${error.message}`);
  }
}

// Main function - optimized for serverless
async function main() {
  console.log("=== S3 Video Transcriber (Serverless Optimized) ===");
  console.log(`Started at: ${new Date().toISOString()}`);
  
  // Check if ffmpeg is installed
  if (!checkFfmpeg()) {
    process.exit(1);
  }

  try {
    // Step 1: Get the video (from local path, S3, or download sample)
    let videoLocalPath;
    let videoS3Key;
    
    const inputArg = process.argv[2];
    
    if (!inputArg) {
      // No argument provided, download sample video
      console.log("No input provided. Downloading sample video...");
      videoLocalPath = await downloadSampleVideo();
      videoS3Key = `videos/sample-video-${Date.now()}.mp4`;
      
      // Upload sample video to S3
      console.log("Uploading sample video to S3...");
      await uploadToS3(videoLocalPath, videoS3Key, "video/mp4");
    } else if (inputArg.startsWith("s3://")) {
      // S3 URI provided
      const s3Uri = inputArg.replace("s3://", "");
      const parts = s3Uri.split("/");
      const bucket = parts[0];
      
      if (bucket !== AWS_S3_BUCKET) {
        console.error(`Error: Specified bucket (${bucket}) does not match configured bucket (${AWS_S3_BUCKET})`);
        process.exit(1);
      }
      
      videoS3Key = parts.slice(1).join("/");
      videoLocalPath = path.join(TEMP_DIR, `${path.basename(videoS3Key)}-${uuidv4()}`);
      
      // Download video from S3
      await downloadFromS3(videoS3Key, videoLocalPath);
    } else if (fs.existsSync(inputArg)) {
      // Local file path provided
      videoLocalPath = inputArg;
      videoS3Key = `videos/${path.basename(videoLocalPath)}-${Date.now()}`;
      
      // Upload video to S3
      console.log("Uploading video to S3...");
      await uploadToS3(videoLocalPath, videoS3Key, "video/mp4");
    } else if (inputArg.includes("/")) {
      // Assume it's an S3 key
      videoS3Key = inputArg;
      videoLocalPath = path.join(TEMP_DIR, `${path.basename(videoS3Key)}-${uuidv4()}`);
      
      // Download video from S3
      await downloadFromS3(videoS3Key, videoLocalPath);
    } else {
      console.error(`Error: Invalid input: ${inputArg}`);
      console.error("Usage: node s3-video-transcriber.js [local-video-path | s3://bucket/key | s3-key]");
      process.exit(1);
    }
    
    console.log(`Processing video: ${videoLocalPath} (S3 Key: ${videoS3Key})`);
    
    // Step 2: Extract audio from video
    const audio = await extractAudioFromVideo(videoLocalPath, videoS3Key);
    console.log(`Audio extracted to S3: ${audio.s3Key}`);
    
    // Step 3: Get audio duration
    const duration = getMediaDuration(audio.localPath);
    const isLong = duration > 30; // Lower threshold for serverless
    
    let transcript = "";
    
    // Step 4: Transcribe audio
    try {
      console.log("Attempting transcription with Google Speech-to-Text...");
      
      // Split audio into chunks if it's long
      let chunks = [];
      if (isLong) {
        chunks = await splitAudio(audio.localPath, audio.s3Key, 30);
      } else {
        chunks = [{ localPath: audio.localPath, s3Key: audio.s3Key }];
      }
      
      for (const chunk of chunks) {
        const chunkTranscript = await transcribeWithGoogleSpeech(chunk.localPath);
        transcript += chunkTranscript + "\n";
      }
      
      console.log("Google Speech-to-Text transcription successful!");
    } catch (googleError) {
      console.error("Google Speech-to-Text failed. Falling back to OpenAI Whisper.");
      
      try {
        // Try OpenAI Whisper as fallback
        if (!OPENAI_API_KEY) {
          console.error("Error: OPENAI_API_KEY is not set. Cannot use Whisper fallback.");
          throw new Error("OPENAI_API_KEY is not set");
        }
        
        // Split audio into chunks if it's long
        let chunks = [];
        if (isLong) {
          chunks = await splitAudio(audio.localPath, audio.s3Key, 30);
        } else {
          chunks = [{ localPath: audio.localPath, s3Key: audio.s3Key }];
        }
        
        for (const chunk of chunks) {
          const chunkTranscript = await transcribeWithWhisper(chunk.localPath);
          transcript += chunkTranscript + "\n";
        }
        
        console.log("OpenAI Whisper transcription successful!");
      } catch (whisperError) {
        console.error("All transcription methods failed.");
        console.error(`Google Speech error: ${googleError.message}`);
        console.error(`Whisper error: ${whisperError.message}`);
        process.exit(1);
      }
    }
    
    // Step 5: Upload transcript to S3
    const videoName = path.basename(videoS3Key, path.extname(videoS3Key));
    const transcriptS3Key = `transcripts/${videoName}_transcript.txt`;
    
    const transcriptResult = await uploadTextToS3(transcript, transcriptS3Key);
    console.log(`Transcription saved to S3: ${transcriptResult.location}`);
    
    // Step 6: Clean up temporary files
    cleanupTempFiles();
    
    console.log("\n=== Transcription Complete ===");
    console.log(`Video: ${videoS3Key}`);
    console.log(`Transcript: ${transcriptS3Key}`);
    console.log(`Transcript URL: ${transcriptResult.location}`);
    
    // Print a preview of the transcript
    console.log("\nTranscript preview:");
    console.log("===================");
    console.log(transcript.substring(0, 500) + (transcript.length > 500 ? "..." : ""));
    console.log("===================");
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error(`Unhandled error: ${error.message}`);
  process.exit(1);
});
