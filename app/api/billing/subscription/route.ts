import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import { getCurrentUser } from "@/lib/auth";
import User from "@/models/User";
import Subscription from "@/models/Subscription";
import stripe, { getPlanById } from "@/lib/stripe";
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

    // Check if user already has a Stripe customer ID
    let stripeCustomerId = user.stripeCustomerId;

    // If not, create a new customer in Stripe
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user._id.toString(),
        },
      });

      stripeCustomerId = customer.id;

      // Update user with Stripe customer ID
      await User.updateOne({ _id: user._id }, { $set: { stripeCustomerId } });
    }

    // Get success and cancel URLs from the request or use defaults
    const origin = request.headers.get("origin") || "http://localhost:3000";
    const successUrl = `${origin}/billing?success=true&plan=${planId}`;
    const cancelUrl = `${origin}/billing?canceled=true`;

    // Validate that the price ID exists
    if (!plan.priceId || plan.priceId.startsWith('price_1PbXXXXXXXXXXXXXXXXXXXXX')) {
      return NextResponse.json(
        {
          error: `The price ID for the ${plan.name} plan is not configured correctly. Please contact support.`,
          details: "You need to create products and prices in Stripe and update the environment variables."
        },
        { status: 400 }
      );
    }

    // Check if Stripe API key is properly configured
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.length < 10) {
      console.error("STRIPE_SECRET_KEY is missing or invalid");
      return NextResponse.json(
        {
          error: "Stripe is not properly configured",
          details: "The STRIPE_SECRET_KEY environment variable is missing or invalid. Please check your environment configuration."
        },
        { status: 500 }
      );
    }

    // Create a checkout session
    try {
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        line_items: [
          {
            price: plan.priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId: user._id.toString(),
          planId: plan.id,
        },
      });

      // Return the checkout URL
      return NextResponse.json({ url: session.url });
    } catch (stripeError: any) {
      console.error("Stripe checkout session error:", stripeError);

      // Check if the error is related to the Stripe API key
      const errorMessage = stripeError.message || "Failed to create checkout session";
      const isAuthError = errorMessage.includes("Invalid API Key") ||
                          errorMessage.includes("No API key") ||
                          errorMessage.includes("authentication");

      let details = "There was an issue with the Stripe integration. Please check your Stripe configuration.";

      if (isAuthError) {
        details = "The Stripe API key appears to be invalid or missing. Please check your STRIPE_SECRET_KEY environment variable.";
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

    // Check if Stripe API key is properly configured
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.length < 10) {
      console.error("STRIPE_SECRET_KEY is missing or invalid");
      return NextResponse.json(
        {
          error: "Stripe is not properly configured",
          details: "The STRIPE_SECRET_KEY environment variable is missing or invalid. Please check your environment configuration."
        },
        { status: 500 }
      );
    }

    // Handle different actions
    try {
      switch (action) {
        case "cancel":
          try {
            // Cancel subscription at period end
            await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
              cancel_at_period_end: true,
            });
          } catch (stripeError) {
            console.error("Stripe error when canceling subscription:", stripeError);
            // Continue with database update even if Stripe fails
            console.log("Proceeding with database update despite Stripe error");
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
            // Reactivate subscription
            await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
              cancel_at_period_end: false,
            });
          } catch (stripeError) {
            console.error("Stripe error when reactivating subscription:", stripeError);
            // Continue with database update even if Stripe fails
            console.log("Proceeding with database update despite Stripe error");
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
