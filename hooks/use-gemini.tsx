'use client';

import { useState } from 'react';

interface Message {
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
}

interface UseGeminiProps {
  initialMessages?: Message[];
}

export function useGemini({ initialMessages = [] }: UseGeminiProps = {}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);

  // Format history for Gemini
  const formatHistoryForGemini = (messages: Message[]) => {
    // Filter out system messages and ensure we have at least one user message first
    const filteredMessages = messages.filter((msg) => msg.role !== 'system');

    // If there are no messages or the first message is not from a user, return an empty array
    if (filteredMessages.length === 0) {
      return [];
    }

    // Ensure the conversation starts with a user message
    const formattedHistory = [];
    let hasUserMessage = false;

    for (const msg of filteredMessages) {
      // Skip assistant messages until we have at least one user message
      if (!hasUserMessage && msg.role === 'assistant') {
        continue;
      }

      if (msg.role === 'user') {
        hasUserMessage = true;
        formattedHistory.push({
          role: 'user',
          parts: [{ text: msg.content }],
        });
      } else if (msg.role === 'assistant') {
        formattedHistory.push({
          role: 'model',
          parts: [{ text: msg.content }],
        });
      }
    }

    return formattedHistory;
  };

  // Send a message to Gemini
  const sendMessage = async (content: string) => {
    setIsLoading(true);

    try {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content,
      };

      // Add user message to state
      setMessages((prev) => [...prev, userMessage]);

      // Format history for Gemini
      const history = formatHistoryForGemini(messages);

      // Send request to API
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: content,
          history,
          type: 'chat',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from Gemini');
      }

      const data = await response.json();

      // Add assistant message to state
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.response,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      return assistantMessage;
    } catch (error) {
      console.error('Error sending message:', error);

      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
      };

      setMessages((prev) => [...prev, errorMessage]);
      return errorMessage;
    } finally {
      setIsLoading(false);
    }
  };

  // Analyze content with Gemini
  const analyzeContent = async (
    contentType: string,
    contentData: string,
    fileName: string,
    additionalContext?: string,
  ) => {
    setIsLoading(true);

    try {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: `Please analyze this ${contentType} file: ${fileName}`,
        attachmentType: contentType as any,
        attachmentName: fileName,
      };

      // Add user message to state
      setMessages((prev) => [...prev, userMessage]);

      // Processing message
      const processingMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `I'm analyzing your ${contentType} file "${fileName}". This will take a moment...`,
      };

      setMessages((prev) => [...prev, processingMessage]);

      // Send request to API
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'analyze',
          content: {
            type: contentType,
            data: contentData,
          },
          additionalContext,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze content with Gemini');
      }

      const data = await response.json();

      // Create content for analysis message
      let analysisContent = '';
      if (contentType === 'audio') {
        analysisContent = "I've analyzed your sales call recording. Here's what I found:";
      } else if (contentType === 'video') {
        analysisContent = "I've analyzed your sales presentation video. Here's what I found:";
      } else {
        analysisContent = "I've analyzed your sales document. Here's what I found:";
      }

      // Add analysis message to state
      const analysisMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: analysisContent,
        isAnalysis: true,
        performanceData: {
          overallScore: data.analysis.overallScore,
          metrics: data.analysis.metrics,
          strengths: data.analysis.strengths,
          improvements: data.analysis.improvements,
        },
      };

      // Replace the processing message with the analysis message
      setMessages((prev) => prev.filter((msg) => msg.id !== processingMessage.id).concat(analysisMessage));

      return analysisMessage;
    } catch (error: any) {
      console.error('Error analyzing content:', error);

      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error analyzing your content. Please try again.',
      };

      setMessages((prev) =>
        prev
          .filter(
            (msg) => msg.content !== `I'm analyzing your ${contentType} file "${fileName}". This will take a moment...`,
          )
          .concat(errorMessage),
      );

      return errorMessage;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    setMessages,
    isLoading,
    sendMessage,
    analyzeContent,
  };
}
