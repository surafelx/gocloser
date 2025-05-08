'use client';

import { useState, useCallback, useEffect } from 'react';
import { ChatHistory, ChatWithMessages } from '@/types';

// Chat cache to prevent unnecessary reloading
const chatCache: Record<string, {
  data: any,
  timestamp: number
}> = {};

// Cache expiration time (30 minutes)
const CACHE_EXPIRY = 30 * 60 * 1000;

export function useChatHistory() {
  const [chats, setChats] = useState<ChatHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [currentChat, setCurrentChat] = useState<ChatWithMessages | null>(null);

  // Load chat list
  const loadChats = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/chats');
      if (!response.ok) throw new Error('Failed to load chats');

      const data = await response.json();
      setChats(data.chats);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load a specific chat with caching
  const loadChat = useCallback(async (chatId: string) => {
    // Check if we have a valid cached version
    const cached = chatCache[chatId];
    const now = Date.now();

    if (cached && (now - cached.timestamp) < CACHE_EXPIRY) {
      console.log('Using cached chat data');
      setCurrentChat(cached.data);
      setCurrentChatId(chatId);
      return cached.data;
    }

    // No valid cache, load from API
    setIsLoading(true);

    try {
      const response = await fetch(`/api/chats/${chatId}`);
      if (!response.ok) throw new Error('Failed to load chat');

      const data = await response.json();

      // Update cache
      chatCache[chatId] = {
        data: data.chat,
        timestamp: now
      };

      setCurrentChat(data.chat);
      setCurrentChatId(chatId);
      return data.chat;
    } catch (error) {
      console.error('Error loading chat:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear expired cache entries
  useEffect(() => {
    const now = Date.now();
    Object.keys(chatCache).forEach(key => {
      if ((now - chatCache[key].timestamp) > CACHE_EXPIRY) {
        delete chatCache[key];
      }
    });
  }, [chats]); // Run when chats list changes

  return {
    chats,
    isLoading,
    loadChats,
    loadChat,
    currentChatId,
    currentChat,
    setCurrentChatId
  };
}