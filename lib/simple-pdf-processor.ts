import fs from 'fs';
import path from 'path';

// This module should only be used on the server side

// Define the training data structure
export interface TrainingDocument {
  id: string;
  title: string;
  content: string;
  source: string;
  category: string;
  createdAt: Date;
}

/**
 * Load training documents from JSON file
 */
export async function loadTrainingDocuments(): Promise<TrainingDocument[]> {
  try {
    // Check if training documents file exists
    const dataDir = path.join(process.cwd(), 'data');
    const filePath = path.join(dataDir, 'training-documents.json');

    if (!fs.existsSync(filePath)) {
      console.log('Training documents file not found');
      return [];
    }

    // Read and parse the JSON file
    const data = fs.readFileSync(filePath, 'utf8');
    const documents = JSON.parse(data) as TrainingDocument[];

    console.log(`Loaded ${documents.length} training documents`);
    return documents;
  } catch (error) {
    console.error('Error loading training documents:', error);
    return [];
  }
}

/**
 * Get training document by ID
 */
export async function getTrainingDocumentById(id: string): Promise<TrainingDocument | null> {
  try {
    const documents = await loadTrainingDocuments();
    return documents.find(doc => doc.id === id) || null;
  } catch (error) {
    console.error('Error getting training document by ID:', error);
    return null;
  }
}

/**
 * Get training documents by category
 */
export async function getTrainingDocumentsByCategory(category: string): Promise<TrainingDocument[]> {
  try {
    const documents = await loadTrainingDocuments();
    return documents.filter(doc => doc.category === category);
  } catch (error) {
    console.error('Error getting training documents by category:', error);
    return [];
  }
}

/**
 * Search training documents by query
 */
export async function searchTrainingDocuments(query: string): Promise<TrainingDocument[]> {
  try {
    const documents = await loadTrainingDocuments();
    const lowerQuery = query.toLowerCase();

    return documents.filter(doc =>
      doc.title.toLowerCase().includes(lowerQuery) ||
      doc.content.toLowerCase().includes(lowerQuery)
    );
  } catch (error) {
    console.error('Error searching training documents:', error);
    return [];
  }
}

/**
 * Create a mock training document for testing
 */
export function createMockTrainingDocument(title: string, category: string): TrainingDocument {
  return {
    id: title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase(),
    title,
    content: `This is a mock training document for ${title} in the ${category} category.`,
    source: 'mock',
    category,
    createdAt: new Date()
  };
}

/**
 * Create mock training data for testing
 */
export async function createMockTrainingData(): Promise<TrainingDocument[]> {
  const documents = [
    createMockTrainingDocument('Objection Handling Guide', 'objection-handling'),
    createMockTrainingDocument('Closing Techniques', 'closing'),
    createMockTrainingDocument('Discovery Questions', 'discovery'),
    createMockTrainingDocument('Value Proposition Guide', 'value-proposition'),
    createMockTrainingDocument('Sales Script Template', 'scripts')
  ];

  // Save mock documents
  try {
    const dataDir = path.join(process.cwd(), 'data');

    // Create data directory if it doesn't exist
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const filePath = path.join(dataDir, 'training-documents.json');
    fs.writeFileSync(filePath, JSON.stringify(documents, null, 2), 'utf8');

    console.log(`Saved ${documents.length} mock training documents to ${filePath}`);
  } catch (error) {
    console.error('Error saving mock training documents:', error);
  }

  return documents;
}
