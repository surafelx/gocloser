// transcribe-video.js
// A script to transcribe audio from MP4 video files using AWS S3 for storage

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const FormData = require("form-data");
const axios = require("axios");
const dotenv = require("dotenv");
const { SpeechClient } = require("@google-cloud/speech");
const os = require("os");
const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const { Readable } = require("stream");
const { finished } = require("stream/promises");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

// Config
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GOOGLE_CREDENTIALS_PATH = path.join(os.tmpdir(), "google-creds.json");
const TEMP_DIR = path.join(os.tmpdir(), "transcribe-temp");

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

// Construct the Google credentials object
const creds = {
  type: "service_account",
  project_id: process.env.GOOGLE_PROJECT_ID || "angular-argon-452914-f1",
  private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  token_uri: "https://oauth2.googleapis.com/token",
};

// Create temp directory
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
  console.log(`Created temporary directory: ${TEMP_DIR}`);
}

// Write the credentials to a temporary file
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

// Function to download a file from S3
async function downloadFromS3(key, localPath) {
  console.log(`Downloading from S3: s3://${AWS_S3_BUCKET}/${key} to ${localPath}`);

  try {
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

// Function to upload a file to S3
async function uploadToS3(localPath, key, contentType = "application/octet-stream") {
  console.log(`Uploading to S3: ${localPath} to s3://${AWS_S3_BUCKET}/${key}`);

  try {
    // Read file as buffer
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

// Function to upload text directly to S3
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

// Function to get video duration
function getVideoDuration(videoFilePath) {
  const cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoFilePath}"`;
  return parseFloat(execSync(cmd).toString().trim());
}

// Function to extract audio from video
async function extractAudioFromVideo(videoFilePath, videoKey) {
  const videoName = path.basename(videoKey, path.extname(videoKey));
  const audioLocalPath = path.join(TEMP_DIR, `${videoName}.mp3`);
  const audioS3Key = `audio_extracts/${videoName}.mp3`;

  console.log(`Extracting audio to: ${audioLocalPath}`);
  const cmd = `ffmpeg -y -i "${videoFilePath}" -vn -acodec mp3 -ab 128k "${audioLocalPath}"`;
  execSync(cmd);

  // Upload audio to S3
  await uploadToS3(audioLocalPath, audioS3Key, "audio/mp3");

  return {
    localPath: audioLocalPath,
    s3Key: audioS3Key,
  };
}

// Function to split audio into chunks
async function splitAudio(audioLocalPath, audioS3Key, chunkDurationSec = 50) {
  const audioName = path.basename(audioS3Key, path.extname(audioS3Key));
  const duration = getVideoDuration(audioLocalPath);
  const numChunks = Math.ceil(duration / chunkDurationSec);

  console.log(`Audio duration: ${duration}s, splitting into ${numChunks} chunks`);

  const chunks = [];
  for (let i = 0; i < numChunks; i++) {
    const startTime = i * chunkDurationSec;
    const chunkLocalPath = path.join(TEMP_DIR, `chunk-${i}.mp3`);
    const chunkS3Key = `chunks/${audioName}/chunk-${i}.mp3`;

    const cmd = `ffmpeg -y -i "${audioLocalPath}" -ss ${startTime} -t ${chunkDurationSec} -acodec mp3 -ab 128k "${chunkLocalPath}"`;
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

// Function to transcribe with Google Speech-to-Text
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
    const response = await client.recognize(request);
    const results = response[0];
    return results.results.map((r) => r.alternatives[0].transcript).join("\n");
  } catch (error) {
    console.error(`Google Speech error: ${error.message}`);
    throw error;
  }
}

// Function to transcribe with OpenAI Whisper (fallback)
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
      }
    );

    return response.data.text;
  } catch (error) {
    console.error(`Whisper error: ${error.message}`);
    throw error;
  }
}

// Function to clean up temporary files
function cleanupTempFiles() {
  console.log("Cleaning up temporary files...");

  try {
    // Read all files in the temp directory
    const files = fs.readdirSync(TEMP_DIR);

    // Delete each file
    for (const file of files) {
      const filePath = path.join(TEMP_DIR, file);
      fs.unlinkSync(filePath);
      console.log(`Deleted: ${filePath}`);
    }

    console.log("Temporary files cleaned up successfully");
  } catch (error) {
    console.error(`Error cleaning up temporary files: ${error.message}`);
  }
}

// Main function
async function transcribeVideo() {
  // Check if ffmpeg is installed
  if (!checkFfmpeg()) {
    process.exit(1);
  }

  // Get video S3 key from command line argument
  const videoS3Key = process.argv[2];
  if (!videoS3Key) {
    console.error("Error: No video S3 key specified");
    console.error("Usage: node transcribe-video.js <s3-key-to-video.mp4>");
    process.exit(1);
  }

  // Check if the key ends with .mp4
  if (!videoS3Key.toLowerCase().endsWith('.mp4')) {
    console.error("Error: File must be an MP4 video");
    process.exit(1);
  }

  try {
    console.log(`Processing video from S3: ${videoS3Key}`);

    // Download video from S3
    const videoLocalPath = path.join(TEMP_DIR, path.basename(videoS3Key));
    await downloadFromS3(videoS3Key, videoLocalPath);

    // Extract audio from video
    const audio = await extractAudioFromVideo(videoLocalPath, videoS3Key);
    console.log(`Audio extracted to S3: ${audio.s3Key}`);

    // Get audio duration
    const duration = getVideoDuration(audio.localPath);
    const isLong = duration > 60;

    let transcript = "";

    // Try Google Speech-to-Text first
    try {
      console.log("Attempting transcription with Google Speech-to-Text...");

      // Split audio into chunks if it's long
      let chunks = [];
      if (isLong) {
        chunks = await splitAudio(audio.localPath, audio.s3Key, 50);
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
          chunks = await splitAudio(audio.localPath, audio.s3Key, 50);
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

    // Upload transcript to S3
    const videoName = path.basename(videoS3Key, path.extname(videoS3Key));
    const transcriptS3Key = `transcripts/${videoName}_transcript.txt`;

    const transcriptResult = await uploadTextToS3(transcript, transcriptS3Key);
    console.log(`Transcription saved to S3: ${transcriptResult.location}`);

    // Clean up temporary files
    cleanupTempFiles();

    console.log("Transcription complete!");

    // Print a preview of the transcript
    console.log("\nTranscript preview:");
    console.log("===================");
    console.log(transcript.substring(0, 500) + (transcript.length > 500 ? "..." : ""));
    console.log("===================");

    return {
      transcript: transcript,
      transcriptS3Key: transcriptS3Key,
      transcriptUrl: transcriptResult.location,
    };

  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Check if this script is being run directly
if (require.main === module) {
  // Run the main function
  transcribeVideo().catch(error => {
    console.error(`Unhandled error: ${error.message}`);
    process.exit(1);
  });
} else {
  // Export functions for use in other modules
  module.exports = {
    transcribeVideo,
    uploadToS3,
    downloadFromS3,
    uploadTextToS3,
  };
}
