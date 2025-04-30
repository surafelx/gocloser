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
  audioFilePath: string
): Promise<string> => {
  // Check if the file exists
  if (!fs.existsSync(audioFilePath)) {
    throw new Error(`Audio file not found for Whisper transcription: ${audioFilePath}`);
  }

  // Use FormData from the form-data package for Node.js
  const FormData = require('form-data');
  const formData = new FormData();

  try {
    formData.append("file", fs.createReadStream(audioFilePath));
    formData.append("model", "whisper-1");
    formData.append("language", "en");

    console.log(`Sending audio file to Whisper API: ${audioFilePath}`);

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

  // If it's a URL, we need to download it first
  let localAudioPath = audioFilePath;

  if (isUrl) {
    console.log(`Audio path is a URL: ${audioFilePath}`);
    try {
      // Download the audio file to a temporary location
      const tempDir = path.join(os.tmpdir(), 'audio_processing');
      fs.mkdirSync(tempDir, { recursive: true });

      const tempAudioPath = path.join(tempDir, `temp_audio_${Date.now()}.mp3`);
      console.log(`Downloading audio from ${audioFilePath} to ${tempAudioPath}`);

      // Download the audio file
      const response = await axios({
        method: 'get',
        url: audioFilePath,
        responseType: 'stream'
      });

      const writer = fs.createWriteStream(tempAudioPath);
      response.data.pipe(writer);

      await new Promise<void>((resolve, reject) => {
        writer.on('finish', () => resolve());
        writer.on('error', (err) => reject(err));
      });

      localAudioPath = tempAudioPath;
      console.log(`Audio downloaded to: ${localAudioPath}`);
    } catch (error: any) {
      throw new Error(`Failed to download audio file: ${error.message}`);
    }
  } else {
    // For local files, check if they exist
    if (!fs.existsSync(audioFilePath)) {
      throw new Error(`Audio file not found: ${audioFilePath}`);
    }
  }

  const duration = getAudioDuration(localAudioPath);
  const isLong = duration > 60;
  let transcript = "";

  try {
    const filesToTranscribe = isLong
      ? splitAudio(localAudioPath)
      : [localAudioPath];
    for (const chunkPath of filesToTranscribe) {
      const chunkTranscript = await transcribeWithWhisper(chunkPath);
      transcript += chunkTranscript + "\n";

      // Clean up chunk files
      if (chunkPath !== localAudioPath) {
        try {
          fs.unlinkSync(chunkPath);
        } catch (error) {
          console.error(`Error deleting chunk file ${chunkPath}:`, error);
        }
      }
    }

    console.log("Transcription successful with OpenAI Whisper.");

    // Clean up the downloaded file if it was a URL
    if (isUrl && localAudioPath !== audioFilePath) {
      try {
        fs.unlinkSync(localAudioPath);
        console.log(`Deleted temporary audio file: ${localAudioPath}`);
      } catch (error) {
        console.error(`Error deleting temporary audio file: ${localAudioPath}`, error);
      }
    }

    return transcript.trim();
  } catch (err) {
    console.error("Whisper failed. Falling back to Google Speech.", err);
    try {
      const filesToTranscribe = isLong
        ? splitAudio(localAudioPath)
        : [localAudioPath];
      for (const chunkPath of filesToTranscribe) {
        const chunkTranscript = await transcribeWithGoogleSpeech(chunkPath);
        transcript += chunkTranscript + "\n";

        // Clean up chunk files
        if (chunkPath !== localAudioPath) {
          try {
            fs.unlinkSync(chunkPath);
          } catch (error) {
            console.error(`Error deleting chunk file ${chunkPath}:`, error);
          }
        }
      }

      console.log("Transcription successful with Google Speech.");

      // Clean up the downloaded file if it was a URL
      if (isUrl && localAudioPath !== audioFilePath) {
        try {
          fs.unlinkSync(localAudioPath);
          console.log(`Deleted temporary audio file: ${localAudioPath}`);
        } catch (error) {
          console.error(`Error deleting temporary audio file: ${localAudioPath}`, error);
        }
      }

      return transcript.trim();
    } catch (error: any) {
      // Clean up the downloaded file if it was a URL, even if transcription failed
      if (isUrl && localAudioPath !== audioFilePath) {
        try {
          fs.unlinkSync(localAudioPath);
          console.log(`Deleted temporary audio file after error: ${localAudioPath}`);
        } catch (cleanupError) {
          console.error(`Error deleting temporary audio file: ${localAudioPath}`, cleanupError);
        }
      }

      throw new Error(`Transcription failed: ${error.message}`);
    }
  }
};

export const transcribeWithGoogleSpeech = async (
  audioFilePath: string
): Promise<string> => {
  const client = new SpeechClient({
    keyFilename: GOOGLE_CREDENTIALS_PATH,
  });

  const file = fs.readFileSync(audioFilePath);
  const audioBytes = file.toString("base64");

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
    const [response] = await client.recognize(request);
    if (!response.results?.length) {
      throw new Error("No transcription results received");
    }

    return response.results
      .map((result: any) => result.alternatives?.[0]?.transcript || "")
      .join("\n");
  } catch (error: any) {
    console.error("Google Speech API error:", error.message);
    throw new Error(`Google Speech transcription failed: ${error.message}`);
  }
};

