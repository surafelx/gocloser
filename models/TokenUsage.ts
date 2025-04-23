import mongoose, { Schema, Document, Model } from 'mongoose';

// Define the TokenUsage interface
export interface ITokenUsage extends Document {
  userId: mongoose.Types.ObjectId;
  sessionId: string;
  messageId: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
  model: string;
  createdAt: Date;
}

// Create the TokenUsage schema
const TokenUsageSchema = new Schema<ITokenUsage>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sessionId: {
      type: String,
      required: true,
    },
    messageId: {
      type: String,
      required: true,
    },
    promptTokens: {
      type: Number,
      required: true,
      default: 0,
    },
    completionTokens: {
      type: Number,
      required: true,
      default: 0,
    },
    totalTokens: {
      type: Number,
      required: true,
      default: 0,
    },
    estimatedCost: {
      type: Number,
      required: true,
      default: 0,
    },
    model: {
      type: String,
      required: true,
      default: 'gemini-pro',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }
);

// Create and export the TokenUsage model
let TokenUsage: Model<ITokenUsage>;

try {
  // Try to get the existing model to prevent OverwriteModelError
  TokenUsage = mongoose.model<ITokenUsage>('TokenUsage');
} catch (error) {
  // Model doesn't exist yet, so create it
  TokenUsage = mongoose.model<ITokenUsage>('TokenUsage', TokenUsageSchema);
}

export default TokenUsage;
