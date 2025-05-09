import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import connectToDatabase from '@/lib/mongoose';
import { getPlanByWhopPlanId, verifyWebhookSignature } from '@/lib/whop';
import User from '@/models/User';
import Subscription from '@/models/Subscription';
import Payment from '@/models/Payment';
import { resetTokenUsage } from '@/lib/token-manager';

// Whop webhook secret for verifying events
const webhookSecret = process.env.WHOP_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = headers().get('whop-signature') || '';

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature, webhookSecret)) {
      console.error('Webhook signature verification failed');
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    // Parse the webhook payload
    const event = JSON.parse(body);

    // Connect to database
    await connectToDatabase();

    // Handle different event types
    switch (event.event) {
      case 'membership.created':
        await handleMembershipCreated(event.data);
        break;

      case 'membership.updated':
        await handleMembershipUpdated(event.data);
        break;

      case 'membership.canceled':
        await handleMembershipCanceled(event.data);
        break;

      case 'membership.payment.succeeded':
        await handlePaymentSucceeded(event.data);
        break;

      case 'membership.payment.failed':
        await handlePaymentFailed(event.data);
        break;
    }

    // Note: We can't set cookies in webhook responses as they're server-to-server
    // Cookies will be set when the user next checks their subscription status
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error handling webhook:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while handling webhook' },
      { status: 500 }
    );
  }
}

// Handle membership.created event
async function handleMembershipCreated(membership: any) {
  try {
    // Get user ID from metadata
    const userId = membership.metadata?.userId;
    if (!userId) {
      console.error('No userId found in membership metadata');
      return;
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      console.error(`User not found: ${userId}`);
      return;
    }

    // Update user with Whop user ID if not already set
    if (!user.whopUserId) {
      user.whopUserId = membership.user.id;
      await user.save();
    }

    // Get plan details
    const plan = getPlanByWhopPlanId(membership.plan.id);

    // Check if subscription already exists
    const existingSubscription = await Subscription.findOne({ userId });

    if (existingSubscription) {
      // Update existing subscription
      existingSubscription.whopUserId = membership.user.id;
      existingSubscription.whopMembershipId = membership.id;
      existingSubscription.whopPlanId = membership.plan.id;
      existingSubscription.planId = plan.id;
      existingSubscription.planName = plan.name;
      existingSubscription.status = membership.status === 'active' ? 'active' : 'past_due';
      existingSubscription.currentPeriodStart = new Date(membership.current_period_start);
      existingSubscription.currentPeriodEnd = new Date(membership.current_period_end);
      existingSubscription.cancelAtPeriodEnd = membership.cancel_at_period_end || false;
      existingSubscription.tokenLimit = plan.tokenLimit;

      await existingSubscription.save();
    } else {
      // Create new subscription
      const newSubscription = new Subscription({
        userId,
        whopUserId: membership.user.id,
        whopMembershipId: membership.id,
        whopPlanId: membership.plan.id,
        planId: plan.id,
        planName: plan.name,
        status: membership.status === 'active' ? 'active' : 'past_due',
        currentPeriodStart: new Date(membership.current_period_start),
        currentPeriodEnd: new Date(membership.current_period_end),
        cancelAtPeriodEnd: membership.cancel_at_period_end || false,
        tokenLimit: plan.tokenLimit,
        tokensUsed: 0,
      });

      await newSubscription.save();
    }

    // Update user's subscription status
    await User.updateOne(
      { _id: userId },
      { $set: { hasActiveSubscription: true } }
    );
  } catch (error) {
    console.error('Error handling membership.created:', error);
  }
}

