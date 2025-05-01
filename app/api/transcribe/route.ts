import { NextRequest, NextResponse } from "next/server";
import {
  uploadToS3,
  deleteFromS3
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
    // Get plan details (currently unused but kept for future use)
    getPlanById(planId);

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

    // Upload file directly to S3 (bypassing Cloudinary)
    let fileUrl;
    let uploadResponse: any = null;

    try {
      console.log("Starting file upload to S3...");

      // Convert file to buffer
      console.log("Converting file to buffer...");
      const arrayBuffer = await file.arrayBuffer();
      console.log(`Array buffer size: ${arrayBuffer.byteLength} bytes`);
      const buffer = Buffer.from(arrayBuffer);
      console.log(`Buffer size: ${buffer.length} bytes`);

      console.log(`File MIME type: ${file.type}`);

      // Check if AWS credentials are configured
      if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET) {
        console.error("AWS S3 credentials not configured");
        throw new Error("AWS S3 is not properly configured");
      }

      // For video files, we need to set the correct content type
      // Google Speech-to-Text works best with audio formats
      let fileTypeForUpload = file.type;

      // Determine the best content type for Google Speech compatibility
      if (fileType === "video") {
        console.log("Video file detected, setting content type to audio/wav for Google Speech compatibility");
        fileTypeForUpload = "audio/wav"; // LINEAR16 encoding works best with WAV
      } else if (fileType === "audio") {
        // For audio files, check the specific format
        if (file.type.includes('mp3')) {
          console.log("MP3 audio detected, keeping original content type");
          fileTypeForUpload = "audio/mpeg";
        } else if (file.type.includes('wav') || file.type.includes('wave')) {
          console.log("WAV audio detected, setting content type to audio/wav");
          fileTypeForUpload = "audio/wav";
        } else if (file.type.includes('ogg')) {
          console.log("OGG audio detected, setting content type to audio/ogg");
          fileTypeForUpload = "audio/ogg";
        } else {
          // For other audio formats, use WAV as it's most compatible with LINEAR16
          console.log("Unknown audio format detected, setting content type to audio/wav for compatibility");
          fileTypeForUpload = "audio/wav";
        }
      }

      // Upload to S3
      uploadResponse = await uploadToS3(buffer, {
        folder: "temp_transcriptions",
        publicId: `temp_${Date.now()}_s3`,
        fileType: fileTypeForUpload
      });

      console.log("Successfully uploaded to S3");
      console.log("Upload response received:", JSON.stringify(uploadResponse));

      if (!uploadResponse || !uploadResponse.secure_url) {
        throw new Error("Invalid response from S3 upload: missing secure_url");
      }

      fileUrl = uploadResponse.secure_url;
      console.log(`S3 URL:`, fileUrl);
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

    // For video files, we need to handle them differently
    // Google Speech-to-Text can't process video directly
    let audioUrl = fileUrl;

    // If it's a video file, extract the audio
    if (fileType === "video") {
      console.log("Video file detected. Converting to audio and preparing for transcription.");

      try {
        // Import the extractAudioFromS3Video function
        const { extractAudioFromS3Video } = await import("@/lib/s3");

        // Extract audio from the video
        console.log("Converting video to audio format...");
        const extractedAudioUrl = await extractAudioFromS3Video(uploadResponse.public_id);
        console.log(`Extracted audio URL: ${extractedAudioUrl}`);

        // Use the extracted audio URL
        audioUrl = extractedAudioUrl;

        console.log("Video successfully converted to audio format");
        console.log("Audio will be processed in chunks if longer than 50 seconds");
      } catch (extractionError: any) {
        console.error("Error extracting audio from video:", extractionError);
        console.log("Will attempt to process video directly, but may fail depending on the format.");
      }
    }

    // Transcribe the audio directly with Google Speech-to-Text
    try {
      console.log(`Starting Google Speech-to-Text transcription of: ${audioUrl}`);

      // For S3 URLs, we need to use the regular transcribeWithGoogleSpeech
      // but we'll split the audio into chunks in the Google Speech library
      console.log("Using chunked transcription for S3 URL to handle long audio");

      // Import the regular transcribe function that handles chunking
      const { transcribe } = await import("@/lib/google-speech");
      const transcript = await transcribe(audioUrl);

      if (!transcript) {
        throw new Error("Empty transcript received");
      }

      console.log(`Google Speech-to-Text transcription successful, length: ${transcript.length} characters`);

      // Track token usage for audio recording
      try {
        const userId = currentUser.id || currentUser.userId;

        // Calculate token usage based on transcript length
        // Estimate 1 token per 4 characters of transcript (approximate)
        const transcriptTokens = Math.ceil(transcript.length / 4);

        // Use the larger of the base cost or the calculated tokens
        // This ensures we charge at least the minimum for any transcription
        const promptTokens = Math.max(TOKEN_COSTS.AUDIO_RECORDING, transcriptTokens);

        // Log the token calculation
        console.log(`Transcript length: ${transcript.length} characters`);
        console.log(`Estimated tokens: ${transcriptTokens}`);
        console.log(`Final prompt tokens: ${promptTokens}`);

        // Update token usage in the database
        await updateTokenUsage(
          userId,
          promptTokens, // Prompt tokens based on transcript length
          0 // Completion tokens
        );

        console.log(`[TOKEN-TRACKING] User ${userId} used ${promptTokens} tokens for transcription`);

        // Note: Token usage is tracked but not enforced for plan restrictions
      } catch (tokenError) {
        console.error("Error tracking token usage for audio recording:", tokenError);
        // Continue with the response even if token tracking fails
      }

      // Add metadata
      const fileInfo = `\n\nFile: ${file.name} (${fileType})\nTranscribed at: ${new Date().toISOString()}`;
      const finalTranscript = transcript + fileInfo;

      // Cleanup: Delete the temporary file from S3
      if (uploadResponse && uploadResponse.public_id) {
        try {
          await deleteFromS3(uploadResponse.public_id);
          console.log("S3 file deleted:", uploadResponse.public_id);
        } catch (cleanupError) {
          console.error(`Error deleting S3 file:`, cleanupError);
          // Continue with the response even if cleanup fails
        }
      }

      // Calculate token usage for the response
      // Estimate 1 token per 4 characters of transcript (approximate)
      const transcriptTokens = Math.ceil(finalTranscript.length / 4);

      // Calculate additional tokens based on audio duration (if available)
      let durationBasedTokens = 0;

      // Try to get audio duration from the file
      let audioDurationSeconds = 0;
      try {
        // Estimate duration based on transcript length (very rough approximation)
        // Average speaking rate is about 150 words per minute
        // Average word is about 5 characters
        // So 150 words * 5 chars = 750 characters per minute
        audioDurationSeconds = Math.ceil(finalTranscript.length / (750 / 60));

        // Calculate tokens based on duration: TOKEN_COSTS.TRANSCRIPTION_PER_MINUTE tokens per minute
        const durationMinutes = audioDurationSeconds / 60;
        durationBasedTokens = Math.ceil(durationMinutes * TOKEN_COSTS.TRANSCRIPTION_PER_MINUTE);
        console.log(`Estimated audio duration: ${audioDurationSeconds}s (${durationMinutes.toFixed(2)} minutes)`);
        console.log(`Duration-based tokens: ${durationBasedTokens}`);
      } catch (durationError) {
        console.error("Error calculating duration-based tokens:", durationError);
      }

      // Use the larger of the base cost, transcript-based tokens, or duration-based tokens
      const promptTokens = Math.max(
        TOKEN_COSTS.AUDIO_RECORDING,
        transcriptTokens,
        durationBasedTokens
      );

      console.log(`Final token calculation: max(${TOKEN_COSTS.AUDIO_RECORDING}, ${transcriptTokens}, ${durationBasedTokens}) = ${promptTokens}`);

      return NextResponse.json({
        transcript: finalTranscript,
        transcriptionMethod: "google-speech",
        audioDuration: audioDurationSeconds || 0,
        tokenUsage: {
          promptTokens: promptTokens,
          completionTokens: 0,
          totalTokens: promptTokens
        }
      });
    } catch (error: any) {
      console.error("Transcription error:", error);

      // Provide more specific error messages based on the error
      let errorMessage = "Failed to transcribe audio";

      if (error.message.includes("Audio file not found")) {
        errorMessage = "The audio file could not be accessed. Please try again with a different file.";
      } else if (error.message.includes("Failed to download") || error.message.includes("Failed to fetch")) {
        errorMessage = "Could not download the audio file. Please try again.";
      } else if (error.message.includes("encoding")) {
        errorMessage = "The audio format is not supported. Please try a different audio format (WAV or MP3 recommended).";
      } else if (error.message.includes("sample_rate_hertz") && error.message.includes("WAV header")) {
        errorMessage = "There was an issue with the WAV file sample rate. We've updated our handling for WAV files, please try again.";
      } else if (error.message.includes("No transcription results")) {
        errorMessage = "No speech was detected in the audio. Please check the audio file and try again.";
      } else if (error.message.includes("too large") || error.message.includes("Sync input too long")) {
        errorMessage = "The audio file is too long for synchronous transcription. We're now using chunked transcription, please try again.";
      } else if (error.message.includes("No speech content could be detected")) {
        errorMessage = "No speech could be detected in the audio file. Please check that the file contains speech and try again.";
      } else if (error.message.includes("LongRunningRecognize")) {
        errorMessage = "There was an issue with the transcription. Please try again with a different audio format.";
      } else if (error.message.includes("Failed to extract audio from video")) {
        errorMessage = "There was an issue extracting audio from the video file. Please try converting the video to audio before uploading.";
      } else if (error.message.includes("Sync input too long") && fileType === "video") {
        errorMessage = "The video file is too long. We're now processing it in chunks. Please try again.";
      } else if (fileType === "video") {
        errorMessage = "There was an issue transcribing the video file. Please try converting the video to audio (MP3 or WAV) before uploading.";
      }

      // Clean up any temporary files if possible
      if (uploadResponse && uploadResponse.public_id) {
        try {
          await deleteFromS3(uploadResponse.public_id);
          console.log("Cleaned up S3 file after error:", uploadResponse.public_id);
        } catch (cleanupError) {
          console.error("Error cleaning up S3 file after transcription error:", cleanupError);
        }
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
