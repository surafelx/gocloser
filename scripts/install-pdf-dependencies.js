const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if package.json exists
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('package.json not found. Please run this script from the project root directory.');
  process.exit(1);
}

// Dependencies to install
const dependencies = [
  'langchain',
  '@langchain/community',
  'pdf-parse',
  '@langchain/openai',
  'pdfjs-dist',
  'server-only'
];

console.log('Installing PDF processing dependencies...');

try {
  // Install dependencies
  execSync(`npm install ${dependencies.join(' ')}`, { stdio: 'inherit' });

  console.log('\nDependencies installed successfully!');
  console.log('\nNow you can process PDFs from the training folder.');
  console.log('To refresh training data, call the API endpoint: /api/training/refresh');

} catch (error) {
  console.error('Error installing dependencies:', error.message);
  process.exit(1);
}
