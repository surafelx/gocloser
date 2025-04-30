import fs from "fs";
import { exec, execSync } from "child_process";
import util from "util";
import path from "path";
import { SpeechClient } from "@google-cloud/speech";
import axios from "axios";
import os from "os";

const execPromise = util.promisify(exec);

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
  const formData = new FormData();
  formData.append("file", fs.createReadStream(audioFilePath));
  formData.append("model", "whisper-1");
  formData.append("language", "en");

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
};

function getAudioDuration(audioFilePath: string): number {
  const cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioFilePath}"`;
  return parseFloat(execSync(cmd).toString().trim());
}

function splitAudio(audioFilePath: string, chunkDurationSec = 50): string[] {
  const outputDir = path.join(process.cwd(), "tmp", "chunks");
  fs.mkdirSync(outputDir, { recursive: true });

  const duration = getAudioDuration(audioFilePath);
  const numChunks = Math.ceil(duration / chunkDurationSec);

  const chunkPaths: string[] = [];
  for (let i = 0; i < numChunks; i++) {
    const startTime = i * chunkDurationSec;
    const chunkPath = path.join(outputDir, `chunk-${i}.mp3`);
    const cmd = `ffmpeg -y -i "${audioFilePath}" -ss ${startTime} -t ${chunkDurationSec} -acodec copy "${chunkPath}"`;
    execSync(cmd);
    chunkPaths.push(chunkPath);
  }
  return chunkPaths;
}

export const transcribe = async (audioFilePath: string): Promise<string> => {
  console.log(GOOGLE_CREDENTIALS_PATH, "Hello");
  if (!fs.existsSync(audioFilePath)) {
    throw new Error(`Audio file not found: ${audioFilePath}`);
  }

  const duration = getAudioDuration(audioFilePath);
  const isLong = duration > 60;
  let transcript = "";

  try {
    const filesToTranscribe = isLong
      ? splitAudio(audioFilePath)
      : [audioFilePath];
    for (const chunkPath of filesToTranscribe) {
      const chunkTranscript = await transcribeWithWhisper(chunkPath);
      transcript += chunkTranscript + "\n";

      // Clean up chunk files
      if (chunkPath !== audioFilePath) {
        try {
          fs.unlinkSync(chunkPath);
        } catch (error) {
          console.error(`Error deleting chunk file ${chunkPath}:`, error);
        }
      }
    }

    console.log("Transcription successful with OpenAI Whisper.");
    return transcript.trim();
  } catch (err) {
    console.error("Whisper failed. Falling back to Google Speech.", err);
    try {
      const filesToTranscribe = isLong
        ? splitAudio(audioFilePath)
        : [audioFilePath];
      for (const chunkPath of filesToTranscribe) {
        const chunkTranscript = await transcribeWithGoogleSpeech(chunkPath);
        transcript += chunkTranscript + "\n";

        // Clean up chunk files
        if (chunkPath !== audioFilePath) {
          try {
            fs.unlinkSync(chunkPath);
          } catch (error) {
            console.error(`Error deleting chunk file ${chunkPath}:`, error);
          }
        }
      }

      console.log("Transcription successful with Google Speech.");
      return transcript.trim();
    } catch (error) {
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

  const config = {
    encoding: "MP3" as const,
    sampleRateHertz: 16000,
    languageCode: "en-US",
    enableAutomaticPunctuation: true,
  };

  const request = {
    audio,
    config,
  };

  const [response] = await client.recognize(request);
  if (!response.results?.length) {
    throw new Error("No transcription results received");
  }

  return response.results
    .map((result) => result.alternatives?.[0]?.transcript || "")
    .join("\n");
};

export const extractAudioFromVideo = async (
  videoPath: string
): Promise<string> => {
  try {
    const audioPath = videoPath.replace(/\.[^/.]+$/, ".mp3");
    console.log(`Extracting audio from ${videoPath} to ${audioPath}`);
    await execPromise(
      `ffmpeg -i "${videoPath}" -q:a 0 -map a "${audioPath}" -y`
    );
    return audioPath;
  } catch (error) {
    throw new Error(
      `Failed to extract audio from video file: ${error.message}`
    );
  }
};
