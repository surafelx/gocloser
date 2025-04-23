import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { getCurrentUser } from '@/lib/auth';
import { getFileById, deleteFile } from '@/lib/file-utils';
import fs from 'fs';

// Get a specific file by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
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

    // Find the file by ID and user ID
    const file = await getFileById(params.fileId, currentUser.userId);

    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Check if the file exists on disk
    if (!fs.existsSync(file.filePath)) {
      return NextResponse.json({
        success: true,
        file: {
          id: file._id,
          originalName: file.originalName,
          fileType: file.fileType,
          fileSize: file.fileSize,
          summary: file.summary,
          createdAt: file.createdAt,
        },
        message: 'File content has been deleted, but metadata is available',
      });
    }

    // Return file metadata
    return NextResponse.json({
      success: true,
      file: {
        id: file._id,
        originalName: file.originalName,
        fileType: file.fileType,
        fileSize: file.fileSize,
        summary: file.summary,
        createdAt: file.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Get file error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while fetching file' },
      { status: 500 }
    );
  }
}

// Delete a file
export async function DELETE(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
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

    // Delete the file
    await deleteFile(params.fileId, currentUser.userId);

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete file error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while deleting file' },
      { status: 500 }
    );
  }
}
