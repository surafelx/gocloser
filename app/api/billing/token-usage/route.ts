import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import { getCurrentUser } from "@/lib/auth";
import { getTokenUsageStats } from "@/lib/token-manager";
import TokenUsage from "@/models/TokenUsage";
import Subscription from "@/models/Subscription";
import { ensureMockUserExists, MOCK_USER_ID } from "@/lib/dev-mock-user";

// GET endpoint to retrieve token usage statistics
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const currentUser = getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // For development: ensure mock user exists if we're using a mock user
    if (process.env.NODE_ENV !== 'production' &&
        (currentUser.id === MOCK_USER_ID || currentUser.userId === MOCK_USER_ID)) {
      await ensureMockUserExists();
    }

    // Get token usage stats
    const stats = await getTokenUsageStats(currentUser.id || currentUser.userId);

    // Get daily usage for the last 30 days
    await dbConnect();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyUsage = await TokenUsage.aggregate([
      {
        $match: {
          userId: currentUser.id || currentUser.userId,
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          promptTokens: { $sum: "$promptTokens" },
          completionTokens: { $sum: "$completionTokens" },
          totalTokens: { $sum: "$totalTokens" },
          estimatedCost: { $sum: "$estimatedCost" },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
          "_id.day": 1,
        },
      },
    ]);

    // Format daily usage for chart display
    const formattedDailyUsage = dailyUsage.map((day) => {
      const date = new Date(day._id.year, day._id.month - 1, day._id.day);
      return {
        date: date.toISOString().split("T")[0], // YYYY-MM-DD format
        promptTokens: day.promptTokens,
        completionTokens: day.completionTokens,
        totalTokens: day.totalTokens,
        estimatedCost: day.estimatedCost,
      };
    });

    return NextResponse.json({
      stats,
      dailyUsage: formattedDailyUsage,
    });
  } catch (error: any) {
    console.error("Error getting token usage stats:", error);
    return NextResponse.json(
      {
        error:
          error.message || "An error occurred while getting token usage stats",
      },
      { status: 500 }
    );
  }
}

// POST endpoint to add tokens to a subscription (for top-ups)
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const currentUser = getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get request body
    const { additionalTokens } = await request.json();

    // Validate additional tokens
    if (!additionalTokens || additionalTokens <= 0) {
      return NextResponse.json(
        { error: "Invalid token amount" },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // For development: ensure mock user exists if we're using a mock user
    if (process.env.NODE_ENV !== 'production' &&
        (currentUser.id === MOCK_USER_ID || currentUser.userId === MOCK_USER_ID)) {
      await ensureMockUserExists();
    }

    // Get user's subscription
    const subscription = await Subscription.findOne({
      userId: currentUser.id || currentUser.userId,
      status: "active",
    });
    if (!subscription) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    // Update token limit
    await Subscription.updateOne(
      { _id: subscription._id },
      { $inc: { tokenLimit: additionalTokens } }
    );

    // Get updated stats
    const stats = await getTokenUsageStats(currentUser.id || currentUser.userId);

    return NextResponse.json({
      success: true,
      message: `Added ${additionalTokens.toLocaleString()} tokens to your subscription`,
      stats,
    });
  } catch (error: any) {
    console.error("Error adding tokens:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred while adding tokens" },
      { status: 500 }
    );
  }
}
