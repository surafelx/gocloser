import fs from "fs";
import { execSync } from "child_process";
import path from "path";
import { SpeechClient } from "@google-cloud/speech";
import axios from "axios";
import os from "os";
import { getByteRangeFromS3Url, getContentLengthFromS3Url } from "./s3";
import { VideoIntelligenceServiceClient, protos } from '@google-cloud/video-intelligence';

// Function to check if a buffer is a WAV file and get its sample rate
function isWavBuffer(buffer: Buffer): { isWav: boolean; sampleRate: number | null } {
  try {
    // Check if the buffer has the WAV header
    if (buffer.length < 44) {
      return { isWav: false, sampleRate: null };
    }

    // Check for RIFF header
    if (buffer.toString('ascii', 0, 4) !== 'RIFF') {
      return { isWav: false, sampleRate: null };
    }

    // Check for WAVE format
    if (buffer.toString('ascii', 8, 12) !== 'WAVE') {
      return { isWav: false, sampleRate: null };
    }

    // Get the sample rate from the header (bytes 24-27)
    const sampleRate = buffer.readUInt32LE(24);

    console.log(`Detected WAV file with sample rate: ${sampleRate} Hz`);

    return { isWav: true, sampleRate };
  } catch (error) {
    console.error("Error checking WAV buffer:", error);
    return { isWav: false, sampleRate: null };
  }
}

// Promisified exec for async operations
// const execPromise = util.promisify(exec);

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
        // Use axios to fetch the buffer
        const response = await axios.get(audioInput, {
          responseType: 'arraybuffer',
          timeout: 30000
        });
        const buffer = Buffer.from(response.data);

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
  // Always use 50 seconds as the chunk duration for consistency
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

// Add these constants for GCS operations
// const GCS_BUCKET = process.env.GCS_BUCKET || '';
const GOOGLE_PROJECT_ID = process.env.GOOGLE_PROJECT_ID || '';
const AUDIO_EXTRACTION_FUNCTION_URL = process.env.AUDIO_EXTRACTION_FUNCTION_URL || '';
// const WHISPER_TRANSCRIPTION_FUNCTION_URL = process.env.WHISPER_TRANSCRIPTION_FUNCTION_URL || '';

// Function to get GCS bucket and path from URL
const parseGcsUrl = (url: string): { bucket: string, path: string } => {
  if (url.startsWith('gs://')) {
    const parts = url.replace('gs://', '').split('/');
    return {
      bucket: parts[0],
      path: parts.slice(1).join('/')
    };
  } else if (url.startsWith('https://storage.googleapis.com/')) {
    const parts = url.replace('https://storage.googleapis.com/', '').split('/');
    return {
      bucket: parts[0],
      path: parts.slice(1).join('/')
    };
  }
  throw new Error('Not a valid GCS URL');
};

