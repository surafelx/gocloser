import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { updateAllChatTitles } from '@/app/actions/update-chat-titles';

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

    const userId = currentUser.id || currentUser.userId;
    
    // Update all chat titles
    const result = await updateAllChatTitles(userId);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Update chat titles error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while updating chat titles' },
      { status: 500 }
    );
  }
}
