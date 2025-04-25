import Stripe from "stripe";

// Initialize Stripe with the API key
const stripeAPIKey = process.env.STRIPE_SECRET_KEY;

// Check if Stripe API key is available
if (!stripeAPIKey || stripeAPIKey.length < 10) {
  console.error(
    "STRIPE_SECRET_KEY is missing or invalid. Please check your environment variables."
  );
}

// Initialize Stripe with proper error handling
let stripe: Stripe;
try {
  // @ts-ignore - We're handling the API version compatibility issue
  stripe = new Stripe(stripeAPIKey, {
    apiVersion: "2023-10-16", // Use a stable API version
  });
} catch (error) {
  console.error("Failed to initialize Stripe:", error);
  // Create a dummy Stripe instance that will throw clear errors
  // @ts-ignore - This is intentional for graceful error handling
  stripe = new Proxy(
    {},
    {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      get: function (_target, _prop) {
        return () => {
          throw new Error(
            "Stripe is not properly initialized. Please check your STRIPE_SECRET_KEY environment variable."
          );
        };
      },
    }
  );
}

// Define subscription plans
export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: "free",
    name: "Free",
    description: "Basic access with limited features",
    price: 0,
    priceId: "", // No Stripe price ID for free plan
    tokenLimit: 100000, // 100k tokens for free users
    features: [
      "Limited AI coaching sessions",
      "Basic sales call analysis",
      "2 file uploads per month",
      "Community support",
    ],
  },
  STARTER: {
    id: "starter",
    name: "Starter",
    description: "Perfect for individual sales professionals",
    price: 29,
    priceId: "price_1REWoTECvX5ewvciUJ0zM0rc",

    tokenLimit: 100000,
    features: [
      "Unlimited AI coaching sessions",
      "Basic sales call analysis",
      "5 file uploads per month",
      "Email support",
    ],
  },
  PROFESSIONAL: {
    id: "professional",
    name: "Professional",
    description: "For serious sales professionals",
    price: 79,
    priceId: "price_1REWoUECvX5ewvci8lNRIlil",
    tokenLimit: 500000,
    features: [
      "Everything in Starter",
      "Advanced performance analytics",
      "Unlimited file uploads",
      "Priority support",
      "Custom training data integration",
    ],
  },
  TEAM: {
    id: "team",
    name: "Team",
    description: "For sales teams and organizations",
    price: 199,
    priceId: "price_1REWoVECvX5ewvciTRxQ0YKo",
    tokenLimit: 2000000,
    features: [
      "Everything in Professional",
      "Team analytics dashboard",
      "Admin controls",
      "Dedicated account manager",
      "Custom AI training",
      "API access",
    ],
  },
};

// Helper function to get plan details by ID
export function getPlanById(planId: string) {
  const plans = Object.values(SUBSCRIPTION_PLANS);
  return plans.find((plan) => plan.id === planId) || SUBSCRIPTION_PLANS.FREE;
}

// Helper function to get plan details by Stripe Price ID
export function getPlanByPriceId(priceId: string) {
  const plans = Object.values(SUBSCRIPTION_PLANS);
  return (
    plans.find((plan) => plan.priceId === priceId) || SUBSCRIPTION_PLANS.FREE
  );
}

export default stripe;
