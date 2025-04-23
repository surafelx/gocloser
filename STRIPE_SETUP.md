# Stripe Setup Instructions

This document provides instructions for setting up Stripe for the subscription functionality in the application.

## Prerequisites

1. A Stripe account (you can create one at [stripe.com](https://stripe.com))
2. Node.js installed on your machine

## Steps to Set Up Stripe

### 1. Get Your Stripe API Keys

1. Log in to your Stripe Dashboard at [dashboard.stripe.com](https://dashboard.stripe.com)
2. Go to Developers > API keys
3. Note down your Publishable key and Secret key
   - For development, use the test keys
   - For production, use the live keys

### 2. Create Products and Prices in Stripe

You can create products and prices in Stripe in two ways:

#### Option 1: Using the Stripe Dashboard

1. Go to Products in your Stripe Dashboard
2. Create the following products and prices:
   - Starter Plan: $29/month
   - Professional Plan: $79/month
   - Team Plan: $199/month
3. Note down the price IDs for each plan (they start with `price_`)

#### Option 2: Using the Provided Script

1. Make sure your Stripe secret key is set in your environment or update it in the script
2. Run the script:
   ```
   node scripts/create-stripe-products.js
   ```
3. The script will output the price IDs for each plan

### 3. Update Your Environment Variables

1. Create a `.env.local` file in the root of your project (or copy from `.env.local.example`)
2. Add the following variables:
   ```
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
   STRIPE_PRICE_STARTER=price_your_starter_price_id
   STRIPE_PRICE_PROFESSIONAL=price_your_professional_price_id
   STRIPE_PRICE_TEAM=price_your_team_price_id
   ```

### 4. Set Up Webhook (Optional for Development)

For production, you'll need to set up a webhook to handle events from Stripe:

1. Go to Developers > Webhooks in your Stripe Dashboard
2. Add an endpoint with your production URL: `https://your-domain.com/api/webhooks/stripe`
3. Select the following events:
   - `checkout.session.completed`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Note down the webhook signing secret
5. Add it to your environment variables:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   ```

## Testing

1. Start your application
2. Go to the billing page
3. Try subscribing to a plan
4. You should be redirected to Stripe Checkout
5. Use Stripe's test card numbers for testing:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`

## Troubleshooting

If you encounter the error "no such price_professional" or similar:

1. Make sure you've created the products and prices in Stripe
2. Check that the price IDs in your environment variables match the ones in Stripe
3. Restart your application after updating the environment variables

For more information, refer to the [Stripe API Documentation](https://stripe.com/docs/api).
