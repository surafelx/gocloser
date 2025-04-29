import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import { getCurrentUser } from "@/lib/auth";
import User from "@/models/User";
import Subscription from "@/models/Subscription";
import { getPlanById, createCheckoutLink, cancelMembership, reactivateMembership } from "@/lib/whop";
import { ensureMockUserExists, MOCK_USER_ID } from "@/lib/dev-mock-user";

// GET endpoint to retrieve subscription details
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const currentUser = getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Connect to database
    await dbConnect();

    // For development: ensure mock user exists if we're using a mock user
    if (
      process.env.NODE_ENV !== "production" &&
      (currentUser.id === MOCK_USER_ID || currentUser.userId === MOCK_USER_ID)
    ) {
      await ensureMockUserExists();
    }

    // Get user's subscription
    const subscription = await Subscription.findOne({
      userId: currentUser.id || currentUser.userId,
    });

    // If no subscription found, return free plan details
    if (!subscription) {
      const freePlan = getPlanById("free");
      return NextResponse.json({
        subscription: {
          planId: "free",
          planName: freePlan.name,
          status: "active",
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          tokenLimit: freePlan.tokenLimit,
          tokensUsed: 0,
        },
      });
    }

    return NextResponse.json({ subscription });
  } catch (error: any) {
    console.error("Error getting subscription:", error);
    return NextResponse.json(
      {
        error: error.message || "An error occurred while getting subscription",
      },
      { status: 500 }
    );
  }
}

// POST endpoint to create a checkout session for subscription
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const currentUser = getCurrentUser(request);

    console.log(currentUser, "How");
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get request body
    const { planId } = await request.json();

    // Validate plan ID
    const plan = getPlanById(planId);
    if (!plan || plan.id === "free") {
      return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
    }

    // Connect to database
    await dbConnect();

    // For development: ensure mock user exists if we're using a mock user
    // if (process.env.NODE_ENV !== 'production' &&
    //     (currentUser.id === MOCK_USER_ID || currentUser.userId === MOCK_USER_ID)) {
    //   await ensureMockUserExists();
    // }

    console.log(currentUser, "Hello");

    // Get user
    const user = await User.findById(currentUser.userId);
    console.log(user, "But here's the user id");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if Whop API key is properly configured
    if (!process.env.WHOP_API_KEY || process.env.WHOP_API_KEY.length < 10) {
      console.error("WHOP_API_KEY is missing or invalid");
      return NextResponse.json(
        {
          error: "Whop is not properly configured",
          details: "The WHOP_API_KEY environment variable is missing or invalid. Please check your environment configuration."
        },
        { status: 500 }
      );
    }

    // Create a checkout link with Whop
    try {
      const checkoutUrl = await createCheckoutLink(
        planId,
        user._id.toString(),
        user.email
      );

      // Return the checkout URL
      return NextResponse.json({ url: checkoutUrl });
    } catch (whopError: any) {
      console.error("Whop checkout link error:", whopError);

      // Check if the error is related to the Whop API key
      const errorMessage = whopError.message || "Failed to create checkout link";
      const isAuthError = errorMessage.includes("Invalid API Key") ||
                        errorMessage.includes("No API key") ||
                        errorMessage.includes("authentication");

      let details = "There was an issue with the Whop integration. Please check your Whop configuration.";

      if (isAuthError) {
        details = "The Whop API key appears to be invalid or missing. Please check your WHOP_API_KEY environment variable.";
      }

      return NextResponse.json(
        {
          error: errorMessage,
          details: details
        },
        { status: 400 }
      );
    }

    // This code is unreachable due to the try/catch above
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      {
        error:
          error.message || "An error occurred while creating checkout session",
      },
      { status: 500 }
    );
  }
}

// PUT endpoint to update subscription (cancel, reactivate, etc.)
export async function PUT(request: NextRequest) {
  try {
    // Check if user is authenticated
    const currentUser = getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get request body
    const { action } = await request.json();

    // Connect to database
    await dbConnect();

    // For development: ensure mock user exists if we're using a mock user
    if (
      process.env.NODE_ENV !== "production" &&
      (currentUser.id === MOCK_USER_ID || currentUser.userId === MOCK_USER_ID)
    ) {
      await ensureMockUserExists();
    }

    // Get user's subscription
    const subscription = await Subscription.findOne({
      userId: currentUser.id || currentUser.userId,
    });
    if (!subscription) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    // Check if Whop API key is properly configured
    if (!process.env.WHOP_API_KEY || process.env.WHOP_API_KEY.length < 10) {
      console.error("WHOP_API_KEY is missing or invalid");
      return NextResponse.json(
        {
          error: "Whop is not properly configured",
          details: "The WHOP_API_KEY environment variable is missing or invalid. Please check your environment configuration."
        },
        { status: 500 }
      );
    }

    // Handle different actions
    try {
      switch (action) {
        case "cancel":
          try {
            // Check if we have a Whop membership ID
            if (subscription.whopMembershipId) {
              // Cancel subscription at period end
              await cancelMembership(subscription.whopMembershipId);
            } else if (subscription.stripeSubscriptionId) {
              // Legacy Stripe subscription - just update the database
              console.log("Legacy Stripe subscription - updating database only");
            } else {
              throw new Error("No valid subscription ID found");
            }
          } catch (apiError) {
            console.error("API error when canceling subscription:", apiError);
            // Continue with database update even if API fails
            console.log("Proceeding with database update despite API error");
          }

          // Update subscription in database
          await Subscription.updateOne(
            { _id: subscription._id },
            { $set: { cancelAtPeriodEnd: true } }
          );

          return NextResponse.json({
            success: true,
            message:
              "Subscription will be canceled at the end of the billing period",
          });

        case "reactivate":
          try {
            // Check if we have a Whop membership ID
            if (subscription.whopMembershipId) {
              // Reactivate subscription
              await reactivateMembership(subscription.whopMembershipId);
            } else if (subscription.stripeSubscriptionId) {
              // Legacy Stripe subscription - just update the database
              console.log("Legacy Stripe subscription - updating database only");
            } else {
              throw new Error("No valid subscription ID found");
            }
          } catch (apiError) {
            console.error("API error when reactivating subscription:", apiError);
            // Continue with database update even if API fails
            console.log("Proceeding with database update despite API error");
          }

          // Update subscription in database
          await Subscription.updateOne(
            { _id: subscription._id },
            { $set: { cancelAtPeriodEnd: false } }
          );

          return NextResponse.json({
            success: true,
            message: "Subscription has been reactivated",
          });

        default:
          return NextResponse.json({ error: "Invalid action" }, { status: 400 });
      }
    } catch (error) {
      console.error("Error processing subscription action:", error);
      return NextResponse.json(
        {
          error: "Failed to process subscription action",
          details: "There was an error processing your request. Please try again later."
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error updating subscription:", error);
    return NextResponse.json(
      {
        error: error.message || "An error occurred while updating subscription",
      },
      { status: 500 }
    );
  }
}
