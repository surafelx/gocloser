import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import { getCurrentUser } from "@/lib/auth";
import User from "@/models/User";
import stripe from "@/lib/stripe";
import { ensureMockUserExists, MOCK_USER_ID } from "@/lib/dev-mock-user";

export async function GET(request: NextRequest) {
  try {
    const currentUser = getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await dbConnect();

    // For development: ensure mock user exists if we're using a mock user
    if (process.env.NODE_ENV !== 'production' &&
        (currentUser.id === MOCK_USER_ID || currentUser.userId === MOCK_USER_ID)) {
      await ensureMockUserExists();
    }

    const user = await User.findById(currentUser.id || currentUser.userId);
    if (!user || !user.stripeCustomerId) {
      return NextResponse.json({ paymentMethods: [] });
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: "card",
    });

    const formattedPaymentMethods = paymentMethods.data.map((method) => ({
      id: method.id,
      brand: method.card!.brand,
      last4: method.card!.last4,
      expMonth: method.card!.exp_month,
      expYear: method.card!.exp_year,
      isDefault: method.metadata.isDefault === "true",
    }));

    return NextResponse.json({ paymentMethods: formattedPaymentMethods });
  } catch (error: any) {
    console.error("Error getting payment methods:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get payment methods" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await dbConnect();

    // For development: ensure mock user exists if we're using a mock user
    if (process.env.NODE_ENV !== 'production' &&
        (currentUser.id === MOCK_USER_ID || currentUser.userId === MOCK_USER_ID)) {
      await ensureMockUserExists();
    }

    const user = await User.findById(currentUser.id || currentUser.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user._id.toString() },
      });
      stripeCustomerId = customer.id;
      await User.findByIdAndUpdate(user._id, { stripeCustomerId });
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
    });

    return NextResponse.json({ clientSecret: setupIntent.client_secret });
  } catch (error: any) {
    console.error("Error creating setup intent:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create setup intent" },
      { status: 500 }
    );
  }
}