export const extractAudioFromVideo = async (
  videoPath: string
): Promise<string> => {
  try {
    // Check if the videoPath is a URL (Cloudinary or other)
    const isUrl = videoPath.startsWith('http://') || videoPath.startsWith('https://');

    if (isUrl) {
      // For Cloudinary URLs, we can use their URL transformation API to get audio
      // Example: https://res.cloudinary.com/demo/video/upload/v1234/sample.mp4
      // becomes: https://res.cloudinary.com/demo/video/upload/f_mp3/v1234/sample.mp4

      // Check if it's a Cloudinary URL
      if (videoPath.includes('cloudinary.com')) {
        // Insert f_mp3 transformation before the version part of the URL
        const audioUrl = videoPath.replace(/\/upload\//, '/upload/f_mp3/');
        console.log(`Using Cloudinary transformation for audio: ${audioUrl}`);
        return audioUrl;
      } else {
        // For non-Cloudinary URLs, download the video first
        const tempDir = path.join(os.tmpdir(), 'video_processing');
        fs.mkdirSync(tempDir, { recursive: true });

        const tempVideoPath = path.join(tempDir, `temp_video_${Date.now()}.mp4`);
        const tempAudioPath = path.join(tempDir, `temp_audio_${Date.now()}.mp3`);

        console.log(`Downloading video from ${videoPath} to ${tempVideoPath}`);

        // Download the video file
        const response = await axios({
          method: 'get',
          url: videoPath,
          responseType: 'stream'
        });

        const writer = fs.createWriteStream(tempVideoPath);
        response.data.pipe(writer);

        await new Promise<void>((resolve, reject) => {
          writer.on('finish', () => resolve());
          writer.on('error', (err) => reject(err));
        });

        // Extract audio from the downloaded video
        console.log(`Extracting audio from ${tempVideoPath} to ${tempAudioPath}`);
        await execPromise(
          `ffmpeg -i "${tempVideoPath}" -q:a 0 -map a "${tempAudioPath}" -y`
        );

        // Clean up the temporary video file
        try {
          fs.unlinkSync(tempVideoPath);
        } catch (err: any) {
          console.error(`Error deleting temporary video file: ${err.message}`);
        }

        return tempAudioPath;
      }
    } else {
      // Handle local file paths as before
      const audioPath = videoPath.replace(/\.[^/.]+$/, ".mp3");
      console.log(`Extracting audio from ${videoPath} to ${audioPath}`);
      await execPromise(
        `ffmpeg -i "${videoPath}" -q:a 0 -map a "${audioPath}" -y`
      );
      return audioPath;
    }
  } catch (error: any) {
    throw new Error(
      `Failed to extract audio from video file: ${error.message}`
    );
  }
};
