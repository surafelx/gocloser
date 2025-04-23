'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { SUBSCRIPTION_PLANS } from '@/lib/stripe';

// Define subscription types
export interface Subscription {
  planId: string;
  planName: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' | 'incomplete_expired' | 'unpaid';
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  tokenLimit: number;
  tokensUsed: number;
}

export interface TokenUsageStats {
  planId: string;
  planName: string;
  tokenLimit: number;
  tokensUsed: number;
  tokensRemaining: number;
  percentageUsed: number;
}

export interface DailyUsage {
  date: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

export function useSubscription() {
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [tokenUsage, setTokenUsage] = useState<TokenUsageStats | null>(null);
  const [dailyUsage, setDailyUsage] = useState<DailyUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChangingPlan, setIsChangingPlan] = useState(false);

  // Fetch subscription data
  const fetchSubscription = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/billing/subscription');

      if (!response.ok) {
        throw new Error('Failed to fetch subscription data');
      }

      const data = await response.json();
      setSubscription(data.subscription);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to load subscription data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch token usage data
  const fetchTokenUsage = async () => {
    try {
      const response = await fetch('/api/billing/token-usage');

      if (!response.ok) {
        throw new Error('Failed to fetch token usage data');
      }

      const data = await response.json();
      setTokenUsage(data.stats);
      setDailyUsage(data.dailyUsage);
    } catch (error) {
      console.error('Error fetching token usage:', error);
      toast({
        title: 'Error',
        description: 'Failed to load token usage data. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Change subscription plan
  const changePlan = async (planId: string) => {
    try {
      setIsChangingPlan(true);

      // Check if plan is free
      if (planId === 'free') {
        // Cancel current subscription
        await cancelSubscription();
        return;
      }

      // Create checkout session
      const response = await fetch('/api/billing/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error messages from the API
        const errorMessage = data.error || 'Failed to create checkout session';
        const errorDetails = data.details || '';

        toast({
          title: 'Subscription Error',
          description: `${errorMessage}${errorDetails ? '\n\n' + errorDetails : ''}`,
          variant: 'destructive',
        });

        throw new Error(errorMessage);
      }

      // Redirect to checkout if URL is available
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned from the server');
      }
    } catch (error: any) {
      console.error('Error changing plan:', error);

      // Only show toast if it wasn't already shown in the response handling
      if (error.message === 'Failed to create checkout session' ||
          error.message === 'No checkout URL returned from the server') {
        toast({
          title: 'Subscription Error',
          description: 'Failed to change subscription plan. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsChangingPlan(false);
    }
  };

  // Cancel subscription
  const cancelSubscription = async () => {
    try {
      setIsChangingPlan(true);

      const response = await fetch('/api/billing/subscription', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'cancel' }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      const data = await response.json();

      toast({
        title: 'Subscription Cancelled',
        description: data.message,
      });

      // Refresh subscription data
      await fetchSubscription();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel subscription. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPlan(false);
    }
  };

  // Reactivate subscription
  const reactivateSubscription = async () => {
    try {
      setIsChangingPlan(true);

      const response = await fetch('/api/billing/subscription', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reactivate' }),
      });

      if (!response.ok) {
        throw new Error('Failed to reactivate subscription');
      }

      const data = await response.json();

      toast({
        title: 'Subscription Reactivated',
        description: data.message,
      });

      // Refresh subscription data
      await fetchSubscription();
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to reactivate subscription. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPlan(false);
    }
  };

  // Add tokens to subscription
  const addTokens = async (additionalTokens: number) => {
    try {
      setIsChangingPlan(true);

      const response = await fetch('/api/billing/token-usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ additionalTokens }),
      });

      if (!response.ok) {
        throw new Error('Failed to add tokens');
      }

      const data = await response.json();

      toast({
        title: 'Tokens Added',
        description: data.message,
      });

      // Update token usage data
      setTokenUsage(data.stats);
    } catch (error) {
      console.error('Error adding tokens:', error);
      toast({
        title: 'Error',
        description: 'Failed to add tokens. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPlan(false);
    }
  };

  // Get plan details
  const getPlanDetails = (planId: string) => {
    return SUBSCRIPTION_PLANS[planId.toUpperCase() as keyof typeof SUBSCRIPTION_PLANS] || SUBSCRIPTION_PLANS.FREE;
  };

  // Check if user has enough tokens
  const hasEnoughTokens = (requiredTokens: number): boolean => {
    if (!tokenUsage) return false;
    return tokenUsage.tokensRemaining >= requiredTokens;
  };

  // Load subscription data on mount
  useEffect(() => {
    fetchSubscription();
    fetchTokenUsage();
  }, []);

  return {
    subscription,
    tokenUsage,
    dailyUsage,
    isLoading,
    isChangingPlan,
    fetchSubscription,
    fetchTokenUsage,
    changePlan,
    cancelSubscription,
    reactivateSubscription,
    addTokens,
    getPlanDetails,
    hasEnoughTokens,
  };
}
