'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

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
}

// Define chat type
interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

// Define hook props
interface UseChatStorageProps {
  chatId?: string;
  initialMessages?: Message[];
}

// Define hook return type
interface UseChatStorageReturn {
  chat: Chat | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  saveMessage: (message: Message) => Promise<void>;
  updateChat: (title: string) => Promise<void>;
  createChat: (title: string, messages: Message[]) => Promise<string>;
  loadChat: (chatId: string) => Promise<void>;
  generateTitle: (messages: Message[]) => Promise<string>;
  updateTitleBasedOnMessages: (messages: Message[]) => Promise<void>;
}

export function useChatStorage({ chatId, initialMessages = [] }: UseChatStorageProps = {}): UseChatStorageReturn {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load chat by ID
  const loadChat = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/chats/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load chat');
      }

      setChat(data.chat);
      setMessages(data.chat.messages);
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading chat');
      console.error('Load chat error:', err);
      toast({
        title: 'Failed to load chat',
        description: err.message || 'An error occurred while loading chat',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Load chat on mount if chatId is provided
  useEffect(() => {
    if (chatId) {
      loadChat(chatId);
    }
  }, [chatId, loadChat]);

  // Create a new chat
  const createChat = useCallback(async (title: string, chatMessages: Message[]): Promise<string> => {
    setIsLoading(true);
    setError(null);
    try {
      // If there are user messages, try to generate a better title
      let chatTitle = title;
      const userMessages = chatMessages.filter(msg => msg.role === 'user');

      if (userMessages.length > 0 && title === 'New Chat') {
        try {
          // Use our generateTitle function
          chatTitle = await generateTitle(chatMessages);
        } catch (titleError) {
          console.error('Error generating title:', titleError);
          // Continue with the default title if generation fails
        }
      }

      // Create the chat with the title (generated or original)
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: chatTitle, messages: chatMessages }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create chat');
      }

      setChat(data.chat);
      setMessages(chatMessages);
      return data.chat.id;
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating chat');
      console.error('Create chat error:', err);
      toast({
        title: 'Failed to create chat',
        description: err.message || 'An error occurred while creating chat',
        variant: 'destructive',
      });
      return '';
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Generate a title based on chat messages
  const generateTitle = useCallback(async (chatMessages: Message[]): Promise<string> => {
    try {
      // Only generate a title if there are user messages
      const userMessages = chatMessages.filter(msg => msg.role === 'user');
      if (userMessages.length === 0) {
        return 'New Chat';
      }

      // Call the generate-title API
      const titleResponse = await fetch('/api/chats/generate-title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: chatMessages }),
      });

      if (titleResponse.ok) {
        const titleData = await titleResponse.json();
        if (titleData.title) {
          return titleData.title;
        }
      }

      return 'New Chat';
    } catch (error) {
      console.error('Error generating title:', error);
      return 'New Chat';
    }
  }, []);

  // Update chat title if needed
  const updateTitleBasedOnMessages = useCallback(async (chatMessages: Message[]) => {
    if (!chat) return;

    // Only update title if it's still the default "New Chat"
    if (chat.title === 'New Chat') {
      // Only generate a title if we have at least 2 user messages
      const userMessages = chatMessages.filter(msg => msg.role === 'user');
      if (userMessages.length >= 2) {
        const newTitle = await generateTitle(chatMessages);
        if (newTitle !== 'New Chat') {
          await updateChat(newTitle);
        }
      }
    }
  }, [chat, generateTitle]);

  // Save message to chat
  const saveMessage = useCallback(async (message: Message) => {
    console.log('saveMessage called with:', message);
    setIsLoading(true);
    setError(null);
    try {
      // Ensure the message has the correct role
      const messageToSave = {
        ...message,
        role: message.role || (message.id.includes('user') ? 'user' : 'assistant')
      };

      console.log('Saving message with role:', messageToSave.role);

      // Add message to local state first for immediate UI update
      console.log('Current messages in storage:', messages);
      const updatedMessages = [...messages, messageToSave];
      console.log('Updated messages in storage:', updatedMessages);
      setMessages(updatedMessages);

      if (chat) {
        // If chat exists, add message to it
        const response = await fetch(`/api/chats/${chat.id}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(messageToSave),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to save message');
        }

        // Check if we should update the title based on messages
        if (message.role === 'user') {
          // Count user messages
          const userMessageCount = updatedMessages.filter(msg => msg.role === 'user').length;

          // After the 2nd user message, try to generate a better title
          if (userMessageCount === 2 && chat.title === 'New Chat') {
            await updateTitleBasedOnMessages(updatedMessages);
          }
        }
      } else {
        // If no chat exists, create a new one with this message
        await createChat('New Chat', [...initialMessages, message]);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving message');
      console.error('Save message error:', err);
      toast({
        title: 'Failed to save message',
        description: err.message || 'An error occurred while saving message',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [chat, messages, initialMessages, toast, createChat]);

  // Update chat title
  const updateChat = useCallback(async (title: string) => {
    if (!chat) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/chats/${chat.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update chat');
      }

      setChat(data.chat);
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating chat');
      console.error('Update chat error:', err);
      toast({
        title: 'Failed to update chat',
        description: err.message || 'An error occurred while updating chat',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [chat, toast]);

  return {
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
  };
}
