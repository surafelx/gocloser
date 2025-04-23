import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';
import { ensureMockUserExists, MOCK_USER_ID } from '@/lib/dev-mock-user';

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

    // For development: ensure mock user exists if we're using a mock user
    if (process.env.NODE_ENV !== 'production' &&
        (currentUser.id === MOCK_USER_ID || currentUser.userId === MOCK_USER_ID)) {
      await ensureMockUserExists();
    }

    // Find the user by ID
    const user = await User.findById(currentUser.id || currentUser.userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return user data
    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error: any) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while fetching user data' },
      { status: 500 }
    );
  }
}
