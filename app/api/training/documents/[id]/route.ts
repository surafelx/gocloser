import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getTrainingDocumentByIdAction } from '@/app/actions/training-actions';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is authenticated
    const currentUser = getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Use server action to get document by ID
    const result = await getTrainingDocumentByIdAction(params.id);

    if (!result.success || !result.document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      document: result.document
    });
  } catch (error: any) {
    console.error('Error getting training document:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while getting training document' },
      { status: 500 }
    );
  }
}
