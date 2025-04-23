import mongoose, { Schema, Document, Model } from 'mongoose';

// Define the File interface
export interface IFile extends Document {
  userId: mongoose.Types.ObjectId;
  originalName: string;
  fileName: string;
  fileType: string;
  filePath: string;
  fileSize: number;
  summary: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Create the File schema
const FileSchema = new Schema<IFile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    summary: {
      type: String,
      default: '',
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // This will automatically delete documents when expiresAt is reached
    },
  },
  {
    timestamps: true,
  }
);

// Create and export the File model
let File: Model<IFile>;

try {
  // Try to get the existing model to prevent OverwriteModelError
  File = mongoose.model<IFile>('File');
} catch (error) {
  // Model doesn't exist yet, so create it
  File = mongoose.model<IFile>('File', FileSchema);
}

export default File;
