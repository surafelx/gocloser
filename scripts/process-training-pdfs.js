const fs = require('fs');
const path = require('path');
const { PDFLoader } = require('@langchain/community/document_loaders/fs/pdf');

// Define paths
const trainingDir = path.join(process.cwd(), 'training');
const dataDir = path.join(process.cwd(), 'data');
const outputPath = path.join(dataDir, 'training-documents.json');

// Create data directory if it doesn't exist
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Process PDFs
async function processTrainingPDFs() {
  try {
    // Check if training directory exists
    if (!fs.existsSync(trainingDir)) {
      console.error(`Training directory not found: ${trainingDir}`);
      return [];
    }

    // Get all PDF files
    const files = fs.readdirSync(trainingDir);
    const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));

    console.log(`Found ${pdfFiles.length} PDF files in training directory`);

    const documents = [];

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

    // Save documents to JSON file
    fs.writeFileSync(outputPath, JSON.stringify(documents, null, 2), 'utf8');
    console.log(`Saved ${documents.length} training documents to ${outputPath}`);

    return documents;
  } catch (error) {
    console.error('Error processing training PDFs:', error);
    return [];
  }
}

// Run the processing
processTrainingPDFs()
  .then(documents => {
    console.log(`Processed ${documents.length} documents successfully.`);
    process.exit(0);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
