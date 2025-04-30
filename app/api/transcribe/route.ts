import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import { extractAudioFromVideo, transcribe } from "@/lib/google-speech";
import { getCurrentUser } from "@/lib/auth";

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const filesToCleanup: string[] = [];

  try {
    // Get current user from token
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Create a FormData object from the request
    const formData = await request.formData();

    // Get the file and file type from the form data
    const file = formData.get("file") as File;
    const fileType = formData.get("fileType") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const validAudioTypes = ["audio/wav", "audio/mp3", "audio/mpeg", "audio/webm"];
    const validVideoTypes = ["video/mp4", "video/webm"];
    const isValidType =
      (fileType === "audio" && validAudioTypes.includes(file.type)) ||
      (fileType === "video" && validVideoTypes.includes(file.type));

    if (!isValidType) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Supported formats: WAV, MP3, MP4, WebM` },
        { status: 400 }
      );
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds 10MB limit (received ${(file.size / 1024 / 1024).toFixed(2)}MB)` },
        { status: 400 }
      );
    }

    // Create temporary directory
    const tempDir = join(process.cwd(), "tmp");
    await mkdir(tempDir, { recursive: true });

    // Generate unique filename
    const fileExtension = file.name.split(".").pop() || (fileType === "audio" ? "mp3" : "mp4");
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = join(tempDir, fileName);

    try {
      // Write file to disk
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filePath, buffer);
      filesToCleanup.push(filePath);
    } catch (error) {
      console.error("Error writing file:", error);
      return NextResponse.json(
        { error: "Failed to process uploaded file" },
        { status: 500 }
      );
    }

    // Process video files
    let audioFilePath = filePath;
    if (fileType === "video") {
      try {
        audioFilePath = await extractAudioFromVideo(filePath);
        filesToCleanup.push(audioFilePath);
      } catch (error) {
        console.error("Error extracting audio:", error);
        return NextResponse.json(
          { error: "Failed to extract audio from video" },
          { status: 500 }
        );
      }
    }

    // Transcribe the audio
    try {
      const transcript = await transcribe(audioFilePath);
      if (!transcript) {
        throw new Error("Empty transcript received");
      }

      // Add metadata
      const fileInfo = `\n\nFile: ${file.name} (${fileType})\nTranscribed at: ${new Date().toISOString()}`;
      const finalTranscript = transcript + fileInfo;

      return NextResponse.json({
        transcript: finalTranscript,
        transcriptionMethod: "whisper", // or "google" depending on which service succeeded
      });
    } catch (error) {
      console.error("Transcription error:", error);
      return NextResponse.json(
        { error: "Failed to transcribe audio" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  } finally {
    // Clean up temporary files
    for (const tempFile of filesToCleanup) {
      try {
        await unlink(tempFile);
        console.log(`Cleaned up temporary file: ${tempFile}`);
      } catch (error) {
        console.error(`Error cleaning up file ${tempFile}:`, error);
      }
    }
  }
}
