import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import Subscription from '@/models/Subscription';
import { generateToken, setAuthCookie } from '@/lib/auth';
import { SUBSCRIPTION_PLANS } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    // Connect to the database
    await dbConnect();

    // Parse the request body
    const { googleId, email, name, profilePicture } = await request.json();

    // Validate input
    if (!googleId || !email || !name) {
      return NextResponse.json(
        { error: 'Google ID, email, and name are required' },
        { status: 400 }
      );
    }

    // Find or create user
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      // Update existing user with Google info if needed
      if (!user.googleId) {
        user.googleId = googleId;
        user.profilePicture = profilePicture;
        await user.save();
      }
    } else {
      // Create a new user with Google info
      user = await User.create({
        googleId,
        email,
        name,
        profilePicture,
      });

      // Create a free subscription for the new user
      const freePlan = SUBSCRIPTION_PLANS.FREE;
      const now = new Date();
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      await Subscription.create({
        userId: user._id,
        stripeCustomerId: 'free_plan_' + user._id.toString(),
        stripeSubscriptionId: 'free_plan_' + user._id.toString(),
        stripePriceId: 'free',
        planId: freePlan.id,
        planName: freePlan.name,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: nextMonth,
        cancelAtPeriodEnd: false,
        tokenLimit: freePlan.tokenLimit,
        tokensUsed: 0,
      });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
    });

    // Create response
    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
      },
    });

    // Set auth cookie
    setAuthCookie(response, token);

    return response;
  } catch (error: any) {
    console.error('Google auth error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during Google authentication' },
      { status: 500 }
    );
  }
}
