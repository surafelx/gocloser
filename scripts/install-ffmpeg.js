const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('Checking for FFmpeg installation...');

// Function to check if FFmpeg is installed
function isFFmpegInstalled() {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Install FFmpeg based on the operating system
function installFFmpeg() {
  const platform = os.platform();
  
  try {
    if (platform === 'darwin') {
      // macOS
      console.log('Installing FFmpeg using Homebrew...');
      console.log('This may take a few minutes...');
      
      // Check if Homebrew is installed
      try {
        execSync('brew --version', { stdio: 'ignore' });
      } catch (error) {
        console.log('Homebrew not found. Installing Homebrew first...');
        execSync('/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"', { stdio: 'inherit' });
      }
      
      // Install FFmpeg
      execSync('brew install ffmpeg', { stdio: 'inherit' });
    } else if (platform === 'linux') {
      // Linux (Ubuntu/Debian)
      console.log('Installing FFmpeg using apt...');
      execSync('sudo apt update && sudo apt install -y ffmpeg', { stdio: 'inherit' });
    } else if (platform === 'win32') {
      // Windows
      console.log('For Windows, please install FFmpeg manually:');
      console.log('1. Download FFmpeg from https://ffmpeg.org/download.html');
      console.log('2. Extract the files to a folder (e.g., C:\\ffmpeg)');
      console.log('3. Add the bin folder to your PATH environment variable');
      return false;
    } else {
      console.log(`Unsupported platform: ${platform}`);
      console.log('Please install FFmpeg manually from https://ffmpeg.org/download.html');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error installing FFmpeg:', error.message);
    console.log('Please install FFmpeg manually from https://ffmpeg.org/download.html');
    return false;
  }
}

// Main execution
if (isFFmpegInstalled()) {
  console.log('FFmpeg is already installed.');
} else {
  console.log('FFmpeg is not installed. Attempting to install...');
  const success = installFFmpeg();
  
  if (success) {
    console.log('FFmpeg installed successfully!');
  } else {
    console.log('Failed to install FFmpeg automatically. Please install it manually.');
  }
}

// Check for Google Cloud credentials
const googleCredentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!googleCredentialsPath) {
  console.log('\nGoogle Cloud credentials not found in environment variables.');
  console.log('To use Google Speech-to-Text, set GOOGLE_APPLICATION_CREDENTIALS to point to your service account key file.');
  console.log('Example: export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your-project-credentials.json"');
} else {
  console.log(`\nGoogle Cloud credentials found: ${googleCredentialsPath}`);
  
  // Check if the file exists
  if (fs.existsSync(googleCredentialsPath)) {
    console.log('Google Cloud credentials file exists.');
  } else {
    console.log('Warning: Google Cloud credentials file not found at the specified path.');
  }
}

console.log('\nSetup complete. You can now use audio/video transcription features.');
