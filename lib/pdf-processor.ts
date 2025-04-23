import fs from 'fs';
import path from 'path';
// Fix import path for PDFLoader
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';

// Mark this module as server-only
import 'server-only';

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
 * Process all PDFs in the training folder and extract their text content
 */
export async function processTrainingPDFs(): Promise<TrainingDocument[]> {
  try {
    const trainingDir = path.join(process.cwd(), 'training');
    const files = fs.readdirSync(trainingDir);
    const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));

    console.log(`Found ${pdfFiles.length} PDF files in training directory`);

    const documents: TrainingDocument[] = [];

    for (const file of pdfFiles) {
      try {
        const filePath = path.join(trainingDir, file);
        console.log(`Processing PDF: ${filePath}`);

        // Use PDFLoader to extract text
        const loader = new PDFLoader(filePath);
        const docs = await loader.load();

        // Combine all pages into one document
        const content = docs.map(doc => doc.pageContent).join('\n\n');

        // Determine category based on filename
        let category = 'general';
        const lowerFileName = file.toLowerCase();

        if (lowerFileName.includes('script')) {
          category = 'scripts';
        } else if (lowerFileName.includes('closing')) {
          category = 'closing';
        } else if (lowerFileName.includes('interview')) {
          category = 'interview';
        } else if (lowerFileName.includes('intelligence')) {
          category = 'intelligence';
        } else if (lowerFileName.includes('preparation')) {
          category = 'preparation';
        }

        // Create a document object
        const document: TrainingDocument = {
          id: file.replace('.pdf', '').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase(),
          title: file.replace('.pdf', ''),
          content,
          source: file,
          category,
          createdAt: new Date()
        };

        documents.push(document);
        console.log(`Successfully processed ${file} (${content.length} characters)`);
      } catch (error) {
        console.error(`Error processing PDF ${file}:`, error);
      }
    }

    return documents;
  } catch (error) {
    console.error('Error processing training PDFs:', error);
    return [];
  }
}

/**
 * Save processed training documents to a JSON file
 */
export async function saveTrainingDocuments(documents: TrainingDocument[]): Promise<boolean> {
  try {
    const dataDir = path.join(process.cwd(), 'data');

    // Create data directory if it doesn't exist
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const filePath = path.join(dataDir, 'training-documents.json');
    fs.writeFileSync(filePath, JSON.stringify(documents, null, 2), 'utf8');

    console.log(`Saved ${documents.length} training documents to ${filePath}`);
    return true;
  } catch (error) {
    console.error('Error saving training documents:', error);
    return false;
  }
}

/**
 * Load processed training documents from JSON file
 */
export async function loadTrainingDocuments(): Promise<TrainingDocument[]> {
  try {
    const filePath = path.join(process.cwd(), 'data', 'training-documents.json');

    if (!fs.existsSync(filePath)) {
      console.log('Training documents file not found, processing PDFs...');
      const documents = await processTrainingPDFs();
      await saveTrainingDocuments(documents);
      return documents;
    }

    const data = fs.readFileSync(filePath, 'utf8');
    const documents = JSON.parse(data) as TrainingDocument[];

    console.log(`Loaded ${documents.length} training documents from ${filePath}`);
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
 * Refresh training documents by reprocessing PDFs
 */
export async function refreshTrainingDocuments(): Promise<TrainingDocument[]> {
  try {
    console.log('Refreshing training documents...');
    const documents = await processTrainingPDFs();
    await saveTrainingDocuments(documents);
    return documents;
  } catch (error) {
    console.error('Error refreshing training documents:', error);
    return [];
  }
}
