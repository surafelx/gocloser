// whisper-transcribe.js

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const FormData = require("form-data");
const axios = require("axios");
const dotenv = require("dotenv");
const speech = require("@google-cloud/speech");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

// Config
const OPENAI_API_KEY =
  "k-proj-2mzmdwRmlYwXfKNzDgXQnS-RSRCYkw-cQ0ulPcdrKIZSc6Lw81-VuvnefV4HmrMKuXCUksYPOQT3BlbkFJbLdzR8fpT8G3VmNSF-_DlkuVvgZw1gGVkoxZKZy-aCTROIQOz-aylqV-qsj_OSQWsprT6-JygA";
const GOOGLE_CREDENTIALS_PATH =
  "/Users/admin/Desktop/aurizzm/closer/salesaibot/angular-argon-452914-f1-17bffe088833.json";

function getAudioDuration(audioFilePath) {
  const cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioFilePath}"`;
  return parseFloat(execSync(cmd).toString().trim());
}

function splitAudio(audioFilePath, chunkDurationSec = 50) {
  const outputDir = path.join(__dirname, "chunks");
  fs.mkdirSync(outputDir, { recursive: true });

  const duration = getAudioDuration(audioFilePath);
  const numChunks = Math.ceil(duration / chunkDurationSec);

  const chunkPaths = [];
  for (let i = 0; i < numChunks; i++) {
    const startTime = i * chunkDurationSec;
    const chunkPath = path.join(outputDir, `chunk-${i}.mp3`);
    const cmd = `ffmpeg -y -i "${audioFilePath}" -ss ${startTime} -t ${chunkDurationSec} -acodec copy "${chunkPath}"`;
    execSync(cmd);
    chunkPaths.push(chunkPath);
  }
  return chunkPaths;
}

async function transcribeWithWhisper(audioFilePath) {
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
}

async function transcribeWithGoogleSpeech(audioFilePath) {
  const client = new speech.SpeechClient({
    keyFilename: GOOGLE_CREDENTIALS_PATH,
  });

  const file = fs.readFileSync(audioFilePath);
  const audioBytes = file.toString("base64");

  const audio = { content: audioBytes };
  const config = {
    encoding: "MP3",
    sampleRateHertz: 16000,
    languageCode: "en-US",
    enableAutomaticPunctuation: true,
  };

  const request = { audio, config };
  const [response] = await client.recognize(request);
  return response.results.map((r) => r.alternatives[0].transcript).join("\n");
}

async function main() {
  const inputFile = process.argv[2] || path.join(__dirname, "audio.mp3");
  if (!fs.existsSync(inputFile)) {
    console.error("Audio file not found:", inputFile);
    process.exit(1);
  }

  const duration = getAudioDuration(inputFile);
  const isLong = duration > 60;

  let transcript = "";

  try {
    const filesToTranscribe = isLong ? splitAudio(inputFile, 50) : [inputFile];
    for (const chunkPath of filesToTranscribe) {
      const chunkTranscript = await transcribeWithWhisper(chunkPath);
      transcript += chunkTranscript + "\n";
    }

    fs.writeFileSync(
      path.join(__dirname, "whisper-transcript.txt"),
      transcript
    );
    console.log("Transcription successful with OpenAI Whisper.");
  } catch (err) {
    console.error("Whisper failed. Falling back to Google Speech.");
    try {
      const filesToTranscribe = isLong
        ? splitAudio(inputFile, 50)
        : [inputFile];
      for (const chunkPath of filesToTranscribe) {
        const chunkTranscript = await transcribeWithGoogleSpeech(chunkPath);
        transcript += chunkTranscript + "\n";
      }

      fs.writeFileSync(
        path.join(__dirname, "google-transcript.txt"),
        transcript
      );
      console.log("Transcription successful with Google Speech.");
    } catch (error) {
      console.error("All transcription methods failed:", error.message);
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
