import { NextRequest, NextResponse } from "next/server";
import { extractAudioFromVideo, transcribe } from "@/lib/google-speech";
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary";

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const fileType = formData.get("fileType") as string;

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

    // Upload to Cloudinary
    let cloudinaryUrl;
    let uploadResponse: any = null;

    try {
      console.log("Starting Cloudinary upload...");
      const buffer = Buffer.from(await file.arrayBuffer());

      // Use the utility function to upload to Cloudinary
      uploadResponse = await uploadToCloudinary(buffer, {
        folder: "temp_transcriptions",
        publicId: `temp_${Date.now()}`,
        resourceType: "auto"
      });

      console.log("Upload response received");
      cloudinaryUrl = uploadResponse.secure_url;
      console.log("Cloudinary URL:", cloudinaryUrl);
    } catch (error) {
      console.error("Error during Cloudinary upload:", error);
      return NextResponse.json(
        { error: "Failed to upload file to Cloudinary" },
        { status: 500 }
      );
    }

    // Process video files if needed
    let audioUrl = cloudinaryUrl;
    if (fileType === "video") {
      try {
        audioUrl = await extractAudioFromVideo(cloudinaryUrl);
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
      console.log(`Starting transcription of: ${audioUrl}`);
      const transcript = await transcribe(audioUrl);

      if (!transcript) {
        throw new Error("Empty transcript received");
      }

      console.log(`Transcription successful, length: ${transcript.length} characters`);

      // Add metadata
      const fileInfo = `\n\nFile: ${file.name} (${fileType})\nTranscribed at: ${new Date().toISOString()}`;
      const finalTranscript = transcript + fileInfo;

      // Cleanup: Delete the temporary file from Cloudinary
      if (uploadResponse && uploadResponse.public_id) {
        try {
          await deleteFromCloudinary(uploadResponse.public_id);
          console.log("Cloudinary file deleted:", uploadResponse.public_id);
        } catch (cleanupError) {
          console.error("Error deleting Cloudinary file:", cleanupError);
          // Continue with the response even if cleanup fails
        }
      }

      return NextResponse.json({
        transcript: finalTranscript,
        transcriptionMethod: "whisper",
      });
    } catch (error: any) {
      console.error("Transcription error:", error);

      // Provide more specific error messages based on the error
      let errorMessage = "Failed to transcribe audio";

      if (error.message.includes("Audio file not found")) {
        errorMessage = "The audio file could not be accessed. Please try again with a different file.";
      } else if (error.message.includes("Failed to download")) {
        errorMessage = "Could not download the audio file from Cloudinary. Please try again.";
      } else if (error.message.includes("Whisper") && error.message.includes("Google")) {
        errorMessage = "Both transcription services failed. Please try a different audio format.";
      }

      return NextResponse.json(
        {
          error: errorMessage,
          details: error.message
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
