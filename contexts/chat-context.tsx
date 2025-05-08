'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Message, Chat } from '@/types';

interface ChatContextType {
  chat: Chat | null;
  messages: Message[];
  isLoading: boolean;
  isSaving: boolean;
  isCreating: boolean;
  isGeneratingTitle: boolean;
  error: string | null;
  saveMessage: (message: Message) => Promise<void>;
  updateChat: (title: string) => Promise<void>;
  createChat: (title: string, messages: Message[]) => Promise<string>;
  loadChat: (chatId: string) => Promise<void>;
  setCurrentChatId: (chatId: string | null) => void;
  currentChatId: string | null;
  generateTitle: (messages: Message[]) => Promise<string>;
  updateTitleBasedOnMessages: (messages: Message[]) => Promise<void>;
  loadingId?: string | null;
  sendMessage?: (content: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children, initialMessages = [] }: { children: ReactNode, initialMessages?: Message[] }) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  // Keep track of messages in localStorage to prevent them from disappearing
  useEffect(() => {
    // Load messages from localStorage on initial render
    const savedMessages = localStorage.getItem('chatMessages');
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          setMessages(parsedMessages);
        }
      } catch (error) {
        console.error('Error parsing saved messages:', error);
      }
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      // Sort messages by timestamp before saving to ensure proper order
      const sortedMessages = [...messages].sort((a, b) => {
        // Extract timestamp from ID or use createdAt
        const getTimestamp = (msg: Message) => {
          if (msg.createdAt) {
            return new Date(msg.createdAt).getTime();
          }
          // Extract timestamp from ID formats like "user-1234567890-abc" or "msg_1234567890_abc"
          const match = msg.id.match(/[^-_]*(\d+)[^-_]*/);
          return match ? parseInt(match[1]) : 0;
        };

        return getTimestamp(a) - getTimestamp(b);
      });

      localStorage.setItem('chatMessages', JSON.stringify(sortedMessages));
    }
  }, [messages]);

  // Send message with optimistic UI updates
  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Create a user message with a more unique ID format
    const userMessage: Message = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      role: "user",
      content,
      createdAt: new Date(),
    };

    // Create a temporary loading message
    const loadingMessage: Message = {
      id: `loading-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      role: "assistant",
      content: "",
      createdAt: new Date(),
    };

    // Log the messages being added
    console.log('Adding user message:', userMessage.id, 'and loading message:', loadingMessage.id);

    // Update UI immediately with both messages
    setMessages(prev => {
      // Check if the message already exists to prevent duplicates
      const userExists = prev.some(m => m.content === content && m.role === 'user');
      if (userExists) {
        console.log('User message with same content already exists, not adding duplicate');
        return [...prev, loadingMessage];
      }
      return [...prev, userMessage, loadingMessage];
    });

    setIsLoading(true);
    setLoadingId(loadingMessage.id);

    try {
      // Send the actual API request
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const data = await response.json();

      // Replace the loading message with the real response
      setMessages(prev => prev.map(msg =>
        msg.id === loadingMessage.id
          ? { ...data.message, id: `assistant-${Date.now()}-${Math.random().toString(36).substring(2, 9)}` }
          : msg
      ));
    } catch (error) {
      console.error('Error sending message:', error);

      // Replace loading message with error message
      setMessages(prev => prev.map(msg =>
        msg.id === loadingMessage.id
          ? {
              id: `error-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              role: "assistant",
              content: "Sorry, I couldn't process your request. Please try again.",
              createdAt: new Date(),
            }
          : msg
      ));
    } finally {
      setIsLoading(false);
      setLoadingId(null);
    }
  };

  // Value object with optimized loading states
  const value: ChatContextType = {
    chat: null,
    messages,
    isLoading,
    isSaving: false,
    isCreating: false,
    isGeneratingTitle: false,
    error: null,
    saveMessage: async (message: Message) => {
      // Add message to state
      setMessages(prev => [...prev, message]);
    },
    updateChat: async () => {},
    createChat: async (title: string, initialMsgs: Message[]) => {
      // Set messages and return a dummy ID
      setMessages(initialMsgs);
      const newId = `chat-${Date.now()}`;
      setCurrentChatId(newId);
      return newId;
    },
    loadChat: async () => {},
    setCurrentChatId: (chatId: string | null) => {
      setCurrentChatId(chatId);
    },
    currentChatId,
    generateTitle: async () => "New Chat",
    updateTitleBasedOnMessages: async () => {},
    loadingId,
    sendMessage
  };

  return (
    <ChatContext.Provider value={value}>
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
