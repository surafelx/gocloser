'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface TokenUsageData {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
  model: string;
}

interface UseTokenUsageProps {
  sessionId?: string;
  userId?: string;
}

interface UseTokenUsageReturn {
  tokenUsage: {
    session: TokenUsageData;
    total: TokenUsageData;
  };
  addTokenUsage: (usage: TokenUsageData) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

// Pricing constants (per 1000 tokens)
const MODEL_PRICING = {
  'gemini-pro': {
    input: 0.00025,  // $0.00025 per 1K input tokens
    output: 0.0005,  // $0.0005 per 1K output tokens
  },
  'gemini-pro-vision': {
    input: 0.0025,   // $0.0025 per 1K input tokens
    output: 0.0005,  // $0.0005 per 1K output tokens
  },
  'google-speech': {
    input: 0.0006,   // $0.0006 per 1K input tokens (approximation for Speech-to-Text)
    output: 0,       // No output tokens for transcription
  },
  'interaction': {
    input: 0.0001,   // $0.0001 per 1K input tokens (minimal cost for interactions)
    output: 0,       // No output tokens for interactions
  },
};

// Default token limit per session
const DEFAULT_SESSION_LIMIT = 100000; // 100k tokens for free users

export function useTokenUsage({ sessionId = 'default', userId }: UseTokenUsageProps = {}): UseTokenUsageReturn {
  const [tokenUsage, setTokenUsage] = useState<{
    session: TokenUsageData;
    total: TokenUsageData;
  }>({
    session: {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      estimatedCost: 0,
      model: 'gemini-pro',
    },
    total: {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      estimatedCost: 0,
      model: 'gemini-pro',
    },
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load token usage on mount
  useEffect(() => {
    if (userId) {
      loadTokenUsage();
    }
  }, [userId, sessionId]);

  // Load token usage from API
  const loadTokenUsage = async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/token-usage?sessionId=${sessionId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load token usage');
      }

      setTokenUsage({
        session: data.sessionUsage,
        total: data.totalUsage,
      });
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading token usage');
      console.error('Load token usage error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate cost based on tokens and model
  const calculateCost = (promptTokens: number, completionTokens: number, model: string): number => {
    const pricing = MODEL_PRICING[model as keyof typeof MODEL_PRICING] || MODEL_PRICING['gemini-pro'];

    const inputCost = (promptTokens / 1000) * pricing.input;
    const outputCost = (completionTokens / 1000) * pricing.output;

    return inputCost + outputCost;
  };

  // Add token usage
  const addTokenUsage = async (usage: TokenUsageData) => {
    // Check if user has reached token limit
    if (userId) {
      try {
        // Check token limit before updating
        const statsResponse = await fetch('/api/token-usage/stats');
        if (statsResponse.ok) {
          const stats = await statsResponse.json();
          const totalTokensUsed = stats.tokensUsed || 0;
          const tokenLimit = stats.tokenLimit || DEFAULT_SESSION_LIMIT;

          console.log(`Current token usage: ${totalTokensUsed}/${tokenLimit}, adding ${usage.totalTokens} tokens`);

          // If adding these tokens would exceed the limit
          if (totalTokensUsed + usage.totalTokens > tokenLimit) {
            toast({
              title: 'Token limit reached',
              description: 'You have reached your token limit. Please upgrade your plan to continue using the AI.',
              variant: 'destructive',
            });
            return;
          }

          // If approaching token limit (80%)
          if (totalTokensUsed + usage.totalTokens > tokenLimit * 0.8) {
            toast({
              title: 'Approaching token limit',
              description: 'You are approaching your token limit. Consider upgrading your plan.',
              variant: 'warning',
            });
          }
        }
      } catch (err) {
        console.error('Error checking token limit:', err);
      }
    }

    // Update local state immediately
    setTokenUsage(prev => {
      const newSessionPromptTokens = prev.session.promptTokens + usage.promptTokens;
      const newSessionCompletionTokens = prev.session.completionTokens + usage.completionTokens;
      const newSessionTotalTokens = newSessionPromptTokens + newSessionCompletionTokens;

      const newTotalPromptTokens = prev.total.promptTokens + usage.promptTokens;
      const newTotalCompletionTokens = prev.total.completionTokens + usage.completionTokens;
      const newTotalTokens = newTotalPromptTokens + newTotalCompletionTokens;

      const newSessionCost = calculateCost(newSessionPromptTokens, newSessionCompletionTokens, usage.model);
      const newTotalCost = calculateCost(newTotalPromptTokens, newTotalCompletionTokens, usage.model);

      return {
        session: {
          promptTokens: newSessionPromptTokens,
          completionTokens: newSessionCompletionTokens,
          totalTokens: newSessionTotalTokens,
          estimatedCost: newSessionCost,
          model: usage.model,
        },
        total: {
          promptTokens: newTotalPromptTokens,
          completionTokens: newTotalCompletionTokens,
          totalTokens: newTotalTokens,
          estimatedCost: newTotalCost,
          model: usage.model,
        },
      };
    });

    // Check if approaching session token limit
    if (tokenUsage.session.totalTokens > DEFAULT_SESSION_LIMIT * 0.8) {
      toast({
        title: 'Approaching session limit',
        description: 'You are approaching your session token limit. Consider starting a new chat.',
        variant: 'warning',
      });
    }

    // Save to API if userId is provided
    if (userId) {
      try {
        console.log(`Saving token usage to API: ${usage.promptTokens} prompt + ${usage.completionTokens} completion = ${usage.totalTokens} total tokens`);
        const response = await fetch('/api/token-usage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            messageId: Date.now().toString(),
            ...usage,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          console.error('Failed to save token usage:', data);
          throw new Error(data.error || 'Failed to save token usage');
        } else {
          console.log('Token usage saved successfully');
          // Refresh token stats after successful update
          setTimeout(() => loadTokenUsage(), 1000);
        }
      } catch (err: any) {
        console.error('Save token usage error:', err);
        // Don't set error state to avoid UI disruption
      }
    }
  };

  return {
    tokenUsage,
    addTokenUsage,
    isLoading,
    error,
  };
}
