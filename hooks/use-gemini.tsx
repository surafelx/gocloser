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
    console.log('Formatting history for Gemini, messages count:', messages.length);

    // Filter out system messages and welcome message
    const filteredMessages = messages.filter((msg) =>
      msg.role !== 'system' && msg.id !== 'welcome'
    );

    // Log the filtered messages for debugging
    console.log('Filtered messages:', filteredMessages.map(m => ({
      id: m.id,
      role: m.role,
      content: m.content.substring(0, 30) + '...'
    })));

    // If there are no messages, return an empty array
    if (filteredMessages.length === 0) {
      return [];
    }

    // Sort messages by timestamp to ensure proper order
    const sortedMessages = [...filteredMessages].sort((a, b) => {
      // Extract timestamp from ID for consistent sorting
      const getTimestamp = (id: string) => {
        if (id.startsWith('msg_')) {
          const parts = id.split('_');
          return parts.length > 1 ? Number(parts[1]) : 0;
        }
        return Number(id) || 0;
      };

      return getTimestamp(a.id) - getTimestamp(b.id);
    });

    console.log('Sorted messages for Gemini:', sortedMessages.map(m =>
      `${m.id.substring(0, 15)}:${m.role}`
    ));

    // Create a properly formatted history for Gemini
    const formattedHistory = [];

    // Process each message in order
    for (const msg of sortedMessages) {
      // Determine the correct role for Gemini API
      if (msg.role === 'user') {
        formattedHistory.push({
          role: 'user',
          parts: [{ text: msg.content }],
        });
        console.log('Added user message to history:', msg.id.substring(0, 10));
      }
      else if (msg.role === 'assistant') {
        formattedHistory.push({
          role: 'model',
          parts: [{ text: msg.content }],
        });
        console.log('Added assistant message to history:', msg.id.substring(0, 10));
      }
    }

    // Ensure the conversation has alternating user/model messages
    // If we have consecutive messages of the same role, keep only the latest one
    const cleanedHistory = [];
    let lastRole = null;

    for (let i = 0; i < formattedHistory.length; i++) {
      const current = formattedHistory[i];

      // If this is the first message or the role is different from the last one, add it
      if (lastRole === null || current.role !== lastRole) {
        cleanedHistory.push(current);
        lastRole = current.role;
      }
      // If we have consecutive messages with the same role, replace the previous one
      else if (current.role === lastRole) {
        cleanedHistory[cleanedHistory.length - 1] = current;
      }
    }

    // Ensure the conversation ends with a user message
    if (cleanedHistory.length > 0 && cleanedHistory[cleanedHistory.length - 1].role === 'model') {
      cleanedHistory.pop();
    }

    console.log('Final formatted history length:', cleanedHistory.length);
    return cleanedHistory;
  };

  // Send a message to Gemini
  const sendMessage = async (content: string) => {
    setIsLoading(true);

    try {
      // Log the current messages before formatting
      console.log('Current messages before formatting:', messages.length);

      // Format history for Gemini - use the current messages
      // We need to ensure we're using the most up-to-date messages
      const history = formatHistoryForGemini(messages);

      console.log('Sending message to Gemini API with history length:', history.length);
      console.log('User prompt:', content.substring(0, 50) + (content.length > 50 ? '...' : ''));

      // Debug the actual history being sent
      console.log('History being sent to Gemini:', JSON.stringify(history, null, 2));

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

      // Create assistant message with consistent ID format
      // Use a high-precision timestamp to ensure messages are ordered correctly
      // Add a small delay to ensure this timestamp is after the user message
      const timestamp = Date.now() * 1000 + Math.floor(Math.random() * 1000) + 1000; // Add 1 second in microseconds
      const assistantMessage: Message = {
        id: `msg_${timestamp}_${Math.random().toString(36).substring(2, 9)}`,
        role: 'assistant',
        content: data.response,
        tokenUsage: data.tokenUsage || undefined,
      };

      // We don't need to update local state since the chat context will handle this
      return assistantMessage;
    } catch (error) {
      console.error('Error sending message:', error);

      // Create error message with consistent ID format
      // Use a high-precision timestamp to ensure messages are ordered correctly
      // Add a small delay to ensure this timestamp is after the user message
      const timestamp = Date.now() * 1000 + Math.floor(Math.random() * 1000) + 1000; // Add 1 second in microseconds
      const errorMessage: Message = {
        id: `msg_${timestamp}_${Math.random().toString(36).substring(2, 9)}`,
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
      };

      // Return the error message to be saved by the chat context
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
