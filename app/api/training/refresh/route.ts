import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { refreshTrainingData } from '@/app/actions/training-actions';

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and authorized
    const currentUser = getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Use server action to refresh training documents
    const result = await refreshTrainingData();

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      count: result.count
    });
  } catch (error: any) {
    console.error('Error refreshing training data:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while refreshing training data' },
      { status: 500 }
    );
  }
}
