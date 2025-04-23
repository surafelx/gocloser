/**
 * PDF.js worker configuration
 * This file sets up the PDF.js worker for client-side PDF processing
 */

import { PDFDocumentProxy } from 'pdfjs-dist';

let pdfjsLib: typeof import('pdfjs-dist');

/**
 * Initialize PDF.js with the worker
 */
export async function initPdfJs() {
  if (pdfjsLib) return pdfjsLib;
  
  // Load PDF.js dynamically
  pdfjsLib = await import('pdfjs-dist');
  
  // Set the worker source path
  // Using a CDN for the worker file with the exact version
  const workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
  
  return pdfjsLib;
}

/**
 * Extract text from a PDF file
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    // Initialize PDF.js
    const pdfjs = await initPdfJs();
    
    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF document
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    
    // Extract text from each page
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item: any) => item.str).join(' ') + '\n';
    }
    
    return text || '[PDF content could not be extracted]';
  } catch (error) {
    console.error('PDF processing error:', error);
    throw new Error('Failed to extract text from PDF. The file might be corrupted or password-protected.');
  }
}
