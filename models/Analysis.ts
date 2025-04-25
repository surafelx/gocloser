import mongoose, { Schema, Document } from 'mongoose';

// Define the metric interface
interface Metric {
  name: string;
  score: number;
  description: string;
}

// Define the analysis document interface
export interface AnalysisDocument extends Document {
  userId: mongoose.Types.ObjectId;
  chatIds: mongoose.Types.ObjectId[];
  title: string;
  date: Date;
  overallScore: number;
  metrics: Metric[];
  strengths: string[];
  improvements: string[];
  type: 'text' | 'audio' | 'video' | 'file';
  status: 'complete' | 'analyzing' | 'error';
  createdAt: Date;
  updatedAt: Date;
}

// Define the metric schema
const MetricSchema = new Schema<Metric>({
  name: { type: String, required: true },
  score: { type: Number, required: true },
  description: { type: String, required: true }
});

// Define the analysis schema
const AnalysisSchema = new Schema<AnalysisDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    chatIds: [{ type: Schema.Types.ObjectId, ref: 'Chat' }],
    title: { type: String, required: true },
    date: { type: Date, required: true, default: Date.now },
    overallScore: { type: Number, required: true },
    metrics: [MetricSchema],
    strengths: [String],
    improvements: [String],
    type: { 
      type: String, 
      enum: ['text', 'audio', 'video', 'file'], 
      default: 'text' 
    },
    status: { 
      type: String, 
      enum: ['complete', 'analyzing', 'error'], 
      default: 'complete' 
    }
  },
  { timestamps: true }
);

// Create and export the Analysis model
export default mongoose.models.Analysis || mongoose.model<AnalysisDocument>('Analysis', AnalysisSchema);
