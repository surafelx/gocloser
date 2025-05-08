import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import Transcript from "@/models/Transcript";
import { deleteFromS3 } from "@/lib/s3";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is authenticated
    const currentUser = getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Connect to the database
    await dbConnect();

    // Get the ID from params
    const id = await params.id;

    // Validate the ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid transcript ID" }, { status: 400 });
    }

    // Get the transcript
    const transcript = await Transcript.findOne({
      _id: id,
      userId: currentUser.id || currentUser.userId,
    }).lean();

    if (!transcript) {
      return NextResponse.json({ error: "Transcript not found" }, { status: 404 });
    }

    // Generate a signed URL for the file if it exists
    let fileUrl = "";
    if (transcript.s3Key) {
      const { getSignedUrl } = await import("@/lib/s3");
      fileUrl = await getSignedUrl(transcript.s3Key);
    }

    // Transform the data for the frontend
    const transformedTranscript = {
      id: transcript._id.toString(),
      title: transcript.title,
      text: transcript.transcriptText,
      formattedTranscript: transcript.formattedTranscript,
      analysis: transcript.analysis,
      metadata: transcript.metadata,
      fileUrl,
      duration: transcript.duration,
      createdAt: transcript.createdAt,
      updatedAt: transcript.updatedAt,
    };

    return NextResponse.json({
      success: true,
      transcript: transformedTranscript,
    });
  } catch (error: any) {
    console.error("Error fetching transcript:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch transcript" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is authenticated
    const currentUser = getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Connect to the database
    await dbConnect();

    // Get the ID from params
    const id = await params.id;

    // Validate the ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid transcript ID" }, { status: 400 });
    }

    // Get the transcript first to get the S3 key
    const transcript = await Transcript.findOne({
      _id: id,
      userId: currentUser.id || currentUser.userId,
    });

    if (!transcript) {
      return NextResponse.json({ error: "Transcript not found" }, { status: 404 });
    }

    // Delete the file from S3 if it exists
    if (transcript.s3Key) {
      try {
        await deleteFromS3(transcript.s3Key);
        console.log("Deleted file from S3:", transcript.s3Key);
      } catch (s3Error) {
        console.error("Error deleting file from S3:", s3Error);
        // Continue with deletion even if S3 deletion fails
      }
    }

    // Delete the transcript from the database
    await Transcript.deleteOne({
      _id: id,
      userId: currentUser.id || currentUser.userId,
    });

    return NextResponse.json({
      success: true,
      message: "Transcript deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting transcript:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete transcript" },
      { status: 500 }
    );
  }
}
