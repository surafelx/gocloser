import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getTokenUsageStats } from '@/lib/token-manager';
import { SUBSCRIPTION_PLANS } from '@/lib/stripe';
import { corsMiddleware } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  // Handle OPTIONS request for CORS preflight
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function GET(request: NextRequest) {
  return corsMiddleware(request, async (req) => {
    try {
      // Get current user from token
      const currentUser = getCurrentUser(req);
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
  });
}
