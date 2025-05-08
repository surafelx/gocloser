import { loadTrainingDocuments, TrainingDocument } from './simple-pdf-processor';

/**
 * Interface for document relevance score
 */
interface DocumentRelevance {
  document: TrainingDocument;
  score: number;
  matchedTerms: string[];
}

/**
 * Select the most relevant documents based on a user query
 * @param query The user's question or query
 * @param maxDocuments Maximum number of documents to return (default: 3)
 * @returns Array of the most relevant documents with their content
 */
export async function selectRelevantDocuments(
  query: string,
  maxDocuments: number = 3
): Promise<{
  documents: Array<{
    id: string;
    title: string;
    category: string;
    content: string;
    relevanceScore: number;
  }>;
  categories: string[];
}> {
  try {
    // Load all training documents
    const allDocuments = await loadTrainingDocuments();
    
    if (!allDocuments || allDocuments.length === 0) {
      console.log('No training documents available');
      return { documents: [], categories: [] };
    }
    
    // Extract key terms from the query
    const keyTerms = extractKeyTerms(query);
    console.log('Extracted key terms:', keyTerms);
    
    // Score documents based on relevance to the query
    const scoredDocuments = scoreDocuments(allDocuments, query, keyTerms);
    
    // Get the top N most relevant documents
    const topDocuments = scoredDocuments
      .sort((a, b) => b.score - a.score)
      .slice(0, maxDocuments);
    
    console.log(`Selected ${topDocuments.length} most relevant documents`);
    
    // Format the results
    const selectedDocuments = topDocuments.map(item => ({
      id: item.document.id,
      title: item.document.title,
      category: item.document.category,
      content: item.document.content,
      relevanceScore: item.score
    }));
    
    // Extract unique categories from selected documents
    const categories = [...new Set(selectedDocuments.map(doc => doc.category))];
    
    return { 
      documents: selectedDocuments,
      categories
    };
  } catch (error) {
    console.error('Error selecting relevant documents:', error);
    return { documents: [], categories: [] };
  }
}

/**
 * Extract key terms from a query
 * @param query The user's question or query
 * @returns Array of key terms
 */
function extractKeyTerms(query: string): string[] {
  // Convert to lowercase and remove punctuation
  const cleanedQuery = query.toLowerCase().replace(/[^\w\s]/g, ' ');
  
  // Split into words
  const words = cleanedQuery.split(/\s+/).filter(word => word.length > 0);
  
  // Remove common stop words
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 
    'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'to', 'from', 'in', 'out', 'on', 'off', 'over', 'under', 'again',
    'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
    'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other',
    'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
    'than', 'too', 'very', 'can', 'will', 'just', 'should', 'now'
  ]);
  
  // Filter out stop words and keep only meaningful terms
  const keyTerms = words.filter(word => !stopWords.has(word) && word.length > 2);
  
  // Add specific sales-related terms that might be in the query
  const salesTerms = [
    'sales', 'selling', 'pitch', 'objection', 'closing', 'discovery',
    'prospect', 'customer', 'client', 'deal', 'presentation', 'negotiation',
    'value', 'benefit', 'feature', 'price', 'discount', 'competitor',
    'follow-up', 'pipeline', 'lead', 'opportunity', 'conversion'
  ];
  
  // Check if any sales terms are in the original query
  salesTerms.forEach(term => {
    if (cleanedQuery.includes(term) && !keyTerms.includes(term)) {
      keyTerms.push(term);
    }
  });
  
  return keyTerms;
}

/**
 * Score documents based on relevance to the query
 * @param documents Array of training documents
 * @param query The original user query
 * @param keyTerms Array of key terms extracted from the query
 * @returns Array of documents with relevance scores
 */
function scoreDocuments(
  documents: TrainingDocument[],
  query: string,
  keyTerms: string[]
): DocumentRelevance[] {
  return documents.map(document => {
    const lowerContent = document.content.toLowerCase();
    const lowerTitle = document.title.toLowerCase();
    
    // Initialize score and matched terms
    let score = 0;
    const matchedTerms: string[] = [];
    
    // Check for exact query match (highest relevance)
    if (lowerContent.includes(query.toLowerCase())) {
      score += 10;
      matchedTerms.push(query);
    }
    
    // Check for title matches (high relevance)
    keyTerms.forEach(term => {
      if (lowerTitle.includes(term)) {
        score += 5;
        matchedTerms.push(term);
      }
    });
    
    // Check for content matches
    keyTerms.forEach(term => {
      // Count occurrences of the term in content
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      const matches = lowerContent.match(regex);
      
      if (matches) {
        // Add score based on number of matches
        const matchCount = matches.length;
        score += Math.min(matchCount, 5); // Cap at 5 to prevent one term from dominating
        
        if (!matchedTerms.includes(term)) {
          matchedTerms.push(term);
        }
      }
    });
    
    // Boost score based on category relevance
    const lowerQuery = query.toLowerCase();
    if (
      (document.category === 'closing' && lowerQuery.includes('clos')) ||
      (document.category === 'objection' && lowerQuery.includes('object')) ||
      (document.category === 'discovery' && lowerQuery.includes('question')) ||
      (document.category === 'scripts' && lowerQuery.includes('script'))
    ) {
      score += 3;
    }
    
    return {
      document,
      score,
      matchedTerms
    };
  });
}
