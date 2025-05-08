import mongoose, { Schema, Document, Model } from 'mongoose';

// Define the Transcript interface
export interface ITranscript extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  originalFileName: string;
  fileType: string;
  fileSize: number;
  duration: number;
  transcriptText: string;
  formattedTranscript: string;
  analysis: {
    summary: string;
    keyPoints: string[];
    sentiment: string;
    topics: string[];
    actionItems: string[];
  };
  metadata: {
    speakers: number;
    words: number;
    paragraphs: number;
    channels: number;
  };
  s3Key?: string;
  cloudinaryId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Create the Transcript schema
const TranscriptSchema = new Schema<ITranscript>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    originalFileName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    transcriptText: {
      type: String,
      required: true,
    },
    formattedTranscript: {
      type: String,
      required: true,
    },
    analysis: {
      summary: String,
      keyPoints: [String],
      sentiment: String,
      topics: [String],
      actionItems: [String],
    },
    metadata: {
      speakers: Number,
      words: Number,
      paragraphs: Number,
      channels: Number,
    },
    s3Key: String,
    cloudinaryId: String,
  },
  {
    timestamps: true,
  }
);

// Create and export the Transcript model
let Transcript: Model<ITranscript>;

try {
  // Try to get the existing model to prevent OverwriteModelError
  Transcript = mongoose.model<ITranscript>('Transcript');
} catch (error) {
  // Model doesn't exist yet, so create it
  Transcript = mongoose.model<ITranscript>('Transcript', TranscriptSchema);
}

export default Transcript;
