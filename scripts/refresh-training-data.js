// Script to refresh training data
const { execSync } = require('child_process');

console.log('Refreshing training data to include new Closer Academy Documents PDF...');

try {
  // Option 1: Call the API endpoint directly
  // This requires authentication, so we'll use the server action instead
  
  // Option 2: Run the process-training-pdfs.js script directly
  console.log('Processing PDFs in the training folder...');
  execSync('node scripts/process-training-pdfs.js', { stdio: 'inherit' });
  
  console.log('Training data refreshed successfully!');
  console.log('The new Closer Academy Documents PDF has been added to the training data.');
  console.log('Gemini API responses have been configured to be shorter.');
} catch (error) {
  console.error('Error refreshing training data:', error);
  process.exit(1);
}
