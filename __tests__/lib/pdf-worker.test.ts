import { initPdfJs, extractTextFromPdf } from '@/lib/pdf-worker';

// Mock the pdfjs-dist module
jest.mock('pdfjs-dist', () => {
  const mockGetPage = jest.fn().mockResolvedValue({
    getTextContent: jest.fn().mockResolvedValue({
      items: [
        { str: 'This is ' },
        { str: 'a test ' },
        { str: 'PDF document.' }
      ]
    })
  });
  
  const mockGetDocument = jest.fn().mockReturnValue({
    promise: Promise.resolve({
      numPages: 2,
      getPage: mockGetPage
    })
  });
  
  return {
    getDocument: mockGetDocument,
    GlobalWorkerOptions: {
      workerSrc: null
    }
  };
});

describe('PDF Worker', () => {
  test('initPdfJs initializes PDF.js with the correct worker', async () => {
    const pdfjs = await initPdfJs();
    
    expect(pdfjs).toBeDefined();
    expect(pdfjs.GlobalWorkerOptions.workerSrc).toContain('pdf.worker.min.js');
  });
  
  test('extractTextFromPdf extracts text from a PDF file', async () => {
    // Create a mock PDF file
    const mockPdfFile = new File(['mock PDF content'], 'test.pdf', { type: 'application/pdf' });
    
    // Extract text from the mock PDF
    const text = await extractTextFromPdf(mockPdfFile);
    
    // Check that the text was extracted correctly
    expect(text).toContain('This is a test PDF document.');
  });
  
  test('extractTextFromPdf handles errors gracefully', async () => {
    // Mock the getDocument function to throw an error
    const pdfjs = require('pdfjs-dist');
    pdfjs.getDocument.mockImplementationOnce(() => {
      throw new Error('Failed to load PDF');
    });
    
    // Create a mock PDF file
    const mockPdfFile = new File(['mock PDF content'], 'test.pdf', { type: 'application/pdf' });
    
    // Attempt to extract text from the mock PDF
    await expect(extractTextFromPdf(mockPdfFile)).rejects.toThrow('Failed to extract text from PDF');
  });
});
