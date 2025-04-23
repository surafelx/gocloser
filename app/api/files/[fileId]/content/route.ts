import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { getCurrentUser } from '@/lib/auth';
import { getFileById } from '@/lib/file-utils';
import fs from 'fs';
import path from 'path';

// Get the content of a file
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
      return NextResponse.json(
        { error: 'File content has been deleted', summary: file.summary },
        { status: 404 }
      );
    }

    // Read the file content
    const fileContent = fs.readFileSync(file.filePath);
    
    // Create a response with the file content
    const response = new NextResponse(fileContent);
    
    // Set the appropriate content type
    response.headers.set('Content-Type', file.fileType);
    response.headers.set('Content-Disposition', `attachment; filename="${file.originalName}"`);
    
    return response;
  } catch (error: any) {
    console.error('Get file content error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while fetching file content' },
      { status: 500 }
    );
  }
}
