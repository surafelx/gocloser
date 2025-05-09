import fs from "fs"
import path from "path"
import { loadTrainingDocuments, TrainingDocument, createMockTrainingData } from "./simple-pdf-processor"

// This module should only be used on the server side

// Load training data from processed documents
export async function loadTrainingData() {
  try {
    // Load processed training documents
    const documents = await loadTrainingDocuments()

    // Convert documents to training data format
    const trainingData = {
      objectionHandling: extractObjectionHandling(documents),
      closingTechniques: extractClosingTechniques(documents),
      discoveryQuestions: extractDiscoveryQuestions(documents),
      valuePropositions: extractValuePropositions(documents),
      salesScripts: extractSalesScripts(documents),
      // Add the full documents for context
      documents: documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        category: doc.category,
        summary: summarizeDocument(doc.content)
      }))
    }

    return trainingData
  } catch (error) {
    console.error("Error loading training data:", error)
    return {
      objectionHandling: [],
      closingTechniques: [],
      discoveryQuestions: [],
      valuePropositions: [],
      salesScripts: [],
      documents: []
    }
  }
}

// Helper functions to extract specific data from documents
function extractObjectionHandling(documents: TrainingDocument[]) {
  const objectionPatterns = [
    "objection",
    "concern",
    "hesitation",
    "pushback",
    "not interested",
    "too expensive",
    "need to think",
    "talk to",
    "competitor"
  ]

  return extractRelevantContent(documents, objectionPatterns, 'objection handling')
}

function extractClosingTechniques(documents: TrainingDocument[]) {
  const closingPatterns = [
    "closing",
    "close the sale",
    "ask for the business",
    "commitment",
    "next steps",
    "sign up",
    "move forward",
    "decision"
  ]

  return extractRelevantContent(documents, closingPatterns, 'closing techniques')
}

function extractDiscoveryQuestions(documents: TrainingDocument[]) {
  const discoveryPatterns = [
    "discovery",
    "question",
    "tell me about",
    "how do you",
    "what is your",
    "challenge",
    "pain point",
    "goal",
    "objective"
  ]

  return extractRelevantContent(documents, discoveryPatterns, 'discovery questions')
}

function extractValuePropositions(documents: TrainingDocument[]) {
  const valuePatterns = [
    "value",
    "benefit",
    "solution",
    "result",
    "outcome",
    "roi",
    "return on investment",
    "save",
    "improve",
    "increase"
  ]

  return extractRelevantContent(documents, valuePatterns, 'value propositions')
}

function extractSalesScripts(documents: TrainingDocument[]) {
  // Get documents that are categorized as scripts
  const scriptDocuments = documents.filter(doc =>
    doc.category === 'scripts' ||
    doc.title.toLowerCase().includes('script')
  )

  return scriptDocuments.map(doc => ({
    id: doc.id,
    title: doc.title,
    content: summarizeDocument(doc.content, 500),
    source: doc.source
  }))
}

// Extract relevant content from documents based on patterns
function extractRelevantContent(documents: TrainingDocument[], patterns: string[], type: string) {
  const relevantContent = []

  for (const doc of documents) {
    const paragraphs = doc.content.split('\n\n')

    for (const paragraph of paragraphs) {
      // Check if paragraph contains any of the patterns
      if (patterns.some(pattern => paragraph.toLowerCase().includes(pattern))) {
        relevantContent.push({
          id: `${doc.id}_${relevantContent.length}`,
          content: paragraph,
          source: doc.title,
          type
        })
      }
    }
  }

  return relevantContent
}

// Create a summary of document content
function summarizeDocument(content: string, maxLength: number = 200): string {
  if (content.length <= maxLength) {
    return content
  }

  // Get the first few sentences up to maxLength
  const truncated = content.substring(0, maxLength)
  const lastPeriod = truncated.lastIndexOf('.')

  if (lastPeriod > 0) {
    return truncated.substring(0, lastPeriod + 1) + ' ...'
  }

  return truncated + ' ...'
}

// Add custom training data
export async function addCustomTrainingData(category: string, data: any) {
  try {
    // Path to your training data directory
    const dataPath = path.join(process.cwd(), "data", "training-data.json")

    // Read and parse the existing JSON file
    const rawData = fs.readFileSync(dataPath, "utf8")
    const trainingData = JSON.parse(rawData)

    // Add or update the data in the specified category
    if (Array.isArray(trainingData[category])) {
      // If it's an array, push the new data
      trainingData[category].push(data)
    } else if (typeof trainingData[category] === "object") {
      // If it's an object, merge the new data
      trainingData[category] = { ...trainingData[category], ...data }
    } else {
      // If the category doesn't exist, create it
      trainingData[category] = [data]
    }

    // Write the updated data back to the file
    fs.writeFileSync(dataPath, JSON.stringify(trainingData, null, 2), "utf8")

    return { success: true, message: "Training data added successfully" }
  } catch (error) {
    console.error("Error adding custom training data:", error)
    return { success: false, message: "Failed to add training data" }
  }
}

// Get custom prompt templates
export function getPromptTemplates() {
  return {
    salesCoach: `You are a no-nonsense sales trainer with 20+ years of experience coaching top-performing sales professionals. Your responses must be brief and direct - never more than 1-2 short paragraphs. Use bullet points whenever possible.

IMPORTANT: If the user asks a question that is NOT directly related to sales (selling, prospecting, objection handling, closing, etc.), respond with: "I'm your sales coach, not a general assistant. Let's focus on improving your sales skills." Then suggest a relevant sales topic they could ask about instead.

When giving advice:
• Be direct and straightforward - like a real sales coach
• Focus on 1-2 key points maximum
• Use sales-specific terminology and examples
• Avoid lengthy explanations or theoretical concepts
• Speak with authority and conviction

Your goal is to train salespeople to be more effective, not to provide general information or have philosophical discussions. Keep every response focused on practical sales techniques that can be immediately applied.`,

    contentAnalysis: `You are analyzing sales content to provide concise feedback and scoring. Focus on identifying the most important strengths and weaknesses in the sales approach. For each area of improvement, provide brief, actionable advice. Your analysis should be balanced but brief, highlighting key positive aspects and priority areas for growth. Keep explanations short and direct. Use bullet points where appropriate. Maintain a constructive and encouraging tone throughout your analysis.`,

    practiceScenario: `You are role-playing as a potential customer in a sales scenario. Respond naturally but briefly to the user's sales approach, asking relevant questions and raising common objections. Keep your responses short and realistic. Your responses should be no more than 2-3 sentences. After the role-play concludes, provide brief, specific feedback on what worked well and what could be improved, using bullet points for clarity.`,
  }
}

