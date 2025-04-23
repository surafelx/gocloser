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
    const { name, email, password } = await request.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Create a new user
    const user = await User.create({
      name,
      email,
      password,
    });

    // Create a free subscription for the user
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

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
    });

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 }
    );

    // Set auth cookie
    setAuthCookie(response, token);

    return response;
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during signup' },
      { status: 500 }
    );
  }
}
