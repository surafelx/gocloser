import fs from "fs";
import { exec, execSync } from "child_process";
import util from "util";
import path from "path";
import { SpeechClient } from "@google-cloud/speech";
import axios from "axios";
import os from "os";

const execPromise = util.promisify(exec);

// OpenAI API key for Whisper transcription
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Move API keys to environment variables
// Define the path where Google credentials will be stored temporarily
const GOOGLE_CREDENTIALS_PATH = path.join(os.tmpdir(), "google-creds.json");

// Construct the Google credentials object
const creds = {
  type: "service_account",
  project_id: "angular-argon-452914-f1",
  private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  token_uri: "https://oauth2.googleapis.com/token",
};

// Write the credentials to a temporary file
fs.writeFileSync(GOOGLE_CREDENTIALS_PATH, JSON.stringify(creds, null, 2));

// Set the environment variable for Google application credentials
process.env.GOOGLE_APPLICATION_CREDENTIALS = GOOGLE_CREDENTIALS_PATH;

// Now you can use the credentials for Google APIs
console.log('Google credentials written to:', GOOGLE_CREDENTIALS_PATH);
export const transcribeWithWhisper = async (
  audioInput: string | Buffer
): Promise<string> => {
  // Use FormData from the form-data package for Node.js
  const FormData = require('form-data');
  const formData = new FormData();

  try {
    // Handle both file paths and buffers
    if (typeof audioInput === 'string') {
      // It's a file path or URL
      if (audioInput.startsWith('http')) {
        // It's a URL, fetch the buffer
        console.log(`Fetching audio from URL for Whisper: ${audioInput}`);
        const buffer = await getCloudinaryBuffer(audioInput);

        // Create a temporary file name for the buffer
        const fileName = `whisper_audio_${Date.now()}.mp3`;

        // Append the buffer to the form
        formData.append("file", buffer, { filename: fileName });
      } else {
        // It's a local file path, check if it exists
        if (!fs.existsSync(audioInput)) {
          throw new Error(`Audio file not found for Whisper transcription: ${audioInput}`);
        }

        console.log(`Sending local audio file to Whisper API: ${audioInput}`);
        formData.append("file", fs.createReadStream(audioInput));
      }
    } else {
      // It's a buffer
      console.log(`Sending audio buffer to Whisper API (${audioInput.length} bytes)`);

      // Create a temporary file name for the buffer
      const fileName = `whisper_audio_${Date.now()}.mp3`;

      // Append the buffer to the form
      formData.append("file", audioInput, { filename: fileName });
    }

    // Add other required parameters
    formData.append("model", "whisper-1");
    formData.append("language", "en");

    // Send the request to the Whisper API
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

    if (!response.data || !response.data.text) {
      throw new Error("Invalid response from Whisper API");
    }

    return response.data.text;
  } catch (error: any) {
    console.error("Error in Whisper transcription:", error.message);
    throw new Error(`Whisper transcription failed: ${error.message}`);
  }
};

function getAudioDuration(audioFilePath: string): number {
  try {
    // Check if the file exists
    if (!fs.existsSync(audioFilePath)) {
      throw new Error(`Audio file not found for duration check: ${audioFilePath}`);
    }

    const cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioFilePath}"`;
    const output = execSync(cmd).toString().trim();

    if (!output) {
      throw new Error(`Could not determine audio duration for: ${audioFilePath}`);
    }

    return parseFloat(output);
  } catch (error: any) {
    console.error(`Error getting audio duration: ${error.message}`);
    // Return a default duration if we can't determine it
    return 30; // Default to 30 seconds
  }
}

function splitAudio(audioFilePath: string, chunkDurationSec = 50): string[] {
  try {
    // Check if the file exists
    if (!fs.existsSync(audioFilePath)) {
      throw new Error(`Audio file not found for splitting: ${audioFilePath}`);
    }

    const outputDir = path.join(process.cwd(), "tmp", "chunks");
    fs.mkdirSync(outputDir, { recursive: true });

    const duration = getAudioDuration(audioFilePath);
    const numChunks = Math.ceil(duration / chunkDurationSec);

    console.log(`Splitting audio file (${duration}s) into ${numChunks} chunks of ${chunkDurationSec}s each`);

    const chunkPaths: string[] = [];
    for (let i = 0; i < numChunks; i++) {
      const startTime = i * chunkDurationSec;
      const chunkPath = path.join(outputDir, `chunk-${i}-${Date.now()}.mp3`);

      console.log(`Creating chunk ${i+1}/${numChunks} at ${chunkPath}`);

      const cmd = `ffmpeg -y -i "${audioFilePath}" -ss ${startTime} -t ${chunkDurationSec} -acodec copy "${chunkPath}"`;
      execSync(cmd);

      // Verify the chunk was created
      if (fs.existsSync(chunkPath)) {
        chunkPaths.push(chunkPath);
      } else {
        console.error(`Failed to create chunk file: ${chunkPath}`);
      }
    }

    console.log(`Successfully split audio into ${chunkPaths.length} chunks`);
    return chunkPaths;
  } catch (error: any) {
    console.error(`Error splitting audio: ${error.message}`);
    // If splitting fails, return the original file as a single chunk
    return [audioFilePath];
  }
}

