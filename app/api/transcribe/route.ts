import { NextRequest, NextResponse } from "next/server";
import { extractAudioFromVideo, transcribe } from "@/lib/google-speech";
import {
  uploadToCloudinary,
  uploadToCloudinaryAlternative,
  deleteFromCloudinary
} from "@/lib/cloudinary";
import {
  uploadToS3,
  deleteFromS3,
  extractAudioFromS3Video
} from "@/lib/s3";
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

    // Upload file to cloud storage (Cloudinary with S3 fallback)
    let fileUrl;
    let uploadResponse: any = null;
    let storageProvider = "cloudinary"; // Track which provider was used

    try {
      console.log("Starting file upload...");

      // Convert file to buffer
      console.log("Converting file to buffer...");
      const arrayBuffer = await file.arrayBuffer();
      console.log(`Array buffer size: ${arrayBuffer.byteLength} bytes`);
      const buffer = Buffer.from(arrayBuffer);
      console.log(`Buffer size: ${buffer.length} bytes`);

      console.log(`File MIME type: ${file.type}`);

      // Try Cloudinary first (with both methods)
      try {
        console.log("Trying Cloudinary primary upload method...");
        uploadResponse = await uploadToCloudinary(buffer, {
          folder: "temp_transcriptions",
          publicId: `temp_${Date.now()}`,
          fileType: file.type,
          maxRetries: 3
        });
      } catch (primaryError) {
        // If primary method fails, try the alternative Cloudinary method
        console.log("Cloudinary primary upload method failed, trying alternative...");
        console.error("Cloudinary primary upload error:", primaryError);

        try {
          // Add a small delay before trying alternative method
          await new Promise(resolve => setTimeout(resolve, 500));

          uploadResponse = await uploadToCloudinaryAlternative(buffer, {
            folder: "temp_transcriptions",
            publicId: `temp_${Date.now()}_alt`,
            fileType: file.type
          });
        } catch (alternativeError) {
          // If both Cloudinary methods fail, try S3 as a last resort
          console.log("Cloudinary alternative upload method failed, falling back to S3...");
          console.error("Cloudinary alternative upload error:", alternativeError);

          // Check if AWS credentials are configured
          if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET) {
            console.error("AWS S3 credentials not configured, cannot use fallback");
            throw new Error("All upload methods failed and S3 fallback is not configured");
          }

          // Add a small delay before trying S3
          await new Promise(resolve => setTimeout(resolve, 500));

          // Try uploading to S3
          uploadResponse = await uploadToS3(buffer, {
            folder: "temp_transcriptions",
            publicId: `temp_${Date.now()}_s3`,
            fileType: file.type
          });

          storageProvider = "s3"; // Mark that we're using S3
          console.log("Successfully uploaded to S3 fallback");
        }
      }

      console.log("Upload response received:", JSON.stringify(uploadResponse));

      if (!uploadResponse || !uploadResponse.secure_url) {
        throw new Error("Invalid response from upload: missing secure_url");
      }

      fileUrl = uploadResponse.secure_url;
      console.log(`${storageProvider.toUpperCase()} URL:`, fileUrl);
    } catch (error: any) {
      console.error(`Error during file upload:`, error);
      // Provide more detailed error message
      return NextResponse.json(
        {
          error: "Failed to upload file",
          details: error.message || "Unknown error",
          statusCode: error.http_code || 500
        },
        { status: 500 }
      );
    }

    // Process video files if needed
    let audioUrl = fileUrl;
    if (fileType === "video") {
      try {
        // Use the appropriate extraction method based on storage provider
        if (storageProvider === "cloudinary") {
          audioUrl = await extractAudioFromVideo(fileUrl);
        } else if (storageProvider === "s3") {
          audioUrl = await extractAudioFromS3Video(uploadResponse.public_id);
        }
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

      // Cleanup: Delete the temporary file from storage
      if (uploadResponse && uploadResponse.public_id) {
        try {
          if (storageProvider === "cloudinary") {
            await deleteFromCloudinary(uploadResponse.public_id);
            console.log("Cloudinary file deleted:", uploadResponse.public_id);
          } else if (storageProvider === "s3") {
            await deleteFromS3(uploadResponse.public_id);
            console.log("S3 file deleted:", uploadResponse.public_id);
          }
        } catch (cleanupError) {
          console.error(`Error deleting ${storageProvider} file:`, cleanupError);
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
