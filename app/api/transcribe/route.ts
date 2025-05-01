import { NextRequest, NextResponse } from "next/server";
import { extractAudioFromVideo, transcribe } from "@/lib/google-speech";
import {
  uploadToCloudinary,
  uploadToCloudinaryAlternative,
  deleteFromCloudinary
} from "@/lib/cloudinary";
import { getCurrentUser } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import Subscription from "@/models/Subscription";
import { getPlanById } from "@/lib/whop";
import { updateTokenUsage } from "@/lib/token-manager";
import { TOKEN_COSTS } from "@/lib/token-costs";

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  console.log("Transcribe API route called");

  try {
    // Check if user is authenticated
    const currentUser = getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user has permission to use voice transcription
    await dbConnect();
    const subscription = await Subscription.findOne({
      userId: currentUser.id || currentUser.userId,
      status: "active",
    });

    // Get the user's plan
    const planId = subscription?.planId || "free";
    const plan = getPlanById(planId);

    // NOTE: Plan restriction check is temporarily disabled
    /*
    // Check if the plan supports voice transcription
    if (!plan.hasVoiceSupport) {
      return NextResponse.json(
        {
          error: "Voice transcription not available on your plan",
          details: "Please upgrade to the Pro plan to use voice transcription features."
        },
        { status: 403 }
      );
    }
    */

    // Log plan information without enforcing restrictions
    console.log(`User ${currentUser.id || currentUser.userId} on plan ${planId} is using transcription`);


    // Log environment variables (without revealing secrets)
    console.log("Environment check:", {
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? "Set" : "Missing",
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? "Set" : "Missing",
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? "Set" : "Missing",
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "Set" : "Missing",
      NODE_ENV: process.env.NODE_ENV,
    });

    console.log("Parsing form data...");
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const fileType = formData.get("fileType") as string;

    console.log(`Received file: ${file?.name}, type: ${file?.type}, size: ${file?.size} bytes, fileType param: ${fileType}`);

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

      // Convert file to buffer
      console.log("Converting file to buffer...");
      const arrayBuffer = await file.arrayBuffer();
      console.log(`Array buffer size: ${arrayBuffer.byteLength} bytes`);
      const buffer = Buffer.from(arrayBuffer);
      console.log(`Buffer size: ${buffer.length} bytes`);

      console.log(`File MIME type: ${file.type}`);

      // Try the primary upload method first
      try {
        console.log("Trying primary upload method...");
        uploadResponse = await uploadToCloudinary(buffer, {
          folder: "temp_transcriptions",
          publicId: `temp_${Date.now()}`,
          fileType: file.type, // Pass the file type to help determine resource type
          maxRetries: 3
        });
      } catch (primaryError) {
        // If primary method fails, try the alternative method
        console.log("Primary upload method failed, trying alternative...");
        console.error("Primary upload error:", primaryError);

        // Add a small delay before trying alternative method
        await new Promise(resolve => setTimeout(resolve, 500));

        uploadResponse = await uploadToCloudinaryAlternative(buffer, {
          folder: "temp_transcriptions",
          publicId: `temp_${Date.now()}_alt`,
          fileType: file.type // Pass the file type to help determine resource type
        });
      }

      console.log("Upload response received:", JSON.stringify(uploadResponse));

      if (!uploadResponse || !uploadResponse.secure_url) {
        throw new Error("Invalid response from Cloudinary: missing secure_url");
      }

      cloudinaryUrl = uploadResponse.secure_url;
      console.log("Cloudinary URL:", cloudinaryUrl);
    } catch (error: any) {
      console.error("Error during Cloudinary upload:", error);
      // Provide more detailed error message
      return NextResponse.json(
        {
          error: "Failed to upload file to Cloudinary",
          details: error.message || "Unknown error",
          statusCode: error.http_code || 500
        },
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

      // Track token usage for audio recording (100 tokens per recording)
      try {
        const userId = currentUser.id || currentUser.userId;
        await updateTokenUsage(
          userId,
          TOKEN_COSTS.AUDIO_RECORDING, // Prompt tokens (100 for audio recording)
          0 // Completion tokens
        );
        console.log(`[TOKEN-TRACKING] User ${userId} used ${TOKEN_COSTS.AUDIO_RECORDING} tokens for AUDIO_RECORDING`);

        // Note: Token usage is tracked but not enforced for plan restrictions
      } catch (tokenError) {
        console.error("Error tracking token usage for audio recording:", tokenError);
        // Continue with the response even if token tracking fails
      }

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
  } catch (error: any) {
    console.error("API error:", error);

    // Provide more detailed error information
    return NextResponse.json(
      {
        error: "Failed to process request",
        details: error.message || "Unknown error",
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
