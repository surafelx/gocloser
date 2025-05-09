import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import fs from "fs/promises";
import mime from "mime-types";
import { selectRelevantDocuments } from './document-selector';

// Initialize Gemini with your API key
export function initGemini() {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing Gemini API key. Please add NEXT_PUBLIC_GEMINI_API_KEY to your environment variables."
    );
  }
  return new GoogleGenerativeAI(apiKey);
}

export const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

export async function createChatSession(
  history: any[] = [],
  systemPrompt = ""
) {
  const genAI = initGemini();
  const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash" });
  const finalHistory = systemPrompt
    ? [{ role: "user", parts: [{ text: systemPrompt }] }, ...history]
    : history;

  return model.startChat({
    history: finalHistory,
    safetySettings,
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 512, // Further reduced to enforce very concise responses
    },
  });
}

export async function generateResponse(
  prompt: string,
  history: any[] = [],
  systemPrompt = "",
  trainingData: any = null
) {
  try {
    let enhancedSystemPrompt = systemPrompt;
    const lowerPrompt = prompt.toLowerCase();

    // Select relevant documents based on the user's query
    const { documents: relevantDocuments } = await selectRelevantDocuments(prompt, 3);

    // Add relevant document content to the system prompt
    if (relevantDocuments && relevantDocuments.length > 0) {
      enhancedSystemPrompt += "\n\n### RELEVANT DOCUMENTS FOR THIS QUERY ###\n";

      relevantDocuments.forEach((doc, index) => {
        // Add document metadata
        enhancedSystemPrompt += `\nDocument ${index + 1}: "${doc.title}" (Category: ${doc.category})\n`;

        // Add a snippet of the document content (first 500 chars)
        const contentPreview = doc.content.length > 500
          ? doc.content.substring(0, 500) + "..."
          : doc.content;

        enhancedSystemPrompt += `Content: ${contentPreview}\n`;
      });

      enhancedSystemPrompt += "\nPlease use the information from these documents to provide a more accurate and helpful response.\n";
    }

    if (trainingData) {
      if (
        lowerPrompt.includes("objection") &&
        trainingData.objectionHandling?.length
      ) {
        enhancedSystemPrompt += "\n\nObjection handling examples:\n";
        trainingData.objectionHandling
          .slice(0, 3)
          .forEach(
            (item: any, i: number) =>
              (enhancedSystemPrompt += `\n${i + 1}. ${item.content}\n`)
          );
      }
      if (
        lowerPrompt.includes("closing") &&
        trainingData.closingTechniques?.length
      ) {
        enhancedSystemPrompt += "\n\nClosing techniques:\n";
        trainingData.closingTechniques
          .slice(0, 3)
          .forEach(
            (item: any, i: number) =>
              (enhancedSystemPrompt += `\n${i + 1}. ${item.content}\n`)
          );
      }
      if (
        lowerPrompt.includes("question") &&
        trainingData.discoveryQuestions?.length
      ) {
        enhancedSystemPrompt += "\n\nDiscovery questions:\n";
        trainingData.discoveryQuestions
          .slice(0, 3)
          .forEach(
            (item: any, i: number) =>
              (enhancedSystemPrompt += `\n${i + 1}. ${item.content}\n`)
          );
      }
      if (lowerPrompt.includes("script") && trainingData.salesScripts?.length) {
        enhancedSystemPrompt += "\n\nSales scripts:\n";
        trainingData.salesScripts
          .slice(0, 2)
          .forEach(
            (item: any, i: number) =>
              (enhancedSystemPrompt += `\n${i + 1}. ${item.title}: ${
                item.content
              }\n`)
          );
      }
      if (trainingData.documents?.length) {
        enhancedSystemPrompt += "\n\nReference docs:\n";
        trainingData.documents.forEach(
          (doc: any) =>
            (enhancedSystemPrompt += `\n- ${doc.title} (${doc.category})\n`)
        );
      }
    }

    const chat = await createChatSession(history, enhancedSystemPrompt);
    const result = await chat.sendMessage(prompt);
    const response = result.response;
    const responseText = response.text();

    const promptTokens = Math.ceil(
      (prompt.length + enhancedSystemPrompt.length) * 0.25
    );
    const completionTokens = Math.ceil(responseText.length * 0.25);

    return {
      text: responseText,
      tokenUsage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
    };
  } catch (error: any) {
    console.error("Error generating response:", error);
    return process.env.NODE_ENV === "development"
      ? generateMockResponse(prompt)
      : {
          text: "I'm sorry, something went wrong. Please try again.",
          tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        };
  }
}

function generateMockResponse(prompt: string) {
  console.log("Generating mock response for:", prompt);
  let text = "Chat response for prompt: " + prompt;
  if (prompt.toLowerCase().includes("objection"))
    text = "Handle objections by empathizing and redirecting to value.";
  if (prompt.toLowerCase().includes("closing"))
    text = "A good closing involves asking for commitment confidently.";
  if (prompt.toLowerCase().includes("discovery"))
    text = "Use discovery questions to uncover hidden needs.";

  const promptTokens = Math.ceil(prompt.length * 0.25);
  const completionTokens = Math.ceil(text.length * 0.25);

  return {
    text,
    tokenUsage: {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
    },
  };
}

