// lib/openai.ts
import FormData from "form-data";
import fs from "fs";
import path from "path";
import axios from "axios";
import { execSync } from "child_process";

// Function to get audio duration using ffprobe
export function getAudioDuration(audioFilePath: string): number {
  const cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioFilePath}"`;
  return parseFloat(execSync(cmd).toString().trim());
}

// Function to split audio into smaller chunks for better transcription
export function splitAudio(audioFilePath: string, chunkDurationSec = 50): string[] {
  const outputDir = path.join(process.cwd(), "tmp", "chunks");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const duration = getAudioDuration(audioFilePath);
  const numChunks = Math.ceil(duration / chunkDurationSec);

  const chunkPaths = [];
  for (let i = 0; i < numChunks; i++) {
    const startTime = i * chunkDurationSec;
    const chunkPath = path.join(outputDir, `chunk-${i}-${path.basename(audioFilePath)}`);
    const cmd = `ffmpeg -y -i "${audioFilePath}" -ss ${startTime} -t ${chunkDurationSec} -acodec copy "${chunkPath}"`;
    execSync(cmd);
    chunkPaths.push(chunkPath);
  }
  return chunkPaths;
}

export async function transcribeAudio(filePath: string): Promise<string> {
  // Check if the file is longer than 60 seconds
  const duration = getAudioDuration(filePath);
  const isLong = duration > 60;

  let transcript = "";

  // If the file is long, split it into smaller chunks
  const filesToTranscribe = isLong ? splitAudio(filePath, 50) : [filePath];

  // Transcribe each chunk
  for (const chunkPath of filesToTranscribe) {
    const formData = new FormData();
    formData.append("file", fs.createReadStream(chunkPath));
    formData.append("model", "whisper-1");
    formData.append("language", "en");

    const response = await axios.post(
      "https://api.openai.com/v1/audio/transcriptions",
      formData,
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          ...formData.getHeaders(),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    transcript += response.data.text + "\n";

    // Clean up chunk file if it's not the original file
    if (isLong && chunkPath !== filePath) {
      try {
        fs.unlinkSync(chunkPath);
      } catch (error) {
        console.error(`Error deleting chunk file ${chunkPath}:`, error);
      }
    }
  }

  return transcript.trim();
}
