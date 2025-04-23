import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getTokenUsageStats } from '@/lib/token-manager';
import { SUBSCRIPTION_PLANS } from '@/lib/stripe';

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

    // Get token usage stats for the user
    console.log(`Getting token usage stats for user ${currentUser.userId}`);
    const stats = await getTokenUsageStats(currentUser.userId);
    console.log(`Token usage stats for user ${currentUser.userId}:`, stats);

    return NextResponse.json({
      success: true,
      ...stats
    });
  } catch (error: any) {
    console.error('Get token usage stats error:', error);
    return NextResponse.json(
      {
        error: error.message || 'An error occurred while fetching token usage stats',
        // Provide default values for the client
        tokenLimit: SUBSCRIPTION_PLANS.FREE.tokenLimit,
        tokensUsed: 0,
        tokensRemaining: SUBSCRIPTION_PLANS.FREE.tokenLimit,
        percentageUsed: 0,
        planId: 'free',
        planName: 'Free'
      },
      { status: 500 }
    );
  }
}
