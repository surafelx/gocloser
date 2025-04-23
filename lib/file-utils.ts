import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { generateResponse } from './gemini';
import schedule from 'node-schedule';
import File from '@/models/File';

// Define the uploads directory
const uploadsDir = path.join(process.cwd(), 'uploads');

// Ensure the uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Save a file to the uploads directory
export async function saveFile(file: Buffer, originalName: string, fileType: string, userId: string) {
  // Generate a unique filename
  const fileName = `${uuidv4()}-${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const filePath = path.join(uploadsDir, fileName);

  // Write the file to disk
  fs.writeFileSync(filePath, file);

  // Calculate file size
  const fileSize = fs.statSync(filePath).size;

  // Set expiration time (2 minutes from now)
  const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

  // Create a file record in the database
  const fileRecord = await File.create({
    userId,
    originalName,
    fileName,
    fileType,
    filePath,
    fileSize,
    expiresAt,
    summary: '',
  });

  // Schedule file deletion
  scheduleFileDeletion(filePath, fileRecord._id);

  return fileRecord;
}

// Generate a summary of a file using Gemini AI
export async function generateFileSummary(filePath: string, fileType: string) {
  try {
    // Read the file content
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // Generate a summary using Gemini
    const prompt = `Please provide a concise summary of the following ${fileType} content:\n\n${fileContent}`;
    const summary = await generateResponse(prompt);

    return summary;
  } catch (error) {
    console.error('Error generating file summary:', error);
    return 'Unable to generate summary for this file.';
  }
}

// Schedule file deletion after 2 minutes
function scheduleFileDeletion(filePath: string, fileId: string) {
  // Schedule the job to run after 2 minutes
  const job = schedule.scheduleJob(new Date(Date.now() + 2 * 60 * 1000), async () => {
    try {
      // Delete the file from disk if it exists
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`File deleted: ${filePath}`);
      }

      // The file document will be automatically deleted by MongoDB TTL index
      console.log(`File record with ID ${fileId} will be deleted by MongoDB TTL index`);
    } catch (error) {
      console.error(`Error deleting file ${filePath}:`, error);
    }
  });

  return job;
}

// Get a file by ID
export async function getFileById(fileId: string, userId: string) {
  const file = await File.findOne({ _id: fileId, userId });
  return file;
}

// Delete a file
export async function deleteFile(fileId: string, userId: string) {
  const file = await File.findOne({ _id: fileId, userId });
  
  if (!file) {
    throw new Error('File not found');
  }

  // Delete the file from disk if it exists
  if (fs.existsSync(file.filePath)) {
    fs.unlinkSync(file.filePath);
  }

  // Delete the file record from the database
  await File.deleteOne({ _id: fileId, userId });

  return true;
}
