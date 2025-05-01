'use client';

import React, { createContext,useCallback, useContext, useState, useEffect, useRef, ReactNode } from 'react';
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
  console.log('[CHAT-CONTEXT] ChatProvider rendering');

  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  // Add ref to track changes and prevent loops
  const previousChatIdRef = useRef<string | null>(null);

  // Log when the component mounts
  useEffect(() => {
    console.log('[CHAT-CONTEXT] ChatProvider mounted');
    return () => {
      console.log('[CHAT-CONTEXT] ChatProvider unmounting');
    };
  }, []);

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

  // Create a controlled setter for currentChatId that prevents excessive changes
  // Defined after loadChat is available from the hook
  const setCurrentChatIdControlled = useCallback((chatId: string | null) => {
    console.log('[DEBUG-API-CALLS] setCurrentChatIdControlled called with:', chatId);

    // Track call stack to debug where this is being called from
    if (chatId) {
      console.log('[DEBUG-API-CALLS] Current stack trace:', new Error().stack);
    }

    // Only update if the chat ID is actually different
    if (chatId !== previousChatIdRef.current) {
      console.log('[DEBUG-API-CALLS] Setting currentChatId from', previousChatIdRef.current, 'to', chatId);

      // Update the ref first to prevent race conditions
      previousChatIdRef.current = chatId;

      // Then update the state
      setCurrentChatId(chatId);

      // If we're setting a new chat ID, load that chat
      // But only if it's not null - we don't want to load a null chat
      if (chatId) {
        console.log('[DEBUG-API-CALLS] New chatId provided, calling loadChat with:', chatId);

        // Use setTimeout to break potential circular dependencies
        // This helps prevent cascading re-renders and API calls
        setTimeout(() => {
          loadChat(chatId);
        }, 0);
      } else {
        console.log('[DEBUG-API-CALLS] No chatId provided, skipping loadChat');
      }
    } else {
      console.log('[DEBUG-API-CALLS] Skipping redundant chat ID change to', chatId);
    }
  }, [loadChat]);

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
        setCurrentChatId: setCurrentChatIdControlled, // Use our controlled setter
        currentChatId,
        generateTitle,
        updateTitleBasedOnMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

// Track how many times useChat is called
const useChatCallCount = { count: 0 };

export function useChat() {
  useChatCallCount.count++;
  console.log(`[DEBUG-API-CALLS] useChat hook called (call #${useChatCallCount.count})`);

  const context = useContext(ChatContext);
  if (context === undefined) {
    console.error('[DEBUG-API-CALLS] useChat called outside of ChatProvider');
    throw new Error('useChat must be used within a ChatProvider');
  }

  // Only log every 10th call to reduce console spam
  if (useChatCallCount.count % 10 === 0) {
    console.log(`[DEBUG-API-CALLS] useChat returning context with currentChatId: ${context.currentChatId || 'null'} (call #${useChatCallCount.count})`);
  }

  return context;
}
