import dbConnect from "./mongoose";
import Subscription from "@/models/Subscription";
import TokenUsage from "@/models/TokenUsage";
import User from "@/models/User";
import { SUBSCRIPTION_PLANS } from "./stripe";

/**
 * Calculate cost based on token usage
 * This is a simple placeholder function for now
 */
function calculateCost(promptTokens: number, completionTokens: number): number {
  // Simple cost calculation (can be refined later)
  const promptCost = promptTokens * 0.00001; // $0.01 per 1000 prompt tokens
  const completionCost = completionTokens * 0.00002; // $0.02 per 1000 completion tokens
  return promptCost + completionCost;
}

/**
 * Check if a user has enough tokens for a request
 */
export async function hasEnoughTokens(
  userId: string,
  requiredTokens: number
): Promise<boolean> {
  try {
    await dbConnect();

    // Get user's subscription
    const subscription = await Subscription.findOne({
      userId,
      status: "active",
    });

    // If no active subscription, check if they're on free plan
    if (!subscription) {
      // Get total tokens used this month for free plan
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const totalTokensUsed = await TokenUsage.aggregate([
        {
          $match: {
            userId,
            createdAt: { $gte: startOfMonth },
          },
        },
        {
          $group: {
            _id: null,
            totalTokens: { $sum: "$totalTokens" },
          },
        },
      ]);

      const usedTokens =
        totalTokensUsed.length > 0 ? totalTokensUsed[0].totalTokens : 0;
      const freeTokenLimit = SUBSCRIPTION_PLANS.FREE.tokenLimit;

      return usedTokens + requiredTokens <= freeTokenLimit;
    }

    // Check if paid subscription has enough tokens
    return subscription.tokensUsed + requiredTokens <= subscription.tokenLimit;
  } catch (error) {
    console.error("Error checking token availability:", error);
    return false;
  }
}

/**
 * Update token usage for a user
 */
