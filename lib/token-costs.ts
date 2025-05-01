/**
 * Token costs for different types of interactions
 */

// Token costs for different types of interactions
export const TOKEN_COSTS = {
  // Each chat message costs 1 token
  CHAT_MESSAGE: 1,
  
  // Each file upload costs 10 tokens
  FILE_UPLOAD: 10,
  
  // Each audio recording costs 100 tokens
  AUDIO_RECORDING: 100,
};

/**
 * Calculate token cost for a specific interaction type
 */
export function calculateTokenCost(interactionType: keyof typeof TOKEN_COSTS): number {
  return TOKEN_COSTS[interactionType];
}

/**
 * Track token usage for a specific interaction
 * @param userId User ID
 * @param interactionType Type of interaction (CHAT_MESSAGE, FILE_UPLOAD, AUDIO_RECORDING)
 * @param metadata Additional metadata about the interaction
 */
export async function trackInteractionTokens(
  userId: string,
  interactionType: keyof typeof TOKEN_COSTS,
  metadata: Record<string, any> = {}
): Promise<boolean> {
  try {
    // Calculate token cost
    const tokenCost = calculateTokenCost(interactionType);
    
    // Log the token usage
    console.log(`[TOKEN-TRACKING] User ${userId} used ${tokenCost} tokens for ${interactionType}`, metadata);
    
    // Track token usage via API
    const response = await fetch('/api/token-usage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messageId: `${interactionType.toLowerCase()}_${Date.now()}`,
        promptTokens: tokenCost,
        completionTokens: 0,
        totalTokens: tokenCost,
        estimatedCost: 0,
        model: 'interaction',
        metadata: {
          interactionType,
          ...metadata,
        },
      }),
    });
    
    if (!response.ok) {
      const data = await response.json();
      console.error('[TOKEN-TRACKING] Failed to track token usage:', data);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('[TOKEN-TRACKING] Error tracking token usage:', error);
    return false;
  }
}
