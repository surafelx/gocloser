import axios from "axios";

// Initialize Whop with the API key
const whopAPIKey = process.env.WHOP_API_KEY;
const whopCompanyId = process.env.WHOP_COMPANY_ID;

// Check if Whop API key is available
if (!whopAPIKey || whopAPIKey.length < 10) {
  console.error(
    "WHOP_API_KEY is missing or invalid. Please check your environment variables."
  );
}

// Check if Whop Company ID is available
if (!whopCompanyId) {
  console.error(
    "WHOP_COMPANY_ID is missing. Please check your environment variables."
  );
}

// Create Whop API client
const whopClient = axios.create({
  baseURL: 'https://api.whop.com/api/v2',
  headers: {
    'Authorization': `Bearer ${whopAPIKey}`,
    'Content-Type': 'application/json',
  }
});

// Define subscription plans
export const SUBSCRIPTION_PLANS = {
  // FREE plan is kept internally for admin@gocloser.me only
  FREE: {
    id: "free",
    name: "Admin",
    description: "Admin Access Only",
    price: 0,
    whopPlanId: "plan_N3GriEsQel2QE", // Free plan ID from checkout link
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
    whopPlanId: "plan_ieiZ2npe7k6gp", // Starter plan ID from checkout link
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
    whopPlanId: "plan_IeJ2izkJfj2L3", // Pro plan ID from checkout link
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

// Helper function to get plan details by Whop Plan ID
export function getPlanByWhopPlanId(whopPlanId: string) {
  // Special case for admin@gocloser.me
  if (whopPlanId === SUBSCRIPTION_PLANS.FREE.whopPlanId) {
    return SUBSCRIPTION_PLANS.FREE;
  }

  const plans = Object.values(SUBSCRIPTION_PLANS);
  return (
    plans.find((plan) => plan.whopPlanId === whopPlanId) || SUBSCRIPTION_PLANS.STARTER
  );
}

// Whop API functions
export async function createCheckoutLink(planId: string, userId: string, email: string) {
  try {
    const plan = getPlanById(planId);

    if (!plan.whopPlanId) {
      throw new Error("Invalid plan ID or free plan selected");
    }

    // Use the plan-specific checkout links
    let checkoutUrl;

    switch (planId) {
      case "free":
        checkoutUrl = `https://whop.com/checkout/plan_N3GriEsQel2QE?d2c=true&email=${encodeURIComponent(email)}&metadata=${encodeURIComponent(JSON.stringify({ userId, planId }))}`;
        console.log("Creating checkout link for Free plan");
        break;
      case "starter":
        checkoutUrl = `https://whop.com/checkout/plan_ieiZ2npe7k6gp?d2c=true&email=${encodeURIComponent(email)}&metadata=${encodeURIComponent(JSON.stringify({ userId, planId }))}`;
        console.log("Creating checkout link for Starter plan");
        break;
      case "professional":
        checkoutUrl = `https://whop.com/checkout/plan_IeJ2izkJfj2L3?d2c=true&email=${encodeURIComponent(email)}&metadata=${encodeURIComponent(JSON.stringify({ userId, planId }))}`;
        console.log("Creating checkout link for Professional plan");
        break;
      default:
        throw new Error(`Unknown plan ID: ${planId}`);
    }

    return checkoutUrl;
  } catch (error) {
    console.error("Error creating Whop checkout link:", error);
    throw error;
  }
}

// Get user's Whop memberships
export async function getUserMemberships(whopUserId: string) {
  try {
    const response = await whopClient.get(`/memberships?user_id=${whopUserId}`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching Whop memberships:", error);
    throw error;
  }
}

// Cancel a membership
export async function cancelMembership(membershipId: string) {
  try {
    const response = await whopClient.post(`/memberships/${membershipId}/cancel`);
    return response.data;
  } catch (error) {
    console.error("Error canceling Whop membership:", error);
    throw error;
  }
}

// Reactivate a membership
export async function reactivateMembership(membershipId: string) {
  try {
    const response = await whopClient.post(`/memberships/${membershipId}/uncancel`);
    return response.data;
  } catch (error) {
    console.error("Error reactivating Whop membership:", error);
    throw error;
  }
}

// Verify a webhook signature
export function verifyWebhookSignature(payload: string, signature: string, secret: string) {
  try {
    // Suppress unused parameter warnings
    console.log(`Verifying webhook signature with payload length: ${payload.length}, signature: ${signature.substring(0, 10)}..., and secret`);

    // TODO: Implement proper Whop webhook signature verification
    // For now, we're accepting all webhooks for testing purposes
    // In production, you should implement proper signature verification
    return true;
  } catch (error) {
    console.error("Error verifying Whop webhook signature:", error);
    return false;
  }
}

export default whopClient;