// Function to request cloud audio extraction for videos
const requestCloudAudioExtraction = async (videoUrl: string): Promise<string> => {
  console.log(`Requesting cloud audio extraction for: ${videoUrl}`);

  if (!AUDIO_EXTRACTION_FUNCTION_URL) {
    throw new Error("AUDIO_EXTRACTION_FUNCTION_URL environment variable not set");
  }

  try {
    // Parse the GCS URL to get bucket and path
    const { bucket, path } = parseGcsUrl(videoUrl);

    // Call the cloud function to extract audio
    const response = await axios.post(AUDIO_EXTRACTION_FUNCTION_URL, {
      bucket: bucket,
      videoPath: path,
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

    // Return the full GCS URL to the extracted audio
    return `gs://${bucket}/${response.data.audioGcsPath}`;
  } catch (error: any) {
    console.error(`Error calling audio extraction cloud function: ${error.message}`);
    throw new Error(`Failed to extract audio from video: ${error.message}`);
  }
};

// Function to transcribe audio directly from GCS using longRunningRecognize
const transcribeGcsAudioWithLongRunningRecognize = async (
  audioUrl: string,
  encoding: string = "MP3",
  sampleRateHertz: number | null = 16000
): Promise<string> => {
  console.log(`Transcribing GCS audio with LongRunningRecognize: ${audioUrl}`);

  const client = new SpeechClient({
    keyFilename: GOOGLE_CREDENTIALS_PATH,
  });

  // Parse the GCS URL
  const { bucket, path } = parseGcsUrl(audioUrl);

  // Create the audio source pointing directly to the GCS file
  const audio = {
    uri: `gs://${bucket}/${path}`
  };

  // Configure the request
  const config: any = {
    encoding: encoding,
    languageCode: "en-US",
    enableAutomaticPunctuation: true,
    model: "video",
    useEnhanced: true,
    audioChannelCount: 1,
  };

  // Only add sampleRateHertz if it's not null
  if (sampleRateHertz !== null) {
    config.sampleRateHertz = sampleRateHertz;
    console.log(`Using sample rate: ${sampleRateHertz} Hz`);
  } else {
    console.log("Omitting sample rate to let Google Speech API detect it from the audio header");
  }

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

    if (!response.results || response.results.length === 0) {
      console.log("No transcription results received");
      return "";
    }

    console.log(`Received ${response.results.length} results from long-running transcription`);

    // Combine all transcription results
    return response.results
      .map((result: any) => result.alternatives?.[0]?.transcript || "")
      .join("\n");
  } catch (error: any) {
    console.error(`Google Speech LongRunningRecognize error: ${error.message}`);

    // If we get an encoding error, try again with LINEAR16 encoding
    if (error.message.includes('encoding') && encoding !== "LINEAR16") {
      console.log("Encoding error detected, retrying with LINEAR16 encoding");
      return transcribeGcsAudioWithLongRunningRecognize(audioUrl, "LINEAR16", null);
    }

    throw error;
  }
};

// Function to directly transcribe video using Video Intelligence API
const transcribeVideoDirectly = async (videoUrl: string): Promise<string> => {
  console.log(`Directly transcribing video with Video Intelligence API: ${videoUrl}`);

  // Create a client
  const videoIntelligenceClient = new VideoIntelligenceServiceClient({
    keyFilename: GOOGLE_CREDENTIALS_PATH,
  });

  // Parse the GCS URL
  const { bucket, path } = parseGcsUrl(videoUrl);
  const gcsUri = `gs://${bucket}/${path}`;

  try {
    // Configure the request
    const request = {
      inputUri: gcsUri,
      features: [protos.google.cloud.videointelligence.v1.Feature.SPEECH_TRANSCRIPTION],
      videoContext: {
        speechTranscriptionConfig: {
          languageCode: 'en-US',
          enableAutomaticPunctuation: true,
          // Use enhanced model for better accuracy
          model: 'default',
          // Enable word-level confidence
          enableWordConfidence: true,
        },
      },
    };

    console.log("Starting video transcription operation...");

    // Start the asynchronous annotation
    const operationResponse = await videoIntelligenceClient.annotateVideo(request);
    const operation = operationResponse[0];

    console.log("Waiting for operation to complete... This may take several minutes for long videos.");
    const [operationResult] = await operation.promise();

    // Get the first result
    if (!operationResult.annotationResults || operationResult.annotationResults.length === 0) {
      throw new Error("No annotation results found in the video");
    }

    const annotation = operationResult.annotationResults[0];

    if (!annotation.speechTranscriptions || annotation.speechTranscriptions.length === 0) {
      throw new Error("No speech transcriptions found in the video");
    }

    console.log(`Received ${annotation.speechTranscriptions.length} speech transcriptions`);

    // Combine all transcriptions
    let transcript = "";
    annotation.speechTranscriptions.forEach((speechTranscription: any) => {
      if (speechTranscription.alternatives && speechTranscription.alternatives.length > 0) {
        // Get the alternative with the highest confidence
        const bestAlternative = speechTranscription.alternatives.reduce(
          (best: any, current: any) => {
            return (current.confidence || 0) > (best.confidence || 0) ? current : best;
          },
          speechTranscription.alternatives[0]
        );

        if (bestAlternative.transcript) {
          transcript += bestAlternative.transcript + " ";
        }
      }
    });

    return transcript.trim();
  } catch (error: any) {
    console.error(`Video Intelligence API error: ${error.message}`);
    throw error;
  }
};

export const transcribe = async (audioFilePath: string): Promise<string> => {
  console.log(GOOGLE_CREDENTIALS_PATH, "Hello");

  // Check if the path is a URL
  const isUrl = audioFilePath.startsWith('http://') || audioFilePath.startsWith('https://') || audioFilePath.startsWith('gs://');

  // For local files, check if they exist
  if (!isUrl && !fs.existsSync(audioFilePath)) {
    throw new Error(`Audio file not found: ${audioFilePath}`);
  }

  // Determine if this is a video file
  const isVideo = (
    audioFilePath.toLowerCase().endsWith('.mp4') ||
    audioFilePath.toLowerCase().endsWith('.mov') ||
    audioFilePath.toLowerCase().endsWith('.avi') ||
    audioFilePath.toLowerCase().endsWith('.webm') ||
    audioFilePath.toLowerCase().endsWith('.mkv')
  );

  // For URLs, we need to handle them in chunks
  // For local files, we can use ffprobe to determine duration
  let duration = 0;
  let isLong = false;

  if (!isUrl) {
    try {
      duration = getAudioDuration(audioFilePath);
      isLong = duration > 50; // Use 50 seconds as the threshold for splitting
      console.log(`Audio duration: ${duration} seconds, isLong: ${isLong}`);
    } catch (error) {
      console.warn("Could not determine audio duration, assuming it's not long");
    }
  } else {
    // For URLs, we'll assume it's long and handle it in chunks
    console.log("Audio is a URL, assuming it might be long");
    isLong = true;
  }

  let transcript = "";

  try {
    // Special handling for GCS URLs
    if (isUrl && (audioFilePath.startsWith('gs://') || audioFilePath.startsWith('https://storage.googleapis.com/'))) {
      console.log("GCS URL detected, using cloud-native approach");

      // If it's a video, try direct transcription first
      if (isVideo) {
        console.log("Video file detected, attempting direct transcription with Video Intelligence API");
        try {
          transcript = await transcribeVideoDirectly(audioFilePath);
          console.log("Direct video transcription successful");
          return transcript.trim();
        } catch (videoTranscriptionError: any) {
          console.log(`Direct video transcription failed: ${videoTranscriptionError.message}`);
          console.log("Falling back to audio extraction method");

          // Fall back to audio extraction method
          const audioUrl = await requestCloudAudioExtraction(audioFilePath);
          console.log(`Audio extracted to: ${audioUrl}`);

          // Transcribe the extracted audio using longRunningRecognize
          transcript = await transcribeGcsAudioWithLongRunningRecognize(audioUrl);
        }
      } else {
        // For audio files in GCS, use longRunningRecognize directly
        transcript = await transcribeGcsAudioWithLongRunningRecognize(audioFilePath);
      }

      return transcript.trim();
    }

    if (isUrl) {
      // For URLs, we need to process the audio in chunks using byte range requests
      console.log("Processing URL in chunks using byte range requests");

      try {
        // Get the content length of the audio file
        console.log(`Getting content length for URL: ${audioFilePath}`);
        const contentLength = await getContentLengthFromS3Url(audioFilePath);
        console.log(`Content length: ${contentLength} bytes`);

        if (contentLength <= 0) {
          throw new Error(`Invalid content length: ${contentLength}`);
        }

        // Define chunk size (approximately 50 seconds of audio)
        // For MP3, 128kbps = 16KB/s, so 50 seconds = 800KB
        // We'll use a slightly smaller size to be safe
        const chunkSize = 750 * 1024; // 750KB chunks (about 45-50 seconds)

        // Calculate the number of chunks
        const numChunks = Math.ceil(contentLength / chunkSize);
        console.log(`Splitting audio into ${numChunks} chunks of ${chunkSize} bytes each`);

        // Process each chunk
        let hasContent = false;

        for (let i = 0; i < numChunks; i++) {
          const start = i * chunkSize;
          const end = Math.min((i + 1) * chunkSize - 1, contentLength - 1);

          try {
            console.log(`Processing chunk ${i+1}/${numChunks} (bytes ${start}-${end})`);

            // Get the byte range for this chunk
            const chunkBuffer = await getByteRangeFromS3Url(audioFilePath, start, end);
            console.log(`Got chunk buffer of ${chunkBuffer.length} bytes`);

            // Transcribe this chunk
            // Check if this might be a WAV file and get its sample rate
            let isWavFile = false;
            let wavSampleRate = null;

            if (chunkBuffer.length > 44) { // WAV header is 44 bytes
              const isWavResult = isWavBuffer(chunkBuffer);
              isWavFile = isWavResult.isWav;
              wavSampleRate = isWavResult.sampleRate;

              if (isWavFile) {
                console.log(`Detected WAV file from chunk buffer header with sample rate: ${wavSampleRate} Hz`);
              }
            }

            // Process based on file type
            let chunkTranscript = "";
            if (isWavFile) {
              // For WAV files, use LINEAR16 encoding with the detected sample rate
              console.log(`Processing WAV chunk with LINEAR16 encoding and sample rate: ${wavSampleRate} Hz`);
              try {
                // Pass the detected sample rate to the transcribeWithGoogleSpeech function
                chunkTranscript = await transcribeWithGoogleSpeech(chunkBuffer, "LINEAR16", wavSampleRate);
              } catch (wavError: any) {
                // If there's a sample rate error, the error handler in transcribeWithGoogleSpeech
                // should handle it by removing the sample rate
                console.error("Error processing WAV chunk:", wavError.message);
                throw wavError;
              }
            } else if (i === 0) {
              // For the first non-WAV chunk, try MP3 encoding first
              try {
                // Try with MP3 encoding first for the first chunk
                chunkTranscript = await transcribeWithGoogleSpeech(chunkBuffer, "MP3");
              } catch (mp3Error) {
                console.log("MP3 encoding failed for first chunk, trying LINEAR16");
                // If MP3 fails, try LINEAR16
                chunkTranscript = await transcribeWithGoogleSpeech(chunkBuffer, "LINEAR16");
              }
            } else {
              // For subsequent non-WAV chunks, use the same encoding that worked for the first chunk
              chunkTranscript = await transcribeWithGoogleSpeech(chunkBuffer);
            }

            if (chunkTranscript && chunkTranscript.trim()) {
              transcript += chunkTranscript + " ";
              hasContent = true;
              console.log(`Successfully transcribed chunk ${i+1}/${numChunks}`);
            } else {
              console.log(`No content in chunk ${i+1}/${numChunks}`);
            }
          } catch (chunkError: any) {
            // Check if this is a "No transcription results" error, which is normal for chunks without speech
            if (chunkError.message.includes("No transcription results")) {
              console.log(`No speech detected in chunk ${i+1}/${numChunks}, continuing to next chunk`);
            } else {
              console.error(`Error transcribing chunk ${i+1}/${numChunks}:`, chunkError.message);
            }

            // If we've already got some content and we're past the first few chunks,
            // we can continue and assume we've reached the end of speech
            if (hasContent && i > 3) {
              console.log("Already have content and past first few chunks, assuming end of speech");
              break;
            }

            // If we've tried several chunks and still have no content, try a different approach
            if (!hasContent && i >= 5) {
              console.log("No content after 5 chunks, trying a different approach");
              break;
            }
          }
        }

        if (!hasContent) {
          // If we couldn't get any content from chunks, try with multiple approaches
          console.log("No content from chunks, trying alternative approaches");

          // Try different positions in the file with 50-second chunks
          // For MP3, 128kbps = 16KB/s, so 50 seconds = 800KB
          // We'll use a slightly smaller size to be safe
          const chunkSize = 750 * 1024; // 750KB chunks (about 45-50 seconds)
          const positions = [
            { start: 0, size: chunkSize, name: "beginning" },
            { start: chunkSize, size: chunkSize, name: "middle-beginning" },
            { start: chunkSize * 2, size: chunkSize, name: "middle" }
          ];

          // Try each position with different encodings
          for (const position of positions) {
            try {
              console.log(`Trying ${position.name} of file (${position.start}-${position.start + position.size} bytes)`);

              // Get this chunk of the file
              const chunk = await getByteRangeFromS3Url(
                audioFilePath,
                position.start,
                position.start + position.size - 1
              );

              console.log(`Got ${chunk.length} bytes from ${position.name} of file`);

              // Try with MP3 encoding
              try {
                console.log(`Trying MP3 encoding for ${position.name} of file`);
                const mp3Transcript = await transcribeWithGoogleSpeech(chunk, "MP3");

                if (mp3Transcript && mp3Transcript.trim()) {
                  transcript = mp3Transcript;
                  hasContent = true;
                  console.log(`Successfully transcribed ${position.name} with MP3 encoding`);
                  break; // Exit the loop if successful
                }
              } catch (mp3Error: any) {
                console.log(`MP3 encoding failed for ${position.name}:`, mp3Error.message || "Unknown error");
              }

              // Try with LINEAR16 encoding
              try {
                console.log(`Trying LINEAR16 encoding for ${position.name} of file`);
                const linear16Transcript = await transcribeWithGoogleSpeech(chunk, "LINEAR16");

                if (linear16Transcript && linear16Transcript.trim()) {
                  transcript = linear16Transcript;
                  hasContent = true;
                  console.log(`Successfully transcribed ${position.name} with LINEAR16 encoding`);
                  break; // Exit the loop if successful
                }
              } catch (linearError: any) {
                console.log(`LINEAR16 encoding failed for ${position.name}:`, linearError.message || "Unknown error");
              }

              // If we've tried all encodings for this position and still have no content, continue to next position
              console.log(`No content from ${position.name} with any encoding, trying next position`);

            } catch (positionError) {
              console.error(`Error processing ${position.name} of file:`, positionError);
              // Continue to next position
            }
          }

          // If we still have no content after trying all positions and encodings
          if (!hasContent) {
            console.log("No content could be transcribed with any approach");
            throw new Error("No speech content could be detected in the audio file");
          }
        }
      } catch (error: any) {
        console.error("Error processing audio in chunks:", error);
        const errorMessage = error.message || "Unknown error";
        throw new Error(`Failed to process audio in chunks: ${errorMessage}`);
      }
    } else if (isLong) {
      // For local files that are long, split them
      console.log("Splitting local audio file for transcription");
      const filesToTranscribe = splitAudio(audioFilePath);

      console.log(`Transcribing ${filesToTranscribe.length} audio segments with Google Speech`);

      for (const chunkPath of filesToTranscribe) {
        console.log(`Transcribing chunk with Google Speech: ${chunkPath}`);
        const chunkTranscript = await transcribeWithGoogleSpeech(chunkPath);
        transcript += chunkTranscript + "\n";

        // Clean up chunk files if they're local temporary files
        if (chunkPath !== audioFilePath) {
          try {
            fs.unlinkSync(chunkPath);
            console.log(`Deleted chunk file: ${chunkPath}`);
          } catch (error) {
            console.error(`Error deleting chunk file ${chunkPath}:`, error);
          }
        }
      }
    } else {
      // For short files, use the regular transcribe method
      console.log("Using regular transcribe method for short audio");
      transcript = await transcribeWithGoogleSpeech(audioFilePath);
    }

    console.log("Transcription successful with Google Speech.");
    return transcript.trim();
  } catch (error: any) {
    console.error("Google Speech transcription failed:", error);
    throw new Error(`Transcription failed: ${error.message}`);
  }
};

export const transcribeWithGoogleSpeech = async (
  audioInput: string | Buffer,
  forcedEncoding?: string,
  forcedSampleRate?: number | null
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
        // Check if it's a video file based on URL extension
        const url = new URL(audioInput);
        const pathname = url.pathname.toLowerCase();
        const isVideoFile = pathname.match(/\.(mp4|mov|avi|wmv|flv|webm|mkv)$/);

        if (isVideoFile) {
          console.log("WARNING: URL appears to be a video file. Google Speech-to-Text requires audio formats.");
          console.log("Attempting to fetch anyway, but transcription may fail.");
        }

        // Fetch the file directly using axios
        const response = await axios.get(audioInput, {
          responseType: 'arraybuffer',
          // Set a longer timeout for larger files
          timeout: 30000,
          // Add headers to help with S3 access
          headers: {
            'Accept': '*/*',
            'Accept-Encoding': 'gzip, deflate, br'
          }
        });

        if (!response.data) {
          throw new Error(`Empty response from URL: ${audioInput}`);
        }

        console.log(`Successfully fetched ${response.data.byteLength} bytes from URL`);

        // Check if the content is too large (Google Speech has a 10MB limit for inline content)
        if (response.data.byteLength > 10 * 1024 * 1024) {
          console.log("WARNING: File is larger than 10MB, Google Speech-to-Text may reject it.");
          console.log("Consider splitting the file or using a different approach for large files.");
        }

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

  // Determine encoding based on file type, URL, or forced encoding
  // Default to a safe encoding that works in most cases
  let encoding = "LINEAR16";
  let sampleRateHertz: number | null = 16000;

  // If forcedEncoding is provided, use that
  if (forcedEncoding) {
    encoding = forcedEncoding;
    console.log(`Using forced encoding: ${encoding}`);
  }

  // If forcedSampleRate is provided, use that
  if (forcedSampleRate !== undefined) {
    sampleRateHertz = forcedSampleRate;
    if (sampleRateHertz !== null) {
      console.log(`Using forced sample rate: ${sampleRateHertz} Hz`);
    } else {
      console.log("Omitting sample rate to let Google Speech API detect it from the header");
    }
  }
  // For WAV files with LINEAR16 encoding, we should omit the sample rate
  // to let Google Speech API detect it from the header if not explicitly provided
  else if (encoding === "LINEAR16" && forcedSampleRate === undefined) {
    sampleRateHertz = null;
    console.log("Omitting sample rate for LINEAR16 encoding to let Google Speech API detect it from the header");
  }

  if (typeof audioInput === 'string' && audioInput.startsWith('http')) {
    // For URLs, try to determine encoding from the URL extension
    const url = new URL(audioInput);
    const pathname = url.pathname.toLowerCase();

    // Log the URL and pathname for debugging
    console.log("Analyzing URL for encoding detection:", url.toString());
    console.log("URL pathname:", pathname);

    // Check for specific file extensions
    if (pathname.endsWith('.wav')) {
      encoding = "LINEAR16";
      // For WAV files, we should omit the sample rate to let Google Speech API detect it from the header
      sampleRateHertz = null;
      console.log("Detected WAV file, using LINEAR16 encoding with auto sample rate detection");
    } else if (pathname.endsWith('.flac')) {
      encoding = "FLAC";
      sampleRateHertz = null; // Let Google detect the sample rate
      console.log("Detected FLAC file, using FLAC encoding with auto sample rate detection");
    } else if (pathname.endsWith('.mp3')) {
      encoding = "MP3";
      sampleRateHertz = 16000;
      console.log("Detected MP3 file, using MP3 encoding");
    } else if (pathname.endsWith('.ogg') || pathname.endsWith('.oga')) {
      encoding = "OGG_OPUS";
      sampleRateHertz = 16000;
      console.log("Detected OGG file, using OGG_OPUS encoding");
    } else if (pathname.endsWith('.mp4') || pathname.endsWith('.m4a') || pathname.endsWith('.aac')) {
      // For MP4/AAC files, we'll try MP3 encoding
      encoding = "MP3";
      sampleRateHertz = 16000;
      console.log("Detected MP4/AAC file, using MP3 encoding");
    } else if (pathname.includes('temp_') && pathname.includes('_s3')) {
      // This is likely our S3 temporary file
      // Check if it might be a WAV file based on the content type or other headers
      if (pathname.includes('.wav')) {
        encoding = "LINEAR16";
        sampleRateHertz = null; // Let Google detect the sample rate
        console.log("Detected S3 temporary WAV file, using LINEAR16 encoding with auto sample rate detection");
      } else {
        // Otherwise, try MP3 first
        encoding = "MP3";
        sampleRateHertz = 16000;
        console.log("Detected S3 temporary file, using MP3 encoding");
      }
    } else {
      // For unknown types, use MP3 as it's more likely to work with compressed audio
      encoding = "MP3";
      sampleRateHertz = 16000;
      console.log("Unknown file type, using MP3 encoding for reliability");
    }
  } else if (Buffer.isBuffer(audioInput)) {
    // For buffers, try to detect if it's a WAV file by checking the header
    if (audioInput.length > 12 &&
        audioInput.toString('ascii', 0, 4) === 'RIFF' &&
        audioInput.toString('ascii', 8, 12) === 'WAVE') {
      encoding = "LINEAR16";
      sampleRateHertz = null; // Let Google detect the sample rate
      console.log("Detected WAV file from buffer header, using LINEAR16 encoding with auto sample rate detection");
    } else {
      // For non-WAV buffers, try MP3 first
      encoding = "MP3";
      sampleRateHertz = 16000;
      console.log("Using MP3 encoding for buffer");
    }
  } else {
    // For local files, try MP3 first
    encoding = "MP3";
    sampleRateHertz = 16000;
    console.log("Using MP3 encoding for local file");
  }

  // Configure Google Speech API with more robust settings
  // Use a simpler configuration to avoid type issues
  const config: any = {
    encoding: encoding as any, // Using 'any' to bypass type checking for now
    languageCode: "en-US",
    enableAutomaticPunctuation: true,
    model: "default", // Use the default model
    useEnhanced: true, // Use enhanced model for better accuracy
    enableWordTimeOffsets: true, // Enable word time offsets for better results
  };

  // Only add sampleRateHertz if it's not null
  // This allows Google Speech API to detect the sample rate from the WAV header
  if (sampleRateHertz !== null) {
    config.sampleRateHertz = sampleRateHertz;
    console.log(`Using sample rate: ${sampleRateHertz} Hz`);
  } else {
    console.log("Omitting sample rate to let Google Speech API detect it from the audio header");
  }

  const request = {
    audio,
    config,
  };

  try {
    console.log("Sending request to Google Speech API with config:", JSON.stringify(config));

    // Try with the current configuration
    try {
      const [response] = await client.recognize(request);

      if (!response.results?.length) {
        throw new Error("No transcription results received");
      }

      console.log(`Received ${response.results.length} results from Google Speech API`);

      return response.results
        .map((result: any) => result.alternatives?.[0]?.transcript || "")
        .join("\n");
    } catch (configError: any) {
      // If we get a sample rate error for WAV files, retry without sample rate
      if (configError.message.includes('sample_rate_hertz') && configError.message.includes('WAV header')) {
        console.log("WAV sample rate error detected, retrying without sample rate");

        // Create a new config without sample rate
        const fallbackConfig = {
          ...config,
        };

        // Remove the sample rate to let Google detect it from the WAV header
        delete fallbackConfig.sampleRateHertz;

        console.log("Removed sample rate from config to let Google detect it from WAV header");

        const fallbackRequest = {
          audio,
          config: fallbackConfig,
        };

        console.log("Retrying with fallback config:", JSON.stringify(fallbackConfig));
        const [fallbackResponse] = await client.recognize(fallbackRequest);

        if (!fallbackResponse.results?.length) {
          throw new Error("No transcription results received with fallback config");
        }

        console.log(`Received ${fallbackResponse.results.length} results from Google Speech API with fallback config`);

        return fallbackResponse.results
          .map((result: any) => result.alternatives?.[0]?.transcript || "")
          .join("\n");
      }

      // If we get an encoding error, try again with LINEAR16 encoding
      else if (configError.message.includes('encoding') && encoding !== "LINEAR16") {
        console.log("Encoding error detected, retrying with LINEAR16 encoding");

        // Create a new config with LINEAR16 encoding
        const fallbackConfig = {
          ...config,
          encoding: "LINEAR16" as any,
        };

        const fallbackRequest = {
          audio,
          config: fallbackConfig,
        };

        console.log("Retrying with fallback config:", JSON.stringify(fallbackConfig));
        const [fallbackResponse] = await client.recognize(fallbackRequest);

        if (!fallbackResponse.results?.length) {
          throw new Error("No transcription results received with fallback encoding");
        }

        console.log(`Received ${fallbackResponse.results.length} results from Google Speech API with fallback encoding`);

        return fallbackResponse.results
          .map((result: any) => result.alternatives?.[0]?.transcript || "")
          .join("\n");
      }

      // If it's not an encoding error or fallback also failed, rethrow
      throw configError;
    }
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

// Implement LongRunningRecognize for longer audio files
export const transcribeWithGoogleSpeechLong = async (
  audioInput: string
): Promise<string> => {
  console.log("Using Google Speech LongRunningRecognize API for long audio");

  if (!audioInput.startsWith('http')) {
    throw new Error("LongRunningRecognize requires a URL input");
  }

  const client = new SpeechClient({
    keyFilename: GOOGLE_CREDENTIALS_PATH,
  });

  // For LongRunningRecognize, we need to use a URI instead of inline content
  const audio = {
    uri: audioInput,
  };

  // Determine encoding based on file type or URL
  let encoding = "LINEAR16";
  let sampleRateHertz = 16000;

  // Try to detect the encoding from the URL
  const url = new URL(audioInput);
  const pathname = url.pathname.toLowerCase();

  // Log the URL and pathname for debugging
  console.log("Analyzing URL for encoding detection:", url.toString());
  console.log("URL pathname:", pathname);

  // Check for specific file extensions
  if (pathname.endsWith('.wav')) {
    encoding = "LINEAR16";
    sampleRateHertz = 16000;
    console.log("Detected WAV file, using LINEAR16 encoding");
  } else if (pathname.endsWith('.flac')) {
    encoding = "FLAC";
    sampleRateHertz = 16000;
    console.log("Detected FLAC file, using FLAC encoding");
  } else if (pathname.endsWith('.mp3')) {
    encoding = "MP3";
    sampleRateHertz = 16000;
    console.log("Detected MP3 file, using MP3 encoding");
  } else if (pathname.endsWith('.ogg') || pathname.endsWith('.oga')) {
    encoding = "OGG_OPUS";
    sampleRateHertz = 16000;
    console.log("Detected OGG file, using OGG_OPUS encoding");
  } else if (pathname.endsWith('.mp4') || pathname.endsWith('.m4a') || pathname.endsWith('.aac')) {
    // For MP4/AAC files, we'll use LINEAR16 as it's the most reliable
    encoding = "LINEAR16";
    sampleRateHertz = 16000;
    console.log("Detected MP4/AAC file, using LINEAR16 encoding");
  } else if (pathname.includes('temp_') && pathname.includes('_s3')) {
    // This is likely our S3 temporary file
    // For S3 URLs with our naming pattern, use LINEAR16 as it's the most reliable
    encoding = "LINEAR16";
    sampleRateHertz = 16000;
    console.log("Detected S3 temporary file, using LINEAR16 encoding");
  } else {
    // For unknown types, use LINEAR16 as it's the most reliable
    encoding = "LINEAR16";
    sampleRateHertz = 16000;
    console.log("Unknown file type, using LINEAR16 encoding for reliability");
  }

  // Configure Google Speech API for long running recognition
  const config = {
    encoding: encoding as any,
    sampleRateHertz: sampleRateHertz,
    languageCode: "en-US",
    enableAutomaticPunctuation: true,
    model: "default",
    useEnhanced: true,
  };

  const request = {
    audio,
    config,
  };

  try {
    console.log("Starting LongRunningRecognize with config:", JSON.stringify(config));

    // Start the long running operation
    const [operation] = await client.longRunningRecognize(request);

    console.log("Waiting for LongRunningRecognize operation to complete...");

    // Wait for the operation to complete
    const [response] = await operation.promise();

    if (!response.results?.length) {
      throw new Error("No transcription results received from LongRunningRecognize");
    }

    console.log(`Received ${response.results.length} results from LongRunningRecognize`);

    // Combine all results
    return response.results
      .map((result: any) => result.alternatives?.[0]?.transcript || "")
      .join("\n");
  } catch (error: any) {
    console.error("Google Speech LongRunningRecognize error:", error.message);

    // If we get an encoding error, try again with LINEAR16 encoding
    if (error.message.includes('encoding') && encoding !== "LINEAR16") {
      console.log("Encoding error detected, retrying with LINEAR16 encoding");

      // Create a new config with LINEAR16 encoding
      const fallbackConfig = {
        ...config,
        encoding: "LINEAR16" as any,
      };

      const fallbackRequest = {
        audio,
        config: fallbackConfig,
      };

      try {
        console.log("Retrying LongRunningRecognize with fallback config:", JSON.stringify(fallbackConfig));

        // Start the long running operation with fallback config
        const [fallbackOperation] = await client.longRunningRecognize(fallbackRequest);

        // Wait for the operation to complete
        const [fallbackResponse] = await fallbackOperation.promise();

        if (!fallbackResponse.results?.length) {
          throw new Error("No transcription results received from fallback LongRunningRecognize");
        }

        console.log(`Received ${fallbackResponse.results.length} results from fallback LongRunningRecognize`);

        // Combine all results
        return fallbackResponse.results
          .map((result: any) => result.alternatives?.[0]?.transcript || "")
          .join("\n");
      } catch (fallbackError: any) {
        console.error("Fallback LongRunningRecognize error:", fallbackError.message);
        throw new Error(`Google Speech LongRunningRecognize failed: ${fallbackError.message}`);
      }
    }

    throw new Error(`Google Speech LongRunningRecognize failed: ${error.message}`);
  }
};
