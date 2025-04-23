import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getTrainingDocuments } from '@/app/actions/training-actions';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const currentUser = getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const query = searchParams.get('query');

    // Use server action to get training documents
    const result = await getTrainingDocuments({
      category: category || undefined,
      query: query || undefined
    });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to get training documents' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      documents: result.documents,
      count: result.count
    });
  } catch (error: any) {
    console.error('Error getting training documents:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while getting training documents' },
      { status: 500 }
    );
  }
}
