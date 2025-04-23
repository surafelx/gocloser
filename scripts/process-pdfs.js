// Simple script to process PDFs in the training folder
const fs = require('fs');
const path = require('path');
const { PDFLoader } = require('langchain/document_loaders/fs/pdf');

// Define paths
const trainingDir = path.join(process.cwd(), 'training');
const dataDir = path.join(process.cwd(), 'data');
const outputPath = path.join(dataDir, 'training-documents.json');

// Create data directory if it doesn't exist
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Process all PDFs in the training folder
async function processPDFs() {
  try {
    // Check if training directory exists
    if (!fs.existsSync(trainingDir)) {
      console.error(`Training directory not found: ${trainingDir}`);
      return [];
    }

    // Get all PDF files
    const files = fs.readdirSync(trainingDir);
    const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));

    if (pdfFiles.length === 0) {
      console.error('No PDF files found in training directory');
      return [];
    }

    console.log(`Found ${pdfFiles.length} PDF files in training directory`);
    
    const documents = [];

    // Process each PDF file
    for (const file of pdfFiles) {
      const filePath = path.join(trainingDir, file);
      console.log(`Processing PDF: ${filePath}`);

      try {
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
        const document = {
          id: file.replace('.pdf', '').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase(),
          title: file.replace('.pdf', ''),
          content,
          source: file,
          category,
          createdAt: new Date().toISOString()
        };

        documents.push(document);
        console.log(`Successfully processed ${file} (${content.length} characters)`);
      } catch (error) {
        console.error(`Error processing PDF ${file}:`, error);
      }
    }

    return documents;
  } catch (error) {
    console.error('Error processing PDFs:', error);
    return [];
  }
}

// Save documents to JSON file
function saveDocuments(documents) {
  try {
    fs.writeFileSync(outputPath, JSON.stringify(documents, null, 2), 'utf8');
    console.log(`Saved ${documents.length} documents to ${outputPath}`);
    return true;
  } catch (error) {
    console.error('Error saving documents:', error);
    return false;
  }
}

// Main function
async function main() {
  console.log('Starting PDF processing...');
  const documents = await processPDFs();
  
  if (documents.length > 0) {
    saveDocuments(documents);
    console.log('PDF processing completed successfully');
  } else {
    console.error('No documents were processed');
  }
}

// Run the script
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
