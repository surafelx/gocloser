// Common types used throughout the application

export interface Message {
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
  createdAt?: Date;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatHistory {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
}

export interface ChatWithMessages extends ChatHistory {
  messages: Message[];
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface PerformanceMetric {
  name: string;
  score: number;
}

export interface PerformanceData {
  overallScore: number;
  metrics: PerformanceMetric[];
  strengths: string[];
  improvements: string[];
}

export interface AnalysisResult {
  analysisText: string;
  overallScore: number;
  metrics: PerformanceMetric[];
  strengths: string[];
  improvements: string[];
  tokenUsage: TokenUsage;
}
