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
  FREE: {
    id: "free",
    name: "Free",
    description: "Basic access with limited features",
    price: 0,
    whopPlanId: "", // No Whop plan ID for free plan
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
    whopPlanId: "plan_M51GxRBJQNjl1", // Whop plan ID from checkout link
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
    whopPlanId: "plan_M51GxRBJQNjl1", // Using same plan for now, can be updated later
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
    whopPlanId: "plan_M51GxRBJQNjl1", // Using same plan for now, can be updated later
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

// Helper function to get plan details by Whop Plan ID
export function getPlanByWhopPlanId(whopPlanId: string) {
  const plans = Object.values(SUBSCRIPTION_PLANS);
  return (
    plans.find((plan) => plan.whopPlanId === whopPlanId) || SUBSCRIPTION_PLANS.FREE
  );
}

// Whop API functions
export async function createCheckoutLink(planId: string, userId: string, email: string) {
  try {
    const plan = getPlanById(planId);

    if (!plan.whopPlanId) {
      throw new Error("Invalid plan ID or free plan selected");
    }

    // Use direct checkout link for all plans
    // Add query parameters for tracking and user identification
    const checkoutUrl = `https://whop.com/checkout/plan_M51GxRBJQNjl1?d2c=true&email=${encodeURIComponent(email)}&metadata=${encodeURIComponent(JSON.stringify({ userId, planId }))}`;

    // Add plan-specific parameters if needed
    if (planId === "professional") {
      // You can customize the URL for professional plan if needed
      console.log("Creating checkout link for Professional plan");
    } else if (planId === "team") {
      // You can customize the URL for team plan if needed
      console.log("Creating checkout link for Team plan");
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
