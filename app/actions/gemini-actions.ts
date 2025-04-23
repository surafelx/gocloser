'use server';

// This module should only be used on the server side

import { generateResponse, analyzeContent } from '@/lib/gemini';
import { loadTrainingData, getPromptTemplates } from '@/lib/training-data-loader';

/**
 * Server action to generate a response from Gemini
 */
export async function generateGeminiResponse(
  prompt: string,
  history: any[] = [],
  type: 'chat' | 'practice' = 'chat'
): Promise<{
  success: boolean;
  response: string;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number
  }
}> {
  try {
    // Load training data
    const trainingData = await loadTrainingData();

    // Get prompt templates
    const promptTemplates = getPromptTemplates();

    // Select the appropriate system prompt based on type
    const systemPrompt = type === 'chat'
      ? promptTemplates.salesCoach
      : promptTemplates.practiceScenario;

    // Generate response
    const result = await generateResponse(prompt, history, systemPrompt, trainingData);

    return {
      success: true,
      response: result.text,
      tokenUsage: result.tokenUsage
    };
  } catch (error: any) {
    console.error('Error generating Gemini response:', error);
    return {
      success: false,
      response: 'I apologize, but I encountered an error processing your request. Please try again.',
      tokenUsage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0
      }
    };
  }
}

/**
 * Server action to analyze content with Gemini
 */
export async function analyzeContentWithGemini(
  contentType: string,
  contentData: string,
  additionalContext?: string
): Promise<{
  success: boolean;
  analysis: any;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}> {
  try {
    // Load training data
    const trainingData = await loadTrainingData();

    // Analyze content
    const result = await analyzeContent(contentType, contentData, trainingData, additionalContext);

    return {
      success: true,
      analysis: {
        analysisText: result.analysisText,
        overallScore: result.overallScore,
        metrics: result.metrics,
        strengths: result.strengths,
        improvements: result.improvements
      },
      tokenUsage: result.tokenUsage
    };
  } catch (error: any) {
    console.error('Error analyzing content with Gemini:', error);
    return {
      success: false,
      analysis: {
        analysisText: 'Error generating analysis',
        overallScore: 70,
        metrics: [
          { name: 'Engagement', score: 70 },
          { name: 'Objection Handling', score: 70 },
          { name: 'Closing Techniques', score: 70 },
          { name: 'Product Knowledge', score: 70 },
        ],
        strengths: ['Strong product knowledge', 'Excellent rapport building'],
        improvements: ['Could improve handling of price objections', 'Need to ask more discovery questions'],
      },
      tokenUsage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0
      }
    };
  }
}
