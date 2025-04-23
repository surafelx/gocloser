// This script tests the PDF processing functionality

const fs = require('fs');
const path = require('path');
const { PDFLoader } = require('@langchain/community/document_loaders/fs/pdf');

// Define paths
const trainingDir = path.join(process.cwd(), 'training');
const dataDir = path.join(process.cwd(), 'data');
const outputPath = path.join(dataDir, 'test-training-documents.json');

// Create data directory if it doesn't exist
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Process a single PDF to test functionality
async function testPdfProcessing() {
  try {
    // Check if training directory exists
    if (!fs.existsSync(trainingDir)) {
      console.error(`Training directory not found: ${trainingDir}`);
      return;
    }

    // Get all PDF files
    const files = fs.readdirSync(trainingDir);
    const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));

    if (pdfFiles.length === 0) {
      console.error('No PDF files found in training directory');
      return;
    }

    console.log(`Found ${pdfFiles.length} PDF files in training directory`);
    
    // Process the first PDF file
    const file = pdfFiles[0];
    const filePath = path.join(trainingDir, file);
    
    console.log(`Testing PDF processing with: ${filePath}`);

    try {
      // Use PDFLoader to extract text
      const loader = new PDFLoader(filePath);
      const docs = await loader.load();

      // Combine all pages into one document
      const content = docs.map(doc => doc.pageContent).join('\n\n');

      console.log(`Successfully extracted ${content.length} characters from ${file}`);
      console.log(`First 200 characters: ${content.substring(0, 200)}...`);

      // Save test result
      const testResult = {
        id: file.replace('.pdf', '').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase(),
        title: file.replace('.pdf', ''),
        content: content.substring(0, 1000) + (content.length > 1000 ? '...' : ''),
        source: file,
        extractedAt: new Date().toISOString()
      };

      fs.writeFileSync(outputPath, JSON.stringify(testResult, null, 2), 'utf8');
      console.log(`Saved test result to ${outputPath}`);
      
      return true;
    } catch (error) {
      console.error(`Error processing PDF ${file}:`, error);
      return false;
    }
  } catch (error) {
    console.error('Error testing PDF processing:', error);
    return false;
  }
}

// Run the test
testPdfProcessing()
  .then(success => {
    if (success) {
      console.log('PDF processing test completed successfully');
    } else {
      console.error('PDF processing test failed');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
