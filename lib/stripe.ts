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
  // FREE plan is kept internally for admin@gocloser.me only
  FREE: {
    id: "free",
    name: "Admin",
    description: "Admin Access Only",
    price: 0,
    priceId: "", // No Stripe price ID for free plan
    tokenLimit: 1000000, // 1M tokens for admin
    features: [
      "Admin access only",
      "Not available to regular users",
    ],
    hasVoiceSupport: true,
    isHidden: true, // Flag to hide this plan from UI
  },
  STARTER: {
    id: "starter",
    name: "Starter",
    description: "Chat + Uploads Only",
    price: 19,
    priceId: "price_1REWoTECvX5ewvciUJ0zM0rc",
    tokenLimit: 500000, // 500k tokens/month
    features: [
      "Gemini chat from file uploads",
      "~500K tokens/month",
      "No voice support",
    ],
    hasVoiceSupport: false,
  },
  PROFESSIONAL: {
    id: "professional",
    name: "Pro",
    description: "Chat + Uploads + 48 hrs Voice",
    price: 39,
    priceId: "price_1REWoUECvX5ewvci8lNRIlil",
    tokenLimit: 1000000, // 1M tokens/month
    features: [
      "Everything in Starter +",
      "48 hours of Whisper transcription/month",
      "~1M tokens/month",
      "Audio/video uploads",
      "Priority support",
    ],
    hasVoiceSupport: true,
    voiceHoursLimit: 48, // 48 hours of voice transcription
  },
};

// Helper function to get plan details by ID
export function getPlanById(planId: string) {
  // Special case for admin@gocloser.me
  if (planId === "free") {
    return SUBSCRIPTION_PLANS.FREE;
  }

  const plans = Object.values(SUBSCRIPTION_PLANS);
  return plans.find((plan) => plan.id === planId) || SUBSCRIPTION_PLANS.STARTER;
}

// Helper function to get plan details by Stripe Price ID
export function getPlanByPriceId(priceId: string) {
  // Special case for admin@gocloser.me
  if (priceId === SUBSCRIPTION_PLANS.FREE.priceId) {
    return SUBSCRIPTION_PLANS.FREE;
  }

  const plans = Object.values(SUBSCRIPTION_PLANS);
  return (
    plans.find((plan) => plan.priceId === priceId) || SUBSCRIPTION_PLANS.STARTER
  );
}

export default stripe;
