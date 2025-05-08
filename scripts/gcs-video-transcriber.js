#!/usr/bin/env node
// gcs-video-transcriber.js
// A serverless-friendly script to process and transcribe videos using Google Cloud Storage
// Optimized for environments with limited disk access and execution time

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const https = require("https");
const FormData = require("form-data");
const axios = require("axios");
const dotenv = require("dotenv");
const { SpeechClient } = require("@google-cloud/speech");
const { Storage } = require("@google-cloud/storage");
const os = require("os");
const { v4: uuidv4 } = require("uuid");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

// Config
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GOOGLE_CREDENTIALS_PATH = path.join(os.tmpdir(), `google-creds-${uuidv4()}.json`);
const TEMP_DIR = path.join(os.tmpdir(), `transcribe-${uuidv4()}`);

// Google Cloud Storage Configuration
const GCS_BUCKET = process.env.GCS_BUCKET;
const GOOGLE_PROJECT_ID = process.env.GOOGLE_PROJECT_ID || "angular-argon-452914-f1";
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;

// Sample video URL for downloading
const SAMPLE_VIDEO_URL = "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4";

// Check for required GCS environment variables
if (!GCS_BUCKET || !GOOGLE_PRIVATE_KEY || !GOOGLE_CLIENT_EMAIL) {
  console.error("Error: Google Cloud Storage credentials are not properly configured");
  console.error("Please set GCS_BUCKET, GOOGLE_PROJECT_ID, GOOGLE_PRIVATE_KEY, and GOOGLE_CLIENT_EMAIL in your .env file");
  process.exit(1);
}

// Create temp directory with unique name to avoid conflicts in serverless environments
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
  console.log(`Created temporary directory: ${TEMP_DIR}`);
}