export async function updateTokenUsage(
  userId: string,
  promptTokens: number,
  completionTokens: number
): Promise<{ success: boolean; limitReached?: boolean }> {
  try {
    await dbConnect();

    const totalTokens = promptTokens + completionTokens;
    console.log(`Updating token usage for user ${userId}: ${promptTokens} prompt + ${completionTokens} completion = ${totalTokens} total tokens`);

    // Get user's subscription
    const subscription = await Subscription.findOne({
      userId,
      status: "active",
    });

    // Get user to check subscription status
    const user = await User.findById(userId);
    const hasActiveSubscription = user?.hasActiveSubscription || false;

    // If they have an active subscription, update token usage
    if (subscription) {
      console.log(`Found active subscription for user ${userId}: ${subscription.planName} (${subscription.planId})`);
      console.log(`Current usage: ${subscription.tokensUsed}/${subscription.tokenLimit} tokens`);

      // Check if adding these tokens would exceed the limit
      // NOTE: Token limit check is temporarily disabled
      /*
      if (subscription.tokensUsed + totalTokens > subscription.tokenLimit) {
        console.log(`Token limit would be exceeded: ${subscription.tokensUsed} + ${totalTokens} > ${subscription.tokenLimit}`);
        return { success: false, limitReached: true };
      }
      */

      // Log token usage without enforcing limits
      if (subscription.tokensUsed + totalTokens > subscription.tokenLimit) {
        console.log(`Token limit would be exceeded: ${subscription.tokensUsed} + ${totalTokens} > ${subscription.tokenLimit}, but allowing it for now`);
      }

      // Update the subscription with the new token usage
      const updateResult = await Subscription.updateOne(
        { _id: subscription._id },
        { $inc: { tokensUsed: totalTokens } }
      );

      console.log(`Updated subscription ${subscription._id} with ${totalTokens} tokens. Update result:`, updateResult);
      console.log(`New total should be: ${subscription.tokensUsed + totalTokens}`);
    } else {
      console.log(`No active subscription found for user ${userId}, checking free plan usage`);

      // For free users, check monthly usage
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const totalTokensUsed = await TokenUsage.aggregate([
        {
          $match: {
            userId,
            createdAt: { $gte: startOfMonth },
          },
        },
        {
          $group: {
            _id: null,
            totalTokens: { $sum: "$totalTokens" },
          },
        },
      ]);

      const usedTokens =
        totalTokensUsed.length > 0 ? totalTokensUsed[0].totalTokens : 0;
      const freeTokenLimit = SUBSCRIPTION_PLANS.FREE.tokenLimit;

      console.log(`Free plan usage: ${usedTokens}/${freeTokenLimit} tokens`);

      // Check if adding these tokens would exceed the free limit
      // NOTE: Token limit check is temporarily disabled
      /*
      if (usedTokens + totalTokens > freeTokenLimit) {
        console.log(`Free token limit would be exceeded: ${usedTokens} + ${totalTokens} > ${freeTokenLimit}`);
        return { success: false, limitReached: true };
      }
      */

      // Log token usage without enforcing limits
      if (usedTokens + totalTokens > freeTokenLimit) {
        console.log(`Free token limit would be exceeded: ${usedTokens} + ${totalTokens} > ${freeTokenLimit}, but allowing it for now`);
      }

      // Try to find a free subscription for this user
      const freeSubscription = await Subscription.findOne({
        userId,
        planId: "free",
      });

      // If found, update it
      if (freeSubscription) {
        console.log(`Found free subscription for user ${userId}`);
        console.log(`Current usage: ${freeSubscription.tokensUsed}/${freeSubscription.tokenLimit} tokens`);

        const updateResult = await Subscription.updateOne(
          { _id: freeSubscription._id },
          { $inc: { tokensUsed: totalTokens } }
        );

        console.log(`Updated free subscription ${freeSubscription._id} with ${totalTokens} tokens. Update result:`, updateResult);
        console.log(`New total should be: ${freeSubscription.tokensUsed + totalTokens}`);
      } else {
        // If no free subscription found, create one
        console.log(`No subscription found for user ${userId}. Creating a free subscription.`);
        const now = new Date();
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        const newSubscription = new Subscription({
          userId,
          stripeCustomerId: 'free_plan_' + userId,
          stripeSubscriptionId: 'free_plan_' + userId,
          stripePriceId: 'free',
          planId: "free",
          planName: "Free",
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: nextMonth,
          cancelAtPeriodEnd: false,
          tokenLimit: SUBSCRIPTION_PLANS.FREE.tokenLimit,
          tokensUsed: totalTokens,
        });

        await newSubscription.save();
        console.log(`Created new free subscription for user ${userId} with ${totalTokens} initial tokens.`);
      }
    }

    // Create a token usage record
    const tokenUsage = new TokenUsage({
      userId,
      messageId: Date.now().toString(),
      promptTokens,
      completionTokens,
      totalTokens,
      estimatedCost: calculateCost(promptTokens, completionTokens),
      model: 'gemini-pro',
    });

    const savedTokenUsage = await tokenUsage.save();
    console.log(`Saved token usage record: ${savedTokenUsage._id}, total tokens: ${totalTokens}`);

    return { success: true };
  } catch (error) {
    console.error("Error updating token usage:", error);
    return { success: false };
  }
}

/**
 * Get token usage statistics for a user
 */
