import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import fs from "fs/promises";
import mime from "mime-types";

// Initialize Gemini with your API key
export function initGemini() {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing Gemini API key. Please add NEXT_PUBLIC_GEMINI_API_KEY to your environment variables.");
  }
  return new GoogleGenerativeAI(apiKey);
}

export const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

export async function createChatSession(history: any[] = [], systemPrompt = "") {
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
      maxOutputTokens: 2048,
    },
  });
}

export async function generateResponse(prompt: string, history: any[] = [], systemPrompt = "", trainingData: any = null) {
  try {
    let enhancedSystemPrompt = systemPrompt;
    const lowerPrompt = prompt.toLowerCase();

    if (trainingData) {
      if (lowerPrompt.includes("objection") && trainingData.objectionHandling?.length) {
        enhancedSystemPrompt += "\n\nObjection handling examples:\n";
        trainingData.objectionHandling.slice(0, 3).forEach((item: any, i: number) =>
          enhancedSystemPrompt += `\n${i + 1}. ${item.content}\n`
        );
      }
      if (lowerPrompt.includes("closing") && trainingData.closingTechniques?.length) {
        enhancedSystemPrompt += "\n\nClosing techniques:\n";
        trainingData.closingTechniques.slice(0, 3).forEach((item: any, i: number) =>
          enhancedSystemPrompt += `\n${i + 1}. ${item.content}\n`
        );
      }
      if (lowerPrompt.includes("question") && trainingData.discoveryQuestions?.length) {
        enhancedSystemPrompt += "\n\nDiscovery questions:\n";
        trainingData.discoveryQuestions.slice(0, 3).forEach((item: any, i: number) =>
          enhancedSystemPrompt += `\n${i + 1}. ${item.content}\n`
        );
      }
      if (lowerPrompt.includes("script") && trainingData.salesScripts?.length) {
        enhancedSystemPrompt += "\n\nSales scripts:\n";
        trainingData.salesScripts.slice(0, 2).forEach((item: any, i: number) =>
          enhancedSystemPrompt += `\n${i + 1}. ${item.title}: ${item.content}\n`
        );
      }
      if (trainingData.documents?.length) {
        enhancedSystemPrompt += "\n\nReference docs:\n";
        trainingData.documents.forEach((doc: any) =>
          enhancedSystemPrompt += `\n- ${doc.title} (${doc.category})\n`
        );
      }
    }

    const chat = await createChatSession(history, enhancedSystemPrompt);
    const result = await chat.sendMessage(prompt);
    const response = result.response;
    const responseText = response.text();

    const promptTokens = Math.ceil((prompt.length + enhancedSystemPrompt.length) * 0.25);
    const completionTokens = Math.ceil(responseText.length * 0.25);

    return {
      text: responseText,
      tokenUsage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens
      }
    };
  } catch (error: any) {
    console.error("Error generating response:", error);
    return process.env.NODE_ENV === "development"
      ? generateMockResponse(prompt)
      : {
          text: "I'm sorry, something went wrong. Please try again.",
          tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
        };
  }
}

function generateMockResponse(prompt: string) {
  console.log("Generating mock response for:", prompt);
  let text = "Chat response for prompt: " + prompt;
  if (prompt.toLowerCase().includes("objection")) text = "Handle objections by empathizing and redirecting to value.";
  if (prompt.toLowerCase().includes("closing")) text = "A good closing involves asking for commitment confidently.";
  if (prompt.toLowerCase().includes("discovery")) text = "Use discovery questions to uncover hidden needs.";

  const promptTokens = Math.ceil(prompt.length * 0.25);
  const completionTokens = Math.ceil(text.length * 0.25);

  return {
    text,
    tokenUsage: { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens }
  };
}

