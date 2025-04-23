import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { connectToDatabase } from '@/lib/mongoose';
import stripe, { getPlanByPriceId } from '@/lib/stripe';
import User from '@/models/User';
import Subscription from '@/models/Subscription';
import Payment from '@/models/Payment';
import { resetTokenUsage } from '@/lib/token-manager';

// Stripe webhook secret for verifying events
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = headers().get('stripe-signature') || '';

    let event;

    // Verify webhook signature
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error handling webhook:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while handling webhook' },
      { status: 500 }
    );
  }
}

// Handle checkout.session.completed event
async function handleCheckoutSessionCompleted(session: any) {
  // Get user ID from metadata
  const userId = session.metadata.userId;
  if (!userId) return;

  // Get subscription ID
  const subscriptionId = session.subscription;
  if (!subscriptionId) return;

  // Get subscription details from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  // Get price ID and plan details
  const priceId = subscription.items.data[0].price.id;
  const plan = getPlanByPriceId(priceId);
  
  // Get user
  const user = await User.findById(userId);
  if (!user) return;
  
  // Create or update subscription in database
  const existingSubscription = await Subscription.findOne({ userId });
  
  if (existingSubscription) {
    // Update existing subscription
    await Subscription.updateOne(
      { _id: existingSubscription._id },
      {
        $set: {
          stripeSubscriptionId: subscriptionId,
          stripePriceId: priceId,
          planId: plan.id,
          planName: plan.name,
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          tokenLimit: plan.tokenLimit,
          tokensUsed: 0, // Reset token usage on new subscription
        }
      }
    );
  } else {
    // Create new subscription
    const newSubscription = new Subscription({
      userId,
      stripeCustomerId: user.stripeCustomerId,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId,
      planId: plan.id,
      planName: plan.name,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
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
}

// Handle invoice.paid event
async function handleInvoicePaid(invoice: any) {
  // Get customer ID
  const customerId = invoice.customer;
  if (!customerId) return;
  
  // Get user by Stripe customer ID
  const user = await User.findOne({ stripeCustomerId: customerId });
  if (!user) return;
  
  // Get subscription ID
  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return;
  
  // Get subscription details from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  // Get price ID and plan details
  const priceId = subscription.items.data[0].price.id;
  const plan = getPlanByPriceId(priceId);
  
  // Update subscription in database
  const existingSubscription = await Subscription.findOne({ 
    userId: user._id,
    stripeSubscriptionId: subscriptionId
  });
  
  if (existingSubscription) {
    // Update existing subscription
    await Subscription.updateOne(
      { _id: existingSubscription._id },
      {
        $set: {
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          tokensUsed: 0, // Reset token usage on renewal
        }
      }
    );
    
    // Reset token usage
    await resetTokenUsage(user._id.toString());
  }
  
  // Create payment record
  const existingPayment = await Payment.findOne({ stripeInvoiceId: invoice.id });
  if (!existingPayment) {
    const payment = new Payment({
      userId: user._id,
      stripeCustomerId: customerId,
      stripeInvoiceId: invoice.id,
      stripePaymentIntentId: invoice.payment_intent || '',
      amount: invoice.amount_paid / 100, // Convert from cents to dollars
      currency: invoice.currency,
      status: invoice.status,
      description: invoice.description || `${plan.name} Subscription`,
      planId: plan.id,
      planName: plan.name,
      billingPeriodStart: new Date(invoice.period_start * 1000),
      billingPeriodEnd: new Date(invoice.period_end * 1000),
      invoiceUrl: invoice.hosted_invoice_url || '',
      receiptUrl: invoice.receipt_url || '',
      createdAt: new Date(invoice.created * 1000),
    });
    
    await payment.save();
  }
  
  // Update user's subscription status
  await User.updateOne(
    { _id: user._id },
    { $set: { hasActiveSubscription: true } }
  );
}

// Handle invoice.payment_failed event
async function handleInvoicePaymentFailed(invoice: any) {
  // Get customer ID
  const customerId = invoice.customer;
  if (!customerId) return;
  
  // Get user by Stripe customer ID
  const user = await User.findOne({ stripeCustomerId: customerId });
  if (!user) return;
  
  // Get subscription ID
  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return;
  
  // Update subscription status in database
  await Subscription.updateOne(
    { userId: user._id, stripeSubscriptionId: subscriptionId },
    { $set: { status: 'past_due' } }
  );
}

// Handle customer.subscription.updated event
async function handleSubscriptionUpdated(subscription: any) {
  // Get customer ID
  const customerId = subscription.customer;
  if (!customerId) return;
  
  // Get user by Stripe customer ID
  const user = await User.findOne({ stripeCustomerId: customerId });
  if (!user) return;
  
  // Get subscription from database
  const existingSubscription = await Subscription.findOne({ 
    userId: user._id,
    stripeSubscriptionId: subscription.id
  });
  
  if (existingSubscription) {
    // Get price ID and plan details if price has changed
    let planId = existingSubscription.planId;
    let planName = existingSubscription.planName;
    let tokenLimit = existingSubscription.tokenLimit;
    
    const newPriceId = subscription.items.data[0].price.id;
    if (newPriceId !== existingSubscription.stripePriceId) {
      const plan = getPlanByPriceId(newPriceId);
      planId = plan.id;
      planName = plan.name;
      tokenLimit = plan.tokenLimit;
    }
    
    // Update subscription in database
    await Subscription.updateOne(
      { _id: existingSubscription._id },
      {
        $set: {
          stripePriceId: newPriceId,
          planId,
          planName,
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          tokenLimit,
        }
      }
    );
    
    // Update user's subscription status
    await User.updateOne(
      { _id: user._id },
      { $set: { hasActiveSubscription: subscription.status === 'active' } }
    );
  }
}

// Handle customer.subscription.deleted event
async function handleSubscriptionDeleted(subscription: any) {
  // Get customer ID
  const customerId = subscription.customer;
  if (!customerId) return;
  
  // Get user by Stripe customer ID
  const user = await User.findOne({ stripeCustomerId: customerId });
  if (!user) return;
  
  // Update subscription in database
  await Subscription.updateOne(
    { userId: user._id, stripeSubscriptionId: subscription.id },
    { $set: { status: 'canceled' } }
  );
  
  // Update user's subscription status
  await User.updateOne(
    { _id: user._id },
    { $set: { hasActiveSubscription: false } }
  );
}