export async function getTokenUsageStats(userId: string) {
  try {
    console.log(`Getting token usage stats for user ID: ${userId}`);
    await dbConnect();

    // Get user's subscription
    const subscription = await Subscription.findOne({
      userId,
      status: "active",
    });

    console.log(`Subscription found for user ${userId}:`, subscription ? 'Yes' : 'No');

    // Get user to check subscription status
    const user = await User.findById(userId);

    // If user doesn't exist, create a default user record with free plan
    if (!user) {
      console.log(`User ${userId} not found in database - creating default user record`);
      try {
        // Create a new user with default settings
        const newUser = new User({
          _id: userId,
          hasActiveSubscription: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        await newUser.save();
        console.log(`Created default user record for ${userId}`);

        // Create a free subscription for this user
        const now = new Date();
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        const newSubscription = new Subscription({
          userId,
          stripeCustomerId: 'free_plan_' + userId,
          stripeSubscriptionId: 'free_plan_' + userId,
          stripePriceId: 'free',
          planId: "free",
          planName: "Free",
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: nextMonth,
          cancelAtPeriodEnd: false,
          tokenLimit: SUBSCRIPTION_PLANS.FREE.tokenLimit,
          tokensUsed: 0,
        });

        await newSubscription.save();
        console.log(`Created free subscription for new user ${userId}`);

        // Return default stats for new user
        return {
          planId: "free",
          planName: "Free",
          tokenLimit: SUBSCRIPTION_PLANS.FREE.tokenLimit,
          tokensUsed: 0,
          tokensRemaining: SUBSCRIPTION_PLANS.FREE.tokenLimit,
          percentageUsed: 0,
          hasActiveSubscription: false,
        };
      } catch (createError) {
        console.error(`Error creating default user record: ${createError}`);
        // Continue with default values even if creation fails
      }
    }

    const hasActiveSubscription = user?.hasActiveSubscription || false;
    console.log(`User ${userId} has active subscription:`, hasActiveSubscription);

    // If they have an active subscription
    if (subscription && hasActiveSubscription) {
      console.log(`Active subscription details for user ${userId}:`, {
        planId: subscription.planId,
        planName: subscription.planName,
        tokenLimit: subscription.tokenLimit,
        tokensUsed: subscription.tokensUsed,
      });

      return {
        planId: subscription.planId,
        planName: subscription.planName,
        tokenLimit: subscription.tokenLimit,
        tokensUsed: subscription.tokensUsed,
        tokensRemaining: Math.max(0, subscription.tokenLimit - subscription.tokensUsed),
        percentageUsed: Math.min(100, Math.round(
          (subscription.tokensUsed / subscription.tokenLimit) * 100
        )),
        hasActiveSubscription: true,
      };
    }

    // For free plan users
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    console.log(`Getting token usage for free plan user ${userId} since:`, startOfMonth);

    try {
      const totalTokensUsed = await TokenUsage.aggregate([
        {
          $match: {
            userId,
            createdAt: { $gte: startOfMonth },
          },
        },
        {
          $group: {
            _id: null,
            totalTokens: { $sum: "$totalTokens" },
          },
        },
      ]);

      const usedTokens =
        totalTokensUsed.length > 0 ? totalTokensUsed[0].totalTokens : 0;
      const freeTokenLimit = SUBSCRIPTION_PLANS.FREE.tokenLimit;

      console.log(`Free plan token usage for user ${userId}:`, {
        usedTokens,
        freeTokenLimit,
        remaining: Math.max(0, freeTokenLimit - usedTokens),
        percentageUsed: Math.round((usedTokens / freeTokenLimit) * 100),
      });

      // Check if this is a new user with no token usage history
      if (totalTokensUsed.length === 0) {
        console.log(`No token usage history found for user ${userId} - creating free subscription`);

        // Try to find a free subscription for this user
        const existingFreeSubscription = await Subscription.findOne({
          userId,
          planId: "free",
        });

        // If no free subscription exists, create one
        if (!existingFreeSubscription) {
          const now = new Date();
          const nextMonth = new Date(now);
          nextMonth.setMonth(nextMonth.getMonth() + 1);

          const newSubscription = new Subscription({
            userId,
            stripeCustomerId: 'free_plan_' + userId,
            stripeSubscriptionId: 'free_plan_' + userId,
            stripePriceId: 'free',
            planId: "free",
            planName: "Free",
            status: "active",
            currentPeriodStart: now,
            currentPeriodEnd: nextMonth,
            cancelAtPeriodEnd: false,
            tokenLimit: SUBSCRIPTION_PLANS.FREE.tokenLimit,
            tokensUsed: 0,
          });

          await newSubscription.save();
          console.log(`Created free subscription for user ${userId} with no token usage history`);
        }
      }

      return {
        planId: "free",
        planName: "Free",
        tokenLimit: freeTokenLimit,
        tokensUsed: usedTokens,
        tokensRemaining: Math.max(0, freeTokenLimit - usedTokens),
        percentageUsed: Math.min(100, Math.round((usedTokens / freeTokenLimit) * 100)),
        hasActiveSubscription: false,
      };
    } catch (error) {
      console.error(`Error getting token usage for free plan user ${userId}:`, error);

      // Fallback to default values if there's an error
      const freeTokenLimit = SUBSCRIPTION_PLANS.FREE.tokenLimit;
      return {
        planId: "free",
        planName: "Free",
        tokenLimit: freeTokenLimit,
        tokensUsed: 0,
        tokensRemaining: freeTokenLimit,
        percentageUsed: 0,
        hasActiveSubscription: false,
      };
    }
  } catch (error) {
    console.error("Error getting token usage stats:", error);
    throw error;
  }
}

/**
 * Reset token usage for a user (typically when subscription renews)
 */
export async function resetTokenUsage(userId: string): Promise<boolean> {
  try {
    await dbConnect();

    // Get user's subscription
    const subscription = await Subscription.findOne({ userId });

    // If they have a subscription, reset token usage
    if (subscription) {
      await Subscription.updateOne(
        { _id: subscription._id },
        { $set: { tokensUsed: 0 } }
      );
    }

    return true;
  } catch (error) {
    console.error("Error resetting token usage:", error);
    return false;
  }
}
