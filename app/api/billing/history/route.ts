import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { getCurrentUser } from "@/lib/auth";
import User from "@/models/User";
import Payment from "@/models/Payment";
import stripe from "@/lib/stripe";

// GET endpoint to retrieve billing history
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const currentUser = getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Connect to database
    await connectToDatabase();

    // Get user
    const user = await User.findById(currentUser.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get billing history from database
    const payments = await Payment.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(24); // Last 24 payments (2 years for monthly billing)

    return NextResponse.json({ payments });
  } catch (error: any) {
    console.error("Error getting billing history:", error);
    return NextResponse.json(
      {
        error:
          error.message || "An error occurred while getting billing history",
      },
      { status: 500 }
    );
  }
}

// POST endpoint to manually sync billing history from Stripe
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const currentUser = getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Connect to database
    await connectToDatabase();

    // Get user
    const user = await User.findById(currentUser.id);
    if (!user || !user.stripeCustomerId) {
      return NextResponse.json(
        { error: "User not found or no Stripe customer ID" },
        { status: 404 }
      );
    }

    // Get invoices from Stripe
    const invoices = await stripe.invoices.list({
      customer: user.stripeCustomerId,
      limit: 24,
    });

    // Process each invoice
    for (const invoice of invoices.data) {
      // Skip if already in database
      const existingPayment = await Payment.findOne({
        stripeInvoiceId: invoice.id,
      });
      if (existingPayment) continue;

      // Get subscription details
      let planId = "unknown";
      let planName = "Unknown Plan";

      if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(
          invoice.subscription as string
        );
        if (subscription.items.data.length > 0) {
          const priceId = subscription.items.data[0].price.id;

          // Find plan by price ID
          for (const [key, plan] of Object.entries(stripe)) {
            if (
              typeof plan === "object" &&
              plan !== null &&
              "priceId" in plan &&
              plan.priceId === priceId
            ) {
              planId = plan.id;
              planName = plan.name;
              break;
            }
          }
        }
      }

      // Create payment record
      const payment = new Payment({
        userId: user._id,
        stripeCustomerId: user.stripeCustomerId,
        stripeInvoiceId: invoice.id,
        stripePaymentIntentId: invoice.payment_intent || "",
        amount: invoice.amount_paid / 100, // Convert from cents to dollars
        currency: invoice.currency,
        status: invoice.status,
        description: invoice.description || `${planName} Subscription`,
        planId,
        planName,
        billingPeriodStart: new Date(invoice.period_start * 1000),
        billingPeriodEnd: new Date(invoice.period_end * 1000),
        invoiceUrl: invoice.hosted_invoice_url || "",
        receiptUrl: invoice.receipt_url || "",
        createdAt: new Date(invoice.created * 1000),
      });

      await payment.save();
    }

    // Get updated billing history
    const payments = await Payment.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(24);

    return NextResponse.json({
      success: true,
      message: "Billing history synced successfully",
      payments,
    });
  } catch (error: any) {
    console.error("Error syncing billing history:", error);
    return NextResponse.json(
      {
        error:
          error.message || "An error occurred while syncing billing history",
      },
      { status: 500 }
    );
  }
}