async function prepareInputPart(input: {
  type: "text" | "file";
  value: string;
}) {
  if (input.type === "text") return { text: input.value };

  try {
    // Check if file exists
    await fs.stat(input.value);
    const mimeType = mime.lookup(input.value) || "application/octet-stream";

    if (mimeType.startsWith("text/")) {
      const fileContent = await fs.readFile(input.value, "utf8");
      return { text: fileContent };
    } else {
      const fileBuffer = await fs.readFile(input.value);
      const data = fileBuffer.toString("base64");
      return { inlineData: { mimeType, data } };
    }
  } catch (err) {
    console.error("Failed to read file", input.value, err);
    throw err;
  }
}

async function prepareContentContents(
  inputs: Array<{ type: "text" | "file"; value: string }>
) {
  const parts = await Promise.all(inputs.map(prepareInputPart));
  return [{ role: "user", parts }];
}

export async function generateMultiModalResponse(
  inputs: Array<{ type: "text" | "file"; value: string }>,
  systemPrompt = ""
): Promise<string> {
  try {
    const genAI = initGemini();
    const model = genAI.getGenerativeModel({
      model: "models/gemini-1.5-flash",
    });
    const contents = await prepareContentContents(inputs);
    const finalContents = systemPrompt
      ? [{ role: "user", parts: [{ text: systemPrompt }] }, ...contents]
      : contents;

    const result = await model.generateContent({
      contents: finalContents,
      safetySettings,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 512, // Further reduced to enforce very concise responses
      },
    });

    return result.response.text();
  } catch (error: any) {
    console.error("Error in multimodal generation:", error);
    return "Error: Unable to generate response.";
  }
}

export async function analyzeContent(
  contentType: string,
  contentData: string,
  _trainingData: any,
  additionalContext?: string
) {
  try {
    const genAI = initGemini();
    const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash" });

    // Create analysis prompt based on content type
    let prompt = `You are an AI sales coach analyzing ${contentType} content. Your task is to analyze this content and return ONLY a JSON object.

Content to analyze:
${contentData}

${additionalContext ? `Additional context: ${additionalContext}\n` : ""}

IMPORTANT: You must respond with ONLY a JSON object in this exact format, with no additional text or explanation:
{
  "summary": "Your brief analysis summary here",
  "overallScore": 85,
  "metrics": [
    {
      "name": "Engagement",
      "score": 80,
      "description": "Description of engagement score"
    },
    {
      "name": "Objection Handling",
      "score": 85,
      "description": "Description of objection handling"
    },
    {
      "name": "Closing Techniques",
      "score": 75,
      "description": "Description of closing techniques"
    },
    {
      "name": "Product Knowledge",
      "score": 90,
      "description": "Description of product knowledge"
    }
  ],
  "strengths": [
    "Strength point 1",
    "Strength point 2"
  ],
  "improvements": [
    "Improvement point 1",
    "Improvement point 2"
  ],
  "actionableTips": [
    "Actionable tip 1",
    "Actionable tip 2"
  ]
}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      safetySettings,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 512,
      },
    });

    const text = result.response.text();

    try {
      // Clean and validate the response
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();

      // Check if the text starts with a curly brace
      if (!cleanedText.startsWith('{')) {
        throw new Error('Response is not in JSON format');
      }

      const analysisData = JSON.parse(cleanedText);

      // Validate required fields
      if (!analysisData.summary || !analysisData.overallScore || !Array.isArray(analysisData.metrics)) {
        throw new Error('Missing required fields in JSON response');
      }

      // Format metrics with descriptions
      const formattedMetrics = analysisData.metrics.map((metric: any) => ({
        name: metric.name,
        score: metric.score,
        description: metric.description || `Analysis of ${metric.name.toLowerCase()}`,
      }));

      return {
        analysisText: analysisData.summary,
        overallScore: analysisData.overallScore,
        metrics: formattedMetrics,
        strengths: analysisData.strengths || [],
        improvements: analysisData.improvements || [],
        actionableTips: analysisData.actionableTips || [],
        tokenUsage: {
          promptTokens: Math.ceil(prompt.length * 0.25),
          completionTokens: Math.ceil(text.length * 0.25),
          totalTokens: Math.ceil(prompt.length * 0.25) + Math.ceil(text.length * 0.25),
        },
      };
    } catch (parseError) {
      console.error("Error parsing Gemini response as JSON:", parseError);
      console.error("Raw response:", text);

      // Return fallback data
      return {
        analysisText: "Error analyzing content. Please try again.",
        overallScore: 75,
        metrics: [
          {
            name: "Engagement",
            score: 75,
            description: "Level of audience engagement",
          },
          {
            name: "Objection Handling",
            score: 75,
            description: "Effectiveness in handling objections",
          },
          {
            name: "Closing Techniques",
            score: 75,
            description: "Skill in closing opportunities",
          },
          {
            name: "Product Knowledge",
            score: 75,
            description: "Understanding of product features and benefits",
          },
        ],
        strengths: ["Unable to analyze strengths"],
        improvements: ["Unable to analyze improvements"],
        actionableTips: ["Please try analyzing the content again"],
        tokenUsage: {
          promptTokens: Math.ceil(prompt.length * 0.25),
          completionTokens: Math.ceil(text.length * 0.25),
          totalTokens: Math.ceil(prompt.length * 0.25) + Math.ceil(text.length * 0.25),
        },
      };
    }
  } catch (error) {
    console.error("Error in Gemini analysis:", error);
    throw error;
  }
}