export const transcribe = async (audioFilePath: string): Promise<string> => {
  console.log(GOOGLE_CREDENTIALS_PATH, "Hello");

  // Check if the path is a URL
  const isUrl = audioFilePath.startsWith('http://') || audioFilePath.startsWith('https://');

  // For local files, check if they exist
  if (!isUrl && !fs.existsSync(audioFilePath)) {
    throw new Error(`Audio file not found: ${audioFilePath}`);
  }

  // For URLs, we can't reliably get the duration in a serverless environment
  // For local files, we can use ffprobe
  let duration = 0;
  let isLong = false;

  if (!isUrl) {
    try {
      duration = getAudioDuration(audioFilePath);
      isLong = duration > 60;
      console.log(`Audio duration: ${duration} seconds, isLong: ${isLong}`);
    } catch (error) {
      console.warn("Could not determine audio duration, assuming it's not long");
    }
  } else {
    console.log("Audio is a URL, cannot determine duration in serverless environment");
    // For URLs, we'll assume it's not long to avoid splitting
    isLong = false;
  }

  let transcript = "";

  try {
    // For Google Speech, we don't split URLs
    const filesToTranscribe = isLong && !isUrl
      ? splitAudio(audioFilePath)
      : [audioFilePath];

    console.log(`Transcribing ${filesToTranscribe.length} audio segments with Google Speech`);

    for (const chunkPath of filesToTranscribe) {
      console.log(`Transcribing chunk with Google Speech: ${chunkPath}`);
      const chunkTranscript = await transcribeWithGoogleSpeech(chunkPath);
      transcript += chunkTranscript + "\n";

      // Clean up chunk files if they're local temporary files
      if (!isUrl && chunkPath !== audioFilePath) {
        try {
          fs.unlinkSync(chunkPath);
          console.log(`Deleted chunk file: ${chunkPath}`);
        } catch (error) {
          console.error(`Error deleting chunk file ${chunkPath}:`, error);
        }
      }
    }

    console.log("Transcription successful with Google Speech.");
    return transcript.trim();
  } catch (error: any) {
    console.error("Google Speech transcription failed:", error);
    throw new Error(`Transcription failed: ${error.message}`);
  }
};

export const transcribeWithGoogleSpeech = async (
  audioInput: string | Buffer
): Promise<string> => {
  const client = new SpeechClient({
    keyFilename: GOOGLE_CREDENTIALS_PATH,
  });

  let audioBytes: string;

  // Handle both file paths and URLs
  if (typeof audioInput === 'string') {
    // Check if it's a URL
    if (audioInput.startsWith('http')) {
      console.log(`Fetching audio from URL for Google Speech: ${audioInput}`);
      try {
        // Fetch the file directly using axios
        const response = await axios.get(audioInput, {
          responseType: 'arraybuffer'
        });

        if (!response.data) {
          throw new Error(`Empty response from URL: ${audioInput}`);
        }

        console.log(`Successfully fetched ${response.data.byteLength} bytes from URL`);
        const buffer = Buffer.from(response.data);
        audioBytes = buffer.toString("base64");
      } catch (error: any) {
        console.error("Error fetching audio from URL:", error.message);
        throw new Error(`Failed to fetch audio from URL: ${error.message}`);
      }
    } else {
      // It's a local file path
      if (!fs.existsSync(audioInput)) {
        throw new Error(`Audio file not found for Google Speech: ${audioInput}`);
      }

      console.log(`Reading local audio file for Google Speech: ${audioInput}`);
      const file = fs.readFileSync(audioInput);
      audioBytes = file.toString("base64");
    }
  } else {
    // It's already a buffer
    console.log(`Using provided buffer for Google Speech (${audioInput.length} bytes)`);
    audioBytes = audioInput.toString("base64");
  }

  const audio = {
    content: audioBytes,
  };

  // Use the correct encoding type from Google's Speech API
  const config = {
    encoding: "MP3" as any, // Using 'any' to bypass type checking for now
    sampleRateHertz: 16000,
    languageCode: "en-US",
    enableAutomaticPunctuation: true,
  };

  const request = {
    audio,
    config,
  };

  try {
    console.log("Sending request to Google Speech API");
    const [response] = await client.recognize(request);

    if (!response.results?.length) {
      throw new Error("No transcription results received");
    }

    console.log(`Received ${response.results.length} results from Google Speech API`);

    return response.results
      .map((result: any) => result.alternatives?.[0]?.transcript || "")
      .join("\n");
  } catch (error: any) {
    console.error("Google Speech API error:", error.message);
    throw new Error(`Google Speech transcription failed: ${error.message}`);
  }
};

// This function is kept for compatibility but is no longer used
// We're now using the S3 version directly
export const extractAudioFromVideo = async (
  videoPath: string
): Promise<string> => {
  console.log("extractAudioFromVideo is deprecated, use S3 version instead");
  return videoPath;
};