async function prepareInputPart(input: { type: "text" | "file"; value: string }) {
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

async function prepareContentContents(inputs: Array<{ type: "text" | "file"; value: string }>) {
  const parts = await Promise.all(inputs.map(prepareInputPart));
  return [{ role: "user", parts }];
}

export async function generateMultiModalResponse(inputs: Array<{ type: "text" | "file"; value: string }>, systemPrompt = ""): Promise<string> {
  try {
    const genAI = initGemini();
    const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash" });
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
        maxOutputTokens: 2048,
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
  _trainingData: any, // Unused parameter, kept for compatibility
  additionalContext?: string
) {
  try {
    const genAI = initGemini();
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    let fileContent = contentData;
    let prompt = "";

    if (contentType === "audio") {
      prompt = `You are a sales coach analyzing a sales call transcript. Provide detailed feedback and scoring.\n\nTranscript:\n${fileContent}`;
    } else if (contentType === "video") {
      prompt = `You are a sales coach analyzing a sales video transcript. Provide detailed feedback and scoring.\n\nTranscript:\n${fileContent}`;
    } else if (contentType === "text") {
      prompt = `You are a sales coach analyzing a sales document. Provide detailed feedback and scoring.\n\nDocument:\n${fileContent}`;
    } else {
      prompt = `You are a sales coach analyzing sales content. Provide detailed feedback and scoring.\n\nContent:\n${fileContent}`;
    }

    if (additionalContext) {
      prompt += `\n\nAdditional context: ${additionalContext}`;
    }

    prompt += `

Provide your analysis in the following JSON format (and only respond with valid JSON):
{
  "summary": "Overall summary of the content",
  "overallScore": 85, // A number between 0-100 representing overall performance
  "metrics": [
    { "name": "Engagement", "score": 80, "feedback": "Brief feedback on this metric" },
    { "name": "Objection Handling", "score": 75, "feedback": "Brief feedback on this metric" },
    { "name": "Closing Techniques", "score": 90, "feedback": "Brief feedback on this metric" },
    { "name": "Product Knowledge", "score": 85, "feedback": "Brief feedback on this metric" }
  ],
  "strengths": [
    "Strength point 1",
    "Strength point 2",
    "Strength point 3"
  ],
  "improvements": [
    "Improvement suggestion 1",
    "Improvement suggestion 2",
    "Improvement suggestion 3"
  ],
  "actionableTips": [
    "Specific tip 1",
    "Specific tip 2",
    "Specific tip 3"
  ]
}
`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      safetySettings,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 4096,
      },
    });

    const text = result.response.text();

    // Try to parse the JSON response
    try {
      // Extract JSON from the response (in case there's any text before or after)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');

      const jsonStr = jsonMatch[0];
      const analysisData = JSON.parse(jsonStr);

      // Format the metrics to match our expected format
      const formattedMetrics = analysisData.metrics.map((metric: any) => ({
        name: metric.name,
        score: metric.score,
      }));

      // Calculate average score from metrics if overallScore is missing
      const overallScore = analysisData.overallScore ||
        Math.round(formattedMetrics.reduce((sum: number, m: any) => sum + m.score, 0) / formattedMetrics.length);

      return {
        analysisText: analysisData.summary,
        overallScore,
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
      console.error('Error parsing Gemini response as JSON:', parseError);
      console.log('Raw response:', text);

      // Fall back to extracting information manually
      const overallScore = extractScore(text, 'overall') || 75;

      return {
        analysisText: text,
        overallScore,
        metrics: [
          { name: "Engagement", score: extractScore(text, 'engagement') || 75 },
          { name: "Objection Handling", score: extractScore(text, 'objection') || 75 },
          { name: "Closing Techniques", score: extractScore(text, 'closing') || 75 },
          { name: "Product Knowledge", score: extractScore(text, 'product knowledge') || 75 },
        ],
        strengths: extractListItems(text, 'strength'),
        improvements: extractListItems(text, 'improvement'),
        actionableTips: extractListItems(text, 'tip'),
        tokenUsage: {
          promptTokens: Math.ceil(prompt.length * 0.25),
          completionTokens: Math.ceil(text.length * 0.25),
          totalTokens: Math.ceil(prompt.length * 0.25) + Math.ceil(text.length * 0.25),
        },
      };
    }
  } catch (err) {
    console.error("Error analyzing content with Gemini:", err);
    return {
      analysisText: "Could not analyze content.",
      overallScore: 70,
      metrics: [
        { name: "Engagement", score: 70 },
        { name: "Objection Handling", score: 70 },
        { name: "Closing Techniques", score: 70 },
        { name: "Product Knowledge", score: 70 },
      ],
      strengths: ["Placeholder strength"],
      improvements: ["Placeholder improvement"],
      actionableTips: ["Review the content and try again"],
      tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    };
  }
}

// Helper function to extract scores from text
function extractScore(text: string, metricName: string): number | null {
  const regex = new RegExp(`${metricName}[^0-9]*([0-9]+)`, 'i');
  const match = text.match(regex);
  if (match && match[1]) {
    const score = parseInt(match[1], 10);
    if (score >= 0 && score <= 100) return score;
  }
  return null;
}

// Helper function to extract list items
function extractListItems(text: string, itemType: string): string[] {
  const regex = new RegExp(`${itemType}[^:]*:[^\\n]*\\n([\\s\\S]*?)(?:\\n\\n|$)`, 'i');
  const match = text.match(regex);
  if (match && match[1]) {
    return match[1]
      .split('\n')
      .map(item => item.replace(/^\s*-\s*|^\s*\d+\.\s*/, '').trim())
      .filter(item => item.length > 0)
      .slice(0, 5); // Limit to 5 items
  }
  return ["No specific " + itemType + " identified"];
}

