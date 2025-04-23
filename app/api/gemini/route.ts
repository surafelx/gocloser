import { type NextRequest, NextResponse } from "next/server"
import { generateResponse, analyzeContent } from "@/lib/gemini"
import { loadTrainingData, getPromptTemplates } from "@/lib/training-data-loader"

// This module should only be used on the server side

import { generateGeminiResponse, analyzeContentWithGemini } from '@/app/actions/gemini-actions';

export async function POST(request: NextRequest) {
  try {
    const { prompt, history, type, content, additionalContext } = await request.json()

    // Handle different request types
    if (type === "chat" || type === "practice") {
      // For regular chat messages or practice scenarios
      const result = await generateGeminiResponse(prompt, history, type as 'chat' | 'practice');

      if (!result.success) {
        return NextResponse.json(
          { error: "Failed to generate response" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        response: result.response,
        tokenUsage: result.tokenUsage
      })
    } else if (type === "analyze") {
      // For content analysis (audio, video, text)
      const contentType = content.type || "text"
      const contentData = content.data || ""

      const result = await analyzeContentWithGemini(contentType, contentData, additionalContext);

      if (!result.success) {
        return NextResponse.json(
          { error: "Failed to analyze content" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        analysis: result.analysis,
        tokenUsage: result.tokenUsage
      })
    }

    // Default fallback
    return NextResponse.json(
      {
        error: "Invalid request type",
      },
      { status: 400 },
    )
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      {
        error: "Failed to process request",
      },
      { status: 500 },
    )
  }
}

