import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { getCurrentUser } from '@/lib/auth';
import { saveFile, generateFileSummary } from '@/lib/file-utils';
import File from '@/models/File';

// Get all files for the current user
export async function GET(request: NextRequest) {
  try {
    // Get current user from token
    const currentUser = getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Connect to the database
    await dbConnect();

    // Find all files for the user
    const files = await File.find({ userId: currentUser.userId })
      .sort({ createdAt: -1 })
      .select('_id originalName fileType fileSize summary createdAt');

    return NextResponse.json({
      success: true,
      files,
    });
  } catch (error: any) {
    console.error('Get files error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while fetching files' },
      { status: 500 }
    );
  }
}

// Upload a new file
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

    // Connect to the database
    await dbConnect();

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Get file details
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const originalName = file.name;
    const fileType = file.type;

    // Save the file
    const fileRecord = await saveFile(buffer, originalName, fileType, currentUser.userId);

    // Generate a summary for text-based files
    if (fileType.includes('text') || fileType.includes('pdf') || fileType.includes('document')) {
      const summary = await generateFileSummary(fileRecord.filePath, fileType);
      fileRecord.summary = summary;
      await fileRecord.save();
    }

    return NextResponse.json({
      success: true,
      file: {
        id: fileRecord._id,
        originalName: fileRecord.originalName,
        fileType: fileRecord.fileType,
        fileSize: fileRecord.fileSize,
        summary: fileRecord.summary,
        createdAt: fileRecord.createdAt,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Upload file error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while uploading file' },
      { status: 500 }
    );
  }
}