// Construct the Google credentials object
const creds = {
  type: "service_account",
  project_id: GOOGLE_PROJECT_ID,
  private_key: GOOGLE_PRIVATE_KEY,
  client_email: GOOGLE_CLIENT_EMAIL,
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

// Initialize Google Cloud Storage client
const storage = new Storage({
  keyFilename: GOOGLE_CREDENTIALS_PATH
});

// Get the GCS bucket
const bucket = storage.bucket(GCS_BUCKET);

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

// Function to check if a file exists in GCS
async function checkGCSFileExists(filename) {
  try {
    const [exists] = await bucket.file(filename).exists();
    return exists;
  } catch (error) {
    console.error(`Error checking if file exists in GCS: ${error.message}`);
    return false;
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

// Function to upload a file to GCS - optimized for serverless
async function uploadToGCS(localPath, gcsPath, contentType = "application/octet-stream") {
  console.log(`Uploading to GCS: ${localPath} to gs://${GCS_BUCKET}/${gcsPath}`);
  
  try {
    const options = {
      destination: gcsPath,
      metadata: {
        contentType: contentType,
      },
      resumable: false // Better for serverless environments with smaller files
    };
    
    await bucket.upload(localPath, options);
    console.log(`Successfully uploaded: ${gcsPath}`);
    
    // Make the file publicly accessible
    // await bucket.file(gcsPath).makePublic();
    
    const publicUrl = `https://storage.googleapis.com/${GCS_BUCKET}/${gcsPath}`;
    
    return {
      path: gcsPath,
      publicUrl: publicUrl
    };
  } catch (error) {
    console.error(`Error uploading to GCS: ${error.message}`);
    throw error;
  }
}

// Function to download a file from GCS - optimized for serverless
async function downloadFromGCS(gcsPath, localPath) {
  console.log(`Downloading from GCS: gs://${GCS_BUCKET}/${gcsPath} to ${localPath}`);
  
  try {
    // First check if the file exists
    const exists = await checkGCSFileExists(gcsPath);
    if (!exists) {
      throw new Error(`The specified path does not exist: ${gcsPath}`);
    }
    
    const options = {
      destination: localPath,
    };
    
    await bucket.file(gcsPath).download(options);
    console.log(`Successfully downloaded: ${gcsPath}`);
    
    return localPath;
  } catch (error) {
    console.error(`Error downloading from GCS: ${error.message}`);
    throw error;
  }
}

// Function to upload text directly to GCS - optimized for serverless
async function uploadTextToGCS(text, gcsPath) {
  console.log(`Uploading text to GCS: gs://${GCS_BUCKET}/${gcsPath}`);
  
  try {
    const file = bucket.file(gcsPath);
    await file.save(text, {
      contentType: "text/plain",
      resumable: false
    });
    
    // Make the file publicly accessible
    await file.makePublic();
    
    const publicUrl = `https://storage.googleapis.com/${GCS_BUCKET}/${gcsPath}`;
    console.log(`Successfully uploaded text: ${gcsPath}`);
    
    return {
      path: gcsPath,
      publicUrl: publicUrl
    };
  } catch (error) {
    console.error(`Error uploading text to GCS: ${error.message}`);
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

// Function to create a Cloud Function request for audio extraction
async function requestCloudAudioExtraction(videoGcsPath) {
  console.log(`Requesting cloud audio extraction for: gs://${GCS_BUCKET}/${videoGcsPath}`);
  
  // Option 1: Call a deployed Cloud Function or Cloud Run service
  try {
    const cloudFunctionUrl = process.env.AUDIO_EXTRACTION_FUNCTION_URL;
    
    if (!cloudFunctionUrl) {
      throw new Error("AUDIO_EXTRACTION_FUNCTION_URL environment variable not set");
    }
    
    const response = await axios.post(cloudFunctionUrl, {
      bucket: GCS_BUCKET,
      videoPath: videoGcsPath,
      projectId: GOOGLE_PROJECT_ID
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 120000 // 2 minute timeout
    });
    
    if (response.status !== 200) {
      throw new Error(`Cloud Function returned status ${response.status}`);
    }
    
    console.log("Cloud audio extraction successful");
    return {
      gcsPath: response.data.audioGcsPath
    };
  } catch (error) {
    console.error(`Error calling audio extraction cloud function: ${error.message}`);
    
    // Option 2: Use Google Cloud Video Intelligence API (if available)
    try {
      console.log("Attempting to use Video Intelligence API for audio extraction...");
      // This would be implemented with the Video Intelligence API
      // For now, we'll throw an error to indicate this isn't implemented yet
      throw new Error("Video Intelligence API implementation not available");
    } catch (videoIntelError) {
      console.error(`Video Intelligence API error: ${videoIntelError.message}`);
      
      // Option 3: Use Google Cloud Transcoder API (if available)
      try {
        console.log("Attempting to use Transcoder API for audio extraction...");
        // This would be implemented with the Transcoder API
        // For now, we'll throw an error to indicate this isn't implemented yet
        throw new Error("Transcoder API implementation not available");
      } catch (transcoderError) {
        console.error(`Transcoder API error: ${transcoderError.message}`);
        throw new Error("All cloud audio extraction methods failed");
      }
    }
  }
}

// Function to split audio into chunks - optimized for serverless
async function splitAudio(audioLocalPath, audioGcsPath, chunkDurationSec = 30) {
  const audioName = path.basename(audioGcsPath, path.extname(audioGcsPath));
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
    const chunkGcsPath = `chunks/${audioName}/chunk-${i}-${Date.now()}.mp3`;
    
    // Use lower quality for faster processing in serverless
    const cmd = `ffmpeg -y -i "${audioLocalPath}" -ss ${startTime} -t ${adjustedChunkDuration} -acodec mp3 -ab 64k -ac 1 "${chunkLocalPath}"`;
    execSync(cmd);
    
    // Upload chunk to GCS
    await uploadToGCS(chunkLocalPath, chunkGcsPath, "audio/mp3");
    
    chunks.push({
      localPath: chunkLocalPath,
      gcsPath: chunkGcsPath,
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

// Add this function to transcribe long audio files directly from GCS
async function transcribeGCSAudioWithLongRunningRecognize(gcsPath) {
  console.log(`Transcribing GCS audio with LongRunningRecognize: gs://${GCS_BUCKET}/${gcsPath}`);
  
  const client = new SpeechClient({
    keyFilename: GOOGLE_CREDENTIALS_PATH,
  });

  // Create the audio source pointing directly to the GCS file
  const audio = {
    uri: `gs://${GCS_BUCKET}/${gcsPath}`
  };
  
  // Configure the request
  const config = {
    encoding: "MP3",
    sampleRateHertz: 16000,
    languageCode: "en-US",
    enableAutomaticPunctuation: true,
    model: "video",
    useEnhanced: true,
    // Add audio channel count for better accuracy
    audioChannelCount: 1,
  };

  const request = {
    audio: audio,
    config: config,
  };
  
  try {
    console.log("Starting long-running transcription job...");
    
    // Start the asynchronous recognition
    const [operation] = await client.longRunningRecognize(request);
    
    // Wait for operation to complete
    console.log("Waiting for operation to complete... This may take several minutes for long files.");
    const [response] = await operation.promise();
    
    console.log(`Received ${response.results.length} results from long-running transcription`);
    
    // Combine all transcription results
    return response.results
      .map(result => result.alternatives[0].transcript)
      .join("\n");
  } catch (error) {
    console.error(`Google Speech LongRunningRecognize error: ${error.message}`);
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

// Fully serverless main function with no local file dependencies
async function main() {
  console.log("=== GCS Video Transcriber (Fully Serverless) ===");
  console.log(`Started at: ${new Date().toISOString()}`);
  
  try {
    // Step 1: Get the video GCS path
    let videoGcsPath;
    
    const inputArg = process.argv[2];
    
    if (!inputArg) {
      console.error("Error: No input provided");
      console.error("Usage: node gcs-video-transcriber.js [gs://bucket/path | gcs-path]");
      process.exit(1);
    } else if (inputArg.startsWith("gs://")) {
      // GCS URI provided
      const gcsUri = inputArg.replace("gs://", "");
      const parts = gcsUri.split("/");
      const bucketName = parts[0];
      
      if (bucketName !== GCS_BUCKET) {
        console.error(`Error: Specified bucket (${bucketName}) does not match configured bucket (${GCS_BUCKET})`);
        process.exit(1);
      }
      
      videoGcsPath = parts.slice(1).join("/");
    } else if (inputArg.includes("/")) {
      // Assume it's a GCS path
      videoGcsPath = inputArg;
    } else {
      console.error(`Error: Invalid input: ${inputArg}`);
      console.error("Usage: node gcs-video-transcriber.js [gs://bucket/path | gcs-path]");
      process.exit(1);
    }
    
    // Verify the video exists in GCS
    const videoExists = await checkGCSFileExists(videoGcsPath);
    if (!videoExists) {
      console.error(`Error: Video not found in GCS: gs://${GCS_BUCKET}/${videoGcsPath}`);
      process.exit(1);
    }
    
    console.log(`Processing video from GCS: gs://${GCS_BUCKET}/${videoGcsPath}`);
    
    // Step 2: Extract audio from video using cloud services
    console.log("Requesting cloud audio extraction...");
    const audio = await requestCloudAudioExtraction(videoGcsPath);
    console.log(`Audio extracted to GCS: ${audio.gcsPath}`);
    
    // Step 3: Transcribe audio directly from GCS
    console.log("Transcribing audio with Google Speech-to-Text...");
    let transcript = "";
    
    try {
      // Use longRunningRecognize for cloud-based processing
      transcript = await transcribeGCSAudioWithLongRunningRecognize(audio.gcsPath);
      console.log("Google Speech-to-Text transcription successful!");
    } catch (googleError) {
      console.error("Google Speech-to-Text failed. Attempting to use OpenAI Whisper API...");
      console.error(`Google Speech error: ${googleError.message}`);
      
      if (!OPENAI_API_KEY) {
        console.error("Error: OPENAI_API_KEY is not set. Cannot use Whisper API.");
        throw new Error("OPENAI_API_KEY is not set");
      }
      
      try {
        // Call a deployed Cloud Function for Whisper transcription
        const whisperFunctionUrl = process.env.WHISPER_TRANSCRIPTION_FUNCTION_URL;
        
        if (!whisperFunctionUrl) {
          throw new Error("WHISPER_TRANSCRIPTION_FUNCTION_URL environment variable not set");
        }
        
        const response = await axios.post(whisperFunctionUrl, {
          bucket: GCS_BUCKET,
          audioPath: audio.gcsPath,
          apiKey: OPENAI_API_KEY
        }, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 300000 // 5 minute timeout
        });
        
        if (response.status !== 200) {
          throw new Error(`Whisper Cloud Function returned status ${response.status}`);
        }
        
        transcript = response.data.transcript;
        console.log("OpenAI Whisper API transcription successful!");
      } catch (whisperError) {
        console.error(`Whisper API error: ${whisperError.message}`);
        throw new Error("All transcription methods failed");
      }
    }
    
    // Step 4: Upload transcript to GCS
    const videoName = path.basename(videoGcsPath, path.extname(videoGcsPath));
    const transcriptGcsPath = `transcripts/${videoName}_transcript.txt`;
    
    const transcriptResult = await uploadTextToGCS(transcript, transcriptGcsPath);
    console.log(`Transcription saved to GCS: ${transcriptResult.publicUrl}`);
    
    console.log("\n=== Transcription Complete ===");
    console.log(`Video: gs://${GCS_BUCKET}/${videoGcsPath}`);
    console.log(`Transcript: gs://${GCS_BUCKET}/${transcriptGcsPath}`);
    console.log(`Transcript URL: ${transcriptResult.publicUrl}`);
    
    // Print a preview of the transcript
    console.log("\nTranscript preview:");
    console.log("===================");
    console.log(transcript.substring(0, 500) + (transcript.length > 500 ? "..." : ""));
    console.log("===================");
    
    return {
      videoGcsPath,
      transcriptGcsPath,
      transcriptUrl: transcriptResult.publicUrl,
      transcript: transcript.substring(0, 500) + (transcript.length > 500 ? "..." : "")
    };
    
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
