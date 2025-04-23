import mongoose, { Schema, Document, Model } from 'mongoose';

// Define the Message interface
interface IMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachmentType?: 'audio' | 'video' | 'text';
  attachmentName?: string;
  isAnalysis?: boolean;
  performanceData?: {
    overallScore: number;
    metrics: {
      name: string;
      score: number;
    }[];
    strengths: string[];
    improvements: string[];
  };
  createdAt: Date;
}

// Define the Chat interface
export interface IChat extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// Create the Message schema
const MessageSchema = new Schema<IMessage>(
  {
    id: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    attachmentType: {
      type: String,
      enum: ['audio', 'video', 'text'],
    },
    attachmentName: {
      type: String,
    },
    isAnalysis: {
      type: Boolean,
      default: false,
    },
    performanceData: {
      overallScore: Number,
      metrics: [
        {
          name: String,
          score: Number,
        },
      ],
      strengths: [String],
      improvements: [String],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }
);

// Create the Chat schema
const ChatSchema = new Schema<IChat>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      default: 'New Chat',
    },
    messages: [MessageSchema],
  },
  {
    timestamps: true,
  }
);

// Create and export the Chat model
let Chat: Model<IChat>;

try {
  // Try to get the existing model to prevent OverwriteModelError
  Chat = mongoose.model<IChat>('Chat');
} catch (error) {
  // Model doesn't exist yet, so create it
  Chat = mongoose.model<IChat>('Chat', ChatSchema);
}

export default Chat;
