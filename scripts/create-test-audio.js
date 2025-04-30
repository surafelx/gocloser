const fs = require('fs');
const path = require('path');

// Create a small WAV file with minimal headers
// This creates a 1-second mono audio file at 16kHz
function createTestWavFile() {
  const sampleRate = 16000;
  const duration = 1; // seconds
  const numSamples = sampleRate * duration;
  
  // WAV header (44 bytes)
  const header = Buffer.alloc(44);
  
  // RIFF chunk descriptor
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + numSamples * 2, 4); // File size - 8
  header.write('WAVE', 8);
  
  // Format chunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Format chunk size
  header.writeUInt16LE(1, 20); // Audio format (PCM)
  header.writeUInt16LE(1, 22); // Num channels (mono)
  header.writeUInt32LE(sampleRate, 24); // Sample rate
  header.writeUInt32LE(sampleRate * 2, 28); // Byte rate
  header.writeUInt16LE(2, 32); // Block align
  header.writeUInt16LE(16, 34); // Bits per sample
  
  // Data chunk
  header.write('data', 36);
  header.writeUInt32LE(numSamples * 2, 40);
  
  // Create simple sine wave data
  const data = Buffer.alloc(numSamples * 2);
  for (let i = 0; i < numSamples; i++) {
    const value = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0x7FFF;
    data.writeInt16LE(value, i * 2);
  }
  
  return Buffer.concat([header, data]);
}

// Ensure tmp directory exists
const tmpDir = path.join(process.cwd(), 'tmp');
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

// Create and save the test file
const testFile = createTestWavFile();
const filePath = path.join(tmpDir, 'test-audio.wav');
fs.writeFileSync(filePath, testFile);

console.log(`Created test audio file at: ${filePath}`);