// Handle membership.updated event
async function handleMembershipUpdated(membership: any) {
  try {
    // Find user by Whop user ID
    const user = await User.findOne({ whopUserId: membership.user.id });
    if (!user) {
      console.error(`User not found for Whop user ID: ${membership.user.id}`);
      return;
    }

    // Get plan details
    const plan = getPlanByWhopPlanId(membership.plan.id);

    // Update subscription
    const subscription = await Subscription.findOne({
      userId: user._id,
      whopMembershipId: membership.id
    });

    if (subscription) {
      subscription.planId = plan.id;
      subscription.planName = plan.name;
      subscription.status = membership.status === 'active' ? 'active' : 'past_due';
      subscription.currentPeriodStart = new Date(membership.current_period_start);
      subscription.currentPeriodEnd = new Date(membership.current_period_end);
      subscription.cancelAtPeriodEnd = membership.cancel_at_period_end || false;
      subscription.tokenLimit = plan.tokenLimit;

      await subscription.save();

      // Update user's subscription status
      await User.updateOne(
        { _id: user._id },
        { $set: { hasActiveSubscription: membership.status === 'active' } }
      );
    }
  } catch (error) {
    console.error('Error handling membership.updated:', error);
  }
}

// Handle membership.canceled event
async function handleMembershipCanceled(membership: any) {
  try {
    // Find user by Whop user ID
    const user = await User.findOne({ whopUserId: membership.user.id });
    if (!user) {
      console.error(`User not found for Whop user ID: ${membership.user.id}`);
      return;
    }

    // Update subscription
    await Subscription.updateOne(
      { userId: user._id, whopMembershipId: membership.id },
      {
        $set: {
          status: 'canceled',
          cancelAtPeriodEnd: true
        }
      }
    );

    // Update user's subscription status
    await User.updateOne(
      { _id: user._id },
      { $set: { hasActiveSubscription: false } }
    );
  } catch (error) {
    console.error('Error handling membership.canceled:', error);
  }
}

// Handle membership.payment.succeeded event
async function handlePaymentSucceeded(payment: any) {
  try {
    // Find user by Whop user ID
    const user = await User.findOne({ whopUserId: payment.user.id });
    if (!user) {
      console.error(`User not found for Whop user ID: ${payment.user.id}`);
      return;
    }

    // Get membership details
    const membership = payment.membership;

    // Get plan details
    const plan = getPlanByWhopPlanId(membership.plan.id);

    // Create payment record
    const existingPayment = await Payment.findOne({ whopPaymentId: payment.id });
    if (!existingPayment) {
      const newPayment = new Payment({
        userId: user._id,
        whopUserId: payment.user.id,
        whopMembershipId: membership.id,
        whopPaymentId: payment.id,
        amount: payment.amount / 100, // Convert from cents to dollars
        currency: payment.currency || 'usd',
        status: 'paid',
        description: `${plan.name} Subscription`,
        planId: plan.id,
        planName: plan.name,
        billingPeriodStart: new Date(membership.current_period_start),
        billingPeriodEnd: new Date(membership.current_period_end),
        invoiceUrl: payment.receipt_url || '',
        receiptUrl: payment.receipt_url || '',
        createdAt: new Date(payment.created_at),
      });

      await newPayment.save();
    }

    // Reset token usage if this is a renewal payment
    if (payment.type === 'renewal') {
      await resetTokenUsage(user._id.toString());
    }

    // Update user's subscription status
    await User.updateOne(
      { _id: user._id },
      { $set: { hasActiveSubscription: true } }
    );
  } catch (error) {
    console.error('Error handling membership.payment.succeeded:', error);
  }
}

// Handle membership.payment.failed event
async function handlePaymentFailed(payment: any) {
  try {
    // Find user by Whop user ID
    const user = await User.findOne({ whopUserId: payment.user.id });
    if (!user) {
      console.error(`User not found for Whop user ID: ${payment.user.id}`);
      return;
    }

    // Get membership details
    const membership = payment.membership;

    // Update subscription status
    await Subscription.updateOne(
      { userId: user._id, whopMembershipId: membership.id },
      { $set: { status: 'past_due' } }
    );
  } catch (error) {
    console.error('Error handling membership.payment.failed:', error);
  }
}
