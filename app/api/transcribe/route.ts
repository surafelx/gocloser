import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { mkdir } from 'fs/promises';
import { transcribeAudio } from '@/lib/openai';
import { getCurrentUser } from '@/lib/auth';

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    // Get current user from token
    const currentUser = getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Create a FormData object from the request
    const formData = await request.formData();

    // Get the file and file type from the form data
    const file = formData.get('file') as File;
    const fileType = formData.get('fileType') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Check file type
    if (fileType !== 'audio' && fileType !== 'video') {
      return NextResponse.json(
        { error: 'Invalid file type. Only audio and video files are supported.' },
        { status: 400 }
      );
    }

    // Create a temporary directory to store the file
    const tempDir = join(process.cwd(), 'tmp');
    await mkdir(tempDir, { recursive: true });

    // Generate a unique filename
    const fileName = `${uuidv4()}-${file.name}`;
    const filePath = join(tempDir, fileName);

    // Write the file to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // Use OpenAI Whisper to transcribe the audio/video file
    let transcript = '';
    try {
      // Transcribe the file using Whisper API
      transcript = await transcribeAudio(filePath);

      // Add metadata to the transcript
      const fileInfo = `\n\nFile: ${file.name} (${fileType})\nTranscribed at: ${new Date().toISOString()}`;
      transcript += fileInfo;

    } catch (transcriptionError) {
      console.error('Error transcribing with Whisper:', transcriptionError);
      return NextResponse.json(
        { error: 'Failed to transcribe file with Whisper API' },
        { status: 500 }
      );
    }

    // Clean up - delete the temporary file after transcription
    try {
      await unlink(filePath);
      console.log(`Temporary file deleted: ${filePath}`);
    } catch (error) {
      console.error('Error deleting temporary file:', error);
    }

    // Return the transcript
    return NextResponse.json({ transcript });
  } catch (error) {
    console.error('Error transcribing file:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe file' },
      { status: 500 }
    );
  }
}
