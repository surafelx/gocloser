'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useChatStorage } from '@/hooks/use-chat-storage';

// Define message type
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
  createdAt?: Date;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Define chat type
interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface ChatContextType {
  chat: Chat | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  saveMessage: (message: Message) => Promise<void>;
  updateChat: (title: string) => Promise<void>;
  createChat: (title: string, messages: Message[]) => Promise<string>;
  loadChat: (chatId: string) => Promise<void>;
  setCurrentChatId: (chatId: string | null) => void;
  currentChatId: string | null;
  generateTitle: (messages: Message[]) => Promise<string>;
  updateTitleBasedOnMessages: (messages: Message[]) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children, initialMessages = [] }: { children: ReactNode, initialMessages?: Message[] }) {
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  // Use the chat storage hook with the current chat ID
  const {
    chat,
    messages,
    isLoading,
    error,
    saveMessage,
    updateChat,
    createChat,
    loadChat,
    generateTitle,
    updateTitleBasedOnMessages,
  } = useChatStorage({
    chatId: currentChatId || undefined,
    initialMessages,
  });

  // Log when chat is loaded
  useEffect(() => {
    if (chat) {
      console.log('Chat loaded in context:', chat);
    }
  }, [chat]);

  // Log when messages change
  useEffect(() => {
    console.log('Messages in context updated:', messages);
  }, [messages]);

  return (
    <ChatContext.Provider
      value={{
        chat,
        messages,
        isLoading,
        error,
        saveMessage,
        updateChat,
        createChat,
        loadChat,
        setCurrentChatId,
        currentChatId,
        generateTitle,
        updateTitleBasedOnMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
