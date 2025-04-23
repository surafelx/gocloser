/**
 * Simple utility for estimating token counts
 * 
 * Note: This is a rough estimation. For accurate counts, you would need
 * to use a tokenizer that matches the one used by the model.
 */

// Average tokens per character for English text
const AVG_TOKENS_PER_CHAR = 0.25;

// Average tokens per word for English text
const AVG_TOKENS_PER_WORD = 1.3;

/**
 * Estimate token count from text using character-based estimation
 */
export function estimateTokenCountFromText(text: string): number {
  if (!text) return 0;
  
  // Character-based estimation
  const charCount = text.length;
  const estimatedTokens = Math.ceil(charCount * AVG_TOKENS_PER_CHAR);
  
  return estimatedTokens;
}

/**
 * Estimate token count from text using word-based estimation
 */
export function estimateTokenCountFromWords(text: string): number {
  if (!text) return 0;
  
  // Word-based estimation
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const estimatedTokens = Math.ceil(wordCount * AVG_TOKENS_PER_WORD);
  
  return estimatedTokens;
}

/**
 * Estimate token count for a message
 */
export function estimateMessageTokenCount(message: {
  content: string;
  role: string;
  attachmentType?: string;
}): number {
  // Base tokens for message metadata (role, etc.)
  let tokenCount = 4;
  
  // Add tokens for content
  tokenCount += estimateTokenCountFromText(message.content);
  
  // Add extra tokens for attachments
  if (message.attachmentType) {
    // Attachments typically require more tokens
    tokenCount += 10;
  }
  
  return tokenCount;
}

/**
 * Estimate token count for a conversation
 */
export function estimateConversationTokenCount(messages: Array<{
  content: string;
  role: string;
  attachmentType?: string;
}>): number {
  // Base tokens for conversation
  let tokenCount = 2;
  
  // Add tokens for each message
  for (const message of messages) {
    tokenCount += estimateMessageTokenCount(message);
  }
  
  return tokenCount;
}

/**
 * Calculate estimated cost based on token counts and model
 */
export function calculateCost(
  promptTokens: number,
  completionTokens: number,
  model: string = 'gemini-pro'
): number {
  // Pricing per 1K tokens
  const pricing: Record<string, { input: number; output: number }> = {
    'gemini-pro': {
      input: 0.00025,  // $0.00025 per 1K input tokens
      output: 0.0005,  // $0.0005 per 1K output tokens
    },
    'gemini-pro-vision': {
      input: 0.0025,   // $0.0025 per 1K input tokens
      output: 0.0005,  // $0.0005 per 1K output tokens
    },
  };
  
  const modelPricing = pricing[model] || pricing['gemini-pro'];
  
  const inputCost = (promptTokens / 1000) * modelPricing.input;
  const outputCost = (completionTokens / 1000) * modelPricing.output;
  
  return inputCost + outputCost;
}
