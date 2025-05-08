import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import { uploadToS3, deleteFromS3, getSignedUrl } from "@/lib/s3";
import { transcribeWithDeepgram, generateFormattedTranscript } from "@/lib/deepgram";
import { generateGeminiResponse } from "@/app/actions/gemini-actions";
import Transcript from "@/models/Transcript";
import Subscription from "@/models/Subscription";
import { updateTokenUsage } from "@/lib/token-manager";
import { TOKEN_COSTS } from "@/lib/token-costs";
import mongoose from "mongoose";

// Maximum file size (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

export async function POST(request: NextRequest) {
  console.log("Deepgram Transcribe API route called");

  try {
    // Check if user is authenticated
    const currentUser = getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Connect to the database
    await dbConnect();

    // Check subscription
    const subscription = await Subscription.findOne({
      userId: currentUser.id || currentUser.userId,
      status: "active",
    });

    // Get the user's plan
    const planId = subscription?.planId || "free";
    console.log(`User ${currentUser.id || currentUser.userId} on plan ${planId} is using Deepgram transcription`);

    // Parse the form data
    console.log("Parsing form data...");
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log(`Received file: ${file?.name}, type: ${file?.type}, size: ${file?.size} bytes`);

    // Validate file type
    const validAudioTypes = ["audio/wav", "audio/mp3", "audio/mpeg", "audio/webm", "audio/ogg"];
    const validVideoTypes = ["video/mp4", "video/webm", "video/quicktime"];

    const isAudio = validAudioTypes.includes(file.type);
    const isVideo = validVideoTypes.includes(file.type);

    if (!isAudio && !isVideo) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Supported formats: WAV, MP3, MP4, WebM, OGG, QuickTime` },
        { status: 400 }
      );
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds 50MB limit (received ${(file.size / 1024 / 1024).toFixed(2)}MB)` },
        { status: 400 }
      );
    }

    // Convert file to buffer
    console.log("Converting file to buffer...");
    const arrayBuffer = await file.arrayBuffer();
    console.log(`Array buffer size: ${arrayBuffer.byteLength} bytes`);
    const buffer = Buffer.from(arrayBuffer);
    console.log(`Buffer size: ${buffer.length} bytes`);

    // Upload to S3 for storage
    console.log("Starting file upload to S3...");
    const s3Key = `transcripts/${currentUser.id || currentUser.userId}/${Date.now()}-${file.name}`;
    const uploadResponse = await uploadToS3(buffer, {
      folder: "transcripts",
      publicId: `${currentUser.id || currentUser.userId}/${Date.now()}-${file.name}`,
      fileType: file.type
    });
    console.log("Successfully uploaded to S3:", uploadResponse);

    // Get a signed URL for the uploaded file
    const fileUrl = uploadResponse.secure_url;
    console.log("Generated URL for S3 file:", fileUrl);

    // Transcribe with Deepgram
    console.log("Starting Deepgram transcription...");
    const transcriptionResult = await transcribeWithDeepgram(buffer, file.type, file.name);
    console.log("Deepgram transcription complete");

    // Generate formatted transcript
    const formattedTranscript = await generateFormattedTranscript(transcriptionResult);
    console.log("Generated formatted transcript");

    // Generate analysis with Gemini
    console.log("Generating analysis with Gemini...");
    const analysisPrompt = `
      You are an expert sales coach analyzing a sales call transcript.
      Analyze this transcript and provide:
      1. A concise summary (2-3 sentences)
      2. 3-5 key points
      3. Overall sentiment (positive, neutral, or negative)
      4. Main topics discussed
      5. 2-3 action items or follow-ups

      IMPORTANT: You must respond with ONLY a JSON object in this exact format, with no additional text or explanation:
      {
        "summary": "string",
        "keyPoints": ["string", "string", ...],
        "sentiment": "string",
        "topics": ["string", "string", ...],
        "actionItems": ["string", "string", ...]
      }

      Here's the transcript to analyze:
      ${transcriptionResult.text}
    `;

    const analysisResponse = await generateGeminiResponse(analysisPrompt, [], 'chat');
    console.log("Gemini analysis complete");

    let analysis;
    try {
      // Try to parse the JSON response
      // First, clean the response to handle potential markdown code blocks
      const cleanedResponse = analysisResponse.response
        .replace(/```json\n?|\n?```/g, '') // Remove markdown code blocks
        .trim();

      // Find the first { and the last } to extract just the JSON part
      const firstBrace = cleanedResponse.indexOf('{');
      const lastBrace = cleanedResponse.lastIndexOf('}');

      if (firstBrace !== -1 && lastBrace !== -1) {
        const jsonPart = cleanedResponse.substring(firstBrace, lastBrace + 1);
        analysis = JSON.parse(jsonPart);
      } else {
        throw new Error('No valid JSON object found in response');
      }
    } catch (error) {
      console.error('Failed to parse Gemini analysis response:', error);
      console.error('Raw response:', analysisResponse.response);
      // Fallback to a simple analysis
      analysis = {
        summary: "Automated analysis could not be generated.",
        keyPoints: ["Analysis failed"],
        sentiment: "neutral",
        topics: ["conversation"],
        actionItems: ["Review transcript manually"]
      };
    }

    // Generate a title for the transcript
    console.log("Generating title...");
    let title = file.name.replace(/\.[^/.]+$/, ""); // Default to filename without extension

    // Only attempt to generate a title if we have transcript text
    if (transcriptionResult.text && transcriptionResult.text.trim().length > 0) {
      const titlePrompt = `
        Generate a very short, concise title (maximum 5 words) that captures the main topic of this transcript.
        Don't use quotes or special characters. The title should be simple and descriptive.

        Transcript: ${transcriptionResult.text.substring(0, 1000)}
      `;

      try {
        const titleResponse = await generateGeminiResponse(titlePrompt, [], 'chat');
        if (titleResponse.success && titleResponse.response.trim()) {
          title = titleResponse.response.trim();
        }
      } catch (titleError) {
        console.error("Error generating title:", titleError);
        // Keep the default title from filename
      }
    } else {
      console.log("No transcript text available for title generation, using filename");
    }
    console.log("Generated title:", title);

    // Create transcript record in database
    console.log("Creating transcript record in database...");

    // Ensure we have transcript text (required field)
    const transcriptText = transcriptionResult.text || "No transcript available";

    const transcript = await Transcript.create({
      userId: new mongoose.Types.ObjectId(currentUser.id || currentUser.userId),
      title,
      originalFileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      duration: transcriptionResult.metadata.duration,
      transcriptText: transcriptText,
      formattedTranscript: formattedTranscript || "No formatted transcript available",
      analysis,
      metadata: {
        speakers: transcriptionResult.speakers.length || 0,
        words: transcriptionResult.words.length || 0,
        paragraphs: transcriptionResult.paragraphs.length || 0,
        channels: transcriptionResult.metadata.channels || 1
      },
      s3Key: uploadResponse.public_id || s3Key
    });
    console.log("Transcript record created:", transcript._id);

    // Track token usage
    try {
      const userId = currentUser.id || currentUser.userId;

      if (!userId) {
        throw new Error("User ID is required for token tracking");
      }

      // Calculate token usage based on transcript length (with fallback for empty transcripts)
      const transcriptLength = transcriptionResult.text?.length || 0;
      const transcriptTokens = Math.ceil(transcriptLength / 4);

      // Calculate tokens based on duration (with fallback for missing duration)
      const duration = transcriptionResult.metadata?.duration || 0;
      const durationMinutes = duration / 60;
      const durationBasedTokens = Math.ceil(durationMinutes * TOKEN_COSTS.TRANSCRIPTION_PER_MINUTE);

      // Use the larger of the base cost, transcript-based tokens, or duration-based tokens
      const promptTokens = Math.max(
        TOKEN_COSTS.AUDIO_RECORDING,
        transcriptTokens,
        durationBasedTokens
      );

      console.log(`Token calculation: max(${TOKEN_COSTS.AUDIO_RECORDING}, ${transcriptTokens}, ${durationBasedTokens}) = ${promptTokens}`);

      // Update token usage in the database
      await updateTokenUsage(
        userId.toString(), // Ensure userId is a string
        promptTokens,
        0
      );

      console.log(`[TOKEN-TRACKING] User ${userId} used ${promptTokens} tokens for Deepgram transcription`);
    } catch (tokenError) {
      console.error("Error tracking token usage for transcription:", tokenError);
      // Don't throw the error - just log it so the transcription process can continue
    }

    return NextResponse.json({
      success: true,
      transcript: {
        id: transcript._id,
        title: transcript.title,
        text: transcript.transcriptText,
        formattedTranscript: transcript.formattedTranscript,
        analysis: transcript.analysis,
        metadata: transcript.metadata,
        fileUrl,
        duration: transcript.duration
      }
    });
  } catch (error: any) {
    console.error("Deepgram transcription error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to transcribe file",
        details: error.message || "Unknown error",
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
