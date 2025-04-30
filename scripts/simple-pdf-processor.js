// A simple script to create a basic training document JSON without actually parsing PDFs
// This is a workaround for when the PDF parsing libraries are not working

const fs = require('fs');
const path = require('path');

// Define paths
const trainingDir = path.join(process.cwd(), 'training');
const dataDir = path.join(process.cwd(), 'data');
const outputPath = path.join(dataDir, 'training-documents.json');

// Create data directory if it doesn't exist
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Get all PDF files in the training directory
function getPdfFiles() {
  try {
    if (!fs.existsSync(trainingDir)) {
      console.error(`Training directory not found: ${trainingDir}`);
      return [];
    }

    const files = fs.readdirSync(trainingDir);
    const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));
    
    console.log(`Found ${pdfFiles.length} PDF files in training directory`);
    return pdfFiles;
  } catch (error) {
    console.error('Error getting PDF files:', error);
    return [];
  }
}

// Create a simple document object for each PDF
function createDocuments(pdfFiles) {
  const documents = [];
  
  for (const file of pdfFiles) {
    try {
      const filePath = path.join(trainingDir, file);
      console.log(`Creating document for: ${filePath}`);
      
      // Get file stats
      const stats = fs.statSync(filePath);
      
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
      } else if (lowerFileName.includes('academy')) {
        category = 'academy';
      }
      
      // Create a placeholder document object
      const document = {
        id: file.replace('.pdf', '').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase(),
        title: file.replace('.pdf', ''),
        content: `This is a placeholder for the content of ${file}. The actual content would be extracted using a PDF parsing library. This file is ${Math.round(stats.size / 1024)} KB in size.`,
        source: file,
        category,
        createdAt: new Date().toISOString()
      };
      
      documents.push(document);
      console.log(`Created document for ${file}`);
    } catch (error) {
      console.error(`Error creating document for ${file}:`, error);
    }
  }
  
  return documents;
}

// Save documents to JSON file
function saveDocuments(documents) {
  try {
    // Check if there's an existing file
    let existingDocuments = [];
    if (fs.existsSync(outputPath)) {
      try {
        const data = fs.readFileSync(outputPath, 'utf8');
        existingDocuments = JSON.parse(data);
        console.log(`Loaded ${existingDocuments.length} existing documents`);
      } catch (error) {
        console.error('Error loading existing documents:', error);
      }
    }
    
    // Create a map of existing documents by ID
    const existingDocumentsMap = {};
    for (const doc of existingDocuments) {
      existingDocumentsMap[doc.id] = doc;
    }
    
    // Merge new documents with existing ones
    for (const doc of documents) {
      existingDocumentsMap[doc.id] = doc;
    }
    
    // Convert map back to array
    const mergedDocuments = Object.values(existingDocumentsMap);
    
    // Save merged documents
    fs.writeFileSync(outputPath, JSON.stringify(mergedDocuments, null, 2), 'utf8');
    console.log(`Saved ${mergedDocuments.length} documents to ${outputPath}`);
    return true;
  } catch (error) {
    console.error('Error saving documents:', error);
    return false;
  }
}

// Main function
function main() {
  console.log('Starting simple PDF processing...');
  const pdfFiles = getPdfFiles();
  
  if (pdfFiles.length > 0) {
    const documents = createDocuments(pdfFiles);
    
    if (documents.length > 0) {
      saveDocuments(documents);
      console.log('PDF processing completed successfully');
    } else {
      console.error('No documents were created');
    }
  } else {
    console.error('No PDF files found');
  }
}

// Run the script
main();
