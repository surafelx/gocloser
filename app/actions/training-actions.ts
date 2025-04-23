'use server';

// This module should only be used on the server side

import { loadTrainingDocuments, getTrainingDocumentById, TrainingDocument } from '@/lib/simple-pdf-processor';
import { refreshTrainingDocuments } from '@/lib/pdf-processor';

/**
 * Server action to refresh training documents
 */
export async function refreshTrainingData(): Promise<{ success: boolean; count: number; message: string }> {
  try {
    // Process real PDFs from the training folder
    const documents = await refreshTrainingDocuments();
    return {
      success: true,
      count: documents.length,
      message: `Successfully processed ${documents.length} training documents from PDFs`
    };
  } catch (error: any) {
    console.error('Error processing training PDFs:', error);
    return {
      success: false,
      count: 0,
      message: error.message || 'An error occurred while processing training PDFs'
    };
  }
}

/**
 * Server action to get all training documents
 */
export async function getTrainingDocuments(
  options: { category?: string; query?: string } = {}
): Promise<{ success: boolean; documents: Partial<TrainingDocument>[]; count: number }> {
  try {
    let documents = await loadTrainingDocuments();

    // Filter by category if provided
    if (options.category) {
      documents = documents.filter(doc => doc.category === options.category);
    }

    // Filter by search query if provided
    if (options.query) {
      const lowerQuery = options.query.toLowerCase();
      documents = documents.filter(doc =>
        doc.title.toLowerCase().includes(lowerQuery) ||
        doc.content.toLowerCase().includes(lowerQuery)
      );
    }

    // Return only metadata (not full content) to reduce response size
    const documentMetadata = documents.map(doc => ({
      id: doc.id,
      title: doc.title,
      category: doc.category,
      source: doc.source,
      createdAt: doc.createdAt,
      contentPreview: doc.content.substring(0, 200) + (doc.content.length > 200 ? '...' : '')
    }));

    return {
      success: true,
      documents: documentMetadata,
      count: documentMetadata.length
    };
  } catch (error: any) {
    console.error('Error getting training documents:', error);
    return {
      success: false,
      documents: [],
      count: 0
    };
  }
}

/**
 * Server action to get a specific training document by ID
 */
export async function getTrainingDocumentByIdAction(id: string): Promise<{
  success: boolean;
  document: TrainingDocument | null
}> {
  try {
    const document = await getTrainingDocumentById(id);

    return {
      success: !!document,
      document
    };
  } catch (error: any) {
    console.error('Error getting training document by ID:', error);
    return {
      success: false,
      document: null
    };
  }
}
