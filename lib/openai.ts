import OpenAI from 'openai';

// Initialize the OpenAI client
export const initOpenAI = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not defined in environment variables');
  }
  
  return new OpenAI({
    apiKey,
  });
};

// Transcribe audio using Whisper API
export const transcribeAudio = async (filePath: string): Promise<string> => {
  try {
    const openai = initOpenAI();
    
    // Create a readable stream from the file
    const fs = require('fs');
    const file = fs.createReadStream(filePath);
    
    // Call the Whisper API
    const response = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
    });
    
    return response.text;
  } catch (error) {
    console.error('Error transcribing audio with Whisper:', error);
    throw new Error('Failed to transcribe audio file');
  }
};
