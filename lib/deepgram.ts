// Import the Deepgram SDK v4
import { createClient } from '@deepgram/sdk';

// Initialize Deepgram with API key from environment variables
const deepgramApiKey = process.env.DEEPGRAM_API_KEY || '';
// Create a new Deepgram client with the v4 SDK format
const deepgram = createClient(deepgramApiKey);

/**
 * Transcribe audio or video file using Deepgram
 * @param fileBuffer - Buffer containing the audio/video data
 * @param mimeType - MIME type of the file
 * @param fileName - Original file name (for reference)
 * @returns Transcription result with text and metadata
 */
export async function transcribeWithDeepgram(
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<{
  text: string;
  response: any; // Using any for now as the response type has changed in the new SDK
  words: Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
  }>;
  paragraphs: Array<{
    text: string;
    start: number;
    end: number;
  }>;
  speakers: Array<{
    id: string;
    segments: Array<{
      text: string;
      start: number;
      end: number;
    }>;
  }>;
  metadata: {
    fileName: string;
    mimeType: string;
    duration: number;
    channels: number;
  };
}> {
  try {
    console.log(`Transcribing file: ${fileName} (${mimeType}), size: ${fileBuffer.length} bytes`);

    // Configure Deepgram transcription options using the v4 SDK format
    const options = {
      model: 'nova-2',
      language: 'en',
      smart_format: true,
      diarize: true,
      paragraphs: true,
      utterances: true,
      punctuate: true,
    };

    // Send to Deepgram for transcription using the v4 SDK format
    const response = await deepgram.listen.prerecorded.transcribeFile(fileBuffer, {
      mimetype: mimeType,
      model: options.model,
      language: options.language,
      smart_format: options.smart_format,
      diarize: options.diarize,
      paragraphs: options.paragraphs,
      utterances: options.utterances,
      punctuate: options.punctuate
    });

    // Extract the transcript text - updated for v4 SDK format
    const transcript = response.results?.utterances?.[0]?.transcript || '';

    // Extract word-level data if available - updated for v4 SDK format
    const words = response.results?.utterances?.[0]?.words || [];
    const formattedWords = words.map(word => ({
      word: word.word,
      start: word.start,
      end: word.end,
      confidence: word.confidence
    }));

    // Extract paragraph data if available - updated for v4 SDK format
    const paragraphs = response.results?.paragraphs || [];
    const formattedParagraphs = paragraphs.map(para => ({
      text: para.text || '',
      start: para.start || 0,
      end: para.end || 0
    }));

    // Extract speaker data if available - updated for v4 SDK format
    const utterances = response.results?.utterances || [];

    // Group utterances by speaker
    const speakerMap = new Map<string, Array<{text: string, start: number, end: number}>>();

    for (const utterance of utterances) {
      const speakerId = utterance.speaker || 'unknown';
      if (!speakerMap.has(speakerId)) {
        speakerMap.set(speakerId, []);
      }
      speakerMap.get(speakerId)?.push({
        text: utterance.transcript || '',
        start: utterance.start || 0,
        end: utterance.end || 0
      });
    }

    const speakers = Array.from(speakerMap.entries()).map(([id, segments]) => ({
      id,
      segments
    }));

    // Extract metadata - updated for v4 SDK format
    const metadata = {
      fileName,
      mimeType,
      duration: response.metadata?.duration || 0,
      channels: response.metadata?.channels || 1
    };

    return {
      text: transcript,
      response,
      words: formattedWords,
      paragraphs: formattedParagraphs,
      speakers,
      metadata
    };
  } catch (error) {
    console.error('Deepgram transcription error:', error);
    throw new Error(`Failed to transcribe file: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate a formatted transcript with speaker labels and timestamps
 * @param transcriptionResult - Result from transcribeWithDeepgram
 * @returns Formatted transcript text
 */
export async function generateFormattedTranscript(
  transcriptionResult: Awaited<ReturnType<typeof transcribeWithDeepgram>>
): Promise<string> {
  const { speakers, metadata } = transcriptionResult;

  // Create header with file information
  let formattedText = `# Transcript: ${metadata.fileName}\n`;
  formattedText += `Duration: ${await formatTime(metadata.duration)}\n\n`;

  // Add speaker segments with timestamps
  if (speakers.length > 0) {
    for (const speaker of speakers) {
      formattedText += `## Speaker ${speaker.id}\n\n`;

      for (const segment of speaker.segments) {
        const startTime = await formatTime(segment.start);
        const endTime = await formatTime(segment.end);
        formattedText += `[${startTime} - ${endTime}] ${segment.text}\n\n`;
      }
    }
  } else {
    // If no speaker diarization, use paragraphs
    for (const paragraph of transcriptionResult.paragraphs) {
      const startTime = await formatTime(paragraph.start);
      const endTime = await formatTime(paragraph.end);
      formattedText += `[${startTime} - ${endTime}] ${paragraph.text}\n\n`;
    }
  }

  return formattedText;
}

/**
 * Format seconds into HH:MM:SS format
 */
async function formatTime(seconds: number): Promise<string> {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0')
  ].join(':');
}
