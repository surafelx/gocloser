import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import Transcript from "@/models/Transcript";

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const currentUser = getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Connect to the database
    await dbConnect();
    
    // Get all transcripts for the current user
    const transcripts = await Transcript.find({
      userId: currentUser.id || currentUser.userId,
    })
    .sort({ createdAt: -1 }) // Sort by creation date, newest first
    .lean();
    
    // Transform the data for the frontend
    const transformedTranscripts = transcripts.map(transcript => ({
      id: transcript._id.toString(),
      title: transcript.title,
      originalFileName: transcript.originalFileName,
      fileType: transcript.fileType,
      duration: transcript.duration,
      metadata: transcript.metadata,
      analysis: {
        sentiment: transcript.analysis.sentiment,
        topics: transcript.analysis.topics,
      },
      createdAt: transcript.createdAt,
      updatedAt: transcript.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      transcripts: transformedTranscripts,
    });
  } catch (error: any) {
    console.error("Error fetching transcripts:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch transcripts" },
      { status: 500 }
    );
  }
}
